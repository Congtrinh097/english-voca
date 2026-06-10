import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendResetPasswordEmail } from "@/lib/email";

const GENERIC = "Neu email ton tai, chung toi se gui huong dan dat lai mat khau.";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!checkRateLimit(`forgot:${ip}`, 5, 15 * 60_000)) {
    return NextResponse.json({ error: "Thu lai sau 15 phut" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  // Luon tra thong bao chung — chong email enumeration (muc 11.5 BA doc)
  if (!parsed.success) return NextResponse.json({ message: GENERIC });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user?.passwordHash) {
    const token = randomUUID();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60_000), // 1 gio
      },
    });
    await sendResetPasswordEmail(user.email, token).catch(console.error);
  }

  return NextResponse.json({ message: GENERIC });
}
