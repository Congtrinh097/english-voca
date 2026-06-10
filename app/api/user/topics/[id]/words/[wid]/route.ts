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
    return NextResponse.json({ error: "Khong tim thay tu" }, { status: 404 });
  }

  const ut = await prisma.userTopic.findUnique({
    where: { userId_topicId: { userId: session.user.id, topicId: params.id } },
  });
  if (!ut) {
    return NextResponse.json({ error: "Chua bat dau hoc chu de nay" }, { status: 400 });
  }

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
