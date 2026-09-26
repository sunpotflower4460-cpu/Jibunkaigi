// 候補列の計算（純関数）。サーバーは状態を持たない。ロックはクライアントが持って送り返す。

import { ROUTE_TABLE } from './routeTable';
import { isProviderId, type PlanTier, type ProviderId, type Purpose } from './providerTypes';

export interface PlanRouteParams {
  tier: PlanTier;
  purpose: Purpose;
  /** さくらの約款確認が済むまで false。false なら候補から外す。 */
  enableSakura: boolean;
  /**
   * このチャットで今使っているプロバイダ（クライアント申告）。候補列に含まれていれば、
   * その位置から後ろだけを試す（1つのチャットの中では、一度切り替えたら前に戻らない）。
   * 含まれていなければ（不正・別プラン）無視して先頭から。
   */
  routeLock?: unknown;
  /** 開発用：プロバイダを1つに固定する（DEV_TRACE_SECRET 認証済みのときだけ渡すこと）。 */
  forcedProvider?: ProviderId | null;
}

export interface PlannedRoute {
  /** 試す順のプロバイダ。 */
  candidates: ProviderId[];
  /** 候補列で検証済みのロック。無効なら null。 */
  routeLock: ProviderId | null;
}

export function planRoute(params: PlanRouteParams): PlannedRoute {
  const available = (id: ProviderId) => params.enableSakura || id !== 'sakura';
  const planned = ROUTE_TABLE[params.tier][params.purpose].filter(available);

  // ロックはプランの候補列で検証する（開発用の強制指定があっても同じ基準で）。
  const routeLock =
    isProviderId(params.routeLock) && planned.includes(params.routeLock) ? params.routeLock : null;

  if (params.forcedProvider) {
    return {
      candidates: available(params.forcedProvider) ? [params.forcedProvider] : [],
      routeLock,
    };
  }

  return {
    candidates: routeLock ? planned.slice(planned.indexOf(routeLock)) : planned,
    routeLock,
  };
}

/** 実際に使ったプロバイダが、検証済みのロックと違えば「切り替わった」。 */
export function resolveSwitched(routeLock: ProviderId | null, usedProvider: ProviderId): boolean {
  return routeLock !== null && routeLock !== usedProvider;
}
