"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Word = {
  id: string;
  word: string;
  pronunciation: string | null;
  partOfSpeech: string | null;
  definition: string;
  example: string;
  meaningVi: string;
  orderIndex: number;
};

const EMPTY = { word: "", pronunciation: "", partOfSpeech: "", definition: "", example: "", meaningVi: "" };

/** S11 — Quản lý từ vựng (mục 8.2 BA doc): CRUD + import CSV + xem trước */
export default function AdminWordsPage() {
  const { id } = useParams<{ id: string }>();
  const [words, setWords] = useState<Word[]>([]);
  const [form, setForm] = useState<typeof EMPTY & { id?: string }>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [csv, setCsv] = useState("");
  const [csvResult, setCsvResult] = useState("");
  const [preview, setPreview] = useState<Word | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/topics/${id}/words`);
    if (res.ok) setWords((await res.json()).items);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { id: wid, ...payload } = form;
    const res = await fetch(
      wid ? `/api/topics/${id}/words/${wid}` : `/api/topics/${id}/words`,
      {
        method: wid ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Có lỗi xảy ra"); return; }
    setForm(EMPTY);
    setShowForm(false);
    load();
  }

  async function remove(wid: string) {
    if (!confirm("Xóa từ này?")) return;
    await fetch(`/api/topics/${id}/words/${wid}`, { method: "DELETE" });
    load();
  }

  async function importCsv() {
    setCsvResult("");
    const res = await fetch(`/api/topics/${id}/words/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv }),
    });
    const data = await res.json();
    if (!res.ok) { setCsvResult(`Lỗi: ${data.error}`); return; }
    setCsvResult(
      `Đã import ${data.imported} từ.` +
      (data.errors.length ? ` Lỗi ${data.errors.length} dòng: ${data.errors.map((e: { line: number }) => e.line).join(", ")}` : "")
    );
    setCsv("");
    load();
  }

  const inputCls =
    "rounded-xl border border-gray-200 px-3 py-2 outline-none transition-all focus:border-brand-400 focus:ring-4 focus:ring-brand-100";

  return (
    <div>
      <Link href="/admin/topics" className="text-sm font-medium text-brand-600 hover:underline">
        ← Danh sách chủ đề
      </Link>
      <div className="mb-6 mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Quản lý từ vựng ({words.length})</h1>
        <button onClick={() => { setForm(EMPTY); setShowForm(true); }}
          className="btn-gradient rounded-xl px-4 py-2 text-sm font-semibold text-white">
          + Thêm từ
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="mb-6 animate-scale-in space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
          <h2 className="font-bold">{form.id ? "Sửa từ" : "Thêm từ mới"}</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <input required placeholder="Từ tiếng Anh" value={form.word}
              onChange={(e) => setForm((f) => ({ ...f, word: e.target.value }))}
              className={inputCls} />
            <input placeholder="Phiên âm IPA /.../" value={form.pronunciation ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, pronunciation: e.target.value }))}
              className={inputCls} />
            <input placeholder="Loại từ (noun/verb...)" value={form.partOfSpeech ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, partOfSpeech: e.target.value }))}
              className={inputCls} />
          </div>
          <input required placeholder="Định nghĩa (tiếng Anh)" value={form.definition}
            onChange={(e) => setForm((f) => ({ ...f, definition: e.target.value }))}
            className={`w-full ${inputCls}`} />
          <input required placeholder="Câu ví dụ (tiếng Anh)" value={form.example}
            onChange={(e) => setForm((f) => ({ ...f, example: e.target.value }))}
            className={`w-full ${inputCls}`} />
          <input required placeholder="Nghĩa tiếng Việt" value={form.meaningVi}
            onChange={(e) => setForm((f) => ({ ...f, meaningVi: e.target.value }))}
            className={`w-full ${inputCls}`} />
          {error && <p className="animate-scale-in rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-gradient rounded-xl px-4 py-2 text-sm font-semibold text-white">Lưu</button>
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50">
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Import CSV */}
      <details className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
        <summary className="cursor-pointer font-bold">📥 Import CSV hàng loạt</summary>
        <p className="mt-2 text-sm text-gray-500">
          Header: <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">word,pronunciation,part_of_speech,definition,example,meaning_vi</code>
        </p>
        <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={6}
          placeholder={'word,pronunciation,part_of_speech,definition,example,meaning_vi\nhello,/həˈləʊ/,noun,"A greeting","She said hello.",xin chào'}
          className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-xs outline-none transition-all focus:border-brand-400 focus:ring-4 focus:ring-brand-100" />
        <button onClick={importCsv} disabled={!csv.trim()}
          className="btn-gradient mt-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          Import
        </button>
        {csvResult && <p className="mt-2 animate-scale-in text-sm font-medium">{csvResult}</p>}
      </details>

      {/* Xem trước flashcard */}
      {preview && (
        <div className="fixed inset-0 z-30 flex animate-fade-in items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setPreview(null)}>
          <div className={`flip-card h-72 w-full max-w-sm animate-scale-in cursor-pointer ${flipped ? "flipped" : ""}`}
            onClick={(e) => { e.stopPropagation(); setFlipped((f) => !f); }}>
            <div className="flip-inner relative h-full w-full">
              <div className="flip-face absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-white p-6 shadow-xl">
                <h3 className="text-3xl font-extrabold">{preview.word}</h3>
                {preview.pronunciation && <p className="text-brand-500">{preview.pronunciation}</p>}
                {preview.partOfSpeech && <p className="text-sm italic text-gray-400">{preview.partOfSpeech}</p>}
                <p className="mt-3 text-center text-sm">{preview.definition}</p>
                <p className="mt-2 text-center text-sm italic text-gray-500">&ldquo;{preview.example}&rdquo;</p>
                <p className="absolute bottom-3 text-xs text-gray-300">Chạm để lật thẻ</p>
              </div>
              <div className="flip-face flip-back absolute inset-0 flex items-center justify-center rounded-3xl bg-brand-gradient p-6 text-white shadow-xl">
                <p className="text-2xl font-extrabold">{preview.meaningVi}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="animate-fade-up overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Từ</th>
              <th className="px-4 py-3 font-semibold">Nghĩa</th>
              <th className="px-4 py-3 text-right font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {words.map((w, i) => (
              <tr key={w.id} className="border-t border-gray-50 transition-colors hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{w.word}</p>
                  <p className="text-xs text-gray-400">{w.pronunciation}</p>
                </td>
                <td className="px-4 py-3">{w.meaningVi}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setPreview(w); setFlipped(false); }}
                    className="mr-2 font-medium text-gray-600 hover:underline">Xem trước</button>
                  <button onClick={() => { setForm({ ...w, pronunciation: w.pronunciation ?? "", partOfSpeech: w.partOfSpeech ?? "" }); setShowForm(true); }}
                    className="mr-2 font-medium text-brand-600 hover:underline">Sửa</button>
                  <button onClick={() => remove(w.id)} className="font-medium text-red-600 hover:underline">Xóa</button>
                </td>
              </tr>
            ))}
            {words.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Chưa có từ vựng</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
