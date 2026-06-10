import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { wordSchema } from "@/lib/validations";

type Params = { params: { id: string; wid: string } };

/** PUT /api/topics/[id]/words/[wid] — [Admin] sua */
export async function PUT(req: NextRequest, { params }: Params) {
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

  const { audioUrl, ...rest } = parsed.data;
  const word = await prisma.word
    .update({
      where: { id: params.wid, topicId: params.id },
      data: { ...rest, audioUrl: audioUrl || null },
    })
    .catch(() => null);

  if (!word) return NextResponse.json({ error: "Khong tim thay" }, { status: 404 });
  return NextResponse.json(word);
}

/** DELETE /api/topics/[id]/words/[wid] — [Admin] xoa */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const word = await prisma.word
    .delete({ where: { id: params.wid, topicId: params.id } })
    .catch(() => null);

  if (!word) return NextResponse.json({ error: "Khong tim thay" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
