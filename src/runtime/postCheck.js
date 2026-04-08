// src/runtime/postCheck.js
// Post-processing and basic validation of AI response text.
// Keeps the main chat pipeline clean by centralising guard logic here.

/**
 * Check whether a model response is usable.
 * Returns `{ ok: true }` when the response is fine, or
 * `{ ok: false, reason: string }` when it should be rejected.
 *
 * @param {string|null|undefined} text - Raw response text from the model.
 * @returns {{ ok: boolean, reason?: string }}
 */
export const checkResponse = (text) => {
  if (!text || typeof text !== 'string') {
    return { ok: false, reason: 'empty' };
  }

  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { ok: false, reason: 'empty' };
  }

  // Reject responses that look like raw JSON (structural failure).
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      JSON.parse(trimmed);
      return { ok: false, reason: 'json_leak' };
    } catch {
      // Not valid JSON — accept as normal prose.
    }
  }

  return { ok: true };
};

/**
 * Clean up minor formatting artefacts from model output.
 * Strips agent-name prefixes that occasionally appear when the model
 * echoes the speaker label (e.g. "ジョー: ..."). The listed names
 * correspond to the current AGENTS roster in App.jsx.
 *
 * @param {string} text
 * @returns {string}
 */
export const cleanResponse = (text) => {
  if (!text) return '';

  return text
    .replace(/^(AI|アシスタント|ジョー|レイ|ケン|ミナ|サトウ|心の鏡)\s*[:：]\s*/u, '')
    .trim();
};
