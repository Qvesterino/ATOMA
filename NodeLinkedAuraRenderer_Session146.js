/**
 * NodeLinkedAuraRenderer_Session146.js
 * ============================================================================
 * VISIBLE NODE-LINKED AURA RENDERER
 * 
 * Creates dynamic, noise-driven aura meshes around nodes that react to
 * existing aura metadata without adding gameplay logic.
 * 
 * FEATURES:
 * - Torn/irregular translucent mesh per node
 * - Noise-driven vertex displacement (flame-like, NOT fire)
 * - Gray-white neutral color
 * - Reacts to harmony/corruption state
 * - Reacts to cascade hints (tighter silhouette)
 * - Brief intensity boost on link creation
 * - Geometry pooling for efficiency
 * - Renderer-only (zero gameplay impact)
 * 
 * DATA INPUTS (reads existing metadata):
 * - node._auraCoherenceBias (temporal coherence)
 * - node._waveInfluence (resonance wave influence)
 * - node._precastHintStrength (visual hint strength)
 * - node.justLinked (boolean, short-lived)
 * - node.harmony (state property)
 * - node.corruption (state property)
 * 
 * CONSTRAINTS:
 * ❌ NO new game state
 * ❌ NO particle effects
 * ❌ NO glow or colors (neutral gray-white only)
 * ❌ NO gameplay modifications
 * 
 * @author VFX Technical Director — ATOMA Project Session 146 Extended
 * @version 1.0.0
 */

import * as THREE from 'three';
import { createNodeAuraMaterial, createAuraGeometry } from './shaders/NodeAuraShader.js';

export class NodeLinkedAuraRenderer_Session146 {
  /**
   * Constructor
   * @param {THREE.Scene} scene - Three.js scene
   * @param {Object} aiNodes - AI nodes container (map or object)
   * @param {Object} config - Configuration
   */
  constructor(scene, aiNodes, config = {}) {
    this.scene = scene;
    this.aiNodes = aiNodes;
    
    this.config = {
      // Aura visuals
      baseRadius: config.baseRadius ?? 1.2,
      baseDisplacement: config.baseDisplacement ?? 0.3,
      noiseScale: config.noiseScale ?? 2.0,
      timeScale: config.timeScale ?? 0.5,
      baseOpacity: config.baseOpacity ?? 0.25,
      
      // Behavior
      linkBoostDuration: config.linkBoostDuration ?? 0.7,    // Seconds
      linkBoostIntensity: config.linkBoostIntensity ?? 1.8,   // Multiplier
      harmonyInfluence: config.harmonyInfluence ?? 0.8,       // Smoothness
      corruptionInfluence: config.corruptionInfluence ?? 1.2, // Roughness
      
      // Performance & safety
      enabled: config.enabled ?? false,
      debugMode: config.debugMode ?? false,
      maxAurasPerFrame: config.maxAurasPerFrame ?? 100,
      meshSubdivisions: config.meshSubdivisions ?? 2,
    };
    
    // Global time for shader
    this.globalTime = 0;
    
    // Per-node aura data
    // nodeId → { mesh, material, linkBoostTime, lastHarmony, lastCorruption }
    this.nodeAuras = new Map();
    
    // Geometry & material pools
    this.geometryPool = [];
    this.materialPool = [];
    
    // Statistics
    this.stats = {
      activeAuras: 0,
      updatesPerFrame: 0,
      lastUpdateTime: 0,
    };
    
    this.init();
  }

  /**
   * Initialize renderer (create pools)
   */
  init() {
    // Pre-allocate geometry and material pools
    const poolSize = 10;
    
    for (let i = 0; i < poolSize; i++) {
      this.geometryPool.push(createAuraGeometry(this.config.baseRadius, this.config.meshSubdivisions));
      this.materialPool.push(createNodeAuraMaterial({
        baseDisplacement: this.config.baseDisplacement,
        baseOpacity: this.config.baseOpacity,
      }));
    }
    
    if (this.config.debugMode) {
      console.log(`[NodeAuraRenderer] Initialized with ${poolSize} pooled geometries and materials`);
    }
  }

  /**
   * Update all aura meshes (called per frame)
   * @param {number} deltaTime - Delta time in seconds
   */
  update(deltaTime) {
    if (!this.config.enabled || !this.aiNodes) {
      return;
    }
    
    const startTime = performance.now();
    this.globalTime += deltaTime;
    
    // Get node container (works with Map or object)
    let nodeArray = [];
    if (this.aiNodes instanceof Map) {
      nodeArray = Array.from(this.aiNodes.values());
    } else if (this.aiNodes.nodes instanceof Map) {
      nodeArray = Array.from(this.aiNodes.nodes.values());
    } else if (Array.isArray(this.aiNodes)) {
      nodeArray = this.aiNodes;
    } else if (this.aiNodes.nodes && Array.isArray(this.aiNodes.nodes)) {
      nodeArray = this.aiNodes.nodes;
    }
    
    if (!nodeArray || nodeArray.length === 0) {
      return;
    }
    
    // Process each node
    let updateCount = 0;
    const maxUpdates = Math.min(nodeArray.length, this.config.maxAurasPerFrame);
    
    for (let i = 0; i < maxUpdates; i++) {
      const node = nodeArray[i];
      if (!node || !node.nodeId) continue;
      
      // Get or create aura for this node
      if (!this.nodeAuras.has(node.nodeId)) {
        this._createAuraForNode(node);
      }
      
      // Update aura
      if (this.nodeAuras.has(node.nodeId)) {
        this._updateNodeAura(node, deltaTime);
        updateCount++;
      }
    }
    
    // Clean up auras for deleted nodes
    this._cleanupOrphanAuras(nodeArray);
    
    // Update statistics
    this.stats.activeAuras = this.nodeAuras.size;
    this.stats.updatesPerFrame = updateCount;
    this.stats.lastUpdateTime = performance.now() - startTime;
    
    if (this.config.debugMode && updateCount > 0) {
      console.log(
        `[NodeAuraRenderer] active=${this.stats.activeAuras} | ` +
        `updated=${updateCount} | ` +
        `time=${this.stats.lastUpdateTime.toFixed(2)}ms`
      );
    }
  }

  /**
   * Create aura mesh for a node
   * @private
   * @param {Object} node - Node object
   */
  _createAuraForNode(node) {
    // Get from pool or create new
    let geometry = this.geometryPool.length > 0 ? this.geometryPool.pop() : createAuraGeometry(this.config.baseRadius, this.config.meshSubdivisions);
    let material = this.materialPool.length > 0 ? this.materialPool.pop() : createNodeAuraMaterial({
      baseDisplacement: this.config.baseDisplacement,
      baseOpacity: this.config.baseOpacity,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Position at node
    if (node.position) {
      mesh.position.copy(node.position);
    }
    
    // Add to scene
    this.scene.add(mesh);
    
    // Store aura data
    this.nodeAuras.set(node.nodeId, {
      mesh: mesh,
      material: material,
      linkBoostTime: 0,
      lastHarmony: node.harmony ?? 0.5,
      lastCorruption: node.corruption ?? 0.2,
    });
  }

  /**
   * Update aura for a specific node
   * @private
   * @param {Object} node - Node object
   * @param {number} deltaTime - Delta time in seconds
   */
  _updateNodeAura(node, deltaTime) {
    const aura = this.nodeAuras.get(node.nodeId);
    if (!aura || !aura.mesh || !aura.material) {
      return;
    }
    
    // Update position from node
    if (node.position) {
      aura.mesh.position.copy(node.position);
    }
    
    // Track link boost timing
    if (node.justLinked) {
      aura.linkBoostTime = this.config.linkBoostDuration;
      node.justLinked = false;  // Clear flag
    }
    
    if (aura.linkBoostTime > 0) {
      aura.linkBoostTime -= deltaTime;
    }
    
    // Compute link boost multiplier
    const linkBoost = aura.linkBoostTime > 0 ? 
      this.config.linkBoostIntensity * (aura.linkBoostTime / this.config.linkBoostDuration) :
      1.0;
    
    // Get node state metrics with safe defaults
    const harmony = (node && typeof node.harmony === 'number') ? node.harmony : 0.5;
    const nodeCorruption = (node && typeof node.corruption === 'number') ? node.corruption : 0.2;
    const auraCoherenceBias = (node && node._auraCoherenceBias) ? node._auraCoherenceBias : 0;
    const waveInfluence = (node && node._waveInfluence) ? node._waveInfluence : 0;
    const hintStrength = (node && node._precastHintStrength) ? node._precastHintStrength : 0;
    
    // Update shader uniforms
    if (aura.material && aura.material.uniforms) {
      aura.material.uniforms.uTime.value = this.globalTime;
      aura.material.uniforms.uHarmony.value = harmony;
      aura.material.uniforms.uCorruption.value = nodeCorruption;
      aura.material.uniforms.uHintStrength.value = hintStrength;
      aura.material.uniforms.uWaveInfluence.value = waveInfluence;
      
      // Displacement scales with link boost + state
      const displacementBase = this.config.baseDisplacement * linkBoost;
      const coherenceModulation = 1 - auraCoherenceBias * 0.5;  // Hints compress displacement
      aura.material.uniforms.uDisplacement.value = displacementBase * coherenceModulation;
      
      // Opacity increases with activity
      const activityLevel = (harmony + waveInfluence + auraCoherenceBias) / 3;
      const opacityModulated = this.config.baseOpacity * (0.8 + activityLevel * 0.4) * linkBoost;
      aura.material.uniforms.uOpacity.value = Math.min(1.0, opacityModulated);
    }
    
    // Track state for potential animation triggers
    aura.lastHarmony = harmony;
    aura.lastCorruption = nodeCorruption;
  }

  /**
   * Remove auras for nodes that no longer exist
   * @private
   * @param {Array} activeNodes - Current active nodes
   */
  _cleanupOrphanAuras(activeNodes) {
    const activeNodeIds = new Set(activeNodes.map(n => n.nodeId).filter(id => !!id));
    
    const orphanIds = [];
    for (const [nodeId, aura] of this.nodeAuras.entries()) {
      if (!activeNodeIds.has(nodeId)) {
        orphanIds.push(nodeId);
      }
    }
    
    for (const nodeId of orphanIds) {
      const aura = this.nodeAuras.get(nodeId);
      
      // Remove from scene
      if (aura.mesh && aura.mesh.parent) {
        this.scene.remove(aura.mesh);
      }
      
      // Return to pool
      if (aura.mesh && aura.mesh.geometry) {
        this.geometryPool.push(aura.mesh.geometry);
      }
      if (aura.material) {
        this.materialPool.push(aura.material);
      }
      
      this.nodeAuras.delete(nodeId);
    }
  }

  /**
   * Enable aura rendering
   */
  enable() {
    this.config.enabled = true;
    if (this.config.debugMode) {
      console.log('[NodeAuraRenderer] Enabled');
    }
  }

  /**
   * Disable aura rendering
   */
  disable() {
    this.config.enabled = false;
    
    // Hide all auras
    for (const aura of this.nodeAuras.values()) {
      if (aura.mesh) {
        aura.mesh.visible = false;
      }
    }
    
    if (this.config.debugMode) {
      console.log('[NodeAuraRenderer] Disabled');
    }
  }

  /**
   * Toggle visibility of aura rendering
   */
  toggleEnabled() {
    this.config.enabled ? this.disable() : this.enable();
  }

  /**
   * Get renderer status
   * @returns {Object} Status object
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      activeAuras: this.stats.activeAuras,
      updatesPerFrame: this.stats.updatesPerFrame,
      lastUpdateTime: this.stats.lastUpdateTime,
      globalTime: this.globalTime,
    };
  }

  /**
   * Setup console debugging API
   * @param {Object} globalWindow - Window object
   */
  setupConsoleAPI(globalWindow) {
    if (!globalWindow) return;
    
    globalWindow.NODE_AURA_STATS = this.stats;
    globalWindow.NODE_AURA_CONFIG = this.config;
    
    globalWindow.enableNodeAuras = () => {
      this.enable();
      console.log('[NodeAuraRenderer] Auras enabled');
    };
    
    globalWindow.disableNodeAuras = () => {
      this.disable();
      console.log('[NodeAuraRenderer] Auras disabled');
    };
    
    globalWindow.toggleNodeAuras = () => {
      this.toggleEnabled();
      console.log(`[NodeAuraRenderer] Auras toggled: ${this.config.enabled ? 'ON' : 'OFF'}`);
    };
    
    globalWindow.nodeAuraStatus = () => {
      const status = this.getStatus();
      console.log('=== NODE AURA RENDERER STATUS ===');
      console.log(`Enabled: ${status.enabled}`);
      console.log(`Active auras: ${status.activeAuras}`);
      console.log(`Updates per frame: ${status.updatesPerFrame}`);
      console.log(`Last update time: ${status.lastUpdateTime.toFixed(2)}ms`);
      console.log(`Global time: ${status.globalTime.toFixed(2)}s`);
      return status;
    };
    
    globalWindow.toggleNodeAuraDebug = (enabled = true) => {
      this.config.debugMode = enabled;
      console.log(`[NodeAuraRenderer] Debug mode: ${enabled ? 'ON' : 'OFF'}`);
    };
    
    globalWindow.tune_node_aura = (key, value) => {
      if (key in this.config) {
        this.config[key] = value;
        console.log(`[NodeAuraRenderer] ${key} = ${value}`);
      } else {
        console.warn(`Unknown config key: ${key}`);
      }
    };
  }

  /**
   * Cleanup and dispose
   */
  dispose() {
    // Remove all auras from scene
    for (const aura of this.nodeAuras.values()) {
      if (aura.mesh && aura.mesh.parent) {
        this.scene.remove(aura.mesh);
      }
    }
    
    // Clear pools
    this.nodeAuras.clear();
    this.geometryPool.length = 0;
    this.materialPool.length = 0;
  }
}

/**
 * Console API setup function
 * @param {Object} globalWindow - Window object
 * @param {NodeLinkedAuraRenderer_Session146} renderer - Renderer instance
 */
export function setupNodeAuraConsoleAPI(globalWindow, renderer) {
  if (renderer && renderer.setupConsoleAPI) {
    renderer.setupConsoleAPI(globalWindow);
  }
}
