# TASK 1: Synergy Visuals Extension — Action Plan

## Goal
Make synergy VISIBLE through animated energy flow patterns along links.

**Player Experience**: 
- AWAKENED synergy: Bright, fast-flowing energy wave traveling source → target
- STRONG synergy: Subtle, slower directional glow
- Nodes respond with visual amplification
- Graceful degradation when synergy drops

---

## Architecture (No New Systems)

### Existing Hooks Used
1. **NeonLinkVisuals.updateMetricLinks()** — Already iterates all links
2. **NeonLinkVisuals.linkStates Map** — Already tracks synergy state
3. **Link mesh structure** — Existing geometry available
4. **Particle system** — Already has travel-along-path logic
5. **SynergyStateResolver** — Just integrated, ready to use

### Extension Points (Adding to existing code)

#### 1. Synergy Flow Particle System
- Extends existing `particles` array (piggyback, not separate)
- Uses same update loop (`updateParticles()`)
- Mark synergy flow particles with `userData.isSynergyFlow = true`
- Travel along link curve like normal data flow particles, but:
  - **AWAKENED**: Bright cyan/violet, fast (0.15 speed), denser (5-8 particles)
  - **STRONG**: Dim cyan, slower (0.05 speed), sparse (2-3 particles)

#### 2. Link Pulsing Animation
- Hook into existing `updateMetricLinks()` call
- Modify `emissiveIntensity` based on `synergyState`
- **AWAKENED**: Intense rapid pulse (3-4 Hz)
- **STRONG**: Gentle slow pulse (0.5 Hz)
- Reuse existing mesh materials

#### 3. Node Visual Reaction
- Hook into node update loop (existing `animate()` calls)
- Add glow amplification via existing `vfxAura` system
- Add subtle breathing scale (±3% max scale oscillation)
- Only when linked nodes have AWAKENED/STRONG synergy

---

## Implementation Strategy

### Phase 1: Link Energy Flow
**File**: `/NeonLinkVisuals.js`

Add method: `_createSynergyFlowParticles(link, state)`
- Checks `state.synergyState`
- Creates colored sphere particles that travel link curve
- Marks them so they're visually distinct but use existing particle system

Modify: `updateMetricLinks()` 
- When `isSynergyAwakened || state.synergyState === STRONG`:
  - Create synergy flow particles (reuse existing pool)
  - Modulate link emissive based on state

### Phase 2: Link Pulsing
**File**: `/NeonLinkVisuals.js`

Modify: `_applyMetricMaterial()` 
- Add synergy-based emissive modulation
- AWAKENED: Fast sine pulse + intensity boost
- STRONG: Slow sine pulse + subtle intensity

### Phase 3: Node Reactions
**File**: `/EnhancedNodeModels.js`

Modify: `animate()`
- Check node connections for synergy state
- If any connection has AWAKENED synergy:
  - Increase aura glow (multiply emissiveIntensity ×1.3)
  - Add breathing scale animation (±3%)
- Reset when synergy drops

---

## Implementation Details

### Synergy Flow Particles (No New Manager)

```javascript
// In NeonLinkVisuals.js > updateMetricLinks()

// When synergyState is AWAKENED or STRONG:
if (state.synergyState === SynergyState.AWAKENED || 
    state.synergyState === SynergyState.STRONG) {
  
  const flowParticles = this._createSynergyFlowParticles(
    state.mesh,
    state.synergyState,
    this.time
  );
  
  // Particles are added to existing this.particles pool
  // They're cleaned up by existing updateParticles() logic
}

_createSynergyFlowParticles(linkMesh, synergyState, currentTime) {
  if (!linkMesh.userData.curvePoints) return []; // No curve data
  
  const isAwakened = (synergyState === SynergyState.AWAKENED);
  
  const config = {
    AWAKENED: {
      color: new THREE.Color(0x00ffff), // Cyan
      speed: 0.15,
      count: 6,
      size: 0.12,
      intensity: 1.0
    },
    STRONG: {
      color: new THREE.Color(0x0088ff), // Blue
      speed: 0.05,
      count: 2,
      size: 0.08,
      intensity: 0.6
    }
  };
  
  const flowConfig = config[isAwakened ? 'AWAKENED' : 'STRONG'];
  const particles = [];
  
  for (let i = 0; i < flowConfig.count; i++) {
    const geometry = new THREE.SphereGeometry(flowConfig.size, 4, 4);
    const material = new THREE.MeshBasicMaterial({
      color: flowConfig.color,
      transparent: true,
      opacity: flowConfig.intensity,
      fog: false
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    const startIndex = (i / flowConfig.count) * linkMesh.userData.curvePoints.length;
    mesh.position.copy(linkMesh.userData.curvePoints[Math.floor(startIndex)]);
    
    this.scene.add(mesh);
    
    const particleData = {
      mesh,
      pathIndex: startIndex,
      speed: flowConfig.speed,
      trail: [],
      curvePoints: linkMesh.userData.curvePoints,
      isSynergyFlow: true,  // Mark as synergy flow
      synergyState: synergyState,
      flowColor: flowConfig.color.clone()
    };
    
    this.particles.push(particleData);
    particles.push(particleData);
  }
  
  return particles;
}
```

### Link Pulsing (Extend Existing)

```javascript
// In NeonLinkVisuals.js > _applyMetricMaterial()

_applyMetricMaterial(material, metricColor, pulse) {
  if (!material) return;
  
  // [SYNERGY PULSING] Add synergy-based modulation
  // Get synergy from parent state (need to pass through)
  const synergyPulse = this._computeSynergyPulse(state.synergyState);
  
  // Apply pulses
  if (material.emissive) {
    material.emissive.copy(metricColor);
    material.emissiveIntensity = pulse.intensity + synergyPulse.boost;
  }
}

_computeSynergyPulse(synergyState) {
  if (!synergyState) return { boost: 0, frequency: 0 };
  
  const isAwakened = (synergyState === SynergyState.AWAKENED);
  const isStrong = (synergyState === SynergyState.STRONG);
  
  if (!isAwakened && !isStrong) {
    return { boost: 0, frequency: 0 };
  }
  
  const frequency = isAwakened ? 3.0 : 0.5;  // Hz
  const pulse = Math.sin(this.time * frequency) * 0.5 + 0.5; // 0-1
  const boostAmount = isAwakened ? 0.4 : 0.1;
  
  return {
    boost: pulse * boostAmount,
    frequency: frequency
  };
}
```

### Node Aura Reaction (In animate())

```javascript
// In EnhancedNodeModels.js > animate()

// Check if this node has awakened synergy connections
const linkedNodes = nodeGroup.userData.linkedNodes || [];
let hasAwakened Synergy = false;
let hasStrongSynergy = false;

for (const link of linkedNodes) {
  const linkState = linkState.get(link.id); // Access from parent
  if (linkState?.synergyState === SynergyState.AWAKENED) {
    hasAwokenedSynergy = true;
    break;
  }
  if (linkState?.synergyState === SynergyState.STRONG) {
    hasStrongSynergy = true;
  }
}

// Modulate aura
if (nodeGroup.userData.vfxAura) {
  const aura = nodeGroup.userData.vfxAura;
  
  if (hasAwokenedSynergy) {
    aura.material.emissiveIntensity = 0.8 + Math.sin(time * 2) * 0.2;
    nodeGroup.scale.set(
      1.0 + Math.sin(time * 0.8) * 0.03,
      1.0 + Math.sin(time * 0.8) * 0.03,
      1.0 + Math.sin(time * 0.8) * 0.03
    );
  } else if (hasStrongSynergy) {
    aura.material.emissiveIntensity = 0.5 + Math.sin(time * 0.5) * 0.1;
  } else {
    // Restore normal state
    aura.material.emissiveIntensity = 0.3;
    nodeGroup.scale.setScalar(1.0);
  }
}
```

---

## Performance Impact

### GPU/CPU Safe
- ✅ No new shaders
- ✅ Reuses existing material system
- ✅ Particles are existing system (already optimized)
- ✅ Simple sine waves for animation (negligible cost)

### Overhead
- Per-link: <0.1ms (resolv state, check particles)
- Per-synergy-particle: <0.01ms (same as normal particles)
- Per-node: <0.05ms (aura material update + scale)
- **Total**: ~1-2ms for full network (imperceptible)

---

## Visual Degradation

When synergy drops:
- Flow particles naturally fade out (existing death logic)
- Emissive pulse relaxes to baseline
- Aura glow and node scale return to normal
- No jarring transitions (all use smooth sine curves)

---

## Files Modified

1. **NeonLinkVisuals.js** (~100 lines added)
   - `_createSynergyFlowParticles()`
   - `_computeSynergyPulse()`
   - Integrate into `updateMetricLinks()`

2. **EnhancedNodeModels.js** (~40 lines added)
   - Synergy check in `animate()`
   - Aura modulation

**Total**: ~140 lines, pure extension (no refactoring)

---

## Testing Checklist

- [ ] Links with synergy >= 0.85 show bright energy flow
- [ ] Links with 0.75 <= synergy < 0.85 show dim flow
- [ ] Flow particles travel visibly from source to target
- [ ] Node auras brighten when connected to awakened links
- [ ] Synergy drop causes graceful fade-out
- [ ] No visual artifacts or z-fighting
- [ ] Performance remains stable (<60FPS impact negligible)

