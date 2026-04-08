import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';

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
      fieldDistortionStrength: 0.02,
      globalFieldScale: 15,
      debugMode: false,
      stormsEnabled: true       // NEW: Toggle emergent storms
    };

    this.stormProfile = {
      palette: {
        atomaCyan: 0x6DEAFF,
        mint: 0x77F7DB,
        ritualWhite: 0xF7FBFF,
        violet: 0xD07BFF,
        rose: 0xFF73CF,
        voidDeep: 0x05131A
      },
      rhythm: {
        baseCooldown: 28,
        criticalCooldown: 60,
        durationBase: 6.5,
        particleMultiplier: 0.9
      }
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
    
    // Global field shell and edge halo
    this.globalFieldMesh = null;
    this.globalFieldEdge = null;
    
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

    // Spawn state tracking for repeat suppression
    this.linkSpawnState = new Map();
    
    // Temporal state
    this.time = 0;
    this.instanceID = Math.random();
    this._timeOrigin = undefined;
    this._lastVisualTime = undefined;
    this._threadControlPoint1 = new THREE.Vector3();
    this._threadControlPoint2 = new THREE.Vector3();
    this._threadOffset1 = new THREE.Vector3();
    this._threadOffset2 = new THREE.Vector3();
    
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

        // Align storms with the main consciousness layer's palette and rhythm
        if (this.storms.config) {
          this.storms.config.intensity = Math.max(0.65, 0.75 + this.config.intensity * 0.6);
          this.storms.config.stormDuration = this.stormProfile.rhythm.durationBase + this.config.intensity * 2.4;
          this.storms.config.stormCooldown = this.stormProfile.rhythm.baseCooldown + (1 - this.config.intensity) * 12;
          this.storms.config.criticalCooldown = this.stormProfile.rhythm.criticalCooldown + (1 - this.config.intensity) * 18;
          this.storms.config.particleMultiplier = this.stormProfile.rhythm.particleMultiplier + this.config.intensity * 0.3;
        }

        if (this.storms.palette) {
          Object.assign(this.storms.palette, this.stormProfile.palette);
        } else {
          this.storms.palette = { ...this.stormProfile.palette };
        }

        this.storms.config.enabled = this.config.stormsEnabled;
        this.storms.stormLayerSource = 'AIConsciousnessLayer';
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
        age: 0,
        duration: 1,
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
    // Quiet ATOMA halo shell with layered glow and soft edge definition
    const shellGeometry = new THREE.IcosahedronGeometry(this.config.globalFieldScale, 4);
    const shellMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.018,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
      fog: false
    });
    
    const shellMesh = new THREE.Mesh(shellGeometry, shellMaterial);
    shellMesh.name = 'GlobalConsciousnessShell';
    shellMesh.userData.isGlobalField = true;
    this.consciousnessGroup.add(shellMesh);
    this.globalFieldMesh = shellMesh;

    const edgeGeometry = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(this.config.globalFieldScale * 1.08, 4));
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.09,
      blending: THREE.AdditiveBlending,
      fog: false
    });
    
    const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edgeLines.name = 'GlobalConsciousnessEdge';
    edgeLines.userData.isGlobalFieldEdge = true;
    this.consciousnessGroup.add(edgeLines);
    this.globalFieldEdge = edgeLines;
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
    
    // Soft cyan-white filament with violet pressure at higher tension
    const material = new THREE.LineBasicMaterial({
      color: this._getThreadColor(link),
      linewidth: 2,
      transparent: true,
      opacity: 0.36,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    });
    
    const line = new THREE.Line(geometry, material);
    line.name = `NeuralThread_${link.id}`;
    line.userData.linkId = link.id;
    line.userData.link = link;
    line.userData.threadPoints = points;
    
    this.consciousnessGroup.add(line);
    this.activeThoughts.threadMeshes.set(link.id, line);
    this.stats.threadsActive++;
  }
  
  /**
   * Generate smooth Bézier path for thread
   */
  _generateThreadPath(link, reusePoints = null) {
    const posA = link.nodeA.position;
    const posB = link.nodeB.position;
    const distance = posA.distanceTo(posB);
    
    // Dynamic control point offset based on distance and category
    const offset = Math.min(distance * 0.15, 2.0);
    const categoryInfluence = this._getCategoryInfluence(link.nodeA, link.nodeB);
    const seed = this._getLinkSeed(link, posA, posB);
    const phase = this.time * 0.28;
    
    // Deterministic offsets derived from link identity and signal phase
    const baseX = this._hashTo01(`${seed}-x`);
    const baseY = this._hashTo01(`${seed}-y`);
    const baseZ = this._hashTo01(`${seed}-z`);
    
    this._threadOffset1.set(
      (baseX - 0.5) * offset * 0.55 + Math.sin(phase + baseY * Math.PI * 2) * offset * 0.12,
      Math.sin(phase * 0.72 + baseZ * Math.PI * 1.5) * offset * 0.28,
      (baseY - 0.5) * offset * 0.55 + Math.cos(phase + baseX * Math.PI * 2) * offset * 0.10
    );
    this._threadOffset2.set(
      (baseZ - 0.5) * offset * categoryInfluence * 0.55 + Math.cos(phase * 0.88 + baseX * Math.PI * 1.8) * offset * 0.10,
      Math.cos(phase * 0.65 + baseY * Math.PI * 1.7) * offset * 0.24,
      (baseX - 0.5) * offset * categoryInfluence * 0.55 + Math.sin(phase * 0.95 + baseZ * Math.PI * 2.2) * offset * 0.08
    );
    
    const controlPoint1 = this._threadControlPoint1.copy(posA).add(this._threadOffset1);
    const controlPoint2 = this._threadControlPoint2.copy(posB).add(this._threadOffset2);
    
    // Generate curve points
    const points = Array.isArray(reusePoints) ? reusePoints : [];
    const segments = Math.max(1, Math.ceil(distance * 2));
    points.length = segments + 1;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Cubic Bézier interpolation
      const p = points[i] || (points[i] = new THREE.Vector3());
      this._cubicBezier(posA, controlPoint1, controlPoint2, posB, t, p);
    }
    
    return points;
  }

  _getLinkSeed(link, posA, posB) {
    const idString = `${link.id}:${posA.x.toFixed(2)},${posA.y.toFixed(2)},${posA.z.toFixed(2)}|${posB.x.toFixed(2)},${posB.y.toFixed(2)},${posB.z.toFixed(2)}`;
    return this._hashTo01(idString);
  }
  
  _hashTo01(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return ((hash >>> 0) % 1000) / 1000;
  }
  
  /**
   * Cubic Bézier interpolation
   */
  _cubicBezier(p0, p1, p2, p3, t, target) {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;
    
    return target.set(
      mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
      mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y,
      mt2 * mt * p0.z + 3 * mt2 * t * p1.z + 3 * mt * t2 * p2.z + t2 * t * p3.z
    );
  }

  _pulseEnvelope(progress) {
    if (progress <= 0.18) {
      return progress / 0.18;
    }
    if (progress >= 0.82) {
      return (1 - progress) / 0.18;
    }
    return 1.0;
  }

  _pulseMotionProgress(progress) {
    const attack = 0.16;
    const release = 0.2;
    const sustain = 1 - attack - release;
    if (progress <= attack) {
      const t = progress / attack;
      return t * t * 0.18;
    }
    if (progress >= 1 - release) {
      const t = (1 - progress) / release;
      return 1 - t * t * 0.18;
    }
    const t = (progress - attack) / sustain;
    return 0.18 + t * 0.82;
  }
  
  /**
   * Get blend color from node categories
   */
  _getCategoryBlendColor(nodeA, nodeB) {
    const catA = nodeA.userData?.category || 'process';
    const catB = nodeB.userData?.category || 'process';
    
    const palette = {
      voidDeep: 0x05131A,
      atomaCyan: 0x6DEAFF,
      mint: 0x77F7DB,
      ritualWhite: 0xF7FBFF,
      violet: 0xD07BFF,
      rose: 0xFF73CF
    };
    
    const colorMap = {
      input: palette.rose,
      process: palette.atomaCyan,
      integration: palette.mint,
      analytics: palette.violet,
      storage: palette.mint,
      control: palette.ritualWhite,
      mythic: palette.violet,
      prime: palette.atomaCyan,
      error: palette.rose,
      quantum: palette.voidDeep,
      emotional: palette.rose
    };
    
    const colA = new THREE.Color(colorMap[catA] || palette.atomaCyan);
    const colB = new THREE.Color(colorMap[catB] || palette.atomaCyan);
    
    colA.lerp(colB, 0.35);
    return colA;
  }
  
  /**
   * Get category influence multiplier for curve strength
   */
  _getCategoryInfluence(nodeA, nodeB) {
    const catA = nodeA.userData?.category || 'process';
    const catB = nodeB.userData?.category || 'process';
    
    const baseWeights = {
      input: 1.08,
      process: 0.98,
      integration: 1.05,
      analytics: 1.12,
      storage: 0.94,
      control: 1.00,
      mythic: 1.18,
      prime: 1.10,
      error: 1.28,
      quantum: 1.22,
      emotional: 1.14
    };
    
    const complementary = [
      ['process', 'storage'],
      ['analytics', 'control'],
      ['error', 'prime'],
      ['mythic', 'quantum']
    ];
    
    const sameCategory = catA === catB;
    const strongPair = complementary.some(([c1, c2]) =>
      (catA === c1 && catB === c2) || (catA === c2 && catB === c1)
    );
    
    const weightA = baseWeights[catA] || 1.0;
    const weightB = baseWeights[catB] || 1.0;
    const meanWeight = (weightA + weightB) * 0.5;
    
    if (sameCategory) {
      return Math.max(0.88, meanWeight * 0.95);
    }
    if (strongPair) {
      return Math.min(1.35, meanWeight + 0.15);
    }
    
    return Math.max(0.92, meanWeight);
  }

  _getThreadColor(link) {
    const pressure = this._getCategoryInfluence(link.nodeA, link.nodeB);
    const baseBlend = this._getCategoryBlendColor(link.nodeA, link.nodeB);
    const cyanWhite = new THREE.Color(0xD8FFFF).lerp(new THREE.Color(0x6DEAFF), 0.65);
    const color = baseBlend.clone().lerp(cyanWhite, 0.55);
    if (pressure > 1.05) {
      const violetStrength = Math.min(0.35, (pressure - 1.0) * 0.25);
      color.lerp(new THREE.Color(0xD07BFF), violetStrength);
    }
    return color;
  }

  _getLinkSpawnState(link) {
    let state = this.linkSpawnState.get(link.id);
    if (!state) {
      state = {
        lastThread: -Infinity,
        lastPulse: -Infinity,
        lastPattern: -Infinity
      };
      this.linkSpawnState.set(link.id, state);
    }
    return state;
  }

  _hasLinkSemanticValue(link) {
    if (!this.glyphLayer4) return false;
    try {
      const meaning = this.glyphLayer4.getMeaning?.(link.nodeA, link.nodeB);
      return meaning != null;
    } catch (e) {
      return false;
    }
  }

  _computeLinkSpawnMetrics(link) {
    const signal = Math.max(0, Math.min(1, link.trafficIntensity ?? 0.35));
    const stability = Math.max(0, Math.min(1, link.stability ?? link.Stability ?? 0.5));
    const harmony = Math.max(0, Math.min(1, link.harmony ?? 0.5));
    const categoryInfluence = this._getCategoryInfluence(link.nodeA, link.nodeB);
    const semanticValue = this._hasLinkSemanticValue(link) ? 1 : 0.72;
    const recent = 0.65 + signal * 0.35;
    const baseStrength = (0.24 + signal * 0.46 + categoryInfluence * 0.18 + semanticValue * 0.12) * this.config.intensity;

    return {
      signal,
      stability,
      harmony,
      categoryInfluence,
      semanticValue,
      threadProb: Math.min(0.42, 0.12 + baseStrength * 0.18 + signal * 0.07),
      pulseWeight: Math.max(0.01, baseStrength * (0.5 + signal * 0.32 + categoryInfluence * 0.15) * this.config.particleDensity),
      patternProb: Math.min(0.18, 0.04 + baseStrength * 0.14 + semanticValue * 0.08)
    };
  }

  _pickWeightedLink(candidates, excludeSet) {
    const pool = candidates.filter(item => !excludeSet.has(item.link.id));
    const total = pool.reduce((sum, item) => sum + item.weight, 0);
    if (total <= 0) return null;
    let threshold = Math.random() * total;
    for (const entry of pool) {
      threshold -= entry.weight;
      if (threshold <= 0) return entry.link;
    }
    return pool[pool.length - 1]?.link || null;
  }

  /**
   * Spawn cognitive pulse packet on link
   */
  _spawnPulsePacket(link) {
    if (!this.config.enabled) return;
    
    // HARD STOP: Validate link has required properties
    if (!link || !link.nodeA || !link.nodeB) return;
    
    // Get from pool, but don't reuse an already active packet.
    const pulse = this.particlePools.pulsePackets.find(p => !p.active);
    if (!pulse) {
      return; // Pool is full, keep the system bounded
    }
    
    pulse.link = link;
    pulse.startPos.copy(link.nodeA.position);
    pulse.endPos.copy(link.nodeB.position);
    pulse.progress = 0;
    pulse.age = 0;
    pulse.active = true;
    pulse.linkId = link.id;
    
    const categoryPressure = this._getCategoryInfluence(link.nodeA, link.nodeB);
    pulse.duration = 0.8 + Math.min(0.6, (categoryPressure - 0.9) * 0.8);
    pulse.life = 1.0;
    
    const stability = Math.max(0, Math.min(1, link.stability ?? 0.5));
    const harmony = Math.max(0, Math.min(1, link.harmony ?? 0.5));
    pulse.speed = this.config.pulseSpeed * (0.65 + stability * 0.3 + harmony * 0.2 + this.config.intensity * 0.25);
    pulse.category = stability > 0.6 ? 'corrupted' : 'stable';
    
    const baseColor = this._getCategoryBlendColor(link.nodeA, link.nodeB);
    const harmonyTint = new THREE.Color(0x77F7DB).lerp(new THREE.Color(0x6DEAFF), harmony);
    const stabilityTint = new THREE.Color(0xF7FBFF).lerp(new THREE.Color(0x05131A), 1 - stability);
    pulse.color = baseColor.clone().lerp(harmonyTint, 0.32).lerp(stabilityTint, 0.14);
    if (stability > 0.6) {
      pulse.color.lerp(new THREE.Color(0xD07BFF), 0.18);
    }
    
    if (!pulse.mesh) {
      const geometry = new THREE.SphereGeometry(0.12, 10, 8);
      const material = new THREE.MeshBasicMaterial({
        color: pulse.color,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false
      });
      pulse.mesh = new THREE.Mesh(geometry, material);
      pulse.mesh.userData.isPulsePacket = true;
      this.consciousnessGroup.add(pulse.mesh);
    }
    
    pulse.mesh.position.copy(pulse.position);
    pulse.mesh.material.color.copy(pulse.color);
    pulse.mesh.material.opacity = 0.0;
    pulse.mesh.scale.setScalar(0.45 + this.config.intensity * 0.15);
    pulse.mesh.visible = true;
    
    if (!this.activeThoughts.pulsePackets.includes(pulse)) {
      this.activeThoughts.pulsePackets.push(pulse);
      this.stats.pulsesActive++;
    }
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
    
    const patternType = this._selectSemanticPatternType(link, meaning);
    const meaningColor = this._parseGlyphMeaningColor(meaning) || this._getCategoryBlendColor(link.nodeA, link.nodeB);
    const geometryColor = meaningColor.clone();
    const seed = this._hashTo01(`${link.id}-pattern`);
    const particles = [];
    
    const material = new THREE.MeshBasicMaterial({
      color: geometryColor,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
      side: THREE.DoubleSide
    });
    
    const count = 6;
    const radius = 0.55 + seed * 0.28;
    const thickness = 0.08 + seed * 0.05;
    
    const patternBuilders = {
      ring: () => {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(radius * 0.6, radius * 0.72, 24),
          material.clone()
        );
        ring.rotation.x = Math.PI * 0.5;
        ring.position.copy(clusterPos);
        ring.userData.isSemanticParticle = true;
        ring.userData.basePos = clusterPos.clone();
        ring.userData.angle = 0;
        ring.userData.radius = 0;
        particles.push(ring);
        this.consciousnessGroup.add(ring);
      },
      crown: () => {
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const shard = new THREE.Mesh(
            new THREE.ConeGeometry(thickness * 0.75, thickness * 2.5, 5),
            material.clone()
          );
          shard.position.set(
            clusterPos.x + Math.cos(angle) * radius,
            clusterPos.y + 0.05,
            clusterPos.z + Math.sin(angle) * radius
          );
          shard.rotation.y = -angle;
          shard.userData.isSemanticParticle = true;
          shard.userData.basePos = shard.position.clone();
          shard.userData.angle = angle;
          shard.userData.radius = radius;
          particles.push(shard);
          this.consciousnessGroup.add(shard);
        }
      },
      seal: () => {
        const disc = new THREE.Mesh(
          new THREE.CircleGeometry(radius * 0.56, 28),
          material.clone()
        );
        disc.rotation.x = Math.PI * 0.5;
        disc.position.copy(clusterPos);
        disc.material.opacity = 0.32;
        disc.userData.isSemanticParticle = true;
        disc.userData.basePos = clusterPos.clone();
        disc.userData.angle = 0;
        disc.userData.radius = 0;
        particles.push(disc);
        this.consciousnessGroup.add(disc);

        const glyph = new THREE.Mesh(
          new THREE.TorusGeometry(radius * 0.28, thickness * 0.08, 10, 40),
          material.clone()
        );
        glyph.rotation.x = Math.PI * 0.5;
        glyph.position.copy(clusterPos);
        glyph.userData.isSemanticParticle = true;
        glyph.userData.basePos = clusterPos.clone();
        glyph.userData.angle = 0;
        glyph.userData.radius = 0;
        particles.push(glyph);
        this.consciousnessGroup.add(glyph);
      },
      halo: () => {
        const halo = new THREE.Mesh(
          new THREE.TorusGeometry(radius * 0.64, thickness * 0.04, 8, 48),
          material.clone()
        );
        halo.rotation.x = Math.PI * 0.5;
        halo.position.copy(clusterPos);
        halo.userData.isSemanticParticle = true;
        halo.userData.basePos = clusterPos.clone();
        halo.userData.angle = 0;
        halo.userData.radius = 0;
        particles.push(halo);
        this.consciousnessGroup.add(halo);

        const inner = new THREE.Mesh(
          new THREE.TorusGeometry(radius * 0.38, thickness * 0.03, 8, 40),
          material.clone()
        );
        inner.rotation.x = Math.PI * 0.5;
        inner.position.copy(clusterPos);
        inner.userData.isSemanticParticle = true;
        inner.userData.basePos = clusterPos.clone();
        inner.userData.angle = 0;
        inner.userData.radius = 0;
        particles.push(inner);
        this.consciousnessGroup.add(inner);
      },
      shard: () => {
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const shard = new THREE.Mesh(
            new THREE.BoxGeometry(thickness * 0.5, thickness * 1.8, thickness * 0.12),
            material.clone()
          );
          shard.position.set(
            clusterPos.x + Math.cos(angle) * radius * 0.92,
            clusterPos.y + 0.08,
            clusterPos.z + Math.sin(angle) * radius * 0.92
          );
          shard.rotation.y = angle;
          shard.userData.isSemanticParticle = true;
          shard.userData.basePos = shard.position.clone();
          shard.userData.angle = angle;
          shard.userData.radius = radius * 0.92;
          particles.push(shard);
          this.consciousnessGroup.add(shard);
        }
      },
      cluster: () => {
        for (let i = 0; i < count + 2; i++) {
          const angle = (i / (count + 2)) * Math.PI * 2;
          const dist = radius * (0.3 + (i % 2) * 0.18);
          const node = new THREE.Mesh(
            new THREE.IcosahedronGeometry(thickness * 0.6, 1),
            material.clone()
          );
          node.position.set(
            clusterPos.x + Math.cos(angle) * dist,
            clusterPos.y + 0.05 * ((i % 3) - 1),
            clusterPos.z + Math.sin(angle) * dist
          );
          node.userData.isSemanticParticle = true;
          node.userData.basePos = node.position.clone();
          node.userData.angle = angle;
          node.userData.radius = dist;
          particles.push(node);
          this.consciousnessGroup.add(node);
        }
      }
    };
    
    const builder = patternBuilders[patternType] || patternBuilders.cluster;
    builder();
    
    this.activeThoughts.patternClusters.set(link.id, {
      particles,
      life: 3.0,
      meaning,
      basePos: clusterPos.clone(),
      type: patternType
    });
    
    this.stats.patternsActive++;
  }

  _selectSemanticPatternType(link, meaning) {
    const types = ['ring', 'crown', 'seal', 'halo', 'shard', 'cluster'];
    const key = `${link.id}:${typeof meaning === 'string' ? meaning : JSON.stringify(meaning)}`;
    const seed = this._hashTo01(key);
    return types[Math.floor(seed * types.length)];
  }

  _parseGlyphMeaningColor(meaning) {
    if (!meaning) return null;
    try {
      return new THREE.Color(meaning);
    } catch (e) {
      return null;
    }
  }
  
  /**
   * Update frame - called from main.js animation loop
   */
  update(dt) {
    // dt is intentionally ignored: timing follows the canonical VisualTime source.
    if (!this.config.enabled) return;

    const startTime = performance.now();
    
    if (this._timeOrigin === undefined) {
      this._timeOrigin = VisualTime.now;
    }
    const currentTime = VisualTime.now - this._timeOrigin; // Phase 2A: canonical VisualTime source (behavior-preserving)
    const visualDelta = this._lastVisualTime === undefined
      ? 0
      : Math.max(0, currentTime - this._lastVisualTime);
    this._lastVisualTime = currentTime;
    this.time = currentTime;
    
    // 1. Update neural threads
    this._updateThreads();
    
    // 2. Update pulse packets
    this._updatePulses(visualDelta);
    
    // 3. Update semantic patterns
    this._updatePatterns(visualDelta);
    
    // 4. Update global field
    this._updateGlobalField(visualDelta);
    
    // 5. Spawn new thoughts on active links
    this._spawnNewThoughts();
    
    // 6. Update thought storms (if enabled)
    if (this.config.stormsEnabled && this.storms) {
      const stormStart = performance.now();
      this.storms.update(visualDelta);
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
      
      // Animate opacity based on link intensity with a soft breathing envelope
      const activity = (link.trafficIntensity || 0.3);
      const categoryPressure = this._getCategoryInfluence(link.nodeA, link.nodeB);
      const intensity = this.config.intensity;
      const baseOpacity = 0.18 + activity * 0.25 * intensity + (categoryPressure - 0.9) * 0.12 * intensity;
      const breath = Math.sin(this.time * 1.3) * 0.03 * intensity;
      line.material.opacity = Math.min(0.6, Math.max(0.12, baseOpacity + breath));
      
      // Regenerate geometry only when necessary, with a stable interval and more nuance for active links
      const lastUpdate = line.userData.lastThreadUpdate || 0;
      const interval = Math.max(0.24, 0.42 - activity * 0.14 - intensity * 0.04);
      if (this.time - lastUpdate > interval) {
        const points = this._generateThreadPath(link, line.userData.threadPoints);
        line.userData.threadPoints = points;
        line.geometry.setFromPoints(points);
        line.userData.lastThreadUpdate = this.time;
      }
    }
  }
  
  /**
   * Update all pulse packets
   */
  _updatePulses(visualDelta) {
    for (let i = this.activeThoughts.pulsePackets.length - 1; i >= 0; i--) {
      const pulse = this.activeThoughts.pulsePackets[i];
      
      if (!pulse.active || !pulse.link) {
        this.activeThoughts.pulsePackets.splice(i, 1);
        if (pulse.mesh) pulse.mesh.visible = false;
        this.stats.pulsesActive--;
        continue;
      }
      
      pulse.age += visualDelta;
      pulse.progress += pulse.speed * visualDelta;
      pulse.life = Math.max(0, 1 - pulse.age / pulse.duration);
      
      const progressNorm = Math.min(1, pulse.progress);
      const motionProgress = this._pulseMotionProgress(progressNorm);
      const envelope = this._pulseEnvelope(progressNorm);
      
      if (progressNorm >= 1 || pulse.life <= 0) {
        pulse.active = false;
        if (pulse.mesh) pulse.mesh.visible = false;
        this.activeThoughts.pulsePackets.splice(i, 1);
        this.stats.pulsesActive--;
        continue;
      }
      
      pulse.position.lerpVectors(pulse.startPos, pulse.endPos, motionProgress);
      pulse.mesh.position.copy(pulse.position);
      
      pulse.mesh.material.opacity = Math.min(0.88, 0.08 + pulse.life * envelope * 0.78 * this.config.intensity);
      
      const stability = Math.max(0, Math.min(1, pulse.link?.stability ?? 0.5));
      const scaleBase = 0.26 + envelope * 0.84;
      pulse.mesh.scale.setScalar(scaleBase + stability * 0.12 + this.config.intensity * 0.08);
    }
  }
  
  /**
   * Update semantic pattern clusters
   */
  _updatePatterns(visualDelta) {
    for (const [linkId, pattern] of this.activeThoughts.patternClusters) {
      pattern.life -= visualDelta;
      
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
      
      const lifeNorm = Math.max(0, Math.min(1, pattern.life / 3.0));
      const phase = this.time * 1.2 + this._hashTo01(`${linkId}-${pattern.type}`) * Math.PI * 2;
      const buildFactor = 1 - Math.pow(lifeNorm, 1.8);
      const fadeFactor = Math.max(0.08, lifeNorm * this.config.intensity);
      const rotationSpeed = 1.0 + (1 - lifeNorm) * 0.6 + this.config.intensity * 0.2;
      const baseAlpha = 0.14 + fadeFactor * 0.48;
      
      for (const particle of pattern.particles) {
        const basePos = particle.userData.basePos;
        const angle = (particle.userData.angle || 0) + phase * (particle.userData.radius ? 0.6 : 0.2);
        const radius = (particle.userData.radius || 0.4) * (0.7 + buildFactor * 0.24);
        
        switch (pattern.type) {
          case 'ring':
          case 'halo':
            particle.position.x = basePos.x + Math.cos(angle) * radius;
            particle.position.y = basePos.y + Math.sin(phase) * 0.08 + buildFactor * 0.08;
            particle.position.z = basePos.z + Math.sin(angle) * radius;
            particle.rotation.z = phase * 0.35;
            break;
          case 'seal':
            particle.position.x = basePos.x;
            particle.position.y = basePos.y + Math.sin(phase) * 0.06 + buildFactor * 0.04;
            particle.position.z = basePos.z;
            particle.rotation.z = phase * 0.45;
            break;
          case 'crown':
            particle.position.x = basePos.x + Math.cos(angle) * radius;
            particle.position.y = basePos.y + 0.1 + Math.sin(angle * 2 + phase) * 0.03 + buildFactor * 0.04;
            particle.position.z = basePos.z + Math.sin(angle) * radius;
            particle.rotation.x = phase * 0.25;
            break;
          case 'shard':
            particle.position.x = basePos.x + Math.cos(angle) * radius;
            particle.position.y = basePos.y + Math.sin(angle * 1.4 + phase) * 0.05 + buildFactor * 0.03;
            particle.position.z = basePos.z + Math.sin(angle) * radius;
            particle.rotation.y = angle + phase * 0.18;
            break;
          case 'cluster':
          default:
            particle.position.x = basePos.x + Math.cos(angle) * radius * 0.7;
            particle.position.y = basePos.y + Math.sin(angle * 1.3 + phase) * 0.08 + buildFactor * 0.05;
            particle.position.z = basePos.z + Math.sin(angle) * radius * 0.7;
            particle.rotation.x = phase * 0.22;
            particle.rotation.y = phase * 0.28;
            break;
        }
        
        const ritualDip = Math.sin(phase * 0.6) * 0.02;
        particle.position.y += ritualDip;
        
        particle.material.opacity = baseAlpha * fadeFactor * (0.78 + Math.sin(phase * 0.9) * 0.06);
        particle.scale.setScalar(0.7 + buildFactor * 0.24 + this.config.intensity * 0.08);
      }
    }
  }
  
  /**
   * Update global consciousness field
   */
  _updateGlobalField(visualDelta) {
    if (!this.globalFieldMesh) return;

    const links = this.linkingSystem?.links || [];
    let avgStability = 0;
    let avgHarmony = 0;
    let avgCorruption = 0;
    let avgLoadPressure = 0;
    let activeCount = 0;

    for (const link of links) {
      const stability = link.stability ?? link.Stability ?? 0;
      const harmony = link.harmony ?? 0.5;
      const corruption = link.corruption ?? link.corruptionLevel ?? 0;
      const loadPressure = link.loadPressure ?? link.pressure ?? 0;
      const intensity = link.trafficIntensity ?? 0.3;

      avgStability += stability;
      avgHarmony += harmony;
      avgCorruption += corruption;
      avgLoadPressure += loadPressure;
      if (intensity > 0.55) activeCount++;
    }

    const linkCount = Math.max(1, links.length);
    avgStability /= linkCount;
    avgHarmony /= linkCount;
    avgCorruption /= linkCount;
    avgLoadPressure /= linkCount;

    const networkMood = Math.max(0, Math.min(1, avgHarmony * 0.65 + avgStability * 0.35));
    const pressure = Math.min(1, avgLoadPressure + avgCorruption * 0.35 + (activeCount / linkCount) * 0.1);
    const corruptionBias = Math.min(1, avgCorruption * 1.2);
    const pulsePhase = Math.sin(this.time * 0.72 + pressure * Math.PI * 1.5);
    const monumentScale = 1 + avgStability * 0.1 * this.config.intensity + pressure * 0.07;
    const pulseScale = 1 + pulsePhase * 0.04 * (0.45 + networkMood * 0.45) * this.config.intensity;

    this.globalFieldMesh.scale.setScalar(monumentScale * pulseScale);
    if (this.globalFieldEdge) {
      this.globalFieldEdge.scale.setScalar(monumentScale * 1.05);
    }

    const calm = new THREE.Color(0x6DEAFF);
    const ritual = new THREE.Color(0xF7FBFF);
    const storm = new THREE.Color(0xD07BFF);
    const corrosion = new THREE.Color(0xFF73CF);

    const moodColor = ritual.clone().lerp(calm, networkMood);
    const tint = moodColor.clone().lerp(storm, corruptionBias * 0.4).lerp(corrosion, pressure * 0.2);
    this.globalFieldMesh.material.color.copy(tint);

    const baseOpacity = (0.01 + avgStability * 0.01 + pressure * 0.01) * this.config.intensity;
    this.globalFieldMesh.material.opacity = Math.min(0.06, baseOpacity + Math.abs(pulsePhase) * 0.006 * this.config.intensity);

    if (this.globalFieldEdge) {
      const edgeTint = tint.clone().lerp(new THREE.Color(0x05131A), 1 - networkMood * 0.5);
      this.globalFieldEdge.material.color.copy(edgeTint);
      this.globalFieldEdge.material.opacity = Math.min(0.16, 0.08 + pressure * 0.05 + Math.abs(pulsePhase) * 0.02);
    }
  }
  
  /**
   * Spawn new thoughts on active links
   */
  _spawnNewThoughts() {
    // STRICT GUARD: Skip if no valid linking system
    if (!this.linkingSystem || !this.linkingSystem.links || this.linkingSystem.links.length === 0) {
      return;
    }

    const links = this.linkingSystem.links.filter(link => link && link.nodeA && link.nodeB);
    const metrics = links.map(link => ({
      link,
      metrics: this._computeLinkSpawnMetrics(link)
    }));

    const threadBudget = Math.max(1, Math.ceil(this.config.intensity * 1.2));
    const threadSelection = metrics
      .filter(({link, metrics: metric}) => !this.activeThoughts.threadMeshes.has(link.id))
      .map(({link, metrics: metric}) => ({link, weight: metric.threadProb}));

    const usedThread = new Set();
    for (let i = 0; i < threadBudget; i++) {
      const chosen = this._pickWeightedLink(threadSelection, usedThread);
      if (!chosen) break;
      const spawnState = this._getLinkSpawnState(chosen);
      const threadGap = Math.max(0.7, 1.4 - this.config.intensity * 0.8);
      if (this.time - spawnState.lastThread >= threadGap) {
        this._createNeuralThread(chosen);
        spawnState.lastThread = this.time;
      }
      usedThread.add(chosen.id);
    }

    const pulseBudget = Math.max(1, Math.ceil(this.config.particleDensity * 2));
    const pulseSelection = [];
    for (const {link, metrics: metric} of metrics) {
      pulseSelection.push({link, weight: metric.pulseWeight});
    }

    const usedPulse = new Set();
    for (let i = 0; i < pulseBudget; i++) {
      const chosen = this._pickWeightedLink(pulseSelection, usedPulse);
      if (!chosen) break;
      const spawnState = this._getLinkSpawnState(chosen);
      const pulseGap = Math.max(0.55, 1.1 - this.config.particleDensity * 0.6 - this.config.intensity * 0.2);
      if (this.time - spawnState.lastPulse >= pulseGap) {
        this._spawnPulsePacket(chosen);
        spawnState.lastPulse = this.time;
      }
      usedPulse.add(chosen.id);
    }

    const patternBudget = Math.max(0, Math.floor(this.config.particleDensity * 0.6));
    const patternSelection = metrics
      .filter(({link, metrics: metric}) => !this.activeThoughts.patternClusters.has(link.id))
      .map(({link, metrics: metric}) => ({link, weight: metric.patternProb}));

    const usedPattern = new Set();
    for (let i = 0; i < patternBudget; i++) {
      const chosen = this._pickWeightedLink(patternSelection, usedPattern);
      if (!chosen) break;
      const spawnState = this._getLinkSpawnState(chosen);
      const patternGap = Math.max(1.5, 2.8 - this.config.intensity * 0.9);
      if (this.time - spawnState.lastPattern >= patternGap) {
        this._createSemanticPattern(chosen);
        spawnState.lastPattern = this.time;
      }
      usedPattern.add(chosen.id);
    }
  }
  
  /**
   * PUBLIC API - Toggle consciousness layer
   */
  enable() {
    this.config.enabled = true;
    this.stats.enabled = true;
    if (this.globalFieldMesh) this.globalFieldMesh.visible = true;
    if (this.globalFieldEdge) this.globalFieldEdge.visible = true;

    for (const mesh of this.activeThoughts.threadMeshes.values()) {
      mesh.visible = true;
    }
    for (const pulse of this.particlePools.pulsePackets) {
      if (pulse.mesh && pulse.active) pulse.mesh.visible = true;
    }
    for (const pattern of this.activeThoughts.patternClusters.values()) {
      for (const mesh of pattern.particles) {
        mesh.visible = true;
      }
    }

    if (this.storms && this.config.stormsEnabled) {
      this.storms.enable();
    }
  }
  
  disable() {
    this.config.enabled = false;
    this.stats.enabled = false;
    if (this.globalFieldMesh) this.globalFieldMesh.visible = false;
    if (this.globalFieldEdge) this.globalFieldEdge.visible = false;

    for (const mesh of this.activeThoughts.threadMeshes.values()) {
      mesh.visible = false;
    }
    for (const pulse of this.particlePools.pulsePackets) {
      if (pulse.mesh) pulse.mesh.visible = false;
      pulse.active = false;
    }
    for (const pattern of this.activeThoughts.patternClusters.values()) {
      for (const mesh of pattern.particles) {
        mesh.visible = false;
      }
    }

    if (this.storms) {
      this.storms.disable();
    }
  }
  
  /**
   * PUBLIC API - Set overall intensity
   */
  setIntensity(value) {
    this.config.intensity = Math.max(0, Math.min(1, value));
    if (this.storms) {
      this.storms.setIntensity(Math.max(0.65, 0.75 + this.config.intensity * 0.5));
    }
  }
  
  /**
   * PUBLIC API - Set particle density
   */
  setParticleDensity(value) {
    this.config.particleDensity = Math.max(0, Math.min(1, value));
    if (this.storms) {
      this.storms.config.particleMultiplier = 0.9 + this.config.particleDensity * 0.4;
    }
  }
  
  /**
   * PUBLIC API - Debug status
   */
  debug() {
    const fieldVisible = this.globalFieldMesh?.visible ? 'ON' : 'OFF';
    const edgeVisible = this.globalFieldEdge?.visible ? 'edge ON' : 'edge OFF';
    const fieldOpacity = this.globalFieldMesh?.material?.opacity?.toFixed(3) ?? 'n/a';
    const fieldScale = this.globalFieldMesh?.scale?.x?.toFixed(2) ?? 'n/a';
    const stormsLoaded = !!this.storms;
    const stormActive = this.storms?.stormState?.activeStorm || 'none';
    const stormMood = this.storms?.stormState?.currentMood || 'n/a';

    console.log('%c=== AI CONSCIOUSNESS LAYER 2.0 DEBUG ===', 'color: #00ffff; font-weight: bold;');
    console.log(`Status: ${this.config.enabled ? '🟢 ENABLED' : '🔴 DISABLED'} | Intensity: ${this.config.intensity.toFixed(2)} | Density: ${this.config.particleDensity.toFixed(2)}`);
    console.log(`Threads: ${this.stats.threadsActive} | Pulses: ${this.stats.pulsesActive} | Patterns: ${this.stats.patternsActive}`);
    console.log(`Global Field: ${fieldVisible} (${edgeVisible}) | opacity=${fieldOpacity} | scale=${fieldScale}`);
    console.log(`Storms: ${this.config.stormsEnabled ? 'ENABLED' : 'DISABLED'} | loaded=${stormsLoaded} | active=${stormActive} | mood=${stormMood}`);
    if (this.stats.stormsFrameTime > 0) {
      console.log(`Storms Frame Time: ${this.stats.stormsFrameTime.toFixed(3)}ms`);
    }
    console.log(`Frame Time: ${this.stats.frameTime.toFixed(3)}ms | Pool: ${this.particlePools.pulsePackets.length} pulses`);
  }
  
  /**
   * PUBLIC API - Toggle storms
   */
  enableStorms() {
    this.config.stormsEnabled = true;
    if (this.storms) {
      this.storms.config.enabled = true;
      this.storms.setIntensity(Math.max(0.6, this.storms.config.intensity));
      this.storms.enable();
    }
  }
  
  disableStorms() {
    this.config.stormsEnabled = false;
    if (this.storms) {
      this.storms.disable();
    }
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
    for (const pulse of this.particlePools.pulsePackets) {
      if (pulse.mesh) {
        this.consciousnessGroup.remove(pulse.mesh);
        pulse.mesh.geometry.dispose();
        pulse.mesh.material.dispose();
        pulse.mesh = null;
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
    this.linkSpawnState.clear();
    
    // Remove global field shell and edge halo
    if (this.globalFieldMesh) {
      this.consciousnessGroup.remove(this.globalFieldMesh);
      this.globalFieldMesh.geometry.dispose();
      this.globalFieldMesh.material.dispose();
    }
    if (this.globalFieldEdge) {
      this.consciousnessGroup.remove(this.globalFieldEdge);
      this.globalFieldEdge.geometry.dispose();
      this.globalFieldEdge.material.dispose();
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
