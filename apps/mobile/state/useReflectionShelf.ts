import { useCallback, useRef, useState } from 'react';
import {
  getReflectionShelfRepository,
  type StickyNote,
  type StickyNoteKind,
} from '../services/reflectionShelfRepository';

type ReflectionShelfPanel = 'menu' | 'stickyNotes';

interface OpenStickyNoteOptions {
  sessionId: string;
  kind?: StickyNoteKind;
  seedText?: string;
}

export function useReflectionShelf() {
  const repositoryRef = useRef(getReflectionShelfRepository());
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<ReflectionShelfPanel>('menu');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] = useState<StickyNoteKind>('question');
  const [draftContent, setDraftContent] = useState('');
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [isSavingStickyNote, setIsSavingStickyNote] = useState(false);

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

  return {
    isOpen,
    activePanel,
    selectedSessionId,
    selectedKind,
    draftContent,
    stickyNotes,
    isSavingStickyNote,
    openShelf,
    closeShelf,
    backToMenu,
    openStickyNote,
    setSelectedKind,
    setDraftContent,
    createStickyNote,
    deleteStickyNote,
  };
}
