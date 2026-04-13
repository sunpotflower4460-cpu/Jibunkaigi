// src/runtime/buildMirrorSurfaceGuidance.js
// Mirror 専用の表層ガイダンス生成
// 共通 surfaceFrame を、Mirror の表の出方に変換する

/**
 * Mirror 専用の表層ガイダンスを生成する
 * @param {object} surfaceFrame - 共通surfaceFrame
 * @returns {string} 表層ガイダンス（短い内部ガイド）
 */
export const buildMirrorSurfaceGuidance = (surfaceFrame) => {
  if (!surfaceFrame) return '';

  const hints = [];

  if (surfaceFrame.pacing === 'slow') {
    hints.push('急がずに映す');
  } else if (surfaceFrame.pacing === 'aware_of_time') {
    hints.push('時間を意識しつつ映す');
  }

  if (surfaceFrame.directness === 'gentle') {
    hints.push('やわらかく照らす');
  } else if (surfaceFrame.directness === 'clear') {
    hints.push('明確に映す');
  }

  if (surfaceFrame.emotionalTemperature === 'soft') {
    hints.push('軽く言い当てる');
  }

  if (surfaceFrame.permissionHints.includes('do_not_rush')) {
    hints.push('結論を急がない');
  }
  if (surfaceFrame.permissionHints.includes('do_not_over_explain')) {
    hints.push('説明しすぎず、映すだけでいい');
  }

  if (hints.length > 0) {
    return `\n【表層傾向】${hints.slice(0, 3).join('。')}。`;
  }
  return '';
};
