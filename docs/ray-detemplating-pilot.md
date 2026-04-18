# Ray De-templating Pilot

## Overview

This is the **Ray zero-instruction architecture pilot** — an experiment in removing explicit form instructions from prompts and allowing agent behavior to emerge from latent state, decision layers, and perceptual biases instead.

## Core Principles

### 1. Form is Not Taught. Place is Given.

**Before (template-heavy)**:
```
返答の運び方:
1. まず、相手の言葉をそのまま受ける
2. 次に、見過ごされている角度を一つだけ静かに示す
3. 必要なら、最後に問いかけを一つだけ置く
```

**After (zero-instruction)**:
```
【知覚傾向】
- まだ言葉になる前の揺れに反応しやすい
- 曖昧さを急いで閉じない傾向
- 気配のまま触れようとしやすい
```

### 2. Latent Layers Influence, They Don't Read Aloud

The precondition layers (Home, Existence, Belief, Decision) contain internal text that should **influence** output, not appear verbatim.

- ✅ **Good**: `existence.js` contains "反応の起点は、相手の言葉の中で見過ごされている角度" → shapes perception
- ❌ **Bad**: Prompt says "まず相手の言葉をそのまま受けて、次に角度を示す" → template reproduction

### 3. Internal Intent → External Utterance (Two-Stage)

**Decision Layer First** (internal):
- `userSense`: 相手に何が起きていそうか
- `selfFeeling`: 自分はそこに何を感じたか
- `selfLean`: どっちへ触れたくなるか

**Then Surface** (external):
- Actual user-facing response generated based on internal decision

### 4. Quality Criteria Are for Humans, Not LLMs

`docs/agent-quality-scenarios.md` and similar documents are for:
- Designers
- Reviewers
- Comparators

**DO NOT** inject quality criteria directly into prompts. Convert them to:
- Perceptual biases ("reacts to X")
- Latent tendencies ("leans toward Y")
- Forbidden patterns ("avoids Z")

### 5. Ray is Not "The Abstract Person"

❌ Ray does not "静かに抽象化する人"
✅ Ray is "まだ言葉になる前の揺れに触れやすい存在"

The difference:
- **Action-oriented** ("する人") → templates
- **Perceptual-oriented** ("触れやすい存在") → emergent behavior

## What Was Removed

### Deleted (Form Instructions)

1. **Explicit phrase examples**: "「〜ですね」「〜かもしれません」のような柔らかい語尾"
2. **Step-by-step assembly**: "まず→次に→最後に"
3. **Numbered construction steps**: "1. 2. 3."
4. **"How to speak" guidelines**: Entire sections teaching procedural structure
5. **User prompt structural commands**: Removed explicit assembly instructions from user prompt

### Weakened (Converted to Perceptual Bias)

1. **State guide** instructions → perceptual tendencies
   - Before: "諦めの形をそのまま受け取りつつ、その中にまだ試されていない角度がないか静かに探す"
   - After: "諦めの感知への反応が強い状態。まだ試されていない角度への知覚"

2. **Surface guidance** actions → reaction biases
   - Before: "急がず、静かに照らす"
   - After: "ゆっくりした時間への傾き"

3. **Quality contract** in code → moved to docs only
   - Removed voice quality contract from prompt file header
   - Kept in human-readable documentation

### Kept (Latent Boundaries)

1. **Forbidden vocabulary lists**: No spiritual terms
2. **Output constraints**: One angle only, max one metaphor
3. **Safety rails**: Don't perform silence, don't declare identity
4. **Internal bias materials**: reentry, refresh, residue (influence only)

## New Architecture

### Input Structure

```
System Prompt:
├─ Identity: "あなたはレイ"
├─ Perceptual Tendencies (知覚傾向)
├─ Forbidden Patterns (禁止されていない圧)
├─ State Response (今回の状態への対応) ← converted to perception
├─ Surface Tendency (表層傾向) ← converted to reaction bias
├─ Internal Frame (共通OSの薄い内部フレーム)
├─ Estimated State (推定状態メモ)
└─ Internal Bias Materials (内的バイアス) ← latent influence only

User Prompt:
└─ User text only, no structural commands
```

### Surface Guard Enhancement

Added `detectRayTemplateRepetition()` to catch repeated abstract phrases:

Monitored phrases:
- "かもしれませんね"
- "静かに思いました"
- "と見ることもできるかもしれません"
- "新しい空気が生まれる"
- etc.

Short-term repetition (3+ times in 4 turns) triggers regeneration.

### De-templating Metrics

Available in debug mode (`?debugSurface=1`):

```javascript
{
  templateDirectivesRemoved: 6,      // Assembly steps, phrase examples, quality docs removed
  directRolePhraseCount: 0,          // "こう返せ" type instructions in prompt
  latentStateUsed: true,             // Internal bias materials present
  decisionStageUsed: true,           // Decision layer engaged
  templateRepeatRisk: 'low',         // Estimated risk of template reproduction
  zeroInstructionScore: 'high'       // Overall zero-instruction achievement
}
```

## Testing & Validation

### Success Criteria

- ✅ Ray prompt has significantly fewer "how to speak quietly" instructions
- ✅ Assembly steps, phrase examples, abstract metaphor guidance removed
- ✅ Latent state / decision / field state are primary inputs
- ✅ Ray responses show less abstract template reproduction
- ✅ Ray's contour (perceptual character) remains present
- ✅ Changes visible in compare/debug mode
- ✅ Lint / build / test pass

### Failure Criteria

- ❌ Ray becomes a generic consultation AI
- ❌ Removing form instructions leaves prompt empty
- ❌ Guard is too strong, creates unnatural responses
- ❌ Latent state phrases read aloud verbatim
- ❌ Quality docs still injected directly into prompt
- ❌ Only abstract templates removed, Ray-ness also removed
- ❌ Output is thin instead of reflective

## Next Steps

### Phase 2: Ken Expansion

Apply similar de-templating to Ken (strategist):
- Convert "structure hints" to perceptual bias
- Remove assembly instructions for framework building
- Strengthen decision layer for structural perception

### Phase 3: Full Agent Coverage

- Mina (empath) — already has some de-templating
- Satou (critic) — already has some de-templating
- Joe (creative) — evaluate whether de-templating applies

### Phase 4: Delegating Mirror Router

Implement true delegating mirror that:
- Reads field gravity without template reproduction
- Routes based on latent state, not explicit rules
- Surfaces ambiguity without summarization templates

## References

- Implementation: `src/runtime/prompts/ray.js`
- State guide: `src/runtime/buildAgentStateGuide.js`
- Surface guidance: `src/runtime/buildAgentSurfaceGuidance.js`
- Template detection: `src/runtime/surfaceGuard.js`
- Debug metrics: `src/runtime/surfaceDebug.js`

## Acknowledgments

This pilot builds on the de-templating work done for Mina and Satou (see `docs/mina-detemplating-pilot.md` and `docs/satou-detemplating-pilot.md`).

The goal is not to remove Ray's voice, but to allow it to emerge naturally from latent foundations rather than explicit instructions.
