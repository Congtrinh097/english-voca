import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

// Edge runtime: tranh bug font-path cua next/og tren Node runtime Windows;
// Next gia lap edge ngay trong server standalone nen van chay tren Cloud Run
export const runtime = "edge";

const SIZES = new Set([192, 512]);

/**
 * GET /pwa-icon/[size](?maskable=1) — sinh icon PWA bằng ImageResponse,
 * khong can file anh tinh trong repo.
 * Ban maskable: emoji nho lai de nam trong safe zone 80% khi Android cat hinh tron.
 */
export async function GET(req: NextRequest, { params }: { params: { size: string } }) {
  const size = Number(params.size);
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  const maskable = req.nextUrl.searchParams.has("maskable");
  const fontSize = Math.round(size * (maskable ? 0.45 : 0.58));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #3b5bfd 0%, #7e22ce 100%)",
          borderRadius: maskable ? 0 : size * 0.18,
          fontSize,
        }}
      >
        🎓
      </div>
    ),
    { width: size, height: size, emoji: "twemoji" }
  );
}
