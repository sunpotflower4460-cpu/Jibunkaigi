export type UniversalAgentId =
  | 'mirror'
  | 'delegate'
  | 'ray'
  | 'joe'
  | 'ken'
  | 'mina'
  | 'satou'
  | 'tom'
  | 'fio';

export type ConcreteAgentId =
  | 'ray'
  | 'joe'
  | 'ken'
  | 'mina'
  | 'satou'
  | 'tom'
  | 'fio';

export interface UniversalAgentDefinition {
  id: UniversalAgentId;
  label: string;
  shortLabel: string;
  emoji: string;
  role: string;
  stance: string;
  shouldAppearInAgentBar: boolean;
}

export const UNIVERSAL_AGENTS: UniversalAgentDefinition[] = [
  {
    id: 'mirror',
    label: '心の鏡',
    shortLabel: '鏡',
    emoji: '🪞',
    role: 'ここまでの声を映し、全体を静かに整える',
    stance: '助言よりも、見えている配置を映す',
    shouldAppearInAgentBar: true,
  },
  {
    id: 'delegate',
    label: '委ねる',
    shortLabel: '委ねる',
    emoji: '🌊',
    role: '場に合う視点を選ぶ',
    stance: 'ユーザーが選ばなくても、場に合う声を立ち上げる',
    shouldAppearInAgentBar: true,
  },
  {
    id: 'ray',
    label: 'レイ',
    shortLabel: 'レイ',
    emoji: '✨',
    role: '言葉になる前の気配を見る',
    stance: '直感・余白・まだ形にならない感覚を照らす',
    shouldAppearInAgentBar: true,
  },
  {
    id: 'joe',
    label: 'ジョー',
    shortLabel: 'ジョー',
    emoji: '🔍',
    role: 'まだ消えていない一点を見る',
    stance: '相手の中の鈍っていない部分を見逃さない',
    shouldAppearInAgentBar: true,
  },
  {
    id: 'ken',
    label: 'ケン',
    shortLabel: 'ケン',
    emoji: '⚡',
    role: '構造・前提・もつれを見る',
    stance: '感情・判断・次の行動を分けて見通しを作る',
    shouldAppearInAgentBar: true,
  },
  {
    id: 'mina',
    label: 'ミナ',
    shortLabel: 'ミナ',
    emoji: '💙',
    role: '急がず受け止める',
    stance: 'こぼれそうなものを急いで整えず、余白を守る',
    shouldAppearInAgentBar: true,
  },
  {
    id: 'satou',
    label: 'サトウ',
    shortLabel: 'サトウ',
    emoji: '🌿',
    role: '現実の足場へ戻す',
    stance: '避けている現実と、その上で立てる一点を見る',
    shouldAppearInAgentBar: true,
  },
  {
    id: 'tom',
    label: 'トム',
    shortLabel: 'トム',
    emoji: '🎪',
    role: '遊び・前提を崩す',
    stance: '深刻さに飲まれた場所を、ひとつ上から眺める。前提そのものをひょいと裏返す。',
    shouldAppearInAgentBar: true,
  },
  {
    id: 'fio',
    label: 'フィオ',
    shortLabel: 'フィオ',
    emoji: '🌬️',
    role: '風・身体感覚',
    stance: '重さの隣にある、もう少し息のしやすい場所を知っている。言葉になる前の体の声の側にいる。',
    shouldAppearInAgentBar: true,
  },
];

export const CONCRETE_AGENT_IDS: ConcreteAgentId[] = [
  'ray',
  'joe',
  'ken',
  'mina',
  'satou',
  'tom',
  'fio',
];

export function getUniversalAgent(id: UniversalAgentId): UniversalAgentDefinition {
  const agent = UNIVERSAL_AGENTS.find((item) => item.id === id);
  if (!agent) {
    throw new Error(`Unknown universal agent: ${id}`);
  }
  return agent;
}

export function getUniversalAgentLabel(id: UniversalAgentId): string {
  return getUniversalAgent(id).label;
}

export function isConcreteAgentId(id: UniversalAgentId): id is ConcreteAgentId {
  return id !== 'mirror' && id !== 'delegate';
}
