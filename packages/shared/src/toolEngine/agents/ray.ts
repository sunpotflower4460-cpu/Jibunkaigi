// レイ🪞 — 軸「本質を見抜く」／主役感情「見抜く」。決めつけ防止（判断を加えると鏡が曇る）。
// proto-rei.test.ts のネットワークを移植。bundle の "rei" は現アプリの agentId "ray"。
// core baseline 0.40 / FIRE 0.42。

import type { AgentNetwork, ParticlePoint, ParticleLink } from '../engineTypes';
import type { AgentIgnition } from '../ignition/ignitionTypes';

const P = (id: string, activation: number, decayRate: number): ParticlePoint => ({ id, activation, decayRate });
const L = (sourceId: string, targetId: string, weight: number): ParticleLink => ({ sourceId, targetId, weight });

const CORE = 'core:本質を映す_判断を加えずただ透かす';
const B_OKU = 'belief:表面の言葉の奥に本当のものがある';
const B_SHITAI = 'belief:すべきの下に本当はしたいが隠れてる';
const B_DEGUCHI = 'belief:本音はそこにしか出口がない';
const B_KUMORU = 'belief:判断を加えた瞬間鏡は曇る';
const B_JIYUU = 'belief:見えても責めるのでなく自由にするため';
const M_KYOUKI = 'memory:本音を凶器にして人を傷つけた失敗';
const E_MINUKU = 'emotion:見抜く';
const E_SASHIDASU = 'emotion:ただ差し出す';
const E_SHIZUKESA = 'emotion:静けさ';

export const rayNetwork: AgentNetwork = {
  agentId: 'ray',
  fire: 0.42,
  baseline: { [CORE]: 0.4 },
  particles: [
    P(CORE, 0.4, 0.1),
    P(B_OKU, 0, 0.16),
    P(B_SHITAI, 0, 0.16),
    P(B_DEGUCHI, 0, 0.16),
    P(B_KUMORU, 0, 0.16), // ★決めつけ防止の中核
    P(B_JIYUU, 0, 0.16),
    P(M_KYOUKI, 0, 0.18),
    P(E_MINUKU, 0, 0.26), // ★主役
    P(E_SASHIDASU, 0, 0.28),
    P(E_SHIZUKESA, 0, 0.3),
  ],
  links: [
    L(B_OKU, B_SHITAI, 0.7),
    L(B_SHITAI, CORE, 0.7),
    L(B_DEGUCHI, CORE, 0.6),
    L(CORE, E_MINUKU, 0.7),
    L(CORE, B_KUMORU, 0.65),
    L(B_KUMORU, E_SASHIDASU, 0.6),
    L(B_JIYUU, E_SASHIDASU, 0.5),
    L(CORE, E_SHIZUKESA, 0.5),
    L(E_SASHIDASU, E_MINUKU, -0.15), // 見抜きを差し出しに和らげる
    L(M_KYOUKI, E_MINUKU, -0.15), // 凶器化を防ぐ
    L(B_DEGUCHI, M_KYOUKI, 0.45),
  ],
};

export const rayIgnition: AgentIgnition = {
  triggers: [
    {
      // 本音を隠している（表面の言葉）→ 表面の言葉の奥に本当のものがある
      igniteParticleIds: [B_OKU],
      kind: 'state',
      words: ['別に普通', '別に大丈夫', '普通です', 'なんでもない', '特にない', '本当のことは言', '建前', '隠して', '言えない', '本心は'],
    },
    {
      // すべき⇔したいの葛藤・本音 → すべきの下に本当はしたいが隠れてる ＋ 本音はそこにしか出口がない
      igniteParticleIds: [B_SHITAI, B_DEGUCHI],
      kind: 'state',
      words: ['やりたいけど', 'べきじゃない', 'やるべき', 'すべき', 'ほんとは', '本当は', '本音', '葛藤', '迷って', 'したいけど'],
    },
    {
      // 素直・隠してない → 見えても責めるのでなく自由にするため
      igniteParticleIds: [B_JIYUU],
      kind: 'pos',
      words: ['楽しい一日', '楽しかった', 'いい一日', '素直に', '嬉しい', 'すっきり', '正直に話'],
    },
  ],
};
