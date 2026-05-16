// Universal conversation hook for iOS / Android / Web.
// Supports multiple sessions, session switching, deletion, and Firestore persistence.
// AI responses are routed through the Universal AI Client (Gemini Proxy or mock fallback).

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  UniversalAgentId,
  UniversalMessage,
  UniversalModeId,
  UniversalSession,
} from './mobileTypes';
import { AGENT_LABELS } from '../services/universalAgentMock';
import { createUniversalAiReply } from '../services/ai/universalAiClient';
import { createUniversalOthersReplies } from '../services/ai/universalOthersClient';
import { isGeminiProxyConfigured } from '../config/mobileApiConfig';
import { createLocalSession, createLocalSessionFromText } from '../services/universalSessionLocal';
import {
  getSessionRepository,
  setSessionRepository,
  type UniversalSessionRepository,
} from '../services/sessionRepository';
import { createFirestoreRepository } from '../services/firebase/firestoreSessionRepository';
import { createUniversalId } from '../../../packages/shared/src';

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
  isLoadingOthers: boolean;
  isRemote: boolean;
  aiSource: 'proxy' | 'mock-fallback' | null;
  othersSource: 'proxy' | 'mock-fallback' | null;
  aiError: string | null;
  othersError: string | null;
  isRemoteAiEnabled: boolean;
  sendMessage: (text: string) => void;
  requestOthers: () => Promise<void>;
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
  const [isLoadingOthers, setIsLoadingOthers] = useState(false);
  const [isRemote, setIsRemote] = useState(false);
  const [aiSource, setAiSource] = useState<'proxy' | 'mock-fallback' | null>(null);
  const [othersSource, setOthersSource] = useState<'proxy' | 'mock-fallback' | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [othersError, setOthersError] = useState<string | null>(null);
  const isRemoteAiEnabled = isGeminiProxyConfigured();

  // Refs to keep stable values inside async callbacks.
  const isThinkingRef = useRef(false);
  const isLoadingOthersRef = useRef(false);
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
      setAiError(null);

      const sessionId = sessionRef.current.id;
      const agentId = selectedAgent;
      const modeId = modeRef.current;
      const messagesSnapshot = messagesRef.current;

      void (async () => {
        try {
          const reply = await createUniversalAiReply({
            sessionId,
            userText: trimmed,
            agentId,
            modeId,
            messages: messagesSnapshot,
          });

          // Guard: discard the reply if the user navigated away from this session.
          if (sessionRef.current.id !== sessionId) return;

          const agentMsg: UniversalMessage = {
            id: generateId(),
            role: 'agent',
            text: reply.text,
            agentId: reply.agentId,
            agentLabel: reply.agentLabel || AGENT_LABELS[reply.agentId],
            modeId,
            createdAt: Date.now(),
          };

          messagesRef.current = [...messagesRef.current, agentMsg];
          const afterReply: UniversalSession = {
            ...sessionRef.current,
            messages: messagesRef.current,
            updatedAt: Date.now(),
          };
          setSession(afterReply);
          setAiSource(reply.source);

          // Persist agent message to the originating session.
          void repoRef.current.saveMessage(sessionId, agentMsg);
          void repoRef.current.saveSession({ ...afterReply, messages: [] });
          void refreshSessions();
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          setAiError(msg);
          console.warn('[Jibunkaigi] AI reply error:', error);
        } finally {
          isThinkingRef.current = false;
          setIsThinking(false);
        }
      })();
    },
    [selectedAgent, refreshSessions],
  );

  const requestOthers = useCallback(async () => {
    if (isThinkingRef.current || isLoadingOthersRef.current) return;
    const lastUser = [...messagesRef.current].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;

    isLoadingOthersRef.current = true;
    setIsLoadingOthers(true);
    setOthersError(null);

    const groupId = createUniversalId('others');
    try {
      const result = await createUniversalOthersReplies({
        sessionId: sessionRef.current.id,
        userText: lastUser.text,
        currentAgentId: selectedAgent,
        modeId: modeRef.current,
        messages: messagesRef.current,
      });

      const now = Date.now();
      const agentMessages: UniversalMessage[] = result.replies.map((reply, index) => ({
        id: createUniversalId(`others_${reply.agentId}`),
        role: 'agent' as const,
        text: reply.text,
        agentId: reply.agentId,
        agentLabel: reply.agentLabel,
        modeId: modeRef.current,
        createdAt: now + index,
        source: result.source,
        model: result.model,
        origin: 'others' as const,
        groupId,
      }));

      messagesRef.current = [...messagesRef.current, ...agentMessages];
      const updated: UniversalSession = {
        ...sessionRef.current,
        messages: messagesRef.current,
        updatedAt: Date.now(),
      };
      setSession(updated);
      setOthersSource(result.source);

      for (const msg of agentMessages) {
        void repoRef.current.saveMessage(sessionRef.current.id, msg);
      }
      void repoRef.current.saveSession({ ...updated, messages: [] });
    } catch (error) {
      setOthersError(error instanceof Error ? error.message : String(error));
    } finally {
      isLoadingOthersRef.current = false;
      setIsLoadingOthers(false);
    }
  }, [selectedAgent]);

  const selectAgent = useCallback((agentId: UniversalAgentId) => {    setSelectedAgent(agentId);
  }, []);

  const selectMode = useCallback((modeId: UniversalModeId) => {
    modeRef.current = modeId;
    setSelectedMode(modeId);
  }, []);

  const clearConversation = useCallback(() => {
    isThinkingRef.current = false;
    messagesRef.current = [];
    setIsThinking(false);
    const cleared: UniversalSession = {
      ...sessionRef.current,
      messages: [],
      updatedAt: Date.now(),
    };
    setSession(cleared);
    void repoRef.current.clearMessages(cleared.id);
    void repoRef.current.saveSession({ ...cleared, messages: [] });
  }, []);

  const createNewSession = useCallback(() => {
    isThinkingRef.current = false;
    const newSession = createLocalSession();
    messagesRef.current = [];
    setIsThinking(false);
    setSession(newSession);
    void repoRef.current.saveSession(newSession).then(() => refreshSessions());
  }, [refreshSessions]);

  const switchSession = useCallback(async (sessionId: string) => {
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
    isLoadingOthers,
    isRemote,
    aiSource,
    othersSource,
    aiError,
    othersError,
    isRemoteAiEnabled,
    sendMessage,
    requestOthers,
    selectAgent,
    selectMode,
    clearConversation,
    startFromHint,
    createNewSession,
    switchSession,
    deleteSession,
  };
}
