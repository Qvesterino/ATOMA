# Synergy VFX Engine 1.0 — Quick Start (5 Minutes)

---

## 🚀 Installation (3 Steps)

### Step 1: Import
```javascript
import { SynergyVFXEngine1_0 } from './SynergyVFXEngine1_0.js';
```

### Step 2: Initialize
```javascript
window.game.synergyVFXEngine = new SynergyVFXEngine1_0(
  window.game.scene,
  window.game.camera,
  window.game.linkingSystem
);
```

### Step 3: Add to Animation Loop
```javascript
function animate(now) {
  const deltaMs = now - lastFrameTime;
  lastFrameTime = now;

  // Update engines
  if (window.game.priorityDecayEngine) {
    window.game.priorityDecayEngine.tick(deltaMs);
  }
  if (window.game.priorityHistoryEngine) {
    window.game.priorityHistoryEngine.tick(deltaMs);
  }
  if (window.game.synergyVFXEngine) {
    window.game.synergyVFXEngine.tick(deltaMs);
  }

  // Render
  if (window.game.synergyVFXEngine) {
    window.game.synergyVFXEngine.renderSynergyCoreTint(...);  // In NeonLinkVisuals
    window.game.synergyVFXEngine.renderOrbitHalos(...);       // Per-node
    window.game.synergyVFXEngine.renderSynergyThreads();
    window.game.synergyVFXEngine.renderBurstEvents();
    window.game.synergyVFXEngine.renderClusterFields();
  }

  renderer.render(scene, camera);
}
```

**Done!** ✓ Engine is now running.

---

## 📊 Verify It Works

```javascript
// Check status
window.game.synergyVFXEngine.status()

// Expected output:
{
  enabled: true,
  updatedLinks: 0,          // Increases as synergy data flows in
  updatedNodes: 0,
  activeThreads: 0,
  activeBursts: 0,
  clusterCount: 0,
  errors: 0
}
```

If `enabled: true` and `errors: 0` → **✓ It's working!**

---

## 🎨 What You'll See

### 1. Synergy Core Tint (Per-Link Color)
- **Positive Synergy:** Mint-cyan (#4BFFC3 → #48E0FF)
- **Neutral Synergy:** Soft violet (#C09CFF)
- **Negative Synergy:** Magenta-red (#FF2E8F)
- **Animation:**
  - Rising: Slow hue breathing (±6°)
  - Stable: Minimal noise
  - Falling: Saturation fade

### 2. Synergy Orbit Halos (Per-Node Rings)
- **Tier 1:** 1 ring
- **Tier 2:** 2-3 rings (expanding)
- **Tier 3:** 3-4 rings (full corona)
- **Rotation:** Very slow (60-80 second loops)
- **Wobble:** ±6% radius based on volatility

### 3. Synergy Threads (Filaments)
- Ultra-thin secondary connections between links in same cluster
- Only visible when cluster synergy tier ≥ 2
- Max 3-5 threads per cluster
- Fade in/out over 4-8 seconds
- Color follows synergy polarity

### 4. Synergy Burst Events (Pulses)
- Ring expands along link when synergy jumps or tier changes
- Node flares at both endpoints
- Duration: 0.6-0.9 seconds
- Cooldown: 3-5 seconds per link

### 5. Synergy Cluster Fields (Soft Auras)
- Large soft oval shape around entire synergy cluster
- Only when: ≥4 links AND avg tier ≥ 2
- Subtle noise/grid inside
- Optional dashed edge outline

---

## 🎯 Console Commands

### Status
```javascript
window.game.synergyVFXEngine.status()
// Returns: { enabled, updatedLinks, updatedNodes, activeThreads, activeBursts, clusterCount, errors }
```

### Get Diagnostic Report
```javascript
console.log(window.game.synergyVFXEngine.getDiagnosticReport())
// Prints: Formatted ASCII report with all layers
```

### Control
```javascript
window.game.synergyVFXEngine.enable()
window.game.synergyVFXEngine.disable()
window.game.synergyVFXEngine.resetAll()
```

### Configuration
```javascript
// Get current config
window.game.synergyVFXEngine.getConfig()

// Update config
window.game.synergyVFXEngine.setConfig({
  lerpFactor: 0.15,              // Faster transitions
  breathingSpeed: 0.8,           // Faster breathing
  orbitRotationSpeedMs: 80000,   // Slower rotation (80s)
})
```

### Trigger Burst
```javascript
// Manually trigger burst event on a link
const link = window.game.linkingSystem.links[0];
window.game.synergyVFXEngine.triggerBurst(link, '#48E0FF')
```

---

## 📚 Visual Layers Reference

### Layer 1: Synergy Core Tint
- **What:** Color blending on each link
- **Trigger:** Any synergy tier ≥ 1
- **Driven By:** polarity, tier, trend

### Layer 2: Orbit Halos
- **What:** Concentric rings around nodes
- **Trigger:** Node with linked synergies
- **Driven By:** synergy tier of connected links, volatility

### Layer 3: Synergy Threads
- **What:** Secondary filaments between links
- **Trigger:** Cluster with ≥ 2 links
- **Driven By:** cluster synergy trend

### Layer 4: Burst Events
- **What:** Expanding ring pulses
- **Trigger:** Synergy score jump or tier change
- **Driven By:** synergyState changes (manual triggerBurst)

### Layer 5: Cluster Fields
- **What:** Soft auras around clusters
- **Trigger:** Cluster with ≥ 4 links AND avg tier ≥ 2
- **Driven By:** cluster polarity, tier distribution

---

## ⚙️ Configuration Presets

### Subtle (Low Visual Noise)
```javascript
window.game.synergyVFXEngine.setConfig({
  tintStrength: { 0: 0.05, 1: 0.10, 2: 0.15, 3: 0.20 },
  orbitOpacity: 0.12,
  threadOpacity: 0.12,
  clusterFieldOpacity: 0.04,
  lerpFactor: 0.08,
});
```

### Balanced (Default)
```javascript
// Already configured by default
```

### Intense (High Visual Impact)
```javascript
window.game.synergyVFXEngine.setConfig({
  tintStrength: { 0: 0.15, 1: 0.25, 2: 0.35, 3: 0.50 },
  orbitOpacity: 0.35,
  threadOpacity: 0.40,
  clusterFieldOpacity: 0.15,
  lerpFactor: 0.2,
});
```

---

## ✅ Quick Testing

### Test 1: Tint Colors
1. Create linked nodes
2. Apply synergy data (positive/neutral/negative)
3. Verify: Links change color (not thickness or glow!)

### Test 2: Orbit Halos
1. Create node with multiple connections
2. Set synergy tier ≥ 1 on connections
3. Verify: Rings appear around node, slow rotation

### Test 3: Burst Event
1. Get link reference
2. Run: `window.game.synergyVFXEngine.triggerBurst(link)`
3. Verify: Ring pulse expands from link, node flares

### Test 4: Cluster Field
1. Create 4+ linked nodes in proximity
2. Set avg synergy tier ≥ 2
3. Verify: Soft aura appears around cluster

---

## 🔍 Troubleshooting

| Problem | Solution |
|---------|----------|
| No visual effects | Ensure synergyState data exists on links |
| Effects too subtle | Use "Intense" preset |
| Effects too strong | Use "Subtle" preset |
| Orbit rings not rotating | Check orbitRotationSpeedMs config |
| No threads spawning | Ensure clusters have ≥ 2 links with tier ≥ 2 |
| Performance drops | Reduce threadMaxPerCluster or clusterFieldOpacity |

---

## 🎓 Integration Points

### With NeonLinkVisuals
```javascript
// In NeonLinkVisuals animate loop:
for (const link of links) {
  // Render priority VFX first (width, glow, pulse)
  this.applyPriorityEffects(link, linkMaterial);
  
  // Then synergy tint (color only)
  window.game.synergyVFXEngine.renderSynergyCoreTint(
    link,
    linkMaterial,
    link.synergyState,
    this.time
  );
}
```

### With Node Rendering
```javascript
// For each node with synerges:
const nodeLinks = linkingSystem.links.filter(l => l.from === node || l.to === node);
window.game.synergyVFXEngine.renderOrbitHalos(
  node,
  nodeGroup,
  nodeLinks,
  time
);
```

---

## 📊 Synergy State Structure

Engine expects `link.synergyState` object:

```javascript
{
  score: 0-1,           // Synergy strength
  tier: 0-3,            // Synergy level (0=none, 3=max)
  trend: 'rising'|'falling'|'stable',
  polarity: 'positive'|'neutral'|'negative',
  clusterId: 'cluster-123',
  volatility: 0-1       // Stability (0=stable, 1=volatile)
}
```

---

## 🚀 Next Steps

1. ✓ Copy `SynergyVFXEngine1_0.js`
2. ✓ Add import to main.js
3. ✓ Initialize engine
4. ✓ Add tick() to animation loop
5. ✓ Add render calls to NeonLinkVisuals
6. ✓ Add synergy data to links
7. ✓ Test & deploy!

---

## 📞 Need Help?

Get diagnostic:
```javascript
console.log(window.game.synergyVFXEngine.getDiagnosticReport())
```

Read full guide: `SYNERGY_VFX_ENGINE_1_0_IMPLEMENTATION_SUMMARY.md`

---

**Status:** 🟢 **READY TO GO!**

Install in 5 minutes, integrate in 10 minutes, visualize synergies! 🎨
