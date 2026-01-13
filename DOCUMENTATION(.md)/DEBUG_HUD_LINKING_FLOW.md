# HUD Linking Debug Flow — Step by Step

## 🔍 What to Watch For in Console

After these fixes, the console should show this sequence when you start the game:

### Stage 1: HUD Initialization (main.js line 2881)
```
[main.js] setupSelectedNodeHUD: linking system is: NULL
[main.js] setupSelectedNodeHUD: linkingSystem not yet created, will connect in createAINodes
✓ Selected Node HUD initialized (top-right corner)
```

### Stage 2: NodeLinkingSystem Creation (main.js line 859)
```
[main.js] NodeLinkingSystem created ✓
[main.js] Connecting selectedHUD to new linkingSystem
[SelectedHUD] ✓ Connected to NodeLinkingSystem
[main.js] ✓ HUD connected to linkingSystem
```

### Stage 3: Node Selection (NodeLinkingSystem line 323)
```
✓ Node selected: storage
[SelectedHUD] Callback fired - node selected: storage
[SelectedHUD] Got X links for node
[SelectedHUD]   → Linked node category: analytics
[SelectedHUD]   → Linked node category: input
[SelectedHUD] ✓ Extracted 2 unique categories: analytics, input
```

### Stage 4: Link Creation (NodeLinkingSystem line 1561)
```
✓ Link created: storage → analytics [★ NORMAL synergy] [SAFE VFX PACK ACTIVE]
```

### Expected Final HUD Display
```
SELECTED: NODE [STORAGE] → LINKED: ANALYTICS, INPUT
```

---

## 🧪 Test Procedure

1. **Start Game**
   - Watch console for initialization sequence (Stages 1-2)
   - Verify `[SelectedHUD] ✓ Connected to NodeLinkingSystem` appears

2. **Click on a Node**
   - Watch console for callback firing (Stage 3)
   - Check if `Got X links for node` shows > 0
   - Verify categories are being extracted

3. **Create a Link**
   - Watch console for `Link created:` message (Stage 4)
   - Select either end of the link
   - Verify HUD displays the linked category

4. **Test Unlink (RMB)**
   - Select a node with links
   - RMB click to unlink
   - Verify HUD updates immediately to `LINKED: NONE`

---

## 🐛 Debugging Each Component

### If Stage 1 Fails
```
[ISSUE] setupSelectedNodeHUD not running
[ACTION] Check main.js line 446 - should call setupSelectedNodeHUD()
```

### If Stage 2 Fails
```
[ISSUE] [SelectedHUD] setLinkingSystem called with null - ignoring
[ACTION] Check main.js createAINodes() - must call setLinkingSystem AFTER creating linkingSystem
```

### If Stage 3 Fails
```
[ISSUE] Callback not firing when node selected
[POSSIBLE CAUSES]:
  1. setLinkingSystem() wasn't called properly
  2. onNodeSelected() callback wasn't registered
  3. selectNode() isn't calling _fireSelectCallbacks()

[ACTION] Check:
  - UISelectedHUD.setLinkingSystem() actually calls linkingSystem.onNodeSelected()
  - NodeLinkingSystem._fireSelectCallbacks() is being called
  - Verify callback is in onSelectCallbacks array
```

### If Stage 4 Fails (Links Created but HUD Shows NONE)
```
[ISSUE] Got 0 links for node (but console shows Link created)
[POSSIBLE CAUSES]:
  1. getNodeLinks() not finding links
  2. Link storage structure is different
  3. Link source/target comparison failing

[ACTION] Check:
  - this.links array actually contains the links
  - Link objects have source and target properties
  - Node reference equality is working (link.source === node)
```

---

## 🔗 Console Command Reference

### Check HUD Status
```javascript
// Check if HUD is connected
window.game.selectedHUD.linkingSystem

// Check if links exist
window.game.linkingSystem.links.length

// Get links for current selection
window.game.linkingSystem.getNodeLinks(window.game.linkingSystem.selectedNode)

// Manually trigger HUD update
window.game.selectedHUD.refreshDisplay()
```

### Manual Link Creation
```javascript
// Select two nodes manually and create link
const nodes = window.game.aiNodes.nodes;
window.game.linkingSystem.attemptLink(nodes[0], nodes[1]);
```

### Force HUD Reset
```javascript
// Completely reset HUD
window.game.selectedHUD.linkedCategories = [];
window.game.selectedHUD.updateDisplay(window.game.selectedHUD.selectedNode);
```

---

## 📊 Expected Console Output Examples

### Good Output (Working)
```
✓ Node selected: analytics
[SelectedHUD] Callback fired - node selected: analytics
[SelectedHUD] Got 3 links for node
[SelectedHUD]   → Linked node category: input
[SelectedHUD]   → Linked node category: storage
[SelectedHUD]   → Linked node category: process
[SelectedHUD] ✓ Extracted 3 unique categories: input, process, storage
```

### Bad Output (Not Working)
```
✓ Node selected: analytics
[SelectedHUD] updateLinkedCategories: linkingSystem not connected!
[SelectedHUD] Got 0 links for node
```

### Common Errors
```
[SelectedHUD] setLinkingSystem called with null - ignoring
  → HUD was connected to null linkingSystem

[main.js] selectedHUD is not initialized!
  → HUD wasn't created before createAINodes() was called

[SelectedHUD] Callback fired - but Got 0 links
  → getNodeLinks() not finding links (link storage issue)
```

---

## 🎯 Success Criteria

✅ All green means HUD is working:
- [ ] Stage 1: `setupSelectedNodeHUD` logs show
- [ ] Stage 2: `Connected to NodeLinkingSystem` logs show
- [ ] Stage 3: Callback fires when node clicked
- [ ] Stage 4: Got X > 0 links for node
- [ ] Stage 5: Categories extracted and displayed in HUD
- [ ] Stage 6: HUD text matches `LINKED: [CATEGORIES]`

---

## 🔄 Full Execution Flow

```
Game Start
  ↓
setupSelectedNodeHUD() [main.js:2881]
  → getSelectedHUD() creates HUD instance
  → this.linkingSystem is NULL
  → setLinkingSystem(null) returns early
  → HUD stored in this.selectedHUD ✓
  ↓
setupPrimaryNodeSystem() [main.js:2934]
  → Creates NodeLinking2_3
  ↓
createAINodes() [main.js:850]
  → AINodes created
  → NodeLinkingSystem created ✓
  → setLinkingSystem(linkingSystem) called on HUD ✓
    → Registers onNodeSelected callback ✓
  ↓
User Clicks Node
  ↓
NodeLinkingSystem.handleClick() [NodeLinkingSystem.js:~200]
  → selectNode(node)
    → _fireSelectCallbacks(node) ✓
      → HUD callback fired ✓
        → updateLinkedCategories(node) ✓
          → getNodeLinks(node) returns array ✓
          → Extract categories ✓
          → updateDisplay() ✓
            → HUD shows "LINKED: [CATEGORIES]" ✓
```

---

**Next Steps:**
1. Reload the game
2. Open console (F12)
3. Look for the log sequence above
4. Click a node and watch console output
5. Report any divergence from expected sequence

