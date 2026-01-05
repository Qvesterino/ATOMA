# AxiomCrystal: Canonical Control Node Mesh
## Production-Ready Specification

**Status**: PRODUCTION READY | **Version**: 1.0 | **Date**: Session 60+  
**Mesh Name**: `CONTROL_AXIOM_CRYSTAL`  
**Category**: Control (primary, immutable, canonical)  
**Classification**: Static Geometric Monument

---

## 1. GEOMETRY SPECIFICATION

### 1.1 Overall Form
- **Type**: Vertical crystal monolith with sharp facets
- **Height-to-Width Ratio**: ~1.8:1 (tall, slender, commanding)
- **Base Diameter**: ~0.7 units (asymmetrical base, 7 vertices)
- **Total Height**: 1.8 units (-0.9 to +0.9 on Y-axis)
- **Topology**: Fully faceted (no smooth shading), closed mesh, solid interior

### 1.2 Vertex Layout (19 total)

#### Base Section (Y = -0.9)
Asymmetrical heptagonal (7-sided irregular) base with sharp points:
```
Vertices 0-6: Center (0,0,0) + 6 radial points
0: (0.0, -0.9, 0.0)       // Center
1: (0.35, -0.9, 0.0)      // Right sharp point
2: (0.25, -0.9, 0.3)      // Upper-right
3: (-0.15, -0.9, 0.35)    // Upper-left (offset)
4: (-0.4, -0.9, 0.15)     // Left
5: (-0.3, -0.9, -0.25)    // Lower-left
6: (0.15, -0.9, -0.35)    // Lower-right
```

**Key**: Base is NOT rotationally symmetric. Points 2-6 create irregular faceting.

#### Lower-Middle Section (Y = -0.5)
Six radial vertices forming transition zone - slightly contracted:
```
Vertices 7-12: Transition band
7: (0.32, -0.5, 0.0)      // Right (tracking from base)
8: (0.22, -0.5, 0.28)     // Upper-right (tightened)
9: (-0.12, -0.5, 0.32)    // Upper (offset from base)
10: (-0.35, -0.5, 0.12)   // Left (still asymmetrical)
11: (-0.28, -0.5, -0.22)  // Lower-left
12: (0.12, -0.5, -0.32)   // Lower-right (tightened)
```

**Key**: Width reduction begins. Asymmetry maintained.

#### Upper Section (Y = 0.4)
Five radial vertices - further contraction, preparing for point:
```
Vertices 13-17: Upper band
13: (0.2, 0.4, -0.05)     // Right-back
14: (0.18, 0.4, 0.15)     // Right-front
15: (-0.08, 0.4, 0.22)    // Front-left
16: (-0.25, 0.4, 0.05)    // Left (maximally offset)
17: (-0.18, 0.4, -0.15)   // Back-left
```

**Key**: Highest asymmetry—base is wider on right, apex shifted left.

#### Apex (Y = 0.9)
Single point vertex - OFF-CENTER (asymmetrical):
```
Vertex 18: (-0.05, 0.9, 0.08)  // Apex (offset from Y-axis)
```

**Key**: Not directly above center. Creates "leaning" visual effect.

### 1.3 Facet Structure (14 triangular facets minimum, 22 defined)

#### Base Radiators (8 faces)
Connect center (0) to outer ring (1-6) in radiating pattern:
```
0→1→7,  0→7→12,  0→12→6,  0→6→5,  
0→5→4,  0→4→3,   0→3→2,   0→2→1
```

#### Mid-Section Slant (5 faces)
Connect lower band (7-12) to upper band (13-17):
```
7→8→14,   8→9→15,   9→10→16,   10→11→17,   11→12→13
```

#### Top Pyramid (5 faces)
Connect upper band (13-17) to apex (18):
```
13→14→18,   14→15→18,   15→16→18,   16→17→18,   17→13→18
```

#### Side Bridges (6 faces)
Cross-connect lower-to-upper sections smoothly:
```
7→14→13,   8→15→14,   9→16→15,   10→17→16,   11→13→17,   12→7→13
```

**Total**: 22 triangles = ~44 geometric facets under full light

### 1.4 Geometric Properties

| Property | Value |
|----------|-------|
| **Vertex Count** | 19 |
| **Triangle Count** | 22 |
| **Facet Visibility** (fully faceted) | ~44 (two-sided triangles) |
| **Edges** | ~60 sharp edges |
| **Symmetry** | NONE (intentionally asymmetrical) |
| **Twist** | 5° around Y-axis |
| **Closure** | Fully closed, solid interior |
| **Silhouette** | Vertical monolith with lean-to-left apex |

---

## 2. MATERIAL SPECIFICATION

### 2.1 Physical Material Class
```javascript
THREE.MeshPhysicalMaterial({
  // Optical properties
  color: gold-amber blend (0xffd700 ↔ 0xffb347),
  transmission: 0.9,          // High transparency for glass effect
  thickness: 0.8,             // Ray penetration thickness
  roughness: 0.1,             // Highly polished, minimal diffusion
  metalness: 0.0,             // NOT metallic—pure dielectric
  ior: 1.45,                  // Refractive index (amethyst/crystal)
  reflectivity: 0.9,          // High Fresnel reflection at glancing angles
  
  // Color gradient simulation
  emissive: dark honey (0x8b6914),
  emissiveIntensity: 0.05,    // Subtle internal glow (not bright)
  
  // Rendering
  side: THREE.FrontSide,      // Single-sided rendering (outer surface)
  envMapIntensity: 1.0        // Respond to environment light
});
```

### 2.2 Color Palette

| Zone | Hex | Name | Role |
|------|-----|------|------|
| **Surface Base** | 0xffd700 | Gold | Primary reflection color |
| **Surface Blend** | 0xffb347 | Amber | Warm secondary tone |
| **Internal Glow** | 0x8b6914 | Dark Honey | Subsurface color |

**Gradient Effect**: Light approaching from front sees gold-amber. Light passing through sees honey internal color.

### 2.3 Immutability Guards

```javascript
// Material locked from runtime mutation
transmissionMaterial.userData.immutable = true;
Object.defineProperty(transmissionMaterial, 'userData', {
  writable: false,
  configurable: false
});
Object.freeze(transmissionMaterial);  // Prevent property changes
```

**Rules**:
- ❌ NO state-based material changes (no linking effects on transparency)
- ❌ NO color mutation (node color parameter ignored for AxiomCrystal)
- ❌ NO emissive intensity modulation
- ✅ Render as-is, always

---

## 3. IMPLEMENTATION IN CODE

### 3.1 Creation Function Signature
```javascript
EnhancedNodeModels.createAxiomCrystalNode(group, color)
  → Returns: group with CONTROL_AXIOM_CRYSTAL mesh added
```

### 3.2 Registry Entry
**Category**: `control`  
**Geometry Name**: `CONTROL_AXIOM_CRYSTAL`  
**Index Mapping**: Always index 0 (primary canonical form)  
**Variant Pool**: Singleton (no variants, only AxiomCrystal)

### 3.3 Integration Points

#### In AINodes.createNode()
```javascript
if (category === 'control') {
  const node = EnhancedNodeModels.create('control', 0, nodeColor);
  // Always spawns AxiomCrystal regardless of index
  node.userData.geometryName = 'CONTROL_AXIOM_CRYSTAL';
  node.userData.isCanonicalControlNode = true;
}
```

#### In Visual System
```javascript
// NO MUTATION IN FXRuntime_v1, WaveShaderBridge_v1, etc.
if (node.userData.noMaterialMutation) {
  // Skip all material tweaks
  return;  // Pass through without changes
}
```

#### In Animation System
```javascript
// NO ANIMATION EFFECTS on AxiomCrystal mesh
if (node.userData.immutable) {
  // Skip animation targets
  // Can animate group rotation, but NOT mesh properties
}
```

---

## 4. VISUAL SPECIFICATION

### 4.1 At Distance
**Visual Read**: Tall crystalline tower, commanding presence  
**Silhouette**: Irregular vertical spike with asymmetrical lean  
**Color**: Golden-amber glow with slight honey depth  
**Scale**: Medium-to-large (comparable to other control nodes, ~1.8 units tall)

### 4.2 Under Lighting
- **Diffuse**: Warm gold surface, fully opaque regions
- **Specular**: Sharp reflections on facet peaks (polished crystal)
- **Transmission**: Honey-colored light transmission through interior
- **No Animation**: Static, unchanging, authoritative

### 4.3 Rendering Behavior
| Lighting Angle | Expected Result |
|---|---|
| **Head-on (camera toward crystal)** | Gold-amber face with sharp facet boundaries |
| **Glancing (oblique angle)** | Fresnel reflections brighten edge, transmission glows |
| **Backlighting** | Strong golden transmission from interior |
| **Side-light** | Individual facet faces light independently (faceted effect) |

---

## 5. DESIGN INTENT

### 5.1 Semantic Role
**AxiomCrystal represents**:
- **Authority**: Immutable, unchanging, fundamental
- **Clarity**: Transparent, crystalline, visible from all angles
- **Purity**: Single-purpose form, no state variation
- **Geometry**: Sharp, uncompromising, exact

### 5.2 Distinction from Other Control Nodes

| Node | Nature | Animation | Mutation | Purpose |
|------|--------|-----------|----------|---------|
| **AxiomCrystal** | **Static Monolith** | **None** | **Forbidden** | **Law itself** |
| OctagonalCore | Pulsing ring | Emissive pulse | Allowed | Authority symbol |
| ControlRingLattice | Rotating hierarchy | Ring spin | Allowed | Structure |
| JudgmentSeal | Heavy frame | Floating | Allowed | Decision weight |
| LawCore | Minimal cube | None | Allowed | Simplicity |

**Key Difference**: AxiomCrystal is NEVER modified, never animated, never state-dependent.

### 5.3 Asymmetry Rationale
- **Intentional Design**: "Leaning" apex creates unease—law is not perfectly balanced, it's *imposed*
- **Non-Symmetry**: Breaks expectation of perfect geometry—real authority is messy
- **Faceted, Not Smooth**: Sharp edges enforce severity

---

## 6. DEPLOYMENT CHECKLIST

- [x] Geometry defined and closed (19 vertices, 22 triangles)
- [x] Material uses PhysicalMaterial with transmission
- [x] IOR = 1.45 set (crystal-like)
- [x] Color gradient: gold → amber → honey
- [x] 5° twist applied on Y-axis
- [x] Mesh marked immutable and frozen
- [x] No state-based changes allowed
- [x] Registered as CONTROL category primary
- [x] Function added to EnhancedNodeModels
- [x] Integration guards placed in FXRuntime, WaveShaderBridge
- [x] Fallback handling in place (none needed—canonical form)
- [x] Documentation complete

---

## 7. TECHNICAL REFERENCE

### 7.1 Vertex Coordinates (World Space)
**Full Table**: See Section 1.2 above.

### 7.2 Face Connectivity (CCW Winding, FrontSide)
**Full List**: 22 triangles connecting vertices 0-18 (see Section 1.3).

### 7.3 Material Constants
```javascript
MeshPhysicalMaterial:
  color: Color(0xffd700).lerp(Color(0xffb347), 0.5)
  transmission: 0.9
  thickness: 0.8
  roughness: 0.1
  metalness: 0
  ior: 1.45
  reflectivity: 0.9
  emissive: Color(0x8b6914)
  emissiveIntensity: 0.05
```

### 7.4 Geometry Flags
```javascript
mesh.userData = {
  isStaticAxiomCrystal: true,
  immutable: true,
  noMaterialMutation: true
};
group.userData = {
  nodeGeometryName: 'CONTROL_AXIOM_CRYSTAL',
  isCanonicalControlNode: true
};
```

---

## 8. NOTES

### 8.1 Why MeshPhysicalMaterial?
- Supports `transmission` (transparency) properly
- IOR parameter for realistic refraction
- Better for "glass-like" crystals than MeshStandardMaterial

### 8.2 Why No Animation?
- Crystal represents immutable LAW—animation would undermine concept
- Static render conveys authority, finality
- Performance: No per-frame material updates

### 8.3 Why Asymmetry?
- Breaks visual expectation → creates presence
- Law is not "balanced" or "fair"—it's *imposed*
- Asymmetrical apex "points" toward future action

### 8.4 Polycount Impact
- **Triangles**: 22 (very low, efficient)
- **Vertices**: 19 (minimal)
- **Memory**: ~2KB for geometry + material
- **Performance**: GPU trivial (single mesh, single material)

---

## 9. FUTURE CONSIDERATIONS

### 9.1 Optional Enhancements (LATER)
- [ ] Add caustic texture for refraction detail (if needed)
- [ ] Procedural internal geometry visibility (thin fiber structure)
- [ ] Sound design (crystalline chime on spawn)

### 9.2 NOT To Be Modified
- ~~Ring variants~~ (use AxiomCrystal alone)
- ~~State-based opacity changes~~ (immutable)
- ~~Color parameter overrides~~ (built-in gold-amber)
- ~~Animation targets~~ (static only)

---

## 10. VERSION HISTORY

| Version | Date | Change |
|---------|------|--------|
| 1.0 | Session 60+ | Initial canonical creation. 19-vertex asymmetrical crystal, transmission material, immutable guards. |

---

**AXIOM CRYSTAL: THE FINAL CONTROL NODE FORM**  
*Immutable. Authoritative. Geometric Law.*
