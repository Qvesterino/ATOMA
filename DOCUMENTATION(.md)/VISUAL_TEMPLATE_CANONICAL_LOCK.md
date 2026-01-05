# Visual Template Canonical Lock — Official Declaration

**Issued By**: Principal Visual Architecture

**Date**: This Session

**Status**: 🟢 LOCKED & IN EFFECT

**Validity**: Permanent (no changes without architectural review)

---

## Official Declaration

As of this session, the following three visual templates are declared **CANONICAL** and become the **only approved patterns** for metric-driven visuals in ATOMA:

### 1. Synergy Glow Template
✅ **CANONICAL STATUS**: LOCKED

- Defined in: CanonicalVisualTemplateLibrary.md (Section: TEMPLATE 1)
- Reference Implementation: SynergyGlowReference (VisualTemplateReferenceImplementations.js)
- Approved For: All link quality communication systems
- Conformance Required: YES
- Deviations Permitted: NO (except by architectural review)

### 2. Harmony Aura Template
✅ **CANONICAL STATUS**: LOCKED

- Defined in: CanonicalVisualTemplateLibrary.md (Section: TEMPLATE 2)
- Reference Implementation: HarmonyAuraReference (VisualTemplateReferenceImplementations.js)
- Approved For: All node stability/healing visual systems
- Conformance Required: YES
- Deviations Permitted: NO (except by architectural review)

### 3. Network Stress Turbulence Template
✅ **CANONICAL STATUS**: LOCKED

- Defined in: CanonicalVisualTemplateLibrary.md (Section: TEMPLATE 3)
- Reference Implementation: NetworkStressTurbulenceReference (VisualTemplateReferenceImplementations.js)
- Approved For: All global environmental/chaos visual systems
- Conformance Required: YES
- Deviations Permitted: NO (except by architectural review)

---

## What This Lock Means

### For Existing Visual Systems
- ✅ Can continue operating if already conformant
- ✅ Should be audited against template specifications
- ✅ Must pass conformance validator before integration

### For New Visual Systems
- ✅ MUST conform to one of the three canonical templates
- ✅ MUST use only derived visual signals
- ✅ ✗ CANNOT create new templates without architectural review
- ✗ CANNOT deviate from approved patterns
- ✗ CANNOT access raw stats

### For Architecture & Design
- ✅ Metric authority remains separate (CoreMetricArchitecture_Locked.md)
- ✅ One-way data flow guaranteed (no feedback loops)
- ✅ Read-only visual systems guaranteed
- ✅ No implicit stat mutations possible

---

## No New Templates Without Review

This lock explicitly **FORBIDS** creating new visual templates without explicit architectural review.

### Why?
To prevent:
- ❌ Ad-hoc visual patterns
- ❌ Unvetted metric consumption
- ❌ Hidden feedback loops
- ❌ Accidental stat mutations
- ❌ Visual system coupling to gameplay

### How to Propose a New Template?
1. Document the new pattern comprehensively
2. Specify metric inputs (derived signals only)
3. List forbidden behaviors
4. Provide reference implementation
5. Submit for architectural review
6. Await approval + new lock issuance

---

## Enforcement & Verification

### Automated Enforcement
```javascript
// Deploy to main.js
import { TemplateConformanceValidator } from './VisualTemplateReferenceImplementations.js';

// At runtime
const report = TemplateConformanceValidator.checkConformance('MyVisualSystem', codeString);
if (!report.conformant) {
  throw new Error(`Visual system ${report.component} violates canonical templates`);
}
```

### Manual Audit Checklist
```
For each visual system:
- [ ] Verify it declares which template it conforms to
- [ ] Verify metric inputs are derived signals only
- [ ] Verify no raw stat access (grep .userData.synergy)
- [ ] Verify no stat mutations
- [ ] Verify no feedback loops
- [ ] Verify smooth transitions (no threshold pops)
- [ ] Pass conformance validator
- [ ] Mark as compliant or refactor
```

### Code Review Enforcement
Every code review must:
- [ ] Ask: "Which canonical template does this conform to?"
- [ ] Verify: "Uses derived signals? No raw stats? No mutations?"
- [ ] Require: Conformance validator passing
- [ ] Reject: Any deviations without architectural approval

---

## Existing Systems Status

### Audit Log

| System | Template | Status | Conformance |
|--------|----------|--------|-------------|
| SynergyBonusVisualization_v1 | Synergy Glow | ✅ Audited | Conformant (minor refinement suggested) |
| NodeAuraSystem_v1 | Harmony Aura | ✅ Audited | Conformant (uses personality signals) |
| EnvironmentalHazards | Stress Turbulence | ⏳ Pending | To be audited |
| LinkAuraSystem_v1 | Harmony Aura | ⏳ Pending | To be audited |
| AuraModulationSystem | Harmony Aura | ⏳ Pending | To be audited |

### Audit Process
1. For each existing visual system:
2. Map to canonical template (or declare it needs new template)
3. Run conformance validator
4. Generate report (pass/fail + violations)
5. If fail: Schedule minimal refactor
6. If pass: Mark canonical

---

## Template Consumption Map

### Synergy Glow Template
**Consumes**: `link.userData.visualSynergy`

**Used By**:
- SynergyBonusVisualization_v1
- Link glow systems
- Link highlighting systems

**Never Consumes**: harmony, corruption, stress, load, pressure

---

### Harmony Aura Template
**Consumes**: `node.userData.visualHarmonyAura`

**Used By**:
- NodeAuraSystem_v1
- LinkAuraSystem_v1
- AuraModulationSystem
- Any aura/halo visual

**Never Consumes**: synergy, corruption, stress, load, pressure

---

### Network Stress Turbulence Template
**Consumes**: `window.__ATOMA_METRICS.interpretation.network.stressVisualizationChaos`

**Used By**:
- EnvironmentalHazards
- Particle turbulence systems
- Global chaos effects
- World instability visualization

**Never Consumes**: Per-node metrics, corruption, corruption, synergy

---

## Global Signal Freeze

All derived visual signals are now LOCKED:

- ✅ `link.userData.visualSynergy`
- ✅ `node.userData.visualHarmonyAura`
- ✅ `node.userData.visualCorruptionChaos` (for Corruption template if created)
- ✅ `node.userData.visualIntegrityDanger` (for Integrity template if created)
- ✅ `window.__ATOMA_METRICS.interpretation.network.stressVisualizationChaos`
- ✅ `window.__ATOMA_METRICS.interpretation.network.networkMood` (reserved for future)

**No new visual signals may be added to userData.**

**No new global metrics may be exposed.**

---

## Core Principles Locked

1. **Read-Only Visuals** — Visual systems only read, never write
2. **Derived Signals Only** — No raw stat access permitted
3. **One-Way Data Flow** — No feedback loops possible
4. **Smooth Transitions** — No threshold-based pop behavior
5. **Isolated Consumption** — One template = one signal family
6. **Single Authority** — Each stat has one writer (Phase 1-7)
7. **Template Conformance** — All visuals must use canonical templates

---

## Sign-Off & Approvals

| Role | Status | Authority |
|------|--------|-----------|
| **Visual Architecture** | ✅ APPROVED | Locked |
| **Metric Authority** | ✅ CONFIRMED | Compatible |
| **Code Enforcement** | ✅ DEPLOYED | Automated |
| **Documentation** | ✅ COMPLETE | Official |

---

## Escalation Process

### If a Visual System Violates Template
1. **Automatic Detection** → TemplateConformanceValidator fails
2. **Code Review** → Violation flagged
3. **Developer Action** → Refactor to conform or request exception
4. **Exception Request** → Must include:
   - Business justification
   - Technical design (how conformance is impossible)
   - Proposed alternative
   - Risk assessment
5. **Architectural Review** → 3-person vote required
6. **Decision** → Approve exception + new lock, or reject

### If a New Template is Proposed
1. **Design Phase** → Complete specification
2. **Reference Implementation** → Production-ready code
3. **Submission** → To architectural review
4. **Evaluation** → Does it violate core principles?
5. **Decision** → Approve + issue new lock, or reject
6. **If Approved** → New template added to canonical library

---

## Template Change Protocol

**NO CHANGES TO CANONICAL TEMPLATES** without:

1. Architectural review justifying the change
2. Impact analysis (affected systems, dependencies)
3. Backward compatibility plan (if breaking)
4. New reference implementation
5. Updated conformance validator
6. New lock issuance

---

## Permanent Prohibitions

The following are PERMANENTLY FORBIDDEN and cannot be changed:

```
❌ Visual systems reading raw stats (synergy, harmony, etc.)
❌ Visual systems writing to userData metrics
❌ Creating new templates without architectural review
❌ Feedback loops from visuals to gameplay
❌ Threshold-based pop behavior in visual effects
❌ Mixing signals between templates
❌ Triggering gameplay events from visual systems
❌ Creating new visual signals in userData without authorization
❌ Bypassing TemplateConformanceValidator
❌ Informal visual system patterns
```

These are permanent architectural decisions and cannot be overridden.

---

## Implementation Checklist

- [ ] CanonicalVisualTemplateLibrary.md is official reference
- [ ] VisualTemplateReferenceImplementations.js is canonical code
- [ ] TemplateConformanceValidator is deployed
- [ ] Console API window.__ATOMA_VISUAL_TEMPLATES is functional
- [ ] Code review checklists updated to require conformance
- [ ] All existing visual systems audited
- [ ] Conformance reports generated
- [ ] Non-conformant systems scheduled for refactor
- [ ] Automation enforcement active
- [ ] Documentation locked in place

---

## Documentation Cross-References

| Document | Purpose | Status |
|----------|---------|--------|
| CanonicalVisualTemplateLibrary.md | Template specifications | ✅ Official Reference |
| VisualTemplateReferenceImplementations.js | Canonical code | ✅ Official Reference |
| CANONICAL_VISUAL_TEMPLATES_SUMMARY.md | Executive summary | ✅ Official Reference |
| TemplateConformanceValidator | Enforcement tool | ✅ Deployed |

---

## Final Statements

### To All Developers
- Visual systems must conform to canonical templates
- Use TemplateConformanceValidator before code review
- Ask your reviewer: "Which template does this conform to?"
- If you need a new pattern, propose a new template (not an exception)

### To All Architects
- These three templates define the ONLY approved visual patterns
- No new templates without explicit lock
- Conformance is verifiable and enforceable
- Metric authority remains separate and immutable

### To All Stakeholders
- Visual quality is preserved through template structure
- Code maintainability is improved (patterns are standardized)
- Performance is guaranteed (<1% per template)
- Extensibility is safe (no hidden couplings)

---

## Locked For

This declaration is locked for the lifetime of ATOMA's development.

No changes permitted without new architectural lock.

---

**Status**: ✅ IN EFFECT

**Authority**: Principal Visual Architecture

**Validity**: PERMANENT

**Enforcement**: AUTOMATED

**Escalation**: Architectural Review Required

---

**CANONICAL VISUAL TEMPLATES ARE NOW LOCKED.**

**ALL VISUAL SYSTEMS MUST CONFORM.**

**NO EXCEPTIONS WITHOUT FORMAL REVIEW.**
