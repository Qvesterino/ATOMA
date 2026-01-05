# Node Hierarchy Visual Feedback System v1.0 — Complete Guide

## Overview

The Visual Feedback System provides **real-time animated effects** that trigger when hierarchy changes occur, giving players immediate visual confirmation of hierarchy operations.

**What Triggers Effects:**
- Nodes being reparented (parent-child established)
- Properties cascading through hierarchy
- Hierarchy depth changes
- Metrics updating after aggregation

---

## Effect Types

### 1. Particle Pulses
**When:** Reparenting, property inheritance
**Visual:** Particles stream from parent to child
**Colors:** 
- Hierarchy changes: Lime green (#88ff00)
- Corruption: Red (#ff3333)
- Harmony: Green (#00ff88)
- Stress: Orange (#ff6600)
- Stability: Blue (#6666ff)

```javascript
// Trigger particle pulse
hierarchyFeedback.createParticlePulse(
  fromPosition,      // Parent node position
  toPosition,        // Child node position
  color,            // THREE.Color
  count             // Number of particles (typically 4-8)
);
```

**Configuration:**
```javascript
visualFeedback.config.enableParticlePulses = true;
visualFeedback.config.particleLifetime = 0.8;      // seconds
visualFeedback.config.particleSize = 0.15;
visualFeedback.config.particleCount = 8;
```

### 2. Connection Pulses
**When:** Link established
**Visual:** Connection line brightens then fades
**Duration:** 500ms

```javascript
// Trigger connection pulse
hierarchyFeedback.createConnectionPulse(fromNode, toNode, connectionLine);
```

**Configuration:**
```javascript
visualFeedback.config.enableConnectionPulses = true;
visualFeedback.config.connectionPulseDuration = 0.5; // seconds
```

### 3. Scale Animations
**When:** Reparenting (on child node)
**Visual:** Node scales up slightly (pop effect)
**Duration:** 600ms

```javascript
// Trigger scale animation
hierarchyFeedback.createScaleAnimation(
  nodeMesh,      // The mesh to animate
  1.0,          // From scale
  1.15          // To scale (pop upward)
);
```

**Configuration:**
```javascript
visualFeedback.config.enableScaleAnimations = true;
visualFeedback.config.scaleAnimationDuration = 0.6; // seconds
```

### 4. Glow Effects
**When:** Reparenting, property inheritance
**Visual:** Node emissive brightens then fades
**Duration:** 400ms

```javascript
// Trigger glow effect
hierarchyFeedback.createGlowEffect(
  nodeMesh,      // The mesh to glow
  color,         // THREE.Color
  duration       // Optional duration
);
```

**Configuration:**
```javascript
visualFeedback.config.enableGlowEffects = true;
visualFeedback.config.glowFadeDuration = 0.4;      // seconds
visualFeedback.config.glowIntensity = 1.5;
```

### 5. Ring Expansions
**When:** Hierarchy cascade, property inheritance
**Visual:** Ring expands outward from position and fades
**Duration:** 800ms

```javascript
// Trigger ring expansion
hierarchyFeedback.createRingExpansion(
  position,      // THREE.Vector3
  color,         // THREE.Color
  maxRadius      // Optional max radius (default: 3.0)
);
```

**Configuration:**
```javascript
visualFeedback.config.enableRingExpansions = true;
visualFeedback.config.ringExpansionDuration = 0.8;  // seconds
visualFeedback.config.ringRadius = 1.0;
visualFeedback.config.ringSegments = 64;
```

---

## Automatic Feedback Triggers

### When Nodes Are Reparented

**Automatic effects:**
1. ✅ Scale pop on child node (1.0 → 1.12)
2. ✅ Particle pulse from parent → child (8 particles, lime green)
3. ✅ Glow effect on parent (lime green, 0.3s)
4. ✅ Glow effect on child (cyan, 0.4s)
5. ✅ Ring expansion at connection midpoint (lime green, 2.5 radius)
6. ✅ Connection line pulse (500ms)

```
VISUAL RESULT:
Parent node ━━━━━ Child node
   |glow     ^particles^    |glow
   |         expanding ring |
   └─────────┬─────────────┘
       |scale pop
```

### When Properties Are Inherited

**Automatic effects:**
1. ✅ Particle trail from parent → child (color matches property)
2. ✅ Glow effect on child (property-specific color)

**Property colors:**
| Property | Color | Hex |
|----------|-------|-----|
| Corruption | Red | #ff3333 |
| Harmony | Green | #00ff88 |
| Stress | Orange | #ff6600 |
| Stability | Blue | #6666ff |

### When Hierarchy Cascades

**Automatic cascade visualization:**
- Particles stream down the tree
- Each node in cascade gets stronger effect
- Final node gets ring expansion

```
Root (cascade starts)
  ↓ particles + glow
Child 1
  ↓ particles + glow
Child 2
  ↓ particles + glow + ring expansion
Leaf node (cascade ends)
```

---

## Performance Optimization

### Effect Pooling

**Reusable objects prevent garbage collection:**

```javascript
// Particle pool
config.maxParticles = 200;     // Reuse up to 200 particles

// Ring pool
config.maxRings = 50;          // Reuse up to 50 rings

// Animation states
config.maxAnimations = 100;    // Reuse animation data
```

### Pool Statistics

```javascript
// Monitor pool health
const stats = window.hierarchyDebug.getStats?.();
console.log(stats);
// {
//   pools: {
//     particles: { inUse: 45, available: 95, total: 140 },
//     rings: { inUse: 8, available: 25, total: 33 }
//   }
// }
```

### Performance Targets

| Operation | Time | Budget |
|-----------|------|--------|
| Create particle pulse (8 particles) | <0.5ms | <1% |
| Create scale animation | <0.2ms | <0.5% |
| Create glow effect | <0.1ms | <0.2% |
| Create ring expansion | <0.3ms | <0.5% |
| **Update all effects per frame** | **<2ms** | **<3%** |

---

## Configuration

### Disable/Enable Effects

```javascript
hierarchyBridge.visualFeedback.config.enableParticlePulses = false;
hierarchyBridge.visualFeedback.config.enableConnectionPulses = false;
hierarchyBridge.visualFeedback.config.enableScaleAnimations = false;
hierarchyBridge.visualFeedback.config.enableGlowEffects = false;
hierarchyBridge.visualFeedback.config.enableRingExpansions = false;
```

### Customize Timings

```javascript
hierarchyBridge.visualFeedback.config = {
  particleLifetime: 1.0,            // Longer particle life
  connectionPulseDuration: 0.3,     // Faster connection pulse
  scaleAnimationDuration: 1.0,      // Slower scale animation
  glowFadeDuration: 0.5,            // Longer glow fade
  ringExpansionDuration: 1.0,       // Slower ring expansion
};
```

### Customize Colors

```javascript
const config = hierarchyBridge.visualFeedback.config;
config.particleColor = new THREE.Color(0x00ff00);      // Green
config.hierarchyConnectorColor = new THREE.Color(0x00ffff);  // Cyan
config.cascadeColor = new THREE.Color(0xff00ff);       // Magenta
config.harmonyColor = new THREE.Color(0x00ff00);       // Green
```

### Customize Visual Intensity

```javascript
const config = hierarchyBridge.visualFeedback.config;
config.particleSize = 0.3;         // Larger particles
config.glowIntensity = 2.0;        // Brighter glow
config.ringRadius = 1.5;           // Larger rings
```

---

## Console API

### Get Visual Feedback Stats

```javascript
// See effect counts
console.log(window.hierarchyDebug?.getStats());
```

### Manual Effect Triggers

```javascript
// Trigger particle pulse manually
hierarchyBridge.visualFeedback.createParticlePulse(
  startPos,
  endPos,
  new THREE.Color(0x00ffff),
  6
);

// Trigger glow effect
hierarchyBridge.visualFeedback.createGlowEffect(
  nodeMesh,
  new THREE.Color(0x00ff00),
  0.5  // duration
);

// Trigger scale animation
hierarchyBridge.visualFeedback.createScaleAnimation(
  nodeMesh,
  1.0,   // from
  1.2    // to
);

// Trigger ring expansion
hierarchyBridge.visualFeedback.createRingExpansion(
  position,
  new THREE.Color(0x00ffff),
  2.5    // maxRadius
);

// Trigger hierarchy cascade
hierarchyBridge.visualFeedback.createHierarchyCascade(
  [pos1, pos2, pos3],  // nodePositions
  new THREE.Color(0xff00ff),  // color
  'down'  // cascadeDirection
);

// Trigger property inheritance effect
hierarchyBridge.visualFeedback.createPropertyInheritanceEffect(
  parentPos,
  childPos,
  'corruption'  // property type
);
```

---

## Visual Effects Chain Example

### Scenario: Create Hierarchy A → B → C

```javascript
// Step 1: Set B parent to A
hierarchyDebug.setParent('B', 'A');
// EFFECTS TRIGGERED:
// ├─ Particle pulse: A → B (lime green, 8 particles)
// ├─ Scale pop: B (1.0 → 1.12)
// ├─ Glow: A (lime green, fade 0.3s)
// ├─ Glow: B (cyan, fade 0.4s)
// ├─ Ring: midpoint of A-B (lime green, expand to 2.5)
// └─ Connection pulse: A-B line (brighten/fade 0.5s)

// Step 2: Set C parent to B
hierarchyDebug.setParent('C', 'B');
// EFFECTS TRIGGERED: (same as above, but for B-C relationship)

// Step 3: Set property on A
hierarchyDebug.setProperty('A', 'corruption', 0.8);
// EFFECTS TRIGGERED:
// ├─ Property inheritance: A → B
// │  ├─ Particle trail: A → B (red, 6 particles)
// │  └─ Glow: B (red, fade)
// └─ Property inheritance: B → C
//    ├─ Particle trail: B → C (red, 6 particles)
//    └─ Glow: C (red, fade)
```

---

## Visual Hierarchy in Code

### Effect Priority

**Higher priority = rendered on top:**
1. Connection lines (lowest)
2. Glow effects (medium-low)
3. Ring expansions (medium)
4. Particle pulses (highest)

### Depth Sorting

- Connection lines: renderOrder = 0
- Glow effects: emissive layer (already sorted by Three.js)
- Rings: renderOrder = 10
- Particles: renderOrder = 20

---

## Troubleshooting

### Effects Not Visible

```javascript
// Check if effects enabled
console.log(hierarchyBridge.visualFeedback.config);

// Check if pool has capacity
const stats = hierarchyBridge.effectsPool.getStats();
console.log(stats);
// If inUse >= maxParticles, effects may not render

// Manual test
hierarchyBridge.visualFeedback.createRingExpansion(
  new THREE.Vector3(0, 0, 0),
  new THREE.Color(0x00ff00),
  2.0
);
```

### Performance Issues

```javascript
// Check if too many effects active
const stats = hierarchyBridge.effectsPool.getStats();
if (stats.particles.inUse > 150) {
  console.warn('Too many particle effects');
}

// Reduce pool sizes or disable effects
hierarchyBridge.visualFeedback.config.enableParticlePulses = false;

// Reduce update frequency
hierarchyBridge.config.updateFrequency = 15; // Instead of 30
```

### Memory Leaks

```javascript
// Monitor pool usage over time
setInterval(() => {
  const stats = hierarchyBridge.effectsPool.getStats();
  console.log('Pool stats:', stats);
  // Should stabilize after initial warm-up
}, 5000);

// Force cleanup if needed
hierarchyBridge.visualFeedback.dispose();
hierarchyBridge.effectsPool.dispose();
```

---

## Advanced Usage

### Custom Effect Orchestration

```javascript
// Create complex effect sequence
function createSpecialEffect(node1, node2) {
  const pos1 = node1.mesh.position;
  const pos2 = node2.mesh.position;
  const midpoint = new THREE.Vector3().addVectors(pos1, pos2).multiplyScalar(0.5);

  // Wave of effects over time
  setTimeout(() => {
    hierarchyBridge.visualFeedback.createParticlePulse(pos1, pos2, new THREE.Color(0x00ffff), 10);
  }, 0);

  setTimeout(() => {
    hierarchyBridge.visualFeedback.createRingExpansion(midpoint, new THREE.Color(0x00ffff), 3.0);
  }, 100);

  setTimeout(() => {
    hierarchyBridge.visualFeedback.createRingExpansion(midpoint, new THREE.Color(0x00ffff), 4.0);
  }, 200);

  setTimeout(() => {
    hierarchyBridge.visualFeedback.createScaleAnimation(node2.mesh, 1.0, 1.3);
  }, 300);
}
```

### Effect Feedback Integration

```javascript
// Play sound when effect triggers
nodeHierarchySystem.onReparented.push((event) => {
  if (audioSystem) {
    audioSystem.playSFX('hierarchy_link', {
      position: childNode.mesh.position,
      volume: 0.5
    });
  }
});
```

---

## Performance Summary

### Memory Usage
- **Per particle**: ~100 bytes
- **Per ring**: ~200 bytes
- **Total pool**: ~50KB (warm state)

### CPU Usage
- **Per frame**: <2ms for 50+ active effects
- **Pool management**: <0.1ms
- **Update all**: <3% of frame budget

### Visual Impact
- **Visible range**: 100 units (configurable)
- **Effect density**: 50-100 active effects maximum
- **Opacity layers**: 3 (particles, rings, glows)

---

## Files

- **Core:** `/NodeHierarchyVisualFeedback_v1.js` (380 LOC)
- **Pool:** `/NodeHierarchyEffectsPool_v1.js` (220 LOC)
- **Bridge:** `/NodeHierarchyBridge_v1.js` (updated with integration)
- **Guide:** This file

---

## Next Steps

- Test visual feedback in gameplay
- Tune timing and colors based on feedback
- Adjust pool sizes if performance issues
- Monitor for memory leaks
- Consider adding sound effects synchronized with visuals
