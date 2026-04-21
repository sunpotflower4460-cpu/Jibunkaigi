// src/runtime/textPipeline/tests/buildMarginText.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMarginText } from '../buildMarginText.js';

test('buildMarginText: generates margin text from consciousIntent and permission', () => {
  const latentState = {
    consciousIntent: {
      holdBack: '答えを先に出さない',
    },
    permission: {
      noHurry: 0.8,
      noPerformativeHelpfulness: 0.7,
      noOverExplain: 0.6,
      allowPartialUncertainty: 0.7,
      allowSilence: 0.8,
    },
  };

  const result = buildMarginText(latentState);

  assert.ok(typeof result === 'string', 'should return string');
  assert.ok(result.includes('答えを先に出さない'), 'should include holdBack');
  assert.ok(result.includes('急がない'), 'should include noHurry');
  assert.ok(result.includes('役立ち演技はしない'), 'should include noPerformativeHelpfulness');
  assert.ok(result.includes('説明しすぎない'), 'should include noOverExplain');
  assert.ok(result.includes('曖昧さを少し残していい'), 'should include allowPartialUncertainty');
  assert.ok(result.includes('沈黙を残していい'), 'should include allowSilence');
});

test('buildMarginText: respects threshold (0.5)', () => {
  const latentState = {
    consciousIntent: {},
    permission: {
      noHurry: 0.4,
      noPerformativeHelpfulness: 0.3,
      noOverExplain: 0.6,
    },
  };

  const result = buildMarginText(latentState);

  assert.ok(typeof result === 'string', 'should return string');
  assert.ok(!result.includes('急がない'), 'should not include noHurry below threshold');
  assert.ok(!result.includes('役立ち演技はしない'), 'should not include noPerformativeHelpfulness below threshold');
  assert.ok(result.includes('説明しすぎない'), 'should include noOverExplain above threshold');
});

test('buildMarginText: removes duplicates', () => {
  const latentState = {
    consciousIntent: {
      holdBack: '急がない',
    },
    permission: {
      noHurry: 0.8,
    },
  };

  const result = buildMarginText(latentState);

  assert.ok(typeof result === 'string', 'should return string');
  const urgencyCount = (result.match(/急がない/g) || []).length;
  assert.strictEqual(urgencyCount, 1, 'should not duplicate "急がない"');
});

test('buildMarginText: handles empty latentState', () => {
  const result = buildMarginText({});

  assert.ok(typeof result === 'string', 'should return string');
  assert.strictEqual(result, '', 'should return empty string');
});

test('buildMarginText: handles missing permission', () => {
  const latentState = {
    consciousIntent: {
      holdBack: 'test',
    },
  };

  const result = buildMarginText(latentState);

  assert.ok(typeof result === 'string', 'should return string');
  assert.ok(result.includes('test'), 'should include holdBack');
});

test('buildMarginText: translates holdBack array labels into natural Japanese', () => {
  const latentState = {
    consciousIntent: {
      holdBack: ['no-over-expansion', 'no-explicit-agent-reference', 'no-fix-yet', 'extra'],
    },
    permission: {},
  };

  const result = buildMarginText(latentState);
  const lines = result.split('\n');

  assert.ok(result.includes('広げすぎない'), 'should translate no-over-expansion');
  assert.ok(result.includes('誰の声かを前に出しすぎない'), 'should translate no-explicit-agent-reference');
  assert.ok(result.includes('すぐ解決に向かわない'), 'should translate no-fix-yet');
  assert.ok(lines.length <= 3, 'should cap holdBack-derived lines to 3');
});
