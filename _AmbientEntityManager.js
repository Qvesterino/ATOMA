import * as THREE from 'three';
import { AmbientEntityRegistry } from './_AmbientEntityRegistry.js';
import { canEmissive, safeSetEmissive } from './_EmissiveUtils.js';

/**
 * AMBIENT ENTITY MANAGER
 * 
 * Manages holographic VFX entities: ghost orbs, spectres, swarms, phantoms, wisps.
 * 
 * SAFETY: 100% VFX-only, ZERO gameplay interaction
 * - No physics, no collisions
 * - No engine modifications
 * - All visuals are overlays
 * - <1ms overhead per frame
 */

export class AmbientEntityManager {
  constructor(scene, environmentRoot, camera) {
    this.scene = scene;
    this.root = environmentRoot || scene; // fallback to scene for backward compatibility
    this.camera = camera;
    
    // Registry for all entities
    this.registry = new AmbientEntityRegistry();
    
    // Entity VFX container
    this.vfxContainer = new THREE.Group();
    this.vfxContainer.name = 'AmbientEntities';
    this.root.add(this.vfxContainer);
    
    // Entity meshes and particles
    this.entityMeshes = {}; // id -> mesh/group
    this.entityParticles = {}; // id -> particles array
    this.entityTrailParticles = {}; // id -> fragment trails
    
    // Spawning
    this.spawnChance = 0.003; // 0.3% per second
    this.lastSpawnTime = Date.now();
    this.spawnCooldown = 100; // ms between spawn attempts
    this.maxEntities = 30;
    
    // Phase B pilot: throttle ambient interpretation (mood) to ~4 Hz; visuals/motion stay 60 Hz (aligned with weatherPack pilot)
    this.interpretationInterval = 0.25;
    this.interpretationAccumulator = this.interpretationInterval; // prime for first-frame interpretation
    this.interpretationState = {
      canSpawnFromWeather: false,
      canSpawnFromLegendary: false,
      canSpawnFromEvents: false
    };
    
    // Read-only references to world systems
    this.worldSystems = {
      legendaryPack: null,
      worldEvents: null,
      weatherPack: null,
      linkingSystem: null,
      synergy: 0
    };
    
    // Timing and performance
    this.updateTimer = 0;
    this.particleUpdateInterval = 0.016; // Update particles every frame
  }
  
  /**
   * Register world systems (read-only)
   */
  registerWorldSystems(legendary, events, weather, linking) {
    this.worldSystems.legendaryPack = legendary;
    this.worldSystems.worldEvents = events;
    this.worldSystems.weatherPack = weather;
    this.worldSystems.linkingSystem = linking;
    
    // Keep interpretation snapshot aligned with current inputs
    this.refreshAmbientInterpretation();
  }
  
  /**
   * Update synergy level (for entity spawning/behavior)
   */
  updateSynergy(synergy) {
    this.worldSystems.synergy = synergy;
  }

  /**
   * Low-frequency ambient interpretation (Phase B pilot)
   */
  refreshAmbientInterpretation() {
    const activeWeather = this.worldSystems.weatherPack?.getActiveWeather?.();
    this.interpretationState.canSpawnFromWeather = Array.isArray(activeWeather) && activeWeather.length > 0;
    
    this.interpretationState.canSpawnFromLegendary =
      this.worldSystems.legendaryPack?.getLegendaryNodeCount?.() > 0;
    
    const activeEvents = this.worldSystems.worldEvents?.getActiveEvents?.();
    this.interpretationState.canSpawnFromEvents = Array.isArray(activeEvents) && activeEvents.length > 0;
  }
  
  /**
   * Main update loop
   */
  update(deltaTime) {
    if (this.frameScheduler?.shouldRunVisual?.() === false) return;
    
    // Phase B pilot: mood/interpretation at ~4 Hz, ambient motion/visuals remain 60 Hz (mirrors weatherPack gating)
    this.interpretationAccumulator += deltaTime;
    const shouldRunInterpretation = this.interpretationAccumulator >= this.interpretationInterval;
    if (shouldRunInterpretation) {
      this.interpretationAccumulator = 0;
      this.refreshAmbientInterpretation();
    }
    
    // Attempt to spawn new entities
    this.updateSpawning();
    
    // Update all active entities
    this.updateAllEntities(deltaTime);
    
    // Update entity visuals
    this.updateEntityVisuals(deltaTime);
    
    // Handle despawning
    this.cleanupDespawnedEntities();
  }
  
  /**
   * Check if we should spawn a new entity
   */
  updateSpawning() {
    const now = Date.now();
    if (now - this.lastSpawnTime < this.spawnCooldown) {
      return;
    }
    
    this.lastSpawnTime = now;
    
    // Don't spawn if at max
    const activeCount = Object.values(this.registry.entities)
      .filter(e => e.isActive).length;
    if (activeCount >= this.maxEntities) {
      return;
    }
    
    // Random spawn chance
    if (Math.random() > this.spawnChance) {
      return;
    }
    
    // Determine spawn conditions
    const {
      canSpawnFromWeather,
      canSpawnFromLegendary,
      canSpawnFromEvents
    } = this.interpretationState;
    const randomSpawn = Math.random() < 0.5;
    
    if (!canSpawnFromWeather && !canSpawnFromLegendary && !canSpawnFromEvents && !randomSpawn) {
      return;
    }
    
    // Select random entity type
    const types = Object.values(this.registry.TYPES);
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    // Generate random spawn position around player
    const playerPos = this.camera.position;
    const spawnDist = 10 + Math.random() * 30;
    const angle = Math.random() * Math.PI * 2;
    const height = -5 + Math.random() * 15;
    
    const spawnPos = {
      x: playerPos.x + Math.cos(angle) * spawnDist,
      y: playerPos.y + height,
      z: playerPos.z + Math.sin(angle) * spawnDist
    };
    
    // Spawn entity
    this.spawnEntity(randomType, spawnPos);
  }
  
  /**
   * Spawn a new ambient entity
   */
  spawnEntity(type, position) {
    const lifetime = 20 + Math.random() * 30; // 20-50s
    const intensity = 0.5 + Math.random() * 0.5;
    
    // Initial velocity based on type
    let velocity = { x: 0, y: 0, z: 0 };
    switch (type) {
      case this.registry.TYPES.GHOST_ORB:
        velocity = {
          x: (Math.random() - 0.5) * 0.5,
          y: (Math.random() - 0.5) * 0.3,
          z: (Math.random() - 0.5) * 0.5
        };
        break;
      case this.registry.TYPES.AI_SPECTRE:
        velocity = {
          x: (Math.random() - 0.5) * 0.3,
          y: 0.1,
          z: (Math.random() - 0.5) * 0.3
        };
        break;
      case this.registry.TYPES.FRAGMENT_SWARM:
        velocity = {
          x: (Math.random() - 0.5) * 0.8,
          y: (Math.random() - 0.5) * 0.4,
          z: (Math.random() - 0.5) * 0.8
        };
        break;
      case this.registry.TYPES.SIGMA_PHANTOM:
        velocity = {
          x: (Math.random() - 0.5) * 0.4,
          y: (Math.random() - 0.5) * 0.2,
          z: (Math.random() - 0.5) * 0.4
        };
        break;
      case this.registry.TYPES.QUANTUM_WISP:
        velocity = {
          x: (Math.random() - 0.5) * 0.6,
          y: (Math.random() - 0.5) * 0.5,
          z: (Math.random() - 0.5) * 0.6
        };
        break;
    }
    
    const entity = this.registry.createEntity(type, position, {
      velocity,
      lifetime,
      intensity
    });
    
    // Create visual representation
    this.createEntityVisuals(entity);
  }
  
  /**
   * Create visual mesh for entity
   */
  createEntityVisuals(entity) {
    let mesh = null;
    
    switch (entity.type) {
      case this.registry.TYPES.GHOST_ORB:
        mesh = this.createGhostOrb(entity);
        break;
      case this.registry.TYPES.AI_SPECTRE:
        mesh = this.createAISpectre(entity);
        break;
      case this.registry.TYPES.FRAGMENT_SWARM:
        mesh = this.createFragmentSwarm(entity);
        break;
      case this.registry.TYPES.SIGMA_PHANTOM:
        mesh = this.createSigmaPhantom(entity);
        break;
      case this.registry.TYPES.QUANTUM_WISP:
        mesh = this.createQuantumWisp(entity);
        break;
    }
    
    if (mesh) {
      this.vfxContainer.add(mesh);
      mesh.position.copy(entity.position);
      this.entityMeshes[entity.id] = mesh;
      entity.vfxContainer = mesh;
    }
  }
  
  /**
   * Create Ghost Orb - floating glowing sphere
   */
  createGhostOrb(entity) {
    const group = new THREE.Group();
    
    // Core wireframe skirt
    const coreGeometry = new THREE.IcosahedronGeometry(0.3, 1);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    // Inner glow sphere
    const innerGlowGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const innerGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.8
    });
    const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    group.add(innerGlow);
    
    // Glow halo
    const haloGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ddff,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    group.add(halo);
    
    group.userData.type = 'GHOST_ORB';
    group.userData.floatAmplitude = Math.random() * 0.5;
    group.userData.floatSpeed = 0.5 + Math.random() * 1.5;
    group.userData.floatTime = 0;
    
    return group;
  }
  
  /**
   * Create AI Spectre - thin holographic silhouette
   */
  createAISpectre(entity) {
    const group = new THREE.Group();

    // Vertical hologram body
    const torusGeometry = new THREE.TorusGeometry(0.3, 0.03, 8, 32);
    const torusMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0088,
      transparent: true,
      opacity: 0.3
    });
    const body = new THREE.Mesh(torusGeometry, torusMaterial);
    body.rotation.x = Math.PI / 2;
    body.position.y = 0.3;
    group.add(body);

    // Scanline overlay
    const scanlineGeometry = new THREE.PlaneGeometry(0.8, 2);
    const scanlineMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0088,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide
    });
    const scanline = new THREE.Mesh(scanlineGeometry, scanlineMaterial);
    scanline.name = 'scanline';
    scanline.position.y = 1.0;
    group.add(scanline);

    group.userData.type = 'AI_SPECTRE';
    group.userData.glitchTimer = 0;
    group.userData.glitchIntensity = 0;
    group.userData.body = body;
    return group;
  }
  
  /**
   * Create Fragment Swarm - geometric shards
   */
  createFragmentSwarm(entity) {
    const SHAPES = {
      TETRAHEDRON: 0,
      OCTAHEDRON: 1,
      DODECAHEDRON: 2
    };

    const group = new THREE.Group();
    const fragmentCount = 20;
    entity.trailParticles = Array.from({ length: fragmentCount }, () => []);
    this.entityTrailParticles[entity.id] = entity.trailParticles;

    for (let i = 0; i < fragmentCount; i++) {
      let geometry;
      const shapeType = Math.floor(Math.random() * 3);
      const size = 0.08 + Math.random() * 0.15;

      switch (shapeType) {
        case SHAPES.OCTAHEDRON:
          geometry = new THREE.OctahedronGeometry(size, 0);
          break;
        case SHAPES.DODECAHEDRON:
          geometry = new THREE.DodecahedronGeometry(size * 0.8, 0);
          break;
        default:
          geometry = new THREE.TetrahedronGeometry(size, 0);
          break;
      }

      const distFactor = Math.random();
      const colorHex = this.lerpColor(0xaaff00, 0xffff00, distFactor);
      const material = new THREE.MeshBasicMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.7,
        wireframe: false
      });
      const fragment = new THREE.Mesh(geometry, material);

      fragment.position.set(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );

      fragment.userData.basePos = fragment.position.clone();
      fragment.userData.orbitSpeed = 0.5 + Math.random() * 3.0;
      fragment.userData.orbitRadius = 1.0 + Math.random() * 1.5;
      fragment.userData.orbitPhase = Math.random() * Math.PI * 2;
      fragment.userData.orbitTilt = (Math.random() - 0.5) * 0.5;

      group.add(fragment);
    }

    group.userData.type = 'FRAGMENT_SWARM';
    group.userData.orbitTime = Math.random() * Math.PI * 2;
    group.userData.trailContainer = this.createTrailParticles(entity);
    group.add(group.userData.trailContainer);

    return group;
  }
  
  createTrailParticles(entity) {
    const trailContainer = new THREE.Group();
    trailContainer.userData.isTrailContainer = true;

    const particleGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    for (let i = 0; i < 20; i++) {
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.0
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.visible = false;
      particle.userData = { active: false, age: 0 };
      trailContainer.add(particle);
    }

    return trailContainer;
  }

  createWispTrailContainer(entity, streamCount) {
    const trailContainer = new THREE.Group();
    trailContainer.userData.isWispTrailContainer = true;

    const particleGeometry = new THREE.SphereGeometry(0.03, 8, 8);
    for (let streamIndex = 0; streamIndex < streamCount; streamIndex++) {
      for (let trailIndex = 0; trailIndex < 6; trailIndex++) {
        const particleMaterial = new THREE.MeshBasicMaterial({
          color: 0x99ffff,
          transparent: true,
          opacity: 0.0,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.visible = false;
        particle.userData = { streamIndex, trailIndex, age: 0 };
        trailContainer.add(particle);
      }
    }

    return trailContainer;
  }

  lerpColor(a, b, t) {
    const colorA = new THREE.Color(a);
    const colorB = new THREE.Color(b);
    return colorA.lerp(colorB, t).getHex();
  }

  createEdgeGlow(geometry, color) {
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.4
    });
    return new THREE.LineSegments(edges, lineMaterial);
  }

  perlinNoise(x, y, z) {
    return Math.sin(x) * Math.cos(y) * Math.sin(z);
  }

  /**
   * Create Sigma Phantom - pixelated humanoid outline
   */
  createSigmaPhantom(entity) {
    const group = new THREE.Group();
    
    // Pixelated body made of boxes
    const pixelSize = 0.5;
    const material = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.3,
      wireframe: false
    });

    // Head
    const headGeo = new THREE.BoxGeometry(pixelSize, pixelSize, pixelSize);
    const head = new THREE.Mesh(headGeo, material.clone());
    head.position.y = 1.5;
    head.name = 'head';
    group.add(head);

    // Body
    const bodyGeo = new THREE.BoxGeometry(pixelSize * 0.8, pixelSize * 2.0, pixelSize);
    const body = new THREE.Mesh(bodyGeo, material.clone());
    body.position.y = 0.3;
    body.name = 'body';
    group.add(body);

    // Arms
    for (let side of [-1, 1]) {
      const armGeo = new THREE.BoxGeometry(pixelSize * 0.4, pixelSize * 1.2, pixelSize);
      const arm = new THREE.Mesh(armGeo, material.clone());
      arm.position.set(side * 0.7, -0.3, 0);
      arm.name = side === -1 ? 'leftArm' : 'rightArm';
      group.add(arm);
    }

    // Legs
    for (let side of [-1, 1]) {
      const legGeo = new THREE.BoxGeometry(pixelSize * 0.3, pixelSize * 1.2, pixelSize);
      const leg = new THREE.Mesh(legGeo, material.clone());
      leg.position.set(side * 0.25, -0.9, 0);
      leg.name = side === -1 ? 'leftLeg' : 'rightLeg';
      group.add(leg);
    }

    const parts = ['head', 'body', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
    parts.forEach((partName) => {
      const part = group.getObjectByName(partName);
      if (part) {
        const glow = this.createEdgeGlow(part.geometry, 0xff00ff);
        glow.name = `${partName}_glow`;
        part.add(glow);
      }
    });

    group.userData.type = 'SIGMA_PHANTOM';
    group.userData.glitchTimer = Math.random() * 2;
    group.userData.noiseOffset = Math.random() * 1000;
    group.userData.noiseScale = 10.0;
    group.userData.fadeCycleTime = 0;
    group.userData.fadeDuration = 3.0;
    
    return group;
  }
  
  /**
   * Create Quantum Wisp - ribbon-like energy streak
   */
  createQuantumWisp(entity) {
    const group = new THREE.Group();
    const streamCount = 5;
    entity.streamTrails = Array.from({ length: streamCount }, () => []);
    entity.streamCurves = [];

    const basePoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.5, 0.3, 0.2),
      new THREE.Vector3(1, 0.5, -0.3),
      new THREE.Vector3(1.2, 0, -0.8)
    ];

    for (let i = 0; i < streamCount; i++) {
      const offset = (i - 2) * 0.15;
      const curve = new THREE.CatmullRomCurve3([
        basePoints[0].clone(),
        basePoints[1].clone().add(new THREE.Vector3(0, 0, offset * 0.4)),
        basePoints[2].clone().add(new THREE.Vector3(0, 0, offset * 0.6)),
        basePoints[3].clone().add(new THREE.Vector3(0, 0, offset * 0.8))
      ]);
      entity.streamCurves.push(curve);

      const points = curve.getPoints(30);
      const positions = [];
      const colors = [];
      const streamColor = new THREE.Color(this.lerpColor(0x00ffff, 0xff00ff, i / (streamCount - 1)));

      points.forEach((point, index) => {
        positions.push(point.x, point.y, point.z);
        const centerProgress = Math.abs(index - (points.length - 1) / 2) / ((points.length - 1) / 2);
        const brighten = 0.25 + (1.0 - centerProgress) * 0.25;
        const vertexColor = streamColor.clone().lerp(new THREE.Color(0xffffff), brighten);
        colors.push(vertexColor.r, vertexColor.g, vertexColor.b);
      });

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.75 - Math.abs(offset) * 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const line = new THREE.Line(geometry, material);
      line.userData.streamIndex = i;
      line.userData.curve = curve;
      line.userData.offset = offset;
      line.userData.baseOpacity = material.opacity;
      line.userData.originalOpacity = material.opacity;
      group.add(line);
    }

    // Add ribbon-like planes
    const ribbonGeo = new THREE.PlaneGeometry(0.3, 2);
    for (let i = 0; i < 2; i++) {
      const ribbonMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
      ribbon.rotation.y = Math.PI * 0.5 + i * 0.4;
      ribbon.position.x = (i === 0 ? -0.1 : 0.1);
      ribbon.userData.originalOpacity = ribbonMat.opacity;
      group.add(ribbon);
    }

    group.userData.type = 'QUANTUM_WISP';
    group.userData.waveTime = 0;
    group.userData.streamCount = streamCount;
    group.userData.trailContainer = this.createWispTrailContainer(entity, streamCount);
    group.add(group.userData.trailContainer);

    return group;
  }
  
  /**
   * Update all active entities
   */
  updateAllEntities(deltaTime) {
    const entities = this.registry.getAllEntities();
    
    for (let entity of entities) {
      // Update age and check lifetime
      const expired = this.registry.updateEntityAge(entity.id, deltaTime);
      if (expired) {
        continue;
      }
      
      // Update position based on velocity
      entity.position.x += entity.velocity.x * deltaTime;
      entity.position.y += entity.velocity.y * deltaTime;
      entity.position.z += entity.velocity.z * deltaTime;
      
      // Apply subtle forces based on world state
      this.applyWorldForces(entity, deltaTime);
      
      // Update mesh position
      const mesh = this.entityMeshes[entity.id];
      if (mesh) {
        mesh.position.copy(entity.position);
      }
    }
  }
  
  /**
   * Apply forces from world systems (read-only)
   */
  applyWorldForces(entity, deltaTime) {
    // Weather wind effect
    const activeWeather = this.worldSystems.weatherPack?.getActiveWeather?.();
    if (activeWeather && activeWeather.length > 0) {
      const weather = activeWeather[0];
      if (weather.windVector) {
        entity.velocity.x += weather.windVector.x * 0.01;
        entity.velocity.z += weather.windVector.z * 0.01;
      }
    }
    
    // Legendary node attraction (read-only)
    const legendaryNodes = this.worldSystems.legendaryPack?.getLegendaryNodes?.();
    if (legendaryNodes && legendaryNodes.length > 0) {
      const nearestLegendary = legendaryNodes[0];
      if (nearestLegendary && nearestLegendary.position) {
        const dx = nearestLegendary.position.x - entity.position.x;
        const dy = nearestLegendary.position.y - entity.position.y;
        const dz = nearestLegendary.position.z - entity.position.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (dist < 20 && dist > 0.1) {
          const strength = 0.02 * (1 - dist / 20);
          entity.velocity.x += (dx / dist) * strength;
          entity.velocity.y += (dy / dist) * strength;
          entity.velocity.z += (dz / dist) * strength;
        }
      }
    }
    
    // World events intensity modulation
    const activeEvents = this.worldSystems.worldEvents?.getActiveEvents?.();
    if (activeEvents && activeEvents.length > 0) {
      entity.intensity = 0.7 + Math.random() * 0.3;
    }
  }
  
  /**
   * Update entity visual effects
   */
  updateEntityVisuals(deltaTime) {
    const entities = this.registry.getAllEntities();
    
    for (let entity of entities) {
      const mesh = this.entityMeshes[entity.id];
      if (!mesh) continue;
      
      // Get fade progress
      const fadeProgress = this.registry.getFadeProgress(entity.id);
      
      // Update based on type
      switch (entity.type) {
        case this.registry.TYPES.GHOST_ORB:
          this.updateGhostOrbVisuals(mesh, entity, fadeProgress, deltaTime);
          break;
        case this.registry.TYPES.AI_SPECTRE:
          this.updateSpectreVisuals(mesh, entity, fadeProgress, deltaTime);
          break;
        case this.registry.TYPES.FRAGMENT_SWARM:
          this.updateSwarmVisuals(mesh, entity, fadeProgress, deltaTime);
          break;
        case this.registry.TYPES.SIGMA_PHANTOM:
          this.updatePhantomVisuals(mesh, entity, fadeProgress, deltaTime);
          break;
        case this.registry.TYPES.QUANTUM_WISP:
          this.updateWispVisuals(mesh, entity, fadeProgress, deltaTime);
          break;
      }
      
      // Apply fade
      mesh.traverse((child) => {
        if (child.material && child.material.transparent) {
          const originalOpacity = child.userData.originalOpacity || 1.0;
          child.material.opacity = originalOpacity * (1 - fadeProgress);
        }
      });
    }
  }
  
  /**
   * Update Ghost Orb visuals
   */
  updateGhostOrbVisuals(mesh, entity, fadeProgress, deltaTime) {
    const time = Date.now() * 0.001;
    mesh.userData.floatTime = (mesh.userData.floatTime || 0) + deltaTime;
    
    // Float up / wobble
    const floatOffset = Math.sin(mesh.userData.floatTime * mesh.userData.floatSpeed)
      * mesh.userData.floatAmplitude;
    const wobble = Math.sin(mesh.userData.floatTime * 2.5) * 0.08;
    mesh.position.y = entity.position.y + floatOffset + wobble;
    
    // Rotate gently
    mesh.rotation.y += deltaTime * 0.3;
    
    // Color shift over time
    const colorTime = Date.now() * 0.0003;
    const hue = colorTime % 1.0;
    const color = new THREE.Color().setHSL(hue, 1.0, 0.5);
    if (mesh.children[0]?.material) {
      mesh.children[0].material.color.copy(color);
    }
    if (mesh.children[2]?.material) {
      mesh.children[2].material.color.copy(color);
    }
    
    // Inner pulse
    const pulseTime = Date.now() * 0.002;
    const pulse = 0.5 + 0.5 * Math.sin(pulseTime);
    if (mesh.children[1]?.material) {
      mesh.children[1].material.opacity = 0.6 + pulse * 0.4;
    }
    if (mesh.children[0]) {
      const pulseScale = 1 + pulse * 0.1;
      mesh.children[0].scale.setScalar(pulseScale);
    }
    
    // Fade visibility
    mesh.children.forEach((child) => {
      if (child.material && child.material.transparent) {
        const originalOpacity = child.userData.originalOpacity || child.material.opacity;
        child.material.opacity = originalOpacity * (1 - fadeProgress);
      }
    });
  }
  
  /**
   * Update AI Spectre visuals
   */
  updateSpectreVisuals(mesh, entity, fadeProgress, deltaTime) {
    mesh.userData.glitchTimer += deltaTime;

    // Scanline sweep
    const scanline = mesh.getObjectByName('scanline');
    if (scanline) {
      const scanTime = (Date.now() * 0.001) % 2.0;
      const scanY = 1.0 - scanTime * 1.0;
      scanline.position.y = scanY;
      const edgeFade = Math.min(1, Math.min(scanTime, 2 - scanTime) / 0.5);
      scanline.material.opacity = 0.1 * edgeFade * entity.intensity;
    }

    // Chromatic glitch effect
    if (Math.random() < 0.02) {
      const offset = (Math.random() - 0.5) * 0.5;
      const body = mesh.userData.body || mesh.children[0];
      if (body) {
        body.position.x = offset;
        if (!mesh.userData.chromaClone) {
          const clone = body.clone();
          clone.material = body.material.clone();
          clone.material.color.setHex(0x0088ff);
          clone.material.opacity = 0.2;
          clone.userData.isChroma = true;
          mesh.add(clone);
          mesh.userData.chromaClone = clone;
        }
        if (mesh.userData.chromaClone) {
          mesh.userData.chromaClone.position.x = -offset * 1.5;
        }
        setTimeout(() => {
          if (mesh.userData && mesh.userData.chromaClone) {
            mesh.remove(mesh.userData.chromaClone);
            mesh.userData.chromaClone = null;
          }
          if (body) {
            body.position.x = 0;
          }
        }, 50);
      }
    }

    mesh.userData.glitchIntensity *= 0.95;

    // Flicker with gradient noise
    const flickerBase = 0.05;
    const flickerSpeed = 8;
    const flickerRange = 0.08;
    const flicker = flickerBase + Math.sin(mesh.userData.glitchTimer * flickerSpeed) * flickerRange;
    const noiseFlicker = Math.random() * 0.03;
    mesh.traverse((child) => {
      if (child.material && child.material.opacity !== undefined && !child.userData.isChroma) {
        child.material.opacity = (0.1 + flicker + noiseFlicker) * entity.intensity * (1 - fadeProgress);
      }
    });
  }
  
  /**
   * Update Fragment Swarm visuals
   */
  updateSwarmVisuals(mesh, entity, fadeProgress, deltaTime) {
    mesh.userData.orbitTime += deltaTime;
    const time = mesh.userData.orbitTime;
    const fragments = mesh.children.filter(child => !child.userData.isTrailContainer);
    const trailContainer = mesh.userData.trailContainer;
    const trailParticles = entity.trailParticles || [];
    const TRAIL_LENGTH = 8;
    const TRAIL_LIFETIME = 0.3;

    fragments.forEach((fragment, i) => {
      const basePos = fragment.userData.basePos;
      const orbitSpeed = fragment.userData.orbitSpeed;
      const orbitRadius = fragment.userData.orbitRadius;
      const orbitPhase = fragment.userData.orbitPhase;
      const tilt = fragment.userData.orbitTilt;

      fragment.position.x = basePos.x + Math.sin(time * orbitSpeed + orbitPhase) * orbitRadius;
      fragment.position.z = basePos.z + Math.cos(time * orbitSpeed + orbitPhase) * orbitRadius;
      fragment.position.y = basePos.y + Math.sin(time * orbitSpeed * 0.7 + orbitPhase) * orbitRadius * tilt;

      fragment.rotation.x += deltaTime * 0.5;
      fragment.rotation.y += deltaTime * 0.7;

      const trail = trailParticles[i];
      if (Array.isArray(trail)) {
        trail.push({ pos: fragment.position.clone(), age: 0 });
        while (trail.length > TRAIL_LENGTH) {
          trail.shift();
        }
      }

      const ageFactor = 1.0 - (entity.age / entity.maxLifetime);
      if (fragment.material && fragment.material.opacity !== undefined) {
        fragment.material.opacity = 0.7 * ageFactor * entity.intensity;
      }
    });

    if (trailContainer && trailContainer.children.length > 0) {
      let particleIndex = 0;
      for (const trail of trailParticles) {
        for (const point of trail) {
          point.age += deltaTime;
        }
        while (trail.length > 0 && trail[0].age > TRAIL_LIFETIME) {
          trail.shift();
        }
        for (const point of trail) {
          if (particleIndex >= trailContainer.children.length) break;
          const particle = trailContainer.children[particleIndex];
          particle.visible = true;
          particle.position.copy(point.pos);
          const life = Math.max(0, 1 - point.age / TRAIL_LIFETIME);
          particle.material.opacity = 0.3 * life * entity.intensity;
          particle.scale.setScalar(0.02 * (0.5 + life * 0.5));
          particleIndex += 1;
        }
      }
      for (; particleIndex < trailContainer.children.length; particleIndex++) {
        const particle = trailContainer.children[particleIndex];
        particle.visible = false;
      }
    }
  }
  
  /**
   * Update Sigma Phantom visuals
   */
  updatePhantomVisuals(mesh, entity, fadeProgress, deltaTime) {
    mesh.userData.glitchTimer += deltaTime;
    mesh.userData.fadeCycleTime = (mesh.userData.fadeCycleTime || 0) + deltaTime;

    // Random glitch teleport
    if (Math.random() < 0.03) {
      const offset = (Math.random() - 0.5) * 0.5;
      mesh.position.x += offset;
    }

    // Hologram noise opacity
    const noise = this.perlinNoise(
      mesh.position.x * mesh.userData.noiseScale,
      mesh.position.z * mesh.userData.noiseScale,
      Date.now() * 0.001 + mesh.userData.noiseOffset
    );
    const noiseOpacity = 0.2 + noise * 0.15;

    // Periodic fade cycle
    const fadePhase = (mesh.userData.fadeCycleTime % mesh.userData.fadeDuration) / mesh.userData.fadeDuration;
    let fadeMultiplier = 1.0;
    if (fadePhase < 0.3) {
      fadeMultiplier = fadePhase / 0.3;
    } else if (fadePhase > 0.7) {
      fadeMultiplier = (1.0 - fadePhase) / 0.3;
    }

    const flickerBase = 0.05;
    const flickerSpeed = 8;
    const flickerRange = 0.08;
    const flicker = flickerBase + Math.sin(mesh.userData.glitchTimer * flickerSpeed) * flickerRange;
    const noiseFlicker = Math.random() * 0.03;

    mesh.traverse((child) => {
      if (child.material && child.material.opacity !== undefined && !child.name.includes('_glow')) {
        child.material.opacity = (noiseOpacity + flicker + noiseFlicker) * entity.intensity * (1 - fadeProgress) * fadeMultiplier;
      }
    });
  }
  
  /**
   * Update Quantum Wisp visuals
   */
  updateWispVisuals(mesh, entity, fadeProgress, deltaTime) {
    mesh.userData.waveTime += deltaTime;
    const waveTime = Date.now() * 0.001;

    mesh.children.forEach((child) => {
      if (child.userData.streamIndex !== undefined) {
        const offset = (child.userData.streamIndex - 2) * 0.15;

        // Wave motion
        child.position.y = Math.sin(waveTime + offset * 5) * 0.1;
        child.rotation.z = Math.sin(waveTime * 2 + offset * 3) * 0.01;

        // Scale pulse
        const pulse = 1 + Math.sin(waveTime * 3 + offset * 2) * 0.15;
        child.scale.set(1, pulse, 1);

        // Color shift
        const hueShift = Math.sin(waveTime + offset * 2) * 0.1;
        const baseHue = 0.5;
        const newColor = new THREE.Color().setHSL(baseHue + hueShift, 1.0, 0.5);
        if (child.material && child.material.color) {
          child.material.color.copy(newColor);
        }

        if (child.material && child.material.opacity !== undefined) {
          const baseOpacity = child.userData.baseOpacity || 0.7;
          child.material.opacity = baseOpacity * (1 - fadeProgress) * entity.intensity;
        }

        const streamIndex = child.userData.streamIndex;
        const trail = entity.streamTrails?.[streamIndex];
        if (Array.isArray(trail) && child.userData.curve) {
          trail.push({ pos: child.userData.curve.getPoint(Math.random()), age: 0 });
          while (trail.length > 5) {
            trail.shift();
          }
        }
      }
    });

    const trailContainer = mesh.userData.trailContainer;
    if (trailContainer && Array.isArray(entity.streamTrails)) {
      let particleIndex = 0;
      const TRAIL_LIFETIME = 0.2;

      for (let streamIndex = 0; streamIndex < entity.streamTrails.length; streamIndex++) {
        const trail = entity.streamTrails[streamIndex];
        if (!Array.isArray(trail)) continue;

        for (const point of trail) {
          point.age += deltaTime;
        }
        while (trail.length > 0 && trail[0].age > TRAIL_LIFETIME) {
          trail.shift();
        }

        for (const point of trail) {
          if (particleIndex >= trailContainer.children.length) break;
          const particle = trailContainer.children[particleIndex];
          particle.visible = true;
          particle.position.copy(point.pos);
          const life = Math.max(0, 1 - point.age / TRAIL_LIFETIME);
          particle.material.opacity = 0.25 * life * entity.intensity * (1 - fadeProgress);
          particle.scale.setScalar(0.04 * (0.5 + life * 0.5));
          particleIndex += 1;
        }
      }

      for (; particleIndex < trailContainer.children.length; particleIndex++) {
        const particle = trailContainer.children[particleIndex];
        particle.visible = false;
      }
    }

    // Random warp when near legendary nodes
    const legendaryNodes = this.worldSystems.legendaryPack?.getLegendaryNodes?.();
    if (legendaryNodes && legendaryNodes.length > 0) {
      const nearest = legendaryNodes[0];
      if (nearest && nearest.position) {
        const dist = mesh.position.distanceTo(nearest.position);
        if (dist < 15) {
          mesh.scale.y = 1 + Math.sin(waveTime * 3) * 0.2;
        }
      }
    }
  }
  
  /**
   * Clean up despawned entities
   */
  cleanupDespawnedEntities() {
    for (let id in this.registry.entities) {
      const entity = this.registry.entities[id];
      if (!entity.isActive) {
        const mesh = this.entityMeshes[id];
        if (mesh && mesh.parent) {
          mesh.parent.remove(mesh);
        }
        delete this.entityMeshes[id];
        delete this.registry.entities[id];
      }
    }
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return this.registry.getStats();
  }
  
  /**
   * Reset all entities
   */
  reset() {
    this.registry.clearAll();
    this.entityMeshes = {};
    this.entityParticles = {};
    this.interpretationAccumulator = this.interpretationInterval;
    this.refreshAmbientInterpretation();
  }
}
