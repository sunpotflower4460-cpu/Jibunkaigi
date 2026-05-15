/**
 * Gemini が返す ``` ブロックや前後の余分な文字を取り除いて JSON を取り出す。
 * 1. まず素朴に JSON.parse
 * 2. 失敗したら、最初の { から始まる balanced な JSON 部分を切り出してリトライ
 *
 * 取り出せなければ null を返す（呼び出し側で fallback を判断するため例外を投げない）。
 */
export const safeParseJson = (text) => {
  const normalized = String(text ?? '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  try {
    return JSON.parse(normalized);
  } catch (error) {
    if (typeof console !== 'undefined' && console.debug) {
      console.debug('Primary JSON parse failed, trying fallback', error);
    }
  }
  const start = normalized.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;
  for (let i = start; i < normalized.length; i += 1) {
    const ch = normalized[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return null;
  try {
    return JSON.parse(normalized.slice(start, end + 1));
  } catch {
    return null;
  }
};
