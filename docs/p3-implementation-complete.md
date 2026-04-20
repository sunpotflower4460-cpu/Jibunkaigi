# Phase P-3 Implementation Complete

**Date**: 2026-04-20
**Branch**: `claude/p3-compare-mode-all-deployment`
**Status**: ✅ Implementation Complete - Ready for Manual Testing

## Overview

Phase P-3 successfully expands Compare Mode from Joe-only to all 5 agents and provides the infrastructure for quantifying particle selection impact.

## Completed Deliverables

### 1. Compare Mode Expansion ✅

**Files Created/Modified**:
- `src/runtime/compareMode/baselines/allAgents.js` - Complete baseline definitions for all 5 agents
- `src/runtime/compareMode/compareModeCaptureGeneric.js` - Agent-agnostic comparison function
- `src/runtime/buildBaselinePrompt.js` - Updated to use new baselines module
- `src/App.jsx` - Removed Joe-only restriction (line 755)

**Agent Baselines**:
- **ジョー (creative)**: 熱量があって前向きな兄貴分
- **レイ (soul)**: 静かで深い洞察を持つ存在
- **ケン (strategist)**: 論理的で冷静な分析者
- **ミナ (empath)**: 温かく包み込むような存在
- **サトウ (critic)**: 率直で辛口な評論家

### 2. Particle Swap Testing Tool ✅

**File**: `src/runtime/compareMode/swapParticles.js`

**Features**:
- `swapPrimarySecondary()` - Swaps primary and secondary particles in selectedMixedClusters
- `createSwappedLatentState()` - Generates alternative latentState with swapped particles
- `runParticleSwapTest()` - Executes full particle swap comparison
- `analyzeResponseDifference()` - Analyzes differences between default and swapped responses

**Usage**:
```javascript
const result = await runParticleSwapTest({
  agentId: 'creative',
  userInput: '最近、なんか違和感があるんだけど...',
  callGemini,
  geminiModel: 'gemini-2.0-flash-exp',
});
```

### 3. Test Scenarios ✅

**File**: `docs/p3-scenarios.md`

**Structure**:
- 5 representative scenarios covering diverse user states
- 25 test cases (5 scenarios × 5 agents)
- 4-level evaluation scale (大差/中差/小差/無差)
- Templates for recording responses and observations
- Anchor comparison section for each case

**Scenarios**:
1. 言葉にならない感覚 (preverbal sensations)
2. 仕事の意味の揺れ (work meaning uncertainty)
3. 人間関係の違和感 (relationship discomfort)
4. 創作の迷い (creative hesitation)
5. 諦めかけているもの (near-resignation)

### 4. Impact Report Template ✅

**File**: `docs/p3-particle-impact-report.md`

**Sections**:
- Executive summary with recommendations
- Differential analysis by agent and scenario
- Detailed case studies of clear and unclear particle impacts
- Anchor line impact analysis
- Particle system evaluation (strengths/weaknesses/improvements)
- Next action items (short/medium/long term)

## Validation Results

### Build & Tests ✅
```
npm install   - ✅ Completed
npm run build - ✅ Completed (minor warning about chunk size, not critical)
npm run test:run - ✅ 644/644 tests passing
```

### Linting ⚠️
Two pre-existing errors in `scripts/migrate-agent-materials-to-reservoir.js`:
- Line 191: unused `tags` variable
- Line 428: `process` not defined

**Note**: These errors are NOT in the P-3 code and do not affect functionality.

## Architecture

### Compare Mode Flow (All Agents)

```
User Input → runCompareModeCapture (App.jsx)
  ↓
  ├─ buildBaselineSystemPrompt (baselines/allAgents.js)
  ├─ buildBaselineUserPrompt (baselines/allAgents.js)
  ↓
  └─ callGemini (Baseline Reply)
      ↓
      ├─ buildOuterGuidePrompt
      ├─ callGemini (Outer Guide)
      ↓
      └─ buildCompareViewModel
          ↓
          Display in Compare Panel
```

### Particle Swap Flow

```
User Input → runParticleSwapTest
  ↓
  ├─ runInternalOS (Default)
  │   ↓
  │   ├─ selectedMixedClusters.selected
  │   └─ buildSystemPrompt → callGemini
  │
  └─ createSwappedLatentState
      ↓
      ├─ swapPrimarySecondary
      ├─ buildSystemPrompt → callGemini
      └─ analyzeResponseDifference
```

## Usage Instructions

### Enabling Compare Mode

**Option 1 - URL Parameter**:
```
?compareMode=1
```

**Option 2 - localStorage**:
```javascript
localStorage.setItem('jibunkaigi:compareMode', '1')
```

### Running Tests Manually

1. **Enable Compare Mode** in the application
2. **Select an agent** (any of the 5 agents)
3. **Enter test input** from `docs/p3-scenarios.md`
4. **Observe responses** in Compare Panel:
   - Baseline (simple persona-only)
   - Current (full InternalOS pipeline)
   - Outer Guide (gains/losses analysis)
5. **Record results** in `docs/p3-scenarios.md`
6. **Use swapParticles.js** (programmatically) for particle swap tests

### Running Particle Swap Tests

Currently requires programmatic invocation:

```javascript
import { runParticleSwapTest } from './src/runtime/compareMode/swapParticles.js';

const result = await runParticleSwapTest({
  agentId: 'creative',
  userInput: 'テスト入力',
  callGemini: yourGeminiFunction,
});

console.log('Default:', result.default.response);
console.log('Swapped:', result.swapped.response);
```

## Decision Criteria

### P-5 (Particle Expansion) Recommendation

**推奨条件**:
- 大差 + 中差 ≥ 50% (13/25 cases)
- Particle influence is clearly observable

**見送り条件**:
- 小差 + 無差 ≥ 50% (13/25 cases)
- Particle influence is unclear

### Anchor Line Removal

**削除推奨条件**:
- Anchor-free personality retention ≥ 80% (20/25 cases)

**削除延期条件**:
- Anchor-free personality retention < 80%

## Known Limitations

1. **Manual Test Execution**: The 25 test scenarios must be run manually in the application
2. **Particle Swap UI**: No UI for particle swap testing yet (requires programmatic use)
3. **Automated Analysis**: Response difference analysis is basic (length-based)
4. **Linting Warnings**: Pre-existing errors in migration script (not critical)

## Next Steps

### Immediate (This Week)
- [ ] Execute 25 test scenarios in the application
- [ ] Fill in response data in `docs/p3-scenarios.md`
- [ ] Conduct manual qualitative evaluation of responses
- [ ] Document findings in `docs/p3-particle-impact-report.md`

### Short-term (Next Sprint)
- [ ] Make decision on P-5 based on findings
- [ ] Make decision on anchor line removal
- [ ] Create UI for particle swap testing (optional)
- [ ] Implement automated similarity scoring (optional)

### Long-term (Next Quarter)
- [ ] If P-5 is approved: Begin particle expansion
- [ ] If anchor removal is approved: Schedule for next minor release
- [ ] Enhance prompt structure based on learnings

## Files Changed

```
7 files changed, 1026 insertions(+), 98 deletions(-)

New Files:
+ docs/p3-particle-impact-report.md
+ docs/p3-scenarios.md
+ src/runtime/compareMode/baselines/allAgents.js
+ src/runtime/compareMode/compareModeCaptureGeneric.js
+ src/runtime/compareMode/swapParticles.js

Modified Files:
M src/App.jsx
M src/runtime/buildBaselinePrompt.js
```

## Dependencies

### Prerequisites
- P-1 (Prompt Structure Transform) - ✅ Complete
- P-2 (activateAgent Unification) - ✅ Complete

### Blocks
- P-5 (Particle Expansion) - Waiting for P-3 results

## References

- **Design Doc**: 次世代設計書 v2 第9章・第10章フェーズ3
- **Compare Mode Spec**: `docs/compare-mode.md`
- **P-2 Status**: `docs/p2-implementation-status.md`
- **Agent Materials**: `src/agents/registry.js`

## Contact

For questions or issues, see:
- Phase task definition in problem statement
- `docs/p3-scenarios.md` for test structure
- `docs/p3-particle-impact-report.md` for reporting template
