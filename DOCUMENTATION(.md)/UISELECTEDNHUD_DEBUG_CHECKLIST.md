# UISelectedHUD Debugging Checklist — Quick Reference

## 🔍 How to Verify the Fix

### Step 1: Open Browser Console
```
F12 or Cmd+Option+I
```

### Step 2: Select a Node in Game
- Use **LMB** to click on any node
- Watch the HUD in top-right corner

### Step 3: Check Console Output
Look for this pattern:
```
[SelectedHUD] Node [category] linked to: [cat1], [cat2], [cat3]
```

**Example:** `[SelectedHUD] Node process linked to: analytics, input, storage`

---

## 🧪 Test Cases

### Test A: Simple Connection (1 Link)
```
1. Find a node connected to exactly 1 other node
2. Click it
3. Expected HUD: "SELECTED: [NAME] [TYPE] → LINKED: [CATEGORY]"
4. Console should show: "[SelectedHUD] Node [type] linked to: [category]"
```

### Test B: Multiple Connections (3+ Links)
```
1. Find a node with connections to 3+ different nodes
2. Click it
3. HUD should show ALL linked categories, deduplicated
4. Example: "SELECTED: NODE [PROCESS] → LINKED: ANALYTICS, INPUT, STORAGE"
5. Console: "[SelectedHUD] Node process linked to: analytics, input, storage"
```

### Test C: No Connections
```
1. Find an isolated node (no links)
2. Click it
3. HUD should show: "SELECTED: NODE [TYPE] → LINKED: NONE"
4. Console should NOT show debug line (no links to display)
```

### Test D: Unlink and Refresh
```
1. Select a node with multiple links
2. RMB click to unlink one connection
3. HUD should update immediately
4. Console should show updated linked categories
```

---

## 🐛 Troubleshooting

### Problem: HUD Shows "LINKED: NONE" But Connections Exist

**Check 1:** Is NodeLinkingSystem reporting links?
```javascript
// In browser console:
game.linkingSystem.getNodeLinks(game.selectedNode)
// Should return array with 1+ elements
```

**Check 2:** Do nodes have userData.category?
```javascript
// In browser console:
game.selectedNode.userData.category  // Should NOT be undefined
```

**Check 3:** Are linked nodes valid?
```javascript
// In browser console:
const links = game.linkingSystem.getNodeLinks(game.selectedNode);
links.forEach(link => {
    const other = link.source === game.selectedNode ? link.target : link.source;
    console.log('Linked node category:', other.userData.category);
});
```

---

### Problem: Console Shows Error in updateLinkedCategories

**Check:** Is linkingSystem connected?
```javascript
// In browser console:
window.game.selectedHUD.linkingSystem
// Should NOT be null
```

**Fix:**
```javascript
// Manually reconnect HUD
const hud = window.game.selectedHUD;
hud.setLinkingSystem(window.game.linkingSystem);
```

---

### Problem: Category Names Show Wrong/Incomplete

**Check:** What's in node.userData?
```javascript
// In browser console:
const node = game.selectedNode;
console.log('userData keys:', Object.keys(node.userData));
console.log('category:', node.userData.category);
console.log('nodeType:', node.userData.nodeType);
console.log('type:', node.userData.type);
```

**Expected:** At least one of the above should be defined (usually `category`)

---

## 📊 Category Reference (ATOMA Standard)

Valid categories (from AINodes.js line 536):
```
'input'
'process'
'integration'
'analytics'
'storage'
'control'
'quantum'
'sigma'
'mythic'
'prime'
'error'
'emotional'
```

The HUD will display any of these in uppercase, deduplicated, alphabetical order.

---

## 🎯 Verification Checklist

- [ ] Click node with 1 link → HUD shows linked category
- [ ] Click node with 3+ links → HUD shows all categories, deduplicated
- [ ] Click isolated node → HUD shows "LINKED: NONE"
- [ ] RMB unlink a connection → HUD updates immediately
- [ ] Check console for debug output when selecting nodes with links
- [ ] No console errors when selecting/unselecting nodes
- [ ] HUD text color is aquamarine (#7FFFD4)
- [ ] HUD positioned correctly (top-right, 140px from right edge)

---

## 🔧 Manual Testing Code

Paste in browser console to test:

```javascript
// Get selected node
const node = game.selectedNode;
console.log('Selected node category:', node.userData.category);

// Get all links
const links = game.linkingSystem.getNodeLinks(node);
console.log('Total links:', links.length);

// Show each linked node's category
links.forEach((link, i) => {
    const linked = link.source === node ? link.target : link.source;
    console.log(`Link ${i}: ${linked.userData.category || 'UNKNOWN'}`);
});

// Manually trigger HUD update
window.game.selectedHUD.updateLinkedCategories(node);
window.game.selectedHUD.updateDisplay(node);
```

---

## 📝 Debug Output Examples

### ✅ Good (Working Correctly)
```
[SelectedHUD] Node process linked to: analytics, input
SELECTED: NODE [PROCESS] → LINKED: ANALYTICS, INPUT
```

### ❌ Bad (Issues to Fix)
```
SELECTED: NODE [PROCESS] → LINKED: NONE
(But console shows node has 2 links)
↑ Category extraction failed - check userData structure
```

---

## 💡 Pro Tips

1. **Node Count Display:** Open left panel to see total node count and categories
2. **Category Colors:** Each category has a unique neon color in the 3D view
3. **Link Visualization:** Links appear as glowing lines between connected nodes
4. **Performance:** HUD updates instantly - no lag even with 20+ links

---

**Last Updated:** v3.0 Category Extraction Fix  
**Status:** Ready for QA Testing
