# Pulse Intersection Impulses — Architecture Diagram

## System Hierarchy

```
┌──────────────────────────────────────────────────────────────────┐
│                      Game Update Loop                            │
│                   (main.js animate method)                       │
└────────────────────────┬───────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   [Other Systems]  [Micro-Impulse] [Pulse Intersection]
                     Adapter Update  Adapter Update
                         │                │
                         ▼                ▼
              ┌──────────────────┐  ┌─────────────────┐
              │ Fade & Expire    │  │ Fade & Expire   │
              │ Active Impulses  │  │ Active Impulses │
              └──────────────────┘  └─────────────────┘
```

---

## Pulse Intersection Adapter Architecture

```
┌────────────────────────────────────────────────────────────────┐
│          PulseIntersectionImpulseAdapter                       │
│  Main event-driven adapter + orchestrator                      │
└────┬─────────────────────────┬────────────────────────────────┘
     │                         │
     │ Contains                │ Contains
     ▼                         ▼
┌──────────────────────┐  ┌──────────────────────┐
│ SegmentIntersection  │  │ IntersectionImpulse  │
│ Detector             │  │ Spawner              │
├──────────────────────┤  ├──────────────────────┤
│ segmentCache         │  │ geometries (cached)  │
│ segmentCooldowns     │  │ materials (cached)   │
│ registerLink()       │  │ activeImpulses[]     │
│ detectIntersections()│  │ spawn()              │
│ canSegmentFire()     │  │ update()             │
│ markSegmentFired()   │  │ clear()              │
└──────────────────────┘  └──────────────────────┘
```

---

## Intersection Detection Flow

```
Pulse Wave Update Event
    │
    ├─ linkId: "link-abc"
    ├─ pulseT: 0.45 (normalized position)
    ├─ pulseWidth: 0.15
    └─ state: { harmony, synergy, corruption, instability }
    │
    ▼
PulseIntersectionImpulseAdapter
.updatePulsePosition()
    │
    ├─ Input validation
    ├─ State caching
    │
    ▼
SegmentIntersectionDetector
.detectIntersections(linkId, pulseT, pulseWidth)
    │
    ├─ Get registered segments for link
    │  (link divided into N equal segments in [0,1] space)
    │
    ├─ Calculate pulse range: [pulseT - width/2, pulseT + width/2]
    │
    ├─ For each segment:
    │  ├─ Check overlap: pulseRange vs segmentRange
    │  ├─ If overlapping → add to intersections[]
    │  └─ Calculate overlap amount
    │
    ▼
Intersection Array
[
  {
    segment: { startT: 0.33, endT: 0.66, index: 1 },
    overlapStart: 0.375,
    overlapEnd: 0.525,
    overlapAmount: 0.15
  },
  ...
]
    │
    ▼
For Each Intersection:
    │
    ├─ Check cooldown: canSegmentFire(linkId, segmentIndex)
    │  ├─ Key: "${linkId}-${segmentIndex}"
    │  ├─ If (now - lastFired) < cooldown → skip
    │  └─ Cooldown scales with instability
    │
    ├─ Calculate position on link geometry
    │  ├─ Get link from cache
    │  ├─ Average vertices in overlap range
    │  ├─ Transform to world space
    │
    ├─ Determine impulse shape
    │  ├─ IF synergy > 0.7 THEN 'spark'
    │  ├─ ELSE IF harmony > 0.7 THEN 'arc'
    │  ├─ ELSE 'arc'
    │
    ├─ Spawn impulse
    │  └─ Pass: position, rotation, shape, config
    │
    └─ Mark segment as fired
       └─ Update cooldown timestamp
```

---

## Intersection Geometry (Parameter Space)

```
Link Geometry Visual Segments in Parameter Space [0, 1]

Segment Registration (during setup):
┌─ Link A: 6 segments
│  ├─ Seg 0: [0.00, 0.17]
│  ├─ Seg 1: [0.17, 0.33]
│  ├─ Seg 2: [0.33, 0.50]
│  ├─ Seg 3: [0.50, 0.67]
│  ├─ Seg 4: [0.67, 0.83]
│  └─ Seg 5: [0.83, 1.00]
│
└─ Link B: 8 segments (for long link)
   ├─ Seg 0: [0.00, 0.125]
   ├─ Seg 1: [0.125, 0.25]
   └─ ... etc

Pulse Wave Intersection (during update):
Link A, Pulse Position = 0.45, Width = 0.15
Pulse Range: [0.375, 0.525]

Segment Analysis:
  Seg 0 [0.00, 0.17]  ← No overlap
  Seg 1 [0.17, 0.33]  ← No overlap
  Seg 2 [0.33, 0.50]  ← OVERLAP! [0.375, 0.50]
  Seg 3 [0.50, 0.67]  ← OVERLAP! [0.50, 0.525]
  Seg 4 [0.67, 0.83]  ← No overlap
  Seg 5 [0.83, 1.00]  ← No overlap

Fire impulses on Seg2 and Seg3 (if cooldown expired)
```

---

## Cooldown System

```
Per-Segment Throttling Timeline
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Link ABC, Segment 2:
  T=0ms    Impulse fires
           cooldownKey = "abc-2"
           lastFiredTime = 0ms
           cooldown = 150ms (base) × (1 + instability)
           
  T=50ms   Pulse wave crosses again
           now = 50ms
           (50 - 0) < 150 → SKIP
           
  T=150ms  Pulse wave crosses again
           now = 150ms
           (150 - 0) >= 150 → CAN FIRE
           Fire impulse #2
           lastFiredTime = 150ms
           
  T=200ms  Pulse wave crosses again
           now = 200ms
           (200 - 150) < 150 → SKIP
           
  T=300ms  Pulse wave crosses again
           now = 300ms
           (300 - 150) >= 150 → CAN FIRE
           Fire impulse #3

Timeline with Instability = 0.5:
  Base cooldown: 150ms
  With instability: 150 × (1 + 0.5) = 225ms
  
  T=0ms    Fire
  T=225ms  Can fire again (suppressed)
  T=450ms  Can fire again (suppressed)
  
  Result: Sparser firing pattern
```

---

## Impulse Spawning Process

```
spawn(position, rotation, shape, config)
    │
    ├─ Extract config
    │  ├─ duration (default 60ms)
    │  ├─ harmony
    │  ├─ synergy
    │  └─ corruption
    │
    ├─ Get cached geometry
    │  ├─ IF shape='snap' THEN 2-point flash
    │  ├─ IF shape='arc' THEN 8-segment curve
    │  └─ IF shape='spark' THEN 4-point cross
    │
    ├─ Get cached material
    │  └─ Reused across all impulses
    │
    ├─ Create visual (Line or Points)
    │  ├─ position.copy(position)
    │  ├─ quaternion.copy(rotation)
    │  └─ frustumCulled = false
    │
    ├─ Apply state modulation
    │  │
    │  ├─ Scale modulation
    │  │  ├─ scale *= (harmony × 0.8 + 0.2)
    │  │  ├─ scale *= (0.5 + synergy × 0.5)
    │  │  └─ IF corruption > 0.5 THEN scale *= 0.7
    │  │
    │  ├─ Color modulation
    │  │  ├─ baseColor = cyan (#00ffff)
    │  │  ├─ IF corruption > 0.3
    │  │  │  THEN lerp toward red (#ff3366)
    │  │  └─ material.color = baseColor
    │  │
    │  └─ Opacity modulation
    │     └─ opacity = harmony × (0.5 + synergy × 0.5)
    │
    ├─ Duration adjustment
    │  └─ duration *= (1.0 - corruption × 0.3)
    │
    ├─ Add to scene
    │  └─ scene.add(visual)
    │
    └─ Track with metadata
       ├─ visual: mesh reference
       ├─ startTime: Date.now()
       ├─ duration: adjusted duration
       ├─ harmony, synergy, corruption: state cache
       └─ Add to activeImpulses[]
```

---

## Per-Frame Update Loop

```
Every Frame:
IntersectionImpulseSpawner.update()
    │
    ├─ const now = Date.now()
    │
    ├─ For each impulse in activeImpulses[]
    │  │
    │  ├─ Calculate progress
    │  │  ├─ elapsed = now - startTime
    │  │  └─ progress = elapsed / duration
    │  │
    │  ├─ IF progress >= 1.0
    │  │  │
    │  │  ├─ Impulse expired
    │  │  ├─ scene.remove(visual)
    │  │  └─ Mark for deletion
    │  │
    │  └─ ELSE
    │     │
    │     ├─ Symmetric fade (peak at 0.5)
    │     │  ├─ IF progress < 0.5
    │     │  │  THEN opacity = progress × 2.0 (fade in)
    │     │  └─ ELSE
    │     │     opacity = (1.0 - progress) × 2.0 (fade out)
    │     │
    │     └─ Apply opacity to material
    │        └─ visual.material.opacity =
    │           opacity × harmony × (0.5 + synergy × 0.5)
    │
    └─ Remove expired impulses from array (backwards)
       └─ Preserves indices during iteration
```

---

## State-Aware Modulation Formulas

```
HARMONY (Control & Symmetry)
  scale_factor = harmony × 0.8 + 0.2
  effect: High harmony → crisp, large, symmetric impulses
  
SYNERGY (Energy & Duration)
  duration_ms = base_duration × (0.5 + synergy × 0.5)
  opacity_factor = 0.5 + synergy × 0.5
  effect: High synergy → longer-lived, brighter impulses
  
CORRUPTION (Chaos & Distortion)
  duration_ms *= (1.0 - corruption × 0.3)
  scale_factor *= corruption > 0.5 ? 0.7 : 1.0
  color_lerp = lerp(cyan, red, corruption)
  effect: High corruption → short, dim, red-tinted, jittery
  
INSTABILITY (Suppression)
  cooldown_ms = 150 × (1.0 + instability × 1.0)
  effect: High instability → rare impulses, long gaps
```

---

## Link Registration Process

```
During Setup (setupPulseIntersectionIntegration):
    │
    ├─ For each link in game.nodeLinking.links
    │  │
    │  ├─ Get link.uuid (unique ID)
    │  │
    │  ├─ Estimate segment count
    │  │  ├─ IF long link (100+ vertices)
    │  │  │  THEN 16 segments
    │  │  ├─ IF medium link (50-100 vertices)
    │  │  │  THEN 6-12 segments
    │  │  └─ IF short link (<50 vertices)
    │  │     THEN 6 segments
    │  │
    │  ├─ adapter.registerLink(linkId, linkMesh, segmentCount)
    │  │  │
    │  │  ├─ Divide [0, 1] into equal segments
    │  │  ├─ segmentCache.set(linkId, [...segments])
    │  │  │
    │  │  └─ linkGeometries.set(linkId, {
    │  │       geometry: link.geometry,
    │  │       matrixWorld: link.matrixWorld,
    │  │       link: link
    │  │     })
    │  │
    │  └─ Log: "Link registered: linkId (N segments)"
    │
    └─ Console: "Registered X links ✓"
```

---

## Console API Architecture

```
window.pulseImpulse = {
  enable: () → adapter.setEnabled(true)
  
  disable: () → adapter.setEnabled(false)
  
  debugOn: () → adapter.setDebugMode(true)
                Logs all impulse firings
                
  debugOff: () → adapter.setDebugMode(false)
                 Silent mode
                
  status: () → console.log(statusString)
               Shows:
               - Enabled: bool
               - Debug: bool
               - Active Impulses: count
               - Tracked Links: count
               - Active Pulses: count
               
  help: () → console.log(commandList)
             Shows all available commands
}
```

---

## Integration Points in main.js

```
Line 157:    Import statement
             import { setupPulseIntersectionIntegration } ...

Line 873:    Constructor property
             this.pulseIntersectionAdapter = null;

Line 1178:   Setup call
             this.setupPulseIntersectionImpulses();

Line 7324:   Setup method definition
             setupPulseIntersectionImpulses() { ... }

Line 5332:   Per-frame update
             if (this.pulseIntersectionAdapter) {
               this.pulseIntersectionAdapter.update();
             }
```

---

## Status: Production Architecture ✅

- Clean separation of concerns
- Parameter-space geometry (no physics)
- Per-segment independent state
- Defensive error handling
- Zero per-frame allocations
- Graceful degradation if systems missing
- Scalable to any network size

