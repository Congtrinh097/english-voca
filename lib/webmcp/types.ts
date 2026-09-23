export type ToolResult = {ok:true;data:unknown;requestId?:string} | {ok:false;error:{code:string;message:string;details?:unknown;retryable:boolean};requestId?:string};
export type Tool = {
  name:string;
  description:string;
  inputSchema:Record<string,unknown>;
  annotations:{readOnlyHint:boolean;consequentialHint:boolean;untrustedContentHint:boolean};
  execute:(input:unknown,context?:{signal?:AbortSignal})=>Promise<ToolResult>;
};
export type ModelContext = {registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>};
export type ToolDependencies = {
  fetch:typeof fetch;
  confirmDeletion?:(message:string,signal?:AbortSignal)=>Promise<boolean>;
  onChanged?:(topicId?:string)=>void;
  onResult?:(name:string,result:ToolResult)=>void;
  onUnauthorized?:()=>void;
};
