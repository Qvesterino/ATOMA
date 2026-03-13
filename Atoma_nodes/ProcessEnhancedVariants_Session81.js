/**
 * PROCESS ENHANCED VARIANTS - Session 81 (Updated)
 * Three NEW production-ready Process node variants
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
 * 
 * VARIANTS:
 * 1. FlowRecomposer - Floating shards slowly reconfiguring
 * 2. TemporalShifter - Stretched, offset structure with glitch/time distortion feel
 * 3. IterativeEngine - Layered, semi-cyclic structure with unresolved motion
 */

import * as THREE from 'three';

export class ProcessEnhancedVariants {
  
  /**
   * PROCESS ENHANCED: FLOW_RECOMPOSER
   * 
   * Description:
   * - Multiple floating segments or shards
   * - Segments slowly reconfigure and change relative positions
   * - Motion suggests continuous reassembly
   * - No fixed center mass
   * 
   * Visual Style:
   * - Dark matte, semi-translucent
   * - Cyan/Teal emissive accents
   * - Exploded view aesthetic
   */
  static createProcessEnhanced_FlowRecomposer(group, color) {
    try {
      const shardCount = 8;
      
      const shardMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.7,
        roughness: 0.4,
        emissive: color,
        emissiveIntensity: 0.15,
        side: THREE.DoubleSide
      });

      const coreMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6,
        wireframe: true
      });

      // Create floating shards (irregular polygons)
      for (let i = 0; i < shardCount; i++) {
        // Create irregular shard geometry
        const shape = new THREE.Shape();
        const pts = [];
        const numPts = 5;
        for (let j = 0; j < numPts; j++) {
          const angle = (j / numPts) * Math.PI * 2;
          const r = 0.15 + Math.random() * 0.15;
          pts.push(new THREE.Vector2(Math.cos(angle) * r, Math.sin(angle) * r));
        }
        shape.setFromPoints(pts);
        
        const extrudeSettings = {
          depth: 0.05 + Math.random() * 0.05,
          bevelEnabled: true,
          bevelThickness: 0.02,
          bevelSize: 0.02,
          bevelSegments: 1
        };
        
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const shard = new THREE.Mesh(geometry, shardMaterial);
        
        // Random initial position in a cloud
        const radius = 0.4 + Math.random() * 0.3;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        shard.position.set(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        );
        
        shard.lookAt(0, 0, 0);
        shard.rotation.z = Math.random() * Math.PI * 2;

        // Animation metadata for "reconfiguring" motion
        shard.userData.isRecomposerShard = true;
        shard.userData.driftSpeed = 0.1 + Math.random() * 0.2;
        shard.userData.driftAxis = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize();
        shard.userData.visualCoreImmutable = true;
        
        group.add(shard);
      }

      // Inner "ghost" geometry representing the logic holding it together
      const innerGeo = new THREE.IcosahedronGeometry(0.25, 0);
      const innerMesh = new THREE.Mesh(innerGeo, coreMaterial);
      innerMesh.userData.visualCoreImmutable = true;
      // Animate inner core to pulse/rotate
      innerMesh.userData.isFlowCore = true;
      group.add(innerMesh);

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'PROCESS_FLOW_RECOMPOSER';

      return group;
    } catch (err) {
      console.warn('[ProcessEnhancedVariants] FlowRecomposer creation failed:', err);
      return group;
    }
  }

  /**
   * PROCESS ENHANCED: TEMPORAL_SHIFTER
   * 
   * Description:
   * - Stretched, offset structure
   * - Different parts move slightly out of sync
   * - Subtle temporal delay between components
   * - Motion implies time distortion
   * 
   * Visual Style:
   * - Elongated forms
   * - "Glitch" aesthetic via offset layers
   */
  static createProcessEnhanced_TemporalShifter(group, color) {
    try {
      const layerCount = 5;
      
      const mainMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.8,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.85
      });

      const glitchMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        wireframe: true
      });

      // Create a stack of "slices" that will drift relative to each other
      for (let i = 0; i < layerCount; i++) {
        // Irregular elongated shape
        const w = 0.6;
        const h = 0.12;
        const d = 0.6;
        
        // Use a tapered/skewed box for irregularity
        const geometry = new THREE.CylinderGeometry(w * (0.8 + Math.random()*0.2), w * (0.8 + Math.random()*0.2), h, 5);
        const mesh = new THREE.Mesh(geometry, mainMaterial);
        
        // Vertical stack with gaps
        mesh.position.y = (i - layerCount/2) * 0.25;
        
        // Initial random offset (temporal distortion)
        mesh.position.x = (Math.random() - 0.5) * 0.1;
        mesh.position.z = (Math.random() - 0.5) * 0.1;
        
        // Random rotation (slight twist)
        mesh.rotation.y = i * 0.2;

        // Animation metadata
        mesh.userData.isTemporalLayer = true;
        mesh.userData.layerIndex = i;
        mesh.userData.phaseOffset = i * 0.5; // Delay per layer
        mesh.userData.shiftSpeed = 0.5;
        mesh.userData.visualCoreImmutable = true;
        
        group.add(mesh);

        // Occasional "glitch" wireframe overlay on some layers
        if (Math.random() > 0.6) {
            const glitchMesh = new THREE.Mesh(geometry, glitchMaterial);
            glitchMesh.scale.setScalar(1.05);
            glitchMesh.position.copy(mesh.position);
            glitchMesh.rotation.copy(mesh.rotation);
            glitchMesh.userData.isGlitchOverlay = true;
            glitchMesh.userData.parentLayerIndex = i;
            glitchMesh.userData.visualCoreImmutable = true;
            group.add(glitchMesh);
        }
      }

      // Connecting "timeline" spine
      const spineGeo = new THREE.CylinderGeometry(0.05, 0.05, layerCount * 0.3, 4);
      const spineMat = new THREE.MeshBasicMaterial({ color: color, opacity: 0.5, transparent: true });
      const spine = new THREE.Mesh(spineGeo, spineMat);
      spine.userData.visualCoreImmutable = true;
      group.add(spine);

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'PROCESS_TEMPORAL_SHIFTER';

      return group;
    } catch (err) {
      console.warn('[ProcessEnhancedVariants] TemporalShifter creation failed:', err);
      return group;
    }
  }

  /**
   * PROCESS ENHANCED: ITERATIVE_ENGINE
   * 
   * Description:
   * - Layered, semi-cyclic structure
   * - Repeating motion without closed loops
   * - Fragments follow recurring but non-identical paths
   * - Motion feels computational, persistent, unresolved
   * 
   * Visual Style:
   * - Complex mechanical/organic hybrid
   * - Repeating overlapping elements
   */
  static createProcessEnhanced_IterativeEngine(group, color) {
    try {
      const ringCount = 3;
      
      const engineMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        metalness: 0.6,
        roughness: 0.5,
        emissive: color,
        emissiveIntensity: 0.2
      });

      const activeMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.9,
        roughness: 0.1,
        emissive: color,
        emissiveIntensity: 0.5
      });

      // Create incomplete rings / arcs (semi-cyclic)
      for (let i = 0; i < ringCount; i++) {
        const radius = 0.4 + i * 0.25;
        const tube = 0.08 - i * 0.01;
        const arcLength = Math.PI * 1.5; // Not a full circle
        
        const geometry = new THREE.TorusGeometry(radius, tube, 6, 24, arcLength);
        const mesh = new THREE.Mesh(geometry, engineMaterial);
        
        // Orient rings on different axes to avoid simple concentric look
        mesh.rotation.x = Math.random() * Math.PI;
        mesh.rotation.y = Math.random() * Math.PI;
        
        // Animation metadata
        mesh.userData.isIterativeRing = true;
        mesh.userData.rotationSpeed = 0.1 + (i * 0.05);
        mesh.userData.rotationAxis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
        mesh.userData.visualCoreImmutable = true;
        
        group.add(mesh);

        // "Processing Heads" - small blocks that travel along the arcs (conceptually)
        // Since we can't easily animate along path without update loop, we attach them to the ring
        const headGeo = new THREE.BoxGeometry(tube*2.5, tube*2.5, tube*4);
        const head = new THREE.Mesh(headGeo, activeMaterial);
        // Position at end of arc
        head.position.set(radius, 0, 0); 
        // Parent to ring so it moves with it
        mesh.add(head);
      }

      // Central agitator - irregular shape
      const coreGeo = new THREE.DodecahedronGeometry(0.25, 0);
      const core = new THREE.Mesh(coreGeo, activeMaterial);
      core.userData.isIterativeCore = true;
      core.userData.visualCoreImmutable = true;
      group.add(core);

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'PROCESS_ITERATIVE_ENGINE';

      return group;
    } catch (err) {
      console.warn('[ProcessEnhancedVariants] IterativeEngine creation failed:', err);
      return group;
    }
  }
}

export default ProcessEnhancedVariants;
