import type { UniversalSession } from '../state/mobileTypes';
import type { ConferenceRecord, StickyNote } from './reflectionShelfRepository';

export interface ThemeStat {
  keyword: string;
  score: number;
  recordCount: number;
  noteCount: number;
  messageCount: number;
  lastSeenAt: number;
}

export interface ThemeArchive {
  themes: ThemeStat[];
  recentRecords: ConferenceRecord[];
  recentNotes: StickyNote[];
  totals: {
    sessions: number;
    messages: number;
    records: number;
    notes: number;
  };
}

interface BuildThemeArchiveInput {
  sessions: UniversalSession[];
  conferenceRecords: ConferenceRecord[];
  stickyNotes: StickyNote[];
  maxThemes?: number;
}

const STOP_WORDS = new Set([
  'これ', 'それ', 'あれ', 'ここ', 'そこ', 'こと', 'もの', 'ため', 'よう', 'です', 'ます', 'する', 'した', 'して',
  'ある', 'いる', 'ない', '思う', '感じ', '自分', '今日', '今', '一つ', '全部', '少し', 'かなり', 'ちゃんと',
  'なんか', 'だけど', 'でも', 'そして', 'それで', 'この', 'その', 'あの', 'から', 'まで', 'より', 'ので', 'なら',
  'には', 'では', 'とも', 'として', 'という', 'みたい', 'あなた', 'わたし', '私', '僕', '俺', '会議', '付箋',
]);

function normalize(text: string): string {
  return text
    .replace(/[\n\r\t]/g, ' ')
    .replace(/[、。！？!?「」『』（）()\[\]{}.,:;・]/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  const normalized = normalize(text);
  if (!normalized) return [];

  return normalized
    .split(/\s+/)
    .flatMap((token) => token.split(/(?=[A-ZＡ-Ｚ])/))
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && token.length <= 14)
    .filter((token) => !STOP_WORDS.has(token))
    .filter((token) => !/^\d+$/.test(token));
}

function ensureTheme(map: Map<string, ThemeStat>, keyword: string): ThemeStat {
  const existing = map.get(keyword);
  if (existing) return existing;
  const next: ThemeStat = {
    keyword,
    score: 0,
    recordCount: 0,
    noteCount: 0,
    messageCount: 0,
    lastSeenAt: 0,
  };
  map.set(keyword, next);
  return next;
}

export function buildThemeArchive({
  sessions,
  conferenceRecords,
  stickyNotes,
  maxThemes = 24,
}: BuildThemeArchiveInput): ThemeArchive {
  const themes = new Map<string, ThemeStat>();

  for (const record of conferenceRecords) {
    const seenInRecord = new Set<string>();

    for (const keyword of record.keywords) {
      const normalizedKeyword = keyword.trim();
      if (!normalizedKeyword || STOP_WORDS.has(normalizedKeyword)) continue;
      const theme = ensureTheme(themes, normalizedKeyword);
      theme.score += 3;
      theme.lastSeenAt = Math.max(theme.lastSeenAt, record.updatedAt);
      if (!seenInRecord.has(normalizedKeyword)) {
        theme.recordCount += 1;
        seenInRecord.add(normalizedKeyword);
      }
    }

    for (const token of tokenize(`${record.topic} ${record.selfLine} ${record.returnQuestion}`)) {
      const theme = ensureTheme(themes, token);
      theme.score += 1.6;
      theme.lastSeenAt = Math.max(theme.lastSeenAt, record.updatedAt);
      if (!seenInRecord.has(token)) {
        theme.recordCount += 1;
        seenInRecord.add(token);
      }
    }
  }

  for (const note of stickyNotes) {
    const seenInNote = new Set<string>();
    const noteWeight = note.kind === 'important' || note.kind === 'truth' ? 2.3 : 1.4;
    for (const token of tokenize(`${note.label} ${note.content}`)) {
      const theme = ensureTheme(themes, token);
      theme.score += noteWeight;
      theme.lastSeenAt = Math.max(theme.lastSeenAt, note.updatedAt);
      if (!seenInNote.has(token)) {
        theme.noteCount += 1;
        seenInNote.add(token);
      }
    }
  }

  for (const session of sessions) {
    for (const message of session.messages) {
      const seenInMessage = new Set<string>();
      const weight = message.role === 'user' ? 0.8 : 0.45;
      for (const token of tokenize(message.text)) {
        const theme = ensureTheme(themes, token);
        theme.score += weight;
        theme.lastSeenAt = Math.max(theme.lastSeenAt, message.createdAt);
        if (!seenInMessage.has(token)) {
          theme.messageCount += 1;
          seenInMessage.add(token);
        }
      }
    }
  }

  const sortedThemes = [...themes.values()]
    .filter((theme) => theme.score >= 1.5)
    .sort((a, b) => b.score - a.score || b.lastSeenAt - a.lastSeenAt || a.keyword.localeCompare(b.keyword, 'ja'))
    .slice(0, maxThemes);

  const recentRecords = [...conferenceRecords]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 8);
  const recentNotes = [...stickyNotes]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 8);

  return {
    themes: sortedThemes,
    recentRecords,
    recentNotes,
    totals: {
      sessions: sessions.length,
      messages: sessions.reduce((count, session) => count + session.messages.length, 0),
      records: conferenceRecords.length,
      notes: stickyNotes.length,
    },
  };
}
