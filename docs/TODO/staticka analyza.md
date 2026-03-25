Nižšie je statická analýza podľa kódu v D:\ATOMA_CLEAN (bez runtime testu). Držím sa tvojho scope: mimo LinkRendererConduit, mimo T2, mimo aura/halo/ring vizuálov.

Neviditeľné (reálne nič nekreslia / stub)

D:\ATOMA_CLEAN\InfluenceReflectionBackPressureSystem_Session129.js — _applyVisualEffects() je prázdny stub, takže tlak/odrazy nemajú render.
D:\ATOMA_CLEAN\StandingWaveOscillationTrapSystem_Session130.js — _applyVisualEffects() je prázdny; systém iba počíta stav a zapisuje kanonické hodnoty.
D:\ATOMA_CLEAN\HarmonicResonanceCoupling_v1.js — „resonanceParticles“ sú iba array bez renderera; jediný viditeľný efekt je jemné scale/glow (ak vôbec na správnom meshi).
D:\ATOMA_CLEAN\CorruptionVisualFX_v1.js — chaos particles sa nikdy nerenderujú (renderCorruptionParticles() je prázdny), jitter sa nevykoná (offset sa vypočíta, ale nepridá), a shader beží len ak je globálne THREE (tu sa neimportuje).
D:\ATOMA_CLEAN\SynergyBonusVisualization_v1.js — iba počíta a zapisuje link.userData.visualMetrics.synergyBonus, nič nekreslí.
D:\ATOMA_CLEAN\ResonanceFeedback_v1.js — výlučne metriky/feedback, žiadny render.
Viditeľné len keď prejdú veľmi prísne trigger/gating (v praxi často 0)

D:\ATOMA_CLEAN\ResonanceEchoTrailSystem.js — potrebuje composite glyphs z linkSemanticPictograms.fusionZoneManager.compositeGlyphs alebo wave.* events; ak fusion/composites neběžia, nič sa nespawnne.
D:\ATOMA_CLEAN\ResonanceCascadeVisualization_Session117B.js — čaká na semanticBus eventy cascade.start/hop/end. Ak cascade eventy nebehajú, nič sa nedeje.
D:\ATOMA_CLEAN\CascadeResonanceWaveVisualization_Session146.js — iba ultra‑subtílna temporálna modulácia (žiadny mesh/particle), plus potrebuje cascade.hop; „viditeľnosť“ prakticky nulová.
D:\ATOMA_CLEAN\CascadeParticleSystem_Session120.js + D:\ATOMA_CLEAN\ParticleTrailIntegrationPatch_Session122.js — iba event‑driven cez cascade.hop; bez eventu nebude ani particle ani trail.
D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js — potrebuje wave field (waveEngine.getNode/LinkWaveField alebo node.userData.waveField) a amplitude nad thresholdmi; zároveň LOD gating + node musí mať active links.
D:\ATOMA_CLEAN\WaveInterferencePatternSystem_Session132.js — vyžaduje aktívne reflection pulzy z InfluenceReflectionBackPressureSystem; ak ten nevyprodukuje pulzy, interferencie nie sú.
D:\ATOMA_CLEAN\StandingWaveVisualRenderer_Session131.js — potrebuje active traps zo StandingWaveOscillationTrapSystem + materiály s uniformami. Ak traps nevzniknú, renderer nič nezobrazí.
D:\ATOMA_CLEAN\ResonanceRuptureVisualSystem_Session133.js — stojí na standing‑wave trapoch + event pressure; keď trapy nevzniknú, rupture nikdy nenastane.
D:\ATOMA_CLEAN\HarmonicRecoveryVisualSystem_Session138.js — spúšťa sa až po rupture; bez rupture je ticho.
D:\ATOMA_CLEAN\HarmonicHealingVisualSystem_Session134.js — v main.js sa volá s this.networkState, ale this.networkState sa nikde nenastavuje → state.harmony padá na 0 → prah 0.3 nikdy neprejde.
Integrácia pravdepodobne netrafí aktuálny renderer (API mismatch / iný mesh)

D:\ATOMA_CLEAN\VisualEchoTrails_v1_Integration.js — patchuje link.mesh.material. Ak linky rendruje Conduit/úplne iný mesh, echo shader sa neuplatní.
D:\ATOMA_CLEAN\SynergyBonusFXLayer_v1.js a D:\ATOMA_CLEAN\SynergyResonanceShaderPack_v1.js — oba očakávajú link.material, nie link.mesh.material. Pri conduit linkoch to často neexistuje → nulový efekt.
D:\ATOMA_CLEAN\SynergyCascadeFXBridge_v1.js — volá applyCascadeSignal / setCascadeIntensity na target systémoch, ale tieto metódy v aktuálnych Synergy shader packoch nie sú* → bridge síce emituje cascade.* eventy, ale priamy shader efekt je v praxi nula.
Možné “switch‑world” ticho (event bus rebind)

Viaceré systémy sa subscribujú na semanticBus iba v konštruktore a nemajú rebind (napr. D:\ATOMA_CLEAN\ResonanceCascadeVisualization_Session117B.js, D:\ATOMA_CLEAN\CascadeResonanceWaveVisualization_Session146.js, D:\ATOMA_CLEAN\ResonanceEchoTrailSystem.js). Ak sa pri world switch vymení semanticBus a instance sa znovu nerevytvorí, eventy prestanú chodiť.
Estetické hodnotenie: oplatí sa ich držať vs. nechať ticho

Stojí za to dostať do “viditeľnej rotácie” (ak sa raz úmyselne oživujú):

D:\ATOMA_CLEAN\CascadeParticleSystem_Session120.js + D:\ATOMA_CLEAN\ParticleTrailSystem_Session122.js — majú významové tvary (konflikt‑typy), čitateľné a semantické.
D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js — keď sú wave‑fieldy reálne, dáva silnú, ale stále systémovú spätnú väzbu (constructive/destructive/standing).
D:\ATOMA_CLEAN\ResonanceRuptureVisualSystem_Session133.js + D:\ATOMA_CLEAN\HarmonicRecoveryVisualSystem_Session138.js — dramatický, ale filozoficky legitímny (konflikt → ruptura → liečenie).
Skôr nechať tiché (príliš subtílne alebo bez skutočnej vizuálnej návratnosti):

D:\ATOMA_CLEAN\CascadeResonanceWaveVisualization_Session146.js — prakticky “neviditeľné by design”.
D:\ATOMA_CLEAN\PreCascadeVisualHint_Session146.js — extrémne subtilné a viazané na aury (ktoré si nechcel riešiť).
D:\ATOMA_CLEAN\SynergyPulseVisuals_v1.js — ±3% scale je skoro nepostrehnuteľné, ak nechceš mikropohyb šumu.
