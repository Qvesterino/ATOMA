/**
 * DOCTRINE LAYER
 * Mid-run drafting system using existing global metrics:
 * synergy, harmony, stability, corruption, loadPressure
 * 
 * Integrates with RunIdentityProfiles for package/state selection
 * and MetricsRuntime_v1 for real-time metric application.
 */

export const DOCTRINE_VERSION = 1;

export const SCHOOL_OF_THOUGHT_DEFINITIONS = Object.freeze({
  synergy_cascade: Object.freeze({
    id: 'synergy_cascade',
    label: 'SYNERGY CASCADE',
    description: 'Synergy scoring amplified. Momentum builds on momentum.',
    metricModifiers: Object.freeze({
      synergy: { scale: 1.5 },
      corruption: { drift: 0.2 }
    }),
    riskWindow: true,
    riskThreshold: 0.85
  }),
  stability_doctrine: Object.freeze({
    id: 'stability_doctrine',
    label: 'STABILITY DOCTRINE',
    description: 'Anchors form stronger. Hold pressure becomes your ally.',
    metricModifiers: Object.freeze({
      stability: { scale: 1.25 },
      synergy: { decay: 0.3 }
    }),
    anchorBonus: 1.5
  }),
  pressure_embrace: Object.freeze({
    id: 'pressure_embrace',
    label: 'PRESSURE EMBRACE',
    description: 'LoadPressure becomes active resource. More pressure, more power.',
    metricModifiers: Object.freeze({
      loadPressure: { active: true, scale: 1.4 },
      stability: { softCap: 0.7 }
    }),
    pressureBuff: true
  }),
  harmony_resonance: Object.freeze({
    id: 'harmony_resonance',
    label: 'HARMONY RESONANCE',
    description: 'Harmony decay slowed. Coherence holds longer under stress.',
    metricModifiers: Object.freeze({
      harmony: { decayScale: 0.5 },
      corruption: { resist: 0.15 }
    }),
    harmonyExtension: true
  }),
  corruption_acceptance: Object.freeze({
    id: 'corruption_acceptance',
    label: 'CORRUPTION ACCEPTANCE',
    description: 'Corruption spreads faster. But your nodes tolerate more.',
    metricModifiers: Object.freeze({
      corruption: { spread: 1.5, tolerance: 0.25 },
      stability: { drift: 0.15 }
    }),
    corruptionBoost: true
  })
});

export const WORLD_MUTATOR_DEFINITIONS = Object.freeze({
  quantum_split_window: Object.freeze({
    id: 'quantum_split_window',
    world: 'quantum',
    label: 'SPLIT WINDOW',
    description: 'Risk windows trigger probability branching. Unstable = powerful.',
    metricModifiers: Object.freeze({
      stability: { splitTrigger: true, splitThreshold: 0.4 },
      synergy: { splitBonus: 1.3 }
    }),
    appliesTo: ['quantum']
  }),
  quantum_entropy_wave: Object.freeze({
    id: 'quantum_entropy_wave',
    world: 'quantum',
    label: 'ENTROPY WAVE',
    description: 'Synergy spikes cause controlled instability. Ride the wave.',
    metricModifiers: Object.freeze({
      synergy: { spikeEffect: true, spikeThreshold: 0.75 },
      loadPressure: { spikeSync: true }
    }),
    appliesTo: ['quantum']
  }),
  desert_memory_echo: Object.freeze({
    id: 'desert_memory_echo',
    world: 'desert',
    label: 'MEMORY ECHO',
    description: 'Drift patterns repeat past trajectories. Learn from history.',
    metricModifiers: Object.freeze({
      harmony: { echoHistory: true, echoWeight: 0.3 },
      stability: { echoStabilize: true }
    }),
    appliesTo: ['desert']
  }),
  desert_deep_anchor: Object.freeze({
    id: 'desert_deep_anchor',
    world: 'desert',
    label: 'DEEP ANCHOR',
    description: 'Anchor bodies form with longer hold. Patience = power.',
    metricModifiers: Object.freeze({
      stability: { anchorDuration: 1.5, holdBonus: 1.25 },
      synergy: { anchorDecay: 0.8 }
    }),
    appliesTo: ['desert']
  })
});

export const CRISIS_CARD_DEFINITIONS = Object.freeze({
  resonance_surge: Object.freeze({
    id: 'resonance_surge',
    label: 'RESONANCE SURGE',
    triggerMetric: 'synergy',
    triggerThreshold: 0.8,
    duration: 15,
    metricModifiers: Object.freeze({
      synergy: { surge: true, surgeMultiplier: 1.8 },
      loadPressure: { surgeCost: 0.15 }
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
      corruption: { fracture: true, fractureSpread: 2.0 },
      stability: { fracturePenalty: 0.3 }
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
      stability: { collapse: true, collapseRate: 0.05 },
      harmony: { collapseDecay: 1.5 }
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
      loadPressure: { rupture: true, ruptureDrain: 0.08 },
      corruption: { pressureCorruption: true }
    }),
    description: 'Load pressure reaches critical mass. System ruptures or absorbs.'
  }),
  harmony_void: Object.freeze({
    id: 'harmony_void',
    label: 'HARMONY VOID',
    triggerMetric: 'harmony',
    triggerThreshold: 0.2,
    duration: 20,
    metricModifiers: Object.freeze({
      harmony: { void: true, voidRecovery: 0.4 },
      stability: { voidInstability: true }
    }),
    description: 'Harmony collapses to void. Slow recovery or cascade failure.'
  })
});

export function getSchoolOfThought(id) {
  return SCHOOL_OF_THOUGHT_DEFINITIONS[id] || null;
}

export function getWorldMutator(id) {
  return WORLD_MUTATOR_DEFINITIONS[id] || null;
}

export function getCrisisCard(id) {
  return CRISIS_CARD_DEFINITIONS[id] || null;
}

export function getAvailableSchools(world = null) {
  return Object.values(SCHOOL_OF_THOUGHT_DEFINITIONS);
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

export function sanitizeDoctrineState(value = {}) {
  const state = value && typeof value === 'object' ? value : {};
  
  const activeSchools = Array.isArray(state.activeSchools) 
    ? state.activeSchools.filter(id => SCHOOL_OF_THOUGHT_DEFINITIONS[id])
    : [];
  
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
  
  const unlockedDoctrines = Array.isArray(state.unlockedDoctrines)
    ? state.unlockedDoctrines.filter(id => 
        SCHOOL_OF_THOUGHT_DEFINITIONS[id] || 
        WORLD_MUTATOR_DEFINITIONS[id]
      )
    : ['synergy_cascade', 'stability_doctrine', 'pressure_embrace'];
  
  const draftHistory = Array.isArray(state.draftHistory)
    ? state.draftHistory.slice(-20)
    : [];
  
  return {
    version: DOCTRINE_VERSION,
    activeSchools,
    activeMutators,
    activeCrisis,
    unlockedDoctrines,
    draftHistory,
    draftCount: Number.isFinite(state.draftCount) ? state.draftCount : 0
  };
}

export function applyDraftToState(state = {}, draft = {}, world = null) {
  const current = sanitizeDoctrineState(state);
  const { schoolId, mutatorId } = draft;
  
  const next = { ...current };
  
  if (schoolId && SCHOOL_OF_THOUGHT_DEFINITIONS[schoolId]) {
    if (!next.activeSchools.includes(schoolId)) {
      next.activeSchools = [...next.activeSchools, schoolId];
    }
  }
  
  if (mutatorId && WORLD_MUTATOR_DEFINITIONS[mutatorId]) {
    const mutator = WORLD_MUTATOR_DEFINITIONS[mutatorId];
    if (!world || mutator.appliesTo.includes(world)) {
      if (!next.activeMutators.includes(mutatorId)) {
        next.activeMutators = [...next.activeMutators, mutatorId];
      }
    }
  }
  
  next.draftHistory = [...next.draftHistory, { ...draft, timestamp: Date.now() }];
  next.draftCount = current.draftCount + 1;
  
  return next;
}

export function computeDoctrineModifiers(state = {}) {
  const docState = sanitizeDoctrineState(state);
  
  const modifiers = {
    synergy: { scale: 1, decay: 0, drift: 0, active: false, spikeEffect: false },
    harmony: { scale: 1, decayScale: 1, drift: 0, active: false },
    stability: { scale: 1, drift: 0, softCap: 1, splitTrigger: false },
    corruption: { spread: 1, tolerance: 0, drift: 0, resist: 0 },
    loadPressure: { scale: 1, active: false }
  };
  
  for (const schoolId of docState.activeSchools) {
    const school = SCHOOL_OF_THOUGHT_DEFINITIONS[schoolId];
    if (!school) continue;
    
    const schoolMods = school.metricModifiers;
    
    if (schoolMods.synergy) {
      if (schoolMods.synergy.scale) modifiers.synergy.scale *= schoolMods.synergy.scale;
      if (schoolMods.synergy.decay) modifiers.synergy.decay += schoolMods.synergy.decay;
      if (schoolMods.synergy.drift) modifiers.synergy.drift += schoolMods.synergy.drift;
      if (schoolMods.synergy.active) modifiers.synergy.active = true;
    }
    if (schoolMods.harmony) {
      if (schoolMods.harmony.scale) modifiers.harmony.scale *= schoolMods.harmony.scale;
      if (schoolMods.harmony.decayScale) modifiers.harmony.decayScale *= schoolMods.harmony.decayScale;
    }
    if (schoolMods.stability) {
      if (schoolMods.stability.scale) modifiers.stability.scale *= schoolMods.stability.scale;
      if (schoolMods.stability.drift) modifiers.stability.drift += schoolMods.stability.drift;
      if (schoolMods.stability.softCap !== undefined) modifiers.stability.softCap = schoolMods.stability.softCap;
    }
    if (schoolMods.corruption) {
      if (schoolMods.corruption.spread) modifiers.corruption.spread *= schoolMods.corruption.spread;
      if (schoolMods.corruption.tolerance) modifiers.corruption.tolerance += schoolMods.corruption.tolerance;
      if (schoolMods.corruption.drift) modifiers.corruption.drift += schoolMods.corruption.drift;
    }
    if (schoolMods.loadPressure) {
      if (schoolMods.loadPressure.scale) modifiers.loadPressure.scale *= schoolMods.loadPressure.scale;
      if (schoolMods.loadPressure.active) modifiers.loadPressure.active = true;
    }
  }
  
  for (const mutatorId of docState.activeMutators) {
    const mutator = WORLD_MUTATOR_DEFINITIONS[mutatorId];
    if (!mutator) continue;
    
    const mutMods = mutator.metricModifiers;
    
    if (mutMods.synergy) {
      if (mutMods.synergy.scale) modifiers.synergy.scale *= mutMods.synergy.scale;
      if (mutMods.synergy.splitBonus) modifiers.synergy.scale *= mutMods.synergy.splitBonus;
      if (mutMods.synergy.spikeEffect) modifiers.synergy.spikeEffect = true;
    }
    if (mutMods.stability) {
      if (mutMods.stability.scale) modifiers.stability.scale *= mutMods.stability.scale;
      if (mutMods.stability.splitTrigger) modifiers.stability.splitTrigger = true;
    }
    if (mutMods.harmony) {
      if (mutMods.harmony.scale) modifiers.harmony.scale *= mutMods.harmony.scale;
    }
    if (mutMods.loadPressure) {
      if (mutMods.loadPressure.scale) modifiers.loadPressure.scale *= mutMods.loadPressure.scale;
    }
  }
  
  if (docState.activeCrisis) {
    const crisis = CRISIS_CARD_DEFINITIONS[docState.activeCrisis.id];
    if (crisis) {
      const crisisMods = crisis.metricModifiers;
      if (crisisMods.synergy?.surgeMultiplier) modifiers.synergy.scale *= crisisMods.synergy.surgeMultiplier;
      if (crisisMods.stability?.collapseRate) modifiers.stability.drift -= crisisMods.stability.collapseRate;
      if (crisisMods.corruption?.spread) modifiers.corruption.spread *= crisisMods.corruption.spread;
      if (crisisMods.loadPressure?.ruptureDrain) modifiers.loadPressure.scale *= (1 - crisisMods.loadPressure.ruptureDrain);
    }
  }
  
  return modifiers;
}

export function determineMilestoneDoctrineUnlocks(metaProgression = {}, milestone = {}, world = null) {
  const unlocks = [];
  const milestoneKey = String(milestone || '').trim().toLowerCase();
  
  if (milestoneKey === 'won') {
    unlocks.push({ type: 'school', id: 'harmony_resonance' });
    if (world === 'quantum') {
      unlocks.push({ type: 'mutator', id: 'quantum_entropy_wave' });
    } else if (world === 'desert') {
      unlocks.push({ type: 'mutator', id: 'desert_deep_anchor' });
    }
  }
  
  if (milestoneKey === 'crisis_survived') {
    unlocks.push({ type: 'school', id: 'corruption_acceptance' });
  }
  
  return unlocks;
}

export default {
  DOCTRINE_VERSION,
  SCHOOL_OF_THOUGHT_DEFINITIONS,
  WORLD_MUTATOR_DEFINITIONS,
  CRISIS_CARD_DEFINITIONS,
  getSchoolOfThought,
  getWorldMutator,
  getCrisisCard,
  getAvailableSchools,
  getAvailableMutators,
  resolveCrisisTrigger,
  sanitizeDoctrineState,
  applyDraftToState,
  computeDoctrineModifiers,
  determineMilestoneDoctrineUnlocks
};