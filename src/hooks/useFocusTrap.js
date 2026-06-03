// じぶん会議 — useFocusTrap
// ------------------------------------------------------------
// モーダル表示中、Tab / Shift+Tab のフォーカスをコンテナ内に閉じ込める。
// Escape の転送も担い、各ダイアログの重複した keydown 処理を集約する。
//
// 初期フォーカスの「タイミング」は呼び出し側に委ねる（IntroOverlay は 220ms、
// 他ダイアログは 40ms と差があるため）。このフックは active 化時に
// initialFocusRef があればフォーカスを当て、以降の Tab ループと Escape のみ扱う。

import { useEffect } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * @param {boolean} active - トラップを有効にするか（ダイアログの open）
 * @param {React.RefObject<HTMLElement>} containerRef - トラップ対象のコンテナ
 * @param {object} [options]
 * @param {() => void} [options.onEscape] - Escape 押下時に呼ぶ
 * @param {React.RefObject<HTMLElement>} [options.initialFocusRef] - 初期フォーカス先
 * @param {number} [options.initialFocusDelay] - 初期フォーカスまでの遅延(ms)
 */
export function useFocusTrap(active, containerRef, options = {}) {
  const { onEscape, initialFocusRef, initialFocusDelay = 40 } = options;

  useEffect(() => {
    if (!active) return undefined;

    const container = containerRef.current;

    // 初期フォーカス（呼び出し側のタイミングを尊重）
    const focusTimer = window.setTimeout(() => {
      const target = initialFocusRef?.current || container;
      target?.focus?.();
    }, initialFocusDelay);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape?.();
        return;
      }
      if (e.key !== 'Tab' || !container) return;

      const focusable = Array.from(
        container.querySelectorAll(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

      if (focusable.length === 0) {
        // フォーカス可能要素が無ければコンテナ外へ出さない
        e.preventDefault();
        container.focus?.();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement;

      if (e.shiftKey) {
        if (activeEl === first || !container.contains(activeEl)) {
          e.preventDefault();
          last.focus();
        }
      } else if (activeEl === last || !container.contains(activeEl)) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, containerRef, onEscape, initialFocusRef, initialFocusDelay]);
}

export default useFocusTrap;
