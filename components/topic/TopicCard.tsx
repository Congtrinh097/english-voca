import Link from "next/link";
import { LevelBadge, StatusBadge } from "@/components/ui/badges";
import { themeFor } from "@/lib/topic-theme";

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
  const theme = themeFor(topic.id);
  return (
    <Link
      href={`/topics/${topic.id}`}
      className="lift group block overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-card hover:shadow-soft"
    >
      <div className="relative mb-3 overflow-hidden rounded-xl">
        {topic.thumbnailUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={topic.thumbnailUrl}
              alt={topic.title}
              className="h-28 w-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            {/* Lớp phủ tối nhẹ phía dưới giúp badge và ảnh nổi khối hơn */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
          </>
        ) : (
          <div
            className="relative flex h-28 w-full items-center justify-center overflow-hidden"
            style={{ background: theme.gradient }}
          >
            {/* Họa tiết trang trí: vòng tròn mờ + emoji chìm ở góc */}
            <span className="absolute -left-5 -top-6 h-20 w-20 rounded-full bg-white/15" />
            <span className="absolute -bottom-8 -right-4 h-24 w-24 rounded-full bg-white/10" />
            <span className="absolute right-3 top-2 h-2.5 w-2.5 rounded-full bg-white/40" />
            <span className="absolute bottom-4 left-5 h-1.5 w-1.5 rounded-full bg-white/40" />
            <span className="absolute -bottom-2 right-2 select-none text-5xl opacity-20">
              {theme.emoji}
            </span>
            <span className="relative text-4xl drop-shadow-md transition-transform duration-500 group-hover:scale-125 group-hover:-rotate-6">
              {theme.emoji}
            </span>
            {/* Vệt sáng quét qua khi hover */}
            <span className="absolute inset-0 -translate-x-full bg-shine transition-transform duration-700 group-hover:translate-x-full" />
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
