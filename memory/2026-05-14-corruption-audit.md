## 2026-05-14 — FÁZA 8: Global Audit Efektov (bus.on / bus.emit / priame metric čítanie)

### Metodológia
3 paralelné search queries cez celý projekt:
1. `\.on\(|\.subscribe\(` — všetky event subscriptions
2. `\.emit\(` — všetky event emissions
3. `userData\.metrics` — všetky priame čítania metrik

Výsledky: **39 subscriptions**, **66 emissions**, **243 priamych čítaní metrik**

---

### KATEGÓRIA A: Efekty, ktoré UŽ používajú canonical tiered eventy ✅

| Súbor | Subscribe | Emit | Stav |
|---|---|---|---|
| `main.js` | `node.synergy.high`, `synergy.fade`, `dramaturgy.phase`, `lore.unlocked`, `link.created`, `network.link.destroyed`, `camera.motion`, `node.selection`, `cascade.start/hop/end` | `node.spawned`, `link:synergyThreshold`, `link:harmonicLock`, `network.link.destroyed`, `world.loaded`, `synergy.fade`, `metrics.spike`, `camera.motion`, `hud.visibility.change`, `ritual.autoTriggered`, `node.selection`, `node:selected`, `node.click`, `game:won` | OK — orchestrator |
| `MetricsRuntime_v1.js` | `link.created`, `link.removed` | `metric.tier.changed`, `global.*.high/mid/low`, `node.metric.updated`, `metric.corruption.spread`, `link.corruption.spread`, `event:synergyCascade`, `event:harmonyResonance`, `event:corruptionOutbreak`, `event:loadCollapse`, `event:instabilityTrap` | OK — canonical writer |
| `src/metrics/NodeMetricEngine.js` | — | `node.metric.updated`, `metric.tier.changed`, `metric.synergy.burst`, `metric.corruption.spike`, `node.*.high/mid/low` | OK — canonical writer |
| `harmony/HarmonicHubAuraSystem_Session126.js` | — | `metric.tier.changed`, `hub.harmony.high/mid/low`, `harmonic.cascade.start` | OK — hub writer + emitter |
| `HarmonyStabilization.js` | — | corruption tiered eventy (canonical writer) | OK — writer |
| `CascadeEventBridge_v1.js` | `node.corruption.high` | `cascade.start`, `cascade.end`, `cascade.hop` | OK — bridge |
| `EnvironmentalHazards.js` | `global.corruption.high` | `environment.hazard.residueScar` | OK — hazard system |
| `Engine/Debug/EventFrequencyAudit.js` | `node.selection`, `link.created`, `network.link.destroyed`, `node.synergy.high` | — | OK — debug only |
| `harmony/HarmonicHealingRecoveryVisualSystem.js` | `link.harmony.high/mid/low`, `link.corruption.high`, `link.stability.low/mid`, `node.corruption.high`, `node.stability.low` | `topology.healing` | OK — hybrid (event trigger + per-frame read) |
| `HealingParticleSystem_Session136.js` | `node.harmony.high`, `link.harmony.high` | — | OK — event-driven |
| `HarmonicAudioReactivitySystem_Session135.js` | `global.harmony.high/mid/low`, `node.harmony.high`, `link.corruption.high` | — | OK — event-driven |
| `CascadingRuptureSystem.js` | `node.corruption.high/mid/low` (nové) | `topology.rupture` | OK — hybrid (nové canonical triggers) |
| `LinkCorruptionTransmission_v1.js` | `link.corruption.high/mid/low`, `node.corruption.high/mid` (nové) | `metric:corruptionRise`, `topology.healing` | OK — hybrid (nové canonical triggers) |
| `EventDramaturgyEngine.js` | `global.corruption.high/mid/low` (nové), `cascade.start`, `cascade.end` | `dramaturgy.sequence.start`, `dramaturgy.sequence.end`, `dramaturgy.phase` | OK — dramaturgy engine |
| `T2_CorruptionVisualIntegration_v1.js` | `node.corruption.high` (bare bus.on!) | — | ⚠️ VIOLATION — bez EventRegistrationRegistry |

---

### KATEGÓRIA B: Efekty bez canonical event subscription (IBA tick-based / polling-only) ⚠️

Tieto efekty čítajú `node.userData.metrics.*` priamo v `update()` / `tick()` bez toho, aby počúvali na canonical tiered eventy. Pre continuous modulation (farba, intenzita) je to legitímne, ale pre **spúšťanie efektov** (burst, flash, zmena stavu) by mali ma�� event trigger.

#### B1: Corruption vizuály (bez event triggeru)
| Súbor | Čo číta | Potrebný canonical trigger |
|---|---|---|
| `CorruptionVisualFX_v1.js` | `node.userData.metrics.corruption`, `link.userData.metrics.corruption` | `node.corruption.high/mid/low`, `link.corruption.high/mid/low` |
| `TIER4_CorruptionFeedbackVisuals_v1.js` | `link.userData.metrics.corruption` | `link.corruption.high/mid/low` |
| `LinkCorruptionParticleSystem.js` | `link.userData.metrics.corruption`, `node.userData.metrics.corruption` | `link.corruption.high/mid/low`, `node.corruption.high` |
| `LinkCorruptionSpreadAnimator.js` | `link.userData.metrics.corruption` | `link.corruption.high/mid/low` |
| `NodeLinkedAuraSystem.js` | `node.userData.metrics.corruption`, `harmony` | `node.corruption/harmony.high/mid/low` |
| `PHASE5_CorruptionBridge_v1.js` | `node.userData.metrics.corruption` | `node.corruption.high/mid/low` |
| `ResonanceRuptureVisualSystem_Session133.js` | — | emituje `topology.rupture` (non-canonical) |

#### B2: Harmony / Synergy vizuály (bez event triggeru)
| Súbor | Čo číta | Potrebný canonical trigger |
|---|---|---|
| `T2_HarmonyVisualConsumer_v1.js` | `node.userData.metrics.harmony` | `node.harmony.high/mid/low` |
| `CascadeResonanceWaveVisualization_Session146.js` | `node.userData.metrics.harmony` | `node.harmony.high/mid/low` |
| `LinkCascadePulseManager.js` | `link.userData.metrics.harmony`, `synergy` | `link.harmony/synergy.high/mid/low` |
| `LinkTrailParticleSystem.js` | `link.userData.metrics.harmony`, `corruption` | `link.harmony/corruption.high/mid/low` |
| `WaveInterferencePatternSystem_Session132.js` | `link.userData.metrics.synergy`, `harmony` | `link.synergy/harmony.high/mid/low` |
| `RegionalHarmonyZones.js` | `node.userData.metrics.synergy`, `harmony` | `node.synergy/harmony.high/mid/low` |
| `PulseBoundaryInteractionAdapter_v1.js` | `node.userData.metrics.harmony`, `stability` | `node.harmony/stability.high/mid/low` |
| `harmony/HarmonicResonanceFeedbackSystem.js` | `link.userData.metrics.harmony` | `link.harmony.high/mid/low` |
| `InfluenceAttenuationAbsorptionSystem_Session128.js` | `node.userData.metrics.harmony` | `node.harmony.high/mid/low` |
| `CascadeParticleSystem_Session120.js` | `link.userData.metrics.synergy`, `node.userData.metrics.corruption` | `link.synergy.high/mid/low`, `node.corruption.high` |

#### B3: Stability / LoadPressure vizuály
| Súbor | Čo číta | Potrebný canonical trigger |
|---|---|---|
| `WaveParticleEmitter_v1.js` | `node.userData.metrics.stability`, `synergy` | `node.stability.low`, `node.synergy.high` |
| `CriticalNodeFailureSystem.js` | `node.userData.metrics.stability`, `corruption` | `node.stability.low`, `node.corruption.high` |
| `LinkCollapseSystem.js` | `link.userData.metrics.corruption`, `stability`, `instability`, `loadPressure` | `link.corruption/stability.high/mid/low` |
| `SystemStateOverlay.js` | `metrics.harmony`, `synergy`, `corruption` (aggregated) | `global.harmony/synergy/corruption.high/mid/low` |

#### B4: Glyph / Shader vizuály (čítajú priamo z metrics)
| Súbor | Čo číta |
|---|---|
| `_AdaptiveGlyphRendering1_0.js` | `node.userData.metrics.synergy`, `harmony`, `corruption`, `stability`, `loadPressure` |
| `_AtomaGlyphSystem4_0.js` | `node.userData.metrics.synergy`, `stability`, `harmony`, `corruption`, `loadPressure` |
| `_ExtremeAIShaderPack.js` | `node.userData.metrics` (všetky) |
| `_GlyphLayer4_MultiFusion.js` | `node.userData.metrics.harmony`, `corruption`, `synergy`, `stability` |
| `_RecursiveGlyphMessaging4_0.js` | `chain.userData.metrics.stability` |
| `_SemanticGlyphAI.js` | `userData.metrics.stability` |
| `SafeMetricsFX1_1.js` | `node.userData.metrics` (všetky) |

---

### KATEGÓRIA C: Non-canonical event emissions (potrebujú canonical upgrade?) ⚠️

| Súbor | Non-canonical emit | Návrh |
|---|---|---|
| `CascadingRuptureSystem.js` | `topology.rupture` | Ponechať — cascade bridge event |
| `LinkCorruptionTransmission_v1.js` | `metric:corruptionRise`, `topology.healing` | `metric:corruptionRise` → zvážiť `node.corruption.high`? `topology.healing` — ponechať ako bridge |
| `ResonanceRuptureVisualSystem_Session133.js` | `topology.rupture` | Ponechať — visual bridge |
| `harmony/HarmonicHealingRecoveryVisualSystem.js` | `topology.healing` | Ponechať — healing bridge |
| `MetricsRuntime_v1.js` | `event:synergyCascade`, `event:harmonyResonance`, `event:corruptionOutbreak`, `event:loadCollapse`, `event:instabilityTrap` | Tieto sú **legacy composite eventy**. Môžu byť nahradené canonical `global.*.high` tiered eventy? |
| `main.js` | `link:synergyThreshold`, `link:harmonicLock` | Legacy link eventy — ponechať alebo zvážiť canonical `link.synergy.high`? |
| `NodeLinkingSystem.js` | `link:collapsed` | Legacy — ponechať alebo `link.stability.low`? |
| `TopologyBiasVisualizationLayer.js` | `topology.bias.snapshot` | Diagnostic — ponechať |

---

### KATEGÓRIA D: Legitímne metric writers / core systems (nie sú efekty)

Tieto systémy MUSIA čítať a písať `node.userData.metrics` priamo — sú to zdroje pravdy:

- `MetricsRuntime_v1.js` — canonical metric writer
- `src/metrics/NodeMetricEngine.js` — node metric engine
- `NodeLinkingSystem.js` — core linking system
- `CoreMetricsCalculator.js` — metric calculator
- `SafeMetricsDNAIntegration1_0.js` — metric initializer
- `LinkSemanticMetricsBridge_v1.js` — bridge
- `MetricInterpretationLayer_v1.js` — interpretation
- `PHASE5_MultiNetworkCore.js` — network core
- `NetworkRituals_v1.js` — ritual system (modifies harmony)
- `SynapticFatigueAdapter_v1.js` — fatigue system
- `SynapticGatingAdapter_v1.js` — gating system
- `SignatureMomentDirector.js` — director (číta pre rozhodovanie)

---

### ZÁVER

**Počet efektov, ktoré by mohli profitovať z canonical event triggerov:** ~25 visual/glyph/shader systémov

**Najvyššia priorita na upgrade:**
1. `CorruptionVisualFX_v1.js` — hlavný corruption visual, nemá žiadny event trigger
2. `TIER4_CorruptionFeedbackVisuals_v1.js` — tier4 corruption feedback, iba tick-based
3. `T2_CorruptionVisualIntegration_v1.js` — má `node.corruption.high` ale bez EventRegistrationRegistry
4. `SystemStateOverlay.js` — global overlay, mohol by reagovať na `global.*.high/mid/low`
5. `CriticalNodeFailureSystem.js` — gameplay-critical, iba tick-based polling

**Continuous modulation vs Event triggers:**
- Continuous modulation (farba, intenzita, shader uniform) = legitímne tick-based metric čítanie
- Event triggers (burst, flash, state change, cascade) = MALI BY byť canonical event-driven
- Mnohé efekty v KATEGÓRII B nemajú žiadny event trigger — spoliehajú sa IBA na polling
