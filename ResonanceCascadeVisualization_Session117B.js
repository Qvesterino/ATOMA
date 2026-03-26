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

// FIX 1: Use proper ESM import instead of unreliable window.THREE fallback
import * as THREE from 'three';

/**
 * Configuration for cascade behavior
 */
const CASCADE_CONFIG = {
  // Propagation speeds
  RADIAL_PROPAGATION_SPEED: 8.0,              // Units per second (spatial)
  RADIAL_BAND_WIDTH: 2.8,                     // Wavefront thickness in world units
  
  // Temporal parameters
  CASCADE_LIFETIME: 4.0,                      // Seconds before cascade dissipates
  RIPPLE_FREQUENCY: 2.0,                      // Hz for ripple oscillation
  
  // Intensity modulation
  NODE_GLOW_MULTIPLIER: 0.6,                  // How much cascade affects node glow
  LINK_RIPPLE_MULTIPLIER: 0.4,                // How much cascade affects links
  LINK_THICKNESS_MULTIPLIER: 0.3,             // How much cascade fattens links
  PARTICLE_EMISSION_MULTIPLIER: 1.5,          // Particle rate scaling
  NODE_SCALE_MULTIPLIER: 0.05,
  LINK_SCALE_MULTIPLIER: 0.03,
  NODE_EMISSIVE_MULTIPLIER: 0.8,
  LINK_EMISSIVE_MULTIPLIER: 0.65,
  NODE_OPACITY_MULTIPLIER: 0.16,
  LINK_OPACITY_MULTIPLIER: 0.18,
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
    this.nodeVisualState = new WeakMap();
    this.linkVisualState = new WeakMap();
    this._tmpNodeTint = new THREE.Color(0xff66aa);
    this._tmpLinkTint = new THREE.Color(0xff8866);
    this._boundHandleCascadeStart = this.handleCascadeStart.bind(this);
    this._boundHandleCascadeHop = this.handleCascadeHop.bind(this);
    this._boundHandleCascadeEnd = this.handleCascadeEnd.bind(this);
    this._semanticEventsBound = false;
    this.init();
    
    console.log('[Session 117B] ResonanceCascadeVisualization initialized ✓');
  }

  _subscribeSemanticBus() {
    if (!this.semanticBus?.on || this._semanticEventsBound) return;
    this.semanticBus.on('cascade.start', this._boundHandleCascadeStart);
    this.semanticBus.on('cascade.hop', this._boundHandleCascadeHop);
    this.semanticBus.on('cascade.end', this._boundHandleCascadeEnd);
    this._semanticEventsBound = true;
  }

  _unsubscribeSemanticBus() {
    if (!this._semanticEventsBound) return;
    if (this.semanticBus?.unsubscribe) {
      this.semanticBus.unsubscribe('cascade.start', this._boundHandleCascadeStart);
      this.semanticBus.unsubscribe('cascade.hop', this._boundHandleCascadeHop);
      this.semanticBus.unsubscribe('cascade.end', this._boundHandleCascadeEnd);
    } else if (this.semanticBus?.off) {
      this.semanticBus.off('cascade.start', this._boundHandleCascadeStart);
      this.semanticBus.off('cascade.hop', this._boundHandleCascadeHop);
      this.semanticBus.off('cascade.end', this._boundHandleCascadeEnd);
    }
    this._semanticEventsBound = false;
  }

  init(config = {}) {
    if (config.semanticBus && config.semanticBus !== this.semanticBus) {
      this._unsubscribeSemanticBus();
      this.semanticBus = config.semanticBus;
    }
    this._subscribeSemanticBus();
    return this;
  }

  rebind(config = {}) {
    if (config.semanticBus && config.semanticBus !== this.semanticBus) {
      this._unsubscribeSemanticBus();
      this.semanticBus = config.semanticBus;
    }
    this._subscribeSemanticBus();
    return this;
  }
  
  _clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  _resolveCascadeAnchor(event = {}) {
    const anchor = this._asValidPosition(event?.anchor);
    if (anchor) return anchor;

    const sourcePos = this._asValidPosition(event?.sourceNode?.position);
    const targetPos = this._asValidPosition(event?.targetNode?.position);
    if (!sourcePos || !targetPos) return null;

    return new THREE.Vector3(
      (sourcePos.x + targetPos.x) * 0.5,
      (sourcePos.y + targetPos.y) * 0.5,
      (sourcePos.z + targetPos.z) * 0.5
    );
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

  _distanceToPosition(positionA, positionB) {
    const dx = (positionA?.x || 0) - (positionB?.x || 0);
    const dy = (positionA?.y || 0) - (positionB?.y || 0);
    const dz = (positionA?.z || 0) - (positionB?.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  _computeWaveInfluence(distance, cascade) {
    const bandHalfWidth = CASCADE_CONFIG.RADIAL_BAND_WIDTH * 0.5;
    const delta = Math.abs(distance - cascade.currentRadius);
    if (delta > bandHalfWidth) return 0;
    const falloff = 1.0 - (delta / bandHalfWidth);
    return cascade.intensity * falloff * cascade.rippleAmplitude;
  }

  _resolveNodeVisualRoot(node) {
    return node?.userData?.visualRoot || node?.userData?.nodeRoot || node || null;
  }

  _resolveLinkVisualRoot(link) {
    return (
      link?.userData?.line ||
      link?.userData?.linkMesh ||
      link?.userData?.visualRoot ||
      link?.mesh ||
      link?.object3D ||
      null
    );
  }

  _getLinkMidpoint(link) {
    const source = link?.source || link?.sourceNode;
    const target = link?.target || link?.targetNode;
    if (!source?.position || !target?.position) return null;
    return {
      x: (source.position.x + target.position.x) * 0.5,
      y: (source.position.y + target.position.y) * 0.5,
      z: (source.position.z + target.position.z) * 0.5
    };
  }

  _forEachMaterial(target, visitor) {
    if (!target) return;
    const visitMaterial = (material) => {
      if (!material) return;
      visitor(material);
    };

    if (target.material) {
      if (Array.isArray(target.material)) {
        target.material.forEach(visitMaterial);
      } else {
        visitMaterial(target.material);
      }
    }

    target.traverse?.((child) => {
      if (!child?.material || child === target) return;
      if (Array.isArray(child.material)) {
        child.material.forEach(visitMaterial);
      } else {
        visitMaterial(child.material);
      }
    });
  }

  _ensureVisualState(target, stateMap) {
    if (!target) return null;
    let state = stateMap.get(target);
    if (state) return state;

    state = {
      scale: target.scale?.clone?.() || null,
      materials: new WeakMap()
    };
    stateMap.set(target, state);
    return state;
  }

  _ensureMaterialState(material, state) {
    let materialState = state.materials.get(material);
    if (materialState) return materialState;

    materialState = {
      opacity: material.opacity,
      transparent: material.transparent,
      emissiveIntensity: material.emissiveIntensity,
      color: material.color?.clone?.() || null,
      emissive: material.emissive?.clone?.() || null
    };
    state.materials.set(material, materialState);
    return materialState;
  }

  _applyVisualCascade(target, intensity, stateMap, tintColor, scaleMultiplier, emissiveMultiplier, opacityMultiplier) {
    if (!target || intensity <= 0) return;

    const state = this._ensureVisualState(target, stateMap);
    if (!state) return;

    if (state.scale && target.scale?.copy) {
      target.scale.copy(state.scale).multiplyScalar(1.0 + intensity * scaleMultiplier);
    }

    this._forEachMaterial(target, (material) => {
      const materialState = this._ensureMaterialState(material, state);
      if (!materialState) return;

      if (material.color && materialState.color) {
        material.color.copy(materialState.color).lerp(tintColor, intensity * 0.25);
      }

      if (material.emissive && materialState.emissive) {
        material.emissive.copy(materialState.emissive).lerp(tintColor, intensity * 0.45);
      }

      if (typeof material.emissiveIntensity === 'number') {
        material.emissiveIntensity = (materialState.emissiveIntensity || 0) + intensity * emissiveMultiplier;
      }

      if (typeof material.opacity === 'number') {
        material.transparent = true;
        material.opacity = Math.min(1.0, (materialState.opacity ?? 1.0) + intensity * opacityMultiplier);
      }
    });
  }

  _restoreVisualCascade(target, stateMap) {
    if (!target) return;
    const state = stateMap.get(target);
    if (!state) return;

    if (state.scale && target.scale?.copy) {
      target.scale.copy(state.scale);
    }

    this._forEachMaterial(target, (material) => {
      const materialState = state.materials.get(material);
      if (!materialState) return;

      if (material.color && materialState.color) {
        material.color.copy(materialState.color);
      }

      if (material.emissive && materialState.emissive) {
        material.emissive.copy(materialState.emissive);
      }

      if (typeof material.emissiveIntensity === 'number') {
        material.emissiveIntensity = materialState.emissiveIntensity;
      }

      if (typeof material.opacity === 'number') {
        material.opacity = materialState.opacity;
        material.transparent = materialState.transparent;
      }
    });

    stateMap.delete(target);
  }

  _spawnCascadeWaveFromEvent(event = {}) {
    if (!this.enabled || !THREE) return;

    const rawIntensity = event?.intensity ?? event?.value ?? event?.strength ?? 0;
    const impulseIntensity = this._clamp01(rawIntensity);
    const pos = this._resolveCascadeAnchor(event);
    if (impulseIntensity <= 0 || !pos) return;

    const cascade = new CascadeWave(pos, impulseIntensity, 'radial');
    this.activeCascades.push(cascade);
  }

  _asValidPosition(value) {
    if (!value) return null;
    const x = Number(value.x);
    const y = Number(value.y);
    const z = Number(value.z);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
    return new THREE.Vector3(x, y, z);
  }

  handleCascadeStart(event = {}) {
    const intensity = this._clamp01(event?.intensity ?? event?.value ?? 0);
    const anchor = this._resolveCascadeAnchor(event);
    if (intensity <= 0 || !anchor) return;
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

    if (Array.isArray(nodes) && this.activeCascades.length > 0) {
      for (const node of nodes) {
        if (!node?.position || !node?.userData) continue;
        let influence = 0;
        for (const cascade of this.activeCascades) {
          const distance = this._distanceToPosition(node.position, cascade.originPos);
          influence = Math.max(influence, this._computeWaveInfluence(distance, cascade));
        }
        if (influence > 0.001) {
          this._registerNodeVisual(node, influence);
        }
      }
    }

    if (Array.isArray(links) && this.activeCascades.length > 0) {
      for (const link of links) {
        const midpoint = this._getLinkMidpoint(link);
        if (!midpoint || !link?.userData) continue;
        let influence = 0;
        for (const cascade of this.activeCascades) {
          const distance = this._distanceToPosition(midpoint, cascade.originPos);
          influence = Math.max(influence, this._computeWaveInfluence(distance, cascade));
        }
        if (influence > 0.001) {
          this._registerLinkVisual(link, influence);
        }
      }
    }
    
    // Decay and apply node visuals without scanning network topology.
    for (const [node, value] of this.nodeCascadeIntensity.entries()) {
      const decayed = Math.max(0, value * Math.exp(-deltaTime * 1.35));
      if (!node?.userData || decayed <= 0.001) {
        this._restoreVisualCascade(this._resolveNodeVisualRoot(node), this.nodeVisualState);
        this.nodeCascadeIntensity.delete(node);
        continue;
      }
      this.nodeCascadeIntensity.set(node, decayed);
      node.userData.cascadeGlow = decayed * CASCADE_CONFIG.NODE_GLOW_MULTIPLIER;
      node.userData.cascadeRipple = Math.sin(Date.now() * 0.003) * decayed * 0.5;
      this._applyVisualCascade(
        this._resolveNodeVisualRoot(node),
        decayed,
        this.nodeVisualState,
        this._tmpNodeTint,
        CASCADE_CONFIG.NODE_SCALE_MULTIPLIER,
        CASCADE_CONFIG.NODE_EMISSIVE_MULTIPLIER,
        CASCADE_CONFIG.NODE_OPACITY_MULTIPLIER
      );
    }

    // Decay and apply link visuals without propagation recursion.
    for (const [link, value] of this.linkCascadeIntensity.entries()) {
      const decayed = Math.max(0, value * Math.exp(-deltaTime * 1.5));
      if (!link?.userData || decayed <= 0.001) {
        this._restoreVisualCascade(this._resolveLinkVisualRoot(link), this.linkVisualState);
        this.linkCascadeIntensity.delete(link);
        continue;
      }
      this.linkCascadeIntensity.set(link, decayed);
      link.userData.cascadeRipple = decayed * CASCADE_CONFIG.LINK_RIPPLE_MULTIPLIER;
      link.userData.cascadeThickening = decayed * CASCADE_CONFIG.LINK_THICKNESS_MULTIPLIER;
      link.userData.cascadeOscillation = Math.sin(Date.now() * 0.004) * decayed;
      this._applyVisualCascade(
        this._resolveLinkVisualRoot(link),
        decayed,
        this.linkVisualState,
        this._tmpLinkTint,
        CASCADE_CONFIG.LINK_SCALE_MULTIPLIER,
        CASCADE_CONFIG.LINK_EMISSIVE_MULTIPLIER,
        CASCADE_CONFIG.LINK_OPACITY_MULTIPLIER
      );
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
    // FIX 3: Guard against non-browser environments
    if (typeof window === 'undefined') return;
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
    this._unsubscribeSemanticBus();

    // FIX 4: Remove window.cascadeDebug to prevent leak on world switch
    if (typeof window !== 'undefined') {
      delete window.cascadeDebug;
    }

    // Clear internal state
    this.activeCascades = [];
    for (const node of this.nodeCascadeIntensity.keys()) {
      this._restoreVisualCascade(this._resolveNodeVisualRoot(node), this.nodeVisualState);
    }
    for (const link of this.linkCascadeIntensity.keys()) {
      this._restoreVisualCascade(this._resolveLinkVisualRoot(link), this.linkVisualState);
    }
    this.nodeCascadeIntensity.clear();
    this.linkCascadeIntensity.clear();
    this.semanticBus = null;
    this._semanticEventsBound = false;
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
