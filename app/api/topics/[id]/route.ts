import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/api-helpers";
import { topicSchema, GLORY_BY_LEVEL } from "@/lib/validations";

type Params = { params: { id: string } };

/** GET /api/topics/[id] — chi tiet chu de */
export async function GET(_req: NextRequest, { params }: Params) {
  const { error, session } = await requireUser();
  if (error) return error;

  const topic = await prisma.topic.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { words: true } },
      userTopics: { where: { userId: session.user.id } },
    },
  });

  if (!topic || (!topic.isPublished && session.user.role !== "admin")) {
    return NextResponse.json({ error: "Khong tim thay chu de" }, { status: 404 });
  }

  const { userTopics, _count, ...rest } = topic;
  return NextResponse.json({
    ...rest,
    wordCount: _count.words,
    myTopic: userTopics[0] ?? null,
  });
}

/** PUT /api/topics/[id] — [Admin] cap nhat */
export async function PUT(req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
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
  const topic = await prisma.topic
    .update({
      where: { id: params.id },
      data: { ...rest, level, gloryReward: GLORY_BY_LEVEL[level], thumbnailUrl: thumbnailUrl || null },
    })
    .catch(() => null);

  if (!topic) return NextResponse.json({ error: "Khong tim thay" }, { status: 404 });
  return NextResponse.json(topic);
}

/** DELETE /api/topics/[id] — [Admin] xoa */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const topic = await prisma.topic.delete({ where: { id: params.id } }).catch(() => null);
  if (!topic) return NextResponse.json({ error: "Khong tim thay" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
