import * as THREE from 'three';
import { materialRegistry } from './src/metrics/rendering/MaterialRegistry_v1.js';
import { initMapReferencePlane } from './MapReferencePlaneFactory.js';
import { getMapConfig } from './MapConfigBase.js';

/**
 * Fractal Valley - Recursive mathematical structures
 * Represents AI visualization of pattern formation and logic
 * NOTE: Keep `getGroundLevelAt(x, z)` aligned with the terrain so the player controller can avoid raycast probes.
 * NOTE: Walkable terrain helpers stay tagged as terrain; any true obstacle needs an explicit blocker collider.
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
    this.fragmentGlowMaterial = null;
    this.fragmentLightningLines = [];
    this.dataRivers = [];
    this.holograms = [];
    this.symbols = [];
    this.bridges = [];
    this.bridgeGroundSurfaces = [];
    this.collisionObjects = []; // Track collision meshes
    this.playerGroundOffset = 1;
    
    // Session 112+: Initialize map configuration and reference plane
    this.initializeMapConfig();
    this.initializeValleyLayout();
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
      ridgeMid: new THREE.Color(0x3d4556),
      ridgeLight: new THREE.Color(0x6c727c),
      groundLow: new THREE.Color(0x59534f),
      groundMid: new THREE.Color(0x70675f),
      groundHigh: new THREE.Color(0x8a8688),
      wetBank: new THREE.Color(0x4d5558),
      riverDeep: new THREE.Color(0x16303b),
      riverGlow: new THREE.Color(0x4ba6ac),
      riverEdge: new THREE.Color(0x8cc2c9),
      lavenderMist: new THREE.Color(0x8d84ad),
      bridgeWood: new THREE.Color(0x5d544d),
      bridgeStone: new THREE.Color(0x4f4b52),
      bridgeSteel: new THREE.Color(0x555d68),
      fractalAccent: new THREE.Color(0x7bc0c4)
    };

    this.sharedWorldGeometries = {
      box: new THREE.BoxGeometry(1, 1, 1),
      outcrop: new THREE.CylinderGeometry(1, 1, 1, 6, 1, false),
      stone: new THREE.DodecahedronGeometry(1, 0)
    };

    this._riverScratchPoint = new THREE.Vector3();
    this._riverScratchTangent = new THREE.Vector3();
    this._riverScratchLateral = new THREE.Vector3();
    this.riverCurve = this.createRiverCurve();
    this.bridgePlacements = [
      { type: 'hero', t: 0.31 },
      { type: 'distant', t: 0.73 }
    ];
  }

  createRiverCurve() {
    const points = [];
    const segmentCount = 18;

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
      Math.sin(z * 0.028) * 16 +
      Math.sin(z * 0.0105 + 0.8) * 28 +
      Math.sin(z * 0.055 + 1.4) * 5
    );
  }

  getRiverWidth(z) {
    return 7.2 + Math.sin(z * 0.032 + 0.5) * 1.3 + Math.abs(this.sampleTerrainNoise(14, z * 0.45)) * 1.1;
  }

  getRiverSurfaceHeight(x, z) {
    return -3.1 + Math.sin(z * 0.016) * 0.16 + this.sampleTerrainNoise(x * 0.55 + 17, z * 0.55 - 9) * 0.18;
  }

  sampleTerrainHeight(x, z) {
    const riverCenterX = this.getRiverCenterX(z);
    const riverDelta = x - riverCenterX;
    const absRiverDelta = Math.abs(riverDelta);
    const riverWidth = this.getRiverWidth(z);

    const macroNoise = this.sampleTerrainNoise(x * 0.95, z * 0.95) * 2.2;
    const microNoise = this.sampleTerrainNoise(x * 2.25 + 31.7, z * 2.25 - 17.3) * 0.7;
    const fractureNoise = Math.abs(this.sampleTerrainNoise(x * 1.55 - 53, z * 1.55 + 19));

    const valleyBase = -1.6 + macroNoise * 0.55 + microNoise * 0.3;
    const bankLift = this._smoothstep(riverWidth * 0.8, riverWidth * 4.6, absRiverDelta) * (1.45 + absRiverDelta * 0.072);

    const leftMask = this._clamp01((-riverDelta - 8) / 60);
    const rightMask = this._clamp01((riverDelta - 10) / 72);

    const leftRidge = leftMask * (
      5.8 +
      Math.max(0, -riverDelta) * 0.18 +
      fractureNoise * 5.5 +
      Math.sin(z * 0.026 - 1.2) * 1.8
    );
    const rightRidge = rightMask * (
      4.2 +
      Math.max(0, riverDelta) * 0.135 +
      fractureNoise * 3.9 +
      Math.cos(z * 0.022 + 0.9) * 1.35
    );

    const farShoulder = this._smoothstep(52, 138, Math.abs(z + 18)) * 1.75;
    const subtleFractal = Math.sin(x * 0.03 + z * 0.016) * Math.cos(z * 0.041) * 0.52;
    const riverCarve = this._smoothstep(riverWidth * 2.8, 0, absRiverDelta) * (
      3.9 + (1 - this._clamp01(absRiverDelta / (riverWidth * 2.8))) * 0.95
    );
    const shallowShelf = this._smoothstep(riverWidth * 1.65, riverWidth * 0.7, absRiverDelta) * 0.9;

    return valleyBase + bankLift + leftRidge * 0.5 + rightRidge * 0.48 + farShoulder + subtleFractal - riverCarve - shallowShelf;
  }

  getGroundLevelAt(x, z) {
    const bridgeLevel = this.sampleBridgeGroundHeight(x, z);
    if (Number.isFinite(bridgeLevel)) {
      return bridgeLevel;
    }

    return this.sampleTerrainHeight(x, z) + this.playerGroundOffset;
  }

  getMaxStepHeight() {
    return 2.35;
  }

  getMovementBounds() {
    return {
      type: 'circle',
      center: new THREE.Vector3(0, 0, 0),
      radius: 138
    };
  }

  sampleBridgeGroundHeight(x, z) {
    for (const bridge of this.bridgeGroundSurfaces) {
      const dx = x - bridge.point.x;
      const dz = z - bridge.point.z;
      const along = dx * bridge.lateral.x + dz * bridge.lateral.z;
      const across = dx * bridge.tangent.x + dz * bridge.tangent.z;
      const halfSpan = bridge.span * 0.5;

      if (Math.abs(along) > halfSpan || Math.abs(across) > (bridge.halfWidth + 0.8)) {
        continue;
      }

      if (bridge.type === 'hero') {
        const normalized = this._clamp01((along + halfSpan) / bridge.span);
        const arch = Math.sin(normalized * Math.PI) * bridge.deckRise;
        return bridge.deckY + bridge.surfaceOffset + arch;
      }

      return bridge.deckY + bridge.surfaceOffset;
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
    const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize, 64, 64);
    const positions = floorGeometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i);
      const height = this.sampleTerrainHeight(x, z);
      const riverCenterX = this.getRiverCenterX(z);
      const riverDistance = Math.abs(x - riverCenterX);
      const riverWidth = this.getRiverWidth(z);
      const heightMix = this._clamp01((height + 4) / 24);
      const wetBlend = this._clamp01(1 - riverDistance / (riverWidth * 3.25));
      const hazeBlend = this._smoothstep(14, 28, height) * 0.2;
      const coolShadow = this._clamp01((Math.abs(x) * 0.006 + Math.max(0, -height) * 0.04) * 0.8);

      const color = this.palette.groundLow.clone();
      color.lerp(this.palette.groundMid, heightMix);
      color.lerp(this.palette.groundHigh, Math.pow(heightMix, 1.8));
      color.lerp(this.palette.ridgeShadow, coolShadow * 0.28);
      color.lerp(this.palette.wetBank, wetBlend * 0.55);
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
      vertexColors: true
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
    const outcropCount = 8;
    const baseMaterial = materialRegistry.getStandard('world.fractalvalley.outcrop', {
      color: 0x565158,
      roughness: 0.92,
      metalness: 0.08,
      emissive: 0x58b4ba,
      emissiveIntensity: 0.025
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
      const x = riverCenterX + side * (riverWidth + 22 + Math.random() * 36);
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
        opacity: 0.1
      });
      const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      hex.add(edges);
    }
  }
  
  /**
   * Create irregular layered ridge silhouettes around the valley.
   */
  createFractalMountains() {
    const ridgeConfigs = [
      { position: new THREE.Vector3(-94, 6, 18), width: 176, height: 34, depth: 16, seed: 1.1, bias: 0.28, color: 0x273041 },
      { position: new THREE.Vector3(92, 4, -18), width: 154, height: 25, depth: 13, seed: 2.7, bias: -0.22, color: 0x323a49 },
      { position: new THREE.Vector3(0, 7, -112), width: 246, height: 46, depth: 18, seed: 4.1, bias: 0.05, color: 0x21293a },
      { position: new THREE.Vector3(-56, 8, 104), width: 162, height: 18, depth: 11, seed: 5.4, bias: 0.18, color: 0x353d4c },
      { position: new THREE.Vector3(66, 7, 94), width: 184, height: 21, depth: 12, seed: 6.2, bias: -0.12, color: 0x2d3546 }
    ];

    ridgeConfigs.forEach((config, index) => {
      const geometry = this.createRidgeGeometry(config.width, config.height, config.depth, config.seed, config.bias);
      const material = materialRegistry.getStandard(`world.fractalvalley.ridge.${index}`, {
        color: config.color,
        roughness: 0.96,
        metalness: 0.03,
        flatShading: false
      });

      const ridge = new THREE.Mesh(geometry, material);
      ridge.position.copy(config.position);
      ridge.rotation.y = Math.atan2(-config.position.x, -config.position.z) + (config.yawOffset || 0);
      ridge.castShadow = true;
      ridge.receiveShadow = false;
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
    const fragmentCount = 2;
    const glowMaterial = this.createFragmentGlowMaterial();
    
    for (let i = 0; i < fragmentCount; i++) {
      const size = 1.4 + Math.random() * 1.3;
      const iterations = 0;
      
      const geometry = new THREE.IcosahedronGeometry(size, iterations);
      const material = materialRegistry.getStandard('world.fractalvalley.fragment', {
        color: 0x56606d,
        transparent: true,
        opacity: 0.24,
        wireframe: true,
        metalness: 0.28,
        roughness: 0.82,
        emissive: 0x6ab8be,
        emissiveIntensity: 0.03
      });
      
      const fragment = new THREE.Mesh(geometry, material);
      
      const angle = -Math.PI * 0.45 + Math.random() * Math.PI * 0.9;
      const distance = 88 + Math.random() * 36;
      
      fragment.position.x = Math.cos(angle) * distance;
      fragment.position.y = 18 + Math.random() * 14;
      fragment.position.z = Math.sin(angle) * distance;
      
      fragment.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      const glow = new THREE.Sprite(glowMaterial);
      glow.scale.set(size * 2, size * 2, 1);
      glow.position.set(0, 0, 0);
      fragment.add(glow);
      
      fragment.userData = {
        floatSpeed: 0.06 + Math.random() * 0.03,
        floatOffset: Math.random() * Math.PI * 2,
        rotationSpeed: 0.025 + Math.random() * 0.03,
        originalY: fragment.position.y,
        glowSprite: glow,
        size: size
      };
      
      this.worldRoot.add(fragment);
      this.fractalFragments.push(fragment);
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
    const waterGeometry = this.buildRiverSurfaceGeometry(40);
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
          float edgeMask = 1.0 - abs(uv.x * 2.0 - 1.0);
          transformed.y += sin(uv.y * 38.0 - uTime * 1.4 + uv.x * 7.0) * 0.05 * (0.35 + edgeMask * 0.65);
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
          float edge = abs(vUv.x * 2.0 - 1.0);
          float centerMask = 1.0 - smoothstep(0.0, 1.0, edge);
          float flow = 0.5 + 0.5 * sin(vUv.y * 44.0 - uTime * 1.8 + edge * 6.0);
          vec3 color = mix(uColorDeep, uColorGlow, centerMask * 0.68 + flow * 0.12);
          color = mix(color, uColorEdge, pow(centerMask, 2.4) * 0.25);
          float alpha = 0.72 + centerMask * 0.08;
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
    this.worldRoot.add(riverWater);
    this.riverWaterMesh = riverWater;

    const bankMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBankColor: { value: this.palette.wetBank.clone() },
        uEdgeColor: { value: this.palette.riverEdge.clone() }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uBankColor;
        uniform vec3 uEdgeColor;
        varying vec2 vUv;
        void main() {
          float edgeMask = 1.0 - vUv.x;
          float shimmer = 0.5 + 0.5 * sin(vUv.y * 26.0 - uTime * 1.05);
          vec3 color = mix(uBankColor, uEdgeColor, pow(edgeMask, 1.65) * (0.55 + shimmer * 0.08));
          float alpha = pow(edgeMask, 1.8) * 0.28;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const leftBank = new THREE.Mesh(this.buildRiverBankGeometry(40, 1), bankMaterial.clone());
    const rightBank = new THREE.Mesh(this.buildRiverBankGeometry(40, -1), bankMaterial.clone());
    leftBank.renderOrder = 3;
    rightBank.renderOrder = 3;
    rightBank.material.uniforms.uBankColor.value = new THREE.Color(0x5a5450);
    this.worldRoot.add(leftBank);
    this.worldRoot.add(rightBank);
    this.riverBankMeshes = [leftBank, rightBank];

    const totalPoints = 24;
    const positions = new Float32Array(totalPoints * 3);
    const colors = new Float32Array(totalPoints * 3);
    const sizes = new Float32Array(totalPoints);
    const tValues = new Float32Array(totalPoints);
    const speeds = new Float32Array(totalPoints);
    const lateralOffsets = new Float32Array(totalPoints);
    const minColor = this.palette.riverDeep;
    const maxColor = this.palette.riverGlow;

    for (let i = 0; i < totalPoints; i++) {
      const t = Math.random();
      const point = this.riverCurve.getPointAt(t);
      const tangent = this.riverCurve.getTangentAt(t).normalize();
      const lateral = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const halfWidth = this.getRiverWidth(point.z) * 0.66;
      const normalizedOffset = (Math.random() * 2 - 1) * 0.9;
      const lateralOffset = normalizedOffset * halfWidth;

      positions[i * 3] = point.x + lateral.x * lateralOffset;
      positions[i * 3 + 1] = this.getRiverSurfaceHeight(point.x, point.z) + 0.08 + Math.random() * 0.04;
      positions[i * 3 + 2] = point.z + lateral.z * lateralOffset;
      tValues[i] = t;
      speeds[i] = 0.025 + Math.random() * 0.03;
      lateralOffsets[i] = normalizedOffset;
      sizes[i] = 0.12 + Math.random() * 0.22;

      colors[i * 3] = minColor.r + (maxColor.r - minColor.r) * t;
      colors[i * 3 + 1] = minColor.g + (maxColor.g - minColor.g) * t;
      colors[i * 3 + 2] = minColor.b + (maxColor.b - minColor.b) * t;
    }

    const riverGeometry = new THREE.BufferGeometry();
    riverGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    riverGeometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    riverGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    riverGeometry.setAttribute('aT', new THREE.BufferAttribute(tValues, 1));

    const riverMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: window.devicePixelRatio || 1 },
        uTime: { value: 0 }
      },
      vertexShader: `
        uniform float uPixelRatio;
        uniform float uTime;
        attribute float aSize;
        attribute vec3 aColor;
        attribute float aT;
        varying vec3 vColor;
        varying float vAlpha;
        varying float vT;
        void main() {
          vColor = aColor;
          vT = aT;
          float flowPulse = 0.72 + 0.28 * sin(aT * 16.0 - uTime * 2.4);
          vAlpha = flowPulse * (0.2 + smoothstep(0.0, 0.15, aT) * smoothstep(1.0, 0.82, aT));
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = max(1.0, aSize * (uPixelRatio / max(1.0, -mvPosition.z)));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vColor;
        varying float vAlpha;
        varying float vT;
        void main() {
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          float dist = length(uv);
          float alpha = smoothstep(1.0, 0.18, dist) * vAlpha;
          alpha *= 0.55 + 0.45 * sin(vT * 18.0 + uTime * 4.2);
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(vColor, alpha * 0.65);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const riverPoints = new THREE.Points(riverGeometry, riverMaterial);
    riverPoints.name = 'dataRiverPoints';
    riverPoints.renderOrder = 10;
    this.worldRoot.add(riverPoints);

    this.dataRivers = [riverPoints, riverWater, leftBank, rightBank];
    this.dataRiverData = {
      curve: this.riverCurve,
      tValues,
      speeds,
      positions,
      lateralOffsets,
      totalPoints,
      colorLow: { r: minColor.r, g: minColor.g, b: minColor.b },
      colorHigh: { r: maxColor.r, g: maxColor.g, b: maxColor.b }
    };
  }

  buildRiverSurfaceGeometry(segmentCount) {
    const positions = new Float32Array((segmentCount + 1) * 2 * 3);
    const uvs = new Float32Array((segmentCount + 1) * 2 * 2);
    const indices = [];

    for (let i = 0; i <= segmentCount; i++) {
      const t = i / segmentCount;
      const point = this.riverCurve.getPointAt(t);
      const tangent = this.riverCurve.getTangentAt(t).normalize();
      const lateral = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const halfWidth = this.getRiverWidth(point.z) * (0.96 + Math.sin(t * Math.PI) * 0.08);
      const y = this.getRiverSurfaceHeight(point.x, point.z);

      const left = point.clone().add(lateral.clone().multiplyScalar(halfWidth));
      const right = point.clone().add(lateral.clone().multiplyScalar(-halfWidth));
      left.y = y;
      right.y = y;

      const vertexIndex = i * 2;
      const positionIndex = vertexIndex * 3;
      const uvIndex = vertexIndex * 2;

      positions[positionIndex] = left.x;
      positions[positionIndex + 1] = left.y;
      positions[positionIndex + 2] = left.z;
      positions[positionIndex + 3] = right.x;
      positions[positionIndex + 4] = right.y;
      positions[positionIndex + 5] = right.z;

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
      const outerOffset = innerOffset + 4.2 + Math.abs(this.sampleTerrainNoise(point.x * 0.32 + side * 9, point.z * 0.32)) * 1.6;

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
    const stoneCount = 12;
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
      const group = placement.type === 'hero'
        ? this.createHeroBridge(frame)
        : this.createDistantBridge(frame);

      this.worldRoot.add(group);
      this.bridges.push(group);

      if (placement.type === 'hero') {
        this.heroBridgeAnchor = frame.point.clone();
      }
    });
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

  createHeroBridge(frame) {
    const span = this.getRiverWidth(frame.point.z) * 2.4 + 9.5;
    const deckWidth = 6.1;
    const deckRise = 1.45;

    const leftBank = frame.point.clone().add(frame.lateral.clone().multiplyScalar(span * 0.58));
    const rightBank = frame.point.clone().add(frame.lateral.clone().multiplyScalar(-span * 0.58));
    const deckY = Math.max(
      this.sampleTerrainHeight(leftBank.x, leftBank.z),
      this.sampleTerrainHeight(rightBank.x, rightBank.z)
    ) + 1.35;

    const group = new THREE.Group();
    this.orientGroupToRiverFrame(group, frame, deckY);

    const woodMaterial = materialRegistry.getStandard('world.fractalvalley.bridge.hero.wood', {
      color: 0x5b534c,
      roughness: 0.9,
      metalness: 0.06
    });
    const stoneMaterial = materialRegistry.getStandard('world.fractalvalley.bridge.hero.stone', {
      color: 0x4f4b52,
      roughness: 0.96,
      metalness: 0.03
    });
    const railMaterial = materialRegistry.getStandard('world.fractalvalley.bridge.hero.rail', {
      color: 0x67707a,
      roughness: 0.46,
      metalness: 0.54,
      emissive: 0x57b3b8,
      emissiveIntensity: 0.14
    });

    const deckSegments = 3;
    const segmentLength = span / deckSegments;
    const railPosts = [];

    for (let i = 0; i < deckSegments; i++) {
      const t = deckSegments === 1 ? 0 : i / (deckSegments - 1);
      const x = -span * 0.5 + segmentLength * (i + 0.5);
      const arch = Math.sin(t * Math.PI) * deckRise;
      group.add(this.createBoxPart(woodMaterial, new THREE.Vector3(segmentLength * 0.94, 0.26, deckWidth), new THREE.Vector3(x, arch, 0)));
      group.add(this.createBoxPart(woodMaterial, new THREE.Vector3(segmentLength * 0.82, 0.12, 0.22), new THREE.Vector3(x, arch - 0.38, deckWidth * 0.44)));
      group.add(this.createBoxPart(woodMaterial, new THREE.Vector3(segmentLength * 0.82, 0.12, 0.22), new THREE.Vector3(x, arch - 0.38, -deckWidth * 0.44)));
    }

    const postCount = 3;
    for (let i = 0; i <= postCount; i++) {
      const t = i / postCount;
      const x = -span * 0.5 + t * span;
      const arch = Math.sin(t * Math.PI) * deckRise;
      const leftPost = new THREE.Vector3(x, arch + 0.72, deckWidth * 0.42);
      const rightPost = new THREE.Vector3(x, arch + 0.72, -deckWidth * 0.42);
      railPosts.push([leftPost, rightPost]);
      group.add(this.createBoxPart(railMaterial, new THREE.Vector3(0.14, 1.02, 0.14), leftPost));
      group.add(this.createBoxPart(railMaterial, new THREE.Vector3(0.14, 1.02, 0.14), rightPost));
    }

    group.add(this.createBeamBetween(railMaterial, railPosts[0][0].clone().add(new THREE.Vector3(0, 0.38, 0)), railPosts[railPosts.length - 1][0].clone().add(new THREE.Vector3(0, 0.38, 0)), 0.08));
    group.add(this.createBeamBetween(railMaterial, railPosts[0][1].clone().add(new THREE.Vector3(0, 0.38, 0)), railPosts[railPosts.length - 1][1].clone().add(new THREE.Vector3(0, 0.38, 0)), 0.08));
    group.add(this.createBeamBetween(railMaterial, railPosts[0][0].clone().add(new THREE.Vector3(0, 0.14, 0)), railPosts[railPosts.length - 1][0].clone().add(new THREE.Vector3(0, 0.14, 0)), 0.04));
    group.add(this.createBeamBetween(railMaterial, railPosts[0][1].clone().add(new THREE.Vector3(0, 0.14, 0)), railPosts[railPosts.length - 1][1].clone().add(new THREE.Vector3(0, 0.14, 0)), 0.04));

    [-1, 1].forEach((side) => {
      const abutmentHeight = deckY - this.sampleTerrainHeight(
        frame.point.x + frame.lateral.x * side * span * 0.58,
        frame.point.z + frame.lateral.z * side * span * 0.58
      ) + 1.0;
      group.add(this.createBoxPart(
        stoneMaterial,
        new THREE.Vector3(2.9, abutmentHeight, deckWidth + 1.5),
        new THREE.Vector3(side * span * 0.57, -0.05 - abutmentHeight * 0.5, 0)
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
      surfaceOffset: 0.16
    });

    group.name = 'fractalValleyHeroBridge';
    return group;
  }

  createDistantBridge(frame) {
    const span = this.getRiverWidth(frame.point.z) * 2.15 + 5.8;
    const deckWidth = 3.25;

    const leftBank = frame.point.clone().add(frame.lateral.clone().multiplyScalar(span * 0.55));
    const rightBank = frame.point.clone().add(frame.lateral.clone().multiplyScalar(-span * 0.55));
    const deckY = Math.max(
      this.sampleTerrainHeight(leftBank.x, leftBank.z),
      this.sampleTerrainHeight(rightBank.x, rightBank.z)
    ) + 0.9;

    const group = new THREE.Group();
    this.orientGroupToRiverFrame(group, frame, deckY);

    const steelMaterial = materialRegistry.getStandard('world.fractalvalley.bridge.distant.steel', {
      color: 0x565e69,
      roughness: 0.5,
      metalness: 0.58,
      emissive: 0x4ca6ac,
      emissiveIntensity: 0.08
    });
    const plankMaterial = materialRegistry.getStandard('world.fractalvalley.bridge.distant.plank', {
      color: 0x62594f,
      roughness: 0.88,
      metalness: 0.04
    });

    group.add(this.createBoxPart(steelMaterial, new THREE.Vector3(span, 0.16, deckWidth), new THREE.Vector3(0, 0, 0)));

    const plankCount = 4;
    for (let i = 0; i < plankCount; i++) {
      const x = -span * 0.5 + (i + 0.5) * (span / plankCount);
      group.add(this.createBoxPart(plankMaterial, new THREE.Vector3((span / plankCount) * 0.7, 0.04, deckWidth * 0.88), new THREE.Vector3(x, 0.11, 0)));
    }

    [-1, 1].forEach((side) => {
      const towerX = side * (span * 0.5 - 0.28);
      const leftPost = new THREE.Vector3(towerX, 1.2, deckWidth * 0.38);
      const rightPost = new THREE.Vector3(towerX, 1.2, -deckWidth * 0.38);
      group.add(this.createBoxPart(steelMaterial, new THREE.Vector3(0.12, 2.4, 0.12), leftPost));
      group.add(this.createBoxPart(steelMaterial, new THREE.Vector3(0.12, 2.4, 0.12), rightPost));
      group.add(this.createBoxPart(steelMaterial, new THREE.Vector3(0.14, 0.12, deckWidth * 0.94), new THREE.Vector3(towerX, 2.35, 0)));
      group.add(this.createBeamBetween(steelMaterial, new THREE.Vector3(towerX, 2.28, deckWidth * 0.38), new THREE.Vector3(0, 0.92, deckWidth * 0.38), 0.035));
      group.add(this.createBeamBetween(steelMaterial, new THREE.Vector3(towerX, 2.28, -deckWidth * 0.38), new THREE.Vector3(0, 0.92, -deckWidth * 0.38), 0.035));
    });

    group.add(this.createBeamBetween(steelMaterial, new THREE.Vector3(-span * 0.5, 0.62, deckWidth * 0.42), new THREE.Vector3(span * 0.5, 0.62, deckWidth * 0.42), 0.04));
    group.add(this.createBeamBetween(steelMaterial, new THREE.Vector3(-span * 0.5, 0.62, -deckWidth * 0.42), new THREE.Vector3(span * 0.5, 0.62, -deckWidth * 0.42), 0.04));

    this.bridgeGroundSurfaces.push({
      type: 'distant',
      point: frame.point.clone(),
      tangent: frame.tangent.clone(),
      lateral: frame.lateral.clone(),
      span,
      halfWidth: deckWidth * 0.5,
      deckY,
      deckRise: 0,
      surfaceOffset: 0.15
    });

    group.name = 'fractalValleyDistantBridge';
    return group;
  }
  
  /**
   * Create valley mist
   */
  createMist() {
    if (this.scene) {
      this.scene.fog = new THREE.Fog(0x171b27, 46, 220);
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
        uStarIntensity: { value: 0.42 }
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

        void main() {
          vec3 dir = normalize(vWorldPosition);
          float height = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 baseColor = mix(uHorizonColor, uTopColor, height);

          vec2 uv = dir.xz * 0.7;
          vec2 blob1 = uv + vec2(sin(uTime * 0.08) * 0.3, cos(uTime * 0.11) * 0.25);
          vec2 blob2 = uv + vec2(cos(uTime * 0.1) * 0.25, sin(uTime * 0.13) * 0.3);
          float n1 = softBlob(blob1, vec2(-0.2, 0.1), 0.7);
          float n2 = softBlob(blob2, vec2(0.3, -0.2), 0.6);
          float n3 = softBlob(uv, vec2(0.0, 0.3), 0.5);

          float stars = starLayer(uv * 2.8, 0.23) * 0.55 + starLayer(uv * 4.5, 1.57) * 0.4;
          vec3 color = baseColor;
          color += uNebulaColor1 * n1 * 0.18;
          color += uNebulaColor2 * n2 * 0.14;
          color += mix(uNebulaColor1, uNebulaColor2, 0.5) * n3 * 0.08;
          color += vec3(1.0) * stars * 0.08 * uStarIntensity;

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
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const velocities = [];
    
    const particleCount = 120;
    
    const color1 = new THREE.Color(0x8800ff);
    const color2 = new THREE.Color(0x00dddd);
    
    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 150;
      const y = Math.random() * 40;
      const z = (Math.random() - 0.5) * 150;
      
      positions.push(x, y, z);
      
      const color = color1.clone().lerp(color2, Math.random());
      colors.push(color.r, color.g, color.b);
      
      velocities.push(
        (Math.random() - 0.5) * 0.1,
        Math.random() * 0.05,
        (Math.random() - 0.5) * 0.1
      );
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });
    
    this.particles = new THREE.Points(geometry, material);
    this.particles.userData.velocities = velocities;
    this.worldRoot.add(this.particles);
  }
  
  /**
   * Create fractal holograms
   */
  createFractalHolograms() {
    for (let i = 0; i < 4; i++) {
      const geometry = new THREE.TetrahedronGeometry(4, 2);
      const material = materialRegistry.getBasic('world.fractalvalley.hologram', {
        color: 0x00dddd,
        transparent: true,
        opacity: 0,
        wireframe: true
      });
      
      const hologram = new THREE.Mesh(geometry, material);
      
      const angle = (i / 4) * Math.PI * 2;
      hologram.position.x = Math.cos(angle) * 40;
      hologram.position.y = 5;
      hologram.position.z = Math.sin(angle) * 40;
      
      hologram.userData = {
        timer: Math.random() * 12,
        duration: 0,
        pulsePhase: 0,
        activeRing: null
      };
      
      this.worldRoot.add(hologram);
      this.holograms.push(hologram);
    }
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
    const symbolGeometries = [
      new THREE.TorusGeometry(2, 0.3, 8, 16),
      new THREE.OctahedronGeometry(2, 0),
      new THREE.RingGeometry(1.5, 2, 6)
    ];
    
    for (let i = 0; i < 6; i++) {
      const geometry = symbolGeometries[Math.floor(Math.random() * symbolGeometries.length)];
      const material = materialRegistry.getBasic('world.fractalvalley.symbol', {
        color: 0xaa88ff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      });
      
      const symbol = new THREE.Mesh(geometry, material);
      
      const angle = Math.random() * Math.PI * 2;
      const distance = 25 + Math.random() * 40;
      
      symbol.position.x = Math.cos(angle) * distance;
      symbol.position.y = 8 + Math.random() * 12;
      symbol.position.z = Math.sin(angle) * distance;
      
      symbol.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      symbol.userData = {
        timer: Math.random() * 15,
        duration: 0,
        fadePhase: 0
      };
      
      this.worldRoot.add(symbol);
      this.symbols.push(symbol);
    }
  }
  
  /**
   * Create geometric constellations in sky
   */
  createGeometricConstellations() {
    this.constellations = [];
    
    // Triangle grid constellation
    const trianglePoints = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const x = (i - 4) * 15;
        const z = (j - 4) * 15;
        trianglePoints.push(new THREE.Vector3(x, 50, z));
      }
    }
    
    this.createConstellation(trianglePoints, 0x6633ff);
    
    // Hex grid constellation
    const hexPoints = [];
    for (let ring = 0; ring < 3; ring++) {
      const count = ring === 0 ? 1 : ring * 6;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const radius = ring * 20;
        hexPoints.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          55,
          Math.sin(angle) * radius - 60
        ));
      }
    }
    
    this.createConstellation(hexPoints, 0x00ccdd);
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

    const thresholdSq = 20 * 20;
    const linePositions = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const dz = points[i].z - points[j].z;
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < thresholdSq) {
          linePositions.push(points[i].x, points[i].y, points[i].z);
          linePositions.push(points[j].x, points[j].y, points[j].z);
        }
      }
    }

    const connectionGeometry = new THREE.BufferGeometry();
    connectionGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(linePositions), 3)
    );

    const lineMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const connections = new THREE.LineSegments(connectionGeometry, lineMaterial);
    connections.renderOrder = 9;
    this.worldRoot.add(connections);

    constellation.userData.connections = connections;
    this.constellations.push(constellation);
  }
  
  /**
   * Create distortion wave planes
   */
  createDistortionWaves() {
    this.distortionWaves = [];
    
    for (let i = 0; i < 3; i++) {
      const geometry = new THREE.PlaneGeometry(60, 30, 15, 10);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0 }
        },
        vertexShader: `
          uniform float uTime;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec3 modified = position;
            modified.z += sin(position.x * 0.1 + uTime * 3.0) * 2.0;
            vec4 mvPosition = modelViewMatrix * vec4(modified, 1.0);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float uOpacity;
          varying vec2 vUv;
          void main() {
            vec2 grid = abs(fract(vUv * 10.0 - 0.5) - 0.5) / fwidth(vUv * 10.0);
            float line = min(grid.x, grid.y);
            float alpha = smoothstep(0.35, 0.05, line) * uOpacity;
            if (alpha < 0.01) discard;
            gl_FragColor = vec4(vec3(0.78, 0.86, 1.0), alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      
      const wave = new THREE.Mesh(geometry, material);
      wave.position.y = 15 + i * 8;
      
      wave.userData = {
        timer: Math.random() * 20,
        duration: 0,
        wavePhase: 0
      };
      
      this.worldRoot.add(wave);
      this.distortionWaves.push(wave);
    }
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
