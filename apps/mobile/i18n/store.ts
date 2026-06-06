// じぶん会議（モバイル）— i18n 言語ストア
// ------------------------------------------------------------
// Web 版（src/i18n/store.js）と同じ「プロバイダ不要のモジュールストア」方式。
// RN 向けに localStorage → AsyncStorage、navigator/document → Intl ロケールに置換。
//
// SSR/静的プリレンダ安全性: Expo Web は app.json の output:"static" でビルド時に
// プリレンダする。初回レンダリングは全環境で確定的に DEFAULT_LANG にし、端末ロケール
// 検出と保存済み選択の復元は「マウント後」の hydrate に集約する。これにより
// プリレンダ HTML とクライアント初回レンダリングが一致し、ハイドレーション不整合を避ける。
// 検出・復元はその後に反映される（native では起動直後の同一ティックで解決）。
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPPORTED_LANGS = ['ja', 'en'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

const DEFAULT_LANG: Lang = 'ja';
const STORAGE_KEY = 'jibunkaigi_lang';

const isLang = (value: unknown): value is Lang =>
  typeof value === 'string' && (SUPPORTED_LANGS as readonly string[]).includes(value);

// 端末ロケールから既定言語を推定する（保存済みの選択が無いときのみ使う）。
const detectDeviceLang = (): Lang => {
  try {
    const locale = (Intl?.DateTimeFormat?.().resolvedOptions?.().locale ?? 'ja').toLowerCase();
    // 日本語以外はすべて英語に寄せる（現状の対応言語が ja / en のため）
    return locale.startsWith('ja') ? 'ja' : 'en';
  } catch {
    return DEFAULT_LANG;
  }
};

let currentLang: Lang = DEFAULT_LANG;
let userTouched = false;
const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((cb) => cb());
};

export const getLang = (): Lang => currentLang;

// SSR/プリレンダ用の確定的なスナップショット（環境に依存しない）。
export const getServerSnapshot = (): Lang => DEFAULT_LANG;

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

// マウント後に、保存済みの選択 → 無ければ端末ロケール、の順で初期言語を解決する。
// ユーザーが先に切り替えていれば（userTouched）その選択を尊重する。
const hydrate = async () => {
  let resolved: Lang | null = null;
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) resolved = saved;
  } catch {
    /* 取得に失敗したら端末ロケールにフォールバック */
  }
  if (resolved == null) resolved = detectDeviceLang();
  if (!userTouched && resolved !== currentLang) {
    currentLang = resolved;
    emit();
  }
};
void hydrate();
