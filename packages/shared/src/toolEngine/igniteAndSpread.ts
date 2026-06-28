// 入口関数。text を励起判定 → そのノードを agentId のネットワークに点火 → 活性拡散 → 浮上材料。
//
//   igniteAndSpread("もう何も感じない", "satou") -> どの信念・記憶・感情がどれくらい立ったか

import { spreadActivation, toSurfacedMaterial, DEFAULT_STEPS } from './activationEngine';
import type { SurfacedMaterial } from './engineTypes';
import { getAgentDefinition } from './agents';
import { ignite } from './ignition/ignite';
import type { Tokenizer } from './ignition/ignitionTypes';

export interface IgniteAndSpreadOptions {
  /** 形態素解析（差し替え可能）。Worker 側で kuromoji を注入する想定。 */
  tokenizer?: Tokenizer;
  /** 平衡までのステップ数（既定 20）。 */
  steps?: number;
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
  const fired = ignite(text, def.ignition, { tokenizer: options.tokenizer });
  const ignitedIds = [...fired];
  const particles = spreadActivation(
    def.network,
    ignitedIds,
    options.steps ?? DEFAULT_STEPS,
  );
  return toSurfacedMaterial(agentId, ignitedIds, particles);
}
