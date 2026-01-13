# Cascading Rupture & Critical Node Failure Systems

## Overview

Two interconnected systems that model network collapse propagation and node failure with controlled link severing.

**Philosophy**: *Ruptures cascade along structural weakness. Nodes under critical stress disconnect. The network remembers where it broke.*

---

## Architecture

### 1. Cascading Rupture System (Visual + Adaptive)
**File**: `CascadingRuptureSystem.js`  
**Type**: Hybrid (read-only detection + visual propagation)

**What it does**:
- Detects rupture cascade conditions across network regions
- Propagates visual rupture energy along existing topology
- Triggers critical node failure events when energy is sufficient
- Tracks rupture and healing history for probability scaling

**Visual language**:
- Spatial tearing along links
- Rapid phase destabilization at nodes
- Sudden coherence loss in affected regions
- Clean propagation (no explosions)

**Trigger conditions**:
- High corruption (> 60%)
- Low stability (< 40%)
- Unresolved standing waves
- Recent rupture history
- Lack of healing

**Propagation mechanics**:
- Follows network topology (not random)
- Energy decays 35% per hop
- Max depth: 3 hops
- Stops when energy < 10%
- 150ms delay between hops

---

### 2. Critical Node Failure System (Mechanical)
**File**: `CriticalNodeFailureSystem.js`  
**Type**: Mechanical (actual network mutation)

**What it does**:
- Detects nodes approaching critical failure
- Initiates 3-second countdown with visual stress indicators
- Severs ALL connected links simultaneously after countdown
- Marks nodes as isolated with visual state changes
- Allows slow recovery attempts (cap at 50% stability)

**Failure conditions** (ALL must be true):
- Node stability ≤ 20%
- Node corruption ≥ 75%
- Node NOT currently healing
- Node has active links

**Countdown visuals**:
- Stress pulse at 4Hz
- Link strain oscillation at 6Hz
- Intensity scales with remaining time

**Sever visuals**:
- Clean snap (300ms)
- Endpoint recoil (500ms, 2 units distance)
- Lingering scar (5s with 2s fade)
- No particle spam

**Post-failure state**:
- Aura collapsed to 30%
- Core dimmed to 40%
- Node marked as ISOLATED
- No automatic reconnection
- Recovery delay: 10 seconds
- Recovery rate: 2% stability/second (caps at 50%)

---

## Integration

### Event Flow

```
[High Stress Conditions]
         ↓
[Cascading Rupture Detects Opportunity]
         ↓
[Cascade Propagates Along Topology]
         ↓
[Cascade Energy Reaches Critical Node]
         ↓
[CascadeSystem.onNodeCritical() fires]
         ↓
[Critical Node Failure Starts Countdown]
         ↓
[3 seconds of visual stress indicators]
         ↓
[ALL links sever simultaneously]
         ↓
[Node enters ISOLATED state]
         ↓
[FailureSystem.onLinksSevered() fires]
         ↓
[Cascade system records event]
```

### Wiring in main.js

```javascript
// Cascade triggers node failure
this.cascadingRuptures.onNodeCritical = (node) => {
    if (this.criticalNodeFailure && this.criticalNodeFailure.enabled) {
        this.criticalNodeFailure.markNodeApproachingCritical(node);
    }
};

// Failure records events back to cascade
this.criticalNodeFailure.onLinksSevered = (node, linkIds) => {
    if (this.cascadingRuptures && this.cascadingRuptures.enabled) {
        console.log(`Node failure: ${linkIds.length} links severed`);
    }
};
```

---

## Safety & Control

### Default State: DISABLED
Both systems are disabled by default for safety. Network cannot collapse unless explicitly enabled.

### Enable/Disable

**Via Console**:
```javascript
// Enable both systems
game.enableBothCascadeSystems();

// Enable individually
game.enableCascades();
game.enableNodeFailure();

// Disable
game.disableBothCascadeSystems();

// Status
game.cascadeStatus();
```

**Direct API**:
```javascript
game.cascadingRuptures.enable();
game.cascadingRuptures.disable();

game.criticalNodeFailure.enable();
game.criticalNodeFailure.disable();
```

### Infinite Loop Prevention

- **Max cascade depth**: 3 hops hard limit
- **Energy decay**: 35% per hop ensures termination
- **Visited node tracking**: Prevents revisiting nodes
- **Energy threshold**: Stops when energy < 10%
- **Max simultaneous cascades**: 8 (prevents cascade spam)
- **Max simultaneous failures**: 4 (prevents failure spam)

---

## Configuration

### CascadingRuptureSystem

**Thresholds**:
```javascript
CORRUPTION_THRESHOLD: 0.6      // Region corruption must exceed 60%
STABILITY_THRESHOLD: 0.4       // Avg stability must be below 40%
STANDING_WAVE_THRESHOLD: 0.3   // Unresolved wave energy > 30%
```

**Probability**:
```javascript
BASE_CASCADE_CHANCE: 0.15       // 15% base chance
CORRUPTION_WEIGHT: 0.5          // +50% per unit corruption
RUPTURE_HISTORY_WEIGHT: 0.3     // +30% per recent rupture
HEALING_DEFICIT_WEIGHT: 0.4     // +40% if no recent healing
```

**Propagation**:
```javascript
MAX_CASCADE_DEPTH: 3            // Max 3 hops from origin
ENERGY_DECAY_PER_HOP: 0.35      // 35% energy loss per hop
MIN_PROPAGATION_ENERGY: 0.1     // Stop below 10% energy
PROPAGATION_DELAY: 0.15         // 150ms between hops
```

### CriticalNodeFailureSystem

**Failure Thresholds**:
```javascript
STABILITY_CRITICAL: 0.2         // Node stability <= 20%
CORRUPTION_CRITICAL: 0.75       // Node corruption >= 75%
```

**Countdown**:
```javascript
FAILURE_COUNTDOWN_DURATION: 3.0 // 3 second warning
STRESS_PULSE_FREQUENCY: 4.0     // 4Hz stress pulse
LINK_STRAIN_INTENSITY: 0.8      // 80% strain intensity
```

**Post-Failure**:
```javascript
ISOLATED_AURA_SCALE: 0.3        // Aura collapses to 30%
ISOLATED_CORE_BRIGHTNESS: 0.4   // Core dims to 40%
RECOVERY_ATTEMPT_DELAY: 10.0    // 10s before recovery
RECOVERY_ATTEMPT_RATE: 0.02     // 2% stability/second
```

---

## Performance

### Optimizations

1. **Pooled resources**:
   - 8 cascade propagation slots (reused)
   - 32 visual effect slots (reused)
   - 4 failure state slots (reused)
   - 16 sever visual slots (reused)

2. **Coarse timestep detection**:
   - Cascade detection: 500ms interval
   - Failure detection: 250ms interval
   - Not every frame

3. **No per-frame allocations**:
   - All arrays pre-allocated
   - Effects pooled and reset
   - No dynamic object creation in hot path

4. **Graceful degradation**:
   - Max limits prevent spam
   - Systems log warnings but don't crash
   - Disabled state has zero overhead

---

## Testing & Debugging

### Console Commands

```javascript
// Show help
game.cascadeHelp();

// Check status
game.cascadeStatus();

// List critical nodes
game.listCriticalNodes();

// Manually trigger cascade (testing)
game.triggerCascade(nodeIndex);
```

### Visual Debugging

Watch for:
- Node userData flags: `failureCountdown`, `isolated`, `approachingCritical`
- Link userData flags: `severed`, `visualStrain`, `visualTear`
- Console logs: `[CascadingRuptureSystem]`, `[CriticalNodeFailureSystem]`

### Expected Behavior

**When cascades enabled**:
- Periodic detection checks (every 500ms)
- Occasional cascades in high-corruption regions
- Visual propagation along links
- Energy decay clearly visible

**When failures enabled**:
- Critical nodes enter countdown
- Stress visuals intensify over 3 seconds
- Links snap cleanly (no explosion)
- Node enters isolated state
- No automatic reconnection

---

## Visual Systems Integration

### userData Flags

The systems write visual flags to node/link userData for visual systems to read:

**Node**:
- `node.userData.failureCountdown` (boolean)
- `node.userData.countdownRemaining` (number, seconds)
- `node.userData.stressVisualIntensity` (number, 0-2)
- `node.userData.isolated` (boolean)
- `node.userData.auraScale` (number, 0-1)
- `node.userData.coreBrightness` (number, 0-1)
- `node.userData.approachingCritical` (boolean)
- `node.userData.visualDestabilization` (number)

**Link**:
- `link.userData.visualStrain` (number, 0-0.8)
- `link.userData.visualTear` (number)
- `link.userData.visualCoherenceLoss` (number, 0-1)
- `link.userData.severed` (boolean)
- `link.userData.severTime` (timestamp)

Visual systems should read these flags and respond appropriately.

---

## Future Extensions

Potential enhancements:

1. **Cascade visualization renderer**: Dedicated shader for rupture propagation
2. **Sever scar persistence**: Long-term visual memory of severed connections
3. **Regional collapse metrics**: Track cascade frequency per region
4. **Healing integration**: Cascades can be prevented by active healing
5. **Audio feedback**: Sound design for countdown/sever events
6. **Particle effects**: Subtle particles during cascade propagation (not spam)

---

## Philosophy

*"Cascades feel like systemic collapse — not chaos, but consequence. Nodes that lose stability do not explode. They disconnect. The network remembers where it broke."*

These systems embody inevitable failure under sustained stress. They are not punishment mechanics, but natural consequences of unresolved corruption. The visual language is clean, deliberate, and memorable. No explosions. No spam. Just quiet disconnection and lingering scars.
