# Quick Integration Reference

## 2-Minute Integration Guide

### Change 1: Pass Impact Manager to Aura System

**File**: `main.js`  
**Location**: Where `NodeLinkedAuraSystem` is created  
**Add**:

```javascript
this.nodeAuraSystem = new NodeLinkedAuraSystem(
  this.scene,
  this.linkingSystem,
  {
    enabled: false,
    impactManager: this.linkRendererConduit.impactManager  // ← ADD THIS
  }
);
```

### Change 2: Update Impact Manager Every Frame

**File**: `main.js`  
**Location**: In `animate()` method, after particles update  
**Add**:

```javascript
// Update particles
if (this.trailParticles) this.trailParticles.update(deltaTime, this.time);
if (this.healingParticles) this.healingParticles.update(deltaTime, this.time);

// ✅ ADD: Update impact managers
if (this.linkRendererConduit?.impactManager) {
  this.linkRendererConduit.impactManager.update(this.time);
}

// Update auras (reads from impact manager)
if (this.nodeAuraSystem && this.aiNodes) {
  this.nodeAuraSystem.update(deltaTime, this.aiNodes.nodes);
}
```

---

## Verification (1 minute)

```javascript
// 1. Check wiring
console.log(game.nodeAuraSystem.impactManager);  // Should not be null

// 2. Create a link
game.linkingSystem.createLink(node1, node2);

// 3. Watch particles
// → Particles emit along link

// 4. Watch node aura
// → Target node aura contracts on particle arrival
// → Source node aura expands on healing arrival
```

---

## What It Does

When particles reach a node:

1. **Corruption particles** → Node aura pulls inward (150ms)
2. **Harmony particles** → Node aura pushes outward (160ms)
3. **Color tint** → Red or cyan modulation during impact
4. **No new visuals** → Uses existing aura deformation

---

## That's It!

**2 code changes in main.js = Particle impacts visible.**

No shader changes. No new systems. No gameplay changes.

Just connects existing systems together.
