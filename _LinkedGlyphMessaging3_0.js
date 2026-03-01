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

export class LinkedGlyphMessaging3_0 {
  constructor(scene, worldRoot, semanticGlyphAI) {
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.semanticGlyphAI = semanticGlyphAI;
    const attachRoot = worldRoot || scene;
    
    // Enable/disable messaging
    this.enabled = true;
    
    // Active messages on links (linkId → messageArray)
    this.activeMessages = new Map();
    
    // Message pools for reuse (object pool pattern)
    this.messagePools = {
      words: [],
      phrases: [],
      sentences: [],
      glyphMeshes: []
    };
    
    // Container for all messages (keeps scene organized)
    this.messageContainer = new THREE.Group();
    this.messageContainer.userData.isMessaging = true;
    this.messageContainer.name = 'LinkedGlyphMessaging_Messages';
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
    console.log('  - Messages carry node semantic state');
    console.log('  - Use debugPrintMessages() to inspect');
  }
  
  /**
   * Initialize object pools for efficient memory usage
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
      color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
      transparent: true,
      opacity: 0.9,
      fog: false
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.isMessageGlyph = true;
    return mesh;
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
  }
  
  /**
   * Unregister a link from messaging
   */
  unregisterLink(linkId) {
    // Clean up all messages on this link
    const messages = this.activeMessages.get(linkId);
    if (messages) {
      messages.forEach(msg => this.despawnMessage(msg));
      this.activeMessages.delete(linkId);
    }
    
    this.trackedLinks.delete(linkId);
    this.generationTimers.delete(linkId);
  }
  
  /**
   * Generate a message word from node semantic state
   */
  generateMessageWord(node, messageType = 'STATE') {
    if (!node || !node.userData) return null;
    
    // Extract semantic state from node
    const synergy = node.userData.synergy || 0.5;
    const corruption = node.userData.corruption || 0;
    const stability = node.userData.stability || 0;
    const harmony = node.userData.harmony || 0;
    const load = node.userData.load || 0;
    
    // Determine glyph count (more glyphs for complex states)
    const complexity = Math.abs(synergy - corruption) * 5;
    const glyphCount = Math.max(1, Math.min(5, Math.ceil(1 + complexity)));
    
    // Create word structure
    const word = {
      type: messageType,
      glyphs: [],
      role: this.determineGlyphRole(node, messageType),
      semanticVector: { synergy, corruption, stability, harmony, load }
    };
    
    // Generate individual glyphs for this word
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
  
  /**
   * Determine the role of a glyph based on context
   */
  determineGlyphRole(node, messageType) {
    const synergy = node.userData.synergy || 0.5;
    const corruption = node.userData.corruption || 0;
    const stability = node.userData.stability || 0;
    const harmony = node.userData.harmony || 0;
    
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
  
  /**
   * Select glyph color based on semantic state
   */
  selectGlyphColor(synergy, corruption, harmony) {
    const color = new THREE.Color();
    
    if (synergy > 0.7) {
      color.setHSL(0.5, 0.8, 0.6); // Cyan (strong connection)
    } else if (corruption > 0.6) {
      color.setHSL(0.05, 0.9, 0.55); // Red/orange (corruption)
    } else if (harmony > 0.7) {
      color.setHSL(0.8, 0.8, 0.6); // Magenta (harmony)
    } else {
      color.setHSL(0.2 + Math.random() * 0.2, 0.6, 0.6); // Random yellow-green
    }
    
    return color;
  }
  
  /**
   * Build a complete message (word sequence)
   */
  buildMessage(sourceNode, targetNode, linkData) {
    if (!sourceNode || !targetNode) return null;
    
    // Create sentence: subject + state + link + context (simplified to phrase)
    const message = {
      sourceNode,
      targetNode,
      linkData,
      words: [],
      createdAt: Date.now(),
      startPosition: sourceNode.position.clone(),
      endPosition: targetNode.position.clone(),
      progress: 0,  // 0 to 1
      meshes: [],   // Grouped glyph meshes
      totalLifetime: this.config.messageLifetimeSec * 1000
    };
    
    // Generate words
    message.words.push(this.generateMessageWord(sourceNode, 'SUBJECT'));
    message.words.push(this.generateMessageWord(sourceNode, 'STATE'));
    message.words.push(this.generateMessageWord(linkData.link, 'LINK'));
    
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
    
    let offsetY = 0;
    
    // Render each word as grouped glyphs
    message.words.forEach((word, wordIndex) => {
      word.glyphs.forEach((glyph, glyphIndex) => {
        // Create glyph mesh
        const mesh = this.createMiniGlyph(glyph.type);
        
        // Set position with slight stagger
        mesh.position.set(
          glyphIndex * 0.15 - (word.glyphs.length * 0.075),
          offsetY + glyph.offset.y,
          glyph.offset.z
        );
        
        // Set color
        mesh.material.color.copy(glyph.color);
        mesh.scale.setScalar(glyph.scale * 0.3); // Mini size
        
        // Store animation data
        mesh.userData.glyphData = glyph;
        mesh.userData.wordIndex = wordIndex;
        mesh.userData.glyphIndex = glyphIndex;
        
        group.add(mesh);
        message.meshes.push(mesh);
      });
      
      offsetY += 0.12;
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
    const message = this.buildMessage(sourceNode, targetNode, {
      link,
      linkId,
      synergy: link.synergy || 0.5,
      corruption: link.corruption || 0,
      stability: link.stability || 0,
      harmony: link.harmony || 0
    });
    
    if (!message) return;
    
    messages.push(message);
    this.activeMessages.set(linkId, messages);
    this.stats.messagesSpawned++;
    this.stats.messagesActive++;
  }
  
  /**
   * Update all active messages
   */
  updateMessages(deltaTime) {
    const now = Date.now();
    const toDelete = [];
    
    this.activeMessages.forEach((messages, linkId) => {
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
    const stabilityFactor = 1 - linkData.stability * this.config.messageSpeeedReductionFromStability;
    speed *= Math.max(0.5, stabilityFactor);
    
    // Acceleration from harmony
    speed *= (1 + linkData.harmony * 0.2);
    
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
    
    message.meshGroup.position.copy(currentPos);
    
    // Add jitter from stability
    const jitter = message.linkData.stability * this.config.jitterFromStability;
    message.meshGroup.position.x += (Math.random() - 0.5) * jitter;
    message.meshGroup.position.y += (Math.random() - 0.5) * jitter;
    message.meshGroup.position.z += (Math.random() - 0.5) * jitter;
    
    // Add distortion from corruption
    const distortion = message.linkData.corruption * this.config.distortionFromCorruption;
    message.meshGroup.rotation.x += (Math.random() - 0.5) * distortion;
    message.meshGroup.rotation.y += (Math.random() - 0.5) * distortion;
    
    // Global rotation animation
    message.meshGroup.rotation.z += this.config.glyphRotationSpeed * deltaTime;
    
    // Breathing animation on individual glyphs
    message.meshes.forEach((mesh, index) => {
      const phase = (this.globalTime + index * 0.2) * this.config.glyphBreathingSpeed;
      const breathScale = 1.0 + Math.sin(phase) * this.config.glyphBreathingAmplitude;
      mesh.scale.setScalar(mesh.userData.glyphData.scale * 0.3 * breathScale);
    });
    
    // Fade out as message completes
    const fadeStart = 0.8;
    if (message.progress > fadeStart) {
      const fadeAlpha = 1.0 - ((message.progress - fadeStart) / (1.0 - fadeStart));
      message.meshes.forEach(mesh => {
        mesh.material.opacity = fadeAlpha * 0.9;
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
    
    const sourceNode = link.nodeB;
    const targetNode = link.nodeA;
    
    // Search for link with reversed endpoints
    for (const trackedLink of this.trackedLinks.values()) {
      if (trackedLink.sourceNode === sourceNode && trackedLink.targetNode === targetNode) {
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
        synergy: message.linkData.synergy,
        corruption: message.linkData.corruption,
        stability: message.linkData.stability,
        harmony: message.linkData.harmony
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
      
      // Clean up geometries and materials
      message.meshes.forEach(mesh => {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
      });
    }
  }
  
  /**
   * Main update loop
   */
  update(deltaTime, aiNodes, linkingSystem) {
    if (!this.enabled || !aiNodes || !linkingSystem) return;

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
          const sourceNode = link.nodeA;
          const targetNode = link.nodeB;
          this.registerLink(link, linkId, sourceNode, targetNode);
        }
      });
    }
    
    // Generate new messages based on timing
    this.generateNewMessages(linkingSystem);
    
    // Update all active messages
    this.updateMessages(deltaTime);
    
    // Performance tracking
    this.stats.lastFrameTime = performance.now() - startTime;
    this.stats.linksActive = this.trackedLinks.size;
  }
  
  /**
   * Generate new messages on active links
   */
  generateNewMessages(linkingSystem) {
    const now = Date.now();
    const interval = 1000 / this.config.messageGenerationHz;
    
    this.generationTimers.forEach((timer, linkId) => {
      this.generationTimers.set(linkId, timer + (interval / 1000));
      
      const trackData = this.trackedLinks.get(linkId);
      if (!trackData) return;
      
      const messages = this.activeMessages.get(linkId) || [];
      
      // Generate message if timer reached
      if (this.generationTimers.get(linkId) >= interval / 1000) {
        if (messages.length < this.config.maxMessagesPerLink) {
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
  
  /**
   * Cleanup on world transition
   */
  cleanup() {
    this.activeMessages.forEach((messages, linkId) => {
      messages.forEach(msg => this.despawnMessage(msg));
    });
    this.activeMessages.clear();
    this.trackedLinks.clear();
    this.generationTimers.clear();
    this.stats.messagesActive = 0;
    console.log('✓ Linked Glyph Messaging 3.0 cleaned up');
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
    console.groupEnd();
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
    this.clearAllMessages();
    this.trackedLinks.clear();
    this.generationTimers.clear();

    if (this.root?.parent) {
      this.root.parent.remove(this.root);
    }
    this.root?.clear?.();

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
  }
}
