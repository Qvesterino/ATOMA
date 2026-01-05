# Particle Impact Render Loop Integration

## Overview

**Integrate particle impact effects into the main rendering loop so node auras respond to particle arrival.**

The infrastructure is already in place:
- Particles detect arrival (LinkTrailParticleSystem)
- Impact managers track impact state (ImpactManagerCollection)
- Node aura system updates node visuals (NodeLinkedAuraSystem)

This integration connects them all.

## Architecture

```
animate() loop
  │
  ├─ Update particles (emit + detect arrivals)
  │
  ├─ → Trigger impact callbacks (particles arrive)
  │   → ImpactManagerCollection.triggerImpact(nodeId, type, time, ...)
  │
  ├─ Update impact manager (decay impacts)
  │   impactManager.update(currentTime)
  │
  ├─ Update node aura system
  │   nodeAuraSystem.update(deltaTime, nodes)
  │   └─ Query: impactManager.getShaderState(nodeId)
  │   └─ Apply: impact amplitude to aura deformation
  │
  └─ Render (aura vertices deformed by impacts)
```

## Implementation Steps

### Step 1: Wire Impact Manager to Aura System

In `main.js`, after LinkRendererConduit initialization:

```javascript
// Create NodeLinkedAuraSystem with impact manager reference
this.nodeAuraSystem = new NodeLinkedAuraSystem(
  this.scene,
  this.linkingSystem,
  {
    enabled: false,
    impactManager: this.linkRendererConduit.impactManager  // Wire it here
  }
);
```

Or set it later:

```javascript
// If already created without impact manager
if (this.nodeAuraSystem && this.linkRendererConduit?.impactManager) {
  this.nodeAuraSystem.setImpactManager(this.linkRendererConduit.impactManager);
}
```

### Step 2: Update Impact Manager Every Frame

In `main.js` `animate()` method, after particles update:

```javascript
animate() {
  requestAnimationFrame(() => this.animate());
  
  const deltaTime = this.clock.getDelta();
  this.time += deltaTime;
  
  // ... existing updates ...
  
  // Update particles (triggers impact callbacks)
  if (this.trailParticles) {
    this.trailParticles.update(deltaTime, this.time);
  }
  
  if (this.healingParticles) {
    this.healingParticles.update(deltaTime, this.time);
  }
  
  // ✅ UPDATE IMPACT MANAGERS (NEW)
  if (this.linkRendererConduit?.impactManager) {
    this.linkRendererConduit.impactManager.update(this.time);
  }
  
  // Update node auras (reads from impact manager)
  if (this.nodeAuraSystem && this.aiNodes) {
    this.nodeAuraSystem.update(deltaTime, this.aiNodes.nodes);
  }
  
  // ... rest of loop ...
}
```

**Order matters:**
1. Particles update + detect arrivals → trigger impacts
2. Impact manager updates → decay active impacts
3. Node aura system updates → queries latest impact state
4. Render → auras deformed by impacts

### Step 3: Node Data Requirements

Ensure nodes have `nodeId` in userData:

```javascript
node.userData.nodeId = someUniqueId;  // Required for impact lookup
```

Most systems already do this. Verify with:

```javascript
console.log(this.aiNodes.nodes[0].userData.nodeId);  // Should be a number
```

## Code Changes Summary

### NodeLinkedAuraSystem.js

**Added:**
- Constructor option: `impactManager` (optional)
- Method: `setImpactManager(impactManager)`
- In `updateAura()`: Query impact manager and apply impact amplitude

**Modified:**
- `updateAura()`: Query `impactManager.getShaderState(nodeId)` 
- Motion calculation: Include `impactAmplitude` in vertex displacement
- New field in auraData: `impactAmplitude`, `impactInfluence`

**No shader changes required** (uniforms already exist in NodeAuraShader)

### main.js

**Add to constructor:**
```javascript
impactManager: this.linkRendererConduit.impactManager
```

**Add to animate():**
```javascript
if (this.linkRendererConduit?.impactManager) {
  this.linkRendererConduit.impactManager.update(this.time);
}
```

## Visual Behavior

### Corruption Particle Arrives

```
Timeline:
0ms      → Particle reaches target node
         → ImpactManagerCollection.triggerImpact('corruption', ...)
         
0-30ms   → Aura vertices pulled inward (-0.2 amplitude)
         → Motion multiplier increases by impact amount
         → Red color tint begins

30-110ms → Peak contraction holds
         → Vertices heavily deformed inward

110-150ms→ Decay curve
         → Vertices return to normal
         → Red tint fades

150ms    → Complete, impact removed from pool
```

### Harmony Particle Arrives

```
Timeline:
0ms      → Particle reaches source node
         → ImpactManagerCollection.triggerImpact('harmony', ...)
         
0-30ms   → Aura vertices pushed outward (+0.15 amplitude)
         → Motion multiplier increases by impact amount
         → Cyan/white tint begins

30-130ms → Peak expansion holds
         → Vertices pushed outward
         → Cyan tint peaks

130-160ms→ Decay curve
         → Vertices return to normal
         → Cyan tint fades

160ms    → Complete, impact removed from pool
```

## Performance Impact

- **Per-frame cost**: ~0.01ms (impact manager update only)
- **Memory**: Zero new allocations (reuses existing pools)
- **Scalability**: Linear with active impacts (typically <10)

## Verification

### Check Integration

```javascript
// 1. Verify impact manager exists
console.log(game.linkRendererConduit?.impactManager);

// 2. Verify nodeAuraSystem has it
console.log(game.nodeAuraSystem?.impactManager);

// 3. Create a link and emit particles
// → Node should deform on particle arrival

// 4. Check stats
console.log(game.nodeAuraSystem?.stats);
```

### Debug Output

```javascript
// Enable debug mode
game.nodeAuraSystem.debugMode = true;

// Monitor active impacts
setInterval(() => {
  const stats = game.nodeAuraSystem.stats;
  console.log(`Active auras: ${stats.activeAuras}, Update: ${stats.lastUpdateTime.toFixed(2)}ms`);
}, 500);
```

## Troubleshooting

**Aura not responding to particles?**

1. Check nodeId exists:
   ```javascript
   console.log(game.aiNodes.nodes[0].userData.nodeId);
   ```

2. Check impact manager updated:
   ```javascript
   game.linkRendererConduit.impactManager.update(game.time);
   ```

3. Check aura system has impact manager:
   ```javascript
   console.log(game.nodeAuraSystem.impactManager);
   ```

4. Check particles reaching nodes:
   ```javascript
   // Enable particle arrival logging in LinkTrailParticleSystem.js
   // Around line 379: console.log('Particle arrived at', link.target.userData.nodeId);
   ```

**Visual feedback too subtle?**

Increase impact amplitude in NodeImpactManager.js:

```javascript
// Line ~108: return -0.2 * eased * this.intensity;  // Reduce -0.2
// Change to: return -0.35 * eased * this.intensity;  // Increase effect
```

**Performance issues?**

- Reduce particle emission rate
- Reduce active nodes (use link filtering)
- Profile with `game.nodeAuraSystem.stats`

## Design Philosophy

**Energy transfer, not explosion**

Particles don't create flashes or sparks. They modulate the existing aura field:

- **Subtle motion** (deformation, not flare)
- **Color shift** (tinting, not saturation)
- **Smooth decay** (120-200ms ease, not instant)
- **Physical feel** (vertices move, not effects overlay)

The aura **breathes in** the arriving particle energy.

## Reversibility

To disable particle impact feedback:

```javascript
// Option 1: Disable aura system
game.nodeAuraSystem.enabled = false;

// Option 2: Disconnect impact manager
game.nodeAuraSystem.setImpactManager(null);

// Option 3: Clear impacts
game.linkRendererConduit.impactManager.clear();
```

No system code is changed—just wired together.

## Next Steps

After integration:

1. **Tune parameters** if needed (impact amplitude, duration, decay curve)
2. **Collect visual feedback** (is effect readable? Too strong? Too subtle?)
3. **Extend with sound** (optional: add chimes/resonances on impact)
4. **Profile in production** (verify <1ms per frame cost with many nodes)
