import * as THREE from 'three';

/**
 * METRIC-REACTIVE WORLD EVENTS 1.0 (SAFE EDITION)
 * 
 * Environmental effects that react to ATOMA Core Metrics.
 * 100% visual-only, cosmetic, non-destructive.
 * 
 * Features:
 * - Synergy Events: Coherence Wave, Unity Pulse
 * - Harmony Events: Calm Bloom, Harmonic Ascension
 * - Instability Events: Distortion Drift, Quantum Spiral
 * - Corruption Events: Shadow Flicker, Umbra Echo
 * - Load Events: Overlink Glow, Network Surge
 * - Temporal Events: Cycle/Epoch/Aeon moments
 * 
 * SAFETY: No physics, no camera manipulation, no gameplay changes
 */

export class MetricReactiveWorldEvents {
  constructor(scene, renderer, coreMetricsOverlay) {
    this.scene = scene;
    this.renderer = renderer;
    this.coreMetricsOverlay = coreMetricsOverlay;
    
    this.enabled = true;
    this.debugMode = false;
    
    // Event state tracking
    this.eventStates = {
      lastSynergyEvent: 0,
      lastHarmonyEvent: 0,
      lastInstabilityEvent: 0,
      lastCorruptionEvent: 0,
      lastLoadEvent: 0,
      lastTemporalEvent: 0,
      
      // Metric thresholds for events
      synergyCoherence: false,
      synergyUnity: false,
      harmonyCalm: false,
      harmonyAscension: false,
      instabilityDrift: false,
      instabilitySpiral: false,
      corruptionFlicker: false,
      corruptionUmbra: false,
      loadOverlink: false,
      loadSurge: false
    };
    
    // Cooldown periods (seconds)
    this.cooldowns = {
      synergy: 60,
      harmony: 60,
      instability: 45,
      corruption: 45,
      load: 45,
      temporal: 0  // No cooldown for temporal
    };
    
    // Active effects tracking
    this.activeEffects = new Map();
    
    // Performance monitoring
    this.lastUpdateTime = performance.now();
    this.performanceMonitor = {
      averageTimeMs: 0,
      updateCount: 0,
      maxTimeMs: 0
    };
    
    // Scene references for overlays
    this.overlayGroup = new THREE.Group();
    this.overlayGroup.name = 'metric-reactive-overlays';
    this.scene.add(this.overlayGroup);
    
    console.log('✓ Metric-Reactive World Events 1.0 initialized');
  }
  
  /**
   * Main update loop - call every frame
   */
  update(deltaTime) {
    if (!this.enabled) return;
    
    try {
      const startTime = performance.now();
      
      // Get current metrics
      if (!this.coreMetricsOverlay) return;
      
      const metrics = this.coreMetricsOverlay.getMetrics();
      const currentTime = performance.now() / 1000; // Convert to seconds
      
      // Update active effects
      this.updateActiveEffects(deltaTime);
      
      // Check and trigger events based on metrics
      this.checkSynergyEvents(metrics, currentTime);
      this.checkHarmonyEvents(metrics, currentTime);
      this.checkInstabilityEvents(metrics, currentTime);
      this.checkCorruptionEvents(metrics, currentTime);
      this.checkLoadEvents(metrics, currentTime);
      
      // Monitor performance
      const elapsed = performance.now() - startTime;
      this.updatePerformanceMonitor(elapsed);
      
      // Auto-disable if performance critical
      if (elapsed > 0.3) {
        console.warn(`Metric events overhead high: ${elapsed.toFixed(2)}ms`);
        if (elapsed > 1.0) {
          this.disable();
        }
      }
      
    } catch (error) {
      console.error('Error in metric-reactive events:', error);
      this.disable();
    }
  }
  
  /**
   * Update temporal events
   */
  updateTemporalEvents(temporalEvents) {
    if (!this.enabled) return;
    
    try {
      if (temporalEvents.newCycle) {
        this.triggerCycleTurnover();
      }
      if (temporalEvents.newEpoch) {
        this.triggerEpochTurnover();
      }
      if (temporalEvents.newAeon) {
        this.triggerAeonMoment();
      }
    } catch (error) {
      console.warn('Error triggering temporal events:', error);
    }
  }
  
  /**
   * Check and trigger Synergy events
   */
  checkSynergyEvents(metrics, currentTime) {
    const synergy = metrics.synergy;
    const lastEvent = this.eventStates.lastSynergyEvent;
    const canTrigger = currentTime - lastEvent > this.cooldowns.synergy;
    
    // Coherence Wave (60%+)
    if (synergy > 60 && canTrigger && !this.eventStates.synergyCoherence) {
      this.triggerCoherenceWave();
      this.eventStates.lastSynergyEvent = currentTime;
      this.eventStates.synergyCoherence = true;
    } else if (synergy <= 60) {
      this.eventStates.synergyCoherence = false;
    }
    
    // Unity Pulse (85%+)
    if (synergy > 85 && canTrigger && !this.eventStates.synergyUnity) {
      this.triggerUnityPulse();
      this.eventStates.lastSynergyEvent = currentTime;
      this.eventStates.synergyUnity = true;
    } else if (synergy <= 85) {
      this.eventStates.synergyUnity = false;
    }
  }
  
  /**
   * Check and trigger Harmony events
   */
  checkHarmonyEvents(metrics, currentTime) {
    const harmony = metrics.harmony;
    const lastEvent = this.eventStates.lastHarmonyEvent;
    const canTrigger = currentTime - lastEvent > this.cooldowns.harmony;
    
    // Calm Bloom (55%+)
    if (harmony > 55 && canTrigger && !this.eventStates.harmonyCalm) {
      this.triggerCalmBloom();
      this.eventStates.lastHarmonyEvent = currentTime;
      this.eventStates.harmonyCalm = true;
    } else if (harmony <= 55) {
      this.eventStates.harmonyCalm = false;
    }
    
    // Harmonic Ascension (80%+)
    if (harmony > 80 && canTrigger && !this.eventStates.harmonyAscension) {
      this.triggerHarmonicAscension();
      this.eventStates.lastHarmonyEvent = currentTime;
      this.eventStates.harmonyAscension = true;
    } else if (harmony <= 80) {
      this.eventStates.harmonyAscension = false;
    }
  }
  
  /**
   * Check and trigger Instability events
   */
  checkInstabilityEvents(metrics, currentTime) {
    const instability = metrics.instability;
    const lastEvent = this.eventStates.lastInstabilityEvent;
    const canTrigger = currentTime - lastEvent > this.cooldowns.instability;
    
    // Distortion Drift (40%+)
    if (instability > 40 && canTrigger && !this.eventStates.instabilityDrift) {
      this.triggerDistortionDrift();
      this.eventStates.lastInstabilityEvent = currentTime;
      this.eventStates.instabilityDrift = true;
    } else if (instability <= 40) {
      this.eventStates.instabilityDrift = false;
    }
    
    // Quantum Spiral (70%+)
    if (instability > 70 && canTrigger && !this.eventStates.instabilitySpiral) {
      this.triggerQuantumSpiral();
      this.eventStates.lastInstabilityEvent = currentTime;
      this.eventStates.instabilitySpiral = true;
    } else if (instability <= 70) {
      this.eventStates.instabilitySpiral = false;
    }
  }
  
  /**
   * Check and trigger Corruption events
   */
  checkCorruptionEvents(metrics, currentTime) {
    const corruption = metrics.corruption;
    const lastEvent = this.eventStates.lastCorruptionEvent;
    const canTrigger = currentTime - lastEvent > this.cooldowns.corruption;
    
    // Shadow Flicker (20%+)
    if (corruption > 20 && canTrigger && !this.eventStates.corruptionFlicker) {
      this.triggerShadowFlicker();
      this.eventStates.lastCorruptionEvent = currentTime;
      this.eventStates.corruptionFlicker = true;
    } else if (corruption <= 20) {
      this.eventStates.corruptionFlicker = false;
    }
    
    // Umbra Echo (45%+)
    if (corruption > 45 && canTrigger && !this.eventStates.corruptionUmbra) {
      this.triggerUmbraEcho();
      this.eventStates.lastCorruptionEvent = currentTime;
      this.eventStates.corruptionUmbra = true;
    } else if (corruption <= 45) {
      this.eventStates.corruptionUmbra = false;
    }
  }
  
  /**
   * Check and trigger Load events
   */
  checkLoadEvents(metrics, currentTime) {
    const load = metrics.networkLoad;
    const lastEvent = this.eventStates.lastLoadEvent;
    const canTrigger = currentTime - lastEvent > this.cooldowns.load;
    
    // Overlink Glow (60%+)
    if (load > 60 && canTrigger && !this.eventStates.loadOverlink) {
      this.triggerOverlinkGlow();
      this.eventStates.lastLoadEvent = currentTime;
      this.eventStates.loadOverlink = true;
    } else if (load <= 60) {
      this.eventStates.loadOverlink = false;
    }
    
    // Network Surge (85%+)
    if (load > 85 && canTrigger && !this.eventStates.loadSurge) {
      this.triggerNetworkSurge();
      this.eventStates.lastLoadEvent = currentTime;
      this.eventStates.loadSurge = true;
    } else if (load <= 85) {
      this.eventStates.loadSurge = false;
    }
  }
  
  /**
   * ==================== SYNERGY EVENTS ====================
   */
  
  triggerCoherenceWave() {
    if (this.debugMode) console.log('► Coherence Wave triggered');
    
    // Create horizontal shimmer overlay
    const shimmer = this.createShimmerOverlay(0.5, 2.0, '#00ccdd');
    this.registerEffect('coherence-wave', shimmer, 2.5);
  }
  
  triggerUnityPulse() {
    if (this.debugMode) console.log('► Unity Pulse triggered');
    
    // Create teal background tint
    const tint = this.createColorTint('#00ddaa', 0.08, 1.5, 2.0);
    this.registerEffect('unity-pulse', tint, 3.5);
    
    // Add orbital micro-particles
    this.createOrbitalParticles(8, 4.0, '#00ccdd');
  }
  
  /**
   * ==================== HARMONY EVENTS ====================
   */
  
  triggerCalmBloom() {
    if (this.debugMode) console.log('► Calm Bloom triggered');
    
    // Increase bloom (shader-based, safe)
    this.applyBloomPulse(0.12, 1.5, 2.0);
    
    // Create floating particles
    this.createFloatingParticles(6, 3.0, '#00dd99');
  }
  
  triggerHarmonicAscension() {
    if (this.debugMode) console.log('► Harmonic Ascension triggered');
    
    // Create sky glyph
    this.createSkyGlyph('◎', 4.0);
    
    // Apply soft halo effect
    this.applyHaloEffect(2.0, '#00dd99');
  }
  
  /**
   * ==================== INSTABILITY EVENTS ====================
   */
  
  triggerDistortionDrift() {
    if (this.debugMode) console.log('► Distortion Drift triggered');
    
    // Create refractive distortion (safe, < 2%)
    const distortion = this.createDistortionOverlay(0.02, 1.5, 2.0);
    this.registerEffect('distortion-drift', distortion, 2.0);
    
    // Add jittering particles
    this.createJitteringParticles(4, 1.5, '#ff99ff');
  }
  
  triggerQuantumSpiral() {
    if (this.debugMode) console.log('► Quantum Spiral triggered');
    
    // Create spiral glyph overlay
    this.createSpiralGlyph(3.0);
    
    // Add rotating particles
    this.createRotatingParticles(8, 3.0, '#9900ff');
    
    // Tint toward purple
    const tint = this.createColorTint('#9900dd', 0.05, 1.0, 2.0);
    this.registerEffect('quantum-spiral', tint, 3.0);
  }
  
  /**
   * ==================== CORRUPTION EVENTS ====================
   */
  
  triggerShadowFlicker() {
    if (this.debugMode) console.log('► Shadow Flicker triggered');
    
    // Create radial gradient overlay
    const shadow = this.createRadialGradient(0.4, 0.8, '#000000');
    this.registerEffect('shadow-flicker', shadow, 0.8);
    
    // Add void fragments
    this.createVoidFragments(4, 1.5, '#330033');
  }
  
  triggerUmbraEcho() {
    if (this.debugMode) console.log('► Umbra Echo triggered');
    
    // Dim nodes slightly
    this.applyNodeDimming(0.07, 1.5, 2.0);
    
    // Create magenta line (visual only)
    this.createMagentaLine(1.5);
    
    // Horizon pulse
    this.applyHorizonPulse('#220000', 1.0, 1.5);
  }
  
  /**
   * ==================== LOAD EVENTS ====================
   */
  
  triggerOverlinkGlow() {
    if (this.debugMode) console.log('► Overlink Glow triggered');
    
    // Thicken links (shader overlay)
    this.applyLinkThickening(0.5, 1.5, 2.0);
  }
  
  triggerNetworkSurge() {
    if (this.debugMode) console.log('► Network Surge triggered');
    
    // Create sky beam effect
    this.createSkyBeam(2.0);
    
    // Intensify link trails
    this.applyLinkIntensification(2.0);
    
    // Bloom spike
    this.applyBloomPulse(0.15, 0.5, 1.5);
  }
  
  /**
   * ==================== TEMPORAL EVENTS ====================
   */
  
  triggerCycleTurnover() {
    if (this.debugMode) console.log('► Cycle Turnover triggered');
    
    // Ring wave expands outward
    this.createExpandingRing(0.4, '#00ccdd');
  }
  
  triggerEpochTurnover() {
    if (this.debugMode) console.log('► Epoch Turnover triggered');
    
    // Sky tint blue/teal
    const tint = this.createColorTint('#00aadd', 0.05, 0.5, 1.5);
    this.registerEffect('epoch-turnover', tint, 2.0);
    
    // Arc sweep
    this.createArcSweep(2.0, '#0099dd');
  }
  
  triggerAeonMoment() {
    if (this.debugMode) console.log('► Aeon Moment triggered (RARE)');
    
    // Golden glyph at center
    this.createGoldenGlyph('◎', 4.0);
  }
  
  /**
   * ==================== HELPER METHODS ====================
   */
  
  /**
   * Create shimmer overlay
   */
  createShimmerOverlay(intensityStart, fadeOutDuration, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const geometry = new THREE.PlaneGeometry(20, 2);
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.y = 5;
    mesh.renderOrder = 1;
    
    return mesh;
  }
  
  /**
   * Create color tint overlay
   */
  createColorTint(color, intensity, fadeInDuration, fadeOutDuration) {
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: intensity,
      depthWrite: false
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -50;
    mesh.renderOrder = 0;
    
    mesh.userData.tintData = {
      fadeInDuration,
      fadeOutDuration,
      elapsedTime: 0,
      isActive: true
    };
    
    return mesh;
  }
  
  /**
   * Create orbital particles
   */
  createOrbitalParticles(count, duration, color) {
    const particleGroup = new THREE.Group();
    particleGroup.name = 'orbital-particles';
    
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.6
      });
      
      const particle = new THREE.Mesh(geometry, material);
      const angle = (i / count) * Math.PI * 2;
      const radius = 3 + Math.random() * 2;
      
      particle.position.set(
        Math.cos(angle) * radius,
        2 + Math.random() * 3,
        Math.sin(angle) * radius
      );
      
      particle.userData.particleData = {
        angle,
        radius,
        duration,
        elapsedTime: 0,
        orbitalSpeed: Math.random() * 2 + 1
      };
      
      particleGroup.add(particle);
    }
    
    this.overlayGroup.add(particleGroup);
  }
  
  /**
   * Create floating particles
   */
  createFloatingParticles(count, duration, color) {
    const particleGroup = new THREE.Group();
    particleGroup.name = 'floating-particles';
    
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.SphereGeometry(0.08, 6, 6);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.5
      });
      
      const particle = new THREE.Mesh(geometry, material);
      particle.position.set(
        (Math.random() - 0.5) * 10,
        Math.random() * 5,
        (Math.random() - 0.5) * 10
      );
      
      particle.userData.floatData = {
        duration,
        elapsedTime: 0,
        driftY: Math.random() * 2 + 1,
        driftX: (Math.random() - 0.5) * 1
      };
      
      particleGroup.add(particle);
    }
    
    this.overlayGroup.add(particleGroup);
  }
  
  /**
   * Create sky glyph
   */
  createSkyGlyph(glyphChar, duration) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 200px Arial';
    ctx.fillStyle = '#00dd99';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyphChar, 128, 128);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      emissive: 0x00dd99,
      emissiveIntensity: 0.5
    });
    
    const geometry = new THREE.PlaneGeometry(5, 5);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 15, -20);
    mesh.renderOrder = 1;
    
    mesh.userData.glyphData = { duration, elapsedTime: 0 };
    
    this.overlayGroup.add(mesh);
  }
  
  /**
   * Create spiral glyph
   */
  createSpiralGlyph(duration) {
    // Create spiral line visual
    const geometry = new THREE.BufferGeometry();
    const points = [];
    
    for (let i = 0; i < 100; i++) {
      const angle = (i / 100) * Math.PI * 4;
      const radius = i / 20;
      points.push(
        Math.cos(angle) * radius,
        i / 50,
        Math.sin(angle) * radius
      );
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    const material = new THREE.LineBasicMaterial({ color: 0x9900ff, linewidth: 2 });
    const line = new THREE.Line(geometry, material);
    
    line.position.set(0, 5, 0);
    line.userData.spiralData = { duration, elapsedTime: 0 };
    
    this.overlayGroup.add(line);
  }
  
  /**
   * Create rotating particles
   */
  createRotatingParticles(count, duration, color) {
    const particleGroup = new THREE.Group();
    particleGroup.name = 'rotating-particles';
    
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.SphereGeometry(0.12, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.4
      });
      
      const particle = new THREE.Mesh(geometry, material);
      const angle = (i / count) * Math.PI * 2;
      
      particle.position.set(
        Math.cos(angle) * 4,
        0,
        Math.sin(angle) * 4
      );
      
      particle.userData.rotateData = {
        angle,
        duration,
        elapsedTime: 0,
        rotationSpeed: Math.random() * 3 + 2
      };
      
      particleGroup.add(particle);
    }
    
    this.overlayGroup.add(particleGroup);
  }
  
  /**
   * Create radial gradient overlay
   */
  createRadialGradient(maxIntensity, fadeOutDuration, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 180);
    gradient.addColorStop(0, 'rgba(0,0,0,0.5)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: maxIntensity
    });
    
    const geometry = new THREE.PlaneGeometry(50, 50);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -40;
    mesh.renderOrder = 0;
    
    return mesh;
  }
  
  /**
   * Create void fragments
   */
  createVoidFragments(count, duration, color) {
    const particleGroup = new THREE.Group();
    particleGroup.name = 'void-fragments';
    
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.SphereGeometry(0.15, 4, 4);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.3
      });
      
      const particle = new THREE.Mesh(geometry, material);
      particle.position.set(
        (Math.random() - 0.5) * 10,
        0,
        (Math.random() - 0.5) * 10
      );
      
      particle.userData.voidData = {
        duration,
        elapsedTime: 0,
        driftY: Math.random() * 3 + 2
      };
      
      particleGroup.add(particle);
    }
    
    this.overlayGroup.add(particleGroup);
  }
  
  /**
   * Create magenta line (visual overlay)
   */
  createMagentaLine(duration) {
    const geometry = new THREE.BufferGeometry();
    const points = [];
    
    for (let i = 0; i <= 100; i++) {
      const x = (i / 100) * 40 - 20;
      points.push(x, -1, 0);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    const material = new THREE.LineBasicMaterial({ color: 0xdd0099, linewidth: 2 });
    const line = new THREE.Line(geometry, material);
    
    line.userData.lineData = { duration, elapsedTime: 0 };
    this.overlayGroup.add(line);
  }
  
  /**
   * Create expanding ring
   */
  createExpandingRing(duration, color) {
    const geometry = new THREE.RingGeometry(0.5, 1.0, 32);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0;
    mesh.rotation.x = Math.PI / 2.5;
    
    mesh.userData.ringData = { duration, elapsedTime: 0, scale: 1 };
    
    this.overlayGroup.add(mesh);
  }
  
  /**
   * Create arc sweep
   */
  createArcSweep(duration, color) {
    const geometry = new THREE.BufferGeometry();
    const points = [];
    
    for (let i = 0; i <= 60; i++) {
      const angle = (i / 60) * Math.PI;
      const radius = 30;
      points.push(
        Math.cos(angle) * radius,
        10,
        Math.sin(angle) * radius
      );
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    const material = new THREE.LineBasicMaterial({ color: new THREE.Color(color), linewidth: 2 });
    const line = new THREE.Line(geometry, material);
    
    line.userData.arcData = { duration, elapsedTime: 0 };
    this.overlayGroup.add(line);
  }
  
  /**
   * Create golden glyph
   */
  createGoldenGlyph(glyphChar, duration) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#ffff00');
    gradient.addColorStop(0.5, '#ffdd00');
    gradient.addColorStop(1, '#ffff00');
    
    ctx.font = 'bold 400px Arial';
    ctx.fillStyle = gradient;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyphChar, 256, 256);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      emissive: 0xffdd00,
      emissiveIntensity: 0.8
    });
    
    const geometry = new THREE.PlaneGeometry(10, 10);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 20, -30);
    mesh.renderOrder = 2;
    
    mesh.userData.goldenData = { duration, elapsedTime: 0, pulsePhase: 0 };
    
    this.overlayGroup.add(mesh);
  }
  
  /**
   * Create sky beam
   */
  createSkyBeam(duration) {
    const geometry = new THREE.PlaneGeometry(0.5, 30);
    const material = new THREE.MeshBasicMaterial({
      color: 0xaa00ff,
      transparent: true,
      opacity: 0.3,
      emissive: 0xaa00ff,
      emissiveIntensity: 0.5
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(Math.random() * 20 - 10, 15, Math.random() * 20 - 10);
    mesh.rotation.z = Math.random() * 0.3 - 0.15;
    
    mesh.userData.beamData = { duration, elapsedTime: 0 };
    this.overlayGroup.add(mesh);
  }
  
  /**
   * Update active effects
   */
  updateActiveEffects(deltaTime) {
    const toRemove = [];
    
    this.overlayGroup.children.forEach(child => {
      // Update particle effects
      if (child.children && child.children.length > 0) {
        child.children.forEach(particle => {
          if (particle.userData.particleData) {
            particle.userData.particleData.elapsedTime += deltaTime;
            
            // Update orbital particles
            if (particle.userData.particleData.angle !== undefined) {
              const angle = particle.userData.particleData.angle + 
                           particle.userData.particleData.orbitalSpeed * particle.userData.particleData.elapsedTime;
              const radius = particle.userData.particleData.radius;
              
              particle.position.x = Math.cos(angle) * radius;
              particle.position.z = Math.sin(angle) * radius;
            }
            
            // Fade out
            if (particle.material) {
              const progress = particle.userData.particleData.elapsedTime / particle.userData.particleData.duration;
              particle.material.opacity = 0.6 * (1 - progress);
            }
            
            if (particle.userData.particleData.elapsedTime > particle.userData.particleData.duration) {
              toRemove.push(particle);
            }
          }
        });
      }
    });
    
    // Remove expired effects
    toRemove.forEach(obj => {
      if (obj.parent) {
        obj.parent.remove(obj);
      }
      obj.geometry?.dispose();
      obj.material?.dispose();
    });
  }
  
  /**
   * Register effect for tracking
   */
  registerEffect(name, mesh, duration) {
    mesh.userData.effectData = { duration, elapsedTime: 0 };
    this.overlayGroup.add(mesh);
  }
  
  /**
   * Apply bloom pulse (shader-based, safe)
   */
  applyBloomPulse(intensity, fadeInDuration, fadeOutDuration) {
    // Note: In production, this would interact with post-processing
    // For safety, we store the intent and let the renderer decide
    this.overlayGroup.userData.bloomPulse = {
      intensity,
      fadeInDuration,
      fadeOutDuration,
      elapsedTime: 0
    };
  }
  
  /**
   * Apply halo effect
   */
  applyHaloEffect(duration, color) {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    
    const halo = new THREE.Mesh(geometry, material);
    halo.scale.multiplyScalar(3);
    halo.userData.haloData = { duration, elapsedTime: 0 };
    
    this.overlayGroup.add(halo);
  }
  
  /**
   * Apply distortion overlay
   */
  createDistortionOverlay(strength, fadeInDuration, fadeOutDuration) {
    // Create minimal distortion mesh
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: strength,
      depthWrite: false
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -40;
    
    return mesh;
  }
  
  /**
   * Apply node dimming
   */
  applyNodeDimming(intensity, fadeInDuration, fadeOutDuration) {
    // Store intent in userData
    this.overlayGroup.userData.nodeDimming = {
      intensity,
      fadeInDuration,
      fadeOutDuration,
      elapsedTime: 0
    };
  }
  
  /**
   * Apply horizon pulse
   */
  applyHorizonPulse(color, intensity, duration) {
    const geometry = new THREE.PlaneGeometry(200, 20);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: intensity
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, -50);
    mesh.position.y = 0;
    
    mesh.userData.pulseData = { duration, elapsedTime: 0 };
    this.overlayGroup.add(mesh);
  }
  
  /**
   * Apply link thickening (visual overlay only)
   */
  applyLinkThickening(thickness, fadeInDuration, fadeOutDuration) {
    this.overlayGroup.userData.linkThickening = {
      thickness,
      fadeInDuration,
      fadeOutDuration,
      elapsedTime: 0
    };
  }
  
  /**
   * Apply link intensification
   */
  applyLinkIntensification(duration) {
    this.overlayGroup.userData.linkIntensification = {
      duration,
      elapsedTime: 0,
      intensity: 0.5
    };
  }
  
  /**
   * Update performance monitor
   */
  updatePerformanceMonitor(elapsed) {
    const { performanceMonitor } = this;
    performanceMonitor.updateCount++;
    performanceMonitor.averageTimeMs = 
      (performanceMonitor.averageTimeMs * (performanceMonitor.updateCount - 1) + elapsed) / 
      performanceMonitor.updateCount;
    performanceMonitor.maxTimeMs = Math.max(performanceMonitor.maxTimeMs, elapsed);
  }
  
  /**
   * Enable events
   */
  enable() {
    this.enabled = true;
    console.log('✓ Metric-Reactive Events enabled');
  }
  
  /**
   * Disable events
   */
  disable() {
    this.enabled = false;
    this.overlayGroup.clear();
    console.log('✓ Metric-Reactive Events disabled');
  }
  
  /**
   * Set debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }
  
  /**
   * Get performance stats
   */
  getPerformanceStats() {
    return {
      averageTimeMs: this.performanceMonitor.averageTimeMs.toFixed(3),
      maxTimeMs: this.performanceMonitor.maxTimeMs.toFixed(3),
      updateCount: this.performanceMonitor.updateCount
    };
  }
  
  /**
   * Cleanup
   */
  cleanup() {
    this.overlayGroup.clear();
    this.scene.remove(this.overlayGroup);
    console.log('✓ Metric-Reactive Events cleaned up');
  }
}
