const LEVEL_STYLES: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  middle: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  master: "bg-purple-100 text-purple-700 ring-1 ring-purple-200",
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Cơ bản",
  middle: "Trung cấp",
  master: "Nâng cao",
};

export function LevelBadge({ level }: { level: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        LEVEL_STYLES[level] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {LEVEL_LABELS[level] ?? level}
    </span>
  );
}

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  in_progress: { label: "Đang học", cls: "bg-blue-100 text-blue-700 ring-1 ring-blue-200" },
  passed: { label: "Đã đạt", cls: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" },
  failed: { label: "Chưa đạt", cls: "bg-red-100 text-red-700 ring-1 ring-red-200" },
};

export function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const s = STATUS_STYLES[status];
  if (!s) return null;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}
