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
  const targets: ConcreteAgentId[] =
    request.targetAgentIds?.length ? request.targetAgentIds : CONCRETE_AGENT_IDS;

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
    };
  });

  return {
    replies,
    source: 'mock-fallback',
  };
}
