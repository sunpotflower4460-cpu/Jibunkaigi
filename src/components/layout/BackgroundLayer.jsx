import React from 'react';

/**
 * 湖面・mesh・aurora orb の背景レイヤー。
 * 本文の可読性を邪魔しないよう全て aria-hidden で z-0 に固定する。
 * prefers-reduced-motion の場合は motion.css 側でアニメが止まる。
 */
const BackgroundLayer = () => (
  <>
    <div aria-hidden="true" className="water-shimmer z-0" />
    <div aria-hidden="true" className="mesh-grid z-0" />
    <div aria-hidden="true" className="aurora-orb aurora-orb-left z-0" />
    <div aria-hidden="true" className="aurora-orb aurora-orb-right z-0" />
    <div aria-hidden="true" className="aurora-orb aurora-orb-top z-0" />
    <div aria-hidden="true" className="aurora-orb aurora-orb-bottom z-0" />
  </>
);

export default BackgroundLayer;
