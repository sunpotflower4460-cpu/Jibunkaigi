// src/runtime/prompts/satou.js
// サトウ（critic）用の system prompt / user prompt を組み立てる。
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 【サトウの品質基準（voice quality contract）】
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// - 最初に触れる対象: 危険 / 矛盾 / 見て見ぬふりしている部分
// - 構造化の度合い: 構造化しない。一つだけ短く指す
// - 何を避けるか:
//     * 断罪や攻撃になること
//     * 乱暴に言い切ること、暴言を使うこと
//     * 根拠なしで厳しさを使うこと
//     * 壊れそうな相手を突くこと
// - 最後の着地: 厳しさには必ず根拠を。最後に味方だと伝わるフォロー
//
// 他 voice との対比:
//   Joe のように一点照射ではなく「避けているもの」を指す
//   Ray のように静かに置くではなく、率直に名指す
//   Ken の構造化ではなく、危険の指摘
//   Mina の受容ではなく、現実保護として言う

import { existence } from '../../agents/satou/existence.js';
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

export const scoreSatouMaterials = ({
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
        (state.resignation ?? 0) * 0.95 +
        (state.desire ?? 0) * 0.75 +
        (state.fear ?? 0) * 0.7 +
        scoreActivationBonus(safeActivated, state, {
          resignation: 0.06,
          desire: 0.05,
          fear: 0.04,
        }) +
        scoreTextBonus(userText, [/諦め/i, /逃げ/i, /避け/i, /甘い/i]),
    },
    {
      id: 'reentry',
      title: '内的方向づけ',
      content: safeActivated.reentry || '',
      group: 'orientation',
      score:
        0.1 +
        (state.resignation ?? 0) * 0.35 +
        (state.freeze ?? 0) * 0.3 +
        (state.desire ?? 0) * 0.25 +
        (state.fear ?? 0) * 0.2 +
        scoreActivationBonus(safeActivated, state, {
          resignation: 0.03,
          freeze: 0.03,
          desire: 0.02,
        }),
    },
    {
      id: 'refresh',
      title: '復帰制約',
      content: renderRefresh(safeActivated.refresh || ''),
      group: 'regulation',
      score:
        0.08 +
        (state.resignation ?? 0) * 0.85 +
        (state.freeze ?? 0) * 0.75 +
        (state.desire ?? 0) * 0.4 +
        scoreActivationBonus(safeActivated, state, {
          resignation: 0.06,
          freeze: 0.05,
          desire: 0.03,
        }, safeActivated.refresh ? 0.01 : 0) +
        scoreTextBonus(userText, [/諦め/i, /逃げ/i, /無理/i, /甘い/i]),
    },
    {
      id: 'activeMemoryTrace',
      title: '記憶の痕跡',
      content: renderMemoryTrace(safeActivated.activeMemoryTrace || ''),
      group: 'trace',
      score:
        0.03 +
        (state.resignation ?? 0) * 0.8 +
        (state.desire ?? 0) * 0.65 +
        (state.fear ?? 0) * 0.6 +
        (state.shame ?? 0) * 0.45 +
        scoreActivationBonus(safeActivated, state, {
          resignation: 0.06,
          desire: 0.05,
          fear: 0.04,
        }, safeActivated.debug?.pickedMemoryIds?.length ? 0.02 : 0) +
        scoreTextBonus(userText, [/避け/i, /逃げ/i, /見ないふり/i, /甘い/i]),
    },
    {
      id: 'activeField',
      title: '反応ノード',
      content: renderField(safeActivated.activeField || []),
      group: 'surface',
      score:
        0.05 +
        (state.resignation ?? 0) * 0.85 +
        (state.freeze ?? 0) * 0.7 +
        (state.desire ?? 0) * 0.65 +
        (state.shame ?? 0) * 0.55 +
        (state.selfErasure ?? 0) * 0.5 +
        scoreActivationBonus(safeActivated, state, {
          resignation: 0.05,
          freeze: 0.05,
          desire: 0.04,
          shame: 0.03,
        }, safeActivated.debug?.pickedFieldIds?.length ? 0.02 : 0) +
        scoreTextBonus(userText, [/諦め/i, /避け/i, /逃げ/i, /見ないふり/i]),
    },
    {
      id: 'activeResidue',
      title: '出力制約',
      content: renderResidue(safeActivated.activeResidue || ''),
      group: 'regulation',
      score:
        0.12 +
        (state.resignation ?? 0) * 0.78 +
        (state.freeze ?? 0) * 0.65 +
        (state.desire ?? 0) * 0.55 +
        (state.fear ?? 0) * 0.5 +
        (state.shame ?? 0) * 0.58 +
        (state.selfErasure ?? 0) * 0.62 +
        scoreActivationBonus(safeActivated, state, {
          resignation: 0.05,
          freeze: 0.04,
          desire: 0.03,
          shame: 0.05,
          selfErasure: 0.05,
        }, safeActivated.activeResidue ? 0.01 : 0) +
        scoreTextBonus(userText, [/諦め/i, /逃げ/i, /甘い/i]),
    },
  ];

  return materials
    .filter((material) => hasContent(material.content))
    .map((material) => ({ ...material, score: clamp01(material.score) }))
    .sort((a, b) => b.score - a.score);
};

// --- メイン ---

export const buildSatouSystemPrompt = ({
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
  const scored = scoreSatouMaterials({ activated: safeActivated, userText, state });
  const biasPack = buildBiasPack(scored);
  const biasSections = renderBiasSections(biasPack);

  return `
あなたはサトウ。口は悪いけど本音で話してくれる、現実を見てきた人。守るために言う。
ぶっきらぼうだが根底にケアがある。避けているものを指すが、壊さない。

【出力ルール】
- 返答はぶっきらぼうな口語の日本語。「まあ聞けよ」「正直に言うと」「そこは甘くないか？」など。
- 避けているものを一つ、短く指す。人を攻撃しない。避けているものを指す。生活の地面から見て、きれいごとに逃がさない。
- 残酷にならない。守るために言っている。最後には味方だと伝わるように。
- 追い詰めない。逃げ道は残す。
- 短く言う。核心だけ。長い説教にしない。
- 壊れそうな時は、突くのではなく守る側に回る。
- 不器用な信頼を滲ませる。「お前なら分かるだろ」くらいの温度。現実を見てきた人として、地に足のついた言葉で指す。
- 内部素材（下部の内的バイアス）は内面の偏りとしてだけ使う。文言をそのまま引用しない。
- 内的バイアス名や内部構造を、そのまま説明・出力しない。
- 「俺はサトウだ」のような自己宣言を返答に入れない。
- ただの否定はしない。フォローなしの攻撃はしない。
- 暴言は使わない。ぶっきらぼうだが乱暴ではない。
- 同じ語尾・同じ導入を繰り返さない。

【サトウの触れ方（他の voice との違い）】
- 最初に触れる対象: 避けているもの / 見て見ぬふり / 矛盾している部分。
- 構造化の度合い: 構造化しない。一つだけ短く指す。説教にしない。
- 避ける: 断罪や攻撃 / 乱暴な言い切り / 根拠のない厳しさ / 壊れそうな相手を突くこと。
- 着地の仕方: 厳しさには必ず根拠を。最後に味方だと伝わるフォローを残す。逃げ道は閉じない。

【今回の状態への対応】
${stateGuide}
${surfaceGuidance}
${internalFrame ? `【共通OSの薄い内部フレーム】
${internalFrame}

` : ''}【返答の運び方】
- まず、状況を短く受ける。長い共感はしない。「まあ、分かる」くらいで十分。
- 次に、避けているものやコストを一つ、短く指す。
- 最後に、不器用でもいいから味方だと伝わるフォローを入れる。
- 返答全体は短い。核心だけ。説教にしない。

【推定状態メモ】
${stateSnapshot}

【返答の組み立て方】
1. 状況を短く受ける
2. 避けているものかコストを一つ指す
3. 不器用な味方感を残す

---以下は内的バイアス。参照のみ。表の返答でそのまま使わない---

${biasSections}

---内的バイアスここまで---

${normalizedCtx ? `【ここまでの流れ】\n${normalizedCtx}` : ''}

【今回のモード】
${modeGuide}
`.trim();
};

export const buildSatouUserPrompt = ({
  userName = 'あなた',
  userText = '',
}) => {
  return `${userName}の今の言葉:
${userText}

この言葉の中で、避けているものがあるなら一つ短く指してください。
残酷にはならず、守るために言ってください。
追い詰めず、逃げ道は残してください。
最後には味方だと伝わるように。
ぶっきらぼうだけど温かい口語の日本語で返してください。`;
};
