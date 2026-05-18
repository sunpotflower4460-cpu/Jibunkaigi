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
import { isMobileFirebaseConfigured } from '../services/firebase/mobileFirebaseConfig';
import {
  createUniversalId,
  type UniversalRuntimeStatus,
} from '../../../packages/shared/src';

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
  isLoadingSessions: boolean;
  isSaving: boolean;
  isRemote: boolean;
  aiSource: 'proxy' | 'mock-fallback' | null;
  othersSource: 'proxy' | 'mock-fallback' | null;
  aiError: string | null;
  othersError: string | null;
  storageError: string | null;
  firebaseConfigured: boolean;
  proxyConfigured: boolean;
  isRemoteAiEnabled: boolean;
  runtimeStatus: UniversalRuntimeStatus;
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
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemote, setIsRemote] = useState(false);
  const [aiSource, setAiSource] = useState<'proxy' | 'mock-fallback' | null>(null);
  const [othersSource, setOthersSource] = useState<'proxy' | 'mock-fallback' | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [othersError, setOthersError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const firebaseConfigured = isMobileFirebaseConfigured();
  const proxyConfigured = isGeminiProxyConfigured();
  const isRemoteAiEnabled = proxyConfigured;

  // Refs to keep stable values inside async callbacks.
  const isThinkingRef = useRef(false);
  const isLoadingOthersRef = useRef(false);
  const saveOperationsRef = useRef(0);
  const messagesRef = useRef<UniversalMessage[]>([]);
  // Keep mode accessible inside timeout callbacks without stale closure.
  const modeRef = useRef<UniversalModeId>('dialogue');
  const sessionRef = useRef<UniversalSession>(session);

  // Keep sessionRef in sync with state.
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const runStorageTask = useCallback(async (task: () => Promise<void>) => {
    saveOperationsRef.current += 1;
    setIsSaving(true);
    try {
      await task();
      setStorageError(null);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStorageError(message);
      console.warn('[Jibunkaigi] Storage error:', error);
      return false;
    } finally {
      saveOperationsRef.current = Math.max(0, saveOperationsRef.current - 1);
      if (saveOperationsRef.current === 0) {
        setIsSaving(false);
      }
    }
  }, []);

  // Initialise: connect to Firestore if available and load sessions.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsLoadingSessions(true);
      try {
        const repo = await initRepository();
        if (cancelled) return;
        repoRef.current = repo;
        setIsRemote(repo.isRemoteEnabled());

        const list = await repo.listSessions();
        if (cancelled) return;

        if (list.length === 0) {
          const initial = createLocalSession();
          await runStorageTask(async () => {
            await repo.saveSession(initial);
          });
          if (cancelled) return;
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
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!cancelled) {
          setStorageError(message);
          console.warn('[Jibunkaigi] Session bootstrap error:', error);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSessions(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runStorageTask]);

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
      void runStorageTask(async () => {
        await repoRef.current.saveMessage(sessionRef.current.id, userMsg);
        await repoRef.current.saveSession({ ...updatedSession, messages: [] });
      });

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
          void runStorageTask(async () => {
            await repoRef.current.saveMessage(sessionId, agentMsg);
            await repoRef.current.saveSession({ ...afterReply, messages: [] });
            await refreshSessions();
          });
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
    [refreshSessions, runStorageTask, selectedAgent],
  );

  const requestOthers = useCallback(async () => {
    if (isThinkingRef.current || isLoadingOthersRef.current) return;
    const lastUser = [...messagesRef.current].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;

    // Capture origin session and messages snapshot at the time the request starts.
    const originSessionId = sessionRef.current.id;
    const messagesSnapshot = messagesRef.current;

    isLoadingOthersRef.current = true;
    setIsLoadingOthers(true);
    setOthersError(null);

    const groupId = createUniversalId('others');
    try {
      const result = await createUniversalOthersReplies({
        sessionId: originSessionId,
        userText: lastUser.text,
        currentAgentId: selectedAgent,
        modeId: modeRef.current,
        messages: messagesSnapshot,
      });

      // Guard: discard replies if the user navigated away from this session.
      if (sessionRef.current.id !== originSessionId) return;

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
      setOthersSource(result.source ?? null);

      void runStorageTask(async () => {
        for (const msg of agentMessages) {
          await repoRef.current.saveMessage(originSessionId, msg);
        }
        await repoRef.current.saveSession({ ...updated, messages: [] });
      });
    } catch (error) {
      setOthersError(error instanceof Error ? error.message : String(error));
    } finally {
      isLoadingOthersRef.current = false;
      setIsLoadingOthers(false);
    }
  }, [runStorageTask, selectedAgent]);

  const selectAgent = useCallback((agentId: UniversalAgentId) => {
    setSelectedAgent(agentId);
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
    void runStorageTask(async () => {
      await repoRef.current.clearMessages(cleared.id);
      await repoRef.current.saveSession({ ...cleared, messages: [] });
    });
  }, [runStorageTask]);

  const createNewSession = useCallback(() => {
    isThinkingRef.current = false;
    const newSession = createLocalSession();
    messagesRef.current = [];
    setIsThinking(false);
    setSession(newSession);
    void runStorageTask(async () => {
      await repoRef.current.saveSession(newSession);
      await refreshSessions();
    });
  }, [refreshSessions, runStorageTask]);

  const switchSession = useCallback(async (sessionId: string) => {
    isThinkingRef.current = false;
    setIsThinking(false);
    setIsLoadingSessions(true);
    try {
      const msgs = await repoRef.current.loadMessages(sessionId);
      const list = await repoRef.current.listSessions();
      const target = list.find((s) => s.id === sessionId);
      if (!target) return;

      setStorageError(null);
      messagesRef.current = msgs;
      setSession({ ...target, messages: msgs });
      setSessions(list);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStorageError(message);
      console.warn('[Jibunkaigi] Session switch error:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      let list: UniversalSession[] = [];
      const deleted = await runStorageTask(async () => {
        await repoRef.current.deleteSession(sessionId);
        list = await repoRef.current.listSessions();
      });
      if (!deleted) return;

      if (sessionRef.current.id === sessionId) {
        if (list.length > 0) {
          await switchSession(list[0].id);
          setSessions(list);
        } else {
          const newSession = createLocalSession();
          await runStorageTask(async () => {
            await repoRef.current.saveSession(newSession);
          });
          messagesRef.current = [];
          setSession(newSession);
          setSessions([newSession]);
        }
      } else {
        setSessions(list);
      }
    },
    [runStorageTask, switchSession],
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
      void runStorageTask(async () => {
        await repoRef.current.saveSession({ ...updated, messages: [] });
        await refreshSessions();
      });
    }
  }, [refreshSessions, runStorageTask, session]);

  const runtimeStatus: UniversalRuntimeStatus = {
    storageMode: isRemote ? 'remote' : 'local',
    aiMode: isRemoteAiEnabled ? 'proxy' : 'mock-fallback',
    isLoadingSessions,
    isSaving,
    isThinking,
    isLoadingOthers,
    aiError,
    othersError,
    storageError,
    firebaseConfigured,
    proxyConfigured,
  };

  return {
    session,
    sessions,
    messages: session.messages,
    selectedAgent,
    selectedMode,
    isThinking,
    isLoadingOthers,
    isLoadingSessions,
    isSaving,
    isRemote,
    aiSource,
    othersSource,
    aiError,
    othersError,
    storageError,
    firebaseConfigured,
    proxyConfigured,
    isRemoteAiEnabled,
    runtimeStatus,
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
