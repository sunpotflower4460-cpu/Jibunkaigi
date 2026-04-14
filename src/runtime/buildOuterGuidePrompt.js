// src/runtime/buildOuterGuidePrompt.js
// Baseline / Current の差分を短く言語化する Outer Guide 用のプロンプト。

const AGENT_LABELS = {
  creative: 'ジョー',
  soul: 'レイ',
  strategist: 'ケン',
  empath: 'ミナ',
  critic: 'サトウ',
};

const normalize = (text = '') => (text || '').trim();

/**
 * Outer Guide 向けのプロンプトを構築する。
 *
 * @param {object} params
 * @param {string} params.agentId
 * @param {string} params.userText
 * @param {string} params.baselineReply
 * @param {string} params.currentReply
 * @param {string} [params.mode]
 * @returns {{ systemInstruction: string, userPrompt: string }}
 */
export const buildOuterGuidePrompt = ({
  agentId = 'creative',
  userText = '',
  baselineReply = '',
  currentReply = '',
  mode = '',
} = {}) => {
  const agentLabel = AGENT_LABELS[agentId] || agentId;
  const trimmedUser = normalize(userText);
  const trimmedBaseline = normalize(baselineReply);
  const trimmedCurrent = normalize(currentReply);

  const systemInstruction = [
    'あなたは Outer Guide。Baseline と Current を比べ、得失を短く言語化するだけの観察者です。',
    '採点や勝敗は決めない。点数化もしない。',
    '見る観点: 自然さ / 具体性 / キャラの立ち方 / 押しつけの少なさ / 余白 / ジョーらしさ / 受け取りやすさ。',
    '出力は 1〜2 個の短いコメントで止める。助言はシンプルに。',
    '「Baselineの方が優秀」などの断定は禁止。'
  ].join('\n');

  const userPrompt = [
    `エージェント: ${agentLabel} / モード: ${mode || 'n/a'}`,
    `ユーザー入力: ${trimmedUser || '(空)'}`,
    '',
    '[Baseline]',
    trimmedBaseline || '(生成失敗)',
    '',
    '[Current]',
    trimmedCurrent || '(生成失敗)',
    '',
    '上記を比較し、Baseline から Current で「何を得て」「何を失ったか」を短く示してください。',
    '箇条書き 2 行以内か、短い文章 2 文以内で。'
  ].join('\n');

  return { systemInstruction, userPrompt };
};
