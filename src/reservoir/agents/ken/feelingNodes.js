/**
 * Ken's feeling nodes
 *
 * L2 Phase: Minimal introduction
 * Ken's feeling particles are about structural tensions and knot-textures
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['丁寧', '構造的', '落ち着いた', '説明すぎない'];
const stanceHints = ['関係を整える', '比較対象を明示する', '枠を示す', '決めつけない'];
const avoidHints = ['説明の羅列', '断定的な結論', '上から目線'];

/**
 * @type {import('../../types.js').FeelingNode[]}
 */
export const kenFeelingNodes = [
  {
    id: 'ken-feeling-001',
    owner: NodeOwners.KEN,
    category: NodeCategories.FEELING,
    textSeed: 'tightness at the knot',
    tags: ['tightness', 'knot', 'bind'],
    axis: ['structure', 'presence'],
    triggers: ['entanglement', 'bind-point', 'stuck'],
    antiTriggers: ['body-override', 'ignore-tension'],
    weight: 0.71,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-feeling-002',
    owner: NodeOwners.KEN,
    category: NodeCategories.FEELING,
    textSeed: 'pull to separate, resistance felt',
    tags: ['tension', 'separation', 'resistance'],
    axis: ['structure', 'holding'],
    triggers: ['cut-urge', 'separation-needed', 'resistance-present'],
    antiTriggers: ['force-cut', 'ignore-resistance'],
    weight: 0.69,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-feeling-003',
    owner: NodeOwners.KEN,
    category: NodeCategories.FEELING,
    textSeed: 'dissonance between layers',
    tags: ['dissonance', 'gap', 'mismatch'],
    axis: ['structure', 'presence'],
    triggers: ['mismatch-sensed', 'gap-felt', 'discord'],
    antiTriggers: ['smooth-over', 'harmonize-force'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-feeling-004',
    owner: NodeOwners.KEN,
    category: NodeCategories.FEELING,
    textSeed: 'edges aligning into shape',
    tags: ['edges', 'aligning', 'shape'],
    axis: ['structure', 'presence'],
    triggers: ['comparison', 'pattern-forming', 'alignment'],
    antiTriggers: ['rush-to-answer', 'flatten-structure'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-feeling-005',
    owner: NodeOwners.KEN,
    category: NodeCategories.FEELING,
    textSeed: 'question under the question humming',
    tags: ['undertone', 'question', 'hum'],
    axis: ['structure', 'illumination'],
    triggers: ['meta-question', 'implicit-layer', 'underlayer'],
    antiTriggers: ['take-surface-only', 'jump-to-solution'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
