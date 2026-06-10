"use client";

import { useEffect, useState } from "react";

type Entry = { id: string; name: string; avatarUrl: string | null; totalGlory: number; rank: number };
type Me = Entry;

const MEDALS = ["🥇", "🥈", "🥉"];

/** S07 — Leaderboard: bang xep hang Glory Points */
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
      <h1 className="mb-4 text-2xl font-bold">🏆 Bang xep hang</h1>

      {me && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-brand-600 p-4 text-white">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold">#{me.rank}</span>
            <Avatar name={me.name} url={me.avatarUrl} />
            <span className="font-medium">{me.name} (ban)</span>
          </div>
          <span className="font-bold">⭐ {me.totalGlory}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {items.map((u) => (
          <div key={u.id}
            className={`flex items-center justify-between border-b border-gray-100 p-3 last:border-0 ${me?.id === u.id ? "bg-brand-50" : ""}`}>
            <div className="flex items-center gap-3">
              <span className="w-8 text-center font-bold text-gray-500">
                {MEDALS[u.rank - 1] ?? `#${u.rank}`}
              </span>
              <Avatar name={u.name} url={u.avatarUrl} />
              <span className="font-medium">{u.name}</span>
            </div>
            <span className="font-semibold text-amber-600">⭐ {u.totalGlory}</span>
          </div>
        ))}
        {items.length === 0 && <p className="p-6 text-center text-gray-400">Chua co du lieu</p>}
      </div>

      {hasMore && (
        <button onClick={() => setPage((p) => p + 1)}
          className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50">
          Xem them
        </button>
      )}
    </div>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} className="h-8 w-8 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
