# ATOMA UI 3.3 — Quick Reference Guide

## Node Interaction Controls

### Selection

| Input | Action | Result |
|-------|--------|--------|
| **LMB Node** | Select | Badge + Highlight + Label appear |
| **LMB Same Node** | Deselect | All visuals disappear |
| **LMB Empty Space** | Deselect All | Clear selection + close UI |

### Linking (Normal Mode)

| Input | Action | Result |
|-------|--------|--------|
| **LMB Node A** | Select A | A is highlighted |
| **LMB Node B** | Link A→B | Link created, B becomes selected |
| **RMB on B** | Cancel Linking | Cancel, B stays selected |

### Inspection (Selected-Only Mode)

| Input | Action | Result |
|-------|--------|--------|
| **LMB Node A** | Select A | A is highlighted |
| **RMB Node A** | Toggle Mode | Enter selected-only (inspection) mode |
| **LMB Node B** | Switch Selection | B is now selected, NO link created |
| **RMB on B** | Exit Mode | Return to linking mode |

### Context Menu

| Input | Action | Result |
|-------|--------|--------|
| **E Key** (with selection) | Open Menu | Context menu appears with node options |
| **Menu Items** | Various | Inspect, Focus, Link, Disconnect, Mark, Close |
| **ESC** | Close Menu | Menu disappears |

---

## Visual Indicators

### Selection Badge (Under Crosshair)
```
┌─────────────────────────────┐
│      SELECTED NODE          │
│  ● QNT-ORB-SYN — Type    │
└─────────────────────────────┘
```
- **●** = Category color (Input, Process, Control, etc.)
- **Code** = Node's unique identifier (magenta)
- **Type** = Node archetype/category (cyan)

### Highlight (Around Node)
- **Outer ring** = Pulsing neon outline (1.5s cycle)
- **Inner glow** = Soft pulsing glow
- **Color** = Category color (changes per node type)

### Floating Label (Above Node)
```
[SELECTED]
QNT-ORB-SYN
```
- Gently bobs up and down
- Always faces camera
- Category-colored text

---

## Node Categories & Colors

| Category | Color | Symbol |
|----------|-------|--------|
| Input | Cyan | ⬤ |
| Process | Orange | ⬤ |
| Integration | Green | ⬤ |
| Analytics | Purple | ⬤ |
| Storage | Blue | ⬤ |
| Control | Magenta | ⬤ |
| Sigma | Orange-Red | ⬤ |
| Quantum | Turquoise | ⬤ |
| Emotional | Pink | ⬤ |
| Extreme | Red | ⬤ |
| Outer | Yellow | ⬤ |
| Legendary | Gold | ⬤ |
| Mythic | Magenta | ⬤ |
| Prime | Lime | ⬤ |
| Error | Crimson | ⬤ |

---

## Workflow Examples

### Example 1: Simple Link

```
1. LMB Node A (Input type)       → Badge/Highlight/Label appear
2. LMB Node B (Process type)     → Link created: A→B, B now selected
3. Result: Connected nodes glow
```

### Example 2: Inspect Without Linking

```
1. LMB Node A                    → A is selected
2. RMB Node A                    → Enter inspection mode
3. LMB Node B                    → B is selected (NO link created)
4. LMB Node C                    → C is selected (NO link created)
5. RMB Node C                    → Exit inspection mode (back to linking)
6. LMB Node D                    → Link created: C→D (normal mode again)
```

### Example 3: Context Menu

```
1. LMB Node A                    → A is selected
2. E Key                         → Context menu opens
3. Click "INSPECT NODE"          → Inspect panel shows details
4. Click "FOCUS CAMERA"          → Camera smoothly moves to node
5. Click "CLOSE"                 → Menu closes
```

### Example 4: Multiple Inspections

```
1. LMB Node A                    → Select + view badge/highlight/label
2. RMB Node A                    → Toggle to inspection mode
3. LMB Node B                    → Switch to B (inspect)
4. LMB Node C                    → Switch to C (inspect)
5. LMB Node D                    → Switch to D (inspect)
6. RMB Node D                    → Exit inspection, return to linking
```

---

## Tips & Tricks

### Speed Linking
- In linking mode, each node you select immediately links from the previous
- Fast chain: LMB A → LMB B → LMB C → LMB D (creates: A→B→C→D)

### Inspection Mode
- Use RMB to toggle inspection without disrupting selection
- Perfect for comparing multiple nodes side-by-side
- Exit whenever ready to resume linking

### Context Menu Actions
- **Inspect Node** — Deep dive into node metrics
- **Focus Camera** — Smooth zoom to node
- **Link Mode** — Explicitly enter linking (rarely needed)
- **Disconnect Links** — Remove all node connections
- **Mark Node** — Highlight for 10 seconds (visual aid)
- **Close** — Dismiss menu

### Deselection
- Click empty space to deselect everything
- Click same node twice to toggle deselection
- Press ESC to close all UI and deselect

---

## Visual Hierarchy

**Selected Node Displays (All Three Together):**

1. **Badge** (Top) — Identifies node at glance
2. **Highlight** (Middle) — Visual emphasis on node in world
3. **Label** (Top) — 3D floating indicator above node

**When Viewing:**
- All three appear simultaneously on selection
- All three fade out on deselection
- All three update together on node switch

---

## Performance Notes

- UI operates at <0.5ms per frame (3% of frame budget)
- Designed for 60+ FPS gameplay
- No performance impact on node rendering
- No memory leaks on repeated selection

---

## Keyboard Reference

| Key | Function | When Active |
|-----|----------|-------------|
| **LMB** | Select / Link / Deselect | Always |
| **RMB** | Toggle Inspection / Cancel | On selected node / empty |
| **E** | Open Context Menu | With selected node |
| **ESC** | Close All UI | When UI open |

---

## Troubleshooting

### Badge Not Showing
- Ensure you've clicked on a node (LMB)
- Check if node is valid (should have glowing sphere)

### Highlight Not Visible
- Highlight appears around node in 3D space
- May be hidden behind other nodes
- Move camera for better view

### Label Not Showing
- Label appears as text above node
- May be behind node from current angle
- Move camera to see floating text

### Links Not Creating
- Ensure you're in linking mode (not inspection mode)
- Inspect mode requires RMB toggle to exit
- Try: LMB A → LMB B (should link)

### Inspection Mode Stuck
- Press RMB on current node to exit inspection
- Or click empty space to deselect completely

---

**ATOMA UI 3.3 — Master the Nodes!**
