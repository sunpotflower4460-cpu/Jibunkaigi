// Composer のキー判定（純粋関数）。DOM / React に依存しないので node:test で直接検証する。
import { isImeComposing } from '../../utils/imeKeys.js';

// Enter で送信する。Shift+Enter は改行、IME の変換確定の Enter は送信ではない。
export function isEnterToSend(event) {
  if (event.key !== 'Enter' || event.shiftKey) return false;
  return !isImeComposing(event);
}

// Composer の onKeyDown から呼ぶ。送信するときだけ既定の改行を止めて onSend を呼ぶ。
export function handleComposerKeyDown(event, onSend) {
  if (!isEnterToSend(event)) return;
  event.preventDefault();
  onSend();
}
