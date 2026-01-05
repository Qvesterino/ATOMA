import * as THREE from 'three';
import { ExtremeAINodePack } from './_ExtremeAINodePack.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { createCoreIdentityMaterial, createNodeHologramShell } from './CoreHologramShader.js';
import ControlNodeGeometries from './ControlNodeGeometries_v1.js';
import { CanonicalGeometryFamilies } from './CanonicalGeometryFamilies_v1.js';
import { AnalyticsEnhancedVariants } from './AnalyticsEnhancedVariants_Session81.js';
import { StorageEnhancedVariants } from './StorageEnhancedVariants_Session81.js';
import { ProcessEnhancedVariants } from './ProcessEnhancedVariants_Session81.js';
import { IntegrationEnhancedVariants } from './IntegrationEnhancedVariants_Session110.js';
import { ControlEnhancedVariants } from './ControlEnhancedVariants_Session83.js';
import { ControlSpineVariants } from './ControlSpineVariants_Session100.js';
import { InputEnhancedVariants } from './InputEnhancedVariants_Session84.js';
import { InputSensoryEnhanced } from './InputSensoryEnhanced_Session111.js';
import { ControlNodeSpecialGovernors } from './ControlNodeSpecialGoverners_Session114.js';
import { StorageNodesVisual } from './StorageNodesVisual_Session116.js';

/**
 * Enhanced Node Models - 42 unique geometric designs + 12 EXTREME geometries
 * Organized by layer: Input, Process, Integration, Analytics, Storage, Control
 * EXTREME geometries are integrated as additional variants in the selection pools
 * 
 * ENHANCED VARIANTS SUMMARY (Sessions 76-84):
 * - Analytics: 11 variants (8 base + 3 enhanced)
 * - Storage: 11 variants (8 base + 3 enhanced)
 * - Process: 11 variants (8 base + 3 enhanced)
 * - Integration: 11 variants (8 base + 3 enhanced knot variants) [NEW - Session 82]
 * - Control: 11 variants (8 base + 3 enhanced command/decision) [NEW - Session 83]
 * - Input: 11 variants (8 base + 3 enhanced reception/sensing) [NEW - Session 84]
 * 
 * SPINE VARIANTS (Session 100):
 * - Control Spine Variants (3 new additive variants - optional):
 *   - SegmentedSpine: Vertical stacked mechanical segments
 *   - TwistedSpine: Segmented spine with progressive rotation
 *   - HollowSpine: Column with negative space and ribs
 * - Access: EnhancedNodeModels.createControlSpineVariant('segmented'|'twisted'|'hollow', group, color)
 * - These variants are NOT auto-selected (separate from 11-variant rotation)
 * 
 * VISUAL HIERARCHY INTEGRATION (Session 21):
 * - All core geometries now query VisualHierarchyRegistry for renderOrder
 * - Fallback to hardcoded values if registry unavailable
 * - Inner/archetype geometries use registry layer: ARCHETYPE
 */
export class EnhancedNodeModels {
  // Shared EXTREME generator instance
  static extremeNodePack = new ExtremeAINodePack();

  // ============================================================================
  // LEGACY SCALE PULSE AUDIT & DISABLE (Session 107)
  // ============================================================================
  // Disable unintentional node breathing/pulsing behaviors:
  // - TRANSFORMATION_SPINE breathing (±2% scale oscillation)
  // - FRACTAL_ECHO breathing (±1.5% scale oscillation)
  // - INCOMING_FUNNEL width breathing (±3% scale oscillation)
  // - SIGNAL_RECEPTOR antenna pulse (±8% scale elongation)
  // - COMMAND_PYRAMID glow pulsing (scale mutation without feedback)
  // 
  // Master flag: DISABLE_LEGACY_SCALE_PULSE (default: true - all breathing DISABLED)
  static config = {
    DISABLE_LEGACY_SCALE_PULSE: true,  // Master disable (all breathing disabled by default)
    DISABLE_SPINE_BREATHING: true,     // Disable TRANSFORMATION_SPINE breathing
    DISABLE_FUNNEL_BREATHING: true,    // Disable INCOMING_FUNNEL width breathing
    DISABLE_FRACTAL_BREATHING: true,   // Disable FRACTAL_ECHO breathing
    DISABLE_ANTENNA_PULSE: true,       // Disable SIGNAL_RECEPTOR antenna pulse
    DISABLE_GLOW_PULSING: true,        // Disable COMMAND_PYRAMID glow pulsing
  };

  /**
   * Get renderOrder for core geometry (from VisualHierarchyRegistry)
   * Falls back to hardcoded value if registry unavailable
   * @private
   * @returns {number} renderOrder for CORE layer
   */
  static _getCoreRenderOrder() {
    try {
      return VisualHierarchyRegistry?.getRenderOrder('CORE', 0) ?? 0;
    } catch (err) {
      return 0; // Safe fallback
    }
  }

  /**
   * Get renderOrder for archetype geometry (from VisualHierarchyRegistry)
   * Falls back to hardcoded value if registry unavailable
   * @private
   * @returns {number} renderOrder for ARCHETYPE layer
   */
  static _getArchetypeRenderOrder() {
    try {
      return VisualHierarchyRegistry?.getRenderOrder('ARCHETYPE', 1) ?? 1;
    } catch (err) {
      return 1; // Safe fallback
    }
  }

  /**
   * Create node by category and index
   */
  static create(category = 'input', index = 0, color = 0x00ffff) {
    const nodeGroup = new THREE.Group();
    
    switch(category.toLowerCase()) {
      // INPUT NODES (Cyan)
      case 'input':
        return this.createInputNode(nodeGroup, index, color);
      
      // PROCESS NODES (Amber/Gold)
      case 'process':
        return this.createProcessNode(nodeGroup, index, color);
      
      // INTEGRATION NODES (Green)
      case 'integration':
        return this.createIntegrationNode(nodeGroup, index, color);
      
      // ANALYTICS NODES (Violet)
      case 'analytics':
        return this.createAnalyticsNode(nodeGroup, index, color);
      
      // STORAGE NODES (Silver/Pale Blue)
      case 'storage':
        return this.createStorageNode(nodeGroup, index, color);
      
      // CONTROL NODES (Red/Magenta)
      case 'control':
        return this.createControlNode(nodeGroup, index, color);
      
      // QUANTUM NODES (Bright Green - Dimensional Anomaly)
      case 'quantum':
      case 'sigma': // Legacy alias for compatibility
        return this.createQuantumNode(nodeGroup, index, color);
      
      // MYTHIC NODES (Ancient Fractured Relics)
      case 'mythic':
        return this.createMythicNode(nodeGroup, index, color);
      
      // PRIME NODES (Perfect Axioms)
      case 'prime':
        return this.createPrimeNode(nodeGroup, index, color);
      
      // ERROR NODES (Frozen Corruption)
      case 'error':
        return this.createErrorNode(nodeGroup, index, color);
      
      // EMOTIONAL NODES (Crystalline Organics)
      case 'emotional':
        return this.createEmotionalNode(nodeGroup, index, color);
      
      default:
        console.warn(`[EnhancedNodeModels] Unknown category: '${category}'. Falling back to INPUT.`);
        return this.createInputNode(nodeGroup, index, color);
    }
  }

  // ===== INPUT NODES (Cyan - 4 variants) =====

  /**
   * Input Node 0: Triangular prism with cyan rim glow + inner rotating tetrahedron
   * UPGRADED: Added inner signal-like tetrahedron rotating on different axis
   * VISUAL HIERARCHY: Inner geometry opacity reduced to 0.50–0.55 (was 0.6)
   */
  static createInputNode0(group, color) {
    // STABLE NODE ROOT - Single source of truth for all visual systems
    if (!group.userData.nodeRoot) {
      const nodeRoot = new THREE.Group();
      nodeRoot.userData.isNodeRoot = true;
      group.add(nodeRoot);
      group.userData.nodeRoot = nodeRoot;
    }
    const nodeRoot = group.userData.nodeRoot;
    
    // Get canonical renderOrder from registry
    const coreRenderOrder = this._getCoreRenderOrder();
    const archetypeRenderOrder = this._getArchetypeRenderOrder();

    // Triangular prism core - IDENTITY LAYER (purely solid)
    const prismGeometry = new THREE.ConeGeometry(0.8, 1.2, 3);
    const prismMaterial = createCoreIdentityMaterial(color);
    const prism = new THREE.Mesh(prismGeometry, prismMaterial);
    prism.rotation.z = Math.PI / 2;
    prism.renderOrder = coreRenderOrder;
    prism.frustumCulled = false;
    prism.userData.visualLayer = 'CORE';
    nodeRoot.add(prism);
    
    // HOLOGRAM SHELL - UNIFIED CREATION (STABLE ICOSPHERE, not derived from core)
    const prismShell = createNodeHologramShell(prism, color);
    if (prismShell) {
      nodeRoot.add(prismShell);
    }

    // Subtle cyan rim glow
    const rimGeometry = new THREE.TorusGeometry(0.95, 0.08, 8, 32);
    const rimMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.4
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.scale.z = 0.3;
    rim.renderOrder = coreRenderOrder;  // ← Uses registry
    rim.userData.visualLayer = 'CORE';
    group.add(rim);

    // POLISH: Inner rotating tetrahedron (signal forming effect)
    // VISUAL HIERARCHY: Reduced opacity from 0.6 to 0.52 (10–15% reduction)
    const innerTetraGeometry = new THREE.TetrahedronGeometry(0.3, 1);
    const innerTetraMaterial = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.9,
      roughness: 0.1,
      emissive: color,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.52  // Reduced from 0.6
    });
    const innerTetra = new THREE.Mesh(innerTetraGeometry, innerTetraMaterial);
    innerTetra.rotation.set(Math.PI / 6, 0, Math.PI / 4);
    innerTetra.renderOrder = archetypeRenderOrder;  // ← Uses registry
    innerTetra.userData.visualLayer = 'ARCHETYPE';
    group.add(innerTetra);

    // Store animation metadata
    group.userData.innerSignalRotationAxis = new THREE.Vector3(0.5, -1, 0.7).normalize();
    group.userData.innerSignalRotationSpeed = 0.2;

    return group;
  }

  /**
   * Input Node 1: Sphere with holographic rings + internal directional vector
   * UPGRADED: Added inner rotating arrow-like octahedron for directionality
   * VISUAL HIERARCHY: Inner geometry opacity reduced to 0.55–0.60 (was 0.7)
   */
  static createInputNode1(group, color) {
    // STABLE NODE ROOT - Single source of truth for all visual systems
    if (!group.userData.nodeRoot) {
      const nodeRoot = new THREE.Group();
      nodeRoot.userData.isNodeRoot = true;
      group.add(nodeRoot);
      group.userData.nodeRoot = nodeRoot;
    }
    const nodeRoot = group.userData.nodeRoot;
    
    // Smooth sphere core - IDENTITY LAYER (purely solid)
    const sphereGeometry = new THREE.SphereGeometry(0.7, 32, 32);
    const sphereMaterial = createCoreIdentityMaterial(color);
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.renderOrder = 0;
    sphere.frustumCulled = false;
    sphere.userData.visualLayer = 'CORE';
    nodeRoot.add(sphere);
    
    // HOLOGRAM SHELL - UNIFIED CREATION (STABLE ICOSPHERE, not derived from core)
    const sphereShell = createNodeHologramShell(sphere, color);
    if (sphereShell) {
      nodeRoot.add(sphereShell);
    }

    // Holographic rings
    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.TorusGeometry(1.1 + i * 0.3, 0.04, 16, 100);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.25 - i * 0.06
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.z = Math.random() * Math.PI;
      ring.renderOrder = 2;  // RINGS layer
      ring.userData.visualLayer = 'RINGS';
      group.add(ring);
    }

    // POLISH: Internal directional vector (stretched octahedron as arrow)
    // VISUAL HIERARCHY: Reduced opacity from 0.7 to 0.58 (17% reduction)
    const vectorGeometry = new THREE.OctahedronGeometry(0.25, 1);
    const vectorMaterial = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.95,
      roughness: 0.05,
      emissive: color,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.58  // Reduced from 0.7
    });
    const vector = new THREE.Mesh(vectorGeometry, vectorMaterial);
    vector.scale.set(1.5, 0.6, 0.6); // Stretched to look like directional arrow
    vector.rotation.set(Math.PI / 6, Math.PI / 4, 0);
    vector.renderOrder = 1;  // INTERNAL layer
    vector.userData.visualLayer = 'INTERNAL';
    group.add(vector);

    // Store animation metadata
    group.userData.vectorRotationAxis = new THREE.Vector3(-0.3, 1, 0.2).normalize();
    group.userData.vectorRotationSpeed = 0.25;

    return group;
  }

  /**
   * Input Node 2: Inverted cone (incoming data)
   */
  static createInputNode2(group, color) {
    // Inverted cone
    const coneGeometry = new THREE.ConeGeometry(1, 1.4, 32);
    const coneMaterial = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.6,
      roughness: 0.4,
      emissive: color,
      emissiveIntensity: 0.3
    });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.rotation.z = Math.PI;
    cone.userData.visualLayer = 'CORE';
    group.add(cone);

    // Edge highlight
    const edgeGeometry = new THREE.EdgesGeometry(coneGeometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.6
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.rotation.z = Math.PI;
    edges.userData.visualLayer = 'INTERNAL';
    group.add(edges);

    return group;
  }

  /**
   * Input Node 3: Rectangular gateway frame with cyan edge light
   */
  static createInputNode3(group, color) {
    // Gateway frame (rectangular)
    const frameGeometry = new THREE.BoxGeometry(1.2, 1.4, 0.2);
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.7,
      roughness: 0.3,
      emissive: color,
      emissiveIntensity: 0.2
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.userData.visualLayer = 'CORE';
    group.add(frame);

    // Cyan edge light (wireframe highlight)
    const wireGeometry = new THREE.BoxGeometry(1.3, 1.5, 0.25);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: color,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    const wire = new THREE.Mesh(wireGeometry, wireMaterial);
    wire.userData.visualLayer = 'INTERNAL';
    group.add(wire);

    return group;
  }

  /**
   * Main input node creator
   * CANONICAL CATEGORY: INPUT
   * - TriangularPrism+Rim
   * - PyramidSpike
   * - WireframeSphere
   * - Icosahedron
   * - SignalReceptor (NEW - Session 63)
   * - DataGateway (NEW - Session 63)
   * - IncomingFunnel (NEW - Session 63)
   * - SensorArray (NEW - Session 84)
   * - PerceptionVortex (NEW - Session 84)
   * - ResonanceChamber (NEW - Session 84)
   */
  static createInputNode(group, index, color) {
    // Deterministic selection per node ID
    let nodeId = group.userData.id || index;
    if (typeof nodeId === 'string') {
      nodeId = nodeId.charCodeAt(0) + nodeId.length;
    }
    
    const variants = [
      this.createInputNode0.bind(this),              // TriangularPrism+Rim
      this.createInputNode2.bind(this),              // PyramidSpike
      this.createInputNode1.bind(this),              // WireframeSphere (evolved sphere)
      this.createNewIcosahedron.bind(this),          // Icosahedron
      this.createInputSignalReceptor.bind(this),     // SignalReceptor (NEW)
      this.createInputDataGateway.bind(this),        // DataGateway (NEW)
      this.createInputIncomingFunnel.bind(this),     // IncomingFunnel (NEW)
      this.createExtremeInput0.bind(this),           // HyperbolicPrism
      InputSensoryEnhanced.createInputSensory_TactileSensor.bind(InputSensoryEnhanced),      // TactileSensor (Session 111)
      InputSensoryEnhanced.createInputSensory_EchoDetector.bind(InputSensoryEnhanced),        // EchoDetector (Session 111)
      InputSensoryEnhanced.createInputSensory_NeuralReceptor.bind(InputSensoryEnhanced)       // NeuralReceptor (Session 111)
    ];
    return variants[nodeId % 11](group, color);
  }

  /**
   * INPUT: SIGNAL_RECEPTOR (NEW - Session 63)
   * Multi-directional antenna receiving incoming signals
   * - Central reception core (octahedron)
   * - 6 radial antenna arms (pointing outward)
   * - Subtle pulsing along antenna paths (scale-based)
   * - Animation: Slow rotation + antenna pulse propagation
   * 
   * VISUAL MEANING: "Ready to receive."
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createInputSignalReceptor(group, color) {
    try {
      // Create central reception core (octahedron)
      const coreGeometry = new THREE.OctahedronGeometry(0.3, 2);
      const coreMaterial = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.8,
        roughness: 0.12,
        transmission: 0.3,
        thickness: 0.3,
        ior: 1.45,
        emissive: color,
        emissiveIntensity: 0.35
      });

      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      core.userData.isReceptionCore = true;
      core.userData.visualCoreImmutable = true;
      group.add(core);

      // Create 6 radial antenna arms (pointing in +/- X, Y, Z directions)
      const antennaCount = 6;
      const antennaLength = 0.65;
      const antennaMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.75,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.25
      });

      const antennaDirections = [
        [1, 0, 0],    // +X
        [-1, 0, 0],   // -X
        [0, 1, 0],    // +Y
        [0, -1, 0],   // -Y
        [0, 0, 1],    // +Z
        [0, 0, -1]    // -Z
      ];

      for (let i = 0; i < antennaCount; i++) {
        // Create antenna arm as a tapered cone
        const antennaGeometry = new THREE.ConeGeometry(0.08, antennaLength, 8);
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        
        // Position and orient antenna
        const [dx, dy, dz] = antennaDirections[i];
        antenna.position.set(
          dx * (antennaLength / 2 + 0.15),
          dy * (antennaLength / 2 + 0.15),
          dz * (antennaLength / 2 + 0.15)
        );
        
        // Point antenna outward
        antenna.lookAt(
          dx * (antennaLength + 1),
          dy * (antennaLength + 1),
          dz * (antennaLength + 1)
        );
        
        antenna.userData.isAntenna = true;
        antenna.userData.antennaIndex = i;
        antenna.userData.antennaDirection = new THREE.Vector3(dx, dy, dz);
        antenna.userData.visualCoreImmutable = true;
        group.add(antenna);
      }

      // Store animation metadata
      group.userData.receptorRotationSpeed = 0.15; // Slow rotation
      group.userData.antennaaPulseAmplitude = 0.08; // 8% antenna breathing
      group.userData.antennaPulseSpeed = 1.2;
      group.userData.antennaCount = antennaCount;

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'INPUT_SIGNAL_RECEPTOR';

      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] SignalReceptor creation failed, fallback:', err);
      return this.createInputNode0(group, color);
    }
  }

  /**
   * INPUT: DATA_GATEWAY (NEW - Session 63)
   * Threshold/gateway where data enters the system
   * - Outer ring gateway frame (octagonal, open in center)
   * - Inner float portal with data stream indicators
   * - Flowing segments suggesting direction of data ingestion
   * - Animation: Ring rotation + portal oscillation + segment flow
   * 
   * VISUAL MEANING: "Enter here."
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createInputDataGateway(group, color) {
    try {
      // Create outer octagonal gateway ring frame
      const ringGeometry = new THREE.TorusGeometry(0.65, 0.1, 8, 64);
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.7,
        roughness: 0.25,
        emissive: color,
        emissiveIntensity: 0.25
      });

      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.userData.isGatewayRing = true;
      ring.userData.visualCoreImmutable = true;
      group.add(ring);

      // Create inner portal (floating icosahedron)
      const portalGeometry = new THREE.IcosahedronGeometry(0.25, 2);
      portalGeometry.scale(0.95, 1.15, 0.9); // Elongated vertically
      
      const portalMaterial = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.85,
        roughness: 0.1,
        transmission: 0.35,
        thickness: 0.35,
        ior: 1.48,
        emissive: color,
        emissiveIntensity: 0.4
      });

      const portal = new THREE.Mesh(portalGeometry, portalMaterial);
      portal.userData.isPortal = true;
      portal.userData.visualCoreImmutable = true;
      group.add(portal);

      // Create flowing data stream segments (7 boxes flowing inward)
      const streamCount = 7;
      const streamMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.4
      });

      for (let i = 0; i < streamCount; i++) {
        const segmentGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.08);
        const segment = new THREE.Mesh(segmentGeometry, streamMaterial);
        
        // Position segments flowing inward along Z-axis
        const zPos = 0.8 - (i / streamCount) * 1.2;
        segment.position.z = zPos;
        
        // Add slight rotation for visual interest
        segment.rotation.y = (i / streamCount) * Math.PI / 2;
        segment.rotation.x = Math.sin(i * 0.4) * 0.1;
        
        segment.userData.isStreamSegment = true;
        segment.userData.segmentIndex = i;
        segment.userData.baseZ = zPos;
        segment.userData.visualCoreImmutable = true;
        group.add(segment);
      }

      // Store animation metadata
      group.userData.gatewayRingRotationSpeed = 0.2; // Steady rotation
      group.userData.portalOscillationAmplitude = 0.05; // 5% oscillation
      group.userData.portalOscillationSpeed = 0.8;
      group.userData.streamFlowSpeed = 0.6; // Data stream flow animation
      group.userData.streamCount = streamCount;

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'INPUT_DATA_GATEWAY';

      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] DataGateway creation failed, fallback:', err);
      return this.createInputNode1(group, color);
    }
  }

  /**
   * INPUT: INCOMING_FUNNEL (NEW - Session 63)
   * Funnel structure concentrating incoming data/signals
   * - Upper wide opening (capture area)
   * - Progressively narrowing channels
   * - Central concentration point (mesh)
   * - Animation: Slow funnel rotation + gentle width breathing
   * 
   * VISUAL MEANING: "Data flows through here."
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createInputIncomingFunnel(group, color) {
    try {
      // Create funnel shell using custom tapered geometry
      const funnelVertices = new Float32Array([
        // Top ring (wide opening)
        0.55, 0.5, 0.0,      // 0
        0.39, 0.5, 0.39,     // 1
        0.0, 0.5, 0.55,      // 2
        -0.39, 0.5, 0.39,    // 3
        -0.55, 0.5, 0.0,     // 4
        -0.39, 0.5, -0.39,   // 5
        0.0, 0.5, -0.55,     // 6
        0.39, 0.5, -0.39,    // 7
        
        // Middle ring (transition)
        0.32, 0.0, 0.0,      // 8
        0.23, 0.0, 0.23,     // 9
        0.0, 0.0, 0.32,      // 10
        -0.23, 0.0, 0.23,    // 11
        -0.32, 0.0, 0.0,     // 12
        -0.23, 0.0, -0.23,   // 13
        0.0, 0.0, -0.32,     // 14
        0.23, 0.0, -0.23,    // 15
        
        // Bottom point
        0.0, -0.5, 0.0       // 16
      ]);

      const funnelIndices = new Uint16Array([
        // Top surface
        0, 1, 2,
        2, 3, 4,
        4, 5, 6,
        6, 7, 0,
        0, 2, 4,
        4, 6, 0,
        
        // Top to middle ring
        0, 8, 1,
        1, 9, 2,
        2, 10, 3,
        3, 11, 4,
        4, 12, 5,
        5, 13, 6,
        6, 14, 7,
        7, 15, 0,
        1, 8, 9,
        2, 9, 10,
        3, 10, 11,
        4, 11, 12,
        5, 12, 13,
        6, 13, 14,
        7, 14, 15,
        0, 15, 8,
        
        // Middle to bottom (cone formation)
        8, 16, 9,
        9, 16, 10,
        10, 16, 11,
        11, 16, 12,
        12, 16, 13,
        13, 16, 14,
        14, 16, 15,
        15, 16, 8
      ]);

      const funnelGeometry = new THREE.BufferGeometry();
      funnelGeometry.setAttribute('position', new THREE.BufferAttribute(funnelVertices, 3));
      funnelGeometry.setIndex(new THREE.BufferAttribute(funnelIndices, 1));
      funnelGeometry.computeVertexNormals();

      const funnelMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.65,
        roughness: 0.3,
        emissive: color,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });

      const funnel = new THREE.Mesh(funnelGeometry, funnelMaterial);
      funnel.userData.isFunnelShell = true;
      funnel.userData.visualCoreImmutable = true;
      group.add(funnel);

      // Create central concentration point (focal core)
      const focalGeometry = new THREE.OctahedronGeometry(0.18, 1);
      focalGeometry.scale(1.0, 0.7, 1.0); // Flatten slightly
      
      const focalMaterial = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.85,
        roughness: 0.12,
        transmission: 0.4,
        thickness: 0.25,
        ior: 1.5,
        emissive: color,
        emissiveIntensity: 0.45
      });

      const focal = new THREE.Mesh(focalGeometry, focalMaterial);
      focal.position.y = -0.35;
      focal.userData.isFocalCore = true;
      focal.userData.visualCoreImmutable = true;
      group.add(focal);

      // Create internal channel guides (subtle rings showing flow path)
      for (let i = 1; i < 4; i++) {
        const guideGeometry = new THREE.TorusGeometry(
          0.55 - (i * 0.12),
          0.03,
          8,
          32
        );
        const guideMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.2
        });
        const guide = new THREE.Mesh(guideGeometry, guideMaterial);
        
        guide.position.y = 0.5 - (i * 0.2);
        guide.userData.isFlowGuide = true;
        guide.userData.visualCoreImmutable = true;
        group.add(guide);
      }

      // Store animation metadata
      group.userData.funnelRotationSpeed = 0.1; // Slow rotation
      group.userData.funnelBreathingAmplitude = 0.03; // ±3% width breathing
      group.userData.funnelBreathingSpeed = 0.5;

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'INPUT_INCOMING_FUNNEL';

      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] IncomingFunnel creation failed, fallback:', err);
      return this.createInputNode2(group, color);
    }
  }

  // ===== PROCESS NODES (Amber/Gold - 4 variants) =====

  /**
   * Process Node 0: Cube within cube, rotating effect
   */
  static createProcessNode0(group, color) {
    // Outer cube
    const outerGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.8,
      roughness: 0.2,
      emissive: color,
      emissiveIntensity: 0.3
    });
    const outerCube = new THREE.Mesh(outerGeometry, cubeMaterial);
    outerCube.userData.visualLayer = 'CORE';
    group.add(outerCube);

    // Inner cube (rotated)
    const innerGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const innerCube = new THREE.Mesh(innerGeometry, cubeMaterial);
    innerCube.rotation.set(Math.PI / 6, Math.PI / 4, Math.PI / 6);
    innerCube.userData.visualLayer = 'INTERNAL';
    group.add(innerCube);

    // Add rotation animation state
    group.userData.rotationAxis = new THREE.Vector3(1, 1, 1).normalize();

    return group;
  }

  /**
   * Process Node 1: Circular core with radial cutouts
   */
  static createProcessNode1(group, color) {
    const cylinderGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 32);
    const cylinderMaterial = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.7,
      roughness: 0.3,
      emissive: color,
      emissiveIntensity: 0.3
    });
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.userData.visualLayer = 'CORE';
    group.add(cylinder);

    // Radial cutout indicators (spikes)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const spikeGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.3);
      const spike = new THREE.Mesh(spikeGeometry, cylinderMaterial);
      spike.position.x = Math.cos(angle) * 1.0;
      spike.position.z = Math.sin(angle) * 1.0;
      spike.userData.visualLayer = 'RINGS';
      group.add(spike);
    }

    group.userData.rotationAxis = new THREE.Vector3(0, 1, 0);

    return group;
  }

  /**
   * Process Node 2: Layered rectangular plates
   */
  static createProcessNode2(group, color) {
    const plateCount = 4;
    const plateMaterial = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.7,
      roughness: 0.25,
      emissive: color,
      emissiveIntensity: 0.25
    });

    for (let i = 0; i < plateCount; i++) {
      const plateGeometry = new THREE.BoxGeometry(1.2, 0.25, 1.2);
      const plate = new THREE.Mesh(plateGeometry, plateMaterial);
      plate.position.y = (i - plateCount / 2) * 0.4;
      plate.userData.visualLayer = 'CORE'; // Each plate is part of the core structure
      group.add(plate);
    }

    return group;
  }

  /**
   * Process Node 3: Torus with inner segmentation
   */
  static createProcessNode3(group, color) {
    const torusGeometry = new THREE.TorusGeometry(0.8, 0.3, 8, 100);
    const torusMaterial = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.7,
      roughness: 0.3,
      emissive: color,
      emissiveIntensity: 0.3
    });
    const torus = new THREE.Mesh(torusGeometry, torusMaterial);
    torus.userData.visualLayer = 'CORE';
    group.add(torus);

    // Inner segmentation (rings)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const segGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.6);
      const seg = new THREE.Mesh(segGeometry, torusMaterial);
      seg.position.x = Math.cos(angle) * 0.5;
      seg.position.z = Math.sin(angle) * 0.5;
      seg.rotation.y = angle;
      seg.userData.visualLayer = 'INTERNAL';
      group.add(seg);
    }

    group.userData.rotationAxis = new THREE.Vector3(0, 1, 0);

    return group;
  }

  /**
   * Main process node creator
   * CANONICAL CATEGORY: PROCESS
   * - DiamondLattice
   * - Helix
   * - DoubleHelix
   * - MeshColumn
   * - HexagonalPrism
   * - FluxChamber (Session 63)
   * - TransformationSpine (Session 63)
   * - ConversionOrbit (Session 63)
   * - ComputationVortex (NEW - Session 81)
   * - TransformMatrix (NEW - Session 81)
   * - PipelineFlow (NEW - Session 81)
   */
  static createProcessNode(group, index, color) {
    // Deterministic selection per node ID
    let nodeId = group.userData.id || index;
    if (typeof nodeId === 'string') {
      nodeId = nodeId.charCodeAt(0) + nodeId.length;
    }
    
    const variants = [
      this.createProcessNode0.bind(this),                        // DiamondLattice
      this.createProcessNode3.bind(this),                        // Helix
      this.createProcessNode2.bind(this),                        // DoubleHelix
      this.createProcessNode1.bind(this),                        // MeshColumn
      this.createNewHexagonalPrism.bind(this),                   // HexagonalPrism
      this.createProcessFluxChamber.bind(this),                  // FluxChamber
      this.createProcessTransformationSpine.bind(this),          // TransformationSpine
      this.createProcessConversionOrbit.bind(this),              // ConversionOrbit
      ProcessEnhancedVariants.createProcessEnhanced_FlowRecomposer.bind(ProcessEnhancedVariants),  // FlowRecomposer (NEW)
      ProcessEnhancedVariants.createProcessEnhanced_TemporalShifter.bind(ProcessEnhancedVariants),    // TemporalShifter (NEW)
      ProcessEnhancedVariants.createProcessEnhanced_IterativeEngine.bind(ProcessEnhancedVariants)        // IterativeEngine (NEW)
    ];
    return variants[nodeId % 11](group, color);
  }

  /**
   * PROCESS: FLUX_CHAMBER (NEW - Session 63)
   * Chamber where data enters, transforms, and exits
   * - Hollow asymmetric structure (not spherical)
   * - Visible internal path/corridor
   * - Inner core rotates at different speed
   * - Animation: Slow rotation + inner core counter-rotation
   * 
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createProcessFluxChamber(group, color) {
    try {
      // Create outer asymmetric chamber shell (twisted hex-like shape)
      const outerVertices = new Float32Array([
        // Base hexagon (asymmetric)
        0.35, -0.45, 0.0,     // 0
        0.20, -0.45, 0.32,    // 1
        -0.15, -0.45, 0.38,   // 2
        -0.40, -0.45, 0.15,   // 3
        -0.30, -0.45, -0.25,  // 4
        0.15, -0.45, -0.35,   // 5
        
        // Upper middle (transition)
        0.32, 0.0, -0.08,     // 6
        0.18, 0.0, 0.30,      // 7
        -0.12, 0.0, 0.35,     // 8
        -0.38, 0.0, 0.12,     // 9
        -0.28, 0.0, -0.28,    // 10
        0.12, 0.0, -0.32,     // 11
        
        // Top (narrower)
        0.25, 0.45, -0.12,    // 12
        0.10, 0.45, 0.25,     // 13
        -0.15, 0.45, 0.28,    // 14
        -0.30, 0.45, 0.08,    // 15
        -0.22, 0.45, -0.20,   // 16
        0.08, 0.45, -0.25     // 17
      ]);

      const outerIndices = new Uint16Array([
        // Base to middle (6 sides - asymmetric)
        0, 6, 7,
        1, 7, 8,
        2, 8, 9,
        3, 9, 10,
        4, 10, 11,
        5, 11, 6,
        0, 1, 7,
        1, 2, 8,
        2, 3, 9,
        3, 4, 10,
        4, 5, 11,
        5, 0, 6,
        
        // Middle to top (6 sides)
        6, 12, 13,
        7, 13, 14,
        8, 14, 15,
        9, 15, 16,
        10, 16, 17,
        11, 17, 12,
        6, 7, 13,
        7, 8, 14,
        8, 9, 15,
        9, 10, 16,
        10, 11, 17,
        11, 6, 12
      ]);

      const outerGeometry = new THREE.BufferGeometry();
      outerGeometry.setAttribute('position', new THREE.BufferAttribute(outerVertices, 3));
      outerGeometry.setIndex(new THREE.BufferAttribute(outerIndices, 1));
      outerGeometry.computeVertexNormals();

      const outerMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.7,
        roughness: 0.25,
        emissive: color,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.6
      });

      const outerChamber = new THREE.Mesh(outerGeometry, outerMaterial);
      outerChamber.userData.isOuterChamber = true;
      outerChamber.userData.visualCoreImmutable = true;
      group.add(outerChamber);

      // Create inner processing core (counter-rotating asymmetric shape)
      const innerCoreGeometry = new THREE.OctahedronGeometry(0.28, 2);
      innerCoreGeometry.scale(0.9, 1.2, 0.75); // Asymmetric elongation
      
      const innerCoreMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.85,
        roughness: 0.15,
        emissive: color,
        emissiveIntensity: 0.35
      });

      const innerCore = new THREE.Mesh(innerCoreGeometry, innerCoreMaterial);
      innerCore.rotation.set(Math.PI / 8, Math.PI / 6, 0);
      innerCore.userData.isProcessorCore = true;
      innerCore.userData.visualCoreImmutable = true;
      group.add(innerCore);

      // Create visible internal corridor (thin plane representing flow path)
      const corridorVertices = new Float32Array([
        -0.15, -0.30, -0.05,
        0.20, -0.30, 0.15,
        0.15, 0.30, 0.10,
        -0.20, 0.30, -0.10
      ]);

      const corridorIndices = new Uint16Array([
        0, 1, 2,
        0, 2, 3
      ]);

      const corridorGeometry = new THREE.BufferGeometry();
      corridorGeometry.setAttribute('position', new THREE.BufferAttribute(corridorVertices, 3));
      corridorGeometry.setIndex(new THREE.BufferAttribute(corridorIndices, 1));
      corridorGeometry.computeVertexNormals();

      const corridorMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide
      });

      const corridor = new THREE.Mesh(corridorGeometry, corridorMaterial);
      corridor.userData.isFlowCorridor = true;
      corridor.userData.visualCoreImmutable = true;
      group.add(corridor);

      // Store animation metadata (transform-only)
      group.userData.chamberOuterRotationAxis = new THREE.Vector3(0.4, 1, 0.2).normalize();
      group.userData.chamberOuterRotationSpeed = 0.1;
      group.userData.chamberInnerRotationAxis = new THREE.Vector3(-0.3, -0.9, 0.4).normalize();
      group.userData.chamberInnerRotationSpeed = -0.14; // Counter-rotation

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'PROCESS_FLUX_CHAMBER';

      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] FluxChamber creation failed, fallback:', err);
      return this.createProcessNode0(group, color);
    }
  }

  /**
   * PROCESS: TRANSFORMATION_SPINE (NEW - Session 63)
   * Sequential computation stages stacked vertically
   * - Vertical segmented spine structure
   * - Each segment slightly rotated relative to next
   * - Clear sense of "before → after" progression
   * - Animation: Very slow axial rotation + gentle breathing scale (±2%)
   * 
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createProcessTransformationSpine(group, color) {
    try {
      const segmentCount = 7;
      const segmentHeight = 0.22;
      const spineMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.75,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.25
      });

      // Create segment-by-segment spine with progressive rotation
      for (let i = 0; i < segmentCount; i++) {
        // Create octagonal segment (8-sided, represents transformation stage)
        const segmentGeometry = new THREE.CylinderGeometry(0.4, 0.4, segmentHeight, 8);
        const segment = new THREE.Mesh(segmentGeometry, spineMaterial);
        
        // Position vertically
        const yPos = (i - segmentCount / 2) * (segmentHeight + 0.06);
        segment.position.y = yPos;
        
        // Progressive rotation (before → after effect)
        const rotationAmount = (i / (segmentCount - 1)) * Math.PI * 0.25;
        segment.rotation.z = rotationAmount;
        
        segment.userData.spineSegmentIndex = i;
        segment.userData.visualCoreImmutable = true;
        group.add(segment);
      }

      // Create central connecting axis
      const axisGeometry = new THREE.CylinderGeometry(0.08, 0.08, segmentCount * (segmentHeight + 0.06), 6);
      const axisMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.9,
        roughness: 0.1,
        emissive: color,
        emissiveIntensity: 0.4
      });
      const axis = new THREE.Mesh(axisGeometry, axisMaterial);
      axis.userData.isSpinalAxis = true;
      axis.userData.visualCoreImmutable = true;
      group.add(axis);

      // Add connector rings between segments for visual continuity
      for (let i = 0; i < segmentCount - 1; i++) {
        const ringGeometry = new THREE.TorusGeometry(0.42, 0.04, 8, 24);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.4
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        
        const yPos = (i + 0.5 - segmentCount / 2) * (segmentHeight + 0.06);
        ring.position.y = yPos;
        ring.userData.visualCoreImmutable = true;
        group.add(ring);
      }

      // Store animation metadata (transform-only breathing + rotation)
      group.userData.spineRotationSpeed = 0.08; // Very slow axial
      group.userData.spineBreathingAmplitude = 0.02; // ±2% scale
      group.userData.spineBreathingSpeed = 0.5;

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'PROCESS_TRANSFORMATION_SPINE';

      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] TransformationSpine creation failed, fallback:', err);
      return this.createProcessNode2(group, color);
    }
  }

  /**
   * PROCESS: CONVERSION_ORBIT (NEW - Session 63)
   * Input captured, processed, released
   * - Central processor core (non-spherical tetrahedral form)
   * - Two orbiting processing rings (NO intersection with core)
   * - Animation: Rings orbit independently, core stable
   * 
   * VISUAL SAFETY: Static geometry, transform-only animation (orbit), immutable
   */
  static createProcessConversionOrbit(group, color) {
    try {
      // Create central processor core (asymmetric tetrahedron - non-spherical)
      const processorGeometry = new THREE.TetrahedronGeometry(0.35, 2);
      processorGeometry.scale(1.1, 1.3, 0.9); // Asymmetric elongation
      
      const processorMaterial = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.8,
        roughness: 0.12,
        transmission: 0.2,
        thickness: 0.3,
        ior: 1.45,
        emissive: color,
        emissiveIntensity: 0.3
      });

      const processor = new THREE.Mesh(processorGeometry, processorMaterial);
      processor.rotation.set(Math.PI / 6, Math.PI / 4, -Math.PI / 8);
      processor.userData.isProcessorCore = true;
      processor.userData.visualCoreImmutable = true;
      group.add(processor);

      // Create first orbiting processing ring (outer)
      const ring1Geometry = new THREE.TorusGeometry(0.75, 0.08, 8, 64);
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.7,
        roughness: 0.25,
        emissive: color,
        emissiveIntensity: 0.2
      });

      const ring1 = new THREE.Mesh(ring1Geometry, ringMaterial);
      ring1.rotation.x = Math.PI / 3;
      ring1.userData.isOrbitRing = true;
      ring1.userData.orbitRadius = 0.75;
      ring1.userData.orbitSpeed = 0.18;
      ring1.userData.orbitAxis = new THREE.Vector3(1, 0.5, 0.3).normalize();
      ring1.userData.visualCoreImmutable = true;
      group.add(ring1);

      // Create second orbiting processing ring (inner, counter-rotating)
      const ring2Geometry = new THREE.TorusGeometry(0.52, 0.07, 8, 48);
      const ring2 = new THREE.Mesh(ring2Geometry, ringMaterial);
      ring2.rotation.y = Math.PI / 4;
      ring2.rotation.z = Math.PI / 6;
      ring2.userData.isOrbitRing = true;
      ring2.userData.orbitRadius = 0.52;
      ring2.userData.orbitSpeed = -0.22; // Counter-rotation
      ring2.userData.orbitAxis = new THREE.Vector3(-0.5, -1, 0.2).normalize();
      ring2.userData.visualCoreImmutable = true;
      group.add(ring2);

      // Store animation metadata (orbit-based)
      group.userData.orbitRingCount = 2;

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'PROCESS_CONVERSION_ORBIT';

      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] ConversionOrbit creation failed, fallback:', err);
      return this.createProcessNode1(group, color);
    }
  }

  // ===== INTEGRATION NODES (Green - 4 variants) =====

  /**
   * Integration Node 0: Two halves with glowing bridge
   */
  static createIntegrationNode0(group, color) {
    const halfGeometry = new THREE.SphereGeometry(0.5, 16, 16, 0, Math.PI);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.6,
      roughness: 0.4,
      emissive: color,
      emissiveIntensity: 0.25
    });

    // Left half
    const leftHalf = new THREE.Mesh(halfGeometry, material);
    leftHalf.position.x = -0.3;
    leftHalf.userData.visualLayer = 'CORE';
    group.add(leftHalf);

    // Right half
    const rightHalf = new THREE.Mesh(halfGeometry, material);
    rightHalf.position.x = 0.3;
    rightHalf.rotation.y = Math.PI;
    rightHalf.userData.visualLayer = 'CORE';
    group.add(rightHalf);

    // Glowing bridge beam
    const bridgeGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.15);
    const bridgeMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8
    });
    const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.userData.visualLayer = 'INTERNAL';
    group.add(bridge);

    return group;
  }

  /**
   * Integration Node 1: Two overlapping spheres
   */
  static createIntegrationNode1(group, color) {
    const sphereGeometry = new THREE.SphereGeometry(0.6, 24, 24);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.6,
      roughness: 0.35,
      emissive: color,
      emissiveIntensity: 0.25
    });

    // Left sphere
    const leftSphere = new THREE.Mesh(sphereGeometry, material);
    leftSphere.position.x = -0.35;
    leftSphere.userData.visualLayer = 'CORE';
    group.add(leftSphere);

    // Right sphere
    const rightSphere = new THREE.Mesh(sphereGeometry, material);
    rightSphere.position.x = 0.35;
    rightSphere.userData.visualLayer = 'CORE';
    group.add(rightSphere);

    // Soft green seam (glowing line)
    const seamGeometry = new THREE.BufferGeometry();
    const seamPoints = [];
    for (let i = 0; i <= 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      seamPoints.push(
        new THREE.Vector3(0, Math.cos(angle) * 0.6, Math.sin(angle) * 0.6)
      );
    }
    seamGeometry.setFromPoints(seamPoints);
    const seamMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    });
    const seam = new THREE.Line(seamGeometry, seamMaterial);
    seam.userData.visualLayer = 'INTERNAL';
    group.add(seam);

    return group;
  }

  /**
   * Integration Node 2: Square frame with crossing beams
   */
  static createIntegrationNode2(group, color) {
    const frameGeometry = new THREE.BoxGeometry(1, 1, 0.1);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.6,
      roughness: 0.4,
      emissive: color,
      emissiveIntensity: 0.2
    });
    const frame = new THREE.Mesh(frameGeometry, material);
    frame.userData.visualLayer = 'CORE';
    group.add(frame);

    // Crossing beams
    const beamGeometry = new THREE.BoxGeometry(1.2, 0.1, 0.1);
    
    // Horizontal beam
    const hBeam = new THREE.Mesh(beamGeometry, material);
    hBeam.userData.visualLayer = 'INTERNAL';
    group.add(hBeam);

    // Vertical beam
    const vBeam = new THREE.Mesh(beamGeometry, material);
    vBeam.rotation.z = Math.PI / 2;
    vBeam.userData.visualLayer = 'INTERNAL';
    group.add(vBeam);

    return group;
  }

  /**
   * Integration Node 3: Interlocking geometric shapes (knot)
   */
  static createIntegrationNode3(group, color) {
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.6,
      roughness: 0.4,
      emissive: color,
      emissiveIntensity: 0.25
    });

    // Create interlocking tetrahedra
    const geometry1 = new THREE.TetrahedronGeometry(0.5);
    const mesh1 = new THREE.Mesh(geometry1, material);
    mesh1.rotation.set(0, 0, 0);
    mesh1.userData.visualLayer = 'CORE';
    group.add(mesh1);

    const mesh2 = new THREE.Mesh(geometry1, material);
    mesh2.rotation.set(Math.PI / 2, Math.PI / 2, 0);
    mesh2.userData.visualLayer = 'CORE';
    group.add(mesh2);

    return group;
  }

  /**
   * Main integration node creator
   * CANONICAL CATEGORY: INTEGRATION (KNOT-PRIMARY)
   * - TrefoilKnot
   * - FigureEightKnot
   * - InfiniteSelfIntersectingKnot
   * - ChaoticKnotCore
   * - BorromeanRings
   * - TorusKnot
   * - TripleHelixKnot
   * - SingularityKnot
   * - TrefoilEnhanced (NEW - Session 82)
   * - InterwovenLoops (NEW - Session 82)
   * - KnotSingularity (NEW - Session 82)
   */
  static createIntegrationNode(group, index, color) {
    // Deterministic selection per node ID
    let nodeId = group.userData.id || index;
    if (typeof nodeId === 'string') {
      nodeId = nodeId.charCodeAt(0) + nodeId.length;
    }
    
    const variants = [
      this.createKnotTrefoil.bind(this),            // TrefoilKnot
      this.createKnotFigureEight.bind(this),        // FigureEightKnot
      this.createKnotInfiniteSelfIntersecting.bind(this), // InfiniteSelfIntersectingKnot
      this.createKnotChaotic.bind(this),            // ChaoticKnotCore
      this.createKnotBorromean.bind(this),          // BorromeanRings
      this.createKnotTorusKnot.bind(this),          // TorusKnot
      this.createKnotTripleHelix.bind(this),        // TripleHelixKnot
      this.createExtremeInput1.bind(this),          // SingularityKnot (moved from INPUT)
      IntegrationEnhancedVariants.createIntegrationEnhanced_SignalKnot.bind(IntegrationEnhancedVariants),  // Signal Knot (Session 110)
      IntegrationEnhancedVariants.createIntegrationEnhanced_ProtocolTangle.bind(IntegrationEnhancedVariants),  // Protocol Tangle (Session 110)
      IntegrationEnhancedVariants.createIntegrationEnhanced_ContinuityBinder.bind(IntegrationEnhancedVariants)   // Continuity Binder (Session 110)
    ];
    return variants[nodeId % 11](group, color);
  }

  // ===== ANALYTICS NODES (Violet - 4 variants) =====

  /**
   * Analytics Node 0: Disc with central lens
   */
  static createAnalyticsNode0(group, color) {
    // Disc base
    const discGeometry = new THREE.CylinderGeometry(0.9, 0.9, 0.2, 32);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.7,
      roughness: 0.3,
      emissive: color,
      emissiveIntensity: 0.3
    });
    const disc = new THREE.Mesh(discGeometry, material);
    group.add(disc);

    // Central circular lens
    const lensGeometry = new THREE.SphereGeometry(0.4, 24, 24);
    const lensMaterial = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.9,
      roughness: 0.1,
      emissive: color,
      emissiveIntensity: 0.4
    });
    const lens = new THREE.Mesh(lensGeometry, lensMaterial);
    lens.position.y = 0.15;
    group.add(lens);

    return group;
  }

  /**
   * Analytics Node 1: Hollow cube with internal rotating geometry (UPGRADED)
   * UPGRADED: Added internal rotating octahedron/helix slice instead of static plate
   */
  static createAnalyticsNode1(group, color) {
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const wireGeometry = new THREE.EdgesGeometry(cubeGeometry);
    
    // Cube frame
    const frameMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.6
    });
    const frame = new THREE.LineSegments(wireGeometry, frameMaterial);
    frame.userData.visualLayer = 'CORE';
    group.add(frame);

    // Cube surface
    const surfaceMaterial = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.6,
      roughness: 0.4,
      emissive: color,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.2
    });
    const surface = new THREE.Mesh(cubeGeometry, surfaceMaterial);
    surface.renderOrder = 0;  // Core layer
    surface.userData.visualLayer = 'CORE';
    group.add(surface);

    // POLISH: Internal rotating octahedron (analysis geometry, not cube-in-cube)
    // VISUAL HIERARCHY: Reduced opacity from 0.7 to 0.58 (17% reduction)
    const internalGeoGeo = new THREE.OctahedronGeometry(0.35, 1);
    const internalGeoMat = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.9,
      roughness: 0.1,
      emissive: color,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.58  // Reduced from 0.7
    });
    const internalGeo = new THREE.Mesh(internalGeoGeo, internalGeoMat);
    internalGeo.rotation.set(Math.PI / 8, Math.PI / 6, Math.PI / 4);
    internalGeo.renderOrder = 1;  // Inner geometry layer
    internalGeo.userData.visualLayer = 'INTERNAL';
    internalGeo.userData = { ...internalGeo.userData, isInternalAnalysisGeometry: true };
    group.add(internalGeo);

    // Store animation metadata for slow rotation
    group.userData.internalGeometryRotationAxis = new THREE.Vector3(0.5, 1, 0.3).normalize();
    group.userData.internalGeometryRotationSpeed = 0.22;

    return group;
  }

  /**
   * Analytics Node 2: Hexagonal disc with fractal patterns
   */
  static createAnalyticsNode2(group, color) {
    // Hexagonal disc
    const hexGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 6);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.7,
      roughness: 0.3,
      emissive: color,
      emissiveIntensity: 0.3
    });
    const hex = new THREE.Mesh(hexGeometry, material);
    group.add(hex);

    // Fractal cut patterns (nested hexagons)
    for (let i = 1; i <= 2; i++) {
      const innerHexGeometry = new THREE.CylinderGeometry(0.8 - i * 0.25, 0.8 - i * 0.25, 0.25, 6);
      const innerHex = new THREE.Mesh(innerHexGeometry, material);
      innerHex.position.y = i * 0.05;
      group.add(innerHex);
    }

    return group;
  }

  /**
   * Analytics Node 3: Tall thin spike with violet rim
   */
  static createAnalyticsNode3(group, color) {
    // Tall spike prism
    const spikeGeometry = new THREE.ConeGeometry(0.3, 1.4, 8);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.6,
      roughness: 0.35,
      emissive: color,
      emissiveIntensity: 0.3
    });
    const spike = new THREE.Mesh(spikeGeometry, material);
    group.add(spike);

    // Soft violet rim
    const rimGeometry = new THREE.TorusGeometry(0.4, 0.08, 8, 32);
    const rimMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.4
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.y = -0.5;
    rim.rotation.x = Math.PI / 2;
    group.add(rim);

    return group;
  }

  /**
   * Main analytics node creator
   * CANONICAL CATEGORY: ANALYTICS
   * - DataPyramid
   * - SpinningDataSphere
   * - HexAnalysisMatrix
   * - PrismSpectrumAnalyzer
   * - ObserverLens (Session 63)
   * - FractalEcho (Session 63)
   * - ParallaxOracle (Session 63)
   * - SharedBloom (NEW - Session 81)
   * - InterpretiveSpine (NEW - Session 81)
   * - SignalDrift (NEW - Session 81)
   */
  static createAnalyticsNode(group, index, color) {
    // Deterministic selection per node ID
    let nodeId = group.userData.id || index;
    if (typeof nodeId === 'string') {
      nodeId = nodeId.charCodeAt(0) + nodeId.length;
    }
    
    const variants = [
      this.createAnalyticsNode0.bind(this),                           // DataPyramid
      this.createAnalyticsNode1.bind(this),                           // SpinningDataSphere
      this.createAnalyticsNode2.bind(this),                           // HexAnalysisMatrix
      this.createAnalyticsNode3.bind(this),                           // PrismSpectrumAnalyzer
      this.createAnalyticsObserverLens.bind(this),                    // ObserverLens
      this.createAnalyticsFractalEcho.bind(this),                     // FractalEcho
      this.createAnalyticsParallaxOracle.bind(this),                  // ParallaxOracle
      this.createNewElongatedOctahedron.bind(this),                   // ElongatedOctahedron
      AnalyticsEnhancedVariants.createAnalyticsEnhanced_SignalStratifier.bind(AnalyticsEnhancedVariants),  // SignalStratifier (NEW)
      AnalyticsEnhancedVariants.createAnalyticsEnhanced_TrendExcavator.bind(AnalyticsEnhancedVariants),    // TrendExcavator (NEW)
      AnalyticsEnhancedVariants.createAnalyticsEnhanced_AnomalyLedger.bind(AnalyticsEnhancedVariants)      // AnomalyLedger (NEW)
    ];
    return variants[nodeId % 11](group, color);
  }

  /**
   * ANALYTICS: OBSERVER_LENS (NEW - Session 63)
   * Non-physical lens that bends perception
   * - Layered optical plates (non-parallel)
   * - Central aperture void (empty space)
   * - Plates slightly offset and tilted
   * - No solid core
   * - Animation: Very slow rotation + subtle axial wobble
   * 
   * VISUAL MEANING: "This node does not act — it sees."
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createAnalyticsObserverLens(group, color) {
    try {
      const lensCount = 5;
      const lensMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.6,
        roughness: 0.3,
        emissive: color,
        emissiveIntensity: 0.15,
        transparent: true,
        opacity: 0.45
      });

      // Create layered optical plates (non-parallel, slightly offset and tilted)
      for (let i = 0; i < lensCount; i++) {
        // Create annular ring/plate geometry (disc with hole)
        const outerRadius = 0.65 - i * 0.08;
        const innerRadius = 0.2;
        
        const plateGeometry = new THREE.CylinderGeometry(
          outerRadius,
          outerRadius,
          0.06,
          32,
          4,
          true
        );

        const plate = new THREE.Mesh(plateGeometry, lensMaterial);
        
        // Position vertically with slight stagger
        const yPos = (i - lensCount / 2) * 0.12;
        plate.position.y = yPos;
        
        // Progressive tilt for optical lens effect
        const tiltAngle = (i / lensCount) * Math.PI * 0.15;
        plate.rotation.x = tiltAngle;
        plate.rotation.z = Math.sin(i * 0.7) * 0.1;
        
        plate.userData.isLensPlate = true;
        plate.userData.plateIndex = i;
        plate.userData.visualCoreImmutable = true;
        group.add(plate);
      }

      // Create central void aperture (visual focus)
      const apertureGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.4, 16);
      const apertureMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.3,
        wireframe: false
      });
      const aperture = new THREE.Mesh(apertureGeometry, apertureMaterial);
      aperture.userData.isAperture = true;
      aperture.userData.visualCoreImmutable = true;
      group.add(aperture);

      // Store animation metadata (very slow rotation + subtle wobble)
      group.userData.lensRotationSpeed = 0.05; // Very slow
      group.userData.lensWobbleAmplitude = 0.04; // Subtle axial tilt
      group.userData.lensWobbleSpeed = 0.3;

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'ANALYTICS_OBSERVER_LENS';

      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] ObserverLens creation failed, fallback:', err);
      return this.createAnalyticsNode0(group, color);
    }
  }

  /**
   * ANALYTICS: FRACTAL_ECHO (NEW - Session 63)
   * Recursive analysis feeding back into itself
   * - Central asymmetric seed geometry (ikosahedron)
   * - 4 scaled-down echoes arranged radially
   * - Each echo rotated differently
   * - All geometry static (no recursion at runtime)
   * - Animation: Slow counter-rotation between seed and echoes
   * 
   * VISUAL MEANING: "Patterns inside patterns."
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createAnalyticsFractalEcho(group, color) {
    try {
      // Create central seed geometry (asymmetric icosahedron)
      const seedGeometry = new THREE.IcosahedronGeometry(0.35, 3);
      seedGeometry.scale(1.1, 0.85, 1.0); // Asymmetric elongation
      
      const seedMaterial = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.75,
        roughness: 0.15,
        transmission: 0.3,
        thickness: 0.4,
        ior: 1.48,
        emissive: color,
        emissiveIntensity: 0.25
      });

      const seed = new THREE.Mesh(seedGeometry, seedMaterial);
      seed.rotation.set(Math.PI / 8, Math.PI / 6, Math.PI / 12);
      seed.userData.isSeedCore = true;
      seed.userData.visualCoreImmutable = true;
      group.add(seed);

      // Create 4 scaled-down echoes (fractal copies)
      const echoCount = 4;
      const echoMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.65,
        roughness: 0.25,
        emissive: color,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.65
      });

      for (let i = 0; i < echoCount; i++) {
        // Create echo geometry (scaled tetrahedron, different from seed)
        const echoGeometry = new THREE.TetrahedronGeometry(0.18, 2);
        echoGeometry.scale(0.9 + i * 0.05, 1.1 - i * 0.08, 0.95);
        
        const echo = new THREE.Mesh(echoGeometry, echoMaterial);
        
        // Position radially around center
        const angle = (i / echoCount) * Math.PI * 2;
        const radius = 0.55;
        const height = Math.sin(i * 0.8) * 0.15;
        
        echo.position.set(
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius
        );
        
        // Each echo rotated differently
        echo.rotation.set(
          (i * Math.PI / 3) + Math.PI / 4,
          (i * Math.PI / 2.5) + Math.PI / 6,
          (i * Math.PI / 4)
        );
        
        echo.userData.isEcho = true;
        echo.userData.echoIndex = i;
        echo.userData.baseAngle = angle;
        echo.userData.baseRadius = radius;
        echo.userData.baseHeight = height;
        echo.userData.visualCoreImmutable = true;
        group.add(echo);
      }

      // Store animation metadata (counter-rotation)
      group.userData.fractalSeedRotationSpeed = 0.12;
      group.userData.fractalEchoRotationSpeed = -0.09; // Counter-rotation
      group.userData.fractalBreathingAmplitude = 0.015; // ±1.5% subtle breathing

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'ANALYTICS_FRACTAL_ECHO';

      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] FractalEcho creation failed, fallback:', err);
      return this.createAnalyticsNode1(group, color);
    }
  }

  /**
   * ANALYTICS: PARALLAX_ORACLE (NEW - Session 63)
   * Multi-dimensional observer interpreting from multiple angles
   * - Central floating polyhedral observer (stable core)
   * - 4 translucent observation planes intersecting space
   * - Planes must NOT intersect the core mesh
   * - Planes act like perception layers
   * - Animation: Planes rotate independently, core remains stable
   * 
   * VISUAL MEANING: "Truth depends on perspective."
   * VISUAL SAFETY: Static geometry, transform-only animation (orbit), immutable
   */
  static createAnalyticsParallaxOracle(group, color) {
    try {
      // Create central observer core (stable dodecahedron)
      const observerGeometry = new THREE.DodecahedronGeometry(0.28, 0);
      const observerMaterial = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.85,
        roughness: 0.1,
        transmission: 0.4,
        thickness: 0.35,
        ior: 1.5,
        emissive: color,
        emissiveIntensity: 0.3
      });

      const observer = new THREE.Mesh(observerGeometry, observerMaterial);
      observer.userData.isObserverCore = true;
      observer.userData.visualCoreImmutable = true;
      group.add(observer);

      // Create 4 translucent observation planes (perception layers)
      const planeCount = 4;
      const planeMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        wireframe: false
      });

      for (let i = 0; i < planeCount; i++) {
        // Create plane geometry (different dimensions for parallax effect)
        const planeWidth = 0.7 - i * 0.08;
        const planeHeight = 0.5 + i * 0.1;
        const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
        
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        
        // Position planes in different orientations (NO intersection with core)
        const angle = (i / planeCount) * Math.PI * 2;
        
        // Position away from center to avoid intersection
        plane.position.x = Math.cos(angle) * 0.45;
        plane.position.z = Math.sin(angle) * 0.45;
        
        // Tilt each plane differently for multi-dimensional perception
        plane.rotation.y = angle;
        plane.rotation.x = Math.PI / 6 + i * 0.15;
        plane.rotation.z = Math.PI / 8 - i * 0.1;
        
        plane.userData.isObservationPlane = true;
        plane.userData.planeIndex = i;
        plane.userData.baseAngle = angle;
        plane.userData.planeRotationAxis = new THREE.Vector3(
          Math.cos(angle * 0.7),
          0.5,
          Math.sin(angle * 0.7)
        ).normalize();
        plane.userData.planeRotationSpeed = 0.08 + i * 0.02;
        plane.userData.visualCoreImmutable = true;
        group.add(plane);
      }

      // Store animation metadata (independent plane rotation)
      group.userData.observerPlaneCount = planeCount;
      group.userData.observerCoreStability = true; // Core does NOT rotate

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'ANALYTICS_PARALLAX_ORACLE';

      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] ParallaxOracle creation failed, fallback:', err);
      return this.createAnalyticsNode2(group, color);
    }
  }

  // ===== STORAGE NODES (Silver/Pale Blue - 4 variants) =====

  /**
   * Storage Node 0: Tall rectangular pillar with layered slices (fixed + upgraded)
   * UPGRADED: Enforced segment spacing, per-segment micro-rotation, optional vertical core light
   * VISUAL HIERARCHY: Core light opacity reduced to 0.08 (was 0.15, subtle background)
   */
  static createStorageNode0(group, color) {
    // Main pillar (optional background reference, mostly transparent)
    const pillarGeometry = new THREE.BoxGeometry(0.5, 1.2, 0.5);
    const pillarMaterial = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.8,
      roughness: 0.2,
      emissive: color,
      emissiveIntensity: 0.1,
      transparent: true,
      opacity: 0.15
    });
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.renderOrder = 0;  // Core layer
    group.add(pillar);

    // Memory slices - FIXED: Enforced spacing, no merging
    const sliceCount = 6;
    const sliceHeight = 0.15;
    const sliceSpacing = 0.32; // Ensure clear gaps between slices
    
    for (let i = 0; i < sliceCount; i++) {
      const sliceGeometry = new THREE.BoxGeometry(0.50, sliceHeight, 0.50);
      const sliceMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.8,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.25
      });
      const slice = new THREE.Mesh(sliceGeometry, sliceMaterial);
      
      // POLISH: Consistent vertical spacing, per-segment micro-rotation for visual interest
      slice.position.y = (i - sliceCount / 2) * sliceSpacing;
      slice.rotation.z = (Math.sin(i * 0.5) * 0.08); // Subtle micro-rotation per segment
      slice.renderOrder = 0;  // Core layer
      slice.userData = { segmentIndex: i };
      
      group.add(slice);
    }

    // POLISH: Optional faint vertical core light (visualization of memory flow)
    // VISUAL HIERARCHY: Reduced opacity from 0.15 to 0.08 (very subtle inner glow)
    const coreLightGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.1, 8);
    const coreLightMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.08,  // Reduced from 0.15
      emissive: color,
      emissiveIntensity: 0.3
    });
    const coreLight = new THREE.Mesh(coreLightGeo, coreLightMat);
    coreLight.renderOrder = 1;  // Inner layer
    coreLight.userData = { isCoreLightVFX: true };
    group.add(coreLight);

    group.userData.segmentCount = sliceCount;
    group.userData.segmentMicroRotationEnabled = true;

    return group;
  }

  /**
   * Storage Node 1: Capsule with inner bands
   */
  static createStorageNode1(group, color) {
    // Capsule base
    const capsuleGeometry = new THREE.CapsuleGeometry(0.35, 1, 8, 16);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.8,
      roughness: 0.2,
      emissive: color,
      emissiveIntensity: 0.2
    });
    const capsule = new THREE.Mesh(capsuleGeometry, material);
    group.add(capsule);

    // Inner bands
    for (let i = 0; i < 4; i++) {
      const bandGeometry = new THREE.TorusGeometry(0.38, 0.08, 8, 32);
      const band = new THREE.Mesh(bandGeometry, material);
      band.position.y = (i - 1.5) * 0.35;
      group.add(band);
    }

    return group;
  }

  /**
   * Storage Node 2: Thick cube with horizontal segmentation
   */
  static createStorageNode2(group, color) {
    const segmentCount = 5;
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.8,
      roughness: 0.2,
      emissive: color,
      emissiveIntensity: 0.2
    });

    for (let i = 0; i < segmentCount; i++) {
      const segGeometry = new THREE.BoxGeometry(0.9, 0.3, 0.9);
      const seg = new THREE.Mesh(segGeometry, material);
      seg.position.y = (i - segmentCount / 2) * 0.4;
      group.add(seg);
    }

    return group;
  }

  /**
   * Storage Node 3: Cluster of crystal shards
   */
  static createStorageNode3(group, color) {
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.8,
      roughness: 0.25,
      emissive: color,
      emissiveIntensity: 0.2
    });

    // 4 crystal shards
    const positions = [
      [-0.4, -0.2, -0.4],
      [0.4, -0.2, -0.4],
      [-0.4, 0.2, 0.4],
      [0.4, 0.2, 0.4]
    ];

    positions.forEach(pos => {
      const shardGeometry = new THREE.TetrahedronGeometry(0.35);
      const shard = new THREE.Mesh(shardGeometry, material);
      shard.position.set(...pos);
      shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      group.add(shard);
    });

    return group;
  }

  /**
   * Main storage node creator
   * CANONICAL CATEGORY: STORAGE
   * - MemoryPillar
   * - CapsuleBands
   * - SegmentedStack
   * - CrystalShardCluster
   * - RhombicSolid
   * - MnemonicVault (Session 63)
   * - ArchiveSpindle (Session 63)
   * - MemoryReef (Session 63)
   * - ArchiveNexus (NEW - Session 81)
   * - MemoryCrypts (NEW - Session 81)
   * - DepthLayers (NEW - Session 81)
   * - ObeliskCache (NEW - Session 116)
   * - FractalReservoir (NEW - Session 116)
   * - ArchiveDrum (NEW - Session 116)
   */
  static createStorageNode(group, index, color) {
    // Deterministic selection per node ID
    let nodeId = group.userData.id || index;
    if (typeof nodeId === 'string') {
      nodeId = nodeId.charCodeAt(0) + nodeId.length;
    }
    
    const variants = [
      this.createStorageNode0.bind(this),                       // MemoryPillar
      this.createStorageNode1.bind(this),                       // CapsuleBands
      this.createStorageNode2.bind(this),                       // SegmentedStack
      this.createStorageNode3.bind(this),                       // CrystalShardCluster
      this.createNewRhombicSolid.bind(this),                    // RhombicSolid
      this.createStorageMnemonicVault.bind(this),               // MnemonicVault
      this.createStorageArchiveSpindle.bind(this),              // ArchiveSpindle
      this.createStorageMemoryReef.bind(this),                  // MemoryReef
      StorageEnhancedVariants.createStorageEnhanced_ArchiveNexus.bind(StorageEnhancedVariants),  // ArchiveNexus (NEW)
      StorageEnhancedVariants.createStorageEnhanced_MemoryCrypts.bind(StorageEnhancedVariants),  // MemoryCrypts (NEW)
      StorageEnhancedVariants.createStorageEnhanced_DepthLayers.bind(StorageEnhancedVariants),   // DepthLayers (NEW)
      StorageNodesVisual.createObeliskCache.bind(StorageNodesVisual),                            // ObeliskCache (NEW - Session 116)
      StorageNodesVisual.createFractalReservoir.bind(StorageNodesVisual),                        // FractalReservoir (NEW - Session 116)
      StorageNodesVisual.createArchiveDrum.bind(StorageNodesVisual)                              // ArchiveDrum (NEW - Session 116)
    ];
    
    return variants[nodeId % 14](group, color);
  }

  /**
   * STORAGE: MNEMONIC_VAULT (NEW - Session 63)
   * Protected memory core suspended inside faceted containment shell
   * - Inner core: irregular crystal (not symmetric)
   * - Outer shell: faceted containment frame (NOT a sphere)
   * - Visible gap between core and shell
   * - Core animation: very slow rotation
   * - Shell animation: subtle counter-rotation
   * 
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createStorageMnemonicVault(group, color) {
    try {
      // Create inner irregular crystal core (asymmetrical octahedron)
      const innerCoreVertices = new Float32Array([
        // Asymmetrical base
        0.25, -0.35, 0.0,     // 0
        0.15, -0.35, 0.20,    // 1
        -0.12, -0.35, 0.18,   // 2
        -0.22, -0.35, -0.08,  // 3
        0.08, -0.35, -0.18,   // 4
        
        // Asymmetrical middle
        0.22, 0.0, -0.05,     // 5
        0.12, 0.0, 0.22,      // 6
        -0.18, 0.0, 0.15,     // 7
        -0.25, 0.0, -0.12,    // 8
        
        // Asymmetrical top point (offset from center)
        -0.08, 0.35, 0.05     // 9
      ]);

      const innerCoreIndices = new Uint16Array([
        // Base structure (pyramid-like)
        0, 1, 6,
        1, 2, 7,
        2, 3, 8,
        3, 4, 5,
        4, 0, 5,
        
        // Mid-structure
        0, 5, 6,
        1, 6, 7,
        2, 7, 8,
        3, 8, 5,
        4, 5, 9,
        
        // Top connections (asymmetrical)
        5, 6, 9,
        6, 7, 9,
        7, 8, 9,
        8, 5, 9,
        0, 1, 2,
        2, 3, 4
      ]);

      const innerCoreGeometry = new THREE.BufferGeometry();
      innerCoreGeometry.setAttribute('position', new THREE.BufferAttribute(innerCoreVertices, 3));
      innerCoreGeometry.setIndex(new THREE.BufferAttribute(innerCoreIndices, 1));
      innerCoreGeometry.computeVertexNormals();

      // Inner core material - emerald/jade crystalline
      const innerCoreMaterial = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.6,
        roughness: 0.15,
        transmission: 0.4,
        thickness: 0.5,
        ior: 1.48,
        reflectivity: 0.7,
        emissive: color,
        emissiveIntensity: 0.2
      });

      const innerCore = new THREE.Mesh(innerCoreGeometry, innerCoreMaterial);
      innerCore.scale.set(0.38, 0.38, 0.38);
      innerCore.userData.isInnerCore = true;
      innerCore.userData.visualCoreImmutable = true;
      group.add(innerCore);

      // Create outer faceted containment frame (12-faced dodecahedron-like shell)
      const outerShellGeometry = new THREE.DodecahedronGeometry(0.7, 0);
      const outerShellMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.75,
        roughness: 0.25,
        emissive: color,
        emissiveIntensity: 0.15,
        transparent: true,
        opacity: 0.5
      });
      
      const outerShell = new THREE.Mesh(outerShellGeometry, outerShellMaterial);
      outerShell.userData.isOuterShell = true;
      outerShell.userData.visualCoreImmutable = true;
      group.add(outerShell);

      // Store animation metadata (transform-only)
      group.userData.mnemonicCoreRotationAxis = new THREE.Vector3(0.3, 1, -0.2).normalize();
      group.userData.mnemonicCoreRotationSpeed = 0.08; // Very slow
      group.userData.mnemonicShellRotationAxis = new THREE.Vector3(-0.4, -0.8, 0.3).normalize();
      group.userData.mnemonicShellRotationSpeed = -0.06; // Counter-rotation

      // Mark as immutable
      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'STORAGE_MNEMONIC_VAULT';

      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] MnemonicVault creation failed, fallback:', err);
      return this.createStorageNode0(group, color);
    }
  }

  /**
   * STORAGE: ARCHIVE_SPINDLE (NEW - Session 63)
   * Layered data strata compressed into vertical spindle structure
   * - Tall, segmented structure with static layers
   * - Layers slightly offset (but static at creation)
   * - Central axis clearly visible
   * - Animation: slow axial rotation + gentle vertical oscillation
   * 
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createStorageArchiveSpindle(group, color) {
    try {
      const segmentCount = 8;
      const segmentHeight = 0.18;
      const segmentRadius = 0.55;
      
      // Create central axis (visual focus)
      const axisGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.4, 12);
      const axisMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.85,
        roughness: 0.1,
        emissive: color,
        emissiveIntensity: 0.3
      });
      const axis = new THREE.Mesh(axisGeometry, axisMaterial);
      axis.userData.isCentralAxis = true;
      axis.userData.visualCoreImmutable = true;
      group.add(axis);

      // Create layered segments (strata)
      const strataMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.75,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.2
      });

      for (let i = 0; i < segmentCount; i++) {
        // Create disc segment
        const discGeometry = new THREE.CylinderGeometry(
          segmentRadius,
          segmentRadius,
          segmentHeight,
          12
        );
        const disc = new THREE.Mesh(discGeometry, strataMaterial);
        
        // Position with slight offset for visual depth
        const yPos = (i - segmentCount / 2) * (segmentHeight + 0.08);
        const offsetFactor = Math.sin(i * 0.6) * 0.04;
        
        disc.position.y = yPos;
        disc.rotation.z = offsetFactor * 0.3;
        disc.userData.strataIndex = i;
        disc.userData.visualCoreImmutable = true;
        
        group.add(disc);
      }

      // Add subtle decorative ring bands between segments
      for (let i = 0; i < segmentCount - 1; i++) {
        const bandGeometry = new THREE.TorusGeometry(segmentRadius + 0.08, 0.04, 8, 32);
        const bandMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.3
        });
        const band = new THREE.Mesh(bandGeometry, bandMaterial);
        
        const yPos = (i + 1 - segmentCount / 2) * (segmentHeight + 0.08) - (segmentHeight + 0.04);
        band.position.y = yPos;
        band.userData.visualCoreImmutable = true;
        
        group.add(band);
      }

      // Store animation metadata (transform-only, no vertex/material mutation)
      group.userData.spindleRotationSpeed = 0.12; // Slow axial rotation
      group.userData.spindleOscillationAmplitude = 0.06; // Small vertical oscillation
      group.userData.spindleOscillationSpeed = 0.4;

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'STORAGE_ARCHIVE_SPINDLE';

      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] ArchiveSpindle creation failed, fallback:', err);
      return this.createStorageNode0(group, color);
    }
  }

  /**
   * STORAGE: MEMORY_REEF (NEW - Session 63)
   * Clustered memory fragments orbiting calm central anchor
   * - Central anchor mesh (non-spherical octahedron)
   * - 8 small crystalline shards arranged around it (individual meshes)
   * - Shards are separate meshes (not instanced merge)
   * - Animation: shards orbit slowly, no scale pulsing
   * 
   * VISUAL SAFETY: Static geometry, transform-only animation (orbit), immutable
   */
  static createStorageMemoryReef(group, color) {
    try {
      // Create central anchor (non-spherical - diamond-like octahedron)
      const anchorGeometry = new THREE.OctahedronGeometry(0.3, 2);
      anchorGeometry.scale(1.0, 1.4, 0.85); // Asymmetrical elongation
      
      const anchorMaterial = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.8,
        roughness: 0.15,
        transmission: 0.3,
        thickness: 0.4,
        ior: 1.5,
        emissive: color,
        emissiveIntensity: 0.25
      });
      
      const anchor = new THREE.Mesh(anchorGeometry, anchorMaterial);
      anchor.rotation.set(Math.PI / 6, Math.PI / 4, 0);
      anchor.userData.isAnchorCore = true;
      anchor.userData.visualCoreImmutable = true;
      group.add(anchor);

      // Create 8 individual crystalline shards in orbit around anchor
      const shardCount = 8;
      const orbitRadius = 0.65;
      
      const shardMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.7,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.2
      });

      for (let i = 0; i < shardCount; i++) {
        // Create irregular tetrahedron shard
        const shardGeometry = new THREE.TetrahedronGeometry(0.22, 1);
        const shard = new THREE.Mesh(shardGeometry, shardMaterial);
        
        // Position in orbit
        const angle = (i / shardCount) * Math.PI * 2;
        const height = Math.sin(i * 0.7) * 0.2;
        
        shard.position.set(
          Math.cos(angle) * orbitRadius,
          height,
          Math.sin(angle) * orbitRadius
        );
        
        // Random rotation for organic feel (static at creation)
        shard.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        
        shard.userData.shardIndex = i;
        shard.userData.orbitRadius = orbitRadius;
        shard.userData.orbitHeight = height;
        shard.userData.orbitAngle = angle;
        shard.userData.visualCoreImmutable = true;
        
        group.add(shard);
      }

      // Store animation metadata (orbit-based, no vertex mutation)
      group.userData.reefShardOrbitSpeed = 0.15; // Slow orbital animation
      group.userData.reefShardCount = shardCount;

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'STORAGE_MEMORY_REEF';

      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] MemoryReef creation failed, fallback:', err);
      return this.createStorageNode3(group, color);
    }
  }

  // ===== CONTROL NODES (Red/Magenta - 4 variants) =====

  /**
   * Control Node 0: Strong octagonal core with magenta rim + central static polyhedron + subtle mesh pulsing
   * UPGRADED: Added solid central core + very subtle mesh line pulsing for authority/stability
   * VISUAL HIERARCHY: Central core remains visible but not dominant (no opacity change—opaque by design)
   */
  static createControlNode0(group, color) {
    // Octagonal core
    const octGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.8, 8);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.8,
      roughness: 0.2,
      emissive: color,
      emissiveIntensity: 0.35
    });
    const oct = new THREE.Mesh(octGeometry, material);
    oct.renderOrder = 0;  // Core layer
    group.add(oct);

    // Magenta rim glow
    const rimGeometry = new THREE.TorusGeometry(1.0, 0.1, 8, 32);
    const rimMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.5
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.renderOrder = 0;  // Core layer
    group.add(rim);

    // POLISH: Central static polyhedron (solid authority core)
    // Note: This core is intentionally opaque—it's a design feature (authority symbol)
    const coreGeometry = new THREE.DodecahedronGeometry(0.25, 0);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.95,
      roughness: 0.05,
      emissive: color,
      emissiveIntensity: 0.7
    });
    const centralCore = new THREE.Mesh(coreGeometry, coreMaterial);
    centralCore.renderOrder = 1;  // Inner layer (visible, intentional)
    group.add(centralCore);

    // POLISH: Subtle pulsing mesh lines for authority (stored as animation metadata)
    group.userData.meshPulsePhase = 0;
    group.userData.meshPulseAmplitude = 0.08; // Very subtle (8% amplitude)
    group.userData.meshPulseSpeed = 0.5;

    return group;
  }

  /**
   * Control Node 1: Sharp tetrahedral pyramid
   */
  static createControlNode1(group, color) {
    const pyramidGeometry = new THREE.TetrahedronGeometry(0.8);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.7,
      roughness: 0.25,
      emissive: color,
      emissiveIntensity: 0.35
    });
    const pyramid = new THREE.Mesh(pyramidGeometry, material);
    pyramid.scale.z = 1.4; // Make it pointy
    group.add(pyramid);

    // Sharp edges
    const edgeGeometry = new THREE.EdgesGeometry(pyramidGeometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.scale.z = 1.4;
    group.add(edges);

    return group;
  }

  /**
   * Control Node 2: Ring-within-ring hierarchy structure
   */
  static createControlNode2(group, color) {
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.8,
      roughness: 0.2,
      emissive: color,
      emissiveIntensity: 0.3
    });

    // Three concentric rings
    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.TorusGeometry(0.5 + i * 0.35, 0.12, 16, 100);
      const ring = new THREE.Mesh(ringGeometry, material);
      ring.rotation.x = (i % 2) * Math.PI / 2;
      ring.rotation.z = (i === 1) * Math.PI / 3;
      group.add(ring);
    }

    return group;
  }

  /**
   * Control Node 3: X-shaped form with beveled edges
   */
  static createControlNode3(group, color) {
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.7,
      roughness: 0.3,
      emissive: color,
      emissiveIntensity: 0.35
    });

    // Four beveled boxes forming X
    const positions = [
      [0.6, 0.6, 0],
      [-0.6, 0.6, 0],
      [0.6, -0.6, 0],
      [-0.6, -0.6, 0]
    ];

    positions.forEach((pos, i) => {
      const boxGeometry = new THREE.BoxGeometry(0.3, 0.3, 1);
      const box = new THREE.Mesh(boxGeometry, material);
      box.position.set(...pos);
      box.rotation.z = (i < 2 ? Math.PI / 4 : -Math.PI / 4);
      group.add(box);
    });

    return group;
  }

  /**
   * JudgmentSeal: Heavy ring + floating core (static geometry)
   */
  static createJudgmentSealNode(group, color) {
    const seal = ControlNodeGeometries.createJudgmentSeal(0.9);
    seal.traverse(child => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.85,
          roughness: 0.15,
          emissive: color,
          emissiveIntensity: 0.4
        });
      }
    });
    group.add(seal);
    return group;
  }

  /**
   * SignalCitadel: Fortified core with 4-6 towers (static geometry)
   */
  static createSignalCitadelNode(group, color) {
    const citadel = ControlNodeGeometries.createSignalCitadel(0.9);
    citadel.material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.7,
      roughness: 0.25,
      emissive: color,
      emissiveIntensity: 0.35
    });
    group.add(citadel);
    return group;
  }

  /**
   * LawCore: Monolithic cube (static geometry)
   */
  static createLawCoreNode(group, color) {
    const lawCore = ControlNodeGeometries.createLawCore(0.9);
    lawCore.material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.9,
      roughness: 0.1,
      emissive: color,
      emissiveIntensity: 0.5
    });
    group.add(lawCore);
    return group;
  }

  /**
   * AxiomCrystal: Vertical crystal monolith with sharp facets (CANONICAL)
   * - Vertical elongation (height ~1.8x width)
   * - 14 sharp facets, asymmetrical cuts (top/bottom NOT mirrored)
   * - ~5° axial twist around Y-axis
   * - Transmission material (IOR 1.45, transmission 0.9, roughness 0.1)
   * - Internal color gradient: gold → amber → dark honey
   * - IMMUTABLE: No material mutation, no state-based changes
   */
  static createAxiomCrystalNode(group, color) {
    // Create vertical crystal using custom faceted geometry
    const vertices = new Float32Array([
      // Base (asymmetrical - wider, irregular cuts)
      0.0, -0.9, 0.0,      // 0: center bottom
      0.35, -0.9, 0.0,     // 1
      0.25, -0.9, 0.3,     // 2
      -0.15, -0.9, 0.35,   // 3
      -0.4, -0.9, 0.15,    // 4
      -0.3, -0.9, -0.25,   // 5
      0.15, -0.9, -0.35,   // 6
      
      // Lower section (transition)
      0.32, -0.5, 0.0,     // 7
      0.22, -0.5, 0.28,    // 8
      -0.12, -0.5, 0.32,   // 9
      -0.35, -0.5, 0.12,   // 10
      -0.28, -0.5, -0.22,  // 11
      0.12, -0.5, -0.32,   // 12
      
      // Upper section (tighter - asymmetrical)
      0.2, 0.4, -0.05,     // 13
      0.18, 0.4, 0.15,     // 14
      -0.08, 0.4, 0.22,    // 15
      -0.25, 0.4, 0.05,    // 16
      -0.18, 0.4, -0.15,   // 17
      
      // Top (sharp point - offset from center)
      -0.05, 0.9, 0.08     // 18: apex (asymmetrical)
    ]);

    // Define faces (14 facets for fully faceted crystal)
    const indices = new Uint16Array([
      // Base to lower section (6 radial faces - irregular)
      0, 1, 7,
      0, 7, 12,
      0, 12, 6,
      0, 6, 5,
      0, 5, 4,
      0, 4, 3,
      0, 3, 2,
      0, 2, 1,
      
      // Lower to upper section (5 radial faces)
      7, 8, 14,
      8, 9, 15,
      9, 10, 16,
      10, 11, 17,
      11, 12, 13,
      
      // Upper to apex (5 top faces - asymmetrical point)
      13, 14, 18,
      14, 15, 18,
      15, 16, 18,
      16, 17, 18,
      17, 13, 18,
      
      // Side connections (bridge lower to upper)
      7, 14, 13,
      8, 15, 14,
      9, 16, 15,
      10, 17, 16,
      11, 13, 17,
      12, 7, 13
    ]);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();

    // Create transmission material with internal gradient
    // Gold → Amber → Dark Honey internal color
    const transmissionMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xffd700).lerp(new THREE.Color(0xffb347), 0.5), // Gold-Amber base
      transmission: 0.9,
      thickness: 0.8,
      roughness: 0.1,
      metalness: 0.0,
      ior: 1.45,
      reflectivity: 0.9,
      envMapIntensity: 1.0,
      side: THREE.FrontSide,
      // Internal color gradient simulation
      emissive: new THREE.Color(0x8b6914), // Dark honey subtle glow
      emissiveIntensity: 0.05
    });
    
    // Lock material from mutation
    transmissionMaterial.userData.immutable = true;
    Object.defineProperty(transmissionMaterial, 'userData', {
      writable: false,
      configurable: false
    });

    const crystal = new THREE.Mesh(geometry, transmissionMaterial);
    
    // Apply ~5° axial twist around Y-axis
    crystal.rotation.y = (5 * Math.PI) / 180; // 5 degrees

    // Mark as immutable static geometry
    crystal.userData.isStaticAxiomCrystal = true;
    crystal.userData.immutable = true;
    crystal.userData.noMaterialMutation = true;
    
    // CRITICAL: DO NOT freeze geometry or material
    // Three.js needs extensibility to attach event listeners (_listeners)
    // Immutability is enforced at API level via userData flags

    group.add(crystal);
    group.userData.nodeGeometryName = 'CONTROL_AXIOM_CRYSTAL';
    group.userData.isCanonicalControlNode = true;
    
    return group;
  }

  /**
   * Main control node creator
   * CANONICAL CATEGORY: CONTROL
   * - AxiomCrystal (CANONICAL - SINGLE GEOMETRY)
   * - OctagonalCore+Rim (deprecated variant)
   * - ControlRingLattice (deprecated variant)
   * - SpikedControlFrame (deprecated variant)
   * - CommandPyramid (NEW - Session 63)
   * - HierarchyTower (NEW - Session 63)
   * - SymmetryCore (NEW - Session 63)
   * - DecisionFork (NEW - Session 83)
   * - AuthorityHelix (NEW - Session 83)
   * - CommandMatrix (NEW - Session 83)
   * - ΦRIX Flow Arbiter (NEW - Session 114)
   * - CRUCIS Suppression Governor (NEW - Session 114)
   * - VERTEX Temporal Gate (NEW - Session 114)
   * 
   * SPINE VARIANTS (Session 100 - Additive, not auto-selected):
   * - SegmentedSpine (NEW - optional)
   * - TwistedSpine (NEW - optional)
   * - HollowSpine (NEW - optional)
   */
  static createControlNode(group, index, color) {
    // Deterministic selection per node ID
    let nodeId = group.userData.id || index;
    if (typeof nodeId === 'string') {
      nodeId = nodeId.charCodeAt(0) + nodeId.length;
    }
    
    const variants = [
      this.createAxiomCrystalNode.bind(this),      // AxiomCrystal (CANONICAL)
      this.createControlNode0.bind(this),          // OctagonalCore+Rim (legacy)
      this.createControlNode2.bind(this),          // ControlRingLattice (legacy)
      this.createControlNode1.bind(this),          // SpikedControlFrame (legacy)
      this.createControlCommandPyramid.bind(this), // CommandPyramid (NEW)
      this.createControlHierarchyTower.bind(this), // HierarchyTower (NEW)
      this.createControlSymmetryCore.bind(this),   // SymmetryCore (NEW)
      this.createExtremeControl0.bind(this),       // InfiniteSpiral (EXTREME)
      ControlEnhancedVariants.createControlEnhanced_DecisionFork.bind(ControlEnhancedVariants),    // DecisionFork (NEW)
      ControlEnhancedVariants.createControlEnhanced_AuthorityHelix.bind(ControlEnhancedVariants),  // AuthorityHelix (NEW)
      ControlEnhancedVariants.createControlEnhanced_CommandMatrix.bind(ControlEnhancedVariants),   // CommandMatrix (NEW)
      ControlNodeSpecialGovernors.createPhrixFlowArbiter.bind(ControlNodeSpecialGovernors),        // ΦRIX (NEW - Session 114)
      ControlNodeSpecialGovernors.createCrucisSuppressionGovernor.bind(ControlNodeSpecialGovernors), // CRUCIS (NEW - Session 114)
      ControlNodeSpecialGovernors.createVertexTemporalGate.bind(ControlNodeSpecialGovernors)       // VERTEX (NEW - Session 114)
    ];
    return variants[nodeId % 14](group, color);
  }

  /**
   * Get spine variant by name (Session 100)
   * Provides access to new spine variants without affecting auto-selection
   * Use: EnhancedNodeModels.createControlSpineVariant('segmented', group, color)
   * @param {string} variantName - 'segmented', 'twisted', or 'hollow'
   * @param {THREE.Group} group - The node group to populate
   * @param {number} color - The node color
   * @returns {THREE.Group} The populated node group
   */
  static createControlSpineVariant(variantName = 'segmented', group, color) {
    try {
      switch (variantName.toLowerCase()) {
        case 'segmented':
          return ControlSpineVariants.createControlSpine_Segmented(group, color);
        case 'twisted':
          return ControlSpineVariants.createControlSpine_Twisted(group, color);
        case 'hollow':
          return ControlSpineVariants.createControlSpine_Hollow(group, color);
        default:
          console.warn(`[EnhancedNodeModels] Unknown spine variant: ${variantName}, using segmented`);
          return ControlSpineVariants.createControlSpine_Segmented(group, color);
      }
    } catch (err) {
      console.warn(`[EnhancedNodeModels] Spine variant creation failed for ${variantName}:`, err);
      return this.createControlNode(group, 0, color); // Fallback to default
    }
  }

  /**
   * Get special control governor by name (Session 114)
   * Autonomous regulatory nodes for network flow control
   * Use: EnhancedNodeModels.createControlSpecialGovernor('phrix', group, color)
   *      EnhancedNodeModels.createControlSpecialGovernor('crucis', group, color)
   *      EnhancedNodeModels.createControlSpecialGovernor('vertex', group, color)
   * 
   * @param {string} governorName - 'phrix' (Flow Arbiter), 'crucis' (Suppression), or 'vertex' (Temporal Gate)
   * @param {THREE.Group} group - The node group to populate
   * @param {number} color - The node color (typically magenta/red for CONTROL nodes)
   * @returns {THREE.Group} The populated node group
   */
  static createControlSpecialGovernor(governorName = 'phrix', group, color) {
    try {
      return ControlNodeSpecialGovernors.createSpecialGovernor(governorName, group, color);
    } catch (err) {
      console.warn(`[EnhancedNodeModels] Special governor creation failed for '${governorName}':`, err);
      return this.createControlNode(group, 0, color); // Fallback to standard control node
    }
  }

  /**
   * CONTROL: COMMAND_PYRAMID (NEW - Session 63)
   * Authority radiating from a central point of command
   * - Tall asymmetric pyramid (base authority structure)
   * - 4 radiating command beams (pointing outward from apex)
   * - Central glow core emphasizing command authority
   * - Animation: Slow rotation + gentle pulsing authority aura
   * 
   * VISUAL MEANING: "Authority flows from the apex."
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createControlCommandPyramid(group, color) {
    try {
      // Create tall asymmetric pyramid base (authority structure)
      const pyramidVertices = new Float32Array([
        // Base (wide rectangular)
        -0.45, -0.4, -0.35,   // 0
        0.45, -0.4, -0.35,    // 1
        0.45, -0.4, 0.45,     // 2
        -0.45, -0.4, 0.45,    // 3
        
        // Apex (tall, slightly offset - asymmetric authority)
        0.08, 0.65, -0.05     // 4
      ]);

      const pyramidIndices = new Uint16Array([
        // Base
        0, 2, 1,
        0, 3, 2,
        
        // Sides to apex
        0, 1, 4,
        1, 2, 4,
        2, 3, 4,
        3, 0, 4
      ]);

      const pyramidGeometry = new THREE.BufferGeometry();
      pyramidGeometry.setAttribute('position', new THREE.BufferAttribute(pyramidVertices, 3));
      pyramidGeometry.setIndex(new THREE.BufferAttribute(pyramidIndices, 1));
      pyramidGeometry.computeVertexNormals();

      const pyramidMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.85,
        roughness: 0.15,
        emissive: color,
        emissiveIntensity: 0.3
      });

      const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
      pyramid.userData.isCommandPyramid = true;
      pyramid.userData.visualCoreImmutable = true;
      group.add(pyramid);

      // Create 4 radiating command beams (pointing outward from apex)
      const beamCount = 4;
      const beamLength = 0.55;
      const beamMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.9,
        roughness: 0.1,
        emissive: color,
        emissiveIntensity: 0.4
      });

      const beamDirections = [
        [1, 0.3, 0],      // Forward-up
        [-1, 0.3, 0],     // Back-up
        [0, 0.3, 1],      // Right-up
        [0, 0.3, -1]      // Left-up
      ];

      for (let i = 0; i < beamCount; i++) {
        // Create beam as thin elongated box
        const beamGeometry = new THREE.BoxGeometry(0.08, 0.08, beamLength);
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        
        // Position beam originating from apex
        const [dx, dy, dz] = beamDirections[i];
        const normalized = new THREE.Vector3(dx, dy, dz).normalize();
        beam.position.set(
          normalized.x * (beamLength / 2 + 0.1),
          0.65 + normalized.y * (beamLength / 2),
          normalized.z * (beamLength / 2)
        );
        
        // Point beam outward
        beam.lookAt(
          normalized.x * (beamLength + 1),
          0.65 + normalized.y * (beamLength + 1),
          normalized.z * (beamLength + 1)
        );
        
        beam.userData.isCommandBeam = true;
        beam.userData.beamIndex = i;
        beam.userData.visualCoreImmutable = true;
        group.add(beam);
      }

      // Create central authority glow core
      const glowGeometry = new THREE.SphereGeometry(0.25, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.set(0.08, 0.65, -0.05); // At apex
      glow.userData.isAuthorityGlow = true;
      glow.userData.visualCoreImmutable = true;
      group.add(glow);

      // Store animation metadata
      group.userData.commandRotationSpeed = 0.18;
      group.userData.commandPulseAmplitude = 0.08; // 8% glow pulsing
      group.userData.commandPulseSpeed = 1.0;

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'CONTROL_COMMAND_PYRAMID';

      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] CommandPyramid creation failed, fallback:', err);
      return this.createAxiomCrystalNode(group, color);
    }
  }

  /**
   * CONTROL: HIERARCHY_TOWER (NEW - Session 63)
   * Hierarchical levels of command stacked vertically
   * - Tall tower with 5-6 segmented levels
   * - Each level progressively narrower (hierarchy visualization)
   * - Connecting axis showing chain of command
   * - Animation: Very slow rotation + subtle level oscillation
   * 
   * VISUAL MEANING: "Command cascades downward."
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createControlHierarchyTower(group, color) {
    try {
      const levelCount = 6;
      const towerMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.8,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.3
      });

      // Create hierarchy levels (progressively narrower)
      for (let i = 0; i < levelCount; i++) {
        // Create octagonal level (8-sided for authoritative structure)
        const levelRadius = 0.5 - (i * 0.06);
        const levelHeight = 0.25;
        const levelGeometry = new THREE.CylinderGeometry(
          levelRadius,
          levelRadius,
          levelHeight,
          8
        );
        
        const level = new THREE.Mesh(levelGeometry, towerMaterial);
        
        // Stack vertically
        const yPos = (levelCount / 2 - i) * (levelHeight + 0.08);
        level.position.y = yPos;
        
        // Slight rotation per level for hierarchical visual
        level.rotation.z = (i * Math.PI / 16);
        
        level.userData.isHierarchyLevel = true;
        level.userData.levelIndex = i;
        level.userData.baseY = yPos;
        level.userData.visualCoreImmutable = true;
        group.add(level);
      }

      // Create central command axis (chain of command)
      const axisGeometry = new THREE.CylinderGeometry(0.1, 0.1, levelCount * 0.33, 6);
      const axisMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.95,
        roughness: 0.05,
        emissive: color,
        emissiveIntensity: 0.5
      });
      const axis = new THREE.Mesh(axisGeometry, axisMaterial);
      axis.userData.isCommandAxis = true;
      axis.userData.visualCoreImmutable = true;
      group.add(axis);

      // Add subtle connector rings between levels
      for (let i = 0; i < levelCount - 1; i++) {
        const ringGeometry = new THREE.TorusGeometry(0.52 - (i * 0.06), 0.05, 8, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.25
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        
        const yPos = (levelCount / 2 - i - 0.5) * 0.33;
        ring.position.y = yPos;
        ring.userData.isLevelConnector = true;
        ring.userData.visualCoreImmutable = true;
        group.add(ring);
      }

      // Store animation metadata
      group.userData.towerRotationSpeed = 0.08; // Very slow
      group.userData.levelOscillationAmplitude = 0.04; // ±4% gentle bobbing
      group.userData.levelOscillationSpeed = 0.4;
      group.userData.levelCount = levelCount;

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'CONTROL_HIERARCHY_TOWER';

      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] HierarchyTower creation failed, fallback:', err);
      return this.createControlNode0(group, color);
    }
  }

  /**
   * CONTROL: SYMMETRY_CORE (NEW - Session 63)
   * Perfect symmetry as a control principle — four-fold rotational symmetry
   * - Central symmetric core (tetrahedral)
   * - 4 cardinal arm structures pointing N/S/E/W
   * - Balanced, orderly, authoritative
   * - Animation: Counter-rotating core + arms for balance
   * 
   * VISUAL MEANING: "Order through symmetry."
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createControlSymmetryCore(group, color) {
    try {
      // Create central symmetric core (dodecahedron - perfect symmetry)
      const coreGeometry = new THREE.DodecahedronGeometry(0.3, 0);
      const coreMaterial = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.9,
        roughness: 0.1,
        transmission: 0.2,
        thickness: 0.3,
        ior: 1.45,
        emissive: color,
        emissiveIntensity: 0.4
      });

      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      core.userData.isSymmetryCore = true;
      core.userData.visualCoreImmutable = true;
      group.add(core);

      // Create 4 cardinal arm structures (N/S/E/W symmetry)
      const armCount = 4;
      const armLength = 0.6;
      const armMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.8,
        roughness: 0.15,
        emissive: color,
        emissiveIntensity: 0.3
      });

      const armDirections = [
        [1, 0, 0],    // +X (East)
        [-1, 0, 0],   // -X (West)
        [0, 0, 1],    // +Z (North)
        [0, 0, -1]    // -Z (South)
      ];

      for (let i = 0; i < armCount; i++) {
        // Create arm structure (box-like for orderly structure)
        const armGeometry = new THREE.BoxGeometry(0.12, 0.15, armLength);
        const arm = new THREE.Mesh(armGeometry, armMaterial);
        
        const [dx, dz] = [armDirections[i][0], armDirections[i][2]];
        arm.position.set(
          dx * (armLength / 2 + 0.15),
          0,
          dz * (armLength / 2 + 0.15)
        );
        
        // Arm points outward along its axis
        if (dx !== 0) {
          arm.rotation.z = Math.PI / 2;
        } else {
          arm.rotation.x = Math.PI / 2;
        }
        
        arm.userData.isSymmetryArm = true;
        arm.userData.armIndex = i;
        arm.userData.armDirection = armDirections[i];
        arm.userData.visualCoreImmutable = true;
        group.add(arm);

        // Add small terminal nodes at arm ends (symmetry markers)
        const markerGeometry = new THREE.OctahedronGeometry(0.1, 1);
        const markerMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.6
        });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        
        marker.position.set(
          dx * (armLength + 0.25),
          0,
          dz * (armLength + 0.25)
        );
        
        marker.userData.isSymmetryMarker = true;
        marker.userData.markerIndex = i;
        marker.userData.visualCoreImmutable = true;
        group.add(marker);
      }

      // Store animation metadata (counter-rotating core + arms)
      group.userData.symCoreRotationSpeed = 0.2;
      group.userData.symArmRotationSpeed = -0.15; // Counter-rotation
      group.userData.symArmCount = armCount;

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'CONTROL_SYMMETRY_CORE';

      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] SymmetryCore creation failed, fallback:', err);
      return this.createControlNode2(group, color);
    }
  }

  // ===== QUANTUM NODES (Bright Green - Dimensional Anomaly) =====

  /**
   * Main quantum node creator
   * CANONICAL CATEGORY: QUANTUM (renamed from SIGMA)
   * - FracturedAnomaly
   * - DistortedPolyCluster
   * - ChaoticLayeredForm
   * - TwistedOctahedron+ResonanceField
   * - HyperbolicNeuralPrism
   * - ChaoticHeart
   */
  static createQuantumNode(group, index, color) {
    const variants = [
      this.createSigmaNode0.bind(this),           // FracturedAnomaly
      this.createSigmaNode1.bind(this),           // DistortedPolyCluster
      this.createSigmaNode2.bind(this),           // ChaoticLayeredForm
      this.createSigmaNode3.bind(this),           // TwistedOctahedron+ResonanceField
      this.createNewEllipsoid.bind(this),         // HyperbolicNeuralPrism
      this.createExtremeIntegration1.bind(this)   // ChaoticHeart (moved from INTEGRATION)
    ];
    return variants[index % 6](group, color);
  }

  // ===== LEGACY SIGMA ALIAS (for backward compatibility) =====
  static createSigmaNode(group, index, color) {
    return this.createQuantumNode(group, index, color);
  }

  /**
   * Sigma Node 0: Soft elliptical form
   */
  static createSigmaNode0(group, color) {
    const ellipsoidGeo = new THREE.IcosahedronGeometry(0.8, 4);
    ellipsoidGeo.scale(1.2, 0.8, 0.9); // Slightly elongated
    const ellipsoidMat = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.6,
      roughness: 0.3,
      emissive: color,
      emissiveIntensity: 0.3
    });
    const ellipsoid = new THREE.Mesh(ellipsoidGeo, ellipsoidMat);
    group.add(ellipsoid);

    // Dimensional glow effect
    const glowGeo = new THREE.SphereGeometry(1.1, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.15,
      wireframe: false
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);

    return group;
  }

  /**
   * Sigma Node 1: Rotating dimensional rings
   */
  static createSigmaNode1(group, color) {
    const coreGeo = new THREE.OctahedronGeometry(0.6, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.7,
      roughness: 0.2,
      emissive: color,
      emissiveIntensity: 0.35
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Dimensional rings
    for (let i = 0; i < 2; i++) {
      const ringGeo = new THREE.TorusGeometry(1.2 + i * 0.3, 0.06, 8, 100);
      const ringMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3 - i * 0.1
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 3 + i * 0.3;
      ring.rotation.z = Math.PI / 6 + i * 0.2;
      group.add(ring);
    }

    group.userData.rotationAxis = new THREE.Vector3(0.5, 1, 0.5).normalize();
    return group;
  }

  /**
   * Sigma Node 2: Multi-faceted anomaly
   */
  static createSigmaNode2(group, color) {
    const facetGeo = new THREE.DodecahedronGeometry(0.7, 0);
    const facetMat = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.8,
      roughness: 0.3,
      emissive: color,
      emissiveIntensity: 0.3,
      wireframe: false
    });
    const facet = new THREE.Mesh(facetGeo, facetMat);
    group.add(facet);

    // Edge highlight
    const edgeGeo = new THREE.EdgesGeometry(facetGeo);
    const edgeMat = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.5
    });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    group.add(edges);

    return group;
  }

  /**
   * Sigma Node 3: Twisted anomaly
   */
  static createSigmaNode3(group, color) {
    // Create twisted form using scaled octahedra
    const twistedGeo = new THREE.OctahedronGeometry(0.8, 3);
    const twistedMat = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.65,
      roughness: 0.35,
      emissive: color,
      emissiveIntensity: 0.3
    });
    const twisted = new THREE.Mesh(twistedGeo, twistedMat);
    twisted.rotation.z = Math.PI / 4;
    group.add(twisted);

    // Resonance field
    const fieldGeo = new THREE.SphereGeometry(1.0, 12, 12);
    const fieldMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.08,
      wireframe: true
    });
    const field = new THREE.Mesh(fieldGeo, fieldMat);
    group.add(field);

    return group;
  }

  // ===== MYTHIC NODES (Ancient Fractured Relics - 6 variants) =====

  /**
   * Main mythic node creator
   * CANONICAL CATEGORY: MYTHIC
   * - ShardCluster, BrokenMonolith, FloatingFragments
   * - CrackedPrism, AncientCoreWithMissing, CollapsedCrown
   */
  static createMythicNode(group, index, color) {
    const variants = [
      () => CanonicalGeometryFamilies.createMythicShardCluster(1.0),
      () => CanonicalGeometryFamilies.createMythicBrokenMonolith(1.0),
      () => CanonicalGeometryFamilies.createMythicFloatingFragments(1.0),
      () => CanonicalGeometryFamilies.createMythicCrackedPrism(1.0),
      () => CanonicalGeometryFamilies.createMythicAncientCoreWithMissing(1.0),
      () => CanonicalGeometryFamilies.createMythicCollapsedCrown(1.0)
    ];
    
    const mesh = variants[index % 6]();
    if (!mesh.userData) mesh.userData = {};
    mesh.userData.category = 'mythic';
    mesh.userData.visualReady = true;
    group.add(mesh);
    return group;
  }

  // ===== PRIME NODES (Perfect Axioms - 6 variants) =====

  /**
   * Main prime node creator
   * CANONICAL CATEGORY: PRIME
   * - NestedIcosahedron, PerfectDodecahedron, StellaOctangula
   * - PrecisionLattice, TesseractProjection, SymmetryLockedCore
   */
  static createPrimeNode(group, index, color) {
    const variants = [
      () => CanonicalGeometryFamilies.createPrimeNestedIcosahedron(1.0),
      () => CanonicalGeometryFamilies.createPrimePerfectDodecahedron(1.0),
      () => CanonicalGeometryFamilies.createPrimeStellaOctangula(1.0),
      () => CanonicalGeometryFamilies.createPrimePrecisionLattice(1.0),
      () => CanonicalGeometryFamilies.createPrimeTesseractProjection(1.0),
      () => CanonicalGeometryFamilies.createPrimeSymmetryLockedCore(1.0)
    ];
    
    const mesh = variants[index % 6]();
    if (!mesh.userData) mesh.userData = {};
    mesh.userData.category = 'prime';
    mesh.userData.visualReady = true;
    group.add(mesh);
    return group;
  }

  // ===== ERROR NODES (Frozen Corruption - 6 variants) =====

  /**
   * Main error node creator
   * CANONICAL CATEGORY: ERROR
   * - IntersectingSolids, InvertedNormals, SelfClipping
   * - FoldedImpossible, TopologyTear, CorruptedManifold
   */
  static createErrorNode(group, index, color) {
    const variants = [
      () => CanonicalGeometryFamilies.createErrorIntersectingSolids(1.0),
      () => CanonicalGeometryFamilies.createErrorInvertedNormals(1.0),
      () => CanonicalGeometryFamilies.createErrorSelfClipping(1.0),
      () => CanonicalGeometryFamilies.createErrorFoldedImpossible(1.0),
      () => CanonicalGeometryFamilies.createErrorTopologyTear(1.0),
      () => CanonicalGeometryFamilies.createErrorCorruptedManifold(1.0)
    ];
    
    const mesh = variants[index % 6]();
    if (!mesh.userData) mesh.userData = {};
    mesh.userData.category = 'error';
    mesh.userData.isError = true;
    mesh.userData.visualReady = true;
    group.add(mesh);
    return group;
  }

  // ===== EMOTIONAL NODES (Crystalline Organics - 6 variants) =====

  /**
   * Main emotional node creator
   * CANONICAL CATEGORY: EMOTIONAL
   * - HeartCrystal, NeuralLobe, BloomingGem
   * - TearShaped, Folded, SymmetricSeed
   */
  static createEmotionalNode(group, index, color) {
    const variants = [
      () => CanonicalGeometryFamilies.createEmotionalHeartCrystal(1.0),
      () => CanonicalGeometryFamilies.createEmotionalNeuralLobe(1.0),
      () => CanonicalGeometryFamilies.createEmotionalBloomingGem(1.0),
      () => CanonicalGeometryFamilies.createEmotionalTearShaped(1.0),
      () => CanonicalGeometryFamilies.createEmotionalFolded(1.0),
      () => CanonicalGeometryFamilies.createEmotionalSymmetricSeed(1.0)
    ];
    
    const mesh = variants[index % 6]();
    if (!mesh.userData) mesh.userData = {};
    mesh.userData.category = 'emotional';
    mesh.userData.visualReady = true;
    group.add(mesh);
    return group;
  }

  /**
   * Animate node (rotation, pulsing, etc)
   * UPGRADED: Supports internal rotating elements and animations
   */
  static animate(nodeGroup, deltaTime, time) {
    // Gentle primary rotation
    nodeGroup.rotation.y += deltaTime * 0.3;

    // Category-specific rotations
    if (nodeGroup.userData.rotationAxis) {
      const axis = nodeGroup.userData.rotationAxis;
      nodeGroup.rotation.x += deltaTime * 0.2 * axis.x;
      nodeGroup.rotation.z += deltaTime * 0.2 * axis.z;
    }

    // POLISH: Animate inner signal rotations (INPUT nodes)
    if (nodeGroup.userData.innerSignalRotationAxis) {
      const innerSignal = nodeGroup.children.find(c => c.geometry && c.geometry.type === 'TetrahedronGeometry');
      if (innerSignal) {
        const axis = nodeGroup.userData.innerSignalRotationAxis;
        const speed = nodeGroup.userData.innerSignalRotationSpeed || 0.2;
        innerSignal.rotateOnWorldAxis(axis, deltaTime * speed);
      }
    }

    // POLISH: Animate internal vector rotations (INPUT nodes - WireframeSphere)
    if (nodeGroup.userData.vectorRotationAxis) {
      const vector = nodeGroup.children.find(c => c.userData && c.userData.isAnalyticalFrame === false && c.geometry && c.geometry.type === 'OctahedronGeometry');
      if (vector && nodeGroup.children.indexOf(vector) > 1) { // Skip outer octa
        const axis = nodeGroup.userData.vectorRotationAxis;
        const speed = nodeGroup.userData.vectorRotationSpeed || 0.25;
        vector.rotateOnWorldAxis(axis, deltaTime * speed);
      }
    }

    // POLISH: Animate mesh pulsing (CONTROL nodes)
    if (nodeGroup.userData.meshPulsePhase !== undefined) {
      nodeGroup.userData.meshPulsePhase += deltaTime * nodeGroup.userData.meshPulseSpeed;
      const pulse = Math.sin(nodeGroup.userData.meshPulsePhase) * nodeGroup.userData.meshPulseAmplitude;
      nodeGroup.children.forEach(child => {
        if (child.isMesh && child.userData && child.userData.vfxType) {
          if (child.material && child.material.opacity !== undefined) {
            // GUARD: Skip if material is frozen or immutable
            const isFrozen = Object.isFrozen(child.material);
            const isImmutable = child.material.userData && child.material.userData.immutable === true;
            
            if (!isFrozen && !isImmutable) {
              try {
                child.material.opacity = 0.4 + pulse;
              } catch (err) {
                // Silently skip if read-only
              }
            }
          }
        }
      });
    }

    // POLISH: Animate internal analytical frame (ANALYTICS nodes)
    if (nodeGroup.userData.analyticalFrameRotationAxis) {
      const frameplane = nodeGroup.children.find(c => c.userData && c.userData.isAnalyticalFrame);
      if (frameplane) {
        const axis = nodeGroup.userData.analyticalFrameRotationAxis;
        const speed = nodeGroup.userData.analyticalFrameRotationSpeed || 0.18;
        frameplane.rotateOnWorldAxis(axis, deltaTime * speed);
      }
    }

    // POLISH: Animate internal analysis geometry (ANALYTICS cube variant)
    if (nodeGroup.userData.internalGeometryRotationAxis) {
      const internalGeo = nodeGroup.children.find(c => c.userData && c.userData.isInternalAnalysisGeometry);
      if (internalGeo) {
        const axis = nodeGroup.userData.internalGeometryRotationAxis;
        const speed = nodeGroup.userData.internalGeometryRotationSpeed || 0.22;
        internalGeo.rotateOnWorldAxis(axis, deltaTime * speed);
      }
    }

    // POLISH: Animate storage segment micro-rotations
    if (nodeGroup.userData.segmentMicroRotationEnabled) {
      nodeGroup.children.forEach((child, idx) => {
        if (child.userData && child.userData.segmentIndex !== undefined) {
          const baseRotZ = Math.sin(child.userData.segmentIndex * 0.5) * 0.08;
          const pulse = Math.sin(time * 0.8 + child.userData.segmentIndex) * 0.04;
          child.rotation.z = baseRotZ + pulse;
        }
      });
    }

    // POLISH: Animate MNEMONIC_VAULT (inner core + outer shell counter-rotation)
    if (nodeGroup.userData.mnemonicCoreRotationAxis) {
      const innerCore = nodeGroup.children.find(c => c.userData && c.userData.isInnerCore);
      if (innerCore) {
        const axis = nodeGroup.userData.mnemonicCoreRotationAxis;
        const speed = nodeGroup.userData.mnemonicCoreRotationSpeed || 0.08;
        innerCore.rotateOnWorldAxis(axis, deltaTime * speed);
      }
      
      const outerShell = nodeGroup.children.find(c => c.userData && c.userData.isOuterShell);
      if (outerShell) {
        const axis = nodeGroup.userData.mnemonicShellRotationAxis;
        const speed = nodeGroup.userData.mnemonicShellRotationSpeed || -0.06;
        outerShell.rotateOnWorldAxis(axis, deltaTime * speed);
      }
    }

    // POLISH: Animate ARCHIVE_SPINDLE (axial rotation + vertical oscillation)
    if (nodeGroup.userData.spindleRotationSpeed) {
      // Axial rotation (Y-axis)
      nodeGroup.rotation.y += deltaTime * nodeGroup.userData.spindleRotationSpeed;
      
      // Vertical oscillation (stored in baseY)
      if (!nodeGroup.userData.baseY) {
        nodeGroup.userData.baseY = nodeGroup.position.y;
      }
      const oscillation = Math.sin(time * nodeGroup.userData.spindleOscillationSpeed) * nodeGroup.userData.spindleOscillationAmplitude;
      nodeGroup.position.y = nodeGroup.userData.baseY + oscillation;
    }

    // POLISH: Animate MEMORY_REEF (shard orbital animation)
    if (nodeGroup.userData.reefShardOrbitSpeed) {
      const shardCount = nodeGroup.userData.reefShardCount || 8;
      let shardIndex = 0;
      
      nodeGroup.children.forEach(child => {
        if (child.userData && child.userData.shardIndex !== undefined) {
          const baseAngle = child.userData.orbitAngle || 0;
          const orbitRadius = child.userData.orbitRadius || 0.65;
          const orbitHeight = child.userData.orbitHeight || 0;
          
          // Slow orbital motion
          const orbitalPhase = time * nodeGroup.userData.reefShardOrbitSpeed + baseAngle;
          
          child.position.set(
            Math.cos(orbitalPhase) * orbitRadius,
            orbitHeight,
            Math.sin(orbitalPhase) * orbitRadius
          );
          
          shardIndex++;
        }
      });
    }

    // POLISH: Animate FLUX_CHAMBER (outer chamber + inner core counter-rotation)
    if (nodeGroup.userData.chamberOuterRotationAxis) {
      const outerChamber = nodeGroup.children.find(c => c.userData && c.userData.isOuterChamber);
      if (outerChamber) {
        const axis = nodeGroup.userData.chamberOuterRotationAxis;
        const speed = nodeGroup.userData.chamberOuterRotationSpeed || 0.1;
        outerChamber.rotateOnWorldAxis(axis, deltaTime * speed);
      }
      
      const innerCore = nodeGroup.children.find(c => c.userData && c.userData.isProcessorCore);
      if (innerCore) {
        const axis = nodeGroup.userData.chamberInnerRotationAxis;
        const speed = nodeGroup.userData.chamberInnerRotationSpeed || -0.14;
        innerCore.rotateOnWorldAxis(axis, deltaTime * speed);
      }
    }

    // POLISH: Animate TRANSFORMATION_SPINE (axial rotation + breathing scale)
    // [SESSION 107] LEGACY SCALE PULSE AUDIT - Breathing disabled (was ±2% unintentional oscillation)
    if (nodeGroup.userData.spineRotationSpeed) {
      // Axial rotation
      nodeGroup.rotation.y += deltaTime * nodeGroup.userData.spineRotationSpeed;
      
      // GUARD: Disable legacy breathing scale (unintentional mutation without feedback)
      if (!EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE && !EnhancedNodeModels.config.DISABLE_SPINE_BREATHING) {
        if (!nodeGroup.userData.baseScale) {
          nodeGroup.userData.baseScale = 1.0;
        }
        const breathing = Math.sin(time * nodeGroup.userData.spineBreathingSpeed) * nodeGroup.userData.spineBreathingAmplitude;
        const targetScale = nodeGroup.userData.baseScale + breathing;
        nodeGroup.scale.set(targetScale, targetScale, targetScale);
      } else {
        // Keep scale locked at 1.0 (stable node authority)
        nodeGroup.scale.set(1.0, 1.0, 1.0);
      }
    }

    // POLISH: Animate CONVERSION_ORBIT (orbiting rings around stable core)
    if (nodeGroup.userData.orbitRingCount) {
      nodeGroup.children.forEach(child => {
        if (child.userData && child.userData.isOrbitRing) {
          const orbitAxis = child.userData.orbitAxis;
          const orbitSpeed = child.userData.orbitSpeed;
          if (orbitAxis && orbitSpeed) {
            child.rotateOnWorldAxis(orbitAxis, deltaTime * orbitSpeed);
          }
        }
      });
    }

    // POLISH: Animate OBSERVER_LENS (very slow rotation + subtle wobble)
    if (nodeGroup.userData.lensRotationSpeed) {
      // Very slow rotation around Y-axis
      nodeGroup.rotation.y += deltaTime * nodeGroup.userData.lensRotationSpeed;
      
      // Subtle axial wobble (tilt back and forth)
      if (!nodeGroup.userData.wobblePhase) {
        nodeGroup.userData.wobblePhase = 0;
      }
      nodeGroup.userData.wobblePhase += deltaTime * nodeGroup.userData.lensWobbleSpeed;
      const wobble = Math.sin(nodeGroup.userData.wobblePhase) * nodeGroup.userData.lensWobbleAmplitude;
      nodeGroup.rotation.x = wobble;
    }

    // POLISH: Animate FRACTAL_ECHO (seed + echoes counter-rotation + breathing)
    // [SESSION 107] LEGACY SCALE PULSE AUDIT - Breathing disabled (was ±1.5% unintentional oscillation)
    if (nodeGroup.userData.fractalSeedRotationSpeed) {
      // Seed core rotates one direction
      const seed = nodeGroup.children.find(c => c.userData && c.userData.isSeedCore);
      if (seed) {
        seed.rotation.x += deltaTime * nodeGroup.userData.fractalSeedRotationSpeed * 0.3;
        seed.rotation.y += deltaTime * nodeGroup.userData.fractalSeedRotationSpeed * 0.5;
        seed.rotation.z += deltaTime * nodeGroup.userData.fractalSeedRotationSpeed * 0.2;
      }
      
      // Echoes counter-rotate (different axis)
      nodeGroup.children.forEach(child => {
        if (child.userData && child.userData.isEcho) {
          child.rotation.x -= deltaTime * nodeGroup.userData.fractalEchoRotationSpeed * 0.4;
          child.rotation.y -= deltaTime * nodeGroup.userData.fractalEchoRotationSpeed * 0.6;
          child.rotation.z -= deltaTime * nodeGroup.userData.fractalEchoRotationSpeed * 0.3;
        }
      });
      
      // GUARD: Disable legacy breathing scale (unintentional mutation without feedback)
      if (!EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE && !EnhancedNodeModels.config.DISABLE_FRACTAL_BREATHING) {
        if (!nodeGroup.userData.baseScale) {
          nodeGroup.userData.baseScale = 1.0;
        }
        const breathing = Math.sin(time * 0.6) * nodeGroup.userData.fractalBreathingAmplitude;
        const targetScale = nodeGroup.userData.baseScale + breathing;
        nodeGroup.scale.set(targetScale, targetScale, targetScale);
      } else {
        // Keep scale locked at 1.0 (stable node authority)
        nodeGroup.scale.set(1.0, 1.0, 1.0);
      }
    }

    // POLISH: Animate PARALLAX_ORACLE (planes rotate independently, core stable)
    if (nodeGroup.userData.observerPlaneCount) {
      nodeGroup.children.forEach(child => {
        if (child.userData && child.userData.isObservationPlane) {
          const rotAxis = child.userData.planeRotationAxis;
          const rotSpeed = child.userData.planeRotationSpeed;
          if (rotAxis && rotSpeed) {
            child.rotateOnWorldAxis(rotAxis, deltaTime * rotSpeed);
          }
        }
      });
      // Core observer remains completely stable (NO rotation)
    }

    // POLISH: Animate SIGNAL_RECEPTOR (core rotation + antenna pulse)
    // [SESSION 107] LEGACY SCALE PULSE AUDIT - Antenna pulse disabled (was ±8% elongation)
    if (nodeGroup.userData.receptorRotationSpeed) {
      // Core rotation
      nodeGroup.rotation.y += deltaTime * nodeGroup.userData.receptorRotationSpeed;
      
      // GUARD: Disable legacy antenna pulse (unintentional mutation without feedback)
      if (!EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE && !EnhancedNodeModels.config.DISABLE_ANTENNA_PULSE) {
        nodeGroup.children.forEach(child => {
          if (child.userData && child.userData.isAntenna) {
            if (!child.userData.baseScale) {
              child.userData.baseScale = 1.0;
            }
            const pulse = Math.sin(time * nodeGroup.userData.antennaPulseSpeed + child.userData.antennaIndex * 0.5) * nodeGroup.userData.antennaaPulseAmplitude;
            child.scale.set(1.0, 1.0 + pulse, 1.0); // Elongate/compress antenna
          }
        });
      } else {
        // Keep antenna scale locked at 1.0 (stable node authority)
        nodeGroup.children.forEach(child => {
          if (child.userData && child.userData.isAntenna) {
            child.scale.set(1.0, 1.0, 1.0);
          }
        });
      }
    }

    // POLISH: Animate DATA_GATEWAY (ring rotation + portal oscillation + stream flow)
    if (nodeGroup.userData.gatewayRingRotationSpeed) {
      // Ring rotation
      const ring = nodeGroup.children.find(c => c.userData && c.userData.isGatewayRing);
      if (ring) {
        ring.rotation.z += deltaTime * nodeGroup.userData.gatewayRingRotationSpeed;
      }
      
      // Portal oscillation (up/down bobbing)
      const portal = nodeGroup.children.find(c => c.userData && c.userData.isPortal);
      if (portal) {
        const oscillation = Math.sin(time * nodeGroup.userData.portalOscillationSpeed) * nodeGroup.userData.portalOscillationAmplitude;
        portal.position.y = oscillation;
      }
      
      // Stream flow animation (segments flowing inward)
      nodeGroup.children.forEach(child => {
        if (child.userData && child.userData.isStreamSegment) {
          const baseZ = child.userData.baseZ;
          const flowOffset = (time * nodeGroup.userData.streamFlowSpeed + child.userData.segmentIndex * 0.3) % 1.2;
          child.position.z = 0.8 - flowOffset;
        }
      });
    }

    // POLISH: Animate INCOMING_FUNNEL (funnel rotation + width breathing)
    // [SESSION 107] LEGACY SCALE PULSE AUDIT - Breathing disabled (was ±3% width oscillation)
    if (nodeGroup.userData.funnelRotationSpeed) {
      // Funnel rotation
      nodeGroup.rotation.y += deltaTime * nodeGroup.userData.funnelRotationSpeed;
      
      // GUARD: Disable legacy width breathing (unintentional mutation without feedback)
      if (!EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE && !EnhancedNodeModels.config.DISABLE_FUNNEL_BREATHING) {
        if (!nodeGroup.userData.baseScale) {
          nodeGroup.userData.baseScale = 1.0;
        }
        const breathing = Math.sin(time * nodeGroup.userData.funnelBreathingSpeed) * nodeGroup.userData.funnelBreathingAmplitude;
        const targetScale = nodeGroup.userData.baseScale + breathing;
        nodeGroup.scale.x = targetScale;
        nodeGroup.scale.z = targetScale;
        // Keep Y scale constant
      } else {
        // Keep scale locked at 1.0 (stable node authority)
        nodeGroup.scale.x = 1.0;
        nodeGroup.scale.z = 1.0;
      }
    }

    // POLISH: Animate COMMAND_PYRAMID (core rotation + glow pulsing)
    // [SESSION 107] LEGACY SCALE PULSE AUDIT - Glow pulsing disabled (unintentional mutation)
    if (nodeGroup.userData.commandRotationSpeed) {
      // Pyramid rotation
      nodeGroup.rotation.y += deltaTime * nodeGroup.userData.commandRotationSpeed;
      
      // GUARD: Disable legacy glow pulsing (unintentional mutation without feedback)
      if (!EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE && !EnhancedNodeModels.config.DISABLE_GLOW_PULSING) {
        const glow = nodeGroup.children.find(c => c.userData && c.userData.isAuthorityGlow);
        if (glow) {
          const pulse = Math.sin(time * nodeGroup.userData.commandPulseSpeed) * nodeGroup.userData.commandPulseAmplitude;
          glow.scale.set(1.0 + pulse, 1.0 + pulse, 1.0 + pulse);
        }
      } else {
        // Keep glow scale locked at 1.0 (stable node authority)
        const glow = nodeGroup.children.find(c => c.userData && c.userData.isAuthorityGlow);
        if (glow) {
          glow.scale.set(1.0, 1.0, 1.0);
        }
      }
    }

    // POLISH: Animate HIERARCHY_TOWER (tower rotation + level oscillation)
    if (nodeGroup.userData.towerRotationSpeed) {
      // Tower rotation
      nodeGroup.rotation.y += deltaTime * nodeGroup.userData.towerRotationSpeed;
      
      // Level oscillation (gentle bobbing)
      nodeGroup.children.forEach(child => {
        if (child.userData && child.userData.isHierarchyLevel) {
          const baseY = child.userData.baseY;
          const oscillation = Math.sin(time * nodeGroup.userData.levelOscillationSpeed + child.userData.levelIndex * 0.3) * nodeGroup.userData.levelOscillationAmplitude;
          child.position.y = baseY + oscillation;
        }
      });
    }

    // POLISH: Animate SYMMETRY_CORE (core + arms counter-rotation)
    if (nodeGroup.userData.symCoreRotationSpeed) {
      // Core rotates one direction
      const core = nodeGroup.children.find(c => c.userData && c.userData.isSymmetryCore);
      if (core) {
        core.rotation.x += deltaTime * nodeGroup.userData.symCoreRotationSpeed * 0.3;
        core.rotation.y += deltaTime * nodeGroup.userData.symCoreRotationSpeed * 0.7;
        core.rotation.z += deltaTime * nodeGroup.userData.symCoreRotationSpeed * 0.2;
      }
      
      // Arms counter-rotate (opposite direction)
      nodeGroup.children.forEach(child => {
        if (child.userData && child.userData.isSymmetryArm) {
          const armIndex = child.userData.armIndex;
          child.rotation.x -= deltaTime * nodeGroup.userData.symArmRotationSpeed * 0.3;
          child.rotation.y -= deltaTime * nodeGroup.userData.symArmRotationSpeed * 0.4;
          child.rotation.z -= deltaTime * nodeGroup.userData.symArmRotationSpeed * 0.3;
        }
      });
    }

    // POLISH: Animate FLOW_RECOMPOSER (floating shards + core)
    if (nodeGroup.userData.nodeGeometryName === 'PROCESS_FLOW_RECOMPOSER') {
      nodeGroup.children.forEach(child => {
        if (child.userData.isRecomposerShard) {
          // Slow drift and rotation
          const speed = child.userData.driftSpeed || 0.1;
          
          // Rotate shard around its own center
          child.rotation.z += deltaTime * speed;
          child.rotation.x += deltaTime * speed * 0.5;
          
          // Slight positional drift
          // We apply a sine wave offset to the initial position concept
          // Since we don't store initial pos explicitly on child here, we assume current is close enough
          // or just oscillate rotation more aggressively to simulate reconfiguration
          const wobble = Math.sin(time * speed) * 0.002;
          child.position.y += wobble;
        }
        if (child.userData.isFlowCore) {
           child.rotation.y -= deltaTime * 0.2;
           const pulse = 1.0 + Math.sin(time * 2) * 0.1;
           child.scale.setScalar(pulse);
        }
      });
    }

    // POLISH: Animate TEMPORAL_SHIFTER (layer drift)
    if (nodeGroup.userData.nodeGeometryName === 'PROCESS_TEMPORAL_SHIFTER') {
       nodeGroup.children.forEach(child => {
         if (child.userData.isTemporalLayer) {
            const phase = child.userData.phaseOffset || 0;
            const speed = child.userData.shiftSpeed || 0.5;
            
            // Drift on X/Z plane (temporal instability)
            // Using absolute time to ensure smooth wave
            const driftX = Math.sin(time * speed + phase) * 0.08;
            const driftZ = Math.cos(time * speed * 0.8 + phase) * 0.05;
            
            // Apply drift (resetting position near center first would be better, but this adds to current)
            // To be safe and avoid drift-away, we set relative to 0 if we assume stack is centered
            // But child.position.y was set during creation. We must preserve Y.
            // child.position.x = driftX; // This overrides initialization
            // Let's just Add to rotation to imply shifting if position is risky without base
            child.rotation.y = time * 0.1 + phase;
            
            // Actually, let's use the drift for position X/Z as intended
            child.position.x = driftX;
            child.position.z = driftZ;
         }
       });
    }

    // POLISH: Animate ITERATIVE_ENGINE (ring rotation)
    if (nodeGroup.userData.nodeGeometryName === 'PROCESS_ITERATIVE_ENGINE') {
        nodeGroup.children.forEach(child => {
            if (child.userData.isIterativeRing) {
                const axis = child.userData.rotationAxis;
                const speed = child.userData.rotationSpeed;
                if (axis && speed) {
                    child.rotateOnWorldAxis(axis, deltaTime * speed);
                }
            }
            if (child.userData.isIterativeCore) {
                child.rotation.y += deltaTime * 0.5;
                child.rotation.z += deltaTime * 0.2;
            }
        });
    }

    // ============================================================================
    // STORAGE ENHANCED ANIMATIONS (Session 81 - Kinetic Update)
    // ============================================================================

    // 1. STORAGE_ARCHIVE_NEXUS (DataWeaver)
    if (nodeGroup.userData.nodeGeometryName === 'STORAGE_ARCHIVE_NEXUS') {
      nodeGroup.children.forEach(child => {
        // Strands oscillate like a loom
        if (child.userData.isArchiveStrand) {
          const idx = child.userData.strandIndex || 0;
          // Gentle sway in rotation
          if (child.userData.baseRot) {
             const sway = Math.sin(time * 0.5 + idx) * 0.1;
             child.rotation.y = child.userData.baseRot.y + sway;
          }
        }
        // Shuttles move vertically
        if (child.userData.isArchiveShuttle) {
          const idx = child.userData.shuttleIndex || 0;
          const travel = Math.sin(time * 0.8 + idx * 2) * 0.25;
          child.position.y = child.userData.baseY + travel;
        }
        // Core spins
        if (child.userData.isArchiveCore) {
          child.rotation.y -= deltaTime * 0.5;
        }
      });
    }

    // 2. STORAGE_MEMORY_CRYPTS (VaultStack)
    if (nodeGroup.userData.nodeGeometryName === 'STORAGE_MEMORY_CRYPTS') {
      nodeGroup.children.forEach(child => {
        if (child.userData.isCryptChamber) {
          const idx = child.userData.chamberIndex || 0;
          
          // Rotating chambers (like combination lock)
          // Alternate direction per layer
          const dir = idx % 2 === 0 ? 1 : -1;
          child.rotation.y += deltaTime * 0.2 * dir;
          
          // Vertical breathing (unlocking motion)
          const slide = Math.sin(time * 0.4 + idx) * 0.02;
          child.position.y = child.userData.baseY + slide;
        }
      });
    }

    // 3. STORAGE_DEPTH_LAYERS (ContainmentField)
    if (nodeGroup.userData.nodeGeometryName === 'STORAGE_DEPTH_LAYERS') {
      nodeGroup.children.forEach(child => {
        if (child.userData.isDepthShell) {
          const axis = child.userData.rotationAxis;
          const speed = child.userData.rotationSpeed || 0.1;
          
          // Independent shell rotation
          if (axis) {
            child.rotateOnWorldAxis(axis, deltaTime * speed);
          }
          
          // Breathing expansion (containment field fluctuation)
          // Skip if legacy breathing disabled? No, this is a core visual for this variant.
          // We keep it subtle.
          const breathe = 1.0 + Math.sin(time * 0.6 + child.userData.layerIndex) * 0.02;
          child.scale.setScalar(breathe);
        }
        
        if (child.userData.isDepthCore) {
           child.scale.setScalar(0.8 + Math.sin(time * 2) * 0.1); // Pulsing singularity
        }
      });
    }

    // ============================================================================
    // INPUT SENSORY ANIMATIONS (Session 111 - Kinetic Update)
    // ============================================================================

    // 1. INPUT_TACTILE_SENSOR (TactileSensor)
    if (nodeGroup.userData.nodeGeometryName === 'INPUT_TACTILE_SENSOR') {
      nodeGroup.children.forEach(child => {
        if (child.userData.isTactileBristle && child.userData.curve) {
          // Wave motion along bristle
          const phase = child.userData.bendPhase;
          const speed = child.userData.bendSpeed;
          const amplitude = child.userData.bendAmplitude;
          
          // Create wave traveling down bristle
          const wave = Math.sin(time * speed + phase) * amplitude;
          
          // Store original position and apply wave offset
          if (!child.userData.baseScale) {
            child.userData.baseScale = child.scale.clone();
          }
          
          // Apply slight bend via scale modulation
          child.scale.y = child.userData.baseScale.y * (1.0 + wave * 0.5);
          child.scale.x = child.userData.baseScale.x * (1.0 - wave * 0.3);
          child.scale.z = child.userData.baseScale.z * (1.0 - wave * 0.3);
          
          // Rotation wave
          child.rotation.x += Math.sin(time * speed + phase + 1) * deltaTime * 0.3;
          child.rotation.z += Math.cos(time * speed + phase) * deltaTime * 0.2;
        }
      });
    }

    // 2. INPUT_ECHO_DETECTOR (EchoDetector)
    if (nodeGroup.userData.nodeGeometryName === 'INPUT_ECHO_DETECTOR') {
      nodeGroup.children.forEach(child => {
        if (child.userData.isEchoShell) {
          // Pulsing scale (expanding/contracting shells)
          const shellLayer = child.userData.shellLayer;
          const pulsePhase = child.userData.pulsePhase;
          const pulseSpeed = child.userData.pulseSpeed;
          const pulseAmp = child.userData.pulseAmplitude;
          
          const pulse = Math.sin(time * pulseSpeed + pulsePhase) * pulseAmp;
          const scale = 1.0 + pulse;
          
          child.scale.setScalar(scale);
          
          // Subtle rotation
          child.rotation.x += deltaTime * 0.1 * (1 - shellLayer * 0.15);
          child.rotation.y += deltaTime * 0.08 * (shellLayer * 0.2 + 0.5);
        }
        
        if (child.userData.isEchoChamber) {
          // Central chamber pulses at different frequency
          const pulse = Math.sin(time * child.userData.pulseSpeed) * 0.1;
          child.scale.setScalar(1.0 + pulse);
          
          // Rotation of chamber
          child.rotation.x += deltaTime * 0.3;
          child.rotation.y += deltaTime * 0.2;
        }
      });
    }

    // 3. INPUT_NEURAL_RECEPTOR (NeuralReceptor)
    if (nodeGroup.userData.nodeGeometryName === 'INPUT_NEURAL_RECEPTOR') {
      nodeGroup.children.forEach(child => {
        // Neural signals travel along dendrite curves
        if (child.userData.isNeuralSignal && child.userData.parentCurve) {
          const curve = child.userData.parentCurve;
          const speed = child.userData.signalSpeed;
          
          // Advance along curve
          child.userData.pathOffset = (child.userData.pathOffset + deltaTime * speed) % 1.0;
          
          // Get position on curve
          const point = curve.getPoint(child.userData.pathOffset);
          child.position.copy(point);
          
          // Glow pulse
          const glow = 0.7 + Math.sin(time * 6) * 0.3;
          if (child.material) {
            child.material.opacity = glow;
          }
        }
      });
    }

    // ============================================================================
    // INTEGRATION ENHANCED ANIMATIONS (Session 110 - Kinetic Update)
    // ============================================================================

    // 1. INTEGRATION_SIGNAL_KNOT (Signal Knot)
    if (nodeGroup.userData.nodeGeometryName === 'INTEGRATION_SIGNAL_KNOT') {
      nodeGroup.children.forEach(child => {
        // Signal packets travel along curves
        if (child.userData.isSignalPacket && child.userData.parentCurve) {
          const curve = child.userData.parentCurve;
          const speed = child.userData.packetSpeed || 0.2;
          
          // Advance path offset
          child.userData.pathOffset = (child.userData.pathOffset + deltaTime * speed) % 1.0;
          
          // Get point on curve
          const point = curve.getPoint(child.userData.pathOffset);
          child.position.copy(point);
          
          // Pulse scale
          const pulse = 1.0 + Math.sin(time * 5 + child.userData.packetIndex) * 0.2;
          child.scale.setScalar(pulse);
        }
      });
    }

    // 2. INTEGRATION_PROTOCOL_TANGLE (Protocol Tangle)
    if (nodeGroup.userData.nodeGeometryName === 'INTEGRATION_PROTOCOL_TANGLE') {
      nodeGroup.children.forEach(child => {
        if (child.userData.isProtocolStrand) {
          // Jitter/Vibration effect (Visual friction)
          const amp = child.userData.vibrationAmp || 0.01;
          const speed = child.userData.vibrationSpeed || 2.0;
          
          const jitterX = Math.sin(time * speed * 1.1 + child.userData.strandIndex) * amp;
          const jitterY = Math.cos(time * speed * 0.9 + child.userData.strandIndex) * amp;
          const jitterZ = Math.sin(time * speed * 1.3 + child.userData.strandIndex) * amp;
          
          child.position.set(jitterX, jitterY, jitterZ);
          
          // Pulse opacity for negotiation effect
          if (child.material) {
             const pulse = 0.6 + Math.sin(time * 2 + child.userData.strandIndex) * 0.2;
             child.material.opacity = pulse;
          }
        }
        
        if (child.userData.isFrictionNode) {
          // Rotating friction nodes
          const speed = child.userData.rotSpeed || 1.0;
          child.rotation.x += deltaTime * speed;
          child.rotation.y += deltaTime * speed * 0.7;
        }
      });
    }

    // 3. INTEGRATION_CONTINUITY_BINDER (Continuity Binder)
    if (nodeGroup.userData.nodeGeometryName === 'INTEGRATION_CONTINUITY_BINDER') {
      // Slow breathing tension
      const tension = Math.sin(time * 0.5) * 0.05;
      
      nodeGroup.children.forEach(child => {
        if (child.userData.isBinderLoop) {
           // Pull loops slightly apart and together (scale tension)
           const scale = 1.0 + tension * 0.5;
           child.scale.setScalar(scale);
        }
        if (child.userData.isStabilityAnchor) {
           // Anchor rotates slowly
           child.rotation.z += deltaTime * 0.2;
        }
      });
    }

    // ============================================================================
    // CONTROL ENHANCED ANIMATIONS (Session 83 - Kinetic Update)
    // ============================================================================

    // 1. CONTROL_DECISION_FORK (SynapseFork)
    if (nodeGroup.userData.nodeGeometryName === 'CONTROL_DECISION_FORK') {
      nodeGroup.children.forEach(child => {
        // Orbiting convergence nodes
        if (child.userData.isConvergenceNode) {
           const radius = child.userData.orbitRadius;
           const speed = child.userData.orbitSpeed;
           const idx = child.userData.orbitIndex;
           
           const angle = time * speed + (idx * Math.PI * 2 / 3);
           child.position.x = Math.cos(angle) * radius;
           child.position.z = Math.sin(angle) * radius;
           child.position.y = Math.sin(angle * 2) * 0.2 + 0.5; // Undulating orbit
        }
        
        // Pulsing branches (decision energy)
        if (child.userData.isDecisionBranch) {
           const idx = child.userData.branchIndex || 0;
           // Pulse emissive intensity
           const pulse = 0.2 + Math.sin(time * 3 + idx) * 0.15;
           if (child.material && !child.material.userData.immutable) {
              child.material.emissiveIntensity = pulse;
           }
        }
      });
    }

    // 2. CONTROL_AUTHORITY_HELIX (CommandSpire)
    if (nodeGroup.userData.nodeGeometryName === 'CONTROL_AUTHORITY_HELIX') {
      nodeGroup.children.forEach(child => {
        if (child.userData.isHelixStrand) {
           // Continuous rotation of the helix
           child.rotation.y -= deltaTime * 0.5;
        }
        if (child.userData.isTierRing) {
           // Counter-rotation of rings
           child.rotation.y += deltaTime * 0.2;
           // Gentle wobble
           child.rotation.x = Math.sin(time + child.userData.tierIndex) * 0.1;
        }
      });
    }

    // 3. CONTROL_COMMAND_MATRIX (OverseerGrid)
    if (nodeGroup.userData.nodeGeometryName === 'CONTROL_COMMAND_MATRIX') {
      nodeGroup.children.forEach(child => {
        if (child.userData.isCommandNode) {
           // Independent bobbing of grid nodes
           const phase = child.userData.bobPhase || 0;
           const bob = Math.sin(time * 1.5 + phase) * 0.03;
           if (child.userData.basePos) {
              child.position.y = child.userData.basePos.y + bob;
           }
        }
        if (child.userData.isFlowLine) {
           // Pulse flow lines opacity
           const pulse = 0.4 + Math.sin(time * 4) * 0.2;
           if (child.material) {
              child.material.opacity = pulse;
           }
        }
        if (child.userData.isMatrixCore) {
           // Core throbs
           const scale = 1.0 + Math.sin(time * 3) * 0.1;
           child.scale.setScalar(scale);
        }
      });
    }

    // Pulse main materials (SKIP frozen or immutable materials)
    nodeGroup.traverse(child => {
      if (child.isMesh && child.material && child.material.emissive) {
        // GUARD: Never animate frozen or immutable materials
        const isFrozen = Object.isFrozen(child.material);
        const isImmutable = child.material.userData && child.material.userData.immutable === true;
        
        if (isFrozen || isImmutable) {
          // Skip emissive animation for canonical/immutable materials
          return;
        }
        
        // Only animate mutable materials
        try {
          const pulse = Math.sin(time * 2) * 0.1 + 0.25;
          child.material.emissiveIntensity = Math.max(0.15, pulse);
        } catch (err) {
          // Silently skip if material is read-only
          // (May occur with strict mode or sealed objects)
        }
      }
    });

    // Floating animation
    const float = Math.sin(time * 0.5) * 0.1;
    if (!nodeGroup.userData.baseY) {
      nodeGroup.userData.baseY = nodeGroup.position.y;
    }
    nodeGroup.position.y = nodeGroup.userData.baseY + float;
  }

  // ===== NEW BASE GEOMETRIES (7 canonical shapes) =====

  /**
   * NEW: Icosahedron - INPUT category
   * Clean 20-faced polyhedron with smooth appearance
   */
  static createNewIcosahedron(group, color) {
    try {
      const geoIcosahedron = new THREE.IcosahedronGeometry(0.75, 3);
      const matIcosahedron = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.7,
        roughness: 0.3,
        emissive: color,
        emissiveIntensity: 0.3
      });
      const icosahedron = new THREE.Mesh(geoIcosahedron, matIcosahedron);
      group.add(icosahedron);
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] Icosahedron creation failed, fallback to sphere:', err);
      return this.createInputNode0(group, color);
    }
  }

  /**
   * NEW: Dodecahedron - CONTROL category
   * Pentagon-faced polyhedron with geometric presence
   */
  static createNewDodecahedron(group, color) {
    try {
      const geoDodecahedron = new THREE.DodecahedronGeometry(0.65, 0);
      const matDodecahedron = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.75,
        roughness: 0.25,
        emissive: color,
        emissiveIntensity: 0.35
      });
      const dodecahedron = new THREE.Mesh(geoDodecahedron, matDodecahedron);
      group.add(dodecahedron);

      // Edge outline for definition
      const edgeGeo = new THREE.EdgesGeometry(geoDodecahedron);
      const edgeMat = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.4
      });
      const edges = new THREE.LineSegments(edgeGeo, edgeMat);
      group.add(edges);

      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] Dodecahedron creation failed, fallback to sphere:', err);
      return this.createControlNode0(group, color);
    }
  }

  /**
   * NEW: Ellipsoid - SIGMA category
   * Stretched sphere for smooth dimensional feel
   */
  static createNewEllipsoid(group, color) {
    try {
      const geoEllipsoid = new THREE.SphereGeometry(0.85, 32, 32);
      geoEllipsoid.scale(1.1, 0.75, 0.95); // Elliptical stretch
      const matEllipsoid = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.65,
        roughness: 0.35,
        emissive: color,
        emissiveIntensity: 0.3
      });
      const ellipsoid = new THREE.Mesh(geoEllipsoid, matEllipsoid);
      group.add(ellipsoid);
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] Ellipsoid creation failed, fallback to sphere:', err);
      return this.createInputNode1(group, color);
    }
  }

  /**
   * NEW: Truncated Pyramid - INTEGRATION category
   * Flat-topped pyramid for layered aesthetic
   */
  static createNewTruncatedPyramid(group, color) {
    try {
      // Create truncated pyramid using custom geometry
      const vertices = new Float32Array([
        // Bottom face (larger)
        -0.6, -0.5, -0.6,
        0.6, -0.5, -0.6,
        0.6, -0.5, 0.6,
        -0.6, -0.5, 0.6,
        // Top face (smaller)
        -0.3, 0.5, -0.3,
        0.3, 0.5, -0.3,
        0.3, 0.5, 0.3,
        -0.3, 0.5, 0.3
      ]);

      const indices = new Uint16Array([
        // Bottom
        0, 2, 1,
        0, 3, 2,
        // Top
        4, 5, 6,
        4, 6, 7,
        // Sides
        0, 1, 5,
        0, 5, 4,
        1, 2, 6,
        1, 6, 5,
        2, 3, 7,
        2, 7, 6,
        3, 0, 4,
        3, 4, 7
      ]);

      const geoPyramid = new THREE.BufferGeometry();
      geoPyramid.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geoPyramid.setIndex(new THREE.BufferAttribute(indices, 1));
      geoPyramid.computeVertexNormals();

      const matPyramid = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.6,
        roughness: 0.35,
        emissive: color,
        emissiveIntensity: 0.3
      });
      const pyramid = new THREE.Mesh(geoPyramid, matPyramid);
      group.add(pyramid);
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] Truncated Pyramid creation failed, fallback to sphere:', err);
      return this.createIntegrationNode0(group, color);
    }
  }

  /**
   * NEW: Rhombic Solid - STORAGE category
   * Diamond-like shape for precious storage feel
   */
  static createNewRhombicSolid(group, color) {
    try {
      // Rhombic 12-faced polyhedron using scaled octahedron
      const geoRhombic = new THREE.OctahedronGeometry(0.7, 2);
      geoRhombic.scale(1.0, 1.3, 1.0); // Elongate vertically
      
      const matRhombic = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.8,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.35
      });
      const rhombic = new THREE.Mesh(geoRhombic, matRhombic);
      group.add(rhombic);

      // Facet highlights
      const facetEdges = new THREE.EdgesGeometry(geoRhombic);
      const facetMat = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3
      });
      const facetLines = new THREE.LineSegments(facetEdges, facetMat);
      group.add(facetLines);

      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] Rhombic Solid creation failed, fallback to sphere:', err);
      return this.createStorageNode0(group, color);
    }
  }

  /**
   * NEW: Hexagonal Prism - PROCESS category
   * Six-sided vertical form for systematic processing
   */
  static createNewHexagonalPrism(group, color) {
    try {
      // Create hexagonal prism
      const vertices = new Float32Array([
        // Top hexagon
        0.6, 0.5, 0,
        0.3, 0.5, 0.52,
        -0.3, 0.5, 0.52,
        -0.6, 0.5, 0,
        -0.3, 0.5, -0.52,
        0.3, 0.5, -0.52,
        // Bottom hexagon
        0.6, -0.5, 0,
        0.3, -0.5, 0.52,
        -0.3, -0.5, 0.52,
        -0.6, -0.5, 0,
        -0.3, -0.5, -0.52,
        0.3, -0.5, -0.52
      ]);

      const indices = new Uint16Array([
        // Top and bottom faces
        0, 1, 2,
        0, 2, 3,
        0, 3, 4,
        0, 4, 5,
        6, 8, 7,
        6, 9, 8,
        6, 10, 9,
        6, 11, 10,
        // Sides
        0, 6, 7,
        0, 7, 1,
        1, 7, 8,
        1, 8, 2,
        2, 8, 9,
        2, 9, 3,
        3, 9, 10,
        3, 10, 4,
        4, 10, 11,
        4, 11, 5,
        5, 11, 6,
        5, 6, 0
      ]);

      const geoPrism = new THREE.BufferGeometry();
      geoPrism.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geoPrism.setIndex(new THREE.BufferAttribute(indices, 1));
      geoPrism.computeVertexNormals();

      const matPrism = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.7,
        roughness: 0.3,
        emissive: color,
        emissiveIntensity: 0.3
      });
      const prism = new THREE.Mesh(geoPrism, matPrism);
      group.add(prism);
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] Hexagonal Prism creation failed, fallback to sphere:', err);
      return this.createProcessNode0(group, color);
    }
  }

  /**
   * NEW: Elongated Octahedron - ANALYTICS category (UPGRADED)
   * Stretched octahedral form + internal rotating analytical frame
   * UPGRADED: Added internal planar analytical frame, slow precise rotation
   */
  static createNewElongatedOctahedron(group, color) {
    try {
      const geoOctahedron = new THREE.OctahedronGeometry(0.7, 3);
      geoOctahedron.scale(0.9, 1.4, 0.9); // Elongate vertically
      
      const matOctahedron = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.7,
        roughness: 0.3,
        emissive: color,
        emissiveIntensity: 0.3
      });
      const octahedron = new THREE.Mesh(geoOctahedron, matOctahedron);
      group.add(octahedron);

      // Vertex highlights
      const vertexEdges = new THREE.EdgesGeometry(geoOctahedron);
      const vertexMat = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.35
      });
      const vertexLines = new THREE.LineSegments(vertexEdges, vertexMat);
      group.add(vertexLines);

      // POLISH: Internal rotating analytical frame (angled planar slice)
      const framePlaneGeo = new THREE.PlaneGeometry(0.7, 0.4, 3, 2);
      const frameplaneMat = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.95,
        roughness: 0.05,
        emissive: color,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      const frameplane = new THREE.Mesh(framePlaneGeo, frameplaneMat);
      frameplane.rotation.x = Math.PI / 6;
      frameplane.rotation.z = Math.PI / 4;
      frameplane.userData = { isAnalyticalFrame: true };
      group.add(frameplane);

      // Store animation metadata
      group.userData.analyticalFrameRotationAxis = new THREE.Vector3(0.3, 1, -0.2).normalize();
      group.userData.analyticalFrameRotationSpeed = 0.18; // Slow, precise motion

      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] Elongated Octahedron creation failed, fallback to sphere:', err);
      return this.createAnalyticsNode0(group, color);
    }
  }

  // ===== KNOT NODE GEOMETRIES (8 topological shapes) =====
  // Pure geometry extension for sophisticated knot-based nodes
  // Each knot generates a tubular smooth mesh suitable for node rendering

  /**
   * KNOT: Trefoil Knot - PROCESS category
   * Simplest non-trivial knot, 3-fold rotational symmetry
   * Tubular parametric mesh for smooth rendering
   */
  static createKnotTrefoil(group, color) {
    try {
      const tube = this.generateTubularKnot(
        (t) => {
          const st = Math.sin(t);
          const ct = Math.cos(t);
          return [
            Math.sin(t) + 2 * Math.sin(2 * t),
            Math.cos(t) - 2 * Math.cos(2 * t),
            -Math.sin(3 * t)
          ];
        },
        0, Math.PI * 2, 64, 0.25, 8, color
      );
      group.add(tube);
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] Trefoil Knot failed, fallback:', err);
      return this.createProcessNode0(group, color);
    }
  }

  /**
   * KNOT: Figure-Eight Knot - INTEGRATION category
   * Four-crossing knot with distinctive figure-eight shape
   * Tubular parametric mesh
   */
  static createKnotFigureEight(group, color) {
    try {
      const tube = this.generateTubularKnot(
        (t) => {
          const st = Math.sin(t);
          const ct = Math.cos(t);
          const c2t = Math.cos(2 * t);
          const s2t = Math.sin(2 * t);
          return [
            (2 + c2t) * Math.cos(3 * t),
            (2 + c2t) * Math.sin(3 * t),
            s2t
          ];
        },
        0, Math.PI * 2, 64, 0.22, 8, color
      );
      group.add(tube);
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] Figure-Eight Knot failed, fallback:', err);
      return this.createIntegrationNode0(group, color);
    }
  }

  /**
   * KNOT: Triple Helix Knot - ANALYTICS category
   * Three-stranded helical structure with topological twisting
   * Tubular parametric mesh
   */
  static createKnotTripleHelix(group, color) {
    try {
      const tube = this.generateTubularKnot(
        (t) => {
          const ct = Math.cos(t);
          const st = Math.sin(t);
          const rt = 0.5 + 0.3 * Math.cos(3 * t);
          return [
            rt * ct,
            rt * st,
            0.6 * Math.sin(3 * t)
          ];
        },
        0, Math.PI * 2, 72, 0.2, 8, color
      );
      group.add(tube);
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] Triple Helix Knot failed, fallback:', err);
      return this.createAnalyticsNode0(group, color);
    }
  }

  /**
   * KNOT: Torus Knot (p,q) - STORAGE category
   * (2,3) torus knot: wraps p times meridian, q times poloidal
   * Tubular parametric mesh
   */
  static createKnotTorusKnot(group, color) {
    try {
      const p = 2;
      const q = 3;
      const tube = this.generateTubularKnot(
        (t) => {
          const angle1 = (q * t);
          const angle2 = (p * t);
          const r = 0.4 + 0.3 * Math.cos(angle1);
          return [
            r * Math.cos(angle2),
            r * Math.sin(angle2),
            0.5 * Math.sin(angle1)
          ];
        },
        0, Math.PI * 2, 80, 0.18, 10, color
      );
      group.add(tube);
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] Torus Knot failed, fallback:', err);
      return this.createStorageNode0(group, color);
    }
  }

  /**
   * KNOT: Borromean Rings - CONTROL category
   * Three mutually linked rings, topologically inseparable
   * Three interlocked tubular meshes forming singular composite
   */
  static createKnotBorromean(group, color) {
    try {
      const ringRadius = 0.35;
      const tubeRadius = 0.12;
      const sections = 48;
      
      // Create three rings at 120-degree angles
      for (let ringIndex = 0; ringIndex < 3; ringIndex++) {
        const angle = (ringIndex * Math.PI * 2) / 3;
        const cx = Math.cos(angle);
        const sx = Math.sin(angle);
        
        const points = [];
        for (let i = 0; i <= sections; i++) {
          const theta = (i / sections) * Math.PI * 2;
          const x = cx * ringRadius * Math.cos(theta);
          const y = sx * ringRadius * Math.cos(theta);
          const z = ringRadius * Math.sin(theta);
          points.push(new THREE.Vector3(x, y, z));
        }
        
        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(curve, sections, tubeRadius, 6, false);
        const material = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.7,
          roughness: 0.3,
          emissive: color,
          emissiveIntensity: 0.3
        });
        const mesh = new THREE.Mesh(geometry, material);
        
        // [RAYCAST FIX] Ensure Borromean ring mesh is interactive
        mesh.userData.isInteractive = true;
        mesh.userData.isKnotMesh = true;
        if (mesh.raycast === null || mesh.raycast === undefined) {
          mesh.raycast = THREE.Mesh.prototype.raycast;
        }
        
        group.add(mesh);
      }
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] Borromean Rings failed, fallback:', err);
      return this.createControlNode0(group, color);
    }
  }

  /**
   * KNOT: Möbius Knot Loop - ANALYTICS category
   * Single-sided surface with topological twist
   * Tubular parametric mesh following Möbius path
   */
  static createKnotMobius(group, color) {
    try {
      const tube = this.generateTubularKnot(
        (t) => {
          const r = 0.5 + 0.15 * Math.cos(t / 2);
          const angle = t;
          return [
            r * Math.cos(angle),
            r * Math.sin(angle),
            0.3 * Math.cos(t / 2)
          ];
        },
        0, Math.PI * 4, 64, 0.2, 8, color
      );
      group.add(tube);
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] Möbius Knot failed, fallback:', err);
      return this.createAnalyticsNode1(group, color);
    }
  }

  /**
   * KNOT: Chaotic Knot Core - PROCESS category
   * Self-similar chaotic structure with fractal-like properties
   * Tubular parametric mesh with complex winding
   */
  static createKnotChaotic(group, color) {
    try {
      const tube = this.generateTubularKnot(
        (t) => {
          const s1 = Math.sin(t);
          const c1 = Math.cos(t);
          const s2 = Math.sin(2.1 * t);
          const c2 = Math.cos(1.9 * t);
          return [
            s1 + 0.3 * s2,
            c1 + 0.3 * c2,
            0.4 * Math.sin(3.3 * t)
          ];
        },
        0, Math.PI * 2, 80, 0.19, 8, color
      );
      group.add(tube);
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] Chaotic Knot failed, fallback:', err);
      return this.createProcessNode1(group, color);
    }
  }

  /**
   * KNOT: Infinite Self-Intersecting Knot - INTEGRATION category
   * Complex recursive structure with self-similar intersections
   * Tubular parametric mesh with dense winding
   */
  static createKnotInfiniteSelfIntersecting(group, color) {
    try {
      const tube = this.generateTubularKnot(
        (t) => {
          const phases = [t, 1.3 * t, 0.7 * t];
          const r = 0.45 + 0.15 * Math.cos(t);
          const x = r * Math.cos(phases[0]) * (1 + 0.2 * Math.cos(phases[1]));
          const y = r * Math.sin(phases[0]) * (1 + 0.2 * Math.sin(phases[2]));
          const z = 0.35 * Math.sin(2.5 * t);
          return [x, y, z];
        },
        0, Math.PI * 2.5, 96, 0.17, 8, color
      );
      group.add(tube);
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] Infinite Self-Intersecting Knot failed, fallback:', err);
      return this.createIntegrationNode1(group, color);
    }
  }

  /**
   * Helper: Generate tubular knot geometry from parametric curve
   * Creates smooth tubular mesh around knot path
   * [RAYCAST FIX] Ensures knot mesh is properly interactive
   */
  static generateTubularKnot(parametricFunc, tStart, tEnd, segments, tubeRadius, tubeSegments, color) {
    const points = [];
    
    // Generate knot path points
    for (let i = 0; i <= segments; i++) {
      const t = tStart + (tEnd - tStart) * (i / segments);
      const pt = parametricFunc(t);
      points.push(new THREE.Vector3(pt[0] * 0.6, pt[1] * 0.6, pt[2] * 0.6));
    }
    
    // Create curve from points
    const curve = new THREE.CatmullRomCurve3(points);
    
    // Generate tubular geometry
    const geometry = new THREE.TubeGeometry(curve, segments, tubeRadius, tubeSegments, false);
    
    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.7,
      roughness: 0.3,
      emissive: color,
      emissiveIntensity: 0.3
    });
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    
    // [RAYCAST FIX] Ensure knot mesh is interactive
    // Knot geometry can be complex and may not raycast properly by default
    // We need to explicitly enable raycast on the knot mesh
    mesh.userData.isInteractive = true;
    mesh.userData.isKnotMesh = true;
    
    // Ensure raycast is enabled (don't disable it)
    // By default THREE.Mesh supports raycast, but ensure it's not overridden
    if (mesh.raycast === null || mesh.raycast === undefined) {
      mesh.raycast = THREE.Mesh.prototype.raycast;
    }
    
    return mesh;
  }

  /**
   * Get category-specific color
   * Extended with special categories: quantum, sigma, emotional, mythic, prime, error
   */
  static getCategoryColor(category) {
    const colors = {
      // Standard 6 categories
      'input': 0x00ddff,        // Cyan
      'process': 0xffaa00,      // Amber/Gold
      'integration': 0x00ff88,  // Green
      'analytics': 0xaa00ff,    // Violet
      'storage': 0x88ccff,      // Silver/Pale Blue
      'control': 0xff0088,      // Red/Magenta
      
      // Special multi-output categories
      'quantum': 0x4400ff,      // Indigo - quantum superposition
      'sigma': 0x00ff00,        // Bright Green - dimensional anomaly
      'emotional': 0xff4488,    // Hot Pink - resonant empathy
      
      // Ultra-rare categories
      'mythic': 0xffdd00,       // Gold - ultra-ceremonial
      'prime': 0xffffff,        // White - perfect topology
      'error': 0xff3333,        // Red - unstable/chaotic
      
      // Legacy/fallback
      'undefined': 0x00ffff     // Cyan fallback
    };
    
    const key = (category || 'control').toLowerCase().trim();
    return colors[key] || colors['undefined'];
  }

  /**
   * Get category name from color
   */
  static getCategoryFromColor(color) {
    const categories = {
      0x00ddff: 'input',
      0xffaa00: 'process',
      0x00ff88: 'integration',
      0xaa00ff: 'analytics',
      0x88ccff: 'storage',
      0xff0088: 'control'
    };
    return categories[color] || 'input';
  }

  // ===== EXTREME GEOMETRY WRAPPERS =====
  // These wrap EXTREME geometries to integrate them into normal node creation pools
  // Mapping: 
  // INPUT: Hyperbolic Prism, Singularity Knot
  // PROCESS: Quantum Lattice, Fractal Bloom
  // INTEGRATION: Reactive Tesseract, Chaotic Heart
  // STORAGE: Whisper Sphere, Echo Fractal
  // ANALYTICS: Abyssal Shard, Tri-Helix
  // CONTROL: Infinite Spiral, Chrono Ripper

  /**
   * EXTREME variant: Hyperbolic Neural Prism (archetypeId: 0)
   * Maps to INPUT category
   */
  static createExtremeInput0(group, color) {
    try {
      // Create temporary wrapped node for EXTREME generator
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      // Create the EXTREME geometry
      const extremeGroup = this.extremeNodePack.createHyperbolicPrism(tempNode, null);
      if (!extremeGroup) return group;
      
      // Add to our group
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 0;
      
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] EXTREME Input0 failed, fallback:', err);
      return this.createInputNode0(group, color);
    }
  }

  /**
   * EXTREME variant: Singularity Knot (archetypeId: 1)
   * Maps to INPUT category
   */
  static createExtremeInput1(group, color) {
    try {
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      const extremeGroup = this.extremeNodePack.createSingularityKnot(tempNode, null);
      if (!extremeGroup) return group;
      
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 1;
      
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] EXTREME Input1 failed, fallback:', err);
      return this.createInputNode1(group, color);
    }
  }

  /**
   * EXTREME variant: Quantum Lattice (archetypeId: 2)
   * Maps to PROCESS category
   */
  static createExtremeProcess0(group, color) {
    try {
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      const extremeGroup = this.extremeNodePack.createQuantumLattice(tempNode, null);
      if (!extremeGroup) return group;
      
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 2;
      
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] EXTREME Process0 failed, fallback:', err);
      return this.createProcessNode0(group, color);
    }
  }

  /**
   * EXTREME variant: Fractal Bloom (archetypeId: 3)
   * Maps to PROCESS category
   */
  static createExtremeProcess1(group, color) {
    try {
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      const extremeGroup = this.extremeNodePack.createFractalBloom(tempNode, null);
      if (!extremeGroup) return group;
      
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 3;
      
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] EXTREME Process1 failed, fallback:', err);
      return this.createProcessNode1(group, color);
    }
  }

  /**
   * EXTREME variant: Reactive Tesseract (archetypeId: 4)
   * Maps to INTEGRATION category
   */
  static createExtremeIntegration0(group, color) {
    try {
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      const extremeGroup = this.extremeNodePack.createReactiveTesseract(tempNode, null);
      if (!extremeGroup) return group;
      
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 4;
      
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] EXTREME Integration0 failed, fallback:', err);
      return this.createIntegrationNode0(group, color);
    }
  }

  /**
   * EXTREME variant: Chaotic Heart (archetypeId: 5)
   * Maps to INTEGRATION category
   */
  static createExtremeIntegration1(group, color) {
    try {
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      const extremeGroup = this.extremeNodePack.createChaoticHeart(tempNode, null);
      if (!extremeGroup) return group;
      
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 5;
      
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] EXTREME Integration1 failed, fallback:', err);
      return this.createIntegrationNode1(group, color);
    }
  }

  /**
   * EXTREME variant: Whisper Sphere (archetypeId: 6)
   * Maps to STORAGE category
   */
  static createExtremeStorage0(group, color) {
    try {
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      const extremeGroup = this.extremeNodePack.createWhisperSphere(tempNode, null);
      if (!extremeGroup) return group;
      
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 6;
      
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] EXTREME Storage0 failed, fallback:', err);
      return this.createStorageNode0(group, color);
    }
  }

  /**
   * EXTREME variant: Echo Fractal (archetypeId: 7)
   * Maps to STORAGE category
   */
  static createExtremeStorage1(group, color) {
    try {
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      const extremeGroup = this.extremeNodePack.createEchoFractal(tempNode, null);
      if (!extremeGroup) return group;
      
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 7;
      
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] EXTREME Storage1 failed, fallback:', err);
      return this.createStorageNode1(group, color);
    }
  }

  /**
   * EXTREME variant: Abyssal Shard (archetypeId: 8)
   * Maps to ANALYTICS category
   */
  static createExtremeAnalytics0(group, color) {
    try {
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      const extremeGroup = this.extremeNodePack.createAbyssalShard(tempNode, null);
      if (!extremeGroup) return group;
      
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 8;
      
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] EXTREME Analytics0 failed, fallback:', err);
      return this.createAnalyticsNode0(group, color);
    }
  }

  /**
   * EXTREME variant: Tri-Helix (archetypeId: 9)
   * Maps to ANALYTICS category
   */
  static createExtremeAnalytics1(group, color) {
    try {
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      const extremeGroup = this.extremeNodePack.createTriHelix(tempNode, null);
      if (!extremeGroup) return group;
      
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 9;
      
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] EXTREME Analytics1 failed, fallback:', err);
      return this.createAnalyticsNode1(group, color);
    }
  }

  /**
   * EXTREME variant: Infinite Spiral (archetypeId: 10)
   * Maps to CONTROL category
   */
  static createExtremeControl0(group, color) {
    try {
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      const extremeGroup = this.extremeNodePack.createInfiniteSpiral(tempNode, null);
      if (!extremeGroup) return group;
      
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 10;
      
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] EXTREME Control0 failed, fallback:', err);
      return this.createControlNode0(group, color);
    }
  }

  /**
   * EXTREME variant: Chrono Ripper (archetypeId: 11)
   * Maps to CONTROL category
   */
  static createExtremeControl1(group, color) {
    try {
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      const extremeGroup = this.extremeNodePack.createChronoRipper(tempNode, null);
      if (!extremeGroup) return group;
      
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 11;
      
      return group;
    } catch (err) {
      console.warn('[EnhancedNodeModels] EXTREME Control1 failed, fallback:', err);
      return this.createControlNode1(group, color);
    }
  }
}
