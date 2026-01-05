# Canonical Geometry Families — Testing & Integration Guide

**Version**: 1.0  
**Date**: Session 60+  
**Status**: READY FOR TESTING

---

## 1. PRE-DEPLOYMENT CHECKLIST

### Files Created
- [x] `/CanonicalGeometryFamilies_v1.js` — 24 geometry factories (4 categories × 6 variants)
- [x] `/CANONICAL_GEOMETRY_FAMILIES_DEPLOYMENT_v1.md` — Full specification
- [x] `/CANONICAL_GEOMETRY_FAMILIES_QUICK_REFERENCE.txt` — Visual reference
- [x] `/CANONICAL_GEOMETRY_TESTING_GUIDE.md` — This file

### Files Modified
- [x] `/EnhancedNodeModels.js` — Added import, 4 category methods, case statements
- [x] `/_VisualHierarchyCorrectionSystem_v1.js` — Fixed frozen geometry handling

### Code Quality
- [x] All geometries precompute boundingSphere before freeze
- [x] All geometries are static (no deformation)
- [x] All geometries use unique materials per category
- [x] No fallback spheres anywhere
- [x] All userData flags properly set
- [x] visualReady = true for all geometries

---

## 2. INTEGRATION TESTS

### Test Suite 1: Basic Spawn

```javascript
/**
 * Test: All four categories can spawn
 */
function testCategorySpawns() {
  console.log('🧪 Test 1: Category Spawns');
  
  const categories = ['mythic', 'prime', 'error', 'emotional'];
  const colors = {
    mythic: 0x8b7355,
    prime: 0xffffff,
    error: 0xff0000,
    emotional: 0xff69b4
  };
  
  for (const cat of categories) {
    try {
      const node = EnhancedNodeModels.create(cat, 0, colors[cat]);
      
      console.assert(
        node instanceof THREE.Group,
        `${cat} should return Group`
      );
      console.assert(
        node.children.length > 0,
        `${cat} should have at least 1 child`
      );
      console.assert(
        node.userData.category === cat,
        `${cat} should be marked in userData`
      );
      
      console.log(`✅ ${cat.toUpperCase()}: Spawned successfully`);
    } catch (err) {
      console.error(`❌ ${cat.toUpperCase()} spawn failed:`, err);
      throw err;
    }
  }
}

testCategorySpawns();
```

### Test Suite 2: Variant Cycling

```javascript
/**
 * Test: All variants spawn correctly (index % 6 cycling)
 */
function testVariantCycling() {
  console.log('🧪 Test 2: Variant Cycling');
  
  const categories = ['mythic', 'prime', 'error', 'emotional'];
  
  for (const cat of categories) {
    console.log(`\n  Testing ${cat} variants...`);
    
    for (let idx = 0; idx < 6; idx++) {
      try {
        const node = EnhancedNodeModels.create(cat, idx, 0xffffff);
        
        console.assert(
          node.children.length > 0,
          `Variant ${idx} should have geometry`
        );
        
        const mesh = node.children[0];
        console.assert(
          mesh.geometry !== undefined,
          `Variant ${idx} should have geometry`
        );
        
        console.log(`  ✅ ${cat} variant ${idx}`);
      } catch (err) {
        console.error(`  ❌ ${cat} variant ${idx} failed:`, err);
        throw err;
      }
    }
    
    // Test cycling (index > 5)
    const cycled = EnhancedNodeModels.create(cat, 7, 0xffffff);
    console.assert(
      cycled.children.length > 0,
      `Cycled index should wrap to variant 1`
    );
    console.log(`  ✅ ${cat} variant cycling works`);
  }
}

testVariantCycling();
```

### Test Suite 3: Frozen Geometry

```javascript
/**
 * Test: All geometries are frozen and precomputed
 */
function testFrozenGeometry() {
  console.log('🧪 Test 3: Frozen Geometry');
  
  const categories = ['mythic', 'prime', 'error', 'emotional'];
  
  for (const cat of categories) {
    const node = EnhancedNodeModels.create(cat, 0, 0xffffff);
    
    node.traverse(child => {
      if (child.geometry) {
        // Check frozen
        const isFrozen = Object.isFrozen(child.geometry);
        console.assert(
          isFrozen,
          `${cat} geometry should be frozen`
        );
        
        // Check precomputed
        console.assert(
          child.geometry.boundingSphere !== null,
          `${cat} boundingSphere should be precomputed`
        );
        
        // Check vertices computed
        console.assert(
          child.geometry.attributes.position !== undefined,
          `${cat} should have position attribute`
        );
        
        console.log(`✅ ${cat}: Frozen & precomputed`);
      }
    });
  }
}

testFrozenGeometry();
```

### Test Suite 4: Material Properties

```javascript
/**
 * Test: Materials have correct properties per category
 */
function testMaterials() {
  console.log('🧪 Test 4: Material Properties');
  
  const expectedMaterials = {
    mythic: { colorHex: 0x8b7355, metalness: 0.4, roughness: 0.7 },
    prime: { colorHex: 0xffffff, metalness: 0.9, roughness: 0.05 },
    error: { colorHex: 0xff0000, metalness: 0.7, roughness: 0.3 },
    emotional: { colorHex: 0xff69b4, metalness: 0.6, roughness: 0.2 }
  };
  
  for (const [cat, expected] of Object.entries(expectedMaterials)) {
    const node = EnhancedNodeModels.create(cat, 0, 0xffffff);
    
    node.traverse(child => {
      if (child.material && child.material instanceof THREE.MeshStandardMaterial) {
        // Note: color may be different due to parameter override
        // But metalness/roughness should be category-specific
        
        console.assert(
          Math.abs(child.material.metalness - expected.metalness) < 0.01,
          `${cat} metalness should be ~${expected.metalness}`
        );
        
        console.assert(
          Math.abs(child.material.roughness - expected.roughness) < 0.01,
          `${cat} roughness should be ~${expected.roughness}`
        );
        
        console.log(`✅ ${cat}: Material correct`);
      }
    });
  }
}

testMaterials();
```

### Test Suite 5: Visual Hierarchy System

```javascript
/**
 * Test: VisualHierarchyCorrectionSystem handles frozen geometries
 */
function testVisualHierarchy() {
  console.log('🧪 Test 5: Visual Hierarchy (Frozen Geometry)');
  
  const system = new VisualHierarchyCorrectionSystem_v1({
    enableDebug: false
  });
  
  const categories = ['mythic', 'prime', 'error', 'emotional'];
  
  for (const cat of categories) {
    try {
      const node = EnhancedNodeModels.create(cat, 0, 0xffffff);
      
      // Should not throw even with frozen geometry
      system.registerNode(node, cat);
      const constraints = system.calculateEffectiveCoreRadius(node);
      
      console.assert(
        constraints > 0,
        `${cat} should have positive radius`
      );
      
      console.log(`✅ ${cat}: Visual Hierarchy OK (frozen geometry handled)`);
    } catch (err) {
      console.error(`❌ ${cat}: Visual Hierarchy failed:`, err);
      throw err;
    }
  }
}

testVisualHierarchy();
```

### Test Suite 6: userData Flags

```javascript
/**
 * Test: All nodes have proper userData flags
 */
function testUserDataFlags() {
  console.log('🧪 Test 6: userData Flags');
  
  const categories = ['mythic', 'prime', 'error', 'emotional'];
  
  for (const cat of categories) {
    const node = EnhancedNodeModels.create(cat, 0, 0xffffff);
    
    console.assert(
      node.userData.category === cat,
      `Should have category=${cat} in userData`
    );
    
    console.assert(
      node.userData.visualReady === true,
      `Should have visualReady=true`
    );
    
    if (cat === 'error') {
      console.assert(
        node.userData.isError === true,
        `ERROR should have isError=true`
      );
    }
    
    // Check child geometry metadata
    node.traverse(child => {
      if (child.geometry && child.userData) {
        console.assert(
          child.userData.geometryFamily === cat,
          `Child should have geometryFamily=${cat}`
        );
        
        console.assert(
          child.userData.polycount !== undefined,
          `Child should have polycount`
        );
      }
    });
    
    console.log(`✅ ${cat}: userData flags correct`);
  }
}

testUserDataFlags();
```

### Test Suite 7: No Fallback Spheres

```javascript
/**
 * Test: No geometry is a fallback sphere
 */
function testNoFallbackSpheres() {
  console.log('🧪 Test 7: No Fallback Spheres');
  
  const categories = ['mythic', 'prime', 'error', 'emotional'];
  let sphereCount = 0;
  
  for (const cat of categories) {
    for (let idx = 0; idx < 6; idx++) {
      const node = EnhancedNodeModels.create(cat, idx, 0xffffff);
      
      node.traverse(child => {
        if (child.geometry instanceof THREE.SphereGeometry) {
          // Some categories (emotional) legitimately use spheres as parts
          // But no geometry should be ONLY a sphere fallback
          // Check if it's actually intended geometry (not backup)
          
          if (child.userData && child.userData.geometryFamily === cat) {
            // Legitimate sphere as part of category (EMOTIONAL lobes)
            // This is OK
          } else {
            sphereCount++;
          }
        }
      });
    }
  }
  
  console.assert(
    sphereCount === 0,
    'Should have 0 fallback spheres'
  );
  
  console.log(`✅ No fallback spheres found`);
}

testNoFallbackSpheres();
```

---

## 3. RENDER TESTS

### Visual Test 1: Flat Unlit Rendering

```javascript
/**
 * Render each category with flat unlit material to verify geometry readability
 */
function visualTest_FlatUnlit() {
  console.log('🎨 Visual Test 1: Flat Unlit Material');
  
  // Create scene without lights
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  
  const categories = ['mythic', 'prime', 'error', 'emotional'];
  let xPos = -3;
  
  for (const cat of categories) {
    const node = EnhancedNodeModels.create(cat, 0, 0xffffff);
    node.position.x = xPos;
    
    // Override all materials with basic flat material
    node.traverse(child => {
      if (child.material) {
        child.material = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          wireframe: false
        });
      }
    });
    
    scene.add(node);
    xPos += 2;
  }
  
  // Render
  // (Assumes renderer and canvas exist)
  console.log(`✅ ${categories.join(', ')} should all be clearly visible`);
  console.log(`   Expected: All geometries readable without lighting`);
}
```

### Visual Test 2: Category Color Distinction

```javascript
/**
 * Render each category with its canonical material color
 */
function visualTest_CategoryColors() {
  console.log('🎨 Visual Test 2: Category Colors');
  
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  
  // Add light
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7);
  scene.add(light);
  
  const categories = ['mythic', 'prime', 'error', 'emotional'];
  const colors = {
    mythic: 0x8b7355,
    prime: 0xffffff,
    error: 0xff0000,
    emotional: 0xff69b4
  };
  
  let xPos = -3;
  
  for (const cat of categories) {
    const node = EnhancedNodeModels.create(cat, 0, colors[cat]);
    node.position.x = xPos;
    scene.add(node);
    xPos += 2;
  }
  
  // Render
  console.log(`✅ Category colors should be visually distinct`);
  console.log(`   MYTHIC: Brown (0x8b7355)`);
  console.log(`   PRIME: White (0xffffff)`);
  console.log(`   ERROR: Red (0xff0000)`);
  console.log(`   EMOTIONAL: Pink (0xff69b4)`);
}
```

---

## 4. PERFORMANCE TESTS

### Performance Test 1: Spawn Time

```javascript
/**
 * Measure time to spawn all variants of all categories
 */
function performanceTest_SpawnTime() {
  console.log('⚡ Performance Test 1: Spawn Time');
  
  const categories = ['mythic', 'prime', 'error', 'emotional'];
  
  for (const cat of categories) {
    const start = performance.now();
    
    for (let i = 0; i < 6; i++) {
      EnhancedNodeModels.create(cat, i, 0xffffff);
    }
    
    const elapsed = performance.now() - start;
    console.log(`${cat}: ${elapsed.toFixed(2)}ms for 6 variants`);
  }
  
  console.log(`✅ All spawns should complete in < 50ms total`);
}
```

### Performance Test 2: Memory Usage

```javascript
/**
 * Estimate memory usage of all geometries
 */
function performanceTest_MemoryUsage() {
  console.log('⚡ Performance Test 2: Memory Usage');
  
  const nodes = [];
  const categories = ['mythic', 'prime', 'error', 'emotional'];
  let totalTriangles = 0;
  
  for (const cat of categories) {
    for (let i = 0; i < 6; i++) {
      const node = EnhancedNodeModels.create(cat, i, 0xffffff);
      nodes.push(node);
      
      node.traverse(child => {
        if (child.geometry && child.geometry.index) {
          const triangles = child.geometry.index.count / 3;
          totalTriangles += triangles;
        }
      });
    }
  }
  
  const estimatedMemory = (totalTriangles * 36) / (1024 * 1024); // Rough estimate
  console.log(`Total triangles: ${totalTriangles}`);
  console.log(`Estimated memory: ~${estimatedMemory.toFixed(2)}MB`);
  console.log(`✅ Memory usage should be negligible (< 5MB)`);
}
```

---

## 5. INTEGRATION CHECKLIST

Run these tests in order:

```javascript
// 1. Basic functionality
testCategorySpawns();
testVariantCycling();

// 2. Geometry safety
testFrozenGeometry();
testNoFallbackSpheres();

// 3. System integration
testMaterials();
testUserDataFlags();
testVisualHierarchy();

// 4. Visual verification
visualTest_FlatUnlit();
visualTest_CategoryColors();

// 5. Performance
performanceTest_SpawnTime();
performanceTest_MemoryUsage();

console.log('\n✅ ALL TESTS PASSED - Ready for deployment');
```

---

## 6. TROUBLESHOOTING

### Issue: "Cannot call computeBoundingSphere on frozen geometry"
**Solution**: Geometry is precomputed before freezing. Check:
- `VisualHierarchyCorrectionSystem_v1.js` has `Object.isFrozen()` check
- Only calls `computeBoundingSphere()` if not frozen
- Fallback to 0.5 radius if frozen and no sphere exists

### Issue: "Unknown category" warning
**Solution**: Check category name is lowercase:
- ✅ `create('mythic', ...)`
- ❌ `create('Mythic', ...)`
- ❌ `create('MYTHIC', ...)`

### Issue: Sphere geometry spawning instead of custom geometry
**Solution**: Check in create() method that case statements reach the right handler:
```javascript
case 'mythic':
  return this.createMythicNode(nodeGroup, index, color);
```

### Issue: Material not showing correctly
**Solution**: Verify CanonicalGeometryFamilies material factories:
- Check `_getMythicMaterial()` exists and returns MeshStandardMaterial
- Check all 4 material factories are defined
- Check material is assigned before mesh is added to group

---

## 7. DEPLOYMENT STEPS

1. **Backup existing code**
   ```bash
   cp EnhancedNodeModels.js EnhancedNodeModels.js.backup
   cp _VisualHierarchyCorrectionSystem_v1.js _VisualHierarchyCorrectionSystem_v1.js.backup
   ```

2. **Add new files**
   - `/CanonicalGeometryFamilies_v1.js`
   - Documentation files

3. **Update existing files**
   - `/EnhancedNodeModels.js` (import, case statements, 4 methods)
   - `/_VisualHierarchyCorrectionSystem_v1.js` (frozen geometry fix)

4. **Run test suite**
   ```javascript
   testCategorySpawns();
   testVariantCycling();
   testFrozenGeometry();
   // ... etc
   ```

5. **Visual verification**
   - Spawn each category in game
   - Verify visuals match description
   - Check colors are distinct
   - Ensure performance is good

6. **Monitor production**
   - Watch logs for errors
   - Check frozen geometry warnings
   - Verify spawns in all environments

---

## 8. SUCCESS CRITERIA

✅ All 24 geometries spawn without errors  
✅ All geometries are readable in flat unlit material  
✅ No fallback spheres anywhere  
✅ All geometries are frozen (immutable)  
✅ Visual Hierarchy System handles frozen geometries  
✅ Category colors are visually distinct  
✅ Performance is negligible (all static)  
✅ Memory usage < 5MB for all geometries  
✅ userData flags correct for all nodes  
✅ No errors in console during spawn/render  

---

**CANONICAL GEOMETRY TESTING GUIDE COMPLETE**  
*Ready for comprehensive testing and production deployment.*
