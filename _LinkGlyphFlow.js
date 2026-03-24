/**
 * LINK GLYPH FLOW 1.0 - SAFE EDITION
 * 
 * Visual-only communication packet system for AI-language flow along links.
 * Glyph packets travel from source → target node, representing data/meaning transmission.
 * 
 * STRICT SAFETY RULES:
 * - NO modifications to NodeLinkingSystem.js, AINodes.js, or gameplay
 * - NO modifications to physics, collisions, or link creation logic
 * - Only visual elements added (MeshBasicMaterial, simple geometries)
 * - CPU budget: < 0.5ms for 100 links
 * - Auto-cleanup on link removal and world transitions
 * 
 * FEATURES:
 * - 7 procedural glyph packet shapes (circle, triangle, lotus, hex, shard, diamond, ring)
 * - Packets travel along link curves (parametric interpolation)
 * - Color derived from source node semantic state + meaning
 * - Quantity based on link strength (1-3 packets per link)
 * - Smooth motion with rotation and micro-jitter
 * - Automatic respawning when reaching destination
 */

import * as THREE from 'three';

export class LinkGlyphFlow {
  constructor(scene, linkingSystem, semanticGlyphAI) {
    this.scene = scene;
    this.linkingSystem = linkingSystem;
    this.semanticGlyphAI = semanticGlyphAI;
    
    // Master container for all packets
    this.containerGroup = new THREE.Group();
    this.containerGroup.userData.isLinkGlyphFlow = true;
    this.containerGroup.name = 'LinkGlyphFlow_Packets';
    this.scene.add(this.containerGroup);
    
    // Packet registry: linkId → [packets]
    this.packetRegistry = new Map();
    
    // Active packets for animation
    this.activePackets = [];
    
    // Geometry and material pools (reusable)
    this.geometryPools = {
      circles: [],
      triangles: [],
      lotuses: [],
      hexagons: [],
      shards: [],
      diamonds: [],
      rings: []
    };
    
    this.materialPool = [];
    
    // Glyph packet shapes (same as Glyph Speech)
    this.glyphShapes = {
      circle: 'circle',
      triangle: 'triangle',
      lotus: 'lotus',
      hex: 'hex',
      shard: 'shard',
      diamond: 'diamond',
      ring: 'ring'
    };
    
    // Semantic state to glyph mapping
    this.semanticToGlyph = {
      consciousness: { shapes: ['diamond', 'circle'], color: 0x00CCFF },
      stability: { shapes: ['hex', 'shard'], color: 0xFF3333 },
      synergy: { shapes: ['triangle', 'circle'], color: 0x0099FF },
      corruption: { shapes: ['shard', 'shard'], color: 0x330033 },
      harmony: { shapes: ['lotus', 'ring'], color: 0xFFD700 },
      // Fallback
      default: { shapes: ['circle', 'triangle'], color: 0x00FFFF }
    };
    
    // Statistics
    this.stats = {
      totalPackets: 0,
      activePackets: 0,
      frameTime: 0
    };
    
    // Enabled flag
    this.enabled = true;
    
    // Initialize geometry pools
    this.initializeGeometryPools();
    
    console.log('✓ Link Glyph Flow 1.0 initialized');
  }
  
  /**
   * Initialize pooled geometries for packet shapes
   */
  initializeGeometryPools() {
    // Circle-dot (small sphere)
    for (let i = 0; i < 40; i++) {
      this.geometryPools.circles.push(new THREE.SphereGeometry(0.06, 8, 8));
    }
    
    // Triangle (tetrahedron)
    for (let i = 0; i < 30; i++) {
      this.geometryPools.triangles.push(new THREE.TetrahedronGeometry(0.07, 0));
    }
    
    // Lotus (cone - represents petal)
    for (let i = 0; i < 25; i++) {
      this.geometryPools.lotuses.push(new THREE.ConeGeometry(0.06, 0.12, 4));
    }
    
    // Hex fragment (small octahedron rotated)
    for (let i = 0; i < 30; i++) {
      this.geometryPools.hexagons.push(new THREE.OctahedronGeometry(0.06, 0));
    }
    
    // Shard (plane-based)
    for (let i = 0; i < 35; i++) {
      this.geometryPools.shards.push(new THREE.PlaneGeometry(0.08, 0.05));
    }
    
    // Diamond (icosahedron)
    for (let i = 0; i < 25; i++) {
      this.geometryPools.diamonds.push(new THREE.IcosahedronGeometry(0.05, 0));
    }
    
    // Ring segment (torus)
    for (let i = 0; i < 20; i++) {
      this.geometryPools.rings.push(new THREE.TorusGeometry(0.08, 0.01, 8, 8));
    }
  }
  
  /**
   * Update all active packets (call every frame from main.js animate)
   */
  update(deltaTime) {
    if (!this.enabled || !this.linkingSystem?.links) return;
    if (this.frameScheduler && !this.frameScheduler.shouldRunVisual?.()) return;
    
    const startTime = performance.now();
    
    // Refresh packets for current links
    this.refreshPacketsForLinks(this.linkingSystem.links);
    
    // Animate all active packets
    this.activePackets = this.activePackets.filter(packet => {
      if (!packet || !packet.mesh || !packet.mesh.parent) {
        // Packet was removed, dispose it
        this.disposePacket(packet);
        return false;
      }
      
      this.animatePacket(packet, deltaTime);
      return true;
    });
    
    this.stats.frameTime = performance.now() - startTime;
    this.stats.activePackets = this.activePackets.length;
  }
  
  /**
   * Create or update packets for all active links
   */
  refreshPacketsForLinks(links) {
    // Get all current link IDs
    const currentLinkIds = new Set();
    
    links.forEach((link, index) => {
      if (!link.active) return;
      
      // Generate unique link ID
      const linkId = this.getLinkId(link);
      currentLinkIds.add(linkId);
      
      // Check if we need to create packets for this link
      if (!this.packetRegistry.has(linkId)) {
        this.createPacketsForLink(link, linkId);
      }
    });
    
    // Clean up packets for removed links
    const removedLinkIds = [];
    for (const linkId of this.packetRegistry.keys()) {
      if (!currentLinkIds.has(linkId)) {
        removedLinkIds.push(linkId);
      }
    }
    
    removedLinkIds.forEach(linkId => {
      this.removePacketsForLink(linkId);
    });
  }
  
  /**
   * Generate unique ID for a link (based on source/target nodes)
   */
  getLinkId(link) {
    const sourceId = link.source.userData.nodeId || link.source.uuid || 'unknown';
    const targetId = link.target.userData.nodeId || link.target.uuid || 'unknown';
    return `${sourceId}_to_${targetId}`;
  }
  
  /**
   * Create packets for a link based on strength
   */
  createPacketsForLink(link, linkId) {
    // Determine packet count based on link strength
    const synergy = this.calculateSynergy(link);
    const traffic = link.traffic?.load || 0.5;
    
    // Strong links get more packets
    let packetCount = 1;
    if (traffic > 0.6 || synergy > 0.7) packetCount = 2;
    if (traffic > 0.8 || synergy > 0.85) packetCount = 3;
    
    // Get semantic state of source node
    const sourceNodeId = link.source.userData.nodeId || 'unknown';
    const semanticState = this.semanticGlyphAI?.semanticState?.get(sourceNodeId);
    const meaningType = semanticState?.state || 'default';
    
    const glyphConfig = this.semanticToGlyph[meaningType] || this.semanticToGlyph.default;
    
    const packets = [];
    
    for (let i = 0; i < packetCount; i++) {
      // Select glyph shape (rotate through available shapes)
      const shapeIndex = i % glyphConfig.shapes.length;
      const shapeName = glyphConfig.shapes[shapeIndex];
      
      // Create packet
      const packet = this.createGlyphPacket(
        link,
        shapeName,
        glyphConfig.color,
        i / packetCount  // Initial offset
      );
      
      if (packet) {
        packets.push(packet);
        this.activePackets.push(packet);
      }
    }
    
    this.packetRegistry.set(linkId, packets);
    this.stats.totalPackets += packets.length;
  }
  
  /**
   * Create individual glyph packet
   */
  createGlyphPacket(link, shapeName, baseColor, initialProgress) {
    // Get or create geometry
    const geometry = this.getPooledGeometry(shapeName);
    if (!geometry) return null;
    
    // Create material (additive, glowing)
    const material = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.7,
      emissive: baseColor,
      emissiveIntensity: 0.4,
      fog: false,
      toneMapped: false
    });
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = {
      isGlyphPacket: true,
      shapeName: shapeName
    };
    
    // Add to scene
    this.containerGroup.add(mesh);
    
    // Create packet data
    const packet = {
      mesh: mesh,
      link: link,
      geometry: geometry,
      material: material,
      shapeName: shapeName,
      progress: initialProgress,
      speed: 0.3 + Math.random() * 0.2,  // Varied speed (0.3-0.5 units/sec)
      rotation: {
        x: Math.random() * Math.PI * 2,
        y: Math.random() * Math.PI * 2,
        z: Math.random() * Math.PI * 2,
        speedX: (Math.random() - 0.5) * 3,
        speedY: (Math.random() - 0.5) * 3,
        speedZ: (Math.random() - 0.5) * 3
      },
      jitterPhase: Math.random() * Math.PI * 2,
      pulsePhase: 0,
      baseColor: baseColor
    };
    
    return packet;
  }
  
  /**
   * Get pooled geometry or create new one
   */
  getPooledGeometry(shapeName) {
    const pool = this.geometryPools[shapeName];
    if (!pool || pool.length === 0) {
      console.warn(`No pooled geometry for shape: ${shapeName}`);
      return null;
    }
    return pool.pop();
  }
  
  /**
   * Return geometry to pool
   */
  returnGeometryToPool(shapeName, geometry) {
    if (this.geometryPools[shapeName]) {
      this.geometryPools[shapeName].push(geometry);
    }
  }
  
  /**
   * Animate individual packet along link
   */
  animatePacket(packet, deltaTime) {
    if (!packet.link || !packet.link.group) return;
    
    // Update progress (travels from 0 to 1)
    packet.progress += (packet.speed * deltaTime);
    
    // Respawn if reached end
    if (packet.progress >= 1.0) {
      packet.progress = 0;
    }
    
    // Calculate position along link curve
    const linkStartPos = packet.link.source.position.clone();
    const linkEndPos = packet.link.target.position.clone();
    
    // Smooth interpolation (use bezier if available, else linear)
    const position = new THREE.Vector3();
    position.lerpVectors(linkStartPos, linkEndPos, packet.progress);
    
    // Add micro-jitter based on stability
    const jitterAmount = 0.02 * Math.sin(packet.jitterPhase + Date.now() * 0.001);
    position.x += jitterAmount;
    position.y += jitterAmount * 0.5;
    
    packet.mesh.position.copy(position);
    
    // Update rotation (continuous spin)
    packet.mesh.rotation.x += packet.rotation.speedX * deltaTime;
    packet.mesh.rotation.y += packet.rotation.speedY * deltaTime;
    packet.mesh.rotation.z += packet.rotation.speedZ * deltaTime;
    
    // Update scale (subtle pulse)
    packet.pulsePhase += 3 * deltaTime;
    const pulseFactor = 1.0 + Math.sin(packet.pulsePhase) * 0.05;
    packet.mesh.scale.setScalar(pulseFactor);
    
    // Update opacity (fade near start and end)
    const fadeFactor = Math.sin(packet.progress * Math.PI);
    packet.material.opacity = 0.7 * fadeFactor;
  }
  
  /**
   * Remove packets for a link
   */
  removePacketsForLink(linkId) {
    const packets = this.packetRegistry.get(linkId);
    if (!packets) return;
    
    packets.forEach(packet => {
      this.disposePacket(packet);
    });
    
    this.packetRegistry.delete(linkId);
  }
  
  /**
   * Dispose individual packet
   */
  disposePacket(packet) {
    if (!packet) return;
    
    // Remove from scene
    if (packet.mesh && packet.mesh.parent) {
      packet.mesh.parent.remove(packet.mesh);
    }
    
    // Return geometry to pool
    if (packet.geometry && packet.shapeName) {
      this.returnGeometryToPool(packet.shapeName, packet.geometry);
    }
    
    // Dispose material
    if (packet.material) {
      packet.material.dispose();
    }
  }
  
  /**
   * Calculate synergy between two nodes
   */
  calculateSynergy(link) {
    const sourceCategory = link.source.userData.category;
    const targetCategory = link.target.userData.category;
    
    // Strong pairs
    const strongPairs = [
      ['input', 'process'],
      ['process', 'integration'],
      ['integration', 'storage'],
      ['storage', 'control'],
      ['analytics', 'control']
    ];
    
    const isStrongPair = strongPairs.some(pair => 
      (sourceCategory === pair[0] && targetCategory === pair[1]) ||
      (sourceCategory === pair[1] && targetCategory === pair[0])
    );
    
    return isStrongPair ? 0.8 : 0.5;
  }
  
  /**
   * Remove all packets (cleanup on world transition)
   */
  cleanupAll() {
    // Dispose all active packets
    this.activePackets.forEach(packet => {
      this.disposePacket(packet);
    });
    this.activePackets = [];
    
    // Clear packet registry
    this.packetRegistry.clear();
    
    // Clear geometry pools
    Object.values(this.geometryPools).forEach(pool => {
      pool.forEach(geo => geo.dispose());
      pool.length = 0;
    });
    
    // Re-initialize pools for next use
    this.initializeGeometryPools();
    
    this.stats.totalPackets = 0;
    this.stats.activePackets = 0;
    
    console.log('✓ Link Glyph Flow cleaned up');
  }
  
  /**
   * Remove container from scene
   */
  cleanup() {
    this.cleanupAll();
    
    if (this.containerGroup.parent) {
      this.containerGroup.parent.remove(this.containerGroup);
    }
    
    console.log('✓ Link Glyph Flow disposed');
  }
  
  /**
   * Enable/disable packet flow
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    this.containerGroup.visible = enabled;
  }
  
  /**
   * Debug function - get statistics
   */
  debugCount() {
    console.group('Link Glyph Flow 1.0 Status');
    console.log('Active Packets:', this.stats.activePackets);
    console.log('Total Created:', this.stats.totalPackets);
    console.log('Frame Time (ms):', this.stats.frameTime.toFixed(3));
    console.log('Registry Size:', this.packetRegistry.size);
    console.log('Enabled:', this.enabled);
    console.groupEnd();
  }
  
  /**
   * Force refresh all packets
   */
  forceRefresh() {
    console.log('🔄 Forcing Link Glyph Flow refresh...');
    
    // Clear all current packets
    this.cleanupAll();
    
    // Trigger refresh on next update
    console.log('✓ Link Glyph Flow refreshed');
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      registrySize: this.packetRegistry.size,
      enabled: this.enabled
    };
  }
}