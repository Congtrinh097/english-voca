"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
      setError("Mat khau xac nhan khong khop");
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
        setError(data.error ?? "Co loi xay ra");
        return;
      }
      router.push("/login");
    } catch {
      setError("Co loi xay ra. Kiem tra ket noi mang.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Dat lai mat khau</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="password" required minLength={8} placeholder="Mat khau moi (toi thieu 8 ky tu)"
          value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-brand-500 disabled:bg-gray-100" />
        <input type="password" required placeholder="Xac nhan mat khau moi"
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-brand-500 disabled:bg-gray-100" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading || !token}
          className="w-full rounded-lg bg-brand-600 px-4 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-50">
          {loading ? "Dang xu ly..." : "Dat lai mat khau"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
