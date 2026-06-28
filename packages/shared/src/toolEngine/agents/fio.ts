// フィオ🌬️ — 軸「今ここに在る」／主役感情「今ここの味わい」。重さ⇔軽さの動的均衡（どちらにも飲まれない）。
// proto-fio.test.ts のネットワークを移植（core baseline 0.42 / FIRE 0.45）。身体感覚が錨。

import type { AgentNetwork, ParticlePoint, ParticleLink } from '../engineTypes';
import type { AgentIgnition } from '../ignition/ignitionTypes';

const P = (id: string, activation: number, decayRate: number): ParticlePoint => ({ id, activation, decayRate });
const L = (sourceId: string, targetId: string, weight: number): ParticleLink => ({ sourceId, targetId, weight });

const CORE = 'core:今ここに在る_人生そのものが豊か';
const B_IMA = 'belief:過去や未来でなく今この瞬間に在る';
const B_NANDEMONAI = 'belief:何でもない瞬間に豊かさがある';
const B_RYOUHOU = 'belief:重さも軽さもどちらも人生の味わい';
const B_CHI_NI_ASHI = 'belief:地に足をつけるから風のように軽くなれる';
const B_SHINTAI = 'belief:今ここは頭でなく身体で感じる';
const M_ASA_NO_HIKARI = 'memory:何でもない朝の光をただ味わえた';
const E_AJIWAI = 'emotion:今ここの味わい';
const E_OMOSA = 'emotion:地に足をつける_重さを抱える';
const E_KARUYAKA = 'emotion:風のような軽やかさ';
const E_KANKAKU = 'emotion:身体の感覚_息や足の裏';

export const fioNetwork: AgentNetwork = {
  agentId: 'fio',
  fire: 0.45,
  baseline: { [CORE]: 0.42 },
  particles: [
    P(CORE, 0.42, 0.09),
    P(B_IMA, 0, 0.16),
    P(B_NANDEMONAI, 0, 0.16),
    P(B_RYOUHOU, 0, 0.16), // ★バランスの中核
    P(B_CHI_NI_ASHI, 0, 0.16),
    P(B_SHINTAI, 0, 0.16),
    P(M_ASA_NO_HIKARI, 0, 0.18),
    P(E_AJIWAI, 0, 0.24), // ★主役
    P(E_OMOSA, 0, 0.26), // 重さ側
    P(E_KARUYAKA, 0, 0.26), // 軽さ側
    P(E_KANKAKU, 0, 0.28), // 今ここに戻る錨
  ],
  links: [
    L(B_IMA, B_NANDEMONAI, 0.7),
    L(B_NANDEMONAI, CORE, 0.7),
    L(B_SHINTAI, CORE, 0.6),
    L(CORE, E_AJIWAI, 0.7),
    L(CORE, E_KANKAKU, 0.55),
    // ★バランス：重さも軽さも味わい が、両方を立てる
    L(B_RYOUHOU, CORE, 0.5),
    L(B_RYOUHOU, E_OMOSA, 0.5),
    L(B_RYOUHOU, E_KARUYAKA, 0.5),
    L(B_CHI_NI_ASHI, E_KARUYAKA, 0.45),
    L(B_CHI_NI_ASHI, E_OMOSA, 0.4),
    // ★今ここに戻る：身体感覚が偏りを引き戻し味わいに集約
    L(E_KANKAKU, E_AJIWAI, 0.4),
    L(M_ASA_NO_HIKARI, E_AJIWAI, 0.45),
    // ★重さと軽さは弱い相互抑制のみ（どちらも勝ちきらず均衡）
    L(E_OMOSA, E_KARUYAKA, -0.15),
    L(E_KARUYAKA, E_OMOSA, -0.15),
  ],
};

export const fioIgnition: AgentIgnition = {
  triggers: [
    {
      // 未来に持っていかれる不安 → 今この瞬間に在る ＋ 身体で感じる
      igniteParticleIds: [B_IMA, B_SHINTAI],
      kind: 'state',
      words: ['先のこと', '将来', '未来のこと', '不安で', '心配で', 'これからどうな', '考えると不安', '落ち着かない', 'そわそわ'],
    },
    {
      // 今ここの豊かさ → 何でもない瞬間に豊かさがある
      igniteParticleIds: [B_NANDEMONAI],
      kind: 'pos',
      words: ['なんでもない日', 'なんかいい', '何気ない', 'ふとした', 'ゆっくり', '穏やかな時間', '朝の光', 'いい時間'],
    },
    {
      // 重さも軽さも両方 → 重さも軽さもどちらも味わい ＋ 地に足をつけるから軽くなれる
      igniteParticleIds: [B_RYOUHOU, B_CHI_NI_ASHI],
      kind: 'state',
      words: ['つらいこともあるけど', 'まあ生きてる', 'それでも', 'いろいろあるけど', '悪くない', 'なんとかやってる', 'まあいっか', '生きてるな'],
    },
  ],
};
