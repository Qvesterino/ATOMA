# Neural Curve Link Visuals 1.0 — Quick Reference

## 🚀 Getting Started (30 seconds)

```javascript
// All commands use window.neuralCurves:

neuralCurves.preview()              // Show all commands
neuralCurves.status()               // Print system status
neuralCurves.enable()               // Turn on curves
neuralCurves.disable()              // Turn off curves
```

---

## 🎛️ Control Panel

```javascript
// Curve strength (0 = straight, 1 = extreme)
neuralCurves.setStrength(0.6)       // Default: moderate curves

// Micro-jitter (0 = static, 0.02 = max breathing)
neuralCurves.setOscillation(0.005)  // Default: subtle oscillation

// Category influence (true = smarter curves)
neuralCurves.setCategoryBias(true)  // Default: enabled

// Smoothing speed (lower = smoother, slower)
neuralCurves.setSmoothing(0.15)     // Default: balanced
```

---

## 📊 Presets

### 🎨 Artistic (Extreme Curves)
```javascript
neuralCurves.setStrength(0.85)
neuralCurves.setOscillation(0.01)
neuralCurves.setCategoryBias(true)
neuralCurves.setSmoothing(0.08)
// Result: Dramatic organic neural pathways
```

### 🎯 Balanced (Default)
```javascript
neuralCurves.setStrength(0.6)
neuralCurves.setOscillation(0.005)
neuralCurves.setCategoryBias(true)
neuralCurves.setSmoothing(0.15)
// Result: Moderate curves with subtle breathing
```

### 📉 Minimal (Subtle Curves)
```javascript
neuralCurves.setStrength(0.3)
neuralCurves.setOscillation(0)
neuralCurves.setCategoryBias(false)
neuralCurves.setSmoothing(0.25)
// Result: Barely noticeable curves, no jitter
```

### ⚡ Performance (Low CPU)
```javascript
neuralCurves.setStrength(0.4)
neuralCurves.setOscillation(0)
neuralCurves.setCategoryBias(false)
neuralCurves.setSmoothing(0.3)
// Result: Minimal overhead, slight curves
```

### 🔥 Chaos (Maximum Effect)
```javascript
neuralCurves.setStrength(0.95)
neuralCurves.setOscillation(0.015)
neuralCurves.setCategoryBias(true)
neuralCurves.setSmoothing(0.05)
// Result: Extreme wavy curves with intense breathing
```

---

## 📈 Behavior Matrix

| Setting | Low | Medium | High | Effect |
|---------|-----|--------|------|--------|
| **Strength** | 0.2 | 0.6 | 0.95 | Curve arc size |
| **Oscillation** | 0.0 | 0.005 | 0.015 | Jitter amount |
| **Smoothing** | 0.25 | 0.15 | 0.05 | Response speed |

---

## 🔧 Advanced Tweaking

### For Each Node Category Type:
```javascript
// INPUT nodes (cyan):
// → Often connect to PROCESS, moderate curves good

// PROCESS nodes (amber):
// → Hub nodes, strong category curves recommended

// MYTHIC nodes (gold):
// → Rare, ceremonial - set strength to 0.8+

// PRIME nodes (white):
// → Perfect topology - enable categoryBias

// ERROR nodes (red):
// → Chaotic - high strength (0.8) + high oscillation (0.01)
```

---

## 🎮 Live Demo Commands

```javascript
// Switch between presets instantly
neuralCurves.setStrength(0.3)  // Try this
// Watch links become straighter

neuralCurves.setStrength(0.9)  // Try this
// Watch links become more curved

neuralCurves.setOscillation(0)     // Static curves
neuralCurves.setOscillation(0.01)  // Breathing curves
```

---

## 🐛 Troubleshooting (1-Minute Fixes)

| Problem | Fix | Command |
|---------|-----|---------|
| No curves visible | Increase strength | `neuralCurves.setStrength(0.8)` |
| Curves jittery/unstable | Lower smoothing | `neuralCurves.setSmoothing(0.08)` |
| Too much jitter | Reduce oscillation | `neuralCurves.setOscillation(0)` |
| Performance drop | Lower strength | `neuralCurves.setStrength(0.3)` |
| Links too straight | Increase strength | `neuralCurves.setStrength(0.8)` |
| Want category logic | Enable bias | `neuralCurves.setCategoryBias(true)` |

---

## 📊 Status Check

```javascript
// View everything:
neuralCurves.status()

// Example output:
// {
//   enabled: true,
//   strength: 0.6,
//   oscillationAmount: 0.005,
//   categoryBias: true,
//   activeLinks: 12,
//   totalUpdates: 14400,
//   linkDetails: [...]
// }
```

---

## 💾 Save Your Settings

```javascript
// Create a preset function:
window.saveMyPreset = () => {
  window.myPreset = {
    strength: 0.7,
    oscillation: 0.006,
    categoryBias: true,
    smoothing: 0.12
  };
  console.log('Preset saved!');
};

// Load it later:
window.loadMyPreset = () => {
  if (window.myPreset) {
    neuralCurves.setStrength(window.myPreset.strength);
    neuralCurves.setOscillation(window.myPreset.oscillation);
    neuralCurves.setCategoryBias(window.myPreset.categoryBias);
    neuralCurves.setSmoothing(window.myPreset.smoothing);
    console.log('Preset loaded!');
  }
};
```

---

## 🎯 Best Practices

✅ **DO:**
- Use `setStrength(0.4-0.8)` for most cases
- Keep `setOscillation(0-0.01)` subtle
- Call `status()` to check performance
- Experiment with presets

❌ **DON'T:**
- Set strength > 0.95 (too extreme)
- Enable oscillation > 0.02 (causes seizure effect)
- Use setCategoryBias(false) unless you want uniform curves
- Forget to call enable() if links look straight

---

## 🔍 Key Concepts (2 Minutes)

**Bézier Curves:** Smooth paths defined by 3 points (start, control, end)

**Control Points:** Move based on:
- Distance between nodes
- Node categories (semantic relationships)
- Network stability

**Oscillation:** Tiny per-frame jitter for organic feel

**Smoothing:** How quickly control points move (lower = smoother)

**Category Bias:** Makes complementary categories curve more strongly

---

## 📞 Help

```javascript
// See all available commands:
neuralCurves.preview()

// Get system statistics:
neuralCurves.printStats()

// Check current configuration:
neuralCurves.status()

// Emergency: Disable everything:
neuralCurves.disable()
```

---

**Pro Tip:** Start with `neuralCurves.setStrength(0.6)` and adjust from there! 🎯
