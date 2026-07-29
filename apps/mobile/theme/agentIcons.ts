import {
  Compass,
  Flame,
  Heart,
  ShieldAlert,
  Sparkles,
  Star,
  Target,
  Wind,
  type LucideIcon,
} from 'lucide-react-native';
import type { UniversalAgentId } from '@jibunkaigi/shared';

/**
 * エージェントのアイコン。Web版 src/agents/agentDefinitions.jsx と
 * src/components/FloatingAgentBar.jsx が使う lucide アイコンに揃える。
 *
 * Web版に存在しないトム・フィオは、それぞれの役割
 * （前提を崩す / 風・身体感覚）に沿って同じ lucide 系から補う。
 */
export const AGENT_ICONS: Record<UniversalAgentId, LucideIcon> = {
  mirror: Compass,
  delegate: Sparkles,
  ray: Star,
  joe: Flame,
  ken: Target,
  mina: Heart,
  satou: ShieldAlert,
  tom: Sparkles,
  fio: Wind,
};

export function getAgentIcon(id: UniversalAgentId): LucideIcon {
  return AGENT_ICONS[id] ?? Star;
}
