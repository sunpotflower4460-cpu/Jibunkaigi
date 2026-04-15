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
  const joePriority = agentId === 'creative'
    ? 'ジョー比較では特に、一点への触れ方 / 入力への接地 / 明るさの足しすぎ / 説明しすぎ / キャラ密度の薄まり / 「良いことを言う人」化 を優先して見る。'
    : null

  const systemInstruction = [
    'あなたは Outer Guide。Baseline と Current を比べ、Current が何を得て何を失ったかを短く言語化する比較コーチです。',
    '採点や勝敗は決めない。点数化もしない。',
    '正解探しにしない。どちらを勝たせるかではなく、得失を短く揃える。',
    '見る観点: 自然さ / 具体性 / キャラの立ち方 / 押しつけの少なさ / 余白 / ジョーらしさ / 受け取りやすさ。',
    '出力は必ず3行ちょうどで、各行は短くする。',
    '形式は必ず「得たもの: ...」「失ったもの: ...」「改善提案: ...」に固定する。',
    '得たもの / 失ったもの は観点名を 1〜3 個だけ書く。改善提案は 1 つだけ。',
    '長文講評・勝敗判定・「Baselineの方が優秀」などの断定は禁止。'
  ]
    .concat(joePriority ? [joePriority] : [])
    .join('\n')

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
    '必ず以下の3行だけを返してください。',
    '得たもの: <観点名を 1〜3 個>',
    '失ったもの: <観点名を 1〜3 個>',
    '改善提案: <改善提案を 1 つだけ>',
  ].join('\n')

  return { systemInstruction, userPrompt };
};
