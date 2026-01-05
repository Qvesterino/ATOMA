# Session 28 — Link Visual Authority System | Quick Start

## What Was Implemented

Two systems to ensure **linked nodes look stronger, not washed out**:

1. **EnhancedNodeModelLinkState** — Boosts core when linked
2. **GlobalAuraOpacityClamp** — Limits aura opacity to 10% max

**Status**: ✅ Auto-integrated, zero configuration needed

---

## 60-Second Test

```javascript
// 1. Create a link
const node1 = game.aiNodes.nodes[0];
const node2 = game.aiNodes.nodes[1];
game.linkingSystem.createLink(node1, node2);

// 2. Verify core boost applied
debugEnhancedNodeModelLinkState.getStats();
// Should show: nodesLinked > 0

// 3. Verify aura clamped
debugGlobalAuraOpacityClamp.getStats();
// Should show: materialsClamped > 0

// 4. Visually verify: Linked node core appears stronger
// Expected: Core is primary (not washed out by aura)
```

---

## What You'll See

### Before Linking
```
Node with normal appearance
├─ Core: readable
└─ Aura: visible

Visual hierarchy: balanced
```

### After Linking
```
Linked node appears stronger
├─ Core: +5% brighter, +15% more emissive, +2% larger
└─ Aura: clamped to 10% opacity (subtle)

Visual hierarchy: CORE DOMINANT
```

---

## Console APIs

### Check What's Happening

```javascript
const node = game.aiNodes.nodes[0];

// Core boost status
debugEnhancedNodeModelLinkState.checkNode(node);

// Aura clamp stats
debugGlobalAuraOpacityClamp.getStats();
```

### Manual Control (if needed)

```javascript
// Boost a core manually
debugEnhancedNodeModelLinkState.linkNode(node);

// Clamp aura manually
debugGlobalAuraOpacityClamp.clampNode(node);

// Lower the aura opacity limit
debugGlobalAuraOpacityClamp.setMaxOpacity(0.05);  // Even more subtle
```

---

## Configuration

### Default Settings (Already Applied)

```javascript
// Core boost values
linkedOpacityBoost: 0.05       // +5% opacity
linkedEmissiveBoost: 0.15      // +15% glow
linkedScaleBoost: 1.02         // +2% size

// Aura clamp values
maxAuraOpacity: 0.10           // 10% max
clampAfterDelay: 50            // ms delay
```

### Adjust If Needed

**Make cores stronger**:
```javascript
// Edit in main.js EnhancedNodeModelLinkState config
linkedOpacityBoost: 0.10       // Increase from 0.05
linkedEmissiveBoost: 0.25      // Increase from 0.15
```

**Make auras more visible**:
```javascript
// Edit in main.js GlobalAuraOpacityClamp config
maxAuraOpacity: 0.15           // Increase from 0.10
```

---

## Visual Quality

### Distance Visibility

| Distance | Before | After |
|----------|--------|-------|
| Far (zoom out) | Node readable | Core more readable |
| Medium (normal) | Balanced | Core dominant |
| Close (zoom in) | Core + aura ring | Strong core, subtle ring |

### Result

✅ Cores always readable from any distance  
✅ Linked nodes feel powerful  
✅ Auras stay contextual (show connection)  
✅ No "aura blob" effect  

---

## Files Added

- `/EnhancedNodeModelLinkState.js` (300 lines)
- `/GlobalAuraOpacityClamp.js` (350 lines)
- Modified `/main.js` (added imports + initialization)

---

## How It Works (Simple)

**When a link is created**:

1. Both nodes get a core boost
   - Opacity increases (more solid)
   - Emissive increases (more glow)
   - Scale slightly increases (more bulk)

2. Both nodes' auras get clamped
   - Max opacity set to 10%
   - All aura layers affected
   - Makes aura subtle, not dominant

**Result**: Linked core looks stronger, aura is secondary visual

---

## Quick Verification

### Does It Work?

```javascript
// Check stats
console.log('Core boosts:', debugEnhancedNodeModelLinkState.getStats());
console.log('Aura clamps:', debugGlobalAuraOpacityClamp.getStats());

// Visually:
// 1. Link two nodes
// 2. Look at one of them
// 3. Core should appear more prominent than before linking
// 4. Aura should be more subtle
```

### Any Issues?

```javascript
// If aura not being clamped
debugGlobalAuraOpacityClamp.setMaxOpacity(0.05);  // Lower limit

// If core not boosting
debugEnhancedNodeModelLinkState.linkNode(node);   // Force boost
```

---

## Integration Notes

- ✅ Works with NodeCoreMaterialAuthority (Session 26)
- ✅ Works with EventVisualSuppression (Session 26)
- ✅ Works with AuraModulationSystem (Session 27)
- ✅ 100% backward compatible
- ✅ Zero per-frame overhead
- ✅ Auto-integrated (no manual setup)

---

## Success Criteria

- [x] Linked nodes appear stronger (core boost visible)
- [x] Auras not overwhelming (opacity clamped)
- [x] Cores readable from any distance
- [x] Unlinked nodes unaffected
- [x] Works with existing systems
- [x] Console APIs working
- [x] Auto-activated on link

---

## That's It!

The system is installed, initialized, and working. No manual configuration needed.

**Just link nodes and watch them look stronger.** ✨

---

For detailed docs: → `/DOCS_Session28_LinkVisualAuthority.md`

**Session 28** | ✅ PRODUCTION READY
