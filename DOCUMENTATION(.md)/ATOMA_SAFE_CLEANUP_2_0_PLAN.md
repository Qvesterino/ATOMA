# ATOMA SAFE CLEANUP 2.0 — EXECUTION PLAN

**Objective:** Clean up mouse interaction, selection, and linking systems while maintaining 100% backward compatibility and zero impact on rendering/shaders/AI logic.

**Status:** PRE-EXECUTION PLAN

---

## PART 1: SYSTEM INVENTORY

### ✅ ACTIVE SYSTEMS (MUST REMAIN WIRED)

**Core Selection:**
- `_NodeSelectionCore3_4.js` — Single source of truth for selection state
  - Status: ACTIVE in main.js constructor
  - Used by: All UI components and NodeLinking2_3
  - Field: `this.selectionCore`

**Linking Kernel:**
- `_NodeLinking2_3.js` — Unified mouse kernel with double-click primary support
  - Status: ACTIVE in main.js (setupPrimaryNodeSystem + setupUIWiring3_7)
  - LMB: select or link from primary
  - RMB: unlink all
  - E key: context menu
  - ESC: close UI
  - Field: `this.nodeLinking`

**Selected Node UI (3.2–3.4):**
- `_UISelectedNodeBadge3_2.js` — Minimalist badge under crosshair
  - Status: ACTIVE
  - Field: `this.selectedNodeBadge`
  - Updates: animate loop line ~1715

- `_UISelectedNodeHighlight3_2.js` — Neon pulsing highlight
  - Status: ACTIVE
  - Field: `this.selectedNodeHighlight`
  - Updates: animate loop line ~1723

- `_UISelectedNodeLabel3_3.js` — Floating [SELECTED] label
  - Status: ACTIVE
  - Field: `this.selectedNodeLabel`
  - Updates: animate loop line ~1734

- `_UISelectedNodeTopBar3_4.js` — Top HUD bar with node info
  - Status: ACTIVE
  - Field: `this.selectedNodeTopBar`
  - Updates: animate loop line ~1745

**Primary Node UI (3.7):**
- `_UIPrimaryNodeAura3_7.js` — Rotating neon aura ring
  - Status: ACTIVE
  - Field: `this.primaryNodeAura`
  - Updates: animate loop line ~1756
  - Setup: setupPrimaryNodeSystem() line 2925

- `_UIPrimaryNodeTopBar3_7.js` — Primary node HUD display
  - Status: ACTIVE
  - Field: `this.primaryNodeTopBar`
  - Updates: animate loop line ~1764
  - Setup: setupPrimaryNodeSystem() line 2925

**Passive UI (Reference Only, No Interaction):**
- `_UICategoryLegend3_1.js` — Reference panel, 16 node categories
  - Status: PASSIVE (display only, no interaction)
  - Field: `this.categoryLegend`
  - Wired in: setupCategoryLegend() line 2771

- `_AIEmotionalFeed3_1.js` — Poetic network status reflections
  - Status: PASSIVE (display only, no interaction)
  - Field: `this.emotionalFeed`
  - Wired in: setupEmotionalFeed() line 2781

---

### ⛔ LEGACY/DISABLED SYSTEMS (CLASSIFICATION)

These files are now LEGACY and should be marked disabled:

#### Files to Mark LEGACY_DISABLED:

1. **`_NodeLinking2_0.js`**
   - Old first mouse kernel
   - Status: Not imported in main.js
   - Action: Mark header + keep reference copy

2. **`_NodeLinking2_1.js`**
   - Unified core edition (superseded by 2.2 and 2.3)
   - Status: Not imported in main.js (setupNodeLinking2_1 exists but not called)
   - Action: Mark header + keep reference copy

3. **`_NodeLinking2_2.js`**
   - UI 3.5 unified mouse logic (superseded by 2.3 with primary)
   - Status: Not imported in main.js (setupNodeLinking2_2 exists but not called)
   - Action: Mark header + keep reference copy

4. **`_UINodeAutoDetect3_1.js`**
   - Auto-detection cone system (conflicts with mouse kernel)
   - Status: Not imported in main.js
   - Action: Mark header + keep reference copy

5. **`_UINodeHoverTooltip3_1.js`**
   - Hover tooltip system (conflicts with mouse kernel)
   - Status: Not imported in main.js
   - Action: Mark header + keep reference copy

#### Methods to Disable (No-Op Stubs):

In main.js, these methods exist but should be converted to log-only stubs:
- `setupNodeAutoDetect()` (line 2762) — Already a no-op, verify
- `setupNodeLinking()` (line 2791) — Already a no-op, verify
- `setupHoverTooltip()` (line 2800) — Already a no-op, verify
- `setupNodeLinking2_1()` (line 2884) — Not called, leave as-is
- `setupNodeLinking2_2()` (line 2900) — Not called, leave as-is

---

## PART 2: VERIFICATION CHECKLIST

Before cleaning up, verify these imports do NOT exist in main.js:
- [ ] No `import { UINodeAutoDetect3_1 }`
- [ ] No `import { UINodeHoverTooltip3_1 }`
- [ ] No `import { NodeLinking2_0 }`
- [ ] No `import { NodeLinking2_1 }`
- [ ] No `import { NodeLinking2_2 }` — ONLY NodeLinking2_3 imported

Verify these ARE imported in main.js:
- [ ] `import { NodeSelectionCore3_4 }`
- [ ] `import { NodeLinking2_3 }`
- [ ] `import { UISelectedNodeTopBar3_4 }`
- [ ] `import { UISelectedNodeBadge3_2 }`
- [ ] `import { UISelectedNodeHighlight3_2 }`
- [ ] `import { UISelectedNodeLabel3_3 }`
- [ ] `import { UIPrimaryNodeAura3_7 }`
- [ ] `import { UIPrimaryNodeTopBar3_7 }`
- [ ] `import { UICategoryLegend3_1 }` (passive)
- [ ] `import { AIEmotionalFeed3_1 }` (passive)

---

## PART 3: CHANGES TO EXECUTE

### Phase 1: Mark Legacy Files

For each legacy file below, add this header at the very top:

```js
// ============================================================================
// ATOMA LEGACY MODULE — DISABLED BY SAFE CLEANUP 2.0
// Kept only for reference. Do NOT import or instantiate in main.js.
// Replaced by: _NodeLinking2_3.js + _NodeSelectionCore3_4.js
// ============================================================================
```

Files to mark:
1. `_NodeLinking2_0.js`
2. `_NodeLinking2_1.js`
3. `_NodeLinking2_2.js`
4. `_UINodeAutoDetect3_1.js`
5. `_UINodeHoverTooltip3_1.js`

### Phase 2: Verify main.js Wiring

Verify in main.js (constructor section ~430 lines):
1. `setupSelectionCore()` is called BEFORE all UI wiring
2. `setupSelectedNodeTopBar()` uses `this.selectionCore`
3. `setupPrimaryNodeSystem()` creates both aura + topbar + NodeLinking2_3
4. `setupUIWiring3_7()` wires all components together

Verify animate loop (lines 1673–1770):
- Only NodeLinking2_3 is updated (line ~1695)
- All 4 selected node UI components are updated
- Both primary node UI components are updated
- NO legacy systems are updated

### Phase 3: Run Behavior Tests

Tests to verify (see VERIFICATION file):
1. **Selection (LMB single click)** — Node gets highlight + HUD shows SELECTED
2. **Linking (LMB with first node selected)** — Link created node A → B
3. **RMB Unlink** — All links removed, node stays selected
4. **Double-click Primary** — Primary node aura + topbar visible
5. **No Legacy Interference** — NO auto-detect cone, NO hover tooltip

---

## PART 4: CLEANUP SAFETY RULES

**✓ DO:**
- Mark files with legacy header
- Keep all legacy code intact (reference only)
- Verify no new imports are created
- Test each behavior independently
- Document all findings in verification report

**✗ DO NOT:**
- Delete any files
- Rename or move files
- Change internals of active systems
- Touch rendering, shaders, AI, or world systems
- Remove any methods from main.js (disable only)

---

## PART 5: CLEANUP STATUS SUMMARY

**Pre-Execution Checklist:**
- [ ] Inventory complete (5 legacy files identified)
- [ ] Active systems confirmed (8 core files wired)
- [ ] No removal conflicts identified
- [ ] All methods verified in main.js
- [ ] Ready for Phase 1: Mark Legacy Files

**Execution Status:** PENDING

---

**Prepared by:** Rosie (Senior AI Engineer)  
**Date:** ATOMA SAFE CLEANUP 2.0 Session  
**Next Step:** Execute Phase 1 (Mark Legacy Files) → Phase 2 (Verify Wiring) → Phase 3 (Behavior Tests)
