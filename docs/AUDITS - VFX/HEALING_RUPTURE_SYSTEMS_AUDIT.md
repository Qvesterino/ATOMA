# Healing & Rupture Visual Systems — Comprehensive Audit

**Date:** 2026-04-13  
**Systems Audited:**
- `ResonanceRuptureVisualSystem_Session133`
- `HarmonicHealingVisualSystem_Session134`
- `HealingParticleSystem_Session136`
- `HarmonicRecoveryVisualSystem_Session138`

---

## Executive Summary

Found **3 confirmed bugs** (1 critical, 2 medium), **5 performance issues**, and **4 architectural concerns** across the four systems. The critical bug causes re-stitching particles to spawn at world origin instead of along link paths. Two medium bugs involve shard accumulation in the rupture bloom and untracked geometry leaks in recovery beams.

---

## BUG 1 — CRITICAL: Re-stitching particles spawn at origin (Session 138)

**File:** `HarmonicRecoveryVisualSystem_Session138.js`  
**Location:** `_spawnReStitching()` lines 577–590 and `_updateRecoveringZones()` lines 846–859

### Root Cause

The "zero-allocation" refactoring introduced a temp-vector aliasing bug. `pos1` and `pos2` are references to `this._tmpVec3A` / `this._tmpVec3B`. The velocity argument `this._tmpVec3A.set(0,0,0)` **mutates the same object** that `pos1` points to, zeroing the position before `emitHealingTrail()` reads it.

```javascript
// _spawnReStitching — BROKEN
const pos1 = this._tmpVec3A.lerpVectors(p1, p2, t1);  // pos1 === this._tmpVec3A
// ... offset applied to pos1 ...

this.healingParticles.emitHealingTrail(
    pos1,                           // ← reference to _tmpVec3A
    this._tmpVec3A.set(0, 0, 0),   // ← ZEROES pos1 before emitHealingTrail reads it!
    intensity, now, this._tmpColorWhite
);
```

JavaScript evaluates arguments left-to-right, but the function body executes **after** all arguments are evaluated. By the time `emitHealingTrail` copies the position internally, `_tmpVec3A` is already `(0,0,0)`.

### Impact

- Re-stitching particles for recovery zones spawn at world origin `(0,0,0)` instead of along the link path
- Affects the main rupture recovery path (`_triggerRecoveryFromLink` → zones without `waveOnly`)
- Does NOT affect `waveOnly: true` zones (from `_spawnCoherenceWave` and `_handleCascadeEnd`)
- User sees particles at center of world instead of on recovering links

### Fix

Use separate temp vectors for position and velocity, or pass velocity as a fresh `{x,y,z}` literal:

```javascript
// Option A: dedicated velocity temp vectors (add to constructor)
this._tmpVelA = new THREE.Vector3();
this._tmpVelB = new THREE.Vector3();

// In _spawnReStitching:
this._tmpVelA.set(0, 0, 0);
this._tmpVelB.set(0, 0, 0);
this.healingParticles.emitHealingTrail(pos1, this._tmpVelA, intensity, now, this._tmpColorWhite);
this.healingParticles.emitHealingTrail(pos2, this._tmpVelB, intensity, now, this._tmpColorGold);
```

**Same bug exists in `_updateRecoveringZones()` lines 846–859 — must be fixed there too.**

---

## BUG 2 — MEDIUM: Fracture bloom shard accumulation (Session 133)

**File:** `ResonanceRuptureVisualSystem_Session133.js`  
**Location:** `_layoutFractureBloomScar()` lines 1630–1682

### Root Cause

`_layoutFractureBloomScar()` appends `fractureBloomExtraShardCount` extra shards to `root.userData.shards` and `root.add(extraShard)` every time it's called. But `_createFractureBloomScarRoot()` already populates `userData.shards` with the base shards. If the scar mesh pool item is reused (which it is — pool items are recycled), extra shards accumulate across rupture cycles without cleanup.

```javascript
// Each call adds 6 more shards without removing previous extras
for (let i = 0; i < extraShardCount; i++) {
    // ...
    root.add(extraShard);            // accumulates in scene graph
    root.userData.shards.push(extraShard);  // accumulates in array
}
```

### Impact

- After N ruptures, a recycled scar mesh could have `11 + N*6` shards instead of `11 + 6`
- Memory and GPU draw call leak over time
- Visual clutter from accumulated shards

### Fix

Before adding extra shards, remove previous extras:

```javascript
// At the start of _layoutFractureBloomScar, remove previous extra shards:
const baseCount = 11; // base shard count from _createFractureBloomScarRoot
while (root.userData.shards.length > baseCount) {
    const extra = root.userData.shards.pop();
    root.remove(extra);
    extra.geometry?.dispose();
    extra.material?.dispose();
}
```

---

## BUG 3 — MEDIUM: Recovery beam geometry/material leak (Session 138)

**File:** `HarmonicRecoveryVisualSystem_Session138.js`  
**Location:** `_spawnReStitching()` lines 593–614

### Root Cause

Every `_spawnReStitching()` call creates:
- `new THREE.BufferGeometry()`
- `new THREE.LineBasicMaterial()` (with `new THREE.Color()`)
- `new THREE.Line()`

Cleanup relies on `setTimeout(() => { ... dispose() }, 180)`. These objects are NOT tracked in `_createdObjects`. If the system is disposed or the scene changes before the timeout fires, the objects leak permanently.

```javascript
const beamGeometry = new THREE.BufferGeometry().setFromPoints([...]);
const beamMaterial = new THREE.LineBasicMaterial({...});
const beam = new THREE.Line(beamGeometry, beamMaterial);
this.scene.add(beam);

setTimeout(() => {  // fragile — no guarantee of execution
    if (beam.parent) beam.parent.remove(beam);
    beamGeometry.dispose();
    beamMaterial.dispose();
}, 180);
```

### Impact

- Geometry and material leak on scene switch or system disposal
- `setTimeout` is not tied to the system lifecycle
- Not tracked by unified cleanup contract

### Fix

Use a managed beam pool or track beams in `_createdObjects` with lifecycle management:

```javascript
// Track for cleanup
this._activeBeams = [];

// In _spawnReStitching:
this._activeBeams.push({ mesh: beam, disposeAt: currentVisualTime + 0.18 });

// In update, prune expired beams:
this._activeBeams = this._activeBeams.filter(b => {
    if (currentVisualTime >= b.disposeAt) {
        this.scene.remove(b.mesh);
        b.mesh.geometry.dispose();
        b.mesh.material.dispose();
        return false;
    }
    return true;
});
```

---

## PERFORMANCE ISSUES

### P1: Per-frame allocation in HealingWave trail emission (Session 134)

**File:** `HarmonicHealingVisualSystem_Session134.js`  
**Location:** `_updateWaves()` lines 452–459

```javascript
const trailVelocity = wave.currentDir.clone().multiplyScalar(wave.speed * 0.3);  // NEW Vector3 every wave every frame
this.particles.emitHealingTrail(
    wave.currentPos,
    trailVelocity,
    wave.intensity,
    time,
    new THREE.Color(0x66f7ff)  // NEW Color every wave every frame
);
```

With `maxWaves: 120` at 60fps, this creates up to **14,400 objects/second** (7,200 Vector3 + 7,200 Color). Should use pre-allocated temps.

### P2: Per-frame allocation in _emitScarSparkle (Session 136)

**File:** `HealingParticleSystem_Session136.js`  
**Location:** `_emitScarSparkle()` line 485

```javascript
localPos.applyMatrix4(mesh.matrixWorld);  // allocates internally in some Three.js versions
```

The `_tmpVec3A` / `_tmpVec3B` pattern is correctly used for the most part, but `applyMatrix4` on a `Vector3` in Three.js r150+ does not allocate. Verify the Three.js version in use.

### P3: Per-rupture geometry allocation (Session 133)

**File:** `ResonanceRuptureVisualSystem_Session133.js`  
**Location:** `_createRuptureBurst()` lines 663–669, `_initiatePropagation()` lines 702–710

Each rupture creates:
- 1 `IcosahedronGeometry` (or fracture bloom with 11+ geometries)
- 1 `SphereGeometry` or `OctahedronGeometry` per propagation pulse

These are disposed on rupture end, but the allocation spike could cause frame drops during cascade events with multiple simultaneous ruptures.

### P4: Full link iteration every frame (Session 133)

**File:** `ResonanceRuptureVisualSystem_Session133.js`  
**Location:** `_ensureCanonicalLinkDefaults()` and `_updateRuptureCanonicalLinkMetrics()`

Both iterate ALL links every frame. `_ensureCanonicalLinkDefaults` is particularly wasteful — after the first frame, all defaults are set and the checks are redundant. Should be called once on setup or on link creation.

### P5: `_createdObjects.includes()` is O(n) (Session 133)

**File:** `ResonanceRuptureVisualSystem_Session133.js`  
**Location:** `_ensureScarMeshesAttached()` line 2098

```javascript
if (!this._createdObjects.includes(mesh)) {
    this._createdObjects.push(mesh);
}
```

Called every frame for every scar mesh. Should use a `Set` for O(1) lookup.

---

## ARCHITECTURAL CONCERNS

### A1: Time source inconsistency across systems

| System | Time Source |
|--------|------------|
| Session 133 (Rupture) | `currentTime` param from update loop |
| Session 134 (Healing) | `performance.now()` via `_getCurrentTime()` |
| Session 136 (Particles) | `time` param from update loop |
| Session 138 (Recovery) | `VisualTime.now` with fallback |

Session 134 uses `performance.now()` for cooldowns while other systems use the simulation time passed to `update()`. If the simulation is paused or time-scaled, cooldowns in Session 134 will behave differently from other systems.

**Recommendation:** Standardize on `VisualTime.now` or the `time` parameter passed to `update()`.

### A2: `debugVisualBoost: true` is production default (Session 133)

**File:** `ResonanceRuptureVisualSystem_Session133.js` line 143

```javascript
debugVisualBoost: true,
```

This changes colors, opacity, sizes, and particle counts for ALL rupture visuals. If this system is in production, the visuals are running in debug mode. This affects:
- Stress indicator opacity (+0.2)
- Rupture burst color (magenta instead of orange-red)
- Propagation pulse color (cyan instead of orange-red)
- Scar color (yellow instead of purple-bruise)
- Scar particle count (32 instead of 24)
- Scar particle size (176 instead of 144)

**Recommendation:** Set `debugVisualBoost: false` for production.

### A3: `_layoutFractureBloomScar` is defined but never called (Session 133)

**File:** `ResonanceRuptureVisualSystem_Session133.js`

`_createRuptureBurst()` calls `_createFractureBloomScarRoot()` which creates the bloom group with shards at default positions. `_layoutFractureBloomScar()` exists to orient the bloom along the link direction, but it is never called from the rupture flow. The fracture bloom shards remain at their default positions relative to the convergence point.

**Impact:** Fracture bloom visuals don't orient along the ruptured link — they appear as a symmetric burst regardless of link direction. This may be intentional but is inconsistent with the `_layoutScarParticleBurst` pattern used for scars.

### A4: Autonomous wave spawning disabled (Session 134)

**File:** `HarmonicHealingVisualSystem_Session134.js`

`_spawnSingleWave()` exists but is never called from `update()`. Waves only spawn via semantic events (`link.harmony.high/mid/low`). If the semantic bus is not connected, **no healing waves will ever spawn**.

The `_resolveHealingState()` is computed every frame but only stored — it's never used to drive autonomous wave spawning. The `triggerWaveBatch()` external API also has a bug: it passes `1.0` (number) where `_spawnSingleWave` expects an object `{ healingDrive, harmony }`.

**Recommendation:** Either add autonomous spawning based on `healingState.recoveryReady` in `update()`, or document that this system is purely event-driven and requires the semantic bus.

---

## DATA FLOW ANALYSIS

### Cross-System Pipeline

```
ResonanceRuptureVisualSystem (133)
    │
    ├── emits: topology.rupture (semanticBus)
    ├── writes: link.userData.visualTear, visualCoherenceLoss
    ├── writes: link.userData.cascadeIntensity, flowState
    ├── provides: .ruptures[] → monitored by Session 138
    ├── provides: .resonanceScars[] → read by Session 136
    │
    ▼
HarmonicRecoveryVisualSystem (138)
    │
    ├── monitors: ruptureSystem.ruptures (detects completion)
    ├── subscribes: link.harmony.high, link.harmony.mid, cascade.end
    ├── emits: topology.healing (semanticBus)
    ├── calls: healingParticles.emitHealingTrail() ← BUG 1 affects this
    │
    ▼
HarmonicHealingVisualSystem (134)
    │
    ├── subscribes: link.harmony.high, link.harmony.mid, link.harmony.low
    ├── emits: topology.healing (semanticBus)
    ├── calls: particles.emitHealingTrail() ← works correctly
    ├── calls: particles.emitSplash() ← works correctly
    ├── writes: node.userData.metrics.corruption (via setMetric)
    ├── writes: link.userData.visualState.stability
    │
    ▼
HealingParticleSystem (136)
    │
    ├── reads: resonanceRupture.resonanceScars[] → scar sparkles
    ├── provides: emitHealingTrail() ← called by 134 and 138
    ├── provides: emitSplash() ← called by 134
    ├── renders: GPU particle buffer (THREE.Points, circular buffer)
    │
    ▼
    GPU (screen)
```

### Data Flow Issues Found

1. **Session 138 → 136**: `emitHealingTrail` receives zeroed position (BUG 1)
2. **Session 133 → 138**: Rupture detection relies on comparing rupture ID sets between frames. If a rupture starts and ends in the same frame, recovery won't trigger.
3. **Session 134 → metrics**: Writes to `node.userData.metrics.corruption` and `link.userData.visualState.stability` — these are canonical metric paths. The `setMetric` import is correct.
4. **Session 133 → canonical**: Writes `visualTear`, `visualCoherenceLoss` to all links every frame even when no ruptures are active (decay pass).

---

## SPAWN PIPELINE ANALYSIS

### Session 133 — Rupture Spawn Pipeline

```
Trigger: stress > threshold OR score > threshold OR amplitude > hard limit
  │
  ├── Pool acquire: ruptureEventPool (max 5)
  ├── Create: _createRuptureBurst → IcosahedronGeometry OR FractureBloomScarRoot
  ├── Create: propagation pulses (max 20) → Sphere/OctahedronGeometry each
  ├── Create: resonance scar → scarMeshPool (max 20) → particle burst Points
  ├── Trigger: nodeReactions map
  ├── Emit: topology.rupture on semanticBus
  │
  Lifecycle:
  ├── Rupture: 1.5s → burst mesh disposed, pool item released
  ├── Propagation: distance-based → mesh disposed, pool item released
  ├── Scar: 120s → mesh hidden, pool item released
  └── Node reaction: 0.5s → opacity restored
```

**Pool Safety:** ✅ Rupture events and propagation pulses use pre-allocated pools.  
**Leak Risk:** ⚠️ Fracture bloom extra shards accumulate (BUG 2).  
**Allocation:** ⚠️ Per-rupture geometry creation (P3).

### Session 134 — Healing Wave Spawn Pipeline

```
Trigger: semantic event (link.harmony.high/mid/low)
  │
  ├── Create: HealingWave object (pre-allocated currentPos, currentDir)
  ├── Emit: particles.emitSplash at start node
  │
  Per-frame (active waves):
  ├── Update wave progress
  ├── Call: particles.emitHealingTrail(currentPos, velocity, ...)
  │
  On arrival:
  ├── Emit: topology.healing on semanticBus
  ├── Call: particles.emitSplash at end node
  └── Apply: _applyHealingImpact (corruption reduction, stability boost)
```

**Pool Safety:** ✅ Waves use simple array, no pooling needed at 120 max.  
**Leak Risk:** ✅ Dead waves filtered each frame.  
**Allocation:** ⚠️ Per-frame `clone()` and `new THREE.Color()` (P1).

### Session 136 — Particle Spawn Pipeline

```
External calls: emitHealingTrail(), emitSplash()
Internal: _processScars() → _emitScarSparkle()
  │
  All paths → spawnParticle(pos, vel, color, size, life, startTime)
  │
  Circular buffer: particleIndex = (particleIndex + 1) % maxParticles
  │
  GPU: attributes set with needsUpdate = true
  Dead particle culling: shader-based (age > lifetime → offscreen)
```

**Pool Safety:** ✅ Circular buffer, no allocation.  
**Leak Risk:** ✅ GPU-side culling.  
**Allocation:** ✅ Uses pre-allocated temps correctly (except the aliasing from callers).

### Session 138 — Recovery Spawn Pipeline

```
Trigger: rupture completion detection OR semantic event OR cascade.end
  │
  ├── Create: recoveringZone object
  ├── Pool acquire: waveMeshPool (max 10) or haloMeshPool (max 20)
  ├── Call: healingParticles.emitHealingTrail() ← BUG 1
  ├── Create: beam Line (untracked, setTimeout cleanup) ← BUG 3
  │
  Per-frame (active zones):
  ├── Update wave mesh uniforms
  ├── Re-stitching: emitHealingTrail() ← BUG 1 (same aliasing)
  ├── Update halo billboards
  │
  Lifecycle:
  ├── Zone: 3-5s → mesh released to pool
  ├── Halo: 2.5s → mesh released to pool
  └── Beam: 180ms → setTimeout dispose ← BUG 3
```

**Pool Safety:** ✅ Waves and halos use pre-allocated pools.  
**Leak Risk:** ⚠️ Beam geometry untracked (BUG 3).  
**Allocation:** ⚠️ Per-call beam creation, `position.clone()` in cascade handler.

---

## VISIBILITY MATRIX — What the user actually sees

| Effect | System | Status | Notes |
|--------|--------|--------|-------|
| Rupture burst (orange sphere) | 133 | ✅ Visible | Works correctly |
| Fracture bloom (multi-shard) | 133 | ⚠️ Partially visible | Shards at default positions, not link-oriented |
| Propagation pulses | 133 | ✅ Visible | Travels along adjacent links |
| Resonance scars (particle burst) | 133 | ✅ Visible | Correctly positioned, long fade |
| Pre-rupture stress indicators | 133 | ✅ Visible | When stress > 50% |
| Node halo destabilization | 133 | ✅ Visible | Jitter on rupture |
| Healing waves (golden trails) | 134 | ✅ Visible | Correctly travels along links |
| Wave arrival splash | 134 | ✅ Visible | Burst at destination node |
| Healing particle trails | 136 | ✅ Visible | GPU particles, circular glow |
| Scar sparkles | 136 | ✅ Visible | Sparkles from resonance scars |
| Coherence recovery waves | 138 | ✅ Visible | Expanding ring shader |
| Node recovery halos | 138 | ✅ Visible | Billboard with rotating pattern |
| Link re-stitching particles | 138 | ❌ BROKEN | Spawns at origin (BUG 1) |
| Link re-stitching beams | 138 | ⚠️ Visible but leaks | Short green beam, but geometry leaks (BUG 3) |

---

## RECOMMENDED FIX PRIORITY

| Priority | Bug | Impact | Effort |
|----------|-----|--------|--------|
| **P0** | BUG 1: Re-stitching temp vector aliasing (Session 138) | Particles at wrong position | Low — add 2 temp vectors |
| **P1** | BUG 2: Shard accumulation (Session 133) | Memory/draw call leak | Low — cleanup before re-layout |
| **P1** | BUG 3: Beam geometry leak (Session 138) | Geometry leak on scene switch | Medium — managed beam pool |
| **P2** | A2: debugVisualBoost default true (Session 133) | Wrong production visuals | Trivial — config change |
| **P2** | P1: Per-frame allocation in waves (Session 134) | GC pressure | Low — pre-allocate temps |
| **P3** | A1: Time source inconsistency | Pause/scale behavior | Medium — standardize |
| **P3** | A4: Autonomous spawning disabled | No waves without bus | Low — add fallback |
| **P3** | P4: Full link iteration every frame | CPU cost | Low — flag-based skip |
