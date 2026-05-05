import * as THREE from 'three';
import { safeSetEmissive } from './_EmissiveUtils.js';

/**
 * SAFE NODE PERSONALITY FX
 * 
 * ABSOLUTE SAFETY RULES - STRICTLY ENFORCED:
 * - ZERO modifications to Node class
 * - ZERO fields added to node objects
 * - ZERO modifications to NodeLinkingSystem.js
 * - ZERO shader or material modifications
 * - All personality stored ONLY in external PersonalityRegistry
 * - All VFX completely separate from node meshes
 * - Read-only access to evolution and link systems
 * - Completely non-invasive and reversible
 */

export class SafeNodePersonalityFX {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    
    // EXTERNAL STATE - Never touch node internals
    this.registry = {};
    this.vfxContainers = {};
    this._analyticalSymbolGeometry = null;
    
    // Personality definitions with behavioral parameters
    this.personalityTypes = {
      CURIOUS: {
        color: 0x6f85bf,
        pulseSpeed: 2.0,
        orbitCount: 4,
        orbitSpeed: 0.5,
        glowIntensity: 0.6,
        volatility: 0.3
      },
      AGGRESSIVE: {
        color: 0x8b6a7b,
        pulseSpeed: 4.0,
        orbitCount: 3,
        orbitSpeed: 2.0,
        glowIntensity: 0.9,
        volatility: 0.8
      },
      PASSIVE: {
        color: 0xa0a9b8,
        pulseSpeed: 0.5,
        orbitCount: 1,
        orbitSpeed: 0.1,
        glowIntensity: 0.2,
        volatility: 0.1
      },
      ANALYTICAL: {
        color: 0x66508f,
        pulseSpeed: 1.5,
        orbitCount: 6,
        orbitSpeed: 1.0,
        glowIntensity: 0.7,
        volatility: 0.2
      },
      CHAOTIC: {
        color: 0x7a69c0,
        pulseSpeed: 3.5,
        orbitCount: 5,
        orbitSpeed: 3.0,
        glowIntensity: 0.8,
        volatility: 0.95
      },
      WISE: {
        color: 0x9c8a5a,
        pulseSpeed: 1.0,
        orbitCount: 8,
        orbitSpeed: 0.3,
        glowIntensity: 0.75,
        volatility: 0.1
      }
    };
    
    // Mood definitions
    this.moodMultipliers = {
      CALM: {
        glowMult: 0.5,
        pulseMult: 0.6,
        activityMult: 0.3
      },
      CHARGED: {
        glowMult: 1.5,
        pulseMult: 1.8,
        activityMult: 2.0
      },
      ALERT: {
        glowMult: 1.3,
        pulseMult: 2.5,
        activityMult: 1.5
      },
      TIRED: {
        glowMult: 0.3,
        pulseMult: 0.3,
        activityMult: 0.1
      }
    };
    
    // Configuration
    this.config = {
      maxPersonalityVFX: 100,
      lodDistance: 50,
      pulseIntensityRange: [0.3, 1.0],
      orbitRadius: 1.5,
      interactionHighlightDuration: 2.0,
      moodUpdateInterval: 3.0,
      personalityCheckInterval: 5.0
    };
    
    // Tracking
    this.animationTime = 0;
    this.lastMoodUpdate = performance.now();
    this.lastPersonalityCheck = performance.now();
    this.playerLookingAt = null;
    this.selectedNode = null;
    
    // Phase B HYBRID pilot: throttle semantic interpretation, keep visuals full-rate
    this.interpretationInterval = 0.25; // ~4 Hz for personality/mood decisions
    this.interpretationAccumulator = 0;
  }

  /**
   * MATERIAL SAFETY: MeshBasicMaterial does not support emissive properties
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
   * Get safe node identifier
  */
  getNodeId(node) {
    if (!node?.userData?.nodeId) {
      throw new Error('[SafeNodePersonalityFX:getNodeId] Missing canonical nodeId; aborting.');
    }
    return node.userData.nodeId;
  }
  
  /**
   * Main update loop
   */
  update(deltaTime, nodes, linkingSystem, evolutionRegistry, weatherPack, worldEvents, camera) {
    this.animationTime += deltaTime;
    this.camera = camera;
    
    // Phase B HYBRID pilot: separate semantic cadence (gated) from per-frame visuals
    this.interpretationAccumulator += deltaTime;
    const shouldInterpret = this.interpretationAccumulator >= this.interpretationInterval;
    
    // Periodically check and assign personalities
    if (shouldInterpret) {
      this.checkPersonalityAssignments(nodes, linkingSystem, evolutionRegistry);
    }
    
    // Update all active personalities
    this.updateActivePersonalities(deltaTime, nodes, linkingSystem, weatherPack, worldEvents, shouldInterpret);
    
    // Cleanup dead entries
    this.cleanupDeadEntries(nodes);
    
    if (shouldInterpret) {
      this.interpretationAccumulator = 0;
    }
  }
  
  /**
   * Check and assign personalities to nodes
   */
  checkPersonalityAssignments(nodes, linkingSystem, evolutionRegistry) {
    const now = performance.now();
    if (now - this.lastPersonalityCheck < this.config.personalityCheckInterval * 1000) {
      return;
    }
    this.lastPersonalityCheck = now;
    
    if (!nodes || nodes.length === 0) return;
    
    nodes.forEach(node => {
      const nodeId = this.getNodeId(node);
      
      // Skip if already has personality
      if (this.registry[nodeId]) return;
      
      // Don't exceed max
      if (Object.keys(this.registry).length >= this.config.maxPersonalityVFX) return;
      
      // Assign personality
      const personality = this.determinePersonality(node, nodeId, linkingSystem, evolutionRegistry);
      if (personality) {
        this.assignPersonality(node, nodeId, personality);
      }
    });
  }
  
  /**
   * Determine personality based on node properties
   */
  determinePersonality(node, nodeId, linkingSystem, evolutionRegistry) {
    let personality = null;
    let score = 0;
    const linkCount = this.getActiveLinkCountForNode(node, linkingSystem);

    // Personality VFX must stay dormant until node has at least one active link.
    if (linkCount <= 0) {
      return null;
    }
    
    // Check evolution stage
    if (evolutionRegistry && evolutionRegistry.registry && evolutionRegistry.registry[nodeId]) {
      const evolState = evolutionRegistry.registry[nodeId];
      if (evolState.stage >= 4) {
        personality = 'WISE';
        score = 100;
      } else if (evolState.stage >= 3) {
        personality = 'ANALYTICAL';
        score = 80;
      }
    }
    
    // Check node category/type
    if (node.userData && node.userData.category) {
      const category = node.userData.category;
      
      if (category === 'analytics' || category === 'integration') {
        if (score < 60) {
          personality = 'ANALYTICAL';
          score = 60;
        }
      } else if (category === 'storage' || category === 'repository') {
        if (score < 40) {
          personality = 'PASSIVE';
          score = 40;
        }
      } else if (category === 'input' || category === 'sensor') {
        if (score < 50) {
          personality = 'CURIOUS';
          score = 50;
        }
      } else if (category === 'control' || category === 'execution') {
        if (score < 60) {
          personality = 'AGGRESSIVE';
          score = 60;
        }
      }
    }
    
    // Check synergy/traffic for special types
    if (linkingSystem && linkingSystem.links) {
      let totalSynergy = 0;
      
      linkingSystem.links.forEach(link => {
        if (link.source === node || link.target === node) {
          totalSynergy +=
            (link?.glowData?.synergy ??
             link?.userData?.metrics?.synergy ??
             link?.userData?.synergy ??
             0);
        }
      });
      
      // High activity nodes might be chaotic
      if (linkCount >= 8 && totalSynergy > 5) {
        if (Math.random() < 0.3 && score < 70) {
          personality = 'CHAOTIC';
          score = 70;
        }
      }
    }
    
    // Default to random if no strong indicator
    if (!personality) {
      const types = Object.keys(this.personalityTypes);
      personality = types[Math.floor(Math.random() * types.length)];
    }
    
    return personality;
  }

  getActiveLinkCountForNode(node, linkingSystem) {
    const metricsCount = node?.userData?.metrics?.activeLinkCount;
    if (Number.isFinite(metricsCount)) return Math.max(0, Math.floor(metricsCount));

    const legacyCount = node?.userData?.activeLinkCount;
    if (Number.isFinite(legacyCount)) return Math.max(0, Math.floor(legacyCount));

    if (Array.isArray(node?.userData?.linkedNodeIds)) {
      return node.userData.linkedNodeIds.length;
    }

    if (linkingSystem && Array.isArray(linkingSystem.links)) {
      let count = 0;
      for (const link of linkingSystem.links) {
        if (!link) continue;
        const source = link.source || link.sourceNode || link.from || null;
        const target = link.target || link.targetNode || link.to || null;
        if (source === node || target === node) count += 1;
      }
      return count;
    }

    return 0;
  }
  
  /**
   * Assign personality to a node
   */
  assignPersonality(node, nodeId, personality) {
    // Create registry entry
    this.registry[nodeId] = {
      personality: personality,
      mood: 'CALM',
      volatility: this.personalityTypes[personality].volatility,
      pulseFreq: this.personalityTypes[personality].pulseSpeed,
      lastInteractionTime: performance.now(),
      moodChangeTime: performance.now(),
      glowPhase: Math.random() * Math.PI * 2
    };
    
    // Create VFX container
    this.vfxContainers[nodeId] = this.createPersonalityVFXContainer(personality, node);
    
    // Phase B HYBRID pilot: ensure next tick reevaluates semantics promptly after new assignment
    this.interpretationAccumulator = this.interpretationInterval;
  }
  
  /**
   * Create VFX container for personality
   */
  createPersonalityVFXContainer(personality, node) {
    const container = {
      personality: personality,
      orbits: [],
      pulseOverlay: null,
      holoSymbols: [],
      dustParticles: [],
      haloRing: null,
      animationTime: 0,
      basePosition: node.position.clone()
    };
    
    return container;
  }
  
  /**
   * Update all active personalities
   */
  updateActivePersonalities(deltaTime, nodes, linkingSystem, weatherPack, worldEvents, shouldInterpret) {
    for (const nodeId in this.registry) {
      const state = this.registry[nodeId];
      const vfx = this.vfxContainers[nodeId];
      
      // Find node in scene
      const node = this.findNodeById(nodeId, nodes);
      if (!node) {
        this.removePersonality(nodeId);
        continue;
      }
      
      // Update mood based on conditions
      if (shouldInterpret) {
        this.updateMood(state, node, linkingSystem, weatherPack, worldEvents);
      }
      
      // Update VFX based on personality
      this.updatePersonalityVFX(node, state, vfx, deltaTime);
    }
  }
  
  /**
   * Update mood based on network conditions
   */
  updateMood(state, node, linkingSystem, weatherPack, worldEvents) {
    const now = performance.now();
    const timeSinceInteraction = (now - state.lastInteractionTime) * 0.001;
    
    let mood = 'CALM';
    
    // Check traffic intensity
    if (linkingSystem && linkingSystem.links) {
      let traffic = 0;
      let synergy = 0;
      
      linkingSystem.links.forEach(link => {
        if ((link.source === node || link.target === node)) {
          if (link.traffic && link.traffic.load) {
            traffic += link.traffic.load;
          }
          if (link.glowData && link.glowData.synergy) {
            synergy += link.glowData.synergy;
          }
        }
      });
      
      if (traffic > 3 || synergy > 8) {
        mood = 'CHARGED';
      }
    }
    
    // Weather influence
    if (weatherPack && weatherPack.isWeatherActive()) {
      const weatherType = weatherPack.getActiveWeatherType();
      if (weatherType === 'QUANTUM_STORM' || weatherType === 'SIGMA_TURBULENCE') {
        mood = 'ALERT';
      }
    }
    
    // World events influence
    if (worldEvents && worldEvents.isEventActive()) {
      mood = 'CHARGED';
    }
    
    // Time since interaction
    if (timeSinceInteraction > 10) {
      mood = 'TIRED';
    }
    
    state.mood = mood;
    state.moodChangeTime = now;
  }
  
  /**
   * Update personality VFX
   */
  updatePersonalityVFX(node, state, vfx, deltaTime) {
    vfx.animationTime += deltaTime;
    
    // Get mood multipliers
    const moodMult = this.moodMultipliers[state.mood];
    
    // Update based on personality
    switch(state.personality) {
      case 'CURIOUS':
        this.updateCuriousVFX(node, state, vfx, moodMult, deltaTime);
        break;
      case 'AGGRESSIVE':
        this.updateAggressiveVFX(node, state, vfx, moodMult, deltaTime);
        break;
      case 'PASSIVE':
        this.updatePassiveVFX(node, state, vfx, moodMult, deltaTime);
        break;
      case 'ANALYTICAL':
        this.updateAnalyticalVFX(node, state, vfx, moodMult, deltaTime);
        break;
      case 'CHAOTIC':
        this.updateChaoticVFX(node, state, vfx, moodMult, deltaTime);
        break;
      case 'WISE':
        this.updateWiseVFX(node, state, vfx, moodMult, deltaTime);
        break;
    }
  }
  
  /**
   * CURIOUS personality - Orbiting lights, responsive glow
   */
  updateCuriousVFX(node, state, vfx, moodMult, deltaTime) {
    const params = this.personalityTypes.CURIOUS;
    
    // Create orbiting particles if needed
    while (vfx.orbits.length < params.orbitCount) {
      const orbitIndex = vfx.orbits.length;
      
      const geo = new THREE.SphereGeometry(0.08, 6, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: params.color,
        transparent: true,
        // FIX: MeshBasicMaterial does NOT support emissive properties
        fog: false
      });
      
      const orbit = new THREE.Mesh(geo, mat);
      orbit.userData = {
        isPersonalityVFX: true,
        type: 'curious_orbit',
        index: orbitIndex
      };
      
      this.scene.add(orbit);
      vfx.orbits.push(orbit);
    }
    
    // Update orbits
    vfx.orbits.forEach((orbit, idx) => {
      const angle = vfx.animationTime * params.orbitSpeed + (idx / params.orbitCount) * Math.PI * 2;
      orbit.position.copy(node.position);
      orbit.position.x += Math.cos(angle) * this.config.orbitRadius;
      orbit.position.z += Math.sin(angle) * this.config.orbitRadius;
      
      const pulse = 0.5 + Math.sin(vfx.animationTime * params.pulseSpeed) * 0.4;
      orbit.material.opacity = pulse * params.glowIntensity * moodMult.activityMult;
    });
  }
  
  /**
   * AGGRESSIVE personality - Fast pulses, shock rings
   */
  updateAggressiveVFX(node, state, vfx, moodMult, deltaTime) {
    const params = this.personalityTypes.AGGRESSIVE;
    
    // Create orbiting particles
    while (vfx.orbits.length < params.orbitCount) {
      const orbitIndex = vfx.orbits.length;
      
      const geo = new THREE.SphereGeometry(0.1, 6, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: params.color,
        transparent: true,
        emissive: params.color,
        emissiveIntensity: 1.0,
        fog: false
      });
      
      const orbit = new THREE.Mesh(geo, mat);
      orbit.userData = {
        isPersonalityVFX: true,
        type: 'aggressive_orbit',
        index: orbitIndex,
        phase: Math.random() * Math.PI * 2
      };
      
      this.scene.add(orbit);
      vfx.orbits.push(orbit);
    }
    
    // Update orbits with fast erratic movement
    vfx.orbits.forEach((orbit, idx) => {
      const phase = orbit.userData.phase + vfx.animationTime * params.orbitSpeed;
      const radiusVar = this.config.orbitRadius * (0.8 + Math.sin(phase * 2) * 0.2);
      
      orbit.position.copy(node.position);
      orbit.position.x += Math.cos(phase) * radiusVar;
      orbit.position.z += Math.sin(phase) * radiusVar;
      
      const pulse = 0.3 + Math.sin(vfx.animationTime * params.pulseSpeed * (1 + Math.random() * 0.3)) * 0.6;
      orbit.material.opacity = pulse * params.glowIntensity * moodMult.activityMult;
      
      // Occasional brightness spike
      // FIX: Only update emissive on materials that support it
      if (this.ensureEmissiveSafe(orbit.material)) {
        orbit.material.emissiveIntensity = Math.random() < 0.05 * moodMult.activityMult ? 1.5 : 1.0;
      }
    });
  }
  
  /**
   * PASSIVE personality - Soft glow, minimal activity
   */
  updatePassiveVFX(node, state, vfx, moodMult, deltaTime) {
    const params = this.personalityTypes.PASSIVE;
    
    // Create single gentle halo
    if (!vfx.haloRing) {
      const geo = new THREE.TorusGeometry(1.2, 0.1, 12, 32);
      const mat = new THREE.MeshBasicMaterial({
        color: params.color,
        transparent: true,
        // FIX: MeshBasicMaterial does NOT support emissive properties
        fog: false
      });
      
      vfx.haloRing = new THREE.Mesh(geo, mat);
      vfx.haloRing.rotation.x = Math.PI / 2;
      vfx.haloRing.userData = {
        isPersonalityVFX: true,
        type: 'passive_halo'
      };
      
      this.scene.add(vfx.haloRing);
    }
    
    // Update halo
    vfx.haloRing.position.copy(node.position);
    
    const breathe = 0.2 + Math.sin(vfx.animationTime * params.pulseSpeed) * 0.1;
    vfx.haloRing.material.opacity = breathe * params.glowIntensity * moodMult.glowMult;
    vfx.haloRing.scale.setScalar(1 + Math.sin(vfx.animationTime * 0.5) * 0.1);
  }
  
  /**
   * ANALYTICAL personality - Spinning hologram symbols
   */
  updateAnalyticalVFX(node, state, vfx, moodMult, deltaTime) {
    const params = this.personalityTypes.ANALYTICAL;
    
    // Create hologram symbols
    while (vfx.holoSymbols.length < 3) {
      const symbolIndex = vfx.holoSymbols.length;
      
      const geo = this._getAnalyticalSymbolGeometry();
      const mat = new THREE.MeshBasicMaterial({
        color: params.color,
        transparent: true,
        // FIX: MeshBasicMaterial does NOT support emissive properties
        fog: false
      });
      
      const symbol = new THREE.Mesh(geo, mat);
      symbol.userData = {
        isPersonalityVFX: true,
        type: 'analytical_symbol',
        index: symbolIndex
      };
      
      this.scene.add(symbol);
      vfx.holoSymbols.push(symbol);
    }
    
    // Update symbols with symmetric rotation
    vfx.holoSymbols.forEach((symbol, idx) => {
      const angle = vfx.animationTime * params.orbitSpeed + (idx / 3) * Math.PI * 2;
      
      symbol.position.copy(node.position);
      symbol.position.x += Math.cos(angle) * this.config.orbitRadius;
      symbol.position.z += Math.sin(angle) * this.config.orbitRadius;
      
      symbol.rotation.z = angle;
      
      const pulse = 0.5 + Math.sin(vfx.animationTime * params.pulseSpeed) * 0.3;
      symbol.material.opacity = pulse * params.glowIntensity * moodMult.glowMult;
    });
  }

  _getAnalyticalSymbolGeometry() {
    if (this._analyticalSymbolGeometry) return this._analyticalSymbolGeometry;

    const shape = new THREE.Shape();
    shape.moveTo(-0.16, 0.1);
    shape.lineTo(-0.04, 0.18);
    shape.lineTo(0.13, 0.18);
    shape.lineTo(0.2, 0.04);
    shape.lineTo(0.14, -0.16);
    shape.lineTo(-0.08, -0.18);
    shape.lineTo(-0.2, -0.04);
    shape.closePath();

    this._analyticalSymbolGeometry = new THREE.ShapeGeometry(shape, 1);
    return this._analyticalSymbolGeometry;
  }
  
  /**
   * CHAOTIC personality - Unpredictable pulses, rapid glitches
   */
  updateChaoticVFX(node, state, vfx, moodMult, deltaTime) {
    const params = this.personalityTypes.CHAOTIC;
    
    // Create many orbits
    while (vfx.orbits.length < params.orbitCount) {
      const orbitIndex = vfx.orbits.length;
      
      const geo = new THREE.SphereGeometry(0.06, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: params.color,
        transparent: true,
        // FIX: MeshBasicMaterial does NOT support emissive properties
        fog: false
      });
      
      const orbit = new THREE.Mesh(geo, mat);
      orbit.userData = {
        isPersonalityVFX: true,
        type: 'chaotic_orbit',
        index: orbitIndex,
        randomPhase: Math.random() * Math.PI * 2,
        randomSpeed: 1 + Math.random() * 3
      };
      
      this.scene.add(orbit);
      vfx.orbits.push(orbit);
    }
    
    // Update with chaotic movement
    vfx.orbits.forEach((orbit, idx) => {
      const phase = orbit.userData.randomPhase + vfx.animationTime * orbit.userData.randomSpeed;
      
      orbit.position.copy(node.position);
      orbit.position.x += Math.cos(phase) * (this.config.orbitRadius + Math.sin(phase * 3) * 0.3);
      orbit.position.z += Math.sin(phase) * (this.config.orbitRadius + Math.cos(phase * 3) * 0.3);
      
      // Erratic pulse
      const chaosRandom = Math.sin(phase * 7 + idx) * Math.cos(vfx.animationTime * 5);
      const pulse = 0.3 + chaosRandom * 0.6;
      orbit.material.opacity = Math.max(0, pulse * params.glowIntensity * moodMult.activityMult);
      
      // Random glitch
      if (Math.random() < 0.1 * moodMult.activityMult) {
        orbit.position.x += (Math.random() - 0.5) * 0.2;
        orbit.position.y += (Math.random() - 0.5) * 0.2;
        // FIX: Only update emissive on materials that support it
        if (this.ensureEmissiveSafe(orbit.material)) orbit.material.emissiveIntensity = 1.5;
      } else {
        // FIX: Only update emissive on materials that support it
        if (this.ensureEmissiveSafe(orbit.material)) orbit.material.emissiveIntensity = 0.9;
      }
    });
  }
  
  /**
   * WISE personality - Majestic multi-layer rings
   */
  updateWiseVFX(node, state, vfx, moodMult, deltaTime) {
    const params = this.personalityTypes.WISE;
    
    // Create multiple halo rings
    while (vfx.orbits.length < 3) {
      const ringIndex = vfx.orbits.length;
      
      const geo = new THREE.TorusGeometry(1.0 + ringIndex * 0.4, 0.08, 16, 32);
      const mat = new THREE.MeshBasicMaterial({
        color: params.color,
        transparent: true,
        // FIX: MeshBasicMaterial does NOT support emissive properties
        fog: false
      });
      
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = Math.PI / 2 + (ringIndex * Math.PI / 6);
      ring.userData = {
        isPersonalityVFX: true,
        type: 'wise_ring',
        index: ringIndex
      };
      
      this.scene.add(ring);
      vfx.orbits.push(ring);
    }
    
    // Update rings with slow majestic rotation
    vfx.orbits.forEach((ring, idx) => {
      ring.position.copy(node.position);
      
      ring.rotation.z += deltaTime * params.orbitSpeed * 0.3;
      
      const pulse = 0.4 + Math.sin(vfx.animationTime * params.pulseSpeed + idx) * 0.3;
      ring.material.opacity = pulse * params.glowIntensity * moodMult.glowMult;
    });
  }
  
  /**
   * Find node by ID in nodes array
   */
  findNodeById(nodeId, nodes) {
    if (!nodes) return null;
    
    for (const node of nodes) {
      const id = this.getNodeId(node);
      if (id === nodeId) return node;
    }
    
    return null;
  }
  
  /**
   * Remove personality when node is gone
   */
  removePersonality(nodeId) {
    const vfx = this.vfxContainers[nodeId];
    if (!vfx) return;
    
    // Clean up orbits
    vfx.orbits?.forEach(orbit => {
      this.scene.remove(orbit);
      if (orbit.geometry) orbit.geometry.dispose();
      if (orbit.material) orbit.material.dispose();
    });
    
    // Clean up halo
    if (vfx.haloRing) {
      this.scene.remove(vfx.haloRing);
      vfx.haloRing.geometry.dispose();
      vfx.haloRing.material.dispose();
    }
    
    // Clean up symbols
    vfx.holoSymbols?.forEach(symbol => {
      this.scene.remove(symbol);
      if (symbol.geometry && symbol.geometry !== this._analyticalSymbolGeometry) symbol.geometry.dispose();
      if (symbol.material) symbol.material.dispose();
    });
    
    // Clean up dust
    vfx.dustParticles?.forEach(dust => {
      this.scene.remove(dust);
      if (dust.geometry) dust.geometry.dispose();
      if (dust.material) dust.material.dispose();
    });
    
    delete this.registry[nodeId];
    delete this.vfxContainers[nodeId];
  }
  
  /**
   * Clean up dead entries
   */
  cleanupDeadEntries(nodes) {
    const nodeIds = new Set();
    if (nodes) {
      nodes.forEach(node => {
        nodeIds.add(this.getNodeId(node));
      });
    }
    
    // Remove personalities for deleted nodes
    const registryIds = Object.keys(this.registry);
    registryIds.forEach(nodeId => {
      if (!nodeIds.has(nodeId)) {
        this.removePersonality(nodeId);
      }
    });
  }
  
  /**
   * Set player interaction with node
   */
  playerInteractedWithNode(nodeId) {
    if (this.registry[nodeId]) {
      this.registry[nodeId].lastInteractionTime = performance.now();
      this.registry[nodeId].mood = 'CHARGED';
    }
  }
  
  /**
   * Get personality info for node
   */
  getPersonalityInfo(nodeId) {
    return this.registry[nodeId] || null;
  }
  
  /**
   * Get active personality count
   */
  getActivePersonalityCount() {
    return Object.keys(this.registry).length;
  }
  
  /**
   * Disable all personalities (safe shutdown)
   */
  disableAll() {
    const allNodeIds = Object.keys(this.registry);
    allNodeIds.forEach(nodeId => {
      this.removePersonality(nodeId);
    });
    
    this.registry = {};
    this.vfxContainers = {};
    this.interpretationAccumulator = this.interpretationInterval; // Force immediate semantic pass on re-enable
    if (this._analyticalSymbolGeometry) {
      this._analyticalSymbolGeometry.dispose();
      this._analyticalSymbolGeometry = null;
    }
  }
}
