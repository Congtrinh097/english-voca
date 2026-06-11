import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { FLASHCARD_COMPLETE_BONUS } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

type Params = { params: { id: string } };

/**
 * POST /api/user/topics/[id]/flashcard-complete
 * Thuong +5 Glory khi nguoi hoc xem den flashcard cuoi cung cua chu de.
 * Chi cong 1 LAN DUY NHAT per user+topic (check flashcardBonusAt trong transaction).
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const { error, session } = await requireUser();
  if (error) return error;

  if (!checkRateLimit(`flashcard-complete:${session.user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: "Thao tac qua nhanh, thu lai sau" }, { status: 429 });
  }

  const topic = await prisma.topic.findUnique({ where: { id: params.id } });
  if (!topic) return NextResponse.json({ error: "Khong tim thay chu de" }, { status: 404 });

  const gloryAwarded = await prisma.$transaction(async (tx) => {
    const ut = await tx.userTopic.upsert({
      where: { userId_topicId: { userId: session.user.id, topicId: params.id } },
      update: {},
      create: { userId: session.user.id, topicId: params.id, status: "in_progress" },
    });

    if (ut.flashcardBonusAt) return 0; // da nhan thuong truoc do

    await tx.userTopic.update({
      where: { id: ut.id },
      data: { flashcardBonusAt: new Date(), lastStudiedAt: new Date() },
    });
    await tx.user.update({
      where: { id: session.user.id },
      data: { totalGlory: { increment: FLASHCARD_COMPLETE_BONUS } },
    });
    return FLASHCARD_COMPLETE_BONUS;
  });

  return NextResponse.json({ gloryAwarded });
}
