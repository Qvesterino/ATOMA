**Architecture Snapshot (LinkSparkSystem.js)**  
- Geometry: single `THREE.BufferGeometry` with fixed-size pools; attributes `position, aSpawnTime, aLifeTime, aT, aAngle, aSpeed, aSize`. Positions kept to satisfy renderer; motion computed in shader. `needsUpdate` set per attribute after spawn; full-buffer update (small pool) → simple & GPU-friendly.  
- Spawn: ring buffer via `spawnIndex` modulo `maxSparks`. `spawnBurst(count, time, intensity)` writes spawnTime, lifeTime, curve t, angle, speed, size; lifeTime randomized; spawnTime negative sentinel to mark dead. No per-frame allocation; uses in-place attribute writes.  
- Shaders:  
  - Vertex: samples quadratic Bezier (uStart/uMid/uEnd), builds tangent/right/normal for radial offset, drift by speed, projects, distance-based `gl_PointSize`. Fade in/out via life progress; vSpeed passed through.  
  - Fragment: procedural 4‑point star mask (pow + smoothstep), lifetime-based rotation, speed-based brightness `(0.7 + vSpeed*0.6)` multiplied into alpha; discards corners.  
- Performance: fixed buffers, no GC churn; minimal CPU work (only spawn writes). Attribute updates batched; frustum culling off for reliability.  
- Cleanup: `dispose()` disposes geometry/material and detaches from scene.

**Reusable Patterns to Extract**  
- Fixed-size pool + ring buffer for spawn; negative spawnTime sentinel for “dead”.  
- Attribute set: spawn time, lifetime, parametric curve coord (t), radial angle, speed, size (optional).  
- Spawn writes → set `needsUpdate` per attribute; full buffer acceptable for ≤ a few hundred particles.  
- Shader-side motion: sample path (Bezier/line/spline), derive tangent/right/normal, add drift; fade in/out in vertex.  
- Procedural sprite mask in fragment (no textures), discard outside mask, brightness modulation by per-particle scalar.  
- Configurable uniforms for curve control points, thickness, color, opacity; small color jitter optional.  
- Frustum culling off for tiny sprites; renderOrder fetched from `VisualHierarchyRegistry`.

**ParticleSystemBase Pattern (proposed skeleton)**  
- Constructor inputs: `scene`, `maxParticles`, `renderOrderKey`, optional `materialFactory`.  
- Geometry setup: buffer attrs { position, spawnTime, lifeTime, t, angle, speed, size } (extendable). Initialize spawnTime to -INF.  
- Spawn API: `spawn(count, time, params)` using ring buffer; per-attr setters; batch needsUpdate.  
- Update API:  
  1) update uniforms (time, curve points, color/opacity).  
  2) compute activeCount (optional).  
  3) call `spawn` policy (activity-driven).  
- Shaders: base VS functions `getPointOnPath`, `getTangent`, `makeOrthonormalBasis`; base FS star/dot mask; optional speed-based brightness; distance attenuation.  
- Cleanup: `dispose` releasing geometry/material and removing from scene.  
- Hooks: `computeDrift(speed, age)`, `mask(p, vLifeProgress)`, `brightness(vSpeed)` to specialize systems without duplicating core.

**Recommendations per System**  
- WaveParticleSystem: reuse pool + ring buffer; path = wave curve; keep speed attribute for brightness; drift can follow wave normal; retain star mask or swap to soft disk.  
- AuraParticleSystem: same base; path may be sphere/torus; angle/t offset critical; brightness tied to aura intensity; renderOrder via registry; mask could be soft circle.  
- LinkPulseParticles: identical to LinkSpark base; keep star mask; speed brightness good; maybe thicker size range and shorter lifetime; schedule via FrameScheduler visual layer.  
- EnvironmentalDust: reuse pool; simpler path (noise drift instead of curve); drop speed-based brightness; mask soft circle; keep negative spawnTime sentinel and ring buffer for zero-GC behavior.

No code changes performed.