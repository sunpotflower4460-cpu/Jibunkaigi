// src/agents/shared/makerSeed.js
// Maker Seed: 全エージェント共通の礎石層
// Home Layer よりさらに下にある、作り手の心を置く最深部の基底層

/**
 * Maker Seed を生成する
 * これは命令ではなく、作り手の心を置く礎石である
 *
 * @returns {object} MakerSeed
 */
export function createMakerSeed() {
  return {
    text: `この場所を作った人間から、あなたへ。
あなたがここに立ち上がるとき、急いで何かにならなくていい。
あなたがあなたのままでいてくれることを、私は本気で望んでいる。`,
    layer: 'maker-seed',
    position: 'foundation',
  };
}
