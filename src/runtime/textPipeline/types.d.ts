// src/runtime/textPipeline/types.d.ts
// 入出力契約定義: textPipeline モジュールの型定義

/**
 * bodySignals の external と internal 分離構造
 */
export interface BodySignals {
  external: {
    tension: number;
    softness: number;
    hesitation: number;
    urgency: number;
    warmth: number;
    contraction: number;
  };
  internal: {
    tension: number;
    hesitation: number;
    contraction: number;
  };
}

/**
 * field の状態
 */
export interface Field {
  urgency?: number;
  fragility?: number;
  softness?: number;
  playfulness?: number;
  depth?: number;
}

/**
 * stance の状態
 */
export interface Stance {
  receive?: number;
  illuminate?: number;
  structure?: number;
  guard?: number;
  nudge?: number;
}

/**
 * beliefCore の状態
 */
export interface BeliefCore {
  dominantBeliefAxis?: string;
  activeCoreBeliefs?: Array<{ id: string; strength: number }>;
}

/**
 * beliefTension の状態
 */
export interface BeliefTension {
  dominantTensionAxis?: string;
  totalTensionStrength?: number;
}

/**
 * existence2 の状態
 */
export interface Existence2 {
  identityFeelingText?: string;
  recalledSelfTraits?: string[];
  agentIdentityKey?: string;
}

/**
 * consciousIntent の状態
 */
export interface ConsciousIntent {
  holdBack?: string;
}

/**
 * permission の状態
 */
export interface Permission {
  noHurry?: number;
  noPerformativeHelpfulness?: number;
  noOverExplain?: number;
  allowPartialUncertainty?: number;
  allowSilence?: number;
}

/**
 * latentState の不変スナップショット
 * textPipeline 関数群への入力として使用される
 */
export interface LatentState {
  field?: Field;
  stance?: Stance;
  beliefCore?: BeliefCore;
  beliefTension?: BeliefTension;
  bodySignals?: BodySignals;
  existence2?: Existence2;
  consciousIntent?: ConsciousIntent;
  permission?: Permission;
  previousLatentState?: LatentState;
}

/**
 * textPipeline 関数の出力型
 * 日本語の情景描写、または空の場合は null
 */
export type TextOutput = string | null;

/**
 * buildBodySignals の入力型
 */
export interface BuildBodySignalsInput {
  field: Field;
  beliefTension?: BeliefTension;
  previousLatentState?: LatentState;
}

/**
 * buildBodySignals の出力型
 */
export type BuildBodySignalsOutput = BodySignals;
