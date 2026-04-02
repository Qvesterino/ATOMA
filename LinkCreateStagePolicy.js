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
    key: 'directional-streaks',
    label: 'directional streaks',
    owner: 'conduit',
    coverage: 'covered',
    systems: [
      'LinkRendererConduit._runBootstrapPhase(case 4)',
      'LinkDirectionalStreaks'
    ],
    notes: 'Directional streaks are conduit-owned and already stageable.'
  },
  {
    phase: 4,
    key: 'pulse-ring-arcs',
    label: 'pulse ring + arc discharge + ring dust emitter',
    owner: 'conduit',
    coverage: 'partial',
    systems: [
      'LinkRendererConduit._runBootstrapPhase(case 2)',
      'LinkRendererConduit._runBootstrapPhase(case 3)',
      'LinkRendererConduit._runBootstrapPhase(case 5)',
      'LinkPulseRing',
      'LinkRingArcDischarges',
      'LinkPulseDustEmitter'
    ],
    notes: 'Pulse ring and arc discharge are staged in conduit; the dust emitter is also conduit-owned.'
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
    key: 'beads-trails',
    label: 'bead + bead trail',
    owner: 'conduit',
    coverage: 'covered',
    systems: [
      'LinkRendererConduit._runBootstrapPhase(case 6)',
      'LinkRendererConduit._runBootstrapPhase(case 7)',
      'LinkBeadVisualizer',
      'LinkBeadTrailSystem'
    ],
    notes: 'Bead body and bead trails are already split into consecutive conduit phases.'
  },
  {
    phase: 7,
    key: 'healing-particles',
    label: 'healing particles',
    owner: 'main',
    coverage: 'partial',
    systems: [
      'LinkRendererConduit._runBootstrapPhase(case 9)',
      'main.js healing particle runtime',
      'LinkHealingParticleSystem'
    ],
    notes: 'Emitter registration exists in conduit; the actual global particle update still lives in main.js.'
  },
  {
    phase: 8,
    key: 'corruption-particles',
    label: 'corruption particles',
    owner: 'conduit',
    coverage: 'partial',
    systems: [
      'LinkRendererConduit._runBootstrapPhase(case 9)',
      'LinkCorruptionParticleSystem'
    ],
    notes: 'Conduit creates the emitter path, but global update cadence is still shared with the main loop.'
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
    notes: 'This is already owned by the conduit update path.'
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
