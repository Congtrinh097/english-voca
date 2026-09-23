import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "../api-helpers";
import { prisma } from "../prisma";
import { runAdminOperation } from "./operations";
import type { MutationAction } from "./mutations";
import { AdminError } from "./errors";
import { BODY_LIMIT } from "./import-words";
import { webmcpMode, permitsMutation } from "./mode";

export function checkMutationOrigin(req:Request) {
  const origin = req.headers.get("origin");
  const expected = process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).origin : new URL(req.url).origin;
  if ((origin && origin !== expected) || req.headers.get("sec-fetch-site") === "cross-site") {
    throw new AdminError("FORBIDDEN","Yêu cầu phải đến từ trang quản trị cùng origin.",403);
  }
}

async function readBody(req:Request):Promise<Record<string,unknown>> {
  if (!req.body) return {};
  const reader = req.body.getReader();
  const chunks:Uint8Array[] = [];
  let size=0;
  while (true) {
    const chunk = await reader.read();
    if(chunk.done) break;
    size += chunk.value.byteLength;
    if(size > BODY_LIMIT) { await reader.cancel(); throw new AdminError("VALIDATION_ERROR","Dữ liệu vượt quá 256 KiB.",413); }
    chunks.push(chunk.value);
  }
  if (!size) return {};
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new AdminError("VALIDATION_ERROR","Cần Content-Type application/json.",415);
  const bytes = new Uint8Array(size); let offset=0;
  for(const chunk of chunks) {bytes.set(chunk,offset);offset+=chunk.byteLength;}
  let body:unknown;
  try {body=JSON.parse(new TextDecoder().decode(bytes));} catch {throw new AdminError("VALIDATION_ERROR","JSON không hợp lệ.");}
  return z.record(z.unknown()).parse(body);
}

export async function handleAdminMutation(req:NextRequest,action:MutationAction,params:{topicId?:string;wordId?:string}={}) {
  let requestId = req.headers.get("idempotency-key") ?? randomUUID();
  try {
    checkMutationOrigin(req);
    const {error,session} = await requireAdmin();
    if(error) return error;
    const body = await readBody(req);
    const input:Record<string,unknown> = {...body,...params};
    const headerVersion = req.headers.get("x-expected-version");
    if(headerVersion !== null) input.expectedVersion=Number(headerVersion);
    const fromTool = req.headers.get("x-admin-webmcp") === "1";
    if (fromTool) {
      if (!permitsMutation(webmcpMode(),action,input.dryRun === true)) throw new AdminError("FORBIDDEN","Nhóm công cụ này đang tắt.",403);
      if (!["create_topic","create_word","import_words"].includes(action)) z.number().int().positive().parse(input.expectedVersion);
      if (action === "import_words" && input.dryRun !== true) z.number().int().positive().parse(input.expectedVersion);
      if (["create_topic","create_word","import_words"].includes(action) && input.dryRun !== true) z.string().uuid().parse(req.headers.get("idempotency-key"));
      if(action === "set_published") z.boolean().parse(input.isPublished);
      if(action === "import_words") input.mode="atomic";
    }
    // Legacy CSV keeps its partial-success contract; new UI/tools explicitly use atomic.
    if(action === "import_words" && input.mode === undefined) input.mode="legacy";
    requestId = z.string().uuid().parse(requestId);
    const data = await runAdminOperation(prisma,session.user.id,action,input,requestId);
    return NextResponse.json(data,{status:action.startsWith("create_") ? 201 : 200,headers:{"X-Request-Id":requestId,"Cache-Control":"no-store"}});
  } catch(error) {
    if(error instanceof z.ZodError) return NextResponse.json({error:"Dữ liệu không hợp lệ.",code:"VALIDATION_ERROR",details:error.flatten(),requestId},{status:400});
    if(error instanceof AdminError) return NextResponse.json({error:error.message,code:error.code,details:error.details,requestId},{status:error.status});
    console.error("Admin operation failed",{action,requestId,error});
    return NextResponse.json({error:"Không thể hoàn tất thao tác. Kiểm tra lại bằng cùng requestId.",code:"INTERNAL_ERROR",requestId},{status:500});
  }
}
