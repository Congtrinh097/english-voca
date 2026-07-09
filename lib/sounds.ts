"use client";

/**
 * Hiệu ứng âm thanh kết quả quiz, tổng hợp bằng Web Audio API
 * (không cần file asset, hoạt động offline)
 *
 * Trình duyệt chặn autoplay: AudioContext khởi tạo ở trạng thái "suspended"
 * nếu trang chưa có tương tác. Khi đó ta chờ cử chỉ đầu tiên (chạm/click/phím)
 * rồi mới phát, thay vì phát "câm" rồi đóng context như trước.
 *
 * iOS Safari xếp âm thanh Web Audio API vào loại "ambient" nên bị nút gạt
 * Im lặng (Silent switch) tắt tiếng, kể cả khi phát trong 1 cử chỉ hợp lệ.
 * Cách duy nhất để bỏ qua nút gạt này là phát 1 thẻ <audio> câm thật sự
 * (không dùng Web Audio) — việc đó chuyển audio session của trang sang loại
 * "playback", áp dụng cho mọi âm thanh Web Audio phát sau đó trong phiên.
 */

// WAV 1 mẫu câm (8-bit/8kHz mono) — chỉ dùng để "mở khoá" audio session trên iOS
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiUAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQEAAACA";

let iosAudioUnlocked = false;
function unlockIOSAudioSession() {
  if (iosAudioUnlocked || typeof window === "undefined") return;
  iosAudioUnlocked = true;
  const audio = new Audio(SILENT_WAV);
  audio.play().catch(() => {
    iosAudioUnlocked = false; // thử lại ở lần phát sau nếu vẫn bị chặn
  });
}

type Builder = (ctx: AudioContext) => number; // trả về thời lượng (giây)

function playWhenAllowed(build: Builder) {
  if (typeof window === "undefined") return;
  unlockIOSAudioSession();
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();

  const run = () => {
    const duration = build(ctx);
    window.setTimeout(() => void ctx.close(), (duration + 0.5) * 1000);
  };

  if (ctx.state === "running") {
    run();
    return;
  }

  // Thử resume — thành công nếu trang đã từng có tương tác
  void ctx.resume();
  window.setTimeout(() => {
    if (ctx.state === "running") {
      run();
      return;
    }
    // Vẫn bị chặn: phát ngay khi người dùng tương tác lần đầu
    const onGesture = () => {
      cleanup();
      ctx.resume().then(run).catch(() => void ctx.close());
    };
    const cleanup = () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      window.removeEventListener("touchstart", onGesture);
    };
    window.addEventListener("pointerdown", onGesture, { once: true });
    window.addEventListener("keydown", onGesture, { once: true });
    window.addEventListener("touchstart", onGesture, { once: true });
  }, 150);
}

/** Tiếng vỗ tay ăn mừng (~2s): nhiều "cú vỗ" là xung nhiễu trắng qua bộ lọc bandpass */
export function playApplause() {
  playWhenAllowed((ctx) => {
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
    return 2.1;
  });
}

/** Tiếng "ting" ngắn khi trả lời xong 1 câu quiz: 1 nốt sine cao, tắt nhanh */
export function playTing() {
  playWhenAllowed((ctx) => {
    const start = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 1318.5; // E6
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.3, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
    osc.connect(g).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.32);
    return 0.35;
  });
}

/** Giai điệu buồn ngắn: 3 nốt đi xuống bằng sóng triangle */
export function playSad() {
  playWhenAllowed((ctx) => {
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
    return 1.3;
  });
}
