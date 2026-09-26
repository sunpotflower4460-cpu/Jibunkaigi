// .env.audit の読み込み（git管理外）。値はログにも出力にも出さない。

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface AuditEnv {
  /** ローカルの Worker（wrangler dev）。既定 http://127.0.0.1:8787 */
  workerUrl: string;
  /** Worker の DEV_TRACE_SECRET と同じ値。開発用ヘッダの認証に使う。 */
  devSecret: string;
  /** 予算の上限（USD）。既定 3。 */
  maxUsd: number;
  /** 監査でさくらも回すか（Worker 側の ENABLE_SAKURA も true である必要がある）。既定 false。 */
  includeSakura: boolean;
}

const HERE = dirname(fileURLToPath(import.meta.url));

export function parseDotenv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).replace(/^export\s+/, '').trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

export function loadAuditEnv(explicitPath?: string): AuditEnv {
  const candidates = explicitPath
    ? [resolve(explicitPath)]
    : [join(HERE, '.env.audit'), join(HERE, '..', '..', '.env.audit')];
  const path = candidates.find((p) => existsSync(p));
  const fileValues = path ? parseDotenv(readFileSync(path, 'utf8')) : {};
  const read = (key: string) => process.env[key] ?? fileValues[key];

  const devSecret = read('DEV_TRACE_SECRET') ?? '';
  if (!devSecret) {
    throw new Error(
      '.env.audit に DEV_TRACE_SECRET がありません（Worker の .dev.vars と同じ値）。tools/audit/README.md を参照。',
    );
  }
  const maxUsd = Number(read('AUDIT_MAX_USD') ?? '3');
  return {
    workerUrl: (read('WORKER_URL') ?? 'http://127.0.0.1:8787').replace(/\/+$/, ''),
    devSecret,
    maxUsd: Number.isFinite(maxUsd) && maxUsd > 0 ? maxUsd : 3,
    includeSakura: read('AUDIT_INCLUDE_SAKURA') === 'true',
  };
}

/** 出力に秘密値が紛れ込まないよう、念のため伏せ字にする。 */
export function redact(text: string, secrets: string[]): string {
  let out = text;
  for (const secret of secrets) {
    if (secret && secret.length >= 4) out = out.split(secret).join('[redacted]');
  }
  return out;
}
