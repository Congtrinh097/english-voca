import type { Word } from "@prisma/client";
import { QUIZ_SIZE } from "@/lib/validations";

export type QuizQuestion = {
  wordId: string;
  prompt: string; // tu tieng Anh
  pronunciation: string | null;
  options: string[]; // 4 nghia tieng Viet (xao tron)
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Sinh 10 cau trac nghiem 4 lua chon tu pool tu vung (server-side — chong gian lan).
 * Moi cau: hoi nghia tieng Viet cua 1 tu; 3 dap an nhieu lay tu cac tu khac.
 */
export function generateQuiz(words: Word[]): QuizQuestion[] {
  if (words.length < 4) {
    throw new Error("Chu de can it nhat 4 tu vung de tao quiz");
  }

  const selected = shuffle(words).slice(0, Math.min(QUIZ_SIZE, words.length));

  return selected.map((w) => {
    const distractors = shuffle(words.filter((x) => x.id !== w.id))
      .slice(0, 3)
      .map((x) => x.meaningVi);
    return {
      wordId: w.id,
      prompt: w.word,
      pronunciation: w.pronunciation,
      options: shuffle([w.meaningVi, ...distractors]),
    };
  });
}

/** Cham diem server-side: so sanh dap an chon voi meaning_vi trong DB */
export function gradeQuiz(
  words: Word[],
  answers: { wordId: string; selected: string }[]
) {
  const byId = new Map(words.map((w) => [w.id, w]));
  let score = 0;
  const detail = answers.map((a) => {
    const word = byId.get(a.wordId);
    const correct = !!word && word.meaningVi === a.selected;
    if (correct) score++;
    return {
      wordId: a.wordId,
      word: word?.word ?? "?",
      selected: a.selected,
      correctAnswer: word?.meaningVi ?? "?",
      correct,
    };
  });
  return { score, detail };
}
