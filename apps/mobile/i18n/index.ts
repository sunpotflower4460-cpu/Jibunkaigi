// じぶん会議（モバイル）— i18n フック
// ------------------------------------------------------------
// useLang(): 現在言語と setter を返す。
// useT():    現在言語に束縛した翻訳関数 t(key, vars) を返す。
// translate(): 非 React 文脈でも使える素の翻訳関数。
// Web 版（src/i18n/index.js）と同じ API を RN(TypeScript) に移植したもの。
import { useCallback, useSyncExternalStore } from 'react';
import { getLang, setLang, subscribe, toggleLang } from './store';
import type { Lang } from './store';
import { translations } from './translations';

export { SUPPORTED_LANGS, setLang, toggleLang, getLang } from './store';
export type { Lang } from './store';

type Vars = Record<string, string | number>;

export const translate = (lang: Lang, key: string, vars?: Vars): string => {
  const table = translations[lang] ?? translations.ja;
  // フォールバック: 当該言語 → 日本語 → キーそのもの
  let str: string = table[key] ?? translations.ja[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return str;
};

export const useLang = () => {
  const lang = useSyncExternalStore(subscribe, getLang, getLang);
  return { lang, setLang, toggleLang };
};

export const useT = () => {
  const lang = useSyncExternalStore(subscribe, getLang, getLang);
  return useCallback((key: string, vars?: Vars) => translate(lang, key, vars), [lang]);
};

export default useT;
