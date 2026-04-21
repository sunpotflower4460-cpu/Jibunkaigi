// src/runtime/activateAgent.js
// General agent activation dispatcher.
// Routes all agents through the generic activation pipeline
// using agent-specific materials from the registry.
//
// TRANSITIONAL STATUS: activateAgent は過渡期の補助機能
// - 現在の役割: reentry / debug / transitional 補助
// - runInternalOS が本番 prompt 正本
// - 長期的には reentry を runInternalOS 側へ統合し、一本化する予定
//
// TODO: 将来の統合案
// - move / stance / finalDecisionSubstrate から reentry を選ぶ統合案を検討
// - activateAgent 廃止の条件:
//   1. reentry selection が runInternalOS 内で完結すること
//   2. debug / transitional 機能が不要になること
//   3. 既存エージェントの prompt 構築が全て runInternalOS ベースになること

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
