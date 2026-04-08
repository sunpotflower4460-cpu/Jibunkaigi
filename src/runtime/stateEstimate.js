// src/runtime/stateEstimate.js
// ユーザーの発話を「意味」ではなく「状態」として読む。
// ここではまだ返答しない。測るだけ。

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

  // --- 大きな圧 ---
  if (t.includes('怖') || t.includes('不安') || t.includes('恐')) {
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
    t.includes('出したい') ||
    t.includes('向き合いたい')
  ) {
    bump(state, 'desire', 0.45);
  }

  if (
    t.includes('まだ') ||
    t.includes('終わ') ||
    t.includes('捨てられない') ||
    t.includes('気になる') ||
    t.includes('後悔')
  ) {
    bump(state, 'unfinished', 0.35);
  }

  if (
    t.includes('自分なんか') ||
    t.includes('薄っぺら') ||
    t.includes('たいしたことない') ||
    t.includes('ダメ') ||
    t.includes('消えたい')
  ) {
    bump(state, 'selfErasure', 0.45);
  }

  if (
    t.includes('伝えたい') ||
    t.includes('出したい') ||
    t.includes('言いたい') ||
    t.includes('向き合いたい') ||
    t.includes('手を伸ば')
  ) {
    bump(state, 'reach', 0.35);
  }

  if (
    t.includes('もういい') ||
    t.includes('無理') ||
    t.includes('仕方ない') ||
    t.includes('諦め')
  ) {
    bump(state, 'resignation', 0.45);
  }

  if (
    t.includes('恥') ||
    t.includes('比べ') ||
    t.includes('笑われ') ||
    t.includes('自信がない') ||
    t.includes('情けない')
  ) {
    bump(state, 'shame', 0.4);
  }

  // --- 混ざり方を見る補正 ---
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

  // --- 長さと密度による軽い補正 ---
  if (t.length > 60) {
    bump(state, 'unfinished', 0.08);
  }

  if (t.length > 120) {
    bump(state, 'fear', 0.05);
    bump(state, 'shame', 0.05);
  }

  // --- 典型的な組み合わせの補正 ---
  // 「やりたいのに動けない」系
  if (state.desire > 0.3 && state.freeze > 0.3) {
    bump(state, 'unfinished', 0.15);
  }

  // 「恥ずかしいけど出したい」系
  if (state.shame > 0.25 && state.reach > 0.2) {
    bump(state, 'desire', 0.1);
  }

  // 「諦め」っぽいけど、まだ本音が残っている
  if (state.resignation > 0.25 && state.unfinished > 0.25) {
    bump(state, 'resignation', -0.08);
    bump(state, 'unfinished', 0.1);
  }

  return Object.fromEntries(
    Object.entries(state).map(([k, v]) => [k, clamp01(Number(v.toFixed(2)))])
  );
};