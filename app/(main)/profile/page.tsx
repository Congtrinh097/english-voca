"use client";

import { useCallback, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { LevelBadge, StatusBadge } from "@/components/ui/badges";

type Me = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  totalGlory: number;
  role: string;
  createdAt: string;
  hasPassword: boolean;
  hasGoogle: boolean;
};

type HistoryItem = {
  id: string;
  status: string;
  gloryEarned: number;
  lastStudiedAt: string | null;
  topic: { title: string; titleVi: string; level: string; wordCount: number };
  wordsLearnedCount: number;
};

/** S08 — Ho so ca nhan: thong tin, lich su hoc, tong Glory, lien ket Google (muc 11.9) */
export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)).then(setMe);
    fetch("/api/leaderboard/me").then((r) => (r.ok ? r.json() : null)).then((d) => setRank(d?.rank ?? null));
    fetch("/api/user/topics").then((r) => (r.ok ? r.json() : { items: [] })).then((d) => setHistory(d.items ?? []));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function unlinkGoogle() {
    if (!confirm("Huy lien ket tai khoan Google?")) return;
    const res = await fetch("/api/auth/link-google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unlink" }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Da huy lien ket Google." : data.error);
    load();
  }

  if (!me) return <p className="py-10 text-center text-gray-400">Dang tai...</p>;

  const passedCount = history.filter((h) => h.status === "passed").length;

  return (
    <div className="mx-auto max-w-lg">
      {/* Thong tin */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
        {me.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={me.avatarUrl} alt={me.name} className="mx-auto h-20 w-20 rounded-full object-cover" />
        ) : (
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-3xl font-bold text-brand-700">
            {me.name.charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className="mt-3 text-xl font-bold">{me.name}</h1>
        <p className="text-sm text-gray-500">{me.email}</p>
        {!me.emailVerified && (
          <p className="mt-2 text-xs text-amber-600">⚠ Email chua xac minh — kiem tra hop thu den</p>
        )}

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="Glory" value={`⭐ ${me.totalGlory}`} />
          <Stat label="Xep hang" value={rank ? `#${rank}` : "—"} />
          <Stat label="Da pass" value={String(passedCount)} />
        </div>
      </div>

      {/* Lien ket tai khoan (muc 11.9 BA doc) */}
      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="mb-2 font-semibold">Lien ket tai khoan</h2>
        {message && <p className="mb-2 text-sm text-brand-700">{message}</p>}
        {me.hasGoogle ? (
          <div className="flex items-center justify-between text-sm">
            <span>✅ Da lien ket Google</span>
            {me.hasPassword && (
              <button onClick={unlinkGoogle} className="text-red-600 hover:underline">Huy lien ket</button>
            )}
          </div>
        ) : (
          <button onClick={() => signIn("google", { callbackUrl: "/profile" })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50">
            Lien ket tai khoan Google
          </button>
        )}
        {me.hasGoogle && !me.hasPassword && (
          <p className="mt-2 text-xs text-gray-400">
            Dat mat khau (qua Quen mat khau) de co the huy lien ket Google.
          </p>
        )}
      </div>

      {/* Lich su hoc */}
      <h2 className="mb-3 mt-6 text-lg font-bold">Lich su hoc</h2>
      <div className="space-y-3">
        {history.map((h) => (
          <div key={h.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <LevelBadge level={h.topic.level} />
                <StatusBadge status={h.status} />
              </div>
              <p className="font-medium">{h.topic.title}</p>
              <p className="text-xs text-gray-400">
                {h.wordsLearnedCount}/{h.topic.wordCount} tu
                {h.gloryEarned > 0 && ` · +${h.gloryEarned} Glory`}
              </p>
            </div>
          </div>
        ))}
        {history.length === 0 && <p className="py-4 text-center text-gray-400">Chua co lich su hoc</p>}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="font-bold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
