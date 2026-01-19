/**
 * RenderCostProfile v1.0
 * L.3 OBSERVATION ONLY — DO NOT OPTIMIZE HERE
 * Lightweight rolling-window metrics for render costs.
 */
export class RenderCostProfile {
  constructor(maxFrames = 60, enabled = true) {
    this.maxFrames = maxFrames;
    this.enabled = enabled;
    this.frames = [];
    this.currentFrame = null;
  }

  startFrame() {
    if (!this.enabled) return;
    this.currentFrame = {
      metrics: {}
    };
  }

  record(label, durationMs) {
    if (!this.enabled) return;
    if (!this.currentFrame) this.startFrame();
    const metrics = this.currentFrame.metrics;
    const entry = metrics[label] || { total: 0, count: 0, min: Infinity, max: 0 };
    entry.total += durationMs;
    entry.count += 1;
    entry.min = Math.min(entry.min, durationMs);
    entry.max = Math.max(entry.max, durationMs);
    metrics[label] = entry;
  }

  endFrame() {
    if (!this.enabled || !this.currentFrame) return;
    this.frames.push(this.currentFrame);
    if (this.frames.length > this.maxFrames) {
      this.frames.shift();
    }
    this.currentFrame = null;
  }

  getSnapshot() {
    return {
      frames: this.frames.map(f => ({
        metrics: Object.fromEntries(
          Object.entries(f.metrics).map(([label, m]) => [
            label,
            { total: m.total, count: m.count, min: m.min, max: m.max }
          ])
        )
      }))
    };
  }

  getAverages() {
    const aggregate = {};
    for (const frame of this.frames) {
      for (const [label, m] of Object.entries(frame.metrics)) {
        const agg = aggregate[label] || { total: 0, count: 0, min: Infinity, max: 0 };
        agg.total += m.total;
        agg.count += m.count;
        agg.min = Math.min(agg.min, m.min);
        agg.max = Math.max(agg.max, m.max);
        aggregate[label] = agg;
      }
    }

    return Object.fromEntries(
      Object.entries(aggregate).map(([label, m]) => [
        label,
        {
          avg: m.count > 0 ? m.total / m.count : 0,
          min: m.min === Infinity ? 0 : m.min,
          max: m.max
        }
      ])
    );
  }

  reset() {
    this.frames = [];
    this.currentFrame = null;
  }

  setEnabled(enabled) {
    this.enabled = !!enabled;
  }
}
