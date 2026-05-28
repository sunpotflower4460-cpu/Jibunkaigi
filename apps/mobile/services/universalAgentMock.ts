// Wrapper over @jibunkaigi/shared mock reply utilities.
// Maintains the existing API surface so callers do not need to change.
// Replace createUniversalAgentReply / pickUniversalDelegatedAgent with real
// Gemini Proxy calls in Phase 3.

import type { UniversalAgentId, UniversalModeId } from '../state/mobileTypes';
import {
  UNIVERSAL_AGENTS,
  buildMirrorMockReply,
  createUniversalMockReply,
  getThinkingText,
  pickMockDelegatedAgent,
} from '@jibunkaigi/shared';

// Agent display labels derived from the shared canonical definitions.
export const AGENT_LABELS: Record<UniversalAgentId, string> = Object.fromEntries(
  UNIVERSAL_AGENTS.map((a) => [a.id, a.label]),
) as Record<UniversalAgentId, string>;

// Thinking text per agent (dialogue mode baseline).
// MobileThinkingIndicator uses getThinkingText directly for mode-aware text.
export const AGENT_THINKING_TEXT: Record<UniversalAgentId, string> = Object.fromEntries(
  UNIVERSAL_AGENTS.map((a) => [a.id, getThinkingText(a.id, 'dialogue')]),
) as Record<UniversalAgentId, string>;

// Returns a mode-aware mock reply for the given agent.
export function createUniversalAgentReply(
  agentId: UniversalAgentId,
  userText: string,
  modeId: UniversalModeId = 'dialogue',
): string {
  const result = createUniversalMockReply({
    agentId,
    modeId,
    userText,
    previousMessages: [],
  });
  return result.text;
}

// 心の鏡: mode-aware reply from userText.
export function createMirrorReply(lastText: string, modeId: UniversalModeId = 'dialogue'): string {
  return buildMirrorMockReply([], lastText, modeId);
}

// 心の鏡 summary response using the full message history.
export function createMirrorSummaryReply(
  userMessages: string[],
  modeId: UniversalModeId = 'dialogue',
): string {
  if (userMessages.length < 2) {
    return 'まずはもう少し言葉を置いても大丈夫です。';
  }
  const previousMessages = userMessages.slice(0, -1).map((text) => ({
    role: 'user' as const,
    text,
  }));
  const lastText = userMessages[userMessages.length - 1];
  return buildMirrorMockReply(previousMessages, lastText, modeId);
}

// Selects a real agent when "delegate" mode is active.
// Replace with pickContextualAgent logic in Phase 3.
export function pickUniversalDelegatedAgent(userText: string): UniversalAgentId {
  return pickMockDelegatedAgent(userText);
}
