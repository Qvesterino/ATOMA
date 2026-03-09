# ATOMA — VFX Parameter Surface Audit (2026-03-09)

Scope: `LinkRendererConduit.js`, `LinkVisualStateAdapter.js`, `LinkDirectionalStreaks.js`, `LinkCorruptionSpreadAnimator.js`, `LinkCorruptionParticleSystem.js`, `LinkTrailParticleSystem.js`, `LinkHealingParticleSystem.js`, `LinkSparkSystem.js`, `LinkEnergyWave.js`, `LinkRingArcDischarges.js`, `LinkPulseRing.js`, `LinkBeadSystem.js`.

## 1) Parameter map (what & who drives it)
- **LinkRendererConduit (orchestration)**
  - `emissiveIntensity`, `opacity`, `speedMul`, `colorBias`, `baseIntensity` patches on strands/skin; driven by per-frame metrics bundle (`synergy`, `harmony`, `corruption`, `loadPressure/traffic`, `instability`) in `_readLinkMetrics()` and the vfx envelope (`out` structure).
  - Pulse dust inputs (`ringScale`, `pulsePhase`, `spinAngle`, `progress`) sourced from `LinkPulseRing` state each frame.
  - Spark stats `{synergy, traffic, intensity}` forwarded to `LinkSparkSystem.update`.
- **LinkVisualStateAdapter (central per-frame modulator)**
  - Strands: `emissiveIntensity`, `opacity`, `roughness`, `color hue/sat`, `metalness`; controlled by harmony (+bright), corruption (hue shift/desat), instability (opacity flicker), synergy (rhythm/metalness).
  - Pulse ring: `opacity`, `harmonyScale`, `instabilityNoise`, `synergyPulseAmount`; metrics as above.
  - Arc discharges: `spawn interval/count`, `arcLength`, `radiusScale`, `jitterAmount`, `opacity`; harmony boosts, corruption jitters/desats, instability suppresses, synergy scales rate.
  - Skin: `opacity`, `color hue/sat`, `glow` boost; harmony raises, corruption flickers/desats, instability dims, synergy amplifies glow when harmony > corruption.
  - Energy wave proxy: feeds `waveSpeed`, `waveFrequency`, `base/peakIntensity` scaling values to `LinkEnergyWave` from synergy (primary).
- **LinkDirectionalStreaks**
  - `streak speed`, `count`, `length`, `brightness`, `opacity`, `desaturation`, `jitter` set per update; synergy increases speed/count, harmony raises brightness/length, corruption adds desaturation/jitter, instability optional damping.
- **LinkCorruptionSpreadAnimator**
  - `strand color gradient` (clean→tainted→corrupted), `wavePhase`/`intensity`, `emissive` boost; all driven by `corruptionLevel` per link, plus transient `corruptionDelta` for wave trigger.
- **LinkCorruptionParticleSystem**
  - `emissionRate`, `particleSpeed`, `particleSize`, `particleColor` ramp; directly proportional to `corruptionLevel` (with thresholds).
- **LinkTrailParticleSystem**
  - `emissionRate`, `particleScale`, `color mix` (cyan↔red), `flow smoothness`; harmony lowers rate/scale and shifts blue, corruption raises rate/scale and shifts red.
- **LinkHealingParticleSystem**
  - `emissionRate`, `particleScale`, `color gradient` (cyan→white), `direction`; harmony gates and scales; corruption suppresses emission (up to 60%).
- **LinkSparkSystem**
  - `spawnProb/count`, `uColor`, `uOpacity`, per-spark `aSpeed`; activity = max(intensity, synergy, traffic); more activity → faster drift & higher opacity.
- **LinkEnergyWave**
  - `waveSpeed`, `waveFrequency`, `emissiveIntensity` (base/peak), per-strand phase offsets; synergy and traffic boost speed/intensity.
- **LinkRingArcDischarges**
  - `spawnInterval`, `arcCount`, `radiusScale`, `jitterAmount`, `pulseSpeed`, `opacity`, `hueShift`; synergy + traffic increase counts/radius; corruption/instability/harmony modulated further via `LinkVisualStateAdapter` when present.
- **LinkPulseRing**
  - `progress/speed`, `baseScale`, `maxOpacity`, `pulseFrequency`, `pulseAmplitude`, `gap`, `spin`, trail `jitterMagnitude`, `hueOffset`; speed/scale/opacity/gap modulated by `synergy` and `traffic` in `update()`.
- **LinkBeadSystem**
  - Beads: `spawnRate` (activity = avg(synergy, traffic) + intensity boost), `speed`, `opacity`, `emissiveIntensity`, `color gradient`, `pulse` scale.
  - Echo wave: `speed`, `duration`, `width`, `intensity`; triggered internally, not metric-bound except activity gating.

## 2) Parameter hubs / centralization
- **LinkVisualStateAdapter** is the primary parameter hub: single entry point that applies harmony/corruption/instability/synergy to strands, pulse ring, arcs, skin, and energy wave scalars.
- **LinkRendererConduit per-frame envelope** (`update` + `_readLinkMetrics`) collects metrics once and fans them out to all subsystems; also owns shared vfx tunables (`out` patches).
- **LinkPulseRing state** acts as a mini-hub for downstream pulse dust and arc discharges (provides position/scale/pulse phase).
- **Uniform sets**: shader uniforms on strands (`uBaseColor`, `uNetworkStress`, `uCorruption`, etc.) and pulse ring uniforms (`uOpacity`, `uFresnelIntensity`) are fed centrally from the above adapters.

## 3) Duplicities observed
- Brightness terms: `emissiveIntensity` (strands/skin/wave) vs `opacity` (rings/skin/streaks) vs `brightness` comments — same visual outcome; keep `emissiveIntensity` as canonical for glow, `opacity` for coverage.
- Rate terms: `spawnRate` (beads), `emissionRate` (trail/healing/corruption particles), `spawnProb` (sparks) — functionally equivalent; could converge on “emissionRate”.
- Speed terms: `speed`, `flowSpeed`, `pulseSpeed`, `waveSpeed` — all motion scalars; consistent naming within each subsystem but heterogeneous globally.
- Intensity terms: `baseIntensity`/`peakIntensity` (energy wave) vs `intensity` (bead echo/sparks) vs `colorBias` (conduit corruption) — multiple knobs that modulate brightness/signal strength.

## 4) Orphan parameters
- No unused parameter fields detected in the scoped files: every named config knob is read in update/render paths (pulse ring cycle vars, arc jitter/pulseSpeed, bead echo fields, particle emission/speed/size, adapter scalars).

Notes
- Audit is descriptive only; no code changes were made.***
