# DRAW CALL DENSITY AUDIT - ATOMA

**Role:** Performance Auditor (Three.js)  
**Date:** 2026-02-23  
**Scope:** Read-only audit of ATOMA's rendering architecture  
**Objective:** Identify draw call drivers and top offenders for optimization planning

---

## EXECUTIVE SUMMARY

ATOMA's rendering architecture is a complex, multi-layered system with significant draw call pressure from:

1. **Nodes** (primary draw call source) - Multiple meshes per node with unique materials
2. **Auras** (heavy contributor) - ShaderMaterial instances per node with additive blending
3. **Links** (variable pressure) - LineBasicMaterial instances with potential duplication
4. **Glyphs** (medium pressure) - Procedural/Composite glyph systems with dynamic generation
5. **Particles** (highly variable) - Cascade/Link/Healing particle systems with pooling

**Critical Finding:** ATOMA lacks **material sharing** and **geometry instancing**. Each node, aura, and link creates its own material instance, leading to 1:1 draw call ratio in worst cases.

---

## 1. RENDER METRICS SOURCES

### 1.1 Primary Metrics Location

```javascript
// Renderer statistics (standard Three.js API)
window.game.renderer.info.render.calls    // Total draw calls per frame
window.game.renderer.info.render.triangles // Total triangles rendered
window.game.renderer.info.render.points    // Points rendered (if any)
window.game.renderer.info.render.lines     // Lines rendered
window.game.renderer.info.memory.geometries // Geometry count in memory
window.game.renderer.info.memory.textures   // Texture count in memory
```

**File:** `main.js` (initialization), accessible globally via `window.game.renderer`

### 1.2 Performance Profiling Infrastructure

```javascript
// AINodes profiling (when enabled)
window.__ATOMA_PROFILE__ = true;  // Enable profiling flag
window.__atomaProfile.aiNodes       // Stores profiling data per section

// Access profiling data
window.dumpAiNodesProfile();  // Dump profiling table to console
```

**File:** `AINodes.js` (lines ~2300-2400)

### 1.3 Debug/Console APIs

```javascript
// Available debug APIs
window.ATOMA_DEBUG_SPAWN_LOGS      // Enable spawn logging
window.ATOMA_DEBUG_LINK_SPAWN       // Enable link spawn trace
window.__SPAWN_DIAG                 // Spawn diagnostics tracking
window.debugSpawnPools()            // Show spawn pool statistics
window.debugComparePoolsVsRegistry() // Compare pools vs registry
window.ATOMA_DEBUG.getNodeCount()   // Get current node count
window.ATOMA_DEBUG.getSpawnStats()  // Get spawn statistics
```

---

## 2. SCENE GRAPH OWNERSHIP MAP

### 2.1 Scene Root Location

**Primary Scene:** `window.game.scene`

- Initialized in `main.js` during world setup
- All rendering subsystems attach to this root
- No hierarchical partitioning (no nodeRoot/worldRoot separation for rendering)

### 2.2 Attachment Points by System

| System | Attachment Method | Scene Parent | File Location |
|--------|-------------------|--------------|----------------|
| **Nodes** | `this.scene.add(node)` | `window.game.scene` | `AINodes.js:_finalizeSpawnedNode()` |
| **Links** | `this.scene.add(line)` | `window.game.scene` | `AINodes.js:createConnection()` |
| **Node Auras** | `this.scene.add(mesh)` | `window.game.scene` | `NodeAuraSystem_v1.js:registerNode()` |
| **Link Auras** | `this.scene.add(mesh)` | `window.game.scene` | `LinkAuraSystem_v1.js:createAura()` |
| **Glyphs** | `this.scene.add(mesh)` | `window.game.scene` | `AtomaGlyphSystem3_0/4_0.js` |
| **Particles** | `this.scene.add(mesh)` | `window.game.scene` | `CascadeParticleSystem_Session120.js` |
| **Synergy FX** | `this.scene.add(mesh)` | `window.game.scene` | `SynergyVFX1_0.js` |
| **Harmony Auras** | `this.scene.add(mesh)` | `window.game.scene` | `HarmonyAuraController.js` |

### 2.3 Node Visual Hierarchy

Each node is a THREE.Object3D containing:

```
nodeRoot (Object3D)
├── coreMesh (Mesh) - [Material: MeshBasicMaterial/ShaderMaterial]
├── holoShell (Mesh) - [Material: ShaderMaterial - CoreHologramShader]
├── auraMesh (Mesh) - [Material: ShaderMaterial - NodeAuraSystem]
├── edgeGlow (LineSegments) - [Material: LineBasicMaterial]
├── particles (Array of Mesh) - [Material: MeshBasicMaterial]
├── orbitRings (Array of Mesh) - [Material: MeshBasicMaterial]
├── interactionProxy (Object3D) - [No renderable]
└── userData (metadata)
```

**Critical Issue:** Each mesh has its own material instance → 1 draw call per mesh type per node.

---

## 3. DRAW CALL HOTSPOTS ANALYSIS

### 3.1 Nodes (PRIMARY HOTSPOT)

**Factory Location:** `EnhancedNodeModels.js`  
**Spawning Logic:** `AINodes.js:createNode()` (lines ~500-1200)

**Draw Call Impact:**
- Base node: 2-3 meshes (core + hologram shell)
- Edge glow: 1 LineSegments per node (if enabled)
- VFX layers: 0-3 additional meshes (particles, rings, halo)
- **Estimated:** 3-6 draw calls per node

**Material Pattern:**
```javascript
// Each node creates unique material instances
const coreMaterial = new THREE.MeshBasicMaterial({ color: coreColor });
const holoMaterial = new THREE.ShaderMaterial({ ... }); // ShaderMaterial
const edgeMaterial = new THREE.LineBasicMaterial({ ... }); // LineBasicMaterial
```

**Top Offender Reasons:**
1. No material sharing across nodes of same category
2. Each node's core color creates unique Material instance
3. Hologram shell material created per node (not shared)
4. Edge glow material not reused

**Potential Reduction:** 70-80% via material sharing + instancing

---

### 3.2 Node Auras (SECONDARY HOTSPOT)

**Factory Location:** `NodeAuraSystem_v1.js`  
**Spawning Logic:** `registerNode()` (lines ~500-550)

**Draw Call Impact:**
- 1 aura mesh per node (IcosahedronGeometry)
- 6 profile types (clarity, resonance, chaos, focus, corruption, entropy)
- **Estimated:** 1 draw call per active aura

**Material Pattern:**
```javascript
// Each aura gets unique ShaderMaterial instance
const material = new THREE.ShaderMaterial({
  uniforms: { ... },
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthTest: false,
  depthWrite: false
});
```

**Top Offender Reasons:**
1. One material instance per aura (no profile-level sharing)
2. Additive blending prevents automatic batching
3. `depthTest: false` breaks depth sorting optimizations
4. Dynamic uniforms prevent material merging

**Profile Distribution:**
- 6 unique shader materials (one per profile type)
- Could be reduced to 6 shared materials with uniform updates

**Potential Reduction:** 85-90% via profile-level material sharing

---

### 3.3 Links (TERTIARY HOTSPOT)

**Factory Location:** `AINodes.js:createConnection()` (lines ~1400-1450)  
**Link Aura System:** `LinkAuraSystem_v1.js`

**Draw Call Impact:**
- Base link: 1 LineBasicMaterial (Line geometry)
- Link aura: 1 ShaderMaterial (if enabled)
- Link trail particles: 0-10 meshes (if enabled)
- **Estimated:** 1-3 draw calls per link

**Material Pattern:**
```javascript
// Each link creates unique LineBasicMaterial
const material = new THREE.LineBasicMaterial({
  color: 0x00ffff,
  transparent: true,
  opacity: 0
});

// Link aura creates unique ShaderMaterial
const auraMaterial = new THREE.ShaderMaterial({
  transparent: true,
  blending: THREE.AdditiveBlending
});
```

**Top Offender Reasons:**
1. No material sharing across links
2. LineBasicMaterial opacity updates per link prevent batching
3. Link aura instances not shared

**Potential Reduction:** 80% via material sharing + merged line geometry

---

### 3.4 Glyphs (VARIABLE PRESSURE)

**Factory Locations:**
- `AtomaGlyphSystem3_0.js`, `AtomaGlyphSystem4_0.js`
- `ProceduralHarmonicGlyphGenerator.js`
- `CompositeGlyphGenerator.js`

**Draw Call Impact:**
- Procedural glyphs: 1-2 meshes per glyph
- Composite glyphs: 3-5 merged meshes per fusion zone
- **Estimated:** 1-5 draw calls per active glyph/fusion

**Material Pattern:**
```javascript
// Procedural glyphs create unique materials
const glyphMaterial = new THREE.MeshBasicMaterial({
  color: glyphColor,
  transparent: true,
  opacity: 0.8
});

// Composite glyphs may reuse materials but not consistently
```

**Top Offender Reasons:**
1. Inconsistent material sharing across glyph types
2. Procedural generation creates unique instances
3. No instancing for repeated glyph patterns

**Potential Reduction:** 60-70% via material sharing + instancing

---

### 3.5 Particles (HIGHLY VARIABLE)

**Factory Locations:**
- `CascadeParticleSystem_Session120.js`
- `LinkTrailParticleSystem.js`
- `HealingParticleSystem_Session136.js`
- `ParticleTrailSystem_Session122.js`

**Draw Call Impact:**
- Active particles: 1 draw call per particle pool (if using Points)
- Individual particle meshes: 1 draw call per mesh (if using Mesh particles)
- **Estimated:** 1-50 draw calls (highly dependent on particle count)

**Material Pattern:**
```javascript
// Point-based particles (more efficient)
const particleMaterial = new THREE.PointsMaterial({
  color: particleColor,
  size: 0.1,
  transparent: true,
  opacity: 0.8
});

// Mesh-based particles (less efficient)
const meshMaterial = new THREE.MeshBasicMaterial({
  color: particleColor,
  transparent: true
});
```

**Top Offender Reasons:**
1. Mixed particle systems (Points vs Mesh)
2. Particle pools not consistently using instancing
3. Trail systems create unique geometries per trail

**Potential Reduction:** 40-50% via unified Points system + material sharing

---

## 4. MATERIAL USAGE PATTERNS

### 4.1 Material Types Found

| Material Type | Usage | Count Estimate | Unique Instances |
|---------------|-------|-----------------|------------------|
| **MeshBasicMaterial** | Node cores, particles, glyphs | 40-60% of draw calls | ~1 per object |
| **ShaderMaterial** | Hologram shells, auras, VFX | 20-30% of draw calls | ~1 per object/profile |
| **LineBasicMaterial** | Links, edge glow | 10-15% of draw calls | ~1 per line |
| **PointsMaterial** | Particle systems | 5-10% of draw calls | ~1 per pool |

### 4.2 Transparency Distribution

- **Opaque:** Node core meshes (30-40%)
- **Transparent:** Auras, particles, glyphs, links (60-70%)
- **Additive Blending:** Auras, synergy FX (20-30%)

**Impact:** High transparency count prevents automatic draw call batching by Three.js.

### 4.3 Material Sharing Status

| System | Shared Materials? | Status |
|--------|-------------------|--------|
| **Node Cores** | ❌ No | Unique material per node |
| **Hologram Shells** | ❌ No | Unique material per node |
| **Node Auras** | ❌ No | Unique material per aura |
| **Links** | ❌ No | Unique material per link |
| **Glyphs** | ⚠️ Partial | Some sharing in composite system |
| **Particles** | ✅ Yes (PointsMaterial) | Shared per pool |

---

## 5. TOP OFFENDER TABLE TEMPLATE

### 5.1 One-Shot Audit Script

```javascript
/**
 * DRAW CALL DENSITY AUDIT - ONE-SHOT SNAPSHOT
 * Run in browser console to capture current draw call distribution
 */
window.drawCallAudit = function() {
  const scene = window.game?.scene;
  if (!scene) {
    console.error('Scene not found');
    return;
  }

  // Group by (material.uuid, geometry.uuid, type)
  const drawCallGroups = new Map();
  const materials = new Set();
  const geometries = new Set();
  const transparentMaterials = new Set();

  let meshCount = 0;
  let lineCount = 0;
  let pointsCount = 0;

  scene.traverse(obj => {
    if (obj.isMesh) {
      meshCount++;
      const mat = obj.material;
      const geo = obj.geometry;
      if (mat) materials.add(mat.uuid);
      if (geo) geometries.add(geo.uuid);
      if (mat && mat.transparent) transparentMaterials.add(mat.uuid);

      const groupKey = `${mat?.uuid || 'none'}|${geo?.uuid || 'none'}|mesh`;
      drawCallGroups.set(groupKey, (drawCallGroups.get(groupKey) || 0) + 1);
    }
    else if (obj.isLine) {
      lineCount++;
      const mat = obj.material;
      const geo = obj.geometry;
      if (mat) materials.add(mat.uuid);
      if (geo) geometries.add(geo.uuid);
      if (mat && mat.transparent) transparentMaterials.add(mat.uuid);

      const groupKey = `${mat?.uuid || 'none'}|${geo?.uuid || 'none'}|line`;
      drawCallGroups.set(groupKey, (drawCallGroups.get(groupKey) || 0) + 1);
    }
    else if (obj.isPoints) {
      pointsCount++;
      const mat = obj.material;
      const geo = obj.geometry;
      if (mat) materials.add(mat.uuid);
      if (geo) geometries.add(geo.uuid);
      if (mat && mat.transparent) transparentMaterials.add(mat.uuid);

      const groupKey = `${mat?.uuid || 'none'}|${geo?.uuid || 'none'}|points`;
      drawCallGroups.set(groupKey, (drawCallGroups.get(groupKey) || 0) + 1);
    }
  });

  // Sort by count (descending)
  const sortedGroups = Array.from(drawCallGroups.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  // Build offender table
  const offenders = sortedGroups.map(([key, count]) => {
    const [matUuid, geoUuid, type] = key.split('|');
    
    // Find object example for metadata
    let exampleObj = null;
    scene.traverse(obj => {
      if ((obj.isMesh && type === 'mesh') ||
          (obj.isLine && type === 'line') ||
          (obj.isPoints && type === 'points')) {
        if (obj.material?.uuid === matUuid && obj.geometry?.uuid === geoUuid) {
          exampleObj = obj;
          return true;
        }
      }
    });

    return {
      rank: sortedGroups.findIndex(g => g[0] === key) + 1,
      drawCallCount: count,
      type: type,
      materialUuid: matUuid,
      geometryUuid: geoUuid,
      transparent: exampleObj?.material?.transparent || false,
      blending: exampleObj?.material?.blending || 'NormalBlending',
      exampleName: exampleObj?.name || 'unnamed',
      exampleLayer: exampleObj?.userData?.visualLayer || 'unknown',
      ownerSystem: _inferOwnerSystem(exampleObj)
    };
  });

  // Collect renderer stats
  const renderer = window.game?.renderer;
  const renderInfo = renderer?.info?.render || {};
  const memoryInfo = renderer?.info?.memory || {};

  // Print report
  console.group('📊 DRAW CALL DENSITY AUDIT REPORT');
  console.log('=== RENDERER METRICS ===');
  console.table({
    'Draw Calls': renderInfo.calls,
    'Triangles': renderInfo.triangles,
    'Points': renderInfo.points,
    'Lines': renderInfo.lines,
    'Geometries': memoryInfo.geometries,
    'Textures': memoryInfo.textures
  });

  console.log('\n=== SCENE STATISTICS ===');
  console.table({
    'Meshes': meshCount,
    'Lines': lineCount,
    'Points': pointsCount,
    'Total Renderables': meshCount + lineCount + pointsCount,
    'Unique Materials': materials.size,
    'Unique Geometries': geometries.size,
    'Transparent Materials': transparentMaterials.size
  });

  console.log('\n=== TOP 20 DRAW CALL SOURCES ===');
  console.table(offenders, [
    'rank', 'drawCallCount', 'type', 'transparent', 
    'blending', 'exampleLayer', 'ownerSystem'
  ]);

  console.groupEnd();

  return {
    rendererStats: renderInfo,
    sceneStats: {
      meshCount, lineCount, pointsCount,
      uniqueMaterials: materials.size,
      uniqueGeometries: geometries.size,
      transparentMaterials: transparentMaterials.size
    },
    topOffenders: offenders
  };
};

/**
 * Helper: Infer owner system from object metadata
 */
function _inferOwnerSystem(obj) {
  if (!obj || !obj.userData) return 'unknown';
  
  const ud = obj.userData;
  
  if (ud.isAura === true) return 'NodeAuraSystem_v1';
  if (ud.isShell === true || ud.isHologramShell === true) return 'CoreHologramShader';
  if (ud.isGlyph === true) return 'AtomaGlyphSystem';
  if (ud.isParticle === true) return 'CascadeParticleSystem';
  if (ud.visualLayer === 'AURA' && ud.node) return 'NodeAuraSystem_v1';
  if (ud.visualLayer === 'LINK_AURA') return 'LinkAuraSystem_v1';
  if (ud.visualLayer === 'CORE' && obj.isMesh) return 'EnhancedNodeModels';
  if (obj.isLine && ud.node1 && ud.node2) return 'AINodes (Links)';
  if (obj.isPoints) return 'ParticleSystem';
  
  return 'unknown';
}
```

### 5.2 How to Use

1. Open ATOMA in browser (F12 dev console)
2. Load a world with active nodes/links
3. Run: `window.drawCallAudit()`
4. Review printed report tables
5. Investigate top offenders with `scene.traverse()` debugging

---

## 6. ACTIONABLE FIXES LIST

### 6.1 High Impact (Quick Wins)

#### 6.1.1 Material Sharing - Node Cores
**Priority:** CRITICAL  
**Estimated Reduction:** 40-50% draw calls  
**Implementation:**

```javascript
// In EnhancedNodeModels.js
const CATEGORY_MATERIALS = {
  'input': new THREE.MeshBasicMaterial({ color: 0x00dddd }),
  'process': new THREE.MeshBasicMaterial({ color: 0x0066ff }),
  'integration': new THREE.MeshBasicMaterial({ color: 0xaa00ff }),
  // ... all 11 categories
};

// Reuse materials instead of creating new instances
const material = CATEGORY_MATERIALS[category];
```

**Files:** `EnhancedNodeModels.js` (factory methods)

---

#### 6.1.2 Material Sharing - Node Auras
**Priority:** CRITICAL  
**Estimated Reduction:** 85-90% draw calls  
**Implementation:**

```javascript
// In NodeAuraSystem_v1.js
const AURA_PROFILE_MATERIALS = {
  'clarity_aura': null,
  'resonance_aura': null,
  // ... 6 profiles
};

// Initialize once in constructor
_buildProfileMaterials() {
  for (const profileId in this.profileLibrary) {
    AURA_PROFILE_MATERIALS[profileId] = this._buildAuraMaterial(profileId);
  }
}

// Reuse shared material per profile
registerNode(node) {
  const profileId = this.profileResolver(node);
  const material = AURA_PROFILE_MATERIALS[profileId];
  // Create mesh with shared material
  const mesh = new THREE.Mesh(this.auraGeometry, material);
}
```

**Files:** `NodeAuraSystem_v1.js` (constructor, registerNode)

---

#### 6.1.3 Material Sharing - Links
**Priority:** HIGH  
**Estimated Reduction:** 70-80% draw calls  
**Implementation:**

```javascript
// In AINodes.js
const LINK_MATERIAL = new THREE.LineBasicMaterial({
  color: 0x00ffff,
  transparent: true,
  opacity: 0
});

createConnection(node1, node2) {
  const material = LINK_MATERIAL; // Reuse shared material
  const line = new THREE.Line(geometry, material);
}
```

**Files:** `AINodes.js` (createConnection)

---

### 6.2 Medium Impact (Architecture Changes)

#### 6.2.1 Geometry Instancing - Nodes
**Priority:** HIGH  
**Estimated Reduction:** 60-70% draw calls  
**Complexity:** Moderate  
**Implementation:**

- Use `THREE.InstancedMesh` for node cores
- Create one InstancedMesh per category (11 total)
- Update instance matrices per frame
- Requires refactor of EnhancedNodeModels

**Files:** `EnhancedNodeModels.js` (complete refactor), `AINodes.js` (update logic)

---

#### 6.2.2 Merged Line Geometry - Links
**Priority:** MEDIUM  
**Estimated Reduction:** 80-90% link draw calls  
**Complexity:** Moderate  
**Implementation:**

- Merge all link line segments into single BufferGeometry
- Update geometry attributes when nodes move
- Single draw call for all links

**Files:** `AINodes.js` (createConnection, updateConnections)

---

#### 6.2.3 Particle System Unification
**Priority:** MEDIUM  
**Estimated Reduction:** 40-50% particle draw calls  
**Complexity:** Moderate  
**Implementation:**

- Consolidate all particle systems into single `THREE.Points`
- Use texture atlas for multiple particle types
- Shared PointsMaterial with color attribute per particle

**Files:** `CascadeParticleSystem_Session120.js`, `LinkTrailParticleSystem.js`, etc.

---

### 6.3 Low Impact (Optimization Tweaks)

#### 6.3.1 LOD Culling - Auras
**Priority:** LOW  
**Estimated Reduction:** 20-30% aura draw calls  
**Implementation:**

- Implement distance-based visibility gating
- Hide aura meshes beyond certain distance
- Already partially implemented in `AuraLODCulling.js`

**Files:** `NodeAuraSystem_v1.js` (update method)

---

#### 6.3.2 Limit Transparency - Edge Glow
**Priority:** LOW  
**Estimated Reduction:** 15-20% draw calls  
**Implementation:**

- Disable edge glow on distant nodes
- Use LOD system to toggle visibility

**Files:** `AINodes.js` (createNode - edge glow section)

---

#### 6.3.3 Frustum Culling Optimization
**Priority:** LOW  
**Estimated Reduction:** 10-15% draw calls  
**Implementation:**

- Enable frustum culling on all meshes (currently disabled on some)
- Update bounding spheres when objects animate

**Files:** Multiple (mesh creation points)

---

## 7. EXPECTED DRAW CALL DISTRIBUTION (Current vs Optimized)

### 7.1 Current State (Example: 100 nodes, 50 links)

```
Node Cores:           100 draw calls (1 per node)
Hologram Shells:      100 draw calls (1 per node)
Node Auras:           100 draw calls (1 per node)
Edge Glow:            100 draw calls (1 per node)
Links:                50 draw calls (1 per link)
Link Auras:           0-50 draw calls (if enabled)
Glyphs:               10-20 draw calls (variable)
Particles:            10-50 draw calls (variable)
────────────────────────────────────
TOTAL:                470-670 draw calls
```

### 7.2 Optimized State (Material Sharing Only)

```
Node Cores:           11 draw calls (1 per category, instanced)
Hologram Shells:      1 draw call (shared material)
Node Auras:           6 draw calls (1 per profile, shared material)
Edge Glow:            1 draw call (shared material)
Links:                1 draw call (merged geometry)
Link Auras:           1 draw call (shared material)
Glyphs:               2-5 draw calls (shared materials)
Particles:            2-3 draw calls (unified Points system)
────────────────────────────────────
TOTAL:                25-29 draw calls (95%+ reduction)
```

### 7.3 Fully Optimized State (Material Sharing + Instancing)

```
Node Cores:           11 draw calls (InstancedMesh per category)
Hologram Shells:      1 draw call (InstancedMesh, shared material)
Node Auras:           6 draw calls (InstancedMesh per profile, shared material)
Edge Glow:            1 draw call (InstancedMesh, shared material)
Links:                1 draw call (merged Line geometry)
Link Auras:           1 draw call (InstancedMesh, shared material)
Glyphs:               1-3 draw calls (InstancedMesh, shared materials)
Particles:            1 draw call (unified Points system)
────────────────────────────────────
TOTAL:                23-25 draw calls (98% reduction)
```

---

## 8. IMPLEMENTATION ROADMAP

### Phase 1: Material Sharing (Week 1-2)
- [ ] Implement category-level material sharing for node cores
- [ ] Implement profile-level material sharing for node auras
- [ ] Implement shared material for links
- [ ] Benchmark: Target 80% draw call reduction

### Phase 2: Geometry Merging (Week 3-4)
- [ ] Merge all link lines into single BufferGeometry
- [ ] Merge edge glow geometries where possible
- [ ] Benchmark: Target additional 10% reduction

### Phase 3: Instancing (Week 5-6)
- [ ] Refactor EnhancedNodeModels to use InstancedMesh
- [ ] Refactor NodeAuraSystem_v1 to use InstancedMesh
- [ ] Benchmark: Target 95%+ total reduction

### Phase 4: Particle Unification (Week 7-8)
- [ ] Consolidate all particle systems
- [ ] Implement unified Points system
- [ ] Benchmark: Target 98% total reduction

---

## 9. TESTING & VALIDATION

### 9.1 Benchmark Script

```javascript
// Run after each optimization phase
window.benchmarkDrawCalls = function() {
  const initial = window.drawCallAudit();
  console.log('Initial draw calls:', initial.rendererStats.calls);
  
  // Simulate typical gameplay
  // ...
  
  const optimized = window.drawCallAudit();
  console.log('Optimized draw calls:', optimized.rendererStats.calls);
  console.log('Reduction:', 
    ((1 - optimized.rendererStats.calls / initial.rendererStats.calls) * 100).toFixed(1) + '%'
  );
};
```

### 9.2 Regression Tests

- [ ] Verify visual fidelity remains identical
- [ ] Verify transparency/blending behavior unchanged
- [ ] Verify all interactive features work correctly
- [ ] Verify no memory leaks (dispose called correctly)
- [ ] Verify performance under load (200+ nodes)

---

## 10. CONCLUSION

ATOMA's draw call density is primarily driven by **lack of material sharing** and **no instancing**. The codebase creates unique material instances for every node, aura, and link, leading to near-worst-case draw call counts.

**Recommended Action Plan:**

1. **Immediate (Phase 1):** Implement material sharing for top 3 offenders (node cores, auras, links)
   - Expected impact: 80% draw call reduction
   - Complexity: Low
   - Risk: Low

2. **Short-term (Phase 2):** Merge link geometry
   - Expected impact: Additional 10% reduction
   - Complexity: Moderate
   - Risk: Low

3. **Medium-term (Phase 3):** Implement instancing for nodes and auras
   - Expected impact: 95%+ total reduction
   - Complexity: High
   - Risk: Moderate (requires careful testing)

4. **Long-term (Phase 4):** Unify particle systems
   - Expected impact: 98% total reduction
   - Complexity: High
   - Risk: Moderate

**Critical Path:** Phase 1 → Phase 2 → Phase 3 → Phase 4

---

**Appendix A: File Line Ranges for Key Systems**

| System | File | Key Method Lines |
|--------|------|------------------|
| Node Creation | `AINodes.js` | `createNode()`: 500-1200, `spawnNode()`: 1400-2000 |
| Node Auras | `NodeAuraSystem_v1.js` | `registerNode()`: 500-550, `_buildAuraMaterial()`: 200-350 |
| Link Creation | `AINodes.js` | `createConnection()`: 1400-1450 |
| Hologram Shells | `CoreHologramShader.js` | `createHologramShell()`: 100-250 |
| Enhanced Node Models | `EnhancedNodeModels.js` | `create()`: 50-500 (per category) |
| Cascade Particles | `CascadeParticleSystem_Session120.js` | `emitParticle()`: 200-300 |

---

**End of Audit Report**

*This is a read-only analysis document. No code changes were made.*