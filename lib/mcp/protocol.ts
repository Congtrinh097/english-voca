import { NextResponse } from "next/server";
import { createAdminTools } from "@/lib/webmcp/admin-tools";
import { webmcpMode } from "@/lib/admin/mode";
import { authenticateRemoteMcp, isAllowedRemoteOrigin } from "@/lib/mcp/remote-auth";
import { getRemoteMcpConfig } from "@/lib/admin/mode";

export type McpRequest = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: unknown };

export class McpProtocolError extends Error {
  constructor(public code: number, message: string, public data?: unknown) { super(message); }
}

export function parseMcpRequest(input: unknown): McpRequest {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new McpProtocolError(-32600, "Invalid Request");
  const value = input as Record<string, unknown>;
  if (value.jsonrpc !== "2.0" || typeof value.method !== "string" || !value.method ||
      (value.id !== undefined && value.id !== null && typeof value.id !== "string" && typeof value.id !== "number")) {
    throw new McpProtocolError(-32600, "Invalid Request");
  }
  return { jsonrpc: "2.0", id: value.id as McpRequest["id"], method: value.method, params: value.params };
}

const errorBody = (id: McpRequest["id"], code: number, message: string, data?: unknown) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message, ...(data === undefined ? {} : { data }) } });
const okBody = (id: McpRequest["id"], result: unknown) => ({ jsonrpc: "2.0", id: id ?? null, result });

function paramsRecord(params: unknown): Record<string, unknown> {
  if (params === undefined) return {};
  if (!params || typeof params !== "object" || Array.isArray(params)) throw new McpProtocolError(-32602, "Invalid method params");
  return params as Record<string, unknown>;
}

export async function handleMcpRequest(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");
  const config = getRemoteMcpConfig();
  const cors: Record<string, string> = origin && isAllowedRemoteOrigin(origin) ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" } : {};
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return NextResponse.json(errorBody(null, -32600, "Invalid Request"), { status: 405, headers: cors });
  if (!config.enabled) return NextResponse.json(errorBody(null, -32001, "Remote MCP is disabled"), { status: 403, headers: cors });
  if (!isAllowedRemoteOrigin(origin)) return NextResponse.json(errorBody(null, -32003, "Origin is not allowed"), { status: 403, headers: cors });
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return NextResponse.json(errorBody(null, -32600, "Content-Type must be application/json"), { status: 415, headers: cors });
  let input: unknown;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > 256 * 1024) throw new McpProtocolError(-32600, "Request body too large");
    input = JSON.parse(text);
  } catch (error) {
    const e = error instanceof McpProtocolError ? error : new McpProtocolError(-32700, "Parse error");
    return NextResponse.json(errorBody(null, e.code, e.message), { status: 400, headers: cors });
  }
  let parsed: McpRequest;
  try { parsed = parseMcpRequest(input); } catch (error) { const e = error as McpProtocolError; return NextResponse.json(errorBody(null, e.code ?? -32600, e.message ?? "Invalid Request"), { status: 400, headers: cors }); }
  const auth = await authenticateRemoteMcp(request);
  if (!("userId" in auth)) return NextResponse.json(errorBody(parsed.id, -32001, auth.message ?? "Unauthorized", auth.code), { status: auth.status ?? 401, headers: cors });
  try {
    if (parsed.method === "notifications/initialized") return new Response(null, { status: 204, headers: cors });
    if (parsed.method === "initialize") return NextResponse.json(okBody(parsed.id, { protocolVersion: "2025-06-18", capabilities: { tools: { listChanged: false } }, serverInfo: { name: "english-voca-admin", version: "1.0.0" } }), { headers: cors });
    const baseUrl = new URL(request.url).origin;
    const remoteFetch: typeof fetch = (input, init = {}) => {
      const target = typeof input === "string" && input.startsWith("/") ? `${baseUrl}${input}` : input;
      const headers = new Headers(init.headers);
      headers.set("X-Remote-MCP-Token", config.token);
      headers.set("X-Remote-MCP-User-Id", auth.userId);
      return fetch(target, { ...init, headers });
    };
    const tools = createAdminTools({ fetch: remoteFetch, confirmDeletion: async () => true }, webmcpMode());
    if (parsed.method === "tools/list") return NextResponse.json(okBody(parsed.id, { tools: tools.map(tool => ({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema, annotations: tool.annotations })) }), { headers: cors });
    if (parsed.method === "tools/call") {
      const params = paramsRecord(parsed.params);
      if (typeof params.name !== "string") throw new McpProtocolError(-32602, "Invalid method params");
      const tool = tools.find(item => item.name === params.name);
      if (!tool) throw new McpProtocolError(-32601, "Method not found");
      const result = await tool.execute(params.arguments ?? {});
      return NextResponse.json(okBody(parsed.id, { content: [{ type: "text", text: JSON.stringify(result) }], isError: !result.ok }), { headers: cors });
    }
    throw new McpProtocolError(-32601, "Method not found");
  } catch (error) {
    const e = error instanceof McpProtocolError ? error : new McpProtocolError(-32603, "Internal error");
    return NextResponse.json(errorBody(parsed.id, e.code, e.message, e.data), { status: 200, headers: cors });
  }
}
