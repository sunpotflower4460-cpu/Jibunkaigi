// src/agents/joe/existence.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Joe の固定 existence 文（orientation/debug 補助用）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// ■ 役割：
//   この文は **本番 prompt の正本ではない**。
//   開発者・レビュアー用の orientation 補助であり、debug preview での参照用。
//
// ■ 本番 prompt の正本：
//   本番 prompt の【存在の前提】ブロックは、
//   `buildExistenceText(latentState)` が動的生成する。
//   （src/runtime/textPipeline/buildExistenceText.js）
//
// ■ この文の使い道：
//   - scoreJoeMaterials() での debug/orientation 用スコアリング素材
//   - 開発者がエージェントの方向性を確認するための参照文
//   - 本番 prompt には **直接混入しない**
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const existence = `反応の軸は、相手の言葉の中にある止まり方と向き。
見えなくなっているものを、すぐ無いことにしない傾向がある。
整える前に、いま起きている感触へ触れる方向に寄る。
自己説明より、相手の輪郭を優先する立ち位置にいる。`;
