/**
 * 軽い WebAudio 効果音。
 *
 * ユーザーが OS の reduced-motion / silence を期待しているケースに備え、
 * localStorage の jibunkaigi_sound_enabled が 'false' のとき完全に黙る。
 * デフォルトは ON（既存挙動互換）。
 */

const STORAGE_KEY = 'jibunkaigi_sound_enabled';

let audioCtx = null;

export const isSoundEnabled = () => {
  try {
    if (typeof localStorage === 'undefined') return true;
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
};

export const setSoundEnabled = (enabled) => {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    /* noop */
  }
};

const ensureCtx = () => {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) {
    try {
      audioCtx = new Ctor();
    } catch (error) {
      console.warn('AudioContext init failed', error);
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    try { audioCtx.resume(); } catch { /* noop */ }
  }
  return audioCtx;
};

export const playSound = (type) => {
  if (!isSoundEnabled()) return;
  try {
    const ctx = ensureCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    switch (type) {
      case 'send':
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
        break;
      case 'receive':
        osc.frequency.setValueAtTime(392, ctx.currentTime);
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
        break;
      case 'click':
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.06);
        break;
      case 'intro':
        [523, 659, 784].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.frequency.setValueAtTime(freq, ctx.currentTime);
          o.connect(g);
          g.connect(ctx.destination);
          g.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
          g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + i * 0.15 + 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
          o.start(ctx.currentTime + i * 0.15);
          o.stop(ctx.currentTime + 1.5);
        });
        break;
      case 'delete':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(165, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
        break;
      default:
        break;
    }
  } catch (e) {
    console.warn('Audio Context fail', e);
  }
};
