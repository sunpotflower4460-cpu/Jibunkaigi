// Universal conversation hook for iOS / Android / Web.
// All state is in-memory — no Firebase or Gemini connected yet.
// Replace service calls with real adapters in Phase 3.

import { useState, useCallback, useRef } from 'react';
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
import { createLocalSession } from '../services/universalSessionLocal';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface UseUniversalConversationReturn {
  session: UniversalSession;
  messages: UniversalMessage[];
  selectedAgent: UniversalAgentId;
  selectedMode: UniversalModeId;
  isThinking: boolean;
  sendMessage: (text: string) => void;
  selectAgent: (agentId: UniversalAgentId) => void;
  selectMode: (modeId: UniversalModeId) => void;
  clearConversation: () => void;
  startFromHint: (hint: string) => void;
  createNewSession: () => void;
}

export function useUniversalConversation(): UseUniversalConversationReturn {
  const [session, setSession] = useState<UniversalSession>(() => createLocalSession());
  const [selectedAgent, setSelectedAgent] = useState<UniversalAgentId>('ray');
  const [selectedMode, setSelectedMode] = useState<UniversalModeId>('dialogue');
  const [isThinking, setIsThinking] = useState(false);

  // Refs to keep stable values inside async timeout callbacks.
  const isThinkingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesRef = useRef<UniversalMessage[]>([]);
  // Keep mode accessible inside timeout callbacks without stale closure.
  const modeRef = useRef<UniversalModeId>('dialogue');

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
      setSession((prev) => ({
        ...prev,
        messages: messagesRef.current,
        updatedAt: Date.now(),
      }));

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
        setSession((prev) => ({
          ...prev,
          messages: messagesRef.current,
          updatedAt: Date.now(),
        }));

        isThinkingRef.current = false;
        setIsThinking(false);
      }, delay);
    },
    [selectedAgent],
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
    setSession((prev) => ({ ...prev, messages: [], updatedAt: Date.now() }));
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
  }, []);

  const startFromHint = useCallback(
    (hint: string) => {
      sendMessage(hint);
    },
    [sendMessage],
  );

  return {
    session,
    messages: session.messages,
    selectedAgent,
    selectedMode,
    isThinking,
    sendMessage,
    selectAgent,
    selectMode,
    clearConversation,
    startFromHint,
    createNewSession,
  };
}
