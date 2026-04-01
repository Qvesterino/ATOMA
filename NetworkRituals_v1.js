/**
 * NETWORK RITUALS SYSTEM v1.0 — PHASE 8: COOPERATIVE MASS RECONSTRUCTION
 * 
 * Sophisticated system for coordinated group-level link restoration through synchronized rituals.
 * Enables emergent cooperation where multiple actors work together to rebuild massive network segments.
 * 
 * CORE MECHANICS:
 * - Ritual Initiation: One player declares a ritual affecting a network cluster (3+ linked nodes)
 * - Participant Resonance: Other nodes/players sync with ritual frequency for resource contribution
 * - Shared Pool Economy: Harmony and Synergy combine into ritual pool for mass reconstruction
 * - Progressive Stages: Rituals progress through channeling → resonance → resolution phases
 * - Cascade Reconstruction: Successful rituals trigger cascading link rebuilds in vicinity
 * - Loyalty Bonuses: Participants gain reputation multipliers for future ritual participation
 * 
 * ECONOMIC FRAMEWORK:
 * - Base Cost: -0.15 harmony per participant per ritual (vs. -0.1 per single barrier)
 * - Escalation: Each additional ritual in same cluster increases cost 12% (encourages pacing)
 * - Synergy Pool: Each participant contributes 8 synergy to shared reconstruction budget
 * - Loyalty Mechanic: Repeat participants reduce costs by 3% per previous ritual (up to 25% discount)
 * - Breakage Risk: Failed rituals consume 60% of pooled resources before attempting rebuild
 * 
 * VISUAL INTEGRATION:
 * - Ritual Node Glow: Initiator pulses with ritual frequency (~2-3 Hz)
 * - Resonance Links: Participant connections brighten and synchronize with ritual pulse
 * - Cascade Wave: Successful resolution triggers expanding wave of reconstruction energy
 * - Loyalty Aura: Repeat participants glow with increasing color shifts (gold/platinum)
 * - Failure State: Cascade collapse with energy dispersal VFX if ritual fails
 * 
 * STRATEGIC DEPTH:
 * - Cluster Size Scaling: Larger clusters enable bigger bonuses but increase failure risk
 * - Resource Hoarding: Storing excess harmony/synergy enables larger rituals
 * - Timing Windows: Rituals must complete within 30-60 seconds (real time)
 * - Risk-Reward: Harder rituals on higher-corruption links yield better loyalty gains
 * - Anti-Spam: Maximum 3 rituals per 2-minute period across entire network
 * 
 * INTEGRATION POINTS:
 * - LinkCorruptionTransmission_v1: Source of truth for link state, corruption, integrity
 * - ArchetypeGameplayEffects_v1: Archetype bonuses/penalties to ritual success rates
 * - CorruptionVisualFX_v1: Reuses cascade and healing VFX for ritual resolution
 * - ComputeSynergyScore_v1: Synergy computation for participant eligibility
 * - AINodes.js: AI node behaviors during rituals (automatic participation thresholds)
 * 
 * API EXAMPLES:
 * 
 *   // Initiate a cooperative ritual on a cluster of nodes
 *   const ritual = networkRituals.initiateRitual(epicenterNode, [node1, node2, node3]);
 *   // Returns: { id, stage, totalCost, participantCount, estimatedDuration }
 * 
 *   // Add a participant to an ongoing ritual
 *   networkRituals.addParticipant(ritualId, newParticipantNode);
 * 
 *   // Get ritual status and progress
 *   const status = networkRituals.getRitualStatus(ritualId);
 *   // Returns: { stage, progress, pooledResources, participantList, timeRemaining }
 * 
 *   // Cancel ritual (recovers 80% of invested resources)
 *   networkRituals.cancelRitual(ritualId);
 * 
 *   // Query ritual statistics and loyalty tracking
 *   const stats = networkRituals.getParticipantStats(nodeId);
 *   // Returns: { ritualsCompleted, totalResourcesContributed, currentLoyaltyBonus, upcomingDiscounts }
 */

let THREE_SAFE = null;
THREE_SAFE =
  (typeof window !== 'undefined' && window.THREE) ||
  (typeof globalThis !== 'undefined' && globalThis.THREE) ||
  null;

const THREE = THREE_SAFE;

/**
 * Phase 8 configuration constants
 */
const RITUAL_CONFIG = {
  ENABLED: true,                          // Master enable/disable
  
  // Base costs and scaling
  BASE_HARMONY_COST_PER_PARTICIPANT: 0.15,  // Slightly higher than barrier to reflect group overhead
  BASE_SYNERGY_CONTRIBUTION: 8,             // Synergy per participant to ritual pool
  ESCALATION_MULTIPLIER_PER_RITUAL: 0.12,   // Cost increases 12% for each ritual in cluster
  
  // Loyalty mechanics
  LOYALTY_DISCOUNT_PER_RITUAL: 0.03,        // 3% discount per previous participation
  MAX_LOYALTY_DISCOUNT: 0.25,               // Cap at 25% discount
  LOYALTY_BONUS_FOR_DIFFICULT: 0.02,        // Bonus loyalty per 0.1 corruption on rebuilt links
  
  // Ritual timing and constraints
  RITUAL_STAGE_DURATION_MS: {
    channeling: 8000,                       // Time to gather initial resonance
    resonance: 12000,                       // Time during which participants synchronize
    resolution: 4000                        // Time for actual reconstruction cascade
  },
  TOTAL_RITUAL_DURATION_MS: 24000,          // ~24 seconds total per ritual
  
  MAX_RITUALS_PER_PERIOD: 3,                // Max 3 rituals per...
  RITUAL_PERIOD_MS: 120000,                 // ...120 seconds (2 minutes)
  
  // Failure mechanics
  FAILURE_RESOURCE_LOSS: 0.60,              // Lose 60% of pool if ritual fails
  MINIMUM_PARTICIPANTS: 2,                  // Minimum participants to attempt ritual
  CLUSTER_LINK_REQUIREMENT: 3,              // Minimum 3 links in ritual cluster
  
  // Cascade reconstruction
  CASCADE_RADIUS_HOPS: 2,                   // Reconstruction spreads up to 2 hops from ritual nodes
  SECONDARY_REBUILD_COST_MULTIPLIER: 0.5,   // Secondary rebuilds (cascade) cost 50% normal
  CASCADE_RECONSTRUCTION_THRESHOLD: 0.85,   // Only rebuild links with ≥85% integrity gained
  
  // Anti-spam and safety
  COOLDOWN_AFTER_FAILURE_MS: 30000,         // 30 second cooldown after failed ritual
  SAME_CLUSTER_COOLDOWN_MS: 45000,          // Can't ritual same cluster again for 45 seconds
};

/**
 * Ritual stage enumeration
 */
const RITUAL_STAGES = {
  INITIALIZING: 'initializing',
  CHANNELING: 'channeling',               // Phase 1: Gathering resonance
  RESONANCE: 'resonance',                 // Phase 2: Participants synchronizing
  RESOLUTION: 'resolution',               // Phase 3: Cascade reconstruction
  COMPLETE: 'complete',                   // Success
  FAILED: 'failed',                       // Failure
  CANCELLED: 'cancelled'                  // User cancellation
};

/**
 * NetworkRituals v1.0 — Core implementation
 */
class NetworkRituals {
  constructor(corruptionSystem, gameplaySystem) {
    this.corruptionSystem = corruptionSystem;
    this.gameplaySystem = gameplaySystem;
    this.listeners = new Map();
    
    // Active rituals by ID
    this.rituals = new Map();
    this.ritualIdCounter = 0;
    
    // Loyalty tracking: nodeId → { ritualsCompleted, resourcesContributed, loyaltyBonus }
    this.participantLoyalty = new Map();
    
    // Ritual history for cooldown tracking: clusterId → { timestamp, stage, success }
    this.ritualHistory = new Map();
    
    // Ritual timing: clusterId → { lastRitualTime, ritualCount, period }
    this.clusterCooldowns = new Map();
    
    // Recent rituals for anti-spam: array of { timestamp, clusterId }
    this.recentRituals = [];
    
    // Debug logging
    this.debugMode = true;
    
    // Event tracking for analysis
    this.eventLog = [];
    this.maxEventLog = 500;
  }

  _getNodeId(node) {
    return node?.userData?.nodeId || node?.id || node?.uuid || null;
  }

  _getLinkId(link) {
    return link?.id || link?.userData?.linkId || `${link?.source?.id || 'unknown'}-${link?.target?.id || 'unknown'}`;
  }

  _ensureLinkState(link) {
    if (!link || !this.corruptionSystem) return null;

    const linkId = this._getLinkId(link);
    if (!linkId) return null;

    if (typeof this.corruptionSystem.initializeLink === 'function') {
      try {
        this.corruptionSystem.initializeLink(link);
      } catch (err) {
        console.warn('[Phase 8 Ritual] initializeLink failed for', linkId, err);
      }
    }

    const corruptionData = this.corruptionSystem.linkCorruption?.get?.(linkId) || null;
    const integrityData = this.corruptionSystem.linkIntegrity?.get?.(linkId) || null;

    return { linkId, corruptionData, integrityData };
  }

  _getLinkRuntimeState(link) {
    const state = this._ensureLinkState(link);
    if (!state) return null;

    const corruptionLevel = Number(state.corruptionData?.level ?? link?.userData?.corruptionLevel ?? 0);
    const integrityRaw = Number(state.integrityData?.integrity ?? 100);
    const normalizedIntegrity = integrityRaw > 1 ? integrityRaw / 100 : integrityRaw;
    const collapsed = state.integrityData?.state === 'collapsed' || this.corruptionSystem?.collapsedLinks?.has?.(state.linkId) === true;

    return {
      linkId: state.linkId,
      corruptionLevel: Math.max(0, Math.min(1, corruptionLevel)),
      integrity: Math.max(0, Math.min(100, integrityRaw)),
      normalizedIntegrity: Math.max(0, Math.min(1, normalizedIntegrity)),
      state: state.integrityData?.state || (collapsed ? 'collapsed' : 'healthy'),
      collapsed,
      corruptionData: state.corruptionData,
      integrityData: state.integrityData,
    };
  }

  _syncLinkUserData(link, runtimeState) {
    if (!link) return;
    if (!link.userData) link.userData = {};
    if (!link.userData.visualState) link.userData.visualState = {};

    if (runtimeState) {
      link.userData.corruptionLevel = runtimeState.corruptionLevel;
      link.userData.integrity = runtimeState.integrity;
      link.userData.integrityState = runtimeState.state;

      link.userData.visualState.corruptionLevel = runtimeState.corruptionLevel;
      link.userData.visualState.integrity = runtimeState.normalizedIntegrity;
      link.userData.visualState.integrityState = runtimeState.state;
      link.userData.visualState.updatedAt = Date.now();
    }
  }

  _deriveIntegrityState(integrity) {
    if (integrity <= 8) return 'collapsed';
    if (integrity <= 15) return 'unstable';
    return 'healthy';
  }

  on(eventName, handler) {
    if (!eventName || typeof handler !== 'function') return () => {};

    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    this.listeners.get(eventName).add(handler);
    return () => this.off(eventName, handler);
  }

  off(eventName, handler) {
    const handlers = this.listeners.get(eventName);
    if (!handlers) return;

    handlers.delete(handler);
    if (handlers.size === 0) {
      this.listeners.delete(eventName);
    }
  }

  getActiveRituals() {
    return Array.from(this.rituals.values()).filter((ritual) =>
      ritual.stage !== RITUAL_STAGES.COMPLETE &&
      ritual.stage !== RITUAL_STAGES.FAILED &&
      ritual.stage !== RITUAL_STAGES.CANCELLED
    );
  }

  /**
   * Initiate a cooperative ritual on a network cluster
   * 
   * @param {Object} epicenterNode - Central node initiating ritual
   * @param {Array<Object>} participants - Array of participating nodes
   * @returns {Object} Ritual initialization result
   */
  initiateRitual(epicenterNode, participants) {
    if (!RITUAL_CONFIG.ENABLED) {
      return { success: false, reason: 'Phase 8 rituals disabled' };
    }

    if (!epicenterNode) {
      return { success: false, reason: 'No epicenter node provided' };
    }

    if (!participants || participants.length < RITUAL_CONFIG.MINIMUM_PARTICIPANTS - 1) {
      return {
        success: false,
        reason: `Need at least ${RITUAL_CONFIG.MINIMUM_PARTICIPANTS - 1} additional participants (plus epicenter = ${RITUAL_CONFIG.MINIMUM_PARTICIPANTS} total)`
      };
    }

    // Verify all participants have sufficient resources
    const allNodes = [epicenterNode, ...participants];
    const resourceCheck = this._checkResourcesForParticipants(allNodes);
    if (!resourceCheck.success) {
      return { success: false, reason: resourceCheck.reason };
    }

    // Build cluster ID to check cooldowns
    const clusterId = this._computeClusterId(allNodes);
    const cooldownCheck = this._checkRitualCooldowns(clusterId);
    if (!cooldownCheck.allowed) {
      return {
        success: false,
        reason: `Ritual cooldown active. Next ritual available in ${cooldownCheck.timeRemaining}ms`,
        timeRemaining: cooldownCheck.timeRemaining
      };
    }

    // Compute costs and loyalty bonuses
    const costBreakdown = this._computeRitualCosts(allNodes, clusterId);
    const loyaltyAdjustments = this._computeLoyaltyAdjustments(allNodes);

    // Create ritual object
    const ritualId = `ritual_${++this.ritualIdCounter}_${Date.now()}`;
    const ritual = {
      id: ritualId,
      type: 'network_reconstruction',
      epicenter: epicenterNode,
      participants: allNodes,
      clusterId,
      stage: RITUAL_STAGES.INITIALIZING,
      progress: 0,
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
      
      // Economics
      costs: costBreakdown,
      loyaltyAdjustments,
      pooledResources: {
        harmony: costBreakdown.totalHarmonyCost,
        synergy: 0
      },
      
      // Timing
      stageDurations: RITUAL_CONFIG.RITUAL_STAGE_DURATION_MS,
      totalDurationMs: RITUAL_CONFIG.TOTAL_RITUAL_DURATION_MS,
      duration: RITUAL_CONFIG.TOTAL_RITUAL_DURATION_MS,
      currentStageDuration: 0,
      stageStartTime: null,
      
      // Cascade reconstruction tracking
      cascadeReconstructions: [],
      
      // State tracking
      failed: false,
      failureReason: null,
      cancelled: false,
      
      // Visual state
      resonanceFrequency: 2.0 + Math.random() * 1.5  // 2-3.5 Hz base
    };

    // Deduct resources from all participants
    this._deductRitualCosts(allNodes, costBreakdown, loyaltyAdjustments);

    // Pool synergy contributions
    for (const node of allNodes) {
      ritual.pooledResources.synergy += RITUAL_CONFIG.BASE_SYNERGY_CONTRIBUTION;
    }

    // Register ritual
    this.rituals.set(ritualId, ritual);

    // Log event
    this._logEvent('RITUAL_INITIATED', {
      ritualId,
      epicenter: epicenterNode.id,
      participantCount: allNodes.length,
      harmonyPool: costBreakdown.totalHarmonyCost,
      synergyPool: ritual.pooledResources.synergy,
      clusterId
    });

    this._debugLog('Ritual Initiated', {
      ritualId,
      participants: allNodes.length,
      harmonyPool: ritual.pooledResources.harmony.toFixed(2),
      synergyPool: ritual.pooledResources.synergy.toFixed(0),
      duration: RITUAL_CONFIG.TOTAL_RITUAL_DURATION_MS
    });

    // Transition to CHANNELING immediately
    this._transitionRitualStage(ritualId, RITUAL_STAGES.CHANNELING);
    this._emitLifecycleEvent('ritual:start', ritual, { success: true });

    return {
      success: true,
      ritualId,
      stage: ritual.stage,
      epicenter: epicenterNode.id,
      participantCount: allNodes.length,
      harmonyPool: ritual.pooledResources.harmony,
      synergyPool: ritual.pooledResources.synergy,
      estimatedDuration: RITUAL_CONFIG.TOTAL_RITUAL_DURATION_MS,
      costs: costBreakdown
    };
  }

  /**
   * Add a participant to an ongoing ritual (late joining)
   * 
   * @param {string} ritualId - Ritual ID
   * @param {Object} newParticipant - Node to add as participant
   * @returns {Object} Add result
   */
  addParticipant(ritualId, newParticipant) {
    const ritual = this.rituals.get(ritualId);
    if (!ritual) {
      return { success: false, reason: 'Ritual not found' };
    }

    if (ritual.stage !== RITUAL_STAGES.CHANNELING && ritual.stage !== RITUAL_STAGES.RESONANCE) {
      return { success: false, reason: `Cannot join ritual in ${ritual.stage} stage` };
    }

    // Check if already participant
    if (ritual.participants.some(p => p.id === newParticipant.id)) {
      return { success: false, reason: 'Already a participant' };
    }

    // Check resources
    const harmonyCost = RITUAL_CONFIG.BASE_HARMONY_COST_PER_PARTICIPANT;
    if (!newParticipant.userData?.harmonyLevel || newParticipant.userData.harmonyLevel < harmonyCost) {
      return { success: false, reason: 'Insufficient harmony to join ritual' };
    }

    // Add participant
    ritual.participants.push(newParticipant);
    ritual.pooledResources.synergy += RITUAL_CONFIG.BASE_SYNERGY_CONTRIBUTION;
    newParticipant.userData.harmonyLevel -= harmonyCost;

    this._logEvent('RITUAL_PARTICIPANT_JOINED', {
      ritualId,
      participantId: newParticipant.id,
      newCount: ritual.participants.length
    });

    this._debugLog('Participant Joined Ritual', {
      ritualId: ritualId.substring(0, 20) + '...',
      newParticipant: newParticipant.id,
      totalParticipants: ritual.participants.length
    });

    return {
      success: true,
      newParticipantCount: ritual.participants.length,
      synergyContribution: RITUAL_CONFIG.BASE_SYNERGY_CONTRIBUTION
    };
  }

  /**
   * Update ritual progress (call this every frame or fixed interval)
   * 
   * @param {number} deltaTime - Time elapsed since last update (ms)
   */
  updateRituals(deltaTime) {
    const now = Date.now();
    const ritualsToRemove = [];

    for (const [ritualId, ritual] of this.rituals) {
      if (ritual.stage === RITUAL_STAGES.COMPLETE || ritual.stage === RITUAL_STAGES.FAILED || ritual.stage === RITUAL_STAGES.CANCELLED) {
        // Mark for cleanup if ritual is old enough
        if (now - ritual.completedAt > 5000) {
          ritualsToRemove.push(ritualId);
        }
        continue;
      }

      // Update timing
      if (!ritual.startedAt && ritual.stage !== RITUAL_STAGES.INITIALIZING) {
        ritual.startedAt = now;
        ritual.stageStartTime = now;
      }

      // Check stage progression
      if (ritual.stageStartTime) {
        const stageElapsed = now - ritual.stageStartTime;
        const stageDuration = ritual.stageDurations[ritual.stage] ?? ritual.totalDurationMs;
        ritual.progress = Math.min(1, stageElapsed / stageDuration);

        // Check for stage transition
        if (stageElapsed >= stageDuration) {
          this._progressRitualStage(ritualId);
        }
      }

      // Check total ritual timeout
      if (ritual.startedAt && now - ritual.startedAt > RITUAL_CONFIG.TOTAL_RITUAL_DURATION_MS) {
        if (ritual.stage !== RITUAL_STAGES.RESOLUTION && ritual.stage !== RITUAL_STAGES.COMPLETE) {
          this._failRitual(ritualId, 'Ritual timeout exceeded');
        }
      }
    }

    // Clean up old completed rituals
    for (const ritualId of ritualsToRemove) {
      this.rituals.delete(ritualId);
    }

    // Prune old ritual history for cooldown tracking
    const cutoffTime = now - RITUAL_CONFIG.RITUAL_PERIOD_MS * 2;
    for (const [clusterId, history] of this.ritualHistory) {
      if (history.timestamp < cutoffTime) {
        this.ritualHistory.delete(clusterId);
      }
    }
  }

  /**
   * Cancel an ongoing ritual (recovers 80% of invested resources)
   * 
   * @param {string} ritualId - Ritual ID
   * @returns {Object} Cancellation result
   */
  cancelRitual(ritualId) {
    const ritual = this.rituals.get(ritualId);
    if (!ritual) {
      return { success: false, reason: 'Ritual not found' };
    }

    if (ritual.stage === RITUAL_STAGES.COMPLETE || ritual.stage === RITUAL_STAGES.FAILED) {
      return { success: false, reason: 'Cannot cancel completed or failed ritual' };
    }

    ritual.stage = RITUAL_STAGES.CANCELLED;
    ritual.cancelled = true;
    ritual.completedAt = Date.now();

    // Refund 80% of harmony costs
    const refundAmount = ritual.costs.totalHarmonyCost * 0.8;
    const refundPerParticipant = refundAmount / ritual.participants.length;

    for (const node of ritual.participants) {
      if (node.userData) {
        node.userData.harmonyLevel = (node.userData.harmonyLevel || 0) + refundPerParticipant;
      }
    }

    this._logEvent('RITUAL_CANCELLED', {
      ritualId,
      refundedHarmony: refundAmount.toFixed(2),
      participantCount: ritual.participants.length
    });
    this._emitLifecycleEvent('ritual:abort', ritual, { success: false, reason: 'cancelled' });

    return {
      success: true,
      refunded: {
        harmony: refundAmount.toFixed(2),
        perParticipant: refundPerParticipant.toFixed(3)
      }
    };
  }

  /**
   * Get real-time status of an ongoing ritual
   * 
   * @param {string} ritualId - Ritual ID
   * @returns {Object} Ritual status
   */
  getRitualStatus(ritualId) {
    const ritual = this.rituals.get(ritualId);
    if (!ritual) {
      return { success: false, reason: 'Ritual not found' };
    }

    const now = Date.now();
    const timeElapsed = ritual.startedAt ? now - ritual.startedAt : 0;
    const timeRemaining = Math.max(0, RITUAL_CONFIG.TOTAL_RITUAL_DURATION_MS - timeElapsed);

    return {
      success: true,
      ritualId,
      stage: ritual.stage,
      progress: ritual.progress,
      timeElapsed,
      timeRemaining,
      participantCount: ritual.participants.length,
      pooledResources: {
        harmony: ritual.pooledResources.harmony.toFixed(2),
        synergy: ritual.pooledResources.synergy.toFixed(0)
      },
      estimatedReconstructions: ritual.cascadeReconstructions.length,
      resonanceFrequency: ritual.resonanceFrequency.toFixed(2)
    };
  }

  /**
   * Get participant statistics and loyalty tracking
   * 
   * @param {string} nodeId - Node ID
   * @returns {Object} Participant statistics
   */
  getParticipantStats(nodeId) {
    const loyalty = this.participantLoyalty.get(nodeId) || {
      ritualsCompleted: 0,
      resourcesContributed: 0,
      loyaltyBonus: 0
    };

    return {
      success: true,
      nodeId,
      ritualsCompleted: loyalty.ritualsCompleted,
      totalResourcesContributed: loyalty.resourcesContributed.toFixed(2),
      currentLoyaltyDiscount: Math.min(
        loyalty.ritualsCompleted * RITUAL_CONFIG.LOYALTY_DISCOUNT_PER_RITUAL,
        RITUAL_CONFIG.MAX_LOYALTY_DISCOUNT
      ),
      nextRitualCostReduction: (Math.min(
        loyalty.ritualsCompleted * RITUAL_CONFIG.LOYALTY_DISCOUNT_PER_RITUAL,
        RITUAL_CONFIG.MAX_LOYALTY_DISCOUNT
      ) * 100).toFixed(1) + '%'
    };
  }

  /**
   * Get statistics on all active and recent rituals
   * 
   * @returns {Object} Network-wide ritual statistics
   */
  getNetworkRitualStats() {
    const now = Date.now();
    const activRituals = Array.from(this.rituals.values()).filter(r => 
      r.stage !== RITUAL_STAGES.COMPLETE && r.stage !== RITUAL_STAGES.FAILED && r.stage !== RITUAL_STAGES.CANCELLED
    );

    const recentRitualsCount = this.recentRituals.filter(r => now - r.timestamp < RITUAL_CONFIG.RITUAL_PERIOD_MS).length;

    let totalReconstructions = 0;
    let totalParticipations = 0;
    for (const ritual of this.rituals.values()) {
      totalReconstructions += ritual.cascadeReconstructions.length;
      totalParticipations += ritual.participants.length;
    }

    return {
      success: true,
      activeRituals: activRituals.length,
      recentRitualsInPeriod: recentRitualsCount,
      maxAllowedPerPeriod: RITUAL_CONFIG.MAX_RITUALS_PER_PERIOD,
      totalReconstructions,
      totalParticipations,
      loyaltyNetworks: this.participantLoyalty.size
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Check if all participants have sufficient resources
   */
  _checkResourcesForParticipants(nodes) {
    for (const node of nodes) {
      const harmonyCost = RITUAL_CONFIG.BASE_HARMONY_COST_PER_PARTICIPANT;
      const currentHarmony = node.userData?.harmonyLevel || 0;

      if (currentHarmony < harmonyCost) {
        return {
          success: false,
          reason: `Node ${node.id} insufficient harmony: ${currentHarmony.toFixed(2)} < ${harmonyCost}`
        };
      }
    }

    return { success: true };
  }

  /**
   * Compute ritual costs accounting for escalation
   */
  _computeRitualCosts(nodes, clusterId) {
    let baseHarmonyCost = RITUAL_CONFIG.BASE_HARMONY_COST_PER_PARTICIPANT * nodes.length;

    // Add escalation cost for multiple rituals in same cluster
    const clusterData = this.clusterCooldowns.get(clusterId);
    let escalation = 1.0;
    if (clusterData && clusterData.ritualCount > 0) {
      escalation = 1 + clusterData.ritualCount * RITUAL_CONFIG.ESCALATION_MULTIPLIER_PER_RITUAL;
    }

    return {
      totalHarmonyCost: baseHarmonyCost * escalation,
      harmonyPerParticipant: (baseHarmonyCost / nodes.length) * escalation,
      escalationMultiplier: escalation,
      synergytotal: nodes.length * RITUAL_CONFIG.BASE_SYNERGY_CONTRIBUTION
    };
  }

  /**
   * Compute loyalty-based adjustments for participants
   */
  _computeLoyaltyAdjustments(nodes) {
    const adjustments = new Map();

    for (const node of nodes) {
      const loyalty = this.participantLoyalty.get(node.id) || { ritualsCompleted: 0 };
      const discount = Math.min(
        loyalty.ritualsCompleted * RITUAL_CONFIG.LOYALTY_DISCOUNT_PER_RITUAL,
        RITUAL_CONFIG.MAX_LOYALTY_DISCOUNT
      );

      adjustments.set(node.id, {
        ritualsCompleted: loyalty.ritualsCompleted,
        discountPercentage: discount * 100,
        costMultiplier: 1 - discount
      });
    }

    return adjustments;
  }

  /**
   * Deduct ritual costs from all participants
   */
  _deductRitualCosts(nodes, costBreakdown, loyaltyAdjustments) {
    for (const node of nodes) {
      if (!node.userData) node.userData = {};

      const adjustment = loyaltyAdjustments.get(node.id);
      const harmonyPerNode = costBreakdown.harmonyPerParticipant * adjustment.costMultiplier;

      node.userData.harmonyLevel = (node.userData.harmonyLevel || 0) - harmonyPerNode;
    }
  }

  /**
   * Compute a cluster ID based on network topology
   */
  _computeClusterId(nodes) {
    // Sort node IDs to create deterministic ID
    const nodeIds = nodes.map(n => n.id || 'unknown').sort();
    return `cluster_${nodeIds.join('_')}`;
  }

  /**
   * Check cooldown status for a ritual cluster
   */
  _checkRitualCooldowns(clusterId) {
    const now = Date.now();
    
    // Check cluster-specific cooldown
    const clusterData = this.clusterCooldowns.get(clusterId);
    if (clusterData && now - clusterData.lastRitualTime < RITUAL_CONFIG.SAME_CLUSTER_COOLDOWN_MS) {
      return {
        allowed: false,
        timeRemaining: RITUAL_CONFIG.SAME_CLUSTER_COOLDOWN_MS - (now - clusterData.lastRitualTime)
      };
    }

    // Check global ritual rate limit
    const recentCount = this.recentRituals.filter(r => now - r.timestamp < RITUAL_CONFIG.RITUAL_PERIOD_MS).length;
    if (recentCount >= RITUAL_CONFIG.MAX_RITUALS_PER_PERIOD) {
      const oldestRecent = this.recentRituals[0];
      const timeUntilAvailable = RITUAL_CONFIG.RITUAL_PERIOD_MS - (now - oldestRecent.timestamp);
      return {
        allowed: false,
        timeRemaining: timeUntilAvailable
      };
    }

    return { allowed: true };
  }

  /**
   * Transition ritual to a new stage
   */
  _transitionRitualStage(ritualId, stage) {
    const ritual = this.rituals.get(ritualId);
    if (!ritual) return;

    ritual.stage = stage;
    ritual.stageStartTime = Date.now();
    ritual.progress = 0;

    this._logEvent('RITUAL_STAGE_TRANSITION', {
      ritualId,
      newStage: stage,
      participantCount: ritual.participants.length
    });

    if (stage === RITUAL_STAGES.RESONANCE || stage === RITUAL_STAGES.RESOLUTION) {
      this._emitLifecycleEvent('ritual:progress', ritual, { success: true });
    }
  }

  /**
   * Progress ritual to next stage
   */
  _progressRitualStage(ritualId) {
    const ritual = this.rituals.get(ritualId);
    if (!ritual) return;

    switch (ritual.stage) {
      case RITUAL_STAGES.CHANNELING:
        this._transitionRitualStage(ritualId, RITUAL_STAGES.RESONANCE);
        break;

      case RITUAL_STAGES.RESONANCE:
        this._transitionRitualStage(ritualId, RITUAL_STAGES.RESOLUTION);
        this._executeRitualResolution(ritualId);
        break;

      case RITUAL_STAGES.RESOLUTION:
        // Ritual complete naturally (resolution finished)
        if (!ritual.failed) {
          ritual.stage = RITUAL_STAGES.COMPLETE;
          ritual.completedAt = Date.now();
          this._finalizeRitualSuccess(ritualId);
        }
        break;
    }
  }

  /**
   * Execute the resolution phase: attempt cascading reconstruction
   */
  _executeRitualResolution(ritualId) {
    const ritual = this.rituals.get(ritualId);
    if (!ritual) return;

    // Check if ritual has sufficient synergy to attempt reconstructions
    if (ritual.pooledResources.synergy < 20) {
      this._failRitual(ritualId, 'Insufficient synergy pool for reconstruction');
      return;
    }

    // Get all links in the ritual cluster
    const clusterLinks = this._getClusterLinks(ritual);
    if (clusterLinks.length === 0) {
      this._failRitual(ritualId, 'No valid links in ritual cluster');
      return;
    }

    // Attempt reconstruction on each link
    let successCount = 0;
    const reconstructionCost = ritual.pooledResources.synergy / clusterLinks.length;

    for (const link of clusterLinks) {
      const reconstructResult = this._attemptCascadeReconstruction(link, ritual, reconstructionCost);
      if (reconstructResult.success) {
        successCount++;
        ritual.cascadeReconstructions.push({
          linkId: link.id,
          corruptionBefore: reconstructResult.corruptionBefore,
          corruptionAfter: reconstructResult.corruptionAfter,
          integrityGain: reconstructResult.integrityGain
        });
      }
    }

    if (successCount === 0) {
      this._failRitual(ritualId, 'No links successfully reconstructed');
      return;
    }

    this._logEvent('RITUAL_RESOLUTION_EXECUTED', {
      ritualId,
      linksAttempted: clusterLinks.length,
      linksReconstructed: successCount
    });
  }

  /**
   * Get all links in ritual cluster
   */
  _getClusterLinks(ritual) {
    const links = [];
    const visitedLinks = new Set();

    // Perform BFS from epicenter to find all connected links
    const queue = [ritual.epicenter];
    const visited = new Set([ritual.epicenter.id]);
    let hopCount = 0;

    while (queue.length > 0 && hopCount < RITUAL_CONFIG.CASCADE_RADIUS_HOPS) {
      const nextQueue = [];

      for (const node of queue) {
        // Get all links connected to this node
        if (this.corruptionSystem && this.corruptionSystem.getAllLinks) {
          const allLinks = this.corruptionSystem.getAllLinks();
          for (const link of allLinks) {
            const linkId = link.id || `${link.source?.id}-${link.target?.id}`;

            if (!visitedLinks.has(linkId)) {
              if ((link.source?.id === node.id || link.target?.id === node.id) &&
                  !this.corruptionSystem.collapsedLinks?.has(linkId)) {
                links.push(link);
                visitedLinks.add(linkId);
              }

              // Add connected nodes to queue
              const otherNode = link.source?.id === node.id ? link.target : link.source;
              if (otherNode && !visited.has(otherNode.id)) {
                visited.add(otherNode.id);
                nextQueue.push(otherNode);
              }
            }
          }
        }
      }

      queue.length = 0;
      queue.push(...nextQueue);
      hopCount++;
    }

    return links;
  }

  /**
   * Attempt to reconstruct a single link as part of ritual cascade
   */
  _attemptCascadeReconstruction(link, ritual, costPerLink) {
    if (!this.corruptionSystem) return { success: false };

    const linkId = link.id || `${link.source?.id}-${link.target?.id}`;
    const runtimeState = this._getLinkRuntimeState(link);
    if (!runtimeState) return { success: false };

    const corruptionBefore = runtimeState.corruptionLevel;
    const integrityBefore = runtimeState.integrity;

    // Collapsed links must go through the real reconstruction API.
    if (runtimeState.collapsed && typeof this.corruptionSystem.rebuildCollapsedLink === 'function') {
      const result = this.corruptionSystem.rebuildCollapsedLink(link);
      if (!result?.success) {
        return { success: false, reason: result?.reason || 'rebuildCollapsedLink failed' };
      }

      const updatedState = this._getLinkRuntimeState(link);
      this._syncLinkUserData(link, updatedState);

      return {
        success: true,
        corruptionBefore,
        corruptionAfter: updatedState?.corruptionLevel ?? corruptionBefore,
        integrityGain: (updatedState?.integrity ?? integrityBefore) - integrityBefore
      };
    }

    // Live links are restored by writing into the active corruption/integrity state maps.
    if (!runtimeState.corruptionData || !runtimeState.integrityData) {
      return { success: false, reason: 'missing live link state' };
    }

    if (corruptionBefore <= 0.01 && runtimeState.normalizedIntegrity >= 0.99) {
      return { success: false, reason: 'link already healthy' };
    }

    const healingBudget = Math.max(0.08, Math.min(0.35, (costPerLink / 100) * 1.4));
    const healedAmount = Math.min(corruptionBefore, healingBudget);
    const integrityGain = Math.max(4, healedAmount * 32);

    runtimeState.corruptionData.level = Math.max(0, corruptionBefore - healedAmount);
    runtimeState.corruptionData.velocity = 0;
    runtimeState.integrityData.integrity = Math.min(100, integrityBefore + integrityGain);
    runtimeState.integrityData.state = this._deriveIntegrityState(runtimeState.integrityData.integrity);

    const updatedState = this._getLinkRuntimeState(link);
    this._syncLinkUserData(link, updatedState);

    if ((updatedState?.normalizedIntegrity ?? 0) < RITUAL_CONFIG.CASCADE_RECONSTRUCTION_THRESHOLD) {
      return { success: false, reason: 'reconstruction threshold not met' };
    }

    return {
      success: true,
      corruptionBefore,
      corruptionAfter: updatedState?.corruptionLevel ?? corruptionBefore,
      integrityGain: (updatedState?.integrity ?? integrityBefore) - integrityBefore
    };
  }

  /**
   * Fail an ongoing ritual with resource loss
   */
  _failRitual(ritualId, reason = 'Unknown failure') {
    const ritual = this.rituals.get(ritualId);
    if (!ritual) return;

    ritual.stage = RITUAL_STAGES.FAILED;
    ritual.failed = true;
    ritual.failureReason = reason;
    ritual.completedAt = Date.now();

    // Consume failure resource loss
    const lossAmount = ritual.pooledResources.synergy * RITUAL_CONFIG.FAILURE_RESOURCE_LOSS;
    ritual.pooledResources.synergy -= lossAmount;

    this._logEvent('RITUAL_FAILED', {
      ritualId,
      reason,
      synergyLost: lossAmount.toFixed(0)
    });

    this._debugLog('Ritual Failed', {
      ritualId: ritualId.substring(0, 20) + '...',
      reason,
      synergyLost: lossAmount.toFixed(0)
    });
    this._emitLifecycleEvent('ritual:abort', ritual, { success: false, reason });
  }

  /**
   * Finalize successful ritual and update loyalty
   */
  _finalizeRitualSuccess(ritualId) {
    const ritual = this.rituals.get(ritualId);
    if (!ritual) return;

    // Update participant loyalty
    for (const node of ritual.participants) {
      let loyalty = this.participantLoyalty.get(node.id);
      if (!loyalty) {
        loyalty = {
          ritualsCompleted: 0,
          resourcesContributed: 0,
          loyaltyBonus: 0
        };
        this.participantLoyalty.set(node.id, loyalty);
      }

      loyalty.ritualsCompleted += 1;
      loyalty.resourcesContributed += RITUAL_CONFIG.BASE_HARMONY_COST_PER_PARTICIPANT;

      // Compute loyalty bonus from reconstructed link corruption levels
      for (const reconstruction of ritual.cascadeReconstructions) {
        const corruptionDiff = reconstruction.corruptionBefore - reconstruction.corruptionAfter;
        loyalty.loyaltyBonus += corruptionDiff * RITUAL_CONFIG.LOYALTY_BONUS_FOR_DIFFICULT;
      }
    }

    // Update ritual tracking
    this.recentRituals.push({
      timestamp: Date.now(),
      clusterId: ritual.clusterId,
      success: true
    });

    // Update cluster cooldown
    const clusterData = this.clusterCooldowns.get(ritual.clusterId) || {
      lastRitualTime: Date.now(),
      ritualCount: 0
    };
    clusterData.lastRitualTime = Date.now();
    clusterData.ritualCount += 1;
    this.clusterCooldowns.set(ritual.clusterId, clusterData);

    this._logEvent('RITUAL_SUCCESS', {
      ritualId,
      participantCount: ritual.participants.length,
      linksReconstructed: ritual.cascadeReconstructions.length,
      clusterId: ritual.clusterId
    });

    this._debugLog('Ritual Completed Successfully', {
      ritualId: ritualId.substring(0, 20) + '...',
      participants: ritual.participants.length,
      linksReconstructed: ritual.cascadeReconstructions.length
    });
    this._emitLifecycleEvent('ritual:complete', ritual, { success: true });
  }

  _emitLifecycleEvent(eventName, ritual, extra = {}) {
    const handlers = this.listeners.get(eventName);
    if (!handlers || handlers.size === 0 || !ritual) return;

    const clusterLinks = this._getClusterLinks(ritual);
    const payload = {
      ritual,
      nodeIds: ritual.participants
        .map((node) => this._getNodeId(node))
        .filter(Boolean),
      linkIds: clusterLinks
        .map((link) => this._getLinkId(link))
        .filter(Boolean),
      ...extra
    };

    for (const handler of handlers) {
      try {
        handler(payload);
      } catch (err) {
        console.warn('[Phase 8 Ritual] listener error for', eventName, err);
      }
    }
  }

  /**
   * Logging helper
   */
  _logEvent(eventType, data) {
    this.eventLog.push({
      timestamp: Date.now(),
      type: eventType,
      data
    });

    if (this.eventLog.length > this.maxEventLog) {
      this.eventLog.shift();
    }
  }

  /**
   * Debug logging
   */
  _debugLog(label, data) {
    if (!this.debugMode) return;
    console.log(`%c[Phase 8 Ritual] ${label}`, 'color: #ffaa00; font-weight: bold;', data);
  }

  /**
   * Get full event log (for analytics/debugging)
   */
  getEventLog() {
    return this.eventLog;
  }

  /**
   * Clear event log
   */
  clearEventLog() {
    this.eventLog = [];
  }
}

export { NetworkRituals, RITUAL_CONFIG, RITUAL_STAGES };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NetworkRituals, RITUAL_CONFIG, RITUAL_STAGES };
}
