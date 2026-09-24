import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getRemoteMcpConfig } from "@/lib/admin/mode";

export type RemoteAuthErrorCode =
  | "REMOTE_DISABLED"
  | "INVALID_AUTHORIZATION"
  | "INVALID_TOKEN"
  | "ADMIN_NOT_FOUND"
  | "ADMIN_REQUIRED"
  | "ORIGIN_NOT_ALLOWED";

export type RemoteAuthError = {
  ok: false;
  code: RemoteAuthErrorCode;
  status: 401 | 403 | 503;
  message: string;
};

export type RemoteAuthSuccess = { ok: true; userId: string };
export type RemoteAuthResult = RemoteAuthSuccess | RemoteAuthError;

function error(code: RemoteAuthErrorCode, status: RemoteAuthError["status"], message: string): RemoteAuthError {
  return { ok: false, code, status, message };
}

function equalSecret(actual: string, expected: string): boolean {
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length) return false;
  return timingSafeEqual(actualBytes, expectedBytes);
}

export function isAllowedRemoteOrigin(origin: string | null): boolean {
  if (!origin) return true;
  const config = getRemoteMcpConfig();
  return config.allowedOrigins.includes(origin);
}

/** Authenticate the configured remote MCP bearer token and bind it to one admin user. */
export async function authenticateRemoteMcp(request: Request): Promise<RemoteAuthResult> {
  const config = getRemoteMcpConfig();
  if (webmcpModeOff()) {
    return error("REMOTE_DISABLED", 503, "Remote MCP is disabled.");
  }
  if (config.token.length < 32 || !config.adminEmail) {
    return error("REMOTE_DISABLED", 503, "Remote MCP is not configured.");
  }

  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer ([^\s]+)$/.exec(authorization);
  if (!match) return error("INVALID_AUTHORIZATION", 401, "Bearer authorization is required.");
  if (!equalSecret(match[1], config.token)) return error("INVALID_TOKEN", 401, "Invalid remote MCP token.");

  const user = await prisma.user.findUnique({
    where: { email: config.adminEmail },
    select: { id: true, role: true },
  });
  if (!user) return error("ADMIN_NOT_FOUND", 401, "Configured remote MCP admin was not found.");
  if (user.role !== "admin") return error("ADMIN_REQUIRED", 403, "Configured remote MCP user is not an admin.");
  return { ok: true, userId: user.id };
}

function webmcpModeOff(): boolean {
  return getRemoteMcpConfig().enabled === false && (process.env.WEBMCP_MODE ?? "off") === "off";
}
