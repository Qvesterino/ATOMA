# ATOMA Constitution

This file is the canonical constitution index for ATOMA.

It stays intentionally thin. It does not duplicate the full underlying policy texts.

---

## Purpose

Use this file to locate the current constitutional sources that govern:

- commit and patch discipline
- metric authority rules
- core simulation/graph constraints

If a future documentation pass fully consolidates those sources, this file may become the merged home. For now it is the clean entrypoint.

---

## Current Constitutional Sources

### Commit / Patch Governance

- `ai/constitution/ATOMA constitution.md`

Use this for:

- authority-safe patching
- scheduler discipline
- metric gate checks
- render/integration/regression review rules

### Metric Authority Governance

- `constitution v2/MetricAuthorityPolicy_v2.md`

Use this for:

- current metric-authority reality
- target metric-authority architecture
- transition strategy toward stronger write coordination

### Core Physics / Graph Constraints

- `constitution v2/ATOMA_CORE_PHYSICS_CONSTITUTION_v2.md`

Use this for:

- graph model assumptions
- node/link structural rules
- corruption/harmony/collapse principles

---

## Usage Rule

When documentation or implementation touches constitutional concerns:

- reference the source policy directly
- do not duplicate large rule blocks across startup docs
- if a contradiction appears, surface it explicitly and propose one canonical fix
