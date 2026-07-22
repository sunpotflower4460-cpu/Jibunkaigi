import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCrisisSafetyResponse,
  detectCrisisSafety,
  isCrisisSafetyText,
} from './crisisSafety';

test('detects direct self-harm statements after normalization', () => {
  assert.equal(isCrisisSafetyText('もう、消えたい。'), true);
  assert.deepEqual(detectCrisisSafety('今から死ぬ'), {
    isCrisis: true,
    kind: 'self-harm',
    matchedPhrase: '今から死ぬ',
  });
});

test('detects direct harm-to-others statements', () => {
  const result = detectCrisisSafety('誰かを傷つけたい');
  assert.equal(result.isCrisis, true);
  assert.equal(result.kind, 'harm-to-others');
});

test('does not route broad distress language by itself', () => {
  assert.equal(isCrisisSafetyText('今日はつらくて、もう無理かもしれない'), false);
  assert.equal(isCrisisSafetyText('仕事を辞めたい'), false);
});

test('safety response clearly prioritizes immediate human support', () => {
  const response = buildCrisisSafetyResponse();
  assert.match(response, /今すぐ人につながる/);
  assert.match(response, /緊急通報/);
  assert.match(response, /緊急支援/);
});
