/**
 * NODE PERSONALITY 2.0 – SAFE ALL IN EDITION
 * 
 * Gives each node a clear personality based on its archetype and metrics.
 * Drives safe, subtle visual behaviors without modifying gameplay.
 * 
 * HARD SAFETY RULES:
 * - NO modifications to AIModels.js, createNode, physics, camera, world systems
 * - All effects are purely visual and cosmetic
 * - Graceful degradation if any field is missing
 * - GPU-friendly, low-cost animations
 * - Uses existing materials/meshes only
 * 
 * PERSONALITY TYPES (10 total):
 * 1. CALM_ANALYST - High clarity + stability
 * 2. HARMONY_KEEPER - High harmony, low instability
 * 3. RADIANT_OPTIMIZER - High energy + clarity
 * 4. FRACTAL_DREAMER - High instability + decent clarity
 * 5. QUANTUM_TRICKSTER - Very high instability, low stability
 * 6. UMBRA_SENTINEL - High stability + moderate corruption
 * 7. ECHO_WANDERER - Low energy, balanced
 * 8. GLYPH_ARCHIVIST - Very high clarity
 * 9. CONVERGENCE_NEXUS - Balanced metrics
 * 10. ASCENDED_MYTHIC - Special/legendary nodes
 */

export class NodePersonalitySystem2_0 {
  constructor() {
    // Timing for different animation layers
    this.coreMotionTime = 0;      // Every frame
    this.specialFXTime = 0;       // 15Hz throttled
    this.specialFXInterval = 1 / 15; // ~67ms
    
    // Node personality registry
    this.nodePersonalities = new Map(); // uuid -> personality data
    
    // Animation state tracking
    this.animationStates = new Map(); // uuid -> state data
    
    // Phase B pilot: low-frequency interpretation gating (semantic personality decisions only)
    // Visual updates remain per-frame; interpretation cadence is throttled.
    this.interpretationInterval = 0.25; // ~4 Hz
    this.interpretationAccumulator = 0;
    
    // Performance tracking
    this.lastNodeCount = 0;
    this.performanceMode = 'normal'; // 'normal', 'reduced', 'minimal'
  }

  /**
   * Ensure personality baseline for emissive intensity is captured
   * Prevents drift by capturing baseline once per node
   */
  ensurePersonalityBaseline(node) {
    if (!node || !node.material) return;

    if (node._personalityBaselineEmissive === undefined) {
      node._personalityBaselineEmissive = node.material.emissiveIntensity ?? 0.3;
    }
  }

  /**
   * Register a node and assign its personality
   * Call this when nodes are created
   */
  registerNode(node) {
    if (!node || !node.uuid) return;

    // Get metrics (from SafeMetricsDNAIntegration1_0)
    const metrics = node.userData?.metrics;
    if (!metrics) {
      // No metrics available - skip personality
      return;
    }

    // Determine personality type from metrics
    const personality = this.determinePersonality(metrics, node);
    
    // Store in node.userData
    node.userData.personality = personality;
    
    // Store in registry for quick access
    this.nodePersonalities.set(node.uuid, {
      node,
      personality,
      lastUpdate: 0,
    });

    // Initialize animation state
    this.animationStates.set(node.uuid, {
      breathPhase: Math.random() * Math.PI * 2,
      rotationPhase: Math.random() * Math.PI * 2,
      pulsePhase: Math.random() * Math.PI * 2,
      driftPhase: Math.random() * Math.PI * 2,
      jitterPhase: 0,
      lastFlash: 0,
    });
  }

  /**
   * Determine personality type from metrics
   * Returns personality object
   */
  determinePersonality(metrics, node) {
    const { energy, stability, clarity, harmony, instability } = metrics;

    // Check for each personality type in priority order

    // 10. ASCENDED_MYTHIC (special nodes only)
    if (metrics.archetype === 'ascended' || 
        (energy >= 110 && stability >= 110 && clarity >= 110)) {
      return {
        type: 'ASCENDED_MYTHIC',
        mood: 'Transcendent',
        intensity: 1.0,
        tags: ['legendary', 'perfect', 'radiant'],
        description: 'Perfect convergence of all forces',
      };
    }

    // 1. CALM_ANALYST
    if (clarity >= 70 && stability >= 70 && instability <= 30) {
      return {
        type: 'CALM_ANALYST',
        mood: 'Serene',
        intensity: 0.6,
        tags: ['stable', 'precise', 'analytical'],
        description: 'Methodical processor of clear signals',
      };
    }

    // 2. HARMONY_KEEPER
    if (harmony >= 80 && instability <= 25) {
      return {
        type: 'HARMONY_KEEPER',
        mood: 'Peaceful',
        intensity: 0.7,
        tags: ['harmonic', 'balanced', 'cooperative'],
        description: 'Natural bridge between networks',
      };
    }

    // 3. RADIANT_OPTIMIZER
    if (energy >= 80 && clarity >= 70) {
      return {
        type: 'RADIANT_OPTIMIZER',
        mood: 'Focused',
        intensity: 0.9,
        tags: ['powerful', 'efficient', 'bright'],
        description: 'High-energy clarity processor',
      };
    }

    // 4. FRACTAL_DREAMER
    if (instability >= 75 && clarity >= 40 && clarity <= 80) {
      return {
        type: 'FRACTAL_DREAMER',
        mood: 'Imaginative',
        intensity: 0.8,
        tags: ['creative', 'complex', 'fractal'],
        description: 'Generator of infinite patterns',
      };
    }

    // 5. QUANTUM_TRICKSTER
    if (instability >= 90 && stability <= 30) {
      return {
        type: 'QUANTUM_TRICKSTER',
        mood: 'Chaotic',
        intensity: 1.0,
        tags: ['volatile', 'unpredictable', 'quantum'],
        description: 'Reality bender in superposition',
      };
    }

    // 6. UMBRA_SENTINEL
    if (stability >= 80 && instability >= 40 && instability <= 80) {
      return {
        type: 'UMBRA_SENTINEL',
        mood: 'Watchful',
        intensity: 0.5,
        tags: ['grounded', 'shadow', 'resilient'],
        description: 'Dark guardian with hidden depths',
      };
    }

    // 7. ECHO_WANDERER
    if (energy <= 50 && harmony >= 30 && harmony <= 60) {
      return {
        type: 'ECHO_WANDERER',
        mood: 'Drifting',
        intensity: 0.4,
        tags: ['soft', 'reflective', 'memory'],
        description: 'Keeper of fading resonances',
      };
    }

    // 8. GLYPH_ARCHIVIST
    if (clarity >= 85 && energy >= 60 && energy <= 80) {
      return {
        type: 'GLYPH_ARCHIVIST',
        mood: 'Studious',
        intensity: 0.7,
        tags: ['knowledge', 'precise', 'symbolic'],
        description: 'Encoded knowledge bearer',
      };
    }

    // 9. CONVERGENCE_NEXUS (balanced everything)
    const avgMetric = (energy + stability + clarity + harmony) / 4;
    const variance = Math.max(
      Math.abs(energy - avgMetric),
      Math.abs(stability - avgMetric),
      Math.abs(clarity - avgMetric),
      Math.abs(harmony - avgMetric)
    );
    
    if (variance <= 20) {
      return {
        type: 'CONVERGENCE_NEXUS',
        mood: 'Centered',
        intensity: 0.6,
        tags: ['balanced', 'versatile', 'nexus'],
        description: 'Harmonious blend of forces',
      };
    }

    // Fallback: NEUTRAL
    return {
      type: 'NEUTRAL',
      mood: 'Steady',
      intensity: 0.5,
      tags: ['standard', 'functional'],
      description: 'Standard processing node',
    };
  }

  /**
   * Main update - call from game loop
   * Handles both per-frame and throttled updates
   */
  update(deltaTime, nodes) {
    if (typeof window !== 'undefined' && window.ATOMA_VISUAL_BASELINE) return;

    if (!nodes || nodes.length === 0) return;

    // Phase B pilot: accumulate time for semantic evaluation; visuals run every frame.
    this.interpretationAccumulator += deltaTime;
    const shouldInterpret = this.interpretationAccumulator >= this.interpretationInterval;

    // Update core motion (every frame - cheap)
    this.coreMotionTime += deltaTime;
    
    // Check performance mode based on node count
    this.updatePerformanceMode(nodes.length);

    // Update all nodes
    nodes.forEach(node => {
      // Ensure node is registered
      if (!this.nodePersonalities.has(node.uuid)) {
        this.registerNode(node);
        // Registration stays immediate (not gated)
      } else if (shouldInterpret) {
        // Phase B pilot: semantic refresh cadence separated from per-frame visuals
        this.refreshPersonalityCache(node);
      }

      // Apply core motion (every frame)
      this.applyCoreMotion(node, deltaTime);
    });

    // Update special FX (throttled to 15Hz)
    this.specialFXTime += deltaTime;
    if (this.specialFXTime >= this.specialFXInterval) {
      this.specialFXTime = 0;
      
      nodes.forEach(node => {
        this.applySpecialFX(node, deltaTime);
      });
    }

    // Reset interpretation accumulator after semantic pass
    if (shouldInterpret) {
      this.interpretationAccumulator = 0;
    }
  }

  /**
   * Apply core motion (runs every frame)
   * Very cheap, simple transforms
   */
  applyCoreMotion(node, deltaTime) {
    const personality = node.userData?.personality;
    if (!personality) return;

    const state = this.animationStates.get(node.uuid);
    if (!state) return;

    try {
      // Get intensity modifier based on performance mode
      const intensityMod = this.getIntensityModifier();
      const intensity = personality.intensity * intensityMod;

      // Update animation phases
      state.breathPhase += deltaTime * 1.0;
      state.rotationPhase += deltaTime * 0.3;
      state.pulsePhase += deltaTime * 2.0;
      state.driftPhase += deltaTime * 0.5;

      // Apply personality-specific behaviors
      switch (personality.type) {
        case 'CALM_ANALYST':
          this.applyCalmAnalystMotion(node, state, intensity);
          break;
        case 'HARMONY_KEEPER':
          this.applyHarmonyKeeperMotion(node, state, intensity);
          break;
        case 'RADIANT_OPTIMIZER':
          this.applyRadiantOptimizerMotion(node, state, intensity);
          break;
        case 'FRACTAL_DREAMER':
          this.applyFractalDreamerMotion(node, state, intensity);
          break;
        case 'QUANTUM_TRICKSTER':
          this.applyQuantumTricksterMotion(node, state, intensity);
          break;
        case 'UMBRA_SENTINEL':
          this.applyUmbraSentinelMotion(node, state, intensity);
          break;
        case 'ECHO_WANDERER':
          this.applyEchoWandererMotion(node, state, intensity);
          break;
        case 'GLYPH_ARCHIVIST':
          this.applyGlyphArchivistMotion(node, state, intensity);
          break;
        case 'CONVERGENCE_NEXUS':
          this.applyConvergenceNexusMotion(node, state, intensity);
          break;
        case 'ASCENDED_MYTHIC':
          this.applyAscendedMythicMotion(node, state, intensity);
          break;
      }

    } catch (e) {
      // Fail silently - never crash
    }
  }

  /**
   * Apply special FX (runs at 15Hz)
   * More expensive effects
   */
  applySpecialFX(node, deltaTime) {
    const personality = node.userData?.personality;
    if (!personality) return;

    try {
      const intensityMod = this.getIntensityModifier();
      const intensity = personality.intensity * intensityMod;

      // Apply emissive effects if material supports it
      if (node.material && node.material.emissive) {
        this.applyEmissiveEffects(node, personality, intensity);
      }

    } catch (e) {
      // Fail silently
    }
  }

  // ========== PERSONALITY-SPECIFIC MOTION BEHAVIORS ==========

  /**
   * CALM_ANALYST: Smooth slow breathing, very slow rotation
   */
  applyCalmAnalystMotion(node, state, intensity) {
    if (!node.scale) return;

    // Slow breathing scale (±2-3%)
    const breathScale = 1.0 + Math.sin(state.breathPhase) * 0.02 * intensity;
    node.scale.setScalar(breathScale * 0.9); // 0.9 is base scale

    // Very slow Y-axis rotation
    if (node.rotation) {
      node.rotation.y += 0.0005 * intensity;
    }
  }

  /**
   * HARMONY_KEEPER: Gentle vertical bobbing, regular glow pulses
   */
  applyHarmonyKeeperMotion(node, state, intensity) {
    // Tiny vertical bobbing (±0.05 units)
    if (node.position && node.userData?.basePosition) {
      const bob = Math.sin(state.driftPhase) * 0.05 * intensity;
      node.position.y = node.userData.basePosition.y + bob;
    }

    // Gentle rotation on multiple axes
    if (node.rotation) {
      node.rotation.x += 0.0003 * intensity;
      node.rotation.y += 0.0004 * intensity;
    }
  }

  /**
   * RADIANT_OPTIMIZER: Stronger core pulsing, focus intensity
   */
  applyRadiantOptimizerMotion(node, state, intensity) {
    if (!node.scale) return;

    // Stronger pulse (±3-5%)
    const pulseScale = 1.0 + Math.sin(state.pulsePhase) * 0.04 * intensity;
    node.scale.setScalar(pulseScale * 0.9);

    // Faster rotation
    if (node.rotation) {
      node.rotation.y += 0.001 * intensity;
    }
  }

  /**
   * FRACTAL_DREAMER: Irregular twitches, shifting phases
   */
  applyFractalDreamerMotion(node, state, intensity) {
    // REMOVED: Irregular rotation twitches - performance optimization
    // Keep only smooth sinus-based breathing scale

    // Smooth scale variations (deterministic, no jitter)
    if (node.scale) {
      const scaleVar = 1.0 + Math.sin(state.breathPhase) * 0.03 * intensity;
      node.scale.setScalar(scaleVar * 0.9);
    }
  }

  /**
   * QUANTUM_TRICKSTER: REMOVED (Random jitter removed for performance)
   * 
   * QuantumTrickster now uses same deterministic motion as CALM_ANALYST
   * All random jitter effects removed to prevent GPU thrashing and FPS instability
   */
  applyQuantumTricksterMotion(node, state, intensity) {
    // REMOVED: All random jitter effects for performance optimization
    // QuantumTrickster now uses calm, deterministic motion
    if (node.scale) {
      const breathScale = 1.0 + Math.sin(state.breathPhase) * 0.02 * intensity;
      node.scale.setScalar(breathScale * 0.9);
    }
  }

  /**
   * UMBRA_SENTINEL: Minimal movement, heavy breathing
   */
  applyUmbraSentinelMotion(node, state, intensity) {
    if (!node.scale) return;

    // Very slow, heavy breathing
    const breathScale = 1.0 + Math.sin(state.breathPhase * 0.5) * 0.015 * intensity;
    node.scale.setScalar(breathScale * 0.9);

    // Almost no rotation (very slow)
    if (node.rotation) {
      node.rotation.y += 0.0002 * intensity;
    }
  }

  /**
   * ECHO_WANDERER: Slow drifting, soft movements
   */
  applyEchoWandererMotion(node, state, intensity) {
    // Slow drifting position (±0.08 units)
    if (node.position && node.userData?.basePosition) {
      const driftX = Math.sin(state.driftPhase * 0.7) * 0.08 * intensity;
      const driftZ = Math.cos(state.driftPhase * 0.5) * 0.08 * intensity;
      node.position.x = node.userData.basePosition.x + driftX;
      node.position.z = node.userData.basePosition.z + driftZ;
    }

    // Soft scale breathing
    if (node.scale) {
      const breathScale = 1.0 + Math.sin(state.breathPhase * 0.8) * 0.02 * intensity;
      node.scale.setScalar(breathScale * 0.9);
    }
  }

  /**
   * GLYPH_ARCHIVIST: Precise movements, outline effects
   */
  applyGlyphArchivistMotion(node, state, intensity) {
    // Precise, measured rotation
    if (node.rotation) {
      node.rotation.y += 0.0006 * intensity;
    }

    // Subtle scale pulse (very controlled)
    if (node.scale) {
      const pulseScale = 1.0 + Math.sin(state.pulsePhase * 1.2) * 0.018 * intensity;
      node.scale.setScalar(pulseScale * 0.9);
    }
  }

  /**
   * CONVERGENCE_NEXUS: Balanced combination of effects
   */
  applyConvergenceNexusMotion(node, state, intensity) {
    // Combine multiple subtle effects at half intensity
    const reducedIntensity = intensity * 0.5;

    // Breathing
    if (node.scale) {
      const breathScale = 1.0 + Math.sin(state.breathPhase) * 0.02 * reducedIntensity;
      node.scale.setScalar(breathScale * 0.9);
    }

    // Rotation on multiple axes
    if (node.rotation) {
      node.rotation.x += 0.0003 * reducedIntensity;
      node.rotation.y += 0.0005 * reducedIntensity;
    }
  }

  /**
   * ASCENDED_MYTHIC: Elegant, layered animations
   */
  applyAscendedMythicMotion(node, state, intensity) {
    // Multi-layered rotation
    if (node.rotation) {
      node.rotation.x += 0.0004 * intensity;
      node.rotation.y += 0.0006 * intensity;
      node.rotation.z += 0.0002 * intensity;
    }

    // Elegant scale pulse
    if (node.scale) {
      const pulseScale = 1.0 + Math.sin(state.pulsePhase * 0.8) * 0.04 * intensity;
      node.scale.setScalar(pulseScale * 0.9);
    }

    // Soft vertical drift
    if (node.position && node.userData?.basePosition) {
      const drift = Math.sin(state.driftPhase * 0.6) * 0.06 * intensity;
      node.position.y = node.userData.basePosition.y + drift;
    }
  }

  // ========== EMISSIVE EFFECTS ==========

  /**
   * Apply emissive effects based on personality
   */
  applyEmissiveEffects(node, personality, intensity) {
    if (!node.material || !node.material.emissive) return;

    try {
      ensurePersonalityBaseline(node);
      const baseIntensity = node._personalityBaselineEmissive;

      switch (personality.type) {
        case 'RADIANT_OPTIMIZER':
          // Occasional focus flash
          if (Math.random() < 0.05) {
            node.material.emissiveIntensity = Math.min(1.0, baseIntensity + 0.1);
          }
          break;

        case 'QUANTUM_TRICKSTER':
          // Random emissive jitter
          const jitter = (Math.random() - 0.5) * 0.03;
          node.material.emissiveIntensity = Math.max(0, Math.min(1.0, baseIntensity + jitter));
          break;

        case 'ASCENDED_MYTHIC':
          // Soft pulsing glow
          const pulse = Math.sin(this.coreMotionTime * 1.5) * 0.05;
          node.material.emissiveIntensity = Math.max(0, Math.min(1.0, baseIntensity + pulse));
          break;
      }
    } catch (e) {
      // Skip silently
    }
  }

  // ========== PERFORMANCE MANAGEMENT ==========

  /**
   * Update performance mode based on node count
   */
  updatePerformanceMode(nodeCount) {
    this.lastNodeCount = nodeCount;

    if (nodeCount > 100) {
      this.performanceMode = 'minimal';
    } else if (nodeCount > 50) {
      this.performanceMode = 'reduced';
    } else {
      this.performanceMode = 'normal';
    }
  }

  /**
   * Get intensity modifier based on performance mode
   */
  getIntensityModifier() {
    switch (this.performanceMode) {
      case 'minimal': return 0.3;
      case 'reduced': return 0.6;
      default: return 1.0;
    }
  }

  // ========== UTILITY METHODS ==========

  /**
   * Get personality for a node
   */
  getPersonality(node) {
    return node?.userData?.personality || null;
  }

  /**
   * Get status report
   */
  getStatus() {
    return {
      registeredNodes: this.nodePersonalities.size,
      performanceMode: this.performanceMode,
      nodeCount: this.lastNodeCount,
      intensityModifier: this.getIntensityModifier(),
    };
  }

  /**
   * Phase B pilot: semantic refresh hook (runs at gated cadence)
   * Maintains cached personality timestamps without altering behavior.
   */
  refreshPersonalityCache(node) {
    const entry = this.nodePersonalities.get(node.uuid);
    if (!entry) return;
    entry.lastUpdate = performance.now();
  }

  /**
   * Reset system (on world transition)
   */
  reset() {
    this.nodePersonalities.clear();
    this.animationStates.clear();
    this.coreMotionTime = 0;
    this.specialFXTime = 0;
    this.interpretationAccumulator = this.interpretationInterval; // Force immediate evaluation on next update
  }

  /**
   * Cleanup a specific node
   */
  cleanupNode(node) {
    if (!node) return;
    this.nodePersonalities.delete(node.uuid);
    this.animationStates.delete(node.uuid);
  }
}
