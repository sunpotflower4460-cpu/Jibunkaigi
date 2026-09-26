// クライアント（モバイル）が1つのチャットの中で持つルーティング状態（指示書12-1）。
// 温度（warmth）と同じく、サーバーは保存せずクライアントが送り返す。
// 新規チャット・クリア・切替で initialRouteState() に戻す（warmthRef と同じ場所で）。

import { isProviderId, type ProviderId } from './providerTypes';

export interface ConversationRouteState {
  /** このチャットで今使っているプロバイダ。 */
  routeLock: ProviderId | null;
  /** このチャットの中で切り替えが起きたことがあるか（以後ずっと true）。 */
  voiceCarryover: boolean;
}

export function initialRouteState(): ConversationRouteState {
  return { routeLock: null, voiceCarryover: false };
}

/** サーバー応答の provider / switched を状態に反映する。不正な値は無視する。 */
export function applyRouteResult(
  state: ConversationRouteState,
  result: { provider?: unknown; switched?: unknown },
): ConversationRouteState {
  return {
    routeLock: isProviderId(result.provider) ? result.provider : state.routeLock,
    voiceCarryover: state.voiceCarryover || result.switched === true,
  };
}
