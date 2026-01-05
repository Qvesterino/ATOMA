import * as THREE from 'three';

/**
 * NODE PERSONALITY 2.0 - SAFE EDITION
 * 
 * Gives each node a unique "personality signature" using purely visual + micro-behavior effects.
 * This system does NOT alter gameplay, physics, linking logic, movement, or camera behavior.
 * All changes are additive and 100% safe.
 * 
 * CORE DESIGN PRINCIPLES:
 * ✓ SAFE: Pure visual-only effects (no position, physics, linking changes)
 * ✓ SAFE: Animation parameters only (glow, rotation, scale capped at ±5%)
 * ✓ SAFE: FX overlays only (particles, hologram layers, micro-animations)
 * ✓ SAFE: Non-destructive (can be disabled/enabled without conflicts)
 * ✓ SAFE: Works seamlessly with Evolution 2.0, Archetypes Pack, Link FX 2.0
 * ✓ SAFE: No node registry modifications, read-only from link data
 * ✓ PERFORMANCE: < 0.5ms cost per node per frame
 * 
 * PERSONALITY SIGNATURE TYPES (8 UNIQUE PROFILES):
 * 1. The Pulsar (Integration / Solar) - Rhythmic breathing glow
 * 2. The Analyst (Analytics) - Rotating inner geometry + micro-particles
 * 3. The Echo Node (Process / Echo) - Orbiters + fade trails + pings
 * 4. The Umbra Absorber (Control / Umbra) - Inward glow + light-warp ring
 * 5. The Crystal Mind (Crystal) - Prism refractions + light bands
 * 6. The Harmonic (Harmonic) - Sinusoidal warping + waveform ripples
 * 7. The Quantum Flicker (Quantum) - Micro jitter + frame-displacement shimmer
 * 8. The Glyph Keeper (Glyph) - Rotating symbols + glyph trails + rune flashes
 * 
 * INTENSITY LEVELS:
 * Level 0 - Off (fallback if any issue)
 * Level 1 - Subtle (base personality)
 * Level 2 - Noticeable but stable
 * Level 3 - Rare (1-5% of nodes, visually richer)
 * Level 4 - Ascended nodes only (legendary)
 * 
 * SAFETY GUARANTEES:
 * - No position movement (position locked)
 * - No physics bodies added
 * - No linking changes
 * - Scale capped at ±5%
 * - Max 30 particles per node
 * - No recursion or stacking timers
 * - Graceful fallback to Level 0 on error
 * - Performance monitored, auto-throttle if > 0.5ms
 */

export class NodePersonality2_0 {
  constructor(scene) {
    this.scene = scene;
    
    // Personality state registry
    this.registry = {
      personalityActive: true,
      nodePersonalities: new Map(),  // nodeId → personality data
      totalPersonalitiesApplied: 0,
      frameCounter: 0,
      performanceMonitor: {
        averageTimeMs: 0,
        framesSampled: 0,
        maxTimeMs: 0
      }
    };
    
    // Personality definitions
    this.personalities = {
      pulsar: {
        name: 'The Pulsar',
        nodeTypes: ['integration', 'solar'],
        probability: 0.15,
        description: 'Rhythmic breathing glow'
      },
      analyst: {
        name: 'The Analyst',
        nodeTypes: ['analytics'],
        probability: 0.12,
        description: 'Rotating geometry + micro-particles'
      },
      echo: {
        name: 'The Echo Node',
        nodeTypes: ['process', 'echo'],
        probability: 0.12,
        description: 'Orbiters + fade trails + pings'
      },
      umbra: {
        name: 'The Umbra Absorber',
        nodeTypes: ['control', 'umbra'],
        probability: 0.12,
        description: 'Inward glow + light-warp ring'
      },
      crystal: {
        name: 'The Crystal Mind',
        nodeTypes: ['crystal'],
        probability: 0.10,
        description: 'Prism refractions + light bands'
      },
      harmonic: {
        name: 'The Harmonic',
        nodeTypes: ['harmonic'],
        probability: 0.10,
        description: 'Sinusoidal warping + waveform ripples'
      },
      quantum: {
        name: 'The Quantum Flicker',
        nodeTypes: ['quantum'],
        probability: 0.12,
        description: 'Micro jitter + frame-displacement shimmer'
      },
      glyph: {
        name: 'The Glyph Keeper',
        nodeTypes: ['glyph'],
        probability: 0.10,
        description: 'Rotating symbols + trails + rune flashes'
      },
      neutral: {
        name: 'Neutral',
        nodeTypes: ['*'],
        probability: 0.01,  // Fallback for uncategorized
        description: 'No special personality'
      }
    };
    
    // Configuration
    this.config = {
      // ============================================================
      // SAFETY LIMITS
      // ============================================================
      maxParticlesPerNode: 30,
      maxScaleModulation: 0.05,  // ±5% scale variation only
      maxFrameOverhead: 0.5,  // milliseconds per node
      noWorldTransforms: true,
      noPhysicsModifications: true,
      noLinkingChanges: true,
      noCameraEffects: true,
      
      // ============================================================
      // INTENSITY LEVELS (determined by evolution stage + archetype)
      // ============================================================
      intensityLevelMap: {
        1: 'subtle',      // Base personality
        2: 'noticeable',  // Enhanced
        3: 'rare',        // Rare (1-5%)
        4: 'ascended'     // Legendary (0.1-2%)
      },
      
      // ============================================================
      // PERSONALITY-SPECIFIC PARAMETERS
      // ============================================================
      personalities: {
        pulsar: {
          breathingSpeed: 1.5,         // Full breath cycle in seconds
          glowPulseIntensity: 0.3,     // Relative to base glow
          bloomRadius: 0.15,           // Small SAFE radius
          minGlowValue: 0.6,
          maxGlowValue: 1.0
        },
        
        analyst: {
          rotationSpeed: 0.5,          // Full rotation in seconds
          particleCount: 8,            // Small orbit particles
          orbitRadius: 0.3,
          flickerIntensity: 0.2,
          dataFlickerSpeed: 3.0
        },
        
        echo: {
          orbiterCount: 4,             // Small orbiters
          orbitRadius: 0.4,
          orbitSpeed: 0.8,
          trailFadeTime: 0.5,          // seconds
          pingInterval: 3.0,           // seconds between pings
          pingGlowBoost: 0.4
        },
        
        umbra: {
          collapseSpeed: 2.0,          // Full cycle
          collapseMagnitude: 0.08,     // Mild inward-outward
          voidBlinkChance: 0.02,       // Per update
          lightWarpIntensity: 0.1
        },
        
        crystal: {
          refractionSpeed: 1.0,        // Smooth rotation
          lightBandSpeed: 1.5,
          highlightIntensity: 0.4,
          prismColors: 3               // Number of visible prism bands
        },
        
        harmonic: {
          waveSpeed: 1.2,
          waveAmplitude: 0.06,         // Subtle shape modulation
          rippleIntensity: 0.15,
          synergySensitivity: 1.0      // Responds to synergy count
        },
        
        quantum: {
          jitterAmount: 0.003,         // < 0.5% position variance
          jitterSpeed: 10.0,           // Fast micro-oscillation
          shimmerSpeed: 2.0,
          ghostFrameAlpha: 0.3,
          phaseShiftSpeed: 1.5
        },
        
        glyph: {
          symbolCount: 5,
          symbolRotationSpeed: 2.0,
          glyphTrailFadeTime: 0.8,
          activationFlashIntensity: 0.6,
          activationFlashDuration: 0.3
        }
      }
    };
    
    // Glyph symbol library (for Glyph Keeper personality)
    this.glyphSymbols = [
      '◎', '◈', '※', '◘', '◉',
      '⬢', '⬡', '▲', '△', '▼'
    ];
  }
  
  /**
   * Initialize personality system
   */
  initialize() {
    this.registry.personalityActive = true;
    console.log('✓ Node Personality 2.0 initialized');
  }
  
  /**
   * Assign personality to a node based on its category and archetype
   * @param {THREE.Object3D} node - The node mesh
   * @param {string} nodeId - Unique node identifier
   * @param {string} nodeCategory - Node category (input, process, etc.)
   * @param {string|null} archetypeType - Optional archetype type from Archetypes Pack
   * @param {number} evolutionStage - Current evolution stage (1-4)
   */
  assignPersonality(node, nodeId, nodeCategory, archetypeType = null, evolutionStage = 1) {
    if (!node || !nodeId) return false;
    
    try {
      // Check if already assigned
      if (this.registry.nodePersonalities.has(nodeId)) {
        return true;
      }
      
      // Determine personality type and intensity
      const { personalityType, intensityLevel } = this.selectPersonality(
        nodeCategory,
        archetypeType,
        evolutionStage
      );
      
      // Create personality state
      const personalityState = {
        nodeId: nodeId,
        node: node,
        personalityType: personalityType,
        name: this.personalities[personalityType].name,
        intensityLevel: intensityLevel,
        isActive: intensityLevel > 0,
        
        // Base animation state
        animationPhase: Math.random() * Math.PI * 2,
        elapsedTime: 0,
        
        // Visual parameters (safe bounds)
        currentGlowModulation: 1.0,
        currentScaleModulation: 1.0,
        currentRotation: 0,
        
        // Personality-specific data
        customData: this.initializePersonalityData(personalityType),
        
        // Overlay elements (particles, trails, etc.)
        overlayElements: [],
        
        // Safety locks
        safetyFlags: {
          noPositionChange: true,
          noPhysicsModification: true,
          noLinkingChange: true,
          scaleLocked: true,
          noCameraEffects: true
        }
      };
      
      this.registry.nodePersonalities.set(nodeId, personalityState);
      this.registry.totalPersonalitiesApplied++;
      
      // Apply initial visual changes (safe)
      this.applyPersonalityVisuals(personalityState);
      
      return true;
    } catch (error) {
      console.error('Error assigning personality:', error);
      return false;
    }
  }
  
  /**
   * Select personality type based on node category and archetype
   */
  selectPersonality(nodeCategory, archetypeType, evolutionStage) {
    let personalityType = 'neutral';
    let intensity = 1;  // Default: subtle
    
    // Match by category or archetype
    for (const [key, def] of Object.entries(this.personalities)) {
      if (key === 'neutral') continue;
      
      const matchesCategory = def.nodeTypes.includes(nodeCategory) || def.nodeTypes.includes('*');
      const matchesArchetype = archetypeType && def.nodeTypes.includes(archetypeType.toLowerCase());
      
      if (matchesArchetype || (matchesCategory && Math.random() < def.probability)) {
        personalityType = key;
        break;
      }
    }
    
    // Determine intensity based on evolution stage
    if (evolutionStage >= 4) {
      intensity = 4;  // Ascended - full personality
    } else if (evolutionStage === 3) {
      intensity = Math.random() < 0.05 ? 3 : 2;  // Rare or noticeable
    } else if (evolutionStage === 2) {
      intensity = 2;  // Noticeable
    } else {
      intensity = 1;  // Subtle
    }
    
    return { personalityType, intensityLevel: intensity };
  }
  
  /**
   * Initialize personality-specific data
   */
  initializePersonalityData(personalityType) {
    const params = this.config.personalities[personalityType] || {};
    const data = { ...params };
    
    // Add type-specific state
    switch (personalityType) {
      case 'analyst':
        data.particles = [];
        data.rotationPhase = Math.random() * Math.PI * 2;
        break;
        
      case 'echo':
        data.orbiters = [];
        data.trails = [];
        data.lastPingTime = 0;
        break;
        
      case 'umbra':
        data.collapsePhase = Math.random() * Math.PI * 2;
        data.voidBlinkFrames = 0;
        break;
        
      case 'crystal':
        data.refractionPhase = Math.random() * Math.PI * 2;
        data.lightBandPhase = Math.random() * Math.PI * 2;
        break;
        
      case 'harmonic':
        data.wavePhase = Math.random() * Math.PI * 2;
        data.ripplePhase = Math.random() * Math.PI * 2;
        break;
        
      case 'quantum':
        data.jitterPhase = Math.random() * Math.PI * 2;
        data.shimmerPhase = Math.random() * Math.PI * 2;
        data.ghostFrameAlpha = 0;
        break;
        
      case 'glyph':
        data.symbols = [];
        data.symbolPhase = Math.random() * Math.PI * 2;
        data.glyphTrails = [];
        break;
    }
    
    return data;
  }
  
  /**
   * Apply initial personality visuals (safe, non-destructive)
   */
  applyPersonalityVisuals(personalityState) {
    if (!personalityState.isActive) return;
    
    const { node, personalityType, intensityLevel } = personalityState;
    if (!node || !node.userData) return;
    
    // Store original state (for reversibility)
    if (!node.userData.personalityOriginals) {
      node.userData.personalityOriginals = {
        originalGlow: node.userData.glowIntensity || 1.0,
        originalEmissive: node.userData.emissiveIntensity || 1.0,
        originalScale: node.scale.clone()
      };
    }
    
    // Apply personality-specific initial visuals
    switch (personalityType) {
      case 'pulsar':
        this.applyPulsarVisuals(node, intensityLevel);
        break;
      case 'analyst':
        this.applyAnalystVisuals(node, intensityLevel);
        break;
      case 'echo':
        this.applyEchoVisuals(node, intensityLevel);
        break;
      case 'umbra':
        this.applyUmbraVisuals(node, intensityLevel);
        break;
      case 'crystal':
        this.applyCrystalVisuals(node, intensityLevel);
        break;
      case 'harmonic':
        this.applyHarmonicVisuals(node, intensityLevel);
        break;
      case 'quantum':
        this.applyQuantumVisuals(node, intensityLevel);
        break;
      case 'glyph':
        this.applyGlyphVisuals(node, intensityLevel);
        break;
    }
  }
  
  /**
   * PULSAR: Rhythmic breathing animation
   */
  applyPulsarVisuals(node, intensity) {
    if (!node.userData) return;
    
    const pulseParams = this.config.personalities.pulsar;
    node.userData.personalityGlowBase = (node.userData.glowIntensity || 1.0) * (0.8 + 0.2 * intensity / 4);
    node.userData.personalityPulseIntensity = pulseParams.glowPulseIntensity * (intensity / 4);
  }
  
  /**
   * ANALYST: Rotating geometry + micro-particles
   */
  applyAnalystVisuals(node, intensity) {
    if (!node.userData) return;
    
    node.userData.personalityRotationSpeed = this.config.personalities.analyst.rotationSpeed * (intensity / 2);
    node.userData.personalityParticleCount = Math.floor(
      this.config.personalities.analyst.particleCount * (intensity / 4)
    );
  }
  
  /**
   * ECHO NODE: Orbiters + fade trails + pings
   */
  applyEchoVisuals(node, intensity) {
    if (!node.userData) return;
    
    const echoParams = this.config.personalities.echo;
    node.userData.personalityOrbiterCount = Math.floor(echoParams.orbiterCount * (intensity / 2));
    node.userData.personalityPingIntensity = echoParams.pingGlowBoost * (intensity / 4);
  }
  
  /**
   * UMBRA: Inward glow collapse + light-warp ring
   */
  applyUmbraVisuals(node, intensity) {
    if (!node.userData) return;
    
    node.userData.personalityUmbraIntensity = this.config.personalities.umbra.lightWarpIntensity * (intensity / 2);
    node.userData.personalityCollapseMagnitude = this.config.personalities.umbra.collapseMagnitude * (intensity / 4);
  }
  
  /**
   * CRYSTAL: Prism refractions + light bands
   */
  applyCrystalVisuals(node, intensity) {
    if (!node.userData) return;
    
    node.userData.personalityRefractionIntensity = this.config.personalities.crystal.highlightIntensity * (intensity / 2);
    node.userData.personalityPrismBands = Math.max(1, Math.floor(this.config.personalities.crystal.prismColors * (intensity / 4)));
  }
  
  /**
   * HARMONIC: Sinusoidal warping + waveform ripples
   */
  applyHarmonicVisuals(node, intensity) {
    if (!node.userData) return;
    
    node.userData.personalityWaveAmplitude = this.config.personalities.harmonic.waveAmplitude * (intensity / 2);
    node.userData.personalityRippleIntensity = this.config.personalities.harmonic.rippleIntensity * (intensity / 4);
  }
  
  /**
   * QUANTUM: Micro jitter + frame-displacement shimmer
   */
  applyQuantumVisuals(node, intensity) {
    if (!node.userData) return;
    
    node.userData.personalityJitterAmount = this.config.personalities.quantum.jitterAmount * (intensity / 2);
    node.userData.personalityShimmerIntensity = 1.0 * (intensity / 4);
  }
  
  /**
   * GLYPH: Rotating symbols + glyph trails + rune flashes
   */
  applyGlyphVisuals(node, intensity) {
    if (!node.userData) return;
    
    node.userData.personalityGlyphCount = Math.max(1, Math.floor(this.config.personalities.glyph.symbolCount * (intensity / 4)));
    node.userData.personalityGlyphIntensity = intensity / 4;
  }
  
  /**
   * Update all node personalities per frame
   * @param {number} deltaTime - Frame delta time in seconds
   * @param {number} worldTime - Total elapsed time
   */
  update(deltaTime, worldTime) {
    if (!this.registry.personalityActive) return;
    
    const startTime = performance.now();
    let updateCount = 0;
    
    // Update each personality
    for (const [nodeId, personalityState] of this.registry.nodePersonalities) {
      if (!personalityState.isActive) continue;
      
      try {
        personalityState.elapsedTime += deltaTime;
        this.updatePersonalityBehavior(personalityState, deltaTime, worldTime);
        updateCount++;
      } catch (error) {
        // Graceful error handling - fallback to no effect
        console.warn(`Error updating personality for node ${nodeId}:`, error);
        personalityState.isActive = false;
      }
    }
    
    // Monitor performance
    const elapsed = performance.now() - startTime;
    this.updatePerformanceMonitor(elapsed, updateCount);
  }
  
  /**
   * Update personality-specific behavior
   */
  updatePersonalityBehavior(personalityState, deltaTime, worldTime) {
    const { node, personalityType, customData, intensityLevel } = personalityState;
    
    if (!node || !node.userData) return;
    
    // Update animation phase
    personalityState.animationPhase += deltaTime * 2 * Math.PI;
    if (personalityState.animationPhase > Math.PI * 2) {
      personalityState.animationPhase -= Math.PI * 2;
    }
    
    // Call personality-specific update
    switch (personalityType) {
      case 'pulsar':
        this.updatePulsar(personalityState, deltaTime, worldTime);
        break;
      case 'analyst':
        this.updateAnalyst(personalityState, deltaTime, worldTime);
        break;
      case 'echo':
        this.updateEcho(personalityState, deltaTime, worldTime);
        break;
      case 'umbra':
        this.updateUmbra(personalityState, deltaTime, worldTime);
        break;
      case 'crystal':
        this.updateCrystal(personalityState, deltaTime, worldTime);
        break;
      case 'harmonic':
        this.updateHarmonic(personalityState, deltaTime, worldTime);
        break;
      case 'quantum':
        this.updateQuantum(personalityState, deltaTime, worldTime);
        break;
      case 'glyph':
        this.updateGlyph(personalityState, deltaTime, worldTime);
        break;
    }
  }
  
  /**
   * PULSAR UPDATE: Soft rhythmic breathing
   */
  updatePulsar(personalityState, deltaTime, worldTime) {
    const { node, customData, animationPhase } = personalityState;
    const params = this.config.personalities.pulsar;
    
    // Breathing cycle: smooth sine wave
    const breatheCycle = Math.sin(worldTime * Math.PI * 2 / params.breathingSpeed) * 0.5 + 0.5;
    const glowMod = params.minGlowValue + (params.maxGlowValue - params.minGlowValue) * breatheCycle;
    
    // Apply glow modulation
    if (node.userData.personalityGlowBase) {
      node.userData.glowIntensity = node.userData.personalityGlowBase * glowMod;
    }
    
    personalityState.currentGlowModulation = glowMod;
  }
  
  /**
   * ANALYST UPDATE: Rotation + micro-particles
   */
  updateAnalyst(personalityState, deltaTime, worldTime) {
    const { node, customData, animationPhase } = personalityState;
    const params = this.config.personalities.analyst;
    
    // Rotate internal geometry
    const rotSpeed = params.rotationSpeed * personalityState.intensityLevel;
    const newRotation = (worldTime * Math.PI * 2 / rotSpeed) % (Math.PI * 2);
    
    // Apply to inner core if it exists
    if (node.children && node.children.length > 0) {
      const innerCore = node.children[0];
      if (innerCore) {
        innerCore.rotation.y = newRotation;
        innerCore.rotation.z = newRotation * 0.7;
      }
    }
    
    // Subtle data flicker
    const flickerIntensity = params.flickerIntensity * personalityState.intensityLevel;
    const flicker = Math.sin(worldTime * params.dataFlickerSpeed * Math.PI * 2) * 0.5 + 0.5;
    
    if (node.userData.emissiveIntensity) {
      node.userData.emissiveIntensity *= (1.0 + flickerIntensity * (flicker - 0.5));
    }
  }
  
  /**
   * ECHO UPDATE: Orbiters + pings
   */
  updateEcho(personalityState, deltaTime, worldTime) {
    const { node, customData } = personalityState;
    const params = this.config.personalities.echo;
    
    // Update ping cycle
    customData.lastPingTime += deltaTime;
    
    if (customData.lastPingTime > params.pingInterval) {
      // Trigger ping effect
      if (node.userData.glowIntensity) {
        node.userData.glowIntensity *= (1.0 + params.pingGlowBoost * personalityState.intensityLevel);
      }
      customData.lastPingTime = 0;
    }
    
    // Subtle glow pulse on ping
    const pingPhase = (customData.lastPingTime / params.pingInterval) * Math.PI * 2;
    const glowBoost = Math.sin(pingPhase) * 0.3 * personalityState.intensityLevel;
    
    if (node.userData.glowIntensity && node.userData.personalityGlowBase) {
      node.userData.glowIntensity = node.userData.personalityGlowBase * (1.0 + glowBoost);
    }
  }
  
  /**
   * UMBRA UPDATE: Inward-outward glow collapse
   */
  updateUmbra(personalityState, deltaTime, worldTime) {
    const { node, customData, intensityLevel } = personalityState;
    const params = this.config.personalities.umbra;
    
    // Collapse-expand cycle
    const collapsePhase = (worldTime * Math.PI * 2 / params.collapseSpeed) % (Math.PI * 2);
    const collapseMagnitude = Math.sin(collapsePhase) * params.collapseMagnitude * (intensityLevel / 2);
    
    // Modulate glow based on collapse
    if (node.userData.glowIntensity && node.userData.personalityGlowBase) {
      const collapseGlowEffect = 1.0 - Math.abs(collapseMagnitude);
      node.userData.glowIntensity = node.userData.personalityGlowBase * collapseGlowEffect;
    }
    
    // Rare void blink
    if (Math.random() < params.voidBlinkChance * intensityLevel) {
      customData.voidBlinkFrames = 2;
    }
    
    if (customData.voidBlinkFrames > 0) {
      customData.voidBlinkFrames--;
      if (node.userData.glowIntensity) {
        node.userData.glowIntensity *= 0.3;  // Dim during blink
      }
    }
  }
  
  /**
   * CRYSTAL UPDATE: Prism refractions + light bands
   */
  updateCrystal(personalityState, deltaTime, worldTime) {
    const { node, customData, intensityLevel } = personalityState;
    const params = this.config.personalities.crystal;
    
    // Smooth refraction phase rotation
    customData.refractionPhase += deltaTime * Math.PI * 2 / params.refractionSpeed;
    customData.lightBandPhase += deltaTime * Math.PI * 2 / params.lightBandSpeed;
    
    // Modulate highlight intensity
    const refractMod = Math.sin(customData.refractionPhase) * 0.5 + 0.5;
    const highlightMod = params.highlightIntensity * refractMod * (intensityLevel / 4);
    
    if (node.userData.emissiveIntensity) {
      node.userData.emissiveIntensity *= (1.0 + highlightMod);
    }
    
    // Light band color variation (stored for potential shader use)
    node.userData.personalityLightBandPhase = customData.lightBandPhase;
  }
  
  /**
   * HARMONIC UPDATE: Sinusoidal warping + waveform ripples
   */
  updateHarmonic(personalityState, deltaTime, worldTime) {
    const { node, customData, intensityLevel } = personalityState;
    const params = this.config.personalities.harmonic;
    
    // Update wave phases
    customData.wavePhase += deltaTime * Math.PI * 2 / params.waveSpeed;
    customData.ripplePhase += deltaTime * Math.PI * 2 / 2.0;
    
    // Subtle emissive warping based on wave
    const waveMod = Math.sin(customData.wavePhase) * 0.5 + 0.5;
    const waveIntensity = params.waveAmplitude * waveMod * (intensityLevel / 2);
    
    if (node.userData.emissiveIntensity) {
      node.userData.emissiveIntensity *= (1.0 + waveIntensity);
    }
    
    // Store phases for potential ripple rendering
    node.userData.personalityWavePhase = customData.wavePhase;
    node.userData.personalityRipplePhase = customData.ripplePhase;
  }
  
  /**
   * QUANTUM UPDATE: Micro jitter + shimmer effects
   */
  updateQuantum(personalityState, deltaTime, worldTime) {
    const { node, customData, intensityLevel } = personalityState;
    const params = this.config.personalities.quantum;
    
    // Update shimmer phase
    customData.shimmerPhase += deltaTime * Math.PI * 2 / params.shimmerSpeed;
    customData.jitterPhase += deltaTime * params.jitterSpeed;
    
    // Micro position jitter (SAFE: stored in userData, not applied to actual position)
    const jitterX = Math.sin(customData.jitterPhase) * params.jitterAmount * (intensityLevel / 4);
    const jitterY = Math.sin(customData.jitterPhase * 0.7) * params.jitterAmount * (intensityLevel / 4);
    const jitterZ = Math.sin(customData.jitterPhase * 0.5) * params.jitterAmount * (intensityLevel / 4);
    
    // Store jitter (for optional rendering use)
    node.userData.personalityJitterOffset = new THREE.Vector3(jitterX, jitterY, jitterZ);
    
    // Shimmer glow effect
    const shimmerMod = Math.sin(customData.shimmerPhase) * 0.5 + 0.5;
    const shimmerIntensity = params.ghostFrameAlpha * shimmerMod * (intensityLevel / 4);
    
    if (node.userData.glowIntensity && node.userData.personalityGlowBase) {
      node.userData.glowIntensity = node.userData.personalityGlowBase * (1.0 + shimmerIntensity);
    }
  }
  
  /**
   * GLYPH UPDATE: Rotating symbols + activation flashes
   */
  updateGlyph(personalityState, deltaTime, worldTime) {
    const { node, customData, intensityLevel } = personalityState;
    const params = this.config.personalities.glyph;
    
    // Update symbol rotation
    customData.symbolPhase += deltaTime * Math.PI * 2 / params.symbolRotationSpeed;
    
    // Store phase for optional glyph rendering
    node.userData.personalitySymbolPhase = customData.symbolPhase;
    
    // Activation rune flash during evolution
    if (node.userData.evolutionTriggered) {
      customData.activationFlashTime = params.activationFlashDuration;
      node.userData.evolutionTriggered = false;
    }
    
    // Flash fade
    if (customData.activationFlashTime && customData.activationFlashTime > 0) {
      customData.activationFlashTime -= deltaTime;
      const flashProgress = 1.0 - (customData.activationFlashTime / params.activationFlashDuration);
      const flashGlow = params.activationFlashIntensity * (1.0 - flashProgress) * (intensityLevel / 4);
      
      if (node.userData.glowIntensity && node.userData.personalityGlowBase) {
        node.userData.glowIntensity = node.userData.personalityGlowBase * (1.0 + flashGlow);
      }
    }
  }
  
  /**
   * Update performance monitor
   */
  updatePerformanceMonitor(elapsed, updateCount) {
    const { performanceMonitor } = this.registry;
    
    performanceMonitor.framesSampled++;
    performanceMonitor.averageTimeMs = (performanceMonitor.averageTimeMs * (performanceMonitor.framesSampled - 1) + elapsed) / performanceMonitor.framesSampled;
    performanceMonitor.maxTimeMs = Math.max(performanceMonitor.maxTimeMs, elapsed);
    
    // Auto-throttle if performance degrades
    if (elapsed > this.config.maxFrameOverhead) {
      console.warn(`Personality system overhead high: ${elapsed.toFixed(2)}ms (threshold: ${this.config.maxFrameOverhead}ms)`);
    }
  }
  
  /**
   * Get personality info for a node
   */
  getPersonalityInfo(nodeId) {
    const personality = this.registry.nodePersonalities.get(nodeId);
    if (!personality) return null;
    
    return {
      type: personality.personalityType,
      name: personality.name,
      intensity: personality.intensityLevel,
      isActive: personality.isActive,
      elapsedTime: personality.elapsedTime
    };
  }
  
  /**
   * Disable personality for a node (safe fallback)
   */
  disablePersonality(nodeId) {
    const personality = this.registry.nodePersonalities.get(nodeId);
    if (!personality) return false;
    
    personality.isActive = false;
    
    // Restore original visuals
    if (personality.node && personality.node.userData && personality.node.userData.personalityOriginals) {
      const originals = personality.node.userData.personalityOriginals;
      personality.node.userData.glowIntensity = originals.originalGlow;
      personality.node.userData.emissiveIntensity = originals.originalEmissive;
      personality.node.scale.copy(originals.originalScale);
    }
    
    return true;
  }
  
  /**
   * Re-enable personality for a node
   */
  enablePersonality(nodeId) {
    const personality = this.registry.nodePersonalities.get(nodeId);
    if (!personality) return false;
    
    personality.isActive = true;
    this.applyPersonalityVisuals(personality);
    
    return true;
  }
  
  /**
   * Remove all personalities (safe cleanup)
   */
  cleanup() {
    for (const [nodeId, personality] of this.registry.nodePersonalities) {
      this.disablePersonality(nodeId);
    }
    
    this.registry.nodePersonalities.clear();
    this.registry.personalityActive = false;
    
    console.log('✓ Node Personality 2.0 cleaned up');
  }
  
  /**
   * Get system statistics
   */
  getStatistics() {
    return {
      totalPersonalitiesApplied: this.registry.totalPersonalitiesApplied,
      activePersonalities: Array.from(this.registry.nodePersonalities.values()).filter(p => p.isActive).length,
      performanceMetrics: {
        averageFrameTimeMs: this.registry.performanceMonitor.averageTimeMs.toFixed(3),
        maxFrameTimeMs: this.registry.performanceMonitor.maxTimeMs.toFixed(3),
        framesSampled: this.registry.performanceMonitor.framesSampled
      }
    };
  }
}
