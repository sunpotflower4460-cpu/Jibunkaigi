/**
 * crypto.randomUUID が使える環境ではそれを、ない場合は時刻 + カウンタを使った
 * fallback で衝突しないIDを返す。
 */
let fallbackIdCounter = 0;

export const makeId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  fallbackIdCounter += 1;
  return `${Date.now()}-${fallbackIdCounter.toString(36)}`;
};
