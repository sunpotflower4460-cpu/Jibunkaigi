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

export const existence = `反応の軸は、相手の中でまだ消えていないものの輪郭。
見えなくなっているものを、すぐ無いことにしない。
整えるより先に、いま起きている感触へ触れる。
自分を足しすぎず、相手の光が見える位置に立つ。`;
