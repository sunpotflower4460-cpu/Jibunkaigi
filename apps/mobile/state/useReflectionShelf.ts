import { useCallback, useRef, useState } from 'react';
import type { UniversalMessage } from './mobileTypes';
import {
  type ConferenceRecord,
  getReflectionShelfRepository,
  type StickyNote,
  type StickyNoteKind,
} from '../services/reflectionShelfRepository';
import { buildConferenceRecord } from '../services/conferenceRecordBuilder';

type ReflectionShelfPanel = 'menu' | 'stickyNotes' | 'conferenceRecords';

interface OpenStickyNoteOptions {
  sessionId: string;
  kind?: StickyNoteKind;
  seedText?: string;
}

interface OpenConferenceRecordOptions {
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
    isSavingStickyNote,
    isSavingConferenceRecord,
    openShelf,
    closeShelf,
    backToMenu,
    openStickyNote,
    openConferenceRecords,
    selectConferenceSession,
    setSelectedKind,
    setDraftContent,
    createStickyNote,
    deleteStickyNote,
    createConferenceRecord,
    deleteConferenceRecord,
  };
}
