/**
 * Reservoir types for 顕在層 v0.1
 *
 * This file defines the types for thought/feeling/move particles (nodes)
 * that will be used in the surface layer's activate/bind/select pipeline.
 *
 * IMPORTANT PRINCIPLES:
 * - Nodes are NOT complete sentences or final responses
 * - Nodes are "seeds of thought" - what catches attention, what remains open
 * - Each node has an owner (shared or agent-specific)
 * - antiTriggers are included from the start for future activate implementation
 */

// IMPORTANT: tonalHints / stanceHints / avoidHints は、activate/select stage での
// 重み計算・優先順位調整に内部で使う。LLM への文字列として渡してはならない。
// これらは "外からの指示" ではなく "粒子の内部プロパティ" である。

/**
 * NodeOwner type - identifies who owns this node
 * @typedef {'shared' | 'joe' | 'ken' | 'mina' | 'ray' | 'satou' | 'mirror'} NodeOwner
 */

/**
 * BaseNode - common fields for all node types
 * @typedef {Object} BaseNode
 * @property {string} id - Unique identifier for this node
 * @property {NodeOwner} owner - Who owns this node (shared or specific agent)
 * @property {string} textSeed - The seed text (NOT a complete utterance)
 * @property {string[]} tags - Tags for categorization
 * @property {string[]} axis - Axes this node relates to (e.g., 'illumination', 'structure')
 * @property {string[]} triggers - Conditions that activate this node
 * @property {string[]} [antiTriggers] - Conditions that suppress this node (used in activate phase)
 * @property {number} weight - Base weight for this node (0-1)
 * @property {string[]} [relationIds] - IDs of related nodes
 * @property {string[]} [tonalHints] - Tonal quality hints (for internal activate/select weighting, NOT for LLM)
 * @property {string[]} [stanceHints] - Stance hints (for internal activate/select weighting, NOT for LLM)
 * @property {string[]} [avoidHints] - What this particle naturally avoids (for internal filter, NOT for LLM)
 */

/**
 * ThoughtNode - represents a thought particle
 * @typedef {BaseNode & {category: 'thought'}} ThoughtNode
 */

/**
 * FeelingNode - represents a feeling particle
 * @typedef {BaseNode & {category: 'feeling'}} FeelingNode
 */

/**
 * MoveNode - represents a move/direction particle
 * @typedef {BaseNode & {category: 'move'}} MoveNode
 */

/**
 * NodeRelation - defines relationships between nodes
 * @typedef {Object} NodeRelation
 * @property {string} id - Unique identifier for this relation
 * @property {string} from - Source node ID
 * @property {string} to - Target node ID
 * @property {'supports' | 'softens' | 'tensions_with' | 'grounds' | 'extends'} relationType - Type of relationship
 * @property {number} weight - Strength of this relation (0-1)
 */

export const NodeOwners = {
  SHARED: 'shared',
  JOE: 'joe',
  KEN: 'ken',
  MINA: 'mina',
  RAY: 'ray',
  SATOU: 'satou',
  MIRROR: 'mirror',
};

export const RelationTypes = {
  SUPPORTS: 'supports',
  SOFTENS: 'softens',
  TENSIONS_WITH: 'tensions_with',
  GROUNDS: 'grounds',
  EXTENDS: 'extends',
};

export const NodeCategories = {
  THOUGHT: 'thought',
  FEELING: 'feeling',
  MOVE: 'move',
};
