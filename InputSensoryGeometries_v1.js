import * as THREE from 'three';
import { createCoreIdentityMaterial, createNodeHologramShell } from './CoreHologramShader.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

/**
 * INPUT Node Sensory Geometries — 3 Ultra-Unique Receiver Interfaces
 * 
 * INPUT nodes represent perception, sensing, and gateways between ATOMA and external world.
 * These geometries feel like interfaces, not machines.
 * 
 * 1. SENSORY_GATE — Open asymmetric frame marking threshold where signals enter
 * 2. LISTENING_CROWN — Radial antenna array tuned to invisible frequencies
 * 3. PERCEPTION_BLOOM — Petal-like plates unfolding into awareness
 * 
 * All geometries:
 * ✓ Static geometry (no runtime mutations)
 * ✓ Transform-only animation (rotation, subtle scale breathing)
 * ✓ Static materials (no per-frame changes)
 * ✓ Color palette: soft violet, pale magenta, pearlescent white, subtle cyan
 * ✓ Deterministic per-node selection
 * ✓ Marked immutable (userData.visualCoreImmutable)
 */

export class InputSensoryGeometries {
  /**
   * Factory: Create INPUT sensory geometry by type
   * @param {string} type - 'sensory_gate', 'listening_crown', or 'perception_bloom'
   * @param {THREE.Group} group - Node group to populate
   * @param {number} color - Base color value
   * @returns {THREE.Group} Populated node group
   */
  static create(type, group, color) {
    const typeKey = (type || '').toLowerCase().replace(/_/g, '');
    
    switch (typeKey) {
      case 'sensorygate':
        return this.createSensoryGate(group, color);
      case 'listeningcrown':
        return this.createListeningCrown(group, color);
      case 'perceptionbloom':
        return this.createPerceptionBloom(group, color);
      default:
        return this.createSensoryGate(group, color);
    }
  }

  /**
   * Get renderOrder from registry
   * @private
   */
  static _getCoreRenderOrder() {
    try {
      return VisualHierarchyRegistry?.getRenderOrder('CORE', 0) ?? 0;
    } catch (err) {
      return 0;
    }
  }

  static _getArchetypeRenderOrder() {
    try {
      return VisualHierarchyRegistry?.getRenderOrder('ARCHETYPE', 1) ?? 1;
    } catch (err) {
      return 1;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // 1. SENSORY_GATE — Open asymmetric frame marking threshold
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * SENSORY_GATE: Threshold where signals cross into ATOMA
   * 
   * Geometry:
   * - Open asymmetric frame (NOT a closed ring)
   * - Central empty space (void) — represents receiving aperture
   * - Frame composed of 4–6 curved segments
   * - Each segment is slightly different angle
   * 
   * Animation:
   * - Very slow rotation around Y axis
   * - Frame elements subtly drift (rotation only, no scale)
   * - Entire structure orbits gently
   * 
   * Meaning: "Something is entering. The gate is open."
   */
  static createSensoryGate(group, color) {
    if (!group.userData.nodeRoot) {
      const nodeRoot = new THREE.Group();
      nodeRoot.userData.isNodeRoot = true;
      group.add(nodeRoot);
      group.userData.nodeRoot = nodeRoot;
    }
    const nodeRoot = group.userData.nodeRoot;

    const coreRenderOrder = this._getCoreRenderOrder();
    const archetypeRenderOrder = this._getArchetypeRenderOrder();

    // Asymmetric frame: 5 curved segments around an open center (NOT a ring)
    const segments = [];

    for (let i = 0; i < 5; i++) {
      // Each segment is a curved box segment
      // Positioned around a virtual circle, but NOT completing it
      const angle = (i / 5) * (Math.PI * 1.4); // 0–252° (gap ~108°)
      
      // Segment geometry: thin curved bar
      const segmentGeom = new THREE.BoxGeometry(0.15, 0.08, 0.8);
      const segmentMat = new THREE.MeshPhysicalMaterial({
        color: this._interpolateColor(color, 0xfffacd, 0.3), // Pale magenta tint
        metalness: 0.7,
        roughness: 0.2,
        transmission: 0.1,
        emissive: color,
        emissiveIntensity: 0.15,
        transparent: true,
        opacity: 0.85
      });

      const segment = new THREE.Mesh(segmentGeom, segmentMat);
      segment.userData.visualLayer = 'CORE';
      segment.renderOrder = coreRenderOrder;
      segment.frustumCulled = false;

      // Position in circle with varying radii (asymmetric!)
      const radius = 0.7 + (Math.sin(i * 0.8) * 0.15); // Radius varies ±15%
      segment.position.x = Math.cos(angle) * radius;
      segment.position.z = Math.sin(angle) * radius;
      
      // Rotation: face toward center, then tilt asymmetrically
      segment.rotation.y = angle + Math.PI / 2;
      segment.rotation.z = (Math.random() - 0.5) * 0.3; // Asymmetric tilt

      nodeRoot.add(segment);
      segments.push({
        mesh: segment,
        baseAngle: angle,
        radius: radius,
        tiltOffset: segment.rotation.z
      });
    }

    // Central void aperture (empty space — represents gateway)
    // We'll mark the center with a very subtle reference sphere
    const voidMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.0 // Invisible marker
      })
    );
    voidMarker.userData.visualLayer = 'CORE';
    voidMarker.renderOrder = coreRenderOrder - 1;
    voidMarker.frustumCulled = false;
    nodeRoot.add(voidMarker);

    // Rim accent: thin line around the gap
    const rimGeometry = new THREE.TorusGeometry(0.7, 0.04, 8, 32, 0, Math.PI * 1.4);
    const rimMaterial = new THREE.MeshBasicMaterial({
      color: this._interpolateColor(color, 0x00ffff, 0.5), // Cyan highlight
      transparent: true,
      opacity: 0.4
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = 0.1; // Slight tilt
    rim.rotation.y = Math.PI / 7; // Asymmetric rotation
    rim.renderOrder = coreRenderOrder;
    rim.frustumCulled = false;
    nodeRoot.add(rim);

    // Store animation state
    group.userData.visualCoreImmutable = true;
    group.userData.sensoryGateSegments = segments;
    group.userData.gateRotationSpeed = 0.05; // Very slow
    group.userData.gateSegmentDrift = 0.3; // Gentle drift amount
    group.userData.gateAnimationType = 'sensory_gate';

    return group;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // 2. LISTENING_CROWN — Radial antenna array
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * LISTENING_CROWN: Receiver tuned to invisible frequencies
   * 
   * Geometry:
   * - 8–10 thin antenna-like spines
   * - Each spine curves slightly (not perfectly straight)
   * - Spines arranged radially around empty center
   * - NO symmetry perfection (slight variations per spine)
   * - Spines taper from base to tip
   * 
   * Animation:
   * - Each spine sways independently (rotation only)
   * - Entire crown rotates very slowly (Y axis)
   * - Wave-like motion: not in sync
   * 
   * Meaning: "The system is listening. Attuned to incoming data."
   */
  static createListeningCrown(group, color) {
    if (!group.userData.nodeRoot) {
      const nodeRoot = new THREE.Group();
      nodeRoot.userData.isNodeRoot = true;
      group.add(nodeRoot);
      group.userData.nodeRoot = nodeRoot;
    }
    const nodeRoot = group.userData.nodeRoot;

    const coreRenderOrder = this._getCoreRenderOrder();

    const spineCount = 9;
    const spines = [];

    // Create radial antenna spines
    for (let i = 0; i < spineCount; i++) {
      const angle = (i / spineCount) * Math.PI * 2;

      // Each spine: tapered cone (thicker at base, sharp at tip)
      const spineGeom = new THREE.ConeGeometry(
        0.08, // Base radius
        1.0,  // Height
        6,    // Radial segments (lower = more angular/alien)
        3     // Height segments
      );

      const spineMat = new THREE.MeshPhysicalMaterial({
        color: this._interpolateColor(color, 0xd8bfd8, 0.4), // Thistle tint
        metalness: 0.5,
        roughness: 0.3,
        transmission: 0.15,
        emissive: color,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.8
      });

      const spine = new THREE.Mesh(spineGeom, spineMat);
      spine.userData.visualLayer = 'CORE';
      spine.renderOrder = coreRenderOrder;
      spine.frustumCulled = false;

      // Position at radius with slight height variation
      const baseRadius = 0.5;
      const heightVariation = Math.sin(i * 0.7) * 0.1;
      spine.position.x = Math.cos(angle) * baseRadius;
      spine.position.z = Math.sin(angle) * baseRadius;
      spine.position.y = heightVariation;

      // Rotation: point outward and slightly up
      spine.rotation.z = (Math.PI / 2) - 0.2; // Point outward + slight lift
      spine.rotation.y = angle;
      
      // Curvature: add slight asymmetric tilt
      spine.rotation.x = (Math.random() - 0.5) * 0.2;

      nodeRoot.add(spine);

      spines.push({
        mesh: spine,
        angle: angle,
        baseAngle: i,
        swayPhase: (Math.random() * Math.PI * 2), // Random phase offset
        swayAmount: 0.2 + Math.random() * 0.1
      });
    }

    // Center sphere (listener core — very subtle)
    const coreGeom = new THREE.IcosahedronGeometry(0.15, 2);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: this._interpolateColor(color, 0x000000, 0.5), // Dark core
      metalness: 0.8,
      roughness: 0.1,
      transmission: 0.2,
      emissive: color,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.7
    });

    const core = new THREE.Mesh(coreGeom, coreMat);
    core.userData.visualLayer = 'CORE';
    core.renderOrder = coreRenderOrder - 1;
    core.frustumCulled = false;
    nodeRoot.add(core);

    // Crown glow accent ring (subtle)
    const glowGeom = new THREE.TorusGeometry(0.5, 0.05, 8, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: this._interpolateColor(color, 0x00ffff, 0.6), // Cyan glow
      transparent: true,
      opacity: 0.3
    });

    const glow = new THREE.Mesh(glowGeom, glowMat);
    glow.rotation.x = Math.PI / 3; // Tilted
    glow.renderOrder = coreRenderOrder;
    glow.frustumCulled = false;
    nodeRoot.add(glow);

    // Store animation state
    group.userData.visualCoreImmutable = true;
    group.userData.listeningCrownSpines = spines;
    group.userData.crownRotationSpeed = 0.04; // Slow rotation
    group.userData.crownAnimationType = 'listening_crown';

    return group;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // 3. PERCEPTION_BLOOM — Petal-like plates unfolding into awareness
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * PERCEPTION_BLOOM: Perception unfolding into awareness
   * 
   * Geometry:
   * - 6–8 petal-like translucent plates
   * - Plates arranged in semi-open bloom (like a flower)
   * - Core remains empty (void)
   * - Plates do NOT intersect
   * - Each petal has slight curve/organic shape
   * 
   * Animation:
   * - Slow breathing scale (±1% subtle expansion/contraction)
   * - Entire structure rotates extremely slowly (Y axis)
   * - Petals NEVER change position (rigid transform only)
   * 
   * Meaning: "Raw sensory input becoming conscious perception."
   */
  static createPerceptionBloom(group, color) {
    if (!group.userData.nodeRoot) {
      const nodeRoot = new THREE.Group();
      nodeRoot.userData.isNodeRoot = true;
      group.add(nodeRoot);
      group.userData.nodeRoot = nodeRoot;
    }
    const nodeRoot = group.userData.nodeRoot;

    const coreRenderOrder = this._getCoreRenderOrder();

    const petalCount = 7;
    const petals = [];

    // Create petal-like plates unfolding
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;

      // Petal geometry: elongated ellipsoid-like shape (box with taper effect)
      const petalGeom = new THREE.BoxGeometry(0.25, 0.7, 0.05);

      // Petal material: translucent with soft violet
      const petalMat = new THREE.MeshPhysicalMaterial({
        color: this._interpolateColor(color, 0xe6e6fa, 0.5), // Lavender blend
        metalness: 0.2,
        roughness: 0.5,
        transmission: 0.3, // Slightly translucent
        emissive: color,
        emissiveIntensity: 0.1,
        transparent: true,
        opacity: 0.7
      });

      const petal = new THREE.Mesh(petalGeom, petalMat);
      petal.userData.visualLayer = 'CORE';
      petal.renderOrder = coreRenderOrder;
      petal.frustumCulled = false;

      // Position: radial, slightly varying distance
      const baseRadius = 0.6 + (Math.sin(i * 1.3) * 0.1);
      petal.position.x = Math.cos(angle) * baseRadius;
      petal.position.z = Math.sin(angle) * baseRadius;
      petal.position.y = (Math.random() - 0.5) * 0.15; // Slight vertical variation

      // Rotation: petals tilt outward and upward (opening bloom)
      petal.rotation.y = angle;
      petal.rotation.z = Math.PI / 4 - 0.1; // Tilt outward
      petal.rotation.x = (Math.random() - 0.5) * 0.15; // Organic variation

      nodeRoot.add(petal);

      petals.push({
        mesh: petal,
        angle: angle,
        baseRadius: baseRadius,
        breathIndex: i
      });
    }

    // Central void core
    const coreGeom = new THREE.OctahedronGeometry(0.2, 1);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a2e, // Dark void
      metalness: 0.3,
      roughness: 0.8,
      emissive: color,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.5
    });

    const core = new THREE.Mesh(coreGeom, coreMat);
    core.userData.visualLayer = 'CORE';
    core.renderOrder = coreRenderOrder - 1;
    core.frustumCulled = false;
    nodeRoot.add(core);

    // Bloom frame accent (subtle outline)
    const bloomFrameGeom = new THREE.TorusGeometry(0.65, 0.04, 6, 32);
    const bloomFrameMat = new THREE.MeshBasicMaterial({
      color: this._interpolateColor(color, 0xfffacd, 0.4), // Pale magenta
      transparent: true,
      opacity: 0.25
    });

    const bloomFrame = new THREE.Mesh(bloomFrameGeom, bloomFrameMat);
    bloomFrame.rotation.x = Math.PI / 6;
    bloomFrame.renderOrder = coreRenderOrder;
    bloomFrame.frustumCulled = false;
    nodeRoot.add(bloomFrame);

    // Store animation state
    group.userData.visualCoreImmutable = true;
    group.userData.perceptionBloomPetals = petals;
    group.userData.bloomRotationSpeed = 0.02; // Extremely slow
    group.userData.bloomBreathAmount = 0.01; // ±1% scale breathing
    group.userData.bloomAnimationType = 'perception_bloom';

    return group;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HELPER: Color interpolation
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Interpolate between two colors
   * @private
   */
  static _interpolateColor(color1, color2, amount) {
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    c1.lerp(c2, amount);
    return c1.getHex();
  }
}

export default InputSensoryGeometries;
