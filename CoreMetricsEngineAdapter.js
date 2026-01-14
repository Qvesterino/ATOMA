import { projectHudMetrics, withGlobalMetricAliases } from './SemanticMetricAdapter.js';

/**
 * Core Metrics Engine Adapter (READ-ONLY)
 * Maps existing engine metrics directly into CoreMetricsHUD without mutation.
 */
export class CoreMetricsEngineAdapter {
  constructor(hud) {
    this.hud = hud;
    this.fallbackTemporal = { cycle: '00:00', epoch: '00', aeon: '00' };
    this.fallbackEvents = { newCycle: false, newEpoch: false, newAeon: false };
  }

  /**
   * Read-only bridge: pull metrics from engine objects and forward to HUD.
   * Safe to call every frame; returns early if sources or HUD are missing.
   */
  update(link, vm, temporalDisplay = this.fallbackTemporal, newEventFlags = this.fallbackEvents, deltaTime = 0.016) {
    if (!this.hud || !link || !vm) return;

    const globalMetrics = withGlobalMetricAliases({
      networkSynergy: vm.networkSynergy ?? vm.synergy ?? link.synergyScore,
      harmonyFlow: vm.harmonyFlow ?? vm.harmonyNorm ?? vm.harmony,
      networkStress: vm.networkStress ?? vm.stabilityNorm ?? vm.instability,
      corruptionLevel: vm.corruptionLevel ?? vm.corruptionNorm ?? vm.corruption,
      loadPressure: vm.loadPressure ?? vm.loadNorm ?? vm.networkLoad ?? vm.energyNorm
    });

    // HUD expects a metrics object; adapter resolves canonical → legacy if needed.
    const hudMetrics = projectHudMetrics(globalMetrics);

    this.hud.update(hudMetrics, temporalDisplay, newEventFlags, deltaTime);
  }
}
