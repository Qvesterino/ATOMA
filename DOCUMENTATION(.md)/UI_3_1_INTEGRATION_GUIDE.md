# ATOMA UI 3.1 — Complete Integration Guide

**Quick Integration:** ~15 minutes  
**Full Testing:** ~30 minutes  
**Rollback Time:** <2 minutes  

---

## 📋 Pre-Integration Checklist

- [ ] All 5 new component files downloaded
- [ ] main.js backed up
- [ ] UIHudManager.js backed up
- [ ] Project compiles successfully
- [ ] No console errors before starting

---

## 🚀 Step-by-Step Integration

### PHASE 1: File Setup (2 minutes)

**1.1 Copy Component Files**

Copy these 5 files to your project root:
```
_UINodeAutoDetect3_1.js
_UICategoryLegend3_1.js
_AIEmotionalFeed3_1.js
_NodeLinking2_0.js
_UINodeHoverTooltip3_1.js
```

**Verification:**
```bash
ls -1 _UI*.js | wc -l  # Should show 5
```

---

### PHASE 2: main.js Updates (5 minutes)

**2.1 Add Imports (at top of main.js, after existing imports)**

Find this section:
```javascript
import { AtomaLanguageEngine3_0, setupAtomaLanguageEngine3ConsoleAPI } from './_AtomaLanguageEngine3_0.js';
// ← Add new imports here
```

Add these 5 lines:
```javascript
import { UINodeAutoDetect3_1 } from './_UINodeAutoDetect3_1.js';
import { UICategoryLegend3_1 } from './_UICategoryLegend3_1.js';
import { AIEmotionalFeed3_1 } from './_AIEmotionalFeed3_1.js';
import { NodeLinking2_0 } from './_NodeLinking2_0.js';
import { UINodeHoverTooltip3_1 } from './_UINodeHoverTooltip3_1.js';
```

**2.2 Add Constructor Properties**

Find the constructor where other UI properties are declared:
```javascript
// Around line 300:
this.poetryEngine = null; // Initialized after consciousness layer ready

// ← Add after this line:
```

Add these 5 lines:
```javascript
// ATOMA UI 3.1 Systems
this.autoDetect = null;              // Node auto-detection (8° cone)
this.categoryLegend = null;          // Category reference panel
this.emotionalFeed = null;           // AI poetic status feed
this.nodeLinking = null;             // Improved node interaction
this.hoverTooltip = null;            // Quick-look node tooltip
```

**2.3 Add Setup Methods**

Find this section:
```javascript
this.setupLanguageEngine();
this.setupLinguisticOverlay();
this.setupPoetryEngine();
this.setupDebugCommands();
this.animate();
```

Add these calls before `this.animate()`:
```javascript
this.setupNodeAutoDetect();
this.setupCategoryLegend();
this.setupEmotionalFeed();
this.setupNodeLinking();
this.setupHoverTooltip();
```

**2.4 Add Setup Methods to Game Class**

Add these 5 methods to your Game class (before the `animate()` method):

```javascript
/**
 * Setup Node Auto-Detect 3.1
 */
setupNodeAutoDetect() {
  this.autoDetect = new UINodeAutoDetect3_1(
    this.camera,
    this.scene,
    this.nodeInspectPanel  // Pass existing panel
  );
  console.log('✓ Node Auto-Detect 3.1 initialized');
}

/**
 * Setup Category Legend 3.1
 */
setupCategoryLegend() {
  this.categoryLegend = new UICategoryLegend3_1();
  console.log('✓ Category Legend 3.1 initialized');
}

/**
 * Setup AI Emotional Feed 3.1
 */
setupEmotionalFeed() {
  this.emotionalFeed = new AIEmotionalFeed3_1(
    this.aiNodes,
    this.emergentThoughtStorms  // Pass thought storms system
  );
  console.log('✓ AI Emotional Feed 3.1 initialized');
}

/**
 * Setup Node Linking 2.0
 */
setupNodeLinking() {
  this.nodeLinking = new NodeLinking2_0(
    this.scene,
    this.camera,
    this.renderer,
    this.aiNodes,
    this.linkingSystem
  );
  
  // Set UI references for integration
  this.nodeLinking.setUIReferences(
    this.nodeInspectPanel,
    this.contextMenu  // Your existing context menu
  );
  
  console.log('✓ Node Linking 2.0 initialized');
}

/**
 * Setup Node Hover Tooltip 3.1
 */
setupHoverTooltip() {
  this.hoverTooltip = new UINodeHoverTooltip3_1(
    this.camera,
    this.scene
  );
  console.log('✓ Node Hover Tooltip 3.1 initialized');
}
```

**2.5 Update animate() Method**

Find the animate method:
```javascript
animate() {
  requestAnimationFrame(() => this.animate());
  const deltaTime = this.clock.getDelta();
  
  // ... existing updates ...
  
  this.renderer.render(this.scene, this.camera);
}
```

Add these 4 lines BEFORE `this.renderer.render()`:
```javascript
// Update ATOMA UI 3.1 systems
if (this.autoDetect) this.autoDetect.update(deltaTime);
if (this.emotionalFeed) this.emotionalFeed.update(deltaTime);
if (this.nodeLinking) this.nodeLinking.update(deltaTime);
if (this.hoverTooltip) this.hoverTooltip.update(deltaTime);
```

---

### PHASE 3: UIHudManager.js Update (1 minute)

**3.1 Change HUD Toggle Keybind**

Open `UIHudManager.js`

Find this section (around line 150):
```javascript
_setupEventListeners() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      this.toggleMode();
    }
  });
}
```

Change to:
```javascript
_setupEventListeners() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'c' || e.key === 'C') {
      this.toggleMode();
    }
  });
}
```

**Why:** TAB is reserved by Rosebud platform.

---

### PHASE 4: Optional - Add Cleanup (1 minute)

**4.1 Find the dispose() or cleanup() method**

Search for:
```javascript
dispose() {
  // ... existing cleanup ...
}
```

**4.2 Add UI 3.1 Cleanup**

Add before the final cleanup:
```javascript
// Cleanup ATOMA UI 3.1 systems
if (this.autoDetect) this.autoDetect.dispose();
if (this.categoryLegend) this.categoryLegend.dispose();
if (this.emotionalFeed) this.emotionalFeed.dispose();
if (this.nodeLinking) this.nodeLinking.dispose();
if (this.hoverTooltip) this.hoverTooltip.dispose();
```

---

## ✅ Verification Steps

### Step 1: Compile Check
```javascript
// In browser console:
typeof UINodeAutoDetect3_1          // Should be "function"
typeof UICategoryLegend3_1          // Should be "function"
typeof AIEmotionalFeed3_1           // Should be "function"
typeof NodeLinking2_0               // Should be "function"
typeof UINodeHoverTooltip3_1        // Should be "function"
```

### Step 2: Initialization Check
```javascript
// In browser console:
game.autoDetect                     // Should be UINodeAutoDetect3_1 object
game.categoryLegend                 // Should be UICategoryLegend3_1 object
game.emotionalFeed                  // Should be AIEmotionalFeed3_1 object
game.nodeLinking                    // Should be NodeLinking2_0 object
game.hoverTooltip                   // Should be UINodeHoverTooltip3_1 object
```

### Step 3: Performance Check
```javascript
// Monitor frame rate - should stay >55 FPS
// Check console for errors - should be clean
// Watch for memory leaks - should be stable
```

---

## 🧪 Functional Tests

### Test 1: Auto-Detection Cone
```
Action:     Move camera to face a node at 5m distance
Expected:   Inspect panel opens within 50ms
Result:     ✅ Pass / ❌ Fail

Action:     Move camera away from cone without looking
Expected:   Panel closes within 0.2s
Result:     ✅ Pass / ❌ Fail
```

### Test 2: Category Legend
```
Action:     Launch game
Expected:   Legend panel visible at top-left
Result:     ✅ Pass / ❌ Fail

Action:     Scroll legend (if needed)
Expected:   All 16 categories visible
Result:     ✅ Pass / ❌ Fail

Action:     Hover over category
Expected:   Background highlights
Result:     ✅ Pass / ❌ Fail
```

### Test 3: HUD Toggle
```
Action:     Press 'C' key
Expected:   HUD expands from compact to full mode
Result:     ✅ Pass / ❌ Fail

Action:     Press 'C' again
Expected:   HUD collapses to compact mode
Result:     ✅ Pass / ❌ Fail

Action:     Press 'TAB' key
Expected:   No effect (TAB disabled)
Result:     ✅ Pass / ❌ Fail
```

### Test 4: Emotional Feed
```
Action:     Watch bottom-center area for ~15 seconds
Expected:   Poetic text appears and fades, changes every 8-20s
Result:     ✅ Pass / ❌ Fail

Action:     Observe text content
Expected:   Different poetry styles reflect network state
Result:     ✅ Pass / ❌ Fail
```

### Test 5: Node Linking Workflow
```
Action:     Left-click on node A
Expected:   Node glows, inspect panel opens
Result:     ✅ Pass / ❌ Fail

Action:     Left-click on node B
Expected:   Link created, both nodes deselect
Result:     ✅ Pass / ❌ Fail

Action:     Left-click on empty space
Expected:   No effect
Result:     ✅ Pass / ❌ Fail
```

### Test 6: Right-Click Menu
```
Action:     Right-click on node
Expected:   Context menu appears with 5 options
Result:     ✅ Pass / ❌ Fail

Action:     Right-click empty space
Expected:   Linking mode cancels
Result:     ✅ Pass / ❌ Fail

Action:     Long-press (hold) RMB on node for 300ms+
Expected:   Camera smoothly focuses on node
Result:     ✅ Pass / ❌ Fail
```

### Test 7: Hover Tooltip
```
Action:     Aim at node from 5m distance
Expected:   Tooltip appears above node with CODE|CAT|METRICS
Result:     ✅ Pass / ❌ Fail

Action:     Get within 1.5m of node
Expected:   Tooltip disappears
Result:     ✅ Pass / ❌ Fail

Action:     Move to >10m distance
Expected:   Tooltip disappears
Result:     ✅ Pass / ❌ Fail
```

### Test 8: ESC Key
```
Action:     Open inspect panel, context menu, etc., then press ESC
Expected:   All UI closes instantly
Result:     ✅ Pass / ❌ Fail

Action:     During linking, press ESC
Expected:   Selection cancelled, panel closes
Result:     ✅ Pass / ❌ Fail
```

---

## 🎛️ Configuration Tweaks

### Adjust Auto-Detection Cone
Edit `_UINodeAutoDetect3_1.js` constructor:
```javascript
this.coneAngle = 8;        // Degrees (half-angle) - make smaller for tighter
this.maxDistance = 10;     // Meters - make smaller for closer range
this.timeoutDuration = 0.2; // Seconds - increase for longer before close
```

### Adjust Poetry Intervals
Edit `_AIEmotionalFeed3_1.js` constructor:
```javascript
this.minInterval = 8;   // Minimum seconds between updates
this.maxInterval = 20;  // Maximum seconds between updates
```

### Adjust Tooltip Range
Edit `_UINodeHoverTooltip3_1.js` constructor:
```javascript
this.minDistance = 2;   // Minimum distance (m)
this.maxDistance = 10;  // Maximum distance (m)
```

### Adjust Long-Press Duration
Edit `_NodeLinking2_0.js` constructor:
```javascript
this.longPressDuration = 0.3; // Seconds (0.3 = 300ms)
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find modules" Error
```
Error: _UINodeAutoDetect3_1 is not defined
Solution: 
  1. Verify file names match exactly (case-sensitive)
  2. Check files are in project root
  3. Restart dev server
```

### Issue: HUD Toggle Not Working
```
Error: 'C' key doesn't toggle HUD
Solution:
  1. Verify UIHudManager.js line ~150 changed
  2. Check event listener is attached
  3. Try pressing uppercase 'C' or lowercase 'c'
```

### Issue: Auto-Detection Not Triggering
```
Error: Panel doesn't open when aiming at node
Solution:
  1. Check camera is working (can look around)
  2. Increase coneAngle to 15° temporarily
  3. Check node has userData.isNode = true
  4. Verify autoDetect.update() is being called
```

### Issue: Tooltip Not Appearing
```
Error: Hover tooltip never shows
Solution:
  1. Verify distance is 2-10m from node
  2. Ensure hoverTooltip.update() is called
  3. Check console for errors
  4. Verify raycast is hitting nodes
```

### Issue: Performance Degradation
```
Error: Frame rate drops with UI 3.1
Solution:
  1. Check raycast throttle values (should be ~20 Hz)
  2. Reduce number of nodes if >500
  3. Disable auto-detect: autoDetect.setEnabled(false)
  4. Check console for repeated errors
```

### Issue: Memory Keeps Growing
```
Error: Browser memory usage increases over time
Solution:
  1. Call dispose() methods in cleanup
  2. Check event listeners are removed
  3. Monitor with DevTools Memory Profiler
  4. Verify no circular references
```

---

## 📞 Quick Debugging Commands

```javascript
// Check if all systems initialized
game.autoDetect?.constructor.name        // "UINodeAutoDetect3_1"
game.categoryLegend?.isVisible            // true/false
game.emotionalFeed?.timeSinceUpdate       // Current update timer
game.nodeLinking?.selectedNode            // Current node or null
game.hoverTooltip?.currentTooltipNode     // Current tooltip node or null

// Toggle systems on/off
game.autoDetect?.setEnabled(false)        // Disable auto-detect
game.categoryLegend?.hide()               // Hide legend
game.emotionalFeed?.dispose()             // Clean up feed
game.nodeLinking?.setEnabled(false)       // Disable linking

// Check performance
console.time('ui-update');
game.autoDetect?.update(0.016);
console.timeEnd('ui-update');             // Show ms taken

// Check UI element positions
document.getElementById('ui-category-legend').style.cssText
document.getElementById('ai-emotional-feed').style.cssText
document.getElementById('ui-node-hover-tooltip').style.cssText
```

---

## 🔄 Rollback Procedure (If Needed)

**Time to Rollback:** <2 minutes

### Quick Rollback
```bash
# Restore backed-up files
cp main.js.backup main.js
cp UIHudManager.js.backup UIHudManager.js

# Remove new files
rm _UINodeAutoDetect3_1.js
rm _UICategoryLegend3_1.js
rm _AIEmotionalFeed3_1.js
rm _NodeLinking2_0.js
rm _UINodeHoverTooltip3_1.js

# Reload page
# All UI 3.1 features will be gone
```

### Selective Disable
```javascript
// Instead of rollback, just disable systems:
game.autoDetect?.dispose();
game.categoryLegend?.dispose();
game.emotionalFeed?.dispose();
game.nodeLinking?.dispose();
game.hoverTooltip?.dispose();

// Or disable individually:
game.autoDetect?.setEnabled(false);
game.categoryLegend?.hide();
// etc.
```

---

## 📚 After Integration

### Documentation to Read
1. **UI_3_1_SUMMARY.md** — Overview and features
2. **UI_3_1_QUICKREF.md** — Quick reference card
3. **UI_3_1_CHANGELOG.md** — What changed
4. **UI_3_1_DELIVERY_REPORT.md** — Formal specs

### Next Steps
- [ ] Monitor frame rate for 30 minutes
- [ ] Gather user feedback
- [ ] Check browser console for warnings
- [ ] Test on multiple devices
- [ ] Schedule future enhancements

---

## ✨ Success Checklist

- [ ] All 5 component files added
- [ ] main.js updated (6 imports, 5 properties, 5 methods, 4 animate calls)
- [ ] UIHudManager.js updated (1 line changed)
- [ ] Code compiles without errors
- [ ] All 8 functional tests passing
- [ ] Frame rate >55 FPS maintained
- [ ] No memory leaks detected
- [ ] Documentation reviewed
- [ ] Team notified of changes
- [ ] Ready for production!

---

## 🎉 Completion

When all checks pass, UI 3.1 is successfully integrated and ready for production use!

```
┌─────────────────────────────────────┐
│  ✅ ATOMA UI 3.1 INTEGRATION COMPLETE│
│                                     │
│  Auto-Detection:     ✓ Active      │
│  Category Legend:    ✓ Visible     │
│  Emotional Feed:     ✓ Generating  │
│  Node Linking 2.0:   ✓ Active      │
│  Hover Tooltip:      ✓ Active      │
│                                     │
│  Performance: <0.5ms               │
│  Status: 🟢 READY FOR DEPLOYMENT   │
└─────────────────────────────────────┘
```

---

**Integration Guide Complete**  
**Estimated Total Time: 15-30 minutes**  
**Difficulty Level: Easy (straightforward copy-paste with setup)**

Need help? Refer to UI_3_1_QUICKREF.md or UI_3_1_SUMMARY.md

*Integrated with precision by Rosie — Production Ready* ✨
