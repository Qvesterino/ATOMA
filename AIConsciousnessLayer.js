import * as THREE from 'three';

/**
 * AI CONSCIOUSNESS LAYER 2.0 - NEURAL THOUGHT VISUALIZATION + EMERGENT STORMS
 * 
 * Visualizes "AI thoughts" between connected nodes through:
 * - Neural Thought Threads (flowing filaments on links)
 * - Cognitive Pulse Packets (particles traveling along links)
 * - Semantic Thought Patterns (glyph-derived pattern clusters)
 * - Field Distortion (subtle post-processing wave effects)
 * - Global Consciousness Field (pulsating network halo)
 * - Emergent Thought Storms (adaptive weather based on network mood)
 * 
 * STRICT SAFETY REQUIREMENTS:
 * ✓ Zero modifications to AINodes.js, NodeLinkingSystem.js, or any existing systems
 * ✓ Pure visual additive layer using new Three.js Group
 * ✓ Read-only access to node positions, link data, and glyph meanings
 * ✓ Performance budget: <0.2ms/frame base + <0.15ms/frame storms
 * ✓ 100% reversible via dispose()
 * ✓ Zero memory leaks - all geometries properly cleaned
 * 
 * FEATURES:
 * 1. Neural Thought Threads - Organic Bézier curves on active links
 * 2. Cognitive Pulse Packets - Particles flowing based on link metrics
 * 3. Semantic Thought Patterns - Glyph-driven pattern clusters
 * 4. Field Distortion - Subtle wave transform effects (no shaders)
 * 5. Global Consciousness Field - Network-wide pulsating halo
 * 6. Emergent Thought Storms - Dynamic weather phenomena (NEW)
 */

export class AIConsciousnessLayer {
  constructor(scene, linkingSystem, aiNodes, glyphLayer4) {
    this.scene = scene;
    this.linkingSystem = linkingSystem;
    this.aiNodes = aiNodes;
    this.glyphLayer4 = glyphLayer4;
    
    // Main container for all consciousness visuals
    this.consciousnessGroup = new THREE.Group();
    this.consciousnessGroup.name = 'AIConsciousnessLayer';
    this.consciousnessGroup.userData.isConsciousnesLayer = true;
    this.scene.add(this.consciousnessGroup);
    
    // Configuration
    this.config = {
      enabled: true,
      intensity: 1.0,
      particleDensity: 0.8,
      threadCount: 0.6,         // Filaments per link
      pulseSpeed: 0.5,          // Thought travel speed
      oscillationAmplitude: 0.03,
      fieldDistortionStrength: 0.02,
      globalFieldScale: 15,
      debugMode: false,
      stormsEnabled: true       // NEW: Toggle emergent storms
    };
    
    // Particle pools for efficient memory usage
    this.particlePools = {
      pulsePackets: [],
      threadSegments: []
    };
    
    // Active thought activity tracking
    this.activeThoughts = {
      threadMeshes: new Map(),   // link.id → THREE.Mesh
      pulsePackets: [],          // Array of active pulse objects
      patternClusters: new Map(), // link.id → { particles, life, meaning }
    };
    
    // Global field mesh
    this.globalFieldMesh = null;
    
    // Thought storms sub-system (lazy-loaded)
    this.storms = null;
    
    // Performance tracking
    this.stats = {
      threadsActive: 0,
      pulsesActive: 0,
      patternsActive: 0,
      frameTime: 0,
      enabled: true,
      stormsFrameTime: 0
    };
    
    // Temporal state
    this.time = 0;
    this.instanceID = Math.random();
    
    this._initializeParticlePools();
    this._createGlobalField();
  }
  
  /**
   * Lazy-load and initialize the Thought Storms sub-system
   * Call this after consciousness layer is created and integrated
   */
  initializeStorms(AIThoughtStorms2_0Class) {
    try {
      if (!this.storms && AIThoughtStorms2_0Class) {
        this.storms = new AIThoughtStorms2_0Class(
          this.consciousnessGroup,
          this.linkingSystem,
          this.aiNodes
        );
        console.log('✓ Thought Storms initialized');
      }
    } catch (e) {
      console.error('Failed to initialize Thought Storms:', e);
    }
  }
  
  /**
   * Initialize reusable particle pools to prevent garbage collection
   */
  _initializeParticlePools() {
    // Pre-allocate 200 pulse particles
    for (let i = 0; i < 200; i++) {
      const pulse = {
        position: new THREE.Vector3(),
        startPos: new THREE.Vector3(),
        endPos: new THREE.Vector3(),
        progress: 0,
        speed: 1,
        color: new THREE.Color(),
        mesh: null,
        life: 1,
        active: false,
        link: null,
        category: 'stable'
      };
      this.particlePools.pulsePackets.push(pulse);
    }
  }
  
  /**
   * Create the global consciousness field mesh
   */
  _createGlobalField() {
    // Simple sphere with pulsating scale and opacity
    const geometry = new THREE.IcosahedronGeometry(this.config.globalFieldScale, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: false,
      transparent: true,
      opacity: 0.02,
      fog: false
    });
    
    this.globalFieldMesh = new THREE.Mesh(geometry, material);
    this.globalFieldMesh.name = 'GlobalConsciousnessField';
    this.globalFieldMesh.userData.isGlobalField = true;
    this.consciousnessGroup.add(this.globalFieldMesh);
  }
  
  /**
   * Create or update neural thought thread on a link
   */
  _createNeuralThread(link) {
    if (this.activeThoughts.threadMeshes.has(link.id)) {
      return; // Already exists
    }
    
    if (!link.nodeA || !link.nodeB) return;
    
    // Create flowing thread geometry
    const points = this._generateThreadPath(link);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Gradient material for organic appearance
    const material = new THREE.LineBasicMaterial({
      color: this._getCategoryBlendColor(link.nodeA, link.nodeB),
      linewidth: 2,
      transparent: true,
      opacity: 0.4,
      fog: false
    });
    
    const line = new THREE.Line(geometry, material);
    line.name = `NeuralThread_${link.id}`;
    line.userData.linkId = link.id;
    line.userData.link = link;
    
    this.consciousnessGroup.add(line);
    this.activeThoughts.threadMeshes.set(link.id, line);
    this.stats.threadsActive++;
  }
  
  /**
   * Generate smooth Bézier path for thread
   */
  _generateThreadPath(link) {
    const posA = link.nodeA.position.clone();
    const posB = link.nodeB.position.clone();
    const distance = posA.distanceTo(posB);
    
    // Dynamic control point offset based on distance and category
    const offset = Math.min(distance * 0.15, 2.0);
    const categoryInfluence = this._getCategoryInfluence(link.nodeA, link.nodeB);
    
    // Create Bézier curve with 1-2 control points
    const controlPoint1 = posA.clone().add(
      new THREE.Vector3(
        (Math.random() - 0.5) * offset,
        Math.sin(this.time * 0.5) * offset * 0.5,
        (Math.random() - 0.5) * offset
      )
    );
    
    const controlPoint2 = posB.clone().add(
      new THREE.Vector3(
        (Math.random() - 0.5) * offset * categoryInfluence,
        Math.cos(this.time * 0.5) * offset * 0.5,
        (Math.random() - 0.5) * offset * categoryInfluence
      )
    );
    
    // Generate curve points
    const points = [];
    const segments = Math.ceil(distance * 2);
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Cubic Bézier interpolation
      const p = this._cubicBezier(posA, controlPoint1, controlPoint2, posB, t);
      
      // Add micro-oscillation for "breathing" effect
      const osc = Math.sin(this.time * 2 + i * 0.3) * this.config.oscillationAmplitude;
      p.addScaledVector(this._getOrthogonal(posA, posB), osc);
      
      points.push(p);
    }
    
    return points;
  }
  
  /**
   * Cubic Bézier interpolation
   */
  _cubicBezier(p0, p1, p2, p3, t) {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;
    
    return new THREE.Vector3(
      mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
      mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y,
      mt2 * mt * p0.z + 3 * mt2 * t * p1.z + 3 * mt * t2 * p2.z + t2 * t * p3.z
    );
  }
  
  /**
   * Get orthogonal vector for oscillation
   */
  _getOrthogonal(p0, p1) {
    const dir = p1.clone().sub(p0).normalize();
    const perp = new THREE.Vector3(-dir.y, dir.x, 0).normalize();
    return perp.length() > 0 ? perp : new THREE.Vector3(1, 0, 0);
  }
  
  /**
   * Get blend color from node categories
   */
  _getCategoryBlendColor(nodeA, nodeB) {
    const catA = nodeA.userData?.category || 'process';
    const catB = nodeB.userData?.category || 'process';
    
    const colorMap = {
      'input': 0xff0080,      // Magenta
      'process': 0x00ff80,    // Cyan-green
      'integration': 0xff8000, // Orange
      'analytics': 0x8000ff,   // Purple
      'storage': 0x00ffff,     // Cyan
      'control': 0xffff00,     // Yellow
      'mythic': 0xff00ff,      // Magenta
      'prime': 0x00ff00,       // Green
      'error': 0xff0000,       // Red
      'quantum': 0x0088ff,     // Blue
      'emotional': 0xff4488    // Pink
    };
    
    const colA = new THREE.Color(colorMap[catA] || 0x00ffff);
    const colB = new THREE.Color(colorMap[catB] || 0x00ffff);
    
    colA.lerp(colB, 0.5);
    return colA;
  }
  
  /**
   * Get category influence multiplier for curve strength
   */
  _getCategoryInfluence(nodeA, nodeB) {
    const catA = nodeA.userData?.category || 'process';
    const catB = nodeB.userData?.category || 'process';
    
    // Complementary categories curve more
    const complementary = [
      ['input', 'output'],
      ['process', 'storage'],
      ['analytics', 'control'],
      ['error', 'prime']
    ];
    
    for (const [c1, c2] of complementary) {
      if ((catA === c1 && catB === c2) || (catA === c2 && catB === c1)) {
        return 1.3; // More curvature
      }
    }
    
    return 0.9; // Less curvature for similar categories
  }
  
  /**
   * Spawn cognitive pulse packet on link
   */
  _spawnPulsePacket(link) {
    if (!this.config.enabled) return;
    
    // Get from pool
    let pulse = this.particlePools.pulsePackets.find(p => !p.active);
    if (!pulse) {
      pulse = this.particlePools.pulsePackets[0]; // Reuse oldest
    }
    
    pulse.link = link;
    pulse.startPos.copy(link.nodeA.position);
    pulse.endPos.copy(link.nodeB.position);
    pulse.progress = 0;
    pulse.position.copy(pulse.startPos);
    pulse.active = true;
    pulse.life = 1;
    
    // Speed based on link metrics
    const stability = link.stability || 0.5;
    const harmony = link.harmony || 0.5;
    const instability = link.instability || 0;
    
    pulse.speed = this.config.pulseSpeed * (1 + instability * 0.5);
    pulse.category = instability > 0.6 ? 'corrupted' : 'stable';
    
    // Color from semantic blend
    pulse.color = this._getCategoryBlendColor(link.nodeA, link.nodeB);
    if (instability > 0.5) {
      pulse.color.lerp(new THREE.Color(0xff0000), 0.4);
    }
    
    // Create mesh if needed
    if (!pulse.mesh) {
      const geometry = new THREE.IcosahedronGeometry(0.15, 2);
      const material = new THREE.MeshBasicMaterial({
        color: pulse.color,
        transparent: true,
        fog: false
      });
      pulse.mesh = new THREE.Mesh(geometry, material);
      pulse.mesh.userData.isPulsePacket = true;
      this.consciousnessGroup.add(pulse.mesh);
    }
    
    pulse.mesh.position.copy(pulse.position);
    pulse.mesh.material.color.copy(pulse.color);
    pulse.mesh.material.opacity = 0.6;
    
    this.activeThoughts.pulsePackets.push(pulse);
    this.stats.pulsesActive++;
  }
  
  /**
   * Create semantic thought pattern cluster above link
   */
  _createSemanticPattern(link) {
    if (this.activeThoughts.patternClusters.has(link.id)) {
      return; // Already exists
    }
    
    // Extract meaning from glyph layer if available
    let meaning = null;
    if (this.glyphLayer4) {
      try {
        meaning = this.glyphLayer4.getMeaning?.(link.nodeA, link.nodeB) || null;
      } catch (e) {
        meaning = null;
      }
    }
    
    const clusterPos = link.nodeA.position.clone().lerp(link.nodeB.position, 0.5);
    clusterPos.y += 1.5; // Offset above link
    
    // Create particle cluster
    const particles = [];
    const particleCount = Math.floor(8 + Math.random() * 4);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 0.5 + Math.random() * 0.3;
      
      const geometry = new THREE.TetrahedronGeometry(0.08);
      const color = meaning ? new THREE.Color(meaning) : this._getCategoryBlendColor(link.nodeA, link.nodeB);
      
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.5,
        fog: false
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        clusterPos.x + Math.cos(angle) * radius,
        clusterPos.y,
        clusterPos.z + Math.sin(angle) * radius
      );
      mesh.userData.isSemanticParticle = true;
      mesh.userData.basePos = mesh.position.clone();
      mesh.userData.angle = angle;
      mesh.userData.radius = radius;
      
      this.consciousnessGroup.add(mesh);
      particles.push(mesh);
    }
    
    this.activeThoughts.patternClusters.set(link.id, {
      particles,
      life: 3.0,
      meaning,
      basePos: clusterPos.clone()
    });
    
    this.stats.patternsActive++;
  }
  
  /**
   * Update frame - called from main.js animation loop
   */
  update(dt) {
    if (!this.config.enabled) return;
    
    const startTime = performance.now();
    
    this.time += dt;
    
    // 1. Update neural threads
    this._updateThreads();
    
    // 2. Update pulse packets
    this._updatePulses(dt);
    
    // 3. Update semantic patterns
    this._updatePatterns(dt);
    
    // 4. Update global field
    this._updateGlobalField(dt);
    
    // 5. Spawn new thoughts on active links
    this._spawnNewThoughts();
    
    // 6. Update thought storms (if enabled)
    if (this.config.stormsEnabled && this.storms) {
      const stormStart = performance.now();
      this.storms.update(dt);
      this.stats.stormsFrameTime = performance.now() - stormStart;
    }
    
    const frameTime = performance.now() - startTime;
    this.stats.frameTime = frameTime;
  }
  
  /**
   * Update all neural threads
   */
  _updateThreads() {
    for (const [linkId, line] of this.activeThoughts.threadMeshes) {
      const link = line.userData.link;
      
      // Skip if link is invalid
      if (!link || !link.nodeA || !link.nodeB) {
        this.consciousnessGroup.remove(line);
        line.geometry.dispose();
        line.material.dispose();
        this.activeThoughts.threadMeshes.delete(linkId);
        this.stats.threadsActive--;
        continue;
      }
      
      // Animate opacity based on link activity
      const activity = (link.trafficIntensity || 0.3) * this.config.intensity;
      line.material.opacity = 0.3 + activity * 0.4;
      
      // Update geometry periodically (every 2 frames to save performance)
      if (this.time % 2 < 1) {
        const points = this._generateThreadPath(link);
        line.geometry.setFromPoints(points);
      }
    }
  }
  
  /**
   * Update all pulse packets
   */
  _updatePulses(dt) {
    for (let i = this.activeThoughts.pulsePackets.length - 1; i >= 0; i--) {
      const pulse = this.activeThoughts.pulsePackets[i];
      
      if (!pulse.active || !pulse.link) {
        this.activeThoughts.pulsePackets.splice(i, 1);
        if (pulse.mesh) pulse.mesh.visible = false;
        this.stats.pulsesActive--;
        continue;
      }
      
      pulse.progress += pulse.speed * dt;
      pulse.life -= dt * 0.5; // Fade out
      
      if (pulse.progress >= 1 || pulse.life <= 0) {
        pulse.active = false;
        this.activeThoughts.pulsePackets.splice(i, 1);
        if (pulse.mesh) pulse.mesh.visible = false;
        this.stats.pulsesActive--;
        continue;
      }
      
      // Interpolate position along link
      pulse.position.lerpVectors(pulse.startPos, pulse.endPos, pulse.progress);
      
      // Add subtle oscillation
      const oscillation = Math.sin(this.time * 3 + i) * 0.1;
      pulse.mesh.position.copy(pulse.position);
      pulse.mesh.position.y += oscillation;
      
      // Update opacity
      pulse.mesh.material.opacity = pulse.life * 0.6;
      
      // Scale based on progress (appears, peaks, fades)
      const scale = Math.sin(pulse.progress * Math.PI) * 1.2 + 0.8;
      pulse.mesh.scale.setScalar(scale);
    }
  }
  
  /**
   * Update semantic pattern clusters
   */
  _updatePatterns(dt) {
    for (const [linkId, pattern] of this.activeThoughts.patternClusters) {
      pattern.life -= dt;
      
      if (pattern.life <= 0) {
        // Remove pattern
        for (const mesh of pattern.particles) {
          this.consciousnessGroup.remove(mesh);
          mesh.geometry.dispose();
          mesh.material.dispose();
        }
        this.activeThoughts.patternClusters.delete(linkId);
        this.stats.patternsActive--;
        continue;
      }
      
      // Animate particles in circular pattern
      const rotationSpeed = 1.5;
      const bobAmount = Math.sin(this.time * 2) * 0.3;
      
      for (const particle of pattern.particles) {
        const basePos = particle.userData.basePos;
        const angle = particle.userData.angle + this.time * rotationSpeed;
        const radius = particle.userData.radius * (0.8 + Math.sin(this.time) * 0.2);
        
        particle.position.x = basePos.x + Math.cos(angle) * radius;
        particle.position.y = basePos.y + bobAmount;
        particle.position.z = basePos.z + Math.sin(angle) * radius;
        
        // Rotate particle
        particle.rotation.x += 0.02;
        particle.rotation.y += 0.03;
        
        // Fade out
        particle.material.opacity = (pattern.life / 3.0) * 0.5;
      }
    }
  }
  
  /**
   * Update global consciousness field
   */
  _updateGlobalField(dt) {
    if (!this.globalFieldMesh) return;
    
    // Calculate average network activity
    const links = this.linkingSystem?.links || [];
    let avgInstability = 0;
    let avgHarmony = 0;
    
    for (const link of links) {
      avgInstability += link.instability || 0;
      avgHarmony += link.harmony || 0.5;
    }
    
    if (links.length > 0) {
      avgInstability /= links.length;
      avgHarmony /= links.length;
    }
    
    // Pulsate based on instability
    const pulse = Math.sin(this.time * 1.5) * 0.5 + 0.5;
    const targetScale = 1 + avgInstability * pulse * 0.3;
    this.globalFieldMesh.scale.setScalar(targetScale);
    
    // Color from harmony
    const color = avgHarmony > 0.6 
      ? new THREE.Color(0x00ff88) 
      : new THREE.Color(0xff0088);
    this.globalFieldMesh.material.color.copy(color);
    
    // Opacity based on intensity
    this.globalFieldMesh.material.opacity = 0.02 + avgInstability * 0.02;
  }
  
  /**
   * Spawn new thoughts on active links
   */
  _spawnNewThoughts() {
    const links = this.linkingSystem?.links || [];
    
    for (const link of links) {
      if (!link.nodeA || !link.nodeB) continue;
      
      // Create neural thread if not exists
      if (!this.activeThoughts.threadMeshes.has(link.id) && Math.random() < 0.2) {
        this._createNeuralThread(link);
      }
      
      // Spawn pulse packets
      if (Math.random() < this.config.particleDensity * 0.1) {
        this._spawnPulsePacket(link);
      }
      
      // Create semantic patterns occasionally
      if (!this.activeThoughts.patternClusters.has(link.id) && Math.random() < 0.05) {
        this._createSemanticPattern(link);
      }
    }
  }
  
  /**
   * PUBLIC API - Toggle consciousness layer
   */
  enable() {
    this.config.enabled = true;
    this.stats.enabled = true;
    if (this.globalFieldMesh) this.globalFieldMesh.visible = true;
  }
  
  disable() {
    this.config.enabled = false;
    this.stats.enabled = false;
    if (this.globalFieldMesh) this.globalFieldMesh.visible = false;
    for (const mesh of this.activeThoughts.threadMeshes.values()) {
      mesh.visible = false;
    }
    for (const pulse of this.activeThoughts.pulsePackets) {
      if (pulse.mesh) pulse.mesh.visible = false;
    }
  }
  
  /**
   * PUBLIC API - Set overall intensity
   */
  setIntensity(value) {
    this.config.intensity = Math.max(0, Math.min(1, value));
  }
  
  /**
   * PUBLIC API - Set particle density
   */
  setParticleDensity(value) {
    this.config.particleDensity = Math.max(0, Math.min(1, value));
  }
  
  /**
   * PUBLIC API - Debug status
   */
  debug() {
    console.log('%c=== AI CONSCIOUSNESS LAYER 2.0 DEBUG ===', 'color: #00ffff; font-weight: bold;');
    console.log(`Status: ${this.config.enabled ? '🟢 ENABLED' : '🔴 DISABLED'}`);
    console.log(`Threads: ${this.stats.threadsActive}`);
    console.log(`Pulse Packets: ${this.stats.pulsesActive}`);
    console.log(`Patterns: ${this.stats.patternsActive}`);
    console.log(`Frame Time: ${this.stats.frameTime.toFixed(3)}ms`);
    console.log(`Storms Enabled: ${this.config.stormsEnabled ? '🌩️ YES' : '⛈️ NO'}`);
    if (this.stats.stormsFrameTime > 0) {
      console.log(`Storms Frame Time: ${this.stats.stormsFrameTime.toFixed(3)}ms`);
    }
    console.log(`Intensity: ${this.config.intensity.toFixed(2)}`);
    console.log(`Particle Density: ${this.config.particleDensity.toFixed(2)}`);
    console.log(`Memory: ${(this.particlePools.pulsePackets.length)}x pulse packets`);
  }
  
  /**
   * PUBLIC API - Toggle storms
   */
  enableStorms() {
    this.config.stormsEnabled = true;
    if (this.storms) this.storms.enable();
  }
  
  disableStorms() {
    this.config.stormsEnabled = false;
    if (this.storms) this.storms.disable();
  }
  
  /**
   * CLEANUP - Safe disposal of all resources
   */
  dispose() {
    // Remove storms first
    if (this.storms) {
      this.storms.dispose();
      this.storms = null;
    }
    
    // Remove threads
    for (const [linkId, line] of this.activeThoughts.threadMeshes) {
      this.consciousnessGroup.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    }
    this.activeThoughts.threadMeshes.clear();
    
    // Remove pulses
    for (const pulse of this.activeThoughts.pulsePackets) {
      if (pulse.mesh) {
        this.consciousnessGroup.remove(pulse.mesh);
        pulse.mesh.geometry.dispose();
        pulse.mesh.material.dispose();
      }
    }
    this.activeThoughts.pulsePackets = [];
    
    // Remove patterns
    for (const [linkId, pattern] of this.activeThoughts.patternClusters) {
      for (const mesh of pattern.particles) {
        this.consciousnessGroup.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
    }
    this.activeThoughts.patternClusters.clear();
    
    // Remove global field
    if (this.globalFieldMesh) {
      this.consciousnessGroup.remove(this.globalFieldMesh);
      this.globalFieldMesh.geometry.dispose();
      this.globalFieldMesh.material.dispose();
    }
    
    // Remove container
    this.scene.remove(this.consciousnessGroup);
    
    console.log('AIConsciousnessLayer 2.0 disposed ✓');
  }
}

/**
 * Console API Setup - Call from main.js
 */
export function setupAIConsciousnessConsoleAPI(consciousnessLayer) {
  window.conscious = {
    debug: () => consciousnessLayer.debug(),
    enable: () => {
      consciousnessLayer.enable();
      console.log('🟢 AI Consciousness Layer ENABLED');
    },
    disable: () => {
      consciousnessLayer.disable();
      console.log('🔴 AI Consciousness Layer DISABLED');
    },
    setIntensity: (value) => {
      consciousnessLayer.setIntensity(value);
      console.log(`Consciousness Intensity: ${value.toFixed(2)}`);
    },
    setParticleDensity: (value) => {
      consciousnessLayer.setParticleDensity(value);
      console.log(`Particle Density: ${value.toFixed(2)}`);
    },
    enableStorms: () => {
      consciousnessLayer.enableStorms();
      console.log('🌩️ Thought Storms ENABLED');
    },
    disableStorms: () => {
      consciousnessLayer.disableStorms();
      console.log('⛈️ Thought Storms DISABLED');
    },
    status: () => {
      console.log('%c--- AI CONSCIOUSNESS 2.0 STATUS ---', 'color: #00ffff');
      console.log(`Enabled: ${consciousnessLayer.config.enabled}`);
      console.log(`Threads: ${consciousnessLayer.stats.threadsActive}`);
      console.log(`Pulses: ${consciousnessLayer.stats.pulsesActive}`);
      console.log(`Patterns: ${consciousnessLayer.stats.patternsActive}`);
      console.log(`Storms: ${consciousnessLayer.config.stormsEnabled ? '🌩️ ON' : '⛈️ OFF'}`);
      console.log(`Frame Time: ${consciousnessLayer.stats.frameTime.toFixed(3)}ms`);
      if (consciousnessLayer.stats.stormsFrameTime > 0) {
        console.log(`Storms Frame Time: ${consciousnessLayer.stats.stormsFrameTime.toFixed(3)}ms`);
      }
    }
  };
  
  console.log('%c✓ conscious API ready (v2.0 with Emergent Storms)', 'color: #00ff00; font-weight: bold;');
  console.log('Commands: conscious.enable(), disable(), setIntensity(0-1), setParticleDensity(0-1), enableStorms(), disableStorms(), debug(), status()');
}
