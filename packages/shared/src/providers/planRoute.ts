// 候補列の計算（純関数）。サーバーは状態を持たない。ロックはクライアントが持って送り返す。

import { ROUTE_TABLE } from './routeTable';
import type { PlanTier, ProviderId, Purpose } from './providerTypes';

export interface PlanRouteParams {
  tier: PlanTier;
  purpose: Purpose;
  /** さくらの約款確認が済むまで false。false なら候補から外す。 */
  enableSakura: boolean;
  /** 開発用：プロバイダを1つに固定する（DEV_TRACE_SECRET 認証済みのときだけ渡すこと）。 */
  forcedProvider?: ProviderId | null;
}

export function planRoute(params: PlanRouteParams): ProviderId[] {
  const available = (id: ProviderId) => params.enableSakura || id !== 'sakura';

  if (params.forcedProvider) {
    return available(params.forcedProvider) ? [params.forcedProvider] : [];
  }

  return ROUTE_TABLE[params.tier][params.purpose].filter(available);
}
