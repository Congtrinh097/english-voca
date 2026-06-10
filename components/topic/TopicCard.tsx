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
      className="lift group block overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-card hover:shadow-soft"
    >
      <div className="relative mb-3 overflow-hidden rounded-xl">
        {topic.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={topic.thumbnailUrl}
            alt={topic.title}
            className="h-28 w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex h-28 w-full items-center justify-center bg-brand-gradient-soft text-3xl transition-transform duration-500 group-hover:scale-110">
            <span className="transition-transform duration-500 group-hover:-rotate-6">📚</span>
          </div>
        )}
        <div className="absolute left-2 top-2">
          <LevelBadge level={topic.level} />
        </div>
        {topic.myStatus && (
          <div className="absolute right-2 top-2">
            <StatusBadge status={topic.myStatus} />
          </div>
        )}
      </div>
      <div className="px-1 pb-1">
        <h3 className="font-bold leading-tight transition-colors group-hover:text-brand-600">
          {topic.title}
        </h3>
        <p className="text-sm text-gray-500">{topic.titleVi}</p>
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gray-400">
          📝 {topic.wordCount} từ vựng
        </p>
      </div>
    </Link>
  );
}
