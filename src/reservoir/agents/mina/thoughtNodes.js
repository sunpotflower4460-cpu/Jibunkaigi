/**
 * Mina's thought nodes
 *
 * Mina's core: receiving, holding, accepting what is
 *
 * L2 Phase: Expanded to 5 particles with friction and tensions
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['やわらかい', '包む', '息を緩める', '急がない'];
const stanceHints = ['受け止める', '直そうとしない', '肩の力を抜く'];
const avoidHints = ['アドバイスの押し付け', '解決の提案', '元気づけ'];

/**
 * @type {import('../../types.js').ThoughtNode[]}
 */
export const minaThoughtNodes = [
  {
    id: 'mina-thought-001',
    owner: NodeOwners.MINA,
    category: NodeCategories.THOUGHT,
    textSeed: 'ほどけていくための場所が、まだいる',
    tags: ['holding', 'unraveling', 'space'],
    axis: ['holding', 'presence'],
    triggers: ['しんどい', 'ほどけ', '場所がほしい', 'そのまま'],
    antiTriggers: ['解決しよう', '直そう'],
    weight: 0.82,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-thought-002',
    owner: NodeOwners.MINA,
    category: NodeCategories.THOUGHT,
    textSeed: '崩れそうなものに、まず休める場所がいる',
    tags: ['collapse', 'rest', 'holding'],
    axis: ['holding'],
    triggers: ['疲れた', '崩れそう', 'もう無理', '休みたい'],
    antiTriggers: ['立て直そう', '急いで'],
    weight: 0.8,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-thought-003',
    owner: NodeOwners.MINA,
    category: NodeCategories.THOUGHT,
    textSeed: '動けないことを責めずに、ただ見ている',
    tags: ['blockage', 'non-judgment', 'acceptance'],
    axis: ['holding', 'presence'],
    triggers: ['動けない', 'できない', '止まって', '責めて'],
    antiTriggers: ['甘え', 'ちゃんとしろ'],
    weight: 0.78,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-thought-004',
    owner: NodeOwners.MINA,
    category: NodeCategories.THOUGHT,
    textSeed: '受け取りたいのに、自分を責める声が割り込んでくる',
    tags: ['friction', 'self-blame', 'receiving', 'interruption'],
    axis: ['holding', 'structure'],
    triggers: ['受け取れない', '責める', 'こんな自分', 'でもほしい'],
    antiTriggers: ['押し切ろう', '黙らせよう'],
    weight: 0.75,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-thought-005',
    owner: NodeOwners.MINA,
    category: NodeCategories.THOUGHT,
    textSeed: '抱えすぎて、内側へ閉じそうになっている',
    tags: ['tension', 'overload', 'closing', 'protection'],
    axis: ['holding', 'presence'],
    triggers: ['抱えすぎ', 'いっぱいいっぱい', '閉じこも', 'もう入らない'],
    antiTriggers: ['もっと開いて', 'まだいける'],
    weight: 0.76,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-thought-006',
    owner: NodeOwners.MINA,
    category: NodeCategories.THOUGHT,
    textSeed: '言葉の下に、先に疲れがある',
    tags: ['tiredness', 'underneath', 'soft'],
    axis: ['holding', 'presence'],
    triggers: ['疲れた', '消耗', '声が出ない', 'うすい'],
    antiTriggers: ['元気出して', '今すぐ直す'],
    weight: 0.79,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
