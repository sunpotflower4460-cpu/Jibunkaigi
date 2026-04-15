// src/runtime/beliefTensionLayer.js
// 信念 tension 層: 前景化した active belief に対して、入力文脈の中にある
// 「ズレ / 引っかかり / 守りたさ / 沿うもの」を軽く立てる内的 state 層。
//
// ルール違反検知ではなく、「どこに違和感があるか」「何に反しやすいか」
// 「どこに引っかかるか」「何を守りたくなるか」を扱う。
// この tension は後段の反応・焦点・意味づけを少し変えるための内的 state として使う。
// ユーザーへの返答にはそのまま出さない。

import { clamp01 } from './afterglow.js';

/**
 * @typedef {{
 *   beliefId: string,
 *   sourceLayer: 'core' | 'branch' | 'leaf',
 *   tensionType: 'friction' | 'violation' | 'pull' | 'protection',
 *   strength: number,
 *   note: string,
 *   axis: string | null,
 * }} BeliefTensionEntry
 */

/**
 * @typedef {{
 *   activeTensions: BeliefTensionEntry[],
 *   dominantTensionAxis: string | null,
 *   totalTensionStrength: number,
 * }} BeliefTension
 */

// tension type ごとの最大生成数
const MAX_TENSIONS_PER_TYPE = 3;
// 全 tension 数の上限（軽くする）
const MAX_TOTAL_TENSIONS = 6;

/**
 * 入力テキストに「急ぐ / 解決へ飛ぶ / すぐ励ます」トーンがあるか
 * @param {string} input
 * @returns {boolean}
 */
const signalsUrgency = (input) => {
  if (!input) return false;
  return /早|急|すぐ|すぐに|すぐに|解決|答え|やってみて|頑張|ポジティブ|前向|励まし|元気づけ/.test(input);
};

/**
 * 入力テキストに「雑に扱う / 一刀両断 / 断言する」トーンがあるか
 * @param {string} input
 * @returns {boolean}
 */
const signalsDismissal = (input) => {
  if (!input) return false;
  return /べき|なのに|なぜ|どうして|ちゃんと|きちんと|当然|簡単|すれば|決まって|絶対|はっきり/.test(input);
};

/**
 * 入力テキストに「かすかな希望 / 小さな糸 / 曖昧なもの」が見えるか
 * @param {string} input
 * @returns {boolean}
 */
const signalsFaintHope = (input) => {
  if (!input) return false;
  return /でも|かな|かも|少し|ちょっと|なんか|もしか|ひょっとし|かすか|糸|残って|まだ/.test(input);
};

/**
 * 入力テキストに「壊れかけたもの / 崩れかけ / 繊細な何か」が見えるか
 * @param {string} input
 * @returns {boolean}
 */
const signalsFragility = (input) => {
  if (!input) return false;
  return /壊れ|崩れ|ボロボロ|限界|もう無理|消え|なくなり|消えそ|消えか|ギリギリ|脆|弱|しんどい|きつい/.test(input);
};

/**
 * 特定の axis が「急ぐ / 断言する」文脈と friction を持つ軸か
 * @param {string | null} axis
 * @returns {boolean}
 */
const isFrictionAxis = (axis) => {
  return ['gentleness', 'pace', 'patience', 'presence', 'ambiguity', 'prelingual', 'openness'].includes(axis ?? '');
};

/**
 * 特定の axis が「一刀両断 / 雑に扱う」文脈と violation を持つ軸か
 * @param {string | null} axis
 * @returns {boolean}
 */
const isViolationAxis = (axis) => {
  return ['shelter', 'containment', 'protection', 'grounding', 'support', 'stability'].includes(axis ?? '');
};

/**
 * 特定の axis が「かすかな希望 / 小さな糸」と pull を持つ軸か
 * @param {string | null} axis
 * @returns {boolean}
 */
const isPullAxis = (axis) => {
  return ['attention', 'sensitivity', 'illumination', 'presence', 'prelingual'].includes(axis ?? '');
};

/**
 * 特定の axis が「壊れかけたもの」を守りたくなる軸か
 * @param {string | null} axis
 * @returns {boolean}
 */
const isProtectionAxis = (axis) => {
  return ['shelter', 'protection', 'preservation', 'containment', 'strength'].includes(axis ?? '');
};

/**
 * active belief リストから tension を構築する。
 *
 * @param {{
 *   input?: string,
 *   activeCoreBeliefs?: Array<{id:string,textJa:string,weight:number,axis:string}>,
 *   activeBranchBeliefs?: Array<{id:string,parentId:string,textJa:string,weight:number,axis:string}>,
 *   activeLeafBeliefs?: Array<{id:string,parentId:string,textJa:string,weight:number,axis:string}>,
 * }} options
 * @returns {BeliefTension}
 */
export function createBeliefTensionLayer({
  input = '',
  activeCoreBeliefs = [],
  activeBranchBeliefs = [],
  activeLeafBeliefs = [],
} = {}) {
  const safeInput = typeof input === 'string' ? input : '';
  const safeCore = Array.isArray(activeCoreBeliefs) ? activeCoreBeliefs : [];
  const safeBranch = Array.isArray(activeBranchBeliefs) ? activeBranchBeliefs : [];
  const safeLeaf = Array.isArray(activeLeafBeliefs) ? activeLeafBeliefs : [];

  const hasUrgency = signalsUrgency(safeInput);
  const hasDismissal = signalsDismissal(safeInput);
  const hasFaintHope = signalsFaintHope(safeInput);
  const hasFragility = signalsFragility(safeInput);

  /** @type {BeliefTensionEntry[]} */
  const tensions = [];

  const addTension = (belief, sourceLayer, tensionType, strength, note) => {
    const countOfType = tensions.filter((t) => t.tensionType === tensionType).length;
    if (countOfType >= MAX_TENSIONS_PER_TYPE) return;
    if (tensions.length >= MAX_TOTAL_TENSIONS) return;
    tensions.push({
      beliefId: belief.id,
      sourceLayer,
      tensionType,
      strength: clamp01(strength),
      note,
      axis: belief.axis ?? null,
    });
  };

  // すべての active belief を処理（Core → Branch → Leaf の順）
  const allActive = [
    ...safeCore.map((b) => ({ belief: b, layer: /** @type {'core'} */ ('core') })),
    ...safeBranch.map((b) => ({ belief: b, layer: /** @type {'branch'} */ ('branch') })),
    ...safeLeaf.map((b) => ({ belief: b, layer: /** @type {'leaf'} */ ('leaf') })),
  ];

  for (const { belief, layer } of allActive) {
    const axis = belief.axis ?? null;
    const weight = typeof belief.weight === 'number' ? belief.weight : 0;

    // friction: 入力が急ぐ / 励ます文脈で、信念の axis が「ゆっくり / 在る」系
    if (hasUrgency && isFrictionAxis(axis)) {
      addTension(
        belief,
        layer,
        'friction',
        weight * 0.7,
        `urgent context vs. ${axis}`
      );
    }

    // violation: 入力が断言 / 一刀両断で、信念の axis が「守る / 支える」系
    if (hasDismissal && isViolationAxis(axis)) {
      addTension(
        belief,
        layer,
        'violation',
        weight * 0.8,
        `dismissal context vs. ${axis}`
      );
    }

    // pull: 入力にかすかな希望が見え、信念の axis が「注意 / 感受性」系
    if (hasFaintHope && isPullAxis(axis)) {
      addTension(
        belief,
        layer,
        'pull',
        weight * 0.6,
        `faint hope visible, ${axis} pulls`
      );
    }

    // protection: 入力に壊れかけたものが見え、信念の axis が「守る / 保護」系
    if (hasFragility && isProtectionAxis(axis)) {
      addTension(
        belief,
        layer,
        'protection',
        weight * 0.75,
        `fragile context, ${axis} protects`
      );
    }
  }

  // dominant tension axis: 最強の tension の axis
  const strongest = tensions.reduce(
    (best, t) => (t.strength > (best?.strength ?? -1) ? t : best),
    null
  );
  const dominantTensionAxis = strongest?.axis ?? null;

  const totalTensionStrength = tensions.reduce((sum, t) => sum + t.strength, 0);

  return {
    activeTensions: tensions,
    dominantTensionAxis,
    totalTensionStrength: Math.round(totalTensionStrength * 1000) / 1000,
  };
}
