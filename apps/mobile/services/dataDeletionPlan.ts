export type MobileDeletionActionTone = 'neutral' | 'warning' | 'danger';

export interface MobileDeletionAction {
  id: string;
  badgeLabel: string;
  title: string;
  scope: string;
  description: string;
  detail: string;
  tone: MobileDeletionActionTone;
}

export const MOBILE_DATA_DELETION_ACTIONS: MobileDeletionAction[] = [
  {
    id: 'session-delete',
    badgeLabel: '利用可能',
    title: 'セッション削除',
    scope: '1つの会話セッション',
    description: '会議一覧の各カードにある「削除」で、その会話と含まれるメッセージを削除します。',
    detail: '他のセッションやクラウド全体のデータまでは消しません。',
    tone: 'neutral',
  },
  {
    id: 'local-delete',
    badgeLabel: '利用可能',
    title: '端末内データをまとめて削除',
    scope: 'この端末上のプロフィールと一時データ',
    description: '下の「すべてのデータを削除」で、端末側のプロフィールを消し、一時保持中の会話表示も初期化します。',
    detail: '付箋・会議録・言葉の水面など端末側の一時データは再計算できる表示として初期化されます。',
    tone: 'neutral',
  },
  {
    id: 'cloud-delete',
    badgeLabel: '危険操作 / 利用可能',
    title: 'クラウドデータをまとめて削除',
    scope: 'Firebase 上の会話データとプロフィール',
    description: '下の「すべてのデータを削除」で、クラウド上の会話セッション・メッセージ・プロフィールを削除します。',
    detail: '確認ダイアログののち実行し、削除した内容は元に戻せません。',
    tone: 'danger',
  },
];

export const MOBILE_REFLECTION_SHELF_DELETION_NOTE =
  '将来の Reflection Shelf では、付箋・会議録のようなユーザー追記データを削除対象へ含めます。言葉の水面や自分の輪郭など再計算できる表示は、個別保存を増やしすぎずキャッシュ削除で扱う方針です。';
