import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

/**
 * GET /api/topics/suggested — 3 chu de goi y (muc 3.1.1 BA doc)
 * - Co lich su: goi y chu de cung level voi chu de hoc gan nhat (chua hoc)
 * - Chua co lich su: 3 chu de Beginner pho bien nhat
 */
export async function GET() {
  const { error, session } = await requireUser();
  if (error) return error;

  const userId = session.user.id;

  const lastStudied = await prisma.userTopic.findFirst({
    where: { userId, lastStudiedAt: { not: null } },
    orderBy: { lastStudiedAt: "desc" },
    include: { topic: { select: { level: true } } },
  });

  const studiedTopicIds = (
    await prisma.userTopic.findMany({ where: { userId }, select: { topicId: true } })
  ).map((t) => t.topicId);

  const baseWhere = {
    isPublished: true,
    id: { notIn: studiedTopicIds },
  };

  let suggested = await prisma.topic.findMany({
    where: {
      ...baseWhere,
      level: lastStudied ? lastStudied.topic.level : "beginner",
    },
    orderBy: { userTopics: { _count: "desc" } },
    take: 3,
    include: { _count: { select: { words: true, userTopics: true } } },
  });

  // Khong du 3: bo sung tu cac level khac
  if (suggested.length < 3) {
    const more = await prisma.topic.findMany({
      where: { ...baseWhere, id: { notIn: [...studiedTopicIds, ...suggested.map((t) => t.id)] } },
      orderBy: { userTopics: { _count: "desc" } },
      take: 3 - suggested.length,
      include: { _count: { select: { words: true, userTopics: true } } },
    });
    suggested = [...suggested, ...more];
  }

  return NextResponse.json({
    items: suggested.map(({ _count, ...t }) => ({
      ...t,
      wordCount: _count.words,
      learnerCount: _count.userTopics,
    })),
  });
}
