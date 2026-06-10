import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { createVerifyToken } from "@/lib/verify-token";
import { sendVerifyEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!checkRateLimit(`register:${ip}`, 5, 15 * 60_000)) {
    return NextResponse.json({ error: "Thu lai sau 15 phut" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Du lieu khong hop le" },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.googleId && !existing.passwordHash) {
      return NextResponse.json(
        { error: "Email nay da duoc dang ky bang Google. Vui long dang nhap bang Google." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Email da duoc dang ky" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, authProvider: "credentials" },
  });

  // Gui email xac minh (dev: log console)
  await sendVerifyEmail(email, createVerifyToken(user.id)).catch(console.error);

  return NextResponse.json({ ok: true }, { status: 201 });
}
