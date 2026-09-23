import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { handleAdminMutation } from "@/lib/admin/http";
import { z } from "zod";

type Params = { params: { id: string } };

/** GET /api/topics/[id] — chi tiet chu de */
export async function GET(_req: NextRequest, { params }: Params) {
  const { error, session } = await requireUser();
  if (error) return error;

  if (!z.string().uuid().safeParse(params.id).success) return NextResponse.json({error:"ID không hợp lệ"},{status:400});
  const topic = await prisma.topic.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { words: true, userTopics: true, quizResults: true } },
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
    ...(session.user.role === "admin" ? { deletionImpact: _count } : {}),
    myTopic: userTopics[0] ?? null,
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  return handleAdminMutation(req,"update_topic",{topicId:params.id});
}
export async function DELETE(req: NextRequest, { params }: Params) {
  return handleAdminMutation(req,"delete_topic",{topicId:params.id});
}
