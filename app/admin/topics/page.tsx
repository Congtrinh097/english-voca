"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LevelBadge } from "@/components/ui/badges";

type Topic = {
  id: string;
  title: string;
  titleVi: string;
  description: string | null;
  level: "beginner" | "middle" | "master";
  thumbnailUrl: string | null;
  isPublished: boolean;
  wordCount: number;
};

type FormState = {
  id?: string;
  title: string;
  titleVi: string;
  description: string;
  level: Topic["level"];
  thumbnailUrl: string;
};

const EMPTY: FormState = { title: "", titleVi: "", description: "", level: "beginner", thumbnailUrl: "" };

/** S10 — Admin quan ly chu de (muc 8.1 BA doc) */
export default function AdminTopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/topics?all=1&page=1");
    if (res.ok) {
      const data = await res.json();
      setTopics(data.items);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { id, ...payload } = form;
      const res = await fetch(id ? `/api/topics/${id}` : "/api/topics", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Co loi xay ra");
        return;
      }
      setForm(EMPTY);
      setShowForm(false);
      load();
    } finally {
      setLoading(false);
    }
  }

  async function togglePublish(id: string) {
    await fetch(`/api/topics/${id}/publish`, { method: "PATCH" });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Xoa chu de nay? Toan bo tu vung va ket qua hoc se bi xoa.")) return;
    await fetch(`/api/topics/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quan ly chu de</h1>
        <button
          onClick={() => { setForm(EMPTY); setShowForm(true); }}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          + Tao chu de
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="mb-6 space-y-3 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-semibold">{form.id ? "Sua chu de" : "Tao chu de moi"}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input required placeholder="Title (English)" value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2" />
            <input required placeholder="Tieu de (Tieng Viet)" value={form.titleVi}
              onChange={(e) => setForm((f) => ({ ...f, titleVi: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2" />
            <select value={form.level}
              onChange={(e) => setForm((f) => ({ ...f, level: e.target.value as Topic["level"] }))}
              className="rounded-lg border border-gray-300 px-3 py-2">
              <option value="beginner">Beginner (10 Glory)</option>
              <option value="middle">Middle (15 Glory)</option>
              <option value="master">Master (20 Glory)</option>
            </select>
            <input placeholder="Thumbnail URL (tuy chon)" value={form.thumbnailUrl}
              onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2" />
          </div>
          <textarea placeholder="Mo ta ngan (tuy chon)" value={form.description ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2" rows={2} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              {loading ? "Dang luu..." : "Luu"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm">Huy</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">Chu de</th>
              <th className="px-4 py-2">Level</th>
              <th className="px-4 py-2">Tu vung</th>
              <th className="px-4 py-2">Trang thai</th>
              <th className="px-4 py-2 text-right">Hanh dong</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((t) => (
              <tr key={t.id} className="border-t border-gray-100">
                <td className="px-4 py-2">
                  <p className="font-medium">{t.title}</p>
                  <p className="text-gray-500">{t.titleVi}</p>
                </td>
                <td className="px-4 py-2"><LevelBadge level={t.level} /></td>
                <td className="px-4 py-2">
                  <Link href={`/admin/topics/${t.id}/words`} className="text-brand-600 hover:underline">
                    {t.wordCount} tu →
                  </Link>
                </td>
                <td className="px-4 py-2">
                  <button onClick={() => togglePublish(t.id)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${t.isPublished ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                    {t.isPublished ? "Published" : "Draft"}
                  </button>
                </td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => { setForm({ id: t.id, title: t.title, titleVi: t.titleVi, level: t.level, description: t.description ?? "", thumbnailUrl: t.thumbnailUrl ?? "" }); setShowForm(true); }}
                    className="mr-2 text-brand-600 hover:underline">Sua</button>
                  <button onClick={() => remove(t.id)} className="text-red-600 hover:underline">Xoa</button>
                </td>
              </tr>
            ))}
            {topics.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Chua co chu de nao</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
