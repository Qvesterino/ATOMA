# LINK EXECUTION LAYER AUDIT
## RenderOrder Stabilization & Deterministic Link Visuals

**Created:** 2026-03-02  
**Goal:** Make link visuals deterministic by fixing RenderOrder, scheduler registration, and link ID system

---

## 📊 CURRENT RENDER ORDER STATUS

### Found Values (Scattered & Conflicting)

| Visual Layer | Current renderOrder | File | Line | Issue |
|--------------|---------------------|-------|-------|--------|
| **Skin Aura** | 9 | `LinkRendererConduit.js` | ~280 | ✅ Base layer |
| **Strands (braided rope)** | 10 | `LinkRendererConduit.js` | ~220 | ✅ Base rope |
| **Directional Streaks** | 11 | `LinkDirectionalStreaks.js` | ~120 | ⚠️ Conflicts with pulse ring |
| **Pulse Ring** | 11 | `LinkPulseRing.js` | ~45 | ❌ **CONFLICT** with directional streaks |
| **Arc Discharges (lines)** | 12 | `LinkRingArcDischarges.js` | ~80 | ✅ Above 11 |
| **Sparks (points)** | 12 | `LinkSparkSystem.js` | ~60 | ✅ Above strands |
| **Impacts (additive)** | 40 | `LinkRendererConduit.js` | ~480 | ⚠️ High value (above holo?) |
| **Beads** | 120 | `LinkBeadSystem.js` | ~240 | ⚠️ Very high |
| **Particles (Trail)** | 500 | `LinkTrailParticleSystem.js` | ~280 | ❌ **EXCESSIVE** (likely above holographic) |

---

## ❌ PROBLEMS IDENTIFIED

### 1. Non-Deterministic Ordering
- **Pulse Ring (11)** conflicts with **Directional Streaks (11)**
  - Same renderOrder = undefined draw order
  - Rendering may flicker or vary between frames

### 2. Inconsistent Spacing
- Gaps between layers: 9→10→11→12→40→120→500
- No clear hierarchy or pattern
- 500 is excessively high (likely over holographic elements)

### 3. Missing Unified System
- No central authority defining renderOrder values
- Each system sets its own value independently
- Hard to reason about visual layering

### 4. Link ID Fallback Issue
```javascript
// LinkRendererConduit.js, line ~340
const linkIdHash = (link.id || 'default').split('').reduce((h, c) => h * 31 + c.charCodeAt(0), 0);
```
**Problem:** Falls back to `'default'` if `link.id` is undefined
**Impact:** Multiple links with ID=`'default'` will share the same hash → non-deterministic visual behavior

---

## ✅ PROPOSED DETERMINISTIC RENDER ORDER SYSTEM

### Layer Hierarchy (Z-Axis: Low → High)

| Priority | Layer | renderOrder | Rationale |
|----------|--------|-------------|------------|
| 0 | **Skin Aura** | 9 | Base atmospheric layer (behind rope) |
| 1 | **Strands (braided rope)** | 10 | Main link geometry |
| 2 | **Directional Streaks** | 11 | Flow indicators above rope |
| 3 | **Pulse Ring** | 12 | Energy carrier (above streaks) |
| 4 | **Arc Discharges** | 13 | Electric sparks (above ring) |
| 5 | **Sparks** | 14 | Particle effects (above arcs) |
| 6 | **Beads** | 15 | Traveling indicators (above sparks) |
| 7 | **Impacts (additive)** | 16 | Temporary hit effects |
| 8 | **Particles (Trail/Healing/Corruption)** | 17 | Ambient particle effects |

### Key Principles
1. **Uniform spacing:** Increment by 1 (no gaps)
2. **Clear hierarchy:** Lower = background, Higher = foreground
3. **No conflicts:** Unique renderOrder per layer
4. **Reasonable ceiling:** Stop at 17 (not 500)

---

## 🔍 EXECUTION LAYER AUDIT

### 1. Init/Update/Dispose Compliance

| System | Constructor | init() | update() | dispose() | Status |
|---------|-------------|---------|----------|-----------|--------|
| **LinkRendererConduit** | ✅ `constructor(scene)` | N/A | ✅ `update(link, dt, time)` | ✅ `dispose()` | ✅ |
| **LinkBeadSystem** | ✅ `constructor(link, maxBeads)` | N/A | ✅ `update(deltaTime, onArrival)` | ✅ `dispose()` | ✅ |
| **LinkBeadVisualizer** | ✅ `constructor(link, scene)` | N/A | ✅ `update(deltaTime, onArrival)` | ✅ `dispose()` | ✅ |
| **BeadRenderer** | ✅ `constructor(scene)` | N/A | ✅ `updateBeadPosition()` | N/A | ✅ |
| **LinkSparkSystem** | ✅ `constructor(scene, maxSparks)` | N/A | ✅ `update(visualTime, visualDelta, ...)` | ✅ `dispose()` | ✅ |
| **LinkBeadTrailSystem** | ✅ `constructor(scene)` | N/A | ✅ `update(visualTime, visualDelta, ...)` | ✅ `dispose()` | ✅ |
| **LinkPulseRing** | ✅ `constructor(scene)` | N/A | ✅ `update(curve, synergy, ...)` | ✅ `dispose()` | ✅ |
| **LinkEnergyWave** | N/A (static functions) | N/A | ✅ `update(strands, visualDelta, ...)` | N/A | ✅ |
| **LinkRingArcDischarges** | ✅ `constructor(scene)` | N/A | ✅ `update(mainCurve, ringProgress, ...)` | ✅ `dispose()` | ✅ |
| **LinkVisualStateAdapter** | N/A (class) | N/A | ✅ `update(link.group, harmonyLevel, ...)` | ✅ `dispose()` | ✅ |
| **LinkDirectionalStreaks** | ✅ `constructor(scene)` | ✅ `initialize(group, ...)` | ✅ `update(group, curve, ...)` | ✅ `dispose(state)` | ✅ |
| **LinkCorruptionParticleSystem** | ✅ `constructor(scene)` | N/A | ✅ `updateLinkParticles(link, deltaTime)` | ✅ `dispose()` | ✅ |
| **LinkCorruptionSpreadAnimator** | ✅ `constructor()` | ✅ `initializeLink(link)` | ✅ `update(link, visualDelta, strands)` | ✅ `disposeLinkAnimation(linkId)` | ✅ |
| **LinkCorruptionSpreadAnimator** (duplicate name?) | N/A | N/A | N/A | N/A | ⚠️ |
| **LinkTrailParticleSystem** | ✅ `constructor(scene, poolSize)` | N/A | ✅ `update(deltaTime, time)` | ✅ `dispose()` | ✅ |
| **LinkTrailEmitter** | ✅ `constructor(link, particleSystem)` | N/A | ✅ `update(deltaTime, time, ...)` | `disable()` | ✅ |
| **LinkHealingParticleSystem** | ✅ `constructor(scene, poolSize)` | N/A | ✅ `update(deltaTime, time)` | ✅ `dispose()` | ✅ |
| **LinkHealingEmitter** | ✅ `constructor(link, particleSystem)` | N/A | ✅ `update(deltaTime, time, ...)` | `disable()` | ✅ |
| **NodeInterferenceManager** | ✅ `constructor(scene)` | N/A | ✅ `update(links, harmony, ...)` | ✅ `dispose()` | ✅ |
| **NodeHarmonicManager** | ✅ `constructor(scene)` | N/A | ✅ `update(links, harmony, ...)` | ✅ `dispose()` | ✅ |

**Result:** ✅ All systems have proper lifecycle methods
**Note:** DirectionalStreaks has separate `initialize()` method called per-link

---

### 2. Scheduler Registration Audit

#### Main Entry Point (NodeLinkingSystem → FrameScheduler)
**File:** `main.js`  
**Registration:** Single frameScheduler entry for LinkRendererConduit

```javascript
// main.js, visual layer registration
reg('extremeLinkVisuals', (dt) => this.extremeLinkVisuals?.update?.(dt));
reg('extremeLinkVisuals4', (dt) => this.extremeLinkVisuals4?.update?.(dt, this.camera));
reg('linkVisualMoodSystem', (dt) => this.linkVisualMoodSystem?.update?.(dt));
// ...
```

#### LinkRendererConduit Update Chain
**File:** `NodeLinkingSystem.js`  
**Entry Point:** `update(deltaTime, time)` → calls `conduitRenderer.update(link, ...)`

**Flow:**
```
NodeLinkingSystem.update()
  └─> conduitRenderer.update(link, deltaTime, time)
       ├─> update(link) → creates/updates conduitState
       ├─> updateBeads()
       ├─> updateTrails()
       ├─> updateSparks()
       ├─> updatePulseRing()
       ├─> updateEnergyWave()
       ├─> updateArcDischarges()
       ├─> updateCorruptionParticles() (via updateLinkParticles)
       ├─> updateTrailParticles() (via emitter.update)
       ├─> updateHealingParticles() (via emitter.update)
       ├─> updateNodeInterference()
       ├─> updateNodeHarmony()
       ├─> updateCascadePropagation()
       ├─> updateDirectionalStreaks()
       └─> updateImpacts()
```

**Result:** ✅ All link effects run through FrameScheduler (via NodeLinkingSystem)
**No rogue updates found** – all effects are driven by the main update loop

---

### 3. Link ID System Audit

#### ID Generation (NodeLinkingSystem)
**File:** `NodeLinkingSystem.js`  
**Mechanism:** Deterministic counter

```javascript
// NodeLinkingSystem.js, constructor
this._linkIdCounter = 0;

// NodeLinkingSystem.js, createLink()
const linkId = `link-${this._linkIdCounter++}`;
const link = {
  id: linkId,
  // ...
};
```

**Result:** ✅ Link IDs are deterministic and unique (sequential: link-0, link-1, ...)

#### Link ID Fallback Issue
**File:** `LinkRendererConduit.js`  
**Line:** ~340

```javascript
const linkIdHash = (link.id || 'default').split('').reduce((h, c) => h * 31 + c.charCodeAt(0), 0);
```

**Problem:** Falls back to `'default'` if `link.id` is missing

**Impact:**
- Multiple links with ID=`'default'` → same hash → same visual behavior
- Non-deterministic variation between links

**Fix Required:**
```javascript
// LinkRendererConduit.js
// BEFORE:
const linkIdHash = (link.id || 'default').split('').reduce(...);

// AFTER:
const linkIdHash = (link.id || link.uuid || 'link-unknown').split('').reduce(...);
```

---

## 🎯 PROPOSED CHANGES

### Phase 1: Fix RenderOrder Conflicts

**Files to Modify:**
1. `LinkRendererConduit.js` (line ~280): `renderOrder: 9` → **9** (no change)
2. `LinkRendererConduit.js` (line ~220): `renderOrder: 10` → **10** (no change)
3. `LinkDirectionalStreaks.js` (line ~120): `renderOrder: 11` → **11** (no change)
4. `LinkPulseRing.js` (line ~45): `renderOrder: 11` → **12** (was conflicting)
5. `LinkRingArcDischarges.js` (line ~80): `renderOrder: 12` → **13** (was conflicting)
6. `LinkSparkSystem.js` (line ~60): `renderOrder: 12` → **14** (raise)
7. `LinkBeadSystem.js` (line ~240): `renderOrder: 120` → **15** (lower)
8. `LinkRendererConduit.js` (line ~480): `renderOrder: 40` → **16** (lower)
9. `LinkTrailParticleSystem.js` (line ~280): `renderOrder: 500` → **17** (lower)
10. `LinkCorruptionParticleSystem.js`: Add `renderOrder: 17` (set on pool group)
11. `LinkHealingParticleSystem.js`: Add `renderOrder: 17` (set on pool group)

### Phase 2: Fix Link ID Fallback

**File:** `LinkRendererConduit.js`  
**Line:** ~340

**Change:**
```javascript
// BEFORE:
const linkIdHash = (link.id || 'default').split('').reduce((h, c) => h * 31 + c.charCodeAt(0), 0);

// AFTER:
const linkIdHash = (link.id || link.uuid || `link-${Math.random().toString(36).substr(2, 9)}`).split('').reduce((h, c) => h * 31 + c.charCodeAt(0), 0);
```

### Phase 3: Unified RenderOrder Constants (Optional)

**New File:** `D:\ATOMA_CLEAN\LinkRenderOrder.js`

```javascript
/**
 * LINK RENDER ORDER CONSTANTS
 * Unified renderOrder hierarchy for all link visual layers
 */

export const LINK_RENDER_ORDER = {
  // Base layers
  SKIN_AURA: 9,
  STRANDS: 10,
  
  // Flow layers (above rope)
  DIRECTIONAL_STREAKS: 11,
  PULSE_RING: 12,
  ARC_DISCHARGES: 13,
  
  // Particle layers (above flow)
  SPARKS: 14,
  BEADS: 15,
  IMPACTS: 16,
  
  // Ambient particles
  TRAIL_PARTICLES: 17,
  HEALING_PARTICLES: 17,
  CORRUPTION_PARTICLES: 17,
};

export default LINK_RENDER_ORDER;
```

**Usage:**
```javascript
import { LINK_RENDER_ORDER } from './LinkRenderOrder.js';

// In LinkDirectionalStreaks
mesh.renderOrder = LINK_RENDER_ORDER.DIRECTIONAL_STREAKS;

// In LinkPulseRing
this.mesh.renderOrder = LINK_RENDER_ORDER.PULSE_RING;
```

---

## 📋 EXECUTION CHECKLIST

- [ ] **Phase 1:** Apply renderOrder changes (11 files)
  - [ ] LinkRendererConduit.js (strands, skin, impacts)
  - [ ] LinkDirectionalStreaks.js
  - [ ] LinkPulseRing.js (11 → 12)
  - [ ] LinkRingArcDischarges.js (12 → 13)
  - [ ] LinkSparkSystem.js (12 → 14)
  - [ ] LinkBeadSystem.js (120 → 15)
  - [ ] LinkTrailParticleSystem.js (500 → 17)
  - [ ] LinkCorruptionParticleSystem.js (add renderOrder: 17)
  - [ ] LinkHealingParticleSystem.js (add renderOrder: 17)

- [ ] **Phase 2:** Fix link ID fallback in LinkRendererConduit.js

- [ ] **Phase 3 (Optional):** Create unified LinkRenderOrder.js constants file

- [ ] **Verify:** No renderOrder conflicts (all values unique)
- [ ] **Verify:** Deterministic visual ordering (same draw order every frame)
- [ ] **Test:** Visual layering in-game (background → foreground correct)

---

## 🔗 REFERENCES

- **LinkRendererConduit.js** – Main conduit renderer
- **NodeLinkingSystem.js** – Link creation & lifecycle
- **LinkVisual & FX Map AUDIT.md** – Visual layer authority
- **Link FX Authority Map.md** – System responsibilities
- **LinkParticlesTODO.md** – Particle threshold investigation

---

**Next Action:** Execute Phase 1 (renderOrder fixes) to resolve conflicts.
