import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isEscapeToClose } from './useFocusTrap.js';

// window の keydown に届く素の KeyboardEvent と同じ形で組み立てる。
function keydown({ key = 'Escape', keyCode = 27, isComposing = false } = {}) {
  return { key, keyCode, isComposing };
}

describe('isEscapeToClose', () => {
  it('通常の Escape はダイアログを閉じる', () => {
    assert.equal(isEscapeToClose(keydown()), true);
  });

  it('IME の変換中の Escape は変換の取り消しなので、ダイアログを閉じない', () => {
    assert.equal(isEscapeToClose(keydown({ isComposing: true, keyCode: 229 })), false);
    assert.equal(isEscapeToClose(keydown({ keyCode: 229 })), false);
  });

  it('Escape 以外のキーでは閉じない', () => {
    assert.equal(isEscapeToClose(keydown({ key: 'Enter', keyCode: 13 })), false);
  });
});
