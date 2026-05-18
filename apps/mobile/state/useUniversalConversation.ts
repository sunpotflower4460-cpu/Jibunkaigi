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
import { copyTextToClipboard, shareText } from '../services/mobileClipboardShare';
import {
  createUniversalId,
  formatMessageForCopy,
  formatSessionForCopy,
  normalizeSessionTitle,
  sortUniversalSessions,
  type UniversalRuntimeStatus,
} from '../../../packages/shared/src';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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
  lastActionMessage: string | null;
  aiError: string | null;
  othersError: string | null;
  storageError: string | null;
  shareError: string | null;
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
  renameSession: (sessionId: string, title: string) => Promise<void>;
  togglePinSession: (sessionId: string) => Promise<void>;
  copyMessage: (messageId: string) => Promise<void>;
  shareMessage: (messageId: string) => Promise<void>;
  copyCurrentSession: () => Promise<void>;
  shareCurrentSession: () => Promise<void>;
}

interface UseUniversalConversationOptions {
  userName?: string | null;
}

export function useUniversalConversation(
  options: UseUniversalConversationOptions = {},
): UseUniversalConversationReturn {
  const repoRef = useRef<UniversalSessionRepository>(getSessionRepository());
  const resolvedUserName = options.userName?.trim() ? options.userName : 'あなた';

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
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [othersError, setOthersError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const firebaseConfigured = isMobileFirebaseConfigured();
  const proxyConfigured = isGeminiProxyConfigured();
  const isRemoteAiEnabled = proxyConfigured;

  const isThinkingRef = useRef(false);
  const isLoadingOthersRef = useRef(false);
  const saveOperationsRef = useRef(0);
  const messagesRef = useRef<UniversalMessage[]>([]);
  const sessionsRef = useRef<UniversalSession[]>([]);
  const modeRef = useRef<UniversalModeId>('dialogue');
  const sessionRef = useRef<UniversalSession>(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    if (!lastActionMessage) return undefined;
    const timeoutId = setTimeout(() => {
      setLastActionMessage(null);
    }, 2400);
    return () => clearTimeout(timeoutId);
  }, [lastActionMessage]);

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

  const refreshSessions = useCallback(async () => {
    const list = sortUniversalSessions(await repoRef.current.listSessions());
    setSessions(list);
    return list;
  }, []);

  const setActionResult = useCallback((message: string) => {
    setShareError(null);
    setLastActionMessage(message);
  }, []);

  const createExportMessage = useCallback((message: UniversalMessage) => ({
    role: message.role,
    text: message.text,
    agentLabel: message.agentLabel,
    createdAt: message.createdAt,
    origin: message.origin,
  }), []);

  const createCurrentSessionExportText = useCallback(() => {
    return formatSessionForCopy({
      title: sessionRef.current.title,
      messages: messagesRef.current.map(createExportMessage),
    });
  }, [createExportMessage]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsLoadingSessions(true);
      try {
        const repo = await initRepository();
        if (cancelled) return;
        repoRef.current = repo;
        setIsRemote(repo.isRemoteEnabled());

        const list = sortUniversalSessions(await repo.listSessions());
        if (cancelled) return;

        if (list.length === 0) {
          const initial = createLocalSession();
          await runStorageTask(async () => {
            await repo.saveSession(initial);
          });
          if (cancelled) return;
          messagesRef.current = [];
          setSession(initial);
          setSessions(sortUniversalSessions([initial]));
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

      void runStorageTask(async () => {
        await repoRef.current.saveMessage(sessionRef.current.id, userMsg);
        await repoRef.current.saveSession({ ...updatedSession, messages: [] });
        await refreshSessions();
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
            userName: resolvedUserName,
          });

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
    [refreshSessions, resolvedUserName, runStorageTask, selectedAgent],
  );

  const requestOthers = useCallback(async () => {
    if (isThinkingRef.current || isLoadingOthersRef.current) return;
    const lastUser = [...messagesRef.current].reverse().find((message) => message.role === 'user');
    if (!lastUser) return;

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
        userName: resolvedUserName,
      });

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
        await refreshSessions();
      });
    } catch (error) {
      setOthersError(error instanceof Error ? error.message : String(error));
    } finally {
      isLoadingOthersRef.current = false;
      setIsLoadingOthers(false);
    }
  }, [refreshSessions, resolvedUserName, runStorageTask, selectedAgent]);

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
      await refreshSessions();
    });
  }, [refreshSessions, runStorageTask]);

  const createNewSession = useCallback(() => {
    isThinkingRef.current = false;
    const newSession = createLocalSession();
    messagesRef.current = [];
    setIsThinking(false);
    setSession(newSession);
    setShareError(null);
    setLastActionMessage(null);
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
      const list = sortUniversalSessions(await repoRef.current.listSessions());
      const target = list.find((item) => item.id === sessionId);
      if (!target) return;

      setStorageError(null);
      setShareError(null);
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
        list = sortUniversalSessions(await repoRef.current.listSessions());
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
          setSessions(sortUniversalSessions([newSession]));
        }
      } else {
        setSessions(list);
      }
    },
    [runStorageTask, switchSession],
  );

  const renameSession = useCallback(
    async (sessionId: string, title: string) => {
      const target = sessionsRef.current.find((item) => item.id === sessionId)
        ?? (sessionRef.current.id === sessionId ? sessionRef.current : null);
      if (!target) return;

      const updatedAt = Date.now();
      const normalized = normalizeSessionTitle(title);
      const updated = {
        ...target,
        title: normalized,
        updatedAt,
      };

      const saved = await runStorageTask(async () => {
        await repoRef.current.saveSession({ ...updated, messages: [] });
        await refreshSessions();
      });

      if (!saved) {
        setStorageError('タイトルの保存に失敗しました');
        return;
      }

      if (sessionRef.current.id === sessionId) {
        setSession((current) => ({
          ...current,
          title: normalized,
          updatedAt,
        }));
      }

      setActionResult('タイトルを変更しました');
    },
    [refreshSessions, runStorageTask, setActionResult],
  );

  const togglePinSession = useCallback(
    async (sessionId: string) => {
      const target = sessionsRef.current.find((item) => item.id === sessionId)
        ?? (sessionRef.current.id === sessionId ? sessionRef.current : null);
      if (!target) return;

      const updatedAt = Date.now();
      const nextPinned = !target.pinned;
      const updated = {
        ...target,
        pinned: nextPinned,
        updatedAt,
      };

      const saved = await runStorageTask(async () => {
        await repoRef.current.saveSession({ ...updated, messages: [] });
        await refreshSessions();
      });

      if (!saved) {
        setStorageError('ピン留めの保存に失敗しました');
        return;
      }

      if (sessionRef.current.id === sessionId) {
        setSession((current) => ({
          ...current,
          pinned: nextPinned,
          updatedAt,
        }));
      }

      setActionResult(nextPinned ? 'ピン留めしました' : 'ピン留めを外しました');
    },
    [refreshSessions, runStorageTask, setActionResult],
  );

  const copyMessage = useCallback(
    async (messageId: string) => {
      const target = messagesRef.current.find((message) => message.id === messageId);
      if (!target) return;

      try {
        await copyTextToClipboard(formatMessageForCopy(createExportMessage(target)));
        setActionResult('コピーしました');
      } catch (error) {
        console.warn('[Jibunkaigi] Copy message error:', error);
        setShareError('コピーに失敗しました。もう一度お試しください。');
      }
    },
    [createExportMessage, setActionResult],
  );

  const shareMessage = useCallback(
    async (messageId: string) => {
      const target = messagesRef.current.find((message) => message.id === messageId);
      if (!target) return;

      try {
        const outcome = await shareText(
          formatMessageForCopy(createExportMessage(target)),
          sessionRef.current.title,
        );
        if (outcome === 'dismissed') return;
        setActionResult(outcome === 'copied' ? 'コピーしました' : '共有を開きました');
      } catch (error) {
        console.warn('[Jibunkaigi] Share message error:', error);
        setShareError('共有に失敗しました。もう一度お試しください。');
      }
    },
    [createExportMessage, setActionResult],
  );

  const copyCurrentSession = useCallback(async () => {
    try {
      await copyTextToClipboard(createCurrentSessionExportText());
      setActionResult('コピーしました');
    } catch (error) {
      console.warn('[Jibunkaigi] Copy session error:', error);
      setShareError('コピーに失敗しました。もう一度お試しください。');
    }
  }, [createCurrentSessionExportText, setActionResult]);

  const shareCurrentSession = useCallback(async () => {
    try {
      const outcome = await shareText(createCurrentSessionExportText(), sessionRef.current.title);
      if (outcome === 'dismissed') return;
      setActionResult(outcome === 'copied' ? 'コピーしました' : '共有を開きました');
    } catch (error) {
      console.warn('[Jibunkaigi] Share session error:', error);
      setShareError('共有に失敗しました。もう一度お試しください。');
    }
  }, [createCurrentSessionExportText, setActionResult]);

  const startFromHint = useCallback(
    (hint: string) => {
      sendMessage(hint);
    },
    [sendMessage],
  );

  useEffect(() => {
    const firstUser = session.messages.find((message) => message.role === 'user');
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
    lastActionMessage,
    aiError,
    othersError,
    storageError,
    shareError,
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
    lastActionMessage,
    aiError,
    othersError,
    storageError,
    shareError,
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
    renameSession,
    togglePinSession,
    copyMessage,
    shareMessage,
    copyCurrentSession,
    shareCurrentSession,
  };
}
