/**
 * NodeSynergyIntegration1_0 - Automatic Synergy System Integration
 * 
 * Seamlessly integrates all synergy systems into NodeLinkingSystem:
 * - SynergyVFX1_0 (visual effects)
 * - SynergyHighways1_0 (arc ribbons)
 * - LinkCorrelationEngine1_0 (optional - pairwise analysis)
 * - LinkRecommendationAI1_0 (optional - AI suggestions)
 * - PriorityHistoryEngine1_0 (optional - temporal analytics)
 * 
 * Features:
 * - Fully automatic, non-invasive integration
 * - 100% null-safe with graceful fallbacks
 * - No modifications to existing NodeLinkingSystem flow
 * - Single hook point: handleSynergy(link)
 * - Backward compatible
 * - All effects self-optimizing
 * 
 * Integration Pattern:
 * After link.traffic and link.priority updates complete, call:
 *   this.handleSynergy(link);
 * 
 * This triggers:
 * 1. Synergy score computation
 * 2. Visual effect updates (glow, trails, auras)
 * 3. Highway rendering/culling
 * 4. Correlation analysis
 * 5. AI recommendation logic
 * 6. Temporal history tracking
 */

import * as THREE from 'three';

export class NodeSynergyIntegration1_0 {
  constructor(nodeLinkingSystem, scene, camera) {
    this.nodeLinker = nodeLinkingSystem;
    this.scene = scene;
    this.camera = camera;
    
    // Reference to synergy systems (set externally after init)
    this.synergyVFX = null;
    this.synergyHighways = null;
    this.correlationEngine = null;
    this.recommendationAI = null;
    this.priorityHistory = null;
    
    // Configuration
    this.config = {
      // Visibility thresholds
      auraThreshold: 0.4,        // Show node auras
      highwayThreshold: 0.7,     // Show highways
      burthreshold: 0.85,        // Trigger burst effect
      sharpIncreaseThreshold: 0.3, // Synergy rise for burst
      
      // Color palette for auto-coloring bursts
      burstColors: [
        "#44EEFF", "#FF44FF", "#44FF44", "#FFAA00",
        "#FF4444", "#44FFFF", "#AA44FF", "#FFFF44"
      ],
      
      // Update frequency throttling
      correlationUpdateFreq: 10,    // Every 10 frames
      recommendationUpdateFreq: 30, // Every 30 frames
      
      // Enable/disable subsystems
      enableVFX: true,
      enableHighways: true,
      enableCorrelation: false,     // Optional
      enableRecommendations: false, // Optional
      enableHistory: false,         // Optional
    };
    
    // Internal state
    this._frameCounter = 0;
    this._burstColors = new Map(); // linkId → last burst color
    this._synergySamples = new Map(); // linkId → { current, previous }
  }
  
  /**
   * Attach synergy systems to integration
   * Call this after systems are initialized
   */
  attachSynergyVFX(synergyVFX) {
    this.synergyVFX = synergyVFX;
  }
  
  attachSynergyHighways(synergyHighways) {
    this.synergyHighways = synergyHighways;
  }
  
  attachCorrelationEngine(correlationEngine) {
    this.correlationEngine = correlationEngine;
  }
  
  attachRecommendationAI(recommendationAI) {
    this.recommendationAI = recommendationAI;
  }
  
  attachPriorityHistory(priorityHistory) {
    this.priorityHistory = priorityHistory;
  }
  
  /**
   * Main integration hook - call after link updates
   * This is the single point of integration into NodeLinkingSystem.updateLinkCurve()
   * 
   * Called when:
   * - Link is newly created
   * - Link positions update
   * - Link priority/traffic changes
   * 
   * @param {Object} link - Link object with source, target, traffic, priority
   */
  handleSynergy(link) {
    if (!link || !link.source || !link.target) {
      return; // Silent fail - link is invalid
    }
    
    try {
      // ═══════════════════════════════════════════════════════════════════════
      // STEP 0: ComputeSynergyScore 2.0 Integration
      // Hybrid AI-driven scoring with 5 components (type, priority, traffic, decay, topology)
      // ═══════════════════════════════════════════════════════════════════════
      if (window.ComputeSynergyScore2_0) {
        try {
          const hybridScore = window.ComputeSynergyScore2_0(link, {
            linkingSystem: this.nodeLinker,
            correlationEngine: this.correlationEngine,
            priorityHistoryEngine: this.priorityHistory,
            priorityDecayEngine: this.priorityDecayEngine
          });
          
          // Store comprehensive synergy data on link
          link['synergyScore'] = hybridScore;

          link['synergyTier'] = hybridScore.tier;
          
          // Debug logging if enabled
          if (window.game?.synergyDebug?.enabled) {
            console.log(`[SynergyIntegration] ${link.id || 'unknown'}: ${hybridScore.tier.toUpperCase()} (${hybridScore.score.toFixed(3)})`);
          }
        } catch (e) {
          console.error('[SynergyIntegration] ComputeSynergyScore2_0 error:', e);
        }
      }
      
      // Step 1: Calculate synergy score (0-1)
      const synergy = this.computeSynergyScore(link);
      
      // Step 2: Track previous synergy for change detection
      const linkId = this.getLinkId(link);
      const previous = this._synergySamples.get(linkId) || { current: 0, previous: 0 };
      const synergyDelta = synergy - previous.current;
      
      this._synergySamples.set(linkId, {
        current: synergy,
        previous: previous.current,
        timestamp: Date.now(),
        delta: synergyDelta
      });
      
      // Step 3: Update SynergyVFX
      if (this.config.enableVFX && this.synergyVFX) {
        this.updateSynergyVFX(link, linkId, synergy, synergyDelta);
      }
      
      // Step 4: Update SynergyHighways
      if (this.config.enableHighways && this.synergyHighways) {
        this.updateSynergyHighways(link, linkId, synergy);
      }
      
      // Step 5: Update correlation analysis (throttled)
      if (this.config.enableCorrelation && this.correlationEngine && this._frameCounter % this.config.correlationUpdateFreq === 0) {
        this.updateCorrelationEngine(link, synergy);
      }
      
      // Step 6: Update recommendation AI (throttled)
      if (this.config.enableRecommendations && this.recommendationAI && this._frameCounter % this.config.recommendationUpdateFreq === 0) {
        this.updateRecommendationAI(link, synergy);
      }
      
      // Step 7: Update priority history (throttled)
      if (this.config.enableHistory && this.priorityHistory && this._frameCounter % 5 === 0) {
        this.updatePriorityHistory(link, synergy);
      }
      
      this._frameCounter++;
    } catch (e) {
      // Graceful error handling - system continues regardless
      console.error('[NodeSynergyIntegration] Error in handleSynergy:', e);
    }
  }
  
  /**
   * Compute synergy score for a link
   * Factors:
   * - Node type compatibility
   * - Category affinity
   * - Current traffic/priority
   * - Distance (closer = higher synergy)
   * 
   * @private
   * @returns {number} 0-1 synergy strength
   */
  computeSynergyScore(link) {
    try {
      let synergy = 0;
      
      // Factor 1: Node type compatibility (strong pairs)
      const sourceCategory = link.source.userData?.category || 'unknown';
      const targetCategory = link.target.userData?.category || 'unknown';
      
      const strongPairs = [
        ['input', 'process'],
        ['process', 'integration'],
        ['integration', 'storage'],
        ['storage', 'control'],
        ['analytics', 'control'],
        ['control', 'process']
      ];
      
      const isPair = strongPairs.some(pair =>
        (sourceCategory === pair[0] && targetCategory === pair[1]) ||
        (sourceCategory === pair[1] && targetCategory === pair[0])
      );
      
      if (isPair) {
        synergy += 0.35;
      } else if (sourceCategory === targetCategory) {
        synergy += 0.15; // Same category = weak synergy
      }
      
      // Factor 2: Priority/traffic (active = higher synergy)
      const priority = link.traffic?.priority || 0.5;
      synergy += priority * 0.3;
      
      // Factor 3: Distance (closer = higher synergy)
      const distance = link.source.position.distanceTo(link.target.position);
      const maxDistance = 100; // World scale
      const distanceFactor = Math.max(0, 1 - distance / maxDistance);
      synergy += distanceFactor * 0.2;
      
      // Factor 4: Historical patterns (if available)
      if (link.traffic?.throughput !== undefined) {
        synergy += Math.min(link.traffic.throughput, 0.15);
      }
      
      // Clamp to 0-1
      return Math.max(0, Math.min(1, synergy));
    } catch (e) {
      // Default safe value on error
      return 0.5;
    }
  }
  
  /**
   * Update SynergyVFX with automatic effects
   * @private
   */
  updateSynergyVFX(link, linkId, synergy, delta) {
    try {
      const vfx = this.synergyVFX;
      if (!vfx) return;
      
      // Register if not already registered
      if (!vfx.linkData.has(linkId)) {
        vfx.registerLink(link, linkId);
      }
      if (!vfx.nodeAuras.has(link.source.id)) {
        vfx.registerNode(link.source, link.source.id);
      }
      if (!vfx.nodeAuras.has(link.target.id)) {
        vfx.registerNode(link.target, link.target.id);
      }
      
      // Update glow pulse layer (always)
      vfx.updateLink(link, linkId, synergy);
      
      // Update node auras (if synergy > threshold)
      if (synergy > this.config.auraThreshold) {
        vfx.updateNodeAura(link.source, link.source.id, synergy);
        vfx.updateNodeAura(link.target, link.target.id, synergy);
      } else {
        vfx.updateNodeAura(link.source, link.source.id, 0);
        vfx.updateNodeAura(link.target, link.target.id, 0);
      }
      
      // Trigger effects on synergy changes
      if (delta > this.config.sharpIncreaseThreshold) {
        // Sharp increase = burst effect
        const colorIdx = (linkId.charCodeAt(0) + linkId.charCodeAt(linkId.length - 1)) % this.config.burstColors.length;
        const burstColor = this.config.burstColors[colorIdx];
        vfx.triggerBurst(link, burstColor);
      }
    } catch (e) {
      console.error('[NodeSynergyIntegration] Error updating VFX:', e);
    }
  }
  
  /**
   * Update SynergyHighways with automatic rendering
   * @private
   */
  updateSynergyHighways(link, linkId, synergy) {
    try {
      const highways = this.synergyHighways;
      if (!highways) return;
      
      // Register if not already registered
      if (!highways.highways.has(linkId)) {
        highways.registerLink(link, linkId);
      }
      
      // Update highway (will auto-show/hide based on threshold)
      highways.updateLink(link, linkId, synergy);
    } catch (e) {
      console.error('[NodeSynergyIntegration] Error updating highways:', e);
    }
  }
  
  /**
   * Update correlation analysis engine
   * @private
   */
  updateCorrelationEngine(link, synergy) {
    try {
      const engine = this.correlationEngine;
      if (!engine || !engine.analyze) return;
      
      // Analyze link synergy relationship
      engine.analyze({
        link,
        synergy,
        sourceCategory: link.source.userData?.category,
        targetCategory: link.target.userData?.category,
        priority: link.traffic?.priority || 0.5,
        load: link.traffic?.load || 0,
      });
    } catch (e) {
      // Silent fail - optional subsystem
    }
  }
  
  /**
   * Update recommendation AI
   * @private
   */
  updateRecommendationAI(link, synergy) {
    try {
      const ai = this.recommendationAI;
      if (!ai || !ai.observe) return;
      
      // Very high synergy = AI pays attention
      if (synergy > 0.8) {
        ai.observe({
          link,
          synergy,
          sourceCategory: link.source.userData?.category,
          targetCategory: link.target.userData?.category,
        });
      }
    } catch (e) {
      // Silent fail - optional subsystem
    }
  }
  
  /**
   * Update priority history tracking
   * @private
   */
  updatePriorityHistory(link, synergy) {
    try {
      const history = this.priorityHistory;
      if (!history || !history.recordSample) return;
      
      history.recordSample({
        linkId: this.getLinkId(link),
        synergy,
        priority: link.traffic?.priority || 0.5,
        load: link.traffic?.load || 0,
        timestamp: Date.now(),
      });
    } catch (e) {
      // Silent fail - optional subsystem
    }
  }
  
  /**
   * Get unique link ID
   * @private
   */
  getLinkId(link) {
    if (!link) return 'unknown';
    
    const sourceId = link.source?.id ?? link.source?.userData?.id ?? 0;
    const targetId = link.target?.id ?? link.target?.userData?.id ?? 0;
    
    return `${sourceId}-${targetId}`;
  }
  
  /**
   * Update loop - call every frame
   * Handles animation updates for all synergy systems
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    try {
      if (this.synergyVFX) {
        this.synergyVFX.update(deltaTime);
      }
      if (this.synergyHighways) {
        this.synergyHighways.update(deltaTime);
      }
    } catch (e) {
      console.error('[NodeSynergyIntegration] Error in update:', e);
    }
  }
  
  /**
   * Setup console API for debugging and adjustment
   */
  setupConsoleAPI() {
    if (typeof window === 'undefined') return;
    
    if (!window.game) window.game = {};
    
    window.game.synergyIntegration = {
      getConfig: () => this.config,
      setConfig: (key, value) => {
        if (key in this.config) {
          this.config[key] = value;
          console.log(`[SynergyIntegration] ${key} = ${value}`);
        } else {
          console.warn(`[SynergyIntegration] Unknown config key: ${key}`);
        }
      },
      getStatus: () => ({
        vfx: this.synergyVFX ? 'active' : 'inactive',
        highways: this.synergyHighways ? 'active' : 'inactive',
        correlation: this.correlationEngine ? 'active' : 'inactive',
        recommendations: this.recommendationAI ? 'active' : 'inactive',
        history: this.priorityHistory ? 'active' : 'inactive',
      }),
    };
  }
  
  /**
   * Cleanup on disposal
   */
  dispose() {
    try {
      this._synergySamples.clear();
      this._burstColors.clear();
    } catch (e) {
      console.error('[NodeSynergyIntegration] Error during dispose:', e);
    }
  }
}
