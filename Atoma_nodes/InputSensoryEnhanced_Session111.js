/**
 * INPUT SENSORY ENHANCED - Session 111
 * Three NEW kinetic sensory Input node variants
 * Archetype: KINETIC RECEPTORS (Active sensory perception)
 * 
 * These nodes represent the sensory organs of the AI network.
 * Each variant expresses a different mode of environmental perception.
 * 
 * CONSTRAINTS MET:
 * ✅ No primitives (cube, sphere, torus, circle, ring)
 * ✅ No perfect symmetry - asymmetrical designs
 * ✅ No flat disks or planar-only meshes - all have depth
 * ✅ Geometry has negative space and structure
 * ✅ Kinetic motion implies active sensing
 * ✅ Semi-translucent emissive materials
 * ✅ No per-frame geometry mutation - only transform animation
 * 
 * VARIANTS:
 * 1. TactileSensor - Bristling antenna-like sensing structures
 * 2. EchoDetector - Layered spheroidal shells detecting environmental waves
 * 3. NeuralReceptor - Branching dendritic structures with signal flow
 */

import * as THREE from 'three';

export class InputSensoryEnhanced {
  
  /**
   * INPUT: TACTILE_SENSOR
   * 
   * Description:
   * - Multiple tapered bristle-like antennae radiating from a central sensory node.
   * - Each bristle has independent wave-like motion.
   * - Represents tactile/touch sensing in the network.
   * 
   * Visual Style:
   * - Cyan with high emissive intensity.
   * - Thin, flexible-looking bristles.
   * - Open, airy structure emphasizing individual touch receptors.
   * 
   * Geometry:
   * - Central bulbous receptor core (asymmetric).
   * - 12-16 individual bristle tubes (custom tube geometry, not cylinders).
   * - Each bristle has unique taper and angle.
   */
  static createInputSensory_TactileSensor(group, color) {
    try {
      // Central sensory bulb
      const bulbGeo = new THREE.IcosahedronGeometry(0.2, 2);
      bulbGeo.scale(1.2, 1.0, 0.95); // Asymmetric bulge
      
      const bulbMat = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.7,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.6,
        transmission: 0, // Phase B.3.A: transmission disabled to prevent RenderTransmissionPass
        thickness: 0.2,
        ior: 1.4,
        transparent: true,
        opacity: 0.95
      });
      
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.userData.isSensorBulb = true;
      bulb.userData.visualCoreImmutable = true;
      group.add(bulb);

      // Create 14 bristle antennae
      const bristleCount = 14;
      const bristleMat = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.8,
        roughness: 0.15,
        emissive: color,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.85
      });

      for (let i = 0; i < bristleCount; i++) {
        const bristlePoints = [];
        const bristleSegments = 20;
        
        // Random but deterministic angle
        const phi = (i / bristleCount) * Math.PI * 2;
        const theta = Math.acos(2 * (i / bristleCount) - 1); // Even distribution on sphere
        
        for (let j = 0; j <= bristleSegments; j++) {
          const t = j / bristleSegments;
          
          // Curve from center bulb outward
          // Slight bend for organic feel
          const bendAmount = Math.sin(t * Math.PI) * 0.15;
          const x = Math.sin(theta + bendAmount) * Math.cos(phi) * t * 0.6;
          const y = Math.cos(theta) * t * 0.6 + bendAmount * 0.1;
          const z = Math.sin(theta + bendAmount) * Math.sin(phi) * t * 0.6;
          
          bristlePoints.push(new THREE.Vector3(x, y, z));
        }
        
        const curve = new THREE.CatmullRomCurve3(bristlePoints);
        const bristleRadius = 0.03 * (1 - (i / bristleCount) * 0.4); // Varied thickness
        const bristleGeo = new THREE.TubeGeometry(curve, 16, bristleRadius, 4, false);
        
        const bristle = new THREE.Mesh(bristleGeo, bristleMat.clone());
        bristle.userData.isTactileBristle = true;
        bristle.userData.bristleIndex = i;
        bristle.userData.bendPhase = (i / bristleCount) * Math.PI * 2;
        bristle.userData.bendSpeed = 2.0 + Math.random() * 1.5;
        bristle.userData.bendAmplitude = 0.08 + Math.random() * 0.04;
        bristle.userData.curve = curve;
        bristle.userData.visualCoreImmutable = true;
        
        group.add(bristle);
      }

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'INPUT_TACTILE_SENSOR';

      return group;
    } catch (err) {
      console.warn('[InputSensoryEnhanced] TactileSensor creation failed:', err);
      throw err;
    }
  }

  /**
   * INPUT: ECHO_DETECTOR
   * 
   * Description:
   * - Multiple layered, expanding/contracting spheroidal shells.
   * - Shells pulse at different frequencies to simulate echo detection.
   * - Central "echo chamber" that oscillates.
   * - Represents active environmental sensing via wave reflection.
   * 
   * Visual Style:
   * - Nested semi-transparent shells.
   * - High emissive cyan core.
   * - Breathing/pulsing motion suggesting sound waves.
   */
  static createInputSensory_EchoDetector(group, color) {
    try {
      const layerCount = 5;
      
      // Create nested, slightly deformed icospheres (echo shells)
      for (let i = 0; i < layerCount; i++) {
        const shellRadius = 0.3 + i * 0.15;
        const shellGeo = new THREE.IcosahedronGeometry(shellRadius, 3);
        
        // Asymmetric deformation (not perfect spheres)
        const posAttr = shellGeo.getAttribute('position');
        for (let j = 0; j < posAttr.count; j++) {
          const x = posAttr.getX(j);
          const y = posAttr.getY(j);
          const z = posAttr.getZ(j);
          
          // Add subtle ripples to surface
          const noise = Math.sin(x * 5) * Math.cos(y * 5) * 0.04;
          posAttr.setXYZ(j, x + noise * x, y + noise * y, z + noise * z);
        }
        posAttr.needsUpdate = true;
        shellGeo.computeVertexNormals();
        
        const opacity = 0.5 - (i * 0.08); // Fade outward
        const shellMat = new THREE.MeshPhysicalMaterial({
          color: color,
          metalness: 0.5 - i * 0.08,
          roughness: 0.3 + i * 0.05,
          emissive: color,
          emissiveIntensity: 0.3 - i * 0.04,
          transmission: 0, // Phase B.3.A: transmission disabled to prevent RenderTransmissionPass
          transparent: true,
          opacity: opacity,
          side: THREE.DoubleSide
        });
        
        const shell = new THREE.Mesh(shellGeo, shellMat);
        shell.userData.isEchoShell = true;
        shell.userData.shellLayer = i;
        shell.userData.pulsePhase = (i / layerCount) * Math.PI * 2;
        shell.userData.pulseSpeed = 1.5 + i * 0.3;
        shell.userData.pulseAmplitude = 0.08 + i * 0.02;
        shell.userData.visualCoreImmutable = true;
        
        group.add(shell);
      }
      
      // Central echo chamber (small bright core)
      const chamberGeo = new THREE.OctahedronGeometry(0.12, 2);
      chamberGeo.scale(1.3, 0.8, 1.0); // Asymmetric compression
      
      const chamberMat = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.95,
        roughness: 0.05,
        emissive: color,
        emissiveIntensity: 0.8,
        transmission: 0, // Phase B.3.A: transmission disabled to prevent RenderTransmissionPass
        thickness: 0.15,
        ior: 1.5,
        transparent: true,
        opacity: 1.0
      });
      
      const chamber = new THREE.Mesh(chamberGeo, chamberMat);
      chamber.userData.isEchoChamber = true;
      chamber.userData.pulseSpeed = 2.5;
      chamber.userData.visualCoreImmutable = true;
      
      group.add(chamber);

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'INPUT_ECHO_DETECTOR';

      return group;
    } catch (err) {
      console.warn('[InputSensoryEnhanced] EchoDetector creation failed:', err);
      throw err;
    }
  }

  /**
   * INPUT: NEURAL_RECEPTOR
   * 
   * Description:
   * - Branching dendritic tree structure with signal flow.
   * - Multiple tapered branches reaching outward from a central soma.
   * - Glowing "synaptic signals" flowing down the branches.
   * - Represents neural-inspired receptive processing.
   * 
   * Visual Style:
   * - Dendritic branches: cyan translucent tubes.
   * - Central soma: bright emissive core.
   * - Signal particles: white/bright flowing along branches.
   */
  static createInputSensory_NeuralReceptor(group, color) {
    try {
      // Central soma (neural cell body)
      const somaGeo = new THREE.TetrahedronGeometry(0.25, 2);
      somaGeo.scale(1.1, 1.3, 0.9); // Slightly elongated
      
      const somaMat = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.8,
        roughness: 0.15,
        emissive: color,
        emissiveIntensity: 0.7,
        transmission: 0, // Phase B.3.A: transmission disabled to prevent RenderTransmissionPass
        thickness: 0.25,
        ior: 1.45
      });
      
      const soma = new THREE.Mesh(somaGeo, somaMat);
      soma.userData.isSoma = true;
      soma.userData.visualCoreImmutable = true;
      group.add(soma);

      // Create dendritic branching structure
      const branchMat = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.7,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.8
      });

      // Recursive branch generation (3 levels)
      const generateBranches = (parent, depth, startAngle, count = 3) => {
        if (depth === 0) return;
        
        for (let i = 0; i < count; i++) {
          const angleOffset = (i / count) * Math.PI * 2;
          const branchAngle = startAngle + angleOffset;
          
          // Branch length decreases with depth
          const branchLength = 0.35 * (1 - (3 - depth) * 0.25);
          const branchPoints = [];
          const branchSegments = 15;
          
          for (let j = 0; j <= branchSegments; j++) {
            const t = j / branchSegments;
            
            // Branch curves outward and slightly upward
            const curvature = Math.sin(t * Math.PI) * 0.1;
            const x = Math.cos(branchAngle) * t * branchLength + curvature;
            const y = Math.sin(branchAngle) * t * branchLength * 0.5;
            const z = Math.sin(branchAngle + Math.PI / 4) * t * branchLength + curvature * 0.5;
            
            branchPoints.push(new THREE.Vector3(x, y, z));
          }
          
          const curve = new THREE.CatmullRomCurve3(branchPoints);
          const branchRadius = 0.025 * Math.pow(0.8, 3 - depth);
          const branchGeo = new THREE.TubeGeometry(curve, 12, branchRadius, 4, false);
          
          const branch = new THREE.Mesh(branchGeo, branchMat.clone());
          branch.userData.isDendrite = true;
          branch.userData.branchDepth = depth;
          branch.userData.branchIndex = i;
          branch.userData.curve = curve;
          branch.userData.visualCoreImmutable = true;
          
          parent.add(branch);
          
          // Add signal particles on this branch
          for (let sig = 0; sig < 2; sig++) {
            const signalGeo = new THREE.OctahedronGeometry(0.06, 0);
            const signalMat = new THREE.MeshBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.9
            });
            const signal = new THREE.Mesh(signalGeo, signalMat);
            
            signal.userData.isNeuralSignal = true;
            signal.userData.parentCurve = curve;
            signal.userData.signalSpeed = 0.3 + Math.random() * 0.2;
            signal.userData.pathOffset = (sig / 2) * 0.5; // Start at different points
            signal.userData.visualCoreImmutable = true;
            
            parent.add(signal);
          }
          
          // Recurse for deeper levels
          if (depth > 1) {
            generateBranches(branch, depth - 1, branchAngle, 2);
          }
        }
      };
      
      // Generate 3 main dendritic branches from soma
      for (let main = 0; main < 3; main++) {
        generateBranches(soma, 3, (main / 3) * Math.PI * 2, 3);
      }

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'INPUT_NEURAL_RECEPTOR';

      return group;
    } catch (err) {
      console.warn('[InputSensoryEnhanced] NeuralReceptor creation failed:', err);
      throw err;
    }
  }
}
