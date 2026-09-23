import { wordSchema } from "../validations";
import { AdminError } from "./errors";
import type { z } from "zod";

export const IMPORT_LIMIT = 200;
export const BODY_LIMIT = 256 * 1024;

// Parse records, not lines: quoted CSV cells may contain CRLF/newlines.
function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false, closed = false;
  const field = () => { row.push(cell.trim()); cell = ""; closed = false; };
  const record = () => { field(); if (row.some(Boolean)) rows.push(row); row = []; };
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (quoted) {
      if (c === '"' && csv[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else cell += c;
    } else if (c === ',') field();
    else if (c === '\n' || c === '\r') { record(); if(c === '\r' && csv[i+1] === '\n') i++; }
    else if (c === '"' && !cell && !closed) quoted = true;
    else if (c === '"' || (closed && c.trim())) throw new AdminError("VALIDATION_ERROR", "CSV có dấu ngoặc kép không hợp lệ.");
    else if (!closed) cell += c;
  }
  if (quoted) throw new AdminError("VALIDATION_ERROR", "CSV chưa đóng dấu ngoặc kép.");
  record();
  return rows;
}

export function prepareImport(input: {csv?: string; words?: unknown[]}, existing: string[] = []) {
  if ((input.csv !== undefined) === (input.words !== undefined)) throw new AdminError("VALIDATION_ERROR", "Chọn đúng một nguồn: csv hoặc words.");
  if (new TextEncoder().encode(JSON.stringify(input)).byteLength > BODY_LIMIT) throw new AdminError("VALIDATION_ERROR", "Dữ liệu vượt quá 256 KiB.", 413);
  let records: unknown[], offset = 1;
  if (input.csv !== undefined) {
    const [header, ...rows] = parseCsv(input.csv.replace(/^\uFEFF/, ""));
    const columns = header?.map(h=>h.toLowerCase());
    if (!columns || new Set(columns).size !== columns.length || ["word","definition","example","meaning_vi"].some(h=>!columns.includes(h))) {
      throw new AdminError("VALIDATION_ERROR", "CSV cần header duy nhất: word,definition,example,meaning_vi.");
    }
    const aliases: Record<string,string> = {part_of_speech:"partOfSpeech",meaning_vi:"meaningVi",audio_url:"audioUrl",order_index:"orderIndex"};
    records = rows.map(row => {
      if (row.length !== columns.length) return null;
      return Object.fromEntries(columns.map((name,i) => [aliases[name] ?? name, name === "order_index" ? Number(row[i]) : row[i]]));
    });
    offset = 2;
  } else records = input.words!;
  if (!records.length || records.length > IMPORT_LIMIT) throw new AdminError("VALIDATION_ERROR", "Mỗi lần import cần 1–200 từ.");
  const words: z.infer<typeof wordSchema>[] = [], errors: {line:number;error:string}[] = [], warnings: {line:number;word:string;reason:string}[] = [];
  const seen = new Set<string>(), known = new Set(existing.map(w=>w.trim().toLowerCase()));
  records.forEach((record,i) => {
    const parsed = wordSchema.safeParse(record);
    if (!parsed.success) { errors.push({line:i+offset,error:parsed.error.issues[0].message}); return; }
    const key = parsed.data.word.toLowerCase();
    if (seen.has(key) || known.has(key)) warnings.push({line:i+offset,word:parsed.data.word,reason:seen.has(key) ? "Trùng trong batch" : "Đã có trong chủ đề"});
    seen.add(key);
    words.push(parsed.data);
  });
  return {words,errors,warnings,total:records.length};
}
