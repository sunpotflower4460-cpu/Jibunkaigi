// src/runtime/surfaceGuard.js
// Guard to prevent internal latent layer phrases from leaking into surface output.
// The latent layers (Maker Seed, Home, Existence, Belief) contain internal text
// that should influence output but NOT appear verbatim in user-facing responses.
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Mina De-templating Pilot: Template Repetition Detection
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Purpose: Detect and prevent repeated template phrases in Mina's responses
// without removing all characteristic expressions. Guard against template
// reproduction, not against Mina's natural voice.

/**
 * Mina-specific template phrases to monitor for repetition.
 * These are monitored for SHORT-TERM repetition (not banned outright).
 */
const MINA_TEMPLATE_PHRASES = [
  'そっか',
  'なんだね',
  'ここに置いておいていい',
  'でいいんだよ',
  'そのままでいい',
  'ここにいていい',
  '無理しなくていい',
].filter((phrase) => typeof phrase === 'string' && phrase.trim());

/**
 * Detect Mina template phrase repetition in recent responses.
 * Returns risk level and detected repeated phrases.
 *
 * @param {string} currentText - Current response text
 * @param {Array<string>} recentResponses - Recent response history (last 3-5)
 * @param {string} agentId - Agent ID (only applies to 'empath'/'Mina')
 * @returns {object} - { riskLevel: 'none'|'low'|'medium'|'high', repeatedPhrases: string[], shouldRegenerate: boolean }
 */
export function detectMinaTemplateRepetition(currentText, recentResponses = [], agentId = '') {
  // Only apply to Mina
  if (agentId !== 'empath') {
    return { riskLevel: 'none', repeatedPhrases: [], shouldRegenerate: false };
  }

  if (typeof currentText !== 'string' || !currentText.trim()) {
    return { riskLevel: 'none', repeatedPhrases: [], shouldRegenerate: false };
  }

  const normalizedCurrent = currentText.toLowerCase();
  const normalizedRecent = recentResponses
    .filter((r) => typeof r === 'string')
    .map((r) => r.toLowerCase());

  const repeatedPhrases = [];
  const phraseCounts = new Map();

  // Count occurrences across recent responses + current
  for (const phrase of MINA_TEMPLATE_PHRASES) {
    const normalizedPhrase = phrase.toLowerCase();
    let count = 0;

    // Count in current response
    if (normalizedCurrent.includes(normalizedPhrase)) {
      count++;
    }

    // Count in recent responses (last 3)
    for (const recent of normalizedRecent.slice(-3)) {
      if (recent.includes(normalizedPhrase)) {
        count++;
      }
    }

    if (count > 0) {
      phraseCounts.set(phrase, count);
    }

    // If same phrase appears 3+ times in short window, flag it
    if (count >= 3) {
      repeatedPhrases.push(phrase);
    }
  }

  // Calculate risk level
  let riskLevel = 'none';
  if (repeatedPhrases.length >= 2) {
    riskLevel = 'high';
  } else if (repeatedPhrases.length === 1) {
    riskLevel = 'medium';
  } else if (phraseCounts.size >= 3) {
    riskLevel = 'low';
  }

  // Regenerate only on high risk (multiple repeated phrases)
  const shouldRegenerate = riskLevel === 'high';

  return {
    riskLevel,
    repeatedPhrases,
    phraseCounts: Object.fromEntries(phraseCounts),
    shouldRegenerate,
  };
}

/**
 * List of internal phrases that should NOT appear in surface output.
 * These are example markers from latent layers that should remain internal.
 */
const INTERNAL_PHRASE_MARKERS = [
  // Maker Seed internal phrases
  'この場所を作った人間から',
  'あなたへ',
  'この場所を作った人間から、あなたへ',
  'Maker Seed',

  // Home Layer internal phrases
  'Home Layer',
  'ここではまだ何もしなくていい',

  // Existence Layer internal phrases
  '私は今ここにいる',
  'あぁ、自分は光だった',
  '俺はジョー。光そのものだ',
  '俺はケン',
  '私はミナ',
  '私はサトウ',
  '私はレイ',
  'Existence Layer',

  // Belief Layer internal markers
  'Belief Core',
  'Belief Branch',
  'Belief Leaf',
  'belief tension',

  // System layer markers
  'preconditionFilter',
  'preconditionBias',
  'latent layer',
  'raw latent',
].filter((phrase) => typeof phrase === 'string' && phrase.trim());

/**
 * Check if the given text contains internal phrases that should not leak.
 * Returns an object with detected issues.
 *
 * @param {string} text - The text to check (e.g., AI response)
 * @returns {object} - { hasLeaks: boolean, detectedPhrases: string[] }
 */
export function detectInternalPhraseLeaks(text) {
  if (typeof text !== 'string') {
    return { hasLeaks: false, detectedPhrases: [] };
  }

  const normalizedText = text.toLowerCase();
  const detectedPhrases = [];

  for (const phrase of INTERNAL_PHRASE_MARKERS) {
    const normalizedPhrase = phrase.toLowerCase();
    if (normalizedText.includes(normalizedPhrase)) {
      detectedPhrases.push(phrase);
    }
  }

  return {
    hasLeaks: detectedPhrases.length > 0,
    detectedPhrases,
  };
}

/**
 * Validate that surface output does not contain internal latent layer phrases.
 * This is a lightweight check intended for development/debug, not as a hard blocker.
 *
 * @param {string} text - The surface output text to validate
 * @returns {object} - { valid: boolean, warnings: string[] }
 */
export function validateSurfaceOutput(text) {
  const { hasLeaks, detectedPhrases } = detectInternalPhraseLeaks(text);

  if (!hasLeaks) {
    return { valid: true, warnings: [] };
  }

  const warnings = detectedPhrases.map(
    (phrase) => `Internal phrase detected in surface output: "${phrase}"`
  );

  return { valid: false, warnings };
}

export function sanitizeSurfaceOutput(text) {
  if (typeof text !== 'string' || !text) return '';

  let sanitized = text;

  for (const phrase of INTERNAL_PHRASE_MARKERS) {
    sanitized = sanitized.replaceAll(phrase, '');
  }

  const normalized = sanitized
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return /^[。、,\s]+$/.test(normalized) ? '' : normalized;
}

/**
 * Build a guard report for debug/compare mode.
 * This does NOT block output, but provides visibility into potential leaks.
 *
 * @param {string} text - The text to check
 * @returns {object} - { checked: boolean, hasLeaks: boolean, detectedPhrases: string[], summary: string }
 */
export function buildSurfaceGuardReport(text) {
  const sanitizedText = sanitizeSurfaceOutput(text);
  const { hasLeaks, detectedPhrases } = detectInternalPhraseLeaks(text);

  const summary = hasLeaks
    ? `⚠ Internal phrases detected: ${detectedPhrases.join(', ')}`
    : '✓ No internal phrase leaks detected';

  return {
    checked: true,
    hasLeaks,
    detectedPhrases,
    sanitizedText,
    summary,
  };
}
