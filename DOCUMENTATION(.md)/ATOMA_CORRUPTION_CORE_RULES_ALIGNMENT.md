# ATOMA: Corruption Core Rules & Healing Design Alignment

**Status: DESIGN ALIGNMENT CHECK (No code changes — verification only)**

---

## 1️⃣ Link Breakdown Rule Identification

### Where It's Defined

**Location:** `/NodeLinkingSystem.js` → `removeLink()` method (line ~2305 onwards)

**Current State:** 
- Link removal is **user-initiated** (via context menu "Delete Link")
- No automatic dissolution based on corruption threshold exists
- Links persist at all corruption levels (0 → 1.0)

**Threshold Value:** 
- ❌ **Not currently defined** for automatic dissolution
- Current hard minimum: 0 (can go to 0)
- Current hard maximum: 1.0 (fully corrupted)
- ⚠️ **No corruption-based link dissolution threshold exists**

---

### What We Found

```javascript
// NodeLinkingSystem.js line 232-234
case 'delete':
  this.createLinkBreakEffect(link);
  this.removeLink(link);
  break;
```

**This shows:**
- Links CAN be removed (manually)
- No automatic removal based corruption
- No threshold trigger

---

## 2️⃣ Healing Logic Current State

### How Healing Works Now

**File:** `LinkCorruptionTransmission_v1.js` → `applyHealingCascade()` method

```javascript
// Line 813: Healing trigger
if (harmony < HARMONY_HEALING_THRESHOLDS.HEALING_TRIGGER) {
  return; // Healing not triggered
}

// Line 819: Apply healing
linkData.level = Math.max(0, linkData.level + healingDelta);

// Line 833: Healing can reach 0 (fully healed)
linkData.level = Math.max(0, linkData.level + healingDelta);
```

**Key Behavior:**
- ✅ Healing reduces corruption gradually
- ✅ Healing can reduce corruption to 0 (full restoration)
- ✅ Healed links remain functional
- ⚠️ **No check for "was this link broken before?"**
- ⚠️ **No distinction between "never broke" vs "recovered from break"**

---

## 3️⃣ Critical Design Question

### Does Link Dissolution Exist?

**Answer:** 
- ❌ **No automatic dissolution defined**
- ❌ **No corruption threshold triggers link break**
- ❌ **Links only removed manually (user context menu)**

### Should It Exist?

**Design Rationale:**
- Corruption represents "damage/interference" (0-1 scale)
- At corruption = 1.0, link is "fully corrupted"
- Question: Does 1.0 corruption = "link broken" or just "link unusable"?

---

## 4️⃣ Healing Model Options

### Option A: Pre-Collapse Stabilization Only ✅ RECOMMENDED

```
Healing behavior:
- Can heal links at ANY corruption level (0.0 → 1.0)
- Healing reduces corruption toward 0
- If link reaches 0 corruption, it's "restored"
- No automatic dissolution threshold exists
- Links are never "permanently broken"

Interpretation:
- Corruption = "stress/damage"
- Healing = "stress relief/damage mitigation"
- Links always recoverable through harmony
```

**Pros:**
- Simple, intuitive
- No hidden state transitions
- Players can always recover networks

**Cons:**
- May feel too forgiving
- No permanent consequences

---

### Option B: Post-Collapse Requires Manual Rebuild ❌ NOT RECOMMENDED

```
(Would require adding:)
- A corruption threshold (e.g., > 0.95)
- A "broken" state flag on links
- A "repair" mechanic requiring manual interaction
- Healing cannot cross the break threshold alone

Interpretation:
- Corruption = "structural damage"
- At corruption > 0.95: link is "fractured"
- Healing can prepare recovery, but can't rebuild alone
- Requires player action to reconstruct
```

**Pros:**
- More strategic consequences
- Higher stakes

**Cons:**
- Requires new mechanics (repair system)
- More complex healing model
- Potentially frustrating for players

---

### Option C: Tiered Corruption State Machine ❓ POSSIBLE FUTURE

```
(Could implement:)
- Level 0-0.5: "Stressed" → Healable normally
- Level 0.5-0.9: "Degrading" → Healing effective but slower
- Level 0.9-1.0: "Critical" → Healing barely effective
- (Optional) Level > 1.0: "Broken" → Requires rebuild

Would require:
- New cascade threshold configuration
- State machine for link health
- Tiered healing rates
```

---

## 5️⃣ Current Healing ↔ Corruption Interaction

### What Happens Now

```javascript
// Phase 3 Healing
healingDelta = -healingRate * harmonyHealingMultiplier * deltaTime;
linkData.level = Math.max(0, linkData.level + healingDelta);

// Result: 
// - Link at 0.8 corruption → heals to 0.7
// - Link at 0.99 corruption → heals to 0.98
// - Link at 1.0 corruption → stays at 1.0 (or heals normally)

// No bypass:
// - Links don't "skip" dissolution thresholds
// - Healing never bypasses because no threshold exists
```

**Assessment:** ✅ **LOGICALLY SOUND**
- Healing is bounded
- Corruption decays smoothly
- No artificial "resurrection" mechanics

---

## 6️⃣ Safety Analysis: Healing vs Corruption Semantics

### ✅ Confirmed Safe

1. **Healing doesn't mutate Synergy/Harmony**
   - Only reads from them
   - Phase 3b grows Harmony from healing results
   - Properly bounded

2. **Corruption doesn't artificially heal**
   - Corruption level is independent variable
   - Healing is controlled via Phase 3 trigger
   - No hidden auto-recovery

3. **Cascades respect decay**
   - Phase 5c/5d enforce decay clamping
   - Healing/Threat cascade only make decay LESS (not more)
   - Both still decay every hop

4. **No feedback loop between healing and corruption**
   - Healing reduces corruption (linear, not exponential)
   - Corruption doesn't regenerate from healing
   - Cleanly separated

### ⚠️ Design Considerations

1. **Link integrity not explicitly tracked**
   - Links exist at all corruption levels
   - No "dead link" state
   - Player can't distinguish between "damaged" and "broken" visually

2. **Corruption cap is 1.0, not a dissolution trigger**
   - Players might expect 1.0 = "broken link"
   - But currently means "fully corrupted, but still exists"
   - Could confuse new players

3. **Healing can reduce 1.0 to 0.9 to 0.8...**
   - Feels realistic (gradual recovery)
   - But no visual/state feedback for "threshold crossed"
   - Players can't tell if link is "restored" vs just "less damaged"

---

## 7️⃣ Proposed Safe Healing Design

### Recommended: "Stabilization Only" Model

```
Core Principle:
Healing stabilizes endangered links but doesn't resurrect broken ones
(Where "broken" would be: if we ever implement dissolution)

Current Implementation (Valid):
- All links exist at all corruption levels 0-1.0
- Healing reduces corruption smoothly
- No thresholds, no state transitions
- Player owns the network state entirely

If Dissolution Added Later:
- Implement threshold (e.g., corruption > 0.95)
- Healing can reach threshold but not cross it
- Requires separate "repair" action
- Keeps healing and restoration distinct

Mechanics (Today):
- Phase 3: Harmony ≥ 0.85 → healing active
- Healing rate: 0.05 per second
- Cascade decay: 0.5 per hop
- Phase 5c/5d: Resonance modifies decay (via clamp)
- Result: Controlled, bounded, deterministic
```

---

## 8️⃣ Logical Conflicts: None Detected ✅

### Checked For:

1. **Healing bypasses corruption rules**
   - ❌ No bypass: Healing reduces corruption level directly
   - ✅ Respects cascade depth (3 hops max)
   - ✅ Respects decay (always decays per hop)

2. **Corruption "resurrects" after healing**
   - ❌ No resurrection: Corruption only increases via transmission
   - ✅ Healing effect is permanent (until new corruption arrives)

3. **Feedback loops create runaway healing**
   - ❌ No runaway: Phase 3b grows Harmony at 2% of healed amount
   - ✅ Cooldown-limited (500ms)
   - ✅ Capped at Harmony = 1.0

4. **Resonance creates artificial recovery**
   - ❌ No artificial recovery: Resonance only modifies decay (clamp)
   - ✅ Healing still always decays
   - ✅ Threat still always decays

---

## 9️⃣ Recommendations

### For Phase 5e (Coherence Cascades)

**Do:**
- ✅ Apply coherence bias to cascade strength (additive, bounded)
- ✅ Use existing healing/threat cascade infrastructure
- ✅ Keep decay enforcement strict (clamp bounds)

**Don't:**
- ❌ Don't create new dissolution logic
- ❌ Don't add resurrection mechanics
- ❌ Don't bypass Phase 3 cascade limits
- ❌ Don't mutate Synergy/Harmony directly

### If Link Dissolution Added (Future)

**Structure:**
1. Define corruption threshold (e.g., 0.95)
2. Add "broken" flag to link when crossed
3. Separate healing from restoration:
   - Healing: Reduces corruption (existing)
   - Restoration: Rebuilds broken links (new)
4. Keep healing capped below threshold
5. Require explicit player action for recovery

---

## 🔟 Summary

### Current State ✅

| Aspect | Status | Detail |
|--------|--------|--------|
| Link Dissolution | ❌ Not defined | Only user-manual removal exists |
| Corruption Range | ✅ Bounded | 0.0-1.0 (inclusive) |
| Healing Capability | ✅ Safe | Reduces corruption smoothly |
| Healing Bypass Risk | ✅ No risk | Follows decay rules strictly |
| Cascade Semantics | ✅ Clear | Healing/Threat both decay per hop |
| Feedback Loops | ✅ Bounded | Phase 3b cooldown-limited and capped |
| Resonance Impact | ✅ Bounded | Modifies decay only (via clamp) |

### Design Assessment ✅

**Healing is semantically sound.** No conflicts between healing and corruption rules exist because:

1. **Corruption is independent state** (0-1 scale)
2. **Healing is controlled reduction** (via Phase 3 trigger + cascade)
3. **Decay is enforced strictly** (Phase 5c/5d clamp bounds)
4. **Feedback loops are bounded** (cooldowns + caps)
5. **No threshold transitions exist** (unless we add them)

### Conclusion

**Current system is safe to extend with Phase 5e.** Coherence cascades can safely coordinate healing and threat without creating new logical conflicts, provided they:

- Respect existing cascade infrastructure
- Apply bias to decay (not bypass it)
- Maintain clamp enforcement
- Don't introduce new state mutations

---

## Appendix: Questions for Future Phases

1. **Should corruption ever be "permanent"?**
   - Current: No (healable at any level)
   - Future: Could add dissolution threshold

2. **Should link dissolution exist?**
   - Current: No (only manual removal)
   - Future: Could implement at corruption > 0.95

3. **Should healing require special conditions?**
   - Current: Harmony ≥ 0.85 only
   - Future: Could add Synergy requirement too

4. **Should broken links require special repair?**
   - Current: N/A (no broken state)
   - Future: Could add "Reconstruction" phase

All safe questions for later. **Not required for Phase 5e.**

---

**Alignment complete. Healing is safe to use with Phase 5e.**
