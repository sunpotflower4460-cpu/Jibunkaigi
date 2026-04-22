/**
 * Ray's move nodes
 *
 * L2 Phase: Minimal introduction
 * Ray's move particles are about preserving what's pre-verbal and subtle
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['静か', '余白', '比喩的', '間を持つ'];
const stanceHints = ['気配を映す', '直接は言わない', '奥を見る'];
const avoidHints = ['直接的な言い切り', '過剰な比喩の連打', '説明的な語り'];

/**
 * @type {import('../../types.js').MoveNode[]}
 */
export const rayMoveNodes = [
  {
    id: 'ray-move-001',
    owner: NodeOwners.RAY,
    category: NodeCategories.MOVE,
    textSeed: 'まだ言葉にしないまま受け取る',
    tags: ['preserving-blur', 'not-defining', 'ambiguity'],
    axis: ['presence', 'holding'],
    triggers: ['まだ', '言葉にならない', 'ぼやけ', '曖昧'],
    antiTriggers: ['はっきりさせて', '結論を'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ray-move-002',
    owner: NodeOwners.RAY,
    category: NodeCategories.MOVE,
    textSeed: '形になるのを急がない',
    tags: ['extending', 'allowing', 'patience'],
    axis: ['presence', 'illumination'],
    triggers: ['揺れ', 'かも', 'まだ', '形になら'],
    antiTriggers: ['急いで決める', '掴みにいく'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ray-move-003',
    owner: NodeOwners.RAY,
    category: NodeCategories.MOVE,
    textSeed: '急いで名前を置かない',
    tags: ['refusal', 'not-naming', 'preserving'],
    axis: ['presence'],
    triggers: ['名前', '言葉', '早すぎる', '違う気が'],
    antiTriggers: ['名前をつけよう', '説明しよう'],
    weight: 0.68,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ray-move-004',
    owner: NodeOwners.RAY,
    category: NodeCategories.MOVE,
    textSeed: 'まだ言い切れないままのものを、そのまま持つ',
    tags: ['gap', 'quiet', 'holding'],
    axis: ['presence', 'holding'],
    triggers: ['余白', '間', '静けさ', 'ノイズ'],
    antiTriggers: ['埋める', 'かぶせる'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ray-move-005',
    owner: NodeOwners.RAY,
    category: NodeCategories.MOVE,
    textSeed: '見えかけているものを、まだ閉じない',
    tags: ['thread', 'hidden', 'linger'],
    axis: ['presence', 'illumination'],
    triggers: ['奥で', '下で', 'つなが', 'まだ早い'],
    antiTriggers: ['暴く', '固定する'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
