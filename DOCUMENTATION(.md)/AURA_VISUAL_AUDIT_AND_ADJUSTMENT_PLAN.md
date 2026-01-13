# Node Aura Visual Audit & Adjustment Plan

## 🎯 GOAL

Prevent node auras from visually overpowering core node geometry while maintaining aura feedback system integrity.

---

## 📊 AUDIT FINDINGS

### Current Aura System Architecture

The node visual system comprises **multiple aura layers**:

#### 1. **Core Layers** (Protected, immutable)
- **Core Identity Mesh**: The actual node geometry (cone, sphere, etc.)
- **Hologram Shell**: Shader-based overlay (icosphere with grid patterns)
- **Render Order**: Core = 0, Shell = 5

#### 2. **Aura/Glow Layers** (Currently too dominant)
- **vfxGlow**: Large glowing sphere/torus
  - Current: `opacity = 0.8` max
  - Issue: Completely obscures core geometry
  
- **vfxHalo**: Secondary halo ring
  - Current: `opacity = 0.08-0.12` (already reduced)
  - Status: ✅ Acceptable range
  
- **vfxRings**: Orbit rings around node
  - Current: Varies, but typically `0.2-0.4`
  - Status: Moderate, not dominant
  
- **Render Order**: Aura = 10 (renders in front)

#### 3. **UI Aura Overlays** (Selection highlighting)
- **PrimaryNodeAura**: Ring highlight for linking
  - Outer ring: `opacity = 0.6` 
  - Inner pulse: `opacity = 0.3`
  - Status: ⚠️ Still visible despite clamps

#### 4. **Opacity Clamping System** (Existing mitigation)
- **GlobalAuraOpacityClamp**:
  - Current max: `0.06` (6%)
  - Status: ✅ Already reduced, but not universal

---

## 🔴 PROBLEM ANALYSIS

### Visual Dominance Issue

**Current Rendering Order**:
```
Background
  ↓
Link Connections
  ↓
Core Node Mesh (Opacity: 1.0, opaque)
  ↓
Hologram Shell (Opacity: 0.4, overlay shader)
  ↓
VFX Glow/Halo (Opacity: 0.8-1.0, DOMINANT) ← PROBLEM
  ↓
UI Aura Rings (Opacity: 0.3-0.6, secondary problem)
  ↓
Particles/Effects
```

### Why Core is Hard to See

1. **VFX Glow Too Opaque**: `0.8` opacity makes glow nearly opaque
2. **Large Scale**: Glow sphere 2-3× core size
3. **Additive Blending**: Glow adds light, not replaces (compounds issue)
4. **Render Order**: Aura renders after core (`renderOrder: 10` vs `0`)
5. **Insufficient Separation**: Core not visually distinct from aura

---

## ✅ SOLUTION STRATEGY

### Constraints to Apply (Per Instructions)

**1. Lower Aura Opacity Globally** (0.12-0.25 safe range)
- Reduce from current 0.8 to **0.15-0.20** range
- Maintain visual feedback without occlusion
- Apply universally to all aura types

**2. Ensure Aura Renders Behind Core** 
- Currently: renderOrder 10 (in front) - **WRONG**
- Fix: renderOrder -1 (behind) or use depthTest/Write
- Hologram shell acts as visual transition layer

**3. Prevent Aura Solid Fill**
- Don't fill entire volume
- Favor edge/rim visibility
- Use rim-glow shader approach (fresnel effect)

**4. Core Must Remain Readable**
- Core geometry always fully visible
- No visual interference from aura
- Clear visual hierarchy

---

## 📋 FILES TO MODIFY

### 1. **AINodes.js** (Line ~1074-1087)
**Current Issue**: VFX glow and halo breathing not clamped enough

**Changes Needed**:
- `vfxGlow.material.opacity`: Reduce from `0.8` to `0.15`
- `vfxHalo.material.opacity`: Keep at `0.08-0.12` (already good)
- Add `renderOrder = -1` to push behind core

### 2. **GlobalAuraOpacityClamp.js** (Line 28)
**Current Issue**: `maxAuraOpacity: 0.06` not applied universally

**Changes Needed**:
- Increase to `0.18` (higher for safety but still dim)
- Verify detection catches all aura types
- Ensure runs at startup

### 3. **AuraModulationSystem.js** (Lines 51-73)
**Current Issue**: Animation curves allow too-high opacity

**Changes Needed**:
- `opacity_pulse.max`: Reduce from `0.5` to `0.20`
- `scale_swell.max`: Keep at `1.08` (already safe)
- `glow_intensity.max`: Reduce from `1.2` to `0.8`

### 4. **CoreHologramShader.js** (Line 60)
**Current Issue**: Shell opacity `0.4` + glow `0.8` stacks too high

**Changes Needed**:
- Shell opacity already at `0.4` - acceptable
- Focus on reducing glow instead

### 5. **_UIPrimaryNodeAura3_7.js** (Lines 93-117)
**Current Issue**: Ring opacity `0.6` and pulse `0.3` still visible

**Changes Needed**:
- Ring opacity: Reduce from `0.6` to `0.20`
- Pulse opacity: Reduce from `0.3` to `0.12`
- Add `renderOrder = -1` to background-render

---

## 🔧 IMPLEMENTATION STEPS

### Step 1: AINodes.js - VFX Glow/Halo Opacity (Line 1074-1087)

**Current**:
```javascript
if (data.vfxGlow) {
  const glowBreathing = 1 + Math.sin(time * 1.2) * 0.3;
  const glowPulse = (0.4 + Math.sin(time * 2) * 0.15) * glowBreathing + activation * 0.2;
  data.vfxGlow.material.opacity = Math.min(0.8, glowPulse);  // MAX 0.8
}

if (data.vfxHalo) {
  const haloBreathing = 1 + Math.sin(time * 0.9) * 0.3;
  data.vfxHalo.material.opacity = (0.08 + Math.sin(time * 1.8) * 0.04) * haloBreathing;
}
```

**New**:
```javascript
if (data.vfxGlow) {
  const glowBreathing = 1 + Math.sin(time * 1.2) * 0.3;
  const glowPulse = (0.4 + Math.sin(time * 2) * 0.15) * glowBreathing + activation * 0.2;
  // [AURA VISUAL AUDIT] Reduced from 0.8 to 0.15 max - aura stays atmospheric
  data.vfxGlow.material.opacity = Math.min(0.15, glowPulse);  // MAX 0.15
  
  // [AURA VISUAL AUDIT] Push glow behind core geometry
  if (!data.vfxGlow.userData.renderOrderSet) {
    data.vfxGlow.renderOrder = -1;
    data.vfxGlow.userData.renderOrderSet = true;
  }
}

if (data.vfxHalo) {
  const haloBreathing = 1 + Math.sin(time * 0.9) * 0.3;
  data.vfxHalo.material.opacity = (0.08 + Math.sin(time * 1.8) * 0.04) * haloBreathing;
  // [AURA VISUAL AUDIT] Halo already in acceptable range
}
```

### Step 2: AuraModulationSystem.js - Animation Curves (Lines 51-73)

**Current**:
```javascript
opacity_pulse: {
  min: 0.2,
  max: 0.5,  // Too high
  speed: 3.0,
},
glow_intensity: {
  min: 0.5,
  max: 1.2,  // Too high
  speed: 2.0,
},
```

**New**:
```javascript
// [AURA VISUAL AUDIT] Reduced opacity max to keep aura atmospheric
opacity_pulse: {
  min: 0.08,     // Reduced from 0.2
  max: 0.20,     // Reduced from 0.5 (60% reduction)
  speed: 3.0,
},
glow_intensity: {
  min: 0.5,
  max: 0.80,     // Reduced from 1.2 (33% reduction)
  speed: 2.0,
},
```

### Step 3: GlobalAuraOpacityClamp.js - Global Maximum (Line 28)

**Current**:
```javascript
this.clampParameters = {
  maxAuraOpacity: 0.06,  // 6% - might be too restrictive
  enforceOnLink: true,
  enforceGlobally: true,
};
```

**New**:
```javascript
// [AURA VISUAL AUDIT] Increased from 0.06 to 0.18 for safer range (12-25% safe zone)
this.clampParameters = {
  maxAuraOpacity: 0.18,  // 18% - middle of safe 12-25% range
  enforceOnLink: true,
  enforceGlobally: true,
};
```

### Step 4: _UIPrimaryNodeAura3_7.js - UI Aura Rings (Lines 93-117)

**Current**:
```javascript
const ringMaterial = new THREE.MeshBasicMaterial({
  color: baseColor,
  emissive: baseColor,
  transparent: true,
  opacity: 0.6,  // Too visible
  fog: false,
  wireframe: false,
  depthTest: false,
  depthWrite: false
});

const pulseMaterial = new THREE.MeshBasicMaterial({
  color: baseColor,
  emissive: baseColor,
  transparent: true,
  opacity: 0.3,  // Still visible
  fog: false,
  wireframe: false,
  depthTest: false,
  depthWrite: false
});
```

**New**:
```javascript
// [AURA VISUAL AUDIT] Reduced opacities to prevent UI aura dominance
const ringMaterial = new THREE.MeshBasicMaterial({
  color: baseColor,
  emissive: baseColor,
  transparent: true,
  opacity: 0.18,  // Reduced from 0.6 (70% reduction)
  fog: false,
  wireframe: false,
  depthTest: false,
  depthWrite: false
});

const pulseMaterial = new THREE.MeshBasicMaterial({
  color: baseColor,
  emissive: baseColor,
  transparent: true,
  opacity: 0.10,  // Reduced from 0.3 (67% reduction)
  fog: false,
  wireframe: false,
  depthTest: false,
  depthWrite: false
});

// [AURA VISUAL AUDIT] Ensure UI aura renders behind core geometry
ring.renderOrder = -1;   // Render behind core
pulse.renderOrder = -1;  // Render behind core
```

---

## 📊 OPACITY REDUCTION SUMMARY

| Layer | Current | New | Reduction | Ratio |
|-------|---------|-----|-----------|-------|
| VFX Glow | 0.80 | 0.15 | 0.65 | 81% ↓ |
| Opacity Pulse Max | 0.50 | 0.20 | 0.30 | 60% ↓ |
| Glow Intensity Max | 1.20 | 0.80 | 0.40 | 33% ↓ |
| UI Ring | 0.60 | 0.18 | 0.42 | 70% ↓ |
| UI Pulse | 0.30 | 0.10 | 0.20 | 67% ↓ |
| Global Clamp | 0.06 | 0.18 | +0.12 | (Increased for safety) |

---

## ✨ EXPECTED RESULTS

### Before Adjustment
- ❌ Aura completely dominates visual
- ❌ Core geometry barely visible (cyan blur)
- ❌ Cannot read node type from distance
- ❌ Aesthetic: overwhelming bloom

### After Adjustment
- ✅ Core geometry clearly visible
- ✅ Aura provides subtle atmospheric glow
- ✅ Node type easily distinguishable
- ✅ Aesthetic: balanced, professional

---

## 🧪 TESTING VERIFICATION

### Visual Verification
- [ ] Spawn node → core visible and readable
- [ ] Move camera close → core geometry clearly visible
- [ ] Move camera far → aura subtle, core recognizable
- [ ] Observe aura "breathing" animation → smooth, non-obstructive
- [ ] Multiple nodes nearby → each core individually visible
- [ ] Aura has slight glow but doesn't wash out surroundings

### Functional Verification
- [ ] Linking primary node → UI ring visible but subtle
- [ ] Node activation feedback → aura pulses (visible but not dominant)
- [ ] Hover over node → highlight applies over core (not under)
- [ ] Scene performance maintained → no FPS drop

---

## 🎨 Visual Hierarchy (After Fix)

```
Background (dark space)
  ↓
Link Connections (thin lines)
  ↓
Distant Aura Glow (subtle, renderOrder: -1)
  ↓
Core Node Mesh (bright, readable, renderOrder: 0) ← DOMINANT
  ↓
Hologram Shell (grid overlay, renderOrder: 5)
  ↓
Particles/Near Effects
```

**Result**: Player's eyes drawn to **core first**, aura provides context

---

## ⚠️ SAFETY NOTES

### What's NOT Changed
- ✅ Node logic / stats / calculations
- ✅ Synergy system
- ✅ Link systems
- ✅ Corruption/harmony mechanics
- ✅ Animation timing
- ✅ Particle systems
- ✅ Raycasting

### What IS Changed (Visual Only)
- ✅ Aura opacity values
- ✅ Render ordering
- ✅ Animation curve maximums
- ✅ Color blending parameters

**Risk Level**: 🟢 **MINIMAL** (visual-only, no logic changes)

---

## 🚀 Implementation Timeline

1. **AINodes.js** - VFX glow/halo opacity (5 min)
2. **AuraModulationSystem.js** - Animation curves (5 min)
3. **GlobalAuraOpacityClamp.js** - Global clamp increase (2 min)
4. **_UIPrimaryNodeAura3_7.js** - UI aura reduction (5 min)
5. **Testing & verification** - Visual inspection (10 min)

**Total**: ~25 minutes

