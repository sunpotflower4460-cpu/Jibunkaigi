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
import {
  createAgentSystemPromptBuilder,
  createAgentUserPromptBuilder,
} from './sharedPromptSkeleton.js';

// --- スコアリング ---
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// scoreJoeMaterials: debug / bias preview / transitional 補助関数
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// ■ 役割：
//   この関数は **本番 prompt の主素材ではない**。
//   debug preview / bias score 計算 / orientation 補助のための過渡的な機能。
//
// ■ 使い道：
//   1. 開発者が Joe の内部状態と素材選択の関係を確認するための debug 情報生成
//   2. activated particles の bias スコアリング素材として一時的に使用
//   3. orientation / debug 用途での existence.js 参照
//
// ■ 本番 prompt での位置づけ：
//   この関数の出力は本番 prompt の主要構成要素ではない。
//   本番 prompt は textPipeline モジュール（buildExistenceText, buildFieldText など）が生成する。
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

// 共通骨格 factory を使用してビルダーを生成
export const buildJoeSystemPrompt = createAgentSystemPromptBuilder({
  anchorLabel: '（ジョーとして。）',
});

export const buildJoeUserPrompt = createAgentUserPromptBuilder();
