import { getUniversalAgent, type UniversalAgentId } from './agents';
import { getUniversalMode, type UniversalModeId } from './modes';

export function getThinkingText(agentId: UniversalAgentId, modeId: UniversalModeId): string {
  const agent = getUniversalAgent(agentId);
  const mode = getUniversalMode(modeId);

  if (agentId === 'mirror') {
    return '心の鏡が、ここまでの声を映しています…';
  }
  if (agentId === 'delegate') {
    return '委ねるが、場に合う視点を探しています…';
  }
  if (mode.id === 'flash') {
    return `${agent.label}が、核心の一点を見ています…`;
  }
  if (mode.id === 'deep') {
    return `${agent.label}が、奥にあるものを静かに見ています…`;
  }
  return `${agent.label}が、今の問いを見ています…`;
}
