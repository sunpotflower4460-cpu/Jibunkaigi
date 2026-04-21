// src/runtime/buildPrompt.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 【互換レイヤー】旧 buildPrompt.js から新しい分離済みビルダーへの薄い委譲
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// ■ 役割：
//   このファイルは、P-1 以前の旧 API からの後方互換性を維持するための
//   **export proxy** として機能する。
//
// ■ 位置づけ：
//   - 実質的な prompt 構築ロジックは、各エージェント固有 builder に移行済み
//     → src/runtime/prompts/joe.js
//     → src/runtime/prompts/ray.js
//     → src/runtime/prompts/ken.js
//     → src/runtime/prompts/mina.js
//     → src/runtime/prompts/satou.js
//   - このファイルは、それらへの re-export のみを行う
//
// ■ 新規コードでの使い方：
//   - **推奨**: buildAgentPrompt.js の buildAgentSystemPrompt / buildAgentUserPrompt を直接使う
//   - **非推奨**: buildPrompt.js から export された関数を使う（後方互換のみ）
//
// ■ P系正本入口：
//   P系（Phase P-1 以降）の prompt 構築の正本入口は、
//   **src/runtime/buildAgentPrompt.js** である。
//   このファイルは、旧コードからの移行をスムーズにするための補助的な役割。

export { MAX_INTERNAL_FRAME_LINES, selectRelevantInternalBias } from './buildPromptHelpers.js';
export {
  scoreJoeMaterials,
  buildJoeBiasPack,
  buildJoeSystemPrompt,
  buildJoeUserPrompt,
} from './prompts/joe.js';
export { buildJoeDebugPreview } from './debug/joeDebugPreview.js';
