const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

const normalizeContext = (context = {}) => ({
  agentId: typeof context?.agentId === 'string' ? context.agentId : null,
  userText: typeof context?.userText === 'string' ? context.userText : '',
  dominantBeliefAxis: typeof context?.dominantBeliefAxis === 'string' ? context.dominantBeliefAxis : null,
  dominantTensionAxis: typeof context?.dominantTensionAxis === 'string' ? context.dominantTensionAxis : null,
  identityKey: typeof context?.identityKey === 'string' ? context.identityKey : null,
});

const pushCandidate = (target, text, weight) => {
  if (!text) return;
  target.push({ text, weight: clamp01(weight) });
};

const finalizeCandidates = (candidates = []) => {
  const seen = new Set();

  return candidates
    .sort((a, b) => b.weight - a.weight)
    .filter(({ text }) => {
      if (seen.has(text)) return false;
      seen.add(text);
      return true;
    })
    .slice(0, 4)
    .map(({ text }) => text);
};

export const createInitialProtoMeaning = () => ({
  sensory: [],
  narrative: [],
});

export const buildProtoMeaning = (fusedState = {}, context = {}) => {
  const lexical = fusedState?.lexical ?? {};
  const fused = fusedState?.fused ?? {};
  const normalizedContext = normalizeContext(context);
  const userText = normalizedContext.userText;
  const sensoryCandidates = [];
  const narrativeCandidates = [];

  if ((fused.hesitation ?? 0) >= 0.3 || /(?:ためら|止ま|うまく言えない)/.test(userText)) {
    pushCandidate(sensoryCandidates, 'ためらいが喉元に残っている', fused.hesitation);
  }
  if ((fused.pressure ?? 0) >= 0.35 || /(?:急ぐ|壊れそう|圧|焦)/.test(userText)) {
    pushCandidate(sensoryCandidates, '胸の前に圧がかかっている', fused.pressure);
  }
  if ((fused.unfinishedPull ?? 0) >= 0.3 || /(?:残って|違和感|気になる|消したくない)/.test(userText)) {
    pushCandidate(sensoryCandidates, '終わりきらないざらつきが残っている', fused.unfinishedPull);
  }
  if ((fused.guardedness ?? 0) >= 0.3 || /(?:怖|笑われ|引っ込|合わせる)/.test(userText)) {
    pushCandidate(sensoryCandidates, '守りながら外をうかがっている', fused.guardedness);
  }
  if ((fused.ember ?? 0) >= 0.3 || /(?:出したい|やりたい|進みたい|消したくない)/.test(userText)) {
    pushCandidate(
      sensoryCandidates,
      (fused.pressure ?? 0) >= 0.35
        ? '火種はあるが、前に出る直前で揺れている'
        : '細い火種がまだ消えずに残っている',
      Math.max(fused.ember ?? 0, fused.pressure ?? 0)
    );
  }
  if ((fused.selfSilencing ?? 0) >= 0.5) {
    pushCandidate(sensoryCandidates, '言葉が出る前に自分で少し引いている', fused.selfSilencing);
  }

  if (
    ((fused.ember ?? 0) >= 0.3 && (fused.hesitation ?? 0) >= 0.2)
    || /(?:出したい|やりたい|作りたい|書きたい)/.test(userText)
  ) {
    pushCandidate(
      narrativeCandidates,
      '出したいものは残っているが、前に出す手前でためらっている',
      ((fused.ember ?? 0) * 0.55) + ((fused.hesitation ?? 0) * 0.45)
    );
  }
  if (
    ((fused.unfinishedPull ?? 0) >= 0.3 && (lexical.resignation ?? 0) >= 0.2)
    || /(?:諦め|無理|残って|気になる)/.test(userText)
  ) {
    pushCandidate(
      narrativeCandidates,
      '諦めかけているが、まだ切り離せていない',
      ((fused.unfinishedPull ?? 0) * 0.7) + ((lexical.resignation ?? 0) * 0.3)
    );
  }
  if (
    ((fused.guardedness ?? 0) >= 0.3 && (fused.reachability ?? 0) >= 0.2)
    || /(?:怖|笑われ|届|出したい|見せたい)/.test(userText)
  ) {
    pushCandidate(
      narrativeCandidates,
      '守りを残しつつ、届く形を探している',
      ((fused.guardedness ?? 0) * 0.5) + ((fused.reachability ?? 0) * 0.5)
    );
  }
  if ((fused.selfSilencing ?? 0) >= 0.35 || /(?:引っ込|合わせる|自分がいなくなる)/.test(userText)) {
    pushCandidate(
      narrativeCandidates,
      '自分を引っ込めて場を乱さないようにしている',
      fused.selfSilencing
    );
  }
  if (
    ((fused.pressure ?? 0) >= 0.35 && (fused.ember ?? 0) >= 0.3)
    || /(?:急ぐ|壊れそう|怖|進みたい)/.test(userText)
  ) {
    pushCandidate(
      narrativeCandidates,
      '急ぎと怖さのあいだで、火を消さない持ち方を探している',
      ((fused.pressure ?? 0) * 0.6) + ((fused.ember ?? 0) * 0.4)
    );
  }
  if (
    ((lexical.unfinished ?? 0) >= 0.2 && (lexical.reach ?? 0) >= 0.2)
    || /(?:残って|消したくない|違和感)/.test(userText)
  ) {
    pushCandidate(
      narrativeCandidates,
      '終わったことにせず、残っている向きを持ち続けている',
      ((lexical.unfinished ?? 0) * 0.55) + ((lexical.reach ?? 0) * 0.45)
    );
  }

  if (normalizedContext.dominantBeliefAxis === 'holding' || normalizedContext.dominantBeliefAxis === 'presence') {
    pushCandidate(narrativeCandidates, '壊さずに持つことを優先している', 0.42);
  }
  if (normalizedContext.dominantBeliefAxis === 'illumination') {
    pushCandidate(narrativeCandidates, 'まだ見えていない核を照らそうとしている', 0.4);
  }
  if (normalizedContext.dominantTensionAxis === 'preverbal') {
    pushCandidate(narrativeCandidates, 'まだ文章になる前の輪郭を守っている', 0.44);
  }
  if ((normalizedContext.identityKey || '').includes('creative') && (fused.ember ?? 0) >= 0.35) {
    pushCandidate(narrativeCandidates, '小さくても、創作の芯はまだ消していない', 0.43);
  }
  if (/違和感/.test(userText)) {
    pushCandidate(sensoryCandidates, '小さな引っかかりが皮膚の近くに残っている', 0.46);
  }
  if (/壊れそう/.test(userText)) {
    pushCandidate(sensoryCandidates, '急ぐと崩れそうな薄さがある', 0.47);
  }
  if (/笑われ/.test(userText)) {
    pushCandidate(sensoryCandidates, '外の視線に触れる前で身を引いている', 0.49);
  }

  const sensory = finalizeCandidates(sensoryCandidates);
  const narrative = finalizeCandidates(narrativeCandidates);

  return {
    sensory: sensory.length ? sensory : ['まだ言葉になる前の感触がうっすら残っている'],
    narrative: narrative.length ? narrative : ['まだ決め切らずに持っておきたい意味が残っている'],
  };
};
