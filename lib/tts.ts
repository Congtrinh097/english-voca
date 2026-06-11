"use client";

/** Tiện ích Text-to-Speech dùng chung cho màn hình Học flashcard và Quiz */

export function ttsAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Đọc to một đoạn text tiếng Anh (giọng en-US), hủy lượt đọc đang chạy nếu có */
export function speakEN(text: string) {
  if (!text || !ttsAvailable()) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
