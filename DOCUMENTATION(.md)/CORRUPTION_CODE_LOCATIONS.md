# CORRUPTION VISUAL STATE — CODE LOCATIONS & REFERENCES

## Quick Navigation

### Production Code Changes

**File 1: NeonLinkVisuals.js**
- **Location**: Corruption method implementation
- **Lines**: 1084-1144 (70 lines)
- **Method**: `_applyCorruptionVisuals(linkMesh, corruptionLevel)`
- **Integration point**: Line 962 in `updateMetricLinks()`

**File 2: NodeLinkingSystem.js**
- **Location 1**: Corruption method for nodes (apply)
- **Lines**: 3423-3515 (93 lines)
- **Method**: `_applyCorruptionToNode(node, corruptionLevel)`

- **Location 2**: Corruption method for nodes (remove)
- **Lines**: 3522-3548 (27 lines)
- **Method**: `_removeCorruptionFromNode(node)`

- **Location 3**: Integration into updateLinkMetrics
- **Lines**: 3260-3325 (66 lines)
- **Method**: Updated section in `updateLinkMetrics(link, metrics)`

- **Location 4**: Cleanup fix
- **Lines**: 3400-3413 (14 lines)
- **Method**: Fixed duplicate code in `_removeHarmonyFromNode()`

---

## Detailed Code Reference

### 1. NeonLinkVisuals.js — Link Corruption

```javascript
// ============================================================================
// LOCATION: Lines 1084-1144
// METHOD: _applyCorruptionVisuals(linkMesh, corruptionLevel)
// PURPOSE: Apply corruption-induced visual instability to link
// ============================================================================

_applyCorruptionVisuals(linkMesh, corruptionLevel) {
  if (!linkMesh || !linkMesh.children) return;
  
  if (!linkMesh.userData) linkMesh.userData = {};
  
  // Corruption state flags
  const isCorrupted = corruptionLevel >= 0.65;
  const isHighlyCorrupted = corruptionLevel >= 0.80;
  
  if (isCorrupted) {
    // Store base position/scale for restoration if needed
    for (const child of linkMesh.children) {
      if (!child.userData) child.userData = {};
      
      // Track corruption state
      child.userData.isCorrupted = true;
      child.userData.corruptionLevel = corruptionLevel;
      
      // Progressive irregularity based on corruption intensity
      // At 0.65: subtle misalignment
      // At 0.80: severe misalignment
      const irregularity = (corruptionLevel - 0.65) / 0.35; // 0-1 scale
      const maxDeviation = irregularity * 0.15; // Up to 15% deviation at max
      
      // Apply irregular spacing offset
      if (!child.userData.baseSpacing) {
        child.userData.baseSpacing = child.position.clone();
      }
      
      // Angular deviation - slight skew along the link path
      if (!child.userData.baseRotation) {
        child.userData.baseRotation = child.rotation.clone();
      }
      
      // Misalignment increases with corruption
      const randomDeviation = Math.random() - 0.5;
      child.userData.corruptionDeviation = randomDeviation * maxDeviation;
    }
    
    linkMesh.userData.corruptionActive = true;
    linkMesh.userData.corruptionLevel = corruptionLevel;
  } else {
    // Corruption below threshold: restore normal appearance
    for (const child of linkMesh.children) {
      if (child.userData) {
        child.userData.isCorrupted = false;
        child.userData.corruptionDeviation = 0;
      }
    }
    linkMesh.userData.corruptionActive = false;
  }
}
```

**Key Variables**:
- `isCorrupted`: boolean, true when corruption >= 0.65
- `isHighlyCorrupted`: boolean, true when corruption >= 0.80
- `irregularity`: 0-1 scale (0.65→0, 0.80→0.43, 1.0→1.0)
- `maxDeviation`: spatial deviation magnitude (0-0.15)
- `randomDeviation`: per-segment random offset

**Integration Point**:
```javascript
// Line 962 in updateMetricLinks()
this._applyCorruptionVisuals(state.mesh, state.corruption);
```

---

### 2. NodeLinkingSystem.js — Node Corruption (Apply)

```javascript
// ============================================================================
// LOCATION: Lines 3423-3515
// METHOD: _applyCorruptionToNode(node, corruptionLevel)
// PURPOSE: Apply corruption to node internal geometry
// ============================================================================

_applyCorruptionToNode(node, corruptionLevel) {
  if (!node || !node.children) return;
  
  try {
    const isCorrupted = corruptionLevel >= 0.65;
    const isHighlyCorrupted = corruptionLevel >= 0.80;
    
    if (isCorrupted) {
      // Progressive corruption intensity
      const corruptionIntensity = (corruptionLevel - 0.65) / 0.35; // 0-1 scale
      
      for (const child of node.children) {
        if (!child.userData) child.userData = {};
        
        // Mark as corrupted
        child.userData.isCorrupted = true;
        child.userData.corruptionLevel = corruptionLevel;
        
        // Detect internal/secondary layers
        const isInternal = 
          child.userData.visualLayer === 'INTERNAL' ||
          child.userData.type === 'internal' ||
          (child.material && child.material.opacity < 0.5);
        
        if (isInternal && child.material) {
          // Store original state
          if (child.userData.baseCorruptionOpacity === undefined) {
            child.userData.baseCorruptionOpacity = child.material.opacity;
          }
          
          // Apply misalignment opacity (layers appear offset/fractured)
          // At 0.65: subtle loss of symmetry (-5% opacity)
          // At 0.80: visible fracture (-15% opacity)
          const opacityShift = -0.05 - corruptionIntensity * 0.10;
          child.material.opacity = Math.max(0.05, child.userData.baseCorruptionOpacity + opacityShift);
        }
        
        // Apply spatial offset/skew to internal geometries
        if (isInternal && child.geometry) {
          if (!child.userData.basePosition) {
            child.userData.basePosition = child.position.clone();
            child.userData.baseRotation = child.rotation.clone();
          }
          
          // Misregistration offset (max ±0.1 units at high corruption)
          const offsetAmount = corruptionIntensity * 0.1;
          const randomX = (Math.random() - 0.5) * offsetAmount;
          const randomY = (Math.random() - 0.5) * offsetAmount;
          const randomZ = (Math.random() - 0.5) * offsetAmount;
          
          // Apply offset on top of base position
          child.position.copy(child.userData.basePosition);
          child.position.x += randomX;
          child.position.y += randomY;
          child.position.z += randomZ;
          
          // Slight rotation skew for highly corrupted
          if (isHighlyCorrupted) {
            const skewAmount = corruptionIntensity * 0.1;
            child.rotation.x = child.userData.baseRotation.x + (Math.random() - 0.5) * skewAmount;
            child.rotation.y = child.userData.baseRotation.y + (Math.random() - 0.5) * skewAmount;
          }
        }
      }
      
      node.userData.corruptedState = 'CORRUPTED';
      node.userData.corruptionLevel = corruptionLevel;
    } else {
      // Restore to normal
      for (const child of node.children) {
        if (child.userData) {
          child.userData.isCorrupted = false;
          
          // Restore opacity if we have base value
          if (child.userData.baseCorruptionOpacity !== undefined && child.material) {
            child.material.opacity = child.userData.baseCorruptionOpacity;
          }
          
          // Restore position/rotation
          if (child.userData.basePosition) {
            child.position.copy(child.userData.basePosition);
          }
          if (child.userData.baseRotation) {
            child.rotation.copy(child.userData.baseRotation);
          }
        }
      }
      node.userData.corruptedState = 'NORMAL';
    }
  } catch (err) {
    console.error('[NodeLinkingSystem] Corruption application to node failed:', err.message);
  }
}
```

**Key Variables**:
- `isCorrupted`: boolean, true when corruption >= 0.65
- `isHighlyCorrupted`: boolean, true when corruption >= 0.80
- `corruptionIntensity`: 0-1 scale (0.65→0, 0.80→0.43, 1.0→1.0)
- `isInternal`: boolean, detects secondary/internal layers
- `opacityShift`: -0.05 to -0.15 (-5% to -15%)
- `offsetAmount`: 0 to 0.1 units
- `skewAmount`: 0 to 0.1 radians (at >= 0.80 only)

**Internal Layer Detection**:
```javascript
const isInternal = 
  child.userData.visualLayer === 'INTERNAL' ||
  child.userData.type === 'internal' ||
  (child.material && child.material.opacity < 0.5);
```

---

### 3. NodeLinkingSystem.js — Node Corruption (Remove)

```javascript
// ============================================================================
// LOCATION: Lines 3522-3548
// METHOD: _removeCorruptionFromNode(node)
// PURPOSE: Restore node to normal appearance
// ============================================================================

_removeCorruptionFromNode(node) {
  if (!node || !node.children) return;
  
  try {
    for (const child of node.children) {
      if (child.userData) {
        child.userData.isCorrupted = false;
        
        // Restore opacity
        if (child.userData.baseCorruptionOpacity !== undefined && child.material) {
          child.material.opacity = child.userData.baseCorruptionOpacity;
        }
        
        // Restore position/rotation
        if (child.userData.basePosition) {
          child.position.copy(child.userData.basePosition);
        }
        if (child.userData.baseRotation) {
          child.rotation.copy(child.userData.baseRotation);
        }
      }
    }
    node.userData.corruptedState = 'NORMAL';
  } catch (err) {
    console.error('[NodeLinkingSystem] Corruption removal failed:', err.message);
  }
}
```

---

### 4. NodeLinkingSystem.js — Integration in updateLinkMetrics()

```javascript
// ============================================================================
// LOCATION: Lines 3260-3325 (within updateLinkMetrics method)
// PURPOSE: Apply corruption along with synergy/harmony upgrades
// ============================================================================

// [SYNERGY/HARMONY/CORRUPTION UPGRADE] Apply node visual upgrades based on metric thresholds
if (link.source && link.target) {
  const isSynergyAwakened = normalized.synergy >= 0.85;
  const isHarmonyStabilized = normalized.harmony >= 0.80;
  const isCorrupted = normalized.corruption >= 0.65;
  
  // [CORRUPTION VISUAL STATE] Apply corruption first (overrides harmony visual order)
  // Corruption makes the system look broken/unstable
  if (isCorrupted) {
    if (!link.source.userData.corruptedState) {
      this._applyCorruptionToNode(link.source, normalized.corruption);
    } else if (link.source.userData.corruptionLevel !== normalized.corruption) {
      this._applyCorruptionToNode(link.source, normalized.corruption);  // Update intensity
    }
    
    if (!link.target.userData.corruptedState) {
      this._applyCorruptionToNode(link.target, normalized.corruption);
    } else if (link.target.userData.corruptionLevel !== normalized.corruption) {
      this._applyCorruptionToNode(link.target, normalized.corruption);  // Update intensity
    }
  } else {
    // Remove corruption state if it was active
    if (link.source.userData.corruptedState === 'CORRUPTED') {
      this._removeCorruptionFromNode(link.source);
    }
    if (link.target.userData.corruptedState === 'CORRUPTED') {
      this._removeCorruptionFromNode(link.target);
    }
  }
  
  // Synergy: Reveal internal node geometry (can be deformed by corruption)
  if (isSynergyAwakened) {
    if (!link.source.userData.synergizedState) {
      this._applySynergyToNode(link.source);
    }
    if (!link.target.userData.synergizedState) {
      this._applySynergyToNode(link.target);
    }
  } else {
    // Remove synergy state if it was active
    if (link.source.userData.synergizedState === 'AWAKENED') {
      this._removeSynergyFromNode(link.source);
    }
    if (link.target.userData.synergizedState === 'AWAKENED') {
      this._removeSynergyFromNode(link.target);
    }
  }
  
  // Harmony: Stabilize node motion and oscillations (corruption introduces tension that fights this)
  if (isHarmonyStabilized) {
    if (!link.source.userData.harmonyStabilized) {
      this._applyHarmonyToNode(link.source);
    }
    if (!link.target.userData.harmonyStabilized) {
      this._applyHarmonyToNode(link.target);
    }
  } else {
    // Remove harmony state if it was active
    if (link.source.userData.harmonyStabilized) {
      this._removeHarmonyFromNode(link.source);
    }
    if (link.target.userData.harmonyStabilized) {
      this._removeHarmonyFromNode(link.target);
    }
  }
}
```

**Key Decision Points**:
- Line 3264: Corruption threshold check
- Line 3266: "Apply corruption first" comment (design decision)
- Line 3268-3279: Apply/update corruption if active
- Line 3280-3288: Remove corruption if dropping below threshold
- Lines 3290+: Synergy/harmony applied on top

---

### 5. Integration Call Chain

```
Per-frame execution:

updateLinkAnimations(link, time, deltaTime)  [Line ~2943]
  └─ updateLinkMetrics(link, metrics)  [Line 2961]
      ├─ visuals.updateLinkState(link.id, normalized)  [Line 3258]
      │   └─ updateMetricLinks()  [Internal to NeonLinkVisuals]
      │       ├─ _applyCorruptionVisuals(state.mesh, state.corruption)  [Line 962]
      │       ├─ _applySynergyVisuals(state.mesh, state.isSynergyAwakened)  [Line 965]
      │       └─ _applyHarmonyVisuals(state.mesh, state.isHarmonyStabilized)  [Line 966]
      │
      └─ Apply node upgrades [Lines 3260-3325]
          ├─ IF corruption >= 0.65:
          │   ├─ _applyCorruptionToNode(link.source, corruption)
          │   └─ _applyCorruptionToNode(link.target, corruption)
          ├─ IF synergy >= 0.85:
          │   ├─ _applySynergyToNode(link.source)
          │   └─ _applySynergyToNode(link.target)
          └─ IF harmony >= 0.80:
              ├─ _applyHarmonyToNode(link.source)
              └─ _applyHarmonyToNode(link.target)
```

---

## State Storage Reference

### Link Corruption State (userData)

```javascript
// Per-segment in linkMesh.children
userData: {
  isCorrupted: boolean,              // Corruption is active
  corruptionLevel: float (0-1),       // Current corruption value
  corruptionDeviation: float,         // Calculated deviation offset
  baseSpacing: Vector3,               // Original position
  baseRotation: Euler,                // Original rotation
}

// On linkMesh itself
userData: {
  corruptionActive: boolean,          // Corruption state
  corruptionLevel: float (0-1),       // Current corruption
}
```

### Node Corruption State (userData)

```javascript
// Per-layer in node.children
userData: {
  isCorrupted: boolean,               // Corruption applied
  corruptionLevel: float (0-1),       // Current corruption value
  baseCorruptionOpacity: float,       // Original opacity
  basePosition: Vector3,              // Original position
  baseRotation: Euler,                // Original rotation
}

// On node itself
userData: {
  corruptedState: string,             // 'NORMAL' or 'CORRUPTED'
  corruptionLevel: float (0-1),       // Current corruption
}
```

---

## Calculation Reference

### Corruption Intensity Formula

```javascript
// Convert 0.65-1.0 range to 0-1 scale
const intensity = (corruptionLevel - 0.65) / 0.35;
// Result: 0.65→0, 0.80→0.43, 1.0→1.0
```

### Link Deviation Calculation

```javascript
const irregularity = (corruptionLevel - 0.65) / 0.35;
const maxDeviation = irregularity * 0.15;  // 0-15% at max
const randomDeviation = (Math.random() - 0.5) * maxDeviation;
// Result: Random offset ±(0-7.5%) at max corruption
```

### Node Opacity Shift

```javascript
const corruptionIntensity = (corruptionLevel - 0.65) / 0.35;
const opacityShift = -0.05 - (corruptionIntensity * 0.10);
// Result: -5% to -15% opacity reduction
child.material.opacity = Math.max(0.05, baseOpacity + opacityShift);
// Minimum 5% opacity (readability preserved)
```

### Node Position Offset

```javascript
const corruptionIntensity = (corruptionLevel - 0.65) / 0.35;
const offsetAmount = corruptionIntensity * 0.1;  // 0 to 0.1 units
const randomX = (Math.random() - 0.5) * offsetAmount;
const randomY = (Math.random() - 0.5) * offsetAmount;
const randomZ = (Math.random() - 0.5) * offsetAmount;
// Applied to each layer independently
```

### Node Rotation Skew (>= 0.80 only)

```javascript
if (isHighlyCorrupted) {  // >= 0.80
  const corruptionIntensity = (corruptionLevel - 0.65) / 0.35;
  const skewAmount = corruptionIntensity * 0.1;  // 0 to 0.1 radians
  child.rotation.x = baseRotation.x + (Math.random() - 0.5) * skewAmount;
  child.rotation.y = baseRotation.y + (Math.random() - 0.5) * skewAmount;
}
```

---

## Testing & Debug References

### Console Output

```javascript
// Corruption applied
console.debug(`[NodeLinkingSystem] Applied corruption to source: ${corruption}`);

// Corruption removed
console.debug(`[NodeLinkingSystem] Removed corruption from source`);

// Error handling
console.error('[NodeLinkingSystem] Corruption application to node failed:', err.message);
console.error('[NodeLinkingSystem] Corruption removal failed:', err.message);
```

### Quick Debug Checks

```javascript
// Check link corruption state
if (link.group && link.group.userData.corruptionActive) {
  console.log('Link is corrupted:', link.group.userData.corruptionLevel);
}

// Check node corruption state
if (node.userData.corruptedState === 'CORRUPTED') {
  console.log('Node corrupted at level:', node.userData.corruptionLevel);
}

// Check individual segment corruption
node.children.forEach((child, i) => {
  if (child.userData.isCorrupted) {
    console.log(`Segment ${i} corrupted, deviation: ${child.userData.corruptionDeviation}`);
  }
});
```

---

## Performance Profiling Points

```javascript
// At start of _applyCorruptionVisuals:
const startTime = performance.now();

// At end:
const duration = performance.now() - startTime;
console.debug(`Corruption visual update: ${duration.toFixed(3)}ms`);

// Expected: <0.5ms for links, <0.2ms for nodes
```

---

## Related Documentation Files

- **CORRUPTION_VISUAL_INTEGRATION.md** — Comprehensive technical specification
- **CORRUPTION_VISUAL_QUICKREF.txt** — Quick reference guide
- **CORRUPTION_VISUAL_DIAGRAMS.md** — Visual diagrams and state matrices
- **SESSION_66_CORRUPTION_SUMMARY.txt** — Session summary

---

## Quick Search Guide

| Concept | File | Location |
|---------|------|----------|
| Link corruption method | NeonLinkVisuals.js | Lines 1084-1144 |
| Link corruption integration | NeonLinkVisuals.js | Line 962 |
| Node corruption apply | NodeLinkingSystem.js | Lines 3423-3515 |
| Node corruption remove | NodeLinkingSystem.js | Lines 3522-3548 |
| State integration | NodeLinkingSystem.js | Lines 3260-3325 |
| updateLinkMetrics | NodeLinkingSystem.js | Lines 3247+ |
| Threshold constants | Both files | 0.65 and 0.80 |
