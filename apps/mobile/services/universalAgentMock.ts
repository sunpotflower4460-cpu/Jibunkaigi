// Universal agent mock service for Phase 2 local conversation.
// Uses the shared core from packages/shared for consistent behavior
// across iOS / Android / Web.
// Replace with Gemini Proxy calls in Phase 3.

import {
  createUniversalMockReply,
  pickMockDelegatedAgent as pickMockDelegatedAgentShared,
  UNIVERSAL_AGENTS,
  getThinkingText,
  type UniversalAgentId,
  type UniversalModeId,
  type UniversalMockMessageLike,
} from '../../../packages/shared/src';

export type { UniversalAgentId, UniversalModeId, UniversalMockMessageLike };

// Re-export agent list so UI can render without duplicating definitions.
export { UNIVERSAL_AGENTS };

// Thinking text for the given agent and mode.
export function getUniversalThinkingText(
  agentId: UniversalAgentId,
  modeId: UniversalModeId = 'dialogue',
): string {
  return getThinkingText(agentId, modeId);
}

// Selects a real agent when "delegate" is active (deterministic by text length).
export function pickMockDelegatedAgent(userText: string): UniversalAgentId {
  return pickMockDelegatedAgentShared(userText);
}

// Creates a mock reply using the shared universal logic.
export function createUniversalAgentReply(
  agentId: UniversalAgentId,
  userText: string,
  previousMessages: UniversalMockMessageLike[] = [],
  modeId: UniversalModeId = 'dialogue',
): { agentId: UniversalAgentId; agentLabel: string; text: string } {
  return createUniversalMockReply({
    agentId,
    modeId,
    userText,
    previousMessages,
  });
}
