// src/runtime/surfaceDebug.js
// Surface Translator debug helper — dev-only, no Firestore, no production exposure

export const SURFACE_DEBUG_MAX_ENTRIES = 8;

export const isSurfaceDebugEnabled = () => {
  try {
    if (typeof import.meta !== 'undefined' && !import.meta.env?.DEV) return false;
    if (typeof window === 'undefined') return false;
    const qp = new URLSearchParams(window.location.search).get('debugSurface');
    if (qp === '1') return true;
    return localStorage.getItem('jibunkaigi:debugSurface') === '1';
  } catch {
    return false;
  }
};

export const truncateForDebug = (text, max = 140) => {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  return trimmed.length > max ? trimmed.slice(0, max) + '…' : trimmed;
};

// Build a short internal guidance preview from surfaceFrame (mirrors logic in buildPrompt / mirror)
const buildGuidancePreview = (surfaceFrame, isMirror) => {
  if (!surfaceFrame) return '';

  const hints = [];

  if (isMirror) {
    if (surfaceFrame.pacing === 'slow') hints.push('急がずに映す');
    if (surfaceFrame.directness === 'gentle') hints.push('やわらかく照らす');
    if (surfaceFrame.emotionalTemperature === 'soft') hints.push('軽く言い当てる');
    if (surfaceFrame.permissionHints?.includes('do_not_rush')) hints.push('結論を急がない');
  } else {
    if (surfaceFrame.pacing === 'slow') hints.push('急がず、余白を残していい');
    if (surfaceFrame.pacing === 'aware_of_time') hints.push('時間を意識しつつ進める');
    if (surfaceFrame.directness === 'gentle') hints.push('少しやわらかく入る');
    if (surfaceFrame.directness === 'clear') hints.push('少し明確に示していい');
    if (surfaceFrame.emotionalTemperature === 'soft') hints.push('言い切りすぎない');
    if (surfaceFrame.permissionHints?.includes('do_not_rush')) hints.push('急がない');
    if (surfaceFrame.permissionHints?.includes('do_not_over_explain')) hints.push('説明しすぎない');
  }

  if (surfaceFrame.surfaceHint) hints.push(surfaceFrame.surfaceHint);
  if (surfaceFrame.speakIntentKey) hints.push(`intent=${surfaceFrame.speakIntentKey}`);

  return truncateForDebug(hints.join(' / '));
};

export const buildSurfaceDebugEntry = ({
  agentId = '',
  isMirror = false,
  selectedMode = '',
  latestUserText = '',
  continuityInternalOS = null,
  surfaceFrame = null,
  surfaceGuidance = '',
  afterglowSeed = null,
  agentQualityPreview = null,
}) => {
  const frame = surfaceFrame || {};
  const usedAfterglow = !!(
    afterglowSeed &&
    (afterglowSeed.previousMix || afterglowSeed.previousLatentState)
  );

  return {
    timestamp: Date.now(),
    agentId,
    isMirror,
    mode: selectedMode,
    latestUserPreview: truncateForDebug(latestUserText),
    usedAfterglow,
    dominantPatterns: Array.isArray(frame.dominantPatterns) ? frame.dominantPatterns : [],
    permissionHints: Array.isArray(frame.permissionHints) ? frame.permissionHints : [],
    pacing: frame.pacing ?? null,
    directness: frame.directness ?? null,
    emotionalTemperature: frame.emotionalTemperature ?? null,
    fieldHint: frame.fieldHint ?? null,
    focusHint: frame.focusHint ?? null,
    meaningHint: frame.meaningHint ?? null,
    identityHint: frame.identityHint ?? null,
    speakIntentKey: frame.speakIntentKey ?? null,
    focusTarget: frame.focusTarget ?? null,
    touchDepth: frame.touchDepth ?? 0,
    restraint: frame.restraint ?? null,
    surfaceHint: frame.surfaceHint ?? null,
    guidancePreview: surfaceGuidance
      ? truncateForDebug(surfaceGuidance)
      : buildGuidancePreview(frame, isMirror),
    mirrorMode: isMirror,
    // internal OS summary (no raw prompts)
    hasInternalOS: !!continuityInternalOS,
    preconditionBiasPreview: continuityInternalOS?.debugInfo?.preconditionBiasPreview ?? null,
    homeNeutralizationPreview: continuityInternalOS?.debugInfo?.homeNeutralizationPreview ?? null,
    feltSensePreview: continuityInternalOS?.debugInfo?.feltSensePreview ?? null,
    speakIntentPreview: continuityInternalOS?.debugInfo?.speakIntentPreview ?? null,
    restraintPreview: continuityInternalOS?.debugInfo?.restraintPreview ?? null,
    decisionMetaPreview: continuityInternalOS?.debugInfo?.decisionMetaPreview ?? null,
    focusBiasApplied: continuityInternalOS?.debugInfo?.focusBiasApplied ?? false,
    meaningBiasApplied: continuityInternalOS?.debugInfo?.meaningBiasApplied ?? false,
    identityBiasApplied: continuityInternalOS?.debugInfo?.identityBiasApplied ?? null,
    // dev-only agent quality preview (no raw prompts)
    agentQualityPreview: agentQualityPreview || null,
  };
};
