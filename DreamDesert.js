import * as THREE from 'three';
import { initMapReferencePlane } from './MapReferencePlaneFactory.js';
import { getMapConfig } from './MapConfigBase.js';
import { materialRegistry } from './src/metrics/rendering/MaterialRegistry_v1.js';

/**
 * Dream Desert - AI Subconscious Environment
 * Warm surreal desert with cinematic dunes and soft dream lighting
 * NOTE: Keep the analytic surface helper in sync with the dunes so the player controller never falls back to raycasts.
 * NOTE: Terrain collision meshes stay walkable; any landmark that should block movement needs its own invisible collider.
 * NOTE: The large dune caps are intentionally climbable, while the stone arch and monolith remain hard blockers.
 */
export class DreamDesert {
  constructor(scene, worldRoot, camera = null) {
    console.log('WORLD CONSTRUCTOR:', this.constructor.name);
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.camera = camera;
    this.desertSize = 220;
    this.desertRadius = this.desertSize * 0.5;
    this.desertHeightScale = 0.72;
    this.playerGroundOffset = 1;
    this.crystals = [];
    this.fragments = [];
    this.energyVeins = [];
    this.dunes = [];
    this.landmarks = [];
    this.horizonMirageBands = [];
    this.cloudLayers = [];
    this.sunGlowSprite = null;
    this.sunGlowTexture = null;
    this.sunPointLight = null;
    this.groundDust = null;
    this.groundMistPlanes = [];
    this.skyMaterial = null;
    this.hemisphereLight = null;
    this.sunOrbitRadiusX = 14;
    this.sunOrbitRadiusZ = 18;
    this.sunOrbitSpeed = (Math.PI * 2) / 420;
    this.collisionObjects = []; // Track collision meshes
    
    // Session 112+: Initialize map reference plane from config
    this.initializeMapConfig();
    this.initializeReferencePlane();
    
    this.createDesertTerrain();
    this.createLighting();
    this.createDesertLandmarks();
    this.createEnergyVeins();
    this.createHolographicCrystals();
    this.createFloatingFragments();
    this.createDreamParticles();
    this.createDustDevils();
    this.createAuroraRibbons();
    this.createHorizonMirage();
    this.createCloudLayers();
    this.createGroundDust();
    this.createGroundMist();
  }
  
  /**
   * Initialize map configuration
   */
  initializeMapConfig() {
    this.mapConfig = getMapConfig('DreamDesert');
    console.log(
      `[MAP INIT] ${this.mapConfig.mapId} | theme: ${this.mapConfig.theme} | referencePlane: ${this.mapConfig.referencePlane}`
    );
  }
  
  /**
   * Initialize reference plane from map config
   * Session 112+: Universal system for all maps
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

  sampleDesertTerrainHeight(x, z) {
    const primary = this._noise2D(x * 0.0105, z * 0.0105) * 2.8;
    const secondary = this._noise2D(x * 0.024, z * 0.024) * 1.35;
    const tertiary = this._noise2D(x * 0.052, z * 0.052) * 0.55;
    const windBands = Math.sin(x * 0.035 + z * 0.016) * 1.7
      + Math.cos(x * 0.011 - z * 0.028) * 0.85;

    const channelX = this.getDesertChannelX(z);
    const channelDistance = Math.abs(x - channelX);
    const channel = Math.exp(-channelDistance * 0.055) * (1.8 + Math.sin(z * 0.021) * 0.35);

    const basin = Math.exp(-(((x + 28) * (x + 28)) + ((z - 20) * (z - 20))) / 1800) * 1.15;
    const shoulder = Math.exp(-(((x - 44) * (x - 44)) + ((z + 34) * (z + 34))) / 900) * 0.7;

    return primary + secondary + tertiary + windBands - channel - basin - shoulder;
  }

  getDesertChannelX(z) {
    return Math.sin(z * 0.018) * 14 + Math.cos(z * 0.006) * 5;
  }

  getDesertTerrainFalloff(x, z) {
    const radius = Math.sqrt(x * x + z * z) / this.desertRadius;
    return Math.pow(Math.max(0, 1 - radius), 0.9);
  }

  sampleDesertBaseSurfaceY(x, z) {
    return this.sampleDesertTerrainHeight(x, z) * this.getDesertTerrainFalloff(x, z) * this.desertHeightScale;
  }

  sampleDesertDuneOffset(x, z) {
    if (!this.dunes.length) {
      return 0;
    }

    let offset = 0;

    for (const dune of this.dunes) {
      const data = dune.userData || {};
      const groundHeight = data.groundHeight || 0;
      if (groundHeight <= 0) {
        continue;
      }

      const dx = x - dune.position.x;
      const dz = z - dune.position.z;
      const rotation = dune.rotation.y || 0;
      const cos = Math.cos(-rotation);
      const sin = Math.sin(-rotation);
      const localX = dx * cos - dz * sin;
      const localZ = dx * sin + dz * cos;
      const width = Math.max(1, data.collisionWidth || data.groundWidth || 1);
      const depth = Math.max(1, data.collisionDepth || data.groundDepth || 1);
      const duneHeight = Math.max(0, data.collisionHeight || data.groundHeight || 0);
      const normalizedX = localX / (width * 0.5);
      const normalizedZ = localZ / (depth * 0.82);
      const influence = Math.exp(-(normalizedX * normalizedX * 0.72 + normalizedZ * normalizedZ * 0.42));
      offset = Math.max(offset, duneHeight * influence);
    }

    return offset;
  }

  sampleDesertSurfaceY(x, z) {
    return this.sampleDesertBaseSurfaceY(x, z) + this.sampleDesertDuneOffset(x, z);
  }

  getGroundLevelAt(x, z) {
    return this.sampleDesertSurfaceY(x, z) + this.playerGroundOffset;
  }

  getMaxStepHeight() {
    return 5.8;
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
    const gx = Math.cos(angle);
    const gz = Math.sin(angle);
    return gx * fx + gz * fz;
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

  createSandNormalTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    const heightField = new Float32Array(size * size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const v = y / size;
        const sample = Math.sin(u * Math.PI * 12.0 + v * Math.PI * 2.5) * 0.12
          + Math.cos(u * Math.PI * 4.0 - v * Math.PI * 9.0) * 0.08
          + Math.sin((u + v) * Math.PI * 8.0) * 0.05
          + Math.cos((u - v) * Math.PI * 6.0) * 0.03;
        heightField[y * size + x] = sample;
      }
    }

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const left = heightField[y * size + ((x - 1 + size) % size)];
        const right = heightField[y * size + ((x + 1) % size)];
        const up = heightField[((y - 1 + size) % size) * size + x];
        const down = heightField[((y + 1) % size) * size + x];
        const dx = (right - left) * 18.0;
        const dy = (down - up) * 18.0;
        const nz = Math.sqrt(Math.max(0, 1 - dx * dx * 0.25 - dy * dy * 0.25));
        const index = (y * size + x) * 4;
        data[index] = Math.max(0, Math.min(255, (dx * 0.5 + 1) * 127.5));
        data[index + 1] = Math.max(0, Math.min(255, (dy * 0.5 + 1) * 127.5));
        data[index + 2] = Math.max(0, Math.min(255, nz * 255));
        data[index + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    texture.needsUpdate = true;
    return texture;
  }

  createSunGlowTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0.0, 'rgba(255, 248, 236, 0.95)');
    gradient.addColorStop(0.22, 'rgba(255, 226, 192, 0.76)');
    gradient.addColorStop(0.48, 'rgba(255, 179, 130, 0.38)');
    gradient.addColorStop(0.78, 'rgba(224, 144, 118, 0.14)');
    gradient.addColorStop(1.0, 'rgba(224, 144, 118, 0.0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }

  createDesertLandmarks() {
    this.createStoneArch();
    this.createDistantMonolith();
  }

  createStoneArch() {
    const group = new THREE.Group();
    const stoneBase = materialRegistry.getStandard('world.dreamdesert.archStone', {
      color: 0xd8b08a,
      roughness: 0.95,
      metalness: 0.04,
      emissive: 0xb2714a,
      emissiveIntensity: 0.05
    });

    const leftColumn = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.9, 10.5, 8, 1, false),
      stoneBase.clone()
    );
    leftColumn.position.set(-2.8, 5.25, 0);
    leftColumn.rotation.z = -0.04;
    group.add(leftColumn);

    const rightColumn = new THREE.Mesh(
      new THREE.CylinderGeometry(1.45, 1.7, 9.7, 8, 1, false),
      stoneBase.clone()
    );
    rightColumn.position.set(2.65, 4.85, 0.18);
    rightColumn.rotation.z = 0.03;
    group.add(rightColumn);

    const archPoints = [];
    const archRadius = 3.2;
    const archHeight = 4.9;
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const angle = Math.PI * t;
      const x = Math.cos(angle) * archRadius;
      const y = Math.sin(angle) * archHeight + 5.0;
      const z = Math.sin(angle * 2.0) * 0.22;
      archPoints.push(new THREE.Vector3(x, y, z));
    }

    const archCurve = new THREE.CatmullRomCurve3(archPoints);
    const arch = new THREE.Mesh(
      new THREE.TubeGeometry(archCurve, 32, 0.95, 10, false),
      stoneBase.clone()
    );
    arch.rotation.z = Math.PI * 0.5;
    arch.position.set(0.35, 0.2, 0);
    group.add(arch);

    if (!this.sunGlowTexture) {
      this.sunGlowTexture = this.createSunGlowTexture();
    }
    const haloMaterial = new THREE.SpriteMaterial({
      map: this.sunGlowTexture,
      color: 0xffd1a3,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    });
    const halo = new THREE.Sprite(haloMaterial);
    halo.scale.set(10, 10, 1);
    halo.position.set(0.25, 6.8, 0.6);
    group.add(halo);

    const archBlockerMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide
    });

    const archCollider = new THREE.Mesh(
      new THREE.TubeGeometry(archCurve, 28, 1.08, 10, false),
      archBlockerMaterial
    );
    archCollider.rotation.z = Math.PI * 0.5;
    archCollider.position.set(0.35, 0.2, 0);
    archCollider.userData = {
      collisionEnabled: true,
      isWalkable: false,
      collisionRole: 'blocker',
      blockerType: 'stoneArchTorus'
    };
    group.add(archCollider);
    this.collisionObjects.push(archCollider);

    const leftCollider = new THREE.Mesh(
      new THREE.CylinderGeometry(1.78, 2.08, 10.9, 8, 1, false),
      archBlockerMaterial
    );
    leftCollider.position.set(-2.8, 5.25, 0);
    leftCollider.rotation.z = -0.04;
    leftCollider.userData = {
      collisionEnabled: true,
      isWalkable: false,
      collisionRole: 'blocker',
      blockerType: 'stoneArchLeft'
    };
    group.add(leftCollider);
    this.collisionObjects.push(leftCollider);

    const rightCollider = new THREE.Mesh(
      new THREE.CylinderGeometry(1.58, 1.88, 10.1, 8, 1, false),
      archBlockerMaterial
    );
    rightCollider.position.set(2.65, 4.85, 0.18);
    rightCollider.rotation.z = 0.03;
    rightCollider.userData = {
      collisionEnabled: true,
      isWalkable: false,
      collisionRole: 'blocker',
      blockerType: 'stoneArchRight'
    };
    group.add(rightCollider);
    this.collisionObjects.push(rightCollider);

    const terrainY = this.sampleDesertSurfaceY(12, -20);
    group.position.set(12, terrainY + 0.6, -20);
    group.rotation.y = -0.18;
    group.userData = {
      pulseOffset: Math.random() * Math.PI * 2,
      halo
    };

    this.worldRoot.add(group);
    this.landmarks.push(group);
  }

  createDistantMonolith() {
    const group = new THREE.Group();
    const stoneBase = materialRegistry.getStandard('world.dreamdesert.monolithStone', {
      color: 0x5f6f82,
      roughness: 0.96,
      metalness: 0.05,
      emissive: 0x20314f,
      emissiveIntensity: 0.015
    });

    const main = new THREE.Mesh(
      new THREE.CylinderGeometry(1.22, 1.34, 15, 6, 1, false),
      stoneBase.clone()
    );
    main.position.set(0, 7.5, 0);
    main.rotation.z = 0.04;
    group.add(main);

    const shard = new THREE.Mesh(
      new THREE.CylinderGeometry(0.86, 0.98, 9, 6, 1, false),
      stoneBase.clone()
    );
    shard.position.set(2.0, 4.6, -0.45);
    shard.rotation.z = -0.12;
    shard.rotation.x = 0.06;
    group.add(shard);

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 1.4, 1.8, 6, 1, false),
      stoneBase.clone()
    );
    cap.position.set(-0.15, 14.2, 0.1);
    cap.rotation.z = 0.08;
    group.add(cap);

    const monolithBlockerMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide
    });

    const mainCollider = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 15.4, 2.6),
      monolithBlockerMaterial
    );
    mainCollider.position.set(0, 7.5, 0);
    mainCollider.rotation.z = 0.04;
    mainCollider.userData = {
      collisionEnabled: true,
      isWalkable: false,
      collisionRole: 'blocker',
      blockerType: 'distantMonolithMain'
    };
    group.add(mainCollider);
    this.collisionObjects.push(mainCollider);

    const shardCollider = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 9.4, 1.15),
      monolithBlockerMaterial
    );
    shardCollider.position.set(2.0, 4.6, -0.45);
    shardCollider.rotation.set(0.06, 0, -0.12);
    shardCollider.userData = {
      collisionEnabled: true,
      isWalkable: false,
      collisionRole: 'blocker',
      blockerType: 'distantMonolithShard'
    };
    group.add(shardCollider);
    this.collisionObjects.push(shardCollider);

    const terrainY = this.sampleDesertSurfaceY(-48, 54);
    group.position.set(-48, terrainY + 0.2, 54);
    group.rotation.y = 0.35;
    group.userData = {
      pulseOffset: Math.random() * Math.PI * 2
    };

    this.worldRoot.add(group);
    this.landmarks.push(group);
  }
  
  /**
   * Create geometric dunes with neural patterns
   */
  createDesertTerrain() {
    const desertSize = this.desertSize;
    const desertGeometry = new THREE.PlaneGeometry(desertSize, desertSize, 120, 120);
    const positionAttribute = desertGeometry.getAttribute('position');
    const positions = positionAttribute.array;
    const colors = new Float32Array(positions.length);
    const lowColor = new THREE.Color(0xd7b28a);
    const midColor = new THREE.Color(0xedceb0);
    const highColor = new THREE.Color(0xf8e2cd);
    const shadowColor = new THREE.Color(0x8d6c62);
    const channelColor = new THREE.Color(0xc6a28f);
    const sandNormalTexture = this.createSandNormalTexture();

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 1];
      const channelX = this.getDesertChannelX(z);
      const channelDistance = Math.abs(x - channelX);
      const channelFactor = Math.exp(-channelDistance * 0.055);

      const height = this.sampleDesertBaseSurfaceY(x, z);
      positions[i + 2] = height;

      const heightMix = THREE.MathUtils.clamp((height + 3.0) / 8.5, 0, 1);
      const color = lowColor.clone().lerp(midColor, heightMix);
      color.lerp(highColor, Math.pow(heightMix, 2.0) * 0.35);
      color.lerp(shadowColor, Math.min(0.35, (1 - this.getDesertTerrainFalloff(x, z)) * 0.45));
      color.lerp(channelColor, channelFactor * 0.18);

      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }

    positionAttribute.needsUpdate = true;
    desertGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    desertGeometry.computeVertexNormals();

    const desertMaterial = materialRegistry.getStandard('world.dreamdesert.desertFloor', {
      color: 0xd7b28a,
      roughness: 0.82,
      metalness: 0.08,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
      opacity: 1.0,
      transparent: false,
      emissive: 0x2c0d12,
      emissiveIntensity: 0.02,
      vertexColors: true,
      normalMap: sandNormalTexture,
      normalScale: new THREE.Vector2(0.24, 0.24)
    });
    const desert = new THREE.Mesh(desertGeometry, desertMaterial);
    desert.rotation.x = -Math.PI / 2;
    desert.receiveShadow = true;
    desert.castShadow = false;
    
    // Ensure terrain is on default layer (layer 0)
    desert.layers.set(0);
    desert.renderOrder = -100;  // Render before most objects
    
    // Store reference for potential updates
    this.desert = desert;
    
    this.worldRoot.add(desert);
    
    // Create collision mesh for desert floor (invisible but raycastable)
    // Use material with colorWrite=false and depthWrite=false for invisible but raycastable mesh
    const collisionMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide
    });
    const desertCollision = new THREE.Mesh(desertGeometry.clone(), collisionMaterial);
    desertCollision.rotation.x = -Math.PI / 2;
    desertCollision.position.copy(desert.position);
    desertCollision.userData = {
      isWalkable: true,
      collisionEnabled: true,
      collisionRole: 'terrain',
      terrainType: 'desertFloor'
    };
    // Mark as raycastable for ATOMA's raycast system
    desertCollision.userData.__ALLOW_RAYCAST__ = true;
    this.worldRoot.add(desertCollision);
    this.collisionObjects.push(desertCollision);
    
    // Create asymmetrical dune mounds aligned with the channel flow
    const duneCount = 9;
    const duneCollisionMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide
    });
    
    for (let i = 0; i < duneCount; i++) {
      const t = duneCount === 1 ? 0.5 : i / (duneCount - 1);
      const z = -82 + t * 164 + (Math.random() - 0.5) * 10;
      const channelX = this.getDesertChannelX(z);
      const side = i % 2 === 0 ? -1 : 1;
      const x = channelX + side * (16 + Math.random() * 24) + (Math.random() - 0.5) * 8;
      const terrainY = this.sampleDesertBaseSurfaceY(x, z);
      const duneWidth = 14 + Math.random() * 14;
      const duneHeight = 3.2 + Math.random() * 2.8;
      const duneDepth = 12 + Math.random() * 12;
      const duneScaleX = 0.9 + Math.random() * 0.45;
      const duneScaleY = 0.8 + Math.random() * 0.18;
      const duneScaleZ = 1.0 + Math.random() * 0.55;
      const duneGeometry = this.createGeometricDune({
        width: duneWidth,
        height: duneHeight,
        depth: duneDepth,
        lean: side
      });
      const duneMaterial = materialRegistry.getStandard('world.dreamdesert.dune', {
        color: this.getDuneColor(),
        roughness: 0.84,
        metalness: 0.08,
        flatShading: false,
        side: THREE.FrontSide,
        depthWrite: true,
        depthTest: true,
        emissive: 0x2a1115,
        emissiveIntensity: 0.025
      });
      
      const dune = new THREE.Mesh(duneGeometry, duneMaterial);
      dune.position.x = x;
      dune.position.z = z;
      dune.position.y = terrainY + 0.35;
      dune.rotation.y = Math.random() * Math.PI * 2;
      dune.rotation.z = (Math.random() - 0.5) * 0.12;
      dune.scale.set(duneScaleX, duneScaleY, duneScaleZ);
      
      // Ensure dunes render after floor but before transparents
      dune.renderOrder = -90; 
      
      dune.userData = {
        originalY: dune.position.y,
        originalScaleY: dune.scale.y,
        originalScaleX: dune.scale.x,
        originalScaleZ: dune.scale.z,
        originalRotationZ: dune.rotation.z,
        breathSpeed: 0.08 + Math.random() * 0.04,
        breathOffset: Math.random() * Math.PI * 2,
        swaySpeed: 0.04 + Math.random() * 0.02,
        groundWidth: duneWidth * duneScaleX,
        groundDepth: duneDepth * duneScaleZ,
        groundHeight: duneHeight * duneScaleY * 0.18,
        collisionWidth: duneWidth * duneScaleX,
        collisionDepth: duneDepth * duneScaleZ,
        collisionHeight: duneHeight * duneScaleY * 0.42
      };
      
      this.worldRoot.add(dune);
      this.dunes.push(dune);
      
      // Create collision mesh for dune (invisible but raycastable)
      const duneCollision = new THREE.Mesh(duneGeometry.clone(), duneCollisionMaterial);
      duneCollision.position.copy(dune.position);
      duneCollision.rotation.copy(dune.rotation);
      duneCollision.scale.copy(dune.scale);
      duneCollision.userData = {
        isWalkable: true,
        collisionEnabled: true,
        collisionRole: 'terrain',
        terrainType: 'dune',
        height: duneGeometry.parameters.height || 5,
        __ALLOW_RAYCAST__: true
      };
      this.worldRoot.add(duneCollision);
      this.collisionObjects.push(duneCollision);
    }
  }
  
  /**
   * Create geometric dune shape with hex/wave patterns
   */
  createGeometricDune(options = {}) {
    const width = options.width ?? (15 + Math.random() * 10);
    const height = options.height ?? (3 + Math.random() * 4);
    const depth = options.depth ?? (10 + Math.random() * 8);
    const lean = options.lean ?? (Math.random() > 0.5 ? 1 : -1);

    const geometry = new THREE.CylinderGeometry(
      width * 0.28,
      width,
      height,
      20,
      5,
      false
    );

    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);

      const normalizedY = (y + height * 0.5) / height;
      const topBias = Math.pow(Math.max(0, normalizedY), 1.7);
      const ridgeNoise = Math.sin(x * 0.26 + z * 0.14) * 0.35
        + Math.cos(z * 0.22 - x * 0.08) * 0.2;
      const windWarp = lean * (0.15 + normalizedY * 0.2);

      positions.setX(i, x * (1 + windWarp * 0.65) + ridgeNoise * 0.28);
      positions.setZ(i, z * (1 + windWarp * 0.35) + ridgeNoise * 0.18);
      positions.setY(i, y + ridgeNoise * (0.35 + topBias * 0.2));
    }
    
    geometry.computeVertexNormals();
    geometry.scale(1, 1, depth / width);
    
    return geometry;
  }
  
  /**
   * Get pastel dune color
   */
  getDuneColor() {
    const colors = [
      0xd8b08a,
      0xe7c3a7,
      0xf0dcc7,
      0xcaa79c,
      0xbfa59b
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  /**
   * Create warm horizon lighting and a cinematic sky gradient
   */
  createLighting() {
    if (this.scene) {
      this.scene.fog = new THREE.FogExp2(0xe2c0a8, 0.010);
      this.scene.background = new THREE.Color(0x12070d);
    }

    const skyGeometry = new THREE.SphereGeometry(150, 16, 16);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTopColor: { value: new THREE.Color(0xffdcc6) },
        uBottomColor: { value: new THREE.Color(0x8a4f5d) },
        uTime: { value: 0 }
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
        varying vec3 vWorldPosition;
        uniform vec3 uTopColor;
        uniform vec3 uBottomColor;
        uniform float uTime;
        void main() {
          vec3 dir = normalize(vWorldPosition);
          float t = dir.y * 0.5 + 0.5;
          vec3 color = mix(uBottomColor, uTopColor, smoothstep(0.0, 1.0, t));
          float horizonBand = exp(-abs(dir.y) * 5.5);
          color += vec3(0.16, 0.08, 0.02) * horizonBand;
          float highVar = sin(dir.x * 18.0 + uTime * 0.025) * 0.006
                        + sin(dir.z * 14.0 - uTime * 0.018) * 0.004;
          color += vec3(highVar * 0.8, highVar * 0.6, highVar * 0.4) * step(0.65, t);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false
    });
    this.skyMaterial = skyMaterial;
    const skySphere = new THREE.Mesh(skyGeometry, skyMaterial);
    skySphere.name = 'dreamSkySphere';
    skySphere.renderOrder = -1;
    this.worldRoot.add(skySphere);

    this.hemisphereLight = new THREE.HemisphereLight(0xffe0ca, 0x3b1f28, 0.48);
    this.worldRoot.add(this.hemisphereLight);

    const directional = new THREE.DirectionalLight(0xffc98f, 0.62);
    directional.position.set(-45, 78, 38);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    directional.shadow.camera.near = 1;
    directional.shadow.camera.far = 180;
    directional.shadow.camera.left = -80;
    directional.shadow.camera.right = 80;
    directional.shadow.camera.top = 80;
    directional.shadow.camera.bottom = -80;
    this.worldRoot.add(directional);

    if (!this.sunGlowTexture) {
      this.sunGlowTexture = this.createSunGlowTexture();
    }

    const sunMaterial = new THREE.SpriteMaterial({
      map: this.sunGlowTexture,
      color: 0xffd2a0,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    });
    const sunGlow = new THREE.Sprite(sunMaterial);
    sunGlow.position.set(-58, 34, -100);
    sunGlow.scale.set(26, 26, 1);
    sunGlow.renderOrder = 2;
    this.worldRoot.add(sunGlow);
    this.sunGlowSprite = sunGlow;

    const sunLight = new THREE.PointLight(0xffbf83, 0.38, 150, 2);
    sunLight.position.copy(sunGlow.position);
    this.worldRoot.add(sunLight);
    this.sunPointLight = sunLight;

    if (this.scene && this.scene.userData && this.scene.userData.debugLights) {
      // Optional debug helper when debug mode is enabled
      // eslint-disable-next-line no-unused-vars
      const lightHelper = new THREE.DirectionalLightHelper(directional, 8, 0xff99ff);
      this.worldRoot.add(lightHelper);
    }
  }

  createCrystalGlowTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0.0, 'rgba(255, 244, 224, 0.95)');
    gradient.addColorStop(0.35, 'rgba(255, 221, 176, 0.58)');
    gradient.addColorStop(0.65, 'rgba(231, 183, 142, 0.18)');
    gradient.addColorStop(1.0, 'rgba(231, 183, 142, 0.0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }

  createCrystalGlowMaterial() {
    if (!this.crystalGlowTexture) {
      this.crystalGlowTexture = this.createCrystalGlowTexture();
    }
    return new THREE.SpriteMaterial({
      map: this.crystalGlowTexture,
      color: 0xffd6aa,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      toneMapped: false
    });
  }

  createCloudLayers() {
    const cloudConfigs = [
      { y: 24, count: 4, scale: 72, speed: 0.022, opacity: 0.09, color: 0xffece4 },
      { y: 31, count: 3, scale: 92, speed: 0.028, opacity: 0.07, color: 0xf7e4db },
      { y: 38, count: 2, scale: 112, speed: 0.018, opacity: 0.055, color: 0xeed6d8 }
    ];

    this.cloudLayers = [];

    cloudConfigs.forEach((config, layerIndex) => {
      for (let i = 0; i < config.count; i++) {
        const cloudWidth = 58 + Math.random() * 42;
        const cloudHeight = 16 + Math.random() * 12;
        const cloudGeo = new THREE.PlaneGeometry(cloudWidth, cloudHeight, 28, 12);

        const cloudMaterial = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(config.color) },
            uSpeed: { value: config.speed + Math.random() * 0.012 },
            uNoiseScale: { value: 1.6 + Math.random() * 0.45 },
            uOpacity: { value: config.opacity },
            uPhase: { value: Math.random() * Math.PI * 2 }
          },
          vertexShader: `
            varying vec2 vUv;
            varying float vElevation;
            uniform float uTime;
            uniform float uNoiseScale;
            uniform float uPhase;

            float hash(vec2 p) {
              return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
            }

            float noise(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              float a = hash(i);
              float b = hash(i + vec2(1.0, 0.0));
              float c = hash(i + vec2(0.0, 1.0));
              float d = hash(i + vec2(1.0, 1.0));
              vec2 u = f * f * (3.0 - 2.0 * f);
              return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
            }

            void main() {
              vUv = uv;
              float n = noise(uv * uNoiseScale);
              float elevation = n * 2.6;
              vElevation = elevation;
              vec3 newPosition = position;
              newPosition.z += elevation;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
          `,
          fragmentShader: `
            varying vec2 vUv;
            varying float vElevation;
            uniform float uTime;
            uniform vec3 uColor;
            uniform float uSpeed;
            uniform float uOpacity;
            uniform float uPhase;

            float hash(vec2 p) {
              return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
            }

            float noise(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              float a = hash(i);
              float b = hash(i + vec2(1.0, 0.0));
              float c = hash(i + vec2(0.0, 1.0));
              float d = hash(i + vec2(1.0, 1.0));
              vec2 u = f * f * (3.0 - 2.0 * f);
              return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
            }

            float fbm(vec2 p) {
              float value = 0.0;
              float amplitude = 0.5;
              for (int i = 0; i < 4; i++) {
                value += amplitude * noise(p);
                p *= 2.0;
                amplitude *= 0.5;
              }
              return value;
            }

            void main() {
              vec2 uv = vUv;
              float time = uTime * uSpeed + uPhase;
              float n1 = fbm(uv * 2.6 + vec2(time * 0.22, time * 0.12));
              float n2 = fbm(uv * 4.8 + vec2(time * 0.14, time * 0.28)) * 0.5;
              float cloud = n1 + n2;
              float edge = 1.0 - length(uv - 0.5) * 2.0;
              edge = smoothstep(0.0, 0.55, edge);
              float density = cloud * 0.45 + 0.5;
              float alpha = uOpacity * density * edge;
              vec3 color = uColor;
              color += vec3(0.04, 0.015, 0.0) * sin(time + uv.x * 4.0);
              if (alpha < 0.01) discard;
              gl_FragColor = vec4(color, alpha);
            }
          `,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.NormalBlending
        });

        const cloud = new THREE.Mesh(cloudGeo, cloudMaterial);
        const baseX = (Math.random() - 0.5) * 130;
        const baseZ = -84 - Math.random() * 52;
        cloud.position.set(
          baseX,
          config.y,
          baseZ
        );
        cloud.rotation.x = -0.08;
        cloud.rotation.y = (Math.random() - 0.5) * 0.15;
        cloud.name = `cloud_${layerIndex}_${i}`;
        cloud.userData.baseX = baseX;
        cloud.userData.baseZ = baseZ;
        cloud.userData.phase = Math.random() * Math.PI * 2;
        this.worldRoot.add(cloud);
        this.cloudLayers.push(cloud);
      }
    });
  }

  createEnergyVeins() {
    const veinCount = 6;
    
    for (let i = 0; i < veinCount; i++) {
      const points = [];
      const segments = 28;
      const baseOffset = (i - (veinCount - 1) / 2) * 3.5;

      for (let j = 0; j < segments; j++) {
        const t = j / segments;
        const z = -92 + t * 184;
        const channelX = this.getDesertChannelX(z) + baseOffset * 0.7;
        const channelWave = Math.sin(t * Math.PI * 2.2 + i * 0.45) * 1.2;
        points.push(new THREE.Vector3(
          channelX + channelWave * 0.35,
          this.sampleDesertTerrainHeight(channelX, z) + 0.08 + Math.sin(t * Math.PI * 3 + i) * 0.12,
          z
        ));
      }
      
      const curve = new THREE.CatmullRomCurve3(points);
      const linePoints = curve.getPoints(segments);
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      const warmColor = new THREE.Color(i === veinCount - 1 ? 0xbddedb : 0xffc58c);
      const glowColor = new THREE.Color(i === veinCount - 1 ? 0x9fe5d8 : 0xffe6bf);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: warmColor,
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      });
      
      const vein = new THREE.Line(lineGeometry, lineMaterial);
      vein.renderOrder = 10;
      vein.userData = {
        pulseOffset: Math.random() * Math.PI * 2,
        baseOpacity: 0.05 + Math.random() * 0.03,
        warmColor,
        glowColor
      };
      
      this.worldRoot.add(vein);
      this.energyVeins.push(vein);
    }
  }
  
  /**
   * Create floating holographic crystals
   */
  createHolographicCrystals() {
    const crystalCount = 11;
    
    for (let i = 0; i < crystalCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 10 + Math.random() * 50;
      
      // Create crystal geometry
      const geometry = new THREE.OctahedronGeometry(1 + Math.random() * 1.5, 0);
      const material = materialRegistry.getStandard('world.dreamdesert.crystal', {
        color: this.getCrystalColor(),
        transparent: true,
        opacity: 0.26,
        emissive: this.getCrystalColor(),
        emissiveIntensity: 0.12,
        metalness: 0.62,
        roughness: 0.28,
        depthWrite: false,              // ✅ Holographic look (no self-occlusion)
        side: THREE.FrontSide
      });
      
      const crystal = new THREE.Mesh(geometry, material);
      crystal.renderOrder = 20;         // ✅ Draw after veins
      crystal.position.x = Math.cos(angle) * distance;
      crystal.position.z = Math.sin(angle) * distance;
      crystal.position.y = 2 + Math.random() * 6;
      
      crystal.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      if (!this.crystalGlowMaterial) {
        this.crystalGlowMaterial = this.createCrystalGlowMaterial();
      }
      const glow = new THREE.Sprite(this.crystalGlowMaterial);
      glow.scale.set(4, 4, 1);
      glow.position.set(0, 0, 0);
      crystal.add(glow);
      
      crystal.userData = {
        floatSpeed: 0.2 + Math.random() * 0.15,
        floatOffset: Math.random() * Math.PI * 2,
        rotationSpeed: 0.1 + Math.random() * 0.1,
        originalY: crystal.position.y
      };
      
      this.worldRoot.add(crystal);
      this.crystals.push(crystal);
    }
  }
  
  /**
   * Get crystal color
   */
  getCrystalColor() {
    const colors = [
      0xffd2ab,
      0xf0c7d8,
      0xffe7d1,
      0xa6ddd5,
      0xe6c0a3
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  /**
   * Create levitating geometric fragments
   */
  createFloatingFragments() {
    const fragmentCount = 8;
    
    const geometries = [
      new THREE.OctahedronGeometry(1.15, 0),
      new THREE.IcosahedronGeometry(1.05, 0),
      new THREE.TetrahedronGeometry(1.2, 0),
      new THREE.PlaneGeometry(2, 2)
    ];
    
    for (let i = 0; i < fragmentCount; i++) {
      const geometry = geometries[Math.floor(Math.random() * geometries.length)].clone();
      const material = materialRegistry.getStandard('world.dreamdesert.fragment', {
          color: 0x728096,
        transparent: true,
          opacity: 0.18,
        side: THREE.DoubleSide,
          metalness: 0.16,
          roughness: 0.7,
          emissive: 0x66508f,
          emissiveIntensity: 0.025,
        depthWrite: false               // ✅ Ghostly floating fragments
      });
      
      const fragment = new THREE.Mesh(geometry, material);
      fragment.renderOrder = 20;        // ✅ Draw with crystals
      
      const angle = Math.random() * Math.PI * 2;
      const distance = 15 + Math.random() * 40;
      
      fragment.position.x = Math.cos(angle) * distance;
      fragment.position.z = Math.sin(angle) * distance;
      fragment.position.y = 4 + Math.random() * 8;
      
      fragment.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      const fragmentScale = 0.84 + Math.random() * 0.24;
      fragment.scale.set(
        fragmentScale * (0.92 + Math.random() * 0.12),
        fragmentScale * (0.78 + Math.random() * 0.14),
        fragmentScale * (0.92 + Math.random() * 0.12)
      );
      
      fragment.userData = {
        floatSpeed: 0.15 + Math.random() * 0.1,
        floatOffset: Math.random() * Math.PI * 2,
        rotationSpeed: 0.05 + Math.random() * 0.05,
        originalY: fragment.position.y
      };
      
      this.worldRoot.add(fragment);
      this.fragments.push(fragment);
    }
  }
  
  /**
   * Create dreamlike particle drift
   */
  createDreamParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const velocities = [];
    
    const particleCount = 160;
    
    const color1 = new THREE.Color(0x6f85bf);
    const color2 = new THREE.Color(0x66508f);
    const color3 = new THREE.Color(0x728096);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 80;
      const x = Math.cos(angle) * radius;
      const y = Math.random() * 20;
      const z = Math.sin(angle) * radius;
      
      positions.push(x, y, z);
      
      const colorChoice = Math.random();
      const color = colorChoice < 0.33 ? color1 :
                    colorChoice < 0.66 ? color2 : color3;
      colors.push(color.r, color.g, color.b);
      
      velocities.push(
        (Math.random() - 0.5) * 0.1,
        Math.random() * 0.05 + 0.02,
        (Math.random() - 0.5) * 0.1
      );
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.065,
      vertexColors: true,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false                 // ✅ Particles shouldn't block depth
    });
    
    this.particles = new THREE.Points(geometry, material);
    this.particles.renderOrder = 30;    // ✅ Draw last (additive)
    this.particles.userData.velocities = velocities;
    this.worldRoot.add(this.particles);
  }

  /**
   * Create small ascending dust devil spirals
   */
  createDustDevils() {
    const dustCount = 24;
    const particleCount = dustCount;
    const positions = new Float32Array(particleCount * 3);
    const angles = new Float32Array(particleCount);
    const centersX = new Float32Array(particleCount);
    const centersZ = new Float32Array(particleCount);
    const baseRadius = new Float32Array(particleCount);
    const heights = new Float32Array(particleCount);
    const riseSpeeds = new Float32Array(particleCount);
    const rotSpeeds = new Float32Array(particleCount);
    const maxHeight = 12.0;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const devils = [
      { x: -60, z: 44 },
      { x: 58, z: -40 }
    ];

    for (let i = 0; i < particleCount; i++) {
      const devilIndex = i % devils.length;
      const center = devils[devilIndex];
      centersX[i] = center.x;
      centersZ[i] = center.z;
      angles[i] = Math.random() * Math.PI * 2;
      baseRadius[i] = 4.5 + Math.random() * 3.5;
      heights[i] = Math.random() * maxHeight * 0.25;
      riseSpeeds[i] = 0.7 + Math.random() * 0.35;
      rotSpeeds[i] = 0.3 + Math.random() * 0.18;
      const radius = baseRadius[i] * (1.0 - heights[i] / maxHeight);
      positions[i * 3] = centersX[i] + Math.cos(angles[i] + i * goldenAngle) * radius;
      positions[i * 3 + 1] = heights[i];
      positions[i * 3 + 2] = centersZ[i] + Math.sin(angles[i] + i * goldenAngle) * radius;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(particleCount).map(() => 2.0 + Math.random() * 1.2), 1));

    const material = new THREE.PointsMaterial({
      color: 0x728096,
      size: 1.35,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    });

    const points = new THREE.Points(geometry, material);
    points.name = 'dustDevilParticles';
    points.renderOrder = 15;
    this.worldRoot.add(points);
    this.dustDevilData = {
      object: points,
      count: particleCount,
      positions,
      angles,
      centersX,
      centersZ,
      baseRadius,
      heights,
      riseSpeeds,
      rotSpeeds,
      maxHeight,
      goldenAngle
    };
  }

  /**
   * Create aurora-like ribbons in sky
   */
  createAuroraRibbons() {
    this.auroraRibbons = [];
    this.auroraRibbonData = {
      curves: [],
      ts: [],
      speeds: [],
      curveIndices: [],
      count: 0
    };

    const totalPointsPerCurve = 40;
    const colorPalette = [
      new THREE.Color(0xffcf9b),
      new THREE.Color(0xf4d5bf),
      new THREE.Color(0xedd0d9)
    ];

    const positions = new Float32Array(totalPointsPerCurve * 3 * 3);
    const colors = new Float32Array(totalPointsPerCurve * 3 * 3);
    const sizes = new Float32Array(totalPointsPerCurve * 3);

    let pointIndex = 0;
    for (let i = 0; i < 3; i++) {
      const points = [];
      const segments = 30;
      const yHeight = 14 + i * 3.5;

      for (let j = 0; j < segments; j++) {
        const x = (j / segments) * 120 - 60;
        const z = -24 + i * 9;
        const y = yHeight + Math.sin(j * 0.3) * 1.8;
        points.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(points);
      this.auroraRibbonData.curves.push(curve);

      for (let j = 0; j < totalPointsPerCurve; j++) {
        const t = j / totalPointsPerCurve;
        const position = curve.getPointAt(t);
        positions[pointIndex * 3] = position.x;
        positions[pointIndex * 3 + 1] = position.y;
        positions[pointIndex * 3 + 2] = position.z;

        const color = colorPalette[i].clone().lerp(new THREE.Color(0xffffff), 0.3);
        colors[pointIndex * 3] = color.r;
        colors[pointIndex * 3 + 1] = color.g;
        colors[pointIndex * 3 + 2] = color.b;

        sizes[pointIndex] = 0.95 + Math.random() * 0.85;

        this.auroraRibbonData.ts.push(t);
        this.auroraRibbonData.speeds.push(0.02 + Math.random() * 0.015);
        this.auroraRibbonData.curveIndices.push(i);
        pointIndex += 1;
      }
    }

    this.auroraRibbonData.count = pointIndex;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('vColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: window.devicePixelRatio || 1 }
      },
      vertexShader: `
        attribute float aSize;
        attribute vec3 vColor;
        varying vec3 vColorOut;
        uniform float uPixelRatio;
        void main() {
          vColorOut = vColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (uPixelRatio / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColorOut;
        void main() {
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          float dist = length(uv);
          float alpha = smoothstep(1.0, 0.4, dist);
          if (alpha < 0.04) discard;
          gl_FragColor = vec4(vColorOut, alpha * 0.55);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const auroraPoints = new THREE.Points(geometry, material);
    auroraPoints.renderOrder = 6;
    auroraPoints.name = 'auroraRibbonPoints';
    this.worldRoot.add(auroraPoints);
    this.auroraRibbons.push(auroraPoints);
  }
  
  /**
   * Create warm mirage bands on the horizon
   */
  createHorizonMirage() {
    this.horizonMirageBands = [];
    const bandCount = 3;

    for (let i = 0; i < bandCount; i++) {
      const linePoints = [];
      const segmentCount = 14;
      const baseY = 10 + i * 1.7;
      const baseZ = -86 + i * 8;

      for (let j = 0; j <= segmentCount; j++) {
        const t = j / segmentCount;
        const x = (t - 0.5) * 160;
        const wobble = Math.sin(t * Math.PI * 2 + i * 1.4) * 0.95
          + Math.cos(t * Math.PI * 4 + i) * 0.28;
        linePoints.push(new THREE.Vector3(
          x,
          wobble * 0.14,
          baseZ + wobble * 0.3
        ));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      const material = new THREE.LineBasicMaterial({
        color: 0xffe0c6,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      });

      const line = new THREE.Line(geometry, material);
      line.renderOrder = 90;
      line.position.y = baseY;
      line.rotation.y = (Math.random() - 0.5) * 0.16;
      line.scale.set(1, 1, 1);

      line.userData = {
        mirageTimer: Math.random() * 10,
        mirageDuration: 0,
        baseY,
        baseOpacity: 0.04 + i * 0.012,
        phase: Math.random() * Math.PI * 2
      };

      this.worldRoot.add(line);
      this.horizonMirageBands.push(line);
    }
  }

  /**
   * Create ground-level blowing sand dust
   * Low horizontal drift particles simulating wind-carried sand
   */
  createGroundDust() {
    const particleCount = 70;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * this.desertRadius * 0.85;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0.15 + Math.random() * 2.2;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      // Primary wind direction: +X with variation
      velocities[i * 3] = 2.0 + Math.random() * 2.5;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.25;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xd4b896,
      size: 0.22,
      transparent: true,
      opacity: 0.16,
      blending: THREE.NormalBlending,
      depthWrite: false,
      sizeAttenuation: true,
      fog: true
    });

    this.groundDust = new THREE.Points(geometry, material);
    this.groundDust.renderOrder = 5;
    this.groundDust.userData = { velocities };
    this.worldRoot.add(this.groundDust);
  }

  /**
   * Create subtle ground-level atmospheric haze planes
   * Adds depth and heat-haze impression near the sand surface
   */
  createGroundMist() {
    const mistConfigs = [
      { x: 0, z: -30, width: 80, depth: 40, y: 0.8, opacity: 0.025 },
      { x: -20, z: 20, width: 60, depth: 35, y: 1.0, opacity: 0.02 },
      { x: 25, z: -10, width: 50, depth: 30, y: 0.6, opacity: 0.018 }
    ];

    mistConfigs.forEach((config) => {
      const geometry = new THREE.PlaneGeometry(config.width, config.depth);
      const material = new THREE.MeshBasicMaterial({
        color: 0xe8c8a8,
        transparent: true,
        opacity: config.opacity,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
        fog: true
      });

      const plane = new THREE.Mesh(geometry, material);
      plane.rotation.x = -Math.PI / 2;
      plane.position.set(config.x, config.y, config.z);
      plane.renderOrder = 3;
      plane.userData = {
        baseOpacity: config.opacity,
        baseY: config.y,
        baseX: config.x,
        phase: Math.random() * Math.PI * 2,
        driftSpeed: 0.02 + Math.random() * 0.015
      };

      this.worldRoot.add(plane);
      this.groundMistPlanes.push(plane);
    });
  }

  getCollisionObjects() {
    return this.collisionObjects;
  }
  
  /**
   * Update dream desert animations
   */
  update(deltaTime, time) {
    // Session 112+: Update reference plane
    if (this.referencePlane && this.referencePlane.animate) {
      this.referencePlane.animate(deltaTime, time);
    }
    
    // Dunes gentle breathing
    if (this.dunes) {
      this.dunes.forEach(dune => {
        const data = dune.userData;
        const breath = Math.sin(time * data.breathSpeed + data.breathOffset) * 0.04;
        dune.scale.y = data.originalScaleY + breath;
        dune.scale.x = data.originalScaleX + Math.sin(time * data.swaySpeed + data.breathOffset) * 0.03;
        dune.scale.z = data.originalScaleZ + Math.cos(time * data.swaySpeed * 0.85 + data.breathOffset) * 0.04;
        dune.rotation.z = data.originalRotationZ + Math.sin(time * data.swaySpeed * 0.7 + data.breathOffset) * 0.02;
      });
    }
    
    // Energy veins pulsing
    this.energyVeins.forEach(vein => {
      const pulse = Math.sin(time * 0.8 + vein.userData.pulseOffset);
      const t = pulse * 0.5 + 0.5;
      vein.material.opacity = vein.userData.baseOpacity + t * 0.05;
      vein.material.color.copy(vein.userData.warmColor).lerp(vein.userData.glowColor, t);
    });
    
    // Crystals floating and rotating
    this.crystals.forEach(crystal => {
      const data = crystal.userData;
      
      crystal.position.y = data.originalY + 
        Math.sin(time * data.floatSpeed + data.floatOffset) * 1.5;
      
      crystal.rotation.x += data.rotationSpeed * deltaTime;
      crystal.rotation.y += data.rotationSpeed * deltaTime * 0.7;
      
      const pulse = Math.sin(time * 2) * 0.1;
      crystal.material.emissiveIntensity = 0.12 + pulse * 0.05;
      crystal.material.opacity = 0.22 + (pulse * 0.5 + 0.5) * 0.08;
    });
    
    // Fragments floating
    this.fragments.forEach(fragment => {
      const data = fragment.userData;
      
      fragment.position.y = data.originalY + 
        Math.sin(time * data.floatSpeed + data.floatOffset) * 2;
      
      fragment.rotation.x += data.rotationSpeed * deltaTime;
      fragment.rotation.y += data.rotationSpeed * deltaTime * 1.5;
      if (fragment.material) {
        const pulse = 0.5 + Math.sin(time * data.floatSpeed + data.floatOffset) * 0.5;
        fragment.material.emissiveIntensity = 0.05 + pulse * 0.04;
      }
    });
    
    // Particles drifting
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      const velocities = this.particles.userData.velocities;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i] * deltaTime * 10;
        positions[i + 1] += velocities[i + 1] * deltaTime * 10;
        positions[i + 2] += velocities[i + 2] * deltaTime * 10;
        
        // Reset if too high or too far
        if (positions[i + 1] > 25 || Math.sqrt(
          positions[i] * positions[i] + 
          positions[i + 2] * positions[i + 2]
        ) > 90) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 70;
          positions[i] = Math.cos(angle) * radius;
          positions[i + 1] = 0;
          positions[i + 2] = Math.sin(angle) * radius;
        }
      }
      
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
    
    if (this.particles?.material) {
      this.particles.material.opacity = 0.28 + Math.sin(time * 0.25) * 0.04;
    }
    
    // Dust devil spirals
    if (this.dustDevilData) {
      const data = this.dustDevilData;
      const positions = data.positions;
      for (let i = 0; i < data.count; i++) {
        data.angles[i] += data.rotSpeeds[i] * deltaTime;
        data.heights[i] += data.riseSpeeds[i] * deltaTime;
        if (data.heights[i] > data.maxHeight) {
          data.heights[i] = 0;
          data.angles[i] = Math.random() * Math.PI * 2;
        }
        const t = Math.min(1.0, data.heights[i] / data.maxHeight);
        const radius = Math.max(0.15, data.baseRadius[i] * (1.0 - t));
        const angle = data.angles[i] + i * data.goldenAngle;
        positions[i * 3] = data.centersX[i] + Math.cos(angle) * radius;
        positions[i * 3 + 1] = data.heights[i];
        positions[i * 3 + 2] = data.centersZ[i] + Math.sin(angle) * radius;
      }
      data.object.geometry.attributes.position.needsUpdate = true;
      data.object.material.opacity = 0.46 + Math.sin(time * 0.5) * 0.08;
    }

    // Wind ribbons flowing along curves
    if (this.auroraRibbons.length && this.auroraRibbonData) {
      const ribbonPoints = this.auroraRibbons[0];
      const positions = ribbonPoints.geometry.attributes.position.array;
      const data = this.auroraRibbonData;

      for (let i = 0; i < data.count; i++) {
        data.ts[i] += data.speeds[i] * deltaTime;
        if (data.ts[i] > 1.0) data.ts[i] -= 1.0;
        const curve = data.curves[data.curveIndices[i]];
        const pos = curve.getPointAt(data.ts[i]);
        positions[i * 3] = pos.x;
        positions[i * 3 + 1] = pos.y;
        positions[i * 3 + 2] = pos.z;
      }

      ribbonPoints.geometry.attributes.position.needsUpdate = true;
      ribbonPoints.material.opacity = 0.2 + Math.sin(time * 0.4) * 0.06;
    }

    // Horizon mirage effect
    this.horizonMirageBands.forEach(plane => {
      plane.userData.mirageTimer -= deltaTime;
      
      if (plane.userData.mirageTimer <= 0 && plane.userData.mirageDuration <= 0) {
        plane.userData.mirageDuration = 2.5 + Math.random() * 1.5;
        plane.userData.mirageTimer = 7 + Math.random() * 8;
      }
      
      if (plane.userData.mirageDuration > 0) {
        plane.userData.mirageDuration -= deltaTime;
        const progress = Math.max(0, plane.userData.mirageDuration / 4.0);
        const pulse = Math.sin(time * 0.9 + plane.userData.phase) * 0.5 + 0.5;
        plane.material.opacity = plane.userData.baseOpacity * (0.35 + pulse * 0.65) * (0.5 + progress);
        plane.position.y = plane.userData.baseY + Math.sin(time * 0.65 + plane.userData.phase) * 0.18;
        plane.scale.x = 1.0 + Math.sin(time * 0.35 + plane.userData.phase) * 0.03;
        plane.scale.z = 1.0 + Math.cos(time * 0.28 + plane.userData.phase) * 0.02;
      } else {
        plane.material.opacity = 0;
        plane.position.y = plane.userData.baseY;
        plane.scale.x = 1.0;
        plane.scale.z = 1.0;
      }
    });

    if (this.sunGlowSprite) {
      const orbitAngle = time * this.sunOrbitSpeed;
      const sunX = -58 + Math.cos(orbitAngle) * this.sunOrbitRadiusX;
      const sunZ = -100 + Math.sin(orbitAngle) * this.sunOrbitRadiusZ;
      const sunY = 34 + Math.sin(orbitAngle * 0.55) * 4.5;
      this.sunGlowSprite.position.set(sunX, sunY, sunZ);
      const pulse = Math.sin(time * 0.2) * 0.5 + 0.5;
      this.sunGlowSprite.material.opacity = 0.24 + pulse * 0.06;
      const sunScale = 24 + pulse * 1.2;
      this.sunGlowSprite.scale.set(sunScale, sunScale, 1);
    }

    if (this.sunPointLight) {
      const orbitAngle = time * this.sunOrbitSpeed;
      const sunX = -58 + Math.cos(orbitAngle) * this.sunOrbitRadiusX;
      const sunZ = -100 + Math.sin(orbitAngle) * this.sunOrbitRadiusZ;
      const sunY = 34 + Math.sin(orbitAngle * 0.55) * 4.5;
      this.sunPointLight.position.set(sunX, sunY, sunZ);
      const pulse = Math.sin(time * 0.2) * 0.5 + 0.5;
      this.sunPointLight.intensity = 0.32 + pulse * 0.08;
    }

    if (this.cloudLayers.length) {
      this.cloudLayers.forEach((cloud, index) => {
        if (cloud.material && cloud.material.uniforms) {
          cloud.material.uniforms.uTime.value = time;
        }
        const phase = cloud.userData.phase || 0;
        cloud.position.x = cloud.userData.baseX + Math.sin(time * 0.02 + index * 1.7 + phase) * 1.8;
        cloud.position.z = cloud.userData.baseZ + Math.cos(time * 0.018 + index * 0.9 + phase) * 1.1;
      });
    }

    if (this.landmarks.length) {
      this.landmarks.forEach(landmark => {
        if (landmark.userData?.halo) {
          const pulse = Math.sin(time * 0.45 + landmark.userData.pulseOffset) * 0.5 + 0.5;
          landmark.userData.halo.material.opacity = 0.1 + pulse * 0.08;
        }
      });
    }

    // Sky time uniform for horizon glow animation
    if (this.skyMaterial) {
      this.skyMaterial.uniforms.uTime.value = time;
    }

    // Ground dust — horizontal sand drift near surface
    if (this.groundDust) {
      const dustPositions = this.groundDust.geometry.attributes.position.array;
      const dustVelocities = this.groundDust.userData.velocities;

      for (let i = 0; i < dustPositions.length; i += 3) {
        dustPositions[i] += dustVelocities[i] * deltaTime;
        dustPositions[i + 1] += dustVelocities[i + 1] * deltaTime;
        dustPositions[i + 2] += dustVelocities[i + 2] * deltaTime;

        const dist = Math.sqrt(
          dustPositions[i] * dustPositions[i] +
          dustPositions[i + 2] * dustPositions[i + 2]
        );
        if (dist > this.desertRadius || dustPositions[i + 1] > 4.0) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * this.desertRadius * 0.8;
          dustPositions[i] = Math.cos(angle) * radius;
          dustPositions[i + 1] = 0.15 + Math.random() * 1.5;
          dustPositions[i + 2] = Math.sin(angle) * radius;
        }
      }

      this.groundDust.geometry.attributes.position.needsUpdate = true;
      this.groundDust.material.opacity = 0.14 + Math.sin(time * 0.3) * 0.04;
    }

    // Ground mist — subtle atmospheric haze drift
    this.groundMistPlanes.forEach((plane) => {
      const data = plane.userData;
      const pulse = Math.sin(time * data.driftSpeed + data.phase);
      plane.material.opacity = data.baseOpacity + pulse * 0.008;
      plane.position.y = data.baseY + pulse * 0.12;
      plane.position.x = data.baseX + Math.sin(time * 0.012 + data.phase) * 0.8;
    });

    // Dynamic fog color — warmer when sun is lower
    if (this.scene && this.scene.fog) {
      const orbitAngle = time * this.sunOrbitSpeed;
      const sunElevation = Math.sin(orbitAngle * 0.55);
      const warmth = 0.88 + sunElevation * 0.12;
      this.scene.fog.color.setRGB(0.886 * warmth, 0.753 * warmth, 0.659 * warmth);
    }

    // Dynamic hemisphere light — intensity follows sun elevation
    if (this.hemisphereLight) {
      const orbitAngle = time * this.sunOrbitSpeed;
      const sunElevation = Math.sin(orbitAngle * 0.55);
      this.hemisphereLight.intensity = 0.42 + sunElevation * 0.12;
    }
  }
}
