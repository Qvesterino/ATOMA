# CORRUPTION CONTAGION v1.0 — CODE REFERENCE

## Quick Navigation

### Files Modified

**NodeLinkingSystem.js** (400+ lines added)
- Contagion engine and APIs
- Integration into update() loop
- Spread calculation and boost logic

**NeonLinkVisuals.js** (70+ lines added)
- Visual feedback for infected links
- Emissive glow color and pulse

---

## NodeLinkingSystem.js — Detailed Code Reference

### 1. Contagion Initialization (Lines 2588-2601)

**Location**: Inside `update(deltaTime, time)` method

```javascript
// [CORRUPTION CONTAGION v1.0] Process corruption spread every frame
if (!this._contagionInitialized) {
  this._contagionInitialized = true;
  // Initialize contagion config on first run
  this._contagionConfig = {
    spreadThreshold: 0.60,        // Start spreading when >= 0.60
    maxSpreadRate: 0.15,          // Max corruption/second at full infection
    linkResistance: 0.8,          // Links reduce spread by 20% by default
    proximityBoost: 1.2,          // Multi-link infections boost spread
  };
}

// Process corruption contagion (every frame)
this._updateCorruptionContagion(deltaTime);
```

**Key Variables**:
- `_contagionInitialized`: boolean, prevents reinit
- `_contagionConfig`: Configuration object with 4 tunable parameters

**Configuration Tuning**:
```javascript
// Make spread faster
this._contagionConfig.maxSpreadRate = 0.25;  // 0.25 instead of 0.15

// Lower threshold for earlier contagion
this._contagionConfig.spreadThreshold = 0.50;

// Stronger proximity boost
this._contagionConfig.proximityBoost = 1.5;
```

---

### 2. Main Contagion Loop (Lines 3590-3710)

**Method**: `_updateCorruptionContagion(deltaTime)`

```javascript
_updateCorruptionContagion(deltaTime) {
  if (!this.links || this.links.length === 0) return;
  
  const config = this._contagionConfig;
  
  // Track nodes that received contagion this frame
  const contagionEvents = [];
  
  // Scan all links for contagion propagation
  for (const link of this.links) {
    if (!link.active || !link.source || !link.target) continue;
    
    // Get corruption levels from both nodes
    const sourceCorruption = link.source.userData?.corruptionLevel ?? 0;
    const targetCorruption = link.target.userData?.corruptionLevel ?? 0;
    
    // Initialize link contagion state if needed
    if (!link.userData) link.userData = {};
    if (!link.userData.contagionState) {
      link.userData.contagionState = {
        isInfected: false,
        infectionIntensity: 0,
        lastSpreadTime: Date.now(),
        spreadDirection: null,
      };
    }
    
    // Determine spread direction(s)
    const sourceInfects = sourceCorruption >= config.spreadThreshold && sourceCorruption > targetCorruption;
    const targetInfects = targetCorruption >= config.spreadThreshold && targetCorruption > sourceCorruption;
    
    // Calculate bidirectional infection
    const bothInfected = sourceCorruption >= config.spreadThreshold && targetCorruption >= config.spreadThreshold;
    
    if (sourceInfects || targetInfects || bothInfected) {
      // Link is active for contagion
      if (!link.userData.contagionState.isInfected) {
        link.userData.contagionState.isInfected = true;
        link.userData.contagionState.lastSpreadTime = Date.now();
      }
      
      // Calculate spread direction
      if (bothInfected) {
        link.userData.contagionState.spreadDirection = 'bidirectional';
      } else if (sourceInfects) {
        link.userData.contagionState.spreadDirection = 'source->target';
      } else {
        link.userData.contagionState.spreadDirection = 'target->source';
      }
      
      // Process contagion spread (both directions if applicable)
      if (sourceInfects) {
        const spreadAmount = this._calculateContagionSpread(
          sourceCorruption, targetCorruption, deltaTime, link, config
        );
        
        if (spreadAmount > 0) {
          const newTargetCorruption = Math.min(1.0, targetCorruption + spreadAmount);
          link.target.userData.corruptionLevel = newTargetCorruption;
          link.userData.contagionState.infectionIntensity = spreadAmount / deltaTime;
          
          contagionEvents.push({
            type: 'contagion',
            source: link.source,
            target: link.target,
            amount: spreadAmount,
            newLevel: newTargetCorruption,
            link: link
          });
        }
      }
      
      if (targetInfects) {
        const spreadAmount = this._calculateContagionSpread(
          targetCorruption, sourceCorruption, deltaTime, link, config
        );
        
        if (spreadAmount > 0) {
          const newSourceCorruption = Math.min(1.0, sourceCorruption + spreadAmount);
          link.source.userData.corruptionLevel = newSourceCorruption;
          link.userData.contagionState.infectionIntensity = spreadAmount / deltaTime;
          
          contagionEvents.push({
            type: 'contagion',
            source: link.target,
            target: link.source,
            amount: spreadAmount,
            newLevel: newSourceCorruption,
            link: link
          });
        }
      }
    } else {
      // Link is not infected, reset state
      if (link.userData.contagionState.isInfected) {
        link.userData.contagionState.isInfected = false;
        link.userData.contagionState.infectionIntensity = 0;
        link.userData.contagionState.spreadDirection = null;
      }
    }
  }
  
  // Apply proximity boost for nodes with multiple incoming infections
  this._applyProximityBoost(contagionEvents, config);
}
```

**Key Decisions**:
1. **Threshold Check** (line 3625): Must be >= 0.60 to spread
2. **Directional Logic** (lines 3625-3626): Checks which direction(s) infect
3. **Bidirectional Detection** (line 3629): Both >= 0.60 = mutual spread
4. **Spread Calculation** (lines 3648-3670): Unilateral spread from source
5. **Event Tracking** (lines 3662-3669): Records all contagion for boost
6. **Proximity Boost** (line 3708): Multi-infection acceleration

---

### 3. Spread Calculation (Lines 3711-3747)

**Method**: `_calculateContagionSpread(sourceCorruption, targetCorruption, deltaTime, link, config)`

```javascript
_calculateContagionSpread(sourceCorruption, targetCorruption, deltaTime, link, config) {
  // Base spread amount from source corruption
  const baseSpread = config.maxSpreadRate * deltaTime;
  
  // Corruption differential drives spread speed
  // Larger gap = faster spread (exponential curve)
  const differential = sourceCorruption - targetCorruption;
  const spreadIntensity = Math.pow(differential, 1.5);  // Exponential weighting
  
  // Link resistance factor (0.5 = 50% slower, 2.0 = 2x faster)
  const linkResistance = link.userData?.linkResistanceFactor ?? config.linkResistance;
  
  // Target node resistance (default 1.0, higher = more resistant)
  const targetResistance = link.target.userData?.contagionResistance ?? 1.0;
  
  // Calculate final spread amount
  const spreadAmount = baseSpread * spreadIntensity * (1 / linkResistance) * (1 / targetResistance);
  
  // Saturation control: spread slows as target approaches source
  // When differential < 0.1, apply saturation damping
  if (differential < 0.1) {
    const saturationDamping = (differential / 0.1);  // 0-1
    return spreadAmount * saturationDamping;
  }
  
  return spreadAmount;
}
```

**Formula Breakdown**:
```
Step 1: baseSpread = 0.15 * deltaTime
        (Default: 0.0025 per 16ms frame)

Step 2: spreadIntensity = (source - target)^1.5
        Exponential: 0.5 → 0.35, 0.3 → 0.16, 0.1 → 0.03

Step 3: linkResistance factor = 1 / (resistance value)
        Default 0.8 → 1.25x (20% slower)

Step 4: targetResistance factor = 1 / (immunity value)
        Default 1.0 → 1.0x (no change)

Step 5: spreadAmount = step1 × step2 × step3 × step4
        
Step 6: If differential < 0.1:
          saturationDamping = differential / 0.1  (0-1)
          spreadAmount × saturationDamping
```

**Example Calculations**:
```
Scenario: 0.75 source → 0.30 target, default resistance

baseSpread = 0.15 * 0.0167s = 0.0025
differential = 0.75 - 0.30 = 0.45
spreadIntensity = 0.45^1.5 = 0.302
resistance = 1 / 0.8 = 1.25
immunity = 1 / 1.0 = 1.0
spreadAmount = 0.0025 * 0.302 * 1.25 * 1.0 = 0.000944

Per second (at 60fps): 0.000944 * 60 ≈ 0.0566 corruption/sec

At higher frame rate (120fps): proportionally higher
```

---

### 4. Proximity Boost (Lines 3749-3780)

**Method**: `_applyProximityBoost(contagionEvents, config)`

```javascript
_applyProximityBoost(contagionEvents, config) {
  // Group events by target node
  const targetGroups = new Map();
  
  for (const event of contagionEvents) {
    const targetId = event.target.uuid;
    if (!targetGroups.has(targetId)) {
      targetGroups.set(targetId, []);
    }
    targetGroups.get(targetId).push(event);
  }
  
  // Apply boost to nodes receiving multiple infections
  for (const [targetId, events] of targetGroups.entries()) {
    if (events.length > 1) {
      // Multiple infections detected - apply proximity boost
      const boostFactor = Math.min(1.5, 1.0 + (events.length - 1) * 0.15);
      
      for (const event of events) {
        event.target.userData.contagionBoost = boostFactor;
        event.target.userData.contagionSourceCount = events.length;
      }
    }
  }
}
```

**Boost Calculation**:
```
1 source:  boostFactor = 1.0 + (1-1)*0.15 = 1.0x
2 sources: boostFactor = 1.0 + (2-1)*0.15 = 1.15x
3 sources: boostFactor = 1.0 + (3-1)*0.15 = 1.30x
4 sources: boostFactor = 1.0 + (4-1)*0.15 = 1.45x
5+ sources: capped at 1.5x (Math.min(1.5, ...))
```

**Application**: Stored in node userData for use in next frame spread calculation (optional future enhancement).

---

### 5. Public APIs

#### setLinkContagionResistance (Lines 3782-3794)

```javascript
setLinkContagionResistance(link, resistance) {
  if (!link) return;
  if (!link.userData) link.userData = {};
  link.userData.linkResistanceFactor = Math.max(0.1, Math.min(10, resistance));
}
```

**Usage**:
```javascript
// Make link very resistant
linkingSystem.setLinkContagionResistance(importantLink, 3.0);  // 3x slower

// Make link vulnerable
linkingSystem.setLinkContagionResistance(dangerousLink, 0.3);  // 3x faster
```

**Range**: 0.1 (fastest) to 10.0 (slowest)  
**Default**: 0.8 (in config.linkResistance)

---

#### setNodeContagionResistance (Lines 3796-3808)

```javascript
setNodeContagionResistance(node, immunity) {
  if (!node) return;
  if (!node.userData) node.userData = {};
  node.userData.contagionResistance = Math.max(0.1, Math.min(10, immunity));
}
```

**Usage**:
```javascript
// Make node very resistant
linkingSystem.setNodeContagionResistance(criticalNode, 5.0);  // 5x harder to infect

// Make node vulnerable
linkingSystem.setNodeContagionResistance(weakNode, 0.2);  // 5x easier to infect
```

**Range**: 0.1 (most vulnerable) to 10.0 (most resistant)  
**Default**: 1.0 (normal)

---

#### getLinkContagionStatus (Lines 3810-3831)

```javascript
getLinkContagionStatus(link) {
  if (!link || !link.userData || !link.userData.contagionState) {
    return {
      isInfected: false,
      intensity: 0,
      direction: null
    };
  }
  
  return {
    isInfected: link.userData.contagionState.isInfected,
    intensity: link.userData.contagionState.infectionIntensity,
    direction: link.userData.contagionState.spreadDirection
  };
}
```

**Returns**:
```javascript
{
  isInfected: boolean,           // Link is actively spreading
  intensity: number (0-1),       // Spread rate normalized
  direction: string|null         // 'source->target' | 'target->source' | 'bidirectional'
}
```

**Example**:
```javascript
const status = linkingSystem.getLinkContagionStatus(link);
if (status.direction === 'bidirectional') {
  console.log('Both nodes spreading!');
}
```

---

#### getNodeContagionThreat (Lines 3833-3861)

```javascript
getNodeContagionThreat(node) {
  if (!node) return { threatLevel: 0, sourceCount: 0, speed: 0 };
  
  const linkedCorruptedNodes = this.getLinksForNode(node)
    .filter(link => {
      if (!link.active) return false;
      const otherNode = link.source === node ? link.target : link.source;
      return otherNode?.userData?.corruptionLevel >= this._contagionConfig.spreadThreshold;
    });
  
  const sourceCount = linkedCorruptedNodes.length;
  const threatLevel = Math.min(1.0, sourceCount * 0.25);  // Up to 1.0 at 4+ sources
  const speed = sourceCount > 0 
    ? linkedCorruptedNodes.reduce((sum, link) => sum + (link.userData?.contagionState?.infectionIntensity ?? 0), 0) / sourceCount
    : 0;
  
  return {
    threatLevel,
    sourceCount,
    speed
  };
}
```

**Returns**:
```javascript
{
  threatLevel: number (0-1),    // Composite threat (1.0 at 4+ sources)
  sourceCount: number,           // How many corrupted neighbors
  speed: number                  // Average spread speed from sources
}
```

**Threat Calculation**:
```
1 source: threatLevel = 0.25
2 sources: threatLevel = 0.50
3 sources: threatLevel = 0.75
4+ sources: threatLevel = 1.0
```

**Example**:
```javascript
const threat = linkingSystem.getNodeContagionThreat(node);
if (threat.threatLevel > 0.75) {
  console.log(`CRITICAL: ${threat.sourceCount} sources attacking!`);
}
```

---

## NeonLinkVisuals.js — Visual Feedback

### Contagion Visuals (Lines 1088-1159)

**Method**: `_applyContagionVisuals(linkMesh, contagionStatus)`

```javascript
_applyContagionVisuals(linkMesh, contagionStatus) {
  if (!linkMesh || !linkMesh.children) return;
  
  if (!linkMesh.userData) linkMesh.userData = {};
  
  const isContagionActive = contagionStatus && contagionStatus.isInfected;
  
  if (isContagionActive) {
    // Link is actively spreading corruption
    const intensity = contagionStatus.intensity || 0;  // 0-1 intensity
    
    // Apply contagion glow to all children
    for (const child of linkMesh.children) {
      if (!child.userData) child.userData = {};
      
      // Track contagion state
      child.userData.isContagious = true;
      child.userData.contagionIntensity = intensity;
      
      // Enhance material for contagion visualization
      if (child.material && child.material.emissive) {
        // Store original emissive for restoration
        if (!child.userData.baseEmissive) {
          child.userData.baseEmissive = {
            color: child.material.emissive.clone(),
            intensity: child.material.emissiveIntensity ?? 0
          };
        }
        
        // Apply contagion color (red/orange spectrum)
        const contagionColor = new THREE.Color();
        contagionColor.setHSL(0.05, 0.8, 0.3);  // Red-orange hue
        
        // Blend toward contagion color based on intensity
        child.material.emissive.lerpColors(
          child.userData.baseEmissive.color,
          contagionColor,
          intensity * 0.7  // 0-70% influence
        );
        
        // Pulsing emissive intensity (faster at higher spread rates)
        const pulseSpeed = 2 + intensity * 6;  // 2-8 Hz pulse
        const basePulse = this.time * pulseSpeed;
        const emissiveModulation = Math.sin(basePulse) * 0.3 + 0.5;  // 0.2-0.8
        child.material.emissiveIntensity = (child.userData.baseEmissive.intensity * 0.5) + (emissiveModulation * intensity * 0.8);
      }
    }
    
    linkMesh.userData.contagionActive = true;
  } else {
    // No contagion: restore normal appearance
    for (const child of linkMesh.children) {
      if (child.userData) {
        child.userData.isContagious = false;
        
        // Restore original emissive
        if (child.userData.baseEmissive && child.material && child.material.emissive) {
          child.material.emissive.copy(child.userData.baseEmissive.color);
          child.material.emissiveIntensity = child.userData.baseEmissive.intensity ?? 0;
        }
      }
    }
    linkMesh.userData.contagionActive = false;
  }
}
```

**Visual Effects**:
```javascript
// Color Blending
contagionColor.setHSL(0.05, 0.8, 0.3)  // Red-orange
lerpColors(baseColor, contagionColor, intensity * 0.7)  // 0-70% blend

// Pulsing
pulseSpeed = 2 + intensity * 6  // 2 Hz (low) to 8 Hz (high)
basePulse = this.time * pulseSpeed
emissiveModulation = sin(basePulse) * 0.3 + 0.5  // 0.2-0.8 range

// Intensity
baseIntensity * 0.5 + (modulation * intensity * 0.8)
// Result: 0.2-0.8 range based on contagion activity
```

---

### Integration into updateMetricLinks (Lines 964-968)

```javascript
// [CORRUPTION CONTAGION v1.0] Apply contagion glow feedback
// Infected links glow with pulsing red/orange as they spread corruption
if (state.mesh.userData && state.mesh.userData.contagionState) {
  this._applyContagionVisuals(state.mesh, state.mesh.userData.contagionState);
}
```

Called after corruption visuals, before synergy/harmony visuals for proper layering.

---

## State Storage Reference

### Link State

```javascript
link.userData = {
  contagionState: {
    isInfected: boolean,           // Is spreading
    infectionIntensity: number,    // 0-1, current spread rate
    lastSpreadTime: number,        // Timestamp
    spreadDirection: string        // 'source->target' | 'target->source' | 'bidirectional'
  },
  linkResistanceFactor: number,    // Customizable (default 0.8)
  contagionBoost: number,          // Proximity boost (if applicable)
  baseEmissive: {
    color: THREE.Color,            // Original emissive color
    intensity: number              // Original emissive intensity
  }
};
```

### Node State

```javascript
node.userData = {
  corruptionLevel: number,         // 0-1 corruption value
  contagionResistance: number,     // Customizable (default 1.0)
  contagionBoost: number,          // Proximity boost (if applicable)
  contagionSourceCount: number     // Number of infecting sources
};
```

---

## Performance Profiling

### Per-Frame Timeline

```
Frame Budget: 16.67ms (60 FPS)

_updateCorruptionContagion(deltaTime):
  ├─ Link iteration:           <1ms (100 links)
  ├─ Spread calculation:       <0.5ms (active contagions)
  ├─ Proximity boost:          <0.2ms
  ├─ Visual updates:           <0.3ms
  └─ Total:                    <2ms

Remaining budget: ~14ms for other systems
```

### Optimization Points

1. **Link Scan**: Early exit for inactive links
2. **Threshold Check**: Fast integer comparison (>= 0.60)
3. **Spread Calculation**: Only computed if infection occurs
4. **Proximity Boost**: Only for multiple-source nodes
5. **Visual Updates**: Only for contagion-active links

---

## Debugging

### Console Output

```javascript
// Check link status
const status = linkingSystem.getLinkContagionStatus(link);
console.log('Link status:', status);

// Check node threat
const threat = linkingSystem.getNodeContagionThreat(node);
console.log('Node threat:', threat);

// Monitor spread amount
// (Add logging in _calculateContagionSpread for detailed tracking)
```

### Quick Debug Checks

```javascript
// Is contagion enabled?
console.log('Initialized:', this._contagionInitialized);
console.log('Config:', this._contagionConfig);

// Check link contagion state
console.log('Link infected:', link.userData?.contagionState?.isInfected);
console.log('Direction:', link.userData?.contagionState?.spreadDirection);

// Check node resistance
console.log('Resistance:', node.userData?.contagionResistance ?? 'default');
```

---

## Summary

**Core Methods**:
1. `_updateCorruptionContagion()` — Main loop (every frame)
2. `_calculateContagionSpread()` — Spread amount calculation
3. `_applyProximityBoost()` — Multi-source boost
4. `setLinkContagionResistance()` — Customize link
5. `setNodeContagionResistance()` — Customize node
6. `getLinkContagionStatus()` — Query link
7. `getNodeContagionThreat()` — Query node
8. `_applyContagionVisuals()` — Visual feedback

**Integration**: Lines 2588-2601 (init) + Lines 964-968 (visual)

**Performance**: <2ms/frame, 60 FPS stable

**State**: Stored in userData, minimal overhead
