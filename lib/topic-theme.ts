/** Bộ theme rực rỡ cho chủ đề không có ảnh — chọn cố định theo id để mỗi chủ đề một màu riêng */

export type TopicTheme = { gradient: string; emoji: string };

const TOPIC_THEMES: TopicTheme[] = [
  { gradient: "linear-gradient(135deg, #6366f1 0%, #a855f7 55%, #ec4899 100%)", emoji: "📚" },
  { gradient: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 55%, #7c3aed 100%)", emoji: "✈️" },
  { gradient: "linear-gradient(135deg, #f59e0b 0%, #f97316 55%, #ef4444 100%)", emoji: "🔥" },
  { gradient: "linear-gradient(135deg, #10b981 0%, #14b8a6 55%, #0ea5e9 100%)", emoji: "🌿" },
  { gradient: "linear-gradient(135deg, #ec4899 0%, #f43f5e 55%, #f97316 100%)", emoji: "🎯" },
  { gradient: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 55%, #0ea5e9 100%)", emoji: "🚀" },
  { gradient: "linear-gradient(135deg, #14b8a6 0%, #22c55e 55%, #84cc16 100%)", emoji: "🍀" },
  { gradient: "linear-gradient(135deg, #f43f5e 0%, #d946ef 55%, #8b5cf6 100%)", emoji: "💡" },
];

export function themeFor(id: string): TopicTheme {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return TOPIC_THEMES[hash % TOPIC_THEMES.length];
}
