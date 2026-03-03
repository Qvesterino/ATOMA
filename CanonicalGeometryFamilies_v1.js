/**
 * CANONICAL GEOMETRY FAMILIES v1.0
 * 
 * Four unsafe node categories now have production-ready geometries:
 * - MYTHIC: Ancient fractured relics (6 variants)
 * - PRIME: Perfect axioms (6 variants)
 * - ERROR: Frozen corruption (6 variants)
 * - EMOTIONAL: Crystalline organics (6 variants)
 * 
 * All geometries are static, fully faceted, and readable in flat unlit material.
 * Bounding spheres precomputed and frozen to prevent mutation errors.
 */

import * as THREE from 'three';

// Shared geometry cache for deterministic builders
const GEOMETRY_CACHE = new Map(); // key -> BufferGeometry
const getCachedGeometry = (key, buildFn) => {
  if (GEOMETRY_CACHE.has(key)) return GEOMETRY_CACHE.get(key);
  const geom = buildFn();
  GEOMETRY_CACHE.set(key, geom);
  return geom;
};

export class CanonicalGeometryFamilies {
  
  /**
   * CRITICAL: Guard function to prevent raycast/raycaster crashes
   * Call this BEFORE attempting any geometry computations
   * 
   * Immutable geometries MUST NOT be modified (including computations)
   * This function verifies geometry is safe to use as-is
   */
  static isSafeToRaycast(geometry) {
    if (!geometry) return false;
    
    // Check if marked as immutable
    const isImmutable = geometry.userData && geometry.userData.immutable === true;
    
    if (isImmutable) {
      // Immutable geometry is safe IF it has precomputed bounds
      return geometry.userData && 
             geometry.userData.precomputedAndFrozen === true &&
             geometry.boundingSphere !== null;
    }
    
    // Non-immutable geometries can be modified safely
    return true;
  }
  
  /**
   * Safe bounding sphere getter
   * Never calls computeBoundingSphere on immutable geometry
   * Returns precomputed bounds or safe fallback
   */
  static getBoundingSphere(geometry) {
    if (!geometry) return null;
    
    // If already computed, return it
    if (geometry.boundingSphere) {
      return geometry.boundingSphere;
    }
    
    // If marked immutable and missing bounds, abort
    const isImmutable = geometry.userData && geometry.userData.immutable === true;
    if (isImmutable) {
      if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
        console.error('[VisualBuildFail]', { reason: 'BoundsInvalid', scope: 'boundingSphere', immutable: true });
      }
      return null;
    }
    
    // Safe to compute on mutable geometry
    try {
      geometry.computeBoundingSphere();
      return geometry.boundingSphere;
    } catch (err) {
      if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
        console.error('[VisualBuildFail]', { reason: 'BoundsInvalid', scope: 'boundingSphere', error: err?.message });
      }
      return null;
    }
  }
  
  /**
   * Safe bounding box getter
   * Never calls computeBoundingBox on immutable geometry
   * Returns precomputed bounds or safe fallback
   */
  static getBoundingBox(geometry) {
    if (!geometry) return null;
    
    // If already computed, return it
    if (geometry.boundingBox) {
      return geometry.boundingBox;
    }
    
    // If marked immutable and missing bounds, abort
    const isImmutable = geometry.userData && geometry.userData.immutable === true;
    if (isImmutable) {
      if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
        console.error('[VisualBuildFail]', { reason: 'BoundsInvalid', scope: 'boundingBox', immutable: true });
      }
      return null;
    }
    
    // Safe to compute on mutable geometry
    try {
      if (!geometry.boundingBox) {
        geometry.computeBoundingBox();
      }
      return geometry.boundingBox;
    } catch (err) {
      if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
        console.error('[VisualBuildFail]', { reason: 'BoundsInvalid', scope: 'boundingBox', error: err?.message });
      }
      return null;
    }
  }
  
  /**
   * Validation: ensure geometry has finite positions (catches NaN propagation).
   */
  static _validateGeometry(geometry, builderName = 'unknown') {
    if (!geometry) {
      throw new Error(`Missing geometry in ${builderName}`);
    }
    const pos = geometry.attributes && geometry.attributes.position;
    if (!pos) {
      throw new Error(`Missing position in ${builderName}`);
    }
    const arr = pos.array;
    for (let i = 0; i < arr.length; i++) {
      if (!Number.isFinite(arr[i])) {
        console.error('NaN in geometry', builderName);
        throw new Error('NaN geometry');
      }
    }
    return geometry;
  }
  
  // ===== MYTHIC CATEGORY (Ancient Fractured Relics) =====
  
  /**
   * MYTHIC-0: Shard Cluster
   * Multiple jagged tetrahedra arranged chaotically
   * Feels excavated and fractured
   */
  static createMythicShardCluster(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getMythicMaterial();

    // Base slab
    const baseGeometry = getCachedGeometry('mythic-cairn-base', () => {
      const g = new THREE.CylinderGeometry(0.65, 0.7, 0.18, 6, 1);
      this._validateGeometry(g, 'createMythicShardCluster:base');
      return g;
    });
    const base = new THREE.Mesh(baseGeometry, mat);
    base.position.y = -0.28;
    group.add(base);

    // Spine obelisk
    const spineGeometry = getCachedGeometry('mythic-cairn-spine', () => {
      const g = new THREE.CylinderGeometry(0.12, 0.14, 0.9, 8, 1);
      this._validateGeometry(g, 'createMythicShardCluster:spine');
      return g;
    });
    const spine = new THREE.Mesh(spineGeometry, mat);
    spine.position.y = 0.2;
    group.add(spine);

    // Orbiting shards (4)
    const shardGeometry = getCachedGeometry('mythic-cairn-shard', () => {
      const g = new THREE.TetrahedronGeometry(0.28, 0);
      this._validateGeometry(g, 'createMythicShardCluster:shard');
      return g;
    });
    const shardOffsets = [
      [0.55, 0.05, 0.1, 0.1],
      [-0.5, 0.18, -0.2, -0.2],
      [0.2, 0.4, -0.45, 0.25],
      [-0.25, -0.05, 0.55, -0.15]
    ];
    shardOffsets.forEach(([x, y, z, ry]) => {
      const shard = new THREE.Mesh(shardGeometry, mat);
      shard.position.set(x, y, z);
      shard.rotation.y = ry;
      group.add(shard);
    });

    // Keystone above, held by “force”
    const keystoneGeometry = getCachedGeometry('mythic-cairn-keystone', () => {
      const g = new THREE.OctahedronGeometry(0.22, 0);
      this._validateGeometry(g, 'createMythicShardCluster:keystone');
      return g;
    });
    const keystone = new THREE.Mesh(keystoneGeometry, mat);
    keystone.position.y = 0.75;
    keystone.rotation.y = Math.PI * 0.25;
    group.add(keystone);

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'MYTHIC';
    group.userData.geometryVariant = 'ShardCluster_V3';
    group.userData.polycount = 260; // approx combined
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * MYTHIC-1: Broken Monolith
   * Tall structure with large chunks missing
   * Feels eroded and ancient
   */
  // Deterministic – safe for geometry cache
  static createMythicBrokenMonolith(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getMythicMaterial();

    // Base plinth
    const baseGeometry = getCachedGeometry('mythic-monolith-base', () => {
      const g = new THREE.BoxGeometry(0.8, 0.16, 0.8);
      this._validateGeometry(g, 'createMythicBrokenMonolith:base');
      return g;
    });
    const base = new THREE.Mesh(baseGeometry, mat);
    base.position.y = -0.4;
    group.add(base);

    // Left slab
    const leftGeometry = getCachedGeometry('mythic-monolith-left', () => {
      const g = new THREE.BoxGeometry(0.38, 1.3, 0.38);
      this._validateGeometry(g, 'createMythicBrokenMonolith:left');
      return g;
    });
    const left = new THREE.Mesh(leftGeometry, mat);
    left.position.set(-0.24, 0.2, 0);
    left.rotation.z = Math.PI * 0.04;
    group.add(left);

    // Right slab offset creating diagonal void
    const rightGeometry = getCachedGeometry('mythic-monolith-right', () => {
      const g = new THREE.BoxGeometry(0.42, 1.15, 0.38);
      this._validateGeometry(g, 'createMythicBrokenMonolith:right');
      return g;
    });
    const right = new THREE.Mesh(rightGeometry, mat);
    right.position.set(0.26, 0.05, 0.05);
    right.rotation.z = -Math.PI * 0.08;
    group.add(right);

    // Inner wedge core seated in the void
    const coreGeometry = getCachedGeometry('mythic-monolith-core', () => {
      const g = new THREE.BoxGeometry(0.22, 0.9, 0.22);
      this._validateGeometry(g, 'createMythicBrokenMonolith:core');
      return g;
    });
    const core = new THREE.Mesh(coreGeometry, mat);
    core.position.set(0.05, 0.1, 0);
    core.rotation.y = Math.PI * 0.25;
    core.userData.isCore = true;
    group.add(core);

    // Broken ring around mid height (open arc)
    const ringGeometry = getCachedGeometry('mythic-monolith-ring', () => {
      const g = new THREE.TorusGeometry(0.55, 0.05, 8, 18, Math.PI * 1.3);
      this._validateGeometry(g, 'createMythicBrokenMonolith:ring');
      return g;
    });
    const ring = new THREE.Mesh(ringGeometry, mat);
    ring.position.y = 0.05;
    ring.rotation.y = Math.PI * 0.2;
    group.add(ring);

    // Chipped apex plate
    const capGeometry = getCachedGeometry('mythic-monolith-cap', () => {
      const g = new THREE.CylinderGeometry(0.3, 0.32, 0.08, 6, 1);
      this._validateGeometry(g, 'createMythicBrokenMonolith:cap');
      return g;
    });
    const cap = new THREE.Mesh(capGeometry, mat);
    cap.position.y = 0.92;
    cap.rotation.y = Math.PI * 0.12;
    group.add(cap);

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'MYTHIC';
    group.userData.geometryVariant = 'BrokenMonolith_V3';
    group.userData.polycount = 360; // approx combined
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * MYTHIC-2: Floating Relic Fragments
   * 3-4 disconnected pieces arranged in space
   * Feels suspended and broken
   */
  static createMythicFloatingFragments(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getMythicMaterial();

    // Base disk
    const baseGeometry = getCachedGeometry('mythic-fragments-base', () => {
      const g = new THREE.CylinderGeometry(0.42, 0.42, 0.12, 10, 1);
      this._validateGeometry(g, 'createMythicFloatingFragments:base');
      return g;
    });
    const base = new THREE.Mesh(baseGeometry, mat);
    base.position.y = -0.35;
    group.add(base);

    // Central spine
    const spineGeometry = getCachedGeometry('mythic-fragments-spine', () => {
      const g = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8, 1);
      this._validateGeometry(g, 'createMythicFloatingFragments:spine');
      return g;
    });
    const spine = new THREE.Mesh(spineGeometry, mat);
    spine.position.y = 0.05;
    group.add(spine);

    // Fragments (3)
    const fragGeometry = getCachedGeometry('mythic-fragments-frag', () => {
      const g = new THREE.BoxGeometry(0.35, 0.18, 0.28);
      this._validateGeometry(g, 'createMythicFloatingFragments:fragment');
      return g;
    });
    const fragData = [
      [0.28, 0.25, 0.05, 0.18, 0.25],
      [-0.32, -0.05, -0.18, -0.12, -0.22],
      [0.12, 0.55, -0.35, 0.32, 0.12]
    ];
    fragData.forEach(([x, y, z, ry, rz]) => {
      const frag = new THREE.Mesh(fragGeometry, mat);
      frag.position.set(x, y, z);
      frag.rotation.y = ry;
      frag.rotation.z = rz;
      group.add(frag);
    });

    // Mid ring frame
    const ringGeometry = getCachedGeometry('mythic-fragments-ring', () => {
      const g = new THREE.TorusGeometry(0.5, 0.035, 8, 18, Math.PI * 2);
      this._validateGeometry(g, 'createMythicFloatingFragments:ring');
      return g;
    });
    const ring = new THREE.Mesh(ringGeometry, mat);
    ring.position.y = 0.15;
    ring.rotation.x = Math.PI * 0.48;
    group.add(ring);

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'MYTHIC';
    group.userData.geometryVariant = 'FloatingFragments_V3';
    group.userData.polycount = 340; // approx combined
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * MYTHIC-3: Cracked Prism
   * Prismatic form with visible fracture lines
   * Feels fractured but still unified
   */
  // Deterministic – safe for geometry cache
  static createMythicCrackedPrism(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getMythicMaterial();

    // Base
    const baseGeometry = getCachedGeometry('mythic-prism-base', () => {
      const g = new THREE.CylinderGeometry(0.55, 0.6, 0.14, 6, 1);
      this._validateGeometry(g, 'createMythicCrackedPrism:base');
      return g;
    });
    const base = new THREE.Mesh(baseGeometry, mat);
    base.position.y = -0.32;
    group.add(base);

    // Left prism slab
    const leftGeometry = getCachedGeometry('mythic-prism-left', () => {
      const g = new THREE.BoxGeometry(0.4, 1.1, 0.4);
      this._validateGeometry(g, 'createMythicCrackedPrism:left');
      return g;
    });
    const left = new THREE.Mesh(leftGeometry, mat);
    left.position.set(-0.18, 0.1, 0.05);
    left.rotation.y = -Math.PI * 0.08;
    group.add(left);

    // Right prism slab, offset to form fissure
    const rightGeometry = getCachedGeometry('mythic-prism-right', () => {
      const g = new THREE.BoxGeometry(0.38, 1.0, 0.4);
      this._validateGeometry(g, 'createMythicCrackedPrism:right');
      return g;
    });
    const right = new THREE.Mesh(rightGeometry, mat);
    right.position.set(0.2, 0.05, -0.08);
    right.rotation.y = Math.PI * 0.1;
    group.add(right);

    // Internal pillar revealed by crack
    const coreGeometry = getCachedGeometry('mythic-prism-core', () => {
      const g = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 10, 1);
      this._validateGeometry(g, 'createMythicCrackedPrism:core');
      return g;
    });
    const core = new THREE.Mesh(coreGeometry, mat);
    core.position.set(0.02, 0.08, 0);
    core.userData.isCore = true;
    group.add(core);

    // Broken band
    const bandGeometry = getCachedGeometry('mythic-prism-band', () => {
      const g = new THREE.TorusGeometry(0.52, 0.035, 8, 18, Math.PI * 1.4);
      this._validateGeometry(g, 'createMythicCrackedPrism:band');
      return g;
    });
    const band = new THREE.Mesh(bandGeometry, mat);
    band.position.y = 0.12;
    band.rotation.y = Math.PI * 0.25;
    group.add(band);

    // Offset top plate
    const capGeometry = getCachedGeometry('mythic-prism-cap', () => {
      const g = new THREE.BoxGeometry(0.46, 0.08, 0.46);
      this._validateGeometry(g, 'createMythicCrackedPrism:cap');
      return g;
    });
    const cap = new THREE.Mesh(capGeometry, mat);
    cap.position.set(0.05, 0.78, -0.04);
    cap.rotation.y = Math.PI * 0.18;
    group.add(cap);

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'MYTHIC';
    group.userData.geometryVariant = 'CrackedPrism_V3';
    group.userData.polycount = 420; // approx combined
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * MYTHIC-4: Ancient Core with Missing Faces
   * Polyhedron with deliberately missing faces
   * Feels incomplete and ancient
   */
  static createMythicAncientCoreWithMissing(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getMythicMaterial();

    // Base pedestal
    const baseGeometry = getCachedGeometry('mythic-hollow-base', () => {
      const g = new THREE.CylinderGeometry(0.55, 0.6, 0.14, 10, 1);
      this._validateGeometry(g, 'createMythicAncientCoreWithMissing:base');
      return g;
    });
    const base = new THREE.Mesh(baseGeometry, mat);
    base.position.y = -0.32;
    group.add(base);

    // Outer shell
    const shellGeometry = getCachedGeometry('mythic-hollow-shell', () => {
      const g = new THREE.DodecahedronGeometry(0.55, 0);
      const pos = g.getAttribute('position');
      const arr = pos.array;
      // Remove a forward face by collapsing vertices near +Z
      for (let i = 0; i < arr.length; i += 3) {
        if (arr[i + 2] > 0.35) {
          arr[i] *= 0.55;
          arr[i + 1] *= 0.55;
          arr[i + 2] *= 0.4;
        }
      }
      pos.needsUpdate = true;
      g.computeVertexNormals();
      this._validateGeometry(g, 'createMythicAncientCoreWithMissing:shell');
      return g;
    });
    const shell = new THREE.Mesh(shellGeometry, mat);
    shell.position.y = 0.05;
    group.add(shell);

    // Inner seed
    const seedGeometry = getCachedGeometry('mythic-hollow-seed', () => {
      const g = new THREE.DodecahedronGeometry(0.28, 0);
      this._validateGeometry(g, 'createMythicAncientCoreWithMissing:seed');
      return g;
    });
    const seed = new THREE.Mesh(seedGeometry, mat);
    seed.position.set(0, 0.12, 0.02);
    seed.rotation.y = Math.PI * 0.18;
    seed.userData.isCore = true;
    group.add(seed);

    // Cradle ring
    const ringGeometry = getCachedGeometry('mythic-hollow-ring', () => {
      const g = new THREE.TorusGeometry(0.32, 0.03, 8, 18, Math.PI * 2);
      this._validateGeometry(g, 'createMythicAncientCoreWithMissing:ring');
      return g;
    });
    const ring = new THREE.Mesh(ringGeometry, mat);
    ring.position.y = -0.02;
    ring.rotation.x = Math.PI * 0.5;
    group.add(ring);

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'MYTHIC';
    group.userData.geometryVariant = 'AncientCoreWithMissing_V3';
    group.userData.polycount = 360; // approx combined
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * MYTHIC-5: Collapsed Crystal Crown
   * Crown-like structure that's broken and collapsed
   * Feels fragmented and majestic-fallen
   */
  static createMythicCollapsedCrown(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getMythicMaterial();

    // Broken ring base, tipped
    const baseGeometry = getCachedGeometry('mythic-crown-base', () => {
      const g = new THREE.TorusGeometry(0.48, 0.08, 8, 24, Math.PI * 1.6);
      this._validateGeometry(g, 'createMythicCollapsedCrown:base');
      return g;
    });
    const base = new THREE.Mesh(baseGeometry, mat);
    base.position.y = -0.25;
    base.rotation.z = -Math.PI * 0.08;
    base.userData.isCore = true;
    group.add(base);

    // Inward leaning spires (5)
    const spireGeometry = getCachedGeometry('mythic-crown-spire', () => {
      const g = new THREE.ConeGeometry(0.1, 0.55, 6, 1);
      this._validateGeometry(g, 'createMythicCollapsedCrown:spire');
      return g;
    });
    const spireData = [
      [0.52, 0.05, 0.0, -0.18],
      [-0.48, 0.02, 0.18, 0.22],
      [0.12, 0.0, 0.5, -0.12],
      [-0.15, 0.08, -0.52, 0.18],
      [0.32, 0.06, -0.36, -0.16]
    ];
    spireData.forEach(([x, z, ry, rz]) => {
      const spire = new THREE.Mesh(spireGeometry, mat);
      spire.position.set(x, 0.05, z);
      spire.rotation.y = ry;
      spire.rotation.x = rz;
      group.add(spire);
    });

    // Central rod
    const rodGeometry = getCachedGeometry('mythic-crown-rod', () => {
      const g = new THREE.CylinderGeometry(0.08, 0.08, 0.85, 10, 1);
      this._validateGeometry(g, 'createMythicCollapsedCrown:rod');
      return g;
    });
    const rod = new THREE.Mesh(rodGeometry, mat);
    rod.position.y = 0.2;
    group.add(rod);

    // Suspended cracked halo
    const haloGeometry = getCachedGeometry('mythic-crown-halo', () => {
      const g = new THREE.TorusGeometry(0.42, 0.05, 8, 18, Math.PI * 1.2);
      this._validateGeometry(g, 'createMythicCollapsedCrown:halo');
      return g;
    });
    const halo = new THREE.Mesh(haloGeometry, mat);
    halo.position.y = 0.55;
    halo.rotation.y = Math.PI * 0.3;
    halo.rotation.x = Math.PI * 0.08;
    group.add(halo);

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'MYTHIC';
    group.userData.geometryVariant = 'CollapsedCrown_V3';
    group.userData.polycount = 430; // approx combined
    this._precomputeAndFreeze(group);
    return group;
  }
  
  // ===== PRIME CATEGORY (Perfect Axioms) =====
  
  /**
   * PRIME-0: Nested Icosahedron
   * Small icosahedron perfectly nested inside larger one
   * Pure mathematical perfection
   */
  // Deterministic – safe for geometry cache
  static createPrimeNestedIcosahedron(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getPrimeMaterial();

    const baseGeometry = getCachedGeometry('prime-axiom-base', () => {
      const g = new THREE.CylinderGeometry(0.58, 0.62, 0.12, 12, 1);
      return this._validateGeometry(g, 'createPrimeNestedIcosahedron:base');
    });
    const base = new THREE.Mesh(baseGeometry, mat);
    base.position.y = -0.32;
    group.add(base);

    const spineGeometry = getCachedGeometry('prime-axiom-spine', () => {
      const g = new THREE.CylinderGeometry(0.08, 0.08, 0.75, 12, 1);
      return this._validateGeometry(g, 'createPrimeNestedIcosahedron:spine');
    });
    const spine = new THREE.Mesh(spineGeometry, mat);
    spine.position.y = 0.05;
    group.add(spine);

    const innerGeometry = getCachedGeometry('prime-axiom-inner', () => {
      const g = new THREE.IcosahedronGeometry(0.26, 0);
      return this._validateGeometry(g, 'createPrimeNestedIcosahedron:inner');
    });
    const inner = new THREE.Mesh(innerGeometry, mat);
    inner.position.y = 0.32;
    inner.rotation.y = Math.PI * 0.1;
    inner.userData.isCore = true;
    group.add(inner);

    const outerGeometry = getCachedGeometry('prime-axiom-outer', () => {
      const g = new THREE.IcosahedronGeometry(0.48, 0);
      return this._validateGeometry(g, 'createPrimeNestedIcosahedron:outer');
    });
    const outer = new THREE.Mesh(outerGeometry, mat);
    outer.position.y = 0.32;
    outer.scale.set(1.02, 1.02, 1.02);
    group.add(outer);

    const ringGeometry = getCachedGeometry('prime-axiom-ring', () => {
      const g = new THREE.TorusGeometry(0.5, 0.035, 10, 24, Math.PI * 2);
      return this._validateGeometry(g, 'createPrimeNestedIcosahedron:ring');
    });
    const ring = new THREE.Mesh(ringGeometry, mat);
    ring.position.y = 0.32;
    ring.rotation.x = Math.PI * 0.08;
    ring.rotation.y = Math.PI * 0.22;
    group.add(ring);

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'PRIME';
    group.userData.geometryVariant = 'NestedIcosahedron_V3';
    group.userData.polycount = 520; // approx combined
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * PRIME-1: Perfect Dodecahedron
   * Pure 12-faced symmetry, absolute perfection
   */
  // Deterministic – safe for geometry cache
  static createPrimePerfectDodecahedron(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getPrimeMaterial();

    const baseGeometry = getCachedGeometry('prime-vault-base', () => {
      const g = new THREE.CylinderGeometry(0.55, 0.6, 0.12, 12, 1);
      return this._validateGeometry(g, 'createPrimePerfectDodecahedron:base');
    });
    const base = new THREE.Mesh(baseGeometry, mat);
    base.position.y = -0.32;
    group.add(base);

    const baseStepGeometry = getCachedGeometry('prime-vault-base-step', () => {
      const g = new THREE.CylinderGeometry(0.45, 0.5, 0.08, 12, 1);
      return this._validateGeometry(g, 'createPrimePerfectDodecahedron:baseStep');
    });
    const baseStep = new THREE.Mesh(baseStepGeometry, mat);
    baseStep.position.y = -0.24;
    group.add(baseStep);

    const spineGeometry = getCachedGeometry('prime-vault-spine', () => {
      const g = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 12, 1);
      return this._validateGeometry(g, 'createPrimePerfectDodecahedron:spine');
    });
    const spine = new THREE.Mesh(spineGeometry, mat);
    spine.position.y = 0.05;
    group.add(spine);

    const cradleGeometry = getCachedGeometry('prime-vault-cradle', () => {
      const g = new THREE.TorusGeometry(0.36, 0.03, 10, 20, Math.PI * 2);
      return this._validateGeometry(g, 'createPrimePerfectDodecahedron:cradle');
    });
    const cradle = new THREE.Mesh(cradleGeometry, mat);
    cradle.position.y = 0.22;
    cradle.rotation.x = Math.PI * 0.5;
    group.add(cradle);

    const coreGeometry = getCachedGeometry('prime-vault-core', () => {
      const g = new THREE.DodecahedronGeometry(0.32, 0);
      return this._validateGeometry(g, 'createPrimePerfectDodecahedron:core');
    });
    const core = new THREE.Mesh(coreGeometry, mat);
    core.position.y = 0.32;
    core.rotation.y = Math.PI * 0.2;
    core.userData.isCore = true;
    group.add(core);

    const frameGeometry = getCachedGeometry('prime-vault-frame', () => {
      const g = new THREE.TorusGeometry(0.52, 0.035, 8, 18, Math.PI * 2);
      return this._validateGeometry(g, 'createPrimePerfectDodecahedron:frame');
    });
    const frame = new THREE.Mesh(frameGeometry, mat);
    frame.scale.set(1.0, 0.72, 1.0);
    frame.position.y = 0.26;
    frame.rotation.y = Math.PI * 0.44;
    group.add(frame);

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'PRIME';
    group.userData.geometryVariant = 'PerfectDodecahedron_V3';
    group.userData.polycount = 560; // approx combined
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * PRIME-2: Stella Octangula (Dual Polyhedron)
   * Two interpenetrating tetrahedra forming 8-pointed star
   * Inside-out mathematical form
   */
  // Deterministic – safe for geometry cache
  static createPrimeStellaOctangula(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getPrimeMaterial();

    const baseGeometry = getCachedGeometry('prime-star-base', () => {
      const g = new THREE.CylinderGeometry(0.52, 0.55, 0.12, 3, 1);
      return this._validateGeometry(g, 'createPrimeStellaOctangula:base');
    });
    const base = new THREE.Mesh(baseGeometry, mat);
    base.position.y = -0.3;
    base.rotation.y = Math.PI / 6;
    group.add(base);

    const rodGeometry = getCachedGeometry('prime-star-rod', () => {
      const g = new THREE.CylinderGeometry(0.07, 0.07, 0.75, 12, 1);
      return this._validateGeometry(g, 'createPrimeStellaOctangula:rod');
    });
    const rod = new THREE.Mesh(rodGeometry, mat);
    rod.position.y = 0.05;
    group.add(rod);

    const coreGeometry = getCachedGeometry('prime-star-core', () => {
      const g = new THREE.OctahedronGeometry(0.24, 0);
      return this._validateGeometry(g, 'createPrimeStellaOctangula:core');
    });
    const core = new THREE.Mesh(coreGeometry, mat);
    core.position.y = 0.32;
    core.userData.isCore = true;
    group.add(core);

    const tetraGeometry = getCachedGeometry('prime-star-tetra', () => {
      const g = new THREE.TetrahedronGeometry(0.5, 0);
      return this._validateGeometry(g, 'createPrimeStellaOctangula:tetra');
    });
    const tetraA = new THREE.Mesh(tetraGeometry, mat);
    tetraA.position.y = 0.32;
    tetraA.rotation.set(0, Math.PI * 0.25, 0);
    group.add(tetraA);

    const tetraB = new THREE.Mesh(tetraGeometry, mat);
    tetraB.position.y = 0.32;
    tetraB.rotation.set(Math.PI, Math.PI * 0.25, 0);
    tetraB.scale.set(0.9, 0.9, 0.9);
    group.add(tetraB);

    const hoopGeometry = getCachedGeometry('prime-star-hoop', () => {
      const g = new THREE.TorusGeometry(0.46, 0.03, 10, 22, Math.PI * 2);
      return this._validateGeometry(g, 'createPrimeStellaOctangula:hoop');
    });
    const hoop = new THREE.Mesh(hoopGeometry, mat);
    hoop.position.y = 0.28;
    hoop.rotation.x = Math.PI * 0.5;
    group.add(hoop);

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'PRIME';
    group.userData.geometryVariant = 'StellaOctangula_V3';
    group.userData.polycount = 540; // approx combined
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * PRIME-3: Precision Lattice
   * Perfect geometric lattice of small spheres in exact grid
   * Pure order and regularity
   */
  // Deterministic – safe for geometry cache
  static createPrimePrecisionLattice(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getPrimeMaterial();

    const baseGeometry = getCachedGeometry('prime-lattice-base', () => {
      const g = new THREE.BoxGeometry(0.68, 0.14, 0.68);
      return this._validateGeometry(g, 'createPrimePrecisionLattice:base');
    });
    const base = new THREE.Mesh(baseGeometry, mat);
    base.position.y = -0.3;
    group.add(base);

    const columnGeometry = getCachedGeometry('prime-lattice-column', () => {
      const g = new THREE.CylinderGeometry(0.09, 0.09, 0.8, 14, 1);
      return this._validateGeometry(g, 'createPrimePrecisionLattice:column');
    });
    const column = new THREE.Mesh(columnGeometry, mat);
    column.position.y = 0.05;
    group.add(column);

    const collarGeometry = getCachedGeometry('prime-lattice-collar', () => {
      const g = new THREE.TorusGeometry(0.18, 0.025, 10, 20, Math.PI * 2);
      return this._validateGeometry(g, 'createPrimePrecisionLattice:collar');
    });
    [ -0.12, 0.18, 0.48 ].forEach(offset => {
      const collar = new THREE.Mesh(collarGeometry, mat);
      collar.position.y = offset;
      collar.rotation.x = Math.PI * 0.5;
      group.add(collar);
    });

    const coreGeometry = getCachedGeometry('prime-lattice-core', () => {
      const g = new THREE.BoxGeometry(0.26, 0.26, 0.26);
      return this._validateGeometry(g, 'createPrimePrecisionLattice:core');
    });
    const core = new THREE.Mesh(coreGeometry, mat);
    core.position.y = 0.28;
    core.userData.isCore = true;
    group.add(core);

    const frameGeometry = getCachedGeometry('prime-lattice-frame', () => {
      const g = new THREE.TorusGeometry(0.55, 0.035, 10, 22, Math.PI * 2);
      return this._validateGeometry(g, 'createPrimePrecisionLattice:frame');
    });
    const frame = new THREE.Mesh(frameGeometry, mat);
    frame.scale.set(1.1, 0.8, 1);
    frame.position.y = 0.26;
    frame.rotation.y = Math.PI * 0.34;
    group.add(frame);

    const capGeometry = getCachedGeometry('prime-lattice-cap', () => {
      const g = new THREE.BoxGeometry(0.34, 0.06, 0.34);
      return this._validateGeometry(g, 'createPrimePrecisionLattice:cap');
    });
    const cap = new THREE.Mesh(capGeometry, mat);
    cap.position.y = 0.7;
    cap.rotation.y = Math.PI * 0.12;
    group.add(cap);

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'PRIME';
    group.userData.geometryVariant = 'PrecisionLattice_V3';
    group.userData.polycount = 520; // approx combined
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * PRIME-4: Tesseract Projection
   * 4D hypercube projected to 3D
   * Mathematical axiom made visible
   */
  // Deterministic – safe for geometry cache
  static createPrimeTesseractProjection(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getPrimeMaterial();

    const baseGeometry = getCachedGeometry('prime-hyper-base', () => {
      const g = new THREE.CylinderGeometry(0.6, 0.65, 0.14, 12, 1);
      return this._validateGeometry(g, 'createPrimeTesseractProjection:base');
    });
    const base = new THREE.Mesh(baseGeometry, mat);
    base.position.y = -0.32;
    group.add(base);

    const spineGeometry = getCachedGeometry('prime-hyper-spine', () => {
      const g = new THREE.CylinderGeometry(0.11, 0.11, 0.62, 14, 1);
      return this._validateGeometry(g, 'createPrimeTesseractProjection:spine');
    });
    const spine = new THREE.Mesh(spineGeometry, mat);
    spine.position.y = 0.02;
    group.add(spine);

    const innerGeometry = getCachedGeometry('prime-hyper-inner', () => {
      const g = new THREE.BoxGeometry(0.28, 0.28, 0.28);
      return this._validateGeometry(g, 'createPrimeTesseractProjection:inner');
    });
    const inner = new THREE.Mesh(innerGeometry, mat);
    inner.position.y = 0.28;
    inner.userData.isCore = true;
    group.add(inner);

    const outerGeometry = getCachedGeometry('prime-hyper-outer', () => {
      const g = new THREE.BoxGeometry(0.64, 0.64, 0.64);
      return this._validateGeometry(g, 'createPrimeTesseractProjection:outer');
    });
    const outer = new THREE.Mesh(outerGeometry, mat);
    outer.position.y = 0.28;
    outer.rotation.y = Math.PI * 0.25;
    group.add(outer);

    const braceGeometry = getCachedGeometry('prime-hyper-brace', () => {
      const g = new THREE.CylinderGeometry(0.035, 0.035, 0.82, 10, 1);
      return this._validateGeometry(g, 'createPrimeTesseractProjection:brace');
    });
    const brace = new THREE.Mesh(braceGeometry, mat);
    brace.position.y = 0.28;
    brace.rotation.set(Math.PI * 0.25, Math.PI * 0.25, 0);
    group.add(brace);

    const beaconGeometry = getCachedGeometry('prime-hyper-beacon', () => {
      const g = new THREE.ConeGeometry(0.14, 0.16, 12, 1);
      return this._validateGeometry(g, 'createPrimeTesseractProjection:beacon');
    });
    const beacon = new THREE.Mesh(beaconGeometry, mat);
    beacon.position.y = 0.72;
    group.add(beacon);

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'PRIME';
    group.userData.geometryVariant = 'TesseractProjection_V3';
    group.userData.polycount = 620; // approx combined
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * PRIME-5: Symmetry-Locked Core
   * Perfect sphere-like form but faceted into octahedron
   * Minimal axiom, maximum symmetry
   */
  // Deterministic – safe for geometry cache
  static createPrimeSymmetryLockedCore(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getPrimeMaterial();

    const baseGeometry = getCachedGeometry('prime-axis-base', () => {
      const g = new THREE.CylinderGeometry(0.6, 0.64, 0.12, 12, 1);
      return this._validateGeometry(g, 'createPrimeSymmetryLockedCore:base');
    });
    const base = new THREE.Mesh(baseGeometry, mat);
    base.position.y = -0.32;
    group.add(base);

    const baseStepGeometry = getCachedGeometry('prime-axis-base-step', () => {
      const g = new THREE.CylinderGeometry(0.48, 0.52, 0.08, 12, 1);
      return this._validateGeometry(g, 'createPrimeSymmetryLockedCore:baseStep');
    });
    const baseStep = new THREE.Mesh(baseStepGeometry, mat);
    baseStep.position.y = -0.24;
    group.add(baseStep);

    const spineGeometry = getCachedGeometry('prime-axis-spine', () => {
      const g = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 14, 1);
      return this._validateGeometry(g, 'createPrimeSymmetryLockedCore:spine');
    });
    const spine = new THREE.Mesh(spineGeometry, mat);
    spine.position.y = 0.05;
    group.add(spine);

    const coreGeometry = getCachedGeometry('prime-axis-core', () => {
      const g = new THREE.SphereGeometry(0.24, 12, 12);
      return this._validateGeometry(g, 'createPrimeSymmetryLockedCore:core');
    });
    const core = new THREE.Mesh(coreGeometry, mat);
    core.position.y = 0.3;
    core.userData.isCore = true;
    group.add(core);

    const ringGeometry = getCachedGeometry('prime-axis-ring', () => {
      const g = new THREE.TorusGeometry(0.48, 0.04, 10, 24, Math.PI * 2);
      return this._validateGeometry(g, 'createPrimeSymmetryLockedCore:ring');
    });
    const ringX = new THREE.Mesh(ringGeometry, mat);
    ringX.position.y = 0.3;
    ringX.rotation.x = Math.PI * 0.5;
    group.add(ringX);

    const ringY = new THREE.Mesh(ringGeometry, mat);
    ringY.position.y = 0.3;
    ringY.rotation.y = Math.PI * 0.5;
    group.add(ringY);

    const ringTilt = new THREE.Mesh(ringGeometry, mat);
    ringTilt.position.y = 0.34;
    ringTilt.scale.set(0.9, 0.9, 0.9);
    ringTilt.rotation.set(Math.PI * 0.12, Math.PI * 0.32, 0);
    group.add(ringTilt);

    const crownGeometry = getCachedGeometry('prime-axis-crown', () => {
      const g = new THREE.CylinderGeometry(0.24, 0.26, 0.06, 12, 1);
      return this._validateGeometry(g, 'createPrimeSymmetryLockedCore:crown');
    });
    const crown = new THREE.Mesh(crownGeometry, mat);
    crown.position.y = 0.7;
    group.add(crown);

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'PRIME';
    group.userData.geometryVariant = 'SymmetryLockedCore_V3';
    group.userData.polycount = 620; // approx combined
    this._precomputeAndFreeze(group);
    return group;
  }
  
  // ===== ERROR CATEGORY (Frozen Corruption) =====
  
  /**
   * ERROR-0: Intersecting Solids
   * Two cubes overlapping impossibly
   * Logical contradiction made solid
   */
  // Deterministic – safe for geometry cache
  // Deterministic – safe for geometry cache
  static createErrorIntersectingSolids(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getErrorMaterial();

    // Base: cracked pad
    const baseGeometry = getCachedGeometry('error-cross-base', () => {
      const g = new THREE.BoxGeometry(0.9, 0.12, 0.9);
      return this._validateGeometry(g, 'createErrorIntersectingSolids:base');
    });
    const base = new THREE.Mesh(baseGeometry, mat);
    base.position.y = -0.4;
    base.rotation.y = Math.PI * 0.06;
    group.add(base);

    // Spine: broken column
    const spineGeometry = getCachedGeometry('error-cross-spine', () => {
      const g = new THREE.CylinderGeometry(0.08, 0.08, 0.55, 10, 1);
      return this._validateGeometry(g, 'createErrorIntersectingSolids:spine');
    });
    const spine = new THREE.Mesh(spineGeometry, mat);
    spine.position.y = -0.05;
    spine.rotation.z = -Math.PI * 0.08;
    group.add(spine);

    // Core cubes intersecting
    const cubeGeometry = getCachedGeometry('error-cross-cube', () => {
      const g = new THREE.BoxGeometry(0.46, 0.46, 0.46);
      return this._validateGeometry(g, 'createErrorIntersectingSolids:cube');
    });
    const cubeA = new THREE.Mesh(cubeGeometry, mat);
    cubeA.position.y = 0.16;
    cubeA.rotation.set(0.28, 0.18, 0.12);
    cubeA.userData.isCore = true;
    group.add(cubeA);

    const cubeB = new THREE.Mesh(cubeGeometry, mat);
    cubeB.position.set(0.18, 0.24, -0.08);
    cubeB.rotation.set(-0.18, 0.42, -0.14);
    group.add(cubeB);

    // Fractured ring (open)
    const ringGeometry = getCachedGeometry('error-cross-ring', () => {
      const g = new THREE.TorusGeometry(0.62, 0.05, 8, 18, Math.PI * 1.45);
      return this._validateGeometry(g, 'createErrorIntersectingSolids:ring');
    });
    const ring = new THREE.Mesh(ringGeometry, mat);
    ring.position.y = 0.12;
    ring.rotation.set(0.08, Math.PI * 0.22, 0.3);
    group.add(ring);

    // Void shard
    const voidGeometry = getCachedGeometry('error-cross-void', () => {
      const g = new THREE.TetrahedronGeometry(0.18, 0);
      return this._validateGeometry(g, 'createErrorIntersectingSolids:void');
    });
    const voidShard = new THREE.Mesh(voidGeometry, mat);
    voidShard.position.set(-0.06, 0.05, 0.25);
    voidShard.rotation.y = Math.PI * 0.12;
    group.add(voidShard);

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'ERROR';
    group.userData.geometryVariant = 'IntersectingSolids_V3';
    group.userData.polycount = 520; // approx combined
    group.userData.isError = true;
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * ERROR-1: Inverted Normals Mesh
   * Mesh with deliberately inverted normals (inside-out)
   * Feels topologically broken
   */
  // Deterministic – safe for geometry cache
  // Deterministic – safe for geometry cache
  static createErrorInvertedNormals(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getErrorMaterial();

    const baseGeometry = getCachedGeometry('error-inside-base', () => {
      const g = new THREE.CylinderGeometry(0.62, 0.62, 0.1, 6, 1);
      return this._validateGeometry(g, 'createErrorInvertedNormals:base');
    });
    const base = new THREE.Mesh(baseGeometry, mat);
    base.position.y = -0.34;
    base.rotation.y = Math.PI * 0.08;
    group.add(base);

    const spineGeometry = getCachedGeometry('error-inside-spine', () => {
      const g = new THREE.CylinderGeometry(0.07, 0.07, 0.55, 10, 1);
      return this._validateGeometry(g, 'createErrorInvertedNormals:spine');
    });
    const spine = new THREE.Mesh(spineGeometry, mat);
    spine.position.y = -0.02;
    spine.rotation.x = Math.PI * 0.12;
    group.add(spine);

    const coreGeometry = getCachedGeometry('error-inside-core', () => {
      const g = new THREE.SphereGeometry(0.42, 14, 14);
      return this._validateGeometry(g, 'createErrorInvertedNormals:core');
    });
    const core = new THREE.Mesh(coreGeometry, mat);
    core.position.y = 0.22;
    core.scale.z = -1; // inside-out feel
    core.userData.isCore = true;
    group.add(core);

    const shellGeometry = getCachedGeometry('error-inside-shell', () => {
      const g = new THREE.SphereGeometry(0.46, 14, 14);
      return this._validateGeometry(g, 'createErrorInvertedNormals:shell');
    });
    const shell = new THREE.Mesh(shellGeometry, mat);
    shell.position.y = 0.22;
    shell.scale.set(1.03, 1.03, 1.03);
    shell.rotation.y = Math.PI * 0.18;
    group.add(shell);

    const ringGeometry = getCachedGeometry('error-inside-ring', () => {
      const g = new THREE.TorusGeometry(0.54, 0.04, 8, 18, Math.PI * 1.45);
      return this._validateGeometry(g, 'createErrorInvertedNormals:ring');
    });
    const ringA = new THREE.Mesh(ringGeometry, mat);
    ringA.position.y = 0.18;
    ringA.rotation.x = Math.PI * 0.5;
    group.add(ringA);

    const ringB = new THREE.Mesh(ringGeometry, mat);
    ringB.position.y = 0.28;
    ringB.rotation.set(Math.PI * 0.45, Math.PI * 0.28, 0);
    group.add(ringB);

    const voidGeometry = getCachedGeometry('error-inside-void', () => {
      const g = new THREE.TetrahedronGeometry(0.16, 0);
      return this._validateGeometry(g, 'createErrorInvertedNormals:void');
    });
    const voidShard = new THREE.Mesh(voidGeometry, mat);
    voidShard.position.set(-0.12, 0.08, 0.22);
    group.add(voidShard);

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'ERROR';
    group.userData.geometryVariant = 'InvertedNormals_V3';
    group.userData.polycount = 640; // approx combined
    group.userData.isError = true;
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * ERROR-2: Self-Clipping Geometry
   * Geometry that passes through itself
   * Impossible topology
   */
  // Deterministic – safe for geometry cache
  // Deterministic – safe for geometry cache
  static createErrorSelfClipping(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getErrorMaterial();

    const baseGeometry = getCachedGeometry('error-shear-base', () => {
      const g = new THREE.BoxGeometry(0.82, 0.12, 0.72);
      return this._validateGeometry(g, 'createErrorSelfClipping:base');
    });
    const base = new THREE.Mesh(baseGeometry, mat);
    base.position.y = -0.36;
    base.rotation.y = Math.PI * 0.1;
    group.add(base);

    const spineGeometry = getCachedGeometry('error-shear-spine', () => {
      const g = new THREE.CylinderGeometry(0.07, 0.07, 0.55, 10, 1);
      return this._validateGeometry(g, 'createErrorSelfClipping:spine');
    });
    const spine = new THREE.Mesh(spineGeometry, mat);
    spine.position.y = -0.04;
    spine.rotation.z = Math.PI * 0.12;
    group.add(spine);

    const coreGeometry = getCachedGeometry('error-shear-core', () => {
      const g = new THREE.BoxGeometry(0.42, 0.8, 0.32);
      return this._validateGeometry(g, 'createErrorSelfClipping:core');
    });
    const core = new THREE.Mesh(coreGeometry, mat);
    core.position.y = 0.2;
    core.rotation.y = Math.PI * 0.12;
    core.userData.isCore = true;
    group.add(core);

    const shearGeometry = getCachedGeometry('error-shear-slab', () => {
      const g = new THREE.BoxGeometry(0.7, 0.14, 0.5);
      return this._validateGeometry(g, 'createErrorSelfClipping:slab');
    });
    const shear = new THREE.Mesh(shearGeometry, mat);
    shear.position.set(-0.05, 0.18, 0.0);
    shear.rotation.set(0.0, Math.PI * 0.28, Math.PI * 0.18);
    group.add(shear);

    const frameGeometry = getCachedGeometry('error-shear-frame', () => {
      const g = new THREE.TorusGeometry(0.58, 0.035, 8, 18, Math.PI * 1.35);
      return this._validateGeometry(g, 'createErrorSelfClipping:frame');
    });
    const frame = new THREE.Mesh(frameGeometry, mat);
    frame.position.y = 0.08;
    frame.rotation.set(Math.PI * 0.48, Math.PI * 0.22, 0);
    group.add(frame);

    const voidGeometry = getCachedGeometry('error-shear-void', () => {
      const g = new THREE.TetrahedronGeometry(0.16, 0);
      return this._validateGeometry(g, 'createErrorSelfClipping:void');
    });
    const voidShard = new THREE.Mesh(voidGeometry, mat);
    voidShard.position.set(0.12, 0.02, -0.24);
    group.add(voidShard);

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'ERROR';
    group.userData.geometryVariant = 'SelfClipping_V3';
    group.userData.polycount = 600; // approx combined
    group.userData.isError = true;
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * ERROR-3: Folded Impossible Object
   * Penrose-like impossible triangle rendered in 3D
   * Contradiction made visible
   */
  // Deterministic – safe for geometry cache
  // Deterministic – safe for geometry cache
  static createErrorFoldedImpossible(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getErrorMaterial();

    const baseGeometry = getCachedGeometry('error-fold-base', () => {
      const g = new THREE.CylinderGeometry(0.58, 0.62, 0.12, 3, 1);
      return this._validateGeometry(g, 'createErrorFoldedImpossible:base');
    });
    const base = new THREE.Mesh(baseGeometry, mat);
    base.position.y = -0.34;
    base.rotation.y = Math.PI * 0.1;
    group.add(base);

    const spineGeometry = getCachedGeometry('error-fold-spine', () => {
      const g = new THREE.CylinderGeometry(0.07, 0.07, 0.6, 10, 1);
      return this._validateGeometry(g, 'createErrorFoldedImpossible:spine');
    });
    const spine = new THREE.Mesh(spineGeometry, mat);
    spine.position.y = -0.02;
    spine.rotation.z = -Math.PI * 0.22;
    group.add(spine);

    const ribbonGeometry = getCachedGeometry('error-fold-ribbon', () => {
      const g = new THREE.BoxGeometry(0.18, 0.7, 0.28);
      return this._validateGeometry(g, 'createErrorFoldedImpossible:ribbon');
    });
    const ribbonA = new THREE.Mesh(ribbonGeometry, mat);
    ribbonA.position.set(0.12, 0.28, -0.04);
    ribbonA.rotation.set(Math.PI * 0.18, Math.PI * 0.32, 0);
    ribbonA.userData.isCore = true;
    group.add(ribbonA);

    const ribbonB = new THREE.Mesh(ribbonGeometry, mat);
    ribbonB.position.set(-0.14, 0.18, 0.18);
    ribbonB.rotation.set(-Math.PI * 0.22, Math.PI * 0.12, Math.PI * 0.3);
    group.add(ribbonB);

    const twistedBandGeometry = getCachedGeometry('error-fold-band', () => {
      const g = new THREE.TorusGeometry(0.58, 0.04, 8, 18, Math.PI * 1.5);
      return this._validateGeometry(g, 'createErrorFoldedImpossible:band');
    });
    const band = new THREE.Mesh(twistedBandGeometry, mat);
    band.position.y = 0.12;
    band.rotation.set(Math.PI * 0.32, Math.PI * 0.08, Math.PI * 0.22);
    group.add(band);

    const shadowGeometry = getCachedGeometry('error-fold-shadow', () => {
      const g = new THREE.BoxGeometry(0.2, 0.72, 0.3);
      return this._validateGeometry(g, 'createErrorFoldedImpossible:shadow');
    });
    const shadow = new THREE.Mesh(shadowGeometry, mat);
    shadow.position.set(0.02, 0.26, -0.02);
    shadow.scale.set(1.05, 1.05, 1.05);
    shadow.rotation.set(-Math.PI * 0.14, Math.PI * 0.26, -Math.PI * 0.08);
    group.add(shadow);

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'ERROR';
    group.userData.geometryVariant = 'FoldedImpossible_V3';
    group.userData.polycount = 620; // approx combined
    group.userData.isError = true;
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * ERROR-4: Topology Tear Artifact
   * Mesh with discontinuous faces (torn apart)
   * Manifold violation
   */
  // Deterministic – safe for geometry cache
  // Deterministic – safe for geometry cache
  static createErrorTopologyTear(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getErrorMaterial();

    const baseGeometry = getCachedGeometry('error-tear-base', () => {
      const g = new THREE.CylinderGeometry(0.62, 0.65, 0.12, 12, 1);
      return this._validateGeometry(g, 'createErrorTopologyTear:base');
    });
    const base = new THREE.Mesh(baseGeometry, mat);
    base.position.y = -0.34;
    base.rotation.y = Math.PI * 0.05;
    group.add(base);

    const coreGeometry = getCachedGeometry('error-tear-core', () => {
      const g = new THREE.DodecahedronGeometry(0.42, 0);
      const pos = g.getAttribute('position');
      const arr = pos.array;
      for (let i = 0; i < arr.length; i += 3) {
        if (arr[i + 2] > 0.25 && arr[i] > 0) {
          arr[i] *= 0.55;
          arr[i + 1] *= 0.55;
          arr[i + 2] *= 0.35;
        }
      }
      pos.needsUpdate = true;
      g.computeVertexNormals();
      return this._validateGeometry(g, 'createErrorTopologyTear:core');
    });
    const core = new THREE.Mesh(coreGeometry, mat);
    core.position.y = 0.14;
    core.rotation.y = Math.PI * 0.18;
    core.userData.isCore = true;
    group.add(core);

    const cageGeometry = getCachedGeometry('error-tear-cage', () => {
      const g = new THREE.IcosahedronGeometry(0.6, 0);
      return this._validateGeometry(g, 'createErrorTopologyTear:cage');
    });
    const cage = new THREE.Mesh(cageGeometry, mat);
    cage.scale.set(1.05, 0.9, 1.1);
    cage.position.y = 0.12;
    cage.rotation.set(0.18, Math.PI * 0.22, 0);
    group.add(cage);

    const ringGeometry = getCachedGeometry('error-tear-ring', () => {
      const g = new THREE.TorusGeometry(0.5, 0.03, 8, 18, Math.PI * 1.2);
      return this._validateGeometry(g, 'createErrorTopologyTear:ring');
    });
    const ring = new THREE.Mesh(ringGeometry, mat);
    ring.position.y = 0.04;
    ring.rotation.set(Math.PI * 0.5, Math.PI * 0.1, Math.PI * 0.24);
    group.add(ring);

    const voidGeometry = getCachedGeometry('error-tear-void', () => {
      const g = new THREE.TetrahedronGeometry(0.16, 0);
      return this._validateGeometry(g, 'createErrorTopologyTear:void');
    });
    const voidShard = new THREE.Mesh(voidGeometry, mat);
    voidShard.position.set(0.06, 0.02, 0.32);
    group.add(voidShard);

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'ERROR';
    group.userData.geometryVariant = 'TopologyTear_V3';
    group.userData.polycount = 640; // approx combined
    group.userData.isError = true;
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * ERROR-5: Corrupted Manifold
   * Non-manifold mesh with floating faces and duplicated vertices
   * Complete geometric corruption
   */
  // Deterministic – safe for geometry cache
  // Deterministic – safe for geometry cache
  static createErrorCorruptedManifold(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getErrorMaterial();

    const baseGeometry = getCachedGeometry('error-knot-base', () => {
      const g = new THREE.CylinderGeometry(0.7, 0.74, 0.12, 8, 1);
      return this._validateGeometry(g, 'createErrorCorruptedManifold:base');
    });
    const base = new THREE.Mesh(baseGeometry, mat);
    base.position.y = -0.36;
    base.rotation.y = Math.PI * 0.08;
    group.add(base);

    const spineGeometry = getCachedGeometry('error-knot-spine', () => {
      const g = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 10, 1);
      return this._validateGeometry(g, 'createErrorCorruptedManifold:spine');
    });
    const spine = new THREE.Mesh(spineGeometry, mat);
    spine.position.y = -0.06;
    spine.rotation.z = Math.PI * 0.15;
    group.add(spine);

    const coreGeometry = getCachedGeometry('error-knot-core', () => {
      const g = new THREE.TorusKnotGeometry(0.32, 0.08, 40, 8, 2, 3);
      return this._validateGeometry(g, 'createErrorCorruptedManifold:core');
    });
    const core = new THREE.Mesh(coreGeometry, mat);
    core.position.y = 0.16;
    core.rotation.set(Math.PI * 0.15, Math.PI * 0.2, 0);
    core.userData.isCore = true;
    group.add(core);

    const shadowGeometry = getCachedGeometry('error-knot-shadow', () => {
      const g = new THREE.TorusKnotGeometry(0.32, 0.08, 40, 8, 2, 3);
      return this._validateGeometry(g, 'createErrorCorruptedManifold:shadow');
    });
    const shadow = new THREE.Mesh(shadowGeometry, mat);
    shadow.position.y = 0.16;
    shadow.scale.set(1.02, 1.02, 1.02);
    shadow.rotation.set(-Math.PI * 0.12, Math.PI * 0.18, Math.PI * 0.08);
    group.add(shadow);

    const ringGeometry = getCachedGeometry('error-knot-ring', () => {
      const g = new THREE.TorusGeometry(0.62, 0.045, 8, 18, Math.PI * 1.5);
      return this._validateGeometry(g, 'createErrorCorruptedManifold:ring');
    });
    const ring = new THREE.Mesh(ringGeometry, mat);
    ring.position.y = 0.1;
    ring.rotation.set(Math.PI * 0.5, Math.PI * 0.12, Math.PI * 0.3);
    group.add(ring);

    const miniRingGeometry = getCachedGeometry('error-knot-miniring', () => {
      const g = new THREE.TorusGeometry(0.28, 0.03, 8, 18, Math.PI * 1.1);
      return this._validateGeometry(g, 'createErrorCorruptedManifold:miniring');
    });
    const miniRing = new THREE.Mesh(miniRingGeometry, mat);
    miniRing.position.y = 0.36;
    miniRing.rotation.set(Math.PI * 0.42, Math.PI * 0.28, 0);
    group.add(miniRing);

    const voidGeometry = getCachedGeometry('error-knot-void', () => {
      const g = new THREE.SphereGeometry(0.12, 10, 10);
      return this._validateGeometry(g, 'createErrorCorruptedManifold:void');
    });
    const voidOrb = new THREE.Mesh(voidGeometry, mat);
    voidOrb.position.y = 0.18;
    group.add(voidOrb);

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'ERROR';
    group.userData.geometryVariant = 'CorruptedManifold_V3';
    group.userData.polycount = 820; // approx combined
    group.userData.isError = true;
    this._precomputeAndFreeze(group);
    return group;
  }
  
  // ===== EMOTIONAL CATEGORY (Crystalline Organics) =====
  
  /**
   * EMOTIONAL-0: Heart Crystal
   * Heart-like shape but fully faceted
   * Intimate and crystalline
   */
  // Deterministic – safe for geometry cache
  static createEmotionalHeartCrystal(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getEmotionalMaterial();

    // Base: grounded hex pedestal
    const baseGeometry = getCachedGeometry('emo-heart-base', () => {
      const g = new THREE.CylinderGeometry(0.6, 0.55, 0.18, 6, 1);
      this._validateGeometry(g, 'createEmotionalHeartCrystal:base');
      return g;
    });
    const base = new THREE.Mesh(baseGeometry, mat);
    base.position.y = -0.28;
    group.add(base);

    // Spine: slender column piercing upward
    const spineGeometry = getCachedGeometry('emo-heart-spine', () => {
      const g = new THREE.CylinderGeometry(0.08, 0.08, 0.65, 8, 1);
      this._validateGeometry(g, 'createEmotionalHeartCrystal:spine');
      return g;
    });
    const spine = new THREE.Mesh(spineGeometry, mat);
    spine.position.y = 0.05;
    group.add(spine);

    // Core: faceted diamond
    const coreGeometry = getCachedGeometry('emo-heart-core', () => {
      const g = new THREE.OctahedronGeometry(0.28, 1);
      this._validateGeometry(g, 'createEmotionalHeartCrystal:core');
      return g;
    });
    const core = new THREE.Mesh(coreGeometry, mat);
    core.position.y = 0.32;
    core.rotation.y = Math.PI * 0.25;
    core.userData.isCore = true;
    group.add(core);

    // Orbit: single tilted ring guarding the core
    const orbitGeometry = getCachedGeometry('emo-heart-orbit', () => {
      const g = new THREE.TorusGeometry(0.55, 0.04, 8, 18, Math.PI * 2);
      this._validateGeometry(g, 'createEmotionalHeartCrystal:orbit');
      return g;
    });
    const orbit = new THREE.Mesh(orbitGeometry, mat);
    orbit.position.y = 0.28;
    orbit.rotation.x = Math.PI * 0.2;
    orbit.rotation.z = Math.PI * 0.08;
    group.add(orbit);

    // Accent: rear fin to break symmetry
    const finGeometry = getCachedGeometry('emo-heart-fin', () => {
      const g = new THREE.BoxGeometry(0.12, 0.38, 0.08);
      this._validateGeometry(g, 'createEmotionalHeartCrystal:fin');
      return g;
    });
    const fin = new THREE.Mesh(finGeometry, mat);
    fin.position.set(0, 0.05, -0.32);
    fin.rotation.x = -Math.PI * 0.05;
    group.add(fin);

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'EMOTIONAL';
    group.userData.geometryVariant = 'HeartCrystal_V3';
    group.userData.polycount = 420; // approx combined
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * EMOTIONAL-1: Neural Lobe Crystal
   * Brain-like with faceted surface
   * Feels thoughtful and organic
   */
  // Deterministic – safe for geometry cache
  // Deterministic – safe for geometry cache
  static createEmotionalNeuralLobe(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getEmotionalMaterial();

    // Base: trilateral pad
    const baseGeometry = getCachedGeometry('emo-neural-base', () => {
      const g = new THREE.CylinderGeometry(0.5, 0.48, 0.12, 3, 1);
      this._validateGeometry(g, 'createEmotionalNeuralLobe:base');
      return g;
    });
    const base = new THREE.Mesh(baseGeometry, mat);
    base.rotation.y = Math.PI / 6;
    base.position.y = -0.32;
    group.add(base);

    // Twin braided columns
    const columnGeometry = getCachedGeometry('emo-neural-column', () => {
      const g = new THREE.CylinderGeometry(0.07, 0.07, 0.6, 10, 1);
      this._validateGeometry(g, 'createEmotionalNeuralLobe:column');
      return g;
    });
    const left = new THREE.Mesh(columnGeometry, mat);
    left.position.set(-0.16, 0, 0.05);
    left.rotation.z = -Math.PI * 0.08;
    group.add(left);

    const right = new THREE.Mesh(columnGeometry, mat);
    right.position.set(0.16, 0, -0.05);
    right.rotation.z = Math.PI * 0.08;
    group.add(right);

    // Core: bi-lobe capsule
    const coreGeometry = getCachedGeometry('emo-neural-core', () => {
      const g = new THREE.SphereGeometry(0.24, 10, 10);
      this._validateGeometry(g, 'createEmotionalNeuralLobe:core');
      return g;
    });
    const core = new THREE.Mesh(coreGeometry, mat);
    core.scale.set(1.2, 0.85, 1.35);
    core.position.y = 0.26;
    core.rotation.y = Math.PI * 0.1;
    core.userData.isCore = true;
    group.add(core);

    // Orbit: open arc frame
    const arcGeometry = getCachedGeometry('emo-neural-arc', () => {
      const g = new THREE.TorusGeometry(0.55, 0.035, 8, 18, Math.PI * 1.5);
      this._validateGeometry(g, 'createEmotionalNeuralLobe:arc');
      return g;
    });
    const arc = new THREE.Mesh(arcGeometry, mat);
    arc.position.set(0.08, 0.2, 0);
    arc.rotation.y = Math.PI * 0.35;
    arc.rotation.x = Math.PI * 0.05;
    group.add(arc);

    // Stud accents (signal anchors)
    const studGeometry = getCachedGeometry('emo-neural-stud', () => {
      const g = new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8, 1);
      this._validateGeometry(g, 'createEmotionalNeuralLobe:stud');
      return g;
    });
    const studPositions = [
      [0.0, 0.05, 0.42],
      [-0.22, 0.02, -0.32]
    ];
    studPositions.forEach(pos => {
      const stud = new THREE.Mesh(studGeometry, mat);
      stud.position.set(pos[0], pos[1], pos[2]);
      group.add(stud);
    });

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'EMOTIONAL';
    group.userData.geometryVariant = 'NeuralLobe_V3';
    group.userData.polycount = 520; // approx combined
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * EMOTIONAL-2: Blooming Gem Form
   * Blossom-like crystal petals
   * Feels opening and vulnerable
   */
  // Deterministic – safe for geometry cache
  // Deterministic – safe for geometry cache
  static createEmotionalBloomingGem(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getEmotionalMaterial();

    // Base pedestal with subtle petals
    const baseGeometry = getCachedGeometry('emo-bloom-base', () => {
      const g = new THREE.CylinderGeometry(0.48, 0.55, 0.14, 8, 1);
      this._validateGeometry(g, 'createEmotionalBloomingGem:base');
      return g;
    });
    const base = new THREE.Mesh(baseGeometry, mat);
    base.position.y = -0.28;
    group.add(base);

    // Stem: flared upward trumpet
    const stemGeometry = getCachedGeometry('emo-bloom-stem', () => {
      const g = new THREE.CylinderGeometry(0.06, 0.1, 0.38, 10, 1);
      this._validateGeometry(g, 'createEmotionalBloomingGem:stem');
      return g;
    });
    const stem = new THREE.Mesh(stemGeometry, mat);
    stem.position.y = -0.02;
    group.add(stem);

    // Core gem
    const coreGeometry = getCachedGeometry('emo-bloom-core', () => {
      const g = new THREE.DodecahedronGeometry(0.18, 0);
      this._validateGeometry(g, 'createEmotionalBloomingGem:core');
      return g;
    });
    const core = new THREE.Mesh(coreGeometry, mat);
    core.position.y = 0.3;
    core.rotation.y = Math.PI * 0.1;
    core.userData.isCore = true;
    group.add(core);

    // Petal fins (4) in rising swirl
    const finGeometry = getCachedGeometry('emo-bloom-fin', () => {
      const g = new THREE.BoxGeometry(0.12, 0.42, 0.05);
      this._validateGeometry(g, 'createEmotionalBloomingGem:fin');
      return g;
    });
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const fin = new THREE.Mesh(finGeometry, mat);
      fin.position.set(Math.cos(angle) * 0.42, -0.05 + i * 0.08, Math.sin(angle) * 0.42);
      fin.rotation.y = angle + Math.PI * 0.25;
      fin.rotation.z = Math.PI * 0.08;
      group.add(fin);
    }

    // Inner ring to lock hierarchy
    const ringGeometry = getCachedGeometry('emo-bloom-ring', () => {
      const g = new THREE.TorusGeometry(0.2, 0.02, 8, 16, Math.PI * 2);
      this._validateGeometry(g, 'createEmotionalBloomingGem:ring');
      return g;
    });
    const ring = new THREE.Mesh(ringGeometry, mat);
    ring.position.y = 0.18;
    ring.rotation.x = Math.PI * 0.5;
    group.add(ring);

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'EMOTIONAL';
    group.userData.geometryVariant = 'BloomingGem_V3';
    group.userData.polycount = 480; // approx combined
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * EMOTIONAL-3: Tear-Shaped Core
   * Teardrop with faceted surface
   * Feels melancholic and fluid
   */
  // Deterministic – safe for geometry cache
  // Deterministic – safe for geometry cache
  static createEmotionalTearShaped(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getEmotionalMaterial();

    // Base: tilted ovoid slab
    const baseGeometry = getCachedGeometry('emo-tear-base', () => {
      const g = new THREE.CylinderGeometry(0.46, 0.46, 0.1, 10, 1);
      this._validateGeometry(g, 'createEmotionalTearShaped:base');
      return g;
    });
    const base = new THREE.Mesh(baseGeometry, mat);
    base.scale.set(0.85, 1, 0.6);
    base.position.y = -0.32;
    base.rotation.x = -Math.PI * 0.05;
    group.add(base);

    // Spine: subtle forward bend
    const spineGeometry = getCachedGeometry('emo-tear-spine', () => {
      const g = new THREE.CylinderGeometry(0.06, 0.06, 0.55, 8, 1);
      this._validateGeometry(g, 'createEmotionalTearShaped:spine');
      return g;
    });
    const spine = new THREE.Mesh(spineGeometry, mat);
    spine.position.set(0, -0.05, 0.02);
    spine.rotation.x = Math.PI * 0.08;
    group.add(spine);

    // Core: elongated teardrop (lathe)
    const coreGeometry = getCachedGeometry('emo-tear-core', () => {
      const points = [];
      points.push(new THREE.Vector2(0, 0.38));
      points.push(new THREE.Vector2(0.15, 0.32));
      points.push(new THREE.Vector2(0.12, 0.05));
      points.push(new THREE.Vector2(0.06, -0.28));
      points.push(new THREE.Vector2(0, -0.32));
      const g = new THREE.LatheGeometry(points, 14, 0, Math.PI * 2);
      this._validateGeometry(g, 'createEmotionalTearShaped:core');
      return g;
    });
    const core = new THREE.Mesh(coreGeometry, mat);
    core.position.y = 0.08;
    core.rotation.z = Math.PI * 0.02;
    core.userData.isCore = true;
    group.add(core);

    // Orbit: vertical hoop
    const hoopGeometry = getCachedGeometry('emo-tear-hoop', () => {
      const g = new THREE.TorusGeometry(0.36, 0.022, 8, 18, Math.PI * 2);
      this._validateGeometry(g, 'createEmotionalTearShaped:hoop');
      return g;
    });
    const hoop = new THREE.Mesh(hoopGeometry, mat);
    hoop.position.y = 0.05;
    hoop.rotation.x = Math.PI * 0.5;
    hoop.rotation.y = Math.PI * 0.12;
    group.add(hoop);

    // Counterweight bead
    const beadGeometry = getCachedGeometry('emo-tear-bead', () => {
      const g = new THREE.SphereGeometry(0.08, 8, 8);
      this._validateGeometry(g, 'createEmotionalTearShaped:bead');
      return g;
    });
    const bead = new THREE.Mesh(beadGeometry, mat);
    bead.position.set(0, -0.05, -0.34);
    group.add(bead);

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'EMOTIONAL';
    group.userData.geometryVariant = 'TearShaped_V3';
    group.userData.polycount = 520; // approx combined
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * EMOTIONAL-4: Folded Emotional Node
   * Folded/closed form suggesting introspection
   * Organic but symmetrical
   */
  // Deterministic – safe for geometry cache
  // Deterministic – safe for geometry cache
  static createEmotionalFolded(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getEmotionalMaterial();

    // Base: split plinth
    const plinthGeometry = getCachedGeometry('emo-folded-plinth', () => {
      const g = new THREE.BoxGeometry(0.38, 0.12, 0.38);
      this._validateGeometry(g, 'createEmotionalFolded:plinth');
      return g;
    });
    const leftPlinth = new THREE.Mesh(plinthGeometry, mat);
    leftPlinth.position.set(-0.2, -0.32, 0);
    leftPlinth.rotation.z = Math.PI * 0.06;
    group.add(leftPlinth);

    const rightPlinth = new THREE.Mesh(plinthGeometry, mat);
    rightPlinth.position.set(0.2, -0.32, 0);
    rightPlinth.rotation.z = -Math.PI * 0.06;
    group.add(rightPlinth);

    // V-beams crossing once
    const beamGeometry = getCachedGeometry('emo-folded-beam', () => {
      const g = new THREE.CylinderGeometry(0.06, 0.06, 0.65, 10, 1);
      this._validateGeometry(g, 'createEmotionalFolded:beam');
      return g;
    });
    const leftBeam = new THREE.Mesh(beamGeometry, mat);
    leftBeam.position.set(-0.12, 0.02, 0);
    leftBeam.rotation.z = Math.PI * 0.28;
    group.add(leftBeam);

    const rightBeam = new THREE.Mesh(beamGeometry, mat);
    rightBeam.position.set(0.12, 0.02, 0);
    rightBeam.rotation.z = -Math.PI * 0.28;
    group.add(rightBeam);

    // Core: rotated cube
    const coreGeometry = getCachedGeometry('emo-folded-core', () => {
      const g = new THREE.BoxGeometry(0.22, 0.22, 0.22);
      this._validateGeometry(g, 'createEmotionalFolded:core');
      return g;
    });
    const core = new THREE.Mesh(coreGeometry, mat);
    core.position.y = 0.18;
    core.rotation.set(Math.PI * 0.25, Math.PI * 0.2, 0);
    core.userData.isCore = true;
    group.add(core);

    // Orbit: rotated rectangular-ish frame (scaled torus)
    const frameGeometry = getCachedGeometry('emo-folded-frame', () => {
      const g = new THREE.TorusGeometry(0.5, 0.04, 8, 18, Math.PI * 2);
      this._validateGeometry(g, 'createEmotionalFolded:frame');
      return g;
    });
    const frame = new THREE.Mesh(frameGeometry, mat);
    frame.scale.set(1.1, 0.7, 1);
    frame.position.y = 0.14;
    frame.rotation.y = Math.PI * 0.17;
    group.add(frame);

    // Brace
    const braceGeometry = getCachedGeometry('emo-folded-brace', () => {
      const g = new THREE.CylinderGeometry(0.05, 0.05, 0.36, 8, 1);
      this._validateGeometry(g, 'createEmotionalFolded:brace');
      return g;
    });
    const brace = new THREE.Mesh(braceGeometry, mat);
    brace.position.set(0, 0.0, 0);
    brace.rotation.x = Math.PI * 0.5;
    group.add(brace);

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'EMOTIONAL';
    group.userData.geometryVariant = 'Folded_V3';
    group.userData.polycount = 560; // approx combined
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * EMOTIONAL-5: Symmetric Organic Seed
   * Seed-like form with perfect symmetry
   * Feels potential and growth
   */
  // Deterministic – safe for geometry cache
  // Deterministic – safe for geometry cache
  static createEmotionalSymmetricSeed(scale = 1.0) {
    const group = new THREE.Group();
    const mat = this._getEmotionalMaterial();

    // Base disk with crown step
    const baseGeometry = getCachedGeometry('emo-seed-base', () => {
      const g = new THREE.CylinderGeometry(0.52, 0.5, 0.12, 12, 1);
      this._validateGeometry(g, 'createEmotionalSymmetricSeed:base');
      return g;
    });
    const base = new THREE.Mesh(baseGeometry, mat);
    base.position.y = -0.34;
    group.add(base);

    const baseCrownGeometry = getCachedGeometry('emo-seed-base-crown', () => {
      const g = new THREE.CylinderGeometry(0.42, 0.46, 0.08, 12, 1);
      this._validateGeometry(g, 'createEmotionalSymmetricSeed:baseCrown');
      return g;
    });
    const baseCrown = new THREE.Mesh(baseCrownGeometry, mat);
    baseCrown.position.y = -0.26;
    group.add(baseCrown);

    // Spine
    const spineGeometry = getCachedGeometry('emo-seed-spine', () => {
      const g = new THREE.CylinderGeometry(0.09, 0.09, 0.65, 12, 1);
      this._validateGeometry(g, 'createEmotionalSymmetricSeed:spine');
      return g;
    });
    const spine = new THREE.Mesh(spineGeometry, mat);
    spine.position.y = 0.0;
    group.add(spine);

    // Core sphere
    const coreGeometry = getCachedGeometry('emo-seed-core', () => {
      const g = new THREE.SphereGeometry(0.22, 12, 12);
      this._validateGeometry(g, 'createEmotionalSymmetricSeed:core');
      return g;
    });
    const core = new THREE.Mesh(coreGeometry, mat);
    core.position.y = 0.26;
    core.userData.isCore = true;
    group.add(core);

    // Dual rings
    const ringGeometry = getCachedGeometry('emo-seed-ring', () => {
      const g = new THREE.TorusGeometry(0.42, 0.025, 8, 18, Math.PI * 2);
      this._validateGeometry(g, 'createEmotionalSymmetricSeed:ring');
      return g;
    });
    const ringHorizontal = new THREE.Mesh(ringGeometry, mat);
    ringHorizontal.position.y = 0.12;
    ringHorizontal.rotation.x = Math.PI * 0.5;
    group.add(ringHorizontal);

    const ringTilted = new THREE.Mesh(ringGeometry, mat);
    ringTilted.scale.set(0.78, 0.78, 0.78);
    ringTilted.position.y = 0.22;
    ringTilted.rotation.set(Math.PI * 0.35, Math.PI * 0.12, 0);
    group.add(ringTilted);

    // Top cap
    const capGeometry = getCachedGeometry('emo-seed-cap', () => {
      const g = new THREE.ConeGeometry(0.12, 0.14, 10, 1);
      this._validateGeometry(g, 'createEmotionalSymmetricSeed:cap');
      return g;
    });
    const cap = new THREE.Mesh(capGeometry, mat);
    cap.position.y = 0.55;
    group.add(cap);

    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'EMOTIONAL';
    group.userData.geometryVariant = 'SymmetricSeed_V3';
    group.userData.polycount = 620; // approx combined
    this._precomputeAndFreeze(group);
    return group;
  }
  
  // ===== MATERIAL FACTORIES =====
  
  static _getMythicMaterial() {
    return new THREE.MeshStandardMaterial({
      color: 0x8b7355,     // Earthy brown
      metalness: 0.4,
      roughness: 0.7,
      emissive: 0x3d2817,
      emissiveIntensity: 0.1
    });
  }
  
  static _getPrimeMaterial() {
    return new THREE.MeshStandardMaterial({
      color: 0xffffff,     // Perfect white
      metalness: 0.9,
      roughness: 0.05,
      emissive: 0xcccccc,
      emissiveIntensity: 0.2
    });
  }
  
  static _getErrorMaterial() {
    return new THREE.MeshStandardMaterial({
      color: 0xff0000,     // Error red
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0x660000,
      emissiveIntensity: 0.3,
      side: THREE.DoubleSide // For inverted normals
    });
  }
  
  static _getEmotionalMaterial() {
    return new THREE.MeshStandardMaterial({
      color: 0xff69b4,     // Hot pink / emotional
      metalness: 0.6,
      roughness: 0.2,
      emissive: 0xff1493,
      emissiveIntensity: 0.2
    });
  }
  
  /**
   * Helper: Precompute ALL properties for meshes in a group
   * 
   * Three.js 0.160+ compatibility:
   * - MUST compute boundingSphere exactly once at creation
   * - NEVER freeze geometry objects
   * - Mark immutability via userData convention only
   * - Set attributes to StaticDrawUsage (optimization hint, not lock)
   */
  static _precomputeAndFreeze(group) {
    group.traverse(child => {
      if (!child.geometry) return;

      const geo = child.geometry;

      // 1. Compute bounding sphere (once, at creation)
      try {
        if (geo.boundingSphere === null || geo.boundingSphere === undefined) {
          geo.computeBoundingSphere();
        }
      } catch (err) {
        console.error('[CanonicalGeometryFamilies] Failed to compute bounding sphere:', err);
      }

      // 2. Compute bounding box
      try {
        if (!geo.boundingBox) {
          geo.computeBoundingBox();
        }
      } catch (err) {
        console.warn('[CanonicalGeometryFamilies] Bounding box computation failed:', err);
      }

      // 3. Compute vertex normals
      try {
        if (!geo.attributes.normal) {
          geo.computeVertexNormals();
        }
      } catch (err) {
        console.warn('[CanonicalGeometryFamilies] Vertex normal computation failed:', err);
      }

      // 4. Mark immutability via userData (NOT Object.freeze)
      geo.userData = geo.userData || {};
      geo.userData.canonical = true;
      geo.userData.immutableTopology = true;

      // 5. Set attributes to static usage (optimization, not restriction)
      if (geo.attributes.position) {
        geo.attributes.position.usage = THREE.StaticDrawUsage;
      }
      if (geo.attributes.normal) {
        geo.attributes.normal.usage = THREE.StaticDrawUsage;
      }
      if (geo.attributes.uv) {
        geo.attributes.uv.usage = THREE.StaticDrawUsage;
      }
    });
  }
}
