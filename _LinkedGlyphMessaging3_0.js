/**
 * LINKED GLYPH MESSAGING 3.0 — ULTRA SYMBOLIC AI LANGUAGE TRANSPORT
 * 
 * A complete symbolic AI language that travels across links as procedural glyph messages.
 * 
 * CORE CONCEPT:
 * Messages originate from node semantic state and travel as grouped glyph bundles
 * along links, carrying symbolic meaning about node state, personality, and metrics.
 * Target nodes "interpret" messages visually (read-only) and can generate responses.
 * 
 * GLYPH MESSAGE STRUCTURE:
 * WORD    = 1-5 procedural mini-glyphs (5-20 bytes per glyph)
 * PHRASE  = 2-3 words (mini-message packets)
 * SENTENCE = 1-2 phrases (full symbolic message)
 * 
 * ROLES (assigned to glyphs dynamically):
 * - SUBJECT    → circle-dot, shard, hex fragment (who is speaking)
 * - STATE      → lotus, shard variants (current semantic state)
 * - TENDENCY   → bent triangles, oriented shards (where this is going)
 * - LINK       → arrow-like fragments (connection strength/quality)
 * - CONTEXT    → ring segments, diamond cores (environmental factors)
 * 
 * TRANSPORT:
 * - Messages spawn at source node
 * - Travel along link with t: 0→1
 * - Speed = synergy + personality modifiers
 * - stability adds jitter
 * - Corruption adds distortion/phase flips
 * - Harmony smooths movement
 * - On arrival: feed back to SemanticGlyphAI (visual-only)
 * - Target node generates response message
 * 
 * SAFETY LAYER:
 * - NO modifications to Node, Link, or AI logic
 * - NO gameplay changes
 * - NO physics modifications
 * - Pure visual layer only
 * - Read-only from semantic AI
 * - < 0.6ms per frame (100 links)
 * - Full auto-cleanup
 * 
 * COMPATIBILITY:
 * ✓ Works with Glyph Speech 1.0-2.0
 * ✓ Works with Adaptive Glyph Rendering
 * ✓ Works with Linked Glyph Synchronization 1.0
 * ✓ Works with Purity Mode 5.1
 * ✓ Works with SemanticGlyphAI (Layer 5.0)
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { getLinkCanonicalMetrics, getNodeCanonicalMetrics } from './SemanticMetricAdapter.js';

export class LinkedGlyphMessaging3_0 {
  constructor(scene, worldRoot, semanticGlyphAI) {
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.semanticGlyphAI = semanticGlyphAI;
    this.linkedGlyphSync = null;
    this.recursiveGlyphMessaging = null;
    this.narrativePatterns = null;
    const attachRoot = worldRoot || scene;
    
    // Enable/disable messaging
    this.enabled = true;
    this.frameScheduler = null;
    
    // Active messages on links (linkId → messageArray)
    this.activeMessages = new Map();
    
    // Message pools for reuse (object pool pattern)
    this.messagePools = {
      words: [],
      phrases: [],
      sentences: [],
      glyphMeshes: []
    };
    
    // Geometry and material pools for performance
    this.geometryPool = new Map();
    this.materialPool = new Map();
    this.meshPool = [];
    this.auraPool = [];
    this.maxPoolSize = 400;
    
    // Container for all messages (keeps scene organized)
    this.messageContainer = new THREE.Group();
    this.messageContainer.userData.isMessaging = true;
    this.messageContainer.name = 'LinkedGlyphMessaging_Messages';
    this.messageContainer.renderOrder = VisualHierarchyRegistry.getRenderOrder(
      VisualHierarchyRegistry.LAYER_GLYPH_HARMONIC || 'GLYPH_HARMONIC'
    );
    attachRoot.add(this.messageContainer);
    this.root = this.messageContainer;

    // Frame throttling (visual layer) — default 30 Hz
    this.updateInterval = 1 / 30;
    this._updateAccum = 0;
    
    // Link tracking
    this.trackedLinks = new Map();  // linkId → { sourceNode, targetNode, lastMessageTime }
    
    // Configuration
    this.config = {
      // Message structure
      minGlyphsPerWord: 1,
      maxGlyphsPerWord: 5,
      wordsPerPhrase: 2,
      phrasesPerSentence: 2,
      
      // Transportation
      messageSpeed: 2.0,            // World units per second (base)
      messageSpeeedBoostFromSynergy: 0.5,
      messageSpeeedReductionFromStability: 0.3,
      jitterFromStability: 0.08,
      distortionFromCorruption: 0.12,
      
      // Animation
      glyphRotationSpeed: 3.0,
      glyphBreathingAmplitude: 0.08,
      glyphBreathingSpeed: 2.0,
      particleTailOpacity: 0.3,
      
      // Generation
      messageGenerationHz: 1.5,     // Messages per second per active link
      messageLifetimeSec: 8.0,
      responseProbability: 0.6,     // Chance target node sends response
      
      // Performance
      maxMessagesPerLink: 3,
      maxTotalMessages: 100
    };
    
    // Semantic AI interpretation cache
    this.interpretationCache = new Map();  // nodeId → lastInterpretedState
    
    // Message generation timers
    this.generationTimers = new Map();     // linkId → timeAccumulator
    
    // Global time
    this.globalTime = 0;
    
    // Statistics
    this.stats = {
      messagesActive: 0,
      messagesSpawned: 0,
      messagesCompleted: 0,
      responsesGenerated: 0,
      linksActive: 0,
      lastFrameTime: 0,
      totalFrames: 0
    };
    
    // Debug flags
    this.debugMode = false;
    this.debugLinkId = null;
    
    // Initialize mesh pools
    this.initializeMessagePools();
    
    console.log('✓ Linked Glyph Messaging 3.0 initialized');
    console.log('  - Ultra symbolic AI language transport');
    console.log('  - Object pooling for mesh performance');
    console.log('  - Messages carry node semantic state');
    console.log('  - Use debugPrintMessages() to inspect');
  }
  
  /**
   * Initialize object pools for efficient memory usage
   */
  initializeMessagePools() {
    const glyphTypes = ['triangle', 'lotus', 'shard', 'diamond', 'ring', 'dot'];
    glyphTypes.forEach(type => {
      const geometry = this._createPoolGeometry(type);
      this.geometryPool.set(type, geometry);
    });
    
    const colors = [
      new THREE.Color(0x8fe9ff),
      new THREE.Color(0xd48cff),
      new THREE.Color(0xffc96a),
      new THREE.Color(0x7ef0c7),
      new THREE.Color(0x93bbff)
    ];
    colors.forEach((color, idx) => {
      const material = new THREE.MeshBasicMaterial({
        color: color.clone(),
        transparent: true,
        opacity: 0.9,
        fog: false,
        depthWrite: false,
        depthTest: true,
        toneMapped: false,
        blending: THREE.AdditiveBlending
      });
      this.materialPool.set(`base_${idx}`, material);
    });
    
    for (let i = 0; i < this.maxPoolSize; i++) {
      this.meshPool.push({ mesh: null, inUse: false, geometry: null, material: null });
    }
    
    for (let i = 0; i < 200; i++) {
      this.auraPool.push({ mesh: null, inUse: false });
    }
  }
  
  /**
   * Create geometry for pool
   */
  _createPoolGeometry(type) {
    let geometry;
    switch (type) {
      case 'triangle':
        geometry = new THREE.TetrahedronGeometry(0.08, 0);
        break;
      case 'lotus':
        geometry = new THREE.ConeGeometry(0.08, 0.12, 6);
        break;
      case 'shard':
        geometry = new THREE.ConeGeometry(0.06, 0.15, 3);
        break;
      case 'diamond':
        geometry = new THREE.OctahedronGeometry(0.08, 0);
        break;
      case 'ring':
        geometry = new THREE.TorusGeometry(0.06, 0.01, 6, 16);
        break;
      case 'dot':
        geometry = new THREE.SphereGeometry(0.04, 5, 5);
        break;
      default:
        geometry = new THREE.TetrahedronGeometry(0.08, 0);
    }
    return geometry;
  }
  
  /**
   * Get mesh from pool
   */
  _getMeshFromPool(type, color, opacity) {
    let pooled = this.meshPool.find(p => !p.inUse);
    
    if (!pooled) {
      pooled = { mesh: null, inUse: false, geometry: null, material: null };
      this.meshPool.push(pooled);
    }
    
    if (!pooled.mesh) {
      const geometry = this.geometryPool.get(type) || this.geometryPool.get('shard');
      const material = new THREE.MeshBasicMaterial({
        color: color || new THREE.Color(0xffffff),
        transparent: true,
        opacity: opacity || 0.9,
        fog: false,
        depthWrite: false,
        depthTest: true,
        toneMapped: false,
        blending: THREE.AdditiveBlending
      });
      pooled.mesh = new THREE.Mesh(geometry, material);
      pooled.geometry = geometry;
      pooled.material = material;
    }
    
    pooled.inUse = true;
    pooled.mesh.material.color.copy(color);
    pooled.mesh.material.opacity = opacity;
    pooled.mesh.visible = true;
    return pooled.mesh;
  }
  
  /**
   * Return mesh to pool
   */
  _returnMeshToPool(mesh) {
    if (!mesh) return;
    const pooled = this.meshPool.find(p => p.mesh === mesh);
    if (pooled) {
      pooled.inUse = false;
      mesh.visible = false;
    } else {
      mesh.visible = false;
    }
  }
  
  /**
   * Get aura from pool
   */
  _getAuraFromPool(geometry, material) {
    let pooled = this.auraPool.find(p => !p.inUse);
    
    if (!pooled) {
      pooled = { mesh: null, inUse: false };
      this.auraPool.push(pooled);
    }
    
    if (!pooled.mesh) {
      pooled.mesh = new THREE.Mesh(geometry, material);
    } else {
      pooled.mesh.geometry = geometry;
      pooled.mesh.material = material;
    }
    
    pooled.inUse = true;
    return pooled.mesh;
  }
  
  /**
   * Return aura to pool
   */
  _returnAuraToPool(mesh) {
    if (!mesh) return;
    const pooled = this.auraPool.find(p => p.mesh === mesh);
    if (pooled) {
      pooled.inUse = false;
      mesh.visible = false;
    } else {
      mesh.visible = false;
    }
  }
  
  /**
   * Create a minimal glyph mesh (triangle, shard, diamond, etc)
   */
  createMiniGlyph(type = 'shard', color = null, opacity = 0.9) {
    let geometry;
    
    // Use simple geometries for performance
    switch (type) {
      case 'triangle':
        geometry = new THREE.TetrahedronGeometry(0.08, 0);
        break;
      case 'lotus':
        geometry = new THREE.ConeGeometry(0.08, 0.12, 6);
        break;
      case 'shard':
        geometry = new THREE.ConeGeometry(0.06, 0.15, 3);
        break;
      case 'diamond':
        geometry = new THREE.OctahedronGeometry(0.08, 0);
        break;
      case 'ring':
        geometry = new THREE.TorusGeometry(0.06, 0.01, 6, 16);
        break;
      case 'dot':
        geometry = new THREE.SphereGeometry(0.04, 5, 5);
        break;
      default:
        geometry = new THREE.TetrahedronGeometry(0.08, 0);
    }
    
    const material = new THREE.MeshBasicMaterial({
      color: color || new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
      transparent: true,
      opacity,
      fog: false,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
      blending: THREE.AdditiveBlending
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.isMessageGlyph = true;
    mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder(
      VisualHierarchyRegistry.LAYER_GLYPH_HARMONIC || 'GLYPH_HARMONIC'
    );
    return mesh;
  }

  _clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  _getRoleStyle(messageType, sourceMetrics = {}, linkMetrics = {}, targetMetrics = {}) {
    const styleMap = {
      SUBJECT: {
        baseColor: new THREE.Color(0x8fe9ff),
        accentColor: new THREE.Color(0xffffff),
        corruptionColor: new THREE.Color(0xffb366),
        harmonyColor: new THREE.Color(0xb9f4ff),
        shapeOrder: ['dot', 'diamond', 'shard'],
        baseScale: 0.28,
        spacing: 0.19,
        lift: 0.06,
        depth: 0.03,
        pitch: 0.02,
        yaw: 0.0,
        roll: 0.08,
        rollJitter: 0.12,
        opacity: 0.95
      },
      STATE: {
        baseColor: new THREE.Color(0xd48cff),
        accentColor: new THREE.Color(0xffe1ff),
        corruptionColor: new THREE.Color(0xff7a93),
        harmonyColor: new THREE.Color(0xf5d2ff),
        shapeOrder: ['lotus', 'shard', 'lotus', 'shard'],
        baseScale: 0.26,
        spacing: 0.17,
        lift: 0.09,
        depth: 0.04,
        pitch: 0.03,
        yaw: 0.08,
        roll: 0.12,
        rollJitter: 0.18,
        opacity: 0.9
      },
      TENDENCY: {
        baseColor: new THREE.Color(0xffc96a),
        accentColor: new THREE.Color(0xfff1c9),
        corruptionColor: new THREE.Color(0xff8d4a),
        harmonyColor: new THREE.Color(0xffe9a3),
        shapeOrder: ['triangle', 'shard', 'triangle'],
        baseScale: 0.27,
        spacing: 0.2,
        lift: 0.07,
        depth: 0.05,
        pitch: -0.05,
        yaw: 0.18,
        roll: -0.1,
        rollJitter: 0.16,
        opacity: 0.94
      },
      CONTEXT: {
        baseColor: new THREE.Color(0x7ef0c7),
        accentColor: new THREE.Color(0xd7fff0),
        corruptionColor: new THREE.Color(0xb3a3ff),
        harmonyColor: new THREE.Color(0xecfffb),
        shapeOrder: ['ring', 'diamond', 'ring', 'diamond'],
        baseScale: 0.24,
        spacing: 0.16,
        lift: 0.08,
        depth: 0.045,
        pitch: 0.0,
        yaw: -0.04,
        roll: 0.05,
        rollJitter: 0.1,
        opacity: 0.88
      },
      LINK: {
        baseColor: new THREE.Color(0x93bbff),
        accentColor: new THREE.Color(0xe7f2ff),
        corruptionColor: new THREE.Color(0xff9a9a),
        harmonyColor: new THREE.Color(0xdbe8ff),
        shapeOrder: ['diamond', 'shard', 'diamond'],
        baseScale: 0.25,
        spacing: 0.18,
        lift: 0.06,
        depth: 0.04,
        pitch: 0.04,
        yaw: 0.12,
        roll: 0.1,
        rollJitter: 0.12,
        opacity: 0.9
      }
    };

    const style = styleMap[messageType] || styleMap.CONTEXT;
    const synergy = this._clamp01(linkMetrics.synergy ?? sourceMetrics.synergy ?? targetMetrics.synergy ?? 0.5);
    const corruption = this._clamp01(linkMetrics.corruption ?? sourceMetrics.corruption ?? targetMetrics.corruption ?? 0);
    const harmony = this._clamp01(sourceMetrics.harmony ?? targetMetrics.harmony ?? linkMetrics.harmony ?? 0);
    const stability = this._clamp01(sourceMetrics.stability ?? targetMetrics.stability ?? linkMetrics.stability ?? 0.5);

    const color = style.baseColor.clone().lerp(style.accentColor, harmony * 0.24 + synergy * 0.16);
    if (corruption > 0) {
      color.lerp(style.corruptionColor, corruption * 0.28);
    }
    color.offsetHSL(0, 0, (harmony * 0.06) + (synergy * 0.03) - (corruption * 0.05));

    return {
      ...style,
      color,
      synergy,
      corruption,
      harmony,
      stability
    };
  }

  _getGlyphBlueprint(messageType, index, count, style, metrics = {}) {
    const centeredIndex = index - ((count - 1) * 0.5);
    const progress = count <= 1 ? 0.5 : index / (count - 1);
    const spread = style.spacing;
    const liftWave = Math.sin((progress - 0.5) * Math.PI) * style.lift;
    const depthWave = Math.cos(index * 1.6 + (metrics.synergy || 0) * 2.0) * style.depth;
    const shape = style.shapeOrder[index % style.shapeOrder.length];
    const color = style.color.clone();
    const scaleBoost = 0.88 + (1.0 - Math.abs(progress - 0.5)) * 0.18 + (metrics.synergy || 0) * 0.08 + (metrics.harmony || 0) * 0.05 - (metrics.corruption || 0) * 0.06;

    if ((metrics.corruption || 0) > 0) {
      color.lerp(style.corruptionColor, (metrics.corruption || 0) * 0.22);
    }

    if ((metrics.harmony || 0) > 0) {
      color.lerp(style.harmonyColor, (metrics.harmony || 0) * 0.16);
    }

    return {
      type: shape,
      color,
      scale: Math.max(0.12, style.baseScale * scaleBoost),
      opacity: style.opacity * (0.94 + (metrics.harmony || 0) * 0.05 - (metrics.corruption || 0) * 0.07),
      offset: new THREE.Vector3(centeredIndex * spread, liftWave, depthWave),
      rotation: new THREE.Euler(
        style.pitch + liftWave * 0.14,
        style.yaw + centeredIndex * 0.05,
        style.roll + (index % 2 === 0 ? -1 : 1) * style.rollJitter
      )
    };
  }

  _getSeededClusterNoise(seed, index, axis = 0) {
    const value = Math.sin(seed * 12.9898 + index * 78.233 + axis * 37.719) * 43758.5453;
    return (value - Math.floor(value)) * 2 - 1;
  }

  _getWordClusterOffset(message, wordIndex, style) {
    const angle = message.seed * 0.52 + wordIndex * 1.72 + (wordIndex % 2 === 0 ? 0.5 : -0.34);
    const radius = 0.14 + wordIndex * 0.016 + style.spacing * 0.12;
    const scatter = 0.09 + style.corruption * 0.05 + (1 - style.stability) * 0.03;
    const center = new THREE.Vector3(
      Math.cos(message.seed * 0.33) * 0.05,
      Math.sin(message.seed * 0.21) * 0.03,
      0
    );

    return new THREE.Vector3(
      center.x + Math.cos(angle) * radius + this._getSeededClusterNoise(message.seed, wordIndex, 0) * scatter,
      center.y + Math.sin(angle * 0.9) * radius * 0.66 + this._getSeededClusterNoise(message.seed, wordIndex, 1) * scatter * 0.7,
      center.z + Math.sin(angle * 1.27) * 0.03 + this._getSeededClusterNoise(message.seed, wordIndex, 2) * 0.02
    );
  }

  _selectMessageFlightPattern(message) {
    const synergy = message.linkMetrics?.synergy ?? message.sourceMetrics?.synergy ?? 0.5;
    const corruption = message.linkMetrics?.corruption ?? message.sourceMetrics?.corruption ?? 0;
    const harmony = message.sourceMetrics?.harmony ?? message.targetMetrics?.harmony ?? 0;
    const modes = ['spiral', 'arc', 'zigzag', 'flare', 'drift'];
    const selector = Math.abs(Math.sin(message.seed * 7.13 + synergy * 3.1 + corruption * 4.7 + harmony * 2.2));
    const mode = modes[Math.floor(selector * modes.length) % modes.length];

    return {
      mode,
      twist: 0.03 + synergy * 0.04 + harmony * 0.02,
      wobble: 0.018 + corruption * 0.02,
      spread: 0.02 + harmony * 0.01,
      flutter: 0.012 + corruption * 0.015,
      driftBias: new THREE.Vector3(
        this._getSeededClusterNoise(message.seed, 0, 3) * 0.012,
        this._getSeededClusterNoise(message.seed, 1, 3) * 0.012,
        this._getSeededClusterNoise(message.seed, 2, 3) * 0.01
      ),
      phase: message.seed * 0.5 + synergy * 3.0
    };
  }

  _applyFlightPatternToPosition(basePos, message, pattern, progress, settlePhase) {
    const t = progress * Math.PI * 2;
    const driftScale = (1 - settlePhase) * (0.03 + pattern.spread);
    const wobble = pattern.wobble * (1 - settlePhase);
    const out = basePos.clone();

    switch (pattern.mode) {
      case 'spiral':
        out.x += Math.cos(t + pattern.phase) * driftScale;
        out.y += Math.sin(t * 1.2 + pattern.phase) * driftScale * 0.75;
        out.z += Math.sin(t * 0.7 + pattern.phase) * driftScale * 0.35;
        break;
      case 'arc':
        out.x += Math.sin(t * 0.5 + pattern.phase) * driftScale * 1.4;
        out.y += Math.sin(t + pattern.phase) * driftScale * 0.6;
        out.z += Math.cos(t * 0.8 + pattern.phase) * driftScale * 0.25;
        break;
      case 'zigzag':
        out.x += (Math.sin(t * 3.0 + pattern.phase) > 0 ? 1 : -1) * driftScale * 0.55;
        out.y += Math.sin(t * 1.7 + pattern.phase) * driftScale * 0.35;
        out.z += Math.cos(t * 2.2 + pattern.phase) * driftScale * 0.22;
        break;
      case 'flare':
        out.x += Math.sin(t * 1.1 + pattern.phase) * driftScale * 0.9;
        out.y += Math.cos(t * 2.1 + pattern.phase) * driftScale * 0.55;
        out.z += Math.sin(t * 1.9 + pattern.phase) * driftScale * 0.28;
        break;
      case 'drift':
      default:
        out.x += pattern.driftBias.x + Math.sin(t * 0.8 + pattern.phase) * driftScale * 0.5;
        out.y += pattern.driftBias.y + Math.cos(t * 0.9 + pattern.phase) * driftScale * 0.35;
        out.z += pattern.driftBias.z + Math.sin(t * 0.6 + pattern.phase) * driftScale * 0.18;
        break;
    }

    out.x += this._getSeededClusterNoise(message.seed, 0, 0) * wobble;
    out.y += this._getSeededClusterNoise(message.seed, 1, 0) * wobble;
    out.z += this._getSeededClusterNoise(message.seed, 2, 0) * wobble * 0.7;
    return out;
  }

  _selectClusterMotionVariant(message, wordIndex) {
    const synergy = message.linkMetrics?.synergy ?? message.sourceMetrics?.synergy ?? 0.5;
    const corruption = message.linkMetrics?.corruption ?? message.sourceMetrics?.corruption ?? 0;
    const harmony = message.sourceMetrics?.harmony ?? message.targetMetrics?.harmony ?? 0;
    const scheme = message.clusterMotionScheme || this._selectClusterMotionScheme(message, synergy, corruption, harmony);
    return scheme[wordIndex % scheme.length];
  }

  _selectClusterMotionScheme(message, synergy, corruption, harmony) {
    const orderSeed = Math.abs(Math.floor(message.seed * 1000 + synergy * 97 + corruption * 131 + harmony * 173));
    const commonSchemes = [
      ['coil', 'sweep', 'fracture', 'crown'],
      ['coil', 'crown', 'sweep', 'lattice'],
      ['sweep', 'coil', 'lattice', 'fracture'],
      ['fracture', 'coil', 'sweep', 'lattice'],
      ['lattice', 'coil', 'sweep', 'fracture'],
      ['coil', 'fracture', 'sweep', 'lattice'],
    ];

    const sacredSchemes = [
      ['crown', 'sweep', 'fracture', 'lattice'],
      ['sweep', 'crown', 'coil', 'fracture'],
      ['fracture', 'lattice', 'crown', 'coil'],
      ['crown', 'coil', 'lattice', 'sweep']
    ];

    const sacredChance = Math.min(0.22, Math.max(0.04, 0.06 + synergy * 0.08 + harmony * 0.06 - corruption * 0.05));
    const sacredSeed = Math.abs(Math.sin(orderSeed * 0.00091 + synergy * 1.7 + harmony * 1.3 - corruption * 2.1));
    const useSacredScheme = sacredSeed < sacredChance;
    const schemes = useSacredScheme ? sacredSchemes : commonSchemes;

    return schemes[orderSeed % schemes.length];
  }

  _applyClusterMotionVariant(basePosition, message, variant, wordIndex, progress, settlePhase, rolePulse) {
    const t = this.globalTime * 1.05 + message.seed * 0.7 + wordIndex * 0.83;
    const phase = progress * Math.PI * 2;
    const motion = basePosition.clone();
    const strength = (1 - settlePhase) * rolePulse;

    switch (variant) {
      case 'coil':
        motion.x += Math.cos(phase * 4.9 + t * 0.8) * 0.018 * strength;
        motion.y += (progress - 0.5) * 0.046 * strength + Math.sin(phase * 4.1 + t * 0.55) * 0.004 * strength;
        motion.z += Math.sin(phase * 4.9 + t * 0.8) * 0.018 * strength;
        break;
      case 'sweep':
        motion.x += (progress - 0.5) * 0.06 * strength + Math.sin(t * 0.32 + phase * 0.5) * 0.01 * strength;
        motion.y += Math.sin(t * 0.26 + phase * 0.75) * 0.012 * strength;
        motion.z += Math.cos(t * 0.38 + phase * 0.42) * 0.014 * strength;
        break;
      case 'fracture':
      default: {
        const fracturePhase = t * 5.6 + phase * 1.6;
        const burst = Math.sin(fracturePhase);
        const shardPulse = 0.034 + Math.abs(Math.sin(t * 3.1 + phase * 1.9)) * 0.026;
        motion.x += Math.sign(burst) * shardPulse * strength;
        motion.y += Math.sign(Math.sin(fracturePhase * 0.93 + message.seed)) * 0.022 * strength;
        motion.z += Math.sign(Math.cos(fracturePhase * 1.07 + message.seed * 0.5)) * 0.024 * strength;
        motion.x += Math.sin(fracturePhase * 2.0 + message.seed) * 0.008 * strength;
        motion.y += Math.cos(fracturePhase * 1.7 + message.seed * 0.3) * 0.007 * strength;
        motion.z += Math.sin(fracturePhase * 2.3 + message.seed * 0.7) * 0.007 * strength;
        break;
      }
      case 'crown': {
        const crownPhase = phase * 1.05 + t * 0.42;
        const crownLift = Math.pow(Math.max(0, Math.sin(crownPhase)), 1.45);
        const crownRadius = 0.01 + crownLift * 0.014;
        const crownSymmetry = Math.cos(crownPhase * 2.0);
        motion.x += Math.cos(crownPhase) * crownRadius * strength;
        motion.y += crownLift * 0.048 * strength + 0.008 * strength;
        motion.z += Math.sin(crownPhase) * crownRadius * 0.72 * strength;
        motion.x += crownSymmetry * 0.003 * strength;
        motion.z += Math.sin(crownPhase * 1.5 + message.seed * 0.35) * 0.003 * strength;
        break;
      }
      case 'lattice': {
        const latticePhase = t * 0.82 + phase * 1.8;
        const facetStep = Math.round(Math.sin(latticePhase * 1.7) * 2.0) * 0.5;
        const snapX = Math.round(Math.sin(latticePhase) * 2.0) * 0.008;
        const snapY = Math.round(Math.cos(latticePhase * 0.92) * 2.0) * 0.009;
        const snapZ = Math.round(Math.sin(latticePhase * 1.18) * 2.0) * 0.008;
        motion.x += snapX * strength + facetStep * 0.0025 * strength;
        motion.y += snapY * strength + Math.max(0, facetStep) * 0.0055 * strength;
        motion.z += snapZ * strength - facetStep * 0.0015 * strength;
        break;
      }
    }

    return motion;
  }

  _createMessageAura(group, style) {
    const auraMeshes = [];
    const auraOrder = VisualHierarchyRegistry.getRenderOrder(
      VisualHierarchyRegistry.LAYER_GLYPH_HARMONIC || 'GLYPH_HARMONIC'
    ) - 1;

    const makeAuraMaterial = (opacity) => {
      const baseMaterial = this.materialPool.get('base_1') || null;
      if (baseMaterial) {
        const mat = baseMaterial.clone();
        mat.color = style.color.clone();
        mat.opacity = opacity;
        return mat;
      }
      return new THREE.MeshBasicMaterial({
        color: style.color.clone(),
        transparent: true,
        opacity,
        fog: false,
        depthWrite: false,
        depthTest: true,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });
    };

    const coreGeometry = new THREE.SphereGeometry(0.04, 6, 6);
    const core = this._getAuraFromPool(coreGeometry, makeAuraMaterial(style.opacity * 0.22));
    core.userData.isMessageAura = true;
    core.userData.baseOpacity = core.material.opacity;
    core.renderOrder = auraOrder;
    group.add(core);
    auraMeshes.push(core);

    for (let i = 0; i < 3; i++) {
      const fragmentGeometry = new THREE.SphereGeometry(0.018 + i * 0.002, 5, 5);
      const fragment = this._getAuraFromPool(fragmentGeometry, makeAuraMaterial(style.opacity * (0.09 + i * 0.03)));
      fragment.userData.isMessageAura = true;
      fragment.userData.baseOpacity = fragment.material.opacity;
      fragment.renderOrder = auraOrder;
      const fragmentAngle = i * 2.2 + this._getSeededClusterNoise(style.synergy || 0.5, i, 0) * 0.5;
      fragment.position.set(
        Math.cos(fragmentAngle) * (0.18 + i * 0.03),
        Math.sin(fragmentAngle * 0.8) * 0.1,
        Math.sin(fragmentAngle * 1.25) * 0.04
      );
      group.add(fragment);
      auraMeshes.push(fragment);
    }

    return auraMeshes;
  }
  
  /**
   * Register a link for messaging
   */
  registerLink(link, linkId, sourceNode, targetNode) {
    if (this.trackedLinks.has(linkId)) return;
    
    this.trackedLinks.set(linkId, {
      link,
      linkId,
      sourceNode,
      targetNode,
      createdAt: Date.now(),
      messagesGenerated: 0,
      lastMessageTime: 0
    });
    
    this.generationTimers.set(linkId, 0);
    this.activeMessages.set(linkId, []);

    this.linkedGlyphSync?.registerLink?.(link, linkId, sourceNode, targetNode);
  }
  
  /**
   * Unregister a link from messaging
   */
  unregisterLink(linkId) {
    const tracked = this.trackedLinks.get(linkId);

    // Clean up all messages on this link
    const messages = this.activeMessages.get(linkId);
    if (messages) {
      messages.forEach(msg => this.despawnMessage(msg));
      this.activeMessages.delete(linkId);
    }

    if (tracked) {
      this.linkedGlyphSync?.unregisterLink?.(linkId);
    }
    
    this.trackedLinks.delete(linkId);
    this.generationTimers.delete(linkId);
    this.stats.linksActive = this.trackedLinks.size;
    this.stats.messagesActive = this.activeMessages.size;
  }

  setLinkedGlyphSync(linkedGlyphSync) {
    this.linkedGlyphSync = linkedGlyphSync || null;

    if (!this.linkedGlyphSync) {
      return null;
    }

    for (const trackedLink of this.trackedLinks.values()) {
      this.linkedGlyphSync.registerLink?.(
        trackedLink.link,
        trackedLink.linkId,
        trackedLink.sourceNode,
        trackedLink.targetNode
      );
    }

    return this.linkedGlyphSync;
  }

  setRecursiveGlyphMessaging(recursiveGlyphMessaging) {
    this.recursiveGlyphMessaging = recursiveGlyphMessaging || null;
    
    if (this.recursiveGlyphMessaging) {
      console.log('✓ LinkedGlyphMessaging3_0 linked to RecursiveGlyphMessaging4_0');
    }
    
    return this.recursiveGlyphMessaging;
  }

  setNarrativePatterns(narrativePatterns) {
    this.narrativePatterns = narrativePatterns || null;
    
    if (this.narrativePatterns) {
      console.log('✓ LinkedGlyphMessaging3_0 linked to AINarrativePatterns6_0');
    }
    
    return this.narrativePatterns;
  }

  resetForWorldSwitch({ scene = this.scene, worldRoot = this.worldRoot, semanticGlyphAI = this.semanticGlyphAI, linkedGlyphSync = this.linkedGlyphSync } = {}) {
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.semanticGlyphAI = semanticGlyphAI;
    this.linkedGlyphSync = linkedGlyphSync || null;

    const attachRoot = this.worldRoot || this.scene;
    if (this.messageContainer && attachRoot && this.messageContainer.parent !== attachRoot) {
      this.messageContainer.parent?.remove(this.messageContainer);
      attachRoot.add(this.messageContainer);
    }

    this.cleanup();

    if (this.linkedGlyphSync) {
      this.setLinkedGlyphSync(this.linkedGlyphSync);
    }

    this.root = this.messageContainer;
    return this;
  }
  
  /**
   * Generate a message word from node semantic state
   */
  generateMessageWord(node, messageType = 'STATE') {
    if (!node) return null;

    const linkMetrics = (messageType === 'TENDENCY' || messageType === 'LINK') ? (getLinkCanonicalMetrics(node) ?? {}) : {};
    const nodeMetrics = (messageType === 'TENDENCY' || messageType === 'LINK') ? {} : (getNodeCanonicalMetrics(node) ?? {});

    const synergy = linkMetrics.synergy ?? nodeMetrics.synergy ?? 0.5;
    const corruption = linkMetrics.corruption ?? nodeMetrics.corruption ?? 0;
    const stability = nodeMetrics.stability ?? 0.5;
    const harmony = nodeMetrics.harmony ?? linkMetrics.harmony ?? 0;
    const loadPressure = nodeMetrics.loadPressure ?? 0;
    const resolvedMetrics = {
      synergy,
      corruption,
      stability,
      harmony,
      loadPressure
    };

    const roleStyle = this._getRoleStyle(messageType, nodeMetrics, linkMetrics, nodeMetrics);
    const baseCountByRole = {
      SUBJECT: 3,
      STATE: 4,
      TENDENCY: 3,
      CONTEXT: 4,
      LINK: 3
    };
    const baseCount = baseCountByRole[messageType] ?? 3;
    const complexityBoost = (synergy > 0.72 ? 1 : 0) + (harmony > 0.7 ? 1 : 0) - (corruption > 0.65 ? 1 : 0);
    const glyphCount = Math.max(3, Math.min(5, baseCount + complexityBoost));
    
    // Determine glyph count (more glyphs for complex states)
    // Create word structure
    const word = {
      type: messageType,
      glyphs: [],
      role: this.determineGlyphRole(node, messageType),
      semanticVector: resolvedMetrics,
      style: roleStyle
    };
    
    // Generate individual glyphs for this word
    for (let i = 0; i < glyphCount; i++) {
      const blueprint = this._getGlyphBlueprint(messageType, i, glyphCount, roleStyle, resolvedMetrics);
      const glyph = {
        type: blueprint.type,
        color: blueprint.color,
        scale: blueprint.scale,
        rotation: blueprint.rotation,
        offset: blueprint.offset,
        opacity: blueprint.opacity
      };
      word.glyphs.push(glyph);
    }
    
    return word;
  }
  
  /**
   * Determine the role of a glyph based on context
   */
  determineGlyphRole(node, messageType) {
    const canonical = getNodeCanonicalMetrics(node) ?? {};
    const synergy = canonical.synergy ?? 0.5;
    const corruption = canonical.corruption ?? 0;
    const stability = canonical.stability ?? 0;
    const harmony = canonical.harmony ?? 0;
    
    if (messageType === 'SUBJECT') {
      return 'SUBJECT'; // Identity
    } else if (messageType === 'STATE') {
      if (corruption > 0.6) return 'CORRUPTED';
      if (stability < 0.4) return 'UNSTABLE';
      if (synergy > 0.7) return 'STRONG';
      if (harmony > 0.7) return 'PEACEFUL';
      return 'NEUTRAL';
    } else if (messageType === 'TENDENCY') {
      if (synergy > 0.7) return 'ASCENDING';
      if (corruption > 0.6) return 'DECAYING';
      if (stability < 0.4) return 'CHAOTIC';
      return 'STABLE';
    } else if (messageType === 'LINK') {
      return 'CONNECTION';
    } else {
      return 'CONTEXT';
    }
  }
  
  /**
   * Select glyph type based on semantic role
   */
  selectGlyphType(messageType, index, count) {
    if (messageType === 'SUBJECT') {
      return ['dot', 'shard', 'diamond'][index % 3];
    } else if (messageType === 'STATE') {
      return index % 2 === 0 ? 'lotus' : 'shard';
    } else if (messageType === 'TENDENCY') {
      return ['triangle', 'shard'][index % 2];
    } else if (messageType === 'LINK') {
      return 'diamond';
    } else {
      return ['ring', 'diamond'][index % 2];
    }
  }
  
  /**
   * Select glyph color based on semantic state
   */
  selectGlyphColor(synergy, corruption, harmony, messageType = 'STATE') {
    const color = new THREE.Color();
    switch (messageType) {
      case 'SUBJECT':
        color.setHex(0x8fe9ff);
        break;
      case 'STATE':
        color.setHex(0xd48cff);
        break;
      case 'TENDENCY':
        color.setHex(0xffc96a);
        break;
      case 'CONTEXT':
        color.setHex(0x7ef0c7);
        break;
      case 'LINK':
        color.setHex(0x93bbff);
        break;
      default:
        color.setHex(0xb7b7ff);
        break;
    }

    if (harmony > 0) {
      color.lerp(new THREE.Color(0xffffff), harmony * 0.12);
    }

    if (synergy > 0.7) {
      color.lerp(new THREE.Color(0xbffcff), 0.12);
    }

    if (corruption > 0.6) {
      color.lerp(new THREE.Color(0xff9c6a), 0.16);
    }

    return color;
  }
  
  /**
   * Build a complete message (word sequence)
   */
  buildMessage(sourceNode, targetNode, linkData) {
    if (!sourceNode || !targetNode) return null;

    const sourceMetrics = getNodeCanonicalMetrics(sourceNode) ?? {};
    const targetMetrics = getNodeCanonicalMetrics(targetNode) ?? {};
    const linkMetrics = getLinkCanonicalMetrics(linkData.link) ?? {};
    
    // Create sentence: subject + state + link + context (simplified to phrase)
    const message = {
      sourceNode,
      targetNode,
      linkData: {
        ...linkData,
        sourceMetrics,
        targetMetrics,
        linkMetrics,
        synergy: linkMetrics.synergy ?? linkData.synergy ?? 0.5,
        corruption: linkMetrics.corruption ?? linkData.corruption ?? 0
      },
      sourceMetrics,
      targetMetrics,
      linkMetrics,
      words: [],
      wordGroups: [],
      auraMeshes: [],
      createdAt: Date.now(),
      startPosition: sourceNode.position.clone(),
      endPosition: targetNode.position.clone(),
      progress: 0,  // 0 to 1
      meshes: [],   // Grouped glyph meshes
      seed: Math.random() * Math.PI * 2,
      flightPattern: null,
      totalLifetime: this.config.messageLifetimeSec * 1000
    };

    message.flightPattern = this._selectMessageFlightPattern(message);
    message.clusterMotionScheme = this._selectClusterMotionScheme(
      message,
      message.linkMetrics?.synergy ?? message.sourceMetrics?.synergy ?? 0.5,
      message.linkMetrics?.corruption ?? message.sourceMetrics?.corruption ?? 0,
      message.sourceMetrics?.harmony ?? message.targetMetrics?.harmony ?? 0
    );
    
    // Generate words
    message.words.push(this.generateMessageWord(sourceNode, 'SUBJECT'));
    message.words.push(this.generateMessageWord(sourceNode, 'STATE'));
    message.words.push(this.generateMessageWord(linkData.link, 'TENDENCY'));
    message.words.push(this.generateMessageWord(targetNode, 'CONTEXT'));
    
    // Create visual representation
    this.createMessageMeshes(message);
    
    return message;
  }
  
  /**
   * Create 3D meshes for message visualization
   */
  createMessageMeshes(message) {
    const group = new THREE.Group();
    group.userData.isMessageGroup = true;
    group.userData.isMessageSentence = true;
    group.renderOrder = VisualHierarchyRegistry.getRenderOrder(
      VisualHierarchyRegistry.LAYER_GLYPH_HARMONIC || 'GLYPH_HARMONIC'
    );

    const sentenceStyle = this._getRoleStyle(
      'CONTEXT',
      message.sourceMetrics,
      message.linkMetrics,
      message.targetMetrics
    );
    message.auraMeshes = this._createMessageAura(group, sentenceStyle);
    
    // Render each word as grouped glyphs
    message.words.forEach((word, wordIndex) => {
      const wordGroup = new THREE.Group();
      wordGroup.userData.isMessageWord = true;
      wordGroup.userData.wordType = word.type;
      wordGroup.userData.motionVariant = this._selectClusterMotionVariant(message, wordIndex);
      wordGroup.userData.basePosition = this._getWordClusterOffset(message, wordIndex, sentenceStyle);
      wordGroup.position.copy(wordGroup.userData.basePosition);
      wordGroup.rotation.z = wordIndex === 2 ? 0.14 : (wordIndex === 1 ? -0.04 : 0.0);
      wordGroup.renderOrder = group.renderOrder + 1;

      word.glyphs.forEach((glyph, glyphIndex) => {
        // Get pooled glyph mesh
        const mesh = this._getMeshFromPool(glyph.type, glyph.color, glyph.opacity);
        
        // Set position with slight stagger
        mesh.position.set(
          glyph.offset.x,
          glyph.offset.y,
          glyph.offset.z
        );
        
        // Set color
        mesh.material.color.copy(glyph.color);
        mesh.scale.setScalar(glyph.scale * 0.6); // Mini size (2x of previous)
        mesh.rotation.set(glyph.rotation.x, glyph.rotation.y, glyph.rotation.z);
        
        // Store animation data
        mesh.userData.glyphData = glyph;
        mesh.userData.wordIndex = wordIndex;
        mesh.userData.glyphIndex = glyphIndex;
        mesh.userData.wordType = word.type;
        
        wordGroup.add(mesh);
        message.meshes.push(mesh);
      });
      
      group.add(wordGroup);
      message.wordGroups.push(wordGroup);
    });
    
    // Add to scene
    this.messageContainer.add(group);
    message.meshGroup = group;
  }
  
  /**
   * Spawn a message on a link
   */
  spawnMessage(link, linkId, sourceNode, targetNode) {
    if (!link || !sourceNode || !targetNode) return;
    
    // Check message limits
    const messages = this.activeMessages.get(linkId) || [];
    if (messages.length >= this.config.maxMessagesPerLink) return;
    if (this.stats.messagesActive >= this.config.maxTotalMessages) return;
    
    // Build message
    const linkMetrics = getLinkCanonicalMetrics(link);
    const message = this.buildMessage(sourceNode, targetNode, {
      link,
      linkId,
      synergy: linkMetrics.synergy,
      corruption: linkMetrics.corruption
    });
    
    if (!message) return;
    
    messages.push(message);
    this.activeMessages.set(linkId, messages);
    this.stats.messagesSpawned++;
    this.stats.messagesActive++;
    
    // Notify RecursiveGlyphMessaging4_0 to potentially extend into chain
    if (this.recursiveGlyphMessaging?.enabled) {
      this.recursiveGlyphMessaging.onMessageSpawned(message, linkId, {
        link,
        linkId,
        sourceNode,
        targetNode
      });
    }
    
    // Notify AINarrativePatterns6_0 for narrative evolution
    if (this.narrativePatterns?.enabled) {
      this.narrativePatterns.onMessageSpawned(message, linkId, {
        link,
        linkId,
        sourceNode,
        targetNode
      });
    }
  }
  
  /**
   * Update all active messages
   */
  updateMessages(deltaTime) {
    const now = Date.now();
    
    this.activeMessages.forEach((messages, linkId) => {
      const toDelete = [];
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        const age = now - msg.createdAt;
        
        // Update progress along link
        const speed = this.calculateMessageSpeed(msg.linkData);
        const distance = msg.startPosition.distanceTo(msg.endPosition);
        const duration = (distance / speed) * 1000;
        
        msg.progress = Math.min(1, age / duration);
        
        // Update visual position
        this.updateMessageVisuals(msg, deltaTime);
        
        // Check if message reached destination
        if (msg.progress >= 1) {
          this.handleMessageArrival(msg);
          this.despawnMessage(msg);
          toDelete.push(i);
        }
        
        // Check if message expired
        if (age > msg.totalLifetime) {
          this.despawnMessage(msg);
          toDelete.push(i);
        }
      }
      
      // Remove completed messages
      for (let i = toDelete.length - 1; i >= 0; i--) {
        messages.splice(toDelete[i], 1);
      }
      
      if (messages.length === 0) {
        this.activeMessages.delete(linkId);
      } else {
        this.stats.messagesActive = Math.max(0, this.stats.messagesActive - toDelete.length);
      }
    });
  }
  
  /**
   * Calculate message travel speed
   */
  calculateMessageSpeed(linkData) {
    let speed = this.config.messageSpeed;
    
    // Boost from synergy
    speed += linkData.synergy * this.config.messageSpeeedBoostFromSynergy;
    
    // Reduction from stability
    const stabilityFactor = 1 - (linkData.sourceMetrics?.stability ?? 0) * this.config.messageSpeeedReductionFromStability;
    speed *= Math.max(0.5, stabilityFactor);
    
    // Acceleration from harmony
    speed *= (1 + (linkData.sourceMetrics?.harmony ?? 0) * 0.2);
    
    return Math.max(0.5, speed);
  }
  
  /**
   * Update message visual representation
   */
  updateMessageVisuals(message, deltaTime) {
    if (!message.meshGroup) return;
    
    // Interpolate position along link
    const startPos = message.startPosition;
    const endPos = message.endPosition;
    const currentPos = startPos.clone().lerp(endPos, message.progress);
    const enterPhase = this._clamp01(message.progress / 0.18);
    const settlePhase = this._clamp01((message.progress - 0.18) / 0.52);
    const dissolvePhase = this._clamp01((message.progress - 0.76) / 0.24);
    const clusterDrift = (1 - settlePhase) * 0.04;
    const flightPattern = message.flightPattern || this._selectMessageFlightPattern(message);
    
    message.meshGroup.position.copy(currentPos);
    const flightT = Math.min(1, Math.max(0, message.progress));
    const flightOffset = this._applyFlightPatternToPosition(
      new THREE.Vector3(),
      message,
      flightPattern,
      flightT,
      settlePhase
    );
    message.meshGroup.position.add(flightOffset.multiplyScalar(clusterDrift));
    message.meshGroup.rotation.z = Math.sin(this.globalTime * 1.2 + message.seed) * 0.03 + settlePhase * 0.06 + (flightPattern.mode === 'zigzag' ? 0.05 : 0);
    message.meshGroup.scale.setScalar(
      0.92 + enterPhase * 0.08 + settlePhase * 0.08 - dissolvePhase * 0.12
    );
    
    // Add jitter from stability
    const jitter = (message.sourceMetrics?.stability ?? 0) * this.config.jitterFromStability;
    message.meshGroup.position.x += (Math.sin(this.globalTime * 2.2 + message.seed) * 0.5) * jitter * (1 - settlePhase) * 0.3;
    message.meshGroup.position.y += (Math.cos(this.globalTime * 1.7 + message.seed) * 0.5) * jitter * (1 - settlePhase) * 0.3;
    message.meshGroup.position.z += (Math.sin(this.globalTime * 1.4 + message.seed * 0.7) * 0.5) * jitter * (1 - settlePhase) * 0.22;
    
    // Add distortion from corruption
    const distortion = (message.linkData.corruption ?? 0) * this.config.distortionFromCorruption;
    message.meshGroup.rotation.x = Math.sin(this.globalTime * 0.8 + message.seed) * distortion * 0.18;
    message.meshGroup.rotation.y = Math.cos(this.globalTime * 0.7 + message.seed) * distortion * 0.18;
    
    // Global rotation animation
    message.meshGroup.rotation.z += this.config.glyphRotationSpeed * deltaTime * (0.15 + enterPhase * 0.08);

    // Aura layers: keep them subtle so the cluster still feels hand-formed.
    message.auraMeshes.forEach((mesh, index) => {
      if (!mesh?.material) return;
      mesh.rotation.z += deltaTime * (0.08 + index * 0.03);
      mesh.rotation.x = Math.sin(this.globalTime * 0.62 + index + message.seed) * 0.03;
      const auraPulse = 0.94 + Math.sin(this.globalTime * 1.8 + index + message.seed) * 0.04;
      mesh.scale.setScalar(1 + enterPhase * 0.04 + settlePhase * 0.08 - dissolvePhase * 0.08 + (index === 0 ? 0.02 : 0));
      mesh.material.opacity = (mesh.userData.baseOpacity || mesh.material.opacity) * auraPulse * (0.24 + settlePhase * 0.18) * (1 - dissolvePhase * 0.55);
    });

    // Word groups stay clustered, but each role occupies a different emotional pocket.
    message.wordGroups.forEach((wordGroup, wordIndex) => {
      const basePosition = wordGroup.userData.basePosition || new THREE.Vector3();
      const driftPhase = this.globalTime * 1.15 + message.seed + wordIndex * 0.74;
      const settleBias = wordIndex === 0 ? 0.0 : wordIndex === 1 ? 0.015 : wordIndex === 2 ? -0.008 : 0.01;
      const rolePattern = flightPattern.mode;
      const rolePulse = rolePattern === 'spiral' ? 1 : rolePattern === 'arc' ? 0.85 : rolePattern === 'zigzag' ? 1.25 : rolePattern === 'flare' ? 0.95 : 0.8;
      const motionVariant = wordGroup.userData.motionVariant || this._selectClusterMotionVariant(message, wordIndex);
      const variantPulse = motionVariant === 'coil' ? 1.15 : motionVariant === 'sweep' ? 0.9 : motionVariant === 'fracture' ? 1.45 : motionVariant === 'crown' ? 1.05 : 0.98;
      wordGroup.position.copy(basePosition);
      const variantOffset = this._applyClusterMotionVariant(
        new THREE.Vector3(),
        message,
        motionVariant,
        wordIndex,
        message.progress,
        settlePhase,
        rolePulse * variantPulse
      );
      wordGroup.position.add(variantOffset);
      const microDrift = motionVariant === 'coil' ? 0.006 : motionVariant === 'sweep' ? 0.011 : motionVariant === 'fracture' ? 0.024 : motionVariant === 'crown' ? 0.009 : 0.012;
      const latticeLock = motionVariant === 'lattice' ? 0.45 : 1;
      wordGroup.position.x += Math.sin(driftPhase) * microDrift * (1 - settlePhase) * rolePulse * latticeLock;
      wordGroup.position.y += Math.cos(driftPhase * 0.9) * (microDrift * 0.9) * (1 - settlePhase) * rolePulse * latticeLock + settleBias;
      wordGroup.position.z += Math.sin(driftPhase * 0.7) * (microDrift * 0.65) * (1 - settlePhase) * rolePulse * latticeLock;
      wordGroup.rotation.y = Math.sin(driftPhase) * 0.035 * (1 - settlePhase);
      wordGroup.rotation.z += (wordIndex === 2 ? 0.08 : 0.02) * (1 - settlePhase) + (flightPattern.mode === 'arc' && wordIndex === 0 ? 0.03 : 0) + (motionVariant === 'fracture' ? 0.14 : motionVariant === 'sweep' ? 0.01 : motionVariant === 'crown' ? 0.028 : 0.022);
      wordGroup.scale.setScalar(1.04 + enterPhase * 0.04 + settlePhase * 0.08 - dissolvePhase * 0.1 + (motionVariant === 'coil' ? 0.018 : motionVariant === 'fracture' ? 0.05 : motionVariant === 'crown' ? 0.032 : motionVariant === 'lattice' ? 0.02 : 0.012));
      if (motionVariant === 'fracture') {
        const fracturePhase = this.globalTime * 2.1 + message.seed + wordIndex * 1.33;
        const shardSplit = Math.sign(Math.sin(fracturePhase * 2.7));
        wordGroup.position.x += shardSplit * 0.022 * (1 - settlePhase) * rolePulse;
        wordGroup.position.y += Math.sin(fracturePhase * 2.2) * 0.02 * (1 - settlePhase) * rolePulse;
        wordGroup.position.z += Math.cos(fracturePhase * 2.9) * 0.018 * (1 - settlePhase) * rolePulse;
        wordGroup.rotation.x = Math.sin(fracturePhase * 2.4) * 0.09 * (1 - settlePhase);
        wordGroup.rotation.y = Math.cos(fracturePhase * 2.6) * 0.08 * (1 - settlePhase);
        wordGroup.rotation.z += Math.sin(fracturePhase * 3.1) * 0.06 * (1 - settlePhase);
      }
      if (motionVariant === 'lattice') {
        const latticeStep = Math.round((this.globalTime * 1.4 + message.seed + wordIndex * 0.7) % 4);
        const facetTilt = latticeStep === 0 ? -0.06 : latticeStep === 1 ? 0.03 : latticeStep === 2 ? 0.08 : -0.015;
        wordGroup.rotation.x = facetTilt * (1 - settlePhase);
        wordGroup.rotation.y = facetTilt * 0.65 * (1 - settlePhase);
        wordGroup.scale.setScalar(1.03 + enterPhase * 0.03 + settlePhase * 0.06 - dissolvePhase * 0.06);
      }
    });
    
    // Breathing animation on individual glyphs
    message.meshes.forEach((mesh, index) => {
      const glyph = mesh.userData.glyphData || {};
      const wordGroup = message.wordGroups[mesh.userData.wordIndex];
      const meshVariant = wordGroup?.userData.motionVariant || 'coil';
      const phase = (this.globalTime + index * 0.2 + message.seed) * this.config.glyphBreathingSpeed;
      const breathScale = 1.0 + Math.sin(phase) * this.config.glyphBreathingAmplitude;
      mesh.scale.setScalar(glyph.scale * 0.6 * breathScale * (0.96 + settlePhase * 0.08));
      mesh.rotation.x = (glyph.rotation?.x || 0) + Math.sin(phase * 0.7) * 0.035 * (1 - settlePhase);
      mesh.rotation.y = (glyph.rotation?.y || 0) + Math.cos(phase * 0.6) * 0.035 * (1 - settlePhase);
      mesh.rotation.z = (glyph.rotation?.z || 0) + settlePhase * 0.1 + (message.linkData.corruption ?? 0) * 0.14;
      if (meshVariant === 'lattice') {
        const latticePhase = phase * 1.2 + mesh.userData.wordIndex * 0.65;
        const latticeSnap = 0.006 + Math.sin(latticePhase * 1.5) * 0.0012;
        const latticeFacet = Math.round(Math.sin(latticePhase * 2.0) * 2.0) * 0.0018;
        mesh.position.set(
          (glyph.offset?.x || 0) + Math.round(Math.sin(latticePhase) * 2.0) * latticeSnap + latticeFacet,
          (glyph.offset?.y || 0) + Math.round(Math.cos(latticePhase * 0.9) * 2.0) * latticeSnap * 0.95 + Math.max(0, latticeFacet) * 0.8,
          (glyph.offset?.z || 0) + Math.round(Math.sin(latticePhase * 1.2) * 2.0) * latticeSnap * 0.55 - latticeFacet * 0.35
        );
        mesh.scale.setScalar(glyph.scale * 0.52 * breathScale * (0.94 + settlePhase * 0.05));
        mesh.rotation.z = (glyph.rotation?.z || 0) + Math.round(Math.sin(latticePhase * 2.4) * 2.0) * 0.03 + settlePhase * 0.08;
      } else if (meshVariant === 'fracture') {
        const fracturePhase = phase * 2.5 + mesh.userData.wordIndex * 0.9;
        const shardJitter = 0.01 + Math.abs(Math.sin(fracturePhase * 2.1)) * 0.012;
        mesh.position.set(
          (glyph.offset?.x || 0) + Math.sign(Math.sin(fracturePhase * 2.3 + message.seed)) * shardJitter,
          (glyph.offset?.y || 0) + Math.sign(Math.cos(fracturePhase * 2.0 + message.seed)) * shardJitter * 0.85,
          (glyph.offset?.z || 0) + Math.sign(Math.sin(fracturePhase * 1.7 + message.seed)) * shardJitter * 0.7
        );
        mesh.scale.setScalar(glyph.scale * 0.5 * breathScale * (0.93 + settlePhase * 0.04));
        mesh.rotation.x = (glyph.rotation?.x || 0) + Math.sin(fracturePhase * 2.0) * 0.09 * (1 - settlePhase);
        mesh.rotation.y = (glyph.rotation?.y || 0) + Math.cos(fracturePhase * 2.2) * 0.08 * (1 - settlePhase);
        mesh.rotation.z = (glyph.rotation?.z || 0) + Math.sin(fracturePhase * 2.8) * 0.07 * (1 - settlePhase) + (message.linkData.corruption ?? 0) * 0.18;
      }
      mesh.material.opacity = (glyph.opacity ?? 0.9) * (0.84 + settlePhase * 0.1) * (1 - dissolvePhase * 0.82);
    });
    
    // Fade out as message completes
    const fadeStart = 0.8;
    if (message.progress > fadeStart) {
      const fadeAlpha = 1.0 - ((message.progress - fadeStart) / (1.0 - fadeStart));
      message.meshes.forEach(mesh => {
        mesh.material.opacity = fadeAlpha * 0.9;
      });
      message.auraMeshes.forEach(mesh => {
        if (mesh?.material) {
          mesh.material.opacity = (mesh.userData.baseOpacity || mesh.material.opacity) * fadeAlpha;
        }
      });
    }
  }
  
  /**
   * Handle message arrival at target node
   */
  handleMessageArrival(message) {
    if (!this.semanticGlyphAI || !message.targetNode) return;
    
    this.stats.messagesCompleted++;
    
    // Feed back to Semantic AI (visual-only interpretation)
    this.interpretMessageAtNode(message.targetNode, message);
    
    // Generate response message (probabilistic)
    if (Math.random() < this.config.responseProbability) {
      // Find link back to source
      const reverseLink = this.findReverseLink(message.linkData.link);
      if (reverseLink) {
        const linkId = reverseLink.uuid || reverseLink.id || 'unknown';
        this.generationTimers.set(linkId, 0); // Trigger immediate message
        this.stats.responsesGenerated++;
      }
    }
  }
  
  /**
   * Find the reverse link (if it exists)
   */
  findReverseLink(link) {
    if (!link) return null;
    
    const sourceNode = link.sourceNode || link.source || link.nodeA || null;
    const targetNode = link.targetNode || link.target || link.nodeB || null;
    if (!sourceNode || !targetNode) return null;
    
    // Search for link with reversed endpoints
    for (const trackedLink of this.trackedLinks.values()) {
      if (trackedLink.sourceNode === targetNode && trackedLink.targetNode === sourceNode) {
        return trackedLink.link;
      }
    }
    
    return null;
  }
  
  /**
   * Interpret message at target node (visual-only)
   */
  interpretMessageAtNode(node, message) {
    if (!node || !node.userData) return;
    
    // Cache interpretation for glyph animation systems to read
    const interpretation = {
      timestamp: Date.now(),
      messageType: message.words[1]?.role || 'NEUTRAL',
      sourceSemanticState: message.words[1]?.semanticVector || {},
      linkQuality: {
        synergy: message.linkData.synergy ?? 0.5,
        corruption: message.linkData.corruption ?? 0
      }
    };
    
    this.interpretationCache.set(node.uuid || node.id || 'unknown', interpretation);
    
    // Visual feedback: nodes could highlight or pulse on message receipt
    // (This would be read by adaptive rendering system)
  }
  
  /**
   * Despawn a message (cleanup)
   */
  despawnMessage(message) {
    if (message.meshGroup) {
      this.messageContainer.remove(message.meshGroup);
      
      message.meshes.forEach(mesh => {
        this._returnMeshToPool(mesh);
      });
      
      message.auraMeshes.forEach(mesh => {
        this._returnAuraToPool(mesh);
      });

      message.meshGroup.clear?.();
    }

    message.meshes.length = 0;
    message.wordGroups?.length && (message.wordGroups.length = 0);
    message.auraMeshes?.length && (message.auraMeshes.length = 0);
    message.meshGroup = null;
  }
  
  /**
   * Main update loop
   */
  update(deltaTime, aiNodes, linkingSystem) {
    if (!this.enabled || !aiNodes || !linkingSystem) return;
    if (this.frameScheduler?.shouldRunVisual?.() === false) return;

    // Throttle to ~30 Hz on the visual layer
    this._updateAccum += deltaTime;
    if (this._updateAccum < this.updateInterval) return;
    // Use accumulated time but clamp to avoid giant steps
    deltaTime = Math.min(this._updateAccum, this.updateInterval * 2);
    this._updateAccum = 0;
    
    const startTime = performance.now();
    
    this.globalTime += deltaTime;
    this.stats.totalFrames++;
    
    // Register/track all links
    if (linkingSystem.links && Array.isArray(linkingSystem.links)) {
      linkingSystem.links.forEach((link, index) => {
        const linkId = link.uuid || link.id || `link-${index}`;
        
        if (!this.trackedLinks.has(linkId)) {
          const sourceNode = link.sourceNode || link.source || link.nodeA || null;
          const targetNode = link.targetNode || link.target || link.nodeB || null;
          this.registerLink(link, linkId, sourceNode, targetNode);
        }
      });
    }
    
    // Generate new messages based on timing
    this.generateNewMessages(linkingSystem, deltaTime);
    
    // Update all active messages
    this.updateMessages(deltaTime);
    
    // Performance tracking
    this.stats.lastFrameTime = performance.now() - startTime;
    this.stats.linksActive = this.trackedLinks.size;
  }
  
  /**
   * Generate new messages on active links
   */
  generateNewMessages(linkingSystem, deltaTime) {
    const interval = 1 / this.config.messageGenerationHz;
    
    this.generationTimers.forEach((timer, linkId) => {
      const nextTimer = timer + deltaTime;
      
      const trackData = this.trackedLinks.get(linkId);
      if (!trackData) return;
      
      const messages = this.activeMessages.get(linkId) || [];
      
      // Generate message if timer reached
      if (nextTimer >= interval) {
        if (messages.length < this.config.maxMessagesPerLink) {
          this.spawnMessage(
            trackData.link,
            linkId,
            trackData.sourceNode,
            trackData.targetNode
          );
          this.generationTimers.set(linkId, nextTimer - interval);
        } else {
          this.generationTimers.set(linkId, interval);
        }
      } else {
        this.generationTimers.set(linkId, nextTimer);
      }
    });
  }
  
  /**
   * Cleanup on world transition
   */
  cleanup() {
    for (const linkId of [...this.trackedLinks.keys()]) {
      this.unregisterLink(linkId);
    }

    this.activeMessages.clear();
    this.trackedLinks.clear();
    this.generationTimers.clear();
    this.interpretationCache.clear();
    this.stats.messagesActive = 0;
    this.stats.linksActive = 0;
    this._updateAccum = 0;
    this.messageContainer.clear?.();
    console.log('✓ Linked Glyph Messaging 3.0 cleaned up');
  }
  
  /**
   * Clear pool statistics for debugging
   */
  getPoolStats() {
    const meshPoolUsed = this.meshPool.filter(p => p.inUse).length;
    const meshPoolTotal = this.meshPool.length;
    const auraPoolUsed = this.auraPool.filter(p => p.inUse).length;
    const auraPoolTotal = this.auraPool.length;
    
    return {
      meshPool: { used: meshPoolUsed, total: meshPoolTotal, available: meshPoolTotal - meshPoolUsed },
      auraPool: { used: auraPoolUsed, total: auraPoolTotal, available: auraPoolTotal - auraPoolUsed }
    };
  }
  
  /**
   * Enable/disable messaging
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }
  
  /**
   * Toggle messaging
   */
  toggle() {
    this.setEnabled(!this.enabled);
  }
  
  /**
   * Get current statistics
   */
  getStatistics() {
    return {
      enabled: this.enabled,
      messagesActive: this.stats.messagesActive,
      messagesSpawned: this.stats.messagesSpawned,
      messagesCompleted: this.stats.messagesCompleted,
      responsesGenerated: this.stats.responsesGenerated,
      linksActive: this.stats.linksActive,
      lastFrameMs: this.stats.lastFrameTime.toFixed(2),
      totalFrames: this.stats.totalFrames
    };
  }
  
  /**
   * Print detailed status report
   */
  printStatusReport() {
    const stats = this.getStatistics();
    console.group('=== LINKED GLYPH MESSAGING 3.0 STATUS ===');
    console.log(`Status: ${stats.enabled ? 'ACTIVE' : 'DISABLED'}`);
    console.log(`Messages Active: ${stats.messagesActive}`);
    console.log(`Messages Spawned: ${stats.messagesSpawned}`);
    console.log(`Messages Completed: ${stats.messagesCompleted}`);
    console.log(`Responses Generated: ${stats.responsesGenerated}`);
    console.log(`Active Links: ${stats.linksActive}`);
    console.log(`Frame Time: ${stats.lastFrameMs} ms`);
    console.log(`Total Frames: ${stats.totalFrames}`);
    console.log('');
    console.log('INTEGRATION:');
    console.log(`  Linked to RecursiveMessaging4.0: ${this.recursiveGlyphMessaging ? 'YES' : 'NO'}`);
    console.groupEnd();
  }

  _resolveLinkEndpoints(link) {
    if (!link) {
      return { sourceNode: null, targetNode: null };
    }

    return {
      sourceNode: link.sourceNode || link.source || link.nodeA || null,
      targetNode: link.targetNode || link.target || link.nodeB || null
    };
  }

  /**
   * Clear all active messages (emergency cleanup)
   */
  clearAllMessages() {
    console.log('Clearing all active glyph messages...');
    this.activeMessages.forEach((messages) => {
      messages.forEach(msg => this.despawnMessage(msg));
    });
    this.activeMessages.clear();
    this.stats.messagesActive = 0;
    console.log('All messages cleared');
  }

  dispose() {
    this.cleanup();
    this.trackedLinks.clear();
    this.generationTimers.clear();

    this.messageContainer?.traverse(obj => {
      if (obj.isMesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat?.dispose?.());
        } else {
          obj.material?.dispose?.();
        }
      }
    });

    this.geometryPool.forEach(geo => geo?.dispose?.());
    this.geometryPool.clear();
    this.materialPool.forEach(mat => mat?.dispose?.());
    this.materialPool.clear();
    this.meshPool.length = 0;
    this.auraPool.length = 0;

    if (this.root?.parent) {
      this.root.parent.remove(this.root);
    }
    this.root?.clear?.();
  }
}
