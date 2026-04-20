import test from 'node:test';
import assert from 'node:assert/strict';

import { runInternalOS } from '../runInternalOS.js';
import { zeroMicroSignals } from '../estimateMicroSignals.js';

const buildSignals = (overrides = {}) => ({
  ...zeroMicroSignals(),
  punctuation: {
    ...zeroMicroSignals().punctuation,
    ...(overrides.punctuation ?? {}),
  },
  fillers: {
    ...zeroMicroSignals().fillers,
    ...(overrides.fillers ?? {}),
  },
  negationPrefix: {
    ...zeroMicroSignals().negationPrefix,
    ...(overrides.negationPrefix ?? {}),
  },
  sentenceLength: {
    ...zeroMicroSignals().sentenceLength,
    ...(overrides.sentenceLength ?? {}),
  },
  selfHedging: {
    ...zeroMicroSignals().selfHedging,
    ...(overrides.selfHedging ?? {}),
  },
  quotation: {
    ...zeroMicroSignals().quotation,
    ...(overrides.quotation ?? {}),
  },
});

const runWithSignals = (microSignals) => runInternalOS('作品を出したい', {
  agentId: 'creative',
  microSignals,
});

test('ellipsis changes reaction and stance compared with exclamation', () => {
  const exclamation = runInternalOS('作品を出したい！', { agentId: 'creative' });
  const trailOff = runInternalOS('作品を出したい…', { agentId: 'creative' });

  assert.notEqual(exclamation.latentState.reaction.touched, trailOff.latentState.reaction.touched);
  assert.notEqual(exclamation.latentState.stance.receive, trailOff.latentState.stance.receive);
  assert.ok(trailOff.latentState.reaction.touched > exclamation.latentState.reaction.touched);
  assert.ok(trailOff.latentState.stance.receive > exclamation.latentState.stance.receive);
});

test('hesitation increases fragility and holdBackJudgment', () => {
  const baseline = runWithSignals(zeroMicroSignals());
  const result = runWithSignals(buildSignals({ punctuation: { hesitation: 1 } }));

  assert.ok(result.latentState.field.fragility > baseline.latentState.field.fragility);
  assert.ok(result.latentState.reaction.holdBackJudgment > baseline.latentState.reaction.holdBackJudgment);
  assert.equal(result.debugInfo.microSignalBias.field.axes.fragility.delta, 0.15);
});

test('trailOff increases touched and receive', () => {
  const baseline = runWithSignals(zeroMicroSignals());
  const result = runWithSignals(buildSignals({ punctuation: { trailOff: 1 } }));

  assert.ok(result.latentState.reaction.touched > baseline.latentState.reaction.touched);
  assert.ok(result.latentState.stance.receive > baseline.latentState.stance.receive);
  assert.equal(result.debugInfo.microSignalBias.stance.axes.receive.delta, 0.15);
});

test('fillerDensity softens field and reduces structure', () => {
  const baseline = runWithSignals(zeroMicroSignals());
  const result = runWithSignals(buildSignals({ fillers: { fillerDensity: 1 } }));

  assert.ok(result.latentState.field.softness > baseline.latentState.field.softness);
  assert.ok(result.latentState.stance.structure < baseline.latentState.stance.structure);
  assert.equal(result.debugInfo.microSignalBias.stance.axes.structure.delta, -0.12);
});

test('softNegation increases protect and illuminate', () => {
  const baseline = runWithSignals(zeroMicroSignals());
  const result = runWithSignals(buildSignals({ negationPrefix: { softNegation: 1 } }));

  assert.ok(result.latentState.reaction.protect > baseline.latentState.reaction.protect);
  assert.ok(result.latentState.stance.illuminate > baseline.latentState.stance.illuminate);
});

test('burstiness increases urgency', () => {
  const baseline = runWithSignals(zeroMicroSignals());
  const result = runWithSignals(buildSignals({ sentenceLength: { burstiness: 1 } }));

  assert.ok(result.latentState.field.urgency > baseline.latentState.field.urgency);
  assert.equal(result.debugInfo.microSignalBias.field.axes.urgency.delta, 0.15);
});

test('distancing increases holdBackJudgment', () => {
  const baseline = runWithSignals(zeroMicroSignals());
  const result = runWithSignals(buildSignals({ quotation: { distancing: 1 } }));

  assert.ok(result.latentState.reaction.holdBackJudgment > baseline.latentState.reaction.holdBackJudgment);
  assert.equal(result.debugInfo.microSignalBias.reaction.axes.holdBackJudgment.delta, 0.1);
});

test('micro-signal debug deltas stay within 0.15 for all layers', () => {
  const result = runWithSignals(buildSignals({
    punctuation: { hesitation: 1, trailOff: 1 },
    fillers: { fillerDensity: 1 },
    negationPrefix: { softNegation: 1 },
    sentenceLength: { burstiness: 1 },
    quotation: { distancing: 1 },
  }));

  ['field', 'reaction', 'stance'].forEach((layerKey) => {
    Object.values(result.debugInfo.microSignalBias[layerKey].axes).forEach(({ delta }) => {
      assert.ok(Math.abs(delta) <= 0.15);
    });
  });
});
