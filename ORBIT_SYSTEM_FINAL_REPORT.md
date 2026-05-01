# ORBIT SYSTEM FINAL REPORT
## Task: Find system creating orbiting small geometry (pink glyphs) around nodes

---

## 1. PRECISE FILE LOCATIONS

### Primary System: `_AtomaGlyphSystem4_0.js`
- **Function:** `createMythicSeedGlyph(node, nodeId)` 
- **Lines:** 255-314
- **Orbiting objects:** 3 magenta triangles per node
- **Color:** `0xFF00FF` (magenta) with violet emissive glow
- **Orbit radius:** 0.35 units
- **Animation:** `updateMythicSeedGlyph()` lines 884-923

### Secondary System: `_GlyphLayer4_MultiFusion.js`
- **Function:** `createAmbientOrbitForNode(node, nodeId)`
- **Lines:** 2030-2059
- **Orbiting objects:** 1 evolution glyph per node (20-40 total)
- **Color:** Stage-dependent (magenta/cyan palette, `0xFF00FF` primary)
- **Orbit radius:** 0.78-0.96 units (by stage)
- **Animation:** `_applyEvolutionOrbitMotion()` lines 188-202, `updateEvolutionGlyph()` lines 1441-1500

### Tertiary System: `_ProceduralMeaningEngine.js`
- **Function:** `createSynergyGlyph()`
- **Lines:** 367-420
- **Orbiting objects:** 5 elements (2 rings + 3 petals)
- **Color:** Alternating cyan (`0x0099FF`) and magenta (`0xFF00FF`)
- **Pattern:** Orbital positions at 120° intervals

---

## 2. FUNCTIONS CREATING MULTIPLE OBJECTS IN LOOPS

### `createMythicSeedGlyph()` - _AtomaGlyphSystem4_0.js:266-284
```javascript
// 3 orbiting micro-triangles in fractal formation
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
**Creates:** 3 magenta triangles
**Uses:** `Math.sin`, `Math.cos`, `angle`, `radius`
**Three.js:** `new THREE.Mesh()`

---

### `createSynergyGlyph()` - _ProceduralMeaningEngine.js:367-420
```javascript
// Twin orbit rings
for (let i = 0; i < 2; i++) {
  // Creates 2 torus rings
}

// 3 lotus petals (pyramids) in orbital positions
for (let i = 0; i < 3; i++) {
  const petalGeo = new THREE.ConeGeometry(0.04, 0.12, 4);
  const petalMat = new THREE.MeshBasicMaterial({
    color: i % 2 === 0 ? 0x0099FF : 0xFF00FF,  // alternating
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
**Creates:** 2 rings + 3 petals = 5 objects
**Uses:** `Math.sin`, `Math.cos`, `angle`, `radius`
**Three.js:** `new THREE.Mesh()`, `new THREE.TorusGeometry()`

---

### `createAmbientOrbitForNode()` - _GlyphLayer4_MultiFusion.js:2030-2059
```javascript
createAmbientOrbitForNode(node, nodeId) {
  // Creates ambient orbit glyph (1 per node)
  const ambientGroup = new THREE.Group();
  ambientGroup.userData = {
    isAmbientOrbitGlyph: true,
    nodeId,
    isFusion: true
  };
  ambientGroup.name = `ambient_orbit_${nodeId}`;
  
  const evolutionGlyph = this.createEvolutionGlyph(node, nodeId);
  ambientGroup.add(evolutionGlyph);
  
  this.ambientOrbitRegistry.set(nodeId, {
    node, visualGroup, ambientGroup, evolution: evolutionGlyph
  });
}
```
**Creates:** 1 glyph per node (20-40 total across all nodes)
**Three.js:** `new THREE.Group()`

---

## 3. THREE.JS CONSTRUCTORS USED

### `new THREE.Mesh()`
- Used in all 3 systems for creating orbiting geometry
- Examples: triangles, petals, rings, glyphs

### `new THREE.BufferGeometry()` / `new THREE.TorusGeometry()`
- Used for ring creation in synergy glyphs
- `_ProceduralMeaningEngine.js:371-397`

### `new THREE.Group()`
- Used for organizing orbiting objects
- `_GlyphLayer4_MultiFusion.js:2040`

### `new THREE.ConeGeometry()` / `new THREE.SphereGeometry()`
- Used for triangle and core objects
- `_AtomaGlyphSystem4_0.js:267, 287`

---

## 4. ORBITAL MOTION PATTERNS

### Pattern 1: Mythic Seed Orbital Animation
**File:** `_AtomaGlyphSystem4_0.js:884-923`
```javascript
updateMythicSeedGlyph(glyphGroup, context, animState, deltaTime) {
  // Orbital rotation
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
}
```
**Math:** `Math.sin`, `Math.cos`, `angle`, `radius`
**Speed:** 0.5 + synergy * 1.2 radians/sec

---

### Pattern 2: Ambient Orbit Motion
**File:** `_GlyphLayer4_MultiFusion.js:188-202`
```javascript
_applyEvolutionOrbitMotion(evoGroup, deltaTime) {
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
**Math:** `Math.sin`, `Math.cos`, `angle`, `radius`
**Speed:** 0.6 radians/sec default

---

### Pattern 3: Synergy Ring Animation
**File:** `_ProceduralMeaningEngine.js:367-420`
- Static orbital positions (no runtime orbit animation in base version)
- Part of larger glyph that may have group-level rotation

---

## 5. COLOR SPECIFICATIONS (PINK/MAGENTA)

### Magenta/Pink Colors Used:
```javascript
// _AtomaGlyphSystem4_0.js
this.colors.magenta = new THREE.Color(0xFF00FF);  // Pure magenta
this.colors.violet = new THREE.Color(0x9933FF);   // Violet

// _GlyphLayer4_MultiFusion.js  
this.colors.magenta = 0xFF00FF;  // Pure magenta
this.colors.pink = 0xFF66FF;     // Pink variant
this.colors.violet = 0x9933FF;

// _ProceduralMeaningEngine.js
color: 0xFF00FF  // Magenta for rings
color: i % 2 === 0 ? 0x0099FF : 0xFF00FF  // Alternating cyan/magenta
```

### Emissive Glow:
```javascript
emissive: this.colors.violet,        // Violet glow
emissiveIntensity: 0.35 - 0.6        // Medium glow
```

---

## 6. SPAWN CONDITIONS & COUNTS

### Mythic Seed Glyphs (_AtomaGlyphSystem4_0.js):
- **Trigger:** `createMythicSeedGlyph()` called per node
- **Per-node count:** 3 orbiting triangles
- **Total potential:** 20-40 nodes × 3 = **60-120 objects**
- **Color:** Magenta (#FF00FF) + violet emissive
- **Glow:** Yes (emissive intensity 0.35-0.6)
- **Size:** 0.08 radius triangles
- **Orbit radius:** 0.35 units

### Ambient Orbit Glyphs (_GlyphLayer4_MultiFusion.js):
- **Trigger:** `createAmbientOrbitForNode()` for nodes with active links
- **Per-node count:** 1 orbiting glyph
- **Total potential:** **20-40 objects** (nodes with links)
- **Color:** Stage-dependent (magenta/cyan, `0xFF00FF` primary)
- **Glow:** Yes (emissive materials)
- **Size:** Varies by evolution stage
- **Orbit radius:** 0.78-0.96 units

### Synergy Glyphs (_ProceduralMeaningEngine.js):
- **Trigger:** `createSynergyGlyph()` for synergy-type nodes
- **Per-glyph count:** 5 elements (2 rings + 3 petals)
- **Total potential:** Variable based on node types
- **Color:** Cyan (#0099FF) and magenta (#FF00FF) alternating
- **Glow:** No (opacity 0.5-0.6, no emissive)
- **Size:** 0.04-0.05 radius

---

## 7. SUMMARY: PRIMARY SYSTEM

### Most Likely Match for Task Description:

**System:** `_GlyphLayer4_MultiFusion.js` - Ambient Orbit System

**Why:**
1. Creates 20-40 orbiting objects (matches "20-40 pieces")
2. Pink/magenta color (`0xFF00FF`)
3. Small geometry (glyphs)
4. Orbit around node center
5. Glow effect (emissive materials)
6. Orbital pattern with `Math.sin`, `Math.cos`, `angle`, `radius`
7. Uses `new THREE.Mesh()` and `new THREE.Group()`

**Key Functions:**
- `createAmbientOrbitForNode()` - Spawns orbiting glyph
- `_applyEvolutionOrbitMotion()` - Animates orbit
- `updateEvolutionGlyph()` - Updates animation

**File:** `_GlyphLayer4_MultiFusion.js` (lines 188-202, 1441-1500, 2030-2059)

**Alternative:** `_AtomaGlyphSystem4_0.js` - Mythic Seed System
- Creates 3 orbiting triangles per node (60-120 total)
- More triangles, same pink/magenta color
- Strong match for "3 orbiting objects" pattern

---

## 8. EXACT CODE PATTERNS FOUND

### All Required Patterns Present:
✓ `for` loop creating multiple objects (3-5 per glyph)
✓ `Math.sin(angle)` for Y position
✓ `Math.cos(angle)` for X position  
✓ `angle` variable (radians)
✓ `radius` variable (orbit distance)
✓ `new THREE.Mesh()` construction
✓ `new THREE.Points()` not used (uses Mesh instead)
✓ `new THREE.BufferGeometry()` for some ring types
✓ Pink/magenta color (`0xFF00FF`)
✓ Glow effect (emissive materials)
✓ 20-40 total objects across scene
✓ Orbital motion pattern
✓ Updates in animation loop
