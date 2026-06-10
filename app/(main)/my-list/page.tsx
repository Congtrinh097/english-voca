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
  { value: "in_progress", label: "Đang học", icon: "📘" },
  { value: "passed", label: "Đã đạt", icon: "✅" },
  { value: "failed", label: "Chưa đạt", icon: "🔁" },
] as const;

/** S02 — Danh sách học (mục 3.5 BA doc): tab Đang học / Đã đạt / Chưa đạt */
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
      <h1 className="mb-4 text-2xl font-extrabold">Danh sách học</h1>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
              tab === t.value
                ? "scale-105 bg-brand-gradient text-white shadow-glow"
                : "border border-gray-200 bg-white text-gray-600 hover:border-brand-200 hover:text-brand-600"
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-24 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="py-12 text-center animate-fade-up">
          <div className="mb-3 text-5xl">🗂️</div>
          <p className="text-gray-500">Chưa có chủ đề nào ở đây.</p>
          <Link
            href="/"
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-gradient px-5 py-2 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-105"
          >
            Khám phá ngay →
          </Link>
        </div>
      )}

      <div className="stagger space-y-3">
        {!loading &&
          items.map((it) => (
            <div
              key={it.id}
              className="lift flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-card"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <LevelBadge level={it.topic.level} />
                  <StatusBadge status={it.status} />
                </div>
                <p className="truncate font-bold">{it.topic.title}</p>
                <p className="text-sm text-gray-500">{it.topic.titleVi}</p>
                {/* Thanh tiến độ học */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-brand-gradient transition-all duration-700"
                      style={{
                        width: `${Math.round(
                          (it.wordsLearnedCount / Math.max(it.topic.wordCount, 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">
                    {it.wordsLearnedCount}/{it.topic.wordCount} từ
                  </span>
                </div>
              </div>
              <Link
                href={it.status === "failed" ? `/topics/${it.topicId}/quiz` : `/topics/${it.topicId}/learn`}
                className="shrink-0 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-105"
              >
                {it.status === "failed" ? "Thi lại" : it.status === "passed" ? "Ôn lại" : "Tiếp tục"}
              </Link>
            </div>
          ))}
      </div>
    </div>
  );
}
