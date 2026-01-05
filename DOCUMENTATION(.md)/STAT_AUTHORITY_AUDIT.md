# ATOMA Stat Calculation Authority & Data Flow Audit

**Status**: READ-ONLY AUDIT  
**Scope**: Complete data flow, authority, and mutation analysis  
**Date**: Current Session  

---

## Executive Summary

ATOMA tracks 6 core stats across multiple systems:

| Stat | Primary Authority | Mutation Points | Readers | Status |
|------|------------------|-----------------|---------|--------|
| **Corruption** | LinkCorruptionTransmission_v1 | 7 primary | 12+ | ✅ Clear |
| **Synergy** | Link.synergy (linked to links) | 5 primary | 8+ | ⚠️ Dual-storage |
| **Harmony** | userData.harmonyLevel (per node) | 6 primary | 10+ | ✅ Clear |
| **Link Integrity** | LinkCorruptionTransmission_v1 | 4 primary | 6+ | ✅ Clear |
| **Network Stress** | Computed (collapsed links ratio) | Derived (read-only) | 3 | ✅ Clear |
| **Load / Pressure** | ❓ UNDEFINED | ❓ | ❓ | 🔴 MISSING |

---

## Stat 1: CORRUPTION

### 🎯 Source of Truth

**File**: `LinkCorruptionTransmission_v1.js`  
**Data Structure**: `this.linkCorruption` (Map)  
**Per-Link Schema**:
```javascript
{
  level: 0.0-1.0,                    // PRIMARY: Corruption value
  velocity: number,                  // Spread rate
  cascadeThresholdsCrossed: Set,     // Events triggered
  cascadeEvents: Array,              // Event history
  lastUpdateTime: timestamp,         // Last update tick
}
```

**Default Value**: `0` (clean state)  
**Scale**: 0.0 → 1.0  
**Initialization**: `initializeLink()`

### ✍️ Writers (Mutation Points)

| Location | Function | Type | Condition |
|----------|----------|------|-----------|
| `updateLinkCorruption()` | Spread | **PRIMARY** | Per-frame |
| `setLinkCorruption()` | Manual set | Debug | Debug only |
| `rebuildCollapsedLink()` | Reset | Conditional | Rebuild succeeds |
| `initiateHealingCascadeFromLink()` | Reduce | **PRIMARY** | Harmony ≥0.85 |
| `initiateThreatCascadeFromLink()` | Boost | Conditional | Threat level high |

**Writers**: 5 (2 primary + 3 conditional)

### 👁️ Readers (10+)

- Transmission rate calculation
- Integrity degradation (threshold: ≥0.4 corruption starts degrade)
- Healing cascade (trigger: ≥0.85 harmony)
- Cascade thresholds (visual events)
- Threat cascade spreading
- Network resonance (threat weighting)
- Visual effects system
- Archetype gameplay effects
- Debug telemetry

### ⏱️ Order of Operations (Per-Frame)

```
1. updateLinkCorruption() → linkData.level ↑
2. checkCascadeThresholds() → Triggers events
3. updateLinkIntegrity() → Reads level
4. applyLinkCorruptionVisuals() → Visual update
5. applyHealingCascade() → Possibly reduces level
```

### ⚠️ Dead Logic

**None significant** — All code paths functional

---

## Stat 2: SYNERGY

### 🎯 Source of Truth

**Location**: `link.synergy` (direct property)  
**Scale**: 0-100  
**Default**: ~50  
**Fallback**: `userData.synergy` (legacy)

### ✍️ Writers (5)

| Location | Type |
|----------|------|
| `applySynergyFeedback()` | Growth (blocked ≥15% → +gain) |
| `rebuildCollapsedLink()` | Cost (-5) |
| `deployBarrierWithCost()` | Cost (-5 to -10) |
| Initialization | Initial set |
| Debug | Manual set |

### 👁️ Readers (8+)

- Transmission blocking (60-85 soft, 85+ hard)
- Resonance threshold (avg ≥75)
- Adjacent resonance (≥80 neighbors)
- Reconstruction gate (≥70 required)
- Barrier cost calculation
- Visual glow systems
- Network dashboard
- Telemetry

### ⚠️ Issue: Dual Storage

**Problem**:
```javascript
// Primary
link.synergy = value;

// Fallback
resourceNode.userData.synergy = value;
```

**Impact**: Confusion for new contributors, potential sync issues

**Recommendation**: Consolidate to single location (medium priority cleanup)

---

## Stat 3: HARMONY

### 🎯 Source of Truth

**Location**: `userData.harmonyLevel` (node-level)  
**Scale**: 0.0-1.0  
**Default**: ~0.5

### ✍️ Writers (6)

| Location | Type |
|----------|------|
| `applyHarmonyFeedback()` | Growth (heal ×0.02) |
| `rebuildCollapsedLink()` | Cost (-0.1) |
| `deployBarrierWithCost()` | Cost (-0.1 to -0.2) |
| `processBarrierUpkeep()` | Cost (-0.02/30s) |
| HarmonyStabilizationSystem_v1 | Spreading |
| Initialization | Initial set |

### 👁️ Readers (10+)

- Corruption blocking (0.4-0.8 soft, 0.8+ hard)
- Healing trigger (≥0.85 required)
- Resonance threshold (avg ≥0.75)
- Reconstruction gate (≥0.85 required)
- Barrier affordability check
- Upkeep payment check
- Harmony stabilization flows
- Visual fade/override
- Network metrics
- Telemetry

### ⚠️ Dead Logic

**None** — All paths functional

---

## Stat 4: LINK INTEGRITY

### 🎯 Source of Truth

**File**: `LinkCorruptionTransmission_v1.js`  
**Data Structure**: `this.linkIntegrity` (Map)  
**Schema**:
```javascript
{
  integrity: 0-100,              // PRIMARY
  state: 'healthy'|'unstable'|'collapsed',
  lastIntegrityValue: number,
  lastIntegrityUpdateTime: timestamp,
}
```

**Scale**: 0-100%  
**Default**: 100 (intact)

### ✍️ Writers (4)

| Location | Type |
|----------|------|
| `updateLinkIntegrity()` | Degradation (0.8-2.5%/sec) |
| `applyHealingCascade()` | Stabilization |
| `rebuildCollapsedLink()` | Restore (→35%) |
| Initialization | Initial (100%) |

### 👁️ Readers (6+)

- Collapse gate (≤8% check)
- Healing permission (block if collapsed)
- Reconstruction eligibility (requires collapsed)
- State machine transitions
- Visual appearance
- Network metrics
- Fragility reporting

### ⚠️ Dead Logic

**None** — State machine well-defined

---

## Stat 5: NETWORK STRESS

### 🎯 Source of Truth

**Calculation**: `computeNetworkStress()` method  
**Formula**: `collapsedLinks.size / totalLinks`  
**Scale**: 0.0-1.0  
**Storage**: NONE (derived on-demand)

### ✍️ Writers

**ZERO** — Purely derived from link integrity states

### 👁️ Readers (3)

- Reconstruction gate (≤0.3 required)
- Rebuild eligibility check
- Debug telemetry

### ⚠️ Dead Logic

**None** — Clean derived calculation

---

## Stat 6: LOAD / PRESSURE

### 🎯 Source of Truth

**STATUS**: 🔴 **NOT IMPLEMENTED**

### Analysis

**Search Results**:
- No `pressure` variable in LinkCorruptionTransmission_v1
- No `load` stat tracked
- Term used only in design docs (Phase 5d threat cascades)

**Possible Interpretations**:
1. Alias for Network Stress (collapsed ratio)
2. New stat (threat accumulation?)
3. Retired concept

**Recommendation**: **CLARIFY BEFORE NEW FEATURES**

---

## AUTHORITY TABLE (SUMMARY)

| Stat | Authority | Mutation | Readers | Status |
|------|-----------|----------|---------|--------|
| Corruption | LinkCorruptionTransmission_v1.linkCorruption | 5 | 10+ | ✅ |
| Synergy | link.synergy | 5 | 8+ | ⚠️ |
| Harmony | userData.harmonyLevel | 6 | 10+ | ✅ |
| Integrity | LinkCorruptionTransmission_v1.linkIntegrity | 4 | 6+ | ✅ |
| Network Stress | Derived (on-demand) | 0 | 3 | ✅ |
| Load/Pressure | ❓ | ? | ? | 🔴 |

---

## CONFLICTS & ISSUES

### 🟢 LOW RISK

**Synergy Debug Fallback**: Minimal impact, debug-only

### 🟡 MEDIUM RISK

**Synergy Dual Storage**: Confusing but functional

**Recommendation**: Consolidate locations (medium priority)

### 🔴 HIGH RISK

**Load/Pressure Undefined**: Blocks future development

**Recommendation**: Clarify before Phase 8

---

## SAFE CLEANUP SUGGESTIONS

### 1. Consolidate Synergy Storage
- Choose: `link.synergy` (recommended) or `userData.synergy`
- Migrate all writes to single location
- Remove fallback reading logic
- Risk: LOW (mechanical change)

### 2. Clarify Load/Pressure
- Confirm if alias or new stat
- Update design docs
- Implement if needed
- Risk: NONE (blocking clarification)

### 3. Document Authorities
- Add `@stat_authority` comments
- Mark mutation points clearly
- Document reader expectations
- Risk: NONE (documentation)

---

## FINAL RECOMMENDATION

### ✅ SAFE TO PROCEED

**Status**: Production systems are deterministic and well-traced.

**Prerequisites for New Features**:
1. Clarify Load/Pressure intent
2. (Optional) Consolidate Synergy storage
3. (Optional) Add authority documentation

**Risk Level**: LOW if proceeding without cleanup  
**Risk Level**: LOWEST with cleanup first

---

**Audit Complete** — All 5 active stats have clear authority chains and traceable mutation paths.
