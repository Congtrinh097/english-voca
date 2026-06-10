const LEVEL_STYLES: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  middle: "bg-amber-100 text-amber-700",
  master: "bg-purple-100 text-purple-700",
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  middle: "Middle",
  master: "Master",
};

export function LevelBadge({ level }: { level: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${LEVEL_STYLES[level] ?? "bg-gray-100 text-gray-600"}`}>
      {LEVEL_LABELS[level] ?? level}
    </span>
  );
}

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  in_progress: { label: "Dang hoc", cls: "bg-gray-200 text-gray-700" },
  passed: { label: "Da pass", cls: "bg-green-100 text-green-700" },
  failed: { label: "Chua dat", cls: "bg-red-100 text-red-700" },
};

export function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const s = STATUS_STYLES[status];
  if (!s) return null;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}
