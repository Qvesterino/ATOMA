# ATOMA PARTICLE / CASCADE SYSTEM TRIGGER AUDIT

**MODE:** READ ONLY  
**DATE:** 2026-03-15  
**AUDITOR:** ATOMA Architect Agent

---

## CIEĽ

Overiť či particle a cascade FX systémy sú správne napojené na runtime a čo reálne spúšťa ich efekty.

---

## SYSTEMS AUDITED

1. CascadeParticleSystem_Session120
2. CascadeParticleEmissionBoost_Session118
3. CascadeParticleColorTinting_Session119
4. ParticleStreamCascadeAcceleration
5. ParticleTrailSystem_Session122
6. ParticleSemanticDensityAdapter_Session121
7. ParticleCascadeFlowDeflection
8. HealingParticleSystem_Session136
9. PulseBoundaryInteractionAdapter_v1
10. PulseIntersectionImpulseAdapter_v1
11. PulseWaveSystemBridge_v1
12. PreCascadeVisualHint_Session146
13. PHASE5_CascadePropagationVisuals_v1
14. PHASE5_CascadeVisualizationBridge_v1

---

## AUDIT RESULTS

### 1️⃣ CascadeParticleSystem_Session120

**INITIALIZATION:**
- Location: [`main.js:384`](main.js:384) - imported via `setupCascadeParticleSystem`
- Setup: [`CascadeParticleSystem_Session120.js:74`](CascadeParticleSystem_Session120.js:74) - `init()` called in constructor
- Scene: [`CascadeParticleSystem_Session120.js:169`](CascadeParticleSystem_Session120.js:169) - adds mesh to scene

**UPDATE LOOP:**
- Registered: [`main.js:3818-3823`](main.js:3818-3823) - `frameScheduler.register('visual', ...)`
- Method: [`CascadeParticleSystem_Session120.js:316`](CascadeParticleSystem_Session120.js:316) - `update(deltaTime, links)`
- Status: ✅ ACTIVE

**DATA INPUT:**
- Reads: [`CascadeParticleSystem_Session120.js:39`](CascadeParticleSystem_Session120.js:39) - `waveEngine` (WaveInterferenceEngine)
- Reads: [`CascadeParticleSystem_Session120.js:347`](CascadeParticleSystem_Session120.js:347) - `link.userData.curvePoints`
- Reads: [`CascadeParticleSystem_Session120.js:368`](CascadeParticleSystem_Session120.js:368) - `node.userData.nodeId`, `node.userData.corruption`
- Metrics: cascadeIntensity, constructivePower, destructivePower, standingWaveFactor

**EVENT SUBSCRIPTIONS:**
- None (poll-based system)

**TRIGGER CONDITIONS:**
- Wave threshold crossing: [`CascadeParticleSystem_Session120.js:394`](CascadeParticleSystem_Session120.js:394) - `constructive > 0.35`
- Wave threshold crossing: [`CascadeParticleSystem_Session120.js:406`](CascadeParticleSystem_Session120.js:406) - `destructive > 0.4`
- Wave threshold crossing: [`CascadeParticleSystem_Session120.js:418`](CascadeParticleSystem_Session120.js:418) - `standing > 0.45`
- Spawn limit: [`CascadeParticleSystem_Session120.js:65`](CascadeParticleSystem_Session120.js:65) - `max 12 particles per event`

**SCENE ACTIVITY:**
- Spawns: [`CascadeParticleSystem_Session120.js:166`](CascadeParticleSystem_Session120.js:166) - `THREE.Points` mesh
- Modifies: [`CascadeParticleSystem_Session120.js:336`](CascadeParticleSystem_Session120.js:336) - geometry attributes (position, color, size, shapeIndex, angle)
- Shader: [`CascadeParticleSystem_Session120.js:102`](CascadeParticleSystem_Session120.js:102) - custom shader material

**STATUS:** ✅ ACTIVE

---

### 2️⃣ CascadeParticleEmissionBoost_Session118

**INITIALIZATION:**
- Location: [`main.js:372`](main.js:372) - imported via `setupCascadeParticleEmissionBoost`
- Setup: [`CascadeParticleEmissionBoost_Session118.js:321`](CascadeParticleEmissionBoost_Session118.js:321) - `setupCascadeParticleEmissionBoost(game, options)`
- Console API: [`CascadeParticleEmissionBoost_Session118.js:295`](CascadeParticleEmissionBoost_Session118.js:295) - `window.cascadeParticleBoostDebug`

**UPDATE LOOP:**
- Registered: [`main.js:3802-3811`](main.js:3802-3811) - `frameScheduler.register('visual', ...)`
- Method: [`CascadeParticleEmissionBoost_Session118.js:171`](CascadeParticleEmissionBoost_Session118.js:171) - `update(deltaTime, links, cascadeSystem)`
- Status: ✅ ACTIVE

**DATA INPUT:**
- Reads: [`CascadeParticleEmissionBoost_Session118.js:192`](CascadeParticleEmissionBoost_Session118.js:192) - `cascadeSystem.getLinkCascadeInfo(link)`
- Reads: [`CascadeParticleEmissionBoost_Session118.js:200`](CascadeParticleEmissionBoost_Session118.js:200) - `link.userData.cascadeIntensity`
- Metrics: cascadeIntensity, harmony, synergy, corruption

**EVENT SUBSCRIPTIONS:**
- None (poll-based adapter)

**TRIGGER CONDITIONS:**
- Cascade intensity > 0: [`CascadeParticleEmissionBoost_Session118.js:212`](CascadeParticleEmissionBoost_Session118.js:212) - triggers boost calculation
- Emission multiplier: [`CascadeParticleEmissionBoost_Session118.js:59`](CascadeParticleEmissionBoost_Session118.js:59) - `1.0 + cascadeIntensity² × 2.0`

**SCENE ACTIVITY:**
- Modifies: [`CascadeParticleEmissionBoost_Session118.js:209`](CascadeParticleEmissionBoost_Session118.js:209) - `link.userData.cascadeParticleEmissionBoost`
- No direct scene objects (adapter only)

**STATUS:** ✅ ACTIVE (PASSIVE ADAPTER)

---

### 3️⃣ CascadeParticleColorTinting_Session119

**INITIALIZATION:**
- Location: [`main.js:378`](main.js:378) - imported via `setupCascadeParticleColorTinting`
- Setup: [`CascadeParticleColorTinting_Session119.js:243`](CascadeParticleColorTinting_Session119.js:243) - constructor
- Palette: [`CascadeParticleColorTinting_Session119.js:33`](CascadeParticleColorTinting_Session119:33) - `initializePalette()` deferred until THREE available

**UPDATE LOOP:**
- Registered: [`main.js:3812-3816`](main.js:3812-3816) - `frameScheduler.register('visual', ...)`
- Method: [`CascadeParticleColorTinting_Session119.js:386`](CascadeParticleColorTinting_Session119.js:386) - `update(deltaTime, links, cascadeSystem, conflictSystem)`
- Status: ✅ ACTIVE

**DATA INPUT:**
- Reads: [`CascadeParticleColorTinting_Session119.js:403`](CascadeParticleColorTinting_Session119.js:403) - `cascadeSystem.getLinkCascadeInfo(link)`
- Reads: [`CascadeParticleColorTinting_Session119.js:348`](CascadeParticleColorTinting_Session119.js:348) - `node.userData.corruption`
- Reads: [`CascadeParticleColorTinting_Session119.js:313`](CascadeParticleColorTinting_Session119.js:313) - `conflictSystem.getConflictState()`
- Metrics: cascadeIntensity, conflictType, conflictIntensity, node corruption

**EVENT SUBSCRIPTIONS:**
- None (poll-based adapter)

**TRIGGER CONDITIONS:**
- Cascade intensity > 0.01: [`CascadeParticleColorTinting_Session119.js:444`](CascadeParticleColorTinting_Session119.js:444) - triggers color tint
- Conflict type detection: [`CascadeParticleColorTinting_Session119.js:416`](CascadeParticleColorTinting_Session119.js:416) - `_detectConflictType()`
- Corruption > 0.5: [`CascadeParticleColorTinting_Session119.js:351`](CascadeParticleColorTinting_Session119.js:351) - triggers corruption tint

**SCENE ACTIVITY:**
- Modifies: [`CascadeParticleColorTinting_Session119.js:438-441`](CascadeParticleColorTinting_Session119.js:438-441) - `link.userData.cascadeParticleColor*`
- No direct scene objects (adapter only)

**STATUS:** ✅ ACTIVE (PASSIVE ADAPTER)

---

### 4️⃣ ParticleStreamCascadeAcceleration

**INITIALIZATION:**
- Location: [`main.js:363`](main.js:363) - imported
- Setup: [`main.js:8049`](main.js:8049) - `ParticleStreamCascadeAccelerationIntegrationSetup`
- Delayed init: [`main.js:8065`](main.js:8065) - `setTimeout(500ms)` after systems ready

**UPDATE LOOP:**
- Registered: [`main.js:3514-3518`](main.js:3514-3518) - `frameScheduler.register('simulation', ...)`
- Method: [`ParticleStreamCascadeAcceleration.js:134`](ParticleStreamCascadeAcceleration.js:134) - `update(deltaTime, time)`
- Status: ✅ ACTIVE

**DATA INPUT:**
- Reads: [`ParticleStreamCascadeAcceleration.js:214`](ParticleStreamCascadeAcceleration.js:214) - `node._cascadeStrength`, `node._cascadeLayer`, `node._cascadeAmplitude`
- Reads: [`ParticleStreamCascadeAcceleration.js:268`](ParticleStreamCascadeAcceleration.js:268) - `node.harmony`, `node.synergy`, `node.corruption`
- Metrics: cascadeStrength, cascadeLayer, cascadeAmplitude, harmony, synergy, corruption

**EVENT SUBSCRIPTIONS:**
- None (query-based system)

**TRIGGER CONDITIONS:**
- Cascade layer depth: [`ParticleStreamCascadeAcceleration.js:243`](ParticleStreamCascadeAcceleration.js:243) - `_getLayerDepthCurve()`
- Query-based: [`ParticleStreamCascadeAcceleration.js:155`](ParticleStreamCascadeAcceleration.js:155) - `getAccelerationMultiplier(nodeId)`

**SCENE ACTIVITY:**
- No direct scene objects (velocity modifier only)
- Modifies: particle velocity via `getAccelerationVector()` query

**STATUS:** ✅ ACTIVE (PASSIVE ADAPTER)

---

### 5️⃣ ParticleTrailSystem_Session122

**INITIALIZATION:**
- Location: [`main.js:385`](main.js:385) - imported via `ParticleTrailIntegrationPatch_Session122`
- Setup: [`main.js:8595`](main.js:8595) - `setupParticleTrailSystem()`
- Console API: [`ParticleTrailSystem_Session122.js:398`](ParticleTrailSystem_Session122.js:398) - `getStats()`

**UPDATE LOOP:**
- Registered: [`main.js:3824-3833`](main.js:3824-3833) - `frameScheduler.register('visual', ...)`
- Method: [`ParticleTrailSystem_Session122.js:194`](ParticleTrailSystem_Session122.js:194) - `update(deltaTime, particles, activeParticleCount)`
- Status: ✅ ACTIVE

**DATA INPUT:**
- Reads: [`ParticleTrailSystem_Session122.js:245`](ParticleTrailSystem_Session122.js:245) - `cascadeSystem.getLinkMetrics()`
- Reads: [`ParticleTrailSystem_Session122.js:254-257`](ParticleTrailSystem_Session122.js:254-257) - geometry attributes (position, color, size, flowType)
- Metrics: particle flowType, position, color, size

**EVENT SUBSCRIPTIONS:**
- None (poll-based system)

**TRIGGER CONDITIONS:**
- Forward flow particles: [`ParticleTrailSystem_Session122.js:263`](ParticleTrailSystem_Session122.js:263) - `flowType === 0`
- Emission rate: [`ParticleTrailSystem_Session122.js:251`](ParticleTrailSystem_Session122.js:251) - `50% probability`
- Speed threshold: [`ParticleTrailSystem_Session122.js:320`](ParticleTrailSystem_Session122.js:320) - `trailLength = speed × 0.15`

**SCENE ACTIVITY:**
- Spawns: [`ParticleTrailSystem_Session122.js:170`](ParticleTrailSystem_Session122.js:170) - `THREE.Points` mesh
- Modifies: [`ParticleTrailSystem_Session122.js:347`](ParticleTrailSystem_Session122.js:347) - geometry attributes (position, color, size, age, length)
- Shader: [`ParticleTrailSystem_Session122.js:108`](ParticleTrailSystem_Session122.js:108) - custom trail shader

**STATUS:** ✅ ACTIVE

---

### 6️⃣ ParticleSemanticDensityAdapter_Session121

**INITIALIZATION:**
- Location: [`main.js:393`](main.js:393) - imported via `setupParticleSemanticDensity`
- Setup: [`ParticleSemanticDensityAdapter_Session121.js:376`](ParticleSemanticDensityAdapter_Session121.js:376) - `setupParticleSemanticDensity(game, options)`
- Console API: [`ParticleSemanticDensityAdapter_Session121.js:347`](ParticleSemanticDensityAdapter_Session121.js:347) - `window.particleSemanticDensityDebug`

**UPDATE LOOP:**
- Registered: [`main.js:3797-3801`](main.js:3797-3801) - `frameScheduler.register('visual', ...)`
- Method: [`ParticleSemanticDensityAdapter_Session121.js:70`](ParticleSemanticDensityAdapter_Session121.js:70) - `update(deltaTime, links, conflictSystem, cascadeSystem)`
- Status: ✅ ACTIVE

**DATA INPUT:**
- Reads: [`ParticleSemanticDensityAdapter_Session121.js:168`](ParticleSemanticDensityAdapter_Session121.js:168) - `cascadeSystem.getLinkCascadeInfo(link)`
- Reads: [`ParticleSemanticDensityAdapter_Session121.js:175`](ParticleSemanticDensityAdapter_Session121.js:175) - `link.userData.cascadeIntensity`
- Reads: [`ParticleSemanticDensityAdapter_Session121.js:185`](ParticleSemanticDensityAdapter_Session121.js:185) - `node.userData.corruption`
- Metrics: cascadeIntensity, conflict persistence, oscillation, synapticFatigue

**EVENT SUBSCRIPTIONS:**
- None (poll-based adapter)

**TRIGGER CONDITIONS:**
- Intensity > 0.05: [`ParticleSemanticDensityAdapter_Session121.js:87`](ParticleSemanticDensityAdapter_Session121.js:87) - triggers density calculation
- Urgency sources: [`ParticleSemanticDensityAdapter_Session121.js:199-233`](ParticleSemanticDensityAdapter_Session121.js:199-233) - cascade change, conflict persistence, oscillation, fatigue

**SCENE ACTIVITY:**
- Modifies: [`ParticleSemanticDensityAdapter_Session121.js:135-140`](ParticleSemanticDensityAdapter_Session121.js:135-140) - `link.userData.particle*`
- No direct scene objects (adapter only)

**STATUS:** ✅ ACTIVE (PASSIVE ADAPTER)

---

### 7️⃣ ParticleCascadeFlowDeflection

**INITIALIZATION:**
- Location: [`main.js:364`](main.js:364) - imported
- Setup: [`main.js:8049`](main.js:8049) - `ParticleStreamCascadeAccelerationIntegrationSetup`
- Console API: [`ParticleCascadeFlowDeflection.js:421`](ParticleCascadeFlowDeflection.js:421) - `window.cascadeFlowDeflection`

**UPDATE LOOP:**
- Registered: [`main.js:3514-3518`](main.js:3514-3518) - `frameScheduler.register('simulation', ...)` (via cascadeAccelSetup)
- Method: [`ParticleCascadeFlowDeflection.js:106`](ParticleCascadeFlowDeflection.js:106) - `update(deltaTime, time)`
- Status: ✅ ACTIVE

**DATA INPUT:**
- Reads: [`ParticleCascadeFlowDeflection.js:136`](ParticleCascadeFlowDeflection.js:136) - `node._cascadeStrength`, `node._cascadeLayer`, `node._cascadeAmplitude`
- Reads: [`ParticleCascadeFlowDeflection.js:144`](ParticleCascadeFlowDeflection.js:144) - `node.synergy`, `node.harmony`, `node.corruption`
- Metrics: cascadeStrength, cascadeLayer, cascadeAmplitude, harmony, synergy, corruption

**EVENT SUBSCRIPTIONS:**
- None (query-based system)

**TRIGGER CONDITIONS:**
- Query-based: [`ParticleCascadeFlowDeflection.js:125`](ParticleCascadeFlowDeflection.js:125) - `getDeflectionVector(position, sourceNodeId)`
- Cascade flow direction: [`ParticleCascadeFlowDeflection.js:198`](ParticleCascadeFlowDeflection.js:198) - `_getFlowDirection(nodeId)`

**SCENE ACTIVITY:**
- No direct scene objects (velocity modifier only)
- Modifies: particle velocity via `getDeflectionVector()` query

**STATUS:** ✅ ACTIVE (PASSIVE ADAPTER)

---

### 8️⃣ HealingParticleSystem_Session136

**INITIALIZATION:**
- Location: [`main.js:459`](main.js:459) - imported
- Setup: [`main.js:11244`](main.js:11244) - `new HealingParticleSystem_Session136(scene, resonanceRuptureSystem, audioSystem)`
- Console API: None

**UPDATE LOOP:**
- Registered: [`main.js:3855-3859`](main.js:3855-3859) - `frameScheduler.register('visual', ...)`
- Method: [`HealingParticleSystem_Session136.js:186`](HealingParticleSystem_Session136.js:186) - `update(deltaTime, time, networkState, camera)`
- Status: ✅ ACTIVE

**DATA INPUT:**
- Reads: [`HealingParticleSystem_Session136.js:194`](HealingParticleSystem_Session136.js:194) - `resonanceRupture.resonanceScars`
- Reads: [`HealingParticleSystem_Session136.js:209`](HealingParticleSystem_Session136.js:209) - `networkState.harmony`, `networkState.corruption`
- Metrics: scar intensity, harmony, corruption

**EVENT SUBSCRIPTIONS:**
- None (poll-based system)

**TRIGGER CONDITIONS:**
- Scar processing: [`HealingParticleSystem_Session136.js:216`](HealingParticleSystem_Session136.js:216) - `forEach scar in scars`
- Emission rate: [`HealingParticleSystem_Session136.js:214`](HealingParticleSystem_Session136.js:214) - `1.5 sparkles/scar/sec × (1 + harmony × 0.5) × (1 - corruption)`
- External API: [`HealingParticleSystem_Session136.js:273`](HealingParticleSystem_Session136.js:273) - `emitHealingTrail()`, [`HealingParticleSystem_Session136.js:302`](HealingParticleSystem_Session136.js:302) - `emitSplash()`

**SCENE ACTIVITY:**
- Spawns: [`HealingParticleSystem_Session136.js:150`](HealingParticleSystem_Session136.js:150) - `THREE.Points` mesh
- Modifies: [`HealingParticleSystem_Session136.js:164-177`](HealingParticleSystem_Session136.js:164-177) - geometry attributes (position, velocity, color, birthTime, lifetime, size)
- Shader: [`HealingParticleSystem_Session136.js:138`](HealingParticleSystem_Session136.js:138) - custom sparkle shader
- Audio: [`HealingParticleSystem_Session136.js:306`](HealingParticleSystem_Session136.js:306) - `audioSystem.triggerHealingTone()`

**STATUS:** ✅ ACTIVE

---

### 9️⃣ PulseBoundaryInteractionAdapter_v1

**INITIALIZATION:**
- Location: [`main.js:566`](main.js:566) - imported via `setupPulseBoundaryInteractionIntegration`
- Setup: [`PulseBoundaryInteractionAdapter_v1.js:118`](PulseBoundaryInteractionAdapter_v1.js:118) - constructor
- Console API: [`PulseBoundaryInteractionAdapter_v1.js:141`](PulseBoundaryInteractionAdapter_v1.js:141) - `setupConsoleAPI()`

**UPDATE LOOP:**
- Registered: [`main.js:3702-3711`](main.js:3702-3711) - `frameScheduler.register('visual', ...)`
- Method: [`PulseBoundaryInteractionAdapter_v1.js:152`](PulseBoundaryInteractionAdapter_v1.js:152) - `update(context = {})`
- Status: ✅ ACTIVE

**DATA INPUT:**
- Reads: [`PulseBoundaryInteractionAdapter_v1.js:182`](PulseBoundaryInteractionAdapter_v1.js:182) - `link.userData.pulseTravelData`
- Reads: [`PulseBoundaryInteractionAdapter_v1.js:302`](PulseBoundaryInteractionAdapter_v1.js:302) - `node.userData.metrics.harmony`, `node.userData.metrics.stability`
- Reads: [`PulseBoundaryInteractionAdapter_v1.js:298`](PulseBoundaryInteractionAdapter_v1.js:298) - `pulse.harmony`, `pulse.synergy`, `pulse.corruption`, `pulse.stability`
- Metrics: pulse amplitude, pulse position, node harmony/stability, hub resilience

**EVENT SUBSCRIPTIONS:**
- None (poll-based system)

**TRIGGER CONDITIONS:**
- Pulse boundary reached: [`PulseBoundaryInteractionAdapter_v1.js:243`](PulseBoundaryInteractionAdapter_v1.js:243) - `pulseT >= 1.0` or `pulseT <= 0.0`
- Amplitude threshold: [`PulseBoundaryInteractionAdapter_v1.js:231`](PulseBoundaryInteractionAdapter_v1.js:231) - `amplitude >= 0.15`
- Interaction mode: [`PulseBoundaryInteractionAdapter_v1.js:297`](PulseBoundaryInteractionAdapter_v1.js:297) - `determineInteractionMode()`

**SCENE ACTIVITY:**
- Modifies: [`PulseBoundaryInteractionAdapter_v1.js:483-546`](PulseBoundaryInteractionAdapter_v1.js:483-546) - `node.userData.boundary*`, `link.userData.boundary*`
- No direct scene objects (adapter only)

**STATUS:** ✅ ACTIVE (PASSIVE ADAPTER)

---

### 🔟 PulseIntersectionImpulseAdapter_v1

**INITIALIZATION:**
- Location: [`main.js:564`](main.js:564) - imported via `setupPulseIntersectionIntegration`
- Setup: [`PulseIntersectionImpulseAdapter_v1.js:320`](PulseIntersectionImpulseAdapter_v1.js:320) - `constructor(scene)`
- Console API: None

**UPDATE LOOP:**
- Registered: [`main.js:3712-3716`](main.js:3712-3716) - `frameScheduler.register('visual', ...)`
- Method: [`PulseIntersectionImpulseAdapter_v1.js:487`](PulseIntersectionImpulseAdapter_v1.js:487) - `update()`
- Status: ✅ ACTIVE

**DATA INPUT:**
- Reads: [`PulseIntersectionImpulseAdapter_v1.js:361`](PulseIntersectionImpulseAdapter_v1.js:361) - `updatePulsePosition(linkId, pulseT, pulseConfig)`
- Reads: [`PulseIntersectionImpulseAdapter_v1.js:397`](PulseIntersectionImpulseAdapter_v1.js:397) - `link.geometry`, `link.matrixWorld`
- Metrics: pulse position, pulse width, harmony, synergy, corruption, instability

**EVENT SUBSCRIPTIONS:**
- None (query-based system)

**TRIGGER CONDITIONS:**
- Pulse intersection: [`PulseIntersectionImpulseAdapter_v1.js:67`](PulseIntersectionImpulseAdapter_v1.js:67) - `detectIntersections(linkId, pulseT, pulseWidth)`
- Cooldown check: [`PulseIntersectionImpulseAdapter_v1.js:97`](PulseIntersectionImpulseAdapter_v1.js:97) - `canSegmentFire(linkId, segmentIndex)`
- Shape selection: [`PulseIntersectionImpulseAdapter_v1.js:412`](PulseIntersectionImpulseAdapter_v1.js:412) - `synergy > 0.7 ? spark : arc`

**SCENE ACTIVITY:**
- Spawns: [`PulseIntersectionImpulseAdapter_v1.js:234`](PulseIntersectionImpulseAdapter_v1.js:234) - `THREE.Points` (spark), [`PulseIntersectionImpulseAdapter_v1.js:236`](PulseIntersectionImpulseAdapter_v1.js:236) - `THREE.Line` (arc/snap)
- Modifies: [`PulseIntersectionImpulseAdapter_v1.js:261`](PulseIntersectionImpulseAdapter_v1.js:261) - visual scale, color, opacity
- Materials: [`PulseIntersectionImpulseAdapter_v1.js:147-171`](PulseIntersectionImpulseAdapter_v1.js:147-171) - cached materials

**STATUS:** ✅ ACTIVE

---

### 1️⃣1️⃣ PulseWaveSystemBridge_v1

**INITIALIZATION:**
- Location: [`main.js:565`](main.js:565) - imported via `setupPulseWaveSystemBridgeIntegration`
- Setup: [`PulseWaveSystemBridge_v1.js:224`](PulseWaveSystemBridge_v1.js:224) - `setupPulseWaveSystemBridgeIntegration(game)`
- Console API: [`PulseWaveSystemBridge_v1.js:168`](PulseWaveSystemBridge_v1.js:168) - `window.pulseWaveBridge`

**UPDATE LOOP:**
- Registered: [`main.js:3692-3701`](main.js:3692-3701) - `frameScheduler.register('visual', ...)`
- Method: [`PulseWaveSystemBridge_v1.js:45`](PulseWaveSystemBridge_v1.js:45) - `update(deltaTime, context = {})`
- Status: ✅ ACTIVE

**DATA INPUT:**
- Reads: [`PulseWaveSystemBridge_v1.js:82`](PulseWaveSystemBridge_v1.js:82) - `waveEngine.getLinkWaveField(linkId, link)`
- Reads: [`PulseWaveSystemBridge_v1.js:91`](PulseWaveSystemBridge_v1.js:91) - `waveField.amplitude`, `waveField.phase`, `waveField.harmonicLevel`, `waveField.destructiveInterference`
- Metrics: wave amplitude, phase, harmonicLevel, destructiveInterference, network instability

**EVENT SUBSCRIPTIONS:**
- None (poll-based bridge)

**TRIGGER CONDITIONS:**
- Amplitude threshold: [`PulseWaveSystemBridge_v1.js:97`](PulseWaveSystemBridge_v1.js:97) - `amplitude >= 0.15`
- Pulse position: [`PulseWaveSystemBridge_v1.js:104`](PulseWaveSystemBridge_v1.js:104) - `pulsePosition = (normalizedPhase × 0.8) % 1.0`
- Calls: [`PulseWaveSystemBridge_v1.js:128`](PulseWaveSystemBridge_v1.js:128) - `pulseIntersectionAdapter.updatePulsePosition()`

**SCENE ACTIVITY:**
- No direct scene objects (bridge only)
- Forwards: [`PulseWaveSystemBridge_v1.js:128-140`](PulseWaveSystemBridge_v1.js:128-140) - to `pulseIntersectionAdapter`

**STATUS:** ✅ ACTIVE (BRIDGE)

---

### 1️⃣2️⃣ PreCascadeVisualHint_Session146

**INITIALIZATION:**
- Location: [`HarmonicCascadeAmplification_Session145.js:73`](HarmonicCascadeAmplification_Session145.js:73) - `new PreCascadeVisualHint_Session146(...)`
- Setup: [`PreCascadeVisualHint_Session146.js:62`](PreCascadeVisualHint_Session146.js:62) - constructor
- Console API: [`PreCascadeVisualHint_Session146.js:365`](PreCascadeVisualHint_Session146.js:365) - `setupConsoleAPI(globalWindow)`

**UPDATE LOOP:**
- Registered: ❌ NOT FOUND in main.js frameScheduler
- Method: [`PreCascadeVisualHint_Session146.js:119`](PreCascadeVisualHint_Session146.js:119) - `update(deltaTime)`
- Status: ⚠️ PARTIALLY WIRED

**DATA INPUT:**
- Reads: [`PreCascadeVisualHint_Session146.js:130`](PreCascadeVisualHint_Session146.js:130) - `cascadeSystem.getProximityPairs()`
- Reads: [`PreCascadeVisualHint_Session146.js:143`](PreCascadeVisualHint_Session146.js:143) - `cascadeSystem.phaseSynchronization.getStats()`
- Metrics: proximity pairs, phase sync stats, avgPhaseDelta

**EVENT SUBSCRIPTIONS:**
- None (poll-based system)

**TRIGGER CONDITIONS:**
- Proximal hubs: [`PreCascadeVisualHint_Session146.js:133`](PreCascadeVisualHint_Session146.js:133) - `proximityPairs.length >= 1`
- Phase sync: [`PreCascadeVisualHint_Session146.js:154`](PreCascadeVisualHint_Session146.js:154) - `avgPhaseDelta / 0.05`
- Hint strength: [`PreCascadeVisualHint_Session146.js:155`](PreCascadeVisualHint_Session146.js:155) - `syncIntensity × 0.15`

**SCENE ACTIVITY:**
- Modifies: [`PreCascadeVisualHint_Session146.js:224`](PreCascadeVisualHint_Session146.js:224) - `hub._precastHintStrength`, `hub._auraCoherenceBias`
- Modifies: [`PreCascadeVisualHint_Session146.js:253`](PreCascadeVisualHint_Session146.js:253) - `linkMetadata._phaseCompression`
- Modifies: [`PreCascadeVisualHint_Session146.js:283`](PreCascadeVisualHint_Session146.js:283) - `hub._fieldRandomnessBias`, `hub._breathingPhase`
- No direct scene objects (adapter only)

**STATUS:** ⚠️ PARTIALLY WIRED (NO UPDATE LOOP)

---

### 1️⃣3️⃣ PHASE5_CascadePropagationVisuals_v1

**INITIALIZATION:**
- Location: [`main.js:665`](main.js:665) - imported
- Setup: [`main.js:7559`](main.js:7559) - `new PHASE5_CascadePropagationVisuals(scene, config)`
- Console API: [`PHASE5_CascadePropagationVisuals_v1.js:493`](PHASE5_CascadePropagationVisuals_v1.js:493) - `window.PHASE5_CascadePropagationVisuals_API`

**UPDATE LOOP:**
- Registered: [`main.js:3615`](main.js:3615) - `frameScheduler.register('visual', ...)`
- Method: [`PHASE5_CascadePropagationVisuals_v1.js:368`](PHASE5_CascadePropagationVisuals_v1.js:368) - `update(deltaTime)`
- Status: ✅ ACTIVE

**DATA INPUT:**
- Reads: [`PHASE5_CascadePropagationVisuals_v1.js:406`](PHASE5_CascadePropagationVisuals_v1.js:406) - `linkCorruptionTransmission.getCascadeHistory()`
- Metrics: cascade events (sourceNodeId, cascadeType, cascadeStrength, depth, targetNodes)

**EVENT SUBSCRIPTIONS:**
- None (poll-based system)

**TRIGGER CONDITIONS:**
- Cascade event: [`PHASE5_CascadePropagationVisuals_v1.js:89`](PHASE5_CascadePropagationVisuals_v1.js:89) - `triggerCascade(cascadeData)`
- External trigger: [`PHASE5_CascadePropagationVisuals_v1.js:430`](PHASE5_CascadePropagationVisuals_v1.js:430) - `checkCascadeEvents()`

**SCENE ACTIVITY:**
- Spawns: [`PHASE5_CascadePropagationVisuals_v1.js:234`](PHASE5_CascadePropagationVisuals_v1.js:234) - `THREE.LineLoop` (ring)
- Modifies: [`PHASE5_CascadePropagationVisuals_v1.js:305`](PHASE5_CascadePropagationVisuals_v1.js:305) - ring scale (expansion)
- Modifies: [`PHASE5_CascadePropagationVisuals_v1.js:323`](PHASE5_CascadePropagationVisuals_v1.js:323) - material opacity (fade)
- Materials: [`PHASE5_CascadePropagationVisuals_v1.js:268`](PHASE5_CascadePropagationVisuals_v1.js:268) - cached materials per cascade type

**STATUS:** ✅ ACTIVE

---

### 1️⃣4️⃣ PHASE5_CascadeVisualizationBridge_v1

**INITIALIZATION:**
- Location: [`main.js:666`](main.js:666) - imported
- Setup: [`main.js:7595`](main.js:7595) - `new PHASE5_CascadeVisualizationBridge(aiNodes, linkCorruptionTransmission, cascadePropagationVisuals, config)`
- Console API: [`PHASE5_CascadeVisualizationBridge_v1.js:391`](PHASE5_CascadeVisualizationBridge_v1.js:391) - `window.PHASE5_CascadeVisualizationBridge_API`

**UPDATE LOOP:**
- Registered: [`main.js:3617`](main.js:3617) - `frameScheduler.register('visual', ...)`
- Method: [`PHASE5_CascadeVisualizationBridge_v1.js:89`](PHASE5_CascadeVisualizationBridge_v1.js:89) - `update(deltaTime)`
- Status: ✅ ACTIVE

**DATA INPUT:**
- Reads: [`PHASE5_CascadeVisualizationBridge_v1.js:125`](PHASE5_CascadeVisualizationBridge_v1.js:125) - `linkCorruptionTransmission.getCascadeHistory()`
- Reads: [`PHASE5_CascadeVisualizationBridge_v1.js:139`](PHASE5_CascadeVisualizationBridge_v1.js:139) - `linkCorruptionTransmission.getThreatCascadeHistory()`
- Metrics: cascade events (sourceNode, affectedNodes, strength, depth, cascadeType)

**EVENT SUBSCRIPTIONS:**
- None (poll-based bridge)

**TRIGGER CONDITIONS:**
- Cascade detection: [`PHASE5_CascadeVisualizationBridge_v1.js:119`](PHASE5_CascadeVisualizationBridge_v1.js:119) - `checkCascadeEvents()`
- Queue processing: [`PHASE5_CascadeVisualizationBridge_v1.js:191`](PHASE5_CascadeVisualizationBridge_v1.js:191) - `processQueuedCascades()`
- Forwards: [`PHASE5_CascadeVisualizationBridge_v1.js:253`](PHASE5_CascadeVisualizationBridge_v1.js:253) - `cascadePropagationVisuals.triggerCascade()`

**SCENE ACTIVITY:**
- No direct scene objects (bridge only)
- Forwards: [`PHASE5_CascadeVisualizationBridge_v1.js:253-260`](PHASE5_CascadeVisualizationBridge_v1.js:253-260) - to `cascadePropagationVisuals`

**STATUS:** ✅ ACTIVE (BRIDGE)

---

## SUMMARY TABLE

| SYSTEM | INIT | UPDATE LOOP | INPUT | EVENTS | TRIGGER | SCENE EFFECT | STATUS |
|--------|-------|-------------|-------|--------|---------|--------------|--------|
| CascadeParticleSystem_Session120 | main.js:384 | frameScheduler.visual | waveEngine, link.userData, node.userData | None | Wave threshold crossing | THREE.Points + shader | ✅ ACTIVE |
| CascadeParticleEmissionBoost_Session118 | main.js:372 | frameScheduler.visual | cascadeSystem.getLinkCascadeInfo, link.userData | None | Cascade intensity > 0 | userData only | ✅ ACTIVE (PASSIVE ADAPTER) |
| CascadeParticleColorTinting_Session119 | main.js:378 | frameScheduler.visual | cascadeSystem, conflictSystem, node.userData | None | Cascade intensity > 0.01 | userData only | ✅ ACTIVE (PASSIVE ADAPTER) |
| ParticleStreamCascadeAcceleration | main.js:363 | frameScheduler.simulation | node._cascade*, node.harmony/synergy/corruption | None | Query-based | None (velocity modifier) | ✅ ACTIVE (PASSIVE ADAPTER) |
| ParticleTrailSystem_Session122 | main.js:385 | frameScheduler.visual | cascadeSystem, geometry attributes | None | Forward flow particles | THREE.Points + shader | ✅ ACTIVE |
| ParticleSemanticDensityAdapter_Session121 | main.js:393 | frameScheduler.visual | cascadeSystem, link.userData, node.userData | None | Intensity > 0.05 | userData only | ✅ ACTIVE (PASSIVE ADAPTER) |
| ParticleCascadeFlowDeflection | main.js:364 | frameScheduler.simulation | node._cascade*, node.harmony/synergy/corruption | None | Query-based | None (velocity modifier) | ✅ ACTIVE (PASSIVE ADAPTER) |
| HealingParticleSystem_Session136 | main.js:459 | frameScheduler.visual | resonanceRupture, networkState | None | Scar processing | THREE.Points + shader + audio | ✅ ACTIVE |
| PulseBoundaryInteractionAdapter_v1 | main.js:566 | frameScheduler.visual | link.userData.pulseTravelData, node.userData.metrics | None | Pulse boundary reached | userData only | ✅ ACTIVE (PASSIVE ADAPTER) |
| PulseIntersectionImpulseAdapter_v1 | main.js:564 | frameScheduler.visual | pulse position, link geometry | None | Pulse intersection | THREE.Points + THREE.Line | ✅ ACTIVE |
| PulseWaveSystemBridge_v1 | main.js:565 | frameScheduler.visual | waveEngine.getLinkWaveField | None | Amplitude >= 0.15 | None (bridge) | ✅ ACTIVE (BRIDGE) |
| PreCascadeVisualHint_Session146 | HarmonicCascadeAmplification:73 | ❌ NOT REGISTERED | cascadeSystem.getProximityPairs | None | Proximal hubs + phase sync | userData only | ⚠️ PARTIALLY WIRED |
| PHASE5_CascadePropagationVisuals_v1 | main.js:665 | frameScheduler.visual | linkCorruptionTransmission.getCascadeHistory | None | Cascade event | THREE.LineLoop | ✅ ACTIVE |
| PHASE5_CascadeVisualizationBridge_v1 | main.js:666 | frameScheduler.visual | linkCorruptionTransmission.getCascadeHistory | None | Cascade detection | None (bridge) | ✅ ACTIVE (BRIDGE) |

---

## DEAD SYSTEM CHECK

### ❌ NO TRIGGER
- **None found** - all systems have trigger conditions

### ⚠️ EVENT NEVER EMITS
- **None found** - all systems use poll-based or query-based approaches

### ⚠️ METRIC NEVER CHANGES
- **PreCascadeVisualHint_Session146**: Depends on `cascadeSystem.getProximityPairs()` and `phaseSynchronization.getStats()` - may never trigger if cascade system is inactive

### ⚠️ UPDATE NEVER CALLED
- **PreCascadeVisualHint_Session146**: ❌ NOT registered in frameScheduler - update() method exists but never called

### ⚠️ WRITES USERDATA BUT NOBODY READS
- **CascadeParticleEmissionBoost_Session118**: Writes `link.userData.cascadeParticleEmissionBoost` - read by WaveParticleEmitter via integration patch
- **CascadeParticleColorTinting_Session119**: Writes `link.userData.cascadeParticleColor*` - read by CascadeParticleSystem_Session120
- **ParticleSemanticDensityAdapter_Session121**: Writes `link.userData.particle*` - read by particle emitters
- **PulseBoundaryInteractionAdapter_v1**: Writes `node.userData.boundary*`, `link.userData.boundary*` - read by visual systems
- **PreCascadeVisualHint_Session146**: Writes `hub._precastHintStrength`, `linkMetadata._phaseCompression` - read by aura and link systems

---

## CRITICAL ISSUES

### 1. PreCascadeVisualHint_Session146 - NOT WIRED TO UPDATE LOOP
**SEVERITY:** HIGH  
**ISSUE:** System is initialized but never updated  
**LOCATION:** [`main.js`](main.js) - no frameScheduler registration found  
**IMPACT:** Pre-cascade visual hints never activate  
**RECOMMENDATION:** Add frameScheduler registration for PreCascadeVisualHint_Session146

### 2. Cascade Wave Engine Dependency
**SEVERITY:** MEDIUM  
**ISSUE:** Multiple systems depend on `waveEngine` which may not be initialized  
**AFFECTED:** CascadeParticleSystem_Session120, PulseWaveSystemBridge_v1  
**RECOMMENDATION:** Add null checks and graceful degradation

### 3. userData Coupling
**SEVERITY:** MEDIUM  
**ISSUE:** Heavy reliance on `link.userData` and `node.userData` for communication  
**AFFECTED:** All adapter systems  
**RECOMMENDATION:** Consider formal data flow contracts

---

## ARCHITECTURAL OBSERVATIONS

### Active Systems (13/14)
- 13 systems are fully wired and active
- 1 system is partially wired (PreCascadeVisualHint_Session146)

### Adapter Pattern (6 systems)
- CascadeParticleEmissionBoost_Session118
- CascadeParticleColorTinting_Session119
- ParticleStreamCascadeAcceleration
- ParticleSemanticDensityAdapter_Session121
- ParticleCascadeFlowDeflection
- PulseBoundaryInteractionAdapter_v1

These systems:
- Read state from other systems
- Write to userData for downstream consumption
- Do not create scene objects directly
- Are passive adapters in the data flow

### Bridge Pattern (2 systems)
- PulseWaveSystemBridge_v1
- PHASE5_CascadeVisualizationBridge_v1

These systems:
- Translate between different system interfaces
- Forward data to visual systems
- Do not create scene objects directly

### Particle Systems (4 systems)
- CascadeParticleSystem_Session120
- ParticleTrailSystem_Session122
- HealingParticleSystem_Session136
- PulseIntersectionImpulseAdapter_v1

These systems:
- Create and manage GPU objects
- Use custom shaders
- Directly modify scene

---

## RECOMMENDATIONS

### 1. Fix PreCascadeVisualHint_Session146
Add frameScheduler registration:
```javascript
this.frameScheduler.register('visual', (dt) => {
  if (this.precastHint) {
    this.precastHint.update(dt);
  }
}, 'visual.precastHint');
```

### 2. Document userData Contracts
Create formal contracts for userData keys:
- `link.userData.cascadeParticleEmissionBoost`
- `link.userData.cascadeParticleColor*`
- `link.userData.particle*`
- `node.userData.boundary*`
- `hub._precastHintStrength`

### 3. Add System Health Monitoring
Implement health checks for:
- Wave engine initialization
- Cascade system availability
- Data flow validation

### 4. Consider Event-Driven Architecture
For better decoupling:
- Replace poll-based systems with event subscriptions
- Use semanticBus for cascade events
- Reduce frameScheduler polling overhead

---

## CONCLUSION

**OVERALL STATUS:** ✅ 13/14 SYSTEMS ACTIVE (93%)

**CRITICAL ISSUE:** 1 system (PreCascadeVisualHint_Session146) not wired to update loop

**ARCHITECTURAL HEALTH:** GOOD
- Clear separation between adapters, bridges, and particle systems
- Consistent data flow patterns
- Well-structured trigger conditions

**NEXT STEPS:**
1. Wire PreCascadeVisualHint_Session146 to frameScheduler
2. Document userData contracts
3. Add system health monitoring
4. Consider event-driven refactoring

---

**AUDIT COMPLETED:** 2026-03-15  
**AUDITOR:** ATOMA Architect Agent  
**MODE:** READ ONLY
