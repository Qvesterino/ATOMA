/**
 * ============================================================================
 * PERSONALITY SHADER BRIDGE v1.0 – Phase 3c Week 3
 * ============================================================================
 * GPU-side shader integration for personality-driven visual effects.
 * 
 * PURPOSE:
 * - Bridges CPU-side personality signals to GPU shader uniforms
 * - Enables subtle GPU-side visual effects (emissive, tinting, noise)
 * - Maintains 100% backward compatibility with existing shaders
 * - Safe, reversible, non-destructive augmentation layer
 * 
 * RESPONSIBILITY:
 * - Read personalityVisual + visualMetrics from nodes
 * - Bind data to shader uniforms via onBeforeCompile hooks
 * - Update uniforms each frame based on personality state
 * - Never modify core shader logic
 * - Handle missing/invalid data gracefully
 * - Performance: <2ms for 200 nodes
 * 
 * SIGNALS READ:
 * - node.userData.personalityVisual (5 signals: clarity, resonance, entropy, focus, corruption)
 * - node.userData.visualMetrics (5 metrics: stability, harmony, energy, quality, load)
 * - link.userData.visualGlow (optional: glowIntensity, qualityNorm, corruptionPulse)
 * 
 * UNIFORMS CREATED:
 * Per-node uniforms (personality signals):
 *   uClarity, uResonance, uEntropy, uFocus, uCorruption
 *   uEnergy, uQuality (from visual metrics)
 * 
 * Per-link uniforms (glow/quality):
 *   uLinkGlow, uLinkQuality, uLinkCorruption
 * 
 * INTEGRATION:
 * const bridge = new PersonalityShaderBridge_v1(scene, aiNodes);
 * 
 * UPDATE LOOP (every frame, AFTER PersonalityVFXLayer_v1.update()):
 * bridge.update(deltaTime);
 * 
 * SAFETY:
 * - onBeforeCompile hooks are idempotent (safe to call multiple times)
 * - All uniforms clamped 0–1 (no NaN/Infinity)
 * - Graceful degradation if personality data missing
 * - No permanent material modifications
 * - No shader logic rewriting
 * 
 * ============================================================================
 */

import * as THREE from 'three';

// Private symbol to track patched materials - prevents repeated shader compilation
const PERSONALITY_BRIDGE_PATCHED = Symbol('personalityBridgePatched');

export class PersonalityShaderBridge_v1 {
  /**
   * Initialize the shader bridge
   * @param {THREE.Scene} scene - Three.js scene
   * @param {AINodes} aiNodes - Reference to AINodes system
   * @param {Object} options - Configuration options
   */
  constructor(scene, aiNodes, options = {}) {
    this.scene = scene;
    this.aiNodes = aiNodes;
    
    // Configuration
    this.config = {
      enableDebug: options.enableDebug ?? false,
      enableWarnings: options.enableWarnings ?? false,
      
      // Target node mesh names (common patterns from codebase)
      nodeVisualNames: [
        'NodeVisual', 'NodeCore', 'NodeShell', 'node_visual',
        'core', 'shell', 'mesh'
      ],
      
      // Material check interval (scan for new meshes every N frames)
      meshScanInterval: 30,
      
      // Uniform value smoothing (lerp factor for smooth transitions)
      uniformLerpFactor: options.uniformLerpFactor ?? 0.2,
      zeroEpsilon: options.zeroEpsilon ?? 0.001
    };
    
    // Internal state
    this.materialMap = new Map();        // material → uniform data
    this.nodeMeshMap = new Map();        // node ID → mesh references
    this.linkMeshMap = new Map();        // link ID → mesh references
    this.hookInstallCount = 0;           // tracks installed hooks
    this.lastMeshScanFrame = 0;
    
    // Statistics
    this.stats = {
      updateCount: 0,
      meshesUpdated: 0,
      uniformsUpdated: 0,
      missingPersonalityData: 0,
      averageTimeMs: 0,
      totalTimeMs: 0,
      hooksInstalled: 0,
      lastUpdateMs: 0,
      trackedNodeMeshes: 0,
      trackedLinkMeshes: 0,
      activeNodeSignals: 0,
      activeLinkSignals: 0,
      dormantNodeSignals: 0,
      dormantLinkSignals: 0,
      activeNodeMaterials: 0,
      activeLinkMaterials: 0,
      personalityUniformMaterials: 0,
      linkUniformMaterials: 0
    };
    
    if (this.config.enableDebug) {
      console.log('[PersonalityShaderBridge_v1] Initialized ✓');
    }
  }

  /**
   * Main update loop – run once per frame AFTER PersonalityVFXLayer_v1
   * @param {number} deltaTime - Frame delta time (seconds)
   */
  update(deltaTime) {
    if (this.frameScheduler && typeof this.frameScheduler.shouldRunVisual === 'function') {
      if (!this.frameScheduler.shouldRunVisual()) return;
    }

    const startTime = performance.now();
    
    try {
      this.stats.meshesUpdated = 0;
      this.stats.uniformsUpdated = 0;
      this.stats.missingPersonalityData = 0;
      this.stats.activeNodeSignals = 0;
      this.stats.activeLinkSignals = 0;
      this.stats.dormantNodeSignals = 0;
      this.stats.dormantLinkSignals = 0;
      this.stats.activeNodeMaterials = 0;
      this.stats.activeLinkMaterials = 0;

      // Periodically scan for new meshes in scene
      if (this.stats.updateCount % this.config.meshScanInterval === 0) {
        this._scanSceneForMeshes();
      }
      
      // Update uniforms for all tracked nodes
      if (this.aiNodes?.nodes) {
        for (const node of this.aiNodes.nodes) {
          const meshes = this.nodeMeshMap.get(node.id);
          if (!meshes || meshes.length === 0) continue;

          const pv = node.userData?.personalityVisual || null;
          const vm = node.userData?.visualMetrics || null;
          const hasSignal = this._hasPersonalitySignal(pv, vm);
          let updatedAnyMesh = false;
          for (const mesh of meshes) {
            if (this._updateNodeUniforms(node, mesh, deltaTime, pv, vm, hasSignal)) {
              updatedAnyMesh = true;
            }
          }
          if (updatedAnyMesh) {
            this.stats.activeNodeSignals++;
          } else {
            this.stats.dormantNodeSignals++;
          }
        }
      }
      
      // Update uniforms for all tracked links (optional)
      if (this.linkMeshMap.size > 0 && this.aiNodes?.links) {
        for (const link of this.aiNodes.links) {
          const meshes = this.linkMeshMap.get(link.id);
          if (!meshes || meshes.length === 0) continue;

          const visualGlow = link.userData?.visualGlow || null;
          const hasSignal = this._hasLinkSignal(visualGlow);
          let updatedAnyMesh = false;
          for (const mesh of meshes) {
            if (this._updateLinkUniforms(link, mesh, deltaTime, visualGlow, hasSignal)) {
              updatedAnyMesh = true;
            }
          }
          if (updatedAnyMesh) {
            this.stats.activeLinkSignals++;
          } else {
            this.stats.dormantLinkSignals++;
          }
        }
      }
      
      this.stats.updateCount++;
      
      // Track timing
      const elapsed = performance.now() - startTime;
      this.stats.lastUpdateMs = elapsed;
      this.stats.totalTimeMs += elapsed;
      this.stats.averageTimeMs = this.stats.totalTimeMs / this.stats.updateCount;
      
      if (this.config.enableDebug && this.stats.updateCount % 120 === 0) {
        console.log(
          `[PersonalityShaderBridge_v1] Update #${this.stats.updateCount} ` +
          `(${elapsed.toFixed(2)}ms avg, ${this.stats.uniformsUpdated} uniforms)`
        );
      }
    } catch (err) {
      if (this.config.enableWarnings) {
        console.warn('[PersonalityShaderBridge_v1] Update error:', err);
      }
    }
  }

  /**
   * Scan scene for node/link meshes and set up material hooks
   * @private
   */
  _scanSceneForMeshes() {
    try {
      const nodes = this.aiNodes?.nodes || [];
      let trackedNodeMeshes = 0;
      let personalityUniformMaterials = 0;
      
      for (const node of nodes) {
        if (!node.visualObject) continue;
        
        // Find meshes in the node's visual object
        const meshes = [];
        this._collectMeshes(node.visualObject, meshes);
        
        if (meshes.length > 0) {
          this.nodeMeshMap.set(node.id, meshes);
          trackedNodeMeshes += meshes.length;
          
          // Ensure material hooks are installed
          for (const mesh of meshes) {
            personalityUniformMaterials += this._ensureMaterialHook(mesh);
          }
        }
      }

      this.stats.trackedNodeMeshes = trackedNodeMeshes;
      this.stats.trackedLinkMeshes = this._countTrackedMeshes(this.linkMeshMap);
      this.stats.personalityUniformMaterials = personalityUniformMaterials;
      this.stats.linkUniformMaterials = 0;
    } catch (err) {
      if (this.config.enableWarnings) {
        console.warn('[PersonalityShaderBridge_v1] Mesh scan error:', err);
      }
    }
  }

  /**
   * Recursively collect THREE.Mesh objects from a node
   * @private
   */
  _collectMeshes(object, meshes) {
    if (object instanceof THREE.Mesh) {
      meshes.push(object);
    }
    if (object.children) {
      for (const child of object.children) {
        this._collectMeshes(child, meshes);
      }
    }
  }

  /**
   * Ensure a material has a shader hook installed (idempotent)
   * @private
   */
  _ensureMaterialHook(mesh) {
    if (!mesh?.material) return 0;
    
    const material = mesh.material;
    
    // Skip if already patched (material-level guard)
    if (material[PERSONALITY_BRIDGE_PATCHED]) {
      return 1;
    }
    
    // Initialize material data storage
    if (!material.userData) {
      material.userData = {};
    }
    if (!material.userData.personalityUniforms) {
      material.userData.personalityUniforms = {
        uClarity: { value: 0 },
        uResonance: { value: 0 },
        uEntropy: { value: 0 },
        uFocus: { value: 0 },
        uCorruption: { value: 0 },
        uEnergy: { value: 0 },
        uQuality: { value: 0 }
      };
    }
    
    // Track for link uniforms too
    if (!material.userData.linkUniforms) {
      material.userData.linkUniforms = {
        uLinkGlow: { value: 0 },
        uLinkQuality: { value: 0 },
        uLinkCorruption: { value: 0 }
      };
    }
    
    // Store material in map
    this.materialMap.set(material, {
      material,
      lastPersonalityValues: {},
      lastLinkValues: {}
    });
    
    // Install onBeforeCompile hook (only once per material)
    if (material.onBeforeCompile) {
      const originalHook = material.onBeforeCompile;
      material.onBeforeCompile = (shader, renderer) => {
        // Call original hook first
        originalHook(shader, renderer);
        
        // Add our personality uniforms to the shader
        if (!shader.uniforms) {
          shader.uniforms = {};
        }
        
        // Merge personality uniforms into shader
        Object.assign(shader.uniforms, material.userData.personalityUniforms);
        Object.assign(shader.uniforms, material.userData.linkUniforms);
      };
    } else {
      // Install new hook if none exists
      material.onBeforeCompile = (shader, renderer) => {
        if (!shader.uniforms) {
          shader.uniforms = {};
        }
        
        // Add our uniforms
        Object.assign(shader.uniforms, material.userData.personalityUniforms);
        Object.assign(shader.uniforms, material.userData.linkUniforms);
      };
    }
    
    // Mark as patched
    material[PERSONALITY_BRIDGE_PATCHED] = true;
    this.stats.hooksInstalled++;
    
    if (this.config.enableDebug) {
      console.log(`[PersonalityShaderBridge_v1] Shader hook installed on material`);
    }

    return 1;
  }

  /**
   * Update node uniforms based on personality signals and visual metrics
   * @private
   */
  _updateNodeUniforms(node, mesh, deltaTime, personalityVisual = null, visualMetrics = null, hasSignal = false) {
    if (!mesh?.material) return;
    
    const material = mesh.material;
    const pv = personalityVisual || {};
    const vm = visualMetrics || {};
    
    // Get or create uniform map entry
    let entry = this.materialMap.get(material);
    if (!entry) {
      entry = {
        material,
        lastPersonalityValues: {},
        lastLinkValues: {}
      };
      this.materialMap.set(material, entry);
    }

    if (!hasSignal && !this._entryHasPersonalityActivity(entry.lastPersonalityValues)) {
      this.stats.missingPersonalityData++;
      return false;
    }
    
    // Apply personality uniforms with smoothing
    this._applyPersonalityUniforms(
      material.userData.personalityUniforms,
      pv,
      vm,
      entry.lastPersonalityValues,
      deltaTime
    );
    
    this.stats.uniformsUpdated++;
    this.stats.meshesUpdated++;
    this.stats.activeNodeMaterials++;
    return true;
  }

  /**
   * Update link uniforms (optional – for future link visual effects)
   * @private
   */
  _updateLinkUniforms(link, mesh, deltaTime, visualGlow = null, hasSignal = false) {
    if (!mesh?.material) return;
    
    const material = mesh.material;
    
    const entry = this.materialMap.get(material) || {
      material,
      lastPersonalityValues: {},
      lastLinkValues: {}
    };

    if (!hasSignal && !this._entryHasLinkActivity(entry.lastLinkValues)) {
      return false;
    }
    
    // Apply link uniforms
    this._applyLinkUniforms(
      material.userData.linkUniforms,
      visualGlow || {},
      entry.lastLinkValues,
      deltaTime
    );
    
    this.stats.uniformsUpdated++;
    this.stats.activeLinkMaterials++;
    return true;
  }

  /**
   * Apply personality signal uniforms to shader
   * @private
   */
  _applyPersonalityUniforms(uniforms, personalityVisual, visualMetrics, lastValues, deltaTime) {
    if (!uniforms) return;
    
    // Map personality signals to uniforms with clamping
    const newValues = {
      uClarity: this._clamp01(personalityVisual.clarityBoost ?? 0),
      uResonance: this._clamp01(personalityVisual.resonanceBoost ?? 0),
      uEntropy: this._clamp01(personalityVisual.entropyPenalty ?? 0),
      uFocus: this._clamp01(personalityVisual.focusShift ?? 0),
      uCorruption: this._clamp01(personalityVisual.corruptionSignal ?? 0),
      uEnergy: this._clamp01(visualMetrics.energyNorm ?? 0),
      uQuality: this._clamp01(visualMetrics.qualityNorm ?? 0)
    };
    
    // Apply smoothing via lerp (optional, controlled by config)
    const lerpFactor = this.config.uniformLerpFactor;
    
    for (const [key, newValue] of Object.entries(newValues)) {
      if (!uniforms[key]) {
        uniforms[key] = { value: 0 };
      }
      
      const lastValue = lastValues[key] ?? 0;
      const smoothValue = THREE.MathUtils.lerp(lastValue, newValue, lerpFactor);
      
      uniforms[key].value = smoothValue;
      lastValues[key] = smoothValue;
    }
  }

  /**
   * Apply link glow uniforms to shader
   * @private
   */
  _applyLinkUniforms(uniforms, visualGlow, lastValues, deltaTime) {
    if (!uniforms) return;
    
    const newValues = {
      uLinkGlow: this._clamp01(visualGlow.glowIntensity ?? 0),
      uLinkQuality: this._clamp01(visualGlow.qualityNorm ?? 0),
      uLinkCorruption: this._clamp01(visualGlow.corruptionPulse ?? 0)
    };
    
    const lerpFactor = this.config.uniformLerpFactor;
    
    for (const [key, newValue] of Object.entries(newValues)) {
      if (!uniforms[key]) {
        uniforms[key] = { value: 0 };
      }
      
      const lastValue = lastValues[key] ?? 0;
      const smoothValue = THREE.MathUtils.lerp(lastValue, newValue, lerpFactor);
      
      uniforms[key].value = smoothValue;
      lastValues[key] = smoothValue;
    }
  }

  /**
   * Clamp value to 0–1 range safely (no NaN/Infinity)
   * @private
   */
  _clamp01(value) {
    if (typeof value !== 'number' || !isFinite(value)) {
      return 0;
    }
    return Math.max(0, Math.min(1, value));
  }

  /**
   * Get current statistics
   */
  getStats() {
    return {
      ...this.stats,
      materialCount: this.materialMap.size,
      nodeTracking: this.nodeMeshMap.size,
      linkTracking: this.linkMeshMap.size,
      linkEffectsRuntimeStatus: this.linkMeshMap.size > 0 ? 'tracked' : 'dormant-unwired',
      effectsPackRuntimeStatus: this._resolveEffectsPackStatus(),
    };
  }

  _hasPersonalitySignal(personalityVisual, visualMetrics) {
    const epsilon = this.config.zeroEpsilon;
    const pv = personalityVisual || {};
    const vm = visualMetrics || {};
    return (
      Math.abs(pv.clarityBoost ?? 0) > epsilon ||
      Math.abs(pv.resonanceBoost ?? 0) > epsilon ||
      Math.abs(pv.entropyPenalty ?? 0) > epsilon ||
      Math.abs(pv.focusShift ?? 0) > epsilon ||
      Math.abs(pv.corruptionSignal ?? 0) > epsilon ||
      Math.abs(vm.energyNorm ?? 0) > epsilon ||
      Math.abs(vm.qualityNorm ?? 0) > epsilon
    );
  }

  _hasLinkSignal(visualGlow) {
    const epsilon = this.config.zeroEpsilon;
    const glow = visualGlow || {};
    return (
      Math.abs(glow.glowIntensity ?? 0) > epsilon ||
      Math.abs(glow.qualityNorm ?? 0) > epsilon ||
      Math.abs(glow.corruptionPulse ?? 0) > epsilon
    );
  }

  _entryHasPersonalityActivity(lastValues = {}) {
    const epsilon = this.config.zeroEpsilon;
    return (
      Math.abs(lastValues.uClarity ?? 0) > epsilon ||
      Math.abs(lastValues.uResonance ?? 0) > epsilon ||
      Math.abs(lastValues.uEntropy ?? 0) > epsilon ||
      Math.abs(lastValues.uFocus ?? 0) > epsilon ||
      Math.abs(lastValues.uCorruption ?? 0) > epsilon ||
      Math.abs(lastValues.uEnergy ?? 0) > epsilon ||
      Math.abs(lastValues.uQuality ?? 0) > epsilon
    );
  }

  _entryHasLinkActivity(lastValues = {}) {
    const epsilon = this.config.zeroEpsilon;
    return (
      Math.abs(lastValues.uLinkGlow ?? 0) > epsilon ||
      Math.abs(lastValues.uLinkQuality ?? 0) > epsilon ||
      Math.abs(lastValues.uLinkCorruption ?? 0) > epsilon
    );
  }

  _countTrackedMeshes(meshMap) {
    let total = 0;
    for (const meshes of meshMap.values()) {
      total += Array.isArray(meshes) ? meshes.length : 0;
    }
    return total;
  }

  _resolveEffectsPackStatus() {
    const effectsPack = typeof globalThis !== 'undefined' ? globalThis.game?.personalityShaderEffects : null;
    if (!effectsPack) return 'missing';
    if (effectsPack.runtimeStatus) return effectsPack.runtimeStatus;
    if (effectsPack.enabled === false) return 'dormant';
    return 'active';
  }

  /**
   * Clear all cached material references (for world reset/cleanup)
   */
  clearCache() {
    this.materialMap.clear();
    this.nodeMeshMap.clear();
    this.linkMeshMap.clear();
    
    if (this.config.enableDebug) {
      console.log('[PersonalityShaderBridge_v1] Cache cleared ✓');
    }
  }

  /**
   * Dispose the bridge (cleanup on world transition)
   */
  dispose() {
    this.clearCache();
    this.stats = {
      updateCount: 0,
      meshesUpdated: 0,
      uniformsUpdated: 0,
      missingPersonalityData: 0,
      averageTimeMs: 0,
      totalTimeMs: 0,
      hooksInstalled: 0
    };
    
    if (this.config.enableDebug) {
      console.log('[PersonalityShaderBridge_v1] Disposed ✓');
    }
  }
}
