/** Danh hiệu theo tổng Glory Points — mỗi 1000 điểm lên một bậc */

export type GloryRank = { min: number; emoji: string; title: string };

const RANKS: GloryRank[] = [
  { min: 0, emoji: "🐣", title: "Gà Mờ Mới Nở" },
  { min: 1000, emoji: "🐥", title: "Tập Tành Bập Bẹ" },
  { min: 2000, emoji: "🦆", title: "Chuyên Gia Đoán Nghĩa" },
  { min: 3000, emoji: "🐸", title: "Thánh Học Vẹt" },
  { min: 4000, emoji: "🐵", title: "Bậc Thầy Flashcard" },
  { min: 5000, emoji: "🦊", title: "Kẻ Săn Từ Vựng" },
  { min: 6000, emoji: "🐺", title: "Chiến Binh Ngữ Pháp" },
  { min: 7000, emoji: "🦁", title: "Chúa Tể Từ Điển" },
  { min: 8000, emoji: "🐲", title: "Đại Ma Đạo English" },
  { min: 9000, emoji: "👑", title: "Huyền Thoại IELTS Mơ Ước" },
  { min: 10000, emoji: "💀", title: "Vô Đối Không Cần Subtitle" },
];

export function rankFor(glory: number): GloryRank {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (glory >= r.min) rank = r;
    else break;
  }
  return rank;
}

/** Bậc kế tiếp (null nếu đã max) — dùng hiển thị tiến độ lên hạng */
export function nextRank(glory: number): GloryRank | null {
  return RANKS.find((r) => r.min > glory) ?? null;
}
