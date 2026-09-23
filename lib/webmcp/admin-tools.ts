import { z } from "zod";
import { topicSchema,wordSchema } from "../validations";
import { permitsMutation,type WebMCPMode } from "../admin/mode";
import type { Tool,ToolDependencies,ToolResult } from "./types";

const uuid = z.string().uuid();
const version = z.number().int().positive();
const topicRef = z.object({topicId:uuid});
const editTopic = topicRef.extend({expectedVersion:version,requestId:uuid.optional()});
const editWord = editTopic.extend({wordId:uuid});
const uuidField={type:"string",format:"uuid"};
const versionField={type:"integer",minimum:1,description:"Version returned by the latest read. On conflict read again; do not overwrite blindly."};
const nullableString=(maxLength:number)=>({type:["string","null"],maxLength});
const topicFields = {title:{type:"string",minLength:1,maxLength:200},titleVi:{type:"string",minLength:1,maxLength:200},level:{type:"string",enum:["beginner","middle","master"]},description:nullableString(10000),thumbnailUrl:{type:["string","null"]}};
const wordFields = {word:{type:"string",minLength:1,maxLength:100},definition:{type:"string",minLength:1,maxLength:10000},example:{type:"string",minLength:1,maxLength:10000},meaningVi:{type:"string",minLength:1,maxLength:10000},pronunciation:nullableString(200),partOfSpeech:nullableString(50),audioUrl:{type:["string","null"]},orderIndex:{type:"integer",minimum:0}};
const requestField={...uuidField,description:"UUID for this logical operation. Reuse it with identical input after timeout; use a new UUID for new work."};
const topicRequired=["title","titleVi","level"];
const wordRequired=["word","definition","example","meaningVi"];
type Definition={name:string;description:string;schema:z.ZodTypeAny;properties:Record<string,unknown>;required:string[];method:string;action?:string;path:(p:Record<string,unknown>)=>string;remove?:boolean};
const topicPath=(p:Record<string,unknown>)=>`/api/topics/${p.topicId}`;
const wordPath=(p:Record<string,unknown>)=>`${topicPath(p)}/words/${p.wordId}`;
const definitions:Definition[]=[
  {name:"admin_list_topics",description:"List all admin topics, including drafts. Search title/titleVi; follow hasMore/page to see every result.",schema:z.object({level:z.enum(["beginner","middle","master"]).optional(),search:z.string().max(200).optional(),page:z.number().int().min(1).max(100000).optional()}).strict(),properties:{level:topicFields.level,search:{type:"string",maxLength:200},page:{type:"integer",minimum:1,maximum:100000}},required:[],method:"GET",path:p=>`/api/topics?${new URLSearchParams({all:"1",page:String(p.page??1),...(p.level?{level:String(p.level)}:{}),...(p.search?{search:String(p.search)}:{})})}`},
  {name:"admin_get_topic",description:"Read topic metadata, version and deletion impact. Read before updating, publishing or deleting.",schema:topicRef.strict(),properties:{topicId:uuidField},required:["topicId"],method:"GET",path:topicPath},
  {name:"admin_suggest_topics",description:"Get three learning suggestions personalized to the signed-in admin's learning history. Not editorial recommendations.",schema:z.object({}).strict(),properties:{},required:[],method:"GET",path:()=>"/api/topics/suggested"},
  {name:"admin_create_topic",description:"Create a draft topic. Glory reward is assigned by level. Reuse requestId for an identical retry.",schema:topicSchema.extend({requestId:uuid}).strict(),properties:{...topicFields,requestId:requestField},required:[...topicRequired,"requestId"],method:"POST",action:"create_topic",path:()=>"/api/topics"},
  {name:"admin_update_topic",description:"Replace topic fields using the latest version. Supply all required fields and preserve optional values you want to keep.",schema:topicSchema.merge(editTopic).strict(),properties:{...topicFields,topicId:uuidField,expectedVersion:versionField,requestId:requestField},required:[...topicRequired,"topicId","expectedVersion"],method:"PUT",action:"update_topic",path:topicPath},
  {name:"admin_delete_topic",description:"Delete a topic and its words, learner progress and quiz results. Shows an impact confirmation in the admin page before deleting.",schema:editTopic.strict(),properties:{topicId:uuidField,expectedVersion:versionField,requestId:requestField},required:["topicId","expectedVersion"],method:"DELETE",action:"delete_topic",remove:true,path:topicPath},
  {name:"admin_set_topic_published",description:"Set an explicit published state. Read latest version first. Repeating a target never toggles it to the opposite state.",schema:editTopic.extend({isPublished:z.boolean()}).strict(),properties:{topicId:uuidField,expectedVersion:versionField,isPublished:{type:"boolean"},requestId:requestField},required:["topicId","expectedVersion","isPublished"],method:"PATCH",action:"set_published",path:p=>`${topicPath(p)}/publish`},
  {name:"admin_list_words",description:"List words and their versions in a topic. Follow hasMore/page to retrieve all words.",schema:topicRef.extend({page:z.number().int().min(1).max(100000).optional(),pageSize:z.number().int().min(1).max(100).optional()}).strict(),properties:{topicId:uuidField,page:{type:"integer",minimum:1,maximum:100000},pageSize:{type:"integer",minimum:1,maximum:100}},required:["topicId"],method:"GET",path:p=>`${topicPath(p)}/words?page=${p.page??1}&pageSize=${p.pageSize??50}`},
  {name:"admin_create_word",description:"Add a word to a topic with definition, example and Vietnamese meaning. Reuse requestId for an identical retry.",schema:wordSchema.extend({topicId:uuid,requestId:uuid}).strict(),properties:{...wordFields,topicId:uuidField,requestId:requestField},required:[...wordRequired,"topicId","requestId"],method:"POST",action:"create_word",path:p=>`${topicPath(p)}/words`},
  {name:"admin_update_word",description:"Update a word belonging to this topic using the word's latest version. Supply complete required fields.",schema:wordSchema.merge(editWord).strict(),properties:{...wordFields,topicId:uuidField,wordId:uuidField,expectedVersion:versionField,requestId:requestField},required:[...wordRequired,"topicId","wordId","expectedVersion"],method:"PUT",action:"update_word",path:wordPath},
  {name:"admin_delete_word",description:"Delete one word from the specified topic after confirmation in the admin page. Requires the word's current version.",schema:editWord.strict(),properties:{topicId:uuidField,wordId:uuidField,expectedVersion:versionField,requestId:requestField},required:["topicId","wordId","expectedVersion"],method:"DELETE",action:"delete_word",remove:true,path:wordPath},
  {name:"admin_import_words",description:"Preview or atomically import 1–200 words (max 256 KiB) from csv OR words. Start with dryRun:true; then commit using the version returned by preview. On errors nothing is written.",schema:topicRef.extend({csv:z.string().max(262144).optional(),words:z.array(wordSchema.strict()).min(1).max(200).optional(),dryRun:z.boolean(),requestId:uuid,expectedVersion:version.optional()}).strict().refine(p=>(p.csv!==undefined)!==(p.words!==undefined),"Supply csv OR words").refine(p=>p.dryRun || p.expectedVersion!==undefined,"expectedVersion is required when dryRun is false"),properties:{topicId:uuidField,csv:{type:"string",maxLength:262144},words:{type:"array",minItems:1,maxItems:200,items:{type:"object",properties:wordFields,required:wordRequired,additionalProperties:false}},dryRun:{type:"boolean"},requestId:requestField,expectedVersion:versionField},required:["topicId","dryRun","requestId"],method:"POST",action:"import_words",path:p=>`${topicPath(p)}/words/bulk`},
];

const fail=(code:string,message:string,requestId?:string,details?:unknown):ToolResult=>({ok:false,error:{code,message,details,retryable:["RATE_LIMITED","OUTCOME_UNKNOWN","NETWORK_ERROR"].includes(code)},...(requestId?{requestId}:{})});
export function createAdminTools(deps:ToolDependencies,mode:WebMCPMode="all"):Tool[] {
  if(mode === "off") return [];
  return definitions.filter(d=>!d.action || permitsMutation(mode,d.action,d.action === "import_words")).map(d=>({
    name:d.name,description:d.description,
    inputSchema:{type:"object",properties:{...d.properties,...(mode === "read" && d.action === "import_words" ? {dryRun:{const:true,type:"boolean"}} : {})},required:d.required,additionalProperties:false,...(d.action === "import_words" ? {allOf:[{if:{properties:{dryRun:{const:false}}},then:{required:["expectedVersion"]}}]} : {})},
    annotations:{readOnlyHint:!d.action || (mode === "read" && d.action === "import_words"),consequentialHint:!!d.remove || d.action === "set_published",untrustedContentHint:true},
    execute:async(raw,context)=>{
      const parsed=d.schema.safeParse(raw);
      if(!parsed.success) return fail("VALIDATION_ERROR","Input không hợp lệ.",undefined,parsed.error.flatten());
      const p=parsed.data as Record<string,unknown>;
      const writing=!!d.action && p.dryRun !== true;
      const requestId=d.action ? String(p.requestId ?? crypto.randomUUID()) : undefined;
      if(context?.signal?.aborted) return fail("USER_CANCELLED","Đã hủy trước khi thực hiện.",requestId);
      const controller=new AbortController();
      const cancel=()=>controller.abort();
      context?.signal?.addEventListener("abort",cancel,{once:true});
      let sent=false;
      let timeout:ReturnType<typeof setTimeout>|undefined;
      const headers:Record<string,string>={"Content-Type":"application/json","X-Admin-WebMCP":"1"};
      if(requestId) headers["Idempotency-Key"]=requestId;
      const finish=(result:ToolResult)=>{deps.onResult?.(d.name,result);return result;};
      const request=async(url:string,init?:RequestInit)=>{
        const response=await deps.fetch(url,{...init,credentials:"same-origin",cache:"no-store",signal:controller.signal});
        const data=await response.json();
        if(!response.ok) {
          if(response.status===401 || response.status===403) deps.onUnauthorized?.();
          throw {code:data.code ?? ({401:"UNAUTHENTICATED",403:"FORBIDDEN",404:"NOT_FOUND",409:"CONFLICT",429:"RATE_LIMITED"} as Record<number,string>)[response.status] ?? "INTERNAL_ERROR",message:typeof data.error === "string" ? data.error : "Không thể thực hiện thao tác.",details:data.details};
        }
        return data;
      };
      try {
        timeout=setTimeout(cancel,30000);
        const capability=await request("/api/admin/webmcp/capabilities");
        if(capability.role!=="admin" || capability.mode==="off" || (d.action && !permitsMutation(capability.mode,d.action,p.dryRun===true))) return finish(fail("FORBIDDEN","Công cụ hiện không được phép sử dụng.",requestId));
        if(d.remove) {
          const topic=await request(topicPath(p));
          let message:string;
          if(d.action==="delete_topic") {
            if(topic.version!==p.expectedVersion) return finish(fail("CONFLICT","Chủ đề đã thay đổi. Đọc lại trước khi xóa.",requestId));
            const counts=topic.deletionImpact;
            message=`Xóa chủ đề “${topic.title}”? Sẽ xóa ${counts.words} từ, ${counts.userTopics} tiến độ học và ${counts.quizResults} kết quả quiz.`;
          } else {
            const list=await request(`${topicPath(p)}/words`);
            const word=list.items.find((w:{id:string})=>w.id===p.wordId);
            if(!word) return finish(fail("NOT_FOUND","Không tìm thấy từ trong chủ đề.",requestId));
            if(word.version!==p.expectedVersion) return finish(fail("CONFLICT","Từ đã thay đổi. Đọc lại trước khi xóa.",requestId));
            message=`Xóa từ “${word.word}” (${word.meaningVi}) trong chủ đề “${topic.title}”?`;
          }
          clearTimeout(timeout); timeout=undefined;
          if(!deps.confirmDeletion || !await deps.confirmDeletion(message,controller.signal)) return finish(fail("USER_CANCELLED","Đã hủy xóa.",requestId));
          timeout=setTimeout(cancel,30000);
        }
        if(controller.signal.aborted) return finish(fail("USER_CANCELLED","Đã hủy trước khi thực hiện.",requestId));
        const {topicId,wordId,requestId:ignored,...body}=p;
        if(d.method==="DELETE") headers["X-Expected-Version"]=String(p.expectedVersion);
        sent=true;
        const data=await request(d.path(p),{method:d.method,headers,...(d.method!=="GET" && d.method!=="DELETE" ? {body:JSON.stringify(body)} : {})});
        if(writing) deps.onChanged?.(typeof topicId === "string" ? topicId : data.id);
        return finish({ok:true,data,...(requestId?{requestId}:{})});
      } catch(error) {
        const e=error as {code?:string;message?:string;details?:unknown};
        if(e.code) return finish(fail(e.code,e.message??"Thao tác thất bại.",requestId,e.details));
        if(writing && sent) {
          deps.onChanged?.(typeof p.topicId === "string" ? p.topicId : undefined);
          return finish(fail("OUTCOME_UNKNOWN","Chưa xác định kết quả. Đọc lại dữ liệu hoặc gửi lại cùng requestId và input; không tạo requestId mới.",requestId));
        }
        return finish(fail(controller.signal.aborted?"USER_CANCELLED":"NETWORK_ERROR","Không nhận được phản hồi; chưa xác nhận thành công.",requestId));
      } finally {
        if(timeout) clearTimeout(timeout);
        context?.signal?.removeEventListener("abort",cancel);
      }
    },
  }));
}
