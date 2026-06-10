"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LevelBadge, StatusBadge } from "@/components/ui/badges";

type TopicDetail = {
  id: string;
  title: string;
  titleVi: string;
  description: string | null;
  level: string;
  gloryReward: number;
  thumbnailUrl: string | null;
  wordCount: number;
  myTopic: { status: string; wordsLearned: string[] } | null;
};

/** S03 — Chi tiết chủ đề */
export default function TopicDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetch(`/api/topics/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setTopic)
      .catch(() => setNotFound(true));
  }, [id]);

  async function startLearning() {
    setStarting(true);
    // Tự động thêm vào danh sách học (mục 6.1 bước 2)
    await fetch(`/api/user/topics/${id}/start`, { method: "POST" });
    router.push(`/topics/${id}/learn`);
  }

  if (notFound) return <Shell><p className="py-10 text-center text-gray-500">Không tìm thấy chủ đề.</p></Shell>;
  if (!topic) {
    return (
      <Shell>
        <div className="skeleton mb-4 h-44 w-full rounded-2xl" />
        <div className="skeleton mb-2 h-6 w-2/3 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
      </Shell>
    );
  }

  const learned = topic.myTopic?.wordsLearned.length ?? 0;
  const pct = Math.round((learned / Math.max(topic.wordCount, 1)) * 100);

  return (
    <Shell>
      <div className="animate-fade-up">
        <div className="relative mb-4 overflow-hidden rounded-2xl shadow-card">
          {topic.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={topic.thumbnailUrl} alt={topic.title} className="h-44 w-full object-cover" />
          ) : (
            <div className="flex h-44 w-full items-center justify-center bg-brand-gradient-soft text-6xl">
              <span className="animate-float">📚</span>
            </div>
          )}
        </div>

        <div className="mb-2 flex items-center gap-2">
          <LevelBadge level={topic.level} />
          <StatusBadge status={topic.myTopic?.status ?? null} />
        </div>
        <h1 className="text-2xl font-extrabold">{topic.title}</h1>
        <p className="text-gray-500">{topic.titleVi}</p>
        {topic.description && <p className="mt-3 text-sm leading-relaxed text-gray-600">{topic.description}</p>}

        {/* Thẻ thông tin */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <InfoCard icon="📝" label="Từ vựng" value={`${topic.wordCount} từ`} />
          <InfoCard icon="⭐" label="Phần thưởng" value={`+${topic.gloryReward} Glory`} />
          {topic.myTopic && <InfoCard icon="✅" label="Đã học" value={`${learned}/${topic.wordCount}`} />}
        </div>

        {topic.myTopic && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-gray-400">
              <span>Tiến độ</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-brand-gradient transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={startLearning}
            disabled={starting}
            className="btn-gradient flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {starting && <span className="h-4 w-4 animate-spin-slow rounded-full border-2 border-white/40 border-t-white" />}
            {topic.myTopic ? "Tiếp tục học" : "Bắt đầu học"}
          </button>
          {topic.myTopic && (
            <Link
              href={`/topics/${id}/quiz`}
              className="flex flex-1 items-center justify-center rounded-xl border-2 border-brand-500 px-4 py-3 text-center font-semibold text-brand-600 transition-colors hover:bg-brand-50"
            >
              🎯 Làm Quiz
            </Link>
          )}
        </div>
      </div>
    </Shell>
  );
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-card">
      <div className="text-xl">{icon}</div>
      <p className="mt-1 font-bold leading-tight">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
        ← Trang chủ
      </Link>
      <div className="mt-4">{children}</div>
    </div>
  );
}
