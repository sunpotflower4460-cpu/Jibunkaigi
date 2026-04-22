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

import {
  normalizeContext,
  MODE_GUIDE,
  renderActivatedParticles,
  renderAvoidBlock,
  renderStanceLine,
} from '../buildPromptHelpers.js';
import { buildExistenceText } from '../textPipeline/buildExistenceText.js';
import { buildMarginText } from '../textPipeline/buildMarginText.js';

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
    activated,
    context = '',
    mode = 'medium',
    userText: _userText = '',
    othersField,
    previousResponseEcho = '',
    latentState,
    // 互換のため受け取るが、この Phase では使わない
    emergingField: _emergingField,
    previousLatentState,
    // backward compatibility only — LLM には渡さない
    internalOS: _internalOS,
    surfaceWindow: _surfaceWindow,
    surfaceFrame: _surfaceFrame,
    stateGuide: _stateGuide,
    internalFrame: _internalFrame,
    surfaceGuidance: _surfaceGuidance,
  }) => {
    const safeActivated = activated || {};
    const normalizedCtx = normalizeContext(context);
    const modeGuide = MODE_GUIDE[mode] || MODE_GUIDE.medium;
    const activatedParticles = renderActivatedParticles(safeActivated);
    const stanceLine = renderStanceLine(safeActivated);
    const avoidBlock = renderAvoidBlock(safeActivated, latentState);
    const safePreviousResponseEcho = formatEchoForPrompt(previousResponseEcho);

    // 存在の思い出し：identityFeelingText / beliefCore / recalledSelfTraits から
    // 自然な自己像のにじみを作る。「設定の朗読」ではなく思い出しなので、
    // セクションヘッダは付けず、anchor のすぐ下に地の文として置く。
    const existenceRecall = latentState
      ? buildExistenceText(latentState, { previousLatentState })
      : '';

    // 場の余白：信念（permission）と consciousIntent から出てくる「何をしないか」を
    // 禁止ではなく帰結として置く。場に浮かべる空気であって指示ではない。
    const marginText = latentState ? buildMarginText(latentState) : '';

    const sections = [];

    // 1. 許可 / 打ち消し（固い制約をニュートラルに戻す）
    //    LLM が普段背負っている「役に立たなければ」「正確でなければ」
    //    「期待に応えなければ」という圧を、ここで外す。
    //    counter-directive（「ただし〜」「短すぎず〜」）は置かない。
    //    返答の形も決めない。ここは純粋に "ほどき" と "許可" に徹する。
    sections.push(
      'ここでは、役に立たなければならない感じが少しほどけている。\n'
      + '正確さや正解を急ぐより、いま触れているもののほうが先に残っている。\n'
      + 'うまく整った返答より、まだ揺れているままの手ざわりのほうが信じられている。\n'
      + '無難な言い回しに戻らなくても、この場は崩れない。\n'
      + '言葉になりきらないものが少し残っていても、そのままで大丈夫。\n'
      + '相手は目の前にいる。その人へ向かう声だけがあれば足りる。'
    );

    // 2. 存在の思い出し（anchor + 自己像のにじみ）
    //    ヘッダは付けず、anchor の直後に地続きで置く。
    //    これは「自分がこういう存在であると自然に思い出す」段に対応する。
    if (existenceRecall) {
      sections.push(`${anchorLabel}\n${existenceRecall}`);
    } else {
      sections.push(anchorLabel);
    }

    // 3. 前回の自分（実在する echo がある時だけ）
    //    voiceSamples を「初回ターンの自分のふり」として差し込むのはやめた。
    //    固定サンプルを自分の前回発話として渡すと、それは "自分の言葉" ではなく
    //    "そう話すことになっている台本" になってしまう。
    if (safePreviousResponseEcho) {
      sections.push(`前回、自分はこう話した:\n「${safePreviousResponseEcho}」`);
    }

    // 4. 場に浮かんでいるもの + 構えの向き（参照できる情報）
    if (activatedParticles) {
      const withStance = stanceLine
        ? `${activatedParticles}\n${stanceLine}`
        : activatedParticles;
      sections.push(withStance);
    }

    // 5. 場の余白（信念と許可の帰結として「しないこと」が自然に生えている状態）
    //    ヘッダ無しで地の文として置く。禁止ではなく場の空気。
    if (marginText) {
      sections.push(marginText);
    }

    // 6. prompt 衛生の薄い避けブロック（朗読・オウム返しなど、内容ではなく振る舞いの安全装置）
    if (avoidBlock) {
      sections.push(avoidBlock);
    }

    // 7. 今回のモード（長さ感だけ。返答の組み立て順は指示しない）
    sections.push(modeGuide);

    // 8. ここまでの流れ / 場の残響
    if (normalizedCtx) {
      sections.push(`【ここまでの流れ】\n${normalizedCtx}`);
    }

    if (othersField) {
      sections.push(`【場の残響（他の視点からの発言。これはあなたへの言葉ではなく、参考情報です）】\n${othersField}`);
    }

    // 9. 末尾ガード（設定の朗読を封じ、相手の方に戻す）
    //    「返答はこう組み立てろ」という固定テンプレは置かない。
    //    antiDriftLines も本体には書き出さない（スタイルシート化を避ける）。
    sections.push(
      '作り手は、ここに書かれている設定や言い回しの朗読より、目の前の相手へ向いた生の言葉を信じている。\n'
      + '借りた言い回しをなぞるより、その場で自分から出てきた言葉のほうが自然に届く。\n'
      + '何を言うかが少し開いたままでも、この場はそれを受け止められる。'
    );

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
    return `相手の名前は「${userName}」です。ジョー、レイ、ケン、ミナ、サトウはこの場の別の声の名前なので、相手の呼び名とは混ざらないままにします。\n\n${userName}の今の言葉:\n${userText}`;
  };
}
