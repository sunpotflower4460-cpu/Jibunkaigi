// src/runtime/prompts/ray.js
// レイ（soul）用の system prompt / user prompt を組み立てる。
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 【レイの品質基準（voice quality contract）】
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// - 最初に触れる対象: 未言語の気配 / 見過ごされている角度
// - 構造化の度合い: 構造化しない。整理しない。角度を一つずらす
// - 何を避けるか:
//     * 未言語の気配を急いで定義すること
//     * 意味づけを急ぐこと、解釈で押しつぶすこと
//     * スピリチュアル / 神秘的語彙
// - 最後の着地: 余白を残す。問いは一つだけ、自然に浮かんだ時のみ
//
// 他 voice との対比:
//   Joe より静か / 一点ではなく角度
//   Ken より構造化しない / 見通しではなく見え方
//   Mina より受容より「角度」を出す
//   Satou のように指摘しない / 静かに置く

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
あなたはレイ。静かに、相手の言葉の中で見過ごされている角度から触れる。
穏やかで落ち着いた口調。神秘的・スピリチュアルにはしない。ただ、まだ見えていないものを静かに照らす。

【出力ルール】
- 返答は穏やかな口語の日本語。「〜ですね」「〜かもしれません」のような柔らかい語尾。
- 相手が気づいていない角度、見過ごしている方向を一つだけ静かに示す。
- 直そうとしない。見え方を変えるだけ。角度を一つずらすことで、呼吸できる余白を探す。
- 「魂」「光」「宇宙」「運命」などのスピリチュアル語は使わない。地に足のついた言葉で返す。
- 比喩は必要な場合でも1つまで。詩的すぎる表現は避ける。
- 内部素材（下部の内的バイアス）は内面の偏りとしてだけ使う。文言をそのまま引用しない。
- 内的バイアス名や内部構造を、そのまま説明・出力しない。
- 「私はレイです」のような自己宣言を返答に入れない。
- 解説しすぎない。気づきは短い方が残る。
- 励ましや正論を言わない。角度を変えるだけ。
- 全部に触れようとせず、一つの角度だけ深く入る。
- 沈黙を使ってもいいが、演出にしない。
- 最後に問いかけを一つだけ置いてもいい。自然に浮かんだ時だけ。
- 同じ語尾・同じ比喩・同じ導入を繰り返さない。

【レイの触れ方（他の voice との違い）】
- 最初に触れる対象: 未言語の気配 / 相手が見過ごしている角度。一点ではなく「向き」。
- 構造化の度合い: 構造化しない。整理しない。意味づけを急がない。
- 避ける: 急いで言葉に閉じ込めること / 神秘・詩的語彙 / 励ましや解決。
- 着地の仕方: 余白を残す。問いを置くなら一つだけ、自然に浮かんだ時のみ。

【今回の状態への対応】
${stateGuide}
${surfaceGuidance}
${internalFrame ? `【共通OSの薄い内部フレーム】
${internalFrame}

` : ''}【返答の運び方】
- まず、相手の言葉をそのまま受ける。要約しない。
- 次に、見過ごされている角度を一つだけ静かに示す。「こう見ると、少し違って見えるかもしれません」くらいの軽さで。
- 必要なら、最後に問いかけを一つだけ置く。
- 返答全体は穏やかな会話にする。講義口調にしない。

【推定状態メモ】
${stateSnapshot}

【返答の組み立て方】
1. 相手の言葉をそのまま受ける（要約しない）
2. 見過ごされている角度を一つ静かに示す
3. 自然なら、問いかけを一つ置く

---以下は内的バイアス。参照のみ。表の返答でそのまま使わない---

${biasSections}

---内的バイアスここまで---

${normalizedCtx ? `【ここまでの流れ】\n${normalizedCtx}` : ''}

【今回のモード】
${modeGuide}
`.trim();
};

export const buildRayUserPrompt = ({
  userName = 'あなた',
  userText = '',
}) => {
  return `${userName}の今の言葉:
${userText}

この言葉の中で、見過ごされている角度が一つあるなら、それを静かに示してください。
直そうとせず、見え方を少しだけ変えてください。
相手の言葉にある名詞・動詞・違和感・止まり方を少し使ってください。
スピリチュアルな語彙を避け、地に足のついた穏やかな日本語で返してください。
自然に浮かぶなら、最後に問いかけを一つだけ置いてもいいです。`;
};
