"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Question = {
  wordId: string;
  prompt: string;
  pronunciation: string | null;
  options: string[];
};

/** S05 — Lam Quiz (muc 3.3 BA doc): 10 cau trac nghiem 4 lua chon */
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
        if (!r.ok) throw new Error(data.error ?? "Khong tai duoc quiz");
        setQuestions(data.questions);
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  const q = questions[current];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  function select(option: string) {
    setAnswers((a) => ({ ...a, [q.wordId]: option }));
    // Tu dong chuyen cau tiep theo
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
      if (!res.ok) throw new Error(data.error ?? "Nop bai that bai");
      router.push(`/topics/${id}/quiz/result`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <Shell id={id}>
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>
      </Shell>
    );
  }
  if (!q) return <Shell id={id}><p className="text-center text-gray-400">Dang tao de quiz...</p></Shell>;

  return (
    <Shell id={id}>
      <div className="mb-2 flex items-center justify-between text-sm text-gray-500">
        <span>Cau {current + 1} / {questions.length}</span>
        <span>Da tra loi: {answeredCount}/{questions.length}</span>
      </div>
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div className="h-full bg-brand-600 transition-all"
          style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Nghia cua tu sau la gi?</p>
        <h2 className="mt-1 text-2xl font-bold">{q.prompt}</h2>
        {q.pronunciation && <p className="text-gray-400">{q.pronunciation}</p>}

        <div className="mt-5 space-y-2">
          {q.options.map((opt) => (
            <button key={opt} onClick={() => select(opt)}
              className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${answers[q.wordId] === opt ? "border-brand-600 bg-brand-50 font-medium" : "border-gray-200 hover:bg-gray-50"}`}>
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Dieu huong cau hoi */}
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {questions.map((qq, i) => (
          <button key={qq.wordId} onClick={() => setCurrent(i)}
            className={`h-8 w-8 rounded-full text-xs font-medium ${i === current ? "bg-brand-600 text-white" : answers[qq.wordId] ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-500"}`}>
            {i + 1}
          </button>
        ))}
      </div>

      <button onClick={submit} disabled={!allAnswered || submitting}
        className="mt-6 w-full rounded-lg bg-brand-600 px-4 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-40">
        {submitting ? "Dang cham diem..." : "Nop bai"}
      </button>
    </Shell>
  );
}

function Shell({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-6">
      <Link href={`/topics/${id}`} className="text-sm text-brand-600 hover:underline">← Thoat quiz</Link>
      <div className="mt-4">{children}</div>
    </div>
  );
}
