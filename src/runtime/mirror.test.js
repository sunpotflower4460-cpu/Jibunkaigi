import test from 'node:test';
import assert from 'node:assert/strict';

import { buildMirrorSystemPrompt, buildMirrorUserPrompt, selectMirrorSignals } from './mirror.js';

const sampleAgents = [
  { id: 'creative', name: 'ジョー' },
  { id: 'strategist', name: 'ケン' },
  { id: 'empath', name: 'ミナ' },
];

test('selectMirrorSignals returns the lightweight mirror signal object', () => {
  const signals = selectMirrorSignals({
    messages: [
      { role: 'user', content: '作品は出したいのに、傷つくのが怖くて止まるんです' },
      { role: 'ai', agentId: 'creative', content: '怖さごと少しだけ前に出ればいい' },
      { role: 'ai', agentId: 'strategist', content: '怖さが強いなら出し方を分けましょう' },
      { role: 'user', content: 'やりたいのに、考え始めるとまた怖くなります' },
      { role: 'ai', agentId: 'creative', content: '全部じゃなく一部だけ出してみよう' },
    ],
    agents: sampleAgents,
    latestUserText: 'やりたいのに、考え始めるとまた怖くなります',
  });

  assert.equal(typeof signals, 'object');
  assert.equal(typeof signals.mainEmotion, 'string');
  assert.equal(typeof signals.mainConflict, 'string');
  assert.equal(typeof signals.mainPull, 'string');
  assert.equal(typeof signals.repeatedPattern, 'string');
  assert.equal(typeof signals.unresolvedPoint, 'string');
  assert.equal(typeof signals.dominantTendency, 'string');
  assert.match(signals.mainConflict, /進みたい|傷つく|怖さ/);
  assert.match(signals.repeatedPattern, /引き返す往復|立ち止まる/);
  assert.match(signals.dominantTendency, /ジョー|ケン/);
});

test('buildMirrorSystemPrompt defines the quiet synthesis shape and mirror-specific prohibitions', () => {
  const systemPrompt = buildMirrorSystemPrompt({
    mode: 'medium',
    context: 'あなた: 進みたいけど怖い\nジョー: 小さく出してみよう\nケン: 出し方を分けよう',
    signals: {
      mainEmotion: '会話の底には、怖さや不安がいちばん長く残っている。',
      mainConflict: '進みたい気持ちと、傷つく怖さが同時にある。',
      mainPull: '完全に離れるより、怖さを抱えたまま少し前を向きたい流れがある。',
      repeatedPattern: '動きたいのに少し手前で引き返す往復が、何度か顔を出している。',
      unresolvedPoint: '進むかどうかより、何を守りながら進みたいのかがまだ開いたままになっている。',
      dominantTendency: '全体ではジョーの前へ動かそうとする視点が少し前に出ていたが、ケンの構造化して見通しを作る視点も残っている。',
    },
  });

  assert.match(systemPrompt, /その場の重力と未解決点を映す、静かな統合の窓/);
  assert.match(systemPrompt, /ジョーほど熱くも重くもならず/);
  assert.match(systemPrompt, /箇条書き要約にしない。説教しない。無理に前向きにしない。/);
  assert.match(systemPrompt, /エージェント同士の意見を勝敗化しない。/);
  assert.match(systemPrompt, /最後は問いを1つだけ返す。/);
  assert.match(systemPrompt, /1\. 会話全体の中で残ったものを短く映す。/);
  assert.match(systemPrompt, /【mirror signals】/);
  assert.match(systemPrompt, /mainPull: 完全に離れるより、怖さを抱えたまま少し前を向きたい流れがある。/);
  assert.match(systemPrompt, /dominantTendency: 全体ではジョーの前へ動かそうとする視点が少し前に出ていた/);
  assert.match(systemPrompt, /【直近の流れ】/);
});

test('buildMirrorUserPrompt keeps the final ask anchored to the latest user text and a single question', () => {
  const userPrompt = buildMirrorUserPrompt({
    userName: 'あなた',
    userText: '今日ここで、まだ決めなくていいことがある気がします',
  });

  assert.match(userPrompt, /あなたの直近の言葉:/);
  assert.match(userPrompt, /まだ決めなくていいことがある気がします/);
  assert.match(userPrompt, /場の重力を映す静かな統合/);
  assert.match(userPrompt, /最後は問いを1つだけにしてください。/);
});
