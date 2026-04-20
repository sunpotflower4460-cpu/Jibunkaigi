// src/runtime/activateAgent.js
// General agent activation dispatcher.
// Routes all agents through the generic activation pipeline
// using agent-specific materials from the registry.

import { activateGeneric } from './activateGeneric.js';

/**
 * Activate the appropriate agent pipeline for the given agent ID.
 *
 * @param {string} agentId   - The agent ID (matches AGENTS[].id in App.jsx).
 * @param {object} state     - Output of estimateState().
 * @returns {object|null}    - Activation result, or null for unknown agents.
 */
export const activateAgent = (agentId, state = {}, options = {}) => {
  return activateGeneric(agentId, state, options);
};
