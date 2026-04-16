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
    this.semanticBus = null;
    this._semanticBusAttached = null;
    this._semanticLinkCreatedHandler = null;
    
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
    this._packetPoint = new THREE.Vector3();
    this._packetTangent = new THREE.Vector3();
    this._packetNormal = new THREE.Vector3();
    this._packetBinormal = new THREE.Vector3();
    this._packetMatrix = new THREE.Matrix4();
    this.packetGeometry = new THREE.IcosahedronGeometry(0.14, 2);
    this.maxPacketInstances = this.config.criticalTrafficDensity;
  }

  init({ linkingSystem = null, semanticBus = null } = {}) {
    if (linkingSystem) {
      this.linkingSystem = linkingSystem;
    }
    if (semanticBus) {
      this.semanticBus = semanticBus;
    }
    this._bindSemanticBus();
    return this;
  }

  rebind({ linkingSystem = null, semanticBus = null } = {}) {
    if (linkingSystem) {
      this.linkingSystem = linkingSystem;
    }
    if (semanticBus && semanticBus !== this.semanticBus) {
      this._unbindSemanticBus();
      this.semanticBus = semanticBus;
    }
    this._bindSemanticBus();
    return this;
  }

  _unbindSemanticBus() {
    if (!this._semanticLinkCreatedHandler || !this._semanticBusAttached) return;
    const bus = this._semanticBusAttached;
    if (bus?.unsubscribe) {
      bus.unsubscribe('link.created', this._semanticLinkCreatedHandler);
    } else if (bus?.off) {
      bus.off('link.created', this._semanticLinkCreatedHandler);
    }
    this._semanticBusAttached = null;
    this._semanticLinkCreatedHandler = null;
  }

  _bindSemanticBus() {
    const semanticBus = this.semanticBus || this.linkingSystem?.semanticBus || globalThis?.semanticBus || null;
    if (!semanticBus?.on) return;
    if (this._semanticLinkCreatedHandler && this._semanticBusAttached === semanticBus) return;

    this._unbindSemanticBus();
    this.semanticBus = semanticBus;
    this._semanticBusAttached = semanticBus;

    const resolveLinkFromPayload = (payload = {}) => {
      const links = Array.isArray(this.linkingSystem?.links) ? this.linkingSystem.links : [];
      if (payload.linkId !== null && payload.linkId !== undefined) {
        const byId = links.find((link) => (link?.id ?? link?.userData?.id) === payload.linkId);
        if (byId) return byId;
      }

      const source = payload.source ?? null;
      const target = payload.target ?? null;
      if (!source || !target) return null;

      return links.find((link) => {
        const linkSource = link?.source || link?.nodeA || null;
        const linkTarget = link?.target || link?.nodeB || null;
        return linkSource === source && linkTarget === target;
      }) || null;
    };

    this._semanticLinkCreatedHandler = (event = {}) => {
      const payload = {
        source: event.source ?? null,
        target: event.target ?? null,
        linkId: event.linkId ?? event.id ?? null
      };
      const link = resolveLinkFromPayload(payload);
      if (!link) return;
      this.initializeLinkFlow(link, payload.linkId ?? link?.id ?? link?.userData?.id ?? null);
    };

    semanticBus.on('link.created', this._semanticLinkCreatedHandler);
  }
  
  /**
   * Create reusable materials for flow visualization
   */
  createMaterials() {
    const packetMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x00ddff) }
      },
      vertexShader: `
        attribute vec3 instanceColor;
        attribute float instanceGlow;
        varying vec3 vColor;
        varying float vGlow;
        varying vec2 vUv;

        void main() {
          vColor = instanceColor;
          vGlow = instanceGlow;
          vUv = uv;
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vColor;
        varying float vGlow;
        varying vec2 vUv;

        void main() {
          float dist = length(vUv - vec2(0.5));
          float alpha = smoothstep(0.5, 0.18, dist);
          float pulse = 0.6 + 0.4 * sin(uTime * 4.0 + vGlow);
          vec3 color = vColor * pulse;
          gl_FragColor = vec4(color, alpha * 0.85);
          if (gl_FragColor.a < 0.02) discard;
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      vertexColors: true,
      toneMapped: false,
    });

    return {
      // Main data packet material (instanced)
      packet: packetMaterial,
      
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
    const maxInstances = this.maxPacketInstances;
    const packetMesh = new THREE.InstancedMesh(this.packetGeometry, this.materials.packet, maxInstances);
    packetMesh.name = `FlowPacketInstancedMesh_${flowState.linkId}`;
    packetMesh.count = density;
    packetMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const colorArray = new Float32Array(maxInstances * 3);
    const glowArray = new Float32Array(maxInstances);
    const instanceColorAttr = new THREE.InstancedBufferAttribute(colorArray, 3);
    const instanceGlowAttr = new THREE.InstancedBufferAttribute(glowArray, 1);
    packetMesh.instanceColor = instanceColorAttr;
    packetMesh.geometry.setAttribute('instanceGlow', instanceGlowAttr);

    for (let i = 0; i < density; i++) {
      const packet = {
        instanceId: i,
        position: i / density,
        speed: this.config.packetSpeed * (0.8 + Math.random() * 0.4),
        curveIndex: i % flowState.curves.length,
        glow: Math.random() * Math.PI * 2,
        color: new THREE.Color(0x00ddff),
        trail: []
      };

      packetMesh.setColorAt(i, packet.color);
      packetMesh.geometry.attributes.instanceGlow.setX(i, packet.glow);
      flowState.packets.push(packet);
      this._updatePacketInstanceTransform(packetMesh, packet, flowState.curves[packet.curveIndex].getPoint(packet.position, this._packetPoint));
    }

    packetMesh.instanceColor.needsUpdate = true;
    packetMesh.geometry.attributes.instanceGlow.needsUpdate = true;
    packetMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(packetMesh);

    flowState.packetMesh = packetMesh;
    flowState.packetCount = density;
  }

  _updatePacketInstanceTransform(packetMesh, packet, currentPoint) {
    const scaleVariation = 0.22 + Math.sin(packet.glow * 0.5) * 0.05;
    this._packetMatrix.compose(
      currentPoint,
      new THREE.Quaternion(),
      new THREE.Vector3(scaleVariation, scaleVariation, scaleVariation)
    );
    packetMesh.setMatrixAt(packet.instanceId, this._packetMatrix);
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
      const color = updateData.color;
      const packetMesh = flowState.packetMesh;
      if (packetMesh && packetMesh.setColorAt) {
        flowState.packets.forEach((packet) => {
          packet.color.copy(color);
          packetMesh.setColorAt(packet.instanceId, packet.color);
        });
        packetMesh.instanceColor.needsUpdate = true;
      }
      
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
    
    // Dispose packet mesh
    if (flowState.packetMesh) {
      this.scene.remove(flowState.packetMesh);
      flowState.packetMesh.geometry.dispose();
      flowState.packetMesh.material.dispose();
    }
    
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
   * Fallback removal by link reference (handles id mismatches).
   */
  removeLinkFlowByLink(link) {
    if (!link) return;
    for (const [id, state] of this.flowsByLink.entries()) {
      if (state.link === link) {
        this.removeLinkFlow(id);
        return;
      }
    }
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
      const point = curve.getPoint(packet.position, this._packetPoint);
      packet.glow += this.config.pulseFrequency * deltaTime;
      const scaleVariation = 0.22 + Math.sin(packet.glow * 0.5) * 0.05 + flowState.synergy * 0.04;
      const packetMesh = flowState.packetMesh;
      if (packetMesh) {
        this._packetMatrix.compose(
          point,
          new THREE.Quaternion(),
          new THREE.Vector3(scaleVariation, scaleVariation, scaleVariation)
        );
        packetMesh.setMatrixAt(packet.instanceId, this._packetMatrix);
        packetMesh.geometry.attributes.instanceGlow.setX(packet.instanceId, packet.glow);
      }
    }

    const packetMesh = flowState.packetMesh;
    if (packetMesh) {
      packetMesh.instanceMatrix.needsUpdate = true;
      packetMesh.geometry.attributes.instanceGlow.needsUpdate = true;
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
    this._unbindSemanticBus();
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
    this.semanticBus = null;
  }
}

/**
 * Integration hook for AnimatedLinkFlow with NodeLinkingSystem
 * Call this from NodeLinkingSystem.constructor() to enable flow visualization
 */
export function integrateAnimatedLinkFlow(linkingSystem, scene, camera) {
  const flowSystem = new AnimatedLinkFlow(scene, camera);
  
  // Hook into link creation
  if (typeof linkingSystem.onLinkCreated === 'function') {
    linkingSystem.onLinkCreated((source, target, link) => {
      const resolvedLink = link || source || target;
      flowSystem.initializeLinkFlow(resolvedLink, resolvedLink?.id ?? null);
    }, {
      layerKey: 'LINK_BEAD_TRAILS'
    });
  }
  
  // Hook into link removal
  if (typeof linkingSystem.onLinkRemoved === 'function') {
    linkingSystem.onLinkRemoved((source, target, link) => {
      flowSystem.removeLinkFlow(link?.id ?? source?.id ?? target?.id ?? null);
    });
  }
  flowSystem.init({
    linkingSystem,
    semanticBus: linkingSystem?.semanticBus || globalThis?.semanticBus || null
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
