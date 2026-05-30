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
    badgeLabel: '未実装',
    title: '端末内データをまとめて削除',
    scope: 'この端末上の一時データ',
    description: '会話の一時保持や将来の端末保存データをまとめて消す導線は、まだ追加していません。',
    detail: '追加時は会話セッションに加えて、付箋・会議録などの端末側データも対象へ含めます。',
    tone: 'warning',
  },
  {
    id: 'cloud-delete',
    badgeLabel: '危険操作 / 未実装',
    title: 'クラウドデータをまとめて削除',
    scope: 'Firebase 上の会話データ',
    description: 'クラウド全削除は危険操作として別枠で扱い、現在は未実装です。',
    detail: '追加時は確認ダイアログを必須にし、端末内削除とは分けて案内します。',
    tone: 'danger',
  },
];

export const MOBILE_REFLECTION_SHELF_DELETION_NOTE =
  '将来の Reflection Shelf では、付箋・会議録のようなユーザー追記データを削除対象へ含めます。言葉の水面や自分の輪郭など再計算できる表示は、個別保存を増やしすぎずキャッシュ削除で扱う方針です。';
