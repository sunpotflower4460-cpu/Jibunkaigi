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
  renderTonalLine,
  renderAvoidBlock,
  renderStanceLine,
} from '../buildPromptHelpers.js';
import { buildExistenceText } from '../textPipeline/buildExistenceText.js';
import { buildFieldText } from '../textPipeline/buildFieldText.js';
import { buildMarginText } from '../textPipeline/buildMarginText.js';

/**
 * 共通の system prompt builder を生成する factory
 *
 * @param {object} config
 * @param {string} config.anchorLabel - エージェント固有のアンカー（例: 「（ジョーとして。）」）
 * @returns {Function} buildSystemPrompt 関数
 */
export function createAgentSystemPromptBuilder({ anchorLabel }) {
  return ({
    activated,
    context = '',
    mode = 'medium',
    userText: _userText = '',
    othersField,
    // latentState: runInternalOS の13層計算の出力
    latentState,
    // emergingField: focusPoints / bodySignals など
    emergingField,
    // previousLatentState: afterglow 用
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
    const effectiveLatentState = latentState ?? _internalOS?.latentState ?? null;
    const normalizedCtx = normalizeContext(context);
    const modeGuide = MODE_GUIDE[mode] || MODE_GUIDE.medium;
    const activatedParticles = renderActivatedParticles(safeActivated);
    // Phase 4 (修正指示書 v3): 内部 hints を prompt の前景に薄く差し込む。
    //   - tonalHints: 1 行で声の質感
    //   - stanceHints: 1 行で構えの向き
    //   - avoidHints: 最大 2 個で「この場で自然に避けるもの」
    // 人格説明書にはしない。補正輪としてだけ使う。
    const tonalLine = renderTonalLine(safeActivated, effectiveLatentState);
    const stanceLine = renderStanceLine(safeActivated, effectiveLatentState);
    const avoidBlock = renderAvoidBlock(safeActivated, effectiveLatentState);
    const reentryText = typeof safeActivated.reentry === 'string'
      ? safeActivated.reentry
      : safeActivated.reentry?.text || '';

    // 新構造: textPipeline からの描写
    const existenceText = effectiveLatentState
      ? buildExistenceText(effectiveLatentState, { previousLatentState })
      : '';
    const fieldText = effectiveLatentState
      ? buildFieldText(effectiveLatentState, { focusPoints: emergingField?.focusPoints })
      : '';
    const marginText = effectiveLatentState ? buildMarginText(effectiveLatentState) : '';

    // 新構造の7ブロック
    const sections = [];

    // [存在の前提]
    if (existenceText) {
      sections.push(`【存在の前提】\n${anchorLabel}\n${existenceText}`);
    } else {
      // 移行期アンカー: 最初の1行だけ残す
      sections.push(anchorLabel);
    }

    // [今の場の空気]
    if (fieldText) {
      sections.push(`【今の場の空気】\n${fieldText}`);
    }

    // [場に浮かんでいるもの]
    if (activatedParticles) {
      // 薄い補正輪として tonal / stance 1行を同ブロック末尾に添える。
      const extraLines = [tonalLine, stanceLine].filter(Boolean);
      sections.push(
        extraLines.length
          ? `${activatedParticles}\n${extraLines.join('\n')}`
          : activatedParticles
      );
    }

    // [場の余白]
    // モード指示をここに吸収する
    const marginParts = [marginText, modeGuide, avoidBlock].filter(Boolean);
    if (marginParts.length) {
      sections.push(`【場の余白】\n${marginParts.join('\n\n')}`);
    }

    // [内的方向づけ（この回だけの構え）]
    if (reentryText) {
      sections.push(`【内的方向づけ（この回だけの構え）】\n${reentryText}`);
    }

    // [ここまでの流れ]
    if (normalizedCtx) {
      sections.push(`【ここまでの流れ】\n${normalizedCtx}`);
    }

    // [場の残響]
    if (othersField) {
      sections.push(`【場の残響】\n${othersField}`);
    }

    // [相手の言葉] は user prompt に含まれるため、system prompt には含めない

    // 末尾の静かな開口部（モード指示は前段へ移動済み）
    // Phase 4-1 (修正指示書 v3): 汎用カウンセラーパターン（オウム返し）に収束しないよう、
    // 最小限の「なぞらない」指示を薄く添える。
    sections.push(
      '何を言うかは、あなたが決めてください。\n相手の言葉をなぞるのではなく、今ここに浮かんでいるものから始めてください。'
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
