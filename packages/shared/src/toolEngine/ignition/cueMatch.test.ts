import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchCue } from './cueMatch.ts';

const STRONG_WORDS = ['大丈夫', 'だいじょうぶ', '平気'];

test("matchCue('大丈夫', 強がりの語, 'pos') → 'hit'", () => {
  assert.equal(matchCue('大丈夫', STRONG_WORDS, 'pos'), 'hit');
});

test("matchCue('大丈夫じゃない', …) → 'miss'", () => {
  assert.equal(matchCue('大丈夫じゃない', STRONG_WORDS, 'pos'), 'miss');
});

test("matchCue('はいはい大丈夫大丈夫', …) → 'reverse'", () => {
  assert.equal(matchCue('はいはい大丈夫大丈夫', STRONG_WORDS, 'pos'), 'reverse');
});

test("matchCue('大丈夫じゃないわけじゃない', …) → 'hit'（二重否定で肯定に戻る）", () => {
  assert.equal(matchCue('大丈夫じゃないわけじゃない', STRONG_WORDS, 'pos'), 'hit');
});
