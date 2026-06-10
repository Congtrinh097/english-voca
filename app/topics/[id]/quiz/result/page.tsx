"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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

/** S06 — Ket qua Quiz: diem + Glory + hanh dong tiep theo */
export default function QuizResultPage() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<Result | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/user/topics/${id}/quiz-result`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setResult)
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <p className="text-gray-500">Chua co ket qua quiz cho chu de nay.</p>
        <Link href={`/topics/${id}/quiz`} className="mt-4 inline-block text-brand-600 hover:underline">
          Lam quiz ngay →
        </Link>
      </div>
    );
  }
  if (!result) return <p className="py-10 text-center text-gray-400">Dang tai...</p>;

  const pct = Number(result.percentage);

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-10">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="text-6xl">{result.passed ? "🎉" : "😢"}</div>
        <h1 className="mt-3 text-2xl font-bold">
          {result.passed ? "PASSED!" : "Chua dat"}
        </h1>
        <p className="text-sm text-gray-500">{result.topic.title} — {result.topic.titleVi}</p>

        <p className="mt-4 text-5xl font-bold">{result.score}<span className="text-2xl text-gray-400">/{result.totalQuestions}</span></p>
        <p className={`mt-1 font-medium ${result.passed ? "text-green-600" : "text-red-600"}`}>{pct.toFixed(0)}%</p>

        {result.passed ? (
          <p className="mt-3 inline-block rounded-full bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700">
            ⭐ +{result.topic.gloryReward} Glory (neu pass lan dau)
          </p>
        ) : (
          <p className="mt-3 text-sm text-gray-500">Can ≥ 80% de pass. Co len, ban co the thi lai!</p>
        )}
      </div>

      {/* Chi tiet tung cau */}
      {result.answers && (
        <div className="mt-6 space-y-2">
          {result.answers.map((a, i) => (
            <div key={i} className={`rounded-lg border p-3 text-sm ${a.correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
              <p className="font-medium">{i + 1}. {a.word}</p>
              <p className={a.correct ? "text-green-700" : "text-red-700"}>
                Ban chon: {a.selected} {a.correct ? "✓" : `✗ — Dap an: ${a.correctAnswer}`}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2">
        {!result.passed && (
          <Link href={`/topics/${id}/quiz`}
            className="rounded-lg bg-brand-600 px-4 py-3 text-center font-medium text-white hover:bg-brand-700">
            Thi lai
          </Link>
        )}
        <Link href={`/topics/${id}/learn`}
          className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-center font-medium hover:bg-gray-50">
          On lai flashcard
        </Link>
        <Link href="/my-list"
          className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-center font-medium hover:bg-gray-50">
          Ve danh sach hoc
        </Link>
      </div>
    </div>
  );
}
