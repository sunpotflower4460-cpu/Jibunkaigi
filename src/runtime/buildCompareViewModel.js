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
    summary: {
      baselineLength: baseline.length,
      currentLength: current.length,
      sameOpening,
      currentUsesInternalOS: Boolean(currentUsesInternalOS),
      mode,
    },
  }
}
