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
  pickDelegateByContext,
  isConcreteAgentId,
  type ConcreteAgentId,
  type DelegateMessageLike,
  type UniversalComposerVisibility,
  type UniversalRuntimeStatus,
} from '@jibunkaigi/shared';

async function initRepository(): Promise<UniversalSessionRepository> {
  const firestoreRepo = createFirestoreRepository();
  if (firestoreRepo) {
    setSessionRepository(firestoreRepo);
    return firestoreRepo;
  }
  return getSessionRepository();
}

/**
 * Find the concrete agentId of the most recent *direct* (non-others) agent
 * message in a loaded message list. Used to restore lastResolvedAgentId when
 * switching sessions / bootstrapping so the OTHERS exclusion basis does not
 * carry over a stale value from a previous session. Returns null when there is
 * no direct concrete agent message.
 */
function findLastResolvedConcreteAgent(
  messages: UniversalMessage[],
): ConcreteAgentId | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg.role !== 'agent') continue;
    if (msg.origin === 'others') continue;
    if (msg.agentId && isConcreteAgentId(msg.agentId)) {
      return msg.agentId;
    }
  }
  return null;
}

interface UseUniversalConversationReturn {
  session: UniversalSession;
  sessions: UniversalSession[];
  messages: UniversalMessage[];
  composerVisibility: UniversalComposerVisibility;
  isComposerOpen: boolean;
  selectedAgent: UniversalAgentId;
  selectedMode: UniversalModeId;
  // Resolved-voice state (Phase 0-1), decoupled from selectedAgent:
  // pendingResolvedAgentId holds the concrete voice chosen at send time
  // (read by future convergence animation); lastResolvedAgentId is the most
  // recent actual speaker (basis for OTHERS exclusion).
  pendingResolvedAgentId: ConcreteAgentId | null;
  lastResolvedAgentId: ConcreteAgentId | null;
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
  requestOthers: (messageId?: string) => Promise<void>;
  openComposer: () => void;
  closeComposer: () => void;
  toggleComposer: () => void;
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
  deleteMessage: (messageId: string) => Promise<void>;
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
  const [composerVisibility, setComposerVisibility] =
    useState<UniversalComposerVisibility>('open');
  const [selectedAgent, setSelectedAgent] = useState<UniversalAgentId>('ray');
  const [selectedMode, setSelectedMode] = useState<UniversalModeId>('dialogue');
  // Resolved-voice state. Kept separate from selectedAgent (the user's entry
  // point) so UI / AI / OTHERS can all reference the same actual speaker.
  const [pendingResolvedAgentId, setPendingResolvedAgentId] =
    useState<ConcreteAgentId | null>(null);
  const [lastResolvedAgentId, setLastResolvedAgentId] =
    useState<ConcreteAgentId | null>(null);
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
  // Mirror of lastResolvedAgentId for use inside async callbacks without
  // adding it to their dependency arrays (keeps OTHERS reading a fresh value).
  const lastResolvedAgentIdRef = useRef<ConcreteAgentId | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    lastResolvedAgentIdRef.current = lastResolvedAgentId;
  }, [lastResolvedAgentId]);

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

  const openComposer = useCallback(() => {
    setComposerVisibility('open');
  }, []);

  const closeComposer = useCallback(() => {
    setComposerVisibility('collapsed');
  }, []);

  const toggleComposer = useCallback(() => {
    setComposerVisibility((current) => (current === 'open' ? 'collapsed' : 'open'));
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
          setPendingResolvedAgentId(null);
          setLastResolvedAgentId(null);
        } else {
          const active = list[0];
          const msgs = await repo.loadMessages(active.id);
          if (!cancelled) {
            messagesRef.current = msgs;
            setSession({ ...active, messages: msgs });
            setSessions(list);
            // Restore the most recent direct speaker so OTHERS exclusion is
            // correct on first load.
            setPendingResolvedAgentId(null);
            setLastResolvedAgentId(findLastResolvedConcreteAgent(msgs));
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
      closeComposer();

        const userMsg: UniversalMessage = {
        id: createUniversalId('message'),
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
      // selectedAgent is the user's entry point. When it is 'delegate', resolve
      // the concrete voice here (the single source of truth) so AI / proxy /
      // fallback / metadata / OTHERS all reference the same speaker. proxy and
      // fallback must NOT re-resolve delegate.
      const requestedAgentId = selectedAgent;
      const modeId = modeRef.current;
      const messagesSnapshot = messagesRef.current;
      const resolvedFromDelegate = requestedAgentId === 'delegate';
      const resolvedAgentId: UniversalAgentId = resolvedFromDelegate
        ? pickDelegateByContext(
            trimmed,
            messagesSnapshot as DelegateMessageLike[],
          )
        : requestedAgentId;

      // Surface the resolved voice immediately so future convergence animation
      // can read it before the reply arrives.
      if (isConcreteAgentId(resolvedAgentId)) {
        setPendingResolvedAgentId(resolvedAgentId);
      } else {
        setPendingResolvedAgentId(null);
      }

      void (async () => {
        try {
          const reply = await createUniversalAiReply({
            sessionId,
            userText: trimmed,
            agentId: resolvedAgentId,
            modeId,
            messages: messagesSnapshot,
            userName: resolvedUserName,
          });

          if (sessionRef.current.id !== sessionId) return;

          const agentMsg: UniversalMessage = {
            id: createUniversalId('message'),
            role: 'agent',
            text: reply.text,
            agentId: reply.agentId,
            agentLabel: reply.agentLabel || AGENT_LABELS[reply.agentId],
            modeId,
            createdAt: Date.now(),
            requestedAgentId,
            ...(resolvedFromDelegate ? { resolvedFromDelegate: true } : {}),
          };

          messagesRef.current = [...messagesRef.current, agentMsg];
          const afterReply: UniversalSession = {
            ...sessionRef.current,
            messages: messagesRef.current,
            updatedAt: Date.now(),
          };
          setSession(afterReply);
          setAiSource(reply.source);

          // Record the actual speaker as the most recent resolved voice.
          if (isConcreteAgentId(reply.agentId)) {
            setLastResolvedAgentId(reply.agentId);
          }
          setPendingResolvedAgentId(null);

          void runStorageTask(async () => {
            await repoRef.current.saveMessage(sessionId, agentMsg);
            await repoRef.current.saveSession({ ...afterReply, messages: [] });
            await refreshSessions();
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          setAiError(msg);
          setPendingResolvedAgentId(null);
          console.warn('[Jibunkaigi] AI reply error:', error);
        } finally {
          isThinkingRef.current = false;
          setIsThinking(false);
        }
      })();
    },
    [closeComposer, refreshSessions, resolvedUserName, runStorageTask, selectedAgent],
  );

  const requestOthers = useCallback(async (messageId?: string) => {
    if (isThinkingRef.current || isLoadingOthersRef.current) return;
    const lastUser = [...messagesRef.current].reverse().find((message) => message.role === 'user');
    const requestedMessage = messageId
      ? messagesRef.current.find((message) => message.id === messageId)
      : null;
    const targetUser = requestedMessage?.role === 'user'
      ? requestedMessage
      : lastUser;
    if (!targetUser) return;

    const originSessionId = sessionRef.current.id;
    const messagesSnapshot = messagesRef.current;

    isLoadingOthersRef.current = true;
    setIsLoadingOthers(true);
    setOthersError(null);

    const groupId = createUniversalId('others');
    try {
      // Provisional fix (Phase 0): exclude the actual most-recent speaker
      // rather than the fixed entry-point selection. The full design
      // (requestOthers(targetMessageId, excludeAgentId)) is Phase 3.
      const currentAgentId = lastResolvedAgentIdRef.current ?? selectedAgent;
      const result = await createUniversalOthersReplies({
        sessionId: originSessionId,
        userText: targetUser.text,
        currentAgentId,
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
    setPendingResolvedAgentId(null);
    setLastResolvedAgentId(null);
    openComposer();
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
  }, [openComposer, refreshSessions, runStorageTask]);

  const createNewSession = useCallback(() => {
    isThinkingRef.current = false;
    const newSession = createLocalSession();
    messagesRef.current = [];
    setIsThinking(false);
    setPendingResolvedAgentId(null);
    setLastResolvedAgentId(null);
    openComposer();
    setSession(newSession);
    setShareError(null);
    setLastActionMessage(null);
    void runStorageTask(async () => {
      await repoRef.current.saveSession(newSession);
      await refreshSessions();
    });
  }, [openComposer, refreshSessions, runStorageTask]);

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
      openComposer();
      setSession({ ...target, messages: msgs });
      setSessions(list);
      // Restore the last resolved speaker for the opened session so the OTHERS
      // exclusion basis does not carry over from the previous session.
      setPendingResolvedAgentId(null);
      setLastResolvedAgentId(findLastResolvedConcreteAgent(msgs));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStorageError(message);
      console.warn('[Jibunkaigi] Session switch error:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [openComposer]);

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
          openComposer();
          setSession(newSession);
          setSessions(sortUniversalSessions([newSession]));
          setPendingResolvedAgentId(null);
          setLastResolvedAgentId(null);
        }
      } else {
        setSessions(list);
      }
    },
    [openComposer, runStorageTask, switchSession],
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

  const deleteMessage = useCallback(
    async (messageId: string) => {
      const currentSession = sessionRef.current;
      const currentMessages = messagesRef.current;
      const target = currentMessages.find((message) => message.id === messageId);
      if (!target) return;

      const nextMessages = currentMessages.filter((message) => message.id !== messageId);
      const updatedSession: UniversalSession = {
        ...currentSession,
        messages: nextMessages,
        updatedAt: Date.now(),
      };

      messagesRef.current = nextMessages;
      setSession(updatedSession);

      const saved = await runStorageTask(async () => {
        await repoRef.current.deleteMessage(currentSession.id, messageId);
        await repoRef.current.saveSession({ ...updatedSession, messages: [] });
        await refreshSessions();
      });

      if (!saved) {
        messagesRef.current = currentMessages;
        setSession(currentSession);
        setStorageError('メッセージの削除に失敗しました。');
        return;
      }

      // If a direct concrete agent message was removed, the last resolved
      // speaker may have changed. Recompute from the remaining messages so the
      // OTHERS exclusion basis does not keep pointing at a deleted voice.
      if (
        target.role === 'agent' &&
        target.origin !== 'others' &&
        target.agentId &&
        isConcreteAgentId(target.agentId)
      ) {
        setLastResolvedAgentId(findLastResolvedConcreteAgent(nextMessages));
      }

      setActionResult('メッセージを削除しました');
    },
    [refreshSessions, runStorageTask, setActionResult],
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
    composerVisibility,
    isComposerOpen: composerVisibility === 'open',
    selectedAgent,
    selectedMode,
    pendingResolvedAgentId,
    lastResolvedAgentId,
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
    openComposer,
    closeComposer,
    toggleComposer,
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
    deleteMessage,
    copyCurrentSession,
    shareCurrentSession,
  };
}
