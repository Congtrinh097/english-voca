import { Prisma } from "@prisma/client";
import { z } from "zod";
import { topicSchema, wordSchema, GLORY_BY_LEVEL } from "../validations";
import { prepareImport } from "./import-words";
import { AdminError } from "./errors";

export const mutationActions = ["create_topic","update_topic","delete_topic","set_published","create_word","update_word","delete_word","import_words"] as const;
export type MutationAction = typeof mutationActions[number];
const version = z.number().int().positive().optional();
const topicRef = z.object({topicId:z.string().uuid(),expectedVersion:version});
const wordRef = topicRef.extend({wordId:z.string().uuid()});
const schemas = {
  create_topic:topicSchema.strict(),
  update_topic:topicSchema.merge(topicRef).strict(),
  delete_topic:topicRef.strict(),
  set_published:topicRef.extend({isPublished:z.boolean().optional()}).strict(),
  create_word:wordSchema.extend({topicId:z.string().uuid()}).strict(),
  update_word:wordSchema.merge(wordRef).strict(),
  delete_word:wordRef.strict(),
  import_words:topicRef.extend({csv:z.string().optional(),words:z.array(z.unknown()).max(200).optional(),dryRun:z.boolean().optional(),mode:z.enum(["atomic","legacy"]).optional()}).strict(),
};
export function validateMutation(action:string, input:unknown) {
  if (!(mutationActions as readonly string[]).includes(action)) throw new AdminError("VALIDATION_ERROR","Thao tác không hợp lệ.");
  return schemas[action as MutationAction].parse(input);
}

export type MutationResult = {data:unknown;entityId:string;before?:unknown;after?:unknown;dryRun?:boolean};
function checkVersion(actual:number, expected:unknown) {
  if (expected !== undefined && actual !== expected) throw new AdminError("CONFLICT","Dữ liệu đã thay đổi. Đọc lại bản mới trước khi tiếp tục.",409);
}

export async function mutateAdmin(tx:Prisma.TransactionClient, actorId:string, action:MutationAction, raw:unknown):Promise<MutationResult> {
  // Validation also runs here so callers of the service cannot bypass it.
  const input = validateMutation(action,raw);
  if (action === "create_topic") {
    const {thumbnailUrl,...data} = topicSchema.parse(input);
    const topic = await tx.topic.create({data:{...data,thumbnailUrl:thumbnailUrl || null,gloryReward:GLORY_BY_LEVEL[data.level],createdBy:actorId}});
    return {data:topic,entityId:topic.id,after:topic};
  }
  const ref = topicRef.parse(input);
  // Serialize writes for a topic across admins, including word imports/deletes.
  await tx.$queryRaw`SELECT id FROM topics WHERE id = ${ref.topicId}::uuid FOR UPDATE`;
  const topic = await tx.topic.findUnique({where:{id:ref.topicId}});
  if (!topic) throw new AdminError("NOT_FOUND","Không tìm thấy chủ đề.",404);
  if (action === "update_topic" || action === "delete_topic" || action === "set_published" || action === "import_words") checkVersion(topic.version, ref.expectedVersion);
  if (action === "update_topic") {
    const {thumbnailUrl,...data} = topicSchema.parse(input);
    const updated = await tx.topic.update({where:{id:topic.id},data:{...data,thumbnailUrl:thumbnailUrl || null,gloryReward:GLORY_BY_LEVEL[data.level],version:{increment:1}}});
    return {data:updated,entityId:topic.id,before:topic,after:updated};
  }
  if (action === "set_published") {
    const parsed = schemas.set_published.parse(input);
    // Compatibility for old UI clients only. WebMCP always supplies the target.
    const desired = parsed.isPublished ?? !topic.isPublished;
    const updated = desired === topic.isPublished ? topic : await tx.topic.update({where:{id:topic.id},data:{isPublished:desired,version:{increment:1}}});
    return {data:updated,entityId:topic.id,before:topic,after:updated};
  }
  if (action === "delete_topic") {
    const counts = await tx.topic.findUniqueOrThrow({where:{id:topic.id},select:{_count:{select:{words:true,userTopics:true,quizResults:true}}}});
    await tx.topic.delete({where:{id:topic.id}});
    return {data:{ok:true,deleted:counts._count},entityId:topic.id,before:{...topic,affected:counts._count}};
  }
  if (action === "import_words") {
    const parsed = schemas.import_words.parse(input);
    const existing = await tx.word.findMany({where:{topicId:topic.id},select:{word:true}});
    const prepared = prepareImport(parsed,existing.map(w=>w.word));
    const report = {imported:0,valid:prepared.words.length,total:prepared.total,errors:prepared.errors,warnings:prepared.warnings,version:topic.version};
    if (parsed.dryRun) return {data:report,entityId:topic.id,dryRun:true};
    if (parsed.mode !== "legacy" && prepared.errors.length) throw new AdminError("VALIDATION_ERROR","Import chưa được ghi vì có dòng lỗi.",400,report);
    const max = await tx.word.aggregate({where:{topicId:topic.id},_max:{orderIndex:true}});
    if (prepared.words.length) {
      await tx.word.createMany({data:prepared.words.map(({audioUrl,orderIndex,...word},i)=>({...word,audioUrl:audioUrl||null,topicId:topic.id,orderIndex:(max._max.orderIndex ?? -1)+1+i}))});
      await tx.topic.update({where:{id:topic.id},data:{version:{increment:1}}});
    }
    const result = {...report,imported:prepared.words.length,version:topic.version+(prepared.words.length ? 1 : 0)};
    return {data:result,entityId:topic.id,before:{wordCount:existing.length},after:result};
  }
  if (action === "create_word") {
    const {audioUrl,orderIndex,...data} = wordSchema.parse(input);
    const max = await tx.word.aggregate({where:{topicId:topic.id},_max:{orderIndex:true}});
    const word = await tx.word.create({data:{...data,audioUrl:audioUrl||null,orderIndex:orderIndex ?? (max._max.orderIndex ?? -1)+1,topicId:topic.id}});
    await tx.topic.update({where:{id:topic.id},data:{version:{increment:1}}});
    return {data:word,entityId:word.id,after:word};
  }
  const {wordId,expectedVersion} = wordRef.parse(input);
  const word = await tx.word.findFirst({where:{id:wordId,topicId:topic.id}});
  if (!word) throw new AdminError("NOT_FOUND","Không tìm thấy từ trong chủ đề.",404);
  checkVersion(word.version,expectedVersion);
  if (action === "delete_word") {
    await tx.word.delete({where:{id:word.id}});
    await tx.topic.update({where:{id:topic.id},data:{version:{increment:1}}});
    return {data:{ok:true},entityId:word.id,before:word};
  }
  const {audioUrl,...data} = wordSchema.parse(input);
  const updated = await tx.word.update({where:{id:word.id},data:{...data,audioUrl:audioUrl||null,version:{increment:1}}});
  await tx.topic.update({where:{id:topic.id},data:{version:{increment:1}}});
  return {data:updated,entityId:word.id,before:word,after:updated};
}
