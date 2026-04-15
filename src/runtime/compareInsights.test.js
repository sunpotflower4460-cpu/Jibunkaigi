import test from 'node:test'
import assert from 'node:assert/strict'

import {
  COMPARE_JOE_REVIEW_FIELDS,
  COMPARE_QUALITY_DIMENSIONS,
  buildJoeObservationFlags,
  buildJoeReview,
  buildQualityDimensionList,
  buildQualityObservations,
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
    '改善提案: 冒頭の焦点を少しだけ強くする',
  ].join('\n'))

  assert.deepEqual(summary.gained, ['自然さ', '余白'])
  assert.deepEqual(summary.lost, ['具体性', 'キャラの輪郭'])
  assert.equal(summary.hint, '冒頭の焦点を少しだけ強くする')
})

test('compare quality frame keeps fixed dimensions and joe review priorities', () => {
  const compareSummary = parseOuterGuideSections([
    '得たもの: 自然さ, 受け取りやすさ',
    '失ったもの: 具体性, キャラの輪郭, ジョーらしさ',
    '改善提案: 冒頭の焦点を少しだけ強くする',
  ].join('\n'))
  const qualityObservations = buildQualityObservations({
    agentId: 'creative',
    outerGuide: '得たもの: 自然さ, 受け取りやすさ\n失ったもの: 具体性, キャラの輪郭, ジョーらしさ\n改善提案: 冒頭の焦点を少しだけ強くする',
    compareSummary,
  })
  const qualityDimensions = buildQualityDimensionList({ qualityObservations })
  const joeObservationFlags = buildJoeObservationFlags({
    agentId: 'creative',
    userText: '作品を出したいけど怖い',
    baselineReply: '怖さの芯を掴もう。',
    currentReply: '作品を出したいけど怖い、その芯にもう一度触れよう。',
    qualityObservations,
  })
  const joeReview = buildJoeReview({
    agentId: 'creative',
    joeObservationFlags,
  })

  assert.deepEqual(
    qualityDimensions.map((dimension) => dimension.key),
    COMPARE_QUALITY_DIMENSIONS.map((dimension) => dimension.key),
  )
  assert.equal(qualityDimensions.find((dimension) => dimension.key === 'naturalness')?.status, 'gained')
  assert.equal(qualityDimensions.find((dimension) => dimension.key === 'specificity')?.status, 'lost')
  assert.equal(qualityDimensions.find((dimension) => dimension.key === 'joeNess')?.status, 'lost')
  assert.deepEqual(
    joeReview.priorities.map((priority) => priority.key),
    COMPARE_JOE_REVIEW_FIELDS.map((field) => field.key),
  )
  assert.equal(joeReview.focus, 'strong')
  assert.equal(joeReview.grounding, 'grounded')
  assert.equal(joeReview.drift, 'okay')
  assert.equal(joeReview.priorities.find((priority) => priority.key === 'joeLivingThread')?.value, 'picked')
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

test('compare revision label store survives broken json', () => {
  const restored = readCompareLabelStore({
    storageGetter: () => '{broken json',
  })

  assert.deepEqual(restored, {})
})

test('compare copy bundle includes summary, quality frame, joe review, and labels', () => {
  const text = formatCompareCopyBundle({
    userText: '作品を出したいけど怖い',
    baselineReply: '怖さの芯を掴もう。',
    currentReply: 'その怖さに、まずひとつ触れよう。',
    outerGuide: '得たもの: 自然さ\n失ったもの: 具体性\n改善提案: 冒頭の焦点を強める',
    compareSummary: {
      gained: ['自然さ'],
      lost: ['具体性'],
      hint: '冒頭の焦点を強める',
    },
    qualityDimensions: [
      { key: 'naturalness', label: '自然さ', applicable: true, status: 'gained' },
      { key: 'specificity', label: '具体性', applicable: true, status: 'lost' },
    ],
    joeReview: {
      priorities: [
        { key: 'joeFocus', label: 'Joe focus', value: 'strong' },
        { key: 'joeDrift', label: 'Joe drift', value: 'okay' },
      ],
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
  assert.match(text, /\[Quality Dimensions\]/)
  assert.match(text, /自然さ: gained/)
  assert.match(text, /\[Joe Review\]/)
  assert.match(text, /Joe focus: strong/)
  assert.match(text, /\[Labels\]/)
  assert.match(text, /too-thin, good-joe/)
})
