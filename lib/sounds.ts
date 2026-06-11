"use client";

/**
 * Hiệu ứng âm thanh kết quả quiz, tổng hợp bằng Web Audio API
 * (không cần file asset, hoạt động offline)
 */

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();
  // Trình duyệt có thể khởi tạo ở trạng thái suspended nếu chưa có tương tác
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Tiếng vỗ tay ăn mừng (~2s): nhiều "cú vỗ" là xung nhiễu trắng qua bộ lọc bandpass */
export function playApplause() {
  const ctx = getCtx();
  if (!ctx) return;
  const master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);

  const claps = 70;
  for (let i = 0; i < claps; i++) {
    const start = ctx.currentTime + Math.random() * 1.8;
    const dur = 0.04 + Math.random() * 0.04;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let j = 0; j < data.length; j++) {
      data[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / data.length, 2);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 900 + Math.random() * 1800;
    bp.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.value = 0.25 + Math.random() * 0.5;
    src.connect(bp).connect(g).connect(master);
    src.start(start);
  }
  window.setTimeout(() => void ctx.close(), 2600);
}

/** Giai điệu buồn ngắn: 3 nốt đi xuống bằng sóng triangle */
export function playSad() {
  const ctx = getCtx();
  if (!ctx) return;
  const notes = [392, 330, 262]; // G4 → E4 → C4
  notes.forEach((freq, i) => {
    const start = ctx.currentTime + i * 0.35;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.3, start + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
    osc.connect(g).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.55);
  });
  window.setTimeout(() => void ctx.close(), 1800);
}
