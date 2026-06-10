import { createHmac } from "crypto";

/**
 * Token xac minh email dang stateless (HMAC), khong can bang DB rieng.
 * Format: base64url(userId.expiresMs).signature
 */
function sign(payload: string): string {
  return createHmac("sha256", process.env.NEXTAUTH_SECRET ?? "dev-secret")
    .update(payload)
    .digest("base64url");
}

export function createVerifyToken(userId: string, ttlMs = 24 * 60 * 60_000): string {
  const payload = Buffer.from(`${userId}.${Date.now() + ttlMs}`).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function parseVerifyToken(token: string): string | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig || sign(payload) !== sig) return null;
  const decoded = Buffer.from(payload, "base64url").toString();
  const idx = decoded.lastIndexOf(".");
  const userId = decoded.slice(0, idx);
  const expires = Number(decoded.slice(idx + 1));
  if (!userId || !expires || Date.now() > expires) return null;
  return userId;
}
