// src/runtime/buildMirrorStateGuide.js
// Mirror 専用の状態ガイド生成
// 場全体の力学を短いラベルで示す

/**
 * Mirror 専用の状態ガイドを生成する
 * @param {object} signals - selectMirrorSignals の出力
 * @returns {string} 状態ガイド（短いラベル列）
 */
export const buildMirrorStateGuide = (signals = {}) => {
  const { mainConflict = '', repeatedPattern = '', unresolvedPoint = '' } = signals;

  const labels = [];

  const hasStrongConflict = mainConflict.includes('割れ') || mainConflict.includes('引') || mainConflict.includes('同時');
  const hasRepeatedPattern = repeatedPattern && !repeatedPattern.includes('まだ強い反復は少ない');
  const hasOpenQuestion = unresolvedPoint.includes('開いたまま') || unresolvedPoint.includes('開いている') || unresolvedPoint.includes('閉じていない');

  if (hasStrongConflict) labels.push('両側残存');
  if (hasRepeatedPattern) labels.push('反復継続');
  if (hasOpenQuestion) labels.push('未解決開放');

  if (labels.length === 0) labels.push('場底感情');

  return `[${labels.join(', ')}]`;
};
