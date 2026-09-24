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

export type RemoteMcpConfig = {
  enabled: boolean;
  token: string;
  adminEmail: string;
  allowedOrigins: string[];
};

/** Read remote-agent configuration on demand so tests and runtime env changes are respected. */
export function getRemoteMcpConfig(): RemoteMcpConfig {
  const token = process.env.MCP_REMOTE_TOKEN?.trim() ?? "";
  const adminEmail = process.env.MCP_REMOTE_ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  const allowedOrigins = (process.env.MCP_REMOTE_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  // A wildcard would make a bearer-token endpoint vulnerable to cross-origin use.
  const safeOrigins = allowedOrigins.filter((origin) => origin !== "*");
  return {
    enabled: webmcpMode() !== "off" && token.length >= 32 && adminEmail.length > 0,
    token,
    adminEmail,
    allowedOrigins: safeOrigins,
  };
}
