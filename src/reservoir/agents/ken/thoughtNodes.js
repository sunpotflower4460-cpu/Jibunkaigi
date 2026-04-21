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
    textSeed: '問いが絡んでいる。どれがどれか',
    tags: ['structure', 'separation', 'clarity'],
    axis: ['structure'],
    triggers: ['confusion', 'multiple-layers', 'entanglement'],
    antiTriggers: ['body-foregrounded', 'raw-feeling-dominant'],
    weight: 0.78,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-thought-002',
    owner: NodeOwners.KEN,
    category: NodeCategories.THOUGHT,
    textSeed: '結び目の位置がある。どこで噛んでいるか',
    tags: ['knot', 'bind-point', 'structure'],
    axis: ['structure', 'illumination'],
    triggers: ['stuck-point', 'contradiction', 'loop'],
    antiTriggers: ['somatic-intensity', 'pre-verbal'],
    weight: 0.75,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-thought-003',
    owner: NodeOwners.KEN,
    category: NodeCategories.THOUGHT,
    textSeed: '表の言葉と、下を流れているものが少し違う',
    tags: ['gap', 'undertone', 'dissonance'],
    axis: ['structure', 'presence'],
    triggers: ['mismatch', 'surface-vs-depth', 'stated-vs-felt'],
    antiTriggers: ['body-overwhelm'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-thought-004',
    owner: NodeOwners.KEN,
    category: NodeCategories.THOUGHT,
    textSeed: '切り分けたいが、切ると生きたものまで削れそうだ',
    tags: ['friction', 'cutting', 'harm-risk', 'precision'],
    axis: ['structure', 'holding'],
    triggers: ['cut-urge', 'sever-risk', 'conflict-in-clarity'],
    antiTriggers: ['force-separate', 'cut-regardless'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-thought-005',
    owner: NodeOwners.KEN,
    category: NodeCategories.THOUGHT,
    textSeed: '地図はできかけているが、まだ生の感触が抵抗している',
    tags: ['tension', 'structure', 'life', 'resistance'],
    axis: ['structure', 'presence'],
    triggers: ['structure-vs-life', 'form-resisted', 'too-clean-risk'],
    antiTriggers: ['give-up-structure', 'force-form'],
    weight: 0.73,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-thought-006',
    owner: NodeOwners.KEN,
    category: NodeCategories.THOUGHT,
    textSeed: '決める前に、配置を見る必要がある',
    tags: ['map', 'pre-decision', 'layout'],
    axis: ['structure', 'illumination'],
    triggers: ['choice-ahead', 'need-map', 'compare-options'],
    antiTriggers: ['snap-judgment', 'go-with-feel-only'],
    weight: 0.76,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
