1. Prvá interakcia: link creation

Klik / link flow ide cez NodeLinkingSystem.attemptLink() (line 2762).
Pri úspechu sa vytvorí link objekt, zapíše sa do this.links, zavolá sa CreateLinkCommand.execute(), a systém dá linku aj vizuálnu spätnú väzbu.
V tom istom flow sa volá NodeMetricEngine.onLinkCreated() (line 861), čiže node metriky sa mierne upravia hneď pri vzniku linku.
NodeLinkingSystem potom emituje kanonický link.created (line 4697) cez semantic bus.
Po create/remove sa teraz volá aj metricsRuntime_v1.refreshLiveMetrics() (line 2762), aby sa live HUD prepočítal okamžite.
2. Kde sa počítajú node metriky

Autorita pre node metriky je updateNodeMetrics() (line 586) v NodeMetricEngine.js.
Táto funkcia:
zoberie nodes + linkSystem.links
nájde aktívne linky
na aktívnych node aplikuje cross-metric interakcie
equalizuje harmony a stability cez linky
robí resonance a burst logiku
na konci emituje threshold eventy cez emitNodeThresholdEvents(node) (line 755)
synergy je odvodená metrika, nie priamy writer.
applyMetricImpulse(), setMetric(), deriveSynergy() a onLinkCreated() sú stále v tej istej authority vrstve a zapisujú do node.userData.metrics.
3. Kde sa počítajú globálne metriky

Hlavná runtime vrstva je MetricsRuntime_v1.update() (line 282).
Táto update slučka:
volá updateNodeMetrics(...)
sanitizuje node metrics
zapisuje canonical link/network fallback polia
spúšťa network aggregator
publikuje live metrics
Live publish ide cez _publishLiveMetrics() (line 1289).
Aktuálne live publish berie fresh node aggregation z _aggregateNodeMetrics() (line 1380) a zapisuje:
window.__ATOMA_LIVE_METRICS__
window.world.metrics.global
window.globalMetrics
To znamená:
networkSynergy
harmonyFlow
networkStress
corruptionLevel
loadPressure
nodeCount
linkCount
MetricsRuntime_v1 má aj explicitný hook refreshLiveMetrics() (line 1372), ktorý sa volá po link create/remove.
4. Ako sa dostanú dáta do CoreMetricsHUD

CoreMetricsOverlay.update() je controller vrstva medzi runtime a HUDom: CoreMetricsOverlay.js (line 178).
Táto vrstva robí:
event-driven cache cez _getEventDrivenMetrics() (line 121), keď má subscription
fallback na metricsCalculator.getMetrics(), keď event cache nie je k dispozícii
potom volá updateHudMetrics(linkSource, this.currentMetrics) (line 210) z SemanticMetricAdapter.js (line 331)
a výsledok posiela do HUD: this.hud.update(...) (line 212)
Samotný CoreMetricsHUD.update() (line 242) číta dáta v tomto poradí:
window.__ATOMA_LIVE_METRICS__
metrics z overlay cache
CoreMetricsCalculator
fallback metrics parameter
Dôležitý detail:
Core HUD je throttlovaný na 2 Hz
takže aj keď runtime refreshne hneď, viditeľný DOM update ide na najbližšom HUD ticku
5. Ako sa dostanú dáta do NodeInspectHUD

NodeInspect overlay je samostatný read-only consumer.
V main bootstrape je napojený cez metricsRuntime_v1.onSimulationTick = (...) => nodeInspectOverlay.onSimulationTick(snapshot) (line 10590).
Vlastný update beží v NodeInspectOverlay1_0.update() (line 244).
Target selection ide cez findTargetedNode() (line 295) a má túto prioritu:
selectionCore.hoveredNodeForSelection
linkingSystem.hoveredNodeForSelection
window.__crosshairRaycastState.node
proximity fallback
Keď node nájde, updateOverlayContent() (line 419) číta metrics z _getSnapshotMetrics() (line 577), čiže:
najprv metricsRuntime_v1.lastSimulationSnapshot.nodes[].metrics
ak snapshot entry neexistuje, fallback na node.userData.metrics
To znamená:
NodeInspect nie je napojený na __ATOMA_LIVE_METRICS__
číta read-only snapshot posledného sim ticku
preto je správne, že sa aktualizuje iným rytmom než Core HUD
6. Ako vzniká hover target pre NodeInspect

Hover pipeline ide cez NodeLinkingSystem.processNodeTargeting() (line 6046), ktorá je v main scheduleri registrovaná na visual lane.
updateCrosshairNodeTargeting() (line 6257) zapisuje do window.__crosshairRaycastState.
updateNodeHoverStates() (line 2688) potom z toho berie rayHoveredNode a zapisuje hoveredNodeForSelection (line 2725).
NodeInspect používa práve tento hover stav ako prvú explicitnú cestu.
Ak proxy filtering v raycast pipeline vyhodí všetky kandidáty, hover target môže byť null, a NodeInspect sa neotvorí.
7. Čo je canonical autorita a čo je len consumer

Canonical node metric writer:
NodeMetricEngine.js
Canonical global publish writer:
MetricsRuntime_v1.js
Canonical link creation / interaction authority:
NodeLinkingSystem.js
Core HUD:
consumer cez __ATOMA_LIVE_METRICS__ a overlay adapter
NodeInspect HUD:
read-only snapshot consumer cez lastSimulationSnapshot
Threshold eventy node.*.<tier>, global.*.<tier>, link.*.<tier>, hub.*.<tier>:
sú semantic/event vrstva
nepočítajú metriky, len ich oznamujú
8. Krátky praktický verdikt

Po link create sa node metriky menia okamžite cez onLinkCreated().
V ďalšom 10 Hz runtime ticku sa prepočítajú cez updateNodeMetrics().
Globálne metriky sa publikujú do __ATOMA_LIVE_METRICS__.
CoreMetricsHUD číta práve tento publish.
NodeInspectHUD číta snapshot a hover state, nie global publish.
Ak chceš “čo presne sa hýbe”, pozeraj tri miesta:
node.userData.metrics
window.__ATOMA_LIVE_METRICS__
metricsRuntime_v1.lastSimulationSnapshot
Ak chceš, môžem ti to v ďalšom kroku rozkresliť ešte do tabuľky:

zdroj -> kto zapisuje -> kto číta -> refresh frekvencia
pre synergy / harmony / stability / corruption / loadPressure zvlášť.