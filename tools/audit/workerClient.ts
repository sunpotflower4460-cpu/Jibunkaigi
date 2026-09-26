// ローカル Worker への呼び出し。本番と同じ経路（危機判定・材料の検証・ルーティング）を通す。

import type { AuditEnv } from './auditEnv.ts';

export type ProviderId = 'groq' | 'sakura' | 'luna' | 'sol' | 'deepseek';

export interface WorkerUsage {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningTokens?: number;
}

export interface WorkerCallResult {
  status: number;
  latencyMs: number;
  body: Record<string, unknown>;
}

export async function callWorker(
  env: AuditEnv,
  path: '/api/jibunkaigi/reply' | '/api/jibunkaigi/others',
  body: unknown,
  options: { provider?: ProviderId; tier?: string } = {},
): Promise<WorkerCallResult> {
  const startedAt = performance.now();
  const response = await fetch(`${env.workerUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Jibunkaigi-Dev-Trace': env.devSecret,
      ...(options.provider ? { 'X-Jibunkaigi-Dev-Provider': options.provider } : {}),
      ...(options.tier ? { 'X-Jibunkaigi-Dev-Tier': options.tier } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  const latencyMs = Math.round(performance.now() - startedAt);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    parsed = { error: 'non-JSON response', raw: text.slice(0, 500) };
  }
  return { status: response.status, latencyMs, body: parsed };
}
