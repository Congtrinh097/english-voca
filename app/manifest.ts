import type { MetadataRoute } from "next";

/** PWA manifest — Next tự serve tại /manifest.webmanifest và tự gắn <link> */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "English Voca — Học từ vựng theo chủ đề",
    short_name: "English Voca",
    description:
      "Học từ vựng tiếng Anh theo chủ đề với flashcard tương tác, quiz trắc nghiệm, Glory Points và bảng xếp hạng.",
    lang: "vi",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#eef4ff",
    theme_color: "#3b5bfd",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512?maskable=1", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
