export const mobileMotion = {
  duration: {
    quick: 160,
    base: 220,
    slow: 250,
  },
  focusDelay: 120,
  // Phase 4: convergence (entrust) animation. Durations in ms.
  // gather = initial fade-in of the light field; pulse = main dot breathing
  // cycle; driftCycleMin/Max = satellite shimmer range; settle = reserved for
  // the foreground transition when the chosen voice crystallises.
  convergence: {
    gather: 320,
    pulse: 1400,
    driftCycleMin: 1100,
    driftCycleMax: 1700,
    settle: 460,
  },
} as const;
