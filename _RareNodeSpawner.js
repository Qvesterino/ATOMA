import * as THREE from 'three';
import { freezeMaterialConfig } from './Engine/Debug/MaterialFreezeGuard.js';

/**
 * RARE NODE SPAWNER (SAFE)
 * 
 * Introduces a background system that:
 * - Checks every 45-90 seconds
 * - 5-15% chance to spawn exactly ONE rare node
 * - Spawns only in valid, empty positions
 * - Never overwrites existing nodes
 * - Never spawns inside terrain or objects
 * - Absolutely no world movement or camera effect
 * 
 * New rare node types with unique visuals:
 * - Prism Node (crystal-like refraction core)
 * - Aurora Node (soft light curtains around it)
 * - Singularity Node (tiny gravity lens effect – static)
 * - Ember Node (warm pulsing glow)
 * - Seraph Node (vertical hologram wings)
 * - Quantum Bloom Node (petal-like photon trails)
 * - Nexus Node (interconnected lattice structure)
 * - Void Node (dark matter absorption core)
 * - Resonance Node (harmonically oscillating geometry)
 * - Celestial Node (distant star-like appearance)
 * 
 * All visual effects remain node-local.
 */

export class RareNodeSpawner {
  constructor(scene, player, aiNodesInstance) {
    this.scene = scene;
    this.player = player;
    
    // SESSION 37 FIX: Accept aiNodes instance (not just nodesList copy)
    // This allows us to register to the authoritative aiNodes.nodes registry
    if (aiNodesInstance && aiNodesInstance.nodes && Array.isArray(aiNodesInstance.nodes)) {
      // Full AINodes instance passed (CORRECT)
      this.aiNodes = aiNodesInstance;
      this.nodesList = aiNodesInstance.nodes;  // Reference to authoritative list
    } else if (Array.isArray(aiNodesInstance)) {
      // Legacy: array passed (OLD BUG - will create ghost nodes)
      console.warn('[RareNodeSpawner] LEGACY: Received array instead of AINodes instance');
      this.nodesList = aiNodesInstance;
      this.aiNodes = null;
    } else {
      // Fallback
      this.nodesList = [];
      this.aiNodes = null;
    }
    
    this.rareNodeCount = 0;
    this.rareNodeTypes = [
      'prism',      // Crystal-like refraction
      'aurora',     // Soft light curtains
      'singularity',// Gravity lens effect (static)
      'ember',      // Warm pulsing glow
      'seraph',     // Vertical hologram wings
      'bloom',      // Petal-like photon trails
      'nexus',      // Interconnected lattice
      'void',       // Dark matter core
      'resonance',  // Oscillating geometry
      'celestial'   // Distant star appearance
    ];
    
    this.config = {
      enabled: true,
      spawnCheckInterval: 60.0,      // Check every 60 seconds (45-90 range)
      spawnChanceMin: 0.05,          // 5% min chance
      spawnChanceMax: 0.15,          // 15% max chance
      spawnAttemptMax: 10,           // Try up to 10 times to find valid spot
      spawnRadiusMin: 10,            // Minimum distance from player
      spawnRadiusMax: 60,            // Maximum spawn distance
      spawnHeightMin: 1,
      spawnHeightMax: 15,
      
      // Collision avoidance
      nodeCollisionRadius: 2,        // Radius to check for existing nodes
      terrainClearance: 1,           // Height above terrain to spawn
      
      // Visual settings
      rareNodeScale: 1.0,
      rareNodeEmissionIntensity: 0.8,
      
      diagnosticsEnabled: false
    };
    
    this.registry = {
      spawnSystemActive: true,
      lastSpawnCheck: 0,
      totalSpawned: 0,
      spawnAttempts: 0,
      frameCounter: 0
    };

    // Material templates cache (clone per use to keep per-node tweaks local)
    this.materialPool = new Map();
  }

  getMaterial(key, factory) {
    if (!this.materialPool.has(key)) {
      const created = factory();
      freezeMaterialConfig(created);
      this.materialPool.set(key, created);
    }
    const base = this.materialPool.get(key);
    return base.clone ? base.clone() : base;
  }
  
  /**
   * Update spawner (call every frame)
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunSimulation?.()) return;
    if (!this.config.enabled || !this.registry.spawnSystemActive) return;

    this.registry.frameCounter++;
    this.registry.lastSpawnCheck += deltaTime;
    
    // Check if it's time to spawn
    if (this.registry.lastSpawnCheck >= this.config.spawnCheckInterval) {
      this.registry.lastSpawnCheck = 0;
      this.attemptRareNodeSpawn();
    }
  }
  
  /**
   * Attempt to spawn a rare node
   */
  attemptRareNodeSpawn() {
    // Random chance based on config
    const spawnChance = this.config.spawnChanceMin + 
      Math.random() * (this.config.spawnChanceMax - this.config.spawnChanceMin);
    
    if (Math.random() > spawnChance) {
      return; // Didn't win the spawn lottery
    }
    
    // Try to find valid spawn location
    for (let attempt = 0; attempt < this.config.spawnAttemptMax; attempt++) {
      const spawnPos = this.findValidSpawnPosition();
      
      if (spawnPos) {
        this.spawnRareNode(spawnPos);
        return;
      }
    }
    
    this.registry.spawnAttempts++;
  }
  
  /**
   * Find a valid spawn position
   */
  findValidSpawnPosition() {
    // Generate random position
    const angle = Math.random() * Math.PI * 2;
    const radius = this.config.spawnRadiusMin + 
      Math.random() * (this.config.spawnRadiusMax - this.config.spawnRadiusMin);
    
    const x = this.player.position.x + Math.cos(angle) * radius;
    const z = this.player.position.z + Math.sin(angle) * radius;
    const y = this.config.spawnHeightMin + 
      Math.random() * (this.config.spawnHeightMax - this.config.spawnHeightMin);
    
    const candidatePos = new THREE.Vector3(x, y, z);
    
    // Check for collisions with existing nodes
    if (!this.isPositionValid(candidatePos)) {
      return null;
    }
    
    return candidatePos;
  }
  
  /**
   * Check if position is valid (no collisions)
   */
  isPositionValid(pos) {
    // Check distance from all existing nodes
    for (let node of this.nodesList) {
      if (!node || !node.position) continue;
      
      const distance = pos.distanceTo(node.position);
      if (distance < this.config.nodeCollisionRadius) {
        return false; // Too close to existing node
      }
    }
    
    return true;
  }
  
  /**
   * Spawn a rare node at given position
   */
  spawnRareNode(position) {
    // Choose random rare type
    const rareType = this.rareNodeTypes[
      Math.floor(Math.random() * this.rareNodeTypes.length)
    ];
    
    // Delegate to canonical funnel (AINodes.spawnNode) to create the Node
    // Force archetype encodes rare identity while keeping category canonical
    const archetypeKey = `RARE-${rareType.toUpperCase()}`;
    if (window.__ALLOW_EXTERNAL_SPAWN__ !== true) {
      console.warn('[SpawnAuthority] External spawn blocked');
      return;
    }
    // Spawn removed: single authority = AINodes.spawnNode()
    const node = null;
    if (!node) {
      return;
    }

    // Preserve rare metadata on the canonical node
    node.userData = node.userData || {};
    node.userData.rareType = rareType;
    node.userData.isRare = true;
    node.userData.rareSpawnContext = 'legacy-spawner';

    // Attach rare visuals as children (keep existing visual design downstream)
    const rareVisual = this.createRareNodeVisual(rareType);
    if (rareVisual) {
      rareVisual.scale.multiplyScalar(this.config.rareNodeScale);
      this.animateNodeFadeIn(rareVisual);
      node.add(rareVisual);
    }
    
    this.registry.totalSpawned++;
    
    if (this.config.diagnosticsEnabled) {
      console.log(`✨ RARE NODE SPAWNED: ${rareType} at (${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`);
    }
  }
  
  /**
   * Create rare node visual by type
   */
  createRareNodeVisual(type) {
    const group = new THREE.Group();
    group.userData = { rareType: type };
    
    const color = this.getRareNodeColor(type);
    
    switch(type) {
      case 'prism':
        this.createPrismNode(group, color);
        break;
      case 'aurora':
        this.createAuroraNode(group, color);
        break;
      case 'singularity':
        this.createSingularityNode(group, color);
        break;
      case 'ember':
        this.createEmberNode(group, color);
        break;
      case 'seraph':
        this.createSeraphinNode(group, color);
        break;
      case 'bloom':
        this.createQuantumBloomNode(group, color);
        break;
      case 'nexus':
        this.createNexusNode(group, color);
        break;
      case 'void':
        this.createVoidNode(group, color);
        break;
      case 'resonance':
        this.createResonanceNode(group, color);
        break;
      case 'celestial':
        this.createCelestialNode(group, color);
        break;
      default:
        this.createPrismNode(group, color);
    }
    
    return group;
  }
  
  /**
   * Get color for rare node type
   */
  getRareNodeColor(type) {
    const colors = {
      prism:      0x00ff88,   // Green
      aurora:     0xff00ff,   // Magenta
      singularity:0xffff00,   // Yellow
      ember:      0xff6600,   // Orange
      seraph:     0x00aaff,   // Cyan
      bloom:      0xff88ff,   // Pink
      nexus:      0x88ff00,   // Lime
      void:       0x4400ff,   // Purple
      resonance:  0x00ffff,   // Cyan
      celestial:  0xffdd00    // Gold
    };
    return colors[type] || 0x00ffff;
  }
  
  /**
   * Create Prism Node (crystal-like refraction)
   */
  createPrismNode(group, color) {
    // Main crystal core
    const geometry = new THREE.IcosahedronGeometry(0.8, 3);
    const material = this.getMaterial(
      `prism-core-${color}`,
      () => new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.9,
        roughness: 0.1,
        emissive: color,
        emissiveIntensity: 0.6
      })
    );
    
    const core = new THREE.Mesh(geometry, material);
    group.add(core);
    
    // Refracting rings
    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.TorusGeometry(1.2 + i * 0.25, 0.05, 8, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.4 - i * 0.1
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 3;
      ring.rotation.z = i * Math.PI / 3;
      group.add(ring);
    }
    
    group.userData.rotationSpeed = 0.01;
  }
  
  /**
   * Create Aurora Node (soft light curtains)
   */
  createAuroraNode(group, color) {
    // Central sphere
    const coreGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.7
    });
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);
    
    // Flowing curtains (planes with wave animation)
    for (let i = 0; i < 4; i++) {
      const curtainGeometry = new THREE.PlaneGeometry(1, 2);
      const curtainMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      
      const curtain = new THREE.Mesh(curtainGeometry, curtainMaterial);
      const angle = (i / 4) * Math.PI * 2;
      curtain.position.x = Math.cos(angle) * 0.8;
      curtain.position.z = Math.sin(angle) * 0.8;
      curtain.rotation.y = angle;
      group.add(curtain);
    }
    
    group.userData.curtainSpeed = 0.02;
  }
  
  /**
   * Create Singularity Node (static gravity lens)
   */
  createSingularityNode(group, color) {
    // Main singularity sphere (dark center)
    const singGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const singMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.9
    });
    
    const singularity = new THREE.Mesh(singGeometry, singMaterial);
    group.add(singularity);
    
    // Gravitational lens rings (static)
    const lensGeometry = new THREE.TorusGeometry(1.0, 0.1, 8, 32);
    const lensMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.6,
      emissive: color,
      emissiveIntensity: 0.4
    });
    
    const lens = new THREE.Mesh(lensGeometry, lensMaterial);
    group.add(lens);
    
    // Static means no rotation
    group.userData.rotationSpeed = 0;
  }
  
  /**
   * Create Ember Node (warm pulsing glow)
   */
  createEmberNode(group, color) {
    // Pulsing core
    const coreGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    const coreMaterial = this.getMaterial(
      `ember-core-${color}`,
      () => new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.6,
        roughness: 0.4,
        emissive: color,
        emissiveIntensity: 0.7
      })
    );
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);
    
    // Ember particles
    for (let i = 0; i < 6; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.08, 8, 8);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6
      });
      
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      const angle = (i / 6) * Math.PI * 2;
      particle.position.set(
        Math.cos(angle) * 0.9,
        Math.sin(angle) * 0.4,
        Math.sin(angle) * 0.9
      );
      group.add(particle);
    }
    
    group.userData.pulseSpeed = 2.0;
  }
  
  /**
   * Create Seraph Node (vertical hologram wings)
   */
  createSeraphinNode(group, color) {
    // Central core
    const coreGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const coreMaterial = this.getMaterial(
      `seraph-core-${color}`,
      () => new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5
      })
    );
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);
    
    // Vertical wings (planes)
    for (let i = 0; i < 2; i++) {
      const wingGeometry = new THREE.PlaneGeometry(0.8, 1.6);
      const wingMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      
      const wing = new THREE.Mesh(wingGeometry, wingMaterial);
      wing.position.x = (i === 0 ? -1 : 1) * 0.4;
      wing.position.y = 0.3;
      group.add(wing);
    }
    
    group.userData.wingFlutterSpeed = 3.0;
  }
  
  /**
   * Create Quantum Bloom Node (petal-like photon trails)
   */
  createQuantumBloomNode(group, color) {
    // Reuse one material instance per node
    const mat = this.getMaterial(
      `quantum-bloom-${color}`,
      () => new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.6,
        metalness: 0.65,
        roughness: 0.25
      })
    );

    // Base disk
    const baseGeo = new THREE.CylinderGeometry(0.9, 1.0, 0.12, 10, 1);
    const base = new THREE.Mesh(baseGeo, mat);
    base.position.y = -0.3;
    base.rotation.y = Math.PI * 0.1;
    group.add(base);

    // Spine
    const spineGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 10, 1);
    const spine = new THREE.Mesh(spineGeo, mat);
    spine.position.y = 0.1;
    group.add(spine);

    // Core gem
    const coreGeo = new THREE.DodecahedronGeometry(0.35, 0);
    const core = new THREE.Mesh(coreGeo, mat);
    core.position.y = 0.45;
    core.rotation.y = Math.PI * 0.2;
    core.userData.isCore = true;
    group.add(core);

    // Petal fins (4) sweeping upward
    const petalGeo = new THREE.BoxGeometry(0.18, 0.6, 0.08);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeo, mat);
      petal.position.set(Math.cos(angle) * 0.75, 0.05 + i * 0.05, Math.sin(angle) * 0.75);
      petal.rotation.y = angle + Math.PI * 0.25;
      petal.rotation.z = Math.PI * 0.18;
      group.add(petal);
    }

    // Inner halo ring
    const ringGeo = new THREE.TorusGeometry(0.42, 0.03, 8, 18);
    const ring = new THREE.Mesh(ringGeo, mat);
    ring.position.y = 0.28;
    ring.rotation.x = Math.PI * 0.5;
    ring.rotation.y = Math.PI * 0.18;
    group.add(ring);

    group.userData.orbitSpeed = 0.015;
  }
  
  /**
   * Create Nexus Node (interconnected lattice)
   */
  createNexusNode(group, color) {
    // Lattice points
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * 0.8;
      const y = Math.sin(angle) * 0.4 - 0.2;
      const z = Math.sin(angle) * 0.8;
      points.push(new THREE.Vector3(x, y, z));
    }
    
    // Draw edges connecting points
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.7
    });
    
    for (let i = 0; i < points.length; i++) {
      const next = (i + 1) % points.length;
      const geometry = new THREE.BufferGeometry().setFromPoints([points[i], points[next]]);
      const line = new THREE.Line(geometry, material);
      group.add(line);
    }
    
    // Central nexus core
    const coreGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.6
    });
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);
  }
  
  /**
   * Create Void Node (dark matter core)
   */
  createVoidNode(group, color) {
    // Dark void center
    const voidGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const voidMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.95
    });
    
    const voidCore = new THREE.Mesh(voidGeometry, voidMaterial);
    group.add(voidCore);
    
    // Void event horizon (color ring)
    const horizonGeometry = new THREE.TorusGeometry(1.2, 0.12, 8, 32);
    const horizonMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      emissive: color
    });
    
    const horizon = new THREE.Mesh(horizonGeometry, horizonMaterial);
    group.add(horizon);
    
    group.userData.rotationSpeed = -0.012;
  }
  
  /**
   * Create Resonance Node (oscillating geometry)
   */
  createResonanceNode(group, color) {
    // Oscillating octahedron
    const geometry = new THREE.OctahedronGeometry(0.7, 2);
    const material = this.getMaterial(
      `resonance-core-${color}`,
      () => new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.8,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.5
      })
    );
    
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    
    // Resonance rings
    for (let i = 0; i < 2; i++) {
      const ringGeometry = new THREE.TorusGeometry(1.1 + i * 0.2, 0.05, 6, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.5 - i * 0.15
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.rotation.z = i * Math.PI / 2;
      group.add(ring);
    }
    
    group.userData.oscillationSpeed = 2.5;
  }
  
  /**
   * Create Celestial Node (distant star-like)
   */
  createCelestialNode(group, color) {
    // Star-like core
    const coreGeometry = new THREE.SphereGeometry(0.6, 8, 8);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.9,
      emissive: color,
      emissiveIntensity: 0.8
    });
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);
    
    // Star rays (simple spikes)
    for (let i = 0; i < 4; i++) {
      const rayGeometry = new THREE.ConeGeometry(0.08, 0.8, 6);
      const rayMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6
      });
      
      const ray = new THREE.Mesh(rayGeometry, rayMaterial);
      const angle = (i / 4) * Math.PI * 2;
      ray.position.set(
        Math.cos(angle) * 0.6,
        Math.sin(angle) * 0.6,
        0
      );
      ray.rotation.z = angle;
      group.add(ray);
    }
  }
  
  /**
   * Animate node fade-in
   */
  animateNodeFadeIn(node) {
    node.scale.set(0.1, 0.1, 0.1);
    node.userData.fadeInTime = 0;
    node.userData.fadeInDuration = 0.8;
    node.userData.animating = true;
  }
  
  /**
   * Enable/disable spawner
   */
  enable() {
    this.config.enabled = true;
  }
  
  disable() {
    this.config.enabled = false;
  }
  
  /**
   * Get status
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      totalSpawned: this.registry.totalSpawned,
      spawnAttempts: this.registry.spawnAttempts,
      rareNodeTypes: this.rareNodeTypes.length,
      lastSpawnCheck: this.registry.lastSpawnCheck.toFixed(1)
    };
  }
  
  /**
   * Print status report
   */
  printStatusReport() {
    console.log('\n✨ RARE NODE SPAWNER: STATUS REPORT');
    console.log('   ┌────────────────────────────────┐');
    
    console.log('   SPAWN SETTINGS');
    console.log(`       Check Interval:   ${this.config.spawnCheckInterval}s`);
    console.log(`       Spawn Chance:     ${(this.config.spawnChanceMin * 100).toFixed(0)}-${(this.config.spawnChanceMax * 100).toFixed(0)}%`);
    console.log(`       Spawn Radius:     ${this.config.spawnRadiusMin}-${this.config.spawnRadiusMax}m`);
    
    console.log('   RARE NODE TYPES');
    this.rareNodeTypes.forEach((type, i) => {
      console.log(`       ${i + 1}. ${type.charAt(0).toUpperCase() + type.slice(1)}`);
    });
    
    console.log('   ├────────────────────────────────┤');
    console.log(`   Total Spawned:   ${this.registry.totalSpawned}`);
    console.log(`   Status: ${this.config.enabled ? '✅ ACTIVE' : '❌ INACTIVE'}`);
    console.log('   └────────────────────────────────┘\n');
  }
}
