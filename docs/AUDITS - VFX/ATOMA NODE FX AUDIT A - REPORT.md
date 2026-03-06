# ATOMA NODE FX AUDIT A - REPORT

## SYSTEM

### 1. NodeAuraRefactor_ElegantRim.js

**Purpose:** Elegant rim-only aura rendering system with Fresnel effects
**Class:** `NodeAuraRefactor_ElegantRim`
**Key Components:**

- AuraInstance: Per-node aura state (mesh, material, profile, intensity)
- AURA_PROFILES: Color/intensity configurations per state (clarity, resonance, corrupted, harmony)
- createAuraMaterial(): Generates ShaderMaterial with Fresnel rim-lighting
- Scene integration via VisualHierarchyRegistry renderOrder

**Shader Uniforms:**

- uTime, uAuraColor, uRimPower, uRimIntensity, uFresnelMin/Max
- uBreathingIntensity, uBreathingAmplitude, uAuraOpacity

### 2. NodeCorruptionAuraDegradation.js

**Purpose:** Corruption-based visual degradation effects on node auras
**Class:** `NodeCorruptionAuraDegradation`
**Key Components:**

- Per-node corruption states (level, desaturation, flicker, distortion)
- Progressive desaturation: color → gray (thresholds: 0.2 → 0.7)
- Distortion enhancement at high corruption (max 2.0x multiplier)
- Flickering effect (0.5 → 8.0 Hz frequency)
- Opacity modulation and glow intensity reduction

**Applied Uniforms:**

- uDesaturation, uDisplacement, uOpacity, uWaveInfluence, uCorruption

### 3. NodeAuraParticleImpactBridge.js

**Purpose:** Bridges particle arrival impacts to node aura shader uniforms
**Class:** `NodeAuraParticleImpactBridge`
**Key Components:**

- Material registration per node (nodeId → ShaderMaterial)
- Impact state application from external ImpactManagerCollection
- 120-200ms ease-in/out animation
- Corruption → contraction + red tint
- Harmony → expansion + cyan tint

**Applied Uniforms:**

- uImpactDisplacement, uImpactCorruptionBias, uImpactHarmonyBias

### 4. NodeInterferenceManager.js

**Purpose:** Manages synergy wave interference across network nodes
**Class:** `NodeInterferenceManager`
**Key Components:**

- Per-node NodeSynergyInterferenceController instances
- Link registration with source/target nodes
- InterferenceEffectApplier for visual feedback
- Combined feedback averaging for connected nodes

**Dependencies:**

- NodeSynergyInterferenceController.js
- InterferenceEffectApplier.js

---

## SCENE MUTATION

### Aura Mesh Management

- **Add:** scene.add(auraMesh) in registerNode()
- **Remove:** scene.remove(auraMesh) in unregisterNode() and dispose()
- **Position:** aura.mesh.position.copy(aura.node.position) per frame
- **Scale:** Scaled to core * rimWidthScale (1.15x-1.35x)

### Material Mutations

- **NodeCorruptionAuraDegradation:** Direct uniform modification
  - uDesaturation: 0 → 1
  - uDisplacement: Base * distortion multiplier
  - uOpacity: Base * corruption * flicker
- **NodeAuraParticleImpactBridge:** Direct uniform modification
  - uImpactDisplacement: ± displacement factor
  - uImpactCorruptionBias/HarmonyBias: Color bias values

### Geometry

- Shared IcosahedronGeometry (1, 16 subdivision) per system instance
- Separate mesh per node (not shared)
- Depth test enabled, depthWrite disabled

---

## NODE DEPENDENCIES

### Required Node Properties

- `node.id` or `node.userData.id` or `node.uuid`
- `node.position` (Vector3)
- `node.scale` (Vector3 - used .x)
- `node.visible` (boolean)
- `node.userData.nodeName` (string, optional for debug)

### Node Associations

- **NodeAuraRefactor_ElegantRim:** Map<node.id, AuraInstance>
- **NodeCorruptionAuraDegradation:** Map<node.id, corruptionState>
- **NodeAuraParticleImpactBridge:** Map<nodeId, ShaderMaterial>
- **NodeInterferenceManager:** Map<node, NodeSynergyInterferenceController>

### Profile System

- Predefined AURA_PROFILES: default, clarity, resonance, corrupted, harmony
- Per-node profile switching via updateNodeProfile(node, profileName)

---

## SPAWN TYPE

### Initialization (Per Node)

1. **NodeAuraRefactor_ElegantRim.registerNode(node, profileName)**
   
   - Creates new aura mesh with material
   - Scales mesh relative to core
   - Adds to scene
   - Stores in auras Map

2. **NodeCorruptionAuraDegradation.initializeNode(node)**
   
   - Creates corruption state object
   - Stores in corruptionStates Map
   - Auto-initialized on first updateNodeCorruption() call

3. **NodeAuraParticleImpactBridge.registerNodeMaterial(nodeId, material)**
   
   - Registers existing material for impact feedback
   - Stores in nodeMaterials Map

4. **NodeInterferenceManager.registerNode(node)**
   
   - Creates NodeSynergyInterferenceController
   - Stores in nodeControllers Map
   - Returns existing controller if already registered

### Cleanup

- All systems provide unregister/dispose methods
- Remove mesh from scene
- Dispose geometries/materials
- Clear Map entries

---

## UPDATE LOOP

### Frame Conditions

- **NodeAuraRefactor_ElegantRim:**
  
  - Checks: `this.enabled`
  - Optional frameScheduler guard: `frameScheduler?.shouldRunVisual?.()`
  - Frequency: Every frame

- **NodeCorruptionAuraDegradation:**
  
  - Checks: Material exists, has uniforms, correct auraLayer
  - Frequency: Per-node when corruption changes

- **NodeAuraParticleImpactBridge:**
  
  - Checks: ImpactManager exists
  - Frequency: Every frame

- **NodeInterferenceManager:**
  
  - Checks: `config.enabled`
  - Frequency: Every frame (config.updateFrequency = 1.0)

### Per-Frame Operations

**NodeAuraRefactor_ElegantRim.update(deltaTime):**

```javascript
- Update globalTime via VisualTime
- For each aura:
  - Copy position from node
  - Scale to match node core
  - Update uTime uniform
  - Smooth intensity transition (3x/sec lerp)
  - Sync visibility with node.visible
```

**NodeCorruptionAuraDegradation.updateNodeCorruption(node, corruptionLevel, deltaTime, auraMaterial):**

```javascript
- Detect corruption level changes (> 0.01 threshold)
- Calculate desaturation (linear interpolation)
- Smooth desaturation transition (2.0 units/sec)
- Calculate distortion (quadratic escalation)
- Calculate flickering (sine wave with frequency/amplitude)
- Apply all effects to material uniforms
```

**NodeAuraParticleImpactBridge.update(currentTime):**

```javascript
- Update all impact managers
- For each registered material:
  - Get shaderState from impactManager
  - Apply or reset impact uniforms
  - Track statistics
```

**NodeInterferenceManager.update(links, harmony, corruption, instability):**

```javascript
- Update all node controllers with metrics
- For each link:
  - Get feedback from source and target nodes
  - Average feedback metrics
  - Apply effects via InterferenceEffectApplier
```

### Time Sources

- **NodeAuraRefactor_ElegantRim:** VisualTime (canonical)
- **NodeCorruptionAuraDegradation:** Internal time accumulator
- **NodeAuraParticleImpactBridge:** External currentTime parameter
- **NodeInterferenceManager:** No time dependency

---

## SUMMARY STATISTICS

| System                        | Per-Node Storage      | Scene Mutations           | Update Frequency |
| ----------------------------- | --------------------- | ------------------------- | ---------------- |
| NodeAuraRefactor_ElegantRim   | Map (AuraInstance)    | Add/Remove/Position/Scale | Every frame      |
| NodeCorruptionAuraDegradation | Map (corruptionState) | Uniform modification      | On change        |
| NodeAuraParticleImpactBridge  | Map (ShaderMaterial)  | Uniform modification      | Every frame      |
| NodeInterferenceManager       | Map (Controller)      | Link effect application   | Every frame      |

**Total Systems Audited:** 4
**Aura Renderers:** 1 (ElegantRim)
**Particle Bridges:** 1 (ImpactBridge)
**Interference Systems:** 1 (InterferenceManager)
**Corruption Systems:** 1 (Degradation)
