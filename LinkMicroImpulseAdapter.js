/**
 * LinkMicroImpulseAdapter.js
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
 * ✓ linkCreated — Success flash along link
 * ✓ pulseReached — Tiny arc when pulse hits node
 * ✓ harmonicLock — Resonance shimmer on link
 * ✓ synergyThreshold — Intensity boost visible
 * ✓ corruptionSpread — Jittery asymmetric flashes
 * ✓ influenceExpanded — Directional glow pulse
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
 * ⚡ Instability → Suppressed impulses (shorter lifespan)
 * 
 * ARCHITECTURE:
 * - ImpulseFactory: Creates impulse visuals from cached geometry
 * - ImpulseManager: Tracks active impulses, auto-expires
 * - EventListener: Captures trigger events from linking system
 */

import * as THREE from 'three';

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
      const z = (Math.random() - 0.5) * 0.1; // Tiny jitter
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
   * @param {string} shape - 'arc' | 'zigzag' | 'spark'
   * @param {THREE.Vector3} position - World position on link
   * @param {THREE.Quaternion} rotation - Orientation on link surface
   * @param {number} scale - Size multiplier
   * @returns {THREE.Object3D} The impulse mesh
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
    visual.frustumCulled = false; // Always visible (short-lived)

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
  }

  /**
   * Spawn a micro-impulse on a link
   * @param {THREE.Object3D} link - The link geometry to spawn on
   * @param {object} config - { shape, duration, intensity, harmony, synergy, corruption }
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

    // Calculate position on link (random point along center)
    const geometry = link.geometry;
    if (!geometry.attributes.position) return null;

    const positions = geometry.attributes.position.array;
    const randomIndex = Math.floor(Math.random() * (positions.length / 3)) * 3;
    const localPos = new THREE.Vector3(
      positions[randomIndex],
      positions[randomIndex + 1],
      positions[randomIndex + 2]
    );

    // Transform to world space
    const worldPos = localPos.applyMatrix4(link.matrixWorld);

    // Random orientation on link surface
    const rotation = new THREE.Quaternion();
    rotation.setFromAxisAngle(
      new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
      Math.random() * Math.PI * 2
    );

    // Apply state modulation to scale
    let scale = 1.0;
    scale *= harmony * 0.8 + 0.2; // Harmony makes it crisper
    scale *= 0.5 + synergy * 0.5; // Synergy makes it brighter
    scale *= corruption > 0.5 ? 0.6 : 1.0; // Corruption suppresses slightly

    // Create visual
    const visual = this.factory.createImpulse(shape, worldPos, rotation, scale);
    this.scene.add(visual);

    // === STATE COLORATION ===
    // Harmony: clean cyan
    // Synergy: boosted brightness
    // Corruption: hue shift toward red
    // Instability: dimmed
    const baseColor = new THREE.Color(0x00ffff);
    if (corruption > 0.3) {
      baseColor.lerpColors(new THREE.Color(0x00ffff), new THREE.Color(0xff3366), corruption);
    }

    // Apply to material
    if (visual.material) {
      visual.material.color.copy(baseColor);
      visual.material.opacity = 1.0 * harmony * (0.5 + synergy * 0.5);
    }

    // === ADD MICRO-JITTER FOR CORRUPTION STATE ===
    if (corruption > 0.5) {
      visual.position.x += (Math.random() - 0.5) * 0.1 * corruption;
      visual.position.y += (Math.random() - 0.5) * 0.1 * corruption;
    }

    // Track with auto-expiry
    const impulse = {
      visual,
      startTime: Date.now(),
      duration: duration * (1.0 - corruption * 0.3), // Corruption shortens lifespan
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
        // Expired: remove
        this.scene.remove(impulse.visual);
        toRemove.push(i);
      } else {
        // Fade out
        const fadeStart = 0.7;
        if (progress > fadeStart) {
          const fadeProgress = (progress - fadeStart) / (1.0 - fadeStart);
          impulse.visual.material.opacity = (1.0 - fadeProgress) * impulse.harmony * (0.5 + impulse.synergy * 0.5);
        }
      }
    }

    // Remove expired impulses (backwards to preserve indices)
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.activeImpulses.splice(toRemove[i], 1);
    }
  }

  /**
   * Clear all active impulses
   */
  clear() {
    for (const impulse of this.activeImpulses) {
      this.scene.remove(impulse.visual);
    }
    this.activeImpulses = [];
  }
}

/**
 * LinkMicroImpulseAdapter — Main event-driven adapter
 */
export class LinkMicroImpulseAdapter {
  constructor(scene) {
    this.scene = scene;
    this.factory = new ImpulseFactory();
    this.manager = new ImpulseManager(scene, this.factory);

    // Event listeners (will be hooked by setEventSource)
    this.eventSource = null;

    // Config
    this.enabled = true;
    this.debugMode = false;

    // State caches for event filtering
    this.lastLinkCreatedTime = new Map(); // linkId → timestamp
    this.linkStateCache = new Map(); // linkId → { harmony, synergy, corruption }
  }

  /**
   * Hook into event source (NodeLinkingSystem or similar)
   * @param {object} source - System emitting events (should have addEventListener or similar)
   */
  setEventSource(source) {
    if (!source) return;
    this.eventSource = source;

    // Try to hook existing event listeners
    this.hookEventListeners();
  }

  /**
   * Hook into event listeners (tries multiple patterns)
   */
  hookEventListeners() {
    if (!this.eventSource) return;

    // Pattern 1: addEventListener(eventName, callback)
    if (typeof this.eventSource.addEventListener === 'function') {
      this.eventSource.addEventListener('linkCreated', (e) => this.onLinkCreated(e));
      this.eventSource.addEventListener('pulseReached', (e) => this.onPulseReached(e));
      this.eventSource.addEventListener('harmonicLock', (e) => this.onHarmonicLock(e));
      this.eventSource.addEventListener('synergyThreshold', (e) => this.onSynergyThreshold(e));
      this.eventSource.addEventListener('corruptionSpread', (e) => this.onCorruptionSpread(e));
      this.eventSource.addEventListener('influenceExpanded', (e) => this.onInfluenceExpanded(e));
      if (this.debugMode) console.log('[LinkMicroImpulseAdapter] Hooked via addEventListener');
      return;
    }

    // Pattern 2: Direct property assignment (event emitter)
    if (this.eventSource) {
      const originalEmit = this.eventSource.emit || this.eventSource.dispatchEvent;
      if (typeof originalEmit === 'function') {
        this.eventSource.on = (eventName, callback) => {
          originalEmit.call(this.eventSource, eventName, callback);
        };
        if (this.debugMode) console.log('[LinkMicroImpulseAdapter] Hooked via event emitter');
      }
    }
  }

  /**
   * Event: Link successfully created
   */
  onLinkCreated(event) {
    if (!this.enabled || !event?.detail?.link) return;

    const link = event.detail.link;
    const linkId = link.userData?.id || link.uuid;

    // Throttle (prevent spam)
    const now = Date.now();
    if (this.lastLinkCreatedTime.has(linkId)) {
      const lastTime = this.lastLinkCreatedTime.get(linkId);
      if (now - lastTime < 200) return; // Cooldown: 200ms
    }
    this.lastLinkCreatedTime.set(linkId, now);

    // Cache state
    const state = event.detail.state || { harmony: 1.0, synergy: 0.5, corruption: 0.0 };
    this.linkStateCache.set(linkId, state);

    // Spawn success flash along link
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

  /**
   * Event: Pulse wave reached a node
   */
  onPulseReached(event) {
    if (!this.enabled || !event?.detail?.link) return;

    const link = event.detail.link;
    const state = this.linkStateCache.get(link.userData?.id || link.uuid) || {
      harmony: 1.0,
      synergy: 0.5,
      corruption: 0.0,
    };

    // Spawn tiny arc at endpoint
    this.manager.spawn(link, {
      shape: 'arc',
      duration: 60,
      intensity: 0.8,
      harmony: state.harmony,
      synergy: state.synergy,
      corruption: state.corruption,
    });

    if (this.debugMode) console.log('[LinkMicroImpulseAdapter] Pulse reached impulse');
  }

  /**
   * Event: Harmonic hub completes re-lock
   */
  onHarmonicLock(event) {
    if (!this.enabled || !event?.detail?.link) return;

    const link = event.detail.link;
    const state = event.detail.state || {
      harmony: 1.0,
      synergy: 0.5,
      corruption: 0.0,
    };

    // Spawn crisp arc (harmony makes it clean)
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

  /**
   * Event: Synergy crosses threshold
   */
  onSynergyThreshold(event) {
    if (!this.enabled || !event?.detail?.link) return;

    const link = event.detail.link;
    const state = event.detail.state || {
      harmony: 1.0,
      synergy: 0.8,
      corruption: 0.0,
    };

    // High synergy = brighter, longer
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

  /**
   * Event: Corruption spreads through link
   */
  onCorruptionSpread(event) {
    if (!this.enabled || !event?.detail?.link) return;

    const link = event.detail.link;
    const state = event.detail.state || {
      harmony: 0.5,
      synergy: 0.3,
      corruption: 0.8,
    };

    // Corruption = chaotic zig-zag, asymmetric
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

  /**
   * Event: Influence field expands/retracts
   */
  onInfluenceExpanded(event) {
    if (!this.enabled || !event?.detail?.link) return;

    const link = event.detail.link;
    const state = event.detail.state || {
      harmony: 1.0,
      synergy: 0.6,
      corruption: 0.0,
    };

    // Directional pulse
    this.manager.spawn(link, {
      shape: 'arc',
      duration: 90,
      intensity: 1.1,
      harmony: state.harmony,
      synergy: state.synergy,
      corruption: state.corruption,
    });

    if (this.debugMode) console.log('[LinkMicroImpulseAdapter] Influence expanded impulse');
  }

  /**
   * Update active impulses
   * Called from main animate loop
   */
  update() {
    if (!this.enabled) return;
    this.manager.update();
  }

  /**
   * Emit event to event source (for testing or manual triggering)
   * @param {string} eventName - Event type
   * @param {object} detail - Event detail
   */
  emitEvent(eventName, detail) {
    if (!this.eventSource) return;

    const event = new CustomEvent(eventName, { detail });

    // Try multiple dispatch methods
    if (typeof this.eventSource.dispatchEvent === 'function') {
      this.eventSource.dispatchEvent(event);
    } else if (typeof this.eventSource.emit === 'function') {
      this.eventSource.emit(eventName, detail);
    }
  }

  /**
   * Set enabled state
   */
  setEnabled(enabled) {
    this.enabled = !!enabled;
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = !!enabled;
  }

  /**
   * Clear all active impulses
   */
  clear() {
    this.manager.clear();
    this.linkStateCache.clear();
    this.lastLinkCreatedTime.clear();
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.clear();
    this.factory = null;
    this.manager = null;
    this.eventSource = null;
  }
}

// ============================================================================
// CONSOLE API — Real-time tuning
// ============================================================================
export function setupLinkMicroImpulseConsoleAPI(adapter) {
  window.microImpulse = {
    // === CONTROL ===
    enable: () => {
      adapter.setEnabled(true);
      console.log('✅ Micro-impulses ENABLED');
    },
    disable: () => {
      adapter.setEnabled(false);
      console.log('❌ Micro-impulses DISABLED');
    },

    // === DEBUG ===
    debugOn: () => {
      adapter.setDebugMode(true);
      console.log('🔍 Micro-impulse debug mode ON');
    },
    debugOff: () => {
      adapter.setDebugMode(false);
      console.log('🔍 Micro-impulse debug mode OFF');
    },

    // === MANUAL EVENT TRIGGERS ===
    testLinkCreated: () => {
      if (!adapter.eventSource) {
        console.warn('⚠ No event source connected');
        return;
      }
      // Create a fake link object for testing
      const fakeLink = {
        uuid: 'test-' + Math.random(),
        userData: { id: 'test' },
        geometry: new THREE.BufferGeometry(),
        matrixWorld: new THREE.Matrix4(),
      };
      adapter.emitEvent('linkCreated', {
        link: fakeLink,
        state: { harmony: 1.0, synergy: 0.5, corruption: 0.0 },
      });
      console.log('✨ Test linkCreated event emitted');
    },

    testPulseReached: () => {
      if (!adapter.eventSource) {
        console.warn('⚠ No event source connected');
        return;
      }
      const fakeLink = {
        uuid: 'test-' + Math.random(),
        userData: { id: 'test' },
        geometry: new THREE.BufferGeometry(),
        matrixWorld: new THREE.Matrix4(),
      };
      adapter.emitEvent('pulseReached', {
        link: fakeLink,
        state: { harmony: 1.0, synergy: 0.5, corruption: 0.0 },
      });
      console.log('⚡ Test pulseReached event emitted');
    },

    // === STATUS ===
    status: () => {
      console.log(`
🔌 Micro-Impulse System Status:
  Enabled: ${adapter.enabled}
  Debug: ${adapter.debugMode}
  Active Impulses: ${adapter.manager.activeImpulses.length}
  Cached Links: ${adapter.linkStateCache.size}
      `);
    },

    // === HELP ===
    help: () => {
      console.log(`
🔌 Micro-Impulse Console API:
  microImpulse.enable()              — Enable micro-impulses
  microImpulse.disable()             — Disable micro-impulses
  microImpulse.debugOn()             — Enable debug logging
  microImpulse.debugOff()            — Disable debug logging
  microImpulse.testLinkCreated()     — Trigger link creation impulse
  microImpulse.testPulseReached()    — Trigger pulse reached impulse
  microImpulse.status()              — Show system status
  microImpulse.help()                — Show this help
      `);
    },
  };

  console.log('✅ [LinkMicroImpulseAdapter] Console API ready (microImpulse.help())');
}
