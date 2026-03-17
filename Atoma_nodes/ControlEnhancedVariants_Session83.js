/**
 * CONTROL ENHANCED VARIANTS - Session 83 (Updated for KINETIC/AI-GROWN)
 * Three NEW production-ready Control node variants
 * 
 * UPGRADE GOAL: Kinetic, "AI-Grown" behaviors (Tier 2)
 * - DecisionFork -> "SynapseFork" (Pulsing decision paths)
 * - AuthorityHelix -> "CommandSpire" (Rotating helical authority)
 * - CommandMatrix -> "OverseerGrid" (Distributed, breathing network)
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
          const distance = t * 0.7;
          const height = 0.25 + t * 0.35;
          const curvature = Math.sin(t * Math.PI) * 0.15;
          
          const pathX = Math.cos(branchAngle) * distance + Math.sin(branchAngle) * curvature;
          const pathY = 0.55 + height; // Start from split point
          const pathZ = Math.sin(branchAngle) * distance - Math.cos(branchAngle) * curvature;

          // Branch cross-section (asymmetric tapering)
          const branchRadius = 0.12 * (1 - t * 0.8); // Taper to thin point
          const crossSectionCount = 6;

          for (let j = 0; j < crossSectionCount; j++) {
            const angle = (j / crossSectionCount) * Math.PI * 2;
            
            // Asymmetric cross-section
            const asymmetry = 0.5 + 0.5 * Math.cos(angle + t * Math.PI);
            const dx = Math.cos(angle) * branchRadius * asymmetry;
            const dy = Math.sin(angle) * branchRadius * (0.7 + 0.3 * Math.cos(angle * 1.5));
            
            branchVertices.push(pathX + dx, pathY, pathZ + dy);
          }
        }

        // Create branch indices
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

        // Create branch geometry
        const branchGeometry = new THREE.BufferGeometry();
        branchGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(branchVertices), 3));
        branchGeometry.setIndex(new Uint16Array(branchIndices));
        branchGeometry.computeVertexNormals();

        // Vary material per branch
        const branchMaterial = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.75 + branchIdx * 0.04,
          roughness: 0.25 - branchIdx * 0.03,
          emissive: color,
          emissiveIntensity: 0.2 + branchIdx * 0.04,
          transparent: true,
          opacity: 0.85 + branchIdx * 0.03
        });

        const branch = new THREE.Mesh(branchGeometry, branchMaterial);
        branch.userData.isDecisionBranch = true;
        branch.userData.branchIndex = branchIdx;
        branch.userData.visualCoreImmutable = true;
        branch.userData.isVFX = true;
        group.add(branch);
      }

      // Create orbiting convergence nodes (floating decision points)
      for (let i=0; i<3; i++) {
          const orbGeo = new THREE.OctahedronGeometry(0.08, 0);
          const orbMat = new THREE.MeshBasicMaterial({ color: color });
          const orb = new THREE.Mesh(orbGeo, orbMat);
          
          orb.userData.isConvergenceNode = true;
          orb.userData.orbitIndex = i;
          orb.userData.orbitRadius = 0.8 + (i * 0.2);
          orb.userData.orbitSpeed = 0.3 + (i * 0.1);
          orb.userData.visualCoreImmutable = true;
          orb.userData.isVFX = true;
          
          group.add(orb);
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
   * - Spiraling command structure
   * - Helix strands rotate continuously around central axis
   * - Tiered rings pulse with authority
   */
  static createControlEnhanced_AuthorityHelix(group, color) {
    try {
      const tierCount = 4;
      const segmentsPerTier = 24;
      const totalSegments = tierCount * segmentsPerTier;

      // Create helix spiral
      const helixVertices = [];
      const helixIndices = [];

      for (let i = 0; i < totalSegments; i++) {
        const t = i / totalSegments;
        const theta = t * Math.PI * 6; // 3 full rotations
        
        // Hierarchical radius (decreases as we go up)
        const radiusFactor = 1 - t * 0.6; // From 1.0 to 0.4
        const helixRadius = 0.5 * radiusFactor;
        
        // Height follows tier progression
        const height = t * 0.8 - 0.4;

        // Central spine position (helix)
        const x = Math.cos(theta) * helixRadius;
        const y = height;
        const z = Math.sin(theta) * helixRadius;

        // Helix strand cross-section (asymmetric tube)
        const strandRadius = 0.1 * radiusFactor;
        const crossSectionCount = 5;

        for (let j = 0; j < crossSectionCount; j++) {
          const angle = (j / crossSectionCount) * Math.PI * 2;
          
          // Asymmetric cross-section
          const asymmetry = 0.6 + 0.4 * Math.sin(angle + theta);
          const dx = Math.cos(angle) * strandRadius * asymmetry;
          const dy = Math.sin(angle) * strandRadius;
          
          helixVertices.push(x + dx, y + dy * 0.5, z);
        }
      }

      // Create helix indices
      for (let i = 0; i < totalSegments - 1; i++) {
        const curr = i * 5;
        const next = (i + 1) * 5;

        for (let j = 0; j < 5; j++) {
          const j1 = (j + 1) % 5;
          helixIndices.push(
            curr + j, curr + j1, next + j,
            next + j, curr + j1, next + j1
          );
        }
      }

      // Create helix geometry
      const helixGeometry = new THREE.BufferGeometry();
      helixGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(helixVertices), 3));
      helixGeometry.setIndex(new Uint16Array(helixIndices));
      helixGeometry.computeVertexNormals();

      const helixMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.8,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.85
      });

      const helix = new THREE.Mesh(helixGeometry, helixMaterial);
      helix.userData.isHelixStrand = true;
      helix.userData.visualCoreImmutable = true;
      helix.userData.isVFX = true;
      group.add(helix);

      // Create central hierarchy axis
      const axisGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8);
      const axisMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.95,
        roughness: 0.05,
        emissive: color,
        emissiveIntensity: 0.4
      });
      const axis = new THREE.Mesh(axisGeometry, axisMaterial);
      axis.userData.isCommandAxis = true;
      group.add(axis);

      // Add connecting tier rings at key points
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
   * CONTROL ENHANCED: COMMAND_MATRIX (OverseerGrid)
   * 
   * Description:
   * - Grid-based distributed decision network
   * - Nodes bob and weave relative to each other
   * - Connections pulse with data flow
   */
  static createControlEnhanced_CommandMatrix(group, color) {
    try {
      const gridSize = 3;
      const nodeSize = 0.08;
      const gridSpacing = 0.35;

      // Create command node lattice
      const nodePositions = [];
      
      // Generate asymmetric grid positions
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          for (let k = 0; k < gridSize; k++) {
            // Asymmetric perturbation (no perfect grid)
            const offsetX = Math.sin(i * 0.5 + k * 0.3) * 0.08;
            const offsetY = Math.cos(j * 0.5) * 0.08;
            const offsetZ = Math.sin(i * 0.3 + j * 0.5) * 0.08;

            const x = (i - 1) * gridSpacing + offsetX;
            const y = (j - 1) * gridSpacing + offsetY;
            const z = (k - 1) * gridSpacing + offsetZ;

            nodePositions.push({ x, y, z, i, j, k });
          }
        }
      }

      // Create individual command nodes at lattice points
      const nodeMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.85,
        roughness: 0.12,
        emissive: color,
        emissiveIntensity: 0.35
      });

      nodePositions.forEach((pos, idx) => {
        const nodeGeometry = new THREE.OctahedronGeometry(nodeSize, 1);
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        
        node.position.set(pos.x, pos.y, pos.z);
        
        node.userData.isCommandNode = true;
        node.userData.nodeIndex = idx;
        node.userData.basePos = new THREE.Vector3(pos.x, pos.y, pos.z);
        // Random offset for bobbing phase
        node.userData.bobPhase = Math.random() * Math.PI * 2;
        node.userData.visualCoreImmutable = true;
        
        group.add(node);
      });

      // Create asymmetric vector flows between nodes (static geometry, pulse material)
      const flowMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.7,
        roughness: 0.3,
        emissive: color,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.6
      });

      // Connect nodes with asymmetric paths (not all connected)
      for (let i = 0; i < nodePositions.length; i++) {
        const currentPos = nodePositions[i];
        
        // Connect to some neighbors (asymmetrically)
        const neighborIndices = [];
        if (currentPos.i < gridSize - 1) neighborIndices.push(i + gridSize * gridSize); // X direction
        if (currentPos.j < gridSize - 1) neighborIndices.push(i + gridSize); // Y direction
        if (currentPos.k < gridSize - 1) neighborIndices.push(i + 1); // Z direction

        neighborIndices.forEach(neighborIdx => {
          if (neighborIdx < nodePositions.length) {
            const neighborPos = nodePositions[neighborIdx];
            
            // Create thin ribbon/blade connecting nodes (asymmetric)
            const flowVertices = new Float32Array([
              currentPos.x - 0.02, currentPos.y + 0.02, currentPos.z,
              currentPos.x + 0.02, currentPos.y - 0.02, currentPos.z,
              neighborPos.x + 0.02, neighborPos.y - 0.02, neighborPos.z,
              neighborPos.x - 0.02, neighborPos.y + 0.02, neighborPos.z
            ]);

            const flowIndices = new Uint16Array([
              0, 1, 2,
              0, 2, 3
            ]);

            const flowGeometry = new THREE.BufferGeometry();
            flowGeometry.setAttribute('position', new THREE.BufferAttribute(flowVertices, 3));
            flowGeometry.setIndex(flowIndices);
            flowGeometry.computeVertexNormals();

            const flow = new THREE.Mesh(flowGeometry, flowMaterial);
            flow.userData.isFlowLine = true;
            flow.userData.visualCoreImmutable = true;
            flow.userData.isVFX = true;
            group.add(flow);
          }
        });
      }

      // Add central command core (brightest point)
      const centerNode = nodePositions[Math.floor(nodePositions.length / 2)];
      const coreGeometry = new THREE.IcosahedronGeometry(0.15, 1);
      const coreMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.95,
        roughness: 0.05,
        emissive: color,
        emissiveIntensity: 0.55
      });
      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      core.position.set(centerNode.x, centerNode.y, centerNode.z);
      core.userData.isMatrixCore = true;
      group.add(core);

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