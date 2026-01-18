import { projectHudMetrics, withGlobalMetricAliases } from './SemanticMetricAdapter.js';

/**
 * Core Metrics Engine Adapter (READ-ONLY)
 * Maps existing engine metrics into Canonical HUD metrics.
 */
export class CoreMetricsEngineAdapter {
  constructor(hud) {
    this.hud = hud;
    this.fallbackTemporal = { cycle: '00:00', epoch: '00', aeon: '00' };
    this.fallbackEvents = { newCycle: false, newEpoch: false, newAeon: false };
  }

  /**
   * Read-only bridge: derive HUD-ready metrics from engine objects.
   * Safe to call every frame; returns canonical metrics for HUD consumers.
   */
  update(link, vm, temporalDisplay = this.fallbackTemporal, newEventFlags = this.fallbackEvents, deltaTime = 0.016) {
    if (!link || !vm) return;

    const globalMetrics = withGlobalMetricAliases({
      networkSynergy: vm.networkSynergy ?? vm.synergy ?? link.synergyScore,
      harmonyFlow: vm.harmonyFlow ?? vm.harmonyNorm ?? vm.harmony,
      networkStress: vm.networkStress ?? vm.stabilityNorm ?? vm.stability,
      corruptionLevel: vm.corruptionLevel ?? vm.corruptionNorm ?? vm.corruption,
      loadPressure: vm.loadPressure ?? vm.loadNorm ?? vm.networkLoad ?? vm.energyNorm
    });

    const hudMetrics = projectHudMetrics(globalMetrics);
    return hudMetrics;
  }
}
