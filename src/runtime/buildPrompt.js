// src/runtime/buildPrompt.js
// 互換レイヤー: 旧 buildPrompt.js から新しい分離済みビルダーへの薄い委譲。

export { MAX_INTERNAL_FRAME_LINES, selectRelevantInternalBias } from './buildPromptHelpers.js';
export {
  scoreJoeMaterials,
  buildJoeBiasPack,
  buildJoeSystemPrompt,
  buildJoeUserPrompt,
} from './prompts/joe.js';
export { buildJoeDebugPreview } from './debug/joeDebugPreview.js';
