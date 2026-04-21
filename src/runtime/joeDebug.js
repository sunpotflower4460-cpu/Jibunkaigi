export const JOE_DEBUG_STORAGE_KEY = 'localStorage.joeDebugEnabled';

export const isJoeDebugAvailable = (options = {}) => {
  try {
    if (typeof options.dev === 'boolean') return options.dev;
    return typeof import.meta !== 'undefined' && !!import.meta.env?.DEV;
  } catch {
    return false;
  }
};

export const isJoeDebugEnabled = (options = {}) => {
  try {
    if (!isJoeDebugAvailable(options)) return false;
    const hasWindow = options.hasWindow ?? (typeof window !== 'undefined');
    if (!hasWindow) return false;
    const search = options.search ?? window.location.search;
    const storageGetter = options.storageGetter ?? (() => localStorage.getItem(JOE_DEBUG_STORAGE_KEY));
    if (new URLSearchParams(search).get('joeDebug') === '1') return true;
    return storageGetter() === '1';
  } catch {
    return false;
  }
};

export const setJoeDebugEnabled = (enabled, options = {}) => {
  try {
    if (!isJoeDebugAvailable(options)) return;
    const hasWindow = options.hasWindow ?? (typeof window !== 'undefined');
    if (!hasWindow) return;
    const storageSetter = options.storageSetter ?? ((value) => localStorage.setItem(JOE_DEBUG_STORAGE_KEY, value));
    const storageRemover = options.storageRemover ?? (() => localStorage.removeItem(JOE_DEBUG_STORAGE_KEY));
    if (enabled) {
      storageSetter('1');
    } else {
      storageRemover();
    }
  } catch {
    // ignore storage failures
  }
};

export const getJoeDebugRuntimeFlags = (options = {}) => {
  const available = isJoeDebugAvailable(options);
  const hasWindow = options.hasWindow ?? (typeof window !== 'undefined');

  return {
    available,
    joePanelEnabled: available && isJoeDebugEnabled({ ...options, dev: available, hasWindow }),
    joePanelVisible: available && !!options.joePanelVisible,
    surfacePreviewEnabled: available && !!options.surfacePreviewEnabled,
    shouldAttachBrowserControls: available && hasWindow,
    shouldBuildJoeDebugEntry: available && !!options.joePanelVisible,
    shouldBuildAgentDebugPreview: available && !!options.surfacePreviewEnabled,
    shouldRenderJoeDebugPanel: available && !!options.joePanelVisible,
  };
};
