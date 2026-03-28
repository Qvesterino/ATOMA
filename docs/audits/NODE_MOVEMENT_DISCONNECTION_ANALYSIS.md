# NODE MOVEMENT DISCONNECTION ANALYSIS
**Analysis Date:** 2026-03-28
**Objective:** Identify all systems causing linked nodes to shake/drift/oscillate and create plan to disconnect them

---

## EXECUTIVE SUMMARY

Linked nodes in ATOMA receive movement/animations from **3 distinct systems**:

1. **EnhancedNodeModels.animate()** - Position oscillations (spindles, wobbling, bobbing, drift)
2. **EnhancedNodeModelLinkState** - Scale multiplier (+2%) when linked
3. **Aura Systems** - Position drift and radial oscillation on aura meshes

**Total Systems to Disable:** 3 primary files + 1 auxiliary system

---

## SYSTEM 1: ENHANCED NODE MODELS ANIMATION

**File:** `EnhancedNodeModels.js`
**Entry Point:** `EnhancedNodeModels.animate(node, deltaTime, time)`
**Called From:** `AINodes.js` line ~4300

### Movement Types Detected

#### 1.1 VERTICAL OSCILLATION (Bobbing)
- **ARCHIVE_SPINDLE**: `spindleOscillationSpeed`, `spindleOscillationAmplitude`
  - Moves node.position.y up/down based on sine wave
- **DATA_GATEWAY portal**: `portalOscillationSpeed`, `portalOscillationAmplitude`
  - Moves portal child up/down
- **HIERARCHY_TOWER levels**: `levelOscillationSpeed`, `levelOscillationAmplitude`
  - Each level bobs independently with phase offset

#### 1.2 AXIAL WOBBLE (Rotation oscillation)
- **OBSERVER_LENS**: `lensWobbleSpeed`, `lensWobbleAmplitude`
  - Rotates node.rotation.x back and forth (tilt)
- **SIGNAL_RECEPTOR**: Subtle wobble on antenna
  - (Disabled in Session 107 - LEGACY SCALE PULSE AUDIT)

#### 1.3 POSITIONAL DRIFT (X/Z movement)
- **PROCESS_TEMPORAL_SHIFTER**: Layer drift
  - `driftX` and `driftZ` based on sine waves with phase offsets
  - Each layer moves in independent circular pattern
- **PROCESS_FLOW_RECOMPOSER**: Shard drift
  - `driftSpeed` and `driftAxis` for shards
  - Creates floating/hovering effect

#### 1.4 JITTER/NOISE
- **PROCESS variants**: `microJitter` on strands
  - Random high-frequency movement
  - `jitterX`, `jitterY`, `jitterZ` based on noise functions
- **ITERATIVE_ENGINE**: Ring wobble
  - Gentle rotation oscillation

### Activation Mechanism
All animations are controlled by userData flags set during node creation:
```javascript
nodeGroup.userData.spindleOscillationSpeed = 0.4;
nodeGroup.userData.lensWobbleSpeed = 0.12;
nodeGroup.userData.portalOscillationAmplitude = 0.05;
```

### Disconnection Strategy
**Option A: Global Kill Switch**
- Add `ENABLE_NODE_ANIMATIONS` flag at top of `EnhancedNodeModels.js`
- Wrap entire `animate()` function with early return if disabled

**Option B: Per-Node Animation Disable**
- Add `node.userData.disableAnimations` flag
- Check flag in `animate()` before applying any movement

**Option C: Selective Disconnection**
- Comment out specific animation blocks
- Keep rotations, disable position changes
- Preserve visual variety while removing movement

---

## SYSTEM 2: ENHANCED NODE MODEL LINK STATE

**File:** `EnhancedNodeModelLinkState.js`
**Entry Point:** `applyLinkBoost(node)` / `removeLinkBoost(node)`
**Trigger:** Link creation/deletion

### Movement Types Detected

#### 2.1 SCALE BOOST
- **Effect:** `scaleBoost: 0.02` (+2% scale)
- **Applied to:** `node.userData.linkTarget`
- **Method:** `mut.scale.multiplyScalar(scaleBoost)`

### Activation Mechanism
Called by link creation system when nodes become linked:
```javascript
applyLinkStateMutation(node, (mut) => {
  const scaleBoost = 1.0 + this.boostParameters.scaleBoost;
  mut.scale.multiplyScalar(scaleBoost);
});
```

### Disconnection Strategy
**Option A: Disable System**
- Set `scaleBoost: 0.0` in `this.boostParameters`
- System still runs but has no effect

**Option B: Remove Integration**
- Don't call `applyLinkBoost()` in link creation
- Complete removal of linked node visual feedback

---

## SYSTEM 3: NODE LINKED AURA RENDERER

**File:** `NodeLinkedAuraRenderer_Session146.js`
**Entry Point:** `_animateAuraMesh(mesh, node, ...)`
**Trigger:** Aura update loop

### Movement Types Detected

#### 3.1 VERTICAL DRIFT
- **Effect:** `driftSpeed` parameter (default 0.3)
- **Applied to:** Aura mesh position.y
- **Result:** Aura floats upward slowly

#### 3.2 RADIAL OSCILLATION (Breathing)
- **Effect:** `oscillationAmplitude` (default 0.15), `oscillationFrequency` (1.0 Hz)
- **Applied to:** Aura mesh scale
- **Result:** Aura expands and contracts rhythmically

### Activation Mechanism
```javascript
// Vertical drift
const driftAmount = this.config.driftSpeed * 0.1;
mesh.position.y += driftAmount;

// Radial oscillation
const oscillation = Math.sin(time * this.config.oscillationFrequency * Math.PI * 2) * 
                   this.config.oscillationFrequency;
const breathingScale = 1.0 + oscillation * 0.1;
mesh.scale.multiplyScalar(breathingScale);
```

### Disconnection Strategy
**Option A: Phase Off Mode**
- Add `MOTION_OFF_PHASE1` flag
- Already partially present in code
- Disable position drift, keep scale breathing

**Option B: Complete Disable**
- Set `driftSpeed: 0`, `oscillationAmplitude: 0`
- System still runs but no movement

---

## SYSTEM 4: HARMONIC INFLUENCE PROPAGATION

**File:** `HarmonicInfluencePropagationSystem_Session127.js`
**Entry Point:** `_animateAuraMesh()`
**Note:** Auxiliary system, may overlap with System 3

### Movement Types Detected
- Similar vertical drift and oscillation as NodeLinkedAuraRenderer
- Motion described as "smooth motion coherence"

---

## LINK TARGET CONTRACT PROTECTION

**File:** `LinkTargetContract.js`
**Purpose:** Enforce single gateway for link-state mutations

### Current Protection
Only `node.userData.linkTarget` can be mutated by link-state systems:
```javascript
export function applyLinkStateMutation(node, mutationFn) {
  const target = getLinkStateTarget(node);
  if (!target) return false; // Immutable to link-state
  mutationFn(target);
}
```

### Implication
Any movement applied to `linkTarget` is approved and controlled
Movement applied elsewhere (e.g., node root) would violate contract

---

## INTEGRATION POINTS

### Where Animations Are Triggered

1. **AINodes.update()** (main update loop)
   - Calls `EnhancedNodeModels.animate(node, deltaTime, time)` for all nodes
   - Runs every frame at visual cadence (30Hz)

2. **Link Creation** (NodeLinkingSystem)
   - Calls `enhancedNodeModelLinkState.applyLinkBoost(node)`
   - Applies scale boost when link forms

3. **Aura Update Loop** (NodeLinkedAuraRenderer)
   - Updates aura position/scale every frame
   - Independent of main node animation loop

---

## DISCONNECTION PLAN

### PHASE 1: GLOBAL ANIMATION KILL SWITCH
**File:** `EnhancedNodeModels.js`

Add configuration at top of file:
```javascript
const ENABLE_NODE_ANIMATIONS = false; // Global kill switch
```

Modify `animate()` function:
```javascript
export function animate(node, deltaTime, time) {
  // Global kill switch
  if (!ENABLE_NODE_ANIMATIONS) return;
  
  // Existing animation code...
}
```

### PHASE 2: DISABLE LINK SCALE BOOST
**File:** `EnhancedNodeModelLinkState.js`

Modify boost parameters:
```javascript
this.boostParameters = {
  opacityBoost: 0.05,
  emissiveBoost: 0.15,
  scaleBoost: 0.0, // DISABLED: Was 0.02
};
```

### PHASE 3: DISABLE AURA MOVEMENT
**File:** `NodeLinkedAuraRenderer_Session146.js`

Modify configuration or disable motion blocks:
```javascript
_animateAuraMesh(mesh, node, harmony, synergy, stability, fadeProgress) {
  // PHASE OFF: Disabled aura position drift
  if (MOTION_OFF_PHASE1) {
    return; // Skip all motion
  }
  
  // Existing animation code...
}
```

Or set motion parameters to zero:
```javascript
this.config = {
  driftSpeed: 0.0, // DISABLED: Was 0.3
  oscillationAmplitude: 0.0, // DISABLED: Was 0.15
  oscillationFrequency: 1.0,
  // ...
};
```

### PHASE 4: VERIFY LINK TARGET CONTRACT
**File:** `LinkTargetContract.js`

Ensure contract protection still works:
- No position changes outside `applyLinkStateMutation`
- Link state only affects `node.userData.linkTarget`

---

## VERIFICATION CHECKLIST

After implementing disconnections:

- [ ] Visual inspection: Linked nodes appear static (no position/scale changes)
- [ ] Console check: No animation errors or warnings
- [ ] Performance check: Frame time reduced (no animation calculations)
- [ ] Link behavior: Links still form/break correctly
- [ ] Other effects: Rotation, color changes, pulsing still work if intended

---

## RISKS AND MITIGATION

### Risk 1: Visual Feedback Loss
**Issue:** Users won't see visual difference between linked/unlinked nodes
**Mitigation:** Keep color changes, opacity changes, link geometry itself

### Risk 2: Stale Feel
**Issue:** System may feel "dead" without movement
**Mitigation:** Add subtle rotation (not position/scale) for aliveness

### Risk 3: Unexpected Behavior
**Issue:** Some systems may rely on node movement for gameplay
**Mitigation:** Test thoroughly; re-enable specific animations if needed

---

## RECOMMENDATION

**Start with Phase 1 (Global Kill Switch)** for fastest result:
1. Add `ENABLE_NODE_ANIMATIONS = false` to `EnhancedNodeModels.js`
2. Test to verify all node movement stops
3. If successful, proceed to Phase 2 and 3
4. Fine-tune which specific animations to keep/disable based on testing

This approach allows:
- Rapid validation of disconnection approach
- Easy rollback if issues arise
- Granular control over which effects to keep

---

## FILES TO MODIFY

1. `EnhancedNodeModels.js` - Add global animation flag
2. `EnhancedNodeModelLinkState.js` - Set scaleBoost to 0
3. `NodeLinkedAuraRenderer_Session146.js` - Disable drift/oscillation
4. Optional: `HarmonicInfluencePropagationSystem_Session127.js` - Disable similar motion

---

## SUCCESS CRITERIA

✅ Linked nodes remain at fixed position (no Y-axis bobbing)
✅ Linked nodes maintain fixed scale (no expansion/contraction)
✅ Linked nodes do not wobble/jitter (no noise movement)
✅ Aura meshes remain static (no drift/breathing)
✅ System remains stable (no console errors)
✅ Performance improves (fewer calculations per frame)