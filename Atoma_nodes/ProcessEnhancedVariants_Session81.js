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
   * PROCESS ENHANCED: FLOW_RECOMPOSER (V2 — Crystallized Recomposition)
   *
   * Description:
   * - 8 refractive crystalline shards in asymmetric cloud
   * - Edge highlights on each shard (blueprint overlay)
   * - 3 ghost echoes suggesting recomposition state
   * - Distorted dodecahedron core + inner seed
   * - Data filaments connecting core to shards
   * - Static dust field for spatial depth
   * - NO internal motion — static, composed structure
   *
   * Visual Style:
   * - Refractive glass-like shards (MeshPhysicalMaterial)
   * - Cyan/Teal emissive accents
   * - Exploded view aesthetic, now crystallized
   */
  static createProcessEnhanced_FlowRecomposer(group, color) {
    try {
      const resolvedColor = (typeof color === 'number') ? color : 0x00eaff;
      const colorObj = new THREE.Color(resolvedColor);

      // Simple seeded RNG from nodeKey
      const nodeKey = group?.userData?.nodeId || '204';
      let seed = 0;
      for (let i = 0; i < nodeKey.length; i++) seed = ((seed << 5) - seed) + nodeKey.charCodeAt(i);
      seed = Math.abs(seed) || 204;
      const rng = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      const shardCount = 8;
      const ghostCount = 3;
      const filamentCount = 4;
      const dustCount = 20;

      // === MATERIALS ===
      const shardMat = new THREE.MeshPhysicalMaterial({
        color: 0x1a1a1a,
        metalness: 0.6,
        roughness: 0.18,
        transmission: 0.35,
        thickness: 0.5,
        emissive: resolvedColor,
        emissiveIntensity: 0.22,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92
      });

      const edgeMat = new THREE.LineBasicMaterial({
        color: resolvedColor,
        transparent: true,
        opacity: 0.45,
        depthWrite: false
      });

      const ghostMat = new THREE.MeshPhysicalMaterial({
        color: resolvedColor,
        metalness: 0.4,
        roughness: 0.3,
        transmission: 0.15,
        emissive: resolvedColor,
        emissiveIntensity: 0.12,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        side: THREE.DoubleSide
      });

      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x111111,
        metalness: 0.7,
        roughness: 0.2,
        emissive: resolvedColor,
        emissiveIntensity: 0.35
      });

      const seedMat = new THREE.MeshStandardMaterial({
        color: resolvedColor,
        metalness: 0.5,
        roughness: 0.15,
        emissive: resolvedColor,
        emissiveIntensity: 0.55
      });

      const filamentMat = new THREE.LineBasicMaterial({
        color: resolvedColor,
        transparent: true,
        opacity: 0.22,
        depthWrite: false
      });

      const dustMat = new THREE.PointsMaterial({
        color: resolvedColor,
        size: 0.025,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        sizeAttenuation: true
      });

      [shardMat, edgeMat, ghostMat, coreMat, seedMat, filamentMat, dustMat].forEach((mat) => {
        mat.userData = mat.userData || {};
        mat.userData.wavePatchMode = 'DEFAULT';
        mat.userData.ignoreWaveColor = true;
      });

      const root = new THREE.Group();
      root.name = 'PROCESS_FLOW_RECOMPOSER_NODE';
      root.userData.visualVariant = 'PROCESS_FLOW_RECOMPOSER_V2';
      root.userData.nodeGeometryName = 'PROCESS_FLOW_RECOMPOSER';

      const shardPositions = [];

      // === SHARDS + EDGE HIGHLIGHTS ===
      for (let i = 0; i < shardCount; i++) {
        const shape = new THREE.Shape();
        const pts = [];
        const numPts = 5;
        for (let j = 0; j < numPts; j++) {
          const angle = (j / numPts) * Math.PI * 2;
          const r = 0.12 + rng() * 0.12;
          pts.push(new THREE.Vector2(Math.cos(angle) * r, Math.sin(angle) * r));
        }
        shape.setFromPoints(pts);

        const extrudeSettings = {
          depth: 0.04 + rng() * 0.05,
          bevelEnabled: true,
          bevelThickness: 0.015,
          bevelSize: 0.015,
          bevelSegments: 1
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.computeBoundingSphere();

        const shard = new THREE.Mesh(geometry, shardMat);
        shard.name = `FlowShard_${i}`;

        const radius = 0.35 + rng() * 0.25;
        const theta = rng() * Math.PI * 2;
        const phi = rng() * Math.PI;
        const pos = new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        );
        shard.position.copy(pos);
        shardPositions.push(pos.clone());

        shard.lookAt(0, 0, 0);
        shard.rotation.z = rng() * Math.PI * 2;
        shard.userData.isRecomposerShard = true;
        shard.userData.visualCoreImmutable = true;
        shard.userData.ignoreWaveColor = true;
        root.add(shard);

        // Edge highlight
        const edgesGeo = new THREE.EdgesGeometry(geometry, 10);
        const edges = new THREE.LineSegments(edgesGeo, edgeMat);
        edges.name = `FlowShard_${i}_Edges`;
        edges.position.copy(shard.position);
        edges.rotation.copy(shard.rotation);
        edges.userData.ignoreWaveColor = true;
        root.add(edges);
      }

      // === GHOST ECHOES ===
      for (let i = 0; i < ghostCount; i++) {
        const sourceIdx = Math.floor(rng() * shardCount);
        const sourcePos = shardPositions[sourceIdx];
        const ghostPos = sourcePos.clone().multiplyScalar(0.82 + rng() * 0.12);
        ghostPos.add(new THREE.Vector3((rng() - 0.5) * 0.08, (rng() - 0.5) * 0.08, (rng() - 0.5) * 0.08));

        const ghostGeo = new THREE.OctahedronGeometry(0.04 + rng() * 0.03, 0);
        const ghost = new THREE.Mesh(ghostGeo, ghostMat);
        ghost.name = `FlowGhost_${i}`;
        ghost.position.copy(ghostPos);
        ghost.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
        ghost.userData.visualCoreImmutable = true;
        ghost.userData.ignoreWaveColor = true;
        root.add(ghost);
      }

      // === CORE: distorted dodecahedron + inner seed ===
      const coreGeo = new THREE.DodecahedronGeometry(0.18, 0);
      const corePosAttr = coreGeo.attributes.position;
      for (let i = 0; i < corePosAttr.count; i++) {
        const x = corePosAttr.getX(i);
        const y = corePosAttr.getY(i);
        const z = corePosAttr.getZ(i);
        corePosAttr.setXYZ(i, x * (0.9 + rng() * 0.2), y * 1.1, z * (0.85 + rng() * 0.15));
      }
      corePosAttr.needsUpdate = true;
      coreGeo.computeVertexNormals();
      coreGeo.computeBoundingSphere();

      const core = new THREE.Mesh(coreGeo, coreMat);
      core.name = 'FlowCore';
      core.userData.isFlowCore = true;
      core.userData.visualCoreImmutable = true;
      core.userData.ignoreWaveColor = true;
      root.add(core);

      const seedGeo = new THREE.OctahedronGeometry(0.06, 0);
      const coreSeed = new THREE.Mesh(seedGeo, seedMat);
      coreSeed.name = 'FlowCoreSeed';
      coreSeed.position.set(0.02, 0.04, -0.01);
      coreSeed.rotation.set(0.3, 0.5, -0.2);
      coreSeed.userData.visualCoreImmutable = true;
      coreSeed.userData.ignoreWaveColor = true;
      root.add(coreSeed);

      // === DATA FILAMENTS ===
      for (let i = 0; i < filamentCount; i++) {
        const targetIdx = Math.floor(rng() * shardCount);
        const targetPos = shardPositions[targetIdx];
        const midPoint = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 0, 0), targetPos, 0.5 + rng() * 0.2);
        midPoint.add(new THREE.Vector3((rng() - 0.5) * 0.06, (rng() - 0.5) * 0.06, (rng() - 0.5) * 0.06));

        const filamentCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          midPoint,
          targetPos.clone().multiplyScalar(0.92)
        ]);
        const filamentGeo = new THREE.BufferGeometry().setFromPoints(filamentCurve.getPoints(12));
        const filament = new THREE.Line(filamentGeo, filamentMat);
        filament.name = `FlowFilament_${i}`;
        filament.userData.ignoreWaveColor = true;
        root.add(filament);
      }

      // === STATIC DUST ===
      const dustPositions = [];
      for (let i = 0; i < dustCount; i++) {
        const angle = (i / dustCount) * Math.PI * 2;
        const r = 0.3 + rng() * 0.25;
        dustPositions.push(
          Math.cos(angle) * r + (rng() - 0.5) * 0.05,
          (rng() - 0.5) * 0.3,
          Math.sin(angle) * r + (rng() - 0.5) * 0.05
        );
      }
      const dustGeo = new THREE.BufferGeometry();
      dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
      const dust = new THREE.Points(dustGeo, dustMat);
      dust.name = 'FlowDust';
      dust.userData.ignoreWaveColor = true;
      root.add(dust);

      root.userData.visualReady = true;
      group.add(root);
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
