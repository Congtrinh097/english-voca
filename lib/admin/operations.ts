import { createHash } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import { AdminError } from "./errors";
import { mutateAdmin, validateMutation, type MutationAction } from "./mutations";

const json = (data:unknown):Prisma.InputJsonValue => JSON.parse(JSON.stringify(data));
function canonical(value:unknown):string {
  if(Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if(value && typeof value === "object") return `{${Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  return JSON.stringify(value);
}

export async function runAdminOperation(db:PrismaClient,actorId:string,action:string,raw:unknown,requestId:string) {
  z.string().uuid().parse(requestId);
  const input = validateMutation(action,raw);
  const inputHash = createHash("sha256").update(canonical(input)).digest("hex");
  return db.$transaction(async tx => {
    // Bound one actor's concurrent writes, even across Cloud Run instances.
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${actorId}::uuid FOR UPDATE`;
    const actor = await tx.user.findUnique({where:{id:actorId},select:{role:true}});
    if (!actor || actor.role !== "admin") throw new AdminError("FORBIDDEN","Không có quyền quản trị.",403);
    await tx.adminOperation.deleteMany({where:{createdAt:{lt:new Date(Date.now()-7*24*60*60*1000)}}});
    await tx.adminRateLimit.deleteMany({where:{resetAt:{lt:new Date(Date.now()-24*60*60*1000)}}});
    const key = {actorId,action,requestId};
    const previous = await tx.adminOperation.findUnique({where:{actorId_action_requestId:key}});
    if (previous) {
      if (previous.inputHash !== inputHash) throw new AdminError("CONFLICT","requestId đã được dùng cho dữ liệu khác.",409);
      return previous.result;
    }
    const dryRun = "dryRun" in input && input.dryRun === true;
    const now = new Date();
    // Count even preview requests, but leave dry runs out of the mutation audit.
    for (const [scope,limit] of [["write",60],...(action === "import_words" ? [["import",5] as const] : [])] as const) {
      const rateKey = `${actorId}:${scope}`;
      const bucket = await tx.adminRateLimit.findUnique({where:{key:rateKey}});
      if (bucket && bucket.resetAt > now && bucket.count >= limit) throw new AdminError("RATE_LIMITED","Thao tác quá nhanh. Thử lại sau một phút.",429);
      await tx.adminRateLimit.upsert({where:{key:rateKey},create:{key:rateKey,count:1,resetAt:new Date(now.getTime()+60000)},update:!bucket || bucket.resetAt <= now ? {count:1,resetAt:new Date(now.getTime()+60000)} : {count:{increment:1}}});
    }
    const result = await mutateAdmin(tx,actorId,action as MutationAction,input);
    const data = json(result.data);
    if (!dryRun) {
      await tx.adminAuditLog.create({data:{...key,entityId:result.entityId,before:result.before === undefined ? Prisma.DbNull : json(result.before),after:result.after === undefined ? Prisma.DbNull : json(result.after)}});
      await tx.adminOperation.create({data:{...key,inputHash,result:data}});
    }
    return data;
  },{maxWait:10000,timeout:20000});
}
