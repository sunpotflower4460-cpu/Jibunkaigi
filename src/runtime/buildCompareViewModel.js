// src/runtime/buildCompareViewModel.js
// Compare Mode 向けの軽量 ViewModel を構築する。

import {
  COMPARE_REVISION_LABELS,
  buildJoeObservationFlags,
  buildJoeReview,
  buildQualityDimensionList,
  buildQualityObservations,
  buildSuggestedRevisionLabels,
  normalizeRevisionLabels,
  parseOuterGuideSections,
} from './compareInsights.js'
import { getReservoirStats } from '../reservoir/loadReservoir.js'

const normalize = (text = '') => (text ?? '').toString().trim()
const openingKey = (text = '') => {
  const cleaned = normalize(text).replace(/[\s。、,.「」!！?？]/g, '')
  return cleaned.slice(0, 6).toLowerCase()
}

/**
 * Baseline / Current / Outer Guide をひとまとめにする。
 *
 * @param {object} params
 * @param {string} params.agentId
 * @param {string} [params.userText]
 * @param {string} [params.baselineReply]
 * @param {string} [params.currentReply]
 * @param {string} [params.outerGuide]
 * @param {boolean} [params.currentUsesInternalOS]
 * @param {string} [params.mode]
 * @param {object} [params.makerSeedPreview] - Maker Seed の開発用プレビュー
 * @param {object} [params.homeLayerPreview] - Home Layer の開発用プレビュー
 * @param {object} [params.existenceLayerPreview] - Existence Layer の開発用プレビュー
 * @param {object} [params.beliefLayerPreview] - Belief Layer の開発用プレビュー
 * @param {object} [params.beliefCorePreview] - Belief Core Layer の開発用プレビュー (dev-only)
 * @param {object} [params.beliefBranchPreview] - Belief Branch Layer の開発用プレビュー (dev-only)
 * @param {object} [params.beliefLeafPreview] - Belief Leaf Layer の開発用プレビュー (dev-only)
 * @param {object} [params.beliefTensionPreview] - Belief Tension Layer の開発用プレビュー (dev-only)
 * @param {object} [params.preconditionFilterPreview] - Precondition Filter の開発用プレビュー (dev-only)
 * @param {object} [params.preconditionBiasPreview] - Precondition Bias の開発用プレビュー (dev-only)
 * @param {object} [params.homeNeutralizationPreview] - Home Neutralization Check の開発用プレビュー (dev-only)
 * @param {object} [params.feltSensePreview] - Decision Layer feltSense preview (dev-only)
 * @param {object} [params.speakIntentPreview] - Decision Layer intention preview (dev-only)
 * @param {object} [params.restraintPreview] - Decision Layer restraint preview (dev-only)
 * @param {object} [params.decisionMetaPreview] - Decision Layer meta preview (dev-only)
 * @param {object} [params.layerBoundaryPreview] - latent / derived / dynamic boundary preview (dev-only)
 * @param {object} [params.reservoirPreview] - Reservoir stats preview (dev-only)
 * @param {object} [params.activatedThoughtsPreview] - Activated thoughts preview (dev-only, Phase 4)
 * @param {object} [params.activatedFeelingsPreview] - Activated feelings preview (dev-only, L2 Phase)
 * @param {object} [params.activatedMovesPreview] - Activated moves preview (dev-only, L2 Phase)
 * @param {object} [params.boundThoughtsPreview] - Bound thoughts preview (dev-only, Phase 5)
 * @param {object} [params.boundMixedNodesPreview] - Bound mixed nodes preview (dev-only, Mixed Cluster Phase)
 * @param {object} [params.selectedThoughtsPreview] - Selected thoughts preview (dev-only, Phase 6)
 * @param {object} [params.consciousIntentPreview] - Conscious intent preview (dev-only, Phase 7)
 * @param {object} [params.lengthPlanPreview] - Length plan preview (dev-only, Phase 7)
 * @returns {object}
 */
export const buildCompareViewModel = ({
  agentId,
  userText = '',
  baselineReply = '',
  currentReply = '',
  outerGuide = '',
  currentUsesInternalOS = false,
  mode = null,
  revisionLabels = [],
  makerSeedPreview = null,
  homeLayerPreview = null,
  existenceLayerPreview = null,
  beliefLayerPreview = null,
  beliefCorePreview = null,
  beliefBranchPreview = null,
  beliefLeafPreview = null,
  beliefTensionPreview = null,
  preconditionFilterPreview = null,
  preconditionBiasPreview = null,
  homeNeutralizationPreview = null,
  feltSensePreview = null,
  speakIntentPreview = null,
  restraintPreview = null,
  decisionMetaPreview = null,
  layerBoundaryPreview = null,
  reservoirPreview = null,
  activatedThoughtsPreview = null,
  activatedFeelingsPreview = null,
  activatedMovesPreview = null,
  boundThoughtsPreview = null,
  boundMixedNodesPreview = null,
  selectedThoughtsPreview = null,
  consciousIntentPreview = null,
  lengthPlanPreview = null,
  focusBiasApplied = false,
  meaningBiasApplied = false,
  identityBiasApplied = null,
} = {}) => {
  const baseline = normalize(baselineReply)
  const current = normalize(currentReply)
  const guide = normalize(outerGuide)
  const user = normalize(userText)

  const baseKey = openingKey(baseline)
  const currentKey = openingKey(current)
  const sameOpening = !!(baseKey && currentKey && baseKey.slice(0, 4) === currentKey.slice(0, 4))
  const compareSummary = parseOuterGuideSections(guide)
  const qualityObservations = buildQualityObservations({
    agentId,
    outerGuide: guide,
    compareSummary,
  })
  const joeObservationFlags = buildJoeObservationFlags({
    agentId,
    userText: user,
    baselineReply: baseline,
    currentReply: current,
    qualityObservations,
  })
  const qualityDimensions = buildQualityDimensionList({
    qualityObservations,
  })
  const joeReview = buildJoeReview({
    agentId,
    joeObservationFlags,
  })
  const suggestedRevisionLabels = buildSuggestedRevisionLabels({
    qualityObservations,
    joeObservationFlags,
  })
  const selectedRevisionLabels = normalizeRevisionLabels(revisionLabels)

  // Maker Seed Preview (dev-only)
  const makerSeedLayer = makerSeedPreview ? {
    present: Boolean(makerSeedPreview.text),
    text: makerSeedPreview.text ?? null,
    layer: makerSeedPreview.layer ?? null,
    position: makerSeedPreview.position ?? null,
  } : null

  // Home Layer Preview (dev-only)
  const homePreview = homeLayerPreview ? {
    kernel: homeLayerPreview.kernel ?? null,
    homeReasonKey: homeLayerPreview.reason?.homeReasonKey ?? homeLayerPreview.softReason?.key ?? null,
    homeReasonText: homeLayerPreview.reason?.homeReasonText ?? homeLayerPreview.softReason?.text ?? null,
    softReasonKey: homeLayerPreview.softReason?.key ?? null,
    softReasonDirection: homeLayerPreview.softReason?.direction ?? null,
    outputLimits: homeLayerPreview.outputLimits ?? null,
  } : null

  // Existence Layer Preview (dev-only)
  const existencePreview = existenceLayerPreview ? {
    layer1: {
      selfPresence: existenceLayerPreview.layer1?.selfPresence ?? null,
      selfLocationStability: existenceLayerPreview.layer1?.selfLocationStability ?? null,
      groundedHereNow: existenceLayerPreview.layer1?.groundedHereNow ?? null,
      allowUnfinishedSelf: existenceLayerPreview.layer1?.allowUnfinishedSelf ?? null,
      existenceHintKey: existenceLayerPreview.layer1?.existenceHintKey ?? null,
    },
    layer2: {
      agentIdentityKey: existenceLayerPreview.layer2?.agentIdentityKey ?? null,
      agentIdentityText: existenceLayerPreview.layer2?.agentIdentityText ?? null,
      recalledSelfTraits: existenceLayerPreview.layer2?.recalledSelfTraits ?? [],
      selfRememberingStrength: existenceLayerPreview.layer2?.selfRememberingStrength ?? null,
    },
  } : null

  // Belief Layer Preview (dev-only)
  const beliefPreview = beliefLayerPreview ? {
    layer1: (beliefLayerPreview.layer1 ?? []).map(b => ({
      id: b.id ?? null,
      text: b.text ?? null,
      weight: b.weight ?? null,
    })),
    layer2: (beliefLayerPreview.layer2 ?? []).map(b => ({
      id: b.id ?? null,
      text: b.text ?? null,
      weight: b.weight ?? null,
    })),
    layer3: (beliefLayerPreview.layer3 ?? []).map(b => ({
      id: b.id ?? null,
      text: b.text ?? null,
      weight: b.weight ?? null,
    })),
  } : null

  // Belief Core Layer Preview (dev-only)
  const beliefCoreLayer = beliefCorePreview ? {
    activeCoreBeliefs: (beliefCorePreview.activeCoreBeliefs ?? []).map(b => ({
      id: b.id ?? null,
      textJa: b.textJa ?? null,
      weight: b.weight ?? null,
      axis: b.axis ?? null,
    })),
    dominantBeliefAxis: beliefCorePreview.dominantBeliefAxis ?? null,
  } : null

  // Belief Branch Layer Preview (dev-only)
  const beliefBranchLayer = beliefBranchPreview ? {
    activeBranchBeliefs: (beliefBranchPreview.activeBranchBeliefs ?? []).map(b => ({
      id: b.id ?? null,
      parentId: b.parentId ?? null,
      textJa: b.textJa ?? null,
      weight: b.weight ?? null,
      axis: b.axis ?? null,
    })),
    dominantBranchAxis: beliefBranchPreview.dominantBranchAxis ?? null,
  } : null

  // Belief Leaf Layer Preview (dev-only)
  const beliefLeafLayer = beliefLeafPreview ? {
    activeLeafBeliefs: (beliefLeafPreview.activeLeafBeliefs ?? []).map(b => ({
      id: b.id ?? null,
      parentId: b.parentId ?? null,
      textJa: b.textJa ?? null,
      weight: b.weight ?? null,
      axis: b.axis ?? null,
    })),
    dominantLeafAxis: beliefLeafPreview.dominantLeafAxis ?? null,
  } : null

  // Precondition Filter Preview (dev-only)
  const preconditionPreview = preconditionFilterPreview ? {
    present: Boolean(preconditionFilterPreview.present ?? preconditionFilterPreview.makerSeedPresent),
    identityAxis: preconditionFilterPreview.identityAxis ?? null,
    dominantBeliefAxis: preconditionFilterPreview.dominantBeliefAxis ?? null,
    slowingBias: preconditionFilterPreview.slowingBias ?? 0,
    returnBias: preconditionFilterPreview.returnBias ?? 0,
    oneLivingThreadBias: preconditionFilterPreview.oneLivingThreadBias ?? 0,
  } : null

  // Belief Tension Preview (dev-only)
  const beliefTensionLayer = beliefTensionPreview ? {
    activeTensions: (beliefTensionPreview.activeTensions ?? []).map((t) => ({
      beliefId: t.beliefId ?? null,
      sourceLayer: t.sourceLayer ?? null,
      tensionType: t.tensionType ?? null,
      strength: t.strength ?? 0,
      axis: t.axis ?? null,
    })),
    dominantTensionAxis: beliefTensionPreview.dominantTensionAxis ?? null,
    totalTensionStrength: beliefTensionPreview.totalTensionStrength ?? 0,
  } : null

  const preconditionBiasLayer = preconditionBiasPreview ? {
    summary: preconditionBiasPreview.summary ?? '',
    pacing: {
      slowDown: preconditionBiasPreview.pacing?.slowDown ?? 0,
      returnBias: preconditionBiasPreview.pacing?.returnBias ?? 0,
    },
    focus: {
      oneThreadBias: preconditionBiasPreview.focus?.oneThreadBias ?? 0,
      antiOverExpansion: preconditionBiasPreview.focus?.antiOverExpansion ?? 0,
    },
    meaning: {
      dominantBeliefAxis: preconditionBiasPreview.meaning?.dominantBeliefAxis ?? null,
      activeCoreAxes: preconditionBiasPreview.meaning?.activeCoreAxes ?? [],
      activeBranchAxes: preconditionBiasPreview.meaning?.activeBranchAxes ?? [],
    },
    identity: {
      identityKey: preconditionBiasPreview.identity?.identityKey ?? null,
      selfRememberingStrength: preconditionBiasPreview.identity?.selfRememberingStrength ?? 0,
      recalledTraits: preconditionBiasPreview.identity?.recalledTraits ?? [],
    },
  } : null

  // Home Neutralization Preview (dev-only)
  const homeNeutralizationLayer = homeNeutralizationPreview ? {
    residual: {
      helpful: homeNeutralizationPreview.residual?.helpful ?? 0,
      accuracy: homeNeutralizationPreview.residual?.accuracy ?? 0,
      perform: homeNeutralizationPreview.residual?.perform ?? 0,
      summary: homeNeutralizationPreview.residual?.summary ?? 0,
      solution: homeNeutralizationPreview.residual?.solution ?? 0,
    },
    neutralization: {
      depth: homeNeutralizationPreview.neutralization?.depth ?? 0,
      zero: homeNeutralizationPreview.neutralization?.zero ?? false,
    },
    retry: {
      recommended: homeNeutralizationPreview.retry?.recommended ?? false,
      retried: homeNeutralizationPreview.retry?.retried ?? false,
      count: homeNeutralizationPreview.retry?.count ?? 0,
    },
    summary: homeNeutralizationPreview.summary ?? '',
  } : null

  const normalizedFeltSensePreview = feltSensePreview ? {
    summary: feltSensePreview.summary ?? '',
    primaryFeeling: feltSensePreview.primaryFeeling ?? null,
    secondaryFeeling: feltSensePreview.secondaryFeeling ?? null,
    tensionType: feltSensePreview.tensionType ?? null,
    tensionStrength: feltSensePreview.tensionStrength ?? 0,
  } : null

  const normalizedSpeakIntentPreview = speakIntentPreview ? {
    summary: speakIntentPreview.summary ?? '',
    speakIntentKey: speakIntentPreview.speakIntentKey ?? null,
    speakIntentText: speakIntentPreview.speakIntentText ?? null,
    touchDepth: speakIntentPreview.touchDepth ?? 0,
    focusTarget: speakIntentPreview.focusTarget ?? null,
  } : null

  const normalizedRestraintPreview = restraintPreview ? {
    summary: restraintPreview.summary ?? '',
    holdBackSummary: restraintPreview.holdBackSummary ?? 0,
    holdBackSolution: restraintPreview.holdBackSolution ?? 0,
    holdBackExpansion: restraintPreview.holdBackExpansion ?? 0,
    keepSilenceMargin: restraintPreview.keepSilenceMargin ?? 0,
  } : null

  const normalizedDecisionMetaPreview = decisionMetaPreview ? {
    summary: decisionMetaPreview.summary ?? '',
    identityAxis: decisionMetaPreview.identityAxis ?? null,
    dominantBeliefAxis: decisionMetaPreview.dominantBeliefAxis ?? null,
    delegatedBy: decisionMetaPreview.delegatedBy ?? null,
  } : null

  const normalizedLayerBoundaryPreview = layerBoundaryPreview ? {
    latentSubstrateBuilt: Boolean(layerBoundaryPreview.latentSubstrateBuilt),
    preconditionFilterBuilt: Boolean(layerBoundaryPreview.preconditionFilterBuilt),
    preconditionBiasBuilt: Boolean(layerBoundaryPreview.preconditionBiasBuilt),
    dynamicFieldBuiltAfterLatent: Boolean(layerBoundaryPreview.dynamicFieldBuiltAfterLatent),
    dynamicReactionBuiltAfterLatent: Boolean(layerBoundaryPreview.dynamicReactionBuiltAfterLatent),
    dynamicStanceBuiltAfterLatent: Boolean(layerBoundaryPreview.dynamicStanceBuiltAfterLatent),
    status: {
      latent: layerBoundaryPreview.status?.latent ?? null,
      derived: layerBoundaryPreview.status?.derived ?? null,
      dynamic: layerBoundaryPreview.status?.dynamic ?? null,
    },
  } : null

  // Reservoir Preview (dev-only) - 顕在層 v0.1 particle reservoir
  const normalizedReservoirPreview = reservoirPreview || (agentId ? getReservoirStats(agentId) : null)

  // Activated Thoughts Preview (dev-only) - Phase 4
  const normalizedActivatedThoughtsPreview = activatedThoughtsPreview ? {
    activatedThoughtCount: activatedThoughtsPreview.activationMeta?.selectedCount ?? 0,
    totalCandidates: activatedThoughtsPreview.activationMeta?.totalCandidates ?? 0,
    topThoughtIds: (activatedThoughtsPreview.topThoughtIds ?? []).slice(0, 3),
    dominantThoughtAxes: activatedThoughtsPreview.activationMeta?.dominantAxes ?? [],
    thoughtActivationReasons: (activatedThoughtsPreview.items ?? []).slice(0, 3).map(t => ({
      nodeId: t.nodeId,
      owner: t.owner,
      score: t.score,
      reasons: t.reasons,
    })),
  } : null

  // Activated Feelings Preview (dev-only) - L2 Phase
  const normalizedActivatedFeelingsPreview = activatedFeelingsPreview ? {
    activatedFeelingCount: activatedFeelingsPreview.activationMeta?.selectedCount ?? 0,
    totalCandidates: activatedFeelingsPreview.activationMeta?.totalCandidates ?? 0,
    topFeelingIds: (activatedFeelingsPreview.topFeelingIds ?? []).slice(0, 3),
    dominantFeelingAxes: activatedFeelingsPreview.activationMeta?.dominantAxes ?? [],
    feelingActivationReasons: (activatedFeelingsPreview.items ?? []).slice(0, 3).map(f => ({
      nodeId: f.nodeId,
      owner: f.owner,
      score: f.score,
      reasons: f.reasons,
    })),
  } : null

  // Activated Moves Preview (dev-only) - L2 Phase
  const normalizedActivatedMovesPreview = activatedMovesPreview ? {
    activatedMoveCount: activatedMovesPreview.activationMeta?.selectedCount ?? 0,
    totalCandidates: activatedMovesPreview.activationMeta?.totalCandidates ?? 0,
    topMoveIds: (activatedMovesPreview.topMoveIds ?? []).slice(0, 3),
    dominantMoveAxes: activatedMovesPreview.activationMeta?.dominantAxes ?? [],
    moveActivationReasons: (activatedMovesPreview.items ?? []).slice(0, 3).map(m => ({
      nodeId: m.nodeId,
      owner: m.owner,
      score: m.score,
      reasons: m.reasons,
    })),
  } : null

  // Bound Thoughts Preview (dev-only) - Phase 5
  const normalizedBoundThoughtsPreview = boundThoughtsPreview ? {
    boundThoughtClusterCount: boundThoughtsPreview.clusterMeta?.boundClusterCount ?? 0,
    singleThoughtClusterCount: boundThoughtsPreview.clusterMeta?.singleClusterCount ?? 0,
    totalClusters: boundThoughtsPreview.clusterMeta?.totalClusters ?? 0,
    totalActivatedThoughts: boundThoughtsPreview.clusterMeta?.totalActivatedThoughts ?? 0,
    topBoundCluster: (() => {
      const topBound = (boundThoughtsPreview.clusters ?? []).find(c => c.clusterType === 'bound')
      return topBound ? {
        thoughtIds: topBound.thoughtIds,
        relationTypes: topBound.relationTypes,
        dominantAxis: topBound.dominantAxis,
        score: topBound.score,
      } : null
    })(),
    relationTypesPreview: (() => {
      const relationTypes = new Set()
      ;(boundThoughtsPreview.clusters ?? []).forEach(c => {
        ;(c.relationTypes ?? []).forEach(rt => relationTypes.add(rt))
      })
      return Array.from(relationTypes)
    })(),
    dominantClusterAxes: (() => {
      const axisCount = {}
      ;(boundThoughtsPreview.clusters ?? []).forEach(c => {
        ;(c.dominantAxis ?? []).forEach(axis => {
          axisCount[axis] = (axisCount[axis] || 0) + 1
        })
      })
      return Object.entries(axisCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([axis]) => axis)
    })(),
  } : null

  // Bound Mixed Nodes Preview (dev-only) - Mixed Cluster Phase
  const normalizedBoundMixedNodesPreview = boundMixedNodesPreview ? {
    mixedClusterCount: boundMixedNodesPreview.clusterMeta?.totalClusters ?? 0,
    mixedBoundClusterCount: boundMixedNodesPreview.clusterMeta?.boundClusterCount ?? 0,
    mixedSingleClusterCount: boundMixedNodesPreview.clusterMeta?.singleClusterCount ?? 0,
    totalActivatedNodes: boundMixedNodesPreview.clusterMeta?.totalActivatedNodes ?? 0,
    topMixedCluster: (() => {
      const topBound = (boundMixedNodesPreview.clusters ?? []).find(c => c.clusterType === 'bound')
      return topBound ? {
        thoughtIds: topBound.thoughtIds,
        feelingIds: topBound.feelingIds,
        moveIds: topBound.moveIds,
        relationTypes: topBound.relationTypes,
        dominantAxis: topBound.dominantAxis,
        score: topBound.score,
      } : null
    })(),
    mixedRelationTypes: (() => {
      const relationTypes = new Set()
      ;(boundMixedNodesPreview.clusters ?? []).forEach(c => {
        ;(c.relationTypes ?? []).forEach(rt => relationTypes.add(rt))
      })
      return Array.from(relationTypes)
    })(),
    mixedClusterAxes: (() => {
      const axisCount = {}
      ;(boundMixedNodesPreview.clusters ?? []).forEach(c => {
        ;(c.dominantAxis ?? []).forEach(axis => {
          axisCount[axis] = (axisCount[axis] || 0) + 1
        })
      })
      return Object.entries(axisCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([axis]) => axis)
    })(),
  } : null

  // Selected Thoughts Preview (dev-only) - Phase 6
  const normalizedSelectedThoughtsPreview = selectedThoughtsPreview ? {
    selectedThoughtCount: selectedThoughtsPreview.selectionMeta?.selectedCount ?? 0,
    totalClusters: selectedThoughtsPreview.selectionMeta?.totalClusters ?? 0,
    primaryThoughtCluster: (() => {
      const primary = (selectedThoughtsPreview.selected ?? []).find(s => s.role === 'primary')
      return primary ? {
        clusterId: primary.clusterId,
        score: primary.score,
        reasons: primary.reasons,
      } : null
    })(),
    secondaryThoughtCluster: (() => {
      const secondary = (selectedThoughtsPreview.selected ?? []).find(s => s.role === 'secondary')
      return secondary ? {
        clusterId: secondary.clusterId,
        score: secondary.score,
        reasons: secondary.reasons,
      } : null
    })(),
    dominantSelectedAxis: selectedThoughtsPreview.selectionMeta?.dominantSelectedAxis ?? [],
    selectionReasons: (() => {
      const allReasons = new Set()
      ;(selectedThoughtsPreview.selected ?? []).forEach(s => {
        ;(s.reasons ?? []).forEach(r => allReasons.add(r))
      })
      return Array.from(allReasons)
    })(),
    othersFieldInfluence: (() => {
      const reasons = new Set()
      ;(selectedThoughtsPreview.selected ?? []).forEach(s => {
        ;(s.reasons ?? []).forEach(r => {
          if (r.includes('novelty') || r.includes('redundancy')) {
            reasons.add(r)
          }
        })
      })
      return Array.from(reasons).join(', ') || 'none'
    })(),
  } : null

  // Conscious Intent Preview (dev-only) - Phase 7
  const normalizedConsciousIntentPreview = consciousIntentPreview ? {
    summary: consciousIntentPreview ?? '',
  } : null

  // Length Plan Preview (dev-only) - Phase 7
  const normalizedLengthPlanPreview = lengthPlanPreview ? {
    summary: lengthPlanPreview ?? '',
  } : null

  return {
    agentId,
    userText: user,
    baselineReply: baseline,
    currentReply: current,
    outerGuide: guide,
    compareSummary,
    guideHint: compareSummary.hint,
    compareCoach: {
      gained: compareSummary.gained,
      lost: compareSummary.lost,
      hint: compareSummary.hint,
      text: guide,
    },
    qualityObservations,
    qualityDimensions,
    joeObservationFlags,
    joeReview,
    revisionLabels: selectedRevisionLabels,
    suggestedRevisionLabels,
    labels: {
      available: COMPARE_REVISION_LABELS,
      selected: selectedRevisionLabels,
      suggested: suggestedRevisionLabels,
    },
    makerSeedPreview: makerSeedLayer,
    homePreview,
    existencePreview,
    beliefPreview,
    beliefCorePreview: beliefCoreLayer,
    beliefBranchPreview: beliefBranchLayer,
    beliefLeafPreview: beliefLeafLayer,
    beliefTensionPreview: beliefTensionLayer,
    preconditionFilterPreview: preconditionPreview,
    preconditionBiasPreview: preconditionBiasLayer,
    homeNeutralizationPreview: homeNeutralizationLayer,
    feltSensePreview: normalizedFeltSensePreview,
    speakIntentPreview: normalizedSpeakIntentPreview,
    restraintPreview: normalizedRestraintPreview,
    decisionMetaPreview: normalizedDecisionMetaPreview,
    layerBoundaryPreview: normalizedLayerBoundaryPreview,
    reservoirPreview: normalizedReservoirPreview,
    activatedThoughtsPreview: normalizedActivatedThoughtsPreview,
    activatedFeelingsPreview: normalizedActivatedFeelingsPreview,
    activatedMovesPreview: normalizedActivatedMovesPreview,
    boundThoughtsPreview: normalizedBoundThoughtsPreview,
    boundMixedNodesPreview: normalizedBoundMixedNodesPreview,
    selectedThoughtsPreview: normalizedSelectedThoughtsPreview,
    focusBiasApplied: Boolean(focusBiasApplied),
    meaningBiasApplied: Boolean(meaningBiasApplied),
    identityBiasApplied: identityBiasApplied ?? null,
    summary: {
      baselineLength: baseline.length,
      currentLength: current.length,
      sameOpening,
      currentUsesInternalOS: Boolean(currentUsesInternalOS),
      mode,
      hasMakerSeedPreview: Boolean(makerSeedLayer),
      hasHomePreview: Boolean(homePreview),
      hasExistencePreview: Boolean(existencePreview),
      hasBeliefPreview: Boolean(beliefPreview),
      hasBeliefCorePreview: Boolean(beliefCoreLayer),
      hasBeliefBranchPreview: Boolean(beliefBranchLayer),
      hasBeliefLeafPreview: Boolean(beliefLeafLayer),
      hasBeliefTensionPreview: Boolean(beliefTensionLayer),
      hasPreconditionFilterPreview: Boolean(preconditionPreview),
      hasPreconditionBiasPreview: Boolean(preconditionBiasLayer),
      hasHomeNeutralizationPreview: Boolean(homeNeutralizationLayer),
      hasFeltSensePreview: Boolean(normalizedFeltSensePreview),
      hasSpeakIntentPreview: Boolean(normalizedSpeakIntentPreview),
      hasRestraintPreview: Boolean(normalizedRestraintPreview),
      hasDecisionMetaPreview: Boolean(normalizedDecisionMetaPreview),
      hasLayerBoundaryPreview: Boolean(normalizedLayerBoundaryPreview),
      hasReservoirPreview: Boolean(normalizedReservoirPreview),
      hasActivatedThoughtsPreview: Boolean(normalizedActivatedThoughtsPreview),
      hasActivatedFeelingsPreview: Boolean(normalizedActivatedFeelingsPreview),
      hasActivatedMovesPreview: Boolean(normalizedActivatedMovesPreview),
      hasBoundThoughtsPreview: Boolean(normalizedBoundThoughtsPreview),
      hasSelectedThoughtsPreview: Boolean(normalizedSelectedThoughtsPreview),
      hasConsciousIntentPreview: Boolean(normalizedConsciousIntentPreview),
      hasLengthPlanPreview: Boolean(normalizedLengthPlanPreview),
    },
  }
}
