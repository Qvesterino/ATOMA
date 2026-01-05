import { LinkCategoryTransitionSystem } from './LinkCategoryTransitionSystem.js';

/**
 * Link Category Transition Integration Patch
 * 
 * Wires the LinkCategoryTransitionSystem into NodeLinkingSystem for automatic
 * visual transitions when links are created. Works with all linking methods.
 * 
 * Integration points:
 * 1. Hook into link creation (createLink, autoCreateLink)
 * 2. Update transitions each frame in animate()
 * 3. Apply visual state to active link visuals
 * 4. Clean up on link removal
 * 
 * Usage in main.js:
 *   ```
 *   import { integrateLinksTransitionSystem } from './LinkCategoryTransitionIntegrationPatch.js';
 *   integrateLinksTransitionSystem(nodeLinkingSystem, scene);
 *   ```
 */

/**
 * Integrate the LinkCategoryTransitionSystem into an existing NodeLinkingSystem
 * @param {NodeLinkingSystem} linkingSystem - The system to enhance
 * @param {THREE.Scene} scene - Three.js scene
 */
export function integrateLinksTransitionSystem(linkingSystem, scene) {
  // Create and attach transition system
  const transitionSystem = new LinkCategoryTransitionSystem(scene);
  linkingSystem._transitionSystem = transitionSystem;

  // Patch 1: Hook into link creation
  const originalCreateLink = linkingSystem.createLink;
  linkingSystem.createLink = function(fromNode, toNode, options = {}) {
    // Create the link normally
    const link = originalCreateLink.call(this, fromNode, toNode, options);

    if (link && transitionSystem) {
      // Start transition for this new link
      const fromPos = fromNode.position || new (require('three')).Vector3();
      const toPos = toNode.position || new (require('three')).Vector3();
      const fromCategory = fromNode.category || 'input';
      const toCategory = toNode.category || 'input';

      transitionSystem.startTransition(
        link.id,
        fromPos,
        toPos,
        fromCategory,
        toCategory,
        {
          duration: 600,
          customOptions: options
        }
      );
    }

    return link;
  };

  // Patch 2: Hook into auto-link creation
  if (linkingSystem.autoCreateLink) {
    const originalAutoCreateLink = linkingSystem.autoCreateLink;
    linkingSystem.autoCreateLink = function(fromNode, toNode, options = {}) {
      const link = originalAutoCreateLink.call(this, fromNode, toNode, options);

      if (link && transitionSystem) {
        const fromPos = fromNode.position || new (require('three')).Vector3();
        const toPos = toNode.position || new (require('three')).Vector3();
        const fromCategory = fromNode.category || 'input';
        const toCategory = toNode.category || 'input';

        transitionSystem.startTransition(
          link.id,
          fromPos,
          toPos,
          fromCategory,
          toCategory,
          { duration: 600 }
        );
      }

      return link;
    };
  }

  // Patch 3: Hook into frame update (animate)
  const originalAnimate = linkingSystem.animate;
  linkingSystem.animate = function(deltaTime) {
    // Call original
    originalAnimate.call(this, deltaTime);

    // Update transitions
    if (transitionSystem) {
      transitionSystem.update(deltaTime);

      // Apply visual states to active links
      this._applyTransitionVisuals(transitionSystem);
    }
  };

  // Patch 4: Hook into link removal
  const originalRemoveLink = linkingSystem.removeLink;
  linkingSystem.removeLink = function(link) {
    // Stop transition before removing
    if (transitionSystem && link && link.id) {
      transitionSystem.stopTransition(link.id);
    }

    // Remove link normally
    return originalRemoveLink.call(this, link);
  };

  // Patch 5: Add helper to apply transition visuals
  linkingSystem._applyTransitionVisuals = function(transitionSystem) {
    for (const [linkId, link] of Object.entries(this.links || {})) {
      const visualState = transitionSystem.getVisualState(linkId);
      if (visualState && link.mesh) {
        // Update link mesh color
        if (link.mesh.material) {
          link.mesh.material.color.copy(visualState.color);
          link.mesh.material.opacity = visualState.opacity;
          
          // Update emissive if available
          if (link.mesh.material.emissive) {
            link.mesh.material.emissive.copy(visualState.color);
            link.mesh.material.emissiveIntensity = visualState.glowIntensity * 0.5;
          }
        }
      }
    }
  };

  // Patch 6: Clean up on disposal
  const originalDispose = linkingSystem.dispose;
  if (originalDispose) {
    linkingSystem.dispose = function() {
      if (transitionSystem) {
        transitionSystem.dispose();
      }
      return originalDispose.call(this);
    };
  }

  console.log('[LinkCategoryTransitionIntegrationPatch] ✓ Integration complete');
  return transitionSystem;
}

/**
 * Manual control: Create a transition without going through link creation
 * @param {NodeLinkingSystem} linkingSystem - The linking system
 * @param {THREE.Vector3} fromPos - Source position
 * @param {THREE.Vector3} toPos - Target position
 * @param {string} fromCategory - Source category
 * @param {string} toCategory - Target category
 * @returns {string} Transition ID
 */
export function createManualTransition(linkingSystem, fromPos, toPos, fromCategory, toCategory) {
  if (!linkingSystem._transitionSystem) {
    console.warn('[LinkCategoryTransitionIntegrationPatch] Transition system not initialized');
    return null;
  }

  const transitionId = `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  linkingSystem._transitionSystem.startTransition(
    transitionId,
    fromPos,
    toPos,
    fromCategory,
    toCategory
  );

  return transitionId;
}

/**
 * Query harmony between two categories
 * @param {NodeLinkingSystem} linkingSystem
 * @param {string} fromCategory
 * @param {string} toCategory
 * @returns {number} Harmony score 0–1
 */
export function getLinksHarmonyScore(linkingSystem, fromCategory, toCategory) {
  if (!linkingSystem._transitionSystem) {
    return 0.65; // Default
  }

  return linkingSystem._transitionSystem.getHarmonyScore(fromCategory, toCategory);
}

export default integrateLinksTransitionSystem;
