// src/runtime/internalReaction.js
// Builds the prompt and validates the response for preloaded
// inter-agent reactions (the "Others" panel shown below AI messages).

const VALID_STANCES = ['賛成', '反対', 'どちらでもない'];

const MAX_USER_TEXT_LENGTH = 100;
const MAX_RESPONSE_TEXT_LENGTH = 150;

/**
 * Build the system instruction for the reaction generation call.
 *
 * @param {object} respondingAgent  - The agent that just responded.
 * @param {object[]} otherAgents    - The remaining agents who will react.
 * @returns {string}
 */
export const buildReactionSystemPrompt = (respondingAgent, otherAgents) => {
  const agentDescriptions = otherAgents
    .map((a) => `${a.name}(${a.role}): 信念→${a.belief}`)
    .join('\n');

  return `あなたはリアクション生成器。JSONのみ出力。
【状況】${respondingAgent.name}がクライアントに返答した。他の${otherAgents.length}人がその返答を聞いた直後の本音を生成せよ。
【各エージェントの信念と役割】
${agentDescriptions}
【ルール】
- stance: 各自の信念に基づき "賛成" "反対" "どちらでもない" のいずれか
- posture: 動作5文字以内
- comment: その立場からの本音15-20文字（必ずそのキャラの口調・言葉遣いで）
- ${respondingAgent.name}のキーは出力しない
- 大げさな表現禁止、自然な反応で`;
};

/**
 * Build the user prompt for the reaction generation call.
 *
 * @param {string} userText         - The user's message (truncated).
 * @param {string} respondingAgentName
 * @param {string} aiResponseText   - The responding agent's reply (truncated).
 * @returns {string}
 */
export const buildReactionUserPrompt = (userText, respondingAgentName, aiResponseText) => {
  return `【クライアントの発言】「${userText.slice(0, MAX_USER_TEXT_LENGTH)}」\n【${respondingAgentName}の返答】「${(aiResponseText ?? '').slice(0, MAX_RESPONSE_TEXT_LENGTH)}」`;
};

/**
 * Validate and sanitise the raw parsed reaction object.
 * Returns only entries with well-formed posture + comment fields.
 *
 * @param {object} parsed - Raw JSON-parsed object from the model.
 * @returns {object}      - Sanitised reaction data keyed by agent ID.
 */
export const sanitizeReactionData = (parsed) => {
  if (!parsed || typeof parsed !== 'object') return {};

  const validData = {};

  for (const [key, val] of Object.entries(parsed)) {
    if (val && typeof val.posture === 'string' && typeof val.comment === 'string') {
      validData[key] = {
        stance: VALID_STANCES.includes(val.stance) ? val.stance : 'どちらでもない',
        posture: val.posture.slice(0, 5),
        comment: val.comment.slice(0, 40),
      };
    }
  }

  return validData;
};
