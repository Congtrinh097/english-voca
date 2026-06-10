"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

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
      setError("Mat khau xac nhan khong khop");
      return;
    }
    if (form.password.length < 8) {
      setError("Mat khau toi thieu 8 ky tu");
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
        setError(data.error ?? "Co loi xay ra");
        return;
      }
      // Tu dong dang nhap sau dang ky (muc 11.3 BA doc)
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      router.push("/");
      router.refresh();
    } catch {
      setError("Co loi xay ra. Kiem tra ket noi mang.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <div className="text-5xl">🎓</div>
        <h1 className="mt-2 text-2xl font-bold">Tao tai khoan</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" required placeholder="Ho ten" value={form.name} onChange={set("name")} disabled={loading}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-brand-500 disabled:bg-gray-100" />
        <input type="email" required placeholder="Email" value={form.email} onChange={set("email")} disabled={loading}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-brand-500 disabled:bg-gray-100" />
        <input type="password" required minLength={8} placeholder="Mat khau (toi thieu 8 ky tu)" value={form.password} onChange={set("password")} disabled={loading}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-brand-500 disabled:bg-gray-100" />
        <input type="password" required placeholder="Xac nhan mat khau" value={form.confirmPassword} onChange={set("confirmPassword")} disabled={loading}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-brand-500 disabled:bg-gray-100" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-brand-600 px-4 py-3 font-medium text-white transition hover:bg-brand-700 disabled:opacity-50">
          {loading ? "Dang xu ly..." : "Dang ky"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        Da co tai khoan?{" "}
        <Link href="/login" className="text-brand-600 hover:underline">Dang nhap</Link>
      </p>
    </div>
  );
}
