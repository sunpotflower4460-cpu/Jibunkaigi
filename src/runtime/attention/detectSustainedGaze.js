/**
 * detectSustainedGaze.js
 * P-4 Stage 1: Sustained Gaze Channel
 *
 * PURPOSE:
 * Detect sustained attention signals from afterglow and latent state.
 * Signals that persist across multiple turns indicate sustained focus.
 *
 * CHANNEL: 持続的注視 (Sustained Gaze)
 * - Signals from afterglowSeed (previous turn residue)
 * - Signals from previousLatentState (persistent patterns)
 */

/**
 * Detect sustained attention from latent state
 * @param {object} context
 * @param {object} context.afterglowSeed - Previous turn's afterglow residue
 * @param {object} context.previousLatentState - Previous latent state
 * @returns {Array<{signal: string, intensity: number}>}
 */
export function detectSustainedGaze(context = {}) {
  const { afterglowSeed = {}, previousLatentState = {} } = context;
  const sustained = [];

  // Extract sustained signals from afterglow
  if (afterglowSeed && typeof afterglowSeed === 'object') {
    // Check for high-intensity field signals that persist
    const field = afterglowSeed.field || {};

    if (field.urgency > 0.6) {
      sustained.push({ signal: 'sustained-urgency', intensity: field.urgency * 0.5 });
    }
    if (field.fragility > 0.6) {
      sustained.push({ signal: 'sustained-fragility', intensity: field.fragility * 0.5 });
    }
    if (field.depth > 0.6) {
      sustained.push({ signal: 'sustained-depth', intensity: field.depth * 0.5 });
    }
  }

  // Extract sustained signals from previous latent state
  if (previousLatentState && typeof previousLatentState === 'object') {
    const existence1 = previousLatentState.existence1 || {};
    const beliefTension = previousLatentState.beliefTension || {};

    // Persistent unfinished threads
    if (existence1.unfinishedAllowed > 0.5) {
      sustained.push({
        signal: 'sustained-unfinished',
        intensity: existence1.unfinishedAllowed * 0.4
      });
    }

    // Active belief tensions that persist
    if (beliefTension.totalTensionStrength > 0.5) {
      sustained.push({
        signal: 'sustained-tension',
        intensity: beliefTension.totalTensionStrength * 0.45
      });
    }
  }

  return sustained;
}
