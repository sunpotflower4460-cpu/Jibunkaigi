import { createUniversalId } from '@jibunkaigi/shared';
import type { UniversalMessage } from '../state/mobileTypes';
import type { ConferenceRecord } from './reflectionShelfRepository';

export interface BuildConferenceRecordInput {
  sessionId: string;
  sessionTitle?: string;
  messages: UniversalMessage[];
  now?: number;
}

const STOPWORDS = new Set(['です', 'ます', 'こと', 'それ', 'これ', 'ため', 'よう', '感じ', '思う']);

function shorten(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

function normalizeWords(text: string): string[] {
  return text
    .replace(/[。、「」！？!?（）()[\]【】]/g, ' ')
    .split(/[\s、,。]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && word.length <= 12 && !STOPWORDS.has(word));
}

function pickKeywords(userMessages: UniversalMessage[], max = 6): string[] {
  const counts = new Map<string, number>();
  for (const message of userMessages) {
    for (const word of normalizeWords(message.text)) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word]) => word);
}

export function buildConferenceRecord(input: BuildConferenceRecordInput): ConferenceRecord | null {
  const sessionId = input.sessionId.trim();
  if (!sessionId) return null;

  const userMessages = input.messages.filter((message) => message.role === 'user' && message.text.trim());
  if (userMessages.length === 0) return null;

  const now = input.now ?? Date.now();
  const first = userMessages[0]?.text.trim() ?? '';
  const last = userMessages[userMessages.length - 1]?.text.trim() ?? '';
  const topicSeed = first || input.sessionTitle?.trim() || 'この会話';
  const topic = shorten(topicSeed, 28);
  const title = `${topic}の会議録`;
  const keywords = pickKeywords(userMessages);
  const selfLine = last
    ? `「${shorten(last, 48)}」が、いまの自分に残った。`
    : `「${shorten(first, 48)}」という気持ちから始まっていた。`;
  const mirrorSummary = keywords.length
    ? `この会話では、${keywords.slice(0, 3).join('・')}あたりに心が触れていたように見える。`
    : 'この会話では、まだ輪郭のない気持ちをそっと確かめていたように見える。';
  const returnQuestion = keywords[0]
    ? `次に「${keywords[0]}」に戻るとしたら、どんな場面から始めたい？`
    : '次に戻るなら、いまの気持ちのどこから話し始めたい？';

  return {
    id: createUniversalId('record'),
    sessionId,
    title,
    topic,
    keywords,
    mirrorSummary,
    selfLine,
    returnQuestion,
    createdAt: now,
    updatedAt: now,
  };
}
