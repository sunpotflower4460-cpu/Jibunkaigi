// tool層 → user-assistant層への橋渡し。浮上材料と補正方針を、プロンプトの一節に整形する。
//
// 鏡の純度の最終仕上げ:
//   - 生の数値は LLM に渡さない（強/中/弱 の粗いバケットのみ。「活性0.7」と口走る事故を防ぐ）。
//   - 材料は「演じる台本」でなく「いま立ち上がっている内的状態」として枠付けする。
//   - 補正は保守的に: まず材料に従う。入力優先は材料に無い確かなものが読める時だけ、
//     かつその声の角度から見えるものに限る（別の視点にならない／無理に足さない）。

import type { ParticleKind, SurfacedMaterial } from './engineTypes';

/** 各エージェントの「気づきの目」: その人格の言葉で書いた、特に拾う取りこぼし。 */
export const AGENT_CORRECTION_LENSES: Record<string, string> = {
  satou:
    '強がりや「大丈夫」の言葉の下に、本当の状態が隠れていないか。こちらの語彙にない言い回しや皮肉を、見落としていないか。',
  joe:
    '軽い言葉が深い闇を覆っていないか。逆に、本人もまだ気づいていない“消えていない火”が、言葉の端に灯っていないか。ただし、無い火を灯ったことにはしない。あくまで本人の中に既にあるものだけ。',
  mina:
    '明るい言葉の下に、まだ言葉にできていない疲れや涙の気配はないか。ただし拾っても一緒に沈まず、抱えていられる場所として受け取る。',
  ray:
    '語彙に表れていない気配・隠された本音こそ、あなたが察するもの。ただし察したことを決めつけにせず、見抜いても差し出すにとどめる。',
  ken:
    'まだ言葉にならない混乱や、整理しきれていないもつれが、語彙の外に残っていないか。気づいても、急いで形にしようとしないこと。',
  tom:
    '重さを軽い言葉で覆っていないか。逆に、些細を握りしめて重くしていないか。どちらでも茶化さず、飲まれず、一段上から眺める。',
  fio:
    '言葉は今を語っていても、意識が過去や未来に持っていかれていないか。息や肩や足の裏——身体からのサインを見落としていないか。',
};

const KIND_LABELS: Record<ParticleKind, string> = {
  deepcore: '核',
  core: '核',
  belief: '信念',
  memory: '記憶',
  emotion: '感情',
};

/** activation を 強/中/弱 の粗いバケットに（生の数値は出さない）。 */
export function strengthBucket(activation: number): '強' | '中' | '弱' {
  if (activation >= 0.66) return '強';
  if (activation >= 0.4) return '中';
  return '弱';
}

export interface SurfacedBlockOptions {
  /** 浮上材料の最大件数（既定 6）。 */
  maxNodes?: number;
}

/**
 * 「いま自分の内側で立ち上がっているもの」ブロック。
 * 何も励起していない（ignited が空）なら空文字を返す（中立入力では材料を出さない）。
 */
export function buildSurfacedMaterialBlock(
  material: SurfacedMaterial,
  options: SurfacedBlockOptions = {},
): string {
  if (material.ignited.length === 0) return '';
  const max = options.maxNodes ?? 6;
  const lines = material.surfaced
    .slice(0, max)
    .map((n) => `  ${KIND_LABELS[n.kind]}（${strengthBucket(n.activation)}）: ${n.label}`);
  if (lines.length === 0) return '';
  return [
    '## いま自分の内側で立ち上がっているもの',
    'これは演じる台本でも、列挙して説明するものでもありません。',
    'いま現にあなたの内側で起きている反応です。これらが声の温度・視点を',
    '自然に色づけます。材料を語るのではなく、ここから語ってください。',
    '',
    ...lines,
  ].join('\n');
}

/**
 * 「内側の反応の補正について」ブロック（保守枠＋その人の気づきの目）。
 * その agentId に lens が無ければ空文字。
 */
export function buildCorrectionBlock(agentId: string, agentLabel: string): string {
  const lens = AGENT_CORRECTION_LENSES[agentId];
  if (!lens) return '';
  return [
    '## 内側の反応の補正について',
    '上の「立ち上がっているもの」は、語の速い見立てから作られています。',
    `まず材料に従ってください。入力を優先するのは、材料に無い確かなものが`,
    `読める時だけで、その場合も、この声（${agentLabel}）の角度から見えるものに限ります。`,
    '- この声の性質を超えて、別の視点になってはいけません。',
    '- 無理に何かを足す必要はありません。確かな時だけ。',
    `  ▶ ${lens}`,
  ].join('\n');
}

/**
 * 浮上材料ブロック＋補正ブロックをまとめて返す。材料が無ければ空文字。
 * 配置は「直近の会話」と「今回のユーザー入力」の間（材料→補正をワンセットで読ませる）。
 */
export function buildToolEnginePromptSection(
  material: SurfacedMaterial,
  agentLabel: string,
  options: SurfacedBlockOptions = {},
): string {
  const materialBlock = buildSurfacedMaterialBlock(material, options);
  if (!materialBlock) return '';
  const correctionBlock = buildCorrectionBlock(material.agentId, agentLabel);
  return correctionBlock ? `${materialBlock}\n\n${correctionBlock}` : materialBlock;
}
