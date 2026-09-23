import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { handleAdminMutation } from "@/lib/admin/http";
import { z } from "zod";
import type { Level, Prisma } from "@prisma/client";

const PAGE_SIZE = 12;

/** GET /api/topics — danh sach published (filter: level, search, page) */
export async function GET(req: NextRequest) {
  const { error, session } = await requireUser();
  if (error) return error;

  const sp = req.nextUrl.searchParams;
  const level = sp.get("level");
  const search = sp.get("search")?.trim();
  const parsedPage = z.coerce.number().int().min(1).max(100000).safeParse(sp.get("page") ?? 1);
  if (!parsedPage.success || (level && !["all","beginner","middle","master"].includes(level))) return NextResponse.json({error:"Bộ lọc không hợp lệ",code:"VALIDATION_ERROR"},{status:400});
  const page = parsedPage.data;
  const isAdmin = session.user.role === "admin" && sp.get("all") === "1";

  const where: Prisma.TopicWhereInput = {
    ...(isAdmin ? {} : { isPublished: true }),
    ...(level && level !== "all" ? { level: level as Level } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { titleVi: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.topic.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        _count: { select: { words: true } },
        userTopics: {
          where: { userId: session.user.id },
          select: { status: true },
        },
      },
    }),
    prisma.topic.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map(({ userTopics, _count, ...t }) => ({
      ...t,
      wordCount: _count.words,
      myStatus: userTopics[0]?.status ?? null,
    })),
    total,
    page,
    hasMore: page * PAGE_SIZE < total,
  });
}

export async function POST(req: NextRequest) {
  return handleAdminMutation(req,"create_topic");
}
