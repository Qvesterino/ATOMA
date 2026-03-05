import * as THREE from 'three';
import { InterferenceEffectApplier } from '../../InterferenceEffectApplier.js';
import { HarmonicResonanceFeedbackSystem } from '../../HarmonicResonanceFeedbackSystem.js';
import { CompositeGlyphResonanceFeedback } from '../../CompositeGlyphResonanceFeedback.js';
import { createHarmonyAuraMaterial } from '../../HarmonyAuraShaderMaterial.js';
import { StandingWaveVisualRenderer_Session131 } from '../../StandingWaveVisualRenderer_Session131.js';

class HarmonyAuraMaterialProvider {
  constructor() {
    this.material = createHarmonyAuraMaterial();
  }

  update(dt = 0) {
    if (this.material?.uniforms?.uTime) {
      this.material.uniforms.uTime.value += dt;
    }
  }

  dispose() {
    this.material?.dispose?.();
  }
}

class CompositeGlyphResonanceFeedbackAdapter {
  constructor(ctx = {}) {
    this.system = new CompositeGlyphResonanceFeedback(ctx);
  }

  update(dt = 0) {
    this.system.update?.(dt);
  }

  dispose() {
    this.system.dispose?.();
  }
}

class StandingWaveVisualRendererAdapter {
  constructor(ctx = {}) {
    this.system = new StandingWaveVisualRenderer_Session131(ctx);
  }

  update(dt = 0) {
    this.system.update?.(dt);
  }

  dispose() {
    this.system.dispose?.();
  }
}

export const VFX_SYSTEMS = [
  {
    id: 'util.interferenceEffectApplier',
    domain: 'utility',
    safeLevel: 'safe',
    tags: ['link', 'data-only'],
    factory: () => new InterferenceEffectApplier()
    // No update tick required; exposes apply* helpers
  },
  {
    id: 'resonance.harmonicFeedback',
    domain: 'resonance',
    safeLevel: 'safe',
    tags: ['world', 'data-only'],
    factory: (ctx) => new HarmonicResonanceFeedbackSystem(ctx.scene || ctx.vfxRoot || null),
    updateFn: function (dt, _time, ctx) {
      const pictograms =
        ctx?.linkingSystem?.pictograms ||
        ctx?.linkingSystem?.linkPictograms ||
        ctx?.aiNodes?.pictograms ||
        null;
      this.update(dt, ctx?.linkingSystem?.fusionZoneManager, pictograms, ctx?.linkingSystem);
    }
  },
  {
    id: 'resonance.compositeFeedback',
    domain: 'resonance',
    safeLevel: 'experimental',
    tags: ['resonance', 'visual'],
    factory: (ctx) => new CompositeGlyphResonanceFeedbackAdapter(ctx)
  },
  {
    id: 'wave.standingRenderer',
    domain: 'wave',
    safeLevel: 'experimental',
    tags: ['wave', 'visual'],
    factory: (ctx) => new StandingWaveVisualRendererAdapter(ctx)
  },
  {
    id: 'material.harmonyAura',
    domain: 'utility',
    safeLevel: 'safe',
    tags: ['material', 'data-only'],
    factory: () => new HarmonyAuraMaterialProvider()
    // Update simply advances uTime; no scene attachment
  }
];

export default VFX_SYSTEMS;
