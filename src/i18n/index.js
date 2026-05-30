// じぶん会議 — i18n hooks
// ------------------------------------------------------------
// useLang(): 現在言語と setter を返す。
// useT():    現在言語に束縛した翻訳関数 t(key, vars) を返す。
// プロバイダ不要（useSyncExternalStore でモジュールストアを購読）。

import { useSyncExternalStore, useCallback } from 'react';
import { getLang, setLang, toggleLang, subscribe, SUPPORTED_LANGS } from './store';
import { translations } from './translations';

export { SUPPORTED_LANGS, setLang, toggleLang, getLang } from './store';

export const useLang = () => {
  const lang = useSyncExternalStore(subscribe, getLang, getLang);
  return { lang, setLang, toggleLang };
};

// 現在言語に依存しない素の翻訳関数（非 React 文脈でも使える）
export const translate = (lang, key, vars) => {
  const table = translations[lang] || translations.ja;
  let str = table[key];
  if (str == null) {
    // フォールバック: 日本語 → キーそのもの
    str = translations.ja[key] ?? key;
  }
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return str;
};

export const useT = () => {
  const lang = useSyncExternalStore(subscribe, getLang, getLang);
  return useCallback((key, vars) => translate(lang, key, vars), [lang]);
};

export default useT;
