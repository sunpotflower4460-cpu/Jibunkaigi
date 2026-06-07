import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * 端末の「視差効果を減らす / アニメーションを減らす」設定に追従する。
 * Web 版の prefers-reduced-motion 相当。true のときは演出を止め、
 * 落ち着いた静的表示にフォールバックする。
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduced(value);
      })
      .catch(() => {
        /* 取得不可の環境では演出ありのまま */
      });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      setReduced(value);
    });
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  return reduced;
}

export default useReducedMotion;
