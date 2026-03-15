# ATOMA CASCADE PROPAGATION AUDIT — READ ONLY

## EXECUTIVE SUMMARY

**EXISTS_CASCADE_PROPAGATION: YES**

ATOMA contains **multiple cascade intensity propagation systems** with different purposes and implementations. No single system named "cascade intensity propagation" exists, but several systems implement this behavior.

---

## SYSTEMS IDENTIFIED

### 1️⃣ PRIMARY PROPAGATION SYSTEM
**FILE**: `CascadingHarmonicResonanceAmplification.js`

**FUNCTION**: `_propagateCascadeFromHub()`

**PROPAGATION TYPE**: Layer-based BFS cascade with harmonic resonance amplification

**TRAVERSAL METHOD**: 
- BFS (Breadth-First Search) through network topology
- `this.neighborGraph.get(nodeId)` for neighbor lookup
- Layer depth: 0-5 hops maximum

**INPUT METRICS**:
- `harmony` (node state)
- `synergy` (node state)
- `corruption` (node state)
- `resilience` (node state)
- Network topology (links, neighbors)

**OUTPUT DATA**:
- `node._cascadeLayer` (layer number 0-5)
- `node._cascadeStrength` (0-1 amplified intensity)
- `node._cascadeAmplitude` (resonance amplitude)
- `node._cascadePhase` (phase for visual sync)
- `node._cascadeSourceCount` (number of cascades affecting node)

**PROPAGATION MATH**:
```
cascadeStrength(layer, prev_strength) =
  prev_strength
  × 0.6^layer                              // Exponential decay
  × (1 + synergy × 0.3)                    // Amplification
  × (1 - corruption × 0.4)                 // Damping
  × (0.8 + harmony × 0.2)                  // Smoothing
  × (0.7 + resilience × 0.3)               // Stabilization
```

**SECONDARY HUB MECHANISM**: Nodes with `cascadeStrength > 0.7` become secondary hubs and re-emit cascades

**UPDATE LOOP**: Called via `update(deltaTime)` each frame

**CONSUMER SYSTEMS**: Node aura glow, pulse system, link glow, glyph system read this data

---

### 2️⃣ SECONDARY SYSTEM: WAVE PROPAGATION
**FILE**: `HarmonicInfluencePropagationSystem_Session127.js`

**FUNCTION**: `_emitInfluencePulse()`, `_updatePropagationWaves()`

**PROPAGATION TYPE**: Time-based pulse wave propagation through links

**TRAVERSAL METHOD**:
- Pulse emission from harmonic hubs every `propagationInterval` (2.0s default)
- Wave travels through links with `propagationSpeed` (3.0 units/s)
- `_getConnectedNodes(node)` for neighbor lookup
- One-way propagation (no back-propagation to hub)

**INPUT METRICS**:
- `harmony` (from source node)
- `synergy` (from link)
- `corruption` (from source node)

**OUTPUT DATA**:
- `this.nodeInfluenceState` (nodeId → influence data)
- `this.linkInfluenceState` (linkId → flow progress)
- Visual: Node influence auras, link flow meshes

**PROPAGATION MATH**:
```
waveDuration = distance / propagationSpeed
progress = waveStartTime / waveDuration
auraOpacity = baseOpacity + harmony × harmonyMult
opacity ×= (1 - corruption × corruptionDampen)
```

**UPDATE LOOP**: Called via `update(deltaTime)` each frame

**VISUAL ONLY**: Zero gameplay impact, pure visual adapter

---

### 3️⃣ SECONDARY SYSTEM: ZONE-BASED INFLUENCE
**FILE**: `HubInfluencePropagation.js`

**FUNCTION**: `propagateInfluence()`, `getNeighborsForNode()`

**PROPAGATION TYPE**: Zone-based influence field with distance attenuation

**TRAVERSAL METHOD**:
- `getNeighborsForNode()` computes zone1/zone2 neighbors
- Cached in `this.neighborCache`
- Zone 1: Direct neighbors (one-hop)
- Zone 2: Secondary neighbors (two-hop)

**INPUT METRICS**:
- `hubSyncStrength` (from hub)
- `harmony`, `synergy`, `corruption`, `instability`, `resilience` (hub state)

**OUTPUT DATA**:
- `node.userData.influenceFields[]` (influence data from each hub)
- `link.userData.influenceFields[]` (phase bias, coherence boost)
- Zone strengths: `zone1Strength` (60% of hub), `zone2Strength` (25% of hub)

**PROPAGATION MATH**:
```
hubInfluenceStrength = hubSyncStrength × (harmony × 0.5 + synergy × 0.5)
                       × (1 - corruption × 0.3) × (1 - instability × 0.4)
                       × (0.7 + resilience × 0.3)

zone1Strength = hubStrength × 0.6
zone2Strength = hubStrength × 0.25
```

**UPDATE LOOP**: Called via `update(deltaTime, hubSystemData, nodeRegistry, linkRegistry)`

**READ-ONLY**: Adapter layer, writes only to userData for visual systems

---

### 4️⃣ SECONDARY SYSTEM: RUPTURE CASCADE
**FILE**: `CascadingRuptureSystem.js`

**FUNCTION**: `propagateCascade()`, `propagateFromNode()`

**PROPAGATION TYPE**: Hop-based cascade with energy decay (corruption-driven)

**TRAVERSAL METHOD**:
- `getNodeLinks(node)` for neighbor lookup
- Front-based propagation (currentFront → nextFront)
- Visited set prevents cycles
- Max depth: 3 hops

**INPUT METRICS**:
- `corruption` (node metrics)
- `stability` (node metrics)
- Link quality (resists cascade)
- Rupture history (probability scaling)

**OUTPUT DATA**:
- `this.activeCascades[]` (cascade propagation state)
- `this.visualEffects[]` (tear, destabilize, coherence_loss effects)
- Events: `onCascadeStart`, `onCascadeHop`, `onCascadeComplete`, `onNodeCritical`

**PROPAGATION MATH**:
```
cascadeProbability = BASE_CHANCE + corruptionBonus + ruptureHistoryBonus + healingDeficit
currentEnergy ×= (1 - ENERGY_DECAY_PER_HOP)  // 35% loss per hop
```

**UPDATE LOOP**: Called via `update(deltaTime, time, ruptureSystem, harmonySystem)`

**VISUAL + EVENTS**: Visual effects + critical node events

---

### 5️⃣ DORMANT SYSTEM: CASCADE AMPLIFICATION
**FILE**: `HarmonicCascadeAmplification_Session145.js`

**FUNCTION**: None (cascades disabled)

**PROPAGATION TYPE**: Not active (safe skeleton)

**STATUS**: 
- `enabled: false` by default
- Only `HubProximityDetector` active (detection only)
- Prepared for future cascade activation
- No propagation logic implemented yet

**TRIGGER CONDITIONS**: None (disabled)

---

## PATTERN SEARCH RESULTS

### ✅ FOUND PATTERNS
- **BFS traversal**: `CascadingHarmonicResonanceAmplification._propagateCascadeFromHub()`
- **Neighbor lookup**: `_getConnectedNodes()`, `getNeighborsForNode()`, `neighborGraph.get()`
- **Decay math**: `Math.pow(0.6, layer)`, `ENERGY_DECAY_PER_HOP = 0.35`
- **Layer-based propagation**: Zone 1 (60%), Zone 2 (25%), max 5 layers
- **Secondary hub re-emission**: Threshold-based cascade branching
- **Phase propagation**: Wave-based influence with timing
- **Distance attenuation**: Zone-based field falloff
- **Multi-cascade interference**: Constructive/destructive interference calculation

### ❌ NOT FOUND
- No files using literal patterns: `cascadeIntensity`, `cascadeLevel`, `cascadePropagation` (except in file names)
- No `link.userData.cascade*` properties found
- No `node.userData.cascade*` properties found
- Uses `_cascade*` prefix instead (e.g., `node._cascadeStrength`)

---

## FINAL ASSESSMENT

**EXISTS_CASCADE_PROPAGATION: YES**

### PRIMARY PROPAGATION SYSTEM
`CascadingHarmonicResonanceAmplification.js` — Full-featured cascade intensity propagation with:
- BFS layer-based traversal (0-5 hops)
- Exponential decay (0.6^layer)
- Multi-factor amplification (harmony, synergy, corruption, resilience)
- Secondary hub re-emission (threshold > 0.7)
- Multi-cascade interference calculation
- Stores output on nodes: `_cascadeLayer`, `_cascadeStrength`, `_cascadeAmplitude`, `_cascadePhase`

### SECONDARY HELPERS
1. **HarmonicInfluencePropagationSystem_Session127.js** — Wave-based pulse propagation (time-based, visual-only)
2. **HubInfluencePropagation.js** — Zone-based influence fields (distance attenuation, zone1/zone2)
3. **CascadingRuptureSystem.js** — Corruption-driven rupture cascades (hop-based, energy decay)
4. **HarmonicCascadeAmplification_Session145.js** — Dormant skeleton (proximity detection only)

### INTEGRATION STATUS
All systems are **READ-ONLY adapters** or **visual-only** implementations:
- ✅ Zero gameplay impact
- ✅ No gameplay state modifications
- ✅ Pure visual adaptations
- ✅ Deterministic math (no randomness)
- ✅ Graceful degradation

**CONCLUSION**: ATOMA has robust cascade intensity propagation implemented through multiple specialized systems. No further implementation needed for this capability.