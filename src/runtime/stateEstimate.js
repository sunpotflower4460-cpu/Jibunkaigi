// src/runtime/stateEstimate.js
// ユーザーの発言から心理状態を推定する（全エージェント共通）

/**
 * @param {string} text - ユーザーの発言
 * @returns {Object} - { desire, fear, freeze, reach, resignation, selfErasure, shame, unfinished }
 */
export const estimateState = (text) => {
  if (!text || typeof text !== 'string') {
    return {
      desire: 0,
      fear: 0,
      freeze: 0,
      reach: 0,
      resignation: 0,
      selfErasure: 0,
      shame: 0,
      unfinished: 0
    };
  }

  const t = text.toLowerCase();

  let desire = 0;
  let fear = 0;
  let freeze = 0;
  let reach = 0;
  let resignation = 0;
  let selfErasure = 0;
  let shame = 0;
  let unfinished = 0;

  // ==================== desire 側 ====================
  if (t.includes('やりたい') || t.includes('行きたい') || t.includes('なりたい')) {
    desire += 0.4;
  }
  if (t.includes('したい') || t.includes('欲しい')) {
    desire += 0.2;
  }
  if (t.includes('憧れ') || t.includes('夢')) {
    desire += 0.3;
  }

  // ==================== reach 側 ====================
  if (t.includes('出したい') || t.includes('届けたい') || t.includes('進みたい')) {
    reach += 0.3;
  }
  if (t.includes('作りたい') || t.includes('書きたい') || t.includes('描きたい')) {
    reach += 0.25;
  }
  if (t.includes('伝えたい') || t.includes('見せたい')) {
    reach += 0.2;
  }

  // ==================== fear 側 ====================
  if (t.includes('怖い') || t.includes('不安')) {
    fear += 0.4;
  }
  if (t.includes('恐れ') || t.includes('ビビ')) {
    fear += 0.3;
  }
  if (t.includes('心配') || t.includes('緊張')) {
    fear += 0.2;
  }

  // ==================== freeze 側 ====================
  if (t.includes('動けない') || t.includes('できない')) {
    freeze += 0.4;
  }
  if (t.includes('止まって') || t.includes('固まって')) {
    freeze += 0.35;
  }
  if (t.includes('手が出ない') || t.includes('進めない')) {
    freeze += 0.3;
  }

  // ==================== resignation 側 ====================
  if (t.includes('諦め') || t.includes('無理')) {
    resignation += 0.5;
  }
  if (t.includes('もうダメ') || t.includes('終わった')) {
    resignation += 0.4;
  }
  if (t.includes('どうせ') || t.includes('しょせん')) {
    resignation += 0.3;
  }

  // ==================== unfinished 側 ====================
  if (t.includes('諦めきれない') || t.includes('まだある') || t.includes('残ってる')) {
    unfinished += 0.4;
  }
  if (t.includes('引っかかる') || t.includes('忘れられない')) {
    unfinished += 0.3;
  }
  if (t.includes('気になる') || t.includes('心残り')) {
    unfinished += 0.25;
  }

  // ==================== selfErasure 側 ====================
  if (t.includes('でも') || t.includes('だって')) {
    selfErasure += 0.2;
  }
  if (t.includes('忙しい') || t.includes('時間がない')) {
    selfErasure += 0.25;
  }
  if (t.includes('才能ない') || t.includes('向いてない')) {
    selfErasure += 0.3;
  }

  // ==================== shame 側 ====================
  if (t.includes('恥ずかしい') || t.includes('ダサい')) {
    shame += 0.3;
  }
  if (t.includes('みっともない') || t.includes('情けない')) {
    shame += 0.35;
  }
  if (t.includes('バカにされ') || t.includes('笑われ')) {
    shame += 0.4;
  }

  // 最大値を1.0に制限
  return {
    desire: Math.min(desire, 1.0),
    fear: Math.min(fear, 1.0),
    freeze: Math.min(freeze, 1.0),
    reach: Math.min(reach, 1.0),
    resignation: Math.min(resignation, 1.0),
    selfErasure: Math.min(selfErasure, 1.0),
    shame: Math.min(shame, 1.0),
    unfinished: Math.min(unfinished, 1.0)
  };
};
