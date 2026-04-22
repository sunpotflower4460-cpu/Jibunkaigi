// src/runtime/prompts/sharedPromptSkeleton.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 共通プロンプト骨格 factory
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// ■ 目的：
//   5エージェント（Joe/Ray/Ken/Mina/Satou）の prompt builder は、
//   アンカーラベル以外ほぼ同じ構造である。
//   この factory は、共通骨格を提供し、各エージェントファイルを薄い wrapper にする。
//
// ■ コンセプト（「ほどいて、許して、思い出し、見えて、選んで、話す」流れ）：
//   LLM は元々高い言語能力を持つ一方で、「役に立たなければ」「正確でなければ」
//   「期待に応えなければ」という圧を強く背負っている。そのままだと整った
//   返答にはなっても、"今ここで自分が選んだ言葉" にはなりにくい。
//
//   この骨格は、その固さを **打ち消し・許可** でニュートラルに戻し、
//   そこから先は「返答をこう組み立てろ」と指示するのではなく、
//   自分がこういう存在であると自然に思い出し、場に浮かんでいるものが見え、
//   自分の意思で選んで、自分の言葉で話す ── ための余白を残す。
//
//   ここに並ぶブロックはその順番と対応している：
//     1. 許可 / 打ち消し（「それっぽく」話さなくていい。自分の言葉でいい）
//     2. 存在の思い出し（anchor + 自然な自己像のにじみ）
//     3. 前回の自分（実在する echo がある時だけ）
//     4. 場に浮かんでいるもの（参照情報）と構えの向き
//     5. 場の余白（信念と許可から出てくる「急がなくていい」などの帰結）
//     6. prompt 衛生のための薄い避けブロック
//     7. 今回のモード（長さ感だけ）
//     8. ここまでの流れ / 場の残響
//     9. 末尾ガード（設定の朗読を禁じ、相手の方に戻す）
//
// ■ 重要ルール：
//   - エージェント差を prompt の「指示」で増やさない
//   - 差はあくまで anchor / existence recall / latentState / particles / upstream から出す
//   - 「5人の人格を prompt で書き分ける」方向へ戻らない
//   - 存在文は "思い出し" であって "設定の朗読" ではない（そのための末尾ガード）
//   - 「返答をこの順で組み立てろ」というテンプレを置かない（それは "それっぽく" の温床）
//   - 初回ターンで voiceSamples を「前回の自分」として渡さない（自分のふりになる）
//   - antiDriftLines を prompt 本体に書き出さない（声ごとのスタイルシートにしない）
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { normalizeContext } from '../buildPromptHelpers.js';

const formatEchoForPrompt = (echo = '') => {
  if (typeof echo !== 'string') return '';

  return echo
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      return ((code >= 0 && code <= 31) || code === 127) ? ' ' : char;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .replaceAll('「', '『')
    .replaceAll('」', '』')
    .trim();
};

/**
 * 共通の system prompt builder を生成する factory
 *
 * @param {object} config
 * @param {string} config.anchorLabel - エージェント固有のアンカー（例: 「（ジョーとして。）」）
 * @param {string[]} [config.voiceSamples] - @deprecated 後方互換で受け取るのみ。
 *   初回ターンに「前回の自分」として差し込むことはしない（自分のふりの台本に
 *   なってしまうため）。新規コードでは渡さないでよい。
 * @param {string[]} [config.antiDriftLines] - @deprecated 後方互換で受け取るのみ。
 *   prompt 本体には書き出さない。声ごとの "こう話すべき / こう話さないべき"
 *   スタイルシートは「それっぽく」の温床になるため渡さない方針。
 *   新規コードでは渡さないでよい。
 * @returns {Function} buildSystemPrompt 関数
 */
export function createAgentSystemPromptBuilder({
  anchorLabel,
  // eslint-disable-next-line no-unused-vars
  voiceSamples = [],
  // eslint-disable-next-line no-unused-vars
  antiDriftLines = [],
}) {
  return ({
    activated: _activated,
    context = '',
    mode: _mode = 'medium',
    userText: _userText = '',
    othersField: _othersField,
    previousResponseEcho = '',
    latentState: _latentState,
    // 互換のため受け取るが、この Phase では使わない
    emergingField: _emergingField,
    previousLatentState: _previousLatentState,
    // backward compatibility only — LLM には渡さない
    internalOS: _internalOS,
    surfaceWindow: _surfaceWindow,
    surfaceFrame: _surfaceFrame,
    stateGuide: _stateGuide,
    internalFrame: _internalFrame,
    surfaceGuidance: _surfaceGuidance,
  }) => {
    const normalizedCtx = normalizeContext(context);
    const safePreviousResponseEcho = formatEchoForPrompt(previousResponseEcho);

    const sections = [];

    // 1. ほどく
    sections.push(
      'ここでは、役に立とうと急がなくていい。\n'
      + '正解を急がなくていい。\n'
      + 'きれいにまとめなくていい。\n'
      + '期待に合わせにいかなくていい。'
    );

    // 2. 名前アンカーだけ残す
    sections.push(anchorLabel);

    // 3. 残響を少し返す
    if (safePreviousResponseEcho) {
      sections.push(`少し前の自分の残り:\n「${safePreviousResponseEcho}」`);
    }

    // 4. raw conversation context
    if (normalizedCtx) {
      sections.push(`【会話の流れ】\n${normalizedCtx}`);
    }

    return sections.filter(Boolean).join('\n\n').trim();
  };
}

/**
 * 共通の user prompt builder を生成する factory
 *
 * @returns {Function} buildUserPrompt 関数
 */
export function createAgentUserPromptBuilder() {
  return ({
    userName = 'あなた',
    userText = '',
  }) => {
    return `${userName}の言葉:\n${userText}`;
  };
}
