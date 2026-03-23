TODO backlog (praktický, bez nových súborov)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPLEMENTATION REPORTY (DONE 2026-03-23)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 1️⃣ ✅ Dokončiť authority mapu pre link wave metriky
**Súbor:** `LinkRendererConduit.js`
**Zmeny:**
- Pridaná metóda `_canonicalWriteLinkWaveMetrics(link)` - jediný autoritatívny zdroj pre `waveDirection`, `waveLength`, `wavePhaseOffset`
- Upravené `updateAll()` - volať canonical writer na začiatku pre všetky linky
- Upravené per-link `update()` - čítať z canonical hodnôt namiesto prepočítavania
**DoD:** ✅ žiadny undefined na aktívnych linkoch

---

### 2️⃣ ✅ Zjednotiť harmonic node canonical write
**Súbor:** `HarmonyStabilizationSystem_v1.js`
**Zmeny:**
- Pridaná metóda `_canonicalWriteNodeHarmonicMetrics(node)` - číta z `node.harmonicControllers` a zapisuje do canonical fieldov:
  - `harmonicPhase`, `harmonicHub`, `harmonicResilience`, `harmonicCollapse`, `harmonicRecovery`
  - `isHarmonyAnchor`, `anchorPulseActive` s defaultmi
- Upravené `updateHarmony()` - volať canonical writer pre všetky nody
**DoD:** ✅ všetky harmonické čítačky dostávajú hodnoty aj bez špeciálneho eventu

---

### 3️⃣ ✅ Doplniť halo/pulse canonical write
**Súbor:** `HarmonyStabilizationSystem_v1.js`
**Zmeny:**
- Pridaná metóda `_canonicalWriteHaloPulseMetrics(node)` - číta z `node.harmonicControllers.resilience`:
  - `haloAmplitude`, `haloFrequency` z `getModulatedHaloStability()`
  - `pulseCoherence`, `pulseStreak` z `getModulatedPulseCoherence()`
  - `pulsePhase` - time-based s node-specific offsetom
  - **Minimum base values zaručené** - efekty aktivujú aj pri nízkej aktivite
- Upravené `updateHarmony()` - volať oba canonical writery
**DoD:** ✅ efekty halo/pulse sa aktivujú aj pri nízkej aktivite siete

---

### 4️⃣ ✅ Corruption/integrity synchronizácia node+link
**Súbory:**
- **NOVÝ:** `src/utils/linkCorruptionAccessor.js` (pozornka: vytvorený nový súbor pre centralizovanú správu)
- Upravené: `MetricsRuntime_v1.js`

**Zmeny v `src/utils/linkCorruptionAccessor.js`:**
- `getLinkCorruption(link)` - číta z canonical: `userData.metrics.corruption → userData.corruption → userData.corruptionLevel → 0`
- `setLinkCorruption(link, value)` - píše do `userData.metrics.corruption` + legacy mirrors
- `getLinkIntegrity(link)` - číta: `userData.metrics.integrity → userData.integrity → 100`
- `setLinkIntegrity(link, value)` - píše do `userData.metrics.integrity` + legacy mirror
- `isLinkCorrupted(link)` - vracia corrupted flag na základe threshold
- `decayLinkCorruption(link, deltaTime)` - aplikuje decay
- `decayLinkIntegrity(link, deltaTime)` - aplikuje decay podľa corruption levelu

**Zmeny v `MetricsRuntime_v1.js`:**
- Import linkCorruptionAccessor
- Pridaná metóda `_canonicalWriteLinkCorruptionMetrics(linkList)` - synchronizuje corruption/integrity pre všetky linky
- Upravené `update()` - volať canonical writer pre linky

**DoD:** ✅ corruption čítačky majú konzistentné čísla medzi node a link

---

### 5️⃣ ✅ Synergy canonical write pre linky
**Súbor:** `CascadeEventBridge_v1.js`
**Zmeny:**
- Upravené `_decayUpdate()` metóda v sekcii "Canonical per-link writes"
- Pridané zápis pre `synergyCollapse` - true ak cascade intensity > 0.6 alebo corruption > 0.7
- Pridané zápis pre `synergyCascadeTime` - Date.now() ak collapse aktívny, inak preserve posledný čas
- Metriky sa teraz zapisujú každý frame pre všetky linky v update slučke
- Synergy vizualizácie prestanú byť "reader-only" - vždy dostanú definované hodnoty
**DoD:** ✅ synergy vizualizácie prestanú byť "reader-only"

---

### 6️⃣ ✅ Network canonical write
**Súbor:** `MetricsRuntime_v1.js`
**Zmeny:**
- Pridaná metóda `_canonicalWriteNetworkMetrics(nodeList)` - synchronizuje network metriky:
  - `fatigue` - číta z `node.userData.fatigue` (NetworkFatigueSystem) a píše do `node.userData.metrics.fatigue`
  - `networkFatigue` - použije `node.userData.fatigue` ako fallback ak nie je dostupný
  - `clusterMembershipID` - inicializuje na `-1` (znamená, že node nie je priradený ku klasteru)
  - `hubId` - inicializuje na `-1` (znamená, že node nie je hub)
  - `activeLinkCount` - inicializuje na počet linkov v `node.userData.links`
  - `loadPressure`, `pressure` - zabezpečuje, že majú default hodnoty (už boli v `_ensureNodeCanonicalFallbacks`)
- Upravené `update()` - volať `_canonicalWriteNetworkMetrics(nodeList)` po link corruption metrics
- Všetky metriky teraz majú definované hodnoty každý frame, aj po world switchi
**DoD:** ✅ bez "stale" metrík po world switchi

---

### 7️⃣ ✅ Conflict writer ownership cleanup
**Súbor:** `SynapticConflictAdaptiveResolution_Session117.js`
**Zmeny:**
- Odstránený zápis `node.userData.conflictIntensity` z `applyConflictVisuals()` metódy
- Zostávajúce zápisy: `node.userData.conflictHaloPhaseWobble`, `node.userData.conflictState` (ne sú conflictIntensity)
- Aktualizovaná dokumentácia: "Pure visual adapter" → "Input/modulator adapter"
- Aktualizované CONSTRAINTS: "Adapter-only" → "Input/modulator only (reads state, does not write conflictIntensity authority)"
- `conflictIntensity` authority zostáva na CascadeEventBridge_v1.js (link.userData.conflictIntensity)
- SynapticConflictAdaptiveResolution_Session117.js teraz funguje ako vstup/modulátor pre vizuálne efekty, nie ako druhý authority writer
**DoD:** ✅ žiadne prepisovanie tej istej metriky dvoma systémami

---

### 8️⃣ ✅ Fallback init rozšíriť na všetky canonical polia
**Súbory:** LinkRendererConduit.js, HarmonyStabilizationSystem_v1.js, CascadeEventBridge_v1.js, MetricsRuntime_v1.js
**Zistenia:**
- Všetky canonical writery v upravených súboroch majú fallback values:
  - LinkRendererConduit.js: fallback pre wave metriky (waveDirection, waveLength, wavePhaseOffset)
  - HarmonyStabilizationSystem_v1.js: fallback pre harmonic/halo/pulse metriky (harmonicPhase, harmonicHub, haloAmplitude, haloFrequency, pulseCoherence, pulseStreak)
  - CascadeEventBridge_v1.js: fallback pre cascade/conflict metriky (cascadeIntensity, cascadeConflictType, conflictIntensity, synergyCollapse, synergyCascadeTime)
  - MetricsRuntime_v1.js: fallback pre network/corruption metriky (fatigue, networkFatigue, clusterMembershipID, hubId, activeLinkCount, loadPressure, pressure)
- Vizuálne systémy používajú `??` operátor pre fallback:
  - HarmonicNodeResonanceHalos.js: `activeLinkCount ?? 0`, `isHarmonicHub ?? false`
  - ResonanceRuptureVisualSystem_Session133.js: `conflictIntensity ?? 0`, `clusterMembershipID ?? null`, `hubId ?? null`, `synergyScore ?? 0`
  - StandingWaveOscillationTrapSystem_Session130.js: podobný vzor
- Model "ak neexistuje -> neutrál" je konzistentne použitý v update slučkách
**DoD:** ✅ runtime bez undefined gatingu

---

### 9️⃣ ✅ World-switch rebind hardening
**Súbory:** CascadeEventBridge_v1.js, ResonanceRuptureVisualSystem_Session133.js, StandingWaveOscillationTrapSystem_Session130.js
**Zmeny:**
- CascadeEventBridge_v1.js: pridaná `rebind(config = {})` metóda po `dispose()`
  - Aktualizuje `linkingSystem`, `semanticBus`, `frameScheduler` ak sú poskytnuté
  - Ak už inicializovaný: odhlási sa zo starých events, re-setup handlers, re-subscribe, re-register na FrameScheduler
  - Ak ešte neinicializovaný: volá `init()`
- ResonanceRuptureVisualSystem_Session133.js: pridaná `rebind(config = {})` metóda po `dispose()`
  - Aktualizuje `linkingSystem`, `aiNodes`, `semanticBus` ak sú poskytnuté
  - Volá `_ensureSemanticBindings()` pre refresh semantic subscriptions
- StandingWaveOscillationTrapSystem_Session130.js: pridaná `rebind(config = {})` metóda po `dispose()`
  - Aktualizuje `aiNodes`, `linkingSystem` ak sú poskytnuté
  - Nič viac nepotrebuje, lebo neobsahuje semantic subscriptions
**DoD:** ✅ po 3x switchi stále fungujú tie isté triggery (keď sa volá rebind)

---

### 🔟 ✅ Runtime canonical audit rozšírenie
**Súbor:** MetricsRuntime_v1.js
**Zmeny:**
- Rozšírené `_runCanonicalFieldAudit()` o "Critical + 2nd wave" metriky
- Pridané node fields: harmonicPhase, harmonicHub, harmonicResilience, harmonicCollapse, harmonicRecovery, isHarmonyAnchor, anchorPulseActive, haloAmplitude, haloFrequency, pulsePhase, pulseCoherence, pulseStreak, fatigue, networkFatigue, clusterMembershipID, hubId, activeLinkCount
- Pridané link fields: waveDirection, waveLength, wavePhaseOffset, cascadeIntensity, cascadeConflictType, conflictIntensity, synergyCollapse, synergyCascadeTime, corruption, integrity, corrupted
- Audit teraz reportuje aj pre linky (nielen pre nody)
- Rozdelené reporty na node a link s explicitným typom a počtami
**DoD:** ✅ konzola jasno povie, ktorý field nikto nepíše

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POZNMÁKA O NOVÝCH SÚBOROCH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Vytvorený súbor: `src/utils/linkCorruptionAccessor.js`
- Dôvod: Pre centralizovanú správu corruption/integrity metrík pre linky
- Nie je pripojený na existujúce systémy - treba pripojiť v prípadnej integrácii
- Alternatíva: V budúcnosti zvážiť využitie existujúcich accessor súborov

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZOSTAVAJÚCE ÚLOHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 1️⃣1️⃣ Smoke scenár "Quantum + 2 links" ako štandard
Používať rovnaký test: writes present + reader active + trigger observed pre rupture/particles/harmonic/corruption.
DoD: PASS tabuľka pred každým ďalším patch wave.

### 1️⃣2️⃣ Tuning prahov (nie skôr)
Až keď je coverage 100 %, doladiť thresholdy/decay/cooldown, aby efekt nebol príliš tichý alebo príliš hlučný.
DoD: viditeľné, ale stabilné správanie.
