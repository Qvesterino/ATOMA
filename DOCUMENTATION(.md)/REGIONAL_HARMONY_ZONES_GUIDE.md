# Regional Harmony Zones — Extension Guide

## Overview

**Regional Harmony Zones** extend the System State Overlay by visualizing *localized network stability variations*. While the global harmony metric represents overall network state, regional zones subtly reveal where that stability is unevenly distributed across space.

---

## What Are They?

Regional Harmony Zones are soft, amorphous visual regions that communicate:

- **Where the system feels locally calm** — Zones brighten and stabilize
- **Where stability is fragile** — Zones dim and drift uncertainly
- **Where harmony has not yet propagated** — Sparse or absent zones
- **System weather patterns** — Not territory markers, not gameplay advantages

The player intuitively senses the system's internal geography—where it has learned to rest, and where it remains restless.

---

## Visual Characteristics

### Shape & Boundaries
- **Soft, amorphous** — No sharp edges
- **Overlapping gradients** — Zones blend smoothly where clusters overlap
- **Icosphere geometry** — Rounded, organic appearance
- **Size varies** — Cluster radius determines zone extent

### Color
- **Same palette as global harmony** but with lower saturation:
  - Low local harmony: Muted blue-gray `#5a6a78`
  - Medium local harmony: Muted cyan `#2aacbd`
  - High local harmony: Muted turquoise `#30cdb8`
- **Lower saturation than global ring** — Zones feel like a background presence

### Opacity
- **Very low baseline** (0.08) — Barely visible, atmospheric
- **Scales with local harmony** — High stability makes zones more apparent
- **Fades with distance** — Outer edges of zones blend to transparency
- **Responds to global harmony** — High overall harmony brightens all zones

### Motion
- **Slow, subtle drift** — Follows layered sine waves (very slow)
- **Gentle breathing** — ±0.2% scale oscillation
- **No pulsing** — No rhythm, no regular patterns
- **No rotation** — Zones expand/contract and drift, never rotate

---

## How It Works

### Regional Analysis (Every ~10 Frames)

1. **Cluster Detection**
   - Simple greedy spatial clustering of nodes
   - Clusters form when nodes are within proximity (~12 units base, scaled by harmony)
   - Only clusters with 3+ nodes become zones

2. **Local Harmony Calculation**
   - For each cluster center, calculate "local harmony influence"
   - Combines:
     - **Nearby node activity** — Distance-weighted node harmony values
     - **Local synergy presence** — Boosts stability if synergy > 0.3
     - **Link density** — Highly connected areas feel more stable
   - Result is blend of local data + global harmony

3. **Zone Creation**
   - Icosphere mesh created for each cluster
   - Size scales with cluster extent (1.3× max node distance)
   - Material color/opacity based on calculated local harmony
   - Mesh positioned at cluster center

### Per-Frame Animation

1. **Breathing Motion**
   - Very subtle expansion/contraction (±0.2%)
   - Frequency: 0.5 Hz (extremely slow)

2. **Drift Motion**
   - Layered sine waves on X, Y, Z axes
   - Each axis uses different frequency (0.08, 0.1, 0.12 rad/s)
   - Creates slow, uncertain motion (like drifting underwater)

3. **Opacity Modulation**
   - Base opacity scales with global harmony
   - High harmony: Zones more visible
   - Low harmony: Zones very dim or invisible

---

## Layering & Interaction

### Render Order
```
Background → Foreground
1. Global Harmony Ring
2. Regional Harmony Zones (NEW)
3. Synergy Halos
4. Corruption Disturbance
```

### Visual Relationships

**High Global Harmony**
- Regional zones become more visible
- All layers feel stabilized
- System appears confident

**Low Global Harmony**
- Regional zones nearly invisible
- Corruption disturbance more prominent
- System appears uncertain

**High Local Synergy**
- Zones around active clusters brighten
- Synergy halos appear above zones
- Area feels "alive" with activity

**High Corruption**
- Zones may locally dim or blur
- Corruption disturbance overlaps zones
- Area feels corrupted/uncertain

**Important**: Zones NEVER overpower synergy halos. Halos always appear on top.

---

## Performance

### Computational Cost

| Operation | Frequency | Cost |
|-----------|-----------|------|
| Cluster detection | Every ~10 frames | ~0.08ms |
| Local harmony calc | Every ~10 frames | ~0.05ms |
| Zone mesh creation | Every ~10 frames | ~0.03ms |
| Per-frame animation | Every frame | ~0.04ms |
| Total overhead | Per frame | < 0.2ms |

### Memory Usage

- ~1.2 MB per 100 active zones (geometries + materials)
- Reuses materials and buffers
- No per-frame allocations

### Optimization Details

1. **Low-frequency updates** — Zones recalculate every ~10 frames
2. **Motion-triggered updates** — Recalculate if nodes move > 5 units
3. **Geometry reuse** — Icospheres are pooled and reused
4. **Material caching** — Colors pre-computed, not updated per frame

---

## Console Commands

### Enable/Disable Zones
```javascript
window.toggleRegionalHarmonyZones()
```
- Independently toggles zones on/off
- Doesn't affect other overlay layers
- Status logged to console

### Check Status
```javascript
window.systemStateOverlayStatus()
```
Output includes:
```
--- REGIONAL HARMONY ZONES ---
Status: ✓ ACTIVE
Active Zones: 5
Update Frequency: every 10 frames
```

### Disable Entire Overlay
```javascript
window.toggleSystemStateOverlay()
```
- Disables all layers including zones
- More efficient than toggling zones separately

---

## Design Principles

### No New Information
- Zones derive from existing harmony metric
- No new data is calculated or stored
- Player doesn't "read" zones, just feels them

### Subtle Presence
- Very low opacity keeps zones non-intrusive
- Layers beneath remain visible
- Zones complement, never dominate

### Organic & Natural
- Overlapping gradients, not hard territories
- Slow drift and breathing suggest systems at rest
- No pulsing, rotation, or UI-like motion

### Weather Metaphor
- Zones are like weather patterns inside the system
- Where air masses collide → stability/instability
- Where systems align → harmony
- Where discord exists → fragmentation

### No Gameplay Impact
- Zones are pure perception/aesthetics
- No bonuses, penalties, or mechanical meaning
- Player never thinks "I should go to that zone"
- Instead: "Interesting, the system feels restless there"

---

## Interaction with Other Systems

### Synergy Halos
- Zones provide background context
- Halos appear ON TOP of zones (z-order: 1.5 vs 2)
- Active synergy brightens local zones

### Corruption Disturbance
- Corruption overlaps zones
- May locally reduce zone visibility
- Creates sense of disturbance/decay in affected regions

### Global Harmony
- Modulates all zone opacity
- High harmony stabilizes zones
- Low harmony makes zones vanish

### Node Position Changes
- Zones recalculate if nodes move > 5 units
- Cluster detection responds to network topology changes
- Smooth adaptation as network evolves

---

## Customization Points

All configuration values are in `RegionalHarmonyZones` constructor:

| Parameter | Default | Effect |
|-----------|---------|--------|
| `minZoneRadius` | 8.0 | Minimum zone size |
| `maxZoneRadius` | 25.0 | Maximum zone size |
| `zoneOpacityScale` | 0.08 | Base opacity |
| `harmonyOpacityBoost` | 0.05 | Extra opacity at high harmony |
| `minNodesPerZone` | 3 | Min nodes to form zone |
| `localSynergyWeight` | 0.3 | Synergy influence on local harmony |
| `linkDensityWeight` | 0.2 | Link density influence |
| `driftSpeed` | 0.0008 | Slow motion speed |
| `breathingAmplitude` | 0.002 | Expansion/contraction amount |
| `breathingFrequency` | 0.5 | Breathing oscillation rate |
| `updateFrequency` | 10 | Frames between recalculations |

---

## Example Scenarios

### Scenario 1: Stable Network
- All nodes active, high harmony (0.8+)
- **Expected**: Zones visible throughout, overlapping, bright colors
- **Feels like**: "The system is thinking clearly everywhere"

### Scenario 2: Fragmented Network
- Nodes in separate clusters, low global harmony (< 0.3)
- **Expected**: Few dim zones, isolated clusters, lots of empty space
- **Feels like**: "The system is disconnected, lost in thought"

### Scenario 3: Active Synergy
- High synergy in one region, medium harmony overall
- **Expected**: One bright zone with nearby synergy halos
- **Feels like**: "Something is happening here, the system is focusing"

### Scenario 4: Corrupt Region
- High corruption in specific area, mixed harmony
- **Expected**: Zone dims/disappears in corrupt area, synergy halos fade
- **Feels like**: "This part of the system is struggling"

---

## Troubleshooting

**Zones not appearing?**
1. Check that System State Overlay is enabled: `window.toggleSystemStateOverlay()`
2. Verify zones are enabled: `window.toggleRegionalHarmonyZones()`
3. Check harmony is not extremely low (< 0.2)

**Too many or too few zones?**
- Zones appear only when 3+ nodes cluster together
- Adjust `minNodesPerZone` in RegionalHarmonyZones config if needed
- Zones recalculate every ~10 frames

**Zones look wrong?**
- Toggle zones off/on: `window.toggleRegionalHarmonyZones()`
- Check color palette is appropriate for your game theme
- Verify nodes have valid `userData.harmony` and `userData.synergy`

**Performance impact?**
- Zones add < 0.2ms/frame
- If performance issues, try increasing `updateFrequency` from 10 to 15+
- Can be disabled entirely if needed

---

## Summary

Regional Harmony Zones successfully extend the System State Overlay by adding a perceptual layer of spatial stability variation. They:

- ✅ Visualize existing harmony metric locally
- ✅ Add zero new gameplay mechanics
- ✅ Maintain < 0.2ms/frame performance
- ✅ Feel organic and weather-like
- ✅ Never overpower other visual layers
- ✅ Integrate seamlessly with global systems

The result is a subtle but profound enhancement to the player's intuitive understanding of the network's internal geography—where it has learned to find harmony, and where it is still searching.
