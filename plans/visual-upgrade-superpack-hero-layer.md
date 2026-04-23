# VisualUpgradeSuperpack — World-State-Gated Hero Layer

**Task Scope**: MEDIUM  
**Subsystem**: Environment / Visual Superpack  
**Goal**: Transform atmosphere from permanent noise to world-state-gated hero layer. Persistent cost ~1 FPS, burst only during transitions.

---

## Problem Diagnosis

### Current State: Always-On Volumetric Overload

[`VisualUpgradeSuperpack.js`](VisualUpgradeSuperpack.js) creates **8 packs** at boot, all permanently active:

| Pack | Objects | Per-Frame Cost | Always-On? |
|------|---------|----------------|------------|
| 1. Volumetric Lights | 5 configs × 3 meshes = 15 | Position drift + rotation + scale + opacity + color | YES |
| 2. Ambient Fog | 4 layers | Position drift + opacity + scale | YES |
| 3. Edge Glow | N scene meshes | Position/rotation/scale sync + fresnel | YES |
| 4. Color Grading | 0 (renderer settings) | None | YES (free) |
| 5. PostFX Params | 0 (stored params) | None | YES (free) |
| 6. Distortion Zones | 3 icosahedra | Rotation + emissive pulse | YES |
| 7. Sigma Rifts | 3 wireframes + 3 glow fields = 6 | Opacity + emissive + rotation | YES |
| 8. Dream Particles | 3 systems (450 particles) | Position + velocity + bounds + opacity | YES |
| 9. Camera Aura | 4 sprites | Position + rotation + opacity + scale | YES |

**Total always-on objects**: ~30+ meshes, 450 particles, all updated at 30Hz.

The [`update()`](VisualUpgradeSuperpack.js:998) method processes every object every frame, even when nothing meaningful is happening in the game world.

### The Problem

The user wants:
1. Atmosphere = **world-state-gated hero layer**, not permanent noise
2. Persistent cost max **~1 FPS**, burst only during transitions
3. **No always-on volumetric overload**

Currently, metrics are received via [`setMetrics()`](VisualUpgradeSuperpack.js:168) but only used to modulate `pulseMultiplier` — they don't gate visibility.

---

## Solution: World-State-Gated Hero Layer

### Architecture

Split the superpack into two tiers:

**BASELINE** (always-on, ~0 FPS):
- Pack 4: Renderer settings (tone mapping, exposure)
- Pack 5: PostFX parameters (stored, rendered by main.js post-processing)
- Pack 3: Edge glows (follow meshes, cheap, already gated by distance)

**HERO** (world-state-gated, burst only):
- Pack 1: Volumetric lights
- Pack 2: Atmospheric fog layers
- Pack 6: Distortion zones
- Pack 7: Sigma rifts
- Pack 8: Dream particles
- Pack 9: Camera aura

### World-State Triggers

Hero layers activate when any of these conditions are met:

| Trigger | Condition | Source |
|---------|-----------|--------|
| Corruption spike | `corruption > 0.5` | `setMetrics()` |
| Instability event | `stability < 0.3` | `setMetrics()` |
| High synergy moment | `synergy > 0.75` | `setMetrics()` |
| Manual trigger | `triggerHeroBurst(duration)` | External call |
| World transition | `triggerHeroBurst(5000)` | main.js event |

### Behavior

```mermaid
stateDiagram-v2
    [*] --> Dormant
    Dormant --> Activating: Trigger fires
    Activating --> Active: Fade-in complete ~0.5s
    Active --> Sustaining: While trigger held
    Sustaining --> Active: Re-triggered
    Active --> Fading: Trigger released + holdTime elapsed ~3s
    Fading --> Dormant: Fade-out complete ~1.0s
    
    state Dormant {
        note right of Dormant: All hero objects visible=false. Zero per-frame cost.
    }
    
    state Active {
        note right of Active: Hero objects visible=true. Metrics modulate intensity.
    }
```

### Dormant State Cost

When dormant:
- All hero objects: `visible = false`
- `update()` skips all hero forEach loops
- Only baseline packs run (renderer settings — zero cost)
- Estimated persistent cost: **~0 FPS**

### Burst Cost

When activated:
- Hero objects fade in over 0.5s
- Full update loop runs for ~3-5s
- Metrics modulate intensity during burst
- Fade out over 1.0s
- Estimated burst cost: **~2-3 FPS** (same as current always-on)

---

## Implementation Steps

### Step 1: Add Hero State Machine to Constructor

In [`constructor()`](VisualUpgradeSuperpack.js:116), add:

```javascript
// Hero layer state machine
this._heroState = 'dormant'; // 'dormant' | 'activating' | 'active' | 'fading'
this._heroOpacity = 0;
this._heroTargetOpacity = 0;
this._heroFadeSpeed = 2.0; // opacity units per second
this._heroHoldTimer = 0;
this._heroHoldDuration = 3.0; // seconds to stay active after trigger
this._heroTriggerFlags = {
    corruption: false,
    instability: false,
    synergy: false,
    manual: false
};
```

### Step 2: Add Hero Trigger Thresholds

```javascript
this._heroThresholds = {
    corruptionHigh: 0.5,
    stabilityLow: 0.3,
    synergyHigh: 0.75
};
```

### Step 3: Modify `setMetrics()` to Evaluate Triggers

In [`setMetrics()`](VisualUpgradeSuperonpack.js:168), add trigger evaluation:

```javascript
this._heroTriggerFlags.corruption = metrics.corruption > this._heroThresholds.corruptionHigh;
this._heroTriggerFlags.instability = metrics.stability < this._heroThresholds.stabilityLow;
this._heroTriggerFlags.synergy = metrics.synergy > this._heroThresholds.synergyHigh;
```

### Step 4: Add `triggerHeroBurst(duration)` Method

```javascript
triggerHeroBurst(duration = 3000) {
    this._heroTriggerFlags.manual = true;
    this._heroHoldDuration = duration / 1000;
    this._heroHoldTimer = this._heroHoldDuration;
}
```

### Step 5: Add `_evaluateHeroState(deltaTime)` Method

This is the core state machine that transitions between dormant/activating/active/fading:

```javascript
_evaluateHeroState(deltaTime) {
    const anyTrigger = Object.values(this._heroTriggerFlags).some(v => v);
    
    switch (this._heroState) {
        case 'dormant':
            if (anyTrigger) {
                this._heroState = 'activating';
                this._heroTargetOpacity = 1;
                this._showHeroObjects();
            }
            break;
        case 'activating':
            this._heroOpacity += this._heroFadeSpeed * deltaTime;
            if (this._heroOpacity >= 1) {
                this._heroOpacity = 1;
                this._heroState = 'active';
                this._heroHoldTimer = this._heroHoldDuration;
            }
            if (!anyTrigger) this._heroHoldTimer = Math.min(this._heroHoldTimer, 0.5);
            break;
        case 'active':
            this._heroHoldTimer -= deltaTime;
            if (anyTrigger) this._heroHoldTimer = this._heroHoldDuration;
            if (this._heroHoldTimer <= 0) {
                this._heroState = 'fading';
                this._heroTargetOpacity = 0;
            }
            break;
        case 'fading':
            this._heroOpacity -= this._heroFadeSpeed * deltaTime;
            if (anyTrigger) {
                this._heroState = 'activating';
                this._heroTargetOpacity = 1;
            }
            if (this._heroOpacity <= 0) {
                this._heroOpacity = 0;
                this._heroState = 'dormant';
                this._hideHeroObjects();
            }
            break;
    }
}
```

### Step 6: Add Helper Methods for Hero Object Visibility

```javascript
_showHeroObjects() {
    const show = obj => { obj.visible = true; };
    this.volumetricLights.forEach(show);
    this.atmosphericLayers.forEach(show);
    this.distortionZones.forEach(show);
    this.rifts.forEach(show);
    this.particles.forEach(show);
    if (this.cameraAura) this.cameraAura.visible = true;
}

_hideHeroObjects() {
    const hide = obj => { obj.visible = false; };
    this.volumetricLights.forEach(hide);
    this.atmosphericLayers.forEach(hide);
    this.distortionZones.forEach(hide);
    this.rifts.forEach(hide);
    this.particles.forEach(hide);
    if (this.cameraAura) this.cameraAura.visible = false;
}
```

### Step 7: Modify `update()` to Gate Hero Updates

In [`update()`](VisualUpgradeSuperpack.js:998), restructure to:

1. Always run: time update, fade interpolation, edge glow updates
2. Only run when hero active: volumetric, atmospheric, distortion, rift, particle, camera aura updates
3. Use `this._heroOpacity` as the fade multiplier for hero objects instead of `this._fadeOpacity`

The key change is wrapping the hero forEach loops in:

```javascript
if (this._heroState !== 'dormant') {
    // ... all hero object updates ...
}
```

### Step 8: Initialize Hero Objects as Hidden

In `applyFullUpgrade()`, after creating all packs, hide hero objects:

```javascript
// Start hero objects in dormant state
this._hideHeroObjects();
```

### Step 9: Wire `triggerHeroBurst()` from main.js

In world transition events and cascade events, call:

```javascript
this.visualSuperpack.triggerHeroBurst(5000); // 5-second hero burst
```

---

## Risk Assessment

- **Scope**: MEDIUM — changes are localized to VisualUpgradeSuperpack.js + minor main.js wiring
- **Affected subsystems**: Environment visual layer only
- **Breaking risk**: LOW — hero state defaults to dormant, but `setVisible(true)` still works as override
- **Performance impact**: STRONGLY POSITIVE — eliminates ~30 objects from per-frame updates when dormant
- **Visual impact**: Atmosphere only appears during meaningful moments, making it more impactful

---

## Expected Outcome

| Metric | Before | After |
|--------|--------|-------|
| Always-on objects | ~30+ | ~0 (hero hidden) |
| Persistent FPS cost | ~2-3 FPS | ~0-1 FPS |
| Burst FPS cost | N/A (always on) | ~2-3 FPS during events |
| Atmosphere impact | Constant noise | Hero moments only |
| Edge glows | Always on | Always on (cheap) |
| Color grading | Always on | Always on (free) |

---

## Files to Modify

1. **[`VisualUpgradeSuperpack.js`](VisualUpgradeSuperpack.js)** — Hero state machine, gated update, trigger evaluation
2. **[`main.js`](main.js:5021)** — Wire `triggerHeroBurst()` to world events (optional, can be done later)
