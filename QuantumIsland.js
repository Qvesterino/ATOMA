import * as THREE from 'three';
import { initMapReferencePlane } from './MapReferencePlaneFactory.js';
import { getMapConfig } from './MapConfigBase.js';
import { materialRegistry } from './src/metrics/rendering/MaterialRegistry_v1.js';

/**
 * Quantum Island - Floating landmass in singularity void
 * Represents quantum instability in AI dream state
 * NOTE: Keep the analytic ground helper and movement bounds in sync with the island mesh so the controller never falls back to raycasts.
 * NOTE: The island mesh is walkable terrain even though it lives in collisionObjects; only true blockers should remain untagged or use explicit blocker colliders.
 */
export class QuantumIsland {
  constructor(scene, worldRoot, camera = null) {
    console.log('WORLD CONSTRUCTOR:', this.constructor.name);
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.camera = camera;
    this.orbitingRocks = [];
    this.floatingShards = [];
    this.filaments = [];
    this.glitchRibbons = [];
    this.fractalPatterns = [];
    this.entanglementLines = [];
    this.orbitingRockTrails = null;
    this.orbitingRockTrailData = null;
    this.hologramGrid = null;
    this.hologramGridTimer = 12 + Math.random() * 4;
    this.hologramGridActive = false;
    this.hologramGridProgress = 0;
    this.singularitySprite = null;
    this.singularityParticles = null;
    this.singularityData = null;
    this.collisionObjects = [];
    this.playerGroundOffset = 1;
    this.islandRadius = 20;
    this.islandTopHeight = 1.5;
    this.quantumPulse = 0;
    
    // Session 112+: Initialize map reference plane from config
    this.initializeMapConfig();
    this.initializeReferencePlane();

    if (this.scene) {
      this.scene.background = new THREE.Color(0x020108);
      this.scene.fog = new THREE.FogExp2(0x020108, 0.004);
    }
    this.createLighting();
        this.createIsland();
    this.createIslandHologramGrid();
    this.createSingularityCore();
    this.createVortexVoid();
    this.createOrbitingRocks();
    this.createOrbitingRockTrails();
    this.createFilaments();
    this.createFloatingShards();
    this.createQuantumParticles();
    this.createGlitchRibbons();
    this.createFractalPatterns();
    this.createMist();
    this.createCircuitDome();
  }
  
  /**
   * Initialize map configuration
   */
  initializeMapConfig() {
    this.mapConfig = getMapConfig('QuantumIsland');
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
  
  /**
   * Create the main island platform
   */
  createIsland() {
    // Main island body - smooth black stone
    const islandGeometry = new THREE.CylinderGeometry(20, 18, 3, 32, 1, false);
    
    // Deform top for more organic but still geometric look
    const positions = islandGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      if (y > 0) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const dist = Math.sqrt(x * x + z * z);
        const distortion = Math.sin(dist * 0.3) * 0.5;
        positions.setY(i, y + distortion);
      }
    }
    islandGeometry.computeVertexNormals();
    
    const islandMaterial = materialRegistry.getStandard('world.quantumisland.island', {
      color: 0x0a0a0a,
      roughness: 0.3,
      metalness: 0.8
    });
    
    this.island = new THREE.Mesh(islandGeometry, islandMaterial);
    this.island.position.y = 0;
    this.island.userData = {
      collisionEnabled: true,
      isWalkable: true,
      collisionRole: 'terrain',
      terrainType: 'island'
    };
    this.worldRoot.add(this.island);
    this.collisionObjects.push(this.island);
    
    // Neon edge highlights
    const edgeCount = 32;
    for (let i = 0; i < edgeCount; i++) {
      const angle = (i / edgeCount) * Math.PI * 2;
      const radius = 19.5;
      
      const edgeGeometry = new THREE.BoxGeometry(0.8, 0.15, 0.15);
      const edgeMaterial = materialRegistry.getBasic('world.quantumisland.edgeAccent', {
        color: 0x00dddd,
        transparent: true,
        opacity: 0.6
      });
      
      const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
      edge.position.x = Math.cos(angle) * radius;
      edge.position.z = Math.sin(angle) * radius;
      edge.position.y = 1.5;
      edge.rotation.y = angle;
      
      edge.userData = {
        pulseOffset: i * 0.2
      };
      
      this.island.add(edge);
    }
    
    // Geometric cracks with glowing energy
    this.createEnergyCracks();
  }

  getGroundLevelAt(x, z) {
    const centerY = this.island?.position.y ?? 0;
    const dist = Math.sqrt(x * x + z * z);
    if (dist > this.islandRadius) {
      return centerY + this.playerGroundOffset;
    }

    const surfaceY = centerY + this.islandTopHeight + Math.sin(dist * 0.3) * 0.5;
    return surfaceY + this.playerGroundOffset;
  }

  getMaxStepHeight() {
    return 1.9;
  }

  getMovementBounds() {
    return {
      type: 'circle',
      center: new THREE.Vector3(0, 0, 0),
      radius: this.islandRadius + 26
    };
  }

  /**
   * Create the singularity core at island center
   */
  createSingularityCore() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.25, 'rgba(170,255,255,0.85)');
    gradient.addColorStop(0.55, 'rgba(180,110,255,0.55)');
    gradient.addColorStop(1, 'rgba(180,110,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(0, 2, 0);
    sprite.scale.set(6, 6, 1);
    this.worldRoot.add(sprite);
    this.singularitySprite = sprite;

    const particleCount = 40;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const angles = new Float32Array(particleCount);
    const radii = new Float32Array(particleCount);
    const heights = new Float32Array(particleCount);
    const colorLow = new THREE.Color(0xffffff);
    const colorHigh = new THREE.Color(0x00ffff);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1 + Math.random() * 3;
      const height = 1 + Math.random() * 2;
      angles[i] = angle;
      radii[i] = radius;
      heights[i] = height;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      const color = colorLow.clone().lerp(colorHigh, Math.random());
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(particleGeometry, particleMaterial);
    points.position.set(0, 0, 0);
    this.worldRoot.add(points);
    this.singularityParticles = points;
    this.singularityData = {
      angles,
      radii,
      heights,
      particleCount
    };
  }
  
  /**
   * Create glowing energy cracks in the island
   */
  createEnergyCracks() {
    const crackCount = 8;
    
    for (let i = 0; i < crackCount; i++) {
      const angle = (i / crackCount) * Math.PI * 2 + Math.random() * 0.5;
      const startRadius = 3 + Math.random() * 5;
      const endRadius = 15 + Math.random() * 4;
      
      const points = [];
      const segments = 8;
      
      for (let j = 0; j < segments; j++) {
        const t = j / (segments - 1);
        const radius = startRadius + (endRadius - startRadius) * t;
        const angleOffset = Math.sin(t * Math.PI) * 0.3;
        
        points.push(new THREE.Vector3(
          Math.cos(angle + angleOffset) * radius,
          1.51,
          Math.sin(angle + angleOffset) * radius
        ));
      }
      
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.12, 8, false);
      const tubeMaterial = materialRegistry.getBasic('world.quantumisland.vortexTube', {
        color: 0x00ddcc,
        emissive: 0x00ddcc,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.7
      });
      
      const crack = new THREE.Mesh(tubeGeometry, tubeMaterial);
      crack.userData = {
        pulseOffset: Math.random() * Math.PI * 2
      };
      
      this.island.add(crack);
    }
  }
  
  /**
   * Create swirling vortex void beneath island
   */
  createVortexVoid() {
    // Multiple layered rings creating vortex effect
    this.vortexRings = [];
    const ringCount = 12;
    
    for (let i = 0; i < ringCount; i++) {
      const radius = 30 + i * 8;
      const yPos = -10 - i * 3;
      
      const ringGeometry = new THREE.TorusGeometry(radius, 0.5, 8, 64);
      
      // Gradient color violet to turquoise
      const colorMix = i / ringCount;
      const color = new THREE.Color(0x8800ff).lerp(new THREE.Color(0x00dddd), colorMix);
      
      const ringMaterial = materialRegistry.getBasic('world.quantumisland.vortexRing', {
        color: color,
        transparent: true,
        opacity: 0.3 - (i / ringCount) * 0.2,
        side: THREE.DoubleSide
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.y = yPos;
      ring.rotation.x = Math.PI / 2;
      
      ring.userData = {
        rotationSpeed: 0.05 + (i * 0.005),
        originalRadius: radius
      };
      
      this.worldRoot.add(ring);
      this.vortexRings.push(ring);
    }
    
    // Add central swirl effect
    const swirlCount = 6;
    this.swirlArms = [];
    
    for (let i = 0; i < swirlCount; i++) {
      const angle = (i / swirlCount) * Math.PI * 2;
      const points = [];
      const segments = 30;
      
      for (let j = 0; j < segments; j++) {
        const t = j / segments;
        const radius = t * 40;
        const spiralAngle = angle + t * Math.PI * 3;
        const yPos = -10 - t * 25;
        
        points.push(new THREE.Vector3(
          Math.cos(spiralAngle) * radius,
          yPos,
          Math.sin(spiralAngle) * radius
        ));
      }
      
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeometry = new THREE.TubeGeometry(curve, 60, 0.3, 8, false);
      
      const color = i % 2 === 0 ? 0x8800ff : 0x00dddd;
      const tubeMaterial = materialRegistry.getBasic('world.quantumisland.filament', {
        color: color,
        transparent: true,
        opacity: 0.25,
        emissive: color,
        emissiveIntensity: 0.3
      });
      
      const swirl = new THREE.Mesh(tubeGeometry, tubeMaterial);
      swirl.userData = {
        rotationSpeed: 0.03
      };
      
      this.worldRoot.add(swirl);
      this.swirlArms.push(swirl);
    }
  }
  
  /**
   * Create rocks orbiting the island
   */
  createOrbitingRocks() {
    const rockCount = 8;
    
    const geometries = [
      new THREE.OctahedronGeometry(1.5),
      new THREE.TetrahedronGeometry(1.8),
      new THREE.IcosahedronGeometry(1.3),
      new THREE.DodecahedronGeometry(1.4)
    ];
    
    for (let i = 0; i < rockCount; i++) {
      const geometry = geometries[Math.floor(Math.random() * geometries.length)];
      const material = materialRegistry.getStandard('world.quantumisland.rock', {
        color: 0x1a1a1a,
        roughness: 0.4,
        metalness: 0.7,
        emissive: 0x004444,
        emissiveIntensity: 0.2
      });
      
      const rock = new THREE.Mesh(geometry, material);
      
      const orbitRadius = 25 + Math.random() * 10;
      const orbitHeight = 3 + Math.random() * 8;
      const orbitAngle = (i / rockCount) * Math.PI * 2;
      
      rock.position.x = Math.cos(orbitAngle) * orbitRadius;
      rock.position.y = orbitHeight;
      rock.position.z = Math.sin(orbitAngle) * orbitRadius;
      
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      rock.userData = {
        orbitRadius: orbitRadius,
        orbitHeight: orbitHeight,
        orbitSpeed: 0.1 + Math.random() * 0.05,
        orbitAngle: orbitAngle,
        rotationSpeed: 0.2 + Math.random() * 0.3
      };
      
      this.worldRoot.add(rock);
      this.orbitingRocks.push(rock);
    }
  }

  createIslandHologramGrid() {
    const grid = new THREE.GridHelper(40, 20, 0x00dddd, 0x00dddd);
    grid.material = new THREE.LineBasicMaterial({
      color: 0x00dddd,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    grid.position.y = 1.55;
    grid.renderOrder = 20;
    this.worldRoot.add(grid);
    this.hologramGrid = grid;
  }

  createLighting() {
    if (!this.scene) {
      return;
    }

    const hemiLight = new THREE.HemisphereLight(0x110033, 0x000000, 0.2);
    hemiLight.name = 'quantumIslandHemisphereLight';
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0x4466ff, 0.3);
    dirLight.position.set(30, 50, 20);
    dirLight.name = 'quantumIslandDirectionalLight';
    this.scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x00dddd, 0.6, 30, 2);
    pointLight.position.set(0, 2, 0);
    pointLight.name = 'quantumIslandSingularityPointLight';
    this.scene.add(pointLight);

    this.lights = {
      hemiLight,
      dirLight,
      pointLight
    };
  }

  createOrbitingRockTrails() {
    const trailPerRock = 10;
    const trailCount = this.orbitingRocks.length * trailPerRock;
    const positions = new Float32Array(trailCount * 3);
    const colors = new Float32Array(trailCount * 3);
    const curveIndices = new Uint8Array(trailCount);
    const fadeLevels = new Float32Array(trailCount);
    const history = [];
    const baseColor = new THREE.Color(0x004444);

    for (let i = 0; i < this.orbitingRocks.length; i++) {
      history[i] = [];
    }

    for (let i = 0; i < trailCount; i++) {
      const rockIndex = Math.floor(i / trailPerRock);
      const rock = this.orbitingRocks[rockIndex];
      const offset = i % trailPerRock;
      const position = rock ? rock.position : new THREE.Vector3();

      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      curveIndices[i] = rockIndex;
      fadeLevels[i] = 1 - offset / (trailPerRock - 1);
      const color = baseColor.clone().lerp(new THREE.Color(0x000000), 1 - fadeLevels[i]);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const trailGeometry = new THREE.BufferGeometry();
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    trailGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    trailGeometry.setAttribute('aFade', new THREE.BufferAttribute(fadeLevels, 1));

    const trailMaterial = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const trailPoints = new THREE.Points(trailGeometry, trailMaterial);
    this.worldRoot.add(trailPoints);
    this.orbitingRockTrails = trailPoints;
    this.orbitingRockTrailData = {
      trailPerRock,
      trailCount,
      history,
      baseColor,
      curveIndices
    };
  }

  /**
   * Create thin filaments connecting island to void
   */
  createFilaments() {
    const filamentCount = 12;
    
    for (let i = 0; i < filamentCount; i++) {
      const angle = (i / filamentCount) * Math.PI * 2;
      const startRadius = 15 + Math.random() * 4;
      
      const points = [
        new THREE.Vector3(
          Math.cos(angle) * startRadius,
          0,
          Math.sin(angle) * startRadius
        ),
        new THREE.Vector3(
          Math.cos(angle) * (startRadius + 10),
          -5 - Math.random() * 5,
          Math.sin(angle) * (startRadius + 10)
        ),
        new THREE.Vector3(
          Math.cos(angle) * (startRadius + 20),
          -15 - Math.random() * 10,
          Math.sin(angle) * (startRadius + 20)
        )
      ];
      
      const curve = new THREE.CatmullRomCurve3(points);
      const linePoints = curve.getPoints(20);
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x00dddd,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      
      const filament = new THREE.Line(lineGeometry, lineMaterial);
      filament.userData = {
        pulseOffset: Math.random() * Math.PI * 2
      };
      
      this.worldRoot.add(filament);
      this.filaments.push(filament);
    }
  }
  
  /**
   * Create distant floating shards
   */
  createFloatingShards() {
    const shardCount = 20;
    
    for (let i = 0; i < shardCount; i++) {
      const geometry = new THREE.BoxGeometry(
        2 + Math.random() * 3,
        0.2,
        1 + Math.random() * 2
      );
      
      const material = materialRegistry.getStandard('world.quantumisland.shard', {
        color: 0x2a2a3a,
        transparent: true,
        opacity: 0.4,
        metalness: 0.8,
        roughness: 0.3,
        emissive: 0x003355,
        emissiveIntensity: 0.1
      });
      
      const shard = new THREE.Mesh(geometry, material);
      
      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 40;
      
      shard.position.x = Math.cos(angle) * distance;
      shard.position.y = -5 + Math.random() * 20;
      shard.position.z = Math.sin(angle) * distance;
      
      shard.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      shard.userData = {
        floatSpeed: 0.1 + Math.random() * 0.1,
        floatOffset: Math.random() * Math.PI * 2,
        rotationSpeed: 0.05 + Math.random() * 0.05,
        originalY: shard.position.y
      };
      
      this.worldRoot.add(shard);
      this.floatingShards.push(shard);
    }

    // Create entanglement lines for paired shards
    const maxPairs = Math.min(10, Math.floor(this.floatingShards.length / 2));
    for (let i = 0; i < maxPairs; i++) {
      const a = this.floatingShards[i];
      const b = this.floatingShards[i + 10];
      const lineGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(6);
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const entanglementLine = new THREE.Line(lineGeometry, lineMaterial);
      entanglementLine.userData = { shardA: a, shardB: b };
      this.worldRoot.add(entanglementLine);
      this.entanglementLines.push(entanglementLine);
    }
  }
  
  /**
   * Create quantum particles in slow spirals
   */
  createQuantumParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const velocities = [];
    
    const particleCount = 300;
    
    const color1 = new THREE.Color(0x8800ff);
    const color2 = new THREE.Color(0x00dddd);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 50;
      const height = Math.random() * 30 - 10;
      
      positions.push(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
      
      const color = color1.clone().lerp(color2, Math.random());
      colors.push(color.r, color.g, color.b);
      
      // Spiral velocity
      const spiralSpeed = 0.1;
      velocities.push(
        -Math.sin(angle) * spiralSpeed,
        Math.random() * 0.05 - 0.02,
        Math.cos(angle) * spiralSpeed
      );
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    this.quantumParticles = new THREE.Points(geometry, material);
    this.quantumParticles.userData.velocities = velocities;
    this.worldRoot.add(this.quantumParticles);
  }
  
  /**
   * Create glitch ribbons along horizon
   */
  createGlitchRibbons() {
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const distance = 60;
      
      const geometry = new THREE.PlaneGeometry(20, 8, 10, 5);
      const material = materialRegistry.getBasic('world.quantumisland.glitchRibbon', {
        color: 0x00ffff,
        transparent: true,
        opacity: 0,
        wireframe: true,
        side: THREE.DoubleSide
      });
      
      const ribbon = new THREE.Mesh(geometry, material);
      ribbon.position.x = Math.cos(angle) * distance;
      ribbon.position.y = 5;
      ribbon.position.z = Math.sin(angle) * distance;
      ribbon.lookAt(0, 5, 0);
      
      ribbon.userData = {
        glitchTimer: Math.random() * 8,
        glitchDuration: 0
      };
      
      this.worldRoot.add(ribbon);
      this.glitchRibbons.push(ribbon);
    }
  }
  
  /**
   * Create fractal patterns that appear and dissolve
   */
  createFractalPatterns() {
    for (let i = 0; i < 3; i++) {
      const geometry = new THREE.IcosahedronGeometry(3, 1);
      const material = materialRegistry.getBasic('world.quantumisland.fractalPattern', {
        color: 0x00dddd,
        transparent: true,
        opacity: 0,
        wireframe: true
      });
      
      const pattern = new THREE.Mesh(geometry, material);
      pattern.position.y = 8 + i * 3;
      
      pattern.userData = {
        timer: Math.random() * 15,
        duration: 0,
        pulsePhase: 0
      };
      
      this.worldRoot.add(pattern);
      this.fractalPatterns.push(pattern);
    }
  }
  
  /**
   * Create low-density mist
   */
  createMist() {
    const mistGeometry = new THREE.PlaneGeometry(50, 50);
    const mistMaterial = materialRegistry.getBasic('world.quantumisland.mist', {
      color: 0x5533aa,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide
    });
    
    this.mist = new THREE.Mesh(mistGeometry, mistMaterial);
    this.mist.rotation.x = -Math.PI / 2;
    this.mist.position.y = 0.3;
    this.worldRoot.add(this.mist);
  }
  
  /**
   * Create circuit-like dome data flow
   */
  createCircuitDome() {
    const curveCount = 12;
    const particlesPerCurve = 10;
    const totalParticles = curveCount * particlesPerCurve;
    const curves = [];
    const positions = new Float32Array(totalParticles * 3);
    const colors = new Float32Array(totalParticles * 3);
    const tValues = new Float32Array(totalParticles);
    const curveIndices = new Uint8Array(totalParticles);
    const speeds = new Float32Array(totalParticles);
    
    for (let i = 0; i < curveCount; i++) {
      const angle = (i / curveCount) * Math.PI * 2;
      const points = [];
      const segments = 20;
      
      for (let j = 0; j < segments; j++) {
        const t = j / segments;
        const arcAngle = t * Math.PI;
        const radius = 70;
        
        points.push(new THREE.Vector3(
          Math.cos(angle) * Math.sin(arcAngle) * radius,
          Math.cos(arcAngle) * 40 + 10,
          Math.sin(angle) * Math.sin(arcAngle) * radius
        ));
      }
      
      curves.push(new THREE.CatmullRomCurve3(points));
    }
    
    const baseColor = new THREE.Color(0x4466ff);
    for (let i = 0; i < totalParticles; i++) {
      const curveIndex = Math.floor(i / particlesPerCurve);
      const t = Math.random();
      const point = curves[curveIndex].getPointAt(t);
      
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
      
      colors[i * 3] = baseColor.r;
      colors[i * 3 + 1] = baseColor.g;
      colors[i * 3 + 2] = baseColor.b;
      
      tValues[i] = t;
      curveIndices[i] = curveIndex;
      speeds[i] = 0.08 + Math.random() * 0.06;
    }
    
    const flowGeometry = new THREE.BufferGeometry();
    flowGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    flowGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    flowGeometry.setAttribute('aT', new THREE.BufferAttribute(tValues, 1));
    flowGeometry.setAttribute('aCurve', new THREE.BufferAttribute(curveIndices, 1));
    
    const flowMaterial = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const flowPoints = new THREE.Points(flowGeometry, flowMaterial);
    this.worldRoot.add(flowPoints);
    this.circuitFlowPoints = flowPoints;
    this.circuitFlowData = {
      curves,
      tValues,
      curveIndices,
      speeds,
      totalParticles,
      particlesPerCurve
    };
  }
  
  /**
   * Update quantum island animations
   */
  update(deltaTime, time) {
    // Session 112+: Update reference plane
    if (this.referencePlane && this.referencePlane.animate) {
      this.referencePlane.animate(deltaTime, time);
    }
    
    // Quantum tidal pulse
    this.quantumPulse = (Math.sin(time * 1.5) + 1) / 2;

    // Island edge highlights pulse
    if (this.island) {
      const pulse = this.quantumPulse;
      this.island.children.forEach(edge => {
        edge.material.opacity = 0.5 + pulse * 0.2;
      });
    }

    // Island hologram grid activation
    if (this.hologramGrid) {
      this.hologramGridTimer -= deltaTime;
      if (!this.hologramGridActive && this.hologramGridTimer <= 0) {
        this.hologramGridActive = true;
        this.hologramGridProgress = 0;
        this.hologramGridTimer = 12 + Math.random() * 4;
        this.hologramGridStartRotation = this.hologramGrid.rotation.y;
        this.hologramGridTargetRotation = this.hologramGridStartRotation + Math.PI / 4;
      }

      if (this.hologramGridActive) {
        this.hologramGridProgress += deltaTime;
        const duration = 0.8;
        const t = Math.min(this.hologramGridProgress / duration, 1);
        const fade = t < 0.5 ? t * 2 : Math.max(0, 1 - (t - 0.5) * 2);
        if (this.hologramGrid.material) {
          this.hologramGrid.material.opacity = 0.1 * fade;
          this.hologramGrid.rotation.y = THREE.MathUtils.lerp(
            this.hologramGridStartRotation,
            this.hologramGridTargetRotation,
            t
          );
        }
        if (this.hologramGridProgress >= duration) {
          this.hologramGridActive = false;
          this.hologramGridProgress = 0;
          if (this.hologramGrid.material) {
            this.hologramGrid.material.opacity = 0;
          }
        }
      }
    }
    
    // Vortex rings rotation
    this.vortexRings.forEach(ring => {
      ring.rotation.z += ring.userData.rotationSpeed * deltaTime;
      
      // Subtle breathing
      const breath = Math.sin(time * 0.5) * 0.05 + 1;
      ring.scale.set(breath, breath, 1);
    });
    
    // Swirl arms rotation
    this.swirlArms.forEach(swirl => {
      swirl.rotation.y += swirl.userData.rotationSpeed * deltaTime;
    });
    
    // Orbiting rocks
    this.orbitingRocks.forEach(rock => {
      const data = rock.userData;
      data.orbitAngle += data.orbitSpeed * deltaTime;
      const radius = data.orbitRadius + (this.quantumPulse - 0.5) * 3.0;
      
      rock.position.x = Math.cos(data.orbitAngle) * radius;
      rock.position.z = Math.sin(data.orbitAngle) * radius;
      
      rock.rotation.x += data.rotationSpeed * deltaTime;
      rock.rotation.y += data.rotationSpeed * deltaTime * 0.7;
    });

    // Orbiting rock trails
    if (this.orbitingRockTrails && this.orbitingRockTrailData) {
      const data = this.orbitingRockTrailData;
      const positions = this.orbitingRockTrails.geometry.attributes.position.array;
      const trailPerRock = data.trailPerRock;
      const rockCount = this.orbitingRocks.length;
      
      for (let rockIndex = 0; rockIndex < rockCount; rockIndex++) {
        const rock = this.orbitingRocks[rockIndex];
        const history = data.history[rockIndex];
        history.unshift(new THREE.Vector3(rock.position.x, rock.position.y, rock.position.z));
        if (history.length > trailPerRock + 1) history.pop();
      }
      
      for (let i = 0; i < data.trailCount; i++) {
        const rockIndex = data.curveIndices[i];
        const offsetIndex = i % trailPerRock;
        const history = data.history[rockIndex];
        const sample = history[Math.min(offsetIndex, history.length - 1)] || new THREE.Vector3();
        positions[i * 3] = sample.x;
        positions[i * 3 + 1] = sample.y;
        positions[i * 3 + 2] = sample.z;
      }
      this.orbitingRockTrails.geometry.attributes.position.needsUpdate = true;
    }
    
    // Filaments pulse
    this.filaments.forEach(filament => {
      const pulse = Math.sin(time * 1.5 + filament.userData.pulseOffset);
      filament.material.opacity = 0.15 + pulse * 0.1;
    });
    
    // Floating shards
    this.floatingShards.forEach(shard => {
      const data = shard.userData;
      const pulseOffset = (this.quantumPulse - 0.5) * 2.0;
      
      shard.position.y = data.originalY + 
        Math.sin(time * data.floatSpeed + data.floatOffset) * 2 + pulseOffset;
      
      shard.rotation.x += data.rotationSpeed * deltaTime;
      shard.rotation.y += data.rotationSpeed * deltaTime * 1.5;
    });

    // Quantum entanglement lines
    this.entanglementLines.forEach(line => {
      const a = line.userData.shardA;
      const b = line.userData.shardB;
      if (!a || !b) {
        return;
      }

      const positions = line.geometry.attributes.position.array;
      positions[0] = a.position.x;
      positions[1] = a.position.y;
      positions[2] = a.position.z;
      positions[3] = b.position.x;
      positions[4] = b.position.y;
      positions[5] = b.position.z;
      line.geometry.attributes.position.needsUpdate = true;

      const distance = a.position.distanceTo(b.position);
      const maxDistance = 40;
      const intensity = Math.max(0, 1 - distance / maxDistance);
      line.material.opacity = 0.05 + intensity * 0.15;
    });
    
    // Quantum particles spiral
    if (this.quantumParticles) {
      const positions = this.quantumParticles.geometry.attributes.position.array;
      const velocities = this.quantumParticles.userData.velocities;
      const speedScale = 1 + this.quantumPulse * 0.25;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i] * deltaTime * 5 * speedScale;
        positions[i + 1] += velocities[i + 1] * deltaTime * 5 * speedScale;
        positions[i + 2] += velocities[i + 2] * deltaTime * 5 * speedScale;
        
        // Spiral inward/outward
        const x = positions[i];
        const z = positions[i + 2];
        const dist = Math.sqrt(x * x + z * z);
        
        if (dist > 60 || dist < 5) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 20 + Math.random() * 30;
          positions[i] = Math.cos(angle) * radius;
          positions[i + 1] = Math.random() * 30 - 10;
          positions[i + 2] = Math.sin(angle) * radius;
        }
      }
      
      this.quantumParticles.geometry.attributes.position.needsUpdate = true;
      this.quantumParticles.rotation.y += deltaTime * 0.1;
    }

    // Singularity core
    if (this.singularitySprite) {
      const coreScale = 5 + this.quantumPulse * 3;
      this.singularitySprite.scale.set(coreScale, coreScale, 1);
    }

    if (this.singularityParticles && this.singularityData) {
      const positions = this.singularityParticles.geometry.attributes.position.array;
      const data = this.singularityData;
      const orbitSpeed = 2.4;
      
      for (let i = 0; i < data.particleCount; i++) {
        const idx = i * 3;
        const angle = data.angles[i] + time * orbitSpeed;
        const radius = data.radii[i];
        positions[idx] = Math.cos(angle) * radius;
        positions[idx + 1] = data.heights[i] + Math.sin(time * 4 + i) * 0.15;
        positions[idx + 2] = Math.sin(angle) * radius;
      }

      this.singularityParticles.geometry.attributes.position.needsUpdate = true;
    }
    
    // Glitch ribbons
    this.glitchRibbons.forEach(ribbon => {
      ribbon.userData.glitchTimer -= deltaTime;
      
      if (ribbon.userData.glitchTimer <= 0 && ribbon.userData.glitchDuration <= 0) {
        ribbon.userData.glitchDuration = 0.15 + Math.random() * 0.25;
        ribbon.userData.glitchTimer = 4 + Math.random() * 8;
      }
      
      if (ribbon.userData.glitchDuration > 0) {
        ribbon.userData.glitchDuration -= deltaTime;
        ribbon.material.opacity = 0.15 + Math.random() * 0.15;
        
        // Distort
        const positions = ribbon.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          if (Math.random() > 0.6) {
            const offset = (Math.random() - 0.5) * 3;
            positions.setY(i, positions.getY(i) + offset);
          }
        }
        positions.needsUpdate = true;
      } else {
        ribbon.material.opacity = 0;
      }
    });
    
    // Fractal patterns
    this.fractalPatterns.forEach(pattern => {
      pattern.userData.timer -= deltaTime;
      
      if (pattern.userData.timer <= 0 && pattern.userData.duration <= 0) {
        pattern.userData.duration = 3 + Math.random() * 2;
        pattern.userData.timer = 10 + Math.random() * 10;
        pattern.userData.pulsePhase = 0;
      }
      
      if (pattern.userData.duration > 0) {
        pattern.userData.duration -= deltaTime;
        pattern.userData.pulsePhase += deltaTime * 2;
        
        const fadeIn = Math.min(pattern.userData.pulsePhase, 1);
        const fadeOut = Math.max(0, pattern.userData.duration);
        const opacity = Math.min(fadeIn, fadeOut) * 0.3;
        
        pattern.material.opacity = opacity;
        pattern.rotation.x += deltaTime * 0.5;
        pattern.rotation.y += deltaTime * 0.3;
        
        const scale = 1 + Math.sin(pattern.userData.pulsePhase * 2) * 0.2;
        pattern.scale.setScalar(scale);
      } else {
        pattern.material.opacity = 0;
      }
    });
    
    // Mist subtle wave
    if (this.mist) {
      this.mist.material.opacity = 0.08 + Math.sin(time * 0.3) * 0.02;
    }
    
    // Circuit dome data flow
    if (this.circuitFlowPoints && this.circuitFlowData) {
      const data = this.circuitFlowData;
      const positions = this.circuitFlowPoints.geometry.attributes.position.array;
      
      for (let i = 0; i < data.totalParticles; i++) {
        data.tValues[i] += data.speeds[i] * deltaTime;
        if (data.tValues[i] > 1.0) {
          data.tValues[i] = 0;
        }
        const curve = data.curves[data.curveIndices[i]];
        const point = curve.getPointAt(data.tValues[i]);
        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y;
        positions[i * 3 + 2] = point.z;
      }
      
      this.circuitFlowPoints.geometry.attributes.position.needsUpdate = true;
      this.circuitFlowPoints.material.opacity = 0.25 + Math.sin(time * 1.2) * 0.05;
    }
  }
}
