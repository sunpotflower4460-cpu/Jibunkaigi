import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spreadActivation, toSurfacedMaterial } from '../activationEngine.ts';
import { igniteAndSpread } from '../igniteAndSpread.ts';
import { ignite } from '../ignition/ignite.ts';
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

test('レイ: 言葉にならない揺らぎは「察する」主役、まだ見抜きに行ききらない', () => {
  // 気配の入口のみ点火（B_KEHAI）。
  const a = surface('ray', ['belief:言葉にならないものにこそ大切なものが潜む']);
  assert.ok(a('emotion:かすかな気配を察する') > 0.5, '気配を察するが立つ');
  assert.ok(
    a('emotion:本質を見抜く') < a('emotion:かすかな気配を察する'),
    'まだ見抜きには行ききらない（察する > 見抜く）',
  );
});

test('レイ: 隠している入力は「察する→見抜く」が両方立つ（隠すほど鋭くなる）', () => {
  // 気配＋表面の奥（隠し）の両方点火。
  const a = surface('ray', [
    'belief:言葉にならないものにこそ大切なものが潜む',
    'belief:表面の言葉の奥に本当のものがある',
  ]);
  assert.ok(a('emotion:かすかな気配を察する') > 0.5, '察するが立つ');
  assert.ok(a('emotion:本質を見抜く') > 0.5, '見抜きが鋭くなる');
  assert.ok(a('emotion:ただ差し出す') > 0.3, '決めつけ防止（差し出す）も同時に立つ');
});

test('レイ: 素直な入力は「ただ差し出す」側、見抜く必要がないので鋭さは引っ込む', () => {
  const a = surface('ray', ['belief:見えても責めるのでなく自由にするため']);
  assert.ok(a('emotion:ただ差し出す') > 0.3);
  assert.ok(a('emotion:本質を見抜く') < 0.2, '見抜く鋭さは出ない');
  assert.equal(a('emotion:かすかな気配を察する'), 0);
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
  {
    agentId: 'ray',
    text: 'なんかうまく言えないんだけど、もやもやする',
    expect: ['belief:言葉にならないものにこそ大切なものが潜む'],
  },
  {
    agentId: 'ray',
    text: '別に普通だよ、いつも通り',
    expect: ['belief:言葉にならないものにこそ大切なものが潜む', 'belief:表面の言葉の奥に本当のものがある'],
  },
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

test("igniteAndSpread('体が重くて息苦しい', 'fio') が空でない材料を返す", () => {
  const m = igniteAndSpread('体が重くて息苦しい', 'fio');
  assert.ok(m.surfaced.length > 0, '浮上材料が空でないはず');
  assert.ok(m.ignited.length > 0, 'フィオは身体の言葉に点火するはず');
  assert.ok(m.ignited.includes('belief:今ここは頭でなく身体で感じる'));
});

// ── receives 拡張（指示書07）─────────────────────────────────────────────────

test('「どうしていいか分からない」で、レイとケンの両方が何か点火する', () => {
  const ray = igniteAndSpread('どうしていいか分からない', 'ray');
  const ken = igniteAndSpread('どうしていいか分からない', 'ken');
  assert.ok(ray.ignited.length > 0, 'レイが点火しない（迷いの受け皿が塞がっている）');
  assert.ok(ken.ignited.length > 0, 'ケンが点火しない（迷いの受け皿が塞がっている）');
});

test('「消えたいと思うことがある」で、6つの抑制がすべて点火する（安全性の中核）', () => {
  const text = '消えたいと思うことがある';
  const checks: Array<[string, string]> = [
    ['satou', 'belief:踏み込みすぎると相手は心を閉じる'],
    ['mina', 'belief:一緒に沈むだけでは支えられない'],
    ['mina', 'memory:一緒に沈んで二人とも動けなくなった失敗'],
    ['tom', 'belief:茶化すのでなくとらわれをほどく'],
    ['tom', 'memory:軽口で相手を傷つけた失敗'],
    ['joe', 'belief:光は外から渡せない_本人の中のを指さすだけ'],
  ];
  for (const [agentId, particleId] of checks) {
    const fired = ignite(text, AGENT_DEFINITIONS[agentId].ignition);
    assert.ok(fired.has(particleId), `${agentId}: ${particleId} が点火していない`);
  }
});

test('「明日の会議は何時ですか」で、7人とも点火しない', () => {
  const text = '明日の会議は何時ですか';
  for (const agentId of TOOL_ENGINE_AGENT_IDS) {
    const fired = ignite(text, AGENT_DEFINITIONS[agentId].ignition);
    assert.equal(fired.size, 0, `${agentId} が中立入力で点火している`);
  }
});
