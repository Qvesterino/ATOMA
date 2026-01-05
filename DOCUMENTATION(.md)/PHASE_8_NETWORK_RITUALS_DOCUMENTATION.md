# Phase 8: Network Rituals System — Complete Technical Documentation

## Overview

**Phase 8: Network Rituals** introduces a sophisticated cooperative mass reconstruction mechanic that enables groups of nodes to synchronize and collectively restore large network segments through coordinated rituals.

### Core Innovation

Instead of individual link rebuilding (Phase 6), Phase 8 enables:
- **Cooperative Participation**: Multiple nodes pool resources for group-level reconstruction
- **Emergent Complexity**: Rituals progress through 3 distinct stages with emergent behaviors
- **Loyalty Economics**: Repeat participants gain cumulative bonuses, encouraging long-term engagement
- **Cascading Effects**: Successful rituals trigger chain reactions of link reconstruction in adjacent clusters

---

## Mechanics Summary

### 1. Ritual Initiation

**Trigger**: Player declares ritual on network cluster (3+ linked nodes)

```javascript
// Example: Initiate ritual with epicenter node and 2 participants
const result = networkRituals.initiateRitual(
  epicenterNode,           // Central coordinating node
  [participant1, participant2]  // Additional participants
);
```

**Requirements**:
- Minimum 2 participants (epicenter + 1 other = 2 total minimum, or epicenter + 2+ = 3+ cluster)
- Each participant must have ≥ 0.15 harmony available
- Cluster must contain ≥ 3 links (to justify mass reconstruction)
- No active cooldown on cluster (45 second cooldown between rituals on same cluster)

**Costs at Initiation**:
- **Harmony**: -0.15 per participant (base cost, can be escalated)
- **Synergy**: Not consumed initially; pooled during CHANNELING phase

### 2. Three-Stage Progression

#### Stage 1: CHANNELING (8 seconds)
**Purpose**: Gathering initial resonance from participants

- Ritual epicenter pulses with base resonance frequency (2-3.5 Hz)
- Connections to participants brighten and synchronize
- Participants can still join during this phase (adding +0.15 harmony cost each)
- **Visual**: Blue-tinted glow spreading from epicenter

**Exit Condition**: 8 seconds elapsed → automatic transition to RESONANCE

#### Stage 2: RESONANCE (12 seconds)
**Purpose**: Participants synchronize their resources and states

- Synergy pool begins forming (8 synergy per participant)
- Link corruption assessment across cluster (identifying targets for reconstruction)
- Late joiners can still add (+0.15 harmony per late joiner)
- **Visual**: Links brighten in sync with epicenter pulse, faint wave patterns emerge

**Exit Condition**: 12 seconds elapsed → automatic transition to RESOLUTION

#### Stage 3: RESOLUTION (4 seconds)
**Purpose**: Execute cascading link reconstruction

- Synergy pool consumed for cascade reconstruction (across radius 2 hops)
- Each link in cluster gets reconstruction attempt (priority: highest corruption first)
- Success depends on available synergy and link state
- **Visual**: Golden cascade expanding from epicenter through connected links

**Exit Condition**: 4 seconds elapsed or all reconstructions complete → COMPLETE or FAILED

### 3. Resource Economics

#### Base Costs
```
Harmony Cost per Participant: 0.15 (vs 0.1 for single barrier)
Synergy Contribution per Participant: 8 synergy units
```

#### Escalation Mechanic
- Each ritual on same cluster increases next ritual's cost by 12%
- Purpose: Prevents spam rituals on same cluster
- Example: 2nd ritual = 112% cost, 3rd = 125.4% cost

#### Loyalty Bonuses
- Repeat participants get -3% harmony cost per ritual (cumulative, max -25%)
- Example: After 3 rituals, 5th ritual costs 91% of base
- Bonus applied automatically at ritual initialization

#### Global Anti-Spam
- Maximum 3 rituals per 120 seconds (network-wide)
- Tracked by `recentRituals` array in NetworkRituals instance
- Prevents cascade spam while allowing strategic sequencing

### 4. Failure Mechanics

**Ritual Fails If**:
- Cluster has no valid links remaining
- Synergy pool falls below 20 (insufficient for reconstruction)
- Total ritual duration exceeds 24 seconds
- No links successfully reconstructed during RESOLUTION

**Resource Loss on Failure**:
- Consume 60% of pooled synergy immediately
- Remaining 40% becomes "failed ritual residue" (can be claimed by victor or recovered)
- Participants cannot initiate new rituals on same cluster for 30 seconds (failure cooldown)

**Failure Events**:
```
RITUAL_FAILED event logged with:
- ritualId
- failureReason (string)
- synergyLost (60% of pool)
```

### 5. Cascade Reconstruction

**Cascade Radius**: 2 hops from ritual epicenter

**Cost Scaling**:
- Cascade reconstructions cost 50% of normal reconstruction synergy
- Example: Normal link rebuild = 5 synergy, cascade = 2.5 synergy

**Success Criteria**:
- Reconstructed link must achieve ≥85% integrity to count as "successful"
- Failed cascade attempts consume synergy without healing link

**Cascade Targets** (priority order):
1. Links in direct ritual cluster (lowest corruption first)
2. Adjacent links (1 hop away)
3. Further links (2 hops away)

---

## Integration Points

### LinkCorruptionTransmission_v1

NetworkRituals depends on corruption system for:
- `getLinkState(linkId)`: Get corruption/integrity data
- `rebuildLink(linkId, sourceNode, options)`: Attempt reconstruction
- `getAllLinks()`: Get network topology
- `collapsedLinks`: Map tracking destroyed links

### ArchetypeGameplayEffects_v1

Archetype modifiers affect ritual success rates:
- **Sigma/Prime**: +10% reconstruction success
- **Chaos/Error**: -10% reconstruction success
- **Quantum**: ±20% synergy available (random)

### CorruptionVisualFX_v1

Ritual reuses existing VFX systems:
- Healing cascade shader for RESOLUTION phase
- Particle bursts for successful link reconstruction
- Wave animation shader for resonance linking

### ComputeSynergyScore_v1

Synergy calculation determines:
- Link eligibility for reconstruction (must meet threshold)
- Participant pool contribution (affects ritual power)
- Cascade depth penetration (higher synergy = deeper cascades)

### AINodes.js

AI nodes can automatically participate in rituals:
- Join threshold: When cluster ritual declared and node has >80% uptime
- Automatic contributions: Add 8 synergy when joining
- Participation risk: AI nodes gain loyalty slower than players (0.5x multiplier)

---

## API Reference

### Initialization

```javascript
const rituals = new NetworkRituals(corruptionSystem, gameplaySystem);
```

### Core Methods

#### `initiateRitual(epicenterNode, participants)`
Declares a new ritual on network cluster.

```javascript
const result = rituals.initiateRitual(node1, [node2, node3]);

// Returns:
{
  success: true,
  ritualId: "ritual_1_1704000000000",
  stage: "channeling",
  participantCount: 3,
  harmonyPool: 0.45,              // Total harmony cost
  synergyPool: 24,                 // Total synergy pooled
  estimatedDuration: 24000,        // 24 seconds
  costs: {
    totalHarmonyCost: 0.45,
    escalationMultiplier: 1.0
  }
}
```

#### `addParticipant(ritualId, newParticipant)`
Add participant during CHANNELING or RESONANCE phase.

```javascript
const result = rituals.addParticipant(ritualId, node4);

// Returns:
{
  success: true,
  newParticipantCount: 4,
  synergyContribution: 8
}
```

#### `updateRituals(deltaTime)`
Call every frame or fixed interval to progress rituals.

```javascript
// In main game loop
rituals.updateRituals(16);  // 16ms frame time
```

#### `getRitualStatus(ritualId)`
Get real-time ritual progress.

```javascript
const status = rituals.getRitualStatus(ritualId);

// Returns:
{
  success: true,
  stage: "resonance",
  progress: 0.65,              // 0-1, stage completion
  timeElapsed: 8000,
  timeRemaining: 16000,
  participantCount: 3,
  pooledResources: {
    harmony: "0.45",
    synergy: "24"
  },
  resonanceFrequency: "2.45"   // Hz visual pulsing
}
```

#### `cancelRitual(ritualId)`
Cancel ritual before completion, recover 80% harmony.

```javascript
const result = rituals.cancelRitual(ritualId);

// Returns:
{
  success: true,
  refunded: {
    harmony: "0.36",           // 80% of 0.45
    perParticipant: "0.12"
  }
}
```

#### `getParticipantStats(nodeId)`
Get loyalty and engagement metrics for node.

```javascript
const stats = rituals.getParticipantStats(nodeId);

// Returns:
{
  success: true,
  ritualsCompleted: 5,
  totalResourcesContributed: "0.75",
  currentLoyaltyDiscount: "15%",
  nextRitualCostReduction: "18%"
}
```

#### `getNetworkRitualStats()`
Get network-wide ritual statistics.

```javascript
const stats = rituals.getNetworkRitualStats();

// Returns:
{
  success: true,
  activeRituals: 2,
  recentRitualsInPeriod: 2,
  maxAllowedPerPeriod: 3,
  totalReconstructions: 47,
  totalParticipations: 156,
  loyaltyNetworks: 23
}
```

---

## Configuration Constants

### Core Settings (in RITUAL_CONFIG)

```javascript
ENABLED: true,                              // Master enable/disable

// Base economics
BASE_HARMONY_COST_PER_PARTICIPANT: 0.15,
BASE_SYNERGY_CONTRIBUTION: 8,

// Escalation
ESCALATION_MULTIPLIER_PER_RITUAL: 0.12,    // +12% per ritual on cluster

// Loyalty
LOYALTY_DISCOUNT_PER_RITUAL: 0.03,         // -3% per participation
MAX_LOYALTY_DISCOUNT: 0.25,                // Max -25%

// Timing (all in milliseconds)
RITUAL_STAGE_DURATION_MS: {
  CHANNELING: 8000,                        // 8 seconds
  RESONANCE: 12000,                        // 12 seconds
  RESOLUTION: 4000                         // 4 seconds
},
TOTAL_RITUAL_DURATION_MS: 24000,           // 24 seconds total

// Rate limiting
MAX_RITUALS_PER_PERIOD: 3,                 // Max 3 rituals...
RITUAL_PERIOD_MS: 120000,                  // ...per 120 seconds

// Failure
FAILURE_RESOURCE_LOSS: 0.60,               // Lose 60% on failure
MINIMUM_PARTICIPANTS: 2,

// Cascade
CASCADE_RADIUS_HOPS: 2,
SECONDARY_REBUILD_COST_MULTIPLIER: 0.5,   // 50% cost for cascade
CASCADE_RECONSTRUCTION_THRESHOLD: 0.85     // Min 85% integrity
```

---

## Gameplay Flow Example

### Scenario: Phase 8 Ritual on High-Corruption Cluster

```
T=0s: Player declares ritual on cluster (5 interconnected nodes)
      - Epicenter: Node A (0.5 harmony available)
      - Participants: Node B, C, D (each has 0.2 harmony)
      - Cluster has 8 links, 3 with >0.7 corruption

      → Costs: 0.15 × 3 = 0.45 harmony total
      → Synergy pool: 8 × 3 = 24 synergy
      → All resources deducted immediately

T=0-8s: CHANNELING phase
        - Epicenter pulses with 2.3 Hz frequency
        - Connections brighten in blue tones
        - Node E requests to join (+0.15 harmony cost)

        → New participant count: 4
        → New synergy pool: 32
        → New harmony cost: 0.60 total (participant E pays 0.15)

T=8-20s: RESONANCE phase
         - All 4 participants synchronized
         - Network scans for reconstruction targets
         - Identifies 7 links as candidates (corruption > 0.5)

T=20-24s: RESOLUTION phase
          - Synergy spent: ~1 per link for base reconstruction
          - Successful on 6 of 7 links
          - Cascade triggered to adjacent cluster (1 hop away)
          - 3 additional links healed via cascade (50% synergy cost)

T=24s: COMPLETE
       - Ritual succeeds
       - 9 total links reconstructed
       - Loyalty +1 for nodes A-E
       - Node A and B each get -3% discount on next ritual
       - Cluster enters 45-second cooldown

RESOURCES CONSUMED:
- Harmony: 0.60 (from participants)
- Synergy: ~15 of 32 (remaining 17 unused)
- Time: 24 seconds real-time
- Network stress reduced from 0.35 → 0.18
```

---

## Strategic Depth

### Resource Timing Strategies

**Hoarding Strategy**: Accumulate harmony over time to enable larger rituals
- Pros: Can fund bigger cooperative efforts, reduces per-ritual cost via loyalty
- Cons: Player vulnerability during accumulation period

**Just-in-Time Strategy**: Perform rituals exactly when barriers need renewal
- Pros: Efficient resource use, good for economic players
- Cons: Fragile, vulnerable to corruption spikes

**Cooperative Snowball**: Multiple players synchronize loyalty growth
- Pros: Exponential cost reduction (loyalty stacks across participants)
- Cons: Requires coordination, vulnerable to player dropout

### Defensive Positioning

**Pre-Ritual Barrier Placement**: Place barriers during Phase 7b before ritual
- Effect: Reduces incoming corruption during 24-second ritual window
- Tradeoff: Costs harmony upfront, but protects ritual vulnerability

**Cascade Targeting**: Choose epicenter to maximize cascade depth
- Effect: Higher network positions enable deeper cascade penetration
- Tradeoff: Central nodes more contested

### Ritual Denial

**Cluster Lockdown**: Declare ritual to trigger 45-second cooldown
- Effect: Prevents enemies from ritualizing same cluster
- Tradeoff: Uses resources even if ritual fails

**Timing Flood**: Fill 3-ritual quota to block further rituals
- Effect: Network-wide cooldown until 120-second period rolls
- Tradeoff: Requires 3 parallel rituals, high resource cost

---

## Visual Design

### Ritual Epicenter Glow
- **Base**: Soft blue pulse (2-3 Hz)
- **RESONANCE**: Ripple effects emanate outward
- **RESOLUTION**: Golden cascade replaces blue (particle burst)
- **FAILURE**: Red dissipation, energy scatters

### Participant Link Synchronization
- **CHANNELING**: Links dim to 40% opacity, begin subtle pulsing
- **RESONANCE**: Links brighten to 80% opacity, strong frequency lock
- **RESOLUTION**: Links flash to 100% opacity, cascade wave flows

### Cascade Reconstruction Wave
- **Propagation**: Golden wave spreads at ~4 nodes/second
- **Trail**: Reconstructed links glow and stabilize behind wave front
- **Amplitude**: Larger rituals = more intense waves

### Loyalty Indicators
- **1-2 Rituals**: Standard appearance (no change)
- **3-4 Rituals**: Subtle gold trim on node
- **5+ Rituals**: Full platinum aura, enhanced particle effects

---

## Troubleshooting & Debug

### Enable Debug Logging
```javascript
rituals.debugMode = true;
// Outputs: [Phase 8 Ritual] label with detailed event data
```

### Check Ritual Status
```javascript
const status = rituals.getRitualStatus(ritualId);
console.log(status.stage, status.progress);  // Current stage and progress
```

### View Event Log
```javascript
const events = rituals.getEventLog();
events.forEach(e => console.log(e.type, e.data));
// Shows all Phase 8 events: RITUAL_INITIATED, PARTICIPANT_JOINED, RESOLUTION_EXECUTED, etc.
```

### Common Issues

**"Ritual not found"**
- Cause: Ritual ID typo or ritual already completed
- Fix: Check ritual ID, use `getRitualStatus()` first

**"Ritual cooldown active"**
- Cause: Attempted same cluster ritual within 45 seconds
- Fix: Wait for cooldown to expire or choose different cluster

**"Insufficient harmony"**
- Cause: Participant doesn't have 0.15 harmony available
- Fix: Reduce participant count or wait for harmony regeneration

**Ritual fails at RESOLUTION**
- Cause: No links in cascade, or synergy < 20
- Fix: Verify cluster topology, increase participant count

---

## Performance Considerations

### Update Frequency
- Call `updateRituals(deltaTime)` every frame (60 fps recommended)
- Each call is O(R) where R = number of active rituals (typically <5)

### Memory Usage
- Event log: ~5KB per 100 events (auto-pruned to 500 max)
- Loyalty tracking: ~200 bytes per unique participant
- Ritual data: ~2KB per active ritual

### Visual Impact
- Shader load: Moderate (uses existing cascade shaders)
- Particle systems: ~50-200 particles during RESOLUTION
- Network updates: 1 per stage transition + 1 per frame (progress sync)

---

## Future Enhancements (Roadmap)

### Phase 8a: Ritual Customization
- Choose ritual focus (corruption reduction, integrity gain, synergy boosting)
- Different cost/reward ratios based on ritual type

### Phase 8b: Ritual Artifacts
- Rare items that improve ritual efficiency
- Craftable in Phase 9+ (new content)

### Phase 8c: Nested Rituals
- Rituals within rituals (meta-cooperation)
- Exponential bonuses for successful nesting

### Phase 8d: Ritual Prediction
- AI predicts ritual outcomes based on network state
- Players can hedge bets before ritual starts

---

## Integration Checklist

- [ ] NetworkRituals_v1.js integrated into main.js
- [ ] LinkCorruptionTransmission_v1 passed to constructor
- [ ] ArchetypeGameplayEffects_v1 available (optional enhancement)
- [ ] `updateRituals()` called every frame
- [ ] Event log monitored for ritual completion
- [ ] Loyalty stats displayed in HUD
- [ ] Visual effects (pulse, cascade) wired to ritual stages
- [ ] Debug API exposed (console commands)

---

## Summary

**Phase 8: Network Rituals** elevates ATOMA from individual-action gameplay to **emergent cooperative gameplay**. By pooling resources, players can achieve mass reconstruction impossible alone, while loyalty mechanics encourage **long-term engagement**. The 3-stage progression creates **natural tension and release**, and cascade effects provide **satisfying visual payoff**.

The system maintains Phase 7b's economic balance while introducing new strategic depth through cluster selection, timing windows, and loyalty mechanics.
