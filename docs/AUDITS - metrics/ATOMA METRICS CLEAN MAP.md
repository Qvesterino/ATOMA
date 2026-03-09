ATOMA METRIC CLEAN MAP
1️⃣ NODE METRICS (canonical truth)

jediný zdroj pravdy o stave node.

node.userData.metrics

structure:

node.userData.metrics = {

  synergy: 0..1,
  harmony: 0..1,
  stability: 0..1,
  corruption: 0..1,
  loadPressure: 0..1

}

canonical writers:

NodeMetricEngine
MetricsRuntime_v1
SafeMetricsDNAIntegration (spawn)

node metrics sú:

event impulses
+
10Hz relaxation
2️⃣ LINK METRICS (relationships)

vzťahy medzi node.

canonical container:

link.userData.synergy
link.userData.corruptionLevel

structure:

link.userData.synergy = {
  score: 0..1,
  synergyNorm: 0..1
}

canonical writers:

ComputeSynergyScore2_1
LinkCorruptionTransmission_v1

link metrics vznikajú z:

node metrics
+
topology
3️⃣ DERIVED METRICS (visual layer)

nikdy nemenia canonical metrics.

container:

node.userData.visualMetrics
link.userData.visualMetrics

example:

visualMetrics.synergy
visualMetrics.harmony
visualMetrics.stability
visualMetrics.loadPressure

typicky:

0–100 scale

writers:

VisualDerivedMetrics
SemanticMetricAdapter
NodeDynamicMetrics
4️⃣ GLOBAL METRICS (network view)

network agregácia.

container:

world.metrics.global

structure:

world.metrics.global = {

  networkSynergy,
  harmonyFlow,
  networkStress,
  corruptionLevel,
  loadPressure

}

writers:

NetworkMetricsAggregator
MetricsRuntime_v1
MetricInterpretationLayer

global metrics sú:

read-only aggregates
5️⃣ VISUAL REACTORS

čisto reakčné systémy.

sources:

node.metrics
link.metrics
visualMetrics
globalMetrics

systems:

LinkGlowSynergyEngine
HarmonyStabilizationSystem
CorruptionVisualFX
LinkRendererConduit
MegaGlyphSystem
MetricInterpretationLayer
SystemStateOverlay

visual layer:

never writes metrics
6️⃣ METRIC FLOW

celý pipeline:

NODE METRICS
(node.userData.metrics)
        ↓
COMPUTE SYSTEMS
(NodeMetricEngine / Runtime)
        ↓
LINK METRICS
(link.userData.synergy)
        ↓
GLOBAL METRICS
(world.metrics.global)
        ↓
VISUAL SYSTEMS
(VFX / HUD / Audio)
7️⃣ SINGLE WRITER LAW

každá canonical metric má jedného vlastníka.

synergy        → ComputeSynergyScore2_1
harmony        → NodeMetricEngine + Runtime
stability      → NodeMetricEngine + Runtime
corruption     → LinkCorruptionTransmission
loadPressure   → NodeMetricEngine

ostatné systémy:

read only
8️⃣ FORBIDDEN WRITES

zakázané:

visual systems writing metrics
node.userData.synergy
node.userData.harmony
node.userData.stability
node.userData.corruption
node.userData.loadPressure

všetko musí ísť cez:

node.userData.metrics.*
9️⃣ LEGACY FIELDS (to remove)
node.userData.synergy
node.userData.harmony
node.userData.stability
node.userData.corruption
node.userData.loadPressure

link['synergyScore']
link.userData.synergy2_1

canonical containers sú:

node.userData.metrics
link.userData.synergy
🔟 FINAL ARCHITECTURE
NODE STATE
node.userData.metrics
        ↓
LINK RELATIONSHIPS
link.userData.synergy
link.userData.corruptionLevel
        ↓
GLOBAL NETWORK STATE
world.metrics.global
        ↓
VISUAL / AUDIO / HUD