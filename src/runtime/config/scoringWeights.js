/**
 * Scoring weights for particle activation
 * Phase P-2: Integration of estimateState axes into activation scoring
 *
 * These weights control how different signals contribute to particle activation.
 */

/**
 * State axis contribution weight
 * Controls how much estimateState's 8 axes influence particle activation
 *
 * Range: 0.0 - 1.0
 * Starting value: 0.35 (moderate influence)
 *
 * The state axes are:
 * - desire, fear, freeze, reach, resignation, selfErasure, shame, unfinished
 *
 * Each particle has a vector with these same axes, and we compute a dot product
 * to determine resonance with the current user state.
 */
export const STATE_AXIS_WEIGHT = 0.35;

/**
 * Trigger match weight
 * How much direct trigger matches contribute to activation
 */
export const TRIGGER_MATCH_WEIGHT = 0.25;

/**
 * Agent affinity weight
 * How much agent ownership (shared vs specific agent) influences activation
 */
export const AGENT_AFFINITY_WEIGHT = 0.15;
export const SHARED_AGENT_AFFINITY = 0.05;
export const OWN_AGENT_AFFINITY = 0.50;
export const OTHER_AGENT_AFFINITY = -0.30;

/**
 * Resonance match weight
 * How much belief/tension axis resonance contributes
 */
export const RESONANCE_MATCH_WEIGHT = 0.15;

/**
 * Body affinity weight
 * How much body signals influence activation (lighter for thoughts, heavier for feelings)
 */
export const BODY_AFFINITY_WEIGHT_THOUGHT = 0.05;
export const BODY_AFFINITY_WEIGHT_FEELING = 0.10;
export const BODY_AFFINITY_WEIGHT_MOVE = 0.08;

/**
 * Proto-meaning match weight
 * How much narrative proto-meaning matching contributes
 */
export const PROTO_MEANING_WEIGHT = 0.08;

/**
 * Anti-trigger penalty
 * How much to reduce score when anti-triggers match
 */
export const ANTI_TRIGGER_PENALTY = -0.3;

/**
 * Base node weight influence
 * How much the node's intrinsic weight property influences final score
 */
export const NODE_WEIGHT_INFLUENCE = 0.2;

/**
 * Minimum activation threshold
 * Particles below this score are not activated
 */
export const MIN_ACTIVATION_THRESHOLD = 0.15;

/**
 * Maximum activated particles per type
 * How many thought/feeling/move particles to activate (before binding/selection)
 */
export const MAX_ACTIVATED_THOUGHTS = 12;
export const MAX_ACTIVATED_FEELINGS = 8;
export const MAX_ACTIVATED_MOVES = 8;
