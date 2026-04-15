// src/runtime/compareMode.js
// Compare Mode 用のフラグ判定と UI 表示条件をまとめる。

/**
 * Compare Mode のエントリ表示上限数。
 * ComparePanel 等で entries.slice(0, COMPARE_MAX_ENTRIES) に使用する。
 */
export const COMPARE_MAX_ENTRIES = 5;

/**
 * Compare Mode が有効かを判定する。
 * デフォルトではブラウザ環境の location / localStorage を参照する。
 *
 * @param {object} [options]
 * @param {string} [options.search] - URLSearchParams 互換の search 文字列。
 * @param {() => string|null} [options.storageGetter] - localStorage 互換の getter。
 * @returns {boolean}
 */
export const readCompareModeFlag = (options = {}) => {
  const search = options.search ?? (typeof window !== 'undefined' ? window.location?.search : '');
  const storageGetter = options.storageGetter ?? (() => {
    if (typeof localStorage === 'undefined') return null;
    try {
      return localStorage.getItem('jibunkaigi:compareMode');
    } catch {
      return null;
    }
  });

  try {
    if (search) {
      const params = new URLSearchParams(search);
      if (params.get('compareMode') === '1') return true;
    }
  } catch {
    // search が不正でも Compare Mode の可否には影響させない
  }

  try {
    const stored = storageGetter();
    if (stored === '1' || stored === 'true') return true;
  } catch {
    // localStorage 取得失敗時は無効扱い
  }

  return false;
};

/**
 * Compare Mode の UI を表示するかどうかを判定する。
 *
 * @param {object} params
 * @param {boolean} params.enabled - Compare Mode フラグ
 * @param {Array} [params.entries] - 比較用データ
 * @returns {boolean}
 */
export const shouldShowComparePanel = ({ enabled, entries = [] } = {}) => {
  return Boolean(enabled && Array.isArray(entries) && entries.length > 0);
};
