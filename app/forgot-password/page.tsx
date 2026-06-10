"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell, Field } from "@/components/auth";

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
      setMessage(data.message ?? data.error ?? "Có lỗi xảy ra");
    } catch {
      setMessage("Có lỗi xảy ra. Kiểm tra kết nối mạng.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="mb-6 text-center animate-fade-down">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-2xl shadow-glow">
          🔑
        </div>
        <h1 className="text-2xl font-extrabold">Quên mật khẩu</h1>
        <p className="mt-1 text-sm text-gray-500">
          Nhập email đã đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu.
        </p>
      </div>

      {message ? (
        <p className="animate-scale-in rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
          {message}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
          <button
            type="submit"
            disabled={loading}
            className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading && <span className="h-4 w-4 animate-spin-slow rounded-full border-2 border-white/40 border-t-white" />}
            {loading ? "Đang gửi..." : "Gửi hướng dẫn"}
          </button>
        </form>
      )}

      <Link href="/login" className="mt-5 block text-center text-sm font-medium text-brand-600 hover:underline">
        ← Quay lại đăng nhập
      </Link>
    </AuthShell>
  );
}
