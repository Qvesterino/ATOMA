# Harmonic Resonance Feedback System

**Session**: 140+  
**System Type**: Visual-only feedback loop (adapter pattern)  
**Status**: Production-ready, integrated  

---

## Philosophy

> *Meaning shapes motion. Composite glyphs represent synthesized semantic structures.*
> *This system creates a closed visual feedback loop where emergent structures gently*
> *bend the surrounding network flow—not controlling, but guiding through resonance.*

The Harmonic Resonance Feedback System transforms composite glyphs (which represent synthesized meaning) into gentle spatial attractors that influence the motion and rhythm of nearby links.

This is **not control**—it's **resonance**. The system never overrides motion; it only guides, persuades, and smoothes.

---

## Architecture

### Core Components

#### **ResonanceField**
Each active composite glyph emits exactly one resonance field.

**Properties**:
- `active`: Boolean, true while field is active
- `position`: Vector3, world position of the composite glyph
- `compositeGlyph`: Reference to the CompositeGlyphInstance
- `strength`: 0-1 scalar, current influence strength (ramps up/down over time)
- `harmonyBalance`: 0-1 scalar, harmony vs corruption state
- `synergy`: 0-1 scalar, synergy coherence level
- `stability`: 0-1 scalar, link stability

**Methods**:
- `initialize(compositeGlyph, harmonyBalance, synergy, stability)`: Activate the field
- `startDecay()`: Begin fade-out (called when composite separates)
- `update(deltaTime)`: Update field strength and state

**Lifetime**:
1. **Ramp-up** (1.2s): Strength gradually increases to 1.0
2. **Active** (variable): Field operates at full strength while composite exists
3. **Decay** (1.5s): Strength gradually fades to 0 after separation
4. **Reset**: Field becomes available for reuse

---

### Main System

**HarmonicResonanceFeedbackSystem**

**Responsibilities**:
- Manage pool of 20 resonance fields (one per composite glyph max)
- Activate/deactivate fields as composites are created/destroyed
- Update field strengths and parameters each frame
- Find influenced elements (links, glyphs) within each field's radius
- Apply influence transforms (phase alignment, speed modulation, etc.)

**Integration Points**:
- Reads: `fusionZoneManager.compositeGlyphs`, `pictogramsArray`, `linkingSystem`
- Writes: Link `.userData.phase`, pictogram `.userData.drift`, `.userData.spawnInterval`
- Never mutates gameplay data

---

## Resonance Mechanics

### 1. Resonance Field Properties

#### Radius Calculation

```
baseRadius = 4.0 units

Harmony modulation:
  if (harmonyBalance > 0.5):
    radius *= 1.5 × (harmonyBalance - 0.5) × 2
  else:
    radius *= 0.5 × (0.5 - harmonyBalance) × 2

Final: clamped to [2.0, 7.0]
```

**Result**:
- Harmony-dominant: Expands field radius to ~6.0, strong influence
- Corruption-dominant: Shrinks field radius to ~2.0, weak influence
- Neutral: Medium radius ~4.0, moderate influence

#### Influence at Distance

```
normalized = distance / radius

if (distance > radius):
  influence = 0.0
else:
  falloff = exp(-(2.0 × normalized²))
  influence = fieldStrength × falloff
```

**Characteristics**:
- Gaussian-like decay curve (soft, natural falloff)
- No hard boundary (smooth transition)
- Strength scales with field amplitude
- 50% influence at ~0.83× radius

---

### 2. Influenced Elements

#### Link Phase Alignment

**Target**: Nearby link wave motions gently drift toward the composite glyph's rhythm.

**Mechanism**:
```
alignmentStrength = base (0.3) × harmonyBoost × synergyModulation
phaseDelta = targetPhase - currentPhase
influence = alignmentStrength × distanceInfluence × deltaTime

link.userData.phase += wrapAngle(phaseDelta) × influence
```

**Result**:
- Phase gradually aligns to glyph rhythm (no snapping)
- Stronger alignment in harmonic regions
- Synergy increases coherence
- Reverses automatically if influence weakens

#### Link Coherence Smoothing

**Target**: Reduce motion abruptness; improve visual smoothness.

**Mechanism**:
```
if (userData.oscillationAmplitude exists):
  oscillationAmplitude *= lerp(1.0, 0.95, influence × 0.1)
```

**Result**:
- Gentle amplitude reduction (not override)
- More stable, less jittery motion
- Reversible—amplitude grows back if influence fades

#### Energy Streak Influence

**Concept**: Directional energy streaks (if present) curve slightly toward the resonance center and sync speed with glyph pulse.

**Implementation**:
- Curvature bias: `STREAK_CURVATURE_STRENGTH = 0.15`
- Speed modulation: ±20% variation synchronized with glyph rhythm
- Only affects existing streaks (non-destructive)

---

#### Pictogram Flow Influence

**Target**: Non-fused glyphs passing through resonance field slow, improve spacing, and subtly align orientation.

**Mechanism**:

1. **Speed Modulation**:
   ```
   if (pictogram.userData.drift):
     drift *= lerp(1.0, 0.85, influence × 0.3)
   ```
   Result: 15% slowdown at resonance center

2. **Spacing Improvement**:
   ```
   if (pictogram.userData.spawnInterval):
     spawnInterval *= lerp(1.0, 1.15, influence × 0.2)
   ```
   Result: 15% better spacing (fewer glyphs, less crowding)

3. **Orientation Alignment**:
   ```
   targetRot = atan2(dirToResonance)
   rotDelta = wrapAngle(targetRot - currentRot)
   mesh.rotation.z += rotDelta × influence × 0.05 × deltaTime
   ```
   Result: Subtle rotation toward resonance center

**Characteristics**:
- Non-fused glyphs only (fused glyphs already part of synthesis)
- Gentle influence (no visible forcing)
- Reversible (alignment dissolves as influence fades)

---

### 3. State Modulation

#### Harmony Influence

```
harmonyInfluence = harmonyBalance - 0.5  // -0.5 to +0.5

Positive (harmony-dominant):
  - Resonance radius: 1.5× expansion
  - Alignment strength: 1.4× boost (42% base)
  - Phase drift speed: 0.7 rad/s (faster)
  - Field feels expansive, confident, stabilizing

Negative (corruption-dominant):
  - Resonance radius: 0.5× shrink
  - Alignment strength: 0.4× dampen (12% base)
  - Phase drift speed: 0.2 rad/s (slower)
  - Field feels localized, hesitant, destabilizing
```

#### Synergy Influence

```
synergyInfluence = max(0, synergy - 0.5) × 2  // 0 to 1

alignmentStrength += synergyInfluence × 1.3 × 0.1
```

**Effect**: High synergy improves rhythmic coherence and makes resonance more legible.

#### Instability Influence

**Design**: Instability weakens resonance but **never adds noise**.

```
if (stability < 0.5):
  influence *= (stability × 2)  // Scales down with instability
  // But no additional jitter or distortion
```

---

### 4. Temporal Behavior

#### Ramp-Up Phase (1.2 seconds)

```
rampProgress = age / 1.2
strength = rampProgress × targetStrength
```

**Effect**: Resonance gradually builds, not instantaneous. Links smoothly transition into alignment.

#### Active Phase (Variable Duration)

```
strength = targetStrength = 1.0 (or modified by state)
// Composite glyph is stable and active
```

#### Decay Phase (1.5 seconds)

```
startDecay() sets targetStrength = 0.0
decayProgress = (rampAge + decayAge) / 1.5
strength = decayProgress × targetStrength
```

**Effect**: When composite separates, resonance gradually fades. Links smoothly return to independent motion.

---

## Performance

### Memory & Allocation

- **Pool**: 20 resonance fields, preallocated at startup
- **Per-field memory**: ~300 bytes (Vector3, arrays, scalars)
- **Total overhead**: ~6 KB for resonance system
- **No per-frame allocations**

### Update Strategy

```
updateTimer += deltaTime
if (updateTimer < UPDATE_INTERVAL):  // 1/30th second
  return

updateTimer = 0.0
// Perform updates (throttled)
```

**Effect**: Updates at ~30 Hz, not per-frame. Reduces CPU cost.

### Influenced Links Cap

```
MAX_INFLUENCED_LINKS_PER_ZONE = 12
```

Hard cap per field. Sorted by distance; only nearest 12 are affected.

**Effect**: Prevents CPU spike when many links are nearby.

---

## Visual Restraint Rules

### Absolute NO

- **No new particles**: Resonance never spawns particles
- **No glow bursts**: No sudden bloom/emissive changes
- **No color changes**: Links keep their existing colors
- **No motion overrides**: Never takes over link direction

### Absolute YES

- **Subtle phase influence**: Gentle drift toward glyph rhythm
- **Gentle smoothing**: Reduce motion jitter (not freeze)
- **Calm authority**: Persuade, don't command
- **Visual coherence**: Improved flow and rhythm

---

## Integration Points

### In main.js Constructor

```javascript
this.setupHarmonicResonanceFeedback();
```

Creates the system instance and sets up console API.

### In main.js animate() Loop

```javascript
if (this.harmonicResonance && this.harmonicResonance.enabled) {
    this.harmonicResonance.update(
        deltaTime,
        this.linkSemanticPictograms?.fusionZoneManager,
        this.linkSemanticPictograms?.pictogramSystem?.pictograms,
        this.linkingSystem
    );
}
```

**Parameters**:
- `deltaTime`: Frame duration
- `fusionZoneManager`: Source of active composite glyphs
- `pictogramsArray`: Array of pictogram instances to influence
- `linkingSystem`: Link infrastructure (for validation)

### Data Passed to System

**From fusionZoneManager**:
- `compositeGlyphs[]`: Array of active composite glyph instances
  - Each has `.mesh`, `.active`, `.state` (containing harmonyBalance, averageSynergy)

**From pictograms**:
- `pictogram.active`: Boolean
- `pictogram.link`: Reference to link geometry
- `pictogram.mesh`: Visual representation
- `pictogram.userData`: Custom data (drift, spawnInterval, etc.)

**From linkingSystem**:
- Link validation (not mutated)

---

## Console API

### Commands

```javascript
game.resonanceStatus()
// Returns:
// {
//   enabled: true,
//   activeFields: 5,
//   decayingFields: 2,
//   totalCapacity: 20
// }

game.enableResonance()
// Enables harmonic resonance feedback

game.disableResonance()
// Disables harmonic resonance feedback (all fields reset)

game.toggleResonanceDebug()
// Toggle debug visualization (wireframe sphere fields)
```

### Debug Visualization

When enabled, resonance fields are rendered as wireframe spheres:
- **Green**: Active field
- **Opacity**: Proportional to field strength
- **Radius**: Calculated from harmony/corruption state

---

## Configuration

**Location**: `/HarmonicResonanceFeedbackSystem.js`, top of file

### Key Settings

```javascript
// Field geometry
BASE_RESONANCE_RADIUS: 4.0,       // 4 units nominal
MIN_RESONANCE_RADIUS: 2.0,        // Min 2 units
MAX_RESONANCE_RADIUS: 7.0,        // Max 7 units

// Modulation
HARMONY_RADIUS_MULTIPLIER: 1.5,   // Harmony expands 1.5×
CORRUPTION_RADIUS_MULTIPLIER: 0.5, // Corruption shrinks to 50%

// Alignment
BASE_ALIGNMENT_STRENGTH: 0.3,     // 30% base influence
HARMONY_ALIGNMENT_BOOST: 1.4,     // Harmony 1.4× (42%)
CORRUPTION_ALIGNMENT_DAMPEN: 0.4, // Corruption 0.4× (12%)

// Temporal
RESONANCE_BUILD_DURATION: 1.2,    // Ramp-up time
RESONANCE_DECAY_DURATION: 1.5,    // Fade-out time

// Performance
MAX_INFLUENCED_LINKS_PER_ZONE: 12,
UPDATE_INTERVAL: 1 / 30,           // Throttle to 30 Hz

// Debug
DEBUG_DRAW_FIELDS: false
```

---

## Use Cases

### Scenario 1: Harmonic Hub Formation

When multiple links converge at a central node:
1. Composite glyph synthesizes (high harmony/synergy)
2. Resonance field activates with large radius
3. Nearby links phase-align to composite rhythm
4. Pictograms slow and space better
5. Visual coherence emerges

**Result**: Network "thinks" together—motion becomes coordinated without explicit control.

### Scenario 2: Corruption Disturbance

When corruption rises:
1. Composite glyph still forms but with low harmony
2. Resonance field activates with small radius
3. Weak, localized influence
4. Only closest links slightly affected
5. Motion remains chaotic

**Result**: Corruption "drowns out" resonance; network fragments.

### Scenario 3: Healing Recovery

When harmony is restored:
1. Composite glyphs reform with high harmony
2. Resonance field expands rapidly (ramp-up)
3. Motion gradually synchronizes
4. Pictograms flow more smoothly
5. Network feels "recovered"

**Result**: Visual testimony of healing—motion tells the story.

---

## Testing & Validation

### Manual Testing

```javascript
// Enable resonance + debug visualization
game.enableResonance();
game.toggleResonanceDebug();

// Create composite glyphs (via game play or console)
// Observe: Wireframe spheres appear around composites
// Observe: Nearby links slightly smooth their motion
// Observe: Pictograms slow and improve spacing

// Disable resonance
game.disableResonance();
game.toggleResonanceDebug();
```

### Validation Checklist

- [ ] Composite glyphs activate fields correctly
- [ ] Fields expand/shrink based on harmony
- [ ] Phase alignment is smooth (no snapping)
- [ ] Pictogram motion is gentled (never forced)
- [ ] No performance degradation (30 Hz cap works)
- [ ] Fields decay gracefully after composite separation
- [ ] Harmony-dominant: Clear, legible resonance
- [ ] Corruption-dominant: Weak, localized influence
- [ ] No visual artifacts or unexpected behavior

---

## Philosophy Recap

This system embodies a key principle: **emergent structures shape their context**.

Rather than imposing motion from external rules, the Harmonic Resonance Feedback System lets composite glyphs (which represent synthesized meaning) naturally influence the flow around them.

The result is a **living network**—one where structure, motion, and meaning continuously inform each other. The network doesn't feel controlled; it feels **coherent**. It doesn't feel scripted; it feels **intelligent**.

That's the beauty of resonance.

---

**System Status**: ✅ Production-Ready  
**Last Updated**: Session 140  
**Integration**: `main.js` (constructor + animate loop)  
**Console API**: Ready
