/**
 * 会話レコードを保存するときの本文の扱い（純粋）。
 *
 * saveSession は本文 (messages) を持たない更新として扱う。呼び出し側が messages: [] を渡しても、
 * 既に保存されている本文は消さない（Firestore の merge 保存で messages を書かないのと同じ意味）。
 * 本文は saveMessage / deleteMessage / clearMessages だけで変える。
 */
export function mergeSavedSession<T extends { messages: unknown[] }>(
  stored: T | undefined,
  incoming: T,
): T {
  return { ...incoming, messages: stored?.messages ?? [] };
}
