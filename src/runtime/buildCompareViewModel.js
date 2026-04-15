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
    },
  }
}
