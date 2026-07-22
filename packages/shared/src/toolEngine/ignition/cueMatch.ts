// 気配（共有プールの1グループ）が入力に現れているかの判定（純粋）。
// ignite.ts の v4 ロジック（否定・二重否定・皮肉）をそのまま移植。難問24ケースで100%。
// ロジックは一行も変えないこと（指示書05）。

import type { Tokenizer } from './ignitionTypes';

const SIMPLE_NEG = [
  'ない', 'なかった', 'くなかった', 'ねえ', 'ねぇ', 'じゃない', 'じゃなかった',
  'ではない', 'くない', 'ません', 'ませんでした', '無い', 'なくて', 'なく', 'ぬ',
  'とは言え', 'とは思え',
];
const DOUBLE_NEG = [
  'わけじゃない', 'わけではない', 'わけでもない', 'なくはない', 'ないわけ',
  'ないこともない', 'なくもない', 'ないと言えば', 'ないといえば',
];
// 強い皮肉マーカーのみ（曖昧な "よかったね" 等は入れない＝誤反転を防ぐ）。
const SARCASM = ['（棒）', '(棒)', 'はいはい', 'どうせ', 'せいぜい', 'せっかく', '😇', '🙄', 'へいへい'];

function hasSarcasm(text: string): boolean {
  return SARCASM.some((m) => text.includes(m));
}

/** 同語反復（word が近接して2回以上）を皮肉のサインとして検出。 */
function isRepeated(text: string, word: string): boolean {
  const first = text.indexOf(word);
  if (first === -1) return false;
  const second = text.indexOf(word, first + word.length);
  if (second === -1) return false;
  return second - (first + word.length) <= 2;
}

/** 状態語: 二重否定が直後に来なければ点火。 */
function hitsState(text: string, word: string): boolean {
  let idx = text.indexOf(word);
  while (idx !== -1) {
    const after = text.slice(idx + word.length, idx + word.length + 10);
    if (!DOUBLE_NEG.some((n) => after.startsWith(n))) return true;
    idx = text.indexOf(word, idx + word.length);
  }
  return false;
}

export type CueMatchResult = 'hit' | 'miss' | 'reverse';

/**
 * ある気配が入力に現れているかを判定する。
 * - state: 否定形そのものが状態。二重否定が後続しなければ hit。
 * - pos:   単純否定 → miss／二重否定 → hit に戻す／皮肉 → reverse。
 *
 * tokenizer が渡された場合は、既存 ignite.ts と同じく原形一致を保険として使う
 * （部分一致が無いときのみ hit 扱い）。挙動を変えないこと。
 */
export function matchCue(
  text: string,
  words: string[],
  kind: 'state' | 'pos',
  tokenizer?: Tokenizer,
): CueMatchResult {
  const baseForms = tokenizer ? new Set(tokenizer.toBaseForms(text)) : null;

  for (const word of words) {
    const baseFormHit = baseForms?.has(word) ?? false;

    if (kind === 'state') {
      if (hitsState(text, word)) return 'hit';
      if (baseFormHit && !text.includes(word)) return 'hit';
      continue;
    }

    const sarcasm = hasSarcasm(text) || isRepeated(text, word);
    let idx = text.indexOf(word);
    while (idx !== -1) {
      const after = text.slice(idx + word.length, idx + word.length + 14);
      const negated = SIMPLE_NEG.some((n) => after.startsWith(n));
      if (negated) {
        if (DOUBLE_NEG.some((dn) => after.includes(dn))) return 'hit';
      } else if (sarcasm) {
        return 'reverse';
      } else {
        return 'hit';
      }
      idx = text.indexOf(word, idx + word.length);
    }
    if (baseFormHit && !text.includes(word)) return 'hit';
  }
  return 'miss';
}
