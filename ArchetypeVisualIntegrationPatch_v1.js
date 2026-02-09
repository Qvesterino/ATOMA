// === THREE SAFE LOADER (v1.1) ===
// The system must NOT crash if THREE is missing (e.g. Rosebud runtime)
// Try to import THREE safely, fallback to window/globalThis, otherwise disable features.

let THREE_SAFE = null;

// Try global THREE first (works in browser + Atoma engine immediately)
THREE_SAFE =
  (typeof window !== 'undefined' && window.THREE) ||
  (typeof globalThis !== 'undefined' && globalThis.THREE) ||
  null;

if (!THREE_SAFE) {
  console.warn('[ArchetypeVisualSystem] THREE not detected – enabling SAFE MODE (no Color, no Material edits).');
}

// Expose as THREE
const THREE = THREE_SAFE;

if (typeof window !== 'undefined') {
  window.ATOMA_DISABLE_ARCHETYPE_PATCH = true;
  console.log('[VISUAL PIPELINE] ArchetypeIntegrationPatch: DISABLED');
}

/**
 * ARCHETYPE VISUAL INTEGRATION PATCH v1.0
 * 
 * Integrates ArchetypeVisualDifferentiationSystem_v1 into the AINodes system.
 * Call this function once during initialization to enable archetype visuals.
 * 
 * Non-breaking: Works alongside existing systems
 * Safe: Validates all node state before applying
 * Modular: Can be disabled/enabled at runtime
 */

import { ArchetypeVisualDifferentiationSystem_v1 } from './ArchetypeVisualDifferentiationSystem_v1.js';
import { ArchetypeVisualProfiles } from './ArchetypeVisualProfiles_v1.js';

export function patchArchetypeVisuals(aiNodesInstance, debugMode = false) {
  if (typeof window !== 'undefined' && window.ATOMA_DISABLE_ARCHETYPE_PATCH === true) {
    return null;
  }

  if (!aiNodesInstance) {
    console.error('[ArchetypeVisualIntegrationPatch] AINodes instance required');
    return null;
  }

  // Initialize the archetype visual system
  const archetypeVisualSystem = new ArchetypeVisualDifferentiationSystem_v1(debugMode);

  // Store reference on AINodes instance
  aiNodesInstance.archetypeVisualSystem = archetypeVisualSystem;

  // Patch the createNode method
  const originalCreateNode = aiNodesInstance.createNode.bind(aiNodesInstance);
  aiNodesInstance.createNode = function(category, position, index, isSpecial) {
    // Call original method
    const nodeModel = originalCreateNode(category, position, index, isSpecial);

    // Apply archetype visual differentiation
    if (nodeModel && nodeModel.userData) {
      if (nodeModel.userData._integrationApplied === true && nodeModel.userData._integrationDirty !== true) {
        if (typeof window !== 'undefined' && window.ATOMA_DEBUG_ARCHETYPE_REAPPLY) {
          console.log('[Integration] apply skipped (already applied)', nodeModel.id || nodeModel.uuid);
        }
        return nodeModel;
      }
      // Determine archetype name
      const archetypeName = determineArchetype(this, category, index);
      
      if (archetypeName && archetypeName !== 'UNDEFINED') {
        archetypeVisualSystem.applyArchetypeToNode(nodeModel, archetypeName);
        nodeModel.userData._integrationApplied = true;
        nodeModel.userData._integrationDirty = false;
        if (typeof window !== 'undefined' && window.ATOMA_DEBUG_ARCHETYPE_REAPPLY) {
          console.log('[Integration] apply executed', nodeModel.id || nodeModel.uuid, archetypeName);
        }

        if (debugMode) {
          console.log(`%c[Integration] Applied ${archetypeName} to new node`, 'color: #00ff88;');
        }
      }
    }

    return nodeModel;
  };

  // Patch the updateNodeVisuals method to include archetype effects
  const originalUpdateNodeVisuals = aiNodesInstance.updateNodeVisuals.bind(aiNodesInstance);
  aiNodesInstance.updateNodeVisuals = function(node, data, time, deltaTime) {
    // Call original method
    originalUpdateNodeVisuals(node, data, time, deltaTime);

    // Update archetype visual effects
    if (node && archetypeVisualSystem.modifiedNodes.has(node)) {
      archetypeVisualSystem.updateArchetypeEffects(node, deltaTime, time);
    }
  };

  // Patch the update method to handle archetype effects for all nodes
  const originalUpdate = aiNodesInstance.update.bind(aiNodesInstance);
  aiNodesInstance.update = function(deltaTime, time) {
    originalUpdate(deltaTime, time);

    // Update archetype transitions (smooth visual blending)
    archetypeVisualSystem.updateTransitions(deltaTime);

    // Update archetype effects for all modified nodes
    // This ensures consistent animation even if updateNodeVisuals isn't called
    archetypeVisualSystem.getModifiedNodes().forEach(node => {
      archetypeVisualSystem.updateArchetypeEffects(node, deltaTime, time);
    });
  };

  // Add method to apply archetype to existing node
  aiNodesInstance.applyArchetype = function(nodeModel, archetypeName) {
    if (nodeModel && nodeModel.userData) {
      if (nodeModel.userData._integrationApplied === true && nodeModel.userData._integrationDirty !== true) {
        if (typeof window !== 'undefined' && window.ATOMA_DEBUG_ARCHETYPE_REAPPLY) {
          console.log('[Integration] reapply skipped (already applied)', nodeModel.id || nodeModel.uuid);
        }
        return;
      }
      archetypeVisualSystem.applyArchetypeToNode(nodeModel, archetypeName);
      if (debugMode) {
        console.log(`%c[Integration] Applied ${archetypeName} to node`, 'color: #00ff88;');
      }
      nodeModel.userData._integrationApplied = true;
      nodeModel.userData._integrationDirty = false;
      if (typeof window !== 'undefined' && window.ATOMA_DEBUG_ARCHETYPE_REAPPLY) {
        console.log('[Integration] apply executed (manual)', nodeModel.id || nodeModel.uuid, archetypeName);
      }
    }
  };

  // Add method to remove archetype
  aiNodesInstance.removeArchetype = function(nodeModel) {
    if (nodeModel) {
      archetypeVisualSystem.removeArchetypeFromNode(nodeModel);
      if (debugMode) {
        console.log(`%c[Integration] Removed archetype from node`, 'color: #ffaa00;');
      }
    }
  };

  // Add method to get archetype info
  aiNodesInstance.getArchetypeInfo = function(nodeModel) {
    return archetypeVisualSystem.getArchetypeInfo(nodeModel);
  };

  // Add method to switch archetype with smooth transition
  aiNodesInstance.switchArchetype = function(nodeModel, newArchetypeName, transitionDuration = 1.0, curveName = 'easeInOutQuad') {
    if (!nodeModel || !nodeModel.userData) {
      console.warn('[switchArchetype] Invalid node');
      return;
    }

    // Get current and target profiles
    const currentArchetype = nodeModel.userData.originalArchetype || 'CORE-HARMONIC-RESONANT';
    const fromProfile = ArchetypeVisualProfiles.getProfileForArchetype(currentArchetype);
    const toProfile = ArchetypeVisualProfiles.getProfileForArchetype(newArchetypeName);

    // Start transition
    archetypeVisualSystem.transitionEngine.startTransition(
      nodeModel,
      fromProfile,
      toProfile,
      transitionDuration,
      curveName
    );

    // Update archetype metadata after transition
    nodeModel.userData.originalArchetype = newArchetypeName;
    nodeModel.userData.archetypeProfile = toProfile;

    if (debugMode) {
      console.log(`%c[switchArchetype] Transitioning ${currentArchetype} → ${newArchetypeName} (${transitionDuration}s)`, 'color: #ffaa00;');
    }
  };

  // Setup console API
  ArchetypeVisualDifferentiationSystem_v1.setupConsoleAPI(archetypeVisualSystem);

  // Extend console API with transition commands
  if (window.archetypeVisualDebug) {
    window.archetypeVisualDebug.switch = function(node, archetypeName, duration = 1.0, curve = 'easeInOutQuad') {
      aiNodesInstance.switchArchetype(node, archetypeName, duration, curve);
      console.log(`%c✓ Switched archetype with smooth transition`, 'color: #00ff88;');
    };

    window.archetypeVisualDebug.listTransitions = function() {
      const transitions = archetypeVisualSystem.transitionEngine.getActiveTransitions();
      console.log(`%c[Transitions] Active: ${transitions.length}`, 'color: #ffaa00;', transitions);
      return transitions;
    };

    window.archetypeVisualDebug.stopTransition = function(node) {
      archetypeVisualSystem.transitionEngine.stopTransition(node);
      console.log(`%c✓ Stopped transition on node`, 'color: #ffaa00;');
    };
  }

  if (debugMode) {
    console.log('%c[ArchetypeVisualIntegrationPatch] Integration complete with Transition Engine v2.0', 'color: cyan; font-weight: bold;', {
      archetypeVisualSystem: archetypeVisualSystem,
      newMethods: ['applyArchetype', 'removeArchetype', 'getArchetypeInfo', 'switchArchetype']
    });
  }

  return archetypeVisualSystem;
}

/**
 * Determine archetype based on category and spawn index
 * Maps deterministically so same nodes always get same archetype
 */
function determineArchetype(aiNodesInstance, category, index) {
  if (!aiNodesInstance || !aiNodesInstance.extremeArchetypes) {
    return 'UNDEFINED';
  }

  // Get all archetypes for this category
  const extremeArchetypes = aiNodesInstance.extremeArchetypes;
  const archetypesForCategory = Object.entries(extremeArchetypes)
    .filter(([_, cat]) => cat === category)
    .map(([name, _]) => name);

  if (archetypesForCategory.length === 0) {
    return 'UNDEFINED';
  }

  // Use index to deterministically select archetype
  // This ensures same nodes always get same archetype
  const archetypeIndex = index % archetypesForCategory.length;
  return archetypesForCategory[archetypeIndex];
}

/**
 * Enable/disable archetype visual system at runtime
 */
export function toggleArchetypeVisuals(aiNodesInstance, enabled = true) {
  if (!aiNodesInstance || !aiNodesInstance.archetypeVisualSystem) {
    console.warn('[ArchetypeVisualIntegrationPatch] Archetype visual system not initialized');
    return;
  }

  aiNodesInstance.archetypeVisualSystemEnabled = enabled;

  if (enabled) {
    console.log('%c[Archetype Visuals] ENABLED', 'color: #00ff88; font-weight: bold;');
  } else {
    console.log('%c[Archetype Visuals] DISABLED', 'color: #ffaa00; font-weight: bold;');
  }
}
