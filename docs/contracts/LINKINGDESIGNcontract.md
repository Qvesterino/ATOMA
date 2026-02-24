🧠 ATOMA — Linking System Design Contract
Version 0.3 — Authority, Domains & Baseline Visual Model
🎯 0. Purpose of This Contract

This document defines the non-negotiable architectural rules for the ATOMA Linking System.

Its purpose is to:

establish clear authority ownership

prevent hidden side-effects

preserve emergent behavior

enable safe long-term evolution

guarantee visual determinism without gameplay mutation

This contract is binding for all future linking work.

🧱 1. Core Principles (Invariants)
I1 — Single Authority per Responsibility

Each responsibility has exactly one owning domain.

If a subsystem mutates multiple responsibility types
→ it is an architectural risk.

I2 — Direction of Influence Is One-Way

Structural → Semantic → Visual → Interpretive

Reverse influence is forbidden.

I3 — Linking Never Owns Node Visuals

Linking may:

emit influence signals

request visual responses

It may never:

own node visual identity

restore node visuals directly

I4 — Semantics Cannot Mutate Structure Directly

Semantic systems:

may evaluate

may request

may recommend

They may never:

create links

remove links

mutate topology directly

I5 — Visual Systems Are Read-Only

Visual systems:

may read semantic state

may animate freely

They may never mutate:

node.userData

link.userData

structural topology

Visuals reflect truth.
They never create it.

I6 — Time Is Explicit

No system may:

silently change cadence

mix frame and tick logic without orchestration

Execution timing is a first-class architectural concern.

✨ I7 — Baseline Link Visibility Is Always ON

Every existing link has a minimal visual presence.

A link:

never disappears visually because of low metrics

never requires metric thresholds to render

Metrics are modulators, not gates.

🧩 2. Linking Domains

(keeping your domain separation — it’s solid)

2.1 Structural Domain

Owns topology only.

Allowed:

create/remove links

repair

indexing

Forbidden:

semantic mutation

visual mutation

time-based decay logic

2.2 Semantic Domain

Owns meaning.

Allowed:

corruption propagation

harmony/synergy evaluation

quality

aging

collapse decisions

Forbidden:

direct topology mutation

visual ownership

Structural changes must be expressed as requests.

2.3 Visual Domain

Owns appearance only.

Allowed:

curves, conduits

color, thickness, particles

transitions, shaders

visual smoothing

non-authoritative derived states

Forbidden:

semantic mutation

structural mutation

logic mutation

🎨 3. Link Rendering Model (Baseline + Modulation)

This section formalizes your new philosophy.

Layer A — Baseline Conduit (Always Active)

Every link renders with:

alphaMin

thicknessMin

flowSpeedMin

subtle directional streaks

This layer guarantees:

network readability

structural visibility

aesthetic continuity

Baseline must not depend on semantic thresholds.

Layer B — Metric Modulation (Additive)

Canonical metrics (0..1) modulate intensity:

synergy / harmony

increase flow brightness

increase bead frequency

increase spark density

increase animation speed

corruption

introduce jitter

add glitch noise

shift tint toward toxicity palette

amplify distortion

loadPressure

pulse amplitude

turbulence frequency

shimmer instability

stability

damp jitter

smooth turbulence

stabilize noise

⚠ Anti-Pattern: Metric Gating

❌ DO NOT:

if (synergy < X) return;

❌ DO NOT:

if (!corruption) disableEffect();

✅ DO:

intensity = lerp(minIntensity, maxIntensity, metric);

Effects scale.
They do not toggle existence.

🔌 4. Visual Input Contract (Formalized)

Link Visual Systems may read:

Canonical Node Metrics (0..1)

synergy

harmony

stability

corruption

loadPressure

Canonical Link Semantics (if defined)

quality

age

stress

semantic flags

Structural Facts

endpoints

direction vector

distance

linkCount

topology position

Visual Systems may write:

shader uniforms

material parameters

particle spawn rate

internal visual caches

They may never:

mutate canonical metrics

write structural data

override semantic state

🔁 5. Semantic Order Invariant

Within one evaluation window:

corruption propagation

quality evaluation

degradation

collapse evaluation

structural requests emission

Breaking this order creates instability.

🧬 6. Mutation Contract

Structural mutation:

executed only by Structural Domain

Semantic mutation:

deterministic inside its time domain

never immediate topology change

Visual mutation:

reversible

non-authoritative

frame-local

🛑 7. Do / Don’t
✅ DO

preserve authority boundaries

keep baseline always visible

modulate, don’t gate

document ownership before refactors

❌ DON’T

let visuals drive logic

introduce hidden writers

silence cadence drift

use thresholds to hide structural existence

🧠 8. Status

This contract is:

authority-safe

baseline-visual compliant

future-proof for VFX expansion

binding for next development phase