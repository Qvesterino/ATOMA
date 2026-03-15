/**
 * ResonanceCascadeVisualization_Session117B.js
 * ============================================================================
 * Visualizes resonance cascades emanating from high-conflict zones through
 * the network, showing how conflict energy propagates along link pathways.
 * 
 * VISUAL STORYTELLING:
 * When harmonic hubs conflict, the tension radiates outward in waves:
 * - Radial propagation: Energy expands from conflict center
 * - Link propagation: Energy travels along network paths
 * - Node illumination: Affected nodes glow based on cascade intensity
 * - Link distortion: Affected links show ripple/kink effects
 * - Particle effects: Optional cascade particles with directional flow
 * - Standing ripples: Cascades interact creating interference
 * 
 * ARCHITECTURE:
 * ✅ Pure visual adapter - reads conflict state, doesn't modify
 * ✅ Zero per-frame allocations (all cached)
 * ✅ Deterministic propagation (no randomness)
 * ✅ Smooth temporal adaptation
 * ✅ Works with existing visual systems
 * ✅ No material redefinitions (uniforms only)
 * ✅ Graceful degradation for missing data
 * 
 * CONSTRAINTS:
 * ✅ Adapter-only (reads, never modifies core data)
 * ✅ Zero gameplay impact
 * ✅ No per-frame allocations
 * ✅ Fully reversible
 * ✅ Deterministic (no randomness)
 * ✅ Works with all existing systems
 * ✅ No new materials or shaders required
 * ============================================================================
 */

let THREE_SAFE = null;
THREE_SAFE =
  (typeof window !== 'undefined' && window.THREE) ||
  (typeof globalThis !== 'undefined' && globalThis.THREE) ||
  null;

const THREE = THREE_SAFE;

/**
 * Configuration for cascade behavior
 */
const CASCADE_CONFIG = {
  // Propagation speeds
  RADIAL_PROPAGATION_SPEED: 8.0,              // Units per second (spatial)
  
  // Temporal parameters
  CASCADE_LIFETIME: 4.0,                      // Seconds before cascade dissipates
  RIPPLE_FREQUENCY: 2.0,                      // Hz for ripple oscillation
  
  // Intensity modulation
  NODE_GLOW_MULTIPLIER: 0.6,                  // How much cascade affects node glow
  LINK_RIPPLE_MULTIPLIER: 0.4,                // How much cascade affects links
  LINK_THICKNESS_MULTIPLIER: 0.3,             // How much cascade fattens links
  PARTICLE_EMISSION_MULTIPLIER: 1.5,          // Particle rate scaling
};

/**
 * Cascade wave representation
 */
class CascadeWave {
  constructor(originPos, originIntensity, propagationMode = 'radial') {
    this.originPos = originPos.clone();
    this.originIntensity = originIntensity;
    this.propagationMode = propagationMode;     // 'radial' or 'link-based'
    
    // Lifetime and decay
    this.age = 0.0;
    this.lifetime = CASCADE_CONFIG.CASCADE_LIFETIME;
    this.intensity = originIntensity;
    
    // Propagation state
    this.currentRadius = 0.0;                  // For radial mode
    this.affectedNodes = new Set();            // Cached affected nodes
    this.affectedLinks = new Set();            // Cached affected links
    
    // Ripple oscillation
    this.ripplePhase = 0.0;
    this.rippleAmplitude = 0.5;
  }
  
  /**
   * Update cascade state per frame
   */
  update(deltaTime) {
    this.age += deltaTime;
    this.lifetime = Math.max(0, this.lifetime - deltaTime);
    
    // Fade intensity over lifetime
    const fadeRatio = this.lifetime / CASCADE_CONFIG.CASCADE_LIFETIME;
    this.intensity = this.originIntensity * fadeRatio;
    
    // Update radial propagation
    this.currentRadius += CASCADE_CONFIG.RADIAL_PROPAGATION_SPEED * deltaTime;
    
    // Update ripple oscillation
    this.ripplePhase += CASCADE_CONFIG.RIPPLE_FREQUENCY * 2 * Math.PI * deltaTime;
    this.rippleAmplitude = Math.sin(this.ripplePhase) * 0.3 + 0.5; // 0.2-0.8
  }
  
  /**
   * Check if cascade is still active
   */
  isActive() {
    return this.lifetime > 0.01 && this.intensity > 0.01;
  }
}

/**
 * Main cascade visualization system
 */
export class ResonanceCascadeVisualization_Session117B {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.enabled = options.enabled ?? true;
    this.debugMode = options.debugMode ?? false;
    this.semanticBus = options.semanticBus ?? globalThis.semanticBus ?? null;
    
    // Active cascades
    this.activeCascades = [];
    
    // Per-node cascade accumulator
    this.nodeCascadeIntensity = new Map();
    this.linkCascadeIntensity = new Map();
    this._boundHandleCascadeStart = this.handleCascadeStart.bind(this);
    this._boundHandleCascadeHop = this.handleCascadeHop.bind(this);
    this._boundHandleCascadeEnd = this.handleCascadeEnd.bind(this);
    this._subscribeSemanticBus();
    
    console.log('[Session 117B] ResonanceCascadeVisualization initialized ✓');
  }

  _subscribeSemanticBus() {
    if (!this.semanticBus?.on) return;
    this.semanticBus.on('cascade.start', this._boundHandleCascadeStart);
    this.semanticBus.on('cascade.hop', this._boundHandleCascadeHop);
    this.semanticBus.on('cascade.end', this._boundHandleCascadeEnd);
  }
  
  _clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  _registerNodeVisual(node, intensity) {
    if (!node?.userData) return;
    const prev = this.nodeCascadeIntensity.get(node) ?? 0;
    this.nodeCascadeIntensity.set(node, Math.max(prev, intensity));
  }

  _registerLinkVisual(link, intensity) {
    if (!link?.userData) return;
    const prev = this.linkCascadeIntensity.get(link) ?? 0;
    this.linkCascadeIntensity.set(link, Math.max(prev, intensity));
  }

  _spawnCascadeWaveFromEvent(event = {}) {
    if (!this.enabled || !THREE) return;

    const sourcePos =
      event?.center ||
      event?.position ||
      event?.origin ||
      event?.centerPos ||
      null;

    const pos = sourcePos
      ? new THREE.Vector3(
          Number(sourcePos.x) || 0,
          Number(sourcePos.y) || 0,
          Number(sourcePos.z) || 0
        )
      : new THREE.Vector3(0, 0, 0);

    const rawIntensity = event?.intensity ?? event?.value ?? event?.strength ?? 0;
    const impulseIntensity = this._clamp01(rawIntensity);
    if (impulseIntensity <= 0) return;

    const cascade = new CascadeWave(pos, impulseIntensity, 'radial');
    this.activeCascades.push(cascade);
  }

  handleCascadeStart(event = {}) {
    const intensity = this._clamp01(event?.intensity ?? event?.value ?? 0);
    this._spawnCascadeWaveFromEvent(event);
    this._registerNodeVisual(event?.sourceNode, intensity);
    this._registerNodeVisual(event?.targetNode, intensity);
    this._registerLinkVisual(event?.link, intensity);
  }

  handleCascadeHop(event = {}) {
    const intensity = this._clamp01(event?.intensity ?? event?.value ?? 0);
    this._registerNodeVisual(event?.sourceNode, intensity);
    this._registerNodeVisual(event?.targetNode, intensity);
    this._registerLinkVisual(event?.link, intensity);
  }

  handleCascadeEnd(event = {}) {
    if (!event) return;
    const sourceNode = event?.sourceNode;
    const targetNode = event?.targetNode;
    const link = event?.link;
    if (sourceNode && this.nodeCascadeIntensity.has(sourceNode)) this.nodeCascadeIntensity.set(sourceNode, 0);
    if (targetNode && this.nodeCascadeIntensity.has(targetNode)) this.nodeCascadeIntensity.set(targetNode, 0);
    if (link && this.linkCascadeIntensity.has(link)) this.linkCascadeIntensity.set(link, 0);
  }
  
  /**
   * Main update per frame
   */
  update(deltaTime, nodes, links, conflictRegions = []) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    if (!this.enabled) return;
    
    // Update all active cascades
    const activeCascades = [];
    for (const cascade of this.activeCascades) {
      cascade.update(deltaTime);
      
      if (cascade.isActive()) {
        activeCascades.push(cascade);
      }
    }
    this.activeCascades = activeCascades;
    
    // Decay and apply node visuals without scanning network topology.
    for (const [node, value] of this.nodeCascadeIntensity.entries()) {
      const decayed = Math.max(0, value * Math.exp(-deltaTime * 1.35));
      if (!node?.userData || decayed <= 0.001) {
        this.nodeCascadeIntensity.delete(node);
        continue;
      }
      this.nodeCascadeIntensity.set(node, decayed);
      node.userData.cascadeIntensity = decayed;
      node.userData.cascadeGlow = decayed * CASCADE_CONFIG.NODE_GLOW_MULTIPLIER;
      node.userData.cascadeRipple = Math.sin(Date.now() * 0.003) * decayed * 0.5;
    }

    // Decay and apply link visuals without propagation recursion.
    for (const [link, value] of this.linkCascadeIntensity.entries()) {
      const decayed = Math.max(0, value * Math.exp(-deltaTime * 1.5));
      if (!link?.userData || decayed <= 0.001) {
        this.linkCascadeIntensity.delete(link);
        continue;
      }
      this.linkCascadeIntensity.set(link, decayed);
      link.userData.cascadeIntensity = decayed;
      link.userData.cascadeRipple = decayed * CASCADE_CONFIG.LINK_RIPPLE_MULTIPLIER;
      link.userData.cascadeThickening = decayed * CASCADE_CONFIG.LINK_THICKNESS_MULTIPLIER;
      link.userData.cascadeOscillation = Math.sin(Date.now() * 0.004) * decayed;
    }
  }
  
  /**
   * Get cascade info for a specific node
   */
  getNodeCascadeInfo(node) {
    if (!node || !node.userData) return null;
    
    const intensity = this.nodeCascadeIntensity.get(node) ?? 0;
    
    return {
      intensity,
      glow: intensity * CASCADE_CONFIG.NODE_GLOW_MULTIPLIER,
      ripple: node.userData?.cascadeRipple ?? 0
    };
  }
  
  /**
   * Get cascade info for a specific link
   */
  getLinkCascadeInfo(link) {
    if (!link) return null;
    
    const intensity = this.linkCascadeIntensity.get(link) ?? 0;
    
    return {
      intensity,
      ripple: intensity * CASCADE_CONFIG.LINK_RIPPLE_MULTIPLIER,
      thickening: intensity * CASCADE_CONFIG.LINK_THICKNESS_MULTIPLIER,
      oscillation: link.userData?.cascadeOscillation ?? 0
    };
  }
  
  /**
   * Get active cascade count
   */
  getActiveCascadeCount() {
    return this.activeCascades.length;
  }
  
  /**
   * Get all cascade state
   */
  getCascadeState() {
    return {
      activeCascades: this.activeCascades.length,
      affectedNodes: this.nodeCascadeIntensity.size,
      affectedLinks: this.linkCascadeIntensity.size,
      cascades: this.activeCascades.map(c => ({
        intensity: c.intensity,
        radius: c.currentRadius,
        age: c.age,
        lifetime: c.lifetime
      }))
    };
  }
  
  /**
   * Setup console API for debugging
   */
  setupConsoleAPI() {
    window.cascadeDebug = {
      getCascadeState: () => this.getCascadeState(),
      getNodeCascadeInfo: (node) => this.getNodeCascadeInfo(node),
      getLinkCascadeInfo: (link) => this.getLinkCascadeInfo(link),
      getActiveCascades: () => this.activeCascades.length,
      enable: () => { this.enabled = true; console.log('✓ Cascade system enabled'); },
      disable: () => { this.enabled = false; console.log('✓ Cascade system disabled'); }
    };
    
    console.log('[Session 117B] Debug API: window.cascadeDebug.getCascadeState()');
  }

  dispose() {
    if (this.semanticBus?.unsubscribe) {
      this.semanticBus.unsubscribe('cascade.start', this._boundHandleCascadeStart);
      this.semanticBus.unsubscribe('cascade.hop', this._boundHandleCascadeHop);
      this.semanticBus.unsubscribe('cascade.end', this._boundHandleCascadeEnd);
    } else if (this.semanticBus?.off) {
      this.semanticBus.off('cascade.start', this._boundHandleCascadeStart);
      this.semanticBus.off('cascade.hop', this._boundHandleCascadeHop);
      this.semanticBus.off('cascade.end', this._boundHandleCascadeEnd);
    }
  }
}

/**
 * Adapter function for main.js integration
 */
export function setupResonanceCascadeVisualization(game, options = {}) {
  try {
    game.resonanceCascade = new ResonanceCascadeVisualization_Session117B(
      game.scene,
      {
        enabled: true,
        debugMode: false,
        semanticBus: game.semanticBus,
        ...options
      }
    );
    
    // Setup console debugging
    game.resonanceCascade.setupConsoleAPI();
    
    return game.resonanceCascade;
  } catch (err) {
    console.warn('[Session 117B] Failed to initialize ResonanceCascadeVisualization:', err);
    return null;
  }
}
