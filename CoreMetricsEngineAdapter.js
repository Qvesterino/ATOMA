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

    const metrics = {
      synergy: link.synergyScore,
      harmony: vm.harmonyNorm,
      instability: vm.stabilityNorm,
      corruption: vm.corruptionNorm,
      networkLoad: vm.loadNorm
    };

    this.hud.update(metrics, temporalDisplay, newEventFlags, deltaTime);
  }
}
