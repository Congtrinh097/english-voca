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

/** S11 — Admin quan ly tu vung (muc 8.2 BA doc): CRUD + CSV import + preview */
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
    if (!res.ok) { setError(data.error ?? "Co loi xay ra"); return; }
    setForm(EMPTY);
    setShowForm(false);
    load();
  }

  async function remove(wid: string) {
    if (!confirm("Xoa tu nay?")) return;
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
    if (!res.ok) { setCsvResult(`Loi: ${data.error}`); return; }
    setCsvResult(
      `Da import ${data.imported} tu.` +
      (data.errors.length ? ` Loi ${data.errors.length} dong: ${data.errors.map((e: { line: number }) => e.line).join(", ")}` : "")
    );
    setCsv("");
    load();
  }

  return (
    <div>
      <Link href="/admin/topics" className="text-sm text-brand-600 hover:underline">← Danh sach chu de</Link>
      <div className="mb-6 mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quan ly tu vung ({words.length})</h1>
        <button onClick={() => { setForm(EMPTY); setShowForm(true); }}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          + Them tu
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="mb-6 space-y-3 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-semibold">{form.id ? "Sua tu" : "Them tu moi"}</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <input required placeholder="Tu tieng Anh" value={form.word}
              onChange={(e) => setForm((f) => ({ ...f, word: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2" />
            <input placeholder="Phien am IPA /.../" value={form.pronunciation ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, pronunciation: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2" />
            <input placeholder="Loai tu (noun/verb...)" value={form.partOfSpeech ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, partOfSpeech: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2" />
          </div>
          <input required placeholder="Dinh nghia (tieng Anh)" value={form.definition}
            onChange={(e) => setForm((f) => ({ ...f, definition: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          <input required placeholder="Cau vi du (tieng Anh)" value={form.example}
            onChange={(e) => setForm((f) => ({ ...f, example: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          <input required placeholder="Nghia tieng Viet" value={form.meaningVi}
            onChange={(e) => setForm((f) => ({ ...f, meaningVi: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">Luu</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">Huy</button>
          </div>
        </form>
      )}

      {/* CSV import */}
      <details className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <summary className="cursor-pointer font-semibold">Import CSV hang loat</summary>
        <p className="mt-2 text-sm text-gray-500">
          Header: <code>word,pronunciation,part_of_speech,definition,example,meaning_vi</code>
        </p>
        <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={6}
          placeholder={'word,pronunciation,part_of_speech,definition,example,meaning_vi\nhello,/həˈləʊ/,noun,"A greeting","She said hello.",xin chao'}
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs" />
        <button onClick={importCsv} disabled={!csv.trim()}
          className="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          Import
        </button>
        {csvResult && <p className="mt-2 text-sm">{csvResult}</p>}
      </details>

      {/* Preview flashcard */}
      {preview && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4" onClick={() => setPreview(null)}>
          <div className={`flip-card h-72 w-full max-w-sm cursor-pointer ${flipped ? "flipped" : ""}`}
            onClick={(e) => { e.stopPropagation(); setFlipped((f) => !f); }}>
            <div className="flip-inner relative h-full w-full">
              <div className="flip-face absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white p-6 shadow-xl">
                <h3 className="text-3xl font-bold">{preview.word}</h3>
                {preview.pronunciation && <p className="text-gray-500">{preview.pronunciation}</p>}
                {preview.partOfSpeech && <p className="text-sm italic text-gray-400">{preview.partOfSpeech}</p>}
                <p className="mt-3 text-center text-sm">{preview.definition}</p>
                <p className="mt-2 text-center text-sm italic text-gray-500">&ldquo;{preview.example}&rdquo;</p>
              </div>
              <div className="flip-face flip-back absolute inset-0 flex items-center justify-center rounded-2xl bg-brand-600 p-6 text-white shadow-xl">
                <p className="text-2xl font-bold">{preview.meaningVi}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Tu</th>
              <th className="px-4 py-2">Nghia</th>
              <th className="px-4 py-2 text-right">Hanh dong</th>
            </tr>
          </thead>
          <tbody>
            {words.map((w, i) => (
              <tr key={w.id} className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                <td className="px-4 py-2">
                  <p className="font-medium">{w.word}</p>
                  <p className="text-xs text-gray-400">{w.pronunciation}</p>
                </td>
                <td className="px-4 py-2">{w.meaningVi}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => { setPreview(w); setFlipped(false); }} className="mr-2 text-gray-600 hover:underline">Preview</button>
                  <button onClick={() => { setForm({ ...w, pronunciation: w.pronunciation ?? "", partOfSpeech: w.partOfSpeech ?? "" }); setShowForm(true); }}
                    className="mr-2 text-brand-600 hover:underline">Sua</button>
                  <button onClick={() => remove(w.id)} className="text-red-600 hover:underline">Xoa</button>
                </td>
              </tr>
            ))}
            {words.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Chua co tu vung</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
