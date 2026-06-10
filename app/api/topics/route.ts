import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/api-helpers";
import { topicSchema, GLORY_BY_LEVEL } from "@/lib/validations";
import type { Level, Prisma } from "@prisma/client";

const PAGE_SIZE = 12;

/** GET /api/topics — danh sach published (filter: level, search, page) */
export async function GET(req: NextRequest) {
  const { error, session } = await requireUser();
  if (error) return error;

  const sp = req.nextUrl.searchParams;
  const level = sp.get("level");
  const search = sp.get("search")?.trim();
  const page = Math.max(1, Number(sp.get("page") ?? 1));
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
      orderBy: { createdAt: "desc" },
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

/** POST /api/topics — [Admin] tao moi */
export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = topicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Du lieu khong hop le" },
      { status: 400 }
    );
  }

  const { level, thumbnailUrl, ...rest } = parsed.data;
  const topic = await prisma.topic.create({
    data: {
      ...rest,
      level,
      gloryReward: GLORY_BY_LEVEL[level],
      thumbnailUrl: thumbnailUrl || null,
      createdBy: session.user.id,
    },
  });

  return NextResponse.json(topic, { status: 201 });
}
