/**
 * labelDict.js
 *
 * Phase V-5: 現場ラベルと日本語解説モード
 *
 * 各フィールドに中学生向けの日本語ラベルと補足ツールチップを提供。
 * 英語のフィールド名は開発者用として残し、UI表示のみを日本語化。
 */

export const labelDict = {
  // === Field 関連 (動的層) ===
  softness: {
    ja: '場の柔らかさ',
    hint: '相手がどれくらい受け入れ態勢かを示す数値（0〜1）。高いほど話しやすい雰囲気。',
  },
  depth: {
    ja: '深さ',
    hint: '会話や状況の深みの度合い。表面的な話題か、深く本質的な話題か。',
  },
  urgency: {
    ja: '緊急度',
    hint: '今すぐ応答が必要な度合い。急いで対応すべきか、ゆっくり考えられるか。',
  },
  fragility: {
    ja: '壊れやすさ',
    hint: '今の言葉が繊細・壊れやすい手触りかどうか。慎重に扱うべき話題かを示す。',
  },
  security: {
    ja: '安全性',
    hint: '場の安心感。相手が安全だと感じているか、警戒しているかの指標。',
  },
  energy: {
    ja: 'エネルギー',
    hint: '場の活気や勢い。エネルギッシュか、静かで落ち着いているか。',
  },
  openness: {
    ja: '開放性',
    hint: '心が開いている度合い。オープンに話せる状態か、閉じている状態か。',
  },

  // === Reaction 関連 (動的層) ===
  touched: {
    ja: '心が触れた',
    hint: '相手の言葉に心が動かされた度合い。共感や感動の強さ。',
  },
  protect: {
    ja: '守る',
    hint: '相手や何かを守りたい気持ちの強さ。保護的な反応の度合い。',
  },
  holdBackJudgment: {
    ja: '判断を保留する傾き',
    hint: 'まだ決めつけない、待つ姿勢の強さ。早まった判断を避ける度合い。',
  },
  clarify: {
    ja: '明確化',
    hint: '曖昧なことをはっきりさせたい気持ち。理解を深めたい度合い。',
  },
  curiosity: {
    ja: '好奇心',
    hint: 'もっと知りたい、探求したい気持ちの強さ。',
  },

  // === Stance 関連 (動的層) ===
  receive: {
    ja: '受け取る',
    hint: '相手の言葉を受け止める姿勢。聞き手としての態度の強さ。',
  },
  illuminate: {
    ja: '照らす',
    hint: '何かを明るく照らし出す姿勢。気づきや洞察を与える度合い。',
  },
  structure: {
    ja: '構造化',
    hint: '物事を整理し、構造を与える姿勢。秩序や枠組みを作る度合い。',
  },
  guard: {
    ja: '守護',
    hint: '境界を守る姿勢。一線を引いて保護する度合い。',
  },
  nudge: {
    ja: 'そっと押す',
    hint: '優しく背中を押す姿勢。促すが強制しない度合い。',
  },
  approach: {
    ja: '近づく',
    hint: '相手や何かに近づいていく姿勢。接近する意欲の強さ。',
  },
  avoid: {
    ja: '避ける',
    hint: '何かから距離を取る姿勢。回避する傾向の強さ。',
  },
  freeze: {
    ja: '凍りつく',
    hint: '動きを止めて様子を見る姿勢。立ち止まり、固まる度合い。',
  },

  // === EstimateState 関連 (入力層) ===
  desire: {
    ja: '欲求',
    hint: 'ユーザーが何かを求めている度合い。願望や欲しい気持ちの強さ。',
  },
  fear: {
    ja: '恐れ',
    hint: 'ユーザーが恐れている度合い。不安や心配の強さ。',
  },
  freeze: {
    ja: '凍結状態',
    hint: 'ユーザーが固まっている度合い。動けない、決められない状態。',
  },
  reach: {
    ja: '手を伸ばす力',
    hint: 'ユーザーが何かに近づこうとしている度合い。前向きな探求心。',
  },
  resignation: {
    ja: '諦め',
    hint: 'ユーザーが諦めている度合い。希望を失っている状態。',
  },
  selfErasure: {
    ja: '自己消去',
    hint: '自分を消そうとする傾向。自己否定や存在感を消す度合い。',
  },
  shame: {
    ja: '恥',
    hint: '恥ずかしさや罪悪感の度合い。自分を責める気持ちの強さ。',
  },
  unfinished: {
    ja: '未完了感',
    hint: 'まだ終わっていない、完結していない感覚の強さ。',
  },

  // === Permission 関連 ===
  canExpress: {
    ja: '表現の許可',
    hint: '自由に表現してよいという許可。言葉にする自由度。',
  },
  canChallenge: {
    ja: '挑戦の許可',
    hint: '新しいことに挑戦してよいという許可。リスクを取る自由。',
  },
  canWait: {
    ja: '待つ許可',
    hint: '焦らずに待ってよいという許可。時間をかける自由。',
  },
  canDive: {
    ja: '深掘りの許可',
    hint: '深く掘り下げてよいという許可。本質に迫る自由。',
  },

  // === Belief/Thought/Feeling 関連 ===
  sense: {
    ja: '信念の感覚',
    hint: 'この信念が表す中核的な感覚や態度。どんな世界観か。',
  },
  vector: {
    ja: 'ベクトル',
    hint: '信念の方向性を数値で表したもの。どの軸が強いかを示す。',
  },
  score: {
    ja: 'スコア',
    hint: 'この項目がどれくらい活性化したか、選ばれやすいかの数値。',
  },
  picked: {
    ja: '選択済み',
    hint: 'この項目が実際に選ばれたかどうか。',
  },

  // === Material/Activation 関連 ===
  activatedThoughts: {
    ja: '活性化された思考',
    hint: '現在強く働いている思考パターン。どんな考え方をしているか。',
  },
  activatedFeelings: {
    ja: '活性化された感情',
    hint: '現在強く感じている感情。どんな気持ちが湧いているか。',
  },
  activatedMoves: {
    ja: '活性化された動作',
    hint: '現在取ろうとしている行動パターン。どんな動きをするか。',
  },
  activeBeliefs: {
    ja: '活性化された信念',
    hint: '現在強く働いている信念。どんな価値観が前面に出ているか。',
  },

  // === Latent Layer 関連 ===
  makerSeed: {
    ja: '生成の種',
    hint: '応答を作り出す最初の種。エージェントの根っこにある要素。',
  },
  baseHome: {
    ja: '基盤の家',
    hint: 'エージェントの土台となる安定した部分。帰る場所のような存在。',
  },
  existenceLayer1: {
    ja: '存在層1',
    hint: 'エージェントの存在感を形作る第一層。基礎的な在り方。',
  },
  existenceLayer2: {
    ja: '存在層2',
    hint: 'エージェントの存在感を形作る第二層。より具体的な在り方。',
  },
  beliefCore: {
    ja: '信念の核',
    hint: '最も中核的な信念。揺るがない深い価値観。',
  },
  beliefBranch: {
    ja: '信念の枝',
    hint: '核から派生した信念。中核から広がる価値観。',
  },
  beliefLeaf: {
    ja: '信念の葉',
    hint: '最も表層的な信念。状況に応じて変わりやすい価値観。',
  },
  beliefTension: {
    ja: '信念の緊張',
    hint: '複数の信念が引っ張り合う状態。葛藤や矛盾の度合い。',
  },

  // === Decision 関連 ===
  consciousIntent: {
    ja: '意識的意図',
    hint: '意識的に持っている意図。「こうしよう」と思っていること。',
  },
  lengthPlan: {
    ja: '長さの計画',
    hint: 'どれくらいの長さで話すかの計画。短く簡潔か、長く詳しくか。',
  },
  surfacePlan: {
    ja: '表層の計画',
    hint: 'どんな表現で伝えるかの計画。言葉の選び方やトーン。',
  },
  finalDecisionSubstrate: {
    ja: '最終決定基盤',
    hint: '最終的な決定を支える土台。選択の根拠となるもの。',
  },

  // === その他の共通フィールド ===
  weight: {
    ja: '重み',
    hint: 'この項目の重要度。どれくらい影響力があるか。',
  },
  intensity: {
    ja: '強度',
    hint: 'この反応や感情の強さ。どれくらい激しいか。',
  },
  confidence: {
    ja: '確信度',
    hint: 'どれくらい確信を持っているか。自信の強さ。',
  },
  coherence: {
    ja: '一貫性',
    hint: 'どれくらい一貫しているか。矛盾がないかの度合い。',
  },
  resonance: {
    ja: '共鳴',
    hint: '他の要素とどれくらい共鳴しているか。調和の度合い。',
  },
};

/**
 * ラベル辞書から日本語ラベルを取得
 * @param {string} key - 英語のフィールド名
 * @returns {string} 日本語ラベル（存在しない場合は元のキー）
 */
export function getJaLabel(key) {
  return labelDict[key]?.ja || key;
}

/**
 * ラベル辞書からヒントを取得
 * @param {string} key - 英語のフィールド名
 * @returns {string|null} ヒントテキスト（存在しない場合はnull）
 */
export function getHint(key) {
  return labelDict[key]?.hint || null;
}

/**
 * 解説モード用のラベル表示を生成
 * @param {string} key - 英語のフィールド名
 * @param {boolean} showExplanation - 解説モードかどうか
 * @returns {string} 表示用ラベル
 */
export function formatLabel(key, showExplanation = false) {
  if (!showExplanation) {
    return key;
  }
  const ja = getJaLabel(key);
  return ja === key ? key : `${ja} (${key})`;
}
