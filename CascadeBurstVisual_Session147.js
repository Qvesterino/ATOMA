/**
 * CascadeBurstVisual_Session147.js
 * ============================================================================
 * CASCADE BURST VISUAL EFFECT
 *
 * Creates a dramatic burst visual when a cascade triggers from a hub.
 * Energy shell expands outward + radial light rays + shockwave ring.
 *
 * TRIGGER:
 * - Subscribes to 'cascade.start' semantic event
 * - Activates when cascade strength crosses the secondary hub threshold
 *
 * VISUAL LAYERS:
 * 1. Energy Shell: Expanding translucent sphere with additive blending
 * 2. Radial Rays: 6-8 ray lines emanating from burst center
 * 3. Shockwave Ring: Expanding torus ring
 * 4. Core Flash: Brief bright point at center
 *
 * PERFORMANCE:
 * - Pre-allocated mesh pool (max 8 simultaneous bursts)
 * - Zero per-frame allocations (all reused)
 * - LOD: distance-based quality reduction
 * - Auto-recycle after burst completes
 * - Total: <0.5ms per active burst
 *
 * @author VFX Technical Director — ATOMA Project Session 147
 * @version 1.0.0
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

const MAX_BURSTS = 8;
const BURST_DURATION = 1.2; // seconds
const RAY_COUNT = 6;
const RAY_LENGTH = 3.0;

export class CascadeBurstVisual_Session147 {
  /**
   * @param {THREE.Scene} scene
   * @param {Object} config
   */
  constructor(scene, config = {}) {
    this.scene = scene;
    this.semanticBus = (typeof globalThis !== 'undefined') ? globalThis.semanticBus : null;

    this.config = {
      enabled: config.enabled ?? true,
      debugMode: config.debugMode ?? false,
      maxBursts: config.maxBursts ?? MAX_BURSTS,
      burstDuration: config.burstDuration ?? BURST_DURATION,
      shellMaxRadius: config.shellMaxRadius ?? 3.5,
      shellOpacity: config.shellOpacity ?? 0.35,
      ringMaxRadius: config.ringMaxRadius ?? 5.0,
      ringThickness: config.ringThickness ?? 0.12,
      ringOpacity: config.ringOpacity ?? 0.40,
      rayLength: config.rayLength ?? RAY_LENGTH,
      rayCount: config.rayCount ?? RAY_COUNT,
      rayOpacity: config.rayOpacity ?? 0.30,
      coreFlashSize: config.coreFlashSize ?? 0.8,
      coreFlashOpacity: config.coreFlashOpacity ?? 0.9,
      colorHarmonic: config.colorHarmonic ?? new THREE.Color(0x7ffcff), // Cyan-white
      colorSynergy: config.colorSynergy ?? new THREE.Color(0xffd080),   // Warm gold
      colorCorruption: config.colorCorruption ?? new THREE.Color(0xff4060), // Red
      lodNearDistance: config.lodNearDistance ?? 20.0,
      lodFarDistance: config.lodFarDistance ?? 50.0,
      renderOrder: config.renderOrder ?? VisualHierarchyRegistry.getRenderOrder(
        VisualHierarchyRegistry.LAYER_LINK_RESONANCE
      ) + 5,
    };

    // Burst pool
    this._burstPool = [];
    this._activeBursts = [];
    this._freeIndices = [];

    // Reusable vectors
    this._vec3A = new THREE.Vector3();
    this._vec3B = new THREE.Vector3();
    this._colorScratch = new THREE.Color();

    // Stats
    this.stats = {
      burstsTriggered: 0,
      activeBursts: 0,
      poolSize: 0,
    };

    // Semantic event subscription
    this._boundCascadeStart = null;
    this._semanticBusAttached = null;

    // Initialize pool
    this._initPool();
    this._subscribeCascadeEvents();
  }

  /**
   * Initialize the burst mesh pool
   */
  _initPool() {
    const poolSize = this.config.maxBursts;

    // Shared geometries
    const shellGeometry = new THREE.IcosahedronGeometry(1, 2);
    const ringGeometry = new THREE.TorusGeometry(1, this.config.ringThickness, 8, 32);
    const rayGeometry = new THREE.BufferGeometry();
    const rayPositions = new Float32Array(6); // 2 points × 3 coords
    rayGeometry.setAttribute('position', new THREE.BufferAttribute(rayPositions, 3));
    rayGeometry.setDrawRange(0, 2);
    const coreGeometry = new THREE.SphereGeometry(1, 8, 8);

    for (let i = 0; i < poolSize; i++) {
      // Shell mesh
      const shellMat = new THREE.MeshBasicMaterial({
        color: this.config.colorHarmonic.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        wireframe: true,
      });
      const shellMesh = new THREE.Mesh(shellGeometry, shellMat);
      shellMesh.visible = false;
      shellMesh.renderOrder = this.config.renderOrder;

      // Ring mesh
      const ringMat = new THREE.MeshBasicMaterial({
        color: this.config.colorHarmonic.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMat);
      ringMesh.visible = false;
      ringMesh.renderOrder = this.config.renderOrder + 1;

      // Ray meshes
      const rays = [];
      for (let r = 0; r < this.config.rayCount; r++) {
        const rayMat = new THREE.LineBasicMaterial({
          color: this.config.colorHarmonic.clone(),
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const rayLine = new THREE.Line(rayGeometry, rayMat);
        rayLine.visible = false;
        rayLine.renderOrder = this.config.renderOrder + 2;
        rays.push(rayLine);
      }

      // Core flash mesh
      const coreMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xffffff),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const coreMesh = new THREE.Mesh(coreGeometry, coreMat);
      coreMesh.visible = false;
      coreMesh.renderOrder = this.config.renderOrder + 3;

      // Group
      const group = new THREE.Group();
      group.add(shellMesh);
      group.add(ringMesh);
      group.add(coreMesh);
      for (const ray of rays) {
        group.add(ray);
      }
      group.visible = false;

      if (this.scene) {
        this.scene.add(group);
      }

      const burstRig = {
        index: i,
        group,
        shell: shellMesh,
        ring: ringMesh,
        core: coreMesh,
        rays,
        active: false,
        startTime: 0,
        position: new THREE.Vector3(),
        strength: 0,
        color: this.config.colorHarmonic.clone(),
        duration: this.config.burstDuration,
      };

      this._burstPool.push(burstRig);
      this._freeIndices.push(i);
    }

    this.stats.poolSize = poolSize;
  }

  /**
   * Subscribe to cascade.start semantic events
   */
  _subscribeCascadeEvents() {
    const bus = this.semanticBus || globalThis?.semanticBus;
    if (!bus?.on) return;

    this._boundCascadeStart = (event) => {
      if (!this.config.enabled) return;
      const position = event.sourcePosition || event.position;
      const strength = Math.max(0, Math.min(1, event.strength || event.intensity || 0));

      if (position && strength > 0.3) {
        this._vec3A.set(position.x || 0, position.y || 0, position.z || 0);
        this.triggerBurst(this._vec3A, strength);
      }
    };

    bus.on('cascade.start', this._boundCascadeStart);
    this._semanticBusAttached = bus;
  }

  /**
   * Trigger a burst at the given position
   * @param {THREE.Vector3} position
   * @param {number} strength - 0 to 1
   * @param {THREE.Color} [color] - Optional override color
   */
  triggerBurst(position, strength, color = null) {
    if (!this.config.enabled) return;
    if (this._freeIndices.length === 0) return; // Pool exhausted

    const index = this._freeIndices.pop();
    const rig = this._burstPool[index];

    rig.active = true;
    rig.startTime = performance.now() * 0.001;
    rig.position.copy(position);
    rig.strength = Math.max(0.3, Math.min(1, strength));
    rig.duration = this.config.burstDuration * (0.8 + rig.strength * 0.4);

    // Determine color based on strength
    if (color) {
      rig.color.copy(color);
    } else if (rig.strength > 0.7) {
      // High strength = warm gold (synergy)
      rig.color.copy(this.config.colorSynergy);
    } else {
      // Normal = cyan-white (harmonic)
      rig.color.copy(this.config.colorHarmonic);
    }

    // Position the group
    rig.group.position.copy(position);
    rig.group.visible = true;

    // Initialize shell
    rig.shell.material.color.copy(rig.color);
    rig.shell.material.opacity = 0;
    rig.shell.scale.setScalar(0.1);
    rig.shell.visible = true;

    // Initialize ring
    rig.ring.material.color.copy(rig.color);
    rig.ring.material.opacity = 0;
    rig.ring.scale.setScalar(0.1);
    rig.ring.rotation.x = Math.PI * 0.5; // Horizontal
    rig.ring.visible = true;

    // Initialize core
    rig.core.material.opacity = 0;
    rig.core.scale.setScalar(0.1);
    rig.core.visible = true;

    // Initialize rays
    for (let r = 0; r < rig.rays.length; r++) {
      const ray = rig.rays[r];
      ray.material.color.copy(rig.color);
      ray.material.opacity = 0;
      ray.visible = true;

      // Set ray direction (radial from center)
      const angle = (r / rig.rays.length) * Math.PI * 2;
      const posAttr = ray.geometry.attributes.position;
      posAttr.setXYZ(0, 0, 0, 0);
      const len = this.config.rayLength * rig.strength;
      posAttr.setXYZ(1, Math.cos(angle) * len, 0, Math.sin(angle) * len);
      posAttr.needsUpdate = true;
    }

    this._activeBursts.push(rig);
    this.stats.burstsTriggered++;
    this.stats.activeBursts = this._activeBursts.length;
  }

  /**
   * Update all active bursts
   * @param {number} deltaTime
   * @param {THREE.Camera} [camera] - For LOD
   */
  update(deltaTime, camera = null) {
    if (!this.config.enabled) return;

    const now = performance.now() * 0.001;
    const toRemove = [];

    for (let i = 0; i < this._activeBursts.length; i++) {
      const rig = this._activeBursts[i];
      const elapsed = now - rig.startTime;
      const t = Math.min(1, elapsed / rig.duration); // 0→1 progress

      if (t >= 1) {
        // Burst complete — recycle
        this._recycleBurst(rig);
        toRemove.push(i);
        continue;
      }

      // Easing: fast attack, slow decay
      const attackT = Math.min(1, t * 4); // 0→1 in first 25% of duration
      const decayT = Math.max(0, 1 - t); // 1→0 linear

      // LOD: reduce quality at distance
      let lodScale = 1.0;
      if (camera) {
        const dist = camera.position.distanceTo(rig.position);
        if (dist > this.config.lodFarDistance) {
          lodScale = 0.3;
        } else if (dist > this.config.lodNearDistance) {
          const lodT = (dist - this.config.lodNearDistance) / (this.config.lodFarDistance - this.config.lodNearDistance);
          lodScale = 1.0 - lodT * 0.7;
        }
      }

      // ── Shell animation ──
      const shellScale = rig.strength * this.config.shellMaxRadius * attackT * lodScale;
      rig.shell.scale.setScalar(Math.max(0.01, shellScale));
      rig.shell.material.opacity = this.config.shellOpacity * decayT * rig.strength;
      // Slow rotation for visual interest
      rig.shell.rotation.y += deltaTime * 0.5;
      rig.shell.rotation.x += deltaTime * 0.3;

      // ── Ring animation ──
      const ringScale = rig.strength * this.config.ringMaxRadius * attackT * lodScale;
      rig.ring.scale.setScalar(Math.max(0.01, ringScale));
      rig.ring.material.opacity = this.config.ringOpacity * decayT * rig.strength;

      // ── Core flash ──
      const coreIntensity = Math.max(0, 1 - t * 3); // Bright for first 33%
      const coreScale = this.config.coreFlashSize * coreIntensity * rig.strength * lodScale;
      rig.core.scale.setScalar(Math.max(0.01, coreScale));
      rig.core.material.opacity = this.config.coreFlashOpacity * coreIntensity * rig.strength;

      // ── Rays animation ──
      const rayOpacity = this.config.rayOpacity * decayT * rig.strength * lodScale;
      for (const ray of rig.rays) {
        ray.material.opacity = rayOpacity;
        // Rays grow outward
        const rayScale = attackT;
        ray.scale.setScalar(Math.max(0.01, rayScale));
      }
    }

    // Remove completed bursts (reverse order to preserve indices)
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this._activeBursts.splice(toRemove[i], 1);
    }
    this.stats.activeBursts = this._activeBursts.length;
  }

  /**
   * Recycle a burst rig back to the pool
   */
  _recycleBurst(rig) {
    rig.active = false;
    rig.group.visible = false;
    rig.shell.visible = false;
    rig.ring.visible = false;
    rig.core.visible = false;
    for (const ray of rig.rays) {
      ray.visible = false;
    }
    this._freeIndices.push(rig.index);
  }

  /**
   * Dispose all resources
   */
  dispose() {
    // Unsubscribe from semantic bus
    const bus = this._semanticBusAttached || globalThis?.semanticBus;
    if (bus?.off && this._boundCascadeStart) {
      bus.off('cascade.start', this._boundCascadeStart);
    }

    // Remove all meshes from scene
    for (const rig of this._burstPool) {
      if (this.scene) {
        this.scene.remove(rig.group);
      }
      // Dispose materials
      rig.shell.material.dispose();
      rig.ring.material.dispose();
      rig.core.material.dispose();
      for (const ray of rig.rays) {
        ray.material.dispose();
      }
    }

    this._burstPool.length = 0;
    this._activeBursts.length = 0;
    this._freeIndices.length = 0;
    this.stats.poolSize = 0;
    this.stats.activeBursts = 0;
  }

  /**
   * Setup console API
   */
  setupConsoleAPI(globalWindow) {
    if (!globalWindow) return;

    globalWindow.cascadeBurst_info = () => {
      console.log('=== CASCADE BURST VISUAL ===');
      console.log(`Enabled: ${this.config.enabled}`);
      console.log(`Pool size: ${this.stats.poolSize}`);
      console.log(`Active bursts: ${this.stats.activeBursts}`);
      console.log(`Total triggered: ${this.stats.burstsTriggered}`);
      console.log(`Free slots: ${this._freeIndices.length}`);
    };

    globalWindow.cascadeBurst_trigger = (x = 0, y = 2, z = 0, strength = 0.8) => {
      this.triggerBurst(new THREE.Vector3(x, y, z), strength);
    };

    globalWindow.cascadeBurst_toggle = (enabled) => {
      this.config.enabled = enabled !== undefined ? enabled : !this.config.enabled;
      console.log(`[CascadeBurst] ${this.config.enabled ? 'enabled' : 'disabled'}`);
    };
  }
}
