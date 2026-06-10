"use client";

import { useEffect, useState } from "react";

type Entry = { id: string; name: string; avatarUrl: string | null; totalGlory: number; rank: number };
type Me = Entry;

const MEDALS = ["🥇", "🥈", "🥉"];

/** S07 — Bảng xếp hạng Glory Points */
export default function LeaderboardPage() {
  const [items, setItems] = useState<Entry[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetch("/api/leaderboard/me").then((r) => (r.ok ? r.json() : null)).then(setMe);
  }, []);

  useEffect(() => {
    fetch(`/api/leaderboard?page=${page}&limit=20`)
      .then((r) => (r.ok ? r.json() : { items: [], hasMore: false }))
      .then((d) => {
        setItems((prev) => (page === 1 ? d.items : [...prev, ...d.items]));
        setHasMore(d.hasMore);
      });
  }, [page]);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 flex items-center gap-2 text-2xl font-extrabold">
        <span className="animate-bounce-soft text-2xl">🏆</span> Bảng xếp hạng
      </h1>

      {me && (
        <div className="relative mb-5 overflow-hidden rounded-2xl bg-brand-gradient p-4 text-white shadow-glow animate-scale-in">
          <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-sm font-extrabold">
                #{me.rank}
              </span>
              <Avatar name={me.name} url={me.avatarUrl} ring />
              <div>
                <p className="font-semibold leading-tight">{me.name}</p>
                <p className="text-xs text-white/80">Vị trí của bạn</p>
              </div>
            </div>
            <span className="text-lg font-extrabold">⭐ {me.totalGlory}</span>
          </div>
        </div>
      )}

      <div className="stagger overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
        {items.map((u) => {
          const top3 = u.rank <= 3;
          return (
            <div
              key={u.id}
              className={`flex items-center justify-between border-b border-gray-50 p-3 transition-colors last:border-0 hover:bg-gray-50 ${
                me?.id === u.id ? "bg-brand-50/70" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`grid w-9 place-items-center text-center font-extrabold ${
                    top3 ? "text-xl" : "text-sm text-gray-400"
                  }`}
                >
                  {MEDALS[u.rank - 1] ?? `#${u.rank}`}
                </span>
                <Avatar name={u.name} url={u.avatarUrl} />
                <span className="font-semibold">{u.name}</span>
              </div>
              <span className="font-bold text-amber-500">⭐ {u.totalGlory}</span>
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="p-8 text-center text-gray-400">Chưa có dữ liệu</p>
        )}
      </div>

      {hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          className="mt-4 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:border-brand-200 hover:text-brand-600"
        >
          Xem thêm
        </button>
      )}
    </div>
  );
}

function Avatar({ name, url, ring }: { name: string; url: string | null; ring?: boolean }) {
  const ringCls = ring ? "ring-2 ring-white/70" : "";
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} className={`h-9 w-9 rounded-full object-cover ${ringCls}`} />;
  }
  return (
    <div
      className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-accent-500 text-sm font-bold text-white ${ringCls}`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
