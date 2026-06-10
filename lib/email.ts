import nodemailer from "nodemailer";

function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

export async function sendEmail(to: string, subject: string, html: string) {
  const transport = getTransport();
  if (!transport) {
    // Dev mode: khong co SMTP — log ra console
    console.log(`[DEV EMAIL] To: ${to} | ${subject}\n${html}`);
    return;
  }
  await transport.sendMail({
    from: process.env.EMAIL_FROM ?? "no-reply@example.com",
    to,
    subject,
    html,
  });
}

export async function sendResetPasswordEmail(to: string, token: string) {
  const url = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
  await sendEmail(
    to,
    "Dat lai mat khau — English Learning App",
    `<p>Nhan vao link sau de dat lai mat khau (het han sau 1 gio):</p>
     <p><a href="${url}">${url}</a></p>
     <p>Neu ban khong yeu cau, hay bo qua email nay.</p>`
  );
}

export async function sendVerifyEmail(to: string, token: string) {
  const url = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/auth/verify-email/${token}`;
  await sendEmail(
    to,
    "Xac minh email — English Learning App",
    `<p>Nhan vao link sau de xac minh tai khoan:</p>
     <p><a href="${url}">${url}</a></p>`
  );
}
