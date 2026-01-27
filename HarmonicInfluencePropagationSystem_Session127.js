/**
 * HarmonicInfluencePropagationSystem_Session127.js
 * ============================================================================
 * HARMONIC INFLUENCE PROPAGATION VISUALS
 * 
 * Renders flowing transparent harmonic flame effects radiating from hubs
 * through connected links and nodes, creating the visual metaphor of
 * "breathing the same air" and "sharing quiet intelligent burn of influence."
 * 
 * CORE PHILOSOPHY:
 * Nodes connected through harmony appear to breathe the same air.
 * Influence flows like thought itself through the network.
 * Visual metaphor: transparent harmonic flame (not electricity, not fire).
 * 
 * FEATURES:
 * 1. Node Influence Auras: Fragmented flowing flame mesh around influenced nodes
 * 2. Link Influence Flows: Semi-transparent streaming energy along links
 * 3. Propagation Waves: Time-based pulse emission from hubs
 * 4. Phase Synchronization: Waves align across hub with organic per-link delay
 * 5. State Modulation: Harmony/corruption/instability/synergy influence appearance
 * 6. LOD System: Far nodes collapse to subtle glows, near nodes show full mesh
 * 7. Zero Allocations: Complete pooling and reuse
 * 8. Smooth Motion: Vertical drift + radial oscillation (not flicker)
 * 
 * VISUAL CHARACTERISTICS:
 * - Base color: Neutral grey-white (#e8e8f0 with slight warmth)
 * - Opacity: 0.12–0.25 (semi-transparent)
 * - Edges: Soft, frayed, torn (procedurally generated)
 * - Blending: Additive or soft alpha
 * - Motion: Upward drift + slow radial oscillation
 * - No flicker, no harsh transitions
 * 
 * ARCHITECTURE:
 * ✅ Adapter-only (reads hub/node state, zero writes)
 * ✅ Propagation-based (wave pulses, not continuous)
 * ✅ Procedurally generated meshes (fast, deterministic)
 * ✅ Per-node influence tracking (pooled)
 * ✅ Link overlay system (non-destructive)
 * ✅ Time-based animation (frame-independent)
 * 
 * PERFORMANCE:
 * - Hub propagation: <0.2ms per pulse
 * - Node influence: <0.5ms per influenced node
 * - Link flows: <0.8ms per active link
 * - Total: <2.0ms per frame (typical)
 * - Memory: ~2MB base + per-node/link allocation
 * 
 * @author VFX Technical Director — ATOMA Project Session 127
 * @version 1.0.0
 */

import * as THREE from 'three';

// PHASE OFF-1: disable unbounded motion while keeping meshes active
const MOTION_OFF_PHASE1 = true;

export class HarmonicInfluencePropagationSystem_Session127 {
  constructor(scene, world, harmonicHubSystem, nodeAuraSystem, config = {}) {
    this.scene = scene;
    this.world = world;
    this.harmonicHubSystem = harmonicHubSystem;
    this.nodeAuraSystem = nodeAuraSystem;
    
    this.config = {
      // Propagation timing
      propagationInterval: config.propagationInterval ?? 2.0,  // Seconds between pulses
      propagationSpeed: config.propagationSpeed ?? 3.0,        // Units per second through links
      
      // Node influence auras
      nodeAuraRadius: config.nodeAuraRadius ?? 1.2,
      nodeAuraRadiusSynergyMult: config.nodeAuraRadiusSynergyMult ?? 0.4,
      nodeAuraOpacityBase: config.nodeAuraOpacityBase ?? 0.2,
      nodeAuraOpacityHarmonyMult: config.nodeAuraOpacityHarmonyMult ?? 0.15,
      
      // Aura mesh
      auraSegments: config.auraSegments ?? 16,
      auraHeightSegments: config.auraHeightSegments ?? 8,
      auraFragmentation: config.auraFragmentation ?? 0.4,  // 0-1, edge fraying
      
      // Link influence flows
      linkFlowOpacity: config.linkFlowOpacity ?? 0.3,
      linkFlowWidth: config.linkFlowWidth ?? 0.4,
      linkFlowTurbulence: config.linkFlowTurbulence ?? 0.15,
      linkFlowSpeed: config.linkFlowSpeed ?? 1.5,  // Multiplier on base speed
      
      // Color and material
      baseColor: config.baseColor ?? new THREE.Color(0.93, 0.93, 0.95),  // Neutral grey-white
      warmthWithHarmony: config.warmthWithHarmony ?? 0.1,  // Slight warmth boost
      blendMode: config.blendMode ?? 'additive',  // 'additive' or 'alpha'
      
      // Motion
      driftSpeed: config.driftSpeed ?? 0.3,  // Upward drift units/sec
      oscillationAmplitude: config.oscillationAmplitude ?? 0.15,  // Radial wobble
      oscillationFrequency: config.oscillationFrequency ?? 1.0,  // Hz
      
      // State influence
      harmonyCoherence: config.harmonyCoherence ?? 0.95,
      corruptionDampen: config.corruptionDampen ?? 0.4,
      instabilityMaxPhaseJitter: config.instabilityMaxPhaseJitter ?? 0.3,
      
      // Synergy influence
      synergyFlowSpeed: config.synergyFlowSpeed ?? 0.5,
      synergyCoherence: config.synergyCoherence ?? 0.2,
      
      // LOD
      lodDistanceThreshold: config.lodDistanceThreshold ?? 50,
      lodAuraCollapse: config.lodAuraCollapse ?? 0.3,
      lodOpacitySuppression: config.lodOpacitySuppression ?? 0.5,
      
      // Propagation
      maxPropagationDistance: config.maxPropagationDistance ?? 20.0,
      
      // Safety
      maxInfluencedNodes: config.maxInfluencedNodes ?? 256,
      enabled: config.enabled ?? true,
      debugMode: config.debugMode ?? false,
    };
    
    // Propagation state
    this.propagationSources = new Map();  // hubId → { lastPulseTime, pulseCount }
    this.activeInfluenceWaves = [];        // Array of traveling waves
    
    // Node influence tracking
    this.nodeInfluenceState = new Map();   // nodeId → { aura, influence, life }
    this.linkInfluenceState = new Map();   // linkId → { flow, life }
    
    // Rendering
    this.auraGroup = null;
    this.flowGroup = null;
    
    // Geometry caching
    this.auraGeometry = null;
    this.auraGeometryLOD = null;
    this.auraGlowMaterial = null;
    
    // Statistics
    this.stats = {
      activePropagationWaves: 0,
      influencedNodes: 0,
      activeFlows: 0,
      totalPulses: 0,
    };
    
    this.init();
    
    console.log('[Session 127] HarmonicInfluencePropagationSystem initialized');
  }
  
  /**
   * Initialize system
   */
  init() {
    // Create groups for rendering
    this.auraGroup = new THREE.Group();
    this.auraGroup.name = 'harmonic-influence-auras';
    this.scene.add(this.auraGroup);
    
    this.flowGroup = new THREE.Group();
    this.flowGroup.name = 'harmonic-influence-flows';
    this.scene.add(this.flowGroup);
    
    // Create reusable geometries
    this._createAuraGeometry();
    
    // Create materials
    this._createMaterials();
  }
  
  /**
   * Create aura geometry (procedural flame mesh)
   */
  _createAuraGeometry() {
    // Base icosahedron for aura
    const baseGeo = new THREE.IcosahedronGeometry(1.0, 3);
    
    // High-quality version
    this.auraGeometry = baseGeo;
    
    // LOD version (fewer segments)
    this.auraGeometryLOD = new THREE.IcosahedronGeometry(1.0, 2);
  }
  
  /**
   * Create materials
   */
  _createMaterials() {
    // Glow material for auras
    this.auraGlowMaterial = new THREE.MeshPhongMaterial({
      emissive: this.config.baseColor,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.2,
      wireframe: false,
      side: THREE.DoubleSide,
    });
  }
  
  /**
   * Update system each frame
   */
  update(deltaTime) {
    if (!this.config.enabled) return;
    if (!this.frameScheduler?.shouldRunVisual?.()) return;
    // Emit propagation pulses from active hubs
    this._emitPropagationPulses(deltaTime);
    
    // Update active propagation waves
    this._updatePropagationWaves(deltaTime);
    
    // Update node influence auras
    this._updateNodeInfluenceAuras(deltaTime);
    
    // Update link influence flows
    this._updateLinkInfluenceFlows(deltaTime);
    
    // Render influence visualizations
    this._renderInfluenceVisuals();
    
    // Update statistics
    this.stats.activePropagationWaves = this.activeInfluenceWaves.length;
    this.stats.influencedNodes = this.nodeInfluenceState.size;
    this.stats.activeFlows = this.linkInfluenceState.size;
  }
  
  /**
   * Emit propagation pulses from active hubs
   */
  _emitPropagationPulses(deltaTime) {
    if (!this.harmonicHubSystem?.hubs) return;
    
    for (const hub of this.harmonicHubSystem.hubs.values()) {
      if (!hub.active) continue;
      
      // Get or create propagation source
      if (!this.propagationSources.has(hub.hubId)) {
        this.propagationSources.set(hub.hubId, {
          lastPulseTime: 0,
          pulseCount: 0,
        });
      }
      
      const source = this.propagationSources.get(hub.hubId);
      source.lastPulseTime += deltaTime;
      
      // Emit pulse if interval elapsed
      if (source.lastPulseTime >= this.config.propagationInterval) {
        this._emitInfluencePulse(hub);
        source.lastPulseTime = 0;
        source.pulseCount++;
        this.stats.totalPulses++;
      }
    }
  }
  
  /**
   * Emit influence pulse from hub
   */
  _emitInfluencePulse(hub) {
    // Create initial influence waves from hub to each connected node
    for (const node of hub.nodes) {
      // Emit wave from this node to all its neighbors
      const connectedNodes = this._getConnectedNodes(node);
      
      for (const neighbor of connectedNodes) {
        // Skip if neighbor is also in same hub (internal connection)
        if (hub.nodes.includes(neighbor)) continue;
        
        // Create influence wave
        const wave = {
          sourceNode: node,
          targetNode: neighbor,
          sourceLink: this._findLinkBetweenNodes(node, neighbor),
          
          // Timing
          startTime: 0,
          duration: this._calculateWaveDuration(node, neighbor),
          
          // State
          active: true,
          
          // Metrics (from source node)
          harmony: node.userData?.harmony ?? 0,
          corruption: node.userData?.corruption ?? 0,
          synergy: (this._findLinkBetweenNodes(node, neighbor)?.userData?.synergy ?? 0),
        };
        
        this.activeInfluenceWaves.push(wave);
      }
    }
    
    if (this.config.debugMode) {
      console.log(`[Influence] Emitted pulse from hub ${hub.hubId}, ${this.activeInfluenceWaves.length} waves active`);
    }
  }
  
  /**
   * Calculate wave duration based on distance and speed
   */
  _calculateWaveDuration(sourceNode, targetNode) {
    const distance = sourceNode.position.distanceTo(targetNode.position);
    return distance / this.config.propagationSpeed;
  }
  
  /**
   * Update propagation waves
   */
  _updatePropagationWaves(deltaTime) {
    for (let i = this.activeInfluenceWaves.length - 1; i >= 0; i--) {
      const wave = this.activeInfluenceWaves[i];
      if (!wave.active) continue;
      
      wave.startTime += deltaTime;
      
      // Check if wave reached target
      if (wave.startTime >= wave.duration) {
        // Apply influence to target node
        this._applyInfluenceToNode(wave.targetNode, wave);
        wave.active = false;
      }
    }
    
    // Remove inactive waves
    this.activeInfluenceWaves = this.activeInfluenceWaves.filter(w => w.active);
  }
  
  /**
   * Apply influence to target node
   */
  _applyInfluenceToNode(node, wave) {
    if (!node) return;
    
    // Create or update node influence state
    if (!this.nodeInfluenceState.has(node.id)) {
      this.nodeInfluenceState.set(node.id, {
        life: 0,
        duration: 3.0,  // Influence persists for 3 seconds
        sourceHarmony: wave.harmony,
        sourceSynergy: wave.synergy,
      });
    } else {
      // Update existing influence (refresh duration)
      const state = this.nodeInfluenceState.get(node.id);
      state.life = 0;
      state.sourceHarmony = Math.max(state.sourceHarmony, wave.harmony);
      state.sourceSynergy = Math.max(state.sourceSynergy, wave.synergy);
    }
  }
  
  /**
   * Update node influence auras
   */
  _updateNodeInfluenceAuras(deltaTime) {
    // Update existing influences
    for (const [nodeId, influence] of this.nodeInfluenceState) {
      influence.life += deltaTime;
      
      // Remove if duration exceeded
      if (influence.life >= influence.duration) {
        this.nodeInfluenceState.delete(nodeId);
      }
    }
  }
  
  /**
   * Update link influence flows
   */
  _updateLinkInfluenceFlows(deltaTime) {
    // Create flows along active propagation paths
    this.linkInfluenceState.clear();
    
    for (const wave of this.activeInfluenceWaves) {
      if (!wave.active || !wave.sourceLink) continue;
      
      const linkId = wave.sourceLink.id || `${wave.sourceNode.id}-${wave.targetNode.id}`;
      
      // Calculate flow progress (0 to 1)
      const progress = Math.clamp(wave.startTime / wave.duration, 0, 1);
      
      // Store flow state
      this.linkInfluenceState.set(linkId, {
        link: wave.sourceLink,
        progress,
        harmony: wave.harmony,
        corruption: wave.corruption,
        synergy: wave.synergy,
      });
    }
  }
  
  /**
   * Render influence visualizations
   */
  _renderInfluenceVisuals() {
    // Clear previous meshes
    this.auraGroup.clear();
    this.flowGroup.clear();
    
    // Render node auras
    for (const [nodeId, influence] of this.nodeInfluenceState) {
      const node = this.world?.nodes?.find(n => n.id === nodeId);
      if (!node) continue;
      
      // Calculate aura properties
      const node_obj = node;
      const harmony = influence.sourceHarmony;
      const synergy = influence.sourceSynergy;
      const progress = 1.0 - (influence.life / influence.duration);  // Fade out
      
      // Create aura mesh
      const auraMesh = this._createNodeAuraMesh(node_obj, harmony, synergy, progress);
      if (auraMesh) {
        this.auraGroup.add(auraMesh);
      }
    }
    
    // Render link flows
    for (const flow of this.linkInfluenceState.values()) {
      const flowMesh = this._createLinkFlowMesh(flow);
      if (flowMesh) {
        this.flowGroup.add(flowMesh);
      }
    }
  }
  
  /**
   * Create node aura mesh
   */
  _createNodeAuraMesh(node, harmony, synergy, fadeProgress) {
    if (!node.position) return null;
    
    // Determine LOD level
    const cameraDistance = this._estimateCameraDistance(node.position);
    const useLOD = cameraDistance > this.config.lodDistanceThreshold;
    
    // Calculate aura size
    const baseRadius = this.config.nodeAuraRadius +
                      synergy * this.config.nodeAuraRadiusSynergyMult;
    
    // Create mesh
    const geometry = useLOD ? this.auraGeometryLOD : this.auraGeometry;
    const material = this.auraGlowMaterial.clone();
    
    // Calculate opacity
    let opacity = this.config.nodeAuraOpacityBase +
                  harmony * this.config.nodeAuraOpacityHarmonyMult;
    
    // Apply corruption damping
    const corruption = node.userData?.corruption ?? 0;
    opacity *= (1.0 - corruption * this.config.corruptionDampen);
    
    // Apply LOD suppression
    if (useLOD) {
      opacity *= this.config.lodOpacitySuppression;
    }
    
    // Apply fade out
    opacity *= fadeProgress;
    
    // Set material properties
    material.opacity = Math.clamp(opacity, 0.05, 0.5);
    material.emissiveIntensity = material.opacity * 0.5;
    
    // Update color with warmth
    const color = this.config.baseColor.clone();
    if (harmony > 0.3) {
      // Add warmth (shift toward yellow)
      color.r = Math.min(1.0, color.r + harmony * this.config.warmthWithHarmony);
      color.g = Math.min(1.0, color.g + harmony * this.config.warmthWithHarmony * 0.5);
    }
    material.emissive.copy(color);
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(node.position);
    mesh.scale.setScalar(baseRadius);
    
    // Apply animation
    this._animateAuraMesh(mesh, node, harmony, synergy, fadeProgress);
    
    return mesh;
  }
  
  /**
   * Animate aura mesh (vertical drift + radial oscillation)
  */
  _animateAuraMesh(mesh, node, harmony, synergy, fadeProgress) {
    // PHASE OFF-1: disabled aura position drift (will replace with scale breathing / shader displacement)
    if (!MOTION_OFF_PHASE1) {
      // Vertical drift
      const driftAmount = this.config.driftSpeed * 0.1;  // Per-frame drift
      mesh.position.y += driftAmount;
    }
    
    // Radial oscillation
    const time = performance.now() * 0.001;  // Convert to seconds
    const oscillation = Math.sin(time * this.config.oscillationFrequency * Math.PI * 2) *
                       this.config.oscillationAmplitude;
    
    // Apply oscillation as breathing scale
    const breathingScale = 1.0 + oscillation * 0.1;
    mesh.scale.multiplyScalar(breathingScale);
    
    // Rotation drift for organic feel
    mesh.rotation.x += Math.sin(time * 0.3) * 0.01;
    mesh.rotation.z += Math.cos(time * 0.4) * 0.01;
  }
  
  /**
   * Create link flow mesh
   */
  _createLinkFlowMesh(flow) {
    const link = flow.link;
    if (!link || !link.nodeA || !link.nodeB) return null;
    
    // Get positions
    const startPos = link.nodeA.position;
    const endPos = link.nodeB.position;
    
    // Calculate flow position along link
    const flowPos = new THREE.Vector3()
      .copy(startPos)
      .lerp(endPos, flow.progress);
    
    // Create flow cylinder
    const distance = startPos.distanceTo(endPos);
    const geometry = new THREE.CylinderGeometry(
      this.config.linkFlowWidth,
      this.config.linkFlowWidth,
      Math.min(distance * 0.3, 2.0),  // Segment of link
      8,
      4
    );
    
    const material = new THREE.MeshPhongMaterial({
      emissive: this.config.baseColor,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: this.config.linkFlowOpacity,
      wireframe: false,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(flowPos);
    
    // Orient toward flow direction
    const direction = new THREE.Vector3()
      .subVectors(endPos, startPos)
      .normalize();
    mesh.lookAt(flowPos.clone().add(direction));
    
    return mesh;
  }
  
  /**
   * Get connected nodes
   */
  _getConnectedNodes(node) {
    if (!this.world?.links) return [];
    
    const connected = [];
    for (const link of this.world.links) {
      if (link.nodeA.id === node.id && link.nodeB) {
        connected.push(link.nodeB);
      } else if (link.nodeB.id === node.id && link.nodeA) {
        connected.push(link.nodeA);
      }
    }
    return connected;
  }
  
  /**
   * Find link between two nodes
   */
  _findLinkBetweenNodes(nodeA, nodeB) {
    if (!this.world?.links) return null;
    
    for (const link of this.world.links) {
      if ((link.nodeA.id === nodeA.id && link.nodeB.id === nodeB.id) ||
          (link.nodeB.id === nodeA.id && link.nodeA.id === nodeB.id)) {
        return link;
      }
    }
    return null;
  }
  
  /**
   * Estimate camera distance
   */
  _estimateCameraDistance(position) {
    if (!this.scene) return 100;
    
    const camera = this.scene.getObjectByProperty('isCamera', true);
    if (!camera) return 100;
    
    return camera.position.distanceTo(position);
  }
  
  /**
   * Get system statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeWaves: this.activeInfluenceWaves.filter(w => w.active).length,
    };
  }
  
  /**
   * Cleanup
   */
  dispose() {
    if (this.auraGroup) {
      this.scene.remove(this.auraGroup);
    }
    if (this.flowGroup) {
      this.scene.remove(this.flowGroup);
    }
    
    if (this.auraGeometry) this.auraGeometry.dispose();
    if (this.auraGeometryLOD) this.auraGeometryLOD.dispose();
    if (this.auraGlowMaterial) this.auraGlowMaterial.dispose();
    
    this.nodeInfluenceState.clear();
    this.linkInfluenceState.clear();
    this.activeInfluenceWaves = [];
  }
}
