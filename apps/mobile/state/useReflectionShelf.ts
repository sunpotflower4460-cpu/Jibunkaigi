import { useCallback, useRef, useState } from 'react';
import type { UniversalMessage } from './mobileTypes';
import {
  type ConferenceRecord,
  getReflectionShelfRepository,
  type StickyNote,
  type StickyNoteKind,
} from '../services/reflectionShelfRepository';
import { buildConferenceRecord } from '../services/conferenceRecordBuilder';

type ReflectionShelfPanel = 'menu' | 'stickyNotes' | 'conferenceRecords' | 'floatingKeywords' | 'themeArchive';

interface OpenStickyNoteOptions {
  sessionId: string;
  kind?: StickyNoteKind;
  seedText?: string;
}

interface OpenConferenceRecordOptions {
  sessionId: string;
}

interface OpenFloatingKeywordsOptions {
  sessionId: string;
}

interface OpenThemeArchiveOptions {
  sessionId: string;
}

interface CreateConferenceRecordInput {
  sessionTitle?: string;
  messages: UniversalMessage[];
}

export function useReflectionShelf() {
  const repositoryRef = useRef(getReflectionShelfRepository());
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<ReflectionShelfPanel>('menu');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] = useState<StickyNoteKind>('question');
  const [draftContent, setDraftContent] = useState('');
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [conferenceRecords, setConferenceRecords] = useState<ConferenceRecord[]>([]);
  const [isSavingStickyNote, setIsSavingStickyNote] = useState(false);
  const [isSavingConferenceRecord, setIsSavingConferenceRecord] = useState(false);
  const [isRefreshingFloatingKeywords, setIsRefreshingFloatingKeywords] = useState(false);
  const [themeArchiveNotes, setThemeArchiveNotes] = useState<StickyNote[]>([]);
  const [themeArchiveConferenceRecords, setThemeArchiveConferenceRecords] = useState<ConferenceRecord[]>([]);
  const [isRefreshingThemeArchive, setIsRefreshingThemeArchive] = useState(false);

  function openShelf() {
    setIsOpen(true);
    setActivePanel('menu');
  }

  function closeShelf() {
    setIsOpen(false);
    setActivePanel('menu');
  }

  const loadStickyNotes = useCallback(async (sessionId: string) => {
    const notes = await repositoryRef.current.loadNotes(sessionId);
    setStickyNotes(notes);
  }, []);

  const loadConferenceRecords = useCallback(async (sessionId: string) => {
    const records = await repositoryRef.current.loadConferenceRecords(sessionId);
    setConferenceRecords(records);
  }, []);

  const loadFloatingKeywordSources = useCallback(async (sessionId: string) => {
    setIsRefreshingFloatingKeywords(true);
    try {
      const [notes, records] = await Promise.all([
        repositoryRef.current.loadNotes(sessionId),
        repositoryRef.current.loadConferenceRecords(sessionId),
      ]);
      setStickyNotes(notes);
      setConferenceRecords(records);
    } finally {
      setIsRefreshingFloatingKeywords(false);
    }
  }, []);

  const loadThemeArchiveSources = useCallback(async () => {
    setIsRefreshingThemeArchive(true);
    try {
      const [notes, records] = await Promise.all([
        repositoryRef.current.listAllNotes(),
        repositoryRef.current.listAllConferenceRecords(),
      ]);
      setThemeArchiveNotes(notes);
      setThemeArchiveConferenceRecords(records);
    } finally {
      setIsRefreshingThemeArchive(false);
    }
  }, []);

  const openStickyNote = useCallback(async ({
    sessionId,
    kind = 'question',
    seedText,
  }: OpenStickyNoteOptions) => {
    setIsOpen(true);
    setActivePanel('stickyNotes');
    setSelectedSessionId(sessionId);
    setSelectedKind(kind);
    setDraftContent(repositoryRef.current.sanitizeStickyNote(seedText ?? ''));
    await loadStickyNotes(sessionId);
  }, [loadStickyNotes]);

  const openConferenceRecords = useCallback(async ({
    sessionId,
  }: OpenConferenceRecordOptions) => {
    setIsOpen(true);
    setActivePanel('conferenceRecords');
    setSelectedSessionId(sessionId);
    await loadConferenceRecords(sessionId);
  }, [loadConferenceRecords]);

  const openFloatingKeywords = useCallback(async ({
    sessionId,
  }: OpenFloatingKeywordsOptions) => {
    setIsOpen(true);
    setActivePanel('floatingKeywords');
    setSelectedSessionId(sessionId);
    await loadFloatingKeywordSources(sessionId);
  }, [loadFloatingKeywordSources]);

  const openThemeArchive = useCallback(async ({
    sessionId,
  }: OpenThemeArchiveOptions) => {
    setIsOpen(true);
    setActivePanel('themeArchive');
    setSelectedSessionId(sessionId);
    await loadThemeArchiveSources();
  }, [loadThemeArchiveSources]);

  const backToMenu = useCallback(() => {
    setActivePanel('menu');
  }, []);

  const createStickyNote = useCallback(async () => {
    if (!selectedSessionId) return false;
    setIsSavingStickyNote(true);
    try {
      const created = await repositoryRef.current.createNote({
        sessionId: selectedSessionId,
        kind: selectedKind,
        content: draftContent,
      });
      if (!created) return false;
      setDraftContent('');
      await loadStickyNotes(selectedSessionId);
      return true;
    } finally {
      setIsSavingStickyNote(false);
    }
  }, [draftContent, loadStickyNotes, selectedKind, selectedSessionId]);

  const deleteStickyNote = useCallback(async (noteId: string) => {
    if (!selectedSessionId) return;
    await repositoryRef.current.deleteNote(selectedSessionId, noteId);
    await loadStickyNotes(selectedSessionId);
  }, [loadStickyNotes, selectedSessionId]);

  const selectConferenceSession = useCallback(async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    await loadConferenceRecords(sessionId);
  }, [loadConferenceRecords]);

  const selectFloatingKeywordSession = useCallback(async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    await loadFloatingKeywordSources(sessionId);
  }, [loadFloatingKeywordSources]);

  const refreshFloatingKeywords = useCallback(async () => {
    if (!selectedSessionId) return;
    await loadFloatingKeywordSources(selectedSessionId);
  }, [loadFloatingKeywordSources, selectedSessionId]);

  const refreshThemeArchive = useCallback(async () => {
    await loadThemeArchiveSources();
  }, [loadThemeArchiveSources]);

  const createConferenceRecord = useCallback(async (input: CreateConferenceRecordInput) => {
    if (!selectedSessionId) return null;
    setIsSavingConferenceRecord(true);
    try {
      const built = buildConferenceRecord({
        sessionId: selectedSessionId,
        sessionTitle: input.sessionTitle,
        messages: input.messages,
      });
      if (!built) return null;
      const saved = await repositoryRef.current.createConferenceRecord(built);
      if (!saved) return null;
      await loadConferenceRecords(selectedSessionId);
      return saved;
    } finally {
      setIsSavingConferenceRecord(false);
    }
  }, [loadConferenceRecords, selectedSessionId]);

  const deleteConferenceRecord = useCallback(async (recordId: string) => {
    if (!selectedSessionId) return;
    await repositoryRef.current.deleteConferenceRecord(selectedSessionId, recordId);
    await loadConferenceRecords(selectedSessionId);
  }, [loadConferenceRecords, selectedSessionId]);

  return {
    isOpen,
    activePanel,
    selectedSessionId,
    selectedKind,
    draftContent,
    stickyNotes,
    conferenceRecords,
    themeArchiveNotes,
    themeArchiveConferenceRecords,
    isSavingStickyNote,
    isSavingConferenceRecord,
    isRefreshingFloatingKeywords,
    isRefreshingThemeArchive,
    openShelf,
    closeShelf,
    backToMenu,
    openStickyNote,
    openConferenceRecords,
    openFloatingKeywords,
    openThemeArchive,
    selectConferenceSession,
    selectFloatingKeywordSession,
    refreshFloatingKeywords,
    refreshThemeArchive,
    setSelectedKind,
    setDraftContent,
    createStickyNote,
    deleteStickyNote,
    createConferenceRecord,
    deleteConferenceRecord,
  };
}
