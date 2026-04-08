// src/runtime/switchAgent.js
// Agent selection utilities.
// Provides helpers for choosing which agent should respond next,
// or for picking a random agent for the "委ねる" (delegate) feature.

/**
 * Pick a random agent ID from the provided list, optionally
 * excluding the agent that responded most recently.
 *
 * @param {object[]} agents          - Full AGENTS array from App.jsx.
 * @param {string|null} excludeId    - Agent ID to exclude (e.g. last responder).
 * @returns {string}                 - Selected agent ID.
 */
export const pickRandomAgent = (agents, excludeId = null) => {
  const pool = excludeId
    ? agents.filter((a) => a.id !== excludeId)
    : agents;

  if (pool.length === 0) return agents[0]?.id ?? '';

  const index = Math.floor(Math.random() * pool.length);
  return pool[index].id;
};

/**
 * Find the agent ID of the most recent AI response in the message list.
 *
 * @param {object[]} messages - Current session messages.
 * @returns {string|null}
 */
export const getLastRespondingAgentId = (messages) => {
  if (!Array.isArray(messages)) return null;

  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'ai' && messages[i].agentId) {
      return messages[i].agentId;
    }
  }

  return null;
};
