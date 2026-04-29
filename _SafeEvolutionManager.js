import * as THREE from 'three';
import { tagAllowedSphere, clampSphere } from './VisualSpherePolicy.js';

/**
 * SAFE EVOLUTION MANAGER 2.0
 * 
 * ABSOLUTE SAFETY RULES - STRICTLY ENFORCED:
 * - ZERO modifications to Node class
 * - ZERO new fields added to nodes (no node.stage, no node.state, no node.anything)
 * - ZERO modifications to NodeLinkingSystem or animation.js
 * - ZERO function wrapping or patching
 * - All state stored ONLY in external EvolutionRegistry (indexed by node.id)
 * - All VFX completely separate from node meshes (added to scene, not to node)
 * - Read-only access: only reads from node.position, node.uuid, node.userData
 * - All mutations are purely visual, additive overlays
 */

export class SafeEvolutionManager {
  constructor(scene) {
    this.scene = scene;
    
    // EXTERNAL STATE - Never touch node internals
    this.registry = {};
    this.vfxMeshes = {};
    this.nodeLookup = new Map();
    
    // Burst effect pool
    this.burstPool = [];
    this.activeBursts = [];
    
    // Config
    this.config = {
      stageThresholds: [0, 5, 10, 20, 40],     // Thresholds: Stage 0→1→2→3→4
      decayStart: 5.0,                         // Seconds before decay begins
      decayDuration: 7.0,                      // Total decay time
      energyDecayRate: 0.15                    // Per second
    };

    this.vfxOffset = new THREE.Vector3(5, 10, 0);
    this._vfxPosition = new THREE.Vector3();
  }
  
  /**
   * Get a safe, unique node identifier
  * READS ONLY: node.uuid or creates one in userData
  */
  getNodeId(node) {
    if (!node?.userData?.nodeId) {
      throw new Error('[SafeEvolutionManager:getNodeId] Missing canonical nodeId; aborting.');
    }
    return node.userData.nodeId;
  }
  
  /**
   * Register a node for evolution (non-invasive)
   * Called once when node enters scene
   */
  registerNode(node) {
    const nodeId = this.getNodeId(node);
    this.cacheNode(node);
    
    // Skip if already registered
    if (this.registry[nodeId]) return;
    
    // Create external evolution state
    this.registry[nodeId] = {
      stage: 0,
      energy: 0,
      lastUpdateTime: performance.now(),
      inactiveTimer: 0,
      vfxActive: false,
      activeMutations: [],
      burstCooldown: 0
    };
    
    // Create VFX container for this node
    this.vfxMeshes[nodeId] = {
      glowSphere: null,
      coreHologram: null,
      orbitRings: [],
      orbiterParticles: [],
      pulseScale: 1.0,
      colorTint: null
    };
  }
  
  /**
   * Update evolution system (called once per frame)
   * AFTER linkingSystem.update() completes
   */
  update(deltaTime, nodes, linkingSystem) {
    // Ensure all visible nodes are registered
    if (nodes) {
      this.rebuildNodeLookup(nodes);
      nodes.forEach(node => this.registerNode(node));
    }
    
    // Update each registered node
    for (const nodeId in this.registry) {
      const state = this.registry[nodeId];
      const vfx = this.vfxMeshes[nodeId];
      
      // Find node in scene (non-invasive check)
      const node = this.findNodeById(nodeId);
      if (!node) {
        this.unregisterNode(nodeId);
        continue;
      }
      
      // Calculate energy from links (READ ONLY from linkingSystem)
      const linkEnergy = this.calculateLinkEnergy(node, linkingSystem);
      
      // Update energy with decay
      this.updateEnergy(state, linkEnergy, deltaTime);
      
      // Calculate new stage
      const newStage = this.getStage(state.energy);
      
      // Handle stage transition
      if (newStage !== state.stage) {
        this.transitionStage(state, newStage, node, nodeId);
      }
      
      // Update all active VFX animations
      this.updateAllVFX(node, state, vfx, deltaTime);
    }
    
    // Update burst effects
    this.updateBursts(deltaTime);
  }
  
  /**
   * Find node in scene by ID (safe lookup)
   */
  findNodeById(nodeId) {
    const cachedNode = this.nodeLookup.get(nodeId);
    if (this.isSceneAttached(cachedNode)) {
      return cachedNode;
    }

    if (cachedNode) {
      this.nodeLookup.delete(nodeId);
      if (cachedNode.uuid) {
        this.nodeLookup.delete(cachedNode.uuid);
      }
    }

    let found = null;
    this.scene.traverse(obj => {
      if (found) return;
      if (obj.userData && obj.userData.nodeId === nodeId) {
        found = obj;
        return;
      }
      if (obj.uuid === nodeId) {
        found = obj;
      }
    });

    if (found) {
      this.cacheNode(found);
    }

    return found;
  }

  rebuildNodeLookup(nodes) {
    this.nodeLookup.clear();
    nodes.forEach(node => this.cacheNode(node));
  }

  cacheNode(node) {
    if (!node) return;

    const nodeId = node.userData?.nodeId;
    if (nodeId) {
      this.nodeLookup.set(nodeId, node);
    }

    if (node.uuid) {
      this.nodeLookup.set(node.uuid, node);
    }
  }

  getVfxPosition(node) {
    if (!node?.position) return null;
    return this._vfxPosition.copy(node.position).add(this.vfxOffset);
  }

  isSceneAttached(node) {
    if (!node) return false;

    let current = node;
    while (current) {
      if (current === this.scene) return true;
      current = current.parent;
    }
    return false;
  }
  
  /**
   * Calculate energy from node's links (READ ONLY)
   */
  calculateLinkEnergy(node, linkingSystem) {
    if (!linkingSystem || !linkingSystem.links) return 0;
    
    let totalEnergy = 0;
    let linkCount = 0;
    
    // Count all links connected to this node
    linkingSystem.links.forEach(link => {
      // Link is connected to our node?
      if ((link.source === node || link.target === node) && link.glowData) {
        totalEnergy += link.glowData.synergy || 0;
        linkCount++;
      }
    });
    
    // Add traffic bonus
    let trafficBonus = 0;
    linkingSystem.links.forEach(link => {
      if ((link.source === node || link.target === node) && link.traffic) {
        trafficBonus += link.traffic.load || 0;
      }
    });
    
    // Weighted energy calculation
    const avgSynergy = linkCount > 0 ? totalEnergy / linkCount : 0;
    const avgTraffic = linkCount > 0 ? trafficBonus / linkCount : 0;
    
    return (avgSynergy * 10) + (avgTraffic * 5);
  }
  
  /**
   * Update energy with decay mechanics
   */
  updateEnergy(state, linkEnergy, deltaTime) {
    // Energy increases immediately
    if (linkEnergy > state.energy) {
      state.energy = linkEnergy;
      state.inactiveTimer = 0;
    } else {
      // Energy decays after inactivity period
      state.inactiveTimer += deltaTime;
      
      if (state.inactiveTimer > this.config.decayStart) {
        state.energy = Math.max(0, state.energy - this.config.energyDecayRate * deltaTime);
      }
    }
  }
  
  /**
   * Get evolution stage from energy
   */
  getStage(energy) {
    if (energy >= this.config.stageThresholds[4]) return 4;
    if (energy >= this.config.stageThresholds[3]) return 3;
    if (energy >= this.config.stageThresholds[2]) return 2;
    if (energy >= this.config.stageThresholds[1]) return 1;
    return 0;
  }
  
  /**
   * Handle stage transition (applies VFX)
   */
  transitionStage(state, newStage, node, nodeId) {
    const oldStage = state.stage;
    state.stage = newStage;
    
    // Determine which mutations are active for this stage
    this.updateActiveMutations(state, newStage);
    
    // Create visual burst effect on upgrade
    if (newStage > oldStage) {
      this.createStageBurst(node, newStage);
    }
  }
  
  /**
   * Determine which mutations apply at each stage
   */
  updateActiveMutations(state, stage) {
    state.activeMutations = [];
    
    if (stage >= 1) state.activeMutations.push('glow');        // Subtle glow
    if (stage >= 2) state.activeMutations.push('core');        // Inner hologram
    if (stage >= 3) state.activeMutations.push('ring');        // Orbit ring
    if (stage >= 3) state.activeMutations.push('particles');   // Energy sparks
    if (stage >= 4) state.activeMutations.push('pulse');       // Pulsing scale
    if (stage >= 4) state.activeMutations.push('color');       // Color tint
    
    // If back to stage 0, clear all mutations
    if (stage === 0) {
      state.activeMutations = [];
    }
  }
  
  /**
   * Update all active VFX for a node
   */
  updateAllVFX(node, state, vfx, deltaTime) {
    const intensity = Math.min(1, state.stage / 4);
    const color = this.getNodeColor(node);
    
    // Apply each active mutation
    if (state.activeMutations.includes('glow')) {
      this.updateGlow(node, vfx, color, intensity);
    } else {
      this.removeGlow(vfx);
    }
    
    if (state.activeMutations.includes('core')) {
      this.updateCore(node, vfx, color, intensity, deltaTime);
    } else {
      this.removeCore(vfx);
    }
    
    if (state.activeMutations.includes('ring')) {
      this.updateRings(node, vfx, color, intensity, deltaTime);
    } else {
      this.removeRings(vfx);
    }
    
    if (state.activeMutations.includes('particles')) {
      this.updateParticles(node, vfx, color, intensity, deltaTime);
    } else {
      this.removeParticles(vfx);
    }
    
    if (state.activeMutations.includes('pulse')) {
      this.updatePulse(node, vfx, state, intensity, deltaTime);
    } else {
      vfx.pulseScale = 1.0;
    }
    
    if (state.activeMutations.includes('color')) {
      this.updateColor(node, vfx, color, intensity);
    } else {
      this.removeColorTint(vfx);
    }
  }
  
  /**
   * GLOW MUTATION - Soft outer aura
   */
  updateGlow(node, vfx, color, intensity) {
    // SESSION 21 - PHASE 2: Visual Authority Guard
    // Skip if node has no primary visual yet (spawn collision safety)
    if (!node.userData?.visualReady) return;
    
    // Create if needed
    if (!vfx.glowSphere) {
      const geo = new THREE.IcosahedronGeometry(1.3, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        emissive: color,
        emissiveIntensity: 0.4,
        fog: false
      });
      vfx.glowSphere = new THREE.Mesh(geo, mat);
      vfx.glowSphere.userData = { isEvolutionVFX: true };
      this.scene.add(vfx.glowSphere);
    }
    
    // Update position and intensity
    const position = this.getVfxPosition(node);
    if (!position) return;

    vfx.glowSphere.position.copy(position);
    vfx.glowSphere.material.opacity = 0.12 + intensity * 0.18;
    vfx.glowSphere.material.emissiveIntensity = 0.16 + intensity * 0.22;
  }
  
  removeGlow(vfx) {
    if (vfx.glowSphere) {
      this.scene.remove(vfx.glowSphere);
      vfx.glowSphere.geometry.dispose();
      vfx.glowSphere.material.dispose();
      vfx.glowSphere = null;
    }
  }
  
  /**
   * CORE MUTATION - Rotating inner hologram
   */
  updateCore(node, vfx, color, intensity, deltaTime) {
    // SESSION 21 - PHASE 2: Visual Authority Guard
    // Skip if node has no primary visual yet (spawn collision safety)
    if (!node.userData?.visualReady) return;
    
    // Create if needed
    if (!vfx.coreHologram) {
      const geo = new THREE.IcosahedronGeometry(0.35, 3);
      const mat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        emissive: color,
        emissiveIntensity: 0.5,
        fog: false
      });
      vfx.coreHologram = new THREE.Mesh(geo, mat);
      vfx.coreHologram.userData = {
        isEvolutionVFX: true,
        rotationSpeed: 0.8 + Math.random() * 0.4,
        rotationAxis: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize()
      };
      this.scene.add(vfx.coreHologram);
    }
    
    // Update position and appearance
    const position = this.getVfxPosition(node);
    if (!position) return;

    vfx.coreHologram.position.copy(position);
    vfx.coreHologram.material.opacity = 0.18 + intensity * 0.24;
    
    // Rotate
    const axis = vfx.coreHologram.userData.rotationAxis;
    const speed = vfx.coreHologram.userData.rotationSpeed * deltaTime * 0.5;
    const q = new THREE.Quaternion();
    q.setFromAxisAngle(axis, speed);
    vfx.coreHologram.quaternion.multiplyQuaternions(q, vfx.coreHologram.quaternion);
  }
  
  removeCore(vfx) {
    if (vfx.coreHologram) {
      this.scene.remove(vfx.coreHologram);
      vfx.coreHologram.geometry.dispose();
      vfx.coreHologram.material.dispose();
      vfx.coreHologram = null;
    }
  }
  
  /**
   * RING MUTATION - Orbiting rings
   */
  updateRings(node, vfx, color, intensity, deltaTime) {
    // Ensure we have at least one ring
    if (vfx.orbitRings.length === 0) {
      // Create first ring
      const geo = new THREE.TorusGeometry(0.95, 0.03, 12, 64);
      const mat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        emissive: color,
        emissiveIntensity: 0.4,
        fog: false
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.y = Math.random() * Math.PI;
      ring.userData = {
        isEvolutionVFX: true,
        rotationSpeed: 0.5 + Math.random() * 0.5,
        rotationAxis: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize()
      };
      this.scene.add(ring);
      vfx.orbitRings.push(ring);
    }
    
    // Update all rings
    const position = this.getVfxPosition(node);
    if (!position) return;

    vfx.orbitRings.forEach(ring => {
      ring.position.copy(position);
      ring.material.opacity = 0.12 + intensity * 0.18;
      
      // Rotate
      const axis = ring.userData.rotationAxis;
      const speed = ring.userData.rotationSpeed * deltaTime * 0.3;
      const q = new THREE.Quaternion();
      q.setFromAxisAngle(axis, speed);
      ring.quaternion.multiplyQuaternions(q, ring.quaternion);
    });
  }
  
  removeRings(vfx) {
    vfx.orbitRings.forEach(ring => {
      this.scene.remove(ring);
      ring.geometry.dispose();
      ring.material.dispose();
    });
    vfx.orbitRings = [];
  }
  
  /**
   * PARTICLES MUTATION - Orbiting energy sparks
   */
  updateParticles(node, vfx, color, intensity, deltaTime) {
    const particleCount = 4 + Math.floor(intensity * 2);
    const position = this.getVfxPosition(node);
    if (!position) return;
    
    // Add particles if needed
    while (vfx.orbiterParticles.length < particleCount) {
      const idx = vfx.orbiterParticles.length;
      const geo = new THREE.SphereGeometry(0.08, 8, 8);
      const mat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        emissive: color,
        emissiveIntensity: 0.6,
        fog: false
      });
      const particle = new THREE.Mesh(geo, mat);
      tagAllowedSphere(particle, { role: 'vfx', source: 'SafeEvolutionManager.updateParticles' });
      clampSphere(particle);
      particle.userData = {
        isEvolutionVFX: true,
        orbitAngle: (idx / particleCount) * Math.PI * 2,
        orbitRadius: 1.5 + Math.random() * 0.3,
        orbitSpeed: 0.6 + Math.random() * 0.4
      };
      this.scene.add(particle);
      vfx.orbiterParticles.push(particle);
    }
    
    // Remove excess particles
    while (vfx.orbiterParticles.length > particleCount) {
      const p = vfx.orbiterParticles.pop();
      this.scene.remove(p);
      p.geometry.dispose();
      p.material.dispose();
    }
    
    // Update all particles
    vfx.orbiterParticles.forEach((particle, idx) => {
      // Orbit animation
      particle.userData.orbitAngle += particle.userData.orbitSpeed * deltaTime;
      
      const x = Math.cos(particle.userData.orbitAngle) * particle.userData.orbitRadius;
      const z = Math.sin(particle.userData.orbitAngle) * particle.userData.orbitRadius;
      const y = Math.sin(particle.userData.orbitAngle * 0.5) * 0.3;
      
      particle.position.copy(position);
      particle.position.x += x;
      particle.position.y += y;
      particle.position.z += z;
      
      particle.material.opacity = 0.16 + intensity * 0.24;
    });
  }
  
  removeParticles(vfx) {
    vfx.orbiterParticles.forEach(p => {
      this.scene.remove(p);
      p.geometry.dispose();
      p.material.dispose();
    });
    vfx.orbiterParticles = [];
  }
  
  /**
   * PULSE MUTATION - Scale breathing effect
   */
  updatePulse(node, vfx, state, intensity, deltaTime) {
    const pulseSpeed = 1.5 + intensity * 1.0;
    const pulseAmount = 0.08 + intensity * 0.12;
    
    vfx.pulseScale = 1.0 + Math.sin(performance.now() * 0.002 * pulseSpeed) * pulseAmount;
  }
  
  /**
   * COLOR MUTATION - Palette tint
   */
  updateColor(node, vfx, color, intensity) {
    // Store color tint for use by other systems if needed
    vfx.colorTint = color;
  }
  
  removeColorTint(vfx) {
    vfx.colorTint = null;
  }
  
  /**
   * Create burst effect on stage upgrade
   */
  createStageBurst(node, stage) {
    // Shockwave ring
    const geo = new THREE.TorusGeometry(0.5, 0.05, 16, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: this.getNodeColor(node),
      transparent: true,
      emissive: this.getNodeColor(node),
      emissiveIntensity: 0.35,
      fog: false
    });
    
    const burst = new THREE.Mesh(geo, mat);
    const position = this.getVfxPosition(node);
    if (position) {
      burst.position.copy(position);
    }
    burst.userData = {
      isEvolutionVFX: true,
      isStageUpBurst: true,
      startTime: performance.now(),
      duration: 0.3  // 300ms burst
    };
    
    this.scene.add(burst);
    this.activeBursts.push(burst);
  }
  
  /**
   * Update and clean up burst effects
   */
  updateBursts(deltaTime) {
    this.activeBursts = this.activeBursts.filter(burst => {
      const elapsed = (performance.now() - burst.userData.startTime) * 0.001;
      const progress = Math.min(1, elapsed / burst.userData.duration);
      
      // Expand and fade out
      burst.scale.setScalar(0.92 + progress * 1.4);
      burst.material.opacity = 0.72 - progress * 0.72;
      
      // Remove when done
      if (progress >= 1) {
        this.scene.remove(burst);
        burst.geometry.dispose();
        burst.material.dispose();
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Get the primary color for a node (read from existing colors)
   */
  getNodeColor(node) {
    // Try to extract color from node material if it exists
    if (node.material && node.material.color) {
      return node.material.color.clone();
    }
    
    // Fallback: detect from node category in userData
    if (node.userData && node.userData.category) {
      const categoryColors = {
        'input': new THREE.Color(0x00ddff),      // Cyan
        'process': new THREE.Color(0xffaa00),    // Amber
        'integration': new THREE.Color(0x00ff88), // Green
        'analytics': new THREE.Color(0xaa00ff),  // Violet
        'storage': new THREE.Color(0x88ccff),    // Blue
        'control': new THREE.Color(0xff0088)     // Magenta
      };
      return categoryColors[node.userData.category] || new THREE.Color(0x00ccdd);
    }
    
    // Default neon cyan
    return new THREE.Color(0x00ccdd);
  }
  
  /**
   * Unregister node
   */
  unregisterNode(nodeId) {
    const cachedNode = this.nodeLookup.get(nodeId);
    if (cachedNode?.uuid) {
      this.nodeLookup.delete(cachedNode.uuid);
    }
    this.nodeLookup.delete(nodeId);

    // Clean up VFX
    if (this.vfxMeshes[nodeId]) {
      this.removeGlow(this.vfxMeshes[nodeId]);
      this.removeCore(this.vfxMeshes[nodeId]);
      this.removeRings(this.vfxMeshes[nodeId]);
      this.removeParticles(this.vfxMeshes[nodeId]);
      this.removeColorTint(this.vfxMeshes[nodeId]);
      delete this.vfxMeshes[nodeId];
    }
    
    // Clean up state
    delete this.registry[nodeId];
  }
  
  /**
   * Disable all evolution VFX (safe shutdown)
   */
  disableAll() {
    for (const nodeId in this.vfxMeshes) {
      const vfx = this.vfxMeshes[nodeId];
      this.removeGlow(vfx);
      this.removeCore(vfx);
      this.removeRings(vfx);
      this.removeParticles(vfx);
      this.removeColorTint(vfx);
    }
    
    this.activeBursts.forEach(burst => {
      this.scene.remove(burst);
      burst.geometry.dispose();
      burst.material.dispose();
    });
    
    this.registry = {};
    this.vfxMeshes = {};
    this.nodeLookup.clear();
    this.activeBursts = [];
  }
}

