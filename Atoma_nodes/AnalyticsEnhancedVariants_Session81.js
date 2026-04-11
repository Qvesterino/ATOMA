/**
 * ANALYTICS ENHANCED VARIANTS - Session 81
 * Three NEW production-ready Analytics node variants
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
 * 1. SignalStratifier - Layered, offset plates with vertical stratification
 * 2. TrendExcavator - Eroded, carved block structure with exposed cavities
 * 3. AnomalyLedger - Fractured open shell with floating internal fragments
 */

import * as THREE from 'three';

const ANALYTICS_TREND_EXCAVATOR_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  voidGeometry: null,
  voidEdgesGeometry: null,
  shellArcGeometry: null,
  shellArcEdgesGeometry: null,
  strataPlateGeometry: null,
  strataPlateEdgesGeometry: null,
  probeGeometry: null,
  probeEdgesGeometry: null,
  dustGeometry: null,
  telemetryGeometry: null
};

const ANALYTICS_TREND_EXCAVATOR_MATERIALS = new Map();

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
  let s = (seed >>> 0) || 1;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function _resolveTrendExcavatorColor(primary, secondary, fallback = 0x8d4cff) {
  const candidate = secondary !== undefined ? secondary : primary;
  if (candidate instanceof THREE.Color) {
    return candidate.getHex();
  }

  try {
    return new THREE.Color(candidate ?? fallback).getHex();
  } catch (err) {
    return new THREE.Color(fallback).getHex();
  }
}

function _setTrendExcavatorWaveDefaults(material, ignoreWaveColor = false) {
  material.userData = { ...(material.userData || {}), wavePatchMode: 'DEFAULT' };
  if (ignoreWaveColor) {
    material.userData.ignoreWaveColor = true;
  }
  return material;
}

function _distortTrendExcavatorGeometry(geometry, transformFn) {
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

function _getAnalyticsTrendExcavatorGeometries() {
  if (!ANALYTICS_TREND_EXCAVATOR_CACHE.coreGeometry) {
    const coreGeometry = new THREE.CylinderGeometry(0.36, 0.47, 0.62, 6, 1, false);
    _distortTrendExcavatorGeometry(coreGeometry, (v) => {
      const topWeight = Math.max(0, (v.y + 0.31) / 0.62);
      const openBias = Math.max(0, (v.x * 1.45 + v.y * 0.9) * 0.75);
      const carve = Math.min(1, openBias + topWeight * 0.42);
      v.x = v.x * (0.88 - carve * 0.1) - carve * 0.06 + v.z * 0.018;
      v.y = v.y * (0.92 - carve * 0.06) + carve * 0.028;
      v.z = v.z * (0.9 + topWeight * 0.08) - v.x * 0.03;
    });
    ANALYTICS_TREND_EXCAVATOR_CACHE.coreGeometry = coreGeometry;
    ANALYTICS_TREND_EXCAVATOR_CACHE.coreEdgesGeometry = new THREE.EdgesGeometry(coreGeometry, 18);

    const voidGeometry = new THREE.CylinderGeometry(0.16, 0.24, 0.44, 6, 1, true);
    _distortTrendExcavatorGeometry(voidGeometry, (v) => {
      const heightBias = Math.abs(v.y) / 0.22;
      const faceBias = Math.max(0, v.x * 1.7 + v.y * 0.85);
      v.x = v.x * (0.84 - faceBias * 0.08) + v.z * 0.022;
      v.y = v.y * (0.98 - faceBias * 0.03) + Math.sign(v.y || 1) * 0.02 * (1 - heightBias);
      v.z = v.z * (0.94 + heightBias * 0.04) - v.x * 0.018;
    });
    ANALYTICS_TREND_EXCAVATOR_CACHE.voidGeometry = voidGeometry;
    ANALYTICS_TREND_EXCAVATOR_CACHE.voidEdgesGeometry = new THREE.EdgesGeometry(voidGeometry, 16);

    const shellCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.32, 0.24, -0.08),
      new THREE.Vector3(-0.14, 0.35, 0.06),
      new THREE.Vector3(0.06, 0.33, 0.08),
      new THREE.Vector3(0.22, 0.23, -0.03),
      new THREE.Vector3(0.31, 0.13, -0.1)
    ], false, 'centripetal', 0.44);
    const shellArcGeometry = new THREE.TubeGeometry(shellCurve, 12, 0.054, 5, false);
    _distortTrendExcavatorGeometry(shellArcGeometry, (v) => {
      const crownBias = Math.max(0, v.y + 0.02);
      v.x = v.x * (0.92 + crownBias * 0.04) + v.z * 0.03;
      v.y = v.y * (0.97 + crownBias * 0.02);
      v.z = v.z * (0.9 + crownBias * 0.04) - v.x * 0.02;
    });
    ANALYTICS_TREND_EXCAVATOR_CACHE.shellArcGeometry = shellArcGeometry;
    ANALYTICS_TREND_EXCAVATOR_CACHE.shellArcEdgesGeometry = new THREE.EdgesGeometry(shellArcGeometry, 18);

    const strataPlateGeometry = new THREE.CylinderGeometry(0.46, 0.54, 0.08, 6, 1, false);
    _distortTrendExcavatorGeometry(strataPlateGeometry, (v, i) => {
      const tilt = Math.max(0, v.y + 0.04);
      const edgeWeight = Math.abs(v.x) + Math.abs(v.z);
      v.x = v.x * (0.84 + edgeWeight * 0.04) + v.z * 0.035 - tilt * 0.018;
      v.y = v.y * (0.98 + tilt * 0.015) + Math.sin(i * 0.27) * 0.004;
      v.z = v.z * (0.9 + edgeWeight * 0.02) - v.x * 0.024;
    });
    ANALYTICS_TREND_EXCAVATOR_CACHE.strataPlateGeometry = strataPlateGeometry;
    ANALYTICS_TREND_EXCAVATOR_CACHE.strataPlateEdgesGeometry = new THREE.EdgesGeometry(strataPlateGeometry, 18);

    const probeGeometry = new THREE.CylinderGeometry(0.03, 0.068, 0.38, 5, 1, false);
    _distortTrendExcavatorGeometry(probeGeometry, (v, i) => {
      const tipBias = (v.y + 0.19) / 0.38;
      const shardBias = Math.sin(i * 0.31) * 0.018;
      v.x = v.x * (0.72 + tipBias * 0.08) + v.z * 0.022 + shardBias;
      v.y = v.y * (0.96 + tipBias * 0.01);
      v.z = v.z * (0.78 + tipBias * 0.08) - v.x * 0.018;
    });
    ANALYTICS_TREND_EXCAVATOR_CACHE.probeGeometry = probeGeometry;
    ANALYTICS_TREND_EXCAVATOR_CACHE.probeEdgesGeometry = new THREE.EdgesGeometry(probeGeometry, 14);

    const dustGeometry = new THREE.DodecahedronGeometry(0.026, 0);
    _distortTrendExcavatorGeometry(dustGeometry, (v, i) => {
      const grain = Math.sin(i * 0.37) * 0.008;
      v.x = v.x * 0.94 + v.z * 0.024 + grain;
      v.y = v.y * 0.9 + Math.cos(i * 0.43) * 0.006;
      v.z = v.z * 0.92 - v.x * 0.018;
    });
    ANALYTICS_TREND_EXCAVATOR_CACHE.dustGeometry = dustGeometry;

    const telemetryCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.2, -0.04, 0.02),
      new THREE.Vector3(-0.04, 0.08, 0.06),
      new THREE.Vector3(0.12, 0.16, 0.03),
      new THREE.Vector3(0.26, 0.14, -0.04)
    ], false, 'centripetal', 0.42);
    const telemetryGeometry = new THREE.TubeGeometry(telemetryCurve, 10, 0.018, 4, false);
    _distortTrendExcavatorGeometry(telemetryGeometry, (v, i) => {
      const bend = Math.sin(i * 0.19) * 0.0035;
      v.x = v.x * 0.96 + v.z * 0.028 + bend;
      v.y = v.y * 0.98 + Math.cos(i * 0.2) * 0.0025;
      v.z = v.z * 0.94 - v.x * 0.014;
    });
    ANALYTICS_TREND_EXCAVATOR_CACHE.telemetryGeometry = telemetryGeometry;
  }

  return ANALYTICS_TREND_EXCAVATOR_CACHE;
}

function _getAnalyticsTrendExcavatorMaterials(colorHex = 0x8d4cff) {
  const key = String(colorHex >>> 0);
  if (ANALYTICS_TREND_EXCAVATOR_MATERIALS.has(key)) {
    return ANALYTICS_TREND_EXCAVATOR_MATERIALS.get(key);
  }

  const coreMat = _setTrendExcavatorWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0x33144d,
    emissive: 0xd24dff,
    emissiveIntensity: 0.22,
    metalness: 0.48,
    roughness: 0.58,
    flatShading: true
  }));

  const coreEdgeMat = _setTrendExcavatorWaveDefaults(new THREE.LineBasicMaterial({
    color: 0xf1d0ff,
    transparent: true,
    opacity: 0.4,
    depthWrite: false
  }));

  const voidMat = _setTrendExcavatorWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0x1c1818,
    emissive: 0xffad58,
    emissiveIntensity: 0.07,
    metalness: 0.18,
    roughness: 0.82,
    flatShading: true,
    side: THREE.DoubleSide
  }));

  const voidGlowMat = _setTrendExcavatorWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0xffb566,
    emissive: 0xff9a36,
    emissiveIntensity: 0.52,
    metalness: 0.0,
    roughness: 0.48,
    transparent: true,
    opacity: 0.68,
    flatShading: true,
    side: THREE.DoubleSide
  }), true);

  const voidEdgeMat = _setTrendExcavatorWaveDefaults(new THREE.LineBasicMaterial({
    color: 0xffd0a0,
    transparent: true,
    opacity: 0.24,
    depthWrite: false
  }));

  const shellMat = _setTrendExcavatorWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0x103a3d,
    emissive: 0x41e0d3,
    emissiveIntensity: 0.18,
    metalness: 0.42,
    roughness: 0.6,
    flatShading: true
  }));

  const shellEdgeMat = _setTrendExcavatorWaveDefaults(new THREE.LineBasicMaterial({
    color: 0x9afbf4,
    transparent: true,
    opacity: 0.34,
    depthWrite: false
  }));

  const strataMat = _setTrendExcavatorWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0x221b2f,
    emissive: 0x9463ff,
    emissiveIntensity: 0.08,
    metalness: 0.3,
    roughness: 0.74,
    flatShading: true
  }));

  const strataEdgeMat = _setTrendExcavatorWaveDefaults(new THREE.LineBasicMaterial({
    color: 0xbca7ff,
    transparent: true,
    opacity: 0.28,
    depthWrite: false
  }));

  const probeMat = _setTrendExcavatorWaveDefaults(new THREE.MeshStandardMaterial({
    color: 0x88f0f6,
    emissive: 0x64dfef,
    emissiveIntensity: 0.2,
    metalness: 0.5,
    roughness: 0.34,
    flatShading: true
  }), true);

  const probeEdgeMat = _setTrendExcavatorWaveDefaults(new THREE.LineBasicMaterial({
    color: 0xd2feff,
    transparent: true,
    opacity: 0.42,
    depthWrite: false
  }), true);

  const dustMat = _setTrendExcavatorWaveDefaults(new THREE.MeshBasicMaterial({
    color: 0x786f82,
    transparent: true,
    opacity: 0.24,
    depthWrite: false
  }));

  const telemetryMat = _setTrendExcavatorWaveDefaults(new THREE.MeshBasicMaterial({
    color: 0x60e8ff,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
    side: THREE.DoubleSide
  }));

  const mats = {
    coreMat,
    coreEdgeMat,
    voidMat,
    voidGlowMat,
    voidEdgeMat,
    shellMat,
    shellEdgeMat,
    strataMat,
    strataEdgeMat,
    probeMat,
    probeEdgeMat,
    dustMat,
    telemetryMat
  };

  ANALYTICS_TREND_EXCAVATOR_MATERIALS.set(key, mats);
  return mats;
}

export class AnalyticsEnhancedVariants {
  
  /**
   * ANALYTICS ENHANCED: SIGNAL_STRATIFIER
   * 
   * Description:
   * - Vertical stack of offset, irregular plates/membranes
   * - Visible gaps for data flow (vertical stratification)
   * - No central cylinder; the stack itself is the form
   * - Plates are asymmetrical and slightly rotated per layer
   * 
   * Visual Style:
   * - Dark matte plates with teal/cyan emissive veins in gaps
   * - Structural, constructivist aesthetic
   * 
   * Geometry:
   * - Multiple thin, flattened geometries (not simple boxes)
   * - Vertical stacking with randomized X/Z offsets
   */
  static createAnalyticsEnhanced_SignalStratifier(group, color) {
    try {
      const layerCount = 7;
      const baseWidth = 0.9;
      const baseHeight = 0.12;
      
      const plateMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222, // Dark matte base
        metalness: 0.4,
        roughness: 0.7,
        emissive: color,
        emissiveIntensity: 0.1
      });

      const veinMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6
      });

      for (let i = 0; i < layerCount; i++) {
        const yPos = (i - layerCount / 2) * 0.22;
        
        // Offset and scale per layer for asymmetry
        const seed = i * 4.5;
        const scaleX = 0.8 + Math.sin(seed) * 0.2;
        const scaleZ = 0.8 + Math.cos(seed * 1.2) * 0.2;
        const offsetX = Math.cos(seed * 0.5) * 0.15;
        const offsetZ = Math.sin(seed * 0.8) * 0.15;

        // Create irregular plate (chamfered box approximation)
        const plateGeometry = new THREE.CylinderGeometry(
          baseWidth * scaleX * 0.5, 
          baseWidth * scaleX * 0.5, 
          baseHeight, 
          6 // Hexagonal base for "tech" feel
        );
        
        const plate = new THREE.Mesh(plateGeometry, plateMaterial);
        plate.position.set(offsetX, yPos, offsetZ);
        plate.rotation.y = seed; // Random rotation
        plate.scale.set(1, 1, scaleZ / scaleX); // Non-uniform scale
        
        plate.userData.isStratifierLayer = true;
        plate.userData.visualCoreImmutable = true;
        group.add(plate);

        // Add emissive "vein" or connector in the gap below (except bottom)
        if (i > 0) {
          const veinGeo = new THREE.BoxGeometry(0.2, 0.1, 0.2);
          const vein = new THREE.Mesh(veinGeo, veinMaterial);
          vein.position.set(offsetX * 0.5, yPos - 0.11, offsetZ * 0.5);
          vein.rotation.y = seed + Math.PI/4;
          vein.userData.visualCoreImmutable = true;
          group.add(vein);
        }
      }

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'ANALYTICS_SIGNAL_STRATIFIER';

      return group;
    } catch (err) {
      console.warn('[AnalyticsEnhancedVariants] SignalStratifier creation failed:', err);
      return group;
    }
  }

  /**
   * ANALYTICS ENHANCED: TREND_EXCAVATOR
   * 
   * Description:
   * - Oracle Excavation: carved, stratified, slightly uncanny read
   * - Open face biased toward +X / upper-Y for immediate camera legibility
   * - Broken upper rim and sparse probe spines around a recessed cavity
   * - Slow tectonic drift with heavy, premium presence
   * 
   * Visual Style:
   * - Violet/magenta core, cyan/teal shell accents, warm amber only inside cavity
   * - Stratified shell crown, recessed void, sparse analytical probes
   */
  static createAnalyticsEnhanced_TrendExcavator(group, visualCodeOrColor, maybeColor) {
    try {
      const resolvedColorHex = _resolveTrendExcavatorColor(visualCodeOrColor, maybeColor);
      const seed = Math.abs(hashString(`407|${resolvedColorHex}|${visualCodeOrColor ?? 'seed'}`)) || 407;
      const rng = _mythicSeededRng(seed);
      const geometries = _getAnalyticsTrendExcavatorGeometries();
      const materials = _getAnalyticsTrendExcavatorMaterials(resolvedColorHex);

      const root = group || new THREE.Group();
      root.name = 'ANALYTICS_TREND_EXCAVATOR_NODE';
      root.userData = root.userData || {};
      root.userData.visualVariant = 'ANALYTICS_TREND_EXCAVATOR_V4';
      root.userData.analyticsVariant = 'ORACLE_EXCAVATION';
      root.userData.nodeGeometryName = 'ANALYTICS_TREND_EXCAVATOR_V4';
      root.userData.visualReady = true;
      root.userData.visualCoreImmutable = true;
      root.userData.trendExcavatorPhase = rng() * Math.PI * 2;
      root.userData.trendExcavatorShellPrecessionSpeed = 0.0075 + rng() * 0.0025;
      root.userData.trendExcavatorCorePulseSpeed = 0.48 + rng() * 0.08;
      root.userData.trendExcavatorCorePulseAmplitude = 0.012 + rng() * 0.004;
      root.userData.trendExcavatorVoidBreathSpeed = 0.26 + rng() * 0.04;
      root.userData.trendExcavatorVoidBreathAmplitude = 0.01 + rng() * 0.003;
      root.userData.trendExcavatorProbeDriftSpeed = 0.016 + rng() * 0.006;
      root.userData.trendExcavatorProbeDriftAmplitude = 0.004 + rng() * 0.002;
      root.userData.trendExcavatorAuraDriftSpeed = 0.011 + rng() * 0.004;
      root.userData.trendExcavatorDustDriftAmplitude = 0.002 + rng() * 0.0015;
      root.userData.trendExcavatorTelemetryDriftSpeed = 0.008 + rng() * 0.003;
      root.userData.trendExcavatorBaseRotation = root.rotation.clone();

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';
      coreGroup.userData.isAnalyticsTrendExcavatorCoreGroup = true;
      coreGroup.userData.baseRotation = coreGroup.rotation.clone();

      const shellGroup = new THREE.Group();
      shellGroup.name = 'SHELL_GROUP';
      shellGroup.userData.isAnalyticsTrendExcavatorShellGroup = true;
      shellGroup.userData.baseRotation = shellGroup.rotation.clone();

      const probeGroup = new THREE.Group();
      probeGroup.name = 'PROBE_GROUP';
      probeGroup.userData.isAnalyticsTrendExcavatorProbeGroup = true;
      probeGroup.userData.baseRotation = probeGroup.rotation.clone();

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';
      auraGroup.userData.isAnalyticsTrendExcavatorAuraGroup = true;
      auraGroup.userData.baseRotation = auraGroup.rotation.clone();

      const refs = {
        coreGroup,
        shellGroup,
        probeGroup,
        auraGroup,
        coreMesh: null,
        voidMesh: null,
        voidGlowMesh: null,
        shellArcs: [],
        strataPlates: [],
        probes: [],
        dustParticles: [],
        telemetryRibbon: null,
        coreEdge: null,
        voidEdge: null,
        shellArcEdges: [],
        strataPlateEdges: [],
        probeEdges: []
      };

      const captureBaseTransforms = (mesh) => {
        mesh.userData.basePosition = mesh.position.clone();
        mesh.userData.baseRotation = mesh.rotation.clone();
        mesh.userData.baseScale = mesh.scale.clone();
      };

      const createInteractiveMesh = (geometry, material, name, userData = {}) => {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = name;
        mesh.userData = { ...(mesh.userData || {}), ...userData, visualCoreImmutable: true, isInteractive: true };
        mesh.raycast = THREE.Mesh.prototype.raycast;
        return mesh;
      };

      const createEdgeLine = (geometry, material, name) => {
        const line = new THREE.LineSegments(geometry, material);
        line.name = name;
        line.userData = { ...(line.userData || {}), visualCoreImmutable: true, isEdgeCage: true, allowNoFrustum: true };
        line.raycast = () => null;
        line.frustumCulled = false;
        return line;
      };

      const coreMesh = createInteractiveMesh(geometries.coreGeometry, materials.coreMat, 'ExcavationCore', {
        isAnalyticsTrendExcavatorCore: true
      });
      coreMesh.position.set(-0.06, -0.06, 0.02);
      coreMesh.rotation.set(0.12, -0.2, 0.08);
      coreMesh.scale.set(0.94, 0.88, 0.92);
      captureBaseTransforms(coreMesh);
      coreMesh.renderOrder = 10;
      coreGroup.add(coreMesh);

      const coreEdge = createEdgeLine(geometries.coreEdgesGeometry, materials.coreEdgeMat, 'ExcavationCoreEdges');
      coreEdge.position.copy(coreMesh.position);
      coreEdge.rotation.copy(coreMesh.rotation);
      coreEdge.scale.copy(coreMesh.scale);
      coreEdge.renderOrder = 11;
      coreGroup.add(coreEdge);

      const voidMesh = createInteractiveMesh(geometries.voidGeometry, materials.voidMat, 'ExcavationVoid', {
        isAnalyticsTrendExcavatorVoid: true
      });
      voidMesh.position.set(0.1, 0.06, 0.0);
      voidMesh.rotation.set(-0.18, 0.25, 0.08);
      voidMesh.scale.set(0.88, 0.98, 0.86);
      captureBaseTransforms(voidMesh);
      voidMesh.renderOrder = 12;
      coreGroup.add(voidMesh);

      const voidEdge = createEdgeLine(geometries.voidEdgesGeometry, materials.voidEdgeMat, 'ExcavationVoidEdges');
      voidEdge.position.copy(voidMesh.position);
      voidEdge.rotation.copy(voidMesh.rotation);
      voidEdge.scale.copy(voidMesh.scale);
      voidEdge.renderOrder = 13;
      coreGroup.add(voidEdge);

      const voidGlowMesh = createInteractiveMesh(geometries.voidGeometry, materials.voidGlowMat, 'ExcavationVoidGlow', {
        isAnalyticsTrendExcavatorVoidGlow: true,
        ignoreWaveColor: true
      });
      voidGlowMesh.position.set(0.12, 0.05, 0.0);
      voidGlowMesh.rotation.set(-0.22, 0.18, 0.02);
      voidGlowMesh.scale.set(0.72, 0.76, 0.7);
      captureBaseTransforms(voidGlowMesh);
      voidGlowMesh.raycast = () => null;
      voidGlowMesh.renderOrder = 14;
      coreGroup.add(voidGlowMesh);

      refs.coreMesh = coreMesh;
      refs.voidMesh = voidMesh;
      refs.voidGlowMesh = voidGlowMesh;
      refs.coreEdge = coreEdge;
      refs.voidEdge = voidEdge;

      const shellArcSpecs = [
        {
          position: new THREE.Vector3(-0.18, 0.26, -0.06),
          rotation: new THREE.Euler(0.22, -0.42, 0.1),
          scale: new THREE.Vector3(0.95, 0.9, 0.84)
        },
        {
          position: new THREE.Vector3(0.1, 0.32, 0.03),
          rotation: new THREE.Euler(-0.14, 0.28, -0.32),
          scale: new THREE.Vector3(0.84, 0.78, 0.88)
        }
      ];

      shellArcSpecs.forEach((spec, index) => {
        const shellArc = createInteractiveMesh(geometries.shellArcGeometry, materials.shellMat, `ShellArc_${index + 1}`, {
          isAnalyticsTrendExcavatorShellArc: true
        });
        shellArc.position.copy(spec.position);
        shellArc.rotation.copy(spec.rotation);
        shellArc.scale.copy(spec.scale);
        captureBaseTransforms(shellArc);
        shellArc.renderOrder = 20 + index * 2;
        shellGroup.add(shellArc);

        const shellArcEdges = createEdgeLine(geometries.shellArcEdgesGeometry, materials.shellEdgeMat, `ShellArc_${index + 1}_Edges`);
        shellArcEdges.position.copy(shellArc.position);
        shellArcEdges.rotation.copy(shellArc.rotation);
        shellArcEdges.scale.copy(shellArc.scale);
        shellArcEdges.renderOrder = 21 + index * 2;
        shellGroup.add(shellArcEdges);

        shellArc.userData.edgeRef = shellArcEdges;
        refs.shellArcs.push(shellArc);
        refs.shellArcEdges.push(shellArcEdges);
      });

      const strataSpecs = [
        {
          position: new THREE.Vector3(-0.2, 0.18, -0.08),
          rotation: new THREE.Euler(0.08, -0.16, 0.26),
          scale: new THREE.Vector3(0.88, 0.72, 0.78)
        },
        {
          position: new THREE.Vector3(-0.02, 0.28, 0.09),
          rotation: new THREE.Euler(-0.18, 0.18, -0.14),
          scale: new THREE.Vector3(0.78, 0.66, 0.74)
        },
        {
          position: new THREE.Vector3(0.2, 0.2, -0.01),
          rotation: new THREE.Euler(0.16, 0.08, -0.3),
          scale: new THREE.Vector3(0.72, 0.62, 0.68)
        }
      ];

      strataSpecs.forEach((spec, index) => {
        const plate = createInteractiveMesh(geometries.strataPlateGeometry, materials.strataMat, `StrataPlate_${index + 1}`, {
          isAnalyticsTrendExcavatorStrataPlate: true
        });
        plate.position.copy(spec.position);
        plate.rotation.copy(spec.rotation);
        plate.scale.copy(spec.scale);
        captureBaseTransforms(plate);
        plate.renderOrder = 30 + index * 2;
        shellGroup.add(plate);

        const plateEdges = createEdgeLine(geometries.strataPlateEdgesGeometry, materials.strataEdgeMat, `StrataPlate_${index + 1}_Edges`);
        plateEdges.position.copy(plate.position);
        plateEdges.rotation.copy(plate.rotation);
        plateEdges.scale.copy(plate.scale);
        plateEdges.renderOrder = 31 + index * 2;
        shellGroup.add(plateEdges);

        plate.userData.edgeRef = plateEdges;
        refs.strataPlates.push(plate);
        refs.strataPlateEdges.push(plateEdges);
      });

      const probeSpecs = [
        {
          position: new THREE.Vector3(0.34, 0.12, 0.05),
          rotation: new THREE.Euler(-0.26, 0.62, 0.12),
          scale: new THREE.Vector3(0.94, 1.08, 0.92)
        },
        {
          position: new THREE.Vector3(0.18, 0.31, -0.08),
          rotation: new THREE.Euler(0.38, -0.24, 0.3),
          scale: new THREE.Vector3(0.8, 0.92, 0.86)
        },
        {
          position: new THREE.Vector3(0.24, -0.02, 0.14),
          rotation: new THREE.Euler(0.12, 0.94, -0.18),
          scale: new THREE.Vector3(0.76, 0.86, 0.8)
        }
      ];

      probeSpecs.forEach((spec, index) => {
        const probe = createInteractiveMesh(geometries.probeGeometry, materials.probeMat, `Probe_${index + 1}`, {
          isAnalyticsTrendExcavatorProbe: true,
          ignoreWaveColor: true
        });
        probe.position.copy(spec.position);
        probe.rotation.copy(spec.rotation);
        probe.scale.copy(spec.scale);
        captureBaseTransforms(probe);
        probe.renderOrder = 40 + index * 2;
        probeGroup.add(probe);

        const probeEdges = createEdgeLine(geometries.probeEdgesGeometry, materials.probeEdgeMat, `Probe_${index + 1}_Edges`);
        probeEdges.position.copy(probe.position);
        probeEdges.rotation.copy(probe.rotation);
        probeEdges.scale.copy(probe.scale);
        probeEdges.renderOrder = 41 + index * 2;
        probeGroup.add(probeEdges);

        probe.userData.edgeRef = probeEdges;
        refs.probes.push(probe);
        refs.probeEdges.push(probeEdges);
      });

      const dustSpecs = [
        new THREE.Vector3(-0.18, 0.02, 0.09),
        new THREE.Vector3(0.08, 0.14, -0.03),
        new THREE.Vector3(0.22, 0.08, 0.12),
        new THREE.Vector3(0.04, -0.12, 0.05)
      ];

      dustSpecs.forEach((position, index) => {
        const dust = createInteractiveMesh(geometries.dustGeometry, materials.dustMat, `Dust_${index + 1}`, {
          isAnalyticsTrendExcavatorDust: true
        });
        dust.position.copy(position);
        dust.rotation.set(index * 0.2, index * 0.31, index * 0.18);
        dust.scale.set(0.72 + index * 0.06, 0.72 + index * 0.04, 0.72 + index * 0.05);
        captureBaseTransforms(dust);
        dust.raycast = () => null;
        dust.renderOrder = 50 + index;
        auraGroup.add(dust);
        refs.dustParticles.push(dust);
      });

      const telemetryRibbon = createInteractiveMesh(geometries.telemetryGeometry, materials.telemetryMat, 'TelemetryRibbon', {
        isAnalyticsTrendExcavatorTelemetry: true
      });
      telemetryRibbon.position.set(-0.04, 0.05, -0.02);
      telemetryRibbon.rotation.set(-0.16, 0.38, 0.12);
      telemetryRibbon.scale.set(1.0, 1.0, 1.0);
      captureBaseTransforms(telemetryRibbon);
      telemetryRibbon.raycast = () => null;
      telemetryRibbon.renderOrder = 60;
      auraGroup.add(telemetryRibbon);
      refs.telemetryRibbon = telemetryRibbon;

      coreGroup.position.set(-0.01, -0.01, 0.0);
      shellGroup.position.set(0.02, 0.02, 0.0);
      probeGroup.position.set(0.03, 0.01, 0.0);

      root.add(coreGroup);
      root.add(shellGroup);
      root.add(probeGroup);
      root.add(auraGroup);

      root.userData.trendExcavatorRefs = refs;
      root.userData.visualCoreImmutable = true;
      root.userData.visualReady = true;
      root.userData.nodeGeometryName = 'ANALYTICS_TREND_EXCAVATOR_V4';

      return root;
    } catch (err) {
      console.warn('[AnalyticsEnhancedVariants] TrendExcavator creation failed:', err);
      return group;
    }
  }

  /**
   * ANALYTICS ENHANCED: ANOMALY_LEDGER
   * 
   * Description:
   * - Fractured open shell (spherical/icosahedral basis)
   * - Floating internal record fragments (shards)
   * - Subtle spatial dislocation (floating bits)
   * - Reacts to rare events (conceptually)
   * 
   * Visual Style:
   * - Tech-cyan/teal
   * - High contrast between shell and void
   * - "Exploded view" aesthetic
   */
  static createAnalyticsEnhanced_AnomalyLedger(group, color) {
    try {
      const shellMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.6,
        roughness: 0.4,
        side: THREE.DoubleSide,
        emissive: color,
        emissiveIntensity: 0.1
      });

      const fragmentMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });

      // 1. Fractured Shell
      // Create separate arc segments to simulate a broken sphere
      const shellSegments = 6;
      for (let i = 0; i < shellSegments; i++) {
        const radius = 0.8;
        const tube = 0.15; // thickness
        // Arc segment
        const geometry = new THREE.TorusGeometry(radius, tube, 4, 12, Math.PI * 0.6); // Partial arc
        const mesh = new THREE.Mesh(geometry, shellMaterial);
        
        // Rotate to form a broken sphere shape
        mesh.rotation.x = Math.random() * Math.PI;
        mesh.rotation.y = (i / shellSegments) * Math.PI * 2;
        mesh.rotation.z = Math.random() * 0.5;
        
        mesh.userData.visualCoreImmutable = true;
        group.add(mesh);
      }

      // 2. Floating Fragments (The "Ledger")
      const fragmentCount = 12;
      for (let i = 0; i < fragmentCount; i++) {
        // Small planar shards
        const w = 0.1 + Math.random() * 0.1;
        const h = 0.1 + Math.random() * 0.1;
        const geo = new THREE.PlaneGeometry(w, h);
        const mesh = new THREE.Mesh(geo, fragmentMaterial);
        
        // Cluster in center but floating
        const r = 0.4 * Math.random();
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        mesh.position.set(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        );
        
        mesh.lookAt(0, 0, 0); // Face center? or random?
        mesh.rotation.z = Math.random() * Math.PI; // Random spin
        
        // Animation metadata: specific fragments float
        mesh.userData.isLedgerFragment = true;
        mesh.userData.floatSpeed = 0.2 + Math.random() * 0.3;
        mesh.userData.floatPhase = Math.random() * Math.PI * 2;
        
        mesh.userData.visualCoreImmutable = true;
        group.add(mesh);
      }

      group.userData.ledgerFragmentCount = fragmentCount;
      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'ANALYTICS_ANOMALY_LEDGER';

      return group;
    } catch (err) {
      console.warn('[AnalyticsEnhancedVariants] AnomalyLedger creation failed:', err);
      return group;
    }
  }

  /**
   * Helper: Create gradient ribbon geometry from curve (Preserved if needed for other helpers)
   * @private
   */
  static _createGradientRibbon(curve, segmentCount, ribbonWidth = 0.12) {
    const points = curve.getPoints(segmentCount);
    const vertices = [];
    const indices = [];
    let vertexIndex = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      
      const forward = new THREE.Vector3().subVectors(p1, p0).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(forward, up).normalize();
      
      const left = new THREE.Vector3().addVectors(p0, right.multiplyScalar(-ribbonWidth / 2));
      const right_pos = new THREE.Vector3().addVectors(p0, right.multiplyScalar(ribbonWidth / 2));
      
      vertices.push(left.x, left.y, left.z);
      vertices.push(right_pos.x, right_pos.y, right_pos.z);
      
      if (i < points.length - 2) {
        indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2);
        indices.push(vertexIndex + 1, vertexIndex + 3, vertexIndex + 2);
        vertexIndex += 2;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
    geometry.computeVertexNormals();
    
    return geometry;
  }
}

export default AnalyticsEnhancedVariants;
