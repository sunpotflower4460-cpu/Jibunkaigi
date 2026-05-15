// Local conversation hook for Phase 2.
// All state is in-memory — no Firebase or Gemini connected yet.
// Replace service calls with real adapters in Phase 3.

import { useState, useCallback, useRef } from 'react';
import type { MobileAgentId, MobileMessage, MobileSession } from './mobileTypes';
import {
  createUniversalAgentReply,
} from '../services/universalAgentMock';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeSession(title = '新しい問い'): MobileSession {
  const now = Date.now();
  return { id: generateId(), title, createdAt: now, updatedAt: now, messages: [] };
}

interface UseMobileConversationReturn {
  session: MobileSession;
  messages: MobileMessage[];
  selectedAgent: MobileAgentId;
  isThinking: boolean;
  sendMessage: (text: string) => void;
  selectAgent: (agentId: MobileAgentId) => void;
  clearConversation: () => void;
  startFromHint: (hint: string) => void;
  createNewSession: () => void;
}

export function useMobileConversation(): UseMobileConversationReturn {
  const [session, setSession] = useState<MobileSession>(() => makeSession());
  const [selectedAgent, setSelectedAgent] = useState<MobileAgentId>('ray');
  const [isThinking, setIsThinking] = useState(false);

  // Refs to keep stable values inside async timeout callbacks.
  const isThinkingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mirror reply needs access to the latest messages list synchronously.
  const messagesRef = useRef<MobileMessage[]>([]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinkingRef.current) return;

      const userMsg: MobileMessage = {
        id: generateId(),
        role: 'user',
        text: trimmed,
        createdAt: Date.now(),
      };

      // Snapshot the current messages before the state update for mirror logic.
      const currentMessages = messagesRef.current;

      messagesRef.current = [...currentMessages, userMsg];
      setSession((prev) => ({
        ...prev,
        messages: messagesRef.current,
        updatedAt: Date.now(),
      }));

      isThinkingRef.current = true;
      setIsThinking(true);

      // Build the reply using universal shared mock (handles delegate and mirror internally).
      const reply = createUniversalAgentReply(
        selectedAgent,
        trimmed,
        currentMessages.map((m) => ({ role: m.role, text: m.text, agentId: m.agentId })),
      );

      const delay = 300 + Math.floor(Math.random() * 400);

      timeoutRef.current = setTimeout(() => {
        const agentMsg: MobileMessage = {
          id: generateId(),
          role: 'agent',
          text: reply.text,
          agentId: reply.agentId,
          agentLabel: reply.agentLabel,
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

  const selectAgent = useCallback((agentId: MobileAgentId) => {
    setSelectedAgent(agentId);
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
    const newSession = makeSession();
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
    isThinking,
    sendMessage,
    selectAgent,
    clearConversation,
    startFromHint,
    createNewSession,
  };
}

