// VisualTime: canonical realtime visual clock (RAF-sourced only)
// API surface must remain minimal: now, delta, frameId, source, reset()
// Updated exclusively from the main requestAnimationFrame loop (see main.js).
export const VisualTime = {
  // Monotonic visual time in seconds
  now: 0,
  // Delta time since last RAF in seconds
  delta: 0,
  // Frame counter incremented once per RAF
  frameId: 0,
  // Source descriptor for diagnostics/introspection
  source: 'raf',

  // Reset time and frame counter (e.g., on map/world switch)
  reset() {
    this.now = 0;
    this.delta = 0;
    this.frameId = 0;
  }
};

export default VisualTime;
