// IME の変換中・変換確定に伴うキー入力かどうか。DOM / React に依存しないので node:test で直接検証する。
// 変換確定の keydown には isComposing が立つブラウザと、keyCode 229 だけで届くブラウザがあるため、両方を見る。
// React の合成イベントは nativeEvent に素のイベントを持ち、window に直接届いた素のイベントは isComposing を直接持つ。
// Enter の確定だけでなく、変換の取り消しになる Escape にも同じ判定を使う。
export function isImeComposing(event) {
  return Boolean(event.isComposing || event.nativeEvent?.isComposing) || event.keyCode === 229;
}
