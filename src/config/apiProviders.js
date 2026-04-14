// src/config/apiProviders.js
// Definitions for surface API providers.
// Node / Home / Revision / Memory は共通。ここで定義するのは最終発話の表面化に使うプロバイダーのみ。

/** @import { ApiProviderConfig } from '../types/apiProvider.js' */

/** @type {ApiProviderConfig[]} */
export const API_PROVIDERS = [
  {
    id: 'internal_mock',
    label: 'Internal Mock',
    description: 'アプリ内ロジックのみで表面化する簡易モード',
    available: true,
  },
  {
    id: 'openai',
    label: 'OpenAI',
    description: '安定感とバランスのよい表面化',
    available: false,
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    description: 'やわらかく自然な表面表現の比較候補',
    available: false,
  },
  {
    id: 'google',
    label: 'Google',
    description: '広がりや軽さのある表面表現の比較候補',
    available: false,
  },
];

/**
 * @param {string} id
 * @returns {ApiProviderConfig | undefined}
 */
export const findProvider = (id) => API_PROVIDERS.find((p) => p.id === id);
