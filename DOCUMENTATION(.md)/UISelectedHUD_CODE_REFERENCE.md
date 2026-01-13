# Selected Node HUD — Code Reference

## Complete Implementation Overview

---

## 📄 File 1: UISelectedHUD.js

**Location:** `/UISelectedHUD.js`  
**Lines:** ~270  
**Status:** ✅ NEW FILE

### Class Structure

```javascript
export class UISelectedHUD {
    constructor()
    _createHudElement()
    _setupStyles()
    _init()
    setSelectionCore(selectionCore)
    updateDisplay(node)
    clear()
    show()
    hide()
    toggleVisibility()
    getIsVisible()
}

export function getSelectedHUD()
```

### Key Implementation

#### DOM Element Creation
```javascript
_createHudElement() {
    const element = document.createElement('div')
    element.id = 'selected-hud'
    element.style.position = 'fixed'
    element.style.top = '20px'
    element.style.right = '120px'  // 120px offset to avoid fullscreen button
    element.style.padding = '8px 14px'
    element.style.background = 'rgba(0, 0, 0, 0.35)'
    element.style.backdropFilter = 'blur(6px)'
    element.style.color = '#7FFFD4'
    element.style.fontFamily = 'JetBrains Mono, monospace'
    element.style.letterSpacing = '1px'
    element.style.borderRadius = '12px'
    element.style.zIndex = '999999'
    element.textContent = 'SELECTED: NONE'
    document.body.appendChild(element)
}
```

#### SelectionCore Connection
```javascript
setSelectionCore(selectionCore) {
    this.selectionCore = selectionCore
    
    // Listen for selection events
    selectionCore.onNodeSelected((node) => {
        this.updateDisplay(node)
    })
    
    // Listen for deselection events
    selectionCore.onNodeDeselected((node) => {
        this.clear()
    })
}
```

#### Display Update
```javascript
updateDisplay(node) {
    const namingCode = node.userData.namingCode || ''
    const nodeName = node.userData.nodeName || node.userData.name || 'NODE'
    const nodeType = node.userData.type || node.userData.category || 'unknown'
    
    let displayText = 'SELECTED: '
    if (namingCode) {
        displayText += `${namingCode}`
        if (nodeName) {
            displayText += ` (${nodeName})`
        }
    } else if (nodeName) {
        displayText += nodeName
    } else {
        displayText += 'NODE'
    }
    
    if (nodeType && nodeType !== 'unknown') {
        displayText += ` [${nodeType.toUpperCase()}]`
    }
    
    this.hudElement.textContent = displayText
    this.hudElement.classList.remove('none')
    this.hudElement.classList.add('selected')
}
```

#### Clear Display
```javascript
clear() {
    this.hudElement.textContent = 'SELECTED: NONE'
    this.hudElement.classList.remove('selected')
    this.hudElement.classList.add('none')
}
```

---

## 📄 File 2: main.js (Modified)

**Location:** `/main.js`  
**Changes:** 3 sections modified

### Change 1: Import Statement (Line 114)

**Added:**
```javascript
import { getSelectedHUD } from './UISelectedHUD.js'
```

**Context:**
```javascript
// ============================================================================
// ATOMA UI 3.4–3.7 - ACTIVE SYSTEMS (Core Selection + Primary Node Linking)
// ============================================================================
import { NodeSelectionCore3_4 } from './_NodeSelectionCore3_4.js'
import { UISelectedNodeTopBar3_4 } from './_UISelectedNodeTopBar3_4.js'
import { NodeLinking2_3 } from './_NodeLinking2_3.js'
import { UIPrimaryNodeAura3_7 } from './_UIPrimaryNodeAura3_7.js'
import { UIPrimaryNodeTopBar3_7 } from './_UIPrimaryNodeTopBar3_7.js'
import { getSelectedHUD } from './UISelectedHUD.js'  // ← NEW
```

---

### Change 2: Initialization Call (Line 446)

**Added:**
```javascript
this.setupSelectedNodeHUD()
```

**Context:**
```javascript
// UI CORE
// --- UI CORE ---
this.setupSelectionCore()
this.setupSelectedNodeTopBar()
this.setupSelectedNodeHUD()  // ← NEW

// --- UI Visual Components ---
this.setupNodeInspectPanel()
this.setupContextMenu()
this.setupSelectedNodeBadge()
this.setupSelectedNodeHighlight()
this.setupSelectedNodeLabel()
```

---

### Change 3: Setup Method (Lines 2871-2881)

**Added new method:**
```javascript
/**
 * Setup Selected Node HUD
 * Displays selected node name and type in top-right corner
 */
setupSelectedNodeHUD() {
    const selectedHUD = getSelectedHUD()
    selectedHUD.setSelectionCore(this.selectionCore)
    this.selectedHUD = selectedHUD

    console.log('✓ Selected Node HUD initialized (top-right corner)')
}
```

**Location:** After `setupSelectedNodeTopBar()` method

---

## 🎨 CSS Animations (Built-in)

Defined in UISelectedHUD.js `_setupStyles()` method:

```css
@keyframes selected-hud-fade-in {
    from {
        opacity: 0
        transform: translateX(10px)
    }
    to {
        opacity: 1
        transform: translateX(0)
    }
}

#selected-hud {
    animation: selected-hud-fade-in 0.3s ease-out
}

#selected-hud.selected {
    color: #7FFFD4
    text-shadow: 0 0 12px rgba(127, 255, 212, 0.6)
    border-color: rgba(127, 255, 212, 0.4)
}

#selected-hud.none {
    color: #666
    text-shadow: 0 0 4px rgba(102, 102, 102, 0.3)
    border-color: rgba(102, 102, 102, 0.2)
}
```

---

## 🔄 Event Flow Diagram

```
User Input (LMB Click)
    ↓
Raycast Detection
    ↓
NodeLinking2_3.selectNode()
    ↓
selectionCore.selectNode(node)
    ↓
[Callback Fire]
    ↓
selectionCore.onNodeSelected(node)
    ↓
UISelectedHUD.updateDisplay(node)
    ↓
[DOM Update]
    ↓
HUD displays: "SELECTED: <NODE_INFO>"
```

---

## 📊 Data Flow

```
Node Object
    ├─ node.userData.namingCode    → Primary identifier (e.g., "INP-042")
    ├─ node.userData.nodeName      → Display name (e.g., "AudioInput")
    ├─ node.userData.name          → Fallback name
    ├─ node.userData.type          → Node type (e.g., "input")
    └─ node.userData.category      → Fallback category

    ↓

UISelectedHUD.updateDisplay()
    ├─ Extract all fields
    ├─ Apply fallback logic
    ├─ Format display string
    └─ Update DOM element

    ↓

HUD Display
    └─ "SELECTED: INP-042 (AudioInput) [INPUT]"
```

---

## 🧵 Execution Sequence

### On Game Start

```
1. main.js imports UISelectedHUD.js
   ↓
2. UISelectedHUD constructor runs
   ├─ _createHudElement()   → Create DOM element
   ├─ _setupStyles()         → Create CSS rules
   └─ _init()                → Initialize state
   
3. Console: "[SelectedHUD] Active ✓"
   ↓
4. Game instantiation
   ↓
5. setupSelectedNodeHUD() called
   ├─ getSelectedHUD()       → Get singleton
   └─ setSelectionCore()     → Connect to SelectionCore
   
6. Console: "[SelectedHUD] Connected to SelectionCore"
7. Console: "✓ Selected Node HUD initialized..."
```

### On Node Selection

```
User clicks node
    ↓
NodeLinking2_3 detects raycast hit
    ↓
selectionCore.selectNode(node)
    ↓
_fireSelect() broadcasts callback
    ↓
UISelectedHUD callback fires
    ↓
updateDisplay(node)
    ├─ Extract data from node.userData
    ├─ Format display string
    └─ Update DOM element
    
HUD shows node name/type
Console: "[SelectedHUD] Selected: <NAME>"
```

### On Deselection

```
User presses ESC
    ↓
NodeLinking2_3 detects ESC keydown
    ↓
selectionCore.deselectNode()
    ↓
_fireDeselect() broadcasts callback
    ↓
UISelectedHUD callback fires
    ↓
clear()
    ├─ Reset text to "SELECTED: NONE"
    ├─ Remove 'selected' class
    └─ Add 'none' class
    
HUD shows "SELECTED: NONE" (dimmed)
```

---

## 🔌 Integration Points

### SelectionCore3_4 Methods Used

```javascript
selectionCore.onNodeSelected(callback)     // Register selection listener
selectionCore.onNodeDeselected(callback)   // Register deselection listener
```

### Data Accessed from Node

```javascript
node.userData.namingCode        // Unique identifier
node.userData.nodeName          // Display name
node.userData.name              // Fallback name
node.userData.type              // Node type
node.userData.category          // Category (fallback)
```

---

## ⚙️ Configuration Options

All styling can be modified in `UISelectedHUD._createHudElement()`:

```javascript
// Position
this.hudElement.style.top = '20px'
this.hudElement.style.right = '120px'

// Appearance
this.hudElement.style.background = 'rgba(0, 0, 0, 0.35)'
this.hudElement.style.color = '#7FFFD4'
this.hudElement.style.fontFamily = 'JetBrains Mono, monospace'

// Size & Spacing
this.hudElement.style.padding = '8px 14px'
this.hudElement.style.fontSize = '12px'
this.hudElement.style.letterSpacing = '1px'

// Appearance Details
this.hudElement.style.borderRadius = '12px'
this.hudElement.style.zIndex = '999999'
```

---

## 🧪 Testing Verification Points

### Point 1: Initialization
- [ ] Game starts without errors
- [ ] Check console: `[SelectedHUD] Active ✓` appears
- [ ] Check console: `[SelectedHUD] Connected to SelectionCore` appears

### Point 2: Selection
- [ ] Click node → HUD updates
- [ ] Verify text format: `SELECTED: <CODE> (<NAME>) [TYPE]`
- [ ] Verify color: Aquamarine (#7FFFD4)

### Point 3: Deselection
- [ ] Press ESC → HUD resets
- [ ] Verify text: `SELECTED: NONE`
- [ ] Verify color: Gray dimmed

### Point 4: Position
- [ ] Verify HUD appears top-right
- [ ] Verify no overlap with fullscreen button
- [ ] Verify z-index stacking correct

---

**Implementation Complete ✅**
