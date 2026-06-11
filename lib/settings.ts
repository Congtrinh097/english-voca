"use client";

/** Cài đặt cá nhân lưu ở localStorage — không cần đồng bộ server */

export type AppSettings = {
  /** Tự động phát âm từ vựng khi chuyển sang flashcard mới */
  autoSpeak: boolean;
};

const KEY = "voca-settings";
const DEFAULTS: AppSettings = { autoSpeak: true };

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    return { ...DEFAULTS, ...JSON.parse(window.localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return DEFAULTS;
  }
}

export function updateSettings(patch: Partial<AppSettings>): AppSettings {
  const next = { ...getSettings(), ...patch };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
