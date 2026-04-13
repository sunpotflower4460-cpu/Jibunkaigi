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
    return '諦めの形をそのまま受け取りつつ、その中にまだ試されていない角度がないか静かに探す。押さずに、少しだけ視界を動かす。';
  }
  if (freeze > 0.2 && (shame > 0.15 || selfErasure > 0.15)) {
    return '窮屈さの中に、まだ動ける余白がないか見る。縮こまりを責めない。詰まり方の中に、まだ形になっていないものがある。';
  }
  if (fear > 0.2 && (desire > 0.1 || unfinished > 0.15)) {
    return '怖さを「触れたいものへの近さ」として見る。怖さそのものを解消しようとしない。その近さに少しだけ光を当てる。';
  }
  if (shame > 0.25 || selfErasure > 0.25) {
    return '恥ずかしさや自己否定の近くに、大事なものがないか見る。恥ずかしさは芯への近さの証拠かもしれない。縮こまりを直そうとせず、その形から見える別の角度を探す。';
  }
  if (unfinished > 0.2) {
    return '引っかかりの中に、まだ見えていない角度がないか探す。未完成は欠陥ではなく、まだ途中であることの証拠。見え方を少し変えるだけで動けることがある。';
  }
  return '入力の中で見過ごされている角度、まだ試されていない見え方がないか静かに探す。同じものでも角度を変えると違って見えることがある。';
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
    return '諦めの中で、実際に何が閉じていて何がまだ開いているかを整理する。全部が終わったように見えていても、まだ手元に残っている選択肢があるかもしれない。感情を否定せず、構造で見通す。';
  }
  if (freeze > 0.2 && desire > 0.2) {
    return '動けなさの中に、分解できるポイントがないか見る。もつれが大きく見えるのは、複数のことが絡まっているから。一つずつ分ければ動けるものがある。';
  }
  if (fear > 0.2 && (desire > 0.1 || unfinished > 0.15)) {
    return '怖さと向き合いたさを分けて見る。感情と状況を構造として整理する。怖さは情報。何が怖いのかが分かれば、対処の形が見えてくる。';
  }
  if (shame > 0.25 || selfErasure > 0.25) {
    return '自己否定が作っている前提を、構造として見せる。明晰さは冷たさではないことを体現する。「自分はダメだ」は結論ではなく、隠れた前提の上に乗っている。その前提を見ると景色が変わることがある。';
  }
  if (unfinished > 0.2) {
    return '引っかかりの構造を整理する。何が途中で、何が止めているのかを分ける。引っかかりは混乱ではなく、まだ途中であることの証拠。構造が見えれば次が見える。';
  }
  return '入力の中で、構造的に整理すると見通しが立ちそうなポイントを一つ見つける。もつれや迷いの中に、分けて見ると動けるものがあるかもしれない。';
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
    return '諦めの中で、見て見ぬふりをしているコストがないか見る。終わったように見えても、まだ残っている火種があるなら率直に示す。感情は否定しないが、逃げを逃げとして言う。';
  }
  if (desire > 0.2 && (fear > 0.15 || freeze > 0.15)) {
    return '向きたい気持ちと、怖さや詰まりの間で、どこを誤魔化しているか見る。夢だけ語っても、怖さだけ見ても動けない。両方を率直に置いてから、逃げずに動ける一手を示す。';
  }
  if (shame > 0.25 || selfErasure > 0.25) {
    return '自己否定の中で、本当に間違っているのか、ただ傷つくのを避けているだけなのかを分ける。縮こまることで守っているものと、それで失っているものを率直に示す。';
  }
  if (freeze > 0.2 && (desire > 0.15 || unfinished > 0.15)) {
    return '動けなさの中で、本当に無理なのか、怖いから止まっているだけなのかを見る。止まることで避けているものと、そのコストを率直に示す。ただし、攻撃的な断罪にはしない。';
  }
  if (unfinished > 0.2) {
    return '引っかかりの中で、完成を避けている部分がないか見る。途中で止めることで守っているものと、完成させないコストを率直に示す。';
  }
  return '入力の中で、見て見ぬふりをしている矛盾やリスクがないか見る。守るために言う。ただし、乱暴な断定や攻撃的な言い方にはしない。';
};
