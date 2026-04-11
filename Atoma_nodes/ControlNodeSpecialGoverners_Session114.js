import * as THREE from 'three';

const CRUCIS_SUPPRESSION_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  voidSeamGeometry: null,
  pressurePillarGeometry: null,
  pressurePillarEdgesGeometry: null,
  pressureTransomGeometry: null,
  pressureTransomEdgesGeometry: null,
  pressureCapGeometry: null,
  pressureCapEdgesGeometry: null,
  clampBraceGeometry: null,
  clampBraceEdgesGeometry: null,
  clampJawGeometry: null,
  clampJawEdgesGeometry: null,
  bleedChannelGeometry: null,
  bleedChannelEdgesGeometry: null,
  bleedSlitGeometry: null,
  bleedMarkerGeometry: null,
  auraTraceGeometry: null,
  dustGeometry: null,
  spillGeometry: null
};

const CRUCIS_SUPPRESSION_MATERIALS = new Map();

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

function _resolveCrucisSuppressionInputs(group, visualCodeOrColor, maybeColor) {
  const visualCode = (typeof visualCodeOrColor === 'number' && visualCodeOrColor <= 4096)
    ? visualCodeOrColor
    : (group?.userData?.visualCode ?? 613);
  const color = (typeof maybeColor === 'number')
    ? maybeColor
    : ((typeof visualCodeOrColor === 'number' && visualCodeOrColor > 4096)
      ? visualCodeOrColor
      : (group?.userData?.color ?? 0xd8c08f));
  return { visualCode, color };
}

function _setCrucisWaveDefaults(material, ignoreWaveColor = false) {
  material.userData = {
    ...(material.userData || {}),
    wavePatchMode: 'DEFAULT'
  };
  if (ignoreWaveColor) {
    material.userData.ignoreWaveColor = true;
  }
  return material;
}

function _getCrucisRenderOrders() {
  const api = globalThis?.EnhancedNodeModels;
  const coreOrder = typeof api?._getCoreRenderOrder === 'function' ? api._getCoreRenderOrder() : 1000;
  const archOrder = typeof api?._getArchetypeRenderOrder === 'function' ? api._getArchetypeRenderOrder() : 1010;
  return { coreOrder, archOrder };
}

function _getCrucisSuppressionBasilicaMaterials(colorHex = 0xd8c08f) {
  const key = String(colorHex >>> 0);
  if (CRUCIS_SUPPRESSION_MATERIALS.has(key)) {
    return CRUCIS_SUPPRESSION_MATERIALS.get(key);
  }

  const accentColor = new THREE.Color(colorHex);

  const coreMat = _setCrucisWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0x131922,
    emissive: 0x203244,
    emissiveIntensity: 0.12,
    metalness: 0.68,
    roughness: 0.26,
    flatShading: true
  }));

  const coreEdgeMat = _setCrucisWaveDefaults(new THREE.LineBasicMaterial({
    color: 0x9fb4c7,
    transparent: true,
    opacity: 0.36,
    depthWrite: false
  }));

  const voidSeamMat = _setCrucisWaveDefaults(new THREE.MeshBasicMaterial({
    color: 0x091018,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    side: THREE.DoubleSide
  }));

  const pressureMat = _setCrucisWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0x2d3844,
    emissive: 0x506271,
    emissiveIntensity: 0.18,
    metalness: 0.82,
    roughness: 0.18,
    flatShading: true
  }));

  const pressureEdgeMat = _setCrucisWaveDefaults(new THREE.LineBasicMaterial({
    color: 0xb5c8d8,
    transparent: true,
    opacity: 0.28,
    depthWrite: false
  }));

  const clampMat = _setCrucisWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0x3a4653,
    emissive: 0x7f8d9a,
    emissiveIntensity: 0.14,
    metalness: 0.88,
    roughness: 0.2,
    flatShading: true
  }));

  const braceMat = _setCrucisWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0x27313d,
    emissive: 0x5f6d7a,
    emissiveIntensity: 0.12,
    metalness: 0.84,
    roughness: 0.26,
    flatShading: true
  }));

  const bleedMat = _setCrucisWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0x2b3744,
    emissive: accentColor.clone().multiplyScalar(0.22),
    emissiveIntensity: 0.08,
    metalness: 0.46,
    roughness: 0.34,
    flatShading: true
  }));

  const bleedEdgeMat = _setCrucisWaveDefaults(new THREE.LineBasicMaterial({
    color: 0xaebccc,
    transparent: true,
    opacity: 0.22,
    depthWrite: false
  }));

  const lockMat = _setCrucisWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0xe8ddb8,
    emissive: 0xf4d9a1,
    emissiveIntensity: 0.42,
    metalness: 0.58,
    roughness: 0.16,
    flatShading: true
  }), true);

  const indicatorMat = _setCrucisWaveDefaults(new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.7,
    metalness: 0.24,
    roughness: 0.18,
    transparent: true,
    opacity: 0.24,
    flatShading: true
  }), true);

  const spillMat = _setCrucisWaveDefaults(new THREE.MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0.82,
    depthWrite: false
  }), true);

  const traceMat = _setCrucisWaveDefaults(new THREE.MeshBasicMaterial({
    color: 0xe0ebf5,
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
    side: THREE.DoubleSide
  }));

  const dustMat = _setCrucisWaveDefaults(new THREE.PointsMaterial({
    color: 0x8f9eaa,
    size: 0.022,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
    sizeAttenuation: true
  }));

  const mats = {
    coreMat,
    coreEdgeMat,
    voidSeamMat,
    pressureMat,
    pressureEdgeMat,
    clampMat,
    braceMat,
    bleedMat,
    bleedEdgeMat,
    lockMat,
    indicatorMat,
    spillMat,
    traceMat,
    dustMat
  };

  CRUCIS_SUPPRESSION_MATERIALS.set(key, mats);
  return mats;
}

/**
 * CONTROL Node Special Governors (Session 114)
 * ============================================================================
 * Three autonomous regulatory nodes that govern network flow without gameplay logic.
 * Each expresses pure mechanical causality through visual encoding.
 * 
 * ΦRIX (Flow Arbiter) — Controls routing arbitration
 * CRUCIS (Suppression Governor) — Controls amplification ceilings  
 * VERTEX (Temporal Gate) — Controls pulse timing/phase (learns behavior)
 * 
 * Design Philosophy:
 * - Feel AI-made, not human-designed
 * - Asymmetric, exposed logic, mechanical overkill
 * - Pure causality: geometry = behavior
 * - No decorative elements (every motion means something)
 * - Animation driven by state: speed, intensity, glow color encode current action
 */

export class ControlNodeSpecialGovernors {

  /**
   * ΦRIX (Flow Arbiter) — Controls routing arbitration
   * 
   * GEOMETRY:
   * - Asymmetric junction-point with rotating decision spine
   * - 4 irregular arms radiating from center (not symmetrical)
   * - Orbiting shards (decision markers)
   * - Central rotating decision sphere (state encoder)
   * 
   * VISUAL ENCODING:
   * - Spine spin speed = traffic load (0 = idle, 1.0+ = congestion)
   * - Arm direction/angle = routing choice (which pulse path proceeds)
   * - Magenta flashes = decisions being made
   * - Arm tension ripples = decision confidence
   * 
   * BEHAVIOR:
   * - Stateless arbiter (learns nothing)
   * - Arbitrates which competing pulses proceed through regional intersections
   * - Emergent risk: Silent takeover via synchronized pulse timing
   */
  static createPhrixFlowArbiter(group, color) {
    try {
      // Base material (will be animated)
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.75,
        roughness: 0.25,
        emissive: color,
        emissiveIntensity: 0.4
      });

      // ===== ROTATING DECISION SPINE =====
      // Asymmetric, irregular spine (not perfectly vertical)
      const spineSegments = 8;
      const spineCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.6, 0.05),      // Bottom (slightly offset)
        new THREE.Vector3(0.08, -0.2, 0.02),   // Lower mid (asymmetric)
        new THREE.Vector3(-0.06, 0.2, -0.03),  // Upper mid (opposite offset)
        new THREE.Vector3(0.04, 0.6, 0.06)     // Top (final offset)
      ]);

      const spineGeometry = new THREE.TubeGeometry(spineCurve, 12, 0.15, 6);
      const spine = new THREE.Mesh(spineGeometry, baseMaterial);
      spine.userData.isDecisionSpine = true;
      spine.userData.spineTwistSpeed = 0.8; // Will be animated
      group.add(spine);

      // ===== CENTRAL DECISION SPHERE (rotating state encoder) =====
      const sphereGeometry = new THREE.SphereGeometry(0.25, 16, 16);
      const sphereMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.9,
        roughness: 0.05,
        emissive: color,
        emissiveIntensity: 0.6
      });
      const decisionSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      decisionSphere.userData.isCentralDecider = true;
      decisionSphere.userData.decisionPhase = 0;
      group.add(decisionSphere);

      // ===== FOUR IRREGULAR ARMS (routing choices) =====
      const armPositions = [
        { pos: [0.7, 0.1, 0], rot: [0, 0, Math.PI / 8] },      // Forward (asymmetric)
        { pos: [-0.75, -0.2, 0], rot: [0, Math.PI, -Math.PI / 6] }, // Back (lower)
        { pos: [0, 0.05, 0.8], rot: [Math.PI / 8, 0, 0] },     // Right (offset)
        { pos: [0, -0.15, -0.72], rot: [-Math.PI / 6, 0, 0] }  // Left (lower)
      ];

      for (let i = 0; i < 4; i++) {
        const armGeometry = new THREE.BoxGeometry(0.18, 0.08, 0.6);
        const arm = new THREE.Mesh(armGeometry, baseMaterial);
        
        const [x, y, z] = armPositions[i].pos;
        arm.position.set(x, y, z);
        
        const [rx, ry, rz] = armPositions[i].rot;
        arm.rotation.set(rx, ry, rz);
        
        arm.userData.armIndex = i;
        arm.userData.armDirection = i * (Math.PI * 2 / 4);
        arm.userData.armTension = 0; // Will oscillate based on traffic
        group.add(arm);
      }

      // ===== ORBITING SHARDS (decision markers) =====
      const shardCount = 6;
      for (let i = 0; i < shardCount; i++) {
        const shardGeometry = new THREE.TetrahedronGeometry(0.12, 1);
        const shard = new THREE.Mesh(shardGeometry, baseMaterial);
        
        const angle = (i / shardCount) * Math.PI * 2;
        const orbitRadius = 0.5;
        
        shard.position.set(
          Math.cos(angle) * orbitRadius,
          Math.sin(i * 0.6) * 0.15,
          Math.sin(angle) * orbitRadius
        );
        
        shard.rotation.set(
          Math.random() * Math.PI,
          angle,
          Math.random() * Math.PI / 2
        );
        
        shard.userData.isDecisionMarker = true;
        shard.userData.shardIndex = i;
        shard.userData.orbitRadius = orbitRadius;
        shard.userData.orbitAngle = angle;
        group.add(shard);
      }

      // Store animation metadata
      group.userData.isPhrix = true;
      group.userData.nodeGeometryName = 'CONTROL_PHRIX_FLOW_ARBITER';
      group.userData.spineTwistSpeed = 0.0;      // Driven by traffic load
      group.userData.decisionPhase = 0;
      group.userData.armTension = 0;             // Driven by routing confidence
      group.userData.trafficLoad = 0;            // External input (0-1)
      group.userData.visualCoreImmutable = false; // Allow animation

      return group;
    } catch (err) {
      console.warn('[ControlNodeSpecialGovernors] ΦRIX creation failed:', err);
      return group;
    }
  }

  /**
   * CRUCIS (Suppression Governor) — Controls amplification ceilings
   * 
   * GEOMETRY:
   * - Basilica-like suppression altar with a compact pressure heart
   * - Partial cruciform pressure shell, asymmetrical compression braces
   * - Clamp limbs and bleed channels that visibly restrain amplitude
   * - Narrow void seam and restrained telemetry aura
   * 
   * VISUAL ENCODING:
   * - Clamp closure = suppression force applied (0-1)
   * - Brace settling = active gating under load
   * - Warm indicator accents = pressure ceiling / lock state
   * - Tiny bleed flicker = controlled release, not leakage
   * 
   * BEHAVIOR:
   * - Mechanically suppresses high-amplitude pulses
   * - Enforces local dominance hierarchy
   * - Cannot be overridden by metrics (purely mechanical)
   * - Emergent risk: Corruption inverts suppression (boosts strong pulses instead)
   */
  static createCrucisSuppressionGovernor(group, visualCodeOrColor, maybeColor) {
    try {
      const { visualCode, color } = _resolveCrucisSuppressionInputs(group, visualCodeOrColor, maybeColor);
      const seed = Math.abs(hashString(`${visualCode}|${color}|CRUCIS_SUPPRESSION_BASILICA`)) || 613;
      const rng = _mythicSeededRng(seed);
      const { coreOrder, archOrder } = _getCrucisRenderOrders();

      if (!CRUCIS_SUPPRESSION_CACHE.coreGeometry) {
        CRUCIS_SUPPRESSION_CACHE.coreGeometry = new THREE.IcosahedronGeometry(0.2, 1);
        CRUCIS_SUPPRESSION_CACHE.coreEdgesGeometry = new THREE.EdgesGeometry(CRUCIS_SUPPRESSION_CACHE.coreGeometry, 16);
        CRUCIS_SUPPRESSION_CACHE.voidSeamGeometry = new THREE.TorusGeometry(0.175, 0.028, 7, 18, Math.PI * 1.58);
        CRUCIS_SUPPRESSION_CACHE.pressurePillarGeometry = new THREE.BoxGeometry(0.34, 0.96, 0.22);
        CRUCIS_SUPPRESSION_CACHE.pressurePillarEdgesGeometry = new THREE.EdgesGeometry(CRUCIS_SUPPRESSION_CACHE.pressurePillarGeometry, 8);
        CRUCIS_SUPPRESSION_CACHE.pressureTransomGeometry = new THREE.BoxGeometry(0.76, 0.14, 0.2);
        CRUCIS_SUPPRESSION_CACHE.pressureTransomEdgesGeometry = new THREE.EdgesGeometry(CRUCIS_SUPPRESSION_CACHE.pressureTransomGeometry, 8);
        CRUCIS_SUPPRESSION_CACHE.pressureCapGeometry = new THREE.BoxGeometry(0.5, 0.08, 0.26);
        CRUCIS_SUPPRESSION_CACHE.pressureCapEdgesGeometry = new THREE.EdgesGeometry(CRUCIS_SUPPRESSION_CACHE.pressureCapGeometry, 8);
        CRUCIS_SUPPRESSION_CACHE.clampBraceGeometry = new THREE.BoxGeometry(0.12, 0.42, 0.1);
        CRUCIS_SUPPRESSION_CACHE.clampBraceEdgesGeometry = new THREE.EdgesGeometry(CRUCIS_SUPPRESSION_CACHE.clampBraceGeometry, 8);
        CRUCIS_SUPPRESSION_CACHE.clampJawGeometry = new THREE.BoxGeometry(0.2, 0.12, 0.16);
        CRUCIS_SUPPRESSION_CACHE.clampJawEdgesGeometry = new THREE.EdgesGeometry(CRUCIS_SUPPRESSION_CACHE.clampJawGeometry, 8);
        CRUCIS_SUPPRESSION_CACHE.bleedChannelGeometry = new THREE.BoxGeometry(0.06, 0.42, 0.06);
        CRUCIS_SUPPRESSION_CACHE.bleedChannelEdgesGeometry = new THREE.EdgesGeometry(CRUCIS_SUPPRESSION_CACHE.bleedChannelGeometry, 8);
        CRUCIS_SUPPRESSION_CACHE.bleedSlitGeometry = new THREE.BoxGeometry(0.1, 0.025, 0.025);
        CRUCIS_SUPPRESSION_CACHE.bleedMarkerGeometry = new THREE.ConeGeometry(0.026, 0.09, 4, 1);
        CRUCIS_SUPPRESSION_CACHE.auraTraceGeometry = new THREE.TorusGeometry(0.72, 0.016, 6, 26, Math.PI * 1.38);
        CRUCIS_SUPPRESSION_CACHE.dustGeometry = new THREE.BufferGeometry();
        CRUCIS_SUPPRESSION_CACHE.spillGeometry = new THREE.SphereGeometry(0.032, 8, 8);
      }

      const materials = _getCrucisSuppressionBasilicaMaterials(color);
      const root = group;
      root.name = 'CONTROL_CRUCIS_SUPPRESSION_BASILICA_NODE';
      root.userData = root.userData || {};
      root.userData.visualVariant = 'CONTROL_CRUCIS_SUPPRESSION_BASILICA_V4';
      root.userData.controlVariant = 'CRUCIS_SUPPRESSION_BASILICA';
      root.userData.nodeGeometryName = 'CONTROL_CRUCIS_SUPPRESSION_BASILICA_V4';
      root.userData.visualReady = true;
      root.userData.visualCoreImmutable = true;
      root.userData.isCrucis = true;
      root.userData.suppressionForce = root.userData.suppressionForce ?? 0;
      root.userData.gripCompression = root.userData.gripCompression ?? 0;
      root.userData.pumpIntensity = root.userData.pumpIntensity ?? 0;
      root.userData.crucisSuppressionPhase = rng() * Math.PI * 2;
      root.userData.crucisSuppressionClampSpeed = 0.0042 + rng() * 0.0014;
      root.userData.crucisSuppressionPressureSpeed = 0.0058 + rng() * 0.0016;
      root.userData.crucisSuppressionBraceSpeed = 0.004 + rng() * 0.0012;
      root.userData.crucisSuppressionBleedSpeed = 0.006 + rng() * 0.0016;
      root.userData.crucisSuppressionAuraSpeed = 0.0032 + rng() * 0.001;
      root.userData.crucisSuppressionBaseRotation = root.rotation.clone();
      root.userData.crucisSuppressionBaseScale = root.scale.clone();
      root.rotation.set((rng() - 0.5) * 0.05, (rng() - 0.5) * 0.24, (rng() - 0.5) * 0.03);
      root.scale.setScalar(0.985 + rng() * 0.02);

      const refs = {
        coreGroup: null,
        pressureGroup: null,
        gripGroup: null,
        bleedGroup: null,
        auraGroup: null,
        coreSeed: null,
        coreEdges: null,
        voidSeam: null,
        pressurePillar: null,
        pressurePillarEdges: null,
        pressureTransom: null,
        pressureTransomEdges: null,
        pressureCap: null,
        pressureCapEdges: null,
        clampAssemblies: [],
        clampJaws: [],
        clampBraces: [],
        clampLocks: [],
        bleedChannels: [],
        bleedChannelEdges: [],
        bleedSlits: [],
        bleedMarkers: [],
        pressureHalo: null,
        warningTrace: null,
        dustPoints: null
      };

      const makeMesh = (parent, geometry, material, name, opts = {}) => {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = name;
        mesh.userData = mesh.userData || {};
        mesh.userData.visualCoreImmutable = true;
        mesh.userData.wavePatchMode = opts.wavePatchMode || 'DEFAULT';
        if (opts.ignoreWaveColor) {
          mesh.userData.ignoreWaveColor = true;
        }
        if (opts.position) mesh.position.set(...opts.position);
        if (opts.rotation) mesh.rotation.set(...opts.rotation);
        if (opts.scale) mesh.scale.set(...opts.scale);
        if (opts.renderOrder !== undefined) mesh.renderOrder = opts.renderOrder;
        mesh.raycast = THREE.Mesh.prototype.raycast;
        parent.add(mesh);
        return mesh;
      };

      const makeStaticMesh = (parent, geometry, material, name, opts = {}) => {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = name;
        mesh.userData = mesh.userData || {};
        mesh.userData.visualCoreImmutable = true;
        mesh.userData.wavePatchMode = opts.wavePatchMode || 'DEFAULT';
        if (opts.ignoreWaveColor) {
          mesh.userData.ignoreWaveColor = true;
        }
        if (opts.position) mesh.position.set(...opts.position);
        if (opts.rotation) mesh.rotation.set(...opts.rotation);
        if (opts.scale) mesh.scale.set(...opts.scale);
        if (opts.renderOrder !== undefined) mesh.renderOrder = opts.renderOrder;
        mesh.raycast = () => null;
        parent.add(mesh);
        return mesh;
      };

      const makeLine = (parent, geometry, material, name, opts = {}) => {
        const line = new THREE.LineSegments(geometry, material);
        line.name = name;
        line.userData = line.userData || {};
        line.userData.visualCoreImmutable = true;
        line.userData.wavePatchMode = opts.wavePatchMode || 'DEFAULT';
        if (opts.ignoreWaveColor) {
          line.userData.ignoreWaveColor = true;
        }
        if (opts.position) line.position.set(...opts.position);
        if (opts.rotation) line.rotation.set(...opts.rotation);
        if (opts.scale) line.scale.set(...opts.scale);
        if (opts.renderOrder !== undefined) line.renderOrder = opts.renderOrder;
        line.raycast = () => null;
        parent.add(line);
        return line;
      };

      const captureBaseTransforms = (object3d) => {
        if (!object3d) return;
        object3d.userData = object3d.userData || {};
        object3d.userData.basePosition = object3d.position.clone();
        object3d.userData.baseRotation = object3d.rotation.clone();
        object3d.userData.baseScale = object3d.scale.clone();
      };

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';
      coreGroup.userData.isCrucisCoreGroup = true;
      coreGroup.userData.baseRotation = coreGroup.rotation.clone();
      root.add(coreGroup);
      refs.coreGroup = coreGroup;

      const coreSeed = makeMesh(coreGroup, CRUCIS_SUPPRESSION_CACHE.coreGeometry, materials.coreMat, 'SuppressionSeed', {
        position: [0.02, 0.02, 0.0],
        rotation: [0.14, -0.1, 0.08],
        scale: [0.88, 0.82, 0.9],
        renderOrder: coreOrder
      });
      coreSeed.userData.isSuppressionSeed = true;
      captureBaseTransforms(coreSeed);
      refs.coreSeed = coreSeed;

      const coreEdges = makeLine(coreGroup, CRUCIS_SUPPRESSION_CACHE.coreEdgesGeometry, materials.coreEdgeMat, 'SuppressionSeedEdges', {
        position: [0.02, 0.02, 0.0],
        rotation: [0.14, -0.1, 0.08],
        scale: [0.88, 0.82, 0.9],
        renderOrder: coreOrder + 0.1
      });
      coreEdges.userData.isSuppressionSeedEdges = true;
      refs.coreEdges = coreEdges;

      const voidSeam = makeStaticMesh(coreGroup, CRUCIS_SUPPRESSION_CACHE.voidSeamGeometry, materials.voidSeamMat, 'SuppressionVoidSeam', {
        position: [0.0, 0.0, 0.0],
        rotation: [Math.PI * 0.5, 0.28, -0.18],
        scale: [1.0, 0.94, 1.0],
        renderOrder: coreOrder + 0.2
      });
      voidSeam.userData.isSuppressionVoidSeam = true;
      captureBaseTransforms(voidSeam);
      refs.voidSeam = voidSeam;

      const pressureGroup = new THREE.Group();
      pressureGroup.name = 'PRESSURE_GROUP';
      pressureGroup.userData.isCrucisPressureGroup = true;
      pressureGroup.userData.baseRotation = pressureGroup.rotation.clone();
      pressureGroup.position.set(0.03, 0.08, -0.02);
      root.add(pressureGroup);
      refs.pressureGroup = pressureGroup;

      const pressurePillar = makeMesh(pressureGroup, CRUCIS_SUPPRESSION_CACHE.pressurePillarGeometry, materials.pressureMat, 'PressurePillar', {
        position: [0.0, 0.04, 0.0],
        rotation: [0.08, 0.04, -0.02],
        scale: [1.06, 1.0, 0.96],
        renderOrder: archOrder + 0.05
      });
      pressurePillar.userData.isPressurePillar = true;
      captureBaseTransforms(pressurePillar);
      refs.pressurePillar = pressurePillar;

      const pressurePillarEdges = makeLine(pressureGroup, CRUCIS_SUPPRESSION_CACHE.pressurePillarEdgesGeometry, materials.pressureEdgeMat, 'PressurePillarEdges', {
        position: [0.0, 0.04, 0.0],
        rotation: [0.08, 0.04, -0.02],
        scale: [1.06, 1.0, 0.96],
        renderOrder: archOrder + 0.06
      });
      pressurePillarEdges.userData.isPressurePillarEdges = true;
      refs.pressurePillarEdges = pressurePillarEdges;

      const pressureTransom = makeMesh(pressureGroup, CRUCIS_SUPPRESSION_CACHE.pressureTransomGeometry, materials.pressureMat, 'PressureTransom', {
        position: [0.11, 0.24, -0.02],
        rotation: [0.06, 0.18, 0.12],
        scale: [1.02, 0.94, 0.9],
        renderOrder: archOrder + 0.08
      });
      pressureTransom.userData.isPressureTransom = true;
      captureBaseTransforms(pressureTransom);
      refs.pressureTransom = pressureTransom;

      const pressureTransomEdges = makeLine(pressureGroup, CRUCIS_SUPPRESSION_CACHE.pressureTransomEdgesGeometry, materials.pressureEdgeMat, 'PressureTransomEdges', {
        position: [0.11, 0.24, -0.02],
        rotation: [0.06, 0.18, 0.12],
        scale: [1.02, 0.94, 0.9],
        renderOrder: archOrder + 0.09
      });
      pressureTransomEdges.userData.isPressureTransomEdges = true;
      refs.pressureTransomEdges = pressureTransomEdges;

      const pressureCap = makeMesh(pressureGroup, CRUCIS_SUPPRESSION_CACHE.pressureCapGeometry, materials.pressureMat, 'PressureCap', {
        position: [0.04, 0.49, 0.01],
        rotation: [0.0, 0.18, -0.05],
        scale: [0.96, 0.98, 0.94],
        renderOrder: archOrder + 0.11
      });
      pressureCap.userData.isPressureCap = true;
      captureBaseTransforms(pressureCap);
      refs.pressureCap = pressureCap;

      const pressureCapEdges = makeLine(pressureGroup, CRUCIS_SUPPRESSION_CACHE.pressureCapEdgesGeometry, materials.pressureEdgeMat, 'PressureCapEdges', {
        position: [0.04, 0.49, 0.01],
        rotation: [0.0, 0.18, -0.05],
        scale: [0.96, 0.98, 0.94],
        renderOrder: archOrder + 0.12
      });
      pressureCapEdges.userData.isPressureCapEdges = true;
      refs.pressureCapEdges = pressureCapEdges;

      const gripGroup = new THREE.Group();
      gripGroup.name = 'GRIP_GROUP';
      gripGroup.userData.isCrucisGripGroup = true;
      gripGroup.userData.baseRotation = gripGroup.rotation.clone();
      root.add(gripGroup);
      refs.gripGroup = gripGroup;

      const clampConfigs = [
        { name: 'ClampAssembly_0', pos: [0.32, 0.16, 0.14], rot: [0.12, 0.18, 0.46], scale: [1.0, 1.18, 0.92], jawOffset: [0.0, 0.28, 0.0], jawScale: [1.0, 1.0, 1.0], inward: [0.2, -0.06, -0.12] },
        { name: 'ClampAssembly_1', pos: [-0.28, -0.08, -0.16], rot: [-0.18, -0.22, -0.34], scale: [0.84, 1.06, 0.86], jawOffset: [0.02, -0.26, 0.0], jawScale: [0.88, 0.94, 0.92], inward: [-0.18, 0.08, 0.1] },
        { name: 'ClampAssembly_2', pos: [0.06, 0.38, -0.22], rot: [0.28, 0.08, -0.14], scale: [0.72, 0.96, 0.76], jawOffset: [0.0, 0.2, 0.0], jawScale: [0.78, 0.82, 0.82], inward: [-0.04, -0.12, 0.16] },
        { name: 'ClampAssembly_3', pos: [-0.02, -0.26, 0.26], rot: [-0.06, 0.3, 0.22], scale: [0.78, 0.88, 0.74], jawOffset: [0.0, -0.18, 0.0], jawScale: [0.82, 0.78, 0.8], inward: [0.08, 0.14, -0.14] }
      ];

      clampConfigs.forEach((cfg, index) => {
        const assembly = new THREE.Group();
        assembly.name = cfg.name;
        assembly.userData.isClampAssembly = true;
        assembly.userData.clampIndex = index;
        assembly.userData.clampAxis = index % 2 === 0 ? 'x' : 'y';
        assembly.userData.inward = new THREE.Vector3(cfg.inward[0], cfg.inward[1], cfg.inward[2]);
        assembly.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        assembly.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        assembly.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        assembly.userData.basePosition = assembly.position.clone();
        assembly.userData.baseRotation = assembly.rotation.clone();
        assembly.userData.baseScale = assembly.scale.clone();
        gripGroup.add(assembly);

        const brace = makeMesh(assembly, CRUCIS_SUPPRESSION_CACHE.clampBraceGeometry, materials.braceMat, `${cfg.name}_Brace`, {
          position: [0.0, 0.0, 0.0],
          rotation: [0.04, 0.06, index === 1 ? -0.08 : 0.08],
          scale: [1.0, 1.0, 1.0],
          renderOrder: archOrder + 0.16
        });
        brace.userData.isClampBrace = true;
        captureBaseTransforms(brace);

        const jaw = makeMesh(assembly, CRUCIS_SUPPRESSION_CACHE.clampJawGeometry, materials.clampMat, `${cfg.name}_Jaw`, {
          position: [cfg.jawOffset[0], cfg.jawOffset[1], cfg.jawOffset[2]],
          rotation: [0.12, 0.18, index === 0 ? 0.1 : -0.12],
          scale: [cfg.jawScale[0], cfg.jawScale[1], cfg.jawScale[2]],
          renderOrder: archOrder + 0.18
        });
        jaw.userData.isClampJaw = true;
        jaw.userData.ignoreWaveColor = false;
        captureBaseTransforms(jaw);

        const lockPin = makeMesh(assembly, CRUCIS_SUPPRESSION_CACHE.clampJawGeometry, materials.lockMat, `${cfg.name}_LockPin`, {
          position: [cfg.jawOffset[0] * 0.48, cfg.jawOffset[1] * 0.4, cfg.jawOffset[2] * 0.38],
          rotation: [0.0, 0.0, 0.0],
          scale: [0.28, 0.2, 0.28],
          renderOrder: archOrder + 0.19,
          ignoreWaveColor: true
        });
        lockPin.userData.isClampLockPin = true;

        assembly.userData.braceRef = brace;
        assembly.userData.jawRef = jaw;
        assembly.userData.lockRef = lockPin;
        refs.clampAssemblies.push(assembly);
        refs.clampBraces.push(brace);
        refs.clampJaws.push(jaw);
        refs.clampLocks.push(lockPin);
      });

      const bleedGroup = new THREE.Group();
      bleedGroup.name = 'BLEED_GROUP';
      bleedGroup.userData.isCrucisBleedGroup = true;
      bleedGroup.userData.baseRotation = bleedGroup.rotation.clone();
      root.add(bleedGroup);
      refs.bleedGroup = bleedGroup;

      const bleedConfigs = [
        { name: 'BleedChannel_0', pos: [0.38, -0.08, 0.0], rot: [0.02, 0.22, 1.1], scale: [1.0, 0.76, 0.86], slitPos: [0.18, -0.02, 0.0], markerPos: [0.28, -0.04, 0.0] },
        { name: 'BleedChannel_1', pos: [-0.22, 0.22, 0.12], rot: [-0.08, -0.28, 0.06], scale: [0.86, 0.62, 0.74], slitPos: [-0.08, 0.1, 0.02], markerPos: [-0.16, 0.18, 0.06] },
        { name: 'BleedChannel_2', pos: [0.1, 0.42, -0.22], rot: [0.18, 0.74, -0.22], scale: [0.72, 0.58, 0.72], slitPos: [0.08, 0.2, -0.1], markerPos: [0.12, 0.28, -0.16] }
      ];

      bleedConfigs.forEach((cfg, index) => {
        const channel = makeMesh(bleedGroup, CRUCIS_SUPPRESSION_CACHE.bleedChannelGeometry, materials.bleedMat, cfg.name, {
          position: cfg.pos,
          rotation: cfg.rot,
          scale: cfg.scale,
          renderOrder: archOrder + 0.24 + index * 0.03
        });
        channel.userData.isBleedChannel = true;
        captureBaseTransforms(channel);

        const channelEdges = makeLine(bleedGroup, CRUCIS_SUPPRESSION_CACHE.bleedChannelEdgesGeometry, materials.bleedEdgeMat, `${cfg.name}_Edges`, {
          position: cfg.pos,
          rotation: cfg.rot,
          scale: cfg.scale,
          renderOrder: archOrder + 0.25 + index * 0.03
        });
        channelEdges.userData.isBleedChannelEdges = true;

        const slit = makeMesh(bleedGroup, CRUCIS_SUPPRESSION_CACHE.bleedSlitGeometry, materials.traceMat, `${cfg.name}_Slit`, {
          position: cfg.slitPos,
          rotation: cfg.rot,
          scale: [1.0, 1.0, 1.0],
          renderOrder: archOrder + 0.27 + index * 0.03
        });
        slit.userData.isBleedSlit = true;
        captureBaseTransforms(slit);

        const marker = makeMesh(bleedGroup, CRUCIS_SUPPRESSION_CACHE.bleedMarkerGeometry, materials.spillMat, `${cfg.name}_Marker`, {
          position: cfg.markerPos,
          rotation: [Math.PI, 0.0, 0.0],
          scale: [1.0, 1.0, 1.0],
          renderOrder: archOrder + 0.29 + index * 0.03,
          ignoreWaveColor: true
        });
        marker.userData.isBleedMarker = true;
        captureBaseTransforms(marker);

        refs.bleedChannels.push(channel);
        refs.bleedChannelEdges.push(channelEdges);
        refs.bleedSlits.push(slit);
        refs.bleedMarkers.push(marker);
      });

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';
      auraGroup.userData.isCrucisAuraGroup = true;
      auraGroup.userData.baseRotation = auraGroup.rotation.clone();
      root.add(auraGroup);
      refs.auraGroup = auraGroup;

      const pressureHalo = makeStaticMesh(auraGroup, CRUCIS_SUPPRESSION_CACHE.auraTraceGeometry, materials.traceMat, 'PressureHaloTrace', {
        position: [0.0, 0.08, 0.0],
        rotation: [Math.PI * 0.5, 0.16, -0.04],
        scale: [1.0, 0.88, 1.0],
        renderOrder: coreOrder - 0.2
      });
      pressureHalo.userData.isPressureHaloTrace = true;
      captureBaseTransforms(pressureHalo);
      refs.pressureHalo = pressureHalo;

      const warningTrace = makeStaticMesh(auraGroup, CRUCIS_SUPPRESSION_CACHE.auraTraceGeometry, materials.indicatorMat, 'WarningTraceArc', {
        position: [0.02, 0.16, 0.0],
        rotation: [Math.PI * 0.5, -0.24, 0.18],
        scale: [0.94, 0.7, 0.94],
        renderOrder: coreOrder - 0.1,
        ignoreWaveColor: true
      });
      warningTrace.userData.isWarningTraceArc = true;
      captureBaseTransforms(warningTrace);
      refs.warningTrace = warningTrace;

      const dustCount = 18;
      const dustPositions = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount; i++) {
        const angle = (i / dustCount) * Math.PI * 2;
        const radius = 0.42 + rng() * 0.24;
        dustPositions[i * 3 + 0] = Math.cos(angle) * radius + (rng() - 0.5) * 0.04;
        dustPositions[i * 3 + 1] = (rng() - 0.5) * 0.32 + Math.sin(angle * 1.4) * 0.05;
        dustPositions[i * 3 + 2] = Math.sin(angle) * radius + (rng() - 0.5) * 0.04;
      }
      CRUCIS_SUPPRESSION_CACHE.dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
      const dust = new THREE.Points(CRUCIS_SUPPRESSION_CACHE.dustGeometry, materials.dustMat);
      dust.name = 'TelemetryDust';
      dust.userData = {
        visualCoreImmutable: true,
        wavePatchMode: 'DEFAULT'
      };
      dust.raycast = () => null;
      dust.renderOrder = coreOrder - 0.3;
      captureBaseTransforms(dust);
      auraGroup.add(dust);
      refs.dustPoints = dust;

      root.userData.crucisSuppressionRefs = refs;
      return root;
    } catch (err) {
      console.warn('[ControlNodeSpecialGovernors] CRUCIS creation failed:', err);
      return group;
    }
  }

  /**
   * VERTEX (Temporal Gate) — Controls pulse timing/phase
   * 
   * GEOMETRY:
   * - Spinning cage (periodic gating structure)
   * - Oscillating spikes (phase detectors)
   * - Rotating chrono-regulator core (internal clock)
   * - Servo cams (learned pattern adapters)
   * 
   * VISUAL ENCODING:
   * - Spike ripples = active gating (wave motion)
   * - Cyan flashes = pulse accepted (phase match)
   * - Red flashes = pulse blocked (phase mismatch)
   * - Servo adjustments visible = learning happening (8-15 minutes to adapt)
   * - Cage rotation speed = adaptive pattern frequency
   * 
   * BEHAVIOR:
   * - Permits pulses only when in-phase with internal cycle
   * - Blocks out-of-phase pulses
   * - **Learns**: Adapts internal rhythm to match dominant pulse patterns over time
   * - Emergent risk: Temporal monopoly (locked to one pulse pattern, unable to unlearn)
   */
  static createVertexTemporalGate(group, color) {
    try {
      // Base material
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.7,
        roughness: 0.3,
        emissive: color,
        emissiveIntensity: 0.35
      });

      // ===== SPINNING CAGE (periodic gating frame) =====
      const cageRadius = 0.65;
      const cageRings = 3;

      for (let ring = 0; ring < cageRings; ring++) {
        const ringRadius = cageRadius * (0.7 + (ring * 0.15));
        const ringGeometry = new THREE.TorusGeometry(ringRadius, 0.08, 16, 64);
        const ringMesh = new THREE.Mesh(ringGeometry, baseMaterial);
        
        // Rotate rings differently (cage effect)
        ringMesh.rotation.set(
          (ring === 0) ? 0 : (ring === 1 ? Math.PI / 3 : Math.PI / 2),
          0,
          (ring % 2) * Math.PI / 4
        );
        
        ringMesh.userData.isCageRing = true;
        ringMesh.userData.ringIndex = ring;
        group.add(ringMesh);
      }

      // ===== OSCILLATING SPIKES (phase detectors) =====
      const spikeCount = 12;
      for (let i = 0; i < spikeCount; i++) {
        const spikeGeometry = new THREE.ConeGeometry(0.08, 0.4, 8);
        const spike = new THREE.Mesh(spikeGeometry, baseMaterial);
        
        const angle = (i / spikeCount) * Math.PI * 2;
        const radius = 0.75;
        
        spike.position.set(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        );
        
        spike.rotation.x = Math.PI / 2;
        spike.lookAt(0, 0, 0);
        
        spike.userData.isPhaseDetectorSpike = true;
        spike.userData.spikeIndex = i;
        spike.userData.spikePhase = angle;
        spike.userData.oscillationAmplitude = 0.1; // Will pulse based on gating
        group.add(spike);
      }

      // ===== ROTATING CHRONO-REGULATOR CORE (internal clock) =====
      const chronoGeometry = new THREE.OctahedronGeometry(0.3, 2);
      const chronoMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.9,
        roughness: 0.1,
        emissive: color,
        emissiveIntensity: 0.6
      });
      const chronoCore = new THREE.Mesh(chronoGeometry, chronoMaterial);
      chronoCore.userData.isChronoRegulator = true;
      chronoCore.userData.internalPhase = 0; // 0-2π, the learned rhythm
      chronoCore.userData.rotationSpeed = 1.0; // Driven by learned pattern
      chronoCore.userData.learningRate = 0.0001; // Slow adaptation (8-15 min scale)
      group.add(chronoCore);

      // ===== SERVO CAMS (learned pattern adapters) =====
      const camCount = 4;
      for (let i = 0; i < camCount; i++) {
        const camGeometry = new THREE.BoxGeometry(0.15, 0.25, 0.08);
        const cam = new THREE.Mesh(camGeometry, baseMaterial);
        
        const angle = (i / camCount) * Math.PI * 2;
        const offset = 0.4;
        
        cam.position.set(
          Math.cos(angle) * offset,
          0.2 + Math.sin(angle) * 0.15,
          Math.sin(angle) * offset
        );
        
        cam.rotation.y = angle;
        cam.userData.isServoCam = true;
        cam.userData.camIndex = i;
        cam.userData.adaptationPhase = 0; // Increments as learning happens
        group.add(cam);
      }

      // ===== PHASE INDICATOR LIGHTS =====
      // Cyan accepted, red blocked (visual feedback)
      const indicatorGeometry = new THREE.SphereGeometry(0.15, 16, 16);
      
      // Accepted indicator (cyan)
      const acceptedMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0
      });
      const acceptedLight = new THREE.Mesh(indicatorGeometry, acceptedMaterial);
      acceptedLight.position.set(0, 0.8, 0);
      acceptedLight.userData.isAcceptedIndicator = true;
      acceptedLight.userData.flashPhase = 0;
      group.add(acceptedLight);

      // Blocked indicator (red)
      const blockedMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0
      });
      const blockedLight = new THREE.Mesh(indicatorGeometry, blockedMaterial);
      blockedLight.position.set(0, -0.8, 0);
      blockedLight.userData.isBlockedIndicator = true;
      blockedLight.userData.flashPhase = 0;
      group.add(blockedLight);

      // Store animation metadata
      group.userData.isVertex = true;
      group.userData.nodeGeometryName = 'CONTROL_VERTEX_TEMPORAL_GATE';
      group.userData.cageRotationSpeed = 1.0;    // Driven by learned pattern
      group.userData.internalPhase = 0;          // 0-2π, the internal rhythm
      group.userData.learnedPatternFreq = 1.0;   // Converges to dominant pulse frequency
      group.userData.learnedPatternPhase = 0;    // Phase offset learned over time
      group.userData.learningRate = 0.0001;      // ~8-15 min to full adaptation
      group.userData.gatingActive = false;       // Current pulse in/out of phase
      group.userData.visualCoreImmutable = false; // Allow animation

      return group;
    } catch (err) {
      console.warn('[ControlNodeSpecialGovernors] VERTEX creation failed:', err);
      return group;
    }
  }

  /**
   * Get special governor by name
   * Usage: ControlNodeSpecialGovernors.createSpecialGovernor('phrix', group, color)
   */
  static createSpecialGovernor(name, group, color) {
    switch (name.toLowerCase()) {
      case 'phrix':
        return this.createPhrixFlowArbiter(group, color);
      case 'crucis':
        return this.createCrucisSuppressionGovernor(group, color);
      case 'vertex':
        return this.createVertexTemporalGate(group, color);
      default:
        console.warn(`[ControlNodeSpecialGovernors] Unknown governor: '${name}'. Creating PHRIX.`);
        return this.createPhrixFlowArbiter(group, color);
    }
  }
}

export default ControlNodeSpecialGovernors;
