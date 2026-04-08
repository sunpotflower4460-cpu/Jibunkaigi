// src/api/gemini.js
// Standalone Gemini API client.
// Wraps the generativelanguage REST API with retry logic.

const REACTION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    soul:       { type: 'object', properties: { stance: { type: 'string' }, posture: { type: 'string' }, comment: { type: 'string' } } },
    creative:   { type: 'object', properties: { stance: { type: 'string' }, posture: { type: 'string' }, comment: { type: 'string' } } },
    strategist: { type: 'object', properties: { stance: { type: 'string' }, posture: { type: 'string' }, comment: { type: 'string' } } },
    empath:     { type: 'object', properties: { stance: { type: 'string' }, posture: { type: 'string' }, comment: { type: 'string' } } },
    critic:     { type: 'object', properties: { stance: { type: 'string' }, posture: { type: 'string' }, comment: { type: 'string' } } },
  },
};

/**
 * Call the Gemini generativelanguage API.
 *
 * @param {object} options
 * @param {string} options.apiKey          - Gemini API key.
 * @param {string} options.model           - Model name (e.g. 'gemini-2.5-flash').
 * @param {string} options.prompt          - User-side prompt text.
 * @param {string} [options.systemInstruction] - System instruction text.
 * @param {boolean} [options.jsonMode]     - Request JSON output.
 * @param {boolean} [options.reactionSchema] - Apply the reaction JSON schema.
 * @param {number} [options.retries]       - Max retry attempts (default 5).
 * @returns {Promise<string>} Raw text (or JSON string) from the model.
 */
export const callGemini = async ({
  apiKey,
  model,
  prompt,
  systemInstruction,
  jsonMode = false,
  reactionSchema = false,
  retries = 5,
}) => {
  if (!apiKey) throw new Error('API key is missing');

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  for (let i = 0; i < retries; i++) {
    try {
      const body = { contents: [{ parts: [{ text: prompt }] }] };

      if (systemInstruction) {
        body.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      if (jsonMode || reactionSchema) {
        body.generationConfig = { responseMimeType: 'application/json' };
        if (reactionSchema) {
          body.generationConfig.responseSchema = REACTION_JSON_SCHEMA;
        }
      }

      const res = await fetch(`${endpoint}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        // Retry on 503 Service Unavailable.
        if (res.status === 503) {
          await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
          continue;
        }

        const errData = await res.json().catch(() => ({}));
        const message = errData?.error?.message || `HTTP ${res.status}`;
        if (res.status >= 500) throw new Error(message);
        throw new Error(`non-retryable: ${message}`);
      }

      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      let text = parts.map((part) => part?.text || '').join('').trim();

      if (!text) throw new Error('Empty response from Gemini');

      if (jsonMode || reactionSchema) {
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      }

      return text;
    } catch (error) {
      const isLast = i === retries - 1;
      const message = error instanceof Error ? error.message : String(error);

      if (
        message.includes('non-retryable') ||
        message.includes('API key is missing')
      ) {
        throw error;
      }

      if (isLast) throw error;

      await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
};
