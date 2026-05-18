import type { UniversalRuntimeStatus, UniversalStatusItem } from './universalStatusTypes';

export function buildUniversalStatusItems(
  status: UniversalRuntimeStatus,
): UniversalStatusItem[] {
  const items: UniversalStatusItem[] = [];

  items.push({
    id: status.storageMode === 'remote' ? 'storage-remote' : 'storage-local',
    label: '保存',
    message: status.storageMode === 'remote' ? 'Remote' : 'ローカルのみ',
    severity: 'info',
    visibleInProduction: true,
  });

  items.push({
    id: status.aiMode === 'proxy' ? 'ai-proxy' : 'ai-fallback',
    label: 'AI',
    message: status.aiMode === 'proxy' ? 'Proxy' : 'ローカル応答',
    severity: 'info',
    visibleInProduction: true,
  });

  if (!status.firebaseConfigured) {
    items.push({
      id: 'storage-local-notice',
      label: '保存',
      message: 'Firebase envが未設定のため、端末内の一時保存で動作しています。',
      severity: 'info',
      visibleInProduction: false,
    });
  }

  if (!status.proxyConfigured) {
    items.push({
      id: 'ai-fallback-notice',
      label: 'AI',
      message: 'Gemini Proxy URLが未設定のため、mock fallbackで動作しています。',
      severity: 'info',
      visibleInProduction: false,
    });
  }

  if (status.isLoadingSessions) {
    items.push({
      id: 'loading-sessions',
      label: '読み込み',
      message: 'セッションを読み込んでいます',
      severity: 'info',
      visibleInProduction: true,
    });
  }

  if (status.isSaving) {
    items.push({
      id: 'saving',
      label: '保存',
      message: '保存しています',
      severity: 'info',
      visibleInProduction: true,
    });
  }

  if (status.isThinking) {
    items.push({
      id: 'thinking',
      label: 'AI',
      message: '返答を考えています',
      severity: 'info',
      visibleInProduction: true,
    });
  }

  if (status.isLoadingOthers) {
    items.push({
      id: 'others-loading',
      label: 'OTHERS',
      message: '他の視点を集めています',
      severity: 'info',
      visibleInProduction: true,
    });
  }

  if (status.lastActionMessage) {
    items.push({
      id: 'last-action',
      label: '操作',
      message: status.lastActionMessage,
      severity: 'success',
      visibleInProduction: true,
    });
  }

  if (status.aiError) {
    items.push({
      id: 'ai-error',
      label: 'AI',
      message: 'AI応答に一時的に失敗しました。ローカル応答に切り替えています。',
      severity: 'warning',
      visibleInProduction: true,
    });
  }

  if (status.othersError) {
    items.push({
      id: 'others-error',
      label: 'OTHERS',
      message: '他の視点の取得に一時的に失敗しました。ローカル応答に切り替えています。',
      severity: 'warning',
      visibleInProduction: true,
    });
  }

  if (status.storageError) {
    items.push({
      id: 'storage-error',
      label: '保存',
      message: '保存に一時的に失敗しました。表示中の会話は続けられます。',
      severity: 'warning',
      visibleInProduction: true,
    });
  }

  if (status.shareError) {
    items.push({
      id: 'share-error',
      label: '共有',
      message: status.shareError,
      severity: 'warning',
      visibleInProduction: true,
    });
  }

  return items;
}
