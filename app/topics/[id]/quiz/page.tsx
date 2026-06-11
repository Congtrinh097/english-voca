"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { speakEN, ttsAvailable } from "@/lib/tts";

type Question = {
  wordId: string;
  prompt: string;
  pronunciation: string | null;
  options: string[];
};

/** S05 — Làm Quiz (mục 3.3 BA doc): 10 câu trắc nghiệm 4 lựa chọn */
export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/user/topics/${id}/quiz`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Không tải được quiz");
        setQuestions(data.questions);
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  const q = questions[current];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  function select(option: string) {
    setAnswers((a) => ({ ...a, [q.wordId]: option }));
    // Tự động chuyển câu tiếp theo
    if (current < questions.length - 1) {
      setTimeout(() => setCurrent((c) => c + 1), 250);
    }
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/user/topics/${id}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: questions.map((qq) => ({ wordId: qq.wordId, selected: answers[qq.wordId] })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Nộp bài thất bại");
      router.push(`/topics/${id}/quiz/result`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <Shell id={id}>
        <p className="animate-scale-in rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      </Shell>
    );
  }
  if (!q) {
    return (
      <Shell id={id}>
        <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
          <span className="h-8 w-8 animate-spin-slow rounded-full border-2 border-brand-200 border-t-brand-500" />
          Đang tạo đề quiz...
        </div>
      </Shell>
    );
  }

  return (
    <Shell id={id}>
      <div className="mb-2 flex items-center justify-between text-sm text-gray-500">
        <span className="font-semibold">Câu {current + 1} / {questions.length}</span>
        <span>Đã trả lời: {answeredCount}/{questions.length}</span>
      </div>
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div className="h-full rounded-full bg-brand-gradient transition-all duration-500"
          style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
      </div>

      <div key={q.wordId} className="min-h-[24rem] flex-1 animate-scale-in rounded-3xl border border-gray-100 bg-white p-6 shadow-soft">
        <p className="text-sm text-gray-500">Nghĩa của từ sau là gì?</p>
        <div className="mt-1 flex items-center gap-2">
          <h2 className="text-2xl font-extrabold">{q.prompt}</h2>
          {ttsAvailable() && (
            <button
              onClick={() => speakEN(q.prompt)}
              aria-label="Nghe phát âm từ vựng"
              title="Nghe phát âm từ vựng"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-base text-brand-700 transition-all hover:scale-110 hover:bg-brand-100 active:scale-95"
            >
              🔊
            </button>
          )}
        </div>
        {q.pronunciation && <p className="text-brand-500">{q.pronunciation}</p>}

        <div className="mt-5 space-y-2">
          {q.options.map((opt, i) => {
            const selected = answers[q.wordId] === opt;
            return (
              <button
                key={opt}
                onClick={() => select(opt)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                  selected
                    ? "scale-[1.02] border-brand-500 bg-brand-50 font-semibold shadow-soft"
                    : "border-gray-200 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-gray-50"
                }`}
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    selected ? "bg-brand-gradient text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Điều hướng câu hỏi — luôn nằm sát cạnh dưới màn hình */}
      <div className="mt-auto flex flex-wrap justify-center gap-1.5 pt-4">
        {questions.map((qq, i) => (
          <button
            key={qq.wordId}
            onClick={() => setCurrent(i)}
            className={`h-8 w-8 rounded-full text-xs font-semibold transition-all ${
              i === current
                ? "scale-110 bg-brand-gradient text-white shadow-glow"
                : answers[qq.wordId]
                ? "bg-brand-100 text-brand-700"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <button
        onClick={submit}
        disabled={!allAnswered || submitting}
        className="btn-gradient mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-40"
      >
        {submitting && <span className="h-4 w-4 animate-spin-slow rounded-full border-2 border-white/40 border-t-white" />}
        {submitting ? "Đang chấm điểm..." : "Nộp bài"}
      </button>
    </Shell>
  );
}

function Shell({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6">
      <Link href={`/topics/${id}`} className="text-sm font-medium text-brand-600 hover:underline">
        ← Thoát quiz
      </Link>
      <div className="mt-4 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
