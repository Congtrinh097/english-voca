import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/PwaRegister";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "English Learning App — Học từ vựng theo chủ đề",
    template: "%s | English Learning App",
  },
  description:
    "Học từ vựng tiếng Anh theo chủ đề với flashcard tương tác, quiz trắc nghiệm, Glory Points và bảng xếp hạng.",
  openGraph: {
    title: "English Learning App",
    description: "Học từ vựng tiếng Anh theo chủ đề — flashcard, quiz, bảng xếp hạng.",
    type: "website",
  },
  // PWA trên iOS: chạy fullscreen khi thêm vào màn hình chính
  appleWebApp: {
    capable: true,
    title: "English Voca",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b5bfd",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={beVietnam.variable}>
      <body className="font-sans">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
