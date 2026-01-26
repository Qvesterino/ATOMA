import * as THREE from 'three';

/**
 * Lightweight GPU instrumentation (disabled by default).
 * Attach via setupGpuSanity(renderer) and use window.gpuSanity.* API.
 */
export function setupGpuSanity(renderer, options = {}) {
  if (typeof window === 'undefined') return null;
  if (!renderer || !renderer.info) return null;

  // Reuse a single snapshot object to avoid per-frame allocations
  const snapshotCache = {
    time: 0,
    calls: 0,
    triangles: 0,
    points: 0,
    lines: 0,
    geometries: 0,
    textures: 0,
    programs: 0,
    tag: null
  };

  const peaks = { ...snapshotCache };
  let intervalId = null;
  let enabled = false;

  const readSnapshot = () => {
    const info = renderer.info;
    const render = info.render || {};
    const memory = info.memory || {};

    snapshotCache.time = performance.now();
    snapshotCache.calls = render.calls ?? 0;
    snapshotCache.triangles = render.triangles ?? 0;
    snapshotCache.points = render.points ?? 0;
    snapshotCache.lines = render.lines ?? 0;
    snapshotCache.geometries = memory.geometries ?? 0;
    snapshotCache.textures = memory.textures ?? 0;
    snapshotCache.programs = Array.isArray(info.programs) ? info.programs.length : (info.programs ?? 0);

    // Update peaks
    peaks.calls = Math.max(peaks.calls, snapshotCache.calls);
    peaks.triangles = Math.max(peaks.triangles, snapshotCache.triangles);
    peaks.points = Math.max(peaks.points, snapshotCache.points);
    peaks.lines = Math.max(peaks.lines, snapshotCache.lines);
    peaks.geometries = Math.max(peaks.geometries, snapshotCache.geometries);
    peaks.textures = Math.max(peaks.textures, snapshotCache.textures);
    peaks.programs = Math.max(peaks.programs, snapshotCache.programs);

    return { ...snapshotCache };
  };

  const logSnapshot = () => {
    if (!enabled) return;
    const snap = readSnapshot();
    console.info(
      '[gpuSanity]',
      `calls=${snap.calls}`,
      `tri=${snap.triangles}`,
      `lines=${snap.lines}`,
      `pts=${snap.points}`,
      `geo=${snap.geometries}`,
      `tex=${snap.textures}`,
      `prog=${snap.programs}`,
      snap.tag ? `tag=${snap.tag}` : ''
    );
  };

  const api = {
    enable() { enabled = true; return this; },
    disable() { enabled = false; return this; },
    snapshot() { return readSnapshot(); },
    start(intervalMs = 1000) {
      this.enable();
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(logSnapshot, intervalMs);
      return this;
    },
    stop() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      return this;
    },
    resetPeaks() {
      for (const k of Object.keys(peaks)) {
        peaks[k] = 0;
      }
      return this;
    },
    peaks() {
      return { ...peaks };
    },
    annotate(tag) {
      snapshotCache.tag = tag;
      return this;
    },
    setLinkFXEnabled(enabledFlag) {
      if (window.linkFXSystem?.setEnabled) {
        window.linkFXSystem.setEnabled(!!enabledFlag);
      } else if (window.linkFXConfig && 'enabled' in window.linkFXConfig) {
        window.linkFXConfig.enabled = !!enabledFlag;
      }
      return this;
    },
    setLinkFXUpdateHz(hz) {
      if (window.linkFXSystem?.setUpdateHz) {
        window.linkFXSystem.setUpdateHz(hz);
      } else if (window.linkFXConfig && 'updateHz' in window.linkFXConfig) {
        window.linkFXConfig.updateHz = hz;
      }
      return this;
    }
  };

  window.gpuSanity = window.gpuSanity || api;
  return window.gpuSanity;
}
