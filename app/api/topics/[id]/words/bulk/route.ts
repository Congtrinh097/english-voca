import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { wordSchema } from "@/lib/validations";

/**
 * POST /api/topics/[id]/words/bulk — [Admin] import CSV
 * Body: { csv: string }
 * Cot: word,pronunciation,part_of_speech,definition,example,meaning_vi
 * Validate tung dong; tra ve danh sach dong loi.
 */

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const topic = await prisma.topic.findUnique({ where: { id: params.id } });
  if (!topic) return NextResponse.json({ error: "Khong tim thay chu de" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const csv: string | undefined = body?.csv;
  if (!csv) return NextResponse.json({ error: "Thieu noi dung CSV" }, { status: 400 });

  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV can dong header + it nhat 1 dong du lieu" }, { status: 400 });
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const required = ["word", "definition", "example", "meaning_vi"];
  const missing = required.filter((c) => col(c) === -1);
  if (missing.length) {
    return NextResponse.json({ error: `Thieu cot: ${missing.join(", ")}` }, { status: 400 });
  }

  const maxOrder = await prisma.word.aggregate({
    where: { topicId: params.id },
    _max: { orderIndex: true },
  });
  let nextOrder = (maxOrder._max.orderIndex ?? -1) + 1;

  type NewWord = {
    word: string;
    pronunciation?: string | null;
    partOfSpeech?: string | null;
    definition: string;
    example: string;
    meaningVi: string;
    topicId: string;
    orderIndex: number;
  };
  const valid: NewWord[] = [];
  const errors: { line: number; error: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const row = {
      word: cells[col("word")] ?? "",
      pronunciation: col("pronunciation") >= 0 ? cells[col("pronunciation")] || null : null,
      partOfSpeech: col("part_of_speech") >= 0 ? cells[col("part_of_speech")] || null : null,
      definition: cells[col("definition")] ?? "",
      example: cells[col("example")] ?? "",
      meaningVi: cells[col("meaning_vi")] ?? "",
    };
    const parsed = wordSchema.safeParse(row);
    if (!parsed.success) {
      errors.push({ line: i + 1, error: parsed.error.errors[0]?.message ?? "Dong khong hop le" });
      continue;
    }
    const { audioUrl, orderIndex, ...rest } = parsed.data;
    valid.push({ ...rest, topicId: params.id, orderIndex: nextOrder++ });
  }

  if (valid.length) {
    await prisma.word.createMany({ data: valid });
  }

  return NextResponse.json({ imported: valid.length, errors });
}
