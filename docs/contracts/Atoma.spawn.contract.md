Version: 2.0
Status: Constitution-Level Contract

I. PURPOSE

Spawn system is the only authority allowed to create:

Node entities

Link entities (future extension)

Spawn defines:

identity

archetype

category

initial metrics

scene attachment

Spawn must be deterministic.

II. SINGLE SPAWN AUTHORITY

There exists exactly one:

SpawnAuthority


Currently implemented via:

AINodes.spawnNode()


No other system may instantiate gameplay nodes.

Factories may create meshes —
but only SpawnAuthority creates entities.

III. ARCHETYPE REGISTRY (Inherited Principle)

From original contract 

Atoma Spawn.contract

ArchetypeRegistry remains:

The single source of truth for spawnable archetypes.

No system may:

define archetypes independently

generate archetype keys dynamically

contain hidden variant arrays

All archetypes must be declared once.

IV. CANONICAL SPAWN PIPELINE (v2)

Updated to reflect Constitution:

Scheduler
→ SpawnAuthority.requestNextSpawn()
→ ArchetypeRegistry.getNext(category)
→ SpawnAuthority.spawnNode(archetypeKey)
→ IdentityAuthority.generateNodeId()
→ NodeFactory.create(archetype)
→ Registry.register(node)
→ SceneAuthority.attach(node, nodesRoot)


No direct scene.add in factories.

No implicit registration.

V. IDENTITY CONTRACT

Each spawned node must have:

node.userData.nodeId        (immutable, unique)
node.userData.archetypeKey  (required)
node.userData.category      (required)


Rules:

nodeId generated exactly once.

Never reassigned.

Never recycled.

Never derived from uuid.

IdentityAuthority is the only system allowed to generate nodeId.

VI. CATEGORY RULE

Category is:

Immutable

Assigned at spawn

Gameplay structural classification

Category must come from ArchetypeRegistry.

SpawnAuthority may not override category arbitrarily.

VII. ARCHETYPE RULE

Archetype is:

Required

Explicit

Must exist in ArchetypeRegistry

May not be generated dynamically

If archetype is missing:

Spawn must fail safely.

No fallback to random archetype.

VIII. NODE REGISTRATION

After creation:

NodeRegistry.register(nodeId, node)


Registration must happen before:

Scene attachment

Interaction binding

Metric initialization

Registries are authoritative.
Scene is not.

IX. SCENE ATTACHMENT RULE

SpawnAuthority must attach nodes to:

scene.nodesRoot


Never:

scene.add(node)


Root groups are mandatory (Constitution requirement).

X. FORBIDDEN SPAWN PATTERNS

❌ Hardcoded variant arrays inside factories
❌ Runtime archetype key generation
❌ Multiple spawn entry points
❌ Scene attachment inside factory
❌ Implicit registration
❌ Identity mutation after creation

XI. UNIQUENESS POLICY

If archetype has:

unique: true


SpawnAuthority must:

Check NodeRegistry for existing archetypeKey

Refuse duplicate spawn

Return null

No retry loops inside spawn.

Scheduler handles fallback.

XII. FAILURE MODEL

If spawn fails due to:

missing archetype

duplicate unique archetype

identity generation failure

SpawnAuthority must:

return null

never partially attach node

never leave orphan mesh

XIII. MIGRATION POLICY

Legacy systems may:

Contain variant arrays

Use category-based random selection

Rules:

New archetypes → registry only

Old systems → migrate when modified

No new hidden archetypes allowed

XIV. WORLD SWITCH SAFETY

SpawnAuthority must not:

Persist stale references

Store direct mesh references outside registry

Reuse nodeId across world resets

World reset must:

Clear NodeRegistry

Clear scene.nodesRoot

Reset identity counters only if world is fully destroyed

XV. DEBUG SAFETY CHECK (Recommended)

On spawn:

if (!node.userData.nodeId) {
  console.error("[SpawnContract] Missing nodeId");
}

if (!node.userData.archetypeKey) {
  console.warn("[SpawnContract] Missing archetypeKey");
}

XVI. SUMMARY

SpawnAuthority is:

Deterministic

Single-entry

Registry-first

Identity-driven

Scene-root compliant

ArchetypeRegistry remains single source of truth 

Atoma Spawn.contract

No hidden variants.
No distributed spawn logic.
No identity guessing.