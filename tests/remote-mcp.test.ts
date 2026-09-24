import test from "node:test";
import assert from "node:assert/strict";
import { parseMcpRequest, McpProtocolError } from "@/lib/mcp/protocol";
import { getRemoteMcpConfig, webmcpMode } from "@/lib/admin/mode";

test("remote MCP parses valid JSON-RPC requests", () => {
  assert.deepEqual(parseMcpRequest({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }), {
    jsonrpc: "2.0", id: 1, method: "tools/list", params: {},
  });
});

test("remote MCP rejects invalid JSON-RPC envelopes", () => {
  assert.throws(() => parseMcpRequest({ jsonrpc: "1.0", method: "tools/list" }), (error: unknown) =>
    error instanceof McpProtocolError && error.code === -32600);
});

test("remote MCP config rejects wildcard origins and exposes enabled mode", () => {
  const previous = { mode: process.env.WEBMCP_MODE, token: process.env.MCP_REMOTE_TOKEN, email: process.env.MCP_REMOTE_ADMIN_EMAIL, origins: process.env.MCP_REMOTE_ALLOWED_ORIGINS };
  process.env.WEBMCP_MODE = "read";
  process.env.MCP_REMOTE_TOKEN = "x".repeat(32);
  process.env.MCP_REMOTE_ADMIN_EMAIL = "admin@example.com";
  process.env.MCP_REMOTE_ALLOWED_ORIGINS = "*,http://localhost:3000";
  try {
    assert.equal(webmcpMode(), "read");
    const config = getRemoteMcpConfig();
    assert.equal(config.enabled, true);
    assert.deepEqual(config.allowedOrigins, ["http://localhost:3000"]);
  } finally {
    for (const [key, value] of Object.entries({ WEBMCP_MODE: previous.mode, MCP_REMOTE_TOKEN: previous.token, MCP_REMOTE_ADMIN_EMAIL: previous.email, MCP_REMOTE_ALLOWED_ORIGINS: previous.origins })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
