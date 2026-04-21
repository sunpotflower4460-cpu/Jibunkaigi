// src/runtime/prompts/joe.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ジョー（creative）用の独立 system prompt / user prompt builder
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// ■ 責務：
//   このファイルは、Joe 専用の prompt を構築するエージェント固有 builder である。
//   P系（Phase P-1 以降）の prompt 構築において、以下の責務を持つ：
//   1. latentState を textPipeline モジュールに渡し、7ブロック構造を組み立てる
//   2. activated particles / reentry / context / othersField などを適切に配置する
//   3. mode に応じた末尾誘導文を追加する
//   4. Joe 固有の存在アンカー「（ジョーとして。）」を含める
//
// ■ 7ブロック構造との対応：
//   buildJoeSystemPrompt は、docs/prompt-structure-v2.md の7ブロック構造に従う：
//   1. 【存在の前提】  ← buildExistenceText(latentState)
//   2. 【今の場の空気】  ← buildFieldText(latentState)
//   3. 【場に浮かんでいるもの】  ← renderActivatedParticles(activated)
//   4. 【場の余白】  ← buildMarginText(latentState)
//   5. 【内的方向づけ（この回だけの構え）】  ← activated.reentry.text
//   6. 【ここまでの流れ】  ← normalizeContext(context)
//   7. 【今回のモード】  ← MODE_GUIDE[mode]
//   ※ othersField がある場合のみ【場の残響】を拡張ブロックとして挿入
//
// ■ 入力パラメータ：
//   - activated: activate phase の出力（粒子・reentry・debug など）
//   - context: 過去のやりとり履歴
//   - mode: 応答の長さ感（'short' / 'medium' / 'long'）
//   - userText: ユーザーの今回の入力テキスト
//   - latentState: runInternalOS の13層計算の出力（P-1以降の正本入力）
//   - othersField: 他エージェントの残響（オプション）
//
// ■ 後方互換パラメータ（非推奨）：
//   - internalOS / surfaceWindow / surfaceFrame / stateGuide / internalFrame / surfaceGuidance
//     → これらは P-1 以前の旧構造。新規コードでは latentState を使用。
//
// ■ P系正本入口との関係：
//   このファイルは、src/runtime/buildAgentPrompt.js の buildAgentSystemPrompt から
//   呼び出されるエージェント固有 builder である。
//
// buildPrompt.js から完全分離した独立プロンプト

import { existence } from '../../agents/joe/existence.js';
import {
  normalizeContext,
  renderField,
  renderMemoryTrace,
  renderResidue,
  renderRefresh,
  buildBiasPack,
  clamp01,
  hasContent,
  scoreTextBonus,
  scoreActivationBonus,
  MODE_GUIDE,
  renderActivatedParticles,
} from '../buildPromptHelpers.js';
import { buildExistenceText } from '../textPipeline/buildExistenceText.js';
import { buildFieldText } from '../textPipeline/buildFieldText.js';
import { buildMarginText } from '../textPipeline/buildMarginText.js';

// --- スコアリング ---

export const scoreJoeMaterials = ({
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
      content: reentryText,
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
  userText: _userText = '',
  othersField,
  // latentState: runInternalOS の13層計算の出力
  latentState,
  // backward compatibility only — LLM には渡さない
  internalOS: _internalOS,
  surfaceWindow: _surfaceWindow,
  surfaceFrame: _surfaceFrame,
  stateGuide: _stateGuide,
  internalFrame: _internalFrame,
  surfaceGuidance: _surfaceGuidance,
}) => {
  const safeActivated = activated || {};
  const effectiveLatentState = latentState ?? _internalOS?.latentState ?? null;
  const normalizedCtx = normalizeContext(context);
  const modeGuide = MODE_GUIDE[mode] || MODE_GUIDE.medium;
  const activatedParticles = renderActivatedParticles(safeActivated);
  const reentryText = typeof safeActivated.reentry === 'string'
    ? safeActivated.reentry
    : safeActivated.reentry?.text || '';

  // 新構造: textPipeline からの描写
  const existenceText = effectiveLatentState ? buildExistenceText(effectiveLatentState) : '';
  const fieldText = effectiveLatentState ? buildFieldText(effectiveLatentState) : '';
  const marginText = effectiveLatentState ? buildMarginText(effectiveLatentState) : '';

  // 新構造の7ブロック
  const sections = [];

  // [存在の前提]
  if (existenceText) {
    sections.push(`【存在の前提】\n（ジョーとして。）\n${existenceText}`);
  } else {
    // 移行期アンカー: 最初の1行だけ残す（第10章1-dの推奨）
    sections.push('（ジョーとして。）');
  }

  // [今の場の空気]
  if (fieldText) {
    sections.push(`【今の場の空気】\n${fieldText}`);
  }

  // [場に浮かんでいるもの]
  if (activatedParticles) {
    sections.push(activatedParticles);
  }

  // [場の余白]
  if (marginText) {
    sections.push(`【場の余白】\n${marginText}`);
  }

  // [内的方向づけ（この回だけの構え）]
  if (reentryText) {
    sections.push(`【内的方向づけ（この回だけの構え）】\n${reentryText}`);
  }

  // [ここまでの流れ]
  if (normalizedCtx) {
    sections.push(`【ここまでの流れ】\n${normalizedCtx}`);
  }

  // [場の残響]
  if (othersField) {
    sections.push(`【場の残響】\n${othersField}`);
  }

  // [相手の言葉] は user prompt に含まれるため、system prompt には含めない

  // 末尾の誘導文
  sections.push(`【今回のモード】\n${modeGuide}\n\n何を言うかは、あなたが決めてください。`);

  return sections.filter(Boolean).join('\n\n').trim();
};

export const buildJoeUserPrompt = ({
  userName = 'あなた',
  userText = '',
}) => {
  return `${userName}の今の言葉:
${userText}`;
};
