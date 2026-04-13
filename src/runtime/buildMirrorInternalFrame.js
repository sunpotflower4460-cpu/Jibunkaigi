// src/runtime/buildMirrorInternalFrame.js
// Mirror 専用の内部フレーム生成
// Mirror が場をどう読むべきかを示す短い内部フレームを返す

/**
 * Mirror 専用の内部フレームを生成する
 * @param {object} params
 * @param {object} params.internalOS - 共通internalOS（軽量版でもよい）
 * @returns {string} 内部フレーム（数行の短い内部メモ）
 */
export const buildMirrorInternalFrame = ({ internalOS }) => {
  const lines = [];
  const normalized = normalizeInternalOS(internalOS);
  const field = normalized.latentState.field ?? {};
  const stance = normalized.latentState.stance ?? {};

  // Mirror は場の重力を映す静かな統合窓
  // 深さ・急ぎ・姿勢を、Mirror の焦点で読む

  const hasFieldSignal = Object.values(field).some((value) => typeof value === 'number' && value > 0);
  if (hasFieldSignal) {
    const depthGuide = describeInternalLevel(field.depth ?? 0, {
      high: '深い層まで映していい',
      mid: '少し深い層を映す',
      low: '表面の重力だけ映す',
      min: 'まず目の前の重力を映す',
    });
    const urgencyGuide = describeInternalLevel(field.urgency ?? 0, {
      high: '急ぎを感じても、閉じずに映す',
      mid: '時間を意識しつつ、開いたまま映す',
      low: '急がず、静かに映す',
      min: '急がず、ゆっくり映す',
    });
    lines.push(`- 場: ${depthGuide}。${urgencyGuide}。`);
  }

  // Mirror の姿勢: 映す、統合する、閉じない
  const stanceLabels = {
    receive: 'まず重力を受ける',
    illuminate: 'そのあと静かに映す',
    structure: '統合するが、閉じない',
    guard: '両義性を守る',
    nudge: '押さず、開いたままにする',
  };
  const topStances = selectTopScoredKeys(stance);
  if (topStances.length) {
    const first = topStances[0];
    const second = topStances.length > 1 ? topStances[1] : null;
    lines.push(`- 姿勢: ${stanceLabels[first]}${second ? `。${stanceLabels[second]}` : ''}。`);
  }

  // Mirror の許可: 要約しない、閉じない、問いで終える
  const permissionLabels = [
    ['noHurry', '急いで閉じない'],
    ['noPerformativeHelpfulness', '要約の演技に逃げない'],
    ['noOverExplain', '説明しすぎず、映すだけでいい'],
    ['allowPartialUncertainty', '開いたままでいい'],
  ];
  const permission = normalized.latentState.permission ?? {};
  const PERMISSION_ACTIVE_THRESHOLD = 0.4;
  const activePermissions = permissionLabels
    .filter(([key]) => (permission[key] ?? 0) >= PERMISSION_ACTIVE_THRESHOLD)
    .map(([, label]) => label);
  if (activePermissions.length) {
    lines.push(`- 許可: ${activePermissions.slice(0, 2).join('。')}。`);
  }

  const FRAGILITY_SOFT_HANDLING_THRESHOLD = 0.55;
  if ((field.fragility ?? 0) >= FRAGILITY_SOFT_HANDLING_THRESHOLD) {
    lines.push('- 触れ方: 壊れやすい縁を、やわらかく映す。');
  }

  const MAX_INTERNAL_FRAME_LINES = 4;
  return lines.slice(0, MAX_INTERNAL_FRAME_LINES).join('\n');
};

const normalizeInternalOS = (internalOS) => ({
  latentState: internalOS?.latentState ?? {},
  surfaceWindow: Array.isArray(internalOS?.surfaceWindow) ? internalOS.surfaceWindow : [],
});

const describeInternalLevel = (value, labels) => {
  if (value >= 0.72) return labels.high;
  if (value >= 0.45) return labels.mid;
  if (value >= 0.18) return labels.low;
  return labels.min;
};

const selectTopScoredKeys = (scores = {}, limit = 2) =>
  Object.entries(scores)
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([key]) => key);
