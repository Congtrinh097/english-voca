"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message ?? data.error ?? "Co loi xay ra");
    } catch {
      setMessage("Co loi xay ra. Kiem tra ket noi mang.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">Quen mat khau</h1>
      <p className="mb-6 text-sm text-gray-500">
        Nhap email da dang ky, chung toi se gui link dat lai mat khau.
      </p>

      {message ? (
        <p className="rounded-lg bg-green-50 p-4 text-sm text-green-700">{message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="email" required placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-brand-500 disabled:bg-gray-100" />
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-brand-600 px-4 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            {loading ? "Dang gui..." : "Gui huong dan"}
          </button>
        </form>
      )}

      <Link href="/login" className="mt-4 text-center text-sm text-brand-600 hover:underline">
        Quay lai dang nhap
      </Link>
    </div>
  );
}
