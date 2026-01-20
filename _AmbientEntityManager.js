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
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    
    // Registry for all entities
    this.registry = new AmbientEntityRegistry();
    
    // Entity VFX container
    this.vfxContainer = new THREE.Group();
    this.vfxContainer.name = 'AmbientEntities';
    this.scene.add(this.vfxContainer);
    
    // Entity meshes and particles
    this.entityMeshes = {}; // id -> mesh/group
    this.entityParticles = {}; // id -> particles array
    
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
    
    // Main sphere
    const geometry = new THREE.SphereGeometry(0.4, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.6,
      wireframe: false
    });
    const sphere = new THREE.Mesh(geometry, material);
    group.add(sphere);
    
    // Glow halo
    const haloGeometry = new THREE.SphereGeometry(0.6, 8, 8);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ddff,
      emissive: 0x00ddff,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.3,
      wireframe: false
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.scale.z = 0.3;
    group.add(halo);
    
    group.userData.type = 'GHOST_ORB';
    group.userData.floatAmplitude = Math.random() * 0.5;
    group.userData.floatSpeed = 0.5 + Math.random() * 1.5;
    
    return group;
  }
  
  /**
   * Create AI Spectre - thin holographic silhouette
   */
  createAISpectre(entity) {
    const group = new THREE.Group();
    
    // Vertical line spectre made of segments
    const segments = 5;
    const segmentHeight = 2;
    
    for (let i = 0; i < segments; i++) {
      const y = (i - segments / 2) * (segmentHeight / segments);
      const geometry = new THREE.BoxGeometry(0.15, segmentHeight / segments, 0.05);
      const material = new THREE.MeshBasicMaterial({
        color: 0xff0088,
        emissive: 0xff0088,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.1,
        wireframe: false
      });
      const segment = new THREE.Mesh(geometry, material);
      segment.position.y = y;
      group.add(segment);
    }
    
    group.userData.type = 'AI_SPECTRE';
    group.userData.glitchTimer = 0;
    group.userData.glitchIntensity = 0;
    
    return group;
  }
  
  /**
   * Create Fragment Swarm - geometric shards
   */
  createFragmentSwarm(entity) {
    const group = new THREE.Group();
    
    const fragmentCount = 8;
    for (let i = 0; i < fragmentCount; i++) {
      const size = 0.1 + Math.random() * 0.2;
      const geometry = new THREE.TetrahedronGeometry(size, 0);
      const material = new THREE.MeshBasicMaterial({
        color: 0xaaff00,
        emissive: 0xaaff00,
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
      fragment.userData.orbitSpeed = Math.random() * 2;
      
      group.add(fragment);
    }
    
    group.userData.type = 'FRAGMENT_SWARM';
    group.userData.orbitTime = Math.random() * Math.PI * 2;
    
    return group;
  }
  
  /**
   * Create Sigma Phantom - pixelated humanoid outline
   */
  createSigmaPhantom(entity) {
    const group = new THREE.Group();
    
    // Pixelated body made of boxes
    const pixelSize = 0.3;
    
    // Head
    const headGeo = new THREE.BoxGeometry(pixelSize, pixelSize, pixelSize);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.3,
      wireframe: false
    });
    const head = new THREE.Mesh(headGeo, material);
    head.position.y = 1.2;
    group.add(head);
    
    // Body
    const bodyGeo = new THREE.BoxGeometry(pixelSize * 0.8, pixelSize * 1.5, pixelSize);
    const body = new THREE.Mesh(bodyGeo, material.clone());
    body.position.y = 0.3;
    group.add(body);
    
    // Arms
    for (let side of [-1, 1]) {
      const armGeo = new THREE.BoxGeometry(pixelSize * 0.5, pixelSize, pixelSize);
      const arm = new THREE.Mesh(armGeo, material.clone());
      arm.position.set(side * 0.6, 0.5, 0);
      group.add(arm);
    }
    
    group.userData.type = 'SIGMA_PHANTOM';
    group.userData.glitchTimer = Math.random() * 2;
    
    return group;
  }
  
  /**
   * Create Quantum Wisp - ribbon-like energy streak
   */
  createQuantumWisp(entity) {
    const group = new THREE.Group();
    
    // Create ribbon using line segments
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.5, 0.3, 0.2),
      new THREE.Vector3(1, 0.5, -0.3),
      new THREE.Vector3(1.2, 0, -0.8)
    ]);
    
    const points = curve.getPoints(20);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    // MATERIAL SAFETY 4.0: LineBasicMaterial does not support emissive
    const material = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });
    const line = new THREE.Line(geometry, material);
    group.add(line);
    
    // Add ribbon-like planes
    const ribbonGeo = new THREE.PlaneGeometry(0.3, 2);
    const ribbonMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.rotation.y = Math.random() * Math.PI;
    group.add(ribbon);
    
    group.userData.type = 'QUANTUM_WISP';
    group.userData.ribbonRotation = Math.random() * Math.PI * 2;
    group.userData.waveTime = 0;
    
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
    
    // Float up and down
    const floatOffset = Math.sin(mesh.userData.floatTime * mesh.userData.floatSpeed) 
      * mesh.userData.floatAmplitude;
    
    // Rotate gently
    mesh.rotation.y += deltaTime * 0.3;
    
    // Update opacity based on intensity
    mesh.children[0].material.opacity = 0.6 * entity.intensity * (1 - fadeProgress);
    mesh.children[1].material.opacity = 0.3 * entity.intensity * (1 - fadeProgress);
  }
  
  /**
   * Update AI Spectre visuals
   */
  updateSpectreVisuals(mesh, entity, fadeProgress, deltaTime) {
    mesh.userData.glitchTimer += deltaTime;
    
    // Random glitch effect
    if (Math.random() < 0.02) {
      const offset = (Math.random() - 0.5) * 0.3;
      mesh.position.x += offset;
      mesh.userData.glitchIntensity = 0.5;
    }
    
    mesh.userData.glitchIntensity *= 0.95;
    
    // Flicker opacity
    const flicker = 0.05 + Math.sin(mesh.userData.glitchTimer * 5) * 0.05;
    mesh.traverse((child) => {
      if (child.material && child.material.opacity !== undefined) {
        child.material.opacity = (0.1 + flicker) * entity.intensity * (1 - fadeProgress);
      }
    });
  }
  
  /**
   * Update Fragment Swarm visuals
   */
  updateSwarmVisuals(mesh, entity, fadeProgress, deltaTime) {
    mesh.userData.orbitTime += deltaTime;
    
    const time = mesh.userData.orbitTime;
    
    // Orbit fragments around center
    mesh.children.forEach((fragment, i) => {
      const basePos = fragment.userData.basePos;
      const orbitSpeed = fragment.userData.orbitSpeed;
      
      fragment.position.x = basePos.x + Math.sin(time * orbitSpeed) * 0.5;
      fragment.position.z = basePos.z + Math.cos(time * orbitSpeed) * 0.5;
      fragment.position.y = basePos.y + Math.sin(time * orbitSpeed * 0.7) * 0.3;
      
      fragment.rotation.x += deltaTime * 0.5;
      fragment.rotation.y += deltaTime * 0.7;
    });
  }
  
  /**
   * Update Sigma Phantom visuals
   */
  updatePhantomVisuals(mesh, entity, fadeProgress, deltaTime) {
    mesh.userData.glitchTimer += deltaTime;
    
    // Random glitch teleport
    if (Math.random() < 0.03) {
      const offset = (Math.random() - 0.5) * 0.5;
      mesh.position.x += offset;
    }
    
    // Flicker all children
    const glitch = Math.sin(mesh.userData.glitchTimer * 8) > 0.5;
    mesh.traverse((child) => {
      if (child.material && child.material.opacity !== undefined) {
        const targetOpacity = glitch ? 0.1 : 0.3;
        child.material.opacity = targetOpacity * entity.intensity * (1 - fadeProgress);
      }
    });
  }
  
  /**
   * Update Quantum Wisp visuals
   */
  updateWispVisuals(mesh, entity, fadeProgress, deltaTime) {
    mesh.userData.waveTime += deltaTime;
    
    const time = mesh.userData.waveTime;
    
    // Ribbon undulation
    mesh.children.forEach((child) => {
      if (child.rotation) {
        child.rotation.z += Math.sin(time) * 0.02;
      }
    });
    
    // Random warp when near legendary nodes
    const legendaryNodes = this.worldSystems.legendaryPack?.getLegendaryNodes?.();
    if (legendaryNodes && legendaryNodes.length > 0) {
      const nearest = legendaryNodes[0];
      if (nearest && nearest.position) {
        const dist = mesh.position.distanceTo(nearest.position);
        if (dist < 15) {
          mesh.scale.y = 1 + Math.sin(time * 3) * 0.2;
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
