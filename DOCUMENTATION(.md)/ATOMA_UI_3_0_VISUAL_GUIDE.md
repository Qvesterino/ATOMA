# ATOMA UI 3.0 — Visual Reference Guide

## Screen Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⬥ ATOMA | DREAM DESERT | [SEED: 12345] | 60 FPS ● 42 nodes ● 128 links | CALM
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐                                  ┌──────────────┐ │
│  │ ARCHETYPE CODE       │                                  │ SYNERGY 65%  │ │
│  │ CORE-HARMONIC...     │                                  │ HARMONY 72%  │ │
│  │                      │                                  │              │ │
│  │ "The harmonic core   │                                  │ INSTABILITY  │ │
│  │  resonates—a bridge  │                                  │ CORRUPTION   │ │
│  │  between chaos &     │                                  │              │ │
│  │  order."             │                                  │ [TAB] EXPAND │ │
│  │                      │                                  │              │ │
│  │ Category: PROCESS    │                                  └──────────────┘ │
│  │ Tags: [SPECIAL]      │                                                  │
│  │                      │                                                  │
│  │ METRICS              │                                                  │
│  │ ENERGY      [██░░]   │                                                  │
│  │ STABILITY   [███░]   │                                                  │
│  │ CLARITY     [███░]   │                                                  │
│  │ HARMONY     [██░░]   │                                                  │
│  │ CORRUPTION  [░░░░]   │                                                  │
│  │ INSTABILITY [░░░░]   │                                                  │
│  │                      │                                                  │
│  │ POETIC SIGNATURE     │                                                  │
│  │ "The network         │                                                  │
│  │  sharpens—attention  │                                                  │
│  │  crystallizes."      │                                                  │
│  │                      │                                                  │
│  │ [ESC] Close          │                                                  │
│  └──────────────────────┘                                                  │
│                                                                              │
│                                                                              │
│                      [Right-Click Node → Context Menu]                     │
│                     ┌───────────────────────────────┐                      │
│                     │ INSPECT NODE                  │                      │
│                     │ FOCUS CAMERA                  │                      │
│                     │ LINK MODE                     │                      │
│                     │ DISCONNECT LINKS              │                      │
│                     │ MARK NODE                     │                      │
│                     └───────────────────────────────┘                      │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│               WASD MOVE ● MOUSE LOOK ● SPACE JUMP ● LMB SELECT/LINK ● RMB  │
│                                NODE MENU ● TAB HUD ANALYTICS ● ESC CLEAR    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Color Reference

### Primary Colors

```
UI_CYAN          #36F2FF  ████  Primary UI text, borders
UI_MAGENTA       #FF4DF0  ████  Accents, alerting
UI_HARMONY       #00F59E  ████  Harmony metric, OK
UI_CORRUPTION    #FF3C3C  ████  Corruption metric, warning
UI_STABILITY     #8AFF80  ████  Stability, load, OK
UI_CLARITY       #7CFFDA  ████  Clarity, info
```

### Secondary Colors (for tags and categories)

```
SPECIAL       #FF4DF0  ████  Magenta
QUANTUM       #36F2FF  ████  Cyan
SIGMA         #00F59E  ████  Harmony green
EMOTIONAL     #FF4DF0  ████  Magenta
EXTREME       #FF3C3C  ████  Red
OUTER         #7CFFDA  ████  Clarity cyan
LEGENDARY     #FFB500  ████  Gold
MYTHIC        #FFB500  ████  Gold
PRIME         #8AFF80  ████  Green
ERROR         #FF3C3C  ████  Red
```

## UI Components

### Top Status Bar

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ⬥ ATOMA | DREAM DESERT | [SEED: 12345] | 60 FPS ● 42 nodes ● 128 links │ CALM
└─────────────────────────────────────────────────────────────────────────┘
```

**Sections:**
- **Left:** Logo + World name + Seed
- **Center:** FPS + Node count + Link count
- **Right:** Network mood (color-coded)

**Heights:** 32px fixed, 1px bottom border (#36F2FF, 30% opacity)

### Left Node Inspect Panel

```
┌─────────────────────────────────────┐
│ ARCHETYPE CODE                      │ ← #FF4DF0 (magenta)
│ CORE-HARMONIC-RESONANT              │
│                                     │
│ "The harmonic core resonates—a      │ ← #00F59E (italic, green)
│  bridge between chaos and order."   │
├─────────────────────────────────────┤
│ PROCESS                             │ ← #7CFFDA (category)
│ [SPECIAL] [QUANTUM]                 │ ← Colored tag pills
├─────────────────────────────────────┤
│ METRICS                             │
│ ENERGY       [████░] 65             │ ← #8AFF80 bar
│ STABILITY    [█████░] 85            │ ← #8AFF80 bar
│ CLARITY      [██████░] 95           │ ← #7CFFDA bar
│ HARMONY      [████░] 80             │ ← #00F59E bar
│ CORRUPTION   [░░░░] 0               │ ← #FF3C3C bar
│ INSTABILITY  [░░░░] 5               │ ← #FF3C3C bar
├─────────────────────────────────────┤
│ POETIC SIGNATURE                    │ ← #FF4DF0 label
│ "The network sharpens—attention     │ ← #00F59E text
│  crystallizes."                     │
├─────────────────────────────────────┤
│ [ESC] Close                         │ ← #36F2FF footer
└─────────────────────────────────────┘
```

**Position:** Fixed top-left, 16px from edges  
**Size:** 340px wide, max 600px tall  
**Border:** 1.5px #36F2FF with glow  
**Background:** rgba(20, 30, 60, 0.85)

### Bottom-Right HUD — Compact Mode

```
┌────────────────────────────────────┐
│ SYNERGY        HARMONY             │
│ 65%            72%                 │
│ INSTABILITY    CORRUPTION          │
│ 15%            8%                  │
│ LOAD: 45% | CYCLE: 5               │
│ SCORE: 1250 | AEON: 2              │
├────────────────────────────────────┤
│ DREAM | [TAB] EXPAND               │
└────────────────────────────────────┘
```

**Position:** Fixed bottom-right, 20px from edges  
**Size:** ~300px wide  
**Border:** 1.5px #36F2FF with glow  
**Background:** rgba(20, 30, 60, 0.85)

### Bottom-Right HUD — Full Mode (TAB pressed)

```
┌────────────────────────────────────┐
│ [COMPACT MODE DISPLAY]             │
├────────────────────────────────────┤
│ NODE DISTRIBUTION                  │
│ INPUT        8 (19%)  ████░        │
│ PROCESS      18 (43%) ████████░    │
│ INTEGRATION  6 (14%)  ███░         │
│ ANALYTICS    4 (10%)  ██░          │
│ STORAGE      3 (7%)   ██░          │
│ CONTROL      2 (5%)   █░           │
│ QUANTUM      1 (2%)   █░           │
│                                    │
│ DREAM | [TAB] COMPACT              │
└────────────────────────────────────┘
```

**Expands to:** max 500px wide, max 600px tall  
**Smooth transition:** 0.3s ease-out

### Right-Click Context Menu

```
┌──────────────────────────┐
│ INSPECT NODE             │ ← hover: bg #36F2FF @ 15%
│ FOCUS CAMERA             │
│ LINK MODE                │
│ DISCONNECT LINKS         │
│ MARK NODE                │
└──────────────────────────┘
```

**Position:** At cursor (clamped to viewport edges)  
**Size:** ~160px min-width  
**Border:** 1.5px #36F2FF  
**Background:** rgba(20, 30, 60, 0.95)  
**Items:** 8px V padding, 16px H padding

### Help Text (Bottom Center)

```
WASD MOVE ● MOUSE LOOK ● SPACE JUMP ● LMB SELECT/LINK ● RMB NODE MENU ● TAB HUD ANALYTICS ● ESC CLEAR
```

**Position:** Fixed bottom center, 8px from edge  
**Size:** Responsive (no fixed width)  
**Font:** 10px Courier New, letter-spacing 0.8px  
**Opacity:** 0.7

## Interaction States

### Node Selected (Normal)

```
Panel visible
Border: steady glow
Content: Full display
Metrics: Static (read from frozen metadata)
```

### Right-Click Menu Open

```
Menu positioned near cursor
Menu items highlighted on hover
ESC or click outside closes menu
```

### Context Menu Action — "Focus Camera"

```
Camera animates over 1.0 seconds
Easing: ease-out cubic (1 - (1-t)³)
Target: node.position + offset(0, 2, 5)
Smooth, non-jarring motion
```

### Context Menu Action — "Mark Node"

```
Node highlight glow activated
Pulsing: sin(time × 4) × 0.3 + 0.7
Duration: 10 seconds
Auto-removes, no manual deactivation needed
```

### HUD Toggle (TAB)

```
Compact → Full: max-height 200px → 600px (0.3s)
Full → Compact: max-height 600px → 200px (0.3s)
Smooth expand/collapse animation
Content visible during transition
```

## Typography

### Font Stacks

```css
font-family: 'Courier New', monospace;
```

### Sizes

```
Status bar text:    11px
Status bar label:   11px
Node panel header:  13px
Node panel body:    11px
Node panel footer:  9px
HUD metrics:        11px
HUD labels:         11px
Context menu:       11px
Help text:          10px
```

### Letter Spacing

```
Logo/Brand:         1.2px
Headers/titles:     0.8px
Body text:          0.6px
Controls hint:      0.8px
```

### Transforms

```
All caps (text-transform: uppercase)
No italic except for poetry/meaning sections
Weights: bold for labels/headers, normal for values
```

## Animations & Transitions

### Fade In/Out (Panels)

```
Property: opacity
Duration: 250ms
Timing: ease-out
Start: opacity: 0
End: opacity: 1
```

### HUD Expand/Collapse

```
Property: max-height
Duration: 300ms
Timing: ease-out
Compact: 200px
Full: 600px
```

### Menu Hover

```
Property: background-color
Duration: 200ms
Timing: ease
Default: transparent
Hover: rgba(54, 242, 255, 0.15)
```

### Camera Focus

```
Property: camera.position, camera.quaternion
Duration: 1000ms (1.0 second)
Timing: ease-out cubic
Lerp: THREE.Vector3.lerpVectors, quaternion.slerpQuaternions
```

### Node Highlight Pulse

```
Animation: sin(elapsed × 4) × 0.3 + 0.7
Applied to: vfxGlow.material.opacity
Frequency: 4 Hz (sine wave)
Range: 0.4 → 1.0
Duration: 10 seconds
```

## Responsive Behavior

### When Screen is Narrow

- Status bar text may wrap (consider adjusting font sizes)
- Node panel: Still 340px (may overflow on very small screens, but scrollable)
- HUD: Still 300px+ (may need adjustment for mobile)
- Context menu: Clamped to stay on-screen

### Desktop (1920x1080+)

- All panels display with ample whitespace
- No overlaps
- Full readability

### Laptop (1440x900)

- All panels visible and non-overlapping
- Slight padding reduction if needed

### Mobile / Tablet

- Not currently optimized (ATOMA is desktop-focused)
- Touch controls not implemented
- Use with mouse/keyboard

## Visual Hierarchy

1. **Status Bar** — Top, always visible, informational
2. **Node Panel** — Left, prominent when node selected, detailed
3. **Context Menu** — Overlay, appears on demand, action-focused
4. **HUD** — Bottom-right, persistent, summary metrics
5. **Help Text** — Bottom-center, reference-only

## Debug Visual Checklist

When implementing, verify visually:

- [ ] All text is readable (no color contrast issues)
- [ ] Borders glow subtly (not overpowering)
- [ ] Shadows add depth without darkening
- [ ] Rounded corners feel modern (not too rounded)
- [ ] Opacity feels right (not too transparent)
- [ ] Animations are smooth (no jank, 60 FPS)
- [ ] Hover states are clear (visual feedback)
- [ ] Closed panels are invisible (not just opacity 0)
- [ ] Metrics bars scale correctly (0–100%)
- [ ] Tags are readable and distinct
- [ ] Poetry text is distinguished from labels
- [ ] Colors are consistent across all panels
- [ ] No text overlaps or cuts off
- [ ] Menu positions don't go off-screen
- [ ] All elements respect z-index layering

---

*This visual guide complements the technical documentation in ATOMA_UI_3_0_SUMMARY.md*
