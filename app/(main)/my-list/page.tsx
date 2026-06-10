"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LevelBadge, StatusBadge } from "@/components/ui/badges";

type Item = {
  id: string;
  topicId: string;
  status: "in_progress" | "passed" | "failed";
  wordsLearnedCount: number;
  topic: { id: string; title: string; titleVi: string; level: string; wordCount: number };
};

const TABS = [
  { value: "in_progress", label: "Dang hoc" },
  { value: "passed", label: "Da pass" },
  { value: "failed", label: "Chua dat" },
] as const;

/** S02 — Danh sach hoc (muc 3.5 BA doc): tab In Progress / Passed / Failed */
export default function MyListPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [tab, setTab] = useState<string>("in_progress");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/user/topics?status=${tab}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items ?? []))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Danh sach hoc</h1>

      <div className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === t.value ? "bg-brand-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="py-8 text-center text-gray-400">Dang tai...</p>}
      {!loading && items.length === 0 && (
        <p className="py-8 text-center text-gray-400">
          Chua co chu de nao. <Link href="/" className="text-brand-600 hover:underline">Kham pha ngay →</Link>
        </p>
      )}

      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <LevelBadge level={it.topic.level} />
                <StatusBadge status={it.status} />
              </div>
              <p className="truncate font-semibold">{it.topic.title}</p>
              <p className="text-sm text-gray-500">
                Da hoc {it.wordsLearnedCount}/{it.topic.wordCount} tu
              </p>
            </div>
            <Link
              href={it.status === "failed" ? `/topics/${it.topicId}/quiz` : `/topics/${it.topicId}/learn`}
              className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              {it.status === "failed" ? "Thi lai" : it.status === "passed" ? "On lai" : "Tiep tuc"}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
