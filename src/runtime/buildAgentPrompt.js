// src/runtime/buildAgentPrompt.js
// エージェント別プロンプトディスパッチャ。
// agentId に応じて適切なプロンプトビルダーを呼ぶ。

import { buildJoeSystemPrompt, buildJoeUserPrompt } from './buildPrompt.js';
import { buildRaySystemPrompt, buildRayUserPrompt } from './prompts/ray.js';
import { buildKenSystemPrompt, buildKenUserPrompt } from './prompts/ken.js';
import { buildMinaSystemPrompt, buildMinaUserPrompt } from './prompts/mina.js';
import { buildSatouSystemPrompt, buildSatouUserPrompt } from './prompts/satou.js';

/**
 * エージェント ID に対応するシステムプロンプトを構築する。
 *
 * @param {string} agentId
 * @param {object} params - { activated, context, mode, userText, internalOS, surfaceFrame }
 * @returns {string|null}
 */
export const buildAgentSystemPrompt = (agentId, params) => {
  switch (agentId) {
    case 'creative':
      return buildJoeSystemPrompt(params);
    case 'soul':
      return buildRaySystemPrompt(params);
    case 'strategist':
      return buildKenSystemPrompt(params);
    case 'empath':
      return buildMinaSystemPrompt(params);
    case 'critic':
      return buildSatouSystemPrompt(params);
    default:
      return null;
  }
};

/**
 * エージェント ID に対応するユーザープロンプトを構築する。
 *
 * @param {string} agentId
 * @param {object} params - { userName, userText }
 * @returns {string|null}
 */
export const buildAgentUserPrompt = (agentId, params) => {
  switch (agentId) {
    case 'creative':
      return buildJoeUserPrompt(params);
    case 'soul':
      return buildRayUserPrompt(params);
    case 'strategist':
      return buildKenUserPrompt(params);
    case 'empath':
      return buildMinaUserPrompt(params);
    case 'critic':
      return buildSatouUserPrompt(params);
    default:
      return null;
  }
};
