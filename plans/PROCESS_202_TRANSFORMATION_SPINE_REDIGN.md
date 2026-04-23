# PROCESS 202: Transformation Spine — Redesign Plan

## Objective
Redesign `createProcessTransformationSpine` (visual code 202, category `process`) to be the most visually striking first-contact process node in the game. Must feel like a modern atom — energetic, mystical, asymmetric, and epic. No primitive geometries (sphere, box, icosahedron). Builder name, node name, and visual code must remain unchanged.

---

## Current State Analysis

**Builder**: `createProcessTransformationSpine`
**Visual Code**: 202
**Category**: `process`
**Node Geometry Name**: `PROCESS_TRANSFORMATION_SPINE`

**Current Visuals**:
- 7 octagonal cylinder segments stacked vertically
- Central connecting axis (cylinder)
- Connector rings (torus) between segments
- Simple `MeshStandardMaterial` with metalness 0.75
- Animation: slow axial rotation + 2% breathing scale

**Problems**:
- Too subtle, too symmetric
- Uses primitive geometries (cylinder, torus)
- No layered depth (single material, no aura)
- No mystique or energy feeling
- Does not communicate "transformation" visually

---

## Reference Patterns from Top Categories

### Emotional (e.g. `createEmotionalHeartCrystal`)
- **Layers**: CORE_GROUP → SHRINE_GROUP → VENERATION_GROUP → AURA_GROUP
- **Materials**: `MeshPhysicalMaterial` with emissive, transmission, IOR
- **Effects**: hologram shells, neon edge glow, devotional dust particles
- **Palette**: multi-color lerp (ivory, rose, cyan, violet)
- **Depth**: 4 visual layers with different opacity and renderOrder

### Sigma (e.g. `createSigmaNodeStyled_v2`)
- **Geometry**: vertex-displaced icosahedron (fracture + choir bias)
- **Field**: broken orbital arcs with different speeds, asymmetric beacon crown
- **Materials**: custom collapse shader with uniforms
- **Asymmetry**: every shard/orbit has unique position, rotation, scale
- **Motion**: orbital rings with per-axis rotation speeds

### Error (e.g. `createErrorNodeStyled_v2`)
- **Variants**: 6 distinct visual layouts from one base
- **Structure**: CORE_GROUP + STRUCTURE_GROUP + DISTORTION_GROUP
- **Effects**: inner void, thin halo particles, shadow duplicates
- **Materials**: `MeshPhysicalMaterial` with clearcoat, `MeshBasicMaterial` for void

---

## New Visual Architecture: "Catalytic Transformation Helix"

### Concept
The old vertical spine silhouette is completely replaced. The node becomes a **catalytic helix** — an asymmetric, energy-charged spiral that visually communicates raw matter being transformed. Like watching a particle accelerator or a DNA strand made of liquid metal and light. The silhouette is intentionally broken, leaning, and dynamic — nothing like the old symmetric stack of cylinders.

### Layer Hierarchy
```
PROCESS_TRANSFORMATION_SPINE_NODE
├── CORE_GROUP          (deformed helix segments + catalytic shards)
├── FIELD_GROUP         (orbital arcs + energy conduits)
├── AURA_GROUP          (hologram shell + dust + edge glow)
```

### Geometry Strategy (No Primitives)
1. **Helix Segments**: Custom `LatheGeometry` or `TubeGeometry` along a parametric helix curve, then vertex-displaced with noise
2. **Catalytic Shards**: `OctahedronGeometry` (low-poly, not primitive sphere/box/icosahedron) with heavy vertex displacement
3. **Orbital Arcs**: `TorusGeometry` with partial arcs (`thetaLength < 2π`), different per ring
4. **Energy Conduits**: `TubeGeometry` along curved paths
5. **Dust**: `BufferGeometry` with random positions in helix volume

### Material Strategy
1. **Core Mat**: `MeshPhysicalMaterial`
   - High metalness (0.85), low roughness (0.12)
   - Emissive with color lerp toward cyan/white hot spots
   - Clearcoat for liquid-metal feel
2. **Shard Mat**: `MeshStandardMaterial` with higher emissiveIntensity
3. **Arc Mat**: `MeshBasicMaterial` transparent, low opacity
4. **Conduit Mat**: `LineBasicMaterial` with pulsing opacity
5. **Aura Shell**: Reuse `createNodeHologramShell` with process-tuned color
6. **Edge Glow**: Reuse `createNodeNeonEdgeGlowShell`
7. **Dust**: `PointsMaterial` with size attenuation

### Asymmetry & Mystique Design
- **Helix pitch varies**: segments get tighter toward the top (compression = transformation)
- **Shard placement**: random seed-based, no rotational symmetry
- **Orbital arcs**: 3 arcs with different radii, tilts, and rotation speeds
- **Color gradient**: base color → white-hot center → cyan edge (like plasma)
- **Scale progression**: segments grow slightly then shrink (hourglass = processing)

### Animation Metadata
```js
group.userData.helixRotationSpeed = 0.12;        // faster than old 0.08
group.userData.helixBreathingAmplitude = 0.04;   // 4% vs old 2%
group.userData.helixBreathingSpeed = 0.7;
group.userData.arcOrbitSpeeds = [0.05, 0.08, 0.12];
group.userData.shardPulseSpeed = 1.2;
group.userData.conduitFlowSpeed = 0.9;
```

---

## Implementation Steps

### Step 1: Cache Declaration
Add to top of `EnhancedNodeModels.js` near other PROCESS caches:
```js
const PROCESS_TRANSFORMATION_SPINE_CACHE = {
  helixSegmentGeometry: null,
  helixSegmentEdgesGeometry: null,
  shardGeometry: null,
  shardEdgesGeometry: null,
  arcGeometryA: null,
  arcGeometryB: null,
  arcGeometryC: null,
  conduitGeometry: null,
  dustGeometry: null
};
const PROCESS_TRANSFORMATION_SPINE_MATERIALS = new Map();
```

### Step 2: Geometry Cache Function
Create `_getProcessTransformationSpineGeometries()`:
- Build helix segment via `LatheGeometry` with profile curve
- Displace vertices with sine/cosine noise for organic feel
- Create edges geometry via `safeCreateEdgesGeometry`
- Build shards from `OctahedronGeometry` with displacement
- Build 3 partial torus arcs with different `thetaLength`
- Build conduit as `TubeGeometry` along `CatmullRomCurve3`
- Build dust as `BufferGeometry` with points in helix volume

### Step 3: Material Cache Function
Create `_getProcessTransformationSpineMaterials(color)`:
- Use `MaterialCache.get()` for shared materials where possible
- Create `MeshPhysicalMaterial` for core with clearcoat
- Create `MeshStandardMaterial` for shards
- Create `MeshBasicMaterial` for arcs
- Create `LineBasicMaterial` for conduits
- Create `PointsMaterial` for dust
- Cache by color hex

### Step 4: Builder Rewrite
Rewrite `createProcessTransformationSpine(group, color)`:
- Create `processRoot` group with name `PROCESS_TRANSFORMATION_SPINE_NODE`
- Keep `userData.nodeGeometryName = 'PROCESS_TRANSFORMATION_SPINE'`
- Build CORE_GROUP with 5 helix segments (not 7), each with unique scale/rotation
- Build FIELD_GROUP with 3 orbital arcs + 2 energy conduits
- Build AURA_GROUP with hologram shell + edge glow + dust
- Set all `userData.visualCoreImmutable = true`
- Set animation metadata

### Step 5: Validation
- Verify builder name unchanged: `createProcessTransformationSpine`
- Verify visual code 202 still routes to this builder in `NodeVisualRegistry.js`
- Verify `nodeGeometryName` unchanged
- Verify no primitive geometries used (no `SphereGeometry`, `BoxGeometry`, `IcosahedronGeometry`)
- Verify materials registered in cache

---

## Visual Comparison

| Aspect | Old | New |
|--------|-----|-----|
| Shape | Vertical octagonal cylinders | Asymmetric catalytic helix |
| Symmetry | High (rotational) | Low (intentionally broken) |
| Materials | 1x MeshStandard | 5x Physical/Standard/Basic/Line/Points |
| Layers | 1 (segments + axis + rings) | 3 (core + field + aura) |
| Energy Feel | Static machinery | Living plasma accelerator |
| First Impression | Boring pipe | "What IS that?" |

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Performance (more geometry) | All cached, dust uses frustumCulled=false only on Points |
| Breaking existing animation | Keep old metadata keys + add new ones; old anim system ignores unknown keys |
| Color mismatch | Use same `color` parameter; lerp toward cyan/white, not replace |
| Hit proxy size change | Keep bounding sphere roughly same (~1.2 units) |

---

## Files to Modify

1. `EnhancedNodeModels.js`
   - Add cache declaration (~line 520 area)
   - Add `_getProcessTransformationSpineGeometries()`
   - Add `_getProcessTransformationSpineMaterials(color)`
   - Rewrite `createProcessTransformationSpine()`

2. `NodeVisualRegistry.js` — verify only, no changes needed (builder name unchanged)

---

## Innovation Budget

**Scope**: MEDIUM (refactor of one node builder within process subsystem)
**Impact**: Local to PROCESS 202 only
**No API changes**: Builder signature unchanged
**No breaking changes**: Existing nodes will rebuild with new visuals on next spawn

---

*Plan created by Architect mode. Ready for Code mode implementation.*
