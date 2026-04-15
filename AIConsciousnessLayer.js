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
    this.globalFieldChoir = null;
    
    // Thought storms sub-system (lazy-loaded)
    this.storms = null;
    
    // Ritual coupling: lets consciousness act like the world's ceremonial nervous system.
    this.semanticBus = this._resolveSemanticBus();
    this._ritualSubscriptions = [];
    this.ritualState = {
      active: false,
      ritualType: null,
      phase: 'NONE',
      intensity: 0,
      targetIntensity: 0,
      anchor: new THREE.Vector3(),
      palette: this._getRitualPalette(null),
      stamp: 0
    };
    this.ritualFieldVeil = null;
    this.ritualFieldWitness = null;
    this._ritualWitnessBasePositions = null;
    
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
    this._setupRitualBridge();
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
        colorA: new THREE.Color(),
        colorB: new THREE.Color(),
        mesh: null,
        trailMesh: null,
        trailPositions: [],
        life: 1,
        age: 0,
        duration: 1,
        active: false,
        link: null,
        category: 'stable',
        speedVariation: 0
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

    const choirPositions = [];
    const choirLoops = [
      { radiusX: this.config.globalFieldScale * 0.92, radiusZ: this.config.globalFieldScale * 0.54, y: this.config.globalFieldScale * 0.14, wobble: 0.22, count: 52 },
      { radiusX: this.config.globalFieldScale * 0.74, radiusZ: this.config.globalFieldScale * 0.92, y: -this.config.globalFieldScale * 0.08, wobble: 0.18, count: 46 },
      { radiusX: this.config.globalFieldScale * 0.68, radiusZ: this.config.globalFieldScale * 0.68, y: this.config.globalFieldScale * 0.28, wobble: 0.3, count: 40 }
    ];
    for (const loop of choirLoops) {
      for (let i = 0; i < loop.count; i++) {
        const tA = (i / loop.count) * Math.PI * 2;
        const tB = ((i + 1) / loop.count) * Math.PI * 2;
        choirPositions.push(
          Math.cos(tA) * loop.radiusX,
          loop.y + Math.sin(tA * 2.0) * loop.wobble,
          Math.sin(tA) * loop.radiusZ,
          Math.cos(tB) * loop.radiusX,
          loop.y + Math.sin(tB * 2.0) * loop.wobble,
          Math.sin(tB) * loop.radiusZ
        );
      }
    }
    const choirGeometry = new THREE.BufferGeometry();
    choirGeometry.setAttribute('position', new THREE.Float32BufferAttribute(choirPositions, 3));
    const choirMaterial = new THREE.LineBasicMaterial({
      color: 0xf7fbff,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    });
    const choirLines = new THREE.LineSegments(choirGeometry, choirMaterial);
    choirLines.name = 'GlobalConsciousnessChoir';
    choirLines.userData.isGlobalFieldChoir = true;
    this.consciousnessGroup.add(choirLines);
    this.globalFieldChoir = choirLines;

    const veilGeometry = new THREE.OctahedronGeometry(this.config.globalFieldScale * 0.86, 3);
    const veilMaterial = new THREE.MeshBasicMaterial({
      color: 0xf7fbff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false
    });
    const veilMesh = new THREE.Mesh(veilGeometry, veilMaterial);
    veilMesh.name = 'GlobalConsciousnessRitualVeil';
    veilMesh.userData.isRitualField = true;
    this.consciousnessGroup.add(veilMesh);
    this.ritualFieldVeil = veilMesh;

    const witnessCount = 144;
    const witnessRadius = this.config.globalFieldScale * 0.96;
    const witnessPositions = new Float32Array(witnessCount * 3);
    for (let i = 0; i < witnessCount; i++) {
      const t = i + 0.5;
      const inclination = Math.acos(1 - (2 * t) / witnessCount);
      const azimuth = Math.PI * (1 + Math.sqrt(5)) * t;
      const idx = i * 3;
      witnessPositions[idx] = Math.cos(azimuth) * Math.sin(inclination) * witnessRadius;
      witnessPositions[idx + 1] = Math.cos(inclination) * witnessRadius;
      witnessPositions[idx + 2] = Math.sin(azimuth) * Math.sin(inclination) * witnessRadius;
    }
    const witnessGeometry = new THREE.BufferGeometry();
    witnessGeometry.setAttribute('position', new THREE.BufferAttribute(witnessPositions.slice(), 3));
    const witnessMaterial = new THREE.PointsMaterial({
      color: 0xf7fbff,
      size: 0.22,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      fog: false
    });
    const witnessPoints = new THREE.Points(witnessGeometry, witnessMaterial);
    witnessPoints.name = 'GlobalConsciousnessWitness';
    witnessPoints.userData.isRitualWitness = true;
    this.consciousnessGroup.add(witnessPoints);
    this.ritualFieldWitness = witnessPoints;
    this._ritualWitnessBasePositions = witnessPositions;
  }

  _resolveSemanticBus() {
    if (globalThis?.ATOMA_BUS || globalThis?.semanticBus) {
      return globalThis.ATOMA_BUS || globalThis.semanticBus || null;
    }

    const browserWindow = typeof window !== 'undefined' ? window : null;
    return browserWindow?.ATOMA_BUS || browserWindow?.semanticBus || null;
  }

  _setupRitualBridge() {
    const bus = this.semanticBus || this._resolveSemanticBus();
    if (!bus?.subscribe) return;

    this.semanticBus = bus;

    const ritualOn = (payload = {}) => this._applyRitualPayload(payload, false);
    const ritualOff = (payload = {}) => this._applyRitualPayload(payload, true);
    const subscriptions = [
      ['semantic.ritual.started', ritualOn],
      ['semantic.ritual.phase', ritualOn],
      ['ritual.prelude', ritualOn],
      ['ritual.active', ritualOn],
      ['ritual.crest', ritualOn],
      ['ritual.descend', ritualOn],
      ['ritual.release', ritualOff],
      ['semantic.ritual.completed', ritualOff]
    ];

    for (const [eventName, handler] of subscriptions) {
      const unsubscribe = bus.subscribe(eventName, handler);
      if (typeof unsubscribe === 'function') {
        this._ritualSubscriptions.push(unsubscribe);
      } else if (typeof bus.unsubscribe === 'function') {
        this._ritualSubscriptions.push(() => bus.unsubscribe(eventName, handler));
      }
    }
  }

  _disposeRitualBridge() {
    while (this._ritualSubscriptions.length > 0) {
      const unsubscribe = this._ritualSubscriptions.pop();
      try {
        if (typeof unsubscribe === 'function') unsubscribe();
      } catch (err) {
        console.warn('[AIConsciousnessLayer] Ritual bridge cleanup failed:', err);
      }
    }
  }

  _phaseToIntensity(phase) {
    switch (phase) {
      case 'INIT':
        return 0.32;
      case 'RISE':
        return 0.72;
      case 'PEAK':
        return 1.0;
      case 'FALL':
        return 0.46;
      case 'COMPLETED':
      case 'NONE':
      default:
        return 0;
    }
  }

  _getRitualPalette(ritualType, palettePayload = null) {
    const payload = palettePayload || {};
    const fallback = {
      primary: new THREE.Color(0xf7fbff),
      secondary: new THREE.Color(0xb9d9ff),
      accent: new THREE.Color(0xffffff),
      void: new THREE.Color(0x121824)
    };

    const paletteMap = {
      ASCENSION_RITUAL: {
        primary: new THREE.Color(payload.primary ?? 0xffd700),
        secondary: new THREE.Color(payload.secondary ?? 0xfff1a8),
        accent: new THREE.Color(payload.accent ?? 0xf7fbff),
        void: new THREE.Color(payload.void ?? 0x142648)
      },
      QUANTUM_FISSURE: {
        primary: new THREE.Color(payload.primary ?? 0xff4bff),
        secondary: new THREE.Color(payload.secondary ?? 0xc775ff),
        accent: new THREE.Color(payload.accent ?? 0xf7d6ff),
        void: new THREE.Color(payload.void ?? 0x1c0934)
      },
      HARMONY_CONVERGENCE: {
        primary: new THREE.Color(payload.primary ?? 0x00ffaa),
        secondary: new THREE.Color(payload.secondary ?? 0x77f7db),
        accent: new THREE.Color(payload.accent ?? 0xf7fbff),
        void: new THREE.Color(payload.void ?? 0x06263a)
      },
      CHAOS_RITUAL: {
        primary: new THREE.Color(payload.primary ?? 0xff2f7b),
        secondary: new THREE.Color(payload.secondary ?? 0xff73cf),
        accent: new THREE.Color(payload.accent ?? 0xffd1ee),
        void: new THREE.Color(payload.void ?? 0x2b061a)
      },
      MYTHIC_SIGNAL: {
        primary: new THREE.Color(payload.primary ?? 0xf7fbff),
        secondary: new THREE.Color(payload.secondary ?? 0xb9d9ff),
        accent: new THREE.Color(payload.accent ?? 0xffffff),
        void: new THREE.Color(payload.void ?? 0x121824)
      },
      ECHO_RITUAL: {
        primary: new THREE.Color(payload.primary ?? 0x8888ff),
        secondary: new THREE.Color(payload.secondary ?? 0x8fe2ff),
        accent: new THREE.Color(payload.accent ?? 0xe7f1ff),
        void: new THREE.Color(payload.void ?? 0x101d3b)
      }
    };

    return paletteMap[ritualType] || fallback;
  }

  _applyRitualPayload(payload = {}, release = false) {
    const ritualType = payload.ritualType || this.ritualState.ritualType;
    this.ritualState.ritualType = ritualType;
    this.ritualState.phase = payload.phase ?? (release ? 'FALL' : this.ritualState.phase);
    this.ritualState.palette = this._getRitualPalette(ritualType, payload.palette);
    this.ritualState.stamp = performance.now();

    if (payload.anchor && Number.isFinite(payload.anchor.x) && Number.isFinite(payload.anchor.y) && Number.isFinite(payload.anchor.z)) {
      this.ritualState.anchor.set(payload.anchor.x, payload.anchor.y, payload.anchor.z);
    }

    const intensity = Number.isFinite(payload.phaseIntensity)
      ? payload.phaseIntensity
      : this._phaseToIntensity(payload.phase);
    this.ritualState.active = !release;
    this.ritualState.targetIntensity = release ? 0 : intensity;
  }

  _updateRitualState(visualDelta) {
    const alpha = 1 - Math.exp(-Math.max(0.0001, visualDelta) * (this.ritualState.targetIntensity > this.ritualState.intensity ? 3.4 : 1.9));
    this.ritualState.intensity = THREE.MathUtils.lerp(this.ritualState.intensity, this.ritualState.targetIntensity, alpha);

    if (!this.ritualState.active && this.ritualState.intensity <= 0.02) {
      this.ritualState.intensity = 0;
      this.ritualState.targetIntensity = 0;
      this.ritualState.ritualType = null;
      this.ritualState.phase = 'NONE';
    }
  }

  _blendWithRitualColor(baseColor, amount = 0.5) {
    const ritualIntensity = this.ritualState.intensity;
    if (ritualIntensity <= 0.001 || !baseColor) return baseColor.clone();

    const blend = THREE.MathUtils.clamp(amount * ritualIntensity, 0, 1);
    return baseColor.clone()
      .lerp(this.ritualState.palette.primary, blend * 0.72)
      .lerp(this.ritualState.palette.secondary, blend * 0.42);
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
    
    // Dynamic control point offset based on distance and category with Perlin noise
    const offset = Math.min(distance * 0.15, 2.0);
    const categoryInfluence = this._getCategoryInfluence(link.nodeA, link.nodeB);
    const seed = this._hashTo01(`${link.id}:${posA.x},${posA.y},${posA.z}|${posB.x},${posB.y},${posB.z}`);
    const phase = this.time * 0.28;
    
    // Organic noise-based offsets
    const noiseScale = 0.8;
    const noiseX1 = this._perlinNoise(phase * noiseScale + seed * 10, 0, 0);
    const noiseY1 = this._perlinNoise(0, phase * noiseScale + seed * 10, 0);
    const noiseZ1 = this._perlinNoise(0, 0, phase * noiseScale + seed * 10);
    const noiseX2 = this._perlinNoise(phase * noiseScale * 1.2 + seed * 15, seed * 5, 0);
    const noiseY2 = this._perlinNoise(seed * 5, phase * noiseScale * 1.2 + seed * 15, 0);
    const noiseZ2 = this._perlinNoise(0, seed * 5, phase * noiseScale * 1.2 + seed * 15);
    
    this._threadOffset1.set(
      noiseX1 * offset * 0.45,
      noiseY1 * offset * 0.28,
      noiseZ1 * offset * 0.45
    );
    this._threadOffset2.set(
      noiseX2 * offset * categoryInfluence * 0.45,
      noiseY2 * offset * 0.24,
      noiseZ2 * offset * categoryInfluence * 0.45
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
   * Simple Perlin-like noise for organic movement
   */
  _perlinNoise(x, y = 0, z = 0) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    
    const u = this._fade(x);
    const v = this._fade(y);
    const w = this._fade(z);
    
    const A = this._perm[X] + Y;
    const AA = this._perm[A] + Z;
    const AB = this._perm[A + 1] + Z;
    const B = this._perm[X + 1] + Y;
    const BA = this._perm[B] + Z;
    const BB = this._perm[B + 1] + Z;
    
    return this._lerp(w, 
      this._lerp(v, 
        this._lerp(u, this._grad(this._perm[AA], x, y, z), this._grad(this._perm[BA], x - 1, y, z)),
        this._lerp(u, this._grad(this._perm[AB], x, y - 1, z), this._grad(this._perm[BB], x - 1, y - 1, z))),
      this._lerp(v,
        this._lerp(u, this._grad(this._perm[AA + 1], x, y, z - 1), this._grad(this._perm[BA + 1], x - 1, y, z - 1)),
        this._lerp(u, this._grad(this._perm[AB + 1], x, y - 1, z - 1), this._grad(this._perm[BB + 1], x - 1, y - 1, z - 1)))
    );
  }

  _fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  _lerp(t, a, b) {
    return a + t * (b - a);
  }

  _grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  // Permutation table for Perlin noise
  _perm = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
  
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
    const ritualBoost = 1 + this.ritualState.intensity * 0.38;
    const ritualPatternBias = 1 + this.ritualState.intensity * 0.62;

    return {
      signal,
      stability,
      harmony,
      categoryInfluence,
      semanticValue,
      threadProb: Math.min(0.5, (0.12 + baseStrength * 0.18 + signal * 0.07) * ritualBoost),
      pulseWeight: Math.max(0.01, baseStrength * (0.5 + signal * 0.32 + categoryInfluence * 0.15) * this.config.particleDensity * ritualBoost),
      patternProb: Math.min(0.28, (0.04 + baseStrength * 0.14 + semanticValue * 0.08) * ritualPatternBias)
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
    
    // Speed variation: different pulses travel at different speeds
    pulse.speedVariation = 0.8 + Math.random() * 0.4;
    pulse.speed = this.config.pulseSpeed * (0.65 + stability * 0.3 + harmony * 0.2 + this.config.intensity * 0.25) * pulse.speedVariation;
    pulse.category = stability > 0.6 ? 'corrupted' : 'stable';
    
    // Color gradient: store start and end colors for interpolation
    pulse.colorA.copy(this._getCategoryBlendColor(link.nodeA, link.nodeB));
    pulse.colorB.copy(this._getCategoryBlendColor(link.nodeB, link.nodeA));
    const harmonyTint = new THREE.Color(0x77F7DB).lerp(new THREE.Color(0x6DEAFF), harmony);
    const stabilityTint = new THREE.Color(0xF7FBFF).lerp(new THREE.Color(0x05131A), 1 - stability);
    pulse.color = pulse.colorA.clone().lerp(harmonyTint, 0.32).lerp(stabilityTint, 0.14);
    if (stability > 0.6) {
      pulse.color.lerp(new THREE.Color(0xD07BFF), 0.18);
    }
    pulse.colorA.lerp(harmonyTint, 0.32).lerp(stabilityTint, 0.14);
    pulse.colorB.lerp(harmonyTint, 0.32).lerp(stabilityTint, 0.14);
    if (stability > 0.6) {
      pulse.colorA.lerp(new THREE.Color(0xD07BFF), 0.18);
      pulse.colorB.lerp(new THREE.Color(0xD07BFF), 0.18);
    }
    
    if (!pulse.mesh) {
      // Neural Thought Particle: dodecahedron core with inner glow + 3 synaptic tendrils as children
      
      // Core: dodecahedron (12 pentagonal faces — neural/brain feel)
      const coreGeo = new THREE.DodecahedronGeometry(0.12, 0);
      const coreMat = new THREE.MeshBasicMaterial({
        color: pulse.color,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false
      });
      pulse.mesh = new THREE.Mesh(coreGeo, coreMat);
      pulse.mesh.userData.isPulsePacket = true;
      
      // Inner glow: smaller bright sphere inside core
      const innerGeo = new THREE.IcosahedronGeometry(0.04, 0);
      const innerMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xffffff),
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false
      });
      const inner = new THREE.Mesh(innerGeo, innerMat);
      pulse.mesh.add(inner); // Child of core
      
      // 3 Synaptic tendrils: thin tapered shapes radiating outward
      const tendrilAngles = [0, Math.PI * 2 / 3, Math.PI * 4 / 3];
      tendrilAngles.forEach(angle => {
        const tendrilGeo = new THREE.CylinderGeometry(0.005, 0.015, 0.12, 4);
        const tendrilMat = new THREE.MeshBasicMaterial({
          color: pulse.color.clone().lerp(new THREE.Color(0xffffff), 0.3),
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          fog: false
        });
        const tendril = new THREE.Mesh(tendrilGeo, tendrilMat);
        tendril.position.set(Math.cos(angle) * 0.08, 0, Math.sin(angle) * 0.08);
        tendril.rotation.z = Math.PI / 2;
        tendril.rotation.y = angle;
        pulse.mesh.add(tendril); // Child of core
      });
      
      this.consciousnessGroup.add(pulse.mesh);
    }
    
    // Create trail mesh if not exists
    if (!pulse.trailMesh) {
      const trailGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(30 * 3); // 30 trail points
      trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const trailMaterial = new THREE.LineBasicMaterial({
        color: pulse.color,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false
      });
      pulse.trailMesh = new THREE.Line(trailGeometry, trailMaterial);
      pulse.trailMesh.userData.isPulseTrail = true;
      this.consciousnessGroup.add(pulse.trailMesh);
    }
    
    // Reset trail positions
    pulse.trailPositions = [];
    
    pulse.mesh.position.copy(pulse.position);
    pulse.mesh.material.color.copy(pulse.color);
    pulse.mesh.material.opacity = 0.0;
    pulse.mesh.scale.setScalar(0.45 + this.config.intensity * 0.15);
    pulse.mesh.visible = true;
    pulse.trailMesh.material.color.copy(pulse.color);
    pulse.trailMesh.visible = true;
    
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
    
    const grammar = this._selectSemanticPatternGrammar(link, meaning);
    const patternType = grammar.type;
    const meaningColor = this._parseGlyphMeaningColor(meaning) || this._getCategoryBlendColor(link.nodeA, link.nodeB);
    const geometryColor = this._blendWithRitualColor(meaningColor.clone(), 0.46);
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
    
    const count = 6 + (grammar.countBonus || 0);
    const radius = (0.55 + seed * 0.28) * (grammar.radiusMul || 1);
    const thickness = (0.08 + seed * 0.05) * (grammar.thicknessMul || 1);
    
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
      spire: () => {
        const baseRing = new THREE.Mesh(
          new THREE.TorusGeometry(radius * 0.42, thickness * 0.05, 8, 36),
          material.clone()
        );
        baseRing.rotation.x = Math.PI * 0.5;
        baseRing.position.copy(clusterPos);
        baseRing.userData.isSemanticParticle = true;
        baseRing.userData.basePos = clusterPos.clone();
        baseRing.userData.angle = 0;
        baseRing.userData.radius = 0;
        particles.push(baseRing);
        this.consciousnessGroup.add(baseRing);

        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const spire = new THREE.Mesh(
            new THREE.ConeGeometry(thickness * 0.42, thickness * 3.2, 5),
            material.clone()
          );
          spire.position.set(
            clusterPos.x + Math.cos(angle) * radius * 0.54,
            clusterPos.y + thickness * 1.1,
            clusterPos.z + Math.sin(angle) * radius * 0.54
          );
          spire.userData.isSemanticParticle = true;
          spire.userData.basePos = spire.position.clone();
          spire.userData.angle = angle;
          spire.userData.radius = radius * 0.54;
          particles.push(spire);
          this.consciousnessGroup.add(spire);
        }
      },
      fracture: () => {
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const split = new THREE.Mesh(
            new THREE.BoxGeometry(thickness * 0.18, thickness * 2.4, thickness * 1.8),
            material.clone()
          );
          split.position.set(
            clusterPos.x + Math.cos(angle) * radius * 0.24,
            clusterPos.y + Math.sin(angle * 2) * 0.06,
            clusterPos.z + Math.sin(angle) * radius * 0.24
          );
          split.rotation.y = angle + Math.PI * 0.25;
          split.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.26;
          split.userData.isSemanticParticle = true;
          split.userData.basePos = split.position.clone();
          split.userData.angle = angle;
          split.userData.radius = radius * 0.24;
          particles.push(split);
          this.consciousnessGroup.add(split);
        }
      },
      choir: () => {
        const shell = new THREE.Mesh(
          new THREE.TorusGeometry(radius * 0.52, thickness * 0.035, 8, 42),
          material.clone()
        );
        shell.rotation.x = Math.PI * 0.5;
        shell.position.copy(clusterPos);
        shell.userData.isSemanticParticle = true;
        shell.userData.basePos = clusterPos.clone();
        shell.userData.angle = 0;
        shell.userData.radius = 0;
        particles.push(shell);
        this.consciousnessGroup.add(shell);

        for (let i = 0; i < count + 2; i++) {
          const angle = (i / (count + 2)) * Math.PI * 2;
          const mote = new THREE.Mesh(
            new THREE.IcosahedronGeometry(thickness * 0.42, 0),
            material.clone()
          );
          const ringRadius = radius * (i % 2 === 0 ? 0.78 : 0.46);
          mote.position.set(
            clusterPos.x + Math.cos(angle) * ringRadius,
            clusterPos.y + 0.08 * (i % 3 === 0 ? 1 : -0.4),
            clusterPos.z + Math.sin(angle) * ringRadius
          );
          mote.userData.isSemanticParticle = true;
          mote.userData.basePos = mote.position.clone();
          mote.userData.angle = angle;
          mote.userData.radius = ringRadius;
          particles.push(mote);
          this.consciousnessGroup.add(mote);
        }
      },
      wound: () => {
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const thorn = new THREE.Mesh(
            new THREE.BoxGeometry(thickness * 0.22, thickness * 2.7, thickness * 0.28),
            material.clone()
          );
          thorn.position.set(
            clusterPos.x + Math.cos(angle) * radius * 0.38,
            clusterPos.y,
            clusterPos.z + Math.sin(angle) * radius * 0.38
          );
          thorn.rotation.y = angle;
          thorn.rotation.x = (i % 2 === 0 ? 1 : -1) * 0.42;
          thorn.userData.isSemanticParticle = true;
          thorn.userData.basePos = thorn.position.clone();
          thorn.userData.angle = angle;
          thorn.userData.radius = radius * 0.38;
          particles.push(thorn);
          this.consciousnessGroup.add(thorn);
        }
      },
      mandala: () => {
        const outer = new THREE.Mesh(
          new THREE.TorusGeometry(radius * 0.68, thickness * 0.03, 8, 48),
          material.clone()
        );
        outer.rotation.x = Math.PI * 0.5;
        outer.position.copy(clusterPos);
        outer.userData.isSemanticParticle = true;
        outer.userData.basePos = clusterPos.clone();
        outer.userData.angle = 0;
        outer.userData.radius = 0;
        particles.push(outer);
        this.consciousnessGroup.add(outer);

        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const spoke = new THREE.Mesh(
            new THREE.BoxGeometry(thickness * 0.12, thickness * 0.12, radius * 0.92),
            material.clone()
          );
          spoke.position.copy(clusterPos);
          spoke.rotation.y = angle;
          spoke.userData.isSemanticParticle = true;
          spoke.userData.basePos = clusterPos.clone();
          spoke.userData.angle = angle;
          spoke.userData.radius = radius * 0.3;
          particles.push(spoke);
          this.consciousnessGroup.add(spoke);
        }
      },
      memory: () => {
        for (let i = 0; i < 3; i++) {
          const wave = new THREE.Mesh(
            new THREE.TorusGeometry(radius * (0.26 + i * 0.18), thickness * 0.03, 8, 40, Math.PI * 1.18),
            material.clone()
          );
          wave.rotation.x = Math.PI * 0.5;
          wave.rotation.z = i * 0.22;
          wave.position.set(clusterPos.x, clusterPos.y + i * 0.05, clusterPos.z);
          wave.userData.isSemanticParticle = true;
          wave.userData.basePos = wave.position.clone();
          wave.userData.angle = i * 0.6;
          wave.userData.radius = radius * (0.26 + i * 0.18);
          particles.push(wave);
          this.consciousnessGroup.add(wave);
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
    for (const particle of particles) {
      particle.userData.baseColor = particle.material?.color?.clone?.() || geometryColor.clone();
    }
    
    this.activeThoughts.patternClusters.set(link.id, {
      particles,
      life: grammar.life || 3.0,
      maxLife: grammar.life || 3.0,
      meaning,
      basePos: clusterPos.clone(),
      type: patternType,
      signature: grammar.signature || patternType
    });
    
    this.stats.patternsActive++;
  }

  _selectSemanticPatternGrammar(link, meaning) {
    const key = `${link.id}:${typeof meaning === 'string' ? meaning : JSON.stringify(meaning)}:${this.ritualState.ritualType || 'ambient'}`;
    const seed = this._hashTo01(key);
    const base = [
      { type: 'ring', weight: 1.0, life: 3.0, radiusMul: 1.0, thicknessMul: 1.0, countBonus: 0, signature: 'ambient-ring' },
      { type: 'crown', weight: 0.9, life: 3.1, radiusMul: 1.0, thicknessMul: 0.92, countBonus: 0, signature: 'ambient-crown' },
      { type: 'seal', weight: 0.82, life: 3.0, radiusMul: 0.94, thicknessMul: 1.0, countBonus: 0, signature: 'ambient-seal' },
      { type: 'halo', weight: 0.78, life: 3.2, radiusMul: 1.08, thicknessMul: 0.86, countBonus: 0, signature: 'ambient-halo' },
      { type: 'shard', weight: 0.92, life: 2.8, radiusMul: 1.0, thicknessMul: 0.88, countBonus: 0, signature: 'ambient-shard' },
      { type: 'cluster', weight: 1.1, life: 3.0, radiusMul: 0.9, thicknessMul: 0.84, countBonus: 1, signature: 'ambient-cluster' }
    ];

    const ritualGrammar = {
      ASCENSION_RITUAL: [
        { type: 'spire', weight: 1.5, life: 4.2, radiusMul: 1.1, thicknessMul: 0.84, countBonus: 1, signature: 'ascension-spire' },
        { type: 'halo', weight: 1.05, life: 3.8, radiusMul: 1.22, thicknessMul: 0.78, countBonus: 0, signature: 'ascension-halo' },
        { type: 'crown', weight: 0.95, life: 3.7, radiusMul: 1.06, thicknessMul: 0.84, countBonus: 1, signature: 'ascension-crown' }
      ],
      QUANTUM_FISSURE: [
        { type: 'fracture', weight: 1.45, life: 4.0, radiusMul: 0.82, thicknessMul: 0.7, countBonus: 1, signature: 'fissure-fracture' },
        { type: 'wound', weight: 1.1, life: 3.6, radiusMul: 0.94, thicknessMul: 0.78, countBonus: 0, signature: 'fissure-wound' },
        { type: 'shard', weight: 0.9, life: 3.2, radiusMul: 1.0, thicknessMul: 0.8, countBonus: 1, signature: 'fissure-shard' }
      ],
      HARMONY_CONVERGENCE: [
        { type: 'choir', weight: 1.4, life: 4.3, radiusMul: 1.16, thicknessMul: 0.74, countBonus: 2, signature: 'harmony-choir' },
        { type: 'mandala', weight: 1.12, life: 4.0, radiusMul: 1.12, thicknessMul: 0.7, countBonus: 2, signature: 'harmony-mandala' },
        { type: 'halo', weight: 0.9, life: 3.6, radiusMul: 1.18, thicknessMul: 0.76, countBonus: 0, signature: 'harmony-halo' }
      ],
      CHAOS_RITUAL: [
        { type: 'wound', weight: 1.5, life: 3.9, radiusMul: 0.96, thicknessMul: 0.82, countBonus: 1, signature: 'chaos-wound' },
        { type: 'fracture', weight: 1.08, life: 3.5, radiusMul: 0.88, thicknessMul: 0.72, countBonus: 1, signature: 'chaos-fracture' },
        { type: 'shard', weight: 0.94, life: 3.2, radiusMul: 1.0, thicknessMul: 0.86, countBonus: 1, signature: 'chaos-shard' }
      ],
      MYTHIC_SIGNAL: [
        { type: 'mandala', weight: 1.48, life: 4.5, radiusMul: 1.18, thicknessMul: 0.66, countBonus: 2, signature: 'signal-mandala' },
        { type: 'seal', weight: 1.0, life: 3.9, radiusMul: 1.02, thicknessMul: 0.82, countBonus: 1, signature: 'signal-seal' },
        { type: 'choir', weight: 0.92, life: 3.8, radiusMul: 1.06, thicknessMul: 0.72, countBonus: 1, signature: 'signal-choir' }
      ],
      ECHO_RITUAL: [
        { type: 'memory', weight: 1.52, life: 4.4, radiusMul: 1.2, thicknessMul: 0.68, countBonus: 0, signature: 'echo-memory' },
        { type: 'halo', weight: 0.96, life: 3.7, radiusMul: 1.14, thicknessMul: 0.72, countBonus: 0, signature: 'echo-halo' },
        { type: 'seal', weight: 0.84, life: 3.5, radiusMul: 0.94, thicknessMul: 0.84, countBonus: 0, signature: 'echo-seal' }
      ]
    };

    const options = ritualGrammar[this.ritualState.ritualType] || base;
    const totalWeight = options.reduce((sum, item) => sum + item.weight, 0);
    let threshold = seed * totalWeight;

    for (const option of options) {
      threshold -= option.weight;
      if (threshold <= 0) return option;
    }

    return options[options.length - 1];
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
    this._updateRitualState(visualDelta);
    
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
      
      // Handle flash effect from passing pulses
      let flashAdd = 0;
      if (line.userData.flashIntensity > 0) {
        flashAdd = line.userData.flashIntensity * 0.6;
        line.userData.flashIntensity = Math.max(0, line.userData.flashIntensity - (line.userData.flashDecay || 0.1));
      }
      
      line.material.opacity = Math.min(0.85, Math.max(0.12, baseOpacity + breath + flashAdd));
      line.material.color.copy(this._blendWithRitualColor(this._getThreadColor(link), 0.42));
      
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
        if (pulse.trailMesh) pulse.trailMesh.visible = false;
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
        if (pulse.trailMesh) pulse.trailMesh.visible = false;
        this.activeThoughts.pulsePackets.splice(i, 1);
        this.stats.pulsesActive--;
        continue;
      }
      
      pulse.position.lerpVectors(pulse.startPos, pulse.endPos, motionProgress);
      pulse.mesh.position.copy(pulse.position);
      
      // Color gradient based on progress
      const gradientT = progressNorm;
      const pulseColor = pulse.colorA.clone().lerp(pulse.colorB, gradientT);
      const ritualPulseColor = this._blendWithRitualColor(pulseColor, 0.52);
      pulse.mesh.material.color.copy(ritualPulseColor);
      pulse.trailMesh.material.color.copy(ritualPulseColor);
      
      // Update trail
      pulse.trailPositions.push(pulse.position.clone());
      if (pulse.trailPositions.length > 30) {
        pulse.trailPositions.shift();
      }
      if (pulse.trailPositions.length >= 2) {
        const positions = pulse.trailMesh.geometry.attributes.position.array;
        for (let j = 0; j < 30; j++) {
          const idx = j * 3;
          if (j < pulse.trailPositions.length) {
            positions[idx] = pulse.trailPositions[j].x;
            positions[idx + 1] = pulse.trailPositions[j].y;
            positions[idx + 2] = pulse.trailPositions[j].z;
          } else {
            positions[idx] = pulse.position.x;
            positions[idx + 1] = pulse.position.y;
            positions[idx + 2] = pulse.position.z;
          }
        }
        pulse.trailMesh.geometry.attributes.position.needsUpdate = true;
        // Trail opacity fades with pulse life and position along trail
        pulse.trailMesh.material.opacity = Math.min(0.5, 0.08 + pulse.life * envelope * 0.35 * this.config.intensity + this.ritualState.intensity * 0.08);
      }
      
      pulse.mesh.material.opacity = Math.min(0.92, 0.08 + pulse.life * envelope * 0.78 * this.config.intensity + this.ritualState.intensity * 0.1);
      
      const stability = Math.max(0, Math.min(1, pulse.link?.stability ?? 0.5));
      let scaleBase = 0.26 + envelope * 0.84;
      
      // Pulse glow burst at arrival (last 5% of travel)
      if (progressNorm >= 0.95) {
        const burstFactor = (progressNorm - 0.95) / 0.05;
        scaleBase += burstFactor * 0.8;
        pulse.mesh.material.opacity += burstFactor * 0.3;
      }
      
      pulse.mesh.scale.setScalar(scaleBase + stability * 0.12 + this.config.intensity * 0.08 + this.ritualState.intensity * 0.22);
      
      // Link pulsation: flash thread when pulse passes through
      if (Math.random() < 0.08) {
        const thread = this.activeThoughts.threadMeshes.get(pulse.link.id);
        if (thread) {
          thread.userData.flashIntensity = 0.8;
          thread.userData.flashDecay = 0.15;
        }
      }
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
      
      const lifeNorm = Math.max(0, Math.min(1, pattern.life / (pattern.maxLife || 3.0)));
      const phase = this.time * 1.2 + this._hashTo01(`${linkId}-${pattern.type}`) * Math.PI * 2;
      const buildFactor = 1 - Math.pow(lifeNorm, 1.8);
      const fadeFactor = Math.max(0.08, lifeNorm * this.config.intensity);
      const rotationSpeed = 1.0 + (1 - lifeNorm) * 0.6 + this.config.intensity * 0.2;
      const baseAlpha = 0.14 + fadeFactor * 0.48;
      const ritualAlpha = this.ritualState.intensity * 0.14;
      
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
          case 'spire':
            particle.position.x = basePos.x + Math.cos(angle) * radius * 0.34;
            particle.position.y = basePos.y + 0.14 + buildFactor * 0.18 + Math.abs(Math.sin(phase + angle)) * 0.14;
            particle.position.z = basePos.z + Math.sin(angle) * radius * 0.34;
            particle.rotation.y = angle;
            particle.rotation.x = Math.sin(phase * 0.5 + angle) * 0.18;
            break;
          case 'fracture':
            particle.position.x = basePos.x + Math.cos(angle) * radius * 0.18 + Math.sin(phase * 1.8 + angle) * 0.1;
            particle.position.y = basePos.y + Math.sin(angle * 2 + phase * 1.2) * 0.08;
            particle.position.z = basePos.z + Math.sin(angle) * radius * 0.18;
            particle.rotation.y = angle + Math.sin(phase * 1.4 + angle) * 0.24;
            particle.rotation.z += visualDelta * rotationSpeed * 0.4;
            break;
          case 'choir':
            particle.position.x = basePos.x + Math.cos(angle + phase * 0.24) * radius;
            particle.position.y = basePos.y + Math.sin(angle * 1.7 + phase) * 0.12 + buildFactor * 0.06;
            particle.position.z = basePos.z + Math.sin(angle + phase * 0.24) * radius * 0.82;
            particle.rotation.x = phase * 0.24;
            particle.rotation.y = phase * 0.18 + angle;
            break;
          case 'wound':
            particle.position.x = basePos.x + Math.cos(angle) * radius * 0.26 + Math.sin(phase * 2.3 + angle) * 0.12;
            particle.position.y = basePos.y + Math.sin(phase * 1.8 + angle * 2.0) * 0.12;
            particle.position.z = basePos.z + Math.sin(angle) * radius * 0.26;
            particle.rotation.y = angle + phase * 0.42;
            particle.rotation.x = Math.sin(phase + angle) * 0.48;
            break;
          case 'mandala':
            particle.position.x = basePos.x + Math.cos(angle) * radius * 0.1;
            particle.position.y = basePos.y + Math.sin(phase * 0.8 + angle) * 0.04;
            particle.position.z = basePos.z + Math.sin(angle) * radius * 0.1;
            particle.rotation.y = angle + phase * 0.2;
            particle.rotation.z += visualDelta * (rotationSpeed * 0.3 + 0.08);
            break;
          case 'memory':
            particle.position.x = basePos.x;
            particle.position.y = basePos.y + Math.sin(phase * 0.7 + angle) * 0.08 + buildFactor * 0.04;
            particle.position.z = basePos.z;
            particle.rotation.z = phase * 0.26 + angle;
            particle.scale.setScalar(0.82 + buildFactor * 0.28 + (1 - lifeNorm) * 0.18);
            break;
        }
        
        const ritualDip = Math.sin(phase * 0.6) * 0.02;
        particle.position.y += ritualDip;
        
        particle.material.opacity = Math.min(0.82, baseAlpha * fadeFactor * (0.78 + Math.sin(phase * 0.9) * 0.06) + ritualAlpha);
        const patternBaseColor = particle.userData.baseColor || particle.material.color;
        particle.material.color.copy(this._blendWithRitualColor(patternBaseColor, 0.58));
        particle.position.y += this.ritualState.intensity * 0.04 * Math.sin(phase + angle * 2.0);
        const scaleBoost = pattern.type === 'memory'
          ? 0.18
          : pattern.type === 'mandala'
            ? 0.12
            : pattern.type === 'spire'
              ? 0.1
              : 0;
        particle.scale.setScalar(0.7 + buildFactor * 0.24 + this.config.intensity * 0.08 + scaleBoost);
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
    const ritualIntensity = this.ritualState.intensity;
    const monumentScale = 1 + avgStability * 0.1 * this.config.intensity + pressure * 0.07 + ritualIntensity * 0.1;
    const pulseScale = 1 + pulsePhase * 0.04 * (0.45 + networkMood * 0.45) * this.config.intensity;

    this.globalFieldMesh.scale.setScalar(monumentScale * pulseScale);
    if (this.globalFieldEdge) {
      this.globalFieldEdge.scale.setScalar(monumentScale * (1.05 + ritualIntensity * 0.05));
    }

    const calm = new THREE.Color(0x6DEAFF);
    const ritual = new THREE.Color(0xF7FBFF);
    const storm = new THREE.Color(0xD07BFF);
    const corrosion = new THREE.Color(0xFF73CF);

    const moodColor = ritual.clone().lerp(calm, networkMood);
    const tint = moodColor.clone().lerp(storm, corruptionBias * 0.4).lerp(corrosion, pressure * 0.2);
    const fieldColor = this._blendWithRitualColor(tint, 0.62);
    this.globalFieldMesh.material.color.copy(fieldColor);

    const baseOpacity = (0.01 + avgStability * 0.01 + pressure * 0.01) * this.config.intensity;
    this.globalFieldMesh.material.opacity = Math.min(0.11, baseOpacity + Math.abs(pulsePhase) * 0.006 * this.config.intensity + ritualIntensity * 0.035);

    if (this.globalFieldEdge) {
      const edgeTint = this._blendWithRitualColor(
        tint.clone().lerp(new THREE.Color(0x05131A), 1 - networkMood * 0.5),
        0.82
      );
      this.globalFieldEdge.material.color.copy(edgeTint);
      this.globalFieldEdge.material.opacity = Math.min(0.24, 0.08 + pressure * 0.05 + Math.abs(pulsePhase) * 0.02 + ritualIntensity * 0.09);
    }

    if (this.globalFieldChoir) {
      const choirColor = this._blendWithRitualColor(
        tint.clone().lerp(new THREE.Color(0xf7fbff), networkMood * 0.34),
        0.74
      );
      this.globalFieldChoir.material.color.copy(choirColor);
      this.globalFieldChoir.material.opacity = Math.min(
        0.2,
        0.04 + networkMood * 0.05 + pressure * 0.04 + ritualIntensity * 0.08 + Math.abs(pulsePhase) * 0.018
      );
      this.globalFieldChoir.rotation.y += visualDelta * (0.04 + networkMood * 0.06 + ritualIntensity * 0.18);
      this.globalFieldChoir.rotation.x = Math.sin(this.time * 0.14 + pressure) * 0.12 * (0.4 + ritualIntensity);
      const choirScale = monumentScale * (0.98 + networkMood * 0.04 + ritualIntensity * 0.08);
      this.globalFieldChoir.scale.setScalar(choirScale);
    }

    if (this.ritualFieldVeil) {
      this.ritualFieldVeil.material.color.copy(this.ritualState.palette.secondary);
      this.ritualFieldVeil.material.opacity = Math.min(0.18, ritualIntensity * (0.05 + pressure * 0.04) + Math.abs(pulsePhase) * 0.015 * ritualIntensity);
      this.ritualFieldVeil.scale.setScalar(monumentScale * (0.94 + ritualIntensity * 0.18 + Math.abs(pulsePhase) * 0.03));
      this.ritualFieldVeil.rotation.y += visualDelta * (0.05 + ritualIntensity * 0.18);
      this.ritualFieldVeil.rotation.x = Math.sin(this.time * 0.12 + ritualIntensity) * 0.18 * ritualIntensity;
      this.ritualFieldVeil.rotation.z += visualDelta * (0.02 + ritualIntensity * 0.08);
    }

    if (this.ritualFieldWitness && this._ritualWitnessBasePositions) {
      const anchorDir = this.ritualState.anchor.lengthSq() > 0.0001
        ? this.ritualState.anchor.clone().normalize()
        : new THREE.Vector3(0, 1, 0);
      const positions = this.ritualFieldWitness.geometry.attributes.position.array;
      const base = this._ritualWitnessBasePositions;
      for (let i = 0; i < positions.length; i += 3) {
        const bx = base[i];
        const by = base[i + 1];
        const bz = base[i + 2];
        const length = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
        const nx = bx / length;
        const ny = by / length;
        const nz = bz / length;
        const resonance = Math.max(0, nx * anchorDir.x + ny * anchorDir.y + nz * anchorDir.z);
        const swell = 1 + ritualIntensity * (0.05 + resonance * 0.18);
        const shimmer = Math.sin(this.time * 1.4 + i * 0.11) * 0.22 * ritualIntensity;

        positions[i] = bx * swell + anchorDir.x * shimmer;
        positions[i + 1] = by * swell + anchorDir.y * shimmer;
        positions[i + 2] = bz * swell + anchorDir.z * shimmer;
      }
      this.ritualFieldWitness.geometry.attributes.position.needsUpdate = true;
      this.ritualFieldWitness.material.color.copy(this.ritualState.palette.accent);
      this.ritualFieldWitness.material.opacity = Math.min(0.42, ritualIntensity * 0.3 + pressure * 0.05);
      this.ritualFieldWitness.material.size = 0.22 + ritualIntensity * 0.22;
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

    const ritualBudgetBoost = 1 + this.ritualState.intensity * 0.6;
    const threadBudget = Math.max(1, Math.ceil(this.config.intensity * 1.2 * ritualBudgetBoost));
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

    const pulseBudget = Math.max(1, Math.ceil(this.config.particleDensity * (2 + this.ritualState.intensity * 1.8)));
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

    const patternBudget = Math.max(0, Math.floor(this.config.particleDensity * (0.6 + this.ritualState.intensity * 0.9)));
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
        // Dispose children (tendrils, inner glow)
        pulse.mesh.children.forEach(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        this.consciousnessGroup.remove(pulse.mesh);
        pulse.mesh.geometry.dispose();
        pulse.mesh.material.dispose();
        pulse.mesh = null;
      }
      if (pulse.trailMesh) {
        this.consciousnessGroup.remove(pulse.trailMesh);
        pulse.trailMesh.geometry.dispose();
        pulse.trailMesh.material.dispose();
        pulse.trailMesh = null;
      }
      pulse.trailPositions = [];
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
      this.globalFieldEdge = null;
    }
    if (this.globalFieldChoir) {
      this.consciousnessGroup.remove(this.globalFieldChoir);
      this.globalFieldChoir.geometry.dispose();
      this.globalFieldChoir.material.dispose();
      this.globalFieldChoir = null;
    }
    if (this.ritualFieldVeil) {
      this.consciousnessGroup.remove(this.ritualFieldVeil);
      this.ritualFieldVeil.geometry.dispose();
      this.ritualFieldVeil.material.dispose();
      this.ritualFieldVeil = null;
    }
    if (this.ritualFieldWitness) {
      this.consciousnessGroup.remove(this.ritualFieldWitness);
      this.ritualFieldWitness.geometry.dispose();
      this.ritualFieldWitness.material.dispose();
      this.ritualFieldWitness = null;
    }
    this._disposeRitualBridge();
    
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
