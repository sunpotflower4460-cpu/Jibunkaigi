/**
 * radialCondensation.js
 * P-4 Stage 1: Radial Condensation Core
 *
 * PURPOSE:
 * Combine three attention channels into focusPoints through weighted aggregation.
 * Replaces English-based attentionTargets with Japanese-first detection.
 *
 * CHANNELS (Stage 1):
 * 1. Somatic Alerts (身体的ザワつき): 0.35 weight
 * 2. Sustained Gaze (持続的注視): 0.30 weight
 * 3. Unconscious Interrupts (無意識割り込み): 0.35 weight
 *
 * OUTPUT:
 * Up to 3 focusPoints with highest weighted intensity
 */

import { detectSomaticAlerts } from './detectSomaticAlerts.js';
import { detectSustainedGaze } from './detectSustainedGaze.js';
import { detectUnconsciousInterrupts } from './detectUnconsciousInterrupts.js';

// Channel weights for Stage 1
const CHANNEL_WEIGHTS = {
  somatic: 0.35,
  sustained: 0.30,
  unconscious: 0.35,
};

/**
 * Perform radial condensation to extract focus points
 * @param {object} context
 * @param {string} context.userText - User input text
 * @param {object} context.afterglowSeed - Previous turn residue
 * @param {object} context.previousLatentState - Previous latent state
 * @param {object} context.beliefTension - Current belief tensions
 * @param {number} context.topN - Number of focus points to return (default: 3)
 * @returns {Array<{signal: string, intensity: number, sources: string[]}>}
 */
export function radialCondensation(context = {}) {
  const {
    userText = '',
    afterglowSeed = {},
    previousLatentState = {},
    beliefTension = {},
    topN = 3,
  } = context;

  // Detect signals from each channel
  const somaticSignals = detectSomaticAlerts(userText);
  const sustainedSignals = detectSustainedGaze({ afterglowSeed, previousLatentState });
  const unconsciousSignals = detectUnconsciousInterrupts({ beliefTension });

  // Aggregate signals with weights
  const signalMap = new Map();

  // Add somatic channel
  somaticSignals.forEach(({ signal, intensity }) => {
    const weighted = intensity * CHANNEL_WEIGHTS.somatic;
    if (!signalMap.has(signal)) {
      signalMap.set(signal, { intensity: 0, sources: [] });
    }
    const entry = signalMap.get(signal);
    entry.intensity += weighted;
    entry.sources.push('somatic');
  });

  // Add sustained channel
  sustainedSignals.forEach(({ signal, intensity }) => {
    const weighted = intensity * CHANNEL_WEIGHTS.sustained;
    if (!signalMap.has(signal)) {
      signalMap.set(signal, { intensity: 0, sources: [] });
    }
    const entry = signalMap.get(signal);
    entry.intensity += weighted;
    entry.sources.push('sustained');
  });

  // Add unconscious channel
  unconsciousSignals.forEach(({ signal, intensity }) => {
    const weighted = intensity * CHANNEL_WEIGHTS.unconscious;
    if (!signalMap.has(signal)) {
      signalMap.set(signal, { intensity: 0, sources: [] });
    }
    const entry = signalMap.get(signal);
    entry.intensity += weighted;
    entry.sources.push('unconscious');
  });

  // Convert to array and sort by intensity
  const allSignals = Array.from(signalMap.entries()).map(([signal, data]) => ({
    signal,
    intensity: data.intensity,
    sources: data.sources,
  }));

  allSignals.sort((a, b) => b.intensity - a.intensity);

  // Return top N focus points
  return allSignals.slice(0, topN);
}
