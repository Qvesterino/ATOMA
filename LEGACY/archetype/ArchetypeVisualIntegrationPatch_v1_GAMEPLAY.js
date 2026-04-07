/**
 * ARCHETYPE VISUAL + GAMEPLAY INTEGRATION PATCH v1.1
 * 
 * Enhanced integration of both ArchetypeVisualDifferentiationSystem_v1 and
 * ArchetypeGameplayEffects_v1 into the AINodes system.
 * 
 * Features:
 * - Visual differentiation (colors, animations, particles, glow)
 * - Gameplay mechanics (node stats, link synergy, chaos propagation, evolution)
 * - Smooth archetype transitions with visual + gameplay sync
 * - Dynamic evolution based on gameplay state
 * - Non-breaking: Fully compatible with existing systems
 * - Safe: Validates all state before applying
 * 
 * Integration Points:
 * - Patches createNode() for visual + gameplay initialization
 * - Patches update() for visual effects + gameplay updates
 * - Patches linking system (optional) for synergy calculations
 * - Provides archetype evolution API
 */

let THREE_SAFE = null;
THREE_SAFE =
  (typeof window !== 'undefined' && window.THREE) ||
  (typeof globalThis !== 'undefined' && globalThis.THREE) ||
  null;

if (!THREE_SAFE) {
  console.warn('[ArchetypeVisualGameplayPatch] THREE not detected – enabling SAFE MODE.');
}

const THREE = THREE_SAFE;

import { ArchetypeVisualDifferentiationSystem_v1 } from './ArchetypeVisualDifferentiationSystem_v1.js';
import { ArchetypeGameplayEffects_v1 } from './ArchetypeGameplayEffects_v1.js';
import { ArchetypeVisualProfiles } from './ArchetypeVisualProfiles_v1.js';

/**
 * Patch AINodes with both visual and gameplay archetype systems
 */
export function patchArchetypeVisualGameplay(aiNodesInstance, debugMode = false) {
  if (!aiNodesInstance) {
    console.error('[ArchetypeVisualGameplayPatch] AINodes instance required');
    return null;
  }

  // Initialize both systems
  const archetypeVisualSystem = new ArchetypeVisualDifferentiationSystem_v1(debugMode);
  const archetypeGameplaySystem = new ArchetypeGameplayEffects_v1(debugMode);

  // Store references on AINodes instance
  aiNodesInstance.archetypeVisualSystem = archetypeVisualSystem;
  aiNodesInstance.archetypeGameplay = archetypeGameplaySystem;

  if (debugMode) {
    console.log('%c[ArchetypeVisualGameplayPatch] Initializing integrated visual + gameplay system', 
      'color: #00ff00; font-weight: bold;');
  }

  // ═══════════════════════════════════════════════════════════════════
  // PATCH 1: createNode - Initialize visual + gameplay on node creation
  // ═══════════════════════════════════════════════════════════════════
  const originalCreateNode = aiNodesInstance.createNode.bind(aiNodesInstance);
  aiNodesInstance.createNode = function(category, position, index, isSpecial) {
    const nodeModel = originalCreateNode(category, position, index, isSpecial);

    if (nodeModel && nodeModel.userData) {
      const archetypeName = determineArchetype(this, category, index);
      
      if (archetypeName && archetypeName !== 'UNDEFINED') {
        // Apply visual differentiation
        archetypeVisualSystem.applyArchetypeToNode(nodeModel, archetypeName);

        // Initialize gameplay state
        const gameplayState = archetypeGameplaySystem.getOrCreateNodeGameplayState(nodeModel);
        const profile = archetypeGameplaySystem.getProfile(archetypeName);
        
        // Set initial gameplay values from profile
        gameplayState.stability = profile.stability;
        gameplayState.corruptionLevel = 0.0;
        gameplayState.isCorrupted = false;

        // Store archetype for gameplay reference
        nodeModel.userData.currentArchetype = archetypeName;

        if (debugMode) {
          console.log(`%c[Integration] Created ${archetypeName}`, 'color: #00ff88;', {
            stability: profile.stability,
            throughput: profile.processingThroughput
          });
        }
      }
    }

    return nodeModel;
  };

  // ═══════════════════════════════════════════════════════════════════
  // PATCH 2: update - Process visual + gameplay effects each frame
  // ═══════════════════════════════════════════════════════════════════
  const originalUpdate = aiNodesInstance.update.bind(aiNodesInstance);
  aiNodesInstance.update = function(deltaTime, time) {
    originalUpdate(deltaTime, time);

    // Update visual transitions
    archetypeVisualSystem.updateTransitions(deltaTime);
    archetypeVisualSystem.getModifiedNodes().forEach(node => {
      archetypeVisualSystem.updateArchetypeEffects(node, deltaTime, time);
    });

    // Update gameplay state for all nodes
    if (this.nodes) {
      this.nodes.forEach(node => {
        archetypeGameplaySystem.applyNodeGameplayState(node, deltaTime);
      });
    }

    // Process pending archetype evolution
    const pendingEvolutions = archetypeGameplaySystem.getPendingEvolutions();
    pendingEvolutions.forEach(node => {
      if (node.userData && node.userData.pendingArchetypeSwitch) {
        const switchData = node.userData.pendingArchetypeSwitch;
        
        // Avoid switching during existing transition
        if (!node.userData.isInArchetypeTransition) {
          aiNodesInstance.switchArchetype(
            node,
            switchData.targetArchetype,
            switchData.duration,
            switchData.easing
          );
          
          // Mark as transitioned
          node.userData.isInArchetypeTransition = true;
          node.userData.currentArchetype = switchData.targetArchetype;
          
          delete node.userData.pendingArchetypeSwitch;

          if (debugMode) {
            console.log(`%c[Evolution] Applied pending switch to ${switchData.targetArchetype}`, 
              'color: #ffaa00;', switchData.reason);
          }
        }
      }
    });

    // Mark transitions as complete after duration
    archetypeVisualSystem.transitionEngine.activeTransitions.forEach((transition, node) => {
      if (transition.elapsed >= transition.duration && !transition.completedMarked) {
        node.userData.isInArchetypeTransition = false;
        transition.completedMarked = true;
      }
    });
  };

  // ═══════════════════════════════════════════════════════════════════
  // PATCH 3: createNodeConnections - Propagate chaos over links
  // ═══════════════════════════════════════════════════════════════════
  const originalCreateNodeConnections = aiNodesInstance.createNodeConnections?.bind(aiNodesInstance);
  if (originalCreateNodeConnections) {
    aiNodesInstance.createNodeConnections = function() {
      originalCreateNodeConnections();

      // Track linked node counts for evolution conditions
      if (this.nodes) {
        this.nodes.forEach(node => {
          const gameplayState = archetypeGameplaySystem.getOrCreateNodeGameplayState(node);
          // Count linked nodes
          gameplayState.linkedNodeCount = node.userData?.connections?.length || 0;
        });
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // PATCH 4: Core API Methods - Archetype switching and querying
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Apply archetype to existing node
   */
  aiNodesInstance.applyArchetype = function(nodeModel, archetypeName) {
    if (nodeModel && nodeModel.userData) {
      archetypeVisualSystem.applyArchetypeToNode(nodeModel, archetypeName);
      nodeModel.userData.currentArchetype = archetypeName;
      
      const profile = archetypeGameplaySystem.getProfile(archetypeName);
      const gameplayState = archetypeGameplaySystem.getOrCreateNodeGameplayState(nodeModel);
      gameplayState.stability = profile.stability;
      gameplayState.corruptionLevel = 0.0;

      if (debugMode) {
        console.log(`%c[applyArchetype] Applied ${archetypeName}`, 'color: #00ff88;');
      }
    }
  };

  /**
   * Remove archetype from node
   */
  aiNodesInstance.removeArchetype = function(nodeModel) {
    if (nodeModel) {
      archetypeVisualSystem.removeArchetypeFromNode(nodeModel);
      nodeModel.userData.currentArchetype = 'CORE-PRIME-PERFECT';
      
      if (debugMode) {
        console.log(`%c[removeArchetype] Removed archetype`, 'color: #ffaa00;');
      }
    }
  };

  /**
   * Get archetype info (visual)
   */
  aiNodesInstance.getArchetypeInfo = function(nodeModel) {
    return archetypeVisualSystem.getArchetypeInfo(nodeModel);
  };

  /**
   * Switch archetype with smooth transition (visual + gameplay sync)
   */
  aiNodesInstance.switchArchetype = function(nodeModel, newArchetypeName, transitionDuration = 1.0, curveName = 'easeInOutQuad') {
    if (!nodeModel || !nodeModel.userData) {
      console.warn('[switchArchetype] Invalid node');
      return;
    }

    const currentArchetype = nodeModel.userData.originalArchetype || 'CORE-HARMONIC-RESONANT';
    const fromProfile = ArchetypeVisualProfiles.getProfileForArchetype(currentArchetype);
    const toProfile = ArchetypeVisualProfiles.getProfileForArchetype(newArchetypeName);

    // Start visual transition
    archetypeVisualSystem.transitionEngine.startTransition(
      nodeModel,
      fromProfile,
      toProfile,
      transitionDuration,
      curveName
    );

    // Update metadata
    nodeModel.userData.originalArchetype = newArchetypeName;
    nodeModel.userData.archetypeProfile = toProfile;
    nodeModel.userData.currentArchetype = newArchetypeName;

    // Sync gameplay profile to new archetype
    const gameplayState = archetypeGameplaySystem.getOrCreateNodeGameplayState(nodeModel);
    const newProfile = archetypeGameplaySystem.getProfile(newArchetypeName);
    
    // Smoothly transition gameplay stability toward new profile baseline
    gameplayState.targetStability = newProfile.stability;

    if (debugMode) {
      console.log(`%c[switchArchetype] Transitioning ${currentArchetype} → ${newArchetypeName} (${transitionDuration}s)`, 
        'color: #ffaa00; font-weight: bold;');
    }
  };

  /**
   * Get gameplay profile for node
   */
  aiNodesInstance.getGameplayProfile = function(nodeModel) {
    if (!nodeModel || !nodeModel.userData) return null;
    const archetype = nodeModel.userData.currentArchetype || 'CORE-PRIME-PERFECT';
    return archetypeGameplaySystem.getProfile(archetype);
  };

  /**
   * Get gameplay state for node
   */
  aiNodesInstance.getGameplayState = function(nodeModel) {
    if (!nodeModel) return null;
    return archetypeGameplaySystem.getOrCreateNodeGameplayState(nodeModel);
  };

  // ═══════════════════════════════════════════════════════════════════
  // OPTIONAL: Integration with link systems (if they exist)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Compute link synergy (for LinkPriorityDecayEngine, etc.)
   * Can be called: aiNodesInstance.computeLinkSynergy(sourceNode, targetNode)
   */
  aiNodesInstance.computeLinkSynergy = function(sourceNode, targetNode) {
    return archetypeGameplaySystem.computeLinkSynergy(sourceNode, targetNode);
  };

  /**
   * Propagate chaos over a link (call per-frame for active links)
   */
  aiNodesInstance.propagateLinkChaos = function(sourceNode, targetNode, deltaTime) {
    archetypeGameplaySystem.propagateChaos(sourceNode, targetNode, deltaTime);
  };

  /**
   * Force node evolution to specific archetype
   */
  aiNodesInstance.forceArchetypeEvolution = function(nodeModel, targetArchetype, reason = 'manual') {
    if (nodeModel && nodeModel.userData) {
      archetypeGameplaySystem.evolveNodeToArchetype(nodeModel, targetArchetype, reason);
      
      if (debugMode) {
        console.log(`%c[forceEvolution] Scheduled ${nodeModel.userData.currentArchetype} → ${targetArchetype}`, 
          'color: #ffaa00;');
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // Setup console debugging APIs
  // ═══════════════════════════════════════════════════════════════════

  // Setup visual debug API
  ArchetypeVisualDifferentiationSystem_v1.setupConsoleAPI?.(archetypeVisualSystem);

  // Extend with transition commands
  if (typeof window !== 'undefined' && window.archetypeVisualDebug) {
    window.archetypeVisualDebug.switch = function(node, archetypeName, duration = 1.0, curve = 'easeInOutQuad') {
      aiNodesInstance.switchArchetype(node, archetypeName, duration, curve);
      console.log(`%c✓ Switched archetype`, 'color: #00ff88;');
    };

    window.archetypeVisualDebug.listTransitions = function() {
      const transitions = archetypeVisualSystem.transitionEngine.getActiveTransitions?.() || [];
      console.log(`%c[Transitions] Active: ${transitions.length}`, 'color: #ffaa00;', transitions);
      return transitions;
    };

    window.archetypeVisualDebug.stopTransition = function(node) {
      archetypeVisualSystem.transitionEngine.stopTransition?.(node);
      console.log(`%c✓ Stopped transition`, 'color: #ffaa00;');
    };
  }

  // Setup gameplay debug API (merges with or creates window.archetypeGameplayDebug)
  // Already done by ArchetypeGameplayEffects_v1 constructor
  // Just extend it with AINodes-specific methods
  if (typeof window !== 'undefined' && window.archetypeGameplayDebug) {
    const originalGameplayDebug = window.archetypeGameplayDebug;

    window.archetypeGameplayDebug.nodeProfile = function(node) {
      const profile = aiNodesInstance.getGameplayProfile(node);
      console.log('%c[Gameplay Profile]', 'color: #00ff88; font-weight: bold;', profile);
      return profile;
    };

    window.archetypeGameplayDebug.nodeState = function(node) {
      const state = aiNodesInstance.getGameplayState(node);
      console.log('%c[Gameplay State]', 'color: #00ff88; font-weight: bold;', state);
      return state;
    };

    window.archetypeGameplayDebug.propagateChaos = function(sourceNode, targetNode, deltaTime = 0.016) {
      aiNodesInstance.propagateLinkChaos(sourceNode, targetNode, deltaTime);
      console.log('%c[Chaos Propagated]', 'color: #ff4400;');
    };

    window.archetypeGameplayDebug.forceEvolution = function(node, targetArchetype) {
      aiNodesInstance.forceArchetypeEvolution(node, targetArchetype, 'debug');
      console.log(`%c[Forced Evolution] → ${targetArchetype}`, 'color: #ffaa00;');
    };
  }

  if (debugMode) {
    console.log('%c[ArchetypeVisualGameplayPatch] Integration complete', 'color: #00ff00; font-weight: bold;', {
      visualSystem: archetypeVisualSystem,
      gameplaySystem: archetypeGameplaySystem,
      newMethods: [
        'applyArchetype',
        'removeArchetype',
        'getArchetypeInfo',
        'switchArchetype',
        'getGameplayProfile',
        'getGameplayState',
        'computeLinkSynergy',
        'propagateLinkChaos',
        'forceArchetypeEvolution'
      ]
    });
  }

  return {
    visualSystem: archetypeVisualSystem,
    gameplaySystem: archetypeGameplaySystem
  };
}

/**
 * Determine archetype based on category and spawn index
 * (Same logic as original patch)
 */
function determineArchetype(aiNodesInstance, category, index) {
  if (!aiNodesInstance || !aiNodesInstance.extremeArchetypes) {
    return 'UNDEFINED';
  }

  const extremeArchetypes = aiNodesInstance.extremeArchetypes;
  const archetypesForCategory = Object.entries(extremeArchetypes)
    .filter(([_, cat]) => cat === category)
    .map(([name, _]) => name);

  if (archetypesForCategory.length === 0) {
    return 'UNDEFINED';
  }

  // Deterministic selection: use category + index as seed
  const selectedIndex = (index + category.charCodeAt(0)) % archetypesForCategory.length;
  return archetypesForCategory[selectedIndex];
}

export default patchArchetypeVisualGameplay;
