import * as THREE from 'three';
import { materialRegistry } from './src/metrics/rendering/MaterialRegistry_v1.js';
import { initMapReferencePlane } from './MapReferencePlaneFactory.js';
import { getMapConfig } from './MapConfigBase.js';

/**
 * Fractal Valley - Recursive mathematical structures
 * Represents AI visualization of pattern formation and logic
 * NOTE: Keep `getGroundLevelAt(x, z)` aligned with the terrain so the player controller can avoid raycast probes.
 * NOTE: Walkable terrain helpers stay tagged as terrain; any true obstacle needs an explicit blocker collider.
 * NOTE: Bridges must stay explicitly above the river channel; keep their deck height and the river carve aligned so the scene reads as one valley, not stacked layers.
 */
export class FractalValley {
  constructor(scene, worldRoot, camera = null) {
    console.log('WORLD CONSTRUCTOR:', this.constructor.name);
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.camera = camera;
    this.mountains = [];
    this.hexTerraces = [];
    this.hexTerraceColliders = [];
    this.fractalFragments = [];
    this.fractalCrystals = [];
    this.fragmentGlowMaterial = null;
    this.fragmentLightningLines = [];
    this.dataRivers = [];
    this.holograms = [];
    this.symbols = [];
    this.bridges = [];
    this.bridgeGroundSurfaces = [];
    this.riverBlockers = [];
    this.collisionObjects = []; // Track collision meshes
    this.playerGroundOffset = 1;
    this.ambientSpores = null;
    this.ambientSporeData = null;
    this.riverDataStream = null;
    this.riverDataStreamData = null;
    this.echoBridgeCrystals = [];
    
    // Session 112+: Initialize map configuration and reference plane
    this.initializeMapConfig();
    this.initializeValleyLayout();
    this.cleanupInheritedWorldArtifacts();
    this.initializeReferencePlane();
    this.createLighting();
    
    // World FX Policy: gate decorative world FX
    this.enableDecorativeWorldFX = this.mapConfig.enableDecorativeWorldFX !== false;
    
    // World Time Modulation Policy: gate time-driven world visual animation
    this.allowWorldTimeModulation = this.mapConfig.allowWorldTimeModulation !== false;
    this.isStaticValley = !this.enableDecorativeWorldFX && !this.allowWorldTimeModulation;
    
    this.createValleyFloor();
    this.createFractalMountains();
    if (!this.isStaticValley) {
      this.createMountainSilhouetteGlow();
    }
    this.createDataRivers();
    this.createRiverBridges();
    this.createMist();
    this.createSkyDome();
    
    // World FX Policy: gate decorative world FX creation
    if (this.enableDecorativeWorldFX) {
      this.createFractalCrystals();
      this.createAmbientSpores();
      this.createRiverDataStream();
      this.createFloatingFragments();
      this.createParticleDrift();
      this.createFractalHolograms();
      this.createFloatingSymbols();
      this.createGeometricConstellations();
      this.createDistortionWaves();
    }
  }
  
  /**
   * Initialize map configuration
   */
  initializeMapConfig() {
    this.mapConfig = getMapConfig('FractalValley');
    console.log(
      `[MAP INIT] ${this.mapConfig.mapId} | theme: ${this.mapConfig.theme} | referencePlane: ${this.mapConfig.referencePlane}`
    );
  }

  initializeValleyLayout() {
    this.palette = {
      skyTop: new THREE.Color(0x0b1020),
      skyHorizon: new THREE.Color(0x252b3a),
      ridgeShadow: new THREE.Color(0x1a2030),
      ridgeMid: new THREE.Color(0x3c4251),
      ridgeLight: new THREE.Color(0x636178),
      groundLow: new THREE.Color(0x60606b),
      groundMid: new THREE.Color(0x7b7581),
      groundHigh: new THREE.Color(0x9690a0),
      wetBank: new THREE.Color(0x3b4148),
      riverDeep: new THREE.Color(0x0d2c36),
      riverGlow: new THREE.Color(0x35b9c6),
      riverEdge: new THREE.Color(0x7ed9e5),
      lavenderMist: new THREE.Color(0x9087a2),
      bridgeWood: new THREE.Color(0x7c746d),
      bridgeStone: new THREE.Color(0x4a4850),
      bridgeSteel: new THREE.Color(0x3f5664),
      fractalAccent: new THREE.Color(0x70bcc2)
    };

    this.sharedWorldGeometries = {
      box: new THREE.BoxGeometry(1, 1, 1),
      outcrop: new THREE.CylinderGeometry(1, 1, 1, 6, 1, false),
      stone: new THREE.DodecahedronGeometry(1, 0)
    };

    this._riverScratchPoint = new THREE.Vector3();
    this._riverScratchTangent = new THREE.Vector3();
    this._riverScratchLateral = new THREE.Vector3();
    this.ridgeConfigs = [
      {
        position: new THREE.Vector3(-132, 0, 24),
        width: 176,
        height: 34,
        depth: 16,
        seed: 1.1,
        bias: 0.28,
        color: 0x273041,
        terrainHeight: 4.2,
        terrainDepth: 62,
        terrainWidth: 94,
        terrainOffsetY: -3.2
      },
      {
        position: new THREE.Vector3(128, 0, -24),
        width: 154,
        height: 25,
        depth: 13,
        seed: 2.7,
        bias: -0.22,
        color: 0x323a49,
        terrainHeight: 3.8,
        terrainDepth: 58,
        terrainWidth: 88,
        terrainOffsetY: -3.0
      },
      {
        position: new THREE.Vector3(0, 0, -112),
        width: 246,
        height: 46,
        depth: 18,
        seed: 4.1,
        bias: 0.05,
        color: 0x21293a,
        terrainHeight: 3.8,
        terrainDepth: 72,
        terrainWidth: 126,
        terrainOffsetY: -4.4
      },
      {
        position: new THREE.Vector3(-56, 0, 104),
        width: 162,
        height: 18,
        depth: 11,
        seed: 5.4,
        bias: 0.18,
        color: 0x353d4c,
        terrainHeight: 2.6,
        terrainDepth: 48,
        terrainWidth: 78,
        terrainOffsetY: -1.8
      },
      {
        position: new THREE.Vector3(66, 0, 94),
        width: 184,
        height: 21,
        depth: 12,
        seed: 6.2,
        bias: -0.12,
        color: 0x2d3546,
        terrainHeight: 2.9,
        terrainDepth: 52,
        terrainWidth: 88,
        terrainOffsetY: -2.0
      }
    ];
    this.riverCurve = this.createRiverCurve();
    this.bridgePlacements = [
      { type: 'hero', t: 0.5 },
      { type: 'echo', t: 0.72 }
    ];
  }

  createRiverCurve() {
    const points = [];
    const segmentCount = 24;

    for (let i = 0; i < segmentCount; i++) {
      const t = i / (segmentCount - 1);
      const z = -118 + t * 236;
      const x = this.getRiverCenterX(z);
      const y = this.getRiverSurfaceHeight(x, z);
      points.push(new THREE.Vector3(x, y, z));
    }

    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.12);
  }

  getRiverCenterX(z) {
    return (
      Math.sin(z * 0.018 + 0.35) * 8.5 +
      Math.sin(z * 0.0065 - 0.9) * 5.25
    );
  }

  getRiverWidth(z) {
    return 6.1 + Math.sin(z * 0.032 + 0.5) * 1.05 + Math.abs(this.sampleTerrainNoise(14, z * 0.45)) * 0.85;
  }

  getRiverChannelHalfWidth(z) {
    return this.getRiverWidth(z) * 1.72 + 3.1;
  }

  getRiverVisualHalfWidth(z) {
    return this.getRiverWidth(z) * 0.84 + 0.55;
  }

  getRiverSurfaceHeight(x, z) {
    return -3.1 + Math.sin(z * 0.016) * 0.16 + this.sampleTerrainNoise(x * 0.55 + 17, z * 0.55 - 9) * 0.18;
  }

  getWaterFeatureInfo() {
    if (!this._waterFeatureInfo) {
      const focusT = this.bridgePlacements.find((placement) => placement.type === 'hero')?.t ?? 0.5;
      const frame = this.getRiverFrameAt(focusT);
      this._waterFeatureInfo = {
        frame,
        halfLength: 34,
        halfWidth: 12.5,
        influenceLength: 76,
        influenceWidth: 26
      };
    }

    return this._waterFeatureInfo;
  }

  getWaterFeatureAxes(x, z) {
    const info = this.getWaterFeatureInfo();
    const dx = x - info.frame.point.x;
    const dz = z - info.frame.point.z;
    return {
      info,
      along: dx * info.frame.tangent.x + dz * info.frame.tangent.z,
      across: dx * info.frame.lateral.x + dz * info.frame.lateral.z
    };
  }

  getWaterFeatureMask(x, z, lengthScale = 1, widthScale = 1) {
    const { info, along, across } = this.getWaterFeatureAxes(x, z);
    const radial = Math.sqrt(
      Math.pow(along / (info.influenceLength * lengthScale), 2) +
      Math.pow(across / (info.influenceWidth * widthScale), 2)
    );
    return this._smoothstep(1.08, 0.14, radial);
  }

  sampleTerrainHeight(x, z) {
    const waterMask = this.getWaterFeatureMask(x, z);
    const waterReliefMask = this.getWaterFeatureMask(x, z, 1.55, 1.45);
    const waterWideMask = this.getWaterFeatureMask(x, z, 2.3, 2.0);
    const waterAxes = this.getWaterFeatureAxes(x, z);
    const waterInfo = this.getWaterFeatureInfo();
    const radial = Math.sqrt(
      Math.pow(waterAxes.along / waterInfo.halfLength, 2) +
      Math.pow(waterAxes.across / waterInfo.halfWidth, 2)
    );

    const macroNoise = this.sampleTerrainNoise(x * 0.95, z * 0.95) * 1.3;
    const microNoise = this.sampleTerrainNoise(x * 2.25 + 31.7, z * 2.25 - 17.3) * 0.34;
    const fractureNoise = Math.abs(this.sampleTerrainNoise(x * 1.55 - 53, z * 1.55 + 19));

    const valleyBase = -0.85 + macroNoise * 0.3 + microNoise * 0.15;
    const bankRing = waterReliefMask * this._smoothstep(0.82, 0.26, Math.abs(radial - 0.64));
    const sideBankRise = waterWideMask * this._smoothstep(6, 18, Math.abs(waterAxes.across)) * (
      0.9 + fractureNoise * 0.45 + Math.sin(waterAxes.along * 0.09) * 0.18
    );
    const alongRoll = waterWideMask * (
      Math.sin(waterAxes.along * 0.11 - waterAxes.across * 0.05) * 0.34 +
      Math.cos(waterAxes.along * 0.07 + waterAxes.across * 0.08) * 0.22
    );
    const bankLift = waterMask * this._smoothstep(1.12, 0.86, radial) * 1.25 + bankRing * 1.05 + sideBankRise;

    const ridgeTerrain = this.sampleRidgeTerrainInfluence(x, z) * (1 - waterMask * 0.45);
    const farShoulder = this._smoothstep(54, 136, Math.abs(z + 12)) * 0.7;
    const subtleFractal = Math.sin(x * 0.03 + z * 0.016) * Math.cos(z * 0.041) * 0.4;

    const poolCarve = waterMask * this._smoothstep(1.0, 0.0, radial) * (
      2.45 + (1 - this._clamp01(radial)) * 0.48
    );
    const shorelineBlend = waterMask * this._smoothstep(1.32, 0.9, radial) * 0.12;
    const bridgeCorridorCut = this.getBridgeCorridorCut(x, z);

    return valleyBase + bankLift + ridgeTerrain + farShoulder + subtleFractal + alongRoll - poolCarve - shorelineBlend - bridgeCorridorCut;
  }

  sampleRidgeTerrainInfluence(x, z) {
    let influence = 0;

    for (const config of this.ridgeConfigs) {
      const dx = x - config.position.x;
      const dz = z - config.position.z;
      const radialX = Math.abs(dx) / config.terrainWidth;
      const radialZ = Math.abs(dz) / config.terrainDepth;
      const radial = Math.sqrt(radialX * radialX + radialZ * radialZ);

      if (radial >= 1.22) {
        continue;
      }

      const mask = this._smoothstep(1.18, 0.08, radial);
      const localNoise = this.sampleTerrainNoise(
        x * 0.045 + config.seed * 3.1,
        z * 0.045 - config.seed * 2.4
      ) * 0.08;

      influence += mask * (config.terrainHeight + localNoise);
    }

    return influence;
  }

  getGroundLevelAt(x, z, collisionObjects = null, currentY = null) {
    const terrainLevel = this.sampleTerrainHeight(x, z) + this.playerGroundOffset;
    const bridgeLevel = this.sampleBridgeGroundHeight(x, z, terrainLevel, currentY);
    if (Number.isFinite(bridgeLevel)) {
      return bridgeLevel;
    }

    return terrainLevel;
  }

  getMaxStepHeight() {
    return 5.9;
  }

  getMovementBounds() {
    return {
      type: 'circle',
      center: new THREE.Vector3(0, 0, 0),
      radius: 138
    };
  }

  getBridgeCorridorCut(x, z) {
    let cut = 0;

    for (const bridge of this.bridgeGroundSurfaces) {
      const dx = x - bridge.point.x;
      const dz = z - bridge.point.z;
      const along = dx * bridge.lateral.x + dz * bridge.lateral.z;
      const across = dx * bridge.tangent.x + dz * bridge.tangent.z;
      const halfSpan = bridge.span * 0.5;
      const spanFade = 18;
      const widthFade = bridge.halfWidth + 10.5;
      const spanMask = this._smoothstep(halfSpan + spanFade, halfSpan * 0.25, Math.abs(along));
      const widthMask = this._smoothstep(widthFade, bridge.halfWidth * 0.66, Math.abs(across));
      const corridor = spanMask * widthMask;
      const strength = 1.9;

      cut = Math.max(cut, corridor * strength);
    }

    return cut;
  }

  sampleBridgeGroundHeight(x, z, terrainLevel = null, currentY = null) {
    for (const bridge of this.bridgeGroundSurfaces) {
      const dx = x - bridge.point.x;
      const dz = z - bridge.point.z;
      const along = dx * bridge.lateral.x + dz * bridge.lateral.z;
      const across = dx * bridge.tangent.x + dz * bridge.tangent.z;
      const halfSpan = bridge.span * 0.5;

      // Give the bridge height query a little extra width so the deck isn't too narrow for walking
      const bridgeMargin = 1.7;
      if (Math.abs(along) > halfSpan || Math.abs(across) > (bridge.halfWidth + bridgeMargin)) {
        continue;
      }

      const normalized = this._clamp01((along + halfSpan) / bridge.span);
      const arch = Math.sin(normalized * Math.PI) * bridge.deckRise;
      const deckLevel = bridge.deckY + bridge.surfaceOffset + arch;
      const localTerrainLevel = Number.isFinite(terrainLevel) ? terrainLevel : (this.sampleTerrainHeight(x, z) + this.playerGroundOffset);

      if (!Number.isFinite(currentY)) {
        continue;
      }

      // Only use bridge deck when the player is high enough relative to local terrain
      // and close enough to the deck surface. Prevent under-bridge snapping.
      const minDeckApproachHeight = localTerrainLevel + 0.75;
      const maxUnderDeck = deckLevel - 0.45;

      if (currentY < minDeckApproachHeight || currentY < maxUnderDeck) {
        continue;
      }

      return deckLevel;
    }

    return null;
  }

  sampleTerrainNoise(x, z) {
    const baseScale = 0.0105;
    const n0 = this._noise2D(x * baseScale, z * baseScale) * 1.0;
    const n1 = this._noise2D(x * baseScale * 2.15, z * baseScale * 2.15) * 0.5;
    const n2 = this._noise2D(x * baseScale * 4.8, z * baseScale * 4.8) * 0.22;
    return (n0 + n1 + n2) * 5.8;
  }

  _noise2D(x, z) {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    const fx = x - ix;
    const fz = z - iz;
    const u = this._fade(fx);
    const v = this._fade(fz);

    const n00 = this._gradNoise(ix, iz, fx, fz);
    const n10 = this._gradNoise(ix + 1, iz, fx - 1, fz);
    const n01 = this._gradNoise(ix, iz + 1, fx, fz - 1);
    const n11 = this._gradNoise(ix + 1, iz + 1, fx - 1, fz - 1);

    const nx0 = this._lerp(n00, n10, u);
    const nx1 = this._lerp(n01, n11, u);
    return this._lerp(nx0, nx1, v);
  }

  _gradNoise(ix, iz, fx, fz) {
    const hash = this._pseudoRandom2D(ix, iz);
    const angle = (hash % 8) * (Math.PI * 0.25);
    return Math.cos(angle) * fx + Math.sin(angle) * fz;
  }

  _pseudoRandom2D(x, y) {
    let n = x * 374761393 + y * 668265263;
    n = (n ^ (n >> 13)) * 1274126177;
    return (n ^ (n >> 16)) >>> 0;
  }

  _fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  _clamp01(value) {
    return Math.min(Math.max(value, 0), 1);
  }

  _smoothstep(edge0, edge1, value) {
    if (edge0 === edge1) {
      return value < edge0 ? 0 : 1;
    }
    const t = this._clamp01((value - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
  }
  
  /**
   * Initialize reference plane from map config
   */
  initializeReferencePlane() {
    if (!this.mapConfig.referencePlane) {
      this.referencePlane = null;
      return;
    }

    try {
      this.referencePlane = initMapReferencePlane(
        this.scene,
        this.worldRoot,
        this.camera,
        this.mapConfig.referencePlane
      );
      
      console.log(
        `[REFERENCE PLANE] ${this.mapConfig.referencePlane} initialized for ${this.mapConfig.mapId}`
      );
    } catch (err) {
      console.warn(
        `[REFERENCE PLANE] Failed to initialize ${this.mapConfig.referencePlane}:`,
        err
      );
      this.referencePlane = null;
    }
  }

  cleanupInheritedWorldArtifacts() {
    if (!this.worldRoot) {
      return;
    }

    const removals = [];
    this.worldRoot.traverse((child) => {
      if (!child) {
        return;
      }

      if (
        child.userData?.isCognitiveHorizon ||
        child.userData?.isDebugPlane ||
        child.userData?.isGridOverlay ||
        child.userData?.isGlowGradient
      ) {
        removals.push(child);
        return;
      }

      if (!child.isMesh || !child.geometry) {
        return;
      }

      const geometryType = child.geometry.type;
      const radius = child.geometry.parameters?.radius ?? child.geometry.parameters?.outerRadius ?? 0;
      const colorHex = child.material?.color?.getHex?.() ?? null;

      if (geometryType === 'CircleGeometry' && radius >= 20 && colorHex === 0x0a0a0a) {
        removals.push(child);
        return;
      }

      if (
        geometryType === 'TorusGeometry' &&
        radius >= 20 &&
        child.position?.y >= -1 &&
        child.position?.y <= 2
      ) {
        removals.push(child);
        return;
      }

      if (
        geometryType === 'SphereGeometry' &&
        radius >= 3 &&
        colorHex === 0x000000 &&
        child.material?.transparent !== true
      ) {
        removals.push(child);
        return;
      }

      if (
        geometryType === 'PlaneGeometry' &&
        child.material?.transparent === true &&
        Math.abs(child.rotation?.x ?? 0) < 0.4 &&
        Math.max(child.scale?.x ?? 0, child.scale?.y ?? 0, child.scale?.z ?? 0) > 30
      ) {
        removals.push(child);
        return;
      }
    });

    removals.forEach((child) => child.parent?.remove(child));
  }

  createLighting() {
    if (!this.scene) {
      return;
    }

    const hemiLight = new THREE.HemisphereLight(0xb0abc5, 0x17131a, 0.72);
    hemiLight.name = 'fractalValleyHemisphereLight';
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xf1e9ff, 0.95);
    dirLight.position.set(-68, 88, 32);
    dirLight.castShadow = false;
    dirLight.name = 'fractalValleyDirectionalLight';
    this.scene.add(dirLight);

    this.lights = { hemiLight, dirLight };
  }
  
  /**
   * Create sculpted valley floor with river-cut terrain.
   */
  createValleyFloor() {
    const floorSize = 280;
    const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize, 96, 96);
    const positions = floorGeometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i);
      const height = this.sampleTerrainHeight(x, z);
      const heightMix = this._clamp01((height + 4) / 24);
      const wetBlend = this.getWaterFeatureMask(x, z, 0.82, 0.76) * 0.62;
      const waterline = this.getWaterFeatureMask(x, z, 1.06, 0.92) * 0.42;
      const hazeBlend = this._smoothstep(14, 28, height) * 0.2;
      const coolShadow = this._clamp01((Math.abs(x) * 0.006 + Math.max(0, -height) * 0.04) * 0.8);
      const color = this.palette.groundLow.clone();
      color.lerp(this.palette.groundMid, heightMix);
      color.lerp(this.palette.groundHigh, Math.pow(heightMix, 1.8));
      color.lerp(this.palette.ridgeShadow, coolShadow * 0.28);
      color.lerp(this.palette.wetBank, Math.max(wetBlend * 0.28, waterline));
      color.lerp(this.palette.lavenderMist, hazeBlend);

      positions.setZ(i, height);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    floorGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    floorGeometry.computeVertexNormals();
    
    const floorMaterial = materialRegistry.getStandard('world.fractalvalley.floor', {
      color: 0x6c665f,
      roughness: 0.96,
      metalness: 0.04,
      flatShading: false,
      vertexColors: true,
      emissive: 0x050508,
      emissiveIntensity: 0.02
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.worldRoot.add(floor);
    this.terrainFloor = floor;
    
    // Create collision mesh for valley floor (invisible)
    const collisionMaterial = new THREE.MeshBasicMaterial({
      visible: false
    });
    const floorCollision = new THREE.Mesh(floorGeometry.clone(), collisionMaterial);
    floorCollision.rotation.x = -Math.PI / 2;
    floorCollision.userData = {
      isWalkable: true,
      collisionEnabled: true,
      collisionRole: 'terrain',
      terrainType: 'valleyFloor'
    };
    this.worldRoot.add(floorCollision);
    this.collisionObjects.push(floorCollision);
    
    // Subtle fractal outcrops retain the map's identity without dominating the silhouette.
  }
  
  /**
   * Create subtle fractal outcrops embedded into the valley shoulders.
   */
  createHexTerraces() {
    const outcropCount = 4;
    const baseMaterial = materialRegistry.getStandard('world.fractalvalley.outcrop', {
      color: 0x565158,
      roughness: 0.92,
      metalness: 0.08,
      emissive: 0x58b4ba,
      emissiveIntensity: 0.01
    });
    const invisibleMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide
    });
    const edgeGeometry = new THREE.EdgesGeometry(this.sharedWorldGeometries.outcrop);
    
    for (let i = 0; i < outcropCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const z = -106 + (i / (outcropCount - 1)) * 216 + (Math.random() * 2 - 1) * 14;
      const riverCenterX = this.getRiverCenterX(z);
      const riverWidth = this.getRiverWidth(z);
      const x = riverCenterX + side * (riverWidth + 38 + Math.random() * 28);
      const y = this.sampleTerrainHeight(x, z) + 0.45 + Math.random() * 0.9;

      const hex = new THREE.Mesh(this.sharedWorldGeometries.outcrop, baseMaterial.clone());
      hex.scale.set(
        2.5 + Math.random() * 3.5,
        0.75 + Math.random() * 1.8,
        2.2 + Math.random() * 3.0
      );
      hex.position.set(x, y, z);
      hex.rotation.y = Math.random() * Math.PI;
      hex.userData = {
        pulseOffset: Math.random() * Math.PI * 2
      };
      hex.castShadow = true;
      hex.receiveShadow = true;
      
      this.worldRoot.add(hex);
      this.hexTerraces.push(hex);

      const blocker = new THREE.Mesh(hex.geometry.clone(), invisibleMaterial);
      blocker.scale.copy(hex.scale);
      blocker.position.copy(hex.position);
      blocker.rotation.copy(hex.rotation);
      blocker.userData = {
        collisionEnabled: true,
        isWalkable: false,
        collisionRole: 'blocker',
        blockerType: 'hexTerrace'
      };
      this.worldRoot.add(blocker);
      this.collisionObjects.push(blocker);
      this.hexTerraceColliders.push(blocker);

      const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0x7bc0c4,
        transparent: true,
        opacity: 0.01
      });
      const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      hex.add(edges);
    }
  }
  
  /**
   * Create irregular layered ridge silhouettes around the valley.
   */
  createFractalMountains() {
    this.ridgeConfigs.forEach((config, index) => {
      const geometry = this.createRidgeGeometry(config.width, config.height, config.depth, config.seed, config.bias);
      const material = materialRegistry.getStandard(`world.fractalvalley.ridge.${index}`, {
        color: config.color,
        roughness: 0.96,
        metalness: 0.03,
        flatShading: false
      });

      const ridge = new THREE.Mesh(geometry, material);
      ridge.position.set(
        config.position.x,
        this.sampleTerrainHeight(config.position.x, config.position.z) + config.terrainOffsetY,
        config.position.z
      );
      ridge.rotation.y = Math.atan2(-config.position.x, -config.position.z) + (config.yawOffset || 0);
      ridge.castShadow = true;
      ridge.receiveShadow = false;
      ridge.renderOrder = 1;
      ridge.userData = {
        accentOnly: index >= 2
      };

      this.worldRoot.add(ridge);
      this.mountains.push(ridge);
    });
  }
  
  /**
   * Create an extruded ridge silhouette with asymmetrical peaks.
   */
  createRidgeGeometry(width, height, depth, seed, bias) {
    const silhouetteCount = 14;
    const shape = new THREE.Shape();
    shape.moveTo(-width * 0.5, 0);

    for (let i = 0; i <= silhouetteCount; i++) {
      const t = i / silhouetteCount;
      const x = -width * 0.5 + t * width;
      const primaryPeak = Math.sin(t * Math.PI) * 0.64;
      const secondaryPeak = Math.sin(t * Math.PI * 3 + seed * 1.9) * 0.17;
      const tertiaryPeak = Math.sin(t * Math.PI * 6 + seed * 3.1) * 0.06;
      const asymmetry = (0.5 - t) * bias * 0.9;
      const noise = this._noise2D(t * 7.5 + seed * 5.7, seed * 1.3) * 0.14;
      const silhouette = height * Math.max(0.08, 0.16 + primaryPeak + secondaryPeak + tertiaryPeak + asymmetry + noise);
      shape.lineTo(x, silhouette);
    }

    shape.lineTo(width * 0.5, 0);
    shape.lineTo(-width * 0.5, 0);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      steps: 1,
      curveSegments: 10
    });

    geometry.translate(0, 0, -depth * 0.5);

    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const yMix = this._clamp01(y / Math.max(height, 0.001));
      const xWarp = this.sampleTerrainNoise(x * 0.08 + seed * 12.0, z * 0.18 + seed * 4.0) * 0.12;
      const zWarp = this.sampleTerrainNoise(x * 0.05 - seed * 7.0, y * 0.08 + seed * 3.0) * 0.16;
      positions.setX(i, x + xWarp * depth * yMix * 0.5);
      positions.setZ(i, z + zWarp * depth * Math.max(0.15, yMix));
    }

    geometry.computeVertexNormals();
    return geometry;
  }
  
  /**
   * Create subtle distant fractal glints above ridge silhouettes.
   */
  createMountainSilhouetteGlow() {
    const particleCount = 24;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const alphas = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);
    const baseHeights = new Float32Array(particleCount);
    const riseDistances = new Float32Array(particleCount);
    const ridgeBounds = this.mountains.map((mountain) => new THREE.Box3().setFromObject(mountain));

    for (let i = 0; i < particleCount; i++) {
      const mountainIndex = 2 + Math.floor(Math.random() * Math.max(this.mountains.length - 2, 1));
      const bounds = ridgeBounds[Math.min(mountainIndex, ridgeBounds.length - 1)];
      const baseX = THREE.MathUtils.lerp(bounds.min.x, bounds.max.x, Math.random());
      const baseZ = THREE.MathUtils.lerp(bounds.min.z, bounds.max.z, 0.5) + (Math.random() * 2 - 1) * 4;
      const baseY = bounds.min.y + (0.62 + Math.random() * 0.3) * (bounds.max.y - bounds.min.y);

      positions[i * 3] = baseX;
      positions[i * 3 + 1] = baseY;
      positions[i * 3 + 2] = baseZ;

      colors[i * 3] = 0.55;
      colors[i * 3 + 1] = 0.77;
      colors[i * 3 + 2] = 0.79;

      alphas[i] = 0.5 + Math.random() * 0.3;
      speeds[i] = 0.03 + Math.random() * 0.025;
      baseHeights[i] = baseY;
      riseDistances[i] = 2.8 + Math.random() * 2.6;
    }

    const glowGeometry = new THREE.BufferGeometry();
    glowGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    glowGeometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    glowGeometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: window.devicePixelRatio || 1 }
      },
      vertexShader: `
        uniform float uPixelRatio;
        attribute float aAlpha;
        attribute vec3 aColor;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = aColor;
          vAlpha = aAlpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 18.0 * (uPixelRatio / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          float dist = length(uv);
          float mask = smoothstep(1.0, 0.4, dist);
          float alpha = clamp(mask * vAlpha, 0.0, 1.0);
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const glowPoints = new THREE.Points(glowGeometry, glowMaterial);
    glowPoints.name = 'mountainSilhouetteGlow';
    glowPoints.renderOrder = 12;
    this.worldRoot.add(glowPoints);

    this.mountainSilhouetteGlow = glowPoints;
    this.mountainSilhouetteGlowData = {
      speeds,
      riseDistances,
      startYs: baseHeights,
      particleCount,
      bounds: ridgeBounds
    };
  }

  updateMountainSilhouetteGlow(deltaTime) {
    if (!this.mountainSilhouetteGlow || !this.mountainSilhouetteGlowData) {
      return;
    }

    const geometry = this.mountainSilhouetteGlow.geometry;
    const positions = geometry.attributes.position.array;
    const fades = geometry.attributes.aAlpha.array;
    const data = this.mountainSilhouetteGlowData;

    for (let i = 0; i < data.particleCount; i++) {
      const idx = i * 3;
      const yIndex = idx + 1;
      positions[yIndex] += data.speeds[i] * deltaTime;

      const progress = (positions[yIndex] - data.startYs[i]) / data.riseDistances[i];
      fades[i] = 1.0 - progress;

      if (progress >= 1.0 || fades[i] <= 0.0) {
        const bounds = data.bounds[2 + Math.floor(Math.random() * Math.max(data.bounds.length - 2, 1))] || data.bounds[0];
        const baseX = THREE.MathUtils.lerp(bounds.min.x, bounds.max.x, Math.random());
        const baseZ = THREE.MathUtils.lerp(bounds.min.z, bounds.max.z, 0.5) + (Math.random() * 2 - 1) * 4;
        const baseY = bounds.min.y + (0.62 + Math.random() * 0.3) * (bounds.max.y - bounds.min.y);

        positions[idx] = baseX;
        positions[yIndex] = baseY;
        positions[idx + 2] = baseZ;
        data.startYs[i] = baseY;
        data.riseDistances[i] = 2.8 + Math.random() * 2.6;
        data.speeds[i] = 0.03 + Math.random() * 0.025;
        fades[i] = 0.45 + Math.random() * 0.35;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aAlpha.needsUpdate = true;
  }
  
  /**
   * Create floating fractal fragments
   */
  createFragmentGlowMaterial() {
    if (this.fragmentGlowMaterial) {
      return this.fragmentGlowMaterial;
    }

    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(
      size * 0.5,
      size * 0.5,
      0,
      size * 0.5,
      size * 0.5,
      size * 0.5
    );
    gradient.addColorStop(0, 'rgba(132,198,202,0.85)');
    gradient.addColorStop(0.35, 'rgba(132,198,202,0.22)');
    gradient.addColorStop(1, 'rgba(132,198,202,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    this.fragmentGlowMaterial = new THREE.SpriteMaterial({
      map: texture,
      color: 0x86c6ca,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    return this.fragmentGlowMaterial;
  }

  createFloatingFragments() {
    // Decorative floating fragments have been disabled for a cleaner bridge/pool focus.
    return;
  }

  /**
   * Create fractal crystal formations growing from the valley terrain.
   * These are mathematical thoughts crystallized into physical form —
   * octahedral, icosahedral, and tetrahedral shapes with inner glow.
   */
  createFractalCrystals() {
    const crystalCount = 14;
    const crystalGeometries = [
      new THREE.OctahedronGeometry(1, 0),
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.TetrahedronGeometry(1, 0)
    ];

    const crystalMaterial = materialRegistry.getStandard('world.fractalvalley.crystal', {
      color: 0x45b5be,
      roughness: 0.15,
      metalness: 0.7,
      emissive: 0x2ca8c0,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.82
    });

    for (let i = 0; i < crystalCount; i++) {
      const geoIndex = Math.floor(Math.random() * crystalGeometries.length);
      const size = 0.3 + Math.random() * 0.8;
      const side = i % 2 === 0 ? -1 : 1;
      const z = -90 + (i / crystalCount) * 180 + (Math.random() * 2 - 1) * 20;
      const riverCenterX = this.getRiverCenterX(z);
      const riverWidth = this.getRiverWidth(z);
      const x = riverCenterX + side * (riverWidth + 10 + Math.random() * 35);
      const y = this.sampleTerrainHeight(x, z);

      const crystal = new THREE.Mesh(crystalGeometries[geoIndex], crystalMaterial.clone());
      crystal.scale.set(size, size * (1.2 + Math.random() * 1.5), size);
      crystal.position.set(x, y + size * 0.5, z);
      crystal.rotation.set(
        (Math.random() - 0.5) * 0.3,
        Math.random() * Math.PI,
        (Math.random() - 0.5) * 0.3
      );
      crystal.userData = {
        pulseOffset: Math.random() * Math.PI * 2,
        baseEmissiveIntensity: 0.1 + Math.random() * 0.15,
        originalY: y + size * 0.5,
        floatAmplitude: 0.04 + Math.random() * 0.08,
        floatSpeed: 0.3 + Math.random() * 0.4
      };
      crystal.castShadow = true;
      this.worldRoot.add(crystal);
      this.fractalCrystals.push(crystal);
    }
  }

  createFragmentLightningLine() {
    const segmentCount = 6;
    const lineGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array((segmentCount + 1) * 3);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x76bcc0,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    });

    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.userData = {
      active: false,
      age: 0,
      flickerOffset: Math.random() * Math.PI * 2
    };
    this.worldRoot.add(line);
    return line;
  }

  updateFragmentLightning(deltaTime, time) {
    const maxDistance = 18;
    const maxDistanceSq = maxDistance * maxDistance;
    const fragmentCount = this.fractalFragments.length;
    const activeLines = [];

    for (let a = 0; a < fragmentCount; a++) {
      const fa = this.fractalFragments[a];
      for (let b = a + 1; b < fragmentCount; b++) {
        const fb = this.fractalFragments[b];
        const dx = fa.position.x - fb.position.x;
        const dz = fa.position.z - fb.position.z;
        const dy = fa.position.y - fb.position.y;
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < maxDistanceSq) {
          activeLines.push({ a: fa, b: fb, dist: Math.sqrt(distSq) });
        }
      }
    }

    activeLines.sort((a, b) => a.dist - b.dist);
    const maxActive = 2;
    const lineCount = Math.min(activeLines.length, maxActive);

    while (this.fragmentLightningLines.length < lineCount) {
      this.fragmentLightningLines.push(this.createFragmentLightningLine());
    }

    for (let i = 0; i < lineCount; i++) {
      const line = this.fragmentLightningLines[i];
      const pair = activeLines[i];
      const material = line.material;
      const t = pair.dist / maxDistance;
      const flicker = Math.abs(Math.sin(time * 30 + line.userData.flickerOffset));
      material.opacity = (1.0 - t) * 0.16 * (0.35 + 0.65 * flicker);

      const start = pair.a.position;
      const end = pair.b.position;
      const points = this.generateLightningPath(start, end, 5, time + i);
      const attr = line.geometry.attributes.position.array;
      for (let j = 0; j < points.length; j++) {
        attr[j * 3] = points[j].x;
        attr[j * 3 + 1] = points[j].y;
        attr[j * 3 + 2] = points[j].z;
      }
      line.geometry.attributes.position.needsUpdate = true;
      line.visible = true;
      line.userData.active = true;
    }

    for (let i = lineCount; i < this.fragmentLightningLines.length; i++) {
      const line = this.fragmentLightningLines[i];
      if (line.userData.active) {
        line.material.opacity = 0;
        line.visible = false;
        line.userData.active = false;
      }
    }
  }

  generateLightningPath(start, end, segments, seed) {
    const points = [];
    const startVec = new THREE.Vector3(start.x, start.y, start.z);
    const endVec = new THREE.Vector3(end.x, end.y, end.z);
    const dir = new THREE.Vector3().subVectors(endVec, startVec);
    const length = dir.length();
    const normal = new THREE.Vector3(0, 1, 0);
    const perp = new THREE.Vector3().crossVectors(dir, normal).normalize();
    if (perp.lengthSq() < 0.1) {
      perp.set(1, 0, 0);
    }
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const base = new THREE.Vector3().lerpVectors(startVec, endVec, t);
      const offsetScale = Math.sin(Math.PI * t) * length * 0.08;
      const jitter = ((Math.sin(t * 12 + seed) + Math.random() * 0.8) - 0.4) * offsetScale;
      const offset = perp.clone().multiplyScalar(jitter);
      points.push(base.add(offset));
    }
    return points;
  }

  /**
   * Create the meandering river, shallow bank transitions, and restrained flow accents.
   */
  createDataRivers() {
    // Local pool surface for the hero bridge; this is not a full-map river.
    const waterGeometry = this.buildRiverSurfaceGeometry();
    const waterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorDeep: { value: this.palette.riverDeep.clone() },
        uColorGlow: { value: this.palette.riverGlow.clone() },
        uColorEdge: { value: this.palette.riverEdge.clone() }
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 transformed = position;
          vec2 centeredUv = uv * 2.0 - 1.0;
          float radial = length(vec2(centeredUv.x, centeredUv.y * 0.72));
          float edgeMask = 1.0 - smoothstep(0.22, 1.0, radial);
          transformed.y += sin(uv.y * 22.0 - uTime * 1.2 + uv.x * 5.0) * 0.05 * (0.35 + edgeMask * 0.75);
          vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorDeep;
        uniform vec3 uColorGlow;
        uniform vec3 uColorEdge;
        varying vec2 vUv;
        void main() {
          vec2 centeredUv = vUv * 2.0 - 1.0;
          float radial = length(vec2(centeredUv.x, centeredUv.y * 0.72));
          float centerMask = 1.0 - smoothstep(0.0, 0.96, radial);
          float flow = 0.5 + 0.5 * sin(vUv.y * 24.0 - uTime * 1.5 + centeredUv.x * 4.0);
          vec3 color = mix(uColorEdge, uColorDeep, smoothstep(0.0, 0.88, centerMask));
          color = mix(color, uColorGlow, centerMask * 0.26 + flow * 0.1);
          float alpha = (0.16 + centerMask * 0.62) * (1.0 - smoothstep(0.9, 1.05, radial));
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const riverWater = new THREE.Mesh(waterGeometry, waterMaterial);
    riverWater.name = 'fractalValleyRiver';
    riverWater.renderOrder = 4;
    const waterFeature = this.getWaterFeatureInfo();
    riverWater.rotation.x = -Math.PI / 2;
    riverWater.position.set(
      waterFeature.frame.point.x,
      this.getRiverSurfaceHeight(waterFeature.frame.point.x, waterFeature.frame.point.z) + 0.7,
      waterFeature.frame.point.z
    );
    riverWater.scale.set(waterFeature.halfWidth * 2.1, waterFeature.halfLength * 2.05, 1);
    this.worldRoot.add(riverWater);
    this.riverWaterMesh = riverWater;

    this.riverBankMeshes = null;
    this.dataRivers = [riverWater];
    this.dataRiverData = null;
  }

  buildRiverSurfaceGeometry() {
    return new THREE.PlaneGeometry(1, 1, 36, 48);
  }

  buildRiverBankGeometry(segmentCount, side) {
    const positions = new Float32Array((segmentCount + 1) * 2 * 3);
    const uvs = new Float32Array((segmentCount + 1) * 2 * 2);
    const indices = [];

    for (let i = 0; i <= segmentCount; i++) {
      const t = i / segmentCount;
      const point = this.riverCurve.getPointAt(t);
      const tangent = this.riverCurve.getTangentAt(t).normalize();
      const lateral = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const innerOffset = this.getRiverWidth(point.z) * 0.98;
      const outerOffset = innerOffset + 3.0 + Math.abs(this.sampleTerrainNoise(point.x * 0.32 + side * 9, point.z * 0.32)) * 1.1;

      const inner = point.clone().add(lateral.clone().multiplyScalar(innerOffset * side));
      const outer = point.clone().add(lateral.clone().multiplyScalar(outerOffset * side));
      inner.y = this.getRiverSurfaceHeight(point.x, point.z) + 0.06;
      outer.y = this.sampleTerrainHeight(outer.x, outer.z) + 0.08;

      const vertexIndex = i * 2;
      const positionIndex = vertexIndex * 3;
      const uvIndex = vertexIndex * 2;

      positions[positionIndex] = inner.x;
      positions[positionIndex + 1] = inner.y;
      positions[positionIndex + 2] = inner.z;
      positions[positionIndex + 3] = outer.x;
      positions[positionIndex + 4] = outer.y;
      positions[positionIndex + 5] = outer.z;

      uvs[uvIndex] = 0;
      uvs[uvIndex + 1] = t;
      uvs[uvIndex + 2] = 1;
      uvs[uvIndex + 3] = t;

      if (i < segmentCount) {
        const a = vertexIndex;
        const b = vertexIndex + 1;
        const c = vertexIndex + 2;
        const d = vertexIndex + 3;
        indices.push(a, c, b, c, d, b);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  createRiverStones() {
    const stoneCount = 6;
    const stoneMaterial = materialRegistry.getStandard('world.fractalvalley.riverStone', {
      color: 0x57535b,
      roughness: 0.96,
      metalness: 0.03
    });
    const stones = new THREE.InstancedMesh(this.sharedWorldGeometries.stone, stoneMaterial, stoneCount);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    for (let i = 0; i < stoneCount; i++) {
      const t = (i + Math.random() * 0.65) / stoneCount;
      const point = this.riverCurve.getPointAt(t);
      const tangent = this.riverCurve.getTangentAt(t).normalize();
      const lateral = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const side = i % 2 === 0 ? -1 : 1;
      const offset = this.getRiverWidth(point.z) + 1.2 + Math.random() * 4.4;

      position.copy(point).add(lateral.multiplyScalar(offset * side));
      position.y = this.sampleTerrainHeight(position.x, position.z) + 0.2;
      rotation.set(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.35);
      quaternion.setFromEuler(rotation);
      const size = 0.45 + Math.random() * 1.2;
      scale.set(size, size * (0.65 + Math.random() * 0.45), size * (0.72 + Math.random() * 0.55));
      matrix.compose(position, quaternion, scale);
      stones.setMatrixAt(i, matrix);
    }

    stones.instanceMatrix.needsUpdate = true;
    stones.castShadow = true;
    stones.receiveShadow = true;
    this.worldRoot.add(stones);
    this.riverStoneMesh = stones;
  }

  getRiverFrameAt(t) {
    const point = this.riverCurve.getPointAt(t);
    const tangent = this.riverCurve.getTangentAt(t).normalize();
    const lateral = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    point.y = this.getRiverSurfaceHeight(point.x, point.z);
    return { point, tangent, lateral };
  }

  createRiverBridges() {
    this.bridgePlacements.forEach((placement) => {
      const frame = this.getRiverFrameAt(placement.t);
      let group;

      if (placement.type === 'hero') {
        group = this.createHeroBridge(frame);
        this.heroBridgeAnchor = frame.point.clone();
      } else if (placement.type === 'echo') {
        group = this.createEchoBridge(frame);
      }

      if (group) {
        this.worldRoot.add(group);
        this.bridges.push(group);
      }
    });
  }

  createRiverCollision() {
    return;
  }

  orientGroupToRiverFrame(group, frame, y) {
    const basis = new THREE.Matrix4().makeBasis(frame.lateral, new THREE.Vector3(0, 1, 0), frame.tangent);
    group.position.set(frame.point.x, y, frame.point.z);
    group.setRotationFromMatrix(basis);
  }

  createBoxPart(material, scale, position) {
    const mesh = new THREE.Mesh(this.sharedWorldGeometries.box, material);
    mesh.scale.copy(scale);
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  createBeamBetween(material, start, end, thickness) {
    const beam = new THREE.Mesh(this.sharedWorldGeometries.box, material);
    const direction = new THREE.Vector3().subVectors(end, start);
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    beam.position.copy(midpoint);
    beam.scale.set(direction.length(), thickness, thickness);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction.normalize());
    beam.castShadow = true;
    beam.receiveShadow = true;
    return beam;
  }

  createOrientedBridgePart(material, start, end, height, width) {
    const mesh = new THREE.Mesh(this.sharedWorldGeometries.box, material);
    const direction = new THREE.Vector3().subVectors(end, start);
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    mesh.position.copy(midpoint);
    mesh.scale.set(direction.length(), height, width);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction.normalize());
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  createHeroBridge(frame) {
    const waterFeature = this.getWaterFeatureInfo();
    const span = Math.max(this.getRiverChannelHalfWidth(frame.point.z) * 2.0 + 8.0, waterFeature.halfWidth * 2.05 + 9.5);
    const deckWidth = 7.4;
    const deckRise = 0.22;
    const landingDepth = 7.2;
    const landingHeight = 0.22;
    const landingWidth = deckWidth + 1.0;
    const deckLowering = 0.18;

    const leftBank = frame.point.clone().add(frame.lateral.clone().multiplyScalar(span * 0.58));
    const rightBank = frame.point.clone().add(frame.lateral.clone().multiplyScalar(-span * 0.58));
    const leftEnd = frame.point.clone().add(frame.lateral.clone().multiplyScalar(span * 0.5 + landingDepth * 0.32));
    const rightEnd = frame.point.clone().add(frame.lateral.clone().multiplyScalar(-span * 0.5 - landingDepth * 0.32));
    const bankHeight = Math.max(
      this.sampleTerrainHeight(leftBank.x, leftBank.z),
      this.sampleTerrainHeight(rightBank.x, rightBank.z)
    );
    const endTerrainHeight = Math.max(
      this.sampleTerrainHeight(leftEnd.x, leftEnd.z),
      this.sampleTerrainHeight(rightEnd.x, rightEnd.z)
    );
    // Align bridge deck with nearby terrain and end caps to ensure clean landing geometry.
    const deckY = Math.max(bankHeight + deckLowering, endTerrainHeight + deckLowering, this.getRiverSurfaceHeight(frame.point.x, frame.point.z) + 2.7);

    const group = new THREE.Group();
    this.orientGroupToRiverFrame(group, frame, deckY);

    const woodMaterial = materialRegistry.getStandard('world.fractalvalley.bridge.hero.wood', {
      color: 0x7c746d,
      roughness: 0.9,
      metalness: 0.04
    });
    const stoneMaterial = materialRegistry.getStandard('world.fractalvalley.bridge.hero.stone', {
      color: 0x4a4950,
      roughness: 0.94,
      metalness: 0.05
    });
    const railMaterial = materialRegistry.getStandard('world.fractalvalley.bridge.hero.rail', {
      color: 0x3f5664,
      roughness: 0.36,
      metalness: 0.62,
      emissive: 0x2ca8c0,
      emissiveIntensity: 0.12
    });

    // Main bridge deck
    group.add(this.createBoxPart(
      woodMaterial,
      new THREE.Vector3(span * 1.05, 0.28, deckWidth),
      new THREE.Vector3(0, deckRise, 0)
    ));

    // Deck edge trim
    group.add(this.createBoxPart(
      stoneMaterial,
      new THREE.Vector3(span * 1.04, 0.14, 0.18),
      new THREE.Vector3(0, deckRise - 0.22, deckWidth * 0.46)
    ));
    group.add(this.createBoxPart(
      stoneMaterial,
      new THREE.Vector3(span * 1.04, 0.14, 0.18),
      new THREE.Vector3(0, deckRise - 0.22, -deckWidth * 0.46)
    ));

    const postCount = 4;
    for (let i = 0; i <= postCount; i++) {
      const t = i / postCount;
      const x = -span * 0.5 + t * span;
      const arch = Math.sin(t * Math.PI) * deckRise;
      const leftPost = new THREE.Vector3(x, arch + 0.56, deckWidth * 0.42);
      const rightPost = new THREE.Vector3(x, arch + 0.56, -deckWidth * 0.42);
      group.add(this.createBoxPart(railMaterial, new THREE.Vector3(0.14, 0.84, 0.14), leftPost));
      group.add(this.createBoxPart(railMaterial, new THREE.Vector3(0.14, 0.84, 0.14), rightPost));
    }

    // Full-span top rails
    const topRailLength = span * 1.22;
    group.add(this.createBoxPart(
      railMaterial,
      new THREE.Vector3(topRailLength, 0.09, 0.09),
      new THREE.Vector3(0, deckRise + 0.96, deckWidth * 0.42)
    ));
    group.add(this.createBoxPart(
      railMaterial,
      new THREE.Vector3(topRailLength, 0.09, 0.09),
      new THREE.Vector3(0, deckRise + 0.96, -deckWidth * 0.42)
    ));

    // Clean terrain-connected landings
    [-1, 1].forEach((side) => {
      const endCenterX = side * (span * 0.5 + landingDepth * 0.22);
      const supportCenterX = side * (span * 0.5 + landingDepth * 0.1);
      const landingTerrainY = this.sampleTerrainHeight(
        frame.point.x + frame.lateral.x * endCenterX,
        frame.point.z + frame.lateral.z * endCenterX
      ) - deckY;
      const landingTopY = Math.min(deckRise - 0.02, landingTerrainY + 0.24);
      const supportHeight = Math.max(0.5, landingTopY - landingTerrainY + 0.18);

      group.add(this.createBoxPart(
        stoneMaterial,
        new THREE.Vector3(landingDepth, landingHeight, landingWidth),
        new THREE.Vector3(endCenterX, landingTopY - 0.11, 0)
      ));
      group.add(this.createBoxPart(
        stoneMaterial,
        new THREE.Vector3(5.2, supportHeight, deckWidth + 0.9),
        new THREE.Vector3(supportCenterX, landingTopY - 0.11 - supportHeight * 0.5, 0)
      ));
    });

    this.bridgeGroundSurfaces.push({
      type: 'hero',
      point: frame.point.clone(),
      tangent: frame.tangent.clone(),
      lateral: frame.lateral.clone(),
      span,
      halfWidth: deckWidth * 0.5,
      deckY,
      deckRise,
      surfaceOffset: 0.14
    });

    const bridgeDeckCollider = new THREE.Mesh(
      this.sharedWorldGeometries.box,
      new THREE.MeshBasicMaterial({ visible: false })
    );
    bridgeDeckCollider.name = 'fractalValleyHeroBridgeDeckCollider';
    bridgeDeckCollider.scale.set(span * 1.06, 0.2, deckWidth * 0.95);
    bridgeDeckCollider.position.set(0, 0.08, 0);
    bridgeDeckCollider.userData = {
      collisionEnabled: true,
      isWalkable: true,
      collisionRole: 'terrain',
      terrainType: 'bridgeDeck',
      bridgeType: 'hero'
    };
    group.add(bridgeDeckCollider);
    this.collisionObjects.push(bridgeDeckCollider);

    const leftRailBlocker = new THREE.Mesh(
      this.sharedWorldGeometries.box,
      new THREE.MeshBasicMaterial({ visible: false })
    );
    leftRailBlocker.scale.set(span * 1.06, 1.0, 0.22);
    leftRailBlocker.position.set(0, deckRise + 0.55, deckWidth * 0.44);
    leftRailBlocker.userData = {
      collisionEnabled: true,
      isWalkable: false,
      collisionRole: 'blocker',
      blockerType: 'bridgeRail'
    };
    group.add(leftRailBlocker);
    this.collisionObjects.push(leftRailBlocker);

    const rightRailBlocker = new THREE.Mesh(
      this.sharedWorldGeometries.box,
      new THREE.MeshBasicMaterial({ visible: false })
    );
    rightRailBlocker.scale.set(span * 1.06, 1.0, 0.22);
    rightRailBlocker.position.set(0, deckRise + 0.55, -deckWidth * 0.44);
    rightRailBlocker.userData = {
      collisionEnabled: true,
      isWalkable: false,
      collisionRole: 'blocker',
      blockerType: 'bridgeRail'
    };
    group.add(rightRailBlocker);
    this.collisionObjects.push(rightRailBlocker);

    group.name = 'fractalValleyHeroBridge';
    return group;
  }

  createDistantBridge(frame) {
    return new THREE.Group();
  }

  /**
   * Create the Echo Bridge — an ancient, partially ruined stone structure
   * spanning a dry riverbed in the northern valley. Fractal crystal formations
   * grow from the weathered stone, suggesting mathematics itself is alive.
   * No railings remain — they crumbled long ago.
   */
  createEchoBridge(frame) {
    const span = Math.max(this.getRiverChannelHalfWidth(frame.point.z) * 1.5 + 3.0, 14);
    const deckWidth = 4.0;
    const deckRise = 0.38;
    const deckLowering = 0.12;

    const leftBank = frame.point.clone().add(frame.lateral.clone().multiplyScalar(span * 0.55));
    const rightBank = frame.point.clone().add(frame.lateral.clone().multiplyScalar(-span * 0.55));
    const bankHeight = Math.max(
      this.sampleTerrainHeight(leftBank.x, leftBank.z),
      this.sampleTerrainHeight(rightBank.x, rightBank.z)
    );
    const deckY = Math.max(bankHeight + deckLowering, this.getRiverSurfaceHeight(frame.point.x, frame.point.z) + 2.2);

    const group = new THREE.Group();
    this.orientGroupToRiverFrame(group, frame, deckY);

    // Ancient weathered stone
    const ancientStone = materialRegistry.getStandard('world.fractalvalley.bridge.echo.stone', {
      color: 0x3a3640,
      roughness: 0.97,
      metalness: 0.02
    });

    // Moss-covered stone variant
    const mossStone = materialRegistry.getStandard('world.fractalvalley.bridge.echo.moss', {
      color: 0x3d4a3f,
      roughness: 0.95,
      metalness: 0.03,
      emissive: 0x1a3a2a,
      emissiveIntensity: 0.03
    });

    // Crystal growth material
    const crystalMat = materialRegistry.getStandard('world.fractalvalley.bridge.echo.crystal', {
      color: 0x45b5be,
      roughness: 0.12,
      metalness: 0.78,
      emissive: 0x2ca8c0,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.85
    });

    // Main deck — two sections with a small gap (partially ruined)
    const gapCenter = span * 0.12;
    const gapWidth = 0.6;
    const leftSpan = (span * 0.5 + gapCenter) - gapWidth * 0.5;
    const rightSpan = (span * 0.5 - gapCenter) - gapWidth * 0.5;

    // Left deck section
    const leftDeckX = -gapCenter * 0.5 - gapWidth * 0.5 - leftSpan * 0.5;
    group.add(this.createBoxPart(
      ancientStone,
      new THREE.Vector3(leftSpan, 0.24, deckWidth),
      new THREE.Vector3(leftDeckX, deckRise * 0.3, 0)
    ));

    // Right deck section
    const rightDeckX = -gapCenter * 0.5 + gapWidth * 0.5 + rightSpan * 0.5;
    group.add(this.createBoxPart(
      mossStone,
      new THREE.Vector3(rightSpan, 0.24, deckWidth),
      new THREE.Vector3(rightDeckX, deckRise * 0.3, 0)
    ));

    // Stone arch supports underneath
    const archCount = 3;
    for (let i = 0; i < archCount; i++) {
      const archT = (i + 1) / (archCount + 1);
      const archX = -span * 0.5 + archT * span;
      const archHeight = 1.8 + Math.sin(archT * Math.PI) * 0.6;
      group.add(this.createBoxPart(
        ancientStone,
        new THREE.Vector3(0.6, archHeight, deckWidth * 0.85),
        new THREE.Vector3(archX, -archHeight * 0.3, 0)
      ));
    }

    // Crystal growths — fractal formations emerging from the stone
    const crystalGeo = new THREE.OctahedronGeometry(1, 0);
    const crystalPositions = [
      { x: -span * 0.35, z: deckWidth * 0.3, scale: 0.6 },
      { x: -span * 0.15, z: -deckWidth * 0.25, scale: 0.45 },
      { x: span * 0.2, z: deckWidth * 0.35, scale: 0.55 },
      { x: span * 0.4, z: -deckWidth * 0.15, scale: 0.35 },
      { x: -span * 0.05, z: deckWidth * 0.4, scale: 0.4 },
      { x: span * 0.1, z: -deckWidth * 0.38, scale: 0.5 }
    ];

    this.echoBridgeCrystals = [];
    crystalPositions.forEach((cp) => {
      const crystal = new THREE.Mesh(crystalGeo, crystalMat.clone());
      const s = cp.scale;
      crystal.scale.set(s * 0.5, s * (1.0 + Math.random() * 0.8), s * 0.5);
      crystal.position.set(cp.x, deckRise * 0.3 + 0.12 + s * 0.3, cp.z);
      crystal.rotation.set(
        (Math.random() - 0.5) * 0.4,
        Math.random() * Math.PI,
        (Math.random() - 0.5) * 0.3
      );
      crystal.userData = {
        pulseOffset: Math.random() * Math.PI * 2,
        baseEmissive: 0.2 + Math.random() * 0.15
      };
      group.add(crystal);
      this.echoBridgeCrystals.push(crystal);
    });

    // Broken railing remnants — just a few posts surviving
    const remainingPosts = [
      { x: -span * 0.4, z: deckWidth * 0.42, height: 0.5 },
      { x: -span * 0.15, z: -deckWidth * 0.42, height: 0.35 },
      { x: span * 0.3, z: deckWidth * 0.42, height: 0.6 }
    ];
    remainingPosts.forEach((post) => {
      group.add(this.createBoxPart(
        ancientStone,
        new THREE.Vector3(0.12, post.height, 0.12),
        new THREE.Vector3(post.x, deckRise * 0.3 + post.height * 0.5, post.z)
      ));
    });

    // Landing areas
    [-1, 1].forEach((side) => {
      const endX = side * (span * 0.5 + 3.0);
      const landingTerrainY = this.sampleTerrainHeight(
        frame.point.x + frame.lateral.x * endX,
        frame.point.z + frame.lateral.z * endX
      ) - deckY;
      group.add(this.createBoxPart(
        mossStone,
        new THREE.Vector3(5.0, 0.18, deckWidth + 0.5),
        new THREE.Vector3(endX, Math.min(deckRise * 0.3 - 0.05, landingTerrainY + 0.15), 0)
      ));
    });

    // Ground surface for player walking
    this.bridgeGroundSurfaces.push({
      type: 'echo',
      point: frame.point.clone(),
      tangent: frame.tangent.clone(),
      lateral: frame.lateral.clone(),
      span,
      halfWidth: deckWidth * 0.5,
      deckY,
      deckRise: deckRise * 0.3,
      surfaceOffset: 0.12
    });

    // Collision deck
    const deckCollider = new THREE.Mesh(
      this.sharedWorldGeometries.box,
      new THREE.MeshBasicMaterial({ visible: false })
    );
    deckCollider.name = 'fractalValleyEchoBridgeDeckCollider';
    deckCollider.scale.set(span * 0.95, 0.2, deckWidth * 0.9);
    deckCollider.position.set(0, 0.05, 0);
    deckCollider.userData = {
      collisionEnabled: true,
      isWalkable: true,
      collisionRole: 'terrain',
      terrainType: 'bridgeDeck',
      bridgeType: 'echo'
    };
    group.add(deckCollider);
    this.collisionObjects.push(deckCollider);

    group.name = 'fractalValleyEchoBridge';
    return group;
  }
  
  /**
   * Create valley mist
   */
  createMist() {
    if (this.scene) {
      this.scene.fog = new THREE.FogExp2(0x171b27, 0.018);
    }

    const createLayer = (size, y, color, opacity) => {
      const geometry = new THREE.PlaneGeometry(size, size);
      const material = materialRegistry.getBasic('world.fractalvalley.mist', {
        color,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const plane = new THREE.Mesh(geometry, material);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = y;
      plane.renderOrder = 2;
      this.worldRoot.add(plane);
      return plane;
    };

    this.mistLayers = [
      createLayer(240, 2.5, 0x8b84aa, 0.06),
      createLayer(320, 14, 0x5e617f, 0.03)
    ];
  }

  createSkyDome() {
    if (this.scene) {
      this.scene.background = new THREE.Color(0x0b1020);
    }

    const skyGeometry = new THREE.SphereGeometry(200, 32, 16);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTopColor: { value: new THREE.Color(0x0b1020) },
        uHorizonColor: { value: new THREE.Color(0x2a3042) },
        uNebulaColor1: { value: new THREE.Color(0x5b5378) },
        uNebulaColor2: { value: new THREE.Color(0x244f5e) },
        uNebulaColor3: { value: new THREE.Color(0x3a2855) },
        uAuroraColor1: { value: new THREE.Color(0x2ca8c0) },
        uAuroraColor2: { value: new THREE.Color(0x7b68ae) },
        uStarIntensity: { value: 0.55 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uTopColor;
        uniform vec3 uHorizonColor;
        uniform vec3 uNebulaColor1;
        uniform vec3 uNebulaColor2;
        uniform vec3 uNebulaColor3;
        uniform vec3 uAuroraColor1;
        uniform vec3 uAuroraColor2;
        uniform float uStarIntensity;
        varying vec3 vWorldPosition;

        float softBlob(vec2 uv, vec2 center, float radius) {
          float d = length(uv - center);
          return smoothstep(radius, radius * 0.2, d);
        }

        float starLayer(vec2 uv, float seed) {
          uv += vec2(seed, seed * 1.7);
          float pattern = sin(uv.x * 42.0 + uTime * 0.03) * sin(uv.y * 56.0 + uTime * 0.05);
          return smoothstep(0.985, 1.0, pattern);
        }

        float fractalNoise(vec2 uv, float t) {
          float v = 0.0;
          v += sin(uv.x * 3.7 + t * 0.12) * sin(uv.y * 4.3 - t * 0.09) * 0.5;
          v += sin(uv.x * 7.1 - t * 0.08 + uv.y * 2.9) * 0.25;
          v += sin(uv.x * 13.3 + uv.y * 11.7 + t * 0.05) * 0.125;
          return v;
        }

        void main() {
          vec3 dir = normalize(vWorldPosition);
          float height = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 baseColor = mix(uHorizonColor, uTopColor, height);

          vec2 uv = dir.xz * 0.7;

          // Nebula blobs — drifting fractal clouds
          vec2 blob1 = uv + vec2(sin(uTime * 0.08) * 0.3, cos(uTime * 0.11) * 0.25);
          vec2 blob2 = uv + vec2(cos(uTime * 0.1) * 0.25, sin(uTime * 0.13) * 0.3);
          vec2 blob3 = uv + vec2(sin(uTime * 0.06) * 0.2, cos(uTime * 0.09) * 0.35);
          float n1 = softBlob(blob1, vec2(-0.2, 0.1), 0.7);
          float n2 = softBlob(blob2, vec2(0.3, -0.2), 0.6);
          float n3 = softBlob(uv, vec2(0.0, 0.3), 0.5);
          float n4 = softBlob(blob3, vec2(-0.4, -0.15), 0.55);

          // Stars — three layers for depth
          float stars = starLayer(uv * 2.8, 0.23) * 0.55
                      + starLayer(uv * 4.5, 1.57) * 0.4
                      + starLayer(uv * 7.2, 3.14) * 0.25;

          // Aurora bands — slow-shifting curtains of light near the horizon
          float auroraHeight = smoothstep(0.15, 0.55, dir.y) * smoothstep(0.85, 0.55, dir.y);
          float auroraWave1 = sin(dir.x * 4.5 + uTime * 0.15) * sin(dir.z * 3.2 - uTime * 0.08);
          float auroraWave2 = sin(dir.x * 6.8 - uTime * 0.12 + dir.z * 2.1) * 0.5;
          float auroraMask = auroraHeight * (0.5 + 0.5 * auroraWave1 + auroraWave2 * 0.3);
          auroraMask *= 0.35;

          // Fractal noise overlay for nebula depth
          float fNoise = fractalNoise(uv * 1.5, uTime);

          vec3 color = baseColor;
          color += uNebulaColor1 * n1 * 0.18;
          color += uNebulaColor2 * n2 * 0.14;
          color += uNebulaColor3 * n4 * 0.12;
          color += mix(uNebulaColor1, uNebulaColor2, 0.5) * n3 * 0.08;
          color += mix(uNebulaColor1, uNebulaColor3, 0.6) * (0.5 + 0.5 * fNoise) * 0.06;
          color += vec3(1.0) * stars * 0.08 * uStarIntensity;

          // Aurora contribution
          vec3 auroraColor = mix(uAuroraColor1, uAuroraColor2, 0.5 + 0.5 * auroraWave1);
          color += auroraColor * auroraMask;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
      transparent: false
    });

    const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
    skyDome.name = 'fractalSkyDome';
    this.worldRoot.add(skyDome);
    this.skyDomeMaterial = skyMaterial;
  }

  createVortexParticles() {
    const particleCount = 60;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const angles = new Float32Array(particleCount);
    const radii = new Float32Array(particleCount);
    const heights = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);
    const rises = new Float32Array(particleCount);

    const colorLow = new THREE.Color(0x8800ff);
    const colorHigh = new THREE.Color(0x00dddd);

    const resetParticle = (index) => {
      const radius = 15 + Math.random() * 10;
      const angle = Math.random() * Math.PI * 2;
      const height = 1 + Math.random() * 4;
      const size = 0.4 + Math.random() * 0.6;
      const speed = 0.4 + Math.random() * 0.2;
      const rise = 0.12 + Math.random() * 0.08;

      angles[index] = angle;
      radii[index] = radius;
      heights[index] = height;
      speeds[index] = speed;
      rises[index] = rise;
      sizes[index] = size;
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = height;
      const t = Math.min(Math.max(y / 30, 0), 1);
      const color = colorLow.clone().lerp(colorHigh, t);

      positions[index * 3] = x;
      positions[index * 3 + 1] = y;
      positions[index * 3 + 2] = z;
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    };

    for (let i = 0; i < particleCount; i++) {
      resetParticle(i);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: window.devicePixelRatio || 1 }
      },
      vertexShader: `
        uniform float uPixelRatio;
        attribute float aSize;
        attribute vec3 aColor;
        varying vec3 vColor;
        void main() {
          vColor = aColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (uPixelRatio / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          float dist = length(uv);
          float alpha = smoothstep(1.0, 0.4, dist);
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const vortex = new THREE.Points(geometry, material);
    vortex.name = 'vortexParticles';
    vortex.renderOrder = 11;
    this.worldRoot.add(vortex);

    this.vortexParticles = vortex;
    this.vortexData = {
      angles,
      radii,
      heights,
      speeds,
      rises,
      sizes,
      particleCount,
      resetParticle
    };
  }
  
  /**
   * Create particle drift
   */
  createParticleDrift() {
    // Particle drift removed to keep the foreground composition clean and focused.
    return;
  }

  /**
   * Create ambient luminous spores drifting through the valley.
   * These are fragments of recursive ideas floating between the ridges —
   * gentle, slow-moving particles that give the valley a sense of life.
   */
  createAmbientSpores() {
    const particleCount = 45;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const alphas = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);
    const driftX = new Float32Array(particleCount);
    const driftZ = new Float32Array(particleCount);

    const colorBase = new THREE.Color(0x70bcc2);
    const colorAccent = new THREE.Color(0xa088cc);

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;
      const y = 2 + Math.random() * 18;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const color = Math.random() > 0.7 ? colorAccent : colorBase;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      alphas[i] = 0.15 + Math.random() * 0.25;
      speeds[i] = 0.15 + Math.random() * 0.25;
      driftX[i] = (Math.random() - 0.5) * 0.3;
      driftZ[i] = (Math.random() - 0.5) * 0.3;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: window.devicePixelRatio || 1 }
      },
      vertexShader: `
        uniform float uPixelRatio;
        attribute float aAlpha;
        attribute vec3 aColor;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = aColor;
          vAlpha = aAlpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 12.0 * (uPixelRatio / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          float dist = length(uv);
          float mask = smoothstep(1.0, 0.2, dist);
          float alpha = clamp(mask * vAlpha, 0.0, 1.0);
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const spores = new THREE.Points(geometry, material);
    spores.name = 'fractalValleyAmbientSpores';
    spores.renderOrder = 10;
    this.worldRoot.add(spores);

    this.ambientSpores = spores;
    this.ambientSporeData = {
      speeds,
      driftX,
      driftZ,
      particleCount
    };
  }

  /**
   * Create luminous data particles flowing along the river surface.
   * These represent the stream of consciousness — bright cyan dots
   * traveling the river path at varying speeds.
   */
  createRiverDataStream() {
    const particleCount = 35;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const tValues = new Float32Array(particleCount);
    const lateralOffsets = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);

    const colorBright = new THREE.Color(0x7ed9e5);
    const colorDim = new THREE.Color(0x35b9c6);

    for (let i = 0; i < particleCount; i++) {
      tValues[i] = Math.random();
      lateralOffsets[i] = (Math.random() - 0.5) * 1.6;
      speeds[i] = 0.015 + Math.random() * 0.02;

      const t = tValues[i];
      const point = this.riverCurve.getPointAt(t);
      const tangent = this.riverCurve.getTangentAt(t).normalize();
      const lateral = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const halfWidth = this.getRiverWidth(point.z) * 0.5;

      positions[i * 3] = point.x + lateral.x * lateralOffsets[i] * halfWidth;
      positions[i * 3 + 1] = this.getRiverSurfaceHeight(point.x, point.z) + 0.15;
      positions[i * 3 + 2] = point.z + lateral.z * lateralOffsets[i] * halfWidth;

      const color = colorDim.clone().lerp(colorBright, Math.random());
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: window.devicePixelRatio || 1 }
      },
      vertexShader: `
        uniform float uPixelRatio;
        attribute vec3 aColor;
        varying vec3 vColor;
        void main() {
          vColor = aColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 8.0 * (uPixelRatio / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          float dist = length(uv);
          float alpha = smoothstep(1.0, 0.15, dist) * 0.6;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const stream = new THREE.Points(geometry, material);
    stream.name = 'fractalValleyRiverDataStream';
    stream.renderOrder = 5;
    this.worldRoot.add(stream);

    this.riverDataStream = stream;
    this.riverDataStreamData = {
      tValues,
      lateralOffsets,
      speeds,
      particleCount,
      colorBright,
      colorDim
    };
  }

  /**
   * Create fractal holograms
   */
  createFractalHolograms() {
    // Hologram clutter disabled so the bridge and pool remain the compositional center.
    return;
  }

  createHologramPulseRing(hologram) {
    const geometry = new THREE.RingGeometry(0.1, 1, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00dddd,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(hologram.position);
    ring.scale.set(0.01, 0.01, 0.01);
    ring.userData = {
      age: 0,
      duration: 2
    };

    this.worldRoot.add(ring);
    return ring;
  }

  /**
   * Create floating symbols
   */
  createFloatingSymbols() {
    // Floating symbols suppressed to reduce foreground noise around the hero bridge.
    return;
  }

  /**
   * Create geometric constellations in sky
   */
  createGeometricConstellations() {
    // Constellation decoration removed for a cleaner ridge background.
    this.constellations = [];
    return;
  }

  /**
   * Create constellation from points
   */
  createConstellation(points, color) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.PointsMaterial({
      color: color,
      size: 0.3,
      transparent: true,
      opacity: 0.4
    });
    
    const constellation = new THREE.Points(geometry, material);
    constellation.userData = { pulseOffset: Math.random() * Math.PI * 2 };
    this.worldRoot.add(constellation);

    // No mesh connections to avoid fake guide-line artifacts.
    constellation.userData.connections = null;
    this.constellations.push(constellation);
  }
  
  /**
   * Create distortion wave planes
   */
  createDistortionWaves() {
    this.distortionWaves = [];
  }
  
  /**
   * Update fractal valley animations
   */
  update(deltaTime, time) {
    if (!this.allowWorldTimeModulation && !this.enableDecorativeWorldFX) {
      return;
    }

    // Update reference plane (canonical contract)
    if (this.referencePlane && this.referencePlane.animate) {
      this.referencePlane.animate(deltaTime, time);
    }

    // Hex terrace glow pulse
    if (this.allowWorldTimeModulation && this.hexTerraces) {
      this.hexTerraces.forEach(hex => {
        if (!hex.material) return;
        const pulse = 0.5 + 0.5 * Math.sin(time * 0.45 + hex.userData.pulseOffset);
        hex.material.emissiveIntensity = 0.02 + pulse * 0.025;
      });
    }
    
    // Floating fragments
    if (this.allowWorldTimeModulation) {
      this.fractalFragments.forEach(fragment => {
        const data = fragment.userData;
        
        fragment.position.y = data.originalY + 
          Math.sin(time * data.floatSpeed + data.floatOffset) * 1.35;
        
        const glow = data.glowSprite;
        if (glow) {
          const pulse = 0.75 + 0.12 * Math.sin(time * data.floatSpeed + data.floatOffset);
          const glowScale = data.size * 1.45 * pulse;
          glow.scale.set(glowScale, glowScale, 1);
        }
        
        fragment.rotation.x += data.rotationSpeed * deltaTime;
        fragment.rotation.y += data.rotationSpeed * deltaTime * 1.2;
      });
    }

    if (this.allowWorldTimeModulation) {
      this.updateMountainSilhouetteGlow(deltaTime);
      this.updateFragmentLightning(deltaTime, time);
      if (this.skyDomeMaterial) {
        this.skyDomeMaterial.uniforms.uTime.value = time;
      }
      if (this.riverWaterMesh?.material?.uniforms) {
        this.riverWaterMesh.material.uniforms.uTime.value = time;
      }
      if (this.riverBankMeshes) {
        this.riverBankMeshes.forEach((mesh) => {
          if (mesh?.material?.uniforms) {
            mesh.material.uniforms.uTime.value = time;
          }
        });
      }
    }
    
    // Data rivers flow
    if (this.allowWorldTimeModulation && this.dataRiverData) {
      const data = this.dataRiverData;
      const positions = data.positions;
      const colors = this.dataRivers[0].geometry.attributes.color.array;
      const tValues = data.tValues;
      const total = data.totalPoints;
      const low = data.colorLow;
      const high = data.colorHigh;

      for (let i = 0; i < total; i++) {
        tValues[i] += data.speeds[i] * deltaTime;
        if (tValues[i] > 1.0) {
          tValues[i] -= 1.0;
        }

        const point = data.curve.getPointAt(tValues[i], this._riverScratchPoint);
        const tangent = data.curve.getTangentAt(tValues[i], this._riverScratchTangent);
        const tangentLength = Math.hypot(tangent.x, tangent.z) || 1;
        const lateralX = -tangent.z / tangentLength;
        const lateralZ = tangent.x / tangentLength;
        const halfWidth = this.getRiverWidth(point.z) * 0.66;
        const lateralOffset = data.lateralOffsets[i] * halfWidth;
        const idx = i * 3;

        positions[idx] = point.x + lateralX * lateralOffset;
        positions[idx + 1] = this.getRiverSurfaceHeight(point.x, point.z) + 0.08;
        positions[idx + 2] = point.z + lateralZ * lateralOffset;

        colors[idx] = low.r + (high.r - low.r) * tValues[i];
        colors[idx + 1] = low.g + (high.g - low.g) * tValues[i];
        colors[idx + 2] = low.b + (high.b - low.b) * tValues[i];
      }

      const geom = this.dataRivers[0].geometry;
      geom.attributes.position.needsUpdate = true;
      geom.attributes.color.needsUpdate = true;
      geom.attributes.aT.needsUpdate = true;
      if (this.dataRivers[0].material && this.dataRivers[0].material.uniforms) {
        this.dataRivers[0].material.uniforms.uTime.value = time;
      }
    }
    
    // Mist wave
    if (this.allowWorldTimeModulation && this.mistLayers) {
      this.mistLayers.forEach((layer, index) => {
        if (!layer || !layer.material) {
          return;
        }
        const baseOpacities = [0.08, 0.05, 0.025];
        const amplitudes = [0.018, 0.012, 0.008];
        const speeds = [0.22, 0.16, 0.11];
        const pulse = Math.sin(time * speeds[index] + index * 1.2);
        layer.material.opacity = baseOpacities[index] + pulse * amplitudes[index];
      });
    }

    // Fractal crystals pulse and gentle float
    if (this.allowWorldTimeModulation && this.fractalCrystals) {
      this.fractalCrystals.forEach(crystal => {
        const data = crystal.userData;
        const pulse = 0.5 + 0.5 * Math.sin(time * 0.6 + data.pulseOffset);
        crystal.material.emissiveIntensity = data.baseEmissiveIntensity + pulse * 0.12;
        crystal.position.y = data.originalY + Math.sin(time * data.floatSpeed + data.pulseOffset) * data.floatAmplitude;
      });
    }

    // Echo bridge crystal glow
    if (this.allowWorldTimeModulation && this.echoBridgeCrystals) {
      this.echoBridgeCrystals.forEach(crystal => {
        const data = crystal.userData;
        const pulse = 0.5 + 0.5 * Math.sin(time * 0.8 + data.pulseOffset);
        crystal.material.emissiveIntensity = data.baseEmissive + pulse * 0.18;
      });
    }

    // Ambient spores drift
    if (this.enableDecorativeWorldFX && this.ambientSpores && this.ambientSporeData) {
      const positions = this.ambientSpores.geometry.attributes.position.array;
      const data = this.ambientSporeData;

      for (let i = 0; i < data.particleCount; i++) {
        const idx = i * 3;
        positions[idx] += data.driftX[i] * deltaTime;
        positions[idx + 1] += data.speeds[i] * deltaTime;
        positions[idx + 2] += data.driftZ[i] * deltaTime;

        // Reset spores that drift too high or too far
        if (positions[idx + 1] > 28 ||
            Math.abs(positions[idx]) > 110 ||
            Math.abs(positions[idx + 2]) > 110) {
          positions[idx] = (Math.random() - 0.5) * 200;
          positions[idx + 1] = 1 + Math.random() * 3;
          positions[idx + 2] = (Math.random() - 0.5) * 200;
        }
      }

      this.ambientSpores.geometry.attributes.position.needsUpdate = true;
    }

    // River data stream flow
    if (this.enableDecorativeWorldFX && this.riverDataStream && this.riverDataStreamData) {
      const positions = this.riverDataStream.geometry.attributes.position.array;
      const colors = this.riverDataStream.geometry.attributes.aColor.array;
      const data = this.riverDataStreamData;

      for (let i = 0; i < data.particleCount; i++) {
        data.tValues[i] += data.speeds[i] * deltaTime;
        if (data.tValues[i] > 1.0) {
          data.tValues[i] -= 1.0;
        }

        const t = data.tValues[i];
        const point = this.riverCurve.getPointAt(t);
        const tangent = this.riverCurve.getTangentAt(t).normalize();
        const lateral = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        const halfWidth = this.getRiverWidth(point.z) * 0.5;
        const lateralOffset = data.lateralOffsets[i] * halfWidth;

        const idx = i * 3;
        positions[idx] = point.x + lateral.x * lateralOffset;
        positions[idx + 1] = this.getRiverSurfaceHeight(point.x, point.z) + 0.15;
        positions[idx + 2] = point.z + lateral.z * lateralOffset;

        // Color shifts along the flow
        const colorMix = 0.5 + 0.5 * Math.sin(t * Math.PI * 4 + time * 0.5);
        const color = data.colorDim.clone().lerp(data.colorBright, colorMix);
        colors[idx] = color.r;
        colors[idx + 1] = color.g;
        colors[idx + 2] = color.b;
      }

      this.riverDataStream.geometry.attributes.position.needsUpdate = true;
      this.riverDataStream.geometry.attributes.aColor.needsUpdate = true;
    }

    // World FX Policy: gate decorative FX updates
    // Particles drift
    if (this.enableDecorativeWorldFX && this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      const velocities = this.particles.userData.velocities;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i] * deltaTime * 10;
        positions[i + 1] += velocities[i + 1] * deltaTime * 10;
        positions[i + 2] += velocities[i + 2] * deltaTime * 10;
        
        if (positions[i + 1] > 45 || 
            Math.abs(positions[i]) > 80 || 
            Math.abs(positions[i + 2]) > 80) {
          positions[i] = (Math.random() - 0.5) * 150;
          positions[i + 1] = 0;
          positions[i + 2] = (Math.random() - 0.5) * 150;
        }
      }
      
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    if (this.enableDecorativeWorldFX && this.vortexParticles && this.vortexData) {
      const positions = this.vortexParticles.geometry.attributes.position.array;
      const colors = this.vortexParticles.geometry.attributes.color.array;
      const sizes = this.vortexParticles.geometry.attributes.aSize.array;
      const data = this.vortexData;
      const colorLow = new THREE.Color(0x8800ff);
      const colorHigh = new THREE.Color(0x00dddd);

      for (let i = 0; i < data.particleCount; i++) {
        data.angles[i] += data.speeds[i] * deltaTime;
        data.radii[i] *= 0.999;
        data.heights[i] += data.rises[i] * deltaTime;

        if (data.heights[i] > 30 || data.radii[i] < 0.5) {
          data.resetParticle(i);
        }

        const angle = data.angles[i];
        const radius = data.radii[i];
        const height = data.heights[i];
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = height;
        const t = Math.min(Math.max(y / 30, 0), 1);
        const color = colorLow.clone().lerp(colorHigh, t);

        const idx = i * 3;
        positions[idx] = x;
        positions[idx + 1] = y;
        positions[idx + 2] = z;
        colors[idx] = color.r;
        colors[idx + 1] = color.g;
        colors[idx + 2] = color.b;
        sizes[i] = 0.4 + (1.0 - t) * 0.6;
      }

      this.vortexParticles.geometry.attributes.position.needsUpdate = true;
      this.vortexParticles.geometry.attributes.color.needsUpdate = true;
      this.vortexParticles.geometry.attributes.aSize.needsUpdate = true;
    }
    
    // Fractal holograms
    if (this.enableDecorativeWorldFX) {
      this.holograms.forEach(hologram => {
        hologram.userData.timer -= deltaTime;
        
        if (hologram.userData.timer <= 0 && hologram.userData.duration <= 0) {
          hologram.userData.duration = 4 + Math.random() * 3;
          hologram.userData.timer = 8 + Math.random() * 12;
          hologram.userData.pulsePhase = 0;
          if (!hologram.userData.activeRing) {
            hologram.userData.activeRing = this.createHologramPulseRing(hologram);
          }
        }
        
        if (hologram.userData.duration > 0) {
          hologram.userData.duration -= deltaTime;
          hologram.userData.pulsePhase += deltaTime * 1.5;
          
          const fadeIn = Math.min(hologram.userData.pulsePhase, 1);
          const fadeOut = Math.max(0, hologram.userData.duration / 2);
          const opacity = Math.min(fadeIn, fadeOut) * 0.35;
          
          hologram.material.opacity = opacity;
          hologram.rotation.x += deltaTime * 0.4;
          hologram.rotation.y += deltaTime * 0.6;
        } else {
          hologram.material.opacity = 0;
        }

        const ring = hologram.userData.activeRing;
        if (ring) {
          ring.userData.age += deltaTime;
          const progress = ring.userData.age / ring.userData.duration;
          const scale = Math.min(progress * 8, 8);
          ring.scale.set(scale, scale, scale);
          ring.material.opacity = Math.max(0, 0.35 * (1 - progress));

          if (ring.userData.age >= ring.userData.duration) {
            this.worldRoot.remove(ring);
            ring.geometry.dispose();
            ring.material.dispose();
            hologram.userData.activeRing = null;
          }
        }
      });
    }
    
    // Floating symbols
    if (this.enableDecorativeWorldFX) {
      this.symbols.forEach(symbol => {
        symbol.userData.timer -= deltaTime;
        
        if (symbol.userData.timer <= 0 && symbol.userData.duration <= 0) {
          symbol.userData.duration = 3 + Math.random() * 2;
          symbol.userData.timer = 10 + Math.random() * 15;
          symbol.userData.fadePhase = 0;
        }
        
        if (symbol.userData.duration > 0) {
          symbol.userData.duration -= deltaTime;
          symbol.userData.fadePhase += deltaTime;
          
          const fadeIn = Math.min(symbol.userData.fadePhase, 1);
          const fadeOut = Math.max(0, symbol.userData.duration);
          const opacity = Math.min(fadeIn, fadeOut) * 0.25;
          
          symbol.material.opacity = opacity;
          symbol.rotation.x += deltaTime * 0.3;
          symbol.rotation.y += deltaTime * 0.2;
        } else {
          symbol.material.opacity = 0;
        }
      });
    }
    
    // Constellations twinkle
    if (this.enableDecorativeWorldFX && this.constellations) {
      this.constellations.forEach(constellation => {
        const pulse = Math.sin(time * 0.8 + constellation.userData.pulseOffset);
        constellation.material.opacity = 0.35 + pulse * 0.15;
        if (constellation.userData.connections) {
          constellation.userData.connections.material.opacity = 0.12 + pulse * 0.06;
        }
      });
    }
    
    // Distortion waves
    if (this.enableDecorativeWorldFX) {
      this.distortionWaves.forEach(wave => {
        wave.userData.timer -= deltaTime;
        
        if (wave.userData.timer <= 0 && wave.userData.duration <= 0) {
          wave.userData.duration = 2 + Math.random() * 1.5;
          wave.userData.timer = 15 + Math.random() * 15;
          wave.userData.wavePhase = 0;
        }
        
        if (wave.userData.duration > 0) {
          wave.userData.duration -= deltaTime;
          wave.userData.wavePhase += deltaTime * 3;
          
          if (wave.material && wave.material.uniforms) {
            wave.material.uniforms.uTime.value = time;
            wave.material.uniforms.uOpacity.value = Math.max(0, Math.sin(wave.userData.wavePhase) * 0.08);
          }
        } else {
          if (wave.material && wave.material.uniforms) {
            wave.material.uniforms.uOpacity.value = 0;
          }
        }
      });
    }
  }
}
