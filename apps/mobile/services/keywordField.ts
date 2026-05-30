import type { UniversalMessage } from '../state/mobileTypes';
import type { ConferenceRecord, StickyNote } from './reflectionShelfRepository';

export interface FloatingKeyword {
  text: string;
  score: number;
  fontSize: number;
  opacity: number;
}

interface BuildKeywordFieldInput {
  messages: UniversalMessage[];
  conferenceRecords: ConferenceRecord[];
  stickyNotes: StickyNote[];
  maxKeywords?: number;
}

const STOPWORDS = new Set([
  'これ', 'それ', 'あれ', 'ここ', 'そこ', 'こと', 'もの', 'ため', 'よう', 'です', 'ます', 'する', 'した', 'して',
  'ある', 'いる', 'ない', '思う', '感じ', '自分', '今日', '今', '一つ', '全部', '少し', 'かなり', 'ちゃんと',
  'なんか', 'だけど', 'でも', 'そして', 'それで', 'この', 'その', 'あの', 'から', 'まで', 'より', 'ので', 'なら',
  'には', 'では', 'とも', 'として', 'という', 'みたい', 'あなた', 'わたし', '私', '僕', '俺', '会議',
]);

const PARTICLES = new Set([
  'は', 'が', 'を', 'に', 'で', 'と', 'の', 'へ', 'も', 'や', 'か', 'ね', 'よ', 'な', 'だ', 'て', 'た', 'し', 'ん',
]);

const IMPORTANT_COMPOUNDS = [
  '違和感', '情熱', '安心', '不安', '本音', '方向', '構造', '前提', '盲点', '現実', '夢', '胸', '声', '言葉',
  '疲れ', '怖い', '好き', '創造', '迷い', '願い',
];

function normalize(text: string): string {
  return text
    .replace(/[\n\r\t]/g, ' ')
    .replace(/[、。！？!?「」『』（）()\[\]{}.,:;・]/g, ' ')
    .trim();
}

function isValidToken(token: string): boolean {
  if (!token) return false;
  if (STOPWORDS.has(token) || PARTICLES.has(token)) return false;
  if (/^[ぁ-ん]{1,2}$/.test(token)) return false;
  if (/^[a-zA-Z0-9_-]+$/.test(token) && token.length < 3) return false;
  if (/^\d+$/.test(token)) return false;
  return token.length >= 2 && token.length <= 6;
}

function splitJapaneseChunk(chunk: string): string[] {
  const found = new Set<string>();

  for (const word of IMPORTANT_COMPOUNDS) {
    if (chunk.includes(word) && isValidToken(word)) {
      found.add(word);
    }
  }

  const cleaned = chunk
    .replace(/(にならない|ならない|している|してる|したい|だった|です|ます|けれど|けど|ずっと|ちゃんと|すごく|とても|かなり|少し|小さな|大きな)/g, ' ')
    .replace(/[ぁ-んー]{3,}/g, ' ')
    .trim();

  for (const part of cleaned.split(/\s+/)) {
    if (isValidToken(part)) {
      found.add(part);
    }
  }

  return [...found];
}

function tokenize(text: string): string[] {
  const normalized = normalize(text);
  if (!normalized) return [];

  const tokens = new Set<string>();
  for (const rawToken of normalized.split(/\s+/)) {
    const token = rawToken.trim();
    if (!token) continue;

    if (isValidToken(token)) {
      tokens.add(token);
      continue;
    }

    for (const split of splitJapaneseChunk(token)) {
      tokens.add(split);
    }
  }

  return [...tokens];
}

function addTextWeight(counts: Map<string, number>, text: string, weight: number): void {
  for (const token of tokenize(text)) {
    counts.set(token, (counts.get(token) ?? 0) + weight);
  }
}

export function buildKeywordField({
  messages,
  conferenceRecords,
  stickyNotes,
  maxKeywords = 18,
}: BuildKeywordFieldInput): FloatingKeyword[] {
  const counts = new Map<string, number>();

  for (const message of messages) {
    const text = message.text.trim();
    if (!text) continue;
    addTextWeight(counts, text, message.role === 'user' ? 1.4 : 1);
  }

  for (const record of conferenceRecords) {
    for (const keyword of record.keywords) {
      addTextWeight(counts, keyword, 2.2);
    }
    addTextWeight(counts, record.topic, 1.6);
    addTextWeight(counts, record.selfLine, 1.6);
    addTextWeight(counts, record.returnQuestion, 1.6);
  }

  for (const note of stickyNotes) {
    const noteWeight = note.kind === 'important' || note.kind === 'truth' ? 2.1 : 1.3;
    addTextWeight(counts, note.content, noteWeight);
  }

  const entries = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja'))
    .slice(0, maxKeywords);

  const maxScore = Math.max(...entries.map(([, score]) => score), 1);

  return entries.map(([text, score]) => {
    const normalized = score / maxScore;
    return {
      text,
      score,
      fontSize: Math.round(14 + normalized * 12),
      opacity: 0.58 + normalized * 0.34,
    };
  });
}
