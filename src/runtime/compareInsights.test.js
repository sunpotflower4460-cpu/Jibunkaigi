import test from 'node:test'
import assert from 'node:assert/strict'

import {
  formatCompareCopyBundle,
  parseOuterGuideSections,
  readCompareLabelStore,
  toggleCompareRevisionLabel,
  writeCompareLabelStore,
} from './compareInsights.js'

test('outer guide sections parse gained/lost/hint structure', () => {
  const summary = parseOuterGuideSections([
    '得たもの: 自然さ, 余白',
    '失ったもの: 具体性, キャラの輪郭',
    '提案: 冒頭の焦点を少しだけ強くする',
  ].join('\n'))

  assert.deepEqual(summary.gained, ['自然さ', '余白'])
  assert.deepEqual(summary.lost, ['具体性', 'キャラの輪郭'])
  assert.equal(summary.hint, '冒頭の焦点を少しだけ強くする')
})

test('compare revision labels are kept in local-only store shape', () => {
  const toggled = toggleCompareRevisionLabel({}, 'session-1:msg-1', 'good-joe')
  const next = toggleCompareRevisionLabel(toggled, 'session-1:msg-1', 'too-thin')

  let writtenValue = null
  writeCompareLabelStore(next, {
    storageSetter: (value) => {
      writtenValue = value
    },
  })

  const restored = readCompareLabelStore({
    storageGetter: () => writtenValue,
  })

  assert.deepEqual(restored['session-1:msg-1'], ['good-joe', 'too-thin'])
})

test('compare copy bundle includes summary and labels', () => {
  const text = formatCompareCopyBundle({
    userText: '作品を出したいけど怖い',
    baselineReply: '怖さの芯を掴もう。',
    currentReply: 'その怖さに、まずひとつ触れよう。',
    outerGuide: '得たもの: 自然さ\n失ったもの: 具体性\n提案: 冒頭の焦点を強める',
    compareSummary: {
      gained: ['自然さ'],
      lost: ['具体性'],
      hint: '冒頭の焦点を強める',
    },
    revisionLabels: ['too-thin', 'good-joe'],
  })

  assert.match(text, /\[User\]/)
  assert.match(text, /\[Baseline\]/)
  assert.match(text, /\[Current\]/)
  assert.match(text, /\[Outer Guide\]/)
  assert.match(text, /\[Summary\]/)
  assert.match(text, /gained: 自然さ/)
  assert.match(text, /lost: 具体性/)
  assert.match(text, /hint: 冒頭の焦点を強める/)
  assert.match(text, /\[Labels\]/)
  assert.match(text, /too-thin, good-joe/)
})
