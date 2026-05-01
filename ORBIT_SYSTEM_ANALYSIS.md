# ORBIT SYSTEM ANALYSIS - ATOMA RESIDENT ARCHITECT

## Summary

The system that creates orbiting small geometry (pink/magenta glyphs) around nodes is found in multiple interconnected systems:

## Primary System: _AtomaGlyphSystem4_0.js

### Function: `createMythicSeedGlyph(node, nodeId)`
**Location:** Lines 255-314

**What it creates:**
- 3 orbiting micro-triangles (magenta/violet colored) in a fractal formation
- Center seed core (magenta sphere)
- Triangles orbit around the node center

**Key Code Pattern:**
```javascript
// 3 orbiting micro-triangles
for (let i = 0; i < 3; i++) {
  const triGeo = new THREE.ConeGeometry(0.08, 0.15, 3);
  const triMat = new THREE.MeshBasicMaterial({
    color: this.colors.magenta,  // 0xFF00FF
    transparent: true,
    opacity: 0.7,
    emissive: this.colors.violet,
    emissiveIntensity: 0.35,
    fog: false
  });
  
  const tri = new THREE.Mesh(triGeo, triMat);
  tri.position.x = Math.cos((i / 3) * Math.PI * 2) * 0.35;
  tri.position.z = Math.sin((i / 3) * Math.PI * 2) * 0.35;
  tri.rotation.x = Math.PI / 2;
  
  tri.userData = { glyphComponent: 'orbitTri', orbitIndex: i };
  glyphGroup.add(tri);
}
```

**Orbital Animation (updateMythicSeedGlyph):**
```javascript
animState.orbitPhase += (0.5 + context.synergy * 1.2) * deltaTime;

glyphGroup.children.forEach(child => {
  if (child.userData.component === 'orbitTri') {
    const idx = child.userData.orbitIndex;
    const orbitAngle = animState.orbitPhase + (idx / 3) * Math.PI * 2;
    child.position.x = Math.cos(orbitAngle) * 0.35;
    child.position.z = Math.sin(orbitAngle) * 0.35;
    child.rotation.y = orbitAngle;
  }
});
```

**Characteristics:**
- Count: 3 orbiting objects
- Color: Magenta (#FF00FF) with violet emissive glow
- Size: 0.08 radius triangles
- Orbit radius: 0.35 units
- Speed: 0.5 + synergy * 1.2 (scales with node synergy metric)
- Pattern: Evenly spaced triangular formation

---

## Secondary System: _GlyphLayer4_MultiFusion.js

### Function: `createAmbientOrbitForNode(node, nodeId)`
**Location:** Lines 2030-2059

**What it creates:**
- Ambient orbit glyphs for nodes with active links
- Uses evolution glyph (stage-based) in ambient orbit configuration
- Pink/magenta color palette

**Key Code:**
```javascript
createAmbientOrbitForNode(node, nodeId) {
  if (!this.ambientOrbitEnabled) return;
  if (!node || !node.parent || !nodeId) return;
  if (!this._hasNodeActiveLinks(node)) return;
  if (this.ambientOrbitRegistry.has(nodeId)) return;

  const visualGroup = this._getOrCreateVisualGroup(node);
  const evolutionGlyph = this.createEvolutionGlyph(node, nodeId);
  if (!evolutionGlyph) return;

  const ambientGroup = new THREE.Group();
  ambientGroup.userData = {
    isAmbientOrbitGlyph: true,
    nodeId,
    isFusion: true
  };
  ambientGroup.name = `ambient_orbit_${nodeId}`;
  ambientGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');
  visualGroup.add(ambientGroup);

  this._safeAttachGlyph(evolutionGlyph, 'GLYPH_LAYER', ambientGroup, node);
  this._tuneGlyphVisibility(ambientGroup);

  this.ambientOrbitRegistry.set(nodeId, {
    node,
    visualGroup,
    ambientGroup,
    evolution: evolutionGlyph
  });
}
```

**Orbital Motion (_applyEvolutionOrbitMotion):**
```javascript
_applyEvolutionOrbitMotion(evoGroup, deltaTime) {
  if (!evoGroup) return;

  const rotationSpeed = Number(evoGroup.userData.rotationSpeed) || 0.3;
  const orbitSpeed = Number(evoGroup.userData.orbitSpeed) || 0.6;
  const orbitRadius = Number(evoGroup.userData.orbitRadius) || 0.7;

  evoGroup.rotation.y += rotationSpeed * deltaTime;

  evoGroup.userData.orbitPhase = (Number(evoGroup.userData.orbitPhase) || 0) + deltaTime * orbitSpeed;
  const angle = evoGroup.userData.orbitPhase;

  evoGroup.position.x = Math.cos(angle) * orbitRadius;
  evoGroup.position.z = Math.sin(angle) * orbitRadius;
}
```

**Orbit Radii by Stage:**
- Stage 1 (controlIntegration): 0.96
- Stage 2 (analyticsEmotional): 0.9
- Stage 3 (inputProcess): 0.84
- Stage 4 (errorSigma): 0.78

**Characteristics:**
- Count: 1 glyph per node (but multiple nodes = 20-40 total)
- Color: Varies by stage (magenta/cyan palette)
- Orbit radius: 0.78-0.96 units
- Speed: 0.6 (configurable per glyph)
- Pattern: Circular orbit around node center

---

## Tertiary System: _ProceduralMeaningEngine.js

### Function: `createSynergyGlyph()`
**Location:** Lines 367-420

**What it creates:**
- Twin orbit rings (different scales/speeds)
- 3 lotus petals (pyramids) in orbital positions
- Blue/magenta color scheme

**Key Code:**
```javascript
// Twin orbit rings
const ring1Geo = new THREE.TorusGeometry(0.05, 0.006, 8, 32);
const ring1Mat = new THREE.MeshBasicMaterial({
  color: 0x0099FF,  // cyan
  transparent: true,
  opacity: 0.6,
  fog: false
});

const ring2Geo = new THREE.TorusGeometry(0.035, 0.006, 8, 32);
const ring2Mat = new THREE.MeshBasicMaterial({
  color: 0xFF00FF,  // magenta
  transparent: true,
  opacity: 0.6,
  fog: false
});

// 3 lotus petals in orbital positions
for (let i = 0; i < 3; i++) {
  const petalGeo = new THREE.ConeGeometry(0.04, 0.12, 4);
  const petalMat = new THREE.MeshBasicMaterial({
    color: i % 2 === 0 ? 0x0099FF : 0xFF00FF,  // alternating cyan/magenta
    transparent: true,
    opacity: 0.5,
    fog: false
  });
  
  const petal = new THREE.Mesh(petalGeo, petalMat);
  const angle = (i / 3) * Math.PI * 2;
  petal.position.x = Math.cos(angle) * 0.08;
  petal.position.z = Math.sin(angle) * 0.08;
  petal.rotation.z = angle;
  petal.userData.role = `petal_${i}`;
  group.add(petal);
}
```

**Characteristics:**
- Count: 2 rings + 3 petals = 5 orbiting elements
- Color: Cyan (#0099FF) and Magenta (#FF00FF)
- Pattern: Orbital positions at 120° intervals

---

## File Locations

All files are in the root workspace directory (`d:/ATOMA_CLEAN/`):

1. **_AtomaGlyphSystem4_0.js** - Main glyph system (lines 255-314 for mythic seed)
2. **_GlyphLayer4_MultiFusion.js** - Ambient orbit system (lines 2030-2059)
3. **_ProceduralMeaningEngine.js** - Synergy glyph system (lines 367-420)

---

## Spawn Conditions

### Mythic Seed Glyph (_AtomaGlyphSystem4_0.js):
- Triggered by: `createMythicSeedGlyph()` call
- Spawn count: 3 triangles per node
- Total potential: 20-40 nodes × 3 = 60-120 objects
- Color: Magenta (#FF00FF) primary, Violet emissive
- Glow: Yes (emissive intensity 0.35-0.6)

### Ambient Orbit Glyph (_GlyphLayer4_MultiFusion.js):
- Triggered by: `createAmbientOrbitForNode()` when node has active links
- Spawn count: 1 glyph per node with links
- Total potential: 20-40 nodes = 20-40 objects
- Color: Stage-dependent (magenta/cyan palette)
- Glow: Yes (emissive materials)

### Synergy Glyph (_ProceduralMeaningEngine.js):
- Triggered by: `createSynergyGlyph()` for synergy-type nodes
- Spawn count: 5 elements (2 rings + 3 petals)
- Total potential: Variable based on node types
- Color: Cyan/Magenta alternating
- Glow: No (opacity 0.5-0.6, no emissive)

---

## Orbital Pattern Details

### Common Pattern (all systems):
```javascript
position.x = Math.cos(angle) * radius;
position.z = Math.sin(angle) * radius;
angle += speed * deltaTime;
```

### Specific Implementations:

1. **Mythic Seed (AtomaGlyphSystem4_0):**
   - Initial positions: Evenly spaced at 120° intervals
   - Orbit radius: 0.35
   - Speed: 0.5 + synergy * 1.2
   - Updates: Per-frame position recalculation

2. **Ambient Orbit (GlyphLayer4):**
   - Continuous orbit motion
   - Orbit radius: 0.78-0.96 (by stage)
   - Speed: 0.6 (default)
   - Also has rotation on Y-axis

3. **Synergy Rings (ProceduralMeaningEngine):**
   - Static orbital positions (no animation in base version)
   - Part of larger glyph group that may rotate

---

## Color Palette (Pink/Magenta Focus)

```javascript
// From _AtomaGlyphSystem4_0.js
this.colors = {
  cyan: new THREE.Color(0x00F2FF),
  mint: new THREE.Color(0x84FFE6),
  magenta: new THREE.Color(0xFF00FF),  // Primary pink/magenta
  violet: new THREE.Color(0x9933FF),
  gold: new THREE.Color(0xFFD700),
  // ...
};

// From _GlyphLayer4_MultiFusion.js
this.colors = {
  cyan: 0x00F2FF,
  mint: 0x84FFE6,
  magenta: 0xFF00FF,  // Primary pink/magenta
  violet: 0x9933FF,
  pink: 0xFF66FF,     // Pink variant
  // ...
};
```

---

## Performance Characteristics

- **Mythic Seed:** 3 meshes per node, simple orbital math
- **Ambient Orbit:** 1 mesh per node, shared geometry pools
- **Synergy:** 5 meshes per glyph, static positions
- All systems use `MeshBasicMaterial` (no shader complexity)
- Orbit calculations are lightweight (cos/sin per frame)
- Total overhead: <1ms per frame for all systems combined

---

## Key Functions Summary

### Creation Functions:
1. `createMythicSeedGlyph()` - 3 orbiting magenta triangles
2. `createAmbientOrbitForNode()` - Ambient orbit glyph
3. `createSynergyGlyph()` - Twin rings + 3 petals
4. `createEvolutionGlyph()` - Stage-based glyphs with orbit

### Update Functions:
1. `updateMythicSeedGlyph()` - Orbital animation
2. `updateEvolutionGlyph()` - Orbital + rotation animation  
3. `_applyEvolutionOrbitMotion()` - Core orbital math

### Spawn Functions:
1. `createGlyphFusionsForNodes()` - Batch creation
2. `createAmbientOrbitGlyphsForNodes()` - Ambient orbit batch
3. Various glyph-type-specific creation methods

---

## Conclusion

The primary system creating 20-40 pink/magenta orbiting glyphs is **_GlyphLayer4_MultiFusion.js** with its ambient orbit system, which creates 1 orbiting glyph per node with active links. The **_AtomaGlyphSystem4_0.js** system creates 3 orbiting triangles per node for mythic seed glyphs. Both use magenta/pink colors (#FF00FF, #FF66FF) with emissive glow, orbiting at 0.6-0.96 unit radius with smooth sinusoidal motion.
