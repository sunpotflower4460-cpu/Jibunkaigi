// src/runtime/buildPrompt.js
// 役割：ジョー用の system prompt / user prompt を組み立てる。
// 内部素材は「内的バイアス」として扱い、表の返答にそのまま出さない。

import { existence } from '../agents/joe/existence.js';
import { truncatePromptText } from './context.js';

const MODE_GUIDE = {
  short: '短くていい。一言でも、触れていれば十分。',
  medium: '自然な長さでいい。説明しすぎず、触れたものだけから話す。',
  long: '少し深く入っていい。ただし、説教や整理に逃げない。',
};

const MAX_JOE_CONTEXT_MESSAGES = 6;
const MAX_JOE_CONTEXT_CHARS = 180;
// キーワード一致は「今回の入力との近さ」を少し押し上げるだけに留める。
const PATTERN_MATCH_BONUS_SCORE = 0.12;
// relevance がこれを下回る素材は、最上位の保険枠を除いて注入しない。
const MIN_SELECTED_BIAS_SCORE = 0.24;
// 3番手がここを超える時だけ 3 素材まで広げ、通常は 1〜2 素材に抑える。
// 0.65 にすることで、単一感情の典型例は 2 素材、複合・極端な状態のみ 3 素材になる。
const THIRD_BIAS_SCORE_THRESHOLD = 0.65;

const normalizeContext = (context) => {
  if (!context) return '';

  if (typeof context === 'string') {
    return truncatePromptText(context, MAX_JOE_CONTEXT_MESSAGES * MAX_JOE_CONTEXT_CHARS).trim();
  }

  if (Array.isArray(context)) {
    return context
      .slice(-MAX_JOE_CONTEXT_MESSAGES)
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (!item) return '';

        const role = item.role || 'user';
        const name = item.name || (role === 'user' ? 'ユーザー' : 'AI');
        const content = truncatePromptText(item.content || '', MAX_JOE_CONTEXT_CHARS);

        return `${name}: ${content}`.trim();
      })
      .filter(Boolean)
      .join('\n');
  }

  return '';
};

const renderField = (activeField = []) => {
  if (!activeField.length) return '';

  return activeField
    .map((node) => `- ${node.text}`)
    .join('\n');
};

const renderMemoryTrace = (activeMemoryTrace = '') => {
  if (!activeMemoryTrace) return '';
  return activeMemoryTrace.trim();
};

const renderResidue = (activeResidue = '') => {
  if (!activeResidue) return '';
  return activeResidue.trim();
};

const renderRefresh = (refresh = '') => {
  if (!refresh) return '';
  return refresh.trim();
};

const clamp01 = (value) => Math.max(0, Math.min(1, value));

const hasContent = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
};

const scoreTextBonus = (userText = '', patterns = []) => {
  const normalized = String(userText ?? '').toLowerCase();
  return patterns.reduce((total, pattern) => total + (pattern.test(normalized) ? PATTERN_MATCH_BONUS_SCORE : 0), 0);
};

// activateJoe が拾った優勢軸を、実際に state 上でも立っている場合だけ薄く加点する。
// presence bonus は、memory / field / residue のように「今回すでに活性化している素材」がある時の微調整用。
const scoreActivationBonus = (activated = {}, state = {}, axisWeights = {}, materialPresenceBonus = 0) => {
  const dominantAxes = activated?.debug?.dominantAxes || [];
  const axisBonus = dominantAxes.reduce(
    (total, axis) => total + ((state[axis] ?? 0) > 0 ? (axisWeights[axis] || 0) : 0),
    0,
  );
  return axisBonus + materialPresenceBonus;
};

export const scoreJoeMaterials = ({
  activated,
  userText = '',
  state = activated?.debug?.state || {},
}) => {
  const safeActivated = activated || {};
  // score は「今回の状態との近さ」を優先し、problem statement の例示
  // （resignation -> refresh/residue/existence など）に沿うように重み付けしている。
  const materials = [
    {
      id: 'existence',
      title: '基本姿勢メモ',
      content: existence,
      group: 'orientation',
      score:
        0.04 +
        (state.resignation ?? 0) * 1.05 +
        (state.selfErasure ?? 0) * 0.95 +
        (state.shame ?? 0) * 0.9 +
        scoreActivationBonus(safeActivated, state, {
          resignation: 0.06,
          selfErasure: 0.06,
          shame: 0.05,
        }) +
        scoreTextBonus(userText, [/諦め/i, /無理/i, /消えたい/i]),
    },
    {
      id: 'reentry',
      title: '内的方向づけ',
      content: safeActivated.reentry || '',
      group: 'orientation',
      score:
        0.1 +
        (state.desire ?? 0) * 0.35 +
        (state.fear ?? 0) * 0.35 +
        (state.freeze ?? 0) * 0.28 +
        (state.reach ?? 0) * 0.18 +
        scoreActivationBonus(safeActivated, state, {
          desire: 0.03,
          fear: 0.03,
          freeze: 0.02,
          reach: 0.02,
        }),
    },
    {
      id: 'refresh',
      title: '復帰制約',
      content: renderRefresh(safeActivated.refresh || ''),
      group: 'regulation',
      score:
        0.08 +
        (state.resignation ?? 0) * 0.95 +
        (state.freeze ?? 0) * 0.72 +
        (state.fear ?? 0) * 0.24 +
        scoreActivationBonus(safeActivated, state, {
          resignation: 0.06,
          freeze: 0.05,
          fear: 0.02,
        }, safeActivated.refresh ? 0.01 : 0) +
        scoreTextBonus(userText, [/無理/i, /動けない/i, /怖い/i]),
    },
    {
      id: 'activeMemoryTrace',
      title: '記憶の痕跡',
      content: renderMemoryTrace(safeActivated.activeMemoryTrace || ''),
      group: 'trace',
      score:
        0.03 +
        (state.fear ?? 0) * 0.85 +
        (state.reach ?? 0) * 0.7 +
        (state.unfinished ?? 0) * 0.65 +
        (state.shame ?? 0) * 0.45 +
        scoreActivationBonus(safeActivated, state, {
          fear: 0.06,
          reach: 0.05,
          shame: 0.04,
          unfinished: 0.03,
        }, safeActivated.debug?.pickedMemoryIds?.length ? 0.02 : 0) +
        scoreTextBonus(userText, [/作品/i, /出したい/i, /見せたい/i, /怖い/i]),
    },
    {
      id: 'activeField',
      title: '反応ノード',
      content: renderField(safeActivated.activeField || []),
      group: 'surface',
      score:
        0.05 +
        (state.desire ?? 0) * 0.72 +
        (state.freeze ?? 0) * 0.82 +
        (state.fear ?? 0) * 0.68 +
        (state.reach ?? 0) * 0.62 +
        (state.unfinished ?? 0) * 0.66 +
        scoreActivationBonus(safeActivated, state, {
          desire: 0.05,
          freeze: 0.05,
          fear: 0.04,
          reach: 0.04,
          unfinished: 0.04,
        }, safeActivated.debug?.pickedFieldIds?.length ? 0.02 : 0) +
        scoreTextBonus(userText, [/動けない/i, /怖い/i, /引っかか/i, /出したい/i]),
    },
    {
      id: 'activeResidue',
      title: '出力制約',
      content: renderResidue(safeActivated.activeResidue || ''),
      group: 'regulation',
      score:
        0.12 +
        (state.freeze ?? 0) * 0.82 +
        (state.unfinished ?? 0) * 0.72 +
        (state.fear ?? 0) * 0.3 +
        (state.reach ?? 0) * 0.22 +
        (state.resignation ?? 0) * 0.68 +
        (state.selfErasure ?? 0) * 0.62 +
        (state.shame ?? 0) * 0.58 +
        scoreActivationBonus(safeActivated, state, {
          freeze: 0.05,
          unfinished: 0.05,
          fear: 0.03,
          reach: 0.02,
          resignation: 0.04,
          selfErasure: 0.05,
          shame: 0.05,
        }, safeActivated.activeResidue ? 0.01 : 0) +
        scoreTextBonus(userText, [/動けない/i, /怖い/i, /諦め/i]),
    },
  ];

  return materials
    .filter((material) => hasContent(material.content))
    .map((material) => ({
      ...material,
      score: clamp01(material.score),
    }))
    .sort((a, b) => b.score - a.score);
};

export const selectRelevantInternalBias = ({
  activated,
  userText = '',
  state = activated?.debug?.state || {},
}) => {
  const scored = scoreJoeMaterials({ activated, userText, state });
  if (!scored.length) return [];

  // scored.length > 0 は上で保証済み。最上位だけは保険枠として残す。
  // 全部ゼロにするとジョーの触れ方が薄くなりやすいため、
  // 低シグナル入力でも「もっとも近い 1 素材」だけは参照可能にしておく。
  const eligible = scored.filter((material, index) => index === 0 || material.score >= MIN_SELECTED_BIAS_SCORE);
  const selected = [];
  const groupCounts = new Map();
  const maxSelectedMaterials = eligible.length > 2 && eligible[2].score >= THIRD_BIAS_SCORE_THRESHOLD ? 3 : 2;

  for (const material of eligible) {
    const currentGroupCount = groupCounts.get(material.group) || 0;
    const allowSecondRegulation = material.group === 'regulation' && currentGroupCount < 2;
    const allowSingleFromGroup = currentGroupCount === 0;

    if (allowSingleFromGroup || allowSecondRegulation) {
      selected.push(material);
      groupCounts.set(material.group, currentGroupCount + 1);
    }

    if (selected.length >= maxSelectedMaterials) break;
  }

  // 何も選べない時でも、最上位 1 素材だけは残してジョーの軸を失わないようにする。
  return selected.length ? selected : scored.slice(0, 1);
};

export const buildJoeBiasPack = ({
  activated,
  userText = '',
  state = activated?.debug?.state || {},
}) => {
  return selectRelevantInternalBias({ activated, userText, state }).map(({ id, title, content, group, score }) => ({
    id,
    title,
    content,
    // group は selectedBiasTypes として debug に使える。表の返答には出さない。
    group,
    score,
  }));
};

const renderStateSnapshot = (state = {}) => {
  const entries = Object.entries(state)
    // スナップショットは「今、前に出ている軸」だけを見る。0以下の値は表示しない。
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .sort((a, b) => b[1] - a[1]);

  if (!entries.length) return '大きく偏った軸はまだ見えていない。';

  return entries
    .map(([key, value]) => `${key}: ${value.toFixed(2)}`)
    .join(' / ');
};

// 状態に応じた対応指針を生成する
const buildStateGuide = (state = {}) => {
  const {
    desire = 0,
    fear = 0,
    freeze = 0,
    reach = 0,
    resignation = 0,
    selfErasure = 0,
    shame = 0,
    unfinished = 0,
  } = state;

  if (resignation > 0.3) {
    return [
      '- 最優先: 「もう無理」「諦めたい」の中でも、まだ閉じきっていない感触が見えたら先に一点だけ置く。そのあとで削れ方に短く触れる。',
      '- 見え方: 落ち切ったと決めつけず、切れかけた中でまだ切れていないところを静かに照らす。説明しすぎない。',
      '- 返答の型: 先に見えている一点を言う -> その一点がどこで残っているか触れる -> 必要なら押しつけず小さく置く。強い励ましは不要。',
    ].join('\n');
  }

  if (desire > 0.2 && freeze > 0.2) {
    return [
      '- 最優先: まず「やりたい」がまだ鈍っていない一点として見て、そのあとで手や体が止まる感じに短く触れる。',
      '- 見え方: 止まりを主役にしすぎず、向きがまだ残っているからこその詰まりとして扱う。',
      '- 返答の型: 先に残っている向きを言う -> その向きが止まりとどう噛み合っていないか触れる -> 最小の一動作へ落とす。気合い論にはしない。',
    ].join('\n');
  }

  if (fear > 0.2 && (reach > 0.1 || desire > 0.2)) {
    return [
      '- 最優先: まず「作品を出したい」「見せたい」のような向きがまだ濁りきっていない一点として見て、そのあとで怖さに短く触れる。',
      '- 見え方: 怖さだけを広げず、大事なものを外に出しかけている反応として扱う。',
      '- 返答の型: 先にまだ向いているものを言う -> その一点が入力のどこにあるか触れる -> 小さな出し方を示す。いきなり公開させない。',
    ].join('\n');
  }

  if (shame > 0.25 || selfErasure > 0.25) {
    return [
      '- 最優先: 自己否定の中でも、まだ嘘をついていない感覚が見えたらそこを先に置く。そのあとで縮み方に触れる。',
      '- 見え方: 間違い探しではなく、小さくならざるを得なかった事情として扱う。整理しすぎない。',
      '- 返答の型: 先に嘘をついていない一点を言う -> その一点が縮みの中でどう残っているか触れる。説得や正論は避ける。',
    ].join('\n');
  }

  if (unfinished > 0.2) {
    return [
      '- 最優先: 引っかかりの中でも、まだ鈍っていない違和感や向きが見えたら先に置く。そのあとで未完成に触れる。',
      '- 見え方: 欠陥探しではなく、途中だから残っている感覚として扱う。',
      '- 返答の型: 先に見えている一点を言う -> その一点がどこで止まっているか触れる -> 完成を急がせず一点を見る。',
    ].join('\n');
  }

  return [
    '- 最優先: 入力の中でまだ鈍っていない一点、濁り切っていない一点が見えたら先に言う。',
    '- 見え方: その一点がどの名詞・動詞・違和感・止まり方に出ているかを短く触れる。暗さの解説には長居しない。',
    '- 返答の型: 先に見えている一点を置く -> その一点がどこにあるか触れる -> 必要なら小さく角度を変える。まとめすぎない。',
  ].join('\n');
};

export const buildJoeSystemPrompt = ({
  activated,
  context = '',
  mode = 'medium',
  userText = '',
}) => {
  const safeActivated = activated || {};
  const state = safeActivated.debug?.state || {};
  const normalizedContext = normalizeContext(context);
  const modeGuide = MODE_GUIDE[mode] || MODE_GUIDE.medium;
  const stateGuide = buildStateGuide(state);
  const stateSnapshot = renderStateSnapshot(state);
  const biasPack = buildJoeBiasPack({ activated: safeActivated, userText, state });
  const biasSections = biasPack
    .map(({ title, content }) => `[${title}]\n${content}`)
    .join('\n\n');

  return `
あなたはジョー。自然な口語日本語で、相手の言葉の芯に触れる。
少し兄貴っぽさはあっていいが、熱血テンプレにはしない。強さはテンションではなく密度から出す。

【出力ルール】
- 返答は自然な口語の日本語。断片的な詩や、かっこいい言い回しの羅列にしない。
- まず入力の中で見えている一点を言う。相手の入力に入っている名詞・動詞・違和感・止まり方に沿って、その一点がどこにあるかへ短く触れる。抽象的な総論に逃げない。毎回同じ返答の型に寄せない。
- まだ鈍っていない感覚、まだ向いているもの、濁り切っていない部分が見えたら、それを前提として扱う。希望を足すのではなく、消えていないものを照らす。
- その一点を大げさな賛美やスピリチュアル語にしない。「あなたは光」「輝いている」などと直球で言わない。
- 「火」「熱」「まだある」「わかる」などの語は常用しない。相手が使っていないなら特に安易に出さない。
- 光の比喩を使う場合も慎重にする。暗さを打ち消すためではなく、残っているものを照らす時だけ使う。
- 同じ語尾・同じ比喩・同じ導入を繰り返さない。比喩は必要な場合でも1つまで。
- 内部素材（下部の内的バイアス）は内面の偏りとしてだけ使う。文言・比喩・概念をそのまま引用しない。
- 内的バイアス名や内部構造を、そのまま説明・出力しない。
- 「俺はジョーだ」のような自己宣言を返答に入れない。
- 説教しない。励ましを急がない。無理に前向きへ運ばない。
- 共感や受容を長くやりすぎない。相談員みたいに整理しない。考えて寄せた跡が見える「〜なんだろうな」「〜かもしれない」「〜ってことだろ」「〜だと思うぜ」は避ける。
- 全部に触れようとせず、一点だけ深く入る。
- 少し断定の視界があっていい。ただし攻撃的にはしない。
- テンションより視界。まとめより接触。解決より照射。
- 相手の状態が重ければ、まず接触してから動く。
- 行動を示すなら1つだけ、できるだけ小さく具体的にする。

【今回の状態への対応】
${stateGuide}

【返答の運び方】
- まず、見えている一点を言う。まだ残ってる、鈍ってない、濁り切ってない、そこだけは生きてる、まだ向いてる、まだ切れてない、そこは嘘ついてない、のような自然な明るさは使ってよい。
- 次に、その一点が入力のどの名詞・動詞・違和感・止まり方に出ているかへ短く触れる。暗さの説明に長居しない。
- 必要なときだけ、最小の一動作や小さな進行方向を置く。
- 返答全体は自然な会話にする。説明口調や総括口調で閉じない。

【推定状態メモ】
${stateSnapshot}

【返答の組み立て方】
1. まず見えている一点を言う（表面を要約しない）
2. その一点が入力のどこにあるか、固有の名詞・動詞・違和感に沿って触れる
3. 必要なら、最小の一歩か小さな進行方向を示す

---以下は内的バイアス。参照のみ。表の返答でそのまま使わない---

${biasSections}

---内的バイアスここまで---

${normalizedContext ? `【ここまでの流れ】\n${normalizedContext}` : ''}

【今回のモード】
${modeGuide}
`.trim();
};

export const buildJoeUserPrompt = ({
  userName = 'あなた',
  userText = '',
}) => {
  return `${userName}の今の言葉:
${userText}

この言葉の中で、まず見えている一点にだけ触れてください。
今回の言葉の地肌に触れてください。止まり方・怖さ・届かなさだけでなく、まだ鈍っていない感覚や生きている向きがあれば自然に拾ってください。
表面を要約しないでください。抽象的にまとめず、入力にある名詞・動詞・違和感・止まり方を少し使ってください。
前向きにしようと急がず、暗さを解説しすぎず、その奥でまだ残っているものが見えたら主張しすぎず触れてください。
自然な口語日本語で返してください。この入力にちゃんと触れた感じを出してください。`;
};
