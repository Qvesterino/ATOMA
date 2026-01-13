## 🧠 DECISIONS_LOG.md
Why things are the way they are
**PURPOSE**
This document records important decisions made during the development of ATOMA.

It does not document:
- daily progress
- implementation details
- experiments that were discarded

It documents:
- decisions that shape identity
- trade-offs
- constraints chosen intentionally
- If you are confused why something exists or why something was not done — start here.

**HOW TO USE THIS LOG**
- Add entries only when a decision matters long-term
- Keep entries short and factual
- Never rewrite history
- Never delete old decisions
- This is a memory, not a task list.

ENTRY TEMPLATE
## [YYYY-MM-DD] Decision: <Short title>

### Context
(What was the situation? What problem or tension existed?)

### Decision
(What was chosen? Be precise.)

### Alternatives Considered
- Option A
- Option B
- Option C

### Why This Was Chosen
(The reasoning. Constraints. Philosophy.)

### Consequences
(What this enables. What this forbids.)

### Status
Active | Reconsidered | Deprecated

EXAMPLE ENTRY (REFERENCE)
## [2026-01-05] Decision: Use subtle network pressure instead of UI warnings

### Context
- High corruption levels needed to be communicated to the player.
- Classic UI warnings or alerts were considered but felt intrusive.

### Decision
Network pressure will be communicated through subtle visual deformation
and temporal instability of links instead of explicit UI elements.

### Alternatives Considered
- Red warning icons
- Flashing node outlines
- Pop-up alerts

### Why This Was Chosen
- ATOMA favors interpretability through the system itself.
- UI overlays would break immersion and reduce emergent reading of the network.

### Consequences
- Visual language must be expressive but restrained
- Effects must scale with intensity
- Debug tools must compensate for lack of explicit UI

### Status
Active

CATEGORIES OF DECISIONS (OPTIONAL TAGS)

You may optionally prefix titles with tags:

[ARCH] Architecture

[DESIGN] Visual / UX philosophy

[SYSTEM] Core mechanics

[AI] AI usage / orchestration

[SCOPE] Constraints / limitations

[TECH] Technology choices

Example:

## [2026-01-08] [AI] Decision: Keep ChatGPT as single architectural authority

**WHEN TO ADD AN ENTRY (RULE OF THUMB)**

Add a decision only if:
- you would forget why this was done in 3 months
- reversing it later would be painful
- it affects multiple systems
- it protects ATOMA’s identity

Do NOT add entries for:
- bug fixes
- visual tweaks
- failed experiments

RELATIONSHIP TO OTHER DOCUMENTS

- ATOMA_OVERVIEW.md → what ATOMA is
- DECISIONS_LOG.md → why ATOMA is this way
- DAILY_STATE.md → what is happening now

Together they form project memory.

## FINAL NOTE

Decisions recorded here are intentional constraints.

Constraints are not limitations —
they are what make ATOMA coherent.

If in doubt:
- Document the decision.

End of DECISIONS_LOG.md

## [2026-01-06] [AI] Decision: Separate thinking, execution, and review across distinct AI roles

### Context
- ATOMA reached a level of complexity where using a single AI tool for ideation, implementation, and review caused confusion, scope creep, and loss of conceptual integrity.

- There was a need to improve development efficiency without sacrificing project identity, long-term memory, or philosophical consistency.

### Decision
ATOMA will use a **strictly separated AI role model**:

- ChatGPT is the single architectural authority and design partner.
- Local AI models (e.g. Nemotron 3 Nano) are used only for scoped execution.
- Crush (GLM-4.7) is used exclusively as a review and safety gate.

No AI is allowed to perform outside its assigned role.

### Alternatives Considered
- Using a single powerful AI agent for everything
- Fully autonomous agentic workflows
- Cloud-based orchestration platforms with multiple agents
- Relying solely on local AI without architectural guidance

### Why This Was Chosen
ATOMA is a long-term, identity-driven project.
Mixing creative decision-making with execution leads to loss of intent.

Separating roles:
- preserves conceptual clarity,
- reduces cognitive load,
- prevents accidental architectural drift,
- allows each AI to operate within its strengths.

This model also avoids vendor lock-in and supports a fully local-first workflow.

### Consequences
- All design and architectural decisions must go through ChatGPT.
- Local AI output is treated as provisional until reviewed.
- Review is mandatory for non-trivial changes.
- Speed is intentionally traded for coherence and stability.

### Status
Active


## [2026-01-06] [DESIGN] Decision: Prefer subtle, systemic visual signals over explicit UI feedback

### Context
- As ATOMA’s systems evolved (synergy, harmony, corruption, network pressure), there was a recurring temptation to communicate state changes using explicit UI elements, strong colors, glows, warnings, or overlays.

- While these approaches provided immediate clarity, they conflicted with ATOMA’s emerging identity as a calm, interpretable, and systemic experience.

### Decision
- ATOMA will communicate system state primarily through **subtle, systemic, and emergent visual behavior**, rather than explicit UI indicators.

Visual feedback should:
- emerge from the system itself,
- scale gradually with intensity,
- remain readable without overwhelming the scene.

Explicit UI elements are considered a last resort and must be justified
by necessity, not convenience.

### Alternatives Considered
- UI warnings for high corruption or stress
- Strong color-coded overlays
- Persistent glow effects
- Flashing or pulsing alerts
- Numeric meters exposed directly to the player

### Why This Was Chosen
ATOMA is designed to be *read*, not *announced*.

Subtle visual signals:
- preserve immersion,
- encourage observation and interpretation,
- support long-term play without fatigue,
- allow multiple states to coexist without visual noise.

This approach aligns with ATOMA’s philosophical goal:
- to let meaning emerge from structure and behavior rather than UI instruction.

### Consequences
- Visual effects must be carefully tuned and restrained.
- Debug and developer tools must compensate for reduced explicit feedback.
- Visual clarity becomes a design responsibility, not a UI shortcut.
- Some states may be ambiguous by design and clarified only through interaction.

### Status
Active
