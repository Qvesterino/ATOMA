🧬 HARMONY CLEANUP TODO (ATOMA SAFE PLAN)
🎯 STRATÉGIA

malé kroky, vždy validácia
žiadne “big bang refactor”

🥇 FÁZA 1 — STABILIZÁCIA PRAVDY
🔧 TODO 1: Single Source of Truth

cieľ: odstrániť dualitu v HarmonyStabilizationSystem

 nájsť interné tracking fields (this.nodeHarmony, atď.)
 odstrániť ich (alebo disable)
 ponechať LEN:
node.userData.*
link.userData.*
 overiť:
či sa stále zapisujú hodnoty
či visual systémy dostávajú dáta

👉 STOP ak sa niečo rozbije

🧪 VALIDÁCIA 1
 node metrics sa menia
 halo / aura sa stále renderuje
 žiadne undefined v konzole
🥈 FÁZA 2 — ODSTRÁNENIE ŠUMU
🔥 TODO 2: Session purge (low risk high reward)

vymazať:

 HarmonicRecoveryVisualSystem_Session138.js
 HarmonicPhaseSynchronization_Session146.js
 HarmonicCascadeAmplification_Session145.js
 HarmonicAudioReactivitySystem_Session135.js
 HarmonicHealingVisualSystem_Session134.js
🔥 TODO 3: Patch purge
 HarmonicHubAuraIntegrationPatch_Session126.js
 HarmonicInfluencePropagationIntegrationPatch_Session127.js
 HarmonyStabilizationIntegrationPatch_v1.js
🧪 VALIDÁCIA 2
 app sa spustí bez erroru
 nič “magicky nezmizlo”
 frameScheduler beží normálne
🥉 FÁZA 3 — ROZHODOVACIE CENTRUM
⚔️ TODO 4: Hub authority

rozhodni:

👉 kto definuje hub?

 NodeHarmonicManager
 HarmonicHubAuraSystem
potom:
 druhý systém:
odstrániť hub detection
alebo prepnúť na read-only
🧪 VALIDÁCIA 3
 hub nodes sa stále správajú správne
 žiadne duplicity efektov
🏁 FÁZA 4 — HALO PIPELINE
🧠 TODO 5: unify halo input
 nájsť všetky halo inputs:
hubSystemData
harmonicManagerData
node.userData
controllers
 vybrať jediný:
node.userData.halo*
 ostatné zdroje:
odstrániť
alebo ignorovať
🧪 VALIDÁCIA 4
 halo reaguje konzistentne
 žiadne flicker / random správanie
🧹 FÁZA 5 — DEBUG CLEANUP
🐛 TODO 6: debug purge
 T4004_HARMONY_HEALING_TEST_RUNNER.js
 HarmonicHubDebugger.js

👉 (alebo presun do /debug)

🧬 BONUS (ak chceš ísť deeper)
TODO 7: Data flow assert

pridaj mini check:

if (!node.userData.harmonicPhase) {
  console.warn("HARMONY PIPELINE BROKEN");
}

👉 rýchly detector budúcich bugov

🧠 MENTAL MODEL

po tomto:

Metrics → HarmonyStabilization → userData → Visual

👉 nič medzi tým
👉 žiadne paralelné pravdy