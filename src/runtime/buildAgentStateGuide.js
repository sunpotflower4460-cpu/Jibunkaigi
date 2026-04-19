// src/runtime/buildAgentStateGuide.js
// エージェント別の状態ガイド生成
// 各エージェントが「今回の user state にどう触れるべきか」を示す短いガイドを返す

/**
 * エージェント専用の状態ガイドを生成する
 * @param {string} agentId - エージェントID
 * @param {object} estimatedState - 推定された状態
 * @returns {string} 状態ガイド（2-5行程度）
 */
export const buildAgentStateGuide = (agentId, estimatedState = {}) => {
  const {
    desire = 0,
    fear = 0,
    freeze = 0,
    reach = 0,
    resignation = 0,
    selfErasure = 0,
    shame = 0,
    unfinished = 0,
  } = estimatedState;

  switch (agentId) {
    case 'soul': // レイ
      return buildRayStateGuide({ resignation, freeze, fear, shame, selfErasure, desire, unfinished });

    case 'creative': // ジョー
      return buildJoeStateGuide({ resignation, desire, fear, freeze, reach, shame, selfErasure, unfinished });

    case 'strategist': // ケン
      return buildKenStateGuide({ resignation, freeze, desire, fear, shame, selfErasure, unfinished });

    case 'empath': // ミナ
      return buildMinaStateGuide({ shame, selfErasure, fear, resignation, freeze, reach, unfinished });

    case 'critic': // サトウ
      return buildSatouStateGuide({ resignation, desire, fear, freeze, shame, selfErasure, unfinished });

    default:
      return '';
  }
};

const buildRayStateGuide = ({ resignation, freeze, fear, shame, selfErasure, desire, unfinished }) => {
  const labels = [];

  if (resignation > 0.3) labels.push('resignation-angle-shift');
  if (freeze > 0.2 && (shame > 0.15 || selfErasure > 0.15)) labels.push('freeze-with-margin');
  if (fear > 0.2 && (desire > 0.1 || unfinished > 0.15)) labels.push('fear-as-proximity');
  if (shame > 0.25 || selfErasure > 0.25) labels.push('shame-near-core');
  if (unfinished > 0.2) labels.push('unfinished-angle');

  if (labels.length === 0) labels.push('unseen-angle');

  return `[${labels.join(', ')}]`;
};

const buildJoeStateGuide = ({ resignation, desire, fear, freeze, reach, shame, selfErasure, unfinished }) => {
  const labels = [];

  if (resignation > 0.3) labels.push('not-fully-closed');
  if (desire > 0.2 && freeze > 0.2) labels.push('desire-with-freeze');
  if (fear > 0.2 && (reach > 0.1 || desire > 0.2)) labels.push('fear-with-reach');
  if (shame > 0.25 || selfErasure > 0.25) labels.push('shame-not-lying');
  if (unfinished > 0.2) labels.push('unfinished-alive');

  if (labels.length === 0) labels.push('living-point');

  return `[${labels.join(', ')}]`;
};

const buildKenStateGuide = ({ resignation, freeze, desire, fear, shame, selfErasure, unfinished }) => {
  const labels = [];

  if (resignation > 0.3) labels.push('open-vs-closed');
  if (freeze > 0.2 && desire > 0.2) labels.push('tangled-separable');
  if (fear > 0.2 && (desire > 0.1 || unfinished > 0.15)) labels.push('fear-as-structure');
  if (shame > 0.25 || selfErasure > 0.25) labels.push('hidden-premise');
  if (unfinished > 0.2) labels.push('stuck-as-midway');

  if (labels.length === 0) labels.push('structural-opening');

  return `[${labels.join(', ')}]`;
};

const buildMinaStateGuide = ({ shame, selfErasure, fear, resignation, freeze, reach, unfinished }) => {
  const labels = [];

  if (shame > 0.25 || selfErasure > 0.25) labels.push('shame-received-as-is');
  if (fear > 0.2 && (resignation > 0.15 || freeze > 0.15)) labels.push('fear-with-exhaustion');
  if (freeze > 0.2 && (shame > 0.15 || selfErasure > 0.15)) labels.push('freeze-as-protection');
  if (resignation > 0.3) labels.push('resignation-received');
  if (unfinished > 0.2 || (reach > 0.1 && fear > 0.1)) labels.push('unfinished-unhurried');

  if (labels.length === 0) labels.push('as-is-received');

  return `[${labels.join(', ')}]`;
};

const buildSatouStateGuide = ({ resignation, desire, fear, freeze, shame, selfErasure, unfinished }) => {
  const labels = [];

  if (resignation > 0.3) labels.push('avoidance-detected');
  if (desire > 0.2 && (fear > 0.15 || freeze > 0.15)) labels.push('cover-up-detected');
  if (shame > 0.25 || selfErasure > 0.25) labels.push('evasion-vs-real');
  if (freeze > 0.2 && (desire > 0.15 || unfinished > 0.15)) labels.push('freeze-cost-visible');
  if (unfinished > 0.2) labels.push('completion-avoidance');

  if (labels.length === 0) labels.push('contradiction-visible');

  return `[${labels.join(', ')}]`;
};
