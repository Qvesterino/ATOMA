# WAVE SYSTEMS ACTIVATION MAP

**ATOMA AUDIT — Wave Systems Activation Status**

Generated: 2026-03-10
Scope: WAVE systems in ATOMA codebase

---

## EXECUTIVE SUMMARY

| System | Status | Layer | FrameScheduler | Metric Connections |
|--------|--------|--------|---------------|-------------------|
| WaveParticleEmitter_v1 | ACTIVE | Visual | ❌ No | Indirect (via waveEngine) |
| WaveInterferencePatternSystem_Session132 | ACTIVE | Visual | ❌ No | ✅ harmony, corruption, instability, synergy |
| WaveInterferenceEngine_v1 | ACTIVE | Runtime/Simulation | ❌ No (burst-only) | ❌ None (data source) |
| WaveShaderBridge_v1 | ACTIVE | Visual | ✅ visual.waveShaderBridge | ❌ Indirect (via waveEngine) |
| WaveTravelShaderPack_v1 | ACTIVE | Visual | ✅ visual.waveTravelShaderPack | ❌ Indirect (via uniforms) |
| WaveDynamicsShaderPack_v1 | ACTIVE | Visual | ✅ visual.waveDynamicsShaderPack | ❌ Indirect (via uniforms) |

---

## ACTIVE SYSTEMS

### 1. WaveParticleEmitter_v1

**File:** `WaveParticleEmitter_v1.js`

**Constructor:**
```javascript
constructor(config = {})
```

**Instantiation:** `main.js`
```javascript
this.particleEmitter = new WaveParticleEmitter_v1({
    maxParticlesPerFamily: 2000,
});
this.particleEmitter?.init?.(this.renderer, this.scene);
```

**FrameScheduler:** ❌ NOT registered
- Updated via manual update loop
- No `regGuard` call found

**Layer:** Visual (Particle FX)

**Purpose:** AAA-Grade GPU-batched particle system that emits 3 particle families based on real-time wave interference conditions:
- Constructive Burst Particles (cyan-white synergy sparks)
- Destructive Chaos Sparks (orange-red chaotic explosions)
- Standing Wave Ripple Rings (circular harmonic expansion)

**Connections:**

| Target | Connection Type | Details |
|--------|----------------|---------|
| WaveInterferenceEngine_v1 | Data Source | Reads wave field via `waveEngine.getNodeWaveField()` |
| nodes | Input | Processes node array for emission triggers |
| links | Input | Processes link array for emission triggers |
| metrics.harmony | ❌ NO DIRECT | Indirect via waveEngine waveField |
| metrics.corruption | ❌ NO DIRECT | Indirect via waveEngine waveField |
| metrics.synergy | ❌ NO DIRECT | Indirect via waveEngine waveField |
| LinkRendererConduit | ❌ NO | Independent particle system |
| NodeLinkingSystem | ❌ NO | Reads nodes/links arrays only |

**Integration Notes:**
- Receives wave field data from WaveInterferenceEngine_v1
- Particles react to: constructivePower, destructivePower, standingWaveFactor, amplitude
- EMA smoothing for amplitude spikes
- <2ms per frame performance for 200-400 nodes

---

### 2. WaveInterferencePatternSystem_Session132

**File:** `WaveInterferencePatternSystem_Session132.js`

**Constructor:**
```javascript
constructor(scene, reflectionSystem, standingWaveTrapSystem, linkingSystem, aiNodes, config = {})
```

**Instantiation:** `main.js`
```javascript
this.waveInterference = new WaveInterferencePatternSystem_Session132(
    this.scene,
    this.influenceReflection,
    this.standingWaveTrap,
    this.linkingSystem,
    this.aiNodes
);
```

**FrameScheduler:** ❌ NOT registered
- Updated via manual update loop in `animate()`
- No `regGuard` call found

**Layer:** Visual (Interference Pattern Visualization)

**Purpose:** PURE RENDERING SYSTEM - Visualizes Wave Collisions. Detects and visualizes constructive/destructive interference patterns when reflected waves collide.

**Connections:**

| Target | Connection Type | Details |
|--------|----------------|---------|
| InfluenceReflectionBackPressureSystem_Session129 | Data Source | Reads reflection pulses |
| StandingWaveOscillationTrapSystem_Session130 | Data Source | Reads trap state |
| NodeLinkingSystem | Data Source | Reads links array |
| aiNodes | Data Source | Reads node array for network state |
| metrics.harmony | ✅ YES | Modulates interference visibility via `_modulateByNetworkState()` |
| metrics.corruption | ✅ YES | Amplifies interference patterns |
| metrics.instability | ✅ YES | Adds jitter to glow |
| metrics.synergy | ✅ YES | Makes patterns clearer |
| LinkRendererConduit | ❌ NO | Independent interference visualization |
| WaveInterferenceEngine_v1 | ❌ NO | Reads reflection system directly |

**Integration Notes:**
- **Direct metric connections** in `_modulateByNetworkState()`:
  ```javascript
  avgHarmony = avgHarmony * harmonyFactor (1 - avgHarmony * this.config.harmonyCancellation)
  avgCorruption = avgCorruption * corruptionFactor (1 + avgCorruption * this.config.corruptionAmplification)
  avgInstability = avgInstability * instabilityNoise (jitter)
  avgSynergy = avgSynergy * synergyFactor (1 + avgSynergy * this.config.synergyClarity)
  ```
- Creates golden amplification zones (constructive) and dark cancellation zones (destructive)
- Beat frequency patterns from frequency differences
- LOD culling at 35 units distance

---

### 3. WaveInterferenceEngine_v1

**File:** `WaveInterferenceEngine_v1.js`

**Constructor:**
```javascript
constructor(options = {})
```

**Instantiation:** `main.js`
```javascript
this.waveInterferenceEngine = new WaveInterferenceEngine_v1({
    enabled: true,
});
```

**FrameScheduler:** ❌ NOT registered (burst-only mode)
- Event-driven, no per-frame solver path
- `update()` method exists but returns `false` (intentional no-op)

**Layer:** Runtime/Simulation (Data Source)

**Purpose:** Burst-only, event-driven snapshot publisher. Generates wave field data for other systems to consume.

**Connections:**

| Target | Connection Type | Details |
|--------|----------------|---------|
| WaveParticleEmitter_v1 | Data Sink | Provides wave field via `getNodeWaveField()` |
| WaveShaderBridge_v1 | Data Sink | Provides wave field via `getWaveFieldForEntity()` |
| WaveInterferencePatternSystem_Session132 | ❌ NO | Independent system |
| metrics.harmony | ❌ NO | Data source only |
| metrics.corruption | ❌ NO | Data source only |
| metrics.synergy | ❌ NO | Data source only |
| LinkRendererConduit | ❌ NO | Data source only |
| NodeLinkingSystem | ❌ NO | Independent |

**Integration Notes:**
- **PURE DATA PRODUCER** - No visual or gameplay modifications
- Three burst types: HARMONIC, SYNERGY, CORRUPTION
- Regime-based triggering (critical_regimes, reset_regimes)
- Immutable snapshot output for rendering systems
- Field suppression during active bursts

---

### 4. WaveShaderBridge_v1

**File:** `WaveShaderBridge_v1.js`

**Constructor:**
```javascript
constructor({ renderer = null, scene = null, waveEngine = null, maxSources = 8 } = {})
```

**Instantiation:** `main.js`
```javascript
this.waveShaderBridge = new WaveShaderBridge_v1({
    renderer: this.renderer,
});
```

**FrameScheduler:** ✅ Registered as `visual.waveShaderBridge`
```javascript
regGuard('waveShaderBridge', 'visual.waveShaderBridge', (dt) => 
    this.waveShaderBridge?.update?.(dt, {
        links: this.nodeLinking?.links || [],
    }));
```

**Layer:** Visual (Shader Uniform Bridge)

**Purpose:** GPU shader uniform bridge for wave interference visualization. Reads per-node and per-link wave data from WaveInterferenceEngine snapshots and injects normalized shader uniforms via onBeforeCompile.

**Connections:**

| Target | Connection Type | Details |
|--------|----------------|---------|
| WaveInterferenceEngine_v1 | Data Source | Reads wave field via `getWaveFieldForEntity()` |
| nodes | Input | Receives nodes array for material updates |
| links | Input | Receives links array for material updates |
| metrics.harmony | ❌ NO | Indirect via waveEngine waveField |
| metrics.corruption | ❌ NO | Indirect via waveEngine waveField |
| metrics.synergy | ❌ NO | Indirect via waveEngine waveField |
| LinkRendererConduit | ❌ NO | Independent material registration |
| NodeLinkingSystem | ❌ NO | Receives links array only |

**Integration Notes:**
- **8 wave-aware uniforms** injected via onBeforeCompile:
  - uWaveAmplitude, uWaveConstructive, uWaveDestructive, uWaveInterference
  - uWaveStanding, uWavePhase, uWaveSourceCount, uWaveIntensity
- EMA smoothing (alpha ~0.18 for ~0.4-0.5s response)
- Profile support: DEFAULT, AURA, MYTHIC, SYNERGY, RIFT
- Visual readiness gate via `filterReadyNodes()`
- WeakMap/WeakSet tracking (automatic GC)

---

### 5. WaveTravelShaderPack_v1

**File:** `WaveTravelShaderPack_v1.js`

**Constructor:**
```javascript
constructor({ enableDebug = false, enableWarnings = false } = {})
```

**Instantiation:** `main.js`
```javascript
this.waveTravelShaderPack = new WaveTravelShaderPack_v1({
    enableDebug: false
});
```

**FrameScheduler:** ✅ Registered as `visual.waveTravelShaderPack`
```javascript
regGuard('waveTravelShaderPack', 'visual.waveTravelShaderPack', (dt) => 
    this.waveTravelShaderPack?.update?.(dt));
```

**Layer:** Visual (Traveling Wave FX)

**Purpose:** GPU shader extensions for traveling-wave motion effects. Adds vertex displacement, UV flow, color gradients, and pulse bursts driven by wave uniforms.

**Connections:**

| Target | Connection Type | Details |
|--------|----------------|---------|
| WaveShaderBridge_v1 | Uniform Source | Reads wave uniforms injected by Bridge |
| materials | Target | Registers materials for travel effects |
| metrics.harmony | ❌ NO | Indirect via wave uniforms |
| metrics.corruption | ❌ NO | Indirect via wave uniforms |
| metrics.synergy | ❌ NO | Indirect via wave uniforms |
| LinkRendererConduit | ❌ NO | Independent material patching |
| NodeLinkingSystem | ❌ NO | Independent |

**Integration Notes:**
- **5 motion profiles:** LINEAR, SINE, PULSE, INTERFERENCE, RIFT
- Multi-frequency oscillation (low/mid/high bands)
- Vertex travel offset via uWavePhase
- UV flow animation based on wave phase
- Color gradient shift along geometry
- Pulse burst on high interference (uWaveInterference > 0.6)
- Uses VisualTime for canonical time source

---

### 6. WaveDynamicsShaderPack_v1

**File:** `WaveDynamicsShaderPack_v1.js`

**Constructor:**
```javascript
constructor({ enableDebug = false, enableWarnings = false } = {})
```

**Instantiation:** `main.js`
```javascript
this.waveDynamicsShaderPack = new WaveDynamicsShaderPack_v1({
    enableDebug: false,
});
```

**FrameScheduler:** ✅ Registered as `visual.waveDynamicsShaderPack`
```javascript
regGuard('waveDynamicsShaderPack', 'visual.waveDynamicsShaderPack', (dt) => 
    this.waveDynamicsShaderPack?.update?.(dt));
```

**Layer:** Visual (Dynamic Wave FX)

**Purpose:** GPU shader extensions for dynamic wave effects (breathing, ripple, chaos). Complements WaveTravelShaderPack_v1.

**Connections:**

| Target | Connection Type | Details |
|--------|----------------|---------|
| WaveShaderBridge_v1 | Uniform Source | Reads wave uniforms injected by Bridge |
| materials | Target | Registers materials for dynamics effects |
| metrics.harmony | ❌ NO | Indirect via wave uniforms |
| metrics.corruption | ❌ NO | Indirect via wave uniforms |
| metrics.synergy | ❌ NO | Indirect via wave uniforms |
| LinkRendererConduit | ❌ NO | Independent material patching |
| NodeLinkingSystem | ❌ NO | Independent |

**Integration Notes:**
- Works in parallel with WaveTravelShaderPack_v1
- Provides breathing, ripple, and chaotic motion effects
- Material-level registration via `applyToMaterial()`
- No direct metric connections - relies on uniform data

---

## DORMANT SYSTEMS

None found in the requested scan.

All WAVE systems searched are ACTIVE:
- WaveParticleEmitter_v1 ✅
- WaveInterferencePatternSystem_Session132 ✅
- WaveInterferenceEngine_v1 ✅
- WaveShaderBridge_v1 ✅
- WaveTravelShaderPack_v1 ✅
- WaveDynamicsShaderPack_v1 ✅

---

## LEGACY SYSTEMS

None found in the requested scan.

The search did not reveal any legacy/inactive versions of the requested WAVE systems.

---

## CONNECTION MATRIX

| System | harmony | corruption | synergy | LinkRendererConduit | NodeLinkingSystem | WaveInterferenceEngine | WaveShaderBridge |
|--------|---------|------------|----------|---------------------|-------------------|----------------------|------------------|
| WaveParticleEmitter_v1 | Indirect | Indirect | Indirect | ❌ | ❌ | ✅ | ❌ |
| WaveInterferencePatternSystem_Session132 | ✅ Direct | ✅ Direct | ✅ Direct | ❌ | ✅ Links | ❌ | ❌ |
| WaveInterferenceEngine_v1 | ❌ | ❌ | ❌ | ❌ | ❌ | Self | ❌ |
| WaveShaderBridge_v1 | Indirect | Indirect | Indirect | ❌ | ✅ Links | ✅ | Self |
| WaveTravelShaderPack_v1 | Indirect | Indirect | Indirect | ❌ | ❌ | ❌ | ✅ |
| WaveDynamicsShaderPack_v1 | Indirect | Indirect | Indirect | ❌ | ❌ | ❌ | ✅ |

---

## DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    METRICS (harmony, corruption, synergy)      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         NodeLinkingSystem (links array, userData)            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│           WaveInterferenceEngine_v1 (Burst Snapshot)         │
│         - HARMONIC, SYNERGY, CORRUPTION burst types        │
│         - getWaveFieldForEntity(node/link)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
┌──────────────────────────┐      ┌──────────────────────────┐
│  WaveParticleEmitter_v1  │      │   WaveShaderBridge_v1    │
│  - Particle FX          │      │   - Shader uniforms      │
└──────────────────────────┘      └──────────────────────────┘
            │                                   │
            │                    ┌────────────────┼────────────────┐
            │                    ▼                ▼                ▼
            │        WaveTravelShaderPack_v1  WaveDynamicsShaderPack_v1
            │        - Travel motion         - Dynamic effects
            │                    │                │
            └────────────────────┼────────────────┘
                                 ▼
                    ┌──────────────────────────┐
                    │   Visual Effects       │
                    │   (GPU Shaders)       │
                    └──────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  WaveInterferencePatternSystem_Session132 (Visualization)     │
│  - Reads metrics directly (harmony, corruption, synergy)    │
│  - Reads reflection system                                   │
│  - Interference mesh rendering                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## KEY FINDINGS

### 1. Metric Integration
- **WaveInterferencePatternSystem_Session132** is the ONLY system with DIRECT metric connections
- All other WAVE systems are metric-agnostic (read via waveEngine or uniforms)

### 2. Architecture Pattern
- Clean separation: **Data Source** → **Bridge** → **Consumer**
- WaveInterferenceEngine_v1 = Pure data producer
- WaveShaderBridge_v1 = GPU bridge
- WaveParticleEmitter_v1, ShaderPacks = Visual consumers

### 3. FrameScheduler Registration
- Mixed registration pattern:
  - ✅ WaveShaderBridge_v1, WaveTravelShaderPack_v1, WaveDynamicsShaderPack_v1 registered
  - ❌ WaveParticleEmitter_v1, WaveInterferencePatternSystem_Session132, WaveInterferenceEngine_v1 NOT registered

### 4. Visual Readiness
- WaveShaderBridge_v1 uses `filterReadyNodes()` gate
- Only processes nodes that are visualReady

### 5. Performance Considerations
- WaveParticleEmitter_v1: <2ms per frame for 200-400 nodes
- LOD culling in WaveInterferencePatternSystem_Session132 (35 units)
- EMA smoothing for uniform updates (0.18 alpha)

---

## RECOMMENDATIONS

### Consistency
1. Consider registering WaveParticleEmitter_v1 to FrameScheduler for consistency
2. Consider registering WaveInterferencePatternSystem_Session132 to FrameScheduler

### Architecture
1. Current pattern is sound: single source (WaveInterferenceEngine_v1) → multiple consumers
2. Direct metric access in WaveInterferencePatternSystem_Session132 is intentional for network state modulation

### Documentation
1. Add integration diagrams to main.js comments for each WAVE system
2. Document the burst trigger policies (harmonicCriticalRegimes, etc.)

---

## AUDIT METHOD

**Scanned Systems:**
- WaveParticleEmitter_v1
- WaveInterferencePatternSystem_Session132
- WaveInterferenceEngine_v1
- WaveShaderBridge_v1
- WaveTravelShaderPack_v1
- WaveDynamicsShaderPack_v1 (bonus)

**Analysis Methods:**
1. File content analysis
2. main.js instantiation pattern search
3. FrameScheduler registration search
4. Metric connection regex search
5. LinkRendererConduit/NodeLinkingSystem integration search

**Limitations:**
- Runtime behavior not verified (static analysis only)
- Indirect metric connections may exist via userData.waveField
- Legacy/inactive systems not in requested scan scope

---

**END OF AUDIT**