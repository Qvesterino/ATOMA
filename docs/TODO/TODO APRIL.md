

**Cieľ:**  
Všetky hlavné VFX čítačky (`cascade/resonance/wave/particle`) musia mať stabilné canonical vstupy každý frame, bez `undefined`, bez stale, bez náhodného behavioru po world switchi.

**Obmedzenia, ktoré rešpektujeme:**
1. Bez nových zdrojových súborov.
2. Minimal diffs v existujúcich systémoch.
3. Najprv coverage/wiring, až potom tuning thresholdov.

---

**Fáza A: Stabilizačný základ (must-have)**

1. Zmraziť ownership fieldov (single-writer pravidlo)
- Spísať pre každý critical field presne 1 writer.
- Zakázať “druhý writer” v iných moduloch.
- DoD: žiadny field z Critical setu nemá 2 aktívnych writrov.

2. Canonical field set finalizovať (Node + Link)
- Node: `synergy,harmony,stability,corruption,loadPressure,fatigue,networkFatigue,clusterMembershipID,hubId,activeLinkCount,resonance,waveField.amplitude,waveField.phase`
- Link: `cascadeIntensity,cascadeConflictType,conflictIntensity,particleIntensity,particleUrgency,corruption,integrity,corrupted,visualTear,visualCoherenceLoss,waveDirection,waveLength,wavePhaseOffset,synergyCollapse,synergyCascadeTime`
- DoD: každý field má ownera a fallback pravidlo.

3. Per-frame fallback init pre všetky active node/link
- Ak field chýba: neutrálna hodnota (0/false/'neutral'/default color).
- Vždy stamp `__canonicalWriteAt`.
- DoD: 0 `undefined` na target poliach v runtime sample.

---

**Fáza B: Writer coverage (core implementácia)**

4. Node core metriky držať v [NodeMetricEngine.js](/D:/ATOMA_CLEAN/src/metrics/NodeMetricEngine.js)
- Overiť, že `synergy/harmony/stability/corruption/loadPressure` sa vždy zapisujú.
- Nechať ostatné systémy tieto hodnoty len čítať.
- DoD: tieto hodnoty sú nenull na všetkých nodoch.

5. Network/node mirrors držať v [MetricsRuntime_v1.js](/D:/ATOMA_CLEAN/MetricsRuntime_v1.js)
- Per-frame write: `fatigue,networkFatigue,clusterMembershipID,hubId,activeLinkCount` + legacy mirror do `userData.*`.
- DoD: node čítačky mimo `metrics.*` dostanú konzistentné hodnoty.

6. Link corruption/integrity canonical write v [MetricsRuntime_v1.js](/D:/ATOMA_CLEAN/MetricsRuntime_v1.js)
- Per-frame write: `corruption,integrity,corrupted`.
- DoD: všetky link corruption čítačky majú vstup bez výpadkov.

7. Cascade/conflict authority v [CascadeEventBridge_v1.js](/D:/ATOMA_CLEAN/CascadeEventBridge_v1.js)
- Per-frame write: `cascadeIntensity,cascadeConflictType,conflictIntensity,synergyCollapse,synergyCascadeTime`.
- DoD: cascade readers dostanú dáta aj bez jednorazového eventu.

8. Particle authority v [ParticleSemanticDensityAdapter_Session121.js](/D:/ATOMA_CLEAN/ParticleSemanticDensityAdapter_Session121.js)
- Per-frame write: `particleIntensity,particleUrgency` (+ density parametre).
- DoD: particle systémy nemajú “silent no-op” kvôli chýbajúcim hodnotám.

9. Wave canonical pre linky v [LinkRendererConduit.js](/D:/ATOMA_CLEAN/LinkRendererConduit.js)
- Per-frame write: `waveDirection,waveLength,wavePhaseOffset`.
- DoD: wave/shader čítačky nečítajú neinitialized polia.

10. Resonance/waveField canonical pre nody v [StandingWaveOscillationTrapSystem_Session130.js](/D:/ATOMA_CLEAN/StandingWaveOscillationTrapSystem_Session130.js)
- Per-frame write/reset: `resonance,waveField.amplitude,waveField.phase`.
- DoD: resonance/wave readers majú stabilné feedy.

11. Rupture canonical pre linky v [ResonanceRuptureVisualSystem_Session133.js](/D:/ATOMA_CLEAN/ResonanceRuptureVisualSystem_Session133.js)
- Per-frame write: `visualTear,visualCoherenceLoss` (decay + contribution).
- DoD: rupture visuals čítajú vždy číslo, nie `undefined`.

12. Harmonic/halo/pulse canonical v [HarmonyStabilizationSystem_v1.js](/D:/ATOMA_CLEAN/HarmonyStabilizationSystem_v1.js)
- Per-frame write: `harmonicPhase,harmonicHub,harmonicResilience,harmonicCollapse,harmonicRecovery,isHarmonyAnchor,anchorPulseActive,haloAmplitude,haloFrequency,pulsePhase,pulseCoherence,pulseStreak`
- DoD: halo/pulse readers už nečakajú na lokálny lucky write.

---

**Fáza C: Lifecycle a deterministický runtime**

13. Rebind na world switch držať v [main.js](/D:/ATOMA_CLEAN/main.js)
- Po dispose/create/switch volať `rebind()` pre bridge/trap/rupture systémy.
- DoD: po 3x switchi tie isté systémy stále čítajú aktuálne `aiNodes/linkingSystem`.

14. Stabilné poradie update lane
- Cieľ poradia: NodeMetricEngine -> MetricsRuntime -> domain writers -> visual readers.
- DoD: žiadny reader nebeží pred svojím writerom v tom istom frame.

15. Odstrániť duálne authority zápisy
- Skontrolovať conflict/cascade/wave fields, že ich neprepisujú 2 systémy.
- DoD: single writer per field.

---

**Fáza D: Audit gate (bez toho nebudeme veriť ničomu)**

16. Rozšíriť canonical audit v [MetricsRuntime_v1.js](/D:/ATOMA_CLEAN/MetricsRuntime_v1.js)
- Audit node + link fields z Core setu.
- Missing/stale warningy s počtom nodov/linkov.
- DoD: warning vypíše presne field a rozsah problému.

17. `__canonicalWriteAt` stamping na všetky nové fields
- Pri každom write stampnúť pole.
- DoD: false stale warningy zmiznú.

18. Gate pravidlo
- “Green build” len ak 10s runtime okno dá 0 canonical warningov.
- DoD: formálne stop/go kritérium.

---

**Fáza E: Runtime smoke scenáre (opakovať po každej wave)**

19. Štandardný smoke: Quantum + 2 linky
- Overiť: writes present + reader active + visual trigger observed.
- DoD: PASS pre rupture + particles + wave + harmonic + corruption.

20. Multi-switch smoke
- Fractal -> Quantum -> Desert -> Quantum.
- DoD: bez driftu referencií, bez návratu `undefined`.

21. Reader coverage smoke (10–15 top efektov zo `submetriky.txt`)
- Pri každom: writer existuje, reader beží, trigger sa prejaví.
- DoD: PASS tabuľka s konkrétnymi systémami.

---

**Fáza F: Tuning až na konci**

22. Threshold/cooldown/decay tuning
- Až keď je coverage + audit green.
- DoD: efekty sú viditeľné, ale nie spam.

23. Cleanup dead code/imports
- Po stabilizácii odstrániť nepoužité vetvy.
- DoD: žiadne dead import warningy, čistejší ownership.

---

**Čo robiť hneď teraz (najlepší next step):**
1. Dokončiť bod 14 (poradie update lane) + rýchly audit.
2. Spustiť bod 19 a 20 automaticky.
3. Spraviť PASS/FAIL tabuľku pre bod 21 a z nej vytvoriť finálny fix mini-wave.

Ak chceš, ďalší krok ti rovno pripravím ako “Execution checklist 1:1” (checkboxy pre každý súbor a konkrétne fieldy).

___
PART 2
Najčastejšie používané, ale nikde globálne nepočítané:

link.userData.cascadeIntensity — hlavný spúšťač častíc, nikde sa nepočíta, len sa číta (viacero systémov).
link.userData.cascadeConflictType — typ konfliktu, očakáva sa v niekoľkých vizuálnych moduloch.
link.userData.cascadeParticleColor — farba častíc, nastavuje sa len v rámci niektorých vizuálnych systémov.
link.userData.particleDensityMultiplier — ovplyvňuje hustotu častíc, nastavuje len ParticleSemanticDensityAdapter_Session121.js.
link.userData.particleClusterCohesion — tesnosť zhlukov, nastavuje len ParticleSemanticDensityAdapter_Session121.js.
link.userData.particleClusterRadius — polomer zhluku, nastavuje len ParticleSemanticDensityAdapter_Session121.js.
link.userData.particleUrgencyOscillation — oscilácia urgentnosti, nastavuje len ParticleSemanticDensityAdapter_Session121.js.
link.userData.particleUrgency — urgentnosť, nastavuje len ParticleSemanticDensityAdapter_Session121.js.
link.userData.particleIntensity — intenzita, nastavuje len ParticleSemanticDensityAdapter_Session121.js.
link.userData.conflictIntensity — intenzita konfliktu, nastavuje len SynapticConflictAdaptiveResolution_Session117.js.
WAVES / RESONANCE / PARTICLE — najčastejšie submetriky:

node.userData.resonance — používa sa v niektorých vizualizačných moduloch, ale nie je globálne vypočítavaná.
node.userData.waveField.amplitude, node.userData.waveField.phase — používa sa v shaderoch a vizualizáciách, často len čítané.
link.userData.waveDirection, link.userData.waveLength, link.userData.wavePhaseOffset — nastavuje sa v LinkRendererConduit, nie je globálne synchronizované.
node.userData.haloAmplitude, node.userData.haloFrequency — nastavuje sa v resilience/halo vizualizáciách.
node.userData.pulsePhase, node.userData.pulseCoherence, node.userData.pulseStreak — používa sa v resilience/pulse vizualizáciách.
mesh.userData.rippleAmplitude, mesh.userData.angularCoherence, mesh.userData.waveScale, mesh.userData.tearingReduction — používa sa v ripple vizualizáciách, často len v rámci jedného systému.
userData.glowIntensity, userData.confidence, userData.presence — používa sa v HarmonicHubResilienceController, nie je globálne synchronizované.
link.userData.visualTear, link.userData.visualCoherenceLoss — nastavuje sa len v niektorých rupture/cascade moduloch.
link.userData.synergyCollapse, link.userData.synergyCascadeTime — používa sa v niektorých vizualizačných moduloch, nie je globálne synchronizované.
node.userData.harmonyStabilized, node.userData.harmonyDampingFactor — používa sa v harmony vizualizáciách, nie je globálne synchronizované.
Harmonic:

node.userData.harmonicPhase, node.userData.harmonicHub, node.userData.harmonicResilience, node.userData.harmonicCollapse, node.userData.harmonicRecovery — používané v halo, hub, phase a recovery moduloch, často len čítané alebo nastavované lokálne.
node.userData.isHarmonyAnchor, node.userData.anchorPulseActive — nastavuje HarmonyStabilizationSystem, nie je globálne synchronizované.
node.userData.instability — používa sa v niekoľkých vizualizačných moduloch, ale podľa auditov sa nikde priamo nevypočítava, len sa odvádza z iných metrík.
Corruption:

node.userData.corruption, link.userData.corruption, node.userData.corrupted, link.userData.corruptionLevel — používané v corruption/transmission moduloch, nie vždy synchronizované s globálnym stavom.
node.userData.integrity, link.userData.integrity — používané v integrity/corruption moduloch, často len čítané.
node.userData.visualTear, link.userData.visualTear — používané v rupture/cascade moduloch, nie je globálne synchronizované.
Network:

node.userData.fatigue, node.userData.networkFatigue — používa NetworkFatigueSystem, ale iné systémy často len čítajú, neaktualizujú.
node.userData.clusterMembershipID, node.userData.hubId, node.userData.activeLinkCount — používané v hub/cluster moduloch, často len čítané.
node.userData.loadPressure, node.userData.pressure — používané v network a fatigue moduloch, nie je globálne synchronizované.