import * as THREE from 'three';

/**
 * CONTROL NODE GEOMETRIES v1.0
 * 
 * Three new static, immutable Control Node meshes representing:
 * 1. JudgmentSeal — Final decision, locked state
 * 2. SignalCitadel — Control as defense, fortified
 * 3. LawCore — Law itself, inevitable and immovable
 * 
 * DESIGN PRINCIPLES:
 * - No animation, no materials, no FX (geometry only)
 * - Perfect radial symmetry where appropriate
 * - Mid-poly count, clean topology
 * - Pivot at exact center (0,0,0)
 * - Static, immutable shapes
 * - Visual intent: Authority, finality, inevitability
 */

export class ControlNodeGeometries {
  /**
   * JUDGMENT SEAL
   * 
   * Visual: Heavy circular ring with floating inner core (sphere)
   * Intent: Final decision, absolute, locked, sealed, non-negotiable
   * 
   * Structure:
   * - Outer thick ring (torus-like, but solid and heavy)
   * - Inner floating core (sphere, no contact with ring)
   * - Visible gap between ring and core
   * - Perfect radial symmetry
   * 
   * @param {number} scale - Overall scale (default 1.0)
   * @returns {THREE.Group} Group containing ring mesh + core mesh (parented)
   */
  static createJudgmentSeal(scale = 1.0) {
    const group = new THREE.Group();
    group.userData.controlNodeType = 'JudgmentSeal';
    
    // ===== OUTER RING (Solid, Heavy, Authoritative) =====
    // Torus geometry: radius × tubeRadius
    // Large radius = outer ring dimension
    // Large tubeRadius = thickness (weight)
    const ringRadius = 0.7 * scale;           // Distance from center to ring midline
    const ringThickness = 0.25 * scale;       // Thickness of the ring (heavy)
    const ringSegments = 48;                   // Radial segments (smooth)
    const tubularSegments = 16;                // Tube cross-section segments (smooth)
    
    const ringGeometry = new THREE.TorusGeometry(
      ringRadius,
      ringThickness,
      ringSegments,
      tubularSegments
    );
    
    // Compute bounding box to verify positioning
    ringGeometry.computeBoundingBox();
    
    const ringMesh = new THREE.Mesh(ringGeometry);
    ringMesh.userData.visualLayer = 'CORE';
    ringMesh.userData.component = 'ring';
    group.add(ringMesh);
    
    // ===== INNER FLOATING CORE (Sphere, Visible Gap) =====
    // Sphere positioned inside ring, but NOT touching
    // Gap = (ringRadius - ringThickness) * 0.6 = safe distance
    const coreRadius = 0.3 * scale;            // Inner sphere radius
    const coreSegments = 24;                   // Horizontal segments
    const coreHeightSegments = 24;             // Vertical segments
    
    const coreGeometry = new THREE.SphereGeometry(
      coreRadius,
      coreSegments,
      coreHeightSegments
    );
    
    const coreMesh = new THREE.Mesh(coreGeometry);
    coreMesh.userData.visualLayer = 'CORE';
    coreMesh.userData.component = 'core';
    coreMesh.position.y = 0;  // Centered vertically
    group.add(coreMesh);
    
    // ===== METADATA =====
    group.userData.structure = {
      ring: { type: 'torus', radius: ringRadius, thickness: ringThickness },
      core: { type: 'sphere', radius: coreRadius, position: [0, 0, 0] },
      gap: ringRadius - ringThickness - coreRadius
    };
    
    group.userData.polyCount = {
      ring: ringSegments * tubularSegments,
      core: coreSegments * coreHeightSegments,
      total: (ringSegments * tubularSegments) + (coreSegments * coreHeightSegments)
    };
    
    return group;
  }

  /**
   * SIGNAL CITADEL
   * 
   * Visual: Fortified core with 4–6 protruding towers/pylons
   * Intent: Control as defense, protective, enforces limits, blocks intrusion
   * 
   * Structure:
   * - Central compact core (blocky, polyhedral)
   * - 4–6 towers emerging from cardinal directions
   * - Towers vary slightly in height and orientation
   * - Fortress-like, stable, defensive
   * - Mild asymmetry allowed
   * 
   * @param {number} scale - Overall scale (default 1.0)
   * @returns {THREE.Mesh} Single merged mesh (core + towers)
   */
  static createSignalCitadel(scale = 1.0) {
    const group = new THREE.Group();
    group.userData.controlNodeType = 'SignalCitadel';
    
    // ===== CENTRAL CORE (Compact, Blocky) =====
    const coreSize = 0.4 * scale;
    const coreGeometry = new THREE.BoxGeometry(coreSize, coreSize * 0.8, coreSize);
    const coreMesh = new THREE.Mesh(coreGeometry);
    coreMesh.userData.component = 'core';
    coreMesh.userData.visualLayer = 'CORE';
    group.add(coreMesh);
    
    // ===== TOWERS (Pylons, Varied Heights) =====
    // 5 towers: 4 cardinal + 1 apex
    const towers = [
      { angle: 0,              height: 0.7 * scale, name: 'north' },
      { angle: Math.PI / 2,    height: 0.6 * scale, name: 'east' },
      { angle: Math.PI,        height: 0.8 * scale, name: 'south' },
      { angle: (3 * Math.PI) / 2, height: 0.65 * scale, name: 'west' },
      { angle: null,           height: 0.9 * scale, name: 'apex', isApex: true }
    ];
    
    const towerDistance = 0.5 * scale;
    const towerBaseWidth = 0.15 * scale;
    const towerBaseDepth = 0.15 * scale;
    
    towers.forEach((tower, idx) => {
      const towerGeometry = new THREE.BoxGeometry(
        towerBaseWidth,
        tower.height,
        towerBaseDepth
      );
      
      const towerMesh = new THREE.Mesh(towerGeometry);
      towerMesh.userData.component = `tower_${idx}`;
      towerMesh.userData.visualLayer = 'STRUCTURE';
      
      if (tower.isApex) {
        // Apex tower: straight up from center
        towerMesh.position.set(0, coreSize * 0.4 + tower.height * 0.5, 0);
        towerMesh.userData.direction = 'apex';
      } else {
        // Cardinal towers: radiate outward
        const x = Math.cos(tower.angle) * towerDistance;
        const z = Math.sin(tower.angle) * towerDistance;
        towerMesh.position.set(x, coreSize * 0.1, z);
        towerMesh.userData.direction = tower.name;
      }
      
      group.add(towerMesh);
    });
    
    // ===== MERGE TO SINGLE MESH =====
    const mergedGeometry = mergeGroupGeometry(group);
    const mergedMesh = new THREE.Mesh(mergedGeometry);
    mergedMesh.userData.controlNodeType = 'SignalCitadel';
    mergedMesh.userData.visualLayer = 'CORE';
    mergedMesh.userData.structure = {
      core: { type: 'box', size: coreSize },
      towers: {
        count: towers.length,
        baseWidth: towerBaseWidth,
        baseDepth: towerBaseDepth,
        heightRange: [0.6 * scale, 0.9 * scale]
      }
    };
    
    mergedMesh.userData.polyCount = {
      core: 24,  // Box has 24 vertices minimum
      towers: towers.length * 24,
      total: 24 + (towers.length * 24)
    };
    
    return mergedMesh;
  }

  /**
   * LAW CORE
   * 
   * Visual: Monolithic, minimal, extremely simple shape
   * Intent: Law itself, inevitable, immovable, absolute
   * 
   * Structure:
   * - Single massive cube or truncated cube
   * - No holes, no appendages, no asymmetry
   * - Heavy, grounded proportions
   * - Absolutely minimal detail
   * - Lowest polycount of all Control nodes
   * 
   * @param {number} scale - Overall scale (default 1.0)
   * @returns {THREE.Mesh} Single clean mesh
   */
  static createLawCore(scale = 1.0) {
    // ===== MONOLITHIC CORE (Perfect Cube) =====
    // A single, perfect cube represents law:
    // - Invariant (always the same)
    // - Stable (center of gravity at exact center)
    // - Immutable (no variation)
    // - Clean (no decoration)
    
    const cubeSize = 0.7 * scale;
    const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    
    // Ensure geometry is centered
    cubeGeometry.center();
    
    const mesh = new THREE.Mesh(cubeGeometry);
    mesh.userData.controlNodeType = 'LawCore';
    mesh.userData.visualLayer = 'CORE';
    mesh.userData.structure = {
      type: 'monolithic_cube',
      size: cubeSize,
      symmetry: 'perfect_cubic',
      detail: 'minimal'
    };
    
    mesh.userData.polyCount = {
      vertices: 8,           // Cube vertices
      faces: 6,              // Cube faces
      triangles: 12,         // 2 per face
      total: 12
    };
    
    return mesh;
  }
}

/**
 * UTILITY: Merge group of meshes into single geometry
 * 
 * Takes a THREE.Group with multiple meshes and combines them
 * into a single BufferGeometry for rendering efficiency.
 * 
 * @param {THREE.Group} group - Group containing meshes
 * @returns {THREE.BufferGeometry} Merged geometry
 */
function mergeGroupGeometry(group) {
  const geometries = [];
  
  group.children.forEach(child => {
    if (child.isMesh && child.geometry) {
      // Clone and apply child's transform
      const clonedGeo = child.geometry.clone();
      clonedGeo.applyMatrix4(child.matrix);
      geometries.push(clonedGeo);
    }
  });
  
  if (geometries.length === 0) {
    // Fallback: empty geometry
    return new THREE.BufferGeometry();
  }
  
  // Merge all geometries
  const mergedGeometry = THREE.BufferGeometryUtils?.mergeGeometries(geometries);
  if (!mergedGeometry) {
    // Fallback: return first geometry if merge fails
    return geometries[0];
  }
  
  return mergedGeometry;
}

/**
 * EXPORT: All three Control Node geometries
 */
export const ControlNodeMeshes = {
  JudgmentSeal: ControlNodeGeometries.createJudgmentSeal,
  SignalCitadel: ControlNodeGeometries.createSignalCitadel,
  LawCore: ControlNodeGeometries.createLawCore
};

export default ControlNodeGeometries;
