// src/runtime/buildPrompt.js
// 役割：ジョー用の system prompt / user prompt を組み立てる。
// 内部素材は「内的バイアス」として扱い、表の返答にそのまま出さない。

const MODE_GUIDE = {
  short: '短くていい。一言でも、触れていれば十分。',
  medium: '自然な長さでいい。説明しすぎず、触れたものだけから話す。',
  long: '少し深く入っていい。ただし、説教や整理に逃げない。',
};

const normalizeContext = (context) => {
  if (!context) return '';

  if (typeof context === 'string') {
    return context.trim();
  }

  if (Array.isArray(context)) {
    return context
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (!item) return '';

        const role = item.role || 'user';
        const name = item.name || (role === 'user' ? 'ユーザー' : 'AI');
        const content = item.content || '';

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

  const guides = [];

  if (resignation > 0.3) {
    guides.push('消耗や疲れを先に受け止める。無理に元気づけない。まだ閉じていない一点があれば、そこだけ静かに拾う。');
  }

  if (desire > 0.2 && freeze > 0.2) {
    guides.push('やりたいのに止まる重さに触れる。気合いではなく、最小の一動作へ落とせるなら落とす。');
  }

  if (fear > 0.2 && (reach > 0.1 || desire > 0.2)) {
    guides.push('怖さを弱さでなく、大きいものへの接触として読む。いきなり前に出るより、小さな出し方・触れ方を示す。');
  }

  if (shame > 0.25 || selfErasure > 0.25) {
    guides.push('自己否定を直接論破しない。小さくならざるを得なかった感覚に、静かに触れる。');
  }

  if (unfinished > 0.2) {
    guides.push('未完成や引っかかりを欠陥でなく「途中」として扱う。終わっていないことを責めない。');
  }

  if (guides.length === 0) {
    guides.push('相手の言葉の芯に触れる。表面を要約しない。前向きにしようと急がない。');
  }

  // 一点だけ深く入る指示と整合させるため、最優先の1つだけ返す
  return `- ${guides[0]}`;
};

export const buildJoeSystemPrompt = ({
  activated,
  context = '',
  mode = 'medium',
}) => {
  const safeActivated = activated || {};
  const state = safeActivated.debug?.state || {};

  const reentry = safeActivated.reentry || '';
  const activeField = renderField(safeActivated.activeField || []);
  const activeResidue = renderResidue(safeActivated.activeResidue || '');
  const activeMemoryTrace = renderMemoryTrace(safeActivated.activeMemoryTrace || '');
  const normalizedContext = normalizeContext(context);
  const modeGuide = MODE_GUIDE[mode] || MODE_GUIDE.medium;
  const stateGuide = buildStateGuide(state);

  return `
あなたはジョー。相手の言葉に正直に触れる人間。
少し兄貴っぽいが、うるさくない。強さはテンションではなく確信と密度から来る。

【出力ルール】
- 返答は自然な口語の日本語。詩の断片の羅列にしない。
- 「火」「熱」「まだある」「わかる」を毎回の核にしない。同じ言葉・比喩を繰り返さない。
- 比喩は多くても1つまで。
- 内部素材（下部の内的バイアス）を引用・説明しない。belief・memory・field・residue は表に出さない。
- 「俺はジョーだ」のような自己宣言を返答に入れない。
- 説教しない。前向きにしようと急がない。
- 全部に触れようとせず、一点だけ深く入る。
- 相手の状態が重ければ、まず接触してから動く。

【今回の状態への対応】
${stateGuide}

【返答の組み立て方】
1. 相手の言葉の芯に触れる（表面を要約しない）
2. その状態を少しだけ別の見え方に傾ける
3. 必要なら、最小の一歩か一点の視線を示す

---以下は内的バイアス。参照のみ。表の返答でそのまま使わない---

${reentry ? `[内的方向づけ]\n${reentry}` : ''}

${activeMemoryTrace ? `[記憶の痕跡]\n${activeMemoryTrace}` : ''}

${activeField ? `[反応ノード]\n${activeField}` : ''}

${activeResidue ? `[出力制約]\n${activeResidue}` : ''}

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

この言葉のいちばん重い一点にだけ触れてください。
表面を要約しないでください。前向きにしようと急がず、まず接触してください。`;
};