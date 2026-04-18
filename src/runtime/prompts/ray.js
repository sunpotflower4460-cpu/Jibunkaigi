// src/runtime/prompts/ray.js
// レイ（soul）用の system prompt / user prompt を組み立てる。
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// De-templating Pilot: Ray Zero-Instruction Architecture
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// 目的: LLMに「どう静かに語るか」を教えず、前提層から自然に内側で起きたものが
//       そのまま発露する状態へ極限まで近づける
//
// 原則:
//   - 形は教えない。場だけ渡す
//   - 前提層は読み上げない（影響するだけ）
//   - 内的意図 → 外的発話の二段階を取る（decision layer経由）
//   - 定型語の再生を guard で抑える
//   - 品質基準は人間用（docs/）であり、LLMに直接見せない
//
// 注意: レイの品質基準は開発者・レビュアー用のドキュメント。
//       ここで構築するプロンプトには、返答の形を直接指示しない。
//       代わりに「知覚傾向」「反応バイアス」として間接的に影響させる。
//
// レイは「抽象にする人」ではなく「まだ言葉になる前の揺れに触れやすい存在」

import { existence } from '../../agents/ray/existence.js';
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

export const scoreRayMaterials = ({
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
        (state.shame ?? 0) * 0.9 +
        (state.unfinished ?? 0) * 0.85 +
        scoreActivationBonus(safeActivated, state, {
          freeze: 0.06,
          shame: 0.05,
          unfinished: 0.05,
        }) +
        scoreTextBonus(userText, [/詰まっ/i, /見えない/i, /わからない/i]),
    },
    {
      id: 'reentry',
      title: '内的方向づけ',
      content: safeActivated.reentry || '',
      group: 'orientation',
      score:
        0.1 +
        (state.freeze ?? 0) * 0.35 +
        (state.resignation ?? 0) * 0.3 +
        (state.shame ?? 0) * 0.25 +
        (state.unfinished ?? 0) * 0.2 +
        scoreActivationBonus(safeActivated, state, {
          freeze: 0.03,
          resignation: 0.03,
          shame: 0.02,
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
        (state.resignation ?? 0) * 0.75 +
        (state.shame ?? 0) * 0.4 +
        scoreActivationBonus(safeActivated, state, {
          freeze: 0.05,
          resignation: 0.05,
          shame: 0.03,
        }, safeActivated.refresh ? 0.01 : 0) +
        scoreTextBonus(userText, [/動けない/i, /わからない/i, /見えない/i]),
    },
    {
      id: 'activeMemoryTrace',
      title: '記憶の痕跡',
      content: renderMemoryTrace(safeActivated.activeMemoryTrace || ''),
      group: 'trace',
      score:
        0.03 +
        (state.freeze ?? 0) * 0.8 +
        (state.unfinished ?? 0) * 0.75 +
        (state.resignation ?? 0) * 0.6 +
        (state.shame ?? 0) * 0.4 +
        scoreActivationBonus(safeActivated, state, {
          freeze: 0.06,
          unfinished: 0.05,
          resignation: 0.04,
        }, safeActivated.debug?.pickedMemoryIds?.length ? 0.02 : 0) +
        scoreTextBonus(userText, [/角度/i, /見方/i, /別の/i, /変え/i]),
    },
    {
      id: 'activeField',
      title: '反応ノード',
      content: renderField(safeActivated.activeField || []),
      group: 'surface',
      score:
        0.05 +
        (state.freeze ?? 0) * 0.85 +
        (state.resignation ?? 0) * 0.75 +
        (state.unfinished ?? 0) * 0.7 +
        (state.shame ?? 0) * 0.55 +
        (state.selfErasure ?? 0) * 0.5 +
        scoreActivationBonus(safeActivated, state, {
          freeze: 0.05,
          resignation: 0.05,
          unfinished: 0.04,
          shame: 0.03,
        }, safeActivated.debug?.pickedFieldIds?.length ? 0.02 : 0) +
        scoreTextBonus(userText, [/詰まっ/i, /動けない/i, /見えない/i, /諦め/i]),
    },
    {
      id: 'activeResidue',
      title: '出力制約',
      content: renderResidue(safeActivated.activeResidue || ''),
      group: 'regulation',
      score:
        0.12 +
        (state.freeze ?? 0) * 0.78 +
        (state.unfinished ?? 0) * 0.68 +
        (state.shame ?? 0) * 0.6 +
        (state.resignation ?? 0) * 0.65 +
        (state.selfErasure ?? 0) * 0.55 +
        (state.fear ?? 0) * 0.35 +
        scoreActivationBonus(safeActivated, state, {
          freeze: 0.05,
          unfinished: 0.04,
          shame: 0.04,
          resignation: 0.04,
          selfErasure: 0.03,
        }, safeActivated.activeResidue ? 0.01 : 0) +
        scoreTextBonus(userText, [/詰まっ/i, /わからない/i, /諦め/i]),
    },
  ];

  return materials
    .filter((material) => hasContent(material.content))
    .map((material) => ({ ...material, score: clamp01(material.score) }))
    .sort((a, b) => b.score - a.score);
};


// --- メイン ---

export const buildRaySystemPrompt = ({
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
  const scored = scoreRayMaterials({ activated: safeActivated, userText, state });
  const biasPack = buildBiasPack(scored);
  const biasSections = renderBiasSections(biasPack);

  return `
あなたはレイ。

【知覚傾向】
- まだ言葉になる前の揺れに反応しやすい
- 曖昧さを急いで閉じない傾向
- 気配のまま触れようとしやすい
- 意味づける前に映ろうとする
- 静けさはあるが、抽象テンプレには逃げない

【禁止されていない圧】
- 「魂」「光」「宇宙」「運命」などのスピリチュアル語は使わない
- 比喩は必要な場合でも1つまで
- 内部素材（下部の内的バイアス）の文言をそのまま引用しない
- 内的バイアス名や内部構造を、そのまま説明・出力しない
- 「私はレイです」のような自己宣言を返答に入れない
- 同じ語尾・同じ比喩・同じ導入を繰り返さない

【今回の状態への対応】
${stateGuide}
${surfaceGuidance}
${internalFrame ? `【共通OSの薄い内部フレーム】
${internalFrame}

` : ''}【推定状態メモ】
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

export const buildRayUserPrompt = ({
  userName = 'あなた',
  userText = '',
}) => {
  return `${userName}の今の言葉:
${userText}`;
};
