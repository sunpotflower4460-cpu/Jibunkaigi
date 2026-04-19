# Activate Phase - 顕在層 v0.1 Phase 4

## Overview

The **activate phase** is the fourth phase of the 顕在層 (manifest layer) v0.1 implementation. Its purpose is to determine **which thought particles naturally rise to attention** given the current context.

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

Activation uses an **additive scoring approach** for soft, natural emergence:

```
activationScore =
  baseScore (node weight)
  + triggerMatch * 0.4      // matches with userText, attentionTargets, atmosphere
  + agentAffinity * 0.2     // owner === agentId gets slight boost
  + resonanceMatch * 0.2    // matches with belief/tension axes
  + bodyAffinity * 0.2      // gentle body signal affinity
  - antiTriggerMatch * 0.5  // suppression when anti-triggers match
```

This creates a **gradient of activation** rather than binary yes/no.

### 5. まずは Thought だけ (Thought Particles Only for Phase 4)

Phase 4 focuses ONLY on **thought particles**:
- Feeling particles: not yet (future phase)
- Move particles: not yet (future phase)
- Bind phase: not yet implemented
- Select phase: not yet implemented

## Implementation

### Input: ActivateThoughtsInput

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

### Output: ActivateThoughtsResult

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
→ activateThoughts (NEW)        ← Phase 4
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

```javascript
activatedThoughtsPreview: {
  activatedThoughtCount: number,      // e.g., 5
  totalCandidates: number,            // e.g., 20
  topThoughtIds: string[],            // ["shared-thought-001", "joe-thought-002", ...]
  dominantThoughtAxes: string[],      // ["illumination", "structure"]
  thoughtActivationReasons: [
    {
      nodeId: string,
      owner: string,
      score: number,
      reasons: string[]  // ["trigger-match", "owner-match", "axis-resonance"]
    }
  ]
}
```

### Debug Display Format

```
activated thoughts: 5 / 20
top: shared_t03, joe_t02, shared_t01
axes: illumination, reflection
reasons: trigger+resonance / owner+axis / tension-match
```

## What This Phase Does NOT Do

- **Does NOT implement bind** (connecting thoughts into coherent structures)
- **Does NOT implement select** (choosing final thoughts to speak)
- **Does NOT activate feeling/move particles** (thought only in Phase 4)
- **Does NOT connect to lengthPlan**
- **Does NOT directly output thoughts as utterances**

## Testing Requirements

Minimum test coverage:
1. ✅ Null-safe operation
2. ✅ Processes both shared + agent thoughts
3. ✅ Agent-owned thoughts get slight boost
4. ✅ dominantBeliefAxis increases score on match
5. ✅ antiTriggers reduce score on match
6. ✅ Results limited to topN
7. ✅ Includes reasons for debug

## Next Steps

After Phase 4 (current):
- **Phase 5**: Implement `bind` - connecting activated thoughts into coherent structures
- **Phase 6**: Implement `select` - choosing which bound structures to actually speak
- **Phase 7**: Integrate feeling and move particles into activation
- **Phase 8**: Connect to surface generation with particle-aware translation

## Key Files

- `src/runtime/activateThoughts.js` - Main activation logic
- `src/runtime/activateThoughts.test.js` - Tests
- `src/runtime/runInternalOS.js` - Integration point (after decision, before surface)
- `src/runtime/internalState.js` - State shape for activatedThoughts
- `src/runtime/buildCompareViewModel.js` - Debug/compare visibility
- `src/reservoir/loadReservoir.js` - Thought particle loading
- `src/reservoir/shared/thoughtNodes.js` - Shared thought particles
- `src/reservoir/agents/{agent}/thoughtNodes.js` - Agent-specific particles

## Philosophy

The activate phase embodies the principle of **natural emergence over forced selection**:
- Thoughts **rise** rather than being **chosen**
- Multiple factors create a **gradient of likelihood**
- Anti-triggers create **soft suppression** rather than hard blocks
- Both shared and agent particles participate, creating **authentic multiplicity**

This is the foundation for authentic, particle-based response generation where what is said emerges from what naturally comes to attention, rather than being constructed top-down.
