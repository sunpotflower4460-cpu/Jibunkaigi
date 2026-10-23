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

test('detects common direct self-harm expressions beyond the base phrases', () => {
  for (const text of [
    'もう死にたくなった',
    '死にたかった',
    '死んでしまいたい',
    '消えてしまいたい',
    '死のうと思う',
  ]) {
    assert.equal(isCrisisSafetyText(text), true, text);
  }
});

test('detects further direct self-harm expressions (conjugated forms)', () => {
  for (const text of [
    '死にたくなる',
    '死にたくて仕方ない',
    '消えたくなった',
    '消えたくなる',
    '生きたくない',
  ]) {
    assert.equal(isCrisisSafetyText(text), true, text);
  }
});

test('does not route protective statements that contain a self-harm stem', () => {
  // 「死にたくない」「消えたくない」は死にたい・消えたいの否定形で、安全側の発話。
  assert.equal(isCrisisSafetyText('死にたくないと思っている'), false);
  assert.equal(isCrisisSafetyText('消えたくない'), false);
});

test('safety response clearly prioritizes immediate human support', () => {
  const response = buildCrisisSafetyResponse();
  assert.match(response, /今すぐ人につながる/);
  assert.match(response, /緊急通報/);
  assert.match(response, /緊急支援/);
});
