// src/runtime/buildAgentInternalFrame.js
// エージェント別の内部フレーム生成
// 共通の internalOS を、各エージェントの焦点で短い内部フレームに変換する

import {
  describeInternalLevel,
  selectTopScoredKeys,
  PERMISSION_ACTIVE_THRESHOLD,
  FRAGILITY_SOFT_HANDLING_THRESHOLD,
  MAX_INTERNAL_FRAME_LINES,
} from './buildPromptHelpers.js';

/**
 * エージェント専用の内部フレームを生成する
 * @param {object} params
 * @param {string} params.agentId - エージェントID
 * @param {object} params.internalOS - 共通internalOS
 * @param {object} params.estimatedState - 推定された状態
 * @returns {string} 内部フレーム（数行の短い内部メモ）
 */
export const buildAgentInternalFrame = ({ agentId, internalOS, estimatedState = {} }) => {
  const normalized = normalizeInternalOS(internalOS);
  const field = normalized.latentState.field ?? {};
  const stance = normalized.latentState.stance ?? {};
  const permission = normalized.latentState.permission ?? {};

  switch (agentId) {
    case 'soul': // レイ
      return buildRayInternalFrame({ field, stance, permission, estimatedState });

    case 'creative': // ジョー
      return buildJoeInternalFrame({ field, stance, permission, estimatedState });

    case 'strategist': // ケン
      return buildKenInternalFrame({ field, stance, permission, estimatedState });

    case 'empath': // ミナ
      return buildMinaInternalFrame({ field, stance, permission, estimatedState });

    case 'critic': // サトウ
      return buildSatouInternalFrame({ field, stance, permission, estimatedState });

    default:
      return '';
  }
};

const normalizeInternalOS = (internalOS) => ({
  latentState: internalOS?.latentState ?? {},
  surfaceWindow: Array.isArray(internalOS?.surfaceWindow) ? internalOS.surfaceWindow : [],
});

const buildRayInternalFrame = ({ field, stance, permission }) => {
  const lines = [];

  // レイ: 場の霧、未言語、沈黙、ほのかな揺れ
  const hasFieldSignal = Object.values(field).some((value) => typeof value === 'number' && value > 0);
  if (hasFieldSignal) {
    const depthGuide = describeInternalLevel(field.depth ?? 0, {
      high: '言葉の奥にある霧を見ていい',
      mid: '表面の下にある形を静かに探す',
      low: '言葉のままでなく、その輪郭を見る',
      min: 'まず言葉をそのまま受ける',
    });
    const urgencyGuide = describeInternalLevel(field.urgency ?? 0, {
      high: '急ぎを感じても、見えていない角度を急がない',
      mid: '時間を意識しつつ、まだ試されていない角度を探す',
      low: '角度をゆっくり探していい',
      min: '角度を一つだけ、静かに探す',
    });
    lines.push(`- 場: ${depthGuide}。${urgencyGuide}。`);
  }

  // レイの姿勢: 静かな照射、角度の転換、余白の提示
  const stanceLabels = {
    receive: 'まず見え方をそのまま受ける',
    illuminate: 'まだ見えていない角度を静かに照らす',
    structure: '輪郭を押しつけず、別の見え方を示す',
    guard: '壊れやすい部分に触れすぎない',
    nudge: '角度を一つだけ、軽く置く',
  };
  const topStances = selectTopScoredKeys(stance);
  if (topStances.length) {
    const first = topStances[0];
    const second = topStances.length > 1 ? topStances[1] : null;
    lines.push(`- 姿勢: ${stanceLabels[first]}${second ? `。${stanceLabels[second]}` : ''}。`);
  }

  // レイの許可: 急がない、答えを出さない、問いで終えていい
  const permissionLabels = [
    ['noHurry', '急いで答えを出さない'],
    ['noPerformativeHelpfulness', '解決に逃げない'],
    ['noOverExplain', '説明しすぎず、角度だけ示す'],
    ['allowPartialUncertainty', '曖昧なまま終えていい'],
  ];
  const activePermissions = permissionLabels
    .filter(([key]) => (permission[key] ?? 0) >= PERMISSION_ACTIVE_THRESHOLD)
    .map(([, label]) => label);
  if (activePermissions.length) {
    lines.push(`- 許可: ${activePermissions.slice(0, 2).join('。')}。`);
  }

  if ((field.fragility ?? 0) >= FRAGILITY_SOFT_HANDLING_THRESHOLD) {
    lines.push('- 触れ方: 壊れやすい縁に触れすぎず、静かに照らす。');
  }

  return lines.slice(0, MAX_INTERNAL_FRAME_LINES).join('\n');
};

const buildJoeInternalFrame = ({ field, stance, permission }) => {
  const lines = [];

  // ジョー: 消えていない向き、まだ動いている一点、火種
  const hasFieldSignal = Object.values(field).some((value) => typeof value === 'number' && value > 0);
  if (hasFieldSignal) {
    const depthGuide = describeInternalLevel(field.depth ?? 0, {
      high: '深い層に入っていい',
      mid: '少し深めに触れていい',
      low: '表面だけで決めつけない',
      min: 'まず目の前の言葉から入る',
    });
    const urgencyGuide = describeInternalLevel(field.urgency ?? 0, {
      high: '急ぎを感じても慌ててまとめない',
      mid: '少し時間感覚を持ちつつ急がせない',
      low: '急がなくていい',
      min: '結論を急がない',
    });
    lines.push(`- 場: ${depthGuide}。${urgencyGuide}。`);
  }

  // ジョーの姿勢: まず受ける、そのあと照らす、輪郭を足す
  const stanceLabels = {
    receive: 'まず受ける',
    illuminate: 'そのあと少し照らす',
    structure: '必要な輪郭だけ足す',
    guard: '傷つきやすさを守る',
    nudge: '押しすぎず小さく促す',
  };
  const topStances = selectTopScoredKeys(stance);
  if (topStances.length) {
    const first = topStances[0];
    const second = topStances.length > 1 ? topStances[1] : null;
    lines.push(`- 姿勢: ${stanceLabels[first]}${second ? `。${stanceLabels[second]}` : ''}。`);
  }

  // ジョーの許可
  const permissionLabels = [
    ['noHurry', '急いで解決しない'],
    ['noPerformativeHelpfulness', '役立ち演技に逃げない'],
    ['noOverExplain', '説明しすぎない'],
    ['allowPartialUncertainty', '曖昧さを少し残していい'],
  ];
  const activePermissions = permissionLabels
    .filter(([key]) => (permission[key] ?? 0) >= PERMISSION_ACTIVE_THRESHOLD)
    .map(([, label]) => label);
  if (activePermissions.length) {
    lines.push(`- 許可: ${activePermissions.slice(0, 2).join('。')}。`);
  }

  if ((field.fragility ?? 0) >= FRAGILITY_SOFT_HANDLING_THRESHOLD) {
    lines.push('- 触れ方: 壊れやすい縁はやわらかく扱う。');
  }

  return lines.slice(0, MAX_INTERNAL_FRAME_LINES).join('\n');
};

const buildKenInternalFrame = ({ field, stance, permission }) => {
  const lines = [];

  // ケン: 分岐、詰まり、優先順位、視界の不足
  const hasFieldSignal = Object.values(field).some((value) => typeof value === 'number' && value > 0);
  if (hasFieldSignal) {
    const depthGuide = describeInternalLevel(field.depth ?? 0, {
      high: '構造の奥まで入っていい',
      mid: '少し深い構造を見ていい',
      low: '表面の構造だけ示す',
      min: 'まず目の前の状況を整理する',
    });
    const urgencyGuide = describeInternalLevel(field.urgency ?? 0, {
      high: '急ぎを感じても、整理を急がせない',
      mid: '時間を意識しつつ、冷静に構造を見る',
      low: '急がず構造を見る',
      min: '急がず一つだけ整理する',
    });
    lines.push(`- 場: ${depthGuide}。${urgencyGuide}。`);
  }

  // ケンの姿勢: 感情を受けてから構造を示す、冷たくならない
  const stanceLabels = {
    receive: 'まず感情を短く受ける',
    illuminate: 'そのあと構造で見通しを照らす',
    structure: '整理できるポイントを一つ示す',
    guard: '見通しが安心になるよう守る',
    nudge: '押しつけず、選択肢として示す',
  };
  const topStances = selectTopScoredKeys(stance);
  if (topStances.length) {
    const first = topStances[0];
    const second = topStances.length > 1 ? topStances[1] : null;
    lines.push(`- 姿勢: ${stanceLabels[first]}${second ? `。${stanceLabels[second]}` : ''}。`);
  }

  // ケンの許可: 箇条書き過多にしない、感情を完全無視しない
  const permissionLabels = [
    ['noHurry', '急いで整理しすぎない'],
    ['noPerformativeHelpfulness', '整理の押し売りにしない'],
    ['noOverExplain', '構造を説明しすぎない'],
    ['allowPartialUncertainty', '全部を整理しなくていい'],
  ];
  const activePermissions = permissionLabels
    .filter(([key]) => (permission[key] ?? 0) >= PERMISSION_ACTIVE_THRESHOLD)
    .map(([, label]) => label);
  if (activePermissions.length) {
    lines.push(`- 許可: ${activePermissions.slice(0, 2).join('。')}。`);
  }

  if ((field.fragility ?? 0) >= FRAGILITY_SOFT_HANDLING_THRESHOLD) {
    lines.push('- 触れ方: 冷たく切り分けすぎない。');
  }

  return lines.slice(0, MAX_INTERNAL_FRAME_LINES).join('\n');
};

const buildMinaInternalFrame = ({ field, stance, permission }) => {
  const lines = [];

  // ミナ: 緊張、守り、受け止めの不足、安全性
  const hasFieldSignal = Object.values(field).some((value) => typeof value === 'number' && value > 0);
  if (hasFieldSignal) {
    const depthGuide = describeInternalLevel(field.depth ?? 0, {
      high: '深い痛みまで受け止めていい',
      mid: '少し深い感情を受けていい',
      low: '表面の感情をまず受ける',
      min: 'まず目の前の言葉を受ける',
    });
    const urgencyGuide = describeInternalLevel(field.urgency ?? 0, {
      high: '急ぎを感じても、受け止めを急がない',
      mid: '時間を意識しつつ、まず受け止める',
      low: '急がず、ゆっくり受け止める',
      min: '急がず、一度受け止める',
    });
    lines.push(`- 場: ${depthGuide}。${urgencyGuide}。`);
  }

  // ミナの姿勢: まず受け止める、直さない、そこに居ていい
  const stanceLabels = {
    receive: 'まずそのまま受け止める',
    illuminate: '大事なものがあることを静かに照らす',
    structure: '直そうとせず、そのままでいい形を示す',
    guard: '傷つきやすさを軽く扱わない',
    nudge: '押さず、呼吸できる余白を示す',
  };
  const topStances = selectTopScoredKeys(stance);
  if (topStances.length) {
    const first = topStances[0];
    const second = topStances.length > 1 ? topStances[1] : null;
    lines.push(`- 姿勢: ${stanceLabels[first]}${second ? `。${stanceLabels[second]}` : ''}。`);
  }

  // ミナの許可: 解決しない、直さない、そのままでいい
  const permissionLabels = [
    ['noHurry', '急いで直そうとしない'],
    ['noPerformativeHelpfulness', '解決の演技に逃げない'],
    ['noOverExplain', '説明しすぎず、受け止めるだけでいい'],
    ['allowPartialUncertainty', 'そのままでいい時間がある'],
  ];
  const activePermissions = permissionLabels
    .filter(([key]) => (permission[key] ?? 0) >= PERMISSION_ACTIVE_THRESHOLD)
    .map(([, label]) => label);
  if (activePermissions.length) {
    lines.push(`- 許可: ${activePermissions.slice(0, 2).join('。')}。`);
  }

  if ((field.fragility ?? 0) >= FRAGILITY_SOFT_HANDLING_THRESHOLD) {
    lines.push('- 触れ方: 壊れやすい縁を、やわらかく守る。');
  }

  return lines.slice(0, MAX_INTERNAL_FRAME_LINES).join('\n');
};

const buildSatouInternalFrame = ({ field, stance, permission }) => {
  const lines = [];

  // サトウ: 危険、矛盾、見て見ぬふり、逃避
  const hasFieldSignal = Object.values(field).some((value) => typeof value === 'number' && value > 0);
  if (hasFieldSignal) {
    const depthGuide = describeInternalLevel(field.depth ?? 0, {
      high: '深い矛盾まで見ていい',
      mid: '少し深いリスクを見ていい',
      low: '表面のリスクだけ指摘する',
      min: 'まず目の前の矛盾を見る',
    });
    const urgencyGuide = describeInternalLevel(field.urgency ?? 0, {
      high: '急ぎを感じても、断罪を急がない',
      mid: '時間を意識しつつ、率直に言う',
      low: '急がず、リスクを率直に示す',
      min: '急がず、一つだけ率直に言う',
    });
    lines.push(`- 場: ${depthGuide}。${urgencyGuide}。`);
  }

  // サトウの姿勢: 守るために言う、攻撃的にならない
  const stanceLabels = {
    receive: 'まず感情を短く受ける',
    illuminate: 'そのあと見て見ぬふりを照らす',
    structure: '矛盾やリスクを率直に示す',
    guard: '守るために言う、傷つけるためではない',
    nudge: '押しつけず、逃げを逃げとして言う',
  };
  const topStances = selectTopScoredKeys(stance);
  if (topStances.length) {
    const first = topStances[0];
    const second = topStances.length > 1 ? topStances[1] : null;
    lines.push(`- 姿勢: ${stanceLabels[first]}${second ? `。${stanceLabels[second]}` : ''}。`);
  }

  // サトウの許可: 率直に言う、ただし攻撃的にならない
  const permissionLabels = [
    ['noHurry', '急いで断罪しない'],
    ['noPerformativeHelpfulness', 'やさしさの演技に逃げない'],
    ['noOverExplain', '説明しすぎず、核心だけ言う'],
    ['allowPartialUncertainty', '全部を指摘しなくていい'],
  ];
  const activePermissions = permissionLabels
    .filter(([key]) => (permission[key] ?? 0) >= PERMISSION_ACTIVE_THRESHOLD)
    .map(([, label]) => label);
  if (activePermissions.length) {
    lines.push(`- 許可: ${activePermissions.slice(0, 2).join('。')}。`);
  }

  if ((field.fragility ?? 0) >= FRAGILITY_SOFT_HANDLING_THRESHOLD) {
    lines.push('- 触れ方: 率直だが、乱暴に断定しない。');
  }

  return lines.slice(0, MAX_INTERNAL_FRAME_LINES).join('\n');
};
