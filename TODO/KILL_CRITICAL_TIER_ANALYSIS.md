# CRITICAL Tier KILL Analysis — 15 Files

**Date:** 2026-05-03
**Auditor:** Automated FX Contract Audit + Manual Review

## Verdict Summary

| Verdict | Count | Files |
|---------|-------|-------|
| **FALSE POSITIVE** | 12 | Geometry factories, configs, utilities, disabled code, shader base class |
| **REAL KILL / NEEDS FIX** | 3 | Actual FX systems with missing contract elements |

---

## FALSE POSITIVES (12 files)

These files were flagged by the automated audit because they lack `OWNER`, `GATE`, `UPDATE`, `BUDGET`, `LIFETIME`, or `DISPOSE` — but they are **not runtime FX systems**. They are geometry builders, config objects, utilities, or dead code.

### 1. `IntegrationEnhancedVariants_Session110.js` (risk 11)
- **What it is:** Node geometry factory for Integration node variants (`SignalKnot`, `ProtocolTangle`, `ContinuityBinder`).
- **Why false positive:** Builds static `THREE.TubeGeometry` / `TorusGeometry` meshes. No update loop, no per-frame logic, no lifecycle to manage. The audit script flags all geometry factories as KILL because they fail OWNER/GATE/UPDATE/BUDGET/LIFETIME/DISPOSE — but these checks don't apply to static mesh builders.

### 2. `CascadeSystemConsoleAPI.js` (risk 10)
- **What it is:** Console command wrapper (`game.enableCascades()`, `game.triggerCascade()`, etc.).
- **Why false positive:** No THREE.js objects, no visual FX, no runtime state. Pure API surface.

### 3. `_GlyphLayer4_useless.js` (risk 9)
- **What it is:** Disabled glyph layer system.
- **Why false positive:** Header explicitly states *"NEVER functional — KEPT FOR REFERENCE ONLY — NOT USED IN RUNTIME"*. `createCoreGlyph()` returns `null`. Dead code by design.

### 4. `ATOMAShaderBase.js` (risk 9) — `Engine/Visual/ATOMAShaderBase.js`
- **What it is:** Shader base class with static GLSL code generators (`getBaseUniforms()`, `getNoiseFunctions()`, `getMaskFunctions()`, `getPathSamplingFunctions()`).
- **Why false positive:** No runtime objects, no update loop, no disposal. It's a code library that other shaders import. The audit script found it because it contains "Shader" in the name and has uniform definitions, but it's purely a static helper class.

### 5. `FireLikeAuraConfig.js` (risk 9)
- **What it is:** Config object with constants (`flowSpeed: 0.8`, `ridgeThreshold: 0.3`, etc.).
- **Why false positive:** No THREE.js, no visual logic, no runtime behavior. Pure data.

### 6. `InputSensoryGeometries_v1.js` (risk 9)
- **What it is:** Node geometry factory for INPUT node variants (`SensoryGate`, `ListeningCrown`, `PerceptionBloom`).
- **Why false positive:** Builds static `BoxGeometry` / `ConeGeometry` / `SphereGeometry` meshes. No update loop, no lifecycle.

### 7. `RaycastTargetRegistry.js` (risk 9)
- **What it is:** Utility registry for raycast-safe meshes.
- **Why false positive:** No FX, no THREE.js object creation, no per-frame logic. Pure registry (`register()`, `unregister()`, `get()`, `clear()`).

### 8. `ControlNodeSpecialGoverners_Session114.js` (risk 8)
- **What it is:** Node geometry factory for Control node variants (`PhrixFlowArbiter`, `CrucisSuppressionGovernor`, `VertexTemporalGate`).
- **Why false positive:** Builds complex static geometries. No update loop, no dispose needed for static construction.

### 9. `FXPerformanceController_v1.js` (risk 8)
- **What it is:** Performance multiplier controller (`setLowFX()`, `getMultiplier()`, `getAllMultipliers()`).
- **Why false positive:** No THREE.js, no visual FX. Manages numeric multipliers used by other systems.

### 10. `NodeSurfaceProtection_DepthAnchor.js` (risk 8)
- **What it is:** One-time depth-anchor injection utility to prevent aura occlusion.
- **Why false positive:** Creates invisible `MeshBasicMaterial` depth anchors during node setup. No per-frame logic, no continuous FX. A fix/workaround utility.

### 11. `StorageEnhancedVariants_Session81.js` (risk 8)
- **What it is:** Node geometry factory for Storage node variants (`ArchiveNexus`, `MemoryCrypts`, `DepthLayers`, `MnemonicChoirReliquary`).
- **Why false positive:** Static geometry builder. No update loop.

### 12. `StorageNodesVisual_Session116.js` (risk 8)
- **What it is:** Node geometry factory for Storage node variants (`ObeliskCache`, `FractalReservoir`, `ArchiveDrum`, `EclipseReliquary`).
- **Why false positive:** Static geometry builder (~2400 lines of mesh construction). No update loop, no runtime FX management.

---

## REAL KILL / NEEDS FIX (3 files)

These are actual visual FX systems that create/update/dispose THREE.js objects at runtime. They legitimately fail the FX contract and need fixes.

### 1. `CoreHologramShader.js` (risk 11)
- **What it is:** Hologram shell shader factory. Creates `ShaderMaterial` for hologram shells around nodes.
- **Exports:** `getStableHologramGeometry()`, `createCoreIdentityMaterial()`, `createHologramShellMaterial()`, `createNodeHologramShell()`, `reassertNodeHologramShell()`.
- **Real FX:** Yes — creates `THREE.ShaderMaterial` with uniforms (`uTime`, `uOpacity`, `uScanlineIntensity`, `uGlitchStrength`).
- **Missing contract:**
  - **OWNER:** No owner registration. Auto-inits `window.AuraDebug` on module load (line 143).
  - **GATE:** No enabled/disabled flag.
  - **UPDATE:** `updateHologramShellMaterial()` exists but is a stub (returns material unchanged).
  - **BUDGET:** No cap on hologram shell count or complexity.
  - **LIFETIME:** No automatic cleanup when node dies.
  - **DISPOSE:** No `dispose()` for geometry or material.
- **Recommended action:** Add owner gate, implement real update, add dispose, remove `window.AuraDebug` auto-init.

### 2. `FresnelAuraIntegrationPatch.js` (risk 9)
- **What it is:** Fresnel rim-light aura integration. Creates aura meshes and updates uniforms per frame.
- **Exports:** `patchAINodesToUseFresnelAuras()`, `createFresnelAura()`, `updateFresnelAuraUniforms()`, `batchUpdateFresnelAuraUniforms()`.
- **Real FX:** Yes — creates `THREE.Mesh` with `ShaderMaterial` for fresnel rim-light effect.
- **Missing contract:**
  - **OWNER:** No owner registration.
  - **UPDATE:** Has `updateFresnelAuraUniforms()` but no gate-controlled update loop.
  - **BUDGET:** No cap on aura count.
  - **DISPOSE:** No `dispose()` for aura mesh or material.
- **Note:** `patchConfig.enabled: false` by default, but the system is real FX when enabled.
- **Recommended action:** Add owner gate, budget cap, dispose method.

### 3. `MemoryLane.js` (risk 8)
- **What it is:** Full world environment class. Creates a 96m hall with floor, central core, server towers, cooling towers, galleries, ceiling, data cables, walls, holograms, memory shards, particle drift, volumetric fog.
- **Real FX:** Yes — massive environment with many animated visual elements.
- **Has:** `update(deltaTime, time)` animates core pulse, server towers, ceiling panels, galleries, neon strips, holograms, memory shards, particles, wall glitches, fog layers, arcs, data cables.
- **Missing contract:**
  - **GATE:** No enabled/disabled flag for the environment.
  - **DISPOSE:** Constructor stores arrays (`this.serverTowers`, `this.coolingTowers`, `this.galleries`, `this.holograms`, `this.memoryShards`, `this.particleDrifts`, `this.fogLayers`, `this.arcs`, `this.dataCables`) but `dispose()` method is **missing entirely**.
- **Recommended action:** Add `dispose()` that traverses and cleans up all created objects. Add enabled gate.

---

## Recommended Next Steps

1. **Reclassify the 12 false positives** in the audit data — they should not be KILL. Suggest moving them to a new category like `EXEMPT` or `NOT_FX`.
2. **Fix the 3 real KILL files:**
   - `CoreHologramShader.js` — add owner, gate, update, budget, lifetime, dispose
   - `FresnelAuraIntegrationPatch.js` — add owner, gate, budget, dispose
   - `MemoryLane.js` — add dispose, gate
3. **Investigate `ATOMAShaderBase.js` path** — the audit script looked at root level but file is in `Engine/Visual/`. Update scan paths if needed.
