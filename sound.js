// Efek suara & musik 8-bit (Web Audio API, tanpa file audio)

let audioContext;
let isSfxOn = localStorage.getItem("sfxEnabled") === "true"; // default mati, aktif lewat tombol
let isBgmOn = false;
let bgmOscillators = [];
let bgmTimer = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function isSfxEnabled() { return isSfxOn; }
function setSfxEnabled(val) {
  isSfxOn = !!val;
  localStorage.setItem("sfxEnabled", isSfxOn);
}

const SFX = {
  click:   { freq: 600,  dur: 0.05 },
  success: { freq: 800,  dur: 0.15 },
  error:   { freq: 300,  dur: 0.1 },
  boot:    { freq: 1200, dur: 0.3 },
  pop:     { freq: 900,  dur: 0.08 },
};

function playSfx(type = "click") {
  if (!isSfxOn) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const cfg = SFX[type] || SFX.click;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(cfg.freq, now);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + cfg.dur);
    osc.start(now);
    osc.stop(now + cfg.dur);
  } catch (e) { /* audio tidak tersedia */ }
}

const MELODY = [
  { freq: 262, duration: 0.25 }, { freq: 330, duration: 0.25 },
  { freq: 392, duration: 0.25 }, { freq: 494, duration: 0.25 },
  { freq: 392, duration: 0.25 }, { freq: 330, duration: 0.25 },
  { freq: 262, duration: 0.5 },
];
const MELODY_LENGTH = MELODY.reduce((sum, n) => sum + n.duration, 0);

function toggleBgm() {
  if (isBgmOn) { stopBgm(); return false; }
  playBgm();
  return true;
}

function playBgm() {
  if (isBgmOn) return;
  isBgmOn = true;
  const ctx = getAudioContext();

  const playLoop = () => {
    if (!isBgmOn) return;
    let time = ctx.currentTime;
    MELODY.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(note.freq, time);
      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + note.duration * 0.9);
      osc.start(time);
      osc.stop(time + note.duration);
      bgmOscillators.push(osc);
      time += note.duration;
    });
    // Ulangi tepat setelah satu putaran melodi selesai.
    bgmTimer = setTimeout(() => {
      bgmOscillators = [];
      playLoop();
    }, MELODY_LENGTH * 1000);
  };
  playLoop();
}

function stopBgm() {
  isBgmOn = false;
  clearTimeout(bgmTimer);
  bgmOscillators.forEach((osc) => { try { osc.stop(); } catch (e) { /* sudah berhenti */ } });
  bgmOscillators = [];
}

window.playSfx = playSfx;
window.isSfxEnabled = isSfxEnabled;
window.setSfxEnabled = setSfxEnabled;
window.toggleBgm = toggleBgm;
