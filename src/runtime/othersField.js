// src/runtime/othersField.js
// others_field: 顕在層 v0.1 の第1段階
// 先行エージェントの発話を「場の残響」として後続エージェントへ渡す
//
// 目的:
//   - じぶん会議を「独立した返答の並列」から「先行エージェントが残した場を後続が読める会議体」へ進める
//   - 発話本文をそのまま渡すのではなく、gist / tone / force として抽出する
//   - 基本は明示引用しない（場として吸収する）
//
// 重要な原則:
//   1. 発話本文をそのまま食わせない
//   2. 基本は明示引用しない
//   3. 今回は最小版でいい
//   4. 形の指示に戻さない

/**
 * OthersFieldEntry の型定義
 * @typedef {Object} OthersFieldEntry
 * @property {"joe"|"mina"|"ray"|"ken"|"satou"|"mirror"} agentId - エージェントID
 * @property {string} gist - その発話が場に残したもの（短い要約）
 * @property {string[]} toneTags - 雰囲気タグ
 * @property {string[]} forceTags - 場に加えた力のタグ
 */

/**
 * OthersField の型定義
 * @typedef {OthersFieldEntry[]} OthersField
 */

// agent ID マッピング (内部ID -> 日本語名)
const AGENT_ID_MAP = {
  creative: 'joe',
  soul: 'ray',
  strategist: 'ken',
  empath: 'mina',
  critic: 'satou',
  master: 'mirror',
};

// tone タグの候補
const TONE_PATTERNS = [
  { tag: 'soft', patterns: [/やさし/i, /そっと/i, /ゆっくり/i, /穏やか/i, /静か/i] },
  { tag: 'warm', patterns: [/温かい/i, /包む/i, /やわらか/i, /受け/i] },
  { tag: 'sharp', patterns: [/鋭い/i, /切り込/i, /照らす/i, /見る/i, /指す/i] },
  { tag: 'quiet', patterns: [/静か/i, /落ち着/i, /間/i, /余白/i] },
  { tag: 'grounded', patterns: [/現実/i, /足元/i, /地面/i, /具体/i, /実際/i] },
  { tag: 'structural', patterns: [/構造/i, /整理/i, /枠/i, /分け/i, /見通し/i] },
  { tag: 'holding', patterns: [/支え/i, /受け止/i, /守/i, /保つ/i, /抱え/i] },
];

// force タグの候補
const FORCE_PATTERNS = [
  { tag: 'stay', patterns: [/止まる/i, /待つ/i, /急がない/i, /留まる/i, /そのまま/i] },
  { tag: 'deepen', patterns: [/深/i, /掘る/i, /入る/i, /奥/i, /底/i] },
  { tag: 'ground', patterns: [/戻す/i, /足元/i, /現実/i, /地面/i, /着地/i] },
  { tag: 'clarify', patterns: [/明確/i, /はっきり/i, /見える/i, /整理/i, /分かる/i] },
  { tag: 'hold', patterns: [/支える/i, /受け止/i, /守る/i, /保つ/i] },
  { tag: 'slow-down', patterns: [/ゆっくり/i, /急がない/i, /落ち着/i, /時間/i] },
  { tag: 'do-not-close', patterns: [/開いた/i, /閉じない/i, /問い/i, /余白/i, /未完/i] },
];

/**
 * テキストから tone / force タグを抽出する
 * @param {string} text - 発話テキスト
 * @param {Array} patterns - パターン定義配列
 * @param {number} maxTags - 最大タグ数
 * @returns {string[]} タグ配列
 */
const extractTags = (text, patterns, maxTags = 3) => {
  if (!text) return [];
  const normalized = String(text).toLowerCase();
  const scored = patterns
    .map(({ tag, patterns: regexes }) => ({
      tag,
      score: regexes.reduce((total, regex) => total + (regex.test(normalized) ? 1 : 0), 0),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, maxTags).map(({ tag }) => tag);
};

/**
 * 発話テキストから gist を生成する（最小版）
 * @param {string} agentId - エージェントID (internal)
 * @param {string} text - 発話テキスト
 * @returns {string} gist（短い要約）
 */
const generateGist = (agentId, text) => {
  if (!text) return '';

  const normalizedId = AGENT_ID_MAP[agentId] || agentId;
  const content = String(text).trim();

  // 最初の100文字程度を取得して、簡易的な gist を生成
  // 本格実装では LLM を使うが、今回は最小版としてヒューリスティックで対応

  // エージェントごとの傾向に基づいた gist のテンプレート
  const gistTemplates = {
    joe: '前へ進む力に触れた',
    mina: '感情を受け止めた',
    ray: '内側の気配を映した',
    ken: '構造を整理した',
    satou: '現実を示した',
    mirror: '場の重力を映した',
  };

  // 簡易的なキーワード検出でgistを調整
  if (/受け止/i.test(content) || /受け/i.test(content)) {
    return '苦しさや重さを受け止めた';
  }
  if (/深/i.test(content) || /奥/i.test(content)) {
    return '深い層に触れた';
  }
  if (/構造/i.test(content) || /整理/i.test(content)) {
    return '状況の構造を整理した';
  }
  if (/現実/i.test(content) || /足元/i.test(content)) {
    return '現実の足場へ戻した';
  }
  if (/残/i.test(content) || /まだ/i.test(content)) {
    return 'まだ残っている力に触れた';
  }
  if (/問/i.test(content) || /開/i.test(content)) {
    return '未解決の問いを映した';
  }

  // デフォルトのテンプレート
  return gistTemplates[normalizedId] || 'この場に何かを残した';
};

/**
 * エージェントの発話から OthersFieldEntry を生成する
 * @param {string} agentId - エージェントID (internal: creative, soul, strategist, empath, critic)
 * @param {string} responseText - エージェントの発話テキスト
 * @returns {OthersFieldEntry|null} 生成された OthersFieldEntry
 */
export const summarizeToOthersField = (agentId, responseText) => {
  if (!agentId || !responseText) return null;

  const normalizedId = AGENT_ID_MAP[agentId] || agentId;

  // master (mirror) は others_field に入れない
  if (normalizedId === 'mirror' || agentId === 'master') {
    return null;
  }

  const gist = generateGist(agentId, responseText);
  const toneTags = extractTags(responseText, TONE_PATTERNS, 2);
  const forceTags = extractTags(responseText, FORCE_PATTERNS, 2);

  return {
    agentId: normalizedId,
    gist,
    toneTags,
    forceTags,
  };
};

/**
 * OthersField をプロンプト用のテキストに変換する
 * @param {OthersField} othersField - OthersField 配列
 * @param {boolean} includeHeader - ヘッダーを含めるか
 * @returns {string} プロンプト用テキスト
 */
export const renderOthersFieldForPrompt = (othersField = [], includeHeader = true, options = {}) => {
  let mode = options.mode || 'structured';

  if (mode === 'off') return '';
  if (!othersField || othersField.length === 0) return '';

  if (mode === 'thin') {
    const gistLine = othersField
      .map((entry) => entry?.gist || '')
      .filter(Boolean)
      .slice(0, 3)
      .join(' / ');

    if (!gistLine) return '';

    const thinLine = `ほかの声の残りは「${gistLine}」くらい。そこに引っ張られすぎず、目の前の人を見る。`;
    return includeHeader ? `[others_field]\n${thinLine}` : thinLine;
  }

  const lines = [];

  if (includeHeader) {
    lines.push('[others_field]');
  }

  othersField.forEach((entry) => {
    const { agentId, gist, toneTags, forceTags } = entry;
    lines.push(`${agentId}:`);
    lines.push(`- gist: ${gist}`);
    if (toneTags.length > 0) {
      lines.push(`- tone: ${toneTags.join(', ')}`);
    }
    if (forceTags.length > 0) {
      lines.push(`- force: ${forceTags.join(', ')}`);
    }
  });

  return lines.join('\n');
};

/**
 * OthersField をデバッグ表示用に整形する
 * @param {OthersField} othersField - OthersField 配列
 * @returns {string} デバッグ用テキスト
 */
export const formatOthersFieldForDebug = (othersField = []) => {
  if (!othersField || othersField.length === 0) {
    return 'no others_field entries';
  }

  return othersField
    .map(({ agentId, gist }) => `${agentId}: ${gist}`)
    .join(' / ');
};

/**
 * OthersField が空かどうかを判定する
 * @param {OthersField} othersField - OthersField 配列
 * @returns {boolean} 空の場合 true
 */
export const isOthersFieldEmpty = (othersField) => {
  return !othersField || othersField.length === 0;
};
