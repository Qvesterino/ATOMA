# SYNERGY & HARMONY CODE LOCATIONS
## Exact File References and Line Numbers

---

## File 1: NeonLinkVisuals.js

### Location 1: updateLinkState() Enhancement
**Lines 874-895** — Added state flags for synergy/harmony

```javascript
updateLinkState(linkId, metrics = {}) {
  const state = this.linkStates.get(linkId);
  if (!state) return;
  
  // ... existing threshold check ...
  
  if (hasChange) {
    state.corruption = metrics.corruption ?? 0;
    state.synergy = metrics.synergy ?? 0;
    state.harmony = metrics.harmony ?? 0;
    state.lastUpdate = this.time;
    
    // [SYNERGY/HARMONY UPGRADE] ← NEW
    state.isSynergyAwakened = (state.synergy >= 0.85);
    state.isHarmonyStabilized = (state.harmony >= 0.80);
  }
}
```

**What to verify:**
- ✓ Flags set on state object
- ✓ Threshold comparisons (0.85 and 0.80)
- ✓ No breaking changes to existing logic

---

### Location 2: updateMetricLinks() Call Sites
**Lines 960-989** — Calls new visual methods in main update loop

```javascript
updateMetricLinks(delta) {
  for (const [linkId, state] of this.linkStates.entries()) {
    if (!state.mesh || !state.mesh.material) continue;
    
    const { corruption, synergy, harmony } = state;
    
    // ... existing computations ...
    
    // [SYNERGY/HARMONY UPGRADE] ← NEW
    this._applySynergyVisuals(state.mesh, state.isSynergyAwakened);
    this._applyHarmonyVisuals(state.mesh, state.isHarmonyStabilized);
    
    // ... existing material application ...
    
    if (state.mesh.children) {
      for (const child of state.mesh.children) {
        if (child.material && !child.userData?.isSelectionHighlight) {
          this._applyMetricMaterial(child.material, metricColor, pulse);
          
          // [SYNERGY/HARMONY UPGRADE] ← NEW
          if (state.isSynergyAwakened) {
            child.userData.synergizedSegment = true;
          }
        }
      }
    }
  }
}
```

**What to verify:**
- ✓ Methods called before material updates
- ✓ State flags properly checked
- ✓ Metadata flags set (synergizedSegment)

---

### Location 3: New _applySynergyVisuals() Method
**Lines 1012-1044** — Implements link synergy visual state

```javascript
_applySynergyVisuals(linkMesh, isSynergyAwakened) {
  if (!linkMesh || !linkMesh.children) return;
  
  for (const child of linkMesh.children) {
    if (!child.userData) child.userData = {};
    
    if (isSynergyAwakened) {
      // Synergy awakened: segments become bonded
      if (child.material && typeof child.material.opacity !== 'undefined') {
        // Add subtle opacity boost for bond visualization
        child.userData.baseSynergyOpacity = child.userData.baseSynergyOpacity ?? child.material.opacity;
        child.material.opacity = Math.min(1.0, child.userData.baseSynergyOpacity + 0.08);
      }
      
      // Mark segment as part of synergy structure
      child.userData.synergizedSegment = true;
    } else {
      // Synergy not awakened: restore normal appearance
      if (child.userData.baseSynergyOpacity !== undefined && child.material) {
        child.material.opacity = child.userData.baseSynergyOpacity;
      }
      child.userData.synergizedSegment = false;
    }
  }
}
```

**What to verify:**
- ✓ Opacity boost: +0.08 (8%)
- ✓ Min clamping: Math.min(1.0, ...)
- ✓ Base opacity stored for restoration
- ✓ Metadata tracking (synergizedSegment)

---

### Location 4: New _applyHarmonyVisuals() Method
**Lines 1046-1082** — Implements link harmony visual state

```javascript
_applyHarmonyVisuals(linkMesh, isHarmonyStabilized) {
  if (!linkMesh) return;
  
  if (!linkMesh.userData) linkMesh.userData = {};
  
  if (isHarmonyStabilized) {
    // Harmony stabilized: smooth, calm, minimal motion
    linkMesh.userData.harmonyStabilized = true;
    
    // Regularize segment spacing if present
    if (linkMesh.children && linkMesh.children.length > 0) {
      for (const child of linkMesh.children) {
        if (!child.userData) child.userData = {};
        child.userData.harmonyDamping = 0.15;  // 15% motion damping
      }
    }
  } else {
    // Harmony not stabilized: normal motion
    linkMesh.userData.harmonyStabilized = false;
    
    if (linkMesh.children && linkMesh.children.length > 0) {
      for (const child of linkMesh.children) {
        if (child.userData) {
          child.userData.harmonyDamping = 0;  // No damping
        }
      }
    }
  }
}
```

**What to verify:**
- ✓ Damping factor: 0.15 (15%)
- ✓ Applied to all children
- ✓ Metadata tracking (harmonyDamping)

---

## File 2: NodeVisualStateBinder.js

### Location 1: New applySynergyAwakenedState()
**Lines 520-556** — Synergy node visual upgrade

```javascript
export function applySynergyAwakenedState(node) {
  if (!node || !node.children) return false;
  
  try {
    // Find and enhance any secondary/internal geometry layers
    for (const child of node.children) {
      if (!child.userData) child.userData = {};
      
      // Look for internal/secondary layers (usually less visible)
      const isSecondaryLayer = 
        child.userData.visualLayer === 'INTERNAL' ||
        child.userData.type === 'internal' ||
        (child.material && child.material.opacity < 0.3);
      
      if (isSecondaryLayer && child.material) {
        // Store base opacity if not already stored
        if (child.userData.baseSynergyOpacity === undefined) {
          child.userData.baseSynergyOpacity = child.material.opacity;
        }
        
        // Increase visibility to reveal internal structure
        // Add 15% opacity boost (subtle but visible)
        child.material.opacity = Math.min(1.0, child.userData.baseSynergyOpacity + 0.15);
        child.userData.synergizedOpacity = child.material.opacity;
      }
    }
    
    // Mark node as synergy-awakened
    node.userData.synergizedState = 'AWAKENED';
    node.userData.synergizedAt = Date.now();
    
    return true;
  } catch (err) {
    console.error('[NodeVisualStateBinder] Failed to apply synergy state', err.message);
    return false;
  }
}
```

**What to verify:**
- ✓ Detects internal layers (opacity < 0.3)
- ✓ Opacity boost: +0.15 (15%)
- ✓ Base stored for restoration
- ✓ State marked (synergizedState: 'AWAKENED')

---

### Location 2: New removeSynergyAwakenedState()
**Lines 565-583** — Synergy state removal

```javascript
export function removeSynergyAwakenedState(node) {
  if (!node || !node.children) return false;
  
  try {
    for (const child of node.children) {
      if (child.userData && child.userData.baseSynergyOpacity !== undefined && child.material) {
        // Restore original opacity
        child.material.opacity = child.userData.baseSynergyOpacity;
        delete child.userData.synergizedOpacity;
      }
    }
    
    node.userData.synergizedState = 'NORMAL';
    return true;
  } catch (err) {
    console.error('[NodeVisualStateBinder] Failed to remove synergy state', err.message);
    return false;
  }
}
```

**What to verify:**
- ✓ Restores base opacity
- ✓ Cleans up metadata
- ✓ Sets state to 'NORMAL'

---

### Location 3: New applyHarmonyStabilizedState()
**Lines 593-616** — Harmony node visual upgrade

```javascript
export function applyHarmonyStabilizedState(node) {
  if (!node) return false;
  
  try {
    if (!node.userData) node.userData = {};
    
    // Mark as harmony-stabilized
    node.userData.harmonyStabilized = true;
    node.userData.harmonyDampingFactor = 0.2;  // 20% motion damping
    node.userData.stabilizedAt = Date.now();
    
    // For any animated children, prepare dampening factors
    for (const child of node.children || []) {
      if (!child.userData) child.userData = {};
      child.userData.harmonyDampingEnabled = true;
      child.userData.harmonyDampingFactor = 0.2;
    }
    
    return true;
  } catch (err) {
    console.error('[NodeVisualStateBinder] Failed to apply harmony state', err.message);
    return false;
  }
}
```

**What to verify:**
- ✓ Damping factor: 0.2 (20%)
- ✓ Applied to all children
- ✓ Flags set (harmonyDampingEnabled)

---

### Location 4: New removeHarmonyStabilizedState()
**Lines 625-646** — Harmony state removal

```javascript
export function removeHarmonyStabilizedState(node) {
  if (!node) return false;
  
  try {
    if (node.userData) {
      node.userData.harmonyStabilized = false;
      node.userData.harmonyDampingFactor = 0;
    }
    
    for (const child of node.children || []) {
      if (child.userData) {
        child.userData.harmonyDampingEnabled = false;
        child.userData.harmonyDampingFactor = 0;
      }
    }
    
    return true;
  } catch (err) {
    console.error('[NodeVisualStateBinder] Failed to remove harmony state', err.message);
    return false;
  }
}
```

**What to verify:**
- ✓ Clears damping factors
- ✓ Disables flags on all children

---

## File 3: NodeLinkingSystem.js

### Location 1: Enhanced updateLinkMetrics()
**Lines 3247-3302** — Main integration point for node visual upgrades

```javascript
updateLinkMetrics(link, metrics = {}) {
  if (!link || !link.id || !this.visuals) return;
  
  // Normalize metrics to 0-1 range if needed
  const normalized = {
    corruption: this._normalizeMetric(metrics.corruption),
    synergy: this._normalizeMetric(metrics.synergy),
    harmony: this._normalizeMetric(metrics.harmony)
  };
  
  // Pass to visual system for real-time color/pulse updates
  this.visuals.updateLinkState(link.id, normalized);
  
  // [SYNERGY/HARMONY UPGRADE] Apply node visual upgrades based on metric thresholds
  // Both upgrades activate together from the same check
  if (link.source && link.target) {
    const isSynergyAwakened = normalized.synergy >= 0.85;
    const isHarmonyStabilized = normalized.harmony >= 0.80;
    
    // Synergy: Reveal internal node geometry
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
    
    // Harmony: Stabilize node motion and oscillations
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
}
```

**What to verify:**
- ✓ Thresholds: 0.85 (synergy), 0.80 (harmony)
- ✓ Applies to BOTH source and target nodes
- ✓ Removes state when thresholds drop
- ✓ No duplicate application (checks existing state)

---

### Location 2: _applySynergyToNode()
**Lines 3309-3336** — Apply synergy to node

```javascript
_applySynergyToNode(node) {
  if (!node || !node.children) return;
  
  try {
    for (const child of node.children) {
      if (!child.userData) child.userData = {};
      
      // Detect internal/secondary layers
      const isInternal = 
        child.userData.visualLayer === 'INTERNAL' ||
        child.userData.type === 'internal' ||
        (child.material && child.material.opacity < 0.3);
      
      if (isInternal && child.material) {
        // Store base opacity
        if (child.userData.baseSynergyOpacity === undefined) {
          child.userData.baseSynergyOpacity = child.material.opacity;
        }
        // Increase visibility by 15%
        child.material.opacity = Math.min(1.0, child.userData.baseSynergyOpacity + 0.15);
      }
    }
    
    node.userData.synergizedState = 'AWAKENED';
  } catch (err) {
    console.error('[NodeLinkingSystem] Synergy application failed:', err.message);
  }
}
```

**What to verify:**
- ✓ Same logic as NodeVisualStateBinder version
- ✓ Detects internal layers
- ✓ Boost: +0.15 (15%)

---

### Location 3: _removeSynergyFromNode()
**Lines 3342-3355** — Remove synergy from node

```javascript
_removeSynergyFromNode(node) {
  if (!node || !node.children) return;
  
  try {
    for (const child of node.children) {
      if (child.userData && child.userData.baseSynergyOpacity !== undefined && child.material) {
        child.material.opacity = child.userData.baseSynergyOpacity;
      }
    }
    node.userData.synergizedState = 'NORMAL';
  } catch (err) {
    console.error('[NodeLinkingSystem] Synergy removal failed:', err.message);
  }
}
```

---

### Location 4: _applyHarmonyToNode()
**Lines 3362-3377** — Apply harmony to node

```javascript
_applyHarmonyToNode(node) {
  if (!node) return;
  
  try {
    node.userData.harmonyStabilized = true;
    node.userData.harmonyDampingFactor = 0.2;  // 20% damping
    
    for (const child of node.children || []) {
      if (!child.userData) child.userData = {};
      child.userData.harmonyDampingEnabled = true;
      child.userData.harmonyDampingFactor = 0.2;
    }
  } catch (err) {
    console.error('[NodeLinkingSystem] Harmony application failed:', err.message);
  }
}
```

**What to verify:**
- ✓ Damping: 0.2 (20%)
- ✓ Flags set on children

---

### Location 5: _removeHarmonyFromNode()
**Lines 3383-3399** — Remove harmony from node

```javascript
_removeHarmonyFromNode(node) {
  if (!node) return;
  
  try {
    node.userData.harmonyStabilized = false;
    node.userData.harmonyDampingFactor = 0;
    
    for (const child of node.children || []) {
      if (child.userData) {
        child.userData.harmonyDampingEnabled = false;
        child.userData.harmonyDampingFactor = 0;
      }
    }
  } catch (err) {
    console.error('[NodeLinkingSystem] Harmony removal failed:', err.message);
  }
}
```

---

## Summary Table

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| State flags | NeonLinkVisuals.js | 874-895 | Set isSynergyAwakened, isHarmonyStabilized |
| Link visuals | NeonLinkVisuals.js | 960-989 | Call new visual methods in update loop |
| Link synergy | NeonLinkVisuals.js | 1012-1044 | Apply opacity boost (+8%) |
| Link harmony | NeonLinkVisuals.js | 1046-1082 | Apply motion damping (15%) |
| Node synergy app | NodeVisualStateBinder.js | 520-556 | Reveal internal layers (+15%) |
| Node synergy rem | NodeVisualStateBinder.js | 565-583 | Remove synergy state |
| Node harmony app | NodeVisualStateBinder.js | 593-616 | Enable motion damping (20%) |
| Node harmony rem | NodeVisualStateBinder.js | 625-646 | Disable motion damping |
| Main integration | NodeLinkingSystem.js | 3247-3302 | UPDATE_LINKMETRICS - main entry point |
| Node synergy 1 | NodeLinkingSystem.js | 3309-3336 | Apply synergy to node |
| Node synergy 2 | NodeLinkingSystem.js | 3342-3355 | Remove synergy from node |
| Node harmony 1 | NodeLinkingSystem.js | 3362-3377 | Apply harmony to node |
| Node harmony 2 | NodeLinkingSystem.js | 3383-3399 | Remove harmony from node |

---

## Quick Navigation

**To test synergy:** Look at lines 3247-3302 in NodeLinkingSystem.js
**To test harmony:** Same location, second half
**To verify link visuals:** Lines 960-1082 in NeonLinkVisuals.js
**To verify node visuals:** Lines 520-646 in NodeVisualStateBinder.js + 3309-3399 in NodeLinkingSystem.js
