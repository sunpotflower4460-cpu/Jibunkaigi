/**
 * detectUnconsciousInterrupts.js
 * P-4 Stage 1: Unconscious Interrupt Channel
 *
 * PURPOSE:
 * Detect unconscious attention interrupts from belief tensions.
 * Active tensions in the belief system create unconscious pull for attention.
 *
 * CHANNEL: 無意識割り込み (Unconscious Interrupts)
 * - Active belief tensions (beliefTension.activeTensions)
 * - High-tension belief axes that demand attention
 */

/**
 * Detect unconscious interrupts from belief tensions
 * @param {object} context
 * @param {object} context.beliefTension - Current belief tension state
 * @returns {Array<{signal: string, intensity: number}>}
 */
export function detectUnconsciousInterrupts(context = {}) {
  const { beliefTension = {} } = context;
  const interrupts = [];

  if (!beliefTension || typeof beliefTension !== 'object') {
    return interrupts;
  }

  const activeTensions = beliefTension.activeTensions || [];

  // Map belief axes to interrupt signals
  activeTensions.forEach((tension) => {
    if (!tension || !tension.axis) return;

    const { axis, strength } = tension;

    // Only consider tensions above threshold
    if (strength < 0.4) return;

    // Map belief axis to interrupt signal
    const signalMap = {
      'illumination': 'interrupt-need-clarity',
      'structure': 'interrupt-need-framework',
      'holding': 'interrupt-need-containment',
      'presence': 'interrupt-need-witness',
      'grounding': 'interrupt-need-anchor',
      'reflection': 'interrupt-need-mirror',
      'preverbal': 'interrupt-pre-verbal',
      'mission': 'interrupt-purpose-pull',
    };

    const signal = signalMap[axis] || `interrupt-${axis}`;
    interrupts.push({
      signal,
      intensity: strength * 0.6, // Dampen to avoid overwhelming
    });
  });

  return interrupts;
}
