"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TopicCard, TopicCardData } from "@/components/topic/TopicCard";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "beginner", label: "Beginner" },
  { value: "middle", label: "Middle" },
  { value: "master", label: "Master" },
] as const;

/** S01 — Trang chu (muc 3.1 BA doc): goi y + danh sach + tim kiem + bo loc */
export default function HomePage() {
  const [suggested, setSuggested] = useState<TopicCardData[]>([]);
  const [topics, setTopics] = useState<TopicCardData[]>([]);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/topics/suggested")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setSuggested(d.items ?? []));
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

  // Tim kiem real-time, debounce 300ms (muc 3.1.2 BA doc)
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadTopics(1, search, level, false), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, level, loadTopics]);

  // Infinite scroll
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
      {/* Khu vuc goi y */}
      {suggested.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold">✨ Goi y cho ban</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {suggested.map((t) => <TopicCard key={t.id} topic={t} />)}
          </div>
        </section>
      )}

      {/* Tim kiem + bo loc */}
      <section>
        <h2 className="mb-3 text-lg font-bold">📚 Tat ca chu de</h2>
        <input
          type="search"
          placeholder="Tim kiem chu de..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-brand-500"
        />
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button key={f.value} onClick={() => setLevel(f.value)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ${level === f.value ? "bg-brand-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((t) => <TopicCard key={t.id} topic={t} />)}
        </div>

        {loading && <p className="py-6 text-center text-gray-400">Dang tai...</p>}
        {!loading && topics.length === 0 && (
          <p className="py-6 text-center text-gray-400">Khong tim thay chu de nao</p>
        )}
        <div ref={sentinelRef} className="h-2" />
      </section>
    </div>
  );
}
