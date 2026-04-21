/**
 * Shared thought nodes - accessible by all agents
 *
 * These are thought particles that any agent can use.
 * They represent common patterns of attention, curiosity, or holding.
 *
 * IMPORTANT:
 * - These are NOT complete responses
 * - These are "seeds" - what catches attention, what to protect
 * - textSeed should be brief and seed-like, not a full sentence
 *
 * Phase 0: Start with ~5 core thought nodes
 * User will expand this later with more specific particles
 */

import { NodeOwners, NodeCategories } from '../types.js';

const tonalHints = ['中立的', '場として当然'];
const stanceHints = ['そこにある', '動かさない'];
const avoidHints = ['意図を付け加える'];

/**
 * @type {import('../types.js').ThoughtNode[]}
 */
export const sharedThoughtNodes = [
  {
    id: 'shared-thought-001',
    owner: NodeOwners.SHARED,
    category: NodeCategories.THOUGHT,
    textSeed: '比べているうちに、こぼれていくものがある',
    tags: ['comparison', 'loss', 'measure'],
    axis: ['structure', 'holding'],
    triggers: ['比べ', '比較', '足りない', '劣って'],
    antiTriggers: ['気にしすぎ', '考えすぎ'],
    weight: 0.75,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'shared-thought-002',
    owner: NodeOwners.SHARED,
    category: NodeCategories.THOUGHT,
    textSeed: '痛みが、何かを守っている',
    tags: ['protection', 'pain', 'care'],
    axis: ['holding', 'presence'],
    triggers: ['抵抗', '張りつめ', '守ら', '防い'],
    antiTriggers: ['気のせい', '手放して'],
    weight: 0.78,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'shared-thought-003',
    owner: NodeOwners.SHARED,
    category: NodeCategories.THOUGHT,
    textSeed: '早く閉じたくなる。何に追われているのか',
    tags: ['urgency', 'closure', 'pressure'],
    axis: ['structure'],
    triggers: ['早く', 'すぐ', '結論', '答え'],
    antiTriggers: ['急がなくて', '落ち着いて'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'shared-thought-004',
    owner: NodeOwners.SHARED,
    category: NodeCategories.THOUGHT,
    textSeed: 'ひとつではなく、二つ重なった問いかもしれない',
    tags: ['doubling', 'complexity', 'layers'],
    axis: ['structure', 'illumination'],
    triggers: ['混乱', '絡ま', 'ややこし', 'わから'],
    antiTriggers: ['単純', 'はっきりしすぎ'],
    weight: 0.68,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'shared-thought-005',
    owner: NodeOwners.SHARED,
    category: NodeCategories.THOUGHT,
    textSeed: 'まだ開いたままでいたいものがある',
    tags: ['openness', 'unresolved', 'incompleteness'],
    axis: ['holding', 'presence'],
    triggers: ['まだ', '決めきれ', '閉じたくない', '途中'],
    antiTriggers: ['もう終わり', '結論で'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'shared-thought-006',
    owner: NodeOwners.SHARED,
    category: NodeCategories.THOUGHT,
    textSeed: 'まだ収まりきっていないものがある',
    tags: ['unsettled', 'moving', 'open'],
    axis: ['presence', 'holding'],
    triggers: ['落ち着か', '揺れて', '定まら', 'ざわ'],
    antiTriggers: ['もう決まった', '片づけて'],
    weight: 0.71,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'shared-thought-007',
    owner: NodeOwners.SHARED,
    category: NodeCategories.THOUGHT,
    textSeed: '埋めなくていい空きがある',
    tags: ['space', 'rest', 'allowance'],
    axis: ['presence', 'holding'],
    triggers: ['沈黙', '間', '余白', '言えない'],
    antiTriggers: ['何か言わなきゃ', '埋めよう'],
    weight: 0.69,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'shared-thought-008',
    owner: NodeOwners.SHARED,
    category: NodeCategories.THOUGHT,
    textSeed: 'まだ言葉を持っていないものがある',
    tags: ['preverbal', 'unknown', 'emerging'],
    axis: ['illumination', 'presence'],
    triggers: ['言葉に', 'うまく言え', '名前', 'まだ'],
    antiTriggers: ['はっきり言って', '説明して'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
