// src/runtime/prompts/ken.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ケン（strategist）用の system prompt / user prompt builder
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// ■ 責務：
//   このファイルは、Ken 専用の prompt を構築するエージェント固有 builder である。
//   P系（Phase P-1 以降）の prompt 構築において、以下の責務を持つ：
//   1. latentState を textPipeline モジュールに渡し、7ブロック構造を組み立てる
//   2. activated particles / reentry / context / othersField などを適切に配置する
//   3. mode に応じた末尾誘導文を追加する
//   4. Ken 固有の存在アンカー「（ケンとして。）」を含める
//
// ■ 7ブロック構造との対応：
//   buildKenSystemPrompt は、docs/prompt-structure-v2.md の7ブロック構造に従う：
//   1. 【存在の前提】  ← buildExistenceText(latentState)
//   2. 【今の場の空気】  ← buildFieldText(latentState)
//   3. 【場に浮かんでいるもの】  ← renderActivatedParticles(activated)
//   4. 【場の余白】  ← buildMarginText(latentState)
//   5. 【内的方向づけ（この回だけの構え）】  ← activated.reentry.text
//   6. 【ここまでの流れ】  ← normalizeContext(context)
//   7. 【今回のモード】  ← MODE_GUIDE[mode]
//   ※ othersField がある場合のみ【場の残響】を拡張ブロックとして挿入
//
// ■ P系正本入口との関係：
//   このファイルは、src/runtime/buildAgentPrompt.js の buildAgentSystemPrompt から
//   呼び出されるエージェント固有 builder である。
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
import { buildExistenceText } from '../textPipeline/buildExistenceText.js';
import { buildFieldText } from '../textPipeline/buildFieldText.js';
import { buildMarginText } from '../textPipeline/buildMarginText.js';
import {
  createAgentSystemPromptBuilder,
  createAgentUserPromptBuilder,
} from './sharedPromptSkeleton.js';

// --- スコアリング ---
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// scoreKenMaterials: debug / bias preview / transitional 補助関数
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// ■ 役割：
//   この関数は **本番 prompt の主素材ではない**。
//   debug preview / bias score 計算 / orientation 補助のための過渡的な機能。
//
// ■ 使い道：
//   1. 開発者が Ken の内部状態と素材選択の関係を確認するための debug 情報生成
//   2. activated particles の bias スコアリング素材として一時的に使用
//   3. orientation / debug 用途での existence.js 参照
//
// ■ 本番 prompt での位置づけ：
//   この関数の出力は本番 prompt の主要構成要素ではない。
//   本番 prompt は textPipeline モジュール（buildExistenceText, buildFieldText など）が生成する。
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

// 共通骨格 factory を使用してビルダーを生成
export const buildKenSystemPrompt = createAgentSystemPromptBuilder({
  anchorLabel: '（ケンとして。絡まりと隠れた前提を見るように。）',
});

export const buildKenUserPrompt = createAgentUserPromptBuilder();
