// じぶん会議 — i18n language store
// ------------------------------------------------------------
// プロバイダを使わず、モジュールレベルの軽量ストアで現在言語を保持する。
// useSyncExternalStore で購読し、どのコンポーネントからも useLang() で読める。
// 既定言語は端末（ブラウザ）の言語から自動判定し、選択は localStorage に保存する。

export const SUPPORTED_LANGS = ['ja', 'en'];
const STORAGE_KEY = 'jibunkaigi_lang';

const detectInitialLang = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  } catch {
    /* localStorage 不可の環境では既定にフォールバック */
  }
  try {
    const nav = (navigator.language || navigator.languages?.[0] || 'ja').toLowerCase();
    // 日本語以外はすべて英語に寄せる（現状の対応言語が ja / en のため）
    return nav.startsWith('ja') ? 'ja' : 'en';
  } catch {
    return 'ja';
  }
};

let currentLang = detectInitialLang();
const listeners = new Set();

export const getLang = () => currentLang;

export const setLang = (lang) => {
  if (!SUPPORTED_LANGS.includes(lang) || lang === currentLang) return;
  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* 保存に失敗してもメモリ上の言語は切り替える */
  }
  try {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = lang;
    }
  } catch {
    /* noop */
  }
  listeners.forEach((cb) => cb());
};

export const toggleLang = () => setLang(currentLang === 'ja' ? 'en' : 'ja');

export const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

// 初期描画時に <html lang> を同期しておく
try {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = currentLang;
  }
} catch {
  /* noop */
}
