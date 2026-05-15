/**
 * じぶん会議 — Agent theme map
 * -----------------------------------------------------------
 * AGENTS 配列が持つ「色 / アクセント / ボーダー」は Tailwind 系の utility
 * クラス文字列としてのみ存在する。ここではそれを補強し、5人のエージェントを
 * 「内的傾向の表れ」として一貫した chip スタイルに収める。
 *
 * NOTE: 既存の AGENTS 配列の文字列を壊さないよう、参照のみ提供する。
 */

export const AGENT_THEME = Object.freeze({
  soul: {
    label: 'レイ',
    role: '魂の託宣',
    surface: 'bg-violet-50',
    ink: 'text-violet-700',
    border: 'border-violet-100',
  },
  creative: {
    label: 'ジョー',
    role: 'まだ消えていない光',
    surface: 'bg-orange-50',
    ink: 'text-orange-600',
    border: 'border-orange-100',
  },
  strategist: {
    label: 'ケン',
    role: '人生の設計',
    surface: 'bg-blue-50',
    ink: 'text-blue-700',
    border: 'border-blue-100',
  },
  empath: {
    label: 'ミナ',
    role: '無償の愛',
    surface: 'bg-rose-50',
    ink: 'text-rose-700',
    border: 'border-rose-100',
  },
  critic: {
    label: 'サトウ',
    role: '不器用な守護',
    surface: 'bg-slate-100',
    ink: 'text-slate-700',
    border: 'border-slate-200',
  },
});

export const getAgentTheme = (agentId) => AGENT_THEME[agentId] || null;

export const STANCE_PILL_CLASS = {
  賛成: 'stance-pill stance-pill--agree',
  反対: 'stance-pill stance-pill--against',
  中立: 'stance-pill stance-pill--neutral',
};

export const getStancePillClass = (stance) =>
  STANCE_PILL_CLASS[stance] || 'stance-pill stance-pill--neutral';
