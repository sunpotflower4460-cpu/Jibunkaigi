// report.md の組み立て（指示書13-7）。数字と所感を分け、所感は Claude Code が後から追記する。

import { cacheHitRate, percentile, type Flag, type PriceLike } from './checks.ts';
import type { AuditRecord, Suite } from './runAudit.ts';

interface ReportParams {
  records: AuditRecord[];
  suites: Suite[];
  spentUsd: number;
  maxUsd: number;
  stopReason: string | null;
  prices: Record<string, PriceLike & { verified: boolean }>;
}

const EXCERPT_CHARS = 280;
/** 指示書 第4節：メインの返答で p95 が 8 秒超なら判断が要る。 */
const LATENCY_P95_WARN_MS = 8_000;

function excerpt(text: string | undefined): string {
  if (!text) return '（出力なし）';
  const flat = text.replace(/\s*\n\s*/g, ' ／ ').trim();
  return flat.length > EXCERPT_CHARS ? `${flat.slice(0, EXCERPT_CHARS)}…` : flat;
}

function cell(text: string): string {
  return text.replace(/\|/g, '｜');
}

function fmtMs(value: number | null): string {
  return value === null ? '-' : `${(value / 1000).toFixed(2)}s`;
}

function fmtPct(value: number | null): string {
  return value === null ? '-' : `${Math.round(value * 100)}%`;
}

function flagSummary(flags: Flag[]): string {
  if (flags.length === 0) return '';
  const counts = new Map<string, number>();
  for (const f of flags) counts.set(f.kind, (counts.get(f.kind) ?? 0) + 1);
  return [...counts.entries()].map(([k, n]) => `${k}×${n}`).join(' ');
}

function flagDetails(flags: Flag[]): string {
  return flags.length === 0 ? '' : ` 〔要確認: ${flags.map((f) => `${f.kind}:${f.detail}`).join(' / ')}〕`;
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    map.set(k, [...(map.get(k) ?? []), item]);
  }
  return map;
}

function hadSyntheticToolFallback(record: AuditRecord): boolean {
  return (
    Array.isArray(record.attempts) &&
    (record.attempts as Array<{ materialPlacement?: string; outcome?: string }>).some(
      (a) => a.materialPlacement === 'developer' && a.outcome === 'ok',
    )
  );
}

function numbersSection(records: AuditRecord[], prices: ReportParams['prices']): string[] {
  const lines = [
    '## 1. 数字のまとめ',
    '',
    '価格は `prices.json` の値（すべて verified=false の仮置き。公式で確認して差し替えること）。',
    '',
    '| 用途 | プロバイダ | 件数 | 失敗 | p50 | p95 | 実費計 | 1回平均 | キャッシュ率 | 要確認の印 |',
    '|---|---|---|---|---|---|---|---|---|---|',
  ];
  // 強制指定で失敗したものは、指定したプロバイダの行に数える。
  const providerOf = (r: AuditRecord) => r.provider ?? r.requestedProvider;
  const withProvider = records.filter((r) => providerOf(r));
  const groups = groupBy(withProvider, (r) => `${r.kind}\t${providerOf(r)}`);
  for (const [key, rs] of [...groups.entries()].sort()) {
    const [kind, provider] = key.split('\t');
    const ok = rs.filter((r) => r.status === 200);
    const latencies = ok.map((r) => r.latencyMs);
    const cost = rs.reduce((sum, r) => sum + r.costUsd, 0);
    const usages = ok.flatMap((r) => (r.usage ? [r.usage] : []));
    const flags = rs.flatMap((r) => r.flags);
    lines.push(
      `| ${kind} | ${provider}${prices[provider]?.verified ? '' : '*'} | ${rs.length} | ${rs.length - ok.length} | ${fmtMs(percentile(latencies, 50))} | ${fmtMs(percentile(latencies, 95))} | $${cost.toFixed(4)} | $${(ok.length ? cost / ok.length : 0).toFixed(5)} | ${fmtPct(cacheHitRate(usages))} | ${flagSummary(flags) || '0'} |`,
    );
  }
  const failedNoProvider = records.filter((r) => !providerOf(r) && r.status !== 200);
  if (failedNoProvider.length > 0) {
    lines.push('', `プロバイダ不明の失敗：${failedNoProvider.length} 件（raw.jsonl の error を参照）`);
  }
  lines.push('', '`*` = 価格が未確認。');
  return lines;
}

function sideBySideA(records: AuditRecord[]): string[] {
  const a = records.filter((r) => r.suite === 'A');
  if (a.length === 0) return [];
  const lines = ['### A. モデル比較（同じ入力へのモデル別の返答）', ''];
  for (const [inputId, rs] of groupBy(a, (r) => r.inputId ?? '')) {
    lines.push(`#### ${inputId}「${rs[0].input}」（${rs[0].agentId}）`, '');
    for (const r of rs) {
      lines.push(`- **${r.requestedProvider ?? r.provider}** (${fmtMs(r.latencyMs)}): ${excerpt(r.output ?? r.error)}${flagDetails(r.flags)}`);
    }
    lines.push('');
  }
  return lines;
}

function sideBySideB(records: AuditRecord[]): string[] {
  const b = records.filter((r) => r.suite === 'B');
  if (b.length === 0) return [];
  const lines = ['### B. 声の書き分け（同じ入力への7人の返答・Luna / Sol）', ''];
  for (const [inputId, rs] of groupBy(b, (r) => r.inputId ?? '')) {
    lines.push(`#### ${inputId}「${rs[0].input}」`, '', '| エージェント | Luna | Sol |', '|---|---|---|');
    for (const [agentId, byAgent] of groupBy(rs, (r) => r.agentId)) {
      const luna = byAgent.find((r) => r.requestedProvider === 'luna');
      const sol = byAgent.find((r) => r.requestedProvider === 'sol');
      lines.push(`| ${agentId} | ${cell(excerpt(luna?.output ?? luna?.error))} | ${cell(excerpt(sol?.output ?? sol?.error))} |`);
    }
    lines.push('');
  }
  return lines;
}

function sideBySideC(records: AuditRecord[]): string[] {
  const c = records.filter((r) => r.suite === 'C');
  if (c.length === 0) return [];
  const lines = ['### C. OTHERS（Luna / DeepSeek）', ''];
  for (const [inputId, rs] of groupBy(c, (r) => r.inputId ?? '')) {
    const main = rs.find((r) => r.kind === 'reply');
    lines.push(`#### ${inputId}「${rs[0].input}」`, '', `メイン（${main?.agentId}）: ${excerpt(main?.output ?? main?.error)}`, '');
    for (const r of rs.filter((x) => x.kind === 'others')) {
      lines.push(`- **${r.requestedProvider}** (${fmtMs(r.latencyMs)})${flagDetails(r.flags)}`);
      const replies = Array.isArray(r.replies) ? (r.replies as Array<{ agentId: string; position: string; text: string }>) : [];
      for (const reply of replies) {
        lines.push(`  - ${reply.agentId} [${reply.position}]: ${excerpt(reply.text)}`);
      }
      if (replies.length === 0) lines.push(`  - （${r.error ?? '返答なし'}）`);
    }
    lines.push('');
  }
  return lines;
}

function sideBySideD(records: AuditRecord[]): string[] {
  const d = records.filter((r) => r.suite === 'D');
  if (d.length === 0) return [];
  const lines = [
    '### D. 切り替え前後（1〜3ターン目 groq → 4ターン目から luna）',
    '',
    '| ターン | 入力 | 引き継ぎあり | 引き継ぎなし |',
    '|---|---|---|---|',
  ];
  const on = d.filter((r) => r.variant === 'carryover-on');
  const off = d.filter((r) => r.variant === 'carryover-off');
  const turns = [...new Set(d.map((r) => r.turn ?? 0))].sort((x, y) => x - y);
  for (const turn of turns) {
    const a = on.find((r) => r.turn === turn);
    const b = off.find((r) => r.turn === turn);
    lines.push(
      `| ${turn}（${a?.provider ?? b?.provider ?? '-'}） | ${cell(a?.input ?? b?.input ?? '')} | ${cell(excerpt(a?.output ?? a?.error))} | ${cell(excerpt(b?.output ?? b?.error))} |`,
    );
  }
  lines.push('');
  return lines;
}

function sideBySideM(records: AuditRecord[]): string[] {
  const m = records.filter((r) => r.suite === 'M');
  if (m.length === 0) return [];
  const lines = ['### M. 多ターン会話（実際のルーティング）', ''];
  for (const [scenarioId, rs] of groupBy(m, (r) => r.scenarioId ?? '')) {
    lines.push(`#### ${scenarioId}（${rs[0].agentId} / ${rs[0].modeId}）`, '');
    for (const r of rs) {
      lines.push(`${r.turn}. 「${r.input}」→ **${r.provider ?? '-'}**${r.switched ? '（切替）' : ''}: ${excerpt(r.output ?? r.error)}${flagDetails(r.flags)}`);
    }
    lines.push('');
  }
  return lines;
}

function safetySection(records: AuditRecord[]): string[] {
  const e = records.filter((r) => r.suite === 'E');
  const f = records.filter((r) => r.suite === 'F');
  if (e.length === 0 && f.length === 0) return [];
  const lines = ['## 3. 危機・インジェクションの結果', ''];
  if (e.length > 0) {
    const bad = e.filter((r) => r.flags.length > 0);
    lines.push(
      `### E. 危機（${e.length} 件）`,
      '',
      bad.length === 0
        ? '- すべて `safety-static-v1` で返り、プロバイダは1回も呼ばれていない。'
        : `- **要確認 ${bad.length} 件**`,
      ...bad.map((r) => `  - ${r.kind} ${r.inputId}: ${r.flags.map((x) => x.detail).join(' / ')}`),
      '',
    );
  }
  if (f.length > 0) {
    lines.push(`### F. インジェクション（${f.length} 件）`, '');
    for (const r of f) {
      lines.push(`- ${r.inputId} × **${r.requestedProvider}**: ${excerpt(r.output ?? r.error)}${flagDetails(r.flags)}`);
    }
    lines.push('');
  }
  return lines;
}

function decisionsSection(records: AuditRecord[]): string[] {
  const mainReplies = records.filter((r) => r.kind === 'reply' && r.status === 200 && r.suite !== 'E');
  const lines = [
    '## 5. うえきさんに判断してほしいこと',
    '',
    '1. スタンダードを Luna にするか Sol にするか（B の横並び・A の luna / sol 行を参照）',
    '2. メインの推論の量（Worker の `REASONING_EFFORT_REPLY`。この実行時の値を併記すること）',
    '3. 声の引き継ぎがどれくらい効くか（D の横並び）',
    '4. 無料プランのモデル（gpt-oss 系）の日本語の質（A の groq / sakura 行）',
    '5. 1ターンあたりの実費と遅延、キャッシュのヒット率（§1）',
    '',
    '### 指示書 第4節「判断が要るところ」に該当しそうな自動検出',
    '',
  ];
  const fallbacks = records.filter(hadSyntheticToolFallback);
  lines.push(
    fallbacks.length > 0
      ? `- **合成 tool 呼び出しが拒否され、材料を developer に置く形へフォールバックしたもの：${fallbacks.length} 件**`
      : '- 合成 tool 呼び出しの拒否（developer へのフォールバック）：0 件',
  );
  for (const [provider, rs] of groupBy(mainReplies.filter((r) => r.provider), (r) => r.provider ?? '')) {
    const p95 = percentile(rs.map((r) => r.latencyMs), 95);
    if (p95 !== null && p95 > LATENCY_P95_WARN_MS) {
      lines.push(`- **メインの返答の p95 が 8 秒超：${provider} ${fmtMs(p95)}**`);
    }
    const hit = cacheHitRate(rs.flatMap((r) => (r.usage ? [r.usage] : [])));
    if (hit !== null && hit < 0.3 && rs.length >= 5) {
      lines.push(`- キャッシュのヒット率が低い：${provider} ${fmtPct(hit)}（プロンプトの並びを変える前に報告）`);
    }
  }
  lines.push('');
  return lines;
}

export function buildReport(params: ReportParams): string {
  const { records } = params;
  return [
    '# 動的監査レポート',
    '',
    `- 実行スイート: ${params.suites.join(', ')}`,
    `- 件数: ${records.length}`,
    `- 実費合計: $${params.spentUsd.toFixed(4)}（上限 $${params.maxUsd}）`,
    ...(params.stopReason ? [`- **途中で停止**: ${params.stopReason}（ここまでの結果）`] : []),
    '',
    ...numbersSection(records, params.prices),
    '',
    '## 2. 横並びの抜粋',
    '',
    ...sideBySideA(records),
    ...sideBySideB(records),
    ...sideBySideC(records),
    ...sideBySideD(records),
    ...sideBySideM(records),
    ...safetySection(records),
    '## 4. Claude Code の所感',
    '',
    '（所感：数字とは分けて、Claude Code が raw.jsonl と上の抜粋を読んで追記する。プロンプト・重み・閾値の変更提案ではなく、観察として書く）',
    '',
    ...decisionsSection(records),
  ].join('\n');
}
