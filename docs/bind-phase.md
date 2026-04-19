# Bind Phase - 顕在層 v0.1 Phase 5

## Overview

The **bind phase** is the fifth phase of the 顕在層 (manifest layer) v0.1 implementation. Its purpose is to **connect activated thought particles into small meaningful clusters** based on their relations.

## Critical Principles

### 1. Bind は「最終選択」ではない (Bind is NOT Final Selection)

The bind phase does NOT:
- Make final selection decisions (that comes in the `select` phase)
- Determine what to actually speak
- Generate complete utterances or responses

The bind phase DOES:
- Group activated thoughts into meaningful clusters based on relations
- Preserve both bound clusters and single clusters
- Calculate cluster scores for later selection

### 2. Bind は完成文生成ではない (Bind Does NOT Generate Complete Sentences)

This phase works with **thought clusters**, not complete responses:
- Clusters are groups of related thought particles
- They are NOT complete sentences
- The actual utterance generation happens later in the pipeline

### 3. 今回は Thought だけ (Thought Particles Only for Phase 5)

Phase 5 focuses ONLY on **thought particles**:
- Feeling particles: not yet (future phase)
- Move particles: not yet (future phase)
- Select phase: not yet implemented

### 4. Relation があるものをまず優先する (Relations-Based Binding)

Bind decisions are based on **NodeRelation** data:
- If two activated thoughts have a relation between them, consider binding
- Calculate bind score from relation weight + activation scores
- If score >= threshold, create bound cluster
- Otherwise, keep as single clusters

### 5. 単独粒子も残す (Single Clusters are Preserved)

Unbound thoughts are NOT discarded:
- They remain as `single` clusters
- They can still be selected in future phases
- Single clusters may be more relevant than bound clusters

### 6. Tensions_with も切り捨てない (Preserve Friction Clusters)

`tensions_with` relations are NOT excluded:
- They are bound like other relation types
- The cluster preserves the `tensions_with` relationTypes
- Future select phase can decide how to handle friction
- 対立しているから切る ではなく、摩擦込みでひとつの塊として保持する

## Implementation

### Input: BindThoughtsInput

```javascript
{
  activatedThoughts: [
    {
      nodeId: string,
      owner: "shared" | "joe" | "ken" | "mina" | "ray" | "satou" | "mirror",
      textSeed: string,
      score: number,
      reasons: string[],
      dominantAxis: string[]
    }
  ],
  relations: [
    {
      id: string,
      from: string,
      to: string,
      relationType: "supports" | "softens" | "tensions_with" | "grounds" | "extends",
      weight: number
    }
  ],
  bindThreshold?: number  // Default: 0.35
}
```

### Output: BindThoughtsResult

```javascript
{
  clusters: [
    {
      id: string,
      thoughtIds: string[],
      relationIds: string[],
      clusterType: "single" | "bound",
      score: number,
      dominantAxis: string[],
      relationTypes: string[]
    }
  ],
  clusterMeta: {
    totalActivatedThoughts: number,
    totalClusters: number,
    boundClusterCount: number,
    singleClusterCount: number
  }
}
```

### Bind Score Calculation

```
bindScore = relation.weight * 0.5 + fromActivationScore * 0.25 + toActivationScore * 0.25
```

This combines:
- Relation strength (50%)
- Both thoughts' activation scores (25% each)

If `bindScore >= bindThreshold`, create bound cluster. Otherwise, keep as singles.

### Binding Strategy: Pair Binding Only

Phase 5 uses **simple pair binding**:
- For each relation, check if both ends are activated
- If yes and score >= threshold, bind them into one cluster
- Mark both thoughts as "bound" to prevent re-binding
- No complex graph clustering (that's for future phases)

This keeps the implementation simple and predictable.

### Relation Type Handling

All relation types are treated similarly in Phase 5:

#### supports
- かなり結びやすい (binds easily)
- Creates supportive clusters

#### extends
- 結びやすい (binds easily)
- Creates extending clusters

#### grounds
- 結びやすいが、少し grounding 寄り (binds easily, grounding-oriented)
- Creates grounding clusters

#### softens
- 結びつくが、強い一体化ではなく少し緩やか (binds but loosely)
- Creates softening clusters

#### tensions_with
- 結びつくが、摩擦を含む cluster として扱う (binds but as friction cluster)
- **切り離さない** (NOT separated)
- Preserved for future select phase to handle appropriately

## Integration in runInternalOS.js

The bind phase runs **after activate and before select**:

```
前提層 (Precondition Layers)
→ Home → Existence → Belief → Tension
→ PreconditionFilter → PreconditionBias
→ Field → Reaction → Stance → Decision
→ emergingField
→ activateThoughts (Phase 4)
→ bindThoughts (Phase 5)        ← NEW
→ (future: select)
→ surface translation
```

### Integration Code

```javascript
// After activateThoughts
const nodeRelations = getNodeRelations(agentId);
const boundThoughtsResult = bindThoughts({
  activatedThoughts: activatedThoughts.items,
  relations: nodeRelations,
  bindThreshold: 0.35,
});

const boundThoughts = {
  clusters: boundThoughtsResult.clusters || [],
  clusterMeta: boundThoughtsResult.clusterMeta || {
    totalActivatedThoughts: 0,
    totalClusters: 0,
    boundClusterCount: 0,
    singleClusterCount: 0,
  },
};
```

## Compare/Debug Visibility

### New Fields in buildCompareViewModel

```javascript
boundThoughtsPreview: {
  boundThoughtClusterCount: number,
  singleThoughtClusterCount: number,
  totalClusters: number,
  totalActivatedThoughts: number,
  topBoundCluster: {
    thoughtIds: string[],
    relationTypes: string[],
    dominantAxis: string[],
    score: number
  } | null,
  relationTypesPreview: string[],
  dominantClusterAxes: string[]
}
```

### Debug Display Format

```
clusters: bound=2 / single=3
top bound: shared_t01 + joe_t02
relation: supports
axes: illumination, reflection
```

What to watch for:
- Are relations actually binding thoughts?
- Are we getting only singles (no binding happening)?
- Are tensions_with being preserved, not dropped?

## What This Phase Does NOT Do

- **Does NOT implement select** (choosing which clusters to speak)
- **Does NOT activate feeling/move particles** (thought only in Phase 5)
- **Does NOT do complex graph clustering** (just pair binding)
- **Does NOT connect to lengthPlan**
- **Does NOT generate final utterances**

## Testing Requirements

Minimum test coverage:
1. ✅ Null-safe operation (empty inputs)
2. ✅ Creates single clusters when no relations
3. ✅ Binds thoughts when relation exists and score >= threshold
4. ✅ Keeps singles when score < threshold
5. ✅ Preserves tensions_with relation type
6. ✅ Handles all relation types (supports, extends, grounds, softens, tensions_with)
7. ✅ Does not bind if only one side is activated
8. ✅ Sorts clusters by score (descending)

## Next Steps

After Phase 5 (current):
- **Phase 6**: Implement `select` - choosing which bound/single clusters to actually speak
- **Phase 7**: Integrate feeling and move particles into bind
- **Phase 8**: Advanced graph clustering (if needed)
- **Phase 9**: Connect selected clusters to surface generation

## Key Files

- `src/runtime/bindThoughts.js` - Main bind logic
- `src/runtime/bindThoughts.test.js` - Tests
- `src/runtime/runInternalOS.js` - Integration point (after activate, before select)
- `src/runtime/internalState.js` - State shape for boundThoughts
- `src/runtime/buildCompareViewModel.js` - Debug/compare visibility
- `src/reservoir/loadReservoir.js` - Relations loading via getNodeRelations()
- `src/reservoir/relations/sharedRelations.js` - Shared relations
- `src/reservoir/relations/agentRelations.js` - Agent-specific relations

## Philosophy

The bind phase embodies the principle of **meaning-based clustering over forced grouping**:
- Thoughts **naturally cluster** based on existing relations
- Single thoughts are **equally valid** as bound clusters
- Friction and tension are **preserved**, not eliminated
- Simple pair binding is **sufficient** for Phase 5 - complexity later if needed

This creates a foundation where meaning emerges from natural connections, rather than being imposed top-down. What gets bound reflects the actual semantic structure of the thought reservoir, not arbitrary grouping rules.
