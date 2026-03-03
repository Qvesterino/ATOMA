import * as THREE from 'three';

/**
 * Energy Orb System
 * Collectible energy orbs scattered throughout dream environments
 * Glowing, rotating orbs with magnetic attraction and collection mechanics
 */
export class EnergyOrb {
  constructor(position, type = 'standard', value = 10) {
    this.position = position.clone();
    this.type = type;  // 'standard', 'rare', 'legendary'
    this.value = value;
    this.collected = false;
    this.collected_time = null;

    // Visual properties
    this.colors = {
      standard: 0x00ddff,    // Cyan
      rare: 0xff00ff,        // Magenta
      legendary: 0xffff00    // Yellow
    };

    this.sizes = {
      standard: 0.3,
      rare: 0.5,
      legendary: 0.8
    };

    this.size = this.sizes[type];
    this.color = this.colors[type];

    // Animation properties
    this.time = 0;
    this.rotationSpeed = 1.5 + Math.random() * 1;
    this.bobSpeed = 2 + Math.random() * 1;
    this.bobHeight = 0.5;
    this.pulseSpeed = 2 + Math.random() * 1;

    // Physics
    this.velocity = new THREE.Vector3();
    this.acceleration = new THREE.Vector3();
    this.isDragging = false;
    this.dragDistance = 0;
    this.attractionForce = 0.005;
    this.maxVelocity = 0.2;

    // Audio properties
    this.soundVolume = 0.5;
    this.hasPlayedCollectionSound = false;

    // Create visual mesh
    this.mesh = this.createMesh();
    this.mesh.userData.orb = this;
  }

  /**
   * Create 3D mesh for the orb
   */
  createMesh() {
    // Main orb geometry
    const geometry = new THREE.IcosahedronGeometry(this.size, 4);
    
    // Main material with glow
    const material = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.8,
      shininess: 100,
      wireframe: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.position);

    // Add glow layer
    const glowGeometry = new THREE.IcosahedronGeometry(this.size * 1.2, 4);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });

    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glowMesh);

    // Add ring indicator (for rarity)
    const ringGeometry = new THREE.TorusGeometry(this.size * 1.3, 0.05, 8, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.6
    });

    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.random() * Math.PI * 2;
    ring.rotation.y = Math.random() * Math.PI * 2;
    mesh.add(ring);

    mesh.userData = {
      orb: this,
      ring: ring,
      glowMesh: glowMesh,
      baseEmissiveIntensity: 0.8
    };

    return mesh;
  }

  /**
   * Update orb state
   */
  update(deltaTime, playerPosition = null) {
    if (this.collected) {
      this.updateCollection(deltaTime);
      return;
    }

    this.time += deltaTime;

    // Rotation
    this.mesh.rotation.x += this.rotationSpeed * deltaTime * 0.3;
    this.mesh.rotation.y += this.rotationSpeed * deltaTime * 0.5;

    // Bob up and down
    const bobOffset = Math.sin(this.time * this.bobSpeed) * this.bobHeight;
    this.mesh.position.y = this.position.y + bobOffset;

    // Pulse glow
    const pulse = Math.sin(this.time * this.pulseSpeed) * 0.3 + 0.7;
    if (this.mesh.material && (this.mesh.material.isMeshStandardMaterial || 
        this.mesh.material.isMeshPhongMaterial || this.mesh.material.isMeshLambertMaterial || 
        this.mesh.material.isMeshToonMaterial)) {
      this.mesh.material.emissiveIntensity = pulse * 0.8;
    }
    if (this.mesh.userData.glowMesh) {
      this.mesh.userData.glowMesh.material.opacity = pulse * 0.3;
    }

    // Attraction to player
    if (playerPosition && !this.collected) {
      this.updateAttraction(playerPosition, deltaTime);
    }

    // Ring rotation
    if (this.mesh.userData.ring) {
      this.mesh.userData.ring.rotation.z += 0.5 * deltaTime;
    }
  }

  /**
   * Update attraction toward player
   */
  updateAttraction(playerPosition, deltaTime) {
    const distance = this.mesh.position.distanceTo(playerPosition);
    const attractionRadius = 15;

    if (distance < attractionRadius) {
      // Calculate attraction force
      const direction = new THREE.Vector3()
        .subVectors(playerPosition, this.mesh.position)
        .normalize();

      // Stronger attraction as player gets closer
      const attractionStrength = this.attractionForce * (1 - distance / attractionRadius);
      this.acceleration.copy(direction).multiplyScalar(attractionStrength);

      // Apply acceleration
      this.velocity.add(this.acceleration);

      // Limit velocity
      if (this.velocity.length() > this.maxVelocity) {
        this.velocity.normalize().multiplyScalar(this.maxVelocity);
      }

      // Update position
      this.mesh.position.add(this.velocity);

      // Damping
      this.velocity.multiplyScalar(0.95);
    }
  }

  /**
   * Update collection animation
   */
  updateCollection(deltaTime) {
    const elapsed = this.time - this.collected_time;
    const duration = 0.5;
    const progress = Math.min(elapsed / duration, 1);

    // Scale down
    this.mesh.scale.setScalar(1 - progress * 0.9);

    // Move toward player (simulated)
    this.mesh.position.y += deltaTime * 2;

    // Fade out
    if (this.mesh.material) {
      this.mesh.material.opacity = 1 - progress;
    }

    // Remove when fully collected
    if (progress >= 1) {
      this.mesh.parent?.remove(this.mesh);
    }
  }

  /**
   * Collect the orb
   */
  collect() {
    if (this.collected) return;

    this.collected = true;
    this.collected_time = this.time;

    // Visual feedback
    if (this.mesh.material) {
      this.mesh.material.transparent = true;
      this.mesh.material.opacity = 1;
    }

    return {
      type: this.type,
      value: this.value,
      energy: this.calculateEnergy()
    };
  }

  /**
   * Calculate energy value based on type
   */
  calculateEnergy() {
    const energyMultipliers = {
      standard: 1,
      rare: 2.5,
      legendary: 5
    };

    return this.value * energyMultipliers[this.type];
  }

  /**
   * Check if player is within collection range
   */
  isInCollectionRange(playerPosition, range = 1.5) {
    return this.mesh.position.distanceTo(playerPosition) < range;
  }

  /**
   * Dispose of resources
   */
  dispose() {
    if (this.mesh) {
      this.mesh.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }
  }
}

/**
 * Energy Orb Manager
 * Spawns and manages orbs throughout environments
 */
export class EnergyOrbManager {
  constructor(scene, environmentRoot, player) {
    this.scene = scene;
    this.root = environmentRoot || scene;
    this.player = player;
    this.orbs = [];
    this.collectedOrbsCount = 0;
    this.totalEnergyCollected = 0;
    this.orbGroup = new THREE.Group();
    this.root.add(this.orbGroup);

    // Audio system (optional)
    this.audioSystem = null;
  }

  /**
   * Set audio system for collection sounds
   */
  setAudioSystem(audioSystem) {
    this.audioSystem = audioSystem;
  }

  /**
   * Spawn orb at position
   */
  spawnOrb(position, type = 'standard', value = 10) {
    const orb = new EnergyOrb(position, type, value);
    this.orbs.push(orb);
    this.orbGroup.add(orb.mesh);
    return orb;
  }

  /**
   * Spawn multiple orbs in area
   */
  spawnOrbsInArea(centerPosition, count = 5, radius = 10) {
    const spawnedOrbs = [];

    for (let i = 0; i < count; i++) {
      // Random position within radius
      const angle = (i / count) * Math.PI * 2;
      const distance = radius * (0.5 + Math.random() * 0.5);
      
      const position = new THREE.Vector3(
        centerPosition.x + Math.cos(angle) * distance,
        centerPosition.y + 2 + Math.random() * 3,
        centerPosition.z + Math.sin(angle) * distance
      );

      // Determine rarity (80% standard, 15% rare, 5% legendary)
      let type = 'standard';
      const rand = Math.random();
      if (rand > 0.95) type = 'legendary';
      else if (rand > 0.8) type = 'rare';

      const orb = this.spawnOrb(position, type, 10);
      spawnedOrbs.push(orb);
    }

    return spawnedOrbs;
  }

  /**
   * Update all orbs
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;
    const playerPos = this.player.position;

    // Update each orb
    this.orbs = this.orbs.filter(orb => {
      if (!orb.collected) {
        orb.update(deltaTime, playerPos);

        // Check for collection
        if (orb.isInCollectionRange(playerPos)) {
          const collectionData = orb.collect();
          this.onOrbCollected(orb, collectionData);
          return true; // Keep in list until fully animated
        }

        return true;
      } else {
        // Remove fully collected orbs
        orb.update(deltaTime);
        return orb.collected && (this.time - orb.collected_time) < 0.5;
      }
    });
  }

  /**
   * Handle orb collection
   */
  onOrbCollected(orb, collectionData) {
    this.collectedOrbsCount++;
    this.totalEnergyCollected += collectionData.energy;

    // Play collection sound
    if (this.audioSystem && !orb.hasPlayedCollectionSound) {
      orb.hasPlayedCollectionSound = true;
      const soundKey = `collect_${orb.type}`;
      this.audioSystem.playSound(soundKey, {
        volume: 0.3,
        pitch: 1 + Math.random() * 0.3
      });
    }

    // Console log for debugging
    console.log(`Collected ${orb.type} orb! Energy: ${collectionData.energy}`);
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      totalOrbs: this.orbs.length,
      activeOrbs: this.orbs.filter(o => !o.collected).length,
      collectedOrbs: this.collectedOrbsCount,
      totalEnergyCollected: this.totalEnergyCollected,
      energyPerSecond: this.totalEnergyCollected / (this.getSessionTime() || 1)
    };
  }

  /**
   * Clear all orbs
   */
  clear() {
    this.orbs.forEach(orb => orb.dispose());
    this.orbs = [];
    this.orbGroup.clear();
  }

  /**
   * Dispose
   */
  dispose() {
    this.clear();
    if (this.orbGroup.parent) {
      this.orbGroup.parent.remove(this.orbGroup);
    }
  }
}
