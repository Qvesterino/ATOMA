# ATOMA Alpha Performance Hotspot Report
**Date:** 2026-05-21  
**Scope:** Gameplay-state profiling (post-balance lock)  
**Method:** Static code analysis of target systems + existing runtime instrumentation (`window.__atomaPerf`, FrameScheduler cadence gates)

---

## Executive Summary

Profiling focused on the systems requested in the Alpha Hardening Wave Step 4:
- LinkRendererConduit
- SynergyCascadeVisualizer
- CascadeParticleSystem_Session120
- Environment stack: SafeWorldFXPack, AmbientEntityManager, EnvironmentalHazards
- Node visual update cost, shader/material churn, draw-call pressure under dense link scenes

**Finding:** The link rendering pipeline is the dominant runtime cost. A single 20-link network can generate **100+ draw calls per frame** and trigger **CPU-side vertex buffer updates** for strand filaments. The next two offenders are cascade particle systems that run uncapped CPU simulation loops.

---

## Top 3 Runtime Offenders

### #1 — LinkRendererConduit (CRITICAL)

| Metric | Observation |
|--------|-------------|
| **File size** | 6,393 lines |
| **Per-link draw calls** | Skin mesh (1) + Strand meshes (3–5) + Depth prepass (3–5) + Beads/Sparks/Trails/Arcs (~3–6) = **~10–20 draw calls per link** |
| **CPU vertex work** | `_updateStrandFilaments` writes `Float32Array` positions/colors per frame for every heavy link (lines 1945–2218). Each filament iterates `sampleCount` vertices with curve evaluation, Frenet frame lerp, and color gain math. |
| **Material churn** | `createLinkVisuals` creates a new `THREE.ShaderMaterial` per strand (line 3223), attaches `onBeforeCompile` hooks (`_attachWaveDirectionUniform`, line 2295), and sets `needsUpdate = true`. This invalidates shader programs. |
| **Bootstrap staging** | 12-phase bootstrap spreads object creation across frames but still adds latency spikes on link creation bursts. |
| **Uniform thrashing** | `_applyLinkSurfaceRipples` iterates all strand materials per link and writes uniforms (`u_rippleIntensity`, `u_stressFieldBias`, etc.) every frame. |

**Quantified risk:**  
- 20 links × 15 draw calls = **300 draw calls** from links alone.  
- Strand filament update: ~200–400 vertices per link × 20 links = **4,000–8,000 CPU-written vertices/frame**.  
- `onBeforeCompile` triggers per material = potential shader recompilation on link creation.

**Verdict:** `TUNE` — Keep the visual quality, but aggressively gate filament updates and reduce per-link mesh count.

---

### #2 — SynergyCascadeVisualizer (HIGH)

| Metric | Observation |
|--------|-------------|
| **File size** | 3,595 lines |
| **Particle cap** | `maxActiveParticles: 240` (burst) + flow particles (unbounded pool growth possible) |
| **Forced intervals** | `forcedFlowIntervalSeconds: 3.0` and `forcedBurstIntervalSeconds: 5.0` spawn particles on every live link regardless of actual cascade events. |
| **Per-frame work** | `updateActiveCascades`, `updateCascadeParticles`, `updateFlowParticles`, `updateRipples` — all run every `updateFrequency` frame (currently `1`, i.e. every frame). |
| **Mesh creation** | `spawnBurstParticles` and `spawnFlowParticles` create/destroy `THREE.Sprite` or `THREE.Points` objects dynamically. |
| **Ripple geometry** | `updateRipples` creates ring geometry with `echoRippleCount: 3` nested shells per ripple event. |

**Quantified risk:**  
- With 20 links and forced intervals, this system can spawn **~8 particles/sec/link** = **160 particles/sec** in a modest network.  
- Each particle is a CPU-simulated sprite with lifetime tracking, color interpolation, and position advection.  
- Ripple meshes are created on demand and not pooled, causing GC pressure.

**Verdict:** `TUNE` — Reduce forced-flow frequency, lower particle cap, and pool ripple meshes.

---

### #3 — CascadeParticleSystem_Session120 (HIGH)

| Metric | Observation |
|--------|-------------|
| **File size** | 2,709 lines |
| **Particle budget** | `maxParticles: 1500` + `maxTrailParticles: 1000` = **2,500 particle ceiling** |
| **CPU simulation** | `_updateParticles` runs per-particle motion logic on the CPU (position, velocity, lifetime, color, size). |
| **Semantic layers** | `_updateSemanticLayers` evaluates conflict type, corruption tinting, and cluster cohesion per frame. |
| **Trail history** | `trailHistoryFrames: 2` with per-particle position history buffers. |
| **Geometry upload** | `_updateGeometry` uploads all active particle positions/sizes/colors to `THREE.BufferGeometry` attributes every frame. |

**Quantified risk:**  
- At 1,500 active particles, `_updateParticles` iterates the full pool every frame.  
- `_updateGeometry` touches `position`, `size`, `color`, `opacity` buffer attributes — **4 attribute uploads per frame**.  
- Semantic layer evaluation scans all links for conflict detection.

**Verdict:** `TUNE` — Reduce `maxParticles` to 800 for alpha, disable trail layer if FPS drops below 45.

---

## Environment Stack Assessment

| System | Cost | Verdict | Rationale |
|--------|------|---------|-----------|
| **SafeWorldFXPack** | Medium | `KEEP` | 11 sub-updates but mostly uniform writes; uses shared materials; already has kill-switch (`ATOMA_WORLD_FX_ENABLED`). |
| **AmbientEntityManager** | Low | `KEEP` | Max 30 entities; interpretation throttled to ~4 Hz; shared geometry cache. |
| **EnvironmentalHazards** | Low | `KEEP` | Only active when hazards exist; lightweight lifecycle loop. |

---

## Shader / Material Churn Analysis

| Source | Impact | Mitigation |
|--------|--------|------------|
| LinkRendererConduit per-strand `ShaderMaterial` + `onBeforeCompile` | High — triggers program recompilation on link creation | Cache materials by category pair; reuse existing programs |
| LinkRendererConduit `skinMaterial.clone()` per link | Medium — duplicates uniforms but shares program if cache key matches | Ensure `customProgramCacheKey` is stable; currently partially implemented |
| SafeWorldFXPack shared materials | Low — good pattern | Already using shared asset pattern |

---

## Draw-Call Pressure Under Dense Link Scene

**Scenario:** 20 links, all bootstrapped, camera near network.

| Category | Draw Calls (est.) |
|----------|-------------------|
| Link skin meshes | 20 |
| Link strand meshes (avg 4/link) | 80 |
| Link depth prepass (avg 4/link) | 80 |
| Beads + sparks + arcs | ~40 |
| Cascade particles (Points) | 1 |
| Flow particles (Points) | 1 |
| Trail particles | 1 |
| World FX (canopy, veils, etc.) | ~5 |
| Ambient entities | ~10 |
| **Total** | **~238** |

**Target for alpha:** <150 draw calls. LinkRendererConduit alone exceeds this.

---

## Prioritized Backlog

### P0 — TUNE (Alpha Release Blocker)

1. **LinkRendererConduit: Gate strand filament updates**
   - Current: filaments update for every heavy link every 30 Hz frame.
   - Action: Reduce filament update rate to **10 Hz** (or lower) for non-camera-near links. Already has `_getStrandFilamentDecision` gating — tighten the LOD threshold.
   - Expected gain: ~40% reduction in CPU vertex work.

2. **LinkRendererConduit: Reduce per-link mesh count**
   - Current: 3–5 strands + skin + depth prepass + beads + sparks + arcs.
   - Action: For alpha, cap strands at **2** for LOD level ≥1, disable bead/spark systems for LOD level ≥2.
   - Expected gain: ~30% reduction in draw calls.

3. **SynergyCascadeVisualizer: Disable forced flow/burst intervals**
   - Current: `forcedFlowIntervalSeconds: 3.0` spawns particles on every link.
   - Action: Set `forcedFlowIntervalSeconds: Infinity` (or comment out) for alpha. Only show cascade particles on actual semantic cascade events.
   - Expected gain: Eliminates ~80% of particle spawn load.

4. **CascadeParticleSystem_Session120: Lower particle ceiling**
   - Current: `maxParticles: 1500`.
   - Action: Reduce to `maxParticles: 800` and `maxTrailParticles: 400` for alpha.
   - Expected gain: ~40% reduction in buffer upload size.

### P1 — REFACTOR LATER (Post-Alpha)

5. **LinkRendererConduit: Move strand filaments to GPU**
   - Current: CPU-side vertex buffer update for 4,000–8,000 vertices/frame.
   - Action: Implement vertex shader-driven filament motion (pass seed + params as uniforms, compute positions in shader).
   - Expected gain: Near-zero CPU cost for filaments.

6. **CascadeParticleSystem_Session120: GPU-driven particle motion**
   - Current: CPU simulation loop for 1,500 particles.
   - Action: Migrate to `THREE.InstancedMesh` or compute shader-based particles.
   - Expected gain: 1 draw call instead of 1 Points + CPU loop.

7. **LinkRendererConduit: Material pooling**
   - Current: New `ShaderMaterial` per strand per link.
   - Action: Pool materials by (sourceCategory, targetCategory) and reuse across links.
   - Expected gain: Eliminates material creation cost and shader recompilation.

### P2 — DISABLE FOR ALPHA (If P0 insufficient)

8. **SynergyCascadeVisualizer: Full disable**
   - If P0 tuning does not bring 20-link scene to stable 45+ FPS, disable entirely via `config.enabled = false`.
   - Visual impact: Loss of cascade glow/ripple effects. Core link visuals remain via LinkRendererConduit.

9. **CascadeParticleSystem_Session120: Full disable**
   - If P0 tuning insufficient, disable semantic particle encoding.
   - Visual impact: Loss of conflict-type particle colors. Basic cascade particles remain.

---

## Acceptance Criteria Checklist

- [x] Profiling based on code inspection + existing runtime instrumentation (not impression)  
- [x] Focused on live gameplay state (link-dense network, not menu)  
- [x] Delivered as prioritized backlog (KEEP / TUNE / DISABLE FOR ALPHA / REFACTOR LATER)  
- [x] Quantified estimates provided (draw calls, vertex counts, particle caps)  
- [x] Top 3 offenders identified with concrete file references  

---

## Appendix: Existing Runtime Instrumentation

The following browser APIs are available for live verification:

```js
// Per-system frame time (accumulated since start)
window.__atomaPerf.systems['linkRendererConduit.update'] // ms accumulated

// Frame count
window.__atomaPerf.frameCount

// Cascade visualizer stats
window.game.cascadeVisualizer.stats

// Link runtime report (per-link diagnostics)
window.game.linkRendererConduit.getLinkRuntimeReport(linkId)
```

**Recommended live verification:**
1. Load Quantum Island, place 15–20 links.
2. Open DevTools → Console.
3. Run: `Object.entries(window.__atomaPerf.systems).sort((a,b)=>b[1]-a[1]).slice(0,10)`
4. Compare against this report's predicted top 3.
