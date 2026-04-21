// src/runtime/textPipeline/buildMarginText.js
// 第3章3-4の実装: consciousIntent.holdBack + permission から余白描写を生成
// 「何をしないか」を描写する

const HOLD_BACK_LABEL_MAP = {
  'no-over-expansion': 'まだ広げなくていい',
  'no-early-summary': 'まだまとめの手前にいられる',
  'do-not-close': 'ここではまだ閉じなくていい',
  'no-fix-yet': 'まだ解決へ急がなくていい',
  'no-explicit-agent-reference': '誰として話すかを前に出さなくても届く',
};

const translateHoldBackLabel = (label) => {
  const normalized = String(label ?? '').trim();
  if (!normalized) return null;

  const lower = normalized.toLowerCase();
  if (HOLD_BACK_LABEL_MAP[lower]) {
    return HOLD_BACK_LABEL_MAP[lower];
  }

  // ラベル記号は出さず、控えめな一般表現に落とす
  const isAsciiOnly = normalized.split('').every(ch => ch.charCodeAt(0) <= 0x7f);
  if (isAsciiOnly) {
    return '少し抑えておく';
  }

  return normalized;
};

/**
 * consciousIntent と permission から余白の描写を生成
 * @param {object} latentState - runInternalOS の出力
 * @returns {string} 日本語の余白描写（空の場合は空文字）
 */
export function buildMarginText(latentState = {}) {
  const consciousIntent = latentState?.consciousIntent || {};
  const permission = latentState?.permission || {};

  const lines = [];

  // consciousIntent.holdBack: 意図的に控えること
  const holdBack = consciousIntent.holdBack;
  if (Array.isArray(holdBack)) {
    holdBack
      .map(translateHoldBackLabel)
      .filter(Boolean)
      .slice(0, 3)
      .forEach((entry) => lines.push(entry));
  } else if (holdBack && typeof holdBack === 'string' && holdBack.trim()) {
    lines.push(holdBack.trim());
  }

  // permission からの余白描写
  // 禁止文より場の雰囲気として表現する
  const permissionThreshold = 0.5;

  if ((permission.noHurry ?? 0) >= permissionThreshold) {
    lines.push('まだ急いで結ばなくていい');
  }

  if ((permission.noPerformativeHelpfulness ?? 0) >= permissionThreshold) {
    lines.push('役に立とうとしなくても、場は成り立つ');
  }

  if ((permission.noOverExplain ?? 0) >= permissionThreshold) {
    lines.push('言い切らなくても崩れない');
  }

  if ((permission.allowPartialUncertainty ?? 0) >= permissionThreshold) {
    lines.push('ここでは少し曖昧なままでも大丈夫');
  }

  if ((permission.allowSilence ?? 0) >= permissionThreshold) {
    lines.push('少し黙っていても途切れない');
  }

  if ((permission.allowDepth ?? 0) >= permissionThreshold) {
    lines.push('深く入っても大丈夫');
  }

  if ((permission.allowDirectness ?? 0) >= permissionThreshold) {
    lines.push('そのまま言っても崩れない');
  }

  if ((permission.allowRawFeeling ?? 0) >= permissionThreshold) {
    lines.push('感じたままに触れていい');
  }

  // 重複を削除して結合
  const uniqueLines = [...new Set(lines.filter(Boolean))];
  return uniqueLines.join('。\n');
}
