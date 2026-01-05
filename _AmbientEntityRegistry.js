/**
 * AMBIENT ENTITY REGISTRY
 * 
 * Central registry for all ambient holographic VFX entities.
 * 
 * SAFETY: Pure data structure, ZERO gameplay interaction
 * - No physics, no collisions, no engine modifications
 * - Read-only from gameplay systems
 * - All entities are VFX-only
 */

export class AmbientEntityRegistry {
  constructor() {
    this.entities = {}; // id -> entity data
    this.entityIdCounter = 0;
    
    // Entity types
    this.TYPES = {
      GHOST_ORB: 'GHOST_ORB',
      AI_SPECTRE: 'AI_SPECTRE',
      FRAGMENT_SWARM: 'FRAGMENT_SWARM',
      SIGMA_PHANTOM: 'SIGMA_PHANTOM',
      QUANTUM_WISP: 'QUANTUM_WISP'
    };
    
    // Statistics
    this.stats = {
      totalSpawned: 0,
      totalDespawned: 0,
      currentCount: 0
    };
  }
  
  /**
   * Create a new ambient entity
   */
  createEntity(type, position, options = {}) {
    const id = `ambient_${this.entityIdCounter++}`;
    
    const entity = {
      id,
      type,
      position: { ...position },
      velocity: options.velocity || { x: 0, y: 0, z: 0 },
      lifetime: options.lifetime || 30,
      maxLifetime: options.lifetime || 30,
      intensity: options.intensity || 1.0,
      age: 0,
      vfxContainer: null,
      userData: options.userData || {},
      isActive: true
    };
    
    this.entities[id] = entity;
    this.stats.totalSpawned++;
    this.stats.currentCount++;
    
    return entity;
  }
  
  /**
   * Get entity by ID
   */
  getEntity(id) {
    return this.entities[id] || null;
  }
  
  /**
   * Get all active entities
   */
  getAllEntities() {
    return Object.values(this.entities).filter(e => e.isActive);
  }
  
  /**
   * Get entities by type
   */
  getEntitiesByType(type) {
    return Object.values(this.entities).filter(e => e.isActive && e.type === type);
  }
  
  /**
   * Get entities within distance of position
   */
  getEntitiesNear(position, distance) {
    return Object.values(this.entities).filter(e => {
      if (!e.isActive) return false;
      const dx = e.position.x - position.x;
      const dy = e.position.y - position.y;
      const dz = e.position.z - position.z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      return dist <= distance;
    });
  }
  
  /**
   * Update entity position
   */
  updateEntityPosition(id, position) {
    const entity = this.entities[id];
    if (entity) {
      entity.position.x = position.x;
      entity.position.y = position.y;
      entity.position.z = position.z;
    }
  }
  
  /**
   * Update entity velocity
   */
  updateEntityVelocity(id, velocity) {
    const entity = this.entities[id];
    if (entity) {
      entity.velocity.x = velocity.x;
      entity.velocity.y = velocity.y;
      entity.velocity.z = velocity.z;
    }
  }
  
  /**
   * Update entity intensity
   */
  updateEntityIntensity(id, intensity) {
    const entity = this.entities[id];
    if (entity) {
      entity.intensity = Math.max(0, Math.min(1, intensity));
    }
  }
  
  /**
   * Update entity age
   */
  updateEntityAge(id, deltaTime) {
    const entity = this.entities[id];
    if (entity) {
      entity.age += deltaTime;
      
      // Check if lifetime expired
      if (entity.age >= entity.maxLifetime) {
        entity.isActive = false;
        return true; // Entity expired
      }
    }
    return false;
  }
  
  /**
   * Get fade progress (0 = full, 1 = fully faded)
   * Last 0.5s of lifetime fades out
   */
  getFadeProgress(id) {
    const entity = this.entities[id];
    if (!entity) return 1;
    
    const fadeStartTime = entity.maxLifetime - 0.5;
    if (entity.age < fadeStartTime) return 0;
    
    return (entity.age - fadeStartTime) / 0.5;
  }
  
  /**
   * Mark entity for despawn (with fade)
   */
  despawnEntity(id) {
    const entity = this.entities[id];
    if (entity) {
      entity.isActive = false;
      this.stats.currentCount--;
      this.stats.totalDespawned++;
    }
  }
  
  /**
   * Remove all entities (cleanup)
   */
  clearAll() {
    for (let id in this.entities) {
      const entity = this.entities[id];
      if (entity.vfxContainer && entity.vfxContainer.parent) {
        entity.vfxContainer.parent.remove(entity.vfxContainer);
      }
    }
    this.entities = {};
    this.stats.currentCount = 0;
  }
  
  /**
   * Get registry statistics
   */
  getStats() {
    const activeCount = Object.values(this.entities).filter(e => e.isActive).length;
    const byType = {};
    
    for (let type in this.TYPES) {
      byType[this.TYPES[type]] = Object.values(this.entities)
        .filter(e => e.isActive && e.type === this.TYPES[type]).length;
    }
    
    return {
      active: activeCount,
      totalSpawned: this.stats.totalSpawned,
      totalDespawned: this.stats.totalDespawned,
      byType
    };
  }
}
