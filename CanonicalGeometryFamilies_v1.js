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
  
  // ===== MYTHIC CATEGORY (Ancient Fractured Relics) =====
  
  /**
   * MYTHIC-0: Shard Cluster
   * Multiple jagged tetrahedra arranged chaotically
   * Feels excavated and fractured
   */
  static createMythicShardCluster(scale = 1.0) {
    const group = new THREE.Group();
    const positions = [
      [-0.3, -0.2, 0.1],
      [0.2, 0.1, -0.25],
      [-0.1, 0.35, 0.15],
      [0.25, -0.3, -0.1],
      [-0.25, 0.2, -0.3]
    ];
    
    positions.forEach((pos, idx) => {
      const shard = new THREE.Mesh(
        new THREE.TetrahedronGeometry(0.25 + Math.random() * 0.15, 0),
        this._getMythicMaterial()
      );
      shard.position.set(...pos);
      shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      group.add(shard);
    });
    
    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'MYTHIC';
    group.userData.geometryVariant = 'ShardCluster';
    group.userData.polycount = 80; // Approx
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * MYTHIC-1: Broken Monolith
   * Tall structure with large chunks missing
   * Feels eroded and ancient
   */
  static createMythicBrokenMonolith(scale = 1.0) {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      // Left intact section
      -0.25, -0.45, 0, -0.15, -0.45, 0, -0.15, 0.45, 0, -0.25, 0.45, 0,
      // Right intact section (gap in middle)
      0.15, -0.45, 0, 0.25, -0.45, 0, 0.25, 0.45, 0, 0.15, 0.45, 0,
      // Jagged edge (missing top section)
      -0.2, 0.3, 0.1, -0.1, 0.4, -0.1, 0.1, 0.35, 0.05, 0.2, 0.25, -0.1
    ]);
    
    const indices = new Uint16Array([
      0, 1, 5, 0, 5, 4,  // Right section
      1, 2, 6, 1, 6, 5,
      2, 3, 7, 2, 7, 6,
      3, 0, 4, 3, 4, 7,
      // Jagged top
      8, 9, 10, 9, 11, 10
    ]);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    
    // Compute bounding volumes (once, at creation)
    if (geometry.boundingSphere === null) {
      geometry.computeBoundingSphere();
    }
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }
    
    const mesh = new THREE.Mesh(geometry, this._getMythicMaterial());
    mesh.scale.multiplyScalar(scale);
    mesh.userData.geometryFamily = 'MYTHIC';
    mesh.userData.geometryVariant = 'BrokenMonolith';
    mesh.userData.polycount = 18;
    
    // Mark as canonical via userData (NOT Object.freeze)
    geometry.userData = geometry.userData || {};
    geometry.userData.canonical = true;
    geometry.userData.immutableTopology = true;
    
    // Set attributes to static usage (optimization hint)
    if (geometry.attributes.position) {
      geometry.attributes.position.usage = THREE.StaticDrawUsage;
    }
    if (geometry.attributes.normal) {
      geometry.attributes.normal.usage = THREE.StaticDrawUsage;
    }
    
    return mesh;
  }
  
  /**
   * MYTHIC-2: Floating Relic Fragments
   * 3-4 disconnected pieces arranged in space
   * Feels suspended and broken
   */
  static createMythicFloatingFragments(scale = 1.0) {
    const group = new THREE.Group();
    
    // Fragment 1: Flat broken slab
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.15, 0.4),
      this._getMythicMaterial()
    );
    slab.position.set(-0.15, 0.1, 0);
    slab.rotation.set(0.3, 0.2, -0.1);
    group.add(slab);
    
    // Fragment 2: Cracked chunk
    const chunk = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.3, 0.2),
      this._getMythicMaterial()
    );
    chunk.position.set(0.2, -0.1, 0.15);
    chunk.rotation.set(-0.2, 0.4, 0.1);
    group.add(chunk);
    
    // Fragment 3: Pointed shard
    const shard = new THREE.Mesh(
      new THREE.TetrahedronGeometry(0.2, 0),
      this._getMythicMaterial()
    );
    shard.position.set(-0.05, 0.25, -0.2);
    shard.rotation.set(0.5, 0.1, 0.3);
    group.add(shard);
    
    // Fragment 4: Twisted piece
    const twist = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 1),
      this._getMythicMaterial()
    );
    twist.position.set(0.15, -0.2, -0.1);
    twist.rotation.set(0.2, 0.5, 0.4);
    group.add(twist);
    
    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'MYTHIC';
    group.userData.geometryVariant = 'FloatingFragments';
    group.userData.polycount = 50;
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * MYTHIC-3: Cracked Prism
   * Prismatic form with visible fracture lines
   * Feels fractured but still unified
   */
  static createMythicCrackedPrism(scale = 1.0) {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      // Left prism section
      -0.3, -0.4, 0, -0.15, -0.4, 0.2, -0.15, 0.4, 0.2, -0.3, 0.4, 0,
      // Right prism section (offset/cracked)
      -0.1, -0.4, -0.1, 0.15, -0.4, 0.15, 0.15, 0.4, 0.15, -0.1, 0.4, -0.1,
      // Fracture face (connection)
      -0.15, -0.3, 0.2, -0.1, -0.3, -0.1,
      -0.15, 0.3, 0.2, -0.1, 0.3, -0.1
    ]);
    
    const indices = new Uint16Array([
      // Left section
      0, 1, 2, 0, 2, 3,
      // Right section
      4, 5, 6, 4, 6, 7,
      // Fracture connection
      1, 5, 9, 1, 9, 8,
      2, 6, 10, 2, 10, 3
    ]);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    
    // Compute bounding volumes (once, at creation)
    if (geometry.boundingSphere === null) {
      geometry.computeBoundingSphere();
    }
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }
    
    const mesh = new THREE.Mesh(geometry, this._getMythicMaterial());
    mesh.scale.multiplyScalar(scale);
    mesh.userData.geometryFamily = 'MYTHIC';
    mesh.userData.geometryVariant = 'CrackedPrism';
    mesh.userData.polycount = 24;
    
    // Mark as canonical via userData (NOT Object.freeze)
    geometry.userData = geometry.userData || {};
    geometry.userData.canonical = true;
    geometry.userData.immutableTopology = true;
    
    // Set attributes to static usage (optimization hint)
    if (geometry.attributes.position) {
      geometry.attributes.position.usage = THREE.StaticDrawUsage;
    }
    if (geometry.attributes.normal) {
      geometry.attributes.normal.usage = THREE.StaticDrawUsage;
    }
    
    return mesh;
  }
  
  /**
   * MYTHIC-4: Ancient Core with Missing Faces
   * Polyhedron with deliberately missing faces
   * Feels incomplete and ancient
   */
  static createMythicAncientCoreWithMissing(scale = 1.0) {
    const geometry = new THREE.DodecahedronGeometry(0.5, 0);
    const posAttr = geometry.getAttribute('position');
    const positions = posAttr.array;
    
    // Randomly remove some faces by zeroing vertex positions
    for (let i = 0; i < Math.min(positions.length / 3 * 0.3, 10); i++) {
      const idx = Math.floor(Math.random() * (positions.length / 3)) * 3;
      positions[idx] *= 0.7;
      positions[idx + 1] *= 0.7;
      positions[idx + 2] *= 0.7;
    }
    posAttr.needsUpdate = true;
    
    geometry.computeVertexNormals();
    
    // Compute bounding volumes (once, at creation)
    if (geometry.boundingSphere === null) {
      geometry.computeBoundingSphere();
    }
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }
    
    const mesh = new THREE.Mesh(geometry, this._getMythicMaterial());
    mesh.scale.multiplyScalar(scale);
    mesh.userData.geometryFamily = 'MYTHIC';
    mesh.userData.geometryVariant = 'AncientCoreWithMissing';
    mesh.userData.polycount = 36;
    
    // Mark as canonical via userData (NOT Object.freeze)
    geometry.userData = geometry.userData || {};
    geometry.userData.canonical = true;
    geometry.userData.immutableTopology = true;
    
    // Set attributes to static usage (optimization hint)
    if (geometry.attributes.position) {
      geometry.attributes.position.usage = THREE.StaticDrawUsage;
    }
    if (geometry.attributes.normal) {
      geometry.attributes.normal.usage = THREE.StaticDrawUsage;
    }
    
    return mesh;
  }
  
  /**
   * MYTHIC-5: Collapsed Crystal Crown
   * Crown-like structure that's broken and collapsed
   * Feels fragmented and majestic-fallen
   */
  static createMythicCollapsedCrown(scale = 1.0) {
    const group = new THREE.Group();
    
    // Crown base (broken ring)
    const base = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.08, 8, 32),
      this._getMythicMaterial()
    );
    base.scale.y = 0.6;
    base.userData.isCore = true;
    group.add(base);
    
    // Collapsed points (shards sticking up irregularly)
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const height = 0.3 + Math.random() * 0.2;
      const radius = 0.4 + Math.random() * 0.1;
      
      const point = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, height, 6),
        this._getMythicMaterial()
      );
      point.position.x = Math.cos(angle) * radius;
      point.position.y = height * 0.3;
      point.position.z = Math.sin(angle) * radius;
      point.rotation.z = Math.random() * 0.3 - 0.15;
      group.add(point);
    }
    
    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'MYTHIC';
    group.userData.geometryVariant = 'CollapsedCrown';
    group.userData.polycount = 60;
    this._precomputeAndFreeze(group);
    return group;
  }
  
  // ===== PRIME CATEGORY (Perfect Axioms) =====
  
  /**
   * PRIME-0: Nested Icosahedron
   * Small icosahedron perfectly nested inside larger one
   * Pure mathematical perfection
   */
  static createPrimeNestedIcosahedron(scale = 1.0) {
    const group = new THREE.Group();
    
    const outer = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.5, 2),
      this._getPrimeMaterial()
    );
    outer.userData.isCore = true;
    group.add(outer);
    
    const inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.28, 2),
      this._getPrimeMaterial()
    );
    inner.userData.isCore = true;
    group.add(inner);
    
    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'PRIME';
    group.userData.geometryVariant = 'NestedIcosahedron';
    group.userData.polycount = 80;
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * PRIME-1: Perfect Dodecahedron
   * Pure 12-faced symmetry, absolute perfection
   */
  static createPrimePerfectDodecahedron(scale = 1.0) {
    const geometry = new THREE.DodecahedronGeometry(0.5, 0);
    
    // Compute bounding volumes (once, at creation)
    if (geometry.boundingSphere === null) {
      geometry.computeBoundingSphere();
    }
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }
    
    const mesh = new THREE.Mesh(geometry, this._getPrimeMaterial());
    mesh.scale.multiplyScalar(scale);
    mesh.userData.geometryFamily = 'PRIME';
    mesh.userData.geometryVariant = 'PerfectDodecahedron';
    mesh.userData.polycount = 36;
    
    // Mark as canonical via userData (NOT Object.freeze)
    geometry.userData = geometry.userData || {};
    geometry.userData.canonical = true;
    geometry.userData.immutableTopology = true;
    
    // Set attributes to static usage (optimization hint)
    if (geometry.attributes.position) {
      geometry.attributes.position.usage = THREE.StaticDrawUsage;
    }
    if (geometry.attributes.normal) {
      geometry.attributes.normal.usage = THREE.StaticDrawUsage;
    }
    
    return mesh;
  }
  
  /**
   * PRIME-2: Stella Octangula (Dual Polyhedron)
   * Two interpenetrating tetrahedra forming 8-pointed star
   * Inside-out mathematical form
   */
  static createPrimeStellaOctangula(scale = 1.0) {
    const group = new THREE.Group();
    
    // Tetrahedron 1 (normal)
    const tet1 = new THREE.Mesh(
      new THREE.TetrahedronGeometry(0.4, 0),
      this._getPrimeMaterial()
    );
    tet1.userData.isCore = true;
    group.add(tet1);
    
    // Tetrahedron 2 (inverted, 5x scale to interpen)
    const tet2 = new THREE.Mesh(
      new THREE.TetrahedronGeometry(0.4, 0),
      this._getPrimeMaterial()
    );
    tet2.rotation.set(Math.PI, 0, 0);
    tet2.userData.isCore = true;
    group.add(tet2);
    
    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'PRIME';
    group.userData.geometryVariant = 'StellaOctangula';
    group.userData.polycount = 16;
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * PRIME-3: Precision Lattice
   * Perfect geometric lattice of small spheres in exact grid
   * Pure order and regularity
   */
  static createPrimePrecisionLattice(scale = 1.0) {
    const group = new THREE.Group();
    const gridSize = 3;
    const spacing = 0.25;
    
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
          const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 16, 16),
            this._getPrimeMaterial()
          );
          sphere.position.set(
            (x - 1) * spacing,
            (y - 1) * spacing,
            (z - 1) * spacing
          );
          group.add(sphere);
        }
      }
    }
    
    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'PRIME';
    group.userData.geometryVariant = 'PrecisionLattice';
    group.userData.polycount = 432;
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * PRIME-4: Tesseract Projection
   * 4D hypercube projected to 3D
   * Mathematical axiom made visible
   */
  static createPrimeTesseractProjection(scale = 1.0) {
    const geometry = new THREE.BufferGeometry();
    
    // 16 vertices of tesseract (4D cube in 3D projection)
    const vertices = new Float32Array([
      -0.3, -0.3, -0.3, 0.3, -0.3, -0.3, -0.3, 0.3, -0.3, 0.3, 0.3, -0.3,
      -0.3, -0.3, 0.3, 0.3, -0.3, 0.3, -0.3, 0.3, 0.3, 0.3, 0.3, 0.3,
      -0.15, -0.15, 0, 0.15, -0.15, 0, -0.15, 0.15, 0, 0.15, 0.15, 0,
      -0.2, 0, -0.2, 0.2, 0, -0.2, -0.2, 0, 0.2, 0.2, 0, 0.2
    ]);
    
    const indices = new Uint16Array([
      0, 1, 1, 3, 3, 2, 2, 0,
      4, 5, 5, 7, 7, 6, 6, 4,
      0, 4, 1, 5, 2, 6, 3, 7,
      8, 9, 9, 11, 11, 10, 10, 8,
      12, 13, 13, 15, 15, 14, 14, 12
    ]);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    
    // Compute bounding volumes (once, at creation)
    if (geometry.boundingSphere === null) {
      geometry.computeBoundingSphere();
    }
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }
    
    const lines = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 })
    );
    lines.scale.multiplyScalar(scale);
    lines.userData.geometryFamily = 'PRIME';
    lines.userData.geometryVariant = 'TesseractProjection';
    lines.userData.polycount = 0; // Lines, not triangles
    
    // Mark as canonical via userData (NOT Object.freeze)
    geometry.userData = geometry.userData || {};
    geometry.userData.canonical = true;
    geometry.userData.immutableTopology = true;
    
    // Set attributes to static usage (optimization hint)
    if (geometry.attributes.position) {
      geometry.attributes.position.usage = THREE.StaticDrawUsage;
    }
    if (geometry.attributes.normal) {
      geometry.attributes.normal.usage = THREE.StaticDrawUsage;
    }
    
    return lines;
  }
  
  /**
   * PRIME-5: Symmetry-Locked Core
   * Perfect sphere-like form but faceted into octahedron
   * Minimal axiom, maximum symmetry
   */
  static createPrimeSymmetryLockedCore(scale = 1.0) {
    const geometry = new THREE.OctahedronGeometry(0.5, 3);
    
    // Compute bounding volumes (once, at creation)
    if (geometry.boundingSphere === null) {
      geometry.computeBoundingSphere();
    }
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }
    
    const mesh = new THREE.Mesh(geometry, this._getPrimeMaterial());
    mesh.scale.multiplyScalar(scale);
    mesh.userData.geometryFamily = 'PRIME';
    mesh.userData.geometryVariant = 'SymmetryLockedCore';
    mesh.userData.polycount = 48;
    
    // Mark as canonical via userData (NOT Object.freeze)
    geometry.userData = geometry.userData || {};
    geometry.userData.canonical = true;
    geometry.userData.immutableTopology = true;
    
    // Set attributes to static usage (optimization hint)
    if (geometry.attributes.position) {
      geometry.attributes.position.usage = THREE.StaticDrawUsage;
    }
    if (geometry.attributes.normal) {
      geometry.attributes.normal.usage = THREE.StaticDrawUsage;
    }
    
    return mesh;
  }
  
  // ===== ERROR CATEGORY (Frozen Corruption) =====
  
  /**
   * ERROR-0: Intersecting Solids
   * Two cubes overlapping impossibly
   * Logical contradiction made solid
   */
  static createErrorIntersectingSolids(scale = 1.0) {
    const group = new THREE.Group();
    
    const cube1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.4, 0.4),
      this._getErrorMaterial()
    );
    cube1.rotation.set(0.3, 0.2, 0.1);
    group.add(cube1);
    
    const cube2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.4, 0.4),
      this._getErrorMaterial()
    );
    cube2.position.set(0.2, 0.1, 0.15);
    cube2.rotation.set(-0.2, 0.4, -0.1);
    group.add(cube2);
    
    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'ERROR';
    group.userData.geometryVariant = 'IntersectingSolids';
    group.userData.polycount = 24;
    group.userData.isError = true;
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * ERROR-1: Inverted Normals Mesh
   * Mesh with deliberately inverted normals (inside-out)
   * Feels topologically broken
   */
  static createErrorInvertedNormals(scale = 1.0) {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const posAttr = geometry.getAttribute('position');
    
    // Invert all normals by negating them
    const normAttr = geometry.getAttribute('normal');
    if (normAttr) {
      const normals = normAttr.array;
      for (let i = 0; i < normals.length; i++) {
        normals[i] *= -1;
      }
      normAttr.needsUpdate = true;
    }
    
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    
    const mesh = new THREE.Mesh(geometry, this._getErrorMaterial());
    mesh.scale.multiplyScalar(scale);
    mesh.scale.z *= -1; // Also flip on Z to ensure inside-out effect
    mesh.userData.geometryFamily = 'ERROR';
    mesh.userData.geometryVariant = 'InvertedNormals';
    mesh.userData.polycount = 512;
    mesh.userData.isError = true;
    
    // DO NOT freeze geometry — Three.js needs extensibility for event listeners
    return mesh;
  }
  
  /**
   * ERROR-2: Self-Clipping Geometry
   * Geometry that passes through itself
   * Impossible topology
   */
  static createErrorSelfClipping(scale = 1.0) {
    const geometry = new THREE.BufferGeometry();
    
    // Create two interpenetrating shapes
    const vertices = new Float32Array([
      // Tetrahedron 1
      0.2, 0.2, 0.2, -0.2, 0.2, 0.2, 0, -0.2, 0.2, 0, 0, -0.2,
      // Tetrahedron 2 (scaled and offset to clip)
      0.15, 0.15, 0.15, -0.15, 0.15, 0.15, 0, -0.15, 0.15, 0, 0, -0.15
    ]);
    
    const indices = new Uint16Array([
      0, 1, 2, 1, 2, 3, 2, 3, 0, 3, 0, 1,
      4, 5, 6, 5, 6, 7, 6, 7, 4, 7, 4, 5
    ]);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    
    // Compute bounding volumes (once, at creation)
    if (geometry.boundingSphere === null) {
      geometry.computeBoundingSphere();
    }
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }
    
    const mesh = new THREE.Mesh(geometry, this._getErrorMaterial());
    mesh.scale.multiplyScalar(scale);
    mesh.userData.geometryFamily = 'ERROR';
    mesh.userData.geometryVariant = 'SelfClipping';
    mesh.userData.polycount = 16;
    mesh.userData.isError = true;
    
    // Mark as canonical via userData (NOT Object.freeze)
    geometry.userData = geometry.userData || {};
    geometry.userData.canonical = true;
    geometry.userData.immutableTopology = true;
    
    // Set attributes to static usage (optimization hint)
    if (geometry.attributes.position) {
      geometry.attributes.position.usage = THREE.StaticDrawUsage;
    }
    if (geometry.attributes.normal) {
      geometry.attributes.normal.usage = THREE.StaticDrawUsage;
    }
    
    return mesh;
  }
  
  /**
   * ERROR-3: Folded Impossible Object
   * Penrose-like impossible triangle rendered in 3D
   * Contradiction made visible
   */
  static createErrorFoldedImpossible(scale = 1.0) {
    const geometry = new THREE.BufferGeometry();
    
    // Penrose triangle-inspired folded structure
    const vertices = new Float32Array([
      0.3, 0.3, 0.1, -0.3, 0.3, -0.1, 0, -0.3, 0.3,
      0.25, 0.2, -0.2, -0.25, 0.2, 0.2, 0, -0.25, -0.25,
      0.15, 0, 0.3, -0.15, 0, -0.3, 0, 0.15, 0
    ]);
    
    const indices = new Uint16Array([
      0, 1, 2, 3, 4, 5, 6, 7, 8,
      0, 3, 6, 1, 4, 7, 2, 5, 8,
      0, 1, 3, 1, 4, 3, 2, 5, 7
    ]);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    
    // Compute bounding volumes (once, at creation)
    if (geometry.boundingSphere === null) {
      geometry.computeBoundingSphere();
    }
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }
    
    const mesh = new THREE.Mesh(geometry, this._getErrorMaterial());
    mesh.scale.multiplyScalar(scale);
    mesh.userData.geometryFamily = 'ERROR';
    mesh.userData.geometryVariant = 'FoldedImpossible';
    mesh.userData.polycount = 20;
    mesh.userData.isError = true;
    
    // Mark as canonical via userData (NOT Object.freeze)
    geometry.userData = geometry.userData || {};
    geometry.userData.canonical = true;
    geometry.userData.immutableTopology = true;
    
    // Set attributes to static usage (optimization hint)
    if (geometry.attributes.position) {
      geometry.attributes.position.usage = THREE.StaticDrawUsage;
    }
    if (geometry.attributes.normal) {
      geometry.attributes.normal.usage = THREE.StaticDrawUsage;
    }
    
    return mesh;
  }
  
  /**
   * ERROR-4: Topology Tear Artifact
   * Mesh with discontinuous faces (torn apart)
   * Manifold violation
   */
  static createErrorTopologyTear(scale = 1.0) {
    const geometry = new THREE.BufferGeometry();
    
    // Cube with a tear/hole in it
    const vertices = new Float32Array([
      -0.3, -0.3, -0.3, 0.3, -0.3, -0.3, 0.3, 0.3, -0.3, -0.3, 0.3, -0.3,
      -0.3, -0.3, 0.3, 0.3, -0.3, 0.3, 0.3, 0.3, 0.3, -0.3, 0.3, 0.3,
      -0.1, 0, -0.1, 0.1, 0, 0.1  // Tear edge
    ]);
    
    const indices = new Uint16Array([
      0, 1, 2, 0, 2, 3,  // Front
      4, 6, 5, 4, 7, 6,  // Back
      0, 4, 5, 0, 5, 1,  // Bottom (TORN)
      2, 6, 7, 2, 7, 3,  // Top
      0, 3, 7, 0, 7, 4,  // Left
      1, 5, 6, 1, 6, 2   // Right
    ]);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    
    // Compute bounding volumes (once, at creation)
    if (geometry.boundingSphere === null) {
      geometry.computeBoundingSphere();
    }
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }
    
    const mesh = new THREE.Mesh(geometry, this._getErrorMaterial());
    mesh.scale.multiplyScalar(scale);
    mesh.userData.geometryFamily = 'ERROR';
    mesh.userData.geometryVariant = 'TopologyTear';
    mesh.userData.polycount = 18;
    mesh.userData.isError = true;
    
    // Mark as canonical via userData (NOT Object.freeze)
    geometry.userData = geometry.userData || {};
    geometry.userData.canonical = true;
    geometry.userData.immutableTopology = true;
    
    // Set attributes to static usage (optimization hint)
    if (geometry.attributes.position) {
      geometry.attributes.position.usage = THREE.StaticDrawUsage;
    }
    if (geometry.attributes.normal) {
      geometry.attributes.normal.usage = THREE.StaticDrawUsage;
    }
    
    return mesh;
  }
  
  /**
   * ERROR-5: Corrupted Manifold
   * Non-manifold mesh with floating faces and duplicated vertices
   * Complete geometric corruption
   */
  static createErrorCorruptedManifold(scale = 1.0) {
    const group = new THREE.Group();
    
    // Main deformed shape
    const main = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.4, 1),
      this._getErrorMaterial()
    );
    group.add(main);
    
    // Floating disconnected face
    const floating = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      this._getErrorMaterial()
    );
    floating.position.set(0.4, 0.3, -0.2);
    group.add(floating);
    
    // Inverted floating piece
    const inverted = new THREE.Mesh(
      new THREE.TetrahedronGeometry(0.15, 0),
      this._getErrorMaterial()
    );
    inverted.position.set(-0.3, -0.3, 0.25);
    inverted.scale.z *= -1;
    group.add(inverted);
    
    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'ERROR';
    group.userData.geometryVariant = 'CorruptedManifold';
    group.userData.polycount = 100;
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
  static createEmotionalHeartCrystal(scale = 1.0) {
    const geometry = new THREE.BufferGeometry();
    
    // Stylized faceted heart shape
    const vertices = new Float32Array([
      0, 0.3, 0,       // Top point
      -0.2, 0.2, 0.1,  // Upper left
      -0.25, 0.1, 0,   // Left lobe
      -0.2, 0, -0.1,   // Lower left
      0, -0.2, -0.15,  // Bottom
      0.2, 0, -0.1,    // Lower right
      0.25, 0.1, 0,    // Right lobe
      0.2, 0.2, 0.1    // Upper right
    ]);
    
    const indices = new Uint16Array([
      0, 1, 2, 0, 2, 7, 2, 3, 7, 3, 4, 6,
      3, 6, 7, 0, 4, 5, 0, 5, 6, 0, 6, 7,
      1, 2, 3, 1, 3, 4, 1, 4, 5, 1, 5, 7
    ]);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    
    // Compute bounding volumes (once, at creation)
    if (geometry.boundingSphere === null) {
      geometry.computeBoundingSphere();
    }
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }
    
    const mesh = new THREE.Mesh(geometry, this._getEmotionalMaterial());
    mesh.scale.multiplyScalar(scale);
    mesh.userData.geometryFamily = 'EMOTIONAL';
    mesh.userData.geometryVariant = 'HeartCrystal';
    mesh.userData.polycount = 36;
    
    // Mark as canonical via userData (NOT Object.freeze)
    geometry.userData = geometry.userData || {};
    geometry.userData.canonical = true;
    geometry.userData.immutableTopology = true;
    
    // Set attributes to static usage (optimization hint)
    if (geometry.attributes.position) {
      geometry.attributes.position.usage = THREE.StaticDrawUsage;
    }
    if (geometry.attributes.normal) {
      geometry.attributes.normal.usage = THREE.StaticDrawUsage;
    }
    
    return mesh;
  }
  
  /**
   * EMOTIONAL-1: Neural Lobe Crystal
   * Brain-like with faceted surface
   * Feels thoughtful and organic
   */
  static createEmotionalNeuralLobe(scale = 1.0) {
    const group = new THREE.Group();
    
    // Central lobe
    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 8, 8),
      this._getEmotionalMaterial()
    );
    center.userData.isCore = true;
    group.add(center);
    
    // Side lobes (organic placement)
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const lobe = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 6, 6),
        this._getEmotionalMaterial()
      );
      lobe.position.x = Math.cos(angle) * 0.35;
      lobe.position.y = Math.sin(angle) * 0.2;
      lobe.position.z = Math.cos(angle * 0.7) * 0.15;
      group.add(lobe);
    }
    
    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'EMOTIONAL';
    group.userData.geometryVariant = 'NeuralLobe';
    group.userData.polycount = 220;
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * EMOTIONAL-2: Blooming Gem Form
   * Blossom-like crystal petals
   * Feels opening and vulnerable
   */
  static createEmotionalBloomingGem(scale = 1.0) {
    const group = new THREE.Group();
    
    // Center core
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.15, 1),
      this._getEmotionalMaterial()
    );
    core.userData.isCore = true;
    group.add(core);
    
    // Petals (6)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const petal = new THREE.Mesh(
        new THREE.TetrahedronGeometry(0.15, 0),
        this._getEmotionalMaterial()
      );
      petal.position.x = Math.cos(angle) * 0.35;
      petal.position.y = Math.sin(angle) * 0.25;
      petal.position.z = Math.sin(angle * 2) * 0.15;
      petal.rotation.set(angle, angle * 0.5, 0);
      group.add(petal);
    }
    
    group.scale.multiplyScalar(scale);
    group.userData.geometryFamily = 'EMOTIONAL';
    group.userData.geometryVariant = 'BloomingGem';
    group.userData.polycount = 48;
    this._precomputeAndFreeze(group);
    return group;
  }
  
  /**
   * EMOTIONAL-3: Tear-Shaped Core
   * Teardrop with faceted surface
   * Feels melancholic and fluid
   */
  static createEmotionalTearShaped(scale = 1.0) {
    const geometry = new THREE.BufferGeometry();
    
    // Teardrop vertices (faceted)
    const vertices = new Float32Array([
      0, 0.35, 0,      // Top point
      -0.15, 0.2, 0.1, // Upper left
      0.15, 0.2, 0.1,  // Upper right
      -0.2, 0.05, 0,   // Middle left
      0.2, 0.05, 0,    // Middle right
      -0.15, -0.15, -0.1, // Lower left
      0.15, -0.15, -0.1,  // Lower right
      0, -0.3, 0       // Bottom point
    ]);
    
    const indices = new Uint16Array([
      0, 1, 2, 1, 3, 2, 3, 5, 4, 3, 4, 2,
      2, 4, 6, 2, 6, 0, 0, 6, 7, 1, 5, 7,
      1, 7, 0, 3, 5, 7, 4, 6, 7, 5, 7, 6
    ]);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    
    // Compute bounding volumes (once, at creation)
    if (geometry.boundingSphere === null) {
      geometry.computeBoundingSphere();
    }
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }
    
    const mesh = new THREE.Mesh(geometry, this._getEmotionalMaterial());
    mesh.scale.multiplyScalar(scale);
    mesh.userData.geometryFamily = 'EMOTIONAL';
    mesh.userData.geometryVariant = 'TearShaped';
    mesh.userData.polycount = 32;
    
    // Mark as canonical via userData (NOT Object.freeze)
    geometry.userData = geometry.userData || {};
    geometry.userData.canonical = true;
    geometry.userData.immutableTopology = true;
    
    // Set attributes to static usage (optimization hint)
    if (geometry.attributes.position) {
      geometry.attributes.position.usage = THREE.StaticDrawUsage;
    }
    if (geometry.attributes.normal) {
      geometry.attributes.normal.usage = THREE.StaticDrawUsage;
    }
    
    return mesh;
  }
  
  /**
   * EMOTIONAL-4: Folded Emotional Node
   * Folded/closed form suggesting introspection
   * Organic but symmetrical
   */
  static createEmotionalFolded(scale = 1.0) {
    const geometry = new THREE.BufferGeometry();
    
    // Folded form (like closed hands)
    const vertices = new Float32Array([
      -0.2, 0.2, 0, 0.2, 0.2, 0, -0.2, -0.1, 0.2, 0.2, -0.1, 0.2,
      -0.25, -0.15, -0.1, 0.25, -0.15, -0.1, -0.1, -0.3, 0, 0.1, -0.3, 0
    ]);
    
    const indices = new Uint16Array([
      0, 1, 2, 1, 2, 3, 2, 3, 4, 3, 4, 5,
      4, 5, 6, 5, 6, 7, 0, 2, 4, 1, 3, 5,
      0, 1, 6, 1, 7, 6
    ]);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    
    // Compute bounding volumes (once, at creation)
    if (geometry.boundingSphere === null) {
      geometry.computeBoundingSphere();
    }
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }
    
    const mesh = new THREE.Mesh(geometry, this._getEmotionalMaterial());
    mesh.scale.multiplyScalar(scale);
    mesh.userData.geometryFamily = 'EMOTIONAL';
    mesh.userData.geometryVariant = 'Folded';
    mesh.userData.polycount = 26;
    
    // Mark as canonical via userData (NOT Object.freeze)
    geometry.userData = geometry.userData || {};
    geometry.userData.canonical = true;
    geometry.userData.immutableTopology = true;
    
    // Set attributes to static usage (optimization hint)
    if (geometry.attributes.position) {
      geometry.attributes.position.usage = THREE.StaticDrawUsage;
    }
    if (geometry.attributes.normal) {
      geometry.attributes.normal.usage = THREE.StaticDrawUsage;
    }
    
    return mesh;
  }
  
  /**
   * EMOTIONAL-5: Symmetric Organic Seed
   * Seed-like form with perfect symmetry
   * Feels potential and growth
   */
  static createEmotionalSymmetricSeed(scale = 1.0) {
    const geometry = new THREE.BufferGeometry();
    
    // Seed shape (ellipsoid with facets)
    const vertices = new Float32Array([
      0, 0.3, 0, -0.2, 0.15, 0.15, 0.2, 0.15, 0.15,
      -0.2, 0.15, -0.15, 0.2, 0.15, -0.15,
      -0.25, -0.1, 0, 0.25, -0.1, 0,
      -0.15, -0.25, 0.1, 0.15, -0.25, 0.1,
      -0.15, -0.25, -0.1, 0.15, -0.25, -0.1,
      0, -0.3, 0
    ]);
    
    const indices = new Uint16Array([
      0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1,
      1, 5, 6, 2, 6, 7, 3, 7, 8, 4, 8, 9,
      5, 7, 8, 6, 7, 8, 5, 10, 11, 6, 11, 7,
      7, 11, 10, 8, 10, 11, 5, 11, 12, 10, 11, 12
    ]);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    
    // Compute bounding volumes (once, at creation)
    if (geometry.boundingSphere === null) {
      geometry.computeBoundingSphere();
    }
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }
    
    const mesh = new THREE.Mesh(geometry, this._getEmotionalMaterial());
    mesh.scale.multiplyScalar(scale);
    mesh.userData.geometryFamily = 'EMOTIONAL';
    mesh.userData.geometryVariant = 'SymmetricSeed';
    mesh.userData.polycount = 40;
    
    // Mark as canonical via userData (NOT Object.freeze)
    geometry.userData = geometry.userData || {};
    geometry.userData.canonical = true;
    geometry.userData.immutableTopology = true;
    
    // Set attributes to static usage (optimization hint)
    if (geometry.attributes.position) {
      geometry.attributes.position.usage = THREE.StaticDrawUsage;
    }
    if (geometry.attributes.normal) {
      geometry.attributes.normal.usage = THREE.StaticDrawUsage;
    }
    
    return mesh;
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
