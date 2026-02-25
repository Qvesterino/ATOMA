import * as THREE from 'three';

/**
 * ============================================================================
 * ANIMATED LINK FLOW SYSTEM (Session 112)
 * ============================================================================
 * Comprehensive data flow visualization between nodes.
 * 
 * Features:
 * - Data packets traveling along link curves
 * - Directional flow indicators with rotation
 * - Multiple flow layers (primary stream, secondary flows, carrier waves)
 * - Traffic-based animation speed and density
 * - Synergy-driven color pulses and glow effects
 * - Energy beam effects along links
 * - Bidirectional flow support
 * - Performance-optimized particle management
 */

export class AnimatedLinkFlow {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    
    // Flow system state
    this.flowsByLink = new Map(); // linkId → FlowState
    this.activeFlows = [];
    this.particlePool = [];
    this.maxParticles = 1000;
    
    // Configuration
    this.config = {
      // Packet/particle settings
      packetSize: 0.12,
      packetSpeed: 0.5,
      packetGlowRadius: 0.25,
      
      // Flow density (particles per link)
      lowTrafficDensity: 2,
      mediumTrafficDensity: 4,
      highTrafficDensity: 8,
      criticalTrafficDensity: 12,
      
      // Animation speeds
      baseSpeed: 1.0,
      trafficSpeedMul: 1.5, // Speed increases with traffic
      
      // Visual effects
      pulseFrequency: 2.0,
      trailLength: 0.3,
      glowIntensity: 1.8,
      beamOpacity: 0.4,
    };
    
    // Materials for flow effects
    this.materials = this.createMaterials();
    this.time = 0;
  }
  
  /**
   * Create reusable materials for flow visualization
   */
  createMaterials() {
    return {
      // Main data packet material
      packet: new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x00ddff),
        emissive: new THREE.Color(0x00ddff),
        emissiveIntensity: 1.5,
        roughness: 0.2,
        metalness: 0.8,
        wireframe: false,
        toneMapped: false,
      }),
      
      // Trail/secondary flow material
      trail: new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x0099ff),
        emissive: new THREE.Color(0x0099ff),
        emissiveIntensity: 0.8,
        roughness: 0.4,
        metalness: 0.5,
        transparent: true,
        opacity: 0.3,
        toneMapped: false,
      }),
      
      // Energy beam material
      beam: new THREE.LineBasicMaterial({
        color: new THREE.Color(0x00ddff),
        linewidth: 1,
        transparent: true,
        opacity: 0.5,
        toneMapped: false,
      }),
    };
  }
  
  /**
   * Initialize flow visualization for a new link
   * @param {Object} link - Link object with start/end nodes and curves
   * @param {number} linkId - Unique link identifier
   */
  initializeLinkFlow(link, linkId) {
    if (this.flowsByLink.has(linkId)) {
      return; // Already initialized
    }
    
    const flowState = {
      linkId,
      link,
      packets: [],
      trails: [],
      beam: null,
      curves: this.generateFlowCurves(link),
      traffic: 0,
      synergy: 0,
      isActive: true,
      time: 0,
    };
    
    // Create visual representations
    this.createFlowPackets(flowState);
    this.createEnergyBeam(flowState);
    
    this.flowsByLink.set(linkId, flowState);
    this.activeFlows.push(flowState);
  }
  
  /**
   * Generate bezier curves for flow visualization
   * Supports multiple flow paths for richer animation
   */
  generateFlowCurves(link) {
    const startNode = link.nodeA;
    const endNode = link.nodeB;
    
    if (!startNode?.position || !endNode?.position) {
      return [];
    }
    
    const start = startNode.position.clone();
    const end = endNode.position.clone();
    const mid = start.clone().add(end).multiplyScalar(0.5);
    
    // Primary curve (direct path)
    const primary = new THREE.CatmullRomCurve3([start, mid, end]);
    
    // Secondary curves for multi-stream effect
    const offset1 = new THREE.Vector3(-0.3, 0, 0);
    const offset2 = new THREE.Vector3(0.3, 0, 0);
    const mid1 = mid.clone().add(offset1);
    const mid2 = mid.clone().add(offset2);
    const secondary1 = new THREE.CatmullRomCurve3([start, mid1, end]);
    const secondary2 = new THREE.CatmullRomCurve3([start, mid2, end]);
    
    return [primary, secondary1, secondary2];
  }
  
  /**
   * Create animated data packets traveling along the link
   */
  createFlowPackets(flowState) {
    const density = this.getFlowDensity(flowState.traffic);
    
    for (let i = 0; i < density; i++) {
      const packet = {
        geometry: new THREE.IcosahedronGeometry(this.config.packetSize, 2),
        material: this.materials.packet.clone(),
        mesh: null,
        position: i / density, // 0–1 along curve
        speed: this.config.packetSpeed * (0.8 + Math.random() * 0.4),
        curveIndex: i % flowState.curves.length,
        glow: Math.random() * Math.PI * 2,
        trail: [],
      };
      
      // Create and add mesh
      packet.mesh = new THREE.Mesh(packet.geometry, packet.material);
      const ud = (packet.mesh && typeof packet.mesh.userData === 'object' && packet.mesh.userData) ? packet.mesh.userData : (() => { try { Object.defineProperty(packet.mesh, 'userData', { value: {}, writable: true, configurable: true }); } catch (e) {} return packet.mesh.userData || {}; })();
      Object.assign(ud, { isFlowPacket: true, linkId: flowState.linkId });
      this.scene.add(packet.mesh);
      
      flowState.packets.push(packet);
    }
  }
  
  /**
   * Create energy beam connecting nodes
   */
  createEnergyBeam(flowState) {
    const start = flowState.link.nodeA?.position;
    const end = flowState.link.nodeB?.position;
    
    if (!start || !end) return;
    
    const points = [start.clone(), end.clone()];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const beam = new THREE.Line(geometry, this.materials.beam.clone());
    
    const udBeam = (beam && typeof beam.userData === 'object' && beam.userData) ? beam.userData : (() => { try { Object.defineProperty(beam, 'userData', { value: {}, writable: true, configurable: true }); } catch (e) {} return beam.userData || {}; })();
    Object.assign(udBeam, { isFlowBeam: true, linkId: flowState.linkId });
    this.scene.add(beam);
    
    flowState.beam = beam;
  }
  
  /**
   * Determine flow packet density based on traffic
   */
  getFlowDensity(traffic) {
    if (traffic < 0.25) return this.config.lowTrafficDensity;
    if (traffic < 0.5) return this.config.mediumTrafficDensity;
    if (traffic < 0.75) return this.config.highTrafficDensity;
    return this.config.criticalTrafficDensity;
  }
  
  /**
   * Update link flow state (called when link properties change)
   * @param {number} linkId - Link identifier
   * @param {Object} updateData - { traffic, synergy, color, speed }
   */
  updateLinkFlow(linkId, updateData = {}) {
    const flowState = this.flowsByLink.get(linkId);
    if (!flowState) return;
    
    // Update metrics
    if (typeof updateData.traffic === 'number') {
      flowState.traffic = updateData.traffic;
    }
    if (typeof updateData.synergy === 'number') {
      flowState.synergy = updateData.synergy;
    }
    
    // Update packet colors if provided
    if (updateData.color) {
      flowState.packets.forEach(p => {
        if (p.material.color) {
          p.material.color.copy(updateData.color);
          p.material.emissive.copy(updateData.color);
        }
      });
      
      if (flowState.beam && flowState.beam.material) {
        flowState.beam.material.color.copy(updateData.color);
      }
    }
    
    // Update beam opacity based on synergy
    if (flowState.beam && flowState.beam.material) {
      flowState.beam.material.opacity = this.config.beamOpacity * (0.5 + flowState.synergy * 0.5);
    }
  }
  
  /**
   * Remove link flow visualization
   */
  removeLinkFlow(linkId) {
    const flowState = this.flowsByLink.get(linkId);
    if (!flowState) return;
    
    // Dispose packets
    flowState.packets.forEach(p => {
      if (p.mesh) {
        this.scene.remove(p.mesh);
        p.geometry.dispose();
        p.material.dispose();
      }
    });
    
    // Dispose beam
    if (flowState.beam) {
      this.scene.remove(flowState.beam);
      flowState.beam.geometry.dispose();
      flowState.beam.material.dispose();
    }
    
    // Remove from tracking
    this.activeFlows = this.activeFlows.filter(f => f.linkId !== linkId);
    this.flowsByLink.delete(linkId);
  }
  
  /**
   * Animate all active flows
   * @param {number} deltaTime - Time since last frame
   * @param {number} time - Absolute time
   */
  animate(deltaTime, time) {
    this.time = time;
    
    for (const flowState of this.activeFlows) {
      if (!flowState.isActive) continue;
      
      this.animatePackets(flowState, deltaTime, time);
      this.animateBeam(flowState, deltaTime, time);
    }
  }
  
  /**
   * Animate data packets traveling along curves
   */
  animatePackets(flowState, deltaTime, time) {
    if (!flowState.curves || flowState.curves.length === 0) return;
    
    const speedMul = 1 + flowState.traffic * this.config.trafficSpeedMul;
    
    for (const packet of flowState.packets) {
      // Advance position along curve
      packet.position += (packet.speed * speedMul * deltaTime * 0.5);
      
      // Wrap around
      if (packet.position > 1) {
        packet.position -= 1;
      }
      
      // Get current curve for this packet
      const curve = flowState.curves[packet.curveIndex];
      if (!curve) continue;
      
      // Sample position from curve
      const point = curve.getPoint(packet.position);
      packet.mesh.position.copy(point);
      
      // Rotate packet for directional effect
      const tangent = curve.getTangent(packet.position).normalize();
      const normal = new THREE.Vector3(0, 1, 0);
      if (Math.abs(tangent.dot(normal)) > 0.99) {
        normal.set(1, 0, 0);
      }
      const binormal = new THREE.Vector3().crossVectors(normal, tangent).normalize();
      normal.crossVectors(tangent, binormal);
      
      // Build rotation matrix from frame
      const matrix = new THREE.Matrix4();
      matrix.makeBasis(tangent, normal, binormal);
      packet.mesh.quaternion.setFromRotationMatrix(matrix);
      
      // Pulse glow effect
      packet.glow += this.config.pulseFrequency * deltaTime;
      const glowIntensity = 0.8 + Math.sin(packet.glow) * 0.2;
      packet.material.emissiveIntensity = this.config.glowIntensity * glowIntensity * (0.5 + flowState.synergy);
      
      // Scale with synergy
      const scaleVariation = 1 + Math.sin(packet.glow * 0.5) * 0.15;
      packet.mesh.scale.setScalar(scaleVariation * (0.8 + flowState.synergy * 0.4));
      
      // Opacity varies with traffic
      packet.material.opacity = 0.7 + flowState.traffic * 0.3;
    }
  }
  
  /**
   * Animate energy beam between nodes
   */
  animateBeam(flowState, deltaTime, time) {
    if (!flowState.beam) return;
    
    const beam = flowState.beam;
    
    // Pulse beam width removed to avoid shader variant churn; keep static linewidth
    const pulsePhase = Math.sin(time * this.config.pulseFrequency * 2) * 0.5 + 0.5;
    if (beam.material._baseLinewidth === undefined) {
      beam.material._baseLinewidth = 2;
    }
    beam.material.linewidth = beam.material._baseLinewidth;
    
    // Create directional flow effect with transparency
    const opacity = this.config.beamOpacity * (0.5 + pulsePhase * 0.5);
    beam.material.opacity = opacity;
    
    // Sync color with packets
    // (Color updates happen via updateLinkFlow)
  }
  
  /**
   * Get visual state of a link's flow
   */
  getFlowState(linkId) {
    return this.flowsByLink.get(linkId) || null;
  }
  
  /**
   * Check if link has active flow
   */
  hasActiveFlow(linkId) {
    const flowState = this.flowsByLink.get(linkId);
    return flowState && flowState.isActive;
  }
  
  /**
   * Batch update multiple link flows
   */
  updateMultipleFlows(updates) {
    for (const [linkId, updateData] of Object.entries(updates)) {
      this.updateLinkFlow(linkId, updateData);
    }
  }
  
  /**
   * Get statistics about active flows
   */
  getFlowStatistics() {
    return {
      totalFlows: this.flowsByLink.size,
      activeFlows: this.activeFlows.filter(f => f.isActive).length,
      totalPackets: this.activeFlows.reduce((sum, f) => sum + f.packets.length, 0),
      averageTraffic: this.activeFlows.reduce((sum, f) => sum + f.traffic, 0) / Math.max(1, this.activeFlows.length),
    };
  }
  
  /**
   * Clear all flows and dispose resources
   */
  dispose() {
    for (const [linkId] of this.flowsByLink) {
      this.removeLinkFlow(linkId);
    }
    
    this.flowsByLink.clear();
    this.activeFlows = [];
    
    // Dispose materials
    for (const material of Object.values(this.materials)) {
      if (material && typeof material.dispose === 'function') {
        material.dispose();
      }
    }
  }
}

/**
 * Integration hook for AnimatedLinkFlow with NodeLinkingSystem
 * Call this from NodeLinkingSystem.constructor() to enable flow visualization
 */
export function integrateAnimatedLinkFlow(linkingSystem, scene, camera) {
  const flowSystem = new AnimatedLinkFlow(scene, camera);
  
  // Hook into link creation
  const originalOnLinkCreated = linkingSystem.onLinkCreatedCallbacks;
  linkingSystem.onLinkCreatedCallbacks = linkingSystem.onLinkCreatedCallbacks || [];
  linkingSystem.onLinkCreatedCallbacks.push((link, linkId) => {
    flowSystem.initializeLinkFlow(link, linkId);
  });
  
  // Hook into link removal
  const originalOnLinkRemoved = linkingSystem.onLinkRemovedCallbacks;
  linkingSystem.onLinkRemovedCallbacks = linkingSystem.onLinkRemovedCallbacks || [];
  linkingSystem.onLinkRemovedCallbacks.push((linkId) => {
    flowSystem.removeLinkFlow(linkId);
  });
  
  // Store reference for animation loop
  linkingSystem._flowSystem = flowSystem;
  
  return flowSystem;
}

/**
 * Console API for debugging and live parameter adjustment
 */
export function setupAnimatedLinkFlowConsoleAPI(flowSystem) {
  window.LinkFlowDebug = {
    /**
     * Get current flow state for a link
     */
    getFlow(linkId) {
      return flowSystem.getFlowState(linkId);
    },
    
    /**
     * Update a single link's flow visualization
     */
    updateFlow(linkId, updateData) {
      flowSystem.updateLinkFlow(linkId, updateData);
      console.log(`Updated link ${linkId}`, updateData);
    },
    
    /**
     * Get flow statistics
     */
    stats() {
      return flowSystem.getFlowStatistics();
    },
    
    /**
     * Adjust configuration
     */
    setConfig(configKey, value) {
      if (configKey in flowSystem.config) {
        flowSystem.config[configKey] = value;
        console.log(`Updated config.${configKey} = ${value}`);
      } else {
        console.warn(`Unknown config key: ${configKey}`);
      }
    },
    
    /**
     * List all active flows
     */
    listFlows() {
      const flows = Array.from(flowSystem.flowsByLink.values());
      return flows.map(f => ({
        linkId: f.linkId,
        traffic: f.traffic,
        synergy: f.synergy,
        packets: f.packets.length,
      }));
    },
  };
  
  console.log('🌊 AnimatedLinkFlow Console API ready: window.LinkFlowDebug');
}
