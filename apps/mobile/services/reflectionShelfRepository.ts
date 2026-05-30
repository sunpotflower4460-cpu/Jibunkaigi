import { createUniversalId } from '@jibunkaigi/shared';

export type StickyNoteKind = 'question' | 'truth' | 'notYet' | 'later' | 'important' | 'free';

export interface StickyNote {
  id: string;
  sessionId: string;
  kind: StickyNoteKind;
  label: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateStickyNoteInput {
  sessionId: string;
  kind: StickyNoteKind;
  content: string;
}

export interface ConferenceRecord {
  id: string;
  sessionId: string;
  title: string;
  topic: string;
  keywords: string[];
  agentNotes?: Partial<Record<string, string>>;
  mirrorSummary: string;
  selfLine: string;
  returnQuestion: string;
  createdAt: number;
  updatedAt: number;
}

export interface ReflectionShelfRepository {
  sanitizeStickyNote(content: string): string;
  loadNotes(sessionId: string): Promise<StickyNote[]>;
  listNotesBySession(sessionId: string): Promise<StickyNote[]>;
  listAllNotes(): Promise<StickyNote[]>;
  createNote(input: CreateStickyNoteInput): Promise<StickyNote | null>;
  deleteNote(sessionId: string, noteId: string): Promise<void>;
  loadConferenceRecords(sessionId: string): Promise<ConferenceRecord[]>;
  listAllConferenceRecords(): Promise<ConferenceRecord[]>;
  createConferenceRecord(record: ConferenceRecord): Promise<ConferenceRecord | null>;
  deleteConferenceRecord(sessionId: string, recordId: string): Promise<void>;
}

export const STICKY_NOTE_KIND_LABELS: Record<StickyNoteKind, string> = {
  question: 'どう思う？',
  truth: 'これは本音かも',
  notYet: 'まだ違う',
  later: '後で見る',
  important: '大事',
  free: '自由入力',
};

export const STICKY_NOTE_KINDS = Object.keys(STICKY_NOTE_KIND_LABELS) as StickyNoteKind[];

function sortByUpdatedAtDesc<T extends { updatedAt: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.updatedAt - a.updatedAt);
}

export class LocalReflectionShelfRepository implements ReflectionShelfRepository {
  private notesBySession: Map<string, StickyNote[]> = new Map();
  private conferenceRecordsBySession: Map<string, ConferenceRecord[]> = new Map();

  sanitizeStickyNote(content: string): string {
    return content.replace(/\r\n?/g, '\n').trim();
  }

  async loadNotes(sessionId: string): Promise<StickyNote[]> {
    return this.listNotesBySession(sessionId);
  }

  async listNotesBySession(sessionId: string): Promise<StickyNote[]> {
    return sortByUpdatedAtDesc(this.notesBySession.get(sessionId) ?? []);
  }

  async listAllNotes(): Promise<StickyNote[]> {
    return sortByUpdatedAtDesc([...this.notesBySession.values()].flat());
  }

  async createNote(input: CreateStickyNoteInput): Promise<StickyNote | null> {
    const sessionId = input.sessionId.trim();
    if (!sessionId) return null;

    const content = this.sanitizeStickyNote(input.content);
    if (!content) return null;

    const now = Date.now();
    const note: StickyNote = {
      id: createUniversalId('note'),
      sessionId,
      kind: input.kind,
      label: STICKY_NOTE_KIND_LABELS[input.kind],
      content,
      createdAt: now,
      updatedAt: now,
    };

    const current = this.notesBySession.get(sessionId) ?? [];
    this.notesBySession.set(sessionId, [note, ...current]);
    return note;
  }

  async deleteNote(sessionId: string, noteId: string): Promise<void> {
    const current = this.notesBySession.get(sessionId);
    if (!current) return;

    this.notesBySession.set(
      sessionId,
      current.filter((note) => note.id !== noteId),
    );
  }

  async loadConferenceRecords(sessionId: string): Promise<ConferenceRecord[]> {
    return sortByUpdatedAtDesc(this.conferenceRecordsBySession.get(sessionId) ?? []);
  }

  async listAllConferenceRecords(): Promise<ConferenceRecord[]> {
    return sortByUpdatedAtDesc([...this.conferenceRecordsBySession.values()].flat());
  }

  async createConferenceRecord(record: ConferenceRecord): Promise<ConferenceRecord | null> {
    const sessionId = record.sessionId.trim();
    if (!sessionId) return null;

    const now = Date.now();
    const nextRecord: ConferenceRecord = {
      ...record,
      sessionId,
      updatedAt: now,
    };
    const current = this.conferenceRecordsBySession.get(sessionId) ?? [];
    this.conferenceRecordsBySession.set(sessionId, [nextRecord, ...current].slice(0, 200));
    return nextRecord;
  }

  async deleteConferenceRecord(sessionId: string, recordId: string): Promise<void> {
    const current = this.conferenceRecordsBySession.get(sessionId);
    if (!current) return;

    this.conferenceRecordsBySession.set(
      sessionId,
      current.filter((record) => record.id !== recordId),
    );
  }
}

let _reflectionShelfRepository: ReflectionShelfRepository | null = null;

export function getReflectionShelfRepository(): ReflectionShelfRepository {
  if (_reflectionShelfRepository) return _reflectionShelfRepository;
  _reflectionShelfRepository = new LocalReflectionShelfRepository();
  return _reflectionShelfRepository;
}
