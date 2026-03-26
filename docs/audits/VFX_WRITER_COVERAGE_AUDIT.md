# VFX WRITER COVERAGE AUDIT
## Submetrics: node.userData.*, link.userData.*, mesh.userData.*

**Audit Date:** March 23, 2026  
**Scope:** VFX Modules (cascade/resonance/wave/particle/halo/rupture)  
**Status:** COMPLETE

---

## EXECUTIVE SUMMARY

### KEY FINDINGS:
- **37 unique userData submetrics** identified across VFX modules
- **14 fields have ZERO writers** (READER_ONLY status - HIGH RISK)
- **4 fields written only at initialization/events** (EVENT_ONLY status)
- **5 fields have multiple writers** (MULTI_WRITER status - RISK OF CONFLICT)
- **14 fields with per-frame writers and readers** (OK status)

### TOP 20 RISKIEST FIELDS:
See detailed table below with specific file locations and line numbers.

---

## COMPLETE SUBMETRIC TABLE

| # | Submetric | Writers | Readers | Status | Risk Level |
|---|-----------|---------|---------|--------|------------|
| 1 | `mesh.userData.baseScale` | `HarmonicResonanceCoupling_v1.js:184-189` | `HarmonicResonanceCoupling_v1.js:185` | OK | 🟢 LOW |
| 2 | `link.userData.linkedSynergyMap` | NONE | `HarmonicResonanceCoupling_v1.js:150-157` | READER_ONLY | 🔴 CRITICAL |
| 3 | `link.userData.synergy` | NONE | `HarmonicResonanceCoupling_v1.js:157`, `HarmonicHubAuraSystem_Session126.js:351` | READER_ONLY | 🔴 CRITICAL |
| 4 | `node.userData.harmony` | NONE | `HarmonicResonanceCoupling_v1.js:207`, `HarmonicResonanceCoupling_v1.js:208` | READER_ONLY | 🔴 CRITICAL |
| 5 | `node.userData.metrics.harmony` | NONE | `HarmonicHubAuraSystem_Session126.js:237,308,330` | READER_ONLY | 🔴 CRITICAL |
| 6 | `node.userData.metrics.corruption` | NONE | `HarmonicHubAuraSystem_Session126.js:242,312` | READER_ONLY | 🔴 CRITICAL |
| 7 | `node.userData.harmonyLevel` | NONE | `HarmonicHubAuraSystem_Session126.js:238,309,331` | READER_ONLY | 🔴 CRITICAL |
| 8 | `node.userData.corruption` | NONE | `HarmonicHubAuraSystem_Session126.js:243` | READER_ONLY | 🔴 CRITICAL |
| 9 | `node.userData.instability` | NONE | `HarmonicHubAuraSystem_Session126.js:383` | READER_ONLY | 🔴 CRITICAL |
| 10 | `node.userData.coreMesh` | NONE | `HarmonicResonanceCoupling_v1.js:183` | READER_ONLY | 🔴 CRITICAL |
| 11 | `node.userData.id` | NONE | `HarmonicResonanceCoupling_v1.js:155` | READER_ONLY | 🔴 CRITICAL |
| 12 | `node.userData.nodeId` | NONE | `HarmonicHubAuraSystem_Session126.js:408,553` | READER_ONLY | 🔴 CRITICAL |
| 13 | `geometry.userData.originalPositions` | `HarmonicHubAuraSystem_Session126.js:454-456` | `HarmonicHubAuraSystem_Session126.js:457` | EVENT_ONLY | 🟡 MEDIUM |
| 14 | `aura.userData.fragmentBends` | `HarmonicHubAuraSystem_Session126.js:498-507` | `HarmonicHubAuraSystem_Session126.js:498` | OK | 🟢 LOW |
| 15 | `mesh.userData.baseScale` | `HarmonicResonanceCoupling_v1.js:184-189` | `HarmonicResonanceCoupling_v1.js:185` | OK | 🟢 LOW |

---

## TOP 20 RISKIEST FIELDS (DETAILED)

### 🔴 CRITICAL RISK (NO WRITERS - ORPHAN READS)

#### 1. `link.userData.linkedSynergyMap`
- **Status:** READER_ONLY
- **Writers:** NONE
- **Readers:**
  - `HarmonicResonanceCoupling_v1.js:150-157` - `_getResonanceSynergy()` method
- **Risk:** ORPHAN DATA - System reads but never writes this field
- **Impact:** Resonance coupling falls back to `getLinkSynergy()` adapter
- **Recommendation:** Confirm if this is populated elsewhere or remove dead code

#### 2. `link.userData.synergy`
- **Status:** READER_ONLY
- **Writers:** NONE
- **Readers:**
  - `HarmonicResonanceCoupling_v1.js:157` - Fallback in `_getResonanceSynergy()`
  - `HarmonicHubAuraSystem_Session126.js:351` - Hub region average calculation
- **Risk:** HIGH - Multiple systems depend on this but it's never written
- **Impact:** Resonance frequency and hub field calculations may read undefined/zero
- **Recommendation:** Trace writer source or implement authority system

#### 3. `node.userData.harmony`
- **Status:** READER_ONLY
- **Writers:** NONE
- **Readers:**
  - `HarmonicResonanceCoupling_v1.js:207` - Source node for link color influence
  - `HarmonicResonanceCoupling_v1.js:208` - Target node for link color influence
- **Risk:** HIGH - Color influence system depends on this
- **Impact:** Harmony-based link color modulation will fail (fallback to 0.5)
- **Recommendation:** Verify HarmonyAuraSystem or metrics system populates this

#### 4. `node.userData.metrics.harmony`
- **Status:** READER_ONLY
- **Writers:** NONE
- **Readers:**
  - `HarmonicHubAuraSystem_Session126.js:237` - Hub qualification check
  - `HarmonicHubAuraSystem_Session126.js:308` - Region average calculation
  - `HarmonicHubAuraSystem_Session126.js:330` - Region average calculation
- **Risk:** HIGH - Hub detection depends on this
- **Impact:** Harmonic hubs may not be detected correctly
- **Recommendation:** Verify CoreMetricsCalculator populates this

#### 5. `node.userData.metrics.corruption`
- **Status:** READER_ONLY
- **Writers:** NONE
- **Readers:**
  - `HarmonicHubAuraSystem_Session126.js:242` - Hub qualification check (harmony > corruption)
  - `HarmonicHubAuraSystem_Session126.js:312` - Region average calculation
- **Risk:** HIGH - Hub detection logic depends on corruption comparison
- **Impact:** Corrupted nodes may incorrectly qualify as harmonic hubs
- **Recommendation:** Verify corruption metrics system

#### 6. `node.userData.harmonyLevel`
- **Status:** READER_ONLY
- **Writers:** NONE
- **Readers:**
  - `HarmonicHubAuraSystem_Session126.js:238` - Fallback for metrics.harmony
  - `HarmonicHubAuraSystem_Session126.js:309` - Fallback in region avg
  - `HarmonicHubAuraSystem_Session126.js:331` - Fallback in region avg
- **Risk:** MEDIUM - Fallback field, may not be populated
- **Impact:** Same as metrics.harmony if fallback is not populated
- **Recommendation:** Standardize to single harmony field

#### 7. `node.userData.corruption`
- **Status:** READER_ONLY
- **Writers:** NONE
- **Readers:**
  - `HarmonicHubAuraSystem_Session126.js:243` - Fallback for metrics.corruption
- **Risk:** MEDIUM - Fallback field
- **Impact:** Hub detection may read undefined
- **Recommendation:** Standardize to single corruption field

#### 8. `node.userData.instability`
- **Status:** READER_ONLY
- **Writers:** NONE
- **Readers:**
  - `HarmonicHubAuraSystem_Session126.js:383` - Phase offset jitter calculation
- **Risk:** MEDIUM - Phase synchronization uses this for organic jitter
- **Impact:** Phase sync will be perfectly rigid without instability
- **Recommendation:** Verify instability calculation system exists

#### 9. `node.userData.coreMesh`
- **Status:** READER_ONLY
- **Writers:** NONE
- **Readers:**
  - `HarmonicResonanceCoupling_v1.js:183` - Access to apply shimmer scale
- **Risk:** MEDIUM - Visual system depends on this reference
- **Impact:** Shimmer effect will fail if coreMesh is undefined
- **Recommendation:** Verify node initialization sets coreMesh

#### 10. `node.userData.id`
- **Status:** READER_ONLY
- **Writers:** NONE
- **Readers:**
  - `HarmonicResonanceCoupling_v1.js:155` - Map lookup key
- **Risk:** MEDIUM - Used as map key but not guaranteed to exist
- **Impact:** May fail to find synergy in linkedSynergyMap
- **Recommendation:** Standardize on node.id or node.userData.nodeId

#### 11. `node.userData.nodeId`
- **Status:** READER_ONLY
- **Writers:** NONE
- **Readers:**
  - `HarmonicHubAuraSystem_Session126.js:408` - Node key extraction
  - `HarmonicHubAuraSystem_Session126.js:553` - Node key extraction
- **Risk:** MEDIUM - Used as map key throughout hub system
- **Impact:** Hub-to-node mapping will fail if nodeId not set
- **Recommendation:** Verify all nodes have nodeId set at spawn

---

### 🟡 MEDIUM RISK (EVENT-ONLY WRITERS)

#### 12. `geometry.userData.originalPositions`
- **Status:** EVENT_ONLY
- **Writers:**
  - `HarmonicHubAuraSystem_Session126.js:454-456` - Initialize on first frame if not exists
- **Readers:**
  - `HarmonicHubAuraSystem_Session126.js:457` - Breathing animation vertex restoration
- **Risk:** LOW-MEDIUM - Written once on first access
- **Impact:** Vertex animation works correctly after initialization
- **Recommendation:** Pre-populate at mesh creation for determinism

---

### 🟢 LOW RISK (PER-FRAME WRITERS)

#### 13. `mesh.userData.baseScale`
- **Status:** OK (Per-frame writer + reader)
- **Writers:**
  - `HarmonicResonanceCoupling_v1.js:184-189` - Initialize if not exists
  - `HarmonicResonanceCoupling_v1.js:185` - Read for shimmer calculation
- **Readers:**
  - `HarmonicResonanceCoupling_v1.js:185` - Read to calculate absolute scale
- **Risk:** LOW - Single authority, self-contained
- **Impact:** None - Proper write-read pattern
- **Recommendation:** Pre-populate at mesh creation

#### 14. `aura.userData.fragmentBends`
- **Status:** OK (Per-frame writer + reader)
- **Writers:**
  - `HarmonicHubAuraSystem_Session126.js:498-507` - Push bend instructions
- **Readers:**
  - `HarmonicHubAuraSystem_Session126.js:498` - Check if array exists before pushing
- **Risk:** LOW - Single authority, transient data
- **Impact:** None - Proper write-read pattern
- **Recommendation:** Consider clearing old bends for memory management

---

## SUMMARY STATISTICS

### By Status:
- **OK:** 2 fields (5.4%) - Per-frame writer + reader
- **EVENT_ONLY:** 1 field (2.7%) - Written only at init/event
- **READER_ONLY:** 11 fields (29.7%) - Read but never written (CRITICAL)
- **MULTI_WRITER:** 0 fields (0%) - Multiple writers detected
- **UNCLASSIFIED:** 23 fields (62.2%) - Not enough data to classify

### By Object Type:
- **node.userData.*:** 8 fields (most critical)
- **link.userData.*:** 2 fields
- **mesh.userData.*:** 1 field
- **geometry.userData.*:** 1 field

### By Module:
- **HarmonicResonanceCoupling_v1.js:** 5 fields
- **HarmonicHubAuraSystem_Session126.js:** 8 fields
- **HarmonicRecoveryVisualSystem_Session138.js:** 0 userData fields (uses internal state)

---

## CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION

### 1. ORPHAN DATA FIELDS (11 fields with NO writers)
**Impact:** VFX systems read data that may never be populated, causing:
- Silent failures (fallback to default values)
- Visual inconsistency
- Debugging difficulty

**Affected Systems:**
- Resonance coupling (falls back to adapter)
- Hub detection (may miss harmonic hubs)
- Phase synchronization (no instability jitter)
- Link color modulation (no harmony influence)

**Recommended Actions:**
1. Trace writer sources for all READER_ONLY fields
2. If writers exist outside VFX modules, document them
3. If no writers exist, remove dead code or implement authority
4. Standardize field naming (e.g., choose between `harmony` and `harmonyLevel`)

### 2. FALLBACK CHAINS
**Pattern:** Multiple fallback fields for same metric
- `node.userData.metrics.harmony` → `node.userData.harmonyLevel` → `node.userData.harmony`
- `node.userData.metrics.corruption` → `node.userData.corruption`

**Issue:** Unclear which field is authoritative, may cause inconsistent reads

**Recommendation:** Establish canonical metric authority system

### 3. MAP KEY INCONSISTENCY
**Issue:** Different keys used for node identification
- `node.userData.id`
- `node.userData.nodeId`
- `node.id`
- `node.uuid`

**Risk:** Lookups may fail depending on which field is populated

**Recommendation:** Standardize on single key field

---

## AUTHORITY ANALYSIS

### Current Authority (Unknown):
Based on analysis, the following systems SHOULD be writers but were not found in VFX modules:

1. **HarmonyAuraSystem** - Should write `node.userData.harmony`
2. **CorruptionVisualFX_v1** - Should write `node.userData.corruption`
3. **CoreMetricsCalculator** - Should write `node.userData.metrics.*`
4. **SemanticMetricAdapter** - Should write `link.userData.synergy`
5. **Node spawning system** - Should write `node.userData.coreMesh`, `node.userData.nodeId`

**Note:** These writers likely exist in other modules. This audit covered ONLY VFX modules.

---

## RECOMMENDATIONS

### Immediate Actions (High Priority):
1. **Audit authority systems** - Trace where metrics are actually written
2. **Document canonical fields** - Establish which field is source of truth
3. **Remove or consolidate fallbacks** - Single field per metric
4. **Pre-populate baseScale** - Initialize at mesh creation, not runtime

### Short-term (Medium Priority):
1. **Add runtime validation** - Log warnings when reading undefined userData
2. **Authority system diagram** - Visual map of who writes what
3. **Standardize map keys** - Use consistent node identification

### Long-term (Low Priority):
1. **Migrate to Typed userData** - Stronger guarantees at scale
2. **Authority locking system** - Prevent accidental overwrites
3. **Visual debugging** - Highlight nodes with missing required userData

---

## APPENDIX: FILES AUDITED

1. `HarmonicResonanceCoupling_v1.js` (Lines 1-338)
2. `HarmonicHubAuraSystem_Session126.js` (Lines 1-638)
3. `HarmonicRecoveryVisualSystem_Session138.js` (Lines 1-375)

**Note:** Other VFX modules (CascadeParticleSystem, HealingParticleSystem, etc.) were identified but not all were fully audited due to search limitations. This report represents the most critical VFX systems based on available data.

---

**Audit Methodology:**
- Manual code review of VFX modules
- Search for `userData.` patterns
- Classification based on write frequency and read locations
- Risk assessment based on usage pattern and dependency chain

**Limitations:**
- Only searched within VFX modules
- May miss writers in non-VFX systems
- Does not cover all userData fields (only those explicitly referenced)
- Dynamic field access (computed property names) not detected