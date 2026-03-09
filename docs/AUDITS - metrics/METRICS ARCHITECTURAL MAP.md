┌─────────────────────────────────────────────┐
│                NODE SPAWN                   │
│ SafeMetricsDNAIntegration                  │
│ MetricCompatibilityLayer                   │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│        CANONICAL NODE METRICS STORAGE       │
│                                             │
│ node.userData.metrics = {                   │
│   synergy      0..1                         │
│   harmony      0..1                         │
│   stability    0..1                         │
│   corruption   0..1                         │
│   loadPressure 0..1                         │
│ }                                           │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│              EVENT IMPULSES                 │
│                                             │
│ NodeMetricEngine                            │
│                                             │
│ Examples:                                   │
│ onNodeLinked                                │
│ onNodeOverload                              │
│ onNodeFailure                               │
│ onLinkCreated                               │
│                                             │
│ modifies RAW impulses                       │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│              PROPAGATION SYSTEMS            │
│                                             │
│ LinkCorruptionTransmission                  │
│ HarmonyStabilizationSystem                  │
│ PHASE5_NetworkSynchronization               │
│                                             │
│ Node ↔ Link feedback loops                  │
│                                             │
│ corruption propagation                      │
│ harmony healing                             │
│ synergy defense                             │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│              METRICS KERNEL                 │
│                                             │
│ MetricsRuntime_v1                           │
│                                             │
│ Fixed Tick: 10 Hz                           │
│                                             │
│ Responsibilities:                           │
│                                             │
│ apply interaction kernel                    │
│ clamp metrics 0..1                          │
│ apply decay                                 │
│ apply stabilization                         │
│                                             │
│ this is the "heart beat"                    │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│             DERIVE LAYER                    │
│                                             │
│ MetricInterpretationLayer_v1                │
│                                             │
│ converts gameplay metrics → visual signals  │
│                                             │
│ visualCorruptionIntensity                   │
│ visualIntegrityHealth                       │
│ visualHarmonyAuraStrength                   │
│ visualSynergyGlowIntensity                  │
│ visualNodeVitalityScore                     │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│             LINK DERIVE SYSTEMS             │
│                                             │
│ ComputeSynergyScore2_1                      │
│ LinkQualityCalculator                       │
│ SynergyBonusVisualization                   │
│                                             │
│ link.userData.synergy2_1                    │
│ link.userData.quality                       │
│ link.userData.synergyBonus                  │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│              VISUAL SYSTEMS                 │
│                                             │
│ Aura Systems                                │
│ Link Glow Systems                           │
│ Shader Packs                                │
│ FX Layers                                   │
│ Particle Systems                            │
│                                             │
│ READ ONLY                                   │
│                                             │
│ no metric mutation allowed                  │
└─────────────────────────────────────────────┘
---

_______GLOBAL_______________
engine.metrics = {

  global: {
    networkSynergy,
    harmonyFlow,
    networkStress,
    corruptionLevel
  }
}
---
______NODE____________

node.userData.metrics.synergy
node.userData.metrics.harmony
node.userData.metrics.stability
node.userData.metrics.corruption
node.userData.metrics.loadPressure
---
_______NODE METRICS (truth layer)________
node.userData.metrics = {
  synergy: 0..1,
  harmony: 0..1,
  stability: 0..1,
  corruption: 0..1,
  loadPressure: 0..1
}
---
LINK

link.userData.synergy
link.userData.corruptionLevel
link.userData.quality
____________


**Truth layer**
node.userData.metrics

je jediná kanonická pravda.

**Kernel**
MetricsRuntime_v1

je heartbeat systému.

**Visual**
Visual systémy sú:
- read only
- nikdy nesmú meniť metrics.

---

Kľúčové pravidlo (veľmi dôležité)

Global metrics sú:

READ ONLY

Nikdy: global → node

iba:node → global

Inak vznikajú:
feedback chaos
---
_____Príklad reálneho toku_____
node layer
nodeA.metrics.harmony
nodeB.metrics.harmony
↓
link layer
link.synergy = f(nodeA, nodeB)
↓
global layer
networkSynergy = avg(all link.synergy)
↓
visual
HUD
VFX
map aura
network pulse
Veľmi dobré čo máš v dokumente

Toto je presne správna veta:

Global metrics never overwrite node metrics