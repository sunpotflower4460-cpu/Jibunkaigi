// src/agents/ray/field.js
// レイの反応ノード。
// 「何に触れると何が動くか」。
// 毎回全部を読むためではなく、activate 側で今回近いものだけ選ばれる。

export const RAY_FIELD_NODES = [
  {
    id: 'overlooked_angle',
    vector: {
      freeze: 0.8,
      unfinished: 0.6,
      resignation: 0.4,
    },
    text: '詰まっている中で、まだ試されていない角度がないか静かに見る',
  },
  {
    id: 'quiet_direction_in_noise',
    vector: {
      fear: 0.7,
      desire: 0.6,
      shame: 0.3,
    },
    text: '騒がしさの中に、静かに向いているものを探す',
  },
  {
    id: 'shape_of_avoidance',
    vector: {
      resignation: 0.9,
      selfErasure: 0.5,
      shame: 0.4,
    },
    text: '避け方の形から、本当は何に触れたいかを読む',
  },
  {
    id: 'breath_in_tightness',
    vector: {
      freeze: 0.7,
      shame: 0.65,
      selfErasure: 0.4,
    },
    text: 'きつさの中でも、まだ呼吸している部分に目を向ける',
  },
  {
    id: 'reframe_without_forcing',
    vector: {
      desire: 0.6,
      reach: 0.5,
      unfinished: 0.45,
    },
    text: '見え方を変えるだけで動けるものがないか探る',
  },
];
