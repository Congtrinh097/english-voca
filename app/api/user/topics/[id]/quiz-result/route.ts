import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

/** GET /api/user/topics/[id]/quiz-result — ket qua thi cuoi cung */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireUser();
  if (error) return error;

  const result = await prisma.quizResult.findUnique({
    where: { userId_topicId: { userId: session.user.id, topicId: params.id } },
    include: { topic: { select: { title: true, titleVi: true, level: true, gloryReward: true } } },
  });

  if (!result) return NextResponse.json({ error: "Chua co ket qua" }, { status: 404 });
  return NextResponse.json(result);
}
