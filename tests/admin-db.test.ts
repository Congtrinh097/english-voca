import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { runAdminOperation } from "../lib/admin/operations";

test("PostgreSQL admin operations: retry, conflicts, atomic import, audit, permissions", {skip:!process.env.TEST_DATABASE_URL}, async () => {
  const url = process.env.TEST_DATABASE_URL!;
  if (!new URL(url).pathname.includes("webmcp_test")) throw new Error("Dedicated webmcp_test database required");
  const db = new PrismaClient({datasources:{db:{url}}});
  const actor = await db.user.create({data:{email:`${randomUUID()}@test.invalid`,name:"Test",role:"admin"}});
  const run = (action:string,input:Record<string,unknown>,requestId=randomUUID()) => runAdminOperation(db,actor.id,action,input,requestId);
  try {
    const input = {title:"Travel",titleVi:"Du lịch",level:"beginner"};
    const key = randomUUID();
    const [a,b] = await Promise.all([run("create_topic",input,key),run("create_topic",input,key)]);
    assert.deepEqual(a,b);
    const topic = a as {id:string;version:number};
    assert.equal(await db.topic.count({where:{createdBy:actor.id}}),1);
    assert.equal(await db.adminAuditLog.count({where:{actorId:actor.id}}),1);
    await assert.rejects(run("create_topic",{...input,title:"Other"},key),{code:"CONFLICT"});
    const published = await run("set_published",{topicId:topic.id,isPublished:true,expectedVersion:1}) as {version:number};
    await assert.rejects(run("update_topic",{...input,topicId:topic.id,expectedVersion:1}),{code:"CONFLICT"});
    const valid = {word:"hello",definition:"Greeting",example:"Hello!",meaningVi:"xin chào"};
    const bad = {topicId:topic.id,words:[valid,{...valid,definition:""}],mode:"atomic"};
    await assert.rejects(run("import_words",bad),{code:"VALIDATION_ERROR"});
    assert.equal(await db.word.count({where:{topicId:topic.id}}),0);
    const preview = await run("import_words",{topicId:topic.id,words:[valid],mode:"atomic",dryRun:true}) as {imported:number};
    assert.equal(preview.imported,0);
    const importKey = randomUUID();
    const batch = {topicId:topic.id,words:[valid],mode:"atomic",dryRun:false};
    await Promise.all([run("import_words",batch,importKey),run("import_words",batch,importKey)]);
    assert.equal(await db.word.count({where:{topicId:topic.id}}),1);
    const current = await db.topic.findUniqueOrThrow({where:{id:topic.id}});
    assert.ok(current.version > published.version);
    const word = await db.word.findFirstOrThrow({where:{topicId:topic.id}});
    await assert.rejects(run("delete_word",{topicId:randomUUID(),wordId:word.id,expectedVersion:word.version}),{code:"NOT_FOUND"});
    await run("delete_topic",{topicId:topic.id,expectedVersion:current.version});
    assert.equal(await db.word.count({where:{topicId:topic.id}}),0);
    assert.ok(await db.adminAuditLog.count({where:{actorId:actor.id,action:"delete_topic"}}));
    await db.user.update({where:{id:actor.id},data:{role:"learner"}});
    await assert.rejects(run("create_topic",input),{code:"FORBIDDEN"});
  } finally {
    await db.topic.deleteMany({where:{createdBy:actor.id}});
    await db.adminOperation.deleteMany({where:{actorId:actor.id}});
    await db.adminAuditLog.deleteMany({where:{actorId:actor.id}});
    await db.adminRateLimit.deleteMany({where:{key:{startsWith:actor.id}}});
    await db.user.delete({where:{id:actor.id}});
    await db.$disconnect();
  }
});
