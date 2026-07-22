import type {
  UniversalAgentId,
  UniversalMessage,
  UniversalModeId,
} from '../../state/mobileTypes';

/**
 * 前ターンの浮上活性（温度・指示書08）。agentId ごとの { particleId: activation }。
 * クライアントがセッション内で保持し、次のリクエストに送り返す。サーバーは保存しない。
 */
export type UniversalWarmthState = Record<string, Record<string, number>>;

export interface UniversalAiRequest {
  sessionId: string;
  userText: string;
  agentId: UniversalAgentId;
  modeId: UniversalModeId;
  messages: UniversalMessage[];
  userName?: string | null;
  /** このエージェントの前ターンの浮上活性。 */
  warmth?: UniversalWarmthState;
}

export interface UniversalAiResponse {
  text: string;
  agentId: UniversalAgentId;
  agentLabel: string;
  source: 'proxy' | 'mock-fallback';
  model?: string;
  /** 今回の浮上活性（次ターンの温度の素）。 */
  warmth?: UniversalWarmthState;
}

export interface UniversalAiClient {
  isRemoteEnabled(): boolean;
  createReply(request: UniversalAiRequest): Promise<UniversalAiResponse>;
}
