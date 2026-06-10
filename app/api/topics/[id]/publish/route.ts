import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";

/** PATCH /api/topics/[id]/publish — [Admin] toggle published */
export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const topic = await prisma.topic.findUnique({ where: { id: params.id } });
  if (!topic) return NextResponse.json({ error: "Khong tim thay" }, { status: 404 });

  const updated = await prisma.topic.update({
    where: { id: params.id },
    data: { isPublished: !topic.isPublished },
  });

  return NextResponse.json(updated);
}
