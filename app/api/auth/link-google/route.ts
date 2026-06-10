import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

/**
 * Lien ket / huy lien ket Google (muc 11.9 BA doc).
 * - LIEN KET: thuc hien bang cach dang nhap Google voi cung email —
 *   signIn callback se upsert googleId vao user hien tai.
 * - HUY LIEN KET: chi cho phep neu tai khoan co password_hash.
 */
export async function POST(req: NextRequest) {
  const { error, session } = await requireUser();
  if (error) return error;

  const body = await req.json().catch(() => ({}));

  if (body?.action === "unlink") {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.googleId) {
      return NextResponse.json({ error: "Tai khoan chua lien ket Google" }, { status: 400 });
    }
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Hay dat mat khau truoc khi huy lien ket de tranh mat quyen truy cap" },
        { status: 400 }
      );
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { googleId: null, authProvider: "credentials" },
    });
    return NextResponse.json({ ok: true });
  }

  // action = link: huong dan client goi signIn('google')
  return NextResponse.json({
    ok: true,
    message: "Dang nhap Google voi cung email de lien ket tu dong.",
  });
}
