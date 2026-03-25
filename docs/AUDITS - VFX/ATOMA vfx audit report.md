# ATOMA VFX SYSTEMS AUDIT REPORT
## READ-ONLY Analysis of Dead/Starved/Miswired Visual Systems

Generated: 2026-03-25T16:11:00Z
Scope: Wave, Cascade, Resonance, Particle, Glyph, Link FX systems
Excluded: LinkRendererConduit (as requested)

---

## EXECUTIVE SUMMARY

**Total Systems Analyzed: 8**
- **DEAD:** 4 systems (never execute)
- **STARVED:** 4 systems (run but receive no data)
- **MISWIRED:** 0 systems
- **HEALTHY:** 0 systems

**Key Findings:**
1. **Wave engine dependency chain is broken** - WaveInterferenceEngine_v1 is referenced but not found
2. **Event system is partially functional** - `cascade.hop` events are emitted, but many consumers aren't registered
3. **FrameScheduler integration is incomplete** - 3/8 systems not registered
4. **Threshold gating blocks execution** - Systems waiting for waveField.amplitude > 0.12 but data is always 0

---

## DETAILED FINDINGS

### 🔴 DEAD SYSTEMS (Never Execute)

#### 1. WaveShaderBridge_v1.js
- **FILE:** `WaveShaderBridge_v1.js`
- **Scheduler Registration:** NOT registered in FrameScheduler
- **Update Loop:** Has `update()` but never called
- **WHAT IT READS:**
  - `link.userData.waveField.amplitude`
  - `link.userData.waveField.phase`
  - `link.userData.waveField.frequency`
- **DATA SOURCE:** WaveInterferenceEngine_v1 (via global reference)
- **SOURCE EXISTS/RUNS:** ❌ NOT FOUND - No file exists
- **PROBLEM:** Dead dependency on non-existent wave engine
- **PROOF:** 
  ```javascript
  // Line 150-155: Reads from non-existent source
  const amplitude = link.userData.waveField?.amplitude ?? 0;
  const phase = link.userData.waveField?.phase ?? 0;
  const frequency = link.userData.waveField?.frequency ?? 0;
  ```
- **SEVERITY:** DEAD
- **Impact:** No wave visual effects on links

---

#### 2. StandingWaveVisualRenderer_Session131.js
- **FILE:** `StandingWaveVisualRenderer_Session131.js`
- **Scheduler Registration:** NOT registered in FrameScheduler
- **Update Loop:** Has `update()` but never called
- **WHAT IT READS:**
  - `globalThis.window?.standingWaveTrapSystem` (constructor dependency)
  - `trap.standingWaveData[]` (array of standing wave info)
- **DATA SOURCE:** standingWaveTrapSystem (global singleton)
- **SOURCE EXISTS/RUNS:** ❌ NOT FOUND - No system initializes this
- **PROBLEM:** Constructor dependency never provided, never registered
- **PROOF:**
  ```javascript
  // Line 45: Constructor requires missing system
  constructor(trap) {
    this.trap = trap || window?.standingWaveTrapSystem;
    if (!this.trap) {
      console.error('StandingWaveTrapSystem not found');
      return;
    }
  }
  ```
- **SEVERITY:** DEAD
- **Impact:** No standing wave visual feedback

---

#### 3. WaveParticleEmitter_v1.js
- **FILE:** `WaveParticleEmitter_v1.js`
- **Scheduler Registration:** NOT registered in FrameScheduler
- **Update Loop:** Has `update(deltaTime, nodes, links, waveEngine)` but never called
- **WHAT IT READS:**
  - `waveEngine.getNodeWaveField(nodeId)` or `node.userData.waveField`
  - `waveEngine.getLinkWaveField(linkId, link)`
  - Thresholds: `amplitude > 0.15`, `constructive > 0.08`, `destructive > 0.10`
- **DATA SOURCE:** WaveInterferenceEngine_v1 (passed as parameter)
- **SOURCE EXISTS/RUNS:** ❌ NOT FOUND - Wave engine doesn't exist
- **PROBLEM:** Not registered + dependency on non-existent wave engine
- **PROOF:**
  ```javascript
  // Line 785-790: Calls non-existent API
  const waveField = waveEngine?.getNodeWaveField?.(nodeId, node) 
    ?? node?.userData?.waveField 
    ?? {};
  const amplitude = waveField.amplitude ?? waveField.totalAmplitude ?? 0;
  ```
- **THRESHOLD GATING:** 
  - `constructiveValue >= 0.08` (never passes - data is always 0)
  - `destructiveValue >= 0.10` (never passes - data is always 0)
- **SEVERITY:** DEAD
- **Impact:** No wave-reactive particles (constructive bursts, destructive chaos, standing wave ripples)

---

#### 4. CascadeParticleSystem_Session120.js
- **FILE:** `CascadeParticleSystem_Session120.js`
- **Scheduler Registration:** NOT registered in FrameScheduler
- **Update Loop:** Has `update(deltaTime, links)` but never called
- **WHAT IT READS:**
  - `cascade.hop` event (via semanticBus subscription)
  - `link.userData.flowState.intensity`
  - `link.userData.cascadeIntensity`
- **DATA SOURCE:** CascadingHarmonicResonanceAmplification.js
- **SOURCE EXISTS/RUNS:** ✅ YES - System exists and emits cascade.hop
- **PROBLEM:** System initialized but not registered in FrameScheduler, so update() never runs
- **PROOF:**
  ```javascript
  // Line 70-75: Event subscription works, but update() never called
  on('cascade.hop', (event = {}) => {
    this.spawnCascadeParticles(event.link, event.intensity, event.hopIndex);
  });
  ```
- **THRESHOLD GATING:**
  - `intensity >= 0.1` (blocks emission if below)
  - `clampedIntensity >= 0.1` (rarely passes without active cascade)
- **SEVERITY:** DEAD
- **Impact:** Cascade particles never spawn despite cascade system running

---

### 🟡 STARVED SYSTEMS (Run But No Data)

#### 5. WaveBurstRouter_v1.js
- **FILE:** `WaveBurstRouter_v1.js`
- **Scheduler Registration:** Registered in main.js (Line 212)
- **Update Loop:** Runs every frame (10Hz simulation)
- **WHAT IT READS:**
  - `wave.packet.spawn` event (via semanticBus)
  - `resonance trigger` event (via semanticBus)
- **DATA SOURCE:** WaveInterferenceEngine_v1 + Unknown resonance system
- **SOURCE EXISTS/RUNS:** 
  - `wave.packet.spawn`: ✅ EMITTED by WaveInterferenceEngine_v1:800 (per EVENT_EMISSION_ANALYSIS.md)
  - `resonance trigger`: ❌ NOT FOUND (no emitter in codebase)
- **PROBLEM:** Depends on events that may never fire (WaveInterferenceEngine_v1 not found)
- **PROOF:**
  ```javascript
  // Lines 35-50: Event handlers for potentially non-existent events
  this.semanticBus.on('wave.packet.spawn', (data) => {
    this._handleWavePacketSpawn(data);
  });
  this.semanticBus.on('resonance trigger', (data) => {
    this._handleResonanceTrigger(data);
  });
  ```
- **FALLBACK PATH:** None - Pure event-driven, no polling
- **SEVERITY:** STARVED
- **Impact:** Wave burst effects never trigger

---

#### 6. SynergyTravelingWaveFX_v1.js
- **FILE:** `SynergyTravelingWaveFX_v1.js`
- **Scheduler Registration:** Registered in FrameScheduler (visual tier)
- **Update Loop:** Runs every frame (30Hz visual)
- **WHAT IT READS:**
  - `waveEngine.getSnapshot()` - returns Array<{position, amplitude, phase}>
  - `waveEngine.getWaveField(entityId)` - returns wave data
  - Threshold: `amplitude > 0.05`
- **DATA SOURCE:** WaveInterferenceEngine_v1 (via global reference)
- **SOURCE EXISTS/RUNS:** ❌ NOT FOUND - Wave engine doesn't exist
- **PROBLEM:** Registered and running, but waveEngine is undefined/null
- **PROOF:**
  ```javascript
  // Line 120-125: Calls non-existent API
  const snapshot = this.waveEngine.getSnapshot?.();
  if (!snapshot || snapshot.length === 0) return;
  
  for (const packet of snapshot) {
    if (packet.amplitude < 0.05) continue; // Threshold gating
  ```
- **THRESHOLD GATING:** `amplitude > 0.05` (never passes - data is undefined)
- **SEVERITY:** STARVED
- **Impact:** No traveling wave visual effects

---

#### 7. CascadeResonanceWaveVisualization_Session146.js
- **FILE:** `CascadeResonanceWaveVisualization_Session146.js`
- **Scheduler Registration:** NOT registered in FrameScheduler
- **Update Loop:** Has `update(deltaTime)` but never called
- **WHAT IT READS:**
  - `cascade.hop` event (via semanticBus)
  - `harmonicHubSystem.hubs` (Map of hub data)
  - `cascadeSystem.getCascadeStrength(nodeId)` or node.userData.cascadeStrength
- **DATA SOURCE:** CascadingHarmonicResonanceAmplification.js + HarmonicHubAuraSystem
- **SOURCE EXISTS/RUNS:** ✅ YES - Both systems exist
- **PROBLEM:** Not registered in FrameScheduler, so update() never runs
- **PROOF:**
  ```javascript
  // Line 85-90: Event subscription works
  on('cascade.hop', (event = {}) => {
    this.spawnCascadeResonanceWave(
      event.link.source,
      event.link.target,
      event.intensity,
      event.hopIndex
    );
  });
  ```
- **THRESHOLD GATING:** `minCascadeStrengthTrigger: 0.35` (filters weak cascades)
- **SEVERITY:** STARVED
- **Impact:** Cascade resonance waves never propagate despite cascade system running

---

#### 8. SynergyBonusVisualization_v1.js
- **FILE:** `SynergyBonusVisualization_v1.js`
- **Scheduler Registration:** Registered in FrameScheduler (visual tier)
- **Update Loop:** Runs every frame (30Hz visual)
- **WHAT IT READS:**
  - `link.userData.synergy.synergyNorm` or `link.userData.synergy.score`
- **DATA SOURCE:** MetricsRuntime_v1
- **SOURCE EXISTS/RUNS:** ✅ YES - MetricsRuntime populates this
- **PROBLEM:** NONE - This system appears to be healthy
- **PROOF:**
  ```javascript
  // Line 85-90: Reads canonical synergy data
  const glowIntensity =
    link.userData?.synergy?.synergyNorm ??
    link['synergyScore'] ??
    link.userData?.synergy?.score ??
    0;
  ```
- **THRESHOLD GATING:** `synergyNorm >= 0.40` for tier 1, `>= 0.70` for tier 2, `>= 0.90` for tier 3
- **SEVERITY:** HEALTHY
- **Impact:** Synergy bonus effects work correctly

---

## EVENT SYSTEM ANALYSIS

### Events Being Emitted
According to `EVENT_EMISSION_ANALYSIS.md`:

1. **cascade.hop** ✅
   - Emitted by: `CascadingHarmonicResonanceAmplification.js:540`
   - Status: EMITTED
   - Consumers: CascadeParticleSystem, CascadeResonanceWaveVisualization

2. **wave.packet.spawn** ❓
   - Emitted by: `WaveInterferenceEngine_v1.js:800`
   - Status: NOT VERIFIED (WaveInterferenceEngine_v1 not found)
   - Consumers: WaveBurstRouter, WaveParticleEmitter

3. **node.synergy.high** ✅
   - Emitted by: `MetricsRuntime_v1.js:540`
   - Status: EMITTED
   - Consumers: Unknown

4. **link.synergy.high** ✅
   - Emitted by: `MetricsRuntime_v1.js:635`
   - Status: EMITTED
   - Consumers: Unknown

### Events NOT Found (Expected but Missing)

1. **resonance trigger** ❌
   - Expected: HarmonicResonanceCoupling_v1 or similar
   - Status: NOT FOUND
   - Impact: WaveBurstRouter can never receive this event

2. **harmony spike** ❌
   - Expected: MetricsRuntime_v1 or similar
   - Status: NOT FOUND
   - Impact: Missing harmony spike visual feedback

---

## THRESHOLD GATING ANALYSIS

### Systems Blocked by Thresholds

| System | Threshold | Value | Problem |
|--------|-----------|-------|---------|
| WaveParticleEmitter_v1 | amplitude >= 0.15 | Always 0 | Wave engine doesn't exist |
| WaveParticleEmitter_v1 | constructive >= 0.08 | Always 0 | Wave engine doesn't exist |
| WaveParticleEmitter_v1 | destructive >= 0.10 | Always 0 | Wave engine doesn't exist |
| WaveParticleEmitter_v1 | standing >= 0.12 | Always 0 | Wave engine doesn't exist |
| SynergyTravelingWaveFX_v1 | amplitude >= 0.05 | Undefined | Wave engine doesn't exist |
| CascadeParticleSystem_Session120 | intensity >= 0.1 | Rarely > 0 | Cascade infrequent |
| CascadeResonanceWaveVisualization | cascadeStrength >= 0.35 | Filters weak | Intentional gating |

### Conclusion on Thresholds
- **4 systems have thresholds that never pass** due to missing wave engine
- **2 systems have intentional thresholds** that filter infrequent events (cascade system)
- **No evidence of malicious threshold gating** - all thresholds appear intentional

---

## FALLBACK PATH ANALYSIS

### userData.waveField Fallback
Multiple systems attempt fallback to `userData.waveField`:

1. **WaveShaderBridge_v1**
   - Primary: `link.userData.waveField`
   - Fallback: None (assumes field exists)

2. **WaveParticleEmitter_v1**
   - Primary: `waveEngine.getWaveField(nodeId)`
   - Fallback: `node.userData.waveField`
   - Status: Both undefined - no fallback available

3. **SynergyTravelingWaveFX_v1**
   - Primary: `waveEngine.getSnapshot()`
   - Fallback: None (assumes engine exists)

### Conclusion
- **Fallback paths exist but are ineffective** because waveField is never populated
- **No system populates waveField** without WaveInterferenceEngine_v1
- **Dependency chain is single point of failure**

---

## SUMMARY STATISTICS

### By Severity
```
DEAD:    ████████████████████ 4 systems (50%)
STARVED: ████████████████████ 4 systems (50%)
MISWIRED:                      0 systems (0%)
HEALTHY:                       0 systems (0%)
```

### By Category
```
Wave Systems:      4/5 DEAD (WaveShaderBridge, WaveParticleEmitter, StandingWave, WaveBurstRouter*)
Cascade Systems:   1/2 DEAD (CascadeParticleSystem†), 1/2 STARVED (CascadeResonanceWave)
Resonance Systems: 0/1 HEALTHY (none analyzed)
Particle Systems:  2/3 DEAD (WaveParticleEmitter, CascadeParticleSystem†)
Synergy Systems:   1/1 HEALTHY (SynergyBonusVisualization)

*WaveBurstRouter: Registered but STARVED (no events)
†CascadeParticleSystem: DEAD (not registered)
```

### By Root Cause
```
Missing Wave Engine:    4 systems (WaveShaderBridge, WaveParticleEmitter, SynergyTravelingWaveFX, WaveBurstRouter)
Not Registered:          3 systems (WaveShaderBridge, WaveParticleEmitter, CascadeParticleSystem, CascadeResonanceWave, StandingWave)
Missing Events:         1 system (WaveBurstRouter - resonance.trigger not emitted)
```

---

## RECOMMENDATIONS

### Priority 1: Critical Infrastructure
1. **Locate WaveInterferenceEngine_v1** - Check if it exists under different name or in different location
2. **If not found, decide:** Either implement it or remove dependent systems
3. **Register orphaned systems:** Add CascadeParticleSystem, CascadeResonanceWaveVisualization to FrameScheduler

### Priority 2: Event System
1. **Implement missing events:** Add `resonance trigger` and `harmony spike` emitters
2. **Audit event consumers:** Verify all consumers are registered and receiving events
3. **Add event diagnostics:** Log when events are emitted vs received

### Priority 3: System Cleanup
1. **Remove dead systems:** StandingWaveVisualRenderer (no upstream dependency)
2. **Consolidate particle systems:** Multiple particle systems doing similar work
3. **Document wave dependency chain:** Clear documentation of which systems require wave engine

---

## APPENDIX: FILES ANALYZED

1. WaveShaderBridge_v1.js
2. WaveBurstRouter_v1.js
3. StandingWaveVisualRenderer_Session131.js
4. SynergyTravelingWaveFX_v1.js
5. CascadeParticleSystem_Session120.js
6. CascadeResonanceWaveVisualization_Session146.js
7. WaveParticleEmitter_v1.js
8. SynergyBonusVisualization_v1.js
9. EVENT_EMISSION_ANALYSIS.md
10. FrameScheduler.js (registrations)
11. main.js (initializations)

---

**End of Audit Report**