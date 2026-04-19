// src/runtime/buildAgentSurfaceGuidance.js
// エージェント別の表層ガイダンス生成
// 共通 surfaceFrame を、各エージェントの表の出方に変換する
//
// Phase 8: Now includes consciousIntent and lengthPlan integration

import { sanitizeSurfaceOutput } from './surfaceGuard.js';

/**
 * エージェント専用の表層ガイダンスを生成する
 * @param {object} params
 * @param {string} params.agentId - エージェントID
 * @param {object} params.surfaceFrame - 共通surfaceFrame
 * @returns {string} 表層ガイダンス（短い内部ガイド）
 */
export const buildAgentSurfaceGuidance = ({ agentId, surfaceFrame }) => {
  if (!surfaceFrame) return '';

  const sanitize = (text) => sanitizeSurfaceOutput(text);

  switch (agentId) {
    case 'soul': // レイ
      return sanitize(buildRaySurfaceGuidance(surfaceFrame));

    case 'creative': // ジョー
      return sanitize(buildJoeSurfaceGuidance(surfaceFrame));

    case 'strategist': // ケン
      return sanitize(buildKenSurfaceGuidance(surfaceFrame));

    case 'empath': // ミナ
      return sanitize(buildMinaSurfaceGuidance(surfaceFrame));

    case 'critic': // サトウ
      return sanitize(buildSatouSurfaceGuidance(surfaceFrame));

    default:
      return '';
  }
};

const pushPreconditionHints = (hints, surfaceFrame) => {
  if (surfaceFrame.focusHint) hints.push(surfaceFrame.focusHint);
  if (surfaceFrame.meaningHint) hints.push(surfaceFrame.meaningHint);
  if (surfaceFrame.identityHint) hints.push(surfaceFrame.identityHint);
};

const pushDecisionHints = (hints, surfaceFrame) => {
  switch (surfaceFrame.speakIntentKey) {
    case 'touch_living_thread':
      hints.push('まだ切れていない一点に触れる');
      break;
    case 'name_hidden_knot':
      hints.push('隠れた結び目を短く言う');
      break;
    case 'make_room_before_move':
      hints.push('動かす前に余白をつくる');
      break;
    case 'stay_with_preverbal':
      hints.push('まだ言葉になる手前にとどまる');
      break;
    case 'reflect_unclosed_weight':
      hints.push('閉じていない重さを映す');
      break;
    case 'return_to_ground':
      hints.push('まず足場に戻る');
      break;
    default:
      break;
  }

  if ((surfaceFrame.touchDepth ?? 0) >= 0.66) {
    hints.push('少し深めまで触れていい');
  }

  if ((surfaceFrame.restraint?.holdBackSolution ?? 0) >= 0.65) {
    hints.push('すぐ解決しない');
  }
  if ((surfaceFrame.restraint?.holdBackSummary ?? 0) >= 0.65) {
    hints.push('まとめに逃げない');
  }
  if ((surfaceFrame.restraint?.keepSilenceMargin ?? 0) >= 0.55) {
    hints.push('少し余白を残す');
  }
};

// Phase 8: Push hints from consciousIntent
const pushConsciousIntentHints = (hints, surfaceFrame) => {
  const consciousIntent = surfaceFrame.consciousIntent;
  if (!consciousIntent) return;

  const speakIntent = consciousIntent.speakIntent;
  const holdBack = consciousIntent.holdBack ?? [];

  // Add speakIntent as directional hint (NOT verbatim)
  switch (speakIntent) {
    case 'touch-the-living-point':
      hints.push('まだ鈍っていない一点へ');
      break;
    case 'clarify-the-knot':
      hints.push('結び目を短く言う');
      break;
    case 'make-room-without-closing':
      hints.push('余白をつくる');
      break;
    case 'return-to-footing':
      hints.push('足場に戻る');
      break;
    case 'reflect-the-unsettled-weight':
      hints.push('閉じていない重さを映す');
      break;
    default:
      break;
  }

  // Add holdBack as narrowing pressure (NOT prohibitions)
  if (holdBack.includes('no-early-summary')) {
    hints.push('要約調を抑える');
  }
  if (holdBack.includes('no-fix-yet')) {
    hints.push('解決を急がない');
  }
  if (holdBack.includes('no-over-expansion')) {
    hints.push('触れる点数を増やしすぎない');
  }
  if (holdBack.includes('do-not-close')) {
    hints.push('断定で閉じすぎない');
  }
};

// Phase 8: Push hints from lengthPlan
const pushLengthPlanHints = (hints, surfaceFrame) => {
  const lengthPlan = surfaceFrame.lengthPlan;
  if (!lengthPlan) return;

  const target = lengthPlan.target ?? 'medium';
  const lineCountHint = lengthPlan.lineCountHint ?? 4;

  // Add target-based natural hints
  if (target === 'short' && lineCountHint <= 2) {
    hints.push('短く収める');
  } else if (target === 'long' && lineCountHint >= 6) {
    hints.push('少し広げてよい');
  }
};

const buildRaySurfaceGuidance = (surfaceFrame) => {
  const hints = [];

  if (surfaceFrame.pacing === 'slow') {
    hints.push('ゆっくりした時間への傾き');
  } else if (surfaceFrame.pacing === 'aware_of_time') {
    hints.push('時間感覚を持ちつつ止まれる');
  }

  if (surfaceFrame.directness === 'gentle') {
    hints.push('押さない方向への反応');
  } else if (surfaceFrame.directness === 'clear') {
    hints.push('明確さへの傾きはあるが押さない');
  }

  if (surfaceFrame.emotionalTemperature === 'soft') {
    hints.push('断定しない方向への傾き');
  }

  if (surfaceFrame.permissionHints.includes('do_not_rush')) {
    hints.push('急がせない圧');
  }
  if (surfaceFrame.permissionHints.includes('do_not_over_explain')) {
    hints.push('説明過多に傾かない');
  }
  pushDecisionHints(hints, surfaceFrame);
  pushConsciousIntentHints(hints, surfaceFrame); // Phase 8
  pushLengthPlanHints(hints, surfaceFrame); // Phase 8
  pushPreconditionHints(hints, surfaceFrame);

  if (hints.length > 0) {
    return `\n【表層傾向】${hints.slice(0, 5).join('。')}。`;
  }
  return '';
};

const buildJoeSurfaceGuidance = (surfaceFrame) => {
  const hints = [];

  if (surfaceFrame.pacing === 'slow') {
    hints.push('急がず、余白を残していい');
  } else if (surfaceFrame.pacing === 'aware_of_time') {
    hints.push('時間を意識しつつ進める');
  }

  if (surfaceFrame.directness === 'gentle') {
    hints.push('少しやわらかく入る');
  } else if (surfaceFrame.directness === 'clear') {
    hints.push('少し明確に示していい');
  }

  if (surfaceFrame.emotionalTemperature === 'soft') {
    hints.push('言い切りすぎない');
  } else if (surfaceFrame.emotionalTemperature === 'warm') {
    hints.push('温度を持つが、熱血テンプレにしない');
  }

  if (surfaceFrame.permissionHints.includes('do_not_rush')) {
    hints.push('急がない');
  }
  if (surfaceFrame.permissionHints.includes('do_not_over_explain')) {
    hints.push('説明しすぎない');
  }
  pushDecisionHints(hints, surfaceFrame);
  pushConsciousIntentHints(hints, surfaceFrame); // Phase 8
  pushLengthPlanHints(hints, surfaceFrame); // Phase 8
  pushPreconditionHints(hints, surfaceFrame);

  if (hints.length > 0) {
    return `\n【表層傾向】${hints.slice(0, 5).join(' ')}`;
  }
  return '';
};

const buildKenSurfaceGuidance = (surfaceFrame) => {
  const hints = [];

  // Convert action instructions to perceptual biases
  if (surfaceFrame.pacing === 'slow') {
    hints.push('構造を一つだけ見る方向への傾き');
  } else if (surfaceFrame.pacing === 'aware_of_time') {
    hints.push('時間感覚を持ちつつ見通しが立つ状態');
  }

  if (surfaceFrame.directness === 'gentle') {
    hints.push('選択肢として示す方向への反応');
  } else if (surfaceFrame.directness === 'clear') {
    hints.push('構造を明確に示せる状態');
  }

  if (surfaceFrame.emotionalTemperature === 'soft') {
    hints.push('見通しが安心になる質感への傾き');
  }

  if (surfaceFrame.permissionHints.includes('do_not_rush')) {
    hints.push('整理を急がない方向');
  }
  if (surfaceFrame.permissionHints.includes('do_not_over_explain')) {
    hints.push('箇条書き過多に傾かない');
  }
  pushDecisionHints(hints, surfaceFrame);
  pushConsciousIntentHints(hints, surfaceFrame); // Phase 8
  pushLengthPlanHints(hints, surfaceFrame); // Phase 8
  pushPreconditionHints(hints, surfaceFrame);

  if (hints.length > 0) {
    return `\n【表層傾向】${hints.slice(0, 5).join('。')}。`;
  }
  return '';
};

const buildMinaSurfaceGuidance = (surfaceFrame) => {
  const hints = [];

  // Convert action instructions to perceptual biases
  if (surfaceFrame.pacing === 'slow') {
    hints.push('余白への傾きが強い');
  } else if (surfaceFrame.pacing === 'aware_of_time') {
    hints.push('時間感覚を持ちつつ止まれる');
  }

  if (surfaceFrame.directness === 'gentle') {
    hints.push('やわらかい質感への反応');
  } else if (surfaceFrame.directness === 'clear') {
    hints.push('明確さと柔らかさの両立傾向');
  }

  if (surfaceFrame.emotionalTemperature === 'soft') {
    hints.push('断定より余白を残す傾き');
  } else if (surfaceFrame.emotionalTemperature === 'warm') {
    hints.push('温度は持つが型には逃げない');
  }

  if (surfaceFrame.permissionHints.includes('do_not_rush')) {
    hints.push('急がせない方向へ');
  }
  if (surfaceFrame.permissionHints.includes('do_not_over_explain')) {
    hints.push('説明過多に傾かない');
  }
  pushDecisionHints(hints, surfaceFrame);
  pushConsciousIntentHints(hints, surfaceFrame); // Phase 8
  pushLengthPlanHints(hints, surfaceFrame); // Phase 8
  pushPreconditionHints(hints, surfaceFrame);

  if (hints.length > 0) {
    return `\n【表層傾向】${hints.slice(0, 5).join('。')}。`;
  }
  return '';
};

const buildSatouSurfaceGuidance = (surfaceFrame) => {
  const hints = [];

  if (surfaceFrame.pacing === 'slow') {
    hints.push('急がず、核心だけ言う');
  } else if (surfaceFrame.pacing === 'aware_of_time') {
    hints.push('時間を意識しつつ、率直に言う');
  }

  if (surfaceFrame.directness === 'gentle') {
    hints.push('率直だが、攻撃的にならない');
  } else if (surfaceFrame.directness === 'clear') {
    hints.push('率直に、でも乱暴な断定にしない');
  }

  if (surfaceFrame.emotionalTemperature === 'soft') {
    hints.push('言い切りすぎず、守るために言う');
  }

  if (surfaceFrame.permissionHints.includes('do_not_rush')) {
    hints.push('断罪を急がない');
  }
  if (surfaceFrame.permissionHints.includes('do_not_over_explain')) {
    hints.push('説明しすぎず、核心だけ');
  }
  pushDecisionHints(hints, surfaceFrame);
  pushConsciousIntentHints(hints, surfaceFrame); // Phase 8
  pushLengthPlanHints(hints, surfaceFrame); // Phase 8
  pushPreconditionHints(hints, surfaceFrame);

  if (hints.length > 0) {
    return `\n【表層傾向】${hints.slice(0, 5).join('。')}。`;
  }
  return '';
};
