# HARMONIC COGNITION STACK — QUICK REFERENCE

**Purpose**: Fast lookup for system values, console commands, and behavior  
**For**: Developers, QA, Technical Support

---

## SYSTEMS AT A GLANCE

### 1. Harmonic Resonance Feedback System
**File**: `HarmonicResonanceFeedbackSystem.js`  
**What it does**: Composite glyphs emit resonance fields that gently influence nearby link motion  
**Update frequency**: 30 Hz throttled  
**Pool size**: 20 resonance fields  
**CPU cost**: <0.3ms per frame  

**Key values** (polished):
- Field radius: 3.5 units (min 2.0, max 6.0)
- Phase influence strength: 22% base
- Ramp-up duration: 1.5 seconds
- Decay duration: 2.0 seconds

**Console**:
```javascript
game.harmonicResonance.enabled = true/false
game.harmonicResonance.getStatus()
```

---

### 2. Resonance Echo Trail System
**File**: `ResonanceEchoTrailSystem.js`  
**What it does**: Composite glyphs leave stationary harmonic afterimages that fade  
**Update frequency**: 30 Hz throttled  
**Pool size**: 30 echo instances  
**CPU cost**: <0.2ms per frame  

**Key values** (polished):
- Spawn interval: 0.2 seconds
- Base lifetime: 1.4 seconds (range 0.8-2.8s)
- Starting opacity: 32%
- Fade curve: cubic ease-out
- Color: Warm neutral (0xc8c8c8)

**Console**:
```javascript
game.resonanceEchoTrails.enabled = true/false
game.resonanceEchoTrails.getStatus()
```

---

### 3. Harmonic Topology Learning System
**File**: `HarmonicTopologyLearningSystem.js`  
**What it does**: Visualizes long-term network learning through topology evolution  
**Update frequency**: 6 second intervals  
**Pool size**: 50 topology regions (sparse grid)  
**CPU cost**: <0.4ms per frame  

**Key values** (polished):
- Learning window: 5 minutes history
- Flow bias strength: 25% base
- Max reinforcement: 70%
- Scar formation: slower, faster healing
- Hub maturation: 60 seconds to mature

**Console**:
```javascript
game.harmonicTopology.enabled = true/false
game.harmonicTopology.getStatus()
```

---

### 4. Topology Bias Visualization Layer
**File**: `TopologyBiasVisualizationLayer.js`  
**What it does**: Renders topology bias vectors and flow fields as dedicated visual layer  
**Update frequency**: 5 Hz vectors, shader-based flow  
**Pool size**: 256 bias vectors, 64 flow cells max  
**CPU cost**: <0.2ms per frame  

**Key values** (polished):
- Vector opacity: 9%
- Vector length: 1.8 units
- Flow field opacity: 6%
- Vector breathing: 0.6 Hz
- Influence boost: 1.6x (temporal)

**Console**:
```javascript
game.topologyViz.enabled = true/false
game.toggleTopologyBiasVisualization()
game.toggleTopologyBiasVectorsDebug()
game.toggleTopologyFlowFieldsDebug()
game.topologyBiasVisualizationStatus()
```

---

## CONSOLE QUICK COMMANDS

### System Status Check
```javascript
// Full system status
game.harmonicResonance.getStatus()
game.resonanceEchoTrails.getStatus()
game.harmonicTopology.getStatus()
game.topologyBiasVisualizationStatus()

// Combined check
console.log({
    resonance: game.harmonicResonance.getStatus(),
    echoes: game.resonanceEchoTrails.getStatus(),
    topology: game.harmonicTopology.getStatus(),
    viz: game.topologyBiasVisualizationStatus()
})
```

### Enable/Disable Individual Systems
```javascript
// Resonance Feedback
game.harmonicResonance.enabled = false
game.harmonicResonance.enabled = true

// Echo Trails
game.resonanceEchoTrails.enabled = false
game.resonanceEchoTrails.enabled = true

// Topology Learning
game.harmonicTopology.enabled = false
game.harmonicTopology.enabled = true

// Topology Visualization
game.topologyViz.enabled = false
game.topologyViz.enabled = true

// Or use master toggle
game.toggleTopologyBiasVisualization()
```

### Debug Visualization
```javascript
// Show topology bias vectors (cyan lines)
game.toggleTopologyBiasVectorsDebug()

// Show topology flow fields (blue grid)
game.toggleTopologyFlowFieldsDebug()

// Reset all debug modes
game.topologyViz.debugBiasVectors = false
game.topologyViz.debugFlowFields = false
```

### Emergency Disable All Harmonics
```javascript
// If systems causing problems:
game.harmonicResonance.enabled = false
game.resonanceEchoTrails.enabled = false
game.harmonicTopology.enabled = false
game.topologyViz.enabled = false
console.log('All harmonic systems disabled')
```

---

## PERFORMANCE TARGETS

| System | CPU/Frame | Memory | Notes |
|--------|-----------|--------|-------|
| Resonance | <0.3ms | 6KB | 20 fields pooled |
| Echoes | <0.2ms | 8KB | 30 echoes pooled |
| Topology Learning | <0.4ms | 12KB | 50 regions pooled |
| Topology Visualization | <0.2ms | 4KB | 256 vectors + 64 cells |
| **TOTAL** | **<1.1ms** | **30KB** | **All systems combined** |

**Target**: 60 FPS (16.67ms per frame)  
**Harmonic budget**: 1.1ms leaves 15.57ms for other systems ✓

---

## VISUAL HIERARCHY (Depth Order)

```
Foreground (renderOrder > 5):
  - Links (gameplay elements)
  - Composite glyphs
  - Pictograms

Mid-ground (renderOrder = 4):
  - Echo trails (32% opacity)
  - Resonance influence (subtle)

Background (renderOrder < 0):
  - Topology vectors (renderOrder = -5, 9% opacity)
  - Flow fields (shader, 6% opacity)
```

**Z-fighting prevention**: All background elements have `depthWrite = false`

---

## CONFIG VALUE RANGES (Conservative Polished Ranges)

### Opacity (Visibility)
- Links: 100% (gameplay)
- Glyphs: 100% (gameplay)
- Echo trails: 32% max (mid-ground)
- Resonance fields: 22% influence (subtle)
- Topology vectors: 9% (background)
- Flow fields: 6% (background)

### Temporal (Timescales)
- Fast (motion): 0.4-0.6 Hz
- Medium (synthesis): 1.5-2.0s ramps
- Slow (topology): 5-6 second intervals

### Spatial (Influence)
- Resonance radius: 3.5 units base (2-6 range)
- Echo spacing: Low frequency (0.2s intervals)
- Topology reach: 8 unit influence range

---

## TROUBLESHOOTING

### Issue: Systems Not Initializing
```javascript
// Check console for boot messages
// Should see 4 lines:
// [HarmonicResonanceFeedbackSystem] Initialized
// [ResonanceEchoTrailSystem] Initialized
// [HarmonicTopologyLearningSystem] Initialized
// [TopologyBiasVisualizationLayer] initialized ✓

// If missing, check:
1. All imports in main.js
2. setupTopologyBiasVisualization() called at line 1493
3. No import errors in console
```

### Issue: High CPU Usage
```javascript
// Check each system's performance
game.harmonicResonance.getStatus()      // Should show <0.3ms typical
game.resonanceEchoTrails.getStatus()     // Should show <0.2ms typical
game.harmonicTopology.getStatus()        // Should show <0.4ms typical
game.topologyBiasVisualizationStatus()   // Should show <0.2ms typical

// If any >1.5x expected: disable that system and investigate
game.harmonicResonance.enabled = false
// Repeat for others
```

### Issue: Visual Artifacts
```javascript
// Check depth ordering
// Echo trails should NOT occlude links
// Vectors should be in background only
// If seeing z-fighting, verify:
game.topologyViz.debugBiasVectors = false
game.topologyViz.debugFlowFields = false

// Try re-enabling systems in order
game.harmonicResonance.enabled = true
game.resonanceEchoTrails.enabled = true
game.harmonicTopology.enabled = true
game.topologyViz.enabled = true
```

### Issue: Memory Growth
```javascript
// Check if systems are leaking memory
// Monitor over 30 seconds
memory_start = performance.memory.usedJSHeapSize
// Wait 30 seconds
memory_end = performance.memory.usedJSHeapSize
memory_delta = memory_end - memory_start

// Should be <5MB growth over 30s
// If >10MB growth: check for array allocation in hot loop
```

---

## STATE VARIABLES (Network Metrics)

These values from `nodeDynamicMetrics` affect harmonic visuals:

| Metric | Range | Effect |
|--------|-------|--------|
| `avgHarmony` | 0-1 | Expands resonance, extends echoes |
| `avgCorruption` | 0-1 | Shrinks resonance, shortens echoes |
| `avgSynergy` | 0-1+ | Improves clarity, speeds alignment |
| `avgInstability` | 0-1 | Weakens resonance, reduces echoes |

**Example**: High harmony + low corruption = strong resonance fields, long echo persistence

---

## ADAPTIVE BEHAVIOR

### Under Harmony (harmony > 0.6)
- ✓ Resonance fields expand (+35%)
- ✓ Echo trails persist longer (+50%)
- ✓ Topology vectors clarify (+30%)
- ✓ Phase alignment strengthens (+30%)

### Under Corruption (corruption > 0.4)
- ✓ Resonance fields shrink (-40%)
- ✓ Echo trails fade faster (-30%)
- ✓ Topology vectors blur (-40%)
- ✓ Phase alignment weakens (-50%)

### Under High Synergy (synergy > 0.7)
- ✓ All systems improve clarity (+15%)
- ✓ Topology learning accelerates
- ✓ Hub maturation speeds up

### Under Instability (instability > 0.6)
- ✓ All systems reduce scale (-30%)
- ✓ Echo spawn rate decreases (-40%)
- ✓ Topology becomes uncertain

---

## CONSOLE OUTPUT EXAMPLES

### Resonance Status
```
{
  enabled: true,
  activeFields: 3,
  poolCapacity: 20,
  averageFieldStrength: 0.65,
  influencedLinks: 8
}
```

### Echo Status
```
{
  enabled: true,
  activeEchoes: 7,
  poolCapacity: 30,
  averageEchoLifetime: 1.32,
  trackedComposites: 2
}
```

### Topology Status
```
{
  enabled: true,
  activeRegions: 12,
  totalLearningEvents: 247,
  averageFlowStrength: 0.42,
  maturedHubs: 3
}
```

### Topology Visualization Status
```
{
  enabled: true,
  biasVectorsDebug: false,
  flowFieldsDebug: false,
  activeBiasVectors: 18,
  activeFlowCells: 8,
  recentInfluenceCount: 2
}
```

---

## DOCUMENTATION REFERENCES

- **Complete Polish Details**: `/HARMONIC_COGNITION_POLISH_SUMMARY.md`
- **Verification Tests**: `/POLISH_VERIFICATION_GUIDE.md`
- **Deployment Checklist**: `/HARMONIC_DEPLOYMENT_CHECKLIST.md`
- **Session Overview**: `/SESSION_140_FINAL_OVERVIEW.md`

---

**Last Updated**: Final Polish Pass  
**Next Review**: Post-launch monitoring (48 hours)
