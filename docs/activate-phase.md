# Activate Phase - 顕在層 v0.1 Phase 4 + L2

## Overview

The **activate phase** is the fourth phase (plus L2 reinforcement) of the 顕在層 (manifest layer) v0.1 implementation. Its purpose is to determine **which thought/feeling/move particles naturally rise to attention** given the current context.

## Critical Principles

### 1. Activate は「選択」ではない (Activate is NOT Selection)

The activate phase does NOT:
- Make final selection decisions (that comes in the `select` phase)
- Generate complete utterances or responses
- Directly output text to the user

The activate phase DOES:
- Surface thought particles that are **likely to rise** in the current context
- Score particles based on multiple factors (triggers, resonance, affinity)
- Return a ranked list of activated thoughts for downstream processing

### 2. Activate は完成文生成ではない (Activate Does NOT Generate Complete Sentences)

This phase works with **thought particles** (seeds), not complete responses:
- Thought particles are brief seeds like "what is being compared, what feels lost"
- They are NOT complete sentences like "You seem to be comparing yourself to others"
- The actual utterance generation happens later in the pipeline

### 3. Anti-triggers は Activate 段階で効かせる (Anti-triggers Work at Activate Stage)

Anti-triggers are applied **during activation scoring**, not during selection:
- They **reduce the activation score** of particles
- They do NOT completely eliminate particles (soft suppression)
- This allows other candidates to naturally come forward

### 4. 加算式でスコアリング (Additive Scoring Formula)

Activation uses an **additive scoring approach** for soft, natural emergence.

**For thoughts:**
```
activationScore =
  baseScore (node weight)
  + triggerMatch * 0.4      // matches with userText, attentionTargets, atmosphere
  + agentAffinity * 0.2     // owner === agentId gets slight boost
  + resonanceMatch * 0.2    // matches with belief/tension axes
  + bodyAffinity * 0.2      // gentle body signal affinity
  - antiTriggerMatch * 0.5  // suppression when anti-triggers match
```

**For feelings (bodyAffinity elevated):**
```
activationScore =
  baseScore (node weight)
  + triggerMatch * 0.4
  + agentAffinity * 0.2
  + resonanceMatch * 0.15   // slightly reduced
  + bodyAffinity * 0.25     // ← elevated for feelings
  - antiTriggerMatch * 0.5
```

**For moves (focusPacing elevated):**
```
activationScore =
  baseScore (node weight)
  + triggerMatch * 0.4
  + agentAffinity * 0.2
  + resonanceMatch * 0.15   // slightly reduced
  + focusPacingAffinity * 0.25  // ← elevated for moves (slowDown, oneThreadBias)
  - antiTriggerMatch * 0.5
```

This creates a **gradient of activation** rather than binary yes/no.

### 5. 3カテゴリ同時 Activation (L2 Phase: Three Categories)

Phase 4 initially focused on **thought particles only**. L2 Phase added:
- ✅ **Feeling particles**: body-primary activation (higher bodyAffinity weight)
- ✅ **Move particles**: focus/pacing-primary activation (focusPacingAffinity)
- ✅ All three categories activate in the same pipeline
- ⏸️ Bind phase: not yet implemented
- ⏸️ Select phase: not yet implemented
- ⏸️ Mixed bind (thought+feeling+move): future phase

## Implementation

### activateThoughts

#### Input: ActivateThoughtsInput

```javascript
{
  agentId: "joe" | "ken" | "mina" | "ray" | "satou" | "mirror",
  userText: string,
  preconditionBias: {
    dominantBeliefAxis?: string | null,
    identity?: { identityKey?: string | null, recalledTraits?: string[] },
    focus?: { oneThreadBias?: number, antiOverExpansion?: number },
    pacing?: { slowDown?: number, returnBias?: number },
    meaning?: { dominantBeliefAxis?: string | null }
  } | null,
  beliefTension: {
    dominantTensionAxis?: string | null,
    totalTensionStrength?: number,
    activeTensions?: Array<{
      beliefId: string,
      tensionType: "friction" | "violation" | "pull" | "protection",
      strength: number,
      axis?: string | null
    }>
  } | null,
  emergingField: {
    attentionTargets: string[],      // keywords from userText + tension axes
    resonanceAxes: string[],         // from beliefCore, beliefBranch, beliefTension
    bodySignals: {                   // mapped from field state
      tension: number,
      softness: number,
      hesitation: number,
      urgency: number,
      warmth: number,
      contraction: number
    },
    atmosphere: string[]             // derived from stance + reaction
  } | null
}
```

#### Output: ActivateThoughtsResult

```javascript
{
  activatedThoughts: [
    {
      nodeId: string,
      owner: "shared" | "joe" | "ken" | "mina" | "ray" | "satou" | "mirror",
      textSeed: string,
      score: number,
      reasons: string[],    // for debug: ["trigger-match", "owner-match", etc.]
      dominantAxis: string[]
    }
  ],
  topThoughtIds: string[],
  activationMeta: {
    totalCandidates: number,
    selectedCount: number,
    dominantAxes: string[]
  }
}
```

### activateFeelings (L2 Phase)

Uses the same input structure but:
- Returns `activatedFeelings` instead of `activatedThoughts`
- Returns `topFeelingIds` instead of `topThoughtIds`
- Uses elevated `bodyAffinity` weight (0.25 vs 0.2)
- Processes feeling particles from reservoir

### activateMoves (L2 Phase)

Uses the same input structure but:
- Returns `activatedMoves` instead of `activatedThoughts`
- Returns `topMoveIds` instead of `topThoughtIds`
- Uses `focusPacingAffinity` (0.25 weight) based on:
  - `preconditionBias.pacing.slowDown` → matches "pausing", "holding" tags
  - `preconditionBias.focus.oneThreadBias` → matches "focus", "single" tags
- Processes move particles from reservoir

### Scoring Components

#### triggerMatch (weight: 0.4)
Matches node triggers against:
- `userText` (full match: 1.0)
- `attentionTargets` (match: 0.7)
- `atmosphere` (match: 0.5)

#### agentAffinity (weight: 0.2)
- `owner === "shared"`: 0.10 (neutral)
- `owner === agentId`: 0.20 (slight boost)
- `owner === other agent`: 0.05 (small boost)

This ensures both shared and agent-specific thoughts can activate, while giving slight preference to the agent's own particles.

#### resonanceMatch (weight: 0.2)
Matches node axes against:
- `dominantBeliefAxis` (match: 0.5)
- `dominantTensionAxis` (match: 0.4)
- `resonanceAxes` (match: 0.3)

#### bodyAffinity (weight: 0.2)
**Gentle influence** for thought particles (not body-primary):
- Tags like "loss", "protection" → boost from `contraction`
- Tags like "urgency", "pressure" → boost from `urgency`
- Tags like "care", "holding" → boost from `warmth`

Returns a **small positive value** even without matches (doesn't kill non-body thoughts).

#### antiTriggerMatch (weight: -0.5)
Checks if node's `antiTriggers` match:
- `userText` (full match: -1.0)
- `attentionTargets` (match: -0.8)
- `atmosphere` (match: -0.6)
- `bodySignals` (contextual: -0.5)

**Reduces score but doesn't eliminate** - allows natural suppression.

## Integration in runInternalOS.js

The activate phase runs **after decision layer** and **before surface generation**:

```
前提層 (Precondition Layers)
→ Home → Existence → Belief → Tension
→ PreconditionFilter → PreconditionBias
→ Field → Reaction → Stance → Decision
→ emergingField (NEW)           ← synthesize context
→ activateThoughts (Phase 4)    ← thought activation
→ activateFeelings (L2 Phase)   ← feeling activation
→ activateMoves (L2 Phase)      ← move activation
→ (future: bind, select)
→ surface translation
```

### emergingField Construction

Built from dynamic state:
- **attentionTargets**: keywords from `userText` + tension axes
- **resonanceAxes**: from `beliefCore`, `beliefBranch`, `beliefTension`
- **bodySignals**: mapped from `field` state
- **atmosphere**: derived from high `stance` + `reaction` values

## Compare/Debug Visibility

### New Fields in buildCompareViewModel

**Thoughts:**
```javascript
activatedThoughtsPreview: {
  activatedThoughtCount: number,      // e.g., 5
  totalCandidates: number,            // e.g., 30
  topThoughtIds: string[],            // ["shared-thought-001", "joe-thought-002", ...]
  dominantThoughtAxes: string[],      // ["illumination", "structure"]
  thoughtActivationReasons: [...]
}
```

**Feelings (L2 Phase):**
```javascript
activatedFeelingsPreview: {
  activatedFeelingCount: number,
  totalCandidates: number,
  topFeelingIds: string[],
  dominantFeelingAxes: string[],
  feelingActivationReasons: [...]
}
```

**Moves (L2 Phase):**
```javascript
activatedMovesPreview: {
  activatedMoveCount: number,
  totalCandidates: number,
  topMoveIds: string[],
  dominantMoveAxes: string[],
  moveActivationReasons: [...]
}
```

### Debug Display Format

```
activated thoughts: 5 / 30, top: shared_t03, joe_t02, axes: illumination
activated feelings: 4 / 21, top: shared_f02, joe_f01, axes: holding
activated moves: 3 / 21, top: mina_m01, shared_m03, axes: presence
```

## What This Phase Does NOT Do

- **Does NOT implement bind** (connecting thoughts/feelings/moves into coherent structures)
- **Does NOT implement select** (choosing final particles to speak)
- **Does NOT implement mixed bind** (thought+feeling+move combinations - future phase)
- **Does NOT connect to lengthPlan** (bind/select will use it)
- **Does NOT directly output particles as utterances**

## Testing Requirements

Minimum test coverage for all three categories:

**Thoughts:**
1. ✅ Null-safe operation
2. ✅ Processes both shared + agent thoughts
3. ✅ Agent-owned thoughts get slight boost
4. ✅ dominantBeliefAxis increases score on match
5. ✅ antiTriggers reduce score on match
6. ✅ Results limited to topN
7. ✅ Includes reasons for debug

**Feelings (L2 Phase):**
1. ✅ Null-safe operation
2. ✅ Processes both shared + agent feelings
3. ✅ Agent-owned feelings get slight boost
4. ✅ bodyAffinity increases score based on body signals
5. ✅ antiTriggers reduce score on match
6. ✅ Results limited to topN
7. ✅ Includes reasons for debug

**Moves (L2 Phase):**
1. ✅ Null-safe operation
2. ✅ Processes both shared + agent moves
3. ✅ Agent-owned moves get slight boost
4. ✅ focusPacingAffinity increases score based on pacing/focus
5. ✅ antiTriggers reduce score on match
6. ✅ Results limited to topN
7. ✅ Includes reasons for debug

## Next Steps

After Phase 4 + L2 (current):
- **Phase 5**: Implement `bind` - connecting activated particles into coherent structures
- **Phase 6**: Implement `select` - choosing which bound structures to actually speak
- **Future**: Implement mixed bind (thought+feeling+move combinations)
- **Phase 8**: Connect to surface generation with particle-aware translation

## Key Files

**Core Activation:**
- `src/runtime/activateThoughts.js` - Thought activation logic
- `src/runtime/activateFeelings.js` - Feeling activation logic (L2 Phase)
- `src/runtime/activateMoves.js` - Move activation logic (L2 Phase)
- `src/runtime/activateThoughts.test.js` - Thought tests
- `src/runtime/activateFeelings.test.js` - Feeling tests (L2 Phase)
- `src/runtime/activateMoves.test.js` - Move tests (L2 Phase)

**Integration:**
- `src/runtime/runInternalOS.js` - Integration point (after decision, before surface)
- `src/runtime/internalState.js` - State shape for activated particles
- `src/runtime/buildCompareViewModel.js` - Debug/compare visibility

**Reservoir:**
- `src/reservoir/loadReservoir.js` - Particle loading
- `src/reservoir/shared/thoughtNodes.js` - Shared thought particles (5)
- `src/reservoir/shared/feelingNodes.js` - Shared feeling particles (6)
- `src/reservoir/shared/moveNodes.js` - Shared move particles (6)
- `src/reservoir/agents/{agent}/thoughtNodes.js` - Agent thoughts (5 each)
- `src/reservoir/agents/{agent}/feelingNodes.js` - Agent feelings (3 each)
- `src/reservoir/agents/{agent}/moveNodes.js` - Agent moves (3 each)

## Philosophy

The activate phase embodies the principle of **natural emergence over forced selection**:
- Particles **rise** rather than being **chosen**
- Multiple factors create a **gradient of likelihood**
- Anti-triggers create **soft suppression** rather than hard blocks
- Both shared and agent particles participate, creating **authentic multiplicity**
- **Three categories activate simultaneously** (thought/feeling/move) with category-appropriate weighting

This is the foundation for authentic, particle-based response generation where what is said emerges from what naturally comes to attention, rather than being constructed top-down.
