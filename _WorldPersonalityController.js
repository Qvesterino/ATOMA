/**
 * PERSONALITY-DRIVEN WORLD EVENTS 2.0 (SAFE EDITION)
 * 
 * Makes the world visually react to the global emotional/metric state of the node network.
 * Analyzes the collective personality and metrics of all nodes to determine a "global mood"
 * and applies atmospheric visual effects accordingly.
 * 
 * HARD SAFETY RULES:
 * - NO modifications to player movement, camera, physics, linking, input
 * - World events are purely visual + ambient
 * - All effects layered on top of existing world (non-destructive)
 * - GPU-friendly and reversible
 * - Graceful degradation on missing data
 * 
 * FEATURES:
 * 1. GLOBAL STATE ANALYZER
 *    - Scans nodes every 5-10s (throttled)
 *    - Computes aggregate metrics (harmony, stability, clarity, loadPressure)
 *    - Derives global mood label (7 mood types)
 *    - Emits world.mood snapshot/change events plus bridge metric tags
 * 
 * 2. WORLD EVENT TYPES
 *    - HARMONIC_CALM: Warm sky, gentle light shafts
 *    - FOCUSED_ANALYSIS: Crisp contrast, data particles
 *    - RADIANT_STORM: Pulsing arcs, load-pressure surges
 *    - QUANTUM_CHAOS: Nebula patterns, distortion waves
 *    - UMBRA_PRESSURE: Dark fog, shadow bands
 *    - ECHO_DRIFT: Horizontal streaks, memory winds
 *    - ASCENDED_ALIGNMENT: Aurora, pillars of light
 * 
 * 3. EVENT TRIGGERING
 *    - State machine with smooth transitions
 *    - Min duration 20-40s per event
 *    - Smooth crossfades between moods
 * 
 * 4. LOCALIZED REACTIONS
 *    - Cluster detection for local effects
 *    - Harmony clusters get light blooms
 *    - Chaos clusters get shimmer effects
 * 
 * 5. HUD FEEDBACK
 *    - Non-intrusive mood display
 *    - Fade in/out transitions
 */

import * as THREE from 'three';
import { tagAllowedSphere, clampSphere } from './VisualSpherePolicy.js';

export class WorldPersonalityController {
  constructor(scene, worldRoot, camera, renderer) {
    this.scene = scene;
    this.worldRoot = worldRoot || scene;
    this.camera = camera;
    this.renderer = renderer;
    this.root = new THREE.Group();
    this.worldRoot.add(this.root);
    
    // Global network mood state
    this.worldMood = {
      label: 'NEUTRAL',
      intensity: 0.0,
      dominantPersonality: null,
      avgHarmony: 0,
      avgStability: 0,
      avgClarity: 0,
      avgEnergy: 0,
    };
    
    // Previous mood for transition tracking
    this.previousMoodLabel = 'NEUTRAL';
    this.semanticBus = null;
    
    // Timing control
    this.lastScanTime = 0;
    this.scanInterval = 7.0; // Scan every 7 seconds
    this.lastMoodChangeTime = 0;
    this.minMoodDuration = 25.0; // Min 25s per mood
    
    // Transition state
    this.transitionProgress = 0;
    this.transitionDuration = 5.0; // 5s crossfade
    this.isTransitioning = false;
    
    // World event visuals
    this.activeEventVisuals = new Map();
    
    // Localized cluster tracking
    this.personalityClusters = [];
    this.lastClusterCheck = 0;
    this.clusterCheckInterval = 10.0; // Check every 10s
    
    // Phase B pilot: low-frequency interpretation gating (separate meaning from visuals)
    this.interpretationInterval = 0.25; // ~4 Hz cadence for mood evaluation
    this.interpretationAccumulator = 0;
    
    // HUD element
    this.hudElement = null;
    this.hudVisible = false;
    this.hudFadeProgress = 0;
    
    // Performance tracking
    this.performanceMode = 'normal';
    
    // Base world state (to restore on cleanup)
    this.baseWorldState = {
      fogColor: null,
      fogNear: null,
      fogDensity: null,
      backgroundColor: null,
    };
    
    this.initializeHUD();
    this.captureBaseWorldState();
    
    console.log('✓ World Personality Controller 2.0 initialized');
  }

  tagFXMaterial(material) {
    if (!material) return;
    material.userData = material.userData || {};
    material.userData.__owner = material.userData.__owner || 'WorldPersonalityController';
    material.userData.__domain = material.userData.__domain || 'overlay';
  }

  blockBaseMaterialMutation(material, context) {
    if (!material) return false;
    if (material.userData?.__domain === 'base') {
      console.warn('[WPC] Attempted base material mutation blocked', context, material.uuid);
      return true;
    }
    return false;
  }
  
  /**
   * Capture base world state for restoration
   */
  captureBaseWorldState() {
    if (this.scene.fog) {
      this.baseWorldState.fogColor = this.scene.fog.color.clone();
      if (this.scene.fog.near !== undefined) {
        this.baseWorldState.fogNear = this.scene.fog.near;
        this.baseWorldState.fogFar = this.scene.fog.far;
      }
      if (this.scene.fog.density !== undefined) {
        this.baseWorldState.fogDensity = this.scene.fog.density;
      }
    }
    
    if (this.scene.background) {
      this.baseWorldState.backgroundColor = this.scene.background.clone();
    }
  }
  
  /**
   * Initialize HUD display
   */
  initializeHUD() {
    this.hudElement = document.createElement('div');
    this.hudElement.id = 'atoma-mood-display';
    this.hudElement.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(0, 255, 255, 0.4);
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #00ffff;
      z-index: 9998;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.5s;
      text-align: right;
    `;
    
    document.body.appendChild(this.hudElement);
  }
  
  /**
   * Main update loop
   */
  update(deltaTime, nodes) {
    if (!nodes || nodes.length === 0) return;
    
    // Phase B pilot: low-frequency interpretation gating
    // Only the semantic evaluation (mood scanning + aggregation) is throttled; visuals stay 60 Hz.
    this.interpretationAccumulator += deltaTime;
    if (this.interpretationAccumulator >= this.interpretationInterval) {
      const interpretationDelta = this.interpretationAccumulator;
      this.interpretationAccumulator = 0;
      
      // Scan network for mood (throttled)
      this.lastScanTime += interpretationDelta;
      if (this.lastScanTime >= this.scanInterval) {
        this.scanNetworkMood(nodes);
        this.lastScanTime = 0;
      }
      
      // Update cluster detection (less frequent)
      this.lastClusterCheck += interpretationDelta;
      if (this.lastClusterCheck >= this.clusterCheckInterval) {
        this.detectPersonalityClusters(nodes);
        this.lastClusterCheck = 0;
      }
    }
    
    // Update transition progress
    if (this.isTransitioning) {
      this.transitionProgress += deltaTime / this.transitionDuration;
      if (this.transitionProgress >= 1.0) {
        this.transitionProgress = 1.0;
        this.isTransitioning = false;
      }
    }
    
    // Apply world event effects
    this.applyWorldEventEffects(deltaTime);
    
    // Update localized cluster effects
    this.updateClusterEffects(deltaTime);
    
    // Update HUD
    this.updateHUD(deltaTime);
  }
  
  /**
   * Scan all nodes and compute global network mood
   */
  scanNetworkMood(nodes) {
    let totalHarmony = 0;
    let totalStability = 0;
    let totalClarity = 0;
    let totalEnergy = 0;
    let validNodeCount = 0;
    
    // Personality distribution
    const personalityCount = {};
    
    nodes.forEach(node => {
      const metrics = node.userData?.metrics;
      const personality = node.userData?.personality;
      
      if (metrics) {
        totalHarmony += metrics.harmonyAffinity || 0;
        totalStability += metrics.stability || 0;
        totalClarity += metrics.stability || 0;
        totalEnergy += metrics.loadPressure || 0;
        validNodeCount++;
      }
      
      if (personality?.type) {
        personalityCount[personality.type] = (personalityCount[personality.type] || 0) + 1;
      }
    });
    
    if (validNodeCount === 0) return;
    
    // Compute averages
    const avgHarmony = totalHarmony / validNodeCount;
    const avgStability = totalStability / validNodeCount;
    const avgClarity = totalClarity / validNodeCount;
    const avgEnergy = totalEnergy / validNodeCount;
    
    // Find dominant personality
    let dominantPersonality = null;
    let maxCount = 0;
    Object.keys(personalityCount).forEach(type => {
      if (personalityCount[type] > maxCount) {
        maxCount = personalityCount[type];
        dominantPersonality = type;
      }
    });
    
    // Determine mood label based on metrics
    const previousMoodLabel = this.worldMood.label;
    const newMoodLabel = this.determineMoodLabel(
      avgHarmony,
      avgStability,
      avgClarity,
      avgEnergy,
      personalityCount
    );

    // Calculate mood intensity (0-1)
    const intensity = this.calculateMoodIntensity(
      avgHarmony,
      avgStability,
      avgClarity,
      avgEnergy
    );
    
    // Update world mood
    const moodChanged = newMoodLabel !== this.worldMood.label;
    
    this.worldMood = {
      label: newMoodLabel,
      intensity,
      dominantPersonality,
      avgHarmony,
      avgStability,
      avgClarity,
      avgEnergy,
    };
    
    // Trigger transition if mood changed and min duration elapsed
    const timeSinceLastChange = Date.now() / 1000 - this.lastMoodChangeTime;
    if (moodChanged && timeSinceLastChange >= this.minMoodDuration) {
      this.triggerMoodTransition(previousMoodLabel, newMoodLabel);
    }

    this._emitMoodBridge({
      label: newMoodLabel,
      intensity,
      dominantPersonality,
      avgHarmony,
      avgStability,
      avgClarity,
      avgEnergy,
      ascendedCount: personalityCount['ASCENDED_MYTHIC'] || 0,
      nodeCount: validNodeCount,
      personalityCount: { ...personalityCount },
    }, moodChanged, previousMoodLabel);
  }
  
  /**
   * Determine mood label from aggregated metrics
   */
  determineMoodLabel(harmony, stability, clarity, loadPressure, personalityCount) {
    // Check for ASCENDED_ALIGNMENT (many ascended/mythic nodes)
    const ascendedCount = personalityCount['ASCENDED_MYTHIC'] || 0;
    if (ascendedCount >= 3) {
      return 'ASCENDED_ALIGNMENT';
    }
    
    // HARMONIC_CALM: high harmony, high stability
    if (harmony > 70 && stability > 60) {
      return 'HARMONIC_CALM';
    }
    
    // FOCUSED_ANALYSIS: high clarity, mid-high stability
    if (clarity > 75 && stability > 70) {
      return 'FOCUSED_ANALYSIS';
    }

    // RADIANT_STORM: high load pressure, mid-low stability
    if (loadPressure > 75 && stability > 20 && stability < 50) {
      return 'RADIANT_STORM';
    }

    // QUANTUM_CHAOS: very low stability
    if (stability < 25) {
      return 'QUANTUM_CHAOS';
    }

    // UMBRA_PRESSURE: mid load pressure, low stability, low harmony
    if (loadPressure > 40 && loadPressure < 70 && stability < 40 && harmony < 50) {
      return 'UMBRA_PRESSURE';
    }
    
    // ECHO_DRIFT: low load pressure, mid harmony
    if (loadPressure < 45 && harmony > 40 && harmony < 70) {
      return 'ECHO_DRIFT';
    }
    
    // Default: NEUTRAL
    return 'NEUTRAL';
  }
  
  /**
   * Calculate mood intensity based on metric extremes
   */
  calculateMoodIntensity(harmony, stability, clarity, loadPressure) {
    // Intensity is based on how extreme metrics are
    const harmonySigma = Math.abs(harmony - 60) / 60; // 60 is mid-range
    const stabilitySigma = (100 - stability) / 100; // Lower stability = higher intensity
    const claritySigma = Math.abs(clarity - 60) / 60;
    const energySigma = Math.abs(loadPressure - 60) / 60;
    
    const avgSigma = (harmonySigma + stabilitySigma + claritySigma + energySigma) / 4;
    
    return Math.min(1.0, avgSigma * 1.5); // Amplify slightly
  }
  
  /**
   * Trigger transition to new mood
   */
  triggerMoodTransition(previousMoodLabel, newMoodLabel) {
    this.previousMoodLabel = previousMoodLabel;
    this.worldMood.label = newMoodLabel;
    this.isTransitioning = true;
    this.transitionProgress = 0;
    this.lastMoodChangeTime = Date.now() / 1000;
    
    console.log(`World mood transition: ${this.previousMoodLabel} → ${newMoodLabel}`);
  }
  
  /**
   * Apply world event visual effects based on current mood
   */
  applyWorldEventEffects(deltaTime) {
    const mood = this.worldMood.label;
    const intensity = this.worldMood.intensity;
    const t = this.isTransitioning ? this.transitionProgress : 1.0;
    
    switch (mood) {
      case 'HARMONIC_CALM':
        this.applyHarmonicCalm(intensity, t, deltaTime);
        break;
      
      case 'FOCUSED_ANALYSIS':
        this.applyFocusedAnalysis(intensity, t, deltaTime);
        break;
      
      case 'RADIANT_STORM':
        this.applyRadiantStorm(intensity, t, deltaTime);
        break;
      
      case 'QUANTUM_CHAOS':
        this.applyQuantumChaos(intensity, t, deltaTime);
        break;
      
      case 'UMBRA_PRESSURE':
        this.applyUmbraPressure(intensity, t, deltaTime);
        break;
      
      case 'ECHO_DRIFT':
        this.applyEchoDrift(intensity, t, deltaTime);
        break;
      
      case 'ASCENDED_ALIGNMENT':
        this.applyAscendedAlignment(intensity, t, deltaTime);
        break;
      
      default: // NEUTRAL
        this.applyNeutralState(t);
        break;
    }
    
    // Animate active visuals
    this.animateActiveVisuals(deltaTime);
  }
  
  /**
   * Animate all active visual effects
   */
  animateActiveVisuals(deltaTime) {
    this.activeEventVisuals.forEach((visual, key) => {
      switch (visual.type) {
        case 'harmonic_shafts':
          // Gentle rotation
          if (visual.object) {
            visual.object.rotation.y += deltaTime * 0.05;
          }
          break;
        
        case 'data_particles':
          // Fall and reset
          if (visual.object && visual.object.userData.velocity) {
            visual.object.position.add(visual.object.userData.velocity.clone().multiplyScalar(deltaTime));
            
            // Reset if fallen too far
            if (visual.object.position.y < 0) {
              visual.object.position.y = 50;
            }
          }
          break;
        
        case 'energy_arcs':
          // Pulse opacity
          if (visual.object) {
            visual.pulsePhase = (visual.pulsePhase || 0) + deltaTime * 2;
            const pulseFactor = Math.sin(visual.pulsePhase) * 0.3 + 0.7;
            
            visual.object.children.forEach(arc => {
              if (arc.material && !this.blockBaseMaterialMutation(arc.material, 'energy_arcs.opacity')) {
                arc.material.opacity = 0.4 * this.worldMood.intensity * pulseFactor;
              }
            });
          }
          break;
        
        case 'chaos_nebula':
          // Slow rotation and drift
          if (visual.object) {
            visual.object.rotation.y += deltaTime * 0.02;
            visual.object.rotation.x += deltaTime * 0.01;
          }
          break;
        
        case 'shadow_bands':
          // Slow horizontal drift
          if (visual.object) {
            visual.object.children.forEach((band, i) => {
              band.position.x = Math.sin(Date.now() / 1000 + i) * 10;
            });
          }
          break;
        
        case 'memory_streaks':
          // Horizontal drift and wrap
          if (visual.object && visual.object.userData.velocity) {
            visual.object.position.add(visual.object.userData.velocity.clone().multiplyScalar(deltaTime));
            
            // Wrap around
            if (visual.object.position.x > 50) {
              visual.object.position.x = -50;
            }
          }
          break;
        
        case 'light_pillars':
          // Gentle pulse
          if (visual.object) {
            const pulseFactor = Math.sin(Date.now() / 1000) * 0.2 + 0.8;
            visual.object.children.forEach(pillar => {
              if (pillar.material && !this.blockBaseMaterialMutation(pillar.material, 'light_pillars.opacity')) {
                pillar.material.opacity = 0.3 * this.worldMood.intensity * pulseFactor;
              }
            });
          }
          break;
        
        case 'cluster_harmony':
          // Breathing pulse
          if (visual.object) {
            visual.pulsePhase = (visual.pulsePhase || 0) + deltaTime;
            const scale = 1 + Math.sin(visual.pulsePhase) * 0.1;
            visual.object.scale.setScalar(scale);
            
            const opacity = 0.1 + Math.sin(visual.pulsePhase) * 0.05;
            if (visual.object.material && !this.blockBaseMaterialMutation(visual.object.material, 'cluster_harmony.opacity')) {
              visual.object.material.opacity = opacity;
            }
          }
          break;
        
        case 'cluster_chaos':
          // Chaotic rotation
          if (visual.object) {
            visual.rotationPhase = (visual.rotationPhase || 0) + deltaTime * 2;
            visual.object.rotation.y = visual.rotationPhase;
          }
          break;
      }
    });
  }
  
  /**
   * HARMONIC_CALM - Warm sky, gentle light shafts
   */
  applyHarmonicCalm(intensity, t, deltaTime) {
    // Warm sky gradient
    if (this.scene.background && this.scene.background.isColor) {
      const targetColor = new THREE.Color(0x004466).lerp(new THREE.Color(0x006688), intensity);
      this.scene.background.lerp(targetColor, t * 0.05);
    }
    
    // Warm fog
    if (this.scene.fog) {
      const targetFogColor = new THREE.Color(0x0088aa);
      this.scene.fog.color.lerp(targetFogColor, t * 0.03);
    }
    
    // Create gentle light shafts (distant particles)
    if (!this.activeEventVisuals.has('harmonic_shafts') && t > 0.5) {
      this.createHarmonicLightShafts(intensity);
    }
  }
  
  createHarmonicLightShafts(intensity) {
    const particleCount = Math.floor(20 * intensity);
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 80 + Math.random() * 20;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 20 + Math.random() * 30;
      
      positions.push(x, y, z);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0x00ffaa,
      size: 0.5,
      transparent: true,
      opacity: 0.3 * intensity,
      blending: THREE.AdditiveBlending,
    });
    this.tagFXMaterial(material);
    
    const particles = new THREE.Points(geometry, material);
    particles.userData.isWorldFX = true;
    this.root.add(particles);
    
    this.activeEventVisuals.set('harmonic_shafts', {
      object: particles,
      startTime: Date.now(),
      type: 'harmonic_shafts',
    });
  }
  
  /**
   * FOCUSED_ANALYSIS - Crisp contrast, data particles
   */
  applyFocusedAnalysis(intensity, t, deltaTime) {
    // Slight blue shift
    if (this.scene.background && this.scene.background.isColor) {
      const targetColor = new THREE.Color(0x001133).lerp(new THREE.Color(0x002244), intensity);
      this.scene.background.lerp(targetColor, t * 0.05);
    }
    
    // Crisp fog
    if (this.scene.fog) {
      const targetFogColor = new THREE.Color(0x002255);
      this.scene.fog.color.lerp(targetFogColor, t * 0.03);
    }
    
    // Data particles
    if (!this.activeEventVisuals.has('data_particles') && t > 0.5) {
      this.createDataParticles(intensity);
    }
  }
  
  createDataParticles(intensity) {
    const particleCount = Math.floor(30 * intensity);
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    
    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 100;
      const y = Math.random() * 50 + 20;
      const z = (Math.random() - 0.5) * 100;
      
      positions.push(x, y, z);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.2,
      transparent: true,
      opacity: 0.4 * intensity,
      blending: THREE.AdditiveBlending,
    });
    this.tagFXMaterial(material);
    
    const particles = new THREE.Points(geometry, material);
    particles.userData.isWorldFX = true;
    particles.userData.velocity = new THREE.Vector3(0, -0.5, 0);
    this.root.add(particles);
    
    this.activeEventVisuals.set('data_particles', {
      object: particles,
      startTime: Date.now(),
      type: 'data_particles',
    });
  }
  
  /**
   * RADIANT_STORM - Pulsing arcs, energy surges
   */
  applyRadiantStorm(intensity, t, deltaTime) {
    // Warm, energetic sky
    if (this.scene.background && this.scene.background.isColor) {
      const targetColor = new THREE.Color(0x331100).lerp(new THREE.Color(0x442200), intensity);
      this.scene.background.lerp(targetColor, t * 0.05);
    }
    
    // Warm fog
    if (this.scene.fog) {
      const targetFogColor = new THREE.Color(0x442211);
      this.scene.fog.color.lerp(targetFogColor, t * 0.03);
    }
    
    // Pulsing distant arcs
    if (!this.activeEventVisuals.has('energy_arcs') && t > 0.5) {
      this.createEnergyArcs(intensity);
    }
  }
  
  createEnergyArcs(intensity) {
    const arcCount = Math.floor(6 * intensity);
    const group = new THREE.Group();
    
      for (let i = 0; i < arcCount; i++) {
      const angle = (i / arcCount) * Math.PI * 2;
      const radius = 90;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const geometry = new THREE.CylinderGeometry(0.1, 0.1, 15, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.4 * intensity,
        blending: THREE.AdditiveBlending,
      });
      this.tagFXMaterial(material);
      
      const arc = new THREE.Mesh(geometry, material);
      arc.position.set(x, 25, z);
      arc.lookAt(0, 25, 0);
      
      group.add(arc);
    }
    
    group.userData.isWorldFX = true;
    this.root.add(group);
    
    this.activeEventVisuals.set('energy_arcs', {
      object: group,
      startTime: Date.now(),
      type: 'energy_arcs',
      pulsePhase: 0,
    });
  }
  
  /**
   * QUANTUM_CHAOS - Nebula patterns, distortion waves
   */
  applyQuantumChaos(intensity, t, deltaTime) {
    // Dark, chaotic sky
    if (this.scene.background && this.scene.background.isColor) {
      const targetColor = new THREE.Color(0x110033).lerp(new THREE.Color(0x220044), intensity);
      this.scene.background.lerp(targetColor, t * 0.05);
    }
    
    // Chaotic fog
    if (this.scene.fog) {
      const targetFogColor = new THREE.Color(0x220055);
      this.scene.fog.color.lerp(targetFogColor, t * 0.03);
    }
    
    // Nebula particles
    if (!this.activeEventVisuals.has('chaos_nebula') && t > 0.5) {
      this.createChaosNebula(intensity);
    }
  }
  
  createChaosNebula(intensity) {
    const particleCount = Math.floor(40 * intensity);
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 60 + Math.random() * 40;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 15 + Math.random() * 40;
      
      positions.push(x, y, z);
      
      // Random colors (purple/pink/cyan)
      const colorChoice = Math.random();
      if (colorChoice < 0.33) {
        colors.push(1, 0, 1); // Magenta
      } else if (colorChoice < 0.66) {
        colors.push(0, 1, 1); // Cyan
      } else {
        colors.push(1, 0, 0.5); // Pink
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
      const material = new THREE.PointsMaterial({
        size: 1.5,
        transparent: true,
        opacity: 0.5 * intensity,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
      });
      this.tagFXMaterial(material);
    
    const particles = new THREE.Points(geometry, material);
    particles.userData.isWorldFX = true;
    this.root.add(particles);
    
    this.activeEventVisuals.set('chaos_nebula', {
      object: particles,
      startTime: Date.now(),
      type: 'chaos_nebula',
    });
  }
  
  /**
   * UMBRA_PRESSURE - Dark fog, shadow bands
   */
  applyUmbraPressure(intensity, t, deltaTime) {
    // Dark, oppressive sky
    if (this.scene.background && this.scene.background.isColor) {
      const targetColor = new THREE.Color(0x110011).lerp(new THREE.Color(0x220022), intensity);
      this.scene.background.lerp(targetColor, t * 0.05);
    }
    
    // Dense dark fog
    if (this.scene.fog) {
      const targetFogColor = new THREE.Color(0x330033);
      this.scene.fog.color.lerp(targetFogColor, t * 0.03);
    }
    
    // Shadow bands
    if (!this.activeEventVisuals.has('shadow_bands') && t > 0.5) {
      this.createShadowBands(intensity);
    }
  }
  
  createShadowBands(intensity) {
    const bandCount = Math.floor(4 * intensity);
    const group = new THREE.Group();
    
      for (let i = 0; i < bandCount; i++) {
      const geometry = new THREE.PlaneGeometry(150, 5);
      const material = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.3 * intensity,
        side: THREE.DoubleSide,
      });
      this.tagFXMaterial(material);
      
      const band = new THREE.Mesh(geometry, material);
      band.rotation.x = Math.PI / 2;
      band.position.y = 10 + i * 15;
      band.position.z = -60 + i * 20;
      
      group.add(band);
    }
    
    group.userData.isWorldFX = true;
    this.root.add(group);
    
    this.activeEventVisuals.set('shadow_bands', {
      object: group,
      startTime: Date.now(),
      type: 'shadow_bands',
    });
  }
  
  /**
   * ECHO_DRIFT - Horizontal streaks, memory winds
   */
  applyEchoDrift(intensity, t, deltaTime) {
    // Desaturated sky
    if (this.scene.background && this.scene.background.isColor) {
      const targetColor = new THREE.Color(0x223344).lerp(new THREE.Color(0x334455), intensity);
      this.scene.background.lerp(targetColor, t * 0.05);
    }
    
    // Soft fog
    if (this.scene.fog) {
      const targetFogColor = new THREE.Color(0x445566);
      this.scene.fog.color.lerp(targetFogColor, t * 0.03);
    }
    
    // Horizontal streaks
    if (!this.activeEventVisuals.has('memory_streaks') && t > 0.5) {
      this.createMemoryStreaks(intensity);
    }
  }
  
  createMemoryStreaks(intensity) {
    const streakCount = Math.floor(15 * intensity);
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    
    for (let i = 0; i < streakCount; i++) {
      const y = 15 + Math.random() * 30;
      const x = -50 + Math.random() * 100;
      const z = -50 + Math.random() * 100;
      
      positions.push(x, y, z);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0x8888aa,
      size: 2.0,
      transparent: true,
      opacity: 0.3 * intensity,
      blending: THREE.AdditiveBlending,
    });
    this.tagFXMaterial(material);
    
    const particles = new THREE.Points(geometry, material);
    particles.userData.isWorldFX = true;
    particles.userData.velocity = new THREE.Vector3(0.5, 0, 0);
    this.root.add(particles);
    
    this.activeEventVisuals.set('memory_streaks', {
      object: particles,
      startTime: Date.now(),
      type: 'memory_streaks',
    });
  }
  
  /**
   * ASCENDED_ALIGNMENT - Aurora, pillars of light
   */
  applyAscendedAlignment(intensity, t, deltaTime) {
    // Majestic sky
    if (this.scene.background && this.scene.background.isColor) {
      const targetColor = new THREE.Color(0x001144).lerp(new THREE.Color(0x002255), intensity);
      this.scene.background.lerp(targetColor, t * 0.05);
    }
    
    // Clear fog
    if (this.scene.fog) {
      const targetFogColor = new THREE.Color(0x003366);
      this.scene.fog.color.lerp(targetFogColor, t * 0.03);
    }
    
    // Pillars of light
    if (!this.activeEventVisuals.has('light_pillars') && t > 0.5) {
      this.createLightPillars(intensity);
    }
  }
  
  createLightPillars(intensity) {
    const pillarCount = Math.floor(5 * intensity);
    const group = new THREE.Group();
    
      for (let i = 0; i < pillarCount; i++) {
      const angle = (i / pillarCount) * Math.PI * 2;
      const radius = 100;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const geometry = new THREE.CylinderGeometry(0.5, 1.5, 50, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffaa,
        transparent: true,
        opacity: 0.3 * intensity,
        blending: THREE.AdditiveBlending,
      });
      this.tagFXMaterial(material);
      
      const pillar = new THREE.Mesh(geometry, material);
      pillar.position.set(x, 25, z);
      
      group.add(pillar);
    }
    
    group.userData.isWorldFX = true;
    this.root.add(group);
    
    this.activeEventVisuals.set('light_pillars', {
      object: group,
      startTime: Date.now(),
      type: 'light_pillars',
    });
  }
  
  /**
   * NEUTRAL - Restore base state
   */
  applyNeutralState(t) {
    // Restore base colors
    if (this.scene.background && this.baseWorldState.backgroundColor) {
      this.scene.background.lerp(this.baseWorldState.backgroundColor, t * 0.05);
    }
    
    if (this.scene.fog && this.baseWorldState.fogColor) {
      this.scene.fog.color.lerp(this.baseWorldState.fogColor, t * 0.05);
    }
    
    // Clean up all active visuals
    if (t > 0.9) {
      this.cleanupAllEventVisuals();
    }
  }
  
  /**
   * Detect personality clusters for localized effects
   */
  detectPersonalityClusters(nodes) {
    this.personalityClusters = [];
    
    // Simple clustering: find groups of same personality within radius
    const processedNodes = new Set();
    
    nodes.forEach(nodeA => {
      if (processedNodes.has(nodeA.uuid)) return;
      
      const personalityA = nodeA.userData?.personality?.type;
      if (!personalityA) return;
      
      const cluster = {
        personality: personalityA,
        nodes: [nodeA],
        center: nodeA.position.clone(),
      };
      
      // Find nearby nodes with same personality
      nodes.forEach(nodeB => {
        if (nodeA.uuid === nodeB.uuid) return;
        if (processedNodes.has(nodeB.uuid)) return;
        
        const personalityB = nodeB.userData?.personality?.type;
        if (personalityA !== personalityB) return;
        
        const distance = nodeA.position.distanceTo(nodeB.position);
        if (distance < 5.0) {
          cluster.nodes.push(nodeB);
          cluster.center.add(nodeB.position);
          processedNodes.add(nodeB.uuid);
        }
      });
      
      // Only create cluster if 3+ nodes
      if (cluster.nodes.length >= 3) {
        cluster.center.divideScalar(cluster.nodes.length);
        this.personalityClusters.push(cluster);
        cluster.nodes.forEach(n => processedNodes.add(n.uuid));
      }
    });
  }
  
  /**
   * Update localized cluster effects
   */
  updateClusterEffects(deltaTime) {
    // Clean up old cluster effects
    const toRemove = [];
    this.activeEventVisuals.forEach((visual, key) => {
      if (key.startsWith('cluster_')) {
        // Check if cluster still exists
        const clusterStillActive = this.personalityClusters.some(c => 
          c.center.distanceTo(visual.object.position) < 1.0
        );
        
        if (!clusterStillActive) {
          toRemove.push(key);
        }
      }
    });
    
    toRemove.forEach(key => {
      const visual = this.activeEventVisuals.get(key);
      this.cleanupVisual(visual);
      this.activeEventVisuals.delete(key);
    });
    
    // Create new cluster effects
    this.personalityClusters.forEach((cluster, index) => {
      const key = `cluster_${index}`;
      
      if (!this.activeEventVisuals.has(key)) {
        this.createClusterEffect(cluster, key);
      }
    });
  }
  
  /**
   * Create localized cluster effect
   */
  createClusterEffect(cluster, key) {
    const personality = cluster.personality;
    
    // Harmony/calm personalities get light bloom
    if (personality === 'HARMONY_KEEPER' || personality === 'CALM_ANALYST') {
      const geometry = new THREE.SphereGeometry(3, 16, 16);
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ffaa,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
      });
      this.tagFXMaterial(material);
      
      const bloom = new THREE.Mesh(geometry, material);
      tagAllowedSphere(bloom, { role: 'vfx', source: '_WorldPersonalityController.js' });
      clampSphere(bloom);
      bloom.position.copy(cluster.center);
      bloom.userData.isWorldFX = true;
      this.root.add(bloom);
      
      this.activeEventVisuals.set(key, {
        object: bloom,
        type: 'cluster_harmony',
        pulsePhase: 0,
      });
    }
    
    // Chaos personalities get shimmer
    if (personality === 'QUANTUM_TRICKSTER' || personality === 'FRACTAL_DREAMER') {
      const particleCount = 20;
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(angle * 3) * 0.5;
        
        positions.push(
          cluster.center.x + x,
          cluster.center.y + y,
          cluster.center.z + z
        );
      }
      
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      
      const material = new THREE.PointsMaterial({
        color: 0xff00ff,
        size: 0.3,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
      });
      this.tagFXMaterial(material);
      
      const shimmer = new THREE.Points(geometry, material);
      shimmer.userData.isWorldFX = true;
      this.root.add(shimmer);
      
      this.activeEventVisuals.set(key, {
        object: shimmer,
        type: 'cluster_chaos',
        rotationPhase: 0,
      });
    }
  }
  
  /**
   * Update HUD display
   */
  updateHUD(deltaTime) {
    const mood = this.worldMood.label;
    
    if (mood !== 'NEUTRAL') {
      // Show HUD
      if (!this.hudVisible) {
        this.hudVisible = true;
        this.hudFadeProgress = 0;
      }
      
      this.hudFadeProgress = Math.min(1.0, this.hudFadeProgress + deltaTime * 0.5);
      this.hudElement.style.opacity = this.hudFadeProgress;
      
      // Update text
      const moodDisplay = mood.replace(/_/g, ' ');
      const intensityBar = '▮'.repeat(Math.floor(this.worldMood.intensity * 5));
      
      this.hudElement.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 2px;">ATOMA MOOD</div>
        <div style="color: ${this.getMoodColor(mood)};">${moodDisplay}</div>
        <div style="font-size: 10px; margin-top: 2px;">${intensityBar}</div>
      `;
    } else {
      // Hide HUD
      if (this.hudVisible) {
        this.hudFadeProgress = Math.max(0, this.hudFadeProgress - deltaTime * 0.5);
        this.hudElement.style.opacity = this.hudFadeProgress;
        
        if (this.hudFadeProgress <= 0) {
          this.hudVisible = false;
        }
      }
    }
  }
  
  /**
   * Get color for mood display
   */
  getMoodColor(mood) {
    const colors = {
      'HARMONIC_CALM': '#00ffaa',
      'FOCUSED_ANALYSIS': '#00ffff',
      'RADIANT_STORM': '#ffaa00',
      'QUANTUM_CHAOS': '#ff00ff',
      'UMBRA_PRESSURE': '#8800ff',
      'ECHO_DRIFT': '#8888aa',
      'ASCENDED_ALIGNMENT': '#ffffaa',
    };
    
    return colors[mood] || '#00ffff';
  }
  
  /**
   * Cleanup visual effect
   */
  cleanupVisual(visual) {
    if (visual.object) {
      this.root.remove(visual.object);
      
      if (visual.object.geometry) {
        visual.object.geometry.dispose();
      }
      
      if (visual.object.material) {
        if (Array.isArray(visual.object.material)) {
          visual.object.material.forEach(m => m.dispose());
        } else {
          visual.object.material.dispose();
        }
      }
      
      // Recursively cleanup children
      if (visual.object.children) {
        visual.object.children.forEach(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    }
  }
  
  /**
   * Cleanup all event visuals
   */
  cleanupAllEventVisuals() {
    this.activeEventVisuals.forEach((visual, key) => {
      this.cleanupVisual(visual);
    });
    
    this.activeEventVisuals.clear();
  }
  
  /**
   * Destroy controller (cleanup)
   */
  destroy() {
    this.cleanupAllEventVisuals();
    
    // Remove HUD
    if (this.hudElement && this.hudElement.parentNode) {
      this.hudElement.parentNode.removeChild(this.hudElement);
    }
    
    // Restore base world state
    if (this.scene.fog && this.baseWorldState.fogColor) {
      this.scene.fog.color.copy(this.baseWorldState.fogColor);
    }
    
    if (this.scene.background && this.baseWorldState.backgroundColor) {
      this.scene.background.copy(this.baseWorldState.backgroundColor);
    }
  }
  
  /**
   * Get current mood state (for debugging/inspection)
   */
  getMoodState() {
    return {
      mood: this.worldMood,
      isTransitioning: this.isTransitioning,
      transitionProgress: this.transitionProgress,
      activeVisuals: Array.from(this.activeEventVisuals.keys()),
      clusterCount: this.personalityClusters.length,
    };
  }

  _resolveMetricBus() {
    if (globalThis?.ATOMA_BUS || globalThis?.semanticBus) {
      return globalThis.ATOMA_BUS || globalThis.semanticBus || null;
    }

    const browserWindow = typeof window !== 'undefined' ? window : null;
    return browserWindow?.ATOMA_BUS || browserWindow?.semanticBus || null;
  }

  _emitMoodBridge(moodSnapshot, moodChanged, previousMoodLabel) {
    const bus = this.semanticBus || this._resolveMetricBus();
    if (!bus?.emit) return;

    this.semanticBus = bus;

    const payload = {
      ...moodSnapshot,
      previousLabel: previousMoodLabel,
      moodChanged: !!moodChanged,
      source: 'WorldPersonalityController',
      timestamp: performance.now(),
    };

    const priority = bus.priority?.INTERACTIVE ?? bus.priority?.NORMAL;

    bus.emit('world.mood.snapshot', payload, { priority });
    if (moodChanged) {
      bus.emit('world.mood.changed', payload, { priority });
    }

    this._emitMoodMetricTags(bus, payload);
  }

  _emitMoodMetricTags(bus, moodSnapshot) {
    if (!bus?.emit) return;

    const priority = bus.priority?.INTERACTIVE ?? bus.priority?.NORMAL;
    const emit = (eventName, value = 1) => {
      bus.emit(eventName, {
        ...moodSnapshot,
        value,
        source: 'WorldPersonalityController',
      }, { priority });
    };

    switch (moodSnapshot.label) {
      case 'HARMONIC_CALM':
        emit('global.harmony.high');
        emit('global.stability.high');
        break;
      case 'FOCUSED_ANALYSIS':
        emit('global.stability.high');
        break;
      case 'RADIANT_STORM':
        emit('global.loadPressure.high');
        break;
      case 'QUANTUM_CHAOS':
        emit('global.stability.low');
        break;
      case 'UMBRA_PRESSURE':
        emit('global.harmony.low');
        emit('global.loadPressure.mid');
        break;
      case 'ECHO_DRIFT':
        emit('global.harmony.mid');
        break;
      case 'ASCENDED_ALIGNMENT':
        emit('global.synergy.high');
        emit('global.harmony.high');
        emit('global.stability.high');
        break;
      default:
        break;
    }
  }
}


