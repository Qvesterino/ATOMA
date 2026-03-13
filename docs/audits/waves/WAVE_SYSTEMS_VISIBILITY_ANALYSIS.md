# WAVE SYSTEMS VISIBILITY ANALYSIS
## Why Wave Systems Are Not Visible

**Date:** 2026-03-13  
**Analysis by:** ATOMA Architect  
**Status:** Root Cause Identified

---

## EXECUTIVE SUMMARY

The wave systems are **technically active and running** but **not visible** because:

1. **WaveInterferenceEngine_v1 is burst-only** - Only generates wave data when explicitly triggered via `requestBurstIntent()`
2. **No automatic burst triggering** - No mechanism is actively calling burst intents
3. **Wave uniforms remain at zero** - Without burst data, all wave uniforms stay at 0
4. **Standing wave conditions rare** - Standing wave visualizations only appear when specific trap conditions are met
5. **Cascade waves are extremely subtle** - By design, only 3-8% influence (barely perceptible)

---

## ACTIVE WAVE SYSTEMS STATUS

### 1. Core Wave Engine Stack (Primary)
**Status:** ✓ INITIALIZED, ✓ RUNNING, ✗ NO DATA

| System | Initialized | Materials Registered | Frame Updates | Wave Data | Visual Output |
|--------|-------------|---------------------|---------------|------------|---------------|
| WaveInterferenceEngine_v1 | ✓ | N/A | N/A (burst-only) | **NONE** | ✗ |
| WaveShaderBridge_v1 | ✓ | ✓ | ✓ | **ZERO** | ✗ |
| WaveShaderMaterialPatch_v1 | ✓ | ✓ | ✓ | **ZERO** | ✗ |
| WaveTravelShaderPack_v1 | ✓ | ✓ | ✓ | **ZERO** | ✗ |
| WaveDynamicsShaderPack_v1 | ✓ | ✓ | ✓ | **ZERO** | ✗ |

**Root Cause:** `WaveInterferenceEngine_v1` is designed as a "burst-only, event-driven snapshot publisher" (line 57-64 in WaveInterferenceEngine_v1.js). It does NOT generate continuous wave data. Wave data is ONLY generated when `requestBurstIntent()` is called.

**Evidence:**
- Line 59-64: "No per-frame update loop", "No global graph traversal"
- Line 5079-5087 in main.js: Global functions `emitWaveInterferenceBurstIntent()` and `emitWaveRegimeTransition()` exist but are not called automatically
- Wave uniforms in materials remain at 0 because no burst data exists

**Expected Behavior:** When a burst is triggered, wave uniforms should temporarily spike to non-zero values, creating visible effects.

---

### 2. Standing Wave System Stack
**Status:** ✓ INITIALIZED, ✓ RUNNING, ✗ NO ACTIVE TRAPS

| System | Initialized | Frame Updates | Active Traps | Visual Output |
|--------|-------------|---------------|--------------|---------------|
| StandingWaveOscillationTrapSystem_Session130 | ✓ | ✓ | **NONE** | ✗ |
| StandingWaveVisualRenderer_Session131 | ✓ | ✓ | **NONE** | ✗ |
| WaveInterferencePatternSystem_Session132 | ✓ | ✓ | **NONE** | ✗ |

**Root Cause:** Standing wave visualizations only appear when `StandingWaveOscillationTrapSystem` detects standing wave trap conditions. These conditions require:
- Wave reflection from `InfluenceReflectionBackPressureSystem`
- Specific phase relationships
- Constructive interference patterns

**Evidence:**
- Line 208-230 in StandingWaveVisualRenderer_Session131.js: Only applies standing wave materials when `trap.active && trap.amplitude > 0.05`
- Line 322-327: Antinode meshes only activated when trap amplitude > 0.1
- No traps are currently active in the system

**Expected Behavior:** When standing wave traps form, you should see:
- Antinode glow spheres along links (blue emissive spheres)
- Trap zone planes (subtle blue planes)
- Link materials switching to standing wave mode (stopped travel, oscillating amplitude)

---

### 3. Pulse Wave Bridge System
**Status:** ✓ INITIALIZED, ✓ RUNNING, ✗ NO PULSE DATA

| System | Initialized | Frame Updates | Pulse Data | Visual Output |
|--------|-------------|---------------|------------|---------------|
| PulseWaveSystemBridge_v1 | ✓ | ✓ | **ZERO** | ✗ |
| LinkPulseWaveInjector | ✓ | ✓ | **ZERO** | ✗ |

**Root Cause:** Pulse wave system converts wave field data to pulse positions. Since wave field data is zero (no bursts), no pulses are generated.

**Evidence:**
- PulseWaveSystemBridge reads from wave field data
- If waveField is empty, no pulse positions are computed
- LinkPulseWaveInjector only updates when pulse data exists

---

### 4. Cascade Wave Visualization
**Status:** ✓ INITIALIZED, ✓ RUNNING, ✓ ACTIVE BUT EXTREMELY SUBTLE

| System | Initialized | Frame Updates | Active Pairs | Influence | Visual Output |
|--------|-------------|---------------|--------------|-----------|---------------|
| CascadeResonanceWaveVisualization_Session146 | ✓ | ✓ | ✓ | **3-8%** | ⚠️ BARELY VISIBLE |

**Root Cause:** By design, cascade waves are "extremely subtle" with only 3-8% influence on baseline parameters.

**Evidence:**
- Line 19 in CascadeResonanceWaveVisualization_Session146.js: "Influence: 5–8% of baseline parameters (barely perceptible)"
- Line 25-29: Explicit constraints: "NO directional beam, NO pulse, NO brightness change"
- Line 37-39: "Brief tightening as wave passes (NO opacity/color change)"

**Expected Behavior:** You should see:
- Very subtle temporal phase drift compression on links
- Micro delay alignment across braided strands
- Soft "pressure" sensation (no visible wavefront)
- Barely visible to careful observation

**Why You Don't See It:** The system is working correctly, but the effects are intentionally so subtle they're nearly invisible without careful observation.

---

### 5. Particle Wave System
**Status:** ✓ INITIALIZED, ✓ RUNNING, ✗ NO PARTICLES

| System | Initialized | Frame Updates | Burst Snapshots | Particles | Visual Output |
|--------|-------------|---------------|-----------------|-----------|---------------|
| WaveParticleEmitter_v1 | ✓ | ✓ | **NONE** | **NONE** | ✗ |

**Root Cause:** Particle emitter is driven by WaveInterferenceEngine burst snapshots. No bursts = no particles.

**Evidence:**
- Line 67 in audit: "Driven by WaveInterferenceEngine burst snapshots (no direct frameScheduler registration)"
- Particles only emit when burst snapshots contain constructive/destructive interference data

---

## INACTIVE WAVE SYSTEMS

### 1. ResonanceCascadeVisualization_Session117B
**Status:** ✗ NOT INITIALIZED

**Issue:** File exists and is imported, but no setup function is called in main.js.

**Evidence:**
- Audit line 73: "Imported but no setup function called in main.js"
- No initialization code found in main.js

**Note:** Similar functionality appears to be handled by `CascadeResonanceWaveVisualization_Session146` (active).

---

### 2. LinkResonanceFlowSystem_Session124
**Status:** ⚠️ PARTIALLY ACTIVE (UNCLEAR)

**Issue:** File exists but no explicit initialization/setup call in main.js.

**Evidence:**
- Audit line 83: "File imported but no explicit initialization/setup call in main.js"
- May be integrated through other systems (harmonic systems)

**Note:** System appears to be a complete implementation with pulse spawning, rendering, and LOD. Status unclear.

---

### 3. LinkEnergyWave
**Status:** ✗ NOT INITIALIZED

**Issue:** File exists but no initialization in main.js, no registration with frameScheduler.

**Evidence:**
- Audit line 91: "No initialization in main.js, no registration with frameScheduler"
- System appears to be a standalone energy wave effect for links

**Note:** System modifies strand material emissive intensity based on wave position. Could be useful for link energy visualization.

---

## ROOT CAUSE SUMMARY

### Why You See Nothing:

1. **No Wave Data Generation**
   - WaveInterferenceEngine only generates data when `requestBurstIntent()` is called
   - No automatic burst triggering mechanism is active
   - All wave uniforms remain at 0

2. **No Standing Wave Conditions**
   - Standing wave traps require specific reflection and phase conditions
   - Currently no active traps in the system

3. **Cascade Waves Too Subtle**
   - By design, only 3-8% influence
   - No visible geometry, only temporal modulation
   - Barely perceptible without careful observation

4. **Particle System Dependent on Bursts**
   - No bursts = no particle emission

### What IS Working:

- ✓ All wave systems are initialized
- ✓ Materials are registered with wave shader systems
- ✓ Wave systems are updated every frame
- ✓ Shader code is injected into materials
- ✓ Uniforms are being updated (just with zero values)

---

## RECOMMENDATIONS

### Immediate Actions (To See Wave Effects):

1. **Trigger a Test Burst**
   ```javascript
   // In browser console:
   emitWaveInterferenceBurstIntent({
       type: 'harmonic',
       origin: { x: 0, y: 0, z: 0 },
       intensity: 1.0
   });
   ```
   This should temporarily spike wave uniforms and create visible effects.

2. **Enable Debug Mode**
   ```javascript
   // In browser console:
   window.game?.waveInterferenceEngine?.enableDebug?.(true);
   window.game?.waveShaderBridge?.debugEnabled = true;
   window.game?.waveTravelShaderPack?.debugEnabled = true;
   window.game?.waveDynamicsShaderPack?.debugEnabled = true;
   ```
   This will log wave data and shader registration to console.

3. **Check Wave Data**
   ```javascript
   // In browser console:
   getWaveInterferenceBurstState();
   ```
   Returns active snapshot and metrics.

### Long-Term Solutions:

1. **Add Automatic Burst Triggering**
   - Implement automatic burst triggering based on:
     - Synergy events
     - Cascade events
     - High activity periods
     - User interactions

2. **Increase Cascade Wave Visibility** (if desired)
   - Modify `CascadeResonanceWaveVisualization_Session146` config:
     - `waveInfluenceMin: 0.03` → `0.1`
     - `waveInfluenceMax: 0.08` → `0.2`
   - This will make cascade waves more visible

3. **Evaluate Inactive Systems**
   - Decide if `ResonanceCascadeVisualization_Session117B` should be:
     - Initialized and activated
     - Removed/archived (superseded by Session146)
   - Clarify `LinkResonanceFlowSystem_Session124` status
   - Decide if `LinkEnergyWave` should be integrated

4. **Add Visual Debug Helpers**
   - Create debug visualization for wave field data
   - Show wave intensity as color overlay on nodes/links
   - Display standing wave trap locations

---

## TESTING CHECKLIST

To verify wave systems are working:

- [ ] Trigger a burst via `emitWaveInterferenceBurstIntent()`
- [ ] Observe temporary wave uniform spikes in materials
- [ ] Look for traveling wave motion on nodes/links
- [ ] Check for particle emission from `WaveParticleEmitter_v1`
- [ ] Create standing wave conditions (if possible)
- [ ] Observe antinode glows and trap zones
- [ ] Enable debug mode and check console logs
- [ ] Verify wave data via `getWaveInterferenceBurstState()`

---

## CONCLUSION

The wave systems are **architecturally sound and properly integrated**, but they are **not visible because no wave data is being generated**. The root cause is that `WaveInterferenceEngine_v1` is a burst-only system and no bursts are being triggered.

**To see wave effects, you need to trigger a burst.** Once a burst is active, you should see:
- Traveling wave motion on nodes and links
- Particle emission from interference zones
- Temporary material color/brightness changes
- Standing wave patterns if trap conditions are met

The cascade wave system is working correctly but is intentionally extremely subtle (3-8% influence).

---

**Next Steps:**
1. Test burst triggering via console
2. Evaluate if automatic burst triggering is needed
3. Decide on inactive system cleanup/integration
4. Consider increasing cascade wave visibility if desired
