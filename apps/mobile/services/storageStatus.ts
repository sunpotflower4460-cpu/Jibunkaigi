import type { UniversalRuntimeStatus } from '@jibunkaigi/shared';

export type MobileStorageStatusTone = 'accent' | 'neutral' | 'warning' | 'danger';

export interface MobileStorageStatusSummary {
  badgeLabel: string;
  title: string;
  summary: string;
  detail: string;
  tone: MobileStorageStatusTone;
}

export interface MobileStorageExplanation {
  id: string;
  title: string;
  body: string[];
}

const TEMPORARY_LOCAL_DETAIL =
  '端末側では表示継続のために一時保持しますが、現状の local fallback は永続保存を約束しません。';

export const MOBILE_STORAGE_EXPLANATIONS: MobileStorageExplanation[] = [
  {
    id: 'remote',
    title: 'クラウド保存',
    body: [
      'Firebase 接続が有効なときは、会話セッションをクラウドへ保存します。',
      'このアプリでクラウド保存が有効なときの保存先はこちらです。',
    ],
  },
  {
    id: 'local',
    title: '端末内の一時保持',
    body: [
      '画面の表示や会話継続のために、端末側でも一時的に状態を持ちます。',
      TEMPORARY_LOCAL_DETAIL,
    ],
  },
  {
    id: 'fallback',
    title: 'fallback / 未設定',
    body: [
      'Firebase が未設定、またはクラウド保存へ切り替わらない間は、端末上の一時保持で動作します。',
      'この状態では「クラウドに保存済み」とは扱いません。',
    ],
  },
];

export function getMobileStorageStatusSummary(
  status: UniversalRuntimeStatus,
): MobileStorageStatusSummary {
  if (status.storageError) {
    return {
      badgeLabel: '保存エラー',
      title: '保存に一時的な失敗があります',
      summary: '表示中の会話は続けられますが、直近の内容が残らない可能性があります。',
      detail: '通信や保存先の状態が落ち着くまで、保存済みとはみなさないでください。',
      tone: 'danger',
    };
  }

  if (status.storageMode === 'remote') {
    if (status.isSaving) {
      return {
        badgeLabel: 'クラウド保存中',
        title: 'クラウドへ保存しています',
        summary: 'Firebase に会話を送っている途中です。',
        detail: '送信中でも画面の会話は続けられます。',
        tone: 'accent',
      };
    }

    return {
      badgeLabel: 'クラウド保存あり',
      title: '会話はクラウド保存を使っています',
      summary: 'Firebase に会話セッションを保存します。',
      detail: TEMPORARY_LOCAL_DETAIL,
      tone: 'accent',
    };
  }

  if (!status.firebaseConfigured) {
    return {
      badgeLabel: 'クラウド未設定',
      title: '端末上の一時保持で動作しています',
      summary: 'Firebase が未設定のため、クラウド保存は使っていません。',
      detail: TEMPORARY_LOCAL_DETAIL,
      tone: 'warning',
    };
  }

  return {
    badgeLabel: 'ローカル fallback',
    title: 'クラウド保存へ切り替わらず、一時保持で動作しています',
    summary: '今の会話は端末上の一時保持のみです。',
    detail: 'クラウドへ保存できていないため、保存済みとは表示しません。',
    tone: 'warning',
  };
}
