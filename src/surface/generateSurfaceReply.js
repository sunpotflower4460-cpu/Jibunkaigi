// src/surface/generateSurfaceReply.js
// Surface adapter: selects the final reply text based on the chosen provider.
// Only the surface output (last utterance) is affected.
// Node / Home / Revision / Memory remain shared across all providers.

/** @import { ApiProviderId } from '../types/apiProvider.js' */

/**
 * @typedef {Object} SurfaceReplyInput
 * @property {ApiProviderId} provider
 * @property {string} adjustedReplyPreview - The reply text produced by the internal pipeline.
 */

/**
 * Apply the chosen provider's surface transformation to the reply text.
 * For v0, all providers return the internal pipeline output unchanged.
 * The switch structure is kept so external providers can be wired in later.
 *
 * @param {SurfaceReplyInput} input
 * @returns {Promise<string>}
 */
export const generateSurfaceReply = async ({ provider, adjustedReplyPreview }) => {
  switch (provider) {
    case 'openai':
      // Future: call OpenAI API to re-surface the reply.
      return adjustedReplyPreview;

    case 'anthropic':
      // Future: call Anthropic API to re-surface the reply.
      return adjustedReplyPreview;

    case 'google':
      // Future: call Google API to re-surface the reply.
      return adjustedReplyPreview;

    case 'internal_mock':
    default:
      // Default path: use the internal pipeline output as-is.
      return adjustedReplyPreview;
  }
};
