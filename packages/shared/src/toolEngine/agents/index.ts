// エージェント定義のレジストリ。
//
// 方針（決定事項）: ロジックは7人ぶん持ち、アプリ接続は5人。
// マイルストーン1ではサトウのみ登録。残り6人（joe/mina/tom/rei→ray/ken/fio）は順次追加。

import type { AgentNetwork } from '../engineTypes';
import type { AgentIgnition } from '../ignition/ignitionTypes';
import { satoNetwork, satoIgnition } from './sato';

export interface AgentDefinition {
  network: AgentNetwork;
  ignition: AgentIgnition;
}

export const AGENT_DEFINITIONS: Record<string, AgentDefinition> = {
  satou: { network: satoNetwork, ignition: satoIgnition },
};

export function getAgentDefinition(agentId: string): AgentDefinition | null {
  return AGENT_DEFINITIONS[agentId] ?? null;
}
