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

/** S03 — Chi tiet chu de */
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
    // Tu dong them vao danh sach hoc (muc 6.1 buoc 2)
    await fetch(`/api/user/topics/${id}/start`, { method: "POST" });
    router.push(`/topics/${id}/learn`);
  }

  if (notFound) return <Shell><p className="text-center text-gray-500">Khong tim thay chu de.</p></Shell>;
  if (!topic) return <Shell><p className="text-center text-gray-400">Dang tai...</p></Shell>;

  return (
    <Shell>
      {topic.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={topic.thumbnailUrl} alt={topic.title} className="mb-4 h-44 w-full rounded-xl object-cover" />
      ) : (
        <div className="mb-4 flex h-44 w-full items-center justify-center rounded-xl bg-brand-50 text-6xl">📚</div>
      )}

      <div className="mb-2 flex items-center gap-2">
        <LevelBadge level={topic.level} />
        <StatusBadge status={topic.myTopic?.status ?? null} />
      </div>
      <h1 className="text-2xl font-bold">{topic.title}</h1>
      <p className="text-gray-500">{topic.titleVi}</p>
      {topic.description && <p className="mt-3 text-sm text-gray-600">{topic.description}</p>}

      <div className="mt-4 flex gap-4 text-sm text-gray-500">
        <span>📝 {topic.wordCount} tu vung</span>
        <span>⭐ +{topic.gloryReward} Glory khi pass quiz</span>
        {topic.myTopic && (
          <span>✅ Da hoc {topic.myTopic.wordsLearned.length}/{topic.wordCount} tu</span>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button onClick={startLearning} disabled={starting}
          className="flex-1 rounded-lg bg-brand-600 px-4 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-50">
          {topic.myTopic ? "Tiep tuc hoc" : "Bat dau hoc"}
        </button>
        {topic.myTopic && (
          <Link href={`/topics/${id}/quiz`}
            className="flex-1 rounded-lg border border-brand-600 px-4 py-3 text-center font-medium text-brand-600 hover:bg-brand-50">
            Lam Quiz
          </Link>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-6">
      <Link href="/" className="text-sm text-brand-600 hover:underline">← Trang chu</Link>
      <div className="mt-4">{children}</div>
    </div>
  );
}
