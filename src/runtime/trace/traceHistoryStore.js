// src/runtime/trace/traceHistoryStore.js
// Phase V-4: 履歴・比較・エクスポート
// localStorage を用いた直近10ターンの trace 履歴管理（開発モード限定）

const HISTORY_STORAGE_KEY = 'jibunkaigi.traceHistory';
const MAX_HISTORY_SIZE = 10;

/**
 * 開発モードかどうかを判定
 * import.meta.env.DEV を使用
 */
const isDevMode = () => {
  try {
    return typeof import.meta !== 'undefined' && !!import.meta.env?.DEV;
  } catch {
    return false;
  }
};

/**
 * localStorage から履歴を読み込む
 * 開発モードでない場合は空配列を返す
 *
 * @returns {Array} trace オブジェクトの配列
 */
export const loadTraceHistory = () => {
  if (!isDevMode()) return [];

  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];

    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('[traceHistoryStore] Failed to load history:', error);
    return [];
  }
};

/**
 * localStorage に履歴を保存する
 * 開発モードでない場合は何もしない
 * 最大 MAX_HISTORY_SIZE 件まで保持し、古いものから削除
 *
 * @param {Object} trace - 保存する trace オブジェクト
 */
export const saveTraceToHistory = (trace) => {
  if (!isDevMode()) return;
  if (!trace) return;

  try {
    if (typeof window === 'undefined' || !window.localStorage) return;

    const history = loadTraceHistory();

    // 同じ turnId の trace が既に存在する場合は除外
    const filtered = history.filter((entry) => entry?.turnId !== trace.turnId);

    // 新しい trace を先頭に追加
    const updated = [trace, ...filtered];

    // 最大サイズを超える場合は古いものから削除
    const trimmed = updated.slice(0, MAX_HISTORY_SIZE);

    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.warn('[traceHistoryStore] Failed to save history:', error);
  }
};

/**
 * localStorage から履歴を全削除する
 * 開発モードでない場合は何もしない
 */
export const clearTraceHistory = () => {
  if (!isDevMode()) return;

  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.warn('[traceHistoryStore] Failed to clear history:', error);
  }
};

/**
 * trace を JSON 形式でエクスポート
 * LLM 生応答やユーザー原文をマスクするオプションあり
 *
 * @param {Object} trace - エクスポートする trace オブジェクト
 * @param {Object} options - エクスポートオプション
 * @param {boolean} options.maskLLMResponse - LLM 応答をマスクするか
 * @param {boolean} options.maskUserText - ユーザー入力をマスクするか
 * @returns {string} JSON 文字列
 */
export const exportTraceAsJSON = (trace, options = {}) => {
  if (!trace) return '{}';

  const { maskLLMResponse = false, maskUserText = false } = options;

  try {
    let exported = { ...trace };

    // events 配列の各イベントをチェックしてマスク処理
    if (Array.isArray(exported.events)) {
      exported.events = exported.events.map((event) => {
        const masked = { ...event };

        // LLM_RESPONSE ステージのマスク
        if (maskLLMResponse && event.stage === 'LLM_RESPONSE' && event.payload) {
          masked.payload = {
            ...event.payload,
            text: '[MASKED]',
            content: '[MASKED]',
          };
        }

        // INPUT ステージのマスク
        if (maskUserText && event.stage === 'INPUT' && event.payload) {
          masked.payload = {
            ...event.payload,
            userText: '[MASKED]',
            text: '[MASKED]',
          };
        }

        return masked;
      });
    }

    return JSON.stringify(exported, null, 2);
  } catch (error) {
    console.error('[traceHistoryStore] Failed to export trace:', error);
    return '{}';
  }
};

/**
 * trace をファイルとしてダウンロード
 *
 * @param {Object} trace - ダウンロードする trace オブジェクト
 * @param {Object} options - エクスポートオプション
 */
export const downloadTraceAsJSON = (trace, options = {}) => {
  if (!trace) return;

  try {
    const json = exportTraceAsJSON(trace, options);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `jibun-trace-${timestamp}.json`;

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[traceHistoryStore] Failed to download trace:', error);
  }
};
