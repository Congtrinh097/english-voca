"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { AuthShell, Field } from "@/components/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    if (form.password.length < 8) {
      setError("Mật khẩu tối thiểu 8 ký tự");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Có lỗi xảy ra");
        return;
      }
      // Tự động đăng nhập sau đăng ký (mục 11.3 BA doc)
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      router.push("/");
      router.refresh();
    } catch {
      setError("Có lỗi xảy ra. Kiểm tra kết nối mạng.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="mb-8 text-center animate-fade-down">
        <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-brand-gradient text-3xl shadow-glow animate-float">
          🎓
        </div>
        <h1 className="text-2xl font-extrabold">Tạo tài khoản</h1>
        <p className="mt-1 text-sm text-gray-500">Bắt đầu hành trình học từ vựng của bạn</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Field type="text" required placeholder="Họ tên" value={form.name} onChange={set("name")} disabled={loading} />
        <Field type="email" required placeholder="Email" value={form.email} onChange={set("email")} disabled={loading} />
        <Field type="password" required minLength={8} placeholder="Mật khẩu (tối thiểu 8 ký tự)" value={form.password} onChange={set("password")} disabled={loading} />
        <Field type="password" required placeholder="Xác nhận mật khẩu" value={form.confirmPassword} onChange={set("confirmPassword")} disabled={loading} />
        {error && (
          <p className="animate-scale-in rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading && <span className="h-4 w-4 animate-spin-slow rounded-full border-2 border-white/40 border-t-white" />}
          {loading ? "Đang xử lý..." : "Đăng ký"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-600">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">Đăng nhập</Link>
      </p>
    </AuthShell>
  );
}
