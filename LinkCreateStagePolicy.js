/**
 * LinkCreateStagePolicy
 * ---------------------
 * Orchestration policy for staged link creation.
 *
 * This is intentionally separate from LinkRenderLayerPolicy:
 * - LinkRenderLayerPolicy owns render layers and cadence.
 * - LinkCreateStagePolicy owns the order in which link-creation visuals
 *   should bootstrap across frames.
 */

const cloneList = (value = []) => Array.isArray(value) ? value.slice() : [];

export const LINK_CREATE_STAGE_DEFINITIONS = Object.freeze([
  {
    phase: 0,
    key: 'prep-core-skin',
    label: 'prep: core shell + skin',
    owner: 'conduit',
    coverage: 'covered',
    systems: [
      'LinkRendererConduit.createLinkVisuals()',
      'LinkRenderLayerPolicy.LINK_SKIN'
    ],
    notes: 'Immediate bootstrap prep. Core shell and skin are created before staged frames begin.'
  },
  {
    phase: 1,
    key: 'strands-dock-spray',
    label: 'strands + docking spray',
    owner: 'conduit',
    coverage: 'partial',
    systems: [
      'LinkRendererConduit._runBootstrapPhase(case 1)',
      'LinkRendererConduit.createDockSpraySystem()'
    ],
    notes: 'Strands are staged here; dock spray is created lazily on demand when the dock gate opens.'
  },
  {
    phase: 2,
    key: 'filaments',
    label: 'filament bridges + filament sparks',
    owner: 'conduit',
    coverage: 'partial',
    systems: [
      'LinkRendererConduit._ensureStrandFilaments()',
      'LinkRendererConduit._updateStrandFilaments()'
    ],
    notes: 'Already present in conduit, but activated by a runtime gate rather than a strict first-frame bootstrap slot.'
  },
  {
    phase: 3,
    key: 'ring-trails-pulse-dust',
    label: 'ring trails + pulse dust emitter',
    owner: 'conduit',
    coverage: 'partial',
    systems: [
      'LinkRendererConduit._runBootstrapPhase(case 3)',
      'LinkPulseRing.ensureTrails()',
      'LinkPulseDustEmitter'
    ],
    notes: 'Ring trails are enabled after the core pulse ring is present, and the dust emitter is now separated from the first ring-create slice so the initial bootstrap stays lighter.'
  },
  {
    phase: 4,
    key: 'pulse-ring-arcs',
    label: 'pulse ring + arc discharge + directional streaks',
    owner: 'conduit',
    coverage: 'partial',
    systems: [
      'LinkRendererConduit._runBootstrapPhase(case 2)',
      'LinkRendererConduit._runBootstrapPhase(case 5)',
      'LinkPulseRing',
      'LinkRingArcDischarges',
      'LinkDirectionalStreaks'
    ],
    notes: 'Pulse ring and arc discharge remain staged in conduit, but the dust emitter and trail expansion were moved out of the first ring slice to smooth the initial bootstrap burst. Dock spray is still deferred out of the dock-ring create branch.'
  },
  {
    phase: 5,
    key: 'sparks',
    label: 'sparks',
    owner: 'conduit',
    coverage: 'covered',
    systems: [
      'LinkRendererConduit._runBootstrapPhase(case 8)',
      'LinkSparkSystem'
    ],
    notes: 'Spark pool is already staged and cadence-gated.'
  },
  {
    phase: 6,
    key: 'arc-sparks-beads',
    label: 'arc spark pool + bead visuals',
    owner: 'conduit',
    coverage: 'covered',
    systems: [
      'LinkRingArcDischarges.ensureImpactSparkPool()',
      'LinkRendererConduit._runBootstrapPhase(case 6)',
      'LinkBeadVisualizer',
      'LinkBeadTrailSystem',
      'LinkEnergyRingSystem'
    ],
    notes: 'The first arc-discharge pool is now warmed in the same slice as the bead visuals, but after the core arc group has already been created. This keeps the initial pulse ring slice lighter while preserving the later sparkle burst.'
  },
  {
    phase: 7,
    key: 'arc-ripples-trails',
    label: 'arc ripple pool + bead trails',
    owner: 'conduit',
    coverage: 'partial',
    systems: [
      'LinkRingArcDischarges.ensureRipplePool()',
      'LinkRendererConduit._runBootstrapPhase(case 7)',
      'LinkBeadTrailSystem'
    ],
    notes: 'The ripple pool is delayed until the trail slice so the arc system spreads its init cost over more frames instead of front-loading all three pools.'
  },
  {
    phase: 8,
    key: 'arc-packets-sparks',
    label: 'arc packet pool + sparks',
    owner: 'conduit',
    coverage: 'covered',
    systems: [
      'LinkRingArcDischarges.ensurePacketPool()',
      'LinkRendererConduit._runBootstrapPhase(case 8)',
      'LinkSparkSystem'
    ],
    notes: 'The final packet pool now lands alongside spark bootstrap, completing the arc system warmup without changing the visual language.'
  },
  {
    phase: 9,
    key: 'corruption-spread',
    label: 'corruption spread animator',
    owner: 'conduit',
    coverage: 'covered',
    systems: [
      'LinkRendererConduit._runBootstrapPhase(case 9)',
      'LinkCorruptionSpreadAnimator'
    ],
    notes: 'Temporarily disabled because the effect was not visibly contributing and still added update overhead. Revisit later.'
  },
  {
    phase: 10,
    key: 'flow-resonance',
    label: 'flow resonance',
    owner: 'main',
    coverage: 'covered',
    systems: [
      'LinkRendererConduit.linkResonanceFlowSystem',
      'main.js linkResonanceFlowSystemTick()',
      'LinkResonanceFlowSystem_Session124'
    ],
    notes: 'The conduit owns the system instance, but the main loop still schedules the authoritative tick.'
  },
  {
    phase: 11,
    key: 'pictograms',
    label: 'link semantic pictogram system with fusion',
    owner: 'main',
    coverage: 'partial',
    systems: [
      'LinkRendererConduit.updatePictograms()',
      'main.js pictogram bridge',
      'LinkSemanticPictogramSystem_WithFusion'
    ],
    notes: 'Pictograms are global and still bridge through main.js; the conduit only hosts a helper tick path.'
  },
  {
    phase: 12,
    key: 'trail-particles',
    label: 'trail particles',
    owner: 'main',
    coverage: 'partial',
    systems: [
      'LinkRendererConduit.trailParticles / trailEmitters',
      'main.js trail particle update path',
      'LinkTrailParticleSystem'
    ],
    notes: 'Trail particles are registered in conduit, but the runtime update cadence is shared with the main loop.'
  }
]);

export const LINK_CREATE_STAGE_MAX_PHASE = LINK_CREATE_STAGE_DEFINITIONS.reduce(
  (max, stage) => Math.max(max, stage.phase),
  0
);

export function getLinkCreateStageByPhase(phase) {
  const numericPhase = Number(phase);
  if (!Number.isFinite(numericPhase)) return null;
  return LINK_CREATE_STAGE_DEFINITIONS.find((stage) => stage.phase === numericPhase) || null;
}

export function getLinkCreateStagePlan() {
  return LINK_CREATE_STAGE_DEFINITIONS.map((stage) => ({
    ...stage,
    systems: cloneList(stage.systems)
  }));
}

export function getLinkCreateStageCoverageSummary() {
  return LINK_CREATE_STAGE_DEFINITIONS.reduce((acc, stage) => {
    const coverage = stage.coverage || 'unknown';
    acc.total += 1;
    acc[coverage] = (acc[coverage] || 0) + 1;
    return acc;
  }, {
    total: 0,
    covered: 0,
    partial: 0,
    missing: 0
  });
}

export function getLinkCreateOutOfBandSystems() {
  return Object.freeze([
    {
      key: 't2-corruption-visual-integration',
      label: 'T2 corruption visual integration',
      owner: 'main',
      notes: 'Separate global bridge in main.js, not a conduit bootstrap stage.'
    },
    {
      key: 'synergy-cascade-visualizer',
      label: 'SynergyCascadeVisualizer',
      owner: 'main',
      notes: 'Global create-link fanout bridge.'
    },
    {
      key: 'standing-wave-renderer',
      label: 'StandingWaveVisualRenderer_Session131',
      owner: 'main',
      notes: 'Global standing-wave renderer, triggered by network state.'
    },
    {
      key: 'resonance-cascade-visualization',
      label: 'ResonanceCascadeVisualization_Session117B',
      owner: 'main',
      notes: 'Global resonance cascade bridge, separate from conduit bootstrap.'
    }
  ]);
}

export default Object.freeze({
  stageDefinitions: LINK_CREATE_STAGE_DEFINITIONS,
  maxPhase: LINK_CREATE_STAGE_MAX_PHASE,
  getStageByPhase: getLinkCreateStageByPhase,
  getPlan: getLinkCreateStagePlan,
  getCoverageSummary: getLinkCreateStageCoverageSummary,
  getOutOfBandSystems: getLinkCreateOutOfBandSystems
});
