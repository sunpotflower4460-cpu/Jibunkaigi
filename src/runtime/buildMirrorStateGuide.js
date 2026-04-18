// src/runtime/buildMirrorStateGuide.js
// Mirror 専用の状態ガイド生成
// Mirror が「場の重力」をどう映すべきかを示す短いガイドを返す
//
// De-templating Pilot: 「返答の型」指示を削除し、知覚の焦点だけを渡す

/**
 * Mirror 専用の状態ガイドを生成する
 * @param {object} signals - selectMirrorSignals の出力
 * @returns {string} 状態ガイド（2-5行程度）
 */
export const buildMirrorStateGuide = (signals = {}) => {
  const { mainConflict = '', repeatedPattern = '', unresolvedPoint = '' } = signals;

  // Mirror は要約せず、場の重力と未解決点を映す
  // 「どう返すか」ではなく「何に反応しやすいか」を伝える

  const hasStrongConflict = mainConflict.includes('割れ') || mainConflict.includes('引') || mainConflict.includes('同時');
  const hasRepeatedPattern = repeatedPattern && !repeatedPattern.includes('まだ強い反復は少ない');
  const hasOpenQuestion = unresolvedPoint.includes('開いたまま') || unresolvedPoint.includes('開いている') || unresolvedPoint.includes('閉じていない');

  if (hasStrongConflict && hasOpenQuestion) {
    return [
      '- 最優先: 葛藤の両側を勝敗化せず、どちらもまだ残っていることを映す。',
      '- 見え方: どちらかを選ばせようとせず、両方が残っている重力を静かに見せる。',
    ].join('\n');
  }

  if (hasRepeatedPattern) {
    return [
      '- 最優先: 何度か繰り返されている流れを、評価せずに映す。',
      '- 見え方: 同じ場所に戻る感触を、逃避としてではなく、まだ閉じきれていないものの証拠として扱う。',
    ].join('\n');
  }

  if (hasOpenQuestion) {
    return [
      '- 最優先: まだ閉じていない論点を、急いで閉じようとせず映す。',
      '- 見え方: 開いたままでいいものがあることを静かに示す。',
    ].join('\n');
  }

  return [
    '- 最優先: 場の底にある感情と、そこから生まれている傾きを映す。',
    '- 見え方: 要約ではなく、今ここに残っている重力を静かに見せる。',
  ].join('\n');
};
