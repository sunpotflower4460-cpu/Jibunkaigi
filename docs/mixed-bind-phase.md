# Mixed Bind Phase - 顕在層 v0.1 Mixed Cluster Minimum Implementation

## Overview

The **mixed bind phase** is an extension to the 顕在層 (manifest layer) v0.1 implementation. Its purpose is to **connect activated thought/feeling/move particles into small meaningful mixed clusters** based on their relations, creating natural internal coherence.

## Purpose

現在は、thought / feeling / move が別々に activate されています。
でもこのままだと、

* thought は thought のまま
* feeling は feeling のまま
* move は move のまま

で、一つの内的まとまりとして結晶していません。

**今回の目的は、thought / feeling / move を relation と近接性で結び、mixed cluster を作ることです。**

これにより、「考えだけ」「感情だけ」ではない、自然な内的まとまり が生まれます。

## Critical Principles

### 1. Mixed Bind は最終発話ではない (Mixed Bind is NOT Final Utterance)

The mixed bind phase does NOT:
- Generate complete utterances or responses
- Make final selection decisions
- Replace the thought-only bind

The mixed bind phase DOES:
- Group thought/feeling/move particles into mixed clusters
- Use relations to connect different node types
- Preserve both bound mixed clusters and single clusters
- Create a foundation for future mixed selection

### 2. 完成文を作らない (Does NOT Create Complete Sentences)

Clusters are意味のまとまり (semantic units), not utterances:
- They are NOT sentences to be read aloud
- They represent internal coherence
- Actual utterance generation happens later

### 3. Relation を優先し、推測 Bind は最小にする (Relations-First, Minimal Inference)

Binding is based on **explicit relations**:
- Primarily use existing NodeRelation data
- Avoid "it seems like these should bind" guessing
- Keep inference minimal in this first implementation

### 4. Thought-Only Bind を壊さない (Preserve Thought-Only Bind)

The existing thought-only bind remains:
- Mixed bind is an **additional layer**
- Not a replacement for thought clustering
- Both can coexist during the transition period

### 5. Single も残す (Single Clusters are Preserved)

Unbound nodes are NOT discarded:
- They remain as `single` clusters
- Feeling-only and move-only singles are valid
- Not everything needs to bind into mixed clusters

### 6. Thought を核にする (Thought-Centered Clustering)

Phase 1 of mixed bind uses **thought-centered grouping**:
- Start with an activated thought
- Find feelings/moves connected by relations
- Bind them to the thought as a cluster

形式:
- thought 1個
- そこに結びつく feeling 0〜2個
- そこに結びつく move 0〜2個

### 7. Tensions_with を消さない (Preserve Friction Clusters)

`tensions_with` relations are preserved:
- They represent natural internal friction
- Contradictions are part of coherent clusters
- 矛盾を含んだまま一つの内的まとまりになる

Example:
- thought: "まだ残っている向き"
- move: "でも今は動きたくない"
- relation: tensions_with

これはかなり自然な塊です。摩擦を含む cluster として保持します。

## Implementation

### Input: BindMixedNodesInput

```javascript
{
  activatedThoughts: ActivatedNode[],
  activatedFeelings: ActivatedNode[],
  activatedMoves: ActivatedNode[],
  relations: NodeRelation[],
  bindThreshold?: number  // Default: 0.35
}

type ActivatedNode = {
  nodeId: string,
  category: "thought" | "feeling" | "move",
  owner: "shared" | "joe" | "ken" | "mina" | "ray" | "satou" | "mirror",
  textSeed: string,
  score: number,
  reasons: string[],
  dominantAxis: string[]
}
```

### Output: BindMixedNodesResult

```javascript
{
  clusters: MixedCluster[],
  clusterMeta: {
    totalActivatedNodes: number,
    totalClusters: number,
    boundClusterCount: number,
    singleClusterCount: number
  }
}

type MixedCluster = {
  id: string,
  thoughtIds: string[],
  feelingIds: string[],
  moveIds: string[],
  relationIds: string[],
  clusterType: "single" | "bound",
  score: number,
  dominantAxis: string[],
  relationTypes: string[]
}
```

### Mixed Bind Score Calculation

```
mixedBindScore =
  relation.weight * 0.4
  + thoughtScore * 0.25
  + linkedNodeScore * 0.20
  + axisOverlapBonus * 0.15
```

This combines:
- Relation strength (40%)
- Thought activation score (25%)
- Linked node (feeling/move) score (20%)
- Axis overlap bonus (15% max)

If `mixedBindScore >= bindThreshold`, create bound mixed cluster.

### Binding Strategy: Thought-Centered Grouping

The mixed bind uses **thought-centered grouping**:

1. For each activated thought
2. Find outgoing relations to activated feelings
3. Find outgoing relations to activated moves
4. Calculate bind scores
5. If score >= threshold, include in mixed cluster
6. Mark bound nodes to prevent re-binding

This is NOT complex graph clustering - just simple thought → feeling/move connections.

### Cluster Types

#### Bound Mixed Cluster
Contains:
- 1 thought
- 0-2 feelings (via relations)
- 0-2 moves (via relations)

Example:
```javascript
{
  id: "mixed_cluster_bound_joe-thought-001_joe-feeling-001_joe-move-001",
  thoughtIds: ["joe-thought-001"],
  feelingIds: ["joe-feeling-001"],
  moveIds: ["joe-move-001"],
  relationIds: ["rel-mixed-joe-001", "rel-mixed-joe-002"],
  clusterType: "bound",
  score: 0.75,
  dominantAxis: ["illumination", "presence"],
  relationTypes: ["supports", "grounds"]
}
```

#### Single Cluster
Contains only one node (thought, feeling, or move):

```javascript
{
  id: "mixed_cluster_single_mina-feeling-003",
  thoughtIds: [],
  feelingIds: ["mina-feeling-003"],
  moveIds: [],
  relationIds: [],
  clusterType: "single",
  score: 0.68,
  dominantAxis: ["holding"],
  relationTypes: []
}
```

## Integration in runInternalOS.js

The mixed bind phase runs **after thought/feeling/move activation and after thought-only bind**:

```
前提層 (Precondition Layers)
→ Home → Existence → Belief → Tension
→ PreconditionFilter → PreconditionBias
→ Field → Reaction → Stance → Decision
→ emergingField
→ activateThoughts (Phase 4)
→ activateFeelings (L2 Phase)
→ activateMoves (L2 Phase)
→ bindThoughts (Phase 5)
→ bindMixedNodes (Mixed Cluster Phase) ← NEW
→ (future: select with mixed)
→ surface translation
```

### Integration Code

```javascript
// After bindThoughts
const boundMixedNodesResult = bindMixedNodes({
  activatedThoughts: activatedThoughts.items,
  activatedFeelings: activatedFeelings.items,
  activatedMoves: activatedMoves.items,
  relations: nodeRelations,
  bindThreshold: 0.35,
});

const boundMixedNodes = {
  clusters: boundMixedNodesResult.clusters || [],
  clusterMeta: boundMixedNodesResult.clusterMeta || {
    totalActivatedNodes: 0,
    totalClusters: 0,
    boundClusterCount: 0,
    singleClusterCount: 0,
  },
};
```

## Relations: Thought-Feeling-Move Connections

Mixed clusters require relations between different node types.

### Added Relations

For each agent, added minimal relations:
- thought ↔ feeling: 1-2 relations
- thought ↔ move: 1-2 relations

Example (Joe):
```javascript
{
  id: 'rel-mixed-joe-001',
  from: 'joe-thought-001',  // "direction that remains, not erased"
  to: 'joe-feeling-001',     // "ember still warm"
  relationType: 'supports',
  weight: 0.72,
}
```

### Relation Types in Mixed Clusters

All relation types work in mixed clusters:

- **supports**: feeling/move supports the thought
- **grounds**: feeling/move grounds the thought
- **extends**: feeling/move extends the thought
- **softens**: feeling/move softens the thought
- **tensions_with**: feeling/move tensions with the thought (preserved, not removed)

## Compare/Debug Visibility

### New Fields in buildCompareViewModel

```javascript
boundMixedNodesPreview: {
  mixedClusterCount: number,
  mixedBoundClusterCount: number,
  mixedSingleClusterCount: number,
  totalActivatedNodes: number,
  topMixedCluster: {
    thoughtIds: string[],
    feelingIds: string[],
    moveIds: string[],
    relationTypes: string[],
    dominantAxis: string[],
    score: number
  } | null,
  mixedRelationTypes: string[],
  mixedClusterAxes: string[]
}
```

### Debug Display Format

```
mixed clusters: bound=3 / single=4
top mixed: joe_t04 + joe_f02 + joe_m01
axes: illumination, grounding
relations: supports, tensions_with
```

What to watch for:
- Are thought/feeling/move actually binding together?
- Are we getting only thought-only clusters (no mixed binding)?
- Are tensions_with being preserved in mixed clusters?
- Are single feeling/move clusters present?

## What This Phase Does NOT Do

- **Does NOT implement mixed select** (choosing which mixed clusters to speak)
- **Does NOT replace thought-only bind** (both coexist)
- **Does NOT do full option layer replacement**
- **Does NOT generate final utterances**
- **Does NOT implement advanced userSense**
- **Does NOT complete the mirror consolidation**

## Testing Requirements

Minimum test coverage:
1. ✅ Null-safe operation (empty inputs)
2. ✅ Creates single clusters for unbound nodes
3. ✅ Binds thought-feeling when relation exists
4. ✅ Binds thought-move when relation exists
5. ✅ Creates thought+feeling+move mixed cluster
6. ✅ Preserves tensions_with in mixed clusters
7. ✅ Respects bind threshold
8. ✅ Keeps unbound nodes as single clusters

## Next Steps

After Mixed Cluster Phase (current):
- **Mixed Select**: Choose which mixed clusters to speak
- **Option Layer**: Integrate mixed clusters into option selection
- **Surface Generation**: Generate utterances from mixed clusters
- **Full Migration**: Gradually move from thought-only to mixed-centered flow

## Key Files

- `src/runtime/bindMixedNodes.js` - Main mixed bind logic
- `src/runtime/bindMixedNodes.test.js` - Tests
- `src/runtime/runInternalOS.js` - Integration point
- `src/runtime/internalState.js` - State shape for boundMixedNodes
- `src/runtime/buildCompareViewModel.js` - Debug/compare visibility
- `src/reservoir/relations/agentRelations.js` - Thought-feeling-move relations
- `docs/bind-phase.md` - Original thought-only bind documentation

## Philosophy

The mixed bind phase embodies the principle of **natural internal coherence**:

- Thought/feeling/move **naturally cluster** based on real relations
- Not every node needs to bind - singles are valid
- Friction and tension are **preserved**, not eliminated
- Thought-centered approach is **simple and sufficient** for Phase 1
- Complexity can be added later if needed

これにより、「考えだけ」「感情だけ」ではない、
自然な内的まとまり が生まれます。

This creates a foundation where internal states emerge as coherent units, reflecting how thought, feeling, and directional inclination naturally bind together in actual inner experience.
