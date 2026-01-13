# Selected Node HUD — Quick Reference

## 📍 Location
- **File:** `UISelectedHUD.js` (270 lines)
- **Position:** Top-right corner (20px from top, 120px from right edge)
- **Z-Index:** 999999 (above all UI)

## 🔗 Integration Points

### main.js
- **Line 114:** Import statement added
- **Line 446:** `this.setupSelectedNodeHUD()` call
- **Lines 2871-2881:** Setup method

## 🎯 What It Does

**When you LMB-click a node:**
- HUD displays: `SELECTED: <CODE> (<NAME>) [TYPE]`
- Example: `SELECTED: INP-042 (AudioInput) [INPUT]`

**When you press ESC:**
- HUD displays: `SELECTED: NONE`
- Gray dimmed appearance

## 📡 Event System

```javascript
// Automatically connected to SelectionCore
selectionCore.onNodeSelected(callback)   // Fires on click
selectionCore.onNodeDeselected(callback) // Fires on ESC
```

## 🎨 Styling

| Property | Value |
|----------|-------|
| Position | fixed, top-right |
| Color | #7FFFD4 (aquamarine) |
| Background | rgba(0,0,0,0.35) with blur |
| Font | JetBrains Mono |
| Border | 12px radius, neon glow |

## ✅ Console Signals

On startup, you'll see:
```
[SelectedHUD] Active ✓
[SelectedHUD] Connected to SelectionCore
[SelectedHUD] Selected: <NODE_NAME>
```

## 🧪 Quick Test

1. Load game
2. Click any node
3. HUD should show: `SELECTED: <NODE_INFO>`
4. Press ESC
5. HUD should show: `SELECTED: NONE`

## 🔧 API

```javascript
// Get the HUD instance
import { getSelectedHUD } from './UISelectedHUD.js'
const hud = getSelectedHUD()

// Manual control
hud.updateDisplay(node)      // Force display update
hud.clear()                  // Reset to NONE
hud.show() / hide()          // Visibility control
hud.getIsVisible()           // Check if visible
```

---

**Status:** ✅ Production Ready
