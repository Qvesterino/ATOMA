# ATOMA — VFX ↔ Metric Integration Audit (2026-03-09)

Scope: `LinkRendererConduit.js`, `NodeLinkingSystem.js`, plus linked VFX systems (beads, sparks, trails, rings, waves, arcs, visual adapter, interference/harmonic managers, directional streaks, corruption spread/particles, trail/healing particles, semantic pictograms).

## 1) Where metrics are read
- `LinkRendererConduit.js:_readLinkMetrics` (lines ~2279-2293): pulls `synergy`, `harmony`, `corruption`, `instability`, `loadPressure/traffic`, `quality` from `link.userData`/fallbacks and feeds every per-link update.
- `LinkRendererConduit` update loop routes those values into: `LinkVisualStateAdapter.update` (harmony/corruption/instability/synergy), `LinkDirectionalStreaks.update` (synergy/harmony/corruption/instability), corruption animator/particles, trail + healing emitters, arc discharges, pulse ring, energy wave, sparks, beads.
- `NodeLinkingSystem.js` lines ~3556-3570: triggers `metricsRuntime.runNetworkMetricsAggregator` when present; computes canonical `link.userData.synergy`/`synergyScore`, `corruptionLevel`, `harmonyScore`, `loadPressure`, `stability/instability` and writes them back for visuals.
- `LinkDirectionalStreaks.js` update signature (around lines 164-235): consumes synergy, harmony, corruption, instability to set streak speed/count/brightness/desaturation/jitter.
- `LinkCorruptionSpreadAnimator.js` (lines ~81-146): reads `link.corruptionLevel` to drive strand gradient + wave intensity.
- `LinkCorruptionParticleSystem.js` (updateLinkParticles + spawn/update helpers): corruption level controls emission rate, particle speed/size/color.
- `LinkTrailParticleSystem.js` update: harmony reduces emission/chaos; corruption increases emission/scale and tints red.
- `LinkHealingParticleSystem.js` update: harmony gates emission and scales size/color; corruption suppresses rate.
- `LinkSemanticPictogramSystem_Enhanced.js`: picks glyph layer/state, orbit speed, and animation based on harmony, stability, synergy, loadPressure, corruption; also lerps toward corruption glyphs when corruption>0.6.
- `NodeHarmonicManager.js` & `NodeInterferenceManager.js` (update): propagate harmony/corruption/instability into node controllers and link sync feedback.
- `LinkPulseRing.js` update: takes `synergy` & `traffic` to set pulse speed, scale, opacity, gap, spin.
- `LinkSparkSystem.js` update: activity = max(intensity, synergy, traffic) → spawn rate/opacity.
- `LinkBeadSystem.js` (LinkBeadVisualizer): activity = avg(synergy, traffic) → bead spawn rate; synergy also scales bead opacity.
- `LinkEnergyWave.js`: synergy + traffic set wave speed/amplitude/intensity.
- `LinkRingArcDischarges.js`: synergy drives arc spawn count, radius scale, burst intensity; traffic modulates bursts.

## 2) VFX → metric bindings
- **LinkBeadVisualizer** — synergy (+traffic): bead spawn rate, opacity; gradient color source→target.
- **LinkSparkSystem** — synergy/traffic: spawn probability, brightness/opacity.
- **LinkBeadTrailSystem** — (no direct metric read; inherits bead color/positions).
- **LinkEnergyRingSystem** — metric-agnostic; rings triggered externally (bead arrivals), color provided by caller.
- **LinkPulseRing** — synergy/traffic: speed, base scale, opacity, gap, spin rate.
- **LinkPulseDustEmitter** — metric-agnostic; uses incoming color/flow only.
- **LinkEnergyWave** — synergy/traffic: wave speed, amplitude, emissive intensity.
- **LinkRingArcDischarges** — synergy (and traffic): arc spawn interval/count, radius, jitter.
- **LinkVisualStateAdapter** — harmony (brightens/smooths), corruption (hue-shift/desaturates, flicker), instability (opacity jitter), synergy (rhythm/metalness) across strands, pulse ring, arcs, skin, wave.
- **NodeInterferenceManager** — harmony/corruption/instability feed node interference controllers; effects push into link visuals via controllers.
- **NodeHarmonicManager** — harmony/corruption/instability set harmonic sync; applies phase/strength feedback onto links.
- **LinkDirectionalStreaks** — synergy: count/speed; harmony: brightness/length; corruption: desaturation + jitter; instability: (optionally) opacity damp.
- **LinkCorruptionSpreadAnimator** — corruption: strand gradient (clean→tainted→corrupted), wave pulse, emissive boost.
- **LinkCorruptionParticleSystem** — corruption: emission rate, particle speed/size/color ramp (embers→red).
- **LinkTrailParticleSystem** — harmony lowers chaos (rate/size), corruption raises rate/scale and shifts color red; blends with harmony cyan.
- **LinkHealingParticleSystem** — harmony drives emission/color (cyan→white); corruption suppresses emission up to 60%.
- **LinkSemanticPictogramSystem_Enhanced** — selects glyph type, orbit radius/speed, corruption-targeted morphs; synergy boosts arrow clusters and speed; stability/loadPressure choose modulator glyph families.

## 3) Orphan check
- All systems imported in `LinkRendererConduit.js` are instantiated or updated (beads, sparks, trail, pulse ring/dust, wave, arcs, visual adapter, directional streaks, corruption animator/particles, trail + healing emitters, pictograms). None are dead imports.
- Repository scan of the scoped list found no additional copies that are completely unused. No orphaned files detected within the requested set.

## 4) Best corruption-visual candidate
- **LinkCorruptionSpreadAnimator** is the strongest single candidate: directly maps `corruptionLevel` to strand color gradient + traveling wave, respecting the existing rope visuals and satisfying the “strand color modulation” preference. It runs every conduit update and already owns corruption phase state.
- Secondary reinforcements: `LinkCorruptionParticleSystem` (corruption particles along link) and `LinkDirectionalStreaks` (corruption desaturation/jitter) can layer on top but are not primary.

## 5) Strand color sources (LinkRendererConduit.js)
- Base colors set during creation: `baseColor = getCategoryColor(sourceCat)`; `colorA = source category`, `colorB = target category` (around lines 1028-1035).
- Strand assignment: `categoryColor = (i % 2 === 0) ? colorA : colorB` (line ~1043), stored in uniform `uBaseColor` (line ~1064).
- With three strands: Strand A (index 0) = source category color; Strand B (index 1) = target category color; Strand C (index 2) = source category color. Overlays reuse the same uniform, half-intensity.

Notes
- No code changes were made; this file is documentation-only.
