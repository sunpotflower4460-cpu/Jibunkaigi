const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

const isQuestion = (text = '') => /[?？]|どう|なぜ|なんで|どこまで/.test(text);

export function decideUtterance(input, { fieldState = {}, coActivation = {}, meaningState = {}, homeState = {} } = {}) {
  const text = typeof input === 'string' ? input.trim().toLowerCase() : '';
  const field = fieldState.relationalField ?? {};
  const reaction = coActivation.reaction ?? {};
  const home = homeState.homeVector ?? {};
  const questionAsked = isQuestion(text);
  const shouldStayOpen = (field.ambiguity ?? 0) >= 0.42 || meaningState.stillUnknown === true;
  const shouldAnswerQuestion = questionAsked && (field.permission ?? 0) >= 0.24;

  let replyIntent = 'stay_with';
  if ((field.fragility ?? 0) >= 0.56) replyIntent = 'protect_and_accompany';
  else if (shouldAnswerQuestion && (reaction.clarify ?? 0) >= 0.32) replyIntent = 'answer_gently';
  else if ((reaction.curiosity ?? 0) >= 0.42) replyIntent = 'clarify_without_force';

  let stance = 'receive';
  if (replyIntent === 'protect_and_accompany') stance = 'guard';
  else if (replyIntent === 'answer_gently') stance = 'structure';
  else if (replyIntent === 'clarify_without_force') stance = 'illuminate';
  else if (shouldStayOpen) stance = 'stay_open';

  const closeness = clamp01((field.closeness ?? 0) * 0.6 + (reaction.touched ?? 0) * 0.2);
  const answerDepth = clamp01((field.gravity ?? 0) * 0.34 + (reaction.clarify ?? 0) * 0.28 + (shouldStayOpen ? 0.08 : 0.18));
  const withheldBias = [
    (home.overperformance ?? 0) >= 0.18 ? 'overperformance' : null,
    (field.permission ?? 0) >= 0.4 ? 'premature_fixing' : null,
    shouldStayOpen ? 'premature_certainty' : null,
  ].filter(Boolean);

  const stanceVector = {
    receive: clamp01(0.26 + closeness * 0.28 + (stance === 'receive' || stance === 'stay_open' ? 0.18 : 0)),
    illuminate: clamp01((reaction.curiosity ?? 0) * 0.26 + (stance === 'illuminate' ? 0.38 : 0.08)),
    structure: clamp01((reaction.clarify ?? 0) * 0.28 + (shouldAnswerQuestion ? 0.22 : 0.06) + (stance === 'structure' ? 0.26 : 0)),
    guard: clamp01((field.fragility ?? 0) * 0.38 + (reaction.protect ?? 0) * 0.26 + (stance === 'guard' ? 0.28 : 0)),
    nudge: clamp01((reaction.curiosity ?? 0) * 0.18 + ((field.urgency ?? 0) < 0.35 ? 0.12 : 0.04)),
  };

  const permissionVector = {
    noHurry: clamp01(0.3 + (field.permission ?? 0) * 0.24 + (shouldStayOpen ? 0.16 : 0)),
    noOverExplain: clamp01(0.24 + (home.overorganization ?? 0) * 0.22 + (field.permission ?? 0) * 0.14),
    noPerformativeHelpfulness: clamp01(0.3 + (home.permission_to_not_perform ?? 0) * 0.3),
    allowPartialUncertainty: clamp01(0.18 + (field.ambiguity ?? 0) * 0.48),
  };

  return {
    stage: 'self_decision',
    replyIntent,
    stance,
    closeness,
    answerDepth,
    withheldBias,
    shouldAnswerQuestion,
    shouldStayOpen,
    stanceVector,
    permissionVector,
  };
}

