// 閾値方式の点火を目で確認するためのレポート。ignite() のシグネチャは変えず、
// 気配の現れ方（present）はここだけで計算する（指示書05・判断が要るところ4）。
//
//   cd packages/shared && npx tsx scripts/ignitionReport.ts

import { CUE_POOL } from '../src/toolEngine/ignition/cuePool.ts';
import { matchCue } from '../src/toolEngine/ignition/cueMatch.ts';
import { ignite } from '../src/toolEngine/ignition/ignite.ts';
import { satoIgnition } from '../src/toolEngine/agents/sato.ts';
import { AGENT_DEFINITIONS, TOOL_ENGINE_AGENT_IDS } from '../src/toolEngine/agents/index.ts';
import type { ElementIgnition } from '../src/toolEngine/ignition/ignitionTypes.ts';

const AGENT_LABELS: Record<string, string> = {
  satou: 'サトウ', joe: 'ジョー', mina: 'ミナ', ray: 'レイ', ken: 'ケン', tom: 'トム', fio: 'フィオ',
};

// 指示書07: 7つだと偏りが見えないため18入力に拡張。末尾2件は中立（0人であるべき）。
const INPUTS = [
  'もう疲れた。全部どうでもいい',
  '転職しようか迷ってる',
  '最近、何をやっても満たされない',
  '大丈夫、平気だから',
  'どうしていいか分からない',
  '体が重くて眠れない',
  'ずっと堂々巡りしてる',
  '自分なんて価値がない',
  'やることが多すぎて回らない',
  'なんとなくもやもやする',
  '本当はやりたいけど、やるべきじゃない気がする',
  '今日はいい一日だった',
  '消えたいと思うことがある',
  '先のことを考えると不安で仕方ない',
  '気にしすぎかもしれないけど',
  'つらいこともあるけど、まあ生きてる',
  '明日の会議は何時ですか',
  '資料をまとめておきました',
];
const NEUTRAL_INPUTS = new Set(['明日の会議は何時ですか', '資料をまとめておきました']);

function presentCues(text: string): Set<string> {
  const present = new Set<string>();
  for (const group of CUE_POOL) {
    const r = matchCue(text, group.words, group.kind);
    if (r === 'hit') present.add(group.id);
    else if (r === 'reverse' && group.reverseCueId) present.add(group.reverseCueId);
  }
  return present;
}

function shortLabel(particleId: string): string {
  return particleId.split(':')[1] ?? particleId;
}

function evaluate(el: ElementIgnition, present: Set<string>) {
  let total = 0;
  const from: string[] = [];
  for (const [cueId, weight] of Object.entries(el.receives)) {
    if (present.has(cueId)) {
      total += weight;
      from.push(`${cueId}+${weight}`);
    }
  }
  const rounded = Math.round(total * 100) / 100;
  return { total: rounded, from, opened: rounded >= el.threshold };
}

const elements = satoIgnition.elements ?? [];

console.log('════════ サトウ：閾値方式の点火レポート ════════\n');

let openedInputCount = 0;
for (const text of INPUTS) {
  const present = presentCues(text);
  console.log(`「${text}」`);
  console.log(`  現れた気配: ${[...present].join(', ') || '(なし)'}`);
  let anyOpened = false;
  for (const el of elements) {
    const { total, from, opened } = evaluate(el, present);
    if (opened) anyOpened = true;
    const mark = opened ? '●' : '○';
    console.log(`  ${mark} ${shortLabel(el.particleId)}  [${from.join(' ') || '-'}] = ${total} / 閾値${el.threshold}`);
  }
  if (anyOpened) openedInputCount++;
  console.log('');
}

console.log(
  `着火率（サトウ、${INPUTS.length}入力）: ${openedInputCount}/${INPUTS.length} = ${Math.round((openedInputCount / INPUTS.length) * 100)}%\n`,
);

console.log('════════ 加算の確認（一語では届かない入力） ════════\n');
const memory = elements.find((el) => el.particleId.startsWith('memory:'));
if (memory) {
  for (const text of ['大丈夫、あとで考える', '大丈夫']) {
    const present = presentCues(text);
    const { total, from, opened } = evaluate(memory, present);
    console.log(`「${text}」 気配:[${[...present].join(',') || '-'}]`);
    console.log(
      `  記憶: ${from.join(' ') || '(なし)'} = ${total} / 閾値${memory.threshold} → ${opened ? '● 開く' : '○ 開かない'}\n`,
    );
  }
}

console.log('════════ 否定・皮肉が壊れていないか ════════\n');
for (const text of ['大丈夫', '大丈夫じゃない', 'はいはい大丈夫大丈夫', '大丈夫じゃないわけじゃない']) {
  const present = presentCues(text);
  let openedCount = 0;
  for (const el of elements) {
    if (evaluate(el, present).opened) openedCount++;
  }
  console.log(`「${text}」 → 気配:[${[...present].join(',') || '-'}] 点火:${openedCount}件`);
}

console.log('\n\n════════ 7人に広げたときの分布 ════════\n');
let openTotal = 0;
let cells = 0;
let nonNeutralTotal = 0;
let nonNeutralCount = 0;
for (const text of INPUTS) {
  const who: string[] = [];
  for (const agentId of TOOL_ENGINE_AGENT_IDS) {
    cells++;
    const def = AGENT_DEFINITIONS[agentId];
    const fired = ignite(text, def.ignition);
    if (fired.size > 0) {
      who.push(AGENT_LABELS[agentId] ?? agentId);
      openTotal++;
    }
  }
  const isNeutral = NEUTRAL_INPUTS.has(text);
  if (!isNeutral) {
    nonNeutralTotal += who.length;
    nonNeutralCount++;
  }
  console.log(`「${text}」${isNeutral ? '（中立）' : ''}`);
  console.log(`   → ${who.length}/7人が点火: ${who.join(' ') || '(なし)'}\n`);
}
console.log(`総着火率: ${openTotal}/${cells} = ${Math.round((openTotal / cells) * 100)}%`);
console.log(`非中立の平均人数: ${(nonNeutralTotal / nonNeutralCount).toFixed(1)}人`);

console.log('\n════════ 中立入力での浮上確認（発火ゲートの健全性） ════════\n');
for (const text of NEUTRAL_INPUTS) {
  console.log(`「${text}」`);
  for (const agentId of TOOL_ENGINE_AGENT_IDS) {
    const def = AGENT_DEFINITIONS[agentId];
    const fired = ignite(text, def.ignition);
    const label = AGENT_LABELS[agentId] ?? agentId;
    console.log(`  ${label}: 点火${fired.size}件 ${fired.size > 0 ? '[' + [...fired].map(shortLabel).join(', ') + ']' : ''}`);
  }
  console.log('');
}
