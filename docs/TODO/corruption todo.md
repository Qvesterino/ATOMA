🔧 ATOMA — CORRUPTION / CASCADE ACTIVATION TODO
1️⃣ Prepojiť influence → reflection

Bez toho nič ďalšie nevznikne.

Spraviť:

HarmonicInfluencePropagationSystem
→ pridať getLinkInfluence(linkId)

Reflection systém to potrebuje.

Výsledok:

propagation waves
→ reflection pulses
2️⃣ Overiť že reflection pulses existujú

Runtime test:

world.influenceReflection.reflectionPulsePool.filter(p => p.active)

ak:

> 0

pipeline sa pohla.

3️⃣ Overiť StandingWaveTrap

Test:

world.standingWaveTrapSystem.oscillationTraps

ak:

> 0

funguje:

reflection → standing waves
4️⃣ Overiť rupture systém

Test:

world.resonanceRuptureVisualSystem.activeRuptures

ak:

> 0

funguje:

standing waves → rupture
5️⃣ Zapnúť cascade propagation

Systémy ktoré už máš:

PHASE5_CascadePropagationVisuals_v1
PHASE5_CascadeVisualizationBridge_v1
PHASE5_MultiNetworkOrchestrator_v1

Overiť že orchestrator má:

setCascadeVisuals(cascadePropagationVisuals)

čo podľa Codexu už máš.

6️⃣ Aktivovať corruption event trigger

Event ktorý už používaš:

corruptionThresholdCrossed

naň napojiť:

TIER4_CorruptionFeedbackVisuals
7️⃣ Aktivovať link corruption VFX

Systémy ktoré si auditoval:

LinkCorruptionParticleSystem
LinkCorruptionSpreadAnimator

tie majú bežať cez:

LinkRendererConduit

nie samostatný loop.

8️⃣ Zapnúť node corruption vizuál

Vybrať jeden systém:

NodeCorruptionAuraDegradation

alebo

CorruptionDrivenAuraDesaturationSystem

ale nie oba naraz.

Najlepšie napojiť na:

node.userData.corruption
9️⃣ odstrániť redundantný patch

ak používaš:

LinkCorruptionTransmission (5000 riadkov)

tak tento patch je zbytočný:

LinkCorruptionTransmissionIntegrationPatch_v1
10️⃣ audit scheduleru

všetky tieto systémy:

reflection
trap
rupture
cascade
corruption visuals

musia bežať v:

FrameScheduler.visual

nie v:

requestAnimationFrame
🧠 Keď toto dokončíš pipeline bude
harmonic influence
      ↓
reflection
      ↓
standing wave traps
      ↓
rupture
      ↓
cascade
      ↓
corruption feedback visuals

čo je presne ten ATOMA emergent behaviour stack.

⭐ moja rada (dôležité)

Nezapínaj všetko naraz.

poradie:

1 influence
2 reflection
3 traps
4 rupture
5 cascade
6 corruption visuals

inak nebudeš vedieť kde sa pipeline pokazí.