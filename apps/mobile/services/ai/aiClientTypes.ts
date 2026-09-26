import type { ProviderId } from '@jibunkaigi/shared';
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
  /** このチャットで今使っているプロバイダ（指示書12。温度と同じくクライアントが送り返す）。 */
  routeLock?: ProviderId | null;
  /** このチャットの中でプロバイダの切り替えが起きたことがあるか。 */
  voiceCarryover?: boolean;
}

export interface UniversalAiResponse {
  text: string;
  agentId: UniversalAgentId;
  agentLabel: string;
  source: 'proxy' | 'mock-fallback';
  model?: string;
  /** 今回の浮上活性（次ターンの温度の素）。 */
  warmth?: UniversalWarmthState;
  /** 実際に応答したプロバイダ（proxy のときだけ）。 */
  provider?: ProviderId;
  /** このターンでプロバイダが切り替わったか（proxy のときだけ）。 */
  switched?: boolean;
}

export interface UniversalAiClient {
  isRemoteEnabled(): boolean;
  createReply(request: UniversalAiRequest): Promise<UniversalAiResponse>;
}
