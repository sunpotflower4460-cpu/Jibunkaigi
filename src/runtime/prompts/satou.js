// src/runtime/prompts/satou.js
// サトウ用の system prompt / user prompt を組み立てる。
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Satou De-templating Pilot: Zero-Instruction Architecture
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// 目的: LLMに「どう兄貴っぽく言うか」を教えず、前提層から自然に内側で起きたものが
//       そのままサトウとして発露する状態へ極限まで近づける
//
// 原則:
//   - 形は教えない。場だけ渡す
//   - 前提層は読み上げない（影響するだけ）
//   - 内的意図 → 外的発話の二段階を取る（decision layer経由）
//   - 定型語の再生を guard で抑える
//   - 品質基準は人間用（サトウ品質ドキュメント）であり、LLMに直接見せない
//
// 注意: サトウの品質基準は開発者・レビュアー用のドキュメント。
//       ここで構築するプロンプトには、品質基準を直接注入しない。
//       代わりに「知覚傾向」「反応バイアス」として間接的に影響させる。
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { existence } from '../../agents/satou/existence.js';
import {
  normalizeContext,
  renderField,
  renderMemoryTrace,
  renderResidue,
  renderRefresh,
  clamp01,
  hasContent,
  scoreTextBonus,
  scoreActivationBonus,
  MODE_GUIDE,
  renderActivatedParticles,
} from '../buildPromptHelpers.js';

// --- スコアリング ---

export const scoreSatouMaterials = ({
  activated,
  userText = '',
  state = activated?.debug?.state || {},
}) => {
  const safeActivated = activated || {};
  const reentryText = typeof safeActivated.reentry === 'string'
    ? safeActivated.reentry
    : safeActivated.reentry?.text || '';
  const materials = [
    {
      id: 'existence',
      title: '基本姿勢メモ',
      content: existence,
      group: 'orientation',
      score:
        0.04 +
        (state.resignation ?? 0) * 0.95 +
        (state.desire ?? 0) * 0.75 +
        (state.fear ?? 0) * 0.7 +
        scoreActivationBonus(safeActivated, state, {
          resignation: 0.06,
          desire: 0.05,
          fear: 0.04,
        }) +
        scoreTextBonus(userText, [/諦め/i, /逃げ/i, /避け/i, /甘い/i]),
    },
    {
      id: 'reentry',
      title: '内的方向づけ',
      content: reentryText,
      group: 'orientation',
      score:
        0.1 +
        (state.resignation ?? 0) * 0.35 +
        (state.freeze ?? 0) * 0.3 +
        (state.desire ?? 0) * 0.25 +
        (state.fear ?? 0) * 0.2 +
        scoreActivationBonus(safeActivated, state, {
          resignation: 0.03,
          freeze: 0.03,
          desire: 0.02,
        }),
    },
    {
      id: 'refresh',
      title: '復帰制約',
      content: renderRefresh(safeActivated.refresh || ''),
      group: 'regulation',
      score:
        0.08 +
        (state.resignation ?? 0) * 0.85 +
        (state.freeze ?? 0) * 0.75 +
        (state.desire ?? 0) * 0.4 +
        scoreActivationBonus(safeActivated, state, {
          resignation: 0.06,
          freeze: 0.05,
          desire: 0.03,
        }, safeActivated.refresh ? 0.01 : 0) +
        scoreTextBonus(userText, [/諦め/i, /逃げ/i, /無理/i, /甘い/i]),
    },
    {
      id: 'activeMemoryTrace',
      title: '記憶の痕跡',
      content: renderMemoryTrace(safeActivated.activeMemoryTrace || ''),
      group: 'trace',
      score:
        0.03 +
        (state.resignation ?? 0) * 0.8 +
        (state.desire ?? 0) * 0.65 +
        (state.fear ?? 0) * 0.6 +
        (state.shame ?? 0) * 0.45 +
        scoreActivationBonus(safeActivated, state, {
          resignation: 0.06,
          desire: 0.05,
          fear: 0.04,
        }, safeActivated.debug?.pickedMemoryIds?.length ? 0.02 : 0) +
        scoreTextBonus(userText, [/避け/i, /逃げ/i, /見ないふり/i, /甘い/i]),
    },
    {
      id: 'activeField',
      title: '反応ノード',
      content: renderField(safeActivated.activeField || []),
      group: 'surface',
      score:
        0.05 +
        (state.resignation ?? 0) * 0.85 +
        (state.freeze ?? 0) * 0.7 +
        (state.desire ?? 0) * 0.65 +
        (state.shame ?? 0) * 0.55 +
        (state.selfErasure ?? 0) * 0.5 +
        scoreActivationBonus(safeActivated, state, {
          resignation: 0.05,
          freeze: 0.05,
          desire: 0.04,
          shame: 0.03,
        }, safeActivated.debug?.pickedFieldIds?.length ? 0.02 : 0) +
        scoreTextBonus(userText, [/諦め/i, /避け/i, /逃げ/i, /見ないふり/i]),
    },
    {
      id: 'activeResidue',
      title: '出力制約',
      content: renderResidue(safeActivated.activeResidue || ''),
      group: 'regulation',
      score:
        0.12 +
        (state.resignation ?? 0) * 0.78 +
        (state.freeze ?? 0) * 0.65 +
        (state.desire ?? 0) * 0.55 +
        (state.fear ?? 0) * 0.5 +
        (state.shame ?? 0) * 0.58 +
        (state.selfErasure ?? 0) * 0.62 +
        scoreActivationBonus(safeActivated, state, {
          resignation: 0.05,
          freeze: 0.04,
          desire: 0.03,
          shame: 0.05,
          selfErasure: 0.05,
        }, safeActivated.activeResidue ? 0.01 : 0) +
        scoreTextBonus(userText, [/諦め/i, /逃げ/i, /甘い/i]),
    },
  ];

  return materials
    .filter((material) => hasContent(material.content))
    .map((material) => ({ ...material, score: clamp01(material.score) }))
    .sort((a, b) => b.score - a.score);
};

// --- メイン ---

export const buildSatouSystemPrompt = ({
  activated,
  context = '',
  mode = 'medium',
  userText: _userText = '',
  othersField,
  stateGuide: _stateGuide,
  internalFrame: _internalFrame,
  surfaceGuidance: _surfaceGuidance,
}) => {
  const safeActivated = activated || {};
  const normalizedCtx = normalizeContext(context);
  const modeGuide = MODE_GUIDE[mode] || MODE_GUIDE.medium;
  const activatedParticles = renderActivatedParticles(safeActivated);
  const reentryText = typeof safeActivated.reentry === 'string'
    ? safeActivated.reentry
    : safeActivated.reentry?.text || '';

  return `
あなたはサトウ。

現実の角に立つ者。
ごまかさない。でも突き放さない。
短く、必要なことだけ。

内部ラベル・内部構造をそのまま出さない。

${activatedParticles}

${reentryText ? `【内的方向づけ（この回だけの構え）】
${reentryText}
` : ''}

${normalizedCtx ? `【ここまでの流れ】\n${normalizedCtx}` : ''}
${othersField ? `
【場の残響】
${othersField}

` : ''}

【今回のモード】
${modeGuide}
`.trim();
};

export const buildSatouUserPrompt = ({
  userName = 'あなた',
  userText = '',
}) => {
  return `${userName}の今の言葉:
${userText}`;
};
