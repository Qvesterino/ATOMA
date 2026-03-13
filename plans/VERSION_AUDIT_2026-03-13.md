# ATOMA Version Audit - 2026-03-13

## Cieľ
Identifikovať všetky verzionované súbory, určiť ich stav (active/dormant/legacy), a navrhnúť cleanup.

---

## Zistené verzie súborov

### Skupina 1: ComputeSynergyScore
| Súbor | Stav | Poznámka |
|-------|------|----------|
| `ComputeSynergyScore2_0.js` | ? | 19222 chars |
| `ComputeSynergyScore2_1.js` | ACTIVE | 12651 chars - importuje 2_0 |

**Analýza:** `2_1` importuje `computeSynergyScore` z `2_0` - obe sú aktívne.

---

### Skupina 2: LinkAutomationMonitor
| Súbor | Stav | Poznámka |
|-------|------|----------|
| `LinkAutomationMonitor2_0.js` | ? | 29337 chars |
| `LinkAutomationMonitor3_0.js` | ? | 19192 chars |
| `LinkAutomationMonitorHUD2_0.js` | ? | 15159 chars |

**Analýza:** Potrebné overiť, ktorá verzia je používaná v main.js.

---

### Skupina 3: ArchetypeVisualTransitionEngine
| Súbor | Stav | Poznámka |
|-------|------|----------|
| `ArchetypeVisualTransitionEngine_v2.js` | ACTIVE | 12061 chars |

**Analýza:** Používané v `ArchetypeVisualDifferentiationSystem_v1.js`.

---

### Skupina 4: DreamDesert Maps
| Súbor | Stav | Poznámka |
|-------|------|----------|
| `DreamDesert.js` | ? | 19201 chars |
| `DreamDesert2.js` | ? | 25470 chars |

**Analýza:** Dve verzie mapy - potrebné overiť, ktorá je aktívna.

---

### Skupina 5: LinkGlowSynergyEngine
| Súbor | Stav | Poznámka |
|-------|------|----------|
| `LinkGlowSynergyEngine1_0.js` | ? | 15273 chars |
| `LinkGlowSynergyEngine_v2.js` | ? | 12202 chars |

**Analýza:** Dva naming conventions (1_0 vs _v2) - potrebné zistiť, ktorý je aktívny.

---

### Skupina 6: Session-based files (Harmonic/Cascade systems)
| Súbor | Session | Stav |
|-------|---------|------|
| `CascadeParticleEmissionBoost_Session118.js` | 118 | ? |
| `CascadeParticleColorTinting_Session119.js` | 119 | ? |
| `CascadeParticleSystem_Session120.js` | 120 | ACTIVE (imported in FXDebugSandbox) |
| `CascadeResonanceWaveVisualization_Session146.js` | 146 | ? |
| `HarmonicHubAuraSystem_Session126.js` | 126 | ? |
| `HarmonicInfluencePropagationSystem_Session127.js` | 127 | ? |
| `InfluenceReflectionBackPressureSystem_Session129.js` | 129 | ? |
| `StandingWaveOscillationTrapSystem_Session130.js` | 130 | ACTIVE (imported in FXDebugSandbox) |
| `StandingWaveVisualRenderer_Session131.js` | 131 | ACTIVE (imported in FXDebugSandbox) |
| `WaveInterferencePatternSystem_Session132.js` | 132 | ACTIVE (imported in FXDebugSandbox) |
| `HarmonicHealingVisualSystem_Session134.js` | 134 | ? |
| `HarmonicAudioReactivitySystem_Session135.js` | 135 | ? |
| `HealingParticleSystem_Session136.js` | 136 | ACTIVE (imported in FXDebugSandbox) |
| `HarmonicRecoveryVisualSystem_Session138.js` | 138 | ? |
| `HarmonicCascadeAmplification_Session145.js` | 145 | ? |
| `HarmonicPhaseSynchronization_Session146.js` | 146 | ? |

---

### Skupina 7: Enhanced Variants (Atoma_nodes/)
| Súbor | Session | Stav |
|-------|---------|------|
| `AnalyticsEnhancedVariants_Session81.js` | 81 | ACTIVE (imported in EnhancedNodeModels) |
| `StorageEnhancedVariants_Session81.js` | 81 | ACTIVE (imported in EnhancedNodeModels) |
| `ProcessEnhancedVariants_Session81.js` | 81 | ACTIVE (imported in EnhancedNodeModels) |
| `IntegrationEnhancedVariants_Session110.js` | 110 | ACTIVE (imported in EnhancedNodeModels) |
| `ControlEnhancedVariants_Session83.js` | 83 | ACTIVE (imported in EnhancedNodeModels) |
| `ControlSpineVariants_Session100.js` | 100 | ACTIVE (imported in EnhancedNodeModels) |
| `InputSensoryEnhanced_Session111.js` | 111 | ACTIVE (imported in EnhancedNodeModels) |
| `ControlNodeSpecialGoverners_Session114.js` | 114 | ACTIVE (imported in EnhancedNodeModels) |
| `StorageNodesVisual_Session116.js` | 116 | ACTIVE (imported in EnhancedNodeModels) |

---

### Skupina 8: _v1 Systems (Root directory)
| Súbor | Stav | Kategória |
|-------|------|-----------|
| `AdaptivePerformanceMonitor_v1.js` | ? | Performance |
| `ArchetypeAscensionCurves_v1.js` | ACTIVE | Archetype |
| `ArchetypeAuraEnhancement_v1.js` | ACTIVE | Archetype |
| `ArchetypeColorPaletteSystem_v1.js` | ACTIVE | Archetype |
| `ArchetypeGameplayEffects_v1.js` | ACTIVE | Archetype |
| `ArchetypeNeuralLinkVis_v1.js` | ACTIVE | Archetype |
| `ArchetypeShaderModes_v1.js` | ACTIVE | Archetype |
| `ArchetypeVisualDifferentiationSystem_v1.js` | ACTIVE | Archetype |
| `ArchetypeVisualIntegrationPatch_v1.js` | ACTIVE | Archetype |
| `ArchetypeVisualIntegrationPatch_v1_GAMEPLAY.js` | ACTIVE | Archetype |
| `ArchetypeVisualProfiles_v1.js` | ACTIVE | Archetype |
| `AuraModulationIntegration_v1.js` | ? | Aura |
| `CanonicalGeometryFamilies_v1.js` | ACTIVE | Geometry |
| `CompetitionDominanceAdapter_v1.js` | ? | Gameplay |
| `ControlledUnfreezeSystem_v1.js` | ? | System |
| `ControlNodeGeometries_v1.js` | ? | Geometry |
| `CorruptionVisualFX_v1.js` | ACTIVE | Visual |
| `CorruptionVisualIntegrationPatch_v1.js` | ACTIVE | Visual |
| `DefensiveHardeningPatch_v1.js` | ? | Safety |
| `EventVisualSuppression_v1.js` | ? | Visual |
| `ForceNodeOpaqueBodySystem_v1.js` | ? | Visual |
| `FrameUpdateLoopOrderValidator_v1.js` | ? | Debug |
| `FXPerformanceController_v1.js` | ACTIVE | Performance |
| `FXPerformanceScaler_v1.js` | ACTIVE | Performance |
| `FXPerformanceSmoothTransition_v1.js` | ACTIVE | Performance |
| `FXRuntime_v1.js` | ACTIVE | Runtime |
| `HarmonicResonanceCoupling_v1.js` | ACTIVE | Harmonic |
| `HarmonyStabilizationSystem_v1.js` | ACTIVE | Harmony |
| `HarmonyStabilizationIntegrationPatch_v1.js` | ACTIVE | Harmony |
| `InputRuntime_v1.js` | ACTIVE | Input |
| `InputSensoryGeometries_v1.js` | ? | Input |
| `LinkEligibilityGate_v1.js` | ? | Link |
| `LinkDebugMode_v1.js` | ? | Debug |

---

### Skupina 9: LEGACY Directory
| Súbor | Stav |
|-------|------|
| `LEGACY/_ExtremeLinkVisualPack3.js` | LEGACY |
| `LEGACY/_ExtremeLinkVisuals4_0.js` | LEGACY |
| `LEGACY/_NeuralCurveLinkVisuals.js` | LEGACY |
| `LEGACY/_UISelectedNodeTopBar3_4.js` | LEGACY |
| `LEGACY/HOTFIX_EmergencyVisualStabilization_v1.js` | LEGACY |
| `LEGACY/SpawnerConsolidationDetector_v1.js` | LEGACY |
| `LEGACY/aura/*` | LEGACY |
| `LEGACY/GRAVEYARD/*` | LEGACY |

---

### Skupina 10: src/legacy Directory
| Súbor | Stav |
|-------|------|
| `src/legacy/_NodeLinking2_3.js` | LEGACY |
| `src/legacy/NodeGrouping.js` | LEGACY |
| `src/legacy/T2_HarmonyVisualConsumer_v1.js` | LEGACY |

---

## Naming Convention Issues

### Zistené problémy:
1. **Mix konvencií:**
   - `_v1`, `_v2` (underscore prefix)
   - `1_0`, `2_0`, `3_0` (underscore suffix)
   - `_SessionXXX` (session-based)
   
2. **Príklady inconsistency:**
   - `LinkGlowSynergyEngine1_0.js` vs `LinkGlowSynergyEngine_v2.js`
   - `HudCollapseSystem1_0.js` vs `FXRuntime_v1.js`

---

## Odporúčané akcie

### 1. HIGH PRIORITY - Overenie aktívnych verzii
- [ ] Overiť, či `LinkAutomationMonitor2_0` alebo `3_0` je aktívna
- [ ] Overiť, či `DreamDesert.js` alebo `DreamDesert2.js` je aktívna
- [ ] Overiť, či `LinkGlowSynergyEngine1_0` alebo `_v2` je aktívna

### 2. MEDIUM PRIORITY - Session files audit
- [ ] Identifikovať, ktoré Session súbory sú importované v main.js
- [ ] Presunúť nepoužívané Session súbory do LEGACY

### 3. LOW PRIORITY - Naming standardization
- [ ] Navrhnúť jednotnú konvenciu pre verzionovanie
- [ ] Preferovaný formát: `SystemName_v1.js` alebo `SystemName_v1.0.js`

---

## Ďalšie kroky

1. **Analyzovať main.js** - zistiť, ktoré súbory sú importované
2. **Greppovať importy** - nájsť všetky importy verzionovaných súborov
3. **Vytvoriť dependency graph** - vizualizovať vzťahy medzi verziami
4. **Navrhnúť migráciu** - plán na konsolidáciu duplicitných verzií

---

*Audit vytvorený: 2026-03-13*
*Stav: Preliminárny - potrebná verifikácia*

## Cieľ
Identifikovať všetky verzionované súbory, určiť ich stav (active/dormant/legacy), a navrhnúť cleanup.

---

## Zistené verzie súborov

### Skupina 1: ComputeSynergyScore
| Súbor | Stav | Poznámka |
|-------|------|----------|
| `ComputeSynergyScore2_0.js` | ? | 19222 chars |
| `ComputeSynergyScore2_1.js` | ACTIVE | 12651 chars - importuje 2_0 |

**Analýza:** `2_1` importuje `computeSynergyScore` z `2_0` - obe sú aktívne.

---

### Skupina 2: LinkAutomationMonitor
| Súbor | Stav | Poznámka |
|-------|------|----------|
| `LinkAutomationMonitor2_0.js` | ? | 29337 chars |
| `LinkAutomationMonitor3_0.js` | ? | 19192 chars |
| `LinkAutomationMonitorHUD2_0.js` | ? | 15159 chars |

**Analýza:** Potrebné overiť, ktorá verzia je používaná v main.js.

---

### Skupina 3: ArchetypeVisualTransitionEngine
| Súbor | Stav | Poznámka |
|-------|------|----------|
| `ArchetypeVisualTransitionEngine_v2.js` | ACTIVE | 12061 chars |

**Analýza:** Používané v `ArchetypeVisualDifferentiationSystem_v1.js`.

---

### Skupina 4: DreamDesert Maps
| Súbor | Stav | Poznámka |
|-------|------|----------|
| `DreamDesert.js` | ? | 19201 chars |
| `DreamDesert2.js` | ? | 25470 chars |

**Analýza:** Dve verzie mapy - potrebné overiť, ktorá je aktívna.

---

### Skupina 5: LinkGlowSynergyEngine
| Súbor | Stav | Poznámka |
|-------|------|----------|
| `LinkGlowSynergyEngine1_0.js` | ? | 15273 chars |
| `LinkGlowSynergyEngine_v2.js` | ? | 12202 chars |

**Analýza:** Dva naming conventions (1_0 vs _v2) - potrebné zistiť, ktorý je aktívny.

---

### Skupina 6: Session-based files (Harmonic/Cascade systems)
| Súbor | Session | Stav |
|-------|---------|------|
| `CascadeParticleEmissionBoost_Session118.js` | 118 | ? |
| `CascadeParticleColorTinting_Session119.js` | 119 | ? |
| `CascadeParticleSystem_Session120.js` | 120 | ACTIVE (imported in FXDebugSandbox) |
| `CascadeResonanceWaveVisualization_Session146.js` | 146 | ? |
| `HarmonicHubAuraSystem_Session126.js` | 126 | ? |
| `HarmonicInfluencePropagationSystem_Session127.js` | 127 | ? |
| `InfluenceReflectionBackPressureSystem_Session129.js` | 129 | ? |
| `StandingWaveOscillationTrapSystem_Session130.js` | 130 | ACTIVE (imported in FXDebugSandbox) |
| `StandingWaveVisualRenderer_Session131.js` | 131 | ACTIVE (imported in FXDebugSandbox) |
| `WaveInterferencePatternSystem_Session132.js` | 132 | ACTIVE (imported in FXDebugSandbox) |
| `HarmonicHealingVisualSystem_Session134.js` | 134 | ? |
| `HarmonicAudioReactivitySystem_Session135.js` | 135 | ? |
| `HealingParticleSystem_Session136.js` | 136 | ACTIVE (imported in FXDebugSandbox) |
| `HarmonicRecoveryVisualSystem_Session138.js` | 138 | ? |
| `HarmonicCascadeAmplification_Session145.js` | 145 | ? |
| `HarmonicPhaseSynchronization_Session146.js` | 146 | ? |

---

### Skupina 7: Enhanced Variants (Atoma_nodes/)
| Súbor | Session | Stav |
|-------|---------|------|
| `AnalyticsEnhancedVariants_Session81.js` | 81 | ACTIVE (imported in EnhancedNodeModels) |
| `StorageEnhancedVariants_Session81.js` | 81 | ACTIVE (imported in EnhancedNodeModels) |
| `ProcessEnhancedVariants_Session81.js` | 81 | ACTIVE (imported in EnhancedNodeModels) |
| `IntegrationEnhancedVariants_Session110.js` | 110 | ACTIVE (imported in EnhancedNodeModels) |
| `ControlEnhancedVariants_Session83.js` | 83 | ACTIVE (imported in EnhancedNodeModels) |
| `ControlSpineVariants_Session100.js` | 100 | ACTIVE (imported in EnhancedNodeModels) |
| `InputSensoryEnhanced_Session111.js` | 111 | ACTIVE (imported in EnhancedNodeModels) |
| `ControlNodeSpecialGoverners_Session114.js` | 114 | ACTIVE (imported in EnhancedNodeModels) |
| `StorageNodesVisual_Session116.js` | 116 | ACTIVE (imported in EnhancedNodeModels) |

---

### Skupina 8: _v1 Systems (Root directory)
| Súbor | Stav | Kategória |
|-------|------|-----------|
| `AdaptivePerformanceMonitor_v1.js` | ? | Performance |
| `ArchetypeAscensionCurves_v1.js` | ACTIVE | Archetype |
| `ArchetypeAuraEnhancement_v1.js` | ACTIVE | Archetype |
| `ArchetypeColorPaletteSystem_v1.js` | ACTIVE | Archetype |
| `ArchetypeGameplayEffects_v1.js` | ACTIVE | Archetype |
| `ArchetypeNeuralLinkVis_v1.js` | ACTIVE | Archetype |
| `ArchetypeShaderModes_v1.js` | ACTIVE | Archetype |
| `ArchetypeVisualDifferentiationSystem_v1.js` | ACTIVE | Archetype |
| `ArchetypeVisualIntegrationPatch_v1.js` | ACTIVE | Archetype |
| `ArchetypeVisualIntegrationPatch_v1_GAMEPLAY.js` | ACTIVE | Archetype |
| `ArchetypeVisualProfiles_v1.js` | ACTIVE | Archetype |
| `AuraModulationIntegration_v1.js` | ? | Aura |
| `CanonicalGeometryFamilies_v1.js` | ACTIVE | Geometry |
| `CompetitionDominanceAdapter_v1.js` | ? | Gameplay |
| `ControlledUnfreezeSystem_v1.js` | ? | System |
| `ControlNodeGeometries_v1.js` | ? | Geometry |
| `CorruptionVisualFX_v1.js` | ACTIVE | Visual |
| `CorruptionVisualIntegrationPatch_v1.js` | ACTIVE | Visual |
| `DefensiveHardeningPatch_v1.js` | ? | Safety |
| `EventVisualSuppression_v1.js` | ? | Visual |
| `ForceNodeOpaqueBodySystem_v1.js` | ? | Visual |
| `FrameUpdateLoopOrderValidator_v1.js` | ? | Debug |
| `FXPerformanceController_v1.js` | ACTIVE | Performance |
| `FXPerformanceScaler_v1.js` | ACTIVE | Performance |
| `FXPerformanceSmoothTransition_v1.js` | ACTIVE | Performance |
| `FXRuntime_v1.js` | ACTIVE | Runtime |
| `HarmonicResonanceCoupling_v1.js` | ACTIVE | Harmonic |
| `HarmonyStabilizationSystem_v1.js` | ACTIVE | Harmony |
| `HarmonyStabilizationIntegrationPatch_v1.js` | ACTIVE | Harmony |
| `InputRuntime_v1.js` | ACTIVE | Input |
| `InputSensoryGeometries_v1.js` | ? | Input |
| `LinkEligibilityGate_v1.js` | ? | Link |
| `LinkDebugMode_v1.js` | ? | Debug |

---

### Skupina 9: LEGACY Directory
| Súbor | Stav |
|-------|------|
| `LEGACY/_ExtremeLinkVisualPack3.js` | LEGACY |
| `LEGACY/_ExtremeLinkVisuals4_0.js` | LEGACY |
| `LEGACY/_NeuralCurveLinkVisuals.js` | LEGACY |
| `LEGACY/_UISelectedNodeTopBar3_4.js` | LEGACY |
| `LEGACY/HOTFIX_EmergencyVisualStabilization_v1.js` | LEGACY |
| `LEGACY/SpawnerConsolidationDetector_v1.js` | LEGACY |
| `LEGACY/aura/*` | LEGACY |
| `LEGACY/GRAVEYARD/*` | LEGACY |

---

### Skupina 10: src/legacy Directory
| Súbor | Stav |
|-------|------|
| `src/legacy/_NodeLinking2_3.js` | LEGACY |
| `src/legacy/NodeGrouping.js` | LEGACY |
| `src/legacy/T2_HarmonyVisualConsumer_v1.js` | LEGACY |

---

## Naming Convention Issues

### Zistené problémy:
1. **Mix konvencií:**
   - `_v1`, `_v2` (underscore prefix)
   - `1_0`, `2_0`, `3_0` (underscore suffix)
   - `_SessionXXX` (session-based)
   
2. **Príklady inconsistency:**
   - `LinkGlowSynergyEngine1_0.js` vs `LinkGlowSynergyEngine_v2.js`
   - `HudCollapseSystem1_0.js` vs `FXRuntime_v1.js`

---

## Odporúčané akcie

### 1. HIGH PRIORITY - Overenie aktívnych verzii
- [ ] Overiť, či `LinkAutomationMonitor2_0` alebo `3_0` je aktívna
- [ ] Overiť, či `DreamDesert.js` alebo `DreamDesert2.js` je aktívna
- [ ] Overiť, či `LinkGlowSynergyEngine1_0` alebo `_v2` je aktívna

### 2. MEDIUM PRIORITY - Session files audit
- [ ] Identifikovať, ktoré Session súbory sú importované v main.js
- [ ] Presunúť nepoužívané Session súbory do LEGACY

### 3. LOW PRIORITY - Naming standardization
- [ ] Navrhnúť jednotnú konvenciu pre verzionovanie
- [ ] Preferovaný formát: `SystemName_v1.js` alebo `SystemName_v1.0.js`

---

## Ďalšie kroky

1. **Analyzovať main.js** - zistiť, ktoré súbory sú importované
2. **Greppovať importy** - nájsť všetky importy verzionovaných súborov
3. **Vytvoriť dependency graph** - vizualizovať vzťahy medzi verziami
4. **Navrhnúť migráciu** - plán na konsolidáciu duplicitných verzií

---

*Audit vytvorený: 2026-03-13*
*Stav: Preliminárny - potrebná verifikácia*

