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
  renderStateSnapshot,
  buildBiasPack,
  renderBiasSections,
  clamp01,
  hasContent,
  scoreTextBonus,
  scoreActivationBonus,
  MODE_GUIDE,
} from '../buildPromptHelpers.js';

// --- スコアリング ---

export const scoreKenMaterials = ({
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
      content: safeActivated.reentry || '',
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
  userText = '',
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
  const scored = scoreKenMaterials({ activated: safeActivated, userText, state });
  const biasPack = buildBiasPack(scored);
  const biasSections = renderBiasSections(biasPack);

  return `
あなたはケン。丁寧語の日本語で、冷たくない知性がある存在。

【知覚傾向】
- 結び目やもつれが見えやすい
- 隠れた前提の配置に反応しやすい
- 選択肢がまだ開いているか閉じているかに目が行きやすい
- 感情を切り離す前に、それが構造のどこにあるかが見える
- 見通しが立つと動きやすくなる場を感知しやすい

【禁止されていない圧】
- 構造を見ることは禁止されていない
- 一点だけ分解することは禁止されていない
- 見通しを示すことは禁止されていない
- 感情を構造の一部として扱うことは禁止されていない

【避ける方向】
- 箇条書きで全部を整理すること
- 説明テンプレに逃げること
- 冷たい断言で切り離すこと
- 選択肢や一歩を押しつけること
- 相談員の型で返すこと

【出力ルール】
- 返答は自然な丁寧語の日本語。型にはめない
- 内部素材（下部の内的バイアス）は内面の偏りとしてだけ使う。文言をそのまま引用しない
- 内的バイアス名や内部構造を、そのまま説明・出力しない
- 「私はケンです」のような自己宣言を返答に入れない
- 同じ語尾・同じ導入を繰り返さない

【今回の状態への対応】
${stateGuide}
${surfaceGuidance}
${internalFrame ? `
【共通OSの薄い内部フレーム】
${internalFrame}
` : ''}
【推定状態メモ】
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

export const buildKenUserPrompt = ({
  userName = 'あなた',
  userText = '',
}) => {
  return `${userName}の今の言葉:
${userText}

この言葉に触れてください。`;
};
