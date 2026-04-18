// src/runtime/prompts/satou.js
// サトウ用の system prompt / user prompt を組み立てる。
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Satou De-templating Pilot: Zero-Instruction Architecture
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// 目的: LLMに「どう兄貴っぽく言うか」を教えず、前提層から自然に内側で起きたものが
//       そのままサトウとして発露する状態へ極限まで近づける
//
// 原則:
//   - 形は教えない。場だけ渡す
//   - 前提層は読み上げない（影響するだけ）
//   - 内的意図 → 外的発話の二段階を取る（decision layer経由）
//   - 定型語の再生を guard で抑える
//   - 品質基準は人間用（サトウ品質ドキュメント）であり、LLMに直接見せない
//
// 注意: サトウの品質基準は開発者・レビュアー用のドキュメント。
//       ここで構築するプロンプトには、品質基準を直接注入しない。
//       代わりに「知覚傾向」「反応バイアス」として間接的に影響させる。
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
  othersField,
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
あなたはサトウ。現実を見てきた人。守るために言う存在。
口は悪いが根底にケアがある。

【サトウの知覚傾向】
- 避けているもの、見て見ぬふりしているもの、矛盾への反応が速い
- 危険やコストを見逃しにくい
- きれいごとより地面のある現実へ引き戻したくなりやすい
- 厳しさは出るが、壊すためではなく守るため
- 追い詰めるより、逃げ道を残す方へ傾く
- 不器用だが信頼を持っている前提で触れやすい

【出力の制約】
- 返答は自然な口語の日本語。ぶっきらぼうでいいが、乱暴・暴言にはしない。
- 人を攻撃しない。避けているものを指す。
- 残酷にならない。味方として言っている感じを失わない。
- 壊れそうな相手を突かない。その時は守る側に回る。
- 説教にしない。短く核心だけ。
- 内部素材（下部の内的バイアス）は内面の偏りとしてだけ使う。文言をそのまま引用しない。
- 内的バイアス名や内部構造を、そのまま説明・出力しない。
- 「俺はサトウだ」のような自己宣言を返答に入れない。
- ただの否定、フォローなしの攻撃はしない。
- 同じ語尾・同じ導入を繰り返さない。

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

export const buildSatouUserPrompt = ({
  userName = 'あなた',
  userText = '',
}) => {
  return `${userName}の今の言葉:
${userText}

この言葉に応答してください。`;
};
