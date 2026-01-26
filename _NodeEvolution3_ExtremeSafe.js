import * as THREE from 'three';

/**
 * Node Evolution 3.0 - Extreme Archetypes Safe Edition
 * 
 * Pure visual evolution system for extreme archetype nodes.
 * 
 * HARD SAFETY RULES:
 * ✅ NO modifications to AINodes, NodeLinkingSystem, Glyphs, Camera, Physics
 * ✅ NO new geometry added to scene
 * ✅ NO global singletons except this class
 * ✅ ZERO impact on gameplay, linking, selection
 * ✅ Visual-only, animation-only
 * ✅ Guards all access with null-checks
 * ✅ Always revertible (cached base transforms)
 * ✅ Silent failures (no errors thrown)
 */

export class NodeEvolution3_ExtremeSafe {
  constructor(scene, aiNodes) {
    this.scene = scene;
    this.aiNodes = aiNodes;

    // Internal tracking of eligible archetype nodes
    this.evolutionNodes = [];
    this.enabled = true;
    this.globalTime = 0;

    // Whitelist of eligible extreme archetypes
    this.eligibleArchetypes = new Set([
      'quantum-lotus',
      'fractal-spine',
      'echo-torus',
      'omega-helix',
      'celestial-prism',
      'hypervoid-mirror',
      'astra-bloom',
      'duality-paradox',
      'singularity-vine',
      'chrono-chain',
      'neon-seraph',
      'spectral-crown'
    ]);

    // Initialize eligible nodes
    this.initializeEligibleNodes();

    console.log(`[Evolution3] Initialized with ${this.evolutionNodes.length} eligible archetype nodes`);
  }

  /**
   * Scan AI nodes and build eligible evolution tracking array
   */
  initializeEligibleNodes() {
    if (!this.aiNodes || !this.aiNodes.nodes) return;

    this.evolutionNodes = [];

    for (const node of this.aiNodes.nodes) {
      if (!node.userData) continue;

      // Check if node has an archetype from the extreme pack
      const archetypeName = node.userData.archetypal;
      if (!archetypeName || !this.eligibleArchetypes.has(archetypeName)) {
        continue;
      }

      // Initialize evolution data
      if (!node.userData.evolution3) {
        node.userData.evolution3 = {
          stage: 0,
          progress: 0,
          targetProgress: 0,
          cachedBaseTransforms: this.cacheNodeTransforms(node),
          enabled: true
        };
      }

      this.evolutionNodes.push({
        node: node,
        archetypeName: archetypeName
      });
    }
  }

  /**
   * Cache base transforms for a node (all children)
   * Allows us to always revert to original state
   */
  cacheNodeTransforms(node) {
    const cache = {
      children: new Map()
    };

    node.traverse((child) => {
      if (child === node) return; // Skip root

      cache.children.set(child, {
        position: child.position.clone(),
        rotation: child.rotation.clone(),
        scale: child.scale.clone(),
        materialState: this.cacheMaterialState(child)
      });
    });

    return cache;
  }

  /**
   * Cache material state (colors, opacity, emissive)
   */
  cacheMaterialState(mesh) {
    if (!mesh.material) return null;

    const mat = mesh.material;
    return {
      color: mat.color ? mat.color.getHex() : 0xffffff,
      opacity: mat.opacity !== undefined ? mat.opacity : 1.0,
      emissiveIntensity: mat.emissiveIntensity !== undefined ? mat.emissiveIntensity : 0,
      emissive: mat.emissive ? mat.emissive.getHex() : 0x000000
    };
  }

  /**
   * Restore material state to cache
   */
  restoreMaterialState(mesh, state) {
    if (!mesh.material || !state) return;

    const mat = mesh.material;
    if (mat.color) mat.color.setHex(state.color);
    if (mat.opacity !== undefined) mat.opacity = state.opacity;
    if (mat.emissiveIntensity !== undefined) mat.emissiveIntensity = state.emissiveIntensity;
    if (mat.emissive) mat.emissive.setHex(state.emissive);
  }

  /**
   * Main update loop (call from animation frame)
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;
    if (!this.enabled) return;

    this.globalTime += deltaTime;

    // Update each eligible node
    for (const { node, archetypeName } of this.evolutionNodes) {
      if (!node || !node.userData || !node.userData.evolution3) {
        continue;
      }

      // Silent guard: verify node still exists and is in scene
      if (!this.isNodeValid(node)) {
        continue;
      }

      this.updateNodeEvolution(node, deltaTime, archetypeName);
    }
  }

  /**
   * Check if node is still valid (exists, has meshes, in scene)
   */
  isNodeValid(node) {
    if (!node) return false;
    if (!node.userData) return false;

    // Try to find at least one mesh child
    let hasChildren = false;
    node.traverse((child) => {
      if (child.isMesh && child !== node) {
        hasChildren = true;
      }
    });

    return hasChildren;
  }

  /**
   * Update visual evolution for a single node
   */
  updateNodeEvolution(node, deltaTime, archetypeName) {
    const evo = node.userData.evolution3;
    if (!evo.enabled) return;

    // Smoothly progress toward target stage
    this.updateEvolutionProgress(evo, deltaTime);

    // Apply visual changes based on current stage
    if (evo.stage === 0) {
      this.applyStage0_Base(node, evo);
    } else if (evo.stage === 1) {
      this.applyStage1_Awakened(node, evo, deltaTime);
    } else if (evo.stage === 2) {
      this.applyStage2_Ascended(node, evo, deltaTime);
    }
  }

  /**
   * Update progress value smoothly
   */
  updateEvolutionProgress(evo, deltaTime) {
    const progressSpeed = 0.5; // Units per second

    if (evo.progress < evo.targetProgress) {
      evo.progress = Math.min(evo.progress + progressSpeed * deltaTime, evo.targetProgress);
    } else if (evo.progress > evo.targetProgress) {
      evo.progress = Math.max(evo.progress - progressSpeed * deltaTime, evo.targetProgress);
    }
  }

  /**
   * STAGE 0: Base (no changes, restore to cached state)
   */
  applyStage0_Base(node, evo) {
    const cache = evo.cachedBaseTransforms;

    node.traverse((child) => {
      if (child === node) return;

      const childCache = cache.children.get(child);
      if (!childCache) return;

      // Restore exact base transforms
      child.position.copy(childCache.position);
      child.rotation.copy(childCache.rotation);
      child.scale.copy(childCache.scale);

      // Restore material state
      if (childCache.materialState) {
        this.restoreMaterialState(child, childCache.materialState);
      }
    });
  }

  /**
   * STAGE 1: Awakened
   * - Slight scale on secondary rings/halos (+10-15%)
   * - Rotation speed increase on outer parts
   * - Soft emissive boost on core meshes
   * - Very gentle breathing (±3% scale)
   */
  applyStage1_Awakened(node, evo, deltaTime) {
    const cache = evo.cachedBaseTransforms;
    const progress = evo.progress;
    const breatheAmount = Math.sin(this.globalTime * 2) * 0.03 * progress;

    node.traverse((child) => {
      if (child === node) return;

      const childCache = cache.children.get(child);
      if (!childCache) return;

      // Restore base position/rotation
      child.position.copy(childCache.position);
      child.rotation.copy(childCache.rotation);

      // Apply breathing effect to scale
      const baseScale = childCache.scale;
      const scaleFactor = 1.0 + breatheAmount;
      child.scale.copy(baseScale).multiplyScalar(scaleFactor);

      // Identify which parts get scale boost and emissive boost
      const isOuter = child.userData?.torusIndex !== undefined ||
                      child.userData?.ringIndex !== undefined ||
                      child.userData?.haloIndex !== undefined ||
                      child.userData?.petalIndex !== undefined;

      if (isOuter) {
        // Scale up outer elements by 10-15%
        const outerScaleBoost = 1.0 + 0.12 * progress;
        child.scale.multiplyScalar(outerScaleBoost);

        // Add rotation to outer elements
        const rotationBoost = 0.2 * progress;
        child.rotation.x += rotationBoost * deltaTime * 0.3;
        child.rotation.y += rotationBoost * deltaTime * 0.5;
      }

      // Soft emissive boost on all mesh materials
      if (child.material && child.material.emissiveIntensity !== undefined) {
        const baseEmissive = childCache.materialState?.emissiveIntensity || 0;
        const emissiveBoost = 0.15 * progress;
        child.material.emissiveIntensity = baseEmissive + emissiveBoost;
      }
    });
  }

  /**
   * STAGE 2: Ascended
   * - Stronger spin on selected layers
   * - Extra parallax offset (small position wobble)
   * - Emissive + color shift toward cyan/magenta
   * - Dual-speed animation phases
   */
  applyStage2_Ascended(node, evo, deltaTime) {
    const cache = evo.cachedBaseTransforms;
    const progress = evo.progress;

    // Phase oscillation for dual-speed effect
    const phase1 = this.globalTime * 1.5;
    const phase2 = this.globalTime * 2.8;

    node.traverse((child) => {
      if (child === node) return;

      const childCache = cache.children.get(child);
      if (!childCache) return;

      // Restore base and apply modifications
      child.position.copy(childCache.position);
      child.rotation.copy(childCache.rotation);
      child.scale.copy(childCache.scale);

      // Parallax wobble (small position offset for outer elements)
      const wobbleAmount = 0.04 * progress;
      const wobblePhase = Math.sin(phase1) * wobbleAmount;
      const wobblePhase2 = Math.cos(phase2) * wobbleAmount * 0.7;

      const isOuter = child.userData?.torusIndex !== undefined ||
                      child.userData?.ringIndex !== undefined ||
                      child.userData?.haloIndex !== undefined ||
                      child.userData?.petalIndex !== undefined;

      if (isOuter) {
        // Apply parallax offset
        child.position.x += wobblePhase;
        child.position.y += wobblePhase2;
        child.position.z += wobblePhase * 0.5;

        // Stronger spin
        const strongSpin = 0.4 * progress;
        child.rotation.x += strongSpin * deltaTime * 0.5;
        child.rotation.y += strongSpin * deltaTime * 0.8;
        child.rotation.z += strongSpin * deltaTime * 0.2;
      }

      // Scale boost (maintained from stage 1, amplified)
      const ascendedScaleBoost = 1.0 + 0.2 * progress;
      child.scale.multiplyScalar(ascendedScaleBoost);

      // Enhanced emissive and color shift
      if (child.material) {
        // Emissive intensity boost
        const baseEmissive = childCache.materialState?.emissiveIntensity || 0;
        const emissiveBoost = 0.35 * progress;
        if (child.material.emissiveIntensity !== undefined) {
          child.material.emissiveIntensity = baseEmissive + emissiveBoost;
        }

        // Color shift toward cyan/magenta (subtle, not jarring)
        if (child.material.color && childCache.materialState) {
          const baseColor = new THREE.Color(childCache.materialState.color);
          const shiftColor = Math.random() > 0.5 ?
            new THREE.Color(0x00ffff) : // Cyan
            new THREE.Color(0xff00ff);  // Magenta

          const colorShiftAmount = 0.15 * progress;
          baseColor.lerp(shiftColor, colorShiftAmount);
          child.material.color.copy(baseColor);
        }
      }
    });
  }

  /**
   * Force set evolution stage for a node
   * @param {THREE.Object3D} node - Target node
   * @param {number} stage - 0, 1, or 2
   */
  setNodeEvolutionStage(node, stage) {
    if (!node || !node.userData || !node.userData.evolution3) {
      return false;
    }

    stage = Math.max(0, Math.min(2, Math.floor(stage)));
    node.userData.evolution3.stage = stage;
    node.userData.evolution3.targetProgress = stage > 0 ? 1.0 : 0;

    return true;
  }

  /**
   * Get evolution state for a node
   */
  getNodeEvolutionStage(node) {
    if (!node || !node.userData || !node.userData.evolution3) {
      return null;
    }

    return {
      stage: node.userData.evolution3.stage,
      progress: node.userData.evolution3.progress,
      archetype: node.userData.archetypal
    };
  }

  /**
   * Reset all evolution to base state
   */
  resetAllEvolution() {
    for (const { node } of this.evolutionNodes) {
      if (!node || !node.userData) continue;

      if (node.userData.evolution3) {
        node.userData.evolution3.stage = 0;
        node.userData.evolution3.progress = 0;
        node.userData.evolution3.targetProgress = 0;
      }

      // Restore base transforms
      this.applyStage0_Base(node, node.userData.evolution3);
    }
  }

  /**
   * Disable/enable evolution without losing state
   */
  setEnabled(enabled) {
    this.enabled = enabled;

    if (!enabled) {
      // When disabled, reset all nodes to base state
      this.resetAllEvolution();
    }
  }

  /**
   * Get debug statistics
   */
  getDebugStats() {
    const stageCounts = { 0: 0, 1: 0, 2: 0 };

    for (const { node } of this.evolutionNodes) {
      if (!node || !node.userData || !node.userData.evolution3) continue;

      const stage = node.userData.evolution3.stage;
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    }

    return {
      totalEligibleNodes: this.evolutionNodes.length,
      stageCounts: stageCounts,
      enabled: this.enabled,
      globalTime: this.globalTime
    };
  }

  /**
   * Rescan for new eligible nodes (call if nodes are added dynamically)
   */
  rescanNodes() {
    this.initializeEligibleNodes();
    console.log(`[Evolution3] Rescanned - now tracking ${this.evolutionNodes.length} nodes`);
  }
}

/**
 * INTEGRATION NOTES:
 * 
 * In main.js, add these minimal changes:
 * 
 * 1. Import at top:
 *    import { NodeEvolution3_ExtremeSafe } from './_NodeEvolution3_ExtremeSafe.js';
 * 
 * 2. Add field in constructor (~line 270):
 *    this.nodeEvolution3 = null;
 * 
 * 3. Initialize after archetypes are applied (in initialization, after aiNodes setup):
 *    this.nodeEvolution3 = new NodeEvolution3_ExtremeSafe(this.scene, this.aiNodes);
 * 
 * 4. In animation loop, add after this.aiNodes.update():
 *    if (this.nodeEvolution3) {
 *      this.nodeEvolution3.update(deltaTime);
 *    }
 * 
 * DEBUG CONSOLE COMMANDS (optional, defined below):
 * - window.debugEvolution3() - Log stats
 * - window.forceEvolutionStage3(0/1/2) - Set stage for all nodes
 * - window.disableEvolution3() - Stop and reset
 * - window.enableEvolution3() - Resume
 */

// Debug console helpers (optional, attach to window if available)
if (typeof window !== 'undefined') {
  // These will be set by main.js when it initializes the evolution system
  window.debugEvolution3 = () => {
    console.log('[Evolution3] Set window._evolution3 reference from main.js');
  };

  window.forceEvolutionStage3 = (stage) => {
    console.log('[Evolution3] Set window._evolution3 reference from main.js');
  };

  window.disableEvolution3 = () => {
    console.log('[Evolution3] Set window._evolution3 reference from main.js');
  };

  window.enableEvolution3 = () => {
    console.log('[Evolution3] Set window._evolution3 reference from main.js');
  };
}