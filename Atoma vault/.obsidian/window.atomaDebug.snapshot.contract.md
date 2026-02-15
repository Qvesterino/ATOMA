🔹 1️⃣ window.atomaDebug – READ-ONLY SNAPSHOT CONTRACT

This is a pure data view model.

No live references to engine objects.

interface AtomaDebugSnapshot {
engine: EngineInfo
performance: PerformanceInfo
systems: SystemInfo[]
world: WorldInfo
nodes: NodeDebugView[]
links: LinkDebugView[]
events: EventEntry[]
}

ENGINE
interface EngineInfo {
mode: "production" | "stabilization" | "debug" | "lockdown"
timeScale: number
isPaused: boolean
frame: number
}

Connected to:

engine.mode (VI. ENGINE MODE

ATOMA_ENTITIES_CONSTITUTION_v2

)

FrameScheduler (Authority model)

PERFORMANCE

Read only.

interface PerformanceInfo {
fps: number
frameTimeMs: number
rendererPrograms: number
materials: number
geometries: number
drawCalls: number
}

No mutation.

SYSTEMS (Authority map projection)

This must be registered centrally.

interface SystemInfo {
name: string
authority:
| "FrameScheduler"
| "MetricAuthority"
| "VisualComposer"
| "SceneAuthority"
| "SpawnAuthority"
| "IdentityAuthority"
enabled: boolean
lastTickMs?: number
errorState?: boolean
}

Important:

The Control Panel must not disable Authority itself.
Only systems registered under the scheduler.

NODE DEBUG VIEW

We respect Constitution:

nodeId immutable

category immutable

archetype mutable

metrics 0..1

state runtime

interface NodeDebugView {
nodeId: string
category: string
archetype: string
state: string

metrics: {
synergy: number
harmony: number
corruption: number
stability: number
loadPressure: number
}

derived: {
vulnerability: number
isolation: boolean
linkCount: number
}
}

Important:

vulnerability is a read-only derivation according to Core Physics

ATOMA_CORE_PHYSICS_CONSTITUTION…

:

vulnerability = (1 - harmony) * (1 - synergy) * loadPressure

This can be displayed in the snapshot, but MUST NOT be written.

LINK DEBUG VIEW

We respect:

link has identity

link has no intrinsic metrics

metrics are derived

interface LinkDebugView {
linkId: string
sourceNodeId: string
targetNodeId: string
integrity: number

metrics: {
synergyFlow: number
harmonyFlow: number
corruptionFlow: number
loadTransfer: number
}
}

No manual mutation.

EVENT ENTRY
interface EventEntry {
timestamp: number
domain: "visual" | "metrics" | "linking" | "scheduler"
message: string
severity: "info" | "warning" | "error"
}

🔹 2️⃣ window.atomaBridge – COMMAND CONTRACT

Here is the critical part.

UI must not do:

node.metrics.corruption = 0.8

Must do:

window.atomaBridge.execute("overrideMetric", {...})

Bridge Contract
interface AtomaBridge {
execute(
command: string,
payload?: any
): Promise<CommandResult>
}

Allowed Commands (MVP)

World Control

pauseWorld()

resumeWorld()

stepFrame()

setEngineMode(mode)

System Control

toggleSystem(systemName: string, enabled: boolean)

But only if:

system belongs to the registry

is not an Authority core

Metric Override (SAFE VERSION)

You have to be careful here.

Constitution says:

Only MetricAuthority may write metrics.

ATOMA_ENTITIES_CONSTITUTION_v2

So the override has to go through MetricAuthority.

overrideMetric({
nodeId: string,
metric: "synergy" | "harmony" | "corruption" | "stability" | "loadPressure",
value: number,
mode: "temporary" | "persistent"
})

Bridge:

validates 0..1

calls MetricAuthority API

writes override layer

never directly to node.metrics

Kill All Links (debug only)

removeAllLinks()

Must go through SceneAuthority / SpawnAuthority.

🔥 CRITICAL ARCHITECTURAL MOMENT

You must introduce:

SYSTEM REGISTRY

No implicit initializations.

Every system:

SystemRegistry.register({
name: "NodeVisualStateBinder",
authority: "VisualComposer",
canDisable: true,
isCore: false
})

Control Panel will read the registry.