/**
 * SYNERGY CASCADE PROPAGATION VISUALIZER v1.0
 * 
 * Real-time visualization of synergy energy flowing through linked networks
 * Shows cascading synergy effects as they propagate from high-synergy nodes outward
 * 
 * CORE FEATURES:
 * ✓ Real-time cascade propagation from synergy sources
 * ✓ Dynamic wave visualization along links
 * ✓ Cascade intensity based on synergy scores
 * ✓ Multi-hop propagation with decay
 * ✓ Directional flow particles following cascade paths
 * ✓ Animated shimmer effects on cascade links
 * ✓ Propagation history tracking for visuals
 * ✓ Performance optimized (<3ms per frame for 500+ links)
 * ✓ Console debugging API
 * ✓ Integration with chain reaction system
 * 
 * VISUALIZATION TYPES:
 * 1. Wave Front: Animated pulse traveling along links
 * 2. Cascade Glow: Progressive link brightness intensification
 * 3. Flow Particles: Directional particles following cascade paths
 * 4. Ripple Effect: Concentric rings expanding from cascade source
 * 5. Harmonic Shimmer: Oscillating color bands along links
 * 
 * EVENT FLOW:
 * 1. Receive cascade events from semanticBus
 * 2. Store lightweight visual hops per cascade id
 * 3. Render visual effects from hop payload only
 * 4. Expire visual hops after short duration
 */

import * as THREE from 'three';

export class SynergyCascadeVisualizer {
  constructor(scene, linkingSystem, camera) {
    this.scene = scene;
    this.linkingSystem = linkingSystem;
    this.camera = camera;
    
    // Cascade tracking
    this.activeCascades = [];        // Active cascade propagations
    this.cascadeHistory = new Map(); // link → cascade history for visuals
    this.cascadeId = 0;             // Unique cascade identifiers
    
    // Performance tracking
    this.stats = {
      activeCascades: 0,
      linksAffected: 0,
      particlesActive: 0,
      lastUpdateTime: 0,
      framesProcessed: 0
    };
    
    // Configuration
    this.config = {
      enabled: true,
      detectionThreshold: 0.7,       // Legacy debug setting (visual only system)
      maxCascadeDistance: 5,         // Legacy debug setting (visual only system)
      baseIntensity: 1.0,            // Legacy debug setting (visual only system)
      decayPerHop: 0.75,             // Legacy debug setting (visual only system)
      propagationSpeed: 2.0,         // Speed of cascade traveling along link (units/sec)
      waveWidth: 0.3,                // Width of cascade wave front
      
      // Visual effects
      visualizations: {
        waveFront: true,              // Animated pulse along links
        cascadeGlow: true,             // Progressive brightness
        flowParticles: true,           // Directional particles
        rippleEffect: true,            // Expanding rings
        harmonicShimmer: true          // Oscillating colors
      },
      
      // Particle system
      particleCount: 8,               // Particles per active cascade
      particleSpeed: 1.5,             // Multiplier on propagation speed
      particleLifetime: 2.0,          // Seconds
      
      // Color scheme
      cascadeColor: new THREE.Color(0xffff00), // Yellow for cascade energy
      waveColor: new THREE.Color(0x00ffff),    // Cyan for wave front
      fadeColor: new THREE.Color(0xff00ff),    // Magenta for decay
      
      // Performance
      batchSize: 30,                  // Update cascades in batches
      updateFrequency: 1,             // Update every N frames
      maxActiveCascades: 50,          // Max simultaneous cascades
      hopLifetime: 0.7                // Seconds each hop stays visually active
    };
    
    // Cascade particles
    this.cascadeParticles = [];
    this.particlePool = [];
    this.maxPoolSize = 500;
    
    // Ripple effect system
    this.ripples = [];
    
    // Frame counter
    this.frameCounter = 0;
    this._semanticBus = null;
    this._semanticHandlers = null;
    
    // Debug mode
    this.debugMode = false;
    
    console.log('✅ SynergyCascadeVisualizer initialized');
    this.bindSemanticEvents();
    this.setupConsoleAPI();
  }
  
  /**
   * Main update function - call once per frame
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    if (!this.config.enabled || !this.linkingSystem) return;
    
    this.frameCounter++;
    this.stats.framesProcessed++;
    
    // Skip frames based on update frequency
    if (this.frameCounter % this.config.updateFrequency !== 0) {
      return;
    }
    
    const startTime = performance.now();
    
    // Update active cascades
    this.updateActiveCascades(deltaTime);
    
    // Update cascade particles
    this.updateCascadeParticles(deltaTime);
    
    // Update ripple effects
    this.updateRipples(deltaTime);
    
    // Cleanup dead cascades
    this.cleanupInactiveCascades();
    
    this.stats.lastUpdateTime = performance.now() - startTime;
    this.stats.activeCascades = this.activeCascades.length;
  }
  
  /**
   * Detect nodes with high synergy that should trigger cascades
   */
  bindSemanticEvents() {
    const semanticBus = globalThis?.semanticBus;
    if (!semanticBus) return;
    const on = semanticBus.on?.bind(semanticBus);
    if (!on) return;

    this._semanticBus = semanticBus;
    this._semanticHandlers = {
      onCascadeHop: (event = {}) => this.renderCascadeHop(event),
      onCascadeStart: (event = {}) => this.renderCascadeStart(event),
      onCascadeEnd: (event = {}) => this.renderCascadeEnd(event)
    };
    on('cascade.hop', this._semanticHandlers.onCascadeHop);
    on('cascade.start', this._semanticHandlers.onCascadeStart);
    on('cascade.end', this._semanticHandlers.onCascadeEnd);
  }

  _asVector3(value) {
    if (value instanceof THREE.Vector3) {
      return this._isValidWorldPosition(value) ? value.clone() : null;
    }
    if (value && typeof value.x === 'number' && typeof value.y === 'number' && typeof value.z === 'number') {
      const vec = new THREE.Vector3(value.x, value.y, value.z);
      return this._isValidWorldPosition(vec) ? vec : null;
    }
    if (Array.isArray(value) && value.length >= 3) {
      const x = Number(value[0]);
      const y = Number(value[1]);
      const z = Number(value[2]);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
      const vec = new THREE.Vector3(x, y, z);
      return this._isValidWorldPosition(vec) ? vec : null;
    }
    return null;
  }

  _isValidWorldPosition(pos) {
    if (!pos) return false;
    if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y) || !Number.isFinite(pos.z)) return false;
    return true;
  }

  _clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  _getOrCreateCascade(cascadeId, seedIntensity = 0) {
    let cascade = this.activeCascades.find(item => item.id === cascadeId);
    if (cascade) return cascade;
    cascade = {
      id: cascadeId,
      age: 0,
      isActive: true,
      rippleRadius: 0,
      rippleIntensity: this._clamp01(seedIntensity),
      completedLinks: new Set(),
      hops: []
    };
    this.activeCascades.push(cascade);
    if (this.activeCascades.length > this.config.maxActiveCascades) {
      this.activeCascades.shift();
    }
    return cascade;
  }

  renderCascadeStart(event = {}) {
    const cascadeId = event.cascadeId ?? event.id ?? `cascade-${++this.cascadeId}`;
    const intensity = this._clamp01(event.intensity ?? event.value ?? 1);
    this._getOrCreateCascade(cascadeId, intensity);
    const center = this._asVector3(event.center ?? event.position ?? event.origin);
    if (center && this.config.visualizations.rippleEffect) {
      this.createRipple(center, Math.max(0.2, intensity));
    }
  }

  renderCascadeHop(event = {}) {
    const cascadeId = event.cascadeId ?? event.id ?? `cascade-${++this.cascadeId}`;
    const intensity = this._clamp01(event.intensity ?? event.value ?? 1);
    const startPosition = this._asVector3(event.sourcePosition ?? event.fromPosition ?? event.origin ?? event.start);
    const targetPosition = this._asVector3(event.targetPosition ?? event.toPosition ?? event.center ?? event.end);
    const link = event.link ?? event.linkRef ?? null;
    if (!link && (!startPosition || !targetPosition)) return;

    const cascade = this._getOrCreateCascade(cascadeId, intensity);
    cascade.hops.push({
      link,
      intensity,
      age: 0,
      duration: this.config.hopLifetime,
      startPosition,
      targetPosition,
      createdAt: Date.now(),
      completed: false
    });
  }

  renderCascadeEnd(event = {}) {
    const cascadeId = event.cascadeId ?? event.id;
    if (cascadeId === undefined || cascadeId === null) return;
    const cascade = this.activeCascades.find(item => item.id === cascadeId);
    if (!cascade) return;
    cascade.isActive = false;
  }
  
  /**
   * Update all active cascades
   */
  updateActiveCascades(deltaTime) {
    if (this.activeCascades.length === 0) return;
    
    // Process in batches for performance
    for (let i = 0; i < this.activeCascades.length; i += this.config.batchSize) {
      const batch = this.activeCascades.slice(i, i + this.config.batchSize);
      this.processCascadeBatch(batch, deltaTime);
    }
    
    this.stats.linksAffected = this.getTotalAffectedLinks();
  }
  
  /**
   * Process a batch of cascades
   */
  processCascadeBatch(batch, deltaTime) {
    for (const cascade of batch) {
      if (!cascade.isActive) continue;
      
      cascade.age += deltaTime;
      
      for (let i = 0; i < cascade.hops.length; i++) {
        const hop = cascade.hops[i];
        hop.age += deltaTime;
        const progress = this._clamp01(hop.age / Math.max(0.0001, hop.duration));
        const propagation = {
          link: hop.link,
          intensity: hop.intensity,
          position: progress,
          startPosition: hop.startPosition,
          targetPosition: hop.targetPosition,
          completed: false
        };

        if (progress >= 1) {
          if (hop.link) {
            cascade.completedLinks.add(hop.link);
          }
          if (this.config.visualizations.rippleEffect && hop.targetPosition) {
            this.createRipple(hop.targetPosition, hop.intensity * 0.5);
          }
          propagation.completed = true;
          hop.completed = true;
        } else if (hop.link) {
          this.applyLinkCascadeEffects(hop.link, propagation);
        }

        if (this.config.visualizations.flowParticles) {
          this.spawnFlowParticles(propagation, cascade);
        }
      }
      
      cascade.hops = cascade.hops.filter(hop => !hop.completed);
      
      // Update ripple effect
      cascade.rippleRadius += this.config.propagationSpeed * deltaTime;
      cascade.rippleIntensity = Math.max(0, 1.0 - (cascade.age / 2.0)); // Fade over 2 seconds
      
      // Check if cascade is dead
      if (cascade.hops.length === 0 && cascade.age > 3.0) {
        cascade.isActive = false;
      }
    }
  }
  
  /**
   * Apply visual cascade effects to a link
   */
  applyLinkCascadeEffects(link, propagation) {
    if (!link || !link.mesh) return;
    
    // Get or create cascade history for this link
    if (!this.cascadeHistory.has(link)) {
      this.cascadeHistory.set(link, {
        cascadeIntensity: 0,
        wavePosition: 0,
        waveIntensity: 0,
        color: new THREE.Color()
      });
    }
    
    const history = this.cascadeHistory.get(link);
    
    // Update cascade intensity (max of all active cascades on this link)
    history.cascadeIntensity = Math.max(history.cascadeIntensity, propagation.intensity);
    
    // Update wave position for wave front visualization
    history.wavePosition = propagation.position;
    history.waveIntensity = propagation.intensity;
    
    // Apply visual effects
    if (this.config.visualizations.waveFront) {
      this.applyWaveFrontEffect(link, history, propagation);
    }
    
    if (this.config.visualizations.cascadeGlow) {
      this.applyCascadeGlowEffect(link, history, propagation);
    }
    
    if (this.config.visualizations.harmonicShimmer) {
      this.applyHarmonicShimmerEffect(link, history, propagation);
    }
  }
  
  /**
   * Apply wave front effect (animated pulse along link)
   */
  applyWaveFrontEffect(link, history, propagation) {
    const wavePos = propagation.position;
    const waveIntensity = propagation.intensity;
    
    // Create animated wave effect using link properties
    if (link.userData && !link.userData.cascadeWave) {
      link.userData.cascadeWave = {
        position: wavePos,
        intensity: waveIntensity,
        phase: 0
      };
    }
    
    link.userData.cascadeWave.position = wavePos;
    link.userData.cascadeWave.intensity = waveIntensity;
    link.userData.cascadeWave.phase = (Date.now() % 1000) / 1000; // Oscillation phase
    
    // Modify line width at wave position
    if (link.mesh && link.mesh.material) {
      const baseMaterial = link.mesh.material;
      const waveWidth = this.config.waveWidth;
      
      // Highlight wave position with brighter color
      const distance = Math.abs(wavePos - 0.5) * 2; // Distance from center
      const waveBrightness = Math.max(0, 1.0 - (distance / waveWidth));
      
      if (baseMaterial.emissive) {
        baseMaterial.emissive.copy(this.config.waveColor);
        baseMaterial.emissiveIntensity = Math.max(0, waveBrightness * waveIntensity);
      }
    }
  }
  
  /**
   * Apply cascade glow effect (progressive brightness)
   */
  applyCascadeGlowEffect(link, history, propagation) {
    if (!link.mesh || !link.mesh.material) return;
    
    const material = link.mesh.material;
    const cascadeIntensity = propagation.intensity;
    
    // Enhance glow based on cascade intensity
    if (material.emissive) {
      const baseColor = this.config.cascadeColor.clone();
      
      // Blend cascadeColor based on intensity
      material.emissive.copy(baseColor);
      material.emissiveIntensity = Math.max(material.emissiveIntensity || 0, cascadeIntensity * 1.5);
    }
    
    // Increase opacity slightly during cascade
    if (material.opacity !== undefined) {
      material.opacity = Math.min(1.0, (material.opacity || 0.75) + cascadeIntensity * 0.2);
    }
  }
  
  /**
   * Apply harmonic shimmer effect (oscillating color bands)
   */
  applyHarmonicShimmerEffect(link, history, propagation) {
    if (!link.mesh || !link.mesh.material) return;
    
    const material = link.mesh.material;
    const position = propagation.position;
    const intensity = propagation.intensity;
    
    // Create oscillating shimmer effect
    const shimmerFrequency = 8.0; // Oscillations per unit
    const shimmerPhase = (Date.now() % 1000) / 1000 * Math.PI * 2;
    
    const shimmerWave = Math.sin(position * shimmerFrequency + shimmerPhase);
    const shimmerAmount = Math.abs(shimmerWave) * intensity;
    
    // Apply shimmer by modulating emissive
    if (material.emissive) {
      const shimmerColor = this.config.cascadeColor.clone();
      shimmerColor.lerp(this.config.waveColor, shimmerWave * 0.5 + 0.5);
      
      material.emissive.copy(shimmerColor);
      material.emissiveIntensity = shimmerAmount * 2.0;
    }
  }
  
  /**
   * Spawn directional flow particles along cascade path
   */
  spawnFlowParticles(propagation, cascade) {
    const particleCount = Math.ceil(this.config.particleCount * propagation.intensity);
    const startPos = propagation.startPosition
      ?? propagation.startNode?.position
      ?? propagation.link?.source?.position
      ?? null;
    const targetPos = propagation.targetPosition
      ?? propagation.targetNode?.position
      ?? propagation.link?.target?.position
      ?? null;
    if (!this._isValidWorldPosition(startPos) || !this._isValidWorldPosition(targetPos)) return;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.getPooledParticle();
      
      if (!particle) break; // No more particles available
      
      // Calculate particle position
      const lerpPos = propagation.position + Math.random() * 0.1 - 0.05; // Slight randomness
      
      const position = new THREE.Vector3().lerpVectors(
        startPos,
        targetPos,
        Math.max(0, Math.min(1, lerpPos))
      );
      
      // Initialize particle
      particle.position.copy(position);
      particle.active = true;
      particle.lifetime = this.config.particleLifetime;
      particle.age = 0;
      particle.velocity = new THREE.Vector3().subVectors(
        targetPos,
        startPos
      ).normalize().multiplyScalar(this.config.particleSpeed * propagation.intensity);
      
      particle.intensity = propagation.intensity;
      particle.color = this.config.cascadeColor.clone();
      
      this.cascadeParticles.push(particle);
    }
  }
  
  /**
   * Update cascade particles
   */
  updateCascadeParticles(deltaTime) {
    for (let i = this.cascadeParticles.length - 1; i >= 0; i--) {
      const particle = this.cascadeParticles[i];
      
      if (!particle.active) continue;
      
      particle.age += deltaTime;
      
      // Update position
      particle.position.addScaledVector(particle.velocity, deltaTime);
      
      // Fade out
      const fadeRatio = 1.0 - (particle.age / particle.lifetime);
      if (fadeRatio <= 0) {
        particle.active = false;
        this.cascadeParticles.splice(i, 1);
        this.returnParticleToPool(particle);
        continue;
      }
      
      // Update particle mesh
      if (particle.mesh) {
        particle.mesh.position.copy(particle.position);
        particle.mesh.material.opacity = fadeRatio * 0.8;
        
        // Size decreases with age
        const scale = 1.0 - (particle.age / particle.lifetime) * 0.5;
        particle.mesh.scale.setScalar(scale);
      }
    }
    
    this.stats.particlesActive = this.cascadeParticles.length;
  }
  
  /**
   * Create ripple effect at position
   */
  createRipple(position, intensity) {
    const ripple = {
      center: position.clone(),
      startRadius: 0,
      maxRadius: 3.0 + intensity * 2.0,
      lifetime: 1.0,
      age: 0,
      intensity: intensity,
      mesh: null
    };
    
    // Create ripple geometry (expanding ring)
    const ringGeometry = new THREE.BufferGeometry();
    const ringPoints = [];
    const segments = 32;
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * 0.01; // Start small
      const z = Math.sin(angle) * 0.01;
      ringPoints.push(new THREE.Vector3(x, 0.01, z));
    }
    
    ringGeometry.setFromPoints(ringPoints);
    
    const rippleMaterial = new THREE.LineBasicMaterial({
      color: this.config.cascadeColor,
      linewidth: 2,
      transparent: true,
      opacity: intensity * 0.8
    });
    
    const rippleLine = new THREE.Line(ringGeometry, rippleMaterial);
    rippleLine.position.copy(position);
    
    ripple.mesh = rippleLine;
    this.scene.add(rippleLine);
    
    this.ripples.push(ripple);
  }
  
  /**
   * Update ripple effects
   */
  updateRipples(deltaTime) {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const ripple = this.ripples[i];
      
      ripple.age += deltaTime;
      const fadeRatio = 1.0 - (ripple.age / ripple.lifetime);
      
      if (fadeRatio <= 0) {
        if (ripple.mesh) {
          this.scene.remove(ripple.mesh);
          ripple.mesh.geometry.dispose();
          ripple.mesh.material.dispose();
        }
        this.ripples.splice(i, 1);
        continue;
      }
      
      // Update ripple radius
      const radius = ripple.startRadius + (ripple.maxRadius * (1.0 - fadeRatio));
      
      if (ripple.mesh) {
        ripple.mesh.scale.setScalar(radius / 0.01);
        ripple.mesh.material.opacity = fadeRatio * ripple.intensity * 0.6;
      }
    }
  }
  
  /**
   * Get pooled particle or create new one
   */
  getPooledParticle() {
    if (this.particlePool.length > 0) {
      return this.particlePool.pop();
    }
    
    if (this.cascadeParticles.length < this.maxPoolSize) {
      const geometry = new THREE.SphereGeometry(0.05, 4, 4);
      const material = new THREE.MeshBasicMaterial({
        color: this.config.cascadeColor,
        transparent: true
      });
      const mesh = new THREE.Mesh(geometry, material);
      this.scene.add(mesh);
      
      return {
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        mesh: mesh,
        active: false,
        lifetime: 0,
        age: 0,
        intensity: 0,
        color: new THREE.Color()
      };
    }
    
    return null;
  }
  
  /**
   * Return particle to pool
   */
  returnParticleToPool(particle) {
    particle.active = false;
    particle.age = 0;
    
    if (this.particlePool.length < this.maxPoolSize) {
      this.particlePool.push(particle);
    } else if (particle.mesh) {
      this.scene.remove(particle.mesh);
      particle.mesh.geometry.dispose();
      particle.mesh.material.dispose();
    }
  }
  
  /**
   * Cleanup inactive cascades and clean up visual state
   */
  cleanupInactiveCascades() {
    // Remove inactive cascades
    this.activeCascades = this.activeCascades.filter(c => c.isActive);
    
    // Clean up cascade history for completed links
    for (const [link, history] of this.cascadeHistory.entries()) {
      if (link && link.mesh && link.mesh.material) {
        // Reset link material to default
        if (link.mesh.material.emissiveIntensity !== undefined) {
          link.mesh.material.emissiveIntensity = 0;
        }
      }
    }
    
    // Periodically clear old history entries
    if (Math.random() < 0.01) { // 1% chance per frame
      const maxHistoryAge = 5000; // 5 seconds
      const now = Date.now();
      
      for (const [link, history] of this.cascadeHistory.entries()) {
        if (!link || !link.active) {
          this.cascadeHistory.delete(link);
        }
      }
    }
  }
  
  /**
   * Count total affected links
   */
  getTotalAffectedLinks() {
    let count = 0;
    for (const cascade of this.activeCascades) {
      count += cascade.hops.length;
    }
    return count;
  }
  
  /**
   * Manual cascade trigger (for testing/gameplay)
   */
  triggerCascadeAtNode(node, intensity = 1.0) {
    const position = node?.position ?? null;
    const startPayload = {
      id: `manual-${++this.cascadeId}`,
      intensity: this._clamp01(intensity),
      center: position
    };
    this.renderCascadeStart(startPayload);
  }
  
  /**
   * Clear all active cascades
   */
  clearAllCascades() {
    this.activeCascades = [];
    this.cascadeHistory.clear();
    this.cascadeParticles = [];
    
    // Clean up ripples
    for (const ripple of this.ripples) {
      if (ripple.mesh) {
        this.scene.remove(ripple.mesh);
        ripple.mesh.geometry.dispose();
        ripple.mesh.material.dispose();
      }
    }
    this.ripples = [];
    
    console.log('🗑️ All cascades cleared');
  }
  
  /**
   * Setup console debugging API
   */
  setupConsoleAPI() {
    window.cascadeDebug = {
      visualizer: this,
      
      enable: () => {
        this.config.enabled = true;
        console.log('✅ Cascade visualizer enabled');
      },
      
      disable: () => {
        this.config.enabled = false;
        console.log('❌ Cascade visualizer disabled');
      },
      
      toggle: () => {
        this.config.enabled = !this.config.enabled;
        console.log(`Cascade visualizer: ${this.config.enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
      },
      
      toggleDebug: () => {
        this.debugMode = !this.debugMode;
        console.log(`Debug mode: ${this.debugMode ? '🔴 ON' : '⚫ OFF'}`);
      },
      
      stats: () => {
        console.table({
          'Active Cascades': this.stats.activeCascades,
          'Links Affected': this.stats.linksAffected,
          'Active Particles': this.stats.particlesActive,
          'Last Frame Time': this.stats.lastUpdateTime.toFixed(2) + 'ms',
          'Frames Processed': this.stats.framesProcessed
        });
      },
      
      config: () => {
        console.log('📋 Cascade Configuration:', this.config);
      },
      
      setThreshold: (value) => {
        this.config.detectionThreshold = Math.max(0, Math.min(1, value));
        console.log(`🎯 Detection threshold: ${(this.config.detectionThreshold * 100).toFixed(0)}%`);
      },
      
      setSpeed: (value) => {
        this.config.propagationSpeed = Math.max(0.1, value);
        console.log(`⚡ Propagation speed: ${this.config.propagationSpeed.toFixed(2)}x`);
      },
      
      setParticles: (count) => {
        this.config.particleCount = Math.max(0, count);
        console.log(`💫 Particles per cascade: ${count}`);
      },
      
      setVisualizations: (types) => {
        Object.keys(types).forEach(key => {
          if (this.config.visualizations.hasOwnProperty(key)) {
            this.config.visualizations[key] = types[key];
          }
        });
        console.log('🎨 Visualizations updated:', this.config.visualizations);
      },
      
      trigger: (nodeIndex = 0) => {
        console.log('⚠️ Manual node-index trigger disabled in event-driven mode');
      },
      
      triggerMultiple: (count = 3) => {
        console.log('⚠️ Random cascade trigger disabled in event-driven mode');
      },
      
      clear: () => {
        this.clearAllCascades();
      },
      
      help: () => {
        console.log(`
🎯 SYNERGY CASCADE VISUALIZER DEBUG API
=====================================
cascadeDebug.enable()              - Enable cascade visualizations
cascadeDebug.disable()             - Disable cascade visualizations
cascadeDebug.toggle()              - Toggle on/off
cascadeDebug.toggleDebug()         - Toggle debug logging
cascadeDebug.stats()               - Show performance stats
cascadeDebug.config()              - Show current configuration
cascadeDebug.setThreshold(0.7)     - Set detection threshold (0-1)
cascadeDebug.setSpeed(2.0)         - Set propagation speed multiplier
cascadeDebug.setParticles(8)       - Set particles per cascade
cascadeDebug.setVisualizations({   - Toggle visualization types
  waveFront: true,
  cascadeGlow: true,
  flowParticles: true,
  rippleEffect: true,
  harmonicShimmer: true
})
cascadeDebug.trigger(nodeIndex)    - Trigger cascade at specific node
cascadeDebug.triggerMultiple(3)    - Trigger N random cascades
cascadeDebug.clear()               - Clear all active cascades
cascadeDebug.help()                - Show this help
        `);
      }
    };
    
    console.log('💡 Cascade debugging API available at: cascadeDebug');
  }

  dispose() {
    // Unsubscribe semantic listeners to prevent duplicate handlers after world switch.
    const bus = this._semanticBus;
    const handlers = this._semanticHandlers;
    const off = bus?.off?.bind(bus) || bus?.unsubscribe?.bind(bus);
    if (off && handlers) {
      try { off('cascade.hop', handlers.onCascadeHop); } catch (_) {}
      try { off('cascade.start', handlers.onCascadeStart); } catch (_) {}
      try { off('cascade.end', handlers.onCascadeEnd); } catch (_) {}
    }
    this._semanticBus = null;
    this._semanticHandlers = null;

    this.clearAllCascades();
  }
}
