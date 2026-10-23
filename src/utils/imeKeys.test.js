import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isImeComposing } from './imeKeys.js';

// React の KeyboardEvent と同じ形（素の DOM イベントは nativeEvent に入る）で組み立てる。
function keyEvent({ key = 'Enter', keyCode = 13, isComposing = false } = {}) {
  return { key, keyCode, nativeEvent: { isComposing } };
}

describe('isImeComposing', () => {
  it('通常のキー入力は変換中ではない', () => {
    assert.equal(isImeComposing(keyEvent()), false);
    assert.equal(isImeComposing(keyEvent({ key: 'Escape', keyCode: 27 })), false);
  });

  it('isComposing が立っていれば変換中', () => {
    assert.equal(isImeComposing(keyEvent({ key: 'Escape', keyCode: 27, isComposing: true })), true);
  });

  it('window に直接届いた keydown（素の KeyboardEvent）の isComposing も変換中とする', () => {
    // useFocusTrap の Escape は window の keydown で受けるため、nativeEvent を持たない形でも判定する。
    assert.equal(isImeComposing({ key: 'Escape', keyCode: 27, isComposing: true }), true);
    assert.equal(isImeComposing({ key: 'Escape', keyCode: 27, isComposing: false }), false);
  });

  it('keyCode 229 だけで届くキーも変換中として扱う', () => {
    // 変換確定の keydown で isComposing が立たないブラウザがあるため、keyCode も見る。
    assert.equal(isImeComposing(keyEvent({ keyCode: 229, isComposing: false })), true);
  });
});
