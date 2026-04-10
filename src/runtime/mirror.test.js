import test from 'node:test';
import assert from 'node:assert/strict';

import { buildMirrorSystemPrompt, buildMirrorUserPrompt, selectMirrorSignals } from './mirror.js';

const sampleAgents = [
  { id: 'creative', name: 'ジョー' },
  { id: 'strategist', name: 'ケン' },
  { id: 'empath', name: 'ミナ' },
];

test('selectMirrorSignals returns 2-4 lightweight signals including conflict and tone', () => {
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

  assert.ok(signals.length >= 2);
  assert.ok(signals.length <= 4);
  assert.ok(signals.some((signal) => signal.key === 'main_conflict'));
  assert.ok(signals.some((signal) => signal.key === 'repeated_pattern'));
  assert.ok(signals.some((signal) => signal.key === 'dominant_agent_tone'));
});

test('buildMirrorSystemPrompt defines the quiet synthesis shape and mirror-specific prohibitions', () => {
  const systemPrompt = buildMirrorSystemPrompt({
    mode: 'medium',
    context: 'あなた: 進みたいけど怖い\nジョー: 小さく出してみよう\nケン: 出し方を分けよう',
    signals: [
      { key: 'main_emotion', label: '強く残った感情', summary: '会話の底には、怖さや不安が比較的はっきり残っている。' },
      { key: 'main_conflict', label: '大きな葛藤', summary: '進みたい気持ちと、傷つく怖さが同時にある。' },
      { key: 'dominant_agent_tone', label: '強く残った視点', summary: 'ジョーの視点がいちばん濃く残っているが、勝ち負けではなく一つの色として扱う。' },
    ],
  });

  assert.match(systemPrompt, /静かに深く、でも速く束ねる統合役/);
  assert.match(systemPrompt, /説教しない。無理に前向きにしない。まとめすぎない。/);
  assert.match(systemPrompt, /エージェント同士の意見を勝敗化しない。/);
  assert.match(systemPrompt, /最後は問いを1つだけ返す。/);
  assert.match(systemPrompt, /1\. 会話全体の中で残ったものを、一言で静かに映す。/);
  assert.match(systemPrompt, /【今回の signal】/);
  assert.match(systemPrompt, /強く残った視点: ジョーの視点がいちばん濃く残っている/);
  assert.match(systemPrompt, /【ここまでの流れ】/);
});

test('buildMirrorUserPrompt keeps the final ask anchored to the latest user text and a single question', () => {
  const userPrompt = buildMirrorUserPrompt({
    userName: 'あなた',
    userText: '今日ここで、まだ決めなくていいことがある気がします',
  });

  assert.match(userPrompt, /あなたの直近の言葉:/);
  assert.match(userPrompt, /まだ決めなくていいことがある気がします/);
  assert.match(userPrompt, /静かな統合/);
  assert.match(userPrompt, /最後は問いを1つだけにしてください。/);
});
