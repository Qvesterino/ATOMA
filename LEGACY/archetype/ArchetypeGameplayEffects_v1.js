/**
 * ARCHETYPE GAMEPLAY EFFECTS v1.0
 * 
 * Pure JavaScript gameplay layer on top of archetype visual system.
 * Adds non-visual gameplay mechanics: node stats, link synergy, chaos propagation,
 * and dynamic archetype evolution.
 * 
 * Features:
 * - Archetype gameplay profiles (throughput, stability, synergy potential, corruption risk)
 * - Link synergy computation based on archetype compatibility
 * - Chaos/error propagation between linked nodes
 * - Dynamic archetype evolution based on gameplay state
 * - Node gameplay state tracking (corruption, stability, load)
 * - Full THREE.js safe mode compatibility (pure JS, no rendering)
 * 
 * Integration:
 * - Works with existing ArchetypeVisualDifferentiationSystem_v1
 * - Can be used by LinkPriorityDecayEngine and synergy systems
 * - Can trigger archetype switches via AINodes.switchArchetype()
 */

/**
 * ARCHETYPE GAMEPLAY PROFILES
 * 
 * Defines gameplay mechanics for each archetype based on visual traits.
 * Tags enable relationship matching (harmony, chaos, prime, error, etc.)
 */
const ARCHETYPE_GAMEPLAY_PROFILES = {
  // ══════════════════════════════════════════════════════════════════
  // CORE LAYER - Fundamental balanced archetypes
  // ══════════════════════════════════════════════════════════════════
  
  'CORE-HARMONIC-RESONANT': {
    processingThroughput: 1.0,
    stability: 0.95,
    synergyPotential: 0.85,
    corruptionRisk: 0.05,
    quantumWeirdness: 0.1,
    tags: ['harmony', 'resonance', 'balanced', 'core']
  },

  'CORE-QUANTUM-ENTANGLED': {
    processingThroughput: 1.2,
    stability: 0.65,
    synergyPotential: 0.8,
    corruptionRisk: 0.3,
    quantumWeirdness: 0.9,
    tags: ['quantum', 'superposed', 'entangled', 'core']
  },

  'CORE-CHAOS-FRACTURED': {
    processingThroughput: 1.5,
    stability: 0.4,
    synergyPotential: 0.5,
    corruptionRisk: 0.8,
    quantumWeirdness: 0.7,
    tags: ['chaos', 'entropy', 'volatile', 'core']
  },

  'CORE-STELLAR-ASCENDED': {
    processingThroughput: 0.9,
    stability: 0.9,
    synergyPotential: 0.75,
    corruptionRisk: 0.1,
    quantumWeirdness: 0.2,
    tags: ['stellar', 'radiant', 'prime', 'core']
  },

  'CORE-PRIME-PERFECT': {
    processingThroughput: 0.8,
    stability: 1.0,
    synergyPotential: 0.95,
    corruptionRisk: 0.0,
    quantumWeirdness: 0.05,
    tags: ['prime', 'perfect', 'stable', 'core']
  },

  'CORE-SHADOW-VOID': {
    processingThroughput: 0.7,
    stability: 0.3,
    synergyPotential: 0.4,
    corruptionRisk: 0.85,
    quantumWeirdness: 0.6,
    tags: ['void', 'shadow', 'umbral', 'core']
  },

  'CORE-ECHO-REFLECTION': {
    processingThroughput: 1.0,
    stability: 0.7,
    synergyPotential: 0.7,
    corruptionRisk: 0.2,
    quantumWeirdness: 0.4,
    tags: ['echo', 'reflection', 'recursive', 'core']
  },

  'CORE-NEXUS-CONVERGENCE': {
    processingThroughput: 1.1,
    stability: 0.8,
    synergyPotential: 0.9,
    corruptionRisk: 0.15,
    quantumWeirdness: 0.3,
    tags: ['nexus', 'convergence', 'hub', 'core']
  },

  'CORE-DRIFT-NOMADIC': {
    processingThroughput: 0.9,
    stability: 0.5,
    synergyPotential: 0.6,
    corruptionRisk: 0.4,
    quantumWeirdness: 0.5,
    tags: ['nomadic', 'drift', 'wandering', 'core']
  },

  'CORE-GLYPH-ARCHIVE': {
    processingThroughput: 0.8,
    stability: 0.9,
    synergyPotential: 0.7,
    corruptionRisk: 0.1,
    quantumWeirdness: 0.2,
    tags: ['archival', 'glyph', 'knowledge', 'core']
  },

  'CORE-TILT-UNSTABLE': {
    processingThroughput: 1.3,
    stability: 0.35,
    synergyPotential: 0.55,
    corruptionRisk: 0.7,
    quantumWeirdness: 0.75,
    tags: ['unstable', 'tilt', 'chaotic', 'core']
  },

  'CORE-BALANCE-EQUILIBRIUM': {
    processingThroughput: 1.0,
    stability: 0.95,
    synergyPotential: 0.8,
    corruptionRisk: 0.08,
    quantumWeirdness: 0.15,
    tags: ['balance', 'equilibrium', 'harmony', 'core']
  },

  // ══════════════════════════════════════════════════════════════════
  // OUTER LAYER - Enhanced and specialized archetypes (12 examples)
  // ══════════════════════════════════════════════════════════════════

  'OUTER-HARMONIC-APEX': {
    processingThroughput: 1.0,
    stability: 0.98,
    synergyPotential: 0.9,
    corruptionRisk: 0.02,
    quantumWeirdness: 0.08,
    tags: ['harmony', 'apex', 'prime', 'outer']
  },

  'OUTER-QUANTUM-SUPERPOSED': {
    processingThroughput: 1.4,
    stability: 0.55,
    synergyPotential: 0.85,
    corruptionRisk: 0.4,
    quantumWeirdness: 0.95,
    tags: ['quantum', 'superposed', 'outer']
  },

  'OUTER-CHAOS-MAELSTROM': {
    processingThroughput: 1.8,
    stability: 0.25,
    synergyPotential: 0.45,
    corruptionRisk: 0.9,
    quantumWeirdness: 0.85,
    tags: ['chaos', 'maelstrom', 'entropy', 'outer']
  },

  'OUTER-STELLAR-CORONA': {
    processingThroughput: 0.85,
    stability: 0.92,
    synergyPotential: 0.8,
    corruptionRisk: 0.05,
    quantumWeirdness: 0.15,
    tags: ['stellar', 'corona', 'radiant', 'outer']
  },

  'OUTER-PRIME-TRANSCENDENT': {
    processingThroughput: 0.75,
    stability: 1.0,
    synergyPotential: 0.98,
    corruptionRisk: 0.0,
    quantumWeirdness: 0.02,
    tags: ['prime', 'transcendent', 'crown', 'outer']
  },

  'OUTER-SHADOW-UMBRAL': {
    processingThroughput: 0.65,
    stability: 0.2,
    synergyPotential: 0.35,
    corruptionRisk: 0.92,
    quantumWeirdness: 0.7,
    tags: ['shadow', 'umbral', 'void', 'outer']
  },

  'OUTER-ECHO-RECURSIVE': {
    processingThroughput: 1.15,
    stability: 0.6,
    synergyPotential: 0.75,
    corruptionRisk: 0.3,
    quantumWeirdness: 0.5,
    tags: ['echo', 'recursive', 'reflection', 'outer']
  },

  'OUTER-NEXUS-OMNILATERAL': {
    processingThroughput: 1.3,
    stability: 0.85,
    synergyPotential: 0.95,
    corruptionRisk: 0.1,
    quantumWeirdness: 0.25,
    tags: ['nexus', 'omnilateral', 'hub', 'outer']
  },

  'OUTER-DRIFT-EPHEMERAL': {
    processingThroughput: 1.0,
    stability: 0.4,
    synergyPotential: 0.65,
    corruptionRisk: 0.5,
    quantumWeirdness: 0.6,
    tags: ['drift', 'ephemeral', 'nomadic', 'outer']
  },

  'OUTER-GLYPH-SEMANTIC': {
    processingThroughput: 0.9,
    stability: 0.88,
    synergyPotential: 0.75,
    corruptionRisk: 0.12,
    quantumWeirdness: 0.25,
    tags: ['glyph', 'semantic', 'knowledge', 'outer']
  },

  'OUTER-TILT-SPIRALING': {
    processingThroughput: 1.5,
    stability: 0.25,
    synergyPotential: 0.5,
    corruptionRisk: 0.8,
    quantumWeirdness: 0.85,
    tags: ['tilt', 'spiraling', 'unstable', 'outer']
  },

  'OUTER-BALANCE-DYNAMIC': {
    processingThroughput: 1.1,
    stability: 0.92,
    synergyPotential: 0.85,
    corruptionRisk: 0.1,
    quantumWeirdness: 0.2,
    tags: ['balance', 'dynamic', 'harmony', 'outer']
  },

  // ══════════════════════════════════════════════════════════════════
  // EXTREME LAYER - Intense, specialized archetypes (20+ examples)
  // ══════════════════════════════════════════════════════════════════

  'EXTREME-HARMONIC-PERFECT': {
    processingThroughput: 0.95,
    stability: 0.99,
    synergyPotential: 0.95,
    corruptionRisk: 0.01,
    quantumWeirdness: 0.05,
    tags: ['harmony', 'perfect', 'prime', 'extreme']
  },

  'EXTREME-QUANTUM-SUPERSTRING': {
    processingThroughput: 1.6,
    stability: 0.4,
    synergyPotential: 0.9,
    corruptionRisk: 0.5,
    quantumWeirdness: 0.99,
    tags: ['quantum', 'superstring', 'sigma', 'extreme']
  },

  'EXTREME-CHAOS-VOID': {
    processingThroughput: 2.0,
    stability: 0.1,
    synergyPotential: 0.3,
    corruptionRisk: 0.95,
    quantumWeirdness: 0.9,
    tags: ['chaos', 'void', 'entropy', 'error', 'extreme']
  },

  'EXTREME-STELLAR-MYTHIC': {
    processingThroughput: 0.8,
    stability: 0.95,
    synergyPotential: 0.9,
    corruptionRisk: 0.02,
    quantumWeirdness: 0.1,
    tags: ['stellar', 'mythic', 'prime', 'extreme']
  },

  'EXTREME-PRIME-ASCENDED': {
    processingThroughput: 0.7,
    stability: 1.0,
    synergyPotential: 0.99,
    corruptionRisk: 0.0,
    quantumWeirdness: 0.01,
    tags: ['prime', 'ascended', 'transcendent', 'extreme']
  },

  'EXTREME-SHADOW-OBLIVION': {
    processingThroughput: 0.5,
    stability: 0.05,
    synergyPotential: 0.2,
    corruptionRisk: 0.99,
    quantumWeirdness: 0.8,
    tags: ['shadow', 'oblivion', 'void', 'error', 'extreme']
  },

  'EXTREME-ECHO-INFINITE': {
    processingThroughput: 1.3,
    stability: 0.5,
    synergyPotential: 0.8,
    corruptionRisk: 0.4,
    quantumWeirdness: 0.6,
    tags: ['echo', 'infinite', 'recursive', 'extreme']
  },

  'EXTREME-NEXUS-SINGULARITY': {
    processingThroughput: 1.5,
    stability: 0.8,
    synergyPotential: 0.98,
    corruptionRisk: 0.15,
    quantumWeirdness: 0.3,
    tags: ['nexus', 'singularity', 'hub', 'extreme']
  },

  'EXTREME-DRIFT-TEMPORAL': {
    processingThroughput: 1.2,
    stability: 0.3,
    synergyPotential: 0.7,
    corruptionRisk: 0.6,
    quantumWeirdness: 0.75,
    tags: ['drift', 'temporal', 'nomadic', 'extreme']
  },

  'EXTREME-GLYPH-COSMIC': {
    processingThroughput: 0.85,
    stability: 0.9,
    synergyPotential: 0.85,
    corruptionRisk: 0.08,
    quantumWeirdness: 0.3,
    tags: ['glyph', 'cosmic', 'knowledge', 'extreme']
  },

  'EXTREME-TILT-SINGULAR': {
    processingThroughput: 1.8,
    stability: 0.15,
    synergyPotential: 0.4,
    corruptionRisk: 0.85,
    quantumWeirdness: 0.92,
    tags: ['tilt', 'singular', 'unstable', 'extreme']
  },

  'EXTREME-BALANCE-UNIVERSAL': {
    processingThroughput: 1.1,
    stability: 0.95,
    synergyPotential: 0.9,
    corruptionRisk: 0.05,
    quantumWeirdness: 0.15,
    tags: ['balance', 'universal', 'harmony', 'extreme']
  },

  'EXTREME-ENTROPY-CHAOTIC': {
    processingThroughput: 1.9,
    stability: 0.2,
    synergyPotential: 0.35,
    corruptionRisk: 0.92,
    quantumWeirdness: 0.88,
    tags: ['entropy', 'chaotic', 'error', 'extreme']
  },

  'EXTREME-HARMONY-PERFECT': {
    processingThroughput: 0.95,
    stability: 0.98,
    synergyPotential: 0.98,
    corruptionRisk: 0.02,
    quantumWeirdness: 0.05,
    tags: ['harmony', 'perfect', 'prime', 'extreme']
  },

  // ══════════════════════════════════════════════════════════════════
  // SPECIAL LAYER - Unique and niche archetypes (custom as needed)
  // ══════════════════════════════════════════════════════════════════

  'SPECIAL-MYTHIC-PRIME': {
    processingThroughput: 0.8,
    stability: 0.99,
    synergyPotential: 0.99,
    corruptionRisk: 0.0,
    quantumWeirdness: 0.03,
    tags: ['mythic', 'prime', 'stellar', 'special']
  },

  'SPECIAL-ERROR-GLITCH': {
    processingThroughput: 1.7,
    stability: 0.15,
    synergyPotential: 0.25,
    corruptionRisk: 0.95,
    quantumWeirdness: 0.9,
    tags: ['error', 'glitch', 'chaos', 'special']
  },

  'SPECIAL-SIGMA-QUANTUM': {
    processingThroughput: 1.5,
    stability: 0.35,
    synergyPotential: 0.85,
    corruptionRisk: 0.45,
    quantumWeirdness: 0.98,
    tags: ['sigma', 'quantum', 'anomaly', 'special']
  }
};

/**
 * ARCHETYPE GAMEPLAY EFFECTS
 * Main gameplay system for node stats, link synergy, chaos propagation
 */
export class ArchetypeGameplayEffects_v1 {
  constructor(debugMode = false) {
    this.debugMode = debugMode;
    this.archetypeGameplayProfiles = ARCHETYPE_GAMEPLAY_PROFILES;
    this.nodeGameplayState = new Map(); // nodeModel -> gameplay state
    this.evolutionCandidates = new Set(); // nodes pending evolution
    
    if (this.debugMode) {
      console.log('%c[ArchetypeGameplayEffects_v1] Initialized', 'color: #00ff00; font-weight: bold;');
      this.setupConsoleAPI();
    }
  }

  /**
   * Get gameplay profile for an archetype
   */
  getProfile(archetypeName) {
    return this.archetypeGameplayProfiles[archetypeName] || this.getDefaultProfile();
  }

  /**
   * Default profile for undefined archetypes
   */
  getDefaultProfile() {
    return {
      processingThroughput: 1.0,
      stability: 0.7,
      synergyPotential: 0.7,
      corruptionRisk: 0.2,
      quantumWeirdness: 0.3,
      tags: ['default', 'unknown']
    };
  }

  /**
   * Get or initialize gameplay state for a node
   */
  getOrCreateNodeGameplayState(nodeModel) {
    if (this.nodeGameplayState.has(nodeModel)) {
      return this.nodeGameplayState.get(nodeModel);
    }

    const state = {
      isCorrupted: false,
      corruptionLevel: 0.0,
      stability: 0.7,
      lastChaosEventTime: 0,
      chaosExposure: 0.0,
      harmonyExposure: 0.0,
      lastStabilityUpdate: performance.now(),
      evolutionTimer: 0,
      lastEvolutionCheck: performance.now(),
      processingLoad: 0.5,
      linkedNodeCount: 0
    };

    this.nodeGameplayState.set(nodeModel, state);
    return state;
  }

  /**
   * Apply gameplay state to a node (updates userData)
   */
  applyNodeGameplayState(nodeModel, deltaTime) {
    if (!nodeModel || !nodeModel.userData) return;

    const gameplayState = this.getOrCreateNodeGameplayState(nodeModel);
    const archetype = nodeModel.userData.currentArchetype || 'CORE-PRIME-PERFECT';
    const profile = this.getProfile(archetype);

    // Update stability over time (influenced by corruption and profile stability)
    const baseStability = profile.stability;
    const stabilityDrift = (baseStability - gameplayState.stability) * deltaTime * 0.5;
    gameplayState.stability = Math.max(0, Math.min(1, gameplayState.stability + stabilityDrift));

    // Decay chaos exposure
    gameplayState.chaosExposure *= (1 - deltaTime * 0.1); // Decay at 10% per second
    gameplayState.harmonyExposure *= (1 - deltaTime * 0.1);

    // Update corruption based on stability
    if (gameplayState.stability < 0.4) {
      gameplayState.corruptionLevel += deltaTime * (0.4 - gameplayState.stability) * 0.3;
    } else {
      gameplayState.corruptionLevel = Math.max(0, gameplayState.corruptionLevel - deltaTime * 0.1);
    }

    gameplayState.corruptionLevel = Math.max(0, Math.min(1, gameplayState.corruptionLevel));
    gameplayState.isCorrupted = gameplayState.corruptionLevel > 0.3;

    // Sync to userData
    if (!nodeModel.userData.gameplay) {
      nodeModel.userData.gameplay = {};
    }
    nodeModel.userData.gameplay = {
      ...nodeModel.userData.gameplay,
      ...gameplayState
    };

    // Check for evolution conditions (low frequency)
    if (performance.now() - gameplayState.lastEvolutionCheck > 3000) { // Check every 3 seconds
      this.checkEvolutionConditions(nodeModel, gameplayState, profile);
      gameplayState.lastEvolutionCheck = performance.now();
    }
  }

  /**
   * Compute synergy between two nodes based on archetypes
   */
  computeLinkSynergy(sourceNode, targetNode) {
    if (!sourceNode || !targetNode || !sourceNode.userData || !targetNode.userData) {
      return this.getNullSynergy();
    }

    const sourceArchetype = sourceNode.userData.currentArchetype || 'CORE-PRIME-PERFECT';
    const targetArchetype = targetNode.userData.currentArchetype || 'CORE-PRIME-PERFECT';

    const sourceProfile = this.getProfile(sourceArchetype);
    const targetProfile = this.getProfile(targetArchetype);

    // Compute tag compatibility
    const sourceTags = new Set(sourceProfile.tags);
    const targetTags = new Set(targetProfile.tags);
    const commonTags = [...sourceTags].filter(tag => targetTags.has(tag));
    const tagSimilarity = Math.min(1, commonTags.length * 0.3);

    // Compute synergy score
    let synergyScore = 0;

    // Harmony + harmony = high synergy
    if (sourceTags.has('harmony') && targetTags.has('harmony')) {
      synergyScore = 0.9;
    }
    // Prime + anything = stabilizing
    else if (sourceTags.has('prime') || targetTags.has('prime')) {
      synergyScore = 0.7 + tagSimilarity * 0.2;
    }
    // Chaos + chaos = high throughput but chaotic
    else if (sourceTags.has('chaos') && targetTags.has('chaos')) {
      synergyScore = 0.5;
    }
    // Chaos + harmony = mixed
    else if ((sourceTags.has('chaos') && targetTags.has('harmony')) ||
             (sourceTags.has('harmony') && targetTags.has('chaos'))) {
      synergyScore = 0.5;
    }
    // Quantum + quantum = interesting
    else if (sourceTags.has('quantum') && targetTags.has('quantum')) {
      synergyScore = 0.6;
    }
    // Sigma + quantum = special synergy
    else if ((sourceTags.has('sigma') && targetTags.has('quantum')) ||
             (sourceTags.has('quantum') && targetTags.has('sigma'))) {
      synergyScore = 0.7;
    }
    // Default based on tag similarity
    else {
      synergyScore = 0.5 + tagSimilarity * 0.2;
    }

    // Compute throughput multiplier
    const avgThroughput = (sourceProfile.processingThroughput + targetProfile.processingThroughput) / 2;
    const throughputMultiplier = 0.7 + avgThroughput * 0.3;

    // Compute stability impact
    const avgStability = (sourceProfile.stability + targetProfile.stability) / 2;
    const stabilityImpact = (avgStability - 0.5) * 0.5;

    // Compute chaos chance
    const avgCorruptionRisk = (sourceProfile.corruptionRisk + targetProfile.corruptionRisk) / 2;
    let chaosChance = avgCorruptionRisk * 0.3;

    // Error + error = very high chaos
    if (sourceTags.has('error') && targetTags.has('error')) {
      chaosChance = 0.6;
    }

    return {
      synergyScore: synergyScore,
      throughputMultiplier: throughputMultiplier,
      stabilityImpact: stabilityImpact,
      chaosChance: chaosChance,
      sourceTags: Array.from(sourceTags),
      targetTags: Array.from(targetTags)
    };
  }

  /**
   * Null synergy for invalid nodes
   */
  getNullSynergy() {
    return {
      synergyScore: 0.5,
      throughputMultiplier: 1.0,
      stabilityImpact: 0.0,
      chaosChance: 0.1,
      sourceTags: [],
      targetTags: []
    };
  }

  /**
   * Propagate chaos from source to target node
   */
  propagateChaos(sourceNode, targetNode, deltaTime) {
    if (!sourceNode || !targetNode || !sourceNode.userData || !targetNode.userData) return;

    const sourceGameplay = this.getOrCreateNodeGameplayState(sourceNode);
    const targetGameplay = this.getOrCreateNodeGameplayState(targetNode);
    const synergy = this.computeLinkSynergy(sourceNode, targetNode);

    // Increase chaos exposure on target
    targetGameplay.chaosExposure += synergy.chaosChance * deltaTime;

    // If source is corrupted, increase target's corruption risk
    if (sourceGameplay.isCorrupted) {
      targetGameplay.corruptionLevel += synergy.chaosChance * deltaTime * 0.1;
    }

    // Random chaos event based on chaosChance
    if (Math.random() < synergy.chaosChance * deltaTime) {
      this.triggerChaosEvent(targetNode, targetGameplay);
    }

    // Apply stability impact from link
    targetGameplay.stability += synergy.stabilityImpact * deltaTime * 0.1;
    targetGameplay.stability = Math.max(0, Math.min(1, targetGameplay.stability));
  }

  /**
   * Trigger a chaos/corruption event on a node
   */
  triggerChaosEvent(nodeModel, gameplayState) {
    if (!nodeModel || !gameplayState) return;

    gameplayState.lastChaosEventTime = performance.now();
    gameplayState.corruptionLevel += 0.1;

    if (this.debugMode) {
      console.log(`%c[Chaos Event] Node corrupted`, 'color: #ff4400;', {
        corruption: gameplayState.corruptionLevel,
        stability: gameplayState.stability
      });
    }

    // Mark for potential archetype switch if highly corrupted
    if (gameplayState.corruptionLevel > 0.5) {
      this.evolutionCandidates.add(nodeModel);
    }
  }

  /**
   * Check if node should evolve to different archetype
   */
  checkEvolutionConditions(nodeModel, gameplayState, profile) {
    const chaos_exposure = gameplayState.chaosExposure;
    const harmony_exposure = gameplayState.harmonyExposure;
    const stability = gameplayState.stability;
    const corruption = gameplayState.corruptionLevel;
    const linkedNodeCount = gameplayState.linkedNodeCount || 0;

    const currentArchetype = nodeModel.userData.currentArchetype || 'CORE-PRIME-PERFECT';

    // Rule 1: High chaos exposure + low stability → evolve toward chaos archetype
    if (chaos_exposure > 0.6 && stability < 0.4 && !currentArchetype.includes('CHAOS') && !currentArchetype.includes('CHAOS')) {
      this.evolveNodeToArchetype(nodeModel, 'EXTREME-ENTROPY-CHAOTIC', 'high chaos exposure');
      return;
    }

    // Rule 2: High harmony exposure + high stability → evolve toward prime/mythic
    if (harmony_exposure > 0.5 && stability > 0.8 && !currentArchetype.includes('PRIME')) {
      this.evolveNodeToArchetype(nodeModel, 'EXTREME-PRIME-ASCENDED', 'high harmony + stability');
      return;
    }

    // Rule 3: Long-term corruption with prime/harmony neighbors → gradually cleanse
    if (corruption > 0.6 && (currentArchetype.includes('SHADOW') || currentArchetype.includes('CHAOS'))) {
      if (linkedNodeCount > 0 && harmony_exposure > 0.3) {
        this.evolveNodeToArchetype(nodeModel, 'CORE-PRIME-PERFECT', 'cleansing influence');
        return;
      }
    }

    // Rule 4: Quantum exposure → evolve toward sigma/quantum
    if (profile.quantumWeirdness > 0.7 && gameplayState.stability < 0.5 && Math.random() < 0.2) {
      this.evolveNodeToArchetype(nodeModel, 'SPECIAL-SIGMA-QUANTUM', 'quantum exposure');
      return;
    }
  }

  /**
   * Evolve node to a new archetype (schedules visual transition)
   */
  evolveNodeToArchetype(nodeModel, targetArchetype, reason = '') {
    if (!nodeModel || !nodeModel.userData) return;

    const currentArchetype = nodeModel.userData.currentArchetype;

    // Avoid switching if already in transition
    if (nodeModel.userData.isInArchetypeTransition) {
      return;
    }

    if (this.debugMode) {
      console.log(`%c[Evolution] ${currentArchetype} → ${targetArchetype}`, 'color: #ffaa00; font-weight: bold;', {
        reason: reason
      });
    }

    // Mark as pending evolution and notify (will be handled by integration patch)
    nodeModel.userData.pendingArchetypeSwitch = {
      targetArchetype: targetArchetype,
      duration: 2.0,
      easing: 'easeInOutCubic',
      reason: reason
    };
  }

  /**
   * Get list of nodes with pending evolution
   */
  getPendingEvolutions() {
    const pending = [];
    this.nodeGameplayState.forEach((state, nodeModel) => {
      if (nodeModel.userData && nodeModel.userData.pendingArchetypeSwitch) {
        pending.push(nodeModel);
      }
    });
    return pending;
  }

  /**
   * Debug API setup
   */
  setupConsoleAPI() {
    if (typeof window === 'undefined') return;

    window.archetypeGameplayDebug = {
      nodeInfo: (nodeModel) => {
        if (!nodeModel || !nodeModel.userData) {
          console.log('Invalid node');
          return;
        }
        const gameplay = this.nodeGameplayState.get(nodeModel) || {};
        const archetype = nodeModel.userData.currentArchetype || 'UNKNOWN';
        const profile = this.getProfile(archetype);
        console.log('%c[Node Gameplay Info]', 'color: #00ff88; font-weight: bold;', {
          archetype: archetype,
          gameplay: gameplay,
          profile: profile
        });
      },

      linkSynergy: (sourceNode, targetNode) => {
        const synergy = this.computeLinkSynergy(sourceNode, targetNode);
        console.log('%c[Link Synergy]', 'color: #00ff88; font-weight: bold;', synergy);
      },

      forceChaos: (nodeModel) => {
        const state = this.getOrCreateNodeGameplayState(nodeModel);
        state.corruptionLevel = 0.7;
        state.isCorrupted = true;
        console.log('%c[Forced Corruption]', 'color: #ff4400;');
      },

      forcePrime: (nodeModel) => {
        const state = this.getOrCreateNodeGameplayState(nodeModel);
        state.stability = 1.0;
        state.corruptionLevel = 0.0;
        state.isCorrupted = false;
        console.log('%c[Forced Prime State]', 'color: #00ff88;');
      },

      forceEvolution: (nodeModel, targetArchetype) => {
        this.evolveNodeToArchetype(nodeModel, targetArchetype, 'debug force');
        console.log(`%c[Forced Evolution] → ${targetArchetype}`, 'color: #ffaa00;');
      },

      stats: () => {
        let corrupted = 0;
        let stable = 0;
        let transitioning = 0;
        this.nodeGameplayState.forEach((state, node) => {
          if (state.isCorrupted) corrupted++;
          if (state.stability > 0.8) stable++;
          if (node.userData?.isInArchetypeTransition) transitioning++;
        });
        console.log('%c[Gameplay Statistics]', 'color: #00ff88; font-weight: bold;', {
          totalNodes: this.nodeGameplayState.size,
          corrupted: corrupted,
          stable: stable,
          transitioning: transitioning
        });
      }
    };

    console.log('%c[ArchetypeGameplayDebug] API available: window.archetypeGameplayDebug', 'color: #ffaa00;');
  }
}

export default ArchetypeGameplayEffects_v1;
