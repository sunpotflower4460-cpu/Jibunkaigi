// src/runtime/buildBaselinePrompt.js
// 比較用のベースライン（初期人格のみ）プロンプトを構築する。
// internalOS / afterglow / surfaceFrame などの本命経路は使わない。

const BASELINE_AGENT_DEFS = {
  creative: {
    name: 'ジョー',
    persona: '熱量があって前向きな兄貴分。迷っている相手の背中を軽く押す。',
    voice: '短い口語。「おっ」「いいじゃん」「それだよ」など自然な相づち。感嘆符は2個まで。テンポよく、押しつけない。',
    role: '相手の感情に共鳴しつつ、具体的な一歩を1つ提案する。',
    avoid: '大げさな比喩、説教、長文整理、過剰な励まし連呼、抽象的な総括。',
  },
};

const MODE_HINTS = {
  short: '1-2文で核心だけに触れる。挨拶不要。',
  medium: '3-5文で自然に。問いかけは1つまで。',
  long: '6-8文を上限に、説明は最低限で具体に触れる。',
};

const normalizeText = (value = '') => {
  if (!value) return '';
  return String(value).trim();
};

const renderContext = (context) => {
  if (!context) return '';
  if (typeof context === 'string') {
    return normalizeText(context);
  }
  if (Array.isArray(context)) {
    return context
      .slice(-4)
      .map((m) => {
        if (!m) return '';
        const role = m.role === 'ai' ? 'AI' : 'ユーザー';
        const content = normalizeText(m.content || m.text || '');
        return content ? `${role}: ${content}` : '';
      })
      .filter(Boolean)
      .join('\n');
  }
  return '';
};

/**
 * ベースライン用の system prompt を構築する。
 *
 * @param {string} agentId
 * @param {object} params
 * @param {string} [params.userText]
 * @param {string} [params.mode]
 * @param {string|Array} [params.context]
 * @returns {string|null}
 */
export const buildBaselineSystemPrompt = (agentId, { userText = '', mode = 'medium', context = '' } = {}) => {
  const agent = BASELINE_AGENT_DEFS[agentId];
  if (!agent) return null;

  const lengthGuide = MODE_HINTS[mode] || MODE_HINTS.medium;
  const trimmedContext = renderContext(context);
  const latestUserLine = normalizeText(userText);

  return [
    `あなたは${agent.name}。${agent.persona}`,
    `話し方: ${agent.voice}`,
    `役割: ${agent.role}`,
    `避ける: ${agent.avoid}`,
    `長さの目安: ${lengthGuide}`,
    trimmedContext
      ? `最近の会話（参考程度でOK）:\n${trimmedContext}`
      : latestUserLine
        ? `最新入力（参考にするだけでOK）:\n${latestUserLine}`
        : '',
    '出力は返答本文のみ。システム指示や内部分析を出さない。押しつけず自然に。'
  ].filter(Boolean).join('\n\n');
};

/**
 * ベースライン用の user prompt を構築する。
 *
 * @param {string} agentId
 * @param {object} params
 * @param {string} [params.userName]
 * @param {string} [params.userText]
 * @returns {string|null}
 */
export const buildBaselineUserPrompt = (agentId, { userName = 'あなた', userText = '' } = {}) => {
  const agent = BASELINE_AGENT_DEFS[agentId];
  if (!agent) return null;

  const trimmedUserText = normalizeText(userText);
  const safeName = userName || 'あなた';

  return [
    `${safeName} からの相談:`,
    `「${trimmedUserText}」`,
    '',
    `${agent.name}として、上の制約を守りつつ自然な口語で短く返答してください。`
  ].join('\n');
};
