# Prehľad Stability/Instability/Network Stress VFX Efektov

## 1. StressVisualShaderSystem.js
**Popis:** GPU-based stress visualization pomocou GLSL shaderov - ambientné stress pole, node stress overlayy, connector stress glow.

**Trigger Event:**
- `update(deltaTime, time, nodes)` - spúšťa sa každý frame
- Interny `_updateNetworkStress()` číta z `CoreMetricsCalculator.getMetrics().stability`

**Wiring:**
- Číta: `CoreMetricsCalculator.getMetrics().stability` → vypočíta `networkStress = 1 - stability`
- Číta: `node.userData.visualMetrics.networkStressVisualDensity` pre node overlay
- Zapisuje: `node.userData.stressPulseRate`, `node.userData.stressPulsePhase`, `node.userData.stressIntensity`
- Modifikuje: `scene.fog.color` (color shift podľa stress levelu)
- Materialy: Shader materiály pre ambient, node, connector stress

---

## 2. ResonanceRuptureVisualSystem_Session133.js
**Popis:** Visualizuje kolaps stojacich vĺn - pre-rupture stress indikátory, rupture events, propagation paths, resonance scars.

**Trigger Event:**
- `update(deltaTime, currentTime)` - spúšťa sa každý frame
- `_triggerRupture(trap, stress, deltaTime)` - interný trigger pri prekročení thresholdu

**Wiring:**
- Číta: `StandingWaveOscillationTrapSystem.oscillationTraps` → trap state (amplitude, reflectionCount)
- Číta: `InfluenceReflectionBackPressureSystem` (optional)
- Číta: `node.userData.metrics.corruption`, `node.userData.metrics.instability`
- Zapisuje: `link.userData.visualTear`, `node.userData.visualDestabilization`, `link.userData.visualCoherenceLoss`
- Visualy: Red stress zones, orange rupture bursts, purple scars
- Propagation: Energy pulses po network topology s decay per hop
- Scars: Visual memory na links (60s fade)

**Rupture Conditions:**
- `stress > threshold` (threshold = 0.85 - corruption*0.4 - instability*0.3)
- `amplitude > 0.9`
- `trap lifetime > 1.0s`

---

## 3. CascadingRuptureSystem.js
**Popis:** Visualizuje kaskádu rupture energie propagujúcej sa cez regióny siete.

**Trigger Event:**
- `update(deltaTime, time, ruptureSystem, harmonySystem)` - každý frame
- `initiateCascade(originNode, time)` - spustenie kaskády
- `propagateCascade(cascade, time)` - propagation hops

**Wiring:**
- Číta: `NodeLinkingSystem.getNodeLinks(node)`
- Číta: `node.userData.metrics.corruption`, `node.userData.metrics.stability`
- Zapisuje: `link.userData.visualTear`, `node.userData.visualDestabilization`, `link.userData.visualCoherenceLoss`
- Events: `onCascadeStart`, `onCascadeHop`, `onCascadeComplete`, `onNodeCritical`
- Visualy: Spatial tearing, phase destabilization, coherence loss

**Cascade Detection:**
- Corruption > 0.35 na connected links
- Stability < 0.4
- Base cascade chance: 15%
- Max cascade depth: 3 hops
- Energy decay: 35% per hop

---

## 4. HarmonicHubAuraSystem_Session126.js
**Popis:** Synchronizované resonance fields pre harmonic hubs - phase synchronization, wave interaction, fragment deformation.

**Trigger Event:**
- `update(deltaTime)` - každý frame
- `triggerCascade({hubId, intensity, type})` - manuálny trigger
- `handleHarmonyResonance(payload)` - odpoveď na semantic event

**Wiring:**
- Číta: `node.userData.metrics.harmony`, `node.userData.metrics.corruption`, `node.userData.metrics.synergy`
- Číta: `node.userData.instability` → modifikuje phase offsets
- Číta: `LinkResonanceSystem.globalPulses` → wave interactions
- Eventy: Subscribes na `semanticBus.subscribe('event:harmonyResonance')`
- Emits: `semanticBus.emit('harmonic.cascade.start')`

**Instability Effects:**
- `instabilityPhaseOffsets: 0.1` → jitter v phase sync
- Phase state: `phaseState.offset += (Math.random() - 0.5) * instability * instabilityPhaseOffsets`

---

## 5. CriticalNodeFailureSystem.js
**Popis:** Detekuje nodes kritického zlyhania - countdown period, link severing, isolated state.

**Trigger Event:**
- `update(deltaTime, time)` - každý frame
- `detectCriticalNodes(time)` - periodická detekcia každých 250ms
- `triggerNodeFailure(failureState, time)` - pri vypršaní countdownu

**Wiring:**
- Číta: `node.userData.metrics.stability`, `node.userData.metrics.corruption`
- Zapisuje: `node.userData.failureCountdown`, `node.userData.countdownRemaining`
- Zapisuje: `node.userData.stressVisualIntensity`, `link.userData.visualStrain`
- Zapisuje: `node.userData.isolated`, `link.userData.severed`
- Events: `onFailureCountdownStart`, `onLinksSevered`, `onNodeIsolated`

**Failure Conditions:**
- `stability <= 0.2` (20%)
- `corruption >= 0.75` (75%)
- `!isHealing`
- `activeLinks > 0`

**Failure Countdown:**
- 3-second warning period
- Stress pulse: 4Hz frequency, 2x intensity multiplier
- Link strain: 0.8 intensity, 6Hz oscillation
- After countdown: ALL links sever simultaneously

---

## 6. HarmonyStabilizationIntegrationPatch_v1.js
**Popis:** Integration patch pre HarmonyStabilizationSystem - wiring do AINodes, link system.

**Trigger Event:**
- `patchAINodes(aiNodesInstance, linkSystemInstance, debugMode)` - inicializácia
- `updateGameLoop(aiNodes, deltaTime)` - game loop integration
- `triggerHarmonyPulse(node, radius, intensity)` - pulse trigger

**Wiring:**
- Číta/Zapisuje: `AINodes.harmonySystem` → main system instance
- Číta/Zapisuje: `AINodes.updateNodeHarmony(deltaTime)` - call v main loop
- Zapisuje: `Node.userData.harmonyLevel` (0-1)
- Zapisuje: `Node.userData.harmonyVisualState` - visual parameters
- Zapisuje: `Link.userData.harmonyLevel` (0-1)
- Methods: `setNodeHarmonyLevel`, `setLinkHarmonyLevel`, `triggerHarmonyPulse`

---

## Zhrnutie Integration Points

### Shared Metrics Sources:
- `CoreMetricsCalculator.getMetrics()` - primary source pre stability, corruption, synergy
- `node.userData.metrics.{stability,corruption,harmony,synergy,instability}`

### Visual Output Targets:
- `link.userData.visual{Tear,Strain,CoherenceLoss}`
- `node.userData.visual{Destabilization, stressIntensity}`
- `node.userData.stress{PulseRate,PulsePhase,Intensity}`
- `scene.fog.color` - ambient stress color shift

### Event Bus:
- `semanticBus.subscribe('event:harmonyResonance')`
- `semanticBus.emit('harmonic.cascade.start')`

### System Chain:
1. Metrics calculated (CoreMetricsCalculator)
2. Stress detected (StressVisualShaderSystem)
3. Standing waves accumulate stress (ResonanceRuptureVisualSystem)
4. Rupture triggers cascade (CascadingRuptureSystem)
5. Critical nodes enter failure countdown (CriticalNodeFailureSystem)
6. Links sever, nodes isolated
7. Harmony system attempts stabilization (HarmonyStabilizationIntegrationPatch)