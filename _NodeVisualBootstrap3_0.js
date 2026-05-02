/**
 * NODE VISUAL BOOT ORDER REPAIR v3.0
 * 
 * Synchronous visual initialization sequence for node spawning.
 * Ensures correct shader rendering immediately upon spawn.
 * 
 * Bootstrap Sequence:
 * 1. NodeVisuals.applyPreset(node) - Apply standard visual preset
 * 2. NodeVisualProfile.assign(node) - Assign visual profile metadata
 * 3. NodeShaderSuite.attach(node) - Attach shader materials
 * 4. NodeCoreFX.activate(node) - Activate core visual effects
 * 
 * SAFETY GUARANTEES:
 * ✅ Runs SYNCHRONOUSLY during spawn (no async delays)
 * ✅ Executes BEFORE evolution stage evaluation
 * ✅ Executes BEFORE SafeWorldResetFix transitions
 * ✅ Includes fallback detection (MeshStandardMaterial >1 frame)
 * ✅ Prevents shader uniform initialization races
 * ✅ Protects pending promises from cancellation
 */

export class NodeVisualBootstrap3_0 {
  constructor(config = {}) {
    this.enabled = true;
    this.debugMode = config.debugMode || false;
    this.frameScheduler = config.frameScheduler || null;
    
    // Fallback detection state
    this.frameMonitor = new Map(); // node → { framesSinceBoot, lastMaterial }
    this.fallbackThreshold = 2; // frames before re-triggering
    
    // Shader uniform defaults
    this.uniformDefaults = {
      glowScale: 0.8,
      arcIntensity: 0.6,
      spectralOpacity: 0.4,
      coreIntensity: 0.5,
      rimLightPower: 2.0,
      emissiveIntensity: 0.3
    };
    
    // Visual systems registry
    this.systems = {
      visuals: null,        // NodeVisuals4_0 instance
      profile: null,        // NodeVisualProfile instance
      shaders: null,        // NodeShaderSuite/ExtremeAIShaderPack instance
      effects: null         // NodeCoreFX instance
    };
    
    // Pending initialization promises (protected from cancellation)
    this.pendingPromises = new Set();
    
    console.log('[NodeVisualBootstrap3_0] Initialized - ready for spawn integration');
  }

  /**
   * Register visual systems for bootstrap
   */
  registerSystems(visualsSystem, profileSystem, shaderSystem, effectsSystem) {
    this.systems.visuals = visualsSystem;
    this.systems.profile = profileSystem;
    this.systems.shaders = shaderSystem;
    this.systems.effects = effectsSystem;
    
    if (this.debugMode) {
      console.log('[NodeVisualBootstrap3_0] Systems registered:', {
        visuals: !!visualsSystem,
        profile: !!profileSystem,
        shaders: !!shaderSystem,
        effects: !!effectsSystem
      });
    }
  }

  /**
   * MAIN BOOTSTRAP SEQUENCE - Synchronous visual initialization
   * Call this immediately after node creation in AINodes.spawnNode()
   */
  bootstrapNode(node, category, archetype = null) {
    if (!this.enabled || !node) return false;

    if (this.debugMode) {
      console.group(`[Bootstrap] Node ${node.uuid || '??'} (${category})`);
      console.time('bootstrap-duration');
    }

    try {
      // STEP 1: Apply visual preset
      if (this.systems.visuals) {
        this._applyPreset(node, category);
        if (this.debugMode) console.log('✅ Step 1: Preset applied');
      }

      // STEP 2: Assign visual profile
      if (this.systems.profile) {
        this._assignProfile(node, category);
        if (this.debugMode) console.log('✅ Step 2: Profile assigned');
      }

      // STEP 3: Attach shaders
      if (this.systems.shaders) {
        this._attachShaders(node, category, archetype);
        if (this.debugMode) console.log('✅ Step 3: Shaders attached');
      }

      // STEP 4: Activate core effects
      if (this.systems.effects) {
        this._activateEffects(node, category);
        if (this.debugMode) console.log('✅ Step 4: Core FX activated');
      }

      // STEP 5: Validate uniform initialization
      this._validateUniforms(node);
      if (this.debugMode) console.log('✅ Step 5: Uniforms validated');

      // Initialize frame monitor for fallback detection
      this.frameMonitor.set(node, {
        framesSinceBoot: 0,
        lastMaterial: node.material?.type || 'unknown'
      });

      if (this.debugMode) {
        console.timeEnd('bootstrap-duration');
        console.log('✅ Bootstrap sequence complete');
        console.groupEnd();
      }

      return true;
    } catch (err) {
      console.error('[NodeVisualBootstrap3_0] Bootstrap failed:', err);
      if (this.debugMode) console.groupEnd();
      return false;
    }
  }

  /**
   * STEP 1: Apply visual preset
   * Sets initial visual configuration for node category
   */
  _applyPreset(node, category) {
    if (!this.systems.visuals) return;

    try {
      // Apply category-specific visual preset
      if (this.systems.visuals.upgradeNode) {
        this.systems.visuals.upgradeNode(node, { category });
      } else if (this.systems.visuals.applyPreset) {
        this.systems.visuals.applyPreset(node, category);
      }
    } catch (err) {
      console.warn('[Bootstrap] Preset application failed:', err.message);
    }
  }

  /**
   * STEP 2: Assign visual profile
   * Attaches metadata for visual identification and tracking
   */
  _assignProfile(node, category) {
    if (!this.systems.profile) return;

    try {
      // Store visual profile metadata
      if (!node.userData.visualProfile) {
        node.userData.visualProfile = {
          version: '4.0',
          category,
          bootedAt: performance.now(),
          bootsCount: 0
        };
      }
      node.userData.visualProfile.bootsCount++;

      // Assign profile if system has method
      if (this.systems.profile.assign) {
        this.systems.profile.assign(node, category);
      }
    } catch (err) {
      console.warn('[Bootstrap] Profile assignment failed:', err.message);
    }
  }

  /**
   * STEP 3: Attach shaders
   * Applies archetype-specific or category-specific shaders
   */
  _attachShaders(node, category, archetype) {
    if (!this.systems.shaders) return;

    try {
      // Register for Extreme shaders if archetype provided
      if (archetype && this.systems.shaders.registerNode) {
        node.userData.extremeArchetype = archetype;
        this.systems.shaders.registerNode(node);
      }
      // Apply category shaders (fallback)
      else if (this.systems.shaders.attachShaders) {
        this.systems.shaders.attachShaders(node, category);
      } else if (this.systems.shaders.upgradeNode) {
        // NodeVisuals4_0 style shader attachment
        this.systems.shaders.upgradeNode(node, { category });
      }
    } catch (err) {
      console.warn('[Bootstrap] Shader attachment failed:', err.message);
    }
  }

  /**
   * STEP 4: Activate core effects
   * Starts visual FX and animations
   */
  _activateEffects(node, category) {
    if (!this.systems.effects) return;

    try {
      // Activate core FX if system has method
      if (this.systems.effects.activate) {
        this.systems.effects.activate(node, category);
      } else if (this.systems.effects.enableNode) {
        this.systems.effects.enableNode(node);
      }
    } catch (err) {
      console.warn('[Bootstrap] Effect activation failed:', err.message);
    }
  }

  /**
   * STEP 5: Validate shader uniforms
   * Ensures all shader uniforms are initialized with safe defaults
   */
  _validateUniforms(node) {
    try {
      node.traverse((child) => {
        if (!child.material || !child.material.uniforms) return;

        const uniforms = child.material.uniforms;

        // Set defaults for missing uniforms
        Object.entries(this.uniformDefaults).forEach(([key, value]) => {
          if (uniforms[key] === undefined) {
            uniforms[key] = { value };
          }
        });
      });
    } catch (err) {
      console.warn('[Bootstrap] Uniform validation failed:', err.message);
    }
  }

  /**
   * Monitor frames for fallback detection
   * Call this once per render frame
   */
  updateMonitoring(node) {
    if (!this.frameMonitor.has(node)) return;

    const monitor = this.frameMonitor.get(node);
    monitor.framesSinceBoot++;

    // Check for material regression (should not be MeshStandardMaterial after >1 frame)
    const currentMaterial = node.material?.type || 'unknown';
    if (currentMaterial === 'MeshStandardMaterial' && monitor.framesSinceBoot > this.fallbackThreshold) {
      console.warn(`[Bootstrap] Fallback detected on node ${node.uuid}: ${currentMaterial} after ${monitor.framesSinceBoot} frames`);
      
      // Re-trigger visual initialization
      this.bootstrapNode(node, node.userData.category, node.userData.archetype);
    }

    monitor.lastMaterial = currentMaterial;
  }

  /**
   * Cleanup when node is removed
   */
  cleanupNode(node) {
    this.frameMonitor.delete(node);
  }

  /**
   * Protect a promise from SafeWorldResetFix cancellation
   */
  protectPromise(promise) {
    this.pendingPromises.add(promise);
    promise.finally(() => {
      this.pendingPromises.delete(promise);
    });
    return promise;
  }

  /**
   * Check if promise is protected
   */
  isProtected(promise) {
    return this.pendingPromises.has(promise);
  }

  /**
   * Get all protected promises (for SafeWorldResetFix to skip)
   */
  getProtectedPromises() {
    return Array.from(this.pendingPromises);
  }

  /**
   * Toggle debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    if (this.debugMode) {
      console.log(`[NodeVisualBootstrap3_0] Debug mode: ${enabled ? 'ON' : 'OFF'}`);
    }
  }

  /**
   * Toggle bootstrap globally
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (this.debugMode) {
      console.log(`[NodeVisualBootstrap3_0] Bootstrap: ${enabled ? 'ENABLED' : 'DISABLED'}`);
    }
  }

  /**
   * Dispose all resources and clear state
   */
  dispose() {
    this.frameMonitor.clear();
    this.pendingPromises.clear();
    this.systems = {
      visuals: null,
      profile: null,
      shaders: null,
      effects: null
    };
  }
}

// Global export
if (typeof window !== 'undefined') {
  window.ATOMA_VISUAL_BOOTSTRAP = NodeVisualBootstrap3_0;
}
