// src/runtime/activateAgent.js
// General agent activation dispatcher.
// Routes to the appropriate per-agent activation function,
// falling back to a minimal stub for agents that don't yet
// have a dedicated activation pipeline.

import { activateJoe } from './activate.js';

/**
 * Activate the appropriate agent pipeline for the given agent ID.
 *
 * @param {string} agentId   - The agent ID (matches AGENTS[].id in App.jsx).
 * @param {object} state     - Output of estimateState().
 * @returns {object|null}    - Activation result, or null for agents without a pipeline.
 */
export const activateAgent = (agentId, state = {}) => {
  switch (agentId) {
    case 'creative':
      return activateJoe(state);

    // Additional agents can be wired here when their activation modules exist.
    // case 'soul':
    //   return activateSoul(state);
    // case 'strategist':
    //   return activateKen(state);
    // case 'empath':
    //   return activateMina(state);
    // case 'critic':
    //   return activateSato(state);

    default:
      return null;
  }
};
