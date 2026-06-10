"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

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
        setError("Email hoac mat khau khong dung. Vui long thu lai.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Co loi xay ra. Kiem tra ket noi mang.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4 py-10">
      {/* Logo + ten ung dung */}
      <div className="mb-8 text-center">
        <div className="text-5xl">🎓</div>
        <h1 className="mt-2 text-2xl font-bold">English Learning App</h1>
        <p className="text-sm text-gray-500">Hoc tu vung theo chu de</p>
      </div>

      {verify === "ok" && (
        <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          Email da duoc xac minh. Moi ban dang nhap.
        </p>
      )}
      {verify === "invalid" && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Link xac minh khong hop le hoac da het han.
        </p>
      )}

      {/* Nut Google — noi bat */}
      <button
        onClick={() => signIn("google", { callbackUrl })}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
      >
        <GoogleIcon />
        Tiep tuc voi Google
      </button>

      <div className="my-6 flex items-center gap-3 text-sm text-gray-400">
        <div className="h-px flex-1 bg-gray-200" /> hoac <div className="h-px flex-1 bg-gray-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-brand-500 disabled:bg-gray-100"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Mat khau"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-brand-500 disabled:bg-gray-100"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 px-4 py-3 font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Dang xu ly..." : "Dang nhap"}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-brand-600 hover:underline">
          Quen mat khau?
        </Link>
        <Link href="/register" className="text-brand-600 hover:underline">
          Chua co tai khoan? Dang ky ngay
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
