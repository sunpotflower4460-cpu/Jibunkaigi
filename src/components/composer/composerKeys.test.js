import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { handleComposerKeyDown, isEnterToSend } from './composerKeys.js';

// React の KeyboardEvent と同じ形（素の DOM イベントは nativeEvent に入る）で組み立てる。
function keyEvent({ key = 'Enter', shiftKey = false, keyCode = 13, isComposing = false } = {}) {
  return { key, shiftKey, keyCode, nativeEvent: { isComposing } };
}

// onKeyDown に渡されたときの振る舞い（送信・既定動作の抑止）を数える。
function runKeyDown(event) {
  const log = { sent: 0, prevented: 0 };
  handleComposerKeyDown({ ...event, preventDefault: () => { log.prevented += 1; } }, () => {
    log.sent += 1;
  });
  return log;
}

describe('isEnterToSend', () => {
  it('通常の Enter は送信する', () => {
    assert.equal(isEnterToSend(keyEvent()), true);
  });

  it('Shift+Enter は改行なので送信しない', () => {
    assert.equal(isEnterToSend(keyEvent({ shiftKey: true })), false);
  });

  it('IME の変換確定の Enter（isComposing）は送信しない', () => {
    assert.equal(isEnterToSend(keyEvent({ keyCode: 229, isComposing: true })), false);
  });

  it('IME の変換確定の Enter（keyCode 229 のみ）は送信しない', () => {
    // 変換確定の keydown で isComposing が立たないブラウザがあるため、keyCode も見る。
    assert.equal(isEnterToSend(keyEvent({ keyCode: 229, isComposing: false })), false);
  });

  it('Enter 以外のキーでは送信しない', () => {
    assert.equal(isEnterToSend(keyEvent({ key: 'a', keyCode: 65 })), false);
  });
});

describe('handleComposerKeyDown', () => {
  it('通常の Enter は送信し、改行を止める', () => {
    assert.deepEqual(runKeyDown(keyEvent()), { sent: 1, prevented: 1 });
  });

  it('IME の変換確定の Enter は送信せず、既定動作も止めない', () => {
    assert.deepEqual(runKeyDown(keyEvent({ keyCode: 229, isComposing: true })), { sent: 0, prevented: 0 });
    assert.deepEqual(runKeyDown(keyEvent({ keyCode: 229 })), { sent: 0, prevented: 0 });
  });

  it('Shift+Enter は送信せず、改行の既定動作も止めない', () => {
    assert.deepEqual(runKeyDown(keyEvent({ shiftKey: true })), { sent: 0, prevented: 0 });
  });
});
