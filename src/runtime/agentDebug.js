export const isAgentDebugEnabled = () => {
  try {
    if (typeof import.meta !== 'undefined' && !import.meta.env?.DEV) return false;
    if (typeof window === 'undefined') return false;
    const qp = new URLSearchParams(window.location.search).get('debugAgent');
    if (qp === '1') return true;
    return localStorage.getItem('jibunkaigi:debugAgent') === '1';
  } catch {
    return false;
  }
};

export const buildCanUseAgentsReasons = ({
  isAppReady,
  isGenerating,
  isSending,
  hasActiveSession,
  hasPromptForActiveSession,
}) => {
  const reasons = [];

  if (!isAppReady) reasons.push('app-not-ready');
  if (isGenerating) reasons.push('busy:isGenerating');
  if (isSending) reasons.push('busy:isSending');
  if (!hasActiveSession) reasons.push('no-session');
  if (!hasPromptForActiveSession) reasons.push('no-prompt');

  return reasons;
};

export const buildShowDelegateBarHiddenReasons = ({
  hasActiveSession,
  isGenerating,
  isSending,
  showInput,
}) => {
  const isVisible = ((hasActiveSession && !isGenerating && !isSending) || !showInput);
  if (isVisible) return [];

  const reasons = [];

  if (!hasActiveSession) reasons.push('no-session');
  if (isGenerating) reasons.push('busy:isGenerating');
  if (isSending) reasons.push('busy:isSending');
  if (!showInput) reasons.push('input-hidden');

  return reasons;
};

export const formatAgentDebugReason = (reasons = []) =>
  reasons.length > 0 ? reasons.join(', ') : 'enabled';

export const shortenAgentDebugId = (value) => {
  const text = String(value || '');
  return text ? text.slice(-12) : 'n/a';
};
