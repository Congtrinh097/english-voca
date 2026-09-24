# Remote MCP Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the existing admin WebMCP tools through an authenticated HTTP MCP endpoint so a local Agent can list and call them at `/api/mcp`.

**Architecture:** Add a thin JSON-RPC MCP adapter in the Next.js route layer. It authenticates a bearer token bound to a configured admin user, creates the existing admin tool dependencies, and delegates tool discovery and execution to the current `lib/webmcp/admin-tools.ts` definitions. The route applies mode, origin, body-size, and protocol guards before delegation.

**Tech Stack:** Next.js App Router route handlers, TypeScript, Zod, Prisma, Node crypto timing-safe comparison, existing WebMCP tool types, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-24-remote-mcp-design.md`

## Global Constraints

- Remote MCP is unavailable when `WEBMCP_MODE=off`.
- `MCP_REMOTE_TOKEN` must be at least 32 characters and must never be logged or returned.
- `MCP_REMOTE_ADMIN_EMAIL` binds the token to one database admin actor.
- `MCP_REMOTE_ALLOWED_ORIGINS` controls CORS; wildcard is forbidden when a token is configured.
- The adapter must reuse existing WebMCP tools and mutation safeguards.
- JSON request body is limited to 256 KiB.

## Review Focus

- A request with a valid token for a non-admin actor is rejected before any tool executes.
- A malformed JSON-RPC request returns a protocol error without throwing a Next.js 500.
- `tools/list` reflects read/write mode filtering exactly as browser WebMCP.
- A repeated mutation request ID remains idempotent through the existing operation store.
- A stale version and a delete without explicit confirmation never mutate data.

---

### Task 1: Add remote MCP configuration and authentication boundary

**Files:**
- Create: `lib/mcp/remote-auth.ts`
- Modify: `lib/admin/mode.ts`
- Modify: `.env.example`
- Test: `tests/remote-mcp.test.ts`

**Interfaces:**
- `getRemoteMcpConfig(): { enabled: boolean; token: string; adminEmail: string; allowedOrigins: string[] }`
- `authenticateRemoteMcp(request: Request): Promise<{ userId: string } | RemoteAuthError>`
- `isAllowedRemoteOrigin(origin: string | null): boolean`

- [ ] **Step 1: Write failing tests** for missing mode, missing/short token, missing admin email, malformed bearer header, constant-time token mismatch, non-admin actor, and allowed/disallowed origins.
- [ ] **Step 2: Run `npx tsx --test tests/remote-mcp.test.ts` and verify the new tests fail because the auth module is absent.**
- [ ] **Step 3: Implement configuration parsing and token authentication.** Read environment variables without logging secrets, compare token bytes with `crypto.timingSafeEqual`, look up the configured user with Prisma, require `role === "admin"`, and return stable HTTP-facing error codes.
- [ ] **Step 4: Add `.env.example` entries and mode helper behavior.** Include `MCP_REMOTE_TOKEN`, `MCP_REMOTE_ADMIN_EMAIL`, and `MCP_REMOTE_ALLOWED_ORIGINS`; reject remote access when mode is `off`.
- [ ] **Step 5: Run the focused auth tests and typecheck.**

### Task 2: Implement MCP JSON-RPC adapter route

**Files:**
- Create: `lib/mcp/protocol.ts`
- Create: `app/api/mcp/route.ts`
- Test: `tests/remote-mcp.test.ts`

**Interfaces:**
- `parseMcpRequest(input: unknown): McpRequest`
- `handleMcpRequest(request: Request): Promise<Response>`
- `McpRequest = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: unknown }`

- [ ] **Step 1: Write failing protocol tests** for `initialize`, `notifications/initialized`, `tools/list`, `tools/call`, unsupported method, invalid params, malformed JSON, and missing request ID handling.
- [ ] **Step 2: Run the focused tests and verify protocol failures.**
- [ ] **Step 3: Implement JSON-RPC parsing and stable error responses.** Return `-32600` for invalid envelopes, `-32601` for unsupported methods, and `-32602` for invalid method params. Keep notification responses empty or `204`.
- [ ] **Step 4: Implement `POST` route guards.** Enforce `Content-Type: application/json`, 256 KiB body limit, mode enabled, origin allowlist, bearer authentication, and CORS headers on successful/OPTIONS responses.
- [ ] **Step 5: Implement `initialize` and `tools/list`.** Use `createAdminTools` with the authenticated actor context and filter tools through the existing mode logic; map definitions to MCP tool metadata without exposing implementation internals.
- [ ] **Step 6: Implement `tools/call`.** Validate tool name and arguments, delegate to the existing tool `execute`, serialize successful data as JSON content, and serialize stable tool errors as `isError: true`.
- [ ] **Step 7: Run focused tests and typecheck.**

### Task 3: Bind server-side tool dependencies and mutation confirmation

**Files:**
- Modify: `lib/webmcp/admin-tools.ts`
- Modify: `lib/webmcp/types.ts`
- Modify: `lib/mcp/protocol.ts`
- Test: `tests/remote-mcp.test.ts`
- Test: `tests/admin-db.test.ts`

**Interfaces:**
- Extend `ToolDependencies` with `actorId?: string` and `remoteConfirmation?: boolean`.
- Remote adapter passes the authenticated actor and requires an explicit confirmation value for delete tool calls.

- [ ] **Step 1: Add failing tests** proving remote reads execute under the configured actor, delete calls without explicit confirmation fail, and confirmed delete still uses current version/audit safeguards.
- [ ] **Step 2: Update dependencies without changing browser behavior.** Keep browser `window.confirm`; remote calls must provide a validated explicit confirmation parameter and the adapter must reject absent/false confirmation for destructive tools.
- [ ] **Step 3: Ensure server-side fetch and auth context are scoped to the authenticated request.** Do not accept actor IDs from tool arguments.
- [ ] **Step 4: Run database integration tests against the local Postgres test database.**

### Task 4: Add Agent configuration and operational documentation

**Files:**
- Create: `docs/superpowers/examples/remote-mcp.json`
- Modify: `deploy/README.md`
- Modify: `.env.example`

- [ ] **Step 1: Add a local Agent MCP configuration** using `http://localhost:3000/api/mcp` and `${MCP_REMOTE_TOKEN}` header interpolation.
- [ ] **Step 2: Document setup, migration prerequisite, token generation, admin binding, allowed origins, and sample prompts.** State that remote MCP is local-only unless HTTPS and an explicit deployment policy are added.
- [ ] **Step 3: Document protocol smoke test** with `initialize`, `tools/list`, and a read-only `tools/call` example.
- [ ] **Step 4: Review docs for secret leakage and run markdown/config validation.**

### Task 5: Full verification and handoff

**Files:**
- Modify: `package.json` only if a focused test script is needed.

- [ ] **Step 1: Run `npm test`.**
- [ ] **Step 2: Run `npm run test:db` with the local database and verify remote read/write authorization cases.**
- [ ] **Step 3: Run `npm run typecheck` and `npm run build`.**
- [ ] **Step 4: Start local dev server with remote MCP variables and manually verify `initialize`, `tools/list`, and one read-only call using the example config.**
- [ ] **Step 5: Inspect `git diff`, ensure unrelated local changes remain unstaged, and report the endpoint/configuration.**

