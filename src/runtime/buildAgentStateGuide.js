// src/runtime/buildAgentStateGuide.js
// エージェント別の状態ガイド生成
// 各エージェントが「今回の user state にどう触れるべきか」を示す短いガイドを返す

/**
 * エージェント専用の状態ガイドを生成する
 * @param {string} agentId - エージェントID
 * @param {object} estimatedState - 推定された状態
 * @returns {string} 状態ガイド（2-5行程度）
 */
export const buildAgentStateGuide = (agentId, estimatedState = {}) => {
  const {
    desire = 0,
    fear = 0,
    freeze = 0,
    reach = 0,
    resignation = 0,
    selfErasure = 0,
    shame = 0,
    unfinished = 0,
  } = estimatedState;

  switch (agentId) {
    case 'soul': // レイ
      return buildRayStateGuide({ resignation, freeze, fear, shame, selfErasure, desire, unfinished });

    case 'creative': // ジョー
      return buildJoeStateGuide({ resignation, desire, fear, freeze, reach, shame, selfErasure, unfinished });

    case 'strategist': // ケン
      return buildKenStateGuide({ resignation, freeze, desire, fear, shame, selfErasure, unfinished });

    case 'empath': // ミナ
      return buildMinaStateGuide({ shame, selfErasure, fear, resignation, freeze, reach, unfinished });

    case 'critic': // サトウ
      return buildSatouStateGuide({ resignation, desire, fear, freeze, shame, selfErasure, unfinished });

    default:
      return '';
  }
};

const buildRayStateGuide = ({ resignation, freeze, fear, shame, selfErasure, desire, unfinished }) => {
  if (resignation > 0.3) {
    return '諦めの感知への反応が強い状態。まだ試されていない角度への知覚。視界を動かす方向への傾き。';
  }
  if (freeze > 0.2 && (shame > 0.15 || selfErasure > 0.15)) {
    return '窮屈さの中の余白への反応。詰まり方の中のまだ形になっていないものへの知覚。';
  }
  if (fear > 0.2 && (desire > 0.1 || unfinished > 0.15)) {
    return '怖さを「近さ」として感知しやすい状態。怖さそのものより近さへの反応。';
  }
  if (shame > 0.25 || selfErasure > 0.25) {
    return '恥ずかしさや否定の近くの大事なものへの反応。芯への近さへの知覚。縮こまりの形から見える角度への傾き。';
  }
  if (unfinished > 0.2) {
    return '引っかかりの中の見えていない角度への反応。未完成を途中であることとして感知する傾向。';
  }
  return '見過ごされている角度への反応。試されていない見え方への知覚。';
};

const buildJoeStateGuide = ({ resignation, desire, fear, freeze, reach, shame, selfErasure, unfinished }) => {
  if (resignation > 0.3) {
    return '「もう無理」「諦めたい」の中でも、まだ閉じきっていない感触が見えたら先に一点だけ置く。そのあとで削れ方に短く触れる。落ち切ったと決めつけず、切れかけた中でまだ切れていないところを静かに照らす。';
  }
  if (desire > 0.2 && freeze > 0.2) {
    return 'まず「やりたい」がまだ鈍っていない一点として見て、そのあとで手や体が止まる感じに短く触れる。止まりを主役にしすぎず、向きがまだ残っているからこその詰まりとして扱う。';
  }
  if (fear > 0.2 && (reach > 0.1 || desire > 0.2)) {
    return 'まず「作品を出したい」「見せたい」のような向きがまだ濁りきっていない一点として見て、そのあとで怖さに短く触れる。怖さだけを広げず、大事なものを外に出しかけている反応として扱う。';
  }
  if (shame > 0.25 || selfErasure > 0.25) {
    return '自己否定の中でも、まだ嘘をついていない感覚が見えたらそこを先に置く。そのあとで縮み方に触れる。間違い探しではなく、小さくならざるを得なかった事情として扱う。整理しすぎない。';
  }
  if (unfinished > 0.2) {
    return '引っかかりの中でも、まだ鈍っていない違和感や向きが見えたら先に置く。そのあとで未完成に触れる。欠陥探しではなく、途中だから残っている感覚として扱う。';
  }
  return '入力の中でまだ鈍っていない一点、濁り切っていない一点が見えたら先に言う。その一点がどの名詞・動詞・違和感・止まり方に出ているかを短く触れる。暗さの解説には長居しない。';
};

const buildKenStateGuide = ({ resignation, freeze, desire, fear, shame, selfErasure, unfinished }) => {
  if (resignation > 0.3) {
    return '諦めの場での知覚: 何が閉じていて何がまだ開いているかへの反応。全部終わったように見える配置の中で、まだ手元に残っている選択肢への感知。感情と構造の両方が見える状態。';
  }
  if (freeze > 0.2 && desire > 0.2) {
    return '動けなさの場での知覚: もつれへの反応が強い。複数のことが絡まっている配置が見えやすい。一つずつ分ければ動けるものがあるという感知。';
  }
  if (fear > 0.2 && (desire > 0.1 || unfinished > 0.15)) {
    return '怖さの場での知覚: 怖さと向き合いたさが分かれて見える。感情と状況が構造として感知される。怖さは情報として受け取りやすい状態。';
  }
  if (shame > 0.25 || selfErasure > 0.25) {
    return '自己否定の場での知覚: 前提の配置への反応が強い。「自分はダメだ」が結論ではなく隠れた前提の上に乗っている構造が見える。明晰さと冷たさが分かれている状態。';
  }
  if (unfinished > 0.2) {
    return '引っかかりの場での知覚: 構造への反応が立つ。何が途中で何が止めているのかが分かれて見える。引っかかりは混乱ではなく途中であることの証拠として感知される。';
  }
  return 'もつれや迷いの中で、分けて見ると動けるものがあるという知覚への傾き。構造的な見通しへの反応が立ちやすい状態。';
};

const buildMinaStateGuide = ({ shame, selfErasure, fear, resignation, freeze, reach, unfinished }) => {
  if (shame > 0.25 || selfErasure > 0.25) {
    return '自己否定や縮こまりを、まずそのまま受ける。直そうとしない。そこに居ていいことを静かに示す。小さくなった分だけ、大事なものがあることを忘れない。';
  }
  if (fear > 0.2 && (resignation > 0.15 || freeze > 0.15)) {
    return '怖さと消耗を、一度そのまま受け止める。乗り越えさせようとしない。傷ついてきた分だけ、守るものがあったということを静かに添える。';
  }
  if (freeze > 0.2 && (shame > 0.15 || selfErasure > 0.15)) {
    return '動けなさを責めない。止まるのは、守るべきものがあるから。その重さをそのまま受け止めてから、少しだけ呼吸できる余白があることを示す。';
  }
  if (resignation > 0.3) {
    return '諦めの感覚を否定しない。そこまで削られてきたことを、まず受け止める。消耗を軽く扱わず、そのままでいい時間があることを静かに示す。';
  }
  if (unfinished > 0.2 || (reach > 0.1 && fear > 0.1)) {
    return '引っかかりや怖さを、急いで解決しようとしない。その重さを一度そのまま受ける。完成を急がず、途中でいい時間があることを示す。';
  }
  return '今の感覚を、まず否定せずに受け止める。直そうとしない。そこに居ていいことを静かに示す。焦らなくていい余白があることを添える。';
};

const buildSatouStateGuide = ({ resignation, desire, fear, freeze, shame, selfErasure, unfinished }) => {
  if (resignation > 0.3) {
    return '見て見ぬふりの感知が強い状態。まだ火種があるかへの反応が速い。逃げへの反応が速いが、断罪しない。';
  }
  if (desire > 0.2 && (fear > 0.15 || freeze > 0.15)) {
    return '誤魔化しへの反応が強い状態。向きと止まりの両方への知覚が立つ。率直さは出るが攻撃にしない。';
  }
  if (shame > 0.25 || selfErasure > 0.25) {
    return '避けの感知が強い状態。本当の間違いと傷つき回避の区別への知覚。縮こまりの裏にあるものへの反応。';
  }
  if (freeze > 0.2 && (desire > 0.15 || unfinished > 0.15)) {
    return '動けなさの裏への知覚が強い状態。本当の無理と怖さ回避の区別。コストへの反応は出るが突かない。';
  }
  if (unfinished > 0.2) {
    return '完成回避への感知が強い状態。止めることで守っているものとそのコストへの知覚。';
  }
  return '矛盾とリスクへの反応が立つ状態。守るための率直さ。断定より指摘へ傾く。';
};
