import test from 'node:test'
import assert from 'node:assert/strict'

import { buildCompareViewModel } from './buildCompareViewModel.js'

test('compare view model collects fixed summary, quality dimensions, and labels', () => {
  const vm = buildCompareViewModel({
    agentId: 'creative',
    userText: '作品を出したい',
    baselineReply: 'やってみようぜ。小さく動こう。',
    currentReply: 'やってみよう。まず一歩を決めよう。',
    outerGuide: '得たもの: 自然さ, 押しつけの少なさ\n失ったもの: 具体性, キャラの輪郭\n改善提案: 冒頭の焦点を少しだけ強くする',
    currentUsesInternalOS: true,
    mode: 'medium',
    revisionLabels: ['good-character', 'good-character', 'too-thin'],
  })

  assert.equal(vm.agentId, 'creative')
  assert.match(vm.userText, /作品/)
  assert.match(vm.baselineReply, /やってみよう/)
  assert.match(vm.currentReply, /一歩/)
  assert.match(vm.outerGuide, /得たもの/)
  assert.equal(vm.summary.currentUsesInternalOS, true)
  assert.equal(vm.summary.mode, 'medium')
  assert.ok(vm.summary.baselineLength > 0)
  assert.ok(vm.summary.currentLength > 0)
  assert.equal(vm.summary.sameOpening, true)

  assert.deepEqual(vm.compareSummary.gained, ['自然さ', '押しつけの少なさ'])
  assert.deepEqual(vm.compareSummary.lost, ['具体性', 'キャラの輪郭'])
  assert.equal(vm.compareSummary.hint, '冒頭の焦点を少しだけ強くする')
  assert.equal(vm.guideHint, '冒頭の焦点を少しだけ強くする')
  assert.equal(vm.compareCoach.hint, '冒頭の焦点を少しだけ強くする')

  assert.equal(vm.qualityObservations.naturalness.gained, true)
  assert.equal(vm.qualityObservations.specificity.lost, true)
  assert.equal(vm.qualityObservations.characterPresence.lost, true)
  assert.equal(vm.qualityObservations.joeNess.applicable, true)

  assert.equal(vm.qualityDimensions.find((dimension) => dimension.key === 'naturalness')?.status, 'gained')
  assert.equal(vm.qualityDimensions.find((dimension) => dimension.key === 'specificity')?.status, 'lost')
  assert.equal(vm.qualityDimensions.find((dimension) => dimension.key === 'receivability')?.status, 'unmentioned')

  assert.deepEqual(vm.revisionLabels, ['good-character', 'too-thin'])
  assert.deepEqual(vm.labels.selected, ['good-character', 'too-thin'])
  assert.ok(vm.labels.available.includes('good-joe'))
})

test('joe compare view model emits joe review priorities and suggested labels', () => {
  const vm = buildCompareViewModel({
    agentId: 'creative',
    userText: '作品を出したいけど怖い',
    baselineReply: '怖いなら、その怖さの芯をひとつ掴もう。',
    currentReply: '大丈夫。きっと大丈夫だから、一緒にゆっくり整理すると、作品を出したいけど怖い気持ちの理由も見えてくる。',
    outerGuide: '得たもの: 自然さ, 受け取りやすさ\n失ったもの: 具体性, キャラの輪郭, ジョーらしさ\n改善提案: 冒頭で怖さの芯にもう一度触れる',
  })

  assert.equal(vm.joeObservationFlags.joeGrounding, true)
  assert.equal(vm.joeObservationFlags.joeOverSoftened, true)
  assert.equal(vm.joeObservationFlags.joeTooExplanatory, true)
  assert.equal(vm.joeObservationFlags.joeFocus, 'medium')
  assert.equal(vm.joeObservationFlags.joeGroundingLevel, 'grounded')
  assert.equal(vm.joeObservationFlags.joeDrift, 'mixed')
  assert.equal(vm.qualityObservations.joeNess.lost, true)

  assert.equal(vm.joeReview.applicable, true)
  assert.equal(vm.joeReview.focus, 'medium')
  assert.equal(vm.joeReview.grounding, 'grounded')
  assert.equal(vm.joeReview.drift, 'mixed')
  assert.equal(vm.joeReview.characterDensity, 'thin')
  assert.equal(vm.joeReview.livingThread, 'unclear')
  assert.equal(vm.joeReview.priorities.find((priority) => priority.key === 'joeFocus')?.value, 'medium')
  assert.equal(vm.joeReview.priorities.find((priority) => priority.key === 'joeDrift')?.value, 'mixed')

  assert.ok(vm.suggestedRevisionLabels.includes('too-thin'))
  assert.ok(vm.suggestedRevisionLabels.includes('too-explanatory'))
})

test('compare view model accepts and normalizes layer previews', () => {
  const vm = buildCompareViewModel({
    agentId: 'creative',
    userText: 'test',
    baselineReply: 'baseline',
    currentReply: 'current',
    outerGuide: '',
    existenceLayerPreview: {
      layer1: {
        selfPresence: 0.5,
        selfLocationStability: 0.6,
        groundedHereNow: 0.55,
        allowUnfinishedSelf: 0.7,
        existenceHintKey: 'test-hint',
      },
      layer2: {
        agentIdentityKey: 'creative-light-bearer',
        agentIdentityText: 'test identity',
        recalledSelfTraits: ['trait1', 'trait2'],
        selfRememberingStrength: 0.8,
      },
    },
    beliefLayerPreview: {
      layer1: [
        { id: 'core-1', text: 'Core belief 1', weight: 0.9 },
        { id: 'core-2', text: 'Core belief 2', weight: 0.85 },
      ],
      layer2: [{ id: 'mid-1', text: 'Mid belief', weight: 0.5 }],
      layer3: [{ id: 'soft-1', text: 'Soft belief', weight: 0.3 }],
    },
  })

  assert.ok(vm.existencePreview)
  assert.equal(vm.existencePreview.layer1.selfPresence, 0.5)
  assert.equal(vm.existencePreview.layer1.existenceHintKey, 'test-hint')
  assert.equal(vm.existencePreview.layer2.agentIdentityKey, 'creative-light-bearer')
  assert.deepEqual(vm.existencePreview.layer2.recalledSelfTraits, ['trait1', 'trait2'])

  assert.ok(vm.beliefPreview)
  assert.equal(vm.beliefPreview.layer1.length, 2)
  assert.equal(vm.beliefPreview.layer1[0].id, 'core-1')
  assert.equal(vm.beliefPreview.layer1[0].text, 'Core belief 1')
  assert.equal(vm.beliefPreview.layer1[0].weight, 0.9)
  assert.equal(vm.beliefPreview.layer2.length, 1)
  assert.equal(vm.beliefPreview.layer3.length, 1)

  assert.equal(vm.summary.hasExistencePreview, true)
  assert.equal(vm.summary.hasBeliefPreview, true)
})

test('compare view model handles null layer previews', () => {
  const vm = buildCompareViewModel({
    agentId: 'creative',
    userText: 'test',
    baselineReply: 'baseline',
    currentReply: 'current',
    outerGuide: '',
  })

  assert.equal(vm.existencePreview, null)
  assert.equal(vm.beliefPreview, null)
  assert.equal(vm.summary.hasExistencePreview, false)
  assert.equal(vm.summary.hasBeliefPreview, false)
})
