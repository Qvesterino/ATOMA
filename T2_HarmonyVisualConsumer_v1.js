/**
 * T2-003: HARMONY VISUAL CONSUMER v1.0
 * 
 * TIER 2 VISUAL INTEGRATION — HARMONY FEEDBACK LAYER
 * Renders visual feedback from HarmonyStabilizationSystem_v1 runtime data
 * 
 * ✅ RENDERING ONLY — Zero gameplay logic
 * ✅ Read-only consumer of harmony.harmonyLevel from HarmonyStabilizationSystem_v1
 * ✅ Three visual features:
 *    1. Cyan aura around high-harmony nodes (0.6–1.0)
 *    2. Oasis zones as soft radial bloom (visual zone markers)
 *    3. Healing pulses emanating from high-harmony nodes
 * ✅ Safe to disable/enable at any time
 * ✅ No modifications to core systems
 */

import * as THREE from 'three';

export class T2_HarmonyVisualConsumer_v1 {
  constructor(scene, harmonySystem) {
    this.scene = scene;
    this.harmonySystem = harmonySystem; // Read-only reference to HarmonyStabilizationSystem_v1
    
    this.enabled = true;
    this.config = {
      // Cyan Aura Settings
      auraCyanColor: new THREE.Color(0x00ffdd),
      auraIntensityScale: 1.0,
      auraMinOpacity: 0.1,
      auraMaxOpacity: 0.5,
      auraRadiusScale: 1.2,
      auraBreathingSpeed: 0.8,
      
      // Oasis Zone Settings
      oasisZoneRadius: 15,
      oasisZoneCyanGlow: new THREE.Color(0x00ddff),
      oasisZoneOpacity: 0.15,
      oasisZoneBreathingFrequency: 0.3,
      
      // Healing Pulse Settings
      pulseEmitRate: 2.0, // pulses per second from high-harmony nodes
      pulseSpeed: 8.0, // units per second
      pulseRadius: 0.3,
      pulseColor: new THREE.Color(0x00ffdd),
      pulseMaxDistance: 50,
      pulseLifetime: 3.0 // seconds
    };
    
    this.registry = {
      nodeAuras: new Map(),        // node → aura visual data
      oasisZones: new Map(),       // harmony region → zone mesh
      activeHealingPulses: [],     // list of active pulse objects
      totalPulsesCreated: 0,
      time: 0
    };
    
    console.log('[T2_HarmonyVisualConsumer_v1] Initialized (harmony visual feedback layer)');
  }
  
  /**
   * Enable/disable all harmony visuals
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    this.registry.nodeAuras.forEach((data) => {
      if (data.auraMesh) data.auraMesh.visible = enabled;
    });
    this.registry.oasisZones.forEach((zone) => {
      zone.visible = enabled;
    });
  }
  
  /**
   * Register a node for harmony visual tracking
   * Called when node is created or spawned
   */
  registerNode(node) {
    if (!node || this.registry.nodeAuras.has(node.uuid)) return;
    
    // Create cyan aura container
    const auraGroup = new THREE.Group();
    auraGroup.name = `harmony-aura-${node.uuid}`;
    
    // Aura mesh (glowing sphere)
    const auraGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const auraMaterial = new THREE.MeshBasicMaterial({
      color: this.config.auraCyanColor,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
      depthWrite: false
    });
    const auraMesh = new THREE.Mesh(auraGeometry, auraMaterial);
    auraGroup.add(auraMesh);
    node.add(auraGroup);
    
    this.registry.nodeAuras.set(node.uuid, {
      node: node,
      auraMesh: auraMesh,
      auraMaterial: auraMaterial,
      breathingPhase: Math.random() * Math.PI * 2,
      lastHarmonyLevel: 0
    });
  }
  
  /**
   * Create an oasis zone visual at a location
   * Called by harmony system when oasis is stabilized
   */
  createOasisZone(position, harmonyIntensity = 0.8) {
    if (!this.enabled) return;
    
    const zoneGeometry = new THREE.SphereGeometry(
      this.config.oasisZoneRadius,
      32,
      32
    );
    
    const zoneMaterial = new THREE.MeshBasicMaterial({
      color: this.config.oasisZoneCyanGlow,
      transparent: true,
      opacity: this.config.oasisZoneOpacity * Math.max(0.3, harmonyIntensity),
      side: THREE.BackSide,
      depthWrite: false
    });
    
    const zoneMesh = new THREE.Mesh(zoneGeometry, zoneMaterial);
    zoneMesh.position.copy(position);
    zoneMesh.userData = {
      isOasisZone: true,
      harmonyIntensity: harmonyIntensity,
      createdAt: this.registry.time,
      breathingPhase: Math.random() * Math.PI * 2
    };
    
    this.scene.add(zoneMesh);
    
    // Register for tracking
    const zoneKey = `oasis-${position.x.toFixed(1)}-${position.y.toFixed(1)}-${position.z.toFixed(1)}`;
    this.registry.oasisZones.set(zoneKey, zoneMesh);
    
    return zoneMesh;
  }
  
  /**
   * Emit a healing pulse from a high-harmony node
   * Called during update() when conditions are met
   */
  emitHealingPulse(fromNode, targetPosition = null) {
    if (!this.enabled || !fromNode) return;
    
    const pulseGeometry = new THREE.SphereGeometry(this.config.pulseRadius, 16, 16);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: this.config.pulseColor,
      transparent: true,
      opacity: 0.8,
      emissive: this.config.pulseColor,
      emissiveIntensity: 0.6,
      depthWrite: false
    });
    
    const pulseMesh = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulseMesh.position.copy(fromNode.position);
    
    this.scene.add(pulseMesh);
    
    // Direction: toward target or random
    let direction = new THREE.Vector3(0, 0, 1);
    if (targetPosition) {
      direction = targetPosition.clone().sub(fromNode.position).normalize();
    } else {
      direction = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();
    }
    
    const pulse = {
      mesh: pulseMesh,
      position: pulseMesh.position.clone(),
      direction: direction,
      speed: this.config.pulseSpeed,
      lifetime: this.config.pulseLifetime,
      ageSeconds: 0,
      fromNode: fromNode
    };
    
    this.registry.activeHealingPulses.push(pulse);
    this.registry.totalPulsesCreated++;
    
    return pulse;
  }
  
  /**
   * Main update loop — call once per frame
   * Reads harmony data and renders visual feedback
   */
  update(deltaTime, aiNodes, harmonySystem) {
    if (!this.enabled) return;
    
    this.registry.time += deltaTime;
    
    // ===== PART 1: Update Cyan Auras for High-Harmony Nodes =====
    if (aiNodes && aiNodes.nodes) {
      for (const node of aiNodes.nodes) {
        if (!node.userData) continue;
        
        // Register new nodes
        if (!this.registry.nodeAuras.has(node.uuid)) {
          this.registerNode(node);
        }
        
        const auraData = this.registry.nodeAuras.get(node.uuid);
        if (!auraData) continue;
        
        // Read harmony level from node (if available)
        const harmonyLevel = node.userData.harmonyLevel ?? 0;
        
        // Only show aura if harmony is above threshold (0.6)
        if (harmonyLevel >= 0.6) {
          const harmonyIntensity = Math.max(0, harmonyLevel - 0.6) / 0.4; // Normalize to [0, 1]
          
          // Breathing animation
          auraData.breathingPhase += deltaTime * this.config.auraBreathingSpeed;
          const breathing = 1.0 + Math.sin(auraData.breathingPhase) * 0.08;
          
          // Update aura visual
          const targetOpacity = this.config.auraMinOpacity + 
            (this.config.auraMaxOpacity - this.config.auraMinOpacity) * harmonyIntensity;
          
          auraData.auraMaterial.opacity = targetOpacity * breathing;
          auraData.auraMesh.scale.set(
            this.config.auraRadiusScale * breathing,
            this.config.auraRadiusScale * breathing,
            this.config.auraRadiusScale * breathing
          );
          auraData.auraMesh.visible = true;
          
          // Emit healing pulses from high-harmony nodes
          if (harmonyIntensity > 0.7) {
            // Emit pulses periodically
            const pulseInterval = 1.0 / this.config.pulseEmitRate;
            const timeSinceLastPulse = this.registry.time % pulseInterval;
            if (timeSinceLastPulse < deltaTime) {
              this.emitHealingPulse(node);
            }
          }
        } else {
          auraData.auraMesh.visible = false;
        }
        
        auraData.lastHarmonyLevel = harmonyLevel;
      }
    }
    
    // ===== PART 2: Update Oasis Zones =====
    this.registry.oasisZones.forEach((zone) => {
      if (!zone.userData.isOasisZone) return;
      
      // Breathing animation for oasis zones
      zone.userData.breathingPhase += deltaTime * this.config.oasisZoneBreathingFrequency;
      const breathing = 1.0 + Math.sin(zone.userData.breathingPhase) * 0.05;
      
      zone.material.opacity = this.config.oasisZoneOpacity * 
        zone.userData.harmonyIntensity * breathing;
    });
    
    // ===== PART 3: Update Healing Pulses =====
    for (let i = this.registry.activeHealingPulses.length - 1; i >= 0; i--) {
      const pulse = this.registry.activeHealingPulses[i];
      
      pulse.ageSeconds += deltaTime;
      
      // Update position
      pulse.mesh.position.add(
        pulse.direction.clone().multiplyScalar(pulse.speed * deltaTime)
      );
      
      // Fade out as pulse dies
      const fadeStart = pulse.lifetime * 0.7;
      if (pulse.ageSeconds > fadeStart) {
        const fadeProgress = (pulse.ageSeconds - fadeStart) / (pulse.lifetime - fadeStart);
        pulse.mesh.material.opacity = 0.8 * (1.0 - fadeProgress);
      }
      
      // Remove expired pulse
      if (pulse.ageSeconds >= pulse.lifetime) {
        this.scene.remove(pulse.mesh);
        pulse.mesh.geometry.dispose();
        pulse.mesh.material.dispose();
        this.registry.activeHealingPulses.splice(i, 1);
      }
    }
  }
  
  /**
   * Cleanup all harmony visuals from scene
   */
  cleanup() {
    this.registry.nodeAuras.forEach((data) => {
      if (data.node && data.auraMesh) {
        data.node.remove(data.auraMesh.parent);
        data.auraMesh.geometry.dispose();
        data.auraMesh.material.dispose();
      }
    });
    this.registry.nodeAuras.clear();
    
    this.registry.oasisZones.forEach((zone) => {
      this.scene.remove(zone);
      zone.geometry.dispose();
      zone.material.dispose();
    });
    this.registry.oasisZones.clear();
    
    this.registry.activeHealingPulses.forEach((pulse) => {
      this.scene.remove(pulse.mesh);
      pulse.mesh.geometry.dispose();
      pulse.mesh.material.dispose();
    });
    this.registry.activeHealingPulses = [];
  }
  
  /**
   * Get status for debugging
   */
  getStatus() {
    return {
      enabled: this.enabled,
      activeAuras: this.registry.nodeAuras.size,
      activeOasisZones: this.registry.oasisZones.size,
      activeHealingPulses: this.registry.activeHealingPulses.length,
      totalPulsesCreated: this.registry.totalPulsesCreated
    };
  }
}
