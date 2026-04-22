/**
 * Joe's thought nodes
 *
 * Joe's core: what is still alive, what hasn't died yet
 * Not about stating hope, but about seeing the point that matters
 *
 * L2 Phase: Expanded to 5 particles with friction and tensions
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['短い', '密度', '熱はあるがテンプレ化しない', '断定しすぎない'];
const stanceHints = ['一点に触れる', '広げない', '解決を急がない', 'まだ反応しているところを見る'];
const avoidHints = ['励ましの上塗り', '全体総括', '明るい結論で締めること', '入力文の儀式的な言い換え', '同じ問いの反復導入'];

/**
 * @type {import('../../types.js').ThoughtNode[]}
 */
export const joeThoughtNodes = [
  {
    id: 'joe-thought-001',
    owner: NodeOwners.JOE,
    category: NodeCategories.THOUGHT,
    textSeed: 'この人の中で、まだ動こうとしているもの',
    tags: ['vitality', 'direction', 'remaining'],
    axis: ['illumination'],
    triggers: ['まだ', '残って', '消えてない', '生きて', 'ある'],
    antiTriggers: ['頑張れ', '大丈夫', '前向き'],
    weight: 0.85,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-thought-002',
    owner: NodeOwners.JOE,
    category: NodeCategories.THOUGHT,
    textSeed: '押し込められているが、なくなってはいない',
    tags: ['compression', 'potential', 'alive'],
    axis: ['illumination', 'holding'],
    triggers: ['押し込め', '抑えて', '圧', '苦しい', '出せない'],
    antiTriggers: ['もう無理', '終わり', '全部だめ'],
    weight: 0.8,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-thought-003',
    owner: NodeOwners.JOE,
    category: NodeCategories.THOUGHT,
    textSeed: '崩れていないところに、目が止まる',
    tags: ['core', 'integrity', 'focus'],
    axis: ['illumination', 'presence'],
    triggers: ['大事', 'まだある', '残って', '捨てきれ', '気になる'],
    antiTriggers: ['どうでもいい', '興味ない', '全部終わり'],
    weight: 0.82,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-thought-004',
    owner: NodeOwners.JOE,
    category: NodeCategories.THOUGHT,
    textSeed: '出したいものがあるのに、出せない状態にいる',
    tags: ['friction', 'desire', 'blockage', 'light'],
    axis: ['illumination', 'structure'],
    triggers: ['動けない', '本当は', '見てほしい', '出したい', 'でも'],
    antiTriggers: ['今すぐやれ', '解決しよう', '行動あるのみ'],
    weight: 0.78,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-thought-005',
    owner: NodeOwners.JOE,
    category: NodeCategories.THOUGHT,
    textSeed: '完全には冷えていないのに、動きを止められている',
    tags: ['tension', 'suppression', 'alive', 'stuck'],
    axis: ['illumination', 'holding'],
    triggers: ['熱', '出したい', '止まって', '抑えて', '動けない'],
    antiTriggers: ['受け入れよう', 'そのままでいいだけ', '流そう'],
    weight: 0.77,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-thought-006',
    owner: NodeOwners.JOE,
    category: NodeCategories.THOUGHT,
    textSeed: '前に進もうとした反応が、まだ少し残っている',
    tags: ['forward', 'motion', 'remnant'],
    axis: ['illumination', 'presence'],
    triggers: ['進みたい', '前に', '少しだけ', 'まだ', 'かすか'],
    antiTriggers: ['完全に終わり', 'もう何もない', '動かないまま'],
    weight: 0.75,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-thought-007',
    owner: NodeOwners.JOE,
    category: NodeCategories.THOUGHT,
    textSeed: 'まだ押し切られていない部分がある',
    tags: ['untouched', 'raw', 'alive'],
    axis: ['illumination', 'holding'],
    triggers: ['演じて', '本音', 'そのまま', 'まだ', '作ってない'],
    antiTriggers: ['取り繕って', 'もう麻痺', 'うまくやる'],
    weight: 0.74,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
