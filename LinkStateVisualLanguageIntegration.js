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

export class LinkStateVisualLanguageIntegration {
  /**
   * @param {Object} linkingSystem - NodeLinkingSystem or equivalent
   * @param {Object} config - Configuration
   */
  constructor(linkingSystem, config = {}) {
    this.linkingSystem = linkingSystem;
    this.debugMode = config.debugMode || false;

    // Link material references
    this.linkMaterials = new Map();  // link → ShaderMaterial

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

    // Update all link materials
    for (const [link, material] of this.linkMaterials.entries()) {
      if (material && material.uniforms) {
        material.uniforms.uNetworkStress.value = this.currentNetworkStress;
      }
    }
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

    const linkId = link.id || `link_${Math.random()}`;
    
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
    this.linkMetrics.set(linkId, {
      corruption: Math.max(0, Math.min(1, corruption ?? 0)),
      synergy: Math.max(0, Math.min(100, synergy ?? 0)),
      harmonyAvg: harmonyAvg,
      loadMax: loadMax
    });

    // Update material uniforms
    const material = this.linkMaterials.get(link);
    if (material && material.uniforms) {
      material.uniforms.uCorruption.value = this.linkMetrics.get(linkId).corruption;
      material.uniforms.uSynergy.value = this.linkMetrics.get(linkId).synergy;
      material.uniforms.uHarmony.value = this.linkMetrics.get(linkId).harmonyAvg;
      material.uniforms.uLocalLoad.value = this.linkMetrics.get(linkId).loadMax;
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

    const linkId = link.id || `link_${Math.random()}`;

    // Reuse existing material or create new
    let material = optionalMaterial;
    if (!material) {
      // Import shaders dynamically
      const { linkStateVertexShader, linkStateFragmentShader } = 
        require('./shaders/LinkStateVisualLanguage.js');

      material = new THREE.ShaderMaterial({
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
        depthWrite: true,
        depthTest: true,
        blending: THREE.NormalBlending
      });
    }

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

    const linkId = link.id || `link_${Math.random()}`;
    this.linkMaterials.delete(link);
    this.linkMetrics.delete(linkId);
  }

  /**
   * Update time uniforms for all animated effects
   * 
   * @param {number} currentTime - Current elapsed time
   */
  updateAnimationTime(currentTime) {
    for (const [link, material] of this.linkMaterials.entries()) {
      if (material && material.uniforms) {
        material.uniforms.uTime.value = currentTime;
      }
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

    const linkId = link.id || `link_${Math.random()}`;
    const metrics = this.linkMetrics.get(linkId);
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

export default LinkStateVisualLanguageIntegration;
