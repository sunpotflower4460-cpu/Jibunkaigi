// src/runtime/refreshPolicy.js
// Determines whether a refresh injection is needed to pull
// an agent back to its core identity after conversational drift.

/**
 * The minimum number of AI turns before a refresh can trigger.
 * 6 turns gives enough conversational depth for drift to accumulate
 * while still keeping the agent anchored to its core identity.
 */
const REFRESH_INTERVAL = 6;

/**
 * Evaluate whether a refresh should be injected.
 *
 * @param {object[]} messages - Full message list for the current session.
 * @param {string}   agentId  - The agent that is about to respond.
 * @returns {boolean}
 */
export const shouldRefresh = (messages, agentId) => {
  if (!Array.isArray(messages) || messages.length === 0) return false;

  // Count how many turns the given agent has responded since the last refresh.
  const agentMessages = messages.filter(
    (m) => m.role === 'ai' && m.agentId === agentId
  );

  if (agentMessages.length === 0) return false;

  // Trigger a refresh every REFRESH_INTERVAL turns.
  return agentMessages.length % REFRESH_INTERVAL === 0;
};

/**
 * Prepend a refresh snippet to a system instruction.
 * Call only when shouldRefresh() returns true.
 *
 * @param {string} systemInstruction - Current system instruction.
 * @param {string} refreshText       - The agent's refresh / reentry text.
 * @returns {string}
 */
export const applyRefresh = (systemInstruction, refreshText) => {
  if (!refreshText) return systemInstruction;
  return `${refreshText}\n\n${systemInstruction}`;
};
