import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

/** PATCH /api/user/topics/[id]/words/[wid] — danh dau tu da hoc (idempotent) */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string; wid: string } }
) {
  const { error, session } = await requireUser();
  if (error) return error;

  const word = await prisma.word.findUnique({ where: { id: params.wid } });
  if (!word || word.topicId !== params.id) {
    return NextResponse.json({ error: "Không tìm thấy từ" }, { status: 404 });
  }

  // Tu dong them vao danh sach hoc neu chua co (dang hoc flashcard tuc la da bat dau)
  const ut = await prisma.userTopic.upsert({
    where: { userId_topicId: { userId: session.user.id, topicId: params.id } },
    update: {},
    create: { userId: session.user.id, topicId: params.id, status: "in_progress" },
  });

  const updated = await prisma.userTopic.update({
    where: { id: ut.id },
    data: {
      wordsLearned: ut.wordsLearned.includes(params.wid)
        ? ut.wordsLearned
        : [...ut.wordsLearned, params.wid],
      lastStudiedAt: new Date(),
    },
  });

  return NextResponse.json({ wordsLearned: updated.wordsLearned });
}
