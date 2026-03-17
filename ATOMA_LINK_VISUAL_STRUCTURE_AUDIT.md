# ATOMA LINK VISUAL STRUCTURE AUDIT

**Date:** 2026-03-17  
**System:** LinkRendererConduit  
**Purpose:** Identify and document all visual layers in ATOMA link rendering

---

## EXECUTIVE SUMMARY

ATOMA links consist of **7 distinct visual layers** organized in a strict depth hierarchy:

1. **Core Occluder** (depth-only, invisible)
2. **Strand Geometry** (visible braid surface)
3. **Aura Skin** (atmospheric envelope)
4. **Flow Effects** (pulse rings, waves)
5. **Particle Systems** (beads, sparks, trails)
6. **Overlay Effects** (arcs, streaks, pictograms)
7. **Impact Effects** (node collision visuals)

---

## LAYER HIERARCHY

### 1. CORE OCCLUDER (Depth-Only Shell)

**What it is:**
- Invisible depth-only mesh that writes to the depth buffer
- Prevents visual bleeding from background elements
- Creates proper occlusion for link geometry

**Implementation:**
```javascript
// From LinkRendererConduit.js - Phase 1
const depthMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: false,
    depthWrite: true,
    depthTest: true,
    colorWrite: false,  // ← CRITICAL: No color output
    side: THREE.DoubleSide
});

const depthMesh = new THREE.Mesh(geometry, depthMaterial);
Object.assign(ensureUserData(depthMesh), { 
    strandIndex: i, 
    strandDepthPrepass: true 
});
applyLinkRenderLayer(depthMesh, 'LINK_CORE', {
    materialOverrides: { colorWrite: false, side: THREE.DoubleSide }
});
```

**Key Properties:**
- `colorWrite: false` - Does not render visible pixels
- `depthWrite: true` - Writes to depth buffer
- `depthTest: true` - Reads existing depth
- **Render Layer:** `LINK_CORE`
- **Purpose:** Prevents background elements from bleeding through transparent link geometry

**Storage:** `state.strandDepthPasses[]` (one per strand)

---

### 2. STRAND GEOMETRY (Visible Surface)

**What it is:**
- The visible braided rope structure
- 3-5 helical strands twisted around link curve
- Primary visual representation of link presence

**Implementation:**
```javascript
// From LinkRendererConduit.js - Phase 1
const material = new THREE.ShaderMaterial({
    vertexShader: linkStateVertexShaderSimple,
    fragmentShader: linkStateFragmentShaderSimple,
    transparent: false,
    depthWrite: true,
    depthTest: true,
    side: THREE.DoubleSide,
    uniforms: {
        uNetworkStress: { value: 0.0 },
        uLocalLoad: { value: 0.0 },
        uCorruption: { value: 0.0 },
        uTime: { value: 0.0 },
        uSegmentCount: { value: 44.0 },
        uBaseColor: { value: categoryColor.clone() }
    }
});

const mesh = new THREE.Mesh(geometry, material);
applyLinkRenderLayer(mesh, 'LINK_STRANDS');
```

**Geometry Construction:**
- Base: QuadraticBezierCurve3 (slight arc for rope slack)
- Cross-section: TubeGeometry with radialSegments=5
- Helical twist: Position offset calculated per segment
- Radius modulation: Breathing animation, stress/traffic influence

**Key Properties:**
- `transparent: false` (or conditional based on corruption)
- `depthWrite: true` - Writes to depth buffer
- `depthTest: true` - Reads depth
- **Render Layer:** `LINK_STRANDS`
- **Count:** 3-5 strands (stable randomization based on link.id)
- **Radius:** `config.strandRadius = 0.034`

**Storage:** `state.strands[]` (visible meshes)

---

### 3. AURA SKIN (Atmosphere / Glow)

**What it is:**
- Translucent energy envelope surrounding strands
- Organic noise-based deformation
- Continuation of node aura system
- Provides depth-based rim lighting

**Implementation:**
```javascript
// From shaders/LinkAuraShader.js
const skinMaterial = createLinkAuraMaterial({
    baseDisplacement: 0.15,
    noiseScale: 2.0,
    timeScale: 0.5,
    baseOpacity: 0.12,
    harmonyInfluence: 0.8,
    corruptionInfluence: 0.9,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
});

const skinGeometry = createLinkAuraGeometry(0.4, 16);
const skinMesh = new THREE.Mesh(skinGeometry, skinMaterial);
applyLinkRenderLayer(skinMesh, 'LINK_SKIN');
```

**Shader Features:**
- **Directional Noise:** Flows along link direction (source → target)
- **Octave Structure:** 3 octaves (2x, 4x, 8x frequency) for organic feel
- **Harmony →** Smoother deformation, reduced motion
- **Corruption →** Rougher flow, enhanced deformation
- **Desaturation:** Progressive grayscale shift at high corruption
- **Blend Zone:** Smooth fade near node endpoints (20% of link length)

**Key Properties:**
- `transparent: true`
- `depthWrite: false` - Does not block other transparents
- `depthTest: true` - Respects depth
- `blending: THREE.AdditiveBlending`
- **Opacity Cap:** 0.16 (from EnergyVisualProfile.linkOpacityCap)
- **Render Layer:** `LINK_SKIN`

**Storage:** `state.skinMesh`

---

### 4. FLOW EFFECTS (Pulse Rings & Waves)

**What they are:**
- Energy rings traveling along link
- Pulse wave propagation through strands
- Visual representation of traffic/synergy

**Sub-layers:**

#### 4.1 Pulse Ring
```javascript
// Phase 2
state.pulseRing = new LinkPulseRing(this.scene);
```
- Traveling ring mesh
- Splits/rejoins based on synergy
- Source-to-target color gradient

#### 4.2 Energy Wave
```javascript
// Phase 3
state.energyWave = new LinkEnergyWave();
```
- Unified wave traveling through strands
- Emissive intensity modulation
- Synchronized with pulse ring

#### 4.3 Pulse Dust
```javascript
// Phase 3
state.pulseDust = new LinkPulseDustEmitter(160);
```
- Particle burst at pulse ring location
- Additive blending
- Opacity fade over lifetime

**Key Properties:**
- `transparent: true`
- `depthWrite: false`
- `depthTest: true`
- `blending: THREE.AdditiveBlending`

**Storage:**
- `state.pulseRing`
- `state.energyWave`
- `state.pulseDust`

---

### 5. PARTICLE SYSTEMS (Beads, Sparks, Trails)

**What they are:**
- Dynamic particles flowing along link
- Visual representation of energy transfer
- Per-link particle emitters

**Sub-layers:**

#### 5.1 Beads
```javascript
// Phase 6
state.beads = new LinkBeadVisualizer(link, this.scene);
```
- Spherical energy packets
- Travel from source to target
- Size variation (small/medium/large)
- Intensity based on synergy

#### 5.2 Sparks
```javascript
// Phase 8
state.sparks = new LinkSparkSystem(this.scene);
```
- High-frequency micro-particles
- Emission rate based on traffic/corruption
- Additive blending

#### 5.3 Bead Trails
```javascript
// Phase 7
state.trails = new LinkBeadTrailSystem(this.scene);
```
- Trail geometry following beads
- Fade over distance/time
- Opacity modulation

#### 5.4 Trail Particles (Corruption/Healing)
```javascript
// Global systems, per-link emitters
const emitter = new LinkTrailEmitter(link, this.trailParticles, 'corruption');
```
- Corruption particles: source → target
- Healing particles: target → source (reverse flow)
- Shared particle pool for efficiency

**Key Properties:**
- `transparent: true`
- `depthWrite: false`
- `depthTest: true` (or false for some overlays)
- `blending: THREE.AdditiveBlending`

**Storage:**
- `state.beads`
- `state.sparks`
- `state.trails`
- `this.trailEmitters` (Map: linkId → emitter)
- `this.healingEmitters` (Map: linkId → emitter)

---

### 6. OVERLAY EFFECTS (Arcs, Streaks, Pictograms)

**What they are:**
- Additional visual layers enhancing link aesthetics
- Synergy-driven directional flow
- Harada/corruption-specific feedback

**Sub-layers:**

#### 6.1 Directional Streaks
```javascript
// Phase 4
this.directionalStreaks.initialize(group, linkIdHash, link, ...);
```
- Parallel energy streaks
- Synergy-driven emission
- Harmonic hub phase synchronization

#### 6.2 Ring Arc Discharges
```javascript
// Phase 5
state.arcDischarges = new LinkRingArcDischarges(this.scene);
```
- Electric sparks from pulse ring
- Triggered at ring endpoints
- Corruption-enhanced intensity

#### 6.3 Energy Rings
```javascript
// Phase 6
state.rings = new LinkEnergyRingSystem(this.scene);
```
- Expanding ring at target node
- Triggered by large beads
- Category-colored

#### 6.4 Pictograms
```javascript
// Global system
this.pictogramSystem = new LinkSemanticPictogramSystem_Enhanced(...);
```
- 3D glyphs traveling along link
- Visual representation of link state
- LOD-activated (near camera)

#### 6.5 Dock Rings & Ghosts
```javascript
// Per-link, spawned when link reaches node surface
state.dockRing = ring;
state.dockGhost = ring;
```
- Layered torus segments at target node
- Rotating/spinning animation
- Dock spray particle bursts

#### 6.6 Source Injection
```javascript
// Per-link, vortex + particles at source
state.sourceInjection = createSourceInjectionSystem(...);
```
- Vortex geometry at source node
- Swirling particle emission
- Flow-influenced animation

**Key Properties:**
- `transparent: true`
- `depthWrite: false`
- `depthTest: true` (or false for full-screen overlays)
- `blending: THREE.AdditiveBlending`

**Storage:**
- `state.directionalStreaks`
- `state.arcDischarges`
- `state.rings`
- `state.dockRing`
- `state.dockGhost`
- `state.sourceInjection`
- `this.pictogramSystem` (global)

---

### 7. IMPACT EFFECTS (Node Collision Visuals)

**What they are:**
- Visual feedback when particles reach nodes
- Per-node impact geometry
- Fade-in/fade-out animation

**Implementation:**
```javascript
// Triggered when bead/spark reaches node
triggerNodeImpact(state, node, bead) {
    // Create impact geometry based on node category
    // Variants: RingGeometry, TorusKnotGeometry, IcosahedronGeometry, etc.
    
    const meshMaterial = this._getImpactMaterial(color);
    const mesh = new THREE.Mesh(geometry, meshMaterial);
    
    // Animate: scale up, fade in, then fade out
    updateImpacts(state, dt) {
        const ease = 1 - Math.pow(1 - p, 3);
        grp.scale.setScalar(data.maxScale * ease);
        const pulseAlpha = Math.sin(Math.PI * Math.min(1, Math.max(0, p)));
        data.mesh.material.opacity = 0.55 * pulseAlpha;
    }
}
```

**Geometry Variants (by category):**
- **Input:** RingGeometry, TorusKnotGeometry (triquetra), DodecahedronGeometry, WaveSlice
- **Process:** StarPrism (Cylinder), WaveSlice, TorusKnotGeometry
- **Control:** OctahedronGeometry, TetrahedronGeometry, DodecahedronGeometry, Lemniscate
- **Storage:** GyroideDisk, DoubleDiscs, CapsuleGeometry
- **Analytics:** RingGeometry, IcosahedronGeometry, HexFrame (Cylinder)
- **Integration:** TwistedRibbon (Tube), TorusKnotGeometry, DodecahedronGeometry
- **Emotional:** OctahedronGeometry, Lemniscate, TorusKnotGeometry
- **Sigma:** OctahedronGeometry, SpikedHalo (perturbed Icosahedron), CapsuleGeometry
- **Quantum:** CrateredSphere (perturbed Icosahedron), OctahedronGeometry, IcosahedronGeometry
- **Prime:** DodecahedronGeometry, TorusKnotGeometry
- **Error:** IcosahedronGeometry, TetrahedronGeometry, CrateredSphere
- **Mythic:** TorusKnotGeometry, IcosahedronGeometry

**Key Properties:**
- `transparent: true`
- `depthWrite: false`
- `depthTest: true`
- `blending: THREE.AdditiveBlending` (implicit from TransparentStateAuthority)
- **Render Order:** `LINK_IMPACTS`

**Storage:** `state.impacts[]`

---

## RENDER ORDER HIERARCHY

From `VisualHierarchyRegistry` and `applyLinkRenderLayer`:

```
Lowest (rendered first):
├─ LINK_CORE           → Core occluder (depth-only)
├─ LINK_STRANDS        → Visible strand geometry
├─ LINK_SKIN           → Aura/atmosphere
├─ LINK_IMPACTS        → Node collision effects
└─ LINK_*              → All other transparent layers

Highest (rendered last):
```

**Interpretation:**
1. Core occluder writes to depth buffer first (invisible)
2. Strands render on top of occluder (read depth, write depth)
3. Aura renders over strands (additive, no depth write)
4. Impacts render over everything in layer (additive)
5. Particles/overlays use layer-specific render orders

---

## MATERIAL PROPERTY PATTERNS

### Depth-Write Patterns

| Layer | depthWrite | depthTest | Purpose |
|-------|-----------|-----------|---------|
| Core Occluder | `true` | `true` | Write depth buffer, invisible |
| Strands | `true` | `true` | Solid surface, blocks background |
| Aura Skin | `false` | `true` | Additive glow, no blocking |
| Flow Effects | `false` | `true` | Additive blend, no blocking |
| Particles | `false` | `true`/`false` | Additive, selective depth |
| Overlays | `false` | `true`/`false` | Additive, some ignore depth |
| Impacts | `false` | `true` | Additive, no blocking |

### Transparency Patterns

| Layer | transparent | Purpose |
|-------|-------------|---------|
| Core Occluder | `false` | Depth-only pass |
| Strands | `false` (conditional) | Solid surface |
| Aura Skin | `true` | Additive glow |
| Flow Effects | `true` | Additive blend |
| Particles | `true` | Additive blend |
| Overlays | `true` | Additive blend |
| Impacts | `true` | Fade animation |

### Blending Patterns

- **AdditiveBlending:** All visual effects (aura, particles, arcs, streaks, impacts)
- **NormalBlending:** Not used for link layers (deferred to other systems)

---

## VISUAL FEEDBACK PATHWAYS

### Corruption Propagation
```
Corruption Metrics → LinkAuraShader (rougher flow, red tint)
                 → LinkCorruptionParticleSystem (particles)
                 → LinkCorruptionMorphingSystem (geometry deformation)
                 → TIER4_CorruptionFeedbackVisuals (seed/cascade/recovery triggers)
```

### Harmony Propagation
```
Harmony Metrics → LinkAuraShader (smoother flow, cyan tint)
               → LinkHealingParticleSystem (reverse flow particles)
               → HarmonicNodeResonanceHalos (halo effects at nodes)
```

### Synergy Propagation
```
Synergy Metrics → Beads intensity
               → Sparks intensity
               → Directional Streaks (emission rate)
               → LinkEnergyWave (emissive modulation)
```

### Traffic/Load Propagation
```
Traffic/Load → Strand radius modulation (breathing)
           → Strand opacity (traffic visual density)
           → Flow speed (pulse ring velocity)
           → Source injection rate
```

---

## GEOMETRY UPDATE PATTERNS

### Per-Frame Updates
- **Curve Calculation:** QuadraticBezierCurve3 from source to target
- **Frenet Frames:** Compute for each strand (10 Hz cadence)
- **TubeGeometry:** Rebuild strands when geometryTick is true
- **Aura Geometry:** Rebuild skin mesh when geometryTick is true

### Geometry Tick Frequency
- **Heavy Links (near camera):** 10 Hz (every 0.1s)
- **Light Links (far):** 1-2 Hz
- **LOD Distance:** 60 units
- **Max Heavy Links:** 8

---

## BOOTSTRAP SEQUENCE

Links are built in 9 phases over multiple frames to avoid stutter:

| Phase | System | Purpose |
|-------|--------|---------|
| 0 | Skin Mesh | Aura/atmosphere (instant) |
| 1 | Strand Geometry | Visible braid + depth occluder |
| 2 | Pulse Ring | Flow carrier + trails |
| 3 | Energy Wave + Pulse Dust | Wave propagation + particles |
| 4 | Directional Streaks | Synergy flow visualization |
| 5 | Arc Discharges | Electric sparks |
| 6 | Beads + Energy Rings | Energy packets + target rings |
| 7 | Bead Trails | Trail geometry |
| 8 | Sparks | Micro-particles |
| 9 | Corruption/Healing Emitters + Adapters | Particle emitters, corruption animation |

**Implementation:** `_advanceLinkBootstrap()` called each frame until `bootstrap.complete`

---

## MEMORY MANAGEMENT

### Per-Link Storage
```javascript
state = {
    strands: [],              // Mesh[]
    strandDepthPasses: [],   // Mesh[] (depth-only)
    skinMesh: Mesh,          // Aura skin
    
    // Flow effects
    pulseRing: LinkPulseRing,
    energyWave: LinkEnergyWave,
    pulseDust: LinkPulseDustEmitter,
    arcDischarges: LinkRingArcDischarges,
    
    // Particle systems
    beads: LinkBeadVisualizer,
    sparks: LinkSparkSystem,
    trails: LinkBeadTrailSystem,
    rings: LinkEnergyRingSystem,
    
    // Overlays
    directionalStreaks: LinkDirectionalStreaks,
    
    // Per-link dock effects
    dockRing: Group,
    dockGhost: Group,
    dockSpray: Object,
    sourceInjection: Object,
    
    // Impacts
    impacts: Group[],
    
    // Corruption
    corruptionAnimator: LinkCorruptionSpreadAnimator,
    corruptionMorphing: LinkCorruptionMorphingSystem,
    
    // State
    metrics: Object,
    phaseOffset: Number,
    baseColor: Color,
    waveDirection: Vector3,
    waveLength: Number,
    wavePhaseOffset: Number,
    
    // Bootstrap
    bootstrap: { phase, maxPhase, complete },
    __dynamicGeometryInitialized: Boolean
}
```

### Global Storage
```javascript
// Shared particle pools
this.trailParticles = new LinkTrailParticleSystem(scene, 300);
this.healingParticles = new LinkHealingParticleSystem(scene, 250);
this.corruptionParticleSystem = new LinkCorruptionParticleSystem(scene);

// Per-link emitters
this.trailEmitters = new Map();  // linkId → LinkTrailEmitter
this.healingEmitters = new Map(); // linkId → LinkHealingEmitter

// Visual managers
this.nodeInterferenceManager = new NodeInterferenceManager(scene);
this.nodeHarmonicManager = new NodeHarmonicManager(scene);
this.directionalStreaks = new LinkDirectionalStreaks(scene);
this.pictogramSystem = new LinkSemanticPictogramSystem_Enhanced(...);

// Corruption state
this.corruptionFeedbackVisuals = new TIER4_CorruptionFeedbackVisuals(scene);
this._corruptionFeedbackLinkState = new Map();
this._corruptionFeedbackNodeState = new Map();
```

---

## CLEANUP & DISPOSAL

On link removal, `disposeLinkVisuals(linkGroup, link)`:

1. Spawn dissolve particle burst
2. Unregister from interference manager
3. Dispose corruption animation state
4. Clear corruption particles
5. Dispose trail emitter
6. Clear trail particles
7. Dispose healing emitter
8. Dispose strands (geometry + material)
9. Dispose skin mesh (geometry + material)
10. Dispose beads
11. Dispose sparks
12. Dispose trails
13. Dispose rings
14. Dispose pulse ring
15. Dispose pulse dust
16. Dispose arc discharges
17. Dispose visual state adapter
18. Dispose dock spray
19. Dispose source injection
20. Dispose directional streaks
21. Clear impacts
22. Remove link group from scene
23. Traverse and dispose remaining geometries/materials

---

## KEY INSIGHTS

### Core Shell vs Surface
- **Core Occluder** = Invisible depth-only shell (colorWrite: false)
- **Strand Surface** = Visible geometry with actual material/color

### Aura vs Atmosphere
- **Aura Skin** = Link-specific energy envelope (tube geometry)
- **Atmosphere** = Not a separate layer (aura IS the atmosphere)

### Overlay Distinctions
- **Overlay** = Any additive visual layer over strands/aura
- **Surface** = The visible strand geometry (not an overlay)
- **Core** = The depth-only occluder (not visible)

### Visual Hierarchy
1. **Depth Authority:** Core occluder writes depth first
2. **Surface Authority:** Strands define link presence
3. **Aura Authority:** Skin provides depth-based glow
4. **FX Authority:** All other layers are additive effects

---

## ARCHITECTURAL PRINCIPLES

1. **Depth-First Rendering:** Occluder writes depth before any visible layers
2. **Additive Layering:** All visual effects use additive blending
3. **No Depth Blocking:** Aura/particles don't write to depth (prevents z-fighting)
4. **Metric-Driven:** All visual modulation comes from synergy/harmony/corruption
5. **LOD-Aware:** Heavy effects limited to near-camera links
6. **Bootstrap-Staged:** Links build over multiple frames to avoid stutter
7. **Shared Pools:** Particles use global pools for efficiency
8. **Unified Shader:** Node/Link aura share identical noise structure

---

## FILES REVIEWED

1. `LinkRendererConduit.js` - Main link rendering system
2. `shaders/LinkAuraShader.js` - Link aura/atmosphere shader
3. `LinkBeadSystem.js` - Bead particle system
4. `LinkSparkSystem.js` - Spark particle system
5. `LinkBeadTrailSystem.js` - Bead trail geometry
6. `LinkPulseRing.js` - Pulse ring flow effect
7. `LinkEnergyWave.js` - Wave propagation effect
8. `LinkPulseDustEmitter.js` - Pulse particle system
9. `LinkRingArcDischarges.js` - Electric arc effects
10. `LinkDirectionalStreaks.js` - Synergy streak visualization
11. `LinkCorruptionParticleSystem.js` - Corruption particles
12. `LinkCorruptionMorphingSystem.js` - Corruption geometry deformation
13. `LinkTrailParticleSystem.js` - Global trail particle pool
14. `LinkHealingParticleSystem.js` - Healing particle system
15. `LinkSemanticPictogramSystem_Enhanced.js` - 3D pictograms
16. `EnergyVisualProfile.js` - Unified visual parameters
17. `TransparentStateAuthority.js` - Depth state management
18. `VisualHierarchyRegistry.js` - Render order system

---

**Audit Complete**  
**Layers Identified:** 7 distinct visual layers  
**Core Structure:** Depth occluder → Visible surface → Aura envelope → Additive effects