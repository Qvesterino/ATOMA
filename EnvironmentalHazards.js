import * as THREE from 'three';

const HAZARD_PALETTE = {
  blackHole: 0x0C0816,
  deepVoid: 0x05131A,
  softHalo: 0xE8D0FF,
  coreWhite: 0xF7FBFF,
  primaryCyan: 0x6DEAFF,
  electricEdge: 0x67F2FF,
  quantumViolet: 0xD07BFF,
  breachRose: 0xFF73CF,
  ritualWhite: 0xF7FBFF,
  stormShadow: 0x08101a
};

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
    this.hazards = new Map();
    this._hazardSequence = 0;
    this._hazardEffectScratch = new THREE.Vector3();
    this._hazardDirectionScratch = new THREE.Vector3();
    this.metricBus = this._resolveMetricBus();
    this.metricSignalTimes = new Map();
    this.hazardEnvelope = {
      birth: 0.2,
      crest: 0.45,
      decay: 0.25,
      afterglow: 0.1
    };
    this._sharedUnitSphereGeometry = new THREE.SphereGeometry(1, 24, 24);
    this._sharedUnitTorusGeometry = new THREE.TorusGeometry(1, 0.05, 16, 120);
    this._sharedUnitRingGeometry = new THREE.RingGeometry(0.68, 0.82, 64);
    this._sharedUnitPlaneGeometry = new THREE.PlaneGeometry(1, 1);
    this._sharedOrbitBeadGeometry = new THREE.SphereGeometry(0.08, 10, 10);
    this._sharedDustShardGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    this._sharedBoltGlowMaterial = new THREE.LineBasicMaterial({
      color: HAZARD_PALETTE.primaryCyan,
      transparent: true,
      opacity: 0.48,
      linewidth: 4,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this._sharedBoltCoreMaterial = new THREE.LineBasicMaterial({
      color: HAZARD_PALETTE.coreWhite,
      transparent: true,
      opacity: 0.95,
      linewidth: 1.5,
      depthWrite: false
    });
    this._sharedOrbitMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.72,
      depthWrite: false
    });
    this._sharedShardMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.28,
      depthWrite: false
    });
    this._setupMetricTriggers();
  }
  
  /**
   * Create electrical storm hazard
   */
  createElectricalStorm(position, radius = 18, intensity = 1) {
    const hazard = {
      type: 'electricalStorm',
      identity: 'thunder crown',
      title: 'Thunder Crown',
      subtitle: 'Cathedral storm of high pressure',
      visualTone: 'electric',
      position: position.clone(),
      radius,
      intensity,
      time: 0,
      active: true,
      bolts: [],
      stormGroup: null,
      core: null,
      shell: null,
      ringA: null,
      ringB: null,
      backplate: null
    };
    
    const stormGroup = new THREE.Group();
    stormGroup.name = 'ElectricalStormGroup';
    stormGroup.position.copy(position);
    this.root.add(stormGroup);
    
    const core = new THREE.Mesh(
      this._sharedUnitSphereGeometry,
      new THREE.MeshBasicMaterial({
        color: HAZARD_PALETTE.coreWhite,
        transparent: true,
        opacity: 0,
        depthWrite: false
      })
    );
    core.scale.setScalar(radius * 0.22);
    const shell = new THREE.Mesh(
      this._sharedUnitSphereGeometry,
      new THREE.MeshBasicMaterial({
        color: HAZARD_PALETTE.stormShadow,
        transparent: true,
        opacity: 0,
        side: THREE.BackSide,
        depthWrite: false
      })
    );
    shell.scale.setScalar(radius * 0.7);
    const ringA = new THREE.Mesh(
      this._sharedUnitTorusGeometry,
      this._sharedOrbitMaterial.clone()
    );
    ringA.scale.setScalar(radius * 0.5);
    ringA.rotation.x = Math.PI * 0.5;
    const ringB = new THREE.Mesh(
      this._sharedUnitTorusGeometry,
      this._sharedOrbitMaterial.clone()
    );
    ringB.scale.setScalar(radius * 0.75);
    
    ringB.rotation.y = Math.PI * 0.35;
    const backplate = new THREE.Mesh(
      this._sharedUnitPlaneGeometry,
      new THREE.MeshBasicMaterial({
        color: HAZARD_PALETTE.stormShadow,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    backplate.scale.setScalar(radius * 4);
    backplate.position.set(0, 0, -radius * 1.6);
    backplate.rotation.y = 0.14;
    
    stormGroup.add(backplate, shell, core, ringA, ringB);
    
    hazard.stormGroup = stormGroup;
    hazard.core = core;
    hazard.shell = shell;
    hazard.ringA = ringA;
    hazard.ringB = ringB;
    hazard.backplate = backplate;
    
    this.generateLightningBolts(hazard, 3);
    hazard.id = `hazard.${this._hazardSequence++}`;
    this.hazards.set(hazard.id, hazard);
    this._emitHazardEvent('environment.hazard.active', hazard);
    return hazard;
  }
  
  /**
   * Generate lightning bolts for storm
   */
  generateLightningBolts(hazard, count) {
    for (let i = 0; i < count; i++) {
      const branchCount = Math.min(3, 1 + Math.floor(hazard.intensity));
      const bolt = {
        points: [],
        lines: [],
        life: Math.random() * 0.45,
        maxLife: 0.4 + Math.random() * 0.25,
        direction: new THREE.Vector3(
          (Math.random() - 0.5) * 0.15,
          -1,
          (Math.random() - 0.5) * 0.15
        ).normalize(),
        branchCount
      };
      
      this.createBoltGeometry(hazard, bolt);
      hazard.bolts.push(bolt);
    }
  }
  
  /**
   * Create lightning bolt geometry
   */
  createBoltGeometry(hazard, bolt) {
    const spineLength = 4;
    const spinePoints = [hazard.position.clone()];
    const mainDirection = bolt.direction.clone();
    const phaseSeed = Math.random() * Math.PI * 2;
    
    for (let i = 1; i <= spineLength; i++) {
      const t = i / spineLength;
      const bendProfile = new THREE.Vector3(
        Math.sin(phaseSeed + t * Math.PI * 1.5) * hazard.radius * 0.04,
        Math.cos(phaseSeed + t * Math.PI * 1.2) * hazard.radius * 0.02,
        Math.sin(phaseSeed * 0.8 + t * Math.PI) * hazard.radius * 0.03
      );
      const step = mainDirection.clone().multiplyScalar(hazard.radius * (0.18 + t * 0.05));
      const nextPoint = spinePoints[i - 1].clone().add(step).add(bendProfile);
      spinePoints.push(nextPoint);
    }
    
    const positions = [];
    for (let i = 1; i < spinePoints.length; i++) {
      const prev = spinePoints[i - 1];
      const next = spinePoints[i];
      positions.push(prev.x, prev.y, prev.z, next.x, next.y, next.z);
    }
    
    const branchCount = Math.min(bolt.branchCount, spineLength - 1);
    for (let b = 0; b < branchCount; b++) {
      const branchOriginIndex = 1 + Math.floor((b / branchCount) * (spineLength - 1));
      const origin = spinePoints[branchOriginIndex].clone();
      const branchBase = spinePoints[spinePoints.length - 1].clone().sub(origin).normalize();
      branchBase.applyAxisAngle(new THREE.Vector3(0, 1, 0), (b - 1) * 0.25 + 0.15);
      const branchLength = hazard.radius * (0.16 + b * 0.03);
      const branchSteps = 2;
      let branchPos = origin.clone();
      
      for (let j = 0; j < branchSteps; j++) {
        const branchT = (j + 1) / (branchSteps + 1);
        const branchOffset = new THREE.Vector3(
          (Math.sin(phaseSeed + b + j) * 0.02) * hazard.radius,
          (Math.cos(phaseSeed * 0.7 + b + j) * 0.015) * hazard.radius,
          (Math.sin(phaseSeed * 1.1 + b - j) * 0.02) * hazard.radius
        );
        const nextBranch = branchPos.clone().add(branchBase.clone().multiplyScalar(branchLength * branchT)).add(branchOffset);
        positions.push(branchPos.x, branchPos.y, branchPos.z, nextBranch.x, nextBranch.y, nextBranch.z);
        branchPos = nextBranch;
      }
    }
    
    const glowGeometry = new THREE.BufferGeometry();
    glowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const coreGeometry = glowGeometry.clone();
    const glowMaterial = this._sharedBoltGlowMaterial.clone();
    const coreMaterial = this._sharedBoltCoreMaterial.clone();
    
    const glowLine = new THREE.LineSegments(glowGeometry, glowMaterial);
    const coreLine = new THREE.LineSegments(coreGeometry, coreMaterial);
    bolt.lines = [glowLine, coreLine];
    bolt.line = coreLine;
    this.root.add(glowLine);
    this.root.add(coreLine);
  }
  
  /**
   * Create gravitational anomaly
   */
  createGravitationalAnomaly(position, radius = 15, strength = 1) {
    const hazard = {
      type: 'gravitationalAnomaly',
      identity: 'singularity eclipse',
      title: 'Singularity Eclipse',
      subtitle: 'Silent gravitational authority',
      visualTone: 'cosmic',
      position: position.clone(),
      radius,
      strength,
      time: 0,
      active: true,
      group: null,
      core: null,
      accretionRing: null,
      lensRing: null,
      veil: null,
      particles: []
    };
    
    const group = new THREE.Group();
    group.name = 'GravitationalAnomalyGroup';
    group.position.copy(position);
    this.root.add(group);
    
    const core = new THREE.Mesh(
      this._sharedUnitSphereGeometry,
      new THREE.MeshBasicMaterial({
        color: HAZARD_PALETTE.blackHole,
        transparent: true,
        opacity: 0.92,
        depthWrite: false
      })
    );
    core.scale.setScalar(radius * 0.18);
    
    const accretionRing = new THREE.Mesh(
      this._sharedUnitRingGeometry,
      new THREE.MeshBasicMaterial({
        color: HAZARD_PALETTE.primaryCyan,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    accretionRing.scale.setScalar(radius);
    accretionRing.rotation.x = Math.PI * 0.5;
    
    const lensRing = new THREE.Mesh(
      this._sharedUnitTorusGeometry,
      new THREE.MeshBasicMaterial({
        color: HAZARD_PALETTE.quantumViolet,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    lensRing.scale.setScalar(radius * 1.05);
    lensRing.rotation.y = Math.PI * 0.2;
    
    const veil = new THREE.Mesh(
      this._sharedUnitPlaneGeometry,
      new THREE.MeshBasicMaterial({
        color: HAZARD_PALETTE.deepVoid,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    veil.scale.setScalar(radius * 3);
    veil.position.set(0, 0, -radius * 1.4);
    veil.rotation.y = 0.12;
    
    group.add(veil, accretionRing, lensRing, core);
    
    hazard.group = group;
    hazard.core = core;
    hazard.accretionRing = accretionRing;
    hazard.lensRing = lensRing;
    hazard.veil = veil;
    
    this.createAnomalyParticles(hazard, 6);
    hazard.id = `hazard.${this._hazardSequence++}`;
    this.hazards.set(hazard.id, hazard);
    this._emitHazardEvent('environment.hazard.active', hazard);
    return hazard;
  }
  
  /**
   * Create particles orbiting anomaly
   */
  createAnomalyParticles(hazard, count) {
    const orbitCount = Math.max(4, Math.min(6, count));
    const shardCount = Math.max(3, Math.floor(count * 0.75));
    
    for (let i = 0; i < orbitCount; i++) {
      const role = 'orbit';
      const angle = (i / orbitCount) * Math.PI * 2;
      const hue = i % 2 === 0 ? HAZARD_PALETTE.primaryCyan : HAZARD_PALETTE.softHalo;
      const particle = {
        role,
        mesh: new THREE.Mesh(
          this._sharedOrbitBeadGeometry,
          this._sharedOrbitMaterial.clone()
        ),
        baseAngle: angle,
        radiusFactor: 0.75 + (i % 2) * 0.04,
        speed: 0.003 + hazard.intensity * 0.003 + i * 0.0008,
        pulseOffset: Math.PI * i / orbitCount,
        baseOpacity: 0.45
      };
      particle.mesh.material.color.setHex(hue);
      particle.mesh.scale.setScalar(0.9 + (i % 2) * 0.06);
      particle.mesh.position.set(
        Math.cos(angle) * hazard.radius * particle.radiusFactor,
        Math.sin(angle) * hazard.radius * particle.radiusFactor * 0.18,
        Math.sin(angle) * hazard.radius * particle.radiusFactor * 0.28
      );
      hazard.group.add(particle.mesh);
      hazard.particles.push(particle);
    }
    
    for (let i = 0; i < shardCount; i++) {
      const role = 'shard';
      const angle = (i / shardCount) * Math.PI * 2 + Math.random() * 0.3;
      const radiusBias = 0.92 + (i % 2) * 0.1;
      const hue = (i % 2 === 0) ? HAZARD_PALETTE.electricEdge : HAZARD_PALETTE.breachRose;
      const particle = {
        role,
        mesh: new THREE.Mesh(
          this._sharedDustShardGeometry,
          this._sharedShardMaterial.clone()
        ),
        baseAngle: angle,
        radiusFactor: radiusBias,
        speed: 0.002 + hazard.intensity * 0.0015,
        pulseOffset: Math.random() * Math.PI * 2,
        baseOpacity: 0.2
      };
      particle.mesh.scale.setScalar(0.45 + Math.random() * 0.2);
      particle.mesh.position.set(
        Math.cos(angle) * hazard.radius * radiusBias * 0.92,
        (Math.sin(angle * 1.4) * 0.05 + 0.02) * hazard.radius,
        Math.sin(angle) * hazard.radius * radiusBias * 0.92
      );
      hazard.group.add(particle.mesh);
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
    
    for (const hazard of this.hazards.values()) {
      if (!hazard.active) continue;
      
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
    }
    
    return force;
  }
  
  /**
   * Update hazards
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;
    for (const hazard of this.hazards.values()) {
      if (!hazard.active) continue;
      
      hazard.time += deltaTime;
      
      if (hazard.type === 'electricalStorm') {
        this.updateElectricalStorm(hazard, deltaTime);
      }
      
      if (hazard.type === 'gravitationalAnomaly') {
        this.updateGravitationalAnomaly(hazard, deltaTime);
      }
    }
  }
  
  /**
   * Update electrical storm
   */
  updateElectricalStorm(hazard, deltaTime) {
    const intensityScale = this._getHazardIntensityScale();
    const lodScale = this._getHazardLODScale(hazard);
    const signals = this._getHazardSignalModifiers();
    const { envelope, pulse, slowPulse } = this._getHazardPhaseWeights(hazard);
    const { attack, crest, release } = this._getHazardPhaseState(hazard);
    const palette = this._getHazardPalette(hazard.type);

    const stormScale = 1 + attack * 0.04 + crest * 0.06 - release * 0.03;
    hazard.stormGroup.scale.setScalar(stormScale);
    hazard.core.material.opacity = (0.12 + attack * 0.18 + crest * 0.24 - release * 0.14) * lodScale;
    hazard.core.material.color.setHex(signals.stabilityHigh ? HAZARD_PALETTE.coreWhite : palette.core);

    const shellAlpha = 0.02 + attack * 0.06 + crest * 0.12 - release * 0.08 + (signals.loadPressureHigh ? 0.08 : 0);
    hazard.shell.material.opacity = shellAlpha * lodScale;
    hazard.shell.material.color.setHex(signals.corruptionHigh ? HAZARD_PALETTE.breachRose : palette.shadow);

    const ringAAlpha = (0.08 + attack * 0.08 + crest * 0.18 - release * 0.1 + (signals.loadPressureHigh ? 0.08 : 0)) * lodScale;
    hazard.ringA.material.opacity = ringAAlpha;
    hazard.ringA.material.color.setHex(signals.stabilityHigh ? HAZARD_PALETTE.coreWhite : palette.aura);

    const ringBAlpha = (0.06 + attack * 0.06 + crest * 0.14 - release * 0.08 + (signals.corruptionHigh ? 0.06 : 0)) * lodScale;
    hazard.ringB.material.opacity = ringBAlpha;
    hazard.ringB.material.color.setHex(signals.corruptionHigh ? HAZARD_PALETTE.breachRose : (signals.stabilityHigh ? HAZARD_PALETTE.coreWhite : palette.edge));

    hazard.backplate.material.opacity = (0.02 + attack * 0.04 + crest * 0.08 - release * 0.05) * lodScale;
    hazard.backplate.material.color.setHex(palette.shadow);

    const ringSpeed = 0.01 + crest * 0.04 + attack * 0.015 - release * 0.01 + (signals.loadPressureHigh ? 0.015 : 0);
    hazard.ringA.rotation.z += deltaTime * ringSpeed * pulse;

    if (attack > 0.05 && hazard.bolts.length < 3 + Math.floor(crest * 2)) {
      this.generateLightningBolts(hazard, 1);
    }

    for (let i = 0; i < hazard.bolts.length; i++) {
      const bolt = hazard.bolts[i];
      bolt.life -= deltaTime * (1 + attack * 0.35 - release * 0.25);
      const baseOpacity = Math.max(0, (bolt.life / bolt.maxLife) * 0.72 * (crest * 0.8 + attack * 0.2 + 0.2) * intensityScale);
      const opacity = baseOpacity * (signals.loadPressureHigh ? 1.1 : 1);
      const edgeColor = signals.corruptionHigh ? HAZARD_PALETTE.breachRose : (signals.stabilityHigh ? HAZARD_PALETTE.coreWhite : HAZARD_PALETTE.electricEdge);
      bolt.lines.forEach(line => {
        line.material.opacity = opacity;
        line.material.color.setHex(edgeColor);
      });
      if (bolt.life <= 0) {
        bolt.life = bolt.maxLife;
      }
    }
  }
  
  /**
   * Update gravitational anomaly
   */
  updateGravitationalAnomaly(hazard, deltaTime) {
    const intensityScale = this._getHazardIntensityScale();
    const lodScale = this._getHazardLODScale(hazard);
    const signals = this._getHazardSignalModifiers();
    const { envelope, pulse, slowPulse } = this._getHazardPhaseWeights(hazard);
    const { attack, crest, release } = this._getHazardPhaseState(hazard);
    const palette = this._getHazardPalette(hazard.type);

    const formation = Math.min(1, envelope * 1.3);
    hazard.group.scale.setScalar(1 + attack * 0.02 + crest * 0.03 - release * 0.01);
    hazard.core.material.opacity = 0.2 + attack * 0.5 + crest * 0.26 - release * 0.28;
    hazard.core.material.color.setHex(palette.core);

    hazard.accretionRing.material.opacity = (0.04 + attack * 0.08 + crest * 0.16 - release * 0.08 + (signals.loadPressureHigh ? 0.08 : 0)) * lodScale;
    hazard.accretionRing.material.color.setHex(signals.stabilityHigh ? HAZARD_PALETTE.coreWhite : palette.ringPrimary);

    hazard.lensRing.material.opacity = (0.03 + attack * 0.06 + crest * 0.18 - release * 0.1 + (signals.corruptionHigh ? 0.06 : 0)) * lodScale;
    hazard.lensRing.material.color.setHex(signals.corruptionHigh ? HAZARD_PALETTE.breachRose : (signals.stabilityHigh ? HAZARD_PALETTE.coreWhite : palette.ringSecondary));

    hazard.veil.material.opacity = (0.02 + attack * 0.04 + crest * 0.1 - release * 0.06 + (signals.loadPressureHigh ? 0.04 : 0) - (signals.stabilityHigh ? 0.02 : 0)) * lodScale;
    hazard.veil.material.color.setHex(palette.veil);

    hazard.accretionRing.rotation.y += deltaTime * (0.008 + crest * 0.03 + (signals.stabilityLow ? 0.008 : 0)) * pulse;
    hazard.lensRing.rotation.y += deltaTime * (0.006 + crest * 0.02 + (signals.stabilityLow ? 0.006 : 0)) * slowPulse;

    hazard.particles.forEach(particle => {
      particle.baseAngle += particle.speed * deltaTime * (0.7 + attack * 0.4 + crest * 0.6 + (signals.loadPressureHigh ? 0.15 : 0) - release * 0.25);
      const intensityBias = 1 + hazard.intensity * 0.2;
      const pulseValue = 0.7 + attack * 0.1 + crest * 0.16 - release * 0.12 + Math.sin(hazard.time * 1.6 + particle.pulseOffset) * 0.09 * intensityBias;
      const jitter = signals.stabilityLow ? Math.sin(hazard.time * 12 + particle.baseAngle) * 0.03 : 0;
      const orbitalRadius = hazard.radius * particle.radiusFactor * (1 + (1 - envelope) * 0.08 * (particle.role === 'shard' ? 1.5 : 1));
      const verticalOffset = particle.role === 'orbit' ? 0.16 : 0.08;
      particle.mesh.position.set(
        Math.cos(particle.baseAngle + jitter) * orbitalRadius,
        Math.sin(particle.baseAngle + jitter) * verticalOffset * hazard.radius * (particle.role === 'orbit' ? 1 : 0.6),
        Math.sin(particle.baseAngle + jitter) * orbitalRadius
      );
      particle.mesh.material.opacity = Math.max(0.08, particle.baseOpacity * pulseValue * (signals.stabilityHigh ? 1.05 : 1));
      particle.mesh.scale.setScalar((particle.role === 'orbit' ? 1 : 0.55) + Math.sin(hazard.time + particle.baseAngle) * 0.03 * intensityBias);
    });
  }
  
  /**
   * Check if position is in danger zone
   */
  isInDangerZone(position) {
    for (const hazard of this.hazards.values()) {
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
  deactivateHazard(hazardRef) {
    const hazard = typeof hazardRef === 'string'
      ? this.hazards.get(hazardRef)
      : hazardRef && hazardRef.id
        ? this.hazards.get(hazardRef.id)
        : hazardRef;

    if (!hazard) return;
    hazard.active = false;

    // Handle both stormGroup (electrical storm) and group (gravitational anomaly)
    const groupToRemove = hazard.stormGroup || hazard.group;
    if (groupToRemove) this.root.remove(groupToRemove);

    if (Array.isArray(hazard.bolts)) {
      hazard.bolts.forEach(bolt => {
        if (Array.isArray(bolt.lines)) {
          bolt.lines.forEach(line => this.root.remove(line));
        } else if (bolt?.line) {
          this.root.remove(bolt.line);
        }
      });
    }

    this.hazards.delete(hazard.id);
  }

  dispose() {
    for (const hazard of this.hazards.values()) {
      this.deactivateHazard(hazard);
    }

    this.hazards.clear();
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

  _getHazardPalette(type) {
    switch (type) {
      case 'electricalStorm':
        return {
          core: HAZARD_PALETTE.coreWhite,
          edge: HAZARD_PALETTE.electricEdge,
          aura: HAZARD_PALETTE.primaryCyan,
          shadow: HAZARD_PALETTE.stormShadow
        };
      case 'gravitationalAnomaly':
        return {
          core: HAZARD_PALETTE.blackHole,
          ringPrimary: HAZARD_PALETTE.primaryCyan,
          ringSecondary: HAZARD_PALETTE.quantumViolet,
          veil: HAZARD_PALETTE.softHalo
        };
      default:
        return {
          core: HAZARD_PALETTE.coreWhite,
          edge: HAZARD_PALETTE.electricEdge,
          aura: HAZARD_PALETTE.primaryCyan,
          shadow: HAZARD_PALETTE.stormShadow
        };
    }
  }

  _getHazardPhaseWeights(hazard) {
    const envelope = this._getHazardEnvelope(hazard);
    return {
      envelope,
      pulse: Math.sin(hazard.time * 1.8) * 0.12 + 1.0,
      slowPulse: Math.sin(hazard.time * 0.95) * 0.06 + 1.0
    };
  }

  _smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  _getHazardPhaseState(hazard) {
    const t = (hazard.time % 4) / 4;
    const attack = this._smoothstep(0.0, 0.18, t);
    const crest = this._smoothstep(0.18, 0.72, t) * (1 - this._smoothstep(0.72, 1.0, t));
    const release = this._smoothstep(0.72, 1.0, t);
    return { t, attack, crest, release };
  }

  _getHazardLODScale(hazard) {
    if (!this.camera || !hazard.position) return 1;
    const distance = this.camera.position.distanceTo(hazard.position);
    const threshold = Math.max(30, hazard.radius * 10);
    const raw = 1 - Math.min(1, Math.max(0, (distance - 20) / threshold));
    return Math.max(0.28, raw) * (0.5 + 0.5 * Math.min(1, hazard.intensity));
  }

  _getHazardEnvelope(hazard) {
    const envelope = this.hazardEnvelope;
    const phase = (hazard.time % 4) / 4;
    if (phase < envelope.birth) {
      return phase / envelope.birth;
    }
    if (phase < envelope.birth + envelope.crest) {
      return 1;
    }
    if (phase < envelope.birth + envelope.crest + envelope.decay) {
      return 1 - ((phase - envelope.birth - envelope.crest) / envelope.decay);
    }
    const after = (phase - envelope.birth - envelope.crest - envelope.decay) / envelope.afterglow;
    return Math.max(0, 1 - after);
  }

  _getHazardSignalModifiers() {
    return {
      corruptionHigh: this._isSignalActive('corruption.high'),
      loadPressureHigh: this._isSignalActive('loadPressure.high'),
      stabilityLow: this._isSignalActive('stability.low'),
      stabilityHigh: this._isSignalActive('stability.high')
    };
  }

  _emitHazardEvent(eventName, hazard) {
    const bus = this.metricBus;
    if (!bus || !eventName || !hazard) return;

    const eventData = this._getHazardEventData(hazard);
    const payload = {
      type: hazard.type,
      identity: hazard.identity || eventData.identity,
      title: hazard.title || eventData.title,
      subtitle: hazard.subtitle || eventData.subtitle,
      visualTone: hazard.visualTone || eventData.visualTone,
      intensity: hazard.intensity ?? hazard.strength ?? 1,
      radius: hazard.radius,
      source: 'EnvironmentalHazards',
      timestamp: performance.now(),
      detail: eventData.detail
    };

    if (typeof bus.emit === 'function') {
      bus.emit(eventName, payload);
      return;
    }

    if (typeof bus.publish === 'function') {
      bus.publish(eventName, payload);
    }
  }

  _getHazardEventData(hazard) {
    switch (hazard.type) {
      case 'electricalStorm':
        return {
          identity: 'thunder crown',
          title: 'Thunder Crown',
          subtitle: 'Cathedral storm of high pressure',
          visualTone: 'electric',
          detail: 'A majestic storm event with rhythmic energy and charged authority.'
        };
      case 'gravitationalAnomaly':
        return {
          identity: 'singularity eclipse',
          title: 'Singularity Eclipse',
          subtitle: 'Silent gravitational authority',
          visualTone: 'cosmic',
          detail: 'A deep anomaly event drawing the environment into a ritual orbit.'
        };
      default:
        return {
          identity: hazard.type,
          title: 'Environmental Hazard',
          subtitle: 'Unspecified event',
          visualTone: 'neutral',
          detail: 'A generic hazard event.'
        };
    }
  }
}
