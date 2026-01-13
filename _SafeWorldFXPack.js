import * as THREE from 'three';
import { safeSetEmissive } from './_EmissiveUtils.js';

/**
 * SAFE WORLD FX PACK 3.0
 * 
 * ABSOLUTE SAFETY RULES - STRICTLY ENFORCED:
 * - ZERO shader modifications
 * - ZERO material overrides
 * - ZERO file imports or new modules
 * - ZERO geometry replacement
 * - Only VFX overlays, world animations, distortion layers, particles, lighting
 * - All effects are additive and completely reversible
 */

export class SafeWorldFXPack {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    
    // VFX Containers
    this.vfxLayers = {
      dimensionalShifts: [],
      riftWaves: [],
      energyPulses: [],
      fractalSky: null,
      quantumRifts: [],
      sigmaGlitches: [],
      energyStreams: [],
      auroraHorizons: [],
      screenOverlays: []
    };
    
    // State tracking
    this.worldState = {
      totalSynergy: 0,
      totalTraffic: 0,
      activeNodeCount: 0,
      legendaryCount: 0,
      time: 0,
      
      dimensionalPhase: 0,
      riftWaveTimer: 0,
      pulseTimer: 0,
      glitchTimer: 0,
      quantumTimer: 0,
      breathingPhase: 0
    };
    
    // Configuration
    this.config = {
      // Dimensional shifts
      dimensionalShiftInterval: 45,      // Seconds between shifts
      dimensionalIntensity: 0.05,        // 5% color shift max
      dimensionalDuration: 2.0,          // Shift duration
      
      // Rift waves
      riftWaveInterval: 20,              // Seconds between waves
      riftWaveSpeed: 15,                 // Units per second
      riftWaveWidth: 10,                 // Wave width
      
      // Energy pulses
      pulseInterval: 3.0,                // Seconds per pulse
      pulseIntensity: 0.2,               // Glow intensity
      pulseDuration: 1.5,                // Pulse duration
      
      // Quantum rifts
      quantumRiftInterval: 60,           // Seconds between rare events
      quantumRiftChance: 0.02,           // 2% per check
      quantumRiftDuration: 5.0,          // Effect duration
      
      // Sigma glitches
      sigmaGlitchDuration: 0.2,          // Glitch duration
      sigmaGlitchChance: 0.005,          // 0.5% per frame
      
      // World breathing
      breathingSpeed: 0.5,               // Oscillations per second
      breathingIntensity: 0.1            // 10% variation
    };
    
    // Lighting state tracking
    this.originalLights = [];
    this.lights = [];
    this.maxLights = 5;
    
    // Initialize world FX
    this.initializeWorldFX();
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
   * Initialize world FX infrastructure
   */
  initializeWorldFX() {
    // Store existing lights for breathing effect
    this.scene.traverse(obj => {
      if (obj instanceof THREE.Light) {
        this.originalLights.push({
          light: obj,
          originalIntensity: obj.intensity,
          originalColor: obj.color.clone()
        });
        this.lights.push(obj);
      }
    });
    
    // Create fractal sky
    this.createFractalSky();
    
    // Create aurora horizon
    this.createAuroraHorizon();
    
    // Create energy streams
    this.createEnergyStreams();
  }

  /**
   * MATERIAL SAFETY: Ensures material supports emissive properties
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
   * Main update loop
   */
  update(deltaTime, nodes, linkingSystem, evolutionManager, legendaryPack) {
    this.worldState.time += deltaTime;
    
    // Update world metrics from systems
    this.updateWorldMetrics(nodes, linkingSystem, evolutionManager, legendaryPack);
    
    // Update all world FX
    this.updateDimensionalShifts(deltaTime);
    this.updateRiftWaves(deltaTime);
    this.updateEnergyPulses(deltaTime);
    this.updateFractalSky(deltaTime);
    this.updateQuantumRifts(deltaTime);
    this.updateSigmaGlitches(deltaTime);
    this.updateWorldBreathing(deltaTime);
    this.updateEnergyStreams(deltaTime);
    this.updateAuroraHorizon(deltaTime);
  }
  
  /**
   * Update world metrics from game systems
   */
  updateWorldMetrics(nodes, linkingSystem, evolutionManager, legendaryPack) {
    this.worldState.activeNodeCount = nodes ? nodes.length : 0;
    this.worldState.totalSynergy = 0;
    this.worldState.totalTraffic = 0;
    
    // Calculate total network activity
    if (linkingSystem && linkingSystem.links) {
      linkingSystem.links.forEach(link => {
        if (link.glowData) {
          this.worldState.totalSynergy += link.glowData.synergy || 0;
        }
        if (link.traffic) {
          this.worldState.totalTraffic += link.traffic.load || 0;
        }
      });
    }
    
    // Count legendary nodes
    if (legendaryPack) {
      this.worldState.legendaryCount = legendaryPack.getActiveLegendaryCount();
    }
  }
  
  /**
   * DIMENSIONAL SHIFTS - World reality bending
   */
  updateDimensionalShifts(deltaTime) {
    this.worldState.dimensionalPhase += deltaTime;
    
    // Check if shift should trigger
    if (this.worldState.dimensionalPhase > this.config.dimensionalShiftInterval) {
      // Random trigger
      if (Math.random() < 0.3 || this.worldState.totalSynergy > 15) {
        this.triggerDimensionalShift();
      }
      this.worldState.dimensionalPhase = 0;
    }
    
    // Update active dimensional shifts
    this.vfxLayers.dimensionalShifts = this.vfxLayers.dimensionalShifts.filter(shift => {
      shift.age += deltaTime;
      
      // Calculate intensity curve (ease out)
      const progress = Math.min(1, shift.age / this.config.dimensionalDuration);
      const intensity = (1 - progress) * this.config.dimensionalIntensity;
      
      // Apply color shift to world
      this.applyDimensionalColorShift(shift.colorOffset * intensity);
      
      // Fade grid distortion
      if (shift.gridMesh) {
        shift.gridMesh.material.opacity = (1 - progress) * 0.2;
      }
      
      // Remove when done
      if (shift.age > this.config.dimensionalDuration) {
        if (shift.gridMesh) {
          this.scene.remove(shift.gridMesh);
          shift.gridMesh.geometry.dispose();
          shift.gridMesh.material.dispose();
        }
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Trigger a dimensional shift event
   */
  triggerDimensionalShift() {
    // Create grid distortion mesh
    const gridGeo = new THREE.BufferGeometry();
    const gridSize = 200;
    const gridSpacing = 10;
    
    // Create grid lines
    const points = [];
    for (let x = -gridSize; x <= gridSize; x += gridSpacing) {
      points.push(new THREE.Vector3(x, 0, -gridSize));
      points.push(new THREE.Vector3(x, 0, gridSize));
    }
    for (let z = -gridSize; z <= gridSize; z += gridSpacing) {
      points.push(new THREE.Vector3(-gridSize, 0, z));
      points.push(new THREE.Vector3(gridSize, 0, z));
    }
    
    gridGeo.setFromPoints(points);
    
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.2,
      fog: false
    });
    
    const gridMesh = new THREE.LineSegments(gridGeo, gridMat);
    gridMesh.position.y = 0.5;
    gridMesh.userData = { isWorldFX: true, type: 'dimensional_shift' };
    this.scene.add(gridMesh);
    
    // Choose random color shift direction
    const colorOffsets = [
      { r: 0.05, g: -0.03, b: 0.05 },  // Toward magenta
      { r: -0.03, g: 0.05, b: 0.05 },  // Toward cyan
      { r: 0.05, g: 0.05, b: -0.03 }   // Toward yellow
    ];
    
    const shift = {
      age: 0,
      gridMesh: gridMesh,
      colorOffset: colorOffsets[Math.floor(Math.random() * colorOffsets.length)]
    };
    
    this.vfxLayers.dimensionalShifts.push(shift);
  }
  
  /**
   * Apply dimensional color shift
   */
  applyDimensionalColorShift(intensity) {
    // This would be applied via post-processing or camera manipulation
    // For now, we modulate lighting slightly
    if (this.lights.length > 0) {
      const mainLight = this.lights[0];
      if (mainLight.color) {
        mainLight.color.r = Math.min(1, mainLight.color.r + intensity * 0.1);
        mainLight.color.b = Math.min(1, mainLight.color.b + intensity * 0.1);
      }
    }
  }
  
  /**
   * RIFT WAVES - Ground-level wave propagation
   */
  updateRiftWaves(deltaTime) {
    this.worldState.riftWaveTimer += deltaTime;
    
    // Spawn new rift wave
    if (this.worldState.riftWaveTimer > this.config.riftWaveInterval) {
      this.spawnRiftWave();
      this.worldState.riftWaveTimer = 0;
    }
    
    // Update active rift waves
    this.vfxLayers.riftWaves = this.vfxLayers.riftWaves.filter(wave => {
      wave.age += deltaTime;
      wave.distance += this.config.riftWaveSpeed * deltaTime;
      
      // Update wave mesh position
      if (wave.mesh) {
        if (wave.type === 'linear') {
          wave.mesh.position.z = wave.startZ + wave.distance;
        } else if (wave.type === 'radial') {
          wave.mesh.scale.setScalar(1 + wave.distance * 0.1);
        }
        
        // Fade opacity
        const maxDistance = 200;
        wave.mesh.material.opacity = Math.max(0, 0.6 - (wave.distance / maxDistance) * 0.6);
      }
      
      // Remove when off-screen
      if (wave.distance > 300) {
        if (wave.mesh) {
          this.scene.remove(wave.mesh);
          wave.mesh.geometry.dispose();
          wave.mesh.material.dispose();
        }
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Spawn a rift wave
   */
  spawnRiftWave() {
    const waveType = Math.random() > 0.5 ? 'linear' : 'radial';
    
    if (waveType === 'linear') {
      // Create linear wave
      const waveGeo = new THREE.PlaneGeometry(100, this.config.riftWaveWidth);
      const waveMat = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.6,
        emissive: 0x00ffff,
        emissiveIntensity: 0.3,
        fog: false
      });
      
      const waveMesh = new THREE.Mesh(waveGeo, waveMat);
      waveMesh.position.z = -50;
      waveMesh.position.y = 0.1;
      waveMesh.rotation.x = -Math.PI / 2;
      waveMesh.userData = { isWorldFX: true, type: 'rift_wave' };
      
      this.scene.add(waveMesh);
      
      this.vfxLayers.riftWaves.push({
        age: 0,
        distance: 0,
        startZ: waveMesh.position.z,
        type: 'linear',
        mesh: waveMesh
      });
    } else {
      // Create radial shockwave
      const waveGeo = new THREE.BufferGeometry();
      const circlePoints = [];
      const segments = 64;
      
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        circlePoints.push(
          new THREE.Vector3(
            Math.cos(angle) * 50,
            0.1,
            Math.sin(angle) * 50
          )
        );
      }
      
      waveGeo.setFromPoints(circlePoints);
      
      const waveMat = new THREE.LineBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.6,
        fog: false
      });
      
      const waveMesh = new THREE.Line(waveGeo, waveMat);
      waveMesh.position.copy(this.scene.position);
      waveMesh.userData = { isWorldFX: true, type: 'rift_wave_radial' };
      
      this.scene.add(waveMesh);
      
      this.vfxLayers.riftWaves.push({
        age: 0,
        distance: 0,
        type: 'radial',
        mesh: waveMesh
      });
    }
  }
  
  /**
   * GLOBAL ENERGY PULSES - World-wide AI heartbeat
   */
  updateEnergyPulses(deltaTime) {
    this.worldState.pulseTimer += deltaTime;
    
    // Calculate pulse strength from network activity
    const activityLevel = Math.min(1, this.worldState.totalSynergy / 30);
    const pulseInterval = this.config.pulseInterval / (0.5 + activityLevel);
    
    // Trigger pulse
    if (this.worldState.pulseTimer > pulseInterval) {
      this.triggerGlobalPulse(activityLevel);
      this.worldState.pulseTimer = 0;
    }
    
    // Update active pulses
    this.vfxLayers.energyPulses = this.vfxLayers.energyPulses.filter(pulse => {
      pulse.age += deltaTime;
      
      // Calculate pulse curve (ease in-out)
      const progress = Math.min(1, pulse.age / this.config.pulseDuration);
      const pulseValue = Math.sin(progress * Math.PI);
      
      // Apply pulse to lights
      this.applyPulseToLights(pulseValue * pulse.intensity);
      
      // Remove when done
      if (pulse.age > this.config.pulseDuration) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Trigger a global energy pulse
   */
  triggerGlobalPulse(intensity) {
    this.vfxLayers.energyPulses.push({
      age: 0,
      intensity: this.config.pulseIntensity * (0.5 + intensity)
    });
  }
  
  /**
   * Apply pulse to world lights
   */
  applyPulseToLights(pulseValue) {
    this.originalLights.forEach(lightData => {
      if (lightData.light.intensity !== undefined) {
        lightData.light.intensity = lightData.light.intensity + pulseValue * 0.1;
      }
    });
  }
  
  /**
   * FRACTAL SKY OVERLAY
   */
  createFractalSky() {
    // Create animated fractal lines in sky
    const fractalGeo = new THREE.BufferGeometry();
    const fractalPoints = [];
    
    // Generate fractal-like line patterns
    const iterations = 4;
    const scale = 100;
    
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const radius = scale * Math.pow(0.6, iter);
        
        fractalPoints.push(
          new THREE.Vector3(
            Math.cos(angle) * radius,
            60 + iter * 10,
            Math.sin(angle) * radius
          )
        );
        
        const nextAngle = ((i + 1) / 20) * Math.PI * 2;
        fractalPoints.push(
          new THREE.Vector3(
            Math.cos(nextAngle) * radius,
            60 + iter * 10,
            Math.sin(nextAngle) * radius
          )
        );
      }
    }
    
    fractalGeo.setFromPoints(fractalPoints);
    
    const fractalMat = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.15,
      fog: false
    });
    
    const fractalMesh = new THREE.LineSegments(fractalGeo, fractalMat);
    fractalMesh.userData = { isWorldFX: true, type: 'fractal_sky' };
    
    this.scene.add(fractalMesh);
    this.vfxLayers.fractalSky = fractalMesh;
  }
  
  /**
   * Update fractal sky
   */
  updateFractalSky(deltaTime) {
    if (!this.vfxLayers.fractalSky) return;
    
    // Slow rotation
    this.vfxLayers.fractalSky.rotation.z += deltaTime * 0.05;
    this.vfxLayers.fractalSky.rotation.x += deltaTime * 0.02;
    
    // Color cycling
    const colorPhase = (this.worldState.time * 0.3) % (Math.PI * 2);
    const r = 0.5 + Math.sin(colorPhase) * 0.5;
    const g = 0.5 + Math.sin(colorPhase + Math.PI * 0.33) * 0.5;
    const b = 0.5 + Math.sin(colorPhase + Math.PI * 0.66) * 0.5;
    
    this.vfxLayers.fractalSky.material.color.setRGB(r * 0.5, g * 0.5, b * 0.5);
  }
  
  /**
   * QUANTUM RIFT EVENTS - Rare visual phenomena
   */
  updateQuantumRifts(deltaTime) {
    this.worldState.quantumTimer += deltaTime;
    
    // Chance to spawn quantum rift
    if (this.worldState.quantumTimer > this.config.quantumRiftInterval) {
      if (Math.random() < this.config.quantumRiftChance * 60 || this.worldState.legendaryCount > 0) {
        this.spawnQuantumRift();
      }
      this.worldState.quantumTimer = 0;
    }
    
    // Update active quantum rifts
    this.vfxLayers.quantumRifts = this.vfxLayers.quantumRifts.filter(rift => {
      rift.age += deltaTime;
      
      // Calculate ripple animation
      const ripplePhase = (rift.age / this.config.quantumRiftDuration) * Math.PI;
      
      // Update rift mesh
      if (rift.mesh) {
        rift.mesh.scale.setScalar(1 + Math.sin(ripplePhase) * 0.2);
        rift.mesh.material.opacity = Math.max(0, (1 - rift.age / this.config.quantumRiftDuration) * 0.8);
      }
      
      // Update ripple rings
      rift.ripples.forEach((ripple, idx) => {
        ripple.mesh.scale.setScalar(1 + (ripplePhase + idx * 0.5) * 0.3);
        ripple.mesh.material.opacity = Math.max(0, (1 - rift.age / this.config.quantumRiftDuration) * 0.4);
      });
      
      // Remove when done
      if (rift.age > this.config.quantumRiftDuration) {
        if (rift.mesh) {
          this.scene.remove(rift.mesh);
          rift.mesh.geometry.dispose();
          rift.mesh.material.dispose();
        }
        rift.ripples.forEach(r => {
          this.scene.remove(r.mesh);
          r.mesh.geometry.dispose();
          r.mesh.material.dispose();
        });
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Spawn a quantum rift event
   */
  spawnQuantumRift() {
    // Random position in view
    const x = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 100;
    
    // Create main rift mesh (teardrop-like)
    const riftGeo = new THREE.IcosahedronGeometry(10, 4);
    const riftMat = new THREE.MeshStandardMaterial({
      color: 0x8800ff,
      transparent: true,
      opacity: 0.6,
      emissive: 0x8800ff,
      emissiveIntensity: 0.5,
      fog: false
    });
    
    const riftMesh = new THREE.Mesh(riftGeo, riftMat);
    riftMesh.position.set(x, 30, z);
    riftMesh.userData = { isWorldFX: true, type: 'quantum_rift' };
    this.scene.add(riftMesh);
    
    // Create ripple rings
    const ripples = [];
    for (let i = 0; i < 3; i++) {
      const rippleGeo = new THREE.TorusGeometry(12 + i * 8, 1, 12, 64);
      const rippleMat = new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0.4,
        emissive: 0xff00ff,
        emissiveIntensity: 0.3,
        fog: false
      });
      
      const rippleMesh = new THREE.Mesh(rippleGeo, rippleMat);
      rippleMesh.position.set(x, 30, z);
      rippleMesh.rotation.x = Math.random() * Math.PI;
      rippleMesh.userData = { isWorldFX: true, type: 'quantum_rift_ripple' };
      this.scene.add(rippleMesh);
      
      ripples.push({ mesh: rippleMesh });
    }
    
    this.vfxLayers.quantumRifts.push({
      age: 0,
      mesh: riftMesh,
      ripples: ripples
    });
  }
  
  /**
   * SIGMA ANOMALY GLITCHES - Digital anomalies
   */
  updateSigmaGlitches(deltaTime) {
    this.worldState.glitchTimer += deltaTime;
    
    // Random glitch chance
    if (Math.random() < this.config.sigmaGlitchChance) {
      this.triggerSigmaGlitch();
    }
    
    // Update active glitches
    this.vfxLayers.sigmaGlitches = this.vfxLayers.sigmaGlitches.filter(glitch => {
      glitch.age += deltaTime;
      
      // Fade out
      glitch.alpha = Math.max(0, 1 - glitch.age / this.config.sigmaGlitchDuration);
      
      if (glitch.mesh) {
        glitch.mesh.material.opacity = glitch.alpha * 0.4;
      }
      
      // Remove when done
      if (glitch.age > this.config.sigmaGlitchDuration) {
        if (glitch.mesh) {
          this.scene.remove(glitch.mesh);
          glitch.mesh.geometry.dispose();
          glitch.mesh.material.dispose();
        }
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Trigger a sigma glitch
   */
  triggerSigmaGlitch() {
    // Random glitch position on screen
    const x = Math.random() * 100 - 50;
    const z = Math.random() * 100 - 50;
    
    // Create vertical glitch stripes
    const stripeCount = 3 + Math.floor(Math.random() * 3);
    const glitchGeo = new THREE.BufferGeometry();
    const points = [];
    
    for (let i = 0; i < stripeCount; i++) {
      const stripeX = x + (Math.random() - 0.5) * 20;
      points.push(new THREE.Vector3(stripeX, 0, z));
      points.push(new THREE.Vector3(stripeX, 20, z));
    }
    
    glitchGeo.setFromPoints(points);
    
    const glitchMat = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.4,
      fog: false
    });
    
    const glitchMesh = new THREE.LineSegments(glitchGeo, glitchMat);
    glitchMesh.userData = { isWorldFX: true, type: 'sigma_glitch' };
    this.scene.add(glitchMesh);
    
    this.vfxLayers.sigmaGlitches.push({
      age: 0,
      alpha: 1,
      mesh: glitchMesh
    });
  }
  
  /**
   * WORLD BREATHING - Ambient slow oscillation
   */
  updateWorldBreathing(deltaTime) {
    this.worldState.breathingPhase += deltaTime * this.config.breathingSpeed;
    
    // Calculate breathing curve (sine wave)
    const breathValue = Math.sin(this.worldState.breathingPhase) * this.config.breathingIntensity;
    
    // Apply breathing to lights
    this.originalLights.forEach(lightData => {
      if (lightData.light && lightData.light.intensity !== undefined && lightData.originalIntensity !== undefined) {
        lightData.light.intensity = lightData.originalIntensity * (1 + breathValue);
      }
    });
    
    // Color drift between cool and warm
    const colorPhase = this.worldState.breathingPhase * 0.5;
    const coolWarmShift = Math.sin(colorPhase) * 0.02;
    
    this.originalLights.forEach(lightData => {
      if (lightData.light && lightData.light.color && lightData.originalColor) {
        lightData.light.color.r = Math.min(1, lightData.originalColor.r + coolWarmShift);
        lightData.light.color.b = Math.min(1, lightData.originalColor.b - coolWarmShift * 0.5);
      }
    });
  }
  
  /**
   * ENERGY STREAMS - Neon flows across landscape
   */
  createEnergyStreams() {
    const streamCount = 4;
    
    for (let i = 0; i < streamCount; i++) {
      const streamGeo = new THREE.BufferGeometry();
      const points = [];
      
      const segmentCount = 50;
      for (let s = 0; s <= segmentCount; s++) {
        const t = s / segmentCount;
        points.push(
          new THREE.Vector3(
            Math.cos(t * Math.PI * 2 + i) * 50,
            0.2,
            (t - 0.5) * 200
          )
        );
      }
      
      streamGeo.setFromPoints(points);
      
      const streamMat = new THREE.LineBasicMaterial({
        color: new THREE.Color().setHSL(0.5 + i * 0.1, 1, 0.5),
        transparent: true,
        opacity: 0.3,
        fog: false,
        linewidth: 3
      });
      
      const streamMesh = new THREE.Line(streamGeo, streamMat);
      streamMesh.position.z = i * 30 - 45;
      streamMesh.userData = {
        isWorldFX: true,
        type: 'energy_stream',
        baseZ: streamMesh.position.z,
        index: i
      };
      
      this.scene.add(streamMesh);
      this.vfxLayers.energyStreams.push(streamMesh);
    }
  }
  
  /**
   * Update energy streams
   */
  updateEnergyStreams(deltaTime) {
    const activityLevel = Math.min(1, this.worldState.totalTraffic / 20);
    
    this.vfxLayers.energyStreams.forEach((stream, idx) => {
      // Flow animation
      stream.position.z += (5 + activityLevel * 10) * deltaTime;
      
      // Reset position
      if (stream.position.z > 100) {
        stream.position.z = -100;
      }
      
      // Color shift based on activity
      stream.material.opacity = 0.2 + activityLevel * 0.4;
    });
  }
  
  /**
   * AURORA HORIZONS - Light bands at horizon
   */
  createAuroraHorizon() {
    const auroraGeo = new THREE.BufferGeometry();
    const auroraPoints = [];
    
    // Create horizontal wave pattern
    const waveCount = 3;
    for (let w = 0; w < waveCount; w++) {
      for (let x = -200; x <= 200; x += 10) {
        const offset = Math.sin((x + this.worldState.time) * 0.05) * 5;
        auroraPoints.push(
          new THREE.Vector3(x, 40 + w * 8 + offset, 0)
        );
        auroraPoints.push(
          new THREE.Vector3(x, 40 + w * 8 + 3 + offset, 0)
        );
      }
    }
    
    auroraGeo.setFromPoints(auroraPoints);
    
    const auroraMat = new THREE.LineBasicMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.3,
      fog: false
    });
    
    const auroraMesh = new THREE.LineSegments(auroraGeo, auroraMat);
    auroraMesh.userData = { isWorldFX: true, type: 'aurora_horizon' };
    
    this.scene.add(auroraMesh);
    this.vfxLayers.auroraHorizons.push(auroraMesh);
  }
  
  /**
   * Update aurora horizon
   */
  updateAuroraHorizon(deltaTime) {
    this.vfxLayers.auroraHorizons.forEach(aurora => {
      // Slow drift animation
      aurora.rotation.z += deltaTime * 0.05;
      
      // Color cycling
      const phase = (this.worldState.time * 0.5) % (Math.PI * 2);
      const hue = 0.3 + Math.sin(phase) * 0.1;
      aurora.material.color.setHSL(hue, 1, 0.5);
    });
  }
  
  /**
   * Cleanup all world FX
   */
  disableAll() {
    // Clean dimensional shifts
    this.vfxLayers.dimensionalShifts.forEach(shift => {
      if (shift.gridMesh) {
        this.scene.remove(shift.gridMesh);
        shift.gridMesh.geometry.dispose();
        shift.gridMesh.material.dispose();
      }
    });
    
    // Clean rift waves
    this.vfxLayers.riftWaves.forEach(wave => {
      if (wave.mesh) {
        this.scene.remove(wave.mesh);
        wave.mesh.geometry.dispose();
        wave.mesh.material.dispose();
      }
    });
    
    // Clean quantum rifts
    this.vfxLayers.quantumRifts.forEach(rift => {
      if (rift.mesh) {
        this.scene.remove(rift.mesh);
        rift.mesh.geometry.dispose();
        rift.mesh.material.dispose();
      }
      rift.ripples.forEach(r => {
        this.scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        r.mesh.material.dispose();
      });
    });
    
    // Clean sigma glitches
    this.vfxLayers.sigmaGlitches.forEach(glitch => {
      if (glitch.mesh) {
        this.scene.remove(glitch.mesh);
        glitch.mesh.geometry.dispose();
        glitch.mesh.material.dispose();
      }
    });
    
    // Clean fractal sky
    if (this.vfxLayers.fractalSky) {
      this.scene.remove(this.vfxLayers.fractalSky);
      this.vfxLayers.fractalSky.geometry.dispose();
      this.vfxLayers.fractalSky.material.dispose();
    }
    
    // Clean energy streams
    this.vfxLayers.energyStreams.forEach(stream => {
      this.scene.remove(stream);
      stream.geometry.dispose();
      stream.material.dispose();
    });
    
    // Clean aurora horizons
    this.vfxLayers.auroraHorizons.forEach(aurora => {
      this.scene.remove(aurora);
      aurora.geometry.dispose();
      aurora.material.dispose();
    });
    
    // Restore original lights
    this.originalLights.forEach(lightData => {
      if (lightData.light && lightData.light.intensity !== undefined && lightData.originalIntensity !== undefined) {
        lightData.light.intensity = lightData.originalIntensity;
      }
      if (lightData.light && lightData.light.color && lightData.originalColor) {
        lightData.light.color.copy(lightData.originalColor);
      }
    });
    
    // Clear all tracking
    this.vfxLayers = {
      dimensionalShifts: [],
      riftWaves: [],
      energyPulses: [],
      fractalSky: null,
      quantumRifts: [],
      sigmaGlitches: [],
      energyStreams: [],
      auroraHorizons: [],
      screenOverlays: []
    };
  }
}
