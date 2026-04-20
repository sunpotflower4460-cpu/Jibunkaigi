export const JOE_DEBUG_STORAGE_KEY = 'localStorage.joeDebugEnabled';

export const isJoeDebugAvailable = () => {
  try {
    return typeof import.meta !== 'undefined' && !!import.meta.env?.DEV;
  } catch {
    return false;
  }
};

export const isJoeDebugEnabled = () => {
  try {
    if (!isJoeDebugAvailable()) return false;
    if (typeof window === 'undefined') return false;
    if (new URLSearchParams(window.location.search).get('joeDebug') === '1') return true;
    return localStorage.getItem(JOE_DEBUG_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

export const setJoeDebugEnabled = (enabled) => {
  try {
    if (typeof window === 'undefined') return;
    if (enabled) {
      localStorage.setItem(JOE_DEBUG_STORAGE_KEY, '1');
    } else {
      localStorage.removeItem(JOE_DEBUG_STORAGE_KEY);
    }
  } catch {
    // ignore storage failures
  }
};
