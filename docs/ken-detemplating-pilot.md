# Ken De-templating Pilot

## Purpose

This is a pilot implementation of zero-instruction architecture for Ken (strategist voice), following the same principles applied to Ray and other agents. The goal is to move from explicit template instructions to field-based perception, allowing Ken's structural clarity to emerge naturally rather than being prescribed.

## Key Principles

### 1. Form vs. Field

**Before (form-based):**
```
「整理すると」「ポイントは」「一つ確認させてください」など知的だが温かみのある口調。
```

**After (field-based):**
```
【知覚傾向】
- 結び目やもつれが見えやすい
- 隠れた前提の配置に反応しやすい
- 選択肢がまだ開いているか閉じているかに目が行きやすい
```

### 2. Latent → Decision → Outer Utterance

Ken now follows the two-stage architecture:

1. **Internal Stage (latent state + decision layer):**
   - `userSense`: 相手に何が起きていそうか
   - `selfFeeling`: 自分はそこに何を感じたか
   - `selfLean`: どこを切りたい / どこに触れたいか

2. **External Stage:**
   - Natural utterance emerges from internal state
   - No explicit "how to respond" instructions
   - Structural clarity arises from perception, not template

### 3. Quality Standards Are For Humans

Ken's quality contract (最初に触れる対象: もつれの構造...) is in `docs/` for developers and reviewers, **not** injected into the LLM prompt.

Instead, Ken receives:
- **知覚傾向** (perceptual tendencies): what Ken naturally notices
- **禁止されていない圧** (not-forbidden pressure): what Ken is allowed to do
- **避ける方向** (directions to avoid): what patterns to steer away from

### 4. Template Phrases Are Guarded, Not Banned

Ken's characteristic phrases (「整理すると」「構造的には」) are monitored by `surfaceGuard` for **short-term repetition**, not banned outright.

The guard triggers regeneration only when:
- Same phrase appears 3+ times in recent conversation window
- Multiple repeated phrases detected (high risk)

## Implementation Changes

### Removed (Template Directives)

1. **Explicit phrase instructions:**
   - ❌ `「整理すると」「ポイントは」「一つ確認させてください」`
   - ❌ `「その上で」と繋げて、構造的な視点を加える`

2. **Assembly step instructions:**
   - ❌ `【返答の組み立て方】1. 感情を短く受ける 2. 構造的な見通しを一つ示す`
   - ❌ `「それは大変ですね」程度で十分`

3. **Quality contract in prompt:**
   - ❌ Direct injection of quality standards
   - ❌ "こういう見方もあります" as explicit instruction

4. **User prompt directives:**
   - ❌ `構造的に整理すると見通しが立ちそうなポイントを一つ見つけてください`
   - ✅ Now: `この言葉に触れてください。`

### Weakened (Converted to Perception)

1. **stateGuide** (buildAgentStateGuide.js):
   - Before: `諦めの中で、実際に何が閉じていて何がまだ開いているかを整理する。`
   - After: `諦めの場での知覚: 何が閉じていて何がまだ開いているかへの反応。`

2. **surfaceGuidance** (buildAgentSurfaceGuidance.js):
   - Before: `急がず、構造を一つだけ示す`
   - After: `構造を一つだけ見る方向への傾き`

### Maintained (Latent Boundaries)

1. Material scoring system (scoreKenMaterials)
2. Field node structure (ken/field.js)
3. Latent state integration
4. Safety boundaries around emotional handling

## New Capabilities

### 1. Template Repetition Detection

Ken-specific phrases monitored:
- 整理すると
- ポイントは
- 一つ確認させてください
- その上で
- 構造的には
- こういう見方もあります
- もつれているのは
- 分解すると
- 見通しを
- 選択肢としては

### 2. De-templating Metrics

Added to `surfaceDebug.js` for Ken:
- `templateDirectivesRemoved`: count of removed template patterns
- `directRolePhraseCount`: count of explicit "how to respond" instructions (target: 0)
- `latentStateUsed`: whether internal bias materials are used
- `decisionStageUsed`: whether decision layer is engaged
- `templateRepeatRisk`: low/medium/high
- `zeroInstructionScore`: high/partial

## Ken's Contour (What Remains)

Ken is **not** a "結び目やズレに反応しやすい存在" like the structural agents. Ken's distinct contour:

- **Sees knots and entanglements** (もつれや結び目が見える)
- **Notices hidden premises** (隠れた前提の配置に反応する)
- **Senses option openness/closure** (選択肢の開閉状態に目が行く)
- **Integrates emotion before separation** (感情を切り離す前に、構造のどこにあるかが見える)
- **Clarity creates movement** (見通しが立つと動きやすくなる場を感知)

This is transmitted as **perceptual tendency**, not as speaking pattern.

## Verification

To verify de-templating effectiveness:

1. **Check debug metrics** (compareMode or debugSurface):
   - `zeroInstructionScore` should be 'high'
   - `directRolePhraseCount` should be 0
   - `templateDirectivesRemoved` should be ≥6

2. **Monitor actual responses**:
   - Ken should still provide structural clarity
   - But without rigid "整理すると→次に→最後に" patterns
   - Natural variation in how structure emerges

3. **Guard activity**:
   - Check `templateRepeatRisk` and `repeatedPhrases`
   - Regeneration should be rare (only on high risk)

## Next Phase

After validating Ken pilot:

1. Apply same principles to 心の鏡 (Mirror)
2. Consider 委ねるの鏡 router integration
3. Systematic review of all agent builders

## Related Docs

- `docs/joe-structure.md` - Joe's zero-instruction architecture
- `docs/ray-detemplating-pilot.md` - Ray's implementation
- `docs/mina-detemplating-pilot.md` - Mina's approach
- `docs/decision-layer.md` - Internal decision stage
- `docs/precondition-filter.md` - Field and bias system
