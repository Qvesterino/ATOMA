import * as THREE from 'three';

/**
 * Environmental Hazards System
 * Electrical storms, gravitational anomalies, and dynamic environmental effects
 */
export class EnvironmentalHazards {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.root = new THREE.Group();
    this.root.name = 'EnvironmentalHazardsRoot';
    this.scene?.add?.(this.root);
    this.hazards = [];
    this.activeEffects = [];
    this._hazardEffectScratch = new THREE.Vector3();
    this._hazardDirectionScratch = new THREE.Vector3();
    this.metricBus = this._resolveMetricBus();
    this.metricSignalTimes = new Map();
    this._setupMetricTriggers();
  }
  
  /**
   * Create electrical storm hazard
   */
  createElectricalStorm(position, radius = 30, intensity = 1) {
    const hazard = {
      type: 'electricalStorm',
      position: position.clone(),
      radius,
      intensity,
      time: 0,
      active: true,
      bolts: [],
      aura: null
    };
    
    // Create storm aura
    const auraGeo = new THREE.SphereGeometry(radius, 32, 32);
    const auraMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0,
      emissive: 0x0088ff,
      emissiveIntensity: 0.3,
      side: THREE.BackSide,
      depthTest: false,   // ⚠️ CRITICAL: Aura overlay does NOT read depth
      depthWrite: false   // ⚠️ CRITICAL: Aura overlay does NOT write depth
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    auraMesh.position.copy(position);
    this.root.add(auraMesh);
    
    hazard.aura = auraMesh;
    
    // Create initial lightning bolts
    this.generateLightningBolts(hazard, 3);
    
    this.hazards.push(hazard);
    this._emitHazardEvent('environment.hazard.active', hazard);
    return hazard;
  }
  
  /**
   * Generate lightning bolts for storm
   */
  generateLightningBolts(hazard, count) {
    for (let i = 0; i < count; i++) {
      const bolt = {
        points: [],
        line: null,
        life: Math.random() * 0.5,
        maxLife: 0.5 + Math.random() * 0.3,
        direction: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          -1,
          (Math.random() - 0.5) * 2
        ).normalize()
      };
      
      this.createBoltGeometry(hazard, bolt);
      hazard.bolts.push(bolt);
    }
  }
  
  /**
   * Create lightning bolt geometry
   */
  createBoltGeometry(hazard, bolt) {
    const segments = 20;
    const points = [];
    let currentPos = hazard.position.clone();
    points.push(currentPos.clone());
    
    for (let i = 0; i < segments; i++) {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).multiplyScalar(0.8);
      
      currentPos.add(bolt.direction.clone().multiplyScalar(2));
      currentPos.add(offset);
      points.push(currentPos.clone());
    }
    
    bolt.points = points;
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.8,
      linewidth: 3
    });
    
    bolt.line = new THREE.Line(geometry, material);
    this.root.add(bolt.line);
  }
  
  /**
   * Create gravitational anomaly
   */
  createGravitationalAnomaly(position, radius = 25, strength = 1) {
    const hazard = {
      type: 'gravitationalAnomaly',
      position: position.clone(),
      radius,
      strength,
      time: 0,
      active: true,
      mesh: null,
      particles: []
    };
    
    // Create visual representation
    const geometry = new THREE.IcosahedronGeometry(radius * 0.5, 4);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.15,
      emissive: 0xff0088,
      emissiveIntensity: 0.5,
      wireframe: true
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    this.root.add(mesh);
    
    hazard.mesh = mesh;
    
    // Create orbital particles
    this.createAnomalyParticles(hazard, 12);
    
    this.hazards.push(hazard);
    this._emitHazardEvent('environment.hazard.active', hazard);
    return hazard;
  }
  
  /**
   * Create particles orbiting anomaly
   */
  createAnomalyParticles(hazard, count) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const particle = {
        position: new THREE.Vector3(
          Math.cos(angle) * hazard.radius * 0.6,
          Math.sin(angle) * hazard.radius * 0.6,
          Math.cos(angle) * Math.sin(angle) * hazard.radius * 0.6
        ),
        velocity: new THREE.Vector3(
          -Math.sin(angle) * 0.05,
          0,
          Math.cos(angle) * 0.05
        ),
        size: 0.3 + Math.random() * 0.2,
        angle: angle,
        speed: 0.01 + Math.random() * 0.02
      };
      
      hazard.particles.push(particle);
    }
  }
  
  /**
   * Calculate hazard effect on position
   */
  getHazardEffect(position) {
    const force = this._hazardEffectScratch || (this._hazardEffectScratch = new THREE.Vector3());
    force.set(0, 0, 0);
    const direction = this._hazardDirectionScratch || (this._hazardDirectionScratch = new THREE.Vector3());
    
    this.hazards.forEach(hazard => {
      if (!hazard.active) return;
      
      const distance = position.distanceTo(hazard.position);
      
      if (distance < hazard.radius) {
        if (hazard.type === 'electricalStorm') {
          // Repulsive force from storm
          direction.subVectors(position, hazard.position).normalize();
          
          const strength = (1 - distance / hazard.radius) * hazard.intensity * 0.1;
          force.add(direction.multiplyScalar(strength));
          
          // Add chaotic oscillation
          force.x += Math.sin(Date.now() * 0.01) * strength * 0.05;
          force.z += Math.cos(Date.now() * 0.01) * strength * 0.05;
        }
        
        if (hazard.type === 'gravitationalAnomaly') {
          // Attractive force from anomaly
          direction.subVectors(hazard.position, position).normalize();
          
          const strength = (1 - distance / hazard.radius) * hazard.strength * 0.15;
          force.add(direction.multiplyScalar(strength));
        }
      }
    });
    
    return force;
  }
  
  /**
   * Update hazards
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;
    this.hazards.forEach(hazard => {
      if (!hazard.active) return;
      
      hazard.time += deltaTime;
      
      if (hazard.type === 'electricalStorm') {
        this.updateElectricalStorm(hazard, deltaTime);
      }
      
      if (hazard.type === 'gravitationalAnomaly') {
        this.updateGravitationalAnomaly(hazard, deltaTime);
      }
    });
    
    // Update active effects
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i];
      effect.life -= deltaTime;
      
      if (effect.life <= 0) {
        this.root.remove(effect.object);
        this.activeEffects.splice(i, 1);
      }
    }
  }
  
  /**
   * Update electrical storm
   */
  updateElectricalStorm(hazard, deltaTime) {
    const intensityScale = this._getHazardIntensityScale();
    // Update aura pulsing
    const pulse = Math.sin(hazard.time * 2) * 0.5 + 0.5;
    hazard.aura.material.opacity = pulse * 0.3 * intensityScale;
    if (hazard.aura.material.isMeshStandardMaterial || hazard.aura.material.isMeshPhongMaterial || 
        hazard.aura.material.isMeshLambertMaterial || hazard.aura.material.isMeshToonMaterial) {
      hazard.aura.material.emissiveIntensity = (0.2 + pulse * 0.4) * intensityScale;
    }
    
    // Update bolts
    for (let i = hazard.bolts.length - 1; i >= 0; i--) {
      const bolt = hazard.bolts[i];
      bolt.life -= deltaTime;
      
      // Update opacity based on life
      const opacity = (bolt.life / bolt.maxLife) * 0.8 * intensityScale;
      bolt.line.material.opacity = opacity;
      
      // Remove expired bolt and regenerate
      if (bolt.life <= 0) {
        this.root.remove(bolt.line);
        hazard.bolts.splice(i, 1);
        
        // Create new bolt
        const newBolt = {
          points: [],
          line: null,
          life: 0.5 + Math.random() * 0.3,
          maxLife: 0.5 + Math.random() * 0.3,
          direction: new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            -1,
            (Math.random() - 0.5) * 2
          ).normalize()
        };
        this.createBoltGeometry(hazard, newBolt);
        hazard.bolts.push(newBolt);
      }
    }
  }
  
  /**
   * Update gravitational anomaly
   */
  updateGravitationalAnomaly(hazard, deltaTime) {
    const intensityScale = this._getHazardIntensityScale();
    // Rotate mesh
    hazard.mesh.rotation.x += deltaTime * 0.3;
    hazard.mesh.rotation.y += deltaTime * 0.2;
    
    // Update pulsing
    const pulse = Math.sin(hazard.time * 1.5) * 0.5 + 0.5;
    hazard.mesh.material.opacity = (0.1 + pulse * 0.1) * Math.max(0.6, intensityScale);
    if (hazard.mesh.material.isMeshStandardMaterial || hazard.mesh.material.isMeshPhongMaterial || 
        hazard.mesh.material.isMeshLambertMaterial || hazard.mesh.material.isMeshToonMaterial) {
      hazard.mesh.material.emissiveIntensity = (0.3 + pulse * 0.3) * intensityScale;
    }
    
    // Update particles
    hazard.particles.forEach(particle => {
      particle.angle += particle.speed * deltaTime;
      
      const distance = hazard.radius * (0.4 + Math.sin(hazard.time + particle.speed) * 0.2);
      
      particle.position.x = Math.cos(particle.angle) * distance;
      particle.position.y = Math.sin(particle.angle) * distance * 0.5;
      particle.position.z = Math.cos(particle.angle + particle.speed) * distance * 0.5;
    });
  }
  
  /**
   * Check if position is in danger zone
   */
  isInDangerZone(position) {
    for (const hazard of this.hazards) {
      if (hazard.active) {
        const distance = position.distanceTo(hazard.position);
        if (distance < hazard.radius) {
          return { hazard, distance, ratio: distance / hazard.radius };
        }
      }
    }
    return null;
  }
  
  /**
   * Deactivate a hazard
   */
  deactivateHazard(hazardId) {
    const hazard = this.hazards[hazardId];
    if (hazard) {
      hazard.active = false;
      if (hazard.aura) this.root.remove(hazard.aura);
      if (hazard.mesh) this.root.remove(hazard.mesh);

      if (Array.isArray(hazard.bolts)) {
        hazard.bolts.forEach(bolt => {
          if (bolt?.line) this.root.remove(bolt.line);
        });
      }

      // defensively clear hazard references to avoid stale reuse
      hazard.bolts = [];
      hazard.aura = null;
      hazard.mesh = null;
    }
  }

  dispose() {
    for (let i = 0; i < this.hazards.length; i++) {
      this.deactivateHazard(i);
    }

    for (const effect of this.activeEffects) {
      if (effect?.object) {
        this.root.remove(effect.object);
      }
    }

    this.activeEffects.length = 0;
    this.hazards.length = 0;
    this.root?.removeFromParent?.();
  }

  _resolveMetricBus() {
    if (globalThis?.ATOMA_BUS || globalThis?.semanticBus) {
      return globalThis.ATOMA_BUS || globalThis.semanticBus || null;
    }

    const browserWindow = typeof window !== 'undefined' ? window : null;
    return browserWindow?.ATOMA_BUS || browserWindow?.semanticBus || null;
  }

  _setupMetricTriggers() {
    this._subscribeMetricTag('global.corruption.high', 'corruption.high');
    this._subscribeMetricTag('global.loadPressure.high', 'loadPressure.high');
    this._subscribeMetricTag('global.stability.low', 'stability.low');
    this._subscribeMetricTag('global.stability.high', 'stability.high');
  }

  _subscribeMetricTag(eventName, signalKey) {
    const bus = this.metricBus;
    if (!bus || !eventName || !signalKey) return;
    const handler = () => {
      this.metricSignalTimes.set(signalKey, performance.now());
    };

    if (typeof bus.on === 'function') {
      bus.on(eventName, handler);
      return;
    }

    if (typeof bus.subscribe === 'function') {
      bus.subscribe(eventName, handler);
    }
  }

  _isSignalActive(signalKey, lifetimeMs = 5000) {
    const lastAt = this.metricSignalTimes.get(signalKey);
    if (!Number.isFinite(lastAt)) return false;
    return (performance.now() - lastAt) <= lifetimeMs;
  }

  _getHazardIntensityScale() {
    let scale = 1;
    if (this._isSignalActive('corruption.high')) scale += 0.25;
    if (this._isSignalActive('loadPressure.high')) scale += 0.2;
    if (this._isSignalActive('stability.low')) scale += 0.15;
    if (this._isSignalActive('stability.high')) scale -= 0.2;
    return Math.max(0.65, Math.min(1.5, scale));
  }

  _emitHazardEvent(eventName, hazard) {
    const bus = this.metricBus;
    if (!bus || !eventName || !hazard) return;

    const payload = {
      type: hazard.type,
      intensity: hazard.intensity ?? hazard.strength ?? 1,
      radius: hazard.radius,
      source: 'EnvironmentalHazards',
      timestamp: performance.now()
    };

    if (typeof bus.emit === 'function') {
      bus.emit(eventName, payload);
      return;
    }

    if (typeof bus.publish === 'function') {
      bus.publish(eventName, payload);
    }
  }
}
