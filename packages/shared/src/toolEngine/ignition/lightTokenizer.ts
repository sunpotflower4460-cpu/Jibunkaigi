// 辞書を持たない軽量な原形化（指示書09・選択肢C）。
//
// なぜ kuromoji ではないか:
//   kuromoji は 18MB の辞書を必要とし、Cloudflare Worker の 10MB 制限を超える。
//   端末側（React Native / Hermes）で動かす道も調べたが、本家は RN 未対応のまま
//   （2017年からの未解決 issue）、唯一のフォークもコミット1つ・ドキュメントなしで
//   実運用に耐えない。ネイティブ形態素解析器に切り替えるには Expo Go を離れる
//   必要があり、この機能の範囲を超える。
//
// ここで解く問題はもっと狭い。CUE_POOL の語はすでに大半が語幹まで削られていて
// （'傷つ' / '眠れな' / '諦め'）、部分一致でほとんどの活用を拾えている。
// 取りこぼすのは「原形そのものが登録されている語」の活用形だけ:
//
//   「しんどすぎて」→ 'しんどい' に部分一致しない
//   「心が動かなかった」→ '心が動かない' に部分一致しない
//
// そこで汎用の形態素解析はせず、CUE_POOL の語から活用形を先に展開しておき、
// それが本文に現れたら元の語を原形として返す。辞書も依存も要らず、
// 出力は必ず実在の cue 語なので、解析ノイズによる誤点火が原理的に起きない。
//
// 本物の形態素解析器を入れる判断がついたら、Tokenizer インターフェースの
// 実装を差し替えるだけで置き換えられる。

import type { Tokenizer } from './ignitionTypes';
import { CUE_POOL } from './cuePool';

/**
 * イ形容詞・および「〜ない」型（動詞の否定形）の活用語尾。
 *
 * 否定を作る語尾（く / くない / なく）は入れない。
 * matchCue は原形一致を無条件の hit として扱うため、否定形から原形へ戻すと
 * 「しんどくない」が「しんどい」として点火してしまう。否定の判定は
 * cueMatch.ts の責務であり、ここが横取りしてはいけない。
 */
const I_ADJ_SUFFIXES = ['かった', 'くて', 'すぎ', 'ければ'] as const;

/** 展開した活用形の直後がこれらなら否定なので、原形化しない（「しんどすぎない」） */
const NEGATED_AFTER = /^(ない|なかった|なく|ならない|ず|ぬ|ません|ませんでした)/;

/** 原形 → その活用形（否定を作らないものだけ） */
function expandVariants(word: string): string[] {
  // 「〜い」で終わる語だけを対象にする。イ形容詞（しんどい）と、
  // 動詞の否定形（動かない・見たくない）の両方がここに入る。
  if (!word.endsWith('い') || word.length < 3) return [];
  const stem = word.slice(0, -1);
  return I_ADJ_SUFFIXES.map((suffix) => stem + suffix);
}

/** 活用形 → 原形 の対応表。CUE_POOL から一度だけ組み立てる。 */
function buildVariantIndex(): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const group of CUE_POOL) {
    for (const word of group.words) {
      for (const variant of expandVariants(word)) {
        // 活用形が別の cue 語そのものと衝突する場合があるため（'つらすぎ' 等）、
        // 原形は配列で持って取りこぼさない。
        const bases = index.get(variant);
        if (bases) {
          if (!bases.includes(word)) bases.push(word);
        } else {
          index.set(variant, [word]);
        }
      }
    }
  }
  return index;
}

const VARIANT_INDEX = buildVariantIndex();

/**
 * 辞書を使わない Tokenizer。
 * 本文に現れた活用形から、対応する原形（= CUE_POOL の語）を返す。
 */
export const lightTokenizer: Tokenizer = {
  toBaseForms(text: string): string[] {
    const found = new Set<string>();
    for (const [variant, bases] of VARIANT_INDEX) {
      let idx = text.indexOf(variant);
      while (idx !== -1) {
        const after = text.slice(idx + variant.length);
        if (!NEGATED_AFTER.test(after)) {
          for (const base of bases) found.add(base);
          break;
        }
        idx = text.indexOf(variant, idx + variant.length);
      }
    }
    return [...found];
  },
};
