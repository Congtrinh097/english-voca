import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { handleAdminMutation } from "@/lib/admin/http";
import { z } from "zod";

type Params = { params: { id: string } };

/** GET /api/topics/[id]/words — danh sach tu vung */
export async function GET(req: NextRequest, { params }: Params) {
  const { error, session } = await requireUser();
  if (error) return error;

  if (!z.string().uuid().safeParse(params.id).success) return NextResponse.json({error:"ID không hợp lệ"},{status:400});
  const topic = await prisma.topic.findUnique({ where: { id: params.id } });
  if (!topic || (!topic.isPublished && session.user.role !== "admin")) {
    return NextResponse.json({ error: "Khong tim thay chu de" }, { status: 404 });
  }

  const sp = req.nextUrl.searchParams;
  const paginated = sp.has("page") || sp.has("pageSize");
  const parsed = z.object({page:z.coerce.number().int().min(1).max(100000),pageSize:z.coerce.number().int().min(1).max(100)}).safeParse({page:sp.get("page") ?? 1,pageSize:sp.get("pageSize") ?? 50});
  if (!parsed.success) return NextResponse.json({error:"Phân trang không hợp lệ",code:"VALIDATION_ERROR"},{status:400});
  const {page,pageSize} = parsed.data;
  const words = await prisma.word.findMany({
    where: { topicId: params.id },
    orderBy: [{ orderIndex: "asc" }, { id: "asc" }],
    ...(paginated ? {skip:(page-1)*pageSize,take:pageSize} : {}),
  });

  const total = paginated ? await prisma.word.count({where:{topicId:params.id}}) : words.length;
  return NextResponse.json({items:words,total,page,hasMore:paginated && page*pageSize<total,version:topic.version});
}

export async function POST(req: NextRequest, { params }: Params) {
  return handleAdminMutation(req,"create_word",{topicId:params.id});
}
