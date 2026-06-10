import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

/** POST /api/user/topics/[id]/start — them chu de vao danh sach hoc (idempotent) */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireUser();
  if (error) return error;

  const topic = await prisma.topic.findUnique({ where: { id: params.id } });
  if (!topic?.isPublished) {
    return NextResponse.json({ error: "Khong tim thay chu de" }, { status: 404 });
  }

  const userTopic = await prisma.userTopic.upsert({
    where: { userId_topicId: { userId: session.user.id, topicId: params.id } },
    update: { lastStudiedAt: new Date() },
    create: {
      userId: session.user.id,
      topicId: params.id,
      status: "in_progress",
      lastStudiedAt: new Date(),
    },
  });

  return NextResponse.json(userTopic);
}
