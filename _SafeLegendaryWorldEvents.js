import * as THREE from 'three';

/**
 * SAFE LEGENDARY WORLD EVENTS PACK
 * 
 * ABSOLUTE SAFETY RULES - STRICTLY ENFORCED:
 * - ZERO shader modifications
 * - ZERO material modifications on existing objects
 * - ZERO Node or Link class modifications
 * - ZERO engine system replacements
 * - All effects are VFX overlays, world meshes, particles, or screen-space distortions
 * - All state stored ONLY in external LegendaryWorldEvents registry
 * - Completely non-invasive and reversible
 */

export class SafeLegendaryWorldEvents {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    
    // EXTERNAL STATE - Never touch engine internals
    this.registry = {
      activeEvent: null,
      timer: 0,
      intensity: 0,
      duration: 0,
      phase: 'idle' // idle, fadeIn, active, fadeOut
    };
    
    // Event definitions
    this.eventTypes = {
      COSMIC_PULSE: {
        duration: 8.0,
        fadeInDuration: 1.0,
        fadeOutDuration: 2.0,
        maxIntensity: 1.0,
        color: 0x00ffff,
        description: 'Cosmic Pulse'
      },
      FRACTAL_STORM: {
        duration: 12.0,
        fadeInDuration: 1.5,
        fadeOutDuration: 3.0,
        maxIntensity: 0.9,
        color: 0xaa00ff,
        description: 'Fractal Storm'
      },
      SIGMA_INVASION: {
        duration: 10.0,
        fadeInDuration: 1.0,
        fadeOutDuration: 2.5,
        maxIntensity: 0.95,
        color: 0x00ff88,
        description: 'Sigma Invasion'
      },
      QUANTUM_ECLIPSE: {
        duration: 15.0,
        fadeInDuration: 2.0,
        fadeOutDuration: 3.5,
        maxIntensity: 0.85,
        color: 0xff00ff,
        description: 'Quantum Eclipse'
      },
      AURORA_STATE: {
        duration: 14.0,
        fadeInDuration: 2.0,
        fadeOutDuration: 3.0,
        maxIntensity: 0.8,
        color: 0x00ff00,
        description: 'Aurora State'
      }
    };
    
    // Configuration
    this.config = {
      eventCheckInterval: 5.0,            // Check every 5 seconds
      eventChance: 0.02,                  // 2% chance per check
      minLegendaryNodesForEvent: 2,       // Need 2+ legendary nodes
      maxConcurrentEvents: 1,             // Only 1 event at a time
      noEventCooldown: 30.0,              // 30 seconds between events
      eventInterpretationInterval: 0.25   // Phase B pilot: ~4 Hz semantic evaluation (visuals stay 60 Hz)
    };
    
    // Tracking
    this.lastEventCheck = performance.now();
    this.lastEventTime = 0;
    this.vfxContainer = {
      shockwaves: [],
      particles: [],
      meshes: [],
      trails: [],
      beams: [],
      overlays: [],
      distortionQuads: []
    };
    
    this.originalCameraFOV = this.camera.fov;
    this.originalCameraPosition = this.camera.position.clone();
    this.animationTime = 0;
    this.interpretationAccumulator = this.config.eventInterpretationInterval; // prime first tick
    this.pendingEvaluation = false; // explicit triggers can flip this to force evaluation before the interval
  }
  
  /**
   * Main update loop (called once per frame)
   */
  update(deltaTime, legendaryPack, linkingSystem, evolutionManager) {
    this.animationTime += deltaTime;
    
    // Phase B pilot: hybrid model — visuals/FX stay 60 Hz, semantic detection runs on triggers + ~4 Hz safety net
    this.interpretationAccumulator += deltaTime;
    const shouldEvaluate =
      this.pendingEvaluation ||
      this.interpretationAccumulator >= this.config.eventInterpretationInterval;
    
    if (shouldEvaluate) {
      this.interpretationAccumulator = 0;
      this.pendingEvaluation = false;
      // Detection/decision path (meaning-level)
      this.checkEventTriggers(legendaryPack, linkingSystem, evolutionManager);
    }
    
    // Update active event if one is running
    if (this.registry.activeEvent) {
      this.updateActiveEvent(deltaTime, legendaryPack, linkingSystem);
    }
  }
  
  /**
   * Check if a new world event should trigger
   */
  checkEventTriggers(legendaryPack, linkingSystem, evolutionManager) {
    // Only check periodically
    const now = performance.now();
    if (now - this.lastEventCheck < this.config.eventCheckInterval * 1000) {
      return;
    }
    this.lastEventCheck = now;
    
    // Don't trigger if event is already active
    if (this.registry.activeEvent) return;
    
    // Check cooldown
    if (now - this.lastEventTime < this.config.noEventCooldown * 1000) {
      return;
    }
    
    // Need minimum legendary nodes
    const legendaryCount = legendaryPack ? legendaryPack.getActiveLegendaryCount() : 0;
    if (legendaryCount < this.config.minLegendaryNodesForEvent) {
      return;
    }
    
    // Calculate event potential
    const potential = this.calculateEventPotential(legendaryCount, linkingSystem, evolutionManager);
    
    // Chance to trigger
    if (Math.random() < this.config.eventChance * potential) {
      this.triggerRandomEvent(legendaryCount, linkingSystem);
    }
  }
  
  /**
   * Calculate potential for an event to trigger
   */
  calculateEventPotential(legendaryCount, linkingSystem, evolutionManager) {
    let potential = 0;
    
    // Base from legendary nodes
    potential += legendaryCount * 0.3;
    
    // Bonus from network synergy
    if (linkingSystem && linkingSystem.links) {
      let totalSynergy = 0;
      linkingSystem.links.forEach(link => {
        if (link.glowData && link.glowData.synergy) {
          totalSynergy += link.glowData.synergy;
        }
      });
      potential += Math.min(1, totalSynergy * 0.05);
    }
    
    return Math.min(1, potential);
  }
  
  /**
   * Trigger a random world event
   */
  triggerRandomEvent(legendaryCount, linkingSystem) {
    const eventTypes = Object.keys(this.eventTypes);
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    this.startWorldEvent(eventType, legendaryCount, linkingSystem);
  }
  
  /**
   * Start a specific world event
   */
  startWorldEvent(eventType, legendaryCount, linkingSystem) {
    const eventDef = this.eventTypes[eventType];
    if (!eventDef) return;
    
    // Initialize registry
    this.registry.activeEvent = eventType;
    this.registry.timer = 0;
    this.registry.intensity = 0;
    this.registry.duration = eventDef.duration;
    this.registry.phase = 'fadeIn';
    
    this.lastEventTime = performance.now();
    
    // Create initial VFX
    this.createEventVFX(eventType, eventDef);
  }
  
  /**
   * Create VFX for event type
   */
  createEventVFX(eventType, eventDef) {
    // Clear previous VFX
    this.cleanupAllVFX();
    
    switch(eventType) {
      case 'COSMIC_PULSE':
        this.createCosmicPulseVFX(eventDef);
        break;
      case 'FRACTAL_STORM':
        this.createFractalStormVFX(eventDef);
        break;
      case 'SIGMA_INVASION':
        this.createSigmaInvasionVFX(eventDef);
        break;
      case 'QUANTUM_ECLIPSE':
        this.createQuantumEclipseVFX(eventDef);
        break;
      case 'AURORA_STATE':
        this.createAuroraStateVFX(eventDef);
        break;
    }
  }
  
  /**
   * Update active world event
   */
  updateActiveEvent(deltaTime, legendaryPack, linkingSystem) {
    this.registry.timer += deltaTime;
    
    const eventDef = this.eventTypes[this.registry.activeEvent];
    if (!eventDef) {
      this.endWorldEvent();
      return;
    }
    
    // Calculate phase and intensity
    const fadeInDuration = eventDef.fadeInDuration;
    const activeStart = fadeInDuration;
    const activeEnd = fadeInDuration + (eventDef.duration - fadeInDuration - eventDef.fadeOutDuration);
    const fadeOutStart = activeEnd;
    const totalDuration = eventDef.duration;
    
    let intensity = 0;
    let phase = 'idle';
    
    if (this.registry.timer < fadeInDuration) {
      phase = 'fadeIn';
      intensity = (this.registry.timer / fadeInDuration) * eventDef.maxIntensity;
    } else if (this.registry.timer < fadeOutStart) {
      phase = 'active';
      intensity = eventDef.maxIntensity;
    } else if (this.registry.timer < totalDuration) {
      phase = 'fadeOut';
      const fadeOutTime = this.registry.timer - fadeOutStart;
      intensity = (1 - fadeOutTime / eventDef.fadeOutDuration) * eventDef.maxIntensity;
    } else {
      this.endWorldEvent();
      return;
    }
    
    this.registry.intensity = intensity;
    this.registry.phase = phase;
    
    // Update VFX based on event type
    switch(this.registry.activeEvent) {
      case 'COSMIC_PULSE':
        this.updateCosmicPulseVFX(intensity, deltaTime);
        break;
      case 'FRACTAL_STORM':
        this.updateFractalStormVFX(intensity, deltaTime);
        break;
      case 'SIGMA_INVASION':
        this.updateSigmaInvasionVFX(intensity, deltaTime);
        break;
      case 'QUANTUM_ECLIPSE':
        this.updateQuantumEclipseVFX(intensity, deltaTime);
        break;
      case 'AURORA_STATE':
        this.updateAuroraStateVFX(intensity, deltaTime);
        break;
    }
  }
  
  /**
   * COSMIC PULSE - Global shockwave event
   */
  createCosmicPulseVFX(eventDef) {
    // Create expanding shockwave ring
    const shockGeo = new THREE.TorusGeometry(5, 0.2, 16, 64);
    const shockMat = new THREE.MeshBasicMaterial({
      color: eventDef.color,
      transparent: true,
      emissive: eventDef.color,
      emissiveIntensity: 0.8,
      fog: false
    });
    
    const shockwave = new THREE.Mesh(shockGeo, shockMat);
    shockwave.position.y = 0;
    shockwave.userData = { isLegendaryWorldVFX: true, type: 'cosmic_shockwave' };
    this.scene.add(shockwave);
    this.vfxContainer.shockwaves.push({
      mesh: shockwave,
      maxRadius: 100,
      startRadius: 5,
      expandSpeed: 30
    });
    
    // Create bloom overlay
    const bloomGeo = new THREE.PlaneGeometry(200, 200);
    const bloomMat = new THREE.MeshBasicMaterial({
      color: eventDef.color,
      transparent: true,
      opacity: 0,
      emissive: eventDef.color,
      emissiveIntensity: 0.5,
      fog: false
    });
    
    const bloom = new THREE.Mesh(bloomGeo, bloomMat);
    bloom.position.z = -50;
    bloom.userData = { isLegendaryWorldVFX: true, type: 'cosmic_bloom' };
    this.scene.add(bloom);
    this.vfxContainer.overlays.push(bloom);
  }
  
  /**
   * Update cosmic pulse VFX
   */
  updateCosmicPulseVFX(intensity, deltaTime) {
    // Update shockwaves
    this.vfxContainer.shockwaves.forEach(shock => {
      shock.mesh.scale.setScalar(1 + intensity * 8);
      shock.mesh.material.opacity = Math.max(0, 1 - intensity);
      shock.mesh.material.emissiveIntensity = 0.6 + intensity * 0.4;
    });
    
    // Pulse bloom
    this.vfxContainer.overlays.forEach(overlay => {
      if (overlay.userData.type === 'cosmic_bloom') {
        overlay.material.opacity = intensity * 0.3;
      }
    });
  }
  
  /**
   * FRACTAL STORM - Fractal weather event
   */
  createFractalStormVFX(eventDef) {
    // Create falling fractal particles
    for (let i = 0; i < 40; i++) {
      const geo = new THREE.TetrahedronGeometry(0.1, 2);
      const mat = new THREE.MeshBasicMaterial({
        color: eventDef.color,
        transparent: true,
        emissive: eventDef.color,
        emissiveIntensity: 0.5,
        fog: false
      });
      
      const particle = new THREE.Mesh(geo, mat);
      particle.position.set(
        (Math.random() - 0.5) * 100,
        Math.random() * 50 + 30,
        (Math.random() - 0.5) * 100
      );
      particle.userData = {
        isLegendaryWorldVFX: true,
        type: 'fractal_particle',
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          -5 - Math.random() * 5,
          (Math.random() - 0.5) * 2
        ),
        rotation: new THREE.Vector3(
          Math.random(),
          Math.random(),
          Math.random()
        ),
        rotationSpeed: Math.random() * 2
      };
      
      this.scene.add(particle);
      this.vfxContainer.particles.push(particle);
    }
    
    // Create rotating fractal patterns in sky
    const skyGeo = new THREE.PlaneGeometry(200, 200);
    const skyMat = new THREE.MeshBasicMaterial({
      color: eventDef.color,
      transparent: true,
      opacity: 0,
      emissive: eventDef.color,
      emissiveIntensity: 0.3,
      fog: false
    });
    
    const skyOverlay = new THREE.Mesh(skyGeo, skyMat);
    skyOverlay.position.z = -100;
    skyOverlay.userData = { isLegendaryWorldVFX: true, type: 'fractal_sky' };
    this.scene.add(skyOverlay);
    this.vfxContainer.overlays.push(skyOverlay);
  }
  
  /**
   * Update fractal storm VFX
   */
  updateFractalStormVFX(intensity, deltaTime) {
    // Update particles
    this.vfxContainer.particles.forEach(particle => {
      if (particle.userData.type === 'fractal_particle') {
        particle.position.addScaledVector(particle.userData.velocity, deltaTime);
        
        // Rotate
        particle.rotation.x += particle.userData.rotationSpeed * deltaTime;
        particle.rotation.y += particle.userData.rotationSpeed * deltaTime * 0.7;
        
        // Fade out at bottom
        const fadeStart = 0;
        if (particle.position.y < fadeStart) {
          particle.material.opacity = Math.max(0, 1 + particle.position.y / 10);
        } else {
          particle.material.opacity = intensity;
        }
        
        // Reset if too low
        if (particle.position.y < -20) {
          particle.position.y = 50;
        }
      }
    });
    
    // Pulse sky overlay
    this.vfxContainer.overlays.forEach(overlay => {
      if (overlay.userData.type === 'fractal_sky') {
        overlay.material.opacity = intensity * 0.2;
        overlay.rotation.z += deltaTime * 0.1 * intensity;
      }
    });
  }
  
  /**
   * SIGMA INVASION - Digital glitch surge
   */
  createSigmaInvasionVFX(eventDef) {
    // Create glitch stripe overlays
    for (let i = 0; i < 8; i++) {
      const stripeGeo = new THREE.PlaneGeometry(200, 20);
      const stripeMat = new THREE.MeshBasicMaterial({
        color: eventDef.color,
        transparent: true,
        opacity: 0,
        emissive: eventDef.color,
        emissiveIntensity: 0.8,
        fog: false
      });
      
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(0, -50 + i * 15, -99);
      stripe.userData = {
        isLegendaryWorldVFX: true,
        type: 'sigma_stripe',
        index: i,
        scanPosition: 0
      };
      
      this.scene.add(stripe);
      this.vfxContainer.overlays.push(stripe);
    }
    
    // Create glitch ribbons
    for (let i = 0; i < 5; i++) {
      const points = [];
      for (let j = 0; j < 10; j++) {
        points.push(
          new THREE.Vector3(
            (Math.random() - 0.5) * 80,
            Math.random() * 60,
            (Math.random() - 0.5) * 80
          )
        );
      }
      
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: eventDef.color,
        transparent: true,
        opacity: 0,
        emissive: eventDef.color,
        linewidth: 3,
        fog: false
      });
      
      const ribbon = new THREE.Line(geo, mat);
      ribbon.userData = { isLegendaryWorldVFX: true, type: 'sigma_ribbon' };
      this.scene.add(ribbon);
      this.vfxContainer.beams.push(ribbon);
    }
  }
  
  /**
   * Update sigma invasion VFX
   */
  updateSigmaInvasionVFX(intensity, deltaTime) {
    // Animate glitch stripes
    this.vfxContainer.overlays.forEach(overlay => {
      if (overlay.userData.type === 'sigma_stripe') {
        overlay.material.opacity = intensity * 0.4;
        
        // Jitter effect
        overlay.position.x = (Math.random() - 0.5) * 20 * intensity;
        overlay.position.y += Math.sin(this.animationTime * 5 + overlay.userData.index) * 2;
      }
    });
    
    // Animate glitch ribbons
    this.vfxContainer.beams.forEach(ribbon => {
      if (ribbon.userData.type === 'sigma_ribbon') {
        ribbon.material.opacity = Math.sin(this.animationTime * 3) * 0.5 + 0.2;
        ribbon.material.opacity *= intensity;
        
        // Random jitter
        ribbon.children?.forEach(child => {
          if (child.geometry) {
            const positions = child.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
              positions[i] += (Math.random() - 0.5) * 0.5 * intensity;
            }
            child.geometry.attributes.position.needsUpdate = true;
          }
        });
      }
    });
  }
  
  /**
   * QUANTUM ECLIPSE - Dimensional shift
   */
  createQuantumEclipseVFX(eventDef) {
    // Create singularity sphere in sky
    const singGeo = new THREE.SphereGeometry(3, 16, 16);
    const singMat = new THREE.MeshBasicMaterial({
      color: eventDef.color,
      transparent: true,
      emissive: eventDef.color,
      emissiveIntensity: 0.9,
      fog: false
    });
    
    const singularity = new THREE.Mesh(singGeo, singMat);
    singularity.position.set(0, 60, -80);
    singularity.userData = { isLegendaryWorldVFX: true, type: 'quantum_singularity' };
    this.scene.add(singularity);
    this.vfxContainer.meshes.push(singularity);
    
    // Create spectral rays emanating downward
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const x = Math.cos(angle) * 5;
      const z = Math.sin(angle) * 5;
      
      const points = [
        new THREE.Vector3(x, 60, z - 80),
        new THREE.Vector3(x * 3, 20, z * 3 - 80),
        new THREE.Vector3(x * 5, 0, z * 5 - 80)
      ];
      
      const rayGeo = new THREE.BufferGeometry().setFromPoints(points);
      const rayMat = new THREE.LineBasicMaterial({
        color: eventDef.color,
        transparent: true,
        opacity: 0,
        emissive: eventDef.color,
        fog: false
      });
      
      const ray = new THREE.Line(rayGeo, rayMat);
      ray.userData = { isLegendaryWorldVFX: true, type: 'quantum_ray', index: i };
      this.scene.add(ray);
      this.vfxContainer.beams.push(ray);
    }
    
    // Create eclipse gradient overlay
    const eclipseGeo = new THREE.PlaneGeometry(200, 200);
    const eclipseMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      fog: false
    });
    
    const eclipse = new THREE.Mesh(eclipseGeo, eclipseMat);
    eclipse.position.z = -98;
    eclipse.userData = { isLegendaryWorldVFX: true, type: 'eclipse_overlay' };
    this.scene.add(eclipse);
    this.vfxContainer.overlays.push(eclipse);
  }
  
  /**
   * Update quantum eclipse VFX
   */
  updateQuantumEclipseVFX(intensity, deltaTime) {
    // Pulse singularity
    this.vfxContainer.meshes.forEach(mesh => {
      if (mesh.userData.type === 'quantum_singularity') {
        const pulse = 1 + Math.sin(this.animationTime * 2) * 0.3 * intensity;
        mesh.scale.setScalar(pulse);
        mesh.material.opacity = 0.6 * intensity;
      }
    });
    
    // Animate rays
    this.vfxContainer.beams.forEach(ray => {
      if (ray.userData.type === 'quantum_ray') {
        ray.material.opacity = (Math.sin(this.animationTime * 1.5 + ray.userData.index) + 1) * 0.25 * intensity;
      }
    });
    
    // Darken overlay
    this.vfxContainer.overlays.forEach(overlay => {
      if (overlay.userData.type === 'eclipse_overlay') {
        overlay.material.opacity = intensity * 0.15;
      }
    });
  }
  
  /**
   * AURORA STATE - Global light ribbon event
   */
  createAuroraStateVFX(eventDef) {
    // Create aurora ribbon meshes at horizon
    for (let i = 0; i < 3; i++) {
      const auraGeo = new THREE.PlaneGeometry(200, 30);
      const auraMat = new THREE.MeshBasicMaterial({
        color: [0xff0000, 0x00ff00, 0x0000ff][i],
        transparent: true,
        opacity: 0,
        emissive: [0xff0000, 0x00ff00, 0x0000ff][i],
        emissiveIntensity: 0.7,
        fog: false
      });
      
      const aurora = new THREE.Mesh(auraGeo, auraMat);
      aurora.position.set(0, 30 + i * 20, -99);
      aurora.userData = {
        isLegendaryWorldVFX: true,
        type: 'aurora_ribbon',
        index: i,
        baseColor: [0xff0000, 0x00ff00, 0x0000ff][i]
      };
      
      this.scene.add(aurora);
      this.vfxContainer.overlays.push(aurora);
    }
    
    // Create trail particles
    for (let i = 0; i < 20; i++) {
      const trailGeo = new THREE.SphereGeometry(0.2, 6, 6);
      const trailMat = new THREE.MeshBasicMaterial({
        color: eventDef.color,
        transparent: true,
        emissive: eventDef.color,
        emissiveIntensity: 0.8,
        fog: false
      });
      
      const trail = new THREE.Mesh(trailGeo, trailMat);
      trail.position.set(
        (Math.random() - 0.5) * 100,
        Math.random() * 40 + 20,
        (Math.random() - 0.5) * 80
      );
      trail.userData = {
        isLegendaryWorldVFX: true,
        type: 'aurora_particle',
        angle: Math.random() * Math.PI * 2,
        speed: 1 + Math.random() * 2
      };
      
      this.scene.add(trail);
      this.vfxContainer.particles.push(trail);
    }
  }
  
  /**
   * Update aurora state VFX
   */
  updateAuroraStateVFX(intensity, deltaTime) {
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
    
    // Update aurora ribbons with color cycling
    this.vfxContainer.overlays.forEach(overlay => {
      if (overlay.userData.type === 'aurora_ribbon') {
        // Color cycling
        const colorIdx = Math.floor((this.animationTime * 2 + overlay.userData.index) % colors.length);
        const nextIdx = (colorIdx + 1) % colors.length;
        const t = (Math.sin(this.animationTime * 3 + overlay.userData.index) + 1) * 0.5;
        
        overlay.material.opacity = 0.3 * intensity;
        
        // Wave effect
        overlay.position.y += Math.sin(this.animationTime * 1.5 + overlay.userData.index) * 0.5;
      }
    });
    
    // Update aurora particles
    this.vfxContainer.particles.forEach(particle => {
      if (particle.userData.type === 'aurora_particle') {
        particle.userData.angle += particle.userData.speed * deltaTime * 0.3;
        
        const radius = 20 + Math.sin(this.animationTime + particle.userData.angle) * 10;
        particle.position.x = Math.cos(particle.userData.angle) * radius;
        particle.position.z = Math.sin(particle.userData.angle) * radius;
        
        particle.material.opacity = intensity * 0.6;
      }
    });
  }
  
  /**
   * End the current world event
   */
  endWorldEvent() {
    this.cleanupAllVFX();
    this.registry.activeEvent = null;
    this.registry.timer = 0;
    this.registry.intensity = 0;
    this.registry.phase = 'idle';
    // Ensure we reevaluate promptly after an event finishes
    this.pendingEvaluation = true;
  }
  
  /**
   * Clean up all event VFX
   */
  cleanupAllVFX() {
    // Remove all meshes
    this.vfxContainer.meshes.forEach(mesh => {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });
    this.vfxContainer.meshes = [];
    
    // Remove all particles
    this.vfxContainer.particles.forEach(particle => {
      this.scene.remove(particle);
      if (particle.geometry) particle.geometry.dispose();
      if (particle.material) particle.material.dispose();
    });
    this.vfxContainer.particles = [];
    
    // Remove all shockwaves
    this.vfxContainer.shockwaves.forEach(shock => {
      this.scene.remove(shock.mesh);
      if (shock.mesh.geometry) shock.mesh.geometry.dispose();
      if (shock.mesh.material) shock.mesh.material.dispose();
    });
    this.vfxContainer.shockwaves = [];
    
    // Remove all beams
    this.vfxContainer.beams.forEach(beam => {
      this.scene.remove(beam);
      if (beam.geometry) beam.geometry.dispose();
      if (beam.material) beam.material.dispose();
    });
    this.vfxContainer.beams = [];
    
    // Remove all overlays
    this.vfxContainer.overlays.forEach(overlay => {
      this.scene.remove(overlay);
      if (overlay.geometry) overlay.geometry.dispose();
      if (overlay.material) overlay.material.dispose();
    });
    this.vfxContainer.overlays = [];
    
    // Remove all trails
    this.vfxContainer.trails.forEach(trail => {
      this.scene.remove(trail);
      if (trail.geometry) trail.geometry.dispose();
      if (trail.material) trail.material.dispose();
    });
    this.vfxContainer.trails = [];
  }
  
  /**
   * Get event info for HUD display
   */
  getActiveEventInfo() {
    if (!this.registry.activeEvent) return null;
    
    const eventDef = this.eventTypes[this.registry.activeEvent];
    return {
      name: eventDef.description,
      intensity: this.registry.intensity,
      phase: this.registry.phase
    };
  }
  
  /**
   * Check if event is active
   */
  isEventActive() {
    return !!this.registry.activeEvent;
  }
  
  /**
   * Get active event type
   */
  getActiveEventType() {
    return this.registry.activeEvent;
  }
  
  /**
   * Get event intensity (0-1)
   */
  getEventIntensity() {
    return this.registry.intensity;
  }
  
  /**
   * Force trigger a specific event (for testing)
   */
  forceEvent(eventType, legendaryCount = 2, linkingSystem = null) {
    this.startWorldEvent(eventType, legendaryCount, linkingSystem);
    // Allow callers to immediately reevaluate after forced events if desired
    this.pendingEvaluation = true;
  }
  
  /**
   * Disable all world events (safe shutdown)
   */
  disableAll() {
    this.cleanupAllVFX();
    this.registry = {
      activeEvent: null,
      timer: 0,
      intensity: 0,
      duration: 0,
      phase: 'idle'
    };
    this.lastEventTime = 0;
    this.interpretationAccumulator = this.config.eventInterpretationInterval;
    this.pendingEvaluation = true;
  }
}
