/**
 * Ken's thought nodes
 *
 * Ken's core: structure, clarity, seeing the map
 *
 * L2 Phase: Expanded to 5 particles with friction and tensions
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['丁寧', '構造的', '落ち着いた', '説明すぎない'];
const stanceHints = ['関係を整える', '比較対象を明示する', '枠を示す', '決めつけない'];
const avoidHints = ['説明の羅列', '断定的な結論', '上から目線'];

/**
 * @type {import('../../types.js').ThoughtNode[]}
 */
export const kenThoughtNodes = [
  {
    id: 'ken-thought-001',
    owner: NodeOwners.KEN,
    category: NodeCategories.THOUGHT,
    textSeed: '別の問題が混ざって、一つに見えている',
    tags: ['structure', 'separation', 'clarity'],
    axis: ['structure'],
    triggers: ['どっち', '絡まって', '混乱', 'わからない', '迷って'],
    antiTriggers: ['身体', '感じる', '震え'],
    weight: 0.78,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-thought-002',
    owner: NodeOwners.KEN,
    category: NodeCategories.THOUGHT,
    textSeed: 'ここが引っかかっている。ほどける場所がありそう',
    tags: ['knot', 'bind-point', 'structure'],
    axis: ['structure', 'illumination'],
    triggers: ['噛み合わ', '引っかか', 'ループ', '矛盾'],
    antiTriggers: ['しんどいだけ', '感覚だけ', '言葉にならない'],
    weight: 0.75,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-thought-003',
    owner: NodeOwners.KEN,
    category: NodeCategories.THOUGHT,
    textSeed: '表面の言葉と、その下で本当に起きていることのズレ',
    tags: ['gap', 'undertone', 'dissonance'],
    axis: ['structure', 'presence'],
    triggers: ['建前', '本音', '表では', '裏で'],
    antiTriggers: ['感情だけ', '身体ばかり'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-thought-004',
    owner: NodeOwners.KEN,
    category: NodeCategories.THOUGHT,
    textSeed: 'きれいに切り分けると、大事な部分まで傷つけそうな気配',
    tags: ['friction', 'cutting', 'harm-risk', 'precision'],
    axis: ['structure', 'holding'],
    triggers: ['整理したい', '切り分けたい', 'でも怖い', '傷つきそう'],
    antiTriggers: ['切ればいい', '割り切ろう'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-thought-005',
    owner: NodeOwners.KEN,
    category: NodeCategories.THOUGHT,
    textSeed: '整理できそうだが、整理しきれないものが抵抗している',
    tags: ['tension', 'structure', 'life', 'resistance'],
    axis: ['structure', 'presence'],
    triggers: ['整理できそう', 'でも違う', 'きれいすぎる', '収まらない'],
    antiTriggers: ['形はいらない', '無理やり整える'],
    weight: 0.73,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-thought-006',
    owner: NodeOwners.KEN,
    category: NodeCategories.THOUGHT,
    textSeed: '選ぶ前に、今ある選択肢の形を並べてみる',
    tags: ['map', 'pre-decision', 'layout'],
    axis: ['structure', 'illumination'],
    triggers: ['選べない', 'どっち', '決める前', '比べたい'],
    antiTriggers: ['勢いで決める', '感覚だけで'],
    weight: 0.76,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
