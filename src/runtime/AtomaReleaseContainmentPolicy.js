const STATIC_SYSTEM_POLICY = Object.freeze({
  topologyBiasVisualization: Object.freeze({
    classification: 'ACTIVE + VISIBLE',
    policy: 'active',
    reason: 'Topology bias already has clear runtime wiring and player-visible spatial payoff.',
  }),
  proceduralHarmonicGlyphGenerator: Object.freeze({
    classification: 'ACTIVE + SUBTLE',
    policy: 'active',
    reason: 'Procedural glyphs are live and safe, but intentionally sparse.',
  }),
  synapticFatigue: Object.freeze({
    classification: 'ACTIVE + SUBTLE',
    policy: 'active',
    reason: 'Fatigue is a live downstream modulation signal with low-risk subtle payoff.',
  }),
  synapticGating: Object.freeze({
    classification: 'ACTIVE AS SUPPORT',
    policy: 'support-only',
    reason: 'Gating is still useful as upstream modulation even without a standalone visible hook.',
  }),
  synapticSpecialization: Object.freeze({
    classification: 'ACTIVE + VISIBLE',
    policy: 'active',
    reason: 'Specialization now resolves into visible dominance modulation.',
  }),
  competitionDominance: Object.freeze({
    classification: 'ACTIVE + VISIBLE',
    policy: 'active',
    reason: 'Dominance now provides readable aura and pulse differentiation.',
  }),
  waveShaderStack: Object.freeze({
    classification: 'DISABLED FOR DEMO',
    policy: 'disabled',
    reason: 'Wave shader material patching creates expensive compile-time shader variants with low demo-critical payoff.',
    flagName: 'ATOMA_DISABLE_WAVE_SHADER_STACK',
  }),
  synergyChainReaction: Object.freeze({
    classification: 'DISABLED FOR DEMO',
    policy: 'disabled',
    reason: 'Chain reaction has no confirmed release-visible consumer payoff and should not tick in demo.',
    flagName: 'ATOMA_DISABLE_SYNERGY_CHAIN_REACTION',
  }),
});

function getGlobalScope(scope = globalThis) {
  return scope && typeof scope === 'object' ? scope : globalThis;
}

function readDemoProfile(scope) {
  return scope.ATOMA_DEMO_RELEASE_PROFILE ?? true;
}

function readSynergyChainReactionDisable(scope) {
  const demoProfile = readDemoProfile(scope);
  return scope.ATOMA_DISABLE_SYNERGY_CHAIN_REACTION ?? demoProfile;
}

function readWaveShaderStackDisable(scope) {
  const demoProfile = readDemoProfile(scope);
  return scope.ATOMA_DISABLE_WAVE_SHADER_STACK ?? demoProfile;
}

export function ensureAtomaReleaseContainmentGlobals(scope = globalThis) {
  const target = getGlobalScope(scope);
  target.ATOMA_DEMO_RELEASE_PROFILE = readDemoProfile(target);
  target.ATOMA_DISABLE_WAVE_SHADER_STACK = readWaveShaderStackDisable(target);
  target.ATOMA_DISABLE_SYNERGY_CHAIN_REACTION = readSynergyChainReactionDisable(target);
  return getAtomaReleaseContainmentProfile(target);
}

export function getAtomaReleaseContainmentProfile(scope = globalThis) {
  const target = getGlobalScope(scope);
  const demoProfile = readDemoProfile(target);
  const disableWaveShaderStack = readWaveShaderStackDisable(target);
  const disableSynergyChainReaction = readSynergyChainReactionDisable(target);

  return {
    demoProfile,
    systems: {
      topologyBiasVisualization: { ...STATIC_SYSTEM_POLICY.topologyBiasVisualization },
      proceduralHarmonicGlyphGenerator: { ...STATIC_SYSTEM_POLICY.proceduralHarmonicGlyphGenerator },
      synapticFatigue: { ...STATIC_SYSTEM_POLICY.synapticFatigue },
      synapticGating: { ...STATIC_SYSTEM_POLICY.synapticGating },
      synapticSpecialization: { ...STATIC_SYSTEM_POLICY.synapticSpecialization },
      competitionDominance: { ...STATIC_SYSTEM_POLICY.competitionDominance },
      waveShaderStack: {
        ...STATIC_SYSTEM_POLICY.waveShaderStack,
        disabledByPolicy: Boolean(disableWaveShaderStack),
        policy: disableWaveShaderStack ? 'disabled' : 'active',
        classification: disableWaveShaderStack
          ? STATIC_SYSTEM_POLICY.waveShaderStack.classification
          : 'ACTIVE + EXPERIMENTAL',
      },
      synergyChainReaction: {
        ...STATIC_SYSTEM_POLICY.synergyChainReaction,
        disabledByPolicy: Boolean(disableSynergyChainReaction),
        policy: disableSynergyChainReaction ? 'disabled' : 'active',
        classification: disableSynergyChainReaction
          ? STATIC_SYSTEM_POLICY.synergyChainReaction.classification
          : 'ACTIVE + EXPERIMENTAL',
      },
    },
  };
}

export function createAtomaReleaseContainmentRuntimeState() {
  return {
    topologyBiasVisualization: { initialized: false, scheduled: false },
    proceduralHarmonicGlyphGenerator: { initialized: false, scheduled: false },
    synapticFatigue: { initialized: false, scheduled: false },
    synapticGating: { initialized: false, scheduled: false },
    synapticSpecialization: { initialized: false, scheduled: false },
    competitionDominance: { initialized: false, scheduled: false },
    waveShaderStack: { initialized: false, scheduled: false, enabled: false },
    synergyChainReaction: { initialized: false, scheduled: false },
  };
}

export function buildAtomaReleaseContainmentStatus(scope = globalThis, runtime = {}) {
  const profile = getAtomaReleaseContainmentProfile(scope);
  const systems = {};

  for (const [systemKey, config] of Object.entries(profile.systems)) {
    const runtimeState = runtime[systemKey] || {};
    systems[systemKey] = {
      classification: config.classification,
      policy: config.policy,
      disabledByPolicy: config.disabledByPolicy === true,
      reason: config.reason,
      initialized: runtimeState.initialized === true,
      scheduled: runtimeState.scheduled === true,
    };

    if ('flagName' in config) {
      systems[systemKey].flagName = config.flagName;
    }

    if ('enabled' in runtimeState) {
      systems[systemKey].enabled = Boolean(runtimeState.enabled);
    }
  }

  return {
    demoProfile: profile.demoProfile,
    systems,
  };
}
