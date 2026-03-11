ATOMA — CORRUPTION PIPELINE ACTIVATION (Qvester TASK PLAN)

CIEĽ
Aktivovať existujúce corruption / rupture / cascade systémy bez pridávania
nových systémov. Iba prepojiť existujúce.

PRAVIDLÁ

* žiadne nové súbory
* žiadne gameplay zmeny
* iba wiring / event hooks / API expose
* všetko musí zostať v existujúcom FrameScheduler

---

TASK 1 — FIX INFLUENCE API

PROBLÉM
InfluenceReflectionBackPressureSystem očakáva:

harmonicInfluenceSystem.getLinkInfluence(linkId)

ale HarmonicInfluencePropagationSystem to neexponuje.

ÚLOHA

pridať do

HarmonicInfluencePropagationSystem_Session127

metódu:

getLinkInfluence(linkId) {
const flow = this.linkInfluenceState.get(linkId);
if (!flow) return 0;
return flow.progress ?? 0;
}

OČAKÁVANÝ VÝSLEDOK

Reflection systém začne detegovať influence.

---

TASK 2 — VERIFY REFLECTION PULSES

Overiť že

InfluenceReflectionBackPressureSystem

generuje:

reflectionPulsePool.active === true

Ak nie:

skontrolovať

incomingInfluence
pressureZones
_emitReflectionPulses()

---

TASK 3 — VERIFY STANDING WAVE TRAPS

StandingWaveOscillationTrapSystem musí čítať:

reflectionPulsePool

Ak používa inú štruktúru:

reflectionPulses

pridať adapter ktorý mapuje:

reflectionPulsePool → reflectionPulses

---

TASK 4 — VERIFY RUPTURE TRIGGER

ResonanceRuptureVisualSystem musí čítať:

standingWaveTrapSystem.oscillationTraps

Ak traps existujú:

spawn rupture visual.

---

TASK 5 — ACTIVATE CASCADE PROPAGATION

Prepojiť:

ResonanceRuptureVisualSystem
→ CascadingRuptureSystem

ak rupture vznikne:

triggerCascade(originNode)

---

TASK 6 — VERIFY CASCADE VISUALS

Cascade pipeline:

CascadingRuptureSystem
→ PHASE5_CascadePropagationVisuals
→ PHASE5_CascadeVisualizationBridge
→ PHASE5_MultiNetworkOrchestrator

Overiť že orchestrator má:

setCascadeVisuals(cascadePropagationVisuals)

---

TASK 7 — ACTIVATE CORRUPTION LINK VFX

Overiť že tieto systémy sú registrované v:

LinkRendererConduit.update()

LinkCorruptionParticleSystem
LinkCorruptionSpreadAnimator

Ak nie:

pridať update hook.

---

TASK 8 — ACTIVATE NODE CORRUPTION VFX

Vybrať jeden systém:

NodeCorruptionAuraDegradation

napojiť na:

node.userData.corruption

threshold:

corruption > 0.35

---

TASK 9 — ACTIVATE CORRUPTION EVENT

Event:

corruptionThresholdCrossed

trigger:

if (node.corruption > threshold)

listener:

TIER4_CorruptionFeedbackVisuals_v1

---

TASK 10 — FINAL PIPELINE CHECK

Očakávaný runtime chain:

harmonic influence
→ reflection pulses
→ standing wave traps
→ rupture visuals
→ cascade propagation
→ corruption visuals

---

DEBUG (VOLITEĽNÉ)

v runtime expose:

window.atomaCorruptionDebug = {
reflection: world.influenceReflection,
traps: world.standingWaveTrapSystem,
rupture: world.resonanceRuptureVisualSystem
}

---

SUCCESS CONDITION

runtime musí produkovať:

reflection pulses
standing wave traps
rupture events
cascade propagation

bez runtime errors.
