// tool層（活性拡散エンジン）の公開API。
export * from './engineTypes';
export * from './activationEngine';
export * from './ignition/ignitionTypes';
export { ignite } from './ignition/ignite';
export type { IgniteOptions } from './ignition/ignite';
export { igniteAndSpread } from './igniteAndSpread';
export type { IgniteAndSpreadOptions } from './igniteAndSpread';
export { getAgentDefinition, AGENT_DEFINITIONS } from './agents';
export type { AgentDefinition } from './agents';
