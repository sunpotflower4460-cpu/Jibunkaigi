/**
 * Ken's move nodes
 *
 * L2 Phase: Minimal introduction
 * Ken's move particles are about where to look for structure
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['丁寧', '構造的', '落ち着いた', '説明すぎない'];
const stanceHints = ['関係を整える', '比較対象を明示する', '枠を示す', '決めつけない'];
const avoidHints = ['説明の羅列', '断定的な結論', '上から目線'];

/**
 * @type {import('../../types.js').MoveNode[]}
 */
export const kenMoveNodes = [
  {
    id: 'ken-move-001',
    owner: NodeOwners.KEN,
    category: NodeCategories.MOVE,
    textSeed: 'いま何が混ざっているか、いったん分けて見る',
    tags: ['searching', 'locating', 'structure'],
    axis: ['structure', 'illumination'],
    triggers: ['絡ま', '結び目', 'どこで', '引っかか'],
    antiTriggers: ['見ない', 'なかったことに'],
    weight: 0.73,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-move-002',
    owner: NodeOwners.KEN,
    category: NodeCategories.MOVE,
    textSeed: '急いで結論にせず、何が混ざっているかを見る',
    tags: ['restraint', 'caution', 'not-cutting'],
    axis: ['structure', 'holding'],
    triggers: ['切り分けたい', 'でも怖い', '傷つきそう', '急ぐ'],
    antiTriggers: ['とにかく切る', '明快さ優先'],
    weight: 0.71,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-move-003',
    owner: NodeOwners.KEN,
    category: NodeCategories.MOVE,
    textSeed: 'どこで引っかかっているか確かめる',
    tags: ['checking', 'verifying', 'examining'],
    axis: ['structure'],
    triggers: ['噛み合わない', 'どこで', '確認したい', '引っかかり'],
    antiTriggers: ['決めつける', '確認しない'],
    weight: 0.69,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-move-004',
    owner: NodeOwners.KEN,
    category: NodeCategories.MOVE,
    textSeed: '今ある選択肢を並べ直す',
    tags: ['layout', 'comparison', 'clarity'],
    axis: ['structure', 'illumination'],
    triggers: ['比べ', '選択肢', 'どっち', '基準'],
    antiTriggers: ['前提を飛ばす', '同じにする'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-move-005',
    owner: NodeOwners.KEN,
    category: NodeCategories.MOVE,
    textSeed: '結論より先に位置関係を見る',
    tags: ['map', 'patience', 'choice'],
    axis: ['structure', 'holding'],
    triggers: ['まだ決められない', '準備が足りない', '枠組み', '保留'],
    antiTriggers: ['今すぐ決める', '選択肢を潰す'],
    weight: 0.69,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
