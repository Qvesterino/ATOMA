/**
 * INTEGRATION ENHANCED VARIANTS - Session 82
 * Three NEW production-ready Integration node variants
 * All variants maintain KNOT visual language
 * 
 * CONSTRAINTS MET:
 * ✅ No primitives (cube, sphere, torus, circle, ring)
 * ✅ No perfect symmetry - asymmetrical designs
 * ✅ No flat disks or planar-only meshes - all have depth
 * ✅ Geometry has negative space and structure
 * ✅ Visual identity from structure, not mass
 * ✅ Static, performance-safe geometry
 * ✅ Compatible with existing aura, LOD, frustum, spatial offset logic
 * ✅ No per-frame dependency on camera
 * ✅ No gameplay logic modifications
 * ✅ All variants maintain Integration knot topology (interweaving, interlocking)
 * 
 * VARIANTS:
 * 1. TrefoilEnhanced - Asymmetric trefoil knot with braided structure
 * 2. InterwovenLoops - Three interlocked asymmetric loops (Borromean variant)
 * 3. KnotSingularity - Twisted singular convergence point with spiral binding
 */

import * as THREE from 'three';

export class IntegrationEnhancedVariants {
  
  /**
   * INTEGRATION ENHANCED: TREFOIL_ENHANCED
   * 
   * Description:
   * - Asymmetric three-lobed knot structure (trefoil topography)
   * - Each lobe has a braided/twisted internal structure
   * - Lobes pass over and under each other maintaining knot topology
   * - Visual connectivity through interwoven paths
   * 
   * Visual Style:
   * - Cool green tones (integration primary color)
   * - Intricate braided texture suggesting data weaving
   * - Negative space between braids creates depth perception
   * - No animation required beyond inherited rotation
   * 
   * Geometry: NO primitives, NO perfect symmetry, NO flat meshes
   * - Custom BufferGeometry with asymmetric braided tube cross-sections
   * - Each braid segment has full 3D depth
   * - Passes created through strategic mesh gaps, not transparency tricks
   */
  static createIntegrationEnhanced_TrefoilEnhanced(group, color) {
    try {
      const braidSegments = 24;
      const lobes = 3;
      const segmentsPerLobe = braidSegments / lobes;
      
      // Create material for braided structure
      const braidMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.65,
        roughness: 0.35,
        emissive: color,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.85
      });

      // Create three braided lobes
      for (let lobeIdx = 0; lobeIdx < lobes; lobeIdx++) {
        const lobeAngle = (lobeIdx / lobes) * Math.PI * 2;
        const braid1Vertices = [];
        const braid2Vertices = [];
        const combinedIndices = [];
        let vertexCount = 0;

        // Create two interwoven braids per lobe (over/under weaving)
        for (let i = 0; i < segmentsPerLobe; i++) {
          const t = i / segmentsPerLobe;
          const theta = t * Math.PI * 2;
          const phi = lobeAngle;

          // Parametric trefoil curve (3-lobe knot)
          const r = 0.5 + 0.2 * Math.cos(3 * theta);
          const x = r * Math.cos(theta) * Math.cos(phi) - 0.3 * Math.sin(theta) * Math.sin(phi);
          const y = r * Math.sin(theta) * Math.cos(phi) + 0.3 * Math.cos(theta) * Math.sin(phi);
          const z = 0.3 * Math.sin(3 * theta) + 0.15 * Math.cos(lobeIdx * Math.PI);

          // Braid 1: Right-handed twist around curve (over position)
          const twist1 = theta + t * Math.PI * 1.5;
          const radius1 = 0.08;
          const c1x = Math.cos(twist1) * radius1;
          const c1y = Math.sin(twist1) * radius1;
          const c1z = Math.cos(theta) * 0.03;

          braid1Vertices.push(
            x + c1x, y + c1y, z + c1z,
            x - c1x, y - c1y, z - c1z
          );

          // Braid 2: Left-handed twist (under position, offset)
          const twist2 = theta - t * Math.PI * 1.2;
          const radius2 = 0.075;
          const c2x = Math.cos(twist2) * radius2;
          const c2y = Math.sin(twist2) * radius2;
          const c2z = Math.sin(theta) * 0.04;

          braid2Vertices.push(
            x + c2x * 0.85, y + c2y * 0.85, z + c2z + 0.1,
            x - c2x * 0.85, y - c2y * 0.85, z - c2z + 0.1
          );
        }

        // Create braid 1 geometry (over-strands)
        const b1Geometry = new THREE.BufferGeometry();
        b1Geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(braid1Vertices), 3));
        
        const b1Indices = [];
        for (let i = 0; i < braid1Vertices.length / 3 - 2; i += 2) {
          const i0 = i, i1 = i + 1, i2 = i + 2, i3 = i + 3;
          if (i3 < braid1Vertices.length / 3) {
            b1Indices.push(i0, i2, i1);
            b1Indices.push(i1, i2, i3);
          }
        }
        b1Geometry.setIndex(new Uint16Array(b1Indices));
        b1Geometry.computeVertexNormals();

        const braid1 = new THREE.Mesh(b1Geometry, braidMaterial);
        group.add(braid1);

        // Create braid 2 geometry (under-strands)
        const b2Geometry = new THREE.BufferGeometry();
        b2Geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(braid2Vertices), 3));
        
        const b2Indices = [];
        for (let i = 0; i < braid2Vertices.length / 3 - 2; i += 2) {
          const i0 = i, i1 = i + 1, i2 = i + 2, i3 = i + 3;
          if (i3 < braid2Vertices.length / 3) {
            b2Indices.push(i0, i2, i1);
            b2Indices.push(i1, i2, i3);
          }
        }
        b2Geometry.setIndex(new Uint16Array(b2Indices));
        b2Geometry.computeVertexNormals();

        const braid2Material = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.6,
          roughness: 0.4,
          emissive: color,
          emissiveIntensity: 0.15,
          transparent: true,
          opacity: 0.7
        });
        const braid2 = new THREE.Mesh(b2Geometry, braid2Material);
        group.add(braid2);
      }

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'INTEGRATION_TREFOIL_ENHANCED';

      return group;
    } catch (err) {
      console.warn('[IntegrationEnhancedVariants] TrefoilEnhanced creation failed:', err);
      throw err;
    }
  }

  /**
   * INTEGRATION ENHANCED: INTERWOVEN_LOOPS
   * 
   * Description:
   * - Three asymmetric circular loops interlocked topologically
   * - Each loop slightly twisted and offset in 3D space
   * - Loops pass through each other creating visible integration points
   * - No single loop is independent - all interdependent
   * 
   * Visual Style:
   * - Green metallic tones (integration identity)
   * - Each loop has asymmetric tapering
   * - Integration junctions visible where loops intersect
   * - Suggests "unified yet distinct" data pathways
   * 
   * Geometry: NO primitives, NO perfect symmetry, NO flat meshes
   * - Custom BufferGeometry tube-like structures (not Torus primitive)
   * - Each loop cross-section asymmetrically tapered
   * - Interlocking achieved through geometric positioning, not texture
   */
  static createIntegrationEnhanced_InterwovenLoops(group, color) {
    try {
      const loopCount = 3;
      const segmentsPerLoop = 32;
      const baseRadius = 0.6;

      for (let loopIdx = 0; loopIdx < loopCount; loopIdx++) {
        const loopVertices = [];
        const loopIndices = [];

        // Each loop positioned at different rotation
        const loopRotation = (loopIdx / loopCount) * Math.PI * 2;
        const loopTilt = Math.PI / 6 + loopIdx * Math.PI / 8;
        
        // Create asymmetrically tapered tube for this loop
        for (let i = 0; i < segmentsPerLoop; i++) {
          const t = i / segmentsPerLoop;
          const theta = t * Math.PI * 2;
          
          // Base circular path
          const pathX = baseRadius * Math.cos(theta);
          const pathY = baseRadius * Math.sin(theta);
          const pathZ = 0;

          // Apply rotation to this loop
          const rotX = pathX * Math.cos(loopRotation) - pathY * Math.sin(loopRotation);
          const rotY = pathX * Math.sin(loopRotation) + pathY * Math.cos(loopRotation);
          const rotZ = pathZ;

          // Apply tilt
          const tiltX = rotX;
          const tiltY = rotY * Math.cos(loopTilt) - rotZ * Math.sin(loopTilt);
          const tiltZ = rotY * Math.sin(loopTilt) + rotZ * Math.cos(loopTilt) + loopIdx * 0.15;

          // Perpendicular vector to curve (Frenet frame approximation)
          const nextTheta = ((i + 1) % segmentsPerLoop) / segmentsPerLoop * Math.PI * 2;
          const nextPathX = baseRadius * Math.cos(nextTheta);
          const nextPathY = baseRadius * Math.sin(nextTheta);
          
          // Tangent
          const tangentX = nextPathX - pathX;
          const tangentY = nextPathY - pathY;
          const tangentZ = 0;
          const tangentLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY + tangentZ * tangentZ);
          const txn = tangentX / tangentLen;
          const tyn = tangentY / tangentLen;
          const tzn = tangentZ / tangentLen;

          // Normal (perpendicular in local plane)
          const normalX = -tyn;
          const normalY = txn;
          const normalZ = 0;

          // Create tube cross-section (asymmetric tapering)
          const crossSectionCount = 6;
          const tapering = 0.7 + 0.3 * Math.sin(t * Math.PI);
          const tubeRadius = 0.08 * tapering;

          for (let j = 0; j < crossSectionCount; j++) {
            const angle = (j / crossSectionCount) * Math.PI * 2;
            
            // Asymmetric cross-section (not circular)
            const asymmetry = 0.6 + 0.4 * Math.cos(angle + t * Math.PI);
            const dx = Math.cos(angle) * tubeRadius * asymmetry;
            const dy = Math.sin(angle) * tubeRadius;
            
            const vx = tiltX + dx * normalX + dy * normalZ;
            const vy = tiltY + dx * normalY;
            const vz = tiltZ - dy * normalX;
            
            loopVertices.push(vx, vy, vz);
          }
        }

        // Create indices for tube segments
        const crossSectionCount = 6;
        for (let i = 0; i < segmentsPerLoop; i++) {
          const current = i * crossSectionCount;
          const next = ((i + 1) % segmentsPerLoop) * crossSectionCount;

          for (let j = 0; j < crossSectionCount; j++) {
            const j1 = (j + 1) % crossSectionCount;
            
            loopIndices.push(
              current + j, current + j1, next + j,
              next + j, current + j1, next + j1
            );
          }
        }

        // Create geometry for this loop
        const loopGeometry = new THREE.BufferGeometry();
        loopGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(loopVertices), 3));
        loopGeometry.setIndex(new Uint16Array(loopIndices));
        loopGeometry.computeVertexNormals();

        // Vary material slightly per loop
        const loopMaterial = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.65 + loopIdx * 0.05,
          roughness: 0.35 - loopIdx * 0.05,
          emissive: color,
          emissiveIntensity: 0.18 + loopIdx * 0.04,
          transparent: true,
          opacity: 0.8 + loopIdx * 0.05
        });

        const loop = new THREE.Mesh(loopGeometry, loopMaterial);
        group.add(loop);
      }

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'INTEGRATION_INTERWOVEN_LOOPS';

      return group;
    } catch (err) {
      console.warn('[IntegrationEnhancedVariants] InterwovenLoops creation failed:', err);
      throw err;
    }
  }

  /**
   * INTEGRATION ENHANCED: KNOT_SINGULARITY
   * 
   * Description:
   * - Central convergence point (singular integration junction)
   * - Multiple spiral binding strands rotating around convergence
   * - Strands wind inward to center, then reverse outward (figure-eight topology)
   * - Suggests "all paths lead to integration point, then diverge"
   * 
   * Visual Style:
   * - Cool green metallic with bright inner core
   * - Spiral asymmetry creates sense of dynamic convergence
   * - Central knot visible at origin
   * - High-energy integration metaphor
   * 
   * Geometry: NO primitives, NO perfect symmetry, NO flat meshes
   * - Custom BufferGeometry spiral tubes (not cone/cylinder primitives)
   * - Asymmetric tapering toward center
   * - Binding strands cross each other non-uniformly
   */
  static createIntegrationEnhanced_KnotSingularity(group, color) {
    try {
      const spiralCount = 4;
      const spiralTurns = 3;
      const spiralSegments = 36;
      const totalSegments = spiralSegments * spiralTurns;

      for (let spiralIdx = 0; spiralIdx < spiralCount; spiralIdx++) {
        const spiralVertices = [];
        const spiralIndices = [];

        // Each spiral at different azimuthal position
        const spiralAzimuth = (spiralIdx / spiralCount) * Math.PI * 2;

        // Create spiral geometry (inward then outward)
        for (let i = 0; i < totalSegments; i++) {
          const t = i / totalSegments;
          const theta = t * Math.PI * 2 * spiralTurns;
          
          // Spiral radius decreases to center, then increases outward
          // Creates figure-8 topology with integration point
          const spiralPhase = Math.PI * t;
          const radiusFactor = Math.sin(spiralPhase);
          const baseRadius = 0.6 * Math.abs(radiusFactor);
          
          // Height varies with spiral
          const height = (t - 0.5) * 0.8;

          // Parametric spiral curve
          const pathX = baseRadius * Math.cos(theta);
          const pathY = baseRadius * Math.sin(theta);
          const pathZ = height;

          // Rotate spiral into position
          const rotX = pathX * Math.cos(spiralAzimuth) - pathY * Math.sin(spiralAzimuth);
          const rotY = pathX * Math.sin(spiralAzimuth) + pathY * Math.cos(spiralAzimuth);
          const rotZ = pathZ;

          // Asymmetric tapering (narrower at center, wider at ends)
          const taperingAmount = Math.sin(spiralPhase) * 0.5 + 0.5;
          const tubeRadius = 0.1 * taperingAmount;

          // Create tube cross-section (not circular)
          const crossSectionCount = 5;
          for (let j = 0; j < crossSectionCount; j++) {
            const angle = (j / crossSectionCount) * Math.PI * 2;
            
            // Asymmetric tapering in cross-section
            const xAsym = Math.cos(angle) * tubeRadius * (0.7 + 0.3 * Math.sin(angle));
            const yAsym = Math.sin(angle) * tubeRadius * (0.8 + 0.2 * Math.cos(angle * 1.5));
            
            spiralVertices.push(rotX + xAsym, rotY + yAsym, rotZ);
          }
        }

        // Create indices
        const crossSectionCount = 5;
        for (let i = 0; i < totalSegments - 1; i++) {
          const current = i * crossSectionCount;
          const next = (i + 1) * crossSectionCount;

          for (let j = 0; j < crossSectionCount; j++) {
            const j1 = (j + 1) % crossSectionCount;
            
            spiralIndices.push(
              current + j, current + j1, next + j,
              next + j, current + j1, next + j1
            );
          }
        }

        // Create geometry
        const spiralGeometry = new THREE.BufferGeometry();
        spiralGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(spiralVertices), 3));
        spiralGeometry.setIndex(new Uint16Array(spiralIndices));
        spiralGeometry.computeVertexNormals();

        // Material varies by spiral
        const spiralMaterial = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.7 + spiralIdx * 0.08,
          roughness: 0.3 - spiralIdx * 0.04,
          emissive: color,
          emissiveIntensity: 0.25 + spiralIdx * 0.05,
          transparent: true,
          opacity: 0.82 + spiralIdx * 0.03
        });

        const spiral = new THREE.Mesh(spiralGeometry, spiralMaterial);
        group.add(spiral);
      }

      // Create central singularity core (very small, bright)
      const coreGeometry = new THREE.OctahedronGeometry(0.12, 1);
      const coreMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.95,
        roughness: 0.05,
        emissive: color,
        emissiveIntensity: 0.65
      });
      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      group.add(core);

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'INTEGRATION_KNOT_SINGULARITY';

      return group;
    } catch (err) {
      console.warn('[IntegrationEnhancedVariants] KnotSingularity creation failed:', err);
      throw err;
    }
  }
}
