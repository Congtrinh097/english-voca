import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseVerifyToken } from "@/lib/verify-token";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const userId = parseVerifyToken(params.token);
  if (!userId) {
    return NextResponse.redirect(new URL("/login?verify=invalid", req.url));
  }

  await prisma.user
    .update({ where: { id: userId }, data: { emailVerified: true } })
    .catch(() => null);

  return NextResponse.redirect(new URL("/login?verify=ok", req.url));
}
