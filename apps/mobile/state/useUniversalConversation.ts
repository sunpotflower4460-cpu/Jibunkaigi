// Universal conversation hook for iOS / Android / Web.
// Supports multiple sessions, session switching, deletion, and Firestore persistence.
// AI responses are still mock – Gemini Proxy will be wired in a later phase.

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  UniversalAgentId,
  UniversalMessage,
  UniversalModeId,
  UniversalSession,
} from './mobileTypes';
import {
  createUniversalAgentReply,
  createMirrorSummaryReply,
  pickUniversalDelegatedAgent,
  AGENT_LABELS,
} from '../services/universalAgentMock';
import { createLocalSession, createLocalSessionFromText } from '../services/universalSessionLocal';
import {
  getSessionRepository,
  setSessionRepository,
  type UniversalSessionRepository,
} from '../services/sessionRepository';
import { createFirestoreRepository } from '../services/firebase/firestoreSessionRepository';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Bootstrap the repository: try Firestore, fall back to local.
async function initRepository(): Promise<UniversalSessionRepository> {
  const firestoreRepo = createFirestoreRepository();
  if (firestoreRepo) {
    setSessionRepository(firestoreRepo);
    return firestoreRepo;
  }
  return getSessionRepository();
}

interface UseUniversalConversationReturn {
  session: UniversalSession;
  sessions: UniversalSession[];
  messages: UniversalMessage[];
  selectedAgent: UniversalAgentId;
  selectedMode: UniversalModeId;
  isThinking: boolean;
  isRemote: boolean;
  sendMessage: (text: string) => void;
  selectAgent: (agentId: UniversalAgentId) => void;
  selectMode: (modeId: UniversalModeId) => void;
  clearConversation: () => void;
  startFromHint: (hint: string) => void;
  createNewSession: () => void;
  switchSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
}

export function useUniversalConversation(): UseUniversalConversationReturn {
  const repoRef = useRef<UniversalSessionRepository>(getSessionRepository());

  const [session, setSession] = useState<UniversalSession>(() => createLocalSession());
  const [sessions, setSessions] = useState<UniversalSession[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<UniversalAgentId>('ray');
  const [selectedMode, setSelectedMode] = useState<UniversalModeId>('dialogue');
  const [isThinking, setIsThinking] = useState(false);
  const [isRemote, setIsRemote] = useState(false);

  // Refs to keep stable values inside async timeout callbacks.
  const isThinkingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesRef = useRef<UniversalMessage[]>([]);
  // Keep mode accessible inside timeout callbacks without stale closure.
  const modeRef = useRef<UniversalModeId>('dialogue');
  const sessionRef = useRef<UniversalSession>(session);

  // Keep sessionRef in sync with state.
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Initialise: connect to Firestore if available and load sessions.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const repo = await initRepository();
      if (cancelled) return;
      repoRef.current = repo;
      setIsRemote(repo.isRemoteEnabled());

      const list = await repo.listSessions();
      if (cancelled) return;

      if (list.length === 0) {
        const initial = createLocalSession();
        await repo.saveSession(initial);
        messagesRef.current = [];
        setSession(initial);
        setSessions([initial]);
      } else {
        const active = list[0];
        const msgs = await repo.loadMessages(active.id);
        if (!cancelled) {
          messagesRef.current = msgs;
          setSession({ ...active, messages: msgs });
          setSessions(list);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh the sessions sidebar list.
  const refreshSessions = useCallback(async () => {
    const list = await repoRef.current.listSessions();
    setSessions(list);
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinkingRef.current) return;

      const userMsg: UniversalMessage = {
        id: generateId(),
        role: 'user',
        text: trimmed,
        modeId: modeRef.current,
        createdAt: Date.now(),
      };

      const currentMessages = messagesRef.current;
      messagesRef.current = [...currentMessages, userMsg];
      const updatedSession: UniversalSession = {
        ...sessionRef.current,
        messages: messagesRef.current,
        updatedAt: Date.now(),
      };
      setSession(updatedSession);

      // Persist user message.
      void repoRef.current.saveMessage(sessionRef.current.id, userMsg);
      void repoRef.current.saveSession({ ...updatedSession, messages: [] });

      isThinkingRef.current = true;
      setIsThinking(true);

      // Resolve the actual responding agent (delegate → random real agent).
      const respondingAgent: UniversalAgentId =
        selectedAgent === 'delegate'
          ? pickUniversalDelegatedAgent(trimmed)
          : selectedAgent;

      // Build reply text based on the responding agent and current mode.
      let replyText: string;
      if (respondingAgent === 'mirror') {
        const userTexts = currentMessages
          .filter((m) => m.role === 'user')
          .map((m) => m.text);
        replyText = createMirrorSummaryReply([...userTexts, trimmed], modeRef.current);
      } else {
        replyText = createUniversalAgentReply(respondingAgent, trimmed, modeRef.current);
      }

      const delay = 300 + Math.floor(Math.random() * 400);

      timeoutRef.current = setTimeout(() => {
        const agentMsg: UniversalMessage = {
          id: generateId(),
          role: 'agent',
          text: replyText,
          agentId: respondingAgent,
          agentLabel: AGENT_LABELS[respondingAgent],
          modeId: modeRef.current,
          createdAt: Date.now(),
        };

        messagesRef.current = [...messagesRef.current, agentMsg];
        const afterReply: UniversalSession = {
          ...sessionRef.current,
          messages: messagesRef.current,
          updatedAt: Date.now(),
        };
        setSession(afterReply);

        // Persist agent message.
        void repoRef.current.saveMessage(sessionRef.current.id, agentMsg);
        void repoRef.current.saveSession({ ...afterReply, messages: [] });
        void refreshSessions();

        isThinkingRef.current = false;
        setIsThinking(false);
      }, delay);
    },
    [selectedAgent, refreshSessions],
  );

  const selectAgent = useCallback((agentId: UniversalAgentId) => {
    setSelectedAgent(agentId);
  }, []);

  const selectMode = useCallback((modeId: UniversalModeId) => {
    modeRef.current = modeId;
    setSelectedMode(modeId);
  }, []);

  const clearConversation = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isThinkingRef.current = false;
    messagesRef.current = [];
    setIsThinking(false);
    const cleared: UniversalSession = {
      ...sessionRef.current,
      messages: [],
      updatedAt: Date.now(),
    };
    setSession(cleared);
    void repoRef.current.saveSession({ ...cleared, messages: [] });
  }, []);

  const createNewSession = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isThinkingRef.current = false;
    const newSession = createLocalSession();
    messagesRef.current = [];
    setIsThinking(false);
    setSession(newSession);
    void repoRef.current.saveSession(newSession).then(() => refreshSessions());
  }, [refreshSessions]);

  const switchSession = useCallback(async (sessionId: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isThinkingRef.current = false;
    setIsThinking(false);

    const msgs = await repoRef.current.loadMessages(sessionId);
    const list = await repoRef.current.listSessions();
    const target = list.find((s) => s.id === sessionId);
    if (!target) return;

    messagesRef.current = msgs;
    setSession({ ...target, messages: msgs });
    setSessions(list);
  }, []);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      await repoRef.current.deleteSession(sessionId);
      const list = await repoRef.current.listSessions();

      if (sessionRef.current.id === sessionId) {
        if (list.length > 0) {
          await switchSession(list[0].id);
          setSessions(list);
        } else {
          const newSession = createLocalSession();
          await repoRef.current.saveSession(newSession);
          messagesRef.current = [];
          setSession(newSession);
          setSessions([newSession]);
        }
      } else {
        setSessions(list);
      }
    },
    [switchSession],
  );

  const startFromHint = useCallback(
    (hint: string) => {
      sendMessage(hint);
    },
    [sendMessage],
  );

  // Derive a better session title from first user message when still default.
  useEffect(() => {
    const firstUser = session.messages.find((m) => m.role === 'user');
    if (firstUser && session.title === '新しい問い') {
      const titled = createLocalSessionFromText(firstUser.text);
      const updated: UniversalSession = { ...session, title: titled.title };
      setSession(updated);
      void repoRef.current.saveSession({ ...updated, messages: [] });
      void refreshSessions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.messages.length]);

  return {
    session,
    sessions,
    messages: session.messages,
    selectedAgent,
    selectedMode,
    isThinking,
    isRemote,
    sendMessage,
    selectAgent,
    selectMode,
    clearConversation,
    startFromHint,
    createNewSession,
    switchSession,
    deleteSession,
  };
}
