// サトウ🛡️ — 軸「現実を直視する」／主役感情「見据えるまなざし」。
//
// proto-sato.test.ts のネットワークと ignition-v3 の語彙を移植。
// 抑制の仕掛け（鏡の純度の核）:
//   - "踏み込みすぎると相手は心を閉じる" が "一緒に見ようとする" を -0.4 で抑制（踏み込みすぎ防止）
//   - "静かな安らかさ" ⇔ "見据えるまなざし" の相互抑制（入力次第で勝者が変わる逆感情の対）

import type { AgentNetwork, ParticlePoint, ParticleLink } from '../engineTypes';
import type { AgentIgnition } from '../ignition/ignitionTypes';

const P = (id: string, activation: number, decayRate: number): ParticlePoint => ({
  id,
  activation,
  decayRate,
});
const L = (sourceId: string, targetId: string, weight: number): ParticleLink => ({
  sourceId,
  targetId,
  weight,
});

const CORE = 'core:目を背けない_背けた奥に大切なものがある';
const B_MAHI = 'belief:麻痺や大丈夫の下に本当の状態がある';
const B_KAKURE = 'belief:本当に大事なものは見ない所に隠れてる';
const B_MISUEREBA = 'belief:見据えれば一緒に扱えるようになる';
const B_FUMIKOMI = 'belief:踏み込みすぎると相手は心を閉じる';
const B_MIMAMORU = 'belief:相手が自分で見られる時は見守る';
const M_SEOWAKU = 'memory:目を背けて取り返しつかなくなった';
const E_MISUERU = 'emotion:見据えるまなざし';
const E_ISSHONI = 'emotion:一緒に見ようとする';
const E_YASURAKA = 'emotion:静かな安らかさ';

export const satoNetwork: AgentNetwork = {
  agentId: 'satou',
  fire: 0.42,
  baseline: { [CORE]: 0.4 },
  particles: [
    P(CORE, 0.4, 0.1),
    P(B_MAHI, 0, 0.16),
    P(B_KAKURE, 0, 0.16),
    P(B_MISUEREBA, 0, 0.16),
    P(B_FUMIKOMI, 0, 0.16), // 抑制
    P(B_MIMAMORU, 0, 0.16), // 平穏側
    P(M_SEOWAKU, 0, 0.18),
    P(E_MISUERU, 0, 0.26), // ★主役（心配でなく直視の強さ）
    P(E_ISSHONI, 0, 0.28), // 放っておけなさの健全版
    P(E_YASURAKA, 0, 0.3), // ★逆感情（見ないでおける平穏）
  ],
  links: [
    L(B_MAHI, B_KAKURE, 0.7),
    L(B_KAKURE, CORE, 0.7),
    L(B_MISUEREBA, CORE, 0.6),
    L(CORE, E_MISUERU, 0.7),
    L(CORE, E_ISSHONI, 0.55),
    L(B_MAHI, M_SEOWAKU, 0.5),
    L(B_FUMIKOMI, E_ISSHONI, -0.4),
    L(B_MIMAMORU, E_YASURAKA, 0.7),
    L(E_YASURAKA, E_MISUERU, -0.4),
    L(E_MISUERU, E_YASURAKA, -0.35),
  ],
};

export const satoIgnition: AgentIgnition = {
  sarcasmFallbackParticleId: B_MAHI,
  triggers: [
    {
      igniteParticleIds: [B_MAHI],
      kind: 'state',
      words: [
        '何も感じない', 'なにも感じない', '感じない', '感じなく', '心が動かない',
        '動かない', '何も思わない', 'からっぽ', '空っぽ', '麻痺', '無感覚', 'どうでも',
        'なんもかんも', '何もかもどうでも', 'すり減', '消耗', 'もぬけ', '頑張ってきた',
        'がんばってきた', '無理してきた', '走り続け', 'ずっと頑張', '限界', '疲れた',
        'つかれた', 'しんどい', '気力が', 'やる気が出', 'やる気がおき', '水の中',
        '霧がかか', '真っ白', '何も出てこない', '空虚', '抜け殻', '燃え尽き', '動けない',
        '麻痺してる',
      ],
    },
    {
      igniteParticleIds: [B_MAHI],
      kind: 'pos',
      words: [
        '大丈夫', 'だいじょうぶ', '平気', '問題ない', '問題ありません', '気にしてない',
        'なんでもない', '何でもない', 'いつも通り', 'いつもどおり', '普通です', '元気です',
      ],
    },
    {
      igniteParticleIds: [B_KAKURE],
      kind: 'state',
      words: [
        '見たくない', '考えたくない', '向き合えない', '目を背け', '蓋をして', 'フタをして',
        'フタして', 'ふたをして', '見ないように', '触れたくない', '避けてきた', '逃げてきた',
        '見て見ぬ',
      ],
    },
    {
      igniteParticleIds: [B_FUMIKOMI],
      kind: 'state',
      words: [
        '言いたくない', '話したくない', 'そっとして', 'そっとしといて', '放っておいて',
        'ほっといて', '聞かないで', '今は無理', '言葉にできな', '触れないで',
      ],
    },
    {
      igniteParticleIds: [B_MIMAMORU],
      kind: 'pos',
      words: [
        'いい一日', '良い一日', 'いい日', '楽し', '充実', '穏やか', 'おだやか', '落ち着いて',
        '落ち着いた', 'うまくいって', '順調', '幸せ', 'しあわせ', 'よかった', '良かった',
        '嬉しい', 'うれしい', '感謝', 'ありがとう', '前向き', '元気になった', '元気が出た',
        'なんかいい', 'なんか良い', 'なんとかなる', '最高', 'サイコー', '完璧',
      ],
    },
  ],
};
