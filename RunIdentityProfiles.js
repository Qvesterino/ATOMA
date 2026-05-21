const META_PROGRESSION_VERSION = 1;
const RELEASE_RUN_IDENTITY_WORLDS = Object.freeze(['quantum', 'desert']);

const DEFAULT_UNLOCKED_RUN_PACKAGES = Object.freeze(['surge_thread']);
const DEFAULT_UNLOCKED_WORLD_STATES = Object.freeze(['baseline_quantum', 'baseline_desert']);

const RUN_PACKAGE_DEFINITIONS = Object.freeze({
  surge_thread: Object.freeze({
    id: 'surge_thread',
    label: 'SURGE THREAD',
    description: 'Fast, dirty surge build. Push momentum early and clean the lattice before the hold slips.',
    semanticProfile: 'chaos',
    spawnBiasOrder: ['quantum', 'process', 'integration', 'analytics', 'emotional', 'sigma', 'input', 'mythic', 'storage', 'control', 'prime', 'error'],
    scoreConfigDelta: Object.freeze({
      synergyThreshold: -0.02,
      sustainDuration: 0.15,
      rewindMinAvgLinkQuality: 0.03
    }),
    metricsOverlay: Object.freeze({
      networkSynergyScale: 1.04,
      avgLinkQualityScale: 0.96,
      loadPressureScale: 1.05,
      corruptionScale: 1.06,
      harmonyScale: 0.98,
      stabilityScale: 0.97
    }),
    linkQualityProfile: Object.freeze({
      structuralScale: 1.03,
      harmonyScale: 0.95,
      loadPenaltyScale: 1.08,
      corruptionPenaltyScale: 1.14,
      qualityBias: 2.5
    }),
    atmosphereOverlay: Object.freeze({
      vector: { calm: -0.04, pressure: 0.08, resonance: 0.02, fracture: 0.08, ascension: 0 },
      worldFX: { pulseCadence: 0.08, riftWaveFrequency: 0.06, screenOverlayRestraint: -0.04 },
      hazards: { intensity: 0.18, density: 0.1, fractureBias: 0.22, stabilityShield: -0.05 }
    }),
    hazardAffinity: Object.freeze({
      fractureBias: 0.22,
      intensity: 0.18,
      stabilityShield: -0.05
    }),
    hudDetail: 'Fast, dirty surge build'
  }),
  pivot_covenant: Object.freeze({
    id: 'pivot_covenant',
    label: 'PIVOT COVENANT',
    description: 'Hybrid lattice that grows through risk, then pivots into cleaner bonds before pressure takes over.',
    semanticProfile: 'analytical',
    spawnBiasOrder: ['integration', 'analytics', 'process', 'input', 'control', 'storage', 'prime', 'sigma', 'mythic', 'emotional', 'quantum', 'error'],
    scoreConfigDelta: Object.freeze({
      synergyThreshold: -0.01,
      sustainDuration: -0.1,
      rewindMinAvgLinkQuality: 0.01
    }),
    metricsOverlay: Object.freeze({
      networkSynergyScale: 1.01,
      avgLinkQualityScale: 1.02,
      loadPressureScale: 0.99,
      corruptionScale: 1.0,
      harmonyScale: 1.03,
      stabilityScale: 1.02
    }),
    linkQualityProfile: Object.freeze({
      structuralScale: 1.0,
      harmonyScale: 1.03,
      loadPenaltyScale: 0.98,
      corruptionPenaltyScale: 0.99,
      qualityBias: 1.0
    }),
    atmosphereOverlay: Object.freeze({
      vector: { calm: 0.04, pressure: 0.02, resonance: 0.08, fracture: -0.02, ascension: 0.03 },
      worldFX: { pulseCadence: 0.03, canopyEmphasis: 0.04, horizonEmphasis: 0.04 },
      hazards: { intensity: 0.05, density: 0.03, fractureBias: 0.04, stabilityShield: 0.04 }
    }),
    hazardAffinity: Object.freeze({
      fractureBias: 0.04,
      intensity: 0.05,
      stabilityShield: 0.04
    }),
    hudDetail: 'Hybrid pivot build'
  }),
  lattice_keeper: Object.freeze({
    id: 'lattice_keeper',
    label: 'LATTICE KEEPER',
    description: 'Slow, clean stabilizer run. Build patient structure and finish through resilient coherence.',
    semanticProfile: 'zen',
    spawnBiasOrder: ['storage', 'control', 'prime', 'input', 'sigma', 'mythic', 'integration', 'analytics', 'process', 'emotional', 'quantum', 'error'],
    scoreConfigDelta: Object.freeze({
      synergyThreshold: 0.02,
      sustainDuration: -0.2,
      rewindMinAvgLinkQuality: -0.03,
      rewindSpeed: 0.2,
      forwardSpeed: -0.15
    }),
    metricsOverlay: Object.freeze({
      networkSynergyScale: 0.98,
      avgLinkQualityScale: 1.06,
      loadPressureScale: 0.94,
      corruptionScale: 0.92,
      harmonyScale: 1.06,
      stabilityScale: 1.06
    }),
    linkQualityProfile: Object.freeze({
      structuralScale: 1.0,
      harmonyScale: 1.08,
      loadPenaltyScale: 0.9,
      corruptionPenaltyScale: 0.9,
      qualityBias: 0.5
    }),
    atmosphereOverlay: Object.freeze({
      vector: { calm: 0.08, pressure: -0.04, resonance: 0.06, fracture: -0.08, ascension: 0.04 },
      worldFX: { canopyEmphasis: 0.06, horizonEmphasis: 0.06, veilDensity: -0.04, screenOverlayRestraint: 0.06 },
      hazards: { intensity: -0.08, density: -0.06, fractureBias: -0.08, stabilityShield: 0.1 }
    }),
    hazardAffinity: Object.freeze({
      fractureBias: -0.08,
      intensity: -0.08,
      stabilityShield: 0.1
    }),
    hudDetail: 'Slow, clean stabilizer run'
  })
});

const WORLD_STATE_DEFINITIONS = Object.freeze({
  baseline_quantum: Object.freeze({
    id: 'baseline_quantum',
    world: 'quantum',
    label: 'BASELINE QUANTUM',
    description: 'Standard Quantum Island field conditions.',
    environmentSkin: 'quantum-baseline',
    lightTuning: Object.freeze({
      scoreConfigDelta: Object.freeze({}),
      metricsOverlay: Object.freeze({}),
      atmosphereOverlay: Object.freeze({})
    }),
    hudDetail: 'Standard field condition'
  }),
  quantum_probability_dawn: Object.freeze({
    id: 'quantum_probability_dawn',
    world: 'quantum',
    label: 'PROBABILITY DAWN',
    description: 'Resolved probability bloom. Cleaner coherence read and calmer hold pressure.',
    environmentSkin: 'quantum-probability-dawn',
    lightTuning: Object.freeze({
      scoreConfigDelta: Object.freeze({
        sustainDuration: -0.1,
        rewindMinAvgLinkQuality: -0.01
      }),
      metricsOverlay: Object.freeze({
        corruptionScale: 0.96,
        stabilityScale: 1.02,
        harmonyScale: 1.02
      }),
      atmosphereOverlay: Object.freeze({
        vector: { calm: 0.06, pressure: -0.03, resonance: 0.04, fracture: -0.04, ascension: 0.06 },
        worldFX: { canopyEmphasis: 0.08, pulseCadence: -0.02, screenOverlayRestraint: 0.05 },
        hazards: { intensity: -0.06, density: -0.04, fractureBias: -0.05, stabilityShield: 0.08 }
      })
    }),
    hudDetail: 'Resolved probability bloom'
  }),
  baseline_desert: Object.freeze({
    id: 'baseline_desert',
    world: 'desert',
    label: 'BASELINE DESERT',
    description: 'Standard Dream Desert field conditions.',
    environmentSkin: 'desert-baseline',
    lightTuning: Object.freeze({
      scoreConfigDelta: Object.freeze({}),
      metricsOverlay: Object.freeze({}),
      atmosphereOverlay: Object.freeze({})
    }),
    hudDetail: 'Standard field condition'
  }),
  desert_mirage_wake: Object.freeze({
    id: 'desert_mirage_wake',
    world: 'desert',
    label: 'MIRAGE WAKE',
    description: 'Patient mirage wake. Cleaner spacing, longer harmony breath, calmer collapse onset.',
    environmentSkin: 'desert-mirage-wake',
    lightTuning: Object.freeze({
      scoreConfigDelta: Object.freeze({
        sustainDuration: -0.15,
        forwardSpeed: -0.1
      }),
      metricsOverlay: Object.freeze({
        harmonyScale: 1.04,
        stabilityScale: 1.03,
        loadPressureScale: 0.97
      }),
      atmosphereOverlay: Object.freeze({
        vector: { calm: 0.07, pressure: -0.04, resonance: 0.05, fracture: -0.05, ascension: 0.04 },
        worldFX: { horizonEmphasis: 0.08, veilDensity: -0.05, pulseCadence: -0.02, screenOverlayRestraint: 0.04 },
        hazards: { intensity: -0.05, density: -0.04, fractureBias: -0.05, stabilityShield: 0.08 }
      })
    }),
    hudDetail: 'Patient mirage wake'
  })
});

function normalizeWorldId(world) {
  return String(world || '').trim().toLowerCase();
}

function uniqueStrings(values = []) {
  return Array.from(new Set(values.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim())));
}

function cloneObjectMap(template = {}) {
  return Object.entries(template).reduce((acc, [key, value]) => {
    acc[key] = typeof value === 'string' ? value : null;
    return acc;
  }, {});
}

function sanitizeWorldSelectionMap(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    quantum: typeof source.quantum === 'string' ? source.quantum.trim() : null,
    desert: typeof source.desert === 'string' ? source.desert.trim() : null
  };
}

function sanitizeMetaProgression(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const unlockedRunPackages = uniqueStrings(source.unlockedRunPackages || DEFAULT_UNLOCKED_RUN_PACKAGES)
    .filter((id) => RUN_PACKAGE_DEFINITIONS[id]);
  if (!unlockedRunPackages.includes('surge_thread')) unlockedRunPackages.unshift('surge_thread');

  const unlockedWorldStates = uniqueStrings(source.unlockedWorldStates || DEFAULT_UNLOCKED_WORLD_STATES)
    .filter((id) => WORLD_STATE_DEFINITIONS[id]);
  for (const baselineState of DEFAULT_UNLOCKED_WORLD_STATES) {
    if (!unlockedWorldStates.includes(baselineState)) unlockedWorldStates.unshift(baselineState);
  }

  return {
    version: Number.isFinite(Number(source.version)) ? Number(source.version) : META_PROGRESSION_VERSION,
    unlockedRunPackages,
    unlockedWorldStates,
    seenUnlocks: uniqueStrings(source.seenUnlocks || []),
    lastSelectedPackageByWorld: sanitizeWorldSelectionMap(source.lastSelectedPackageByWorld),
    lastSelectedWorldStateByWorld: sanitizeWorldSelectionMap(source.lastSelectedWorldStateByWorld)
  };
}

function isRunIdentityWorld(world) {
  return RELEASE_RUN_IDENTITY_WORLDS.includes(normalizeWorldId(world));
}

function getDefaultWorldStateId(world) {
  return normalizeWorldId(world) === 'desert' ? 'baseline_desert' : 'baseline_quantum';
}

function resolveRunPackage(id) {
  return RUN_PACKAGE_DEFINITIONS[id] || RUN_PACKAGE_DEFINITIONS.surge_thread;
}

function resolveWorldState(id, world = null) {
  const worldKey = normalizeWorldId(world);
  const definition = WORLD_STATE_DEFINITIONS[id];
  if (definition && (!worldKey || definition.world === worldKey)) {
    return definition;
  }
  return WORLD_STATE_DEFINITIONS[getDefaultWorldStateId(worldKey)];
}

function getUnlockedRunPackages(metaProgression = {}) {
  const meta = sanitizeMetaProgression(metaProgression);
  return meta.unlockedRunPackages.map((id) => resolveRunPackage(id));
}

function getUnlockedWorldStates(world, metaProgression = {}) {
  const worldKey = normalizeWorldId(world);
  const meta = sanitizeMetaProgression(metaProgression);
  return meta.unlockedWorldStates
    .map((id) => WORLD_STATE_DEFINITIONS[id])
    .filter((definition) => definition && definition.world === worldKey);
}

function resolveInitialSelection(world, metaProgression = {}) {
  const worldKey = normalizeWorldId(world);
  const meta = sanitizeMetaProgression(metaProgression);
  const unlockedPackages = getUnlockedRunPackages(meta);
  const unlockedStates = getUnlockedWorldStates(worldKey, meta);

  const preferredPackageId = meta.lastSelectedPackageByWorld?.[worldKey];
  const preferredStateId = meta.lastSelectedWorldStateByWorld?.[worldKey];

  const packageId = unlockedPackages.some((entry) => entry.id === preferredPackageId)
    ? preferredPackageId
    : unlockedPackages[0]?.id || 'surge_thread';
  const worldStateId = unlockedStates.some((entry) => entry.id === preferredStateId)
    ? preferredStateId
    : unlockedStates[0]?.id || getDefaultWorldStateId(worldKey);

  return { packageId, worldStateId };
}

function mergeNumericDelta(base = {}, delta = {}) {
  const next = { ...base };
  for (const [key, value] of Object.entries(delta || {})) {
    if (!Number.isFinite(Number(value))) continue;
    next[key] = (Number(next[key]) || 0) + Number(value);
  }
  return next;
}

function mergeNestedNumericDelta(base = {}, delta = {}) {
  const next = { ...base };
  for (const [section, values] of Object.entries(delta || {})) {
    if (values && typeof values === 'object' && !Array.isArray(values)) {
      next[section] = mergeNumericDelta(next[section] || {}, values);
    }
  }
  return next;
}

function composeRunIdentitySelection(world, selection = {}) {
  const worldKey = normalizeWorldId(world);
  const runPackage = resolveRunPackage(selection.packageId);
  const worldState = resolveWorldState(selection.worldStateId, worldKey);
  return {
    world: worldKey,
    packageId: runPackage.id,
    worldStateId: worldState.id,
    runPackage,
    worldState,
    scoreConfigDelta: mergeNumericDelta(runPackage.scoreConfigDelta, worldState.lightTuning?.scoreConfigDelta),
    metricsOverlay: mergeNumericDelta(runPackage.metricsOverlay, worldState.lightTuning?.metricsOverlay),
    linkQualityProfile: { ...(runPackage.linkQualityProfile || {}) },
    atmosphereOverlay: mergeNestedNumericDelta(runPackage.atmosphereOverlay, worldState.lightTuning?.atmosphereOverlay),
    hazardAffinity: { ...(runPackage.hazardAffinity || {}) },
    semanticProfile: runPackage.semanticProfile,
    hudTitle: runPackage.label,
    hudDetail: worldState.hudDetail
      ? `${runPackage.hudDetail} · ${worldState.hudDetail}`
      : runPackage.hudDetail
  };
}

function determineMilestoneUnlocks(metaProgression = {}, milestone = {}, world = null) {
  const meta = sanitizeMetaProgression(metaProgression);
  const unlocks = [];
  const milestoneKey = String(milestone || '').trim().toLowerCase();
  const worldKey = normalizeWorldId(world);

  const maybeUnlock = (type, id) => {
    const target = type === 'package' ? meta.unlockedRunPackages : meta.unlockedWorldStates;
    if (!target.includes(id)) {
      target.push(id);
      unlocks.push({ type, id });
    }
  };

  if (milestoneKey === 'rewind') {
    maybeUnlock('package', 'pivot_covenant');
  }

  if (milestoneKey === 'won') {
    maybeUnlock('package', 'lattice_keeper');
    if (worldKey === 'quantum') {
      maybeUnlock('worldState', 'quantum_probability_dawn');
    } else if (worldKey === 'desert') {
      maybeUnlock('worldState', 'desert_mirage_wake');
    }
  }

  return {
    metaProgression: sanitizeMetaProgression(meta),
    unlocks
  };
}

function applySelectionToMeta(metaProgression = {}, world, selection = {}) {
  const meta = sanitizeMetaProgression(metaProgression);
  const worldKey = normalizeWorldId(world);
  if (!isRunIdentityWorld(worldKey)) {
    return meta;
  }
  meta.lastSelectedPackageByWorld[worldKey] = resolveRunPackage(selection.packageId).id;
  meta.lastSelectedWorldStateByWorld[worldKey] = resolveWorldState(selection.worldStateId, worldKey).id;
  return sanitizeMetaProgression(meta);
}

export {
  META_PROGRESSION_VERSION,
  RELEASE_RUN_IDENTITY_WORLDS,
  RUN_PACKAGE_DEFINITIONS,
  WORLD_STATE_DEFINITIONS,
  sanitizeMetaProgression,
  isRunIdentityWorld,
  getUnlockedRunPackages,
  getUnlockedWorldStates,
  resolveRunPackage,
  resolveWorldState,
  resolveInitialSelection,
  composeRunIdentitySelection,
  determineMilestoneUnlocks,
  applySelectionToMeta
};
