# SYNERGY CASCADE VISUALIZER — QUICK START GUIDE

## ⚡ 30-Second Setup

The cascade visualizer is **already integrated** and running automatically. No code changes needed!

### What It Does
- 🟡 Visualizes synergy energy flowing through linked networks
- 🌊 Shows cascading effects propagating from high-synergy nodes
- ✨ Five beautiful visual effects simultaneously

### How It Works
1. Nodes with synergy > 0.7 automatically trigger cascades
2. Energy propagates outward through connected links
3. Visual effects show the cascade traveling along each link
4. Particles follow cascade paths, ripples expand at propagation points

---

## 🎮 Live Testing

### Enable Debug Console

```javascript
// Open browser console and type:
cascadeDebug.help()
```

### See Cascades in Action

```javascript
// Trigger cascades manually
cascadeDebug.triggerMultiple(3);  // 3 random cascades
```

### Watch Performance

```javascript
// Real-time stats
cascadeDebug.stats();
// Output:
// Active Cascades: 3
// Links Affected: 24
// Active Particles: 47
// Last Frame Time: 1.2ms
```

---

## 🎨 Quick Configuration

### Change Speed

```javascript
cascadeDebug.setSpeed(3.0);  // 3x faster
cascadeDebug.setSpeed(1.0);  // Normal speed
```

### Change Particle Count

```javascript
cascadeDebug.setParticles(15);  // More particles = more visual impact
cascadeDebug.setParticles(4);   // Fewer particles = better performance
```

### Change Detection Threshold

```javascript
cascadeDebug.setThreshold(0.6);  // More cascades (lower threshold)
cascadeDebug.setThreshold(0.8);  // Fewer cascades (higher threshold)
```

### Toggle Specific Effects

```javascript
cascadeDebug.setVisualizations({
  waveFront: true,         // Animated pulse ✓
  cascadeGlow: true,        // Brightness effect ✓
  flowParticles: true,      // Directional particles ✓
  rippleEffect: true,       // Expanding rings ✓
  harmonicShimmer: true     // Oscillating colors ✓
});

// Example: Disable particles for better performance
cascadeDebug.setVisualizations({
  waveFront: true,
  cascadeGlow: true,
  flowParticles: false,    // Disabled
  rippleEffect: true,
  harmonicShimmer: true
});
```

---

## 📊 What You'll See

### Visual Effects

1. **Wave Front** — Bright cyan pulse traveling along links
2. **Cascade Glow** — Links brighten to yellow during cascade
3. **Flow Particles** — Yellow particles flowing in cascade direction
4. **Ripple Effect** — Expanding rings at cascade source/propagation points
5. **Harmonic Shimmer** — Oscillating color bands (yellow ↔ cyan)

### Performance
- <3ms per frame overhead
- Works with 500+ links
- 3-5 concurrent cascades typical
- Auto-limits to 50 max cascades

---

## 🔧 Troubleshooting

### No cascades appearing?

```javascript
// Lower threshold for more cascades
cascadeDebug.setThreshold(0.3);

// Manually trigger
cascadeDebug.triggerMultiple(5);

// Check if enabled
cascadeDebug.toggle();  // Disable then enable
```

### Performance lag?

```javascript
// Reduce particles
cascadeDebug.setParticles(4);

// Disable expensive effects
cascadeDebug.setVisualizations({
  waveFront: true,
  cascadeGlow: true,
  flowParticles: false,   // Expensive
  rippleEffect: false,    // Expensive
  harmonicShimmer: true
});

// Check stats
cascadeDebug.stats();
```

### Cascades too slow/fast?

```javascript
cascadeDebug.setSpeed(2.0);  // Default
cascadeDebug.setSpeed(0.5);  // 2x slower
cascadeDebug.setSpeed(5.0);  // 2.5x faster
```

---

## 💡 Advanced Usage

### Access Visualizer Instance

```javascript
const visualizer = window.cascadeDebug.visualizer;

// Manual trigger
visualizer.triggerCascadeAtNode(nodeObject, 0.9);

// Get stats
console.log(visualizer.stats);
// {
//   activeCascades: 3,
//   linksAffected: 24,
//   particlesActive: 47,
//   lastUpdateTime: 1.2,
//   framesProcessed: 2847
// }

// Configuration
visualizer.config.propagationSpeed = 3.0;
visualizer.config.particleCount = 12;

// Clear all
visualizer.clearAllCascades();
```

### Monitor Cascades

```javascript
// Watch cascades
setInterval(() => {
  const viz = window.cascadeDebug.visualizer;
  console.log(`🟡 ${viz.stats.activeCascades} cascades active, ${viz.stats.particlesActive} particles`);
}, 1000);
```

### Enable Debug Logging

```javascript
cascadeDebug.toggleDebug();  // Enable debug console output

// You'll see messages like:
// 🟡 CASCADE #42 initiated at node 5
// 🟡 Triggered 3 cascades
```

---

## 📋 Console API Reference

### Control

| Command | Effect |
|---------|--------|
| `cascadeDebug.enable()` | Turn on |
| `cascadeDebug.disable()` | Turn off |
| `cascadeDebug.toggle()` | Toggle |
| `cascadeDebug.toggleDebug()` | Debug mode |

### Configuration

| Command | Effect |
|---------|--------|
| `cascadeDebug.setThreshold(0.7)` | Detection threshold (0-1) |
| `cascadeDebug.setSpeed(2.0)` | Propagation speed |
| `cascadeDebug.setParticles(8)` | Particles per cascade |
| `cascadeDebug.config()` | Show full config |

### Trigger

| Command | Effect |
|---------|--------|
| `cascadeDebug.trigger(5)` | Cascade at node 5 |
| `cascadeDebug.triggerMultiple(3)` | 3 random cascades |
| `cascadeDebug.clear()` | Clear all |

### Info

| Command | Effect |
|---------|--------|
| `cascadeDebug.stats()` | Performance stats |
| `cascadeDebug.help()` | Full help |

---

## 🎯 Best Practices

### 1. Keep Threshold Reasonable
```javascript
cascadeDebug.setThreshold(0.7);  // Good: Not too frequent
cascadeDebug.setThreshold(0.9);  // Too rare
cascadeDebug.setThreshold(0.3);  // Too frequent
```

### 2. Monitor Performance
```javascript
setInterval(() => cascadeDebug.stats(), 2000);
// If Last Frame Time > 5ms, reduce particles
```

### 3. Test Different Settings
```javascript
cascadeDebug.setSpeed(1.0);       // Slow
cascadeDebug.setParticles(5);
cascadeDebug.triggerMultiple(3);  // Watch effect

cascadeDebug.setSpeed(4.0);       // Fast
cascadeDebug.setParticles(15);
cascadeDebug.triggerMultiple(3);  // Watch effect
```

### 4. Customize for Your Scene
```javascript
// For large networks
cascadeDebug.setThreshold(0.75);
cascadeDebug.setParticles(6);

// For small networks
cascadeDebug.setThreshold(0.6);
cascadeDebug.setParticles(12);
```

---

## 📚 Examples

### Example 1: Demo Mode

```javascript
// Enable full effects
cascadeDebug.setParticles(12);
cascadeDebug.setSpeed(2.0);
cascadeDebug.enable();

// Watch
cascadeDebug.stats();  // See stats
cascadeDebug.triggerMultiple(5);  // Trigger cascades
```

### Example 2: Performance Test

```javascript
// Start timer
const start = performance.now();

// Do work
cascadeDebug.triggerMultiple(10);

// Check performance
cascadeDebug.stats();

// Result example:
// Last Frame Time: 2.3ms (good!)
```

### Example 3: Specific Effect Testing

```javascript
// Test each effect individually
cascadeDebug.setVisualizations({
  waveFront: true,
  cascadeGlow: false,
  flowParticles: false,
  rippleEffect: false,
  harmonicShimmer: false
});
cascadeDebug.triggerMultiple(3);  // See wave front only

// Then test next one...
cascadeDebug.setVisualizations({
  waveFront: false,
  cascadeGlow: true,
  flowParticles: false,
  rippleEffect: false,
  harmonicShimmer: false
});
// etc.
```

---

## ❓ FAQ

**Q: Do I need to modify any code?**
A: No! It's already integrated and running.

**Q: Why aren't cascades appearing?**
A: Nodes need synergy > 0.7. Use `cascadeDebug.setThreshold(0.3)` to lower the threshold.

**Q: Is it affecting performance?**
A: No, <3ms overhead for typical networks. Check `cascadeDebug.stats()`.

**Q: Can I customize colors?**
A: Yes! Access via: `cascadeDebug.visualizer.config.cascadeColor = new THREE.Color(0xff00ff);`

**Q: How many cascades can run simultaneously?**
A: 50 by default, configurable: `cascadeDebug.visualizer.config.maxActiveCascades = 100;`

---

## 🚀 Next Steps

1. **Enable**: `cascadeDebug.enable()`
2. **Test**: `cascadeDebug.triggerMultiple(3)`
3. **Watch**: `cascadeDebug.stats()`
4. **Customize**: `cascadeDebug.setSpeed(3.0)`
5. **Monitor**: Check performance regularly

**Enjoy the cascades!** 🟡✨

For detailed information, see: `/SYNERGY_CASCADE_IMPLEMENTATION.md`
