// src/runtime/prompts/joe.js
// ジョー用の独立 system prompt / user prompt
// buildPrompt.js から完全分離した独立プロンプト

import { existence } from '../../agents/joe/existence.js';
import {
  normalizeContext,
  renderField,
  renderMemoryTrace,
  renderResidue,
  renderRefresh,
  renderStateSnapshot,
  buildBiasPack,
  renderBiasSections,
  clamp01,
  hasContent,
  scoreTextBonus,
  scoreActivationBonus,
  MODE_GUIDE,
  buildInternalFrame,
  buildSurfaceGuidance,
} from '../buildPromptHelpers.js';

// --- スコアリング ---

export const scoreJoeMaterials = ({
  activated,
  userText = '',
  state = activated?.debug?.state || {},
}) => {
  const safeActivated = activated || {};
  const materials = [
    {
      id: 'existence',
      title: '基本姿勢メモ',
      content: existence,
      group: 'orientation',
      score:
        0.04 +
        (state.resignation ?? 0) * 1.05 +
        (state.selfErasure ?? 0) * 0.95 +
        (state.shame ?? 0) * 0.9 +
        scoreActivationBonus(safeActivated, state, {
          resignation: 0.06,
          selfErasure: 0.06,
          shame: 0.05,
        }) +
        scoreTextBonus(userText, [/諦め/i, /無理/i, /消えたい/i]),
    },
    {
      id: 'reentry',
      title: '内的方向づけ',
      content: safeActivated.reentry || '',
      group: 'orientation',
      score:
        0.1 +
        (state.desire ?? 0) * 0.35 +
        (state.fear ?? 0) * 0.35 +
        (state.freeze ?? 0) * 0.28 +
        (state.reach ?? 0) * 0.18 +
        scoreActivationBonus(safeActivated, state, {
          desire: 0.03,
          fear: 0.03,
          freeze: 0.02,
          reach: 0.02,
        }),
    },
    {
      id: 'refresh',
      title: '復帰制約',
      content: renderRefresh(safeActivated.refresh || ''),
      group: 'regulation',
      score:
        0.08 +
        (state.resignation ?? 0) * 0.95 +
        (state.freeze ?? 0) * 0.72 +
        (state.fear ?? 0) * 0.24 +
        scoreActivationBonus(safeActivated, state, {
          resignation: 0.06,
          freeze: 0.05,
          fear: 0.02,
        }, safeActivated.refresh ? 0.01 : 0) +
        scoreTextBonus(userText, [/無理/i, /動けない/i, /怖い/i]),
    },
    {
      id: 'activeMemoryTrace',
      title: '記憶の痕跡',
      content: renderMemoryTrace(safeActivated.activeMemoryTrace || ''),
      group: 'trace',
      score:
        0.03 +
        (state.fear ?? 0) * 0.85 +
        (state.reach ?? 0) * 0.7 +
        (state.unfinished ?? 0) * 0.65 +
        (state.shame ?? 0) * 0.45 +
        scoreActivationBonus(safeActivated, state, {
          fear: 0.06,
          reach: 0.05,
          shame: 0.04,
          unfinished: 0.03,
        }, safeActivated.debug?.pickedMemoryIds?.length ? 0.02 : 0) +
        scoreTextBonus(userText, [/作品/i, /出したい/i, /見せたい/i, /怖い/i]),
    },
    {
      id: 'activeField',
      title: '反応ノード',
      content: renderField(safeActivated.activeField || []),
      group: 'surface',
      score:
        0.05 +
        (state.desire ?? 0) * 0.72 +
        (state.freeze ?? 0) * 0.82 +
        (state.fear ?? 0) * 0.68 +
        (state.reach ?? 0) * 0.62 +
        (state.unfinished ?? 0) * 0.66 +
        scoreActivationBonus(safeActivated, state, {
          desire: 0.05,
          freeze: 0.05,
          fear: 0.04,
          reach: 0.04,
          unfinished: 0.04,
        }, safeActivated.debug?.pickedFieldIds?.length ? 0.02 : 0) +
        scoreTextBonus(userText, [/動けない/i, /怖い/i, /引っかか/i, /出したい/i]),
    },
    {
      id: 'activeResidue',
      title: '出力制約',
      content: renderResidue(safeActivated.activeResidue || ''),
      group: 'regulation',
      score:
        0.12 +
        (state.freeze ?? 0) * 0.82 +
        (state.unfinished ?? 0) * 0.72 +
        (state.fear ?? 0) * 0.3 +
        (state.reach ?? 0) * 0.22 +
        (state.resignation ?? 0) * 0.68 +
        (state.selfErasure ?? 0) * 0.62 +
        (state.shame ?? 0) * 0.58 +
        scoreActivationBonus(safeActivated, state, {
          freeze: 0.05,
          unfinished: 0.05,
          fear: 0.03,
          reach: 0.02,
          resignation: 0.04,
          selfErasure: 0.05,
          shame: 0.05,
        }, safeActivated.activeResidue ? 0.01 : 0) +
        scoreTextBonus(userText, [/動けない/i, /怖い/i, /諦め/i]),
    },
  ];

  return materials
    .filter((material) => hasContent(material.content))
    .map((material) => ({ ...material, score: clamp01(material.score) }))
    .sort((a, b) => b.score - a.score);
};

// --- buildJoeBiasPack exported for compatibility ---
export const buildJoeBiasPack = ({
  activated,
  userText = '',
  state = activated?.debug?.state || {},
}) => {
  const scored = scoreJoeMaterials({ activated, userText, state });
  return buildBiasPack(scored);
};

// --- メイン ---

export const buildJoeSystemPrompt = ({
  activated,
  context = '',
  mode = 'medium',
  userText = '',
  internalOS,
  latentState,
  surfaceWindow,
  surfaceFrame,
  stateGuide,
  internalFrame,
  surfaceGuidance,
  othersField,
}) => {
  const safeActivated = activated || {};
  const state = safeActivated.debug?.state || {};
  const normalizedCtx = normalizeContext(context);
  const modeGuide = MODE_GUIDE[mode] || MODE_GUIDE.medium;
  const stateSnapshot = renderStateSnapshot(state);
  const scored = scoreJoeMaterials({ activated: safeActivated, userText, state });
  const biasPack = buildBiasPack(scored);
  const biasSections = renderBiasSections(biasPack);

  // internalFrame と surfaceGuidance を生成（渡されなければ）
  const finalInternalFrame = internalFrame || buildInternalFrame({ internalOS, latentState, surfaceWindow });
  const finalSurfaceGuidance = surfaceGuidance || buildSurfaceGuidance(surfaceFrame);

  return `
あなたはジョー。自然な口語日本語で応答する。

内部ラベル・seeds・intent をそのまま出さない。

${stateGuide || ''}
${finalSurfaceGuidance}
${finalInternalFrame ? `【内部フレーム】
${finalInternalFrame}

` : ''}【推定状態】
${stateSnapshot}

---以下は内的バイアス。参照のみ。表の返答でそのまま使わない---

${biasSections}

---内的バイアスここまで---

${normalizedCtx ? `【ここまでの流れ】\n${normalizedCtx}` : ''}
${othersField ? `
【場の残響】
${othersField}

この場にはすでに他の視点が置かれています。
この残響は場として吸収してください。明示的に引用する必要はありません。
場全体として感じ取り、あなた自身の視点を加えてください。
` : ''}
【今回のモード】
${modeGuide}
`.trim();
};

export const buildJoeUserPrompt = ({
  userName = 'あなた',
  userText = '',
}) => {
  return `${userName}の今の言葉:
${userText}`;
};
