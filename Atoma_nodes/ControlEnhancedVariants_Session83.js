/**
 * CONTROL ENHANCED VARIANTS - Session 83 (Updated for KINETIC/AI-GROWN)
 * Three NEW production-ready Control node variants
 * 
 * UPGRADE GOAL: Kinetic, "AI-Grown" behaviors (Tier 2)
 * - DecisionFork -> "SynapseFork" (Pulsing decision paths)
 * - AuthorityHelix -> "CommandSpire" (Rotating helical authority)
 * - CommandMatrix -> "OmniscientEye" (Mythic AI overseer)
 */

import * as THREE from 'three';

export class ControlEnhancedVariants {
   
  /**
   * CONTROL ENHANCED: DECISION_FORK (SynapseFork)
   * 
   * Description:
   * - Asymmetric branching structure representing decision paths
   * - Branches pulse with "decision energy"
   * - Convergence nodes orbit the structure
   */
  static createControlEnhanced_DecisionFork(group, color) {
    try {
      const branchCount = 4;
      const segmentsPerBranch = 16;
      const baseRadius = 0.6;

      // Create main trunk
      const trunkVertices = [];
      const trunkIndices = [];

      // Trunk: from base upward to split point
      for (let i = 0; i < 8; i++) {
        const t = i / 8;
        const angle = Math.PI * 0.2 * Math.sin(t * Math.PI); // Slight curve
        
        // Central spine position
        const x = Math.sin(angle) * 0.1;
        const y = t - 0.4;
        const z = 0;

        // Trunk cross-section (octagonal tapering)
        const trunkRadius = baseRadius * (1 - t * 0.15); // Taper as it rises
        for (let j = 0; j < 8; j++) {
          const angle = (j / 8) * Math.PI * 2;
          const vx = x + Math.cos(angle) * trunkRadius;
          const vy = y;
          const vz = z + Math.sin(angle) * trunkRadius;
          trunkVertices.push(vx, vy, vz);
        }
      }

      // Trunk indices
      for (let i = 0; i < 7; i++) {
        const curr = i * 8;
        const next = (i + 1) * 8;
        for (let j = 0; j < 8; j++) {
          const j1 = (j + 1) % 8;
          trunkIndices.push(
            curr + j, curr + j1, next + j,
            next + j, curr + j1, next + j1
          );
        }
      }

      // Create trunk mesh
      const trunkGeometry = new THREE.BufferGeometry();
      trunkGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(trunkVertices), 3));
      trunkGeometry.setIndex(new Uint16Array(trunkIndices));
      trunkGeometry.computeVertexNormals();

      const trunkMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.8,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.25,
        transparent: true,
        opacity: 0.9
      });

      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.userData.isTrunk = true;
      trunk.userData.isVFX = true;
      group.add(trunk);

      // Create asymmetric branches from split point
      for (let branchIdx = 0; branchIdx < branchCount; branchIdx++) {
        const branchVertices = [];
        const branchIndices = [];

        // Each branch at different angle and height
        const branchAngle = (branchIdx / branchCount) * Math.PI * 2;
        
        // Branch creation
        for (let i = 0; i < segmentsPerBranch; i++) {
          const t = i / segmentsPerBranch;
          
          // Parametric branch curve (outward and upward, asymmetric)
          const curve = Math.pow(t, 0.7); // Non-linear curve
          const outward = curve * 0.6;
          const upward = curve * 0.4 + 0.3;
          
          // Add asymmetry per branch
          const asymmetry = Math.sin(branchIdx * 1.5 + t * 3) * 0.08;
          
          const bx = Math.cos(branchAngle) * outward + asymmetry;
          const by = upward;
          const bz = Math.sin(branchAngle) * outward + asymmetry * 0.5;
          
          const branchRadius = 0.04 * (1 - t * 0.5);
          
          for (let j = 0; j < 6; j++) {
            const angle = (j / 6) * Math.PI * 2;
            const vx = bx + Math.cos(angle) * branchRadius;
            const vy = by + Math.sin(angle) * branchRadius * 0.5;
            const vz = bz + Math.sin(angle) * branchRadius;
            branchVertices.push(vx, vy, vz);
          }
        }

        // Branch indices
        for (let i = 0; i < segmentsPerBranch - 1; i++) {
          const curr = i * 6;
          const next = (i + 1) * 6;
          for (let j = 0; j < 6; j++) {
            const j1 = (j + 1) % 6;
            branchIndices.push(
              curr + j, curr + j1, next + j,
              next + j, curr + j1, next + j1
            );
          }
        }

        const branchGeometry = new THREE.BufferGeometry();
        branchGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(branchVertices), 3));
        branchGeometry.setIndex(new Uint16Array(branchIndices));
        branchGeometry.computeVertexNormals();

        const branchMaterial = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.75,
          roughness: 0.25,
          emissive: color,
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: 0.85
        });

        const branch = new THREE.Mesh(branchGeometry, branchMaterial);
        branch.userData.isBranch = true;
        branch.userData.branchIndex = branchIdx;
        branch.userData.isVFX = true;
        group.add(branch);

        // Add decision nodes at branch tips
        const tipGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const tipMat = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.9,
          roughness: 0.1,
          emissive: color,
          emissiveIntensity: 0.5
        });
        
        const branchAngleFinal = (branchIdx / branchCount) * Math.PI * 2;
        const tipX = Math.cos(branchAngleFinal) * 0.6 + Math.sin(branchIdx * 1.5) * 0.08;
        const tipY = 0.3 + 0.4 + Math.sin(branchIdx * 1.5) * 0.08;
        const tipZ = Math.sin(branchAngleFinal) * 0.6 + Math.sin(branchIdx * 1.5) * 0.08 * 0.5;
        
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.position.set(tipX, tipY, tipZ);
        tip.userData.isDecisionNode = true;
        tip.userData.branchIndex = branchIdx;
        tip.userData.visualCoreImmutable = true;
        group.add(tip);
      }

      // Add orbiting convergence nodes
      const orbitRadius = 0.25;
      const orbitNodeCount = 6;
      
      for (let i = 0; i < orbitNodeCount; i++) {
        const orbitAngle = (i / orbitNodeCount) * Math.PI * 2;
        const orbitGeo = new THREE.OctahedronGeometry(0.03, 0);
        const orbitMat = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.85,
          roughness: 0.15,
          emissive: color,
          emissiveIntensity: 0.4
        });
        
        const orbitNode = new THREE.Mesh(orbitGeo, orbitMat);
        orbitNode.position.set(
          Math.cos(orbitAngle) * orbitRadius,
          0.1 + Math.sin(orbitAngle) * 0.1,
          Math.sin(orbitAngle) * orbitRadius
        );
        orbitNode.userData.isOrbitNode = true;
        orbitNode.userData.orbitIndex = i;
        orbitNode.userData.orbitAngle = orbitAngle;
        orbitNode.userData.visualCoreImmutable = true;
        group.add(orbitNode);
      }

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'CONTROL_DECISION_FORK';

      return group;
    } catch (err) {
      console.warn('[ControlEnhancedVariants] DecisionFork creation failed:', err);
      return group;
    }
  }

  /**
   * CONTROL ENHANCED: AUTHORITY_HELIX (CommandSpire)
   * 
   * Description:
   * - Vertical spire with rotating command tiers
   * - Helical strand winds around central axis
   * - Authority rings pulse with dominance signal
   */
  static createControlEnhanced_AuthorityHelix(group, color) {
    try {
      const helixTurns = 3;
      const helixPoints = 80;
      const helixRadius = 0.18;
      const helixHeight = 1.0;

      // Central command axis
      const axisGeometry = new THREE.CylinderGeometry(0.04, 0.04, helixHeight, 8);
      const axisMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.9,
        roughness: 0.1,
        emissive: color,
        emissiveIntensity: 0.4
      });
      const axis = new THREE.Mesh(axisGeometry, axisMaterial);
      axis.userData.isCommandAxis = true;
      group.add(axis);

      // Helical command strand
      const helixVertices = [];
      const helixIndices = [];
      const helixWidth = 0.035;
      const segments = helixPoints;
      const strandCount = 2; // Double helix

      for (let strand = 0; strand < strandCount; strand++) {
        const strandOffset = (strand / strandCount) * Math.PI * 2;
        
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const angle = t * helixTurns * Math.PI * 2 + strandOffset;
          const y = t * helixHeight - helixHeight / 2;
          
          const px = Math.cos(angle) * helixRadius;
          const pz = Math.sin(angle) * helixRadius;
          
          // Cross-section of the strand
          for (let j = 0; j < 4; j++) {
            const sectionAngle = (j / 4) * Math.PI * 2;
            const nx = Math.cos(angle + sectionAngle) * helixWidth;
            const nz = Math.sin(angle + sectionAngle) * helixWidth;
            
            helixVertices.push(px + nx, y, pz + nz);
          }
        }

        // Create strand faces
        for (let i = 0; i < segments; i++) {
          const curr = (i * 4) + (strand * (segments + 1) * 4);
          const next = ((i + 1) * 4) + (strand * (segments + 1) * 4);
          
          for (let j = 0; j < 4; j++) {
            const j1 = (j + 1) % 4;
            helixIndices.push(
              curr + j, next + j, curr + j1,
              next + j, next + j1, curr + j1
            );
          }
        }
      }

      const helixGeometry = new THREE.BufferGeometry();
      helixGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(helixVertices), 3));
      helixGeometry.setIndex(new Uint16Array(helixIndices));
      helixGeometry.computeVertexNormals();

      const helixMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.85,
        roughness: 0.15,
        emissive: color,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.9
      });

      const helix = new THREE.Mesh(helixGeometry, helixMaterial);
      helix.userData.isHelixStrand = true;
      helix.userData.isVFX = true;
      group.add(helix);

      // Add authority tier rings
      const tierCount = 5;
      for (let i = 0; i < tierCount; i++) {
        const ringGeometry = new THREE.TorusGeometry(
          0.5 * (1 - (i / tierCount) * 0.6),
          0.05,
          8,
          24
        );
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.3
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        
        ring.position.y = -0.4 + (i / tierCount) * 0.8;
        
        ring.userData.isTierRing = true;
        ring.userData.tierIndex = i;
        ring.userData.visualCoreImmutable = true;
        group.add(ring);
      }

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'CONTROL_AUTHORITY_HELIX';

      return group;
    } catch (err) {
      console.warn('[ControlEnhancedVariants] AuthorityHelix creation failed:', err);
      return group;
    }
  }

  /**
   * CONTROL ENHANCED: COMMAND_MATRIX (OmniscientEye)
   * 
   * Description:
   * - Central eye/beacon radiating command authority
   * - 4 orbital rings at staggered angles
   * - 6 command beams extending to the grid boundary
   * - Radial scan-pulse aura for mythic AI presence
   * 
   * PERFORMANCE: Shared materials, reduced geometry segments, removed redundant outlines.
   */
  static createControlEnhanced_CommandMatrix(group, color) {
    try {
      // ── Shared materials (drastically reduces per-node material count) ──
      const matBody = new THREE.MeshStandardMaterial({
        color: color, metalness: 0.85, roughness: 0.12,
        emissive: color, emissiveIntensity: 0.6
      });
      const matGlow = new THREE.MeshStandardMaterial({
        color: color, metalness: 0.5, roughness: 0.2,
        emissive: color, emissiveIntensity: 1.6
      });
      const matAura = new THREE.MeshStandardMaterial({
        color: color, metalness: 0.1, roughness: 0.8,
        emissive: color, emissiveIntensity: 0.25,
        transparent: true, opacity: 0.12,
        side: THREE.FrontSide, depthWrite: false
      });
      const matLine = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.4 });

      // ── Central Eye Core ──────────────────────────────────────────────
      const membrane = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 12, 8), // reduced from 24,16
        matBody
      );
      membrane.scale.set(1.0, 0.52, 1.0);
      membrane.userData.isVFX = true;
      group.add(membrane);

      const iris = new THREE.Mesh(
        new THREE.CylinderGeometry(0.095, 0.095, 0.06, 12), // reduced from 20
        matGlow
      );
      iris.rotation.x = Math.PI / 2;
      iris.userData.isVFX = true;
      group.add(iris);

      const pupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 6), // reduced from 16,12
        new THREE.MeshStandardMaterial({
          color: 0xffffff, metalness: 0, roughness: 0,
          emissive: color, emissiveIntensity: 2.5
        })
      );
      pupil.userData.isVFX = true;
      group.add(pupil);

      // Single outline instead of full edge geometry
      const eyeOutline = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.SphereGeometry(0.165, 12, 8)),
        matLine
      );
      eyeOutline.scale.set(1.0, 0.52, 1.0);
      eyeOutline.userData.isVFX = true;
      group.add(eyeOutline);

      // ── Orbital Rings (4) ───────────────────────────────────────────
      const ringAngles = [
        { tiltX: 0.0,          tiltZ: 0.0,          radius: 0.46, thickness: 0.012 },
        { tiltX: Math.PI / 3,  tiltZ: Math.PI / 7,  radius: 0.42, thickness: 0.010 },
        { tiltX: Math.PI / 5,  tiltZ: -Math.PI / 3, radius: 0.50, thickness: 0.008 },
        { tiltX: -Math.PI / 4, tiltZ: Math.PI / 5,  radius: 0.38, thickness: 0.009 }
      ];

      ringAngles.forEach((ring, ri) => {
        const ringMesh = new THREE.Mesh(
          new THREE.TorusGeometry(ring.radius, ring.thickness, 6, 32), // reduced from 8,56
          matBody
        );
        ringMesh.rotation.x = ring.tiltX;
        ringMesh.rotation.z = ring.tiltZ;
        ringMesh.userData.isOrbitalRing = true;
        ringMesh.userData.ringIndex = ri;
        ringMesh.userData.visualCoreImmutable = true;
        group.add(ringMesh);
      });

      // ── Command Beams (6 directions) ───────────────────────────────
      const beamDirections = [
        new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)
      ];

      const beamGeo = new THREE.CylinderGeometry(0.006, 0.016, 0.72, 5); // reduced from 6
      beamDirections.forEach((dir, bi) => {
        const beam = new THREE.Mesh(beamGeo, matGlow);
        const up = new THREE.Vector3(0, 1, 0);
        beam.setRotationFromQuaternion(
          new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize())
        );
        beam.position.copy(dir.clone().multiplyScalar(0.58));
        beam.userData.isCommandBeam = true;
        beam.userData.beamIndex = bi;
        beam.userData.visualCoreImmutable = true;
        group.add(beam);

        const tip = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.022, 0),
          matGlow
        );
        tip.position.copy(dir.clone().multiplyScalar(0.97));
        tip.userData.isBeamTip = true;
        tip.userData.visualCoreImmutable = true;
        group.add(tip);
      });

      // ── Radial Scan-Pulse Aura (single shell instead of 2) ────────────
      const aura = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 10, 8), // reduced from 20,14
        matAura
      );
      aura.userData.isScanAura = true;
      aura.userData.visualCoreImmutable = true;
      group.add(aura);

      // Halo disc
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.36, 0.58, 16), // reduced from 32
        new THREE.MeshStandardMaterial({
          color, metalness: 0.5, roughness: 0.4,
          emissive: color, emissiveIntensity: 0.25,
          transparent: true, opacity: 0.14,
          side: THREE.DoubleSide, depthWrite: false
        })
      );
      halo.rotation.x = Math.PI / 2;
      halo.userData.isHalo = true;
      halo.userData.visualCoreImmutable = true;
      group.add(halo);

      // ── Authority Markers — 4 corner spires ────────────────────────
      const spirePositions = [
        new THREE.Vector3(0.38, 0.18, 0.38),
        new THREE.Vector3(-0.38, 0.18, 0.38),
        new THREE.Vector3(0.38, 0.18, -0.38),
        new THREE.Vector3(-0.38, 0.18, -0.38)
      ];

      const spireGeo = new THREE.ConeGeometry(0.028, 0.18, 5); // reduced from 6
      spirePositions.forEach((pos, si) => {
        const spire = new THREE.Mesh(spireGeo, matBody);
        spire.position.copy(pos);
        spire.userData.isSpire = true;
        spire.userData.spireIndex = si;
        spire.userData.visualCoreImmutable = true;
        group.add(spire);
      });

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'CONTROL_COMMAND_MATRIX';

      return group;
    } catch (err) {
      console.warn('[ControlEnhancedVariants] CommandMatrix creation failed:', err);
      return group;
    }
  }
}

export default ControlEnhancedVariants;
