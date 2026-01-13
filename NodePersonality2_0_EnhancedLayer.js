/**
 * NODE PERSONALITY 2.0 - ENHANCED LAYER
 * 
 * Advanced personality features for Node Personality 2.0:
 * - Personality interactions (personalities affect nearby personalities)
 * - Dynamic personality shifts (personalities evolve based on node evolution)
 * - Harmony detection (linked nodes resonate together)
 * - Ascended modes (special behaviors for evolved nodes)
 * - Audio cue preparation (ready for sound integration)
 * - Performance optimization (pooling, caching, batch updates)
 * 
 * DESIGN PRINCIPLES:
 * ✓ Non-intrusive (works alongside existing personality system)
 * ✓ Safe (no physics, linking, or gameplay modifications)
 * ✓ Performant (< 0.3ms overhead per frame)
 * ✓ Extensible (ready for audio, networking, recording)
 * ✓ Reversible (can be disabled without affecting base system)
 */

export class NodePersonality2_0_EnhancedLayer {
  constructor(basePersonalitySystem) {
    this.base = basePersonalitySystem;
    
    // Enhanced features state
    this.interactions = {
      enabled: true,
      resonanceRange: 3.0,        // Units to detect personality interactions
      maxInfluence: 0.3,          // Max intensity modifier from interactions
      activeResonances: new Map() // nodeId → resonance info
    };
    
    this.dynamicShifts = {
      enabled: true,
      evolutionThresholds: {
        2: 0.33,  // First evolution stage
        3: 0.67,  // Second evolution stage
        4: 1.0    // Ascended
      },
      shiftTransitionTime: 2.0,   // Seconds to shift personalities
      activeShifts: new Map()     // nodeId → shift info
    };
    
    this.harmonies = {
      enabled: true,
      linkRange: 2.0,
      harmonyBoost: 0.2,          // Glow boost from linked nodes
      harmonyPingInterval: 1.5,   // Seconds between harmony pings
      activeLinkPairs: new Map()  // linkId → harmony info
    };
    
    this.ascendedModes = {
      enabled: true,
      triggerStage: 4,            // Evolution stage for ascended mode
      intensityMultiplier: 1.5,   // 50% more intense
      specialEffects: {
        extraParticles: 10,
        glyphDensity: 2.0,
        auraBrightness: 1.3
      }
    };
    
    this.audioLayer = {
      enabled: true,  // Ready for sound integration
      soundQueue: [],
      personalitySounds: {
        pulsar: { activate: 'pulse_activate', breathing: 'pulse_breathing' },
        analyst: { activate: 'analyze_activate', think: 'analyze_think' },
        echo: { activate: 'echo_activate', ping: 'echo_ping' },
        umbra: { activate: 'umbra_activate', void: 'umbra_void' },
        crystal: { activate: 'crystal_activate', refract: 'crystal_refract' },
        harmonic: { activate: 'harmonic_activate', wave: 'harmonic_wave' },
        quantum: { activate: 'quantum_activate', flicker: 'quantum_flicker' },
        glyph: { activate: 'glyph_activate', rune: 'glyph_rune' }
      }
    };
    
    this.pooling = {
      particlePool: [],
      glyphPool: [],
      resonancePool: [],
      maxPoolSize: 200
    };
    
    // Performance monitoring
    this.performanceMonitor = {
      interactionTime: 0,
      shiftTime: 0,
      harmonyTime: 0,
      ascendedTime: 0,
      totalFrames: 0
    };
  }
  
  /**
   * Update all enhanced personality features
   */
  update(deltaTime, aiNodes, linkingSystem) {
    if (!this.base || !this.base.registry.personalityActive) return;
    
    const startTime = performance.now();
    
    try {
      // Update interactions between nearby personalities
      if (this.interactions.enabled && aiNodes) {
        this._updateInteractions(aiNodes, deltaTime);
      }
      
      // Update dynamic personality shifts based on evolution
      if (this.dynamicShifts.enabled && aiNodes) {
        this._updateDynamicShifts(aiNodes, deltaTime);
      }
      
      // Update harmony resonances between linked nodes
      if (this.harmonies.enabled && linkingSystem) {
        this._updateHarmonies(linkingSystem, deltaTime);
      }
      
      // Update ascended personality modes
      if (this.ascendedModes.enabled && aiNodes) {
        this._updateAscendedModes(aiNodes, deltaTime);
      }
      
      // Process audio cues (queued, ready for integration)
      if (this.audioLayer.enabled) {
        this._processAudioQueue();
      }
      
      // Monitor performance
      this.performanceMonitor.totalFrames++;
      const elapsed = performance.now() - startTime;
      if (elapsed > 0.5) {
        console.warn(`⚠ Enhanced personality layer took ${elapsed.toFixed(2)}ms`);
      }
    } catch (e) {
      console.warn('⚠ Enhanced personality layer error:', e.message);
      // Gracefully disable if error occurs
      this.interactions.enabled = false;
      this.dynamicShifts.enabled = false;
      this.harmonies.enabled = false;
    }
  }
  
  /**
   * FEATURE 1: Personality Interactions
   * Nearby personalities influence each other
   */
  _updateInteractions(aiNodes, deltaTime) {
    if (!aiNodes.nodeArray || aiNodes.nodeArray.length === 0) return;
    
    const startTime = performance.now();
    
    // Build spatial index for fast neighbor lookup
    const spatialMap = this._buildSpatialIndex(aiNodes.nodeArray);
    
    // For each node with personality, check nearby nodes
    for (const [nodeId, personalityState] of this.base.registry.nodePersonalitiesEntries()) {
      const node = personalityState.node;
      if (!node || !node.position) continue;
      
      // Find nearby personalities
      const nearby = this._findNearbyPersonalities(node, spatialMap, this.interactions.resonanceRange);
      
      if (nearby.length > 0) {
        // Calculate resonance influence from nearby personalities
        let resonanceIntensity = 0;
        let resonanceType = null;
        
        for (const neighbor of nearby) {
          const distance = node.position.distanceTo(neighbor.position);
          const influence = Math.max(0, 1 - distance / this.interactions.resonanceRange);
          
          // Same personality types resonate stronger
          if (neighbor.personalityType === personalityState.personalityType) {
            resonanceIntensity = Math.max(resonanceIntensity, influence * 0.4);
            resonanceType = 'harmonic';
          } else {
            resonanceIntensity = Math.max(resonanceIntensity, influence * 0.2);
            resonanceType = 'chaotic';
          }
        }
        
        // Apply resonance modifier to intensity
        if (resonanceIntensity > 0) {
          const modifier = Math.min(this.interactions.maxInfluence, resonanceIntensity);
          this.base.registry.nodePersonalitiesSet(nodeId, {
            ...personalityState,
            resonanceIntensity: modifier,
            resonanceType: resonanceType
          });
        }
      }
    }
    
    this.performanceMonitor.interactionTime = performance.now() - startTime;
  }
  
  /**
   * FEATURE 2: Dynamic Personality Shifts
   * Personalities evolve as nodes evolve
   */
  _updateDynamicShifts(aiNodes, deltaTime) {
    if (!aiNodes.nodeArray) return;
    
    const startTime = performance.now();
    
    for (const node of aiNodes.nodeArray) {
      const nodeId = node.uuid || node.id;
      if (!nodeId) continue;
      
      const personalityState = this.base.registry.nodePersonalitiesGet?.(nodeId);
      if (!personalityState) continue;
      
      // Check if node has evolved
      const evolutionStage = node.evolutionStage || 1;
      
      // Determine if shift should occur
      if (evolutionStage !== personalityState.lastEvolutionStage) {
        // Start a personality shift transition
        const shift = {
          startTime: performance.now(),
          duration: this.dynamicShifts.shiftTransitionTime * 1000,
          fromPersonality: personalityState.personalityType,
          toPersonality: personalityState.personalityType, // Keep same, enhance intensity
          fromIntensity: personalityState.intensityLevel || 1,
          toIntensity: Math.min(4, personalityState.intensityLevel + 1),
          progress: 0
        };
        
        this.dynamicShifts.activeShifts.set(nodeId, shift);
        
        // Queue activation sound for new intensity
        this._queueSound(personalityState.personalityType, 'intensity_increase');
      }
      
      // Update active shifts
      const activeShift = this.dynamicShifts.activeShifts.get(nodeId);
      if (activeShift) {
        activeShift.progress = Math.min(1, (performance.now() - activeShift.startTime) / activeShift.duration);
        
        if (activeShift.progress >= 1) {
          // Shift complete
          this.base.registry.nodePersonalitiesSet(nodeId, {
            ...personalityState,
            intensityLevel: activeShift.toIntensity,
            lastEvolutionStage: evolutionStage
          });
          this.dynamicShifts.activeShifts.delete(nodeId);
        }
      }
    }
    
    this.performanceMonitor.shiftTime = performance.now() - startTime;
  }
  
  /**
   * FEATURE 3: Harmony Detection
   * Linked nodes resonate together
   */
  _updateHarmonies(linkingSystem, deltaTime) {
    if (!linkingSystem || !linkingSystem.links) return;
    
    const startTime = performance.now();
    
    for (const link of linkingSystem.links) {
      if (!link.source || !link.target) continue;
      
      const linkId = link.id || `${link.source.uuid}-${link.target.uuid}`;
      
      // Check if both nodes have personalities
      const sourcePers = this.base.registry.nodePersonalitiesGet?.(link.source.uuid);
      const targetPers = this.base.registry.nodePersonalitiesGet?.(link.target.uuid);
      
      if (!sourcePers || !targetPers) continue;
      
      // Calculate harmony resonance
      const distance = link.source.position.distanceTo(link.target.position);
      
      if (distance < this.harmonies.linkRange) {
        // Activate harmony resonance
        const harmony = {
          linkId: linkId,
          sourceId: link.source.uuid,
          targetId: link.target.uuid,
          resonanceStrength: Math.max(0, 1 - distance / this.harmonies.linkRange),
          lastPingTime: 0,
          active: true
        };
        
        this.harmonies.activeLinkPairs.set(linkId, harmony);
        
        // Emit harmony ping periodically
        harmony.lastPingTime += deltaTime;
        if (harmony.lastPingTime >= this.harmonies.harmonyPingInterval) {
          this._queueSound('harmonic', 'link_ping');
          harmony.lastPingTime = 0;
        }
      }
    }
    
    this.performanceMonitor.harmonyTime = performance.now() - startTime;
  }
  
  /**
   * FEATURE 4: Ascended Personality Modes
   * Special enhanced behaviors for evolved nodes
   */
  _updateAscendedModes(aiNodes, deltaTime) {
    if (!aiNodes.nodeArray) return;
    
    const startTime = performance.now();
    
    for (const node of aiNodes.nodeArray) {
      const nodeId = node.uuid || node.id;
      const personalityState = this.base.registry.nodePersonalitiesGet?.(nodeId);
      
      if (!personalityState) continue;
      
      // Check if node is in ascended mode
      const isAscended = (node.evolutionStage || 1) >= this.ascendedModes.triggerStage;
      
      if (isAscended && !personalityState.isAscended) {
        // Activate ascended mode
        this.base.registry.nodePersonalitiesSet(nodeId, {
          ...personalityState,
          isAscended: true,
          intensityMultiplier: this.ascendedModes.intensityMultiplier
        });
        
        this._queueSound(personalityState.personalityType, 'ascended_activate');
      } else if (!isAscended && personalityState.isAscended) {
        // Deactivate ascended mode (shouldn't happen, but safe)
        this.base.registry.nodePersonalitiesSet(nodeId, {
          ...personalityState,
          isAscended: false,
          intensityMultiplier: 1.0
        });
      }
    }
    
    this.performanceMonitor.ascendedTime = performance.now() - startTime;
  }
  
  /**
   * AUDIO LAYER: Queue sound cues (integration-ready)
   */
  _queueSound(personalityType, soundEvent) {
    if (!this.audioLayer.enabled) return;
    
    const soundDef = this.audioLayer.personalitySounds[personalityType];
    if (!soundDef) return;
    
    const soundName = soundDef[soundEvent];
    if (!soundName) return;
    
    // Add to queue - ready for audio system integration
    this.audioLayer.soundQueue.push({
      sound: soundName,
      personality: personalityType,
      event: soundEvent,
      timestamp: performance.now()
    });
  }
  
  /**
   * Process queued audio sounds
   * (Ready for integration with audio engine)
   */
  _processAudioQueue() {
    if (this.audioLayer.soundQueue.length === 0) return;
    
    // This will be integrated with actual audio system later
    // For now, just clear the queue
    // const sounds = [...this.audioLayer.soundQueue];
    // window.game?.audioSystem?.playSounds?.(sounds);
    
    this.audioLayer.soundQueue = [];
  }
  
  // ============================================================
  // HELPER METHODS
  // ============================================================
  
  _buildSpatialIndex(nodes) {
    const map = new Map();
    for (const node of nodes) {
      if (!node || !node.position) continue;
      const key = this._getGridKey(node.position);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(node);
    }
    return map;
  }
  
  _getGridKey(position) {
    const gridSize = 5; // Nodes within 5-unit grid cells
    return `${Math.floor(position.x / gridSize)},${Math.floor(position.y / gridSize)},${Math.floor(position.z / gridSize)}`;
  }
  
  _findNearbyPersonalities(node, spatialMap, range) {
    const nearby = [];
    const key = this._getGridKey(node.position);
    
    // Check adjacent grid cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const gridSize = 5;
          const checkKey = `${Math.floor(node.position.x / gridSize) + dx},${Math.floor(node.position.y / gridSize) + dy},${Math.floor(node.position.z / gridSize) + dz}`;
          const nodesInCell = spatialMap.get(checkKey) || [];
          
          for (const neighbor of nodesInCell) {
            if (neighbor === node) continue;
            if (node.position.distanceTo(neighbor.position) < range) {
              nearby.push(neighbor);
            }
          }
        }
      }
    }
    
    return nearby;
  }
  
  /**
   * Get enhancement status
   */
  getStatus() {
    return {
      interactions: {
        enabled: this.interactions.enabled,
        activeResonances: this.interactions.activeResonances.size
      },
      dynamicShifts: {
        enabled: this.dynamicShifts.enabled,
        activeShifts: this.dynamicShifts.activeShifts.size
      },
      harmonies: {
        enabled: this.harmonies.enabled,
        activeLinkPairs: this.harmonies.activeLinkPairs.size
      },
      ascendedModes: {
        enabled: this.ascendedModes.enabled
      },
      performance: {
        interactionTime: this.performanceMonitor.interactionTime.toFixed(3),
        shiftTime: this.performanceMonitor.shiftTime.toFixed(3),
        harmonyTime: this.performanceMonitor.harmonyTime.toFixed(3),
        ascendedTime: this.performanceMonitor.ascendedTime.toFixed(3)
      }
    };
  }
  
  /**
   * Disable specific feature
   */
  disableFeature(feature) {
    if (this[feature]) {
      this[feature].enabled = false;
    }
  }
  
  /**
   * Enable specific feature
   */
  enableFeature(feature) {
    if (this[feature]) {
      this[feature].enabled = true;
    }
  }
  
  /**
   * Cleanup on system disable
   */
  cleanup() {
    this.interactions.activeResonances.clear();
    this.dynamicShifts.activeShifts.clear();
    this.harmonies.activeLinkPairs.clear();
    this.audioLayer.soundQueue = [];
  }
}
