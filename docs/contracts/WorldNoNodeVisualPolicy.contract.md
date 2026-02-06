WorldNoNodeVisualPolicy.contract.md
Purpose

This policy defines a hard boundary between World visuals and Node visuals in ATOMA.

Its goal is to prevent any world-layer system from spawning visuals that resemble, impersonate, or substitute Nodes, regardless of category, intent, or legacy behavior.

Core Principle

No visual object in a World may visually represent a Node unless it is created through the canonical Node pipeline.

There are no exceptions.

Definitions
Node Visual

A visual object that:

Represents a logical Node (Input, Process, Integration, Sigma, etc.)

Appears selectable, inspectable, or comparable to Nodes

Uses node-like geometry (spheres, cores, glyphs, orbits, canonical silhouettes)

Node visuals must:

Be created exclusively via AINodes.createNode(...)

Use EnhancedNodeModels as the sole geometry source

Have a valid nodeId lifecycle

World Visual

A visual object that:

Belongs to a map, environment, or background

Is decorative, atmospheric, or structural

Has no node lifecycle, no logic authority, and no inspection semantics

World visuals must not:

Use node-like geometry

Use node categories (input, integration, sigma, etc.)

Be inspectable as Nodes

Masquerade as disabled, failed, or fallback Nodes

Hard Prohibitions (Non-Negotiable)

World systems MUST NOT:

Spawn THREE.Mesh objects that resemble Nodes

Assign node categories (input, process, integration, sigma, quantum, etc.)

Add objects directly to the scene that visually match Node silhouettes

Implement “ambient”, “placeholder”, or “fallback” node-like visuals

Recreate legacy node shapes outside the Node pipeline

If a visual looks like a Node, it must be a Node.

Allowed World Visuals

Worlds MAY spawn visuals that are:

Terrain, platforms, cliffs, voids

Abstract geometry clearly distinguishable from Nodes

Large-scale background structures

Non-interactive landmarks with no node semantics

Effects without selectable or inspectable affordances

World visuals must be visually disjoint from the Node language.

Failure Behavior

If a World attempts to spawn a Node-like visual:

The visual must not render

A console error must be logged

Execution must continue without fallback

No substitute geometry may appear

Silent degradation is forbidden.

Enforcement Expectations

Engine-level safeguards are expected to:

Detect Node-like categories outside the Node pipeline

Reject visuals lacking a valid nodeId

Prevent scene insertion of unauthorized Node impostors

Make violations obvious during development

Rationale

Visual ambiguity breaks player intuition

Node authority must remain centralized

Legacy world systems must not undermine canonical design

A broken Node is preferable to a misleading Node

Design Philosophy

Absence is cleaner than corruption.
Errors are preferable to lies.

If a Node cannot exist correctly, it must not exist visually at all.

Status: ACTIVE
Scope: All Worlds, Maps, Environments
Applies to: Past, Present, and Future content