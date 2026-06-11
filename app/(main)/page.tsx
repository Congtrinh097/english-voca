"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TopicCard, TopicCardData } from "@/components/topic/TopicCard";
import { rankFor } from "@/lib/glory-rank";

const FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "beginner", label: "Cơ bản" },
  { value: "middle", label: "Trung cấp" },
  { value: "master", label: "Nâng cao" },
] as const;

/** S01 — Trang chủ (mục 3.1 BA doc): gợi ý + danh sách + tìm kiếm + bộ lọc */
export default function HomePage() {
  const [suggested, setSuggested] = useState<TopicCardData[]>([]);
  const [topics, setTopics] = useState<TopicCardData[]>([]);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalGlory, setTotalGlory] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/topics/suggested")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setSuggested(d.items ?? []));
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => setTotalGlory(me?.totalGlory ?? null));
  }, []);

  const loadTopics = useCallback(
    async (p: number, q: string, lv: string, append: boolean) => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(p) });
      if (q) params.set("search", q);
      if (lv !== "all") params.set("level", lv);
      const res = await fetch(`/api/topics?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTopics((prev) => (append ? [...prev, ...data.items] : data.items));
        setHasMore(data.hasMore);
        setPage(p);
      }
      setLoading(false);
    },
    []
  );

  // Tìm kiếm real-time, debounce 300ms (mục 3.1.2 BA doc)
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadTopics(1, search, level, false), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, level, loadTopics]);

  // Cuộn vô hạn
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadTopics(page + 1, search, level, true);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, page, search, level, loadTopics]);

  return (
    <div>
      {/* Hero */}
      <section className="relative mb-8 overflow-hidden rounded-3xl bg-brand-gradient p-6 text-white shadow-glow sm:p-8">
        <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 -left-6 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="relative animate-fade-up">
          <p className="text-sm font-medium text-white/80">Chào mừng trở lại 👋</p>
          <h1 className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl">
            Học từ vựng tiếng Anh <br className="hidden sm:block" /> theo chủ đề mỗi ngày
          </h1>
          <p className="mt-2 max-w-md text-sm text-white/85">
            Flashcard tương tác, quiz trắc nghiệm và Glory Points giúp bạn ghi nhớ lâu hơn.
          </p>
          {/* Glory + danh hiệu của người dùng */}
          {totalGlory !== null && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold backdrop-blur-sm ring-1 ring-white/30">
                ⭐ {totalGlory.toLocaleString("vi-VN")} Glory
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold backdrop-blur-sm ring-1 ring-white/30">
                {rankFor(totalGlory).emoji} {rankFor(totalGlory).title}
              </span>
            </div>
          )}
        </div>
        <span className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 animate-float text-7xl sm:block">
          🚀
        </span>
      </section>

      {/* Khu vực gợi ý */}
      {suggested.length > 0 && (
        <section className="mb-8 animate-fade-up">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <span className="text-xl">✨</span> Gợi ý cho bạn
          </h2>
          <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-3">
            {suggested.map((t) => (
              <TopicCard key={t.id} topic={t} />
            ))}
          </div>
        </section>
      )}

      {/* Tìm kiếm + bộ lọc */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <span className="text-xl">📚</span> Tất cả chủ đề
        </h2>

        <div className="relative mb-3">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          <input
            type="search"
            placeholder="Tìm kiếm chủ đề..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 shadow-sm outline-none transition-all focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setLevel(f.value)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                level === f.value
                  ? "scale-105 bg-brand-gradient text-white shadow-glow"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-brand-200 hover:text-brand-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && topics.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((t) => (
              <TopicCard key={t.id} topic={t} />
            ))}
          </div>
        )}

        {loading && topics.length > 0 && (
          <p className="py-6 text-center text-sm text-gray-400">Đang tải thêm...</p>
        )}
        {!loading && topics.length === 0 && (
          <div className="py-12 text-center">
            <div className="mb-3 text-5xl">🔎</div>
            <p className="text-gray-500">Không tìm thấy chủ đề nào</p>
            <p className="mt-1 text-sm text-gray-400">Thử từ khóa khác hoặc đổi bộ lọc nhé.</p>
          </div>
        )}
        <div ref={sentinelRef} className="h-2" />
      </section>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-card">
      <div className="skeleton mb-3 h-28 w-full rounded-xl" />
      <div className="skeleton mb-2 h-4 w-3/4 rounded" />
      <div className="skeleton mb-3 h-3 w-1/2 rounded" />
      <div className="skeleton h-3 w-1/3 rounded" />
    </div>
  );
}
