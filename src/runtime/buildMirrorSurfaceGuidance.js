// src/runtime/buildMirrorSurfaceGuidance.js
// Mirror 専用の表層ガイダンス生成
// surfaceFrame を bridge データへ変換（自然文指示を削除）

/**
 * Mirror 専用の表層ガイダンスを生成する
 * @param {object} surfaceFrame - 共通surfaceFrame
 * @returns {string} 表層ガイダンス（structured bridge のみ）
 */
export const buildMirrorSurfaceGuidance = (surfaceFrame) => {
  if (!surfaceFrame) return '';

  const fields = [];

  // pacing
  if (surfaceFrame.pacing) {
    fields.push(`pacing: ${surfaceFrame.pacing}`);
  }

  // directness
  if (surfaceFrame.directness) {
    fields.push(`directness: ${surfaceFrame.directness}`);
  }

  // emotionalTemperature
  if (surfaceFrame.emotionalTemperature) {
    fields.push(`temperature: ${surfaceFrame.emotionalTemperature}`);
  }

  // restraint
  if (surfaceFrame.restraint) {
    const r = surfaceFrame.restraint;
    if (r.holdBackSummary >= 0.65) fields.push('no-summary');
    if (r.keepSilenceMargin >= 0.55) fields.push('silence-margin');
  }

  // speakIntentKey
  if (surfaceFrame.speakIntentKey) {
    fields.push(`intent: ${surfaceFrame.speakIntentKey}`);
  }

  // focusHint / meaningHint
  if (surfaceFrame.focusHint) fields.push(`focus: ${surfaceFrame.focusHint}`);
  if (surfaceFrame.meaningHint) fields.push(`meaning: ${surfaceFrame.meaningHint}`);

  if (fields.length > 0) {
    return `\n[${fields.slice(0, 5).join(', ')}]`;
  }
  return '';
};
