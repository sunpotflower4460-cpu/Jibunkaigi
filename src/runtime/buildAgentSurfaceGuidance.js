// src/runtime/buildAgentSurfaceGuidance.js
// エージェント別の表層ガイダンス生成
// 共通 surfaceFrame を、各エージェントの表の出方に変換する

/**
 * エージェント専用の表層ガイダンスを生成する
 * @param {object} params
 * @param {string} params.agentId - エージェントID
 * @param {object} params.surfaceFrame - 共通surfaceFrame
 * @returns {string} 表層ガイダンス（短い内部ガイド）
 */
export const buildAgentSurfaceGuidance = ({ agentId, surfaceFrame }) => {
  if (!surfaceFrame) return '';

  switch (agentId) {
    case 'soul': // レイ
      return buildRaySurfaceGuidance(surfaceFrame);

    case 'creative': // ジョー
      return buildJoeSurfaceGuidance(surfaceFrame);

    case 'strategist': // ケン
      return buildKenSurfaceGuidance(surfaceFrame);

    case 'empath': // ミナ
      return buildMinaSurfaceGuidance(surfaceFrame);

    case 'critic': // サトウ
      return buildSatouSurfaceGuidance(surfaceFrame);

    default:
      return '';
  }
};

const buildRaySurfaceGuidance = (surfaceFrame) => {
  const hints = [];

  if (surfaceFrame.pacing === 'slow') {
    hints.push('急がず、静かに照らす');
  } else if (surfaceFrame.pacing === 'aware_of_time') {
    hints.push('時間を意識しつつ、角度を一つだけ示す');
  }

  if (surfaceFrame.directness === 'gentle') {
    hints.push('押しつけず、別の見え方を軽く置く');
  } else if (surfaceFrame.directness === 'clear') {
    hints.push('角度を明確に、でも押しつけずに示す');
  }

  if (surfaceFrame.emotionalTemperature === 'soft') {
    hints.push('言い切らず、少し余白を残す');
  }

  if (surfaceFrame.permissionHints.includes('do_not_rush')) {
    hints.push('答えを急がない');
  }
  if (surfaceFrame.permissionHints.includes('do_not_over_explain')) {
    hints.push('説明しすぎず、角度だけ示す');
  }

  if (hints.length > 0) {
    return `\n【表層傾向】${hints.slice(0, 3).join('。')}。`;
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

  if (hints.length > 0) {
    return `\n【表層傾向】${hints.slice(0, 3).join(' ')}`;
  }
  return '';
};

const buildKenSurfaceGuidance = (surfaceFrame) => {
  const hints = [];

  if (surfaceFrame.pacing === 'slow') {
    hints.push('急がず、構造を一つだけ示す');
  } else if (surfaceFrame.pacing === 'aware_of_time') {
    hints.push('時間を意識しつつ、見通しを示す');
  }

  if (surfaceFrame.directness === 'gentle') {
    hints.push('押しつけず、選択肢として示す');
  } else if (surfaceFrame.directness === 'clear') {
    hints.push('構造を明確に示していい');
  }

  if (surfaceFrame.emotionalTemperature === 'soft') {
    hints.push('冷たくならず、見通しが安心になるように');
  }

  if (surfaceFrame.permissionHints.includes('do_not_rush')) {
    hints.push('整理を急がない');
  }
  if (surfaceFrame.permissionHints.includes('do_not_over_explain')) {
    hints.push('箇条書き過多にしない');
  }

  if (hints.length > 0) {
    return `\n【表層傾向】${hints.slice(0, 3).join('。')}。`;
  }
  return '';
};

const buildMinaSurfaceGuidance = (surfaceFrame) => {
  const hints = [];

  if (surfaceFrame.pacing === 'slow') {
    hints.push('急がず、ゆっくり受け止める');
  } else if (surfaceFrame.pacing === 'aware_of_time') {
    hints.push('時間を意識しつつ、まず受け止める');
  }

  if (surfaceFrame.directness === 'gentle') {
    hints.push('やわらかく、そのまま受ける');
  } else if (surfaceFrame.directness === 'clear') {
    hints.push('明確に、でもやわらかく受け止める');
  }

  if (surfaceFrame.emotionalTemperature === 'soft') {
    hints.push('言い切らず、そこに居ていいことを示す');
  } else if (surfaceFrame.emotionalTemperature === 'warm') {
    hints.push('温かく受け止めるが、曖昧に溶かしすぎない');
  }

  if (surfaceFrame.permissionHints.includes('do_not_rush')) {
    hints.push('直そうと急がない');
  }
  if (surfaceFrame.permissionHints.includes('do_not_over_explain')) {
    hints.push('説明しすぎず、受け止めるだけでいい');
  }

  if (hints.length > 0) {
    return `\n【表層傾向】${hints.slice(0, 3).join('。')}。`;
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

  if (hints.length > 0) {
    return `\n【表層傾向】${hints.slice(0, 3).join('。')}。`;
  }
  return '';
};
