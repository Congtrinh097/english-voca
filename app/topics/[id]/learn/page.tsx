"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Word = {
  id: string;
  word: string;
  pronunciation: string | null;
  partOfSpeech: string | null;
  definition: string;
  example: string;
  meaningVi: string;
};

/**
 * S04 — Hoc Flashcard (muc 3.2 BA doc)
 * Flip, swipe trai/phai, nut < >, Play TTS, danh dau Da hoc, nut Lam Quiz sau khi xem het
 */
export default function LearnPage() {
  const { id } = useParams<{ id: string }>();
  const [words, setWords] = useState<Word[]>([]);
  const [learned, setLearned] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [maxSeen, setMaxSeen] = useState(0);
  const [ttsSupported, setTtsSupported] = useState(true);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setTtsSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    Promise.all([
      fetch(`/api/topics/${id}/words`).then((r) => (r.ok ? r.json() : { items: [] })),
      fetch(`/api/topics/${id}`).then((r) => (r.ok ? r.json() : null)),
    ]).then(([w, t]) => {
      setWords(w.items ?? []);
      if (t?.myTopic?.wordsLearned) setLearned(new Set(t.myTopic.wordsLearned));
    });
  }, [id]);

  const current = words[index];
  const seenAll = maxSeen >= words.length - 1 && words.length > 0;

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => {
        const next = Math.min(Math.max(i + dir, 0), words.length - 1);
        setMaxSeen((m) => Math.max(m, next));
        return next;
      });
      setFlipped(false);
    },
    [words.length]
  );

  // Phim tat: mui ten + space
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  function speak() {
    if (!current || !ttsSupported) return;
    const u = new SpeechSynthesisUtterance(current.word);
    u.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  async function markLearned() {
    if (!current || learned.has(current.id)) return;
    setLearned((s) => new Set(s).add(current.id));
    await fetch(`/api/user/topics/${id}/words/${current.id}`, { method: "PATCH" });
  }

  if (!words.length) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        Dang tai flashcard...
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6">
      <div className="mb-4 flex items-center justify-between text-sm">
        <Link href={`/topics/${id}`} className="text-brand-600 hover:underline">← Thoat</Link>
        <span className="text-gray-500">{index + 1} / {words.length}</span>
      </div>

      {/* Thanh tien do */}
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div className="h-full bg-brand-600 transition-all"
          style={{ width: `${((index + 1) / words.length) * 100}%` }} />
      </div>

      {/* Flashcard: tap de flip, swipe de chuyen */}
      <div
        className={`flip-card h-80 w-full cursor-pointer select-none ${flipped ? "flipped" : ""}`}
        onClick={() => setFlipped((f) => !f)}
        onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (dx < -50) go(1); // swipe trai → tu tiep theo
          else if (dx > 50) go(-1); // swipe phai → tu truoc
          touchStartX.current = null;
        }}
      >
        <div className="flip-inner relative h-full w-full">
          {/* Mat truoc — tieng Anh */}
          <div className="flip-face absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
            <h2 className="text-center text-3xl font-bold">{current.word}</h2>
            {current.pronunciation && <p className="mt-1 text-gray-500">{current.pronunciation}</p>}
            {current.partOfSpeech && <p className="text-sm italic text-gray-400">{current.partOfSpeech}</p>}
            <p className="mt-4 text-center text-sm text-gray-700">{current.definition}</p>
            <p className="mt-2 text-center text-sm italic text-gray-500">&ldquo;{current.example}&rdquo;</p>
            {ttsSupported && (
              <button onClick={(e) => { e.stopPropagation(); speak(); }}
                className="mt-4 rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100">
                🔊 Play
              </button>
            )}
            <p className="absolute bottom-3 text-xs text-gray-300">Cham de lat the</p>
          </div>
          {/* Mat sau — tieng Viet */}
          <div className="flip-face flip-back absolute inset-0 flex items-center justify-center rounded-2xl bg-brand-600 p-6 shadow-lg">
            <p className="text-center text-3xl font-bold text-white">{current.meaningVi}</p>
          </div>
        </div>
      </div>

      {/* Dieu huong + danh dau */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button onClick={() => go(-1)} disabled={index === 0}
          className="rounded-full border border-gray-300 bg-white px-5 py-3 font-bold disabled:opacity-30">
          ‹
        </button>
        <button onClick={markLearned} disabled={learned.has(current.id)}
          className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium ${learned.has(current.id) ? "bg-green-100 text-green-700" : "bg-white border border-gray-300 hover:bg-gray-50"}`}>
          {learned.has(current.id) ? "✓ Da hoc" : "Danh dau da hoc"}
        </button>
        <button onClick={() => go(1)} disabled={index === words.length - 1}
          className="rounded-full border border-gray-300 bg-white px-5 py-3 font-bold disabled:opacity-30">
          ›
        </button>
      </div>

      {/* Nut Lam Quiz — hien sau khi xem het flashcard */}
      {seenAll && (
        <Link href={`/topics/${id}/quiz`}
          className="mt-4 rounded-lg bg-brand-600 px-4 py-3 text-center font-medium text-white hover:bg-brand-700">
          🎯 Lam Quiz
        </Link>
      )}
    </div>
  );
}
