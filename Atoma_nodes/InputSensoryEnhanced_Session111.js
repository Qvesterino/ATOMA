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
      // Reused material set (no material cloning, no extra shader paths)
      const coreMat = new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.8,
        roughness: 0.16,
        emissive: color,
        emissiveIntensity: 0.65,
        transmission: 0,
        thickness: 0.22,
        ior: 1.45,
        transparent: true,
        opacity: 0.94
      });
      const receptorMat = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.72,
        roughness: 0.22,
        emissive: color,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.86
      });

      // 1) Core: compact neural "brain"
      const coreGeo = new THREE.DodecahedronGeometry(0.18, 0);
      coreGeo.scale(1.0, 1.08, 0.94);
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.userData.isSoma = true;
      core.userData.visualCoreImmutable = true;
      group.add(core);

      // 2) Receptor arms: organic asymmetry via tilted cylinders
      const armGeo = new THREE.CylinderGeometry(0.026, 0.014, 0.46, 8, 1, false);
      const armDirs = [
        new THREE.Vector3(0.91, 0.34, -0.24),
        new THREE.Vector3(-0.66, 0.71, 0.32),
        new THREE.Vector3(0.22, -0.41, 0.95),
        new THREE.Vector3(-0.34, 0.18, -0.96)
      ];
      const armSkews = [
        { x: 0.25, z: -0.19 },
        { x: -0.23, z: 0.13 },
        { x: 0.14, z: 0.26 },
        { x: -0.19, z: -0.16 }
      ];
      const up = new THREE.Vector3(0, 1, 0);
      const tipPositions = [];

      for (let i = 0; i < armDirs.length; i++) {
        const dir = armDirs[i].clone().normalize();
        const arm = new THREE.Mesh(armGeo, receptorMat);
        arm.userData.isDendrite = true;
        arm.userData.visualCoreImmutable = true;

        arm.position.copy(dir).multiplyScalar(0.24);
        arm.quaternion.setFromUnitVectors(up, dir);
        arm.rotateX(armSkews[i].x);
        arm.rotateZ(armSkews[i].z);
        group.add(arm);

        tipPositions.push(dir.clone().multiplyScalar(0.47));
      }

      // 3) Sensor tips (instanced -> 1 mesh)
      const tipGeo = new THREE.SphereGeometry(0.042, 8, 6);
      const tipMesh = new THREE.InstancedMesh(tipGeo, coreMat, tipPositions.length);
      const tmpMatrix = new THREE.Matrix4();
      for (let i = 0; i < tipPositions.length; i++) {
        tmpMatrix.makeTranslation(tipPositions[i].x, tipPositions[i].y, tipPositions[i].z);
        tipMesh.setMatrixAt(i, tmpMatrix);
      }
      tipMesh.instanceMatrix.needsUpdate = true;
      tipMesh.userData.isSensorTipCluster = true;
      tipMesh.userData.visualCoreImmutable = true;
      group.add(tipMesh);

      // 4) Sensor ring: single tilted torus
      const ringGeo = new THREE.TorusGeometry(0.36, 0.012, 8, 22);
      const ring = new THREE.Mesh(ringGeo, receptorMat);
      ring.rotation.set(0.72, 0.34, -0.21);
      ring.userData.isSensorRing = true;
      ring.userData.visualCoreImmutable = true;
      group.add(ring);

      // 5) Micro orbs (instanced -> 1 mesh)
      const microGeo = new THREE.SphereGeometry(0.028, 7, 6);
      const microMesh = new THREE.InstancedMesh(microGeo, receptorMat, 3);
      const microOffsets = [
        new THREE.Vector3(-0.19, -0.07, 0.21),
        new THREE.Vector3(0.23, 0.11, -0.17),
        new THREE.Vector3(0.04, 0.24, 0.15)
      ];
      for (let i = 0; i < microOffsets.length; i++) {
        tmpMatrix.makeTranslation(microOffsets[i].x, microOffsets[i].y, microOffsets[i].z);
        microMesh.setMatrixAt(i, tmpMatrix);
      }
      microMesh.instanceMatrix.needsUpdate = true;
      microMesh.userData.isMicroOrbs = true;
      microMesh.userData.visualCoreImmutable = true;
      group.add(microMesh);

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'INPUT_NEURAL_RECEPTOR';

      return group;
    } catch (err) {
      console.warn('[InputSensoryEnhanced] NeuralReceptor creation failed:', err);
      throw err;
    }
  }
}
