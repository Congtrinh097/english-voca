import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/api-helpers";
import { wordSchema } from "@/lib/validations";

type Params = { params: { id: string } };

/** GET /api/topics/[id]/words — danh sach tu vung */
export async function GET(_req: NextRequest, { params }: Params) {
  const { error, session } = await requireUser();
  if (error) return error;

  const topic = await prisma.topic.findUnique({ where: { id: params.id } });
  if (!topic || (!topic.isPublished && session.user.role !== "admin")) {
    return NextResponse.json({ error: "Khong tim thay chu de" }, { status: 404 });
  }

  const words = await prisma.word.findMany({
    where: { topicId: params.id },
    orderBy: { orderIndex: "asc" },
  });

  return NextResponse.json({ items: words });
}

/** POST /api/topics/[id]/words — [Admin] them tu moi */
export async function POST(req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = wordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Du lieu khong hop le" },
      { status: 400 }
    );
  }

  const maxOrder = await prisma.word.aggregate({
    where: { topicId: params.id },
    _max: { orderIndex: true },
  });

  const { audioUrl, orderIndex, ...rest } = parsed.data;
  const word = await prisma.word.create({
    data: {
      ...rest,
      audioUrl: audioUrl || null,
      orderIndex: orderIndex ?? (maxOrder._max.orderIndex ?? -1) + 1,
      topicId: params.id,
    },
  });

  return NextResponse.json(word, { status: 201 });
}
