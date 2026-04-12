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
  assert.match(signals.dominantTendency, /視点|残っている/);
  assert.doesNotMatch(signals.dominantTendency, /正しい|勝ち/);
});

test('selectMirrorSignals weights recent near-user tendencies over raw counts', () => {
  const signals = selectMirrorSignals({
    messages: [
      { role: 'user', content: '進みたい気持ちはあるけど、まだ整理しきれていません' },
      { role: 'ai', agentId: 'strategist', content: '論点を整理すると、先に決めるものが見えます' },
      { role: 'user', content: 'でも今は、まず怖さごと雑に扱いたくない感じもあります' },
      { role: 'ai', agentId: 'creative', content: '怖さがあっても、消したくないものは残ってる気がする' },
    ],
    agents: sampleAgents,
    latestUserText: 'でも今は、まず怖さごと雑に扱いたくない感じもあります',
  });

  assert.match(signals.dominantTendency, /ジョー/);
  assert.match(signals.dominantTendency, /前に出ていた/);
  assert.match(signals.mainPull, /少し前を向きたい|見失わない/);
  assert.match(signals.unresolvedPoint, /軽く扱わない|閉じていない|開いている|開いたまま/);
});

test('selectMirrorSignals applies LATEST_USER_WEIGHT_BOOST to the last user message even when the last message is from AI', () => {
  // User at index 0: 5 desire-pattern matches (all five desire keywords)
  // User at index 4 (latest): 3 fear-pattern matches
  // AI at index 5 (last overall)
  //
  // Without the fix, index 4 !== totalMessages-1 (5), so it gets BASE_USER_WEIGHT_BOOST (0.15)
  // instead of LATEST_USER_WEIGHT_BOOST (0.40).  With the lower boost:
  //   desire = 5 × (1.0 + 0.15) = 5.75
  //   fear   = 3 × (1.72 + 0.15) = 5.61  → desire wins (wrong)
  // With the fix:
  //   desire = 5 × 1.15 = 5.75
  //   fear   = 3 × (1.72 + 0.40) = 6.36  → fear wins  (correct)
  const signals = selectMirrorSignals({
    messages: [
      { role: 'user', content: '出したい、進みたい、やりたい、向きたい、踏み出したい' },
      { role: 'ai', agentId: 'strategist', content: '前向きですね' },
      { role: 'user', content: 'そうですね' },
      { role: 'ai', agentId: 'empath', content: '大丈夫ですよ' },
      { role: 'user', content: '怖い、不安で、傷ついてしまいそう' },
      { role: 'ai', agentId: 'creative', content: '少しずつ進もう' },
    ],
    agents: sampleAgents,
    latestUserText: '怖い、不安で、傷ついてしまいそう',
  });

  assert.match(signals.mainEmotion, /怖さや不安/);
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
  assert.match(systemPrompt, /要約より、今ここに残っている重さ・引力・未解決点を優先する。/);
  assert.match(systemPrompt, /本文で疑問形を使わない。問いは最後の一文だけにする。/);
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
  assert.match(userPrompt, /誰が正しいかではなく/);
  assert.match(userPrompt, /疑問形はその一文だけにしてください。/);
});
