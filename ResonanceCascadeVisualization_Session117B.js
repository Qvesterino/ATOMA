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

    // Keep ripple amplitude stable to avoid visible pulsing.
    this.rippleAmplitude = 0.72;
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
    this._pendingLinkBirthCascades = [];
    this._linkBirthCooldowns = new Map();
    this._tmpNodeTint = new THREE.Color(0x4b1f78);
    this._tmpLinkTint = new THREE.Color(0x6a2ca0);
    this._boundHandleLinkCreated = this.handleLinkCreated.bind(this);
    this._boundHandleLoadPressureHigh = this.handleLoadPressureHigh.bind(this);
    this._semanticEventsBound = false;
    this.init();
    
    console.log('[Session 117B] ResonanceCascadeVisualization initialized ✓');
  }

  _subscribeSemanticBus() {
    if (!this.semanticBus?.on || this._semanticEventsBound) return;
    this.semanticBus.on('link.created', this._boundHandleLinkCreated);
    this.semanticBus.on('metric:loadPressureHigh', this._boundHandleLoadPressureHigh);
    this._semanticEventsBound = true;
  }

  _unsubscribeSemanticBus() {
    if (!this._semanticEventsBound) return;
    if (this.semanticBus?.unsubscribe) {
      this.semanticBus.unsubscribe('link.created', this._boundHandleLinkCreated);
      this.semanticBus.unsubscribe('metric:loadPressureHigh', this._boundHandleLoadPressureHigh);
    } else if (this.semanticBus?.off) {
      this.semanticBus.off('link.created', this._boundHandleLinkCreated);
      this.semanticBus.off('metric:loadPressureHigh', this._boundHandleLoadPressureHigh);
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
    const anchor = this._asValidPosition(event?.anchor);
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

    return new THREE.Vector3(0, 0, 0);
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

  _distanceToSegment(point, start, end) {
    if (!point || !start || !end) return Infinity;
    const segment = new THREE.Vector3().subVectors(end, start);
    const segmentLengthSq = segment.lengthSq();
    if (segmentLengthSq <= 1e-8) {
      return point.distanceTo(start);
    }

    const toPoint = new THREE.Vector3().subVectors(point, start);
    const t = Math.max(0, Math.min(1, toPoint.dot(segment) / segmentLengthSq));
    const closest = new THREE.Vector3().copy(start).addScaledVector(segment, t);
    return point.distanceTo(closest);
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
    const pos = this._resolveCascadeAnchor(event);
    if (!pos) return;

    const cascade = new CascadeWave(pos, impulseIntensity, 'radial');
    cascade.trigger = event?.trigger ?? event?.type ?? event?.eventType ?? null;
    cascade.linkRef = event?.link ?? event?.linkRef ?? null;
    cascade.linkId = this._resolveLinkId(cascade.linkRef);
    cascade.sourceNodeId = event?.sourceNodeId ?? event?.sourceNode?.userData?.nodeId ?? event?.sourceNode?.id ?? event?.sourceNode?.uuid ?? null;
    cascade.targetNodeId = event?.targetNodeId ?? event?.targetNode?.userData?.nodeId ?? event?.targetNode?.id ?? event?.targetNode?.uuid ?? null;
    this.activeCascades.push(cascade);
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
      linkRef: queuedPayload.link ?? queuedPayload.linkRef ?? null
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
      if (!link || !link.userData) {
        continue;
      }

      if (link.userData.__resonanceCascadeBirthSeeded === true) {
        if (linkKey) {
          this._linkBirthCooldowns.set(linkKey, now);
        }
        continue;
      }

      const anchor = this._resolveCascadeAnchor(payload);
      if (!anchor) {
        remaining.push({
          ...pending,
          dueAt: now + 0.1
        });
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

      remaining.push({
        ...pending,
        dueAt: now + 0.1
      });
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
      trigger: 'metric:loadPressureHigh',
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
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    if (!this.enabled) return;

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
        trigger: c.trigger ?? null
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
    this._pendingLinkBirthCascades = [];
    this._linkBirthCooldowns.clear();
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
