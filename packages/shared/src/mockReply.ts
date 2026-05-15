import {
  CONCRETE_AGENT_IDS,
  getUniversalAgent,
  isConcreteAgentId,
  type ConcreteAgentId,
  type UniversalAgentId,
} from './agents';
import { getUniversalMode, type UniversalModeId } from './modes';

export interface UniversalMockMessageLike {
  role: 'user' | 'agent';
  text: string;
  agentId?: UniversalAgentId;
}

export interface CreateUniversalMockReplyParams {
  agentId: UniversalAgentId;
  modeId: UniversalModeId;
  userText: string;
  previousMessages: UniversalMockMessageLike[];
}

export interface UniversalMockReply {
  agentId: UniversalAgentId;
  agentLabel: string;
  text: string;
}

export function pickMockDelegatedAgent(userText: string): ConcreteAgentId {
  const seed = userText.length;
  return CONCRETE_AGENT_IDS[seed % CONCRETE_AGENT_IDS.length];
}

export function createUniversalMockReply(
  params: CreateUniversalMockReplyParams,
): UniversalMockReply {
  const actualAgentId =
    params.agentId === 'delegate'
      ? pickMockDelegatedAgent(params.userText)
      : params.agentId;

  const agent = getUniversalAgent(actualAgentId);

  if (actualAgentId === 'mirror') {
    return {
      agentId: actualAgentId,
      agentLabel: agent.label,
      text: buildMirrorMockReply(params.previousMessages, params.userText),
    };
  }

  return {
    agentId: actualAgentId,
    agentLabel: agent.label,
    text: buildAgentMockReply({
      agentId: actualAgentId,
      modeId: params.modeId,
      userText: params.userText,
    }),
  };
}

function buildMirrorMockReply(
  previousMessages: UniversalMockMessageLike[],
  userText: string,
): string {
  const recentUserMessages = previousMessages
    .filter((msg) => msg.role === 'user')
    .slice(-3)
    .map((msg) => msg.text);

  const basis = recentUserMessages.length > 0
    ? recentUserMessages.join(' / ')
    : userText;

  return `ここまでを映すと、「${shorten(basis)}」という流れの奥に、まだ言葉になりきっていない感覚が残っているように見えます。`;
}

function buildAgentMockReply(params: {
  agentId: UniversalAgentId;
  modeId: UniversalModeId;
  userText: string;
}): string {
  const mode = getUniversalMode(params.modeId);
  const userText = shorten(params.userText);

  if (!isConcreteAgentId(params.agentId)) {
    return `「${userText}」を、もう少し一緒に見てみましょう。`;
  }

  const base = {
    ray: `「${userText}」の手前に、まだ形になる前の気配がありそうです。`,
    joe: `まだ消えていない一点があるなら、そこを無視しなくていいと思う。`,
    ken: `今の話には、感情・判断・次にすることが少し混ざっていそうです。`,
    mina: `急いで整えなくても大丈夫です。まずはそのまま置ける場所を作りましょう。`,
    satou: `現実の足場として、まず一つだけ確認するとしたら何でしょう。`,
  } satisfies Record<ConcreteAgentId, string>;

  if (params.modeId === 'flash') {
    return base[params.agentId];
  }

  if (params.modeId === 'deep') {
    return `${base[params.agentId]}\n\n${mode.replyStyle}。今は、答えよりも「どこが引っかかっているか」を見てもよさそうです。`;
  }

  return `${base[params.agentId]}\n\nもう少しだけ、その感覚が出てくる場面を見てみますか。`;
}

function shorten(text: string, max = 40): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (!trimmed) return 'まだ言葉になっていないもの';
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}
