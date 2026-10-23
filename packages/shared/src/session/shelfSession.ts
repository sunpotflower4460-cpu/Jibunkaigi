export interface ShelfSessionSelection<T extends { id: string; messages: unknown[] }> {
  /** いま開いている会話。本文 (messages) を持つ。 */
  activeSession: T;
  /** 一覧のエントリ。本文を持たないことがある（Firestore の listSessions は messages: []）。タイトルなどの表示に使う。 */
  listedSessions: readonly T[];
  selectedSessionId: string | null;
  /** 開いていない会話を選んだときに、その会話の本文を読み込んだ結果。どの会話の本文かは sessionId で確かめる。 */
  loadedMessages: { sessionId: string; messages: T['messages'] } | null;
}

export interface ShelfSessionView<T extends { messages: unknown[] }> {
  /** 対象の会話。タイトルなどの表示用。別の会話では一覧のエントリを使う。 */
  session: T;
  /** 対象の会話の本文。読み込めていないときは空。 */
  messages: T['messages'];
  /** messages が対象の会話の本文として読み込めているか。 */
  messagesLoaded: boolean;
}

/**
 * 会議録・言葉の水面などが対象にする会話と、その本文を選ぶ（純粋）。
 *
 * 開いている会話を選んでいるとき、または何も選んでいないときは、開いている会話の本文を返す。
 * 別の会話を選んでいるときは、読み込んだ本文がその会話のものである場合だけ使う。
 * 一覧のエントリは本文を持たないことがあるため、その本文は使わない（読み込み前は空として扱う）。
 */
export function resolveShelfSession<T extends { id: string; messages: unknown[] }>({
  activeSession,
  listedSessions,
  selectedSessionId,
  loadedMessages,
}: ShelfSessionSelection<T>): ShelfSessionView<T> {
  if (selectedSessionId === null || selectedSessionId === activeSession.id) {
    return { session: activeSession, messages: activeSession.messages, messagesLoaded: true };
  }

  const listed = listedSessions.find((item) => item.id === selectedSessionId);
  if (!listed) {
    return { session: activeSession, messages: [] as T['messages'], messagesLoaded: false };
  }

  if (loadedMessages?.sessionId === selectedSessionId) {
    return { session: listed, messages: loadedMessages.messages, messagesLoaded: true };
  }
  return { session: listed, messages: [] as T['messages'], messagesLoaded: false };
}
