// src/runtime/compareMode.js
// Compare Mode helper — dev-only.
//
// Compare Mode とは:
//   同じ user input に対して、
//     - Baseline Reply: Outer Guide (stateGuide / internalFrame / surfaceGuidance) を
//       空にして生成した返答
//     - Current Reply: 現行の活性化パイプライン全部入りで生成した返答
//     - Outer Guide: 実際に systemInstruction に差し込まれたガイドテキスト
//   を並べて観察するための開発用モード。
//
//   本番ユーザーには出さない。Firestore にも保存しない。メモリ保持のみ。
//   有効化:
//     - URL パラメータ: ?compareMode=1
//     - localStorage: jibunkaigi:compareMode = '1'
//   本番ビルド (import.meta.env.DEV === false) では絶対に有効にならない。

export const COMPARE_MAX_ENTRIES = 8;

export const COMPARE_PREVIEW_MAX = 200;

export const isCompareModeEnabled = () => {
  try {
    if (typeof import.meta !== 'undefined' && !import.meta.env?.DEV) return false;
    if (typeof window === 'undefined') return false;
    const qp = new URLSearchParams(window.location.search).get('compareMode');
    if (qp === '1') return true;
    return localStorage.getItem('jibunkaigi:compareMode') === '1';
  } catch {
    return false;
  }
};

const truncate = (text, max = COMPARE_PREVIEW_MAX) => {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  return trimmed.length > max ? trimmed.slice(0, max) + '…' : trimmed;
};

const normalizeReply = (reply) => {
  if (reply === null || reply === undefined) return '';
  if (typeof reply !== 'string') return String(reply);
  return reply;
};

const normalizeError = (err) => {
  if (!err) return null;
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message || String(err);
  try {
    return String(err);
  } catch {
    return 'unknown error';
  }
};

export const buildCompareEntry = ({
  agentId = '',
  isMirror = false,
  mode = '',
  userText = '',
  baselineReply = '',
  currentReply = '',
  stateGuide = '',
  internalFrame = '',
  surfaceGuidance = '',
  baselineError = null,
  currentError = null,
  timestamp = Date.now(),
} = {}) => {
  return {
    id: `${agentId || 'unknown'}:${timestamp}`,
    timestamp,
    agentId,
    isMirror: !!isMirror,
    mode,
    userText: truncate(userText),
    baselineReply: normalizeReply(baselineReply),
    currentReply: normalizeReply(currentReply),
    outerGuide: {
      stateGuide: stateGuide || '',
      internalFrame: internalFrame || '',
      surfaceGuidance: surfaceGuidance || '',
    },
    baselineError: normalizeError(baselineError),
    currentError: normalizeError(currentError),
  };
};
