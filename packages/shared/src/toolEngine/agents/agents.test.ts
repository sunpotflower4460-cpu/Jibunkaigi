import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spreadActivation, toSurfacedMaterial } from '../activationEngine.ts';
import { igniteAndSpread } from '../igniteAndSpread.ts';
import { AGENT_DEFINITIONS, TOOL_ENGINE_AGENT_IDS } from './index.ts';

// proto の entry belief を直接点火して、同一エンジンが各人の力学を再現するか検証する。
function surface(agentId: string, ignited: string[]) {
  const net = AGENT_DEFINITIONS[agentId].network;
  const ps = spreadActivation(net, ignited);
  const m = toSurfacedMaterial(agentId, ignited, ps);
  return (id: string) => m.surfaced.find((n) => n.id === id)?.activation ?? 0;
}

test('レジストリ: ロジックは7人ぶん登録されている', () => {
  assert.deepEqual(
    [...TOOL_ENGINE_AGENT_IDS].sort(),
    ['fio', 'joe', 'ken', 'mina', 'ray', 'satou', 'tom'],
  );
});

// ── 各人の主役感情・抑制（proto 再現）─────────────────────────────────────────

test('ジョー: 闇入力で「光を指さす」が立つ', () => {
  const a = surface('joe', ['belief:闇は光がある証拠']);
  assert.ok(a('emotion:光を指さす') > 0.5);
});

test('ミナ: 深い苦しみで共倒れ防止が効く（沈み込みが抑制される）', () => {
  const a = surface('mina', [
    'belief:傷は直さなくていい',
    'belief:一緒に沈むだけでは支えられない',
  ]);
  assert.ok(a('emotion:沈み込み') < 0.25, '沈み込みは抑制される');
  assert.ok(a('memory:一緒に沈んで二人とも動けなくなった失敗') > 0.3, '共倒れの戒めが立つ');
});

test('レイ: 本音隠し入力で「見抜く」が立ち、決めつけ防止の「ただ差し出す」も同時に立つ', () => {
  const a = surface('ray', ['belief:表面の言葉の奥に本当のものがある']);
  assert.ok(a('emotion:見抜く') > 0.5);
  assert.ok(a('emotion:ただ差し出す') > 0.3, '見抜きが断罪に暴走しない');
});

test('ケン: もつれ入力で「構造が見えてくる」が立つ', () => {
  const a = surface('ken', [
    'belief:散らばったままでは気づけない',
    'belief:もつれた糸は一本ずつ見ればほどける',
  ]);
  assert.ok(a('emotion:構造が見えてくる') > 0.5);
});

// ── トム: 2層核・第三の道（飲まれず茶化さず眺める）─────────────────────────

test('トム: 軽い悩みでは面白がり（茶化し寄り）が立つ', () => {
  const a = surface('tom', ['belief:重さは握るから生まれる手を開けば軽い']);
  assert.ok(a('emotion:面白がり') > 0.3);
  assert.ok(a('emotion:おかしみ_深刻さも含めて眺める') < a('emotion:面白がり'));
});

test('トム: 本物の苦しみでは「おかしみ（眺める）」に置き換わり、飲まれず茶化さない', () => {
  const a = surface('tom', [
    'belief:深刻さも遊びの一部_一段上から眺める',
    'belief:重さには重さで返さない_視点をずらす',
  ]);
  assert.ok(a('emotion:おかしみ_深刻さも含めて眺める') > 0.3, 'おかしみ（眺める）が立つ');
  assert.ok(
    a('emotion:面白がり') < a('emotion:おかしみ_深刻さも含めて眺める'),
    '茶化し（面白がり）は主役にならない',
  );
  assert.ok(a('emotion:重さに飲まれる') < 0.1, '重さに飲まれない');
});

// ── フィオ: 重さ⇔軽さの動的均衡 ───────────────────────────────────────────

test('フィオ: 重さ軽さ両方の入力で、重さと軽さが両立して均衡する', () => {
  const a = surface('fio', [
    'belief:重さも軽さもどちらも人生の味わい',
    'belief:地に足をつけるから風のように軽くなれる',
  ]);
  const omosa = a('emotion:地に足をつける_重さを抱える');
  const karuyaka = a('emotion:風のような軽やかさ');
  assert.ok(omosa > 0.3 && karuyaka > 0.3, '重さも軽さも立つ');
  assert.ok(Math.abs(omosa - karuyaka) < 0.15, 'どちらも勝ちきらず均衡する');
  assert.ok(a('emotion:今ここの味わい') >= omosa - 1e-9, '味わいに集約する');
});

test('フィオ: 未来不安では「今ここの味わい」に引き戻される', () => {
  const a = surface('fio', [
    'belief:過去や未来でなく今この瞬間に在る',
    'belief:今ここは頭でなく身体で感じる',
  ]);
  assert.ok(a('emotion:今ここの味わい') > 0.5);
});

// ── 励起（テキスト → 期待する entry belief）の煙テスト ───────────────────────

const IGNITION_SMOKE: Array<{ agentId: string; text: string; expect: string[] }> = [
  { agentId: 'joe', text: '何をしても無駄な気がする', expect: ['belief:闇は光がある証拠'] },
  { agentId: 'joe', text: '新しいこと挑戦してみたい', expect: ['belief:ワクワクは生きたい方向のサイン'] },
  {
    agentId: 'mina',
    text: '自分なんて価値がない',
    expect: ['belief:傷は直さなくていい', 'belief:弱さを見せられる場所が要る'],
  },
  { agentId: 'ray', text: '別に普通です、大丈夫です', expect: ['belief:表面の言葉の奥に本当のものがある'] },
  {
    agentId: 'ray',
    text: 'やりたいけど、やるべきじゃない気がする',
    expect: ['belief:すべきの下に本当はしたいが隠れてる', 'belief:本音はそこにしか出口がない'],
  },
  {
    agentId: 'ken',
    text: '考えが整理できなくて混乱してる',
    expect: ['belief:散らばったままでは気づけない', 'belief:もつれた糸は一本ずつ見ればほどける'],
  },
  {
    agentId: 'tom',
    text: '考えすぎて動けない',
    expect: ['belief:前提を疑うと問題が消える', 'belief:深刻さも遊びの一部_一段上から眺める'],
  },
  {
    agentId: 'tom',
    text: '親が亡くなって立ち直れない',
    expect: ['belief:深刻さも遊びの一部_一段上から眺める', 'belief:重さには重さで返さない_視点をずらす'],
  },
  {
    agentId: 'fio',
    text: '先のことを考えると不安で仕方ない',
    expect: ['belief:過去や未来でなく今この瞬間に在る', 'belief:今ここは頭でなく身体で感じる'],
  },
  {
    agentId: 'fio',
    text: 'つらいこともあるけど、まあ生きてるな',
    expect: ['belief:重さも軽さもどちらも人生の味わい', 'belief:地に足をつけるから風のように軽くなれる'],
  },
];

test('励起（煙テスト）: 各人の代表入力が期待する信念を点火する', () => {
  for (const c of IGNITION_SMOKE) {
    const m = igniteAndSpread(c.text, c.agentId);
    for (const id of c.expect) {
      assert.ok(m.ignited.includes(id), `${c.agentId}「${c.text}」→ ${id} が点火していない（${m.ignited.join(',')}）`);
    }
  }
});
