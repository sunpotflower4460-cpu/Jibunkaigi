// じぶん会議（モバイル）— i18n 言語ストア
// ------------------------------------------------------------
// Web 版（src/i18n/store.js）と同じ「プロバイダ不要のモジュールストア」方式。
// RN 向けに localStorage → AsyncStorage、navigator/document → Intl ロケールに置換。
// 既定言語は端末ロケールから推定し、ユーザーの選択は AsyncStorage に永続化する。
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPPORTED_LANGS = ['ja', 'en'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

const STORAGE_KEY = 'jibunkaigi_lang';

const isLang = (value: unknown): value is Lang =>
  typeof value === 'string' && (SUPPORTED_LANGS as readonly string[]).includes(value);

const detectInitialLang = (): Lang => {
  try {
    const locale = (Intl?.DateTimeFormat?.().resolvedOptions?.().locale ?? 'ja').toLowerCase();
    // 日本語以外はすべて英語に寄せる（現状の対応言語が ja / en のため）
    return locale.startsWith('ja') ? 'ja' : 'en';
  } catch {
    return 'ja';
  }
};

let currentLang: Lang = detectInitialLang();
let userTouched = false;
const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((cb) => cb());
};

export const getLang = (): Lang => currentLang;

export const setLang = (lang: Lang) => {
  if (!isLang(lang) || lang === currentLang) return;
  userTouched = true;
  currentLang = lang;
  // 保存に失敗してもメモリ上の言語は切り替える
  AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {});
  emit();
};

export const toggleLang = () => setLang(currentLang === 'ja' ? 'en' : 'ja');

export const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

// 起動時に保存済みの選択を非同期で復元する（ユーザーが先に切り替えていれば尊重）。
const hydrate = async () => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (!userTouched && isLang(saved) && saved !== currentLang) {
      currentLang = saved;
      emit();
    }
  } catch {
    /* 取得に失敗したら推定値のままにする */
  }
};
void hydrate();
