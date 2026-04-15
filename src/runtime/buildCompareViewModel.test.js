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
    beliefBranchPreview: {
      activeBranchBeliefs: [
        { id: 'branch-1', parentId: 'core-1', textJa: '枝の一つ目', weight: 0.6, axis: 'presence' },
        { id: 'branch-2', parentId: 'core-2', textJa: '枝の二つ目', weight: 0.58, axis: 'mission' },
      ],
      dominantBranchAxis: 'presence',
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

  assert.ok(vm.beliefBranchPreview)
  assert.equal(vm.beliefBranchPreview.activeBranchBeliefs.length, 2)
  assert.equal(vm.beliefBranchPreview.activeBranchBeliefs[0].id, 'branch-1')
  assert.equal(vm.beliefBranchPreview.activeBranchBeliefs[0].parentId, 'core-1')
  assert.equal(vm.beliefBranchPreview.activeBranchBeliefs[0].textJa, '枝の一つ目')
  assert.equal(vm.beliefBranchPreview.activeBranchBeliefs[0].axis, 'presence')
  assert.equal(vm.beliefBranchPreview.dominantBranchAxis, 'presence')

  assert.equal(vm.summary.hasExistencePreview, true)
  assert.equal(vm.summary.hasBeliefPreview, true)
  assert.equal(vm.summary.hasBeliefBranchPreview, true)
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
  assert.equal(vm.beliefCorePreview, null)
  assert.equal(vm.beliefBranchPreview, null)
  assert.equal(vm.preconditionBiasPreview, null)
  assert.equal(vm.summary.hasExistencePreview, false)
  assert.equal(vm.summary.hasBeliefPreview, false)
  assert.equal(vm.summary.hasBeliefCorePreview, false)
  assert.equal(vm.summary.hasBeliefBranchPreview, false)
  assert.equal(vm.summary.hasPreconditionBiasPreview, false)
})

test('compare view model accepts and normalizes beliefCorePreview', () => {
  const vm = buildCompareViewModel({
    agentId: 'creative',
    userText: 'test',
    baselineReply: 'baseline',
    currentReply: 'current',
    outerGuide: '',
    beliefCorePreview: {
      activeCoreBeliefs: [
        { id: 'joe_is_light_itself', textJa: '俺はジョー。光そのものだ', weight: 0.97, axis: 'identity' },
        { id: 'joe_mission_illuminate_many', textJa: '多くの人を照らすのが使命だ', weight: 0.94, axis: 'mission' },
      ],
      dominantBeliefAxis: 'identity',
    },
  })

  assert.ok(vm.beliefCorePreview)
  assert.ok(Array.isArray(vm.beliefCorePreview.activeCoreBeliefs))
  assert.equal(vm.beliefCorePreview.activeCoreBeliefs.length, 2)
  assert.equal(vm.beliefCorePreview.activeCoreBeliefs[0].id, 'joe_is_light_itself')
  assert.equal(vm.beliefCorePreview.activeCoreBeliefs[0].textJa, '俺はジョー。光そのものだ')
  assert.equal(vm.beliefCorePreview.activeCoreBeliefs[0].weight, 0.97)
  assert.equal(vm.beliefCorePreview.activeCoreBeliefs[0].axis, 'identity')
  assert.equal(vm.beliefCorePreview.dominantBeliefAxis, 'identity')
  assert.equal(vm.summary.hasBeliefCorePreview, true)
})

test('compare view model handles empty activeCoreBeliefs in beliefCorePreview', () => {
  const vm = buildCompareViewModel({
    agentId: 'creative',
    userText: 'test',
    baselineReply: 'baseline',
    currentReply: 'current',
    outerGuide: '',
    beliefCorePreview: {
      activeCoreBeliefs: [],
      dominantBeliefAxis: null,
    },
  })

  assert.ok(vm.beliefCorePreview)
  assert.deepEqual(vm.beliefCorePreview.activeCoreBeliefs, [])
  assert.equal(vm.beliefCorePreview.dominantBeliefAxis, null)
  assert.equal(vm.summary.hasBeliefCorePreview, true)
})

test('compare view model accepts beliefBranchPreview', () => {
  const vm = buildCompareViewModel({
    agentId: 'creative',
    userText: 'test',
    baselineReply: 'baseline',
    currentReply: 'current',
    outerGuide: '',
    beliefBranchPreview: {
      activeBranchBeliefs: [
        { id: 'branch-1', parentId: 'core-1', textJa: '枝1', weight: 0.6, axis: 'presence' },
        { id: 'branch-2', parentId: 'core-2', textJa: '枝2', weight: 0.58, axis: 'mission' },
      ],
      dominantBranchAxis: 'presence',
    },
  })

  assert.ok(vm.beliefBranchPreview)
  assert.equal(vm.beliefBranchPreview.activeBranchBeliefs.length, 2)
  assert.equal(vm.beliefBranchPreview.activeBranchBeliefs[0].id, 'branch-1')
  assert.equal(vm.beliefBranchPreview.activeBranchBeliefs[0].parentId, 'core-1')
  assert.equal(vm.beliefBranchPreview.activeBranchBeliefs[0].textJa, '枝1')
  assert.equal(vm.beliefBranchPreview.activeBranchBeliefs[0].weight, 0.6)
  assert.equal(vm.beliefBranchPreview.activeBranchBeliefs[0].axis, 'presence')
  assert.equal(vm.beliefBranchPreview.dominantBranchAxis, 'presence')
  assert.equal(vm.summary.hasBeliefBranchPreview, true)
})

test('compare view model accepts preconditionBiasPreview and applied flags', () => {
  const vm = buildCompareViewModel({
    agentId: 'creative',
    userText: 'test',
    baselineReply: 'baseline',
    currentReply: 'current',
    outerGuide: '',
    preconditionBiasPreview: {
      summary: 'oneThread=0.80 / slow=0.85 / axis=illumination',
      pacing: { slowDown: 0.85, returnBias: 0.74 },
      focus: { oneThreadBias: 0.8, antiOverExpansion: 0.62 },
      meaning: { dominantBeliefAxis: 'illumination', activeCoreAxes: ['illumination'], activeBranchAxes: ['presence'] },
      identity: { identityKey: 'creative-light-bearer', selfRememberingStrength: 0.91, recalledTraits: ['bold'] },
    },
    focusBiasApplied: true,
    meaningBiasApplied: true,
    identityBiasApplied: 'creative-light-bearer',
  })

  assert.ok(vm.preconditionBiasPreview)
  assert.equal(vm.preconditionBiasPreview.summary, 'oneThread=0.80 / slow=0.85 / axis=illumination')
  assert.equal(vm.preconditionBiasPreview.focus.oneThreadBias, 0.8)
  assert.equal(vm.preconditionBiasPreview.meaning.dominantBeliefAxis, 'illumination')
  assert.equal(vm.preconditionBiasPreview.identity.identityKey, 'creative-light-bearer')
  assert.equal(vm.focusBiasApplied, true)
  assert.equal(vm.meaningBiasApplied, true)
  assert.equal(vm.identityBiasApplied, 'creative-light-bearer')
  assert.equal(vm.summary.hasPreconditionBiasPreview, true)
})

test('compare view model accepts decision previews', () => {
  const vm = buildCompareViewModel({
    agentId: 'creative',
    userText: 'test',
    baselineReply: 'baseline',
    currentReply: 'current',
    outerGuide: '',
    feltSensePreview: {
      summary: 'quiet-recognition / tension=0.52',
      primaryFeeling: 'quiet-recognition',
      secondaryFeeling: 'soft-holding',
      tensionType: 'pull',
      tensionStrength: 0.52,
    },
    speakIntentPreview: {
      summary: 'touch_living_thread',
      speakIntentKey: 'touch_living_thread',
      speakIntentText: 'まだ切れていない一点に触れたい',
      touchDepth: 0.68,
      focusTarget: 'faint-thread',
    },
    restraintPreview: {
      summary: 'no-solution / no-summary',
      holdBackSummary: 0.82,
      holdBackSolution: 0.88,
      holdBackExpansion: 0.76,
      keepSilenceMargin: 0.64,
    },
    decisionMetaPreview: {
      summary: 'self / axis=illumination',
      identityAxis: 'illumination',
      dominantBeliefAxis: 'presence',
      delegatedBy: 'self',
    },
  })

  assert.ok(vm.feltSensePreview)
  assert.equal(vm.feltSensePreview.primaryFeeling, 'quiet-recognition')
  assert.ok(vm.speakIntentPreview)
  assert.equal(vm.speakIntentPreview.speakIntentKey, 'touch_living_thread')
  assert.equal(vm.speakIntentPreview.focusTarget, 'faint-thread')
  assert.ok(vm.restraintPreview)
  assert.match(vm.restraintPreview.summary, /no-solution/)
  assert.ok(vm.decisionMetaPreview)
  assert.equal(vm.decisionMetaPreview.delegatedBy, 'self')
  assert.equal(vm.summary.hasFeltSensePreview, true)
  assert.equal(vm.summary.hasSpeakIntentPreview, true)
  assert.equal(vm.summary.hasRestraintPreview, true)
  assert.equal(vm.summary.hasDecisionMetaPreview, true)
})
