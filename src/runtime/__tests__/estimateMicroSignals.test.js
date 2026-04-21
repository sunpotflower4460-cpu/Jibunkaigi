import test from 'node:test';
import assert from 'node:assert/strict';

import { estimateMicroSignals, zeroMicroSignals } from '../estimateMicroSignals.js';
import { estimateState } from '../stateEstimate.js';
import { runInternalOS } from '../runInternalOS.js';

const assertBoundedSignals = (signals) => {
  for (const category of Object.values(signals)) {
    for (const value of Object.values(category)) {
      assert.equal(typeof value, 'number');
      assert.ok(value >= 0 && value <= 1);
    }
  }
};

test('estimateMicroSignals returns zero shape for empty input', () => {
  assert.deepEqual(estimateMicroSignals(''), zeroMicroSignals());
});

test('estimateMicroSignals detects punctuation assertion from exclamation', () => {
  const result = estimateMicroSignals('やる！');
  assert.ok(result.punctuation.assertion >= 0.45);
});

test('estimateMicroSignals detects punctuation trail off from ellipsis', () => {
  const result = estimateMicroSignals('まだ…。');
  assert.ok(result.punctuation.trailOff >= 0.5);
  assert.ok(result.punctuation.hesitation >= 0.2);
});

test('estimateMicroSignals detects filler density from hesitation words', () => {
  const result = estimateMicroSignals('えっと、まあ、その。');
  assert.ok(result.fillers.fillerDensity >= 0.3);
});

test('estimateMicroSignals keeps filler density low without fillers', () => {
  const result = estimateMicroSignals('今日は進めたいです。');
  assert.ok(result.fillers.fillerDensity <= 0.05);
});

test('estimateMicroSignals detects soft negation from 別に prefix', () => {
  const result = estimateMicroSignals('別に怒ってない。');
  assert.ok(result.negationPrefix.softNegation >= 0.35);
});

test('estimateMicroSignals detects soft negation from そんなに〜ない', () => {
  const result = estimateMicroSignals('そんなに嫌じゃない。');
  assert.ok(result.negationPrefix.softNegation >= 0.4);
});

test('estimateMicroSignals detects burstiness across sentence lengths', () => {
  const result = estimateMicroSignals('無理。少しだけ考えていたけど、やっぱり今はまだ言葉にならない。');
  assert.ok(result.sentenceLength.burstiness >= 0.2);
});

test('estimateMicroSignals detects shortness pressure for short consecutive sentences', () => {
  const result = estimateMicroSignals('無理。だめ。いや。');
  assert.ok(result.sentenceLength.shortnessPressure >= 0.6);
});

test('estimateMicroSignals detects epistemic lowering from かも', () => {
  const result = estimateMicroSignals('できるかも。');
  assert.ok(result.selfHedging.epistemicLowering >= 0.35);
});

test('estimateMicroSignals detects epistemic lowering from 気がする and たぶん', () => {
  const result = estimateMicroSignals('たぶん、まだ違う気がする。');
  assert.ok(result.selfHedging.epistemicLowering >= 0.45);
});

test('estimateMicroSignals detects distancing from quotations', () => {
  const result = estimateMicroSignals('「大丈夫」って言った。');
  assert.ok(result.quotation.distancing >= 0.4);
});

test('estimateMicroSignals detects distancing from nested-style quotations', () => {
  const result = estimateMicroSignals('『正解』みたいに言われるとつらい。');
  assert.ok(result.quotation.distancing >= 0.45);
});

test('estimateMicroSignals returns mixed plausible values for combined input', () => {
  const result = estimateMicroSignals('作品を出したい！…でも、まあ、やっぱり無理かな');

  assert.ok(result.punctuation.assertion > 0.3);
  assert.ok(result.punctuation.trailOff > 0.3);
  assert.ok(result.fillers.fillerDensity > 0.15);
  assert.ok(result.negationPrefix.softNegation > 0.2);
  assertBoundedSignals(result);
});

test('estimateState output remains unchanged alongside micro-signal stream', () => {
  assert.deepEqual(
    estimateState('作品を出したいけど怖い'),
    {
      desire: 0.35,
      fear: 0.4,
      freeze: 0,
      reach: 0.3,
      resignation: 0,
      selfErasure: 0,
      shame: 0,
      unfinished: 0,
    },
  );
});

test('runInternalOS stores microSignals in latentState and debugInfo', () => {
  const input = '作品を出したい！…でも、まあ、やっぱり無理かな';
  const result = runInternalOS(input, { agentId: 'creative' });

  assert.deepEqual(result.latentState.microSignals, result.debugInfo.microSignals);
  assert.ok(result.debugInfo.microSignals.punctuation.assertion > 0.3);
  assert.ok(result.debugInfo.microSignals.negationPrefix.softNegation > 0.2);
  assertBoundedSignals(result.latentState.microSignals);
});
