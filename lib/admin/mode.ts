export type WebMCPMode = "off" | "read" | "write" | "all";
export function webmcpMode():WebMCPMode {
  const value=process.env.WEBMCP_MODE;
  return value === "read" || value === "write" || value === "all" ? value : "off";
}
export function permitsMutation(mode:WebMCPMode,action:string,dryRun=false) {
  if(mode === "off") return false;
  if(action === "import_words" && dryRun) return true;
  if(mode === "read") return false;
  if(mode === "write" && ["delete_topic","delete_word","set_published"].includes(action)) return false;
  return true;
}
