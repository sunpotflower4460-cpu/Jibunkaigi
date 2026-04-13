// src/runtime/prompts/joe.js
// ジョーのプロンプトテンプレート。
// 既存の buildPrompt.js をそのまま委譲する（後方互換のため）。

export {
  buildJoeSystemPrompt,
  buildJoeUserPrompt,
  scoreJoeMaterials,
  buildJoeBiasPack,
} from '../buildPrompt.js';
