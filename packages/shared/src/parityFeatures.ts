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
  | 'user_name_edit'
  | 'member_explanation'
  | 'error_display'
  | 'config_missing'
  | 'loading'
  | 'thinking'
  | 'history_restore';

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
  { id: 'delegate', label: '委ねる', userFacing: true, requiredForParity: true },
  { id: 'mirror', label: '心の鏡', userFacing: true, requiredForParity: true },
  { id: 'others', label: 'OTHERS', userFacing: true, requiredForParity: true },
  { id: 'session_save', label: 'セッション保存', userFacing: true, requiredForParity: true },
  { id: 'history_restore', label: '過去会話復元', userFacing: true, requiredForParity: true },
];
