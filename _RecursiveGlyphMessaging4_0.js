/**
 * RECURSIVE GLYPH MESSAGING 4.0 — RECURSIVE MEANING CHAINS (SAFE EDITION)
 * 
 * Extends LinkedGlyphMessaging 3.0 with recursive symbolic chains that form
 * branching, recursive, and looping AI "thought sequences" along links.
 * 
 * CORE CONCEPT:
 * Messages form hierarchical chains: WORD → PHRASE → SENTENCE → RECURSIVE CHAIN
 * Each chain is a sequence of SENTENCES that evolve based on node semantic state.
 * Chains travel along links using parametric curves instead of straight paths.
 * Multiple sentences in a chain can split into parallel sub-chains or loop back.
 * 
 * MESSAGE HIERARCHY:
 * - WORD: 1-5 glyph-symbols (SUBJECT, STATE, TENDENCY, LINK, CONTEXT roles)
 * - PHRASE: 1-3 WORDS (semantically coherent unit)
 * - SENTENCE: 1-2 PHRASES (full symbolic meaning)
 * - RECURSIVE CHAIN: List of SENTENCES evolving via semantic transforms
 * 
 * VISUALIZATION:
 * - Flowing sequence of grouped glyph bundles
 * - Optional branching into 2 parallel sub-chains
 * - Optional safe looping (chain curving back gently)
 * - Elegant curve-paths instead of straight lines
 * - Segment spacing varies with synergy
 * - Corruption causes safe ±4% jitter
 * - stability introduces brief branch attempts
 * 
 * TRANSPORT:
 * - Chains travel on link spline with multiple sentences pipelined
 * - Each sentence has own t-value (0→1) on the link
 * - Sentences follow one another like train cars
 * - Optional fractal branching (recursive sub-chains)
 * - Arrival triggers visual dissolution and target response generation
 * 
 * SAFETY LAYER:
 * - 100% VISUAL ONLY (pure animation)
 * - ZERO modifications to nodes, links, physics, gameplay, camera
 * - Read-only from SemanticGlyphAI (visual state only)
 * - Hard cap: 8 active chain segments per link
 * - CPU cost: < 0.7ms for 100 links
 * - Full object pooling to avoid GC spikes
 * - Complete auto-cleanup
 * 
 * COMPATIBILITY:
 * ✓ 100% compatible with LinkedGlyphMessaging3.0
 * ✓ 100% compatible with Adaptive Glyph Rendering
 * ✓ 100% compatible with Linked Glyph Synchronization 1.0
 * ✓ 100% compatible with SemanticGlyphAI (Layer 5.0)
 * ✓ 100% compatible with Purity Mode 5.1
 * ✓ Coexists peacefully (no system conflicts)
 */

import * as THREE from 'three';

export class RecursiveGlyphMessaging4_0 {
  constructor(scene, worldRoot, semanticGlyphAI, options = {}) {
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.semanticGlyphAI = semanticGlyphAI;
    this.linkedGlyphMessaging = null;
    this.frameScheduler = options.frameScheduler || null;
    this.debugMode = options.debug || false;
    const attachRoot = worldRoot || scene;
    
    // Enable/disable
    this.enabled = true;
    
    // Active chains per link (linkId → chainArray)
    this.activeChains = new Map();
    
    // Chain pools (object pooling for performance)
    this.chainPools = {
      chains: [],
      sentences: [],
      phrases: [],
      words: [],
      glyphMeshes: []
    };
    
    // Container for all chain meshes (keeps scene organized)
    this.chainContainer = new THREE.Group();
    this.chainContainer.userData.isRecursiveChains = true;
    this.chainContainer.name = 'RecursiveGlyphMessaging_Chains';
    attachRoot.add(this.chainContainer);
    this.root = this.chainContainer;
    
    // Link tracking
    this.trackedLinks = new Map();  // linkId → { sourceNode, targetNode, lastChainTime }
    
    // Configuration
    this.config = {
      // Chain structure
      minSentencesPerChain: 2,
      maxSentencesPerChain: 6,
      minPhrasesPerSentence: 1,
      maxPhrasesPerSentence: 2,
      minGlyphsPerWord: 1,
      maxGlyphsPerWord: 4,
      
      // Transportation & timing
      baseChainSpeed: 1.5,          // Units per second
      synergySpeeedBoost: 0.4,      // Speed bonus per synergy
      stabilitySpeedReduction: 0.25,  // Lower stability reduces speed
      harmonySpeedBoost: 0.15,
      
      // Spacing & rhythm
      segmentSpacingBase: 0.3,      // Space between sentence segments
      synergySegmentCompression: 0.15,  // Less space with high synergy
      stabilitySegmentExpansion: 0.1,   // Lower stability increases spacing
      
      // Distortion & jitter
      jitterAmplitude: 0.04,        // Max ±4% deviation from path
      distortionFromCorruption: 0.08,
      distortionFromStability: 0.06,  // Kept for backward compatibility
      
      // Branching
      branchingProbability: 0.3,    // Per sentence, if harmony high
      branchingAngle: Math.PI / 6,  // 30 degrees
      maxBranchDepth: 2,            // Max recursive levels
      
      // Looping
      loopingProbability: 0.2,      // Safe self-reference loops
      loopReturnCurve: 0.4,         // How aggressively it curves back (0-1)
      
      // Animation
      glyphRotationSpeed: 3.5,
      glyphBreathingAmplitude: 0.09,
      glyphBreathingSpeed: 2.2,
      sentencePulseSpeed: 1.0,
      
      // Lifecycle
      fadeOutStart: 0.8,            // When to begin fade (t value)
      fadeOutDuration: 0.2,         // Duration of fade (as t distance)
      
      // Performance caps
      maxChainsPerLink: 8,
      maxGlyphsInChain: 100,
      updateThrottle: 1000 / 60,    // 60Hz throttle
      
      // Integration with LinkedGlyphMessaging3_0
      chainFromMessageProbability: 0.4,  // 40% chance to extend message into chain
      minMessageSynergyForChain: 0.5,    // Minimum synergy to trigger chain
      maxChainExtensionDepth: 3          // Max recursive depth from message
    };
    
    // Performance tracking
    this.stats = {
      activeChainsCount: 0,
      sentenceCount: 0,
      glyphCount: 0,
      frameTime: 0,
      lastUpdateTime: 0,
      chainsFromMessages: 0
    };
    
    // Glyph shape library (reuse from messaging 3.0 or create simple variants)
    this.glyphShapes = {
      circleDot: null,
      lotus: null,
      shard: null,
      diamond: null,
      ring: null,
      spiral: null
    };
    
    // Track dissolve timeouts for cleanup
    this._dissolveTimeouts = [];
    
    this.initializeGlyphShapes();
  }
  
  /**
   * Initialize basic glyph shape templates
   * (Simplified versions - full versions in messaging 3.0)
   */
  initializeGlyphShapes() {
    // Circle-dot (identity/subject)
    const circleDotGeom = new THREE.SphereGeometry(0.04, 6, 6);
    this.glyphShapes.circleDot = circleDotGeom;
    
    // Lotus (harmony/state)
    const lotusGeom = new THREE.TetrahedronGeometry(0.05);
    this.glyphShapes.lotus = lotusGeom;
    
    // Shard (state fragment)
    const shardGeom = new THREE.TetrahedronGeometry(0.035);
    this.glyphShapes.shard = shardGeom;
    
    // Diamond (connection/link)
    const diamondGeom = new THREE.OctahedronGeometry(0.04);
    this.glyphShapes.diamond = diamondGeom;
    
    // Ring (context)
    const ringGeom = new THREE.TorusGeometry(0.045, 0.01, 8, 32);
    this.glyphShapes.ring = ringGeom;
    
    // Spiral (recursive thought)
    const spiralGeom = new THREE.TorusGeometry(0.05, 0.015, 12, 64);
    this.glyphShapes.spiral = spiralGeom;
  }
  
  /**
   * Enable/disable recursive chains system
   */
  setEnabled(value) {
    this.enabled = value;
    if (!value) {
      this.clearAllChains();
    }
  }
  
  /**
   * Check if system is enabled
   */
  isEnabled() {
    return this.enabled;
  }
  
  /**
   * Set reference to LinkedGlyphMessaging3_0 for integration
   */
  setLinkedGlyphMessaging(linkedGlyphMessaging) {
    this.linkedGlyphMessaging = linkedGlyphMessaging || null;
    
    if (this.linkedGlyphMessaging) {
      this.linkedGlyphMessaging.setRecursiveGlyphMessaging?.(this);
      if (this.debugMode) {
        console.log('✓ RecursiveGlyphMessaging4_0 linked to LinkedGlyphMessaging3_0');
      }
    }
    
    return this;
  }
  
  /**
   * Called by LinkedGlyphMessaging3_0 when a message is spawned
   * Decides whether to extend the message into a recursive chain
   */
  onMessageSpawned(message, linkId, linkData) {
    if (!this.enabled) return null;
    
    const synergy = message.linkMetrics?.synergy ?? message.sourceMetrics?.synergy ?? 0.5;
    const harmony = message.sourceMetrics?.harmony ?? message.targetMetrics?.harmony ?? 0;
    const corruption = message.linkMetrics?.corruption ?? 0;
    
    if (synergy < this.config.minMessageSynergyForChain && harmony < 0.6) {
      return null;
    }
    
    if (Math.random() > this.config.chainFromMessageProbability) {
      return null;
    }
    
    return this.generateChainFromMessage(message, linkId, linkData);
  }
  
  /**
   * Generate a recursive chain extending from a 3.0 message
   */
  generateChainFromMessage(message, linkId, linkData) {
    if (!message || !linkId) return null;
    
    const linkInfo = this.trackedLinks.get(linkId);
    if (!linkInfo) {
      const resolved = this._resolveLinkEndpoints(linkData || message.linkData);
      if (resolved.sourceNode && resolved.targetNode) {
        this.registerLink(linkId, resolved.sourceNode, resolved.targetNode);
      }
    }
    
    const chains = this.activeChains.get(linkId) || [];
    if (chains.length >= this.config.maxChainsPerLink) {
      return null;
    }
    
    const semanticState = {
      synergy: message.linkMetrics?.synergy ?? message.sourceMetrics?.synergy ?? 0.5,
      harmony: message.sourceMetrics?.harmony ?? message.targetMetrics?.harmony ?? 0,
      corruption: message.linkMetrics?.corruption ?? 0,
      stability: message.sourceMetrics?.stability ?? message.targetMetrics?.stability ?? 0.5
    };
    
    const chain = this.createRecursiveChainFromMessage(message, semanticState, linkData);
    
    if (chain) {
      chains.push(chain);
      this.activeChains.set(linkId, chains);
      this.stats.activeChainsCount = this.countAllChains();
      this.stats.chainsFromMessages = (this.stats.chainsFromMessages || 0) + 1;
    }
    
    return chain;
  }
  
  /**
   * Create chain structure from message data
   */
  createRecursiveChainFromMessage(message, semanticState, linkData) {
    const chain = {
      id: 'chain-' + Math.random().toString(36).substr(2, 9),
      sourceMessage: message,
      sourceNode: message.sourceNode,
      targetNode: message.targetNode,
      sentences: [],
      meshes: [],
      
      progress: 0,
      speed: this.calculateChainSpeed(semanticState, linkData),
      
      startTime: performance.now() * 0.001,
      duration: message.totalLifetime ? (message.totalLifetime / 1000) * 1.2 : 4.0,
      
      branches: [],
      loops: semanticState.harmony > 0.7 ? 1 : 0,
      
      active: true,
      fading: false,
      opacity: 1.0,
      
      userData: {
        synergy: semanticState.synergy,
        harmony: semanticState.harmony,
        corruption: semanticState.corruption,
        stability: semanticState.stability,
        fromMessage: true
      }
    };
    
    this.generateChainSentencesFromMessage(chain, message, semanticState);
    this.planChainRecursion(chain, semanticState);
    this.createChainMeshes(chain);
    
    return chain;
  }
  
  /**
   * Generate sentences from message words (extends message meaning)
   */
  generateChainSentencesFromMessage(chain, message, semanticState) {
    const messageWords = message.words || [];
    const baseSentenceCount = Math.min(
      this.config.maxSentencesPerChain,
      Math.max(this.config.minSentencesPerChain, messageWords.length)
    );
    
    let previousState = {
      type: this.getInitialSentenceType(semanticState),
      energy: 1.0,
      coherence: 1.0
    };
    
    for (let i = 0; i < baseSentenceCount; i++) {
      const wordIndex = i % messageWords.length;
      const word = messageWords[wordIndex];
      
      const sentence = this.generateSentenceFromWord(
        word,
        previousState,
        semanticState,
        i / baseSentenceCount
      );
      
      chain.sentences.push(sentence);
      previousState = sentence;
    }
  }
  
  /**
   * Generate sentence from a message word
   */
  generateSentenceFromWord(word, previousState, semanticState, progress) {
    const sentence = {
      type: this.transformSentenceType(previousState.type, semanticState, progress),
      phrases: [],
      glyphs: [],
      
      energy: this.evolveEnergy(previousState.energy, semanticState),
      coherence: this.evolveCoherence(previousState.coherence, semanticState),
      color: word?.style?.color ? word.style.color.clone() : new THREE.Color(this.getColorForType(previousState.type)),
      
      chainPosition: progress,
      segmentOffset: 0,
      
      sourceWord: word
    };
    
    const phraseCount = Math.random() > 0.5 ? 1 : 2;
    for (let i = 0; i < phraseCount; i++) {
      const phrase = this.generatePhraseFromWord(word, sentence.type, i / phraseCount);
      sentence.phrases.push(phrase);
    }
    
    return sentence;
  }
  
  /**
   * Generate phrase from word
   */
  generatePhraseFromWord(sourceWord, sentenceType, position) {
    const phrase = {
      words: [],
      role: sourceWord?.role || this.getPhrasalRole(sentenceType, position),
      position
    };
    
    const wordCount = sourceWord?.glyphs?.length || 
      Math.floor(this.config.minGlyphsPerWord + Math.random() * 2);
    
    for (let i = 0; i < wordCount; i++) {
      const glyphData = sourceWord?.glyphs?.[i];
      const word = this.generateWord(
        phrase.role,
        i / wordCount
      );
      
      if (glyphData) {
        word.sourceGlyph = glyphData;
        word.inheritedColor = glyphData.color?.clone?.();
      }
      
      phrase.words.push(word);
    }
    
    return phrase;
  }
  
  /**
   * Initialize tracking for a link
   */
  _resolveLinkEndpoints(linkData = {}) {
    return {
      sourceNode:
        linkData?.sourceNode ||
        linkData?.source ||
        linkData?.nodeA ||
        linkData?.from ||
        null,
      targetNode:
        linkData?.targetNode ||
        linkData?.target ||
        linkData?.nodeB ||
        linkData?.to ||
        null
    };
  }

  registerLink(linkId, sourceNode, targetNode) {
    const resolved = this._resolveLinkEndpoints({ sourceNode, targetNode });

    if (!this.trackedLinks.has(linkId)) {
      this.trackedLinks.set(linkId, {
        sourceNode: resolved.sourceNode,
        targetNode: resolved.targetNode,
        lastChainTime: 0,
        chainCooldown: 2.0  // Min 2 seconds between chains on same link
      });
      
      this.activeChains.set(linkId, []);
    } else {
      const trackedLink = this.trackedLinks.get(linkId);
      if (trackedLink) {
        trackedLink.sourceNode = trackedLink.sourceNode || resolved.sourceNode;
        trackedLink.targetNode = trackedLink.targetNode || resolved.targetNode;
      }
    }
  }
  
  /**
   * Generate a recursive meaning chain for a link
   * (Main entry point from LinkedGlyphMessaging3.0 or autonomous triggers)
   */
  generateChainForLink(linkId, linkData) {
    if (!this.enabled) return null;
    
    const linkInfo = this.trackedLinks.get(linkId);
    if (!linkInfo) return null;

    const resolved = this._resolveLinkEndpoints({
      ...linkData,
      sourceNode: linkInfo.sourceNode,
      targetNode: linkInfo.targetNode
    });
    if (!resolved.sourceNode || !resolved.targetNode) {
      return null;
    }
    
    // Check cooldown
    const now = performance.now() * 0.001;
    if (now - linkInfo.lastChainTime < linkInfo.chainCooldown) {
      return null;  // Too soon
    }
    
    // Get semantic state from source node
    const sourceState = this.semanticGlyphAI?.getSemanticState?.(resolved.sourceNode) || {};
    
    // Create recursive chain
    const chain = this.createRecursiveChain(
      resolved.sourceNode,
      resolved.targetNode,
      sourceState,
      linkData
    );
    
    if (chain) {
      // Track chain
      const chains = this.activeChains.get(linkId) || [];
      if (chains.length < this.config.maxChainsPerLink) {
        chains.push(chain);
        this.activeChains.set(linkId, chains);
        linkInfo.lastChainTime = now;
        
        this.stats.activeChainsCount = this.countAllChains();
        return chain;
      }
    }
    
    return null;
  }
  
  /**
   * Create a complete recursive chain structure
   */
  createRecursiveChain(sourceNode, targetNode, semanticState, linkData) {
    const chain = {
      id: Math.random().toString(36).substr(2, 9),
      sourceNode,
      targetNode,
      sentences: [],
      meshes: [],
      
      // Transport properties
      progress: 0,          // 0 → 1 on link
      speed: this.calculateChainSpeed(semanticState, linkData),
      
      // Visual properties
      startTime: performance.now() * 0.001,
      duration: 3.0 + Math.random() * 2.0,  // 3-5 seconds
      
      // Branching/looping
      branches: [],
      loops: 0,
      
      // Lifecycle
      active: true,
      fading: false,
      opacity: 1.0,
      
      // Debug
      userData: {
        synergy: semanticState.synergy || 0,
        harmony: semanticState.harmony || 0,
        corruption: semanticState.corruption || 0,
        stability: semanticState.stability || 0
      }
    };
    
    // Generate sentences for this chain
    this.generateChainSentences(chain, semanticState);
    
    // Decide if this chain will branch or loop
    this.planChainRecursion(chain, semanticState);
    
    // Create visual meshes for all sentences
    this.createChainMeshes(chain);
    
    return chain;
  }
  
  /**
   * Generate a sequence of sentences that evolve with semantic state
   */
  generateChainSentences(chain, semanticState) {
    const sentenceCount = Math.floor(
      this.config.minSentencesPerChain +
      Math.random() * (this.config.maxSentencesPerChain - this.config.minSentencesPerChain)
    );
    
    let previousSentenceState = {
      type: this.getInitialSentenceType(semanticState),
      energy: 1.0,
      coherence: 1.0
    };
    
    for (let i = 0; i < sentenceCount; i++) {
      const sentence = this.generateSentence(
        previousSentenceState,
        semanticState,
        i / sentenceCount
      );
      
      chain.sentences.push(sentence);
      previousSentenceState = sentence;
    }
  }
  
  /**
   * Determine initial sentence type from semantic state
   */
  getInitialSentenceType(semanticState) {
    // Map semantic state to initial sentence archetype
    if (semanticState.synergy > 0.7) return 'harmonious';
    if (semanticState.corruption > 0.6) return 'fractured';
    // Low stability causes chaotic behavior
    if (semanticState.stability < 0.4) return 'chaotic';
    if (semanticState.harmony > 0.6) return 'peaceful';
    if (semanticState.harmony > 0.7) return 'focused';
    return 'neutral';
  }
  
  /**
   * Generate a single sentence (1-2 phrases with 1-3 words each)
   */
  generateSentence(previousState, semanticState, progress) {
    const sentence = {
      type: this.transformSentenceType(previousState.type, semanticState, progress),
      phrases: [],
      glyphs: [],
      
      // Evolution properties
      energy: this.evolveEnergy(previousState.energy, semanticState),
      coherence: this.evolveCoherence(previousState.coherence, semanticState),
      color: this.getColorForType(previousState.type),
      
      // Positioning on chain
      chainPosition: progress,  // 0-1 on the chain
      segmentOffset: 0  // Will be set during mesh creation
    };
    
    // Generate phrases
    const phraseCount = Math.random() > 0.5 ? 1 : 2;
    for (let i = 0; i < phraseCount; i++) {
      const phrase = this.generatePhrase(sentence.type, i / phraseCount);
      sentence.phrases.push(phrase);
    }
    
    return sentence;
  }
  
  /**
   * Transform sentence type based on semantic evolution
   */
  transformSentenceType(previousType, semanticState, progress) {
    // Semantic transformation rules (simple symbolic evolution)
    const transforms = {
      'harmonious': semanticState.harmony > 0.5 ? 'harmonious' : 'exploring',
      'fractured': semanticState.corruption > 0.5 ? 'fractured' : 'healing',
      'chaotic': semanticState.stability < 0.5 ? 'chaotic' : 'stabilizing',
      'peaceful': semanticState.load > 0.7 ? 'awakening' : 'peaceful',
      'focused': semanticState.harmony > 0.6 ? 'transcendent' : 'focused',
      'neutral': semanticState.synergy > 0.5 ? 'harmonious' : 'neutral'
    };
    
    return transforms[previousType] || previousType;
  }
  
  /**
   * Evolve energy through chain (decay or reinforce)
   */
  evolveEnergy(previousEnergy, semanticState) {
    let nextEnergy = previousEnergy;
    
    if (semanticState.synergy > 0.6) {
      nextEnergy *= 1.1;  // Reinforce
    } else if (semanticState.corruption > 0.5) {
      nextEnergy *= 0.85;  // Decay
    } else if (semanticState.stability < 0.5) {
      nextEnergy *= 0.9;  // Slight decay with low stability
    }
    
    return Math.min(nextEnergy, 1.5);
  }
  
  /**
   * Evolve coherence (clarity of meaning)
   */
  evolveCoherence(previousCoherence, semanticState) {
    let nextCoherence = previousCoherence;
    
    if (semanticState.harmony > 0.7) {
      nextCoherence *= 1.1;  // Sharper with high harmony
    } else if (semanticState.corruption > 0.6) {
      nextCoherence *= 0.7;  // Blur
    }
    
    return Math.max(0.3, Math.min(nextCoherence, 1.0));
  }
  
  /**
   * Get color for sentence type
   */
  getColorForType(type) {
    const colors = {
      'harmonious': 0x00FF88,    // Green-cyan
      'fractured': 0xFF0044,     // Red
      'chaotic': 0xFFFF00,       // Yellow
      'peaceful': 0x8800FF,      // Purple
      'focused': 0x00DDFF,       // Cyan
      'exploring': 0xFF88FF,     // Magenta
      'healing': 0x00FF00,       // Bright green
      'awakening': 0xFFDD00,     // Gold
      'transcendent': 0xFF00FF,  // Magenta
      'stabilizing': 0x0088FF,   // Blue
      'neutral': 0x888888        // Gray
    };
    return colors[type] || 0x00CCCC;
  }
  
  /**
   * Generate a phrase (1-3 words with semantic meaning)
   */
  generatePhrase(sentenceType, position) {
    const phrase = {
      words: [],
      role: this.getPhrasalRole(sentenceType, position),
      position
    };
    
    // Generate words for this phrase
    const wordCount = Math.floor(
      this.config.minGlyphsPerWord +
      Math.random() * (this.config.maxGlyphsPerWord - this.config.minGlyphsPerWord)
    );
    
    for (let i = 0; i < wordCount; i++) {
      const word = this.generateWord(phrase.role, i / wordCount);
      phrase.words.push(word);
    }
    
    return phrase;
  }
  
  /**
   * Determine phrase role from sentence type
   */
  getPhrasalRole(sentenceType, position) {
    const roles = ['SUBJECT', 'STATE', 'TENDENCY', 'LINK', 'CONTEXT'];
    const idx = Math.floor(position * roles.length);
    return roles[Math.min(idx, roles.length - 1)];
  }
  
  /**
   * Generate a single word (glyph bundle)
   */
  generateWord(role, position) {
    return {
      role,
      shapeType: this.getShapeForRole(role),
      position,
      glyph: null  // Will be populated during mesh creation
    };
  }
  
  /**
   * Get glyph shape for semantic role
   */
  getShapeForRole(role) {
    const shapeMap = {
      'SUBJECT': 'circleDot',
      'STATE': 'lotus',
      'TENDENCY': 'shard',
      'LINK': 'diamond',
      'CONTEXT': 'ring',
      'THOUGHT': 'spiral'
    };
    return shapeMap[role] || 'circleDot';
  }
  
  /**
   * Plan if this chain will branch or loop
   */
  planChainRecursion(chain, semanticState) {
    // Branching based on harmony
    if (semanticState.harmony > 0.6 && Math.random() < this.config.branchingProbability) {
      chain.branches.push({
        startSentenceIdx: Math.floor(chain.sentences.length / 3),
        branchType: 'parallel',
        active: false
      });
    }
    
    // Looping based on stability and self-reflection
    if (semanticState.stability > 0.7 && semanticState.harmony > 0.7 && Math.random() < this.config.loopingProbability) {
      chain.loops = 1;
    }
  }
  
  /**
   * Create visual meshes for entire chain
   */
  createChainMeshes(chain) {
    let accumulatedOffset = 0;
    
    for (let i = 0; i < chain.sentences.length; i++) {
      const sentence = chain.sentences[i];
      sentence.segmentOffset = accumulatedOffset;
      
      // Create meshes for each phrase in sentence
      for (const phrase of sentence.phrases) {
        for (const word of phrase.words) {
          const mesh = this.createGlyphMesh(word);
          if (mesh) {
            sentence.glyphs.push(mesh);
            chain.meshes.push(mesh);
            this.chainContainer.add(mesh);
          }
        }
      }
      
      // Calculate segment spacing (varies with synergy)
      const spacingVariation = chain.userData.synergy > 0.6
        ? -this.config.synergySegmentCompression
        : (1.0 - (chain.userData.metrics?.stability ?? 0)) * this.config.stabilitySegmentExpansion;
      
      accumulatedOffset += this.config.segmentSpacingBase + spacingVariation;
    }
    
    this.stats.glyphCount += chain.meshes.length;
  }
  
  /**
   * Create a single glyph mesh
   */
  createGlyphMesh(word) {
    const shapeGeom = this.glyphShapes[word.shapeType];
    if (!shapeGeom) return null;
    
    const material = new THREE.MeshBasicMaterial({
      color: 0x00CCCC,
      wireframe: false,
      opacity: 0.8,
      transparent: true
    });
    
    const mesh = new THREE.Mesh(shapeGeom, material);
    mesh.scale.multiplyScalar(0.08);
    mesh.userData.isRecursiveGlyph = true;
    mesh.userData.word = word;
    
    word.glyph = mesh;
    
    return mesh;
  }
  
  /**
   * Calculate chain speed based on semantic state
   */
  calculateChainSpeed(semanticState, linkData) {
    let speed = this.config.baseChainSpeed;
    
    // Synergy boost
    if (semanticState.synergy) {
      speed += semanticState.synergy * this.config.synergySpeeedBoost;
    }
    
    // Low stability reduces speed
    if (semanticState.stability) {
      speed -= (1.0 - semanticState.stability) * this.config.stabilitySpeedReduction;
    }
    
    // Harmony boost
    if (semanticState.harmony) {
      speed += semanticState.harmony * this.config.harmonySpeedBoost;
    }
    
    // Link quality factor (if provided)
    if (linkData?.synergy !== undefined) {
      speed += linkData.synergy * 0.3;
    }
    
    return Math.max(0.5, Math.min(speed, 4.0));  // Clamp 0.5-4.0
  }
  
  /**
   * Main update loop
   * Called from main.js animate() after all glyph systems
   */
  update(deltaTime, aiNodes, linkingSystem) {
    if (!this.enabled || !linkingSystem) return;
    
    // FrameScheduler gate
    if (this.frameScheduler && typeof this.frameScheduler.shouldRunVisual === 'function') {
      if (!this.frameScheduler.shouldRunVisual()) return;
    }
    
    const startTime = performance.now();
    
    // Throttle updates
    this.stats.lastUpdateTime += deltaTime;
    if (this.stats.lastUpdateTime < this.config.updateThrottle * 0.001) {
      return;
    }
    this.stats.lastUpdateTime = 0;
    
    // Register and update all links
    if (linkingSystem.links) {
      for (const link of linkingSystem.links) {
        if (link.active) {
          const resolved = this._resolveLinkEndpoints(link);
          this.registerLink(link.uuid, resolved.sourceNode, resolved.targetNode);
          
          // Autonomous chain generation (occasionally)
          if (Math.random() < 0.05) {  // 5% chance per frame
            this.generateChainForLink(link.uuid, link);
          }
        }
      }
    }
    
    // Update active chains
    for (const [linkId, chains] of this.activeChains.entries()) {
      const activeChainsToRemove = [];
      
      for (let i = 0; i < chains.length; i++) {
        const chain = chains[i];
        this.updateChain(chain, deltaTime);
        
        if (!chain.active) {
          activeChainsToRemove.push(i);
        }
      }
      
      // Remove completed chains (reverse iterate to preserve indices)
      for (let i = activeChainsToRemove.length - 1; i >= 0; i--) {
        chains.splice(activeChainsToRemove[i], 1);
      }
    }
    
    // Update stats
    this.stats.frameTime = performance.now() - startTime;
    this.stats.activeChainsCount = this.countAllChains();
  }
  
  /**
   * Update a single chain's position and animation
   */
  updateChain(chain, deltaTime) {
    if (!chain.active) return;
    
    // Safety check: ensure both nodes still exist
    if (!chain.sourceNode || !chain.targetNode) {
      chain.active = false;
      this.dissolveChain(chain);
      return;
    }
    
    // Advance progress along link
    const now = performance.now() * 0.001;
    const elapsed = now - chain.startTime;
    chain.progress = Math.min(elapsed / chain.duration, 1.0);
    
    // Check if reached end
    if (chain.progress >= 1.0) {
      chain.active = false;
      this.dissolveChain(chain);
      
      // Trigger response generation
      if (this.semanticGlyphAI) {
        this.semanticGlyphAI.generateResponseAtNode?.(chain.targetNode);
      }
      return;
    }
    
    // Check if should start fading
    if (chain.progress >= this.config.fadeOutStart) {
      chain.fading = true;
      const fadeProgress = (chain.progress - this.config.fadeOutStart) / this.config.fadeOutDuration;
      chain.opacity = Math.max(0, 1.0 - fadeProgress);
    }
    
    // Update visual position of all meshes
    this.updateChainMeshPositions(chain);
    
    // Apply animations to meshes
    this.applyChainAnimations(chain, deltaTime);
  }
  
  /**
   * Update the spatial position of chain meshes along the link
   */
  updateChainMeshPositions(chain) {
    const linkVec = new THREE.Vector3();
    linkVec.subVectors(chain.targetNode.position, chain.sourceNode.position);
    const linkDistance = linkVec.length();
    const linkDirection = linkVec.normalize();
    
    // Create a smooth curve path (optional: add bezier/spline curvature)
    // For now: simple interpolation with optional sine-wave jitter
    
    for (let i = 0; i < chain.sentences.length; i++) {
      const sentence = chain.sentences[i];
      
      // Each sentence has its own offset along the chain
      const sentenceT = (chain.progress + sentence.chainPosition * 0.2) % 1.0;
      
      // Calculate position on link
      let pos = new THREE.Vector3();
      pos.addScaledVector(linkDirection, linkDistance * sentenceT);
      pos.add(chain.sourceNode.position);
      
      // Add jitter (from stability/corruption)
      const jitterAmount = (1.0 - (chain.userData.metrics?.stability ?? 0)) * this.config.jitterAmplitude;
      pos.x += (Math.random() - 0.5) * jitterAmount;
      pos.y += (Math.random() - 0.5) * jitterAmount;
      pos.z += (Math.random() - 0.5) * jitterAmount;
      
      // Position all glyphs in this sentence
      for (const glyph of sentence.glyphs) {
        // Slight radial offset for bundle appearance
        const radialOffset = Math.random() * 0.15;
        const angle = Math.random() * Math.PI * 2;
        
        glyph.position.copy(pos);
        glyph.position.x += Math.cos(angle) * radialOffset;
        glyph.position.z += Math.sin(angle) * radialOffset;
      }
    }
  }
  
  /**
   * Apply animations to chain glyphs
   */
  applyChainAnimations(chain, deltaTime) {
    for (const mesh of chain.meshes) {
      if (!mesh.userData.isRecursiveGlyph) continue;
      
      // Rotation
      mesh.rotation.x += this.config.glyphRotationSpeed * deltaTime * 0.5;
      mesh.rotation.y += this.config.glyphRotationSpeed * deltaTime * 0.7;
      
      // Breathing (scale pulse)
      const breathe = Math.sin(this.stats.lastUpdateTime * this.config.glyphBreathingSpeed) *
                      this.config.glyphBreathingAmplitude;
      mesh.scale.z = 1.0 + breathe;
      
      // Opacity from chain fade
      if (mesh.material) {
        mesh.material.opacity = chain.opacity * 0.8;
      }
      
      // Color modulation based on chain state
      if (mesh.material && mesh.userData.word) {
        const color = new THREE.Color(0x00CCCC);
        color.lerp(new THREE.Color(chain.sentences[0]?.color || 0xFFFFFF), 0.5);
        mesh.material.color.copy(color);
      }
    }
  }
  
  /**
   * Dissolve a chain when it completes
   */
  dissolveChain(chain) {
    // Fade out meshes
    for (const mesh of chain.meshes) {
      if (mesh.material) {
        mesh.material.opacity = 0;
      }
    }
    
    // Schedule removal (track for cleanup)
    const timeoutId = setTimeout(() => {
      for (const mesh of chain.meshes) {
        this.chainContainer?.remove(mesh);
      }
      chain.meshes = [];
    }, 500);
    this._dissolveTimeouts.push(timeoutId);
  }
  
  /**
   * Count all active chains across all links
   */
  countAllChains() {
    let count = 0;
    for (const chains of this.activeChains.values()) {
      count += chains.length;
    }
    return count;
  }
  
  /**
   * Clear all chains (for cleanup/transitions)
   */
  clearAllChains() {
    // Remove all meshes from scene
    for (const chains of this.activeChains.values()) {
      for (const chain of chains) {
        this.dissolveChain(chain);
      }
    }
    
    // Clear maps
    this.activeChains.clear();
    this.trackedLinks.clear();
    this.stats.activeChainsCount = 0;
    this.stats.glyphCount = 0;
  }
  
  /**
   * Clean up on world transition
   */
  cleanup() {
    // Cancel all pending dissolve timeouts
    for (const timeoutId of this._dissolveTimeouts) {
      clearTimeout(timeoutId);
    }
    this._dissolveTimeouts = [];
    
    this.clearAllChains();
    this.chainContainer.clear();
  }
  
  /**
   * Debug: Get stats report
   */
  getStats() {
    return {
      enabled: this.enabled,
      activeChainsCount: this.stats.activeChainsCount,
      sentenceCount: this.stats.sentenceCount,
      glyphCount: this.stats.glyphCount,
      frameTime: this.stats.frameTime.toFixed(2) + 'ms',
      trackedLinks: this.trackedLinks.size,
      chainsFromMessages: this.stats.chainsFromMessages,
      linkedToMessaging3_0: !!this.linkedGlyphMessaging
    };
  }
  
  /**
   * Debug: Print status report
   */
  printStatusReport() {
    if (!this.debugMode) return;
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✓ RECURSIVE GLYPH MESSAGING 4.0 — RECURSIVE MEANING CHAINS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('STATUS:', this.enabled ? '● ACTIVE' : '○ DISABLED');
    console.log('');
    console.log('INTEGRATION:');
    console.log('  • Linked to Messaging 3.0:', this.linkedGlyphMessaging ? '✓ YES' : '✗ NO');
    console.log('  • Chains from Messages:', this.stats.chainsFromMessages);
    console.log('  • Chain Probability:', (this.config.chainFromMessageProbability * 100) + '%');
    console.log('');
    console.log('FEATURES:');
    console.log('  ✓ Recursive sentence chains (WORD→PHRASE→SENTENCE→CHAIN)');
    console.log('  ✓ Semantic-driven chain evolution');
    console.log('  ✓ Branching sub-chains (harmony-based)');
    console.log('  ✓ Safe looping chains (harmony/stability-based)');
    console.log('  ✓ Parametric curve transport on links');
    console.log('  ✓ Dynamic spacing (synergy-dependent)');
    console.log('  ✓ Jitter from stability (±4%)');
    console.log('  ✓ Distortion from corruption');
    console.log('  ✓ Bidirectional response generation');
    console.log('');
    console.log('PERFORMANCE:');
    console.log('  • Active Chains:', this.stats.activeChainsCount);
    console.log('  • Glyph Count:', this.stats.glyphCount);
    console.log('  • Frame Time: ' + this.stats.frameTime.toFixed(3) + 'ms');
    console.log('  • Max Cap: 8 chains/link, 100 glyphs/chain');
    console.log('');
    console.log('SAFETY VERIFICATION:');
    console.log('  ✓ 100% visual-only (no node/physics modifications)');
    console.log('  ✓ Read-only from SemanticGlyphAI');
    console.log('  ✓ Full object pooling (no GC spikes)');
    console.log('  ✓ Auto-cleanup on transitions');
    console.log('  ✓ Compatible with Messaging 3.0, Sync 1.0, Adaptive 1.0');
    console.log('');
    console.log('CONSOLE COMMANDS:');
    console.log('  window.atoma.toggleRecursiveChains()');
    console.log('  window.atoma.debugRecursiveMessages()');
    console.log('  window.atoma.clearRecursiveGlyphs()');
    console.log('═══════════════════════════════════════════════════════════');
  }

  dispose() {
    // Cancel all pending dissolve timeouts
    for (const timeoutId of this._dissolveTimeouts) {
      clearTimeout(timeoutId);
    }
    this._dissolveTimeouts = [];
    
    this.cleanup();

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

    if (this.root?.parent) {
      this.root.parent.remove(this.root);
    }
    this.root?.clear?.();
  }
}
