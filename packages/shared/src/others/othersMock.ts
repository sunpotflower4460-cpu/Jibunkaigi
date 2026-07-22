import {
  CONCRETE_AGENT_IDS,
  getUniversalAgent,
  type ConcreteAgentId,
} from '../agents';
import { createUniversalMockReply } from '../mockReply';
import type {
  UniversalOthersReply,
  UniversalOthersRequest,
  UniversalOthersResponse,
} from './othersTypes';

export function createUniversalOthersMockResponse(
  request: UniversalOthersRequest,
): UniversalOthersResponse {
  const requestedTargets: ConcreteAgentId[] =
    request.targetAgentIds?.length ? request.targetAgentIds : CONCRETE_AGENT_IDS;
  // Exclude the already-spoken voice so OTHERS brings *different* angles.
  // currentAgentId may be a non-concrete id (mirror/delegate); in that case
  // nothing is filtered. Guard against an empty result.
  const excluded = requestedTargets.filter((id) => id !== request.currentAgentId);
  const targets: ConcreteAgentId[] = excluded.length > 0 ? excluded : requestedTargets;

  const replies: UniversalOthersReply[] = targets.map((agentId) => {
    const reply = createUniversalMockReply({
      agentId,
      modeId: request.modeId,
      userText: request.userText,
      previousMessages: request.messages,
    });
    return {
      agentId,
      agentLabel: getUniversalAgent(agentId).label,
      text: reply.text,
      // The offline mock has no activation-driven stance; neutral is the safe default.
      position: 'neutral',
    };
  });

  return {
    replies,
    source: 'mock-fallback',
  };
}
