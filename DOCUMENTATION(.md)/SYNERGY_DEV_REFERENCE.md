# Synergy Visual System 1.0 - Developer Reference Card

## Copy-Paste Integration

### Step 1: Import (top of main.js)

```javascript
import { SynergyVFX1_0 } from './SynergyVFX1_0.js';
import { SynergyHighways1_0 } from './SynergyHighways1_0.js';
```

### Step 2: Initialize (in scene setup)

```javascript
const synergyVFX = new SynergyVFX1_0(scene, camera);
const synergyHighways = new SynergyHighways1_0(scene, camera);

synergyVFX.setupConsoleAPI();
synergyHighways.setupConsoleAPI();
```

### Step 3: Update Loop

```javascript
function animate(deltaTime) {
  // Update synergy systems
  synergyVFX.update(deltaTime);
  synergyHighways.update(deltaTime);
  
  // Update links (pseudocode)
  links.forEach(link => {
    const synergy = calculateSynergy(link); // YOUR calculation
    const linkId = `${link.source.id}-${link.target.id}`;
    
    synergyVFX.updateLink(link, linkId, synergy);
    synergyHighways.updateLink(link, linkId, synergy);
    
    synergyVFX.updateNodeAura(link.source, link.source.id, synergy);
    synergyVFX.updateNodeAura(link.target, link.target.id, synergy);
  });
  
  renderer.render(scene, camera);
}
```

---

## API Quick Reference

### SynergyVFX1_0

```javascript
// Lifecycle
synergyVFX.registerNode(node, nodeId);
synergyVFX.registerLink(link, linkId);
synergyVFX.unregisterNode(nodeId);
synergyVFX.unregisterLink(linkId);
synergyVFX.dispose();

// Updates (per frame)
synergyVFX.updateLink(link, linkId, synergyStrength);
synergyVFX.updateNodeAura(node, nodeId, synergyStrength);
synergyVFX.update(deltaTime);

// Effects
synergyVFX.triggerBurst(link, "#44EEFF");

// Debugging
synergyVFX.setupConsoleAPI();
```

### SynergyHighways1_0

```javascript
// Lifecycle
synergyHighways.registerLink(link, linkId);
synergyHighways.unregisterLink(linkId);
synergyHighways.dispose();

// Updates (per frame)
synergyHighways.updateLink(link, linkId, synergyStrength);
synergyHighways.update(deltaTime);

// Debugging
synergyHighways.setupConsoleAPI();
synergyHighways.updateVisibilityCulling();
```

---

## Parameter Ranges

### SynergyStrength

- **0.0** — No synergy (nothing visible)
- **0.4** — Node auras start appearing
- **0.7** — Highways become visible
- **1.0** — Maximum all effects

### Quick Config Adjustments

```javascript
// Less intense
synergyVFX.config.glowBaseIntensity = 0.08;
synergyVFX.config.auraThreshold = 0.6;
synergyHighways.config.synergyThreshold = 0.85;

// More intense
synergyVFX.config.glowBaseIntensity = 0.25;
synergyVFX.config.auraThreshold = 0.2;
synergyHighways.config.synergyThreshold = 0.5;

// Performance focused
synergyVFX.config.trailParticleCount = 3;
synergyHighways.config.updateFrequency = 2;
```

---

## Console Debug Commands

### Get/Set Config

```javascript
// View all settings
cfg = window.game.synergyVFX.getConfig();
cfg = window.game.synergyHighways.getConfig();

// Change a value
window.game.synergyVFX.setConfig('glowPulseSpeed', 3.0);
window.game.synergyHighways.setConfig('arcHeight', 20);
```

### Test Effects

```javascript
// Trigger burst on first link
link = window.game.nodeLinker.links[0];
window.game.synergyVFX.triggerBurst(link, "#44ff44");

// Check highway stats
console.log(window.game.synergyHighways.getActiveCount());
console.log(window.game.synergyHighways.getHighwayCount());
```

---

## Troubleshooting Checklist

| Issue | Check |
|-------|-------|
| Nothing shows | Is `update()` called? Is synergy > 0? Is node registered? |
| Glitchy motion | Update frequency too low? Are node positions changing? |
| Performance lag | Reduce trailParticleCount? Increase updateFrequency? |
| Missing auras | Is synergy > 0.4? Are nodes registered? |
| No highways | Is synergy > 0.7? Are both systems updated? |

---

## Performance Limits

```
Safe Limits (60 FPS):
  ├─ 100-200 links: <2ms
  ├─ 50-100 highways: <1.5ms
  ├─ 1000+ burst particles: <1ms
  └─ 1000+ trail particles: <1ms

Warning Signs:
  ├─ >5ms synergy overhead: optimize config
  ├─ >30% frame time: reduce updateFrequency
  └─ Memory > 500KB: unregister unused links
```

---

## Color Examples

```javascript
// Named colors for bursts
"#00ddff"  // Cyan
"#ff00ff"  // Magenta
"#00ff88"  // Green
"#ffaa00"  // Orange
"#ff4444"  // Red
"#44ddff"  // Light cyan
"#ff44ff"  // Bright magenta
```

---

## Typical Synergy Calculation

```javascript
function calculateSynergy(nodeA, nodeB) {
  let synergy = 0;
  
  // Type compatibility
  if (nodeA.type === nodeB.type) synergy += 0.3;
  
  // Category match
  if (nodeA.category === nodeB.category) synergy += 0.2;
  
  // Distance bonus
  const dist = nodeA.position.distanceTo(nodeB.position);
  synergy += Math.max(0, 0.5 - dist * 0.01);
  
  // Clamp to 0-1
  return Math.max(0, Math.min(1, synergy));
}
```

---

## Node Registration Pattern

```javascript
// When creating a node
const node = new AINode(data);
synergyVFX.registerNode(node, node.id);
myNodes.push(node);

// When creating a link
const link = createLink(nodeA, nodeB);
const linkId = `${nodeA.id}-${nodeB.id}`;
synergyVFX.registerLink(link, linkId);
synergyHighways.registerLink(link, linkId);
myLinks.push(link);
```

---

## Cleanup Pattern

```javascript
// On link removal
synergyVFX.unregisterLink(linkId);
synergyHighways.unregisterLink(linkId);

// On node removal
synergyVFX.unregisterNode(nodeId);

// On world reset
synergyVFX.dispose();
synergyHighways.dispose();

// Reinitialize after reset
synergyVFX = new SynergyVFX1_0(scene, camera);
synergyHighways = new SynergyHighways1_0(scene, camera);
```

---

## File Locations

```
/SynergyVFX1_0.js                 ← Main VFX engine (432 lines)
/SynergyHighways1_0.js            ← Highway ribbons (387 lines)
/Synergy_Quick_Start.md           ← Start here
/Synergy_Integration_Guide.md     ← Deep dive
/Synergy_Visual_Spec.md           ← Animation details
/SYNERGY_IMPLEMENTATION_SUMMARY.md ← Overview
```

---

## Key Properties

### Link Object Requirements

```javascript
link.source  → { position, color, id }
link.target  → { position, color, id }

// Optional but used:
link.coreLine     → THREE.Line (for reference)
link.color        → THREE.Color or hex
```

### Node Object Requirements

```javascript
node.position  → THREE.Vector3
node.color     → THREE.Color or defaults to white
node.id        → any unique value
```

---

## Memory Usage Rule of Thumb

```
Per link: ~560 bytes (VFX)
Per highway: ~2KB

100 links = 56KB
50 highways = 100KB
Total = 156KB typical

Safe threshold: < 1MB for 1000+ links
```

---

## Render Order

```
1. Scene background
2. World geometry
3. NeonLinkVisuals (core links)
4. SynergyVFX layers
5. SynergyHighways (additive, non-destructive)
6. UI overlay
```

---

## Common Mistakes

❌ **Mistake:** Registering same linkId twice
✅ **Fix:** Check if already registered or use Set to track

❌ **Mistake:** Not calling `update(deltaTime)`
✅ **Fix:** Add to animation loop BEFORE render

❌ **Mistake:** Providing synergyStrength > 1 or < 0
✅ **Fix:** Clamp to [0, 1] in your calculation

❌ **Mistake:** Not unregistering on node/link removal
✅ **Fix:** Call `unregisterLink()` on deletion

❌ **Mistake:** Updating with null nodes
✅ **Fix:** System handles nulls gracefully, but still validate

---

## Performance Tips

1. **Lower update frequency** for highways:
   ```javascript
   synergyHighways.config.updateFrequency = 2; // Every 2 frames
   ```

2. **Reduce particle count** if needed:
   ```javascript
   synergyVFX.config.trailParticleCount = 3;   // Default 6
   ```

3. **Raise thresholds** to show fewer effects:
   ```javascript
   synergyVFX.config.auraThreshold = 0.6;      // Default 0.4
   synergyHighways.config.synergyThreshold = 0.85; // Default 0.7
   ```

4. **Monitor frame time** with console:
   ```javascript
   console.time('synergy');
   synergyVFX.update(dt);
   synergyHighways.update(dt);
   console.timeEnd('synergy');
   ```

---

## Three.js Version Compatibility

- ✅ Three.js v0.160.0+ (verified)
- ✅ Uses standard materials (MeshBasicMaterial, LineBasicMaterial, PointsMaterial)
- ✅ Uses standard geometries (TorusGeometry, BufferGeometry)
- ✅ Uses standard blending modes (AdditiveBlending)
- ✅ No version-specific APIs

---

## Next Reading

- **Quick Start:** Synergy_Quick_Start.md (15 min read)
- **Integration:** Synergy_Integration_Guide.md (30 min read)
- **Deep Dive:** Synergy_Visual_Spec.md (45 min read)
- **Code:** SynergyVFX1_0.js & SynergyHighways1_0.js (well-commented)

---

**Status: ✅ Ready to Use**

Questions? Check the appropriate documentation file or review the well-commented source code.
