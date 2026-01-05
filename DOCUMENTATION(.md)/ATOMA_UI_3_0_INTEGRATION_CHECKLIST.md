# ATOMA UI 3.0 — Integration Checklist

**Quick setup guide for adding ATOMA UI 3.0 to your main.js**

---

## Step-by-Step Integration

### ✅ Step 1: Add Imports (at top of main.js)

```javascript
import { UIWorldStatusBar } from './UIWorldStatusBar.js';
import { UINodeInspectPanel } from './UINodeInspectPanel.js';
import { UIHudManager } from './UIHudManager.js';
import { UINodeContextMenu } from './UINodeContextMenu.js';
import { UIHelpText } from './UIHelpText.js';
```

**Location:** After other imports (around line 80-85)

### ✅ Step 2: Add Instance Variables (in AtomaGame constructor)

```javascript
// ATOMA UI 3.0 Systems
this.ui = null;
```

**Location:** In constructor, around line 310

### ✅ Step 3: Initialize UI Systems (in init() method)

```javascript
// Initialize ATOMA UI 3.0
this.ui = {
  statusBar: new UIWorldStatusBar(),
  nodePanel: new UINodeInspectPanel(
    this.languageEngine,
    this.poetryEngine || null
  ),
  hud: new UIHudManager(this.aiNodes),
  helpText: new UIHelpText()
};

// Context menu (initialized after node panel reference exists)
this.ui.contextMenu = new UINodeContextMenu(
  this.scene,
  this.camera,
  this.linkingSystem,
  this.ui.nodePanel
);
```

**Location:** In init() method, after Three.js setup (around line 400-450)

### ✅ Step 4: Add Input Handlers (in mouse/input setup)

```javascript
// Left-click: Select node
window.addEventListener('click', (event) => {
  if (event.button !== 0) return;  // Only left-click
  
  // Your existing raycasting code
  const hitNode = yourRaycastingLogic();
  
  if (hitNode && this.ui.nodePanel) {
    this.ui.nodePanel.show(hitNode);
  }
});

// Right-click: Open context menu
window.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  
  // Your existing raycasting code
  const hitNode = yourRaycastingLogic();
  
  if (hitNode && this.ui.contextMenu) {
    const screenPos = { x: event.clientX, y: event.clientY };
    this.ui.contextMenu.open(hitNode, screenPos);
  }
});

// ESC: Close panels and menu
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (this.ui.nodePanel) this.ui.nodePanel.hide();
    if (this.ui.contextMenu) this.ui.contextMenu.close();
  }
});

// TAB: Toggle HUD mode (UIHudManager already listens for this)
// No additional handler needed—built into UIHudManager
```

**Location:** In init() or setupPlayer() method, in your input setup section

### ✅ Step 5: Add Update Calls (in animate loop)

```javascript
animate() {
  requestAnimationFrame(() => this.animate());
  
  const deltaTime = this.clock.getDelta();
  this.time += deltaTime;
  
  // Update UI systems
  if (this.ui) {
    // Update status bar
    this.ui.statusBar.update(deltaTime, {
      worldName: this.currentWorldName || 'NEON DREAM',
      seed: this.worldSeed || null,
      fps: Math.round(1 / deltaTime),
      nodes: this.aiNodes?.nodes?.length || 0,
      links: this.linkingSystem?.links?.length || 0,
      mood: this.consciousnessLayer?.storms?.stormState?.currentMood || 'CALM',
      currentTime: this.time
    });
    
    // Update HUD
    this.ui.hud.update(deltaTime, {
      synergy: this.metrics?.synergy || 50,
      harmony: this.metrics?.harmony || 50,
      instability: this.metrics?.instability || 20,
      corruption: this.metrics?.corruption || 10,
      load: this.metrics?.load || 45,
      cycle: this.metrics?.cycle || 0,
      score: this.score || 0,
      aeon: this.aeon || 0,
      worldMode: this.currentWorldName || 'DREAM'
    });
    
    // Update context menu (for camera focus animation)
    this.ui.contextMenu.update(deltaTime);
  }
  
  // ... existing updates ...
  
  // Render
  this.renderer.render(this.scene, this.camera);
}
```

**Location:** In animate() method, after your existing updates but before render call

### ✅ Step 6: Add Disposal (on game cleanup)

```javascript
dispose() {
  // Dispose UI systems
  if (this.ui) {
    this.ui.statusBar?.dispose();
    this.ui.nodePanel?.dispose();
    this.ui.hud?.dispose();
    this.ui.contextMenu?.dispose();
    this.ui.helpText?.dispose();
  }
  
  // ... existing disposal code ...
}
```

**Location:** In dispose() or resetWorld() method

---

## Minimal Setup (If You Need Just Node Panel + HUD)

If you only want the essential UI:

```javascript
// Import
import { UINodeInspectPanel } from './UINodeInspectPanel.js';
import { UIHudManager } from './UIHudManager.js';

// Initialize
this.ui = {
  nodePanel: new UINodeInspectPanel(this.languageEngine, this.poetryEngine),
  hud: new UIHudManager(this.aiNodes)
};

// Update
this.ui.nodePanel.update();
this.ui.hud.update(deltaTime, { /* metrics */ });

// Cleanup
this.ui.nodePanel.dispose();
this.ui.hud.dispose();
```

---

## Connecting to Your Raycasting System

**Where to add node selection logic:**

```javascript
// In your existing raycaster/input system
function selectNodeUnderCursor() {
  // Your existing raycasting code
  this.raycaster.setFromCamera(this.mouse, this.camera);
  
  // Find all nodes in scene
  const allNodes = [];
  this.scene.traverse((obj) => {
    if (obj.userData && obj.userData.category) {
      allNodes.push(obj);
    }
  });
  
  // Raycast
  const intersects = this.raycaster.intersectObjects(allNodes);
  
  if (intersects.length > 0) {
    const node = intersects[0].object;
    
    // Show in UI
    if (this.ui?.nodePanel) {
      this.ui.nodePanel.show(node);
    }
    
    return node;
  }
  
  return null;
}
```

---

## Connecting to Your Metrics System

**Where to update HUD with real metrics:**

Replace the `{ synergy: ..., harmony: ... }` object with your actual metrics:

```javascript
// Example: If you calculate metrics elsewhere
this.ui.hud.update(deltaTime, {
  synergy: this.calculateSynergy(),      // Your method
  harmony: this.calculateHarmony(),      // Your method
  instability: this.calculateInstability(),
  corruption: this.calculateCorruption(),
  load: this.getSystemLoad(),
  cycle: this.metrics.cycle,
  score: this.player.score,
  aeon: this.aeon,
  worldMode: this.worldManager.getCurrentName()
});
```

---

## Integration Checklist

- [ ] Step 1: Imports added
- [ ] Step 2: Instance variables declared
- [ ] Step 3: UI systems initialized in init()
- [ ] Step 4: Input handlers added (click, right-click, ESC, TAB)
- [ ] Step 5: Update calls added to animate loop
- [ ] Step 6: Disposal code added
- [ ] Test: Status bar visible and updating
- [ ] Test: Left-click on node shows panel
- [ ] Test: Right-click on node shows menu
- [ ] Test: TAB toggles HUD compact/full
- [ ] Test: ESC closes all panels/menus
- [ ] Test: No frame rate drops
- [ ] Test: All metrics display correctly
- [ ] Verify: No console errors

---

## Troubleshooting

### UI doesn't appear
- Check browser DevTools → Elements → Find `#ui-*` divs
- Verify z-index not blocked by other elements
- Check CSS isn't hiding them (opacity: 0, display: none, etc.)
- Verify initialize code ran (check for errors in console)

### Node panel shows "Unknown" meaning
- Verify languageEngine passed to UINodeInspectPanel
- Check that nodes have `userData.namingCode` set
- Verify Language Engine 2.0 is initialized

### HUD doesn't update
- Check aiNodes passed to UIHudManager
- Verify aiNodes.nodes array is populated
- Check update() called every frame
- Check metrics object keys match expected names

### Context menu crashes
- Verify scene, camera, linkingSystem passed
- Check nodeInspectPanel reference is valid
- Look for console errors with specific line number

### Performance issues
- Check DevTools Performance tab
- Verify only 5 UI modules initialized (not duplicates)
- Check update() throttling is working (HUD updates every 0.5s)
- Disable UI systems one by one to isolate

---

## Console Debugging

```javascript
// Check if UI initialized
console.log('UI:', window.atoma?.ui);  // Or your game instance reference

// Force visibility
document.getElementById('ui-world-status-bar').style.display = 'block';

// Toggle all UI
document.querySelectorAll('[id^="ui-"]').forEach(el => {
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
});

// Manually trigger node panel
window.atoma.ui.nodePanel.show(window.atoma.aiNodes.nodes[0]);

// Manually trigger context menu
window.atoma.ui.contextMenu.open(
  window.atoma.aiNodes.nodes[0],
  { x: window.innerWidth / 2, y: window.innerHeight / 2 }
);

// Toggle HUD mode
window.atoma.ui.hud.toggleMode();
```

---

## Expected Performance

After integration, you should see:

- **Frame time:** <0.3ms added (usually <0.15ms)
- **Memory:** +~50KB for UI DOM elements
- **Startup time:** <50ms (UI init)
- **No jank or stuttering:** Smooth animations

If you see worse, check:
1. Are you calling update() every frame? (Should be in animate loop)
2. Are there duplicate UI systems? (Check for multiple init calls)
3. Is DOM thrashing happening? (Check DevTools Performance tab)

---

## Quick Reference

| Key | Action |
|-----|--------|
| **LMB** | Select node (opens panel) |
| **RMB** | Context menu |
| **TAB** | Toggle HUD Compact/Full |
| **ESC** | Close panels/menu |

---

## Integration Complete! 🎉

Once all steps are done and checklist passes:

✅ **Status bar** shows world status, FPS, mood  
✅ **Node panel** shows archetype, metrics, poetry  
✅ **HUD** shows metrics, switchable to distribution table  
✅ **Context menu** provides node actions  
✅ **Help text** shows controls  

**ATOMA UI 3.0 is now live!**

---

For detailed module documentation, see: `ATOMA_UI_3_0_SUMMARY.md`
