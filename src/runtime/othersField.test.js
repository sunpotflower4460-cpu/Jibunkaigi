// src/runtime/othersField.test.js
// others_field のテスト

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  summarizeToOthersField,
  renderOthersFieldForPrompt,
  formatOthersFieldForDebug,
  isOthersFieldEmpty,
} from './othersField.js';

test('summarizeToOthersField: 基本的な変換', () => {
  const result = summarizeToOthersField('creative', 'まだ残っている力があるよ。そこに触れてみよう。');

  assert.ok(result, 'result should exist');
  assert.strictEqual(result.agentId, 'joe', 'agentId should be normalized to joe');
  assert.ok(result.gist, 'gist should exist');
  assert.ok(Array.isArray(result.toneTags), 'toneTags should be array');
  assert.ok(Array.isArray(result.forceTags), 'forceTags should be array');
});

test('summarizeToOthersField: empty text returns null', () => {
  const result = summarizeToOthersField('creative', '');
  assert.strictEqual(result, null, 'should return null for empty text');
});

test('summarizeToOthersField: mirror は含めない', () => {
  const result = summarizeToOthersField('master', 'この場には何かが残っている');
  assert.strictEqual(result, null, 'mirror should not be included');
});

test('summarizeToOthersField: tone / force tags 抽出', () => {
  const result = summarizeToOthersField('empath', 'やさしく受け止めて、ゆっくり進もう');

  assert.ok(result.toneTags.includes('soft') || result.toneTags.includes('warm'),
    'should detect soft/warm tone');
  assert.ok(result.forceTags.includes('slow-down') || result.forceTags.includes('hold'),
    'should detect slow-down/hold force');
});

test('renderOthersFieldForPrompt: 基本的なレンダリング', () => {
  const othersField = [
    {
      agentId: 'joe',
      gist: 'まだ残っている力に触れた',
      toneTags: ['sharp'],
      forceTags: ['deepen'],
    },
    {
      agentId: 'mina',
      gist: '苦しさを受け止めた',
      toneTags: ['soft', 'warm'],
      forceTags: ['hold', 'slow-down'],
    },
  ];

  const result = renderOthersFieldForPrompt(othersField, true);

  assert.ok(result.includes('[others_field]'), 'should include header');
  assert.ok(result.includes('joe:'), 'should include joe');
  assert.ok(result.includes('mina:'), 'should include mina');
  assert.ok(result.includes('gist:'), 'should include gist');
  assert.ok(result.includes('tone:'), 'should include tone');
  assert.ok(result.includes('force:'), 'should include force');
});

test('renderOthersFieldForPrompt: empty field returns empty string', () => {
  const result = renderOthersFieldForPrompt([]);
  assert.strictEqual(result, '', 'should return empty string for empty field');
});

test('renderOthersFieldForPrompt: thin / off mode', () => {
  const othersField = [
    {
      agentId: 'joe',
      gist: 'まだ残っている力に触れた',
      toneTags: [],
      forceTags: [],
    },
  ];

  const thin = renderOthersFieldForPrompt(othersField, false, { mode: 'thin' });
  assert.match(thin, /ほかの声の残りは「まだ残っている力に触れた」くらい。/);

  const off = renderOthersFieldForPrompt(othersField, false, { mode: 'off' });
  assert.strictEqual(off, '');
});

test('formatOthersFieldForDebug: デバッグ用フォーマット', () => {
  const othersField = [
    { agentId: 'joe', gist: 'まだ残っている力に触れた', toneTags: [], forceTags: [] },
    { agentId: 'mina', gist: '苦しさを受け止めた', toneTags: [], forceTags: [] },
  ];

  const result = formatOthersFieldForDebug(othersField);

  assert.ok(result.includes('joe:'), 'should include joe');
  assert.ok(result.includes('mina:'), 'should include mina');
  assert.ok(result.includes(' / '), 'should use separator');
});

test('isOthersFieldEmpty: 空判定', () => {
  assert.strictEqual(isOthersFieldEmpty([]), true, 'empty array is empty');
  assert.strictEqual(isOthersFieldEmpty(null), true, 'null is empty');
  assert.strictEqual(isOthersFieldEmpty(undefined), true, 'undefined is empty');
  assert.strictEqual(isOthersFieldEmpty([{ agentId: 'joe', gist: 'test', toneTags: [], forceTags: [] }]),
    false, 'non-empty array is not empty');
});
