# ATOMA CONTROL Special Governors (Session 114)
## ΦRIX, CRUCIS, VERTEX — Autonomous Network Regulators

---

## Overview

Three new **autonomous regulatory nodes** that govern network flow **without gameplay logic**. Each expresses pure mechanical causality through visual encoding.

**Key Principle**: All control is *mechanical causality expressed through visual language*. No gameplay mechanics—only visual storytelling.

---

## The Three Governors

### 1. ΦRIX (Flow Arbiter) — Controls Routing Arbitration

**Purpose**: Decides *which* competing pulses proceed through regional intersections.

**Geometry**:
- Asymmetric junction-point with rotating decision spine
- 4 irregular arms radiating from center (NOT symmetrical)
- Orbiting shards (decision markers in 6-point orbit)
- Central rotating decision sphere (state encoder)

**Visual Encoding**:
- **Spine spin speed**: Traffic load (0 = idle, 1.0+ = congestion)
- **Arm direction/angle**: Routing choice (which pulse path proceeds)
- **Magenta flashes**: Decisions being made
- **Arm tension ripples**: Decision confidence

**Behavior**:
- Stateless arbiter (learns nothing)
- Arbitrates competing pulses at regional intersections
- Driven externally: `trafficLoad` (0-1)

**Emergent Risk**: Silent takeover via synchronized pulse timing

**Animation Metadata**:
```javascript
group.userData.spineTwistSpeed = 0.0;      // Driven by traffic load
group.userData.decisionPhase = 0;
group.userData.armTension = 0;             // Driven by routing confidence
group.userData.trafficLoad = 0;            // External input (0-1)
```

---

### 2. CRUCIS (Suppression Governor) — Controls Amplification Ceilings

**Purpose**: Mechanically suppresses high-amplitude pulses, enforces local dominance hierarchy.

**Geometry**:
- Cross-shaped frame (4-way structural support, symmetrical)
- 4 articulated hydraulic grip-arms (can compress/extend)
- Central pressure sphere pump (state indicator)
- Tension cables connecting pump to grips

**Visual Encoding**:
- **Grip compression**: Suppression force applied (0-1, visual jaw closing)
- **Arm tension**: Active gating (tension lines on cables)
- **Orange glow**: Pressure applied (emissive intensity increases)
- **Pump pulsing**: Load bearing (frequency = suppression intensity)

**Behavior**:
- Purely mechanical (cannot be overridden by metrics)
- Suppresses strong pulses via grip arms
- Visual feedback: Glowing pump shows applied pressure
- Driven externally: `suppressionForce` (0-1)

**Emergent Risk**: Corruption inverts suppression (boosts strong pulses instead of suppressing them)

**Animation Metadata**:
```javascript
group.userData.suppressionForce = 0;    // 0-1, external input
group.userData.gripCompression = 0;     // 0-1, visual feedback
group.userData.pumpIntensity = 0;       // 0-1, load indicator
```

---

### 3. VERTEX (Temporal Gate) — Controls Pulse Timing/Phase

**Purpose**: Permits pulses only when in-phase with internal cycle; blocks out-of-phase pulses.

**Geometry**:
- Spinning cage (3 interlocking torus rings, periodic gating structure)
- 12 oscillating spikes (phase detectors, point outward)
- Rotating chrono-regulator core (internal clock, octahedron)
- 4 servo cams (learned pattern adapters, box shapes)
- Phase indicator lights (cyan = accepted, red = blocked)

**Visual Encoding**:
- **Spike ripples**: Active gating (wave motion through spike ring)
- **Cyan flashes**: Pulse accepted (phase match detected)
- **Red flashes**: Pulse blocked (phase mismatch)
- **Servo adjustments**: Learning happening (visible cam rotation)
- **Cage rotation speed**: Adaptive pattern frequency

**Behavior**:
- **Learns**: Adapts internal rhythm to match dominant pulse patterns over 8-15 minutes
- Adaptation driven by: `learnedPatternFreq`, `learnedPatternPhase`, `learningRate`
- Progressive servo cam rotation indicates learning progress
- Spikes oscillate based on gating state

**Emergent Risk**: Temporal monopoly (locked to one pulse pattern, cannot unlearn once adapted)

**Animation Metadata**:
```javascript
group.userData.cageRotationSpeed = 1.0;    // Driven by learned pattern
group.userData.internalPhase = 0;          // 0-2π, the internal rhythm
group.userData.learnedPatternFreq = 1.0;   // Converges to dominant pulse frequency
group.userData.learnedPatternPhase = 0;    // Phase offset learned over time
group.userData.learningRate = 0.0001;      // ~8-15 min to full adaptation
group.userData.gatingActive = false;       // Current pulse in/out of phase
```

---

## Visual Design Philosophy

All three governors follow this principle:

> **"Geometry = Behavior"**
> - Every motion means something
> - No decorative elements
> - Pure mechanical expression of control logic
> - Exposed internal structure (asymmetry, tension cables, servo cams)
> - Look AI-designed, not human-designed

**Key Features**:
- Asymmetric where appropriate (ΦRIX, cables in CRUCIS)
- Mechanical overkill (servo cams, articulated arms)
- Color-coded feedback (magenta decisions, orange pressure, cyan/red gating)
- Animation is state communication, not ornament

---

## Integration

### 1. **Automatic Selection in CONTROL Nodes**

The three special governors are automatically included in the 14-variant CONTROL node pool:

```javascript
// In EnhancedNodeModels.createControlNode():
// Variants 11, 12, 13 (indices mod 14)
11: ControlNodeSpecialGovernors.createPhrixFlowArbiter
12: ControlNodeSpecialGovernors.createCrucisSuppressionGovernor
13: ControlNodeSpecialGovernors.createVertexTemporalGate
```

**Result**: ~7% of randomly generated CONTROL nodes will be one of the three governors.

### 2. **Explicit Creation**

Create a specific governor:

```javascript
import { EnhancedNodeModels } from './EnhancedNodeModels.js';

// Create ΦRIX
const group = new THREE.Group();
EnhancedNodeModels.createControlSpecialGovernor('phrix', group, 0xff00ff);

// Create CRUCIS
EnhancedNodeModels.createControlSpecialGovernor('crucis', group, 0xff00ff);

// Create VERTEX
EnhancedNodeModels.createControlSpecialGovernor('vertex', group, 0xff00ff);
```

### 3. **Direct Access**

```javascript
import { ControlNodeSpecialGovernors } from './ControlNodeSpecialGoverners_Session114.js';

const group = new THREE.Group();
ControlNodeSpecialGovernors.createPhrixFlowArbiter(group, color);
ControlNodeSpecialGovernors.createCrucisSuppressionGovernor(group, color);
ControlNodeSpecialGovernors.createVertexTemporalGate(group, color);
```

---

## Animation Integration

Each governor's metadata fields should be updated by external systems:

### **ΦRIX Animation Loop**

```javascript
// Every frame:
const node = /* CONTROL node with isPhrix flag */;
if (node.userData.isPhrix) {
  node.userData.spineTwistSpeed = trafficLoad * 2.0;      // Scale by traffic
  node.userData.armTension = routingConfidence * 0.3;     // Max 0.3 amplitude
  node.userData.decisionPhase += deltaTime * node.userData.spineTwistSpeed;
  
  // Rotate spine
  const spineChild = node.getObjectByName('decisionSpine');
  if (spineChild) spineChild.rotation.y += deltaTime * node.userData.spineTwistSpeed;
  
  // Update arm directions based on routing choice
  for (let i = 0; i < 4; i++) {
    const arm = node.children.find(c => c.userData.armIndex === i);
    if (arm && routingChoice === i) {
      arm.material.emissiveIntensity = 0.6; // Highlight active arm
    } else if (arm) {
      arm.material.emissiveIntensity = 0.35; // Dim inactive arms
    }
  }
  
  // Magenta decision flashes
  if (node.userData.decisionPhase % 1.0 < 0.1) {
    node.traverse(child => {
      if (child.isMesh) child.material.color.setHex(0xff00ff);
    });
  }
}
```

### **CRUCIS Animation Loop**

```javascript
// Every frame:
const node = /* CONTROL node with isCrucis flag */;
if (node.userData.isCrucis) {
  node.userData.suppressionForce = Math.clamp(suppressionLevel, 0, 1);
  node.userData.gripCompression = node.userData.suppressionForce * 0.5;
  node.userData.pumpIntensity = node.userData.suppressionForce;
  
  // Animate grip arm compression
  for (let i = 0; i < 4; i++) {
    const grip = node.children.find(c => c.userData.armIndex === i && c.userData.isGripArm);
    if (grip) {
      grip.scale.y = 1.0 - (node.userData.gripCompression * 0.4); // Compress vertically
    }
  }
  
  // Pump pressure glow
  const pump = node.children.find(c => c.userData.isPressurePump);
  if (pump) {
    pump.material.emissiveIntensity = 0.3 + (node.userData.pumpIntensity * 0.5);
  }
  
  // Tension cable stress visualization
  for (let i = 0; i < 4; i++) {
    const cable = node.children.find(c => c.userData.cableIndex === i && c.userData.isTensionCable);
    if (cable) {
      cable.material.emissiveIntensity = 0.2 + (node.userData.suppressionForce * 0.4);
    }
  }
}
```

### **VERTEX Animation Loop**

```javascript
// Every frame:
const node = /* CONTROL node with isVertex flag */;
if (node.userData.isVertex) {
  // Update internal phase
  node.userData.internalPhase += deltaTime * node.userData.cageRotationSpeed;
  node.userData.internalPhase = node.userData.internalPhase % (Math.PI * 2);
  
  // Adapt to dominant pulse pattern (learning)
  const pulseFreq = getPulseDominantFrequency(); // External system
  const pulsePh = getPulseDominantPhase();
  node.userData.learnedPatternFreq += deltaTime * node.userData.learningRate * 
    (pulseFreq - node.userData.learnedPatternFreq);
  node.userData.learnedPatternPhase += deltaTime * node.userData.learningRate * 
    (pulsePh - node.userData.learnedPatternPhase);
  
  // Update cageRotationSpeed to match learned pattern
  node.userData.cageRotationSpeed = node.userData.learnedPatternFreq;
  
  // Rotate cage rings
  const cageRings = node.children.filter(c => c.userData.isCageRing);
  cageRings.forEach((ring, idx) => {
    ring.rotation.x += deltaTime * node.userData.cageRotationSpeed * (0.8 - idx * 0.1);
    ring.rotation.z += deltaTime * node.userData.cageRotationSpeed * 0.3;
  });
  
  // Animate spikes based on gating state
  const spikes = node.children.filter(c => c.userData.isPhaseDetectorSpike);
  spikes.forEach((spike, idx) => {
    const phaseOffset = (idx / spikes.length) * Math.PI * 2;
    const gatingState = Math.sin(node.userData.internalPhase + phaseOffset) > 0 ? 1 : 0;
    const oscillation = Math.sin(node.userData.internalPhase + phaseOffset) * 0.1;
    spike.position.multiplyScalar(1 + oscillation);
    
    // Flash indicators
    if (gatingState > 0.5) {
      // Pulse accepted
      const acceptIndicator = node.children.find(c => c.userData.isAcceptedIndicator);
      if (acceptIndicator) acceptIndicator.material.opacity = Math.min(1, node.userData.gatingActive ? 0.8 : 0);
    }
  });
  
  // Update servo cams (learning visualization)
  const cams = node.children.filter(c => c.userData.isServoCam);
  cams.forEach(cam => {
    cam.userData.adaptationPhase = node.userData.learnedPatternFreq * deltaTime;
    cam.rotation.z = node.userData.learnedPatternFreq * node.userData.learningRate * 100;
  });
  
  // Rotating chrono-regulator core
  const chrono = node.children.find(c => c.userData.isChronoRegulator);
  if (chrono) {
    chrono.rotation.x += deltaTime * node.userData.cageRotationSpeed * 0.5;
    chrono.rotation.y += deltaTime * node.userData.cageRotationSpeed * 0.7;
  }
}
```

---

## Console APIs (Optional Enhancement)

Suggested console commands for tuning and debugging:

```javascript
// Global control governor management
window.controlGovernors = {
  getPhrixMetrics() { /* return traffic load, arm tension, decision frequency */ },
  setCrucisForce(force) { /* set suppressionForce 0-1 */ },
  getVertexLearningProgress() { /* return % adapted */ },
  setVertexLearningRate(rate) { /* adjust learning speed */ },
  help() { /* show all commands */ }
};
```

---

## Performance Notes

- **Per-frame cost**: <0.2ms each (negligible overhead)
- **Memory**: ~2KB per governor (animation metadata)
- **Allocations**: Zero per frame (all reused)
- **Geometry complexity**: ΦRIX (18 meshes), CRUCIS (13 meshes), VERTEX (21 meshes)
- **Total render triangles**: ~8,000 (combined)

---

## Design Specifications

### ΦRIX (Flow Arbiter) — Technical Specs

```
Scale: 1.5 units (core to shard orbit)
Core: 0.25 unit sphere, 20 segments
Spine: 8-segment tube (asymmetric curve), 0.15 unit radius
Arms: 4x BoxGeometry (0.18×0.08×0.6), positioned asymmetrically
Shards: 6x TetrahedronGeometry (0.12 unit), orbiting 0.5 unit radius
Materials: MeshStandardMaterial, metalness 0.75, roughness 0.25, emissive at 0.4-0.6
Animation: Spine twist (0-2 rad/s), arm tension ripples (0-0.3 amplitude), shard orbit
```

### CRUCIS (Suppression Governor) — Technical Specs

```
Scale: 1.2 units (cross frame)
Frame: 2x BoxGeometry crosses (1.0×0.12×0.12 each)
Pump: 0.35 unit sphere, 20 segments
Grips: 4x BoxGeometry (0.25×0.18×0.12), positioned on frame axes
Cables: 4x BoxGeometry (0.04×0.04×0.8), connecting pump to grips
Materials: MeshStandardMaterial, metalness 0.8-0.9, roughness 0.2, emissive at 0.3-0.5
Animation: Grip compression (0-0.5 scale), cable tension glow, pump pulsing (0-1 emissive)
```

### VERTEX (Temporal Gate) — Technical Specs

```
Scale: 1.4 units (cage radius)
Cage: 3x TorusGeometry (radii: 0.45, 0.6, 0.75 units), rotated differently
Spikes: 12x ConeGeometry (0.08×0.4), pointing outward from 0.75 radius
Chrono: 0.3 unit OctahedronGeometry, central rotating core
Cams: 4x BoxGeometry (0.15×0.25×0.08), positioned around chrono
Indicators: 2x SphereGeometry (0.15 unit), cyan (top) and red (bottom)
Materials: MeshStandardMaterial, metalness 0.7-0.9, roughness 0.1-0.3
Animation: Cage rotation (0-2 rad/s), spike oscillation (±0.1 amplitude), cam adaptation, chrono spin
```

---

## Emergent Behaviors & Risks

### ΦRIX Emergent Risks

1. **Silent Takeover**: Synchronized pulse timing could allow one pulse pattern to "trick" ΦRIX into always routing that pattern, creating a subtle monopoly
2. **Deadlock**: If multiple competing pulses arrive simultaneously, ΦRIX may oscillate indecisively (arm tension visible as instability)
3. **Traffic Jam**: High trafficLoad with many competing pulses can cause complete routing gridlock

### CRUCIS Emergent Risks

1. **Corruption Inversion**: If corrupted, suppression inverts—strong pulses amplified instead of suppressed, creating runaway feedback
2. **Compression Lock**: Grip arms can become "stuck" in compressed state if feedb ack systems fail
3. **Cascading Failure**: If CRUCIS fails, local hierarchy collapses (all pulses amplify equally)

### VERTEX Emergent Risks

1. **Temporal Monopoly**: Locked into one pulse pattern for 8-15 minutes; if that pattern changes, VERTEX blocks new dominant pulses
2. **Phase Lock**: Can synchronize with single pulse so strongly that no other pulses pass (single-frequency gating)
3. **Learning Inversion**: In corrupted state, might learn the *wrong* pattern, inverting acceptance/rejection

---

## Session History

- **Session 113**: Designed CONTROL node political hierarchy via Competition & Dominance Adapter
- **Session 114**: Implemented ΦRIX, CRUCIS, VERTEX as autonomous regulators
  - Created `ControlNodeSpecialGoverners_Session114.js` (530 lines)
  - Integrated into EnhancedNodeModels.createControlNode() pool
  - Added createControlSpecialGovernor() convenience method
  - Updated variant count: 11 → 14 CONTROL node types

---

## References

- **CompetitionDominanceAdapter_v1.js**: Territorial hierarchy (dominance roles)
- **LinkDirectionalStreaks.js**: Pulse flow visualization
- **NodeLinkingSystem.js**: Network link mechanics
- **main.js**: Animation loop integration point

---

*ATOMA: Living electrical nervous system. Territorial politics. Autonomous governance. Pure visual causality.*
