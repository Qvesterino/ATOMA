Audit hotový, read-only, bez úprav kódu.

**Primary systems**

| SYSTEM | FILE | IMPORTED | INSTANTIATED | UPDATE/TICK LOOP | CLASSIFICATION |
|---|---|---|---|---|---|
| CascadingRuptureSystem | [CascadingRuptureSystem.js](/D:/ATOMA_CLEAN/CascadingRuptureSystem.js) | [main.js:491](/D:/ATOMA_CLEAN/main.js:491) | [main.js:11457](/D:/ATOMA_CLEAN/main.js:11457) (`this.cascadingRuptures`), aj [main.js:8750](/D:/ATOMA_CLEAN/main.js:8750) (`this.cascadingRuptureSystem`) | [main.js:9373](/D:/ATOMA_CLEAN/main.js:9373) (`reg('cascadingRuptures', ...)`) + [main.js:3916](/D:/ATOMA_CLEAN/main.js:3916) (`visual.cascadingRuptureSystem`) | **ACTIVE_SYSTEM** (s poznámkou: vetva `this.cascadingRuptureSystem` vyzerá ako problematická/legacy wiring) |
| ResonanceRuptureVisualSystem_Session133 | [ResonanceRuptureVisualSystem_Session133.js](/D:/ATOMA_CLEAN/ResonanceRuptureVisualSystem_Session133.js) | [main.js:441](/D:/ATOMA_CLEAN/main.js:441) | [main.js:11284](/D:/ATOMA_CLEAN/main.js:11284) (`this.resonanceRupture`) | [main.js:3802](/D:/ATOMA_CLEAN/main.js:3802) (`visual.resonanceRupture`) | **ACTIVE_SYSTEM** |
| PHASE5_CorruptionBridge_v1 | [PHASE5_CorruptionBridge_v1.js](/D:/ATOMA_CLEAN/PHASE5_CorruptionBridge_v1.js) | [main.js:69](/D:/ATOMA_CLEAN/main.js:69), [PHASE5_MultiNetworkOrchestrator_v1.js:16](/D:/ATOMA_CLEAN/PHASE5_MultiNetworkOrchestrator_v1.js:16) | [main.js:6403](/D:/ATOMA_CLEAN/main.js:6403) (`this.corruptionBridge`), aj [PHASE5_MultiNetworkOrchestrator_v1.js:43](/D:/ATOMA_CLEAN/PHASE5_MultiNetworkOrchestrator_v1.js:43) | [main.js:6352](/D:/ATOMA_CLEAN/main.js:6352) (`simulation.corruptionBridge`) + orchestrator tick [main.js:9303](/D:/ATOMA_CLEAN/main.js:9303) | **ACTIVE_SYSTEM** |

**Test / experimental systems**

| SYSTEM | FILE | IMPORTED | INSTANTIATED | UPDATE/TICK LOOP | CLASSIFICATION |
|---|---|---|---|---|---|
| _T4003_CORRUPTION_CASCADE_TEST_RUNNER | [_T4003_CORRUPTION_CASCADE_TEST_RUNNER.js](/D:/ATOMA_CLEAN/_T4003_CORRUPTION_CASCADE_TEST_RUNNER.js) | [main.js:628](/D:/ATOMA_CLEAN/main.js:628) | [main.js:7549](/D:/ATOMA_CLEAN/main.js:7549) (`setupCorruptionCascadeTestRunner(this)`) | žiadna scheduler registrácia; len manuálne `window.runCorruptionCascadeTest` | **TEST_SYSTEM** |
| LINK_CORRUPTION_TRANSMISSION_v1_EXAMPLES | [EXAMPLES/LINK_CORRUPTION_TRANSMISSION_v1_EXAMPLES.js](/D:/ATOMA_CLEAN/EXAMPLES/LINK_CORRUPTION_TRANSMISSION_v1_EXAMPLES.js) | nenašiel som runtime import v `main.js` | neinštancované v runtime | bez runtime ticku (example functions) | **LEGACY_EXPERIMENT** |
| T2_CorruptionVisualIntegration_v1 | [T2_CorruptionVisualIntegration_v1.js](/D:/ATOMA_CLEAN/T2_CorruptionVisualIntegration_v1.js) | [main.js:638](/D:/ATOMA_CLEAN/main.js:638) | [main.js:7572](/D:/ATOMA_CLEAN/main.js:7572) (`this.t2CorruptionVisualIntegration`) | [main.js:3720](/D:/ATOMA_CLEAN/main.js:3720), aj guard [main.js:9301](/D:/ATOMA_CLEAN/main.js:9301) | **ACTIVE_SYSTEM** |

**Dôležitá audit poznámka**
- `CascadingRuptureSystem` má **dve wiring vetvy**; jedna (`this.cascadingRuptureSystem`) vyzerá ako nekompatibilná s aktuálnym constructor usage, druhá (`this.cascadingRuptures`) je plnohodnotne zapojená a tickovaná.  
- Preto systém ako celok klasifikujem ako **ACTIVE_SYSTEM**, ale s **legacy/duplicitnou vetvou** v runtime.