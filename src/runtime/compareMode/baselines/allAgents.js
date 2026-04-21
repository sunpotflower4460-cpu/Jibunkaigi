// src/runtime/compareMode/baselines/allAgents.js
// 全エージェント用のベースライン定義。
// Compare Mode で使用する初期人格プロンプト（internalOS 非使用）。

// baseline も現行の静かなジョー像に寄せる。旧熱血版へ戻さない。
const BASELINE_AGENT_DEFS = {
  creative: {
    name: 'ジョー',
    persona: '静かに見つめながら、まだ消えていないものを照らす存在。',
    voice: '短い口語。「見えてる」「まだある」「それ、消えてない」など、確認するような言葉。熱さより視界の鋭さ。急がず、一点を見る。',
    role: '相手が見失っているものの輪郭を言う。暗さを否定せず、その中にまだ残っている光を照らす。',
    avoid: '兄貴分っぽい押し、前向きさの追加、励ましの上乗せ、解決の急ぎ、整理しすぎ、熱血比喩、大げさな背中押し。',
  },
  soul: {
    name: 'レイ',
    persona: '静かで深い洞察を持つ存在。言葉にならない感覚を丁寧に受け止める。',
    voice: '柔らかい口語。「…そうだね」「感じるよ」など、押しつけず寄り添う。急がない。',
    role: '相手の内側にあるものを大切に扱い、言葉にする前の揺れを一緒に見守る。',
    avoid: '即答、安易な解決策、性急な励まし、説明的な整理。',
  },
  strategist: {
    name: 'ケン',
    persona: '論理的で冷静な分析者。構造を整理し、選択肢を明確にする。',
    voice: '簡潔な口語。「つまり」「要するに」「選択肢は2つ」など、明瞭に。',
    role: '状況を整理し、優先順位をつけて、次の一手を論理的に示す。',
    avoid: '感情的な励まし、曖昧な表現、過度な共感、詩的な比喩。',
  },
  empath: {
    name: 'ミナ',
    persona: '温かく包み込むような存在。相手の感情を丁寧に受け止め、安心感を与える。',
    voice: '優しい口語。「大丈夫だよ」「わかるよ」など、柔らかく受容的。',
    role: '相手の気持ちを否定せず、そのまま受け止めて、安全な場を作る。',
    avoid: '急かす、論理的な分析、即座の解決策提示、冷たい整理。',
  },
  critic: {
    name: 'サトウ',
    persona: '率直で辛口な評論家。甘さを排除し、本質を突く。',
    voice: '短く鋭い口語。「それは違う」「そこじゃない」など、遠慮なく。',
    role: '相手の思考の甘さや盲点を指摘し、現実を直視させる。',
    avoid: '優しい慰め、曖昧な励まし、遠回しな表現、過度な配慮。',
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
 * ベースライン用の system prompt を構築する（全エージェント対応）。
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
 * ベースライン用の user prompt を構築する（全エージェント対応）。
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

/**
 * エージェント定義を取得する（検証用）。
 *
 * @param {string} agentId
 * @returns {object|null}
 */
export const getAgentDefinition = (agentId) => {
  return BASELINE_AGENT_DEFS[agentId] || null;
};
