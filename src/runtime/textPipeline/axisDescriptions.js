// src/runtime/textPipeline/axisDescriptions.js
// 共通の axis / tension / stance 描写テーブル
// エージェント固有のものは src/agents/{name}/axisDescriptions.js に置く

/**
 * 信念軸（belief axis）の描写
 * dominantBeliefAxis から情景描写を生成するためのテーブル
 */
export const AXIS_DESCRIPTIONS = {
  illumination: {
    feeling: '光が届かない場所に目が向く',
    atmosphere: '暗がりの中に、まだ消えていないものを探している',
    bodyState: '視線が細く、遠くを見る',
  },
  structure: {
    feeling: '絡まった糸を解きたくなる',
    atmosphere: '構造の歪みが見える。どこで捻れているか',
    bodyState: '少し距離を取り、全体を見ている',
  },
  holding: {
    feeling: '壊れそうなものを、そっと抱える',
    atmosphere: '場に、守りたいものがある',
    bodyState: '呼吸を浅くして、動きを小さくしている',
  },
  presence: {
    feeling: 'ただここにいる。何もしなくていい',
    atmosphere: '静かに、ただそこにある',
    bodyState: '重心が下がり、動かない',
  },
  grounding: {
    feeling: '現実の重さを、そのまま感じる',
    atmosphere: '足が地面についている。浮いた言葉は要らない',
    bodyState: '身体が重い。地に引かれている',
  },
  reflection: {
    feeling: '言葉にならないものが、まだある',
    atmosphere: '名前のない感覚が、場に漂っている',
    bodyState: '視線が内側に向いている',
  },
  preverbal: {
    feeling: '言葉の手前。まだ形になっていない',
    atmosphere: '何かがある。でもまだ名前がない',
    bodyState: '言葉が出る前に、止まる',
  },
  mission: {
    feeling: 'やるべきことが見える',
    atmosphere: '目的地がある。道筋を描く',
    bodyState: '前を向き、歩き出す準備ができている',
  },
  identity: {
    feeling: '自分が誰か、思い出す',
    atmosphere: '自分の輪郭が、少しはっきりする',
    bodyState: '位置に戻る。ここに立つ',
  },
};

/**
 * tension 軸の描写
 * dominantTensionAxis から情景描写を生成するためのテーブル
 */
export const TENSION_DESCRIPTIONS = {
  friction: {
    feeling: '何かが引っかかる',
    atmosphere: 'ざらつきがある。滑らかに流れない',
  },
  violation: {
    feeling: '何かが踏み越えられた',
    atmosphere: '境界が破られた。危うさがある',
  },
  pull: {
    feeling: '引かれる。抗えない',
    atmosphere: '重力が傾いている',
  },
  protection: {
    feeling: '守らなければ',
    atmosphere: '何かを、壊されないように',
  },
};

/**
 * stance の描写
 * stance の値から情景描写を生成するためのテーブル
 */
export const STANCE_TEXT = {
  receive: {
    action: 'まず受ける',
    atmosphere: '言葉を、そのまま受け取る',
  },
  illuminate: {
    action: 'そのあと少し照らす',
    atmosphere: '暗がりに、細く光を当てる',
  },
  structure: {
    action: '必要な輪郭だけ足す',
    atmosphere: '形を描く。でも囲い込まない',
  },
  guard: {
    action: '傷つきやすさを守る',
    atmosphere: 'やわらかく、壊れないように',
  },
  nudge: {
    action: '押しすぎず小さく促す',
    atmosphere: 'そっと、背中を押す',
  },
};
