"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell, Field } from "@/components/auth";

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Có lỗi xảy ra");
        return;
      }
      router.push("/login");
    } catch {
      setError("Có lỗi xảy ra. Kiểm tra kết nối mạng.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="mb-6 text-center animate-fade-down">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-2xl shadow-glow">
          🔒
        </div>
        <h1 className="text-2xl font-extrabold">Đặt lại mật khẩu</h1>
        <p className="mt-1 text-sm text-gray-500">Chọn mật khẩu mới cho tài khoản của bạn.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Field type="password" required minLength={8} placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
          value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
        <Field type="password" required placeholder="Xác nhận mật khẩu mới"
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} />
        {error && (
          <p className="animate-scale-in rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading || !token}
          className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading && <span className="h-4 w-4 animate-spin-slow rounded-full border-2 border-white/40 border-t-white" />}
          {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
