# Attention Patterns - P-4 Stage 1

## Overview

Phase P-4 implements **Radial Condensation of Attention** to replace the English-based `attentionTargets` with a Japanese-first attention system. This system extracts **focusPoints** from three channels and uses them to boost particle activation scores.

## Architecture

### Three Attention Channels (Stage 1)

1. **Somatic Alerts (身体的ザワつき)** - Weight: 0.35
   - Emotional keywords and body sensations from user text
   - Based on pattern matching against `SOMATIC_PATTERNS`

2. **Sustained Gaze (持続的注視)** - Weight: 0.30
   - Persistent signals from previous turns
   - Extracted from `afterglowSeed` and `previousLatentState`

3. **Unconscious Interrupts (無意識割り込み)** - Weight: 0.35
   - Active belief tensions demanding attention
   - Extracted from `beliefTension.activeTensions`

### Data Flow

```
User Input (Japanese)
         ↓
   3 Channel Detection
    ├── Somatic (0.35)
    ├── Sustained (0.30)
    └── Unconscious (0.35)
         ↓
  Radial Condensation
         ↓
   focusPoints (top 3)
         ↓
 emergingField.focusPoints
         ↓
 Particle Activation Boost
 (+0.15 * intensity per match)
```

## Somatic Patterns Table

The `SOMATIC_PATTERNS` table (50 entries) in `src/runtime/linguistics/japanesePatterns.js` contains:

### Fear-related (怖い系)
- `fear-kowai`: 怖い, 怖く, 怖くて (intensity: 0.7)
- `fear-osoroshi`: 恐ろし, 恐ろしい (intensity: 0.8)
- `fear-kowagaru`: 怖がる (intensity: 0.65)
- `fear-biku`: びくびく (intensity: 0.6)

**Rationale**: Fear is a primary somatic signal. Japanese uses multiple expressions for fear with varying intensity. The patterns capture the most common forms.

### Contradiction/Tension (矛盾・対立系)
- `contra-dakedo`: だけど (intensity: 0.55)
- `contra-demo`: でも (intensity: 0.5)
- `contra-kedo`: けど (intensity: 0.5)
- `contra-shikashi`: しかし (intensity: 0.6)
- `contra-noni`: のに (intensity: 0.65)

**Rationale**: Contradictions signal internal tension and conflicting desires. Common in Japanese self-dialogue. Higher intensity for formal contradictions (しかし, のに).

### Pain/Discomfort (辛い・痛い系)
- `pain-tsurai`: 辛い, 辛く, 辛くて (intensity: 0.75)
- `pain-kurushii`: 苦しい, 苦しく (intensity: 0.8)
- `pain-itai`: 痛い, 痛く (intensity: 0.7)
- `pain-setsu`: せつない, せつなく (intensity: 0.75)

**Rationale**: Pain markers are high-intensity somatic signals. Pattern includes conjugations for natural language coverage.

### Joy/Happiness (嬉しい系)
- `joy-ureshii`: 嬉しい, 嬉しく (intensity: 0.7)
- `joy-tanoshii`: 楽しい, 楽しく (intensity: 0.65)
- `joy-yorokobi`: 喜び, 喜ぶ (intensity: 0.6)

**Rationale**: Positive emotions also create somatic alerts. Lower intensity than pain/fear as per emotional salience research.

### Body Sensations (身体感覚)
- `body-iki`: 息が浅い, 息が詰まる, 息ができない (intensity: 0.7)
- `body-kowabaru`: こわばる (intensity: 0.65)
- `body-kata`: 肩が張る, 肩が凝る, 肩が重い (intensity: 0.6)
- `body-mune`: 胸が苦しい, 胸が詰まる, 胸がざわざわ (intensity: 0.7)
- `body-zawazawa`: ざわざわ (intensity: 0.65)
- `body-moya`: もやもや (intensity: 0.6)

**Rationale**: Direct body sensation references are high-salience attention markers. Based on次世代設計書 v2 Chapter 5-3 examples.

### Resignation/Giving Up (諦め系)
- `resign-akirame`: 諦める, 諦めた (intensity: 0.7)
- `resign-muri`: 無理, もう無理 (intensity: 0.75)
- `resign-dame`: だめ, だめだ (intensity: 0.6)
- `resign-shikata`: 仕方ない, 仕方がない (intensity: 0.65)

**Rationale**: Resignation markers signal important threshold moments in internal dialogue.

### Hidden Truth (本当は系)
- `truth-honto`: 本当は (intensity: 0.7)
- `truth-jitsuwa`: 実は (intensity: 0.65)
- `truth-honki`: 本気, 本気で (intensity: 0.6)

**Rationale**: "Actually..." markers reveal suppressed or conflicting truths. High attention value.

### Desire/Want (やりたい系)
- `desire-yaritai`: やりたい (intensity: 0.7)
- `desire-shitai`: したい (intensity: 0.65)
- `desire-hoshii`: 欲しい, 欲しく (intensity: 0.7)
- `desire-nozomi`: 望む, 望み (intensity: 0.6)

**Rationale**: Desire expressions create forward-pulling attention. Essential for motivation detection.

### Confusion/Disorientation (混乱系)
- `confuse-wakaranai`: わからない, よくわからない (intensity: 0.6)
- `confuse-mayou`: 迷う, 迷って (intensity: 0.65)
- `confuse-donoyou`: どうよう (intensity: 0.7)

**Rationale**: Confusion markers indicate need for illumination. Important for belief axis activation.

### Hesitation (ためらい系)
- `hesit-tamau`: ためらう, ためらって (intensity: 0.65)
- `hesit-chotto`: ちょっと (intensity: 0.4)
- `hesit-sukoshi`: 少し (intensity: 0.35)

**Rationale**: Subtle hesitation markers. Lower intensity as they're more ambient.

### Anger/Irritation (怒り系)
- `anger-ikaru`: 怒り, 怒る (intensity: 0.75)
- `anger-hara`: 腹が立つ (intensity: 0.8)
- `anger-mukatuku`: むかつく (intensity: 0.7)
- `anger-ira`: いらいら (intensity: 0.65)

**Rationale**: Anger is high-intensity somatic signal. Important for emotional range.

### Loneliness/Isolation (孤独系)
- `lonely-sabishii`: 寂しい, 寂しく (intensity: 0.7)
- `lonely-hitori`: 一人, 一人ぼっち (intensity: 0.6)
- `lonely-kodoku`: 孤独 (intensity: 0.75)

**Rationale**: Loneliness signals need for connection and presence.

### Shame/Embarrassment (恥ずかしい系)
- `shame-hazukashi`: 恥ずかしい, 恥ずかしく (intensity: 0.7)
- `shame-haji`: 恥, 恥じる (intensity: 0.65)

**Rationale**: Shame is complex social emotion with high somatic presence.

### Relief/Safety (安心系)
- `relief-anshin`: 安心 (intensity: 0.6)
- `relief-hotokko`: ほっと (intensity: 0.55)

**Rationale**: Release and relief markers. Important for resolution detection.

## Integration with Particle Activation

When `focusPoints` is present in `emergingField`, each particle's tags are checked against focus point signals:

```javascript
// From activateThoughts.js, activateFeelings.js, activateMoves.js
const focusPointBoost = calculateFocusPointBoost(
  node.tags,
  context.emergingField?.focusPoints || []
);

// Boost formula: 0.15 * intensity
// Example: If focusPoints contains { signal: 'fear-tremor', intensity: 0.7 }
// And particle has tag 'fear', boost = 0.15 * 0.7 = 0.105
```

### Activation Score Formula (Updated)

```
activationScore = baseScore
  + stateAxisResonance * 0.35
  + triggerMatch * 0.25
  + agentAffinity * 0.15
  + resonanceMatch * 0.15
  + bodyAffinity * 0.05-0.10
  + focusPointBoost          // P-4: NEW
  - antiTriggerMatch * 0.3
```

## Backward Compatibility

- `emergingField.attentionTargets` is kept for backward compatibility
- `emergingField.focusPoints` is the new primary mechanism
- Activation functions prioritize `focusPoints` when available

## Testing

### Unit Tests
- `detectSomaticAlerts.test.js`: Pattern matching correctness
- `detectSustainedGaze.test.js`: Afterglow and latent state extraction
- `detectUnconsciousInterrupts.test.js`: Belief tension mapping

### Integration Tests
- `radialCondensation.test.js`: 5 snapshot tests for different Japanese inputs
- `focusPoints.integration.test.js`: Particle activation impact verification

### Success Criteria
1. ✅ Japanese input yields focusPoints.length >= 1
2. ✅ "怖いけど、でもやりたい" detects fear-tremor and contradiction-pull
3. ✅ focusPoints boost particles with matching tags
4. ✅ Different particles activated with/without focusPoints

## Future Stages

**Stage 2** (not implemented in P-4 Stage 1):
- Morphological analysis channel
- Semantic frame detection

**Stage 3** (not implemented in P-4 Stage 1):
- Contextual expansion
- Multi-turn coherence

## References

- 次世代設計書 v2 Chapter 5: Attention Mechanisms
- 次世代設計書 v2 Chapter 10 Phase 4: Radial Condensation
- src/runtime/linguistics/japanesePatterns.js: Pattern definitions
