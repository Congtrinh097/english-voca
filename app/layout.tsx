import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "English Learning App — Hoc tu vung theo chu de",
    template: "%s | English Learning App",
  },
  description:
    "Hoc tu vung tieng Anh theo chu de voi flashcard tuong tac, quiz trac nghiem, Glory Points va bang xep hang.",
  openGraph: {
    title: "English Learning App",
    description: "Hoc tu vung tieng Anh theo chu de — flashcard, quiz, leaderboard.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
