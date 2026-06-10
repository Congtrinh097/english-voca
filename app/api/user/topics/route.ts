import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import type { TopicStatus } from "@prisma/client";

/** GET /api/user/topics — danh sach hoc (my list), filter: status */
export async function GET(req: NextRequest) {
  const { error, session } = await requireUser();
  if (error) return error;

  const status = req.nextUrl.searchParams.get("status");

  const items = await prisma.userTopic.findMany({
    where: {
      userId: session.user.id,
      ...(status ? { status: status as TopicStatus } : {}),
    },
    orderBy: { addedAt: "desc" },
    include: {
      topic: {
        include: { _count: { select: { words: true } } },
      },
    },
  });

  return NextResponse.json({
    items: items.map((ut) => ({
      id: ut.id,
      topicId: ut.topicId,
      status: ut.status,
      wordsLearnedCount: ut.wordsLearned.length,
      gloryEarned: ut.gloryEarned,
      lastStudiedAt: ut.lastStudiedAt,
      topic: {
        id: ut.topic.id,
        title: ut.topic.title,
        titleVi: ut.topic.titleVi,
        level: ut.topic.level,
        thumbnailUrl: ut.topic.thumbnailUrl,
        wordCount: ut.topic._count.words,
      },
    })),
  });
}
