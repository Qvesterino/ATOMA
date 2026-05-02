# FX Contract Audit Script — Design Plan

**Script:** `ai tools (python)/vfx_contract_audit.py`
**Purpose:** Static analysis of all ATOMA FX files against the 9-point contract from `contract.fx.md`
**Output:** Per-file report with category, owner, trigger, gate, risk, and verdict (KEEP/FIX/ISOLATE/KILL)

---

## Architecture

```
vfx_contract_audit.py
├── FXFileScanner        — finds all FX JS files in workspace
├── ContractChecker      — runs 9-point checks on each file
├── CategoryDetector     — classifies FX type (link/node/env/wave/particle/shader)
├── RiskAssessor         — computes risk level (LOW/MID/HIGH)
├── VerdictEngine        — produces final verdict per file
└── ReportGenerator      — outputs markdown + JSON reports
```

---

## Scan Target: FX File Detection

The script scans the workspace root for `.js` files matching these patterns:

### Explicit FX file list (known FX systems)
```
_AdaptiveGlyphRendering1_0.js
_AiEmotionalFeed3_1.js
_AINarrativePatterns6_0.js
_AIThoughtStorms2_0.js
_AmbientEntityManager.js
_AtomaGlyphSystem4_0.js
AIConsciousnessLayer.js
ArchetypeShaderModes_v1.js
CanonicalGeometryFamilies_v1.js
CanonicalTemplate3_StressVisuals.js
CascadeBurstVisual_Session147.js
CascadeEventBridge_v1.js
CascadeParticleSystem_Session120.js
CascadeResonanceWaveVisualization_Session146.js
CascadeSystemConsoleAPI.js
CascadeToWaveBridge_v1.js
CascadeWaveParticles.js
CascadingRuptureSystem.js
CinematicUpgrade.js
CognitiveHorizonPlane.js
ColonyVFXManager.js
CompositeGlyphGenerator.js
CompositeGlyphResonanceFeedback.js
CoreHologramShader.js
CorruptionVisualFX_v1.js
CriticalNodeFailureSystem.js
DistanceLODController.js
DreamDepthEffectManager.js
EchoRippleIntegrationPatch_Session125.js
EchoRippleSystem_Session125.js
EnergyVisualProfile.js
EnhancedNodeModels.js
EnvironmentalHazards.js
EventVisualSuppression_v1.js
FireLikeAuraConfig.js
FresnelAuraIntegrationPatch.js
FresnelRimLightAuraShader.js
FXPerformanceController_v1.js
FXPerformanceSmoothTransition_v1.js
GlyphAnimationModulator.js
GlyphFusionZone.js
HarmonicAudioReactivitySystem_Session135.js
HarmonicCascadeAmplification_Session145.js
HarmonicHealingVisualSystem_Session134.js
HarmonicHubAuraSystem_Session126.js
HarmonicHubCascade.js
HarmonicHubLifecycle.js
HarmonicHubSync.js
HarmonicInfluencePropagationSystem_Session127.js
HarmonicNodeResonanceHalos.js
HarmonicRecoveryVisualSystem_Session138.js
HarmonicResonanceCoupling_v1.js
HarmonicResonanceFeedbackSystem.js
HarmonicTopologyLearningSystem.js
NeuralConvergenceSingularity.js
SafeQuantumIllusionsPack1.js
_SafeEvolutionManager.js
_SafeLegendaryLinkFX.js
_SafeLegendaryWorldEvents.js
_SafeAIWeatherPack.js
_SafeWorldFXPack.js
SynergyCascadeVisualizer.js
T2_CorruptionVisualIntegration_v1.js
T2_HarmonyVisualConsumer_v1.js
VisualUpgradeSuperpack.js
_LinkedGlyphMessaging3_0.js
_LinkedGlyphSynchronization1_0.js
_RecursiveGlyphMessaging4_0.js
_ProceduralMeaningEngine.js
_NodeVisualBootstrap3_0.js
_ExtremeAIShaderPack.js
_EmergentThoughtStorms5_0.js
_GlyphFusionOverlay4_1.js
PHASE5_CascadeVisuals.js
TIER4_CorruptionFeedbackVisuals_v1.js
_GlyphLayer4_MultiFusion.js
_SemanticGlyphAI.js
```

### Auto-detection heuristic
Any `.js` file containing `export class` AND at least one of:
- `THREE.Mesh`, `THREE.Line`, `THREE.Points`, `THREE.Group`
- `ShaderMaterial`, `MeshBasicMaterial`, `MeshStandardMaterial`
- `scene.add`, `scene.remove`
- `.dispose()`

---

## 9-Point Contract Checks (Static Regex)

### 1. PURPOSE
**Check:** File has class-level JSDoc or comment block describing what it does.
**Regex:** `/\*\*[\s\S]*?(visual|effect|vfx|fx|overlay|particle|shader|cascade|wave|aura|glow)/i`
**Pass:** Comment block found with descriptive keywords
**Fail:** No purpose documentation

### 2. OWNER
**Check:** File references one of the known owner systems.
**Regex patterns:**
- `EnvironmentDomainController` → owner = EnvironmentDomainController
- `LinkRendererConduit` → owner = LinkRendererConduit
- `main\.js` import → owner = main
- `FrameScheduler` → owner = FrameScheduler
- `SemanticBus` / `semanticBus` → owner = SemanticBus
- Constructor accepts `scene` → owner = scene-based
**Cross-reference:** Also check `main.js` and `EnvironmentDomainController.js` for `new ClassName(`

### 3. TRIGGER
**Check:** What causes the FX to activate.
**Regex patterns:**
- `\.on\(` / `addEventListener` / `subscribe` → event trigger
- `synergy|harmony|stability|corruption|loadPressure` → metric trigger
- `link\.` / `linkId` → link state trigger
- `node\.` / `nodeId` → node state trigger
- `worldState|atmosphereState|weatherState` → environment trigger
- `update\(deltaTime` → per-frame trigger (always-on)

### 4. GATE
**Check:** Conditions that prevent execution.
**Regex patterns:**
- `this\.enabled` / `this\.disabled` / `setEnabled` → enabled flag
- `frameScheduler` / `shouldRunVisual` / `shouldRunSimulation` → scheduler gate
- `LOD` / `distance` / `farDistance` → LOD gate
- `cooldown` / `lastTime` / `interval` → cooldown gate
- `!this\.\w+` early return → null guard
**Critical anti-pattern:** `!this.frameScheduler?.shouldRunVisual?.()` on undefined → always blocks (the bug we fixed)

### 5. UPDATE
**Check:** Has `update(` method that checks for active targets.
**Regex:** `update\s*\(` method exists
**Sub-checks:**
- Returns early if no active work → ✅
- Runs unconditionally → ⚠️
- No update method at all → check if event-driven only

### 6. BUDGET
**Check:** Has caps on resource usage.
**Regex patterns:**
- `maxParticles|maxCount|pool.*size|cap|limit` → explicit budget
- `MAX_` constant → budget constant
- No budget keywords → ⚠️ no budget

### 7. LIFETIME
**Check:** How effects end.
**Regex patterns:**
- `TTL|lifetime|duration|maxAge|age` → TTL-based
- `fadeOut|dissolve|despawn` → fade-out
- `pool.*release|returnToPool|recycle` → pool release
- `removeFromScene|scene\.remove` → explicit cleanup

### 8. DISPOSE
**Check:** Has `dispose()` method.
**Regex:** `dispose\s*\(\)` method exists
**Sub-checks:**
- Removes from scene → `scene\.remove`
- Disposes geometry → `\.geometry\.dispose|geometry\.dispose`
- Disposes material → `\.material\.dispose|material\.dispose`
- Clears maps/sets → `\.clear\(\)`
- Removes event listeners → `removeEventListener|unsubscribe|off\(`

### 9. DEBUG FLAG
**Check:** No console spam without guard.
**Regex patterns:**
- `console\.(log|warn|error)` count vs `debugMode|this\.debug|DEBUG` guard count
- If console calls > 3 AND no debug flag → ❌
- If all console calls wrapped in debug check → ✅

---

## Category Detection

| Category | Detection Heuristics |
|---|---|
| **LINK FX** | `linkId`, `link\.source`, `link\.target`, `linkingSystem`, `LinkFX` in filename |
| **NODE FX** | `nodeId`, `node\.position`, `node\.userData`, `NodeFX` in filename, `registerNode` |
| **ENVIRONMENT FX** | `worldRoot`, `environmentRoot`, `WORLD_OVERLAY`, `WORLD_BACKGROUND`, `Environment` in filename |
| **CASCADE/WAVE** | `Cascade`, `Wave`, `Resonance`, `Rupture`, `Burst` in filename/class |
| **PARTICLE FX** | `THREE.Points`, `ParticleSystem`, `Particle`, `spawnCount`, `pool` |
| **SHADER/MATERIAL** | `ShaderMaterial`, `onBeforeCompile`, `uniforms`, `vertexShader`, `fragmentShader` |

---

## Risk Assessment

| Factor | Score |
|---|---|
| No `dispose()` | +3 HIGH |
| No gate in `update()` | +2 MID |
| Unbounded spawn (no pool/cap) | +2 MID |
| Console spam without debug flag | +1 LOW |
| No enabled flag | +1 LOW |
| Missing FrameScheduler integration | +1 LOW |
| References deprecated API | +2 MID |
| Known glitch source (shell/dust pattern) | +3 HIGH |

**Risk Level:**
- 0-1: LOW
- 2-3: MID
- 4+: HIGH

---

## Verdict Engine

| Condition | Verdict |
|---|---|
| All 9 checks pass | **KEEP** |
| 1-2 checks fail, risk LOW-MID | **FIX** (small intervention) |
| 3+ checks fail, risk MID | **ISOLATE** (needs isolation before fix) |
| No dispose, no gate, unbounded, risk HIGH | **KILL** (remove or full rewrite) |

---

## Output Format

### Console Output
```
=== FX CONTRACT AUDIT ===
Scanning 75 FX files...

┌──────────────────────────────────────────────────────────────┐
│ FILE: _AdaptiveGlyphRendering1_0.js                         │
│ Category: NODE FX                                           │
│ Owner: main.js                                              │
│ Trigger: node state (semantic data changes)                 │
│ Risk: LOW                                                   │
│ Verdict: KEEP                                               │
├──────────────────────────────────────────────────────────────┤
│ PURPOSE: ✅  OWNER: ✅  TRIGGER: ✅  GATE: ✅              │
│ UPDATE: ✅  BUDGET: ✅  LIFETIME: ✅  DISPOSE: ✅          │
│ DEBUG: ✅                                                   │
└──────────────────────────────────────────────────────────────┘

...

SUMMARY:
  KEEP:    42 files
  FIX:     18 files
  ISOLATE:  8 files
  KILL:     3 files
```

### Markdown Report (`docs/maj/FX_CONTRACT_AUDIT_REPORT.md`)
Full table with all columns + per-file details.

### JSON Report (`docs/maj/FX_CONTRACT_AUDIT_DATA.json`)
Machine-readable for downstream tooling.

---

## Implementation Steps

1. Create `ai tools (python)/vfx_contract_audit.py`
2. Implement `FXFileScanner` — finds all FX files
3. Implement `ContractChecker` — 9 regex-based checks per file
4. Implement `CategoryDetector` — classifies FX type
5. Implement `RiskAssessor` — computes risk score
6. Implement `VerdictEngine` — KEEP/FIX/ISOLATE/KILL
7. Implement `ReportGenerator` — console + markdown + JSON output
8. Cross-reference `main.js` and `EnvironmentDomainController.js` for owner detection
9. Test on known files (the ones we already audited manually)
10. Run full scan and generate report
