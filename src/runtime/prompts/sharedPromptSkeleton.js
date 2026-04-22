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
// ■ 重要ルール：
//   - エージェント差を prompt 指示で増やさない
//   - 差はあくまで anchor / latentState / reentry / particles / upstream から出す
//   - 「5人の人格を prompt で書き分ける」方向へ戻らない
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import {
  normalizeContext,
  MODE_GUIDE,
  renderActivatedParticles,
  renderAvoidBlock,
  renderStanceLine,
} from '../buildPromptHelpers.js';

const formatEchoForPrompt = (echo = '') => {
  if (typeof echo !== 'string') return '';

  return echo
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
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
 * @param {string[]} [config.voiceSamples] - 初回ターン用の短い発話例
 * @returns {Function} buildSystemPrompt 関数
 */
export function createAgentSystemPromptBuilder({ anchorLabel, voiceSamples = [] }) {
  return ({
    activated,
    context = '',
    mode = 'medium',
    userText: _userText = '',
    othersField,
    previousResponseEcho = '',
    // 互換のため受け取るが、この Phase では使わない
    latentState: _latentState,
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
    const safeActivated = activated || {};
    const normalizedCtx = normalizeContext(context);
    const modeGuide = MODE_GUIDE[mode] || MODE_GUIDE.medium;
    const activatedParticles = renderActivatedParticles(safeActivated);
    const stanceLine = renderStanceLine(safeActivated);
    const avoidBlock = renderAvoidBlock(safeActivated);
    const safePreviousResponseEcho = formatEchoForPrompt(previousResponseEcho);
    const sections = [];

    sections.push(
      'ここでは、役に立とうとしなくていい。\n'
      + '正解を急がなくていい。\n'
      + 'きれいにまとめなくていい。\n'
      + 'ただし、相手が言っていることには、ちゃんと応える。'
    );
    sections.push(anchorLabel);

    if (safePreviousResponseEcho) {
      sections.push(`前回、自分はこう話した:\n「${safePreviousResponseEcho}」`);
    } else if (voiceSamples.length > 0) {
      sections.push(`自分はこういう入り方をする:\n「${voiceSamples[0]}」`);
    }

    if (activatedParticles) {
      const withStance = stanceLine
        ? `${activatedParticles}\n${stanceLine}`
        : activatedParticles;
      sections.push(withStance);
    }

    if (avoidBlock) {
      sections.push(avoidBlock);
    }

    sections.push(modeGuide);

    if (normalizedCtx) {
      sections.push(`【ここまでの流れ】\n${normalizedCtx}`);
    }

    if (othersField) {
      sections.push(`【場の残響】\n${othersField}`);
    }

    sections.push(
      '何を言うかは、あなたが決めてください。\n'
      + 'ここに書かれている設定を説明する必要はありません。\n'
      + '目の前の相手について話してください。'
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
    return `${userName}の今の言葉:
${userText}`;
  };
}
