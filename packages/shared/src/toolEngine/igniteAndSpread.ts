// 入口関数。text を励起判定 → そのノードを agentId のネットワークに点火 → 活性拡散 → 浮上材料。
//
//   igniteAndSpread("もう何も感じない", "satou") -> どの信念・記憶・感情がどれくらい立ったか

import { spreadActivation, toSurfacedMaterial, DEFAULT_STEPS } from './activationEngine';
import type { SurfacedMaterial } from './engineTypes';
import { getAgentDefinition } from './agents';
import { ignite } from './ignition/ignite';
import { lightTokenizer } from './ignition/lightTokenizer';
import type { Tokenizer } from './ignition/ignitionTypes';

/** 前ターンの余韻がどれだけ残るか（指示書08）。仮の値。 */
const WARMTH_DECAY = 0.3;

export interface IgniteAndSpreadOptions {
  /**
   * 形態素解析（差し替え可能）。
   * 既定は lightTokenizer（辞書なしの活用展開・指示書09の選択肢C）。
   * 端末と Worker のフォールバックで結果がずれないよう、呼び出し側で
   * 渡し忘れても効くように既定値をここに置く。
   * 本物の形態素解析器を入れるときはここを差し替える。
   * 明示的に `null` を渡すと原形化なし（部分一致のみ）になる。
   */
  tokenizer?: Tokenizer | null;
  /** 平衡までのステップ数（既定 20）。 */
  steps?: number;
  /** 前ターンの浮上活性（このエージェント分）。温度の素（指示書08）。 */
  previousActivation?: Record<string, number>;
}

/**
 * 入力テキストを agentId のネットワークで反応させ、浮上材料を返す。
 * 未知の agentId は ignited 空・surfaced は baseline のみ（throw はしない）。
 */
export function igniteAndSpread(
  text: string,
  agentId: string,
  options: IgniteAndSpreadOptions = {},
): SurfacedMaterial {
  const def = getAgentDefinition(agentId);
  if (!def) {
    return { agentId, ignited: [], surfaced: [] };
  }
  // 前ターンの活性を減衰させて温度にする。
  const warmth: Record<string, number> = {};
  if (options.previousActivation) {
    for (const [id, act] of Object.entries(options.previousActivation)) {
      warmth[id] = act * WARMTH_DECAY;
    }
  }
  const tokenizer = options.tokenizer === undefined ? lightTokenizer : options.tokenizer;
  const fired = ignite(text, def.ignition, {
    tokenizer: tokenizer ?? undefined,
    warmth,
  });
  const ignitedIds = [...fired];
  const particles = spreadActivation(
    def.network,
    ignitedIds,
    options.steps ?? DEFAULT_STEPS,
    warmth,
  );
  return toSurfacedMaterial(agentId, ignitedIds, particles);
}
