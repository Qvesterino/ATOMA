# ATOMA UI 3.7 — QUICK REFERENCE

## What's New?

**Primary Node System** — Double-click to set a linking source node, then single-click any node to create links instantly.

---

## USER GUIDE

### Actions

| Input | Action | Result |
|-------|--------|--------|
| **Double-click** node | Set as primary | Shows neon ring aura |
| **Double-click** primary again | Toggle off | Aura disappears |
| **Single-click** (no primary) | Select node | Normal selection |
| **Single-click** (with primary) | Link from primary | Link created, node selected |
| **Single-click** empty | Deselect | Selection cleared (primary stays) |
| **RMB** selected + links | Unlink all | All links removed (primary stays) |
| **E key** | Context menu | Opens for selected node |
| **ESC** | Close UI | Closes menus (primary stays) |

### Visual Feedback

- **Aura:** Large neon ring around primary node, category color, rotating
- **TopBar:** "PRIMARY NODE: [CODE] — [ARCHETYPE]" at 70px (magenta)
- **Badge:** White dot under crosshair when selected (cyan)
- **Highlight:** Pulsing ring around selected (cyan)

---

## WORKFLOW EXAMPLES

### Fast Multi-Link

```
Double-click Node A
  → A becomes primary (aura visible)
  → TopBar shows "PRIMARY NODE: A-CODE"

Single-click Node B
  → Link A→B created
  → B selected

Single-click Node C
  → Link A→C created
  → C selected

Single-click Node D
  → Link A→D created
  → D selected

ESC
  → All UI closes
  → A still primary (ready for more links)
```

### Link Modification

```
Double-click Node A (set primary)
Single-click Node B (link A→B)
RMB on B (unlink all connections)
  → All links from B removed
  → A still primary
  → B still selected
```

### Cancel Primary

```
Double-click Node A (A becomes primary)
Double-click Node A (toggle off)
  → A still selected but no longer primary
  → Aura gone
```

---

## DEVELOPER API

### Selection Core (Primary Methods)

```javascript
// Double-click detection
core.recordClickForDoubleDetection(node)     // → boolean

// Primary management
core.setPrimaryNode(node)                    // → boolean
core.clearPrimaryNode()                      // → boolean

// Query primary
core.isPrimary(node)                         // → boolean
core.getPrimaryNode()                        // → Object|null
core.getPrimaryNodeCode()                    // → String|null

// Events
core.onPrimaryNodeChanged((oldPrim, newPrim) => {
  // Handle primary node change
});
```

### Primary Aura (Visual System)

```javascript
aura.showAura(node)          // Display aura
aura.hideAura()              // Hide aura
aura.update(deltaTime)       // Animate
aura.setEnabled(true/false)  // Toggle visibility
aura.dispose()               // Cleanup
```

### Primary TopBar (HUD Display)

```javascript
topBar.show(node)            // Display primary info
topBar.hide()                // Hide bar
topBar.update()              // Sync with SelectionCore
topBar.dispose()             // Cleanup
```

---

## CONSOLE COMMANDS

```javascript
// Query primary
game.selectionCore.getPrimaryNode()
game.selectionCore.getPrimaryNodeCode()
game.selectionCore.isPrimary()

// Set/clear (debug)
game.selectionCore.setPrimaryNode(node)
game.selectionCore.clearPrimaryNode()

// Check aura
game.primaryNodeAura.auraMeshes.size       // Count of active auras
game.primaryNodeAura.enabled               // Is enabled?

// Toggle aura visibility
game.primaryNodeAura.setEnabled(false)     // Hide
game.primaryNodeAura.setEnabled(true)      // Show
```

---

## TECHNICAL SPECS

| Metric | Value |
|--------|-------|
| **Double-click timeout** | 250ms |
| **Aura ring radius** | 2.5× node radius |
| **Aura bob height** | ±0.3× node radius |
| **Aura bob frequency** | 1.5 cycles/sec |
| **Ring rotation** | 0.3 rad/s (X), 0.5 rad/s (Y) |
| **Pulse opacity range** | 0.1–0.5 |
| **Ring opacity range** | 0.45–0.75 |
| **TopBar position** | 70px from top |
| **TopBar fade** | 150ms |
| **Performance** | <0.3ms/frame |
| **Memory** | +50 KB |

---

## FILES

### Created
- `/_UIPrimaryNodeAura3_7.js` — Visual aura system
- `/_NodeLinking2_3.js` — Unified mouse + double-click
- `/_UIPrimaryNodeTopBar3_7.js` — HUD bar

### Modified
- `/_NodeSelectionCore3_4.js` — Added primary node API
- `/main.js` — Setup + integration + update loop

---

## COMPATIBILITY

✅ Works with UI 3.4 (backward compatible)  
✅ Works with all existing systems  
✅ Zero breaking changes  
✅ Optional feature (can use normal clicking)  

---

## TROUBLESHOOTING

**Aura not showing?**
- Check `game.primaryNodeAura.enabled`
- Verify primary node with `game.selectionCore.getPrimaryNode()`

**Double-click not working?**
- Timing must be <250ms between clicks
- Must be same node both times
- Verify with console: `game.selectionCore.lastClickedNode`

**Primary won't clear?**
- Use `game.selectionCore.clearPrimaryNode()` in console
- Or double-click the primary node again
- ESC only clears selection, not primary

**Aura moving incorrectly?**
- Aura bobs vertically only (Y-axis)
- Should rotate smoothly
- Check frame rate (should be 60+ FPS)

---

## SHORTCUTS

```javascript
// Enable dev mode
window.enableDevMode = true;

// Quick queries
var prim = game.selectionCore.getPrimaryNode();
var isPrimary = game.selectionCore.isPrimary(someNode);

// Quick actions
game.selectionCore.setPrimaryNode(someNode);
game.primaryNodeAura.hideAura();
```

---

*ATOMA UI 3.7 — Double-click Primary Node System*
