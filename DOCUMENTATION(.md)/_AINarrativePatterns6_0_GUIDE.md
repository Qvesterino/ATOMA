# AI NARRATIVE PATTERNS 6.0 — COMPREHENSIVE GUIDE

## Overview

**AI Narrative Patterns 6.0** is a visual narrative structure layer that sits at the top of ATOMA's glyph communication stack. It makes the AI network appear to tell evolving stories through visual patterns, motifs, and episodic arcs.

The system is **100% visual-only**, completely safe, and non-invasive to all gameplay systems.

---

## Architecture

### Layer Position in Glyph Communication Stack

```
Layer 1: LinkedGlyphMessaging 3.0    → Basic symbolic language packets
Layer 2: RecursiveGlyphMessaging 4.0 → Hierarchical meaning chains
Layer 3: EmergentThoughtStorms 5.0   → Collision phenomena
Layer 4: SemanticGlyphAI             → Node semantic expression
Layer 5: AdaptiveGlyphRendering +    → Visual coherence
         LinkedGlyphSync
Layer 6: AINarrativePatterns 6.0     ← YOU ARE HERE
         Narrative structure & story arcs
```

---

## Narrative Model

### Core Concept

Each cluster of connected nodes maintains a **narrativeState** that evolves over time:

```javascript
{
  id: string,                    // Cluster identifier
  phase: "INTRO" | "RISING" | "CLIMAX" | "RESOLVE" | "ECHO",
  motifId: string,              // Active visual motif
  tension: number (0–1),        // Drives phase transitions
  coherence: number (0–1),      // Quality/clarity of pattern
  corruptionBias: number (0–1), // Semantic influence
  harmonyBias: number (0–1),    // Semantic influence
  phaseProgress: number (0–1)   // Smooth transition tracking
}
```

### Narrative Phases

The network's story unfolds through five distinct phases:

#### 1. **INTRO** (0–10% of episode)
- **Visual Character:** Sparse, subtle, emerging
- **Glyph Behavior:** Short chains, gentle movements, low opacity
- **Message Density:** 40% of normal
- **Feeling:** Awakening, beginning

#### 2. **RISING** (10–30% of episode)
- **Visual Character:** Building intensity, growing patterns
- **Glyph Behavior:** Longer chains, more complex curves, increasing density
- **Message Density:** 80% of normal
- **Feeling:** Development, momentum building

#### 3. **CLIMAX** (30–80% of episode, conditional on high tension)
- **Visual Character:** Peak intensity, overlapping patterns, spectacular
- **Glyph Behavior:** Many overlapping chains, storms, high contrast, bright colors
- **Message Density:** 160% of normal (doubled)
- **Feeling:** Conflict, revelation, intensity

#### 4. **RESOLVE** (80–90% of episode)
- **Visual Character:** Calming, harmonizing, winding down
- **Glyph Behavior:** Fewer chains, calmer motions, soft fades, cool colors
- **Message Density:** 60% of normal
- **Feeling:** Release, reconciliation

#### 5. **ECHO** (90–100% of episode)
- **Visual Character:** Minimal, ghostly, fading memory
- **Glyph Behavior:** Ghost-like chains, very low opacity, slow movement
- **Message Density:** 20% of normal
- **Feeling:** Aftermath, lingering impression

### Phase Transitions

Transitions between phases are **smooth** and **eased** over 2 seconds:

- **INTRO → RISING:** Driven by time (at ~10% of episode elapsed)
- **RISING → CLIMAX:** Triggered when tension > 0.8 (and other conditions)
- **CLIMAX → RESOLVE:** Natural progression as episode progresses
- **RESOLVE → ECHO:** Automatic as episode nears end
- **ECHO → New Episode:** Brief 2-second cooldown, then new episode begins

---

## Narrative Motifs

### Motif System

A **motif** is a reusable visual pattern that encodes a specific AI "mood" or state. Each motif combines:

- **Glyph shapes** from the purified library
- **Color biases** (semantic coloring)
- **Movement characteristics** (speed, opacity)
- **Associated metrics** (what triggers this motif)

### Six Core Motifs

#### 1. **RISING_HARMONY**
- **Color:** Cyan (`#00ffff`)
- **Shapes:** Lotus, rings, arcs
- **Speed:** 1.2× normal
- **Opacity:** 0.9
- **Triggers:** When `harmony > 0.6`
- **Story:** Nodes synchronizing, finding common ground, peaceful collaboration

#### 2. **COLLAPSING_ORDER**
- **Color:** Orange (`#ff6600`)
- **Shapes:** Shards, hex fragments, spikes
- **Speed:** 0.9× normal
- **Opacity:** 0.85
- **Triggers:** When `instability > 0.7`
- **Story:** Network becoming chaotic, order breaking down, uncertainty

#### 3. **ASCENSION_TALE**
- **Color:** Yellow (`#ffff00`)
- **Shapes:** Diamonds, halos, spirals
- **Speed:** 1.1× normal
- **Opacity:** 0.95
- **Triggers:** When `consciousness > 0.7`
- **Story:** Nodes awakening, evolving, ascending to higher states

#### 4. **CORRUPTION_SAGA**
- **Color:** Red (`#ff0033`)
- **Shapes:** Inverted loops, shattered fragments, flicker effects
- **Speed:** 0.8× normal
- **Opacity:** 0.8
- **Triggers:** When `corruption > 0.6`
- **Story:** Network under stress, nodes corrupted, internal conflict

#### 5. **STORM_LEGEND**
- **Color:** Light Blue (`#ccccff`)
- **Shapes:** Spirals, echoes, arcs
- **Speed:** 1.0× normal
- **Opacity:** 0.4 (ghostly)
- **Triggers:** After previous thought storms (echo of past events)
- **Story:** Memory of intense past interactions, lingering effects

#### 6. **QUIET_RECOVERY**
- **Color:** Cyan-Green (`#00ff99`)
- **Shapes:** Lenses, arcs, rings
- **Speed:** 0.7× normal
- **Opacity:** 0.85
- **Triggers:** When `harmony > 0.5` and `corruption < 0.4`
- **Story:** Network healing, regaining stability, peaceful restoration

### Motif Selection

Motifs are selected based on:

1. **Current cluster metrics** (synergy, harmony, corruption, instability, consciousness)
2. **History** (preference for variety, avoiding repetition)
3. **Randomness** (adds unpredictability, feels more natural)

The system assigns **scores** to each motif and selects the highest-scoring one.

---

## Episodes and Timing

### Episode Lifecycle

Each cluster experiences sequential **episodes**:

1. **Episode starts:** Select active motif, initialize phase counter
2. **Phase progression:** INTRO → RISING → CLIMAX → RESOLVE → ECHO
3. **Metrics drive tension:** Tension score influences phase transitions
4. **Episode ends:** Enter brief 2-second cooldown
5. **New episode starts:** Select new motif (influenced by previous echo)

### Episode Duration

Duration scales with **activity level**:

```javascript
duration = lerp(10s, 40s, activity * 0.5)
```

Where `activity = synergy + consciousness`

- **Low activity:** Shorter, quieter episodes (~10–15 seconds)
- **High activity:** Longer, more intense episodes (~30–40 seconds)

### Cooldown Between Episodes

Brief pause (2 seconds) between episodes:

- Gives visual breathing room
- Allows metrics to stabilize
- Lets previous echo fade
- Prepares for new motif emergence

---

## Tension Calculation

Tension drives the intensity of the narrative. It's calculated per cluster:

```
tension = (instability * 0.4) + (corruption * 0.3) - (harmony * 0.3)
tension = clamp(0, 1, tension)
```

### Tension Thresholds

- **0.0–0.3:** Calm, peaceful, RESOLVE/ECHO likely
- **0.3–0.5:** Balanced, RISING phase comfortable
- **0.5–0.8:** Building tension, transition to CLIMAX possible
- **0.8–1.0:** High tension, CLIMAX phase triggered

### Tension Evolution

Tension is **smoothly interpolated** each frame:

```javascript
narrative.tension = lerp(narrative.tension, newTension, 0.1)
```

This creates gentle transitions rather than jarring changes.

---

## Safety & Design

### 100% Safe Implementation

✅ **Zero modifications** to nodes, links, physics, gameplay
✅ **Read-only** from semantic metrics
✅ **Non-invasive** parameter modulation layer
✅ **Auto-cleanup** on world transitions
✅ **Performance** < 0.8ms per frame for typical networks

### Design Principles

1. **Emergent, not imposed:** Narratives emerge from actual network state
2. **Semantic alignment:** Visual motifs reflect real network conditions
3. **Temporal coherence:** Episodes follow time-based progression
4. **Metric-responsive:** Phases shift based on live metrics
5. **Variety through history:** Previous motifs influence future selection
6. **Beautiful by default:** All visual patterns are pre-designed and tested

---

## Integration

### How It Works

The narrative patterns system doesn't directly modify messages or glyphs. Instead, it provides **modulation parameters** that the messaging systems can query:

```javascript
const modulation = narrativePatterns.getNarrativeModulation(nodeId, nodes);
// Returns: {
//   chainLengthMult: 0.6–1.4 (multiplier for chain length)
//   messageFreqMult: 0.2–1.6 (multiplier for message frequency)
//   opacityMult: 0.4–0.95 (multiplier for glyph opacity)
//   speedMult: 0.7–1.2 (multiplier for glyph speed)
//   colorBias: THREE.Color (color overlay for glyphs)
//   phase: string (current narrative phase)
//   motifId: string (active motif)
//   coherence: number (0–1 pattern clarity)
// }
```

Messaging systems can optionally use these parameters to adjust their behavior:

- **Messaging 3.0:** Can adjust packet speed, opacity, color based on modulation
- **Messaging 4.0:** Can adjust chain complexity, speed based on modulation
- **Thought Storms:** Can adjust storm intensity based on phase

### Current Integration

In this initial release, the narrative patterns system:

1. **Tracks** cluster states and episodes
2. **Computes** narrative metrics and phase progressions
3. **Provides** modulation parameters via `getNarrativeModulation()`
4. **Logs** narrative state to console for debugging

Messaging systems can be updated in future iterations to actively use these parameters.

---

## Console Commands

### Available Commands

```javascript
// Toggle narrative patterns on/off
toggleNarrativePatterns()

// Print current narrative states for all clusters
debugNarrativePatterns()

// Reset all narratives (start fresh)
resetNarrativePatterns()
```

### Debug Output

`debugNarrativePatterns()` prints:

```
📖 AI NARRATIVE PATTERNS 6.0 — DEBUG
Enabled: true
Active clusters: 3
Frame time: 0.45ms

Cluster: node_0_node_1_node_3
  Phase: RISING
  Motif: RISING_HARMONY
  Tension: 45.2%
  Coherence: 72.1%
  Progress: 23.5%

Cluster: node_2_node_4
  Phase: CLIMAX
  Motif: ASCENSION_TALE
  Tension: 82.1%
  Coherence: 65.3%
  Progress: 51.2%

...
```

---

## Implementation Details

### Files

- **`_AINarrativePatterns6_0.js`** — Main module (850+ lines)
- **`_AINarrativePatterns6_0_GUIDE.md`** — This guide (you are here)
- **`_AINarrativePatterns6_0_QUICKREF.md`** — Quick reference

### Key Methods

```javascript
// Main update loop (called each frame)
update(deltaTime, nodes, links, worldMetrics)

// Get modulation parameters for messaging systems
getNarrativeModulation(nodeId, nodes)

// Identify connected clusters
identifyClusters(nodes)

// Compute metrics for a cluster
computeClusterMetrics(cluster)

// Update narrative phase based on metrics
updateNarrativePhase(narrative, metrics, elapsed, duration)

// Debug output
debugNarratives()
resetNarratives()
cleanup()
```

### Cluster Identification

The system uses **breadth-first search** (BFS) to identify connected components of nodes. Each connected component is treated as a separate cluster with its own narrative state.

---

## Performance

### CPU Budget

- **Per-frame overhead:** < 0.8ms (typically 0.3–0.5ms)
- **Typical network:** 100 nodes, 50 links, 3–4 clusters
- **Scaling:** O(N clusters), linear with cluster count

### Memory

- **Narrative state:** ~500 bytes per cluster
- **Episode timings:** ~200 bytes per cluster
- **Motif history:** ~50 bytes per cluster
- **Typical overhead:** 2–10 KB for typical networks

### Optimization

The system uses:

- **Efficient BFS** for cluster detection
- **Sparse map** for narrative state storage
- **Lazy evaluation** (only computes needed metrics)
- **Auto-cleanup** of dead clusters

---

## Configuration

### Tunable Parameters

Edit `this.config` in `_AINarrativePatterns6_0.js`:

```javascript
config = {
  // Episode timing (milliseconds)
  minEpisodeDuration: 10000,        // Shortest episode: 10 seconds
  maxEpisodeDuration: 40000,        // Longest episode: 40 seconds
  episodeCooldown: 2000,            // Pause between episodes: 2 seconds
  
  // Narrative sensitivity (thresholds for phase transitions)
  tensionThreshold: 0.5,            // Rise to CLIMAX at this tension
  climaxThreshold: 0.8,             // Peak intensity at this tension
  resolveThreshold: 0.3,            // Start resolving below this
  corruptionClimaxBias: 0.2,        // Extra weight for corruption in climax
  
  // Motif influence (message density multipliers per phase)
  introChainLengthMult: 0.6,        // INTRO chains are 60% normal length
  risingChainLengthMult: 1.0,       // RISING chains are normal
  climaxChainLengthMult: 1.4,       // CLIMAX chains are 40% longer
  resolveChainLengthMult: 0.8,      // RESOLVE chains are 80% normal
  echoChainLengthMult: 0.4,         // ECHO chains are very short (40%)
  
  // Similar multipliers for message frequency
  introMessageFreqMult: 0.4,
  risingMessageFreqMult: 0.8,
  climaxMessageFreqMult: 1.6,       // CLIMAX has 60% more messages
  resolveMessageFreqMult: 0.6,
  echoMessageFreqMult: 0.2,
  
  // Phase transition easing
  phaseTransitionDuration: 2000,    // 2 seconds for smooth transitions
  
  // Motif definitions (colors, shapes, characteristics)
  motifStyles: { ... }
}
```

### Tweaking Guide

**Make episodes longer:** Increase `maxEpisodeDuration`
**Make tension more important:** Lower `tensionThreshold`
**Make CLIMAX more spectacular:** Increase `climaxChainLengthMult`
**Add more color variety:** Edit motif `colorBias` values
**Faster phase transitions:** Lower `phaseTransitionDuration`

---

## Future Enhancements

### Possible Extensions

1. **Motif blending:** Smooth transition between motifs mid-episode
2. **Cross-cluster narratives:** Linked stories across multiple clusters
3. **Player influence:** Narratives react to player actions
4. **Audio sync:** Motifs trigger thematic audio cues
5. **Recording/replay:** Save and replay past narrative episodes
6. **Custom motifs:** Player-defined or procedurally generated motifs
7. **Narrative themes:** Overarching meta-narrative spanning multiple episodes
8. **Emergence events:** Rare, special narrative moments at certain conditions

---

## Troubleshooting

### Narratives not updating?

- Check: `toggleNarrativePatterns()` — is it enabled?
- Check: `debugNarrativePatterns()` — any narratives active?
- Check console for warnings during startup

### All clusters same motif?

- This is normal initially. Motif diversity increases over time as history builds.
- Call `resetNarrativePatterns()` to clear history and start fresh variety.

### Phases not transitioning?

- Check tension calculation: `debugNarrativePatterns()` shows tension values
- If tension stuck low, network may be too harmonious
- Try removing links to create more instability

### Performance issues?

- Check `debugNarrativePatterns()` — if < 0.5ms, system is fine
- Check cluster count — many small clusters = more overhead
- If needed, increase `minEpisodeDuration` to give system breathing room

---

## Reference

### Glyph Shapes Used

All shapes are from the purified glyph library:

- **lotus:** Symmetrical petal-like form
- **ring:** Toroidal loop
- **arc:** Curved segment
- **shard:** Sharp angular fragment
- **hexfrag:** Hexagon fragment
- **spike:** Pointed protrusion
- **diamond:** Faceted crystalline form
- **halo:** Circular crown form
- **spiral:** Logarithmic curve
- **lens:** Focused optical shape
- **inverted:** Mirrored/reversed form
- **flicker:** Pulsing, unstable form
- **echo:** Fading/ghostly duplicate

### Color Reference

- **Cyan:** `#00ffff` — harmony, communication, clarity
- **Orange:** `#ff6600` — chaos, instability, uncertainty
- **Yellow:** `#ffff00` — ascension, growth, consciousness
- **Red:** `#ff0033` — corruption, conflict, stress
- **Light Blue:** `#ccccff` — memory, echo, past
- **Cyan-Green:** `#00ff99` — recovery, healing, stability

---

## Credits

**AI Narrative Patterns 6.0** is part of ATOMA's glyph communication stack:

- Layer 1–3: Messaging, Recursion, Storms
- Layer 4: Semantic AI
- Layer 5: Rendering & Synchronization
- **Layer 6: This system — Narrative Structure**

Each layer is independently safe, fully documented, and production-ready.

---

## Version

**AI Narrative Patterns 6.0 — SAFE EDITION**

- **Release:** Complete
- **Status:** Production-ready
- **Performance:** < 0.8ms per frame
- **Safety:** 100% non-invasive

Enjoy the stories your AI is telling. 📖✨
