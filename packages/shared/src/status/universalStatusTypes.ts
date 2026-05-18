export type UniversalStorageMode = 'remote' | 'local';

export type UniversalAiMode = 'proxy' | 'mock-fallback';

export type UniversalStatusSeverity = 'info' | 'warning' | 'error' | 'success';

export interface UniversalStatusItem {
  id: string;
  label: string;
  message: string;
  severity: UniversalStatusSeverity;
  visibleInProduction: boolean;
}

export interface UniversalRuntimeStatus {
  storageMode: UniversalStorageMode;
  aiMode: UniversalAiMode;
  isLoadingSessions: boolean;
  isSaving: boolean;
  isThinking: boolean;
  isLoadingOthers: boolean;
  lastActionMessage: string | null;
  aiError: string | null;
  othersError: string | null;
  storageError: string | null;
  shareError: string | null;
  firebaseConfigured: boolean;
  proxyConfigured: boolean;
}
