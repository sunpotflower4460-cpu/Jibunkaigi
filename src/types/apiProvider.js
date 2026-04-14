// src/types/apiProvider.js
// JSDoc type definitions for the API provider selection feature.

/**
 * @typedef {"internal_mock" | "openai" | "anthropic" | "google"} ApiProviderId
 */

/**
 * @typedef {Object} ApiProviderConfig
 * @property {ApiProviderId} id
 * @property {string} label
 * @property {string} description
 * @property {boolean} available
 */

/**
 * @typedef {Object} ApiSelectionState
 * @property {ApiProviderId} baseProvider
 * @property {string} lastUpdatedAt
 */

export {};
