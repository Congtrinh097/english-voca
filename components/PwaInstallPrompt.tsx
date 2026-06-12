"use client";

import { useEffect, useRef, useState } from "react";

/** Sự kiện beforeinstallprompt (Chrome/Android) — chưa có trong lib DOM chuẩn */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa-install-dismissed-at";
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000; // đóng rồi thì 14 ngày sau mới gợi ý lại

/**
 * Banner gợi ý cài app vào màn hình chính, chỉ hiện khi:
 * - chưa chạy ở chế độ standalone (tức chưa cài)
 * - chưa bị người dùng đóng trong 14 ngày qua
 * Android/Chrome: nút "Cài đặt" gọi prompt thật. iOS: hướng dẫn Share → Thêm vào MH chính.
 */
export function PwaInstallPrompt() {
  const [mode, setMode] = useState<"hidden" | "android" | "ios">("hidden");
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0);
    if (dismissedAt && Date.now() - dismissedAt < SNOOZE_MS) return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      // Doc lai moc thoi gian: nguoi dung co the vua dong banner trong phien nay
      const snoozedAt = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0);
      if (snoozedAt && Date.now() - snoozedAt < SNOOZE_MS) return;
      deferred.current = e as BeforeInstallPromptEvent;
      setMode("android");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS không có beforeinstallprompt — hiện hướng dẫn sau vài giây
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const timer = isIos ? window.setTimeout(() => setMode("ios"), 3000) : undefined;

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setMode("hidden");
  }

  async function install() {
    const event = deferred.current;
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "accepted") window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setMode("hidden");
  }

  if (mode === "hidden") return null;

  return (
    <div className="animate-fade-up fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-glow">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-gradient text-xl">
        🎓
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-bold leading-tight">Cài English Voca vào màn hình chính</p>
        {mode === "android" ? (
          <p className="text-xs text-gray-500">Mở nhanh như app, chạy toàn màn hình</p>
        ) : (
          <p className="text-xs text-gray-500">
            Bấm <span className="font-semibold">Chia sẻ</span> rồi chọn{" "}
            <span className="font-semibold">&ldquo;Thêm vào MH chính&rdquo;</span>
          </p>
        )}
      </div>
      {mode === "android" && (
        <button
          onClick={install}
          className="btn-gradient shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold text-white"
        >
          Cài đặt
        </button>
      )}
      <button
        onClick={dismiss}
        aria-label="Đóng gợi ý cài đặt"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
      >
        ✕
      </button>
    </div>
  );
}
