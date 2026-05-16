import type { UniversalAgentId } from '../agents';

export interface MemberDisplayProfile {
  id: UniversalAgentId;
  label: string;
  shortLabel: string;
  emoji: string;
  oneLine: string;
  core: string;
  sees: string;
  avoids: string;
  tone: string;
  userFacingHint: string;
}
