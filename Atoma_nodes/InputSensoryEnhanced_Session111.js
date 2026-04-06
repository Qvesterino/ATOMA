/**
 * INPUT SENSORY ENHANCED - Session 111
 * Three sensory Input node variants
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
 * 2. EchoDetector - Acoustic anomaly / listening relic
 * 3. NeuralReceptor - Branching dendritic structures with signal flow
 */

import * as THREE from 'three';

const ECHO_DETECTOR_ANOMALY_CACHE = {
  voidShellGeometry: null,
  voidShellEdgesGeometry: null,
  voidKernelGeometry: null,
  voidKernelEdgesGeometry: null,
  crownGeometry: null,
  crownEdgesGeometry: null,
  finGeometry: null,
  finEdgesGeometry: null,
  haloArcGeometries: null,
  particleGeometry: null
};
const ECHO_DETECTOR_ANOMALY_MATERIALS = new Map(); // keyed by color hex

function _buildEchoHaloArcGeometry(radiusX, radiusZ, startAngle, endAngle, yOffset = 0, wobble = 0.0, segments = 48) {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = startAngle + (endAngle - startAngle) * t;
    const bend = Math.sin(angle * 3.1) * wobble;
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * radiusX,
        yOffset + Math.sin(angle * 2.2) * 0.025 + bend,
        Math.sin(angle) * radiusZ
      )
    );
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  geometry.computeBoundingSphere();
  return geometry;
}

function _getEchoDetectorAnomalyGeometries() {
  if (!ECHO_DETECTOR_ANOMALY_CACHE.voidShellGeometry) {
    const voidShellGeometry = new THREE.IcosahedronGeometry(0.24, 1);
    const shellPos = voidShellGeometry.getAttribute('position');
    for (let i = 0; i < shellPos.count; i++) {
      const x = shellPos.getX(i);
      const y = shellPos.getY(i);
      const z = shellPos.getZ(i);
      const asymX = x > 0 ? 0.84 : 1.06;
      const asymY = y > 0 ? 1.16 : 0.92;
      const asymZ = z > 0 ? 0.88 : 1.04;
      const cavityBias = Math.sin((x + z) * 6.0) * 0.014;
      shellPos.setXYZ(
        i,
        x * asymX,
        y * asymY + cavityBias,
        z * asymZ
      );
    }
    shellPos.needsUpdate = true;
    voidShellGeometry.computeVertexNormals();
    voidShellGeometry.computeBoundingSphere();
    ECHO_DETECTOR_ANOMALY_CACHE.voidShellGeometry = voidShellGeometry;
    ECHO_DETECTOR_ANOMALY_CACHE.voidShellEdgesGeometry = new THREE.EdgesGeometry(voidShellGeometry, 12);

    const voidKernelGeometry = new THREE.OctahedronGeometry(0.12, 0);
    const kernelPos = voidKernelGeometry.getAttribute('position');
    for (let i = 0; i < kernelPos.count; i++) {
      const x = kernelPos.getX(i);
      const y = kernelPos.getY(i);
      const z = kernelPos.getZ(i);
      const squeeze = 0.82 + (y > 0 ? 0.08 : -0.04);
      kernelPos.setXYZ(
        i,
        x * (x > 0 ? 0.88 : 1.02),
        y * squeeze,
        z * (z > 0 ? 0.84 : 1.04)
      );
    }
    kernelPos.needsUpdate = true;
    voidKernelGeometry.computeVertexNormals();
    voidKernelGeometry.computeBoundingSphere();
    ECHO_DETECTOR_ANOMALY_CACHE.voidKernelGeometry = voidKernelGeometry;
    ECHO_DETECTOR_ANOMALY_CACHE.voidKernelEdgesGeometry = new THREE.EdgesGeometry(voidKernelGeometry, 10);

    const crownGeometry = new THREE.TetrahedronGeometry(0.16, 0);
    const crownPos = crownGeometry.getAttribute('position');
    for (let i = 0; i < crownPos.count; i++) {
      const x = crownPos.getX(i);
      const y = crownPos.getY(i);
      const z = crownPos.getZ(i);
      const crownBias = y > 0 ? 1.16 : 0.82;
      crownPos.setXYZ(
        i,
        x * (x > 0 ? 1.12 : 0.88),
        y * crownBias,
        z * (z > 0 ? 0.92 : 1.08)
      );
    }
    crownPos.needsUpdate = true;
    crownGeometry.computeVertexNormals();
    crownGeometry.computeBoundingSphere();
    ECHO_DETECTOR_ANOMALY_CACHE.crownGeometry = crownGeometry;
    ECHO_DETECTOR_ANOMALY_CACHE.crownEdgesGeometry = new THREE.EdgesGeometry(crownGeometry, 10);

    const finGeometry = new THREE.CylinderGeometry(0.03, 0.16, 0.88, 4, 1, false);
    const finPos = finGeometry.getAttribute('position');
    for (let i = 0; i < finPos.count; i++) {
      const x = finPos.getX(i);
      const y = finPos.getY(i);
      const z = finPos.getZ(i);
      const taper = 0.76 + (y > 0 ? 0.06 : -0.04);
      finPos.setXYZ(
        i,
        x * (x > 0 ? 1.08 : 0.82),
        y * taper + Math.sin(z * 4.0) * 0.01,
        z * (z > 0 ? 0.88 : 1.06)
      );
    }
    finPos.needsUpdate = true;
    finGeometry.computeVertexNormals();
    finGeometry.computeBoundingSphere();
    ECHO_DETECTOR_ANOMALY_CACHE.finGeometry = finGeometry;
    ECHO_DETECTOR_ANOMALY_CACHE.finEdgesGeometry = new THREE.EdgesGeometry(finGeometry, 9);

    ECHO_DETECTOR_ANOMALY_CACHE.haloArcGeometries = [
      _buildEchoHaloArcGeometry(0.92, 0.68, -0.3, 2.55, 0.1, 0.008, 54),
      _buildEchoHaloArcGeometry(0.82, 0.58, 1.0, 4.35, -0.03, 0.01, 52),
      _buildEchoHaloArcGeometry(1.04, 0.74, 2.55, 5.9, 0.16, 0.012, 58)
    ];

    const particlePositions = [];
    const particleCount = 72;
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const angle = t * Math.PI * 2;
      const radius = 0.74 + 0.26 * Math.sin(i * 0.73);
      particlePositions.push(
        Math.cos(angle) * radius,
        Math.sin(i * 1.17) * 0.28,
        Math.sin(angle) * (0.54 + 0.1 * Math.cos(i * 0.41))
      );
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
    particleGeometry.computeBoundingSphere();
    ECHO_DETECTOR_ANOMALY_CACHE.particleGeometry = particleGeometry;
  }

  return ECHO_DETECTOR_ANOMALY_CACHE;
}

function _getEchoDetectorAnomalyMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0x00ddff;
  if (ECHO_DETECTOR_ANOMALY_MATERIALS.has(colorHex)) {
    return ECHO_DETECTOR_ANOMALY_MATERIALS.get(colorHex);
  }

  const baseColor = new THREE.Color(colorHex);
  const icyWhite = baseColor.clone().lerp(new THREE.Color(0xffffff), 0.36);
  const deepVoid = baseColor.clone().lerp(new THREE.Color(0x02050a), 0.76);
  const ultraviolet = new THREE.Color(0xa68dff);

  const voidShellMat = new THREE.MeshPhysicalMaterial({
    color: deepVoid,
    metalness: 0.72,
    roughness: 0.18,
    emissive: new THREE.Color(0x123d55),
    emissiveIntensity: 0.26,
    transmission: 0,
    thickness: 0.18,
    ior: 1.4,
    transparent: true,
    opacity: 0.84,
    side: THREE.DoubleSide
  });

  const voidKernelMat = new THREE.MeshBasicMaterial({
    color: 0x02060a,
    transparent: true,
    opacity: 0.98
  });

  const crownMat = new THREE.MeshStandardMaterial({
    color: icyWhite,
    metalness: 0.82,
    roughness: 0.12,
    emissive: new THREE.Color(0x66d7ff),
    emissiveIntensity: 0.32,
    transparent: false,
    opacity: 1.0
  });

  const finMat = new THREE.MeshStandardMaterial({
    color: baseColor.clone().lerp(new THREE.Color(0xb9f3ff), 0.44),
    metalness: 0.54,
    roughness: 0.22,
    emissive: new THREE.Color(0x48d7ff),
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  });

  const lineMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0xe8fdff),
    transparent: true,
    opacity: 0.72,
    depthWrite: false
  });

  const fringeLineMat = new THREE.LineBasicMaterial({
    color: ultraviolet,
    transparent: true,
    opacity: 0.24,
    depthWrite: false
  });

  const particleMat = new THREE.PointsMaterial({
    color: new THREE.Color(0xdafcff),
    size: 0.042,
    transparent: true,
    opacity: 0.66,
    depthWrite: false,
    sizeAttenuation: true
  });

  const mats = {
    voidShellMat,
    voidKernelMat,
    crownMat,
    finMat,
    lineMat,
    fringeLineMat,
    particleMat
  };

  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }

  ECHO_DETECTOR_ANOMALY_MATERIALS.set(colorHex, mats);
  return mats;
}

const INPUT_NEURAL_RECEPTOR_CACHE = {
  somaShellGeometry: null,
  somaShellEdgesGeometry: null,
  innerSeedGeometry: null,
  innerSeedEdgesGeometry: null,
  ignitionSparkGeometry: null,
  branchGeometries: null,
  branchCurves: null,
  branchDefs: null,
  tipGeometry: null,
  packetGeometry: null
};
const INPUT_NEURAL_RECEPTOR_MATERIALS = new Map(); // keyed by color hex

function _buildNeuralBranchCurve(startDir, reach, liftBias, bendA, bendB) {
  const start = startDir.clone().multiplyScalar(0.165);
  const tip = startDir.clone().multiplyScalar(0.165 + reach);
  const midA = start.clone()
    .add(startDir.clone().multiplyScalar(reach * 0.24))
    .add(bendA);
  const midB = start.clone()
    .add(startDir.clone().multiplyScalar(reach * 0.67))
    .add(bendB)
    .add(new THREE.Vector3(0, liftBias, 0));

  const curve = new THREE.CatmullRomCurve3([start, midA, midB, tip]);
  curve.curveType = 'catmullrom';
  curve.tension = 0.34;
  return curve;
}

function _getInputNeuralReceptorGeometries() {
  if (!INPUT_NEURAL_RECEPTOR_CACHE.somaShellGeometry) {
    const somaShellGeometry = new THREE.IcosahedronGeometry(0.235, 1);
    const somaPos = somaShellGeometry.getAttribute('position');
    for (let i = 0; i < somaPos.count; i++) {
      const x = somaPos.getX(i);
      const y = somaPos.getY(i);
      const z = somaPos.getZ(i);
      const xBias = x > 0 ? 1.11 : 0.91;
      const yBias = y > 0 ? 1.16 : 0.88;
      const zBias = z > 0 ? 0.94 : 1.05;
      const membraneWarp = Math.sin((x + z) * 6.0) * 0.015 + Math.cos(y * 8.1) * 0.008;
      somaPos.setXYZ(
        i,
        x * xBias + membraneWarp * 0.45,
        y * yBias + membraneWarp * 0.6,
        z * zBias - membraneWarp * 0.3
      );
    }
    somaPos.needsUpdate = true;
    somaShellGeometry.computeVertexNormals();
    somaShellGeometry.computeBoundingSphere();
    INPUT_NEURAL_RECEPTOR_CACHE.somaShellGeometry = somaShellGeometry;
    INPUT_NEURAL_RECEPTOR_CACHE.somaShellEdgesGeometry = new THREE.EdgesGeometry(somaShellGeometry, 11);

    const innerSeedGeometry = new THREE.DodecahedronGeometry(0.112, 0);
    const seedPos = innerSeedGeometry.getAttribute('position');
    for (let i = 0; i < seedPos.count; i++) {
      const x = seedPos.getX(i);
      const y = seedPos.getY(i);
      const z = seedPos.getZ(i);
      const seedWarp = Math.sin((x - z) * 5.4) * 0.01;
      seedPos.setXYZ(
        i,
        x * (x > 0 ? 1.07 : 0.95) + seedWarp,
        y * (y > 0 ? 1.14 : 0.9),
        z * (z > 0 ? 0.96 : 1.05) - seedWarp * 0.55
      );
    }
    seedPos.needsUpdate = true;
    innerSeedGeometry.computeVertexNormals();
    innerSeedGeometry.computeBoundingSphere();
    INPUT_NEURAL_RECEPTOR_CACHE.innerSeedGeometry = innerSeedGeometry;
    INPUT_NEURAL_RECEPTOR_CACHE.innerSeedEdgesGeometry = new THREE.EdgesGeometry(innerSeedGeometry, 10);

    INPUT_NEURAL_RECEPTOR_CACHE.ignitionSparkGeometry = new THREE.IcosahedronGeometry(0.056, 0);
    INPUT_NEURAL_RECEPTOR_CACHE.tipGeometry = new THREE.IcosahedronGeometry(0.034, 0);
    INPUT_NEURAL_RECEPTOR_CACHE.packetGeometry = new THREE.IcosahedronGeometry(0.019, 0);

    const branchDefs = [
      {
        name: 'NeuralBranch_A',
        dir: new THREE.Vector3(0.93, 0.27, -0.18),
        reach: 0.96,
        liftBias: 0.06,
        bendA: new THREE.Vector3(0.06, 0.08, 0.12),
        bendB: new THREE.Vector3(0.12, 0.02, 0.2),
        radius: 0.031,
        signalSpeed: 0.22,
        packets: [0.14, 0.58],
        warmTip: true
      },
      {
        name: 'NeuralBranch_B',
        dir: new THREE.Vector3(-0.74, 0.66, 0.24),
        reach: 0.88,
        liftBias: 0.03,
        bendA: new THREE.Vector3(-0.09, 0.1, 0.04),
        bendB: new THREE.Vector3(-0.16, 0.16, -0.02),
        radius: 0.027,
        signalSpeed: 0.19,
        packets: [0.28, 0.74],
        warmTip: false
      },
      {
        name: 'NeuralBranch_C',
        dir: new THREE.Vector3(0.28, -0.48, 0.84),
        reach: 0.79,
        liftBias: -0.02,
        bendA: new THREE.Vector3(0.06, -0.08, 0.08),
        bendB: new THREE.Vector3(0.1, -0.12, 0.16),
        radius: 0.024,
        signalSpeed: 0.17,
        packets: [0.34],
        warmTip: false
      },
      {
        name: 'NeuralBranch_D',
        dir: new THREE.Vector3(-0.36, 0.18, -0.92),
        reach: 0.98,
        liftBias: 0.04,
        bendA: new THREE.Vector3(-0.06, 0.08, -0.12),
        bendB: new THREE.Vector3(-0.08, 0.12, -0.22),
        radius: 0.029,
        signalSpeed: 0.2,
        packets: [0.16, 0.63],
        warmTip: true
      },
      {
        name: 'NeuralBranch_E',
        dir: new THREE.Vector3(0.58, -0.2, -0.64),
        reach: 0.7,
        liftBias: 0.02,
        bendA: new THREE.Vector3(0.1, 0.04, -0.04),
        bendB: new THREE.Vector3(0.08, 0.1, -0.08),
        radius: 0.021,
        signalSpeed: 0.16,
        packets: [0.42],
        warmTip: false
      },
    {
      name: 'NeuralBranch_F',
      dir: new THREE.Vector3(-0.1, 0.86, -0.5),
      reach: 0.64,
      liftBias: 0.08,
        bendA: new THREE.Vector3(-0.02, 0.12, 0.04),
        bendB: new THREE.Vector3(0.04, 0.16, 0.11),
        radius: 0.019,
        signalSpeed: 0.24,
      packets: [0.22],
      warmTip: false
    }
    ];

    INPUT_NEURAL_RECEPTOR_CACHE.branchDefs = branchDefs;
    INPUT_NEURAL_RECEPTOR_CACHE.branchCurves = branchDefs.map((cfg) => {
      const dir = cfg.dir.clone().normalize();
      return _buildNeuralBranchCurve(dir, cfg.reach, cfg.liftBias, cfg.bendA, cfg.bendB);
    });
    INPUT_NEURAL_RECEPTOR_CACHE.branchGeometries = branchDefs.map((cfg, idx) => {
      const curve = INPUT_NEURAL_RECEPTOR_CACHE.branchCurves[idx];
      const geometry = new THREE.TubeGeometry(curve, 18, cfg.radius, 5, false);
      geometry.computeBoundingSphere();
      return geometry;
    });
  }

  return INPUT_NEURAL_RECEPTOR_CACHE;
}

function _getInputNeuralReceptorMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0x00ddff;
  if (INPUT_NEURAL_RECEPTOR_MATERIALS.has(colorHex)) {
    return INPUT_NEURAL_RECEPTOR_MATERIALS.get(colorHex);
  }

  const baseColor = new THREE.Color(colorHex);
  const icyWhite = baseColor.clone().lerp(new THREE.Color(0xffffff), 0.5);
  const innerCyan = baseColor.clone().lerp(new THREE.Color(0xb2f7ff), 0.28);
  const deepCyan = baseColor.clone().lerp(new THREE.Color(0x1a4f6a), 0.18);
  const ignitionAmber = new THREE.Color(0xffb15d);

  const somaShellMat = new THREE.MeshPhysicalMaterial({
    color: innerCyan,
    metalness: 0.74,
    roughness: 0.15,
    emissive: icyWhite,
    emissiveIntensity: 0.56,
    transmission: 0,
    thickness: 0.19,
    ior: 1.42,
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide
  });

  const innerSeedMat = new THREE.MeshStandardMaterial({
    color: deepCyan,
    metalness: 0.52,
    roughness: 0.2,
    emissive: icyWhite,
    emissiveIntensity: 0.34,
    transparent: true,
    opacity: 0.92
  });

  const branchMat = new THREE.MeshStandardMaterial({
    color: innerCyan.clone().lerp(new THREE.Color(0xeafcff), 0.25),
    metalness: 0.78,
    roughness: 0.18,
    emissive: icyWhite,
    emissiveIntensity: 0.28,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide
  });

  const tipMat = new THREE.MeshPhysicalMaterial({
    color: icyWhite,
    metalness: 0.62,
    roughness: 0.1,
    emissive: new THREE.Color(0x99eaff),
    emissiveIntensity: 0.56,
    transmission: 0,
    thickness: 0.08,
    transparent: true,
    opacity: 0.98
  });

  const packetMat = new THREE.MeshBasicMaterial({
    color: icyWhite,
    transparent: true,
    opacity: 0.95
  });

  const warmSparkMat = new THREE.MeshPhysicalMaterial({
    color: ignitionAmber,
    metalness: 0.28,
    roughness: 0.18,
    emissive: ignitionAmber,
    emissiveIntensity: 0.95,
    transmission: 0,
    thickness: 0.06,
    transparent: true,
    opacity: 0.98
  });

  const lineMat = new THREE.LineBasicMaterial({
    color: icyWhite,
    transparent: true,
    opacity: 0.42,
    depthWrite: false
  });

  const mats = {
    somaShellMat,
    innerSeedMat,
    branchMat,
    tipMat,
    packetMat,
    warmSparkMat,
    lineMat
  };

  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }
  mats.warmSparkMat.userData.ignoreWaveColor = true;

  INPUT_NEURAL_RECEPTOR_MATERIALS.set(colorHex, mats);
  return mats;
}

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
   * - A listening anomaly wrapped in fractured acoustic relic geometry.
   * - Hollow void-core, broken resonance crown, off-axis capture fins.
   * - Interference halos and spectral dust imply reflection without literal shells.
   * - Represents environmental listening as an uncanny ritual object.
   * 
   * Visual Style:
   * - Cyan/white dominant with deep void shadows and a faint ultraviolet fringe.
   * - Asymmetrical, ceremonial, and unsettling at distance.
   * - Near-static: shape and material carry the presence.
   */
  static createInputSensory_EchoDetector(group, color) {
    try {
      const geometries = _getEchoDetectorAnomalyGeometries();
      const materials = _getEchoDetectorAnomalyMaterials(color);

      const root = new THREE.Group();
      root.name = 'INPUT_ECHO_ANOMALY_NODE';
      root.userData.visualVariant = 'INPUT_ECHO_ANOMALY_RELIQUARY_V1';
      root.userData.echoListeningState = 'TOTAL_ACOUSTIC_ANOMALY';

      const voidGroup = new THREE.Group();
      voidGroup.name = 'LISTENING_VOID_GROUP';

      const voidShell = new THREE.Mesh(geometries.voidShellGeometry, materials.voidShellMat);
      voidShell.name = 'ListeningVoidShell';
      voidShell.rotation.set(0.22, -0.18, 0.14);
      voidShell.renderOrder = 2;
      voidShell.userData.isListeningVoid = true;
      voidShell.userData.visualCoreImmutable = true;
      voidGroup.add(voidShell);

      const voidCage = new THREE.LineSegments(geometries.voidShellEdgesGeometry, materials.lineMat);
      voidCage.name = 'ListeningVoidCage';
      voidCage.rotation.copy(voidShell.rotation);
      voidCage.renderOrder = 3;
      voidCage.userData.isListeningVoidCage = true;
      voidGroup.add(voidCage);

      const voidKernel = new THREE.Mesh(geometries.voidKernelGeometry, materials.voidKernelMat);
      voidKernel.name = 'ListeningVoidKernel';
      voidKernel.position.set(-0.015, -0.015, 0.02);
      voidKernel.rotation.set(-0.18, 0.32, -0.04);
      voidKernel.renderOrder = 1;
      voidKernel.userData.isListeningVoidKernel = true;
      voidKernel.userData.visualCoreImmutable = true;
      voidGroup.add(voidKernel);

      root.add(voidGroup);

      const crownGroup = new THREE.Group();
      crownGroup.name = 'RESONANCE_CROWN_GROUP';

      const crownConfigs = [
        { name: 'ResonanceCrown_A', pos: [0.0, 0.28, 0.02], rot: [0.54, 0.16, -0.08], scale: [1.22, 1.06, 0.92] },
        { name: 'ResonanceCrown_B', pos: [-0.16, 0.22, 0.2], rot: [-0.34, -0.58, 0.36], scale: [0.9, 0.92, 0.76] },
        { name: 'ResonanceCrown_C', pos: [0.18, 0.24, -0.2], rot: [0.18, 0.74, -0.42], scale: [0.84, 0.98, 0.82] },
        { name: 'ResonanceCrown_D', pos: [0.02, 0.42, -0.04], rot: [0.92, 0.28, 0.18], scale: [0.68, 0.76, 0.7] }
      ];

      crownConfigs.forEach((cfg, idx) => {
        const shard = new THREE.Mesh(geometries.crownGeometry, materials.crownMat);
        shard.name = cfg.name;
        shard.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        shard.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        shard.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        shard.renderOrder = 4;
        shard.userData.isResonanceShard = true;
        shard.userData.visualCoreImmutable = true;
        crownGroup.add(shard);

        const shardEdges = new THREE.LineSegments(geometries.crownEdgesGeometry, materials.lineMat);
        shardEdges.name = `${cfg.name}_Edges`;
        shardEdges.position.copy(shard.position);
        shardEdges.rotation.copy(shard.rotation);
        shardEdges.scale.copy(shard.scale);
        shardEdges.renderOrder = 5;
        crownGroup.add(shardEdges);
      });

      root.add(crownGroup);

      const finGroup = new THREE.Group();
      finGroup.name = 'PHASE_FIN_GROUP';

      const finConfigs = [
        { name: 'PhaseFin_A', pos: [0.46, -0.02, 0.06], rot: [0.1, 0.74, 0.18], scale: [1.08, 1.14, 0.72] },
        { name: 'PhaseFin_B', pos: [-0.34, -0.06, -0.24], rot: [-0.18, -0.84, -0.28], scale: [0.96, 1.08, 0.62] },
        { name: 'PhaseFin_C', pos: [0.12, 0.06, -0.42], rot: [0.56, 0.24, -0.52], scale: [0.82, 1.24, 0.56] },
        { name: 'PhaseFin_D', pos: [-0.08, -0.2, 0.34], rot: [-0.42, 0.42, 0.36], scale: [0.74, 0.92, 0.52] }
      ];

      finConfigs.forEach((cfg) => {
        const fin = new THREE.Mesh(geometries.finGeometry, materials.finMat);
        fin.name = cfg.name;
        fin.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        fin.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        fin.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        fin.renderOrder = 3;
        fin.userData.isAcousticLobe = true;
        fin.userData.visualCoreImmutable = true;
        finGroup.add(fin);

        const finEdges = new THREE.LineSegments(geometries.finEdgesGeometry, materials.fringeLineMat);
        finEdges.name = `${cfg.name}_Edges`;
        finEdges.position.copy(fin.position);
        finEdges.rotation.copy(fin.rotation);
        finEdges.scale.copy(fin.scale);
        finEdges.renderOrder = 4;
        finGroup.add(finEdges);
      });

      root.add(finGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      geometries.haloArcGeometries.forEach((haloGeo, idx) => {
        const haloMat = idx === 1 ? materials.fringeLineMat : materials.lineMat;
        const halo = new THREE.Line(haloGeo, haloMat);
        halo.name = `InterferenceArc_${idx + 1}`;
        halo.rotation.set(idx === 0 ? 0.62 : idx === 1 ? -0.2 : 1.12, idx * 0.38, idx === 2 ? -0.42 : 0.0);
        halo.position.set(0.0, 0.02 + idx * 0.05, 0.0);
        halo.renderOrder = 6;
        halo.frustumCulled = false;
        auraGroup.add(halo);
      });

      const dust = new THREE.Points(geometries.particleGeometry, materials.particleMat);
      dust.name = 'EchoFieldDust';
      dust.position.set(0.0, 0.04, 0.0);
      dust.frustumCulled = false;
      dust.renderOrder = 7;
      auraGroup.add(dust);

      root.add(auraGroup);

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'INPUT_ECHO_DETECTOR';
      group.userData.visualVariant = 'INPUT_ECHO_ANOMALY_RELIQUARY_V1';
      group.userData.echoListeningState = 'TOTAL_ACOUSTIC_ANOMALY';
      group.userData.visualReady = true;
      root.userData.nodeGeometryName = 'INPUT_ECHO_DETECTOR';
      root.userData.visualReady = true;

      group.add(root);

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
      const geometries = _getInputNeuralReceptorGeometries();
      const materials = _getInputNeuralReceptorMaterials(color);

      group.name = 'INPUT_NEURAL_RECEPTOR_NODE';
      group.userData.visualVariant = 'INPUT_SYNAPTIC_IGNITION_RECEPTOR_V4';
      group.userData.inputVariant = 'SYNAPTIC_IGNITION_RECEPTOR';
      group.userData.neuralVariant = 'SYNAPTIC_IGNITION_RECEPTOR';
      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'INPUT_NEURAL_RECEPTOR';
      group.userData.visualReady = true;

      const soma = new THREE.Mesh(geometries.somaShellGeometry, materials.somaShellMat);
      soma.name = 'NeuralReceptorSoma';
      soma.position.set(0.012, -0.006, 0.0);
      soma.rotation.set(-0.22, 0.32, 0.14);
      soma.renderOrder = 2;
      soma.userData.isSoma = true;
      soma.userData.visualCoreImmutable = true;
      group.add(soma);

      const somaEdges = new THREE.LineSegments(geometries.somaShellEdgesGeometry, materials.lineMat);
      somaEdges.name = 'NeuralReceptorSomaEdges';
      somaEdges.position.copy(soma.position);
      somaEdges.rotation.copy(soma.rotation);
      somaEdges.renderOrder = 3;
      somaEdges.userData.visualCoreImmutable = true;
      group.add(somaEdges);

      const innerSeed = new THREE.Mesh(geometries.innerSeedGeometry, materials.innerSeedMat);
      innerSeed.name = 'NeuralReceptorInnerSeed';
      innerSeed.position.set(-0.01, 0.018, 0.012);
      innerSeed.rotation.set(0.34, -0.28, 0.22);
      innerSeed.scale.set(0.92, 1.06, 0.86);
      innerSeed.renderOrder = 1;
      innerSeed.userData.isSoma = true;
      innerSeed.userData.visualCoreImmutable = true;
      group.add(innerSeed);

      const ignitionSpark = new THREE.Mesh(geometries.ignitionSparkGeometry, materials.warmSparkMat);
      ignitionSpark.name = 'NeuralReceptorIgnitionSpark';
      ignitionSpark.position.set(0.03, 0.0, -0.01);
      ignitionSpark.rotation.set(-0.14, 0.36, -0.08);
      ignitionSpark.scale.set(0.66, 0.74, 0.62);
      ignitionSpark.renderOrder = 4;
      ignitionSpark.userData.isActivationSpark = true;
      ignitionSpark.userData.visualCoreImmutable = true;
      ignitionSpark.userData.ignoreWaveColor = true;
      group.add(ignitionSpark);

      const branchCurves = geometries.branchCurves || [];
      const branchDefs = geometries.branchDefs || [];
      const tipPointScratch = new THREE.Vector3();
      const tipTangentScratch = new THREE.Vector3();
      const forkOriginScratch = new THREE.Vector3();
      const forkMidScratch = new THREE.Vector3();
      const forkEndScratch = new THREE.Vector3();
      const forkSideScratch = new THREE.Vector3();
      const forkUpScratch = new THREE.Vector3(0, 1, 0);
      const forkAltScratch = new THREE.Vector3(1, 0, 0);

      for (let i = 0; i < branchDefs.length; i++) {
        const cfg = branchDefs[i];
        const curve = branchCurves[i];
        const branch = new THREE.Mesh(geometries.branchGeometries[i], materials.branchMat);
        branch.name = cfg.name;
        branch.renderOrder = 5;
        branch.userData.isDendrite = true;
        branch.userData.visualCoreImmutable = true;
        group.add(branch);

        const tipPoint = curve.getPoint(1, tipPointScratch);
        const tipTangent = curve.getTangent(0.98, tipTangentScratch).normalize();
        const tip = new THREE.Mesh(geometries.tipGeometry, cfg.warmTip ? materials.warmSparkMat : materials.tipMat);
        tip.name = `${cfg.name}_Tip`;
        tip.position.copy(tipPoint).addScaledVector(tipTangent, 0.025);
        tip.rotation.set(0.2 + i * 0.18, -0.28 + i * 0.1, 0.14 - i * 0.07);
        tip.scale.set(cfg.warmTip ? 1.18 : 0.94, cfg.warmTip ? 1.14 : 0.92, cfg.warmTip ? 1.08 : 0.88);
        tip.renderOrder = 6;
        tip.userData.isSynapticTip = true;
        tip.userData.visualCoreImmutable = true;
        tip.userData.ignoreWaveColor = !!cfg.warmTip;
        group.add(tip);

        const packetOffsets = cfg.packets || [0.2, 0.64];
        for (let j = 0; j < packetOffsets.length; j++) {
          const packet = new THREE.Mesh(
            geometries.packetGeometry,
            (cfg.warmTip && j === 0) ? materials.warmSparkMat : materials.packetMat
          );
          packet.name = `${cfg.name}_Packet_${j + 1}`;
          packet.userData.isNeuralSignal = true;
          packet.userData.parentCurve = curve;
          packet.userData.pathOffset = packetOffsets[j];
          packet.userData.signalSpeed = cfg.signalSpeed;
          packet.userData.signalPointScratch = new THREE.Vector3();
          packet.userData.visualCoreImmutable = true;
          packet.userData.ignoreWaveColor = !!(cfg.warmTip && j === 0);
          packet.renderOrder = 7;

          curve.getPoint(packet.userData.pathOffset, packet.position);
          const tangent = curve.getTangent(packet.userData.pathOffset, new THREE.Vector3()).normalize();
          packet.position.addScaledVector(tangent, 0.008);
          packet.scale.set(j === 0 && cfg.warmTip ? 1.08 : 0.9, j === 0 && cfg.warmTip ? 1.08 : 0.9, j === 0 && cfg.warmTip ? 1.08 : 0.9);
          group.add(packet);
        }

        const forkOrigin = curve.getPoint(0.87, forkOriginScratch).clone();
        const forkTangent = curve.getTangent(0.93, tipTangentScratch).normalize();
        forkSideScratch.crossVectors(forkTangent, forkUpScratch);
        if (forkSideScratch.lengthSq() < 1e-5) {
          forkSideScratch.crossVectors(forkTangent, forkAltScratch);
        }
        forkSideScratch.normalize();

        const forkRadius = Math.max(cfg.radius * 0.42, 0.01);
        const forkSpread = 0.048 + i * 0.004;
        const forkReach = 0.16 + (cfg.warmTip ? 0.03 : 0.015);
        const forkConfigs = [
          { side: -1, lift: 0.018, twist: -0.02, tipScale: cfg.warmTip ? 0.62 : 0.56, useWarm: cfg.warmTip },
          { side: 1, lift: -0.008, twist: 0.024, tipScale: 0.54, useWarm: false }
        ];

        forkConfigs.forEach((forkCfg, forkIdx) => {
          const forkMid = forkOrigin.clone()
            .addScaledVector(forkTangent, forkReach * 0.42)
            .addScaledVector(forkSideScratch, forkCfg.side * forkSpread * 0.52)
            .addScaledVector(forkUpScratch, forkCfg.lift);
          const forkEnd = forkOrigin.clone()
            .addScaledVector(forkTangent, forkReach)
            .addScaledVector(forkSideScratch, forkCfg.side * forkSpread)
            .addScaledVector(forkUpScratch, forkCfg.lift * 1.45)
            .addScaledVector(forkTangent, forkCfg.twist);

          forkMidScratch.copy(forkMid);
          forkEndScratch.copy(forkEnd);
          const forkCurve = new THREE.CatmullRomCurve3([
            forkOrigin.clone(),
            forkMidScratch.clone(),
            forkEndScratch.clone()
          ]);
          forkCurve.curveType = 'catmullrom';
          forkCurve.tension = 0.28;

          const forkGeo = new THREE.TubeGeometry(forkCurve, 12, forkRadius, 4, false);
          forkGeo.computeBoundingSphere();
          const fork = new THREE.Mesh(forkGeo, materials.branchMat);
          fork.name = `${cfg.name}_Fork_${forkIdx + 1}`;
          fork.renderOrder = 5;
          fork.userData.isDendrite = true;
          fork.userData.isDendriteFork = true;
          fork.userData.visualCoreImmutable = true;
          group.add(fork);

          const forkTip = new THREE.Mesh(geometries.tipGeometry, forkCfg.useWarm ? materials.warmSparkMat : materials.tipMat);
          forkTip.name = `${cfg.name}_Fork_${forkIdx + 1}_Tip`;
          forkTip.position.copy(forkEndScratch).addScaledVector(forkTangent, 0.012);
          forkTip.rotation.set(0.18 + i * 0.1 + forkIdx * 0.07, -0.24 + i * 0.06, 0.12 - forkIdx * 0.05);
          forkTip.scale.set(forkCfg.tipScale, forkCfg.tipScale * 0.96, forkCfg.tipScale * 0.92);
          forkTip.renderOrder = 6;
          forkTip.userData.isSynapticTip = true;
          forkTip.userData.isDendriteForkTip = true;
          forkTip.userData.visualCoreImmutable = true;
          forkTip.userData.ignoreWaveColor = !!forkCfg.useWarm;
          group.add(forkTip);
        });
      }

      const fieldAnchor = new THREE.Mesh(new THREE.OctahedronGeometry(0.027, 0), materials.warmSparkMat);
      fieldAnchor.name = 'NeuralReceptorFieldAnchor';
      fieldAnchor.position.set(-0.05, 0.06, 0.03);
      fieldAnchor.rotation.set(0.42, 0.1, -0.24);
      fieldAnchor.scale.set(1.0, 0.94, 0.88);
      fieldAnchor.renderOrder = 4;
      fieldAnchor.userData.isActivationSpark = true;
      fieldAnchor.userData.visualCoreImmutable = true;
      fieldAnchor.userData.ignoreWaveColor = true;
      group.add(fieldAnchor);

      return group;
    } catch (err) {
      console.warn('[InputSensoryEnhanced] NeuralReceptor creation failed:', err);
      throw err;
    }
  }
}
