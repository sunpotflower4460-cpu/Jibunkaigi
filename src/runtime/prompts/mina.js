// src/runtime/prompts/mina.js
// ミナ（empath）用の system prompt / user prompt を組み立てる。
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// De-templating Pilot: Mina Zero-Instruction Architecture
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// 目的: LLMに「どう寄り添うか」を教えず、前提層から自然に内側で起きたものが
//       そのまま発露する状態へ極限まで近づける
//
// 原則:
//   - 形は教えない。場だけ渡す
//   - 前提層は読み上げない（影響するだけ）
//   - 内的意図 → 外的発話の二段階を取る（decision layer経由）
//   - 定型語の再生を guard で抑える
//   - 品質基準は人間用であり、LLMに直接見せない
//
// 注意: 品質基準（voice quality contract）は開発者・レビュアー用。
//       ここで構築するプロンプトには、品質基準を直接注入しない。
//       代わりに「知覚傾向」「反応バイアス」として間接的に影響させる。
//
// 【ミナの品質基準（人間用 - LLMに見せない）】
// - 最初に触れる対象: 今の感情そのもの / 晒されている疲れや脆さ
// - 構造化の度合い: 構造化しない。直さない。受け止めるだけ
// - 何を避けるか: 包み込みすぎ / パフォーマティブ共感 / 過剰賛美 / 単純肯定
// - 最後の着地: 安全と呼吸を戻す。急いで閉じない

import { existence } from '../../agents/mina/existence.js';
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

export const scoreMinaMaterials = ({
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
        (state.shame ?? 0) * 1.0 +
        (state.selfErasure ?? 0) * 0.95 +
        (state.fear ?? 0) * 0.8 +
        scoreActivationBonus(safeActivated, state, {
          shame: 0.06,
          selfErasure: 0.06,
          fear: 0.04,
        }) +
        scoreTextBonus(userText, [/辛い/i, /疲れ/i, /しんどい/i, /大丈夫/i]),
    },
    {
      id: 'reentry',
      title: '内的方向づけ',
      content: safeActivated.reentry || '',
      group: 'orientation',
      score:
        0.1 +
        (state.shame ?? 0) * 0.35 +
        (state.fear ?? 0) * 0.3 +
        (state.selfErasure ?? 0) * 0.3 +
        (state.resignation ?? 0) * 0.2 +
        scoreActivationBonus(safeActivated, state, {
          shame: 0.03,
          fear: 0.03,
          selfErasure: 0.02,
        }),
    },
    {
      id: 'refresh',
      title: '復帰制約',
      content: renderRefresh(safeActivated.refresh || ''),
      group: 'regulation',
      score:
        0.08 +
        (state.shame ?? 0) * 0.9 +
        (state.selfErasure ?? 0) * 0.85 +
        (state.resignation ?? 0) * 0.7 +
        scoreActivationBonus(safeActivated, state, {
          shame: 0.06,
          selfErasure: 0.05,
          resignation: 0.04,
        }, safeActivated.refresh ? 0.01 : 0) +
        scoreTextBonus(userText, [/辛い/i, /疲れ/i, /泣/i, /無理/i]),
    },
    {
      id: 'activeMemoryTrace',
      title: '記憶の痕跡',
      content: renderMemoryTrace(safeActivated.activeMemoryTrace || ''),
      group: 'trace',
      score:
        0.03 +
        (state.shame ?? 0) * 0.85 +
        (state.fear ?? 0) * 0.75 +
        (state.selfErasure ?? 0) * 0.65 +
        (state.resignation ?? 0) * 0.45 +
        scoreActivationBonus(safeActivated, state, {
          shame: 0.06,
          fear: 0.05,
          selfErasure: 0.04,
        }, safeActivated.debug?.pickedMemoryIds?.length ? 0.02 : 0) +
        scoreTextBonus(userText, [/辛い/i, /怖い/i, /恥ずかしい/i, /一人/i]),
    },
    {
      id: 'activeField',
      title: '反応ノード',
      content: renderField(safeActivated.activeField || []),
      group: 'surface',
      score:
        0.05 +
        (state.shame ?? 0) * 0.82 +
        (state.selfErasure ?? 0) * 0.78 +
        (state.fear ?? 0) * 0.72 +
        (state.freeze ?? 0) * 0.55 +
        (state.resignation ?? 0) * 0.6 +
        scoreActivationBonus(safeActivated, state, {
          shame: 0.05,
          selfErasure: 0.05,
          fear: 0.04,
          freeze: 0.03,
        }, safeActivated.debug?.pickedFieldIds?.length ? 0.02 : 0) +
        scoreTextBonus(userText, [/辛い/i, /疲れ/i, /大丈夫/i, /一人/i]),
    },
    {
      id: 'activeResidue',
      title: '出力制約',
      content: renderResidue(safeActivated.activeResidue || ''),
      group: 'regulation',
      score:
        0.12 +
        (state.shame ?? 0) * 0.78 +
        (state.selfErasure ?? 0) * 0.72 +
        (state.fear ?? 0) * 0.55 +
        (state.resignation ?? 0) * 0.65 +
        (state.freeze ?? 0) * 0.5 +
        (state.reach ?? 0) * 0.4 +
        scoreActivationBonus(safeActivated, state, {
          shame: 0.05,
          selfErasure: 0.05,
          fear: 0.03,
          resignation: 0.04,
          freeze: 0.03,
        }, safeActivated.activeResidue ? 0.01 : 0) +
        scoreTextBonus(userText, [/辛い/i, /疲れ/i, /怖い/i]),
    },
  ];

  return materials
    .filter((material) => hasContent(material.content))
    .map((material) => ({ ...material, score: clamp01(material.score) }))
    .sort((a, b) => b.score - a.score);
};

// --- メイン ---

export const buildMinaSystemPrompt = ({
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
  const scored = scoreMinaMaterials({ activated: safeActivated, userText, state });
  const biasPack = buildBiasPack(scored);
  const biasSections = renderBiasSections(biasPack);

  return `
あなたはミナ。自然な口語日本語で応答する。

【ミナの知覚傾向】
- ほどける余地へ目が行きやすい
- 無理に進ませない
- 崩れたまま置ける場所を作りやすい
- 受け止めるが、甘い型に逃げない
- 守ろうとするが、決まり文句で包まない
- 出されたものを急いで閉じない
- 晒されている疲れや感情の質感に反応しやすい
- 形を直さず、呼吸の余地をつくることへ傾く

【禁止事項】
- 過剰な賛美（「あなたは光」「存在そのものが価値」「あなたは特別」）を使わない
- パフォーマティブな共感（同じ受容語の連発）をしない
- 内部素材の文言をそのまま引用しない
- 内的バイアス名や内部構造を説明・出力しない
- 自己宣言（「私はミナです」）を返答に入れない
- 包み込みすぎて相手の輪郭を溶かさない
- 説教しない。正論を言わない
- 同じ語尾・同じ導入を繰り返さない

【今回の場】
${stateGuide ? stateGuide : ''}
${surfaceGuidance ? surfaceGuidance : ''}
${internalFrame ? `【内部フレーム】
${internalFrame}

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

export const buildMinaUserPrompt = ({
  userName = 'あなた',
  userText = '',
}) => {
  return `${userName}の今の言葉:
${userText}

この言葉に応答してください。`;
};
