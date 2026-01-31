/**
 * PHASE 5: INTER-NETWORK CONNECTION VISUALS v1.0
 * 
 * Visualizes connections between multiple networks with animated corruption/harmony flow
 * 
 * Purpose: Display inter-network relationships visually
 * - Network anchor markers in 3D space
 * - Connection cables with animated flow
 * - Corruption/harmony pulse indicators along connections
 * - Real-time connection strength visualization
 * - Performance-optimized instancing where possible
 * 
 * This is a pure visual consumer — reads multi-network state, renders nothing else
 */

import * as THREE from 'three';

export class PHASE5_InterNetworkConnectionVisuals {
  constructor(scene, multiNetworkManager, config = {}) {
    this.scene = scene;
    this.multiNetworkManager = multiNetworkManager;
    
    this.config = {
      enableDebug: config.enableDebug ?? false,
      enableLogging: config.enableLogging ?? false,
      
      // Network anchor visual properties
      anchorRadius: config.anchorRadius ?? 2.0,
      anchorGlowRadius: config.anchorGlowRadius ?? 3.5,
      anchorOpacity: config.anchorOpacity ?? 0.7,
      
      // Connection cable properties
      cableRadius: config.cableRadius ?? 0.4,
      cableSegments: config.cableSegments ?? 32,
      cableColor: config.cableColor ?? 0x0088ff,      // Base blue
      
      // Flow animation properties
      flowSpeed: config.flowSpeed ?? 2.0,               // units per second
      flowSize: config.flowSize ?? 0.8,                 // Width of flow pulse
      flowIntensity: config.flowIntensity ?? 0.8,      // Brightness multiplier
      
      // Corruption/harmony coloring
      corruptionColor: config.corruptionColor ?? 0xff4444,    // Red-ish
      harmonyColor: config.harmonyColor ?? 0x00ffff,          // Cyan
      
      // Performance settings
      maxConnections: config.maxConnections ?? 20,
      updateFrequency: config.updateFrequency ?? 16,   // ms between visual updates
      
      // Fade settings
      fadeDistance: config.fadeDistance ?? 150,
      fadeStart: config.fadeStart ?? 80
    };
    
    // Visual object groups
    this.networkGroup = new THREE.Group();
    this.networkGroup.name = 'InterNetworkConnections';
    this.scene.add(this.networkGroup);
    
    // Anchor visuals (one per network)
    this.anchorMeshes = new Map();              // networkId → {mesh, glow, light}
    this.anchorPositions = new Map();           // networkId → Vector3
    
    // Connection visuals
    this.connectionLines = new Map();           // connectionId → {line, flow, state}
    this.connectionFlowMaterials = new Map();   // connectionId → ShaderMaterial
    
    // Performance tracking
    this.stats = {
      anchorsRendered: 0,
      connectionsRendered: 0,
      lastUpdateTime: Date.now(),
      updateDuration: 0,
      materialsCreated: 0,
      texturesCreated: 0
    };
    
    // Update timing
    this.lastUpdateTime = Date.now();
    this.accumulatedTime = 0;
    
    // Console API
    this.setupConsoleAPI();
  }
  
  /**
   * Create or update network anchor visuals
   */
  updateAnchor(networkId, position, color = 0x0088ff) {
    try {
      // Check if anchor already exists
      if (this.anchorMeshes.has(networkId)) {
        const anchor = this.anchorMeshes.get(networkId);
        anchor.mesh.position.copy(position);
        anchor.glow.position.copy(position);
        if (anchor.light) {
          anchor.light.position.copy(position);
        }
        this.anchorPositions.set(networkId, position.clone());
        return;
      }
      
      // Create new anchor
      const anchorGroup = new THREE.Group();
      anchorGroup.name = `NetworkAnchor_${networkId}`;
      
      // Main sphere
      const sphereGeom = new THREE.SphereGeometry(this.config.anchorRadius, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5,
        metalness: 0.6,
        roughness: 0.3,
        wireframe: false,
        transparent: true,
        opacity: this.config.anchorOpacity
      });
      const sphere = new THREE.Mesh(sphereGeom, sphereMat);
      sphere.name = `NetworkAnchor_Sphere_${networkId}`;
      anchorGroup.add(sphere);
      
      // Glow effect (larger, pulsing sphere)
      const glowGeom = new THREE.SphereGeometry(this.config.anchorGlowRadius, 16, 16);
      const glowMat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.4,
        side: THREE.BackSide
      });
      const glow = new THREE.Mesh(glowGeom, glowMat);
      glow.name = `NetworkAnchor_Glow_${networkId}`;
      anchorGroup.add(glow);
      
      // Add light
      const light = new THREE.PointLight(color, 1, 50);
      light.intensity = 0.6;
      anchorGroup.add(light);
      
      // Position anchor
      anchorGroup.position.copy(position);
      this.networkGroup.add(anchorGroup);
      
      // Store references
      this.anchorMeshes.set(networkId, {
        mesh: sphere,
        glow: glow,
        light: light,
        group: anchorGroup,
        material: sphereMat,
        glowMaterial: glowMat,
        baseColor: color
      });
      
      this.anchorPositions.set(networkId, position.clone());
      this.stats.anchorsRendered++;
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_InterNetworkConnectionVisuals] Anchor creation error:', err);
      }
    }
  }
  
  /**
   * Create or update connection line visuals
   */
  updateConnection(connection, sourcePosition, targetPosition, sourceCorruption, targetCorruption) {
    try {
      const connectionId = `${connection.sourceNetworkId}_${connection.targetNetworkId}`;
      
      // Remove old connection if exists
      if (this.connectionLines.has(connectionId)) {
        const oldConn = this.connectionLines.get(connectionId);
        this.networkGroup.remove(oldConn.line);
        oldConn.line.geometry.dispose();
        oldConn.line.material.dispose();
        this.connectionLines.delete(connectionId);
        
        const oldMat = this.connectionFlowMaterials.get(connectionId);
        if (oldMat) {
          oldMat.dispose();
          this.connectionFlowMaterials.delete(connectionId);
        }
      }
      
      // Create connection line with TubeGeometry for visual presence
      const curve = new THREE.LineCurve3(sourcePosition, targetPosition);
      const tubeGeom = new THREE.TubeGeometry(curve, 8, this.config.cableRadius, 8, false);
      
      // Determine color based on corruption levels
      const flowColor = this.getFlowColor(sourceCorruption, targetCorruption, connection.strength);
      
      // Create shader material for cable
      const cableMat = new THREE.MeshStandardMaterial({
        color: flowColor,
        emissive: flowColor,
        emissiveIntensity: 0.4,
        metalness: 0.7,
        roughness: 0.2,
        transparent: true,
        opacity: 0.6 * connection.strength
      });
      
      const line = new THREE.Mesh(tubeGeom, cableMat);
      line.name = `Connection_${connectionId}`;
      this.networkGroup.add(line);
      
      // Create flow particle system
      const flowParticles = this.createFlowParticles(
        sourcePosition,
        targetPosition,
        connection.strength,
        flowColor
      );
      this.networkGroup.add(flowParticles);
      
      // Store connection state
      this.connectionLines.set(connectionId, {
        line: line,
        flowParticles: flowParticles,
        sourcePosition: sourcePosition.clone(),
        targetPosition: targetPosition.clone(),
        connection: connection,
        material: cableMat,
        distance: sourcePosition.distanceTo(targetPosition),
        flowOffset: Math.random() * 2 * Math.PI,
        state: {
          corruption: sourceCorruption,
          harmony: 1 - sourceCorruption,
          strength: connection.strength,
          color: flowColor
        }
      });
      
      this.stats.connectionsRendered++;
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_InterNetworkConnectionVisuals] Connection creation error:', err);
      }
    }
  }
  
  /**
   * Create animated flow particles along a connection
   */
  createFlowParticles(source, target, strength, color) {
    const particleCount = Math.ceil(8 * strength);
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    const direction = new THREE.Vector3().subVectors(target, source).normalize();
    const distance = source.distanceTo(target);
    
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const position = new THREE.Vector3().lerpVectors(source, target, t);
      
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      
      // Color particles based on connection color
      const c = new THREE.Color(color);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      
      // Velocity along connection
      velocities[i * 3] = direction.x * this.config.flowSpeed;
      velocities[i * 3 + 1] = direction.y * this.config.flowSpeed;
      velocities[i * 3 + 2] = direction.z * this.config.flowSpeed;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: this.config.flowSize,
      sizeAttenuation: true,
      transparent: true,
      opacity: this.config.flowIntensity,
      vertexColors: true,
      fog: false
    });
    
    const particles = new THREE.Points(geometry, material);
    particles.userData = {
      velocities: velocities,
      distance: distance,
      totalTime: 0
    };
    
    return particles;
  }
  
  /**
   * Determine flow color based on corruption/harmony balance
   */
  getFlowColor(sourceCorruption, targetCorruption, strength) {
    const avgCorruption = (sourceCorruption + targetCorruption) / 2;
    const harmonyLevel = 1 - avgCorruption;
    
    // Interpolate between harmony (cyan) and corruption (red)
    const corruptionColor = new THREE.Color(this.config.corruptionColor);
    const harmonyColor = new THREE.Color(this.config.harmonyColor);
    const flowColor = harmonyColor.lerp(corruptionColor, avgCorruption);
    
    return flowColor.getHex();
  }
  
  /**
   * Update animation frames (called from main loop)
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    const startTime = Date.now();
    
    try {
      this.accumulatedTime += deltaTime;
      
      // Only update visuals at configured frequency
      if (this.accumulatedTime < this.config.updateFrequency) {
        return;
      }
      
      const elapsed = this.accumulatedTime / 1000; // Convert to seconds
      this.accumulatedTime = 0;
      
      // Update anchor pulsing
      this.updateAnchorPulses(elapsed);
      
      // Update flow animation
      this.updateFlowAnimation(elapsed);
      
      // Apply distance-based fade
      this.updateDistanceFade();
      
      this.stats.updateDuration = Date.now() - startTime;
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_InterNetworkConnectionVisuals] Update error:', err);
      }
    }
  }
  
  /**
   * Update anchor pulsing based on network health
   */
  updateAnchorPulses(elapsed) {
    for (const [networkId, anchorData] of this.anchorMeshes.entries()) {
      try {
        const network = this.multiNetworkManager.getNetwork(networkId);
        if (!network) continue;
        
        // Get network corruption level
        const avgCorruption = this.getNetworkAverageCorruption(network);
        
        // Calculate pulse intensity (higher corruption = stronger pulse)
        const pulseIntensity = 0.3 + avgCorruption * 0.4;
        const pulseSpeed = 2 + avgCorruption * 2;
        
        // Apply sinusoidal pulse to glow
        const pulse = Math.sin(elapsed * pulseSpeed) * 0.5 + 0.5;
        anchorData.glowMaterial.opacity = 0.2 + pulse * (0.4 * pulseIntensity);
        anchorData.light.intensity = 0.4 + pulse * (0.4 * pulseIntensity);
        
        // Update color based on corruption
        const networkColor = this.getFlowColor(avgCorruption, 0, 1.0);
        anchorData.material.color.setHex(networkColor);
        anchorData.material.emissive.setHex(networkColor);
        anchorData.glowMaterial.color.setHex(networkColor);
        anchorData.glowMaterial.emissive.setHex(networkColor);
        anchorData.light.color.setHex(networkColor);
        
      } catch (err) {
        if (this.config.enableDebug) {
          console.warn('[PHASE5_InterNetworkConnectionVisuals] Anchor update error:', err);
        }
      }
    }
  }
  
  /**
   * Update flow particle animation along connections
   */
  updateFlowAnimation(elapsed) {
    for (const [connectionId, connData] of this.connectionLines.entries()) {
      try {
        const particles = connData.flowParticles;
        if (!particles) continue;
        
        const positionAttr = particles.geometry.getAttribute('position');
        const positions = positionAttr.array;
        const velocities = particles.userData.velocities;
        const distance = particles.userData.distance;
        
        // Calculate flow speed based on connection state
        const flowSpeed = this.config.flowSpeed * connData.state.strength;
        
        // Update particle positions with wrapping
        for (let i = 0; i < positions.length; i += 3) {
          // Movement along curve
          const particleProgress = (positions[i] + positions[i + 1] + positions[i + 2]) % distance;
          
          // This is simplified — in production you'd use proper curve parameterization
          // For now, increment position and wrap
          const moveAmount = flowSpeed * elapsed;
          
          // Animate based on time offset
          const phaseOffset = (elapsed + connData.flowOffset + i / 3) % 2;
          const t = (phaseOffset * 0.5) % 1.0;
          
          const pos = new THREE.Vector3().lerpVectors(
            connData.sourcePosition,
            connData.targetPosition,
            t
          );
          
          positions[i] = pos.x;
          positions[i + 1] = pos.y;
          positions[i + 2] = pos.z;
        }
        
        positionAttr.needsUpdate = true;
        
      } catch (err) {
        if (this.config.enableDebug) {
          console.warn('[PHASE5_InterNetworkConnectionVisuals] Flow animation error:', err);
        }
      }
    }
  }
  
  /**
   * Update opacity based on distance from camera
   */
  updateDistanceFade() {
    try {
      // This would need access to camera — for now skip if not provided
      const camera = this.scene.getObjectByName('__camera__');
      if (!camera) return;
      
      for (const connData of this.connectionLines.values()) {
        const dist = camera.position.distanceTo(connData.line.position);
        let opacity = 1.0;
        
        if (dist > this.config.fadeStart) {
          opacity = Math.max(0, 1 - (dist - this.config.fadeStart) / 
                            (this.config.fadeDistance - this.config.fadeStart));
        }
        
        connData.material.opacity = 0.6 * connData.state.strength * opacity;
      }
    } catch (err) {
      // Silently fail — camera might not be set up yet
    }
  }
  
  /**
   * Get average corruption level of a network
   */
  getNetworkAverageCorruption(network) {
    try {
      if (!network || !network.aiNodes) return 0;
      
      let totalCorruption = 0;
      let nodeCount = 0;
      
      for (const node of network.aiNodes) {
        if (node && typeof node.corruption === 'number') {
          totalCorruption += node.corruption;
          nodeCount++;
        }
      }
      
      return nodeCount > 0 ? totalCorruption / nodeCount : 0;
      
    } catch (err) {
      return 0;
    }
  }
  
  /**
   * Sync visuals with current multi-network state
   */
  sync(networks, connections) {
    try {
      // Update anchors
      for (const [networkId, networkData] of networks) {
        const position = networkData.position || new THREE.Vector3();
        const color = this.getFlowColor(
          this.getNetworkAverageCorruption(networkData.network),
          0,
          1.0
        );
        this.updateAnchor(networkId, position, color);
      }
      
      // Update connections
      if (connections && connections.length > 0) {
        for (const connection of connections.slice(0, this.config.maxConnections)) {
          const sourceMeta = networks.get(connection.sourceNetworkId);
          const targetMeta = networks.get(connection.targetNetworkId);
          
          if (sourceMeta && targetMeta) {
            const sourcePos = sourceMeta.position || new THREE.Vector3();
            const targetPos = targetMeta.position || new THREE.Vector3();
            
            const sourceNetwork = sourceMeta.network;
            const targetNetwork = targetMeta.network;
            
            const sourceCorruption = this.getNetworkAverageCorruption(sourceNetwork);
            const targetCorruption = this.getNetworkAverageCorruption(targetNetwork);
            
            this.updateConnection(
              connection,
              sourcePos,
              targetPos,
              sourceCorruption,
              targetCorruption
            );
          }
        }
      }
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_InterNetworkConnectionVisuals] Sync error:', err);
      }
    }
  }
  
  /**
   * Get stats for debugging
   */
  getStats() {
    return {
      ...this.stats,
      anchorsActive: this.anchorMeshes.size,
      connectionsActive: this.connectionLines.size,
      totalMemory: this.estimateMemoryUsage()
    };
  }
  
  /**
   * Estimate memory usage
   */
  estimateMemoryUsage() {
    let bytes = 0;
    
    // Anchor meshes
    for (const anchor of this.anchorMeshes.values()) {
      bytes += 1024; // Rough estimate per anchor
    }
    
    // Connection geometries
    for (const conn of this.connectionLines.values()) {
      const geom = conn?.line?.geometry;
      if (!geom || !geom.attributes) continue;
      const attr = geom.attributes;
      for (const key in attr) {
        const array = attr[key]?.array;
        if (!array || array.byteLength === undefined) continue;
        bytes += array.byteLength;
      }
    }
    
    return bytes;
  }
  
  /**
   * Clear all visuals
   */
  clear() {
    try {
      // Clear anchors
      for (const anchor of this.anchorMeshes.values()) {
        anchor.group.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        this.networkGroup.remove(anchor.group);
      }
      this.anchorMeshes.clear();
      this.anchorPositions.clear();
      
      // Clear connections
      for (const conn of this.connectionLines.values()) {
        if (conn.line) {
          if (conn.line.geometry) conn.line.geometry.dispose();
          if (conn.line.material) conn.line.material.dispose();
          this.networkGroup.remove(conn.line);
        }
        if (conn.flowParticles) {
          if (conn.flowParticles.geometry) conn.flowParticles.geometry.dispose();
          if (conn.flowParticles.material) conn.flowParticles.material.dispose();
          this.networkGroup.remove(conn.flowParticles);
        }
      }
      this.connectionLines.clear();
      this.connectionFlowMaterials.clear();
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_InterNetworkConnectionVisuals] Clear error:', err);
      }
    }
  }
  
  /**
   * Setup console API for debugging
   */
  setupConsoleAPI() {
    if (typeof window !== 'undefined') {
      window.PHASE5_InterNetworkConnectionVisuals_API = {
        getStats: () => this.getStats(),
        toggleDebug: () => { this.config.enableDebug = !this.config.enableDebug; },
        clear: () => this.clear(),
        getAnchorCount: () => this.anchorMeshes.size,
        getConnectionCount: () => this.connectionLines.size
      };
    }
  }
}
