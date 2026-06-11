import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { generateQuiz, gradeQuiz } from "@/lib/quiz-engine";
import { quizSubmitSchema, PASS_THRESHOLD, QUIZ_SIZE } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

type Params = { params: { id: string } };

/** GET /api/user/topics/[id]/quiz — sinh de quiz (10 cau, server-side) */
export async function GET(_req: NextRequest, { params }: Params) {
  const { error, session } = await requireUser();
  if (error) return error;

  const topic = await prisma.topic.findUnique({ where: { id: params.id } });
  if (!topic) {
    return NextResponse.json({ error: "Không tìm thấy chủ đề" }, { status: 404 });
  }

  // Tu dong them vao danh sach hoc neu chua co (lam quiz tuc la dang hoc chu de nay)
  await prisma.userTopic.upsert({
    where: { userId_topicId: { userId: session.user.id, topicId: params.id } },
    update: {},
    create: { userId: session.user.id, topicId: params.id, status: "in_progress" },
  });

  const words = await prisma.word.findMany({ where: { topicId: params.id } });
  try {
    return NextResponse.json({ questions: generateQuiz(words) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

/**
 * POST /api/user/topics/[id]/quiz — nop bai (muc 3.3 + bang trang thai muc 7)
 * - Cham diem server-side
 * - PASSED >= 80%, FAILED < 80%; chi luu ket qua cuoi (upsert)
 * - Glory chi cong 1 lan khi pass lan dau (gloryEarned = 0) — transaction chong race
 */
export async function POST(req: NextRequest, { params }: Params) {
  const { error, session } = await requireUser();
  if (error) return error;

  // Rate limiting: max 10 req/phut per user (muc 9 BA doc)
  if (!checkRateLimit(`quiz:${session.user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: "Thao tac qua nhanh, thu lai sau" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = quizSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Du lieu khong hop le" }, { status: 400 });
  }

  const topic = await prisma.topic.findUnique({ where: { id: params.id } });
  if (!topic) return NextResponse.json({ error: "Khong tim thay chu de" }, { status: 404 });

  const words = await prisma.word.findMany({ where: { topicId: params.id } });
  const { score, detail } = gradeQuiz(words, parsed.data.answers);

  const totalQuestions = parsed.data.answers.length || QUIZ_SIZE;
  const percentage = Math.round((score / totalQuestions) * 10000) / 100;
  const passed = percentage >= PASS_THRESHOLD;

  const result = await prisma.$transaction(async (tx) => {
    // Tu dong tao neu chua co — dong bo voi GET (sinh de) o tren
    const ut = await tx.userTopic.upsert({
      where: { userId_topicId: { userId: session.user.id, topicId: params.id } },
      update: {},
      create: { userId: session.user.id, topicId: params.id, status: "in_progress" },
    });

    // Chi luu ket qua thi CUOI CUNG (upsert theo user+topic)
    const quizResult = await tx.quizResult.upsert({
      where: { userId_topicId: { userId: session.user.id, topicId: params.id } },
      update: { score, totalQuestions, percentage, passed, answers: detail, takenAt: new Date() },
      create: {
        userId: session.user.id,
        topicId: params.id,
        score,
        totalQuestions,
        percentage,
        passed,
        answers: detail,
      },
    });

    // Glory chi cong 1 LAN DUY NHAT (check gloryEarned trong cung transaction)
    let gloryAwarded = 0;
    if (passed && ut.gloryEarned === 0) {
      gloryAwarded = topic.gloryReward;
      await tx.user.update({
        where: { id: session.user.id },
        data: { totalGlory: { increment: gloryAwarded } },
      });
    }

    // Cap nhat trang thai theo bang muc 7 BA doc
    await tx.userTopic.update({
      where: { id: ut.id },
      data: {
        status: passed ? "passed" : "failed",
        gloryEarned: ut.gloryEarned + gloryAwarded,
        lastStudiedAt: new Date(),
      },
    });

    return { quizResult, gloryAwarded };
  });

  return NextResponse.json({
    score,
    totalQuestions,
    percentage,
    passed,
    gloryAwarded: result.gloryAwarded,
    detail,
  });
}
