"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { speakEN, ttsAvailable } from "@/lib/tts";
import { getSettings } from "@/lib/settings";

type Word = {
  id: string;
  word: string;
  pronunciation: string | null;
  partOfSpeech: string | null;
  definition: string;
  example: string;
  meaningVi: string;
};

/** Sinh câu ví dụ dạng câu hỏi có dùng từ vựng, dựa theo loại từ */
function exampleQuestion(w: Word): string {
  const pos = (w.partOfSpeech ?? "").toLowerCase();
  if (pos.startsWith("adj")) return `Do you think it should be more ${w.word}?`;
  if (pos.startsWith("adv")) return `Can you do it ${w.word}?`;
  if (pos.startsWith("v")) return `How often do you ${w.word}?`;
  if (pos.startsWith("n")) return `Can you give an example of "${w.word}"?`;
  return `Can you use "${w.word}" in a sentence?`;
}

/** Gợi ý ngắn gọn khi nào dùng từ, dựa theo loại từ */
function usageHint(w: Word): string {
  const pos = (w.partOfSpeech ?? "").toLowerCase();
  if (pos.startsWith("adj"))
    return `Dùng làm tính từ — đặt trước danh từ hoặc sau "to be" để mô tả tính chất, đặc điểm.`;
  if (pos.startsWith("adv"))
    return `Dùng làm trạng từ — bổ nghĩa cho động từ hoặc tính từ, chỉ cách thức/mức độ.`;
  if (pos.startsWith("v"))
    return `Dùng làm động từ — diễn tả hành động hoặc trạng thái; chú ý chia thì phù hợp.`;
  if (pos.startsWith("n"))
    return `Dùng làm danh từ — chỉ người, sự vật hoặc khái niệm; có thể làm chủ ngữ/tân ngữ.`;
  return `Xem câu ví dụ ở mặt trước để biết ngữ cảnh sử dụng phù hợp.`;
}

/**
 * S04 — Học Flashcard (mục 3.2 BA doc)
 * Lật thẻ, vuốt trái/phải, nút < >, phát âm TTS, đánh dấu Đã học, nút Làm Quiz sau khi xem hết
 */
export default function LearnPage() {
  const { id } = useParams<{ id: string }>();
  const [words, setWords] = useState<Word[]>([]);
  const [learned, setLearned] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [maxSeen, setMaxSeen] = useState(0);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(false);
  // Hướng chuyển thẻ gần nhất: 1 = tiến (trượt từ phải), -1 = lùi (trượt từ trái), 0 = mới vào
  const [slideDir, setSlideDir] = useState<0 | 1 | -1>(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setTtsSupported(ttsAvailable());
    setAutoSpeak(getSettings().autoSpeak);
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
        if (next !== i) setSlideDir(dir);
        setMaxSeen((m) => Math.max(m, next));
        return next;
      });
      setFlipped(false);
    },
    [words.length]
  );

  // Phím tắt: mũi tên + phím cách
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

  const speak = useCallback((text: string) => {
    if (ttsSupported) speakEN(text);
  }, [ttsSupported]);

  // Tự động phát âm từ vựng khi chuyển sang flashcard mới (tắt được trong Hồ sơ)
  const currentWord = current?.word;
  useEffect(() => {
    if (autoSpeak && currentWord) speak(currentWord);
  }, [autoSpeak, currentWord, speak]);

  async function markLearned() {
    if (!current || learned.has(current.id)) return;
    setLearned((s) => new Set(s).add(current.id));
    await fetch(`/api/user/topics/${id}/words/${current.id}`, { method: "PATCH" });
  }

  if (!words.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-gray-400">
        <span className="h-8 w-8 animate-spin-slow rounded-full border-2 border-brand-200 border-t-brand-500" />
        Đang tải flashcard...
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6">
      <div className="mb-4 flex items-center justify-between text-sm">
        <Link href={`/topics/${id}`} className="font-medium text-brand-600 hover:underline">← Thoát</Link>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-500 shadow-sm">
          {index + 1} / {words.length}
        </span>
      </div>

      {/* Thanh tiến độ */}
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div className="h-full rounded-full bg-brand-gradient transition-all duration-500"
          style={{ width: `${((index + 1) / words.length) * 100}%` }} />
      </div>

      {/* Flashcard: chạm để lật, vuốt để chuyển */}
      <div
        key={current.id}
        className={`flip-card flex min-h-[28rem] w-full flex-1 cursor-pointer select-none ${
          slideDir === 1 ? "animate-slide-in-right" : slideDir === -1 ? "animate-slide-in-left" : "animate-scale-in"
        } ${flipped ? "flipped" : ""}`}
        onClick={() => setFlipped((f) => !f)}
        onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (dx < -50) go(1); // vuốt trái → từ tiếp theo
          else if (dx > 50) go(-1); // vuốt phải → từ trước
          touchStartX.current = null;
        }}
      >
        {/* Flex item stretch theo chiều cao thẻ — không dùng h-full vì cha có chiều cao không cố định */}
        <div className="flip-inner relative w-full">
          {/* Mặt trước — tiếng Anh */}
          <div className="flip-face absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white p-6 shadow-soft">
            <div className="flex items-center gap-2">
              <h2 className="text-center text-3xl font-extrabold">{current.word}</h2>
              {ttsSupported && (
                <button
                  onClick={(e) => { e.stopPropagation(); speak(current.word); }}
                  aria-label="Nghe phát âm từ vựng"
                  title="Nghe phát âm từ vựng"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-base text-brand-700 transition-all hover:scale-110 hover:bg-brand-100 active:scale-95"
                >
                  🔊
                </button>
              )}
            </div>
            {current.pronunciation && <p className="mt-1 text-brand-500">{current.pronunciation}</p>}
            {current.partOfSpeech && <p className="text-sm italic text-gray-400">{current.partOfSpeech}</p>}
            <p className="mt-4 text-center text-sm text-gray-700">{current.definition}</p>
            <p className="mt-2 text-center text-sm italic text-gray-500">&ldquo;{current.example}&rdquo;</p>
            <p className="mt-2 text-center text-sm italic text-brand-600">
              🤔 &ldquo;{exampleQuestion(current)}&rdquo;
            </p>
            <p className="absolute bottom-3 text-xs text-gray-300">Chạm để lật thẻ</p>
          </div>
          {/* Mặt sau — tiếng Việt */}
          <div className="flip-face flip-back absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-brand-gradient p-6 shadow-glow">
            <p className="text-xs font-medium uppercase tracking-wide text-white/70">Nghĩa tiếng Việt</p>
            <p className="mt-2 text-center text-3xl font-extrabold text-white">{current.meaningVi}</p>

            {/* Khi nào dùng */}
            <p className="mt-5 max-w-xs text-center text-sm leading-relaxed text-white/80">
              💡 {usageHint(current)}
            </p>
          </div>
        </div>
      </div>

      {/* Điều hướng + đánh dấu — luôn nằm sát cạnh dưới màn hình */}
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <button onClick={() => go(-1)} disabled={index === 0}
          className="grid h-12 w-12 place-items-center rounded-full border border-gray-200 bg-white text-xl font-bold shadow-sm transition-transform hover:scale-105 disabled:opacity-30">
          ‹
        </button>
        <button onClick={markLearned} disabled={learned.has(current.id)}
          className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
            learned.has(current.id)
              ? "bg-emerald-100 text-emerald-700"
              : "border border-gray-200 bg-white hover:border-brand-200 hover:text-brand-600"
          }`}>
          {learned.has(current.id) ? "✓ Đã học" : "Đánh dấu đã học"}
        </button>
        <button onClick={() => go(1)} disabled={index === words.length - 1}
          className="grid h-12 w-12 place-items-center rounded-full border border-gray-200 bg-white text-xl font-bold shadow-sm transition-transform hover:scale-105 disabled:opacity-30">
          ›
        </button>
      </div>

      {/* Nút Làm Quiz — hiện sau khi xem hết flashcard */}
      {seenAll && (
        <Link href={`/topics/${id}/quiz`}
          className="btn-gradient mt-4 animate-fade-up rounded-xl px-4 py-3 text-center font-semibold text-white">
          🎯 Làm Quiz ngay
        </Link>
      )}
    </div>
  );
}
