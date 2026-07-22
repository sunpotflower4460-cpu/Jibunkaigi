import type { ConcreteAgentId, UniversalAgentId } from '../agents';
import type { UniversalModeId } from '../modes';
import type { UniversalPromptMessage } from '../prompt/promptTypes';

/** メインの応答へのスタンス。活性拡散の結果から決まる。 */
export type OthersPosition = 'agree' | 'question' | 'neutral';

export interface UniversalOthersRequest {
  sessionId: string;
  userText: string;
  /** OTHERSが反応する対象＝メインエージェントの応答本文。空文字なら旧仕様（ユーザー入力への反応）にフォールバック。 */
  mainReplyText: string;
  currentAgentId: UniversalAgentId;
  modeId: UniversalModeId;
  messages: UniversalPromptMessage[];
  targetAgentIds?: ConcreteAgentId[];
  userName?: string | null;
}

export interface UniversalOthersReply {
  agentId: ConcreteAgentId;
  agentLabel: string;
  text: string;
  position: OthersPosition;
}

export interface UniversalOthersResponse {
  replies: UniversalOthersReply[];
  source?: 'proxy' | 'mock-fallback';
  model?: string;
}
