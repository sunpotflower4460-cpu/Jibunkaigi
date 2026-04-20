import test from 'node:test';
import assert from 'node:assert/strict';

import { AGENT_MATERIALS } from '../agents/registry.js';
import { getJoeReentry } from '../agents/joe/reentry.js';
import { getRayReentry } from '../agents/ray/reentry.js';
import { getKenReentry } from '../agents/ken/reentry.js';
import { getMinaReentry } from '../agents/mina/reentry.js';
import { getSatouReentry } from '../agents/satou/reentry.js';
import { activateJoe } from './activate.js';
import { activateGeneric } from './activateGeneric.js';

const CASES = [
  {
    name: 'joe leans toward fear/freeze tags',
    getter: getJoeReentry,
    state: { fear: 0.9, freeze: 0.8, unfinished: 0.2 },
    expectedTags: ['fear', 'freeze'],
  },
  {
    name: 'ray leans toward reach/unfinished tags',
    getter: getRayReentry,
    state: { reach: 0.8, unfinished: 0.7, desire: 0.1 },
    expectedTags: ['reach', 'unfinished'],
  },
  {
    name: 'ken leans toward desire/reach tags',
    getter: getKenReentry,
    state: { desire: 0.85, reach: 0.7, selfErasure: 0.1 },
    expectedTags: ['desire', 'reach'],
  },
  {
    name: 'mina leans toward shame/self-erasure tags',
    getter: getMinaReentry,
    state: { shame: 0.9, selfErasure: 0.75, fear: 0.3 },
    expectedTags: ['shame', 'selfErasure'],
  },
  {
    name: 'satou leans toward resignation/fear tags',
    getter: getSatouReentry,
    state: { resignation: 0.9, fear: 0.7, selfErasure: 0.2 },
    expectedTags: ['resignation', 'fear'],
  },
];

for (const scenario of CASES) {
  test(`reentry scoring: ${scenario.name}`, () => {
    const result = scenario.getter(scenario.state, { random: () => 0 });

    assert.ok(result.selected);
    assert.ok(Array.isArray(result.allCandidates));
    assert.ok(result.allCandidates.length >= 4);
    assert.equal(result.selected.text, result.allCandidates[0].text);
    scenario.expectedTags.forEach((tag) => {
      assert.ok(result.selected.tags.includes(tag));
    });
    assert.ok(result.allCandidates[0].score >= result.allCandidates[1].score);
    assert.ok(Array.isArray(result.allCandidates[0].breakdown));
  });
}

test('activateGeneric threads structured reentry and debug candidates', () => {
  const originalRandom = Math.random;
  Math.random = () => 0;

  try {
    const activated = activateGeneric('creative', {
      fear: 0.9,
      freeze: 0.8,
      unfinished: 0.2,
    });

    assert.equal(typeof activated?.reentry?.text, 'string');
    assert.ok(Array.isArray(activated?.reentry?.tags));
    assert.ok(Array.isArray(activated?.debug?.reentryCandidates));
    assert.equal(
      activated.reentry.text,
      activated.debug.reentryCandidates[0].text,
    );
  } finally {
    Math.random = originalRandom;
  }
});

test('activateJoe keeps composed reentry as the canonical runtime path', () => {
  const activated = activateJoe(
    { fear: 0.9, freeze: 0.8, unfinished: 0.2 },
    {
      microSignals: {
        punctuation: { hesitation: 1, trailOff: 0, assertion: 0 },
      },
    },
  );

  assert.equal(typeof activated?.reentry?.text, 'string');
  assert.ok(Array.isArray(activated?.reentry?.tags));
  assert.ok(Array.isArray(activated?.reentry?.composition?.parts));
  assert.deepEqual(
    activated.reentry.composition,
    activated.debug.reentryComposition,
  );
});

test('activateGeneric creative path does not fall back to legacy getJoeReentry', () => {
  const originalGetReentry = AGENT_MATERIALS.creative.getReentry;
  AGENT_MATERIALS.creative.getReentry = () => {
    throw new Error('legacy getJoeReentry should not run on creative runtime activation');
  };

  try {
    const activated = activateGeneric(
      'creative',
      { fear: 0.9, freeze: 0.8, unfinished: 0.2 },
      {
        microSignals: {
          punctuation: { hesitation: 1, trailOff: 0, assertion: 0 },
        },
      },
    );

    assert.equal(typeof activated?.reentry?.text, 'string');
    assert.ok(Array.isArray(activated?.reentry?.composition?.parts));
    assert.deepEqual(
      activated.reentry.composition,
      activated.debug.reentryComposition,
    );
  } finally {
    AGENT_MATERIALS.creative.getReentry = originalGetReentry;
  }
});

test('joe reentry uses hesitation micro-signal to strengthen freeze variants', () => {
  const baseline = getJoeReentry(
    { state: { desire: 0.38, reach: 0.35, freeze: 0.27, unfinished: 0.27, fear: 0.05 } },
    { random: () => 0 },
  );
  const withMicroSignals = getJoeReentry(
    {
      state: { desire: 0.38, reach: 0.35, freeze: 0.27, unfinished: 0.27, fear: 0.05 },
      microSignals: {
        punctuation: { hesitation: 1, trailOff: 0, assertion: 0 },
        fillers: { fillerDensity: 0 },
        negationPrefix: { softNegation: 0 },
        sentenceLength: { burstiness: 0, shortnessPressure: 0 },
        selfHedging: { epistemicLowering: 0 },
        quotation: { distancing: 0 },
      },
    },
    { random: () => 0 },
  );
  const baselineFreezeCandidate = baseline.allCandidates.find(
    (candidate) => candidate.tags.includes('freeze') && candidate.tags.includes('unfinished'),
  );
  const fusedFreezeCandidate = withMicroSignals.allCandidates.find(
    (candidate) => candidate.tags.includes('freeze') && candidate.tags.includes('unfinished'),
  );

  assert.ok(baselineFreezeCandidate);
  assert.ok(fusedFreezeCandidate);
  assert.ok(fusedFreezeCandidate.score > baselineFreezeCandidate.score);
  assert.ok(
    fusedFreezeCandidate.score - baselineFreezeCandidate.score >= 0.15,
  );
});
