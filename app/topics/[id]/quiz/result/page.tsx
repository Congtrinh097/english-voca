"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { playApplause, playSad } from "@/lib/sounds";

type AnswerDetail = {
  word: string;
  selected: string;
  correctAnswer: string;
  correct: boolean;
};

type Result = {
  score: number;
  totalQuestions: number;
  percentage: string | number;
  passed: boolean;
  answers: AnswerDetail[] | null;
  topic: { title: string; titleVi: string; gloryReward: number };
};

const CONFETTI_COLORS = ["#3b5bfd", "#9333ea", "#f59e0b", "#10b981", "#ef4444", "#ec4899"];

/** S06 — Kết quả Quiz: điểm + Glory + hành động tiếp theo */
export default function QuizResultPage() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<Result | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [confetti, setConfetti] = useState<React.CSSProperties[]>([]);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetch(`/api/user/topics/${id}/quiz-result`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setResult)
      .catch(() => setNotFound(true));
  }, [id]);

  // Âm thanh kết quả: vỗ tay khi đạt, giai điệu buồn khi chưa đạt
  useEffect(() => {
    if (!result) return;
    if (result.passed) playApplause();
    else playSad();
  }, [result]);

  // Pháo hoa ăn mừng khi đạt
  useEffect(() => {
    if (!result?.passed) return;
    setConfetti(
      Array.from({ length: 60 }, () => ({
        left: `${Math.random() * 100}%`,
        backgroundColor: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        animationDuration: `${2.2 + Math.random() * 2.5}s`,
        animationDelay: `${Math.random() * 0.8}s`,
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
      }))
    );
    const t = setTimeout(() => setConfetti([]), 6000);
    return () => clearTimeout(t);
  }, [result?.passed]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <div className="mb-3 text-5xl">🤔</div>
        <p className="text-gray-500">Chưa có kết quả quiz cho chủ đề này.</p>
        <Link href={`/topics/${id}/quiz`} className="mt-4 inline-block font-medium text-brand-600 hover:underline">
          Làm quiz ngay →
        </Link>
      </div>
    );
  }
  if (!result) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-gray-400">
        <span className="h-8 w-8 animate-spin-slow rounded-full border-2 border-brand-200 border-t-brand-500" />
        Đang tải kết quả...
      </div>
    );
  }

  const pct = Number(result.percentage);

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-10">
      {/* Pháo hoa */}
      {confetti.map((style, i) => (
        <span key={i} className="confetti" style={style} />
      ))}

      <div className="animate-pop relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-soft">
        {result.passed && (
          <div className="absolute inset-x-0 top-0 h-1.5 bg-brand-gradient" />
        )}
        <div className={`text-6xl ${result.passed ? "animate-bounce-soft" : ""}`}>
          {result.passed ? "🎉" : "😢"}
        </div>
        <h1 className={`mt-3 text-2xl font-extrabold ${result.passed ? "text-gradient" : ""}`}>
          {result.passed ? "ĐẠT RỒI!" : "Chưa đạt"}
        </h1>
        <p className="text-sm text-gray-500">{result.topic.title} — {result.topic.titleVi}</p>

        <p className="mt-4 text-5xl font-extrabold">
          {result.score}
          <span className="text-2xl text-gray-400">/{result.totalQuestions}</span>
        </p>
        <p className={`mt-1 font-bold ${result.passed ? "text-emerald-600" : "text-red-600"}`}>
          {pct.toFixed(0)}%
        </p>

        {result.passed ? (
          <p className="mt-3 inline-block animate-scale-in rounded-full bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-700 ring-1 ring-amber-200">
            ⭐ +{result.topic.gloryReward} Glory
          </p>
        ) : (
          <p className="mt-3 text-sm text-gray-500">
            Cần ≥ 80% để đạt. Cố lên, bạn có thể thi lại!
          </p>
        )}

        {/* Link mở popup chi tiết đáp án */}
        {result.answers && (
          <p className="mt-2">
            <button
              onClick={() => setShowDetail(true)}
              className="text-xs font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700"
            >
              Chi tiết
            </button>
          </p>
        )}
      </div>

      {/* Popup chi tiết từng câu */}
      {showDetail && result.answers && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in"
          onClick={() => setShowDetail(false)}
        >
          <div
            role="dialog"
            aria-label="Chi tiết đáp án"
            className="animate-pop flex max-h-[80vh] w-full max-w-md flex-col rounded-3xl bg-white p-5 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">Chi tiết đáp án</h2>
              <button
                onClick={() => setShowDetail(false)}
                aria-label="Đóng"
                className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 overflow-y-auto">
              {result.answers.map((a, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-3 text-sm ${
                    a.correct ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
                  }`}
                >
                  <p className="font-semibold">{i + 1}. {a.word}</p>
                  <p className={a.correct ? "text-emerald-700" : "text-red-700"}>
                    Bạn chọn: {a.selected} {a.correct ? "✓" : `✗ — Đáp án: ${a.correctAnswer}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2">
        {!result.passed && (
          <Link href={`/topics/${id}/quiz`}
            className="btn-gradient rounded-xl px-4 py-3 text-center font-semibold text-white">
            🔁 Thi lại
          </Link>
        )}
        <Link href={`/topics/${id}/learn`}
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-semibold transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-600 hover:shadow-md">
          📖 Ôn lại flashcard
        </Link>
        <Link href="/my-list"
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-semibold transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-600 hover:shadow-md">
          📋 Về danh sách học
        </Link>
        <Link href="/"
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-semibold transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-600 hover:shadow-md">
          🏠 Về trang chủ
        </Link>
      </div>
    </div>
  );
}
