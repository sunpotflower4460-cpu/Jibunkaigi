# Select Phase - 顕在層 v0.1 Phase 6

## Purpose

**Select is NOT final utterance generation.**

Select determines **which thought clusters naturally rise to foreground** in this moment. It is a bridge between:
- **Input**: Bound thought clusters (from Phase 5)
- **Output**: Primary (+ optional secondary) clusters for consciousIntent

This is NOT about what to say or how to say it—that comes later. Select is about which thought clusters deserve attention **right now**.

## Core Principles

1. **select は「最終発話」ではない**
   - Select does NOT decide the final spoken text
   - It only decides which clusters move to foreground
   - Utterance generation happens in later phases

2. **1つに絞り切らなくてよい**
   - Can select primary + secondary (1-2 clusters total)
   - Not winner-takes-all
   - Natural foreground emergence, not forced competition

3. **others_field を軽く効かせる**
   - First phase where others_field has influence
   - Avoids redundancy with what others already said
   - Gives slight boost to novel angles
   - Enables 会議らしさ (conference-like interaction)

4. **anti-triggers は activate で処理済み**
   - Select does NOT re-evaluate anti-triggers
   - Works only with already-activated clusters
   - Suppression happened earlier

5. **自然さ最優先**
   - NOT an optimized selector
   - Natural emergence over clever algorithms
   - What would naturally come to mind?

## Function Signature

```javascript
selectThoughtClusters({
  agentId: 'joe',
  clusters: boundClusters,           // from Phase 5
  preconditionBias,                  // from precondition layers
  beliefTension,                     // from belief tension layer
  othersField: [],                   // gist/tone/force from other agents
  lengthPreference: 'medium',        // 'short' | 'medium' | 'long'
})
```

## Input

- `clusters` - Bound thought clusters (output of Phase 5)
- `preconditionBias` - Precondition bias for axis matching
- `beliefTension` - Belief tension for axis matching
- `othersField` - What others left in the field (gist/tone/force)
- `lengthPreference` - Influences primary/secondary selection

## Output

```javascript
{
  selected: [
    {
      clusterId: 'cluster_bound_thought1_thought2',
      score: 0.85,
      role: 'primary',
      reasons: ['high-cluster-score', 'belief-axis-match', 'novelty-in-field']
    },
    {
      clusterId: 'cluster_single_thought3',
      score: 0.62,
      role: 'secondary',
      reasons: ['tension-axis-match']
    }
  ],
  selectionMeta: {
    totalClusters: 5,
    selectedCount: 2,
    dominantSelectedAxis: ['illumination', 'holding']
  }
}
```

## Selection Scoring

```
selectionScore =
  clusterScore                       (base from Phase 5)
  + beliefAxisMatch * 0.25           (preconditionBias axis alignment)
  + tensionAxisMatch * 0.20          (beliefTension axis alignment)
  + othersNoveltyBonus * 0.15        (novel angle bonus)
  - othersRedundancyPenalty * 0.20   (redundancy penalty)
  + oneThreadFit * 0.10              (focus preference fit)
```

### Components

- **clusterScore**: Strength from bind phase
- **beliefAxisMatch**: Does cluster align with dominant belief axis?
- **tensionAxisMatch**: Does cluster align with dominant tension axis?
- **othersNoveltyBonus**: Is this angle not yet covered by others?
- **othersRedundancyPenalty**: Is this angle already well-covered?
- **oneThreadFit**: Does this fit focus preference? (penalty for secondary if oneThreadBias is high)

## others_field Influence

This is the **first phase where others_field matters**.

### How it works

1. **Redundancy Penalty**
   - If others used `hold`/`stay` force tags
   - AND current cluster has `holding`/`presence` axes
   - → Apply penalty (avoid repeating what's already in the field)

2. **Novelty Bonus**
   - If others haven't touched certain angles
   - AND current cluster has those angles
   - → Apply bonus (bring in what's missing)

3. **Complementary Boost**
   - If others used `clarify`/`ground` forces
   - AND current cluster has `structure` axis
   - → Slight boost (complementary, not redundant)

### Why Light Touch?

This is minimal implementation. others_field influence is intentionally gentle:
- Conference-like awareness begins here
- Avoids over-control
- Just enough to prevent exact repetition
- Allows natural variation

## Primary / Secondary Selection

### Primary Selection
- Always select highest-scoring cluster as primary
- Required

### Secondary Selection (conditional)
Secondary is selected only if:
1. `oneThreadBias < 0.6` (not too focused)
2. `lengthPreference !== 'short'`
3. Secondary score >= 0.45
4. Score gap with primary <= 0.25
5. Additional thresholds for medium/long preferences

### Length Preference
- `short`: Primary only
- `medium`: Primary + secondary if conditions met
- `long`: More permissive secondary threshold

## Connection to consciousIntent

Select prepares input for consciousIntent (future phase):

```javascript
{
  selectedClusterIds: ['cluster_joe_01'],
  dominantSelectedAxis: ['illumination'],
  selectedRoles: ['primary']
}
```

This is a **bridge**, not the final decision.

## Debug Output

Compare Mode shows:
- `selectedThoughtCount`: How many clusters selected (1-2)
- `primaryThoughtCluster`: Primary cluster ID + score + reasons
- `secondaryThoughtCluster`: Secondary cluster (if exists)
- `dominantSelectedAxis`: Axes of selected clusters
- `selectionReasons`: Why these clusters were selected
- `othersFieldInfluence`: How others_field affected selection

## What Select Does NOT Do

- ❌ Generate final utterance text
- ❌ Decide sentence structure
- ❌ Apply feeling/move (not implemented yet)
- ❌ Create lengthPlan
- ❌ Replace decisionLayer (just provides auxiliary input)

## Current Limitations (v0.1)

1. **No feeling/move integration**
   - Phase 6 only works with thought particles
   - Feeling/move particles come later

2. **others_field not fully wired**
   - Currently receives empty array in runInternalOS
   - Will be populated when multi-agent flow is complete

3. **No complete option layer**
   - Full option selection comes later
   - This is minimal cluster selection only

4. **Bridge to decisionLayer**
   - Not a full replacement
   - Provides auxiliary input for now

## Example Flow

```
User: "やりたいのに動けない"

Phase 4 (Activate):
- thought_1: illumination, "まだ消えていない力"
- thought_2: holding, "守りながら待つ"
- thought_3: structure, "構造を整理"
- thought_4: illumination, "切れていない糸"
- thought_5: grounding, "足元の現実"

Phase 5 (Bind):
- cluster_1: [thought_1, thought_4] - bound by "supports" relation
  - score: 0.75, axes: [illumination]
- cluster_2: [thought_2] - single
  - score: 0.65, axes: [holding]
- cluster_3: [thought_3] - single
  - score: 0.55, axes: [structure]
- cluster_4: [thought_5] - single
  - score: 0.45, axes: [grounding]

Phase 6 (Select):
Scoring:
- cluster_1: 0.75 + 0.25 (belief axis) = 1.00 → PRIMARY
- cluster_2: 0.65 + 0 = 0.65 (below secondary threshold)
- cluster_3: 0.55 + 0 = 0.55 (below secondary threshold)
- cluster_4: 0.45 + 0 = 0.45 (below secondary threshold)

Result:
selected: [
  { clusterId: 'cluster_1', role: 'primary' }
]
dominantSelectedAxis: ['illumination']
```

## Implementation Notes

- Null-safe: returns empty result if no clusters
- Handles missing preconditionBias/beliefTension gracefully
- Works with empty others_field (future-proof)
- Maintains all cluster metadata for debugging

## Next Steps (Not in Phase 6)

1. Wire up actual others_field from previous agents
2. Add feeling/move particle selection
3. Build consciousIntent layer
4. Implement lengthPlan
5. Connect to surface generation

## Testing

Key test scenarios:
1. Null safety (no clusters, null input)
2. Basic primary selection (highest score wins)
3. Belief axis match boost
4. others_field redundancy/novelty
5. oneThreadBias secondary suppression
6. lengthPreference influence

All tests pass. Select is minimal but complete for Phase 6.
