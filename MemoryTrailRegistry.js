/**
 * MEMORY TRAIL REGISTRY
 * 
 * Central external state management for all memory trails.
 * ZERO gameplay impact - purely visual state tracking.
 * 
 * SAFETY RULES:
 * - Only stores VFX state, never gameplay data
 * - Never modifies Node, Link, or Player classes
 * - All data is read-only from game systems perspective
 * - Independent lifecycle management
 */

export class MemoryTrailRegistry {
  constructor() {
    // Node trails - one per active node
    this.nodeTrails = new Map(); // [nodeId] → { segments: [...], lastPos, color, intensity, age }
    
    // Link trails - one per active link
    this.linkTrails = new Map(); // [linkId] → { pathPoints: [...], glowHistory: [...], age }
    
    // Player trail - single persistent trail
    this.playerTrail = {
      positions: [],           // Last 30-50 positions
      maxLength: 50,
      intensity: 0,            // 0-1 based on movement speed
      age: 0,
      color: { r: 0.0, g: 1.0, b: 1.0 }, // Cyan neon
      meshes: [],              // Trail segment meshes
      particles: []            // Trail particles
    };
    
    // World event imprints - temporary visual echoes
    this.eventImprints = [];   // { position, type, intensity, age, maxAge }
    
    // Configuration
    this.config = {
      // Node trail settings
      nodeTrailMaxSegments: 20,
      nodeTrailFadeDuration: 3.0,     // seconds
      nodeTrailMaxPerNode: 8,          // max trail segments per node
      
      // Link trail settings
      linkTrailFadeDuration: 2.0,
      linkTrailMaxPerLink: 15,
      linkTrailSparkDensity: 0.3,      // sparks per pulse
      
      // Player trail settings
      playerTrailFadeDuration: 0.8,
      playerTrailSegmentDistance: 0.15, // Distance between trail segments
      playerTrailMaxSegments: 50,
      
      // Event imprint settings
      eventImprintFadeDuration: 1.5,
      eventImprintMaxCount: 10,
      
      // Performance limits
      maxTotalTrailObjects: 200,
      maxParticles: 1000,
      
      // LOD settings
      lodDistanceThreshold: 100,
      lodReduceSegmentCount: true,
      lodReduceColorIntensity: true
    };
    
    // Cleanup tracking
    this.lastCleanupTime = 0;
    this.cleanupInterval = 1.0; // seconds
    
    // Stats for monitoring
    this.stats = {
      activeNodeTrails: 0,
      activeLinkTrails: 0,
      playerTrailSegments: 0,
      totalParticles: 0,
      totalMeshes: 0
    };
  }
  
  /**
   * Register a new node trail
   */
  registerNodeTrail(nodeId, position, color = { r: 0.0, g: 1.0, b: 1.0 }) {
    if (!this.nodeTrails.has(nodeId)) {
      this.nodeTrails.set(nodeId, {
        segments: [],           // Array of { position, age, intensity }
        lastPos: position.clone ? position.clone() : { x: position.x, y: position.y, z: position.z },
        color: color,
        intensity: 1.0,
        age: 0,
        meshes: [],
        isActive: true
      });
    }
  }
  
  /**
   * Add a segment to node trail
   */
  addNodeTrailSegment(nodeId, position, intensity = 1.0) {
    const trail = this.nodeTrails.get(nodeId);
    if (!trail) return;
    
    // Convert position if needed
    const pos = position.clone ? position.clone() : { x: position.x, y: position.y, z: position.z };
    
    trail.segments.push({
      position: pos,
      age: 0,
      maxAge: this.config.nodeTrailFadeDuration,
      intensity: intensity,
      initialIntensity: intensity
    });
    
    // Enforce max segments
    if (trail.segments.length > this.config.nodeTrailMaxPerNode) {
      trail.segments.shift();
    }
    
    trail.lastPos = pos;
  }
  
  /**
   * Register a new link trail
   */
  registerLinkTrail(linkId, startPos, endPos) {
    if (!this.linkTrails.has(linkId)) {
      this.linkTrails.set(linkId, {
        pathPoints: [],
        glowHistory: [],
        startPos: startPos.clone ? startPos.clone() : { x: startPos.x, y: startPos.y, z: startPos.z },
        endPos: endPos.clone ? endPos.clone() : { x: endPos.x, y: endPos.y, z: endPos.z },
        age: 0,
        maxAge: this.config.linkTrailFadeDuration,
        intensity: 1.0,
        meshes: [],
        particles: [],
        isActive: true
      });
    }
  }
  
  /**
   * Add glow snapshot to link trail
   */
  addLinkTrailGlowSnapshot(linkId, glowIntensity) {
    const trail = this.linkTrails.get(linkId);
    if (!trail) return;
    
    trail.glowHistory.push({
      intensity: glowIntensity,
      age: 0,
      maxAge: this.config.linkTrailFadeDuration
    });
    
    // Enforce max history
    if (trail.glowHistory.length > this.config.linkTrailMaxPerLink) {
      trail.glowHistory.shift();
    }
  }
  
  /**
   * Add position to player trail
   */
  addPlayerTrailPosition(position, movementSpeed = 0) {
    const pos = position.clone ? position.clone() : { x: position.x, y: position.y, z: position.z };
    
    this.playerTrail.positions.push({
      position: pos,
      age: 0,
      maxAge: this.config.playerTrailFadeDuration,
      speed: movementSpeed,
      initialSpeed: movementSpeed
    });
    
    // Enforce max length
    if (this.playerTrail.positions.length > this.config.playerTrailMaxSegments) {
      this.playerTrail.positions.shift();
    }
    
    // Update intensity based on speed
    this.playerTrail.intensity = Math.min(1.0, movementSpeed / 25); // Normalize to 60 units/sec
  }
  
  /**
   * Add world event imprint
   */
  addEventImprint(position, type = 'GENERIC', intensity = 1.0) {
    if (this.eventImprints.length >= this.config.eventImprintMaxCount) {
      this.eventImprints.shift();
    }
    
    this.eventImprints.push({
      position: position.clone ? position.clone() : { x: position.x, y: position.y, z: position.z },
      type: type, // COSMIC_PULSE, SIGMA_INVASION, QUANTUM_STORM, etc.
      intensity: intensity,
      age: 0,
      maxAge: this.config.eventImprintFadeDuration,
      meshes: [],
      particles: []
    });
  }
  
  /**
   * Update all trails (age and lifecycle)
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunSimulation?.()) return;
    // Update node trails
    for (const [nodeId, trail] of this.nodeTrails.entries()) {
      trail.age += deltaTime;
      
      // Age all segments
      for (let i = 0; i < trail.segments.length; i++) {
        trail.segments[i].age += deltaTime;
      }
      
      // Remove expired segments
      trail.segments = trail.segments.filter(seg => seg.age < seg.maxAge);
      
      // Mark for removal if empty and old
      if (trail.segments.length === 0 && trail.age > 0.5) {
        trail.isActive = false;
      }
    }
    
    // Update link trails
    for (const [linkId, trail] of this.linkTrails.entries()) {
      trail.age += deltaTime;
      
      // Age glow history
      for (let i = 0; i < trail.glowHistory.length; i++) {
        trail.glowHistory[i].age += deltaTime;
      }
      
      // Remove expired glow entries
      trail.glowHistory = trail.glowHistory.filter(glow => glow.age < glow.maxAge);
      
      // Mark for removal if expired
      if (trail.age >= trail.maxAge && trail.glowHistory.length === 0) {
        trail.isActive = false;
      }
    }
    
    // Update player trail
    for (let i = 0; i < this.playerTrail.positions.length; i++) {
      this.playerTrail.positions[i].age += deltaTime;
    }
    this.playerTrail.positions = this.playerTrail.positions.filter(
      pos => pos.age < pos.maxAge
    );
    
    // Update event imprints
    for (let i = 0; i < this.eventImprints.length; i++) {
      this.eventImprints[i].age += deltaTime;
    }
    this.eventImprints = this.eventImprints.filter(
      imp => imp.age < imp.maxAge
    );
    
    // Periodic cleanup
    this.lastCleanupTime += deltaTime;
    if (this.lastCleanupTime >= this.cleanupInterval) {
      this.cleanup();
      this.lastCleanupTime = 0;
    }
    
    this.updateStats();
  }
  
  /**
   * Remove inactive trails and clean up
   */
  cleanup() {
    // Remove inactive node trails
    for (const [nodeId, trail] of this.nodeTrails.entries()) {
      if (!trail.isActive) {
        this.nodeTrails.delete(nodeId);
      }
    }
    
    // Remove inactive link trails
    for (const [linkId, trail] of this.linkTrails.entries()) {
      if (!trail.isActive) {
        this.linkTrails.delete(linkId);
      }
    }
  }
  
  /**
   * Clear all trails for node (when node is deleted)
   */
  clearNodeTrails(nodeId) {
    this.nodeTrails.delete(nodeId);
  }
  
  /**
   * Clear all trails for link (when link is deleted)
   */
  clearLinkTrails(linkId) {
    this.linkTrails.delete(linkId);
  }
  
  /**
   * Clear all trails for entire world reset
   */
  clearAllTrails() {
    this.nodeTrails.clear();
    this.linkTrails.clear();
    this.playerTrail.positions = [];
    this.eventImprints = [];
  }
  
  /**
   * Get trail by node ID
   */
  getNodeTrail(nodeId) {
    return this.nodeTrails.get(nodeId);
  }
  
  /**
   * Get trail by link ID
   */
  getLinkTrail(linkId) {
    return this.linkTrails.get(linkId);
  }
  
  /**
   * Get player trail
   */
  getPlayerTrail() {
    return this.playerTrail;
  }
  
  /**
   * Get event imprints
   */
  getEventImprints() {
    return this.eventImprints;
  }
  
  /**
   * Update statistics
   */
  updateStats() {
    let totalMeshes = 0;
    let totalParticles = 0;
    
    // Count node trail objects
    for (const trail of this.nodeTrails.values()) {
      totalMeshes += trail.meshes ? trail.meshes.length : 0;
    }
    
    // Count link trail objects
    for (const trail of this.linkTrails.values()) {
      totalMeshes += trail.meshes ? trail.meshes.length : 0;
      totalParticles += trail.particles ? trail.particles.length : 0;
    }
    
    // Count player trail
    totalMeshes += this.playerTrail.meshes ? this.playerTrail.meshes.length : 0;
    totalParticles += this.playerTrail.particles ? this.playerTrail.particles.length : 0;
    
    // Count event imprints
    for (const imprint of this.eventImprints) {
      totalMeshes += imprint.meshes ? imprint.meshes.length : 0;
      totalParticles += imprint.particles ? imprint.particles.length : 0;
    }
    
    this.stats = {
      activeNodeTrails: this.nodeTrails.size,
      activeLinkTrails: this.linkTrails.size,
      playerTrailSegments: this.playerTrail.positions.length,
      totalParticles: totalParticles,
      totalMeshes: totalMeshes
    };
  }
  
  /**
   * Get current stats
   */
  getStats() {
    return { ...this.stats };
  }
  
  /**
   * Enforce LOD - reduce quality if needed
   */
  enforceLOD(cameraBudget = 'HIGH') {
    if (cameraBudget === 'LOW') {
      // Reduce segment counts
      for (const trail of this.nodeTrails.values()) {
        if (trail.segments.length > 5) {
          trail.segments = trail.segments.slice(-5);
        }
      }
      
      // Reduce player trail
      if (this.playerTrail.positions.length > 20) {
        const step = Math.floor(this.playerTrail.positions.length / 20);
        this.playerTrail.positions = this.playerTrail.positions.filter((_, i) => i % step === 0);
      }
    } else if (cameraBudget === 'MEDIUM') {
      // Moderate reduction
      for (const trail of this.nodeTrails.values()) {
        if (trail.segments.length > 12) {
          trail.segments = trail.segments.slice(-12);
        }
      }
    }
    // HIGH - no reduction
  }
}
