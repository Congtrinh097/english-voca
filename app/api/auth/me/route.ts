import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

export async function GET() {
  const { error, session } = await requireUser();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      emailVerified: true,
      authProvider: true,
      googleId: true,
      passwordHash: true,
      totalGlory: true,
      role: true,
      createdAt: true,
    },
  });
  if (!user) return NextResponse.json({ error: "Khong tim thay" }, { status: 404 });

  const { passwordHash, googleId, ...rest } = user;
  return NextResponse.json({
    ...rest,
    hasPassword: !!passwordHash,
    hasGoogle: !!googleId,
  });
}
