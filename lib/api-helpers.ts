import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { getRemoteMcpConfig } from "@/lib/admin/mode";

export async function requireUser() {
  const requestHeaders = await headers();
  const remoteToken = requestHeaders.get("x-remote-mcp-token");
  const remoteUserId = requestHeaders.get("x-remote-mcp-user-id");
  const remoteConfig = getRemoteMcpConfig();
  if (remoteToken && remoteUserId && remoteConfig.token.length >= 32 && remoteToken === remoteConfig.token) {
    const remoteUser = await prisma.user.findUnique({ where: { id: remoteUserId }, select: { id: true, role: true } });
    if (remoteUser) return { error: null, session: { user: { id: remoteUser.id, role: remoteUser.role } } as never };
  }
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 }),
      session: null,
    };
  }
  // Chong session "mo coi": JWT con han nhung user da bi xoa khoi DB (vd. sau khi seed lai)
  const exists = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!exists) {
    return {
      error: NextResponse.json(
        { error: "Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại." },
        { status: 401 }
      ),
      session: null,
    };
  }
  session.user.role = exists.role;
  return { error: null, session };
}

export async function requireAdmin() {
  const { error, session } = await requireUser();
  if (error) return { error, session: null };
  if (session!.user.role !== "admin") {
    return {
      error: NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 }),
      session: null,
    };
  }
  return { error: null, session: session! };
}
