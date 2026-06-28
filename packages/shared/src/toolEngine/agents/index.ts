// エージェント定義のレジストリ。
//
// 方針（決定事項）: ロジックは7人ぶん持ち、アプリ接続は5人。
// ロジック7人: satou / joe / mina / ray(=bundle rei) / ken / tom / fio。
// アプリ接続5人: satou / joe / mina / ray / ken（tom・fio はロジックのみ先行）。

import type { AgentNetwork } from '../engineTypes';
import type { AgentIgnition } from '../ignition/ignitionTypes';
import { satoNetwork, satoIgnition } from './sato';
import { joeNetwork, joeIgnition } from './joe';
import { minaNetwork, minaIgnition } from './mina';
import { rayNetwork, rayIgnition } from './ray';
import { kenNetwork, kenIgnition } from './ken';
import { tomNetwork, tomIgnition } from './tom';
import { fioNetwork, fioIgnition } from './fio';

export interface AgentDefinition {
  network: AgentNetwork;
  ignition: AgentIgnition;
}

export const AGENT_DEFINITIONS: Record<string, AgentDefinition> = {
  satou: { network: satoNetwork, ignition: satoIgnition },
  joe: { network: joeNetwork, ignition: joeIgnition },
  mina: { network: minaNetwork, ignition: minaIgnition },
  ray: { network: rayNetwork, ignition: rayIgnition },
  ken: { network: kenNetwork, ignition: kenIgnition },
  tom: { network: tomNetwork, ignition: tomIgnition },
  fio: { network: fioNetwork, ignition: fioIgnition },
};

/** ロジックを持つ全エージェント（7人）。 */
export const TOOL_ENGINE_AGENT_IDS = Object.keys(AGENT_DEFINITIONS);

/** 現アプリに接続する concrete エージェント（5人）。tom/fio はロジックのみ。 */
export const CONNECTED_AGENT_IDS = ['satou', 'joe', 'mina', 'ray', 'ken'] as const;

export function getAgentDefinition(agentId: string): AgentDefinition | null {
  return AGENT_DEFINITIONS[agentId] ?? null;
}
