# SEMANTIC GLYPH AI 5.0 - VISUAL REFERENCE CARD

## At a Glance: Glyph Visual Dictionary

### What Each Glyph Appearance Means

```
┌─────────────────────────────────────────────────────────────┐
│ QUICK VISUAL LOOKUP - What Do These Glyphs Tell You?       │
└─────────────────────────────────────────────────────────────┘

🔄 FAST SPINNING + BRIGHT
├─ Inner glyph rotates 1.8× faster than normal
├─ Scan-line sweeps vertically across the glyph
├─ Increased brightness (+15%)
└─ Meaning: FOCUSED - Node is analyzing, thinking clearly
   └─ Action: Node is processing important information

📉 WOBBLING + ORANGE/RED GLOW
├─ Edges jitter slightly side-to-side
├─ Opacity pulses rapidly (2 times per second)
├─ Color shifts from primary toward orange then red
└─ Meaning: STRESSED - Node is overloaded, struggling
   └─ Action: Monitor closely, may need intervention

🌬️ SLOW ROTATION + GENTLE BREATHING
├─ Inner rotation slows to 20% of normal
├─ Scale gently expands/contracts (+5% amplitude)
├─ Glow dims to ~70% opacity
└─ Meaning: CALM - Node is at peace, resting
   └─ Action: Node is stable, low activity, ready

✨ ORBITING PARTICLES + CONNECTION LINES
├─ 4-8 tiny dots orbit outward from glyph
├─ Thin lines hint toward neighboring nodes
├─ Particles fade over ~3 seconds
├─ Cyan/mint coloring
└─ Meaning: EXPLORING - Node just created new links
   └─ Action: Node is discovering, networking actively
   └─ Duration: 3 seconds after link creation

👑 GOLDEN CROWN + RADIAL PULSES
├─ Thin golden rings orbit the main glyph
├─ Up to 8 pulses emanate radially
├─ Strong, prominent appearance
├─ Gold coloring (0xFFD700)
└─ Meaning: LEADER - Node is network hub
   └─ Action: Node is central, routing traffic
   └─ Duration: Continuous while hub status holds

⚡ SPLIT COLORS + PULSING CENTER
├─ Left and right halves show different colors
├─ Center dividing line pulses between halves
├─ Left/right rotate slightly out-of-phase
├─ Magenta center line
└─ Meaning: CONFLICT - Node has internal tension
   └─ Action: Harmony and corruption both high
   └─ Duration: Continuous while both metrics high

💓 SYNCHRONIZED PULSE + CYAN FLASH
├─ Pulses in perfect sync with other cluster members
├─ Color flashes to cyan (0x84FFE6)
├─ All cluster glyphs beat as one "heartbeat"
└─ Meaning: CLUSTER-SYNC - Network in harmony
   └─ Action: Cluster members synchronized
   └─ Duration: 2 seconds after sync event

⚪ STABLE, NEUTRAL APPEARANCE
├─ Normal rotation speed
├─ Standard opacity
├─ No special animations
└─ Meaning: NEUTRAL - No strong state
   └─ Action: Node operating normally
   └─ Duration: When no other states apply
```

---

## Animation Speed Reference

### Rotation Speeds (relative to normal)

```
State          Speed Multiplier   Appearance
──────────────────────────────────────────────
FOCUSED        1.8×               Very fast spin ⚡
STRESSED       0.9×               Slightly faster
CALM           0.2×               Barely rotating 🔇
NEUTRAL        1.0×               Normal speed
EXPLORING      1.0×               Normal, + particles
LEADER         1.0×               Normal, + crown
CONFLICT       1.0×               Normal, + split
CLUSTER-SYNC   1.0×               Normal, + pulse
```

### Pulse Frequencies (oscillations per second)

```
State          Pulse Rate    Meaning
────────────────────────────────────
STRESSED       2.0 Hz        Fast worry pulse 💓
FOCUSED        1.0 Hz        Steady analyze pulse
CALM           0.5 Hz        Slow breathing 🌬️
CLUSTER-SYNC   3.0 Hz        Quick unity heartbeat
CONFLICT       0.5 Hz        Slow tension pulse
EXPLORING      1.5 Hz        Discovery orbit
```

---

## Color Code Reference

### ATOMA Glyph Colors

```
Primary State          RGB Code    Hex Code    Visual
─────────────────────────────────────────────────────────
Focused/Default        (0, 242, 255)   0x00F2FF  Cyan
Stressed Warning       (255, 136, 0)   0xFF8800  Orange
Stressed Critical      (255, 51, 51)   0xFF3333  Red
Calm/Neutral           (Base color, dimmed)     Soft glow
Exploring Discovery    (0, 255, 170)   0x00FFAA  Mint
Leader Authority       (255, 215, 0)   0xFFD700  Gold
Cluster Harmony        (132, 255, 230) 0x84FFE6  Cyan
Conflict Tension       (255, 0, 255)   0xFF00FF  Magenta
```

---

## State Transition Map

### How States Change As Metrics Evolve

```
Node Created
    ↓
┌─────────────────────────┐
│ Check current metrics   │
└────────────┬────────────┘
             ↓
        ┌────────────────┐
        │ Recent Event?  │
        └────┬───────┬───┘
             │       └─→ EXPLORING (3 sec)
          NO │           └─→ RITUAL (2 sec)
             │           └─→ ASCENDED (2 sec)
             ↓           └─→ CLUSTER-SYNC (2 sec)
        ┌────────────────┐
        │ Check metrics  │
        └────┬───────────┘
             ↓
    ┌────────────────────┐
    │ Harmony & Corrupt? │─→ CONFLICT ⚡
    │ Both high?         │
    └────┬───────────────┘
         │ No
         ↓
    ┌────────────────────┐
    │ Link Degree high?  │─→ LEADER 👑
    │ Hub role?          │
    └────┬───────────────┘
         │ No
         ↓
    ┌────────────────────┐
    │ Overloaded?        │─→ STRESSED 📉
    │ High load?         │
    │ High instability?  │
    └────┬───────────────┘
         │ No
         ↓
    ┌────────────────────┐
    │ Clarity high?      │─→ FOCUSED 🔄
    │ Corruption low?    │
    │ Analytics role?    │
    └────┬───────────────┘
         │ No
         ↓
    ┌────────────────────┐
    │ Stable & calm?     │─→ CALM 🌬️
    │ Low everything?    │
    └────┬───────────────┘
         │ No
         ↓
    NEUTRAL ⚪ (fallback)
```

---

## Event Timeline Reference

### How Events Appear and Fade

```
LINK CREATION EVENT (3 second duration)
────────────────────────────────────────
0ms    Start
  |    ✨ Particles appear, orbit at full speed
  |    📡 Connection lines visible
  |    Opacity: 100%
  |
  |    EXPLORING STATE ACTIVE
  |
1500ms Halfway fade
  |    ✨ Particles still orbiting
  |    📡 Lines dimming
  |    Opacity: 50%
  |
3000ms Complete fade
  |    ✨ Particles invisible
  |    📡 Lines gone
  |    Return to previous state
  ↓

RITUAL COMPLETION EVENT (2 second duration)
────────────────────────────────────────────
0ms    Start
  |    ⚡ Ritual indicator appears
  |    Opacity: 100%
  |    Special animation active
  |
1000ms Halfway fade
  |    ⚡ Slightly dimming
  |    Opacity: 50%
  |
2000ms Complete fade
  |    ⚡ Indicator gone
  |    Return to previous state
  ↓

CLUSTER SYNC EVENT (2 second duration)
───────────────────────────────────────
0ms    Start
  |    💓 Synchronize with cluster
  |    All members pulse together
  |    Color flashes to cyan
  |    Opacity: 100%
  |
  |    CLUSTER-SYNC STATE ACTIVE FOR ALL MEMBERS
  |
1000ms Halfway fade
  |    💓 Still in sync
  |    Cyan flash dimming
  |    Opacity: 50%
  |
2000ms Complete fade
  |    💓 Sync fades
  |    Return to individual states
  |    Colors normalize
  ↓
```

---

## Metric Sensitivity Chart

### How Metrics Trigger State Changes

```
FOCUSED STATE
─────────────
Clarity     ██████████████████  Need > 75
Corruption  ░░░░░░░░░░░░░░░░░░  Need < 25
            └─ Narrow band = precise focus indicator


STRESSED STATE
──────────────
Load        ██████████         Need > 60
Instability ██████████         OR > 70 (with low harmony)
            └─ Wide band = multiple stress triggers


CALM STATE
──────────
Load        ░░░░░               Need < 30
Instability ░░░░░░░             Need < 20
Corruption  ░░░░░░░             Need < 15
            └─ Very low across board = peaceful


LEADER STATE
────────────
Link Degree ████                Need ≥ 4
            └─ Network connectivity indicator


CONFLICT STATE
──────────────
Harmony     ██████░░░░          Need > 40
Corruption  ██████░░░░          AND > 40
Difference  ░░░░░░░             Similarity needed
            └─ Both high, similar = internal tension
```

---

## Performance Indicators

### Visual Performance Diagnostics

```
Frame Time Display (console):
  < 0.3ms  ⚡⚡⚡ Excellent
  0.3-0.5ms ⚡⚡  Good
  0.5-0.8ms ⚡   Acceptable
  0.8-1.0ms ○   OK, at budget
  > 1.0ms   ⚠️   Over budget

Nodes Processed:
  0-10   ○ Typical small scene
  10-15  ⚡ Average ATOMA world
  15-30  ⚡ Large networked scene
  30+    ⚡ Very complex network

State Distribution:
  Many NEUTRAL        → Simple metrics, no strong states
  Mix of all types    → Rich semantic diversity
  All same state      → Metrics converged, homogeneous
```

---

## Glyph State Decision Tree

### Quickest Way to Determine Node State

```
                     START
                       ↓
              Any recent event?
              /         |         \
            Yes        No        No
           ↙            ↓          ↘
     Use event      Check metrics   Maybe
     state                          neutral
     ↓              ↓
  EXPLORING,   ┌────────────────┐
  RITUAL,      │ Harmony+Corrupt │
  ASCENDED,    │ Both high?      │
  CLUSTER-SYNC │ Diff < 30?      │
               └────┬────────────┘
                  Yes
                    ↓
               CONFLICT ⚡
               
               No ↓ Continue checking
               
               ┌────────────────┐
               │ Link degree?   │
               │ Or hub role?   │
               └────┬────────────┘
                  Yes
                    ↓
               LEADER 👑
               
               No ↓ Continue checking
               
               ┌────────────────┐
               │ Load or        │
               │ Instability    │
               │ too high?      │
               └────┬────────────┘
                  Yes
                    ↓
               STRESSED 📉
               
               No ↓ Continue checking
               
               ┌────────────────┐
               │ Clarity high?  │
               │ & Corruption   │
               │ low?           │
               └────┬────────────┘
                  Yes
                    ↓
               FOCUSED 🔄
               
               No ↓ Continue checking
               
               ┌────────────────┐
               │ All metrics    │
               │ low & stable?  │
               └────┬────────────┘
                  Yes
                    ↓
               CALM 🌬️
               
               No ↓ Final check
               
               NEUTRAL ⚪
```

---

## Context Clues for State Recognition

### When You See These Glyph Patterns, Think...

| Visual Pattern | State | Network Health | Action |
|---|---|---|---|
| 🔄 Fast + Bright | FOCUSED | High clarity | Monitoring, analyzing |
| 📉 Wobbling + Orange | STRESSED | Struggling | May overload soon |
| 🌬️ Slow + Dim | CALM | Low activity | Resting, ready |
| ✨ Orbit + Lines | EXPLORING | Discovering | Building network |
| 👑 Crown + Pulses | LEADER | Central hub | Critical node |
| ⚡ Split + Pulse | CONFLICT | Tension | Needs resolution |
| 💓 Sync + Cyan | CLUSTER-SYNC | In harmony | Unified moment |
| ⚪ Stable + Normal | NEUTRAL | Baseline | Ordinary ops |

---

## Example Scene Analysis

### Reading a Full Network of Glyphs

```
Your ATOMA World shows 12 nodes:

┌──────────────────────────────────────┐
│                                      │
│     👑 Leader at center             │
│     (gold crown + pulses)           │
│     └─ Hub routing all traffic      │
│                                      │
│    🔄 🔄    Focused nodes            │
│    (fast + bright)                   │
│    └─ Analyzing network state       │
│                                      │
│  🌬️    🌬️ Calm nodes                │
│  (slow + dim)                        │
│  └─ Idle, ready for work            │
│                                      │
│  ⚡ Conflicted node                 │
│  (split colors)                      │
│  └─ Internal tension                │
│                                      │
│  📉 Stressed node                    │
│  (wobbling + orange)                 │
│  └─ May need attention              │
│                                      │
│  ✨ Exploring nodes                 │
│  (orbiting particles)                │
│  └─ Recently created links          │
│                                      │
└──────────────────────────────────────┘

INTERPRETATION:
- Network is healthy overall
- Hub is managing traffic well
- Focused nodes are analyzing
- One stressed node needs monitoring
- Calm nodes are stable reserves
- Exploring nodes are discovering
- One conflicted node needs mediation
→ Overall: Productive network with minor tensions
```

---

## Troubleshooting Visual Signs

### Glyph Looks Wrong? Here's Why...

| Observation | Likely Cause | Fix |
|---|---|---|
| All glyphs neutral | Metrics not attached | Check `node.userData.metrics` exists |
| Glyphs very slow | Calm state | High clarity → FOCUSED |
| No color changes | Opacity-only animation | Normal, colors shift gradually |
| Flickering particles | Not appearing | Recently-linked flag set? |
| Crown rings visible? | Link degree high | Is `linkDegree >= 4`? |
| Not changing states | Events not recording | Call `recordNodeLink()` etc. |
| System disabled | Hidden in console | Check `window.game.semanticGlyphAI.enabled` |

---

## Quick Copy-Paste Commands

### For Testing in Browser Console

```javascript
// See current state of all nodes
debugSemanticStats()

// Look at first node specifically
debugSemanticGlyph(0)

// Trigger exploring state on node 0
recordNodeLink(0)

// Trigger ritual state
recordNodeRitual(0)

// Trigger ascension
recordNodeAscended(0)

// Disable effects (for performance testing)
disableSemanticGlyphAI()

// Re-enable
enableSemanticGlyphAI()

// Check frame time (should be < 1ms)
console.time('semantic'); 
window.game.semanticGlyphAI.update(0.016, window.game.aiNodes.nodes);
console.timeEnd('semantic')
```

---

## Summary

**The Semantic Glyph Visual Language:**

- 🔄 **Fast + Bright** = Analyzing
- 📉 **Wobble + Orange** = Struggling
- 🌬️ **Slow + Dim** = At peace
- ✨ **Orbits** = Connecting
- 👑 **Crown** = Network hub
- ⚡ **Split** = Conflicted
- 💓 **Sync** = Unified cluster
- ⚪ **Stable** = Normal ops

Look at ATOMA's glyphs and instantly read the network's emotional landscape.

✨ **Beautiful, meaningful, always communicating.**
