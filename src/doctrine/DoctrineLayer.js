/**
 * DOCTRINE LAYER — Run-Shaper Edition
 * Mid-run drafting system where doctrines shape decision types, not just numbers.
 *
 * 3 strong run-shapers replace 5 weak numeric schools:
 *   - sacrifice_pivot: abandon/reroute favored, short intense crises
 *   - reinforce_discipline: hold lines, extended crises, reinforced links stronger
 *   - risky_rewind: gamble on precise rewind timing, short peak, massive reward
 */

export const DOCTRINE_VERSION = 2;

// ── Run Shaper Definitions ──────────────────────────────────────────────────
// Each shaper defines how it changes crisis pattern, collapse tolerance,
// counterplay payoff ratios, and rewind behavior.

export const RUN_SHAPER_DEFINITIONS = Object.freeze({
  sacrifice_pivot: Object.freeze({
    id: 'sacrifice_pivot',
    label: 'SACRIFICE \u0026 PIVOT',
    description: 'Abandon weak corridors. Reroute fast. Let things break.',
    decisionType: 'sacrifice',
    crisisPattern: Object.freeze({
      introDurationScale: 0.8,
      surgeDurationScale: 0.9,
      peakDurationScale: 0.6,
      decayDurationScale: 0.5,
      intensityCurveScale: 1.15
    }),
    collapseTolerance: Object.freeze({
      fractureThresholdOffset: 0.15,
      collapseRateScale: 0.85,
      recoveryRateScale: 1.0
    }),
    counterplayPayoff: Object.freeze({
      rerouteReliefScale: 1.6,
      rerouteRecoveryImpulseScale: 1.2,
      reinforceDurationScale: 0.6,
      reinforceStabilityCostScale: 1.4,
      reinforceRecoveryImpulseScale: 0.8,
      abandonReliefScale: 1.0,
      abandonStabilityBonus: 0.03,
      tickPressureScale: 1.05
    }),
    rewindBehavior: Object.freeze({
      thresholdOffset: -0.05,
      gateDurationScale: 0.7,
      peakBonusMultiplier: 1.0
    })
  }),
  reinforce_discipline: Object.freeze({
    id: 'reinforce_discipline',
    label: 'REINFORCE DISCIPLINE',
    description: 'Hold lines. Weather the storm. Reinforced links are your fortress.',
    decisionType: 'discipline',
    crisisPattern: Object.freeze({
      introDurationScale: 1.2,
      surgeDurationScale: 1.4,
      peakDurationScale: 1.5,
      decayDurationScale: 1.2,
      intensityCurveScale: 0.9
    }),
    collapseTolerance: Object.freeze({
      fractureThresholdOffset: -0.10,
      collapseRateScale: 1.0,
      recoveryRateScale: 0.9
    }),
    counterplayPayoff: Object.freeze({
      rerouteReliefScale: 0.8,
      rerouteRecoveryImpulseScale: 0.9,
      reinforceDurationScale: 1.8,
      reinforceStabilityCostScale: 0.5,
      reinforceRecoveryImpulseScale: 1.3,
      abandonReliefScale: 1.0,
      abandonStabilityBonus: 0.0,
      tickPressureScale: 0.95
    }),
    rewindBehavior: Object.freeze({
      thresholdOffset: 0.06,
      gateDurationScale: 1.5,
      peakBonusMultiplier: 1.0
    })
  }),
  risky_rewind: Object.freeze({
    id: 'risky_rewind',
    label: 'RISKY REWIND',
    description: 'Gamble on precise rewind timing. The window is narrow but the payoff is massive.',
    decisionType: 'gamble',
    crisisPattern: Object.freeze({
      introDurationScale: 0.7,
      surgeDurationScale: 0.8,
      peakDurationScale: 0.5,
      decayDurationScale: 0.6,
      intensityCurveScale: 1.3
    }),
    collapseTolerance: Object.freeze({
      fractureThresholdOffset: 0.0,
      collapseRateScale: 1.08,
      recoveryRateScale: 1.3
    }),
    counterplayPayoff: Object.freeze({
      rerouteReliefScale: 1.0,
      rerouteRecoveryImpulseScale: 1.0,
      reinforceDurationScale: 1.0,
      reinforceStabilityCostScale: 1.0,
      reinforceRecoveryImpulseScale: 1.0,
      abandonReliefScale: 1.0,
      abandonStabilityBonus: 0.0,
      tickPressureScale: 1.0
    }),
    rewindBehavior: Object.freeze({
      thresholdOffset: -0.08,
      gateDurationScale: 0.8,
      peakBonusMultiplier: 1.5
    })
  })
});

// ── Legacy school mapping for backward compatibility ────────────────────────
const LEGACY_SCHOOL_TO_SHAPER = Object.freeze({
  synergy_cascade: 'sacrifice_pivot',
  pressure_embrace: 'sacrifice_pivot',
  stability_doctrine: 'reinforce_discipline',
  harmony_resonance: 'risky_rewind',
  corruption_acceptance: 'risky_rewind'
});

// ── World Mutators (unchanged) ─────────────────────────────────────────────
export const WORLD_MUTATOR_DEFINITIONS = Object.freeze({
  quantum_split_window: Object.freeze({
    id: 'quantum_split_window',
    world: 'quantum',
    label: 'SPLIT WINDOW',
    description: 'Risk windows trigger probability branching. Unstable = powerful.',
    metricModifiers: Object.freeze({
      synergy: { scale: 1.3 }
    }),
    appliesTo: ['quantum']
  }),
  quantum_entropy_wave: Object.freeze({
    id: 'quantum_entropy_wave',
    world: 'quantum',
    label: 'ENTROPY WAVE',
    description: 'Synergy spikes cause controlled instability. Ride the wave.',
    metricModifiers: Object.freeze({}),
    appliesTo: ['quantum']
  }),
  desert_memory_echo: Object.freeze({
    id: 'desert_memory_echo',
    world: 'desert',
    label: 'MEMORY ECHO',
    description: 'Drift patterns repeat past trajectories. Learn from history.',
    metricModifiers: Object.freeze({}),
    appliesTo: ['desert']
  }),
  desert_deep_anchor: Object.freeze({
    id: 'desert_deep_anchor',
    world: 'desert',
    label: 'DEEP ANCHOR',
    description: 'Anchor bodies form with longer hold. Patience = power.',
    metricModifiers: Object.freeze({
      stability: { scale: 1.25 }
    }),
    appliesTo: ['desert']
  })
});

// ── Crisis Cards (unchanged) ─────────────────────────────────────────────────
export const CRISIS_CARD_DEFINITIONS = Object.freeze({
  resonance_surge: Object.freeze({
    id: 'resonance_surge',
    label: 'RESONANCE SURGE',
    triggerMetric: 'synergy',
    triggerThreshold: 0.8,
    duration: 15,
    metricModifiers: Object.freeze({
      synergy: { surgeMultiplier: 1.8 },
      loadPressure: { drift: 0.15 }
    }),
    description: 'High synergy triggers cascade surge. Ride it or contain it.'
  }),
  integrity_fracture: Object.freeze({
    id: 'integrity_fracture',
    label: 'INTEGRITY FRACTURE',
    triggerMetric: 'corruption',
    triggerThreshold: 0.5,
    duration: 12,
    metricModifiers: Object.freeze({
      corruption: { scale: 2.0 },
      stability: { drift: -0.3 }
    }),
    description: 'Corruption breaches integrity. Nodes fracture under pressure.'
  }),
  anchor_collapse: Object.freeze({
    id: 'anchor_collapse',
    label: 'ANCHOR COLLAPSE',
    triggerMetric: 'stability',
    triggerThreshold: 0.3,
    duration: 18,
    metricModifiers: Object.freeze({
      stability: { collapseRate: 0.05 }
    }),
    description: 'Low stability causes anchor collapse. Re-stabilize or fragment.'
  }),
  pressure_rupture: Object.freeze({
    id: 'pressure_rupture',
    label: 'PRESSURE RUPTURE',
    triggerMetric: 'loadPressure',
    triggerThreshold: 0.75,
    duration: 10,
    metricModifiers: Object.freeze({
      loadPressure: { ruptureDrain: 0.08 }
    }),
    description: 'Load pressure reaches critical mass. System ruptures or absorbs.'
  }),
  harmony_void: Object.freeze({
    id: 'harmony_void',
    label: 'HARMONY VOID',
    triggerMetric: 'harmony',
    triggerThreshold: 0.2,
    duration: 20,
    metricModifiers: Object.freeze({}),
    description: 'Harmony collapses to void. Slow recovery or cascade failure.'
  })
});

// ── Helpers ───────────────────────────────────────────────────────────────

export function getRunShaper(id) {
  return RUN_SHAPER_DEFINITIONS[id] || null;
}

export function getWorldMutator(id) {
  return WORLD_MUTATOR_DEFINITIONS[id] || null;
}

export function getCrisisCard(id) {
  return CRISIS_CARD_DEFINITIONS[id] || null;
}

export function getAvailableShapers(world = null, unlockedDoctrines = null) {
  const all = Object.values(RUN_SHAPER_DEFINITIONS);
  if (!unlockedDoctrines) return all;
  const unlocked = new Set(unlockedDoctrines);
  return all.filter(s => unlocked.has(s.id));
}

export function getAvailableMutators(world = null) {
  const worldKey = String(world || '').trim().toLowerCase();
  if (!worldKey || worldKey === 'quantum') {
    return Object.values(WORLD_MUTATOR_DEFINITIONS).filter(m => m.appliesTo.includes('quantum'));
  }
  if (worldKey === 'desert') {
    return Object.values(WORLD_MUTATOR_DEFINITIONS).filter(m => m.appliesTo.includes('desert'));
  }
  return [];
}

export function resolveCrisisTrigger(metrics = {}) {
  const { synergy = 0, harmony = 0, stability = 0, corruption = 0, loadPressure = 0 } = metrics;

  if (synergy >= 0.8) return { crisis: 'resonance_surge', metrics: { synergy } };
  if (corruption >= 0.5) return { crisis: 'integrity_fracture', metrics: { corruption } };
  if (stability <= 0.3) return { crisis: 'anchor_collapse', metrics: { stability } };
  if (loadPressure >= 0.75) return { crisis: 'pressure_rupture', metrics: { loadPressure } };
  if (harmony <= 0.2) return { crisis: 'harmony_void', metrics: { harmony } };

  return null;
}

// ── State Management ──────────────────────────────────────────────────────

export function sanitizeDoctrineState(value = {}) {
  const state = value && typeof value === 'object' ? value : {};

  // Migrate legacy activeSchools array → single activeShaper
  let activeShaper = state.activeShaper || null;
  if (!activeShaper && Array.isArray(state.activeSchools) && state.activeSchools.length > 0) {
    const firstLegacy = state.activeSchools[0];
    activeShaper = LEGACY_SCHOOL_TO_SHAPER[firstLegacy] || null;
  }
  if (activeShaper && !RUN_SHAPER_DEFINITIONS[activeShaper]) {
    activeShaper = null;
  }

  const activeMutators = Array.isArray(state.activeMutators)
    ? state.activeMutators.filter(id => WORLD_MUTATOR_DEFINITIONS[id])
    : [];

  const activeCrisis = state.activeCrisis && typeof state.activeCrisis === 'object'
    ? {
        id: String(state.activeCrisis.id || ''),
        startTime: Number.isFinite(state.activeCrisis.startTime) ? state.activeCrisis.startTime : 0,
        duration: Number.isFinite(state.activeCrisis.duration) ? state.activeCrisis.duration : 0
      }
    : null;

  // Migrate legacy unlockedDoctrines
  let unlockedDoctrines = Array.isArray(state.unlockedDoctrines)
    ? state.unlockedDoctrines.slice()
    : [];
  // Map any legacy school IDs to shaper IDs
  unlockedDoctrines = unlockedDoctrines.map(id => {
    if (RUN_SHAPER_DEFINITIONS[id]) return id;
    const mapped = LEGACY_SCHOOL_TO_SHAPER[id];
    return mapped || id;
  });
  // Deduplicate
  unlockedDoctrines = [...new Set(unlockedDoctrines)];
  // Filter to only valid shapers and mutators
  unlockedDoctrines = unlockedDoctrines.filter(id =>
    RUN_SHAPER_DEFINITIONS[id] || WORLD_MUTATOR_DEFINITIONS[id]
  );

  const draftHistory = Array.isArray(state.draftHistory)
    ? state.draftHistory.slice(-20)
    : [];

  return {
    version: DOCTRINE_VERSION,
    activeShaper,
    activeMutators,
    activeCrisis,
    unlockedDoctrines,
    draftHistory,
    draftCount: Number.isFinite(state.draftCount) ? state.draftCount : 0
  };
}

export function applyDraftToState(state = {}, draft = {}, world = null) {
  const current = sanitizeDoctrineState(state);
  const { shaperId, mutatorId } = draft;

  const next = { ...current };

  if (shaperId && RUN_SHAPER_DEFINITIONS[shaperId]) {
    next.activeShaper = shaperId;
  }

  if (mutatorId && WORLD_MUTATOR_DEFINITIONS[mutatorId]) {
    const mutator = WORLD_MUTATOR_DEFINITIONS[mutatorId];
    const worldKey = String(world || '').trim().toLowerCase();
    if (worldKey && mutator.appliesTo.includes(worldKey)) {
      if (!next.activeMutators.includes(mutatorId)) {
        next.activeMutators = [...next.activeMutators, mutatorId];
      }
    }
  }

  next.draftHistory = [...next.draftHistory, { ...draft, timestamp: Date.now() }];
  next.draftCount = current.draftCount + 1;

  return next;
}

// ── Modifier Computation ──────────────────────────────────────────────────
// Returns both legacy numeric modifiers AND the active shaper config
// for downstream systems that need decision-shaping parameters.

export function computeDoctrineModifiers(state = {}) {
  const docState = sanitizeDoctrineState(state);

  const modifiers = {
    synergy: { scale: 1, drift: 0 },
    harmony: { scale: 1, drift: 0 },
    stability: { scale: 1, drift: 0, softCap: 1 },
    corruption: { scale: 1, drift: 0 },
    loadPressure: { scale: 1, drift: 0 }
  };

  // Apply mutator numeric modifiers (unchanged behavior)
  for (const mutatorId of docState.activeMutators) {
    const mutator = WORLD_MUTATOR_DEFINITIONS[mutatorId];
    if (!mutator) continue;

    const mutMods = mutator.metricModifiers;

    if (mutMods.synergy) {
      if (mutMods.synergy.scale) modifiers.synergy.scale *= mutMods.synergy.scale;
      if (mutMods.synergy.drift) modifiers.synergy.drift += mutMods.synergy.drift;
    }
    if (mutMods.stability) {
      if (mutMods.stability.scale) modifiers.stability.scale *= mutMods.stability.scale;
      if (mutMods.stability.drift) modifiers.stability.drift += mutMods.stability.drift;
      if (mutMods.stability.softCap !== undefined) modifiers.stability.softCap = mutMods.stability.softCap;
    }
    if (mutMods.harmony) {
      if (mutMods.harmony.scale) modifiers.harmony.scale *= mutMods.harmony.scale;
      if (mutMods.harmony.drift) modifiers.harmony.drift += mutMods.harmony.drift;
    }
    if (mutMods.loadPressure) {
      if (mutMods.loadPressure.scale) modifiers.loadPressure.scale *= mutMods.loadPressure.scale;
      if (mutMods.loadPressure.drift) modifiers.loadPressure.drift += mutMods.loadPressure.drift;
    }
  }

  // Apply crisis card numeric modifiers (unchanged behavior)
  if (docState.activeCrisis) {
    const crisis = CRISIS_CARD_DEFINITIONS[docState.activeCrisis.id];
    if (crisis) {
      const crisisMods = crisis.metricModifiers;
      if (crisisMods.synergy?.surgeMultiplier) modifiers.synergy.scale *= crisisMods.synergy.surgeMultiplier;
      if (crisisMods.stability?.collapseRate) modifiers.stability.drift -= crisisMods.stability.collapseRate;
      if (crisisMods.corruption?.scale) modifiers.corruption.scale *= crisisMods.corruption.scale;
      if (crisisMods.loadPressure?.ruptureDrain) modifiers.loadPressure.scale *= (1 - crisisMods.loadPressure.ruptureDrain);
    }
  }

  // Attach active shaper config for downstream decision-shaping systems
  const shaper = docState.activeShaper ? RUN_SHAPER_DEFINITIONS[docState.activeShaper] : null;

  return {
    ...modifiers,
    shaperConfig: shaper || null,
    activeShaper: docState.activeShaper
  };
}

// ── Milestone Unlocks ───────────────────────────────────────────────────────

export function determineMilestoneDoctrineUnlocks(metaProgression = {}, milestone = {}, world = null) {
  const unlocks = [];
  const milestoneKey = String(milestone || '').trim().toLowerCase();

  if (milestoneKey === 'won') {
    unlocks.push({ type: 'shaper', id: 'risky_rewind' });
    if (world === 'quantum') {
      unlocks.push({ type: 'mutator', id: 'quantum_entropy_wave' });
    } else if (world === 'desert') {
      unlocks.push({ type: 'mutator', id: 'desert_deep_anchor' });
    }
  }

  if (milestoneKey === 'crisis_survived') {
    unlocks.push({ type: 'shaper', id: 'reinforce_discipline' });
  }

  // Starting shaper is always unlocked
  unlocks.push({ type: 'shaper', id: 'sacrifice_pivot' });

  return unlocks;
}

// ── Default Export ────────────────────────────────────────────────────────

export default {
  DOCTRINE_VERSION,
  RUN_SHAPER_DEFINITIONS,
  WORLD_MUTATOR_DEFINITIONS,
  CRISIS_CARD_DEFINITIONS,
  getRunShaper,
  getWorldMutator,
  getCrisisCard,
  getAvailableShapers,
  getAvailableMutators,
  resolveCrisisTrigger,
  sanitizeDoctrineState,
  applyDraftToState,
  computeDoctrineModifiers,
  determineMilestoneDoctrineUnlocks
};
