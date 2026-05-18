import type { UniversalRuntimeStatus, UniversalStatusItem } from './universalStatusTypes';

export function buildUniversalStatusItems(
  status: UniversalRuntimeStatus,
): UniversalStatusItem[] {
  const items: UniversalStatusItem[] = [];

  if (!status.firebaseConfigured || status.storageMode === 'local') {
    items.push({
      id: 'storage-local',
      label: '保存',
      message: 'ローカルのみで動作中',
      severity: 'info',
      visibleInProduction: false,
    });
  }

  if (!status.proxyConfigured || status.aiMode === 'mock-fallback') {
    items.push({
      id: 'ai-fallback',
      label: 'AI',
      message: 'ローカル応答で動作中',
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
