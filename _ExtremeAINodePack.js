import * as THREE from 'three';

const ABYSSAL_PRESSURE_MONOLITH_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  crownCapGeometry: null,
  crownCapEdgesGeometry: null,
  crownShardGeometry: null,
  crownShardEdgesGeometry: null,
  cavityGeometry: null,
  cavityEdgesGeometry: null,
  probeGeometry: null,
  probeEdgesGeometry: null,
  probeTipGeometry: null,
  haloGeometry: null
};

const ABYSSAL_PRESSURE_MONOLITH_MATERIALS = new Map();

function hashString(str) {
  let hash = 0;
  const input = String(str ?? '');
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function _mythicSeededRng(seed = 1) {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function _distortAbyssalPressureGeometry(geometry, transformFn) {
  const position = geometry?.attributes?.position;
  if (!position) return geometry;

  const scratch = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    scratch.set(position.getX(i), position.getY(i), position.getZ(i));
    transformFn(scratch, i);
    position.setXYZ(i, scratch.x, scratch.y, scratch.z);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function _setAbyssalPressureWaveDefaults(material, ignoreWaveColor = false) {
  material.userData = { ...(material.userData || {}), wavePatchMode: 'DEFAULT' };
  if (ignoreWaveColor) {
    material.userData.ignoreWaveColor = true;
  }
  return material;
}

function _getAbyssalPressureMonolithGeometries() {
  if (!ABYSSAL_PRESSURE_MONOLITH_CACHE.coreGeometry) {
    const coreGeometry = new THREE.CylinderGeometry(0.5, 0.58, 0.86, 6, 1, false);
    _distortAbyssalPressureGeometry(coreGeometry, (v, i) => {
      const topWeight = Math.max(0, (v.y + 0.43) / 0.86);
      const faceBias = Math.max(0, v.x * 1.28 + v.z * 0.54);
      v.x = v.x * (0.9 + topWeight * 0.05) - faceBias * 0.045 + Math.sin(i * 0.11) * 0.002;
      v.y = v.y * (0.94 - faceBias * 0.02) + topWeight * 0.026;
      v.z = v.z * (0.91 + topWeight * 0.05) - v.x * 0.028;
    });
    coreGeometry.scale(1.0, 0.94, 0.95);
    ABYSSAL_PRESSURE_MONOLITH_CACHE.coreGeometry = coreGeometry;
    ABYSSAL_PRESSURE_MONOLITH_CACHE.coreEdgesGeometry = new THREE.EdgesGeometry(coreGeometry, 18);

    const crownCapGeometry = new THREE.CylinderGeometry(0.26, 0.34, 0.13, 6, 1, false);
    _distortAbyssalPressureGeometry(crownCapGeometry, (v, i) => {
      const ridge = Math.max(0, v.y + 0.065);
      const breakBias = Math.max(0, v.x * 1.42 - v.z * 0.34);
      v.x = v.x * (0.88 + ridge * 0.05) - breakBias * 0.04 + Math.sin(i * 0.19) * 0.0015;
      v.y = v.y * (0.96 + ridge * 0.02);
      v.z = v.z * (0.9 + ridge * 0.04) + v.x * 0.02;
    });
    crownCapGeometry.scale(1.0, 0.88, 1.0);
    ABYSSAL_PRESSURE_MONOLITH_CACHE.crownCapGeometry = crownCapGeometry;
    ABYSSAL_PRESSURE_MONOLITH_CACHE.crownCapEdgesGeometry = new THREE.EdgesGeometry(crownCapGeometry, 16);

    const crownShardGeometry = new THREE.CylinderGeometry(0.07, 0.15, 0.34, 5, 1, false);
    crownShardGeometry.translate(0, 0.17, 0);
    _distortAbyssalPressureGeometry(crownShardGeometry, (v, i) => {
      const lean = Math.max(0, v.y / 0.34);
      const fracture = Math.max(0, v.x * 1.24 + v.z * 0.74);
      v.x = v.x * (0.84 + lean * 0.08) + fracture * 0.03 + Math.sin(i * 0.17) * 0.0015;
      v.y = v.y * (0.95 + lean * 0.02);
      v.z = v.z * (0.84 + lean * 0.08) - v.x * 0.022;
    });
    ABYSSAL_PRESSURE_MONOLITH_CACHE.crownShardGeometry = crownShardGeometry;
    ABYSSAL_PRESSURE_MONOLITH_CACHE.crownShardEdgesGeometry = new THREE.EdgesGeometry(crownShardGeometry, 16);

    const cavityGeometry = new THREE.CylinderGeometry(0.18, 0.24, 0.42, 6, 1, true);
    _distortAbyssalPressureGeometry(cavityGeometry, (v, i) => {
      const depthBias = Math.max(0, -v.x * 1.24 + v.y * 0.24);
      v.x = v.x * (0.84 - depthBias * 0.04) + v.z * 0.02 + Math.sin(i * 0.13) * 0.0012;
      v.y = v.y * (0.96 + depthBias * 0.02);
      v.z = v.z * (0.9 + depthBias * 0.05) - v.x * 0.015;
    });
    cavityGeometry.scale(1.0, 0.96, 0.92);
    ABYSSAL_PRESSURE_MONOLITH_CACHE.cavityGeometry = cavityGeometry;
    ABYSSAL_PRESSURE_MONOLITH_CACHE.cavityEdgesGeometry = new THREE.EdgesGeometry(cavityGeometry, 16);

    const probeGeometry = new THREE.CylinderGeometry(0.026, 0.052, 0.42, 5, 1, false);
    probeGeometry.translate(0, 0.21, 0);
    _distortAbyssalPressureGeometry(probeGeometry, (v, i) => {
      const lift = Math.max(0, (v.y + 0.21) / 0.42);
      v.x = v.x * (0.74 + lift * 0.09) + v.z * 0.024 + Math.sin(i * 0.31) * 0.005;
      v.y = v.y * (0.98 + lift * 0.01);
      v.z = v.z * (0.78 + lift * 0.08) - v.x * 0.02;
    });
    ABYSSAL_PRESSURE_MONOLITH_CACHE.probeGeometry = probeGeometry;
    ABYSSAL_PRESSURE_MONOLITH_CACHE.probeEdgesGeometry = new THREE.EdgesGeometry(probeGeometry, 14);

    const probeTipGeometry = new THREE.CylinderGeometry(0.018, 0.034, 0.09, 5, 1, false);
    probeTipGeometry.translate(0, 0.045, 0);
    _distortAbyssalPressureGeometry(probeTipGeometry, (v, i) => {
      const taper = Math.max(0, (v.y + 0.045) / 0.09);
      v.x = v.x * (0.8 + taper * 0.04) + v.z * 0.02 + Math.sin(i * 0.23) * 0.001;
      v.y = v.y * (0.98 + taper * 0.01);
      v.z = v.z * (0.84 + taper * 0.06) - v.x * 0.012;
    });
    ABYSSAL_PRESSURE_MONOLITH_CACHE.probeTipGeometry = probeTipGeometry;

    const haloGeometry = new THREE.TorusGeometry(0.62, 0.02, 5, 24, Math.PI * 1.45);
    ABYSSAL_PRESSURE_MONOLITH_CACHE.haloGeometry = haloGeometry;
  }

  return ABYSSAL_PRESSURE_MONOLITH_CACHE;
}

function _getAbyssalPressureMonolithMaterials(colorHex = 0x6ea0ff) {
  const key = String(colorHex >>> 0);
  if (ABYSSAL_PRESSURE_MONOLITH_MATERIALS.has(key)) {
    return ABYSSAL_PRESSURE_MONOLITH_MATERIALS.get(key);
  }

  const resolvedColor = new THREE.Color(colorHex);

  const coreMat = _setAbyssalPressureWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0x111720,
    emissive: 0x09111a,
    emissiveIntensity: 0.16,
    metalness: 0.68,
    roughness: 0.58,
    flatShading: true
  }));

  const coreEdgeMat = _setAbyssalPressureWaveDefaults(new THREE.LineBasicMaterial({
    color: 0x96a9be,
    transparent: true,
    opacity: 0.34,
    depthWrite: false
  }));

  const crownMat = _setAbyssalPressureWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0x202634,
    emissive: 0x172131,
    emissiveIntensity: 0.14,
    metalness: 0.52,
    roughness: 0.64,
    flatShading: true
  }));

  const crownEdgeMat = _setAbyssalPressureWaveDefaults(new THREE.LineBasicMaterial({
    color: 0xb3c7d9,
    transparent: true,
    opacity: 0.25,
    depthWrite: false
  }));

  const cavityMat = _setAbyssalPressureWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0x05080d,
    emissive: 0x0a121a,
    emissiveIntensity: 0.1,
    metalness: 0.24,
    roughness: 0.88,
    side: THREE.DoubleSide,
    flatShading: true
  }));

  const cavityGlowMat = _setAbyssalPressureWaveDefaults(new THREE.MeshBasicMaterial({
    color: resolvedColor,
    transparent: true,
    opacity: 0.62,
    depthWrite: false
  }), true);

  const cavityEdgeMat = _setAbyssalPressureWaveDefaults(new THREE.LineBasicMaterial({
    color: 0x7f93aa,
    transparent: true,
    opacity: 0.18,
    depthWrite: false
  }));

  const probeMat = _setAbyssalPressureWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0x2a3442,
    emissive: 0x111a27,
    emissiveIntensity: 0.12,
    metalness: 0.46,
    roughness: 0.42,
    flatShading: true
  }));

  const probeEdgeMat = _setAbyssalPressureWaveDefaults(new THREE.LineBasicMaterial({
    color: 0xb9cad8,
    transparent: true,
    opacity: 0.32,
    depthWrite: false
  }));

  const probeTipMat = _setAbyssalPressureWaveDefaults(new THREE.MeshBasicMaterial({
    color: resolvedColor,
    transparent: true,
    opacity: 0.86,
    depthWrite: false
  }), true);

  const haloMat = _setAbyssalPressureWaveDefaults(new THREE.MeshBasicMaterial({
    color: resolvedColor,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    side: THREE.DoubleSide
  }));

  const mats = {
    coreMat,
    coreEdgeMat,
    crownMat,
    crownEdgeMat,
    cavityMat,
    cavityGlowMat,
    cavityEdgeMat,
    probeMat,
    probeEdgeMat,
    probeTipMat,
    haloMat
  };

  ABYSSAL_PRESSURE_MONOLITH_MATERIALS.set(key, mats);
  return mats;
}

/**
 * EXTREME AI NODE PACK 1.0 - ATOMA Edition
 * 
 * 12 extreme visual-only AI node archetypes
 * Fully self-contained, non-destructive, production-ready
 * 
 * STRICT SAFETY RULES MAINTAINED:
 * ✅ NO modifications to AINodes, NodeLinkingSystem, Glyphs, Raycast, main.js
 * ✅ All visuals attach to node.visualGroup only
 * ✅ ALL geometry & materials explicitly disposed
 * ✅ Zero impact on gameplay, linking, selection, metrics, physics
 * ✅ Safe to spawn anytime, even during world transitions
 * ✅ Pure visual-only implementation
 */

export class ExtremeAINodePack {
  constructor() {
    this.archetypeCount = 0;
    console.log('[ExtremeAINodePack] Initialized - 12 archetypes ready');
  }

  /**
   * Apply archetype to node (main entry point)
   * @param {THREE.Object3D} node - AI node to enhance
   * @param {THREE.Scene} scene - Scene reference (optional, for cleanup tracking)
   * @param {number} archetypeId - Specific archetype index (0-11), or random if undefined
   */
  applyArchetype(node, scene, archetypeId) {
    if (!node || !node.visualGroup) {
      console.warn('[ExtremeAINodePack] Invalid node or missing visualGroup');
      return false;
    }

    try {
      // If no ID specified, use random
      if (archetypeId === undefined) {
        archetypeId = Math.floor(Math.random() * 12);
      }

      archetypeId = Math.max(0, Math.min(11, archetypeId));

      const archetypeMethods = [
        this.createHyperbolicPrism.bind(this),
        this.createSingularityKnot.bind(this),
        this.createQuantumLattice.bind(this),
        this.createFractalBloom.bind(this),
        this.createReactiveTesseract.bind(this),
        this.createChaoticHeart.bind(this),
        this.createWhisperSphere.bind(this),
        this.createEchoFractal.bind(this),
        this.createAbyssalShard.bind(this),
        this.createTriHelix.bind(this),
        this.createInfiniteSpiral.bind(this),
        this.createChronoRipper.bind(this)
      ];

      const archetypeGroup = archetypeMethods[archetypeId](node, scene);

      if (archetypeGroup) {
        node.visualGroup.add(archetypeGroup);
        node.userData.extremeArchetype = archetypeId;
        node.userData.extremeAI = true; // Mark for evolution system
        node.userData.extremeArchetypeName = [
          'Hyperbolic Neural Prism',
          'Singularity Knot Node',
          'Quantum Lattice Node',
          'Fractal Bloom Node',
          'Reactive Tesseract',
          'Chaotic Heart',
          'Whisper Sphere',
          'Echo Fractal Node',
          'Abyssal Shard',
          'Tri-Helix Node',
          'Infinite Spiral Node',
          'Chrono Ripper Node'
        ][archetypeId];

        this.archetypeCount++;
        return true;
      }
    } catch (err) {
      console.error('[ExtremeAINodePack] Error applying archetype:', err);
    }

    return false;
  }

  /**
   * ARCHETYPE 1: Hyperbolic Neural Prism
   * Extreme INPUT redesign: Hyperbolic Prism Receiver
   */
  createHyperbolicPrism(node, scene) {
    const group = new THREE.Group();
    group.userData = { archetypeName: 'HyperbolicPrism', animations: [] };

    const baseColor = node?.userData?.color || 0x00ddff;

    // Reused lightweight materials only (no shader classes beyond standard/basic).
    const coreMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      metalness: 0.72,
      roughness: 0.28,
      emissive: baseColor,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.92
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xc9f7ff,
      metalness: 0.6,
      roughness: 0.34,
      emissive: 0x79dfff,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.82
    });
    const accentMat = new THREE.MeshBasicMaterial({
      color: 0xa7f4ff,
      transparent: true,
      opacity: 0.52
    });

    const geometries = [];

    // 1) Central prism core (dominant intake body)
    const prismGeo = new THREE.CylinderGeometry(0.19, 0.135, 0.82, 6, 1, false);
    prismGeo.scale(1.0, 1.0, 0.84);
    geometries.push(prismGeo);
    const prism = new THREE.Mesh(prismGeo, coreMat);
    prism.position.y = 0.02;
    prism.rotation.set(0.06, Math.PI * 0.09, -0.04);
    prism.userData = { isExtremVFX: true, isPrismCore: true };
    group.add(prism);

    // 2) Inner sacred seed (allowed polyhedron used meaningfully as inner reactor)
    const seedGeo = new THREE.IcosahedronGeometry(0.13, 0);
    geometries.push(seedGeo);
    const seed = new THREE.Mesh(seedGeo, accentMat);
    seed.position.set(0.01, 0.08, -0.02);
    seed.rotation.set(-0.2, 0.36, 0.18);
    seed.userData = { isExtremVFX: true, isSeed: true };
    group.add(seed);

    // 3-6) Receptor arms (open angled collectors, not straight rods)
    const armGeo = new THREE.CylinderGeometry(0.028, 0.014, 0.44, 7, 1, false);
    armGeo.translate(0, 0.22, 0); // pivot at root for easier directional placement
    geometries.push(armGeo);
    const armDirs = [
      new THREE.Vector3(0.88, 0.33, -0.22),
      new THREE.Vector3(-0.64, 0.55, 0.52),
      new THREE.Vector3(0.18, 0.44, 0.86),
      new THREE.Vector3(-0.38, 0.26, -0.88)
    ];
    const up = new THREE.Vector3(0, 1, 0);
    const armTwist = [0.24, -0.17, 0.21, -0.23];
    for (let i = 0; i < armDirs.length; i++) {
      const dir = armDirs[i].clone().normalize();
      const arm = new THREE.Mesh(armGeo, frameMat);
      arm.position.copy(dir).multiplyScalar(0.09);
      arm.quaternion.setFromUnitVectors(up, dir);
      arm.rotateZ(armTwist[i]);
      arm.rotateX(armTwist[(i + 1) % armTwist.length] * 0.5);
      arm.userData = { isExtremVFX: true, armIndex: i };
      group.add(arm);
    }

    // 7) Broken/offset orbit frame (partial and tilted, signal capture silhouette)
    const orbitGeo = new THREE.TorusGeometry(0.46, 0.016, 7, 22, Math.PI * 1.55);
    geometries.push(orbitGeo);
    const orbit = new THREE.Mesh(orbitGeo, frameMat);
    orbit.position.set(0.03, 0.04, 0);
    orbit.rotation.set(Math.PI * 0.31, Math.PI * 0.2, -Math.PI * 0.18);
    orbit.userData = { isExtremVFX: true, isOrbitFrame: true };
    group.add(orbit);

    // 8) Subtle base anchor (lightweight stabilizer, not heavy pedestal)
    const baseGeo = new THREE.CylinderGeometry(0.26, 0.33, 0.07, 6, 1, false);
    geometries.push(baseGeo);
    const base = new THREE.Mesh(baseGeo, coreMat);
    base.position.y = -0.35;
    base.rotation.y = Math.PI * 0.12;
    base.userData = { isExtremVFX: true, isAnchor: true };
    group.add(base);

    // Store refs for deterministic disposal
    group.userData.geometries = geometries;
    group.userData.materials = [coreMat, frameMat, accentMat];

    return group;
  }

  /**
   * ARCHETYPE 2: Singularity Knot Node
   * Torus-knot geometry with core collapse pulsing
   */
  createSingularityKnot(node, scene) {
    const group = new THREE.Group();
    group.userData = { archetypeName: 'SingularityKnot', animations: [] };

    // Torus knot base (using torus + rotation for effect)
    const knotCount = 3;
    const materials = [];

    for (let k = 0; k < knotCount; k++) {
      const angle = (k / knotCount) * Math.PI * 2;
      const radius = 0.3 + k * 0.15;

      const torusGeo = new THREE.TorusGeometry(radius, 0.08, 12, 48);
      const torusMat = new THREE.MeshPhongMaterial({
        color: 0xff00ff,
        emissive: 0xff00ff,
        emissiveIntensity: 0.3 + k * 0.15,
        transparent: true,
        opacity: 0.7 - k * 0.1
      });

      const torus = new THREE.Mesh(torusGeo, torusMat);
      torus.rotation.x = Math.random() * Math.PI;
      torus.rotation.y = angle;
      torus.userData = { isExtremVFX: true, knotIndex: k };

      group.add(torus);
      materials.push(torusMat);
      group.userData.geometries = (group.userData.geometries || []).concat([torusGeo]);
    }

    // Central pulsing core
    const coreGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.8
    });

    const core = new THREE.Mesh(coreGeo, coreMat);
    core.userData = { isExtremVFX: true, isPulseCore: true };
    group.add(core);

    materials.push(coreMat);
    group.userData.materials = materials;
    group.userData.geometries.push(coreGeo);

    group.userData.pulsePhase = 0;
    group.userData.pulseSpeed = 1.5;

    return group;
  }

  /**
   * ARCHETYPE 3: Quantum Lattice Node
   * Point lattice with thin connections and micro-glitch
   */
  createQuantumLattice(node, scene) {
    const group = new THREE.Group();
    group.userData = { archetypeName: 'QuantumLattice', animations: [] };

    const geometries = [];
    const materials = [];

    const matCore = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    materials.push(matCore);

    // Base disk
    const baseGeo = new THREE.CylinderGeometry(0.8, 0.85, 0.14, 10, 1);
    geometries.push(baseGeo);
    const base = new THREE.Mesh(baseGeo, matCore);
    base.position.y = -0.35;
    base.rotation.y = Math.PI * 0.1;
    group.add(base);

    // Spine
    const spineGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.9, 12, 1);
    geometries.push(spineGeo);
    const spine = new THREE.Mesh(spineGeo, matCore);
    spine.position.y = 0.05;
    group.add(spine);

    // Core sphere
    const coreGeo = new THREE.SphereGeometry(0.28, 12, 12);
    geometries.push(coreGeo);
    const core = new THREE.Mesh(coreGeo, matCore);
    core.position.y = 0.36;
    core.userData.isExtremVFX = true;
    core.userData.isPulseCore = true;
    group.add(core);

    // Floating lattice nodes (3)
    const nodeGeo = new THREE.IcosahedronGeometry(0.16, 0);
    geometries.push(nodeGeo);
    const nodeOffsets = [
      [0.55, 0.2, 0.0],
      [-0.35, 0.55, -0.25],
      [0.2, 0.4, 0.55]
    ];
    nodeOffsets.forEach(offset => {
      const nodeMesh = new THREE.Mesh(nodeGeo, matCore);
      nodeMesh.position.set(offset[0], offset[1], offset[2]);
      nodeMesh.userData.isExtremVFX = true;
      group.add(nodeMesh);
    });

    // Frame: rectangular torus
    const frameGeo = new THREE.TorusGeometry(0.7, 0.05, 10, 22, Math.PI * 2);
    geometries.push(frameGeo);
    const frame = new THREE.Mesh(frameGeo, matCore);
    frame.scale.set(1.1, 0.75, 1);
    frame.position.y = 0.25;
    frame.rotation.y = Math.PI * 0.28;
    frame.rotation.x = Math.PI * 0.12;
    group.add(frame);

    // Connectors (lines)
    const connectorPoints = [];
    nodeOffsets.forEach(o => {
      connectorPoints.push(new THREE.Vector3(0, 0.36, 0));
      connectorPoints.push(new THREE.Vector3(o[0], o[1], o[2]));
    });
    const lineGeo = new THREE.BufferGeometry().setFromPoints(connectorPoints);
    geometries.push(lineGeo);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.5
    });
    materials.push(lineMat);
    const connectors = new THREE.LineSegments(lineGeo, lineMat);
    connectors.userData.isExtremVFX = true;
    group.add(connectors);

    group.userData.geometries = geometries;
    group.userData.materials = materials;
    group.userData.glitchPhase = Math.random() * Math.PI * 2;
    group.userData.glitchIntensity = 0.02;

    return group;
  }

  /**
   * ARCHETYPE 4: Fractal Bloom Node
   * 3-layer fractal petals with breathing animation
   */
  createFractalBloom(node, scene) {
    const group = new THREE.Group();
    group.userData = { archetypeName: 'FractalBloom', animations: [] };

    const petalCount = 6;
    const layers = 3;
    const baseColors = [0x00ffff, 0x00ffaa, 0x00ff88];
    const geometries = [];
    const materials = [];

    for (let layer = 0; layer < layers; layer++) {
      const scale = 1.0 - layer * 0.3;

      for (let p = 0; p < petalCount; p++) {
        const angle = (p / petalCount) * Math.PI * 2;
        const radius = 0.3 + layer * 0.15;

        const petalGeo = new THREE.IcosahedronGeometry(0.2 * scale, 2);
        const petalMat = new THREE.MeshPhongMaterial({
          color: baseColors[layer % baseColors.length],
          emissive: baseColors[layer % baseColors.length],
          emissiveIntensity: 0.4 - layer * 0.1,
          transparent: true,
          opacity: 0.7 - layer * 0.1
        });

        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.position.x = Math.cos(angle) * radius;
        petal.position.z = Math.sin(angle) * radius;
        petal.position.y = (layer - 1) * 0.2;
        petal.userData = { isExtremVFX: true, layer, petalIndex: p };

        group.add(petal);
        geometries.push(petalGeo);
        materials.push(petalMat);
      }
    }

    group.userData.geometries = geometries;
    group.userData.materials = materials;
    group.userData.breathePhase = Math.random() * Math.PI * 2;
    group.userData.breatheSpeed = 1.0;

    return group;
  }

  /**
   * ARCHETYPE 5: Reactive Tesseract
   * Nested wireframe cubes with reactive outline
   */
  createReactiveTesseract(node, scene) {
    const group = new THREE.Group();
    group.userData = { archetypeName: 'ReactiveTesseract', animations: [] };

    const boxCount = 3;
    const geometries = [];
    const materials = [];

    for (let b = 0; b < boxCount; b++) {
      const scale = 0.3 + b * 0.2;

      const boxGeo = new THREE.BoxGeometry(scale, scale, scale);
      const boxMat = new THREE.MeshBasicMaterial({
        color: [0xff00ff, 0x00ffff, 0xffff00][b % 3],
        wireframe: true,
        transparent: true,
        opacity: 0.8 - b * 0.2,
        linewidth: 2
      });

      const box = new THREE.Mesh(boxGeo, boxMat);
      box.rotation.x = (b / boxCount) * Math.PI * 0.3;
      box.rotation.y = (b / boxCount) * Math.PI * 0.5;
      box.userData = { isExtremVFX: true, boxIndex: b };

      group.add(box);
      geometries.push(boxGeo);
      materials.push(boxMat);
    }

    group.userData.geometries = geometries;
    group.userData.materials = materials;
    group.userData.reactivePhase = 0;
    group.userData.reactiveSpeed = 2.0;

    return group;
  }

  /**
   * ARCHETYPE 6: Chaotic Heart
   * Asymmetric polyhedron with random jitter
   */
  createChaoticHeart(node, scene) {
    const group = new THREE.Group();
    group.userData = { archetypeName: 'ChaoticHeart', animations: [] };

    // Dodecahedron as base asymmetric shape
    const dodecaGeo = new THREE.DodecahedronGeometry(0.35, 0);
    const dodecaMat = new THREE.MeshPhongMaterial({
      color: 0xff0055,
      emissive: 0xff0055,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });

    const dodeca = new THREE.Mesh(dodecaGeo, dodecaMat);
    dodeca.userData = { isExtremVFX: true };
    group.add(dodeca);

    // Add asymmetric spike protrusions
    const spikeGeo = new THREE.ConeGeometry(0.1, 0.3, 8);
    const spikeMat = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 0.6
    });

    for (let s = 0; s < 4; s++) {
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      const angle = (s / 4) * Math.PI * 2;
      const offset = 0.35;

      spike.position.x = Math.cos(angle) * offset;
      spike.position.z = Math.sin(angle) * offset;
      spike.position.y = (Math.random() - 0.5) * 0.3;
      spike.userData = { isExtremVFX: true };

      group.add(spike);
    }

    group.userData.geometries = [dodecaGeo, spikeGeo];
    group.userData.materials = [dodecaMat, spikeMat];
    group.userData.jitterPhase = Math.random() * Math.PI * 2;
    group.userData.jitterAmount = 0.05;

    return group;
  }

  /**
   * ARCHETYPE 7: Whisper Sphere
   * Hollow sphere with rotating internal glyph strips
   */
  createWhisperSphere(node, scene) {
    const group = new THREE.Group();
    group.userData = { archetypeName: 'WhisperSphere', animations: [] };

    // Outer hollow sphere
    const sphereGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.3,
      wireframe: false,
      side: THREE.BackSide
    });

    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.userData = { isExtremVFX: true };
    group.add(sphere);

    // Internal rotating strips (like glyph bands)
    const stripCount = 4;
    const geometries = [sphereGeo];
    const materials = [sphereMat];

    for (let s = 0; s < stripCount; s++) {
      const stripGeo = new THREE.TorusGeometry(0.35, 0.05, 8, 32);
      const stripMat = new THREE.MeshBasicMaterial({
        color: [0xff00ff, 0xffff00, 0x00ffaa, 0xff88ff][s % 4],
        transparent: true,
        opacity: 0.5,
        emissive: [0xff00ff, 0xffff00, 0x00ffaa, 0xff88ff][s % 4],
        emissiveIntensity: 0.4
      });

      const strip = new THREE.Mesh(stripGeo, stripMat);
      strip.rotation.x = (s / stripCount) * Math.PI;
      strip.userData = { isExtremVFX: true, stripIndex: s };

      group.add(strip);
      geometries.push(stripGeo);
      materials.push(stripMat);
    }

    group.userData.geometries = geometries;
    group.userData.materials = materials;
    group.userData.rotateSpeed = 0.5;

    return group;
  }

  /**
   * ARCHETYPE 8: Echo Fractal Node
   * Echoed geometry (scaled clones) with radial expansion waves
   */
  createEchoFractal(node, scene) {
    const group = new THREE.Group();
    group.userData = { archetypeName: 'EchoFractal', animations: [] };

    const baseGeo = new THREE.OctahedronGeometry(0.2, 1);
    const echoLayers = 4;
    const geometries = [];
    const materials = [];

    for (let echo = 0; echo < echoLayers; echo++) {
      const scale = 1.0 + echo * 0.3;
      const echoMat = new THREE.MeshPhongMaterial({
        color: 0x00ffaa,
        emissive: 0x00ffaa,
        emissiveIntensity: 0.5 - echo * 0.1,
        transparent: true,
        opacity: 0.7 - echo * 0.15,
        wireframe: echo % 2 === 0
      });

      const echoMesh = new THREE.Mesh(baseGeo, echoMat);
      echoMesh.scale.setScalar(scale);
      echoMesh.userData = { isExtremVFX: true, echoIndex: echo };

      group.add(echoMesh);
      geometries.push(baseGeo);
      materials.push(echoMat);
    }

    group.userData.geometries = geometries;
    group.userData.materials = materials;
    group.userData.expandPhase = Math.random() * Math.PI * 2;
    group.userData.expandSpeed = 1.2;

    return group;
  }

  /**
   * ARCHETYPE 9: Abyssal Pressure Monolith
   * Legacy public name: Abyssal Shard
   * Compressed core, fractured crown, open cavity, and sparse pressure probes
   */
  createAbyssalShard(node, scene) {
    const root = new THREE.Group();
    root.name = 'EXTREME_ABYSSAL_PRESSURE_MONOLITH_NODE';
    root.userData = {
      archetypeName: 'AbyssalPressureMonolith',
      animations: [],
      visualVariant: 'EXTREME_ABYSSAL_PRESSURE_MONOLITH_V4',
      analyticsVariant: 'ABYSSAL_PRESSURE_MONOLITH',
      nodeGeometryName: 'EXTREME_ABYSSAL_PRESSURE_MONOLITH_V4',
      visualReady: true,
      visualCoreImmutable: true
    };

    const resolvedColorHex = (() => {
      try {
        return new THREE.Color(node?.userData?.color ?? 0x6ea0ff).getHex();
      } catch (err) {
        return new THREE.Color(0x6ea0ff).getHex();
      }
    })();
    const seedSource = node?.userData?.nodeId || node?.userData?.visualCode || resolvedColorHex;
    const rng = _mythicSeededRng(Math.abs(hashString(`411|${seedSource}`)) || 411);
    const geometries = _getAbyssalPressureMonolithGeometries();
    const materials = _getAbyssalPressureMonolithMaterials(resolvedColorHex);
    const uniqueGeometries = new Set();
    const uniqueMaterials = new Set();
    const refs = {
      coreGroup: null,
      crownGroup: null,
      cavityGroup: null,
      probeGroup: null,
      auraGroup: null,
      coreMesh: null,
      coreEdge: null,
      crownPieces: [],
      cavityMesh: null,
      cavityEdge: null,
      cavityGlowMesh: null,
      probes: [],
      pressureHalo: null
    };

    const registerGeometry = (geometry) => {
      if (geometry) uniqueGeometries.add(geometry);
      return geometry;
    };

    const registerMaterial = (material) => {
      if (material) uniqueMaterials.add(material);
      return material;
    };

    const captureBaseTransforms = (object3d) => {
      object3d.userData.basePosition = object3d.position.clone();
      object3d.userData.baseRotation = object3d.rotation.clone();
      object3d.userData.baseScale = object3d.scale.clone();
    };

    const markInteractive = (mesh) => {
      mesh.userData = { ...(mesh.userData || {}), isExtremVFX: true, visualCoreImmutable: true, isInteractive: true };
      mesh.raycast = THREE.Mesh.prototype.raycast;
      return mesh;
    };

    const markAccent = (mesh) => {
      mesh.userData = { ...(mesh.userData || {}), visualCoreImmutable: true, ignoreWaveColor: true };
      mesh.raycast = () => null;
      return mesh;
    };

    const markEdge = (edge) => {
      edge.userData = { ...(edge.userData || {}), visualCoreImmutable: true, isEdgeCage: true };
      edge.raycast = () => null;
      edge.frustumCulled = false;
      return edge;
    };

    const coreGroup = new THREE.Group();
    coreGroup.name = 'CORE_GROUP';
    coreGroup.userData.isAbyssalPressureCoreGroup = true;
    coreGroup.userData.baseRotation = coreGroup.rotation.clone();

    const coreMesh = markInteractive(new THREE.Mesh(registerGeometry(geometries.coreGeometry), registerMaterial(materials.coreMat)));
    coreMesh.name = 'PressureCore';
    coreMesh.position.set(-0.01, -0.03, 0.0);
    coreMesh.rotation.set(0.1, -0.18, 0.05);
    coreMesh.scale.set(0.95, 0.9, 0.93);
    captureBaseTransforms(coreMesh);
    coreMesh.renderOrder = 10;
    coreGroup.add(coreMesh);

    const coreEdge = markEdge(new THREE.LineSegments(registerGeometry(geometries.coreEdgesGeometry), registerMaterial(materials.coreEdgeMat)));
    coreEdge.name = 'PressureCoreEdges';
    coreEdge.position.copy(coreMesh.position);
    coreEdge.rotation.copy(coreMesh.rotation);
    coreEdge.scale.copy(coreMesh.scale);
    coreEdge.renderOrder = 11;
    coreGroup.add(coreEdge);

    refs.coreGroup = coreGroup;
    refs.coreMesh = coreMesh;
    refs.coreEdge = coreEdge;

    const crownGroup = new THREE.Group();
    crownGroup.name = 'CROWN_GROUP';
    crownGroup.userData.isAbyssalPressureCrownGroup = true;
    crownGroup.userData.baseRotation = crownGroup.rotation.clone();

    const crownConfigs = [
      { name: 'CrownCap', pos: [-0.01, 0.27, -0.01], rot: [0.14, -0.18, 0.06], scale: [1.0, 0.96, 0.92] },
      { name: 'CrownShard_A', pos: [-0.15, 0.31, 0.06], rot: [0.42, -0.4, 0.18], scale: [0.94, 1.06, 0.76] },
      { name: 'CrownShard_B', pos: [0.15, 0.34, -0.05], rot: [-0.36, 0.28, -0.24], scale: [0.88, 1.0, 0.72] },
      { name: 'CrownShard_C', pos: [0.03, 0.44, 0.12], rot: [0.72, 0.08, 0.44], scale: [0.76, 1.08, 0.7] }
    ];

    crownConfigs.forEach((cfg, index) => {
      const shard = markInteractive(new THREE.Mesh(registerGeometry(index === 0 ? geometries.crownCapGeometry : geometries.crownShardGeometry), registerMaterial(materials.crownMat)));
      shard.name = cfg.name;
      shard.position.set(cfg.pos[0] + (rng() - 0.5) * 0.03, cfg.pos[1] + (rng() - 0.5) * 0.02, cfg.pos[2] + (rng() - 0.5) * 0.03);
      shard.rotation.set(
        cfg.rot[0] + (rng() - 0.5) * 0.1,
        cfg.rot[1] + (rng() - 0.5) * 0.12,
        cfg.rot[2] + (rng() - 0.5) * 0.1
      );
      shard.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
      captureBaseTransforms(shard);
      shard.renderOrder = 20 + index * 2;
      crownGroup.add(shard);

      const shardEdges = markEdge(new THREE.LineSegments(registerGeometry(index === 0 ? geometries.crownCapEdgesGeometry : geometries.crownShardEdgesGeometry), registerMaterial(materials.crownEdgeMat)));
      shardEdges.name = `${cfg.name}_Edges`;
      shardEdges.position.copy(shard.position);
      shardEdges.rotation.copy(shard.rotation);
      shardEdges.scale.copy(shard.scale);
      shardEdges.renderOrder = 21 + index * 2;
      crownGroup.add(shardEdges);

      shard.userData.edgeRef = shardEdges;
      refs.crownPieces.push(shard);
    });

    refs.crownGroup = crownGroup;

    const cavityGroup = new THREE.Group();
    cavityGroup.name = 'CAVITY_GROUP';
    cavityGroup.userData.isAbyssalPressureCavityGroup = true;
    cavityGroup.userData.baseRotation = cavityGroup.rotation.clone();

    const cavityMesh = markInteractive(new THREE.Mesh(registerGeometry(geometries.cavityGeometry), registerMaterial(materials.cavityMat)));
    cavityMesh.name = 'PressureCavity';
    cavityMesh.position.set(0.18, 0.01, 0.08);
    cavityMesh.rotation.set(-0.2, 0.42, 0.12);
    cavityMesh.scale.set(0.94, 1.0, 0.9);
    captureBaseTransforms(cavityMesh);
    cavityMesh.renderOrder = 30;
    cavityGroup.add(cavityMesh);

    const cavityEdge = markEdge(new THREE.LineSegments(registerGeometry(geometries.cavityEdgesGeometry), registerMaterial(materials.cavityEdgeMat)));
    cavityEdge.name = 'PressureCavityEdges';
    cavityEdge.position.copy(cavityMesh.position);
    cavityEdge.rotation.copy(cavityMesh.rotation);
    cavityEdge.scale.copy(cavityMesh.scale);
    cavityEdge.renderOrder = 31;
    cavityGroup.add(cavityEdge);

    const cavityGlowMesh = markAccent(new THREE.Mesh(registerGeometry(geometries.cavityGeometry), registerMaterial(materials.cavityGlowMat)));
    cavityGlowMesh.name = 'PressureCavityGlow';
    cavityGlowMesh.position.set(0.0, 0.0, -0.03);
    cavityGlowMesh.rotation.set(0.0, 0.0, 0.0);
    cavityGlowMesh.scale.set(0.72, 0.74, 0.68);
    captureBaseTransforms(cavityGlowMesh);
    cavityGlowMesh.renderOrder = 32;
    cavityMesh.add(cavityGlowMesh);

    refs.cavityGroup = cavityGroup;
    refs.cavityMesh = cavityMesh;
    refs.cavityEdge = cavityEdge;
    refs.cavityGlowMesh = cavityGlowMesh;

    const probeGroup = new THREE.Group();
    probeGroup.name = 'PROBE_GROUP';
    probeGroup.userData.isAbyssalPressureProbeGroup = true;
    probeGroup.userData.baseRotation = probeGroup.rotation.clone();

    const probeConfigs = [
      { name: 'Probe_A', pos: [0.36, 0.08, 0.08], rot: [-0.34, 0.58, 0.1], scale: [0.96, 1.02, 0.9] },
      { name: 'Probe_B', pos: [0.16, 0.3, -0.11], rot: [0.52, -0.24, 0.28], scale: [0.8, 0.92, 0.84] },
      { name: 'Probe_C', pos: [0.24, -0.04, 0.16], rot: [0.16, 0.88, -0.18], scale: [0.74, 0.88, 0.8] }
    ];

    probeConfigs.forEach((cfg, index) => {
      const probe = markInteractive(new THREE.Mesh(registerGeometry(geometries.probeGeometry), registerMaterial(materials.probeMat)));
      probe.name = cfg.name;
      probe.position.set(cfg.pos[0] + (rng() - 0.5) * 0.02, cfg.pos[1] + (rng() - 0.5) * 0.02, cfg.pos[2] + (rng() - 0.5) * 0.02);
      probe.rotation.set(
        cfg.rot[0] + (rng() - 0.5) * 0.08,
        cfg.rot[1] + (rng() - 0.5) * 0.1,
        cfg.rot[2] + (rng() - 0.5) * 0.08
      );
      probe.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
      captureBaseTransforms(probe);
      probe.renderOrder = 40 + index * 2;
      probeGroup.add(probe);

      const probeEdge = markEdge(new THREE.LineSegments(registerGeometry(geometries.probeEdgesGeometry), registerMaterial(materials.probeEdgeMat)));
      probeEdge.name = `${cfg.name}_Edges`;
      probeEdge.position.copy(probe.position);
      probeEdge.rotation.copy(probe.rotation);
      probeEdge.scale.copy(probe.scale);
      probeEdge.renderOrder = 41 + index * 2;
      probeGroup.add(probeEdge);

      const probeTip = markAccent(new THREE.Mesh(registerGeometry(geometries.probeTipGeometry), registerMaterial(materials.probeTipMat)));
      probeTip.name = `${cfg.name}_Tip`;
      probeTip.position.set(0.0, 0.22, 0.0);
      probeTip.rotation.set(0.0, 0.0, 0.0);
      probeTip.scale.set(1.0, 0.9, 1.0);
      probe.add(probeTip);

      probe.userData.edgeRef = probeEdge;
      refs.probes.push(probe);
    });

    refs.probeGroup = probeGroup;

    const auraGroup = new THREE.Group();
    auraGroup.name = 'AURA_GROUP';
    auraGroup.userData.isAbyssalPressureAuraGroup = true;
    auraGroup.userData.baseRotation = auraGroup.rotation.clone();

    const pressureHalo = markAccent(new THREE.Mesh(registerGeometry(geometries.haloGeometry), registerMaterial(materials.haloMat)));
    pressureHalo.name = 'PressureHalo';
    pressureHalo.position.set(0.0, 0.02, 0.0);
    pressureHalo.rotation.set(Math.PI * 0.5, 0.24, -0.18);
    pressureHalo.scale.set(1.0, 0.92, 0.86);
    captureBaseTransforms(pressureHalo);
    pressureHalo.renderOrder = 50;
    auraGroup.add(pressureHalo);

    refs.auraGroup = auraGroup;
    refs.pressureHalo = pressureHalo;

    root.add(coreGroup);
    root.add(crownGroup);
    root.add(cavityGroup);
    root.add(probeGroup);
    root.add(auraGroup);

    root.userData.pressureMonolithPhase = rng() * Math.PI * 2;
    root.userData.pressureMonolithTectonicSpeed = 0.005 + rng() * 0.003;
    root.userData.pressureMonolithCompressionSpeed = 0.42 + rng() * 0.08;
    root.userData.pressureMonolithCrownSlipSpeed = 0.018 + rng() * 0.006;
    root.userData.pressureMonolithCavityBreathSpeed = 0.18 + rng() * 0.04;
    root.userData.pressureMonolithProbeDriftSpeed = 0.014 + rng() * 0.004;
    root.userData.pressureMonolithAuraSpeed = 0.01 + rng() * 0.003;
    root.userData.pressureMonolithBaseRotation = root.rotation.clone();
    root.userData.pressureMonolithBaseScale = root.scale.clone();
    root.userData.pressureMonolithRefs = refs;
    root.userData.geometries = Array.from(uniqueGeometries);
    root.userData.materials = Array.from(uniqueMaterials);

    return root;
  }

  /**
   * ARCHETYPE 10: Tri-Helix Node
   * Triple helix twist (DNA-like rotation)
   */
  createTriHelix(node, scene) {
    const group = new THREE.Group();
    group.userData = { archetypeName: 'TriHelix', animations: [] };

    const helixStrands = 3;
    const helixPoints = 12;
    const helixRadius = 0.25;
    const helixHeight = 0.5;
    const geometries = [];
    const materials = [];

    for (let strand = 0; strand < helixStrands; strand++) {
      const points = [];
      const strandPhase = (strand / helixStrands) * Math.PI * 2;

      for (let h = 0; h < helixPoints; h++) {
        const t = (h / helixPoints) * Math.PI * 4;
        const y = (h - helixPoints / 2) * helixHeight / helixPoints;

        const x = Math.cos(t + strandPhase) * helixRadius;
        const z = Math.sin(t + strandPhase) * helixRadius;

        points.push(new THREE.Vector3(x, y, z));

        // Add spheres along helix
        const sphereGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const sphereMat = new THREE.MeshBasicMaterial({
          color: [0xff00ff, 0x00ffff, 0xffff00][strand % 3],
          emissive: [0xff00ff, 0x00ffff, 0xffff00][strand % 3],
          emissiveIntensity: 0.5
        });

        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.copy(points[points.length - 1]);
        sphere.userData = { isExtremVFX: true };

        group.add(sphere);
        geometries.push(sphereGeo);
        materials.push(sphereMat);
      }

      // Connect helix points
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: [0xff00ff, 0x00ffff, 0xffff00][strand % 3],
        transparent: true,
        opacity: 0.7,
        linewidth: 2
      });

      const line = new THREE.Line(lineGeo, lineMat);
      line.userData = { isExtremVFX: true };

      group.add(line);
      geometries.push(lineGeo);
      materials.push(lineMat);
    }

    group.userData.geometries = geometries;
    group.userData.materials = materials;
    group.userData.twistSpeed = 0.8;

    return group;
  }

  /**
   * ARCHETYPE 11: Infinite Spiral Node
   * 3D logarithmic spiral with continuous unfolding + inner timing ring
   * UPGRADED: Added inner timing ring (mostly static) for control = inevitability
   */
  createInfiniteSpiral(node, scene) {
    const group = new THREE.Group();
    group.userData = { archetypeName: 'InfiniteSpiral', animations: [] };

    const spiralTurns = 3;
    const spiralPoints = 60;
    const points = [];
    const geometries = [];
    const materials = [];

    for (let i = 0; i < spiralPoints; i++) {
      const t = (i / spiralPoints) * Math.PI * 2 * spiralTurns;
      const r = 0.1 + (i / spiralPoints) * 0.3; // Logarithmic spiral expansion
      const y = (i - spiralPoints / 2) * 0.4 / spiralPoints;

      const x = Math.cos(t) * r;
      const z = Math.sin(t) * r;

      points.push(new THREE.Vector3(x, y, z));

      // Add small nodes along spiral
      if (i % 6 === 0) {
        const nodeGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const nodeMat = new THREE.MeshBasicMaterial({
          color: 0x00ffaa,
          emissive: 0x00ffaa,
          emissiveIntensity: 0.6
        });

        const node3d = new THREE.Mesh(nodeGeo, nodeMat);
        node3d.position.copy(points[points.length - 1]);
        node3d.userData = { isExtremVFX: true };

        group.add(node3d);
        geometries.push(nodeGeo);
        materials.push(nodeMat);
      }
    }

    // Draw spiral line
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    });

    const line = new THREE.Line(lineGeo, lineMat);
    line.userData = { isExtremVFX: true };

    group.add(line);
    geometries.push(lineGeo);
    materials.push(lineMat);

    // POLISH: Inner timing ring (mostly static, very subtle rotation)
    const timingRingGeo = new THREE.TorusGeometry(0.25, 0.04, 8, 64);
    const timingRingMat = new THREE.MeshBasicMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.5,
      emissive: 0x00ffaa,
      emissiveIntensity: 0.3
    });
    const timingRing = new THREE.Mesh(timingRingGeo, timingRingMat);
    timingRing.rotation.x = Math.PI / 3;
    timingRing.userData = { isExtremVFX: true, isTimingRing: true };
    group.add(timingRing);
    geometries.push(timingRingGeo);
    materials.push(timingRingMat);

    group.userData.geometries = geometries;
    group.userData.materials = materials;
    group.userData.unfoldSpeed = 0.6;
    group.userData.spiralRotationSpeed = 0.15; // Slowed down spiral rotation

    return group;
  }

  /**
   * ARCHETYPE 12: Chrono Ripper Node
   * 3 floating geometry fragments with time-glitch pulsing + inner axis rod
   * UPGRADED: Added central axis rod (static) for control/inevitability feel
   */
  createChronoRipper(node, scene) {
    const group = new THREE.Group();
    group.userData = { archetypeName: 'ChronoRipper', animations: [] };

    const fragmentCount = 3;
    const geometries = [];
    const materials = [];

    for (let f = 0; f < fragmentCount; f++) {
      const angle = (f / fragmentCount) * Math.PI * 2;
      const distance = 0.25;

      // Create fragment geometry (box)
      const fragGeo = new THREE.BoxGeometry(0.15, 0.25, 0.1);
      const fragMat = new THREE.MeshPhongMaterial({
        color: [0xff00ff, 0x00ffff, 0xff0088][f % 3],
        emissive: [0xff00ff, 0x00ffff, 0xff0088][f % 3],
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.8,
        wireframe: false
      });

      const fragment = new THREE.Mesh(fragGeo, fragMat);
      fragment.position.x = Math.cos(angle) * distance;
      fragment.position.z = Math.sin(angle) * distance;
      fragment.rotation.x = Math.random() * Math.PI;
      fragment.rotation.y = Math.random() * Math.PI;
      fragment.userData = { isExtremVFX: true, fragmentIndex: f };

      group.add(fragment);
      geometries.push(fragGeo);
      materials.push(fragMat);
    }

    // Central glitch point
    const glitchGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const glitchMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.5
    });

    const glitch = new THREE.Mesh(glitchGeo, glitchMat);
    glitch.userData = { isExtremVFX: true, isGlitch: true };

    group.add(glitch);
    geometries.push(glitchGeo);
    materials.push(glitchMat);

    // POLISH: Central axis rod (static, thin, slightly emissive - inevitability axis)
    const axisRodGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
    const axisRodMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xffffff,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.6
    });
    const axisRod = new THREE.Mesh(axisRodGeo, axisRodMat);
    axisRod.userData = { isExtremVFX: true, isAxisRod: true };
    group.add(axisRod);
    geometries.push(axisRodGeo);
    materials.push(axisRodMat);

    group.userData.geometries = geometries;
    group.userData.materials = materials;
    group.userData.glitchPhase = Math.random() * Math.PI * 2;
    group.userData.glitchIntensity = 0.15;
    group.userData.fragmentOrbit = true;
    group.userData.fragmentOrbitSlowness = 1.5; // Slowed orbital motion

    return group;
  }

  /**
   * Dispose all geometry and materials for a node archetype
   * (Called automatically by ATOMA cleanup system when node is removed)
   */
  static disposeArchetype(group) {
    if (!group || !group.userData) return;

    // Dispose geometries
    if (group.userData.geometries) {
      group.userData.geometries.forEach(geo => {
        if (geo && geo.dispose) geo.dispose();
      });
    }

    // Dispose materials
    if (group.userData.materials) {
      group.userData.materials.forEach(mat => {
        if (mat && mat.dispose) mat.dispose();
      });
    }

    // Traverse and dispose all children
    group.traverse(child => {
      if (child.geometry && child.geometry.dispose) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose && m.dispose());
        } else {
          child.material.dispose && child.material.dispose();
        }
      }
    });
  }

  /**
   * Get debug statistics
   */
  getStats() {
    return {
      archetypesApplied: this.archetypeCount,
      archetypeNames: [
        'Hyperbolic Neural Prism',
        'Singularity Knot Node',
        'Quantum Lattice Node',
        'Fractal Bloom Node',
        'Reactive Tesseract',
        'Chaotic Heart',
        'Whisper Sphere',
        'Echo Fractal Node',
        'Abyssal Shard',
        'Tri-Helix Node',
        'Infinite Spiral Node',
        'Chrono Ripper Node'
      ]
    };
  }
}

/**
 * INTEGRATION INSTRUCTIONS FOR main.js
 * 
 * STEP 1: Add import at top of main.js (around line 75, after other imports)
 * ────────────────────────────────────────────────────────────────────────
 * import { ExtremeAINodePack } from './_ExtremeAINodePack.js';
 * 
 * 
 * STEP 2: Add field in Game class (around line 270, in field declarations)
 * ────────────────────────────────────────────────────────────────────────
 * this.extremeAINodePack = null;
 * 
 * 
 * STEP 3: Initialize in setup/constructor (after AINodes initialized)
 * ────────────────────────────────────────────────────────────────────
 * this.extremeAINodePack = new ExtremeAINodePack();
 * 
 * 
 * STEP 4: Apply to nodes when spawning (modify spawnNode or equivalent)
 * ─────────────────────────────────────────────────────────────────────
 * if (this.extremeAINodePack && Math.random() < 0.2) {  // 20% spawn rate
 *   this.extremeAINodePack.applyArchetype(newNode, this.scene);
 * }
 * 
 * 
 * OPTIONAL: Add animation update in animate() loop (after all node updates)
 * ─────────────────────────────────────────────────────────────────────────
 * // Update extreme archetype animations
 * if (this.aiNodes && this.extremeAINodePack) {
 *   this.aiNodes.nodes.forEach(node => {
 *     if (node.userData.extremeArchetype !== undefined && node.visualGroup) {
 *       const archetype = node.userData.extremeArchetype;
 *       
 *       node.visualGroup.traverse(child => {
 *         if (!child.userData.isExtremVFX) return;
 *         
 *         // Rotation animations
 *         if (archetype === 0) { // Hyperbolic Prism
 *           child.rotation.x += 0.005;
 *           child.rotation.y += 0.008;
 *         } else if (archetype === 1) { // Singularity Knot
 *           if (child.userData.isPulseCore) {
 *             const scale = 1 + Math.sin(this.time * 2) * 0.2;
 *             child.scale.setScalar(scale);
 *           }
 *           child.rotation.y += 0.01;
 *         } else if (archetype === 2) { // Quantum Lattice
 *           child.rotation.x += 0.003;
 *           child.rotation.y += 0.005;
 *         } else if (archetype === 3) { // Fractal Bloom
 *           child.rotation.z += 0.006;
 *         } else if (archetype === 4) { // Reactive Tesseract
 *           child.rotation.x += 0.004;
 *           child.rotation.y += 0.006;
 *         } else if (archetype === 5) { // Chaotic Heart
 *           const jitter = Math.sin(this.time * 3) * 0.02;
 *           child.position.x += jitter;
 *         } else if (archetype === 6) { // Whisper Sphere
 *           if (child.userData.stripIndex !== undefined) {
 *             child.rotation.z += 0.008;
 *           }
 *         } else if (archetype === 7) { // Echo Fractal
 *           child.rotation.x += 0.005;
 *         } else if (archetype === 8) { // Abyssal Shard
 *           child.rotation.x += 0.003;
 *           child.rotation.y += 0.002;
 *         } else if (archetype === 9) { // Tri-Helix
 *           child.rotation.z += 0.012;
 *         } else if (archetype === 10) { // Infinite Spiral
 *           child.rotation.y += 0.006;
 *         } else if (archetype === 11) { // Chrono Ripper
 *           if (child.userData.fragmentIndex !== undefined) {
 *             const angle = this.time * 1.5 + child.userData.fragmentIndex * Math.PI * 2 / 3;
 *             child.position.x = Math.cos(angle) * 0.25;
 *             child.position.z = Math.sin(angle) * 0.25;
 *           }
 *         }
 *       });
 *     }
 *   });
 * }
 * 
 * 
 * OPTIONAL: Add cleanup when nodes are removed
 * ──────────────────────────────────────────────
 * Before removing node from scene, call:
 * ExtremeAINodePack.disposeArchetype(node.visualGroup);
 */
