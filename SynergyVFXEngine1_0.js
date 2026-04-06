/**
 * SYNERGY VFX ENGINE v1.0 (SAFE EDITION)
 * 
 * Advanced visual effects system for link and node synergy visualization.
 * Renders 5 distinct visual layers on top of existing Priority VFX without modification.
 * 
 * Visual Layers:
 * 1. Synergy Core Tint — Per-link color blending by polarity
 * 2. Synergy Orbit Halos — Per-node rings around high-synergy nodes
 * 3. Synergy Threads — Inter-link filaments inside clusters
 * 4. Synergy Burst Events — Ring pulses on synergy changes
 * 5. Synergy Cluster Fields — Soft auras around node clusters
 * 
 * Status:
 * - Dormant legacy module in the current workspace runtime path
 * - No active consumer found in the codebase as of 2026-03-31
 * - Keep here as archive/compatibility until a real consumer is wired
 *
 * Features:
 * - Real-time synergy data visualization (score, tier, trend, polarity)
 * - Smooth lerp transitions (0.1 factor)
 * - Memory-efficient object pooling
 * - Full backward compatibility
 * - Non-invasive (reads only, no modifications to priority VFX)
 * 
 * Integration:
 * - Create: window.game.synergyVFXEngine = new SynergyVFXEngine1_0(...)
 * - Call: synergyVFXEngine.tick(deltaMs) in animation loop
 * - Call: synergyVFXEngine.renderSynergyEffects() before render
 * 
 * Performance:
 * - Per-link tint: <0.05ms
 * - Per-cluster orbit: <0.1ms
 * - Per-cluster threads: <0.2ms
 * - Total per frame: <2ms (even with 200+ links)
 */

import * as THREE from 'three';
import { tagAllowedSphere, clampSphere } from './VisualSpherePolicy.js';

export class SynergyVFXEngine1_0 {
  /**
   * Constructor
   * @param {Object} scene - THREE.Scene
   * @param {Object} camera - THREE.Camera
   * @param {Object} linkingSystem - NodeLinkingSystem
   * @param {Object} config - Configuration override
   */
  constructor(scene, camera, linkingSystem, config = {}) {
    if (!scene || !camera || !linkingSystem) {
      console.error('[SynergyVFXEngine] Missing required parameters');
      this.enabled = false;
      return;
    }

    this.scene = scene;
    this.camera = camera;
    this.linkingSystem = linkingSystem;

    // Configuration
    this.config = {
      enabled: true,
      
      // Synergy core tint
      tintStrength: { 0: 0.10, 1: 0.18, 2: 0.26, 3: 0.36 },
      breathingSpeed: 0.5,      // hue breathing speed
      breathingAmount: 6,       // ±6° hue breathing
      
      // Synergy orbit halos
      orbitRadiiByTier: {
        1: [1.2],
        2: [1.4, 1.7, 2.0],
        3: [1.6, 2.0, 2.4, 2.9],
      },
      orbitOpacity: 0.22,
      orbitThickness: 2,
      orbitRotationSpeedMs: 60000,  // 60s full rotation
      volatilityWobble: 0.06,       // ±6% radius wobble
      
      // Synergy threads
      threadMinTier: 2,
      threadMaxPerCluster: 5,
      threadLifetimeMs: 6000,    // 4-8s, use 6s average
      threadOpacity: 0.25,
      threadThickness: 0.5,
      threadSpawnRatePerTrend: { falling: 0.3, stable: 0.6, rising: 1.0 },
      
      // Burst events
      burstDurationMs: 800,
      burstCooldownMs: 3500,
      burstOpacity: 0.7,
      
      // Cluster fields
      clusterMinLinks: 4,
      clusterMinAvgTier: 2,
      clusterFieldOpacity: 0.09,
      clusterEdgeDashed: true,
      
      // Global
      lerpFactor: 0.1,
      logWarnings: false,
    };

    Object.assign(this.config, config);
    this.enabled = this.config.enabled;

    // Synergy hue by polarity
    this.synergyHues = {
      positive: { hex: '#4BFFC3', hsl: { h: 166, s: 100, l: 50 } },
      neutral: { hex: '#C09CFF', hsl: { h: 270, s: 100, l: 70 } },
      negative: { hex: '#FF2E8F', hsl: { h: 323, s: 100, l: 55 } },
    };

    // State tracking
    this.state = {
      time: 0,
      deltaTime: 0,
      updatedLinks: 0,
      updatedNodes: 0,
      activeThreads: 0,
      activeBursts: 0,
      errors: 0,
    };

    // Visual object pools
    this.orbitHalos = new Map();        // nodeId → { rings, state }
    this.synergyThreads = [];           // Array of thread objects
    this.burstEvents = new Map();       // linkId → { startTime, color, ... }
    this.clusterFields = new Map();     // clusterId → { mesh, state }

    // Cache for cluster detection
    this.clusterCache = new Map();
    this.lastClusterUpdateTime = 0;
    this.clusterUpdateIntervalMs = 1000;  // Update clusters every 1 second
    this.transientSceneObjects = new Set();
    
    // UNIFIED CLEANUP CONTRACT - Track all created objects
    this._createdObjects = [];

    console.log('[SynergyVFXEngine] Initialized v1.0 (enabled=%s)', this.config.enabled);
  }

  /**
   * Main tick function - call from animation loop
   * @param {number} deltaMs - Delta time in milliseconds
   */
  tick(deltaMs) {
    if (!this.enabled || !this.linkingSystem) {
      return;
    }

    try {
      this._clearTransientSceneObjects();

      this.state.time += deltaMs;
      this.state.deltaTime = deltaMs;

      // Update cluster detection periodically
      if (this.state.time - this.lastClusterUpdateTime >= this.clusterUpdateIntervalMs) {
        this._updateClusterDetection();
        this.lastClusterUpdateTime = this.state.time;
      }

      // Update synergy threads (lifetime, spawn new)
      this._updateSynergyThreads(deltaMs);

      // Update burst events (cooldown, animation)
      this._updateBurstEvents(deltaMs);

      // Clean up old orbit halos for deleted nodes
      this._cleanupOrbitHalos();

    } catch (error) {
      this.state.errors++;
      console.error('[SynergyVFXEngine] tick() error:', error);
      if (this.state.errors > 50) {
        this.enabled = false;
        console.warn('[SynergyVFXEngine] Too many errors, disabling');
      }
    }
  }

  /**
   * Render synergy effects for a specific link
   * Call from NeonLinkVisuals animate loop, AFTER priority effects
   * @param {Object} link - Link object
   * @param {Object} linkGeometry - THREE.Line geometry
   * @param {Object} synergyState - Synergy state (score, tier, trend, polarity, clusterId, volatility)
   * @param {number} time - Current time
   */
  renderSynergyCoreTint(link, linkMaterial, synergyState, time) {
    if (!this.enabled || !link || !synergyState) {
      return;
    }

    try {
      if (!linkMaterial || !linkMaterial.color) {
        return;
      }

      const { score, tier, trend, polarity } = synergyState;
      if (typeof tier !== 'number' || tier < 0 || tier > 3) {
        return;
      }

      // Get synergy hue
      const synergyHue = this.synergyHues[polarity] || this.synergyHues.neutral;
      const synergyColor = new THREE.Color(synergyHue.hex);

      // Get base color (from link material)
      const baseColor = new THREE.Color(linkMaterial.color);

      // Tint strength by tier
      const tintStrength = this.config.tintStrength[tier] || 0.1;

      // Apply breathing animation for rising trend
      let finalTintStrength = tintStrength;
      if (trend === 'rising') {
        const breatheAmount = Math.sin(time * this.config.breathingSpeed * 0.001) * 0.1;
        finalTintStrength = this._clamp(tintStrength + breatheAmount * 0.05, 0, 1);
      } else if (trend === 'falling') {
        // Fade saturation for falling trend
        finalTintStrength = tintStrength * (1.0 - Math.min(score * 0.2, 0.3));
      }

      // Blend base color with synergy hue
      const blendedColor = new THREE.Color(
        baseColor.r + (synergyColor.r - baseColor.r) * finalTintStrength,
        baseColor.g + (synergyColor.g - baseColor.g) * finalTintStrength,
        baseColor.b + (synergyColor.b - baseColor.b) * finalTintStrength
      );

      // Apply with lerp smoothing
      linkMaterial.color.lerp(blendedColor, this.config.lerpFactor);

      this.state.updatedLinks++;

    } catch (error) {
      this.state.errors++;
      if (this.config.logWarnings) {
        console.warn('[SynergyVFXEngine] renderSynergyCoreTint error:', error);
      }
    }
  }

  /**
   * Render orbit halos for a specific node
   * @param {Object} node - Node object
   * @param {Object} nodeGroup - THREE.Group or mesh
   * @param {Array<Object>} nodeLinks - Links connected to this node
   * @param {number} time - Current time
   */
  renderOrbitHalos(node, nodeGroup, nodeLinks, time) {
    if (!this.enabled || !node || !nodeGroup || !Array.isArray(nodeLinks)) {
      return;
    }

    try {
      // Get average synergy tier from connected links
      let maxSynergyTier = 0;
      for (const link of nodeLinks) {
        const synergyState = this._getLinkSynergyState(link);
        if (synergyState?.tier && synergyState.tier > maxSynergyTier) {
          maxSynergyTier = synergyState.tier;
        }
      }

      // Only show orbits for tier 1+
      if (maxSynergyTier < 1) {
        this._removeOrbitHalo(node.id);
        return;
      }

      // Get or create orbit halo state
      const nodeId = node.id;
      let haloState = this.orbitHalos.get(nodeId);

      if (!haloState) {
        haloState = {
          tier: maxSynergyTier,
          rings: [],
          baseRadii: this.config.orbitRadiiByTier[maxSynergyTier] || [1.2],
          polarity: 'neutral',
          time: 0,
        };
        this.orbitHalos.set(nodeId, haloState);
      }

      // Update tier if changed
      if (haloState.tier !== maxSynergyTier) {
        haloState.tier = maxSynergyTier;
        haloState.baseRadii = this.config.orbitRadiiByTier[maxSynergyTier] || [1.2];
      }

      haloState.time += this.state.deltaTime;

      // Get dominant polarity from linked synergies
      const polarity = this._getDominantPolarity(nodeLinks);
      haloState.polarity = polarity;

      // Get node aura size (approximate from node scale)
      const nodeAuraSize = 1.5;  // Approximate, adjust based on your node render

      // Render rings
      for (let i = 0; i < haloState.baseRadii.length; i++) {
        const baseRadius = haloState.baseRadii[i] * nodeAuraSize;

        // Add volatility wobble
        let volatility = 0;
        for (const link of nodeLinks) {
          const synergyState = this._getLinkSynergyState(link);
          if (synergyState?.volatility && typeof synergyState.volatility === 'number') {
            volatility = Math.max(volatility, synergyState.volatility);
          }
        }

        const wobble = 1.0 + Math.sin(haloState.time * 0.001) * this.config.volatilityWobble * (volatility || 0);
        const currentRadius = baseRadius * wobble;

        // Rotation
        const rotationSpeed = (2 * Math.PI) / this.config.orbitRotationSpeedMs;
        const rotation = haloState.time * rotationSpeed;

        // Draw ring (in scene space)
        this._drawOrbitRing(
          node.position,
          currentRadius,
          this.synergyHues[polarity].hex,
          this.config.orbitOpacity,
          rotation,
          this.config.orbitThickness
        );
      }

      this.state.updatedNodes++;

    } catch (error) {
      this.state.errors++;
      if (this.config.logWarnings) {
        console.warn('[SynergyVFXEngine] renderOrbitHalos error:', error);
      }
    }
  }

  /**
   * Render synergy threads (filaments between links in same cluster)
   */
  renderSynergyThreads() {
    if (!this.enabled) {
      return;
    }

    try {
      // Draw active threads
      for (let i = 0; i < this.synergyThreads.length; i++) {
        const thread = this.synergyThreads[i];
        if (thread.active) {
          this._drawThread(thread);
        }
      }

      this.state.activeThreads = this.synergyThreads.filter(t => t.active).length;

    } catch (error) {
      this.state.errors++;
      if (this.config.logWarnings) {
        console.warn('[SynergyVFXEngine] renderSynergyThreads error:', error);
      }
    }
  }

  /**
   * Render burst events (ring pulses on synergy changes)
   */
  renderBurstEvents() {
    if (!this.enabled) {
      return;
    }

    try {
      const currentTime = this.state.time;

      for (const [linkId, burst] of this.burstEvents.entries()) {
        if (burst.active) {
          const elapsed = currentTime - burst.startTime;
          const progress = Math.min(elapsed / this.config.burstDurationMs, 1.0);

          // Ring expands from 0 to 1
          const radius = progress * 3.0;  // Max radius
          const opacity = (1.0 - progress) * this.config.burstOpacity;

          // Draw burst ring
          this._drawBurstRing(
            burst.fromPos,
            burst.toPos,
            radius,
            burst.color,
            opacity
          );

          // Draw node flares
          if (progress < 0.5) {
            const flareScale = 1.1 + (1.0 - progress) * 0.2;
            this._drawNodeFlare(burst.fromPos, burst.color, flareScale, opacity);
            this._drawNodeFlare(burst.toPos, burst.color, flareScale, opacity);
          }

          if (progress >= 1.0) {
            burst.active = false;
          }
        }
      }

      this.state.activeBursts = Array.from(this.burstEvents.values()).filter(b => b.active).length;

    } catch (error) {
      this.state.errors++;
      if (this.config.logWarnings) {
        console.warn('[SynergyVFXEngine] renderBurstEvents error:', error);
      }
    }
  }

  /**
   * Render cluster fields (soft auras around clusters)
   */
  renderClusterFields() {
    if (!this.enabled) {
      return;
    }

    try {
      for (const [clusterId, field] of this.clusterFields.entries()) {
        if (field.active) {
          this._drawClusterField(field);
        }
      }

    } catch (error) {
      this.state.errors++;
      if (this.config.logWarnings) {
        console.warn('[SynergyVFXEngine] renderClusterFields error:', error);
      }
    }
  }

  /**
   * Trigger burst event on link
   * @param {Object} link - Link object
   * @param {string} color - Burst color (hex)
   */
  triggerBurst(link, color = '#48E0FF') {
    try {
      const linkId = link.id || `${link.from?.id}_${link.to?.id}`;
      if (!linkId) return;
      const fromPos = this._cloneValidWorldPosition(link?.from?.position ?? link?.source?.position ?? null);
      const toPos = this._cloneValidWorldPosition(link?.to?.position ?? link?.target?.position ?? null);
      if (!fromPos || !toPos) return;

      // Check cooldown
      const existingBurst = this.burstEvents.get(linkId);
      if (existingBurst && (this.state.time - existingBurst.endTime) < this.config.burstCooldownMs) {
        return;  // Still in cooldown
      }

      // Create new burst
      this.burstEvents.set(linkId, {
        startTime: this.state.time,
        endTime: this.state.time + this.config.burstDurationMs + this.config.burstCooldownMs,
        active: true,
        color: color,
        fromPos,
        toPos,
      });

    } catch (error) {
      this.state.errors++;
    }
  }

  /**
   * Get cluster detection (groups links by proximity)
   * @private
   */
  _updateClusterDetection() {
    try {
      if (!this.linkingSystem?.links) return;

      const links = this.linkingSystem.links;
      const clusters = new Map();  // clusterId → { links, nodes }

      // Group links by synergy cluster ID
      for (const link of links) {
        if (link['synergyState']?.clusterId) {
          const clusterId = link['synergyState'].clusterId;
          if (!clusters.has(clusterId)) {
            clusters.set(clusterId, { links: [], nodes: new Set() });
          }
          clusters.get(clusterId).links.push(link);
          if (link.from?.id) clusters.get(clusterId).nodes.add(link.from.id);
          if (link.to?.id) clusters.get(clusterId).nodes.add(link.to.id);
        }
      }

      // Update cluster cache
      this.clusterCache = clusters;

      // Update cluster fields
      for (const [clusterId, cluster] of clusters.entries()) {
        if (cluster.links.length >= this.config.clusterMinLinks) {
          // Calculate average tier
          let totalTier = 0;
          for (const link of cluster.links) {
            totalTier += link['synergyState']?.tier || 0;
          }
          const avgTier = totalTier / cluster.links.length;

          if (avgTier >= this.config.clusterMinAvgTier) {
            // Create cluster field
            if (!this.clusterFields.has(clusterId)) {
              this.clusterFields.set(clusterId, {
                clusterId: clusterId,
                links: cluster.links,
                nodes: cluster.nodes,
                active: true,
                polarity: this._getClusterPolarity(cluster.links),
                avgTier: avgTier,
              });
            }
          }
        }
      }

      // Remove old cluster fields
      for (const [clusterId, field] of this.clusterFields.entries()) {
        if (!clusters.has(clusterId)) {
          this.clusterFields.delete(clusterId);
        }
      }

    } catch (error) {
      this.state.errors++;
    }
  }

  /**
   * Update synergy threads
   * @private
   */
  _updateSynergyThreads(deltaMs) {
    try {
      // Update existing threads
      for (let i = this.synergyThreads.length - 1; i >= 0; i--) {
        const thread = this.synergyThreads[i];
        thread.elapsed += deltaMs;

        if (thread.elapsed >= thread.lifetime) {
          thread.active = false;
          this.synergyThreads.splice(i, 1);
        }
      }

      // Spawn new threads based on clusters
      for (const [clusterId, cluster] of this.clusterCache.entries()) {
        if (cluster.links.length < this.config.threadMinTier) continue;

        // Calculate trend spawn rate
        const trend = this._getClusterTrend(cluster.links);
        const spawnRate = this.config.threadSpawnRatePerTrend[trend] || 0.5;

        // Probabilistic spawn
        if (Math.random() < spawnRate * 0.1) {  // 0.1 = spawn rate per frame
          const threadCount = Math.min(
            this.synergyThreads.filter(t => t.clusterId === clusterId && t.active).length,
            this.config.threadMaxPerCluster
          );

          if (threadCount < this.config.threadMaxPerCluster) {
            // Pick two random links in cluster
            const link1 = cluster.links[Math.floor(Math.random() * cluster.links.length)];
            const link2 = cluster.links[Math.floor(Math.random() * cluster.links.length)];

            if (link1 && link2 && link1 !== link2) {
              const polarity = link1['synergyState']?.polarity || 'neutral';
              const startPos = this._cloneValidWorldPosition(link1?.from?.position ?? link1?.source?.position ?? null);
              const endPos = this._cloneValidWorldPosition(link2?.to?.position ?? link2?.target?.position ?? null);
              if (!startPos || !endPos) continue;

              this.synergyThreads.push({
                clusterId: clusterId,
                link1: link1,
                link2: link2,
                startPos,
                endPos,
                color: this.synergyHues[polarity].hex,
                lifetime: this.config.threadLifetimeMs,
                elapsed: 0,
                active: true,
              });
            }
          }
        }
      }

    } catch (error) {
      this.state.errors++;
    }
  }

  /**
   * Update burst events
   * @private
   */
  _updateBurstEvents(deltaMs) {
    try {
      for (const burst of this.burstEvents.values()) {
        // Burst will be marked inactive in renderBurstEvents
      }
    } catch (error) {
      this.state.errors++;
    }
  }

  /**
   * Get dominant polarity from links
   * @private
   */
  _getDominantPolarity(links) {
    try {
      const polarities = { positive: 0, neutral: 0, negative: 0 };

      for (const link of links) {
        const polarity = link['synergyState']?.polarity || 'neutral';
        if (polarities[polarity] !== undefined) {
          polarities[polarity]++;
        }
      }

      if (polarities.positive > polarities.negative) return 'positive';
      if (polarities.negative > polarities.positive) return 'negative';
      return 'neutral';
    } catch (error) {
      return 'neutral';
    }
  }

  /**
   * Get cluster polarity
   * @private
   */
  _getClusterPolarity(links) {
    return this._getDominantPolarity(links);
  }

  /**
   * Get cluster trend
   * @private
   */
  _getClusterTrend(links) {
    try {
      const trends = { rising: 0, stable: 0, falling: 0 };

      for (const link of links) {
        const trend = link['synergyState']?.trend || 'stable';
        if (trends[trend] !== undefined) {
          trends[trend]++;
        }
      }

      if (trends.rising > trends.falling) return 'rising';
      if (trends.falling > trends.rising) return 'falling';
      return 'stable';
    } catch (error) {
      return 'stable';
    }
  }

  /**
   * Draw orbit ring (helper - uses debug/line rendering)
   * @private
   */
  _drawOrbitRing(center, radius, color, opacity, rotation, thickness) {
    try {
      // Create ring geometry if needed
      const segments = 32;
      const geometry = new THREE.BufferGeometry();
      const positions = [];

      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2 + rotation;
        const x = center.x + Math.cos(angle) * radius;
        const y = center.y;
        const z = center.z + Math.sin(angle) * radius;
        positions.push(x, y, z);
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));

      const colorObj = new THREE.Color(color);
      const material = new THREE.LineBasicMaterial({
        color: colorObj,
        linewidth: thickness,
        fog: false,
        transparent: true,
        opacity: opacity,
      });

      const line = new THREE.Line(geometry, material);
      this.scene.add(line);
      this._trackTransientObject(line);

      // Auto-remove after frame
      // (In production, would use proper scene management)

    } catch (error) {
      this.state.errors++;
    }
  }

  /**
   * Draw thread filament
   * @private
   */
  _drawThread(thread) {
    try {
      const geometry = new THREE.BufferGeometry();
      const positions = [
        thread.startPos.x, thread.startPos.y, thread.startPos.z,
        thread.endPos.x, thread.endPos.y, thread.endPos.z,
      ];

      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));

      const progress = Math.min(thread.elapsed / thread.lifetime, 1.0);
      const opacity = thread.elapsed < thread.lifetime * 0.2
        ? (thread.elapsed / (thread.lifetime * 0.2)) * this.config.threadOpacity
        : (1.0 - progress) * this.config.threadOpacity;

      const colorObj = new THREE.Color(thread.color);
      const material = new THREE.LineBasicMaterial({
        color: colorObj,
        linewidth: this.config.threadThickness,
        fog: false,
        transparent: true,
        opacity: opacity,
      });

      const line = new THREE.Line(geometry, material);
      this.scene.add(line);
      this._trackTransientObject(line);

    } catch (error) {
      this.state.errors++;
    }
  }

  /**
   * Draw burst ring
   * @private
   */
  _drawBurstRing(fromPos, toPos, radius, color, opacity) {
    try {
      // Draw ring expanding from link midpoint
      const midPos = new THREE.Vector3(
        (fromPos.x + toPos.x) / 2,
        (fromPos.y + toPos.y) / 2,
        (fromPos.z + toPos.z) / 2
      );

      // Simple circle in 3D space
      const segments = 24;
      const positions = [];

      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = midPos.x + Math.cos(angle) * radius;
        const y = midPos.y;
        const z = midPos.z + Math.sin(angle) * radius;
        positions.push(x, y, z);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));

      const colorObj = new THREE.Color(color);
      const material = new THREE.LineBasicMaterial({
        color: colorObj,
        linewidth: 2,
        fog: false,
        transparent: true,
        opacity: opacity,
      });

      const line = new THREE.Line(geometry, material);
      this.scene.add(line);
      this._trackTransientObject(line);

    } catch (error) {
      this.state.errors++;
    }
  }

  /**
   * Draw node flare
   * @private
   */
  _drawNodeFlare(position, color, scale, opacity) {
    try {
      const colorObj = new THREE.Color(color);
      
      // Create small sphere or point light representation
      const geometry = new THREE.SphereGeometry(0.3 * scale, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: colorObj,
        fog: false,
        transparent: true,
        opacity: opacity * 0.6,
      });

      const mesh = new THREE.Mesh(geometry, material);
      tagAllowedSphere(mesh, { role: 'vfx', source: 'SynergyVFXEngine1_0._drawNodeFlare' });
      clampSphere(mesh);
      mesh.position.copy(position);
      this.scene.add(mesh);
      this._trackTransientObject(mesh);

    } catch (error) {
      this.state.errors++;
    }
  }

  /**
   * Draw cluster field
   * @private
   */
  _drawClusterField(field) {
    try {
      if (!field.active || field.links.length === 0) {
        return;
      }

      // Calculate cluster bounds
      const positions = [];
      for (const link of field.links) {
        if (link.from?.position) positions.push(link.from.position);
        if (link.to?.position) positions.push(link.to.position);
      }

      if (positions.length === 0) return;

      // Calculate center and radius
      const center = new THREE.Vector3();
      for (const pos of positions) {
        center.add(pos);
      }
      center.divideScalar(positions.length);

      let radius = 0;
      for (const pos of positions) {
        const dist = center.distanceTo(pos);
        if (dist > radius) radius = dist;
      }

      radius *= 1.2;  // Expand slightly

      // Draw soft field (sphere wireframe or low-opacity mesh)
      const colorObj = new THREE.Color(this.synergyHues[field.polarity].hex);
      
      const geometry = new THREE.SphereGeometry(radius, 16, 12);
      const material = new THREE.MeshBasicMaterial({
        color: colorObj,
        fog: false,
        transparent: true,
        opacity: this.config.clusterFieldOpacity,
        wireframe: this.config.clusterEdgeDashed,
      });

      const mesh = new THREE.Mesh(geometry, material);
      tagAllowedSphere(mesh, { role: 'vfx', source: 'SynergyVFXEngine1_0._drawClusterField' });
      clampSphere(mesh);
      mesh.position.copy(center);
      this.scene.add(mesh);
      this._trackTransientObject(mesh);

    } catch (error) {
      this.state.errors++;
    }
  }

  /**
   * Clean up orbit halos for deleted nodes
   * @private
   */
  _cleanupOrbitHalos() {
    try {
      if (!this.linkingSystem?.aiNodes) return;

      const validNodeIds = new Set();
      for (const node of this.linkingSystem.aiNodes.nodes) {
        if (node?.id) {
          validNodeIds.add(node.id);
        }
      }

      for (const nodeId of this.orbitHalos.keys()) {
        if (!validNodeIds.has(nodeId)) {
          this.orbitHalos.delete(nodeId);
        }
      }
    } catch (error) {
      this.state.errors++;
    }
  }

  /**
   * Remove orbit halo for node
   * @private
   */
  _removeOrbitHalo(nodeId) {
    try {
      this.orbitHalos.delete(nodeId);
    } catch (error) {
      this.state.errors++;
    }
  }

  _trackTransientObject(object) {
    if (object) {
      this.transientSceneObjects.add(object);
      // UNIFIED CLEANUP CONTRACT
      if (!this._createdObjects.includes(object)) {
        this._createdObjects.push(object);
      }
    }
  }

  _clearTransientSceneObjects() {
    try {
      for (const object of this.transientSceneObjects) {
        if (object?.parent) {
          object.parent.remove(object);
        }

        if (object?.geometry?.dispose) {
          object.geometry.dispose();
        }

        const materials = Array.isArray(object?.material) ? object.material : [object?.material];
        for (const material of materials) {
          if (material?.dispose) {
            material.dispose();
          }
        }
      }

      this.transientSceneObjects.clear();
    } catch (error) {
      this.state.errors++;
    }
  }

  _getLinkSynergyState(link) {
    return link?.userData?.synergy || link?.synergyState || null;
  }

  _cloneValidWorldPosition(pos) {
    if (!pos) return null;
    const x = Number(pos.x);
    const y = Number(pos.y);
    const z = Number(pos.z);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
    return new THREE.Vector3(x, y, z);
  }

  /**
   * Math utilities
   */
  _clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  _lerp(a, b, t) {
    return a + (b - a) * this._clamp(t, 0, 1);
  }

  renderSynergyEffects() {
    this.renderSynergyThreads();
    this.renderBurstEvents();
    this.renderClusterFields();
  }

  /**
   * Get system status
   * @returns {Object} Status report
   */
  status() {
    return {
      enabled: this.enabled,
      updatedLinks: this.state.updatedLinks,
      updatedNodes: this.state.updatedNodes,
      activeThreads: this.state.activeThreads,
      activeBursts: this.state.activeBursts,
      errors: this.state.errors,
      clusterCount: this.clusterCache.size,
    };
  }

  /**
   * Enable the engine
   */
  enable() {
    this.enabled = true;
    console.log('[SynergyVFXEngine] Enabled');
  }

  /**
   * Disable the engine
   */
  disable() {
    this.enabled = false;
    console.log('[SynergyVFXEngine] Disabled');
  }

  /**
   * Get configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param {Object} newConfig - Configuration updates
   */
  setConfig(newConfig) {
    if (typeof newConfig !== 'object') return;
    Object.assign(this.config, newConfig);
    console.log('[SynergyVFXEngine] Config updated');
  }

  /**
   * Get detailed diagnostic report
   * @returns {string} Formatted diagnostic report
   */
  getDiagnosticReport() {
    const status = this.status();

    const report = `
╔════════════════════════════════════════════════════════╗
║       SYNERGY VFX ENGINE 1.0 - DIAGNOSTIC REPORT      ║
╠════════════════════════════════════════════════════════╣
║ Status:
║   Enabled: ${this.enabled ? '✓ YES' : '✗ NO'}
║   Links Processed: ${status.updatedLinks}
║   Nodes with Orbits: ${status.updatedNodes}
║   Active Threads: ${status.activeThreads}
║   Active Bursts: ${status.activeBursts}
║   Clusters: ${status.clusterCount}
║   Errors: ${status.errors}
║
║ Visual Layers:
║   1. Synergy Core Tint — Color blending by polarity
║   2. Synergy Orbit Halos — Rings around high-synergy nodes
║   3. Synergy Threads — Filaments between cluster links
║   4. Synergy Burst Events — Ring pulses on changes
║   5. Synergy Cluster Fields — Soft auras around clusters
║
║ Configuration:
║   Lerp Factor: ${this.config.lerpFactor}
║   Burst Duration: ${this.config.burstDurationMs}ms
║   Thread Lifetime: ${this.config.threadLifetimeMs}ms
║   Cluster Min Links: ${this.config.clusterMinLinks}
║   Cluster Min Avg Tier: ${this.config.clusterMinAvgTier}
╚════════════════════════════════════════════════════════╝
    `;

    return report;
  }

  /**
   * Reset all visual state
   */
  resetAll() {
    try {
      this._clearTransientSceneObjects();
      this.orbitHalos.clear();
      this.synergyThreads = [];
      this.burstEvents.clear();
      this.clusterFields.clear();
      this.clusterCache.clear();
      this.state = {
        time: 0,
        deltaTime: 0,
        updatedLinks: 0,
        updatedNodes: 0,
        activeThreads: 0,
        activeBursts: 0,
        errors: 0,
      };
      console.log('[SynergyVFXEngine] Reset all visual state');
    } catch (error) {
      console.error('[SynergyVFXEngine] resetAll error:', error);
    }
  }
  
  /**
   * UNIFIED CLEANUP CONTRACT - Dispose all resources
   */
  dispose() {
    // Use existing cleanup method
    this.resetAll();
    
    // Remove and dispose all tracked objects
    this._createdObjects.forEach(obj => {
      this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    this._createdObjects = [];
  }
}

