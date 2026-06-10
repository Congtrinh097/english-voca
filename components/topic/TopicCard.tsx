import Link from "next/link";
import { LevelBadge, StatusBadge } from "@/components/ui/badges";

export type TopicCardData = {
  id: string;
  title: string;
  titleVi: string;
  level: string;
  thumbnailUrl?: string | null;
  wordCount: number;
  myStatus?: string | null;
};

export function TopicCard({ topic }: { topic: TopicCardData }) {
  return (
    <Link
      href={`/topics/${topic.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      {topic.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={topic.thumbnailUrl}
          alt={topic.title}
          className="mb-3 h-28 w-full rounded-lg object-cover"
          loading="lazy"
        />
      ) : (
        <div className="mb-3 flex h-28 w-full items-center justify-center rounded-lg bg-brand-50 text-3xl">
          📚
        </div>
      )}
      <div className="mb-1 flex items-center justify-between gap-2">
        <LevelBadge level={topic.level} />
        <StatusBadge status={topic.myStatus ?? null} />
      </div>
      <h3 className="font-semibold leading-tight">{topic.title}</h3>
      <p className="text-sm text-gray-500">{topic.titleVi}</p>
      <p className="mt-2 text-xs text-gray-400">{topic.wordCount} tu vung</p>
    </Link>
  );
}
