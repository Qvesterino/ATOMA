/**
 * HARMONY STABILIZATION & HEALING SYSTEM v1.0
 * 
 * Counter-force to corruption that spreads order, stability, and healing through the network.
 * Represents harmony, resonance, and equilibrium as a balancing mechanic.
 * 
 * Features:
 * - Node-level harmony tracking (0-1 scale)
 * - Link-level harmony flow (spreading stability)
 * - Corruption reduction and blocking
 * - Harmony pulses (radial cleansing waves)
 * - Oasis zones (clustered harmony areas)
 * - Archetype-aware harmony effects
 * - Progressive visual stabilization
 * - Full THREE.js safe mode compatibility
 * - Non-breaking integration with existing systems
 * 
 * Core Mechanics:
 * - Harmony spreads opposite to corruption (high → low)
 * - Reduces/blocks corruption spread on links
 * - Increases node stability and synergy
 * - Triggers healing pulses at thresholds
 * - Dampens cascade events
 * - Creates "Harmony Anchors" at max level
 * 
 * Integration:
 * - Works with CorruptionVisualFX_v1 (overrides/fades corruption tint)
 * - Works with LinkCorruptionTransmission_v1 (reduces linkCorruptionLevel)
 * - Works with ArchetypeGameplayEffects_v1 (uses archetype profiles)
 */

// === THREE SAFE LOADER ===
import { setMetric } from './src/metrics/NodeMetricEngine.js';

let THREE_SAFE = null;
THREE_SAFE =
  (typeof window !== 'undefined' && window.THREE) ||
  (typeof globalThis !== 'undefined' && globalThis.THREE) ||
  null;

const THREE = THREE_SAFE;

// Phase C.3: HarmonyStabilizationSystem is visual-only
// Gameplay harmony is event-driven elsewhere.
const PHASE_C3_METRIC_WRITE_LOCK = false;

/**
 * Harmony threshold definitions
 */
const HARMONY_THRESHOLDS = {
  DECAY_BEGIN: 0.2,           // Corruption starts decaying
  LINK_SLOW: 0.4,             // Link corruption slowed
  CASCADE_DAMPEN: 0.6,        // Cascade events dampened
  BLOCKING: 0.8,              // Corruption blocked + healing
  ANCHOR: 1.0                 // Full harmony anchor state
};

/**
 * HARMONY STABILIZATION ENGINE
 */
import { setNodeCorruption } from './src/utils/nodeCorruptionAccessor.js';

export class HarmonyStabilizationSystem_v1 {
  /**
   * @param {Object} aiNodes - AINodes instance
   * @param {Object} linkSystem - Link system (NodeLinkingSystem, etc.)
   * @param {Boolean} debugMode - Enable debug logging
   * @param {Object} linkCorruptionTransmission - LinkCorruptionTransmission_v1 for category-aware multipliers
   */
  constructor(aiNodes, linkSystem, debugMode = false, linkCorruptionTransmission = null) {
    this.aiNodes = aiNodes;
    this.linkSystem = linkSystem;
    this.debugMode = debugMode;
    this.linkCorruptionTransmission = linkCorruptionTransmission;

    // Node-level harmony tracking
    this.nodeHarmony = new Map(); // node -> { level: 0-1, pulseActive, oasisActive, healingRate }
    
    // Link-level harmony tracking
    this.linkHarmony = new Map(); // link -> { level: 0-1, flowDirection, flowRate }
    
    // Oasis zone tracking (groups of nearby harmony nodes)
    this.oasisZones = new Map(); // oasisId -> { nodes: Set, centerPos, radius, intensity }
    
    // Pulse tracking
    this.activePulses = []; // Array of active harmony pulses
    
    // Performance
    this.updateInterval = 1 / 60;
    this.lastUpdateTime = 0;
    this.harmonyQueue = [];
    
    // Cache for archetype profiles
    this.archetypeProfiles = null;
    
    if (this.debugMode) {
      console.log('%c[HarmonyStabilizationSystem_v1] Initialized', 'color: #00ffff; font-weight: bold;');
      this.setupConsoleAPI();
    }
  }

  /**
   * Read canonical link synergy as 0–100 percentage.
   * Falls back to 0 when missing.
   * @private
   */
  _getLinkSynergyPct(link) {
    const score =
      Number.isFinite(link?.userData?.synergy?.score) ? link.userData.synergy.score : 0;
    return Math.max(0, Math.min(100, score * 100));
  }

  /**
   * Initialize node harmony if not already tracked
   * 
   * [PHASE 1 FIX] Single Source of Truth:
   * - harmonyLevel is stored in node.userData.harmonyLevel (canonical)
   * - internal map stores only transient state (velocity, timestamps)
   */
  initializeNodeHarmony(node) {
    if (!node || !node.userData) return null;

    const nodeId = node.id || `node_${Math.random()}`;
    
    if (!this.nodeHarmony.has(nodeId)) {
      // Initialize canonical userData.harmonyLevel first
      if (typeof node.userData.harmonyLevel !== 'number') {
        // Seed initial harmony - base 0.5 like other metrics (DEFAULT_METRICS)
        let initialHarmony = 0.5; // Base seed (same as DEFAULT_METRICS)
        const archetype = node.userData?.archetype;
        if (archetype === 'harmony' || archetype === 'resonance') {
          initialHarmony = 0.7;
        } else if (archetype === 'prime' || archetype === 'sigma') {
          initialHarmony = 0.6;
        } else if (archetype === 'chaos' || archetype === 'error') {
          initialHarmony = 0.3;
        } else {
          // Small random variation around 0.5
          initialHarmony = 0.45 + Math.random() * 0.15; // 0.45-0.6
        }
        node.userData.harmonyLevel = initialHarmony;
        setMetric(node, 'harmony', initialHarmony, { source: 'HarmonyStabilizationSystem' });
      }
      if (typeof node.userData.isHarmonyAnchor !== 'boolean') {
        node.userData.isHarmonyAnchor = false;
      }
      if (typeof node.userData.anchorPulseActive !== 'boolean') {
        node.userData.anchorPulseActive = false;
      }
      
      // Internal map for transient state only (NOT level)
      this.nodeHarmony.set(nodeId, {
        // level is NOW stored in node.userData.harmonyLevel - DO NOT duplicate here
        velocity: 0,
        lastUpdateTime: Date.now(),
        pulseActive: false,
        pulseStartTime: 0,
        oasisActive: false,
        healingRate: 0,
        node: node,
        nodeId: nodeId
        // isAnchor is NOW stored in node.userData.isHarmonyAnchor - DO NOT duplicate here
      });
    }

    return this.nodeHarmony.get(nodeId);
  }

  /**
   * Initialize link harmony if not already tracked
   * 
   * [PHASE 1 FIX] Single Source of Truth:
   * - harmonyLevel is stored in link.userData.harmonyLevel (canonical)
   * - internal map stores only transient state (velocity, flowDirection, flowRate)
   */
  initializeLinkHarmony(link) {
    if (!link || !link.userData) return null;

    const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;
    
    if (!this.linkHarmony.has(linkId)) {
      // Initialize canonical userData.harmonyLevel first
      if (typeof link.userData.harmonyLevel !== 'number') {
        // Seed initial harmony - base 0.5 like other metrics
        const synergy = link.userData?.synergy?.score ?? link.userData?.synergyScore ?? 0.5;
        const initialHarmony = 0.4 + synergy * 0.3 + Math.random() * 0.1; // 0.4-0.8
        link.userData.harmonyLevel = initialHarmony;
        // Sync to userData.metrics.harmony for downstream consumers
        if (link.userData.metrics) {
          link.userData.metrics.harmony = initialHarmony;
        }
      }
      
      // Internal map for transient state only (NOT level)
      this.linkHarmony.set(linkId, {
        // level is NOW stored in link.userData.harmonyLevel - DO NOT duplicate here
        velocity: 0,
        flowDirection: 'forward', // forward or backward
        flowRate: 0,
        lastUpdateTime: Date.now(),
        link: link,
        linkId: linkId
      });
    }

    return this.linkHarmony.get(linkId);
  }

  /**
   * Canonical writer for harmonic node metrics (called once per frame for all nodes)
   * Ensures harmonicPhase, harmonicHub, harmonicResilience, harmonicCollapse,
   * harmonicRecovery, isHarmonyAnchor, anchorPulseActive are always defined
   * on nodes before any readers access them.
   *
   * This is the single authoritative source for these metrics - DO NOT write
   * them elsewhere.
   *
   * Maps from NodeHarmonicManager controller values to canonical names:
   * - harmonicPhase → node.harmonicControllers.sync.hubPhase
   * - harmonicHub → node.harmonicControllers.sync.hubStrength
   * - harmonicResilience → node.harmonicControllers.resilience.hubResilience
   * - harmonicCollapse → node.harmonicControllers.collapse.collapseFactor
   * - harmonicRecovery → node.harmonicControllers.recovery.recoveryFactor
   */
  _canonicalWriteNodeHarmonicMetrics(node) {
    if (!node) return;
    node.userData ||= {};

    // Get harmonic controllers if available (from NodeHarmonicManager)
    const controllers = node.harmonicControllers;

    // Default values (fallbacks)
    let harmonicPhase = 0;
    let harmonicHub = 0; // hubStrength
    let harmonicResilience = 0;
    let harmonicCollapse = 0;
    let harmonicRecovery = 0;

    if (controllers) {
      // Read from sync controller (hubPhase, hubStrength)
      if (controllers.sync) {
        harmonicPhase = controllers.sync.hubPhase ?? 0;
        harmonicHub = controllers.sync.hubStrength ?? 0;
      }

      // Read from resilience controller
      if (controllers.resilience) {
        harmonicResilience = controllers.resilience.hubResilience ?? 0;
      }

      // Read from collapse controller
      if (controllers.collapse) {
        harmonicCollapse = controllers.collapse.collapseFactor ?? 0;
      }

      // Read from recovery controller
      if (controllers.recovery) {
        harmonicRecovery = controllers.recovery.recoveryFactor ?? 0;
      }
    }

    // Write canonical values to userData
    node.userData.harmonicPhase = harmonicPhase;
    node.userData.harmonicHub = harmonicHub;
    node.userData.harmonicResilience = harmonicResilience;
    node.userData.harmonicCollapse = harmonicCollapse;
    node.userData.harmonicRecovery = harmonicRecovery;

    // Stamp canonical writes for harmonic node fields
    node.userData.__canonicalWriteAt = node.userData.__canonicalWriteAt || {};
    node.userData.__canonicalWriteAt.harmonicPhase = Date.now();
    node.userData.__canonicalWriteAt.harmonicHub = Date.now();
    node.userData.__canonicalWriteAt.harmonicResilience = Date.now();
    node.userData.__canonicalWriteAt.harmonicCollapse = Date.now();
    node.userData.__canonicalWriteAt.harmonicRecovery = Date.now();

    // isHarmonyAnchor and anchorPulseActive are set by triggerAnchorState()
    // Ensure they have defaults if not set yet
    if (typeof node.userData.isHarmonyAnchor !== 'boolean') {
      node.userData.isHarmonyAnchor = false;
    }
    if (typeof node.userData.anchorPulseActive !== 'boolean') {
      node.userData.anchorPulseActive = false;
    }
  }

  /**
   * Canonical writer for halo/pulse visual metrics (called once per frame for all nodes)
   * Ensures haloAmplitude, haloFrequency, pulsePhase, pulseCoherence, pulseStreak
   * are always defined on nodes and active even at low network activity.
   *
   * This is the single authoritative source for these metrics - DO NOT write
   * them elsewhere.
   *
   * Key behavior: Effects activate even at low activity by using minimum base values.
   * Resilience modulates intensity, not presence.
   */
  _canonicalWriteHaloPulseMetrics(node) {
    if (!node) return;
    node.userData ||= {};

    // Get harmonic controllers if available (from NodeHarmonicManager)
    const controllers = node.harmonicControllers;

    // Default values (minimums for activation at low activity)
    let hubResilience = 0;
    let haloAmplitude = 0.15; // Minimum amplitude ensures visibility
    let haloFrequency = 1.0; // Base frequency
    let pulsePhase = 0;
    let pulseCoherence = 0.3; // Minimum coherence
    let pulseStreak = 0.2; // Minimum streak consistency

    // Current time for phase calculation
    const currentTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

    if (controllers && controllers.resilience) {
      hubResilience = controllers.resilience.hubResilience ?? 0;

      // Get modulated values from resilience controller if available
      if (typeof controllers.resilience.getModulatedHaloStability === 'function') {
        const haloMod = controllers.resilience.getModulatedHaloStability(0.3, 1.0);
        haloAmplitude = Math.max(0.15, haloMod.amplitude); // Ensure minimum
        haloFrequency = haloMod.frequency;
      }

      if (typeof controllers.resilience.getModulatedPulseCoherence === 'function') {
        const coherenceMod = controllers.resilience.getModulatedPulseCoherence(0.3);
        pulseCoherence = Math.max(0.3, coherenceMod.syncStrength); // Ensure minimum
        pulseStreak = coherenceMod.coherenceFactor;
      }
    }

    // Pulse phase: always progresses based on time (independent of activity)
    // Use node-specific phase offset for variety
    const phaseOffset = node.userData._pulsePhaseOffset ?? (node.id * 123.45) % (Math.PI * 2);
    const pulseSpeed = 1.0 + hubResilience * 0.5; // Higher resilience = faster pulse
    pulsePhase = (currentTime * pulseSpeed + phaseOffset) % (Math.PI * 2);

    // Store phase offset for consistency
    node.userData._pulsePhaseOffset = phaseOffset;

    // Write canonical values to userData
    node.userData.haloAmplitude = haloAmplitude;
    node.userData.haloFrequency = haloFrequency;
    node.userData.pulsePhase = pulsePhase;
    node.userData.pulseCoherence = pulseCoherence;
    node.userData.pulseStreak = pulseStreak;

    // Stamp canonical writes for halo/pulse fields
    node.userData.__canonicalWriteAt = node.userData.__canonicalWriteAt || {};
    node.userData.__canonicalWriteAt.haloAmplitude = Date.now();
    node.userData.__canonicalWriteAt.haloFrequency = Date.now();
    node.userData.__canonicalWriteAt.pulsePhase = Date.now();
    node.userData.__canonicalWriteAt.pulseCoherence = Date.now();
    node.userData.__canonicalWriteAt.pulseStreak = Date.now();
  }

  /**
   * Canonical writer for harmonic link metrics (called once per frame for all links)
   * Ensures harmonicPhase, harmonicHub, harmonicResilience, harmonicCollapse,
   * harmonicRecovery, isHarmonyAnchor, anchorPulseActive are always defined
   * on links before any readers access them.
   *
   * This is the single authoritative source for these metrics - DO NOT write
   * them elsewhere.
   *
   * Key behavior: Link harmonic metrics are derived from endpoint node averages.
   * This ensures link readers get consistent data even without link-level controllers.
   */
  _canonicalWriteLinkHarmonicMetrics(link) {
    if (!link) return;
    link.userData ||= {};

    const sourceNode = link.source || link.sourceNode;
    const targetNode = link.target || link.targetNode;

    // Default values (fallbacks)
    let harmonicPhase = 0;
    let harmonicHub = 0;
    let harmonicResilience = 0;
    let harmonicCollapse = 0;
    let harmonicRecovery = 0;

    // Derive from source node if available
    if (sourceNode?.userData) {
      harmonicPhase = sourceNode.userData.harmonicPhase ?? 0;
      harmonicHub = sourceNode.userData.harmonicHub ?? 0;
      harmonicResilience = sourceNode.userData.harmonicResilience ?? 0;
      harmonicCollapse = sourceNode.userData.harmonicCollapse ?? 0;
      harmonicRecovery = sourceNode.userData.harmonicRecovery ?? 0;
    }

    // Average with target node if available
    if (targetNode?.userData) {
      harmonicPhase = (harmonicPhase + (targetNode.userData.harmonicPhase ?? 0)) * 0.5;
      harmonicHub = (harmonicHub + (targetNode.userData.harmonicHub ?? 0)) * 0.5;
      harmonicResilience = (harmonicResilience + (targetNode.userData.harmonicResilience ?? 0)) * 0.5;
      harmonicCollapse = (harmonicCollapse + (targetNode.userData.harmonicCollapse ?? 0)) * 0.5;
      harmonicRecovery = (harmonicRecovery + (targetNode.userData.harmonicRecovery ?? 0)) * 0.5;
    }

    // [PHASE 1 FIX] Read link harmony from canonical source
    const linkHarmony = link.userData?.harmonyLevel ?? 0;
    
    // Scale harmonic values by link harmony level
    harmonicHub *= linkHarmony;
    harmonicResilience *= (0.5 + linkHarmony * 0.5);
    harmonicCollapse *= (1.0 - linkHarmony * 0.5);
    harmonicRecovery *= linkHarmony;

    // Write canonical values to userData
    link.userData.harmonicPhase = harmonicPhase;
    link.userData.harmonicHub = harmonicHub;
    link.userData.harmonicResilience = harmonicResilience;
    link.userData.harmonicCollapse = harmonicCollapse;
    link.userData.harmonicRecovery = harmonicRecovery;

    // Stamp canonical writes for harmonic link fields
    link.userData.__canonicalWriteAt = link.userData.__canonicalWriteAt || {};
    link.userData.__canonicalWriteAt.harmonicPhase = Date.now();
    link.userData.__canonicalWriteAt.harmonicHub = Date.now();
    link.userData.__canonicalWriteAt.harmonicResilience = Date.now();
    link.userData.__canonicalWriteAt.harmonicCollapse = Date.now();
    link.userData.__canonicalWriteAt.harmonicRecovery = Date.now();

    // isHarmonyAnchor and anchorPulseActive are false by default for links
    // (only nodes can be anchors, but we set defaults for consistency)
    if (typeof link.userData.isHarmonyAnchor !== 'boolean') {
      link.userData.isHarmonyAnchor = false;
    }
    if (typeof link.userData.anchorPulseActive !== 'boolean') {
      link.userData.anchorPulseActive = false;
    }
  }

  /**
   * Canonical writer for halo/pulse visual metrics on links (called once per frame for all links)
   * Ensures haloAmplitude, haloFrequency, pulsePhase, pulseCoherence, pulseStreak
   * are always defined on links and active even at low network activity.
   *
   * This is the single authoritative source for these metrics - DO NOT write
   * them elsewhere.
   *
   * Key behavior: Link halo/pulse metrics are derived from endpoint node averages.
   * Resilience modulates intensity, not presence.
   */
  _canonicalWriteLinkHaloPulseMetrics(link) {
    if (!link) return;
    link.userData ||= {};

    const sourceNode = link.source || link.sourceNode;
    const targetNode = link.target || link.targetNode;

    // Default values (minimums for activation at low activity)
    let hubResilience = 0;
    let haloAmplitude = 0.1; // Lower minimum for links
    let haloFrequency = 1.0; // Base frequency
    let pulsePhase = 0;
    let pulseCoherence = 0.2; // Lower minimum for links
    let pulseStreak = 0.15; // Lower minimum for links

    // Current time for phase calculation
    const currentTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

    // Derive from source node if available
    if (sourceNode?.userData) {
      hubResilience = sourceNode.userData.harmonicResilience ?? 0;
      haloAmplitude = sourceNode.userData.haloAmplitude ?? 0.1;
      haloFrequency = sourceNode.userData.haloFrequency ?? 1.0;
      pulseCoherence = sourceNode.userData.pulseCoherence ?? 0.2;
      pulseStreak = sourceNode.userData.pulseStreak ?? 0.15;
    }

    // Average with target node if available
    if (targetNode?.userData) {
      haloAmplitude = (haloAmplitude + (targetNode.userData.haloAmplitude ?? 0.1)) * 0.5;
      haloFrequency = (haloFrequency + (targetNode.userData.haloFrequency ?? 1.0)) * 0.5;
      pulseCoherence = (pulseCoherence + (targetNode.userData.pulseCoherence ?? 0.2)) * 0.5;
      pulseStreak = (pulseStreak + (targetNode.userData.pulseStreak ?? 0.15)) * 0.5;
      hubResilience = (hubResilience + (targetNode.userData.harmonicResilience ?? 0)) * 0.5;
    }

    // [PHASE 1 FIX] Read link harmony from canonical source
    const linkHarmony = link.userData?.harmonyLevel ?? 0;
    
    // Scale amplitude by link harmony (0.1 to 0.4 range)
    haloAmplitude = 0.1 + linkHarmony * 0.3;

    // Pulse phase: always progresses based on time (independent of activity)
    // Use link-specific phase offset for variety
    const phaseOffset = link.userData._pulsePhaseOffset ?? ((link.id?.length ?? 0) * 123.45) % (Math.PI * 2);
    const pulseSpeed = 1.0 + hubResilience * 0.5; // Higher resilience = faster pulse
    pulsePhase = (currentTime * pulseSpeed + phaseOffset) % (Math.PI * 2);

    // Store phase offset for consistency
    link.userData._pulsePhaseOffset = phaseOffset;

    // Write canonical values to userData
    link.userData.haloAmplitude = haloAmplitude;
    link.userData.haloFrequency = haloFrequency;
    link.userData.pulsePhase = pulsePhase;
    link.userData.pulseCoherence = pulseCoherence;
    link.userData.pulseStreak = pulseStreak;

    // Stamp canonical writes for halo/pulse link fields
    link.userData.__canonicalWriteAt = link.userData.__canonicalWriteAt || {};
    link.userData.__canonicalWriteAt.haloAmplitude = Date.now();
    link.userData.__canonicalWriteAt.haloFrequency = Date.now();
    link.userData.__canonicalWriteAt.pulsePhase = Date.now();
    link.userData.__canonicalWriteAt.pulseCoherence = Date.now();
    link.userData.__canonicalWriteAt.pulseStreak = Date.now();
  }

  /**
   * Main update loop - alias for safeTick compatibility
   * safeTick in main.js looks for update(), tick(), or process()
   */
  update(deltaTime = 1/60) {
    this.updateHarmony(deltaTime);
  }

  /**
   * Main update loop - call once per frame
   */
  updateHarmony(deltaTime = 1/60) {
    if (!this.aiNodes) return;

    // Canonical write: ensure harmonic metrics exist for all nodes
    const allNodes = this.getAllNodes();
    if (allNodes && allNodes.length > 0) {
      for (const node of allNodes) {
        this._canonicalWriteNodeHarmonicMetrics(node);
        this._canonicalWriteHaloPulseMetrics(node);
      }
    }

    // Canonical write: ensure harmonic metrics exist for all links
    const allLinks = this.getAllLinks();
    if (allLinks && allLinks.length > 0) {
      for (const link of allLinks) {
        this._canonicalWriteLinkHarmonicMetrics(link);
        this._canonicalWriteLinkHaloPulseMetrics(link);
      }
    }

    // Update all nodes
    if (allNodes && allNodes.length > 0) {
      for (const node of allNodes) {
        this.updateNodeHarmony(node, deltaTime);
      }
    }

    // Update all links
    if (allLinks && allLinks.length > 0) {
      for (const link of allLinks) {
        this.updateLinkHarmony(link, deltaTime);
      }
    }

    // Update pulses
    this.updateHarmonyPulses(deltaTime);

    // Check for oasis zones
    this.updateOasisZones(deltaTime);

    // Process harmony queue
    this.processHarmonyQueue();
  }

  /**
   * Update harmony level for a single node
   * [Tier 4.9] SYNERGY-DRIVEN RECOVERY ACCELERATION
   * - Higher node synergy accelerates harmony regeneration after cascades
   * - Recovery boost applied to all harmony-based recovery rates
   * 
   * [PHASE 1 FIX] Single Source of Truth:
   * - Reads/Writes level from/to node.userData.harmonyLevel (canonical)
   */
  updateNodeHarmony(node, deltaTime) {
    const harmonyData = this.initializeNodeHarmony(node);
    if (!harmonyData) return;

    // [PHASE 1 FIX] Read level from canonical source
    let level = node.userData.harmonyLevel ?? 0;

    // Check if node has corruption to counter
    const nodeCorruption = node.userData?.metrics?.corruption ?? node.userData?.corruption ?? 0;
    
    // [Tier 4.9] SYNERGY-DRIVEN RECOVERY ACCELERATION
    // Compute recovery boost from average synergy of connected links
    let avgSynergy = 0;
    let linkCount = 0;
    if (node.userData?.links && node.userData.links.length > 0) {
      for (const link of node.userData.links) {
        avgSynergy += this._getLinkSynergyPct(link);
        linkCount++;
      }
      avgSynergy = linkCount > 0 ? avgSynergy / linkCount : 0;
    }
    const recoveryBoost = 1.0 + Math.min(avgSynergy * 0.5, 0.5); // 100% to 150% speed
    
    // SKIP UPDATE for unlinked nodes - they maintain their seeded harmony
    // Only apply decay/increase to nodes that are part of the network
    if (linkCount === 0) {
      return;
    }
    
    // Harmony healing: gradually reduce corruption
    if (level > 0) {
      let healAmount = level * 0.1 * deltaTime; // Up to 10% corruption/sec
      healAmount *= recoveryBoost; // [Tier 4.9] Accelerate corruption decay on nodes
      if (nodeCorruption > 0) {
        setNodeCorruption(node, Math.max(0, nodeCorruption - healAmount), { source: 'harmony-stabilization' });
        this._emitCorruptionThreshold(node);
      }
    }

    // Harmony level changes from:
    // 1. External sources (player actions, harmony pulses)
    // 2. Harmony flow from linked nodes
    // 3. Natural equilibrium toward 0.5 (like other metrics)
    
    // Get inbound harmony flow from connected nodes
    const inboundFlow = this.computeInboundHarmonyFlow(node);
    
    // Calculate TARGET harmony (not instant value)
    // Base target is 0.5 (equilibrium), modified by inbound flow
    let targetHarmony = 0.5; // Natural equilibrium
    targetHarmony += inboundFlow * 0.3; // Flow can boost toward 0.8
    targetHarmony = Math.max(0.1, Math.min(0.95, targetHarmony));
    
    // GRADUAL LERP toward target (not instant)
    // Rate: ~10% of distance per second (similar to other metrics)
    const lerpRate = 0.1 * recoveryBoost;
    const distance = targetHarmony - level;
    const lerpAmount = distance * lerpRate * deltaTime;
    
    // Apply lerp (gradual change toward target)
    level = level + lerpAmount;
    
    // Small natural decay to prevent stagnation at extremes
    const decayRate = 0.005; // 0.5% per second (much slower than before)
    if (level > 0.7) {
      level -= level * decayRate * deltaTime;
    }
    
    // [PHASE 1 FIX] Update canonical source
    level = Math.max(0, Math.min(1.0, level));
    node.userData.harmonyLevel = level;
    setMetric(node, 'harmony', level, { source: 'HarmonyStabilizationSystem' });
    harmonyData.lastUpdateTime = Date.now();

    // Check harmony thresholds
    this.checkHarmonyThresholds(node, { level });

    // Apply visual effects
    this.applyNodeHarmonyVisuals(node, level, Date.now() / 1000);
  }

  /**
   * Update harmony level for a single link
   * [Tier 4.9] SYNERGY-DRIVEN RECOVERY ACCELERATION
   * - Higher link synergy accelerates harmony regeneration after cascades
   * - Recovery boost applied to all harmony spread rates
   * 
   * [PHASE 1 FIX] Single Source of Truth:
   * - Reads/Writes level from/to link.userData.harmonyLevel (canonical)
   */
  updateLinkHarmony(link, deltaTime) {
    const harmonyData = this.initializeLinkHarmony(link);
    if (!harmonyData) return;

    const sourceNode = link.source || link.sourceNode;
    const targetNode = link.target || link.targetNode;
    
    if (!sourceNode || !targetNode) return;

    // [PHASE 1 FIX] Read level from canonical source
    let level = link.userData.harmonyLevel ?? 0;

    // [Tier 4.9] SYNERGY-DRIVEN RECOVERY ACCELERATION
    // Compute recovery boost from this link's synergy
    const synergy = this._getLinkSynergyPct(link);
    const recoveryBoost = 1.0 + Math.min(synergy * 0.5, 0.5); // 100% to 150% speed

    // Compute harmony flow rate (opposite of corruption flow)
    // High harmony → Low harmony
    const harmonyFlowRate = this.computeHarmonyFlowRate(sourceNode, targetNode, link);

    // Canonical target harmony level from metrics
    const targetHarmony = targetNode.userData?.metrics?.harmony ?? 0;
    
    // Harmony spreads toward the target harmony level
    const harmonyDifference = targetHarmony - level;
    
    // Apply category-aware harmony propagation multiplier
    let harmonyMultiplier = 1.0;
    if (this.linkCorruptionTransmission && sourceNode && targetNode) {
      harmonyMultiplier = this.linkCorruptionTransmission.getHarmonyPropagationMultiplier(sourceNode, targetNode);
    }
    
    // Apply harmony flow * time step * category multiplier * recovery boost
    let harmonyIncrease = harmonyDifference * harmonyFlowRate * harmonyMultiplier * deltaTime * 0.1;
    harmonyIncrease *= recoveryBoost; // [Tier 4.9] Accelerate harmony regeneration on links
    
    // [PHASE 1 FIX] Update canonical source
    level = Math.min(1.0, level + harmonyIncrease);
    link.userData.harmonyLevel = level;
    
    // Sync to userData.metrics.harmony for downstream consumers
    if (link.userData.metrics) {
      link.userData.metrics.harmony = level;
    }
    
    // Store velocity in internal map (transient state)
    harmonyData.velocity = harmonyIncrease / (deltaTime + 0.001);
    harmonyData.lastUpdateTime = Date.now();

    // Link harmony reduces link corruption
    if (level > 0.2 && this.aiNodes.linkCorruption) {
      const linkCorruptionData = this.aiNodes.linkCorruption.linkCorruption.get(link.id);
      if (linkCorruptionData) {
        // Harmony directly reduces corruption on the link
        // [Tier 4.9] Apply synergy-driven recovery acceleration
        let harmonyReduction = level * 0.05 * deltaTime;
        harmonyReduction *= recoveryBoost; // [Tier 4.9] Accelerate corruption decay with high synergy
        linkCorruptionData.level = Math.max(0, linkCorruptionData.level - harmonyReduction);
      }
    }

    // Apply visual effects
    this.applyLinkHarmonyVisuals(link, level, Date.now() / 1000);
  }

  /**
   * Compute inbound harmony flow to a node (from all connected sources)
   * 
   * [PHASE 1 FIX] Reads level from link.userData.harmonyLevel (canonical)
   */
  computeInboundHarmonyFlow(node) {
    if (!node || !this.linkSystem) return 0;

    let totalFlow = 0;
    const inboundLinks = this.getInboundLinks(node);
    
    for (const link of inboundLinks) {
      const sourceNode = link.source || link.sourceNode;
      const harmonyData = this.linkHarmony.get(link.id);
      
      if (sourceNode && harmonyData) {
        // [PHASE 1 FIX] Read level from canonical source
        const level = link.userData.harmonyLevel ?? 0;
        totalFlow += level * harmonyData.flowRate;
      }
    }

    return Math.min(1.0, totalFlow);
  }

  /**
   * Compute harmony flow rate for a link
   * 
   * Based on:
   * - Source/target archetype harmony alignment
   * - Link synergy
   * - Current chaos/harmony balance
   */
  computeHarmonyFlowRate(sourceNode, targetNode, link) {
    let baseRate = 0.5; // Base harmony spread rate

    // Get archetype profiles if available
    if (!this.archetypeProfiles && this.aiNodes.archetypeProfiles) {
      this.archetypeProfiles = this.aiNodes.archetypeProfiles;
    }

    // Source archetype effects
    if (sourceNode.userData?.archetype && this.archetypeProfiles) {
      const sourceProfile = this.archetypeProfiles[sourceNode.userData.archetype];
      if (sourceProfile) {
        // Harmony/Prime/Sigma spread harmony well
        if (sourceProfile.tags?.includes('harmony') || sourceProfile.tags?.includes('resonance')) {
          baseRate *= 2.0;
        }
        if (sourceProfile.tags?.includes('prime') || sourceProfile.tags?.includes('sigma')) {
          baseRate *= 1.5;
        }
        // Chaos/Error resist harmony
        if (sourceProfile.tags?.includes('chaos') || sourceProfile.tags?.includes('error')) {
          baseRate *= 0.3;
        }
        // Quantum adds variance
        if (sourceProfile.tags?.includes('quantum')) {
          baseRate *= (0.5 + Math.random() * 1.5);
        }
      }
    }

    // Target archetype effects
    if (targetNode.userData?.archetype && this.archetypeProfiles) {
      const targetProfile = this.archetypeProfiles[targetNode.userData.archetype];
      if (targetProfile) {
        // Harmony/Prime receive harmony well
        if (targetProfile.tags?.includes('harmony') || targetProfile.tags?.includes('resonance')) {
          baseRate *= 1.5;
        }
        if (targetProfile.tags?.includes('prime') || targetProfile.tags?.includes('sigma')) {
          baseRate *= 1.2;
        }
        // Chaos resists harmony
        if (targetProfile.tags?.includes('chaos')) {
          baseRate *= 0.5;
        }
      }
    }

    // Link synergy improves harmony flow
    if (link.userData?.synergy !== undefined) {
      baseRate *= (0.5 + (link.userData.synergy.score ?? 0) * 0.5);
    }

    return Math.max(0.01, Math.min(2.0, baseRate));
  }

  /**
   * Check and process harmony thresholds
   */
  checkHarmonyThresholds(node, harmonyData) {
    const level = harmonyData.level;

    // Only fire thresholds once
    const thresholds = [
      { value: HARMONY_THRESHOLDS.DECAY_BEGIN, event: 'decay_begin' },
      { value: HARMONY_THRESHOLDS.LINK_SLOW, event: 'link_slow' },
      { value: HARMONY_THRESHOLDS.CASCADE_DAMPEN, event: 'cascade_dampen' },
      { value: HARMONY_THRESHOLDS.BLOCKING, event: 'blocking' },
      { value: HARMONY_THRESHOLDS.ANCHOR, event: 'anchor_achieved' }
    ];

    for (const threshold of thresholds) {
      if (level >= threshold.value && !node.userData.harmonyThresholds?.has?.(threshold.event)) {
        if (!node.userData.harmonyThresholds) {
          node.userData.harmonyThresholds = new Set();
        }
        node.userData.harmonyThresholds.add(threshold.event);

        const event = {
          node: node,
          event: threshold.event,
          level: level,
          timestamp: Date.now()
        };

        this.harmonyQueue.push(event);

        if (this.debugMode) {
          console.log(`[HarmonyStabilization] Threshold: ${threshold.event} at level ${level.toFixed(2)}`);
        }
      }
    }
  }

  /**
   * Process queued harmony events
   */
  processHarmonyQueue() {
    while (this.harmonyQueue.length > 0) {
      const event = this.harmonyQueue.shift();

      switch (event.event) {
        case 'blocking':
          this.triggerHarmonyBlocking(event.node);
          break;
        case 'anchor_achieved':
          this.triggerAnchorState(event.node);
          break;
        case 'cascade_dampen':
          this.triggerCascadeDampening(event.node);
          break;
      }
    }
  }

  /**
   * Trigger harmony blocking and healing at 0.8 threshold
   */
  triggerHarmonyBlocking(node) {
    if (!node || !node.userData) return;

    // Block corruption on this node
    node.userData.corrupted = false;
    setNodeCorruption(node, Math.max(0, (node.userData?.metrics?.corruption ?? node.userData?.corruption ?? 0) - 0.2), { source: 'harmony-stabilization' });
    this._emitCorruptionThreshold(node);

    // Trigger healing pulse
    this.triggerHarmonyPulse(node);

    if (this.debugMode) {
      console.log('[HarmonyStabilization] Blocking triggered - corruption reduced');
    }
  }

  /**
   * Trigger anchor state at 1.0
   */
  triggerAnchorState(node) {
    if (!node || !node.userData) return;

    node.userData.isHarmonyAnchor = true;
    setNodeCorruption(node, 0, { source: 'harmony-stabilization' });
    this._emitCorruptionThreshold(node);

    // Continuous pulse
    node.userData.anchorPulseActive = true;

    if (this.debugMode) {
      console.log('[HarmonyStabilization] Node became harmony anchor');
    }
  }

  /**
   * Dampen cascade events at 0.6 threshold
   */
  triggerCascadeDampening(node) {
    if (!node || !this.aiNodes.linkCorruption) return;

    // Clear cascade queue for links from this node
    const outboundLinks = this.getOutboundLinks(node);
    for (const link of outboundLinks) {
      const linkData = this.aiNodes.linkCorruption.linkCorruption.get(link.id);
      if (linkData) {
        // Reduce cascade queued events
        linkData.cascadeThresholdsCrossed.delete('cascade');
        linkData.cascadeThresholdsCrossed.delete('infection_complete');
      }
    }

    if (this.debugMode) {
      console.log('[HarmonyStabilization] Cascade dampening applied');
    }
  }

  /**
   * Trigger a harmony pulse from a node
   * Cleanses nearby links and reduces corruption in connected nodes
   * 
   * [PHASE 1 FIX] Reads level from node.userData.harmonyLevel (canonical)
   */
  triggerHarmonyPulse(sourceNode, radius = 2.0, intensity = 0.5) {
    if (!sourceNode) return;

    const harmonyData = this.initializeNodeHarmony(sourceNode);
    if (!harmonyData) return;

    // [PHASE 1 FIX] Read level from canonical source
    const level = sourceNode.userData.harmonyLevel ?? 0;

    const pulse = {
      sourceNode: sourceNode,
      sourcePos: sourceNode.position || { x: 0, y: 0, z: 0 },
      startTime: Date.now(),
      duration: 1.0,  // 1 second pulse
      radius: radius,
      intensity: Math.min(1.0, level * intensity),
      active: true
    };

    this.activePulses.push(pulse);

    // Immediate cleansing effect
    this.appliesPulseEffect(pulse);

    if (this.debugMode) {
      console.log('[HarmonyStabilization] Harmony pulse triggered from node');
    }

    return pulse;
  }

  /**
   * Apply immediate pulse effect
   * 
   * [PHASE 1 FIX] Writes level to node.userData.harmonyLevel and link.userData.harmonyLevel (canonical)
   */
  appliesPulseEffect(pulse) {
    const allNodes = this.getAllNodes();
    const allLinks = this.getAllLinks();
    const sourcePos = pulse.sourcePos || { x: 0, y: 0, z: 0 };
    const sourceX = sourcePos.x || 0;
    const sourceY = sourcePos.y || 0;
    const sourceZ = sourcePos.z || 0;
    const radiusSq = (pulse.radius || 0) * (pulse.radius || 0);

    // Cleanse nearby nodes
    for (const node of allNodes) {
      const nodePos = node?.position;
      if (!nodePos) continue;

      const dx = sourceX - (nodePos.x || 0);
      const dy = sourceY - (nodePos.y || 0);
      const dz = sourceZ - (nodePos.z || 0);
      if ((dx * dx) + (dy * dy) + (dz * dz) <= radiusSq) {
        // Reduce corruption
        if (node.userData) {
          setNodeCorruption(node, Math.max(0, (node.userData?.metrics?.corruption ?? node.userData?.corruption ?? 0) - pulse.intensity * 0.3), { source: 'harmony-stabilization' });
          this._emitCorruptionThreshold(node);
          // [PHASE 1 FIX] Write level to canonical source
          const currentLevel = node.userData.harmonyLevel ?? 0;
          node.userData.harmonyLevel = Math.min(1.0, currentLevel + pulse.intensity * 0.2);
        }
      }
    }

    // Cleanse nearby links
    for (const link of allLinks) {
      const source = link.source || link.sourceNode;
      const target = link.target || link.targetNode;
      
      if (source && target && source.position && target.position) {
        const midX = (source.position.x + target.position.x) * 0.5;
        const midY = (source.position.y + target.position.y) * 0.5;
        const midZ = (source.position.z + target.position.z) * 0.5;
        const linkDx = sourceX - midX;
        const linkDy = sourceY - midY;
        const linkDz = sourceZ - midZ;
        if ((linkDx * linkDx) + (linkDy * linkDy) + (linkDz * linkDz) <= radiusSq) {
          // Reduce link corruption
          if (this.aiNodes.linkCorruption) {
            const linkData = this.aiNodes.linkCorruption.linkCorruption.get(link.id);
            if (linkData) {
              linkData.level = Math.max(0, linkData.level - pulse.intensity * 0.2);
            }
          }
          // [PHASE 1 FIX] Write level to canonical source
          const currentLevel = link.userData.harmonyLevel ?? 0;
          link.userData.harmonyLevel = Math.min(1.0, currentLevel + pulse.intensity * 0.3);
        }
      }
    }
  }

  /**
   * Update active harmony pulses
   * 
   * [PHASE 1 FIX] Reads isAnchor and level from node.userData (canonical)
   */
  updateHarmonyPulses(deltaTime) {
    for (let i = this.activePulses.length - 1; i >= 0; i--) {
      const pulse = this.activePulses[i];
      const elapsed = (Date.now() - pulse.startTime) / 1000;

      if (elapsed >= pulse.duration) {
        this.activePulses.splice(i, 1);
      }
    }

    // Apply continuous effects from anchor nodes
    const allNodes = this.getAllNodes();
    for (const node of allNodes) {
      // [PHASE 1 FIX] Read isAnchor and level from canonical source
      const isAnchor = node.userData?.isHarmonyAnchor ?? false;
      const level = node.userData?.harmonyLevel ?? 0;
      
      if (isAnchor && level >= 1.0) {
        // Continuous anchor pulse (weaker)
        const anchorPulse = {
          sourceNode: node,
          sourcePos: node.position || { x: 0, y: 0, z: 0 },
          startTime: Date.now(),
          duration: 0.5,
          radius: 1.5,
          intensity: 0.2,
          isAnchorPulse: true
        };
        this.appliesPulseEffect(anchorPulse);
      }
    }
  }

  /**
   * Update oasis zones (clusters of harmony nodes)
   * 
   * [PHASE 1 FIX] Reads level from node.userData.harmonyLevel (canonical)
   */
  updateOasisZones(deltaTime) {
    const allNodes = this.getAllNodes();
    const harmonyNodes = allNodes.filter(n => {
      // [PHASE 1 FIX] Read level from canonical source
      const level = n.userData?.harmonyLevel ?? 0;
      return level > 0.5;
    });

    if (harmonyNodes.length < 2) return;

    // Find clusters
    const clusters = this.findHarmonyClusters(harmonyNodes);

    // Update zones
    for (const cluster of clusters) {
      if (cluster.length >= 3) {
        // 3+ nodes = oasis zone
        const centroid = this.computeCentroid(cluster);
        const radius = this.computeClusterRadius(cluster);
        
        const zoneId = `oasis_${cluster[0].id}_${cluster[1].id}`;
        
        // [PHASE 1 FIX] Read level from canonical source
        let totalLevel = 0;
        for (const n of cluster) {
          totalLevel += n.userData?.harmonyLevel ?? 0;
        }
        
        const zone = {
          nodes: new Set(cluster),
          centerPos: centroid,
          radius: radius,
          intensity: totalLevel / cluster.length
        };

        this.oasisZones.set(zoneId, zone);

        // Apply oasis effects
        this.applyOasisEffects(zone, deltaTime);
      }
    }
  }

  /**
   * Find harmony node clusters
   */
  findHarmonyClusters(harmonyNodes, clusterDistance = 3.0) {
    const clusters = [];
    const visited = new Set();

    for (const node of harmonyNodes) {
      if (visited.has(node.id)) continue;

      const cluster = [node];
      visited.add(node.id);

      for (const other of harmonyNodes) {
        if (visited.has(other.id)) continue;

        const dist = this.distanceToNode(node.position, other.position);
        if (dist <= clusterDistance) {
          cluster.push(other);
          visited.add(other.id);
        }
      }

      if (cluster.length >= 2) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  /**
   * Compute cluster centroid
   */
  computeCentroid(nodes) {
    let x = 0, y = 0, z = 0;
    for (const node of nodes) {
      if (node.position) {
        x += node.position.x || 0;
        y += node.position.y || 0;
        z += node.position.z || 0;
      }
    }
    return {
      x: x / nodes.length,
      y: y / nodes.length,
      z: z / nodes.length
    };
  }

  /**
   * Compute cluster radius
   */
  computeClusterRadius(nodes) {
    const centroid = this.computeCentroid(nodes);
    let maxDist = 0;
    for (const node of nodes) {
      if (node.position) {
        const dist = this.distanceToNode(centroid, node.position);
        maxDist = Math.max(maxDist, dist);
      }
    }
    return maxDist + 1.0;
  }

  /**
   * Apply oasis zone effects
   * 
   * [PHASE 1 FIX] Writes level to node.userData.harmonyLevel (canonical)
   */
  applyOasisEffects(zone, deltaTime) {
    const allNodes = this.getAllNodes();
    const allLinks = this.getAllLinks();

    // Nodes in oasis get healing
    for (const node of zone.nodes) {
      if (node.userData) {
        // Reduce corruption
        setNodeCorruption(node, Math.max(0, (node.userData?.metrics?.corruption ?? node.userData?.corruption ?? 0) - zone.intensity * 0.01 * deltaTime), { source: 'harmony-stabilization' });
        this._emitCorruptionThreshold(node);
        // [PHASE 1 FIX] Read/Write level from/to canonical source
        const currentLevel = node.userData.harmonyLevel ?? 0;
        node.userData.harmonyLevel = Math.min(1.0, currentLevel + zone.intensity * 0.005 * deltaTime);
      }
    }

    // Slow corruption spread in oasis
    for (const link of allLinks) {
      const source = link.source || link.sourceNode;
      const target = link.target || link.targetNode;

      if (source && target && source.position && target.position) {
        const mid = {
          x: (source.position.x + target.position.x) / 2,
          y: (source.position.y + target.position.y) / 2,
          z: (source.position.z + target.position.z) / 2
        };

        const distance = this.distanceToNode(zone.centerPos, mid);
        if (distance <= zone.radius) {
          // Slow link corruption spread
          if (this.aiNodes.linkCorruption) {
            const linkData = this.aiNodes.linkCorruption.linkCorruption.get(link.id);
            if (linkData) {
              // 80% slower transmission
              linkData.level *= 0.2;
            }
          }
        }
      }
    }
  }

  /**
   * Apply visual effects to a node
   */
  applyNodeHarmonyVisuals(node, level, time = 0) {
    if (!node || !node.userData) return;

    // Initialize visual state
    if (!node.userData.harmonyVisualState) {
      node.userData.harmonyVisualState = {
        auraTint: { r: 0.2, g: 0.9, b: 0.8 },
        auraIntensity: 0,
        pulseFrequency: 2.0,
        rotationStabilization: 0,
        particleDriftDirection: { x: 0, y: 1, z: 0 }
      };
    }

    const vis = node.userData.harmonyVisualState;

    // Progressive harmony visual effects
    if (level < 0.1) {
      vis.auraIntensity = 0;
      vis.rotationStabilization = 0;
    } else if (level < 0.3) {
      // Subtle cyan aura
      vis.auraIntensity = level * 0.5;
      vis.rotationStabilization = level * 0.2;
      vis.pulseFrequency = 1.0;
    } else if (level < 0.6) {
      // Growing aura + breathing pulse
      const t = (level - 0.3) / 0.3;
      vis.auraIntensity = 0.3 + t * 0.3;
      vis.rotationStabilization = 0.1 + t * 0.3;
      const breathePulse = Math.sin(time * 2.0) * 0.1;
      vis.auraIntensity += breathePulse;
      vis.pulseFrequency = 1.5 + t * 0.5;
    } else if (level < 0.85) {
      // Strong harmonious aura
      const t = (level - 0.6) / 0.25;
      vis.auraIntensity = 0.6 + t * 0.2;
      vis.rotationStabilization = 0.4 + t * 0.3;
      const breathePulse = Math.sin(time * 2.5) * 0.15;
      vis.auraIntensity = Math.min(1.0, vis.auraIntensity + breathePulse);
      vis.pulseFrequency = 2.0 + t * 0.5;
    } else {
      // Anchor state: brilliant harmony
      vis.auraIntensity = 1.0;
      vis.rotationStabilization = 0.8;
      const anchorPulse = Math.sin(time * 3.0) * 0.2;
      vis.auraIntensity = Math.min(1.0, 0.8 + anchorPulse);
      vis.pulseFrequency = 3.0;
    }

    // Clamp values
    vis.auraIntensity = Math.max(0, Math.min(1, vis.auraIntensity));
    vis.rotationStabilization = Math.max(0, Math.min(1, vis.rotationStabilization));
    
    // Store for shader/visual integration
    // Mirror canonical harmony -> userData for visual consumers
    const canonicalHarmony = (typeof node?.harmony === 'number') ? node.harmony : level;
    node.userData.harmonyLevel = canonicalHarmony;
    if (!PHASE_C3_METRIC_WRITE_LOCK && node.userData.harmonyLevel !== undefined) {
      
    }
    node.userData.isHarmonized = level > 0.2;
  }

  /**
   * Apply visual effects to a link
   */
  applyLinkHarmonyVisuals(link, level, time = 0) {
    if (!link || !link.userData) return;

    if (!link.userData.harmonyVisualState) {
      link.userData.harmonyVisualState = {
        ribbonColor: { r: 0.3, g: 0.9, b: 0.8 },
        ribbonIntensity: 0,
        waveFrequency: 1.0,
        waveAmplitude: 0.2,
        particleDirection: 'resonance' // resonance vs one-direction
      };
    }

    const vis = link.userData.harmonyVisualState;

    // Progressive harmony link effects
    if (level < 0.1) {
      vis.ribbonIntensity = 0;
    } else if (level < 0.4) {
      // Flowing light ribbon
      vis.ribbonIntensity = level * 0.6;
      vis.waveFrequency = 1.5;
      vis.waveAmplitude = 0.15;
    } else if (level < 0.7) {
      // Active resonance waves
      const t = (level - 0.4) / 0.3;
      vis.ribbonIntensity = 0.3 + t * 0.5;
      vis.waveFrequency = 1.5 + t * 1.5;
      vis.waveAmplitude = 0.15 + t * 0.2;
      vis.particleDirection = 'resonance';
    } else {
      // Strong harmony flows
      vis.ribbonIntensity = Math.min(1.0, 0.8 + Math.sin(time * 2.0) * 0.2);
      vis.waveFrequency = 3.0;
      vis.waveAmplitude = 0.35;
    }

    vis.ribbonIntensity = Math.max(0, Math.min(1, vis.ribbonIntensity));
    
    // Mirror canonical harmony -> userData for visual consumers
    const canonicalHarmony = (typeof link?.harmony === 'number') ? link.harmony : level;
    link.userData.harmonyLevel = canonicalHarmony;
    if (!PHASE_C3_METRIC_WRITE_LOCK && link.userData.harmonyLevel !== undefined) {
      
    }
  }

  /**
   * Manually set node harmony level
   * 
   * [PHASE 1 FIX] Writes to node.userData.harmonyLevel (canonical)
   */
  setNodeHarmony(node, level) {
    const harmonyData = this.initializeNodeHarmony(node);
    const clampedLevel = Math.max(0, Math.min(1, level));
    
    // [PHASE 1 FIX] Write to canonical source
    node.userData.harmonyLevel = clampedLevel;
    
    // harmonyData exists for transient state only
  }

  /**
   * Manually set link harmony level
   * 
   * [PHASE 1 FIX] Writes to link.userData.harmonyLevel (canonical)
   */
  setLinkHarmony(link, level) {
    const harmonyData = this.initializeLinkHarmony(link);
    const clampedLevel = Math.max(0, Math.min(1, level));
    
    // [PHASE 1 FIX] Write to canonical source
    link.userData.harmonyLevel = clampedLevel;
    
    // harmonyData exists for transient state only
  }

  /**
   * Get all nodes
   */
  getAllNodes() {
    if (!this.aiNodes) return [];

    if (Array.isArray(this.aiNodes.nodes)) {
      return this.aiNodes.nodes;
    }
    if (this.aiNodes.allNodes && Array.isArray(this.aiNodes.allNodes)) {
      return this.aiNodes.allNodes;
    }
    if (this.aiNodes.nodesByCategory) {
      const allNodes = [];
      // Try to get all categories
      for (const category of ['root', 'core', 'extended']) {
        const nodes = this.aiNodes.nodesByCategory(category);
        if (nodes) allNodes.push(...nodes);
      }
      return allNodes;
    }

    return [];
  }

  /**
   * Get all links
   */
  getAllLinks() {
    if (!this.linkSystem) return [];

    if (this.linkSystem.allLinks && Array.isArray(this.linkSystem.allLinks)) {
      return this.linkSystem.allLinks;
    }
    if (this.linkSystem.links && Array.isArray(this.linkSystem.links)) {
      return this.linkSystem.links;
    }
    if (this.linkSystem.linksBySourceId) {
      const allLinks = [];
      for (const sourceLinks of this.linkSystem.linksBySourceId.values()) {
        allLinks.push(...sourceLinks);
      }
      return allLinks;
    }

    return [];
  }

  /**
   * Get inbound links to a node
   */
  getInboundLinks(node) {
    if (!node || !this.linkSystem) return [];

    if (this.linkSystem.linksByTargetId && this.linkSystem.linksByTargetId.has(node.id)) {
      return Array.from(this.linkSystem.linksByTargetId.get(node.id));
    }
    if (Array.isArray(this.linkSystem.allLinks)) {
      return this.linkSystem.allLinks.filter(l => 
        (l.target?.id === node.id || l.targetNode?.id === node.id)
      );
    }

    return [];
  }

  /**
   * Get outbound links from a node
   */
  getOutboundLinks(node) {
    if (!node || !this.linkSystem) return [];

    if (this.linkSystem.linksBySourceId && this.linkSystem.linksBySourceId.has(node.id)) {
      return Array.from(this.linkSystem.linksBySourceId.get(node.id));
    }
    if (Array.isArray(this.linkSystem.allLinks)) {
      return this.linkSystem.allLinks.filter(l => 
        (l.source?.id === node.id || l.sourceNode?.id === node.id)
      );
    }

    return [];
  }

  /**
   * Distance calculation helper
   */
  distanceToNode(pos1, pos2) {
    if (!pos1 || !pos2) return 999;

    const dx = (pos1.x || 0) - (pos2.x || 0);
    const dy = (pos1.y || 0) - (pos2.y || 0);
    const dz = (pos1.z || 0) - (pos2.z || 0);

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Get harmony info for a node
   * 
   * [PHASE 1 FIX] Reads level from node.userData.harmonyLevel (canonical)
   */
  getNodeHarmonyInfo(node) {
    const harmonyData = this.nodeHarmony.get(node.id) || this.initializeNodeHarmony(node);
    if (!harmonyData) return null;

    // [PHASE 1 FIX] Read level from canonical source
    const level = node.userData.harmonyLevel ?? 0;
    const isAnchor = node.userData.isHarmonyAnchor ?? false;
    const pulseActive = node.userData.anchorPulseActive ?? false;

    return {
      nodeId: harmonyData.nodeId,
      harmonyLevel: level.toFixed(3),
      velocity: harmonyData.velocity.toFixed(3),
      isAnchor: isAnchor,
      pulseActive: pulseActive
    };
  }

  /**
   * Setup console API for debugging
   */
  setupConsoleAPI() {
    window.harmonyDebug = {
      // Set node harmony
      setHarmony: (node, value) => {
        this.setNodeHarmony(node, value);
        console.log(`[HarmonyStabilization] Node harmony set to ${value.toFixed(3)}`);
      },

      // Trigger harmony pulse
      pulse: (node) => {
        this.triggerHarmonyPulse(node);
        console.log(`[HarmonyStabilization] Pulse triggered from node`);
      },

      // Fully cleanse a node
      cleanseNode: (node) => {
        if (node.userData) {
          setNodeCorruption(node, 0, { source: 'harmony-stabilization' });
          this._emitCorruptionThreshold(node);
        }
        this.setNodeHarmony(node, 1.0);
        console.log(`[HarmonyStabilization] Node cleansed`);
      },

      // Cleanse a link
      cleanseLink: (link) => {
        this.setLinkHarmony(link, 1.0);
        if (this.aiNodes.linkCorruption) {
          this.aiNodes.linkCorruption.setLinkCorruption(link, 0);
        }
        console.log(`[HarmonyStabilization] Link cleansed`);
      },

      // Create oasis zone around node
      createOasis: (node) => {
        this.setNodeHarmony(node, 0.9);
        const outboundLinks = this.getOutboundLinks(node);
        for (const link of outboundLinks) {
          this.setLinkHarmony(link, 0.8);
        }
        console.log(`[HarmonyStabilization] Oasis zone created`);
      },

      // Get network harmony stats
      networkHarmonyStats: () => {
        const allNodes = this.getAllNodes();
        const allLinks = this.getAllLinks();

        let totalNodeHarmony = 0;
        let totalLinkHarmony = 0;
        let maxNodeHarmony = 0;
        let anchors = 0;

        // [PHASE 1 FIX] Read from canonical source (userData)
        for (const node of allNodes) {
          const level = node.userData?.harmonyLevel ?? 0;
          totalNodeHarmony += level;
          maxNodeHarmony = Math.max(maxNodeHarmony, level);
          if (node.userData?.isHarmonyAnchor ?? false) anchors++;
        }

        for (const link of allLinks) {
          const level = link.userData?.harmonyLevel ?? 0;
          totalLinkHarmony += level;
        }

        const stats = {
          totalNodes: allNodes.length,
          trackedNodes: this.nodeHarmony.size,
          averageNodeHarmony: allNodes.length > 0 ? totalNodeHarmony / allNodes.length : 0,
          maxNodeHarmony: maxNodeHarmony,
          harmonyAnchors: anchors,
          totalLinks: allLinks.length,
          trackedLinks: this.linkHarmony.size,
          averageLinkHarmony: allLinks.length > 0 ? totalLinkHarmony / allLinks.length : 0,
          activePulses: this.activePulses.length,
          oasisZones: this.oasisZones.size
        };

        console.table(stats);
        return stats;
      },

      // Toggle debug
      toggleDebug: () => {
        this.debugMode = !this.debugMode;
        console.log(`[HarmonyStabilization] Debug mode: ${this.debugMode}`);
      },

      // Get network harmony level (average harmony across all nodes)
      // [PHASE 1 FIX] Reads from canonical source (userData)
      getNetworkHarmony: () => {
        const allNodes = this.aiNodes?.nodes || [];
        if (allNodes.length === 0) return 0;

        let totalHarmony = 0;

        for (const node of allNodes) {
          // [PHASE 1 FIX] Read from canonical source
          const harmony = node.userData?.harmonyLevel ?? node.userData?.harmony ?? 0;
          totalHarmony += harmony;
        }

        // Return average harmony (0-1 scale)
        return totalHarmony / allNodes.length;
      }
    };

    console.log('%c[HarmonyStabilizationSystem_v1] Debug API ready at window.harmonyDebug', 'color: #00ff00;');
  }

  _emitCorruptionThreshold(node) {
    if (!node?.userData) return;
    const prev = node.userData._prevCorruption ?? 0;
    const current = node.userData?.metrics?.corruption ?? node.userData?.corruption ?? 0;
    const THRESHOLD = 0.7;
    if (prev < THRESHOLD && current >= THRESHOLD) {
      this.multiNetworkManager?.emitEvent?.({
        type: 'corruptionThresholdCrossed',
        node,
        value: current,
        timestamp: Date.now()
      });
    }
    node.userData._prevCorruption = current;
  }

  /**
   * Rebind system references after world switch
   * Updates aiNodes and linkSystem to prevent stale references
   */
  rebind({ linkingSystem, aiNodes, semanticBus }) {
    if (linkingSystem !== undefined) {
      this.linkSystem = linkingSystem;
    }
    if (aiNodes !== undefined) {
      this.aiNodes = aiNodes;
    }
    // semanticBus is not used directly in this system, but we accept it for consistency
    // debugMode is not updated during rebind to preserve original state
  }
}

export default HarmonyStabilizationSystem_v1;
