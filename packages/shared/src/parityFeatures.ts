export type UniversalParityFeatureId =
  | 'onboarding'
  | 'empty_state'
  | 'composer'
  | 'send_message'
  | 'ai_reply'
  | 'mode_flash'
  | 'mode_dialogue'
  | 'mode_deep'
  | 'agent_ray'
  | 'agent_joe'
  | 'agent_ken'
  | 'agent_mina'
  | 'agent_satou'
  | 'delegate'
  | 'mirror'
  | 'others'
  | 'session_save'
  | 'session_list'
  | 'session_switch'
  | 'session_title_edit'
  | 'session_pin'
  | 'session_delete'
  | 'conversation_clear'
  | 'new_question'
  | 'user_name_edit'
  | 'member_explanation'
  | 'error_display'
  | 'config_missing'
  | 'loading'
  | 'thinking'
  | 'history_restore'
  | 'copy'
  | 'share'
  | 'composer_toggle'
  | 'floating_agent_bar';

export interface UniversalParityFeature {
  id: UniversalParityFeatureId;
  label: string;
  userFacing: boolean;
  requiredForParity: boolean;
}

export const UNIVERSAL_PARITY_FEATURES: UniversalParityFeature[] = [
  { id: 'onboarding', label: '初回オンボーディング', userFacing: true, requiredForParity: true },
  { id: 'empty_state', label: 'ホーム/空状態', userFacing: true, requiredForParity: true },
  { id: 'composer', label: '問いを書く', userFacing: true, requiredForParity: true },
  { id: 'send_message', label: 'メッセージ送信', userFacing: true, requiredForParity: true },
  { id: 'ai_reply', label: 'AI応答', userFacing: true, requiredForParity: true },
  { id: 'mode_flash', label: '一閃モード', userFacing: true, requiredForParity: true },
  { id: 'mode_dialogue', label: '対話モード', userFacing: true, requiredForParity: true },
  { id: 'mode_deep', label: '深淵モード', userFacing: true, requiredForParity: true },
  { id: 'agent_ray', label: 'レイ', userFacing: true, requiredForParity: true },
  { id: 'agent_joe', label: 'ジョー', userFacing: true, requiredForParity: true },
  { id: 'agent_ken', label: 'ケン', userFacing: true, requiredForParity: true },
  { id: 'agent_mina', label: 'ミナ', userFacing: true, requiredForParity: true },
  { id: 'agent_satou', label: 'サトウ', userFacing: true, requiredForParity: true },
  { id: 'delegate', label: '委ねる', userFacing: true, requiredForParity: true },
  { id: 'mirror', label: '心の鏡', userFacing: true, requiredForParity: true },
  { id: 'others', label: 'ほかの声', userFacing: true, requiredForParity: true },
  { id: 'session_save', label: 'セッション保存', userFacing: true, requiredForParity: true },
  { id: 'session_list', label: 'セッション一覧', userFacing: true, requiredForParity: true },
  { id: 'session_switch', label: 'セッション切り替え', userFacing: true, requiredForParity: true },
  { id: 'session_title_edit', label: 'セッションタイトル編集', userFacing: true, requiredForParity: true },
  { id: 'session_pin', label: 'ピン留め', userFacing: true, requiredForParity: false },
  { id: 'session_delete', label: 'セッション削除', userFacing: true, requiredForParity: true },
  { id: 'conversation_clear', label: '会話クリア', userFacing: true, requiredForParity: true },
  { id: 'new_question', label: '新しい問いを始める', userFacing: true, requiredForParity: true },
  { id: 'user_name_edit', label: 'ユーザー名変更', userFacing: true, requiredForParity: true },
  { id: 'member_explanation', label: '会議メンバー説明', userFacing: true, requiredForParity: true },
  { id: 'error_display', label: 'エラー表示', userFacing: true, requiredForParity: true },
  { id: 'config_missing', label: '設定不足表示', userFacing: true, requiredForParity: true },
  { id: 'loading', label: 'ローディング表示', userFacing: true, requiredForParity: true },
  { id: 'thinking', label: '思考中表示', userFacing: true, requiredForParity: true },
  { id: 'history_restore', label: '過去会話復元', userFacing: true, requiredForParity: true },
  { id: 'copy', label: 'コピー', userFacing: true, requiredForParity: false },
  { id: 'share', label: '共有', userFacing: true, requiredForParity: false },
  { id: 'composer_toggle', label: '入力欄を閉じる/開く', userFacing: true, requiredForParity: false },
  { id: 'floating_agent_bar', label: 'FloatingAgentBar', userFacing: true, requiredForParity: true },
];
