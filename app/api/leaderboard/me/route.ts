import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

/** GET /api/leaderboard/me — vi tri cua nguoi dung hien tai */
export async function GET() {
  const { error, session } = await requireUser();
  if (error) return error;

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, avatarUrl: true, totalGlory: true, createdAt: true },
  });
  if (!me) return NextResponse.json({ error: "Khong tim thay" }, { status: 404 });

  const ahead = await prisma.user.count({
    where: {
      OR: [
        { totalGlory: { gt: me.totalGlory } },
        { totalGlory: me.totalGlory, createdAt: { lt: me.createdAt } },
      ],
    },
  });

  const { createdAt, ...rest } = me;
  return NextResponse.json({ ...rest, rank: ahead + 1 });
}
