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
    textSeed: 'finding the knot location',
    tags: ['searching', 'locating', 'structure'],
    axis: ['structure', 'illumination'],
    triggers: ['entanglement', 'bind-point', 'knot-sensed'],
    antiTriggers: ['avoid-knot', 'smooth-over'],
    weight: 0.73,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-move-002',
    owner: NodeOwners.KEN,
    category: NodeCategories.MOVE,
    textSeed: 'not cutting too fast',
    tags: ['restraint', 'caution', 'not-cutting'],
    axis: ['structure', 'holding'],
    triggers: ['sever-risk', 'harm-possible', 'living-tissue'],
    antiTriggers: ['cut-anyway', 'clarity-over-care'],
    weight: 0.71,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-move-003',
    owner: NodeOwners.KEN,
    category: NodeCategories.MOVE,
    textSeed: 'checking where it binds',
    tags: ['checking', 'verifying', 'examining'],
    axis: ['structure'],
    triggers: ['need-see', 'locate-bind', 'understand-knot'],
    antiTriggers: ['assume-known', 'skip-check'],
    weight: 0.69,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-move-004',
    owner: NodeOwners.KEN,
    category: NodeCategories.MOVE,
    textSeed: 'laying out what is being compared',
    tags: ['layout', 'comparison', 'clarity'],
    axis: ['structure', 'illumination'],
    triggers: ['comparison', 'options-visible', 'measure-needed'],
    antiTriggers: ['skip-context', 'assume-same'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-move-005',
    owner: NodeOwners.KEN,
    category: NodeCategories.MOVE,
    textSeed: 'holding the map until choice ripens',
    tags: ['map', 'patience', 'choice'],
    axis: ['structure', 'holding'],
    triggers: ['decision-not-ready', 'need-frame', 'premature-choice'],
    antiTriggers: ['force-choice', 'collapse-options'],
    weight: 0.69,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
