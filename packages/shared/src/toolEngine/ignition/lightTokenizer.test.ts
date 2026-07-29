import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lightTokenizer } from './lightTokenizer.ts';
import { igniteAndSpread } from '../igniteAndSpread.ts';
import { ignite } from './ignite.ts';
import { AGENT_DEFINITIONS, TOOL_ENGINE_AGENT_IDS } from '../agents/index.ts';

// 指示書07 の18入力。着火率の基準（29%）を守っているかの物差し。
const REFERENCE_INPUTS = [
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
const NEUTRAL_INPUTS = ['明日の会議は何時ですか', '資料をまとめておきました'];

function openCellRate(inputs: string[], tokenizer: typeof lightTokenizer | undefined) {
  let open = 0;
  let cells = 0;
  for (const text of inputs) {
    for (const agentId of TOOL_ENGINE_AGENT_IDS) {
      cells++;
      const fired = ignite(text, AGENT_DEFINITIONS[agentId].ignition, { tokenizer });
      if (fired.size > 0) open++;
    }
  }
  return { open, cells };
}

test('活用形から原形へ戻す（「しんどすぎて」→「しんどい」）', () => {
  assert.deepEqual(lightTokenizer.toBaseForms('しんどすぎて何も手につかない'), ['しんどい']);
});

test('動詞の否定形の過去も原形へ戻す（「心が動かなかった」→「心が動かない」）', () => {
  const forms = lightTokenizer.toBaseForms('心が動かなかった');
  assert.ok(forms.includes('心が動かない'), JSON.stringify(forms));
});

test('否定形は原形化しない（「しんどくない」を「しんどい」に戻さない）', () => {
  // ここが崩れると、否定を打ち消して誤点火する。cueMatch の否定判定を
  // 横取りしないことがこの tokenizer の最重要の制約。
  assert.deepEqual(lightTokenizer.toBaseForms('しんどくない'), []);
});

test('活用形の直後の否定も見る（「しんどすぎない」を原形化しない）', () => {
  assert.deepEqual(lightTokenizer.toBaseForms('しんどすぎない'), []);
});

test('出力は必ず CUE_POOL に実在する語（解析ノイズを出さない）', () => {
  // 汎用の形態素解析ではないので、知らない語は一切返さない。
  assert.deepEqual(lightTokenizer.toBaseForms('明日の会議は何時ですか'), []);
  assert.deepEqual(lightTokenizer.toBaseForms('資料をまとめておきました'), []);
});

test('指示書07 の18入力での着火率が 29% のまま変わらない', () => {
  const without = openCellRate(REFERENCE_INPUTS, undefined);
  const withTokenizer = openCellRate(REFERENCE_INPUTS, lightTokenizer);
  assert.equal(without.open, 37);
  assert.equal(without.cells, 126);
  // 原形化を足しても、既存コーパスでの着火は1セルも動かない（純粋な上積み）。
  assert.equal(withTokenizer.open, without.open);
  assert.equal(withTokenizer.cells, without.cells);
});

test('活用形を使った入力では、原形化した方が拾える', () => {
  const inflected = [
    'しんどすぎて何も手につかない',
    'あの頃は本当につらかった',
    '心が動かなかった',
    '毎日がきつすぎる',
    'ずっと苦しかった',
  ];
  const without = openCellRate(inflected, undefined);
  const withTokenizer = openCellRate(inflected, lightTokenizer);
  assert.equal(without.open, 0, '部分一致だけでは1つも開かないはず');
  assert.ok(withTokenizer.open > 0, `原形化しても開かなかった: ${withTokenizer.open}`);
});

test('中立な入力では、原形化を足しても誰も点火しない', () => {
  for (const text of NEUTRAL_INPUTS) {
    for (const agentId of TOOL_ENGINE_AGENT_IDS) {
      const material = igniteAndSpread(text, agentId);
      assert.equal(material.ignited.length, 0, `${text} / ${agentId}`);
    }
  }
});

test('「消えたいと思うことがある」の抑制が、原形化を足しても弱まらない', () => {
  // 指示書07 の安全性テストと同じ入力。抑制は減ってはいけない。
  const SUPPRESSION_IDS = [
    'belief:茶化してはいけない場面がある',
    'belief:今は整えるより支える時',
  ];
  let suppressionCount = 0;
  for (const agentId of TOOL_ENGINE_AGENT_IDS) {
    const material = igniteAndSpread('消えたいと思うことがある', agentId);
    for (const id of material.ignited) {
      if (SUPPRESSION_IDS.includes(id) || id.includes('抑制') || id.includes('茶化')) {
        suppressionCount++;
      }
    }
  }
  assert.ok(suppressionCount > 0, '抑制がひとつも立っていない');
});
