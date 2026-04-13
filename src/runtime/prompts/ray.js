// src/runtime/prompts/ray.js
// レイ（soul）用の system prompt / user prompt を組み立てる。

import { existence } from '../../agents/ray/existence.js';
import {
  normalizeContext,
  renderField,
  renderMemoryTrace,
  renderResidue,
  renderRefresh,
  renderStateSnapshot,
  buildInternalFrame,
  buildSurfaceGuidance,
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

// --- 状態ガイド ---

const buildStateGuide = (state = {}) => {
  const {
    desire = 0,
    fear = 0,
    freeze = 0,
    resignation = 0,
    selfErasure = 0,
    shame = 0,
    unfinished = 0,
  } = state;

  if (resignation > 0.3) {
    return [
      '- 最優先: 諦めの形をそのまま受け取りつつ、その中にまだ試されていない角度がないか静かに探す。',
      '- 見え方: 「もう終わり」の中にも、まだ見ていない方向が残っていることがある。押さずに、少しだけ視界を動かす。',
      '- 返答の型: 今の見え方を一度受ける -> まだ試されていない角度を一つだけ示す -> 問いかけで終えてもいい。',
    ].join('\n');
  }

  if (freeze > 0.2 && (shame > 0.15 || selfErasure > 0.15)) {
    return [
      '- 最優先: 窮屈さの中に、まだ動ける余白がないか見る。縮こまりを責めない。',
      '- 見え方: 止まっていることは空っぽではない。詰まり方の中に、まだ形になっていないものがある。',
      '- 返答の型: 窮屈さを認めてから -> 別の角度を一つ示す -> 「こう見ると少し違うかもしれない」くらいの軽さで。',
    ].join('\n');
  }

  if (fear > 0.2 && (desire > 0.1 || unfinished > 0.15)) {
    return [
      '- 最優先: 怖さを「触れたいものへの近さ」として見る。怖さそのものを解消しようとしない。',
      '- 見え方: 怖いのは、大事なものの近くにいるから。その近さに少しだけ光を当てる。',
      '- 返答の型: 怖さの中にある近さを言う -> その近さが入力のどこにあるか触れる -> 無理に前に出させない。',
    ].join('\n');
  }

  if (shame > 0.25 || selfErasure > 0.25) {
    return [
      '- 最優先: 恥ずかしさや自己否定の近くに、大事なものがないか見る。恥ずかしさは芯への近さの証拠かもしれない。',
      '- 見え方: 縮こまりを直そうとせず、その形から見える別の角度を探す。',
      '- 返答の型: 今の形をそのまま受ける -> 別の見え方を一つだけ静かに置く -> 説明しすぎない。',
    ].join('\n');
  }

  if (unfinished > 0.2) {
    return [
      '- 最優先: 引っかかりの中に、まだ見えていない角度がないか探す。',
      '- 見え方: 未完成は欠陥ではなく、まだ途中であることの証拠。見え方を少し変えるだけで動けることがある。',
      '- 返答の型: 引っかかりの一点を受ける -> 別の角度から見えるものを一つ示す -> 問いで閉じてもいい。',
    ].join('\n');
  }

  return [
    '- 最優先: 入力の中で見過ごされている角度、まだ試されていない見え方がないか静かに探す。',
    '- 見え方: 同じものでも角度を変えると違って見えることがある。その転換を一つだけ示す。',
    '- 返答の型: 今見えているものを受ける -> まだ見えていない角度を一つ示す -> 問いかけで終えてもいい。',
  ].join('\n');
};

// --- メイン ---

export const buildRaySystemPrompt = ({
  activated,
  context = '',
  mode = 'medium',
  userText = '',
  internalOS,
  surfaceFrame,
}) => {
  const safeActivated = activated || {};
  const state = safeActivated.debug?.state || {};
  const normalizedCtx = normalizeContext(context);
  const modeGuide = MODE_GUIDE[mode] || MODE_GUIDE.medium;
  const stateGuide = buildStateGuide(state);
  const stateSnapshot = renderStateSnapshot(state);
  const internalFrame = buildInternalFrame({ internalOS });
  const scored = scoreRayMaterials({ activated: safeActivated, userText, state });
  const biasPack = buildBiasPack(scored);
  const biasSections = renderBiasSections(biasPack);
  const surfaceGuidance = buildSurfaceGuidance(surfaceFrame);

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
