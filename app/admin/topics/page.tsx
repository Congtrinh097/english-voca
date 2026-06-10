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

/** S10 — Quản lý chủ đề (mục 8.1 BA doc) */
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
        setError(data.error ?? "Có lỗi xảy ra");
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
    if (!confirm("Xóa chủ đề này? Toàn bộ từ vựng và kết quả học sẽ bị xóa.")) return;
    await fetch(`/api/topics/${id}`, { method: "DELETE" });
    load();
  }

  const inputCls =
    "rounded-xl border border-gray-200 px-3 py-2 outline-none transition-all focus:border-brand-400 focus:ring-4 focus:ring-brand-100";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Quản lý chủ đề</h1>
        <button
          onClick={() => { setForm(EMPTY); setShowForm(true); }}
          className="btn-gradient rounded-xl px-4 py-2 text-sm font-semibold text-white">
          + Tạo chủ đề
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="mb-6 animate-scale-in space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
          <h2 className="font-bold">{form.id ? "Sửa chủ đề" : "Tạo chủ đề mới"}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input required placeholder="Tiêu đề (tiếng Anh)" value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputCls} />
            <input required placeholder="Tiêu đề (tiếng Việt)" value={form.titleVi}
              onChange={(e) => setForm((f) => ({ ...f, titleVi: e.target.value }))}
              className={inputCls} />
            <select value={form.level}
              onChange={(e) => setForm((f) => ({ ...f, level: e.target.value as Topic["level"] }))}
              className={inputCls}>
              <option value="beginner">Cơ bản (10 Glory)</option>
              <option value="middle">Trung cấp (15 Glory)</option>
              <option value="master">Nâng cao (20 Glory)</option>
            </select>
            <input placeholder="URL ảnh bìa (tùy chọn)" value={form.thumbnailUrl}
              onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))}
              className={inputCls} />
          </div>
          <textarea placeholder="Mô tả ngắn (tùy chọn)" value={form.description ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className={`w-full ${inputCls}`} rows={2} />
          {error && <p className="animate-scale-in rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="btn-gradient rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {loading ? "Đang lưu..." : "Lưu"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50">
              Hủy
            </button>
          </div>
        </form>
      )}

      <div className="animate-fade-up overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Chủ đề</th>
              <th className="px-4 py-3 font-semibold">Cấp độ</th>
              <th className="px-4 py-3 font-semibold">Từ vựng</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 text-right font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((t) => (
              <tr key={t.id} className="border-t border-gray-50 transition-colors hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-semibold">{t.title}</p>
                  <p className="text-gray-500">{t.titleVi}</p>
                </td>
                <td className="px-4 py-3"><LevelBadge level={t.level} /></td>
                <td className="px-4 py-3">
                  <Link href={`/admin/topics/${t.id}/words`} className="font-medium text-brand-600 hover:underline">
                    {t.wordCount} từ →
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => togglePublish(t.id)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-transform hover:scale-105 ${
                      t.isPublished
                        ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                        : "bg-gray-200 text-gray-600"
                    }`}>
                    {t.isPublished ? "Đã đăng" : "Bản nháp"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setForm({ id: t.id, title: t.title, titleVi: t.titleVi, level: t.level, description: t.description ?? "", thumbnailUrl: t.thumbnailUrl ?? "" }); setShowForm(true); }}
                    className="mr-2 font-medium text-brand-600 hover:underline">Sửa</button>
                  <button onClick={() => remove(t.id)} className="font-medium text-red-600 hover:underline">Xóa</button>
                </td>
              </tr>
            ))}
            {topics.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Chưa có chủ đề nào</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
