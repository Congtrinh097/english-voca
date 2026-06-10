/**
 * Rate limiter in-memory (fixed window).
 * Production scale-out: thay bang @upstash/ratelimit + Redis (cung interface).
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

// Don dep dinh ky tranh ro ri bo nho
setInterval(() => {
  const now = Date.now();
  buckets.forEach((b, k) => {
    if (b.resetAt <= now) buckets.delete(k);
  });
}, 60_000).unref?.();
