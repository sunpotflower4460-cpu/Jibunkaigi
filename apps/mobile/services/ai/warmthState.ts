import type { UniversalWarmthState } from './aiClientTypes';

/** レスポンスの warmth を、期待する形（agentId -> { particleId: number }）だけ受け入れる。 */
export function isWarmthState(value: unknown): value is UniversalWarmthState {
  if (!value || typeof value !== 'object') return false;
  return Object.values(value as Record<string, unknown>).every(
    (agentWarmth) =>
      !!agentWarmth &&
      typeof agentWarmth === 'object' &&
      Object.values(agentWarmth as Record<string, unknown>).every((v) => typeof v === 'number'),
  );
}
