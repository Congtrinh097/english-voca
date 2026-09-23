import assert from "node:assert/strict";
import { test } from "node:test";
import { createAdminTools } from "../lib/webmcp/admin-tools";
import { registerAdminTools } from "../lib/webmcp/lifecycle";

test("catalog covers all 12 actions and invalid input never reaches fetch", async () => {
  let calls = 0;
  const tools = createAdminTools({fetch:async () => {calls++; return Response.json({});}});
  assert.equal(tools.length, 12);
  const result = await tools.find(t => t.name === "admin_get_topic")!.execute({topicId:"../auth"});
  assert.equal(result.ok, false);
  assert.equal(calls,0);
});
test("browser dependency may provide a bound fetch function", async () => {
  const receiver = { called: false };
  const browserLikeFetch = async function(this: typeof receiver, url: RequestInfo | URL) {
    assert.equal(this, receiver);
    this.called = true;
    return Response.json(String(url).includes("capabilities") ? {role:"admin",mode:"all"} : {items:[],total:0,page:1,hasMore:false});
  };
  const tools = createAdminTools({fetch:browserLikeFetch.bind(receiver) as typeof fetch});
  const result = await tools.find(t=>t.name === "admin_list_topics")!.execute({page:1});
  assert.equal(result.ok,true);
  assert.equal(receiver.called,true);
});
test("read mode exposes import preview as read-only and excludes mutations", () => {
  const tools = createAdminTools({fetch:async()=>Response.json({})},"read");
  const preview = tools.find(t=>t.name === "admin_import_words");
  assert.ok(preview);
  assert.equal(preview.annotations.readOnlyHint,true);
  assert.equal(tools.some(t=>t.name === "admin_create_topic"),false);
});
test("import commit requires the version returned by preview", async () => {
  let calls=0;
  const tool=createAdminTools({fetch:async()=>{calls++;return Response.json({});}}).find(t=>t.name === "admin_import_words")!;
  const base={topicId:"123e4567-e89b-42d3-a456-426614174000",words:[{word:"hello",definition:"Greeting",example:"Hello",meaningVi:"xin chào"}],requestId:"123e4567-e89b-42d3-a456-426614174001"};
  const result=await tool.execute({...base,dryRun:false});
  assert.equal(result.ok,false);
  if(!result.ok) assert.equal(result.error.code,"VALIDATION_ERROR");
  assert.equal(calls,0);
});
test("publish sends an explicit target and version, never a toggle", async () => {
  const requests: {url:string; body:unknown}[] = [];
  const tools = createAdminTools({fetch:async (url, init) => {
    requests.push({url:String(url),body:init?.body ? JSON.parse(String(init.body)) : null});
    return Response.json(String(url).includes("capabilities") ? {role:"admin",mode:"all"} : {isPublished:true,version:3});
  }});
  const result = await tools.find(t=>t.name === "admin_set_topic_published")!.execute({
    topicId:"123e4567-e89b-42d3-a456-426614174000",isPublished:true,expectedVersion:2,
  });
  assert.equal(result.ok,true);
  assert.deepEqual(requests.at(-1)?.body,{isPublished:true,expectedVersion:2});
});
test("uncertain write returns requestId and does not automatically retry", async () => {
  let writes=0;
  const tools = createAdminTools({fetch:async (url) => {
    if (String(url).includes("capabilities")) return Response.json({role:"admin",mode:"all"});
    writes++; throw new TypeError("offline");
  }});
  const result = await tools.find(t=>t.name === "admin_create_topic")!.execute({
    title:"Travel",titleVi:"Du lịch",level:"beginner",requestId:"123e4567-e89b-42d3-a456-426614174000",
  });
  assert.equal(result.ok,false);
  if (!result.ok) assert.equal(result.error.code,"OUTCOME_UNKNOWN");
  assert.equal(result.requestId,"123e4567-e89b-42d3-a456-426614174000");
  assert.equal(writes,1);
});
test("registration abort removes tools and never leaves late registrations behind", async () => {
  const active = new Set<string>();
  const controller = new AbortController();
  const pending = registerAdminTools({registerTool:async (tool, options) => {
    await new Promise(resolve=>setTimeout(resolve,2));
    if(options.signal.aborted) return;
    active.add(tool.name);
    options.signal.addEventListener("abort",()=>active.delete(tool.name),{once:true});
  }},createAdminTools({fetch:async()=>Response.json({})}),controller.signal);
  controller.abort();
  await pending;
  assert.equal(active.size,0);
});
