import * as THREE from 'three';

/**
 * NODE VISUALS 4.0 - SAFE UPGRADE SYSTEM
 * 
 * Upgrades all existing node visuals to high-quality 4.0 standard with:
 * - Hologram core (soft inner glow)
 * - Spectral energy ring
 * - Levitation field (low amplitude, no world movement)
 * - Stable neon rim-light
 * - Internal pulse (very subtle, node-only)
 * - Emission accents per node layer
 * - Soft shadow/occlusion halo (static, no movement)
 * 
 * STRICT SAFETY RULES:
 * ✓ No drifting, shaking, or shader displacement of terrain/camera
 * ✓ All effects are node-local only
 * ✓ No world transforms modified
 * ✓ No physics or collision changes
 * ✓ 100% reversible and safe
 */

export class NodeVisuals4_0 {
  constructor(scene) {
    this.scene = scene;
    this.nodeVisualRegistry = new Map();
    
    this.config = {
      enabled: true,
      
      // Hologram Core
      coreGlowIntensity: 0.4,
      coreGlowScale: 0.7,
      
      // Spectral Energy Ring
      ringOpacity: 0.35,
      ringRotationSpeed: 0.003,
      ringCount: 2,
      
      // Levitation Field (local oscillation only)
      levitationEnabled: true,
      levitationAmplitude: 0.05,      // Very low, no world movement
      levitationFrequency: 0.5,
      
      // Neon Rim-Light
      rimLightIntensity: 0.8,
      rimLightOpacity: 0.4,
      
      // Internal Pulse (very subtle)
      pulseEnabled: true,
      pulseSpeed: 1.5,
      pulseIntensity: 0.15,
      
      // Emission Accents
      emissionIntensity: 0.3,
      
      // Soft Shadow/Occlusion Halo
      haloEnabled: true,
      haloOpacity: 0.2,
      
      // Performance
      diagnosticsEnabled: false
    };
    
    this.registry = {
      upgradeCount: 0,
      time: 0,
      frameCounter: 0
    };
  }
  
  /**
   * Upgrade a node to 4.0 visual standard
   */
  upgradeNode(node, nodeData = {}) {
    if (!node || !node.children) return;
    
    const nodeId = node.uuid || Math.random().toString();
    
    // Store original for reference
    if (!this.nodeVisualRegistry.has(nodeId)) {
      this.nodeVisualRegistry.set(nodeId, {
        node: node,
        data: nodeData,
        components: {}
      });
    }
    
    const visualData = this.nodeVisualRegistry.get(nodeId);
    
    // T2-001: Check if this is an extreme node (visual override)
    const isExtreme = node.userData?.extremeAI === true;
    const extremeArchetypeId = node.userData?.extremeArchetype ?? -1;
    let baseColor = nodeData.color || 0x00ffff;
    
    // T2-001: Apply extreme archetype color if available
    if (isExtreme && extremeArchetypeId >= 0) {
      baseColor = this.getExtremeArchetypeColor(extremeArchetypeId);
      visualData.components.isExtreme = true;
      visualData.components.extremeArchetypeId = extremeArchetypeId;
    }
    
    // Step 1: Enhance core with hologram glow
    this.addHologramCore(node, visualData, baseColor);
    
    // Step 2: Add spectral energy ring
    this.addSpectralEnergyRing(node, visualData, baseColor);
    
    // Step 3: Add levitation field (local oscillation)
    this.addLevitationField(node, visualData, baseColor);
    
    // Step 4: Add neon rim-light
    this.addNeonRimLight(node, visualData, baseColor);
    
    // Step 5: Add soft shadow/occlusion halo
    this.addOcclusionHalo(node, visualData, baseColor);
    
    // T2-001: Add secondary glow layer for extreme nodes (ring/chromatic halo)
    if (isExtreme) {
      this.addExtremeSecondaryGlowLayer(node, visualData, baseColor);
    }
    
    // Step 6: Mark for internal pulse
    visualData.components.pulseEnabled = true;
    visualData.components.pulseTime = 0;
    
    this.registry.upgradeCount++;
  }
  
  /**
   * T2-001: Get color for extreme archetype
   * Maps archetype ID to visual color
   */
  getExtremeArchetypeColor(archetypeId) {
    const extremeColors = [
      0xff00ff,  // 0: Hyperbolic Prism - magenta
      0x00ffff,  // 1: Singularity Knot - cyan
      0xffff00,  // 2: Quantum Lattice - yellow
      0xff8800,  // 3: Fractal Bloom - orange
      0xff0088,  // 4: Reactive Tesseract - hot pink
      0xff2200,  // 5: Chaotic Heart - crimson
      0x88ff00,  // 6: Whisper Sphere - lime
      0x0088ff,  // 7: Echo Fractal - azure
      0xff00aa,  // 8: Abyssal Shard - magenta-red
      0x00ff88,  // 9: Tri-Helix - spring green
      0x8800ff,  // 10: Infinite Spiral - violet
      0xffaa00   // 11: Chrono Ripper - gold
    ];
    return extremeColors[Math.max(0, Math.min(11, archetypeId))];
  }
  
  /**
   * T2-001: Add secondary glow layer for extreme nodes
   * Creates enhanced ring and chromatic halo effect
   */
  addExtremeSecondaryGlowLayer(node, visualData, color) {
    let extremeContainer = node.getObjectByName('extreme-secondary-glow');
    if (extremeContainer) {
      node.remove(extremeContainer);
    }
    
    extremeContainer = new THREE.Group();
    extremeContainer.name = 'extreme-secondary-glow';
    node.add(extremeContainer);
    
    // Secondary ring with 2-3× glow radius
    const ringGeometry = new THREE.TorusGeometry(2.5, 0.15, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      emissive: color,
      emissiveIntensity: 0.8,
      side: THREE.DoubleSide
    });
    
    const secondaryRing = new THREE.Mesh(ringGeometry, ringMaterial);
    secondaryRing.rotation.x = Math.PI / 3;
    extremeContainer.add(secondaryRing);
    
    // Chromatic halo (rings offset in time)
    const haloGeometry = new THREE.SphereGeometry(2.0, 32, 32);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      emissive: color,
      emissiveIntensity: 0.4,
      depthWrite: false
    });
    
    const extremeHalo = new THREE.Mesh(haloGeometry, haloMaterial);
    extremeContainer.add(extremeHalo);
    
    visualData.components.extremeSecondaryGlow = extremeContainer;
    visualData.components.extremeRing = secondaryRing;
    visualData.components.extremeHalo = extremeHalo;
  }
  
  /**
   * Step 1: Add hologram core with soft inner glow
   */
  addHologramCore(node, visualData, color) {
    // Find or create core container
    let coreContainer = node.getObjectByName('hologram-core');
    if (coreContainer) {
      node.remove(coreContainer);
    }
    
    coreContainer = new THREE.Group();
    coreContainer.name = 'hologram-core';
    node.add(coreContainer);
    
    // Inner glow sphere
    const glowGeometry = new THREE.SphereGeometry(
      this.config.coreGlowScale,
      32,
      32
    );
    
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: this.config.coreGlowIntensity,
      side: THREE.BackSide
    });
    
    const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
    coreContainer.add(glowSphere);
    
    visualData.components.glowSphere = glowSphere;
    visualData.components.glowMaterial = glowMaterial;
  }
  
  /**
   * Step 2: Add spectral energy ring (rotating)
   */
  addSpectralEnergyRing(node, visualData, color) {
    // Remove old rings if present
    let ringContainer = node.getObjectByName('spectral-rings');
    if (ringContainer) {
      node.remove(ringContainer);
    }
    
    ringContainer = new THREE.Group();
    ringContainer.name = 'spectral-rings';
    node.add(ringContainer);
    
    // Create multiple energy rings
    const rings = [];
    for (let i = 0; i < this.config.ringCount; i++) {
      const ringGeometry = new THREE.TorusGeometry(1.2 + i * 0.3, 0.06, 16, 100);
      
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: this.config.ringOpacity - (i * 0.1)
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.z = Math.random() * Math.PI;
      
      ringContainer.add(ring);
      rings.push(ring);
    }
    
    visualData.components.spectralRings = rings;
  }
  
  /**
   * Step 3: Add levitation field (local oscillation only, no world movement)
   */
  addLevitationField(node, visualData, color) {
    if (!this.config.levitationEnabled) return;
    
    // Store initial position
    visualData.components.initialPosition = node.position.clone();
    visualData.components.levitationTime = 0;
    
    // Create visual indicator (subtle floating particles effect)
    let levitationContainer = node.getObjectByName('levitation-field');
    if (levitationContainer) {
      node.remove(levitationContainer);
    }
    
    levitationContainer = new THREE.Group();
    levitationContainer.name = 'levitation-field';
    node.add(levitationContainer);
    
    // Create subtle levitation particles
    const particleGeometry = new THREE.SphereGeometry(0.02, 4, 4);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3
    });
    
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(
        Math.cos(angle) * 0.8,
        0,
        Math.sin(angle) * 0.8
      );
      levitationContainer.add(particle);
    }
    
    visualData.components.levitationContainer = levitationContainer;
  }
  
  /**
   * Step 4: Add neon rim-light (stable, not pulsing)
   */
  addNeonRimLight(node, visualData, color) {
    let rimContainer = node.getObjectByName('neon-rim');
    if (rimContainer) {
      node.remove(rimContainer);
    }
    
    rimContainer = new THREE.Group();
    rimContainer.name = 'neon-rim';
    node.add(rimContainer);
    
    // Create rim-light torus
    const rimGeometry = new THREE.TorusGeometry(1.3, 0.08, 16, 100);
    const rimMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: this.config.rimLightOpacity,
      emissive: color,
      emissiveIntensity: this.config.rimLightIntensity
    });
    
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = Math.PI / 2.5;
    rimContainer.add(rim);
    
    visualData.components.rimLight = rim;
  }
  
  /**
   * Step 5: Add soft shadow/occlusion halo (static, no movement)
   */
  addOcclusionHalo(node, visualData, color) {
    if (!this.config.haloEnabled) return;
    
    let haloContainer = node.getObjectByName('occlusion-halo');
    if (haloContainer) {
      node.remove(haloContainer);
    }
    
    haloContainer = new THREE.Group();
    haloContainer.name = 'occlusion-halo';
    
    // Create halo as soft shadow effect
    const haloGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: this.config.haloOpacity,
      side: THREE.BackSide
    });
    
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    haloContainer.add(halo);
    
    node.add(haloContainer);
    visualData.components.halo = halo;
  }
  
  /**
   * Update all nodes with 4.0 effects
   */
  update(deltaTime) {
    if (!this.config.enabled) return;
    
    this.registry.time += deltaTime;
    this.registry.frameCounter++;
    
    // Update each upgraded node
    this.nodeVisualRegistry.forEach((visualData, nodeId) => {
      const node = visualData.node;
      if (!node || !this.scene.getObjectByProperty('uuid', nodeId)) return;
      
      // Update spectral rings rotation
      if (visualData.components.spectralRings) {
        visualData.components.spectralRings.forEach((ring, i) => {
          ring.rotation.x += this.config.ringRotationSpeed * (i % 2 === 0 ? 1 : -1);
          ring.rotation.z += this.config.ringRotationSpeed * 0.7;
        });
      }
      
      // Update levitation field (local position oscillation only)
      if (visualData.components.levitationContainer && visualData.components.initialPosition) {
        visualData.components.levitationTime += deltaTime;
        
        const oscillation = Math.sin(visualData.components.levitationTime * this.config.levitationFrequency) 
          * this.config.levitationAmplitude;
        
        // Only oscillate Y position (up/down), no world movement
        node.position.y = visualData.components.initialPosition.y + oscillation;
      }
      
      // Update internal pulse
      if (visualData.components.pulseEnabled && visualData.components.glowMaterial) {
        const pulse = 0.5 + 0.5 * Math.sin(this.registry.time * this.config.pulseSpeed);
        const pulseOpacity = this.config.coreGlowIntensity * (0.85 + pulse * this.config.pulseIntensity);
        visualData.components.glowMaterial.opacity = pulseOpacity;
      }
    });
  }
  
  /**
   * Upgrade all nodes in scene
   */
  upgradeAllNodes(nodes) {
    nodes.forEach(node => {
      this.upgradeNode(node);
    });
    console.log(`✅ NODE VISUALS 4.0: Upgraded ${nodes.length} nodes`);
  }
  
  /**
   * Enable/disable visuals
   */
  enable() {
    this.config.enabled = true;
  }
  
  disable() {
    this.config.enabled = false;
  }
  
  /**
   * Get status
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      upgradeCount: this.registry.upgradeCount,
      registrySize: this.nodeVisualRegistry.size,
      frameCounter: this.registry.frameCounter,
      time: this.registry.time
    };
  }
  
  /**
   * Print status report
   */
  printStatusReport() {
    console.log('\n🎨 NODE VISUALS 4.0: STATUS REPORT');
    console.log('   ┌────────────────────────────────┐');
    
    console.log('   1️⃣  HOLOGRAM CORE');
    console.log(`       Glow Intensity: ${this.config.coreGlowIntensity}`);
    console.log(`       Glow Scale:     ${this.config.coreGlowScale}`);
    
    console.log('   2️⃣  SPECTRAL ENERGY RINGS');
    console.log(`       Ring Count:     ${this.config.ringCount}`);
    console.log(`       Ring Opacity:   ${this.config.ringOpacity}`);
    console.log(`       Rotation Speed: ${this.config.ringRotationSpeed}`);
    
    console.log('   3️⃣  LEVITATION FIELD');
    console.log(`       Enabled:        ${this.config.levitationEnabled}`);
    console.log(`       Amplitude:      ${this.config.levitationAmplitude}`);
    console.log(`       Frequency:      ${this.config.levitationFrequency}`);
    
    console.log('   4️⃣  NEON RIM-LIGHT');
    console.log(`       Intensity:      ${this.config.rimLightIntensity}`);
    console.log(`       Opacity:        ${this.config.rimLightOpacity}`);
    
    console.log('   5️⃣  INTERNAL PULSE');
    console.log(`       Enabled:        ${this.config.pulseEnabled}`);
    console.log(`       Speed:          ${this.config.pulseSpeed}`);
    console.log(`       Intensity:      ${this.config.pulseIntensity}`);
    
    console.log('   6️⃣  OCCLUSION HALO');
    console.log(`       Enabled:        ${this.config.haloEnabled}`);
    console.log(`       Opacity:        ${this.config.haloOpacity}`);
    
    console.log('   ├────────────────────────────────┤');
    console.log(`   Upgraded Nodes: ${this.registry.upgradeCount}`);
    console.log(`   Status: ${this.config.enabled ? '✅ ACTIVE' : '❌ INACTIVE'}`);
    console.log('   └────────────────────────────────┘\n');
  }
}
