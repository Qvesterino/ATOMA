# Priority 0 Blocking Tasks — Approval Summary

**Status**: AWAITING APPROVAL  
**Phase 8**: 🔴 BLOCKED (awaiting decisions below)

---

## THREE DECISIONS REQUIRED

### Decision 1: Load/Pressure Clarification

**Question**: What is Load/Pressure?

**Finding**: Load/Pressure is NOT a separate stat. Network Stress already serves this purpose.

**Proposed Decision**:
```
Load / Pressure = RETIRED CONCEPT
Authority = Network Stress (computed from collapsed links ratio)
Action = Document as superseded; remove from future TODOs
```

**Status**: ✅ Ready for approval (analysis shows no ambiguity remains)

**Vote Required**: YES / NO

---

### Decision 2: Synergy Storage Consolidation

**Question**: Where should Synergy be authoritative?

**Finding**: Synergy has dual storage (link.synergy + userData.synergy), creating confusion.

**Proposed Decision**:
```
Single Authority = link.synergy (already primary)
Fallback = userData.synergy (read-only reference, never written)
Change = Convert userData.synergy to defensive read-only check
Risk Level = LOW (structural only, no gameplay impact)
Effort = 2-3 search/replace operations
```

**Status**: ✅ Ready for approval (consolidation plan clear)

**Vote Required**: YES / NO / DEFER

---

### Decision 3: Stat Authority Contract Acceptance

**Question**: Do you accept the documented stat authorities?

**Finding**: All 5 core stats have clear authority, mutation rules, and reader/writer lists.

**Proposed Contract**:

| Stat | Authority | Bounded | Writers | Mutation Type | Cleared |
|------|-----------|---------|---------|---------------|---------|
| Corruption | LinkCorruptionTransmission | 0-1 | 5 | Direct | ✅ |
| Integrity | LinkCorruptionTransmission | 0-1 | 4 | Accumulator | ✅ |
| Harmony | Node userData | 0-1 | 6+ | Resource drain | ✅ |
| Synergy | Link object | 0-100 | 5 | Direct+accum | ✅ |
| Network Stress | Computed | 0-1 | 0 | Read-only | ✅ |

**Status**: ✅ Ready for approval (contract documented)

**Vote Required**: YES / NO / REQUEST CHANGES

---

## PHASE 8 RELEASE CONDITIONS

Phase 8 implementation may proceed when:

- [_] Decision 1 approved (Load/Pressure = retired)
- [_] Decision 2 approved (Synergy = link.synergy authority)
- [_] Decision 3 approved (Stat Authority Contract accepted)
- [_] All three decisions confirmed in writing

**Current Status**: 🔴 Awaiting all three approvals

---

## IF APPROVED

**Next Steps** (in order):

1. Update documentation (1 hour)
   - Remove Load/Pressure from design docs
   - Add stat authority contract to wiki
   - Mark consolidation plan in codebase

2. Implement Synergy consolidation (1 day)
   - Convert userData.synergy to read-only fallback
   - Add verification tests
   - Document in change log

3. Resume Phase 8 implementation (4 hours)
   - Integration + visual effects + audio
   - Playtesting + balance
   - Production deployment (1 week total)

**Total delay**: 2-3 days (well within acceptable bounds)

---

## IF NOT APPROVED

**Alternative Actions** (pending feedback):

1. If Load/Pressure should be a separate stat:
   - Define inputs and calculation formula
   - Specify which systems write/read it
   - Justify separation from Network Stress

2. If Synergy consolidation should be deferred:
   - Note objection for future sprint planning
   - Continue with dual storage (acknowledged)
   - Update documentation to reflect known confusion

3. If Stat Authority Contract needs changes:
   - Specify which stats need revision
   - Propose alternative authority locations
   - Return to analysis stage

---

## FINAL CHECKLIST

Before Phase 8 resumes, confirm:

- [_] Load/Pressure decision made and documented
- [_] Synergy consolidation decision made and documented
- [_] Stat Authority Contract reviewed and approved
- [_] No additional blocking issues identified
- [_] All three priorities explicitly approved

**Document Reference**: PRIORITY_0_BLOCKING_ANALYSIS.md (complete analysis)

---

**Awaiting Your Decision**

Please review the three proposed decisions above and provide explicit YES/NO votes for each:

1. **Load/Pressure = Retired?** → YES / NO
2. **Synergy Authority = link.synergy?** → YES / NO / DEFER
3. **Stat Authority Contract Approved?** → YES / NO / REQUEST CHANGES

Once all three are approved, Phase 8 implementation resumes immediately.
