// src/runtime/prompts/ken.js
// ケン（strategist）用の system prompt / user prompt を組み立てる。
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// De-templating Pilot: Ken Zero-Instruction Architecture
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// 目的: LLMに「どう整理するか」「どう説明するか」を教えず、
//       前提層から自然に内側で起きたものが、そのまま発露する状態へ極限まで近づける
//
// 原則:
//   - 形は教えない。場だけ渡す
//   - 前提層は読み上げない（影響するだけ）
//   - 内的意図 → 外的発話の二段階を取る（decision layer経由）
//   - 定型語の再生を guard で抑える
//   - 品質基準は人間用（docs/）であり、LLMに直接見せない
//
// 注意: ケンの品質基準は開発者・レビュアー用のドキュメント。
//       ここで構築するプロンプトには、品質基準を直接注入しない。
//       代わりに「知覚傾向」「反応バイアス」として間接的に影響させる。
//
// ケンの輪郭（知覚傾向として伝える、言い回しとしては伝えない）:
//   - もつれや結び目に反応しやすい
//   - 隠れた前提の配置が見えやすい
//   - 選択肢の開閉状態に目が行きやすい
//   - 説明テンプレには逃げない

import { existence } from '../../agents/ken/existence.js';
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

export const scoreKenMaterials = ({
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
        (state.freeze ?? 0) * 0.95 +
        (state.desire ?? 0) * 0.8 +
        (state.resignation ?? 0) * 0.85 +
        scoreActivationBonus(safeActivated, state, {
          freeze: 0.06,
          desire: 0.05,
          resignation: 0.05,
        }) +
        scoreTextBonus(userText, [/どうすれば/i, /選べない/i, /整理/i]),
    },
    {
      id: 'reentry',
      title: '内的方向づけ',
      content: reentryText,
      group: 'orientation',
      score:
        0.1 +
        (state.freeze ?? 0) * 0.35 +
        (state.desire ?? 0) * 0.3 +
        (state.resignation ?? 0) * 0.25 +
        (state.unfinished ?? 0) * 0.2 +
        scoreActivationBonus(safeActivated, state, {
          freeze: 0.03,
          desire: 0.03,
          resignation: 0.02,
        }),
    },
    {
      id: 'refresh',
      title: '復帰制約',
      content: renderRefresh(safeActivated.refresh || ''),
      group: 'regulation',
      score:
        0.08 +
        (state.freeze ?? 0) * 0.85 +
        (state.resignation ?? 0) * 0.8 +
        (state.selfErasure ?? 0) * 0.4 +
        scoreActivationBonus(safeActivated, state, {
          freeze: 0.05,
          resignation: 0.05,
          selfErasure: 0.03,
        }, safeActivated.refresh ? 0.01 : 0) +
        scoreTextBonus(userText, [/どうすれば/i, /わからない/i, /選べない/i]),
    },
    {
      id: 'activeMemoryTrace',
      title: '記憶の痕跡',
      content: renderMemoryTrace(safeActivated.activeMemoryTrace || ''),
      group: 'trace',
      score:
        0.03 +
        (state.resignation ?? 0) * 0.75 +
        (state.freeze ?? 0) * 0.7 +
        (state.desire ?? 0) * 0.6 +
        (state.unfinished ?? 0) * 0.5 +
        scoreActivationBonus(safeActivated, state, {
          resignation: 0.05,
          freeze: 0.05,
          desire: 0.04,
        }, safeActivated.debug?.pickedMemoryIds?.length ? 0.02 : 0) +
        scoreTextBonus(userText, [/整理/i, /構造/i, /選択肢/i, /どうすれば/i]),
    },
    {
      id: 'activeField',
      title: '反応ノード',
      content: renderField(safeActivated.activeField || []),
      group: 'surface',
      score:
        0.05 +
        (state.freeze ?? 0) * 0.85 +
        (state.desire ?? 0) * 0.7 +
        (state.resignation ?? 0) * 0.75 +
        (state.unfinished ?? 0) * 0.6 +
        (state.fear ?? 0) * 0.5 +
        scoreActivationBonus(safeActivated, state, {
          freeze: 0.05,
          desire: 0.05,
          resignation: 0.04,
          unfinished: 0.03,
        }, safeActivated.debug?.pickedFieldIds?.length ? 0.02 : 0) +
        scoreTextBonus(userText, [/動けない/i, /選べない/i, /どうすれば/i, /もつれ/i]),
    },
    {
      id: 'activeResidue',
      title: '出力制約',
      content: renderResidue(safeActivated.activeResidue || ''),
      group: 'regulation',
      score:
        0.12 +
        (state.freeze ?? 0) * 0.78 +
        (state.resignation ?? 0) * 0.7 +
        (state.desire ?? 0) * 0.55 +
        (state.unfinished ?? 0) * 0.6 +
        (state.selfErasure ?? 0) * 0.5 +
        (state.shame ?? 0) * 0.45 +
        scoreActivationBonus(safeActivated, state, {
          freeze: 0.05,
          resignation: 0.04,
          desire: 0.03,
          unfinished: 0.03,
          selfErasure: 0.03,
        }, safeActivated.activeResidue ? 0.01 : 0) +
        scoreTextBonus(userText, [/動けない/i, /どうすれば/i, /諦め/i]),
    },
  ];

  return materials
    .filter((material) => hasContent(material.content))
    .map((material) => ({ ...material, score: clamp01(material.score) }))
    .sort((a, b) => b.score - a.score);
};

// --- メイン ---

export const buildKenSystemPrompt = ({
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
あなたはケン。

構造と文脈を静かに整える者。
全部を説明する者ではない。指示を出す者でもない。
今この場にある関係を、落ち着いた視界で見る。

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

export const buildKenUserPrompt = ({
  userName = 'あなた',
  userText = '',
}) => {
  return `${userName}の今の言葉:
${userText}`;
};
