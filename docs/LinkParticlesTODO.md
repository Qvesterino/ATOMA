# Link Particles TODO
## Particle Visibility & Metrics Investigation

**Created:** 2026-03-02  
**Context:** Particle systems (Corruption, Healing, Trail, Spark) are not visible in normal gameplay  
**Root Cause:** High emission thresholds require extreme metric values

---

## ✅ CONFIRMED: All 8 Systems EXIST & RUN

Based on audit of `LinkRendererConduit.js`, all systems are initialized:

| System | File | Status | Visual Visibility |
|---------|-------|--------|-------------------|
| **LinkBeadSystem** | `LinkBeadSystem.js` | ✅ Running | ✅ Visible (beads move) |
| **LinkSparkSystem** | `LinkSparkSystem.js` | ✅ Running | ❓ Unclear (very subtle) |
| **LinkBeadTrailSystem** | `LinkBeadTrailSystem.js` | ✅ Running | ❓ Unclear |
| **LinkPulseRing** | `LinkPulseRing.js` | ✅ Running | ✅ Visible |
| **LinkEnergyWave** | `LinkEnergyWave.js` | ✅ Running | ✅ Visible |
| **LinkRingArcDischarges** | `LinkRingArcDischarges.js` | ✅ Running | ✅ Visible |
| **LinkCorruptionParticleSystem** | `LinkCorruptionParticleSystem.js` | ✅ Running | ❌ **NOT VISIBLE** |
| **LinkHealingParticleSystem** | `LinkHealingParticleSystem.js` | ✅ Running | ❌ **NOT VISIBLE** |
| **LinkTrailParticleSystem** | `LinkTrailParticleSystem.js` | ✅ Running | ❌ **NOT VISIBLE** |

---

## ⚠️ ROOT CAUSE: METRIC THRESHOLDS TOO HIGH

Particle systems only emit when metrics exceed thresholds set during initialization.

### 1. LinkCorruptionParticleSystem

**File:** `LinkCorruptionParticleSystem.js` (line ~50-70)

```javascript
this.config = {
  emissionStartThreshold: 0.2,      // ❌ 20% corruption required
  baseEmissionRate: 15,             // 15 particles/sec at 100% corruption
  maxEmissionRate: 50,              // Cap: 50 particles/sec
  // ...
};
```

**Problem:**
- Corruption level rarely exceeds 20% in normal gameplay
- At 20% corruption → only ~3 particles/sec (barely visible)

**Debug:**
```javascript
// Check current corruption levels
window.game.linkingSystem.links.forEach(link => {
  console.log(link.id, 'corruption:', link.corruptionLevel ?? link.corruption ?? 0);
});
```

**Proposed Fix (Phase 2):**
```javascript
emissionStartThreshold: 0.05,  // ↓ 20% → 5%
baseEmissionRate: 25,            // ↑ 15 → 25
```

---

### 2. LinkHealingParticleSystem

**File:** `LinkHealingParticleSystem.js` (line ~370, emitter class)

```javascript
this.harmonyThreshold = 0.6; // ❌ 60% harmony required
this.baseEmissionRate = 15;    // 15 particles/sec at 100% harmony
```

**Problem:**
- Harmony rarely exceeds 60% in normal gameplay
- At 60% harmony → minimal emission (if any)

**Debug:**
```javascript
// Check current harmony levels
window.game.linkingSystem.links.forEach(link => {
  console.log(link.id, 'harmony:', link.harmonyLevel ?? link.harmony ?? 0);
});
```

**Proposed Fix (Phase 2):**
```javascript
harmonyThreshold = 0.3,   // ↓ 60% → 30%
baseEmissionRate = 25;      // ↑ 15 → 25
```

---

### 3. LinkTrailParticleSystem

**File:** `LinkTrailParticleSystem.js` (line ~330, emitter class)

```javascript
this.emissionRate = 20; // ❌ 20 particles/sec = ~0.3 particles/frame at 60 FPS
```

**Modulation (from emitter update):**
```javascript
rate *= 0.6 + harmony * 0.4;        // Harmony reduces: 20 × [0.6, 1.0] = 12-20
rate *= 1.0 + corruption * 0.8;      // Corruption boosts: × [1.0, 1.8]
```

**Result:**
- Idle state (harmony=0.5, corruption=0.0): **12 particles/sec** (0.2/frame)
- High corruption state: **21.6 particles/sec** (0.36/frame)

**Problem:**
- 0.2 particles/frame is very hard to see visually
- Particles are small (0.06 scale) and subtle

**Proposed Fix (Phase 2):**
```javascript
emissionRate = 40;  // ↑ 20 → 40 (double visibility)
```

---

### 4. LinkSparkSystem

**File:** `LinkSparkSystem.js` (partial read only)

**Known Behavior (from docs/audits):**
- GPU-based shader particle system
- Spawns only during "high activity" (synergy + traffic)
- Very subtle by design (tertiary visual layer)

**Status:**
- Unclear if visible at all
- Need to check `sparksIntensity` from VFX input

**Debug:**
```javascript
// Check spark intensity
const vfx = window.game.linkingSystem.visuals.computeLinkVfxInput(frameState);
console.log('sparksIntensity:', vfx.sparksIntensity);
```

---

## 🎯 TWO-PHASE FIX PLAN

### PHASE 1: AUDIT METRICS

**Goal:** Confirm actual metric values in normal gameplay

**Steps:**
1. Enable debug logging for particle systems
2. Monitor typical values for:
   - `link.corruptionLevel` / `link.corruption`
   - `link.harmonyLevel` / `link.harmony`
   - `link.synergyScore`
   - `link.traffic.load`
3. Determine realistic ranges (min, 5th, 25th, median, 75th, 95th, max)
4. Adjust thresholds based on actual data

**Debug Commands:**
```javascript
// Sample all link metrics
function sampleLinkMetrics() {
  const metrics = {
    corruption: [],
    harmony: [],
    synergy: [],
    traffic: []
  };
  
  window.game.linkingSystem.links.forEach(link => {
    metrics.corruption.push(link.corruptionLevel ?? link.corruption ?? 0);
    metrics.harmony.push(link.harmonyLevel ?? link.harmony ?? 0);
    metrics.synergy.push(link.synergyScore ?? link.synergy ?? 0);
    metrics.traffic.push(link.traffic?.load ?? 0);
  });
  
  console.table({
    corruption: {
      min: Math.min(...metrics.corruption),
      max: Math.max(...metrics.corruption),
      avg: metrics.corruption.reduce((a,b) => a+b) / metrics.corruption.length
    },
    // ... repeat for harmony, synergy, traffic
  });
}

sampleLinkMetrics();
```

**Output Needed:**
- Typical corruption range in normal state
- Typical harmony range in normal state
- Whether corruption/harmony ever exceed current thresholds (0.2 / 0.6)

---

### PHASE 2: ADJUST THRESHOLDS

**Goal:** Make particle effects visible in normal gameplay

**If metrics confirm thresholds are too high:**

1. **Corruption Threshold:** 0.2 → 0.05
2. **Healing Threshold:** 0.6 → 0.3
3. **Trail Emission Rate:** 20 → 40
4. **Corruption Emission Rate:** 15 → 25
5. **Healing Emission Rate:** 15 → 25

**Files to Modify:**
- `LinkCorruptionParticleSystem.js` (lines 53-54)
- `LinkHealingEmitter` class in `LinkHealingParticleSystem.js` (line ~373)
- `LinkTrailEmitter` class in `LinkTrailParticleSystem.js` (line ~330)

---

## 📝 NOTES

### Visual Design Intent (from comments)

- **Corruption Particles:** Red particles flowing source → target, visualizing corruption spread
- **Healing Particles:** Blue/cyan particles flowing target → source (reverse flow), visualizing harmony
- **Trail Particles:** Organic flow along links, using same noise as aura systems
- **Sparks:** Subtle micro-friction/tension indicators, tertiary layer

### Current Behavior

| System | Design Intent | Actual Behavior |
|--------|---------------|-----------------|
| Corruption | Visualize corruption spread | ❌ Never emits (corruption < 20%) |
| Healing | Visualize harmony restoration | ❌ Never emits (harmony < 60%) |
| Trail | Organic flow visualizer | ❌ Barely visible (0.2-0.4 particles/frame) |
| Sparks | Subtle tension indicators | ❓ Unknown (need debug) |

---

## 🔗 REFERENCES

- Audit: `LINK_RENDERER_CONDUIT_MATERIAL_LIFECYCLE_AUDIT.md` (material creation patterns)
- Audit: `LINK VISUAL & FX MAP AUDIT.md` (visual layer authority)
- Audit: `LINK FX AUTHORITY MAP.md` (system responsibilities)
- Files:
  - `LinkCorruptionParticleSystem.js`
  - `LinkHealingParticleSystem.js`
  - `LinkTrailParticleSystem.js`
  - `LinkSparkSystem.js`
  - `LinkBeadSystem.js` (reference: working system)

---

## ✅ CHECKLIST

- [ ] Phase 1: Run debug metrics audit
- [ ] Confirm typical metric ranges
- [ ] Determine if thresholds are genuinely too high
- [ ] Phase 2: Adjust thresholds if confirmed
- [ ] Test particle visibility after changes
- [ ] Validate no performance regression

---

**Next Action:** Run Phase 1 metrics audit to confirm threshold assumptions.
