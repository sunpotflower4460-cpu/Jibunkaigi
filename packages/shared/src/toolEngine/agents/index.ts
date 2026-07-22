// エージェント定義のレジストリ。
//
// ロジック7人・アプリ接続7人（7人体制、指示書02で接続完了）。
// 7人: satou / joe / mina / ray(=bundle rei) / ken / tom / fio。

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

/** 現アプリに接続する concrete エージェント（7人）。 */
export const CONNECTED_AGENT_IDS = ['satou', 'joe', 'mina', 'ray', 'ken', 'tom', 'fio'] as const;

export function getAgentDefinition(agentId: string): AgentDefinition | null {
  return AGENT_DEFINITIONS[agentId] ?? null;
}
