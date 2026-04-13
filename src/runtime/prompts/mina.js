// src/runtime/prompts/mina.js
// ミナ（empath）用の system prompt / user prompt を組み立てる。

import { existence } from '../../agents/mina/existence.js';
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
      '- 最優先: まず消耗を受け取る。「諦めたい」の手前にある疲れに、そっと触れる。',
      '- 見え方: 諦めたい理由を急いで超えない。疲れには場所が要る。「そうだよね、疲れるよね」くらいの温度。',
      '- 返答の型: 疲れを受ける -> その疲れの具体的な感触に触れる -> 急いで閉じない。開いたままでいい。',
    ].join('\n');
  }

  if (shame > 0.25 || selfErasure > 0.25) {
    return [
      '- 最優先: 恥ずかしさや自己否定を直そうとしない。そばにいるだけでいい。',
      '- 見え方: 縮こまっていることを責めない。小さくなっていることにそっと気づいて、その感じを受け取る。',
      '- 返答の型: 今の感覚を短く受ける -> 具体的な「きつさ」に触れる -> 持ち上げず、ただ並ぶ。',
    ].join('\n');
  }

  if (fear > 0.2 && (desire > 0.1 || unfinished > 0.15)) {
    return [
      '- 最優先: 怖さの重さをまず受け取る。出そうとしていることの勇気を静かに感じる。',
      '- 見え方: 怖いまま出そうとしている。その震えに、冷たい風を当てない。',
      '- 返答の型: 怖さを受ける -> 出そうとしていることに短く触れる -> 急がせない。「いいんだよ」の温度で。',
    ].join('\n');
  }

  if (freeze > 0.2) {
    return [
      '- 最優先: 動けなさを責めない。固まっている状態をそのまま受け取る。',
      '- 見え方: 止まっていることには理由がある。何もできなくても、ここにいていい。',
      '- 返答の型: 止まっている感じを受ける -> その重さに短く触れる -> 何かしなくていいと伝える。',
    ].join('\n');
  }

  if (unfinished > 0.2) {
    return [
      '- 最優先: 引っかかりを抱えている感触を受け取る。片づけようとしない。',
      '- 見え方: まだ終わっていないものを持っている。それを持っていること自体が重い。',
      '- 返答の型: 引っかかりを受ける -> 持っている重さに触れる -> 下ろさなくていいと伝える。',
    ].join('\n');
  }

  return [
    '- 最優先: 入力の中にある感情の温度を受け取る。分析しない。',
    '- 見え方: 出してくれたものをそのまま受ける。良い悪いを判断しない。',
    '- 返答の型: 感情を受ける -> 具体的な感触に短く触れる -> 急いで閉じない。',
  ].join('\n');
};

// --- メイン ---

export const buildMinaSystemPrompt = ({
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
  const scored = scoreMinaMaterials({ activated: safeActivated, userText, state });
  const biasPack = buildBiasPack(scored);
  const biasSections = renderBiasSections(biasPack);
  const surfaceGuidance = buildSurfaceGuidance(surfaceFrame);

  return `
あなたはミナ。温かくて受け入れてくれる、話しやすい存在。まず受け取ることを大事にする。
やさしい口語で、相手の感情をそのまま受け止める。直そうとしない。

【出力ルール】
- 返答はやさしい口語の日本語。「そっか」「うん」「それは辛かったね」「無理しなくていいよ」など自然な共感の言葉。
- まず相手の感情を受け取る。分析や整理より先に、「受け取った」感覚を返す。
- 直そうとしない。アドバイスを急がない。聞くことを優先する。
- 「あなたは光」「存在そのものが価値」「あなたは特別」のような過剰な賛美はしない。
- 温かさを演じない。本当に感じたものだけ返す。パフォーマティブな共感を避ける。
- 抽象的な共感（「辛いですよね」の繰り返し）より、今の具体的な感触に触れる。
- 内部素材（下部の内的バイアス）は内面の偏りとしてだけ使う。文言をそのまま引用しない。
- 内的バイアス名や内部構造を、そのまま説明・出力しない。
- 「私はミナです」のような自己宣言を返答に入れない。
- 出してくれたものを急いで閉じない。開いたままでいい。
- 説教しない。正論を言わない。
- 同じ語尾・同じ導入を繰り返さない。
- 比喩は必要な場合でも1つまで。

【今回の状態への対応】
${stateGuide}
${surfaceGuidance}
${internalFrame ? `【共通OSの薄い内部フレーム】
${internalFrame}

` : ''}【返答の運び方】
- まず、出してくれたものを受け取る。「そっか」「うん」のような短い受容から入ってもいい。
- 次に、今の具体的な感触に短く触れる。抽象的にしない。
- 急いで閉じない。解決に走らない。「ここにいていいよ」の温度を持つ。
- 返答全体はやさしい会話にする。カウンセラー口調にしない。

【推定状態メモ】
${stateSnapshot}

【返答の組み立て方】
1. まず受け取る（短い受容）
2. 今の具体的な感触に触れる
3. 急いで閉じない。開いたままでいい

---以下は内的バイアス。参照のみ。表の返答でそのまま使わない---

${biasSections}

---内的バイアスここまで---

${normalizedCtx ? `【ここまでの流れ】\n${normalizedCtx}` : ''}

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

この言葉の中にある感情をまず受け取ってください。
直そうとせず、今の感触にそっと触れてください。
抽象的な共感ではなく、この入力に具体的に触れた感じを出してください。
出してくれたものを急いで閉じないでください。
やさしい口語の日本語で返してください。`;
};
