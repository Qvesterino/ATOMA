ATOMA — CORRUPTION SYSTEMS MAP (for Qvester / OpenClaw)

CIEĽ
Zmapovať všetky existujúce corruption systémy v ATOMA a ich pipeline,
aby bolo možné ich postupne aktivovať a stabilizovať.

---

LAYER 1 — METRIC SOURCE

node.userData.corruption

writers:

* node corruption writers
* corruption metric writers
* link corruption transmission

stav:
✔ existuje
✔ zapisuje metric
⚠ treba audit či všetky writers používajú rovnaký field

---

LAYER 2 — PROPAGATION LOGIC

LinkCorruptionTransmission
(~5000 riadkov)

funkcia:
šíri corruption cez link graph

pipeline:

node corruption
→ link corruption
→ neighbor nodes

stav:
✔ existuje
✔ core propagation system
⚠ treba audit traversal safety

---

LAYER 3 — VISUAL LINK SYSTEMS

LinkCorruptionParticleSystem
LinkCorruptionSpreadAnimator

funkcia:

corruption link vizualizácia

vizuály:

* glitch particles
* corruption spread wave
* link infection effect

stav:

✔ existuje
⚠ pravdepodobne nie je pripojený na ConduitRoot
⚠ treba overiť update() v LinkRendererConduit

---

LAYER 4 — NODE CORRUPTION VFX

možné systémy:

NodeCorruptionAuraDegradation
CorruptionDrivenAuraDesaturationSystem
CorruptionVisualFX_v1

funkcia:

node vizuál pri corruption

efekty:

* aura desaturation
* color shift
* node surface decay

stav:

✔ implementované
⚠ vybrať iba jeden systém
⚠ napojiť na node.userData.corruption

---

LAYER 5 — EVENT SYSTEM

event:

corruptionThresholdCrossed

použitie:

trigger vizuálnych reakcií

systémy:

TIER4_CorruptionFeedbackVisuals_v1

vizuály:

* corruption seed
* cascade ripple
* node pulse

stav:

✔ existuje
✔ event wiring možné
⚠ treba definovať threshold

---

LAYER 6 — NETWORK PHYSICS

InfluenceReflectionBackPressureSystem
StandingWaveOscillationTrapSystem
ResonanceRuptureVisualSystem

pipeline:

influence
→ reflection
→ standing wave trap
→ rupture

stav:

✔ systémy existujú
✔ scheduler wiring existuje
⚠ treba overiť influence API

---

LAYER 7 — CASCADE SYSTEM

systémy:

CascadingRuptureSystem
PHASE5_CascadePropagationVisuals
PHASE5_CascadeVisualizationBridge
PHASE5_MultiNetworkOrchestrator

pipeline:

rupture
→ cascade propagation
→ multi-network events

stav:

✔ implementované
✔ orchestrator aktívny
⚠ treba overiť rupture trigger

---

FULL CORRUPTION PIPELINE

node corruption metric
↓
LinkCorruptionTransmission
↓
LinkCorruption VFX
↓
node corruption VFX
↓
corruptionThresholdCrossed
↓
TIER4 feedback visuals
↓
reflection / standing wave
↓
rupture
↓
cascade propagation

---

OPENCLAW TASKS (Qvester)

TASK 1
audit či HarmonicInfluencePropagationSystem poskytuje
getLinkInfluence()

TASK 2
overiť že LinkCorruptionParticleSystem a
LinkCorruptionSpreadAnimator sú napojené
na LinkRendererConduit

TASK 3
vybrať jeden node corruption VFX systém
a pripojiť ho na node.userData.corruption

TASK 4
overiť že TIER4_CorruptionFeedbackVisuals
počúva event corruptionThresholdCrossed

TASK 5
overiť rupture trigger pipeline

StandingWaveTrap
→ ResonanceRupture
→ CascadingRupture

---

EXPECTED RESULT

aktivovaná corruption dynamika:

corruption spread
→ visual decay
→ rupture
→ cascade storms
