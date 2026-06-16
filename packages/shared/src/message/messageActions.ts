export type UniversalMessageActionId =
  | 'copy'
  | 'share'
  | 'delete'
  | 'others';

export interface UniversalMessageActionDefinition {
  id: UniversalMessageActionId;
  label: string;
  destructive?: boolean;
}

export const UNIVERSAL_MESSAGE_ACTIONS: UniversalMessageActionDefinition[] = [
  { id: 'copy', label: 'コピー' },
  { id: 'share', label: '共有' },
  { id: 'delete', label: '削除', destructive: true },
  { id: 'others', label: 'ほかの声' },
];
