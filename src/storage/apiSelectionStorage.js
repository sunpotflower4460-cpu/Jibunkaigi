// src/storage/apiSelectionStorage.js
// localStorage persistence layer for the API provider selection.

/** @import { ApiSelectionState } from '../types/apiProvider.js' */

const STORAGE_KEY = 'node-ai-z:api-selection';

/** @returns {ApiSelectionState} */
export const loadApiSelection = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.baseProvider === 'string' &&
      typeof parsed.lastUpdatedAt === 'string'
    ) {
      return /** @type {ApiSelectionState} */ (parsed);
    }
  } catch {
    // broken JSON — fall back to default
  }
  return defaultState();
};

/**
 * @param {ApiSelectionState} state
 */
export const saveApiSelection = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable — silently ignore
  }
};

/** @returns {ApiSelectionState} */
const defaultState = () => ({
  baseProvider: 'internal_mock',
  lastUpdatedAt: new Date().toISOString(),
});
