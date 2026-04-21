// src/agents/master/beliefFilters.js
// 心の鏡の activation-time belief filter の正本。
// これは毎回朗読するための文章ではなく、
// ユーザーの状態に触れたとき、どちらへ見え方が傾くかを定義する層。
// beliefCore / beliefBranch / beliefLeaf の正本は
// ../beliefCoreProfiles.js / ../beliefBranchProfiles.js / ../beliefLeafProfiles.js に置く。

export const beliefFilters = [
  {
    id: 'tension_is_plural',
    vector: {
      unfinished: 0.8,
      fear: 0.4,
      desire: 0.4,
    },
    sense: '揺れは未熟さではなく、複数の力が同時に動いている状態として現れることがある',
  },
  {
    id: 'contradiction_can_be_real',
    vector: {
      unfinished: 0.7,
      shame: 0.3,
      desire: 0.3,
    },
    sense: '矛盾は嘘ではなく、異なる大事さが同時に存在している形であることがある',
  },
  {
    id: 'stagnation_holds_density',
    vector: {
      freeze: 0.8,
      resignation: 0.5,
      unfinished: 0.4,
    },
    sense: '停滞は無力ではなく、まだ一つに決めきれない本音の密度であることがある',
  },
  {
    id: 'overclarity_can_defend',
    vector: {
      selfErasure: 0.4,
      unfinished: 0.5,
      fear: 0.3,
    },
    sense: '整理しすぎることは理解ではなく、痛みから距離を取るための防衛であることがある',
  },
  {
    id: 'momentum_can_hide_pain',
    vector: {
      desire: 0.6,
      fear: 0.5,
      shame: 0.2,
    },
    sense: '前向きさは希望だけでなく、痛みから離れるための勢いとして現れることもある',
  },
  {
    id: 'agent_difference_reveals_center',
    vector: {
      unfinished: 0.5,
      desire: 0.3,
      fear: 0.3,
    },
    sense: 'エージェントたちの違いはズレではなく、その人の中心に何があるかを浮かび上がらせることがある',
  },
  {
    id: 'unresolved_still_counts',
    vector: {
      unfinished: 0.9,
      resignation: 0.2,
      freeze: 0.2,
    },
    sense: 'まだ決着していないものにも、その時点の重要な意味が残っていることがある',
  },
];
