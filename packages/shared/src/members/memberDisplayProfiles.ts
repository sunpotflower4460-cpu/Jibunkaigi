import { UNIVERSAL_AGENTS, type UniversalAgentId } from '../agents';
import { AGENT_PROMPT_PROFILES } from '../prompt/agentPromptProfiles';
import type { MemberDisplayProfile } from './memberDisplayTypes';

const MEMBER_ONE_LINE: Record<UniversalAgentId, string> = {
  mirror: '全体を映す静かな観測面',
  delegate: '場に合う声を選び出す',
  ray: '言葉になる前の気配に触れる',
  joe: 'まだ消えていない一点を見つける',
  ken: 'もつれの位置と隠れた前提を見る',
  mina: 'こぼれそうなものを受け止める場を作る',
  satou: '足元の崖を、見えるように指す',
  tom: '深刻さに飲まれた場所を、ひとつ上から眺める',
  fio: '言葉になる前の、体の声の側にいる',
};

const MEMBER_USER_FACING_HINT: Record<UniversalAgentId, string> = {
  mirror: '複数の声が積み重なった後、全体の配置を静かに確認したいときに使う。',
  delegate: 'どの視点を選べばいいか分からないとき、場に合う声が自然に立ち上がる。',
  ray: 'まだ言葉にならない感覚や、なんとなく気になっていることがあるときに使う。',
  joe: '諦めかけているけど、本当はまだ諦めていないと感じるときに使う。',
  ken: '考えがこんがらがっていて、何がどこにあるのか分からなくなったときに使う。',
  mina: '疲れていたり、感情を急いで整えたくないときに使う。',
  satou: '現実から目をそらしていると分かっているとき、でも動けないときに使う。',
  tom: 'ずっと同じ重さで考え込んでいて、抜け出せないと感じるときに使う。',
  fio: '頭でぐるぐる考えすぎて、体から離れてしまっていると感じるときに使う。',
};

export const MEMBER_DISPLAY_PROFILES: MemberDisplayProfile[] = UNIVERSAL_AGENTS.map((agent) => {
  const prompt = AGENT_PROMPT_PROFILES[agent.id];
  return {
    id: agent.id,
    label: agent.label,
    shortLabel: agent.shortLabel,
    emoji: agent.emoji,
    oneLine: MEMBER_ONE_LINE[agent.id],
    core: prompt.core,
    sees: prompt.sees,
    avoids: prompt.avoids,
    tone: prompt.tone,
    userFacingHint: MEMBER_USER_FACING_HINT[agent.id],
  };
});

export function getMemberDisplayProfile(id: UniversalAgentId): MemberDisplayProfile {
  const profile = MEMBER_DISPLAY_PROFILES.find((p) => p.id === id);
  if (!profile) throw new Error(`Unknown member display profile: ${id}`);
  return profile;
}
