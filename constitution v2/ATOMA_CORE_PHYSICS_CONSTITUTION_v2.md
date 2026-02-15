ATOMA CONSTITUTION v2
CORE PHYSICS – DEFINITIONS (Draft 1)
I. GRAPH MODEL

The graph is undirected.

A link represents a symmetric relationship.

There is no gameplay-level source/target.

There can be at most one link between two nodeIds.

GraphModel: Undirected
LinkConstraint: max 1 link per node pair

### II. NODE STRUCTURE

A node has:
- immutable nodeId
- immutable category
- required archetype (fallback UNDEFINED)
- runtime state
- intrinsic metrics (0..1)

node.metrics = {
synergy,
harmony,
corruption,
stability,
loadPressure
}

- Metrics are float 0..1 and are gameplay truth.

### III. CORRUPTION PROPAGATION PRINCIPLE

Corruption:

does not spread automatically

only spreads when there is vulnerability

Vulnerability Gate
vulnerability = (1 - harmony)
* (1 - synergy)
* loadPressure

Corruption only grows when vulnerability is high.

IV. HARMONY PRINCIPLE

Harmony:

increases synergy

reduces vulnerability

actively heals corruption

That means:

dCorruption -= healingFactor * harmony * coherence * dt

ATOMA is a system of equilibrium, not pure entropy.

V. LINK INTEGRITY MODEL

A link has:

link.integrity : 0..1

Integrity is derived.

Corruption:

first damages the link

the link can break

a broken link isolates the node

isolation causes node collapse

This creates network disintegration.

VI. NODE COLLAPSE PRINCIPLE

A ​​node does not cease to exist.
A node collapses when:
- it is isolated
- corruption > threshold
- stability < threshold
- A collapse is an emergent consequence, not a direct intervention.