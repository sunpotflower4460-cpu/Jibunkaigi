// 励起判定（純粋）。閾値方式（真空管モデル）。中央の判定者はいない。
// 各要素が共有プールの気配を自分の重みで受け取り、自分の閾値と比べて開くかを決める。
//
// 否定・二重否定・皮肉の判定ロジックは cueMatch.ts（ignition-v4 の移植、難問24ケースで100%）。

import type { AgentIgnition, Tokenizer } from './ignitionTypes';
import { CUE_POOL } from './cuePool';
import { matchCue } from './cueMatch';

export interface IgniteOptions {
  /** 形態素解析（差し替え可能）。未指定なら部分一致のみ。 */
  tokenizer?: Tokenizer;
}

/**
 * テキストを判定し、点火する particle id の集合を返す。
 */
export function ignite(
  text: string,
  ignition: AgentIgnition,
  options: IgniteOptions = {},
): Set<string> {
  // 1) どの気配が現れているか。共有プールを1回だけ走査する（要素ごとに舐め直さない）。
  const present = new Set<string>();
  for (const group of CUE_POOL) {
    const r = matchCue(text, group.words, group.kind, options.tokenizer);
    if (r === 'hit') present.add(group.id);
    else if (r === 'reverse' && group.reverseCueId) present.add(group.reverseCueId);
  }
  // 2) 各要素が自分で足して、自分の閾値と比べる。
  const fired = new Set<string>();
  for (const el of ignition.elements) {
    let total = 0;
    for (const [cueId, weight] of Object.entries(el.receives)) {
      if (present.has(cueId)) total += weight;
    }
    if (total >= el.threshold) fired.add(el.particleId);
  }
  return fired;
}
