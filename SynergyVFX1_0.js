import * as THREE from 'three';

/**
 * SynergyVFX1_0 - Synergy-Based Visual Effects Engine
 * 
 * A clean, visual-only system that adds beautiful synergy-based VFX to links and nodes.
 * No gameplay logic, no analytics, no AI scoring - purely visual.
 * 
 * Four Visual Layers:
 * (A) Glow Pulse Layer - Pulsing glow around links based on synergyStrength
 * (B) Chromatic Trails - Particles moving along link direction with color shifts
 * (C) Outer Synergy Aura - Soft halos around nodes with high synergy
 * (D) Synergy Burst - Temporary expanding rings triggered on demand
 * 
 * Performance: ~0.5-2ms per frame for 100+ links
 * Memory: ~200 bytes per link + per-node halos
 */
export class SynergyVFX1_0 {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.time = 0;
    
    // Configuration
    this.config = {
      // Glow Pulse parameters
      glowPulseMin: 0.8,
      glowPulseMax: 1.3,
      glowPulseSpeed: 2.0,
      glowBaseIntensity: 0.15,
      
      // Chromatic Trails
      trailParticleCount: 6,
      trailParticleSize: 0.04,
      trailVelocityBase: 0.02,
      trailFadeDistance: 0.8,
      
      // Synergy Aura
      auraThreshold: 0.4,        // Show aura if synergyStrength > this
      auraBaseRadius: 0.35,
      auraRadiusScale: 0.5,
      auraMaxOpacity: 0.6,
      auraRotationSpeed: 0.3,    // Radians per frame
      
      // Synergy Burst
      burstDuration: 0.7,        // 700ms
      burstExpandSpeed: 2.5,     // Units per second
      burstMaxRadius: 3.0,
      burstParticleCount: 12,
      burstParticleSpeed: 3.0,
    };
    
    // Per-link tracking
    this.linkData = new Map();    // linkId → { glowMaterial, trailParticles, ... }
    this.nodeAuras = new Map();   // nodeId → { auraMesh, haloRings, rotationAngle }
    this.activeBursts = [];       // Array of active burst objects
    this.trailParticles = [];     // All trail particles for update loop
    
    // Materials cache
    this.materials = this.createMaterials();
    
    // Counter for burst uniqueness
    this._burstIdCounter = 0;
  }
  
  /**
   * Create all required materials once
   */
  createMaterials() {
    const materials = {};
    
    // Basic additive material for glows/auras
    materials.additiveGlow = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    
    // Line material for glow pulse effect
    materials.lineGlow = new THREE.LineBasicMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      linewidth: 1,
    });
    
    // Point material for trail particles
    materials.trailParticles = new THREE.PointsMaterial({
      size: this.config.trailParticleSize,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    
    return materials;
  }
  
  /**
   * Register a link for synergy VFX tracking
   * Called when a new link is created
   * 
   * @param {Object} link - Link object with source, target nodes
   * @param {string} linkId - Unique identifier for the link
   */
  registerLink(link, linkId) {
    if (!link || !link.source || !link.target) {
      console.warn('[SynergyVFX] Invalid link object for registration');
      return;
    }
    
    try {
      // Initialize link data
      this.linkData.set(linkId, {
        link,
        glowMaterial: this.materials.lineGlow.clone(),
        glowMesh: null,
        trailParticles: [],
        trailGeometry: null,
        pulsePhase: Math.random() * Math.PI * 2,
        lastTrailSpawn: 0,
      });
      
      // Create glow geometry
      this.createLinkGlowGeometry(linkId, link);
    } catch (e) {
      console.error('[SynergyVFX] Error registering link:', e);
    }
  }
  
  /**
   * Create glow geometry for a link
   * @private
   */
  createLinkGlowGeometry(linkId, link) {
    const linkData = this.linkData.get(linkId);
    if (!linkData || !link.source || !link.target) return;
    
    try {
      // Get source and target positions
      const sourcePos = link.source.position.clone();
      const targetPos = link.target.position.clone();
      
      // Create a line geometry for the glow
      const glowGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array([
        sourcePos.x, sourcePos.y, sourcePos.z,
        targetPos.x, targetPos.y, targetPos.z,
      ]);
      
      glowGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      // Create line mesh (glow pulse)
      const glowMesh = new THREE.Line(glowGeometry, linkData.glowMaterial);
      glowMesh.frustumCulled = false;
      this.scene.add(glowMesh);
      linkData.glowMesh = glowMesh;
      
      // Create trail particle system
      const trailGeometry = new THREE.BufferGeometry();
      const trailPositions = new Float32Array(this.config.trailParticleCount * 3);
      trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
      
      const trailMaterial = this.materials.trailParticles.clone();
      const trailPoints = new THREE.Points(trailGeometry, trailMaterial);
      trailPoints.frustumCulled = false;
      this.scene.add(trailPoints);
      
      linkData.trailGeometry = trailGeometry;
      linkData.trailPoints = trailPoints;
      linkData.trailMaterial = trailMaterial;
      
      // Initialize trail particles
      for (let i = 0; i < this.config.trailParticleCount; i++) {
        this.trailParticles.push({
          position: sourcePos.clone(),
          velocity: new THREE.Vector3(0, 0, 0),
          age: 0,
          life: 1.0,
          color: new THREE.Color(),
          linkId,
        });
      }
    } catch (e) {
      console.error('[SynergyVFX] Error creating glow geometry:', e);
    }
  }
  
  /**
   * Unregister a link (cleanup on removal)
   */
  unregisterLink(linkId) {
    const linkData = this.linkData.get(linkId);
    if (!linkData) return;
    
    try {
      // Remove glow mesh
      if (linkData.glowMesh) {
        this.scene.remove(linkData.glowMesh);
        linkData.glowMesh.geometry.dispose();
        linkData.glowMaterial.dispose();
      }
      
      // Remove trail particles
      if (linkData.trailPoints) {
        this.scene.remove(linkData.trailPoints);
        linkData.trailGeometry?.dispose();
        linkData.trailMaterial?.dispose();
      }
      
      // Remove from tracking
      this.linkData.delete(linkId);
      this.trailParticles = this.trailParticles.filter(p => p.linkId !== linkId);
    } catch (e) {
      console.error('[SynergyVFX] Error unregistering link:', e);
    }
  }
  
  /**
   * Register a node for synergy aura effects
   */
  registerNode(node, nodeId) {
    if (!node) return;
    
    try {
      // Create aura halo rings
      const auraGroup = new THREE.Group();
      auraGroup.position.copy(node.position);
      this.scene.add(auraGroup);
      
      this.nodeAuras.set(nodeId, {
        node,
        auraGroup,
        haloRings: [],
        rotationAngle: Math.random() * Math.PI * 2,
        visible: false,
      });
    } catch (e) {
      console.error('[SynergyVFX] Error registering node:', e);
    }
  }
  
  /**
   * Unregister a node (cleanup)
   */
  unregisterNode(nodeId) {
    const auraData = this.nodeAuras.get(nodeId);
    if (!auraData) return;
    
    try {
      // Clean up halo rings
      auraData.haloRings.forEach(ring => {
        if (ring.mesh) {
          this.scene.remove(ring.mesh);
          ring.mesh.geometry.dispose();
          ring.mesh.material.dispose();
        }
      });
      
      // Remove aura group
      this.scene.remove(auraData.auraGroup);
      this.nodeAuras.delete(nodeId);
    } catch (e) {
      console.error('[SynergyVFX] Error unregistering node:', e);
    }
  }
  
  /**
   * Update synergy VFX for a link
   * Called each frame for active links
   * 
   * @param {Object} link - Link object
   * @param {string} linkId - Unique link identifier
   * @param {number} synergyStrength - 0-1 synergy value
   */
  updateLink(link, linkId, synergyStrength) {
    if (!link || synergyStrength < 0 || synergyStrength > 1) return;
    
    const linkData = this.linkData.get(linkId);
    if (!linkData) return;
    
    try {
      // (A) Glow Pulse Layer
      this.updateGlowPulse(linkData, link, synergyStrength);
      
      // (B) Chromatic Trails
      this.updateChromaticTrails(linkData, link, synergyStrength);
    } catch (e) {
      console.error('[SynergyVFX] Error updating link:', e);
    }
  }
  
  /**
   * (A) Update glow pulse effect on link
   * @private
   */
  updateGlowPulse(linkData, link, synergyStrength) {
    if (!linkData.glowMesh || !link.source || !link.target) return;
    
    // Pulse intensity based on synergy
    const pulseWave = Math.sin(this.time * this.config.glowPulseSpeed + linkData.pulsePhase) * 0.5 + 0.5;
    const intensity = THREE.MathUtils.lerp(
      this.config.glowPulseMin,
      this.config.glowPulseMax,
      pulseWave
    );
    
    // Color blend from source to target
    const sourceColor = link.source.color || new THREE.Color(0x00ddff);
    const targetColor = link.target.color || new THREE.Color(0xff00ff);
    const blendedColor = sourceColor.clone().lerp(targetColor, 0.5);
    
    // Apply glow
    const glowStrength = this.config.glowBaseIntensity * synergyStrength * intensity;
    linkData.glowMaterial.color.copy(blendedColor);
    linkData.glowMaterial.opacity = Math.min(glowStrength, 1.0);
    linkData.glowMaterial.linewidth = 1 + synergyStrength * 3;
    
    // Update line positions
    const geometry = linkData.glowMesh.geometry;
    const positions = geometry.attributes.position.array;
    const sourcePos = link.source.position;
    const targetPos = link.target.position;
    
    positions[0] = sourcePos.x;
    positions[1] = sourcePos.y;
    positions[2] = sourcePos.z;
    positions[3] = targetPos.x;
    positions[4] = targetPos.y;
    positions[5] = targetPos.z;
    
    geometry.attributes.position.needsUpdate = true;
  }
  
  /**
   * (B) Update chromatic trails along the link
   * @private
   */
  updateChromaticTrails(linkData, link, synergyStrength) {
    if (!link.source || !link.target) return;
    
    // Spawn new trail particles
    const sourcePos = link.source.position;
    const targetPos = link.target.position;
    const direction = targetPos.clone().sub(sourcePos).normalize();
    const distance = sourcePos.distanceTo(targetPos);
    
    // Spawn rate based on synergy
    const spawnRate = 0.1 + synergyStrength * 0.4;
    if (this.time - linkData.lastTrailSpawn > spawnRate) {
      linkData.lastTrailSpawn = this.time;
      
      // Spawn particle at mid-point to avoid per-frame randomness
      const t = 0.5;
      const spawnPos = sourcePos.clone().lerp(targetPos, t);
      
      const velocity = direction.clone().multiplyScalar(
        this.config.trailVelocityBase + synergyStrength * 0.05
      );
      
      // Color shift from source to target (fixed mid-blend)
      const colorT = 0.5;
      const sourceColor = link.source.color || new THREE.Color(0x00ddff);
      const targetColor = link.target.color || new THREE.Color(0xff00ff);
      
      // Create particle trail
      for (let i = 0; i < 2; i++) {
        const particle = {
          position: spawnPos.clone(),
          startPosition: spawnPos.clone(),
          velocity: velocity.clone(),
          baseVelocity: velocity.clone(),
          age: 0,
          life: 1.0 + synergyStrength * 0.5,
          color: sourceColor.clone().lerp(targetColor, colorT),
          linkId: linkData.link ? this.getLinkId(linkData.link) : null,
        };
        
        this.trailParticles.push(particle);
        linkData.trailParticles.push(particle);
      }
    }
    
    // Update trail geometry
    if (linkData.trailPoints && linkData.trailGeometry) {
      const positions = linkData.trailGeometry.attributes.position.array;
      const colors = [];
      
      for (let i = 0; i < Math.min(linkData.trailParticles.length, this.config.trailParticleCount); i++) {
        const p = linkData.trailParticles[i];
        positions[i * 3] = p.position.x;
        positions[i * 3 + 1] = p.position.y;
        positions[i * 3 + 2] = p.position.z;
        colors.push(p.color);
      }
      
      linkData.trailGeometry.attributes.position.needsUpdate = true;
      
      // Update material opacity
      linkData.trailMaterial.opacity = synergyStrength * 0.8;
    }
  }
  
  /**
   * Update synergy aura for a node
   * 
   * @param {Object} node - Node object with position and color
   * @param {string} nodeId - Unique node identifier
   * @param {number} synergyStrength - 0-1 synergy value
   */
  updateNodeAura(node, nodeId, synergyStrength) {
    if (synergyStrength < this.config.auraThreshold) {
      this.hideNodeAura(nodeId);
      return;
    }
    
    const auraData = this.nodeAuras.get(nodeId);
    if (!auraData) return;
    
    try {
      // Show or create halo rings
      if (!auraData.visible) {
        this.createNodeAuraHalos(auraData, node, synergyStrength);
        auraData.visible = true;
      }
      
      // Update aura position and rotation
      auraData.auraGroup.position.copy(node.position);
      auraData.rotationAngle += this.config.auraRotationSpeed;
      
      // Update halo rings
      const radius = this.config.auraBaseRadius * (1 + synergyStrength * this.config.auraRadiusScale);
      const opacity = synergyStrength * this.config.auraMaxOpacity;
      const nodeColor = node.color || new THREE.Color(0x00ffff);
      
      auraData.haloRings.forEach((ring, idx) => {
        if (ring.mesh) {
          ring.mesh.scale.set(radius, radius, radius);
          ring.mesh.rotation.z = auraData.rotationAngle + idx * Math.PI / auraData.haloRings.length;
          ring.mesh.material.opacity = opacity * (1 - idx * 0.3);
          ring.mesh.material.color.copy(nodeColor);
        }
      });
    } catch (e) {
      console.error('[SynergyVFX] Error updating node aura:', e);
    }
  }
  
  /**
   * Create halo rings for a node aura
   * @private
   */
  createNodeAuraHalos(auraData, node, synergyStrength) {
    const ringCount = Math.floor(1 + synergyStrength * 2);
    const nodeColor = node.color || new THREE.Color(0x00ffff);
    
    for (let i = 0; i < ringCount; i++) {
      const geometry = new THREE.TorusGeometry(1, 0.1, 8, 32);
      const material = new THREE.MeshBasicMaterial({
        color: nodeColor,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.5,
      });
      
      const ring = new THREE.Mesh(geometry, material);
      ring.scale.set(0.5, 0.5, 0.5);
      auraData.auraGroup.add(ring);
      
      auraData.haloRings.push({
        mesh: ring,
        material,
        baseOpacity: 0.5 - i * 0.1,
      });
    }
  }
  
  /**
   * Hide node aura
   * @private
   */
  hideNodeAura(nodeId) {
    const auraData = this.nodeAuras.get(nodeId);
    if (!auraData || !auraData.visible) return;
    
    try {
      auraData.haloRings.forEach(ring => {
        if (ring.mesh) ring.mesh.visible = false;
      });
      auraData.visible = false;
    } catch (e) {
      console.error('[SynergyVFX] Error hiding node aura:', e);
    }
  }
  
  /**
   * (D) Trigger a synergy burst effect
   * Temporary expanding ring + particles at link
   * 
   * @param {Object} link - Link object
   * @param {string} color - Hex color string (e.g. "#44EEFF")
   */
  triggerBurst(link, color = "#44EEFF") {
    if (!link || !link.source || !link.target) return;
    
    try {
      const burstId = this._burstIdCounter++;
      const sourcePos = link.source.position.clone();
      const targetPos = link.target.position.clone();
      const midpoint = sourcePos.clone().add(targetPos).multiplyScalar(0.5);
      
      const burstColor = new THREE.Color(color);
      
      // Create expanding ring geometry
      const ringGeometry = new THREE.TorusGeometry(0.1, 0.05, 16, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: burstColor,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.8,
      });
      
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      ringMesh.position.copy(midpoint);
      this.scene.add(ringMesh);
      
      // Create burst particles
      const particles = [];
      const direction = targetPos.clone().sub(sourcePos).normalize();
      
      for (let i = 0; i < this.config.burstParticleCount; i++) {
        const angle = (i / this.config.burstParticleCount) * Math.PI * 2;
        const speed = this.config.burstParticleSpeed;
        
        const velocity = new THREE.Vector3(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          (Math.random() - 0.5) * speed
        );
        
        particles.push({
          position: midpoint.clone(),
          velocity,
          age: 0,
          life: this.config.burstDuration,
          color: burstColor.clone(),
        });
      }
      
      this.activeBursts.push({
        burstId,
        ringMesh,
        particles,
        ringMaterial,
        startTime: this.time,
      });
    } catch (e) {
      console.error('[SynergyVFX] Error triggering burst:', e);
    }
  }
  
  /**
   * Main update loop - call every frame
   * 
   * @param {number} deltaTime - Frame delta time
   */
  update(deltaTime) {
    this.time += deltaTime;
    
    // Update trail particles
    this.updateTrailParticles(deltaTime);
    
    // Update burst effects
    this.updateBursts(deltaTime);
  }
  
  /**
   * Update all trail particles
   * @private
   */
  updateTrailParticles(deltaTime) {
    const updated = [];
    
    for (const particle of this.trailParticles) {
      particle.age += deltaTime;
      const progress = particle.age / particle.life;
      
      if (progress < 1.0) {
        // Compute position from base instead of incremental adds
        const dispX = particle.baseVelocity.x * particle.age;
        const dispY = particle.baseVelocity.y * particle.age;
        const dispZ = particle.baseVelocity.z * particle.age;
        particle.position.set(
          particle.startPosition.x + dispX,
          particle.startPosition.y + dispY,
          particle.startPosition.z + dispZ
        );
        
        // Apply fade
        particle.opacity = 1.0 - progress;
        
        updated.push(particle);
      }
    }
    
    this.trailParticles = updated;
  }
  
  /**
   * Update all burst effects
   * @private
   */
  updateBursts(deltaTime) {
    const active = [];
    
    for (const burst of this.activeBursts) {
      const elapsed = this.time - burst.startTime;
      const progress = elapsed / this.config.burstDuration;
      
      if (progress < 1.0) {
        // Expand ring
        const radius = 0.1 + progress * this.config.burstMaxRadius;
        burst.ringMesh.scale.set(radius, radius, radius);
        burst.ringMaterial.opacity = 0.8 * (1.0 - progress);
        
        // Update particles
        burst.particles.forEach(p => {
          const dispX = p.baseVelocity.x * elapsed;
          const dispY = p.baseVelocity.y * elapsed;
          const dispZ = p.baseVelocity.z * elapsed;
          p.position.set(
            p.startPosition.x + dispX,
            p.startPosition.y + dispY,
            p.startPosition.z + dispZ
          );
        });
        
        active.push(burst);
      } else {
        // Clean up
        this.scene.remove(burst.ringMesh);
        burst.ringMesh.geometry.dispose();
        burst.ringMaterial.dispose();
      }
    }
    
    this.activeBursts = active;
  }
  
  /**
   * Get link ID from link object
   * Helper function for tracking
   * @private
   */
  getLinkId(link) {
    if (!link) return null;
    return `${link.source.id || 0}-${link.target.id || 0}`;
  }
  
  /**
   * Console API - Trigger burst with console command
   * Usage: window.game.synergyVFX.triggerBurst(link, "#44EEFF")
   */
  setupConsoleAPI() {
    if (typeof window !== 'undefined') {
      if (!window.game) window.game = {};
      window.game.synergyVFX = {
        triggerBurst: this.triggerBurst.bind(this),
        getConfig: () => this.config,
        setConfig: (key, value) => {
          if (key in this.config) {
            this.config[key] = value;
            console.log(`[SynergyVFX] ${key} = ${value}`);
          }
        },
      };
    }
  }
  
  /**
   * Dispose all resources
   */
  dispose() {
    try {
      // Clean up all links
      for (const linkId of this.linkData.keys()) {
        this.unregisterLink(linkId);
      }
      
      // Clean up all nodes
      for (const nodeId of this.nodeAuras.keys()) {
        this.unregisterNode(nodeId);
      }
      
      // Clean up bursts
      this.activeBursts.forEach(burst => {
        this.scene.remove(burst.ringMesh);
        burst.ringMesh.geometry.dispose();
        burst.ringMaterial.dispose();
      });
      
      // Clear arrays
      this.linkData.clear();
      this.nodeAuras.clear();
      this.trailParticles = [];
      this.activeBursts = [];
    } catch (e) {
      console.error('[SynergyVFX] Error during dispose:', e);
    }
  }
}
