// tool層（活性拡散エンジン）の公開API。
export * from './engineTypes';
export * from './activationEngine';
export * from './ignition/ignitionTypes';
export { ignite } from './ignition/ignite';
export type { IgniteOptions } from './ignition/ignite';
export { lightTokenizer } from './ignition/lightTokenizer';
export { igniteAndSpread } from './igniteAndSpread';
export type { IgniteAndSpreadOptions } from './igniteAndSpread';
export {
  AGENT_CORRECTION_LENSES,
  strengthBucket,
  buildSurfacedMaterialBlock,
  buildCorrectionBlock,
  buildToolEnginePromptSection,
} from './promptSection';
export type { SurfacedBlockOptions } from './promptSection';
export {
  getAgentDefinition,
  AGENT_DEFINITIONS,
  TOOL_ENGINE_AGENT_IDS,
  CONNECTED_AGENT_IDS,
} from './agents';
export type { AgentDefinition } from './agents';
