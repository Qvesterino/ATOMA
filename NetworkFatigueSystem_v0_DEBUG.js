/**
 * ============================================================================
 * NETWORK FATIGUE SYSTEM v0 — DEBUG / FLAGGED PROTOTYPE
 * ============================================================================
 * 
 * INTEGRATION: Called from NodeDynamicMetrics.update() AFTER all metrics computed
 * 
 * FEATURE FLAG:
 *   window.ENABLE_NETWORK_FATIGUE = true/false
 * 
 * DATA MODEL:
 *   node.userData.fatigue ∈ [0.0, 1.0]
 * 
 * NON-BREAKING: Fatigue only applies as soft multipliers
 * REVERSIBLE: Can be disabled instantly via flag
 * 
 * ============================================================================
 */

// ============================================================================
// NUMERIC RATES (MANDATORY - From approved spec)
// ============================================================================

const FATIGUE_RATES = {
  ACCUM_RATE: 0.0065,   // per second, base accumulation
  RECOVER_RATE: 0.0030, // per second, base recovery
};

// Weighted stress components
const STRESS_WEIGHTS = {
  load: 0.40,
  instability: 0.30,
  corruption: 0.20,
  harmonyDeficit: 0.10
};

// Category sensitivity multipliers (during accumulation)
const CATEGORY_SENSITIVITY = {
  input: 1.15,
  process: 1.00,
  integration: 0.90,
  analytics: 0.85,
  storage: 0.75,
  control: 0.95
};

// Health component weights (during recovery)
const HEALTH_WEIGHTS = {
  load: 0.40,
  instability: 0.30,
  harmony: 0.20,
  corruption: 0.10
};

// Fatigue multiplier effects (soft only - never flip logic)
const FATIGUE_EFFECTS = {
  harmonyRate: 0.40,         // -40% max harmony rate
  synergy: 0.35,             // -35% max synergy
  corruptionDecay: 0.30      // -30% max corruption decay
};

// ============================================================================
// FATIGUE SYSTEM STATE
// ============================================================================

let ENABLE_NETWORK_FATIGUE = true;
let FATIGUE_DEBUG_LOG = true; // Verbose logging for development

// ============================================================================
// PUBLIC API
// ============================================================================

export function setNetworkFatigueEnabled(enabled) {
  ENABLE_NETWORK_FATIGUE = enabled;
  if (enabled) {
    console.log('✓ Network Fatigue ENABLED');
  } else {
    console.log('✓ Network Fatigue DISABLED (all nodes reset to fatigue=0)');
  }
}

export function updateNetworkFatigue(node, deltaTime, metrics) {
  if (!ENABLE_NETWORK_FATIGUE || !metrics || !node.userData) {
    return;
  }
  
  // Initialize fatigue if needed
  if (node.userData.fatigue === undefined) {
    node.userData.fatigue = 0.0;
  }
  
  const currentFatigue = node.userData.fatigue;
  const category = node.userData.category || 'process';
  const sensitivity = CATEGORY_SENSITIVITY[category] ?? 1.0;
  
  // ======== ACCUMULATION PHASE ========
  const stressComposite = computeStressComposite(metrics);
  
  if (stressComposite > 0.01) {
    // Accumulate fatigue
    const accumulationDelta = 
      deltaTime * 
      FATIGUE_RATES.ACCUM_RATE * 
      stressComposite * 
      sensitivity;
    
    node.userData.fatigue += accumulationDelta;
    
    if (FATIGUE_DEBUG_LOG && currentFatigue > 0.1) {
      console.log(`[FATIGUE] ${category} Node: ${currentFatigue.toFixed(4)} → ${Math.min(1, node.userData.fatigue).toFixed(4)} (stress=${stressComposite.toFixed(3)}, sens=${sensitivity}x)`);
    }
  }
  
  // ======== RECOVERY PHASE ========
  const isHealthy = checkRecoveryConditions(metrics);
  
  if (isHealthy && currentFatigue > 0.01) {
    const healthComposite = computeHealthComposite(metrics);
    const recoveryDelta = deltaTime * FATIGUE_RATES.RECOVER_RATE * healthComposite;
    
    node.userData.fatigue -= recoveryDelta;
    
    if (FATIGUE_DEBUG_LOG) {
      console.log(`[FATIGUE-RECOVERY] ${category} Node: ${currentFatigue.toFixed(4)} → ${Math.max(0, node.userData.fatigue).toFixed(4)} (health=${healthComposite.toFixed(3)})`);
    }
  }
  
  // ======== CLAMP ========
  node.userData.fatigue = Math.max(0.0, Math.min(1.0, node.userData.fatigue));
}

export function getFatigueHarmonyMultiplier(node) {
  if (!ENABLE_NETWORK_FATIGUE || !node?.userData?.fatigue) {
    return 1.0;
  }
  return 1.0 - (node.userData.fatigue * FATIGUE_EFFECTS.harmonyRate);
}

export function getFatigueSynergyMultiplier(node) {
  if (!ENABLE_NETWORK_FATIGUE || !node?.userData?.fatigue) {
    return 1.0;
  }
  return 1.0 - (node.userData.fatigue * FATIGUE_EFFECTS.synergy);
}

export function getFatigueCorruptionDecayMultiplier(node) {
  if (!ENABLE_NETWORK_FATIGUE || !node?.userData?.fatigue) {
    return 1.0;
  }
  return 1.0 - (node.userData.fatigue * FATIGUE_EFFECTS.corruptionDecay);
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function computeStressComposite(metrics) {
  if (!metrics) {
    return 0;
  }
  
  // Load factor: high if loadRatio > 0.75
  const loadFactor = clamp((metrics.loadRatio - 0.75) / 0.25, 0, 1);
  
  // Instability factor: high if instability > 60
  const instabilityFactor = clamp((metrics.instability - 60) / 40, 0, 1);
  
  // Corruption factor: high if corruption > 40
  const corruptionFactor = clamp((metrics.corruption - 40) / 60, 0, 1);
  
  // Harmony deficit: high if harmony < 20
  const harmonyDeficitFactor = clamp((20 - metrics.harmony) / 20, 0, 1);
  
  // Weighted composite
  return (
    STRESS_WEIGHTS.load * loadFactor +
    STRESS_WEIGHTS.instability * instabilityFactor +
    STRESS_WEIGHTS.corruption * corruptionFactor +
    STRESS_WEIGHTS.harmonyDeficit * harmonyDeficitFactor
  );
}

function checkRecoveryConditions(metrics) {
  if (!metrics) {
    return false;
  }
  
  // All conditions must be true
  return (
    metrics.loadRatio < 0.50 &&
    metrics.instability < 30 &&
    metrics.harmony > 40 &&
    metrics.corruption < 30
  );
}

function computeHealthComposite(metrics) {
  if (!metrics) {
    return 0;
  }
  
  // Load health: good if loadRatio < 0.50
  const loadHealth = clamp((0.50 - metrics.loadRatio) / 0.50, 0, 1);
  
  // Instability health: good if instability < 30
  const instabilityHealth = clamp((30 - metrics.instability) / 30, 0, 1);
  
  // Harmony health: good if harmony > 40
  const harmonyHealth = clamp((metrics.harmony - 40) / 60, 0, 1);
  
  // Corruption health: good if corruption < 30
  const corruptionHealth = clamp((30 - metrics.corruption) / 30, 0, 1);
  
  // Weighted composite
  return (
    HEALTH_WEIGHTS.load * loadHealth +
    HEALTH_WEIGHTS.instability * instabilityHealth +
    HEALTH_WEIGHTS.harmony * harmonyHealth +
    HEALTH_WEIGHTS.corruption * corruptionHealth
  );
}

// ============================================================================
// DEBUG CONSOLE API
// ============================================================================

export function setupFatigueDebugConsole() {
  if (!window.debugFatigue) {
    window.debugFatigue = function(nodeId) {
      // Placeholder - will be set by caller with node reference
      console.warn('debugFatigue not configured - pass node directly');
    };
  }
  
  if (!window.FATIGUE_DEBUG) {
    window.FATIGUE_DEBUG = {
      enable: () => {
        setNetworkFatigueEnabled(true);
      },
      disable: () => {
        setNetworkFatigueEnabled(false);
      },
      setLogging: (enabled) => {
        FATIGUE_DEBUG_LOG = enabled;
        console.log(`Fatigue logging: ${enabled ? 'ON' : 'OFF'}`);
      },
      getState: (node) => {
        if (!node?.userData?.fatigue) {
          return { error: 'No fatigue data' };
        }
        const metrics = node.userData.metrics;
        const stress = computeStressComposite(metrics);
        const isHealthy = checkRecoveryConditions(metrics);
        const health = computeHealthComposite(metrics);
        
        return {
          fatigue: Number(node.userData.fatigue.toFixed(4)),
          state: isHealthy ? 'RECOVERING' : (stress > 0.01 ? 'ACCUMULATING' : 'STABLE'),
          stressComposite: Number(stress.toFixed(4)),
          healthComposite: Number(health.toFixed(4)),
          category: node.userData.category || 'process',
          metrics: {
            loadRatio: Number(metrics.loadRatio.toFixed(3)),
            instability: Number(metrics.instability.toFixed(1)),
            corruption: Number(metrics.corruption.toFixed(1)),
            harmony: Number(metrics.harmony.toFixed(1))
          },
          multipliers: {
            harmonyRate: Number(getFatigueHarmonyMultiplier(node).toFixed(3)),
            synergy: Number(getFatigueSynergyMultiplier(node).toFixed(3)),
            corruptionDecay: Number(getFatigueCorruptionDecayMultiplier(node).toFixed(3))
          }
        };
      },
      seedFatigue: (node, value) => {
        if (node?.userData) {
          node.userData.fatigue = Math.max(0, Math.min(1, value));
          console.log(`✓ Seeded fatigue to ${value.toFixed(4)}`);
        }
      },
      printAll: (nodes) => {
        if (!nodes || nodes.length === 0) {
          console.log('No nodes provided');
          return;
        }
        console.log(`\n${'='.repeat(80)}`);
        console.log(`FATIGUE STATUS (${nodes.length} nodes) — Flag: ${ENABLE_NETWORK_FATIGUE ? 'ON' : 'OFF'}`);
        console.log(`${'='.repeat(80)}`);
        
        for (let i = 0; i < Math.min(nodes.length, 10); i++) {
          const node = nodes[i];
          const state = window.FATIGUE_DEBUG.getState(node);
          
          if (state.error) {
            console.log(`Node ${i}: ${state.error}`);
          } else {
            console.log(`\nNode ${i} [${state.category}]`);
            console.log(`  Fatigue: ${state.fatigue} | State: ${state.state}`);
            console.log(`  Stress: ${state.stressComposite} | Health: ${state.healthComposite}`);
            console.log(`  Metrics: Load=${state.metrics.loadRatio} Inst=${state.metrics.instability} Corr=${state.metrics.corruption} Harm=${state.metrics.harmony}`);
            console.log(`  Multipliers: Harmony=${state.multipliers.harmonyRate} Synergy=${state.multipliers.synergy} Decay=${state.multipliers.corruptionDecay}`);
          }
        }
        
        if (nodes.length > 10) {
          console.log(`\n... and ${nodes.length - 10} more nodes`);
        }
        
        console.log(`\n${'='.repeat(80)}\n`);
      }
    };
    
    console.log('✓ Fatigue debug console API available at window.FATIGUE_DEBUG');
  }
}
