"use client";

import { useCallback, useEffect, useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { LevelBadge, StatusBadge } from "@/components/ui/badges";
import { getSettings, updateSettings } from "@/lib/settings";
import { nextRank, rankFor } from "@/lib/glory-rank";

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

/** S08 — Hồ sơ cá nhân: thông tin, lịch sử học, tổng Glory, liên kết Google (mục 11.9) */
export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [message, setMessage] = useState("");
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { setAutoSpeak(getSettings().autoSpeak); }, []);

  function toggleAutoSpeak() {
    setAutoSpeak(updateSettings({ autoSpeak: !autoSpeak }).autoSpeak);
  }

  const load = useCallback(() => {
    fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)).then(setMe);
    fetch("/api/leaderboard/me").then((r) => (r.ok ? r.json() : null)).then((d) => setRank(d?.rank ?? null));
    fetch("/api/user/topics").then((r) => (r.ok ? r.json() : { items: [] })).then((d) => setHistory(d.items ?? []));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function unlinkGoogle() {
    if (!confirm("Hủy liên kết tài khoản Google?")) return;
    const res = await fetch("/api/auth/link-google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unlink" }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Đã hủy liên kết Google." : data.error);
    load();
  }

  if (!me) return <p className="py-10 text-center text-gray-400">Đang tải...</p>;

  const passedCount = history.filter((h) => h.status === "passed").length;

  return (
    <div className="mx-auto max-w-lg">
      {/* Thông tin */}
      <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white p-6 text-center shadow-soft animate-scale-in">
        <div className="absolute inset-x-0 top-0 h-24 bg-brand-gradient" />
        <div className="relative">
          {me.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={me.avatarUrl} alt={me.name} className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-white" />
          ) : (
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-accent-500 text-4xl font-bold text-white ring-4 ring-white">
              {me.name.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="mt-3 text-xl font-extrabold">{me.name}</h1>
          <p className="text-sm text-gray-500">{me.email}</p>

          {/* Danh hiệu theo tổng Glory */}
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-bold text-brand-700 ring-1 ring-brand-200">
            {rankFor(me.totalGlory).emoji} {rankFor(me.totalGlory).title}
          </p>
          {nextRank(me.totalGlory) && (
            <p className="mt-1 text-xs text-gray-400">
              Còn {(nextRank(me.totalGlory)!.min - me.totalGlory).toLocaleString("vi-VN")} Glory để lên hạng{" "}
              {nextRank(me.totalGlory)!.emoji} {nextRank(me.totalGlory)!.title}
            </p>
          )}
          {!me.emailVerified && (
            <p className="mt-2 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600 ring-1 ring-amber-200">
              ⚠ Email chưa xác minh — kiểm tra hộp thư đến
            </p>
          )}

          <div className="mt-5 grid grid-cols-3 gap-3">
            <Stat label="Glory" value={`⭐ ${me.totalGlory}`} />
            <Stat label="Xếp hạng" value={rank ? `#${rank}` : "—"} />
            <Stat label="Đã đạt" value={String(passedCount)} />
          </div>
        </div>
      </div>

      {/* Liên kết tài khoản (mục 11.9 BA doc) */}
      <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-card animate-fade-up">
        <h2 className="mb-2 font-bold">Liên kết tài khoản</h2>
        {message && <p className="mb-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{message}</p>}
        {me.hasGoogle ? (
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-emerald-600">✅ Đã liên kết Google</span>
            {me.hasPassword && (
              <button onClick={unlinkGoogle} className="font-medium text-red-600 hover:underline">Hủy liên kết</button>
            )}
          </div>
        ) : (
          <button
            onClick={() => signIn("google", { callbackUrl: "/profile" })}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
          >
            Liên kết tài khoản Google
          </button>
        )}
        {me.hasGoogle && !me.hasPassword && (
          <p className="mt-2 text-xs text-gray-400">
            Đặt mật khẩu (qua Quên mật khẩu) để có thể hủy liên kết Google.
          </p>
        )}
      </div>

      {/* Cài đặt học tập */}
      <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-card animate-fade-up">
        <h2 className="mb-3 font-bold">Cài đặt học tập</h2>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">🔊 Tự động phát âm flashcard</p>
            <p className="text-xs text-gray-400">Tự đọc to từ vựng khi chuyển sang thẻ mới ở màn hình học</p>
          </div>
          <button
            role="switch"
            aria-checked={autoSpeak}
            aria-label="Tự động phát âm flashcard"
            onClick={toggleAutoSpeak}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              autoSpeak ? "bg-brand-gradient" : "bg-gray-200"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                autoSpeak ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Lịch sử học — chỉ hiện 3 mục gần nhất, xem đầy đủ qua popup */}
      <h2 className="mb-3 mt-6 text-lg font-bold">Lịch sử học</h2>
      <div className="stagger space-y-3">
        {history.slice(0, 3).map((h) => (
          <HistoryCard key={h.id} item={h} />
        ))}
        {history.length === 0 && <p className="py-4 text-center text-gray-400">Chưa có lịch sử học</p>}
      </div>
      {history.length > 3 && (
        <button
          onClick={() => setShowHistory(true)}
          className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-600 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
        >
          Xem thêm ({history.length - 3})
        </button>
      )}

      {/* Popup toàn bộ lịch sử */}
      {showHistory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in"
          onClick={() => setShowHistory(false)}
        >
          <div
            role="dialog"
            aria-label="Lịch sử học"
            className="animate-pop flex max-h-[80vh] w-full max-w-md flex-col rounded-3xl bg-white p-5 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">Lịch sử học ({history.length})</h2>
              <button
                onClick={() => setShowHistory(false)}
                aria-label="Đóng"
                className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto">
              {history.map((h) => (
                <HistoryCard key={h.id} item={h} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Đăng xuất */}
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="mt-6 w-full rounded-2xl border border-red-100 bg-white px-4 py-3 text-sm font-semibold text-red-600 shadow-card transition-all hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:shadow-md"
      >
        🚪 Đăng xuất
      </button>
    </div>
  );
}

function HistoryCard({ item }: { item: HistoryItem }) {
  return (
    <div className="lift flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-card">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <LevelBadge level={item.topic.level} />
          <StatusBadge status={item.status} />
        </div>
        <p className="font-semibold">{item.topic.title}</p>
        <p className="text-xs text-gray-400">
          {item.wordsLearnedCount}/{item.topic.wordCount} từ
          {item.gloryEarned > 0 && (
            <span className="font-medium text-amber-500"> · +{item.gloryEarned} Glory</span>
          )}
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-3 transition-colors hover:bg-brand-50">
      <p className="font-extrabold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
