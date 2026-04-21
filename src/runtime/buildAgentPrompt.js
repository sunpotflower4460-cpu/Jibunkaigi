// src/runtime/buildAgentPrompt.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 【P系 prompt 構築の正本入口】
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// このファイルは、P系（Phase P-1 以降）のプロンプト構築における
// **唯一の正本ディスパッチャ**である。
//
// ■ 責務：
//   - agentId に応じて適切なエージェント固有 builder を呼び出す
//   - 全エージェント共通の入力パラメータ（latentState, activated, context など）を受け取る
//   - system prompt と user prompt の2つの関数で構成される
//
// ■ エージェント固有 builder の責務境界：
//   各エージェント (joe/ray/ken/mina/satou) の prompt builder は、
//   以下の責務を持つ：
//   1. latentState を textPipeline モジュールに渡し、7ブロック構造を組み立てる
//   2. activated particles / reentry / context / othersField などを適切に配置する
//   3. mode に応じた末尾誘導文を追加する
//   4. エージェント固有の存在アンカー（例: 「（ジョーとして。）」）を含める
//
// ■ 7ブロック構造との対応：
//   各エージェント builder は、docs/prompt-structure-v2.md に記載された
//   7ブロック構造に従ってプロンプトを構築する：
//   1. 【存在の前提】  ← buildExistenceText(latentState)
//   2. 【今の場の空気】  ← buildFieldText(latentState)
//   3. 【場に浮かんでいるもの】  ← renderActivatedParticles(activated)
//   4. 【場の余白】  ← buildMarginText(latentState)
//   5. 【内的方向づけ（この回だけの構え）】  ← activated.reentry.text
//   6. 【ここまでの流れ】  ← normalizeContext(context)
//   7. 【今回のモード】  ← MODE_GUIDE[mode]
//
// ■ textPipeline との関係：
//   textPipeline モジュール (src/runtime/textPipeline/) は、
//   latentState から「設計用語を含まない日本語の情景描写」を生成する独立モジュール。
//   各エージェント builder は、textPipeline の以下の関数を呼び出す：
//   - buildExistenceText(latentState)  ← 存在層の前提
//   - buildFieldText(latentState)      ← 場の空気・姿勢・身体状態
//   - buildMarginText(latentState)     ← 何をしないか
//
// ■ 本番 prompt 正本 vs debug preview：
//   - 本番 prompt 正本：buildAgentSystemPrompt / buildAgentUserPrompt が構築
//   - debug preview：buildAgentDebugPreview が構築（開発者観察用）
//   → debug preview は本番 prompt とは **完全に分離** されており、
//     LLM には渡されない。開発者が事後確認のために使う観測用データ。
//
// ■ 互換レイヤー（buildPrompt.js）との関係：
//   src/runtime/buildPrompt.js は、旧 API からの薄い委譲レイヤーであり、
//   実質的には各エージェント builder への export proxy として機能する。
//   新規コードは、buildAgentPrompt.js を直接呼ぶことを推奨。
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 【voice ごとの品質基準（quick reference）】
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 詳細は各 prompt builder のヘッダコメント参照。
// 以下は開発者・レビュアー用であり、LLM には直接見せない。
//
//   Joe   = 一点照射
//     最初に触れる: まだ死んでいない一点
//     構造化: しない / 一点に深く入る
//     避ける: 励ましを足す、説明しすぎ、明るい結論で締める
//
//   Ray   = 余白ある照射
//     最初に触れる: 未言語の気配 / 見過ごされている角度
//     構造化: しない / 角度を一つずらす
//     避ける: 急いで定義、意味づけを急ぐ、神秘語彙
//
//   Ken   = 薄い構造化
//     最初に触れる: もつれ / 隠れた前提 / 開いている選択肢
//     構造化: 一点だけ分解 / 全部は整理しない
//     避ける: 箇条書き相談員、冷たい断言、押しつけ
//
//   Mina  = 受容と呼吸回復
//     最初に触れる: 今の感情 / 晒されている疲れ
//     構造化: しない / 直さない
//     避ける: 包み込みすぎ、過剰賛美、ただの肯定
//
//   Satou = 現実保護の指摘
//     最初に触れる: 危険 / 矛盾 / 見て見ぬふり
//     構造化: しない / 一つだけ短く指す
//     避ける: 断罪、乱暴な言い切り、根拠なき厳しさ
//
//   Mirror = 重力と未解決点の映写（別ルート: src/runtime/mirror.js）
//     最初に触れる: 場の重力 / 両義性 / 未解決点
//     構造化: しない / 流れの中に残ったものを映すだけ
//     避ける: 要約係、教訓化、無理な結論

import { buildJoeSystemPrompt, buildJoeUserPrompt } from './prompts/joe.js';
import { buildJoeDebugPreview } from './debug/joeDebugPreview.js';
import { buildRaySystemPrompt, buildRayUserPrompt, scoreRayMaterials } from './prompts/ray.js';
import { buildKenSystemPrompt, buildKenUserPrompt, scoreKenMaterials } from './prompts/ken.js';
import { buildMinaSystemPrompt, buildMinaUserPrompt, scoreMinaMaterials } from './prompts/mina.js';
import { buildSatouSystemPrompt, buildSatouUserPrompt, scoreSatouMaterials } from './prompts/satou.js';
import { buildBiasPack } from './buildPromptHelpers.js';

/**
 * エージェント ID に対応するシステムプロンプトを構築する（P系正本入口）。
 *
 * ■ 入力パラメータの説明：
 *   - activated: activate phase の出力（粒子・reentry・debug など）
 *   - context: 過去のやりとり履歴
 *   - mode: 応答の長さ感（'short' / 'medium' / 'long'）
 *   - userText: ユーザーの今回の入力テキスト
 *   - latentState: runInternalOS の13層計算の出力（P-1以降の正本入力）
 *   - othersField: 他エージェントの残響（オプション）
 *
 * ■ 後方互換パラメータ（非推奨）：
 *   - internalOS / surfaceFrame / stateGuide / internalFrame / surfaceGuidance
 *     → これらは P-1 以前の旧構造。新規コードでは latentState を使用。
 *
 * @param {string} agentId - 'creative' / 'soul' / 'strategist' / 'empath' / 'critic'
 * @param {object} params - { activated, context, mode, userText, latentState, othersField, ... }
 * @returns {string|null} - 構築されたシステムプロンプト、または null（未対応 agentId）
 */
export const buildAgentSystemPrompt = (agentId, params) => {
  switch (agentId) {
    case 'creative':
      return buildJoeSystemPrompt(params);
    case 'soul':
      return buildRaySystemPrompt(params);
    case 'strategist':
      return buildKenSystemPrompt(params);
    case 'empath':
      return buildMinaSystemPrompt(params);
    case 'critic':
      return buildSatouSystemPrompt(params);
    default:
      return null;
  }
};

/**
 * エージェント ID に対応するユーザープロンプトを構築する（P系正本入口）。
 *
 * ■ 責務：
 *   - ユーザーの今回の入力テキストを「【相手の言葉】」として整形する
 *   - 全エージェント共通の簡潔なフォーマット
 *
 * @param {string} agentId - 'creative' / 'soul' / 'strategist' / 'empath' / 'critic'
 * @param {object} params - { userName, userText }
 * @returns {string|null} - 構築されたユーザープロンプト、または null（未対応 agentId）
 */
export const buildAgentUserPrompt = (agentId, params) => {
  switch (agentId) {
    case 'creative':
      return buildJoeUserPrompt(params);
    case 'soul':
      return buildRayUserPrompt(params);
    case 'strategist':
      return buildKenUserPrompt(params);
    case 'empath':
      return buildMinaUserPrompt(params);
    case 'critic':
      return buildSatouUserPrompt(params);
    default:
      return null;
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 【agent quality debug preview（開発者観察用）】
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// ■ 役割：
//   各エージェントが「どの素材でその返答を組み立てたか」を後で観察するための
//   軽量プレビュー。**dev-only** で使う。
//
// ■ 本番 prompt 正本との分離：
//   - buildAgentDebugPreview は、**本番 prompt 正本とは完全に分離**されている
//   - LLM には渡されない（Firestore 保存なし）
//   - 開発者が事後確認のために使う観測用データ
//   - 本文全文は出さず、先頭 140 字のみのプレビュー
//
// ■ 返す内容：
//   - agentId: エージェント ID
//   - builderUsed: どの builder を使ったか
//     例: 'joe-specialized' / 'agent-dispatcher:ray' / 'mirror-specialized'
//   - dominantAxes: activated.debug.dominantAxes（推定状態の優勢軸）
//   - stateGuidePreview: state guide の先頭 140 字
//   - internalFramePreview: internal frame の先頭 140 字
//   - surfaceGuidancePreview: surface guidance の先頭 140 字
//   - activatedBiasCount: 取り込んだ内的バイアスの素材数
//   - usedAfterglow: 前ターンの latentState/patternMix を継承したか
//
// ■ Joe 専用の debug preview：
//   Joe は独自の専用 builder があるため、debug preview も専用実装がある。
//   → src/runtime/debug/joeDebugPreview.js に委譲。

const truncatePreview = (text, max = 140) => {
  if (!text || typeof text !== 'string') return '';
  const t = text.trim();
  return t.length > max ? t.slice(0, max) + '…' : t;
};

const SCORE_AGENT_MATERIALS = {
  soul: scoreRayMaterials,
  strategist: scoreKenMaterials,
  empath: scoreMinaMaterials,
  critic: scoreSatouMaterials,
};

const BUILDER_USED_LABELS = {
  creative: 'joe-specialized',
  soul: 'agent-dispatcher:ray',
  strategist: 'agent-dispatcher:ken',
  empath: 'agent-dispatcher:mina',
  critic: 'agent-dispatcher:satou',
  master: 'mirror-specialized',
};

export const buildAgentDebugPreview = ({
  enabled = true,
  agentId = '',
  activated,
  userText = '',
  stateGuide,
  internalFrame,
  surfaceGuidance,
  usedAfterglow = false,
} = {}) => {
  if (!enabled) return null;

  const safeActivated = activated || {};
  const state = safeActivated.debug?.state || {};

  // ジョーは独自の専用ビルダーがあるため、その debug 経路に委譲する。
  if (agentId === 'creative') {
    const joePreview = buildJoeDebugPreview({
      enabled,
      activated: safeActivated,
      userText,
      stateGuide,
      internalFrame,
      surfaceGuidance,
    });
    return {
      agentId,
      builderUsed: BUILDER_USED_LABELS.creative,
      dominantAxes: joePreview.joeDominantAxes,
      stateGuidePreview: joePreview.joeStateGuidePreview,
      internalFramePreview: joePreview.joeInternalFramePreview,
      surfaceGuidancePreview: joePreview.joeSurfaceGuidancePreview,
      activatedBiasCount: joePreview.joeActivatedBiasCount,
      usedAfterglow,
    };
  }

  // 通常 5 エージェント / Mirror などの dispatcher ルート。
  const scorer = SCORE_AGENT_MATERIALS[agentId];
  let activatedBiasCount = 0;
  if (scorer) {
    const scored = scorer({ activated: safeActivated, userText, state });
    activatedBiasCount = buildBiasPack(scored).length;
  }

  return {
    agentId,
    builderUsed: BUILDER_USED_LABELS[agentId] || 'agent-dispatcher',
    dominantAxes: safeActivated.debug?.dominantAxes || [],
    stateGuidePreview: truncatePreview(stateGuide),
    internalFramePreview: truncatePreview(internalFrame),
    surfaceGuidancePreview: truncatePreview(surfaceGuidance),
    activatedBiasCount,
    usedAfterglow,
  };
};
