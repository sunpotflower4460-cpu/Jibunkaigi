import { blendLatentState, normalizeLatentState } from './afterglow.js';
import { bootSource } from './bootSource.js';
import { deconditionSource } from './deconditionSource.js';
import { returnHome } from './returnHome.js';
import { loadSelfSubstrate } from '../self/selfSubstrate.js';
import { coActivate } from './coActivate.js';
import { buildField } from './buildField.js';
import { bindEmergences } from './bindEmergences.js';
import { riseMeanings } from './riseMeanings.js';
import { decideUtterance } from './decideUtterance.js';
import { renderUtterance } from './renderUtterance.js';
import { mixLatentPatterns } from './routerMixer.js';
import { buildSurfaceWindow } from './surfaceWindow.js';

const buildRevision = ({ homeState, coActivation, fieldState, decisionState }) => {
  const topOther = coActivation.other_activations?.[0]?.id ?? null;
  const topSelf = coActivation.self_activations?.[0]?.id ?? null;
  const appliedPathways = [
    (fieldState.relationalField?.fragility ?? 0) > 0.4 ? 'belief:protecting_aliveness->field:fragility' : null,
    (fieldState.relationalField?.ambiguity ?? 0) > 0.35 && decisionState.shouldStayOpen ? 'field:ambiguity->stance:stay_open' : null,
    (homeState.homeVector?.overperformance ?? 0) > 0.12 ? 'home:overperformance->utterance:soften' : null,
    topOther && topSelf ? `other:${topOther}->self:${topSelf}` : null,
  ].filter(Boolean);

  return {
    stage: 'revision_thickening',
    appliedPathways,
    revisionProposal: {
      reinforce: appliedPathways.slice(0, 2),
      revisit: decisionState.withheldBias ?? [],
      reuseCandidates: [
        decisionState.replyIntent ? `stance:${decisionState.stance}->intent:${decisionState.replyIntent}` : null,
        `field:${((fieldState.relationalField?.fragility ?? 0) >= 0.45) ? 'fragility' : 'permission'}->utterance_shape`,
      ].filter(Boolean),
    },
  };
};

export function runCrystallizationRuntime(input, options = {}) {
  const normalizedInput = typeof input === 'string' ? input : '';
  const normalizedOptions = options && typeof options === 'object' ? options : {};
  const safePreviousMix = normalizedOptions.previousMix && typeof normalizedOptions.previousMix === 'object'
    ? normalizedOptions.previousMix
    : null;
  const safePreviousLatentState = normalizedOptions.previousLatentState && typeof normalizedOptions.previousLatentState === 'object'
    ? normalizedOptions.previousLatentState
    : null;

  const sourceState = bootSource({ source: normalizedOptions.source, input: normalizedInput });
  const deconditioned = deconditionSource(sourceState);
  const homeState = returnHome(deconditioned);
  const selfSubstrate = loadSelfSubstrate();
  const coActivation = coActivate(normalizedInput, { sourceState, homeState, selfSubstrate });
  const fieldState = buildField({ coActivation, homeState });
  const emergenceState = bindEmergences({ coActivation, fieldState });
  const meaningState = riseMeanings({ fieldState, emergenceState });
  const decisionState = decideUtterance(normalizedInput, {
    fieldState,
    coActivation,
    meaningState,
    homeState,
  });
  const utteranceState = renderUtterance(normalizedInput, {
    decisionState,
    meaningState,
    fieldState,
  });
  const revisionState = buildRevision({ homeState, coActivation, fieldState, decisionState });

  const freshLatentState = {
    field: fieldState.field,
    reaction: coActivation.reaction,
    stance: decisionState.stanceVector,
    permission: decisionState.permissionVector,
    relationalField: fieldState.relationalField,
    home: homeState.homeVector,
    source: {
      kind: sourceState.source,
      residualReflexStrength: deconditioned.residualReflexStrength,
    },
    selfDecision: {
      replyIntent: decisionState.replyIntent,
      stance: decisionState.stance,
      closeness: decisionState.closeness,
      answerDepth: decisionState.answerDepth,
      shouldAnswerQuestion: decisionState.shouldAnswerQuestion,
      shouldStayOpen: decisionState.shouldStayOpen,
    },
  };

  const previousLatentState = normalizeLatentState(safePreviousLatentState);
  const blendedLatentState = previousLatentState
    ? blendLatentState(previousLatentState, freshLatentState)
    : null;
  const latentState = previousLatentState
    ? {
      ...freshLatentState,
      field: blendedLatentState.field,
      reaction: blendedLatentState.reaction,
      stance: blendedLatentState.stance,
      permission: blendedLatentState.permission,
    }
    : freshLatentState;

  const patternMix = mixLatentPatterns(latentState, {
    previousMix: safePreviousMix,
  });
  const surfaceWindow = buildSurfaceWindow(latentState);
  const stageOrder = [
    'source_boot',
    'deconditioning',
    'home_return',
    'self_substrate',
    'co_activation',
    'field_formation',
    'binding_emergence',
    'meaning_rise',
    'self_decision',
    'utterance',
    'revision_thickening',
  ];

  return {
    latentState,
    surfaceWindow,
    patternMix,
    sourceState,
    deconditioned,
    homeState,
    selfSubstrate,
    coActivation,
    fieldState,
    emergenceState,
    meaningState,
    decisionState,
    utteranceState,
    revisionState,
    stageOrder,
    debugInfo: {
      version: 'crystallization-runtime-v1',
      inputLength: normalizedInput.length,
      optionKeys: Object.keys(normalizedOptions),
      dominantPattern: patternMix.dominant,
      usedAfterglow: Boolean(previousLatentState),
      source: sourceState.source,
      stageOrder,
      appliedPathways: revisionState.appliedPathways,
    },
  };
}
