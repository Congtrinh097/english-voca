"use client";

import { useEffect } from "react";

/** Đăng ký service worker cho PWA — render trong root layout */
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
