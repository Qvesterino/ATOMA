import * as THREE from 'three';

/**
 * EVOLUTION REGISTRY - External Safe Node Evolution System
 * 
 * COMPLETELY EXTERNAL - Does NOT modify any Node internals
 * - Reads: node.id (unique identifier)
 * - Writes: Only to this.registry and scene VFX objects
 * - Safe: 100% non-destructive, purely cosmetic VFX
 * 
 * Architecture:
 * - EvolutionRegistry[nodeId] = { stage, energy, timers, vfx, flags }
 * - VFX stored separately: meshes added to scene, never to nodes
 * - All mutations are additive overlays that can be completely removed
 * 
 * VISUAL HIERARCHY (Session 18 Audit):
 * - Evolution overlays render as BACKGROUND layer (renderOrder = -1)
 * - All opacities capped to 0.10–0.35 (soft, non-dominant)
 * - Never obscure core geometry or inner structures
 */
export class EvolutionRegistry {
  constructor(scene) {
    this.scene = scene;
    
    // Evolution state per node (indexed by node.userData.id or node.uuid)
    this.registry = {};
    
    // VFX overlays per node (completely separate from node meshes)
    this.vfxOverlays = {};
    
    // Active burst effects
    this.activeBursts = [];
    this.burstPool = [];
    this.maxBurstPoolSize = 20;
    
    // VISUAL HIERARCHY: Opacity caps for evolution overlays (Session 18)
    this.opacityCaps = {
      glowMesh: 0.35,        // Background glow (was 0.3–0.7)
      coreMesh: 0.25,        // Core pulse (was 0.0–0.6)
      ringMeshes: 0.20,      // Orbit rings (was 0.0–0.5)
      burstParticles: 0.45,  // Burst particles (was 0.7 fixed)
    };
    
    // Configuration
    this.config = {
      // Thresholds for stage advancement
      stageThresholds: {
        stage1: 5,      // Minor glow
        stage2: 10,     // Rotating core
        stage3: 20,     // Orbit ring
        stage4: 40      // Full enhancement
      },
      
      // Time-based mechanics
      timers: {
        decayStart: 5.0,      // Seconds before decay begins
        decayDuration: 7.0    // Duration of decay animation
      },
      
      // Energy decay rate (per second)
      energyDecayRate: 0.15
    };
  }
  
  /**
   * Register a node in the evolution system
   * Called when node is created (READ node.id only)
   */
  registerNode(node) {
    const nodeId = this.getNodeId(node);
    
    this.registry[nodeId] = {
      node: node,                    // Reference (read-only)
      stage: 0,                      // Current evolution stage (0-4)
      energy: 0,                     // Accumulated energy (synergy + traffic)
      lastUpdateTime: performance.now(),
      inactiveTime: 0,               // Time since last energy increase
      
      // VFX state (purely visual)
      vfxActive: false,
      activeMutations: [],           // List of active mutation types
      
      // Burst tracking
      lastBurstTime: 0,
      burstCooldown: 300             // ms between bursts
    };
    
    this.vfxOverlays[nodeId] = {
      glowMesh: null,
      coreMesh: null,
      ringMeshes: [],
      particleMeshes: []
    };
  }
  
  /**
   * Unregister a node when it's removed
   */
  unregisterNode(node) {
    const nodeId = this.getNodeId(node);
    this.removeNodeVFX(nodeId);
    delete this.registry[nodeId];
    delete this.vfxOverlays[nodeId];
  }
  
  /**
   * Get safe node identifier (use uuid if available, else use index)
   */
  getNodeId(node) {
    // Use node's UUID if it has one
    if (node.uuid) return node.uuid;
    
    // Otherwise create a consistent ID from userData
    if (!node.userData.id) {
      node.userData.id = `node_${Math.random().toString(36).substr(2, 9)}`;
    }
    return node.userData.id;
  }
  
  /**
   * Update evolution for all registered nodes
   * Called once per frame after main systems update
   */
  update(deltaTime, linkingSystem) {
    // Update energy and stages for all nodes
    for (const nodeId in this.registry) {
      const state = this.registry[nodeId];
      const node = state.node;
      
      // Skip if node was removed from scene
      if (!node.parent) {
        this.unregisterNode(node);
        continue;
      }
      
      // Calculate current energy from links
      const linkEnergy = this.calculateLinkEnergy(node, linkingSystem);
      
      // Update energy (with decay if inactive)
      if (linkEnergy > state.energy) {
        state.energy = linkEnergy;
        state.inactiveTime = 0;  // Reset inactive timer
      } else {
        state.inactiveTime += deltaTime;
        if (state.inactiveTime > this.config.timers.decayStart) {
          state.energy = Math.max(0, state.energy - this.config.energyDecayRate * deltaTime);
        }
      }
      
      // Calculate new stage based on energy
      const newStage = this.calculateStage(state.energy);
      
      // Apply stage transition (triggers VFX)
      if (newStage !== state.stage) {
        this.transitionStage(state, newStage);
      }
      
      // Update VFX animations
      this.updateVFX(state, deltaTime);
    }
    
    // Update burst effects
    this.updateBursts(deltaTime);
  }
  
  /**
   * Calculate energy from node's links (read-only from linkingSystem)
   */
  calculateLinkEnergy(node, linkingSystem) {
    if (!linkingSystem || !linkingSystem.links) return 0;
    
    let totalEnergy = 0;
    let linkCount = 0;
    
    linkingSystem.links.forEach(link => {
      // Check if this link is connected to our node
      if ((link.source === node || link.target === node) && link.glowData) {
        totalEnergy += link.glowData.synergy || 0;
        linkCount++;
      }
    });
    
    // Add traffic load bonus
    let trafficBonus = 0;
    linkingSystem.links.forEach(link => {
      if ((link.source === node || link.target === node) && link.traffic) {
        trafficBonus += link.traffic.load || 0;
      }
    });
    
    const avgTraffic = linkCount > 0 ? trafficBonus / linkCount : 0;
    const avgSynergy = linkCount > 0 ? totalEnergy / linkCount : 0;
    
    // Combined energy (synergy weighted at 1.0, traffic at 0.5)
    return (avgSynergy * 10) + (avgTraffic * 5);
  }
  
  /**
   * Calculate evolution stage based on energy
   */
  calculateStage(energy) {
    if (energy >= this.config.stageThresholds.stage4) return 4;
    if (energy >= this.config.stageThresholds.stage3) return 3;
    if (energy >= this.config.stageThresholds.stage2) return 2;
    if (energy >= this.config.stageThresholds.stage1) return 1;
    return 0;
  }
  
  /**
   * Handle stage transition with VFX feedback
   */
  transitionStage(state, newStage) {
    const nodeId = this.getNodeId(state.node);
    const oldStage = state.stage;
    
    state.stage = newStage;
    
    // Determine which mutations to apply
    this.applyMutations(state, newStage, oldStage);
    
    // Create burst effect
    if (newStage > oldStage) {
      this.createBurstEffect(state.node, newStage);
    }
  }
  
  /**
   * Determine and apply mutations based on stage
   */
  applyMutations(state, newStage, oldStage) {
    const nodeId = this.getNodeId(state.node);
    
    // Clear old mutations if going to stage 0
    if (newStage === 0) {
      this.removeNodeVFX(nodeId);
      state.activeMutations = [];
      return;
    }
    
    // Add mutations for each stage
    state.activeMutations = [];
    
    if (newStage >= 1) {
      state.activeMutations.push('glow');
    }
    if (newStage >= 2) {
      state.activeMutations.push('core');
    }
    if (newStage >= 3) {
      state.activeMutations.push('ring');
      state.activeMutations.push('particles');
    }
    if (newStage >= 4) {
      state.activeMutations.push('pulse');
      state.activeMutations.push('color');
    }
  }
  
  /**
   * Update all VFX for a node (applied every frame)
   */
  updateVFX(state, deltaTime) {
    const nodeId = this.getNodeId(state.node);
    const node = state.node;
    const overlays = this.vfxOverlays[nodeId];
    const intensity = Math.min(1, state.stage / 4);  // 0-1 based on stage
    
    // Apply glow mutation
    if (state.activeMutations.includes('glow')) {
      this.updateGlowVFX(node, overlays, state, intensity);
    }
    
    // Apply core mutation
    if (state.activeMutations.includes('core')) {
      this.updateCoreVFX(node, overlays, state, intensity, deltaTime);
    }
    
    // Apply ring mutation
    if (state.activeMutations.includes('ring')) {
      this.updateRingVFX(node, overlays, state, intensity, deltaTime);
    }
    
    // Apply particle mutation
    if (state.activeMutations.includes('particles')) {
      this.updateParticleVFX(node, overlays, state, intensity, deltaTime);
    }
    
    // Apply pulse mutation
    if (state.activeMutations.includes('pulse')) {
      this.updatePulseVFX(node, state, intensity, deltaTime);
    }
    
    // Apply color mutation
    if (state.activeMutations.includes('color')) {
      this.updateColorVFX(node, state, intensity);
    }
  }
  
  /**
   * GLOW MUTATION - Enhance existing node glow
   * Creates additive glow sphere around node
   * VISUAL HIERARCHY: Capped to 0.35 max opacity (background layer)
   */
  updateGlowVFX(node, overlays, state, intensity) {
    const nodeId = this.getNodeId(node);
    const glowColor = this.getNodePrimaryColor(node);
    
    // Create glow mesh if it doesn't exist
    if (!overlays.glowMesh) {
      const glowGeometry = new THREE.IcosahedronGeometry(1.2, 4);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        emissive: glowColor,
        emissiveIntensity: 0.3,
        fog: false
      });
      
      overlays.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      overlays.glowMesh.userData = { 
        isEvolutionVFX: true, 
        nodeId: nodeId,
        vfxType: 'glow'
      };
      
      // VISUAL HIERARCHY: Render as background layer
      overlays.glowMesh.renderOrder = -1;
      
      this.scene.add(overlays.glowMesh);
    }
    
    // Position and animate glow
    overlays.glowMesh.position.copy(node.position);
    // VISUAL HIERARCHY: Cap opacity to 0.35 (was 0.3–0.7)
    overlays.glowMesh.material.opacity = Math.min(
      this.opacityCaps.glowMesh,
      0.15 + intensity * 0.20  // Scale: 0.15–0.35
    );
    overlays.glowMesh.material.emissiveIntensity = 0.2 + intensity * 0.15;
  }
  
  /**
   * CORE MUTATION - Add rotating inner hologram
   * VISUAL HIERARCHY: Capped to 0.25 max opacity (background layer, subtle)
   */
  updateCoreVFX(node, overlays, state, intensity, deltaTime) {
    const nodeId = this.getNodeId(node);
    const secondaryColor = this.getNodeSecondaryColor(node);
    
    // Create core mesh if it doesn't exist
    if (!overlays.coreMesh) {
      const coreGeometry = new THREE.IcosahedronGeometry(0.35, 3);
      const coreMaterial = new THREE.MeshBasicMaterial({
        color: secondaryColor,
        transparent: true,
        emissive: secondaryColor,
        emissiveIntensity: 0.3,
        fog: false
      });
      
      overlays.coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
      overlays.coreMesh.userData = {
        isEvolutionVFX: true,
        nodeId: nodeId,
        vfxType: 'core',
        rotationAxis: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize(),
        rotationSpeed: 0.8 + Math.random() * 0.4
      };
      
      // VISUAL HIERARCHY: Render as background layer
      overlays.coreMesh.renderOrder = -1;
      
      this.scene.add(overlays.coreMesh);
    }
    
    // Position and animate core
    overlays.coreMesh.position.copy(node.position);
    // VISUAL HIERARCHY: Cap opacity to 0.25 (was 0.0–0.6)
    overlays.coreMesh.material.opacity = Math.min(
      this.opacityCaps.coreMesh,
      intensity * 0.25
    );
    
    // Rotation
    const axis = overlays.coreMesh.userData.rotationAxis;
    const speed = overlays.coreMesh.userData.rotationSpeed * deltaTime * 0.5;
    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(axis, speed);
    overlays.coreMesh.quaternion.multiplyQuaternions(quaternion, overlays.coreMesh.quaternion);
  }
  
  /**
   * RING MUTATION - Add orbit ring
   * VISUAL HIERARCHY: Capped to 0.20 max opacity (background layer, very subtle)
   */
  updateRingVFX(node, overlays, state, intensity, deltaTime) {
    const nodeId = this.getNodeId(node);
    
    // Create additional ring if we don't have one for this stage
    if (overlays.ringMeshes.length < 1) {
      const ringGeometry = new THREE.TorusGeometry(0.9, 0.03, 12, 64);
      const ringColor = this.getNodePrimaryColor(node);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: ringColor,
        transparent: true,
        emissive: ringColor,
        emissiveIntensity: 0.2,
        fog: false
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.y = Math.random() * Math.PI;
      ring.userData = {
        isEvolutionVFX: true,
        nodeId: nodeId,
        vfxType: 'ring',
        rotationAxis: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize(),
        rotationSpeed: 0.5 + Math.random() * 0.5
      };
      
      // VISUAL HIERARCHY: Render as background layer
      ring.renderOrder = -1;
      
      this.scene.add(ring);
      overlays.ringMeshes.push(ring);
    }
    
    // Update existing rings
    overlays.ringMeshes.forEach((ring, index) => {
      ring.position.copy(node.position);
      // VISUAL HIERARCHY: Cap opacity to 0.20 (was 0.0–0.5)
      ring.material.opacity = Math.min(
        this.opacityCaps.ringMeshes,
        intensity * 0.20
      );
      
      // Rotation animation
      const axis = ring.userData.rotationAxis;
      const speed = ring.userData.rotationSpeed * deltaTime * 0.3;
      const q = new THREE.Quaternion();
      q.setFromAxisAngle(axis, speed);
      ring.quaternion.multiplyQuaternions(q, ring.quaternion);
    });
  }
  
  /**
   * PARTICLE MUTATION - Orbiting energy particles
   * VISUAL HIERARCHY: Capped to 0.45 max opacity (background layer, less chaotic)
   */
  updateParticleVFX(node, overlays, state, intensity, deltaTime) {
    const nodeId = this.getNodeId(node);
    const particleCount = 6 + Math.floor(intensity * 6);
    
    // Create particles if needed
    while (overlays.particleMeshes.length < particleCount) {
      const particleGeometry = new THREE.SphereGeometry(0.08, 8, 8);
      const particleColor = this.getNodePrimaryColor(node);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: particleColor,
        transparent: true,
        emissive: particleColor,
        emissiveIntensity: 0.4,
        fog: false
      });
      
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.userData = {
        isEvolutionVFX: true,
        nodeId: nodeId,
        vfxType: 'particle',
        orbitAngle: (overlays.particleMeshes.length / particleCount) * Math.PI * 2,
        orbitRadius: 1.4 + Math.random() * 0.4,
        orbitSpeed: 0.5 + Math.random() * 0.5
      };
      
      // VISUAL HIERARCHY: Render as background layer
      particle.renderOrder = -1;
      
      this.scene.add(particle);
      overlays.particleMeshes.push(particle);
    }
    
    // Update particles
    overlays.particleMeshes.forEach((particle, index) => {
      const userData = particle.userData;
      userData.orbitAngle += userData.orbitSpeed * deltaTime * intensity;
      
      const x = Math.cos(userData.orbitAngle) * userData.orbitRadius;
      const z = Math.sin(userData.orbitAngle) * userData.orbitRadius;
      const y = Math.sin(userData.orbitAngle * 0.5) * 0.3;
      
      particle.position.copy(node.position);
      particle.position.x += x;
      particle.position.y += y;
      particle.position.z += z;
      
      // VISUAL HIERARCHY: Cap opacity to 0.45 (was 0.7)
      particle.material.opacity = Math.min(
        this.opacityCaps.burstParticles,
        intensity * 0.45
      );
    });
  }
  
  /**
   * PULSE MUTATION - Pulsing intensity animation
   */
  updatePulseVFX(node, state, intensity, deltaTime) {
    // Find and modulate child materials
    node.traverse((child) => {
      if (child.isMesh && child.material && !child.userData.isEvolutionVFX) {
        const pulse = 0.5 + Math.sin(performance.now() / 1000 * (2 + intensity * 2)) * 0.3;
        const pulseIntensity = 0.4 + pulse * 0.4 * intensity;
        
        if (child.material.emissiveIntensity !== undefined) {
          child.material.emissiveIntensity = Math.min(1, pulseIntensity);
        }
      }
    });
  }
  
  /**
   * COLOR MUTATION - Shift towards secondary palette color
   */
  updateColorVFX(node, state, intensity) {
    const primaryColor = new THREE.Color(this.getNodePrimaryColor(node));
    const secondaryColor = new THREE.Color(this.getNodeSecondaryColor(node));
    const blended = new THREE.Color();
    blended.lerpColors(primaryColor, secondaryColor, intensity * 0.3);
    
    // Apply color shift to main node meshes (children that aren't VFX)
    node.traverse((child) => {
      if (child.isMesh && child.material && !child.userData.isEvolutionVFX) {
        if (child.material.color && child.material.userData.isNodeMesh) {
          child.material.color.copy(blended);
        }
      }
    });
  }
  
  /**
   * Get node's primary color from userData
   */
  getNodePrimaryColor(node) {
    if (node.userData.layerColors?.primary) {
      return node.userData.layerColors.primary;
    }
    if (node.userData.baseColor) {
      return node.userData.baseColor;
    }
    return 0x00ddff;  // Default cyan
  }
  
  /**
   * Get node's secondary color from userData
   */
  getNodeSecondaryColor(node) {
    if (node.userData.layerColors?.secondary) {
      return node.userData.layerColors.secondary;
    }
    return 0x0099ff;  // Default light blue
  }
  
  /**
   * Create burst effect when stage changes
   */
  createBurstEffect(node, stage) {
    let burst = this.burstPool.pop();
    
    if (!burst) {
      const burstGeometry = new THREE.IcosahedronGeometry(1, 3);
      const burstMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        fog: false
      });
      burst = new THREE.Mesh(burstGeometry, burstMaterial);
      burst.userData = { isEvolutionVFX: true, vfxType: 'burst' };
    }
    
    // Configure burst
    burst.position.copy(node.position);
    burst.scale.setScalar(1);
    
    const burstColors = [0xffaa00, 0x00ffff, 0xff00ff, 0x00ff00];
    const color = burstColors[Math.min(stage - 1, 3)];
    burst.material.color.setHex(color);
    burst.material.emissive.setHex(color);
    burst.material.emissiveIntensity = 1;
    
    burst.userData.progress = 0;
    burst.userData.duration = 0.4;
    burst.userData.maxRadius = 1 + stage * 0.3;
    burst.userData.startTime = performance.now();
    
    this.scene.add(burst);
    this.activeBursts.push(burst);
  }
  
  /**
   * Update burst animations
   */
  updateBursts(deltaTime) {
    for (let i = this.activeBursts.length - 1; i >= 0; i--) {
      const burst = this.activeBursts[i];
      const elapsed = performance.now() - burst.userData.startTime;
      const progress = Math.min(1, elapsed / (burst.userData.duration * 1000));
      
      const expandFactor = 1 + progress * burst.userData.maxRadius;
      burst.scale.setScalar(expandFactor);
      
      // Fade curve
      let opacity;
      if (progress < 0.25) {
        opacity = (progress / 0.25) * 0.8;
      } else {
        opacity = (1 - progress) * 0.8;
      }
      burst.material.opacity = opacity;
      
      if (progress >= 1) {
        this.scene.remove(burst);
        this.activeBursts.splice(i, 1);
        
        // Return to pool
        if (this.burstPool.length < this.maxBurstPoolSize) {
          this.burstPool.push(burst);
        }
      }
    }
  }
  
  /**
   * Remove all VFX for a node
   */
  removeNodeVFX(nodeId) {
    const overlays = this.vfxOverlays[nodeId];
    if (!overlays) return;
    
    // Remove glow
    if (overlays.glowMesh) {
      this.scene.remove(overlays.glowMesh);
      overlays.glowMesh.geometry.dispose();
      overlays.glowMesh.material.dispose();
      overlays.glowMesh = null;
    }
    
    // Remove core
    if (overlays.coreMesh) {
      this.scene.remove(overlays.coreMesh);
      overlays.coreMesh.geometry.dispose();
      overlays.coreMesh.material.dispose();
      overlays.coreMesh = null;
    }
    
    // Remove rings
    overlays.ringMeshes.forEach(ring => {
      this.scene.remove(ring);
      ring.geometry.dispose();
      ring.material.dispose();
    });
    overlays.ringMeshes = [];
    
    // Remove particles
    overlays.particleMeshes.forEach(particle => {
      this.scene.remove(particle);
      particle.geometry.dispose();
      particle.material.dispose();
    });
    overlays.particleMeshes = [];
  }
  
  /**
   * Clean up entire system
   */
  dispose() {
    // Remove all VFX
    for (const nodeId in this.vfxOverlays) {
      this.removeNodeVFX(nodeId);
    }
    
    // Remove all bursts
    this.activeBursts.forEach(burst => {
      this.scene.remove(burst);
      burst.geometry.dispose();
      burst.material.dispose();
    });
    
    // Clear registry
    this.registry = {};
    this.vfxOverlays = {};
    this.activeBursts = [];
    this.burstPool = [];
  }
}
