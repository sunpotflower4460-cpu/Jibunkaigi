/**
 * detectSomaticAlerts.js
 * P-4 Stage 1: Somatic Attention Channel
 *
 * PURPOSE:
 * Detect body-based attention signals from Japanese text input
 * using pattern matching against SOMATIC_PATTERNS table.
 *
 * CHANNEL: 身体的ザワつき (Somatic Alerts)
 * - Emotional keywords (怖い/辛い/嬉しい)
 * - Body sensations (息が浅い/こわばる)
 * - Contradiction markers (でも/だけど)
 * - Hesitation cues (…/！)
 */

import { SOMATIC_PATTERNS } from '../linguistics/japanesePatterns.js';

/**
 * Detect somatic attention alerts from input text
 * @param {string} userText - The user's input text
 * @returns {Array<{signal: string, intensity: number, matchedPattern: string}>}
 */
export function detectSomaticAlerts(userText = '') {
  if (!userText || typeof userText !== 'string') {
    return [];
  }

  const alerts = [];
  const signalMap = new Map(); // Track max intensity per signal

  for (const pattern of SOMATIC_PATTERNS) {
    const { signal, intensity, pattern: regex, id } = pattern;

    // Reset regex index for each test
    regex.lastIndex = 0;
    const matches = userText.match(regex);

    if (matches && matches.length > 0) {
      // Store the highest intensity for each signal type
      const currentIntensity = signalMap.get(signal) || 0;
      if (intensity > currentIntensity) {
        signalMap.set(signal, intensity);
      }

      // Record all matches for debugging
      matches.forEach((matchText) => {
        alerts.push({
          signal,
          intensity,
          matchedPattern: id,
          matchedText: matchText,
        });
      });
    }
  }

  // Convert to final format with deduplicated signals (max intensity wins)
  const deduplicatedAlerts = Array.from(signalMap.entries()).map(([signal, intensity]) => ({
    signal,
    intensity,
  }));

  return deduplicatedAlerts;
}
