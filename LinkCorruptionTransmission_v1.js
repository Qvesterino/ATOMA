/**
 * LINK CORRUPTION TRANSMISSION SYSTEM v1.0 — COMPLETE 5-PHASE SYSTEM
 * 
 * Sophisticated corruption propagation system with dual feedback loops and emergent resonance.
 * Simulates corruption spreading through network connections with cascading visual feedback.
 * 
 * PHASE ARCHITECTURE:
 * - Phase 1: Synergy blocks corruption (defense)
 * - Phase 2: Harmony blocks corruption (suppression)
 * - Phase 3: Harmony actively heals corruption (restoration)
 * - Phase 3b: Healing increases Harmony (self-reinforcing)
 * - Phase 4-lite: Blocking increases Synergy (defensive mastery)
 * - Phase 5: Synergy+Harmony Resonance amplifies effects in dense networks
 * 
 * Features:
 * - Dynamic link-level corruption tracking (0-1 scale)
 * - Transmission rate computation based on archetype synergy
 * - Cascading infection thresholds (0.45, 0.65, 0.85)
 * - Progressive visual effects tied to corruption level
 * - Dual self-reinforcing feedback loops (Healing↔Harmony, Blocking↔Synergy)
 * - Emergent resonance zones where high Synergy and Harmony co-exist
 * - Full THREE.js safe mode compatibility
 * - Non-breaking integration with existing systems
 * 
 * Integration:
 * - Works with ArchetypeGameplayEffects_v1 for gameplay rules
 * - Works with CorruptionVisualFX_v1 for visual rendering
 * - Non-breaking patches to existing link system
 * - 5-point cascade system with thresholds
 * 
 * Gameplay Rules:
 * - Sigma/Prime archetypes REDUCE spread (0.3x-0.5x multiplier)
 * - Chaos/Error archetypes ACCELERATE spread (1.5x-2.0x multiplier)
 * - Quantum archetypes add UNPREDICTABILITY (random bursts)
 * - Corruption spreads higher → lower nodes (asymmetric)
 * - Harmony tags BLOCK transmission (synergy walls)
 * - Well-defended dense networks activate resonance (emergent amplification)
 */

import { applyMetricImpulse, setMetric } from './src/metrics/NodeMetricEngine.js';

// === THREE SAFE LOADER ===
let THREE_SAFE = null;
THREE_SAFE =
  (typeof window !== 'undefined' && window.THREE) ||
  (typeof globalThis !== 'undefined' && globalThis.THREE) ||
  null;

const THREE = THREE_SAFE;

// Phase C.3: metric impulse emission is gated by this flag for quieter mode.
// Core corruption/integrity propagation still updates canonical maps and syncs `link.userData`.
const PHASE_C3_METRIC_WRITE_LOCK = true;
 
/**
 * Cascade threshold definitions
 */
const CASCADE_THRESHOLDS = {
  DISTORTION_ACTIVATE: 0.45,    // Shader distortion begins
  PARTICLE_BURST: 0.65,          // Directional particles emit
  CASCADE_EVENT: 0.85,            // Wave animation + node impact
  INFECTION_BEGIN: 0.60,          // Begin infecting target
  RAPID_BURST: 0.85,              // Rapid transmission burst
  INFECTION_COMPLETE: 1.0         // Immediate corruption pulse
};

/**
 * [Phase 2] Harmony blocking thresholds (0-1 scale)
 * Used for Harmony-based corruption suppression
 */
const HARMONY_BLOCKING_THRESHOLDS = {
  DAMP_BEGIN: 0.4,                // Corruption damping starts
  BLOCK_START: 0.8,               // Corruption blocking begins
  BLOCK_COMPLETE: 1.0             // Full blocking (harmony anchor)
};

/**
 * [Phase 3] Harmony healing cascade thresholds
 * Used for Harmony-driven active corruption healing and reversal
 */
const HARMONY_HEALING_THRESHOLDS = {
  HEALING_TRIGGER: 0.85,          // Harmony level required to trigger healing
  BASE_HEAL_RATE: 0.05,           // Base healing rate per second (much slower than corruption spread)
  CASCADE_STRENGTH_DECAY: 0.5,    // Cascade strength decays 50% per hop
  MAX_CASCADE_DEPTH: 3,           // Maximum cascade hops (2-3 recommended)
  MIN_CASCADE_STRENGTH: 0.01,     // Stop cascade if strength falls below this
  HEALING_HISTORY_SIZE: 100       // Track recent heals for debugging
};

/**
 * [Phase 3b] Harmony feedback loop thresholds
 * Used for self-reinforcing harmony growth from successful healing
 */
const HARMONY_FEEDBACK_THRESHOLDS = {
  FEEDBACK_FACTOR: 0.02,          // Very small reinforcement: 2% of healed amount → harmony gain
  FEEDBACK_COOLDOWN_MS: 500,      // Minimum ms between harmony gains per link (prevents spam)
  HARMONY_MAX: 1.0,               // Hard cap on harmony (prevent runaway)
  ENABLED: true                   // Can disable feedback loop for testing
};

/**
 * [Phase 4-lite] Synergy feedback loop thresholds
 * Used for defensive mastery: successful blocking improves synergy
 */
const SYNERGY_FEEDBACK_THRESHOLDS = {
  ENABLED: true,                  // Can disable feedback loop for testing
  SYNERGY_MAX: 100,               // Hard cap on synergy (0-100 scale)
  FEEDBACK_FACTOR: 0.08,          // Small reinforcement: 8% of blocked fraction → synergy gain
  FEEDBACK_COOLDOWN_MS: 600,      // Minimum ms between synergy gains per link (prevents spam)
  MIN_BLOCK_EFFECT: 0.15,         // Must block at least 15% to qualify for feedback
  HARD_BLOCK_BONUS: 0.12,         // Extra bonus when multiplier = 0.0 (complete block)
  HISTORY_LIMIT: 100              // Track recent synergy gains for debugging
};

/**
 * [Phase 5] Synergy-Harmony Resonance Amplification thresholds
 * Used for emergent resonance: high Synergy + Harmony co-existence amplifies effects in dense networks
 */
const RESONANCE_THRESHOLDS = {
  ENABLED: true,                  // Can disable resonance for testing
  MIN_DENSE_NEIGHBORS: 3,         // Minimum neighbors to qualify as dense region (3-4 typical)
  SYNERGY_RESONANCE_THRESHOLD: 75, // Average synergy must be >= 75 to activate resonance (0-100 scale)
  HARMONY_RESONANCE_THRESHOLD: 0.75, // Average harmony must be >= 0.75 to activate resonance (0-1 scale)
  RESONANCE_STRENGTH: 0.05,       // Base resonance amplification strength (+5%)
  RESONANCE_MAX: 1.15,            // Hard cap on resonance multiplier (never exceed +15%)
  HISTORY_LIMIT: 100              // Track recent resonance events for debugging
};

/**
 * [Phase 5b] Adjacent Synergy Resonance Amplification thresholds
 * Used for local coherence: high-synergy links amplify each other in neighborhoods
 */
const ADJACENT_SYNERGY_THRESHOLDS = {
  ENABLED: true,                  // Can disable adjacent resonance for testing
  SYNERGY_ADJACENT_THRESHOLD: 80, // Neighbors with synergy >= 80 qualify (+0-100 scale)
  ADJACENT_SYNERGY_BONUS: 0.01,  // Bonus per high-synergy neighbor (+1% each)
  ADJACENT_SYNERGY_MAX: 0.05,     // Hard cap on adjacent bonus (+5% maximum)
  HISTORY_LIMIT: 100              // Track recent adjacent resonance events for debugging
};

/**
 * [Phase 5c] Cascade Resonance thresholds
 * Used for directional healing amplification: resonance-weighted decay in healing cascades
 */
const CASCADE_RESONANCE_THRESHOLDS = {
  ENABLED: true,                  // Can disable cascade resonance for testing
  BASE_CASCADE_DECAY: 0.5,        // Default cascade decay (50% per hop)
  DECAY_MIN: 0.35,                // Hard minimum decay (0.35 = 65% healing transmission)
  DECAY_MAX: 0.6,                 // Hard maximum decay (0.6 = 40% healing transmission)
  HISTORY_LIMIT: 100              // Track cascade resonance events for debugging
};

/**
 * [Phase 5d] Threat Cascade thresholds
 * Used for bidirectional resonance: corruption also travels further through resonant zones under threat
 */
const THREAT_CASCADE_THRESHOLDS = {
  ENABLED: true,                  // Can disable threat cascade for testing
  THREAT_ACTIVATION_LEVEL: 0.5,   // Corruption level required to activate threat cascade (50%)
  BASE_THREAT_DECAY: 0.5,         // Default threat cascade decay (50% per hop)
  DECAY_MIN: 0.35,                // Hard minimum decay (0.35 = 65% threat transmission)
  DECAY_MAX: 0.6,                 // Hard maximum decay (0.6 = 40% threat transmission)
  HISTORY_LIMIT: 100              // Track threat cascade events for debugging
};

/**
 * [LINK INTEGRITY MODEL] Link Integrity / Stability thresholds
 * Used for corruption consequences: integrity degradation, unstable zone, hard collapse
 */
const LINK_INTEGRITY_THRESHOLDS = {
  ENABLED: true,                  // Can disable integrity model for testing
  INTEGRITY_MAX: 100,             // Maximum integrity (100%)
  INTEGRITY_MIN: 0,               // Minimum integrity (0%, collapsed)
  
  // Integrity degradation based on corruption level
  CORRUPTION_SAFE_THRESHOLD: 0.4, // Below 40% corruption: no degradation
  CORRUPTION_WARNING_LOW: 0.4,    // Start of warning zone
  CORRUPTION_WARNING_HIGH: 0.75,  // End of warning zone
  CORRUPTION_CRITICAL: 0.75,      // Above 75%: accelerated degradation
  
  // Degradation rates (% per second)
  DEGRADATION_SAFE: 0.0,          // No loss below 40% corruption
  DEGRADATION_WARNING: 0.8,       // 0.8% per second when corruption 40-75%
  DEGRADATION_CRITICAL: 2.5,      // 2.5% per second when corruption >75%
  
  // Unstable zone thresholds
  UNSTABLE_ZONE_HIGH: 15,         // Upper bound of unstable zone (15%)
  UNSTABLE_ZONE_LOW: 8,           // Lower bound of unstable zone (8%)
  COLLAPSE_THRESHOLD: 8,          // Hard collapse at ≤8%
  
  // Network stress multiplier (nearby corrupted links accelerate degradation)
  STRESS_MULTIPLIER_PER_CORRUPTED_NEIGHBOR: 0.1, // +10% per corrupted neighbor
  MAX_STRESS_MULTIPLIER: 2.0,     // Hard cap on stress (never exceed 2x)
  
  // Healing interaction
  HEALING_STABILIZATION_RATE: 0.02, // Healing adds 2% integrity per 1% corruption healed (in unstable zone only)
  HEALING_NORMAL_RATE: 0.015,     // Normal healing adds 1.5% integrity per 3% corruption healed (above collapse)
  HEALING_CANNOT_RESURRECT: true, // Healing blocked if link is collapsed
  
  // History tracking
  HISTORY_LIMIT: 100              // Track integrity changes for debugging
};

/**
 * [Phase 6] Link Reconstruction thresholds
 * Used for post-collapse recovery: manual rebuild of destroyed links
 */
const LINK_RECONSTRUCTION_THRESHOLDS = {
  ENABLED: true,                  // Can disable reconstruction for testing
  
  // Reconstruction eligibility (required conditions)
  REBUILD_HARMONY_REQUIREMENT: 0.85,  // Harmony must be ≥ 0.85 to rebuild
  REBUILD_SYNERGY_REQUIREMENT: 70,    // Synergy must be ≥ 70 to rebuild (0-100 scale)
  REBUILD_NETWORK_STRESS_MAX: 0.3,    // Network stress must be ≤ 0.3 (0-1 scale)
  
  // Reconstruction result (post-rebuild state)
  REBUILD_INTEGRITY_RESTORED: 35,     // Link reconstructed to 35% integrity (enters unstable)
  REBUILD_CORRUPTION_INITIAL: 0.3,    // Link starts with 30% corruption
  REBUILD_STATE: 'unstable',          // Link enters unstable state (not healthy)
  
  // Cooldown & safeguards
  REBUILD_COOLDOWN_MS: 5000,          // Cannot rebuild same link for 5 seconds after rebuild
  REBUILD_COST_HARMONY_CONSUMED: 0.1, // Rebuilding consumes 0.1 harmony (10% cost)
  REBUILD_COST_SYNERGY_CONSUMED: 5,   // Rebuilding consumes 5 synergy points
  
  // Escalating costs (optional: for multiple rebuilds)

  REBUILD_COST_ESCALATION_FACTOR: 1.1,   // 10% cost increase per rebuild (multiplicative)
  REBUILD_COUNTER_PER_LINK: true,        // Track rebuild count per link
  
  // History tracking
  HISTORY_LIMIT: 100                  // Track reconstruction events for debugging
};

/**
 * [Phase 7] Preventative Barriers thresholds
 * Used for stress dampening: barriers reduce how fast network stress accumulates under load
 * Barriers do NOT prevent collapse, block corruption, or affect healing/resonance
 */
const PREVENTATIVE_BARRIERS_THRESHOLDS = {
  ENABLED: true,                      // Can disable barriers for testing
  
  // Barrier effect on stress accumulation
  BARRIER_DAMPENING_PER_BARRIER: 0.15, // Each barrier reduces stress delta by 15%
  BARRIER_DAMPENING_MAX: 0.4,          // Hard cap on total dampening (never exceed 40% reduction)
  
  // Barrier scope (what barriers affect)
  AFFECT_STRESS_ACCUMULATION: true,    // ✅ Reduce stress delta growth
  AFFECT_CORRUPTION: false,            // ❌ Do NOT affect corruption values
  AFFECT_INTEGRITY: false,             // ❌ Do NOT affect integrity decay
  AFFECT_HEALING: false,               // ❌ Do NOT affect healing rate
  AFFECT_RESONANCE: false,             // ❌ Do NOT affect resonance amplification
  AFFECT_COLLAPSE: false,              // ❌ Do NOT prevent collapse
  AFFECT_RECONSTRUCTION: false,        // ❌ Do NOT modify rebuild eligibility
  
  // Barrier properties
  BARRIER_INFLUENCE_RADIUS: 1.0,       // Barriers affect neighbors within 1 hop (local only)
  BARRIER_STACK_RULE: 'additive',      // Multiple barriers stack additively then clamp
  
  // History tracking
  HISTORY_LIMIT: 100                   // Track barrier dampening events for debugging
};

/**
 * [Phase 7b] Barrier Deployment Costs thresholds
 * Used for resource consumption: placing barriers costs Harmony and Synergy
 * Barriers remain powerful but are now strategic investments with upkeep
 */
const BARRIER_DEPLOYMENT_COSTS = {
  ENABLED: true,                        // Can disable Phase 7b for testing (reverts to free barriers)
  
  // One-time deployment cost
  HARMONY_COST_PER_DEPLOYMENT: 0.1,     // 10% harmony per barrier deployment
  SYNERGY_COST_PER_DEPLOYMENT: 5,       // 5 synergy points per barrier deployment
  
  // Optional periodic upkeep (prevents permanent stacking)
  UPKEEP_ENABLED: true,                 // Enable periodic upkeep consumption
  UPKEEP_INTERVAL_MS: 30000,            // Check upkeep every 30 seconds
  HARMONY_UPKEEP_PER_INTERVAL: 0.02,    // 2% harmony per upkeep interval
  
  // Scaling cost (anti-spam: nearby barriers increase deployment cost)
  COST_SCALING_ENABLED: true,           // Enable cost scaling with nearby barriers
  NEARBY_BARRIER_RADIUS_HOPS: 2,        // Look 2 hops away for nearby barriers
  COST_SCALER_PER_BARRIER: 0.25,        // 25% cost increase per nearby barrier
  COST_SCALER_MAX: 1.0,                 // Hard cap: cost can be at most 2x (100% increase)
  
  // Barrier state tracking
  BARRIER_STATE_TRACKING: true,         // Track active/inactive state
  BARRIER_MAX_UPKEEP_DEBT: 10,          // Maximum missed upkeep intervals before barrier becomes inactive
  
  // History tracking
  HISTORY_LIMIT: 100                    // Track deployment/upkeep events for debugging
};

/**
 * ====================================================================
 * CATEGORY-AWARE PROPAGATION RATES (NEW SYSTEM)
 * ====================================================================
 * Node category influences how fast synergy, corruption, and harmony
 * propagate through network connections.
 * 
 * Rate multipliers modulate deltaTime in existing transmission logic.
 * Default multiplier = 1.0 (baseline behavior, no change).
 */

/**
 * CORRUPTION PROPAGATION RATE by source → target category combination
 * Higher = corruption spreads faster
 * Applied to corruptionIncrease calculation in updateLinkCorruption()
 */
const CORRUPTION_PROPAGATION_RATES = {
  // Default fallback: baseline rate for unknown categories
  default: 1.0,
  
  // From input nodes: corruption spreads fast
  input: {
    to_input: 1.3,        // Input→Input: chains quickly
    to_process: 1.2,      // Input→Process: fast spread
    to_integration: 1.0,  // Input→Integration: normal (integration resists)
    to_analytics: 0.8,    // Input→Analytics: slow (analytics resists)
    to_storage: 0.6,      // Input→Storage: very slow (storage highly resistant)
    to_control: 1.1,      // Input→Control: fast
    default: 1.2
  },
  
  // From process nodes: baseline spread
  process: {
    to_input: 1.1,
    to_process: 1.0,
    to_integration: 0.9,
    to_analytics: 0.9,
    to_storage: 0.7,
    to_control: 1.0,
    default: 1.0
  },
  
  // From integration nodes: corruption spreads slow (natural defense)
  integration: {
    to_input: 1.0,
    to_process: 0.9,
    to_integration: 0.8,  // Integration→Integration: suppressed
    to_analytics: 0.85,
    to_storage: 0.65,
    to_control: 0.9,
    default: 0.9
  },
  
  // From analytics nodes: corruption spreads slow (observability defense)
  analytics: {
    to_input: 0.9,
    to_process: 0.85,
    to_integration: 0.8,
    to_analytics: 0.8,    // Analytics→Analytics: slow chains
    to_storage: 0.6,
    to_control: 0.85,
    default: 0.85
  },
  
  // From storage nodes: all propagation slowed (inert stability)
  storage: {
    to_input: 0.7,
    to_process: 0.7,
    to_integration: 0.65,
    to_analytics: 0.65,
    to_storage: 0.5,      // Storage→Storage: very slow
    to_control: 0.7,
    default: 0.7
  },
  
  // From control nodes: moderate spread (balance)
  control: {
    to_input: 1.0,
    to_process: 1.0,
    to_integration: 0.9,
    to_analytics: 0.85,
    to_storage: 0.7,
    to_control: 1.0,
    default: 1.0
  }
};

/**
 * HARMONY PROPAGATION RATE by source → target category combination
 * Higher = harmony spreads faster
 * Applied to harmony transmission/healing logic
 */
const HARMONY_PROPAGATION_RATES = {
  // Default fallback
  default: 1.0,
  
  // From input nodes: harmony spreads slow (input destabilizes)
  input: {
    to_input: 0.7,
    to_process: 0.8,
    to_integration: 0.85,
    to_analytics: 0.9,
    to_storage: 0.75,
    to_control: 0.85,
    default: 0.8
  },
  
  // From process nodes: baseline harmony spread
  process: {
    to_input: 0.9,
    to_process: 1.0,
    to_integration: 1.05,
    to_analytics: 1.0,
    to_storage: 0.9,
    to_control: 1.0,
    default: 1.0
  },
  
  // From integration nodes: harmony spreads very fast (harmony hub)
  integration: {
    to_input: 1.1,
    to_process: 1.15,
    to_integration: 1.2,  // Integration→Integration: healing chains
    to_analytics: 1.15,
    to_storage: 1.1,
    to_control: 1.15,
    default: 1.15
  },
  
  // From analytics nodes: harmony spreads normally (stabilizing)
  analytics: {
    to_input: 1.0,
    to_process: 1.0,
    to_integration: 1.05,
    to_analytics: 1.0,    // Analytics→Analytics: stable chains
    to_storage: 0.95,
    to_control: 1.0,
    default: 1.0
  },
  
  // From storage nodes: harmony spreads slowly (inert)
  storage: {
    to_input: 0.8,
    to_process: 0.85,
    to_integration: 0.9,
    to_analytics: 0.85,
    to_storage: 0.7,      // Storage→Storage: very slow
    to_control: 0.85,
    default: 0.85
  },
  
  // From control nodes: harmony spreads at good rate (regulator)
  control: {
    to_input: 1.05,
    to_process: 1.0,
    to_integration: 1.1,
    to_analytics: 1.0,
    to_storage: 0.95,
    to_control: 1.0,
    default: 1.0
  }
};

/**
 * SYNERGY PROPAGATION RATE by source → target category combination
 * Higher = synergy spreads faster
 * Applied to synergy transmission/feedback logic
 */
const SYNERGY_PROPAGATION_RATES = {
  // Default fallback
  default: 1.0,
  
  // From input nodes: synergy spreads slowly (input volatile)
  input: {
    to_input: 0.8,
    to_process: 0.9,
    to_integration: 0.95,
    to_analytics: 1.0,
    to_storage: 0.85,
    to_control: 0.9,
    default: 0.9
  },
  
  // From process nodes: baseline synergy spread
  process: {
    to_input: 0.95,
    to_process: 1.0,
    to_integration: 1.0,
    to_analytics: 1.0,
    to_storage: 0.9,
    to_control: 1.0,
    default: 1.0
  },
  
  // From integration nodes: synergy spreads fast (coherence hub)
  integration: {
    to_input: 1.05,
    to_process: 1.1,
    to_integration: 1.15,  // Integration→Integration: synergy chains
    to_analytics: 1.05,
    to_storage: 1.0,
    to_control: 1.1,
    default: 1.1
  },
  
  // From analytics nodes: synergy spreads normally (stabilizing)
  analytics: {
    to_input: 1.0,
    to_process: 1.0,
    to_integration: 1.05,
    to_analytics: 1.0,    // Analytics→Analytics: stable synergy
    to_storage: 0.9,
    to_control: 1.0,
    default: 1.0
  },
  
  // From storage nodes: synergy spreads slowly (inert)
  storage: {
    to_input: 0.85,
    to_process: 0.9,
    to_integration: 0.95,
    to_analytics: 0.9,
    to_storage: 0.8,      // Storage→Storage: very slow
    to_control: 0.9,
    default: 0.9
  },
  
  // From control nodes: synergy spreads well (regulator strength)
  control: {
    to_input: 1.0,
    to_process: 1.0,
    to_integration: 1.1,
    to_analytics: 1.0,
    to_storage: 0.95,
    to_control: 1.0,
    default: 1.0
  }
};

/**
 * [Phase 5 Axis 1] Inter-Network Stress Coupling thresholds
 * Used for ecological inter-network dynamics: stress propagates between adjacent networks
 * High corruption in one network slightly increases ambient stress in neighboring networks,
 * creating environmental pressure but NOT new stats or feedback loops.
 */
const STRESS_COUPLING_THRESHOLDS = {
  ENABLED: true,                        // Can disable stress coupling for testing
  
  // Coupling mechanism
  COUPLING_FACTOR: 0.05,                // 5% of neighbor stress couples to each network
  MAX_AMBIENT_INJECTION_PER_FRAME: 0.02, // Hard cap: max 2% stress injection per frame
  
  // Distance dampening (network hops)
  DISTANCE_DAMPENING: {
    1: 1.0,                             // 1 hop: 100% effect
    2: 0.5,                             // 2 hops: 50% effect
    3: 0.2,                             // 3 hops: 20% effect
    4: 0.0                              // 4+ hops: 0% effect (decoupled)
  },
  
  // Ambient stress decay (natural dissipation)
  DECAY_PER_FRAME: 0.15,                // 15% multiplicative decay per frame (~4 frame half-life)
  DECAY_MIN: 0.0001,                    // Stop tracking when stress drops below this
  
  // Safety & monitoring
  SAMPLE_INTERVAL_MS: 100,              // Sample neighbor stress every 100ms
  HISTORY_LIMIT: 100,                   // Track coupling events for debugging
  
  // Effects (how ambient stress impacts gameplay)
  STRESS_TO_EMERGENCE_MULTIPLIER: 0.5   // Each 0.1 ambient stress → 5% more corruption emergence
};

/**
 * [Phase 5 Axis 2] Inter-Network Healing Contention thresholds
 * Used for ecological resource contention: simultaneous healing in same region reduces efficiency
 * Multiple networks competing for healing "attention" in the same area experience diminished returns.
 * Healing never fails — it only becomes less efficient under contention pressure.
 */
const HEALING_CONTENTION_THRESHOLDS = {
  ENABLED: true,                        // Can disable healing contention for testing
  
  // Contention detection
  SPATIAL_RANGE_HOPS: 2,                // Contention detected within 2 hops (adjacent healing)
  TEMPORAL_WINDOW_MS: 350,              // Overlapping healing within 350ms counts as contention
  MIN_CONTENDERS: 2,                    // Need 2+ networks to trigger contention
  
  // Efficiency formula: effectiveHealing = baseHealing × (1 / (1 + factor × (contenders - 1)))
  CONTENTION_FACTOR: 0.10,              // 10% efficiency loss per additional contender (tunable)
  MIN_EFFICIENCY: 0.60,                 // Hard floor: healing always at least 60% effective
  
  // Performance & monitoring
  CONTENTION_HISTORY_LIMIT: 100,        // Track recent contentions for debugging
  
  // No memory or escalation
  // Contention penalties:
  //   - Apply only during temporal/spatial overlap
  //   - Disappear immediately when overlap ends
  //   - Never stack or accumulate
  //   - Symmetric across all contending networks
};

/**
 * HEALING CONTENTION FORMULA
 * 
 * When N networks heal simultaneously in overlapping regions:
 * 
 * effectiveHealing = baseHealing × (1 / (1 + 0.10 × (N - 1)))
 * 
 * Examples (with 0.10 contention factor):
 *   1 network:  1.0 / (1 + 0.10 × 0) = 100% efficiency
 *   2 networks: 1.0 / (1 + 0.10 × 1) = ~91% efficiency
 *   3 networks: 1.0 / (1 + 0.10 × 2) = ~83% efficiency
 *   4 networks: 1.0 / (1 + 0.10 × 3) = ~77% efficiency
 *   10 networks: 1.0 / (1 + 0.10 × 9) = ~53% → clamped to 60% (min floor)
 * 
 * All penalties apply ONLY during temporal/spatial overlap.
 * No memory, no escalation, no permanent effects.
 */

/**
 * LINK CORRUPTION TRANSMISSION ENGINE
 */
export class LinkCorruptionTransmission_v1 {
  /**
   * @param {Object} aiNodes - AINodes instance
   * @param {Object} linkSystem - Link system (NodeLinkingSystem, etc.)
   * @param {Boolean} debugMode - Enable debug logging
   */
  constructor(aiNodes, linkSystem, debugMode = false) {
    this.aiNodes = aiNodes;
    this.linkSystem = linkSystem;
    this.debugMode = debugMode;

    // Link-level corruption tracking
    this.linkCorruption = new Map(); // link -> { level: 0-1, cascade: [], events: [] }
    
    // Cascade state tracking
    this.activeCascades = new Map(); // link -> { thresholds crossed, animation state }
    this.cascadeHistory = []; // Track recent cascades for debugging
    
    // Performance
    this.updateInterval = 1 / 60;
    this.lastUpdateTime = 0;
    this.transmissionQueue = [];
    
    // Cache for archetype profiles
    this.archetypeProfiles = null;
    
    // [Phase 3] Healing cascade tracking
    this.activeHealingCascades = new Map(); // Track in-progress healing cascades
    this.healingHistory = []; // Track recent heals for debugging
    this.healingEnabled = true; // Can be disabled for testing
    
    // [Phase 3b] Harmony feedback loop tracking
    this.harmonyFeedbackLastTime = new Map(); // Track last harmony gain time per link (cooldown prevention)
    this.harmonyGrowthHistory = []; // Track harmony gains from healing feedback
    this.harmonyFeedbackEnabled = true; // Can be disabled for testing
    
    // [Phase 4-lite] Synergy feedback loop tracking
    this.synergyFeedbackLastTime = new Map(); // Track last synergy gain time per link (cooldown prevention)
    this.synergyGrowthHistory = []; // Track synergy gains from successful blocking
    this.synergyFeedbackEnabled = true; // Can be disabled for testing
    
    // [Phase 5] Resonance amplification tracking
    this.resonanceHistory = []; // Track resonance zone activations for debugging
    this.resonanceEnabled = true; // Can be disabled for testing
    this.linkNeighborCache = new Map(); // Cache neighbors for O(1) density checks
    this.linkNeighborCacheTime = new Map(); // Track cache age (invalidate periodically)
    
    // [Phase 5b] Adjacent synergy resonance tracking
    this.adjacentResonanceHistory = []; // Track adjacent synergy resonance events for debugging
    this.adjacentResonanceEnabled = true; // Can be disabled for testing
    
    // [Phase 5c] Cascade resonance tracking
    this.cascadeResonanceHistory = []; // Track cascade resonance events for debugging
    this.cascadeResonanceEnabled = true; // Can be disabled for testing
    
    // [Phase 5d] Threat cascade tracking
    this.threatCascadeHistory = []; // Track threat cascade events for debugging
    this.threatCascadeEnabled = true; // Can be disabled for testing
    
    // [LINK INTEGRITY MODEL] Link integrity tracking
    this.linkIntegrity = new Map(); // link -> { integrity: 0-100, state: 'healthy'|'unstable'|'collapsed', history: [] }
    this.integrityHistory = []; // Track integrity changes for debugging
    this.integrityEnabled = LINK_INTEGRITY_THRESHOLDS.ENABLED;
    this.collapsedLinks = new Set(); // Track permanently collapsed links for quick lookup
    
    // [Phase 6] Link reconstruction tracking
    this.linkReconstruction = new Map(); // link -> { rebuildCount: 0, lastRebuildTime: 0, canRebuild: true }
    this.reconstructionHistory = []; // Track rebuild events for debugging
    this.reconstructionEnabled = LINK_RECONSTRUCTION_THRESHOLDS.ENABLED;
    this.linkRebuildCooldowns = new Map(); // link -> last rebuild timestamp (for cooldown)
    
    // [Phase 7] Preventative barriers tracking
    this.barrierCache = new Map(); // link/node -> { hasBarrier: bool, barrierStrength: 0-1 }
    this.barrierDampeningHistory = []; // Track barrier dampening events for debugging
    this.barriersEnabled = PREVENTATIVE_BARRIERS_THRESHOLDS.ENABLED;
    this.barrierCacheTime = new Map(); // Track cache age for invalidation
    
    // [Phase 7b] Barrier deployment costs tracking
    this.barrierCostTracking = new Map(); // link/node -> { harmonyInvested, synergyInvested, isActive, lastUpkeepTime, upkeepDebt }
    this.barrierDeploymentHistory = []; // Track deployment/upkeep events for debugging
    this.barrierUpkeepEnabled = BARRIER_DEPLOYMENT_COSTS.UPKEEP_ENABLED;
    this.lastNetworkUpkeepCheck = 0; // Track when upkeep was last checked network-wide
    
    // [Phase 5 Axis 1] Inter-Network Stress Coupling tracking
    this.ambientStressPerNetwork = new Map(); // network/node -> ambient_stress (0-1, temporary, decays)
    this.stressCouplingHistory = []; // Track coupling events for debugging
    this.stressCouplingEnabled = STRESS_COUPLING_THRESHOLDS.ENABLED;
    this.lastStressCouplingUpdate = 0; // Track when coupling was last sampled
    this.networkAdjacencyCache = new Map(); // Cache network adjacencies for O(1) lookups
    this.networkAdjacencyCacheTime = 0; // Track cache age for invalidation
    
    // [Phase 5 Axis 2] Inter-Network Healing Contention tracking
    this.recentHealingEvents = []; // Track recent heals for contention detection (circular buffer)
    this.contentionHistory = []; // Track contention events for debugging
    this.contentionEnabled = HEALING_CONTENTION_THRESHOLDS.ENABLED;
    this.activeContentionPenalties = new Map(); // healingEventId -> contentionMultiplier (temporary)

    // Safety guards to prevent traversal amplification
    this.maxCascadeDepth = 8;
    this._visitedLinks = new Set();
    
    if (this.debugMode) {
      console.log('%c[LinkCorruptionTransmission_v1] Initialized', 'color: #ff00ff; font-weight: bold;');
      this.setupConsoleAPI();
    }
  }

  /**
   * Read canonical link synergy as 0–100 percentage.
   * Falls back to 0 if missing.
   * @private
   */
  _getLinkSynergyPct(link) {
    const score =
      Number.isFinite(link?.userData?.synergy?.score) ? link.userData.synergy.score : 0;
    return Math.max(0, Math.min(100, score * 100));
  }

  /**
   * Write canonical link synergy (percentage input 0–100).
   * Updates both score and synergyNorm in canonical object.
   * @private
   */
  _setLinkSynergyPct(link, value) {
    if (!link) return 0;

    const clamped = Math.max(0, Math.min(100, value));
    return clamped;
  }

  /**
   * Initialize link if not already tracked
   */
  initializeLink(link) {
    if (!link || !link.userData) return null;

    const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;
    
    if (!this.linkCorruption.has(linkId)) {
      this.linkCorruption.set(linkId, {
        level: 0,
        velocity: 0,
        lastUpdateTime: Date.now(),
        cascadeThresholdsCrossed: new Set(),
        cascadeEvents: [],
        link: link,
        linkId: linkId
      });
    }
    
    // [LINK INTEGRITY MODEL] Initialize integrity on first link creation
    if (!this.linkIntegrity.has(linkId)) {
      this.linkIntegrity.set(linkId, {
        integrity: LINK_INTEGRITY_THRESHOLDS.INTEGRITY_MAX, // Start at 100%
        state: 'healthy', // 'healthy' | 'unstable' | 'collapsed'
        history: [],
        lastIntegrityUpdateTime: Date.now(),
        lastIntegrityValue: LINK_INTEGRITY_THRESHOLDS.INTEGRITY_MAX
      });
    }

    return this.linkCorruption.get(linkId);
  }

  /**
   * Keep link.userData metrics aligned with the canonical corruption/integrity maps.
   * Overrides allow forcing values when the canonical data has been cleared.
   */
  _syncLinkUserDataMetrics(link, overrides = {}) {
    if (!link || !link.userData) return null;

    const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;
    const corruptionData = this.linkCorruption.get(linkId);
    const integrityData = this.linkIntegrity.get(linkId);

    const corruptionLevel = overrides.corruptionLevel ?? corruptionData?.level ?? 0;
    const integrity = overrides.integrity ?? integrityData?.integrity ?? LINK_INTEGRITY_THRESHOLDS.INTEGRITY_MAX;
    const integrityState = overrides.integrityState ?? integrityData?.state ?? 'healthy';

    link.userData.metrics = link.userData.metrics || {};
    link.userData.metrics.corruption = corruptionLevel;
    link.userData.metrics.integrity = integrity;
    link.userData.metrics.integrityState = integrityState;

    return { corruptionLevel, integrity, integrityState };
  }

  /**
   * Main update loop - call once per frame
   */
  updateTransmission(deltaTime = 1/60) {
    if (!this.aiNodes) return;

    // Reset per-tick traversal guard
    this._visitedLinks = new Set();

    // Update all links
    const allLinks = this.getAllLinks();
    if (!allLinks || allLinks.length === 0) return;

    for (const link of allLinks) {
      const linkId = link?.id ?? link?.uuid;
      if (linkId !== undefined && this._visitedLinks.has(linkId)) {
        continue;
      }
      if (linkId !== undefined) {
        this._visitedLinks.add(linkId);
      }

      this.updateLinkCorruption(link, deltaTime);
      
      // [Phase 3] Apply healing cascade if enabled
      if (this.healingEnabled) {
        this.applyHealingCascade(link, deltaTime);
      }
      
      // [LINK INTEGRITY MODEL] Update link integrity degradation
      if (this.integrityEnabled) {
        this.updateLinkIntegrity(link, deltaTime);
      }
    }

    // Process cascade events
    this.processCascadeEvents();
  }

  /**
   * Update corruption level for a single link
   */
  updateLinkCorruption(link, deltaTime) {
    const linkData = this.initializeLink(link);
    if (!linkData) return;

    const sourceNode = link.source || link.sourceNode;
    const targetNode = link.target || link.targetNode;
    
    if (!sourceNode || !targetNode) return;
    if (targetNode && sourceNode && (targetNode.id ?? targetNode.uuid) === (sourceNode.id ?? sourceNode.uuid)) return;

    // Compute transmission rate based on:
    // 1. Source node corruption level
    // 2. Archetype compatibility
    // 3. Link synergy profile
    const transmissionRate = this.computeTransmissionRate(sourceNode, targetNode, link);
    
    // [CATEGORY-AWARE] Apply category-based corruption propagation multiplier
    const corruptionCategoryMultiplier = this.getCorruptionPropagationMultiplier(sourceNode, targetNode);
    const adjustedTransmissionRate = transmissionRate * corruptionCategoryMultiplier;

    // Update link corruption level with smooth lerp
    const sourceCorruption =
      sourceNode?.userData?.metrics?.corruption ??
      sourceNode?.userData?.corruption ??
      sourceNode?.corruption ??
      0;
    const semanticBus = globalThis?.semanticBus;
    if (sourceCorruption > 0.6 && semanticBus?.emit) {
      semanticBus.emit('metric:corruptionRise', {
        nodeId: sourceNode.id,
        corruption: sourceCorruption,
        position: sourceNode?.position
          ? { x: sourceNode.position.x, y: sourceNode.position.y, z: sourceNode.position.z }
          : undefined
      });
    }
    // Corruption spreads from higher → lower
    const corruptionDifference = Math.max(0, sourceCorruption - linkData.level);
    
    // [HARMONY RESISTANCE SCALING] Apply harmony-based corruption resistance
    // Higher source node harmony → lower corruption transmission rate
    // Formula: harmonyResistance = 1.0 - min(harmony * 0.5, 0.5)
    // Mapping: harmony 0.0 → 100%, 0.5 → 75%, 1.0 → 50% (minimum)
    const harmony = sourceNode.userData?.harmonyLevel ?? 0;
    const harmonyResistance = 1.0 - Math.min(harmony * 0.5, 0.5);
    
    // Apply transmission rate * time step (now with category multiplier + harmony resistance)
    const corruptionIncrease = corruptionDifference * adjustedTransmissionRate * harmonyResistance * deltaTime * 0.1;
    
    // Smooth update
    linkData.level = Math.min(1.0, linkData.level + corruptionIncrease);
    linkData.velocity = corruptionIncrease / (deltaTime + 0.001);
    linkData.lastUpdateTime = Date.now();

    // Relaxation decay to prevent permanent link corruption accumulation.
    // Runs after propagation update every cycle.
    const DECAY_RATE = 0.05;
    const decayedLevel = Math.max(0, linkData.level - DECAY_RATE * deltaTime);
    linkData.level = decayedLevel;

    // Check cascade thresholds
    this.checkCascadeThresholds(link, linkData);

    // Apply visual effects
    this.applyLinkCorruptionVisuals(link, linkData.level, Date.now() / 1000);
    this._syncLinkUserDataMetrics(link);
  }

  /**
   * [LINK INTEGRITY MODEL] Update link integrity degradation
   * 
   * Integrity degrades based on corruption level:
   * - < 40% corruption: No degradation (safe zone)
   * - 40-75% corruption: -0.8%/sec degradation
   * - > 75% corruption: -2.5%/sec degradation
   * 
   * Network stress multiplier accelerates degradation (nearby corrupted links):
   * - +10% per corrupted neighbor (max 2x multiplier)
   * 
   * States:
   * - Healthy (>15%): Normal operations
   * - Unstable (15-8%): Warning zone, healing can stabilize
   * - Collapsed (≤8%): Permanent dissolution, no healing possible
   */
  updateLinkIntegrity(link, deltaTime) {
    const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;
    
    // Initialize if needed
    this.initializeLink(link);
    
    const integrityData = this.linkIntegrity.get(linkId);
    const corruptionData = this.linkCorruption.get(linkId);
    
    if (!integrityData || !corruptionData) return;
    
    // Skip if already collapsed
    if (this.collapsedLinks.has(linkId)) {
      integrityData.state = 'collapsed';
      this._syncLinkUserDataMetrics(link);
      return;
    }
    
    const corruptionLevel = corruptionData.level; // 0-1 scale
    let degradationRate = 0; // % per second
    
    // Determine degradation rate based on corruption level
    if (corruptionLevel >= LINK_INTEGRITY_THRESHOLDS.CORRUPTION_CRITICAL) {
      // > 75% corruption: accelerated degradation
      degradationRate = LINK_INTEGRITY_THRESHOLDS.DEGRADATION_CRITICAL;
    } else if (corruptionLevel >= LINK_INTEGRITY_THRESHOLDS.CORRUPTION_WARNING_LOW) {
      // 40-75% corruption: steady degradation
      degradationRate = LINK_INTEGRITY_THRESHOLDS.DEGRADATION_WARNING;
    }
    // else: < 40% corruption: no degradation
    
    // [NETWORK STRESS] Count nearby corrupted links to amplify degradation
    let stressMultiplier = 1.0;
    if (degradationRate > 0) {
      const sourceNode = link.source || link.sourceNode;
      const targetNode = link.target || link.targetNode;
      
      if (sourceNode && targetNode) {
        let corruptedNeighbors = 0;
        
        // Check source node's links
        if (sourceNode.userData?.links) {
          for (const neighborLink of sourceNode.userData.links) {
            if (neighborLink === link) continue;
            const neighborLinkId = neighborLink.id || `${neighborLink.source?.id || 'unknown'}-${neighborLink.target?.id || 'unknown'}`;
            const neighborCorruption = this.linkCorruption.get(neighborLinkId);
            if (neighborCorruption && neighborCorruption.level >= 0.3) { // Moderate corruption threshold
              corruptedNeighbors++;
            }
          }
        }
        
        // Check target node's links
        if (targetNode.userData?.links) {
          for (const neighborLink of targetNode.userData.links) {
            if (neighborLink === link) continue;
            const neighborLinkId = neighborLink.id || `${neighborLink.source?.id || 'unknown'}-${neighborLink.target?.id || 'unknown'}`;
            const neighborCorruption = this.linkCorruption.get(neighborLinkId);
            if (neighborCorruption && neighborCorruption.level >= 0.3) { // Moderate corruption threshold
              corruptedNeighbors++;
            }
          }
        }
        
        // Apply stress multiplier (clamped to 2x max)
        stressMultiplier = Math.min(
          LINK_INTEGRITY_THRESHOLDS.MAX_STRESS_MULTIPLIER,
          1.0 + (corruptedNeighbors * LINK_INTEGRITY_THRESHOLDS.STRESS_MULTIPLIER_PER_CORRUPTED_NEIGHBOR)
        );
      }
    }
    
    // Apply degradation
    const integrityLoss = (degradationRate * stressMultiplier) * deltaTime;
    const newIntegrity = Math.max(0, integrityData.integrity - integrityLoss);
    
    // Update state machine
    const oldState = integrityData.state;
    if (newIntegrity <= LINK_INTEGRITY_THRESHOLDS.COLLAPSE_THRESHOLD) {
      // HARD COLLAPSE
      integrityData.state = 'collapsed';
      this.collapsedLinks.add(linkId);
      
      if (this.debugMode && oldState !== 'collapsed') {
        console.log('%c[LINK INTEGRITY] COLLAPSE', 'color: #ff4444; font-weight: bold;', {
          linkId,
          integrity: integrityData.integrity.toFixed(1),
          corruption: corruptionLevel.toFixed(2),
          stressMultiplier: stressMultiplier.toFixed(2)
        });
      }
    } else if (newIntegrity <= LINK_INTEGRITY_THRESHOLDS.UNSTABLE_ZONE_HIGH &&
               newIntegrity > LINK_INTEGRITY_THRESHOLDS.UNSTABLE_ZONE_LOW) {
      // UNSTABLE ZONE (warning state)
      integrityData.state = 'unstable';
      
      if (this.debugMode && oldState === 'healthy') {
        console.log('%c[LINK INTEGRITY] UNSTABLE', 'color: #ffcc00; font-weight: bold;', {
          linkId,
          integrity: integrityData.integrity.toFixed(1),
          corruption: corruptionLevel.toFixed(2)
        });
      }
    } else if (newIntegrity > LINK_INTEGRITY_THRESHOLDS.UNSTABLE_ZONE_HIGH) {
      // HEALTHY state
      integrityData.state = 'healthy';
      
      if (this.debugMode && oldState !== 'healthy') {
        console.log('%c[LINK INTEGRITY] RECOVERED', 'color: #00ff88; font-weight: bold;', {
          linkId,
          integrity: integrityData.integrity.toFixed(1)
        });
      }
    }
    
    // Store previous value and update
    integrityData.lastIntegrityValue = integrityData.integrity;
    integrityData.integrity = newIntegrity;
    integrityData.lastIntegrityUpdateTime = Date.now();
    
    // Track history for debugging
    if (this.integrityHistory.length < LINK_INTEGRITY_THRESHOLDS.HISTORY_LIMIT) {
      this.integrityHistory.push({
        linkId,
        timestamp: Date.now(),
        integrity: newIntegrity,
        state: integrityData.state,
        corruption: corruptionLevel,
        stressMultiplier,
        degradationRate
      });
    }

    this._syncLinkUserDataMetrics(link);
  }

  /**
   * [Phase 6] Check if link can be rebuilt
   * 
   * Requirements:
   * 1. Link must be collapsed (integrity ≤ COLLAPSE_THRESHOLD)
   * 2. Source node harmony ≥ REBUILD_HARMONY_REQUIREMENT (0.85)
   * 3. Link synergy ≥ REBUILD_SYNERGY_REQUIREMENT (70)
   * 4. Network stress ≤ REBUILD_NETWORK_STRESS_MAX (0.3)
   * 5. Not in rebuild cooldown
   * 
   * @param {Object} link - Link to check for rebuilding
   * @returns {Object} { canRebuild: boolean, reason?: string, costHarmony?: number, costSynergy?: number }
   */
  canRebuildLink(link) {
    if (!link || !LINK_RECONSTRUCTION_THRESHOLDS.ENABLED || !this.reconstructionEnabled) {
      return { canRebuild: false, reason: 'Reconstruction system disabled' };
    }

    const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;
    
    // Requirement 1: Link must be collapsed
    if (!this.collapsedLinks.has(linkId)) {
      return { canRebuild: false, reason: 'Link is not collapsed' };
    }
    
    const integrityData = this.linkIntegrity.get(linkId);
    if (!integrityData || integrityData.state !== 'collapsed') {
      return { canRebuild: false, reason: 'Link integrity not in collapsed state' };
    }

    // Requirement 2: Check harmony level
    const sourceNode = link.source || link.sourceNode;
    if (!sourceNode) {
      return { canRebuild: false, reason: 'Source node missing' };
    }
    
    const harmony = sourceNode.userData?.harmonyLevel ?? 0;
    if (harmony < LINK_RECONSTRUCTION_THRESHOLDS.REBUILD_HARMONY_REQUIREMENT) {
      return {
        canRebuild: false,
        reason: `Harmony too low (${harmony.toFixed(2)} < ${LINK_RECONSTRUCTION_THRESHOLDS.REBUILD_HARMONY_REQUIREMENT})`
      };
    }

    // Requirement 3: Check synergy level
    const synergy = this._getLinkSynergyPct(link);
    if (synergy < LINK_RECONSTRUCTION_THRESHOLDS.REBUILD_SYNERGY_REQUIREMENT) {
      return {
        canRebuild: false,
        reason: `Synergy too low (${synergy.toFixed(0)} < ${LINK_RECONSTRUCTION_THRESHOLDS.REBUILD_SYNERGY_REQUIREMENT})`
      };
    }

    // Requirement 4: Check network stress
    const networkStress = this.computeNetworkStress();
    if (networkStress > LINK_RECONSTRUCTION_THRESHOLDS.REBUILD_NETWORK_STRESS_MAX) {
      return {
        canRebuild: false,
        reason: `Network stress too high (${networkStress.toFixed(2)} > ${LINK_RECONSTRUCTION_THRESHOLDS.REBUILD_NETWORK_STRESS_MAX})`
      };
    }

    // Requirement 5: Check cooldown
    const lastRebuildTime = this.linkRebuildCooldowns.get(linkId) || 0;
    const timeSinceRebuild = Date.now() - lastRebuildTime;
    if (timeSinceRebuild < LINK_RECONSTRUCTION_THRESHOLDS.REBUILD_COOLDOWN_MS) {
      const cooldownRemaining = (LINK_RECONSTRUCTION_THRESHOLDS.REBUILD_COOLDOWN_MS - timeSinceRebuild) / 1000;
      return {
        canRebuild: false,
        reason: `Rebuild in cooldown (${cooldownRemaining.toFixed(1)}s remaining)`
      };
    }

    // Calculate costs
    let harmonyCost = LINK_RECONSTRUCTION_THRESHOLDS.REBUILD_COST_HARMONY_CONSUMED;
    let synergyCost = LINK_RECONSTRUCTION_THRESHOLDS.REBUILD_COST_SYNERGY_CONSUMED;

    // Apply cost escalation if enabled
    if (LINK_RECONSTRUCTION_THRESHOLDS.REBUILD_COST_ESCALATION_ENABLED) {
      const reconstructionData = this.linkReconstruction.get(linkId);
      const rebuildCount = reconstructionData?.rebuildCount || 0;
      if (rebuildCount > 0) {
        const escalationMultiplier = Math.pow(
          LINK_RECONSTRUCTION_THRESHOLDS.REBUILD_COST_ESCALATION_FACTOR,
          rebuildCount
        );
        harmonyCost *= escalationMultiplier;
        synergyCost *= escalationMultiplier;
      }
    }

    // All requirements met
    return {
      canRebuild: true,
      costHarmony: harmonyCost,
      costSynergy: synergyCost,
      networkStress: networkStress
    };
  }

  /**
   * [Phase 6] Rebuild a collapsed link
   * 
   * Reconstruction:
   * - Restores link to PARTIAL integrity (35%, enters unstable state)
   * - Sets corruption to MODERATE baseline (30%)
   * - Link must be eligible (use canRebuildLink first)
   * - Consumes resources from source node
   * - Applies cooldown to prevent spam
   * 
   * @param {Object} link - Link to rebuild
   * @returns {Object} { success: boolean, result?: string, newIntegrity?: number, reason?: string }
   */
  rebuildCollapsedLink(link) {
    if (!link || !LINK_RECONSTRUCTION_THRESHOLDS.ENABLED || !this.reconstructionEnabled) {
      return { success: false, reason: 'Reconstruction system disabled' };
    }

    // Check if rebuild is possible
    const eligibility = this.canRebuildLink(link);
    if (!eligibility.canRebuild) {
      return { success: false, reason: eligibility.reason };
    }

    const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;
    const sourceNode = link.source || link.sourceNode;
    
    if (!sourceNode) {
      return { success: false, reason: 'Source node missing' };
    }

    // === PHASE 6 RECONSTRUCTION EVENT ===
    
    // Step 1: Update integrity (restore to partial)
    const integrityData = this.linkIntegrity.get(linkId);
    integrityData.integrity = LINK_RECONSTRUCTION_THRESHOLDS.REBUILD_INTEGRITY_RESTORED;
    integrityData.state = LINK_RECONSTRUCTION_THRESHOLDS.REBUILD_STATE;
    this.collapsedLinks.delete(linkId); // Remove from collapsed set
    
    // Step 2: Update corruption (reset to moderate baseline)
    const corruptionData = this.linkCorruption.get(linkId);
    corruptionData.level = LINK_RECONSTRUCTION_THRESHOLDS.REBUILD_CORRUPTION_INITIAL;
    corruptionData.velocity = 0; // Clear velocity
    
    // Step 3: Consume resources from source node
    const harmonyCost = eligibility.costHarmony;
    const synergyCost = eligibility.costSynergy;
    
    const sourceHarmony = sourceNode.userData?.metrics?.harmony ?? sourceNode.userData?.harmonyLevel ?? 0;
    setMetric(sourceNode, 'harmony', Math.max(0, sourceHarmony - harmonyCost), { source: 'LinkCorruptionTransmission' });
    const synergyPct = this._getLinkSynergyPct(link);
    // Read-only: no mutation of canonical synergy
    
    // Step 4: Apply cooldown
    this.linkRebuildCooldowns.set(linkId, Date.now());
    
    // Step 5: Track reconstruction
    const reconstructionData = this.linkReconstruction.get(linkId) || {
      rebuildCount: 0,
      lastRebuildTime: 0,
      canRebuild: true
    };
    reconstructionData.rebuildCount += 1;
    reconstructionData.lastRebuildTime = Date.now();
    this.linkReconstruction.set(linkId, reconstructionData);
    
    // Step 6: Record history
    if (this.reconstructionHistory.length < LINK_RECONSTRUCTION_THRESHOLDS.HISTORY_LIMIT) {
      this.reconstructionHistory.push({
        linkId,
        timestamp: Date.now(),
        rebuildCount: reconstructionData.rebuildCount,
        integrityRestored: integrityData.integrity,
        corruptionInitial: corruptionData.level,
        harmonyCost,
        synergyCost,
        networkStress: eligibility.networkStress
      });
    }

    this._syncLinkUserDataMetrics(link);

    // Debug logging
    if (this.debugMode) {
      console.log('%c[Phase 6 Link Rebuild]', 'color: #ff9933; font-weight: bold;', {
        linkId,
        rebuildCount: reconstructionData.rebuildCount,
        integrityRestored: integrityData.integrity.toFixed(1),
        corruptionInitial: corruptionData.level.toFixed(2),
        harmonyCost: harmonyCost.toFixed(2),
        synergyCost: synergyCost.toFixed(0),
        harmonyRemaining: (sourceNode.userData.metrics?.harmony ?? sourceNode.userData.harmonyLevel ?? 0).toFixed(2),
        synergyRemaining: this._getLinkSynergyPct(link).toFixed(0),
        networkStress: eligibility.networkStress.toFixed(2)
      });
    }

    return {
      success: true,
      result: 'Link successfully rebuilt',
      newIntegrity: integrityData.integrity,
      newCorruption: corruptionData.level,
      rebuildCount: reconstructionData.rebuildCount,
      resourcesCost: {
        harmony: harmonyCost.toFixed(2),
        synergy: synergyCost.toFixed(0)
      }
    };
  }

  /**
   * [Phase 6] Compute network-wide stress level
   * 
   * Used to determine if network can support rebuilds:
   * - Count of collapsed links divided by total links
   * - Scales 0.0 (no stress) to 1.0 (network critical)
   * 
   * @returns {number} Network stress level (0-1)
   */
  computeNetworkStress() {
    const allLinks = this.getAllLinks();
    if (!allLinks || allLinks.length === 0) return 0;
    
    let collapsedCount = 0;
    for (const link of allLinks) {
      const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;
      if (this.collapsedLinks.has(linkId)) {
        collapsedCount++;
      }
    }
    
    // Network stress = percentage of links that are collapsed
    return collapsedCount / allLinks.length;
  }

  /**
   * [Phase 7b] Deploy a barrier with Harmony and Synergy cost
   * 
   * Deployment:
   * - Checks if resources are sufficient
   * - Calculates base cost + scaling cost from nearby barriers
   * - Deducts resources from source node
   * - Marks barrier as active and tracks investment
   * 
   * Requirements:
   * - Phase 7b must be enabled
   * - Sufficient harmony (≥ base cost × scale factor)
   * - Sufficient synergy (≥ base cost × scale factor)
   * - Failure: deployment blocked, resources unchanged
   * 
   * @param {Object} linkOrNode - Link or node to deploy barrier on
   * @param {Object} sourceNode - Source node for resource deduction (required for harmony/synergy)
   * @returns {Object} { success: boolean, deployed: boolean, reason?: string, cost?: { harmony, synergy } }
   */
  deployBarrierWithCost(linkOrNode, sourceNode) {
    if (!linkOrNode || !BARRIER_DEPLOYMENT_COSTS.ENABLED) {
      return { success: false, deployed: false, reason: 'Phase 7b disabled or missing link/node' };
    }

    const id = linkOrNode.id || `${linkOrNode.source?.id || 'unknown'}-${linkOrNode.target?.id || 'unknown'}`;
    
    // Check if barrier already exists (can't deploy twice)
    if (this.hasBarrier(linkOrNode)) {
      return { success: false, deployed: false, reason: 'Barrier already deployed on this link/node' };
    }

    // Determine which node to deduct resources from
    let resourceNode = sourceNode;
    if (!resourceNode) {
      // Try to infer source node
      if (linkOrNode.source) {
        resourceNode = linkOrNode.source;
      } else if (linkOrNode.sourceNode) {
        resourceNode = linkOrNode.sourceNode;
      } else if (linkOrNode.userData?.source) {
        resourceNode = linkOrNode.userData.source;
      }
    }

    if (!resourceNode || !resourceNode.userData) {
      return { success: false, deployed: false, reason: 'Cannot determine source node for resource deduction' };
    }

    // === COST CALCULATION ===
    
    // Base costs
    let harmonyCost = BARRIER_DEPLOYMENT_COSTS.HARMONY_COST_PER_DEPLOYMENT;
    let synergyCost = BARRIER_DEPLOYMENT_COSTS.SYNERGY_COST_PER_DEPLOYMENT;

    // [COST SCALING] Apply scaling cost based on nearby barriers
    let costScaleFactor = 1.0;
    if (BARRIER_DEPLOYMENT_COSTS.COST_SCALING_ENABLED) {
      const nearbyBarrierCount = this.countNearbyBarriersInRadius(linkOrNode, BARRIER_DEPLOYMENT_COSTS.NEARBY_BARRIER_RADIUS_HOPS);
      if (nearbyBarrierCount > 0) {
        // Cost increases 25% per nearby barrier
        const scalingIncrease = nearbyBarrierCount * BARRIER_DEPLOYMENT_COSTS.COST_SCALER_PER_BARRIER;
        costScaleFactor = Math.min(1.0 + BARRIER_DEPLOYMENT_COSTS.COST_SCALER_MAX, 1.0 + scalingIncrease);
      }
    }

    // Apply scaling to costs
    harmonyCost *= costScaleFactor;
    synergyCost *= costScaleFactor;

    // === CHECK RESOURCES ===
    
    const currentHarmony = resourceNode.userData?.metrics?.harmony ?? resourceNode.userData?.harmonyLevel ?? 0;
    const currentSynergy = linkOrNode.synergy ?? (resourceNode.userData?.synergy ?? 0);

    if (currentHarmony < harmonyCost) {
      return {
        success: false,
        deployed: false,
        reason: `Insufficient harmony (${currentHarmony.toFixed(2)} < ${harmonyCost.toFixed(2)})`,
        cost: { harmony: harmonyCost, synergy: synergyCost }
      };
    }

    if (currentSynergy < synergyCost) {
      return {
        success: false,
        deployed: false,
        reason: `Insufficient synergy (${currentSynergy.toFixed(0)} < ${synergyCost.toFixed(0)})`,
        cost: { harmony: harmonyCost, synergy: synergyCost }
      };
    }

    // === DEPLOY BARRIER ===
    
    // Mark as barrier deployed
    linkOrNode.hasBarrier = true;
    
    // Deduct resources
    setMetric(resourceNode, 'harmony', Math.max(0, currentHarmony - harmonyCost), { source: 'LinkCorruptionTransmission' });
    if (linkOrNode.synergy !== undefined) {
      linkOrNode.synergy = Math.max(0, linkOrNode.synergy - synergyCost);
    } else {
      // Legacy synergy writes removed (read-only enforcement)
    }

    // Initialize cost tracking
    const now = Date.now();
    this.barrierCostTracking.set(id, {
      harmonyInvested: harmonyCost,
      synergyInvested: synergyCost,
      isActive: true,
      lastUpkeepTime: now,
      upkeepDebt: 0,
      deploymentTime: now,
      costScaleFactor: costScaleFactor,
      nearbyBarrierCount: BARRIER_DEPLOYMENT_COSTS.COST_SCALING_ENABLED 
        ? this.countNearbyBarriersInRadius(linkOrNode, BARRIER_DEPLOYMENT_COSTS.NEARBY_BARRIER_RADIUS_HOPS)
        : 0
    });

    // Invalidate cache
    this.barrierCacheTime.delete(id);

    // Track deployment event
    if (this.barrierDeploymentHistory.length < BARRIER_DEPLOYMENT_COSTS.HISTORY_LIMIT) {
      this.barrierDeploymentHistory.push({
        linkId: id,
        timestamp: now,
        event: 'deployment',
        harmonyCost,
        synergyCost,
        costScaleFactor,
        harmonyRemaining: resourceNode.userData.metrics?.harmony ?? resourceNode.userData.harmonyLevel ?? 0,
        synergyRemaining: currentSynergy - synergyCost,
        isActive: true
      });
    }

    // Debug logging
    if (this.debugMode) {
      console.log('%c[Phase 7b Barrier Deployment]', 'color: #00dd88; font-weight: bold;', {
        linkId: id,
        harmonyCost: harmonyCost.toFixed(2),
        synergyCost: synergyCost.toFixed(0),
        costScaleFactor: costScaleFactor.toFixed(2),
        harmonyRemaining: (resourceNode.userData.metrics?.harmony ?? resourceNode.userData.harmonyLevel ?? 0).toFixed(2),
        synergyRemaining: (currentSynergy - synergyCost).toFixed(0),
        isActive: true
      });
    }

    return {
      success: true,
      deployed: true,
      cost: {
        harmony: harmonyCost.toFixed(2),
        synergy: synergyCost.toFixed(0),
        scaleFactor: costScaleFactor.toFixed(2)
      }
    };
  }

  /**
   * [Phase 7b] Count nearby barriers within specified hop radius
   * 
   * Used for cost scaling: more barriers nearby = higher deployment cost
   * Prevents spam stacking of barriers in dense regions
   * 
   * @param {Object} linkOrNode - Link or node to check from
   * @param {Number} hopRadius - Maximum hops to search (2 = 2-hop neighborhood)
   * @returns {Number} Count of barriers within radius
   */
  countNearbyBarriersInRadius(linkOrNode, hopRadius = 2) {
    if (!linkOrNode || hopRadius < 1) {
      return 0;
    }

    const visited = new Set();
    const queue = [{ element: linkOrNode, hops: 0 }];
    let barrierCount = 0;

    while (queue.length > 0) {
      const { element, hops } = queue.shift();
      const elemId = element.id || `${element.source?.id || 'unknown'}-${element.target?.id || 'unknown'}`;

      if (visited.has(elemId)) continue;
      visited.add(elemId);

      // Check if this element has a barrier (skip self)
      if (element !== linkOrNode && this.hasBarrier(element)) {
        barrierCount++;
      }

      // Stop if at max radius
      if (hops >= hopRadius) continue;

      // Queue neighbors
      const sourceNode = element.source || element.sourceNode;
      const targetNode = element.target || element.targetNode;

      if (sourceNode) {
        const outbound = this.getOutboundLinks(sourceNode) || [];
        for (const link of outbound) {
          const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;
          if (!visited.has(linkId)) {
            queue.push({ element: link, hops: hops + 1 });
          }
        }

        const inbound = this.getInboundLinks(sourceNode) || [];
        for (const link of inbound) {
          const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;
          if (!visited.has(linkId)) {
            queue.push({ element: link, hops: hops + 1 });
          }
        }
      }

      if (targetNode && targetNode !== sourceNode) {
        const outbound = this.getOutboundLinks(targetNode) || [];
        for (const link of outbound) {
          const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;
          if (!visited.has(linkId)) {
            queue.push({ element: link, hops: hops + 1 });
          }
        }

        const inbound = this.getInboundLinks(targetNode) || [];
        for (const link of inbound) {
          const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;
          if (!visited.has(linkId)) {
            queue.push({ element: link, hops: hops + 1 });
          }
        }
      }
    }

    return barrierCount;
  }

  /**
   * [Phase 7b] Process barrier upkeep (called periodically)
   * 
   * Barriers require ongoing Harmony investment to stay active
   * If upkeep cannot be paid, barrier becomes inactive (not removed)
   * Inactive barriers can be reactivated by paying deployment cost again
   * 
   * @param {Number} deltaTime - Time since last update (in seconds)
   */
  processBarrierUpkeep(deltaTime = 1/60) {
    if (!BARRIER_DEPLOYMENT_COSTS.UPKEEP_ENABLED || !this.barrierUpkeepEnabled) {
      return;
    }

    const now = Date.now();
    const timeSinceLastCheck = now - this.lastNetworkUpkeepCheck;

    // Only check upkeep every UPKEEP_INTERVAL_MS
    if (timeSinceLastCheck < BARRIER_DEPLOYMENT_COSTS.UPKEEP_INTERVAL_MS) {
      return;
    }

    this.lastNetworkUpkeepCheck = now;

    // Iterate all tracked barriers
    for (const [id, costData] of this.barrierCostTracking.entries()) {
      if (!costData.isActive) {
        continue; // Skip inactive barriers
      }

      // Find the barrier object and its source node
      const allLinks = this.getAllLinks();
      let barrierObject = null;
      let sourceNode = null;

      for (const link of allLinks) {
        const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;
        if (linkId === id && this.hasBarrier(link)) {
          barrierObject = link;
          sourceNode = link.source || link.sourceNode;
          break;
        }
      }

      if (!barrierObject || !sourceNode || !sourceNode.userData) {
        continue; // Barrier or source node gone
      }

      // Calculate upkeep cost
      const upkeepHarmonyCost = BARRIER_DEPLOYMENT_COSTS.HARMONY_UPKEEP_PER_INTERVAL;
      const currentHarmony = sourceNode.userData?.metrics?.harmony ?? sourceNode.userData?.harmonyLevel ?? 0;

      // Check if upkeep can be paid
      if (currentHarmony >= upkeepHarmonyCost) {
        // Pay upkeep
        setMetric(sourceNode, 'harmony', Math.max(0, currentHarmony - upkeepHarmonyCost), { source: 'LinkCorruptionTransmission' });
        costData.lastUpkeepTime = now;
        costData.upkeepDebt = 0; // Reset debt

        // Track upkeep event
        if (this.barrierDeploymentHistory.length < BARRIER_DEPLOYMENT_COSTS.HISTORY_LIMIT) {
          this.barrierDeploymentHistory.push({
            linkId: id,
            timestamp: now,
            event: 'upkeep_paid',
            harmonyCost: upkeepHarmonyCost,
            harmonyRemaining: sourceNode.userData.metrics?.harmony ?? sourceNode.userData.harmonyLevel ?? 0,
            isActive: true
          });
        }
      } else {
        // Cannot pay upkeep - accumulate debt
        costData.upkeepDebt++;

        // Check if debt exceeded max
        if (costData.upkeepDebt >= BARRIER_DEPLOYMENT_COSTS.BARRIER_MAX_UPKEEP_DEBT) {
          // Deactivate barrier
          costData.isActive = false;

          // Track deactivation event
          if (this.barrierDeploymentHistory.length < BARRIER_DEPLOYMENT_COSTS.HISTORY_LIMIT) {
            this.barrierDeploymentHistory.push({
              linkId: id,
              timestamp: now,
              event: 'deactivated_upkeep_debt',
              upkeepDebt: costData.upkeepDebt,
              isActive: false
            });
          }

          if (this.debugMode) {
            console.log('%c[Phase 7b Barrier Deactivated]', 'color: #ffaa44; font-weight: bold;', {
              linkId: id,
              reason: 'Upkeep debt exceeded',
              upkeepDebt: costData.upkeepDebt
            });
          }
        } else {
          // Track missed upkeep event
          if (this.barrierDeploymentHistory.length < BARRIER_DEPLOYMENT_COSTS.HISTORY_LIMIT) {
            this.barrierDeploymentHistory.push({
              linkId: id,
              timestamp: now,
              event: 'upkeep_missed',
              upkeepDebt: costData.upkeepDebt,
              isActive: true
            });
          }
        }
      }
    }
  }

  /**
   * [Phase 7b] Get barrier deployment info
   * 
   * Returns cost data and active status for a barrier
   * 
   * @param {Object} linkOrNode - Link or node to check
   * @returns {Object|null} Deployment info or null if not tracked
   */
  getBarrierDeploymentInfo(linkOrNode) {
    if (!linkOrNode) return null;

    const id = linkOrNode.id || `${linkOrNode.source?.id || 'unknown'}-${linkOrNode.target?.id || 'unknown'}`;
    return this.barrierCostTracking.get(id) || null;
  }

  /**
   * [Phase 7] Check if link/node has a preventative barrier
   * 
   * Barriers can be flagged on:
   * - link.hasBarrier = true
   * - node.userData.hasBarrier = true
   * 
   * Returns cached value if fresh (< 100ms), otherwise recalculates
   * 
   * @param {Object} linkOrNode - Link or node to check
   * @returns {boolean} True if barrier is present and active
   */
  hasBarrier(linkOrNode) {
    if (!linkOrNode || !PREVENTATIVE_BARRIERS_THRESHOLDS.ENABLED || !this.barriersEnabled) {
      return false;
    }

    const id = linkOrNode.id || `${linkOrNode.source?.id || 'unknown'}-${linkOrNode.target?.id || 'unknown'}`;
    const now = Date.now();
    const cacheAge = now - (this.barrierCacheTime.get(id) || 0);

    // Use cache if fresh (< 100ms old)
    if (this.barrierCache.has(id) && cacheAge < 100) {
      return this.barrierCache.get(id).hasBarrier;
    }

    // Check for barrier flag
    const hasBarrier = linkOrNode.hasBarrier === true || 
                       linkOrNode.userData?.hasBarrier === true;

    // Cache result
    this.barrierCache.set(id, { hasBarrier });
    this.barrierCacheTime.set(id, now);

    return hasBarrier;
  }

  /**
   * [Phase 7] Count barriers near a link (within 1-hop radius)
   * 
   * Counts:
   * - Barrier on the link itself
   * - Barriers on source node
   * - Barriers on target node
   * - Barriers on 1-hop neighbor links
   * 
   * Used to calculate stress dampening effect
   * 
   * @param {Object} link - Link to check for nearby barriers
   * @returns {number} Count of barriers within influence radius
   */
  countNearbyBarriers(link) {
    if (!link || !PREVENTATIVE_BARRIERS_THRESHOLDS.ENABLED || !this.barriersEnabled) {
      return 0;
    }

    let barrierCount = 0;

    // Check link itself
    if (this.hasBarrier(link)) {
      barrierCount++;
    }

    const sourceNode = link.source || link.sourceNode;
    const targetNode = link.target || link.targetNode;

    // Check source node
    if (sourceNode && this.hasBarrier(sourceNode)) {
      barrierCount++;
    }

    // Check target node
    if (targetNode && this.hasBarrier(targetNode)) {
      barrierCount++;
    }

    // Check neighbor links (1-hop from source and target)
    if (sourceNode && sourceNode.userData?.links) {
      for (const neighborLink of sourceNode.userData.links) {
        if (neighborLink === link) continue; // Skip self
        if (this.hasBarrier(neighborLink)) {
          barrierCount++;
        }
      }
    }

    if (targetNode && targetNode.userData?.links) {
      for (const neighborLink of targetNode.userData.links) {
        if (neighborLink === link) continue; // Skip self
        if (this.hasBarrier(neighborLink)) {
          barrierCount++;
        }
      }
    }

    return barrierCount;
  }

  /**
   * [Phase 7] Calculate stress dampening effect
   * 
   * Barriers reduce how fast network stress accumulates:
   * - Each barrier provides 15% dampening
   * - Multiple barriers stack additively
   * - Hard cap at 40% maximum dampening
   * 
   * Formula:
   *   totalDampening = min(
   *     barrierCount × BARRIER_DAMPENING_PER_BARRIER,
   *     BARRIER_DAMPENING_MAX
   *   )
   * 
   * @param {Object} link - Link to check for barrier dampening
   * @returns {number} Dampening factor (0.0 = no effect, 0.4 = max 40% reduction)
   */
  calculateStressDampening(link) {
    if (!link || !PREVENTATIVE_BARRIERS_THRESHOLDS.ENABLED || !this.barriersEnabled) {
      return 0;
    }

    const barrierCount = this.countNearbyBarriers(link);

    if (barrierCount === 0) {
      return 0; // No dampening without barriers
    }

    // Calculate dampening: additive stacking with hard cap
    const totalDampening = Math.min(
      barrierCount * PREVENTATIVE_BARRIERS_THRESHOLDS.BARRIER_DAMPENING_PER_BARRIER,
      PREVENTATIVE_BARRIERS_THRESHOLDS.BARRIER_DAMPENING_MAX
    );

    return totalDampening;
  }

  /**
   * [Phase 7] Apply stress dampening to a delta value
   * 
   * Reduces stress delta without modifying existing stress state
   * Pure dampening: never reduces stress, only slows its growth
   * 
   * Formula:
   *   effectiveDelta = rawDelta × (1 - totalDampening)
   * 
   * Example:
   *   rawDelta = 0.1, dampening = 0.3 (30%)
   *   effectiveDelta = 0.1 × 0.7 = 0.07 (30% reduction)
   * 
   * @param {number} rawStressDelta - Raw stress increase (positive only)
   * @param {Object} link - Link to check for barrier context
   * @returns {number} Effective stress delta after dampening
   */
  applyStressDampening(rawStressDelta, link) {
    if (rawStressDelta <= 0 || !link || !PREVENTATIVE_BARRIERS_THRESHOLDS.ENABLED || !this.barriersEnabled) {
      return rawStressDelta; // No dampening on non-positive deltas
    }

    const dampening = this.calculateStressDampening(link);
    if (dampening <= 0) {
      return rawStressDelta; // No barriers, no dampening
    }

    const effectiveDelta = rawStressDelta * (1 - dampening);

    // Track dampening event for debugging
    if (this.barrierDampeningHistory.length < PREVENTATIVE_BARRIERS_THRESHOLDS.HISTORY_LIMIT) {
      this.barrierDampeningHistory.push({
        linkId: link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`,
        timestamp: Date.now(),
        rawStressDelta,
        barrierCount: this.countNearbyBarriers(link),
        dampening,
        effectiveDelta,
        reduction: ((1 - (effectiveDelta / rawStressDelta)) * 100).toFixed(1) + '%'
      });
    }

    if (this.debugMode && Math.random() < 0.01) {
      console.log('[Phase 7 Stress Dampening]', {
        rawDelta: rawStressDelta.toFixed(3),
        barrierCount: this.countNearbyBarriers(link),
        dampening: (dampening * 100).toFixed(1) + '%',
        effectiveDelta: effectiveDelta.toFixed(3)
      });
    }

    return effectiveDelta;
  }

  /**
   * Compute transmission rate for a link
   * 
   * Based on:
   * - Source node corruption
   * - Archetype profiles (sigma/prime reduce, chaos/error accelerate)
   * - Link synergy tags
   * - Quantum weirdness (random variance)
   * - [T1-003] Synergy blocking: high-synergy links block corruption spread
   */
  computeTransmissionRate(sourceNode, targetNode, link) {
    let baseRate = 0.5; // Base spread rate per second

    // Get archetype profiles if available
    if (!this.archetypeProfiles && this.aiNodes.archetypeProfiles) {
      this.archetypeProfiles = this.aiNodes.archetypeProfiles;
    }

    // Source archetype effects
    if (sourceNode.userData?.archetype && this.archetypeProfiles) {
      const sourceProfile = this.archetypeProfiles[sourceNode.userData.archetype];
      if (sourceProfile) {
        // Chaos/Error accelerate transmission
        if (sourceProfile.tags?.includes('chaos') || sourceProfile.tags?.includes('error')) {
          baseRate *= 2.0;
        }
        // Prime/Sigma reduce transmission
        if (sourceProfile.tags?.includes('prime') || sourceProfile.tags?.includes('sigma')) {
          baseRate *= 0.3;
        }
        // Quantum adds unpredictability
        if (sourceProfile.tags?.includes('quantum')) {
          baseRate *= (0.5 + Math.random() * 1.5); // 0.5x to 2.0x
        }
      }
    }

    // Target archetype effects (resistance)
    if (targetNode.userData?.archetype && this.archetypeProfiles) {
      const targetProfile = this.archetypeProfiles[targetNode.userData.archetype];
      if (targetProfile) {
        // Prime/Sigma provide resistance
        if (targetProfile.tags?.includes('prime') || targetProfile.tags?.includes('sigma')) {
          baseRate *= 0.5;
        }
        // Harmony tags block transmission
        if (targetProfile.tags?.includes('harmony')) {
          baseRate *= 0.2;
        }
        // Chaos attracts corruption
        if (targetProfile.tags?.includes('chaos')) {
          baseRate *= 1.5;
        }
      }
    }

    // [T1-003] SYNERGY BLOCKING: High-synergy links block corruption spread
    // READ-ONLY: Read from existing synergy value (0-100 scale)
    // No computation, purely wiring existing metric
    const synergy = this._getLinkSynergyPct(link); // Expected range: 0–100
    
    // [T1-004] HARMONY → SYNERGY AMPLIFICATION: Temporary effectiveness boost
    // READ-ONLY: Read from harmony, apply ONLY to consumption logic
    // No persistence, no feedback, fully reversible per-frame
    const harmonyForAmplification = link.userData?.harmonyLevel ?? sourceNode?.userData?.harmonyLevel ?? 0;
    let effectiveSynergy = synergy;
    
    // Harmony amplifies synergy effectiveness in stable zones
    const HARMONY_SYNERGY_THRESHOLD = 0.7;  // Harmony must be >= 0.7 to amplify
    const HARMONY_SYNERGY_MULTIPLIER = 1.3; // Boost effective synergy by 30% when harmony is high
    
    if (harmonyForAmplification >= HARMONY_SYNERGY_THRESHOLD) {
      effectiveSynergy *= HARMONY_SYNERGY_MULTIPLIER;
    }
    
    // Compute synergy blocking multiplier using EFFECTIVE synergy (harmony-boosted)
    let synergyBlockMultiplier = 1.0;
    
    // HARD BLOCK: effective synergy >= 85 completely blocks corruption
    if (effectiveSynergy >= 85) {
      synergyBlockMultiplier = 0.0;
      
      // TEMPORARY DEBUG LOG (marked for removal)
      if (Math.random() < 0.01) {
        console.log('[Corruption BLOCKED by SYNERGY]', {
          linkId: link.id,
          synergy: synergy.toFixed(1),
          effectiveSynergy: effectiveSynergy.toFixed(1),
          harmony: harmonyForAmplification.toFixed(2),
          corruption: (link.userData?.corruptionLevel || 0).toFixed(3)
        });
      }
    }
    // SOFT DAMPING: effective synergy 60-85 gradually reduces transmission
    else if (effectiveSynergy >= 60) {
      // Linear interpolation: synergy 60→1.0, synergy 85→0.0
      synergyBlockMultiplier = 1.0 - ((effectiveSynergy - 60) / 25);
    }
    
    // Apply synergy blocking multiplier to base rate
    baseRate *= synergyBlockMultiplier;

    // [Phase 2] HARMONY BLOCKING: Harmony stabilization counters corruption spread
    // READ-ONLY: Read from existing harmony value (0-1 scale)
    // No computation, purely wiring existing metric from HarmonyStabilizationSystem_v1
    const harmony = link.userData?.harmonyLevel ?? sourceNode?.userData?.harmonyLevel ?? 0; // Expected range: 0–1
    
    // Compute harmony blocking multiplier
    let harmonyBlockMultiplier = 1.0;
    
    // HARD BLOCK: harmony >= 0.8 strongly suppresses corruption
    if (harmony >= HARMONY_BLOCKING_THRESHOLDS.BLOCK_START) {
      harmonyBlockMultiplier = 0.0;
      
      // TEMPORARY DEBUG LOG (marked for removal)
      if (Math.random() < 0.01) {
        console.log('[Corruption BLOCKED by HARMONY]', {
          linkId: link.id,
          harmony: harmony.toFixed(2),
          corruption: (link.userData?.corruptionLevel || 0).toFixed(3)
        });
      }
    }
    // SOFT DAMPING: harmony 0.4-0.8 gradually reduces transmission
    else if (harmony >= HARMONY_BLOCKING_THRESHOLDS.DAMP_BEGIN) {
      // Linear interpolation: harmony 0.4→1.0, harmony 0.8→0.0
      harmonyBlockMultiplier = 1.0 - ((harmony - HARMONY_BLOCKING_THRESHOLDS.DAMP_BEGIN) / 
                                      (HARMONY_BLOCKING_THRESHOLDS.BLOCK_START - HARMONY_BLOCKING_THRESHOLDS.DAMP_BEGIN));
    }
    
    // Apply harmony blocking multiplier (multiplicative with synergy, not replacement)
    baseRate *= harmonyBlockMultiplier;

    // Link synergy (if available) — OLD LOGIC (kept for compatibility)
    if (link.userData?.synergy?.score !== undefined) {
      // High synergy = easier transmission
      // Low synergy = resistance
      baseRate *= (0.3 + link.userData.synergy.score * 0.7);
    }

    // [Phase 5] RESONANCE AMPLIFICATION: Network coherence enhancement
    // READ-ONLY: Compute resonance multiplier for this link's neighborhood
    // Resonance only amplifies existing blocking (Synergy + Harmony), never adds new growth
    // No direct effect on base transmission, only enhances blocking effectiveness
    let resonanceMultiplier = 1.0;
    if (this.resonanceEnabled) {
      resonanceMultiplier = this.computeResonanceAmplification(link);
    }
    
    // Apply resonance amplification to blocking effectiveness
    // When resonance is active (1.05-1.15), blocking becomes stronger
    // Formula: enhancedRate = baseRate × (blockMultiplier + (1 - blockMultiplier) × (resonance - 1.0))
    // This means: perfect blocker (0) stays 0, partial blocker gets boosted
    if (resonanceMultiplier > 1.0) {
      // Apply resonance to both synergy and harmony blocking
      synergyBlockMultiplier = Math.max(0, Math.min(1, synergyBlockMultiplier + (1 - synergyBlockMultiplier) * (resonanceMultiplier - 1.0)));
      harmonyBlockMultiplier = Math.max(0, Math.min(1, harmonyBlockMultiplier + (1 - harmonyBlockMultiplier) * (resonanceMultiplier - 1.0)));
    }
    
    // Reapply multiplicative blocking with resonance boost
    baseRate *= synergyBlockMultiplier;
    baseRate *= harmonyBlockMultiplier;

    // [Phase 4-lite] SYNERGY FEEDBACK: Defensive mastery reinforcement
    // Apply synergy feedback when synergy successfully blocks corruption
    // Only trigger if corruption pressure exists (no free synergy)
    const finalRate = Math.max(0.01, Math.min(3.0, baseRate));
    
    // Calculate corruption pressure (pre-multiplier rate)
    const pressureRate = 0.5; // Base rate before multipliers
    if (pressureRate > 0) {
      // Calculate how much blocking occurred
      const blockedFraction = 1.0 - synergyBlockMultiplier; // Synergy blocking only
      const hadHardBlock = synergyBlockMultiplier === 0.0;
      
      // Apply synergy feedback when blocking does work
      this.applySynergyFeedback(link, blockedFraction, hadHardBlock, pressureRate);
    }

    return finalRate;
  }

  /**
   * Get category-aware corruption propagation multiplier
   * @param {Object} sourceNode - Source node
   * @param {Object} targetNode - Target node
   * @returns {number} Propagation rate multiplier (default 1.0)
   */
  getCorruptionPropagationMultiplier(sourceNode, targetNode) {
    const sourceCategory = sourceNode?.userData?.category || 'process';
    const targetCategory = targetNode?.userData?.category || 'process';
    
    const sourceRates = CORRUPTION_PROPAGATION_RATES[sourceCategory] || CORRUPTION_PROPAGATION_RATES.process;
    const rate = sourceRates[`to_${targetCategory}`] ?? sourceRates.default ?? 1.0;
    
    return rate;
  }

  /**
   * Get category-aware harmony propagation multiplier
   * @param {Object} sourceNode - Source node
   * @param {Object} targetNode - Target node
   * @returns {number} Propagation rate multiplier (default 1.0)
   */
  getHarmonyPropagationMultiplier(sourceNode, targetNode) {
    const sourceCategory = sourceNode?.userData?.category || 'process';
    const targetCategory = targetNode?.userData?.category || 'process';
    
    const sourceRates = HARMONY_PROPAGATION_RATES[sourceCategory] || HARMONY_PROPAGATION_RATES.process;
    const rate = sourceRates[`to_${targetCategory}`] ?? sourceRates.default ?? 1.0;
    
    return rate;
  }

  /**
   * Get category-aware synergy propagation multiplier
   * @param {Object} sourceNode - Source node
   * @param {Object} targetNode - Target node
   * @returns {number} Propagation rate multiplier (default 1.0)
   */
  getSynergyPropagationMultiplier(sourceNode, targetNode) {
    const sourceCategory = sourceNode?.userData?.category || 'process';
    const targetCategory = targetNode?.userData?.category || 'process';
    
    const sourceRates = SYNERGY_PROPAGATION_RATES[sourceCategory] || SYNERGY_PROPAGATION_RATES.process;
    const rate = sourceRates[`to_${targetCategory}`] ?? sourceRates.default ?? 1.0;
    
    return rate;
  }

  /**
   * Check and process cascade thresholds
   * 
   * [Phase 5d] THREAT CASCADE INTEGRATION:
   * When corruption level is high enough, initiates a threat cascade
   * that propagates through connected links with resonance weighting.
   * 
   * [Tier 4.75] SYNERGY-DRIVEN CASCADE SOFTENING:
   * Higher link synergy probabilistically suppresses cascade triggering
   */
  checkCascadeThresholds(link, linkData) {
    const level = linkData.level;

    // [Tier 4.75] SYNERGY-DRIVEN STABILIZATION
    // Compute stabilization factor from link synergy
    const synergy = this._getLinkSynergyPct(link);
    const stabilization = Math.min(synergy * 0.4, 0.4);

    // Threshold progression
    const thresholds = [
      { value: CASCADE_THRESHOLDS.DISTORTION_ACTIVATE, event: 'distortion', priority: 1 },
      { value: CASCADE_THRESHOLDS.PARTICLE_BURST, event: 'particle_burst', priority: 2 },
      { value: CASCADE_THRESHOLDS.CASCADE_EVENT, event: 'cascade', priority: 3 },
      { value: CASCADE_THRESHOLDS.INFECTION_COMPLETE, event: 'infection_complete', priority: 4 }
    ];

    for (const threshold of thresholds) {
      if (level >= threshold.value && !linkData.cascadeThresholdsCrossed.has(threshold.event)) {
        // [Tier 4.75] Apply synergy-driven probabilistic suppression
        // effectiveCascadeChance = baseCascadeChance * (1 - stabilization)
        const baseCascadeChance = 1.0; // Unmodified threshold crossing
        const effectiveCascadeChance = baseCascadeChance * (1 - stabilization);
        
        // Probabilistic evaluation: suppress cascade based on synergy stabilization
        if (Math.random() > effectiveCascadeChance) {
          // Cascade suppressed by synergy stabilization
          if (this.debugMode && Math.random() < 0.1) {
            console.log(`[Tier 4.75 Synergy Stabilization] Cascade suppressed: ${threshold.event} at level ${level.toFixed(2)} (synergy: ${synergy.toFixed(1)}, stabilization: ${(stabilization * 100).toFixed(0)}%)`);
          }
          continue; // Skip this cascade event
        }
        
        linkData.cascadeThresholdsCrossed.add(threshold.event);
        
        const cascadeEvent = {
          link: link,
          linkData: linkData,
          event: threshold.event,
          level: level,
          timestamp: Date.now(),
          priority: threshold.priority,
          stabilizationApplied: stabilization // Track stabilization for handlers
        };

        linkData.cascadeEvents.push(cascadeEvent);
        this.transmissionQueue.push(cascadeEvent);

        if (this.debugMode) {
          console.log(`[LinkCorruptionTransmission] Cascade: ${threshold.event} at level ${level.toFixed(2)}`);
        }
      }
    }

    // [Phase 5d] THREAT CASCADE: When high corruption, propagate pressure through network
    if (THREAT_CASCADE_THRESHOLDS.ENABLED && this.threatCascadeEnabled) {
      if (level >= THREAT_CASCADE_THRESHOLDS.THREAT_ACTIVATION_LEVEL) {
        // [Tier 4.75] Apply synergy-driven strength attenuation to threat cascade
        // cascadeStrength *= (1 - stabilization * 0.75)
        // Maximum effect: ~30% reduction at synergy = 1.0
        const attenuatedCascadeStrength = level * (1 - stabilization * 0.75);
        this.initiateThreatCascadeFromLink(link, attenuatedCascadeStrength, 0);
      }
    }
  }

  /**
   * Process queued cascade events
   */
  processCascadeEvents() {
    while (this.transmissionQueue.length > 0) {
      const event = this.transmissionQueue.shift();
      
      switch (event.event) {
        case 'distortion':
          this.handleDistortionCascade(event);
          break;
        case 'particle_burst':
          this.handleParticleBurstCascade(event);
          break;
        case 'cascade':
          this.handleCascadeEventCascade(event);
          break;
        case 'infection_complete':
          this.handleInfectionComplete(event);
          break;
      }

      this.cascadeHistory.push(event);
      if (this.cascadeHistory.length > 100) {
        this.cascadeHistory.shift();
      }
    }
  }

  /**
   * Distortion cascade: Activate shader effects
   * [Tier 4.75] Apply synergy-driven strength attenuation
   */
  handleDistortionCascade(event) {
    const { link, linkData, stabilizationApplied } = event;
    
    if (link.userData) {
      link.userData.distortionActive = true;
      // [Tier 4.75] Attenuate distortion intensity by synergy stabilization
      // Maximum reduction: ~30% at synergy = 1.0
      const stabilization = stabilizationApplied ?? 0;
      const basIntensity = 0.3;
      link.userData.distortionIntensity = basIntensity * (1 - stabilization * 0.75);
    }

    if (this.debugMode) {
      console.log('[LinkCorruptionTransmission] Distortion activated');
    }
  }

  /**
   * Particle burst cascade: Emit directional particles
   * [Tier 4.75] Apply synergy-driven strength attenuation
   */
  handleParticleBurstCascade(event) {
    const { link, linkData, stabilizationApplied } = event;
    
    if (link.userData) {
      link.userData.particleBurstActive = true;
      link.userData.particleEmitTime = Date.now();
      link.userData.particleDirection = this.computeParticleDirection(link);
      
      // [Tier 4.75] Attenuate particle emission rate by synergy stabilization
      // Maximum reduction: ~30% at synergy = 1.0
      const stabilization = stabilizationApplied ?? 0;
      link.userData.particleEmitRate = (link.userData.particleEmitRate ?? 1.0) * (1 - stabilization * 0.75);
    }

    if (this.debugMode) {
      console.log('[LinkCorruptionTransmission] Particle burst triggered');
    }
  }

  /**
   * Full cascade event: Wave animation + node impact
   * [Tier 4.75] Apply synergy-driven strength attenuation to infection impulse
   */
  handleCascadeEventCascade(event) {
    const { link, linkData, stabilizationApplied } = event;
    const sourceNode = link.source || link.sourceNode;
    const targetNode = link.target || link.targetNode;

    // Activate wave animation
    if (link.userData) {
      link.userData.cascadeWaveActive = true;
      link.userData.cascadeWaveTime = 0;
      link.userData.cascadeWaveDuration = 0.5; // 500ms wave
    }

    // Apply infection to target node
    if (targetNode && targetNode.userData) {
      if (!targetNode.userData.metrics) targetNode.userData.metrics = {};
      const targetMetrics = targetNode.userData.metrics;
      const targetCorruptionBefore = targetMetrics.corruption || 0;
      
      // [Tier 4.75] Attenuate infection impulse by synergy stabilization
      // Base infection is 0.2, reduced up to ~30% at synergy = 1.0
      const stabilization = stabilizationApplied ?? 0;
      const baseInfectionDelta = 0.2;
      const attenuatedDelta = baseInfectionDelta * (1 - stabilization * 0.75);
      const computedCorruption = Math.min(1.0, targetCorruptionBefore + attenuatedDelta);
      
      if (!PHASE_C3_METRIC_WRITE_LOCK) {
        const delta = computedCorruption - targetCorruptionBefore;
        if (delta !== 0) applyMetricImpulse(targetNode, { corruption: delta }, { source: 'link-corruption-transmission' });
      }
      
      // Mark as infected
      if (!targetNode.userData.infectionSources) {
        targetNode.userData.infectionSources = [];
      }
      targetNode.userData.infectionSources.push({
        sourceId: sourceNode?.id,
        time: Date.now(),
        attenuatedDelta: attenuatedDelta // Track attenuation for debugging
      });
    }

    // Optional: Apply synergy collapse
    if (link.userData && link.userData.synergy !== undefined) {
      link.userData.synergyCollapse = true;
      link.userData.synergyCascadeTime = Date.now();
    }

    if (this.debugMode) {
      console.log('[LinkCorruptionTransmission] Full cascade event - target node infected');
    }
  }

  /**
   * Infection complete: Immediate corruption pulse
   * [Tier 4.75] Apply synergy-driven strength attenuation
   */
  handleInfectionComplete(event) {
    const { link, linkData, stabilizationApplied } = event;
    const targetNode = link.target || link.targetNode;

    if (targetNode && targetNode.userData) {
      if (!targetNode.userData.metrics) targetNode.userData.metrics = {};
      const targetMetrics = targetNode.userData.metrics;
      // [Tier 4.75] Attenuate immediate corruption surge by synergy stabilization
      // With max attenuation (~30%), surge reaches ~0.7 instead of 1.0
      const stabilization = stabilizationApplied ?? 0;
      const baseSurge = 1.0;
      const attenuatedSurge = baseSurge * (1 - stabilization * 0.75);
      
      if (!PHASE_C3_METRIC_WRITE_LOCK) {
        const delta = attenuatedSurge - (targetMetrics.corruption || 0);
        if (delta !== 0) applyMetricImpulse(targetNode, { corruption: delta }, { source: 'link-corruption-transmission' });
        targetNode.userData.corruptionSurgeTime = Date.now();
      }
      
      // Trigger cascading to all outbound links
      this.triggeCascadeToOutboundLinks(targetNode);
    }

    if (this.debugMode) {
      console.log('[LinkCorruptionTransmission] Infection complete - full node corruption');
    }
  }

  /**
   * Trigger corruption cascade to all outbound links from a node
   */
  triggeCascadeToOutboundLinks(node) {
    if (!node || !this.linkSystem) return;

    // Get all links FROM this node
    const outboundLinks = this.getOutboundLinks(node);
    
    for (const link of outboundLinks) {
      const linkData = this.initializeLink(link);
      if (linkData) {
        // Rapid boost to linked nodes
        linkData.level = Math.min(1.0, linkData.level + 0.15);
      }
    }
  }

  /**
   * [Phase 4-lite] Apply synergy feedback: Successful blocking improves synergy
   * 
   * Synergy grows when corruption is successfully blocked, creating defensive mastery.
   * Growth is subtle, bounded, and cooldown-limited to prevent runaway loops.
   * 
   * T1-004 IMPLEMENTATION:
   * - Trigger: Corruption transmission attempted but blocked by synergy or harmony
   * - Effect: Small, clamped synergy reinforcement
   * - Dampening: Feedback diminishes as synergy approaches max (saturation effect)
   * - Safety: Hard-capped to SYNERGY_MAX, cooldown-protected, corruption-pressure-gated
   * 
   * @param {Object} link - Link defending against corruption
   * @param {Number} blockedFraction - Fraction of transmission blocked (0-1)
   * @param {Boolean} hadHardBlock - True if multiplier = 0 (complete block)
   * @param {Number} corruptionPressure - Pre-multiplier corruption attempt amount (0-1)
   */
  applySynergyFeedback(link, blockedFraction, hadHardBlock, corruptionPressure) {
    if (!link || blockedFraction <= 0 || !SYNERGY_FEEDBACK_THRESHOLDS.ENABLED) return;
    if (!this.synergyFeedbackEnabled) return;
    if (corruptionPressure <= 0) return; // No corruption pressure = no defense to reward
    if (blockedFraction < SYNERGY_FEEDBACK_THRESHOLDS.MIN_BLOCK_EFFECT) return; // Block effect too small

    const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;
    const now = Date.now();

    // Check cooldown: prevent synergy gain spam
    // [Tier 4.9] SYNERGY-DRIVEN COOLDOWN ACCELERATION
    // Higher synergy reduces feedback cooldown, allowing faster synergy regeneration
    const currentSynergy = this._getLinkSynergyPct(link);
    const recoveryBoost = 1.0 + Math.min(currentSynergy * 0.5, 0.5);
    const effectiveCooldownMS = SYNERGY_FEEDBACK_THRESHOLDS.FEEDBACK_COOLDOWN_MS / recoveryBoost;
    
    const lastSynergyGainTime = this.synergyFeedbackLastTime.get(linkId) || 0;
    if (now - lastSynergyGainTime < effectiveCooldownMS) {
      return; // Still in cooldown
    }

    const synergyBefore = this._getLinkSynergyPct(link);
    const synergyMax = SYNERGY_FEEDBACK_THRESHOLDS.SYNERGY_MAX;

    // === T1-004: SATURATION DAMPENING ===
    // Feedback diminishes as synergy approaches maximum
    // Formula: feedback_multiplier = (1 - synergy / max)
    // Effect: At 50% synergy, get 50% feedback; at 90%, get 10% feedback
    const saturationMultiplier = Math.max(0, 1.0 - (synergyBefore / synergyMax));

    // Calculate base synergy gain: proportional to blocked fraction
    // Formula: synergy_gain = blocked_fraction × FEEDBACK_FACTOR
    // Example: Block 50% transmission → gain 0.04 synergy (50% × 8%)
    let synergyGain = blockedFraction * SYNERGY_FEEDBACK_THRESHOLDS.FEEDBACK_FACTOR;

    // Extra bonus for complete blocks (multiplier = 0.0)
    if (hadHardBlock) {
      synergyGain += SYNERGY_FEEDBACK_THRESHOLDS.HARD_BLOCK_BONUS;
    }

    // === APPLY SATURATION DAMPENING ===
    // At max synergy, feedback → 0
    // Below max, feedback diminishes as saturation increases
    const dampenedGain = synergyGain * saturationMultiplier;

    // === APPLY CATEGORY-AWARE SYNERGY PROPAGATION MULTIPLIER ===
    // Category determines how fast synergy spreads/gains through this link
    let synergyMultiplier = 1.0;
    const sourceNode = link.source || link.sourceNode;
    const targetNode = link.target || link.targetNode;
    if (sourceNode && targetNode) {
      synergyMultiplier = this.getSynergyPropagationMultiplier(sourceNode, targetNode);
    }
    
    const categoryModifiedGain = dampenedGain * synergyMultiplier;

    // Apply synergy gain with hard cap
    const synergyAfter = Math.min(synergyMax, synergyBefore + categoryModifiedGain);

    // Record cooldown timestamp (prevent re-entry)
    this.synergyFeedbackLastTime.set(linkId, now);

    // OPTIONAL TEMPORARY DEBUG LOG (marked for removal after T1-004 validation)
    if (Math.random() < 0.01) {
      console.log('[T1-004 Synergy Feedback]', {
        linkId: linkId,
        blockedFraction: blockedFraction.toFixed(3),
        hadHardBlock: hadHardBlock,
        synergyBefore: synergyBefore.toFixed(1),
        saturation: (1 - saturationMultiplier).toFixed(2),        // Show saturation %
        saturationMultiplier: saturationMultiplier.toFixed(3),    // Show dampening factor
        baseSynergyGain: synergyGain.toFixed(3),
        dampenedGain: dampenedGain.toFixed(3),
        synergyAfter: synergyAfter.toFixed(1)
      });
    }

    // Track synergy growth for stats (including saturation data for validation)
    this.synergyGrowthHistory.push({
      linkId: linkId,
      blockedFraction: blockedFraction,
      synergyGainAmount: dampenedGain,                            // Track dampened amount
      baseSynergyGain: synergyGain,                               // Track base for reference
      saturationMultiplier: saturationMultiplier,                 // T1-004: Track saturation
      hadHardBlock: hadHardBlock,
      synergyBefore: synergyBefore,                               // T1-004: Track before/after
      synergyAfter: synergyAfter,
      timestamp: now
    });

    if (this.synergyGrowthHistory.length > SYNERGY_FEEDBACK_THRESHOLDS.HISTORY_LIMIT) {
      this.synergyGrowthHistory.shift();
    }
  }

  /**
   * [Phase 3b] Apply harmony feedback: Successful healing increases harmony
   * 
   * Harmony grows when corruption is healed, creating a self-reinforcing
   * restorative force. Growth is subtle, bounded, and cooldown-limited to
   * prevent runaway loops.
   * 
   * PHASE 3B ENHANCEMENT (CONSISTENCY PASS):
   * - Trigger: Corruption healing or stabilization with measurable effect
   * - Effect: Small, clamped harmony reinforcement
   * - Dampening: Feedback diminishes as harmony approaches max (saturation effect)
   * - Safety: Hard-capped to HARMONY_MAX, cooldown-protected, pressure-gated
   * 
   * This mirrors T1-004 Synergy Feedback structure for consistency:
   * - Same saturation formula: saturation_multiplier = (1 - harmony / max)
   * - Same cooldown protection per entity
   * - Same hard safety limits (cap, cooldown, saturation)
   * - No self-amplification without external corruption pressure
   * 
   * @param {Object} link - Link being healed
   * @param {Number} healedAmount - Amount of corruption healed (0-1)
   * @param {Number} harmony - Current harmony level (0-1)
   * @param {Number} corruptionPressure - Pre-healing corruption amount (0-1) for pressure gating
   */
  applyHarmonyFeedback(link, healedAmount, harmony, corruptionPressure = 0) {
    if (!link || healedAmount <= 0 || !HARMONY_FEEDBACK_THRESHOLDS.ENABLED) return;
    if (!this.harmonyFeedbackEnabled) return;
    if (corruptionPressure <= 0 && healedAmount < 0.1) return; // No meaningful pressure or healing = no feedback

    const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;
    const now = Date.now();

    // Check cooldown: prevent harmony gain spam
    // [Tier 4.9] SYNERGY-DRIVEN COOLDOWN ACCELERATION
    // Higher synergy reduces feedback cooldown duration (faster harmony regeneration)
    const synergy = this._getLinkSynergyPct(link);
    const recoveryBoost = 1.0 + Math.min(synergy * 0.5, 0.5);
    const effectiveCooldownMS = HARMONY_FEEDBACK_THRESHOLDS.FEEDBACK_COOLDOWN_MS / recoveryBoost;
    
    const lastHarmonyGainTime = this.harmonyFeedbackLastTime.get(linkId) || 0;
    if (now - lastHarmonyGainTime < effectiveCooldownMS) {
      return; // Still in cooldown
    }

    // Determine where to apply harmony gain
    // Priority: link.userData > source node
    let harmonyTarget = null;
    let harmonyFieldName = null;

    if (link.userData) {
      harmonyTarget = link.userData;
      harmonyFieldName = 'harmonyLevel';
    } else if (link.source?.userData) {
      harmonyTarget = link.source.userData;
      harmonyFieldName = 'harmonyLevel';
    } else if (link.sourceNode?.userData) {
      harmonyTarget = link.sourceNode.userData;
      harmonyFieldName = 'harmonyLevel';
    }

    if (!harmonyTarget) return;

    const harmonyBefore = harmonyTarget[harmonyFieldName] || 0;
    const harmonyMax = HARMONY_FEEDBACK_THRESHOLDS.HARMONY_MAX;

    // === PHASE 3B: SATURATION DAMPENING ===
    // Feedback diminishes as harmony approaches maximum
    // Formula: feedback_multiplier = (1 - harmony / max)
    // Effect: At 50% harmony, get 50% feedback; at 90%, get 10% feedback
    const saturationMultiplier = Math.max(0, 1.0 - (harmonyBefore / harmonyMax));

    // Calculate base harmony gain: proportional to healed amount
    // Formula: harmony_gain = healed_amount × FEEDBACK_FACTOR
    // Example: Heal 0.1 corruption → gain 0.002 harmony (0.1 × 0.02)
    let harmonyGain = healedAmount * HARMONY_FEEDBACK_THRESHOLDS.FEEDBACK_FACTOR;

    // === APPLY SATURATION DAMPENING ===
    // At max harmony, feedback → 0
    // Below max, feedback diminishes as saturation increases
    const dampenedGain = harmonyGain * saturationMultiplier;

    // Apply harmony gain with hard cap
    const harmonyAfter = Math.min(harmonyMax, harmonyBefore + dampenedGain);

    if (!PHASE_C3_METRIC_WRITE_LOCK) {
      harmonyTarget[harmonyFieldName] = harmonyAfter;
    }

    // Record cooldown timestamp (prevent re-entry)
    this.harmonyFeedbackLastTime.set(linkId, now);

    // OPTIONAL TEMPORARY DEBUG LOG (marked for removal after Phase 3b validation)
    if (Math.random() < 0.01) {
      console.log('[Phase 3b Harmony Feedback]', {
        linkId: linkId,
        healedAmount: healedAmount.toFixed(4),
        corruptionPressure: corruptionPressure.toFixed(3),
        harmonyBefore: harmonyBefore.toFixed(3),
        saturation: (1 - saturationMultiplier).toFixed(2),         // Show saturation %
        saturationMultiplier: saturationMultiplier.toFixed(3),     // Show dampening factor
        baseHarmonyGain: harmonyGain.toFixed(4),
        dampenedGain: dampenedGain.toFixed(4),
        harmonyAfter: harmonyAfter.toFixed(3)
      });
    }

    // Track harmony growth for stats (including saturation data for validation)
    this.harmonyGrowthHistory.push({
      linkId: linkId,
      healedAmount: healedAmount,
      harmonyGainAmount: dampenedGain,                             // Track dampened amount
      baseHarmonyGain: harmonyGain,                                 // Track base for reference
      saturationMultiplier: saturationMultiplier,                   // Phase 3b: Track saturation
      corruptionPressure: corruptionPressure,                       // Track pressure
      harmonyBefore: harmonyBefore,                                 // Phase 3b: Track before/after
      harmonyAfter: harmonyAfter,
      timestamp: now
    });

    if (this.harmonyGrowthHistory.length > HARMONY_HEALING_THRESHOLDS.HEALING_HISTORY_SIZE) {
      this.harmonyGrowthHistory.shift();
    }
  }

  /**
   * [Phase 3] Apply healing cascade: Active harmony-driven corruption reversal
   * 
   * [LINK INTEGRITY MODEL] Healing now respects integrity thresholds:
   * - Healing BLOCKED if link is collapsed (≤8% integrity)
   * - Healing only STABILIZES if in unstable zone (15-8% integrity)
   * - Healing only HEALS if above collapse threshold (>8% integrity)
   * 
   * Healing occurs when:
   * 1. Harmony >= HEALING_TRIGGER (0.85)
   * 2. Link has non-zero corruption
   * 3. Link is NOT collapsed (integrity > COLLAPSE_THRESHOLD)
   * 
   * Healing propagates as a cascade that:
   * - Decays 50% per hop
   * - Maximum 3 hops
   * - Rate-limited (much slower than corruption spread)
   * - Deterministic and O(1) per link
   * 
   * @param {Object} link - Link to heal
   * @param {Number} deltaTime - Time delta for this frame
   */
  applyHealingCascade(link, deltaTime) {
    if (!link || !link.userData) return;

    const linkData = this.initializeLink(link);
    if (!linkData || linkData.level <= 0) return; // No corruption = nothing to heal
    
    // [LINK INTEGRITY MODEL] Check if link is collapsed - if so, no healing possible
    const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;
    const integrityData = this.linkIntegrity.get(linkId);
    if (!integrityData) return; // Initialize if needed
    
    if (this.collapsedLinks.has(linkId)) {
      return; // Link is collapsed - healing cannot resurrect it
    }

    const sourceNode = link.source || link.sourceNode;
    const targetNode = link.target || link.targetNode;
    if (!sourceNode || !targetNode) return;

    // Get harmony level (read-only from HarmonyStabilizationSystem_v1)
    const harmony = link.userData?.harmonyLevel ?? sourceNode?.userData?.harmonyLevel ?? 0;

    // Healing trigger: harmony >= 0.85 AND link has corruption
    if (harmony < HARMONY_HEALING_THRESHOLDS.HEALING_TRIGGER) {
      return; // Healing not triggered
    }

    // === LOCAL HEALING (Primary Effect) ===
    // Reduce corruption on this link at a controlled rate
    const harmonyHealingMultiplier = harmony; // Use harmony as strength (0-1 scale)
    let healingRate = HARMONY_HEALING_THRESHOLDS.BASE_HEAL_RATE;
    
    // [Phase 5] RESONANCE ENHANCEMENT: Healing is amplified in coherent networks
    // Resonance makes healing more effective where both Synergy and Harmony are high
    if (this.resonanceEnabled) {
      const resonanceBoost = this.computeResonanceAmplification(link);
      healingRate *= resonanceBoost; // Apply resonance multiplier (1.0-1.15)
    }
    
    // [Tier 4.9] SYNERGY-DRIVEN RECOVERY ACCELERATION
    // Higher synergy accelerates post-cascade corruption decay
    // recoveryBoost = 1.0 + min(synergy * 0.5, 0.5) → 100% to 150% speed
    const synergy = this._getLinkSynergyPct(link);
    const recoveryBoost = 1.0 + Math.min(synergy * 0.5, 0.5);
    healingRate *= recoveryBoost; // Apply synergy-based acceleration to healing tempo
    
    const healingDelta = -healingRate * harmonyHealingMultiplier * deltaTime;

    // Apply healing: never heal more than current level
    const healedAmount = Math.min(linkData.level, Math.abs(healingDelta));
    linkData.level = Math.max(0, linkData.level + healingDelta);

    // [LINK INTEGRITY MODEL] Stabilize integrity if in unstable zone
    // [Tier 4.9] Apply synergy-driven recovery acceleration to integrity regeneration
    if (integrityData.state === 'unstable') {
      // In unstable zone: healing adds partial stability
      let integrityGain = healedAmount * LINK_INTEGRITY_THRESHOLDS.HEALING_STABILIZATION_RATE;
      integrityGain *= recoveryBoost; // [Tier 4.9] Accelerate integrity recovery
      integrityData.integrity = Math.min(
        LINK_INTEGRITY_THRESHOLDS.INTEGRITY_MAX,
        integrityData.integrity + integrityGain
      );
    } else if (integrityData.state === 'healthy') {
      // Above unstable zone: healing restores normal integrity
      let integrityGain = (healedAmount / 3) * LINK_INTEGRITY_THRESHOLDS.HEALING_NORMAL_RATE;
      integrityGain *= recoveryBoost; // [Tier 4.9] Accelerate integrity recovery
      integrityData.integrity = Math.min(
        LINK_INTEGRITY_THRESHOLDS.INTEGRITY_MAX,
        integrityData.integrity + integrityGain
      );
    }

    // [Phase 3b] Apply harmony feedback: successful healing increases harmony
    this.applyHarmonyFeedback(link, healedAmount, harmony);

    // OPTIONAL TEMPORARY DEBUG LOG (marked for removal)
    if (Math.random() < 0.01) {
      console.log('[Harmony Healing Cascade]', {
        linkId: link.id,
        harmonyLevel: harmony.toFixed(2),
        integrityBefore: integrityData.lastIntegrityValue.toFixed(1),
        integrityAfter: integrityData.integrity.toFixed(1),
        corruptionBefore: (linkData.level + healedAmount).toFixed(3),
        healedAmount: healedAmount.toFixed(3),
        corruptionAfter: linkData.level.toFixed(3)
      });
    }

    // === HEALING CASCADE (Secondary Effect) ===
    // When link reaches zero corruption, emit healing pulse to connected links
    // This prevents instant full cleanse (gradual healing)
    if (linkData.level <= 0 && !this.activeHealingCascades.has(link.id)) {
      this.initiateHealingCascadeFromLink(link, harmony, 0);
    }

    // Track healing event for stats
    this.healingHistory.push({
      linkId: link.id,
      harmony: harmony,
      healed: healedAmount,
      cascadeDepth: 0,
      integrityState: integrityData.state,
      timestamp: Date.now()
    });

    if (this.healingHistory.length > HARMONY_HEALING_THRESHOLDS.HEALING_HISTORY_SIZE) {
      this.healingHistory.shift();
    }
  }

  /**
   * [Phase 3] Initiate healing cascade from a link that reached zero corruption
   * 
   * Cascade propagates to connected links with strength decay:
   * - Initial strength = harmony level
   * - Base decay: 50% per hop (can be modified by resonance)
   * - [Phase 5c] Resonance-weighted decay: healing travels further in resonant zones
   * - Stops when strength < 0.01 OR depth > 3
   * 
   * @param {Object} sourceLink - Link that triggered cascade
   * @param {Number} cascadeStrength - Current cascade strength (0-1)
   * @param {Number} depth - Current cascade depth (0 = source)
   */
  initiateHealingCascadeFromLink(sourceLink, cascadeStrength, depth) {
    if (!sourceLink || !this.linkSystem) return;
    if (depth > this.maxCascadeDepth) return;
    
    const cascadeId = `cascade_${sourceLink.id}_${depth}`;
    if (this.activeHealingCascades.has(cascadeId)) {
      return; // Already processing this cascade branch
    }

    // Mark cascade as active (prevent infinite recursion)
    this.activeHealingCascades.set(cascadeId, {
      sourceLink: sourceLink,
      strength: cascadeStrength,
      depth: depth,
      startTime: Date.now()
    });

    // Stop cascade conditions:
    if (cascadeStrength < HARMONY_HEALING_THRESHOLDS.MIN_CASCADE_STRENGTH ||
        depth >= HARMONY_HEALING_THRESHOLDS.MAX_CASCADE_DEPTH) {
      this.activeHealingCascades.delete(cascadeId);
      return; // Cascade terminated
    }

    const sourceNode = sourceLink.target || sourceLink.targetNode; // Cascade flows to target node
    if (!sourceNode) {
      this.activeHealingCascades.delete(cascadeId);
      return;
    }

    // Get all outbound links from the target node
    const outboundLinks = this.getOutboundLinks(sourceNode);
    
    for (const nextLink of outboundLinks) {
      if (!nextLink || nextLink === sourceLink) continue; // Skip source

      const nextLinkData = this.initializeLink(nextLink);
      if (!nextLinkData || nextLinkData.level <= 0) continue; // Skip if already healed

      // [Phase 5c] RESONANCE-WEIGHTED CASCADE DECAY
      // Healing travels further in resonant zones without violating decay guarantees
      let effectiveDecay = HARMONY_HEALING_THRESHOLDS.CASCADE_STRENGTH_DECAY; // Default: 0.5
      
      if (CASCADE_RESONANCE_THRESHOLDS.ENABLED && this.cascadeResonanceEnabled) {
        // Get resonance factor for this link (read-only)
        const resonanceFactor = this.computeResonanceAmplification(nextLink); // Range: 1.0-1.15
        
        // Modify decay inversely with resonance: higher resonance = lower decay (healing travels further)
        // Formula: effectiveDecay = BASE_DECAY / resonanceFactor
        // Example: 0.5 / 1.0 = 0.5 (no resonance), 0.5 / 1.1 = 0.45 (10% better transmission)
        effectiveDecay = CASCADE_RESONANCE_THRESHOLDS.BASE_CASCADE_DECAY / resonanceFactor;
        
        // Safety clamp: ensure decay stays within safe bounds
        effectiveDecay = Math.max(
          CASCADE_RESONANCE_THRESHOLDS.DECAY_MIN,
          Math.min(CASCADE_RESONANCE_THRESHOLDS.DECAY_MAX, effectiveDecay)
        );
        
        // OPTIONAL DEBUG LOG (rare: 1% chance)
        if (Math.random() < 0.01) {
          console.log('[Phase 5c Cascade Resonance]', {
            linkId: nextLink.id,
            resonanceFactor: resonanceFactor.toFixed(3),
            baseDecay: HARMONY_HEALING_THRESHOLDS.CASCADE_STRENGTH_DECAY.toFixed(3),
            effectiveDecay: effectiveDecay.toFixed(3),
            cascadeDepth: depth + 1,
            cascadeStrength: cascadeStrength.toFixed(3)
          });
        }
        
        // Track cascade resonance event for stats
        this.cascadeResonanceHistory.push({
          linkId: nextLink.id,
          resonanceFactor: resonanceFactor,
          effectiveDecay: effectiveDecay,
          cascadeDepth: depth + 1,
          cascadeStrength: cascadeStrength,
          timestamp: Date.now()
        });
        
        if (this.cascadeResonanceHistory.length > CASCADE_RESONANCE_THRESHOLDS.HISTORY_LIMIT) {
          this.cascadeResonanceHistory.shift();
        }
      }

      // Decay cascade strength with resonance-weighted decay
      const nextCascadeStrength = cascadeStrength * effectiveDecay;

      // Apply healing on next link
      const cascadeHealing = nextCascadeStrength * HARMONY_HEALING_THRESHOLDS.BASE_HEAL_RATE * 0.1; // Slower than local healing
      const healedAmount = Math.min(nextLinkData.level, cascadeHealing);
      nextLinkData.level = Math.max(0, nextLinkData.level - cascadeHealing);

      // [Phase 3b] Apply harmony feedback to cascade healing (at reduced strength)
      // Cascade feedback is weaker (50% of local feedback) to prevent exponential growth
      if (healedAmount > 0) {
        this.applyHarmonyFeedback(nextLink, healedAmount * 0.5, nextCascadeStrength);
      }

      // Recursively cascade to next level
      if (nextLinkData.level <= 0) {
        this.initiateHealingCascadeFromLink(nextLink, nextCascadeStrength, depth + 1);
      }

      // Track cascade healing
      this.healingHistory.push({
        linkId: nextLink.id,
        harmonyLevel: cascadeStrength,
        healed: healedAmount,
        cascadeDepth: depth + 1,
        timestamp: Date.now()
      });

      if (this.healingHistory.length > HARMONY_HEALING_THRESHOLDS.HEALING_HISTORY_SIZE) {
        this.healingHistory.shift();
      }
    }

    // Cleanup cascade tracking (after brief delay to prevent re-entry)
    setTimeout(() => {
      this.activeHealingCascades.delete(cascadeId);
    }, 50);
  }

  /**
   * [Phase 5d] Initiate threat cascade from a link with high corruption
   * 
   * Threat propagates through connected links under resonance weighting.
   * Similar mechanics to healing cascade but represents pressure/stress:
   * - Initial strength = link corruption level
   * - Base decay: 50% per hop (can be modified by resonance)
   * - [Phase 5d] Resonance-weighted decay: threat travels further in resonant zones
   * - Stops when strength < 0.01 OR depth > 3
   * 
   * @param {Object} sourceLink - Link with high corruption
   * @param {Number} cascadeStrength - Current cascade strength (0-1)
   * @param {Number} depth - Current cascade depth (0 = source)
   */
  initiateThreatCascadeFromLink(sourceLink, cascadeStrength, depth) {
    if (!sourceLink || !this.linkSystem) return;
    
    const cascadeId = `threat_cascade_${sourceLink.id}_${depth}`;
    if (this.activeHealingCascades.has(cascadeId)) {
      return; // Already processing this cascade branch
    }

    // Stop cascade conditions: same as healing
    if (cascadeStrength < 0.01 || depth >= HARMONY_HEALING_THRESHOLDS.MAX_CASCADE_DEPTH) {
      return; // Cascade terminated
    }

    const sourceNode = sourceLink.target || sourceLink.targetNode;
    if (!sourceNode) {
      return;
    }

    // Get all outbound links from the target node
    const outboundLinks = this.getOutboundLinks(sourceNode);
    
    for (const nextLink of outboundLinks) {
      if (!nextLink || nextLink === sourceLink) continue; // Skip source

      const nextLinkData = this.initializeLink(nextLink);
      if (!nextLinkData) continue; // Skip invalid links

      // [Phase 5d] RESONANCE-WEIGHTED THREAT DECAY
      // Threat travels further in resonant zones without violating decay guarantees
      let effectiveDecay = THREAT_CASCADE_THRESHOLDS.BASE_THREAT_DECAY; // Default: 0.5
      
      if (THREAT_CASCADE_THRESHOLDS.ENABLED && this.threatCascadeEnabled) {
        // Get resonance factor for this link (read-only)
        const resonanceFactor = this.computeResonanceAmplification(nextLink); // Range: 1.0-1.15
        
        // Modify decay inversely with resonance: higher resonance = lower decay (threat travels further)
        effectiveDecay = THREAT_CASCADE_THRESHOLDS.BASE_THREAT_DECAY / resonanceFactor;
        
        // Safety clamp: ensure decay stays within safe bounds
        effectiveDecay = Math.max(
          THREAT_CASCADE_THRESHOLDS.DECAY_MIN,
          Math.min(THREAT_CASCADE_THRESHOLDS.DECAY_MAX, effectiveDecay)
        );
        
        // OPTIONAL DEBUG LOG (rare: 1% chance)
        if (Math.random() < 0.01) {
          console.log('[Phase 5d Threat Cascade]', {
            linkId: nextLink.id,
            resonanceFactor: resonanceFactor.toFixed(3),
            baseDecay: THREAT_CASCADE_THRESHOLDS.BASE_THREAT_DECAY.toFixed(3),
            effectiveDecay: effectiveDecay.toFixed(3),
            cascadeDepth: depth + 1,
            cascadeStrength: cascadeStrength.toFixed(3)
          });
        }
        
        // Track threat cascade event for stats
        this.threatCascadeHistory.push({
          linkId: nextLink.id,
          resonanceFactor: resonanceFactor,
          effectiveDecay: effectiveDecay,
          cascadeDepth: depth + 1,
          cascadeStrength: cascadeStrength,
          timestamp: Date.now()
        });
        
        if (this.threatCascadeHistory.length > THREAT_CASCADE_THRESHOLDS.HISTORY_LIMIT) {
          this.threatCascadeHistory.shift();
        }
      }

      // Decay threat strength with resonance-weighted decay
      const nextCascadeStrength = cascadeStrength * effectiveDecay;

      // Apply pressure to next link (light corruption boost, not direct infection)
      // Threat cascade accelerates existing corruption slightly, doesn't start new
      if (nextLinkData.level > 0) {
        const threatPressure = nextCascadeStrength * THREAT_CASCADE_THRESHOLDS.BASE_THREAT_DECAY * 0.05; // Small boost
        nextLinkData.level = Math.min(1.0, nextLinkData.level + threatPressure);
      }

      // Recursively cascade to next level
      if (nextCascadeStrength > 0.01) {
        this.initiateThreatCascadeFromLink(nextLink, nextCascadeStrength, depth + 1);
      }
    }
  }

  /**
   * Apply visual effects to a link based on corruption level
   */
  applyLinkCorruptionVisuals(link, level, time = 0) {
    if (!link || !link.userData) return;

    // Initialize visual state
    if (!link.userData.corruptionVisualState) {
      link.userData.corruptionVisualState = {
        colorTint: { r: 1, g: 1, b: 1 },
        glowIntensity: 0.5,
        glowFrequency: 2.0,
        distortionAmount: 0
      };
    }

    const vis = link.userData.corruptionVisualState;

    // Progressive visual effects based on corruption level
    if (level < 0.1) {
      // Healthy: normal
      vis.colorTint = { r: 0.2, g: 0.8, b: 0.3 };
      vis.glowIntensity = 0.2;
      vis.distortionAmount = 0;
    } else if (level < 0.3) {
      // Mild: red tint + light glow
      const t = level / 0.3;
      vis.colorTint = {
        r: this.lerp(0.2, 1.0, t),
        g: this.lerp(0.8, 0.5, t),
        b: this.lerp(0.3, 0.0, t)
      };
      vis.glowIntensity = this.lerp(0.2, 0.5, t);
      vis.distortionAmount = 0;
    } else if (level < 0.6) {
      // Moderate: animated corruption pulse + shader
      const t = (level - 0.3) / 0.3;
      const pulseAmount = Math.sin(time * 6.0) * 0.3;
      
      vis.colorTint = {
        r: this.lerp(1.0, 1.0, t) + pulseAmount * 0.2,
        g: this.lerp(0.5, 0.2, t) - pulseAmount * 0.1,
        b: this.lerp(0.0, 0.6, t) + pulseAmount * 0.2
      };
      vis.glowIntensity = this.lerp(0.5, 0.8, t) + pulseAmount * 0.2;
      vis.glowFrequency = 2.0 + t * 4.0;
      vis.distortionAmount = t * 0.3;
    } else if (level < 0.85) {
      // Strong: glitch streaks + waveform
      const t = (level - 0.6) / 0.25;
      const glitchAmount = Math.random() * 0.4 * t;
      
      vis.colorTint = {
        r: 1.0 + glitchAmount,
        g: this.lerp(0.2, 0.0, t),
        b: this.lerp(0.6, 0.2, t)
      };
      vis.glowIntensity = this.lerp(0.8, 1.0, t);
      vis.glowFrequency = this.lerp(6.0, 8.0, t);
      vis.distortionAmount = this.lerp(0.3, 0.7, t);
    } else {
      // Severe: violent rupture + cascading
      const t = (level - 0.85) / 0.15;
      const rupturePulse = Math.sin(time * 12.0) * 0.5 * t;
      
      vis.colorTint = {
        r: 1.0 + rupturePulse,
        g: 0.0,
        b: this.lerp(0.2, 0.5, t) + rupturePulse * 0.3
      };
      vis.glowIntensity = 1.0 + rupturePulse * 0.5;
      vis.glowFrequency = 8.0;
      vis.distortionAmount = 0.7 + rupturePulse * 0.3;
    }

    // Clamp color values
    vis.colorTint.r = Math.max(0, Math.min(1, vis.colorTint.r));
    vis.colorTint.g = Math.max(0, Math.min(1, vis.colorTint.g));
    vis.colorTint.b = Math.max(0, Math.min(1, vis.colorTint.b));
    vis.glowIntensity = Math.max(0, Math.min(1, vis.glowIntensity));
    vis.distortionAmount = Math.max(0, Math.min(1, vis.distortionAmount));

    // Store shader parameters
    if (!link.userData.visualState) link.userData.visualState = {};
    link.userData.visualState.corruptionLevel = level;
    link.userData.visualIntensity = level;
  }

  /**
   * [Phase 5] Compute resonance amplification factor for a link
   * 
   * Resonance occurs when:
   * 1. Link is in a dense region (≥3-4 direct neighbors)
   * 2. Average Synergy in neighborhood ≥ 75
   * 3. Average Harmony in neighborhood ≥ 0.75
   * 
   * This is a conditional amplifier, not a feedback loop:
   * - No direct growth of Synergy or Harmony
   * - Only amplifies existing blocking and healing effects
   * - Emerges from network structure + maintenance
   * - Disappears immediately if conditions break
   * 
   * @param {Object} link - Link to evaluate for resonance
   * @returns {Number} Resonance multiplier (1.0 = no resonance, 1.05-1.15 = active resonance)
   */
  computeResonanceAmplification(link) {
    // Resonance disabled or link invalid
    if (!link || !RESONANCE_THRESHOLDS.ENABLED || !this.resonanceEnabled) {
      return 1.0;
    }

    const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;

    // Get neighbors (incoming + outgoing links from both nodes)
    const neighborLinks = this.getLinkNeighbors(link);
    
    // DENSITY GATE: Must have minimum neighbor count
    if (neighborLinks.length < RESONANCE_THRESHOLDS.MIN_DENSE_NEIGHBORS) {
      return 1.0; // Sparse network: no resonance
    }

    // === SYNERGY EVALUATION ===
    let totalSynergy = this._getLinkSynergyPct(link);
    let synergyCount = 1; // Include self

    for (const neighborLink of neighborLinks) {
      const neighborSynergy = this._getLinkSynergyPct(neighborLink);
      totalSynergy += neighborSynergy;
      synergyCount++;
    }

    const avgSynergy = totalSynergy / synergyCount;

    // SYNERGY THRESHOLD GATE
    if (avgSynergy < RESONANCE_THRESHOLDS.SYNERGY_RESONANCE_THRESHOLD) {
      return 1.0; // Synergy too low: no resonance
    }

    // === HARMONY EVALUATION ===
    // Get harmony from link and source node
    let totalHarmony = link.userData?.harmonyLevel ?? 
                      link.source?.userData?.harmonyLevel ?? 
                      link.sourceNode?.userData?.harmonyLevel ?? 0;
    let harmonyCount = 1;

    for (const neighborLink of neighborLinks) {
      const neighborHarmony = neighborLink.userData?.harmonyLevel ?? 
                             neighborLink.source?.userData?.harmonyLevel ?? 
                             neighborLink.sourceNode?.userData?.harmonyLevel ?? 0;
      totalHarmony += neighborHarmony;
      harmonyCount++;
    }

    const avgHarmony = totalHarmony / harmonyCount;

    // HARMONY THRESHOLD GATE (DUAL CONDITION)
    if (avgHarmony < RESONANCE_THRESHOLDS.HARMONY_RESONANCE_THRESHOLD) {
      return 1.0; // Harmony too low: no resonance
    }

    // === RESONANCE ACTIVATED ===
    // Both Synergy and Harmony thresholds met in dense network
    
    // [Phase 5a] DYNAMIC THREAT WEIGHTING
    // Resonance strength scales with local corruption threat
    // threat ∈ [0..1], threatWeight ∈ [0.5..1.5], soft response curve
    const linkData = this.linkCorruption.get(linkId) || this.initializeLink(link);
    const threat = Math.max(0, Math.min(1, linkData?.level || 0)); // Link corruption as threat signal
    
    // Soft response curve: low threat → subtle resonance, high threat → stronger resonance
    // Formula: threatWeight = 0.5 + (threat × threat)
    // Result: threat 0.0→0.5, threat 0.5→0.75, threat 1.0→1.5
    const threatWeight = Math.min(1.5, Math.max(0.5, 0.5 + (threat * threat)));
    
    // Apply dynamic weighting to resonance strength
    const weightedResonance = RESONANCE_THRESHOLDS.RESONANCE_STRENGTH * threatWeight;
    const resonanceFactor = Math.min(
      RESONANCE_THRESHOLDS.RESONANCE_MAX,
      1.0 + weightedResonance
    );

    // OPTIONAL DEBUG LOG (rare: 1% chance) - extended with threat info
    if (Math.random() < 0.01) {
      console.log('[Resonance Threat Weight]', {
        linkId: linkId,
        threat: threat.toFixed(2),
        threatWeight: threatWeight.toFixed(2),
        neighbors: neighborLinks.length,
        avgSynergy: avgSynergy.toFixed(1),
        avgHarmony: avgHarmony.toFixed(2),
        resonanceFactor: resonanceFactor.toFixed(3)
      });
    }

    // Track resonance event for stats (including threat data for Phase 5a)
    this.resonanceHistory.push({
      linkId: linkId,
      neighborCount: neighborLinks.length,
      avgSynergy: avgSynergy,
      avgHarmony: avgHarmony,
      threat: threat,
      threatWeight: threatWeight,
      resonanceFactor: resonanceFactor,
      timestamp: Date.now()
    });

    if (this.resonanceHistory.length > RESONANCE_THRESHOLDS.HISTORY_LIMIT) {
      this.resonanceHistory.shift();
    }

    // === [Phase 5b] ADJACENT SYNERGY RESONANCE ===
    // Local coherence: high-synergy neighbors amplify resonance slightly
    // This models how optimized links hum louder when surrounded by other optimized links
    let finalResonanceFactor = resonanceFactor;
    let adjacentBonus = 0;
    let highSynergyNeighbors = 0;

    if (ADJACENT_SYNERGY_THRESHOLDS.ENABLED && this.adjacentResonanceEnabled) {
      // Count high-synergy neighbors (one-hop only, using existing neighbor list)
      for (const neighborLink of neighborLinks) {
        const neighborSynergy = neighborLink.synergy ?? 0;
        if (neighborSynergy >= ADJACENT_SYNERGY_THRESHOLDS.SYNERGY_ADJACENT_THRESHOLD) {
          highSynergyNeighbors++;
        }
      }

      // Compute adjacent bonus: small additive bonus per neighbor (1% each, capped at 5%)
      if (highSynergyNeighbors > 0) {
        adjacentBonus = Math.min(
          ADJACENT_SYNERGY_THRESHOLDS.ADJACENT_SYNERGY_MAX,
          highSynergyNeighbors * ADJACENT_SYNERGY_THRESHOLDS.ADJACENT_SYNERGY_BONUS
        );

        // Apply bonus ADDITIVELY (not multiplicatively)
        finalResonanceFactor = Math.min(
          RESONANCE_THRESHOLDS.RESONANCE_MAX,
          resonanceFactor + adjacentBonus
        );

        // OPTIONAL DEBUG LOG (rare: 1% chance, only when neighbors exist)
        if (Math.random() < 0.01) {
          console.log('[Phase 5b Adjacent Resonance]', {
            linkId: linkId,
            highSynergyNeighbors: highSynergyNeighbors,
            adjacentBonus: adjacentBonus.toFixed(3),
            baseResonance: resonanceFactor.toFixed(3),
            finalResonance: finalResonanceFactor.toFixed(3)
          });
        }

        // Track adjacent resonance event for stats
        this.adjacentResonanceHistory.push({
          linkId: linkId,
          highSynergyNeighbors: highSynergyNeighbors,
          adjacentBonus: adjacentBonus,
          baseResonanceFactor: resonanceFactor,
          finalResonanceFactor: finalResonanceFactor,
          timestamp: Date.now()
        });

        if (this.adjacentResonanceHistory.length > ADJACENT_SYNERGY_THRESHOLDS.HISTORY_LIMIT) {
          this.adjacentResonanceHistory.shift();
        }
      }
    }

    return finalResonanceFactor;
  }

  /**
   * [Phase 5] Get immediate neighbor links for density check
   * 
   * O(1) operation with optional caching:
   * - Returns direct connections only (1-hop)
   * - Includes both incoming and outgoing from both nodes
   * - Cache invalidated every 100ms to stay current
   * 
   * @param {Object} link - Link to find neighbors for
   * @returns {Array} Array of neighbor links
   */
  getLinkNeighbors(link) {
    if (!link) return [];

    const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;
    const now = Date.now();
    const cacheAge = now - (this.linkNeighborCacheTime.get(linkId) || 0);

    // Use cache if fresh (< 100ms old)
    if (this.linkNeighborCache.has(linkId) && cacheAge < 100) {
      return this.linkNeighborCache.get(linkId);
    }

    const sourceNode = link.source || link.sourceNode;
    const targetNode = link.target || link.targetNode;
    
    const neighbors = [];
    const seenLinkIds = new Set();

    if (sourceNode) {
      // Get all links from source node
      const outbound = this.getOutboundLinks(sourceNode) || [];
      for (const l of outbound) {
        const id = l.id || `${l.source?.id || 'unknown'}-${l.target?.id || 'unknown'}`;
        if (id !== linkId && !seenLinkIds.has(id)) {
          neighbors.push(l);
          seenLinkIds.add(id);
        }
      }

      // Get all links TO source node (if reverse direction supported)
      const inbound = this.getInboundLinks(sourceNode) || [];
      for (const l of inbound) {
        const id = l.id || `${l.source?.id || 'unknown'}-${l.target?.id || 'unknown'}`;
        if (id !== linkId && !seenLinkIds.has(id)) {
          neighbors.push(l);
          seenLinkIds.add(id);
        }
      }
    }

    if (targetNode && targetNode !== sourceNode) {
      // Get all links from target node
      const outbound = this.getOutboundLinks(targetNode) || [];
      for (const l of outbound) {
        const id = l.id || `${l.source?.id || 'unknown'}-${l.target?.id || 'unknown'}`;
        if (id !== linkId && !seenLinkIds.has(id)) {
          neighbors.push(l);
          seenLinkIds.add(id);
        }
      }

      // Get all links TO target node (if reverse direction supported)
      const inbound = this.getInboundLinks(targetNode) || [];
      for (const l of inbound) {
        const id = l.id || `${l.source?.id || 'unknown'}-${l.target?.id || 'unknown'}`;
        if (id !== linkId && !seenLinkIds.has(id)) {
          neighbors.push(l);
          seenLinkIds.add(id);
        }
      }
    }

    // Cache result
    this.linkNeighborCache.set(linkId, neighbors);
    this.linkNeighborCacheTime.set(linkId, now);

    return neighbors;
  }

  /**
   * Get inbound links to a node (incoming connections)
   */
  getInboundLinks(node) {
    if (!node || !this.linkSystem) return [];

    // Try various interfaces
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
   * Manually set link corruption level
   */
  setLinkCorruption(link, level) {
    const linkData = this.initializeLink(link);
    if (linkData) {
      linkData.level = Math.max(0, Math.min(1, level));
      linkData.cascadeThresholdsCrossed.clear(); // Reset cascades
      this.checkCascadeThresholds(link, linkData);
      this._syncLinkUserDataMetrics(link);
    }
  }

  /**
   * Get all links in the system
   */
  getAllLinks() {
    if (!this.linkSystem) return [];

    // Try various link system interfaces
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
   * Get outbound links from a node
   */
  getOutboundLinks(node) {
    if (!node || !this.linkSystem) return [];

    // Try various interfaces
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
   * Compute particle direction (source → target)
   */
  computeParticleDirection(link) {
    const source = link.source || link.sourceNode;
    const target = link.target || link.targetNode;

    if (!source || !target || !source.position || !target.position) {
      return { x: 0, y: 1, z: 0 };
    }

    if (THREE && THREE.Vector3) {
      const dir = new THREE.Vector3().subVectors(target.position, source.position);
      dir.normalize();
      return { x: dir.x, y: dir.y, z: dir.z };
    } else {
      return { x: 0, y: 1, z: 0 };
    }
  }

  /**
   * Linear interpolation helper
   */
  lerp(a, b, t) {
    return a + (b - a) * Math.max(0, Math.min(1, t));
  }

  /**
   * Get corruption info for a link
   */
  getLinkInfo(link) {
    const linkData = this.linkCorruption.get(link.id) || this.initializeLink(link);
    if (!linkData) return null;

    return {
      linkId: linkData.linkId,
      corruptionLevel: linkData.level.toFixed(3),
      velocity: linkData.velocity.toFixed(3),
      cascadesTriggered: Array.from(linkData.cascadeThresholdsCrossed),
      recentEvents: linkData.cascadeEvents.slice(-5).map(e => ({
        event: e.event,
        level: e.level.toFixed(3),
        age: (Date.now() - e.timestamp) / 1000
      }))
    };
  }

  /**
   * Get aggregate network corruption from tracked link state.
   * Public API used by UI/bridge consumers.
   *
   * @returns {number} Average link corruption in [0, 1]
   */
  getNetworkCorruption() {
    const allLinks = this.getAllLinks();
    if (!allLinks || allLinks.length === 0) return 0;

    let totalCorruption = 0;
    let countedLinks = 0;

    for (const link of allLinks) {
      const linkId = link?.id || `${link?.source?.id || 'unknown'}-${link?.target?.id || 'unknown'}`;
      const linkData = this.linkCorruption.get(linkId) || this.initializeLink(link);
      if (!linkData) continue;

      totalCorruption += Math.max(0, Math.min(1, Number(linkData.level) || 0));
      countedLinks++;
    }

    if (countedLinks === 0) return 0;
    return totalCorruption / countedLinks;
  }

  /**
   * Get recent cascade event history.
   * Public API for visual bridges and diagnostics.
   *
   * @returns {Array<object>}
   */
  getCascadeHistory() {
    return Array.isArray(this.cascadeHistory) ? [...this.cascadeHistory] : [];
  }

  /**
   * Get recent threat cascade event history.
   * Public API for visual bridges and diagnostics.
   *
   * @returns {Array<object>}
   */
  getThreatCascadeHistory() {
    return Array.isArray(this.threatCascadeHistory) ? [...this.threatCascadeHistory] : [];
  }

  /**
   * [Phase 5 Axis 1] Update stress coupling between networks
   * 
   * This method samples stress from adjacent networks and applies a small, delayed
   * ambient pressure that slightly increases corruption emergence probability.
   * 
   * Mechanics:
   * - Each network gets ambient stress = average(neighbor stress) × COUPLING_FACTOR
   * - Ambient stress affects corruption emergence, not actual corruption injection
   * - Ambient stress decays naturally at 15% per frame (~5 frame dissipation)
   * - Effects are symmetric, bounded, and fully reversible
   * 
   * @param {Array} allNodes - All nodes in the system
   * @param {Number} deltaTime - Time since last update
   */
  updateStressCoupling(allNodes = [], deltaTime = 0.016) {
    if (!STRESS_COUPLING_THRESHOLDS.ENABLED || !this.stressCouplingEnabled) {
      return;
    }

    // Sample interval check (update every 100ms to reduce CPU load)
    const now = Date.now();
    if (now - this.lastStressCouplingUpdate < STRESS_COUPLING_THRESHOLDS.SAMPLE_INTERVAL_MS) {
      // Still decay ambient stress even if not sampling
      this._decayAmbientStress();
      return;
    }
    this.lastStressCouplingUpdate = now;

    // Build network map if not cached
    if (this.networkAdjacencyCache.size === 0 || (now - this.networkAdjacencyCacheTime > 5000)) {
      this._buildNetworkAdjacencyCache(allNodes);
      this.networkAdjacencyCacheTime = now;
    }

    // For each network, calculate ambient stress from neighbors
    const networkNodes = new Map(); // networkId -> [nodes in network]
    for (const node of allNodes) {
      if (!node?.userData?.id) continue;
      const networkId = node.userData.networkId || node.userData.id;
      if (!networkNodes.has(networkId)) {
        networkNodes.set(networkId, []);
      }
      networkNodes.get(networkId).push(node);
    }

    // Apply stress coupling to each network
    for (const [networkId, nodes] of networkNodes) {
      this._applyStressCouplingToNetwork(networkId, nodes, allNodes);
    }

    // Decay ambient stress naturally
    this._decayAmbientStress();
  }

  /**
   * Apply stress coupling to a specific network from its neighbors
   * @private
   */
  _applyStressCouplingToNetwork(networkId, nodes, allNodes) {
    // Get neighbor networks and their stress levels
    const neighbors = this.networkAdjacencyCache.get(networkId) || [];
    if (neighbors.length === 0) {
      return; // No neighbors, no coupling
    }

    // Calculate average neighbor stress weighted by distance
    let totalNeighborStress = 0;
    let weightSum = 0;

    for (const neighbor of neighbors) {
      const distance = neighbor.distance || 1;
      const dampening = STRESS_COUPLING_THRESHOLDS.DISTANCE_DAMPENING[distance] || 0;
      
      if (dampening <= 0) continue;

      // Get network stress (corruption ratio)
      const networkStress = this._calculateNetworkStress(neighbor.networkId, allNodes);
      totalNeighborStress += networkStress * dampening;
      weightSum += dampening;
    }

    if (weightSum <= 0) return;

    // Calculate ambient stress injection
    const averageNeighborStress = totalNeighborStress / weightSum;
    const stressInjection = Math.min(
      STRESS_COUPLING_THRESHOLDS.MAX_AMBIENT_INJECTION_PER_FRAME,
      averageNeighborStress * STRESS_COUPLING_THRESHOLDS.COUPLING_FACTOR
    );

    if (stressInjection <= 0) return;

    // Get or initialize ambient stress for this network
    let currentAmbient = this.ambientStressPerNetwork.get(networkId) || 0;
    currentAmbient += stressInjection;
    currentAmbient = Math.min(1.0, currentAmbient); // Cap at 1.0

    this.ambientStressPerNetwork.set(networkId, currentAmbient);

    // Track coupling event (1% chance to reduce log spam)
    if (Math.random() < 0.01) {
      this.stressCouplingHistory.push({
        networkId: networkId,
        neighborStress: averageNeighborStress.toFixed(3),
        injection: stressInjection.toFixed(4),
        currentAmbient: currentAmbient.toFixed(3),
        timestamp: Date.now()
      });

      if (this.stressCouplingHistory.length > STRESS_COUPLING_THRESHOLDS.HISTORY_LIMIT) {
        this.stressCouplingHistory.shift();
      }
    }
  }

  /**
   * Calculate the overall stress of a network (corruption ratio)
   * @private
   */
  _calculateNetworkStress(networkId, allNodes) {
    const networkNodes = allNodes.filter(n => 
      (n.userData?.networkId || n.userData?.id) === networkId
    );

    if (networkNodes.length === 0) return 0;

    // Calculate average corruption level across network
    let totalCorruption = 0;
    for (const node of networkNodes) {
      if (node.userData?.links) {
        for (const link of node.userData.links) {
          const linkData = this.linkCorruption.get(link.id);
          if (linkData) {
            totalCorruption += linkData.level;
          }
        }
      }
    }

    const totalLinks = networkNodes.reduce((sum, n) => sum + (n.userData?.links?.length || 0), 0);
    return totalLinks > 0 ? totalCorruption / totalLinks : 0;
  }

  /**
   * Decay ambient stress naturally over time
   * @private
   */
  _decayAmbientStress() {
    const decayFactor = 1 - STRESS_COUPLING_THRESHOLDS.DECAY_PER_FRAME;
    
    for (const [networkId, stress] of this.ambientStressPerNetwork) {
      const decayedStress = stress * decayFactor;
      
      if (decayedStress < STRESS_COUPLING_THRESHOLDS.DECAY_MIN) {
        this.ambientStressPerNetwork.delete(networkId);
      } else {
        this.ambientStressPerNetwork.set(networkId, decayedStress);
      }
    }
  }

  /**
   * Build cache of network adjacencies for fast lookup
   * @private
   */
  _buildNetworkAdjacencyCache(allNodes) {
    this.networkAdjacencyCache.clear();

    // Create network map
    const networkMap = new Map();
    for (const node of allNodes) {
      if (!node?.userData?.id) continue;
      const networkId = node.userData.networkId || node.userData.id;
      if (!networkMap.has(networkId)) {
        networkMap.set(networkId, []);
      }
      networkMap.get(networkId).push(node);
    }

    // Find adjacencies (networks connected via links)
    for (const [networkId, nodes] of networkMap) {
      const neighbors = new Map(); // adjacent networkId -> distance

      for (const node of nodes) {
        if (!node.userData?.links) continue;

        for (const link of node.userData.links) {
          const targetNode = link.target || link.targetNode;
          if (!targetNode?.userData?.id) continue;

          const targetNetworkId = targetNode.userData.networkId || targetNode.userData.id;
          if (targetNetworkId === networkId) continue; // Skip self

          const currentDistance = neighbors.get(targetNetworkId) || 999;
          neighbors.set(targetNetworkId, Math.min(currentDistance, 1)); // Direct link = distance 1
        }
      }

      // Store neighbors
      const neighborList = Array.from(neighbors).map(([id, dist]) => ({
        networkId: id,
        distance: dist
      }));

      this.networkAdjacencyCache.set(networkId, neighborList);
    }
  }

  /**
   * Get ambient stress for a network (read-only)
   * @param {String} networkId - Network identifier
   * @returns {Number} Ambient stress (0-1)
   */
  getAmbientStress(networkId) {
    return this.ambientStressPerNetwork.get(networkId) || 0;
  }

  /**
   * Apply ambient stress effect to corruption emergence
   * This is called during corruption transmission to modulate emergence probability
   * 
   * @param {Number} baseEmergenceProbability - Base chance of corruption emerging
   * @param {String} networkId - Network where corruption would emerge
   * @returns {Number} Adjusted emergence probability
   */
  applyAmbientStressToEmergence(baseEmergenceProbability, networkId) {
    const ambientStress = this.getAmbientStress(networkId);
    if (ambientStress <= 0) {
      return baseEmergenceProbability;
    }

    // Ambient stress increases emergence probability proportionally
    const stressMultiplier = 1 + (ambientStress * STRESS_COUPLING_THRESHOLDS.STRESS_TO_EMERGENCE_MULTIPLIER);
    return baseEmergenceProbability * stressMultiplier;
  }

  // ============================================================
  // [Phase 5 Axis 2] INTER-NETWORK HEALING CONTENTION SYSTEM
  // ============================================================

  /**
   * Record a healing event for contention detection
   * 
   * Call this whenever a network heals a link. The system will automatically
   * detect overlapping healing events and apply efficiency penalties.
   * 
   * @param {Object} healingEvent - Healing event data
   * @param {String} healingEvent.networkId - Network performing healing
   * @param {Object} healingEvent.link - Link being healed
   * @param {Number} healingEvent.amount - Healing amount (pre-contention)
   * @param {String} healingEvent.regionId - Region/network zone (optional, for spatial grouping)
   * @returns {Object} Event metadata { eventId, effectiveAmount, contentionMultiplier, contendersCount }
   */
  recordHealingEvent(healingEvent) {
    if (!HEALING_CONTENTION_THRESHOLDS.ENABLED || !this.contentionEnabled) {
      return {
        eventId: `heal_${Date.now()}_${Math.random()}`,
        effectiveAmount: healingEvent.amount,
        contentionMultiplier: 1.0,
        contendersCount: 0
      };
    }

    const eventId = `heal_${Date.now()}_${Math.random()}`;
    const now = Date.now();

    // Clean up old healing events (older than temporal window)
    this.recentHealingEvents = this.recentHealingEvents.filter(e =>
      now - e.timestamp < HEALING_CONTENTION_THRESHOLDS.TEMPORAL_WINDOW_MS * 2 // Keep 2x window for safety
    );

    // Find contending networks (healing in same spatial region within time window)
    const contenders = this._findContentingHealers(healingEvent, now);

    // Calculate contention multiplier
    const multiplier = this._calculateContentionMultiplier(contenders.length);

    // Apply multiplier to healing amount
    const effectiveAmount = healingEvent.amount * multiplier;

    // Record this healing event
    const eventData = {
      eventId: eventId,
      networkId: healingEvent.networkId,
      link: healingEvent.link,
      regionId: healingEvent.regionId || healingEvent.link?.id || `region_${healingEvent.networkId}`,
      baseAmount: healingEvent.amount,
      effectiveAmount: effectiveAmount,
      contentionMultiplier: multiplier,
      contendersCount: contenders.length,
      timestamp: now
    };

    this.recentHealingEvents.push(eventData);

    // Track contention event (1% sample to reduce spam)
    if (contenders.length > 0 && Math.random() < 0.01) {
      this.contentionHistory.push({
        eventId: eventId,
        networkId: healingEvent.networkId,
        contendersCount: contenders.length,
        contentionMultiplier: multiplier.toFixed(3),
        baseAmount: healingEvent.amount.toFixed(4),
        effectiveAmount: effectiveAmount.toFixed(4),
        penaltyAmount: (healingEvent.amount - effectiveAmount).toFixed(4),
        timestamp: now
      });

      if (this.contentionHistory.length > HEALING_CONTENTION_THRESHOLDS.CONTENTION_HISTORY_LIMIT) {
        this.contentionHistory.shift();
      }
    }

    return {
      eventId: eventId,
      effectiveAmount: effectiveAmount,
      contentionMultiplier: multiplier,
      contendersCount: contenders.length
    };
  }

  /**
   * Find networks healing in same spatial region within time window
   * @private
   */
  _findContentingHealers(healingEvent, now) {
    const contenders = [];
    const regionId = healingEvent.regionId || healingEvent.link?.id;

    if (!regionId) return contenders;

    for (const recentEvent of this.recentHealingEvents) {
      // Skip self
      if (recentEvent.networkId === healingEvent.networkId) continue;

      // Check temporal overlap (within time window)
      const timeDelta = Math.abs(now - recentEvent.timestamp);
      if (timeDelta > HEALING_CONTENTION_THRESHOLDS.TEMPORAL_WINDOW_MS) continue;

      // Check spatial overlap (same region or adjacent)
      if (!this._isSpatiallyOverlapping(regionId, recentEvent.regionId)) continue;

      // This network is contending
      contenders.push({
        networkId: recentEvent.networkId,
        timeDelta: timeDelta,
        regionId: recentEvent.regionId
      });
    }

    return contenders;
  }

  /**
   * Check if two regions are spatially close (within SPATIAL_RANGE_HOPS)
   * @private
   */
  _isSpatiallyOverlapping(regionId1, regionId2) {
    if (!regionId1 || !regionId2) return false;

    // Direct match = overlapping
    if (regionId1 === regionId2) return true;

    // For simple implementation, same region overlap is sufficient
    // Extended version could check topological distance, but healing is usually localized
    return regionId1 === regionId2;
  }

  /**
   * Calculate efficiency multiplier based on contention
   * 
   * Formula: efficiency = 1 / (1 + CONTENTION_FACTOR × (contenders - 1))
   * 
   * @private
   */
  _calculateContentionMultiplier(contendersCount) {
    if (contendersCount < HEALING_CONTENTION_THRESHOLDS.MIN_CONTENDERS) {
      return 1.0; // No contention
    }

    // Apply formula
    const denominator = 1 + (HEALING_CONTENTION_THRESHOLDS.CONTENTION_FACTOR * (contendersCount - 1));
    let multiplier = 1.0 / denominator;

    // Hard floor: never drop below MIN_EFFICIENCY
    multiplier = Math.max(multiplier, HEALING_CONTENTION_THRESHOLDS.MIN_EFFICIENCY);

    return multiplier;
  }

  /**
   * Get contention status for a specific network
   * 
   * @param {String} networkId - Network to check
   * @returns {Object} { isContending, contendersCount, affectedLinks, avgPenalty }
   */
  getContentionStatus(networkId) {
    const now = Date.now();
    const networkHeals = this.recentHealingEvents.filter(e =>
      e.networkId === networkId &&
      now - e.timestamp < HEALING_CONTENTION_THRESHOLDS.TEMPORAL_WINDOW_MS
    );

    if (networkHeals.length === 0) {
      return {
        isContending: false,
        contendersCount: 0,
        affectedLinks: 0,
        avgPenalty: 0
      };
    }

    let totalPenalty = 0;
    for (const heal of networkHeals) {
      totalPenalty += (heal.baseAmount - heal.effectiveAmount);
    }

    return {
      isContending: networkHeals.some(h => h.contendersCount > 0),
      contendersCount: Math.max(...networkHeals.map(h => h.contendersCount)),
      affectedLinks: networkHeals.length,
      avgPenalty: (totalPenalty / networkHeals.length).toFixed(4)
    };
  }

  /**
   * Setup console API for debugging
   */
  setupConsoleAPI() {
    window.linkCorruptionDebug = {
      // Get info about a specific link
      linkInfo: (link) => {
        const info = this.getLinkInfo(link);
        console.table(info);
        return info;
      },

      // Manually set corruption on a link
      setLinkCorruption: (link, value) => {
        this.setLinkCorruption(link, value);
        console.log(`[LinkCorruptionTransmission] Link set to corruption ${value.toFixed(3)}`);
      },

      // Trigger cascade from a node
      cascadeFrom: (node) => {
        this.triggeCascadeToOutboundLinks(node);
        console.log(`[LinkCorruptionTransmission] Cascade triggered from node`, node.id);
      },

      // Rapidly infect entire network from a start node
      infectNetwork: (startNode, amount = 0.5) => {
        const allLinks = this.getAllLinks();
        for (const link of allLinks) {
          const linkData = this.initializeLink(link);
          if (linkData) {
            linkData.level = Math.min(1.0, linkData.level + amount);
          }
        }
        console.log(`[LinkCorruptionTransmission] Network infected with ${(amount * 100).toFixed(0)}%`);
      },

      // Show cascade history
      cascadeHistory: () => {
        const recent = this.cascadeHistory.slice(-20);
        console.table(recent.map(e => ({
          event: e.event,
          priority: e.priority,
          level: e.level.toFixed(3),
          age: (Date.now() - e.timestamp) / 1000
        })));
      },

      // Detailed link stats
      allLinksStats: () => {
        const allLinks = this.getAllLinks();
        const stats = allLinks.map(link => ({
          id: link.id,
          corruption: (this.linkCorruption.get(link.id)?.level || 0).toFixed(3),
          cascades: this.linkCorruption.get(link.id)?.cascadeThresholdsCrossed?.size || 0
        }));
        console.table(stats);
        return stats;
      },

      // Reset all corruption
      resetNetwork: () => {
        this.linkCorruption.clear();
        const allLinks = this.getAllLinks();
        for (const link of allLinks) {
          this._syncLinkUserDataMetrics(link, {
            corruptionLevel: 0,
            integrity: LINK_INTEGRITY_THRESHOLDS.INTEGRITY_MAX,
            integrityState: 'healthy'
          });
        }
        console.log('[LinkCorruptionTransmission] Network reset');
      },

      // Toggle debug mode
      toggleDebug: () => {
        this.debugMode = !this.debugMode;
        console.log(`[LinkCorruptionTransmission] Debug mode: ${this.debugMode}`);
      },

      // [Phase 3] Toggle healing cascades
      toggleHealing: () => {
        this.healingEnabled = !this.healingEnabled;
        console.log(`[LinkCorruptionTransmission] Healing cascades: ${this.healingEnabled}`);
      },

      // [Phase 3] Get healing statistics
      healingStats: () => {
        const recentHeals = this.healingHistory.slice(-20);
        const totalHealed = this.healingHistory.reduce((sum, h) => sum + h.healed, 0);
        const cascadeHeals = this.healingHistory.filter(h => h.cascadeDepth > 0).length;
        
        console.table(recentHeals.map(h => ({
          linkId: h.linkId,
          harmony: h.harmony?.toFixed(2) || 'N/A',
          healed: h.healed.toFixed(4),
          depth: h.cascadeDepth,
          age: ((Date.now() - h.timestamp) / 1000).toFixed(1)
        })));
        
        console.log(`[LinkCorruptionTransmission] Healing Summary:`, {
          totalHeals: this.healingHistory.length,
          totalHealedAmount: totalHealed.toFixed(3),
          cascadeHeals: cascadeHeals,
          activeCascades: this.activeHealingCascades.size
        });
      },

      // [Phase 3] Force healing on a link
      forceHeal: (link, amount = 0.1) => {
        const linkData = this.initializeLink(link);
        if (linkData) {
          linkData.level = Math.max(0, linkData.level - amount);
          console.log(`[LinkCorruptionTransmission] Link healed by ${amount.toFixed(3)}`);
          this._syncLinkUserDataMetrics(link);
        }
      },

      // [Phase 3b] Toggle harmony feedback loop on/off
      toggleHarmonyFeedback: () => {
        this.harmonyFeedbackEnabled = !this.harmonyFeedbackEnabled;
        console.log(`[LinkCorruptionTransmission] Harmony feedback: ${this.harmonyFeedbackEnabled}`);
      },

      // [Phase 3b] Get harmony growth statistics
      harmonyGrowthStats: () => {
        const recentGrowth = this.harmonyGrowthHistory.slice(-20);
        const totalHarmonyGained = this.harmonyGrowthHistory.reduce((sum, h) => sum + h.harmonyGainAmount, 0);
        const cascadeGains = this.harmonyGrowthHistory.filter(h => h.healedAmount < 0.01).length;
        
        console.table(recentGrowth.map(h => ({
          linkId: h.linkId,
          healed: h.healedAmount.toFixed(4),
          harmonyGain: h.harmonyGainAmount.toFixed(4),
          age: ((Date.now() - h.timestamp) / 1000).toFixed(1)
        })));
        
        console.log(`[LinkCorruptionTransmission] Harmony Growth Summary:`, {
          totalEvents: this.harmonyGrowthHistory.length,
          totalHarmonyGained: totalHarmonyGained.toFixed(3),
          averageGainPerEvent: this.harmonyGrowthHistory.length > 0 ? (totalHarmonyGained / this.harmonyGrowthHistory.length).toFixed(4) : '0',
          activeLinks: new Set(this.harmonyGrowthHistory.map(h => h.linkId)).size
        });
      },

      // [Phase 3b] Get detailed link harmony info
      linkHarmonyInfo: (link) => {
        const harmonyLevel = link.userData?.harmonyLevel ?? link.source?.userData?.harmonyLevel ?? 0;
        const lastGainTime = this.harmonyFeedbackLastTime.get(link.id) || 0;
        const timeSinceLastGain = (Date.now() - lastGainTime) / 1000;
        const canGainHarmony = timeSinceLastGain >= (HARMONY_FEEDBACK_THRESHOLDS.FEEDBACK_COOLDOWN_MS / 1000);
        
        const info = {
          linkId: link.id,
          harmonyLevel: harmonyLevel.toFixed(3),
          harmonyMax: HARMONY_FEEDBACK_THRESHOLDS.HARMONY_MAX,
          lastHarmonyGainAge: timeSinceLastGain.toFixed(1) + 's',
          inCooldown: !canGainHarmony,
          feedbackEnabled: this.harmonyFeedbackEnabled
        };
        
        console.table(info);
        return info;
      },

      // [Phase 4-lite] Toggle synergy feedback loop on/off
      toggleSynergyFeedback: () => {
        this.synergyFeedbackEnabled = !this.synergyFeedbackEnabled;
        console.log(`[LinkCorruptionTransmission] Synergy feedback: ${this.synergyFeedbackEnabled}`);
      },

      // [Phase 4-lite] Get synergy growth statistics
      synergyGrowthStats: () => {
        const recentGrowth = this.synergyGrowthHistory.slice(-20);
        const totalSynergyGained = this.synergyGrowthHistory.reduce((sum, s) => sum + s.synergyGainAmount, 0);
        const hardBlocks = this.synergyGrowthHistory.filter(s => s.hadHardBlock).length;
        
        console.table(recentGrowth.map(s => ({
          linkId: s.linkId,
          blocked: (s.blockedFraction * 100).toFixed(0) + '%',
          synergyGain: s.synergyGainAmount.toFixed(3),
          hardBlock: s.hadHardBlock ? 'YES' : 'NO',
          age: ((Date.now() - s.timestamp) / 1000).toFixed(1)
        })));
        
        console.log(`[LinkCorruptionTransmission] Synergy Growth Summary:`, {
          totalEvents: this.synergyGrowthHistory.length,
          totalSynergyGained: totalSynergyGained.toFixed(1),
          hardBlockEvents: hardBlocks,
          averageGainPerEvent: this.synergyGrowthHistory.length > 0 ? (totalSynergyGained / this.synergyGrowthHistory.length).toFixed(3) : '0'
        });
      },

      // [Phase 4-lite] Get detailed link synergy info
      linkSynergyInfo: (link) => {
        const synergyLevel = this._getLinkSynergyPct(link);
        const lastGainTime = this.synergyFeedbackLastTime.get(link.id) || 0;
        const timeSinceLastGain = (Date.now() - lastGainTime) / 1000;
        const canGainSynergy = timeSinceLastGain >= (SYNERGY_FEEDBACK_THRESHOLDS.FEEDBACK_COOLDOWN_MS / 1000);
        
        const info = {
          linkId: link.id,
          synergyLevel: synergyLevel.toFixed(1),
          synergyMax: SYNERGY_FEEDBACK_THRESHOLDS.SYNERGY_MAX,
          lastSynergyGainAge: timeSinceLastGain.toFixed(1) + 's',
          inCooldown: !canGainSynergy,
          feedbackEnabled: this.synergyFeedbackEnabled
        };
        
        console.table(info);
        return info;
      },

      // [Phase 5] Toggle resonance amplification on/off
      toggleResonance: () => {
        this.resonanceEnabled = !this.resonanceEnabled;
        console.log(`[LinkCorruptionTransmission] Resonance amplification: ${this.resonanceEnabled}`);
      },

      // [Phase 5] Get resonance statistics
      resonanceStats: () => {
        const recentResonance = this.resonanceHistory.slice(-20);
        const activeResonanceZones = this.resonanceHistory.filter(r => Date.now() - r.timestamp < 5000).length;
        
        console.table(recentResonance.map(r => ({
          linkId: r.linkId,
          neighbors: r.neighborCount,
          avgSynergy: r.avgSynergy.toFixed(1),
          avgHarmony: r.avgHarmony.toFixed(2),
          boost: ((r.resonanceFactor - 1.0) * 100).toFixed(1) + '%',
          age: ((Date.now() - r.timestamp) / 1000).toFixed(1)
        })));
        
        console.log(`[LinkCorruptionTransmission] Resonance Summary:`, {
          totalEvents: this.resonanceHistory.length,
          activeZones: activeResonanceZones,
          resonanceEnabled: this.resonanceEnabled
        });
      },

      // [Phase 5] Get detailed resonance info for a link
      linkResonanceInfo: (link) => {
        const neighbors = this.getLinkNeighbors(link);
        const resonanceFactor = this.computeResonanceAmplification(link);
        
        // Calculate averages for display
        let totalSynergy = this._getLinkSynergyPct(link);
        for (const n of neighbors) {
          totalSynergy += this._getLinkSynergyPct(n);
        }
        const avgSynergy = neighbors.length > 0 ? totalSynergy / (neighbors.length + 1) : this._getLinkSynergyPct(link);
        
        let totalHarmony = link.userData?.harmonyLevel ?? link.source?.userData?.harmonyLevel ?? 0;
        for (const n of neighbors) {
          const nHarmony = n.userData?.harmonyLevel ?? n.source?.userData?.harmonyLevel ?? 0;
          totalHarmony += nHarmony;
        }
        const avgHarmony = neighbors.length > 0 ? totalHarmony / (neighbors.length + 1) : (link.userData?.harmonyLevel ?? 0);
        
        const info = {
          linkId: link.id,
          neighbors: neighbors.length,
          densityThreshold: RESONANCE_THRESHOLDS.MIN_DENSE_NEIGHBORS,
          isDense: neighbors.length >= RESONANCE_THRESHOLDS.MIN_DENSE_NEIGHBORS,
          avgSynergy: avgSynergy.toFixed(1),
          synergyThreshold: RESONANCE_THRESHOLDS.SYNERGY_RESONANCE_THRESHOLD,
          synergySufficient: avgSynergy >= RESONANCE_THRESHOLDS.SYNERGY_RESONANCE_THRESHOLD,
          avgHarmony: avgHarmony.toFixed(2),
          harmonyThreshold: RESONANCE_THRESHOLDS.HARMONY_RESONANCE_THRESHOLD.toFixed(2),
          harmonySufficient: avgHarmony >= RESONANCE_THRESHOLDS.HARMONY_RESONANCE_THRESHOLD,
          resonanceFactor: resonanceFactor.toFixed(3),
          isResonating: resonanceFactor > 1.0
        };
        
        console.table(info);
        return info;
      },

      // [Phase 5] Check resonance across all links
      resonanceMap: () => {
        const allLinks = this.getAllLinks();
        const resonanceData = [];
        let resonatingCount = 0;
        
        for (const link of allLinks) {
          const resonanceFactor = this.computeResonanceAmplification(link);
          if (resonanceFactor > 1.0) {
            resonatingCount++;
            resonanceData.push({
              linkId: link.id,
              resonance: ((resonanceFactor - 1.0) * 100).toFixed(1) + '%',
              synergy: this._getLinkSynergyPct(link).toFixed(0)
            });
          }
        }
        
        console.table(resonanceData);
        console.log(`[LinkCorruptionTransmission] Network Resonance:`, {
          totalLinks: allLinks.length,
          resonatingLinks: resonatingCount,
          resonancePercentage: ((resonatingCount / allLinks.length) * 100).toFixed(1) + '%'
        });
      },

      // [Phase 5b] Toggle adjacent resonance on/off
      toggleAdjacentResonance: () => {
        this.adjacentResonanceEnabled = !this.adjacentResonanceEnabled;
        console.log(`[LinkCorruptionTransmission] Adjacent synergy resonance: ${this.adjacentResonanceEnabled}`);
      },

      // [Phase 5b] Get adjacent resonance statistics
      adjacentResonanceStats: () => {
        const recentAdjacent = this.adjacentResonanceHistory.slice(-20);
        const activeAdjacentZones = this.adjacentResonanceHistory.filter(r => Date.now() - r.timestamp < 5000).length;
        const avgBonusAmount = this.adjacentResonanceHistory.length > 0 
          ? (this.adjacentResonanceHistory.reduce((sum, r) => sum + r.adjacentBonus, 0) / this.adjacentResonanceHistory.length).toFixed(4)
          : '0';
        
        console.table(recentAdjacent.map(r => ({
          linkId: r.linkId,
          neighbors: r.highSynergyNeighbors,
          bonus: ((r.adjacentBonus) * 100).toFixed(1) + '%',
          baseResonance: r.baseResonanceFactor.toFixed(3),
          finalResonance: r.finalResonanceFactor.toFixed(3),
          boost: ((r.finalResonanceFactor - r.baseResonanceFactor) * 100).toFixed(1) + '%',
          age: ((Date.now() - r.timestamp) / 1000).toFixed(1)
        })));
        
        console.log(`[LinkCorruptionTransmission] Adjacent Resonance Summary:`, {
          totalEvents: this.adjacentResonanceHistory.length,
          activeZones: activeAdjacentZones,
          averageBonusAmount: avgBonusAmount,
          adjacentResonanceEnabled: this.adjacentResonanceEnabled
        });
      },

      // [Phase 5b] Get detailed adjacent resonance info for a link
      linkAdjacentResonanceInfo: (link) => {
        const neighbors = this.getLinkNeighbors(link);
        const highSynergyNeighbors = neighbors.filter(n => (n.synergy ?? 0) >= ADJACENT_SYNERGY_THRESHOLDS.SYNERGY_ADJACENT_THRESHOLD);
        
        const baseResonance = this.computeResonanceAmplification(link);
        const expectedBonus = Math.min(
          ADJACENT_SYNERGY_THRESHOLDS.ADJACENT_SYNERGY_MAX,
          highSynergyNeighbors.length * ADJACENT_SYNERGY_THRESHOLDS.ADJACENT_SYNERGY_BONUS
        );
        const expectedFinal = Math.min(RESONANCE_THRESHOLDS.RESONANCE_MAX, baseResonance + expectedBonus);
        
        const info = {
          linkId: link.id,
          totalNeighbors: neighbors.length,
          highSynergyNeighbors: highSynergyNeighbors.length,
          synergyThreshold: ADJACENT_SYNERGY_THRESHOLDS.SYNERGY_ADJACENT_THRESHOLD,
          baseResonanceFactor: baseResonance.toFixed(3),
          expectedAdjacentBonus: expectedBonus.toFixed(3),
          expectedFinalResonance: expectedFinal.toFixed(3),
          isAmplified: expectedBonus > 0,
          adjacentResonanceEnabled: ADJACENT_SYNERGY_THRESHOLDS.ENABLED && this.adjacentResonanceEnabled
        };
        
        console.table(info);
        return info;
      },

      // [Phase 5b] Find high-synergy clusters (neighborhoods with 3+ high-synergy neighbors)
      adjacentCoherenceClusters: () => {
        const allLinks = this.getAllLinks();
        const clusters = [];
        
        for (const link of allLinks) {
          const neighbors = this.getLinkNeighbors(link);
          const highSynergyNeighbors = neighbors.filter(n => this._getLinkSynergyPct(n) >= ADJACENT_SYNERGY_THRESHOLDS.SYNERGY_ADJACENT_THRESHOLD);
          
          if (highSynergyNeighbors.length >= 3) {
            const resonance = this.computeResonanceAmplification(link);
            clusters.push({
              linkId: link.id,
              linkSynergy: this._getLinkSynergyPct(link).toFixed(0),
              highSynergyNeighbors: highSynergyNeighbors.length,
              resonance: (resonance.toFixed(3))
            });
          }
        }
        
        if (clusters.length === 0) {
          console.log(`[LinkCorruptionTransmission] No adjacent coherence clusters found (need 3+ high-synergy neighbors)`);
        } else {
          console.table(clusters);
          console.log(`[LinkCorruptionTransmission] Found ${clusters.length} adjacent coherence clusters`);
        }
      },

      // [Phase 5c] Toggle cascade resonance on/off
      toggleCascadeResonance: () => {
        this.cascadeResonanceEnabled = !this.cascadeResonanceEnabled;
        console.log(`[LinkCorruptionTransmission] Cascade resonance: ${this.cascadeResonanceEnabled}`);
      },

      // [Phase 5c] Get cascade resonance statistics
      cascadeResonanceStats: () => {
        const recentCascade = this.cascadeResonanceHistory.slice(-20);
        const avgDecayReduction = this.cascadeResonanceHistory.length > 0
          ? (this.cascadeResonanceHistory.reduce((sum, r) => sum + (CASCADE_RESONANCE_THRESHOLDS.BASE_CASCADE_DECAY - r.effectiveDecay), 0) / this.cascadeResonanceHistory.length).toFixed(4)
          : '0';
        
        console.table(recentCascade.map(r => ({
          linkId: r.linkId,
          resonance: r.resonanceFactor.toFixed(3),
          baseDecay: CASCADE_RESONANCE_THRESHOLDS.BASE_CASCADE_DECAY.toFixed(3),
          effectiveDecay: r.effectiveDecay.toFixed(3),
          improvement: ((CASCADE_RESONANCE_THRESHOLDS.BASE_CASCADE_DECAY - r.effectiveDecay) * 100).toFixed(1) + '%',
          depth: r.cascadeDepth,
          strength: r.cascadeStrength.toFixed(3),
          age: ((Date.now() - r.timestamp) / 1000).toFixed(1)
        })));
        
        console.log(`[LinkCorruptionTransmission] Cascade Resonance Summary:`, {
          totalEvents: this.cascadeResonanceHistory.length,
          averageDecayReduction: avgDecayReduction,
          cascadeResonanceEnabled: this.cascadeResonanceEnabled
        });
      },

      // [Phase 5c] Get detailed cascade resonance info
      cascadeResonanceInfo: () => {
        const allLinks = this.getAllLinks();
        const cascadeInfo = [];
        
        for (const link of allLinks) {
          const resonance = this.computeResonanceAmplification(link);
          if (resonance > 1.0) {
            const baseDecay = CASCADE_RESONANCE_THRESHOLDS.BASE_CASCADE_DECAY;
            const effectiveDecay = baseDecay / resonance;
            const clampedDecay = Math.max(
              CASCADE_RESONANCE_THRESHOLDS.DECAY_MIN,
              Math.min(CASCADE_RESONANCE_THRESHOLDS.DECAY_MAX, effectiveDecay)
            );
            
            cascadeInfo.push({
              linkId: link.id,
              resonance: resonance.toFixed(3),
              baseDecay: baseDecay.toFixed(3),
              calculatedDecay: effectiveDecay.toFixed(3),
              effectiveDecay: clampedDecay.toFixed(3),
              healingTransmission: ((1 - clampedDecay) * 100).toFixed(1) + '%'
            });
          }
        }
        
        if (cascadeInfo.length === 0) {
          console.log(`[LinkCorruptionTransmission] No resonant cascades found (need resonance > 1.0)`);
        } else {
          console.table(cascadeInfo.slice(0, 15));
          console.log(`[LinkCorruptionTransmission] Found ${cascadeInfo.length} potential cascade resonance points`);
        }
      },

      // [Phase 5d] Toggle threat cascade on/off
      toggleThreatCascade: () => {
        this.threatCascadeEnabled = !this.threatCascadeEnabled;
        console.log(`[LinkCorruptionTransmission] Threat cascade: ${this.threatCascadeEnabled}`);
      },

      // [Phase 5d] Get threat cascade statistics
      threatCascadeStats: () => {
        const recentThreat = this.threatCascadeHistory.slice(-20);
        const avgDecayReduction = this.threatCascadeHistory.length > 0
          ? (this.threatCascadeHistory.reduce((sum, r) => sum + (THREAT_CASCADE_THRESHOLDS.BASE_THREAT_DECAY - r.effectiveDecay), 0) / this.threatCascadeHistory.length).toFixed(4)
          : '0';
        
        console.table(recentThreat.map(r => ({
          linkId: r.linkId,
          resonance: r.resonanceFactor.toFixed(3),
          baseDecay: THREAT_CASCADE_THRESHOLDS.BASE_THREAT_DECAY.toFixed(3),
          effectiveDecay: r.effectiveDecay.toFixed(3),
          improvement: ((THREAT_CASCADE_THRESHOLDS.BASE_THREAT_DECAY - r.effectiveDecay) * 100).toFixed(1) + '%',
          depth: r.cascadeDepth,
          strength: r.cascadeStrength.toFixed(3),
          age: ((Date.now() - r.timestamp) / 1000).toFixed(1)
        })));
        
        console.log(`[LinkCorruptionTransmission] Threat Cascade Summary:`, {
          totalEvents: this.threatCascadeHistory.length,
          averageDecayReduction: avgDecayReduction,
          threatCascadeEnabled: this.threatCascadeEnabled
        });
      },

      // [Phase 5d] Get detailed threat cascade info
      threatCascadeInfo: () => {
        const allLinks = this.getAllLinks();
        const threatInfo = [];
        
        for (const link of allLinks) {
          const linkData = this.linkCorruption.get(link.id) || this.initializeLink(link);
          if (linkData && linkData.level >= THREAT_CASCADE_THRESHOLDS.THREAT_ACTIVATION_LEVEL) {
            const resonance = this.computeResonanceAmplification(link);
            const baseDecay = THREAT_CASCADE_THRESHOLDS.BASE_THREAT_DECAY;
            const effectiveDecay = baseDecay / resonance;
            const clampedDecay = Math.max(
              THREAT_CASCADE_THRESHOLDS.DECAY_MIN,
              Math.min(THREAT_CASCADE_THRESHOLDS.DECAY_MAX, effectiveDecay)
            );
            
            threatInfo.push({
              linkId: link.id,
              corruption: linkData.level.toFixed(3),
              resonance: resonance.toFixed(3),
              baseDecay: baseDecay.toFixed(3),
              calculatedDecay: effectiveDecay.toFixed(3),
              effectiveDecay: clampedDecay.toFixed(3),
              threatTransmission: ((1 - clampedDecay) * 100).toFixed(1) + '%'
            });
          }
        }
        
        if (threatInfo.length === 0) {
          console.log(`[LinkCorruptionTransmission] No threat cascades found (need corruption > ${THREAT_CASCADE_THRESHOLDS.THREAT_ACTIVATION_LEVEL})`);
        } else {
          console.table(threatInfo.slice(0, 15));
          console.log(`[LinkCorruptionTransmission] Found ${threatInfo.length} threat cascade sources`);
        }
      },

      // [LINK INTEGRITY MODEL] Toggle integrity model on/off
      toggleIntegrity: () => {
        this.integrityEnabled = !this.integrityEnabled;
        console.log(`[LinkCorruptionTransmission] Link integrity model: ${this.integrityEnabled}`);
      },

      // [LINK INTEGRITY MODEL] Get integrity statistics
      integrityStats: () => {
        const allLinks = this.getAllLinks();
        const healthyLinks = [];
        const unstableLinks = [];
        const collapsedLinks = [];
        
        for (const link of allLinks) {
          const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;
          const integrityData = this.linkIntegrity.get(linkId);
          
          if (!integrityData) continue;
          
          const stats = {
            linkId: linkId,
            integrity: integrityData.integrity.toFixed(1),
            state: integrityData.state,
            corruption: (this.linkCorruption.get(linkId)?.level || 0).toFixed(2)
          };
          
          if (integrityData.state === 'healthy') healthyLinks.push(stats);
          else if (integrityData.state === 'unstable') unstableLinks.push(stats);
          else if (integrityData.state === 'collapsed') collapsedLinks.push(stats);
        }
        
        console.log(`[LinkCorruptionTransmission] Link Integrity Summary:`, {
          totalLinks: allLinks.length,
          healthyLinks: healthyLinks.length,
          unstableLinks: unstableLinks.length,
          collapsedLinks: collapsedLinks.length,
          integrityThresholds: {
            unstableZone: `${LINK_INTEGRITY_THRESHOLDS.UNSTABLE_ZONE_LOW}-${LINK_INTEGRITY_THRESHOLDS.UNSTABLE_ZONE_HIGH}%`,
            collapseThreshold: `${LINK_INTEGRITY_THRESHOLDS.COLLAPSE_THRESHOLD}%`
          }
        });
        
        if (unstableLinks.length > 0) {
          console.log('\nUnstable Links (at risk):');
          console.table(unstableLinks.slice(0, 10));
        }
        
        if (collapsedLinks.length > 0) {
          console.log('\nCollapsed Links (permanent):');
          console.table(collapsedLinks.slice(0, 10));
        }
      },

      // [LINK INTEGRITY MODEL] Get detailed integrity info for a link
      linkIntegrityInfo: (link) => {
        const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;
        const integrityData = this.linkIntegrity.get(linkId);
        const corruptionData = this.linkCorruption.get(linkId);
        
        if (!integrityData) {
          console.log(`[LinkCorruptionTransmission] Link not initialized or not tracked`);
          return null;
        }
        
        const info = {
          linkId: linkId,
          integrity: integrityData.integrity.toFixed(1) + '%',
          state: integrityData.state,
          corruption: (corruptionData?.level || 0).toFixed(3),
          isCollapsed: this.collapsedLinks.has(linkId),
          canHeal: !this.collapsedLinks.has(linkId),
          thresholds: {
            unstableHigh: LINK_INTEGRITY_THRESHOLDS.UNSTABLE_ZONE_HIGH,
            unstableLow: LINK_INTEGRITY_THRESHOLDS.UNSTABLE_ZONE_LOW,
            collapse: LINK_INTEGRITY_THRESHOLDS.COLLAPSE_THRESHOLD
          }
        };
        
        console.table(info);
        return info;
      },

      // [LINK INTEGRITY MODEL] Get integrity history (recent changes)
      integrityHistory: () => {
        const recent = this.integrityHistory.slice(-20);
        
        console.table(recent.map(h => ({
          linkId: h.linkId,
          integrity: h.integrity.toFixed(1),
          state: h.state,
          corruption: h.corruption.toFixed(2),
          stressMultiplier: h.stressMultiplier.toFixed(2),
          age: ((Date.now() - h.timestamp) / 1000).toFixed(1) + 's'
        })));
        
        console.log(`[LinkCorruptionTransmission] Integrity History:`, {
          totalEvents: this.integrityHistory.length,
          recentCollapses: this.integrityHistory.filter(h => h.state === 'collapsed').length,
          recentUnstable: this.integrityHistory.filter(h => h.state === 'unstable').length
        });
      },

      // [LINK INTEGRITY MODEL] Manually trigger collapse on a link (for testing)
      forceCollapse: (link) => {
        const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;
        const integrityData = this.linkIntegrity.get(linkId);
        
        if (!integrityData) {
          this.initializeLink(link);
        }
        
        this.collapsedLinks.add(linkId);
        const intData = this.linkIntegrity.get(linkId);
        intData.integrity = 0;
        intData.state = 'collapsed';
        
        console.log(`[LinkCorruptionTransmission] Link force-collapsed:`, linkId);
      },

      // [LINK INTEGRITY MODEL] Show network fragility map (links at risk of collapse)
      fragilitlyMap: () => {
        const allLinks = this.getAllLinks();
        const atRisk = [];
        
        for (const link of allLinks) {
          const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;
          const integrityData = this.linkIntegrity.get(linkId);
          const corruptionData = this.linkCorruption.get(linkId);
          
          if (integrityData && (integrityData.state === 'unstable' || integrityData.state === 'collapsed')) {
            atRisk.push({
              linkId: linkId,
              integrity: integrityData.integrity.toFixed(1),
              state: integrityData.state,
              corruption: (corruptionData?.level || 0).toFixed(2),
              risk: integrityData.state === 'unstable' ? 'HIGH' : 'CRITICAL'
            });
          }
        }
        
        if (atRisk.length === 0) {
          console.log(`[LinkCorruptionTransmission] Network is stable - no links at risk`);
        } else {
          console.table(atRisk);
          console.log(`[LinkCorruptionTransmission] Fragility Map:`, {
            totalLinks: allLinks.length,
            linksAtRisk: atRisk.length,
            riskPercentage: ((atRisk.length / allLinks.length) * 100).toFixed(1) + '%',
            unstableCount: atRisk.filter(l => l.state === 'unstable').length,
            collapsedCount: atRisk.filter(l => l.state === 'collapsed').length
          });
        }
      },

      // [Phase 6] Toggle reconstruction system on/off
      toggleReconstruction: () => {
        this.reconstructionEnabled = !this.reconstructionEnabled;
        console.log(`[LinkCorruptionTransmission] Link reconstruction: ${this.reconstructionEnabled}`);
      },

      // [Phase 6] Check if link can be rebuilt
      canRebuild: (link) => {
        const eligibility = this.canRebuildLink(link);
        console.table(eligibility);
        return eligibility;
      },

      // [Phase 6] Rebuild a collapsed link
      rebuildLink: (link) => {
        const result = this.rebuildCollapsedLink(link);
        if (result.success) {
          console.log('%c[Phase 6 Link Rebuild SUCCESS]', 'color: #ffcc00; font-weight: bold;', result);
        } else {
          console.log('%c[Phase 6 Link Rebuild FAILED]', 'color: #ff6644; font-weight: bold;', result);
        }
        return result;
      },

      // [Phase 6] Get reconstruction statistics
      reconstructionStats: () => {
        const allLinks = this.getAllLinks();
        const collapsedLinks = [];
        const reconstructedLinks = [];
        
        for (const link of allLinks) {
          const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;
          const integrityData = this.linkIntegrity.get(linkId);
          const reconstructionData = this.linkReconstruction.get(linkId);
          
          if (integrityData && integrityData.state === 'collapsed') {
            collapsedLinks.push({
              linkId,
              integrity: integrityData.integrity.toFixed(1),
              canRebuild: this.canRebuildLink(link).canRebuild
            });
          }
          
          if (reconstructionData && reconstructionData.rebuildCount > 0) {
            reconstructedLinks.push({
              linkId,
              rebuildCount: reconstructionData.rebuildCount,
              lastRebuildAge: ((Date.now() - reconstructionData.lastRebuildTime) / 1000).toFixed(1) + 's',
              integrity: (integrityData?.integrity || 0).toFixed(1),
              state: integrityData?.state || 'unknown'
            });
          }
        }
        
        const networkStress = this.computeNetworkStress();
        
        console.log(`[LinkCorruptionTransmission] Link Reconstruction Summary:`, {
          totalLinks: allLinks.length,
          collapsedLinks: collapsedLinks.length,
          reconstructedLinks: reconstructedLinks.length,
          networkStress: networkStress.toFixed(2),
          totalRebuilds: this.reconstructionHistory.length,
          reconstructionEnabled: this.reconstructionEnabled
        });
        
        if (collapsedLinks.length > 0) {
          console.log('\nCollapsed Links (awaiting rebuild):');
          console.table(collapsedLinks.slice(0, 10));
        }
        
        if (reconstructedLinks.length > 0) {
          console.log('\nReconstructed Links (history):');
          console.table(reconstructedLinks.slice(0, 10));
        }
      },

      // [Phase 6] Get reconstruction history
      reconstructionHistory: () => {
        const recent = this.reconstructionHistory.slice(-20);
        
        console.table(recent.map(r => ({
          linkId: r.linkId,
          rebuildCount: r.rebuildCount,
          integrityRestored: r.integrityRestored.toFixed(1),
          corruptionInitial: r.corruptionInitial.toFixed(2),
          harmonyCost: r.harmonyCost.toFixed(2),
          synergyCost: r.synergyCost.toFixed(0),
          networkStress: r.networkStress.toFixed(2),
          age: ((Date.now() - r.timestamp) / 1000).toFixed(1) + 's'
        })));
        
        console.log(`[LinkCorruptionTransmission] Reconstruction History:`, {
          totalEvents: this.reconstructionHistory.length,
          averageRebuildCount: this.reconstructionHistory.length > 0
            ? (this.reconstructionHistory.reduce((sum, r) => sum + r.rebuildCount, 0) / this.reconstructionHistory.length).toFixed(1)
            : '0'
        });
      },

      // [Phase 6] Get network stress level
      networkStress: () => {
        const stress = this.computeNetworkStress();
        const allLinks = this.getAllLinks();
        const collapsedCount = this.collapsedLinks.size;
        
        console.log(`[LinkCorruptionTransmission] Network Stress:`, {
          stressLevel: stress.toFixed(2),
          stressPercentage: (stress * 100).toFixed(1) + '%',
          collapsedLinks: collapsedCount,
          totalLinks: allLinks.length,
          rebuildThreshold: LINK_RECONSTRUCTION_THRESHOLDS.REBUILD_NETWORK_STRESS_MAX.toFixed(2),
          canRebuild: stress <= LINK_RECONSTRUCTION_THRESHOLDS.REBUILD_NETWORK_STRESS_MAX
        });
      },

      // [Phase 6] Manually rebuild a link (testing/admin)
      forceRebuild: (link) => {
        if (!link) {
          console.log('[LinkCorruptionTransmission] No link provided');
          return;
        }
        
        const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;
        const result = this.rebuildCollapsedLink(link);
        
        console.log('%c[Phase 6 Force Rebuild]', 'color: #ffcc00; font-weight: bold;', result);
        return result;
      },

      // [Phase 7] Toggle preventative barriers on/off
      toggleBarriers: () => {
        this.barriersEnabled = !this.barriersEnabled;
        console.log(`[LinkCorruptionTransmission] Preventative barriers: ${this.barriersEnabled}`);
      },

      // [Phase 7] Deploy barrier on a link or node
      deployBarrier: (linkOrNode) => {
        if (!linkOrNode) {
          console.log('[LinkCorruptionTransmission] No link/node provided');
          return;
        }
        
        linkOrNode.hasBarrier = true;
        const id = linkOrNode.id || `${linkOrNode.source?.id || 'unknown'}-${linkOrNode.target?.id || 'unknown'}`;
        
        // Invalidate cache
        this.barrierCacheTime.delete(id);
        
        console.log('%c[Phase 7 Barrier Deployed]', 'color: #00dd88; font-weight: bold;', {
          type: linkOrNode.source ? 'link' : 'node',
          id,
          hasBarrier: true
        });
      },

      // [Phase 7] Remove barrier from a link or node
      removeBarrier: (linkOrNode) => {
        if (!linkOrNode) {
          console.log('[LinkCorruptionTransmission] No link/node provided');
          return;
        }
        
        linkOrNode.hasBarrier = false;
        const id = linkOrNode.id || `${linkOrNode.source?.id || 'unknown'}-${linkOrNode.target?.id || 'unknown'}`;
        
        // Invalidate cache
        this.barrierCacheTime.delete(id);
        
        console.log('%c[Phase 7 Barrier Removed]', 'color: #ffaa44; font-weight: bold;', {
          type: linkOrNode.source ? 'link' : 'node',
          id,
          hasBarrier: false
        });
      },

      // [Phase 7] Check dampening effect for a link
      barrierDampening: (link) => {
        if (!link) {
          console.log('[LinkCorruptionTransmission] No link provided');
          return;
        }
        
        const barrierCount = this.countNearbyBarriers(link);
        const dampening = this.calculateStressDampening(link);
        
        const info = {
          linkId: link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`,
          barrierCount,
          dampening: (dampening * 100).toFixed(1) + '%',
          barrierMaxStacking: (PREVENTATIVE_BARRIERS_THRESHOLDS.BARRIER_DAMPENING_MAX * 100).toFixed(1) + '%',
          isMaxed: dampening >= PREVENTATIVE_BARRIERS_THRESHOLDS.BARRIER_DAMPENING_MAX
        };
        
        console.table(info);
        return info;
      },

      // [Phase 7] Get barrier statistics across network
      barrierStats: () => {
        const allLinks = this.getAllLinks();
        const barrieredLinks = [];
        let totalBarriers = 0;
        
        for (const link of allLinks) {
          if (this.hasBarrier(link)) {
            totalBarriers++;
            barrieredLinks.push({
              linkId: link.id,
              dampening: (this.calculateStressDampening(link) * 100).toFixed(1) + '%',
              nearbyBarriers: this.countNearbyBarriers(link)
            });
          }
        }
        
        console.log(`[LinkCorruptionTransmission] Preventative Barriers Summary:`, {
          totalLinks: allLinks.length,
          barrieredLinks: totalBarriers,
          barrierCoverage: ((totalBarriers / allLinks.length) * 100).toFixed(1) + '%',
          barriersEnabled: this.barriersEnabled,
          totalDampeningEvents: this.barrierDampeningHistory.length
        });
        
        if (barrieredLinks.length > 0) {
          console.log('\nLinks with Barriers:');
          console.table(barrieredLinks.slice(0, 15));
        }
      },

      // [Phase 7] Get barrier dampening history
      barrierHistory: () => {
        const recent = this.barrierDampeningHistory.slice(-20);
        
        console.table(recent.map(b => ({
          linkId: b.linkId,
          rawDelta: b.rawStressDelta.toFixed(4),
          barrierCount: b.barrierCount,
          dampening: (b.dampening * 100).toFixed(1) + '%',
          effectiveDelta: b.effectiveDelta.toFixed(4),
          reduction: b.reduction,
          age: ((Date.now() - b.timestamp) / 1000).toFixed(1) + 's'
        })));
        
        console.log(`[LinkCorruptionTransmission] Barrier Dampening History:`, {
          totalEvents: this.barrierDampeningHistory.length,
          averageDampening: this.barrierDampeningHistory.length > 0
            ? ((this.barrierDampeningHistory.reduce((sum, b) => sum + b.dampening, 0) / this.barrierDampeningHistory.length) * 100).toFixed(1) + '%'
            : '0%'
        });
      },

      // [Phase 7b] Deploy barrier with cost
      deployBarrier: (linkOrNode, sourceNode) => {
        if (!linkOrNode) {
          console.log('[LinkCorruptionTransmission] No link/node provided');
          return;
        }
        
        const result = this.deployBarrierWithCost(linkOrNode, sourceNode);
        if (result.success) {
          console.log('%c[Phase 7b Barrier Deployment SUCCESS]', 'color: #00dd88; font-weight: bold;', result);
        } else {
          console.log('%c[Phase 7b Barrier Deployment FAILED]', 'color: #ff6644; font-weight: bold;', result);
        }
        return result;
      },

      // [Phase 7b] Check barrier cost before deployment
      getBarrierCost: (linkOrNode) => {
        if (!linkOrNode) {
          console.log('[LinkCorruptionTransmission] No link/node provided');
          return null;
        }

        const baseCost = {
          harmony: BARRIER_DEPLOYMENT_COSTS.HARMONY_COST_PER_DEPLOYMENT,
          synergy: BARRIER_DEPLOYMENT_COSTS.SYNERGY_COST_PER_DEPLOYMENT
        };

        let scaleFactor = 1.0;
        let nearbyBarriers = 0;

        if (BARRIER_DEPLOYMENT_COSTS.COST_SCALING_ENABLED) {
          nearbyBarriers = this.countNearbyBarriersInRadius(linkOrNode, BARRIER_DEPLOYMENT_COSTS.NEARBY_BARRIER_RADIUS_HOPS);
          if (nearbyBarriers > 0) {
            const scalingIncrease = nearbyBarriers * BARRIER_DEPLOYMENT_COSTS.COST_SCALER_PER_BARRIER;
            scaleFactor = Math.min(1.0 + BARRIER_DEPLOYMENT_COSTS.COST_SCALER_MAX, 1.0 + scalingIncrease);
          }
        }

        const effectiveCost = {
          harmony: (baseCost.harmony * scaleFactor).toFixed(2),
          synergy: (baseCost.synergy * scaleFactor).toFixed(0)
        };

        const info = {
          baseCost,
          scaleFactor: scaleFactor.toFixed(2),
          nearbyBarriers,
          effectiveCost,
          phase7bEnabled: BARRIER_DEPLOYMENT_COSTS.ENABLED
        };

        console.table(info);
        return info;
      },

      // [Phase 7b] Process barrier upkeep manually
      processUpkeep: () => {
        this.processBarrierUpkeep(1/60);
        console.log(`[LinkCorruptionTransmission] Barrier upkeep processed`);
        
        const summary = {
          activeBarriers: 0,
          inactiveBarriers: 0,
          totalDebt: 0
        };

        for (const [id, data] of this.barrierCostTracking.entries()) {
          if (data.isActive) summary.activeBarriers++;
          else summary.inactiveBarriers++;
          summary.totalDebt += data.upkeepDebt || 0;
        }

        console.log(`[LinkCorruptionTransmission] Barrier Status:`, summary);
      },

      // [Phase 7b] Get barrier deployment info
      getBarrierInfo: (linkOrNode) => {
        if (!linkOrNode) {
          console.log('[LinkCorruptionTransmission] No link/node provided');
          return null;
        }

        const info = this.getBarrierDeploymentInfo(linkOrNode);
        if (!info) {
          console.log('[LinkCorruptionTransmission] No barrier deployment tracking found');
          return null;
        }

        const display = {
          linkId: linkOrNode.id || `${linkOrNode.source?.id || 'unknown'}-${linkOrNode.target?.id || 'unknown'}`,
          harmonyInvested: info.harmonyInvested.toFixed(2),
          synergyInvested: info.synergyInvested.toFixed(0),
          isActive: info.isActive,
          costScaleFactor: info.costScaleFactor.toFixed(2),
          upkeepDebt: info.upkeepDebt,
          deployedAge: ((Date.now() - info.deploymentTime) / 1000).toFixed(1) + 's',
          lastUpkeepAge: ((Date.now() - info.lastUpkeepTime) / 1000).toFixed(1) + 's'
        };

        console.table(display);
        return display;
      },

      // [Phase 7b] Get deployment history
      barrierDeploymentHistory: () => {
        const recent = this.barrierDeploymentHistory.slice(-30);
        
        console.table(recent.map(d => ({
          linkId: d.linkId,
          event: d.event,
          harmonyCost: d.harmonyCost ? d.harmonyCost.toFixed(2) : '-',
          synergyCost: d.synergyCost ? d.synergyCost.toFixed(0) : '-',
          scaleFactor: d.costScaleFactor ? d.costScaleFactor.toFixed(2) : '-',
          upkeepDebt: d.upkeepDebt || '-',
          isActive: d.isActive ? 'YES' : 'NO',
          age: ((Date.now() - d.timestamp) / 1000).toFixed(1) + 's'
        })));
        
        console.log(`[LinkCorruptionTransmission] Barrier Deployment History:`, {
          totalEvents: this.barrierDeploymentHistory.length,
          deploymentsCount: this.barrierDeploymentHistory.filter(d => d.event === 'deployment').length,
          upkeepPaidCount: this.barrierDeploymentHistory.filter(d => d.event === 'upkeep_paid').length,
          deactivatedCount: this.barrierDeploymentHistory.filter(d => d.event === 'deactivated_upkeep_debt').length,
          phase7bEnabled: BARRIER_DEPLOYMENT_COSTS.ENABLED,
          upkeepEnabled: BARRIER_DEPLOYMENT_COSTS.UPKEEP_ENABLED
        });
      },

      // [Phase 7b] Get network-wide barrier cost summary
      barrierCostSummary: () => {
        let totalHarmonyInvested = 0;
        let totalSynergyInvested = 0;
        let activeCount = 0;
        let inactiveCount = 0;

        for (const [id, data] of this.barrierCostTracking.entries()) {
          totalHarmonyInvested += data.harmonyInvested || 0;
          totalSynergyInvested += data.synergyInvested || 0;
          if (data.isActive) activeCount++;
          else inactiveCount++;
        }

        console.log(`[LinkCorruptionTransmission] Barrier Cost Summary:`, {
          totalBarriers: this.barrierCostTracking.size,
          activeBarriers: activeCount,
          inactiveBarriers: inactiveCount,
          totalHarmonyInvested: totalHarmonyInvested.toFixed(2),
          totalSynergyInvested: totalSynergyInvested.toFixed(0),
          phase7bEnabled: BARRIER_DEPLOYMENT_COSTS.ENABLED,
          upkeepEnabled: BARRIER_DEPLOYMENT_COSTS.UPKEEP_ENABLED,
          upkeepInterval: `${(BARRIER_DEPLOYMENT_COSTS.UPKEEP_INTERVAL_MS / 1000).toFixed(0)}s`,
          baseCosts: {
            harmony: BARRIER_DEPLOYMENT_COSTS.HARMONY_COST_PER_DEPLOYMENT,
            synergy: BARRIER_DEPLOYMENT_COSTS.SYNERGY_COST_PER_DEPLOYMENT
          }
        });
      },

      // [Phase 7b] Toggle Phase 7b on/off (for testing)
      togglePhase7b: () => {
        BARRIER_DEPLOYMENT_COSTS.ENABLED = !BARRIER_DEPLOYMENT_COSTS.ENABLED;
        console.log(`[LinkCorruptionTransmission] Phase 7b (Barrier Costs): ${BARRIER_DEPLOYMENT_COSTS.ENABLED ? 'ENABLED' : 'DISABLED'}`);
      },

      // [Phase 7b] Toggle barrier upkeep on/off
      toggleBarrierUpkeep: () => {
        this.barrierUpkeepEnabled = !this.barrierUpkeepEnabled;
        console.log(`[LinkCorruptionTransmission] Barrier upkeep: ${this.barrierUpkeepEnabled ? 'ENABLED' : 'DISABLED'}`);
      },

      // [Phase 5 Axis 1] Toggle stress coupling on/off
      toggleStressCoupling: () => {
        this.stressCouplingEnabled = !this.stressCouplingEnabled;
        console.log(`[LinkCorruptionTransmission] Stress coupling: ${this.stressCouplingEnabled ? 'ENABLED' : 'DISABLED'}`);
      },

      // [Phase 5 Axis 1] Get stress coupling statistics
      stressCouplingStats: () => {
        const networkStressMap = new Map();
        
        for (const [networkId, stress] of this.ambientStressPerNetwork) {
          if (stress > 0) {
            networkStressMap.set(networkId, {
              networkId: networkId,
              ambientStress: stress.toFixed(3),
              stressPercentage: (stress * 100).toFixed(1) + '%'
            });
          }
        }

        if (networkStressMap.size === 0) {
          console.log(`[LinkCorruptionTransmission] No ambient stress detected (networks are isolated)`);
        } else {
          console.table(Array.from(networkStressMap.values()));
          console.log(`[LinkCorruptionTransmission] Ambient Stress Summary:`, {
            pressurizedNetworks: networkStressMap.size,
            stressCouplingEnabled: this.stressCouplingEnabled,
            totalCouplingEvents: this.stressCouplingHistory.length
          });
        }
      },

      // [Phase 5 Axis 1] Get stress coupling history
      stressCouplingHistory: () => {
        const recent = this.stressCouplingHistory.slice(-20);
        
        console.table(recent.map(c => ({
          networkId: c.networkId,
          neighborStress: c.neighborStress,
          injection: c.injection,
          currentAmbient: c.currentAmbient,
          age: ((Date.now() - c.timestamp) / 1000).toFixed(1) + 's'
        })));

        console.log(`[LinkCorruptionTransmission] Stress Coupling History:`, {
          totalEvents: this.stressCouplingHistory.length,
          samplingInterval: `${STRESS_COUPLING_THRESHOLDS.SAMPLE_INTERVAL_MS}ms`,
          couplingFactor: STRESS_COUPLING_THRESHOLDS.COUPLING_FACTOR,
          maxInjectionPerFrame: STRESS_COUPLING_THRESHOLDS.MAX_AMBIENT_INJECTION_PER_FRAME
        });
      },

      // [Phase 5 Axis 1] Get ambient stress for a network
      getNetworkAmbientStress: (networkId) => {
        const stress = this.getAmbientStress(networkId);
        
        const info = {
          networkId: networkId,
          ambientStress: stress.toFixed(3),
          stressPercentage: (stress * 100).toFixed(1) + '%',
          stressIsPressurizing: stress > 0.05
        };

        console.table(info);
        return stress;
      },

      // [Phase 5 Axis 1] Get network adjacency cache
      networkAdjacency: () => {
        const adjacencies = [];

        for (const [networkId, neighbors] of this.networkAdjacencyCache) {
          for (const neighbor of neighbors) {
            adjacencies.push({
              from: networkId,
              to: neighbor.networkId,
              distance: neighbor.distance,
              dampening: (STRESS_COUPLING_THRESHOLDS.DISTANCE_DAMPENING[neighbor.distance] * 100).toFixed(0) + '%'
            });
          }
        }

        if (adjacencies.length === 0) {
          console.log(`[LinkCorruptionTransmission] No network adjacencies found (networks are isolated)`);
        } else {
          console.table(adjacencies);
          console.log(`[LinkCorruptionTransmission] Network Adjacency Map:`, {
            totalConnections: adjacencies.length,
            uniqueNetworks: new Set([...adjacencies.map(a => a.from), ...adjacencies.map(a => a.to)]).size
          });
        }
      },

      // [Phase 5 Axis 1] Clear all ambient stress (testing only)
      clearAmbientStress: () => {
        const clearedCount = this.ambientStressPerNetwork.size;
        this.ambientStressPerNetwork.clear();
        console.log(`[LinkCorruptionTransmission] Cleared ambient stress from ${clearedCount} networks`);
      },

      // [Phase 5 Axis 2] Toggle healing contention on/off
      toggleHealingContention: () => {
        this.contentionEnabled = !this.contentionEnabled;
        console.log(`[LinkCorruptionTransmission] Healing contention: ${this.contentionEnabled ? 'ENABLED' : 'DISABLED'}`);
      },

      // [Phase 5 Axis 2] Get healing contention statistics
      healingContentionStats: () => {
        const now = Date.now();
        const activeHeals = this.recentHealingEvents.filter(e =>
          now - e.timestamp < HEALING_CONTENTION_THRESHOLDS.TEMPORAL_WINDOW_MS
        );

        if (activeHeals.length === 0) {
          console.log(`[LinkCorruptionTransmission] No active healing events (no contention)`);
          return;
        }

        const contentionEvents = activeHeals.filter(h => h.contendersCount > 0);
        const totalBasHealing = activeHeals.reduce((sum, h) => sum + h.baseAmount, 0);
        const totalEffectiveHealing = activeHeals.reduce((sum, h) => sum + h.effectiveAmount, 0);
        const totalPenalty = totalBasHealing - totalEffectiveHealing;

        console.table(contentionEvents.slice(0, 15).map(c => ({
          networkId: c.networkId,
          contenders: c.contendersCount,
          multiplier: c.contentionMultiplier.toFixed(3),
          baseHealing: c.baseAmount.toFixed(4),
          effectiveHealing: c.effectiveAmount.toFixed(4),
          penalty: (c.baseAmount - c.effectiveAmount).toFixed(4),
          age: ((now - c.timestamp) / 1000).toFixed(2) + 's'
        })));

        console.log(`[LinkCorruptionTransmission] Healing Contention Summary:`, {
          activeHeals: activeHeals.length,
          contentionEvents: contentionEvents.length,
          totalBaseHealing: totalBasHealing.toFixed(4),
          totalEffectiveHealing: totalEffectiveHealing.toFixed(4),
          totalPenalty: totalPenalty.toFixed(4),
          avgPenaltyPercent: ((totalPenalty / totalBasHealing) * 100).toFixed(1) + '%',
          healingContentionEnabled: this.contentionEnabled
        });
      },

      // [Phase 5 Axis 2] Get healing contention history
      healingContentionHistory: () => {
        const recent = this.contentionHistory.slice(-20);

        console.table(recent.map(c => ({
          networkId: c.networkId,
          contenders: c.contendersCount,
          multiplier: c.contentionMultiplier,
          baseHealing: c.baseAmount,
          effectiveHealing: c.effectiveAmount,
          penalty: c.penaltyAmount,
          age: ((Date.now() - c.timestamp) / 1000).toFixed(1) + 's'
        })));

        console.log(`[LinkCorruptionTransmission] Healing Contention History:`, {
          totalEvents: this.contentionHistory.length,
          contentionFactor: HEALING_CONTENTION_THRESHOLDS.CONTENTION_FACTOR,
          minEfficiency: (HEALING_CONTENTION_THRESHOLDS.MIN_EFFICIENCY * 100).toFixed(0) + '%',
          temporalWindow: HEALING_CONTENTION_THRESHOLDS.TEMPORAL_WINDOW_MS + 'ms'
        });
      },

      // [Phase 5 Axis 2] Get contention status for a network
      getNetworkContentionStatus: (networkId) => {
        const status = this.getContentionStatus(networkId);

        const display = {
          networkId: networkId,
          isContending: status.isContending ? 'YES' : 'NO',
          maxContenders: status.contendersCount,
          affectedLinks: status.affectedLinks,
          avgPenalty: status.avgPenalty + ' healing',
          healingContentionEnabled: this.contentionEnabled
        };

        console.table(display);
        return status;
      },

      // [Phase 5 Axis 2] Simulate a healing event (testing)
      simulateHealingEvent: (networkId, amount = 0.1) => {
        const mockEvent = {
          networkId: networkId,
          link: { id: `link_${networkId}_${Date.now()}` },
          amount: amount,
          regionId: `region_${networkId}`
        };

        const result = this.recordHealingEvent(mockEvent);

        console.log(`[LinkCorruptionTransmission] Healing Event Simulated:`, {
          networkId: networkId,
          baseAmount: amount.toFixed(4),
          effectiveAmount: result.effectiveAmount.toFixed(4),
          contentionMultiplier: result.contentionMultiplier.toFixed(3),
          contendersCount: result.contendersCount,
          penalty: ((amount - result.effectiveAmount) * 100).toFixed(1) + '%'
        });

        return result;
      },

      // [Phase 5 Axis 2] Clear all healing events (testing only)
      clearHealingEvents: () => {
        const clearedCount = this.recentHealingEvents.length;
        this.recentHealingEvents = [];
        this.contentionHistory = [];
        console.log(`[LinkCorruptionTransmission] Cleared ${clearedCount} healing events`);
      },

      // [Phase 5 Axis 2] Get contention formula and parameters
      contentionFormula: () => {
        const examples = [];
        for (let n = 1; n <= 10; n++) {
          const multiplier = this._calculateContentionMultiplier(n);
          examples.push({
            contenders: n,
            formula: `1 / (1 + 0.10 × ${n - 1})`,
            efficiency: (multiplier * 100).toFixed(1) + '%'
          });
        }

        console.table(examples);
        console.log(`[LinkCorruptionTransmission] Healing Contention Formula:`, {
          formula: 'efficiency = 1 / (1 + FACTOR × (contenders - 1))',
          factor: HEALING_CONTENTION_THRESHOLDS.CONTENTION_FACTOR,
          minEfficiency: (HEALING_CONTENTION_THRESHOLDS.MIN_EFFICIENCY * 100).toFixed(0) + '%',
          temporalWindow: HEALING_CONTENTION_THRESHOLDS.TEMPORAL_WINDOW_MS + 'ms',
          spatialRange: HEALING_CONTENTION_THRESHOLDS.SPATIAL_RANGE_HOPS + ' hops'
        });
      },

      // Get network corruption level (average corruption across all nodes)
      getNetworkCorruption: () => {
        const allNodes = this.aiNodes?.nodes || [];
        if (allNodes.length === 0) return 0;

        let totalCorruption = 0;
        let corruptedNodeCount = 0;

        for (const node of allNodes) {
          const corruption = node.userData?.metrics?.corruption ?? node.userData?.corruption ?? 0;
          if (corruption > 0) {
            totalCorruption += corruption;
            corruptedNodeCount++;
          }
        }

        // Return average corruption (0-1 scale)
        return corruptedNodeCount > 0 ? totalCorruption / allNodes.length : 0;
      }
    };

    console.log('%c[LinkCorruptionTransmission_v1] Debug API ready at window.linkCorruptionDebug', 'color: #00ff00;');
  }
}

export default LinkCorruptionTransmission_v1;
