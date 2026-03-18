# ATOMA CASCADE SYSTEM AUDIT

**Dátum:** 18. marca 2026  
**Účel:** Mapovanie cascade systémov, ich inicializácie, vplyvu a prepojenia na metriky

---

## ZHRNUTIE (SUMMARY)

V kódovej báze ATOMA boli identifikované **4 hlavné cascade systémy**:

1. **CascadingHarmonicResonanceAmplification** - Harmonický cascade engine
2. **CascadingRuptureSystem** - Systém nestability (rupture cascade)
3. **CascadeParticleSystem_Session120** - Vizuálny particlesystém pre cascady
4. **HarmonicCascadeAmplification_Session145** - Novší harmonický cascade (detekcia len)

**STAV INTEGRÁCIE:** Systémy existujú ako samostatné moduly. Ne nájdené priame inštancie v index.html alebo main.js. Pravdepodobne sú volané dynamicky alebo čakajú na aktiváciu.

---

## 1. CASCADING HARMONIC RESONANCE AMPLIFICATION

**Súbor:** `CascadingHarmonicResonanceAmplification.js`

### Popis systému
Amplifikuje harmonický stav cez sieťovú topológiu, vytvára vizuálne vzory kde silné hubs šíria rezonanciu.

### Inicializácia
- **Constructor:** `new CascadingHarmonicResonanceAmplification(network = null)`
- **Volané metódy:**
  - `update(deltaTime)` - Main update loop
  - `setupCascadingResonanceConsoleAPI(cascadeSystem)` - Console API setup
- **Referencie v kóde:** Žiadne priame importy/inštanácie nájdené

### Čo ovplyvňuje (WRITES)
**Node data:**
```javascript
node._cascadeLayer        // Layer number (0-5)
node._cascadeStrength     // Combined cascade strength (0-1)
node._cascadeAmplitude    // Max resonance amplitude
node._cascadePhase        // Combined phase (0-2π)
node._cascadeSourceCount  // Number of cascade sources
```

**userData.metrics:**
```javascript
node.userData.cascadeStrength     // Cascade strength
node.userData.cascadeAmplitude    // Cascade amplitude
node.userData.cascadePhase        // Cascade phase
```

**userData.waveField:** (pre wave shaders/particles)
```javascript
node.userData.waveField.constructive  // Constructive interference
node.userData.waveField.destructive  // Destructive interference
node.userData.waveField.standing     // Standing wave energy
node.userData.waveField.amplitude     // Wave amplitude
node.userData.waveField.phase         // Wave phase
node.userData.waveField.sourceCount   // Source count
```

### Čo číta (READS)
**Metriky z node.userData.metrics:**
```javascript
harmony      // Harmonický stav
synergy      // Synergia
corruption   // Korupcia
resilience   // Odolnosť (alebo stability fallback)
```

**Sieťová topológia:**
- `network.nodes` - Map of nodes
- `network.links` - Pole linkov
- Neighbor graph (cached)

### Metodika cascade
**Layer architecture:**
- Layer 0: Primary harmonic hub (100% strength)
- Layer 1: Direct neighbors (60% decay)
- Layer 2: Secondary reach (40% decay from L1)
- Layer 3: Tertiary reach (30% decay from L2)
- Layer 4+: Far field (10% decay per layer)

**Formula pre cascade strength:**
```
cascadeStrength = prev_strength × layerDecay(layer) × (1 + synergy × 0.3) 
                 × (1 - corruption × 0.4) × (0.8 + harmony × 0.2) 
                 × (0.7 + resilience × 0.3)
```

**Secondary hub threshold:** 0.7
- Ak cascadeStrength > threshold, node sa stáva secondary hub
- Re-emits cascade downstream (re-amplification)

### Spotrebitelia (CONSUMER SYSTEMS)
Tieto systémy čítajú cascade dáta:
- Node aura glow intensity = base × (1 + cascadeStrength × 0.5)
- Node pulse rate = base × (1 + cascadeStrength × 0.4)
- Link glow = base + cascadeStrength × 0.3
- Glyph intensity = glyph × (0.7 + cascadeStrength × 0.3)

### Eventy
```javascript
semanticBus.emit('cascade.triggered', {
  sourceNode: nodeId,
  strength: strength,
  position: {x, y, z}
});
// Emitnuté keď cascadeStrength > 0.65
```

### Performance
- Setup: O(E) kde E = edges (cached)
- Per-frame: O(H × L × N) kde H = hubs, L = layers, N = branching
- Typicky: ~0.8ms pre 50-node network, ~2ms pre 100-node network
- Memory: ~4KB per node

---

## 2. CASCADING RUPTURE SYSTEM

**Súbor:** `CascadingRuptureSystem.js`

### Popis systému
Vizualizuje rupture energiu šíriacu sa cez sieťové regióny. Pod dostatočným stresom ruptures kaskádujú region-to-region.

### Inicializácia
- **Constructor:** `new CascadingRuptureSystem(scene, aiNodes, linkingSystem, regionalEquilibrium)`
- **Volané metódy:**
  - `enable()` / `disable()` - Enable/disable cascade propagation
  - `update(deltaTime, time, ruptureSystem, harmonySystem)` - Main update
- **Console API:** `CascadeSystemConsoleAPI.js` (game.enableCascades, game.triggerCascade, atď.)

### Konfigurácia
```javascript
CONFIG = {
  DETECTION_INTERVAL: 0.5,          // Check every 0.5s
  CORRUPTION_THRESHOLD: 0.35,      // Region must exceed
  STABILITY_THRESHOLD: 0.4,         // Region must have < 40% stability
  STANDING_WAVE_THRESHOLD: 0.3,    // Unresolved wave energy > 30%
  
  BASE_CASCADE_CHANCE: 0.15,        // 15% base chance
  CORRUPTION_WEIGHT: 0.5,           // +50% per unit above threshold
  RUPTURE_HISTORY_WEIGHT: 0.3,      // +30% per recent rupture
  HEALING_DEFICIT_WEIGHT: 0.4,      // +40% if no recent healing
  
  MAX_CASCADE_DEPTH: 3,            // Max hops from origin
  ENERGY_DECAY_PER_HOP: 0.35,      // 35% loss per hop
  MIN_PROPAGATION_ENERGY: 0.1,      // Stop below 10%
  PROPAGATION_DELAY: 0.15,         // Seconds between hops
  
  TEAR_DURATION: 0.8,               // Visual effect duration
  DESTABILIZATION_DURATION: 1.2,
  COHERENCE_LOSS_DURATION: 0.6,
  
  MAX_ACTIVE_CASCADES: 8,          // Max simultaneous cascades
  VISUAL_POOL_SIZE: 32             // Pre-allocated effects
}
```

### Čo ovplyvňuje (WRITES)
**Link visual effects:**
```javascript
link.userData.visualTear              // Phase destabilization
link.userData.visualCoherenceLoss     // Link dimming/flicker
```

**Node visual effects:**
```javascript
node.userData.visualDestabilization   // Stability disruption
node.userData.lastCascadeTime         // Last cascade timestamp
node.userData.approachingCritical     // True if critical
node.userData.criticalEnergy          // Energy when critical
```

### Čo číta (READS)
**Metriky z node.userData.metrics:**
```javascript
corruption   // Korupcia (pre initial energy calculation)
stability    // Stabilita (pre critical check)
```

**Link data:**
```javascript
link.userData.corruptionLevel   // Cascade corruption check
link.userData.quality           // Link quality (resists cascade if > 0.7)
```

**Network:**
- `aiNodes.nodes` - Pole nodov
- `linkingSystem.getNodeLinks(node)` - Links pre node

### Vizualne efekty (3 typy)
1. **Tear** - Spatial tearing: rapid phase shift along links
2. **Destabilize** - Phase destabilization: nodes lose coherence
3. **Coherence Loss** - Sudden coherence loss: links flicker and dim

### Event hooks
```javascript
onCascadeStart(originNode, energy)    // Pri cascade start
onCascadeHop(fromNode, toNode, energy) // Pri každom hop
onCascadeComplete(originNode, totalHops) // Pri cascade complete
onNodeCritical(node)                   // Keď node vstúpi do critical state
```

### History tracking
```javascript
ruptureHistory: Map<nodeId, timestamp[]>  // Posledné 20 ruptures per node
healingHistory: Map<nodeId, timestamp>    // Posledné healing timestamp
```

---

## 3. CASCADE PARTICLE SYSTEM (Session 120)

**Súbor:** `CascadeParticleSystem_Session120.js`

### Popis systému
"Semantic Particle Encoding" pre conflict cascades. Particles shape a motion nesú význam o type konfliktu a smere toku.

### Inicializácia
- **Constructor:** `new CascadeParticleSystem_Session120(scene, config = {})`
- **Setup:** `setupCascadeParticleSystem(game, options)`
- **Semantic subscriptions:** Listens for `cascade.hop` events

### Shape encoding (Čo sa deje?)
- **Phase Conflict (0)** → Arcs/Crescents (Out of sync)
- **Polarity Conflict (1)** → Forked/Split (Opposing intent)
- **Corruption Conflict (2)** → Fractured Shards (Structural damage)
- **Stability Conflict (3)** → Irregular Blobs (Unreliable)

### Velocity encoding (Kam influence ide?)
- **Forward Flow** → Dominant propagation
- **Backflow** → Resistance/Absorption
- **Oscillatory** → Stalemate/Negotiation

### Čo ovplyvňuje (WRrites)
**GPU geometry:**
```javascript
positions[3]    // Particle positions
colors[3]       // Particle colors
sizes[1]        // Particle sizes
shapeIndices[1] // Texture atlas indices (0-3)
angles[1]       // Rotation angles
```

### Čo číta (READS)
**Link data:**
```javascript
link.source, link.target           // Node positions
link.userData.cascadeIntensity      // Cascade intensity
link.userData.cascadeParticleColor  // Particle color
link.userData.cascadeConflictType   // Conflict type
```

**Configurable link data (density clustering):**
```javascript
link.userData.particleDensityMultiplier  // Density multiplier
link.userData.particleClusterCohesion   // Cluster cohesion (0-1)
link.userData.particleClusterRadius     // Cluster radius
link.userData.particleUrgencyOscillation // Urgency oscillation
```

**Semantic events:**
```javascript
semanticBus.on('cascade.hop', (event) => {
  // Spawns particles when cascade hops
  spawnCascadeParticles(event.link, event.intensity, event.hopIndex)
})
```

### Emission logic
```javascript
count = baseParticles × intensity × hopDecay^hopIndex
hopDecay = 0.82

// Density clustering (Session 121)
rate = emissionRate × 10 × boost × intensity × densityMultiplier
```

### Performance
- **GPU draw call:** Single THREE.Points
- **Particle pool:** 3000 particles (configurable)
- **Zero per-frame allocations**
- **CPU-driven motion** (complex path following)
- **Shader-driven shape selection** (via attributes)

---

## 4. HARMONIC CASCADE AMPLIFICATION (Session 145)

**Súbor:** `HarmonicCascadeAmplification_Session145.js`

### Popis systému
"Safe Skeleton" s proximity detection foundation. Detekuje nearby harmonic hubs a pripravuje pôdu pre budúce cascady.

**STAV:** Proximity detection active, cascades disabled. Príprava na budúcu aktiváciu.

### Inicializácia
- **Constructor:** `new HarmonicCascadeAmplification_Session145(scene, world, harmonicHubSystem, linkResonanceSystem, nodeAuraSystem, config)`
- **Setup:** `setupCascadeConsoleAPI(globalWindow, cascadeSystem)`

### Subsystémy
1. **HubProximityDetector** - Always active (detection)
2. **HarmonicPhaseSynchronization_Session146** - Temporal alignment
3. **PreCascadeVisualHint_Session146** - Subtle visual tension cues
4. **CascadeResonanceWaveVisualization_Session146** - Ghost-level wave suggestion

### Čo ovplyvňuje (WRITES)
**Niečo?** - Current status: Detection only, no cascade effects

### Čo číta (READS)
**Hub data:**
```javascript
harmonicHubSystem.hubs  // Array of harmonic hubs
```

**Proximity detection:**
```javascript
maxProximityDistance: 24.0
minHarmonyThreshold: 0.2
```

### Proximity stats
```javascript
stats = {
  proximityPairsDetected: 0,    // Number of proximal pairs
  activeCascades: 0,            // Always 0 (disabled)
  cascadesCreated: 0,
  totalAmplification: 0,
  phaseLocked: 0,
  activeWaves: 0,
  avgCascadeStrength: 0
}
```

### Console API
```javascript
window.cascade_info()              // Show status
window.cascadeStatus()             // Show proximity status
window.getHubProximityStats()      // Get proximity stats
window.getProximityPairs()         // List proximal pairs
window.toggleCascadeDebug(bool)     // Debug mode
```

---

## INTEGRÁCIA S METRIKAMI

### Metriky používané všetkými cascade systémami

| Metrika | Zdroj | CascadingHarmonic | CascadingRupture | CascadeParticles | HarmonicCascade145 |
|---------|-------|-------------------|------------------|------------------|-------------------|
| **harmony** | node.userData.metrics.harmony | ✅ READ | - | - | ✅ READ (proximity) |
| **synergy** | node.userData.metrics.synergy | ✅ READ | - | - | - |
| **corruption** | node.userData.metrics.corruption | ✅ READ | ✅ READ | - | - |
| **stability** | node.userData.metrics.stability | ✅ READ (via resilience) | ✅ READ | - | - |
| **resilience** | node.userData.metrics.resilience | ✅ READ | - | - | - |

### Metriky generované cascade systémami

| Metrika | Kam | Systém | Popis |
|---------|-----|---------|-------|
| **cascadeStrength** | node.userData.metrics.cascadeStrength | CascadingHarmonic | Combined cascade strength (0-1) |
| **cascadeAmplitude** | node.userData.metrics.cascadeAmplitude | CascadingHarmonic | Max resonance amplitude |
| **cascadePhase** | node.userData.metrics.cascadePhase | CascadingHarmonic | Combined phase (0-2π) |
| **waveField.constructive** | node.userData.waveField.constructive | CascadingHarmonic | Constructive interference |
| **waveField.destructive** | node.userData.waveField.destructive | CascadingHarmonic | Destructive interference |
| **waveField.standing** | node.userData.waveField.standing | CascadingHarmonic | Standing wave energy |
| **waveField.amplitude** | node.userData.waveField.amplitude | CascadingHarmonic | Wave amplitude |
| **visualTear** | link.userData.visualTear | CascadingRupture | Phase destabilization |
| **visualCoherenceLoss** | link.userData.visualCoherenceLoss | CascadingRupture | Coherence loss |
| **visualDestabilization** | node.userData.visualDestabilization | CascadingRupture | Stability disruption |

---

## SPOJENIA MEDZI SYSTÉMAMI

### Event flow diagram

```
[CascadingHarmonicResonanceAmplification]
    ↓ (semanticBus.emit('cascade.triggered'))
[HarmonicCascadeAmplification_Session145]
    ↓ (proximity detection)
[CascadeParticleSystem_Session120]
    ← (semanticBus.on('cascade.hop'))
    
[CascadingRuptureSystem]
    ↓ (onCascadeHop event)
[CascadeParticleSystem_Session120]
    ← (semanticBus.on('cascade.hop'))
```

### Data flow

1. **Harmonic cascade** calculates cascade strength
2. **Writes** cascade data to `node.userData.metrics` and `node.userData.waveField`
3. **Emits** `cascade.triggered` events via semanticBus
4. **Cascade particles** subscribes to `cascade.hop` events
5. **Rupture system** emits `cascade.hop` events during propagation
6. **Vizuálne systémy** čítajú cascade dáta pre aura, pulse, link glow

---

## DIAGNOSTIKA & DEBUGGING

### Console API prístupy

**CascadingHarmonicResonanceAmplification:**
```javascript
window.CascadeAPI.debug(true)              // Enable debug
window.CascadeAPI.stats()                  // Show stats
window.CascadeAPI.dump(10)                // Dump cascade state
window.CascadeAPI.queryNode(nodeId)        // Query specific node
window.CascadeAPI.setAmplification(factor) // Tune parameters
```

**CascadingRuptureSystem (via CascadeSystemConsoleAPI):**
```javascript
game.enableCascades()                      // Enable rupture propagation
game.disableCascades()                     // Disable rupture propagation
game.cascadeStatus()                       // Show status
game.triggerCascade(nodeIndex)             // Force cascade
game.listCriticalNodes()                  // List critical nodes
```

**HarmonicCascadeAmplification_Session145:**
```javascript
window.cascade_info()                      // Show status
window.getProximityPairs()                 // List proximal pairs
window.toggleCascadeDebug(true)            // Debug mode
```

---

## RIZIKÁ & POZNÁMKY

### 🟡 Yellow flags (nutná pozornosť)

1. **Neznáme inštancie:** Žiadne priame importy/inštanácie nájdené v index.html alebo main.js
   - Systémy môžu byť inicializované dynamicky
   - Alebo čakajú na aktiváciu v budúcnosti

2. **HarmonicCascadeAmplification_Session145:** "Safe skeleton" - cascade logic disabled
   - Iba proximity detection aktívna
   - Fázová synchronizácia pripravená ale nepoužitá
   - Pre cascade effects potrebujú enable flag

3. **Console API inconsistency:**
   - CascadingHarmonicResonanceAmplification má vlastnú `setupCascadingResonanceConsoleAPI()`
   - HarmonicCascadeAmplification_Session145 má vlastnú `setupCascadeConsoleAPI()`
   - CascadingRuptureSystem používa `CascadeSystemConsoleAPI.setupCascadeSystemConsoleAPI(game)`

### 🟢 Green flags (bezpečné)

1. **Zero gameplay impact:** Všetky cascade systémy sú označené ako "pure visual adapters"
2. **Deterministic:** Žiadny randomness v harmonických cascadoch
3. **Performance aware:** Cachovanie topológie, object pooling pre particles
4. **Graceful degradation:** Pracujú s čiastočnými dátami

---

## REKOMENDÁCIE

### 1. Mapovanie inicializácie
**Akcia:** Nájdite kde sa tieto systémy inicializujú
- Prehľadať `Engine/` directory pre boot/setup kód
- Hľadať `new CascadingHarmonicResonanceAmplification`, `new CascadingRuptureSystem`
- Skontrolovať dynamic importy alebo lazy loading

### 2. Harmonizácia Console API
**Akcia:** Zjednotiť console API
- Zlúčiť `setupCascadingResonanceConsoleAPI`, `setupCascadeConsoleAPI`, `setupCascadeSystemConsoleAPI`
- Vytvoriť jeden konsolidovaný `CASCADE_API` object

### 3. Aktivácia Session 145 cascades
**Akcia:** Rozhodnúť o aktivácii cascade logiky v HarmonicCascadeAmplification_Session145
- Ak cascade effects sú žiaduce → implementovať cascade propagation
- Ak len detection → označiť ako "Detection-only system" v dokumentácii

### 4. Testovanie integrácie
**Akcia:** Verifikovať event flow medzi systémami
- Skontrolovať či `cascade.hop` events sú emitované
- Overiť či CascadeParticleSystem_Session120 prijíma events
- Verifikovať data flow z CascadingHarmonicResonanceAmplification do vizuálnych systémov

---

## PRÍLOHY

### A. Kľúčové konfigurácie

**CascadingHarmonicResonanceAmplification:**
```javascript
layerDecayFactor: 0.6           // 60% decay per layer
maxCascadeLayers: 5             // Max propagation depth
secondaryHubThreshold: 0.7      // Strength to become secondary hub
amplificationFactor: 0.3        // Synergy amplification
corruptionDamping: 0.4          // Corruption damping
harmonySmoothing: 0.2           // Harmony smoothing
resilienceStabilization: 0.3    // Resilience stabilization
```

**CascadingRuptureSystem:**
```javascript
CORRUPTION_THRESHOLD: 0.35      // Cascade trigger threshold
STABILITY_THRESHOLD: 0.4         // Stability threshold
MAX_CASCADE_DEPTH: 3            // Max hops
ENERGY_DECAY_PER_HOP: 0.35      // 35% loss per hop
PROPAGATION_DELAY: 0.15         // 150ms between hops
```

**CascadeParticleSystem_Session120:**
```javascript
maxParticles: 3000              // Particle pool size
baseSize: 4.0                   // Base particle size
emissionRate: 1.0               // Base emission rate
hopDecay: 0.82                  // 18% decay per hop
```

**HarmonicCascadeAmplification_Session145:**
```javascript
maxProximityDistance: 24.0       // Max distance for proximity
minHarmonyThreshold: 0.2        // Min harmony for proximity
enabled: false                  // Cascades disabled
```

### B. Metodika výpočtu cascade strength

**CascadingHarmonicResonanceAmplification:**
```
harmonyResonanceEnergy(hub) = harmony × (0.5 + synergy × 0.2 × resilience)

cascadeStrength(layer, prev_strength) =
  prev_strength 
  × (0.6 ^ layer)                    // Exponential decay
  × (1 + synergy × 0.3)              // Amplification
  × (1 - corruption × 0.4)           // Corruption damping
  × (0.8 + harmony × 0.2)            // Harmony smoothing
  × (0.7 + resilience × 0.3)         // Resilience stabilization
```

**CascadingRuptureSystem:**
```
initialEnergy = min(corruption × 1.5, 1.0)

cascadeProbability =
  BASE_CASCADE_CHANCE (0.15)
  + (corruption - 0.35) × 0.5
  + recentRuptures × 0.3
  + (timeSinceHealing > 8.0 ? 0.4 : 0)
  + (standingWave > 0.3 ? 0.2 : 0)

capped at 0.95
```

---

**KONIEC AUDITU**

Autor: ATOMA Audit System  
Verzia: 1.0