export const INSPECTOR_STORAGE_KEY = 'inspectorEnabled';

export const isInspectorEnabled = (options = {}) => {
  const hasWindow = options.hasWindow ?? (typeof window !== 'undefined');
  if (!hasWindow) return false;

  const search = options.search ?? window.location?.search ?? '';
  const storageGetter = options.storageGetter ?? (() => localStorage.getItem(INSPECTOR_STORAGE_KEY));

  try {
    if (new URLSearchParams(search).get('inspector') === '1') return true;
  } catch {
    // ignore malformed search
  }

  try {
    const stored = storageGetter();
    return stored === '1' || stored === 'true';
  } catch {
    return false;
  }
};

export const setInspectorEnabled = (enabled, options = {}) => {
  const hasWindow = options.hasWindow ?? (typeof window !== 'undefined');
  if (!hasWindow) return;

  const storageSetter = options.storageSetter ?? ((value) => localStorage.setItem(INSPECTOR_STORAGE_KEY, value));
  const storageRemover = options.storageRemover ?? (() => localStorage.removeItem(INSPECTOR_STORAGE_KEY));

  try {
    if (enabled) {
      storageSetter('1');
    } else {
      storageRemover();
    }
  } catch {
    // ignore storage failures
  }
};
