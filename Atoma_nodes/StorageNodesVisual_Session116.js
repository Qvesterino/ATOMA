import * as THREE from 'three';

const STORAGE_ARCHIVE_RESONATOR_DRUM_V2_CACHE = {
  coreGeometry: null,
  coreSeamGeometry: null,
  coreVoidGeometry: null,
  coreSeedGeometry: null,
  drumBodyGeometry: null,
  drumShoulderGeometry: null,
  shellBandGeometryA: null,
  shellBandGeometryB: null,
  shellBandGeometryC: null,
  lockCollarGeometry: null,
  lockGateGeometry: null,
  indexGeometry: null,
  channelRailGeometry: null,
  seamGeometry: null,
  supportShellGeometry: null,
  dustGeometry: null,
  haloGeometry: null
};

const STORAGE_ARCHIVE_RESONATOR_DRUM_V2_MATERIALS = new Map();

function hashString(str) {
  let hash = 0;
  const input = String(str ?? '');
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
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

function _resolveArchiveResonatorDrumColor(group, visualCodeOrColor, maybeColor, fallback = 0xd79c54) {
  const legacyColor = typeof group?.userData?.color === 'number' ? group.userData.color : undefined;
  if (typeof maybeColor === 'number') {
    return maybeColor;
  }

  if (typeof visualCodeOrColor === 'number' && visualCodeOrColor > 0x1ff) {
    return visualCodeOrColor;
  }

  return legacyColor ?? fallback;
}

function _setArchiveResonatorDrumWaveDefaults(material, ignoreWaveColor = false) {
  material.userData = {
    ...(material.userData || {}),
    wavePatchMode: 'DEFAULT'
  };

  if (ignoreWaveColor) {
    material.userData.ignoreWaveColor = true;
  }

  return material;
}

function _getArchiveResonatorDrumRenderOrders() {
  const api = globalThis?.EnhancedNodeModels;
  return {
    coreOrder: api && typeof api._getCoreRenderOrder === 'function' ? api._getCoreRenderOrder() : 1000,
    archOrder: api && typeof api._getArchetypeRenderOrder === 'function' ? api._getArchetypeRenderOrder() : 1010
  };
}

function _getArchiveResonatorDrumGeometries() {
  if (!STORAGE_ARCHIVE_RESONATOR_DRUM_V2_CACHE.coreGeometry) {
    const coreGeometry = new THREE.CylinderGeometry(0.18, 0.2, 0.28, 6, 1, false);
    coreGeometry.rotateX(Math.PI / 2);

    const coreSeamGeometry = new THREE.TorusGeometry(0.145, 0.015, 6, 16, Math.PI * 1.62);
    const coreVoidGeometry = new THREE.TorusGeometry(0.104, 0.012, 6, 14, Math.PI * 1.36);
    const coreSeedGeometry = new THREE.DodecahedronGeometry(0.055, 0);

    const drumBodyGeometry = new THREE.CylinderGeometry(0.58, 0.66, 0.96, 10, 1, false);
    drumBodyGeometry.rotateX(Math.PI / 2);

    const drumShoulderGeometry = new THREE.CylinderGeometry(0.64, 0.58, 0.12, 10, 1, false);
    drumShoulderGeometry.rotateX(Math.PI / 2);

    const shellBandGeometryA = new THREE.TorusGeometry(0.67, 0.052, 8, 18, Math.PI * 1.64);
    const shellBandGeometryB = new THREE.TorusGeometry(0.62, 0.048, 8, 16, Math.PI * 1.34);
    const shellBandGeometryC = new THREE.TorusGeometry(0.71, 0.04, 8, 14, Math.PI * 1.1);

    const lockCollarGeometry = new THREE.TorusGeometry(0.77, 0.09, 10, 24, Math.PI * 1.98);
    const lockGateGeometry = new THREE.BoxGeometry(0.14, 0.78, 0.12);
    const indexGeometry = new THREE.BoxGeometry(0.05, 0.14, 0.04);

    const channelRailGeometry = new THREE.BoxGeometry(0.06, 0.12, 0.72);
    const seamGeometry = new THREE.BoxGeometry(0.56, 0.035, 0.06);
    const supportShellGeometry = new THREE.OctahedronGeometry(0.06, 0);

    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(18 * 3);
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const radius = 0.58 + ((i % 3) * 0.04);
      dustPositions[i * 3 + 0] = Math.cos(angle) * radius;
      dustPositions[i * 3 + 1] = Math.sin(angle * 0.5) * 0.12;
      dustPositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

    const haloGeometry = new THREE.TorusGeometry(0.83, 0.015, 6, 18, Math.PI * 1.18);

    STORAGE_ARCHIVE_RESONATOR_DRUM_V2_CACHE.coreGeometry = coreGeometry;
    STORAGE_ARCHIVE_RESONATOR_DRUM_V2_CACHE.coreSeamGeometry = coreSeamGeometry;
    STORAGE_ARCHIVE_RESONATOR_DRUM_V2_CACHE.coreVoidGeometry = coreVoidGeometry;
    STORAGE_ARCHIVE_RESONATOR_DRUM_V2_CACHE.coreSeedGeometry = coreSeedGeometry;
    STORAGE_ARCHIVE_RESONATOR_DRUM_V2_CACHE.drumBodyGeometry = drumBodyGeometry;
    STORAGE_ARCHIVE_RESONATOR_DRUM_V2_CACHE.drumShoulderGeometry = drumShoulderGeometry;
    STORAGE_ARCHIVE_RESONATOR_DRUM_V2_CACHE.shellBandGeometryA = shellBandGeometryA;
    STORAGE_ARCHIVE_RESONATOR_DRUM_V2_CACHE.shellBandGeometryB = shellBandGeometryB;
    STORAGE_ARCHIVE_RESONATOR_DRUM_V2_CACHE.shellBandGeometryC = shellBandGeometryC;
    STORAGE_ARCHIVE_RESONATOR_DRUM_V2_CACHE.lockCollarGeometry = lockCollarGeometry;
    STORAGE_ARCHIVE_RESONATOR_DRUM_V2_CACHE.lockGateGeometry = lockGateGeometry;
    STORAGE_ARCHIVE_RESONATOR_DRUM_V2_CACHE.indexGeometry = indexGeometry;
    STORAGE_ARCHIVE_RESONATOR_DRUM_V2_CACHE.channelRailGeometry = channelRailGeometry;
    STORAGE_ARCHIVE_RESONATOR_DRUM_V2_CACHE.seamGeometry = seamGeometry;
    STORAGE_ARCHIVE_RESONATOR_DRUM_V2_CACHE.supportShellGeometry = supportShellGeometry;
    STORAGE_ARCHIVE_RESONATOR_DRUM_V2_CACHE.dustGeometry = dustGeometry;
    STORAGE_ARCHIVE_RESONATOR_DRUM_V2_CACHE.haloGeometry = haloGeometry;
  }

  return STORAGE_ARCHIVE_RESONATOR_DRUM_V2_CACHE;
}

function _getArchiveResonatorDrumMaterials(colorHex = 0xd79c54) {
  const key = String(colorHex >>> 0);
  if (STORAGE_ARCHIVE_RESONATOR_DRUM_V2_MATERIALS.has(key)) {
    return STORAGE_ARCHIVE_RESONATOR_DRUM_V2_MATERIALS.get(key);
  }

  const archiveColor = new THREE.Color(colorHex);
  const warmColor = archiveColor.clone().lerp(new THREE.Color(0xffc27a), 0.34);
  const deepWarm = archiveColor.clone().lerp(new THREE.Color(0x5e4024), 0.44);
  const coldSteel = new THREE.Color(0x314355);

  const coreMat = _setArchiveResonatorDrumWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0x10161f,
    emissive: 0x0a1118,
    emissiveIntensity: 0.16,
    metalness: 0.5,
    roughness: 0.74,
    flatShading: true
  }));

  const coreSeamMat = _setArchiveResonatorDrumWaveDefaults(new THREE.MeshStandardMaterial({
    color: deepWarm,
    emissive: warmColor.clone(),
    emissiveIntensity: 0.42,
    metalness: 0.18,
    roughness: 0.32,
    transparent: true,
    opacity: 0.78,
    side: THREE.DoubleSide,
    flatShading: true
  }));

  const bodyMat = _setArchiveResonatorDrumWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0x1a212b,
    emissive: 0x0d131a,
    emissiveIntensity: 0.1,
    metalness: 0.58,
    roughness: 0.64,
    flatShading: true
  }));

  const bodyBandMat = _setArchiveResonatorDrumWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0x2b313b,
    emissive: 0x17202a,
    emissiveIntensity: 0.12,
    metalness: 0.36,
    roughness: 0.54,
    transparent: true,
    opacity: 0.92,
    flatShading: true
  }));

  const bodyBandAltMat = _setArchiveResonatorDrumWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0x352720,
    emissive: deepWarm,
    emissiveIntensity: 0.18,
    metalness: 0.38,
    roughness: 0.42,
    transparent: true,
    opacity: 0.84,
    flatShading: true
  }));

  const lockMat = _setArchiveResonatorDrumWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0x64492e,
    emissive: warmColor.clone(),
    emissiveIntensity: 0.48,
    metalness: 0.68,
    roughness: 0.24,
    flatShading: true
  }));

  const lockAccentMat = _setArchiveResonatorDrumWaveDefaults(new THREE.MeshStandardMaterial({
    color: warmColor.clone(),
    emissive: warmColor.clone(),
    emissiveIntensity: 0.7,
    metalness: 0.28,
    roughness: 0.16,
    transparent: true,
    opacity: 0.82,
    flatShading: true
  }), true);

  const channelMat = _setArchiveResonatorDrumWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0x223243,
    emissive: coldSteel.clone().multiplyScalar(0.45),
    emissiveIntensity: 0.18,
    metalness: 0.28,
    roughness: 0.5,
    flatShading: true
  }));

  const seamMat = _setArchiveResonatorDrumWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0x202833,
    emissive: 0x3a4b5d,
    emissiveIntensity: 0.12,
    transparent: true,
    opacity: 0.58,
    metalness: 0.22,
    roughness: 0.42,
    flatShading: true
  }));

  const supportMat = _setArchiveResonatorDrumWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0x2c333d,
    emissive: 0x101820,
    emissiveIntensity: 0.08,
    transparent: true,
    opacity: 0.44,
    metalness: 0.14,
    roughness: 0.72,
    flatShading: true
  }));

  const haloMat = _setArchiveResonatorDrumWaveDefaults(new THREE.MeshStandardMaterial({
    color: warmColor.clone().multiplyScalar(0.8),
    emissive: warmColor.clone(),
    emissiveIntensity: 0.18,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    metalness: 0.0,
    roughness: 0.4,
    flatShading: true
  }));

  const dustMat = _setArchiveResonatorDrumWaveDefaults(new THREE.PointsMaterial({
    color: warmColor.clone().lerp(coldSteel, 0.18),
    size: 0.028,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    sizeAttenuation: true
  }));

  const mats = {
    coreMat,
    coreSeamMat,
    bodyMat,
    bodyBandMat,
    bodyBandAltMat,
    lockMat,
    lockAccentMat,
    channelMat,
    seamMat,
    supportMat,
    haloMat,
    dustMat
  };

  STORAGE_ARCHIVE_RESONATOR_DRUM_V2_MATERIALS.set(key, mats);
  return mats;
}

/**
 * STORAGE Node Visual Designs (Session 116)
 * ============================================================================
 * Three visual-only STORAGE nodes representing memory, accumulation, preservation.
 * 
 * DESIGN PHILOSOPHY:
 * - Heavy, calm, stable presence
 * - Quietly intelligent (not aggressive)
 * - Memory feels tangible and grounded
 * - Motion is subtle and patient (10-30 second cycles)
 * - No spheres, no UI symbols, no mechanical aggression
 * 
 * NODES:
 * 1. OBELISK CACHE - Memory Monolith, seeded with cyan glow
 * 2. FRACTAL RESERVOIR - Crystallized Memory, shimmering violet veins
 * 3. ARCHIVE DRUM - Mechanical Archive, slow rotating rings
 */

export class StorageNodesVisual {

  /**
   * OBELISK CACHE - Memory Monolith / Data Vault
   * 
   * ARCHETYPE: Tall irregular obelisk, data stored in deep seams
   * 
   * GEOMETRY:
   * - Tall asymmetric structure (height ~1.4x width)
   * - 4-6 non-uniform vertical plates
   * - Slightly chipped/fractured top
   * - Deep seams between plates filled with translucent material
   * - Grounded, heavy base
   * 
   * MATERIALS:
   * - Dark ceramic/obsidian (0.1, 0.08, 0.15)
   * - Matte surface (metalness 0.3, roughness 0.7)
   * - Inner seams: translucent cyan material
   * 
   * EMISSIVE:
   * - Soft cyan glow from interior seams
   * - Depth-layered (light appears to come from inside)
   * - Breathing cycle 10-15 seconds
   * 
   * MOTION:
   * - Almost static
   * - Very slow internal light breathing
   * - Micro-settling of plates (barely visible)
   */
  static createObeliskCache(group, color = 0x00ff88) {
    try {
      // Base material (dark ceramic)
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x1a1a2e),  // Dark blue-black
        metalness: 0.3,
        roughness: 0.7,
        emissive: new THREE.Color(0x1a1a2e),
        emissiveIntensity: 0.05
      });

      // Seam material (translucent with cyan glow)
      const seamMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x004444),  // Deep cyan
        metalness: 0.2,
        roughness: 0.4,
        transparent: true,
        opacity: 0.6,
        emissive: new THREE.Color(0x00aaff),  // Bright cyan
        emissiveIntensity: 0.4
      });

      // === MAIN OBELISK PLATES ===
      // Create 5 irregular vertical plates
      const plateCount = 5;
      const plateHeights = [0.8, 0.95, 0.85, 0.9, 0.75];  // Varied heights
      const plateRotations = [0, 0.15, -0.1, 0.2, -0.15]; // Slight tilts

      for (let i = 0; i < plateCount; i++) {
        const plateGeometry = new THREE.BoxGeometry(0.25, plateHeights[i], 0.08);
        const plate = new THREE.Mesh(plateGeometry, baseMaterial);

        // Position in circle around center
        const angle = (i / plateCount) * Math.PI * 2;
        const radius = 0.25;
        plate.position.set(
          Math.cos(angle) * radius,
          plateHeights[i] * 0.5 - 0.1,
          Math.sin(angle) * radius
        );

        // Slight rotation for asymmetry
        plate.rotation.z = plateRotations[i];
        plate.rotation.y = angle;

        plate.userData.isObeliskPlate = true;
        plate.userData.plateIndex = i;
        plate.userData.baseHeight = plateHeights[i];
        group.add(plate);
      }

      // === FRACTURED TOP ===
      // Create irregular peak (chipped effect)
      const topGeometry = new THREE.TetrahedronGeometry(0.2, 1);
      const top = new THREE.Mesh(topGeometry, baseMaterial);
      top.position.y = 0.5;
      top.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3);
      top.scale.set(0.8, 1.1, 0.8);  // Slightly stretched
      top.userData.isFracturedTop = true;
      group.add(top);

      // === INTERIOR SEAMS (Glowing translucent layers) ===
      const seamCount = 3;
      for (let i = 0; i < seamCount; i++) {
        const seamGeometry = new THREE.BoxGeometry(0.15, 0.6 - (i * 0.1), 0.02);
        const seam = new THREE.Mesh(seamGeometry, seamMaterial);

        seam.position.y = 0.1 - (i * 0.05);
        seam.position.z = -0.15 + (i * 0.08);
        seam.rotation.y = (i / seamCount) * Math.PI / 3;

        seam.userData.isInteriorSeam = true;
        seam.userData.seamIndex = i;
        seam.userData.breathingPhase = 0;
        group.add(seam);
      }

      // === BASE PLATFORM ===
      const baseGeometry = new THREE.CylinderGeometry(0.5, 0.6, 0.15, 8);
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = -0.45;
      base.userData.isBase = true;
      group.add(base);

      // Store animation metadata
      group.userData.isObeliskCache = true;
      group.userData.nodeGeometryName = 'STORAGE_OBELISK_CACHE';
      group.userData.breathingCycle = 12.0;     // 12 seconds
      group.userData.breathingAmplitude = 0.15; // 15% intensity variation
      group.userData.settlingAmplitude = 0.02;  // Micro-settling (2% of height)
      group.userData.visualCoreImmutable = false;

      return group;
    } catch (err) {
      console.warn('[StorageNodesVisual] ObeliskCache creation failed:', err);
      return group;
    }
  }

  /**
   * FRACTAL RESERVOIR - Crystallized Memory / Data Reservoir
   * 
   * ARCHETYPE: Cluster of crystals, memory feels fragmented across shards
   * 
   * GEOMETRY:
   * - 6-12 irregular crystal shards
   * - Each shard unique shape and height
   * - Gaps between shards (distributed memory)
   * - No central core (distributed architecture)
   * - Range from 0.3 to 0.8 units tall
   * 
   * MATERIALS:
   * - Semi-transparent crystal (frosted glass aesthetic)
   * - Sharp edges, slight internal noise
   * - Dim violet/blue veins of light
   * 
   * EMISSIVE:
   * - Violet internal light pathways
   * - Refracts inside crystals
   * - Subtle rim-light on edges
   * - No pulsing, only slow luminosity breathing
   * 
   * MOTION:
   * - Nested basin layers with slow tidal drift
   * - Rim spillways and recursive terrace breathing
   * - Feels geological, patient
   */
  static createFractalReservoir(group, visualCodeOrColor = 0x00ff88, maybeColor) {
    try {
      const resolvedColor = typeof maybeColor === 'number'
        ? maybeColor
        : (typeof visualCodeOrColor === 'number' && visualCodeOrColor > 0x1ff
          ? visualCodeOrColor
          : 0x00ff88);
      const accentColor = new THREE.Color(resolvedColor);
      const accentGlow = accentColor.clone().multiplyScalar(0.74);
      const accentSoft = accentColor.clone().multiplyScalar(0.28);
      const phase = ((resolvedColor >>> 0) % 997) / 997 * Math.PI * 2;

      group.userData = group.userData || {};
      group.name = 'STORAGE_FRACTAL_RESERVOIR_V2_NODE';
      group.rotation.set(0.04, 0.18, -0.03);
      group.userData.visualVariant = 'STORAGE_FRACTAL_RESERVOIR_V2';
      group.userData.storageVariant = 'FRACTAL_RESERVOIR';
      group.userData.nodeGeometryName = 'STORAGE_FRACTAL_RESERVOIR_V2';
      group.userData.wavePatchMode = 'DEFAULT';
      group.userData.visualCoreImmutable = true;
      group.userData.fractalReservoirPhase = phase;
      group.userData.fractalReservoirBaseRotation = group.rotation.clone();
      group.userData.fractalReservoirBaseScale = group.scale.clone();
      group.userData.fractalReservoirBaseY = group.position.y;
      group.userData.fractalReservoirBreathSpeed = 0.028;
      group.userData.fractalReservoirBreathAmplitude = 0.003;
      group.userData.fractalReservoirTerraceSpinSpeed = 0.0032;
      group.userData.fractalReservoirCorePulseSpeed = 0.036;
      group.userData.fractalReservoirRimDriftSpeed = 0.0042;
      group.userData.fractalReservoirChannelFlowSpeed = 0.006;

      const basinProfile = [
        new THREE.Vector2(0.00, -0.42),
        new THREE.Vector2(0.10, -0.40),
        new THREE.Vector2(0.22, -0.33),
        new THREE.Vector2(0.38, -0.21),
        new THREE.Vector2(0.54, -0.05),
        new THREE.Vector2(0.70, 0.09),
        new THREE.Vector2(0.86, 0.20),
        new THREE.Vector2(1.02, 0.26)
      ];
      const outerShellGeometry = new THREE.LatheGeometry(basinProfile, 14);
      const midShellGeometry = new THREE.LatheGeometry(
        basinProfile.map((point) => new THREE.Vector2(point.x * 0.76, point.y * 0.84 + 0.03)),
        14
      );
      const innerShellGeometry = new THREE.LatheGeometry(
        basinProfile.map((point) => new THREE.Vector2(point.x * 0.48, point.y * 0.58 + 0.08)),
        14
      );
      const terraceGeometry = new THREE.TorusGeometry(0.82, 0.032, 8, 16, Math.PI * 1.88);
      const rimGeometry = new THREE.TorusGeometry(0.98, 0.022, 8, 12, Math.PI * 0.72);
      const channelGeometry = new THREE.BoxGeometry(0.11, 0.5, 0.07);
      const indexGeometry = new THREE.BoxGeometry(0.04, 0.12, 0.03);
      const haloGeometry = new THREE.OctahedronGeometry(0.21, 1);
      const coreGeometry = new THREE.DodecahedronGeometry(0.12, 0);
      const seedGeometry = new THREE.IcosahedronGeometry(0.07, 1);

      const outerMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x101722),
        metalness: 0.16,
        roughness: 0.84,
        emissive: new THREE.Color(0x081018),
        emissiveIntensity: 0.09,
        side: THREE.DoubleSide
      });
      const midMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x152131),
        metalness: 0.12,
        roughness: 0.7,
        transparent: true,
        opacity: 0.9,
        emissive: accentSoft.clone(),
        emissiveIntensity: 0.18,
        side: THREE.DoubleSide
      });
      const innerMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x1a2940),
        metalness: 0.08,
        roughness: 0.52,
        transparent: true,
        opacity: 0.84,
        emissive: accentGlow.clone(),
        emissiveIntensity: 0.24,
        side: THREE.DoubleSide
      });
      const terraceMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x22324a),
        metalness: 0.16,
        roughness: 0.4,
        transparent: true,
        opacity: 0.7,
        emissive: accentSoft.clone(),
        emissiveIntensity: 0.14,
        side: THREE.DoubleSide
      });
      const coreMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x1e2b3d),
        metalness: 0.3,
        roughness: 0.3,
        emissive: accentColor.clone(),
        emissiveIntensity: 0.42
      });
      const haloMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x27374d),
        metalness: 0.08,
        roughness: 0.26,
        transparent: true,
        opacity: 0.36,
        emissive: accentGlow.clone(),
        emissiveIntensity: 0.18,
        side: THREE.DoubleSide
      });
      const rimMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x253449),
        metalness: 0.2,
        roughness: 0.32,
        transparent: true,
        opacity: 0.62,
        emissive: accentColor.clone(),
        emissiveIntensity: 0.22,
        side: THREE.DoubleSide
      });
      const channelMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x121a25),
        metalness: 0.14,
        roughness: 0.72,
        transparent: true,
        opacity: 0.76,
        emissive: accentGlow.clone(),
        emissiveIntensity: 0.16,
        side: THREE.DoubleSide
      });
      const indexMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x314259),
        metalness: 0.24,
        roughness: 0.26,
        emissive: accentColor.clone(),
        emissiveIntensity: 0.24
      });
      const seedMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x182433),
        metalness: 0.34,
        roughness: 0.28,
        transparent: true,
        opacity: 0.92,
        emissive: accentGlow.clone(),
        emissiveIntensity: 0.48
      });

      const basinGroup = new THREE.Group();
      basinGroup.name = 'BASIN_GROUP';
      basinGroup.position.set(0, -0.02, 0);
      basinGroup.rotation.set(0.06, 0.12, -0.02);
      basinGroup.userData.basePosition = basinGroup.position.clone();
      basinGroup.userData.baseRotation = basinGroup.rotation.clone();

      const shellMeshes = [];
      [
        { geometry: outerShellGeometry, material: outerMaterial, position: [0, 0, 0], rotation: [0.05, 0.18, -0.02], scale: [1.02, 1.0, 1.02], order: 1 },
        { geometry: midShellGeometry, material: midMaterial, position: [0, 0.05, 0], rotation: [-0.08, -0.24, 0.09], scale: [0.72, 0.82, 0.72], order: 2 },
        { geometry: innerShellGeometry, material: innerMaterial, position: [0.01, 0.1, -0.01], rotation: [0.12, 0.32, -0.08], scale: [0.46, 0.6, 0.46], order: 3 }
      ].forEach((spec, idx) => {
        const shell = new THREE.Mesh(spec.geometry, spec.material);
        shell.name = `FractalReservoirShell_${idx}`;
        shell.position.set(spec.position[0], spec.position[1], spec.position[2]);
        shell.rotation.set(spec.rotation[0], spec.rotation[1], spec.rotation[2]);
        shell.scale.set(spec.scale[0], spec.scale[1], spec.scale[2]);
        shell.renderOrder = spec.order;
        shell.userData.isFractalReservoirShell = true;
        shell.userData.layerIndex = idx;
        shell.userData.basePosition = shell.position.clone();
        shell.userData.baseRotation = shell.rotation.clone();
        shell.userData.baseScale = shell.scale.clone();
        basinGroup.add(shell);
        shellMeshes.push(shell);
      });

      const terraceMeshes = [];
      [
        { position: [0, 0.17, 0], rotation: [Math.PI / 2, 0.0, 0.0], scale: [1.0, 1.0, 1.0] },
        { position: [0, 0.07, 0], rotation: [Math.PI / 2, Math.PI / 5, 0.04], scale: [0.78, 0.96, 0.78] },
        { position: [0, -0.03, 0], rotation: [Math.PI / 2, -Math.PI / 6, -0.03], scale: [0.54, 0.88, 0.54] }
      ].forEach((spec, idx) => {
        const terrace = new THREE.Mesh(terraceGeometry, terraceMaterial);
        terrace.name = `FractalReservoirTerrace_${idx}`;
        terrace.position.set(spec.position[0], spec.position[1], spec.position[2]);
        terrace.rotation.set(spec.rotation[0], spec.rotation[1], spec.rotation[2]);
        terrace.scale.set(spec.scale[0], spec.scale[1], spec.scale[2]);
        terrace.renderOrder = 4;
        terrace.userData.isFractalReservoirTerrace = true;
        terrace.userData.basePosition = terrace.position.clone();
        terrace.userData.baseRotation = terrace.rotation.clone();
        terrace.userData.baseScale = terrace.scale.clone();
        basinGroup.add(terrace);
        terraceMeshes.push(terrace);
      });

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';
      coreGroup.position.set(0, 0.05, 0);
      coreGroup.rotation.set(0.16, 0.26, -0.04);
      coreGroup.userData.basePosition = coreGroup.position.clone();
      coreGroup.userData.baseRotation = coreGroup.rotation.clone();

      const coreHalo = new THREE.Mesh(haloGeometry, haloMaterial);
      coreHalo.name = 'FractalReservoirCoreHalo';
      coreHalo.scale.set(1.0, 0.92, 1.0);
      coreHalo.renderOrder = 5;
      coreHalo.userData.isFractalReservoirCoreHalo = true;
      coreHalo.userData.baseRotation = coreHalo.rotation.clone();
      coreHalo.userData.baseScale = coreHalo.scale.clone();
      coreGroup.add(coreHalo);

      const coreShell = new THREE.Mesh(coreGeometry, coreMaterial);
      coreShell.name = 'FractalReservoirCoreShell';
      coreShell.position.set(0, 0.03, 0);
      coreShell.rotation.set(0.28, 0.46, -0.12);
      coreShell.scale.set(0.92, 1.02, 0.92);
      coreShell.renderOrder = 6;
      coreShell.userData.isFractalReservoirCoreShell = true;
      coreShell.userData.basePosition = coreShell.position.clone();
      coreShell.userData.baseRotation = coreShell.rotation.clone();
      coreShell.userData.baseScale = coreShell.scale.clone();
      coreGroup.add(coreShell);

      const coreSeed = new THREE.Mesh(seedGeometry, seedMaterial);
      coreSeed.name = 'FractalReservoirCoreSeed';
      coreSeed.position.set(0.02, 0.01, 0.01);
      coreSeed.rotation.set(-0.18, 0.64, 0.12);
      coreSeed.scale.set(0.72, 0.72, 0.72);
      coreSeed.renderOrder = 7;
      coreSeed.userData.isFractalReservoirCoreSeed = true;
      coreSeed.userData.basePosition = coreSeed.position.clone();
      coreSeed.userData.baseRotation = coreSeed.rotation.clone();
      coreSeed.userData.baseScale = coreSeed.scale.clone();
      coreGroup.add(coreSeed);

      const rimGroup = new THREE.Group();
      rimGroup.name = 'RIM_GROUP';
      rimGroup.position.set(0, 0.33, 0);
      rimGroup.rotation.set(0.04, 0.18, -0.02);
      rimGroup.userData.basePosition = rimGroup.position.clone();
      rimGroup.userData.baseRotation = rimGroup.rotation.clone();

      const rimAccents = [];
      [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5].forEach((angle, idx) => {
        const rimArc = new THREE.Mesh(rimGeometry, rimMaterial);
        rimArc.name = `FractalReservoirRimArc_${idx}`;
        rimArc.rotation.set(Math.PI / 2, angle + idx * 0.08, idx % 2 === 0 ? 0.06 : -0.06);
        rimArc.scale.set(1.0 - idx * 0.03, 1.0, 1.0 - idx * 0.03);
        rimArc.renderOrder = 8;
        rimArc.userData.isFractalReservoirRimAccent = true;
        rimArc.userData.ignoreWaveColor = true;
        rimArc.userData.baseRotation = rimArc.rotation.clone();
        rimArc.userData.baseScale = rimArc.scale.clone();
        rimGroup.add(rimArc);
        rimAccents.push(rimArc);
      });

      const indexMarkers = [];
      [Math.PI / 4, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75].forEach((angle, idx) => {
        const marker = new THREE.Mesh(indexGeometry, indexMaterial);
        marker.name = `FractalReservoirIndex_${idx}`;
        marker.position.set(Math.cos(angle) * 1.08, 0.02 + (idx % 2) * 0.01, Math.sin(angle) * 1.08);
        marker.rotation.set(0.14, angle, idx % 2 === 0 ? 0.08 : -0.08);
        marker.renderOrder = 9;
        marker.userData.isFractalReservoirIndexAccent = true;
        marker.userData.ignoreWaveColor = true;
        marker.userData.basePosition = marker.position.clone();
        marker.userData.baseRotation = marker.rotation.clone();
        marker.userData.baseScale = marker.scale.clone();
        rimGroup.add(marker);
        indexMarkers.push(marker);
      });

      const channelGroup = new THREE.Group();
      channelGroup.name = 'CHANNEL_GROUP';
      channelGroup.position.set(0, -0.05, 0);
      channelGroup.rotation.set(0.02, -0.12, 0.02);
      channelGroup.userData.basePosition = channelGroup.position.clone();
      channelGroup.userData.baseRotation = channelGroup.rotation.clone();

      const overflowChannels = [];
      [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach((angle, idx) => {
        const channel = new THREE.Mesh(channelGeometry, channelMaterial);
        channel.name = `FractalReservoirOverflow_${idx}`;
        channel.position.set(Math.cos(angle) * 0.76, -0.08 - (idx % 2) * 0.03, Math.sin(angle) * 0.76);
        channel.rotation.set(0.18 + idx * 0.03, angle, idx % 2 === 0 ? -0.28 : 0.28);
        channel.scale.set(1.0, 1.0, 1.0);
        channel.renderOrder = 10;
        channel.userData.isFractalReservoirOverflow = true;
        channel.userData.ignoreWaveColor = true;
        channel.userData.basePosition = channel.position.clone();
        channel.userData.baseRotation = channel.rotation.clone();
        channel.userData.baseScale = channel.scale.clone();
        channel.userData.channelPhase = phase + idx * 0.57;
        channelGroup.add(channel);
        overflowChannels.push(channel);
      });

      group.add(basinGroup);
      group.add(coreGroup);
      group.add(rimGroup);
      group.add(channelGroup);

      group.userData.fractalReservoirRefs = {
        basinGroup,
        shellMeshes,
        terraceMeshes,
        coreGroup,
        coreHalo,
        coreShell,
        coreSeed,
        rimGroup,
        rimAccents,
        indexMarkers,
        channelGroup,
        overflowChannels
      };

      return group;
    } catch (err) {
      console.warn('[StorageNodesVisual] FractalReservoirV2 creation failed:', err);
      return group;
    }
  }

  /**
   * ARCHIVE RESONATOR DRUM - Ceremonial memory vessel / compressed archive
   *
   * ARCHETYPE:
   * - Tilted barrel-vessel with one dominant lock collar
   * - Asymmetric shell bands, retention seams, and compression rails
   * - Reads as archive pressure and resonance, not a generic cylinder
   *
   * MOTION:
   * - Slow compression breathing
   * - Stable core
   * - Independent shell-band drift
   * - Lock-collar settling
   * - Restrained telemetry drift
   */
  static createArchiveDrum(group, visualCodeOrColor = 0x00ff88, maybeColor) {
    try {
      group.userData = group.userData || {};
      const resolvedColorHex = _resolveArchiveResonatorDrumColor(group, visualCodeOrColor, maybeColor);
      const seedSource = group?.userData?.nodeId || group?.uuid || String(resolvedColorHex);
      const seed = Math.abs(hashString(`512|${seedSource}|ARCHIVE_RESONATOR_DRUM`)) || 512;
      const rng = _mythicSeededRng(seed);
      const geometries = _getArchiveResonatorDrumGeometries();
      const materials = _getArchiveResonatorDrumMaterials(resolvedColorHex);
      const { coreOrder, archOrder } = _getArchiveResonatorDrumRenderOrders();

      const root = group;
      root.name = 'STORAGE_ARCHIVE_RESONATOR_DRUM_V2_NODE';
      root.userData.color = resolvedColorHex;
      root.userData.archiveResonatorDrumColor = resolvedColorHex;
      root.userData.visualVariant = 'STORAGE_ARCHIVE_RESONATOR_DRUM_V2';
      root.userData.storageVariant = 'ARCHIVE_RESONATOR_DRUM';
      root.userData.nodeGeometryName = 'STORAGE_ARCHIVE_RESONATOR_DRUM_V2';
      root.userData.visualReady = true;
      root.userData.visualCoreImmutable = true;
      root.userData.isArchiveDrum = true;
      root.userData.isArchiveResonatorDrum = true;
      root.userData.wavePatchMode = 'DEFAULT';
      root.rotation.set(0.16 + (rng() - 0.5) * 0.05, 0.14 + (rng() - 0.5) * 0.08, -0.28 + (rng() - 0.5) * 0.04);
      root.scale.set(1.04, 0.96, 1.02);
      root.userData.archiveResonatorDrumPhase = rng() * Math.PI * 2;
      root.userData.archiveResonatorDrumBaseRotation = root.rotation.clone();
      root.userData.archiveResonatorDrumBaseScale = root.scale.clone();
      root.userData.archiveResonatorDrumBaseY = root.position.y;
      root.userData.archiveResonatorDrumCoreSpeed = 0.032 + rng() * 0.007;
      root.userData.archiveResonatorDrumShellSpeed = 0.0031 + rng() * 0.0012;
      root.userData.archiveResonatorDrumLockSpeed = 0.004 + rng() * 0.0012;
      root.userData.archiveResonatorDrumChannelSpeed = 0.0048 + rng() * 0.0012;
      root.userData.archiveResonatorDrumAuraSpeed = 0.0028 + rng() * 0.001;

      const refs = {
        coreGroup: null,
        drumGroup: null,
        lockGroup: null,
        channelGroup: null,
        auraGroup: null,
        coreBody: null,
        coreSeam: null,
        coreVoid: null,
        coreSeed: null,
        drumBody: null,
        frontShoulder: null,
        rearShoulder: null,
        shellBands: [],
        retentionSeams: [],
        lockCollar: null,
        lockGate: null,
        lockKeys: [],
        channelRails: [],
        channelSeams: [],
        supportShells: [],
        haloMesh: null,
        dustPoints: null
      };

      const makeMesh = (parent, geometry, material, name, options = {}) => {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = name;
        mesh.userData = mesh.userData || {};
        mesh.userData.visualCoreImmutable = true;
        mesh.userData.wavePatchMode = options.wavePatchMode || 'DEFAULT';
        if (options.ignoreWaveColor) {
          mesh.userData.ignoreWaveColor = true;
        }
        if (options.position) {
          mesh.position.set(options.position[0], options.position[1], options.position[2]);
        }
        if (options.rotation) {
          mesh.rotation.set(options.rotation[0], options.rotation[1], options.rotation[2]);
        }
        if (options.scale) {
          mesh.scale.set(options.scale[0], options.scale[1], options.scale[2]);
        }
        if (options.renderOrder !== undefined) {
          mesh.renderOrder = options.renderOrder;
        }
        parent.add(mesh);
        return mesh;
      };

      const makePoints = (parent, geometry, material, name, options = {}) => {
        const points = new THREE.Points(geometry, material);
        points.name = name;
        points.userData = points.userData || {};
        points.userData.visualCoreImmutable = true;
        points.userData.wavePatchMode = options.wavePatchMode || 'DEFAULT';
        if (options.position) {
          points.position.set(options.position[0], options.position[1], options.position[2]);
        }
        if (options.rotation) {
          points.rotation.set(options.rotation[0], options.rotation[1], options.rotation[2]);
        }
        if (options.scale) {
          points.scale.set(options.scale[0], options.scale[1], options.scale[2]);
        }
        if (options.renderOrder !== undefined) {
          points.renderOrder = options.renderOrder;
        }
        points.raycast = () => null;
        points.frustumCulled = false;
        parent.add(points);
        return points;
      };

      const captureBaseTransforms = (object3d) => {
        object3d.userData.basePosition = object3d.position.clone();
        object3d.userData.baseRotation = object3d.rotation.clone();
        object3d.userData.baseScale = object3d.scale.clone();
      };

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';
      coreGroup.userData.isArchiveResonatorDrumCoreGroup = true;
      coreGroup.userData.baseRotation = coreGroup.rotation.clone();
      coreGroup.position.set(-0.02, 0.01, -0.12);
      coreGroup.rotation.set(0.04, -0.1, 0.02);
      root.add(coreGroup);
      refs.coreGroup = coreGroup;

      const coreBody = makeMesh(coreGroup, geometries.coreGeometry, materials.coreMat, 'ArchiveResonatorCoreBody', {
        position: [0.0, 0.0, 0.0],
        rotation: [0.0, 0.16, 0.04],
        scale: [0.98, 0.94, 1.0],
        renderOrder: coreOrder
      });
      coreBody.userData.isArchiveResonatorCoreBody = true;
      captureBaseTransforms(coreBody);
      refs.coreBody = coreBody;

      const coreSeam = makeMesh(coreGroup, geometries.coreSeamGeometry, materials.coreSeamMat, 'ArchiveResonatorCoreSeam', {
        position: [0.0, 0.0, 0.0],
        rotation: [Math.PI / 2, 0.12, -0.06],
        scale: [1.0, 1.0, 1.0],
        renderOrder: coreOrder + 1
      });
      coreSeam.userData.isArchiveResonatorCoreSeam = true;
      captureBaseTransforms(coreSeam);
      refs.coreSeam = coreSeam;

      const coreVoid = makeMesh(coreGroup, geometries.coreVoidGeometry, materials.coreSeamMat, 'ArchiveResonatorCoreVoid', {
        position: [0.02, 0.0, 0.01],
        rotation: [Math.PI / 2, 0.0, 0.0],
        scale: [0.92, 0.9, 0.92],
        renderOrder: coreOrder + 2,
        ignoreWaveColor: true
      });
      coreVoid.userData.isArchiveResonatorCoreVoid = true;
      captureBaseTransforms(coreVoid);
      refs.coreVoid = coreVoid;

      const coreSeed = makeMesh(coreGroup, geometries.coreSeedGeometry, materials.coreSeamMat, 'ArchiveResonatorCoreSeed', {
        position: [0.0, 0.0, 0.0],
        rotation: [0.28, 0.44, -0.12],
        scale: [0.76, 0.76, 0.76],
        renderOrder: coreOrder + 3
      });
      coreSeed.userData.isArchiveResonatorCoreSeed = true;
      captureBaseTransforms(coreSeed);
      refs.coreSeed = coreSeed;

      const drumGroup = new THREE.Group();
      drumGroup.name = 'DRUM_GROUP';
      drumGroup.userData.isArchiveResonatorDrumGroup = true;
      drumGroup.userData.baseRotation = drumGroup.rotation.clone();
      drumGroup.position.set(0.0, -0.01, 0.0);
      drumGroup.rotation.set(0.02, 0.06, 0.03);
      root.add(drumGroup);
      refs.drumGroup = drumGroup;

      const drumBody = makeMesh(drumGroup, geometries.drumBodyGeometry, materials.bodyMat, 'ArchiveResonatorDrumBody', {
        position: [0.0, 0.0, 0.0],
        rotation: [0.0, 0.0, 0.0],
        scale: [1.0, 0.96, 1.0],
        renderOrder: archOrder
      });
      drumBody.userData.isArchiveResonatorDrumBody = true;
      captureBaseTransforms(drumBody);
      refs.drumBody = drumBody;

      const frontShoulder = makeMesh(drumGroup, geometries.drumShoulderGeometry, materials.bodyBandMat, 'ArchiveResonatorFrontShoulder', {
        position: [0.0, 0.02, 0.26],
        rotation: [0.08, 0.12, 0.04],
        scale: [0.96, 1.0, 0.92],
        renderOrder: archOrder + 1
      });
      frontShoulder.userData.isArchiveResonatorFrontShoulder = true;
      captureBaseTransforms(frontShoulder);
      refs.frontShoulder = frontShoulder;

      const rearShoulder = makeMesh(drumGroup, geometries.drumShoulderGeometry, materials.bodyBandAltMat, 'ArchiveResonatorRearShoulder', {
        position: [0.0, -0.01, -0.24],
        rotation: [-0.05, -0.08, -0.02],
        scale: [0.9, 0.94, 0.88],
        renderOrder: archOrder + 1
      });
      rearShoulder.userData.isArchiveResonatorRearShoulder = true;
      captureBaseTransforms(rearShoulder);
      refs.rearShoulder = rearShoulder;

      const shellBandSpecs = [
        {
          name: 'ShellBand_A',
          geometry: geometries.shellBandGeometryA,
          material: materials.bodyBandMat,
          position: [0.08, 0.04, -0.24],
          rotation: [0.09, 0.18, 0.04],
          scale: [1.0, 0.96, 0.94],
          bandSpeed: 0.16,
          bandPhase: 0.23,
          bandBias: 0.02
        },
        {
          name: 'ShellBand_B',
          geometry: geometries.shellBandGeometryB,
          material: materials.bodyBandAltMat,
          position: [-0.06, -0.03, -0.02],
          rotation: [-0.08, -0.12, -0.07],
          scale: [0.96, 1.0, 1.02],
          bandSpeed: 0.14,
          bandPhase: 0.74,
          bandBias: -0.03
        },
        {
          name: 'ShellBand_C',
          geometry: geometries.shellBandGeometryC,
          material: materials.bodyBandMat,
          position: [0.12, 0.02, 0.18],
          rotation: [0.1, 0.28, 0.12],
          scale: [1.05, 0.94, 0.9],
          bandSpeed: 0.18,
          bandPhase: 1.32,
          bandBias: 0.04
        }
      ];

      shellBandSpecs.forEach((spec, idx) => {
        const band = makeMesh(drumGroup, spec.geometry, spec.material, spec.name, {
          position: spec.position,
          rotation: spec.rotation,
          scale: spec.scale,
          renderOrder: archOrder + 2
        });
        band.userData.isArchiveResonatorDrumShellBand = true;
        band.userData.bandIndex = idx;
        band.userData.bandSpeed = spec.bandSpeed;
        band.userData.bandPhase = root.userData.archiveResonatorDrumPhase + spec.bandPhase;
        band.userData.bandBias = spec.bandBias;
        captureBaseTransforms(band);
        refs.shellBands.push(band);
      });

      const retentionSeamSpecs = [
        {
          name: 'RetentionSeam_A',
          position: [0.0, 0.0, -0.12],
          rotation: [0.0, 0.08, 0.0],
          scale: [1.0, 0.96, 1.0]
        },
        {
          name: 'RetentionSeam_B',
          position: [0.03, -0.03, 0.14],
          rotation: [0.12, -0.12, 0.14],
          scale: [0.92, 1.0, 0.92]
        }
      ];

      retentionSeamSpecs.forEach((spec, idx) => {
        const seam = makeMesh(drumGroup, geometries.seamGeometry, materials.seamMat, spec.name, {
          position: spec.position,
          rotation: spec.rotation,
          scale: spec.scale,
          renderOrder: archOrder + 3
        });
        seam.userData.isArchiveResonatorDrumRetentionSeam = true;
        seam.userData.seamIndex = idx;
        seam.userData.seamPhase = root.userData.archiveResonatorDrumPhase + idx * 0.71;
        captureBaseTransforms(seam);
        refs.retentionSeams.push(seam);
      });

      const lockGroup = new THREE.Group();
      lockGroup.name = 'LOCK_GROUP';
      lockGroup.userData.isArchiveResonatorDrumLockGroup = true;
      lockGroup.userData.baseRotation = lockGroup.rotation.clone();
      lockGroup.position.set(0.0, 0.01, 0.56);
      lockGroup.rotation.set(0.08, 0.16, 0.02);
      root.add(lockGroup);
      refs.lockGroup = lockGroup;

      const lockCollar = makeMesh(lockGroup, geometries.lockCollarGeometry, materials.lockMat, 'ArchiveResonatorLockCollar', {
        position: [0.0, 0.0, 0.0],
        rotation: [0.0, 0.06, 0.04],
        scale: [1.06, 0.98, 1.04],
        renderOrder: archOrder + 4
      });
      lockCollar.userData.isArchiveResonatorDrumLockCollar = true;
      captureBaseTransforms(lockCollar);
      refs.lockCollar = lockCollar;

      const lockGate = makeMesh(lockGroup, geometries.lockGateGeometry, materials.lockAccentMat, 'ArchiveResonatorLockGate', {
        position: [0.0, 0.0, 0.0],
        rotation: [0.02, 0.14, 0.0],
        scale: [1.0, 1.0, 1.0],
        renderOrder: archOrder + 5,
        ignoreWaveColor: true
      });
      lockGate.userData.isArchiveResonatorDrumLockGate = true;
      captureBaseTransforms(lockGate);
      refs.lockGate = lockGate;

      const lockKeySpecs = [
        { position: [0.18, 0.26, 0.0], rotation: [0.04, 0.0, 0.12], scale: [1.0, 1.0, 1.0] },
        { position: [-0.14, -0.22, 0.02], rotation: [-0.04, 0.18, -0.1], scale: [0.92, 1.0, 0.92] },
        { position: [0.04, -0.34, -0.01], rotation: [0.08, -0.12, 0.08], scale: [0.84, 0.94, 0.84] }
      ];

      lockKeySpecs.forEach((spec, idx) => {
        const key = makeMesh(lockGroup, geometries.indexGeometry, materials.lockAccentMat, `ArchiveResonatorLockKey_${idx}`, {
          position: spec.position,
          rotation: spec.rotation,
          scale: spec.scale,
          renderOrder: archOrder + 6,
          ignoreWaveColor: true
        });
        key.userData.isArchiveResonatorDrumLockKey = true;
        key.userData.indexIndex = idx;
        key.userData.indexPhase = root.userData.archiveResonatorDrumPhase + idx * 0.53;
        captureBaseTransforms(key);
        refs.lockKeys.push(key);
      });

      const channelGroup = new THREE.Group();
      channelGroup.name = 'CHANNEL_GROUP';
      channelGroup.userData.isArchiveResonatorDrumChannelGroup = true;
      channelGroup.userData.baseRotation = channelGroup.rotation.clone();
      channelGroup.position.set(0.0, -0.01, 0.0);
      channelGroup.rotation.set(0.02, -0.04, 0.01);
      root.add(channelGroup);
      refs.channelGroup = channelGroup;

      const channelRailSpecs = [
        { position: [-0.36, 0.14, 0.03], rotation: [0.08, -0.06, 0.22], scale: [1.0, 0.88, 0.88] },
        { position: [0.3, -0.13, -0.04], rotation: [-0.06, 0.12, -0.18], scale: [0.9, 0.92, 0.82] },
        { position: [0.06, 0.24, 0.08], rotation: [0.14, 0.04, 0.1], scale: [0.8, 0.9, 0.94] }
      ];

      channelRailSpecs.forEach((spec, idx) => {
        const rail = makeMesh(channelGroup, geometries.channelRailGeometry, materials.channelMat, `ArchiveResonatorChannelRail_${idx}`, {
          position: spec.position,
          rotation: spec.rotation,
          scale: spec.scale,
          renderOrder: archOrder + 7
        });
        rail.userData.isArchiveResonatorDrumChannelRail = true;
        rail.userData.railIndex = idx;
        rail.userData.railPhase = root.userData.archiveResonatorDrumPhase + idx * 0.67;
        rail.userData.railSpeed = 0.16 + idx * 0.03;
        captureBaseTransforms(rail);
        refs.channelRails.push(rail);
      });

      const channelSeamSpecs = [
        { position: [-0.02, 0.0, -0.2], rotation: [0.02, 0.08, 0.0], scale: [1.0, 0.8, 1.0] },
        { position: [0.04, -0.02, 0.2], rotation: [0.08, -0.12, 0.12], scale: [0.92, 0.76, 0.92] }
      ];

      channelSeamSpecs.forEach((spec, idx) => {
        const seam = makeMesh(channelGroup, geometries.seamGeometry, materials.seamMat, `ArchiveResonatorChannelSeam_${idx}`, {
          position: spec.position,
          rotation: spec.rotation,
          scale: spec.scale,
          renderOrder: archOrder + 7.5
        });
        seam.userData.isArchiveResonatorDrumChannelSeam = true;
        seam.userData.seamIndex = idx;
        seam.userData.seamPhase = root.userData.archiveResonatorDrumPhase + idx * 0.57;
        captureBaseTransforms(seam);
        refs.channelSeams.push(seam);
      });

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';
      auraGroup.userData.isArchiveResonatorDrumAuraGroup = true;
      auraGroup.userData.baseRotation = auraGroup.rotation.clone();
      auraGroup.position.set(0.0, 0.0, 0.0);
      auraGroup.rotation.set(0.02, 0.04, -0.03);
      root.add(auraGroup);
      refs.auraGroup = auraGroup;

      const supportShellSpecs = [
        { position: [-0.44, 0.16, 0.18], rotation: [0.12, 0.36, 0.08], scale: [1.0, 0.9, 0.8] },
        { position: [0.26, -0.16, -0.12], rotation: [-0.18, -0.24, 0.22], scale: [0.86, 1.02, 0.76] },
        { position: [0.08, 0.28, 0.24], rotation: [0.24, 0.08, -0.18], scale: [0.78, 0.86, 0.88] }
      ];

      supportShellSpecs.forEach((spec, idx) => {
        const shell = makeMesh(auraGroup, geometries.supportShellGeometry, materials.supportMat, `ArchiveResonatorSupportShell_${idx}`, {
          position: spec.position,
          rotation: spec.rotation,
          scale: spec.scale,
          renderOrder: archOrder + 8
        });
        shell.userData.isArchiveResonatorDrumSupportShell = true;
        shell.userData.shellIndex = idx;
        shell.userData.shellPhase = root.userData.archiveResonatorDrumPhase + idx * 0.83;
        captureBaseTransforms(shell);
        refs.supportShells.push(shell);
      });

      const haloMesh = makeMesh(auraGroup, geometries.haloGeometry, materials.haloMat, 'ArchiveResonatorHalo', {
        position: [0.0, 0.02, 0.46],
        rotation: [Math.PI / 2, 0.14, -0.08],
        scale: [1.02, 0.96, 1.02],
        renderOrder: archOrder + 9
      });
      haloMesh.userData.isArchiveResonatorDrumHalo = true;
      captureBaseTransforms(haloMesh);
      refs.haloMesh = haloMesh;

      const dustPoints = makePoints(auraGroup, geometries.dustGeometry, materials.dustMat, 'ArchiveResonatorDust', {
        position: [0.02, 0.04, 0.22],
        rotation: [0.12, 0.08, -0.03],
        scale: [1.0, 1.0, 1.0],
        renderOrder: archOrder + 10
      });
      dustPoints.userData.isArchiveResonatorDrumDust = true;
      dustPoints.userData.dustPhase = root.userData.archiveResonatorDrumPhase;
      captureBaseTransforms(dustPoints);
      refs.dustPoints = dustPoints;

      root.userData.archiveResonatorDrumRefs = refs;

      return root;
    } catch (err) {
      console.warn('[StorageNodesVisual] ArchiveResonatorDrum creation failed:', err);
      return group;
    }
  }

  /**
   * Create storage node by name
   * Usage: StorageNodesVisual.createStorageNode('obelisk', group, color)
   */
  static createStorageNode(name, group, color = 0x00ff88) {
    switch (name.toLowerCase()) {
      case 'obelisk':
        return this.createObeliskCache(group, color);
      case 'fractal':
        return this.createFractalReservoir(group, color);
      case 'drum':
      case 'archive':
        return this.createArchiveDrum(group, color);
      default:
        console.warn(`[StorageNodesVisual] Unknown storage node: '${name}'. Creating Obelisk.`);
        return this.createObeliskCache(group, color);
    }
  }
}

export default StorageNodesVisual;
