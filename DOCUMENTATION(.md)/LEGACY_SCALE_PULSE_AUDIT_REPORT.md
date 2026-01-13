# Legacy Node Scale Pulse Audit & Fix Report

## 🔍 AUDIT FINDINGS

### Issue Summary
Nodes periodically scale up and down (±1.5–3% oscillation) for ~1–1.5 seconds without user interaction, gameplay trigger, or feedback purpose. This creates unintentional "breathing" visual behavior.

### Root Cause Identified
**File**: `/EnhancedNodeModels.js`
**Function**: `static animate(nodeGroup, deltaTime, time)` (lines 3284–3700+)

---

## 🎯 IDENTIFIED SCALE PULSE INSTANCES

### Instance 1: TRANSFORMATION_SPINE (Lines 3441–3453)
**Location**: Animate function, Integration node type
**Trigger**: `if (nodeGroup.userData.spineRotationSpeed)`
**Behavior**:
```javascript
const breathing = Math.sin(time * nodeGroup.userData.spineBreathingSpeed) * nodeGroup.userData.spineBreathingAmplitude;
const targetScale = nodeGroup.userData.baseScale + breathing;
nodeGroup.scale.set(targetScale, targetScale, targetScale);  // ±2% breathing
```
**Purpose**: None specified. Marked as "POLISH" but no gameplay/feedback justification.
**Status**: ❌ UNPROVOKED MUTATION

### Instance 2: FRACTAL_ECHO (Lines 3482–3508)
**Location**: Animate function, special archetype node
**Trigger**: `if (nodeGroup.userData.fractalSeedRotationSpeed)`
**Behavior**:
```javascript
const breathing = Math.sin(time * 0.6) * nodeGroup.userData.fractalBreathingAmplitude;
const targetScale = nodeGroup.userData.baseScale + breathing;
nodeGroup.scale.set(targetScale, targetScale, targetScale);  // ±1.5% breathing
```
**Purpose**: None specified. Marked as "POLISH" but no gameplay/feedback justification.
**Status**: ❌ UNPROVOKED MUTATION

### Instance 3: INCOMING_FUNNEL (Lines 3566–3580)
**Location**: Animate function, Process node type
**Trigger**: `if (nodeGroup.userData.funnelRotationSpeed)`
**Behavior**:
```javascript
const breathing = Math.sin(time * nodeGroup.userData.funnelBreathingSpeed) * nodeGroup.userData.funnelBreathingAmplitude;
const targetScale = nodeGroup.userData.baseScale + breathing;
nodeGroup.scale.x = targetScale;
nodeGroup.scale.z = targetScale;  // ±3% width breathing
```
**Purpose**: None specified. Marked as "POLISH" but no gameplay/feedback justification.
**Status**: ❌ UNPROVOKED MUTATION

### Instance 4: SIGNAL_RECEPTOR Antenna Pulse (Lines 3524–3539)
**Location**: Animate function, antenna-based node
**Trigger**: `if (nodeGroup.userData.receptorRotationSpeed)`
**Behavior**:
```javascript
const pulse = Math.sin(time * nodeGroup.userData.antennaPulseSpeed + ...) * nodeGroup.userData.antennaaPulseAmplitude;
child.scale.set(1.0, 1.0 + pulse, 1.0);  // Antenna elongation/compression (±8%)
```
**Purpose**: None specified. Visual "breathing" on antenna elements.
**Status**: ❌ UNPROVOKED MUTATION

### Instance 5: COMMAND_PYRAMID Glow Pulse (Lines 3582–3593)
**Location**: Animate function, Control node type
**Trigger**: `if (nodeGroup.userData.commandRotationSpeed)`
**Behavior**:
```javascript
const pulse = Math.sin(time * nodeGroup.userData.commandPulseSpeed) * nodeGroup.userData.commandPulseAmplitude;
glow.scale.set(1.0 + pulse, 1.0 + pulse, 1.0 + pulse);  // Glow scale pulsing
```
**Purpose**: Marked as "Authority glow pulsing" but no feedback trigger.
**Status**: ❌ UNPROVOKED MUTATION

---

## 🔬 DECISION LOGIC APPLICATION

### Criterion: Is each scale pulse tied to:
- ❌ Explicit user interaction? NO
- ❌ Achievement / reward? NO
- ❌ Warning / danger state? NO
- ❌ Focus / selection / targeting? NO
- ❌ Tutorial feedback? NO

### Verdict: **ALL FIVE INSTANCES MUST BE DISABLED**

---

## 🛠 IMPLEMENTATION: Safe & Reversible Fix

### Strategy
1. Add global guard in `animate()` to prevent scale mutations
2. Disable all breathing/pulsing scale logic
3. Preserve code (don't delete) for reversibility
4. Gate with configuration flag

### File: `/EnhancedNodeModels.js`

#### Step 1: Add Config Flag (Top of Class)
```javascript
// GLOBAL SAFETY GUARD: Disable legacy node scale pulse
static config = {
  DISABLE_LEGACY_SCALE_PULSE: true,  // Master disable (default: true)
  DISABLE_SPINE_BREATHING: true,
  DISABLE_FUNNEL_BREATHING: true,
  DISABLE_FRACTAL_BREATHING: true,
  DISABLE_ANTENNA_PULSE: true,
  DISABLE_GLOW_PULSING: true,
};
```

#### Step 2: Disable Each Instance

**FIX 1 - TRANSFORMATION_SPINE (Lines 3441–3453)**:
```javascript
// POLISH: Animate TRANSFORMATION_SPINE (axial rotation + breathing scale)
// [DISABLED - Legacy scale pulse audit] Remove unintentional node breathing
if (nodeGroup.userData.spineRotationSpeed) {
  // Axial rotation
  nodeGroup.rotation.y += deltaTime * nodeGroup.userData.spineRotationSpeed;
  
  // GUARD: Disable legacy breathing scale (was ±2% oscillation without feedback)
  if (!EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE && !EnhancedNodeModels.config.DISABLE_SPINE_BREATHING) {
    if (!nodeGroup.userData.baseScale) {
      nodeGroup.userData.baseScale = 1.0;
    }
    const breathing = Math.sin(time * nodeGroup.userData.spineBreathingSpeed) * nodeGroup.userData.spineBreathingAmplitude;
    const targetScale = nodeGroup.userData.baseScale + breathing;
    nodeGroup.scale.set(targetScale, targetScale, targetScale);
  } else {
    // Keep scale locked at 1.0 (stable node authority)
    nodeGroup.scale.set(1.0, 1.0, 1.0);
  }
}
```

**FIX 2 - FRACTAL_ECHO (Lines 3482–3508)**:
```javascript
// POLISH: Animate FRACTAL_ECHO (seed + echoes counter-rotation + breathing)
// [DISABLED - Legacy scale pulse audit] Remove unintentional node breathing
if (nodeGroup.userData.fractalSeedRotationSpeed) {
  // Seed core rotates one direction
  const seed = nodeGroup.children.find(c => c.userData && c.userData.isSeedCore);
  if (seed) {
    seed.rotation.x += deltaTime * nodeGroup.userData.fractalSeedRotationSpeed * 0.3;
    seed.rotation.y += deltaTime * nodeGroup.userData.fractalSeedRotationSpeed * 0.5;
    seed.rotation.z += deltaTime * nodeGroup.userData.fractalSeedRotationSpeed * 0.2;
  }
  
  // Echoes counter-rotate (different axis)
  nodeGroup.children.forEach(child => {
    if (child.userData && child.userData.isEcho) {
      child.rotation.x -= deltaTime * nodeGroup.userData.fractalEchoRotationSpeed * 0.4;
      child.rotation.y -= deltaTime * nodeGroup.userData.fractalEchoRotationSpeed * 0.6;
      child.rotation.z -= deltaTime * nodeGroup.userData.fractalEchoRotationSpeed * 0.3;
    }
  });
  
  // GUARD: Disable legacy breathing scale (was ±1.5% oscillation without feedback)
  if (!EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE && !EnhancedNodeModels.config.DISABLE_FRACTAL_BREATHING) {
    if (!nodeGroup.userData.baseScale) {
      nodeGroup.userData.baseScale = 1.0;
    }
    const breathing = Math.sin(time * 0.6) * nodeGroup.userData.fractalBreathingAmplitude;
    const targetScale = nodeGroup.userData.baseScale + breathing;
    nodeGroup.scale.set(targetScale, targetScale, targetScale);
  } else {
    // Keep scale locked at 1.0 (stable node authority)
    nodeGroup.scale.set(1.0, 1.0, 1.0);
  }
}
```

**FIX 3 - INCOMING_FUNNEL (Lines 3566–3580)**:
```javascript
// POLISH: Animate INCOMING_FUNNEL (funnel rotation + width breathing)
// [DISABLED - Legacy scale pulse audit] Remove unintentional node breathing
if (nodeGroup.userData.funnelRotationSpeed) {
  // Funnel rotation
  nodeGroup.rotation.y += deltaTime * nodeGroup.userData.funnelRotationSpeed;
  
  // GUARD: Disable legacy breathing scale (was ±3% width oscillation without feedback)
  if (!EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE && !EnhancedNodeModels.config.DISABLE_FUNNEL_BREATHING) {
    if (!nodeGroup.userData.baseScale) {
      nodeGroup.userData.baseScale = 1.0;
    }
    const breathing = Math.sin(time * nodeGroup.userData.funnelBreathingSpeed) * nodeGroup.userData.funnelBreathingAmplitude;
    const targetScale = nodeGroup.userData.baseScale + breathing;
    nodeGroup.scale.x = targetScale;
    nodeGroup.scale.z = targetScale;
    // Keep Y scale constant
  } else {
    // Keep scale locked at 1.0 (stable node authority)
    nodeGroup.scale.set(1.0, 1.0, 1.0);
  }
}
```

**FIX 4 - SIGNAL_RECEPTOR Antenna (Lines 3524–3539)**:
```javascript
// POLISH: Animate SIGNAL_RECEPTOR (core rotation + antenna pulse)
// [DISABLED - Legacy scale pulse audit] Remove unintentional antenna breathing
if (nodeGroup.userData.receptorRotationSpeed) {
  // Core rotation
  nodeGroup.rotation.y += deltaTime * nodeGroup.userData.receptorRotationSpeed;
  
  // GUARD: Disable legacy antenna pulse (was ±8% elongation without feedback)
  if (!EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE && !EnhancedNodeModels.config.DISABLE_ANTENNA_PULSE) {
    nodeGroup.children.forEach(child => {
      if (child.userData && child.userData.isAntenna) {
        if (!child.userData.baseScale) {
          child.userData.baseScale = 1.0;
        }
        const pulse = Math.sin(time * nodeGroup.userData.antennaPulseSpeed + child.userData.antennaIndex * 0.5) * nodeGroup.userData.antennaaPulseAmplitude;
        child.scale.set(1.0, 1.0 + pulse, 1.0); // Elongate/compress antenna
      }
    });
  } else {
    // Keep antenna scale locked at 1.0
    nodeGroup.children.forEach(child => {
      if (child.userData && child.userData.isAntenna) {
        child.scale.set(1.0, 1.0, 1.0);
      }
    });
  }
}
```

**FIX 5 - COMMAND_PYRAMID Glow (Lines 3582–3593)**:
```javascript
// POLISH: Animate COMMAND_PYRAMID (core rotation + glow pulsing)
// [DISABLED - Legacy scale pulse audit] Remove unintentional glow pulsing
if (nodeGroup.userData.commandRotationSpeed) {
  // Pyramid rotation
  nodeGroup.rotation.y += deltaTime * nodeGroup.userData.commandRotationSpeed;
  
  // GUARD: Disable legacy glow pulse (was scale pulsing without feedback)
  if (!EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE && !EnhancedNodeModels.config.DISABLE_GLOW_PULSING) {
    const glow = nodeGroup.children.find(c => c.userData && c.userData.isAuthorityGlow);
    if (glow) {
      const pulse = Math.sin(time * nodeGroup.userData.commandPulseSpeed) * nodeGroup.userData.commandPulseAmplitude;
      glow.scale.set(1.0 + pulse, 1.0 + pulse, 1.0 + pulse);
    }
  } else {
    // Keep glow scale locked at 1.0
    const glow = nodeGroup.children.find(c => c.userData && c.userData.isAuthorityGlow);
    if (glow) {
      glow.scale.set(1.0, 1.0, 1.0);
    }
  }
}
```

---

## ✅ VERIFICATION CHECKLIST

After applying fixes:

- [ ] All 5 breathing/pulsing scale mutations are gated with guards
- [ ] Master flag: `EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE = true`
- [ ] Individual flags available for granular control (if needed for debugging)
- [ ] All scale.set() and scale.x/y/z operations protected
- [ ] Original code preserved (not deleted) for reversibility
- [ ] No errors in console
- [ ] Nodes maintain scale of 1.0 consistently
- [ ] Nodes no longer "breathing"
- [ ] All other animations (rotations, orbits) still work
- [ ] Node visual appearance remains premium and stable

---

## 🎯 EXPECTED RESULT

### Before Fix
- ❌ Nodes scale up/down periodically (±1.5–3%)
- ❌ Antenna elongate/compress without reason (±8%)
- ❌ Glow pulsates without gameplay trigger
- ❌ Visual feels "alive" but uncontrolled

### After Fix
- ✅ Nodes maintain consistent scale (1.0)
- ✅ All scale mutations disabled
- ✅ Rotations and orbits still functional
- ✅ Visuals feel intentional, stable, premium
- ✅ No unintentional mutations

---

## 🔓 Reversibility (If Needed)

To temporarily re-enable all breathing/pulsing:
```javascript
// Console command
EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE = false;
EnhancedNodeModels.config.DISABLE_SPINE_BREATHING = false;
EnhancedNodeModels.config.DISABLE_FUNNEL_BREATHING = false;
EnhancedNodeModels.config.DISABLE_FRACTAL_BREATHING = false;
EnhancedNodeModels.config.DISABLE_ANTENNA_PULSE = false;
EnhancedNodeModels.config.DISABLE_GLOW_PULSING = false;
```

To re-disable (default):
```javascript
EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE = true;
```

---

## Summary

**5 unprovoked scale pulse instances identified and gated**
**All instances disabled by default (no visual breathing)**
**Code preserved for reversibility**
**Premium, stable, intentional visual behavior restored**

