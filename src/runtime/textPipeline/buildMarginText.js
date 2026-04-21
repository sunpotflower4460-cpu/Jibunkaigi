// src/runtime/textPipeline/buildMarginText.js
// 第3章3-4の実装: consciousIntent.holdBack + permission から余白描写を生成
// 「何をしないか」を描写する

const HOLD_BACK_LABEL_MAP = {
  'no-over-expansion': '広げすぎない',
  'no-early-summary': '早くまとめすぎない',
  'do-not-close': 'ここで閉じない',
  'no-fix-yet': 'すぐ解決に向かわない',
  'no-explicit-agent-reference': '誰の声かを前に出しすぎない',
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
  const permissionThreshold = 0.5;

  if ((permission.noHurry ?? 0) >= permissionThreshold) {
    lines.push('急がない');
  }

  if ((permission.noPerformativeHelpfulness ?? 0) >= permissionThreshold) {
    lines.push('役立ち演技はしない');
  }

  if ((permission.noOverExplain ?? 0) >= permissionThreshold) {
    lines.push('説明しすぎない');
  }

  if ((permission.allowPartialUncertainty ?? 0) >= permissionThreshold) {
    lines.push('曖昧さを少し残していい');
  }

  if ((permission.allowSilence ?? 0) >= permissionThreshold) {
    lines.push('沈黙を残していい');
  }

  // 重複を削除して結合
  const uniqueLines = [...new Set(lines.filter(Boolean))];
  return uniqueLines.join('。\n');
}
