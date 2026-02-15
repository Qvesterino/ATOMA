# ATOMA CONSTITUTION v2
## CORE ENTITIES
### NODE
1. Definition

A *node* is a primary entity of a network.
It represents an autonomous computational point with state, metrics, and visual representation.

A *node* is:
- a persistent entity
- identifiable
- a bearer of intrinsic metrics
- part of a graph

2. Identity

- node.nodeId : string (immutable, unique)
- Assigned at creation
- Never recycles
- THREE.uuid is not used as a gameplay identity

**Principle**:
IdentityAuthority is the only system authorized to generate nodeId.

3. Category

node.category : Category (immutable)
**Category** is:
- a structural classification
- a gameplay role
- a spawn-time property
- Category does not change during runtime.

4. Archetype
node.archetype : Archetype (runtime mutable)

An archetype is:

a gameplay modifier

can affect initial metrics

can affect link behavior

can have a visual profile

Archetype ≠ Category.

5. State
node.state : NodeState
**NodeState** can be e.g.:
- functional
- corrupted
- disabled
- unstable

A node is not “killed” by removing its identity.
State is a runtime property.

6. Metrics (Intrinsic)

Node has intrinsic metrics:

node.metrics = {
synergy: 0..1,
harmony: 0..1,
corruption: 0..1,
stability: 0..1,
loadPressure: 0..1
}

Principles:

Values ​​are float 0..1

NodeMetrics is the source of truth for the visual

Only MetricAuthority is allowed to write to metrics

No other system is allowed to overwrite metrics.

II. LINK

1. Definition

A Link is a relationship between two Node entities.

Link:

represents the flow of influence

transmits dynamics

is a visual mediator of metrics

2. Identity

link.linkId : string (immutable)

link.sourceNodeId : string

link.targetNodeId : string

A link has its own identity

Identity is not just a combination of A+B

Node identities never change

3. Relational Metrics

A link has no intrinsic metrics.

LinkMetrics are derived:

link.metrics = {
synergyFlow,
harmonyFlow,
corruptionFlow,
loadTransfer
}

LinkMetrics are:

result of interaction between node A and B

calculated by MetricAuthority

never manually mutated by visual systems

III. METRIC SYSTEM
1. Authority

There is exactly one:

MetricAuthority

Responsible for:

node metrics calculation

link metrics calculation

fixed tick update

event-driven pulses

No one else is allowed to write to metrics.

2. Update Model

Metric system:

runs on a fixed tick (e.g. 10Hz)

reacts to event pulses

does not use per-frame mutation

FrameScheduler is not a metrics authority.

IV. VISUAL MODEL
1. Separation of layers

The visual system is a projection of the gameplay state.

We distinguish:

BaseVisual – basic representation of the entity

OverlayVisual – persistent layer

VFX – transient effects

2. Derivation principle

VisualState = f(GameplayState)

Visual must never override gameplay metrics.

3. Visual Authority

There is one:

VisualComposer

Model:

computeVisualState(node)

buffer result

apply in one pass

No per-frame concurrent writes to material.*.

V. SCENE OWNERSHIP

The scene is hierarchical.

worldRoot
├── nodesRoot
├── linksRoot
├── vfxRoot
├── uiRoot
└── debugRoot

Each system must declare which root branch it owns.

No system may add objects directly to the scene.

VI. ENGINE MODE

There is a global:

engine.mode

Possible values:

production

stabilization

debug

lockdown

No parallel feature-lock flags without mapping to EngineMode.

VII. AUTHORITY MODEL
Domain Authority
Identity IdentityAuthority
Spawn SpawnAuthority
Metrics MetricAuthority
Visual VisualComposer
Scene SceneAuthority
Time FrameScheduler