SYSTEM / CALL                               | SOURCE
--------------------------------------------|------------------------------
requestAnimationFrame(animate)              | animate()
clock.getDelta / frameClock.tick            | animate()
frameScheduler.tick                         | animate()

cameraController.update                     | animate()
playerController.update                     | animate()
cameraPolishPack.update                     | animate()
cameraPolishPack3.update                    | animate()

worldStabilityPack.enforceWorldLock         | animate()
shakeObliterationPack.update                | animate()
pulseReducerPack.update                     | animate()
activeWorld.update                          | animate()
visualSuperpack.update                      | animate()
cinematicUpgrade.update                     | animate()

sigmaNodes[].update                         | animate() loop
quantumNodes[].update                       | animate() loop
nodeEditor.update                           | animate()

hazards.update                              | animate()
hazard force application                    | animate()

aiNodes.update                              | animate()
aiNodes.updateSpawning                      | animate()
applyMetricCompatibility                    | animate()

updateNodeUI                                | animate()
updateUndoRedoUI                            | animate()
updateLinkingUI (NO-OP)                     | animate()

coreMetricsOverlay.update                   | animate()
 ├─ metricsCalculator.update                | overlay
 ├─ temporalSystem.update                   | overlay
 ├─ engineAdapter.update / projectHudMetrics| overlay
 ├─ hud.update                              | overlay
 ├─ hud.updateGlow                          | overlay
 ├─ temporalEffects.update                  | overlay
 └─ updatePerformanceMonitor                | overlay

metricsVisualFX.update (call site)           | animate()
primaryNodeAura.update                      | animate()
primaryNodeTopBar.update                    | animate()
zoneAudioReactivity.update                  | animate()

coreMaterialPropertyLock.enforceFrame        | animate()
linkDebugMode.updateDebugVisuals (if enabled)| animate()

renderer.render(scene, camera)               | animate()


SYSTEM / CALL                               | FREQUENCY            | PROOF
--------------------------------------------|----------------------|-----------------------------
NodeInspectOverlay.update (logic)           | ~30 Hz               | checkInterval + deltaTime
relaxNodeMetrics                            | ~1 s                 | frameCount % 60
coreMaterialMutationDetector.checkAllCores  | ~1 s                 | frameCount % 60
mythicGlyphScanTimer scan                   | ~5 Hz                | timer >= 0.2
console.log (periodic debug)                | ~30 s                | frameCount % (60*30)
coreMetricsOverlay DEBUG log                | ~1 s                 | now - lastHudDebugLog



SYSTEM / CALL                               | TRIGGER
--------------------------------------------|-------------------------------
NodeInspectOverlay.showOverlay              | targetedNode changed → present
NodeInspectOverlay.hideOverlay              | targetedNode lost
linguisticOverlay.inspectNode               | targetedNode changed
linguisticOverlay.hideOverlay               | targetedNode lost
temporalEvents.newCycle / Epoch / Aeon log  | temporal event flags
