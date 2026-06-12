"use client";

import { useEffect } from "react";

/** Đăng ký service worker cho PWA — render trong root layout */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Chi dang ky o production: chunk dev khong co hash trong ten file,
    // cache-first se phuc vu chunk cu va lam hong hydration
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
