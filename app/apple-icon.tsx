import { ImageResponse } from "next/og";

/** Icon cho iOS "Thêm vào màn hình chính" — Next tự gắn <link rel="apple-touch-icon"> */
export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 104,
        }}
      >
        🎓
      </div>
    ),
    { ...size, emoji: "twemoji" }
  );
}
