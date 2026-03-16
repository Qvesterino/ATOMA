# CORRUPTION VISUAL SYSTEMS AUDIT REPORT

## Executive Summary
Out of three corruption visual systems audited, only **ONE is ACTIVE** in the runtime.

---

## System 1: LinkCorruptionParticleSystem

**STATUS: ✅ ACTIVE**

### STEP 1: Import Status
- ✅ **Imported** in `LinkRendererConduit.js`
- Import: `import { LinkCorruptionParticleSystem } from './LinkCorruptionParticleSystem.js';`

### STEP 2: Instance Creation
- ✅ **Instance Created** in LinkRendererConduit constructor
- Code: `this.corruptionParticleSystem = new LinkCorruptionParticleSystem(scene);`
- Also aliased as `this.corruptionParticles`

### STEP 3: Runtime Loop Connection
- ✅ **Connected to Runtime Loops**
  - **Global update**: Called in `updateAll()` at ~30Hz cadence
    ```javascript
    if (run30 && this.corruptionParticleSystem?.update) {
        this.corruptionParticleSystem.update(deltaTime, time);
    }
    ```
  - **Per-link update**: Also updated per-link via `updateLinkParticles()` method
  - **Cadence**: 30Hz (throttled by `run30` flag)

### STEP 4: Corruption Value Sources
Reads from multiple hierarchical locations:

**Link-level corruption:**
- `link?.group?.userData?.conduitState?.metrics?.corruption` (highest priority)
- `link?.userData?.metrics?.corruption`
- `link?.userData?.corruptionLevel`
- `link?.userData?.corruption`
- `link.corruptionLevel`
- `link.corruption`

**Node-level corruption** (via `_readNodeCorruption`):
- `node?.userData?.metrics?.corruption`
- `node?.userData?.corruptionLevel`
- `node?.userData?.corruption`
- `node?.corruptionLevel`
- `node?.corruption`

**Visual mapping:**
- Corruption values are multiplied by 4.0 for visual intensity
- Particle spawn count scales with corruption level (0-10 particles per link cap)

---

## System 2: CorruptionVisualFX_v1

**STATUS: ❌ NOT_USED**

### STEP 1: Import Status
- ❌ **Not Imported** in main.js or any active runtime file
- File exists but is not part of the runtime import graph

### STEP 2: Instance Creation
- ❌ **No Instance Created** anywhere in the codebase
- System is defined but never instantiated

### STEP 3: Runtime Loop Connection
- ❌ **No FrameScheduler Registration**
- ❌ **No Renderer Update Hook**
- ❌ **No Particle Update Loop Hook**

### STEP 4: Corruption Value Sources
- **Would read from**: `nodeModel.userData?.corruption`
- **Actual usage**: None (system inactive)

### Notes
- System is designed for node-level corruption effects (color distortion, glow flicker, shader distortion, chaos particles)
- System appears to be legacy/dormant code
- Referenced in documentation as "LEGACY / UNUSED"

---

## System 3: CorruptionDrivenAuraDesaturationSystem

**STATUS: ❌ NOT_USED**

### STEP 1: Import Status
- ❌ **Not Imported** in main.js or any active runtime file
- Only referenced in `CorruptionDesaturationIntegrationPatch.js`
- `CorruptionDesaturationIntegrationPatch.js` is itself NOT imported anywhere

### STEP 2: Instance Creation
- ❌ **No Instance Created** anywhere in the codebase
- System is defined but never instantiated

### STEP 3: Runtime Loop Connection
- ❌ **No FrameScheduler Registration**
- ❌ **No Runtime Loop Connection**
- No method like `updateAllNodeDesaturations` found in main.js

### STEP 4: Corruption Value Sources
- **Unknown** (system not active, unable to determine read sources)
- System is marked as "DORMANT" in documentation

### Notes
- Located in `LEGACY/aura/` directory
- System is designed to desaturate node auras based on corruption levels
- Multiple audits mark this system as "LEGACY / UNUSED"

---

## Summary Table

| System | Status | Imported | Instantiated | Runtime Loop | Corruption Source |
|--------|--------|-----------|--------------|---------------|-------------------|
| LinkCorruptionParticleSystem | ✅ ACTIVE | Yes | Yes | Yes (30Hz) | link.userData.*, node.userData.* |
| CorruptionVisualFX_v1 | ❌ NOT_USED | No | No | No | Would read node.userData.* |
| CorruptionDrivenAuraDesaturationSystem | ❌ NOT_USED | No | No | No | Unknown |

---

## Key Findings

1. **Only LinkCorruptionParticleSystem is actively rendering corruption visual effects**
2. **Two major corruption visual systems (CorruptionVisualFX_v1, CorruptionDrivenAuraDesaturationSystem) are completely dormant**
3. **Active system reads corruption from multiple data sources** with clear priority hierarchy
4. **No code modifications were made** (audit only, as requested)

---

## Recommendations

1. **LinkCorruptionParticleSystem**: Maintain as the primary active corruption visual system
2. **CorruptionVisualFX_v1**: Consider removal or explicit deprecation if node-level corruption effects are not needed
3. **CorruptionDrivenAuraDesaturationSystem**: Already marked as LEGACY; cleanup candidates
4. **Documentation**: Update system maps to reflect active/inactive status clearly