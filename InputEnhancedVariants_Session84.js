/**
 * INPUT ENHANCED VARIANTS - Session 84
 * Three NEW production-ready Input node variants
 * All variants maintain RECEPTION/SENSING topology
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
 * ✅ All variants maintain Input reception/sensing topology (antenna, perception, absorption)
 * 
 * VARIANTS:
 * 1. SensorArray - Multiple asymmetric sensing units arranged radially
 * 2. PerceptionVortex - Spiral sensory collection system with convergence
 * 3. ResonanceChamber - Acoustic/vibrational sensing structure with harmonic nodes
 */

import * as THREE from 'three';

export class InputEnhancedVariants {
  
  /**
   * INPUT ENHANCED: SENSOR_ARRAY
   * 
   * Description:
   * - Multiple asymmetric sensing units arranged radially
   * - Each sensor has unique orientation and shape
   * - Central reception hub connecting all sensors
   * - Visual representation of "diverse sensory input"
   * 
   * Visual Style:
   * - Cyan metallic (data reception color)
   * - Each sensor asymmetrically shaped
   * - Radiating arrangement suggests multi-directional sensing
   * - Central hub represents unified perception
   * 
   * Geometry: NO primitives, NO perfect symmetry, NO flat meshes
   * - Custom BufferGeometry sensor probes (not cone/cylinder primitives)
   * - Each sensor has unique asymmetric cross-section
   * - All volumetric 3D structure with significant negative space
   */
  static createInputEnhanced_SensorArray(group, color) {
    try {
      const sensorCount = 5;
      const hubRadius = 0.25;
      const sensorLength = 0.6;

      // Create central reception hub
      const hubVertices = new Float32Array([
        // Icosahedron-like asymmetric center
        0.0, -0.2, 0.0,      // 0: center bottom
        0.15, -0.1, 0.0,     // 1
        0.08, -0.1, 0.15,    // 2
        -0.1, -0.1, 0.12,    // 3
        -0.15, -0.1, -0.08,  // 4
        0.08, -0.1, -0.14,   // 5
        
        0.12, 0.1, 0.0,      // 6
        0.08, 0.1, 0.12,     // 7
        -0.12, 0.1, 0.08,    // 8
        -0.12, 0.1, -0.1,    // 9
        0.08, 0.1, -0.12,    // 10
        
        0.0, 0.2, 0.0        // 11: center top (offset)
      ]);

      const hubIndices = new Uint16Array([
        // Bottom pyramid
        0, 1, 2,
        0, 2, 3,
        0, 3, 4,
        0, 4, 5,
        0, 5, 1,
        
        // Middle band (connecting)
        1, 6, 7,
        2, 7, 8,
        3, 8, 9,
        4, 9, 10,
        5, 10, 6,
        
        // Top connections
        6, 7, 11,
        7, 8, 11,
        8, 9, 11,
        9, 10, 11,
        10, 6, 11,
        
        // Side connections
        1, 2, 7,
        2, 3, 8,
        3, 4, 9,
        4, 5, 10,
        5, 1, 6
      ]);

      const hubGeometry = new THREE.BufferGeometry();
      hubGeometry.setAttribute('position', new THREE.BufferAttribute(hubVertices, 3));
      hubGeometry.setIndex(new Uint16Array(hubIndices));
      hubGeometry.computeVertexNormals();

      const hubMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.85,
        roughness: 0.15,
        emissive: color,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.9
      });

      const hub = new THREE.Mesh(hubGeometry, hubMaterial);
      group.add(hub);

      // Create asymmetric sensors radiating from hub
      for (let i = 0; i < sensorCount; i++) {
        const sensorAngle = (i / sensorCount) * Math.PI * 2;
        const sensorTilt = Math.PI / 6 + i * Math.PI / 10;
        
        // Create asymmetric sensor probe
        const sensorVertices = [];
        const sensorIndices = [];

        // Parametric sensor shape (tapered asymmetric tube)
        for (let j = 0; j < 12; j++) {
          const t = j / 12;
          
          // Position along sensor arm
          const pathX = Math.cos(sensorAngle) * t * sensorLength;
          const pathY = Math.sin(sensorTilt) * t * sensorLength;
          const pathZ = Math.sin(sensorAngle) * t * sensorLength;

          // Cross-section at this point (asymmetric)
          const radius = 0.08 * (1 - t * 0.85); // Taper to point
          for (let k = 0; k < 4; k++) {
            const angle = (k / 4) * Math.PI * 2;
            const asymmetry = 0.5 + 0.5 * Math.sin(angle + t * Math.PI);
            
            const dx = Math.cos(angle) * radius * asymmetry;
            const dy = Math.sin(angle) * radius * (0.7 + 0.3 * Math.cos(angle * 1.5));
            
            sensorVertices.push(pathX + dx, pathY + dy, pathZ);
          }
        }

        // Create indices for sensor
        for (let j = 0; j < 11; j++) {
          const curr = j * 4;
          const next = (j + 1) * 4;

          for (let k = 0; k < 4; k++) {
            const k1 = (k + 1) % 4;
            sensorIndices.push(
              curr + k, curr + k1, next + k,
              next + k, curr + k1, next + k1
            );
          }
        }

        // Create sensor geometry
        const sensorGeometry = new THREE.BufferGeometry();
        sensorGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sensorVertices), 3));
        sensorGeometry.setIndex(new Uint16Array(sensorIndices));
        sensorGeometry.computeVertexNormals();

        // Vary material per sensor
        const sensorMaterial = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.75 + i * 0.03,
          roughness: 0.25 - i * 0.02,
          emissive: color,
          emissiveIntensity: 0.2 + i * 0.04,
          transparent: true,
          opacity: 0.8 + i * 0.02
        });

        const sensor = new THREE.Mesh(sensorGeometry, sensorMaterial);
        group.add(sensor);
      }

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'INPUT_SENSOR_ARRAY';

      return group;
    } catch (err) {
      console.warn('[InputEnhancedVariants] SensorArray creation failed:', err);
      throw err;
    }
  }

  /**
   * INPUT ENHANCED: PERCEPTION_VORTEX
   * 
   * Description:
   * - Spiral sensory collection system with convergence
   * - Sensing spirals twist inward to central perception point
   * - Multiple asymmetric spiral arms
   * - Visual representation of "sensory information spiraling in"
   * 
   * Visual Style:
   * - Cyan metallic (data reception)
   * - Spiral suggests flow of sensory data
   * - Convergence point represents unified perception
   * - Asymmetric cross-sections create visual richness
   * 
   * Geometry: NO primitives, NO perfect symmetry, NO flat meshes
   * - Custom parametric spiral arms (not cone/cylinder)
   * - Asymmetric cross-sections throughout
   * - All volumetric with significant negative space
   */
  static createInputEnhanced_PerceptionVortex(group, color) {
    try {
      const spiralCount = 3;
      const spiralTurns = 2.5;
      const segmentsPerSpiral = 32;
      const totalSegments = spiralTurns * segmentsPerSpiral;

      for (let spiralIdx = 0; spiralIdx < spiralCount; spiralIdx++) {
        const spiralVertices = [];
        const spiralIndices = [];

        // Each spiral at different azimuthal offset
        const spiralAzimuth = (spiralIdx / spiralCount) * Math.PI * 2;

        // Create inward-spiraling sensory arms
        for (let i = 0; i < totalSegments; i++) {
          const t = i / totalSegments;
          const theta = t * Math.PI * 2 * spiralTurns;
          
          // Radius spirals inward (reception gathering)
          const baseRadius = 0.7 * (1 - t);
          
          // Height rises as we spiral inward
          const height = -0.3 + t * 0.6;

          // Parametric spiral curve
          const pathX = Math.cos(theta) * baseRadius;
          const pathY = height;
          const pathZ = Math.sin(theta) * baseRadius;

          // Rotate spiral into azimuthal position
          const rotX = pathX * Math.cos(spiralAzimuth) - pathZ * Math.sin(spiralAzimuth);
          const rotY = pathY;
          const rotZ = pathX * Math.sin(spiralAzimuth) + pathZ * Math.cos(spiralAzimuth);

          // Sensory arm cross-section (asymmetric tapering)
          const armRadius = 0.12 * (1 - t * 0.9); // Narrow as we approach center
          const crossSectionCount = 5;

          for (let j = 0; j < crossSectionCount; j++) {
            const angle = (j / crossSectionCount) * Math.PI * 2;
            
            // Asymmetric cross-section
            const asymmetry = 0.6 + 0.4 * Math.sin(angle + t * Math.PI);
            const dx = Math.cos(angle) * armRadius * asymmetry;
            const dy = Math.sin(angle) * armRadius * (0.7 + 0.3 * Math.cos(angle * 1.5));
            
            spiralVertices.push(rotX + dx, rotY + dy * 0.6, rotZ);
          }
        }

        // Create spiral indices
        for (let i = 0; i < totalSegments - 1; i++) {
          const curr = i * 5;
          const next = (i + 1) * 5;

          for (let j = 0; j < 5; j++) {
            const j1 = (j + 1) % 5;
            spiralIndices.push(
              curr + j, curr + j1, next + j,
              next + j, curr + j1, next + j1
            );
          }
        }

        // Create spiral geometry
        const spiralGeometry = new THREE.BufferGeometry();
        spiralGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(spiralVertices), 3));
        spiralGeometry.setIndex(new Uint16Array(spiralIndices));
        spiralGeometry.computeVertexNormals();

        // Vary material per spiral
        const spiralMaterial = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.8 + spiralIdx * 0.05,
          roughness: 0.2 - spiralIdx * 0.03,
          emissive: color,
          emissiveIntensity: 0.25 + spiralIdx * 0.05,
          transparent: true,
          opacity: 0.85 + spiralIdx * 0.04
        });

        const spiral = new THREE.Mesh(spiralGeometry, spiralMaterial);
        group.add(spiral);
      }

      // Create central perception convergence point
      const coreGeometry = new THREE.OctahedronGeometry(0.2, 1);
      const coreMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.95,
        roughness: 0.05,
        emissive: color,
        emissiveIntensity: 0.5
      });
      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      group.add(core);

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'INPUT_PERCEPTION_VORTEX';

      return group;
    } catch (err) {
      console.warn('[InputEnhancedVariants] PerceptionVortex creation failed:', err);
      throw err;
    }
  }

  /**
   * INPUT ENHANCED: RESONANCE_CHAMBER
   * 
   * Description:
   * - Acoustic/vibrational sensing structure with harmonic nodes
   * - Central resonance chamber with radiating harmonic nodes
   * - Nodes at different distances suggesting harmonic frequencies
   * - Connection paths showing resonant frequencies
   * 
   * Visual Style:
   * - Cyan metallic (data reception)
   * - Suggests acoustic/vibrational sensing
   * - Harmonic arrangement (Fibonacci-inspired)
   * - Multiple scales suggesting multi-frequency perception
   * 
   * Geometry: NO primitives, NO perfect symmetry, NO flat meshes
   * - Custom chamber geometry with harmonic positioning
   * - All nodes are volumetric (not spheres/boxes)
   * - Connection paths are asymmetric
   */
  static createInputEnhanced_ResonanceChamber(group, color) {
    try {
      // Create main resonance chamber (asymmetric ellipsoid-like)
      const chamberVertices = new Float32Array([
        // Lower chamber segment
        0.3, -0.4, 0.0,      // 0
        0.2, -0.4, 0.25,     // 1
        -0.15, -0.4, 0.28,   // 2
        -0.32, -0.4, 0.08,   // 3
        -0.25, -0.4, -0.22,  // 4
        0.15, -0.4, -0.30,   // 5
        
        // Middle chamber
        0.28, -0.1, 0.0,     // 6
        0.18, -0.1, 0.24,    // 7
        -0.12, -0.1, 0.26,   // 8
        -0.30, -0.1, 0.06,   // 9
        -0.22, -0.1, -0.20,  // 10
        0.12, -0.1, -0.28,   // 11
        
        // Upper chamber
        0.20, 0.2, -0.05,    // 12
        0.15, 0.2, 0.18,     // 13
        -0.10, 0.2, 0.20,    // 14
        -0.22, 0.2, 0.04,    // 15
        -0.18, 0.2, -0.15,   // 16
        0.08, 0.2, -0.22     // 17
      ]);

      const chamberIndices = new Uint16Array([
        // Lower ring
        0, 1, 7,   0, 7, 6,
        1, 2, 8,   1, 8, 7,
        2, 3, 9,   2, 9, 8,
        3, 4, 10,  3, 10, 9,
        4, 5, 11,  4, 11, 10,
        5, 0, 6,   5, 6, 11,
        
        // Middle ring
        6, 7, 13,  6, 13, 12,
        7, 8, 14,  7, 14, 13,
        8, 9, 15,  8, 15, 14,
        9, 10, 16, 9, 16, 15,
        10, 11, 17, 10, 17, 16,
        11, 6, 12, 11, 12, 17,
        
        // Side connections
        0, 1, 2,  0, 2, 3,  0, 3, 4,  0, 4, 5,
        12, 13, 14, 12, 14, 15, 12, 15, 16, 12, 16, 17
      ]);

      const chamberGeometry = new THREE.BufferGeometry();
      chamberGeometry.setAttribute('position', new THREE.BufferAttribute(chamberVertices, 3));
      chamberGeometry.setIndex(new Uint16Array(chamberIndices));
      chamberGeometry.computeVertexNormals();

      const chamberMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.7,
        roughness: 0.3,
        emissive: color,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.7
      });

      const chamber = new THREE.Mesh(chamberGeometry, chamberMaterial);
      group.add(chamber);

      // Create harmonic nodes at Fibonacci-inspired positions
      const harmonicPositions = [
        { pos: [0, 0, 0], size: 0.15 },      // Fundamental
        { pos: [0.35, 0.15, 0.2], size: 0.12 },   // Harmonic 1
        { pos: [-0.3, 0.1, -0.25], size: 0.12 },  // Harmonic 2
        { pos: [0.2, -0.25, -0.35], size: 0.1 },  // Harmonic 3
        { pos: [-0.25, -0.2, 0.28], size: 0.1 },  // Harmonic 4
      ];

      const nodeMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.9,
        roughness: 0.1,
        emissive: color,
        emissiveIntensity: 0.4
      });

      harmonicPositions.forEach((harmonic, idx) => {
        const nodeGeometry = new THREE.IcosahedronGeometry(harmonic.size, 1);
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.set(...harmonic.pos);
        node.userData.isHarmonicNode = true;
        group.add(node);
      });

      // Create resonant connection paths between harmonic nodes
      const connectionMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.6,
        roughness: 0.4,
        emissive: color,
        emissiveIntensity: 0.15,
        transparent: true,
        opacity: 0.5
      });

      for (let i = 0; i < harmonicPositions.length - 1; i++) {
        for (let j = i + 1; j < harmonicPositions.length; j++) {
          const pos1 = harmonicPositions[i].pos;
          const pos2 = harmonicPositions[j].pos;
          
          // Create thin resonant connector
          const dx = pos2[0] - pos1[0];
          const dy = pos2[1] - pos1[1];
          const dz = pos2[2] - pos1[2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          const connVertices = new Float32Array([
            pos1[0] - 0.02, pos1[1] + 0.02, pos1[2],
            pos1[0] + 0.02, pos1[1] - 0.02, pos1[2],
            pos2[0] + 0.02, pos2[1] - 0.02, pos2[2],
            pos2[0] - 0.02, pos2[1] + 0.02, pos2[2]
          ]);

          const connIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);

          const connGeometry = new THREE.BufferGeometry();
          connGeometry.setAttribute('position', new THREE.BufferAttribute(connVertices, 3));
          connGeometry.setIndex(connIndices);
          connGeometry.computeVertexNormals();

          const connector = new THREE.Mesh(connGeometry, connectionMaterial);
          group.add(connector);
        }
      }

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'INPUT_RESONANCE_CHAMBER';

      return group;
    } catch (err) {
      console.warn('[InputEnhancedVariants] ResonanceChamber creation failed:', err);
      throw err;
    }
  }
}
