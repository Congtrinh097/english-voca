import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

/** GET /api/leaderboard — bang xep hang (page, limit) */
export async function GET(req: NextRequest) {
  const { error } = await requireUser();
  if (error) return error;

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(sp.get("limit") ?? 20)));

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ totalGlory: "desc" }, { createdAt: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, name: true, avatarUrl: true, totalGlory: true },
    }),
    prisma.user.count(),
  ]);

  return NextResponse.json({
    items: items.map((u, i) => ({ ...u, rank: (page - 1) * limit + i + 1 })),
    total,
    page,
    hasMore: page * limit < total,
  });
}
