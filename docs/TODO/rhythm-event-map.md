Cieľ
Konkrétne prepojiť šesť ritual typov na global metric eventy
Automatický trigger + target behavior
Obsah

1) MythicRitualController.js** – ritual selektor + fázový workflow

checkRitualTriggers(nodes) / triggerRitual(...)
updateActiveRitual(...) + endRitual()
createXVisuals(...) funkcie (6)

createAscensionVisuals
createQuantumFissureVisuals
createHarmonyConvergenceVisuals
createChaosRitualVisuals
createMythicSignalVisuals
createEchoRitualVisuals
semanticBus event emit mapping

node/global eventy 1-2-3 tier
Phase / Effects -> metrics binding

🧩 **Navrhované mappingy** (tabuľka)
efekt	podmienka / trigger	navrhovaný event tag
Ascension	4+ ascended + mood.avgHarmony > 75	global.harmony.high
Quantum Fissure	mood.avgStability > 85 + intensity > 0.8	global.stability.high
Harmony Convergence	mood.avgHarmony > 80 + avgClarity > 75	global.harmony.high
Chaos Ritual	mood.avgStability > 75 + mood.avgEnergy > 70	global.stability.mid/high (tune)
Mythic Signal	balanceScore < 20 + mood.avgStability > 70	global.synergy.high / global.harmony.mid
Echo Ritual	mood.avgEnergy < 40 + avgClarity > 75 + ascendedCount >= 2	global.synergy.mid / global.harmony.mid
fallback soft triggers:
global.corruption.high -> korekcia „enua chaos/contam”
global.loadPressure.high -> pre dynamiku výdrže / urgent ritual pulse
global.synergy.low -> inhibit ritual (skip + reset)
🛠️ Ako to integrovať rýchlo
triggerRitual():
v MythicRitualController, pridať this.semanticBus?.emit('global.<metric>.<tier>', {...})
každá create...Visuals():
priechod this.semanticBus?.emit('ritual.visual.<name>.started')
endRitual():
emit ritual:finish, ritual:success, ritual:failure, aj global.* cleanup
✅ Result
Tento dokument zabezpečí:

každý ritual má jasnú metrics-based legitímnu jazdu
konzistentné tags pre event systémy
jednoduché prepínanie / debug pri prechode rozličných svetov


______________
2) _SafeLegendaryWorldEvents.js (legendary bigger world FX)
Toto je “strategická world event akcia” s 5 event-typmi.

**Navrhované metric-triggery (global)**  
global.synergy.high → COSMIC_PULSE (koherentný, energetický výbuch, synchronizácia linkov)
global.harmony.high → AURORA_STATE (upokojenie, pokojná svetelná pásma)
global.corruption.high → SIGMA_INVASION (glitch + zrnkavá destabilizácia tempa)
global.stability.high → QUANTUM_ECLIPSE (dimensionálny shift, „vývoj“)
global.loadPressure.high → FRACTAL_STORM (vysoký network-load, poveternostný chaos)
fallback:
global.synergy.mid → zvýši šancu FRACTAL_STORM / AURORA_STATE.
global.harmony.low → môže potlačiť spúšť (low priority).
3) TemporalEventEffects.js (epoch/aeon pulse)
Toto je “časová odozva” - keď zmenný timeline/epoch posilní vizuály.

**Navrhované metric-triggery (global + čas)**
global.loadPressure.high + global.harmony.mid → newEpoch (neutrálne, prechody)
global.synergy.high → newAeon (vynikajúci posun, aeon pulse)
global.stability.high → stabilizácia „epoch shift“ (ladí so zmenou pozadia)
global.corruption.mid / global.corruption.high → nechať vypnuté / tlmené (tento modul init má soft efekty, nech sa nerobí cez corruption)
Ako to prepojiť
v metrickom updateri (MetricsRuntime):
emit window.ATOMA_EVENTS?.emit('temporal.newEpoch') keď dosiahneš harmony + loadPressure threshold.
emit ...('temporal.newAeon') pri synergy.high + stability.high pre silnú sincronizáciu.
TemporalEventEffects.update:
if (temporalEvents.newEpoch) triggerEpochShift()
if (temporalEvents.newAeon) triggerAeonPulse()

_SafeLegendaryWorldEvents.js | COSMIC_PULSE | global.synergy.high
_SafeLegendaryWorldEvents.js | AURORA_STATE | global.harmony.high
_SafeLegendaryWorldEvents.js | SIGMA_INVASION | global.corruption.high
_SafeLegendaryWorldEvents.js | QUANTUM_ECLIPSE | global.stability.high
_SafeLegendaryWorldEvents.js | FRACTAL_STORM | global.loadPressure.high
TemporalEventEffects.js | triggerEpochShift() | global.harmony.mid, global.loadPressure.high
TemporalEventEffects.js | triggerAeonPulse() | global.synergy.high, global.stability.high
🔧 Aplikácie
Prímary event can be in phase8 trigger pipeline (NetworkRituals / MetricsRuntime)
Secondary vizuály: RitualVisualOrchestrator + MythicRitualController iba subor, môže prebrať tie event tagy tiež.
Nastav cooldowny/avoid spamming v event layer (ako už má SafeLegendaryWorldEvents).
______________
4) Phase8RitualVisualOrchestration.js (ritual visual orchestration)
**čo už existuje**
3 fázy: PRE_RITUAL, RITUAL_ACTIVE, COMPLETION
3 canonical templates v commete: SynergyGlow, HarmonyAura, StressTurbulence
funkcie _onRitualStart, _onRitualProgress, _onRitualComplete (a volatile state map)
návrh event tagov (global -> ritualFIL)
(hlavné global tagy z príkazu)

**metric tag	tempo vkusu	kedy	voľba účinku**
global.synergy.high	vynikajúca kolektívna koherencia	pre život rituálu	PRE_RITUAL (attunement) + RITUAL_ACTIVE (boost synergy grind)
global.harmony.high	stabilná koherentná konvergencia	aktívna/úplná fáza	RITUAL_ACTIVE (harmony aura + radius)
global.stability.high	systém silne zosieťovaný	čas spúšte	PRE_RITUAL -> lock, minimal jitter
global.loadPressure.high	intenzívny sieťový tlak	alistate + aktivácia	STRESS_TURBULENCE damp + dodatočné moduly
global.corruption.high	vyhriznutá riziková fáza	ak by sa riadili non-spoiler vizuály	skôr MetricReactiveWorldEvents (tento súbor)
global.synergy.mid / global.harmony.mid	stabilný build	PRE_RITUAL + RITUAL_ACTIVE stredné nastavenie	
načítanie
Implementovať v Phase8RitualVisualOrchestration.initialize():

od razu subscribe eventy z NetworkRituals (ritual:start/progress/complete/abort)
plus:
global.synergy.high → v metodách checkExternalMetricTrigger()
global.harmony.high → applyRitualActiveModifiers(...)
global.loadPressure.high → do stressDamping + waveRippleEffect
extra
namiesto pollovať rovno:

pridaj metódu setMetricState(metrics) (volaná z MetricsRuntime / MetricReactiveWorldEvents)
v update(...) použi this.currentMetricState + threshold dávky.
5) MetricReactiveWorldEvents.js (direct metric-reactive effects)
čo už existuje
výber eventov via checkSynergyEvents, checkHarmonyEvents, ...
temporal:
triggerCycleTurnover, triggerEpochTurnover, triggerAeonMoment
rich VFX toolkit (create...) - ideal for global.* hooks
návrh pripojenia tagov
metric tag	efekt + funkcia	kde pridať
global.synergy.high	triggerUnityPulse() (coherence wave)	v checkSynergyEvents
global.synergy.mid	triggerCoherenceWave() (menej intenzívne)	v checkSynergyEvents
global.harmony.high	triggerHarmonicAscension()	v checkHarmonyEvents
global.harmony.mid	triggerCalmBloom()	v checkHarmonyEvents
global.stability.high	triggerAeonMoment()? / triggerQuantumSpiral()	pre silnú stabilitu
global.stability.mid	triggerDistortionDrift() (safely, low chaos)	pre všim
global.corruption.high	triggerUmbraEcho() + triggerShadowFlicker()	v checkCorruptionEvents
global.corruption.mid	triggerShadowFlicker() (subtle)	v checkCorruptionEvents
global.loadPressure.high	triggerNetworkSurge()	v checkLoadEvents
global.loadPressure.mid	triggerOverlinkGlow()	v checkLoadEvents
node.loadPressure.low	tiež môže viesť k triggerCalmBloom() na lokálny efekt (tento súbor je world-wide, ale máš nodal fallback)	
plus
pridať event emit do check*Events, pre cross-system:

this.semanticBus?.emit('global.synergy.high', {value:synergy}) ...
this.semanticBus?.emit('visual.ritual.trigger', {type:'UnityPulse', source:'MetricReactiveWorldEvents'})
**prepojenie MythicRitualController (tiež cez eventy)**
v checkRitualTriggers() rituály aj emit:
this.semanticBus?.emit('global.harmony.high', {value:mood.avgHarmony}) atď
alebo this.semanticBus?.emit('ritual.global.harmony.high', { ritualType, mood, nodes })
v endRitual() emit:
this.semanticBus?.emit('ritual:done', { type:this.activeRitual, success, metrics})
**MD dokument (muy simple)**
Vytvor docs/legendary-ritual-trigger-map.md (umiestnenie podľa repo stylu) so štruktúrou:

sekcia A: Phase8RitualVisualOrchestration
sekcia B: MetricReactiveWorldEvents
sekcia C: MythicRitualController
Každá sekcia tabuľka:

tag | kedy | efekt | rio (dôvod)
**rýchly praktický snippet (použiť)**
v MetricReactiveWorldEvents.checkSynergyEvents:
if (synergy > 85 && canTrigger && !this.eventStates.synergyUnity) {
  window?.ATOMA_BUS?.emit?.('global.synergy.high', {value: synergy, source:'MetricReactiveWorldEvents'});
  this.triggerUnityPulse();
  ...
}

v Phase8RitualVisualOrchestration initialize:
this.metricBus = window?.ATOMA_BUS; 
this.metricBus?.on?.('global.synergy.high', (e)=>this._onGlobalSynergyHigh(e));
...


🌟 Takto je to hotové
Designer/QA vidí priamy tag->efekt
metriky sú zdieľané medzi MetricReactiveWorldEvents a Phase8RitualVisualOrchestration
ďalej jednoduché premostenie do MythicRitualController cez semanticBus
Chceš, môžem to teraz rovno napísať do PR patch:

Phase8RitualVisualOrchestration event listeners cross-wire
MetricReactiveWorldEvents emit tags vo všetkých checkXEvents
docs/phase8-cycle-trigger-map.md zostavím.
____

Tabuľka 1: stávajúca v tvojom hlavnom pláne
súbor	efekt (hlavná logika)	navrhovaný metric/event tag
MetricReactiveWorldEvents.js	CoherenceWave / UnityPulse / CalmBloom / HarmonicAscension / DistortionDrift / QuantumSpiral / ShadowFlicker / UmbraEcho / OverlinkGlow / NetworkSurge	global.synergy.high, global.synergy.mid, global.harmony.high/mid, global.instability.high, global.corruption.high/mid, global.loadPressure.high/mid
Phase8RitualVisualOrchestration.js	PRE_RITUAL / RITUAL_ACTIVE / COMPLETION (SynergyGlow/HarmonyAura/StressTurbulence modifiers)	global.synergy.high, global.harmony.high, global.stability.high, global.loadPressure.high (+ slow mode global.synergy.mid, global.harmony.mid)
_SafeLegendaryWorldEvents.js	COSMIC_PULSE / FRACTAL_STORM / SIGMA_INVASION / QUANTUM_ECLIPSE / AURORA_STATE	global.synergy.high, global.loadPressure.high, global.corruption.high, global.stability.high, global.harmony.high
TemporalEventEffects.js	EpochShift, AeonPulse (time milestone)	global.loadPressure.high + global.harmony.mid => newEpoch, global.synergy.high + global.stability.high => newAeon
MythicRitualController.js	6 Ritual modes + phases INIT/RISE/PEAK/FALL	mapovanie podľa mood:
Ascension ~ global.harmony.high
QuantumFissure ~ global.stability.high
HarmonyConvergence ~ global.harmony.high
ChaosRitual ~ global.stability.mid/high
MythicSignal ~ global.synergy.high
EchoRitual ~ global.synergy.mid / global.harmony.mid |
📋 Tabuľka 2: štvorka doplnkov
súbor	efekt	metric/event tag
_NodeMicroEvents.js	Personality micro-visuals (focus pulse, resonance halo, jitter, glyph etc.) + metric additive micro-events	node.metrics.stability/high, node.metrics.harmony/high, node.metrics.synergy/high, node.metrics.loadPressure/high. + global fallback via node stable
NetworkRituals_v1.js	Ritual life cycle (initiate/channeling/resonance/resolution/complete/fail)	ritual:start, ritual:progress, ritual:complete, ritual:fail, ako semantika event layer;
plus emit bridging:		
semanticBus.emit('global.harmony.high'), semanticBus.emit('global.synergy.high'), semanticBus.emit('global.stability.high') at triggers		
RitualVisualOrchestration.js	(ero) (superdeck) No direct metrics currently, orchestration by ritual events	subscribe to:
ritual:start, ritual:progress, ritual:complete, (global.synergy.high...), global.harmony.high, global.loadPressure.high		
EnvironmentalHazards.js	Environmental hazard visuals (storms/anomalies)	can map:
global.corruption.high -> hazard intensity
global.loadPressure.high -> more bolts / radius
global.stability.low -> increase disturbance
global.stability.high -> less hazard / calm mode
event emitting:
semanticBus.emit('environment.hazard.active', {type, intensity}) |
💡 Rýchla implementačná rada
v každom súbore, ktorý má už event systémy (semanticBus / window.ATOMA_BUS):
pridaj if (this.semanticBus) this.semanticBus.emit('global.<metric>.<tier>', {value, source})
v MetricReactiveWorldEvents.check...Events rovno posielaj global tagy (prípadne node->global pre node.loadPressure -> global.loadPressure)
v Phase8RitualVisualOrchestration.initialize:
this.metricBus?.on?.('global.synergy.high', ...) a inline priamo _onGlobalSynergyHigh
NetworkRituals produkuje ritual:* eventy
MythicRitualController tie eventy spotrebuje a spustí vizuály + optional semanticBus.emit('ritual.visual.start')
TemporalEventEffects do update(…, temporalEvents) nech príjma počasove keys.
_NodeMicroEvents je dobré eventy do HUD:
this.semanticBus?.emit('node.microevent', {nodeId, eventName})

## Implemented Patch Map

| Nazov subor | Efekt | Event metric tag |
|---|---|---|
| MetricReactiveWorldEvents.js | UnityPulse | global.synergy.high |
| MetricReactiveWorldEvents.js | CoherenceWave | global.synergy.mid |
| MetricReactiveWorldEvents.js | HarmonicAscension | global.harmony.high |
| MetricReactiveWorldEvents.js | CalmBloom | global.harmony.mid |
| MetricReactiveWorldEvents.js | ShadowFlicker / UmbraEcho | global.corruption.mid / global.corruption.high |
| MetricReactiveWorldEvents.js | OverlinkGlow / NetworkSurge | global.loadPressure.mid / global.loadPressure.high |
| Phase8RitualVisualOrchestration.js | PRE_RITUAL / RITUAL_ACTIVE modulation | global.synergy.high, global.synergy.mid, global.harmony.high, global.harmony.mid, global.stability.high, global.loadPressure.high |
| NetworkRituals_v1.js | ritual lifecycle bridge | ritual:start, ritual:progress, ritual:complete, ritual:abort, global.synergy.mid/high, global.harmony.mid/high, global.stability.high, global.loadPressure.high |
| _SafeLegendaryWorldEvents.js | COSMIC_PULSE | global.synergy.high |
| _SafeLegendaryWorldEvents.js | AURORA_STATE | global.harmony.high |
| _SafeLegendaryWorldEvents.js | SIGMA_INVASION | global.corruption.high |
| _SafeLegendaryWorldEvents.js | QUANTUM_ECLIPSE | global.stability.high |
| _SafeLegendaryWorldEvents.js | FRACTAL_STORM | global.loadPressure.high |
| TemporalEventEffects.js | triggerEpochShift | global.harmony.mid, global.loadPressure.high |
| TemporalEventEffects.js | triggerAeonPulse | global.synergy.high, global.stability.high |
| MythicRitualController.js | Ascension / HarmonyConvergence | global.harmony.high |
| MythicRitualController.js | QuantumFissure | global.stability.high |
| MythicRitualController.js | MythicSignal | global.synergy.high |
| MythicRitualController.js | EchoRitual | global.synergy.mid, global.harmony.mid |
| _NodeMicroEvents.js | harmony_ring / clarity_spark / core_overpulse / jitter_burst | node.harmony.high, node.synergy.high, node.loadPressure.high, node.stability.high |
| _NodeMicroEvents.js | spontaneous micro event log | node.microevent |
| RitualVisualOrchestrator.js | modifier amplification / damping | global.synergy.high, global.harmony.high, global.loadPressure.high |
| EnvironmentalHazards.js | hazard intensity modulation | global.corruption.high, global.loadPressure.high, global.stability.low, global.stability.high |
| EnvironmentalHazards.js | hazard activation broadcast | environment.hazard.active |