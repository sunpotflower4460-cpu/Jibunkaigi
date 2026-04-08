// src/runtime/stateEstimate.js

const clamp01 = (n) => Math.max(0, Math.min(1, n));

const bump = (obj, key, amount) => {
  obj[key] = clamp01((obj[key] || 0) + amount);
};

export const estimateState = (text = '') => {
  const t = text.trim();

  const state = {
    fear: 0,
    freeze: 0,
    desire: 0,
    unfinished: 0,
    selfErasure: 0,
    reach: 0,
    resignation: 0,
    shame: 0,
  };

  if (!t) return state;

  if (t.includes('怖') || t.includes('不安')) {
    bump(state, 'fear', 0.35);
  }

  if (
    t.includes('動け') ||
    t.includes('固ま') ||
    t.includes('止ま') ||
    t.includes('何もでき')
  ) {
    bump(state, 'freeze', 0.45);
  }

  if (
    t.includes('したい') ||
    t.includes('本当は') ||
    t.includes('進みたい') ||
    t.includes('出したい')
  ) {
    bump(state, 'desire', 0.45);
  }

  if (
    t.includes('まだ') ||
    t.includes('終わ') ||
    t.includes('後悔') ||
    t.includes('捨てられない')
  ) {
    bump(state, 'unfinished', 0.35);
  }

  if (
    t.includes('薄っぺら') ||
    t.includes('自信がない') ||
    t.includes('ダメ') ||
    t.includes('消えたい')
  ) {
    bump(state, 'selfErasure', 0.45);
  }

  if (
    t.includes('伝えたい') ||
    t.includes('出したい') ||
    t.includes('言いたい') ||
    t.includes('向き合いたい')
  ) {
    bump(state, 'reach', 0.35);
  }

  if (
    t.includes('諦め') ||
    t.includes('無理') ||
    t.includes('もういい') ||
    t.includes('仕方ない')
  ) {
    bump(state, 'resignation', 0.45);
  }

  if (
    t.includes('恥') ||
    t.includes('比べ') ||
    t.includes('笑われ') ||
    t.includes('自信がない')
  ) {
    bump(state, 'shame', 0.4);
  }

  if (t.includes('のに')) {
    bump(state, 'unfinished', 0.12);
    bump(state, 'desire', 0.1);
    bump(state, 'freeze', 0.08);
  }

  if (t.includes('でも')) {
    bump(state, 'desire', 0.08);
    bump(state, 'reach', 0.06);
  }

  if (t.includes('本当は')) {
    bump(state, 'desire', 0.15);
    bump(state, 'unfinished', 0.1);
  }

  return state;
};