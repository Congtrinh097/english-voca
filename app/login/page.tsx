"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { AuthShell, Field } from "@/components/auth";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C36.9 40.2 44 35 44 24c0-1.3-.1-2.6-.4-3.9z"/>
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const verify = searchParams.get("verify");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Email hoặc mật khẩu không đúng. Vui lòng thử lại.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
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
        <h1 className="text-2xl font-extrabold text-gradient">English Voca</h1>
        <p className="mt-1 text-sm text-gray-500">Học từ vựng theo chủ đề</p>
      </div>

      {verify === "ok" && (
        <p className="mb-4 animate-scale-in rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
          ✅ Email đã được xác minh. Mời bạn đăng nhập.
        </p>
      )}
      {verify === "invalid" && (
        <p className="mb-4 animate-scale-in rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
          ⚠ Link xác minh không hợp lệ hoặc đã hết hạn.
        </p>
      )}

      {/* Nút Google */}
      <button
        onClick={() => signIn("google", { callbackUrl })}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md disabled:opacity-50"
      >
        <GoogleIcon />
        Tiếp tục với Google
      </button>

      <div className="my-6 flex items-center gap-3 text-sm text-gray-400">
        <div className="h-px flex-1 bg-gray-200" /> hoặc <div className="h-px flex-1 bg-gray-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Field
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
        <Field
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          minLength={8}
          required
        />
        {error && (
          <p className="animate-scale-in rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading && <span className="h-4 w-4 animate-spin-slow rounded-full border-2 border-white/40 border-t-white" />}
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="font-medium text-brand-600 hover:underline">
          Quên mật khẩu?
        </Link>
        <Link href="/register" className="font-medium text-brand-600 hover:underline">
          Chưa có tài khoản? Đăng ký ngay
        </Link>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
