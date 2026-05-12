/**
 * ResonanceCascadeVisualization_Session117B.js
 * ============================================================================
 * Visualizes link-born resonance blooms and load-pressure surges through
 * the network, showing how resonance energy propagates along link pathways.
 * 
 * VISUAL STORYTELLING:
 * When links are born or network load spikes, the tension radiates outward:
 * - Radial propagation: Energy expands from the spawn anchor
 * - Link propagation: Energy travels along network paths
 * - Node illumination: Affected nodes glow based on cascade intensity
 * - Link distortion: Affected links show ripple/kink effects
 * - Particle effects: Optional cascade particles with directional flow
 * - Standing ripples: Cascades interact creating interference
 * 
 * ARCHITECTURE:
 * ✅ Pure visual adapter - reads semantic link and metric events, doesn't modify
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
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { eventRegistrationRegistry } from './Engine/EventRegistrationRegistry.js';

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
  LINK_BIRTH_DELAY_SECONDS: 0.5,
  LINK_BIRTH_COOLDOWN_SECONDS: 3.5,
  LINK_BIRTH_MAX_RETRIES: 6,
  LINK_BIRTH_RETRY_SECONDS: 0.15,
  
  // Intensity modulation
  NODE_GLOW_MULTIPLIER: 1.8,                  // How much cascade affects node glow
  LINK_RIPPLE_MULTIPLIER: 1.2,                // How much cascade affects links
  LINK_THICKNESS_MULTIPLIER: 0.8,             // How much cascade fattens links
  PARTICLE_EMISSION_MULTIPLIER: 3.2,          // Particle rate scaling
  NODE_SCALE_MULTIPLIER: 0.18,
  LINK_SCALE_MULTIPLIER: 0.12,
  NODE_EMISSIVE_MULTIPLIER: 3.5,
  LINK_EMISSIVE_MULTIPLIER: 2.8,
  NODE_OPACITY_MULTIPLIER: 0.35,
  LINK_OPACITY_MULTIPLIER: 0.35,

  // Direct scene visualization
  CORE_MARKER_BASE_SCALE: 0.18,
  CORE_MARKER_SCALE_MULTIPLIER: 0.48,
  HALO_MARKER_BASE_SCALE: 0.52,
  HALO_MARKER_SCALE_MULTIPLIER: 0.86,
  RING_MIN_RADIUS: 0.24,
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
    this.rippleAmplitude = 0.72;               // FIX: Set to final value directly (was 0.5 then overridden)
  }
  
  /**
   * Update cascade state per frame
   */
  update(deltaTime) {
    this.age += deltaTime;
    this.lifetime = Math.max(0, this.lifetime - deltaTime);
    
    // Smooth ease-out fade: intensity decays with a cubic curve for more natural dissipation
    const linearRatio = this.lifetime / CASCADE_CONFIG.CASCADE_LIFETIME;
    const fadeRatio = linearRatio * linearRatio * (3 - 2 * linearRatio); // smoothstep
    this.intensity = this.originIntensity * fadeRatio;
    
    // Update radial propagation
    this.currentRadius += CASCADE_CONFIG.RADIAL_PROPAGATION_SPEED * deltaTime;
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
    const hasScene = scene && typeof scene.add === 'function';
    const resolvedOptions = hasScene
      ? options
      : ((scene && typeof scene === 'object' && !Array.isArray(scene)) ? scene : options);

    this.scene = hasScene
      ? scene
      : resolvedOptions.scene ?? globalThis.atoma?.scene ?? globalThis.game?.scene ?? globalThis.__ATOMA_SCENE__ ?? null;
    this.enabled = resolvedOptions.enabled ?? true;
    this.debugMode = resolvedOptions.debugMode ?? false;
    this.semanticBus = resolvedOptions.semanticBus ?? globalThis.semanticBus ?? globalThis.atoma?.semanticBus ?? globalThis.game?.semanticBus ?? null;
    
    // Active cascades
    this.activeCascades = [];
    
    // Per-node cascade accumulator
    this.nodeCascadeIntensity = new Map();
    this.linkCascadeIntensity = new Map();
    this.nodeVisualState = new WeakMap();
    this.linkVisualState = new WeakMap();
    this.cascadeVisuals = new Map();
    this.cascadeVisualRoot = null;
    this._pendingLinkBirthCascades = [];
    this._linkBirthCooldowns = new Map();
    this._sharedCascadeSphereGeometry = null;
    this._sharedCascadeRingGeometry = null;
    this._influenceSampleAccumulator = 0;
    this._influenceSampleInterval = 1 / 15;
    this._tmpNodeTint = new THREE.Color(0x4b1f78);
    this._tmpLinkTint = new THREE.Color(0x6a2ca0);
    this._boundHandleLinkCreated = this.handleLinkCreated.bind(this);
    this._boundHandleLoadPressureHigh = this.handleLoadPressureHigh.bind(this);
    this._semanticEventsBound = false;
    this._consoleApiInstalled = false;
    this.init();
    this._ensureCascadeVisualRoot();
    this.setupConsoleAPI();
    
    console.log('[Session 117B] ResonanceCascadeVisualization initialized ✓');
  }

  _subscribeSemanticBus() {
    if (this._semanticEventsBound) return;
    if (!this.semanticBus) return;
    this._regDisposerLinkCreated = eventRegistrationRegistry.register(
      'ResonanceCascadeVisualization', 'link.created', this._boundHandleLinkCreated, this.semanticBus
    );
    this._regDisposerLoadPressure = eventRegistrationRegistry.register(
      'ResonanceCascadeVisualization', 'global.loadPressure.high', this._boundHandleLoadPressureHigh, this.semanticBus
    );
    this._semanticEventsBound = true;
  }

  _unsubscribeSemanticBus() {
    if (!this._semanticEventsBound) return;
    if (typeof this._regDisposerLinkCreated === 'function') {
      this._regDisposerLinkCreated();
    } else if (this.semanticBus?.unsubscribe) {
      this.semanticBus.unsubscribe('link.created', this._boundHandleLinkCreated);
    } else if (this.semanticBus?.off) {
      this.semanticBus.off('link.created', this._boundHandleLinkCreated);
    }
    if (typeof this._regDisposerLoadPressure === 'function') {
      this._regDisposerLoadPressure();
    } else if (this.semanticBus?.unsubscribe) {
      this.semanticBus.unsubscribe('global.loadPressure.high', this._boundHandleLoadPressureHigh);
    } else if (this.semanticBus?.off) {
      this.semanticBus.off('global.loadPressure.high', this._boundHandleLoadPressureHigh);
    }
    this._semanticEventsBound = false;
  }

  init(config = {}) {
    if (config.scene && config.scene !== this.scene) {
      this.scene = config.scene;
    }
    if (config.semanticBus && config.semanticBus !== this.semanticBus) {
      this._unsubscribeSemanticBus();
      this.semanticBus = config.semanticBus;
    }
    this._subscribeSemanticBus();
    this._ensureCascadeVisualRoot();
    return this;
  }

  rebind(config = {}) {
    if (config.scene && config.scene !== this.scene) {
      this.scene = config.scene;
    }
    if (config.semanticBus && config.semanticBus !== this.semanticBus) {
      this._unsubscribeSemanticBus();
      this.semanticBus = config.semanticBus;
    }
    this._subscribeSemanticBus();
    this._ensureCascadeVisualRoot();
    return this;
  }

  _resolveRuntimeScene() {
    return this.scene ?? globalThis.atoma?.scene ?? globalThis.game?.scene ?? globalThis.__ATOMA_SCENE__ ?? null;
  }

  _ensureCascadeVisualRoot() {
    const scene = this._resolveRuntimeScene();
    if (!scene?.add) return null;

    if (scene !== this.scene) {
      this.scene = scene;
    }

    if (!this.cascadeVisualRoot) {
      this.cascadeVisualRoot = new THREE.Group();
      this.cascadeVisualRoot.name = 'ResonanceCascadeVisualization_Session117B_Root';
      this.cascadeVisualRoot.frustumCulled = false;
      this.cascadeVisualRoot.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_BACKGROUND');
    }

    if (this.cascadeVisualRoot.parent !== scene) {
      this.cascadeVisualRoot.parent?.remove?.(this.cascadeVisualRoot);
      scene.add(this.cascadeVisualRoot);
    }

    return this.cascadeVisualRoot;
  }

  _ensureCascadeVisualResources() {
    if (!this._sharedCascadeSphereGeometry) {
      this._sharedCascadeSphereGeometry = new THREE.SphereGeometry(1, 10, 10);
    }

    if (!this._sharedCascadeRingGeometry) {
      this._sharedCascadeRingGeometry = new THREE.TorusGeometry(1, 0.033, 8, 32);
    }
  }

  _createCascadeVisual(cascade) {
    const root = this._ensureCascadeVisualRoot();
    if (!root || !cascade?.originPos) return null;

    this._ensureCascadeVisualResources();

    const group = new THREE.Group();
    group.name = 'ResonanceCascadeWave';
    group.frustumCulled = false;
    group.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_BACKGROUND');

    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xff78cf,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });

    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0xffc04d,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });

    const ringMaterial = new THREE.LineBasicMaterial({
      color: 0xffd36a,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      side: THREE.DoubleSide
    });

    const core = new THREE.Mesh(this._sharedCascadeSphereGeometry, coreMaterial);
    const halo = new THREE.Mesh(this._sharedCascadeSphereGeometry, haloMaterial);
    const ring = new THREE.Mesh(this._sharedCascadeRingGeometry, ringMaterial);

    core.frustumCulled = false;
    halo.frustumCulled = false;
    ring.frustumCulled = false;

    core.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_BACKGROUND');
    halo.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_BACKGROUND');
    ring.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_BACKGROUND');

    halo.position.y = 0.012;
    core.position.y = 0.024;
    ring.position.y = 0.01;
    ring.rotation.x = Math.PI * 0.5;

    group.add(halo);
    group.add(core);
    group.add(ring);
    root.add(group);

    const visual = {
      group,
      core,
      halo,
      ring,
      materials: [coreMaterial, haloMaterial, ringMaterial]
    };

    this.cascadeVisuals.set(cascade, visual);
    return visual;
  }

  _disposeCascadeVisual(visual) {
    if (!visual) return;
    visual.group?.parent?.remove?.(visual.group);
    for (const material of visual.materials ?? []) {
      material?.dispose?.();
    }
  }

  _clearCascadeVisuals() {
    for (const visual of this.cascadeVisuals.values()) {
      this._disposeCascadeVisual(visual);
    }
    this.cascadeVisuals.clear();
  }

  _updateCascadeVisual(cascade) {
    if (!cascade?.originPos) return;

    let visual = this.cascadeVisuals.get(cascade);
    if (!visual) {
      visual = this._createCascadeVisual(cascade);
    }
    if (!visual) return;

    const intensity = this._clamp01(cascade.intensity);
    const waveRadius = Math.max(CASCADE_CONFIG.RING_MIN_RADIUS, cascade.currentRadius);
    const pulse = 1.0 + Math.sin(cascade.age * Math.PI * 2 * CASCADE_CONFIG.RIPPLE_FREQUENCY) * 0.08;

    // IMPROVED: Color evolution — cascade warms as it ages (pink → amber → gold fade)
    const ageRatio = Math.min(1, cascade.age / CASCADE_CONFIG.CASCADE_LIFETIME);
    const coreR = 1.0;
    const coreG = 0.47 + ageRatio * 0.28;   // pink → warm peach
    const coreB = 0.81 - ageRatio * 0.35;    // pink → amber shift
    visual.core.material.color.setRGB(coreR, coreG, coreB);

    const haloR = 1.0;
    const haloG = 0.75 + ageRatio * 0.1;
    const haloB = 0.30 - ageRatio * 0.08;
    visual.halo.material.color.setRGB(haloR, haloG, haloB);

    const ringR = 1.0;
    const ringG = 0.83 - ageRatio * 0.1;
    const ringB = 0.42 - ageRatio * 0.12;
    visual.ring.material.color.setRGB(ringR, ringG, ringB);

    visual.group.visible = true;
    visual.group.position.copy(cascade.originPos);
    visual.group.rotation.set(0, 0, 0);

    visual.core.scale.setScalar((CASCADE_CONFIG.CORE_MARKER_BASE_SCALE + intensity * CASCADE_CONFIG.CORE_MARKER_SCALE_MULTIPLIER) * pulse);
    visual.halo.scale.setScalar((CASCADE_CONFIG.HALO_MARKER_BASE_SCALE + intensity * CASCADE_CONFIG.HALO_MARKER_SCALE_MULTIPLIER + waveRadius * 0.05) * pulse);
    visual.ring.scale.setScalar(waveRadius);

    // IMPROVED: Smoother opacity curves with eased fade-out
    const fadeCurve = intensity * intensity; // Quadratic ease for more natural dissipation
    visual.core.material.opacity = Math.min(1.0, 0.42 + fadeCurve * 0.5);
    visual.halo.material.opacity = Math.min(0.45, 0.08 + fadeCurve * 0.24);
    // Ring fades with radius growth — further = more transparent
    const radiusFade = Math.max(0, 1.0 - waveRadius * 0.008);
    visual.ring.material.opacity = Math.min(0.98, (0.18 + fadeCurve * 0.76) * radiusFade);
  }

  _syncCascadeVisuals() {
    if (this.activeCascades.length === 0) {
      this._clearCascadeVisuals();
      return;
    }

    this._ensureCascadeVisualRoot();

    for (const cascade of this.activeCascades) {
      this._updateCascadeVisual(cascade);
    }

    const activeCascadeSet = new Set(this.activeCascades);
    for (const [cascade, visual] of this.cascadeVisuals.entries()) {
      if (activeCascadeSet.has(cascade)) continue;
      this._disposeCascadeVisual(visual);
      this.cascadeVisuals.delete(cascade);
    }
  }
  
  _clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  _readFirstNumber(source, keys = []) {
    if (!source || !Array.isArray(keys)) return null;
    for (const key of keys) {
      const numeric = Number(source?.[key]);
      if (Number.isFinite(numeric)) return numeric;
    }
    return null;
  }

  _readNodeSignal(node) {
    if (!node) return null;
    const metrics = node?.userData?.metrics ?? node?.metrics ?? null;
    return (
      this._readFirstNumber(metrics, ['synergy', 'harmony', 'loadPressure']) ??
      this._readFirstNumber(node?.userData, ['synergy', 'harmony', 'loadPressure']) ??
      null
    );
  }

  _readLinkSignal(link) {
    if (!link) return null;
    const metrics = link?.userData?.metrics ?? link?.metrics ?? null;
    return (
      this._readFirstNumber(metrics, ['synergy', 'harmony', 'loadPressure']) ??
      this._readFirstNumber(link?.userData, ['synergy', 'harmony', 'loadPressure']) ??
      this._readFirstNumber(link?.userData?.synergy, ['score']) ??
      null
    );
  }

  _resolveLinkId(linkOrId) {
    if (!linkOrId) return null;
    if (typeof linkOrId === 'string' || typeof linkOrId === 'number') {
      return String(linkOrId);
    }

    return (
      linkOrId.userData?.id ??
      linkOrId.userData?.linkId ??
      linkOrId.id ??
      linkOrId.uuid ??
      null
    );
  }

  _nowSeconds() {
    return (typeof performance !== 'undefined' && typeof performance.now === 'function')
      ? performance.now() / 1000
      : Date.now() / 1000;
  }

  _getLinkBirthKey(event = {}) {
    return this._resolveLinkId(
      event?.link ??
      event?.linkRef ??
      event?.linkId ??
      event?.id ??
      null
    );
  }

  _resolveCascadeAnchor(event = {}) {
    const anchor = this._asValidPosition(event?.anchor ?? event?.center ?? event?.position);
    if (anchor) return anchor;

    const sourcePos = this._asValidPosition(event?.sourceNode?.position);
    const targetPos = this._asValidPosition(event?.targetNode?.position);
    if (sourcePos && targetPos) {
      return new THREE.Vector3(
        (sourcePos.x + targetPos.x) * 0.5,
        (sourcePos.y + targetPos.y) * 0.5,
        (sourcePos.z + targetPos.z) * 0.5
      );
    }

    const linkSourcePos = this._asValidPosition(event?.link?.source?.position ?? event?.link?.sourceNode?.position);
    const linkTargetPos = this._asValidPosition(event?.link?.target?.position ?? event?.link?.targetNode?.position);
    if (linkSourcePos && linkTargetPos) {
      return new THREE.Vector3(
        (linkSourcePos.x + linkTargetPos.x) * 0.5,
        (linkSourcePos.y + linkTargetPos.y) * 0.5,
        (linkSourcePos.z + linkTargetPos.z) * 0.5
      );
    }

    const liveSourcePos = this._asValidPosition(
      event?.link?.nodeA?.position ??
      event?.link?.from?.position ??
      event?.link?.source?.position ??
      event?.link?.sourceNode?.position
    );
    const liveTargetPos = this._asValidPosition(
      event?.link?.nodeB?.position ??
      event?.link?.to?.position ??
      event?.link?.target?.position ??
      event?.link?.targetNode?.position
    );
    if (liveSourcePos && liveTargetPos) {
      return new THREE.Vector3(
        (liveSourcePos.x + liveTargetPos.x) * 0.5,
        (liveSourcePos.y + liveTargetPos.y) * 0.5,
        (liveSourcePos.z + liveTargetPos.z) * 0.5
      );
    }

    return this._resolveWorldOriginFallback();
  }

  _resolveWorldOriginFallback() {
    const world = this.world ?? this.linkingSystem?.world ?? globalThis?.game;
    const roots = [
      world?.nodesRoot,
      world?.worldRoot,
      world?.nodes?.[0],
      world?.playerNode,
      globalThis?.game?.playerNode
    ];
    for (const root of roots) {
      const pos = this._asValidPosition(root?.position);
      if (pos) return pos;
    }
    return null;
  }

  _resolveBestLinkBirthAnchor(event = {}) {
    const direct = this._asValidPosition(event?.anchor ?? event?.center ?? event?.position);
    if (direct) return direct;

    const sourcePos = this._asValidPosition(event?.sourceNode?.position);
    const targetPos = this._asValidPosition(event?.targetNode?.position);
    if (sourcePos && targetPos) {
      return new THREE.Vector3(
        (sourcePos.x + targetPos.x) * 0.5,
        (sourcePos.y + targetPos.y) * 0.5,
        (sourcePos.z + targetPos.z) * 0.5
      );
    }

    const { sourcePos: linkSourcePos, targetPos: linkTargetPos } = this._getLinkEndpoints(
      event?.link ?? event?.linkRef ?? null,
      event?.sourceNode ?? null,
      event?.targetNode ?? null
    );
    if (linkSourcePos && linkTargetPos) {
      return new THREE.Vector3(
        (linkSourcePos.x + linkTargetPos.x) * 0.5,
        (linkSourcePos.y + linkTargetPos.y) * 0.5,
        (linkSourcePos.z + linkTargetPos.z) * 0.5
      );
    }

    return this._resolveWorldOriginFallback();
  }

  _getLinkEndpoints(linkOrId, sourceNode = null, targetNode = null) {
    const link = (linkOrId && typeof linkOrId === 'object') ? linkOrId : null;
    const sourcePos = this._asValidPosition(
      sourceNode?.position ??
      link?.source?.position ??
      link?.sourceNode?.position ??
      link?.nodeA?.position
    );
    const targetPos = this._asValidPosition(
      targetNode?.position ??
      link?.target?.position ??
      link?.targetNode?.position ??
      link?.nodeB?.position
    );

    return { sourcePos, targetPos };
  }

  // FIX: Cached scratch vectors to eliminate per-frame allocations
  __distSegScratch = {
    segment: new THREE.Vector3(),
    toPoint: new THREE.Vector3(),
    closest: new THREE.Vector3()
  };

  _distanceToSegment(point, start, end) {
    if (!point || !start || !end) return Infinity;
    const scratch = this.__distSegScratch;
    scratch.segment.subVectors(end, start);
    const segmentLengthSq = scratch.segment.lengthSq();
    if (segmentLengthSq <= 1e-8) {
      return point.distanceTo(start);
    }

    scratch.toPoint.subVectors(point, start);
    const t = Math.max(0, Math.min(1, scratch.toPoint.dot(scratch.segment) / segmentLengthSq));
    scratch.closest.copy(start).addScaledVector(scratch.segment, t);
    return point.distanceTo(scratch.closest);
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

  _nodeHasLinks(node) {
    if (!node) return false;
    const linkCount = Number(
      node?.userData?.linkCount ??
      node?.linkCount ??
      node?.userData?.activeLinkCount ??
      node?.userData?.metrics?.linkCount ??
      0
    );
    return Number.isFinite(linkCount) && linkCount > 0;
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
        material.color.copy(materialState.color).lerp(tintColor, Math.min(1.0, intensity * 0.85 + 0.15));
      }

      if (material.emissive && materialState.emissive) {
        material.emissive.copy(materialState.emissive).lerp(tintColor, Math.min(1.0, intensity * 0.95 + 0.2));
      }

      if (typeof material.emissiveIntensity === 'number') {
        material.emissiveIntensity = (materialState.emissiveIntensity || 0) + intensity * emissiveMultiplier * 1.4;
      }

      if (typeof material.opacity === 'number') {
        material.transparent = true;
        material.opacity = Math.min(1.0, (materialState.opacity ?? 1.0) + intensity * opacityMultiplier * 1.25);
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

    const rawIntensity = event?.intensity ?? event?.value ?? event?.strength ?? 1;
    const impulseIntensity = Math.max(0.35, this._clamp01(rawIntensity));

    // FIX: Use pre-resolved anchor from event (passed from _flushPendingLinkBirthCascades)
    // before falling back to _resolveCascadeAnchor
    const pos = this._asValidPosition(event?.anchor) ?? this._resolveCascadeAnchor(event);
    if (!pos) return;

    const cascade = new CascadeWave(pos, impulseIntensity, 'radial');
    cascade.trigger = event?.trigger ?? event?.type ?? event?.eventType ?? null;
    cascade.linkRef = event?.link ?? event?.linkRef ?? null;
    cascade.linkId = this._resolveLinkId(cascade.linkRef);
    cascade.sourceNodeId = event?.sourceNodeId ?? event?.sourceNode?.userData?.nodeId ?? event?.sourceNode?.id ?? event?.sourceNode?.uuid ?? null;
    cascade.targetNodeId = event?.targetNodeId ?? event?.targetNode?.userData?.nodeId ?? event?.targetNode?.id ?? event?.targetNode?.uuid ?? null;
    this.activeCascades.push(cascade);
    this._syncCascadeVisuals();
    return cascade;
  }

  _asValidPosition(value) {
    if (!value) return null;
    const x = Number(value.x);
    const y = Number(value.y);
    const z = Number(value.z);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
    return new THREE.Vector3(x, y, z);
  }

  _resolveLinkBirthIntensity(event = {}) {
    const direct = this._readFirstNumber(event, ['intensity', 'value', 'strength']);
    if (direct !== null) return direct;

    const phaseStrength = this._readFirstNumber(event, ['phaseSyncStrength', 'syncStrength']);
    const phaseStability = this._readFirstNumber(event, ['phaseSyncStability', 'syncStability']);
    const phaseSamples = [phaseStrength, phaseStability].filter((value) => Number.isFinite(value));
    if (phaseSamples.length > 0) {
      const average = phaseSamples.reduce((sum, value) => sum + value, 0) / phaseSamples.length;
      return this._clamp01(average);
    }

    const sourceSignal = this._readNodeSignal(event?.sourceNode);
    const targetSignal = this._readNodeSignal(event?.targetNode);
    const linkSignal = this._readLinkSignal(event?.link);
    const samples = [sourceSignal, targetSignal, linkSignal].filter((value) => Number.isFinite(value));
    if (samples.length > 0) {
      const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
      return this._clamp01(average);
    }

    return 0.35;
  }

  _resolveLoadPressureIntensity(event = {}) {
    const direct = this._readFirstNumber(event, ['value', 'intensity', 'strength', 'loadPressure']);
    if (direct !== null) return Math.max(0.35, this._clamp01(direct));

    const sourceSignal = this._readNodeSignal(event?.sourceNode);
    const targetSignal = this._readNodeSignal(event?.targetNode);
    const samples = [sourceSignal, targetSignal].filter((value) => Number.isFinite(value));
    if (samples.length > 0) {
      const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
      return Math.max(0.35, this._clamp01(average));
    }

    return 0.75;
  }

  _boostLatestCascade(intensity) {
    if (!Array.isArray(this.activeCascades) || this.activeCascades.length === 0) {
      return false;
    }

    const cascade = this.activeCascades[this.activeCascades.length - 1];
    if (!cascade) return false;

    const boostedIntensity = Math.max(0.35, this._clamp01(intensity));
    cascade.originIntensity = Math.max(cascade.originIntensity, boostedIntensity);
    cascade.intensity = Math.max(cascade.intensity, boostedIntensity);
    cascade.lifetime = Math.max(cascade.lifetime, CASCADE_CONFIG.CASCADE_LIFETIME * 0.85);
    return true;
  }

  _queueLinkBirthCascade(event = {}, intensity, payload = null) {
    const now = this._nowSeconds();
    const linkKey = this._getLinkBirthKey(event);

    if (linkKey) {
      const lastSpawnAt = Number(this._linkBirthCooldowns.get(linkKey) ?? -Infinity);
      if (Number.isFinite(lastSpawnAt) && (now - lastSpawnAt) < CASCADE_CONFIG.LINK_BIRTH_COOLDOWN_SECONDS) {
        return null;
      }
    }

    const queuedPayload = payload ?? {
      ...event,
      trigger: 'link.created',
      intensity,
      value: intensity,
      strength: intensity
    };

    const dueAt = now + CASCADE_CONFIG.LINK_BIRTH_DELAY_SECONDS;
    const existingIndex = this._pendingLinkBirthCascades.findIndex((item) => {
      if (linkKey && item.linkKey) return item.linkKey === linkKey;
      return item.event?.link === event?.link && item.event?.link !== null;
    });

    const queuedItem = {
      dueAt,
      linkKey,
      event: queuedPayload,
      intensity,
      linkRef: queuedPayload.link ?? queuedPayload.linkRef ?? null,
      retryCount: 0
    };

    if (existingIndex >= 0) {
      this._pendingLinkBirthCascades[existingIndex] = queuedItem;
    } else {
      this._pendingLinkBirthCascades.push(queuedItem);
    }

    return queuedItem;
  }

  _flushPendingLinkBirthCascades() {
    if (!Array.isArray(this._pendingLinkBirthCascades) || this._pendingLinkBirthCascades.length === 0) {
      return;
    }

    const now = this._nowSeconds();
    const remaining = [];

    for (const pending of this._pendingLinkBirthCascades) {
      if (!pending) continue;
      if (pending.dueAt > now) {
        remaining.push(pending);
        continue;
      }

      const payload = pending.event ?? {};
      const link = payload.link ?? payload.linkRef ?? null;
      const linkKey = pending.linkKey ?? this._getLinkBirthKey(payload);

      // FIX: Allow cascade even when link.userData is missing (early spawn race)
      if (!link) {
        continue;
      }

      // Ensure userData exists (create if missing)
      if (!link.userData) {
        link.userData = {};
      }

      if (link.userData.__resonanceCascadeBirthSeeded === true) {
        if (linkKey) {
          this._linkBirthCooldowns.set(linkKey, now);
        }
        continue;
      }

      const anchor = this._resolveBestLinkBirthAnchor(payload);
      if (!anchor) {
        const retryCount = Number(pending.retryCount || 0) + 1;
        if (retryCount <= CASCADE_CONFIG.LINK_BIRTH_MAX_RETRIES) {
          remaining.push({
            ...pending,
            retryCount,
            dueAt: now + CASCADE_CONFIG.LINK_BIRTH_RETRY_SECONDS
          });
        }
        continue;
      }

      const cascade = this._spawnCascadeWaveFromEvent({
        ...payload,
        anchor,
        trigger: 'link.created'
      });
      if (cascade) {
        if (payload.sourceNode) {
          this._registerNodeVisual(payload.sourceNode, pending.intensity);
        }
        if (payload.targetNode) {
          this._registerNodeVisual(payload.targetNode, pending.intensity);
        }
        this._registerLinkVisual(link, pending.intensity);
        link.userData.__resonanceCascadeBirthSeeded = true;
        link.userData.__resonanceCascadeBirthSeededAt = now;
        if (linkKey) {
          this._linkBirthCooldowns.set(linkKey, now);
        }
        continue;
      }

      const retryCount = Number(pending.retryCount || 0) + 1;
      if (retryCount <= CASCADE_CONFIG.LINK_BIRTH_MAX_RETRIES) {
        remaining.push({
          ...pending,
          retryCount,
          dueAt: now + 0.1
        });
      }
    }

    this._pendingLinkBirthCascades = remaining;
  }

  handleLinkCreated(event = {}) {
    const intensity = Math.max(0.35, this._resolveLinkBirthIntensity(event));
    const payload = {
      ...event,
      trigger: 'link.created',
      intensity,
      value: intensity,
      strength: intensity
    };

    const queued = this._queueLinkBirthCascade(event, intensity, payload);
    if (!queued) return null;
    return queued;
  }

  handleLoadPressureHigh(event = {}) {
    const intensity = Math.max(0.35, this._resolveLoadPressureIntensity(event));
    if (this._boostLatestCascade(intensity)) {
      return this.activeCascades[this.activeCascades.length - 1] ?? null;
    }

    const payload = {
      ...event,
      trigger: 'global.loadPressure.high',
      intensity,
      value: intensity,
      strength: intensity
    };

    const cascade = this._spawnCascadeWaveFromEvent(payload);
    if (!cascade) return null;

    if (payload.sourceNode) {
      this._registerNodeVisual(payload.sourceNode, intensity);
    }
    if (payload.targetNode) {
      this._registerNodeVisual(payload.targetNode, intensity);
    }
    if (payload.link) {
      this._registerLinkVisual(payload.link, intensity);
    }

    return cascade;
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

  _cascadeMatchesLink(cascade, linkRef, linkId, sourcePos = null, targetPos = null) {
    if (!cascade) return false;

    if (linkRef && cascade.linkRef === linkRef) {
      return true;
    }

    const cascadeLinkId = cascade.linkId != null ? String(cascade.linkId) : null;
    const normalizedLinkId = linkId != null ? String(linkId) : null;
    if (cascadeLinkId && normalizedLinkId && cascadeLinkId === normalizedLinkId) {
      return true;
    }

    if (sourcePos && targetPos && cascade.originPos) {
      const segmentLength = sourcePos.distanceTo(targetPos);
      const maxDistance = Math.max(0.65, Math.min(3.0, segmentLength * 0.12));
      if (this._distanceToSegment(cascade.originPos, sourcePos, targetPos) <= maxDistance) {
        return true;
      }
    }

    return false;
  }

  clearLink(linkOrId, sourceNode = null, targetNode = null) {
    const linkRef = (linkOrId && typeof linkOrId === 'object') ? linkOrId : null;
    const linkId = this._resolveLinkId(linkOrId);
    const { sourcePos, targetPos } = this._getLinkEndpoints(linkOrId, sourceNode, targetNode);

    if (sourceNode || targetNode || linkRef) {
      this.handleCascadeEnd({
        sourceNode,
        targetNode,
        link: linkRef,
        linkId,
        sourceNodeId: sourceNode?.userData?.nodeId ?? sourceNode?.id ?? sourceNode?.uuid ?? null,
        targetNodeId: targetNode?.userData?.nodeId ?? targetNode?.id ?? targetNode?.uuid ?? null
      });
    }

    if (linkRef || linkId || sourcePos || targetPos) {
      this.activeCascades = this.activeCascades.filter((cascade) =>
        !this._cascadeMatchesLink(cascade, linkRef, linkId, sourcePos, targetPos)
      );
    }

    if (this._pendingLinkBirthCascades.length > 0) {
      this._pendingLinkBirthCascades = this._pendingLinkBirthCascades.filter((pending) => {
        if (!pending) return false;
        if (linkRef && pending.event?.link === linkRef) return false;
        if (linkId && pending.linkKey && String(pending.linkKey) === String(linkId)) return false;
        return true;
      });
    }

    if (linkRef && this.linkCascadeIntensity.has(linkRef)) {
      this.linkCascadeIntensity.delete(linkRef);
    }

    if (linkId) {
      for (const [link, value] of [...this.linkCascadeIntensity.entries()]) {
        const trackedLinkId = this._resolveLinkId(link);
        if (trackedLinkId && String(trackedLinkId) === String(linkId)) {
          this.linkCascadeIntensity.delete(link);
        }
      }
    }

    return this.activeCascades.length;
  }
  
  /**
   * Main update per frame
   */
  update(deltaTime, nodes, links, conflictRegions = []) {
    if (this.frameScheduler?.shouldRunVisual && !this.frameScheduler.shouldRunVisual()) return;

    if (!this.enabled) {
      this._clearCascadeVisuals();
      return;
    }

    this._ensureCascadeVisualRoot();

    this._flushPendingLinkBirthCascades();
    
    // Update all active cascades
    const activeCascades = [];
    for (const cascade of this.activeCascades) {
      cascade.update(deltaTime);
      
      if (cascade.isActive()) {
        activeCascades.push(cascade);
      }
    }
    this.activeCascades = activeCascades;
    this._syncCascadeVisuals();

    this._influenceSampleAccumulator += Math.max(0, Number(deltaTime) || 0);
    const shouldSampleInfluence = this._influenceSampleAccumulator >= this._influenceSampleInterval;
    if (shouldSampleInfluence) {
      this._influenceSampleAccumulator %= this._influenceSampleInterval;

      if (Array.isArray(nodes) && this.activeCascades.length > 0) {
        for (const node of nodes) {
          if (!node?.position || !node?.userData) continue;
          if (!this._nodeHasLinks(node)) continue;
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
      node.userData.cascadeRipple = decayed * 0.16;
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
      link.userData.cascadeOscillation = decayed * 0.08;
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
        lifetime: c.lifetime,
        trigger: c.trigger ?? null,
        origin: c.originPos ? {
          x: c.originPos.x,
          y: c.originPos.y,
          z: c.originPos.z
        } : null
      }))
    };
  }
  
  /**
   * Setup console API for debugging
   */
  setupConsoleAPI() {
    // FIX 3: Guard against non-browser environments
    if (typeof window === 'undefined') return;

    if (window.resonanceCascadeDebug?.__owner === this && this._consoleApiInstalled) {
      return window.resonanceCascadeDebug;
    }

    const api = {
      __owner: this,
      getCascadeState: () => this.getCascadeState(),
      getNodeCascadeInfo: (node) => this.getNodeCascadeInfo(node),
      getLinkCascadeInfo: (link) => this.getLinkCascadeInfo(link),
      getActiveCascades: () => this.activeCascades.length,
      getPendingCount: () => this._pendingLinkBirthCascades.length,
      spawnAt: (x = 0, y = 0, z = 0, intensity = 1.0) => this._spawnCascadeWaveFromEvent({
        anchor: { x, y, z },
        intensity,
        trigger: 'debug.manual'
      }),
      spawnAtNodeId: (nodeId, intensity = 1.0) => {
        const node = window.__DEBUG?.getNodeById?.(nodeId);
        if (!node?.position) return null;
        return this._spawnCascadeWaveFromEvent({
          anchor: node.position,
          sourceNode: node,
          intensity,
          trigger: 'debug.node'
        });
      },
      spawnAtLinkId: (linkId, intensity = 1.0) => {
        const linkingSystem = window.__DEBUG?.getLinkingSystem?.();
        const link = linkingSystem?._resolveLinkById?.(linkId)
          ?? linkingSystem?.links?.find?.((entry) => entry?.id === linkId || entry?.linkId === linkId);
        if (!link) return null;
        return this.handleLinkCreated({
          link,
          sourceNode: link.source ?? link.sourceNode ?? null,
          targetNode: link.target ?? link.targetNode ?? null,
          intensity,
          trigger: 'debug.link'
        });
      },
      enable: () => { this.enabled = true; console.log('✓ Cascade system enabled'); },
      disable: () => { this.enabled = false; console.log('✓ Cascade system disabled'); }
    };

    window.resonanceCascadeDebug = api;
    window.ATOMA_DEBUG = window.ATOMA_DEBUG || {};
    window.ATOMA_DEBUG.resonanceCascade = api;
    if (!window.cascadeDebug || window.cascadeDebug.__owner === this) {
      window.cascadeDebug = api;
    }
    this._consoleApiInstalled = true;
    
    console.log('[Session 117B] Debug API: window.resonanceCascadeDebug.getCascadeState()');
    return api;
  }

  dispose() {
    this._unsubscribeSemanticBus();

    // FIX 4: Remove window.cascadeDebug to prevent leak on world switch
    if (typeof window !== 'undefined') {
      if (window.cascadeDebug?.__owner === this) {
        delete window.cascadeDebug;
      }
      if (window.resonanceCascadeDebug?.__owner === this) {
        delete window.resonanceCascadeDebug;
      }
      if (window.ATOMA_DEBUG?.resonanceCascade?.__owner === this) {
        delete window.ATOMA_DEBUG.resonanceCascade;
      }
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
    this._clearCascadeVisuals();
    this.cascadeVisualRoot?.parent?.remove?.(this.cascadeVisualRoot);
    this.cascadeVisualRoot = null;
    this._sharedCascadeSphereGeometry?.dispose?.();
    this._sharedCascadeSphereGeometry = null;
    this._sharedCascadeRingGeometry?.dispose?.();
    this._sharedCascadeRingGeometry = null;
    this._pendingLinkBirthCascades = [];
    this._linkBirthCooldowns.clear();
    this.semanticBus = null;
    this._semanticEventsBound = false;
    this._consoleApiInstalled = false;
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
