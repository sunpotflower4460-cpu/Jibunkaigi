# Phase P-2 Implementation Status

**Date**: 2026-04-20
**Branch**: `claude/phase-p2-activate-agent-unification`

## Overview

Phase P-2 aims to unify the "dual brain" system by:
1. Migrating belief/memory/field materials to reservoir format
2. Integrating estimateState's 8 axes into particle activation scoring
3. Deprecating activateAgent/activateGeneric in favor of runInternalOS pipeline

## Completed Work

### 1. Migration Script ✅

**File**: `scripts/migrate-agent-materials-to-reservoir.js`

Successfully migrated agent materials from 5 agents (joe, ray, ken, mina, satou):
- **25 beliefs → 25 thoughts**
- **25 memories → 25 feelings**
- **25 field nodes → 25 moves**

**Output location**: `src/reservoir/agents/{agent-name}/migrated/`

**Key features**:
- Preserves vector format (desire, fear, freeze, reach, resignation, selfErasure, shame, unfinished)
- Auto-generates tags from tone/sense/id prefixes
- Handles negative vector values by converting to antiTriggers
- Logs exceptions for manual review (2 cases found)

**Migration log**: `scripts/migration-log.json`

### 2. State Axis Integration (Partial) 🔄

**Files created/modified**:
- `src/runtime/config/scoringWeights.js` - New scoring weights configuration
- `src/runtime/activateThoughts.js` - Enhanced with state axis scoring

**Implementation**:
- Created `calculateStateAxisResonance()` function using cosine similarity
- Integrated state axes into `activateThoughts` scoring formula
- Rebalanced activation weights:
  - State axis: **0.35** (new, primary signal)
  - Trigger match: 0.25 (reduced from 0.4)
  - Agent affinity: 0.15 (reduced from 0.2)
  - Resonance match: 0.15 (reduced from 0.2)
  - Body affinity: 0.05 (reduced from 0.2)
  - Anti-trigger penalty: -0.3 (reduced from -0.5)

**State Axis Resonance Algorithm**:
```javascript
// Computes cosine similarity between node vector and state axes
// Returns score 0-1 indicating alignment with current user state
dotProduct = Σ(nodeVector[axis] * stateAxes[axis])
similarity = dotProduct / (||nodeVector|| * ||stateAxes||)
```

## Remaining Work

### 3. Complete State Axis Integration

**TODO**: Apply same state axis enhancement to:
- [ ] `src/runtime/activateFeelings.js`
- [ ] `src/runtime/activateMoves.js`

**Steps for each file**:
1. Import `STATE_AXIS_WEIGHT` from `./config/scoringWeights.js`
2. Add `calculateStateAxisResonance()` function (copy from activateThoughts.js)
3. Update `calculateActivationScore()` to include state axis resonance
4. Add `stateAxes` parameter to function signature
5. Pass `stateAxes` through to `calculateActivationScore()`
6. Update JSDoc comments

**Important**: Use appropriate body affinity weights:
- Feelings: `BODY_AFFINITY_WEIGHT_FEELING = 0.10`
- Moves: `BODY_AFFINITY_WEIGHT_MOVE = 0.08`

### 4. Wire State Axes Through runInternalOS

**File**: `src/runtime/runInternalOS.js`

**TODO**:
1. Extract `stateAxes` from `estimateState()` result (already called)
2. Pass `stateAxes` to all three activation functions:
   ```javascript
   const activatedThoughtsResult = activateThoughts({
     // existing params...
     stateAxes,  // ADD THIS
   });

   const activatedFeelingsResult = activateFeelings({
     // existing params...
     stateAxes,  // ADD THIS
   });

   const activatedMovesResult = activateMoves({
     // existing params...
     stateAxes,  // ADD THIS
   });
   ```

**Location**: Around lines 704-767 in runInternalOS.js

### 5. Deprecate activateAgent

**Step 2-1**: Strict renderActivatedParticles
- **File**: `src/runtime/buildPromptHelpers.js`
- **Action**: Ensure `renderActivatedParticles()` only reads from `finalDecisionSubstrate`, `selectedMixedClusters`, `selectedThoughts`
- **Verify**: `activated.activeBeliefs`, `activated.activeMemories`, `activated.activeField` are ignored

**Step 2-2**: Remove activateAgent calls
- **File**: `src/App.jsx`
- **Action**: Remove `activateAgent()` import and calls
- **Verify**: App still functions correctly

**Step 2-3**: Move legacy files
- **Create**: `src/runtime/_legacy/` directory
- **Move**:
  - `src/runtime/activate.js`
  - `src/runtime/activateGeneric.js`
  - `src/runtime/activateAgent.js`
- **Add**: `@deprecated` JSDoc tags before moving

### 6. Compare Mode Validation

**File to create**: `docs/p2-equivalence-review.md`

**Test scenarios** (from `docs/agent-quality-scenarios.md`):
Select 10 representative inputs covering:
1. 言葉にならない感覚 (preverbal sensations)
2. 仕事の意味の揺れ (work meaning uncertainty)
3. 人間関係の違和感 (relationship discomfort)
4. 創作の迷い (creative hesitation)
5. 諦めかけているもの (near-resignation)
6. その他 diverse scenarios

**Comparison process**:
1. Run scenario with CURRENT code (before P-2 changes merged)
2. Run scenario with NEW code (P-2 integrated)
3. Compare system prompts generated
4. Compare Gemini responses
5. Qualitative assessment: maintained/improved/degraded

**Review format**:
```markdown
## Scenario 1: [Title]
### Input
[User input text]

### Current (Before P-2)
- System prompt particles: [list]
- Response quality: [assessment]

### New (P-2)
- System prompt particles: [list]
- Response quality: [assessment]

### Assessment
- Quality: ✅ Maintained / ⬆️ Improved / ⬇️ Degraded
- Notes: [specific observations]
```

### 7. Documentation

**File to create**: `docs/p-series.yaml`

**Format**: Similar to `docs/phases.yaml`, describe P-1 through P-6

**Content structure**:
```yaml
p-series:
  description: "Progressive series for next-gen architecture"
  phases:
    p-1:
      title: "Transform Prompt Structure"
      status: "completed"
      ...
    p-2:
      title: "activateAgent Unification"
      status: "in-progress"
      ...
```

### 8. Testing

**Unit tests to add**:
- [ ] Test for migrated reservoir nodes structure
- [ ] Test state axis resonance calculation
- [ ] Test activation scoring with state axes
- [ ] Integration test for full pipeline

**Validation commands**:
```bash
npm install
npm run lint
npm run build
npm run test:run
```

## Key Design Decisions

### Why estimateState axes vs estimateField?

**Rationale** (from 第4章4-3):
- `estimateField`: Field atmosphere, 5 axes (depth, urgency, etc.)
- `estimateState`: User psychological state, 8 axes (desire, fear, etc.)
- These capture **different information** and should coexist
- State axes provide direct resonance with particle vectors

### Negative Vector Values

**Issue**: Some belief vectors had negative values (e.g., `selfErasure: -0.45`)
**Solution**: Convert to `antiTriggers` with `suppress-{axis}` tags
**Reason**: Reservoir expects positive values; negation expressed via suppression

### Scoring Weight Rationale

**State axis weight (0.35)** is highest because:
1. Direct alignment with user's current psychological state
2. Migrated materials use same 8-axis vector space
3. Provides strongest signal for particle relevance

## Next Steps (Priority Order)

1. **Complete state axis integration** (activateFeelings, activateMoves)
2. **Wire through runInternalOS** (pass stateAxes parameter)
3. **Run tests** (npm run test:run)
4. **Fix any test failures**
5. **Deprecate activateAgent** (gradual steps 2-1, 2-2, 2-3)
6. **Compare Mode validation** (10 scenarios)
7. **Documentation** (p-series.yaml)
8. **Final validation** (full test suite + manual testing)

## Migration Notes

**Review required for**:
- `joe-migrated-thought-004`: selfErasure → antiTrigger
- `joe-migrated-feeling-004`: selfErasure → antiTrigger

**Manual tasks**:
- Review migrated nodes for accuracy
- Adjust `triggers` and `antiTriggers` (currently empty)
- Verify `weights` are appropriate (currently 0.7 default)
- Test migrated nodes activate correctly

## References

- Task description: See problem_statement
- Design doc: 次世代設計書 v2 第4章・第10章フェーズ2
- Quality scenarios: `docs/agent-quality-scenarios.md`
- Compare mode: `src/runtime/compareMode.js`
