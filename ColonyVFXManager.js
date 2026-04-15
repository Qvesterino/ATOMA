import * as THREE from 'three';

/**
 * ColonyVFXManager.js - Safe Living Civilization Visual Effects System
 * 
 * SAFE: 100% non-destructive VFX overlays
 * - Creates growth shells, signal orbitals, conscious cores, and status crowns
 * - All meshes stored in scene but completely separate from nodes
 * - Can be removed without affecting core systems
 */

export class ColonyVFXManager {
  constructor(scene, environmentRoot) {
    this.scene = scene;
    this.root = environmentRoot || scene;
    
    // Container for all civilization VFX (for easy cleanup)
    this.vfxContainer = new THREE.Group();
    this.vfxContainer.name = 'living-civilization-vfx-container';
    this.root.add(this.vfxContainer);
    
    // Texture for particles
    this.particleTexture = this.createParticleTexture();
    
    // Configuration
    this.config = {
      colors: {
        HARMONY: 0x00d4ff,      // Bright cyan
        STABILITY: 0x89b8ff,    // Soft sky blue
        CORRUPTION: 0xd961ff,   // Deep magenta
        SYNERGY: 0xffd860,      // Warm gold
        LOAD_PRESSURE: 0xff7a88,// Tense coral

        DEFAULT: 0x00d4ff,
        QUANTUM: 0x00ff88,
        SIGMA: 0xff00ff,
        LEGENDARY: 0xffff00
      },
      
      atmosphere: {
        radiusScale: 0.8,
        opacity: 0.6,
        segments: 32
      },
      
      rings: {
        radiusStep: 0.5,
        maxRings: 6,
        opacity: 0.4
      },
      
      moodProfiles: {
        HARMONY: {
          colorBias: 0x9ff7ff,
          motionBias: 0.22,
          particleDensity: 0.95,
          ringThickness: 0.7,
          atmosphereOpacity: 0.12,
          corePulse: 0.85,
          glowIntensity: 0.88
        },
        STABILITY: {
          colorBias: 0xdde8ff,
          motionBias: 0.18,
          particleDensity: 0.8,
          ringThickness: 1.0,
          atmosphereOpacity: 0.08,
          corePulse: 0.75,
          glowIntensity: 0.82
        },
        CORRUPTION: {
          colorBias: 0xdd55ff,
          motionBias: 1.1,
          particleDensity: 0.55,
          ringThickness: 0.6,
          atmosphereOpacity: 0.05,
          corePulse: 1.3,
          glowIntensity: 1.2
        },
        SYNERGY: {
          colorBias: 0xffe4a0,
          motionBias: 1.3,
          particleDensity: 1.4,
          ringThickness: 1.3,
          atmosphereOpacity: 0.15,
          corePulse: 1.4,
          glowIntensity: 1.1
        },
        LOAD_PRESSURE: {
          colorBias: 0xff7a88,
          motionBias: 0.6,
          particleDensity: 1.05,
          ringThickness: 1.45,
          atmosphereOpacity: 0.14,
          corePulse: 1.0,
          glowIntensity: 0.95
        }
      },
      moodVisualBiasMap: null,
      
      particles: {
        count: 50,
        maxPerColony: 100,
        speed: 1.0,
        lifetime: 3.0
      },
      
      pulse: {
        minFrequency: 1.0,
        maxFrequency: 4.0,
        minIntensity: 0.5,
        maxIntensity: 2.0
      }
    };

    this.config.moodVisualBiasMap = this.config.moodProfiles;

    this.objectPools = {
      atmosphere: [],
      'orbit-ring': [],
      particle: [],
      core: [],
      'central-glow': [],
      'legendary-crown': [],
      'sigil-ring': [],
      'ascension-beam': [],
      'mood-canopy': [],
      'legendary-halo': [],
      'legendary-presence': [],
      'colony-label': []
    };

    this.transitioningVFX = new Set();
  }
  
  /**
   * Create particle texture
   */
  createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(255,255,255,0)';
    ctx.fillRect(0, 0, 64, 64);
    
    // Draw soft circle
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.beginPath();
    ctx.arc(32, 32, 24, 0, Math.PI * 2);
    ctx.fill();
    
    // Blur effect
    ctx.filter = 'blur(8px)';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(32, 32, 20, 0, Math.PI * 2);
    ctx.fill();
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  getColonyVisualSeeds(colonyId) {
    const idValue = Number(String(colonyId).replace(/[^0-9]/g, '')) || 0;
    const seed = ((idValue * 0.61803398875) % 1 + 1) % 1;
    return {
      phaseSeed: seed,
      pulseOffset: ((seed + 0.27) % 1),
      ringSpeedBias: 0.08 + ((idValue % 5) * 0.04),
      particleBias: 0.82 + ((idValue % 4) * 0.05),
      haloPressure: 0.05 + ((idValue % 4) * 0.02)
    };
  }

  createBasicMaterial(color, opacity = 1.0, side) {
    const config = {
      color,
      transparent: true,
      opacity,
      fog: false
    };
    if (side !== undefined) {
      config.side = side;
    }
    return new THREE.MeshBasicMaterial(config);
  }

  getMoodCanopySpec(mood, colonyType, stage, energy = 0) {
    const effectiveMood = mood === 'CALM' ? 'HARMONY' : mood;
    const energyFactor = Math.min(1, energy / 100);
    const specs = {
      HARMONY: {
        panelCount: 5,
        radiusMul: 1.12,
        height: 0.42,
        sway: 0.22,
        spin: 0.1,
        panelScale: 1.0,
        opacity: 0.22,
        shape: 'lotus'
      },
      STABILITY: {
        panelCount: 4,
        radiusMul: 1.02,
        height: 0.5,
        sway: 0.12,
        spin: 0.06,
        panelScale: 0.92,
        opacity: 0.18,
        shape: 'buttress'
      },
      CORRUPTION: {
        panelCount: 6,
        radiusMul: 0.94,
        height: 0.38,
        sway: 0.38,
        spin: 0.2,
        panelScale: 0.86,
        opacity: 0.2,
        shape: 'thorn'
      },
      SYNERGY: {
        panelCount: 7,
        radiusMul: 1.18,
        height: 0.46,
        sway: 0.3,
        spin: 0.16,
        panelScale: 1.08,
        opacity: 0.24,
        shape: 'braid'
      },
      LOAD_PRESSURE: {
        panelCount: 5,
        radiusMul: 0.98,
        height: 0.32,
        sway: 0.26,
        spin: 0.14,
        panelScale: 0.9,
        opacity: 0.2,
        shape: 'shroud'
      }
    };

    const baseSpec = specs[effectiveMood] || specs.HARMONY;
    const spec = {
      ...baseSpec,
      panelCount: Math.min(8, baseSpec.panelCount + Math.floor(Math.max(0, stage - 2) * 0.5) + (colonyType === 'LEGENDARY' ? 1 : 0)),
      radiusMul: baseSpec.radiusMul + energyFactor * 0.08 + (colonyType === 'LEGENDARY' ? 0.08 : 0),
      height: baseSpec.height + energyFactor * 0.08,
      opacity: Math.min(0.32, baseSpec.opacity + energyFactor * 0.05),
      panelScale: baseSpec.panelScale + energyFactor * 0.08
    };

    if (colonyType === 'QUANTUM') {
      spec.shape = 'braid';
      spec.spin += 0.08;
      spec.sway += 0.06;
    } else if (colonyType === 'SIGMA') {
      spec.shape = 'thorn';
      spec.sway += 0.08;
      spec.opacity += 0.03;
    }

    return spec;
  }

  acquireVFXObject(type) {
    const pool = this.objectPools[type];
    if (pool && pool.length > 0) {
      const object = pool.pop();
      object.visible = true;
      return object;
    }
    return null;
  }

  releaseVFXObject(object) {
    if (!object || !object.userData) return;
    const type = object.userData.type;
    const pool = this.objectPools[type];

    this.resetVFXObject(object);
    if (object.parent) {
      object.parent.remove(object);
    }

    if (pool) {
      object.visible = false;
      pool.push(object);
      return;
    }

    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(m => m.dispose());
      } else {
        object.material.dispose();
      }
    }
  }

  resetVFXObject(object) {
    if (!object || !object.userData) return;
    delete object.userData.eventPulse;
    delete object.userData.eventColorShift;
    delete object.userData.eventGlow;
    delete object.userData.eventCrown;
    delete object.userData.eventDeform;
    delete object.userData.transition;
    delete object.userData.fadeOut;

    if (object.material && object.material.opacity !== undefined) {
      object.material.opacity = Math.max(0, object.material.opacity);
    }

    if (object.scale) {
      object.scale.set(1, 1, 1);
    }
  }

  /**
   * Create atmosphere layer for a living civilization
   */
  createAtmosphere(colonyId, center, stage, mood, colonyType, energy) {
    const moodProfile = this.getMoodProfile(mood);
    const seeds = this.getColonyVisualSeeds(colonyId);
    const baseColor = this.getColorForMood(mood, colonyType);
    const color = this.blendColor(baseColor, moodProfile.colorBias, 0.45);
    const energyFactor = Math.min(1, energy / 100);
    const radius = this.getRadiusForStage(stage) + energyFactor * 0.35 + (moodProfile.ringThickness || 0) * 0.04;
    const opacity = Math.min(1, this.config.atmosphere.opacity + energyFactor * 0.18 + (moodProfile.atmosphereOpacity || 0) + seeds.haloPressure);
    const motionBias = moodProfile.motionBias;
    const pulseAmplitude = 0.18 + energyFactor * 0.18 + motionBias * 0.28 + seeds.pulseOffset * 0.08;
    const haloBoost = colonyType === 'LEGENDARY' ? 0.3 : 0;

    let atmosphere = this.acquireVFXObject('atmosphere');
    const geometry = new THREE.TorusGeometry(
      radius,
      0.18 + stage * 0.02 + haloBoost * 0.04,
      16,
      32
    );
    const materialConfig = {
      color: color,
      transparent: true,
      opacity: Math.min(1, opacity + haloBoost * 0.15),
      fog: false
    };

    if (atmosphere) {
      if (atmosphere.geometry) atmosphere.geometry.dispose();
      atmosphere.geometry = geometry;
      atmosphere.material.color.setHex(color);
      atmosphere.material.opacity = materialConfig.opacity;
      atmosphere.material.transparent = true;
    } else {
      atmosphere = new THREE.Mesh(geometry, this.createBasicMaterial(color, materialConfig.opacity));
    }

    atmosphere.position.copy(center);
    atmosphere.rotation.x = Math.random() * 0.2;
    atmosphere.scale.z = 0.28;

    atmosphere.userData = {
      colonyId: colonyId,
      type: 'atmosphere',
      baseMood: mood,
      baseColor: color,
      pulseAmplitude: pulseAmplitude,
      energyFactor: energyFactor,
      motionBias: motionBias,
      legendaryHalo: colonyType === 'LEGENDARY'
    };

    this.vfxContainer.add(atmosphere);
    return atmosphere;
  }

  /**
   * Create signal orbitals around the civilization center
   */
  createOrbitRings(colonyId, center, stage, mood, colonyType, energy) {
    const rings = [];
    const profile = this.getMoodProfile(mood);
    const effectiveStage = Math.max(1, stage);
    const baseColor = this.getColorForMood(mood, colonyType);
    const color = this.blendColor(baseColor, profile.colorBias, 0.3);
    const energyFactor = Math.min(1, energy / 100);
    const stageRingCounts = [0, 1, 2, 4, this.config.rings.maxRings];
    const baseRingCount = stageRingCounts[Math.min(Math.max(stage, 0), 4)] || 1;
    const ringCount = Math.min(this.config.rings.maxRings, baseRingCount + Math.floor(energyFactor * 1.2));
    const ringTube = 0.08 + profile.ringThickness * 0.05;
    const seeds = this.getColonyVisualSeeds(colonyId);
    
    for (let i = 0; i < ringCount; i++) {
      const radius = (i + 1) * this.config.rings.radiusStep * (1 + effectiveStage * 0.1);
      const ringAlpha = this.config.rings.opacity * (1 - i / Math.max(1, ringCount));
      
      const geometry = new THREE.TorusGeometry(radius, ringTube + energyFactor * 0.02, 16, 64);
    const material = this.createBasicMaterial(color, Math.min(1, ringAlpha + profile.motionBias * 0.06));
      let ring = this.acquireVFXObject('orbit-ring');
      if (ring) {
        if (ring.geometry) ring.geometry.dispose();
        ring.geometry = geometry;
        ring.material.color.setHex(color);
        ring.material.opacity = this.config.rings.opacity * (1 - i / Math.max(1, ringCount));
      } else {
        ring = new THREE.Mesh(geometry, material);
      }

      ring.position.copy(center);
      ring.rotation.x = (Math.PI / 2) * (i % 2);
      ring.rotation.z = (Math.PI / 4) * i;
      ring.visible = true;
      
      ring.userData = {
        colonyId: colonyId,
        type: 'orbit-ring',
        stage: stage,
        ringIndex: i,
        maxRings: ringCount,
        direction: i % 2 === 0 ? 1 : -1,
        rotationSpeed: 0.12 + stage * 0.08 + seeds.ringSpeedBias + profile.motionBias * 0.15,
        motionBias: profile.motionBias,
        seed: seeds.phaseSeed
      };
      
      this.vfxContainer.add(ring);
      rings.push(ring);
    }
    
    return rings;
  }

  createMoodCanopy(colonyId, center, stage, mood, colonyType, energy) {
    const profile = this.getMoodProfile(mood);
    const seeds = this.getColonyVisualSeeds(colonyId);
    const baseColor = this.getColorForMood(mood, colonyType);
    const color = this.blendColor(baseColor, profile.colorBias, 0.38);
    const spec = this.getMoodCanopySpec(mood, colonyType, stage, energy);
    const radius = this.getRadiusForStage(stage) * spec.radiusMul;
    const tiltBase = 0.28 + profile.motionBias * 0.08;

    let canopy = this.acquireVFXObject('mood-canopy');
    if (!canopy) {
      canopy = new THREE.Group();
      canopy.name = `colony-mood-canopy-${colonyId}`;
    } else {
      canopy.visible = true;
    }

    const desiredPanels = spec.panelCount;
    while (canopy.children.length < desiredPanels) {
      const panelGeometry = new THREE.PlaneGeometry(0.62, 1.24, 1, 1);
      const panelMaterial = this.createBasicMaterial(color, spec.opacity, THREE.DoubleSide);
      panelMaterial.blending = THREE.AdditiveBlending;
      panelMaterial.depthWrite = false;
      const panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.userData.type = 'mood-canopy-panel';
      canopy.add(panel);
    }

    while (canopy.children.length > desiredPanels) {
      const panel = canopy.children[canopy.children.length - 1];
      if (!panel) break;
      canopy.remove(panel);
      if (panel.geometry) panel.geometry.dispose();
      if (panel.material) panel.material.dispose();
    }

    canopy.children.forEach((panel, index) => {
      const angle = (index / desiredPanels) * Math.PI * 2;
      const lift = spec.height + (index % 2 === 0 ? 0.06 : -0.02);
      const localRadius = radius * (0.72 + (index % 3) * 0.08);

      panel.material.color.setHex(color);
      panel.material.opacity = spec.opacity;
      panel.scale.set(
        0.72 * spec.panelScale * (spec.shape === 'buttress' ? 0.82 : 1),
        1.18 * spec.panelScale * (spec.shape === 'thorn' ? 0.9 : 1),
        1
      );

      panel.position.set(
        Math.cos(angle) * localRadius,
        lift,
        Math.sin(angle) * localRadius
      );
      panel.rotation.set(-Math.PI / 2 + tiltBase, angle, 0);

      if (spec.shape === 'lotus') {
        panel.rotation.z = Math.sin(angle) * 0.22;
      } else if (spec.shape === 'buttress') {
        panel.rotation.x = -Math.PI / 2 + 0.62;
        panel.rotation.z = Math.cos(angle) * 0.08;
      } else if (spec.shape === 'thorn') {
        panel.rotation.x = -Math.PI / 2 + 0.34;
        panel.rotation.z = (index % 2 === 0 ? 1 : -1) * 0.24;
      } else if (spec.shape === 'braid') {
        panel.rotation.x = -Math.PI / 2 + 0.48;
        panel.rotation.z = Math.sin(angle * 2) * 0.18;
      } else if (spec.shape === 'shroud') {
        panel.rotation.x = -Math.PI / 2 + 0.4;
        panel.rotation.z = Math.cos(angle * 1.5) * 0.16;
      }

      panel.userData.panelIndex = index;
      panel.userData.baseAngle = angle;
      panel.userData.baseLift = lift;
      panel.userData.baseRadius = localRadius;
      panel.userData.shape = spec.shape;
    });

    canopy.position.copy(center);
    canopy.visible = true;
    canopy.userData = {
      colonyId,
      type: 'mood-canopy',
      mood,
      shape: spec.shape,
      sway: spec.sway,
      spin: spec.spin + seeds.ringSpeedBias * 0.35,
      radius,
      color,
      energyFactor: Math.min(1, energy / 100),
      motionBias: profile.motionBias,
      pulsePhase: seeds.phaseSeed * Math.PI * 2
    };

    this.vfxContainer.add(canopy);
    return canopy;
  }

  createQuantumEdge(colonyId, center, stage, mood, colonyType, energy) {
    const baseColor = this.getColorForMood(mood, colonyType);
    const color = this.blendColor(baseColor, 0xD07BFF, 0.45);
    const radius = this.getRadiusForStage(stage) * 1.35;
    const geometry = new THREE.TorusGeometry(radius, 0.06, 16, 64);
    const material = this.createBasicMaterial(color, 0.22);
    let edge = this.acquireVFXObject('orbit-ring');
    if (edge) {
      if (edge.geometry) edge.geometry.dispose();
      edge.geometry = geometry;
      edge.material.color.setHex(color);
      edge.material.opacity = 0.22;
    } else {
      edge = new THREE.Mesh(geometry, material);
    }

    edge.position.copy(center);
    edge.rotation.x = Math.PI / 2;
    edge.visible = true;
    edge.userData = {
      colonyId,
      type: 'orbit-ring',
      ringIndex: 0,
      maxRings: 1,
      rotationSpeed: 1.0 + stage * 0.1
    };
    this.vfxContainer.add(edge);
    return edge;
  }

  createSigmaCrackAccent(colonyId, center, stage, mood, colonyType, energy) {
    const baseColor = this.getColorForMood(mood, colonyType);
    const color = this.blendColor(baseColor, 0xFF73CF, 0.55);
    const radius = this.getRadiusForStage(stage) * 1.2;
    const geometry = new THREE.TorusGeometry(radius, 0.09, 12, 64);
    const material = this.createBasicMaterial(color, 0.28);
    let accent = this.acquireVFXObject('orbit-ring');
    if (accent) {
      if (accent.geometry) accent.geometry.dispose();
      accent.geometry = geometry;
      accent.material.color.setHex(color);
      accent.material.opacity = 0.28;
    } else {
      accent = new THREE.Mesh(geometry, material);
    }

    accent.position.copy(center);
    accent.rotation.x = Math.PI / 2;
    accent.visible = true;
    accent.userData = {
      colonyId,
      type: 'orbit-ring',
      ringIndex: 0,
      maxRings: 1,
      rotationSpeed: 1.4 + stage * 0.14
    };
    this.vfxContainer.add(accent);
    return accent;
  }
  
  /**
   * Create floating particles around civilization
   */
  createParticles(colonyId, center, stage, mood, colonyType, energy) {
    const particles = [];
    const seeds = this.getColonyVisualSeeds(colonyId);
    const profile = this.getMoodProfile(mood);
    const effectiveStage = Math.max(1, stage);
    const baseColor = this.getColorForMood(mood, colonyType);
    const color = this.blendColor(baseColor, profile.colorBias, 0.35);
    const energyFactor = Math.min(1, energy / 100);
    const count = Math.ceil(
      this.config.particles.count * (effectiveStage / 4) *
      profile.particleDensity *
      seeds.particleBias *
      (1 + energyFactor * 0.4) *
      (this.config.particles.maxPerColony / 100)
    );
    
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(3);
      
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * (3 + energyFactor * 2) + 1;
      positions[0] = center.x + Math.cos(angle) * distance;
      positions[1] = center.y + Math.random() * 2;
      positions[2] = center.z + Math.sin(angle) * distance;
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const material = new THREE.PointsMaterial({
        size: 0.18 + Math.random() * 0.1 + energyFactor * 0.05,
        sizeAttenuation: true,
        map: this.particleTexture,
        color: color,
        transparent: true,
        opacity: 0.55 + energyFactor * 0.2,
        fog: false
      });
      
      let particle = this.acquireVFXObject('particle');
      if (particle) {
        if (particle.geometry) particle.geometry.dispose();
        particle.geometry = geometry;
        particle.material.color.setHex(color);
        particle.material.opacity = 0.55 + energyFactor * 0.2;
        particle.material.size = 0.18 + Math.random() * 0.1 + energyFactor * 0.05;
      } else {
        particle = new THREE.Points(geometry, material);
      }

      const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * (0.28 + energyFactor * 0.28 + profile.motionBias * 0.22),
          Math.random() * (0.18 + energyFactor * 0.18 + profile.motionBias * 0.12),
          (Math.random() - 0.5) * (0.28 + energyFactor * 0.28 + profile.motionBias * 0.22)
        );
      particle.userData = {
        colonyId: colonyId,
        type: 'particle',
        startPos: new THREE.Vector3().copy(center),
        velocity: velocity.clone(),
        baseVelocity: velocity,
        lifetime: this.config.particles.lifetime,
        elapsed: 0,
        maxLifetime: this.config.particles.lifetime,
        motionBias: profile.motionBias,
        particleBias: seeds.particleBias,
        orbitPhase: Math.random() * Math.PI * 2,
        orbitRadius: 0.9 + stage * 0.35 + Math.random() * 0.6,
        orbitSpeed: 0.4 + profile.motionBias * 0.14 + seeds.phaseSeed * 0.2
      };
      particle.visible = true;
      this.vfxContainer.add(particle);
      particles.push(particle);
    }
    
    return particles;
  }

  /**
   * Create the conscious core of a living civilization
   */
  createConsciousCore(colonyId, center, stage, mood, colonyType, energy) {
    const profile = this.getMoodProfile(mood);
    const color = this.getColorForMood(mood, colonyType);
    const energyFactor = Math.min(1, energy / 100);
    const size = 0.3 + stage * 0.12 + energyFactor * 0.4;
    const motionBias = profile.motionBias;
    
    const geometry = new THREE.IcosahedronGeometry(size, 2);
    const material = this.createBasicMaterial(color, 0.35 + energyFactor * 0.25);
    
    let core = this.acquireVFXObject('core');
    if (core) {
      if (core.geometry) core.geometry.dispose();
      core.geometry = geometry;
      core.material.color.setHex(color);
      core.material.opacity = 0.35 + energyFactor * 0.25;
    } else {
      core = new THREE.Mesh(geometry, material);
    }

    core.position.copy(center);
    core.visible = true;
    core.userData = {
      colonyId: colonyId,
      type: 'core',
      stage: stage,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 1.2 + Math.max(0, stage - 1) * 0.22 + energyFactor * 0.5 + motionBias * 0.2,
      energyFactor: energyFactor,
      motionBias: motionBias
    };
    
    this.vfxContainer.add(core);
    return core;
  }
  
  /**
   * Create central glow (for higher stages)
   */
  createCentralGlow(colonyId, center, stage, mood, colonyType) {
    if (stage < 2) return null;
    
    const seeds = this.getColonyVisualSeeds(colonyId);
    const profile = this.getMoodProfile(mood);
    const color = this.getColorForMood(mood, colonyType);
    
    // Sphere glow at center
    const geometry = new THREE.SphereGeometry(0.34 + stage * 0.12, 16, 16);
    const material = this.createBasicMaterial(color, Math.min(1, 0.28 + (profile.glowIntensity || 0) * 0.08 + seeds.particleBias * 0.03));
    
    let glow = this.acquireVFXObject('central-glow');
    if (glow) {
      if (glow.geometry) glow.geometry.dispose();
      glow.geometry = geometry;
      glow.material.color.setHex(color);
      glow.material.opacity = material.opacity;
    } else {
      glow = new THREE.Mesh(geometry, material);
    }

    glow.position.copy(center);
    glow.visible = true;
    glow.userData = {
      colonyId: colonyId,
      type: 'central-glow',
      pulsePhase: seeds.phaseSeed * Math.PI * 2,
      pulseSpeed: 2.0 + (profile.motionBias || 0) * 0.12 + seeds.pulseOffset * 0.15,
      motionBias: profile.motionBias
    };
    
    this.vfxContainer.add(glow);
    return glow;
  }
  
  /**
   * Create status crown for legendary civilizations
   */
  createLegendaryCrown(colonyId, center, stage, colonyType) {
    if (colonyType !== 'LEGENDARY') return null;
    
    const color = this.config.colors.LEGENDARY;
    
    // Crown made of small pyramids
    let crown = this.acquireVFXObject('legendary-crown');
    if (!crown) {
      crown = new THREE.Group();
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const radius = 0.6;
        const geometry = new THREE.ConeGeometry(0.2, 0.4, 8);
        const material = this.createBasicMaterial(color, 0.7);
        const spike = new THREE.Mesh(geometry, material);
        spike.position.x = Math.cos(angle) * radius;
        spike.position.z = Math.sin(angle) * radius;
        spike.rotation.z = angle;
        crown.add(spike);
      }
    } else {
      crown.children.forEach(spike => {
        if (spike.material) {
          spike.material.color.setHex(color);
          spike.material.opacity = 0.7;
        }
      });
      crown.visible = true;
    }

    crown.position.copy(center);
    crown.position.y += 0.8;
    crown.userData = {
      colonyId: colonyId,
      type: 'legendary-crown',
      rotationSpeed: 0.3
    };
    
    this.vfxContainer.add(crown);
    return crown;
  }

  /**
   * Create legendary halo for a legendary civilization
   */
  createLegendaryHalo(colonyId, center, stage, energy) {
    const color = this.config.colors.LEGENDARY;
    const radius = this.getRadiusForStage(stage) * 1.6 + 0.6;
    const geometry = new THREE.RingGeometry(radius, radius + 0.12, 48, 1);
    const material = this.createBasicMaterial(color, 0.24, THREE.DoubleSide);

    let halo = this.acquireVFXObject('legendary-halo');
    if (halo) {
      if (halo.geometry) halo.geometry.dispose();
      halo.geometry = geometry;
      halo.material.color.setHex(color);
      halo.material.opacity = 0.24;
    } else {
      halo = new THREE.Mesh(geometry, material);
    }

    halo.position.copy(center);
    halo.rotation.x = Math.PI / 2;
    halo.userData = {
      colonyId: colonyId,
      type: 'legendary-halo',
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.5 + stage * 0.08
    };

    this.vfxContainer.add(halo);
    return halo;
  }

  createLegendaryPresence(colonyId, center, stage) {
    let presence = this.acquireVFXObject('legendary-presence');
    if (!presence) {
      presence = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const orb = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 8, 8),
          this.createBasicMaterial(this.config.colors.LEGENDARY, 0.6)
        );
        orb.position.set(Math.cos(i * Math.PI * 2 / 3) * 1.2, 0.2, Math.sin(i * Math.PI * 2 / 3) * 1.2);
        presence.add(orb);
      }
    } else {
      presence.children.forEach(orb => {
        if (orb.material) {
          orb.material.color.setHex(this.config.colors.LEGENDARY);
          orb.material.opacity = 0.6;
        }
      });
      presence.visible = true;
    }

    presence.position.copy(center);
    presence.userData = {
      colonyId: colonyId,
      type: 'legendary-presence',
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.3 + stage * 0.05
    };

    this.vfxContainer.add(presence);
    return presence;
  }

  createDebugLabel(colonyId, center, lines, color = 0xffffff) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(8, 12, 20, 0.88)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 18px Courier New';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const margin = 12;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], margin, margin + i * 22);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    let label = this.acquireVFXObject('colony-label');
    if (label) {
      if (label.material.map) label.material.map.dispose();
      label.material.map = texture;
      label.material.color.setHex(color);
      label.visible = true;
    } else {
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.95,
        depthTest: false
      });
      label = new THREE.Sprite(material);
      label.scale.set(3.2, 1.5, 1);
    }

    label.position.copy(center);
    label.position.y += 1.4;
    label.userData = {
      colonyId,
      type: 'colony-label',
      canvas,
      ctx,
      color,
      lines
    };
    this.vfxContainer.add(label);
    return label;
  }

  updateDebugLabel(label, lines, color = 0xffffff) {
    if (!label || !label.userData || !label.userData.ctx) return;
    const ctx = label.userData.ctx;
    const canvas = label.userData.canvas;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(8, 12, 20, 0.88)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 18px Courier New';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const margin = 12;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], margin, margin + i * 22);
    }

    if (label.material.map) {
      label.material.map.needsUpdate = true;
    }
    label.material.color.setHex(color);
    label.userData.lines = lines;
  }

  /**
   * Create sigil ring for convergence / ascension
   */
  createSigilRing(colonyId, center, stage, mood, colonyType, energy) {
    const color = this.getColorForMood(mood, colonyType);
    const radius = this.getRadiusForStage(stage) * 1.3;
    const geometry = new THREE.RingGeometry(radius * 0.8, radius, 48, 1);
    const material = this.createBasicMaterial(color, 0.35, THREE.DoubleSide);
    let sigil = this.acquireVFXObject('sigil-ring');
    if (sigil) {
      if (sigil.geometry) sigil.geometry.dispose();
      sigil.geometry = geometry;
      sigil.material.color.setHex(color);
      sigil.material.opacity = 0.35;
    } else {
      sigil = new THREE.Mesh(geometry, material);
    }

    sigil.position.copy(center);
    sigil.rotation.x = Math.PI / 2;
    sigil.visible = true;
    sigil.userData = {
      colonyId: colonyId,
      type: 'sigil-ring',
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 1.2 + stage * 0.15
    };
    this.vfxContainer.add(sigil);
    return sigil;
  }

  /**
   * Create ascension beam for advanced civilizations
   */
  createAscensionBeam(colonyId, center, stage, mood, colonyType, energy) {
    const color = this.getColorForMood(mood, colonyType);
    const height = 2.0 + stage * 0.4;
    const geometry = new THREE.CylinderGeometry(0.05, 0.1, height, 10, 1, true);
    const material = this.createBasicMaterial(color, 0.22, THREE.DoubleSide);
    let beam = this.acquireVFXObject('ascension-beam');
    if (beam) {
      if (beam.geometry) beam.geometry.dispose();
      beam.geometry = geometry;
      beam.material.color.setHex(color);
      beam.material.opacity = 0.22;
    } else {
      beam = new THREE.Mesh(geometry, material);
    }

    beam.position.copy(center);
    beam.position.y += height * 0.5 + 0.1;
    beam.visible = true;
    beam.userData = {
      colonyId: colonyId,
      type: 'ascension-beam',
      pulsePhase: 0,
      pulseSpeed: 1.0 + stage * 0.1,
      energyFactor: Math.min(1, energy / 100)
    };
    this.vfxContainer.add(beam);
    return beam;
  }
  updateParticles(deltaTime) {
    const time = performance.now() * 0.001;
    for (const child of this.vfxContainer.children) {
      if (child.userData && child.userData.type === 'particle') {
        const userData = child.userData;
      const pos = child.geometry.attributes.position.array;
      userData.orbitPhase += deltaTime * userData.orbitSpeed;
      const orbitRadius = userData.orbitRadius + Math.sin(time * 0.8 + userData.seed * 2.1) * 0.08;
      const orbitX = Math.cos(userData.orbitPhase) * orbitRadius;
      const orbitZ = Math.sin(userData.orbitPhase) * orbitRadius;
      const jitterY = Math.sin(time * 1.4 + userData.orbitPhase) * 0.08;

      pos[0] = userData.startPos.x + orbitX + Math.sin(time * 1.7 + userData.seed * 3.3) * 0.02;
      pos[1] = userData.startPos.y + jitterY + Math.sin(time * 0.9 + userData.orbitPhase) * 0.03;
      pos[2] = userData.startPos.z + orbitZ + Math.cos(time * 1.5 + userData.seed * 2.7) * 0.02;
      child.geometry.attributes.position.needsUpdate = true;
      
      userData.elapsed += deltaTime;
      const progress = userData.elapsed / userData.lifetime;
      child.material.opacity = Math.max(0, 0.6 * (1 - progress));
      }
    }
  }
  
  /**
   * Update atmosphere animations (pulse, rotation)
   */
  updateAtmospheres(deltaTime) {
    const time = performance.now() * 0.001;
    
    for (const child of this.vfxContainer.children) {
      if (child.userData && child.userData.type === 'atmosphere') {
        const userData = child.userData;
        const breath = 1 + Math.sin(time * 1.0 + (userData.pulseAmplitude ?? 0) * 1.2 + (userData.baseColor ?? 0) * 0) * 0.06;
        child.scale.setScalar(breath + userData.energyFactor * 0.08);
        
        const motionRate = 0.14 + (userData.motionBias ?? 0.35) * 0.08 + userData.energyFactor * 0.16;
        child.rotation.y += deltaTime * motionRate;
      }
    }
  }

  updateMoodCanopies(deltaTime) {
    const time = performance.now() * 0.001;
    for (const child of this.vfxContainer.children) {
      if (child.userData && child.userData.type === 'mood-canopy') {
        const userData = child.userData;
        userData.pulsePhase += deltaTime * (0.8 + userData.motionBias * 0.22);
        child.rotation.y += deltaTime * userData.spin;
        child.position.y += Math.sin(userData.pulsePhase) * 0.002;

        const canopyScale = 1 + Math.sin(userData.pulsePhase) * (0.04 + userData.motionBias * 0.02) + userData.energyFactor * 0.05;
        child.scale.setScalar(canopyScale);

        child.children.forEach((panel, index) => {
          const baseAngle = panel.userData.baseAngle ?? 0;
          const baseLift = panel.userData.baseLift ?? 0.4;
          const baseRadius = panel.userData.baseRadius ?? 1;
          const sway = Math.sin(time * (0.9 + userData.motionBias * 0.5) + index * 0.7 + userData.pulsePhase) * userData.sway;
          const breathe = 1 + Math.sin(time * 1.2 + index * 0.6 + userData.pulsePhase) * 0.08;

          panel.position.x = Math.cos(baseAngle + sway * 0.3) * baseRadius;
          panel.position.y = baseLift + Math.sin(time * 1.4 + index) * 0.05 * (1 + userData.energyFactor);
          panel.position.z = Math.sin(baseAngle + sway * 0.3) * baseRadius;
          panel.rotation.y = baseAngle + sway * 0.12;
          panel.rotation.z += deltaTime * 0.02 * (index % 2 === 0 ? 1 : -1);
          panel.scale.y = Math.max(0.6, panel.scale.y * 0.9 + breathe * 0.1);
          if (panel.material) {
            panel.material.opacity = Math.min(0.42, (panel.material.opacity || 0.18) * 0.9 + (0.14 + userData.energyFactor * 0.08 + Math.abs(sway) * 0.08) * 0.1);
          }
        });
      }
    }
  }
  
  /**
   * Update orbit rings (rotation + opacity pulse)
   */
  updateRings(deltaTime) {
    for (const child of this.vfxContainer.children) {
      if (child.userData && child.userData.type === 'orbit-ring') {
        const userData = child.userData;
        let spinSpeed = userData.rotationSpeed;

        if (userData.eventSpinBoost) {
          userData.eventSpinBoost.timer += deltaTime;
          const progress = Math.min(1, userData.eventSpinBoost.timer / userData.eventSpinBoost.duration);
          spinSpeed += userData.eventSpinBoost.amount * (1 - progress);
          if (progress >= 1) {
            delete userData.eventSpinBoost;
          }
        }

        const additionalSpin = (userData.motionBias ?? 0.35) * 0.12;
        const direction = userData.direction || 1;
        child.rotation.z += deltaTime * direction * (spinSpeed + additionalSpin);
        child.rotation.x += deltaTime * direction * (spinSpeed * 0.18 + additionalSpin * 0.1);
      }
    }
  }
  /**
   * Update central glow animation
   */
  updateCentralGlows(deltaTime) {
    const time = performance.now() * 0.001;
    
    for (const child of this.vfxContainer.children) {
      if (child.userData && child.userData.type === 'central-glow') {
        const userData = child.userData;
        
        // Pulse glow
        userData.pulsePhase += deltaTime * userData.pulseSpeed;
        const pulse = Math.sin(userData.pulsePhase) * (0.16 + (userData.motionBias ?? 0.35) * 0.06) + 0.28;
        child.material.opacity = Math.min(1, 0.18 + pulse * 0.9);
        
        // Scale pulse
        const scaleModifier = 0.88 + Math.sin(userData.pulsePhase) * (0.18 + (userData.motionBias ?? 0.35) * 0.04);
        child.scale.setScalar(scaleModifier);
      }
    }
  }
  
  /**
   * Update conscious core animation
   */
  updateCores(deltaTime) {
    for (const child of this.vfxContainer.children) {
        if (child.userData && child.userData.type === 'core') {
        const userData = child.userData;
        userData.pulsePhase += deltaTime * userData.pulseSpeed;
        const isActivePulse = userData.stage >= 2;
        const pulseAmount = isActivePulse ? 0.18 : 0.04;
        const pulse = Math.sin(userData.pulsePhase) * (pulseAmount + (userData.motionBias ?? 0.35) * 0.05) + 1.0 + userData.energyFactor * 0.1;
        child.scale.setScalar(pulse);
        child.rotation.y += deltaTime * (0.22 + (userData.motionBias ?? 0.35) * 0.12);
        child.rotation.x += deltaTime * (0.08 + (userData.motionBias ?? 0.35) * 0.06);
      }
    }
  }
  
  /**
   * Update legendary crowns (rotation)
   */
  updateLegendaryCrowns(deltaTime) {
    for (const child of this.vfxContainer.children) {
      if (child.userData && child.userData.type === 'legendary-crown') {
        const userData = child.userData;
        child.rotation.y += deltaTime * (userData.rotationSpeed * 0.4 + 0.02);
        child.rotation.z += deltaTime * (userData.rotationSpeed * 0.18 + 0.01);
      }
    }
  }

  updateLegendaryHalos(deltaTime) {
    const time = performance.now() * 0.001;
    for (const child of this.vfxContainer.children) {
      if (child.userData && child.userData.type === 'legendary-halo') {
        const userData = child.userData;
        userData.pulsePhase += deltaTime * userData.pulseSpeed;
        child.material.opacity = 0.18 + Math.sin(userData.pulsePhase) * 0.08;
        const scale = 1.0 + Math.sin(userData.pulsePhase * 0.75) * 0.12;
        child.scale.setScalar(scale);
      }
    }
  }

  updateLegendaryPresence(deltaTime) {
    const time = performance.now() * 0.001;
    for (const child of this.vfxContainer.children) {
      if (child.userData && child.userData.type === 'legendary-presence') {
        const userData = child.userData;
        userData.pulsePhase += deltaTime * userData.pulseSpeed;
        const offset = Math.sin(userData.pulsePhase) * 0.08;
        child.children.forEach((orb, index) => {
          orb.position.y = 0.2 + offset * (index + 1) * 0.5;
          if (orb.material) {
            orb.material.opacity = 0.45 + Math.sin(time * 2 + index) * 0.1;
          }
        });
      }
    }
  }

  /**
   * Update sigil rings (pulse and rotation)
   */
  updateSigils(deltaTime) {
    const time = performance.now() * 0.001;
    for (const child of this.vfxContainer.children) {
      if (child.userData && child.userData.type === 'sigil-ring') {
        const userData = child.userData;
        userData.pulsePhase += deltaTime * userData.pulseSpeed;
        const pulse = Math.sin(userData.pulsePhase) * 0.08 + 1.0;
        child.scale.setScalar(pulse);
        child.rotation.z += deltaTime * 0.15;
        child.material.opacity = 0.25 + Math.sin(time * 1.5 + userData.pulsePhase) * 0.08;
      }
    }
  }

  /**
   * Update ascension beams (flicker and pulse)
   */
  updateBeams(deltaTime) {
    const time = performance.now() * 0.001;
    for (const child of this.vfxContainer.children) {
      if (child.userData && child.userData.type === 'ascension-beam') {
        const userData = child.userData;
        userData.pulsePhase += deltaTime * userData.pulseSpeed;
        const pulse = 0.8 + Math.sin(time * 2 + userData.pulsePhase) * 0.15 + userData.energyFactor * 0.1;
        child.scale.y = pulse;
        child.material.opacity = 0.16 + Math.sin(time * 3 + userData.pulsePhase) * 0.06;
      }
    }
  }
  
  /**
   * Update colony VFX state changes
   */
  updateVFXForColony(colonyId, colony, registryVFX, envelope = {}) {
    if (!registryVFX[colonyId]) return;
    
    const vfx = registryVFX[colonyId];
    const energyFactor = envelope.energyFactor ?? Math.min(1, colony.energy / 100);
    const profile = this.getMoodProfile(colony.mood);
    const baseColor = this.getColorForMood(colony.mood, colony.type);
    const color = this.blendColor(baseColor, profile.colorBias, 0.35);
    
    const time = performance.now() * 0.001;
    const stablePhase = time + (vfx.phaseSeed ?? 0) * Math.PI * 1.4 + (vfx.pulseOffset ?? 0);
    const stablePulse = 0.96 + Math.sin(stablePhase) * 0.04;

    if (vfx.atmosphere && vfx.atmosphere.material) {
      vfx.atmosphere.material.color.setHex(color);
      vfx.atmosphere.material.opacity = Math.min(1, this.config.atmosphere.opacity + energyFactor * 0.25 + profile.motionBias * 0.14 + (envelope.crest ?? 0) * 0.08 + (vfx.halo?.userData?.haloPressure ?? 0));
      const pulse = 1 + (envelope.attack ?? 0) * 0.1 + profile.motionBias * 0.04 + (envelope.crest ?? 0) * 0.06 + (stablePulse - 1) * 0.08;
      vfx.atmosphere.scale.setScalar(pulse);
    }
    
    const stage = Math.max(0, Math.min(4, colony.stage));
    const breathingColor = new THREE.Color(color).lerp(new THREE.Color(0xF7FBFF), Math.min(0.3, (envelope.crest ?? 0) * 0.18 + energyFactor * 0.05));
    const visibleRingCount = stage === 1 ? 1 : stage === 2 ? Math.min(2, vfx.rings.length) : stage === 3 ? Math.min(4, vfx.rings.length) : vfx.rings.length;

    for (const ring of vfx.rings) {
      if (ring && ring.material) {
        const ringHue = this.blendColor(color, breathingColor.getHex(), 0.22);
        ring.material.color.setHex(ringHue);
        const ringVisibility = ring.userData?.ringIndex < visibleRingCount;
        ring.visible = ringVisibility;
        ring.material.opacity = ringVisibility
          ? Math.min(1, this.config.rings.opacity + stage * 0.06 + (envelope.crest ?? 0) * 0.18 + profile.motionBias * 0.1)
          : 0;
        const speed = (ring.userData?.rotationSpeed ?? 0.4) + (envelope.attack ?? 0) * 0.16 + profile.motionBias * 0.15 + (vfx.ringSpeedBias ?? 0) * 0.18;
        if (ring.userData) ring.userData.rotationSpeed = speed;
      }
    }

    for (const particle of vfx.particles) {
      if (particle && particle.material) {
        particle.material.color.setHex(this.blendColor(color, breathingColor.getHex(), 0.18));
        particle.material.size = 0.14 + energyFactor * 0.08 + (profile.particleDensity - 1.0) * 0.08 + (envelope.crest ?? 0) * 0.06 + ((vfx.particleBias ?? 1) - 1) * 0.05;
        particle.material.opacity = Math.min(1, 0.35 + stage * 0.08 + energyFactor * 0.22 + (profile.motionBias * 0.12) + (envelope.attack ?? 0) * 0.12);
        if (particle.userData) {
          const scale = 1 + (envelope.crest ?? 0) * 0.09 + profile.motionBias * 0.08 + ((vfx.particleBias ?? 1) - 1) * 0.06;
          particle.userData.orbitSpeed = Math.max(0.2, particle.userData.orbitSpeed) * scale;
        }
      }
    }

    if (vfx.canopy && vfx.canopy.userData?.type === 'mood-canopy') {
      const canopyOpacity = 0.12 + stage * 0.025 + energyFactor * 0.08 + (envelope.crest ?? 0) * 0.1;
      vfx.canopy.userData.motionBias = profile.motionBias;
      vfx.canopy.userData.energyFactor = energyFactor;
      vfx.canopy.userData.color = this.blendColor(color, breathingColor.getHex(), 0.24);
      vfx.canopy.userData.spin = Math.max(0.04, (vfx.canopy.userData.spin ?? 0.08) + (envelope.attack ?? 0) * 0.05);

      for (const panel of vfx.canopy.children) {
        if (!panel.material) continue;
        panel.material.color.setHex(vfx.canopy.userData.color);
        panel.material.opacity = Math.min(0.42, canopyOpacity + profile.motionBias * 0.05);
      }
    }
    
    if (vfx.core && vfx.core.material) {
      if (vfx.core.userData) {
        vfx.core.userData.pulseSpeed = 1.2 + stage * 0.12 + profile.motionBias * 0.08 + (envelope.crest ?? 0) * 0.03;
      }
      vfx.core.material.color.setHex(breathingColor.getHex());
      const coreScale = 0.9 + energyFactor * 0.45 + colony.stage * 0.05 + (envelope.crest ?? 0) * 0.12 + (envelope.attack ?? 0) * 0.06 + profile.motionBias * 0.02;
      vfx.core.scale.setScalar(coreScale);
    }
    
    if (vfx.glow && vfx.glow.material) {
      vfx.glow.material.opacity = 0.25 + (envelope.crest ?? 0) * 0.18 + energyFactor * 0.1;
      vfx.glow.scale.setScalar(0.9 + colony.stage * 0.06 + (envelope.attack ?? 0) * 0.07);
    }
    
    if (vfx.legendaryHalo && vfx.legendaryHalo.material) {
      vfx.legendaryHalo.material.opacity = 0.18 + (envelope.attack ?? 0) * 0.12 + energyFactor * 0.08;
      vfx.legendaryHalo.scale.setScalar(1 + colony.stage * 0.04 + (envelope.crest ?? 0) * 0.06);
    }

    if (vfx.legendaryPresence) {
      for (const orb of vfx.legendaryPresence.children) {
        if (orb.material) {
          orb.material.opacity = 0.45 + energyFactor * 0.15 + (envelope.crest ?? 0) * 0.05;
        }
      }
    }
    
    if (vfx.sigils) {
      for (const sigil of vfx.sigils) {
        if (sigil && sigil.material) {
          sigil.material.opacity = 0.15 + (envelope.crest ?? 0) * 0.1 + profile.motionBias * 0.05;
        }
      }
    }
    
    if (vfx.beam && vfx.beam.material) {
      vfx.beam.material.opacity = 0.12 + (envelope.crest ?? 0) * 0.1 + energyFactor * 0.08;
    }
  }
  
  /**
   * Trigger colony birth event (expanding ring burst)
   */
  triggerBirthEvent(colonyId, center, color) {
    const geometry = new THREE.TorusGeometry(0.1, 0.05, 16, 32);
    const material = this.createBasicMaterial(color, 1.0);
    
    const burst = new THREE.Mesh(geometry, material);
    burst.position.copy(center);
    burst.scale.setScalar(0.1);
    
    burst.userData = {
      type: 'birth-event',
      elapsed: 0,
      lifetime: 0.5,
      expandSpeed: 3.0
    };
    
    this.vfxContainer.add(burst);
    return burst;
  }
  
  /**
   * Trigger colony collapse event (implosion)
   */
  triggerCollapseEvent(colonyId, center, color) {
    const geometry = new THREE.SphereGeometry(1.0, 16, 16);
    const material = this.createBasicMaterial(color, 0.5);
    
    const collapse = new THREE.Mesh(geometry, material);
    collapse.position.copy(center);
    
    collapse.userData = {
      type: 'collapse-event',
      elapsed: 0,
      lifetime: 0.8,
      collapseSpeed: 2.0
    };
    
    this.vfxContainer.add(collapse);
    return collapse;
  }

  /**
   * Trigger colony growth event (bloom)
   */
  triggerGrowthEvent(colonyId, center, color, stage = 1) {
    const geometry = new THREE.RingGeometry(0.4, 0.56 + stage * 0.06, 28, 2);
    const material = this.createBasicMaterial(color, 0.35, THREE.DoubleSide);

    const growth = new THREE.Mesh(geometry, material);
    growth.position.copy(center);
    growth.rotation.x = Math.PI / 2;
    growth.userData = {
      colonyId: colonyId,
      type: 'growth-event',
      elapsed: 0,
      lifetime: 0.9,
      initialScale: 0.7 + stage * 0.05,
      rotationAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize()
    };

    growth.scale.setScalar(growth.userData.initialScale);
    this.vfxContainer.add(growth);
    return growth;
  }

  /**
   * Trigger colony merge event (convergence pulse)
   */
  triggerMergeEvent(colonyId, center, color) {
    const geometry = new THREE.TorusGeometry(0.5, 0.1, 16, 48);
    const material = this.createBasicMaterial(color, 0.45);

    const merge = new THREE.Mesh(geometry, material);
    merge.position.copy(center);
    merge.rotation.x = Math.PI / 2;
    merge.userData = {
      colonyId: colonyId,
      type: 'merge-event',
      elapsed: 0,
      lifetime: 0.9,
      spinSpeed: 1.4
    };

    this.vfxContainer.add(merge);
    return merge;
  }

  /**
   * Trigger colony split event (fracture ring)
   */
  triggerSplitEvent(colonyId, center, color) {
    const geometry = new THREE.RingGeometry(0.3, 0.55, 24, 2);
    const material = this.createBasicMaterial(color, 0.5, THREE.DoubleSide);

    const split = new THREE.Mesh(geometry, material);
    split.position.copy(center);
    split.rotation.x = Math.PI / 2;
    split.userData = {
      colonyId: colonyId,
      type: 'split-event',
      elapsed: 0,
      lifetime: 1.0,
      pulseSpeed: 2.4,
      wobble: Math.random() * 0.4 + 0.2
    };

    this.vfxContainer.add(split);
    return split;
  }

  triggerMergeFlash(colonyId, center, intensity = 1.0, duration = 0.6) {
    const geometry = new THREE.RingGeometry(0.28, 0.42 + intensity * 0.06, 32, 2);
    const material = this.createBasicMaterial(0xffffff, 0.88, THREE.DoubleSide);
    const flash = new THREE.Mesh(geometry, material);
    flash.position.copy(center);
    flash.rotation.x = Math.PI / 2;
    flash.userData = {
      colonyId,
      type: 'merge-flash',
      elapsed: 0,
      lifetime: duration,
      intensity
    };
    this.vfxContainer.add(flash);
    this.triggerEventPulse(colonyId, 0.9 * intensity, duration * 0.85);
    this.triggerEventColorShift(colonyId, 0xffffff, duration * 0.45);
    return flash;
  }

  triggerSplitRupture(colonyId, center, intensity = 1.0, duration = 1.0) {
    const geometry = new THREE.RingGeometry(0.35, 0.5 + intensity * 0.08, 32, 2);
    const material = this.createBasicMaterial(0xffaa88, 0.78, THREE.DoubleSide);
    const rupture = new THREE.Mesh(geometry, material);
    rupture.position.copy(center);
    rupture.rotation.x = Math.PI / 2;
    rupture.userData = {
      colonyId,
      type: 'rupture-event',
      elapsed: 0,
      lifetime: duration,
      intensity
    };
    this.vfxContainer.add(rupture);
    this.triggerEventPulse(colonyId, 0.65 * intensity, duration * 0.75);
    this.triggerEventColorShift(colonyId, 0xff8866, duration * 0.7);
    return rupture;
  }

  triggerTransformationEvent(colonyId, center, duration = 1.0) {
    const geometry = new THREE.RingGeometry(0.22, 0.38, 28, 2);
    const material = this.createBasicMaterial(0xdde8ff, 0.72, THREE.DoubleSide);
    const transform = new THREE.Mesh(geometry, material);
    transform.position.copy(center);
    transform.rotation.x = Math.PI / 2;
    transform.userData = {
      colonyId,
      type: 'transformation-event',
      elapsed: 0,
      lifetime: duration
    };
    this.vfxContainer.add(transform);
    this.triggerEventPulse(colonyId, 0.7, duration * 0.9);
    return transform;
  }

  triggerRebirthEvent(colonyId, center, duration = 0.9) {
    const geometry = new THREE.CircleGeometry(0.2, 32);
    const material = this.createBasicMaterial(0xa8f3ff, 0.65, THREE.DoubleSide);
    const rebirth = new THREE.Mesh(geometry, material);
    rebirth.position.copy(center);
    rebirth.rotation.x = Math.PI / 2;
    rebirth.userData = {
      colonyId,
      type: 'rebirth-event',
      elapsed: 0,
      lifetime: duration
    };
    this.vfxContainer.add(rebirth);
    this.triggerEventPulse(colonyId, 0.6, duration * 0.8);
    return rebirth;
  }
  
  /**
   * Update event animations
   */
  updateEvents(deltaTime) {
    const children = [...this.vfxContainer.children];

    for (const child of children) {
      if (!child.userData) continue;

      const userData = child.userData;

      if (userData.type === 'birth-event') {
        userData.elapsed += deltaTime;
        const progress = userData.elapsed / userData.lifetime;

        child.scale.setScalar(0.1 + progress * userData.expandSpeed);
        child.material.opacity = 1 - progress;

        if (progress >= 1) {
          this.vfxContainer.remove(child);
        }
      }

      if (userData.type === 'collapse-event') {
        userData.elapsed += deltaTime;
        const progress = userData.elapsed / userData.lifetime;

        child.scale.setScalar(1.0 - progress * userData.collapseSpeed);
        child.material.opacity = 0.5 - progress * 0.5;

        if (progress >= 1) {
          this.vfxContainer.remove(child);
        }
      }

      if (userData.type === 'growth-event') {
        userData.elapsed += deltaTime;
        const progress = userData.elapsed / userData.lifetime;
        const scale = userData.initialScale + progress * 1.2;
        child.scale.setScalar(scale);
        child.material.opacity = Math.max(0, 0.35 - progress * 0.35);
        child.rotation.y += deltaTime * 0.6;

        if (progress >= 1) {
          this.vfxContainer.remove(child);
        }
      }

      if (userData.type === 'merge-event') {
        userData.elapsed += deltaTime;
        const progress = userData.elapsed / userData.lifetime;
        child.scale.setScalar(1.0 + progress * 0.8);
        child.material.opacity = Math.max(0, 0.45 - progress * 0.45);
        child.rotation.z += deltaTime * userData.spinSpeed;

        if (progress >= 1) {
          this.vfxContainer.remove(child);
        }
      }

      if (userData.type === 'split-event') {
        userData.elapsed += deltaTime;
        const progress = userData.elapsed / userData.lifetime;
        child.scale.setScalar(1.0 + Math.sin(progress * Math.PI * 2) * 0.25);
        child.material.opacity = Math.max(0, 0.5 - progress * 0.5);
        child.rotation.y += deltaTime * (userData.pulseSpeed + userData.wobble);
        child.rotation.x += deltaTime * 0.4;

        if (progress >= 1) {
          this.vfxContainer.remove(child);
        }
      }

      if (userData.type === 'merge-flash') {
        userData.elapsed += deltaTime;
        const progress = userData.elapsed / userData.lifetime;
        child.scale.setScalar(1.0 + progress * 1.5 * (userData.intensity || 1));
        child.material.opacity = Math.max(0, 0.88 - progress * 0.95);
        child.rotation.z += deltaTime * 3.2;

        if (progress >= 1) {
          this.vfxContainer.remove(child);
        }
      }

      if (userData.type === 'rupture-event') {
        userData.elapsed += deltaTime;
        const progress = userData.elapsed / userData.lifetime;
        child.scale.setScalar(1.0 + progress * 1.8 * (userData.intensity || 1));
        child.material.opacity = Math.max(0, 0.78 - progress * 0.82);
        child.rotation.z += deltaTime * 3.8;

        if (progress >= 1) {
          this.vfxContainer.remove(child);
        }
      }

      if (userData.type === 'transformation-event') {
        userData.elapsed += deltaTime;
        const progress = userData.elapsed / userData.lifetime;
        child.scale.setScalar(1.0 + Math.sin(progress * Math.PI) * 0.22);
        child.material.opacity = Math.max(0, 0.72 - progress * 0.72);
        child.rotation.y += deltaTime * 1.1;

        if (progress >= 1) {
          this.vfxContainer.remove(child);
        }
      }

      if (userData.type === 'rebirth-event') {
        userData.elapsed += deltaTime;
        const progress = userData.elapsed / userData.lifetime;
        child.scale.setScalar(0.6 + progress * 1.6);
        child.material.opacity = Math.max(0, 0.65 - progress * 0.7);
        child.rotation.z += deltaTime * 2.2;

        if (progress >= 1) {
          this.vfxContainer.remove(child);
        }
      }
    }
  }

  /**
   * Apply temporary world event modifiers to VFX elements
   */
  updateWorldEventEffects(deltaTime) {
    const time = performance.now() * 0.001;
    for (const child of this.vfxContainer.children) {
      const userData = child.userData;
      if (!userData) continue;

      if (userData.eventColorShift && child.material) {
        userData.eventColorShift.timer += deltaTime;
        const progress = Math.min(1, userData.eventColorShift.timer / userData.eventColorShift.duration);
        const blend = Math.sin(progress * Math.PI * 0.5);
        const baseColor = new THREE.Color(userData.eventColorShift.baseColor);
        const targetColor = new THREE.Color(userData.eventColorShift.targetColor);
        baseColor.lerp(targetColor, blend);
        child.material.color.copy(baseColor);

        if (progress >= 1) {
          child.material.color.setHex(userData.eventColorShift.baseColor);
          delete userData.eventColorShift;
        }
      }

      if (userData.eventPulse) {
        userData.eventPulse.timer += deltaTime;
        const progress = Math.min(1, userData.eventPulse.timer / userData.eventPulse.duration);
        const pulseScale = 1 + userData.eventPulse.intensity * (1 - progress) * 0.3;
        if (userData.baseScale) {
          child.scale.copy(userData.baseScale).multiplyScalar(pulseScale);
        } else {
          child.scale.setScalar(pulseScale);
        }

        if (progress >= 1) {
          delete userData.eventPulse;
        }
      }

      if (userData.eventGlow && child.userData.type === 'central-glow' && child.material) {
        userData.eventGlow.timer += deltaTime;
        const progress = Math.min(1, userData.eventGlow.timer / userData.eventGlow.duration);
        const boost = userData.eventGlow.intensity * (1 - progress);
        child.material.opacity = Math.min(1, 0.3 + boost * 0.8);
        child.scale.setScalar(1 + boost * 0.35);

        if (progress >= 1) {
          delete userData.eventGlow;
        }
      }

      if (userData.eventCrown && child.userData.type === 'legendary-crown') {
        userData.eventCrown.timer += deltaTime;
        const progress = Math.min(1, userData.eventCrown.timer / userData.eventCrown.duration);
        const intensity = userData.eventCrown.intensity * (1 - progress);
        child.rotation.y += deltaTime * (0.8 + intensity * 1.2);

        if (child.children) {
          child.children.forEach(spike => {
            if (spike.material) {
              spike.material.opacity = 0.7 + intensity * 0.3;
            }
          });
        }

        if (progress >= 1) {
          delete userData.eventCrown;
        }
      }

      if (userData.eventDeform && (userData.type === 'orbit-ring' || userData.type === 'sigil-ring')) {
        userData.eventDeform.timer += deltaTime;
        const progress = Math.min(1, userData.eventDeform.timer / userData.eventDeform.duration);
        const deformValue = Math.sin(time * 10) * userData.eventDeform.amount * (1 - progress);
        child.scale.x = 1 + deformValue;
        child.scale.z = 1 - deformValue;

        if (progress >= 1) {
          child.scale.x = 1;
          child.scale.z = 1;
          delete userData.eventDeform;
        }
      }

      if (userData.fadeOut) {
        userData.fadeOut.timer += deltaTime;
        if (userData.fadeOut.delay && userData.fadeOut.timer < userData.fadeOut.delay) {
          continue;
        }

        const fadeProgress = Math.min(1, (userData.fadeOut.timer - (userData.fadeOut.delay || 0)) / userData.fadeOut.duration);
        const baseOpacity = userData.fadeOut.startOpacity ?? (child.material?.opacity ?? 1);
        const opacity = Math.max(0, baseOpacity * (1 - fadeProgress));

        if (child.material) {
          child.material.opacity = opacity;
        }

        if (fadeProgress >= 1) {
          this.releaseVFXObject(child);
          continue;
        }
      }
    }
  }

  /**
   * Clean up VFX for a colony
   */
  cleanupColonyVFX(colonyId, options = {}) {
    const children = [...this.vfxContainer.children];
    const duration = options.duration ?? 0.9;
    const delay = options.delay ?? 0;
    const soft = options.soft === true;

    for (const child of children) {
      if (child.userData && child.userData.colonyId === colonyId) {
        if (soft) {
          child.userData.fadeOut = {
            timer: 0,
            duration,
            delay,
            startOpacity: child.material?.opacity ?? 1
          };
          continue;
        }

        this.releaseVFXObject(child);
      }
    }
  }
  
  /**
   * Get color based on mood
   */
  getMoodProfile(mood) {
    const effectiveMood = mood === 'CALM' ? 'HARMONY' : mood;
    return this.config.moodVisualBiasMap[effectiveMood] || this.config.moodProfiles.HARMONY;
  }

  blendColor(baseColor, biasColor, bias) {
    const r = ((baseColor >> 16) & 0xff) * (1 - bias) + ((biasColor >> 16) & 0xff) * bias;
    const g = ((baseColor >> 8) & 0xff) * (1 - bias) + ((biasColor >> 8) & 0xff) * bias;
    const b = (baseColor & 0xff) * (1 - bias) + (biasColor & 0xff) * bias;
    return ((Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)) >>> 0;
  }

  getColorForMood(mood, colonyType) {
    const effectiveMood = mood === 'CALM' ? 'HARMONY' : mood;
    if (this.config.colors[effectiveMood]) {
      return this.config.colors[effectiveMood];
    }
    
    if (this.config.colors[colonyType]) {
      return this.config.colors[colonyType];
    }
    
    return this.config.colors.DEFAULT;
  }
  
  /**
   * Get radius based on stage
   */
  getRadiusForStage(stage) {
    return 1.0 + stage * 0.3;
  }
  
  /**
   * Full update cycle
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunSimulation?.()) return;
    this.updateParticles(deltaTime);
    this.updateAtmospheres(deltaTime);
    this.updateMoodCanopies(deltaTime);
    this.updateRings(deltaTime);
    this.updateCentralGlows(deltaTime);
    this.updateCores(deltaTime);
    this.updateSigils(deltaTime);
    this.updateBeams(deltaTime);
    this.updateLegendaryCrowns(deltaTime);
    this.updateLegendaryHalos(deltaTime);
    this.updateLegendaryPresence(deltaTime);
    this.updateEvents(deltaTime);
    this.updateWorldEventEffects(deltaTime);
    this.updateTransitions(deltaTime);
  }
  

  triggerMergeTransition(sourceIds, mergedCenter, duration = 1.0) {
    for (const child of this.vfxContainer.children) {
      if (!child.userData || !sourceIds.includes(child.userData.colonyId)) continue;
      child.userData.transition = {
        type: 'merge',
        targetCenter: mergedCenter.clone(),
        duration,
        timer: 0,
        startPosition: child.position.clone(),
        startOpacity: child.material?.opacity ?? 1
      };
      this.transitioningVFX.add(child);
    }
  }

  triggerSplitTransition(colonyId, duration = 1.2) {
    for (const child of this.vfxContainer.children) {
      if (!child.userData || child.userData.colonyId !== colonyId) continue;
      const direction = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 0.5 + 0.2,
        (Math.random() - 0.5) * 2
      ).normalize();
      child.userData.transition = {
        type: 'split',
        duration,
        timer: 0,
        direction,
        startOpacity: child.material?.opacity ?? 1
      };
      this.transitioningVFX.add(child);
    }
  }

  updateTransitions(deltaTime) {
    const time = performance.now() * 0.001;
    for (const child of Array.from(this.transitioningVFX)) {
      const userData = child.userData;
      if (!userData?.transition) {
        this.transitioningVFX.delete(child);
        continue;
      }

      userData.transition.timer += deltaTime;
      const progress = Math.min(1, userData.transition.timer / userData.transition.duration);
      const ease = progress * progress * (3 - 2 * progress);

      if (userData.transition.type === 'merge') {
        child.position.lerpVectors(userData.transition.startPosition, userData.transition.targetCenter, ease);
        if (child.material) {
          child.material.opacity = Math.max(0, userData.transition.startOpacity * (1 - ease));
        }
      }

      if (userData.transition.type === 'split') {
        child.position.addScaledVector(userData.transition.direction, deltaTime * 0.6);
        child.rotation.y += deltaTime * 1.4;
        if (child.material) {
          child.material.opacity = Math.max(0, userData.transition.startOpacity * (1 - ease * 1.2));
        }
      }

      if (progress >= 1) {
        const transitionType = userData.transition.type;
        delete userData.transition;
        this.transitioningVFX.delete(child);
        if (transitionType === 'split') {
          this.releaseVFXObject(child);
        } else {
          this.releaseVFXObject(child);
        }
      }
    }
  }

  /**
   * Trigger a rapid expansion pulse in civilization VFX
   */
  triggerEventPulse(colonyId, intensity = 1.0, duration = 0.8) {
    for (const child of this.vfxContainer.children) {
      if (child.userData?.colonyId !== colonyId) continue;
      const type = child.userData.type;
      if (['atmosphere', 'orbit-ring', 'sigil-ring', 'ascension-beam', 'core', 'central-glow', 'legendary-halo', 'mood-canopy'].includes(type)) {
        child.userData.eventPulse = {
          intensity,
          duration,
          timer: 0
        };
        if (!child.userData.baseScale) {
          child.userData.baseScale = child.scale.clone();
        }
      }
    }
  }

  /**
   * Trigger temporary color displacement for a world event
   */
  triggerEventColorShift(colonyId, targetColor, duration = 1.2) {
    for (const child of this.vfxContainer.children) {
      if (child.userData?.colonyId !== colonyId || !child.material) continue;
      child.userData.eventColorShift = {
        targetColor,
        baseColor: child.userData.baseColor ?? child.material.color.getHex(),
        duration,
        timer: 0
      };
    }
  }

  /**
   * Activate legendary crown reaction to an event
   */
  activateEventCrown(colonyId, duration = 1.5) {
    for (const child of this.vfxContainer.children) {
      if (child.userData?.colonyId !== colonyId || child.userData?.type !== 'legendary-crown') continue;
      child.userData.eventCrown = {
        intensity: 1.0,
        duration,
        timer: 0
      };
    }
  }

  /**
   * Intensify central glow for a world event
   */
  intensifyEventGlow(colonyId, intensity = 0.8, duration = 1.4) {
    for (const child of this.vfxContainer.children) {
      if (child.userData?.colonyId !== colonyId) continue;
      if (child.userData.type === 'central-glow') {
        child.userData.eventGlow = {
          intensity,
          duration,
          timer: 0
        };
      }
    }
  }

  /**
   * Deform rings to communicate storm or invasion energy
   */
  deformEventRings(colonyId, amount = 0.35, duration = 1.2) {
    for (const child of this.vfxContainer.children) {
      if (child.userData?.colonyId !== colonyId) continue;
      if (['orbit-ring', 'sigil-ring'].includes(child.userData.type)) {
        child.userData.eventDeform = {
          amount,
          duration,
          timer: 0
        };
        if (!child.userData.baseScale) {
          child.userData.baseScale = child.scale.clone();
        }
      }
    }
  }

  boostEventRingSpin(colonyId, amount = 0.25, duration = 1.2) {
    for (const child of this.vfxContainer.children) {
      if (child.userData?.colonyId !== colonyId) continue;
      if (child.userData.type === 'orbit-ring') {
        child.userData.eventSpinBoost = {
          amount,
          duration,
          timer: 0
        };
      }
    }
  }

  cleanup() {
    this.vfxContainer.clear();
    this.scene.remove(this.vfxContainer);
  }
}
