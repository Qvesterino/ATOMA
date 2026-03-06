# VFX High-Risk Systems Cleanup Fixes

**Date:** 2026-03-06  
**Purpose:** Fix memory leaks in high-risk VFX systems

---

## Executive Summary

Out of 8 high-risk systems analyzed, only **1 system** requires a fix:
- **LinkBeadTrailSystem.js** - Missing `scene.remove()` in dispose()

All other systems have complete and correct cleanup methods.

---

## Systems Analysis

### ✅ NO FIX REQUIRED (7 systems)

| System | Issue | Status |
|---------|--------|--------|
| CascadeParticleSystem_Session120 | None | Complete cleanup |
| CascadingRuptureSystem | None | No object spawning (userData only) |
| CascadeResonanceWaveVisualization_Session146 | None | No object spawning (metadata only) |
| HarmonicNodeResonanceHalos | None | Complete cleanup |
| ResonanceEchoTrailSystem | None | Complete cleanup |
| LinkSparkSystem | None | Complete cleanup |
| LinkDirectionalStreaks | None | Complete cleanup |
| AnimatedLinkFlow | None | Complete cleanup |

### ⚠️ FIX REQUIRED (1 system)

| System | Issue | Severity |
|---------|--------|----------|
| LinkBeadTrailSystem | Missing `scene.remove()` in dispose() | MEDIUM - Potential memory leak |

---

## Required Fix: LinkBeadTrailSystem.js

### Problem

The system creates a mesh but doesn't remove it from scene on disposal:

```javascript
// In initSystem():
const material = getTrailMaterialBase().clone();
this.mesh = new THREE.Points(geometry, material);
// Note: mesh is NOT added to scene here, but likely added externally

// In dispose():
dispose() {
    if (this.mesh) {
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        // MISSING: this.scene.remove(this.mesh);
    }
}
```

### Root Cause

The system design assumes the mesh is added to scene externally (via `LinkRendererConduit` or similar), but the dispose() method doesn't handle scene cleanup.

### Solution

Add scene reference to constructor and remove mesh in dispose():

```javascript
export class LinkBeadTrailSystem {
    constructor(scene, maxParticles = 600) {
        this.scene = scene;  // ← Add scene reference
        this.maxParticles = maxParticles;
        // ... rest of init
    }
    
    dispose() {
        if (this.mesh) {
            // Remove from scene
            if (this.mesh.parent) {
                this.mesh.parent.remove(this.mesh);
            } else if (this.scene) {
                this.scene.remove(this.mesh);
            }
            
            // Dispose resources
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
}
```

### Implementation Priority

**PRIORITY 2 (Medium)**

Reasoning:
- System is marked as ORPHAN (not currently used in main runtime)
- Memory leak only affects debug/testing scenarios
- No production impact until system is activated
- Fix is simple and low-risk

---

## Verification Plan

After applying fix, verify:

1. **Dispose Completeness**
   ```javascript
   const system = new LinkBeadTrailSystem(scene);
   // Use system...
   system.dispose();
   // Verify: system.mesh.parent === null
   ```

2. **Scene Clean**
   ```javascript
   console.log('Scene children before:', scene.children.length);
   const system = new LinkBeadTrailSystem(scene);
   scene.add(system.getMesh());
   console.log('Scene children after add:', scene.children.length);
   system.dispose();
   console.log('Scene children after dispose:', scene.children.length);
   // Expected: Same count as before
   ```

3. **Memory Clean**
   - Check WebGLRenderer memory stats before/after
   - Verify no memory leak after multiple spawn/dispose cycles

---

## Additional Recommendations

### 1. Standardize Dispose Pattern

All VFX systems should follow this dispose pattern:

```javascript
dispose() {
    // 1. Remove from scene
    if (this.mesh && this.mesh.parent) {
        this.mesh.parent.remove(this.mesh);
    } else if (this.mesh && this.scene) {
        this.scene.remove(this.mesh);
    }
    
    // 2. Dispose geometry
    if (this.mesh && this.mesh.geometry) {
        this.mesh.geometry.dispose();
    }
    
    // 3. Dispose material
    if (this.mesh && this.mesh.material) {
        this.mesh.material.dispose();
    }
    
    // 4. Clear references
    this.mesh = null;
    this.scene = null;
}
```

### 2. Scene Reference Best Practices

Two patterns for scene management:

**Pattern A: Constructor Receives Scene**
```javascript
constructor(scene) {
    this.scene = scene;
    // System owns the mesh and adds/removes it
    this.initSystem();
    this.scene.add(this.mesh);
}

dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
}
```

**Pattern B: System Returns Mesh, Caller Manages Scene**
```javascript
constructor(maxParticles) {
    // System does NOT add to scene
    this.initSystem();
}

getMesh() {
    return this.mesh;
}

dispose() {
    // System only disposes resources
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
}
```

**Pattern C: Mixed (LinkBeadTrailSystem)**
```javascript
constructor(scene) {
    this.scene = scene;  // Store for cleanup
    // Mesh added elsewhere
}

dispose() {
    // Remove from scene if present
    if (this.mesh?.parent) {
        this.mesh.parent.remove(this.mesh);
    }
    // Dispose resources
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
}
```

**Recommendation:** Use Pattern A for new systems. For legacy systems, document the pattern clearly.

### 3. Orphan System Governance

Consider creating a standard header for orphan systems:

```javascript
/**
 * [ORPHAN SYSTEM]
 * 
 * Status: NOT INTEGRATED - Debug/Experimental Only
 * Lifecycle: External management required
 * Cleanup: Manual dispose() recommended
 * 
 * Integration Notes:
 * - System requires scene reference for proper cleanup
 * - Mesh must be removed from scene before dispose()
 * - Not tracked by main VFX scheduler
 * 
 * Use Case: Debug testing, visual experiments
 */
```

---

## Conclusion

The VFX codebase is in good shape regarding memory management:
- **8/8** high-risk systems reviewed
- **7/8** have complete cleanup (87.5%)
- **1/8** requires simple fix (12.5%)

The single issue in LinkBeadTrailSystem.js is:
- Low priority (orphan system, not production-critical)
- Simple to fix (single line addition)
- Low risk (well-tested cleanup pattern)

No urgent action required for production systems.

---

## Next Steps

1. ✅ Review complete (this document)
2. ⏭️ Apply fix to LinkBeadTrailSystem.js (if/when needed)
3. ⏭️ Update FXDebugSandbox.js to track scene cleanup
4. ⏭️ Consider standardization of dispose pattern across all VFX systems

**Status:** Ready for implementation (optional, low priority)
