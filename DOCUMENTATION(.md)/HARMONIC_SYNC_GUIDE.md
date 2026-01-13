# Harmonic Hub Synchronization System

## Overview

The Harmonic Hub Synchronization system creates a visually stunning network effect where nodes with multiple healthy links act as **harmonic centers** that gently synchronize the energy flow of connected links.

## Core Concept

When three or more links of sufficient health connect to a single node, that node becomes a **harmonic hub**. The hub:
- Computes an average phase from connected links
- Calculates a weighted average frequency
- Derives a synchronization strength based on harmony, synergy, and network health
- Gently pulls all connected links toward hub phase/frequency

**Result**: Links connected to the same hub visibly synchronize, creating a breathing, pulsing network effect.

## Architecture

### 1. NodeHarmonicSyncController

Attached to each node, manages:
- **Link collection**: Gathers synergy phase/frequency from connected links
- **Hub computation**: Calculates hubPhase, hubFrequency, hubStrength
- **Activation conditions**: Determines when hub becomes active
- **State smoothing**: Temporal interpolation for smooth transitions

**Activation Requirements**:
- Minimum 3 connected links
- Average synergy > 0.5
- Harmony > 1.2x Corruption
- Instability < 0.4

### 2. HarmonicSyncEffectApplier

Applies synchronization effects to link components:
- **Energy Waves**: Frequency pulled toward hub frequency (20% per sync strength)
- **Pulse Rings**: Aligned timing, increased brightness under sync
- **Arc Discharges**: Rhythmic spawning, reduced jitter (up to 60%)
- **Strands**: Enhanced glow and reflectivity

### 3. NodeHarmonicManager

Scene-level coordinator:
- Creates/manages NodeHarmonicSyncController per node
- Registers links with source/target nodes
- Updates all controllers each frame
- Applies sync feedback to link visuals

## Usage

### Application Integration

```javascript
// Get manager from link renderer
const harmonicMgr = linkRenderer.getNodeHarmonicManager();

// Register nodes and links during setup
harmonicMgr.registerNode(nodeA);
harmonicMgr.registerNode(nodeB);
harmonicMgr.registerLinkWithNodes(link, nodeA, nodeB);

// Update in render loop (after all link updates)
linkRenderer.updateNodeHarmonySync(links, harmony, corruption, instability);
```

### Monitoring Hub Activity

```javascript
// Get statistics
const stats = harmonicMgr.getHubStatistics();
console.log(`Active hubs: ${stats.activeHubs}`);
console.log(`Avg sync strength: ${stats.avgSyncStrength}`);

// Get debug info for specific node
const debugInfo = harmonicMgr.getNodeDebugInfo(node);
console.log(`Node hub status:`, debugInfo);

// Get all nodes
const allDebug = harmonicMgr.getAllDebugInfo();
```

## Visual Effects

### Under Strong Synchronization (Strength > 0.7)

- **Pulse rings**: Bright, aligned timing across all links from hub
- **Energy waves**: All waves move at same frequency
- **Arc discharges**: Regular, rhythmic pattern
- **Strands**: Enhanced glow with subtle pulsing
- **Overall feel**: Coherent, harmonious energy flow

### Under Moderate Synchronization (Strength 0.3-0.7)

- **Partial alignment**: Some phase correlation
- **Gentle frequency pulling**: Waves gradually converge
- **Subtle visual changes**: Increased saturation, slight brightness boost

### Under Weak/No Synchronization (Strength < 0.3)

- **Independent behavior**: Links operate individually
- **No visible sync effects**: Full independence maintained
- **Clean degradation**: No sudden visual changes

## Configuration

### Hub Activation Thresholds

```javascript
const config = {
    minLinksForHub: 3,              // Minimum links to form hub
    minAverageSynergy: 0.5,         // Min avg synergy (0-1)
    harmonyCorruptionRatio: 1.2,   // Harmony must be 1.2x corruption
    maxInstability: 0.4,            // Max instability (0-1)
};

harmonicMgr.nodeControllers.forEach(ctrl => {
    ctrl.setConfig(config);
});
```

### Sync Strength Modifiers

```javascript
const config = {
    synergyStrengthScale: 0.4,      // Synergy contribution
    harmonyStrengthBoost: 0.3,      // Harmony boost
    instabilityDamping: 0.5,        // Instability reduction
    linkCountBoost: 0.1,            // Per-extra-link bonus
};
```

### Effect Application Rates

```javascript
const config = {
    phaseInterpolationRate: 0.08,   // Hub phase convergence
    frequencyInterpolationRate: 0.05, // Frequency convergence
};
```

## Performance Considerations

- **No per-frame allocations**: Pre-computed phase/frequency caches
- **Efficient updates**: Only active hubs compute synchronization
- **Temporal smoothing**: Gradual interpolation prevents flicker
- **Minimal GPU impact**: Uses existing material properties only

## Interaction with Other Systems

### Harmony/Corruption System
- **Harmony** strengthens hub effect
- **Corruption** weakens hub formation
- **Instability** dampens synchronization

### Synergy/Flow System
- Uses synergy phases from LinkEnergyWave
- Pulls frequency toward hub average
- No direct gameplay coupling

### Interference System
- Independent from phase variance effects
- Harmonic sync and interference can coexist
- Interference may reduce hub formation

## Debug Visualization

Enable debug mode to see hub status:

```javascript
// Get hub statistics
const stats = harmonicMgr.getHubStatistics();
console.log(`
  Total nodes: ${stats.totalNodes}
  Active hubs: ${stats.activeHubs}
  Connected links: ${stats.totalConnectedLinks}
  Avg sync strength: ${(stats.avgSyncStrength * 100).toFixed(1)}%
`);

// Inspect specific hub
const debug = harmonicMgr.getNodeDebugInfo(node);
console.log(`
  Hub active: ${debug.isActive}
  Hub phase: ${(debug.hubPhase * 180 / Math.PI).toFixed(1)}°
  Hub frequency: ${debug.hubFrequency.toFixed(2)}
  Hub strength: ${(debug.hubStrength * 100).toFixed(1)}%
  Link count: ${debug.linkCount}
`);
```

## Network Patterns

### Hub Topology
```
        ╱─── Link ───╲
    Node A ─── Link ─── Hub Node (HARMONIC CENTER)
        ╲─── Link ───╱
```

### Cascade Effect
Multiple hubs in network create layered synchronization:
```
Hub1 ─── Link ─── Hub2 ─── Link ─── Hub3
         (synced)       (synced)
```

## Future Extensions

Potential enhancements (visual-only):
- **Cascade resonance**: Hub-to-hub phase locking
- **Harmonic overtones**: Multiple frequency layers
- **Visual indicators**: Glow rings showing hub boundaries
- **Frequency beats**: Visible aliasing patterns at certain ratios
- **Corruption cascades**: Breakdown propagation through hubs

## Common Issues

### Hub not forming?
- Check minimum link count (≥3 required)
- Verify harmony > corruption
- Confirm synergy > 0.5 on average

### Links not synchronizing?
- Increase harmony level
- Add more links to node (increases strength)
- Reduce corruption exposure
- Lower instability

### Visual effects too subtle?
- Increase hub strength modifiers in config
- Ensure sync strength display is working
- Check link components are updating

## Summary

The Harmonic Hub system transforms ATOMA's network from a static visualization into a living, breathing ecosystem. Healthy nodes become visible synchronization centers, creating intuitive visual feedback about network health and energy flow coherence.

**Key principle**: Visualization follows network topology—well-connected, healthy nodes become harmonic hubs that synchronize their surroundings, creating beautiful emergent patterns.
