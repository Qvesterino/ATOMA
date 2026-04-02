/**
 * LinkMicroImpulseAdapter_v1.js
 * ============================================================================
 * Event-Driven Micro-Impulse Visual System for ATOMA Links
 * 
 * DESIGN PHILOSOPHY:
 * - Listens to events; does NOT drive gameplay
 * - Spawns short-lived visual impulses on link surface only
 * - Zero per-frame allocations (uses cached buffers)
 * - Adapter pattern: purely visual, no gameplay coupling
 * - Graceful degradation if methods missing
 * 
 * TRIGGER EVENTS:
 * ✓ link.created — Success flash along link
 * ✓ link:synergyThreshold — Intensity boost visible
 * ✓ link:harmonicLock — Resonance shimmer on link
 * ✓ network:corruptionSpread — Jittery asymmetric flashes
 * 
 * VISUAL FORM:
 * - Duration: 40–120 ms
 * - Shape: Thin arcs, zig-zags, pin-point sparks
 * - Confinement: ALWAYS on link surface (never detached)
 * - No: clouds, trails, continuous sparks, random emission
 * 
 * STATE MAPPING:
 * ✨ Harmony → Clean, crisp impulses
 * 🟢 Synergy → Increased intensity (brighter, longer)
 * 🔴 Corruption → Asymmetry + hue shift + jitter
 * ⚡ stability → Suppressed impulses (shorter lifespan)
 * 
 * SEMANTIC PHASE INPUT:
 * - metric.phase.changed is the preferred normalized signal
 * - legacy threshold events remain as compatibility fallback
 * 
 * ARCHITECTURE:
 * - ImpulseFactory: Creates impulse visuals from cached geometry
 * - ImpulseManager: Tracks active impulses, auto-expires
 * - EventListener: Captures trigger events from linking system
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { applyLinkRenderLayer, getLinkRenderLayerOrder } from './LinkRenderLayerPolicy.js';

const MICRO_IMPULSE_LAYER = VisualHierarchyRegistry?.LAYER_LINK_SPARKS ?? 'LINK_SPARKS';
const MICRO_IMPULSE_RENDER_ORDER = (() => {
  const canonicalOrder = getLinkRenderLayerOrder(MICRO_IMPULSE_LAYER);
  if (Number.isFinite(canonicalOrder)) return canonicalOrder;
  const registryOrder = VisualHierarchyRegistry.getRenderOrder(MICRO_IMPULSE_LAYER);
  if (Number.isFinite(registryOrder)) return registryOrder;
  return 240;
})();
const MICRO_IMPULSE_BASE_COLORS = {
  arc: 0x00ffff,
  zigzag: 0x00ff88,
  spark: 0xffff00,
};
const MICRO_IMPULSE_CORRUPTION_COLOR = new THREE.Color(0xff3366);
const MICRO_IMPULSE_COLOR = new THREE.Color();

function syncMicroImpulseMaterial(renderer, scene, camera, geometry, material) {
  const state = this?.userData?.microImpulseState;
  if (!state || !material) return;

  const now = Date.now();
  const elapsed = now - state.startTime;
  const duration = Math.max(1, state.duration || 1);
  const progress = elapsed / duration;

  if (progress >= 1.0) {
    material.opacity = 0;
    return;
  }

  let fade = 1.0;
  const fadeStart = 0.7;
  if (progress > fadeStart) {
    fade = 1.0 - ((progress - fadeStart) / (1.0 - fadeStart));
  }

  MICRO_IMPULSE_COLOR.setHex(state.baseColorHex ?? MICRO_IMPULSE_BASE_COLORS.spark);
  if (state.corruption > 0.3) {
    MICRO_IMPULSE_COLOR.lerp(MICRO_IMPULSE_CORRUPTION_COLOR, Math.min(1.0, state.corruption));
  }

  material.color.copy(MICRO_IMPULSE_COLOR);
  material.opacity = Math.max(0, (state.baseOpacity ?? 1.0) * fade);
}

/**
 * Impulse Factory — Creates reusable electrical impulse visuals
 */
class ImpulseFactory {
  constructor() {
    // === CACHED GEOMETRIES (zero allocations) ===
    this.geometries = {
      arc: new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.BufferAttribute(this.createArcPositions(), 3)
      ),
      zigzag: new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.BufferAttribute(this.createZigzagPositions(), 3)
      ),
      spark: new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.BufferAttribute(this.createSparkPositions(), 3)
      ),
    };

    // === MATERIAL CACHE (reusable) ===
    this.materials = {
      arc: new THREE.LineBasicMaterial({
        color: 0x00ffff,
        linewidth: 1,
        transparent: true,
        fog: false,
        depthTest: true,
        depthWrite: false,
      }),
      zigzag: new THREE.LineBasicMaterial({
        color: 0x00ff88,
        linewidth: 1.5,
        transparent: true,
        fog: false,
        depthTest: true,
        depthWrite: false,
      }),
      spark: new THREE.PointsMaterial({
        color: 0xffff00,
        size: 0.08,
        transparent: true,
        fog: false,
        depthTest: true,
        depthWrite: false,
      }),
    };
  }

  /**
   * Create arc geometry positions (thin curved path)
   */
  createArcPositions() {
    const points = [];
    const segments = 12;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = Math.PI * t;
      const x = Math.cos(angle) * 0.5;
      const y = Math.sin(angle) * 0.3;
      const z = (Math.random() - 0.5) * 0.1;
      points.push(x, y, z);
    }
    return new Float32Array(points);
  }

  /**
   * Create zig-zag geometry positions (erratic path along strand tangent)
   */
  createZigzagPositions() {
    const points = [];
    const segments = 8;
    let x = 0;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      x += (Math.random() - 0.5) * 0.15;
      const y = Math.sin(t * Math.PI * 2) * 0.2;
      const z = t * 0.4;
      points.push(x, y, z);
    }
    return new Float32Array(points);
  }

  /**
   * Create spark geometry positions (pin-point between strands)
   */
  createSparkPositions() {
    const points = [];
    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * 0.1;
      const y = Math.sin(angle) * 0.1;
      const z = (Math.random() - 0.5) * 0.15;
      points.push(x, y, z);
    }
    return new Float32Array(points);
  }

  /**
   * Create impulse visual (Line or Points)
   */
  createImpulse(shape, position, rotation, scale = 1.0) {
    const geometry = this.geometries[shape];
    const material = this.materials[shape];

    let visual;
    if (shape === 'spark') {
      visual = new THREE.Points(geometry, material);
    } else {
      visual = new THREE.Line(geometry, material);
    }

    visual.position.copy(position);
    visual.quaternion.copy(rotation);
    visual.scale.setScalar(scale);
    visual.frustumCulled = false;
    visual.renderOrder = MICRO_IMPULSE_RENDER_ORDER;
    applyLinkRenderLayer(visual, MICRO_IMPULSE_LAYER);

    const state = visual.userData || (visual.userData = {});
    state.microImpulseState = state.microImpulseState || {
      baseColorHex: MICRO_IMPULSE_BASE_COLORS[shape] ?? MICRO_IMPULSE_BASE_COLORS.spark,
      baseOpacity: 1.0,
      corruption: 0.0,
      startTime: 0,
      duration: 1,
    };
    visual.onBeforeRender = syncMicroImpulseMaterial;

    return visual;
  }
}

/**
 * Impulse Manager — Tracks active impulses with auto-expiry
 */
class ImpulseManager {
  constructor(scene, factory) {
    this.scene = scene;
    this.factory = factory;
    this.activeImpulses = [];
    this._attachRoot = scene || null;
    this.root = new THREE.Group();
    this.root.name = 'LinkMicroImpulseRoot';
    this.root.renderOrder = MICRO_IMPULSE_RENDER_ORDER;
    applyLinkRenderLayer(this.root, MICRO_IMPULSE_LAYER);
    this.ensureAttached();
  }

  ensureAttached(attachRoot = this._attachRoot) {
    if (!attachRoot || !this.root) return this.root;
    this._attachRoot = attachRoot;
    if (this.root.parent !== attachRoot) {
      attachRoot.add(this.root);
    }
    return this.root;
  }

  rebind({ scene = this.scene, worldRoot = null } = {}) {
    if (scene) {
      this.scene = scene;
    }
    const nextRoot = worldRoot || scene || this._attachRoot;
    if (nextRoot) {
      this.ensureAttached(nextRoot);
    }
    return this;
  }

  /**
   * Spawn a micro-impulse on a link
   */
  spawn(link, config = {}) {
    if (!link || !link.geometry) return null;

    const {
      shape = 'arc',
      duration = 80,
      intensity = 1.0,
      harmony = 1.0,
      synergy = 0.5,
      corruption = 0.0,
    } = config;

    const geometry = link.geometry;
    if (!geometry.attributes || !geometry.attributes.position) return null;

    const positions = geometry.attributes.position.array;
    const randomIndex = Math.floor(Math.random() * (positions.length / 3)) * 3;
    const localPos = new THREE.Vector3(
      positions[randomIndex],
      positions[randomIndex + 1],
      positions[randomIndex + 2]
    );

    const worldPos = localPos.applyMatrix4(link.matrixWorld);

    const rotation = new THREE.Quaternion();
    rotation.setFromAxisAngle(
      new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
      Math.random() * Math.PI * 2
    );

    let scale = 1.0;
    scale *= harmony * 0.8 + 0.2;
    scale *= 0.5 + synergy * 0.5;
    scale *= corruption > 0.5 ? 0.6 : 1.0;

    const visual = this.factory.createImpulse(shape, worldPos, rotation, scale);
    this.root.add(visual);

    if (corruption > 0.5) {
      visual.position.x += (Math.random() - 0.5) * 0.1 * corruption;
      visual.position.y += (Math.random() - 0.5) * 0.1 * corruption;
    }

    const userData = visual.userData || (visual.userData = {});
    const state = userData.microImpulseState || (userData.microImpulseState = {});
    state.baseColorHex = MICRO_IMPULSE_BASE_COLORS[shape] ?? MICRO_IMPULSE_BASE_COLORS.spark;
    state.baseOpacity = 1.0 * harmony * (0.5 + synergy * 0.5);
    state.corruption = corruption;
    state.startTime = Date.now();
    state.duration = duration * (1.0 - corruption * 0.3);

    const impulse = {
      visual,
      startTime: state.startTime,
      duration: state.duration,
      intensity,
      harmony,
      synergy,
      corruption,
    };

    this.activeImpulses.push(impulse);
    return impulse;
  }

  /**
   * Update active impulses (fade and expire)
   */
  update() {
    const now = Date.now();
    const toRemove = [];

    for (let i = 0; i < this.activeImpulses.length; i++) {
      const impulse = this.activeImpulses[i];
      const elapsed = now - impulse.startTime;
      const progress = elapsed / impulse.duration;

      if (progress >= 1.0) {
        impulse.visual.onBeforeRender = null;
        impulse.visual.parent?.remove(impulse.visual);
        toRemove.push(i);
      }
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.activeImpulses.splice(toRemove[i], 1);
    }
  }

  /**
   * Clear all active impulses
   */
  clear() {
    for (const impulse of this.activeImpulses) {
      impulse.visual.onBeforeRender = null;
      impulse.visual.parent?.remove(impulse.visual);
    }
    this.activeImpulses = [];
  }

  dispose() {
    this.clear();
    this.root.parent?.remove(this.root);
  }
}

/**
 * LinkMicroImpulseAdapter_v1 — Main event-driven adapter
 */
export class LinkMicroImpulseAdapter {
  constructor(scene) {
    this.scene = scene;
    this.factory = new ImpulseFactory();
    this.manager = new ImpulseManager(scene, this.factory);
    this.eventSource = null;
    this.linkingSystem = null;
    this.semanticBus = null;
    this._semanticUnsubscribers = [];
    this.enabled = true;
    this.debugMode = false;
    this.lastLinkCreatedTime = new Map();
    this.linkStateCache = new Map();
    this.recentSemanticSignals = new Map();
    this.semanticSignalDedupMs = 350;
  }

  rebind({ scene = this.scene, worldRoot = null } = {}) {
    if (scene) {
      this.scene = scene;
    }
    this.manager?.rebind?.({ scene, worldRoot });
    return this;
  }

  setEventSource(source) {
    if (!source) return;
    this.eventSource = source;
    this.hookEventListeners();
    if (!this.semanticBus && source.semanticBus) {
      this.setSemanticBus(source.semanticBus);
    }
  }

  setLinkingSystem(linkingSystem) {
    if (!linkingSystem) return;
    this.linkingSystem = linkingSystem;
  }

  setSemanticBus(semanticBus) {
    if (!semanticBus || this.semanticBus === semanticBus) return;
    this._unhookSemanticBusListeners();
    this.semanticBus = semanticBus;
    this.hookSemanticBusListeners();
  }

  hookEventListeners() {
    if (!this.eventSource) return;

    if (typeof this.eventSource.addEventListener === 'function') {
      this.eventSource.addEventListener('linkCreated', (e) => this.onLinkCreated(e));
      if (this.debugMode) console.log('[LinkMicroImpulseAdapter] Hooked via addEventListener');
      return;
    }
  }

  hookSemanticBusListeners() {
    if (!this.semanticBus) return;

    const subscribeFn =
      (typeof this.semanticBus.subscribe === 'function' && this.semanticBus.subscribe.bind(this.semanticBus)) ||
      (typeof this.semanticBus.on === 'function' && this.semanticBus.on.bind(this.semanticBus)) ||
      null;
    const unsubscribeFn =
      (typeof this.semanticBus.unsubscribe === 'function' && this.semanticBus.unsubscribe.bind(this.semanticBus)) ||
      (typeof this.semanticBus.off === 'function' && this.semanticBus.off.bind(this.semanticBus)) ||
      null;

    if (!subscribeFn) return;

    const bind = (tag, handler) => {
      const unsub = subscribeFn(tag, handler, { priority: this.semanticBus.priority?.NORMAL });
      if (typeof unsub === 'function') {
        this._semanticUnsubscribers.push(unsub);
      } else if (unsubscribeFn) {
        this._semanticUnsubscribers.push(() => unsubscribeFn(tag, handler));
      }
    };

    bind('link.created', (payload) => this.onLinkCreated({ detail: this._normalizePayload(payload) }));
    bind('link:synergyThreshold', (payload) => this.onSynergyThreshold({ detail: this._normalizePayload(payload) }));
    bind('link:harmonicLock', (payload) => this.onHarmonicLock({ detail: this._normalizePayload(payload) }));
    bind('network:corruptionSpread', (payload) => this.onCorruptionSpread({ detail: this._normalizePayload(payload) }));
    bind('metric:synergySpike', (payload) => this.onSynergyThreshold({ detail: this._normalizePayload(payload) }));
    bind('metric:harmonyPeak', (payload) => this.onHarmonicLock({ detail: this._normalizePayload(payload) }));
    bind('metric:corruptionRise', (payload) => this.onCorruptionSpread({ detail: this._normalizePayload(payload) }));
    bind('metric.phase.changed', (payload) => this.onMetricPhaseChanged({ detail: this._normalizePayload(payload) }));

    if (this.debugMode) console.log('[LinkMicroImpulseAdapter] Hooked via semanticBus');
  }

  _unhookSemanticBusListeners() {
    if (!Array.isArray(this._semanticUnsubscribers) || this._semanticUnsubscribers.length === 0) return;
    for (const unsubscribe of this._semanticUnsubscribers) {
      try {
        unsubscribe?.();
      } catch (_) {
        // ignore legacy unsubscribe failures
      }
    }
    this._semanticUnsubscribers.length = 0;
  }

  _normalizePayload(event) {
    if (event && typeof event === 'object' && 'detail' in event) {
      return event.detail || {};
    }
    return event || {};
  }

  _normalizeMetricName(metric) {
    return String(metric ?? '').trim().toLowerCase();
  }

  _normalizePhaseName(phase) {
    return String(phase ?? '').trim().toLowerCase();
  }

  _getSignalKey(metric, phase, linkId) {
    return `${this._normalizeMetricName(metric)}:${this._normalizePhaseName(phase)}:${String(linkId ?? '')}`;
  }

  _shouldDedupSignal(metric, phase, linkId) {
    const now = Date.now();
    const key = this._getSignalKey(metric, phase, linkId);
    const last = Number(this.recentSemanticSignals.get(key) ?? -Infinity);
    if (Number.isFinite(last) && (now - last) < this.semanticSignalDedupMs) {
      return true;
    }

    this.recentSemanticSignals.set(key, now);
    if (this.recentSemanticSignals.size > 96) {
      for (const [signalKey, seenAt] of this.recentSemanticSignals.entries()) {
        if ((now - seenAt) > this.semanticSignalDedupMs * 2) {
          this.recentSemanticSignals.delete(signalKey);
        }
      }
    }

    return false;
  }

  _resolveMetricPhaseRoute(metric, phase) {
    const normalizedMetric = this._normalizeMetricName(metric);
    const normalizedPhase = this._normalizePhaseName(phase);

    if (normalizedPhase !== 'high' && normalizedPhase !== 'low') return null;
    if (normalizedMetric === 'synergy' && normalizedPhase === 'high') return 'synergy';
    if (normalizedMetric === 'harmony' && normalizedPhase === 'high') return 'harmonic';
    if (normalizedMetric === 'corruption' && normalizedPhase === 'high') return 'corruption';
    if (normalizedMetric === 'loadpressure' && normalizedPhase === 'high') return 'corruption';
    return null;
  }

  _resolveLink(payload) {
    const candidate = payload?.link || payload?.detail?.link || null;
    if (candidate) return candidate;

    const linkId = payload?.linkId || payload?.id || payload?.link?.id || null;
    if (!linkId) return null;

    if (this.linkingSystem?.links && Array.isArray(this.linkingSystem.links)) {
      return this.linkingSystem.links.find((link) => {
        const id = link?.userData?.id || link?.id || link?.uuid;
        return id === linkId;
      }) || null;
    }

    if (typeof this.linkingSystem?._findLinkById === 'function') {
      return this.linkingSystem._findLinkById(linkId);
    }

    return null;
  }

  _extractState(payload, fallback = {}) {
    const detail = this._normalizePayload(payload);
    return {
      harmony: Number.isFinite(detail?.state?.harmony) ? detail.state.harmony : (Number.isFinite(detail?.harmony) ? detail.harmony : fallback.harmony ?? 1.0),
      synergy: Number.isFinite(detail?.state?.synergy) ? detail.state.synergy : (Number.isFinite(detail?.synergy) ? detail.synergy : fallback.synergy ?? 0.5),
      corruption: Number.isFinite(detail?.state?.corruption) ? detail.state.corruption : (Number.isFinite(detail?.corruption) ? detail.corruption : fallback.corruption ?? 0.0)
    };
  }

  onLinkCreated(event) {
    if (!this.enabled) return;
    const detail = this._normalizePayload(event);
    const link = this._resolveLink(detail);
    if (!link) return;

    const linkId = link.userData?.id || link.uuid;
    const now = Date.now();

    if (this.lastLinkCreatedTime.has(linkId)) {
      const lastTime = this.lastLinkCreatedTime.get(linkId);
      if (now - lastTime < 200) return;
    }
    this.lastLinkCreatedTime.set(linkId, now);

    const metricFallback = link?.userData?.metrics || link?.userData || {};
    const state = this._extractState(detail, {
      harmony: Number.isFinite(metricFallback.harmony) ? metricFallback.harmony : 1.0,
      synergy: Number.isFinite(metricFallback.synergy) ? metricFallback.synergy : 0.5,
      corruption: Number.isFinite(metricFallback.corruption) ? metricFallback.corruption : 0.0
    });
    this.linkStateCache.set(linkId, state);

    const shape = state.harmony > 0.7 ? 'arc' : 'zigzag';
    this.manager.spawn(link, {
      shape,
      duration: 100,
      intensity: 1.0,
      harmony: state.harmony,
      synergy: state.synergy,
      corruption: state.corruption,
    });

    if (this.debugMode) console.log('[LinkMicroImpulseAdapter] Link created impulse', linkId);
  }

  onMetricPhaseChanged(event) {
    if (!this.enabled) return;
    const detail = this._normalizePayload(event);
    const metric = this._normalizeMetricName(detail.metric);
    const phase = this._normalizePhaseName(detail.phase);
    const route = this._resolveMetricPhaseRoute(metric, phase);
    if (!route) return;

    const link = this._resolveLink(detail);
    if (!link) return;

    const linkId = link.userData?.id || link.uuid;
    if (this._shouldDedupSignal(metric, phase, linkId)) return;

    const routedDetail = {
      ...detail,
      metric,
      phase,
      semanticPhase: phase,
      value: Number.isFinite(detail?.value) ? detail.value : detail?.intensity
    };

    if (route === 'synergy') {
      this.onSynergyThreshold({ detail: routedDetail }, true);
      return;
    }

    if (route === 'harmonic') {
      this.onHarmonicLock({ detail: routedDetail }, true);
      return;
    }

    if (route === 'corruption') {
      this.onCorruptionSpread({ detail: routedDetail }, true);
    }
  }

  onHarmonicLock(event, skipDedup = false) {
    if (!this.enabled) return;
    const detail = this._normalizePayload(event);
    const link = this._resolveLink(detail);
    if (!link) return;

    const linkId = link.userData?.id || link.uuid;
    if (!skipDedup && this._shouldDedupSignal('harmony', 'high', linkId)) return;

    const metricFallback = link?.userData?.metrics || link?.userData || {};
    const state = this._extractState(detail, {
      harmony: Number.isFinite(detail?.value) ? detail.value : (Number.isFinite(metricFallback.harmony) ? metricFallback.harmony : 1.0),
      synergy: Number.isFinite(metricFallback.synergy) ? metricFallback.synergy : 0.5,
      corruption: Number.isFinite(metricFallback.corruption) ? metricFallback.corruption : 0.0,
    });

    this.manager.spawn(link, {
      shape: 'arc',
      duration: 80,
      intensity: 1.2,
      harmony: Math.min(state.harmony * 1.2, 1.0),
      synergy: state.synergy,
      corruption: state.corruption,
    });

    if (this.debugMode) console.log('[LinkMicroImpulseAdapter] Harmonic lock impulse');
  }

  onSynergyThreshold(event, skipDedup = false) {
    if (!this.enabled) return;
    const detail = this._normalizePayload(event);
    const link = this._resolveLink(detail);
    if (!link) return;

    const linkId = link.userData?.id || link.uuid;
    if (!skipDedup && this._shouldDedupSignal('synergy', 'high', linkId)) return;

    const metricFallback = link?.userData?.metrics || link?.userData || {};
    const state = this._extractState(detail, {
      harmony: Number.isFinite(metricFallback.harmony) ? metricFallback.harmony : 1.0,
      synergy: Number.isFinite(detail?.value) ? detail.value : (Number.isFinite(metricFallback.synergy) ? metricFallback.synergy : 0.8),
      corruption: Number.isFinite(metricFallback.corruption) ? metricFallback.corruption : 0.0,
    });

    this.manager.spawn(link, {
      shape: 'spark',
      duration: 120,
      intensity: 1.5,
      harmony: state.harmony,
      synergy: Math.min(state.synergy * 1.3, 1.0),
      corruption: state.corruption,
    });

    if (this.debugMode) console.log('[LinkMicroImpulseAdapter] Synergy threshold impulse');
  }

  onCorruptionSpread(event, skipDedup = false) {
    if (!this.enabled) return;
    const detail = this._normalizePayload(event);
    const link = this._resolveLink(detail);
    if (!link) return;

    const linkId = link.userData?.id || link.uuid;
    if (!skipDedup && this._shouldDedupSignal('corruption', 'high', linkId)) return;

    const metricFallback = link?.userData?.metrics || link?.userData || {};
    const state = this._extractState(detail, {
      harmony: Number.isFinite(metricFallback.harmony) ? metricFallback.harmony : 0.5,
      synergy: Number.isFinite(metricFallback.synergy) ? metricFallback.synergy : 0.3,
      corruption: Number.isFinite(detail?.value) ? detail.value : (Number.isFinite(metricFallback.corruption) ? metricFallback.corruption : 0.8),
    });

    this.manager.spawn(link, {
      shape: 'zigzag',
      duration: 70,
      intensity: 0.9,
      harmony: state.harmony,
      synergy: state.synergy,
      corruption: Math.min(state.corruption * 1.2, 1.0),
    });

    if (this.debugMode) console.log('[LinkMicroImpulseAdapter] Corruption spread impulse');
  }

  update() {
    if (!this.enabled) return;
    this.manager.update();
  }

  setEnabled(enabled) {
    this.enabled = !!enabled;
  }

  setDebugMode(enabled) {
    this.debugMode = !!enabled;
  }

  clear() {
    this.manager.clear();
    this.linkStateCache.clear();
    this.lastLinkCreatedTime.clear();
    this.recentSemanticSignals.clear();
    this._unhookSemanticBusListeners();
  }

  dispose() {
    this.clear();
    this.factory?.dispose?.();
    this.factory = null;
    this.manager?.dispose?.();
    this.manager = null;
    this.eventSource = null;
    this.linkingSystem = null;
    this.semanticBus = null;
  }
}

export function setupLinkMicroImpulseConsoleAPI(adapter) {
  window.microImpulse = {
    enable: () => {
      adapter.setEnabled(true);
      console.log('✅ Micro-impulses ENABLED');
    },
    disable: () => {
      adapter.setEnabled(false);
      console.log('❌ Micro-impulses DISABLED');
    },
    debugOn: () => {
      adapter.setDebugMode(true);
      console.log('🔍 Micro-impulse debug mode ON');
    },
    debugOff: () => {
      adapter.setDebugMode(false);
      console.log('🔍 Micro-impulse debug mode OFF');
    },
    status: () => {
      console.log(`🔌 Micro-Impulse System Status:
  Enabled: ${adapter.enabled}
  Debug: ${adapter.debugMode}
  Active Impulses: ${adapter.manager.activeImpulses.length}
  Cached Links: ${adapter.linkStateCache.size}`);
    },
    help: () => {
      console.log(`🔌 Micro-Impulse Console API:
  microImpulse.enable()      — Enable micro-impulses
  microImpulse.disable()     — Disable micro-impulses
  microImpulse.debugOn()     — Enable debug logging
  microImpulse.debugOff()    — Disable debug logging
  microImpulse.status()      — Show system status
  microImpulse.help()        — Show this help`);
    },
  };

  console.log('✅ [LinkMicroImpulseAdapter] Console API ready (microImpulse.help())');
}
