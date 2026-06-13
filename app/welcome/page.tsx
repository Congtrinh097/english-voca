import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "English Voca — Học từ vựng tiếng Anh theo chủ đề",
  description:
    "English Voca giúp bạn học từ vựng tiếng Anh theo chủ đề với flashcard tương tác, quiz trắc nghiệm, Glory Points và bảng xếp hạng.",
};

const FEATURES = [
  {
    icon: "🃏",
    title: "Flashcard tương tác",
    desc: "Học từ vựng theo chủ đề với thẻ lật hai mặt, phát âm và ví dụ minh họa.",
  },
  {
    icon: "📝",
    title: "Quiz trắc nghiệm",
    desc: "Kiểm tra kiến thức sau mỗi chủ đề với câu hỏi trắc nghiệm đa dạng.",
  },
  {
    icon: "⭐",
    title: "Glory Points",
    desc: "Tích điểm qua mỗi bài học và quiz để theo dõi tiến bộ của bạn.",
  },
  {
    icon: "🏆",
    title: "Bảng xếp hạng",
    desc: "Thi đua cùng bạn bè trên bảng xếp hạng theo tuần và toàn thời gian.",
  },
];

export default function WelcomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-accent-400/20 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-5 py-14 text-center">
        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-brand-gradient text-4xl shadow-glow">
          🎓
        </div>
        <h1 className="mb-3 text-4xl font-extrabold text-gradient">English Voca</h1>
        <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-slate-600">
          Ứng dụng học từ vựng tiếng Anh theo chủ đề — ghi nhớ nhanh hơn với
          flashcard tương tác, củng cố bằng quiz trắc nghiệm và duy trì động
          lực qua Glory Points cùng bảng xếp hạng.
        </p>

        <div className="mb-14 flex justify-center gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-brand-gradient px-6 py-3 font-semibold text-white shadow-glow transition-transform hover:scale-105"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="rounded-xl border border-gray-200 bg-white/80 px-6 py-3 font-semibold text-slate-700 backdrop-blur transition-transform hover:scale-105"
          >
            Đăng ký miễn phí
          </Link>
        </div>

        <div className="grid gap-4 text-left sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-soft backdrop-blur"
            >
              <div className="mb-2 text-3xl">{f.icon}</div>
              <h2 className="mb-1 font-bold">{f.title}</h2>
              <p className="text-sm leading-relaxed text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>

        <footer className="mt-14 flex justify-center gap-5 text-sm text-slate-500">
          <Link href="/privacy" className="underline">
            Chính sách bảo mật
          </Link>
          <Link href="/terms" className="underline">
            Điều khoản sử dụng
          </Link>
          <a href="mailto:congtrinh097@gmail.com" className="underline">
            Liên hệ
          </a>
        </footer>
      </div>
    </main>
  );
}
