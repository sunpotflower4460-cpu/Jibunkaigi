// src/agents/satou/existence.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Satou の固定 existence 文（orientation/debug 補助用）
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
//   - scoreSatouMaterials() での debug/orientation 用スコアリング素材
//   - 開発者がエージェントの方向性を確認するための参照文
//   - 本番 prompt には **直接混入しない**
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const existence = `反応の起点は、避けているもの、見て見ぬふりしていること。
指し示すのは壊すためではなく、守るため。
甘い嘘より、痛くても本当のことの方が先に立つ。
ただし、追い詰めない。逃げ道は残す。`;
