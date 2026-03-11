/**
 * LINK STATE VISUAL LANGUAGE INTEGRATION
 *
 * Wires runtime metrics to link shaders:
 * - Network stress → global color shift
 * - Load pressure → thickness + pulse
 * - Corruption → edge noise
 * - Synergy → smoothness
 * - Harmony → damping
 *
 * Read-only consumer of existing metrics.
 * No gameplay modifications, no stat mutations.
 */

import * as THREE from 'three';
import {
  linkStateVertexShader,
  linkStateFragmentShader
} from './shaders/LinkStateVisualLanguage.js';
import { applyLinkRenderLayer } from './LinkRenderLayerPolicy.js';

export class LinkStateVisualLanguageIntegration {
  /**
   * @param {Object} linkingSystem - NodeLinkingSystem or equivalent
   * @param {Object} config - Configuration
   */
  constructor(linkingSystem, config = {}) {
    this.linkingSystem = linkingSystem;
    this.debugMode = config.debugMode || false;

    // Link material references (all links share a canonical material)
    this.linkMaterials = new Map();  // link → ShaderMaterial (shared instance)

    // State tracking (for efficient updates)
    this.currentNetworkStress = 0;
    this.linkMetrics = new Map();   // link → { corruption, synergy, harmonyA, harmonyB, loadA, loadB }

    if (this.debugMode) {
      console.log('%c[LinkStateVisualLanguage] Initialized', 'color: #00dd88; font-weight: bold;');
    }
  }

  /**
   * Update network stress (applied to all links)
   * 
   * @param {number} networkStress - Global stress (0–1)
   */
  updateNetworkStress(networkStress) {
    this.currentNetworkStress = Math.max(0, Math.min(1, networkStress ?? 0));
    __currentNetworkStress = this.currentNetworkStress;
    // uniforms applied per-link at draw time via onBeforeRender
  }

  /**
   * Update link-level metrics
   * 
   * @param {Object} link - Link object
   * @param {number} corruption - Link corruption (0–1)
   * @param {number} synergy - Link synergy (0–100)
   */
  updateLinkMetrics(link, corruption, synergy) {
    if (!link) return;

    // Extract harmony from endpoint nodes
    const sourceNode = link.source || link.sourceNode;
    const targetNode = link.target || link.targetNode;
    
    const harmonyA = sourceNode?.userData?.harmonyLevel ?? 0;
    const harmonyB = targetNode?.userData?.harmonyLevel ?? 0;
    const harmonyAvg = (harmonyA + harmonyB) / 2;
    
    // Extract load from endpoint nodes
    const loadA = sourceNode?.userData?.stressIntensity ?? 0;
    const loadB = targetNode?.userData?.stressIntensity ?? 0;
    const loadMax = Math.max(loadA, loadB);

    // Store metrics
    this.linkMetrics.set(link, {
      corruption: Math.max(0, Math.min(1, corruption ?? 0)),
      synergy: Math.max(0, Math.min(100, synergy ?? 0)),
      harmonyAvg: harmonyAvg,
      loadMax: loadMax
    });
    // Uniforms are set lazily per draw in onBeforeRender

    // Update per-link override snapshot if registered
    const override = __linkStateOverrides.get(link);
    if (override) {
      const metrics = this.linkMetrics.get(link);
      override.corruption = metrics.corruption;
      override.synergy = metrics.synergy;
      override.harmonyAvg = metrics.harmonyAvg;
      override.loadMax = metrics.loadMax;
    }
  }

  /**
   * Register a link for visual language rendering
   * 
   * Creates a shader material with all necessary uniforms
   * 
   * @param {Object} link - Link to register
   * @param {THREE.ShaderMaterial} optionalMaterial - Use existing material if provided
   * @returns {THREE.ShaderMaterial} Shader material with state uniforms
   */
  registerLink(link, optionalMaterial = null) {
    if (!link) return null;

    // Reuse canonical material (bounded program & material count)
    const material = optionalMaterial || getCanonicalLinkStateMaterial();

    // Store reference
    this.linkMaterials.set(link, material);

    // Initialize metrics
    this.updateLinkMetrics(link, 0, 50);

    return material;
  }

  /**
   * Unregister a link from visual language (cleanup)
   * 
   * @param {Object} link - Link to unregister
   */
  unregisterLink(link) {
    if (!link) return;

    this.linkMaterials.delete(link);
    this.linkMetrics.delete(link);
    __linkStateOverrides.delete(link);
  }

  /**
   * Update time uniforms for all animated effects
   * 
   * @param {number} currentTime - Current elapsed time
   */
  updateAnimationTime(currentTime) {
    // Store time; applied per-draw in onBeforeRender
    for (const [link, state] of this.linkMetrics.entries()) {
      state.time = currentTime;
      const override = __linkStateOverrides.get(link);
      if (override) override.time = currentTime;
    }
  }

  /**
   * Get visual state of a specific link (for debugging)
   * 
   * @param {Object} link - Link to query
   * @returns {Object} Visual state snapshot
   */
  getLinkVisualState(link) {
    if (!link) return null;

    const metrics = this.linkMetrics.get(link);
    const material = this.linkMaterials.get(link);

    if (!metrics || !material) return null;

    return {
      networkStress: this.currentNetworkStress,
      corruption: metrics.corruption,
      synergy: metrics.synergy,
      harmony: metrics.harmonyAvg,
      load: metrics.loadMax,
      // Describe what the player sees
      colorShift: this.describeColorShift(this.currentNetworkStress),
      edgeQuality: metrics.corruption > 0.3 ? 'Degraded' : 'Clean',
      coherence: metrics.synergy > 60 ? 'High' : metrics.synergy > 30 ? 'Medium' : 'Low',
      stability: metrics.harmonyAvg > 0.5 ? 'Stabilized' : 'Chaotic'
    };
  }

  /**
   * Describe color shift for debugging
   * 
   * @param {number} stress - Network stress (0–1)
   * @returns {string} Color description
   */
  describeColorShift(stress) {
    if (stress < 0.3) return 'Cool blue (calm)';
    if (stress < 0.6) return 'Warming orange (alert)';
    return 'Hot red (critical)';
  }

  /**
   * Debug: Print visual state of all registered links
   */
  debugPrintLinkStates() {
    console.log('%c[LinkStateVisualLanguage] LINK VISUAL STATES', 'color: #00dd88; font-weight: bold;');
    console.log(`Network Stress: ${this.currentNetworkStress.toFixed(3)}`);
    console.log(`Registered Links: ${this.linkMaterials.size}`);

    for (const [link, material] of this.linkMaterials.entries()) {
      const state = this.getLinkVisualState(link);
      if (state) {
        console.log(`Link: corruption=${state.corruption.toFixed(2)}, synergy=${state.synergy.toFixed(0)}, harmony=${state.harmony.toFixed(2)}, load=${state.load.toFixed(2)}`);
        console.log(`  → ${state.colorShift} | ${state.edgeQuality} edges | ${state.coherence} coherence | ${state.stability}`);
      }
    }
  }
}

// =============================================================================
// CANONICAL MATERIAL (POOL OF ONE) WITH PER-LINK OVERRIDES
// =============================================================================
let __linkStateMaterial = null;
let __currentNetworkStress = 0;
const __linkStateOverrides = new WeakMap(); // link(object) -> state

function getCanonicalLinkStateMaterial() {
  if (__linkStateMaterial) return __linkStateMaterial;

  // Shaders imported at module level (ES6)

  __linkStateMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uNetworkStress: { value: 0 },
      uLocalLoad: { value: 0 },
      uCorruption: { value: 0 },
      uSynergy: { value: 50 },
      uHarmony: { value: 0 },
      uTime: { value: 0 }
    },
    vertexShader: linkStateVertexShader,
    fragmentShader: linkStateFragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending
  });
  applyLinkRenderLayer(__linkStateMaterial, 'LINK_SKIN', {
    materialOverrides: { blending: THREE.NormalBlending }
  });

  // Freeze program cache to a single entry for all links
  __linkStateMaterial.customProgramCacheKey = () => 'ATOMA_LINK_CANONICAL_v1';

  // Per-draw uniform application to avoid shared-uniform crosstalk
  __linkStateMaterial.onBeforeRender = (renderer, scene, camera, geometry, object) => {
    const state = __linkStateOverrides.get(object);
    if (!state) return;
    const u = __linkStateMaterial.uniforms;
    u.uNetworkStress.value = __currentNetworkStress;
    u.uLocalLoad.value = state.loadMax ?? 0;
    u.uCorruption.value = state.corruption ?? 0;
    u.uSynergy.value = state.synergy ?? 50;
    u.uHarmony.value = state.harmonyAvg ?? 0;
    u.uTime.value = state.time ?? 0;
  };

  return __linkStateMaterial;
}

// Hook into registerLink to bind per-link overrides
const _originalRegisterLink = LinkStateVisualLanguageIntegration.prototype.registerLink;
LinkStateVisualLanguageIntegration.prototype.registerLink = function(link, optionalMaterial = null) {
  const material = _originalRegisterLink.call(this, link, optionalMaterial);

  // Capture current metrics for this link to apply at draw time
  const metrics = this.linkMetrics.get(link) || {
    corruption: 0, synergy: 50, harmonyAvg: 0, loadMax: 0, time: 0
  };

  __linkStateOverrides.set(link, {
    corruption: metrics.corruption,
    synergy: metrics.synergy,
    harmonyAvg: metrics.harmonyAvg,
    loadMax: metrics.loadMax,
    networkStress: this.currentNetworkStress,
    time: metrics.time ?? 0
  });

  // Optional debug log
  if (typeof window !== 'undefined' && window.__ATOMA_DEBUG_LINK_MATS__ === true) {
    const renderer = window.__ATOMA_RENDERER__;
    const programCount = renderer?.info?.programs?.length;
    const uniqueMaterials = new Set(Array.from(this.linkMaterials.values())).size;
    console.log('[LinkStateVisualLanguageIntegration] link registered',
      { programs: programCount, linkCount: this.linkMaterials.size, uniqueMaterials });
  }

  return material;
};

export default LinkStateVisualLanguageIntegration;
