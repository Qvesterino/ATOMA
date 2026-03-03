import * as THREE from 'three';

/**
 * SAFE AI WEATHER PACK
 * 
 * ABSOLUTE SAFETY RULES - STRICTLY ENFORCED:
 * - ZERO shader modifications
 * - ZERO material overrides on existing objects
 * - ZERO Node or Link class modifications
 * - ZERO NodeLinkingSystem.js modifications
 * - ZERO animation loop modifications
 * - All weather is VFX-layer only
 * - All state stored ONLY in external WeatherRegistry
 * - Completely non-invasive and reversible
 */

export class SafeAIWeatherPack {
  constructor(scene, worldRoot, environmentRoot, camera) {
    this.scene = scene;
    this.worldRoot = worldRoot || scene;
    this.environmentRoot = environmentRoot || this.worldRoot;
    this.camera = camera;
    this.root = new THREE.Group();
    this.environmentRoot.add(this.root);
    
    // EXTERNAL STATE - Never touch engine internals
    this.registry = {
      active: null,
      timer: 0,
      intensity: 0,
      duration: 0,
      phase: 'idle', // idle, fadeIn, active, fadeOut
      windVector: new THREE.Vector3(0, 0, 0),
      windStrength: 0
    };
    
    // Weather type definitions
    this.weatherTypes = {
      QUANTUM_STORM: {
        duration: 15.0,
        fadeInDuration: 2.5,
        fadeOutDuration: 3.0,
        maxIntensity: 0.85,
        color: 0xff00ff,
        windStrength: 0.5,
        description: 'Quantum Storm'
      },
      SIGMA_TURBULENCE: {
        duration: 12.0,
        fadeInDuration: 1.5,
        fadeOutDuration: 2.5,
        maxIntensity: 0.9,
        color: 0x00ff88,
        windStrength: 0.8,
        description: 'Sigma Turbulence'
      },
      NEON_RAIN: {
        duration: 18.0,
        fadeInDuration: 3.0,
        fadeOutDuration: 3.5,
        maxIntensity: 0.7,
        color: 0x00ffff,
        windStrength: 0.2,
        description: 'Neon Rain'
      },
      AURORA_WINDS: {
        duration: 20.0,
        fadeInDuration: 3.5,
        fadeOutDuration: 4.0,
        maxIntensity: 0.8,
        color: 0xff00ff,
        windStrength: 0.4,
        description: 'Aurora Winds'
      },
      FRACTAL_FOG: {
        duration: 16.0,
        fadeInDuration: 2.0,
        fadeOutDuration: 3.0,
        maxIntensity: 0.75,
        color: 0xaa00ff,
        windStrength: 0.1,
        description: 'Fractal Fog'
      }
    };
    
    // Configuration
    this.config = {
      weatherCheckInterval: 6.0,         // Check every 6 seconds
      weatherChance: 0.01,               // 1% chance per check
      minSynergyForWeather: 3.0,         // Minimum synergy to trigger
      maxConcurrentWeather: 1,           // Only 1 weather at a time
      weatherCooldown: 20.0,             // 20 seconds between weather
      windUpdateFrequency: 0.1,          // Update wind vector frequently
      interpretationInterval: 0.25       // Phase B pilot: ~4 Hz interpretation, motion stays 60 Hz
    };
    
    // Tracking
    this.lastWeatherCheck = performance.now();
    this.lastWeatherTime = 0;
    this.animationTime = 0;
    this.interpretationAccumulator = 0;
    
    // VFX containers
    this.vfxLayers = {
      clouds: [],
      particles: [],
      waves: [],
      ribbons: [],
      glitches: [],
      overlays: [],
      beams: [],
      glows: []
    };
    
    this.windPhase = 0;
  }
  
  /**
   * Main update loop (called once per frame)
   */
  update(deltaTime, legendaryPack, linkingSystem, evolutionManager, worldEvents) {
    this.animationTime += deltaTime;
    this.windPhase += deltaTime;
    
    // Phase B pilot: throttle interpretation/decisions to keep mood at ~4 Hz while visuals/motion stay 60 Hz
    this.interpretationAccumulator += deltaTime;
    const shouldRunInterpretation = this.interpretationAccumulator >= this.config.interpretationInterval;
    
    if (shouldRunInterpretation) {
      this.interpretationAccumulator = 0;
      // Check for new weather triggers periodically (interpretation layer)
      this.checkWeatherTriggers(legendaryPack, linkingSystem, evolutionManager, worldEvents);
    }
    
    // Update active weather if one is running
    if (this.registry.active) {
      this.updateActiveWeather(deltaTime, legendaryPack, linkingSystem);
    }
    
    // Always update wind vector
    this.updateWindVector(deltaTime, linkingSystem);
  }
  
  /**
   * Check if new weather should trigger
   */
  checkWeatherTriggers(legendaryPack, linkingSystem, evolutionManager, worldEvents) {
    // Only check periodically
    const now = performance.now();
    if (now - this.lastWeatherCheck < this.config.weatherCheckInterval * 1000) {
      return;
    }
    this.lastWeatherCheck = now;
    
    // Don't trigger if weather is already active
    if (this.registry.active) return;
    
    // Check cooldown
    if (now - this.lastWeatherTime < this.config.weatherCooldown * 1000) {
      return;
    }
    
    // Skip if world event is active (weather yields to events)
    if (worldEvents && worldEvents.isEventActive()) {
      return;
    }
    
    // Calculate weather potential
    const potential = this.calculateWeatherPotential(legendaryPack, linkingSystem, evolutionManager);
    
    // Chance to trigger
    if (Math.random() < this.config.weatherChance * potential) {
      this.triggerRandomWeather(legendaryPack, linkingSystem);
    }
  }
  
  /**
   * Calculate potential for weather to trigger
   */
  calculateWeatherPotential(legendaryPack, linkingSystem, evolutionManager) {
    let potential = 0;
    
    // Base from network synergy
    let totalSynergy = 0;
    if (linkingSystem && linkingSystem.links) {
      linkingSystem.links.forEach(link => {
        if (link.glowData && link.glowData.synergy) {
          totalSynergy += link.glowData.synergy;
        }
      });
    }
    
    if (totalSynergy < this.config.minSynergyForWeather) {
      return 0;
    }
    
    // Scale potential by synergy
    potential = Math.min(1, totalSynergy * 0.1);
    
    // Bonus from legendary nodes
    if (legendaryPack) {
      const legendaryCount = legendaryPack.getActiveLegendaryCount();
      potential += legendaryCount * 0.2;
    }
    
    // Bonus from traffic
    if (linkingSystem && linkingSystem.links) {
      let totalTraffic = 0;
      linkingSystem.links.forEach(link => {
        if (link.traffic && link.traffic.load) {
          totalTraffic += link.traffic.load;
        }
      });
      potential += Math.min(0.3, totalTraffic * 0.05);
    }
    
    return Math.min(1, potential);
  }
  
  /**
   * Trigger random weather
   */
  triggerRandomWeather(legendaryPack, linkingSystem) {
    const weatherTypes = Object.keys(this.weatherTypes);
    const weatherType = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    
    this.startWeather(weatherType, legendaryPack, linkingSystem);
  }
  
  /**
   * Start specific weather
   */
  startWeather(weatherType, legendaryPack, linkingSystem) {
    const weatherDef = this.weatherTypes[weatherType];
    if (!weatherDef) return;
    
    // Initialize registry
    this.registry.active = weatherType;
    this.registry.timer = 0;
    this.registry.intensity = 0;
    this.registry.duration = weatherDef.duration;
    this.registry.phase = 'fadeIn';
    this.registry.windStrength = weatherDef.windStrength;
    
    this.lastWeatherTime = performance.now();
    
    // Create initial VFX
    this.createWeatherVFX(weatherType, weatherDef);
  }
  
  /**
   * Create VFX for weather type
   */
  createWeatherVFX(weatherType, weatherDef) {
    // Clean previous weather
    this.cleanupAllWeatherVFX();
    
    switch(weatherType) {
      case 'QUANTUM_STORM':
        this.createQuantumStormVFX(weatherDef);
        break;
      case 'SIGMA_TURBULENCE':
        this.createSigmaTurbulenceVFX(weatherDef);
        break;
      case 'NEON_RAIN':
        this.createNeonRainVFX(weatherDef);
        break;
      case 'AURORA_WINDS':
        this.createAuroraWindsVFX(weatherDef);
        break;
      case 'FRACTAL_FOG':
        this.createFractalFogVFX(weatherDef);
        break;
    }
  }
  
  /**
   * Update active weather
   */
  updateActiveWeather(deltaTime, legendaryPack, linkingSystem) {
    this.registry.timer += deltaTime;
    
    const weatherDef = this.weatherTypes[this.registry.active];
    if (!weatherDef) {
      this.endWeather();
      return;
    }
    
    // Calculate phase and intensity
    const fadeInDuration = weatherDef.fadeInDuration;
    const activeStart = fadeInDuration;
    const activeEnd = fadeInDuration + (weatherDef.duration - fadeInDuration - weatherDef.fadeOutDuration);
    const fadeOutStart = activeEnd;
    const totalDuration = weatherDef.duration;
    
    let intensity = 0;
    let phase = 'idle';
    
    if (this.registry.timer < fadeInDuration) {
      phase = 'fadeIn';
      intensity = (this.registry.timer / fadeInDuration) * weatherDef.maxIntensity;
    } else if (this.registry.timer < fadeOutStart) {
      phase = 'active';
      intensity = weatherDef.maxIntensity;
    } else if (this.registry.timer < totalDuration) {
      phase = 'fadeOut';
      const fadeOutTime = this.registry.timer - fadeOutStart;
      intensity = (1 - fadeOutTime / weatherDef.fadeOutDuration) * weatherDef.maxIntensity;
    } else {
      this.endWeather();
      return;
    }
    
    this.registry.intensity = intensity;
    this.registry.phase = phase;
    
    // Update VFX based on weather type
    switch(this.registry.active) {
      case 'QUANTUM_STORM':
        this.updateQuantumStormVFX(intensity, deltaTime);
        break;
      case 'SIGMA_TURBULENCE':
        this.updateSigmaTurbulenceVFX(intensity, deltaTime);
        break;
      case 'NEON_RAIN':
        this.updateNeonRainVFX(intensity, deltaTime);
        break;
      case 'AURORA_WINDS':
        this.updateAuroraWindsVFX(intensity, deltaTime);
        break;
      case 'FRACTAL_FOG':
        this.updateFractalFogVFX(intensity, deltaTime);
        break;
    }
  }
  
  /**
   * QUANTUM STORM - Spectral vortex weather
   */
  createQuantumStormVFX(weatherDef) {
    // Create swirling cloud overlay
    const cloudGeo = new THREE.PlaneGeometry(200, 200);
    const cloudMat = new THREE.MeshBasicMaterial({
      color: weatherDef.color,
      transparent: true,
      opacity: 0,
      emissive: weatherDef.color,
      emissiveIntensity: 0.3,
      fog: false
    });
    
    const cloud = new THREE.Mesh(cloudGeo, cloudMat);
    cloud.position.z = -100;
    cloud.userData = { isAIWeatherVFX: true, type: 'quantum_cloud' };
    this.root.add(cloud);
    this.vfxLayers.overlays.push(cloud);
    
    // Create ripple wave particles
    for (let i = 0; i < 30; i++) {
      const waveGeo = new THREE.PlaneGeometry(20, 0.5);
      const waveMat = new THREE.MeshBasicMaterial({
        color: weatherDef.color,
        transparent: true,
        opacity: 0,
        emissive: weatherDef.color,
        emissiveIntensity: 0.5,
        fog: false
      });
      
      const wave = new THREE.Mesh(waveGeo, waveMat);
      wave.position.set(
        (Math.random() - 0.5) * 100,
        Math.random() * 40 - 20,
        Math.random() * 10 - 50
      );
      wave.rotation.z = Math.random() * Math.PI * 2;
      wave.userData = {
        isAIWeatherVFX: true,
        type: 'quantum_wave',
        angle: Math.random() * Math.PI * 2,
        speed: 1 + Math.random() * 3
      };
      
      this.root.add(wave);
      this.vfxLayers.waves.push(wave);
    }
    
    // Create occasional spectral lightning arcs
    for (let i = 0; i < 5; i++) {
      const points = [];
      const segments = 5;
      for (let j = 0; j <= segments; j++) {
        points.push(
          new THREE.Vector3(
            (Math.random() - 0.5) * 60,
            40 - j * 20,
            -50 + Math.random() * 20
          )
        );
      }
      
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
      const arcMat = new THREE.LineBasicMaterial({
        color: weatherDef.color,
        transparent: true,
        opacity: 0,
        emissive: weatherDef.color,
        fog: false
      });
      
      const arc = new THREE.Line(arcGeo, arcMat);
      arc.userData = {
        isAIWeatherVFX: true,
        type: 'quantum_arc',
        frequency: 2 + Math.random() * 2
      };
      
      this.root.add(arc);
      this.vfxLayers.beams.push(arc);
    }
  }
  
  /**
   * Update quantum storm VFX
   */
  updateQuantumStormVFX(intensity, deltaTime) {
    // Update cloud overlay
    this.vfxLayers.overlays.forEach(overlay => {
      if (overlay.userData.type === 'quantum_cloud') {
        overlay.material.opacity = intensity * 0.3;
        overlay.rotation.z += deltaTime * 0.05 * intensity;
      }
    });
    
    // Update ripple waves
    this.vfxLayers.waves.forEach(wave => {
      if (wave.userData.type === 'quantum_wave') {
        wave.userData.angle += wave.userData.speed * deltaTime * 0.3;
        
        const radius = 30;
        wave.position.x = Math.cos(wave.userData.angle) * radius;
        wave.position.z += Math.sin(this.animationTime * 2) * 0.5;
        
        wave.material.opacity = Math.sin(this.animationTime * 2 + wave.userData.angle) * 0.3 * intensity;
      }
    });
    
    // Update lightning arcs
    this.vfxLayers.beams.forEach(beam => {
      if (beam.userData.type === 'quantum_arc') {
        const flicker = Math.sin(this.animationTime * beam.userData.frequency) * 0.5 + 0.5;
        beam.material.opacity = flicker * intensity * 0.5;
      }
    });
  }
  
  /**
   * SIGMA TURBULENCE - Glitch wind weather
   */
  createSigmaTurbulenceVFX(weatherDef) {
    // Create fast-moving glitch stripes
    for (let i = 0; i < 10; i++) {
      const stripeGeo = new THREE.PlaneGeometry(200, 15);
      const stripeMat = new THREE.MeshBasicMaterial({
        color: weatherDef.color,
        transparent: true,
        opacity: 0,
        emissive: weatherDef.color,
        emissiveIntensity: 0.6,
        fog: false
      });
      
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(
        0,
        -40 + i * 12,
        -95
      );
      stripe.userData = {
        isAIWeatherVFX: true,
        type: 'sigma_stripe',
        index: i,
        offset: 0
      };
      
      this.root.add(stripe);
      this.vfxLayers.glitches.push(stripe);
    }
    
    // Create pixel noise strips
    for (let i = 0; i < 8; i++) {
      const noiseGeo = new THREE.PlaneGeometry(100, 30);
      const noiseMat = new THREE.MeshBasicMaterial({
        color: weatherDef.color,
        transparent: true,
        opacity: 0,
        emissive: weatherDef.color,
        emissiveIntensity: 0.4,
        fog: false
      });
      
      const noise = new THREE.Mesh(noiseGeo, noiseMat);
      noise.position.set(
        (Math.random() - 0.5) * 150,
        Math.random() * 80 - 40,
        -90
      );
      noise.userData = {
        isAIWeatherVFX: true,
        type: 'sigma_noise',
        speed: 20 + Math.random() * 40
      };
      
      this.root.add(noise);
      this.vfxLayers.glitches.push(noise);
    }
  }
  
  /**
   * Update sigma turbulence VFX
   */
  updateSigmaTurbulenceVFX(intensity, deltaTime) {
    // Update glitch stripes
    this.vfxLayers.glitches.forEach(glitch => {
      if (glitch.userData.type === 'sigma_stripe') {
        glitch.material.opacity = intensity * 0.4;
        
        // Sweep across screen
        glitch.userData.offset += deltaTime * 50 * intensity;
        glitch.position.x = ((glitch.userData.offset) % 200) - 100;
        
        // Jitter
        glitch.position.y += (Math.random() - 0.5) * 2 * intensity;
      }
      
      if (glitch.userData.type === 'sigma_noise') {
        glitch.material.opacity = Math.sin(this.animationTime * 5 + glitch.userData.index) * 0.25 * intensity;
        
        // Move with wind
        glitch.position.x += glitch.userData.speed * deltaTime * intensity * 0.1;
        
        // Reset position
        if (glitch.position.x > 100) {
          glitch.position.x = -100;
        }
      }
    });
  }
  
  /**
   * NEON RAIN - Gentle holographic precipitation
   */
  createNeonRainVFX(weatherDef) {
    // Create falling neon rain particles
    for (let i = 0; i < 80; i++) {
      const dropGeo = new THREE.SphereGeometry(0.15, 6, 6);
      const dropMat = new THREE.MeshBasicMaterial({
        color: weatherDef.color,
        transparent: true,
        opacity: 0,
        emissive: weatherDef.color,
        emissiveIntensity: 0.8,
        fog: false
      });
      
      const drop = new THREE.Mesh(dropGeo, dropMat);
      drop.position.set(
        (Math.random() - 0.5) * 100,
        Math.random() * 80 + 40,
        (Math.random() - 0.5) * 60
      );
      drop.userData = {
        isAIWeatherVFX: true,
        type: 'neon_drop',
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          -10 - Math.random() * 5,
          0
        ),
        brightness: Math.random()
      };
      
      this.root.add(drop);
      this.vfxLayers.particles.push(drop);
    }
    
    // Create subtle ground ripples
    for (let i = 0; i < 15; i++) {
      const rippleGeo = new THREE.CircleGeometry(2, 12);
      const rippleMat = new THREE.MeshBasicMaterial({
        color: weatherDef.color,
        transparent: true,
        opacity: 0,
        emissive: weatherDef.color,
        emissiveIntensity: 0.3,
        fog: false
      });
      
      const ripple = new THREE.Mesh(rippleGeo, rippleMat);
      ripple.position.set(
        (Math.random() - 0.5) * 80,
        0.1,
        (Math.random() - 0.5) * 80
      );
      ripple.rotation.x = -Math.PI / 2;
      ripple.userData = {
        isAIWeatherVFX: true,
        type: 'neon_ripple',
        age: Math.random() * 3,
        lifetime: 3
      };
      
      this.root.add(ripple);
      this.vfxLayers.waves.push(ripple);
    }
  }
  
  /**
   * Update neon rain VFX
   */
  updateNeonRainVFX(intensity, deltaTime) {
    // Update rain drops
    this.vfxLayers.particles.forEach(particle => {
      if (particle.userData.type === 'neon_drop') {
        particle.position.addScaledVector(particle.userData.velocity, deltaTime);
        
        // Opacity pulse
        const pulse = Math.sin(this.animationTime * 5 + particle.userData.brightness) * 0.3 + 0.5;
        particle.material.opacity = pulse * intensity;
        
        // Reset at bottom
        if (particle.position.y < -20) {
          particle.position.y = 80;
          particle.position.x = (Math.random() - 0.5) * 100;
        }
      }
    });
    
    // Update ripples
    this.vfxLayers.waves.forEach(wave => {
      if (wave.userData.type === 'neon_ripple') {
        wave.userData.age += deltaTime;
        
        const progress = wave.userData.age / wave.userData.lifetime;
        wave.scale.setScalar(1 + progress * 3);
        wave.material.opacity = (1 - progress) * 0.5 * intensity;
        
        // Reset ripple
        if (progress >= 1) {
          wave.userData.age = 0;
          wave.position.x = (Math.random() - 0.5) * 80;
          wave.position.z = (Math.random() - 0.5) * 80;
          wave.scale.setScalar(1);
        }
      }
    });
  }
  
  /**
   * AURORA WINDS - Glowing ribbon weather
   */
  createAuroraWindsVFX(weatherDef) {
    const colors = [0xff0000, 0xff00ff, 0x00ffff, 0xff0088, 0x00ff88];
    
    // Create horizontal aurora ribbons
    for (let i = 0; i < 4; i++) {
      const ribbonGeo = new THREE.PlaneGeometry(200, 20);
      const ribbonMat = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        transparent: true,
        opacity: 0,
        emissive: colors[i % colors.length],
        emissiveIntensity: 0.7,
        fog: false
      });
      
      const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
      ribbon.position.set(0, 30 + i * 15, -95);
      ribbon.userData = {
        isAIWeatherVFX: true,
        type: 'aurora_ribbon',
        index: i,
        baseColor: colors[i % colors.length]
      };
      
      this.root.add(ribbon);
      this.vfxLayers.ribbons.push(ribbon);
    }
    
    // Create glowing dust particles
    for (let i = 0; i < 50; i++) {
      const dustGeo = new THREE.SphereGeometry(0.1, 4, 4);
      const dustMat = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        transparent: true,
        opacity: 0,
        emissive: colors[Math.floor(Math.random() * colors.length)],
        emissiveIntensity: 0.6,
        fog: false
      });
      
      const dust = new THREE.Mesh(dustGeo, dustMat);
      dust.position.set(
        (Math.random() - 0.5) * 100,
        Math.random() * 60,
        (Math.random() - 0.5) * 60
      );
      dust.userData = {
        isAIWeatherVFX: true,
        type: 'aurora_dust',
        angle: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.5,
        height: dust.position.y
      };
      
      this.root.add(dust);
      this.vfxLayers.particles.push(dust);
    }
  }
  
  /**
   * Update aurora winds VFX
   */
  updateAuroraWindsVFX(intensity, deltaTime) {
    const colors = [0xff0000, 0xff00ff, 0x00ffff, 0xff0088, 0x00ff88];
    
    // Update ribbons with color cycling
    this.vfxLayers.ribbons.forEach(ribbon => {
      if (ribbon.userData.type === 'aurora_ribbon') {
        ribbon.material.opacity = 0.4 * intensity;
        
        // Wave motion
        ribbon.position.y += Math.sin(this.animationTime * 0.5 + ribbon.userData.index) * 0.5;
        
        // Color pulse
        const colorIdx = Math.floor((this.animationTime * 2 + ribbon.userData.index) % colors.length);
        // Keep original colors rotating
      }
    });
    
    // Update dust particles with wind
    this.vfxLayers.particles.forEach(particle => {
      if (particle.userData.type === 'aurora_dust') {
        particle.userData.angle += particle.userData.speed * deltaTime * 0.5;
        
        const radius = 30;
        particle.position.x = Math.cos(particle.userData.angle) * radius;
        particle.position.z = Math.sin(particle.userData.angle) * radius;
        
        // Gentle up/down motion
        particle.position.y = particle.userData.height + Math.sin(this.animationTime + particle.userData.angle) * 10;
        
        particle.material.opacity = 0.6 * intensity;
      }
    });
  }
  
  /**
   * FRACTAL FOG - Holographic mist weather
   */
  createFractalFogVFX(weatherDef) {
    // Create fog overlay layers
    for (let i = 0; i < 3; i++) {
      const fogGeo = new THREE.PlaneGeometry(200, 200);
      const fogMat = new THREE.MeshBasicMaterial({
        color: weatherDef.color,
        transparent: true,
        opacity: 0,
        emissive: weatherDef.color,
        emissiveIntensity: 0.2,
        fog: false
      });
      
      const fog = new THREE.Mesh(fogGeo, fogMat);
      fog.position.z = -100 + i * 5;
      fog.userData = {
        isAIWeatherVFX: true,
        type: 'fractal_fog',
        layer: i,
        speed: 0.5 + i * 0.2
      };
      
      this.root.add(fog);
      this.vfxLayers.overlays.push(fog);
    }
    
    // Create fractal sprite particles
    for (let i = 0; i < 40; i++) {
      const fractalGeo = new THREE.TetrahedronGeometry(0.15, 2);
      const fractalMat = new THREE.MeshBasicMaterial({
        color: weatherDef.color,
        transparent: true,
        opacity: 0,
        emissive: weatherDef.color,
        emissiveIntensity: 0.5,
        fog: false
      });
      
      const fractal = new THREE.Mesh(fractalGeo, fractalMat);
      fractal.position.set(
        (Math.random() - 0.5) * 100,
        Math.random() * 60,
        (Math.random() - 0.5) * 80
      );
      fractal.userData = {
        isAIWeatherVFX: true,
        type: 'fractal_particle',
        drift: new THREE.Vector3(
          (Math.random() - 0.5) * 1,
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 1
        ),
        rotation: new THREE.Vector3(
          Math.random(),
          Math.random(),
          Math.random()
        ),
        rotationSpeed: Math.random() * 2
      };
      
      this.root.add(fractal);
      this.vfxLayers.particles.push(fractal);
    }
    
    // Create fractal beams
    for (let i = 0; i < 6; i++) {
      const points = [];
      points.push(new THREE.Vector3(0, 50, -50));
      points.push(new THREE.Vector3(0, 0, -50));
      
      const beamGeo = new THREE.BufferGeometry().setFromPoints(points);
      const beamMat = new THREE.LineBasicMaterial({
        color: weatherDef.color,
        transparent: true,
        opacity: 0,
        emissive: weatherDef.color,
        fog: false
      });
      
      const beam = new THREE.Line(beamGeo, beamMat);
      beam.position.set(
        (Math.random() - 0.5) * 80,
        0,
        0
      );
      beam.userData = {
        isAIWeatherVFX: true,
        type: 'fractal_beam',
        frequency: 1 + Math.random() * 2
      };
      
      this.root.add(beam);
      this.vfxLayers.beams.push(beam);
    }
  }
  
  /**
   * Update fractal fog VFX
   */
  updateFractalFogVFX(intensity, deltaTime) {
    // Update fog layers
    this.vfxLayers.overlays.forEach(overlay => {
      if (overlay.userData.type === 'fractal_fog') {
        overlay.material.opacity = intensity * 0.25;
        overlay.rotation.z += deltaTime * 0.02 * overlay.userData.speed;
      }
    });
    
    // Update fractal particles
    this.vfxLayers.particles.forEach(particle => {
      if (particle.userData.type === 'fractal_particle') {
        particle.position.addScaledVector(particle.userData.drift, deltaTime);
        
        // Rotate
        particle.rotation.x += particle.userData.rotationSpeed * deltaTime;
        particle.rotation.y += particle.userData.rotationSpeed * deltaTime * 0.7;
        
        particle.material.opacity = 0.5 * intensity;
        
        // Wrap around
        if (particle.position.x > 100) particle.position.x = -100;
        if (particle.position.x < -100) particle.position.x = 100;
        if (particle.position.y > 80) particle.position.y = 0;
      }
    });
    
    // Update beams
    this.vfxLayers.beams.forEach(beam => {
      if (beam.userData.type === 'fractal_beam') {
        beam.material.opacity = Math.sin(this.animationTime * beam.userData.frequency) * 0.25 + 0.25;
        beam.material.opacity *= intensity;
      }
    });
  }
  
  /**
   * Update wind vector for camera effects and animations
   */
  updateWindVector(deltaTime, linkingSystem) {
    if (!this.registry.active) {
      this.registry.windVector.set(0, 0, 0);
      return;
    }
    
    // Calculate wind based on synergy
    let synergy = 0;
    if (linkingSystem && linkingSystem.links) {
      linkingSystem.links.forEach(link => {
        if (link.glowData && link.glowData.synergy) {
          synergy += link.glowData.synergy;
        }
      });
    }
    
    // Wind direction changes based on weather type
    let windAngle = 0;
    switch(this.registry.active) {
      case 'QUANTUM_STORM':
        windAngle = this.windPhase * 0.5;
        break;
      case 'SIGMA_TURBULENCE':
        windAngle = this.windPhase * 1.5;
        break;
      case 'AURORA_WINDS':
        windAngle = this.windPhase * 0.2;
        break;
      default:
        windAngle = this.windPhase * 0.3;
    }
    
    // Set wind vector
    const windSpeed = Math.sin(windAngle) * 0.5 + 0.5;
    this.registry.windVector.x = Math.cos(windAngle) * windSpeed * this.registry.windStrength;
    this.registry.windVector.z = Math.sin(windAngle) * windSpeed * this.registry.windStrength;
    this.registry.windVector.y = Math.sin(this.windPhase * 0.3) * 0.2 * this.registry.windStrength;
  }
  
  /**
   * End current weather
   */
  endWeather() {
    this.cleanupAllWeatherVFX();
    this.registry.active = null;
    this.registry.timer = 0;
    this.registry.intensity = 0;
    this.registry.phase = 'idle';
    this.registry.windVector.set(0, 0, 0);
  }
  
  /**
   * Clean up all weather VFX
   */
  cleanupAllWeatherVFX() {
    // Remove all overlays
    this.vfxLayers.overlays.forEach(overlay => {
      this.root.remove(overlay);
      if (overlay.geometry) overlay.geometry.dispose();
      if (overlay.material) overlay.material.dispose();
    });
    this.vfxLayers.overlays = [];
    
    // Remove all particles
    this.vfxLayers.particles.forEach(particle => {
      this.root.remove(particle);
      if (particle.geometry) particle.geometry.dispose();
      if (particle.material) particle.material.dispose();
    });
    this.vfxLayers.particles = [];
    
    // Remove all waves
    this.vfxLayers.waves.forEach(wave => {
      this.root.remove(wave);
      if (wave.geometry) wave.geometry.dispose();
      if (wave.material) wave.material.dispose();
    });
    this.vfxLayers.waves = [];
    
    // Remove all ribbons
    this.vfxLayers.ribbons.forEach(ribbon => {
      this.root.remove(ribbon);
      if (ribbon.geometry) ribbon.geometry.dispose();
      if (ribbon.material) ribbon.material.dispose();
    });
    this.vfxLayers.ribbons = [];
    
    // Remove all glitches
    this.vfxLayers.glitches.forEach(glitch => {
      this.root.remove(glitch);
      if (glitch.geometry) glitch.geometry.dispose();
      if (glitch.material) glitch.material.dispose();
    });
    this.vfxLayers.glitches = [];
    
    // Remove all beams
    this.vfxLayers.beams.forEach(beam => {
      this.root.remove(beam);
      if (beam.geometry) beam.geometry.dispose();
      if (beam.material) beam.material.dispose();
    });
    this.vfxLayers.beams = [];
    
    // Remove all glows
    this.vfxLayers.glows.forEach(glow => {
      this.root.remove(glow);
      if (glow.geometry) glow.geometry.dispose();
      if (glow.material) glow.material.dispose();
    });
    this.vfxLayers.glows = [];
    
    // Remove all clouds
    this.vfxLayers.clouds.forEach(cloud => {
      this.root.remove(cloud);
      if (cloud.geometry) cloud.geometry.dispose();
      if (cloud.material) cloud.material.dispose();
    });
    this.vfxLayers.clouds = [];
  }
  
  /**
   * Get weather info for HUD display
   */
  getActiveWeatherInfo() {
    if (!this.registry.active) return null;
    
    const weatherDef = this.weatherTypes[this.registry.active];
    return {
      name: weatherDef.description,
      intensity: this.registry.intensity,
      phase: this.registry.phase
    };
  }
  
  /**
   * Check if weather is active
   */
  isWeatherActive() {
    return !!this.registry.active;
  }
  
  /**
   * Get active weather type
   */
  getActiveWeatherType() {
    return this.registry.active;
  }
  
  /**
   * Get weather intensity
   */
  getWeatherIntensity() {
    return this.registry.intensity;
  }
  
  /**
   * Get wind vector
   */
  getWindVector() {
    return this.registry.windVector.clone();
  }
  
  /**
   * Force trigger specific weather (for testing)
   */
  forceWeather(weatherType, linkingSystem = null) {
    this.startWeather(weatherType, null, linkingSystem);
  }
  
  /**
   * Disable all weather (safe shutdown)
   */
  disableAll() {
    this.cleanupAllWeatherVFX();
    this.registry = {
      active: null,
      timer: 0,
      intensity: 0,
      duration: 0,
      phase: 'idle',
      windVector: new THREE.Vector3(0, 0, 0),
      windStrength: 0
    };
    this.lastWeatherTime = 0;
    this.interpretationAccumulator = 0;
  }

  /**
   * Reset internal state for world switch
   * Clears mutable state without removing objects from scene
   * Safe to call multiple times
   */
  resetForWorldSwitch() {
    // Clear registry state
    if (this.registry) {
      this.registry.active = null;
      this.registry.timer = 0;
      this.registry.intensity = 0;
      this.registry.duration = 0;
      this.registry.phase = 'idle';
      this.registry.windVector.set(0, 0, 0);
      this.registry.windStrength = 0;
    }

    // Clear tracking timestamps
    this.lastWeatherCheck = 0;
    this.lastWeatherTime = 0;
    this.animationTime = 0;
    this.interpretationAccumulator = 0;
  }
}
