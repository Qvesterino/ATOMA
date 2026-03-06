# CascadeIntensity - Missing Link Analysis

**Date:** 2026-03-06  
**Problem:** cascadeIntensity parameter is referenced but not created or calculated

---

## What is cascadeIntensity?

From CascadeParticleSystem_Session120:
```javascript
const intensity = link.userData.cascadeIntensity ?? 0;

if (intensity < 0.1 && boost <= 1.0) {
    continue; // Skip inactive links
}

// Emission rate based on intensity
const rate = this.config.emissionRate * 10 * boost * intensity * densityMultiplier;
```

**Usage:**
- **Type:** Number (0-1 range)
- **Purpose:** Controls particle emission rate on links
- **Threshold:** intensity < 0.1 → no particles
- **Formula:** emissionRate = baseRate * boost * intensity * densityMultiplier

---

## Where is it used?

### Used In:

1. **CascadeParticleSystem_Session120.js** ✅
   - Line ~270: `const intensity = link.userData.cascadeIntensity ?? 0;`
   - Purpose: Determine if particles should emit on link

### NOT Found In:

- ❌ main.js
- ❌ NodeLinkingSystem.js
- ❌ LinkRendererConduit.js
- ❌ LinkSparkSystem.js
- ❌ CascadingRuptureSystem.js
- ❌ CascadeResonanceWaveVisualization_Session146.js
- ❌ ResonanceCascadeVisualization_Session117B.js
- ❌ All LinkMetrics systems
- ❌ All LinkVisual systems
- ❌ All LinkQuality systems
- ❌ All LinkCorruption systems

---

## Problem: cascadeIntensity is NOT Created or Calculated

### Expected Behavior

`link.userData.cascadeIntensity` should be set by some system based on:

1. **Cascade propagation** - CascadingRuptureSystem should set intensity based on active cascades
2. **Corruption levels** - LinkCorruptionTransmission should set intensity based on corruption
3. **Conflict detection** - Conflict system should set intensity based on conflict
4. **Link metrics** - LinkMetrics should set intensity based on quality/harmony/corruption

### Actual Behavior

`link.userData.cascadeIntensity` is **NEVER SET** → Always defaults to 0 → **NO PARTICLES EMIT**

---

## Why Are There No Visible Cascade Particles?

**Root Cause:** `cascadeIntensity` is undefined (defaults to 0)

**Result:**
```javascript
const intensity = link.userData.cascadeIntensity ?? 0;  // Always 0

if (intensity < 0.1 && boost <= 1.0) {
    continue;  // Always skipped!
}
```

**Explanation:** CascadeParticleSystem_Session120 checks `cascadeIntensity` and `cascadeParticleEmissionBoost`. If both are low (intensity < 0.1 AND boost <= 1.0), particle emission is skipped.

**Default Values:**
- `cascadeIntensity` = 0 (undefined → defaults to 0)
- `cascadeParticleEmissionBoost` = 1.0 (undefined → defaults to 1.0)

**Result:** All links are skipped → No particles visible

---

## Missing Integration

### 1. CascadingRuptureSystem Should Set cascadeIntensity

**Expected:** When cascade triggers, set intensity on affected links

**Missing:** CascadingRuptureSystem does NOT set cascadeIntensity

**Should Add:**
```javascript
// In CascadingRuptureSystem.triggerRupture(nodeId)
function onCascadeHop(sourceNode, targetNode, link) {
    // Set cascade intensity on link
    const intensity = cascadeEnergy * decay;
    link.userData.cascadeIntensity = intensity;  // ← MISSING
    
    // Set conflict type
    link.userData.cascadeConflictType = 'destructive';
    
    // Set boost
    link.userData.cascadeParticleEmissionBoost = 1.0 + intensity;
}
```

### 2. LinkCorruptionTransmission Should Set cascadeIntensity

**Expected:** When corruption spreads, set intensity on affected links

**Missing:** LinkCorruptionTransmission does NOT set cascadeIntensity

**Should Add:**
```javascript
// In LinkCorruptionTransmission
function onCorruptionSpread(sourceNode, targetNode, link, corruptionLevel) {
    // Set cascade intensity based on corruption
    link.userData.cascadeIntensity = corruptionLevel;  // ← MISSING
    
    // Set conflict type
    link.userData.cascadeConflictType = 'corruption';
    
    // Set boost
    link.userData.cascadeParticleEmissionBoost = 1.0 + corruptionLevel;
}
```

### 3. LinkMetrics Should Calculate cascadeIntensity

**Expected:** LinkMetrics should calculate intensity based on link quality/harmony/corruption

**Missing:** LinkMetrics does NOT calculate cascadeIntensity

**Should Add:**
```javascript
// In LinkMetrics.update(link)
function calculateCascadeIntensity(link) {
    // Combine quality, harmony, corruption into intensity
    const quality = link.userData.quality ?? 1.0;
    const harmony = link.userData.harmony ?? 0.5;
    const corruption = link.userData.corruption ?? 0.0;
    
    // Higher quality + harmony → lower intensity
    // Higher corruption → higher intensity
    const intensity = corruption + (1.0 - quality) * (1.0 - harmony);
    
    // Clamp to 0-1
    link.userData.cascadeIntensity = Math.max(0, Math.min(1, intensity));  // ← MISSING
}
```

---

## Temporary Fix (For Testing)

To test CascadeParticleSystem_Session120 without full integration, manually set cascadeIntensity:

```javascript
// Test all links
window.game.linkingSystem.links.forEach(link => {
    link.userData.cascadeIntensity = 0.8; // Set intensity
    link.userData.cascadeConflictType = 'destructive';
    link.userData.cascadeParticleColor = new THREE.Color(1, 0.5, 0);
    link.userData.cascadeParticleEmissionBoost = 2.0;
});

// Wait a few seconds
// Should see particles flowing along all links

// Test single link
const link = window.game.linkingSystem.links[0];
if (link) {
    link.userData.cascadeIntensity = 1.0;
    link.userData.cascadeConflictType = 'destructive';
    link.userData.cascadeParticleColor = new THREE.Color(1, 0, 0);
}
```

---

## Required Integration

### Option 1: LinkMetrics Calculates cascadeIntensity (RECOMMENDED)

**File:** LinkQualityCalculator.js or LinkMetrics.js

**Add:**
```javascript
function calculateCascadeIntensity(link) {
    const quality = link.userData.quality ?? 1.0;
    const harmony = link.userData.harmony ?? 0.5;
    const corruption = link.userData.corruption ?? 0.0;
    
    // Intensity = corruption + (1 - quality) * (1 - harmony)
    const intensity = corruption + (1.0 - quality) * (1.0 - harmony);
    
    link.userData.cascadeIntensity = Math.max(0, Math.min(1, intensity));
    
    return intensity;
}
```

**Update Loop:** Call this function every frame for all links

---

### Option 2: CascadingRuptureSystem Sets cascadeIntensity (CASCADE EVENTS)

**File:** CascadingRuptureSystem.js

**Add:**
```javascript
function onCascadeHop(sourceNodeId, targetNodeId, linkId, cascadeData) {
    const link = this.linkingSystem.getLink(linkId);
    if (!link) return;
    
    // Set cascade intensity from cascade data
    link.userData.cascadeIntensity = cascadeData.intensity ?? 0.8;
    link.userData.cascadeConflictType = cascadeData.type ?? 'destructive';
    link.userData.cascadeParticleEmissionBoost = cascadeData.boost ?? 2.0;
}
```

**Trigger:** Call this function when cascade hops between nodes

---

### Option 3: Simple Constant Intensity (FOR TESTING ONLY)

**File:** main.js (in update loop)

**Add:**
```javascript
this.frameScheduler.register('visual', (dt) => {
    // Set constant intensity for testing
    for (const link of this.linkingSystem.links) {
        if (link.userData.cascadeIntensity === undefined) {
            link.userData.cascadeIntensity = 0.5; // Default intensity
        }
    }
}, 'visual.setCascadeIntensity');
```

**Note:** This is NOT a production solution, just for testing visibility

---

## Summary

| Question | Answer | Status |
|----------|--------|--------|
| **Čo je cascadeIntensity?** | Number (0-1) controlling particle emission rate | ✅ CONFIRMED |
| **Na čo je napojené?** | CascadeParticleSystem_Session120 (reads it) | ✅ CONFIRMED |
| **Kde sa vytvára?** | ❌ NOWHERE - NOT CREATED | ❌ MISSING |
| **Ako sa počíta?** | ❌ NEVER - NOT CALCULATED | ❌ MISSING |
| **Čo to robí?** | Controls particle emission intensity on links (threshold: <0.1 = no particles) | ✅ CONFIRMED |

---

## Root Cause Analysis

**Why are there no visible cascade particles?**

1. ✅ CascadeParticleSystem_Session120 is active and updating
2. ✅ Update loop calls `_spawnParticles()` for all links
3. ❌ `link.userData.cascadeIntensity` is NEVER SET (always undefined → defaults to 0)
4. ❌ Condition `intensity < 0.1 && boost <= 1.0` is ALWAYS TRUE (intensity = 0, boost = 1.0)
5. ❌ Particle emission is SKIPPED for all links
6. ❌ NO PARTICLES VISIBLE

---

## Action Items

### Immediate (Testing)
1. ✅ **Manual test**: Set cascadeIntensity manually on links
2. ⏭️ **Option 3**: Add constant intensity in main.js for testing

### Short-term (Integration)
1. ⏭️ **Option 1**: Add calculateCascadeIntensity() to LinkMetrics
2. ⏭️ **Option 2**: Add onCascadeHop() to CascadingRuptureSystem
3. ⏭️ Integrate LinkCorruptionTransmission with cascadeIntensity

### Long-term (Architecture)
1. ⏭️ Document cascadeIntensity calculation in LinkMetrics
2. ⏭️ Create event system for cascade intensity updates
3. ⏭️ Integrate all cascade systems with unified intensity calculation

---

## Debug Commands

```javascript
// Check cascadeIntensity on all links
window.game.linkingSystem.links.forEach(link => {
    const intensity = link.userData.cascadeIntensity;
    const boost = link.userData.cascadeParticleEmissionBoost;
    console.log(`Link ${link.id}: intensity=${intensity}, boost=${boost}`);
});

// Set cascadeIntensity manually (testing)
window.game.linkingSystem.links.forEach(link => {
    link.userData.cascadeIntensity = 0.8;
    link.userData.cascadeConflictType = 'destructive';
    link.userData.cascadeParticleColor = new THREE.Color(1, 0.5, 0);
    link.userData.cascadeParticleEmissionBoost = 2.0;
});

// Check particle emission
console.log('Active particles:', window.game.cascadeParticleSystem.activeCount);
console.log('Should be > 0 after setting cascadeIntensity');
```

---

## Conclusion

**cascadeIntensity is a missing link** in the cascade particle system integration.

- It is **used** by CascadeParticleSystem_Session120
- It is **NOT created** by any system
- It is **NOT calculated** by any system
- Result: **NO PARTICLES VISIBLE**

**Required:** Integrate cascadeIntensity calculation into LinkMetrics or CascadingRuptureSystem

---

**Status:** ❌ MISSING INTEGRATION - cascadeIntensity not created/calculated

**Action Required:** Add calculateCascadeIntensity() to LinkMetrics or set cascadeIntensity in cascade events
