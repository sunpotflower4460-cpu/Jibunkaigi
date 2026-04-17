// src/runtime/surfaceGuard.js
// Guard to prevent internal latent layer phrases from leaking into surface output.
// The latent layers (Maker Seed, Home, Existence, Belief) contain internal text
// that should influence output but NOT appear verbatim in user-facing responses.

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
  'branch',
  'leaf',
  'belief tension',

  // System layer markers
  'preconditionFilter',
  'preconditionBias',
  'latent layer',
  'raw latent',
];

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
    if (!phrase.trim()) continue;
    sanitized = sanitized.replaceAll(phrase, '').replaceAll(phrase.toLowerCase(), '');
  }

  return sanitized
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^[\s。、,]+|[\s。、,]+$/g, '')
    .trim();
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
