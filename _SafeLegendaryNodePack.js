import * as THREE from 'three';
import { safeSetEmissive } from './_EmissiveUtils.js';

/**
 * SAFE LEGENDARY NODE PACK 2.0
 * 
 * ABSOLUTE SAFETY RULES - STRICTLY ENFORCED:
 * - ZERO modifications to Node class
 * - ZERO new fields added to nodes
 * - ZERO modifications to NodeLinkingSystem or animation.js
 * - ZERO shader or material overrides
 * - All state stored ONLY in external LegendaryRegistry
 * - All VFX completely separate from node meshes (added to scene)
 * - Read-only access to evolution and link systems
 * - Completely non-invasive and reversible
 */

export class SafeLegendaryNodePack {
  constructor(scene) {
    this.scene = scene;
    
    // EXTERNAL STATE - Never touch node internals
    this.registry = {};
    this.vfxContainers = {};
    
    // Legendary type definitions with visual parameters
    this.legendaryTypes = {
      AURORA: {
        colors: [0x00ff88, 0x00ffff, 0xff00ff, 0xffff00, 0x00ff00],
        ringCount: 4,
        aururaIntensity: 0.8,
        glowRadius: 2.0
      },
      FRACTAL: {
        primaryColor: 0xaa00ff,
        lineColor: 0xff00ff,
        complexity: 3,
        rotationSpeed: 0.3,
        particleCount: 12
      },
      SINGULARITY: {
        coreColor: 0x6600ff,
        auraColor: 0x8800ff,
        pulseFrequency: 1.2,
        distortionRadius: 2.5,
        pulseIntensity: 1.0
      },
      SIGMA_PRIME: {
        baseColor: 0x00ff88,
        glitchColor: 0xff0088,
        panelCount: 3,
        glitchIntensity: 0.6,
        sparkCount: 8
      },
      QUANTUM_CROWN: {
        crownColor: 0x00ddff,
        ringColor: 0xff00ff,
        ringCount: 5,
        particleCount: 20,
        rotationSpeed: 0.5
      }
    };
    
    // Configuration
    this.config = {
      maxLegendaryNodes: 5,
      spawnCheckInterval: 2.0,        // Seconds between spawn checks
      legendaryChance: 0.01,           // 1% per check
      powerLevelMax: 100,
      fadeDuration: 0.8,               // Seconds to fade out
      burstDuration: 0.5               // Spawn burst duration
    };
    
    // Tracking
    this.lastSpawnCheck = performance.now();
    this.activeBursts = [];
    this.spawnParticles = [];
  }
  
  /**
   * MATERIAL SAFETY: Check if material supports emissive properties
   */
  ensureEmissiveSafe(mat) {
    if (!mat || typeof mat !== 'object') return false;
    return (
      mat.isMeshStandardMaterial ||
      mat.isMeshLambertMaterial ||
      mat.isMeshPhongMaterial ||
      mat.isMeshToonMaterial
    );
  }

  /**
   * Get safe node identifier (same as evolution system)
   */
  getNodeId(node) {
    if (node.uuid) return node.uuid;
    if (!node.userData.nodeId) {
      node.userData.nodeId = `node_${Math.random().toString(36).substr(2, 9)}`;
    }
    return node.userData.nodeId;
  }
  
  /**
   * Update legendary system (called once per frame)
   */
  update(deltaTime, nodes, linkingSystem, evolutionRegistry) {
    // Check for new legendary spawns periodically
    this.checkLegendarySpawns(deltaTime, nodes, linkingSystem, evolutionRegistry);
    
    // Update all active legendary nodes
    for (const nodeId in this.registry) {
      const state = this.registry[nodeId];
      const vfx = this.vfxContainers[nodeId];
      
      // Find node in scene
      const node = this.findNodeById(nodeId);
      if (!node) {
        this.deLegendaryNode(nodeId);
        continue;
      }
      
      // Update power level (based on activity)
      this.updatePowerLevel(state, node, linkingSystem);
      
      // Update all VFX for this legendary node
      this.updateLegendaryVFX(node, state, vfx, deltaTime);
    }
    
    // Update burst effects
    this.updateBursts(deltaTime);
    
    // Update spawn particles
    this.updateSpawnParticles(deltaTime);
  }
  
  /**
   * Check for and spawn new legendary nodes
   */
  checkLegendarySpawns(deltaTime, nodes, linkingSystem, evolutionRegistry) {
    // Periodic check (don't check every frame for performance)
    const now = performance.now();
    if (now - this.lastSpawnCheck < this.config.spawnCheckInterval * 1000) {
      return;
    }
    this.lastSpawnCheck = now;
    
    // Don't exceed max legendary nodes
    const activeLegendary = Object.keys(this.registry).length;
    if (activeLegendary >= this.config.maxLegendaryNodes) {
      // Optionally: demote oldest
      this.deLegendaryOldest();
      return;
    }
    
    // Evaluate all nodes for legendary potential
    if (!nodes || nodes.length === 0) return;
    
    const candidates = [];
    
    nodes.forEach(node => {
      const nodeId = this.getNodeId(node);
      
      // Skip if already legendary
      if (this.registry[nodeId]) return;
      
      // Calculate legendary potential
      const potential = this.calculateLegendaryPotential(
        node,
        nodeId,
        linkingSystem,
        evolutionRegistry
      );
      
      if (potential > 0) {
        candidates.push({
          node: node,
          nodeId: nodeId,
          potential: potential
        });
      }
    });
    
    // Sort by potential and pick top candidate
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.potential - a.potential);
      
      // Random chance to spawn even top candidate
      if (Math.random() < this.config.legendaryChance * candidates.length) {
        const chosen = candidates[0];
        this.makeLegendaryNode(chosen.node, chosen.nodeId, chosen.potential);
      }
    }
  }
  
  /**
   * Calculate potential for a node to become legendary
   */
  calculateLegendaryPotential(node, nodeId, linkingSystem, evolutionRegistry) {
    let potential = 0;
    
    // Check evolution stage (read-only access)
    if (evolutionRegistry && evolutionRegistry.registry && evolutionRegistry.registry[nodeId]) {
      const evolState = evolutionRegistry.registry[nodeId];
      if (evolState.stage >= 4) {
        potential += 40;  // High evolution stage
      } else if (evolState.stage >= 3) {
        potential += 25;
      } else if (evolState.stage >= 2) {
        potential += 10;
      }
    }
    
    // Check link count and synergy
    if (linkingSystem && linkingSystem.links) {
      let linkCount = 0;
      let totalSynergy = 0;
      
      linkingSystem.links.forEach(link => {
        if ((link.source === node || link.target === node) && link.glowData) {
          linkCount++;
          totalSynergy += link.glowData.synergy || 0;
        }
      });
      
      // Bonus for high-degree nodes
      if (linkCount >= 8) potential += 35;
      else if (linkCount >= 6) potential += 25;
      else if (linkCount >= 4) potential += 15;
      else if (linkCount >= 2) potential += 5;
      
      // Bonus for high synergy
      if (totalSynergy > 5) potential += 20;
    }
    
    return potential;
  }
  
  /**
   * Make a node legendary (create external entry)
   */
  makeLegendaryNode(node, nodeId, potential) {
    // Don't create if already exists
    if (this.registry[nodeId]) return;
    
    // Choose legendary type based on node category
    const type = this.chooseLegendaryType(node);
    
    // Create external registry entry
    this.registry[nodeId] = {
      isLegendary: true,
      type: type,
      spawnTime: performance.now(),
      powerLevel: 0,
      fadeTime: null,
      isFading: false
    };
    
    // Create VFX container
    this.vfxContainers[nodeId] = this.createLegendaryVFXContainer(type, node);
    
    // Create spawn burst
    this.createSpawnBurst(node, type);
  }
  
  /**
   * Choose legendary type based on node category or random
   */
  chooseLegendaryType(node) {
    const types = Object.keys(this.legendaryTypes);
    
    // Try to choose based on category
    if (node.userData && node.userData.category) {
      const categoryTypeMap = {
        'input': 'AURORA',
        'process': 'SINGULARITY',
        'integration': 'FRACTAL',
        'analytics': 'QUANTUM_CROWN',
        'storage': 'SIGMA_PRIME',
        'control': 'SIGMA_PRIME'
      };
      
      const mapped = categoryTypeMap[node.userData.category];
      if (mapped) return mapped;
    }
    
    // Random choice
    return types[Math.floor(Math.random() * types.length)];
  }
  
  /**
   * Create legendary VFX container
   */
  createLegendaryVFXContainer(type, node) {
    const container = {
      type: type,
      meshes: [],
      rings: [],
      particles: [],
      panels: [],
      crown: null,
      aura: null,
      distortionMesh: null,
      glitchStripes: [],
      fractals: [],
      animationTime: 0
    };
    
    return container;
  }
  
  /**
   * Update legendary VFX based on type
   */
  updateLegendaryVFX(node, state, vfx, deltaTime) {
    vfx.animationTime += deltaTime;
    
    const intensity = Math.min(1, state.powerLevel / this.config.powerLevelMax);
    
    // Update based on type
    switch(state.type) {
      case 'AURORA':
        this.updateAuroraVFX(node, state, vfx, intensity, deltaTime);
        break;
      case 'FRACTAL':
        this.updateFractalVFX(node, state, vfx, intensity, deltaTime);
        break;
      case 'SINGULARITY':
        this.updateSingularityVFX(node, state, vfx, intensity, deltaTime);
        break;
      case 'SIGMA_PRIME':
        this.updateSigmaPrimeVFX(node, state, vfx, intensity, deltaTime);
        break;
      case 'QUANTUM_CROWN':
        this.updateQuantumCrownVFX(node, state, vfx, intensity, deltaTime);
        break;
    }
  }
  
  /**
   * AURORA VFX - Rainbow spectrum with orbit rings
   */
  updateAuroraVFX(node, state, vfx, intensity, deltaTime) {
    const params = this.legendaryTypes.AURORA;
    
    // Create aurora rings if needed
    while (vfx.rings.length < params.ringCount) {
      const ringIndex = vfx.rings.length;
      const color = params.colors[ringIndex % params.colors.length];
      
      const geo = new THREE.TorusGeometry(1.2 + ringIndex * 0.3, 0.04, 16, 64);
      const mat = new THREE.MeshStandardMaterial({
        color: color,
        transparent: true,
        emissive: color,
        emissiveIntensity: 0.5,
        fog: false
      });
      
      const ring = new THREE.Mesh(geo, mat);
      ring.userData = {
        isLegendaryVFX: true,
        type: 'aurora_ring',
        index: ringIndex,
        rotationAxis: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize()
      };
      
      this.scene.add(ring);
      vfx.rings.push(ring);
    }
    
    // Update aurora rings
    vfx.rings.forEach((ring, idx) => {
      ring.position.copy(node.position);
      
      // Subtle opacity pulsing
      const pulse = 0.3 + Math.sin(vfx.animationTime * 2) * 0.3 + intensity * 0.4;
      ring.material.opacity = pulse;
      
      // Color cycling
      const colorIdx = idx % params.colors.length;
      const nextColorIdx = (idx + 1) % params.colors.length;
      const t = (Math.sin(vfx.animationTime * 0.5) + 1) * 0.5;
      
      // Rotation
      const axis = ring.userData.rotationAxis;
      const speed = 0.5 + idx * 0.15;
      const q = new THREE.Quaternion();
      q.setFromAxisAngle(axis, speed * deltaTime * (0.5 + intensity));
      ring.quaternion.multiplyQuaternions(q, ring.quaternion);
    });
  }
  
  /**
   * FRACTAL VFX - Animated fractal projections
   */
  updateFractalVFX(node, state, vfx, intensity, deltaTime) {
    const params = this.legendaryTypes.FRACTAL;
    
    // Create fractal lines if needed
    if (vfx.fractals.length === 0) {
      // Create a few fractal line structures
      for (let i = 0; i < params.complexity; i++) {
        const lineGroup = this.createFractalLineStructure(params);
        this.scene.add(lineGroup);
        vfx.fractals.push(lineGroup);
      }
    }
    
    // Update fractal structures
    vfx.fractals.forEach((fractal, idx) => {
      fractal.position.copy(node.position);
      
      // Rotation with fractal effect
      fractal.rotation.x += params.rotationSpeed * deltaTime * (0.5 + intensity * 0.5);
      fractal.rotation.y += params.rotationSpeed * deltaTime * (0.3 + intensity * 0.3);
      fractal.rotation.z += params.rotationSpeed * deltaTime * (0.2 + intensity * 0.2);
      
      // Update opacity based on intensity
      fractal.children.forEach(child => {
        if (child.material) {
          child.material.opacity = 0.2 + intensity * 0.6;
          // FIX: Only update emissive on materials that support it
          if (this.ensureEmissiveSafe(child.material)) {
            child.material.emissiveIntensity = intensity * 0.8;
          }
        }
      });
    });
  }
  
  /**
   * Create fractal line structure
   */
  createFractalLineStructure(params) {
    const group = new THREE.Group();
    group.userData = { isLegendaryVFX: true, type: 'fractal' };
    
    // Create multiple fractal line segments
    for (let i = 0; i < 3; i++) {
      const points = [];
      const segments = 4;
      
      for (let j = 0; j <= segments; j++) {
        const angle = (j / segments) * Math.PI * 2;
        const radius = 0.5 + j * 0.3;
        points.push(
          new THREE.Vector3(
            Math.cos(angle) * radius,
            (j / segments - 0.5) * 2,
            Math.sin(angle) * radius
          )
        );
      }
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: params.lineColor,
        transparent: true,
        emissive: params.lineColor,
        linewidth: 2,
        fog: false
      });
      
      const line = new THREE.Line(geometry, material);
      group.add(line);
    }
    
    return group;
  }
  
  /**
   * SINGULARITY VFX - Violet core with distortion aura
   */
  updateSingularityVFX(node, state, vfx, intensity, deltaTime) {
    const params = this.legendaryTypes.SINGULARITY;
    
    // Create core sphere if needed
    if (!vfx.aura) {
      const geo = new THREE.IcosahedronGeometry(0.8, 4);
      const mat = new THREE.MeshStandardMaterial({
        color: params.coreColor,
        transparent: true,
        emissive: params.coreColor,
        emissiveIntensity: 0.8,
        fog: false
      });
      
      vfx.aura = new THREE.Mesh(geo, mat);
      vfx.aura.userData = { isLegendaryVFX: true, type: 'singularity_core' };
      this.scene.add(vfx.aura);
    }
    
    // Update core
    vfx.aura.position.copy(node.position);
    vfx.aura.material.opacity = 0.4 + intensity * 0.6;
    if (this.ensureEmissiveSafe(vfx.aura.material)) {
      vfx.aura.material.emissiveIntensity = 0.6 + intensity * 0.4;
    }
    
    // Pulse effect
    const pulseScale = 1.0 + Math.sin(vfx.animationTime * params.pulseFrequency) * 0.3 * intensity;
    vfx.aura.scale.setScalar(pulseScale);
    
    // Create distortion rings if needed
    while (vfx.rings.length < 2) {
      const geo = new THREE.TorusGeometry(1.5 + vfx.rings.length * 0.4, 0.05, 12, 64);
      const mat = new THREE.MeshStandardMaterial({
        color: params.auraColor,
        transparent: true,
        emissive: params.auraColor,
        emissiveIntensity: 0.4,
        fog: false
      });
      
      const ring = new THREE.Mesh(geo, mat);
      ring.userData = { isLegendaryVFX: true, type: 'singularity_ring' };
      this.scene.add(ring);
      vfx.rings.push(ring);
    }
    
    // Update distortion rings
    vfx.rings.forEach((ring, idx) => {
      ring.position.copy(node.position);
      ring.material.opacity = 0.3 * intensity;
      
      // Pulse outward
      const pulseExpand = 1.0 + Math.sin(vfx.animationTime * params.pulseFrequency + idx) * 0.2;
      ring.scale.setScalar(pulseExpand);
    });
  }
  
  /**
   * SIGMA_PRIME VFX - Glitch aesthetic with panels and sparks
   */
  updateSigmaPrimeVFX(node, state, vfx, intensity, deltaTime) {
    const params = this.legendaryTypes.SIGMA_PRIME;
    
    // Create floating panels if needed
    while (vfx.panels.length < params.panelCount) {
      const panelIndex = vfx.panels.length;
      
      const geo = new THREE.BoxGeometry(0.6, 0.8, 0.05);
      const mat = new THREE.MeshStandardMaterial({
        color: params.baseColor,
        transparent: true,
        emissive: params.baseColor,
        emissiveIntensity: 0.6,
        fog: false
      });
      
      const panel = new THREE.Mesh(geo, mat);
      panel.userData = {
        isLegendaryVFX: true,
        type: 'sigma_panel',
        index: panelIndex,
        angle: (panelIndex / params.panelCount) * Math.PI * 2,
        orbitRadius: 1.2
      };
      
      this.scene.add(panel);
      vfx.panels.push(panel);
    }
    
    // Update panels with glitch effect
    vfx.panels.forEach((panel, idx) => {
      const angle = panel.userData.angle + vfx.animationTime * 0.5;
      const x = Math.cos(angle) * panel.userData.orbitRadius;
      const z = Math.sin(angle) * panel.userData.orbitRadius;
      
      panel.position.copy(node.position);
      panel.position.x += x;
      panel.position.z += z;
      
      // Glitch effect - random offset
      if (Math.random() < 0.3 * intensity) {
        panel.position.x += (Math.random() - 0.5) * 0.1;
        panel.position.y += (Math.random() - 0.5) * 0.1;
      }
      
      panel.material.opacity = 0.5 + intensity * 0.5;
      panel.rotation.z += deltaTime * intensity * 0.5;
    });
    
    // Create glitch sparks if needed
    while (vfx.particles.length < params.sparkCount) {
      const geo = new THREE.SphereGeometry(0.06, 6, 6);
      const mat = new THREE.MeshStandardMaterial({
        color: params.glitchColor,
        transparent: true,
        emissive: params.glitchColor,
        emissiveIntensity: 1.0,
        fog: false
      });
      
      const spark = new THREE.Mesh(geo, mat);
      spark.userData = {
        isLegendaryVFX: true,
        type: 'sigma_spark',
        angle: Math.random() * Math.PI * 2,
        speed: 1 + Math.random() * 2
      };
      
      this.scene.add(spark);
      vfx.particles.push(spark);
    }
    
    // Update sparks
    vfx.particles.forEach((spark, idx) => {
      spark.userData.angle += spark.userData.speed * deltaTime;
      
      const radius = 1.0 + Math.sin(vfx.animationTime + idx) * 0.3;
      const x = Math.cos(spark.userData.angle) * radius;
      const z = Math.sin(spark.userData.angle) * radius;
      
      spark.position.copy(node.position);
      spark.position.x += x;
      spark.position.z += z;
      spark.position.y += Math.sin(vfx.animationTime * 2 + idx) * 0.2;
      
      spark.material.opacity = 0.6 * intensity;
    });
  }
  
  /**
   * QUANTUM_CROWN VFX - Floating crown with intersecting rings
   */
  updateQuantumCrownVFX(node, state, vfx, intensity, deltaTime) {
    const params = this.legendaryTypes.QUANTUM_CROWN;
    
    // Create crown if needed
    if (!vfx.crown) {
      const geo = new THREE.IcosahedronGeometry(0.5, 3);
      const mat = new THREE.MeshStandardMaterial({
        color: params.crownColor,
        transparent: true,
        emissive: params.crownColor,
        emissiveIntensity: 0.7,
        fog: false
      });
      
      vfx.crown = new THREE.Mesh(geo, mat);
      vfx.crown.userData = { isLegendaryVFX: true, type: 'quantum_crown' };
      this.scene.add(vfx.crown);
    }
    
    // Update crown position (floats above node)
    vfx.crown.position.copy(node.position);
    vfx.crown.position.y += 1.5 + Math.sin(vfx.animationTime) * 0.3;
    vfx.crown.material.opacity = 0.5 + intensity * 0.5;
    
    // Crown rotation
    vfx.crown.rotation.x += deltaTime * 0.3 * intensity;
    vfx.crown.rotation.y += deltaTime * 0.5 * intensity;
    
    // Create quantum rings if needed
    while (vfx.rings.length < params.ringCount) {
      const ringIndex = vfx.rings.length;
      
      const geo = new THREE.TorusGeometry(0.8 + ringIndex * 0.15, 0.03, 12, 64);
      const mat = new THREE.MeshStandardMaterial({
        color: params.ringColor,
        transparent: true,
        emissive: params.ringColor,
        emissiveIntensity: 0.5,
        fog: false
      });
      
      const ring = new THREE.Mesh(geo, mat);
      ring.userData = {
        isLegendaryVFX: true,
        type: 'quantum_ring',
        index: ringIndex,
        angle: (ringIndex / params.ringCount) * Math.PI
      };
      
      this.scene.add(ring);
      vfx.rings.push(ring);
    }
    
    // Update quantum rings (strange intersection angles)
    vfx.rings.forEach((ring, idx) => {
      ring.position.copy(node.position);
      ring.position.y += 1.5 + Math.sin(vfx.animationTime) * 0.3;
      
      // Rotate on multiple axes with different speeds
      ring.rotation.x = ring.userData.angle + vfx.animationTime * 0.3 * (idx % 2 ? 1 : -1);
      ring.rotation.y = vfx.animationTime * 0.2 * (idx % 3 ? 1 : -1);
      ring.rotation.z = vfx.animationTime * 0.15 * (idx % 4 ? 1 : -1);
      
      ring.material.opacity = 0.4 + intensity * 0.6;
    });
    
    // Create quantum particles if needed
    while (vfx.particles.length < params.particleCount) {
      const geo = new THREE.SphereGeometry(0.04, 6, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: params.ringColor,
        transparent: true,
        emissive: params.ringColor,
        emissiveIntensity: 1.0,
        fog: false
      });
      
      const particle = new THREE.Mesh(geo, mat);
      particle.userData = {
        isLegendaryVFX: true,
        type: 'quantum_particle',
        angle: Math.random() * Math.PI * 2,
        elevation: Math.random() * Math.PI,
        speed: 0.5 + Math.random() * 1.5
      };
      
      this.scene.add(particle);
      vfx.particles.push(particle);
    }
    
    // Update quantum particles
    vfx.particles.forEach((particle, idx) => {
      particle.userData.angle += particle.userData.speed * deltaTime * 0.3;
      particle.userData.elevation += particle.userData.speed * deltaTime * 0.2;
      
      const radius = 1.2;
      const x = Math.cos(particle.userData.angle) * Math.cos(particle.userData.elevation) * radius;
      const y = Math.sin(particle.userData.elevation) * radius;
      const z = Math.sin(particle.userData.angle) * Math.cos(particle.userData.elevation) * radius;
      
      particle.position.copy(node.position);
      particle.position.x += x;
      particle.position.y += y + 1.5;
      particle.position.z += z;
      
      particle.material.opacity = 0.7 * intensity;
    });
  }
  
  /**
   * Update power level based on link activity
   */
  updatePowerLevel(state, node, linkingSystem) {
    if (!linkingSystem || !linkingSystem.links) {
      state.powerLevel = Math.max(0, state.powerLevel - 1);
      return;
    }
    
    // Calculate current activity
    let activity = 0;
    linkingSystem.links.forEach(link => {
      if ((link.source === node || link.target === node) && link.glowData) {
        activity += link.glowData.synergy || 0;
        if (link.traffic) {
          activity += link.traffic.load * 5 || 0;
        }
      }
    });
    
    // Smooth power level update
    state.powerLevel = Math.min(
      this.config.powerLevelMax,
      state.powerLevel + activity - 1  // Natural decay
    );
  }
  
  /**
   * Create spawn burst effect
   */
  createSpawnBurst(node, type) {
    const geo = new THREE.IcosahedronGeometry(0.5, 3);
    const mat = new THREE.MeshBasicMaterial({
      color: this.legendaryTypes[type].primaryColor || this.legendaryTypes[type].colors?.[0] || 0x00ffff,
      transparent: true,
      emissive: this.legendaryTypes[type].primaryColor || this.legendaryTypes[type].colors?.[0] || 0x00ffff,
      emissiveIntensity: 1.0,
      fog: false
    });
    
    const burst = new THREE.Mesh(geo, mat);
    burst.position.copy(node.position);
    burst.userData = {
      isLegendaryVFX: true,
      isSpawnBurst: true,
      startTime: performance.now(),
      duration: this.config.burstDuration
    };
    
    this.scene.add(burst);
    this.activeBursts.push(burst);
  }
  
  /**
   * Update burst effects
   */
  updateBursts(deltaTime) {
    this.activeBursts = this.activeBursts.filter(burst => {
      const elapsed = (performance.now() - burst.userData.startTime) * 0.001;
      const progress = Math.min(1, elapsed / burst.userData.duration);
      
      // Expand and fade out
      burst.scale.setScalar(1 + progress * 2);
      burst.material.opacity = 1 - progress;
      
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
   * Update spawn particles (cosmetic effect)
   */
  updateSpawnParticles(deltaTime) {
    this.spawnParticles = this.spawnParticles.filter(particle => {
      particle.userData.time += deltaTime;
      
      // Move outward
      const progress = particle.userData.time / particle.userData.lifetime;
      particle.position.addScaledVector(particle.userData.velocity, deltaTime);
      
      // Fade
      particle.material.opacity = (1 - progress) * 0.6;
      
      // Remove when done
      if (progress >= 1) {
        this.scene.remove(particle);
        particle.geometry.dispose();
        particle.material.dispose();
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * De-legendaryify a node
   */
  deLegendaryNode(nodeId) {
    const vfx = this.vfxContainers[nodeId];
    if (!vfx) return;
    
    // Mark as fading
    const state = this.registry[nodeId];
    if (state) {
      state.isFading = true;
      state.fadeTime = performance.now();
    }
    
    // Schedule complete removal
    setTimeout(() => {
      this.cleanupLegendaryVFX(nodeId);
      delete this.registry[nodeId];
      delete this.vfxContainers[nodeId];
    }, this.config.fadeDuration * 1000);
  }
  
  /**
   * De-legendary the oldest node
   */
  deLegendaryOldest() {
    let oldest = null;
    let oldestTime = Infinity;
    
    for (const nodeId in this.registry) {
      const state = this.registry[nodeId];
      if (state.spawnTime < oldestTime) {
        oldestTime = state.spawnTime;
        oldest = nodeId;
      }
    }
    
    if (oldest) {
      this.deLegendaryNode(oldest);
    }
  }
  
  /**
   * Clean up all VFX for a node
   */
  cleanupLegendaryVFX(nodeId) {
    const vfx = this.vfxContainers[nodeId];
    if (!vfx) return;
    
    // Clean up rings
    vfx.rings.forEach(ring => {
      this.scene.remove(ring);
      ring.geometry.dispose();
      ring.material.dispose();
    });
    
    // Clean up particles
    vfx.particles.forEach(p => {
      this.scene.remove(p);
      p.geometry.dispose();
      p.material.dispose();
    });
    
    // Clean up panels
    vfx.panels.forEach(panel => {
      this.scene.remove(panel);
      panel.geometry.dispose();
      panel.material.dispose();
    });
    
    // Clean up crown
    if (vfx.crown) {
      this.scene.remove(vfx.crown);
      vfx.crown.geometry.dispose();
      vfx.crown.material.dispose();
    }
    
    // Clean up aura
    if (vfx.aura) {
      this.scene.remove(vfx.aura);
      vfx.aura.geometry.dispose();
      vfx.aura.material.dispose();
    }
    
    // Clean up fractals
    vfx.fractals.forEach(fractal => {
      fractal.children.forEach(child => {
        child.geometry.dispose();
        child.material.dispose();
      });
      this.scene.remove(fractal);
    });
    
    // Clean up distortion mesh
    if (vfx.distortionMesh) {
      this.scene.remove(vfx.distortionMesh);
      vfx.distortionMesh.geometry.dispose();
      vfx.distortionMesh.material.dispose();
    }
    
    // Clean up glitch stripes
    vfx.glitchStripes.forEach(stripe => {
      this.scene.remove(stripe);
      stripe.geometry.dispose();
      stripe.material.dispose();
    });
  }
  
  /**
   * Find node in scene by ID (safe lookup)
   */
  findNodeById(nodeId) {
    let found = null;
    this.scene.traverse(obj => {
      if (obj.userData && obj.userData.nodeId === nodeId) {
        found = obj;
      }
      if (obj.uuid === nodeId) {
        found = obj;
      }
    });
    return found;
  }
  
  /**
   * Get legendary info for UI display
   */
  getLegendaryInfo(nodeId) {
    return this.registry[nodeId] || null;
  }
  
  /**
   * Check if node is legendary
   */
  isLegendary(nodeId) {
    return !!this.registry[nodeId];
  }
  
  /**
   * Get active legendary count
   */
  getActiveLegendaryCount() {
    return Object.keys(this.registry).length;
  }
  
  /**
   * Disable all legendary effects (safe shutdown)
   */
  disableAll() {
    // Clean up all legendary nodes
    for (const nodeId in this.vfxContainers) {
      this.cleanupLegendaryVFX(nodeId);
    }
    
    // Clean up all bursts
    this.activeBursts.forEach(burst => {
      this.scene.remove(burst);
      burst.geometry.dispose();
      burst.material.dispose();
    });
    
    // Clean up all spawn particles
    this.spawnParticles.forEach(p => {
      this.scene.remove(p);
      p.geometry.dispose();
      p.material.dispose();
    });
    
    this.registry = {};
    this.vfxContainers = {};
    this.activeBursts = [];
    this.spawnParticles = [];
  }
}
