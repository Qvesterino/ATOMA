/**
 * MEGA GLYPH SYSTEM 1.0 — UNIFIED GLYPH ARCHITECTURE
 * 
 * Zjednotený glyph renderer system pre ATOMA.
 * 
 * Štruktúra:
 * - CoreGlyphRenderer: správa node-bound glyphs (z AtomaGlyphSystem4_0)
 * - MessagingLayer: transport glyph messages po linkoch (Linked/Recursive Messaging)
 * - SignalLayer: transient event-driven signals (RecursiveGlyphSignalSystem)
 * - SemanticInterpreter: semantic state → visual translation (SemanticGlyphAI)
 * 
 * STRICT SAFETY RULES:
 * - DO NOT modify: createNode(), updateNode(), AINodes.js, physics, collisions,
 *   movement, world transitions, or shader pipelines.
 * - All glyphs are non-destructive visual children only.
 * - Glyphs fail-safe: if something is missing, simply skip.
 * - All animations: rotation, scale, opacity, colorLerp only.
 * - No post-processing, no volumetrics, no new materials.
 * - < 1ms per frame total overhead.
 */

import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

export class MegaGlyphSystem {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    // ============================================================
    // CORE GLYPH RENDERER (AtomaGlyphSystem4_0 foundation)
    // ============================================================

    // Master glyph container
    this.glyphContainer = new THREE.Group();
    this.glyphContainer.userData.isMegaGlyphContainer = true;
    this.glyphContainer.name = 'MegaGlyphSystem';
    this.root = this.glyphContainer;
    this.scene.add(this.glyphContainer);

    // Registry: nodeId → { node, glyphGroup, glyphType, metadata, context }
    this.glyphRegistry = new Map();

    // Context cache: nodeId → { synergy, stability, harmony, corruption, load, personality }
    this.contextCache = new Map();

    // Animation state: nodeId → { phase, rotationAngles[], colorPhase, etc }
    this.animationState = new Map();

    // Synergy state tracking per node
    this.synergyGlyphStates = new Map(); // nodeId → { linkedSynergy, revealLevel, revealed }

    // Synergy-based glyph visibility thresholds
    this.synergyThresholds = {
      linkedSynergy: 0.70,
      reveal1: 0.75,
      reveal2: 0.85,
      colorShift: 0.80
    };

    // Corruption-based opacity reduction
    this.corruptionDimmingConfig = {
      activeThreshold: 0.65,
      maxDimmingThreshold: 0.85,
      minOpacityFactor: 0.25
    };

    // Visual hierarchy: Global scale & opacity normalization
    this.glyphScaleFactors = {
      default: 0.40,
      storage: 0.32,
      breathing: 0.15,
    };

    this.glyphOpacityLimits = {
      min: 0.45,
      max: 0.60,
      breathing: 0.08,
    };

    this.glyphYOffsets = {
      default: 0.65,
      storage: 0.55,
    };

    // Statistics
    this.stats = {
      totalGlyphsCreated: 0,
      activeGlyphs: 0,
      byType: {},
      lastUpdateTime: 0
    };

    // ATOMA color palette
    this.colors = {
      cyan: new THREE.Color(0x00F2FF),
      mint: new THREE.Color(0x84FFE6),
      magenta: new THREE.Color(0xFF00FF),
      violet: new THREE.Color(0x9933FF),
      gold: new THREE.Color(0xFFD700),
      white: new THREE.Color(0xFFFFFF),
      blue: new THREE.Color(0x0099FF),
      green: new THREE.Color(0x00FF88),
      red: new THREE.Color(0xFF3333),
      orange: new THREE.Color(0xFF8844),
      dark: new THREE.Color(0x0a0a14)
    };

    // Global time for synchronized animations
    this.globalTime = 0;
    this._timeOrigin = undefined;
    this._lastVisualTime = undefined;

    // ============================================================
    // MESSAGING LAYER (Linked + Recursive Messaging)
    // ============================================================

    // Master messaging container
    this.messageContainer = new THREE.Group();
    this.messageContainer.userData.isMessaging = true;
    this.messageContainer.name = 'MegaGlyphSystem_Messages';
    this.glyphContainer.add(this.messageContainer);

    // Active messages on links (linkId → messageArray)
    this.activeMessages = new Map();

    // Message pools for reuse
    this.messagePools = {
      words: [],
      phrases: [],
      sentences: [],
      glyphMeshes: []
    };

    // Link tracking
    this.trackedLinks = new Map();  // linkId → { sourceNode, targetNode, lastMessageTime }

    // Messaging configuration
    this.messagingConfig = {
      // Message structure
      minGlyphsPerWord: 1,
      maxGlyphsPerWord: 5,
      wordsPerPhrase: 2,
      phrasesPerSentence: 2,

      // Transportation
      messageSpeed: 2.0,
      synergySpeedBoost: 0.5,
      stabilitySpeedReduction: 0.3,
      jitterFromStability: 0.08,
      distortionFromCorruption: 0.12,

      // Animation
      glyphRotationSpeed: 3.0,
      glyphBreathingAmplitude: 0.08,
      glyphBreathingSpeed: 2.0,

      // Generation
      messageGenerationHz: 1.5,
      messageLifetimeSec: 8.0,
      responseProbability: 0.6,

      // Performance
      maxMessagesPerLink: 3,
      maxTotalMessages: 100
    };

    // Message generation timers
    this.generationTimers = new Map();  // linkId → timeAccumulator

    // Messaging statistics
    this.messagingStats = {
      messagesActive: 0,
      messagesSpawned: 0,
      messagesCompleted: 0,
      responsesGenerated: 0,
      linksActive: 0,
      lastFrameTime: 0,
      totalFrames: 0
    };

    // Semantic AI interpretation cache
    this.interpretationCache = new Map();  // nodeId → lastInterpretedState

    // ============================================================
    // SIGNAL LAYER (RecursiveGlyphSignalSystem)
    // ============================================================

    // Master signal container
    this.signalContainer = new THREE.Group();
    this.signalContainer.name = 'MegaGlyphSystem_Signals';
    this.signalContainer.userData.isRecursiveGlyphSignalSystem = true;
    this.glyphContainer.add(this.signalContainer);

    // Signal tracking
    this.activeSignals = new Map();  // contextKey → signal
    this.cooldowns = new Map();  // contextKey → absolute time in seconds

    // Signal configuration
    this.signalConfig = {
      globalCap: 9,
      signalCooldownSec: 1.0,
      hoverCooldownSec: 0.3,
      clutterCap: 7,
      hoverClutterBonus: 2,
      baseSize: 0.24,
      emergenceSec: 0.22,
      sustainSec: 0.55 * 1.5,
      decaySec: 0.42 * 1.5,
      shortSustainSec: 0.32 * 1.5,
      burstDecayMultiplier: 2.2,
      hoverLiftY: 0.82,
      selectLiftY: 1.02,
      residueLiftY: 0.65,
      driftStrength: 0.03,
      rotationSpeed: 0.9
    };

    // Signal statistics
    this.signalStats = {
      emitted: 0,
      suppressed: 0,
      active: 0,
      culledByClutter: 0
    };

    // Shared geometry for signals
    this.signalGeometry = {
      ring: new THREE.TorusGeometry(1.0, 0.06, 8, 28),
      core: new THREE.OctahedronGeometry(0.28, 0),
      tick: new THREE.PlaneGeometry(0.18, 0.05),
      micro: new THREE.SphereGeometry(0.06, 6, 6)
    };

    // Callbacks for signal triggers
    this.signalCallbacks = {
      isBurstActive: () => false,
      isFieldActive: () => false
    };

    // ============================================================
    // SEMANTIC INTERPRETER (SemanticGlyphAI)
    // ============================================================

    // Semantic state tracking per node
    this.semanticState = new Map();  // nodeId → { state, parameters, timers }

    // Event history (temporal, fades over time)
    this.eventHistory = new Map();  // nodeId → { justLinked, justRitual, justAscended, clusterSync }

    // Visual effect helper meshes (pooled)
    this.helperMeshes = {
      crownRings: [],
      scanLines: [],
      flickerDots: [],
      linkLines: [],
      splitDividers: []
    };

    // Helper container (keeps scene clean)
    this.helperContainer = new THREE.Group();
    this.helperContainer.userData.isSemanticHelper = true;
    this.helperContainer.name = 'MegaGlyphSystem_Helpers';
    this.glyphContainer.add(this.helperContainer);

    // Semantic configuration
    this.semanticConfig = {
      focusedAnimSpeedMultiplier: 1.8,
      overloadedWobbleAmplitude: 0.015,
      overloadedPulseSpeed: 2.0,
      idleRotationReduction: 0.2,
      exploringOrbSpeed: 1.5,
      exploringFadeTime: 3000,
      leaderHaloCount: 8,
      crownThickness: 0.02,
      dualitySplitSpeed: 0.5,
      clusterSyncDuration: 2000,
      eventFadeDuration: 2000
    };

    // Semantic statistics
    this.semanticStats = {
      nodesProcessed: 0,
      statesApplied: 0,
      helperMeshesActive: 0,
      frameTime: 0
    };

    // Performance optimization: interpretation gating
    this.interpretationInterval = 0.25;  // ~4 Hz for semantic decisions
    this.interpretationAccumulator = 0;

    // Reusable color objects
    this._colorCache = {
      stressedStart: new THREE.Color(0xFF8800),
      stressedEnd: new THREE.Color(0xFF3333),
      clusterSync: new THREE.Color(0x84FFE6),
      temp: new THREE.Color()
    };

    // Enable/disable flags
    this.enabled = true;
    this.coreEnabled = true;
    this.messagingEnabled = true;
    this.signalEnabled = true;
    this.semanticEnabled = true;

    // Initialize systems
    this.initializeHelperMeshPools();
    this.initializeMessagePools();

    console.log('✓ Mega Glyph System 1.0 initialized');
    console.log('  - Core: Node-bound glyphs');
    console.log('  - Messaging: Link-based glyph transport');
    console.log('  - Signals: Event-driven transient glyphs');
    console.log('  - Semantic: State interpretation');
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  /**
   * Initialize pooled helper meshes for semantic effects
   */
  initializeHelperMeshPools() {
    // Crown rings (thin toroid circles for leader effect)
    for (let i = 0; i < 12; i++) {
      const ringGeom = new THREE.TorusGeometry(0.08, 0.005, 8, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xFFD700,
        transparent: true,
        opacity: 0.6,
        fog: false
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.userData.isSemanticHelper = true;
      ring.visible = false;
      this.helperMeshes.crownRings.push(ring);
      this.helperContainer.add(ring);
    }

    // Scan lines (vertical swooping lines for focused effect)
    const SCANLINE_ORDER = 25;
    for (let i = 0; i < 6; i++) {
      const lineGeom = new THREE.PlaneGeometry(0.02, 0.3);
      const lineMat = new THREE.MeshBasicMaterial({
        color: 0x00F2FF,
        transparent: true,
        opacity: 0.4,
        fog: false
      });
      const line = new THREE.Mesh(lineGeom, lineMat);
      line.userData.isSemanticHelper = true;
      line.renderOrder = SCANLINE_ORDER;
      line.visible = false;
      this.helperMeshes.scanLines.push(line);
      this.helperContainer.add(line);
    }

    // Flicker dots (tiny orbiting particles for exploring effect)
    for (let i = 0; i < 16; i++) {
      const dotGeom = new THREE.SphereGeometry(0.01, 6, 6);
      const dotMat = new THREE.MeshBasicMaterial({
        color: 0x00FFAA,
        transparent: true,
        opacity: 0.8,
        fog: false
      });
      const dot = new THREE.Mesh(dotGeom, dotMat);
      dot.userData.isSemanticHelper = true;
      dot.visible = false;
      this.helperMeshes.flickerDots.push(dot);
      this.helperContainer.add(dot);
    }

    // Link lines (thin connectors to link directions)
    for (let i = 0; i < 8; i++) {
      const lineGeom = new THREE.BufferGeometry();
      const positions = new Float32Array([
        0, 0, 0,
        0.15, 0, 0
      ]);
      lineGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x00FFAA,
        transparent: true,
        opacity: 0.6,
        fog: false,
        linewidth: 1
      });
      const line = new THREE.Line(lineGeom, lineMat);
      line.userData.isSemanticHelper = true;
      line.visible = false;
      this.helperMeshes.linkLines.push(line);
      this.helperContainer.add(line);
    }

    // Split dividers (center line for duality effect)
    for (let i = 0; i < 4; i++) {
      const lineGeom = new THREE.BufferGeometry();
      const positions = new Float32Array([
        0, -0.3, 0,
        0, 0.3, 0
      ]);
      lineGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xFF00FF,
        transparent: true,
        opacity: 0.7,
        fog: false,
        linewidth: 2
      });
      const line = new THREE.Line(lineGeom, lineMat);
      line.userData.isSemanticHelper = true;
      line.visible = false;
      this.helperMeshes.splitDividers.push(line);
      this.helperContainer.add(line);
    }
  }

  /**
   * Initialize pooled glyph meshes for messages
   */
  initializeMessagePools() {
    // Create pooled glyph meshes for reuse
    for (let i = 0; i < 300; i++) {
      const meshData = this.createMiniGlyph();
      this.messagePools.glyphMeshes.push({
        mesh: meshData,
        inUse: false
      });
    }
  }

  /**
   * Create a minimal glyph mesh (triangle, shard, diamond, etc)
   */
  createMiniGlyph(type = 'shard') {
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

    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
      transparent: true,
      opacity: 0.9,
      fog: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.isMessageGlyph = true;
    return mesh;
  }

  // ============================================================
  // MAIN UPDATE LOOP
  // ============================================================

  update(deltaTime, nodes, linkingSystem = null) {
    if (!this.enabled) return;

    const startTime = performance.now();

    // Synchronize visual time
    if (this._timeOrigin === undefined) {
      this._timeOrigin = VisualTime.now;
    }
    const currentTime = VisualTime.now - this._timeOrigin;
    const visualDelta = this._lastVisualTime === undefined
      ? 0
      : Math.max(0, currentTime - this._lastVisualTime);
    this._lastVisualTime = currentTime;
    this.globalTime = currentTime;

    // Update all layers
    if (this.coreEnabled) {
      this.updateCore(visualDelta, nodes);
    }

    if (this.messagingEnabled && linkingSystem) {
      this.updateMessaging(visualDelta, linkingSystem);
    }

    if (this.signalEnabled) {
      this.updateSignals(visualDelta);
    }

    if (this.semanticEnabled && nodes) {
      this.updateSemantic(visualDelta, nodes);
    }

    this.stats.lastUpdateTime = performance.now() - startTime;
  }

  // ============================================================
  // CORE GLYPH RENDERER (AtomaGlyphSystem4_0)
  // ============================================================

  updateCore(visualDelta, nodes) {
    if (!nodes || nodes.length === 0) return;

    // Update all active glyphs
    for (const [nodeId, glyphData] of this.glyphRegistry) {
      const { node, glyphGroup, glyphType } = glyphData;

      if (!node || !glyphGroup || !glyphGroup.parent) {
        this.disposeGlyph(nodeId);
        continue;
      }

      const context = this.analyzeContext(node, nodeId);
      const animState = this.animationState.get(nodeId);

      if (!context || !animState) continue;

      // Apply synergy reveal and corruption dimming
      this._applySynergyGlyphReveal(glyphGroup, nodeId, context);
      this._applyCorruptionGlyphDimming(glyphGroup, nodeId, context);

      // Update glyph animation
      this.updateGlyphAnimation(glyphGroup, glyphType, context, animState, visualDelta);
    }
  }

  analyzeContext(node, nodeId) {
    if (!node || !node.userData) {
      return null;
    }

    const context = {
      synergy: node.userData.synergy || 0,
      stability: node.userData?.metrics?.stability ?? 0,
      harmony: node.userData.harmony || 0,
      corruption: node.userData.corruption || 0,
      load: node.userData.load || 0,
      energy: node.userData.energy || 0.5,
      clarity: node.userData.clarity || 0.5,
      personality: node.userData.personality || { type: 'BALANCED', mood: 'CALM' },
      evolutionStage: node.userData.evolutionStage || 1,
      isMythic: node.userData.isMythic || false,
      isAscended: node.userData.category === 'ascended' || false,
      linked: node.userData.linked || false,
      distanceToCamera: this.calculateDistanceToCamera(node)
    };

    this.contextCache.set(nodeId, context);
    return context;
  }

  calculateDistanceToCamera(node) {
    if (!this.camera || !node) return Infinity;

    const nodePos = new THREE.Vector3();
    node.getWorldPosition(nodePos);
    return this.camera.position.distanceTo(nodePos);
  }

  updateGlyphAnimation(glyphGroup, glyphType, context, animState, visualDelta) {
    // Delegate to specific animation update methods
    const updateMethod = this[`update${glyphType.charAt(0).toUpperCase() + glyphType.slice(1)}Glyph`];

    if (typeof updateMethod === 'function') {
      updateMethod.call(this, glyphGroup, context, animState, visualDelta);
    }
  }

  // Placeholder for glyph animation methods - will be implemented in subsequent steps
  updateAiConsciousnessGlyph() { /* TODO */ }
  updateMythicSeedGlyph() { /* TODO */ }
  updateAscendedNodeGlyph() { /* TODO */ }
  updateEvolutionStage1Glyph() { /* TODO */ }
  updateEvolutionStage2Glyph() { /* TODO */ }
  updateEvolutionStage3Glyph() { /* TODO */ }
  updatePersonalityHarmonyGlyph() { /* TODO */ }
  updatePersonalityStabilityGlyph() { /* TODO */ }
  updatePersonalityCorruptionGlyph() { /* TODO */ }
  updatePersonalitySynergyGlyph() { /* TODO */ }
  updateEventMythicRitualGlyph() { /* TODO */ }
  updateEventClusterSurgeGlyph() { /* TODO */ }
  updateEventWorldEventGlyph() { /* TODO */ }

  // ============================================================
  // MESSAGING LAYER
  // ============================================================

  updateMessaging(visualDelta, linkingSystem) {
    // Register/track all links
    if (linkingSystem.links && Array.isArray(linkingSystem.links)) {
      linkingSystem.links.forEach((link, index) => {
        const linkId = link.uuid || link.id || `link-${index}`;

        if (!this.trackedLinks.has(linkId)) {
          const sourceNode = link.nodeA;
          const targetNode = link.nodeB;
          this.registerLink(link, linkId, sourceNode, targetNode);
        }
      });
    }

    // Generate new messages based on timing
    this.generateNewMessages(linkingSystem);

    // Update all active messages
    this.updateMessages(visualDelta);
  }

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
  }

  unregisterLink(linkId) {
    const messages = this.activeMessages.get(linkId);
    if (messages) {
      messages.forEach(msg => this.despawnMessage(msg));
      this.activeMessages.delete(linkId);
    }

    this.trackedLinks.delete(linkId);
    this.generationTimers.delete(linkId);
  }

  generateNewMessages(linkingSystem) {
    const now = Date.now();
    const interval = 1000 / this.messagingConfig.messageGenerationHz;

    this.generationTimers.forEach((timer, linkId) => {
      this.generationTimers.set(linkId, timer + (interval / 1000));

      const trackData = this.trackedLinks.get(linkId);
      if (!trackData) return;

      const messages = this.activeMessages.get(linkId) || [];

      if (this.generationTimers.get(linkId) >= interval / 1000) {
        if (messages.length < this.messagingConfig.maxMessagesPerLink) {
          this.spawnMessage(
            trackData.link,
            linkId,
            trackData.sourceNode,
            trackData.targetNode
          );
          this.generationTimers.set(linkId, 0);
        }
      }
    });
  }

  spawnMessage(link, linkId, sourceNode, targetNode) {
    if (!link || !sourceNode || !targetNode) return;

    const messages = this.activeMessages.get(linkId) || [];
    if (messages.length >= this.messagingConfig.maxMessagesPerLink) return;
    if (this.messagingStats.messagesActive >= this.messagingConfig.maxTotalMessages) return;

    const message = this.buildMessage(sourceNode, targetNode, {
      link,
      linkId,
      synergy: link.userData?.synergy?.score ?? link?.synergyScore ?? 0.5,
      corruption: link.corruption || 0,
      stability: link.stability || 0,
      harmony: link.harmony || 0
    });

    if (!message) return;

    messages.push(message);
    this.activeMessages.set(linkId, messages);
    this.messagingStats.messagesSpawned++;
    this.messagingStats.messagesActive++;
  }

  buildMessage(sourceNode, targetNode, linkData) {
    if (!sourceNode || !targetNode) return null;

    const message = {
      sourceNode,
      targetNode,
      linkData,
      words: [],
      createdAt: Date.now(),
      startPosition: sourceNode.position.clone(),
      endPosition: targetNode.position.clone(),
      progress: 0,
      meshes: [],
      totalLifetime: this.messagingConfig.messageLifetimeSec * 1000
    };

    // Generate words
    message.words.push(this.generateMessageWord(sourceNode, 'SUBJECT'));
    message.words.push(this.generateMessageWord(sourceNode, 'STATE'));
    message.words.push(this.generateMessageWord(linkData.link, 'LINK'));

    // Create visual representation
    this.createMessageMeshes(message);

    return message;
  }

  generateMessageWord(node, messageType = 'STATE') {
    if (!node || !node.userData) return null;

    const synergy = node.userData.synergy || 0.5;
    const corruption = node.userData.corruption || 0;
    const stability = node.userData?.metrics?.stability ?? 0;
    const harmony = node.userData.harmony || 0;
    const load = node.userData.load || 0;

    const complexity = Math.abs(synergy - corruption) * 5;
    const glyphCount = Math.max(1, Math.min(5, Math.ceil(1 + complexity)));

    const word = {
      type: messageType,
      glyphs: [],
      role: this.determineGlyphRole(node, messageType),
      semanticVector: { synergy, corruption, stability, harmony, load }
    };

    for (let i = 0; i < glyphCount; i++) {
      const glyph = {
        type: this.selectGlyphType(messageType, i, glyphCount),
        color: this.selectGlyphColor(synergy, corruption, harmony),
        scale: 0.8 + Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2,
        offset: new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3
        )
      };
      word.glyphs.push(glyph);
    }

    return word;
  }

  determineGlyphRole(node, messageType) {
    const synergy = node.userData.synergy || 0.5;
    const corruption = node.userData.corruption || 0;
    const stability = node.userData?.metrics?.stability ?? 0;
    const harmony = node.userData.harmony || 0;

    if (messageType === 'SUBJECT') {
      return 'SUBJECT';
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

  selectGlyphType(messageType, index, count) {
    const types = ['triangle', 'lotus', 'shard', 'diamond', 'ring', 'dot'];

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

  selectGlyphColor(synergy, corruption, harmony) {
    const color = new THREE.Color();

    if (synergy > 0.7) {
      color.setHSL(0.5, 0.8, 0.6);
    } else if (corruption > 0.6) {
      color.setHSL(0.05, 0.9, 0.55);
    } else if (harmony > 0.7) {
      color.setHSL(0.8, 0.8, 0.6);
    } else {
      color.setHSL(0.2 + Math.random() * 0.2, 0.6, 0.6);
    }

    return color;
  }

  createMessageMeshes(message) {
    const group = new THREE.Group();
    group.userData.isMessageGroup = true;

    let offsetY = 0;

    message.words.forEach((word, wordIndex) => {
      word.glyphs.forEach((glyph, glyphIndex) => {
        const mesh = this.createMiniGlyph(glyph.type);

        mesh.position.set(
          glyphIndex * 0.15 - (word.glyphs.length * 0.075),
          offsetY + glyph.offset.y,
          glyph.offset.z
        );

        mesh.material.color.copy(glyph.color);
        mesh.scale.setScalar(glyph.scale * 0.3);

        mesh.userData.glyphData = glyph;
        mesh.userData.wordIndex = wordIndex;
        mesh.userData.glyphIndex = glyphIndex;

        group.add(mesh);
        message.meshes.push(mesh);
      });

      offsetY += 0.12;
    });

    this.messageContainer.add(group);
    message.meshGroup = group;
  }

  updateMessages(visualDelta) {
    const now = Date.now();
    const toDelete = [];

    this.activeMessages.forEach((messages, linkId) => {
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        const age = now - msg.createdAt;

        const speed = this.calculateMessageSpeed(msg.linkData);
        const distance = msg.startPosition.distanceTo(msg.endPosition);
        const duration = (distance / speed) * 1000;

        msg.progress = Math.min(1, age / duration);

        this.updateMessageVisuals(msg, visualDelta);

        if (msg.progress >= 1) {
          this.handleMessageArrival(msg);
          this.despawnMessage(msg);
          toDelete.push(i);
        }

        if (age > msg.totalLifetime) {
          this.despawnMessage(msg);
          toDelete.push(i);
        }
      }

      for (let i = toDelete.length - 1; i >= 0; i--) {
        messages.splice(toDelete[i], 1);
      }

      if (messages.length === 0) {
        this.activeMessages.delete(linkId);
      } else {
        this.messagingStats.messagesActive = Math.max(0, this.messagingStats.messagesActive - toDelete.length);
      }
    });
  }

  calculateMessageSpeed(linkData) {
    let speed = this.messagingConfig.messageSpeed;

    speed += linkData.synergy * this.messagingConfig.synergySpeedBoost;

    const stabilityFactor = 1 - linkData.stability * this.messagingConfig.stabilitySpeedReduction;
    speed *= Math.max(0.5, stabilityFactor);

    speed *= (1 + linkData.harmony * 0.2);

    return Math.max(0.5, speed);
  }

  updateMessageVisuals(message, visualDelta) {
    if (!message.meshGroup) return;

    const startPos = message.startPosition;
    const endPos = message.endPosition;
    const currentPos = startPos.clone().lerp(endPos, message.progress);

    message.meshGroup.position.copy(currentPos);

    const jitter = message.linkData.stability * this.messagingConfig.jitterFromStability;
    message.meshGroup.position.x += (Math.random() - 0.5) * jitter;
    message.meshGroup.position.y += (Math.random() - 0.5) * jitter;
    message.meshGroup.position.z += (Math.random() - 0.5) * jitter;

    const distortion = message.linkData.corruption * this.messagingConfig.distortionFromCorruption;
    message.meshGroup.rotation.x += (Math.random() - 0.5) * distortion;
    message.meshGroup.rotation.y += (Math.random() - 0.5) * distortion;

    message.meshGroup.rotation.z += this.messagingConfig.glyphRotationSpeed * visualDelta;

    message.meshes.forEach((mesh, index) => {
      const phase = (this.globalTime + index * 0.2) * this.messagingConfig.glyphBreathingSpeed;
      const breathScale = 1.0 + Math.sin(phase) * this.messagingConfig.glyphBreathingAmplitude;
      mesh.scale.setScalar(mesh.userData.glyphData.scale * 0.3 * breathScale);
    });

    const fadeStart = 0.8;
    if (message.progress > fadeStart) {
      const fadeAlpha = 1.0 - ((message.progress - fadeStart) / (1.0 - fadeStart));
      message.meshes.forEach(mesh => {
        mesh.material.opacity = fadeAlpha * 0.9;
      });
    }
  }

  handleMessageArrival(message) {
    this.messagingStats.messagesCompleted++;

    this.interpretMessageAtNode(message.targetNode, message);

    if (Math.random() < this.messagingConfig.responseProbability) {
      const reverseLink = this.findReverseLink(message.linkData.link);
      if (reverseLink) {
        const linkId = reverseLink.uuid || reverseLink.id || 'unknown';
        this.generationTimers.set(linkId, 0);
        this.messagingStats.responsesGenerated++;
      }
    }
  }

  findReverseLink(link) {
    if (!link) return null;

    const sourceNode = link.nodeB;
    const targetNode = link.nodeA;

    for (const trackedLink of this.trackedLinks.values()) {
      if (trackedLink.sourceNode === sourceNode && trackedLink.targetNode === targetNode) {
        return trackedLink.link;
      }
    }

    return null;
  }

  interpretMessageAtNode(node, message) {
    if (!node || !node.userData) return;

    const interpretation = {
      timestamp: Date.now(),
      messageType: message.words[1]?.role || 'NEUTRAL',
      sourceSemanticState: message.words[1]?.semanticVector || {},
      linkQuality: {
        synergy: message.linkData.synergy,
        corruption: message.linkData.corruption,
        stability: message.linkData.stability,
        harmony: message.linkData.harmony
      }
    };

    this.interpretationCache.set(node.uuid || node.id || 'unknown', interpretation);
  }

  despawnMessage(message) {
    if (message.meshGroup) {
      this.messageContainer.remove(message.meshGroup);

      message.meshes.forEach(mesh => {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
      });
    }
  }

  // ============================================================
  // SIGNAL LAYER
  // ============================================================

  updateSignals(visualDelta) {
    const dt = Math.max(0, Number(visualDelta) || 0);

    const toRemove = [];
    for (const [key, signal] of this.activeSignals.entries()) {
      this._updateSignal(signal, dt);
      if (!signal.alive) {
        toRemove.push(key);
      }
    }

    for (const key of toRemove) {
      const signal = this.activeSignals.get(key);
      this._despawnSignal(signal);
      this.activeSignals.delete(key);
      const cooldown =
        signal.reason === 'hover'
          ? this.signalConfig.hoverCooldownSec
          : this.signalConfig.signalCooldownSec;
      this.cooldowns.set(key, this.globalTime + cooldown);
    }

    this.signalStats.active = this.activeSignals.size;
  }

  triggerAttentionSignal(node, reason = 'selection') {
    if (!this.enabled || !this.signalEnabled || !node?.position) return false;

    const contextKey = `node:${this._getNodeId(node)}`;
    if (this._isCooledDown(contextKey)) {
      this.signalStats.suppressed++;
      return false;
    }

    if (this.activeSignals.has(contextKey)) {
      return false;
    }

    if (this.signalCallbacks.isBurstActive() && reason !== 'selection') {
      this.signalStats.suppressed++;
      return false;
    }

    if (this._isCluttered(node, reason)) {
      this.signalStats.culledByClutter++;
      return false;
    }

    const semantic = this._getSemanticState(node);
    if (!this._isReadyToCommunicate(semantic, reason)) {
      this.signalStats.suppressed++;
      return false;
    }

    const meaning = this._deriveMeaning(semantic, reason, null);
    const radius =
      node.geometry?.boundingSphere?.radius ??
      node.userData?.boundingSphere?.radius ??
      0.6;
    const lift =
      (reason === 'selection' ? this.signalConfig.selectLiftY : this.signalConfig.hoverLiftY) +
      radius * 0.35;
    const anchorOffset = new THREE.Vector3(0, lift, 0);

    const signal = this._spawnSignal({
      contextKey,
      meaning,
      anchorNode: node,
      anchorOffset,
      shortMode: reason !== 'selection'
    });

    if (!signal) return false;
    signal.reason = reason;
    this.activeSignals.set(contextKey, signal);
    this.signalStats.emitted++;
    return true;
  }

  triggerResidueSignal(sourceNode, targetNode, residueKind = 'resonance') {
    if (!this.enabled || !this.signalEnabled || !sourceNode?.position || !targetNode?.position) return false;
    if (this.signalCallbacks.isBurstActive()) return false;

    const sourceId = this._getNodeId(sourceNode);
    const targetId = this._getNodeId(targetNode);
    const contextKey = `link:${sourceId}:${targetId}:${residueKind}`;

    if (this._isCooledDown(contextKey) || this.activeSignals.has(contextKey)) {
      return false;
    }

    const anchorPoint = new THREE.Vector3()
      .addVectors(sourceNode.position, targetNode.position)
      .multiplyScalar(0.5);
    anchorPoint.y += this.signalConfig.residueLiftY;

    const meaning = this._deriveMeaning(null, 'residue', residueKind);
    const signal = this._spawnSignal({
      contextKey,
      meaning,
      anchorNode: null,
      anchorOffset: new THREE.Vector3(),
      anchorPoint,
      shortMode: true
    });

    if (!signal) return false;
    this.activeSignals.set(contextKey, signal);
    this.signalStats.emitted++;
    return true;
  }

  requestSilenceForNode(node) {
    if (!node) return;
    const contextKey = `node:${this._getNodeId(node)}`;
    const signal = this.activeSignals.get(contextKey);
    if (!signal) return;
    signal.forceDecay = true;
  }

  requestGlobalSilence() {
    for (const signal of this.activeSignals.values()) {
      signal.forceDecay = true;
    }
  }

  _isCooledDown(contextKey) {
    const cooldownUntil = this.cooldowns.get(contextKey);
    return cooldownUntil !== undefined && cooldownUntil > this.globalTime;
  }

  _getNodeId(node) {
    return node?.userData?.nodeId ?? node?.userData?.id ?? node?.uuid ?? 'unknown';
  }

  _getSemanticState(node) {
    const nodeId = this._getNodeId(node);
    const map = this.semanticState;
    if (!map || typeof map.get !== 'function') return null;
    return map.get(nodeId) || null;
  }

  _isReadyToCommunicate(semanticState, reason) {
    if (reason === 'selection' || reason === 'hover') return true;
    if (!semanticState || !semanticState.type) return false;
    return semanticState.type !== 'neutral';
  }

  _isCluttered(node, reason = 'hover') {
    const root = node?.visualGroup || node;
    if (!root || typeof root.traverse !== 'function') return false;

    let overlayCount = 0;
    root.traverse((child) => {
      if (!child?.userData) return;
      if (
        child.userData.isGlyphLayer4 ||
        child.userData.isProceduralGlyph ||
        child.userData.isSemanticHelper ||
        child.userData.isRecursiveGlyphSignal ||
        child.userData.isRecursiveGlyphSignalSystem
      ) {
        overlayCount++;
      }
    });

    const cap =
      reason === 'hover'
        ? this.signalConfig.clutterCap + this.signalConfig.hoverClutterBonus
        : this.signalConfig.clutterCap;
    return overlayCount >= cap;
  }

  _deriveMeaning(semanticState, reason, residueKind) {
    const stateType = semanticState?.type || 'neutral';
    let channel = 'alignment';
    let color = new THREE.Color(0x55d8ff);
    let recursionLayers = 2;

    if (residueKind === 'tension') {
      channel = 'tension';
      color = new THREE.Color(0xff8a66);
      recursionLayers = 1;
    } else if (residueKind === 'resonance') {
      channel = 'resonance';
      color = new THREE.Color(0xffd36b);
    } else if (stateType === 'conflict' || stateType === 'stressed') {
      channel = 'tension';
      color = new THREE.Color(0xff7b7b);
    } else if (stateType === 'corruption') {
      channel = 'caution';
      color = new THREE.Color(0xd17cff);
      recursionLayers = 1;
    } else if (stateType === 'exploring') {
      channel = 'curiosity';
      color = new THREE.Color(0x7dffca);
    } else if (stateType === 'cluster-sync' || stateType === 'leader') {
      channel = 'resonance';
      color = new THREE.Color(0xffcf7a);
    }

    if (reason === 'hover') {
      recursionLayers = Math.min(recursionLayers, 1);
    }

    return { channel, color, recursionLayers };
  }

  _spawnSignal({
    contextKey,
    meaning,
    anchorNode,
    anchorOffset,
    anchorPoint = null,
    shortMode = false
  }) {
    if (this.activeSignals.size >= this.signalConfig.globalCap) {
      this.signalStats.suppressed++;
      return null;
    }

    const group = new THREE.Group();
    group.userData.isRecursiveGlyphSignal = true;
    group.name = `RecursiveGlyphSignal_${contextKey}`;

    const rootRing = this._createMesh(this.signalGeometry.ring, meaning.color, 0.52);
    const innerRing = this._createMesh(this.signalGeometry.ring, meaning.color, 0.38);
    innerRing.scale.setScalar(0.62);
    innerRing.rotation.x = Math.PI * 0.5;

    const coreGlyph = this._createMesh(this.signalGeometry.core, meaning.color, 0.72);
    coreGlyph.scale.setScalar(0.46);

    const ticks = [];
    for (let i = 0; i < 4; i++) {
      const tick = this._createMesh(this.signalGeometry.tick, meaning.color, 0.45);
      tick.position.set(0.58, 0, 0);
      tick.rotation.z = (Math.PI * 2 * i) / 4;
      ticks.push(tick);
      group.add(tick);
    }

    const folds = [];
    const foldCount = this.signalCallbacks.isFieldActive() ? 1 : meaning.recursionLayers;
    for (let i = 0; i < foldCount; i++) {
      const fold = new THREE.Group();
      const foldRing = this._createMesh(this.signalGeometry.ring, meaning.color, 0.36);
      const foldCore = this._createMesh(this.signalGeometry.micro, meaning.color, 0.5);
      foldCore.scale.setScalar(0.8);
      foldRing.scale.setScalar(0.44 - i * 0.08);
      foldCore.position.x = 0.15 + i * 0.06;
      fold.add(foldRing);
      fold.add(foldCore);
      fold.visible = false;
      fold.userData.revealAt = 0.36 + i * 0.18;
      folds.push(fold);
      group.add(fold);
    }

    group.add(rootRing);
    group.add(innerRing);
    group.add(coreGlyph);

    group.scale.setScalar(this.signalConfig.baseSize);
    this.signalContainer.add(group);

    const sustainSec = shortMode ? this.signalConfig.shortSustainSec : this.signalConfig.sustainSec;
    return {
      key: contextKey,
      group,
      rootRing,
      innerRing,
      coreGlyph,
      ticks,
      folds,
      meaning,
      anchorNode,
      anchorOffset,
      anchorPoint: anchorPoint ? anchorPoint.clone() : null,
      age: 0,
      emergenceSec: this.signalConfig.emergenceSec,
      sustainSec,
      decaySec: this.signalConfig.decaySec,
      forceDecay: false,
      alive: true,
      seed: Math.random() * Math.PI * 2
    };
  }

  _createMesh(geometry, color, opacity) {
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      fog: false,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.isRecursiveGlyphSignal = true;
    return mesh;
  }

  _updateSignal(signal, dt) {
    if (!signal?.alive) return;

    signal.age += dt;
    let emergenceSec = signal.emergenceSec;
    let sustainSec = signal.sustainSec;
    let decaySec = signal.decaySec;

    if (this.signalCallbacks.isFieldActive()) {
      sustainSec *= 0.8;
    }

    if (signal.forceDecay || this.signalCallbacks.isBurstActive()) {
      sustainSec = 0;
      decaySec /= this.signalConfig.burstDecayMultiplier;
    }

    const totalSec = emergenceSec + sustainSec + decaySec;
    if (signal.age >= totalSec) {
      signal.alive = false;
      return;
    }

    let alpha = 0;
    if (signal.age <= emergenceSec) {
      alpha = this._easeOut(signal.age / emergenceSec);
    } else if (signal.age <= emergenceSec + sustainSec) {
      alpha = 1.0;
    } else {
      const fadeT = (signal.age - emergenceSec - sustainSec) / decaySec;
      alpha = 1.0 - this._easeIn(fadeT);
    }

    const anchor = this._resolveAnchorPosition(signal);
    if (!anchor) {
      signal.alive = false;
      return;
    }

    signal.group.position.lerp(anchor, 0.35);
    signal.group.rotation.y += dt * this.signalConfig.rotationSpeed;
    signal.group.rotation.x = Math.sin(signal.age * 1.8 + signal.seed) * 0.06;

    const drift = Math.sin(signal.age * 2.1 + signal.seed) * this.signalConfig.driftStrength;
    const baseScale = this.signalConfig.baseSize * (0.9 + 0.1 * alpha);
    signal.group.scale.setScalar(baseScale + drift * alpha);

    this._setOpacity(signal.rootRing, alpha * 0.45);
    this._setOpacity(signal.innerRing, alpha * 0.34);
    this._setOpacity(signal.coreGlyph, alpha * 0.8);

    signal.coreGlyph.rotation.x += dt * 1.1;
    signal.coreGlyph.rotation.z += dt * 0.8;

    signal.ticks.forEach((tick, index) => {
      const wobble = Math.sin(signal.age * 2.4 + index * 0.7 + signal.seed) * 0.08;
      tick.position.x = 0.58 + wobble;
      tick.rotation.y += dt * 0.7;
      this._setOpacity(tick, alpha * 0.3);
    });

    signal.folds.forEach((fold, index) => {
      const revealAt = fold.userData.revealAt;
      if (alpha >= revealAt) {
        fold.visible = true;
      }
      if (!fold.visible) return;

      fold.rotation.y += dt * (0.35 + index * 0.2);
      fold.rotation.z -= dt * (0.18 + index * 0.1);
      fold.scale.setScalar(0.85 + alpha * 0.15);
      fold.traverse((child) => {
        if (child?.material) {
          child.material.opacity = alpha * 0.26;
        }
      });
    });
  }

  _resolveAnchorPosition(signal) {
    if (signal.anchorNode?.position) {
      return new THREE.Vector3()
        .copy(signal.anchorNode.position)
        .add(signal.anchorOffset || new THREE.Vector3());
    }
    if (signal.anchorPoint) {
      return signal.anchorPoint;
    }
    return null;
  }

  _despawnSignal(signal) {
    if (!signal?.group) return;

    if (signal.group.parent) {
      signal.group.parent.remove(signal.group);
    }

    signal.group.traverse((child) => {
      if (child?.material) {
        child.material.dispose();
      }
    });
  }

  _setOpacity(mesh, value) {
    if (mesh?.material) {
      mesh.material.opacity = Math.max(0, value);
    }
  }

  _easeOut(t) {
    const x = Math.max(0, Math.min(1, t));
    return 1 - Math.pow(1 - x, 2);
  }

  _easeIn(t) {
    const x = Math.max(0, Math.min(1, t));
    return x * x;
  }

  setSignalCallbacks({ isBurstActive = null, isFieldActive = null } = {}) {
    if (typeof isBurstActive === 'function') {
      this.signalCallbacks.isBurstActive = isBurstActive;
    }
    if (typeof isFieldActive === 'function') {
      this.signalCallbacks.isFieldActive = isFieldActive;
    }
  }

  // ============================================================
  // SEMANTIC INTERPRETER
  // ============================================================

  updateSemantic(visualDelta, nodes) {
    if (!nodes || nodes.length === 0) return;

    const startTime = performance.now();

    this.interpretationAccumulator += visualDelta;
    const shouldInterpret = this.interpretationAccumulator >= this.interpretationInterval;

    this.decayEventHistory(visualDelta);

    this.semanticStats.nodesProcessed = nodes.length;
    let statesApplied = 0;

    for (const node of nodes) {
      if (!node || !node.userData) continue;
      if (!node.userData.nodeId) {
        continue;
      }

      const nodeId = node.userData.nodeId;

      const context = this.readSemanticContext(node);

      let state = this.semanticState.get(nodeId);
      if (shouldInterpret || !state) {
        state = this.computeSemanticState(context, nodeId);
        if (state) {
          this.semanticState.set(nodeId, state);
          statesApplied++;
        }
      }

      if (state) {
        this.applySemanticVisualsToNode(node, nodeId, state, visualDelta);
      }
    }

    if (shouldInterpret) {
      this.interpretationAccumulator = 0;
    }

    this.semanticStats.statesApplied = statesApplied;
    this.semanticStats.frameTime = performance.now() - startTime;
  }

  decayEventHistory(dt) {
    const dtMs = dt * 1000;

    for (const [nodeId, events] of this.eventHistory) {
      if (events.justLinked) {
        events.justLinked -= dtMs;
        if (events.justLinked <= 0) events.justLinked = null;
      }
      if (events.justRitual) {
        events.justRitual -= dtMs;
        if (events.justRitual <= 0) events.justRitual = null;
      }
      if (events.justAscended) {
        events.justAscended -= dtMs;
        if (events.justAscended <= 0) events.justAscended = null;
      }
      if (events.clusterSync) {
        events.clusterSync -= dtMs;
        if (events.clusterSync <= 0) events.clusterSync = null;
      }

      if (!events.justLinked && !events.justRitual && !events.justAscended && !events.clusterSync) {
        this.eventHistory.delete(nodeId);
      }
    }
  }

  readSemanticContext(node) {
    const userData = node.userData || {};

    const canonical = {
      synergy: userData.synergy,
      harmony: userData.harmony,
      stability: userData.metrics?.stability ?? 0,
      corruption: userData.corruption,
      loadPressure: userData.loadPressure
    };

    const metrics = this.adaptCanonicalToSemantic(canonical);

    const context = {
      category: userData.category || 'unknown',
      role: userData.role || 'generic',
      tags: userData.tags || [],
      isSpecial: userData.isSpecial || false,

      synergy: metrics.synergy,
      harmony: metrics.harmony,
      corruption: metrics.corruption,
      stability: metrics.stability,
      load: metrics.load,

      linkDegree: userData.linkDegree ?? 0,
      clusterMembershipID: userData.clusterMembershipID ?? null,

      ascended: userData.ascended || false,
      mythic: userData.mythic || false,

      position: node.position.clone()
    };

    return context;
  }

  adaptCanonicalToSemantic(canonical = {}) {
    const values = {
      synergy: canonical.synergy ?? 0,
      harmony: canonical.harmony ?? 0,
      stability: canonical.stability ?? 0,
      corruption: canonical.corruption ?? 0,
      load: canonical.loadPressure ?? 0
    };

    const maxVal = Math.max(...Object.values(values));
    const scaleFactor = maxVal > 1 ? 1 : 100;

    return {
      synergy: values.synergy * scaleFactor,
      harmony: values.harmony * scaleFactor,
      stability: values.stability * scaleFactor,
      corruption: values.corruption * scaleFactor,
      load: values.load * scaleFactor
    };
  }

  computeSemanticState(context, nodeId) {
    const events = this.eventHistory.get(nodeId) || {};

    let stateType = 'neutral';
    let parameters = {};

    if (events.clusterSync) {
      stateType = 'cluster-sync';
      parameters.syncAmount = Math.max(0, events.clusterSync / this.semanticConfig.clusterSyncDuration);
    }
    else if (events.justLinked) {
      stateType = 'exploring';
      parameters.exploreAmount = Math.max(0, events.justLinked / this.semanticConfig.exploringFadeTime);
    }
    else if (this.isConflicted(context)) {
      stateType = 'conflict';
      parameters.conflictStrength = Math.min(1, Math.abs(context.harmony - context.corruption) / 100);
    }
    else if (this.isLeader(context)) {
      stateType = 'leader';
      parameters.hubDegree = Math.min(1, context.linkDegree / 5);
    }
    else if (this.isOverloaded(context)) {
      stateType = 'stressed';
      parameters.stressLevel = Math.min(1, (context.load + context.stability) / 200);
    }
    else if (this.isFocused(context)) {
      stateType = 'focused';
      parameters.focusStrength = Math.min(1, context.synergy / 100);
    }
    else if (this.isCalm(context)) {
      stateType = 'calm';
      parameters.calmness = 1;
    }
    else {
      stateType = 'neutral';
    }

    return {
      type: stateType,
      parameters: parameters,
      context: context,
      eventFlags: events
    };
  }

  isFocused(context) {
    return context.synergy > 75 && context.corruption < 25 &&
           (context.tags.includes('analytics') || context.role === 'analyzer');
  }

  isOverloaded(context) {
    return context.load > 60 || (context.stability > 70 && context.harmony < 30);
  }

  isCalm(context) {
    return context.load < 30 && context.stability < 20 && context.corruption < 15;
  }

  isLeader(context) {
    return context.linkDegree >= 4 ||
           (context.tags.includes('hub') || context.role === 'router' || context.role === 'gateway');
  }

  isConflicted(context) {
    const harmonyCorruptionDiff = Math.abs(context.harmony - context.corruption);
    return context.harmony > 40 && context.corruption > 40 && harmonyCorruptionDiff < 30;
  }

  applySemanticVisualsToNode(node, nodeId, state, dt) {
    const fusion = this.glyphRegistry.get(nodeId);
    if (!fusion || !fusion.glyphGroup) return;

    const { type, parameters } = state;

    switch (type) {
      case 'focused':
        this.applyFocusedEffect(fusion.glyphGroup, parameters, nodeId, dt);
        break;
      case 'stressed':
        this.applyStressedEffect(fusion.glyphGroup, parameters, nodeId, dt);
        break;
      case 'calm':
        this.applyCalmEffect(fusion.glyphGroup, parameters, nodeId, dt);
        break;
      case 'exploring':
        this.applyExploringEffect(fusion.glyphGroup, parameters, nodeId, dt);
        break;
      case 'leader':
        this.applyLeaderEffect(fusion.glyphGroup, parameters, nodeId, dt);
        break;
      case 'conflict':
        this.applyConflictEffect(fusion.glyphGroup, parameters, nodeId, dt);
        break;
      case 'cluster-sync':
        this.applyClusterSyncEffect(fusion.glyphGroup, parameters, nodeId, dt);
        break;
      default:
        this.applyNeutralEffect(fusion.glyphGroup, parameters, nodeId, dt);
    }
  }

  applyFocusedEffect(glyphGroup, parameters, nodeId, dt) {
    const { focusStrength } = parameters;
    if (!glyphGroup.userData) glyphGroup.userData = {};

    const core = glyphGroup.children.find(c => c.userData?.component === 'corePoint');
    if (core) {
      if (!core.userData.semanticRotSpeed) core.userData.semanticRotSpeed = 1;
      core.userData.semanticRotSpeed = THREE.MathUtils.lerp(
        core.userData.semanticRotSpeed,
        1 + focusStrength * this.semanticConfig.focusedAnimSpeedMultiplier,
        0.1
      );
    }
  }

  applyStressedEffect(glyphGroup, parameters, nodeId, dt) {
    const { stressLevel } = parameters;
    if (!glyphGroup.userData) glyphGroup.userData = {};

    const core = glyphGroup.children.find(c => c.userData?.component === 'corePoint');
    if (core) {
      if (!core.userData.pulsePhase) core.userData.pulsePhase = 0;
      core.userData.pulsePhase += dt * this.semanticConfig.overloadedPulseSpeed;

      const pulseAmount = 0.5 + Math.sin(core.userData.pulsePhase) * 0.3;
      if (core.material) {
        core.material.opacity = THREE.MathUtils.lerp(core.material.opacity, pulseAmount, 0.15);
      }
    }
  }

  applyCalmEffect(glyphGroup, parameters, nodeId, dt) {
    if (!glyphGroup.userData) glyphGroup.userData = {};

    const core = glyphGroup.children.find(c => c.userData?.component === 'corePoint');
    if (core) {
      if (!core.userData.semanticRotSpeed) core.userData.semanticRotSpeed = 1;
      core.userData.semanticRotSpeed = THREE.MathUtils.lerp(
        core.userData.semanticRotSpeed,
        this.semanticConfig.idleRotationReduction,
        0.05
      );
    }
  }

  applyExploringEffect(glyphGroup, parameters, nodeId, dt) {
    const { exploreAmount } = parameters;
    const count = Math.min(4, Math.ceil(exploreAmount * 8));

    for (let i = 0; i < count; i++) {
      const dot = this.helperMeshes.flickerDots[(nodeId + i) % this.helperMeshes.flickerDots.length];
      if (!dot) continue;

      dot.visible = true;

      if (!dot.userData.orbitPhase) dot.userData.orbitPhase = Math.random() * Math.PI * 2;
      dot.userData.orbitPhase += this.semanticConfig.exploringOrbSpeed * 0.02;

      const orbitRadius = 0.15 + Math.sin(dot.userData.orbitPhase) * 0.05;
      const angle = dot.userData.orbitPhase + (i / count) * Math.PI * 2;

      dot.position.copy(glyphGroup.position);
      dot.position.x += Math.cos(angle) * orbitRadius;
      dot.position.z += Math.sin(angle) * orbitRadius;

      dot.material.opacity = exploreAmount * (0.5 + Math.sin(dot.userData.orbitPhase * 3) * 0.4);
    }
  }

  applyLeaderEffect(glyphGroup, parameters, nodeId, dt) {
    const { hubDegree } = parameters;
    const pulseCount = Math.min(8, Math.ceil(this.semanticConfig.leaderHaloCount * hubDegree));

    for (let i = 0; i < pulseCount; i++) {
      const ring = this.helperMeshes.crownRings[(nodeId + i) % this.helperMeshes.crownRings.length];
      if (!ring) continue;

      ring.visible = true;

      if (!ring.userData.pulsePhase) ring.userData.pulsePhase = (i / pulseCount) * Math.PI * 2;
      ring.userData.pulsePhase += 0.02;

      const angle = ring.userData.pulsePhase;
      const pulse = 1 + Math.sin(ring.userData.pulsePhase * 2) * 0.3;

      ring.position.copy(glyphGroup.position);
      ring.position.x += Math.cos(angle) * 0.1 * pulse;
      ring.position.z += Math.sin(angle) * 0.1 * pulse;

      ring.material.opacity = 0.4 + Math.sin(ring.userData.pulsePhase * 3) * 0.3;
    }
  }

  applyConflictEffect(glyphGroup, parameters, nodeId, dt) {
    const { conflictStrength } = parameters;

    const divider = this.helperMeshes.splitDividers[nodeId % this.helperMeshes.splitDividers.length];
    if (!divider) return;

    divider.visible = conflictStrength > 0.2;
    if (divider.visible) {
      const targetPos = glyphGroup.position;
      if (targetPos) {
        divider.position.copy(targetPos);
      }
      divider.material.opacity = conflictStrength * 0.7;
    }
  }

  applyClusterSyncEffect(glyphGroup, parameters, nodeId, dt) {
    const { syncAmount } = parameters;

    const core = glyphGroup.children.find(c => c.userData?.component === 'corePoint');
    if (core) {
      if (!core.userData.syncPhase) core.userData.syncPhase = 0;
      core.userData.syncPhase += dt * 3;

      const pulseAmount = 1 + Math.sin(core.userData.syncPhase) * 0.15 * syncAmount;
      if (core.scale) {
        core.scale.setScalar(pulseAmount);
      }
    }
  }

  applyNeutralEffect(glyphGroup, parameters, nodeId, dt) {
    const core = glyphGroup.children.find(c => c.userData?.component === 'corePoint');
    if (core && core.userData) {
      core.userData.semanticRotSpeed = 1;
      core.userData.pulsePhase = 0;
    }
  }

  // ============================================================
  // SYNERGY REVEAL & CORRUPTION DIMMING
  // ============================================================

  updateNodeSynergy(nodeId, linkedSynergy) {
    if (linkedSynergy === undefined) return;

    let synergyState = this.synergyGlyphStates.get(nodeId);
    if (!synergyState) {
      synergyState = {
        linkedSynergy: 0,
        revealLevel: 0,
        revealed: false,
        lastRevealTime: 0
      };
      this.synergyGlyphStates.set(nodeId, synergyState);
    }

    synergyState.linkedSynergy = linkedSynergy;

    const oldLevel = synergyState.revealLevel;

    if (linkedSynergy >= this.synergyThresholds.reveal2) {
      synergyState.revealLevel = 2;
      synergyState.revealed = true;
    } else if (linkedSynergy >= this.synergyThresholds.reveal1) {
      synergyState.revealLevel = 1;
      synergyState.revealed = true;
    } else if (linkedSynergy >= this.synergyThresholds.linkedSynergy) {
      synergyState.revealLevel = 0;
      synergyState.revealed = false;
    } else {
      synergyState.revealLevel = 0;
      synergyState.revealed = false;
    }

    if (oldLevel !== synergyState.revealLevel) {
      synergyState.lastRevealTime = this.globalTime;
    }
  }

  _applySynergyGlyphReveal(glyphGroup, nodeId, context) {
    if (!glyphGroup || !nodeId) return;

    const synergyState = this.synergyGlyphStates.get(nodeId);
    if (!synergyState || !synergyState.revealed) {
      return;
    }

    const { revealLevel, linkedSynergy } = synergyState;

    if (revealLevel === 1) {
      const fadeProgress = (linkedSynergy - this.synergyThresholds.reveal1) /
                          (this.synergyThresholds.reveal2 - this.synergyThresholds.reveal1);
      const revealOpacity = Math.min(fadeProgress * 0.35, 0.35);

      glyphGroup.traverse(child => {
        if (child.material && child.userData.component) {
          child.material.opacity = Math.min(0.60,
            (child.material.opacity || 0.50) + revealOpacity);
        }
      });
    }
    else if (revealLevel === 2) {
      glyphGroup.traverse(child => {
        if (child.material) {
          child.material.opacity = Math.min(0.85, child.material.opacity * 1.15);
        }
      });
    }
  }

  _applyCorruptionGlyphDimming(glyphGroup, nodeId, context) {
    if (!glyphGroup || !context) return;

    const corruption = context.corruption || 0;
    const config = this.corruptionDimmingConfig;

    if (corruption < config.activeThreshold) {
      glyphGroup.userData.corruptionDimmingActive = false;
      return;
    }

    const dimmingRange = config.maxDimmingThreshold - config.activeThreshold;
    const corruptionProgress = Math.min(
      (corruption - config.activeThreshold) / dimmingRange,
      1.0
    );

    const dimmingFactor = 1.0 - (corruptionProgress * (1.0 - config.minOpacityFactor));

    glyphGroup.userData.corruptionDimmingActive = true;
    glyphGroup.userData.corruptionDimmingFactor = dimmingFactor;

    glyphGroup.traverse(child => {
      if (child.material && child.material.opacity !== undefined) {
        if (!child.userData.baseOpacityBeforeDimming) {
          child.userData.baseOpacityBeforeDimming = child.material.opacity;
        }

        child.material.opacity = child.userData.baseOpacityBeforeDimming * dimmingFactor;
      }
    });
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.clearAll();
    }
  }

  setCoreEnabled(enabled) {
    this.coreEnabled = enabled;
  }

  setMessagingEnabled(enabled) {
    this.messagingEnabled = enabled;
  }

  setSignalEnabled(enabled) {
    this.signalEnabled = enabled;
  }

  setSemanticEnabled(enabled) {
    this.semanticEnabled = enabled;
  }

  clearAll() {
    this.clearAllGlyphs();
    this.clearAllMessages();
    this.clearAllSignals();
    this.semanticState.clear();
    this.eventHistory.clear();
  }

  clearAllGlyphs() {
    for (const nodeId of this.glyphRegistry.keys()) {
      this.disposeGlyph(nodeId);
    }
  }

  clearAllMessages() {
    this.activeMessages.forEach((messages, linkId) => {
      messages.forEach(msg => this.despawnMessage(msg));
    });
    this.activeMessages.clear();
    this.trackedLinks.clear();
    this.generationTimers.clear();
  }

  clearAllSignals() {
    for (const signal of this.activeSignals.values()) {
      this._despawnSignal(signal);
    }
    this.activeSignals.clear();
    this.cooldowns.clear();
  }

  disposeGlyph(nodeId) {
    const glyphData = this.glyphRegistry.get(nodeId);
    if (!glyphData) return;

    const { glyphGroup } = glyphData;

    if (glyphGroup && glyphGroup.parent) {
      glyphGroup.parent.remove(glyphGroup);
    }

    glyphGroup.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    this.glyphRegistry.delete(nodeId);
    this.contextCache.delete(nodeId);
    this.animationState.delete(nodeId);
    this.stats.activeGlyphs--;
  }

  getStatus() {
    return {
      enabled: this.enabled,
      core: {
        enabled: this.coreEnabled,
        activeGlyphs: this.stats.activeGlyphs,
        totalCreated: this.stats.totalGlyphsCreated,
        byType: this.stats.byType,
        lastUpdateMs: this.stats.lastUpdateTime.toFixed(2)
      },
      messaging: {
        enabled: this.messagingEnabled,
        messagesActive: this.messagingStats.messagesActive,
        messagesSpawned: this.messagingStats.messagesSpawned,
        messagesCompleted: this.messagingStats.messagesCompleted,
        responsesGenerated: this.messagingStats.responsesGenerated,
        linksActive: this.messagingStats.linksActive,
        lastFrameMs: this.messagingStats.lastFrameTime.toFixed(2)
      },
      signals: {
        enabled: this.signalEnabled,
        activeSignals: this.signalStats.active,
        emitted: this.signalStats.emitted,
        suppressed: this.signalStats.suppressed,
        culledByClutter: this.signalStats.culledByClutter
      },
      semantic: {
        enabled: this.semanticEnabled,
        nodesProcessed: this.semanticStats.nodesProcessed,
        statesApplied: this.semanticStats.statesApplied,
        helperMeshesActive: this.semanticStats.helperMeshesActive,
        frameTimeMs: this.semanticStats.frameTime.toFixed(2)
      }
    };
  }

  printStatus() {
    const status = this.getStatus();
    console.group('🌈 Mega Glyph System 1.0 Status');
    console.log(`Overall: ${status.enabled ? 'ACTIVE' : 'DISABLED'}`);
    console.log('');
    console.log('CORE GLYPH RENDERER:');
    console.log(`  Status: ${status.core.enabled ? 'ACTIVE' : 'DISABLED'}`);
    console.log(`  Active Glyphs: ${status.core.activeGlyphs}`);
    console.log(`  Total Created: ${status.core.totalCreated}`);
    console.log(`  By Type:`, status.core.byType);
    console.log(`  Last Update: ${status.core.lastUpdateMs}ms`);
    console.log('');
    console.log('MESSAGING LAYER:');
    console.log(`  Status: ${status.messaging.enabled ? 'ACTIVE' : 'DISABLED'}`);
    console.log(`  Messages Active: ${status.messaging.messagesActive}`);
    console.log(`  Messages Spawned: ${status.messaging.messagesSpawned}`);
    console.log(`  Messages Completed: ${status.messaging.messagesCompleted}`);
    console.log(`  Responses Generated: ${status.messaging.responsesGenerated}`);
    console.log(`  Active Links: ${status.messaging.linksActive}`);
    console.log(`  Frame Time: ${status.messaging.lastFrameMs}ms`);
    console.log('');
    console.log('SIGNAL LAYER:');
    console.log(`  Status: ${status.signals.enabled ? 'ACTIVE' : 'DISABLED'}`);
    console.log(`  Active Signals: ${status.signals.activeSignals}`);
    console.log(`  Emitted: ${status.signals.emitted}`);
    console.log(`  Suppressed: ${status.signals.suppressed}`);
    console.log(`  Culled by Clutter: ${status.signals.culledByClutter}`);
    console.log('');
    console.log('SEMANTIC INTERPRETER:');
    console.log(`  Status: ${status.semantic.enabled ? 'ACTIVE' : 'DISABLED'}`);
    console.log(`  Nodes Processed: ${status.semantic.nodesProcessed}`);
    console.log(`  States Applied: ${status.semantic.statesApplied}`);
    console.log(`  Helper Meshes Active: ${status.semantic.helperMeshesActive}`);
    console.log(`  Frame Time: ${status.semantic.frameTimeMs}ms`);
    console.groupEnd();
  }

  cleanup() {
    this.clearAll();

    if (this.root?.parent) {
      this.root.parent.remove(this.root);
    }

    this.root?.traverse(obj => {
      if (obj.isMesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat?.dispose?.());
        } else {
          obj.material?.dispose?.();
        }
      }
    });

    // Dispose shared geometries
    Object.values(this.signalGeometry).forEach((geometry) => geometry?.dispose?.());

    console.log('✓ Mega Glyph System 1.0 cleaned up');
  }
}
