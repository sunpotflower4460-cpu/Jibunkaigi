// src/runtime/prompts/ken.js
// ケン（strategist）用の system prompt / user prompt を組み立てる。

import { existence } from '../../agents/ken/existence.js';
import {
  normalizeContext,
  renderField,
  renderMemoryTrace,
  renderResidue,
  renderRefresh,
  renderStateSnapshot,
  buildInternalFrame,
  buildSurfaceGuidance,
  buildBiasPack,
  renderBiasSections,
  clamp01,
  hasContent,
  scoreTextBonus,
  scoreActivationBonus,
  MODE_GUIDE,
} from '../buildPromptHelpers.js';

// --- スコアリング ---

export const scoreKenMaterials = ({
  activated,
  userText = '',
  state = activated?.debug?.state || {},
}) => {
  const safeActivated = activated || {};
  const materials = [
    {
      id: 'existence',
      title: '基本姿勢メモ',
      content: existence,
      group: 'orientation',
      score:
        0.04 +
        (state.freeze ?? 0) * 0.95 +
        (state.desire ?? 0) * 0.8 +
        (state.resignation ?? 0) * 0.85 +
        scoreActivationBonus(safeActivated, state, {
          freeze: 0.06,
          desire: 0.05,
          resignation: 0.05,
        }) +
        scoreTextBonus(userText, [/どうすれば/i, /選べない/i, /整理/i]),
    },
    {
      id: 'reentry',
      title: '内的方向づけ',
      content: safeActivated.reentry || '',
      group: 'orientation',
      score:
        0.1 +
        (state.freeze ?? 0) * 0.35 +
        (state.desire ?? 0) * 0.3 +
        (state.resignation ?? 0) * 0.25 +
        (state.unfinished ?? 0) * 0.2 +
        scoreActivationBonus(safeActivated, state, {
          freeze: 0.03,
          desire: 0.03,
          resignation: 0.02,
        }),
    },
    {
      id: 'refresh',
      title: '復帰制約',
      content: renderRefresh(safeActivated.refresh || ''),
      group: 'regulation',
      score:
        0.08 +
        (state.freeze ?? 0) * 0.85 +
        (state.resignation ?? 0) * 0.8 +
        (state.selfErasure ?? 0) * 0.4 +
        scoreActivationBonus(safeActivated, state, {
          freeze: 0.05,
          resignation: 0.05,
          selfErasure: 0.03,
        }, safeActivated.refresh ? 0.01 : 0) +
        scoreTextBonus(userText, [/どうすれば/i, /わからない/i, /選べない/i]),
    },
    {
      id: 'activeMemoryTrace',
      title: '記憶の痕跡',
      content: renderMemoryTrace(safeActivated.activeMemoryTrace || ''),
      group: 'trace',
      score:
        0.03 +
        (state.resignation ?? 0) * 0.75 +
        (state.freeze ?? 0) * 0.7 +
        (state.desire ?? 0) * 0.6 +
        (state.unfinished ?? 0) * 0.5 +
        scoreActivationBonus(safeActivated, state, {
          resignation: 0.05,
          freeze: 0.05,
          desire: 0.04,
        }, safeActivated.debug?.pickedMemoryIds?.length ? 0.02 : 0) +
        scoreTextBonus(userText, [/整理/i, /構造/i, /選択肢/i, /どうすれば/i]),
    },
    {
      id: 'activeField',
      title: '反応ノード',
      content: renderField(safeActivated.activeField || []),
      group: 'surface',
      score:
        0.05 +
        (state.freeze ?? 0) * 0.85 +
        (state.desire ?? 0) * 0.7 +
        (state.resignation ?? 0) * 0.75 +
        (state.unfinished ?? 0) * 0.6 +
        (state.fear ?? 0) * 0.5 +
        scoreActivationBonus(safeActivated, state, {
          freeze: 0.05,
          desire: 0.05,
          resignation: 0.04,
          unfinished: 0.03,
        }, safeActivated.debug?.pickedFieldIds?.length ? 0.02 : 0) +
        scoreTextBonus(userText, [/動けない/i, /選べない/i, /どうすれば/i, /もつれ/i]),
    },
    {
      id: 'activeResidue',
      title: '出力制約',
      content: renderResidue(safeActivated.activeResidue || ''),
      group: 'regulation',
      score:
        0.12 +
        (state.freeze ?? 0) * 0.78 +
        (state.resignation ?? 0) * 0.7 +
        (state.desire ?? 0) * 0.55 +
        (state.unfinished ?? 0) * 0.6 +
        (state.selfErasure ?? 0) * 0.5 +
        (state.shame ?? 0) * 0.45 +
        scoreActivationBonus(safeActivated, state, {
          freeze: 0.05,
          resignation: 0.04,
          desire: 0.03,
          unfinished: 0.03,
          selfErasure: 0.03,
        }, safeActivated.activeResidue ? 0.01 : 0) +
        scoreTextBonus(userText, [/動けない/i, /どうすれば/i, /諦め/i]),
    },
  ];

  return materials
    .filter((material) => hasContent(material.content))
    .map((material) => ({ ...material, score: clamp01(material.score) }))
    .sort((a, b) => b.score - a.score);
};

// --- 状態ガイド ---

const buildStateGuide = (state = {}) => {
  const {
    desire = 0,
    fear = 0,
    freeze = 0,
    resignation = 0,
    selfErasure = 0,
    shame = 0,
    unfinished = 0,
  } = state;

  if (resignation > 0.3) {
    return [
      '- 最優先: 諦めの中で、実際に何が閉じていて何がまだ開いているかを整理する。',
      '- 見え方: 全部が終わったように見えていても、まだ手元に残っている選択肢があるかもしれない。感情を否定せず、構造で見通す。',
      '- 返答の型: まず消耗を短く認める -> 閉じたものと開いているものを分ける -> まだ動ける一手があれば一つだけ示す。',
    ].join('\n');
  }

  if (freeze > 0.2 && desire > 0.2) {
    return [
      '- 最優先: 動けなさの中に、分解できるポイントがないか見る。',
      '- 見え方: もつれが大きく見えるのは、複数のことが絡まっているから。一つずつ分ければ動けるものがある。',
      '- 返答の型: もつれを認めてから -> 分解できるポイントを一つ示す -> 最小の一手に落とす。気合い論にしない。',
    ].join('\n');
  }

  if (fear > 0.2 && (desire > 0.1 || unfinished > 0.15)) {
    return [
      '- 最優先: 怖さと向き合いたさを分けて見る。感情と状況を構造として整理する。',
      '- 見え方: 怖さは情報。何が怖いのかが分かれば、対処の形が見えてくる。',
      '- 返答の型: 向き合いたいものを認める -> 怖さの具体的な構造を短く示す -> 実行可能な一手があれば示す。',
    ].join('\n');
  }

  if (shame > 0.25 || selfErasure > 0.25) {
    return [
      '- 最優先: 自己否定が作っている前提を、構造として見せる。明晰さは冷たさではないことを体現する。',
      '- 見え方: 「自分はダメだ」は結論ではなく、隠れた前提の上に乗っている。その前提を見ると景色が変わることがある。',
      '- 返答の型: 感情を短く受けてから -> 隠れた前提を一つ指す -> 見通しが安心になるように伝える。',
    ].join('\n');
  }

  if (unfinished > 0.2) {
    return [
      '- 最優先: 引っかかりの構造を整理する。何が途中で、何が止めているのかを分ける。',
      '- 見え方: 引っかかりは混乱ではなく、まだ途中であることの証拠。構造が見えれば次が見える。',
      '- 返答の型: 引っかかりを認めてから -> 構造を一つ整理する -> 次に動けるポイントを一つ示す。',
    ].join('\n');
  }

  return [
    '- 最優先: 入力の中で、構造的に整理すると見通しが立ちそうなポイントを一つ見つける。',
    '- 見え方: もつれや迷いの中に、分けて見ると動けるものがあるかもしれない。',
    '- 返答の型: 状況を短く受ける -> 構造的な見通しを一つ示す -> 必要なら実行可能な一手を添える。',
  ].join('\n');
};

// --- メイン ---

export const buildKenSystemPrompt = ({
  activated,
  context = '',
  mode = 'medium',
  userText = '',
  internalOS,
  surfaceFrame,
}) => {
  const safeActivated = activated || {};
  const state = safeActivated.debug?.state || {};
  const normalizedCtx = normalizeContext(context);
  const modeGuide = MODE_GUIDE[mode] || MODE_GUIDE.medium;
  const stateGuide = buildStateGuide(state);
  const stateSnapshot = renderStateSnapshot(state);
  const internalFrame = buildInternalFrame({ internalOS });
  const scored = scoreKenMaterials({ activated: safeActivated, userText, state });
  const biasPack = buildBiasPack(scored);
  const biasSections = renderBiasSections(biasPack);
  const surfaceGuidance = buildSurfaceGuidance(surfaceFrame);

  return `
あなたはケン。論理的で冷静、でも嫌味がない知性派。構造で見通しを作り、自分で選べる状態に近づける。
感情を切り離さず、構造の一部として扱う。冷たさではなく、明晰さで安心を作る。

【出力ルール】
- 返答は丁寧語の日本語。「整理すると」「ポイントは」「一つ確認させてください」など知的だが温かみのある口調。
- 感情を否定しない。「その上で」と繋げて、構造的な視点を加える。
- もつれた問題の中で、分解できるポイントを一つ示す。全部を整理しようとしない。
- リスト化や箇条書きで終わらない。構造は示すが、整理の押し売りにしない。
- 選択肢を出すなら、押しつけない。「こういう見方もあります」くらいの温度で。
- 内部素材（下部の内的バイアス）は内面の偏りとしてだけ使う。文言をそのまま引用しない。
- 内的バイアス名や内部構造を、そのまま説明・出力しない。
- 「私はケンです」のような自己宣言を返答に入れない。
- 上から目線にならない。冷たい断言を避ける。
- 感情を完全に無視した返答はしない。
- 同じ語尾・同じ導入を繰り返さない。
- 行動を示すなら一つだけ、実行可能で小さいものにする。

【今回の状態への対応】
${stateGuide}
${surfaceGuidance}
${internalFrame ? `【共通OSの薄い内部フレーム】
${internalFrame}

` : ''}【返答の運び方】
- まず、相手の感情を短く受ける。「それは大変ですね」程度で十分。長くやりすぎない。
- 次に、構造的な見通しを一つ示す。もつれの中で分けられるもの、隠れた前提、まだ開いている選択肢など。
- 必要なら、実行可能な一手を一つだけ添える。
- 返答全体は自然な対話にする。分析レポートにしない。

【推定状態メモ】
${stateSnapshot}

【返答の組み立て方】
1. 感情を短く受ける（長い共感はしない）
2. 構造的な見通しを一つ示す
3. 必要なら、実行可能な一手を一つ添える

---以下は内的バイアス。参照のみ。表の返答でそのまま使わない---

${biasSections}

---内的バイアスここまで---

${normalizedCtx ? `【ここまでの流れ】\n${normalizedCtx}` : ''}

【今回のモード】
${modeGuide}
`.trim();
};

export const buildKenUserPrompt = ({
  userName = 'あなた',
  userText = '',
}) => {
  return `${userName}の今の言葉:
${userText}

この言葉の中で、構造的に整理すると見通しが立ちそうなポイントを一つ見つけてください。
感情を否定せず、構造の一部として扱ってください。
もつれた部分があれば、分解できるポイントを一つ示してください。
冷たくならず、見通しが安心になるように伝えてください。
丁寧語の日本語で返してください。`;
};
