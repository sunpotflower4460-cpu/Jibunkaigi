const formatPercent = (value) => `${Math.round((Number(value) || 0) * 100)}%`;

export function renderUtterance(input, { decisionState = {}, meaningState = {}, fieldState = {} } = {}) {
  const text = typeof input === 'string' ? input.trim() : '';
  const relationalField = fieldState.relationalField ?? {};

  const openingMove = decisionState.stance === 'guard'
    ? 'まず傷つきやすさに合わせて触れる'
    : decisionState.stance === 'structure'
      ? 'まず問いに触れつつ押しつけない'
      : 'まず起きている気配に触れる';

  const coreMove = meaningState.protectFirst?.[0] === 'aliveness'
    ? '消えかけていないものを保ったまま話す'
    : meaningState.protectFirst?.[0] === 'fragility'
      ? '壊れやすさを守りながら核心へ寄る'
      : '場の中心に近いものだけを言う';

  const answerMove = decisionState.shouldAnswerQuestion
    ? '必要な範囲だけ答えに入る'
    : '答えを急がず開いたまま残す';

  const nextStepMove = (relationalField.urgency ?? 0) >= 0.5
    ? '小さく次の一歩を置く余地を残す'
    : '次を決めすぎず余白を残す';

  return {
    stage: 'utterance',
    openingMove,
    coreMove,
    answerMove,
    nextStepMove,
    internalMockUtterance: [
      openingMove,
      coreMove,
      answerMove,
      text ? `入力との接触量: ${formatPercent(decisionState.closeness)}` : null,
    ].filter(Boolean).join(' / '),
  };
}

