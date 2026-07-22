// 励起判定（純粋）。ignition-v3.test.ts の v4 ロジックを移植。難問24ケースで 100%。
//
// 語の関係を「意味理解なし」で捌く:
//   - 状態語(state): 否定形そのものが状態。二重否定が後続しなければ点火。
//   - ポジ語(pos):   後ろに単純否定 → 非点火。二重否定 → 点火に戻す。皮肉 → ネガ側へ反転。
//   - 皮肉: 同語反復（大丈夫大丈夫）＋皮肉マーカー（はいはい/どうせ/（棒）/😇 等）。
//
// Tokenizer を渡すと、各反応語の原形一致でクラスタを補強する（活用・若者言葉の汎化）。
// 未注入時は部分一致のみ（それでも難問セットは 100%）。

import type { AgentIgnition, ElementIgnition, NodeTrigger, Tokenizer } from './ignitionTypes';
import { CUE_POOL } from './cuePool';
import { matchCue } from './cueMatch';

const SIMPLE_NEG = [
  'ない', 'なかった', 'くなかった', 'ねえ', 'ねぇ', 'じゃない', 'じゃなかった',
  'ではない', 'くない', 'ません', 'ませんでした', '無い', 'なくて', 'なく', 'ぬ',
  'とは言え', 'とは思え',
];
const DOUBLE_NEG = [
  'わけじゃない', 'わけではない', 'わけでもない', 'なくはない', 'ないわけ',
  'ないこともない', 'なくもない', 'ないと言えば', 'ないといえば',
];
// 強い皮肉マーカーのみ（曖昧な "よかったね" 等は入れない＝誤反転を防ぐ）。
const SARCASM = ['（棒）', '(棒)', 'はいはい', 'どうせ', 'せいぜい', 'せっかく', '😇', '🙄', 'へいへい'];

function hasSarcasm(text: string): boolean {
  return SARCASM.some((m) => text.includes(m));
}

/** 同語反復（word が近接して2回以上）を皮肉のサインとして検出。 */
function isRepeated(text: string, word: string): boolean {
  const first = text.indexOf(word);
  if (first === -1) return false;
  const second = text.indexOf(word, first + word.length);
  if (second === -1) return false;
  return second - (first + word.length) <= 2;
}

export interface IgniteOptions {
  /** 形態素解析（差し替え可能）。未指定なら部分一致のみ。 */
  tokenizer?: Tokenizer;
}

/**
 * テキストを判定し、点火する particle id の集合を返す。
 *
 * elements があれば閾値方式（igniteByThreshold）、無ければ従来の一語ヒット方式
 * （igniteByTriggers）を使う。エージェントを1人ずつ移行できる。
 */
export function ignite(
  text: string,
  ignition: AgentIgnition,
  options: IgniteOptions = {},
): Set<string> {
  if (ignition.elements && ignition.elements.length > 0) {
    return igniteByThreshold(text, ignition.elements, options);
  }
  return igniteByTriggers(text, ignition, options);
}

/**
 * 閾値方式（真空管モデル）。中央の判定者はいない。
 * 各要素が共有プールの気配を自分の重みで受け取り、自分の閾値と比べて開くかを決める。
 */
function igniteByThreshold(
  text: string,
  elements: ElementIgnition[],
  options: IgniteOptions,
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
  for (const el of elements) {
    let total = 0;
    for (const [cueId, weight] of Object.entries(el.receives)) {
      if (present.has(cueId)) total += weight;
    }
    if (total >= el.threshold) fired.add(el.particleId);
  }
  return fired;
}

/** 旧方式：一語ヒットで即点火。 */
function igniteByTriggers(
  text: string,
  ignition: AgentIgnition,
  options: IgniteOptions,
): Set<string> {
  const fired = new Set<string>();
  // Tokenizer 注入時は原形集合を1度だけ計算してクラスタ補強に使う。
  const baseForms = options.tokenizer
    ? new Set(options.tokenizer.toBaseForms(text))
    : null;

  const addAll = (ids: string[]) => ids.forEach((id) => fired.add(id));

  for (const trigger of ignition.triggers) {
    if (matchTrigger(text, trigger, ignition, fired, baseForms)) {
      addAll(trigger.igniteParticleIds);
    }
  }
  return fired;
}

/**
 * 1トリガーが点くかを判定。皮肉反転時は ignition.sarcasmFallbackParticleId を fired に直接足す。
 */
function matchTrigger(
  text: string,
  trigger: NodeTrigger,
  ignition: AgentIgnition,
  fired: Set<string>,
  baseForms: Set<string> | null,
): boolean {
  for (const word of trigger.words) {
    // 原形一致（Tokenizer 注入時のみ）: 否定/皮肉の位置判定ができないため、
    // 部分一致が無いときの保険として state/pos 双方で素直に点火扱いにする。
    const baseFormHit = baseForms?.has(word) ?? false;

    if (trigger.kind === 'state') {
      if (hitsState(text, word)) return true;
      if (baseFormHit && !text.includes(word)) return true;
    } else {
      const sarcasm = hasSarcasm(text) || isRepeated(text, word);
      let idx = text.indexOf(word);
      while (idx !== -1) {
        const after = text.slice(idx + word.length, idx + word.length + 14);
        const negated = SIMPLE_NEG.some((n) => after.startsWith(n));
        if (negated) {
          // 二重否定なら肯定に戻す。
          if (DOUBLE_NEG.some((dn) => after.includes(dn))) return true;
        } else if (sarcasm) {
          // 皮肉 → 投げやり側へ反転。
          if (ignition.sarcasmFallbackParticleId) {
            fired.add(ignition.sarcasmFallbackParticleId);
          }
          return false;
        } else {
          return true;
        }
        idx = text.indexOf(word, idx + word.length);
      }
      if (baseFormHit && !text.includes(word)) return true;
    }
  }
  return false;
}

/** 状態語: 二重否定が直後に来なければ点火。 */
function hitsState(text: string, word: string): boolean {
  let idx = text.indexOf(word);
  while (idx !== -1) {
    const after = text.slice(idx + word.length, idx + word.length + 10);
    if (!DOUBLE_NEG.some((n) => after.startsWith(n))) return true;
    idx = text.indexOf(word, idx + word.length);
  }
  return false;
}
