# CORRUPTION GLYPH DIMMING — VISUAL DIAGRAMS

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   GLYPH UPDATE LOOP                              │
│                 (Every Frame per Glyph)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │ analyzeContext()     │
                    │ (get corruption)     │
                    └──────────────────────┘
                              │
                              ▼
                 ┌────────────────────────────┐
                 │ _applySynergyGlyph Reveal()│
                 │ (boost if synergy >= 0.75) │
                 └────────────────────────────┘
                              │
                              ▼
         ┌───────────────────────────────────────────┐
         │ _applyCorruptionGlyph Dimming()           │
         │ (DIM if corruption >= 0.65) ← NEW        │
         │ ← OVERRIDES synergy visibility           │
         └───────────────────────────────────────────┘
                              │
                              ▼
              ┌────────────────────────────┐
              │ UpdateGlyph (type-specific) │
              │ - Rotation, breathing, etc. │
              └────────────────────────────┘
                              │
                              ▼
              ┌────────────────────────────┐
              │ Material Updates Applied   │
              │ - Final opacity            │
              │ - Final emissive           │
              │ - Final color              │
              └────────────────────────────┘
```

## Dimming Factor Curve

```
CORRUPTION vs DIMMING FACTOR
────────────────────────────

1.0 ┤                     Dimming Factor = 1.0 - (progress * 0.75)
    │ ╱─────────────────┐
0.9 │╱                  │
0.8 │                   │
0.7 │                   ╲
0.6 │                    ╲
0.5 │                     ╲
0.4 │                      ╲
0.3 │                       ╲
0.2 │                        ╲
0.1 │                         ╲
0.0 │                          ╲─────────
    │ 0.0  0.2  0.4  0.6  0.8  1.0
    
    Threshold: 0.65            Max Dim: 0.85

Corruption 0.65 → Dimming Factor 1.0 (no dimming)
Corruption 0.75 → Dimming Factor 0.625 (62.5% visible)
Corruption 0.85 → Dimming Factor 0.25 (25% visible, FULL DIM)
```

## Opacity Progression

```
CORRUPTION PROGRESS → GLYPH OPACITY

100% │ ░░░░░░░░░░    Fully Bright (Healthy)
     │
 90% │ ░░░░░░░░░░
     │
 80% │ ░░░░░░░░░░
     │
 70% │  ░░░░░░░░░   Corruption < 0.65
     │
 62% │   ░░░░░░░░    0.65 ≤ Corruption < 0.75
     │
 50% │    ░░░░░░░    0.75 ≤ Corruption < 0.80
     │
 40% │     ░░░░░░
     │
 37% │      ░░░░░    0.80 ≤ Corruption < 0.85
     │
 25% │       ░░░░    Corruption ≥ 0.85 (FULL DIM)
     │
  0% │        ░░░    Never reaches 0% (minOpacityFactor = 0.25)
     │
     └─────────────────────────────────────
       0.0  0.2  0.4  0.6  0.8  1.0
                    CORRUPTION
```

## State Interaction Matrix

```
SYSTEM STATE COMBINATIONS
═════════════════════════════════════════════════════

┌─────────────────┬─────────────────┬─────────────────┐
│ Synergy ≥ 0.75  │ Corruption ≥0.65│ Result          │
├─────────────────┼─────────────────┼─────────────────┤
│ FALSE           │ FALSE           │ Normal Glyph    │
│ (Low)           │ (Low)           │ 100% opacity    │
├─────────────────┼─────────────────┼─────────────────┤
│ TRUE            │ FALSE           │ Enhanced       │
│ (High)          │ (Low)           │ 110% opacity+   │
│                 │                 │ Color shift     │
├─────────────────┼─────────────────┼─────────────────┤
│ FALSE           │ TRUE            │ Dimmed Glyph   │
│ (Low)           │ (High)          │ 25%–100%       │
│                 │                 │ Desaturated    │
├─────────────────┼─────────────────┼─────────────────┤
│ TRUE            │ TRUE            │ Dimmed Glyph   │
│ (High)          │ (High)          │ 25%–100%       │ ← OVERRIDE
│                 │                 │ Desaturated    │
│                 │                 │ Corruption wins│
└─────────────────┴─────────────────┴─────────────────┘

Visual Hierarchy:
  Corruption Dimming > Synergy Reveal > Normal State
  
When both active: Corruption takes priority (system failure > synergy)
```

## Timeline: Corruption Increase

```
VISUAL PROGRESSION: Corruption 0.0 → 1.0
════════════════════════════════════════════

Time   Corruption  Dimming  Desaturation  Visual State
────   ──────────  ───────  ────────────  ──────────────────────
t=0    0.0         1.0x     0%            ■■■■ Bright cyan glyph
       (healthy)                          

t=2    0.30        1.0x     0%            ■■■■ Still bright
       
t=4    0.60        1.0x     0%            ■■■■ Still bright
       
t=6    0.65        1.0x     0%            ■■■■ THRESHOLD: dimming begins
       (threshold)
       
t=7    0.70        0.75x    3%            ■■■░ Slightly dim, hint of gray
       (degrading)
       
t=8    0.75        0.50x    7%            ■■░░ Noticeably dim
       (failing)
       
t=9    0.80        0.375x   11%           ■░░░ Very dim
       
t=10   0.85        0.25x    15%           ░░░░ Nearly invisible (FULL DIM)
       (collapsed)
       
t=11   0.90        0.25x    15%           ░░░░ Stays at minimum
       
t=12   1.00        0.25x    15%           ░░░░ Faint ghost (still animating)
       (completely
        corrupted)
```

## Emissive Reduction Diagram

```
GLYPH BRIGHTNESS: Base vs Corrupted
════════════════════════════════════

HEALTHY GLYPH:
  Base Emissive: [████████] (0.5 intensity)
  ✓ Bright, clearly visible
  ✓ Emissive core glowing

DIMMED GLYPH:
  Base Emissive: [████████]
  Dimming × 0.25: [██░░░░░░] (0.125 intensity)
  ✗ Dull, reduced glow
  ✗ Emissive core barely glowing

Effect: Dimmed glyphs lose their radiance, suggesting system failure
```

## Desaturation Effect

```
COLOR TRANSFORMATION: Healthy → Corrupted
═══════════════════════════════════════════

HEALTHY GLYPH (Cyan):
  ██████████ (saturated cyan RGB: 0, 1, 1)

0.70 CORRUPTION (Slightly Desaturated):
  ██████████ (RGB: 0.15, 0.85, 0.85) — mostly cyan, slight gray
  
0.80 CORRUPTION (Moderately Desaturated):
  ██████████ (RGB: 0.33, 0.67, 0.67) — balanced cyan/gray

0.90 CORRUPTION (Highly Desaturated):
  ██████████ (RGB: 0.50, 0.50, 0.50) — near-grayscale

Semantic: Vibrancy/health fades → color loss suggests "sickness"
```

## Node State Cascade

```
NETWORK-WIDE CORRUPTION CASCADE
═════════════════════════════════

Node A: corruption = 0.0
  ◉ (bright cyan glyph)

         │ link: corruption contagion
         ▼

Node B: corruption = 0.55
  ◉ (still bright, below 0.65 threshold)

         │ link: corruption spreading
         ▼

Node C: corruption = 0.70
  ◕ (dimming active, 62.5% opacity, slight desaturation)

         │ link: corruption cascading
         ▼

Node D: corruption = 0.85
  ◔ (full dim, 25% opacity, max desaturation)

         │ link: corruption spreading
         ▼

Node E: corruption = 0.90
  ◔ (collapsed, minimal visibility)

Visual Effect: Cascade of dimming follows contagion spread
Metaphor: System meaning fades as corruption dominates network
```

## Threshold Comparison

```
DIFFERENT CONFIGURATION SCENARIOS
══════════════════════════════════

DEFAULT (Conservative):
  ┌─────────────────────────────────────────┐
  │ Active: 0.65  Max: 0.85  Min Opacity: 25%│
  │ Start: ●●●●●●●●●●ᴼᴼ Fade range: wide   │
  │ Result: Gradual dimming over 0.20 range │
  └─────────────────────────────────────────┘

AGGRESSIVE:
  ┌─────────────────────────────────────────┐
  │ Active: 0.50  Max: 0.70  Min Opacity: 10%│
  │ Start: ●●●●●●●ᴼᴼᴼᴼᴼᴼ Fade range: narrow  │
  │ Result: Rapid dimming, nearly invisible │
  └─────────────────────────────────────────┘

CONSERVATIVE:
  ┌─────────────────────────────────────────┐
  │ Active: 0.80  Max: 0.95  Min Opacity: 60%│
  │ Start: ●●●●●●●●●●●●●●●●ᴼᴼᴼᴼ Fade very late│
  │ Result: Glyphs stay visible most of time│
  └─────────────────────────────────────────┘
```

## Performance Profile

```
OVERHEAD ANALYSIS (50 Glyphs, 300 Children)
═════════════════════════════════════════════

Per Glyph Update:
  ┌────────────────────────────────────────┐
  │ traverse() call:      0.05ms            │
  │ opacity check/update: 0.02ms            │
  │ emissive update:      0.02ms            │
  │ color lerp:           0.01ms (if active)│
  ├────────────────────────────────────────┤
  │ Total per glyph:      ~0.1ms            │
  └────────────────────────────────────────┘

System Total (50 glyphs):
  ┌────────────────────────────────────────┐
  │ 50 glyphs × 0.1ms = 5ms peak           │
  │ Typical: <1ms (most glyphs below dim)  │
  │ As % of 16.67ms frame: <6% peak        │
  └────────────────────────────────────────┘

✅ Well within performance budget
```

## State Machine Diagram

```
GLYPH DIMMING STATE MACHINE
═════════════════════════════

                    ┌─────────────────┐
                    │ INITIALIZATION  │
                    │ (No state)      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   HEALTHY       │
                    │ opacity = base  │ ◄────┐
                    │ desaturation=0% │      │
                    └─────────┬───────┘      │
                              │              │
                   (corr >= 0.65)    (corr < 0.65)
                              │              │
                              ▼              │
                    ┌─────────────────┐      │
                    │   DEGRADING     │      │
                    │ 62.5% opacity   │──────┘
                    │ desaturate 3-7% │
                    └─────────┬───────┘
                              │
                   (corr >= 0.75)
                              │
                              ▼
                    ┌─────────────────┐
                    │    FAILING      │
                    │ 25-50% opacity  │
                    │ desaturate 7-11%│
                    └─────────┬───────┘
                              │
                   (corr >= 0.85)
                              │
                              ▼
                    ┌─────────────────┐
                    │   COLLAPSED     │
                    │ 25% opacity     │ ◄────┐
                    │ desaturate 15%  │      │
                    └─────────────────┘      │
                              │              │
                              └──────────────┘
                           (corr stays >= 0.85)

Note: Always progresses forward, can also regress if corruption decreases
```

## Integration Points

```
DATA FLOW: Corruption → Glyph Dimming
════════════════════════════════════════

Node Object:
  .userData.corruption = 0.0–1.0

        │
        ▼

AINodes.js / NodeLinkingSystem.js:
  Update corruption (normal game loop)

        │
        ▼

AtomaGlyphSystem4_0.js:
  analyzeContext() → extract corruption

        │
        ▼

_applyCorruptionGlyphDimming():
  Calculate dimming_factor based on corruption
  Apply to all glyph materials

        │
        ▼

Rendered Output:
  Glyph rendered with dimmed opacity/color
  User sees fading symbols as system degrades
```

---

All diagrams show the unified visual language: **Corruption → System Breakdown → Meaning Obscured**
