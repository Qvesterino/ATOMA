# Harmony Influence on Node-Linked Auras

## Overview

Extended the existing **NodeLinkedAuraSystem** with visual harmony feedback that dynamically stabilizes and smooths aura behavior based on node harmony levels, counteracting corruption effects.

**Status**: ✅ COMPLETE and ACTIVE

---

## Visual Behavior by Harmony Level

### Low Harmony (0.0 - 0.33)
- Barely noticeable smoothing effect
- Slight improvement in motion coherence
- Minimal stabilization of silhouette
- Minor opacity uniformity increase

### Medium Harmony (0.33 - 0.67)
- Clearly calmer motion
- Reduced irregularity from corruption effects
- Aura breathes evenly, feels balanced
- Phase layers more synchronized
- Upward flow gradually restored

### High Harmony (0.67 - 1.0)
- Strong silhouette stabilization
- Noise layers nearly phase-locked (highly coherent)
- Upward flow feels confident and effortless
- Opacity appears almost perfectly uniform
- Aura feels light, breathable, calm

---

## Implementation Details

### 1. Harmony Stabilization Calculation

**File**: `NodeLinkedAuraSystem.js` (lines 368-371)

```javascript
// Harmony reduces corruption's effect through inverse dampening
const harmonyStabilization = auraData.harmonyDampen > 1.0 ? 0 : (1.0 - auraData.harmonyDampen);
// Range: 0.0 (no harmony) to 0.4 (max harmony with max corruption dampening)
```

This creates a **stabilization factor** (0-0.4) that:
- Is 0 when harmony = 0
- Grows proportionally with harmony level
- Maximum 0.4 when harmony at max (due to 40% corruption dampening)

### 2. Phase Alignment Between Noise Layers

**File**: `NodeLinkedAuraSystem.js` (lines 399-438)

Harmony induces phase coherence by reducing asynchronous drift:

**Corruption Phase Shift**: `corruption * globalTime * 0.3`
**Harmony Phase Alignment**: `harmonyStabilization * globalTime * 0.15`

Net Phase Effect: `corruptionPhaseShift - harmonyPhaseAlignment`

This creates:
- Synchronized motion at high harmony
- Coherent layering (all three noise layers work together)
- "Breathe as one" feel instead of tearing

### 3. Reduced Silhouette Irregularity

**File**: `NodeLinkedAuraSystem.js` (lines 420-435)

Harmony reduces noise amplitude variance (opposite of corruption):

**Layer 2 (Medium frequency)**:
- Corruption adds: `+corruption * 0.3` (up to 30%)
- Harmony removes: `-harmonyStabilization * 0.2` (up to 20% reduction)
- Net amplitude: `0.5 + corruptionVariance - harmonyVarianceReduction`

**Layer 3 (High frequency shimmer)**:
- Corruption adds: `+corruption * 0.15` (up to 15%)
- Harmony removes: `-harmonyStabilization * 0.1` (up to 10% reduction)
- Net amplitude: `0.2 + corruptionVariance3 - harmonyVarianceReduction3`

Effect: At high harmony, amplitude approaches baseline (smoother silhouette)

### 4. Restored Upward Drift Bias

**File**: `NodeLinkedAuraSystem.js` (lines 445-453)

Harmony counteracts corruption's drift reduction:

```javascript
const corruptedDriftReduction = corruption * 0.5;    // Up to 50% from corruption
const harmonyDriftRestoration = harmonyStabilization * 0.3;  // Restores up to 30%
const finalDriftBias = this.motionParams.upwardDriftBias * (1.0 - corruptedDriftReduction + harmonyDriftRestoration);
```

At high harmony:
- Feels lighter and more breathable
- Vertical flow restored even with corruption present
- Flame-like upward tendency feels effortless

### 5. Reduced Opacity Unevenness

**File**: `NodeLinkedAuraSystem.js` (lines 331-344)

Harmony smooths opacity oscillation:

```javascript
const corruptionOscillation = Math.sin(...) * corruption * 0.15;
const harmonyOpacityStabilization = Math.sin(...) * harmonyStabilization * 0.08;  // Up to 8% smoothing
const netOpacityOscillation = corruptionOscillation - harmonyOpacityStabilization;
```

Effect: Opacity becomes nearly uniform at high harmony, less flickering/breathing

---

## Harmony × Corruption Interaction

The two systems work **additively**, not as overrides:

| Scenario | Visual Result |
|----------|---|
| High corruption, no harmony | Torn, heavy, chaotic aura |
| High corruption, high harmony | Stable but still present, calmer |
| No corruption, high harmony | Smooth, light, coherent breathing |
| Medium corruption, medium harmony | Balanced: visible but not overwhelming |

**Formula Concept**:
```
Final Effect = Base State - (Corruption Effect) + (Harmony Stabilization)
```

This creates natural tension where:
- Pure corruption → chaos and tearing
- Pure harmony → smooth and light
- Mixed → dynamic balance between states

---

## Frequency Stabilization

**File**: `NodeLinkedAuraSystem.js` (lines 407-409, 417-419, 430-432)

Each noise layer gets slight frequency restoration:

**Layer 1**: `baseFreqX * (1.0 - corruption * 0.15 + harmonyStabilization * 0.08)`
**Layer 2**: `0.8 * (1.0 - corruption * 0.1 + harmonyStabilization * 0.05)`
**Layer 3**: `1.5 * (1.0 - corruption * 0.2 + harmonyStabilization * 0.1)`

Higher frequencies get more harmony stabilization:
- Base curl (layer 1): 8% restoration
- Licking detail (layer 2): 5% restoration  
- Shimmer (layer 3): 10% restoration

This creates hierarchical stabilization: high-frequency layers respond more strongly to harmony.

---

## Performance Characteristics

- **Per-frame cost**: Negligible (added to existing calculations)
- **Memory**: Zero additional allocations
- **Early exit**: No calculation if harmony = 0
- **Smooth blending**: All effects use phase-aligned oscillations

---

## Integration with Other Systems

✅ **Corruption Effects**: Harmony additively counteracts, not overrides  
✅ **Link Creation Spikes**: Spike boosts work independently  
✅ **Undo/Redo**: Auras automatically recalculate on state changes  
✅ **Debug Mode**: Wireframe shows smoothing effect  

---

## Debug & Monitoring

### Console API

```javascript
// View active harmony influences
nodeAuraStatus()

// Output includes:
// - Harmonized Auras: Number of auras currently stabilized
// - Max Harmony Stabilization: Highest stabilization factor (0-0.4)
```

### Debug Mode

```javascript
toggleNodeAuraDebug()  // Shows wireframe, visualizes stabilization intensity
```

At high harmony with debug enabled, you'll see:
- Smoother wireframe vertices
- Less phase drift between layers
- More uniform silhouette

---

## Rules Compliance

✅ **No particles** — Only noise parameter adjustment  
✅ **No glow** — Opacity variation only, no emissive  
✅ **No color changes** — Grey-white/cyan unchanged  
✅ **No flashing** — Smooth slow oscillation synchronized with corruption  
✅ **No hard thresholds** — Smooth continuous blending  
✅ **No geometry replacement** — Original vertices modified in place  
✅ **Visual-only** — No gameplay logic changes  

---

## Testing & Verification

### Quick Test: Low Harmony
```javascript
const node = window.game.aiNodes.nodes[0];
node.userData.harmony = 0.2;
// With high corruption, see minimal smoothing effect
```

### Quick Test: High Harmony
```javascript
const node = window.game.aiNodes.nodes[0];
node.userData.harmony = 0.9;
// Even with 0.8 corruption, aura feels calm and stable
```

### Quick Test: Harmony vs Corruption Balance
```javascript
const node = window.game.aiNodes.nodes[0];
node.userData.corruption = 0.7;
node.userData.harmony = 0.5;
// Aura shows visible but controlled effect (balanced)
```

### Quick Test: Opacity Uniformity
```javascript
const node = window.game.aiNodes.nodes[0];
node.userData.harmony = 0.95;
toggleNodeAuraDebug();
// Enable debug mode to see wireframe opacity smoothing
```

---

## Files Modified

**NodeLinkedAuraSystem.js** (~80 lines added/modified):
- Harmony stabilization calculation (4 lines)
- Phase alignment in noise layers (40 lines)
- Frequency stabilization (8 lines)
- Drift bias restoration (8 lines)
- Opacity uniformity (14 lines)
- Status tracking (10 lines)

**main.js** (~2 lines modified):
- Enhanced `nodeAuraStatus()` console output

---

## Architecture Notes

- **Inverse Dampening**: Harmony stabilization = 1 - harmonyDampen
- **Phase Coherence**: Uses negative offsets to align layers (subtract harmony from corruption phase)
- **Additive Model**: No thresholds, continuous blending throughout 0-1 range
- **Frequency Hierarchy**: Each layer stabilizes differently for natural effect
- **Per-Node State**: Each aura independently tracks harmony/corruption balance

---

## Future Enhancement Possibilities

- [ ] GPU shader version for better performance at scale
- [ ] Audio reactivity (pulse rate increases with harmony)
- [ ] Color desaturation reduction (subtle color warmth at high harmony)
- [ ] Resonance coupling (harmonized nodes influence each other)
- [ ] Particle emission dampening (fewer particles at high harmony)

---

## Comparison: Corruption vs Harmony Effects

| Aspect | Corruption | Harmony |
|--------|-----------|---------|
| **Motion** | Irregular, asynchronous | Smooth, synchronized |
| **Silhouette** | Torn, jagged | Round, uniform |
| **Vertical Flow** | Reduced, heavy | Strong, light |
| **Opacity** | Uneven, oscillating | Uniform, calm |
| **Phase Alignment** | Desynchronized layers | Aligned layers |
| **Frequency** | Slowed | Stabilized/restored |
| **Feel** | Unsettled, chaotic | Calm, confident |

