# Node Hierarchy Visual Feedback — Quick Reference

## What Triggers Automatically

| Event | Effects |
|-------|---------|
| **Reparenting** | Scale pop + Particles + Glows + Ring + Connection pulse |
| **Property Inheritance** | Particle trail + Glow (property color) |
| **Hierarchy Cascade** | Staggered particles down tree + Final ring |

## Effect Timing

| Effect | Duration | Color |
|--------|----------|-------|
| Particle pulse | 0.8s | Property-dependent |
| Connection pulse | 0.5s | Auto |
| Scale animation | 0.6s | Auto (node's color) |
| Glow effect | 0.4s | Property-dependent |
| Ring expansion | 0.8s | Property-dependent |

## Property Colors

```
Corruption → Red (#ff3333)
Harmony    → Green (#00ff88)
Stress     → Orange (#ff6600)
Stability  → Blue (#6666ff)
Hierarchy  → Lime Green (#88ff00)
```

## Disable/Enable Effects

```javascript
const fb = hierarchyBridge.visualFeedback;
fb.config.enableParticlePulses = false;
fb.config.enableConnectionPulses = false;
fb.config.enableScaleAnimations = false;
fb.config.enableGlowEffects = false;
fb.config.enableRingExpansions = false;
```

## Manual Triggers

```javascript
const fb = hierarchyBridge.visualFeedback;

// Particle pulse
fb.createParticlePulse(from, to, color, 8);

// Connection pulse
fb.createConnectionPulse(nodeA, nodeB, line);

// Scale animation
fb.createScaleAnimation(mesh, 1.0, 1.15);

// Glow effect
fb.createGlowEffect(mesh, color, duration);

// Ring expansion
fb.createRingExpansion(position, color, maxRadius);

// Property inheritance
fb.createPropertyInheritanceEffect(parentPos, childPos, 'corruption');

// Hierarchy cascade
fb.createHierarchyCascade([pos1, pos2, pos3], color, 'down');
```

## Configuration

```javascript
const config = hierarchyBridge.visualFeedback.config;

// Timings
config.particleLifetime = 0.8;
config.connectionPulseDuration = 0.5;
config.scaleAnimationDuration = 0.6;
config.glowFadeDuration = 0.4;
config.ringExpansionDuration = 0.8;

// Visuals
config.particleSize = 0.15;
config.glowIntensity = 1.5;
config.ringRadius = 1.0;
config.ringSegments = 64;
config.particleCount = 8;

// Colors
config.particleColor = new THREE.Color(0x00ffff);
config.hierarchyConnectorColor = new THREE.Color(0x88ff00);
config.cascadeColor = new THREE.Color(0xff6600);
config.harmonyColor = new THREE.Color(0x00ff88);
```

## Pool Configuration

```javascript
const pool = hierarchyBridge.effectsPool;

// Capacity
pool.config.maxParticles = 200;
pool.config.maxRings = 50;
pool.config.maxAnimations = 100;

// Get stats
const stats = pool.getStats();
console.log(stats);
// { particles: {inUse, available, total}, rings: {...} }

// Clear all
pool.clear();
```

## Console API

```javascript
// Get stats
const stats = window.hierarchyDebug?.getStats?.();
console.log(stats);

// Manual effects
const scene = hierarchyBridge.scene;
const fb = hierarchyBridge.visualFeedback;

// Create particle pulse at positions
const from = new THREE.Vector3(0, 0, 0);
const to = new THREE.Vector3(10, 5, 0);
fb.createParticlePulse(from, to, new THREE.Color(0x00ff00), 6);

// Create glowing ring
fb.createRingExpansion(to, new THREE.Color(0x00ffff), 2.5);
```

## Performance

- **Per-frame overhead:** <2ms (50+ effects)
- **Particle pool:** 200 max (reusable)
- **Ring pool:** 50 max (reusable)
- **Memory:** ~50KB warm state
- **Budget:** <3% frame time

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Effects not visible | Check config.enable* flags |
| Laggy effects | Reduce maxParticles or disable effects |
| Memory growing | Monitor pool stats, ensure dispose called |
| Colors wrong | Check property-color mapping |
| Too many particles | Reduce particleCount or particleLifetime |

## Integration Points

1. **Reparenting:** Automatic 5-effect sequence
2. **Property inheritance:** Color-coded particle trail
3. **Cascade:** Staggered down-tree animation
4. **Manual:** Call createX() methods anytime

## Visual Effect Order

```
Parent node ──────────── Child node
   │glow (0.3s)    ^particles stream^    │glow (0.4s)
   │               expanding ring        │
   │               (lime 2.5 radius)     │
   └─────connection line pulse───────────┘
         └─── scale pop on child ───┘
```

## Event-Driven Architecture

```javascript
// Listen to hierarchy changes
nodeHierarchySystem.onReparented.push((event) => {
  // Automatic effects trigger here
  console.log(`${event.nodeId} reparented to ${event.newParent}`);
});

nodeHierarchySystem.onPropertyInherited.push((event) => {
  // Automatic property effects trigger here
  console.log(`${event.property} inherited by ${event.nodeId}`);
});
```

---

**Total Code:** 600+ LOC (Effects + Pool + Integration)
**Performance Target:** <2ms per frame
**Memory Footprint:** ~50KB (warm pool)
