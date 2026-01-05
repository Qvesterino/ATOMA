/**
 * PulseIntersectionImpulseAdapter_v1.js
 * ============================================================================
 * Pulse Wave Intersection Detection + Micro-Impulse Emission
 * 
 * EVENT-DRIVEN NEURAL FIRING SYSTEM
 * 
 * Concept: Micro-impulses fire only when pulse waves intersect with link 
 * geometry (braided strands, energy streaks). Creates illusion of action 
 * potentials firing along network pathways.
 * 
 * NO GAMEPLAY CHANGES, NO PARTICLES, NO ALLOCATIONS, EVENT-DRIVEN ONLY
 * 
 * Update Flow:
 * 1. Pulse wave active on link (position = pulseT ∈ [0, 1])
 * 2. Detect intersection with link segments
 * 3. Check per-segment cooldown (prevent spam)
 * 4. Emit micro-impulse at intersection
 * 5. Apply fade + auto-expire
 * 
 * Visual: Thin arcs, snaps, sparks confined to link surface
 * State: Harmony (symmetric), Synergy (bright), Corruption (jitter)
 */

import * as THREE from 'three';

/**
 * Segment intersection detector (visual-only geometry evaluation)
 */
class SegmentIntersectionDetector {
  constructor() {
    // Per-link segment cache: linkId → [{ startT, endT, type }]
    this.segmentCache = new Map();
    
    // Per-segment cooldown: `${linkId}-${segmentIdx}` → lastFiredTime
    this.segmentCooldowns = new Map();
    
    // Default cooldown (ms)
    this.baseCooldown = 150;
  }

  /**
   * Register link segments for intersection detection
   * @param {string} linkId - Unique link identifier
   * @param {number} segmentCount - Number of visual segments
   * @param {number} segmentType - Type ('strand', 'streak', 'hub')
   */
  registerLinkSegments(linkId, segmentCount, segmentType = 'strand') {
    // Divide link into equal segments (0→1 parameter space)
    const segments = [];
    for (let i = 0; i < segmentCount; i++) {
      const startT = i / segmentCount;
      const endT = (i + 1) / segmentCount;
      segments.push({ startT, endT, type: segmentType, index: i });
    }
    
    this.segmentCache.set(linkId, segments);
  }

  /**
   * Detect if pulse position intersects any segment
   * @param {string} linkId - Link identifier
   * @param {number} pulseT - Pulse position (0-1)
   * @param {number} pulseWidth - Pulse width in parameter space (default 0.15)
   * @returns {object[]} Array of intersected segments
   */
  detectIntersections(linkId, pulseT, pulseWidth = 0.15) {
    const segments = this.segmentCache.get(linkId);
    if (!segments) return [];

    const intersections = [];
    const pulseStart = Math.max(0, pulseT - pulseWidth / 2);
    const pulseEnd = Math.min(1, pulseT + pulseWidth / 2);

    for (const segment of segments) {
      // Overlapping range check
      const segStart = segment.startT;
      const segEnd = segment.endT;

      if (pulseStart < segEnd && pulseEnd > segStart) {
        // Intersection detected
        intersections.push({
          segment,
          overlapStart: Math.max(pulseStart, segStart),
          overlapEnd: Math.min(pulseEnd, segEnd),
          overlapAmount: Math.min(pulseEnd, segEnd) - Math.max(pulseStart, segStart),
        });
      }
    }

    return intersections;
  }

  /**
   * Check if segment can fire (cooldown expired)
   */
  canSegmentFire(linkId, segmentIndex) {
    const cooldownKey = `${linkId}-${segmentIndex}`;
    const lastFired = this.segmentCooldowns.get(cooldownKey) || 0;
    const now = Date.now();
    return (now - lastFired) >= this.baseCooldown;
  }

  /**
   * Mark segment as fired (start cooldown)
   */
  markSegmentFired(linkId, segmentIndex) {
    const cooldownKey = `${linkId}-${segmentIndex}`;
    this.segmentCooldowns.set(cooldownKey, Date.now());
  }

  /**
   * Update cooldown based on state (instability suppresses)
   */
  updateCooldown(baseMs, instability = 0.0) {
    // Instability = 0: baseCooldown = 150ms
    // Instability = 1: baseCooldown = 300ms (doubled, suppresses impulses)
    return baseMs * (1.0 + instability * 1.0);
  }

  /**
   * Clear all caches (world reset)
   */
  clear() {
    this.segmentCache.clear();
    this.segmentCooldowns.clear();
  }
}

/**
 * Micro-impulse spawner (reuses simple geometry buffers)
 */
class IntersectionImpulseSpawner {
  constructor(scene) {
    this.scene = scene;
    this.activeImpulses = [];

    // Cached geometries for intersection impulses
    this.geometries = {
      snap: this.createSnapGeometry(),      // Quick bright flash
      arc: this.createArcGeometry(),        // Electric arc
      spark: this.createSparkGeometry(),    // Point burst
    };

    // Cached materials
    this.materials = {
      snap: new THREE.LineBasicMaterial({
        color: 0x00ffff,
        linewidth: 2,
        transparent: true,
        fog: false,
        depthTest: true,
        depthWrite: false,
      }),
      arc: new THREE.LineBasicMaterial({
        color: 0x00ff88,
        linewidth: 1,
        transparent: true,
        fog: false,
        depthTest: true,
        depthWrite: false,
      }),
      spark: new THREE.PointsMaterial({
        color: 0xffff00,
        size: 0.06,
        transparent: true,
        fog: false,
        depthTest: true,
        depthWrite: false,
      }),
    };
  }

  createSnapGeometry() {
    // Ultra-short bright flash (2 points)
    const points = [0, 0, 0, 0.1, 0, 0];
    return new THREE.BufferGeometry().setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(points), 3)
    );
  }

  createArcGeometry() {
    // Thin arc (8 segments)
    const points = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const angle = Math.PI * t;
      const x = Math.cos(angle) * 0.3;
      const y = Math.sin(angle) * 0.2;
      const z = (Math.random() - 0.5) * 0.05;
      points.push(x, y, z);
    }
    return new THREE.BufferGeometry().setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(points), 3)
    );
  }

  createSparkGeometry() {
    // 4 points in cross pattern
    const points = [];
    const positions = [
      [0.1, 0, 0],
      [-0.1, 0, 0],
      [0, 0.1, 0],
      [0, -0.1, 0],
    ];
    for (const pos of positions) {
      points.push(...pos);
    }
    return new THREE.BufferGeometry().setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(points), 3)
    );
  }

  /**
   * Spawn intersection impulse
   */
  spawn(position, rotation, shape, config = {}) {
    const {
      duration = 60,
      harmony = 1.0,
      synergy = 0.5,
      corruption = 0.0,
    } = config;

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
    visual.frustumCulled = false;

    // Apply state modulation
    let scale = harmony * 0.8 + 0.2;
    scale *= 0.5 + synergy * 0.5;
    scale *= corruption > 0.5 ? 0.7 : 1.0;
    visual.scale.setScalar(scale);

    // Color modulation
    const baseColor = new THREE.Color(0x00ffff);
    if (corruption > 0.3) {
      baseColor.lerpColors(
        new THREE.Color(0x00ffff),
        new THREE.Color(0xff3366),
        corruption
      );
    }
    visual.material.color.copy(baseColor);
    visual.material.opacity = harmony * (0.5 + synergy * 0.5);

    this.scene.add(visual);

    const impulse = {
      visual,
      startTime: Date.now(),
      duration: duration * (1.0 - corruption * 0.3),
      harmony,
      synergy,
      corruption,
    };

    this.activeImpulses.push(impulse);
    return impulse;
  }

  /**
   * Update active impulses (fade + expire)
   */
  update() {
    const now = Date.now();
    const toRemove = [];

    for (let i = 0; i < this.activeImpulses.length; i++) {
      const impulse = this.activeImpulses[i];
      const elapsed = now - impulse.startTime;
      const progress = elapsed / impulse.duration;

      if (progress >= 1.0) {
        this.scene.remove(impulse.visual);
        toRemove.push(i);
      } else {
        // Fade in → fade out (peak at 50%)
        let opacity;
        if (progress < 0.5) {
          opacity = progress * 2.0; // Fade in
        } else {
          opacity = (1.0 - progress) * 2.0; // Fade out
        }
        impulse.visual.material.opacity =
          opacity * impulse.harmony * (0.5 + impulse.synergy * 0.5);
      }
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.activeImpulses.splice(toRemove[i], 1);
    }
  }

  clear() {
    for (const impulse of this.activeImpulses) {
      this.scene.remove(impulse.visual);
    }
    this.activeImpulses = [];
  }
}

/**
 * PulseIntersectionImpulseAdapter — Main controller
 */
export class PulseIntersectionImpulseAdapter {
  constructor(scene) {
    this.scene = scene;
    this.enabled = true;
    this.debugMode = false;

    this.detector = new SegmentIntersectionDetector();
    this.spawner = new IntersectionImpulseSpawner(scene);

    // Cache pulse wave references: linkId → { pulse, lastT }
    this.activePulses = new Map();

    // Link geometry cache: linkId → { geometry, matrixWorld }
    this.linkGeometries = new Map();
  }

  /**
   * Register link for pulse intersection tracking
   */
  registerLink(linkId, link, segmentCount = 6) {
    if (!link || !link.geometry) return;

    // Register segments
    this.detector.registerLinkSegments(linkId, segmentCount, 'strand');

    // Cache link geometry
    this.linkGeometries.set(linkId, {
      geometry: link.geometry,
      matrixWorld: link.matrixWorld,
      link,
    });

    if (this.debugMode) {
      console.log(`[PulseIntersectionAdapter] Link registered: ${linkId} (${segmentCount} segments)`);
    }
  }

  /**
   * Update pulse wave position for intersection detection
   * Called when pulse wave updates
   */
  updatePulsePosition(linkId, pulseT, pulseConfig = {}) {
    if (!this.enabled) return;

    const {
      isActive = true,
      duration = 1.0,
      width = 0.15,
      harmony = 1.0,
      synergy = 0.5,
      corruption = 0.0,
      instability = 0.0,
    } = pulseConfig;

    if (!isActive) {
      this.activePulses.delete(linkId);
      return;
    }

    // Detect intersections at this pulse position
    const intersections = this.detector.detectIntersections(linkId, pulseT, width);

    if (intersections.length === 0) return;

    // Update cooldown based on instability
    const cooldownMs = this.detector.updateCooldown(150, instability);
    this.detector.baseCooldown = cooldownMs;

    // Emit impulse for each valid intersection
    for (const intersection of intersections) {
      const segment = intersection.segment;
      const segmentKey = `${linkId}-${segment.index}`;

      // Check cooldown
      if (!this.detector.canSegmentFire(linkId, segment.index)) continue;

      // Calculate position on link
      const link = this.linkGeometries.get(linkId);
      if (!link) continue;

      const position = this.calculateIntersectionPoint(
        link.geometry,
        intersection.overlapStart,
        intersection.overlapEnd
      );

      if (!position) continue;

      // Transform to world space
      position.applyMatrix4(link.matrixWorld);

      // Determine impulse shape based on state
      let shape = 'arc';
      if (synergy > 0.7) shape = 'spark';
      if (corruption > 0.5) shape = 'arc'; // Arc works better for jitter

      // Random orientation
      const rotation = new THREE.Quaternion();
      rotation.setFromAxisAngle(
        new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
        Math.random() * Math.PI * 2
      );

      // Emit impulse
      this.spawner.spawn(position, rotation, shape, {
        duration: 50 + (synergy * 40), // Synergy makes it longer
        harmony,
        synergy,
        corruption,
      });

      // Mark segment as fired
      this.detector.markSegmentFired(linkId, segment.index);

      if (this.debugMode) {
        console.log(
          `[PulseIntersectionAdapter] Impulse fired: link=${linkId}, segment=${segment.index}, shape=${shape}`
        );
      }
    }

    // Cache pulse for next update
    this.activePulses.set(linkId, {
      pulseT,
      duration,
      harmony,
      synergy,
      corruption,
      instability,
    });
  }

  /**
   * Calculate position on link for intersection
   * Uses simple linear interpolation along geometry bounds
   */
  calculateIntersectionPoint(geometry, startT, endT) {
    if (!geometry.attributes || !geometry.attributes.position) return null;

    const positions = geometry.attributes.position.array;
    const vertexCount = positions.length / 3;

    // Get vertex indices for parameter space
    const startIdx = Math.floor(startT * vertexCount);
    const endIdx = Math.floor(endT * vertexCount);

    if (startIdx >= vertexCount) return null;

    // Average position in range
    let sumX = 0, sumY = 0, sumZ = 0;
    let count = 0;

    for (let i = startIdx; i < Math.min(endIdx + 1, vertexCount); i++) {
      sumX += positions[i * 3];
      sumY += positions[i * 3 + 1];
      sumZ += positions[i * 3 + 2];
      count++;
    }

    if (count === 0) return null;

    return new THREE.Vector3(sumX / count, sumY / count, sumZ / count);
  }

  /**
   * Per-frame update
   */
  update() {
    if (!this.enabled) return;
    this.spawner.update();
  }

  /**
   * Clear all state
   */
  clear() {
    this.activePulses.clear();
    this.linkGeometries.clear();
    this.detector.clear();
    this.spawner.clear();
  }

  /**
   * Enable/disable
   */
  setEnabled(enabled) {
    this.enabled = !!enabled;
  }

  /**
   * Debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = !!enabled;
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.clear();
    this.spawner = null;
    this.detector = null;
  }
}

// ============================================================================
// CONSOLE API
// ============================================================================
export function setupPulseIntersectionImpulseConsoleAPI(adapter) {
  window.pulseImpulse = {
    enable: () => {
      adapter.setEnabled(true);
      console.log('✅ Pulse intersection impulses ENABLED');
    },
    disable: () => {
      adapter.setEnabled(false);
      console.log('❌ Pulse intersection impulses DISABLED');
    },
    debugOn: () => {
      adapter.setDebugMode(true);
      console.log('🔍 Pulse intersection debug mode ON');
    },
    debugOff: () => {
      adapter.setDebugMode(false);
      console.log('🔍 Pulse intersection debug mode OFF');
    },
    status: () => {
      console.log(`⚡ Pulse Intersection Impulse Status:
  Enabled: ${adapter.enabled}
  Debug: ${adapter.debugMode}
  Active Impulses: ${adapter.spawner.activeImpulses.length}
  Tracked Links: ${adapter.linkGeometries.size}
  Active Pulses: ${adapter.activePulses.size}`);
    },
    help: () => {
      console.log(`⚡ Pulse Intersection Console API:
  pulseImpulse.enable()         — Enable intersection impulses
  pulseImpulse.disable()        — Disable intersection impulses
  pulseImpulse.debugOn()        — Enable debug logging
  pulseImpulse.debugOff()       — Disable debug logging
  pulseImpulse.status()         — Show system status
  pulseImpulse.help()           — Show this help`);
    },
  };

  console.log('✅ [PulseIntersectionImpulseAdapter] Console API ready (pulseImpulse.help())');
}
