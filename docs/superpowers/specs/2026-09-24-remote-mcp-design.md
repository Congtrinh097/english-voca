# Remote MCP for Local Admin Agents

## Goal

Cho phép một Local Agent kết nối tới ứng dụng English Voca qua MCP HTTP tại `/api/mcp` và gọi an toàn các tool quản trị chủ đề, từ vựng đang được dùng bởi WebMCP trong browser.

## Context and constraints

- Ứng dụng dùng Next.js App Router, NextAuth session và Prisma PostgreSQL.
- WebMCP hiện có 12 tool trong `lib/webmcp/admin-tools.ts`; remote MCP phải tái sử dụng các tool này thay vì tạo một lớp CRUD thứ hai.
- Quyền admin, version optimistic concurrency, request ID, audit log, rate limit và xác nhận xóa phải được giữ nguyên.
- Local Agent kết nối bằng HTTP tới `http://localhost:3000/api/mcp`.
- Remote endpoint tắt khi `WEBMCP_MODE=off`.
- Token remote là secret riêng trong `MCP_REMOTE_TOKEN`; không dùng session cookie của browser.

## Architecture

```text
Local Agent
  -> POST /api/mcp (JSON-RPC MCP messages)
  -> origin/token guard
  -> admin MCP adapter
  -> existing WebMCP tool.execute()
  -> existing API/service/Prisma and audit controls
```

`app/api/mcp/route.ts` nhận MCP JSON-RPC requests và trả JSON response. Adapter chuyển `tools/list` sang metadata `name`, `description`, `inputSchema`, annotations; `tools/call` validate tool name và input rồi gọi `execute`. Các tool vẫn gọi API same-origin thông qua dependency fetch và phải có actor admin đã được xác thực.

Vì Local Agent không có browser session, adapter tạo một server-side admin execution context từ bearer token. Token map tới một user admin duy nhất qua `MCP_REMOTE_ADMIN_EMAIL` hoặc `MCP_REMOTE_ADMIN_ID`; mỗi request kiểm tra user tồn tại, đang hoạt động và có role `admin`. Không cho token tự chọn actor.

## MCP surface

Supported JSON-RPC methods:

- `initialize`: trả protocol version và server capabilities.
- `notifications/initialized`: nhận và trả `204` hoặc JSON-RPC success tùy client.
- `tools/list`: chỉ trả tool theo `WEBMCP_MODE`.
- `tools/call`: gọi một tool; kết quả thành công trả `content` dạng JSON và `isError: false`, lỗi trả `isError: true` với mã ổn định.

Unsupported methods trả JSON-RPC error `-32601`. Invalid JSON hoặc params trả `-32600`/`-32602`. Request thiếu token trả HTTP 401; token sai hoặc actor không còn là admin trả HTTP 403. Endpoint không hoạt động khi mode `off` và trả HTTP 404 để tránh lộ capability.

MCP HTTP requests phải có `Content-Type: application/json`, `Authorization: Bearer <MCP_REMOTE_TOKEN>` và origin `http://localhost` hoặc origin trong `MCP_REMOTE_ALLOWED_ORIGINS`. CORS chỉ mở cho allowlist cấu hình, không dùng wildcard khi có token.

## Security and operations

- Token được so sánh constant-time, tối thiểu 32 ký tự khi cấu hình.
- Không ghi token vào log, audit payload, response hoặc error message.
- Giới hạn body JSON ở 256 KiB và giới hạn call theo rate-limit hiện có.
- Ghi audit cho các mutation qua pipeline hiện tại; `tools/list` và read không tạo mutation audit.
- `MCP_REMOTE_TOKEN` bắt buộc khi mode khác `off`; nếu thiếu token, endpoint trả lỗi cấu hình rõ ràng nhưng không expose secret.
- `MCP_REMOTE_ADMIN_EMAIL` bắt buộc để bind token với actor admin trong local setup.

## Configuration

```env
WEBMCP_MODE=all
MCP_REMOTE_TOKEN=<random secret, at least 32 characters>
MCP_REMOTE_ADMIN_EMAIL=admin@example.com
MCP_REMOTE_ALLOWED_ORIGINS=http://localhost:3000
```

Add `mcp.json` example for a local Agent:

```json
{
  "mcpServers": {
    "english-voca-local": {
      "url": "http://localhost:3000/api/mcp",
      "headers": {
        "Authorization": "Bearer ${MCP_REMOTE_TOKEN}"
      }
    }
  }
}
```

## Error and concurrency behavior

- Tool validation errors are returned in MCP `tools/call` result content with the existing stable error code and `isError: true`.
- A stale topic/word version returns the existing conflict error and never overwrites newer data.
- Mutations require a caller-supplied `requestId`; retries with the same request ID remain idempotent.
- Delete tools remain guarded by the existing explicit confirmation dependency. Remote calls must pass an explicit confirmation field accepted by the adapter; without it, deletion is rejected.

## Testing and acceptance criteria

- Unit tests cover initialize, tools/list mode filtering, tools/call routing, invalid method/params, missing/invalid token, origin rejection, body limit and off mode.
- Integration tests use the local PostgreSQL test database to prove a read and a mutation execute under an admin actor and a non-admin is rejected.
- Existing `npm test`, `npm run test:db`, `npm run typecheck` and `npm run build` remain green.
- A documented local Agent config can connect to `/api/mcp`, list tools, read topics, create a topic with request ID, and receive a conflict on a stale version.

## Out of scope

- Public internet exposure, OAuth client registration, streaming MCP transport, SSE, or multi-tenant token management.
- Replacing browser WebMCP; both browser and remote adapters share the same tool definitions and business behavior.
