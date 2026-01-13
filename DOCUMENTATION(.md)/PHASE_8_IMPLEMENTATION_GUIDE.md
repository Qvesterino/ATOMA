# Phase 8: Network Rituals — Implementation & Integration Guide

## Quick Start (5 minutes)

### 1. Import NetworkRituals in main.js

```javascript
import NetworkRituals from './NetworkRituals_v1.js';

// After LinkCorruptionTransmission is initialized:
const networkRituals = new NetworkRituals(linkCorruptionSystem, archetypeGameplay);
```

### 2. Add Frame Update

```javascript
// In main animation loop (before render):
networkRituals.updateRituals(deltaTime);
```

### 3. Connect Visual Feedback

```javascript
// Query ritual status to drive visuals:
const activeRituals = Array.from(networkRituals.rituals.values());

for (const ritual of activeRituals) {
  const epicenter = ritual.epicenter;
  if (epicenter.material) {
    // Update epicenter glow frequency
    epicenter.material.userData.ritualFrequency = ritual.resonanceFrequency;
    
    // Update material based on stage
    switch (ritual.stage) {
      case 'channeling':
        epicenter.material.emissive.setHex(0x0088ff);  // Blue
        break;
      case 'resolution':
        epicenter.material.emissive.setHex(0xffaa00);  // Gold
        break;
    }
  }
}
```

### 4. Add Console Commands (Debug API)

```javascript
// Expose to window for dev testing
window.phases = window.phases || {};
window.phases.rituals = {
  initiate: (epicenterId, participantIds) => {
    const epicenter = nodesById[epicenterId];
    const participants = participantIds.map(id => nodesById[id]);
    return networkRituals.initiateRitual(epicenter, participants);
  },
  
  status: (ritualId) => networkRituals.getRitualStatus(ritualId),
  
  cancel: (ritualId) => networkRituals.cancelRitual(ritualId),
  
  stats: (nodeId) => networkRituals.getParticipantStats(nodeId),
  
  networkStats: () => networkRituals.getNetworkRitualStats(),
  
  logs: (limit = 20) => networkRituals.getEventLog().slice(-limit)
};
```

---

## Integration Points

### Link State Authority

NetworkRituals queries LinkCorruptionTransmission for:
- Link existence and connectivity
- Current corruption levels
- Integrity scores
- Collapsed link status

**No mutations**: NetworkRituals only reads link state during resolution phase.

### Archetype Integration

Phase 8 respects archetype modifiers:

```javascript
// In _executeRitualResolution():
if (this.gameplaySystem && this.gameplaySystem.getArchetypeBonus) {
  for (const node of ritual.participants) {
    const archetype = node.archetype;
    const bonus = this.gameplaySystem.getArchetypeBonus(archetype, 'ritual_success');
    // Apply bonus to success rate
  }
}
```

### Visual Effects Integration

Reuse existing VFX from CorruptionVisualFX_v1:

```javascript
// During RESOLUTION phase:
// Trigger healing cascade on reconstructed links
if (reconstructResult.success) {
  const healingFX = corruptionVFX.createHealingCascade(
    link.source.position,
    link.target.position,
    reconstructResult.integrityGain
  );
  // VFX system manages lifetime
}
```

### Harmony/Synergy System

Phase 8 works with existing resource system:

```javascript
// Harmony is consumed from node.userData.harmonyLevel
node.userData.harmonyLevel -= harmonyCost;

// Synergy is pooled but not drawn from existing synergy
// (Synergy pool is ritual-internal, not tied to node stats)
// This prevents conflicts with Phase 4/5 synergy mechanics
```

---

## HUD/UI Integration

### Add Ritual Status Display

```javascript
// Create HUD element showing active rituals
const ritualStatusHUD = {
  updateDisplay() {
    const stats = networkRituals.getNetworkRitualStats();
    
    // Show active count
    document.getElementById('active-rituals').textContent = stats.activeRituals;
    
    // Show rate limit status
    document.getElementById('ritual-quota').textContent = 
      `${stats.recentRitualsInPeriod}/${stats.maxAllowedPerPeriod}`;
    
    // Show recent ritual list
    const recentRituals = networkRituals.rituals;
    // ... render ritual cards
  }
};
```

### Add Loyalty Display

```javascript
// Per-node loyalty indicator
const getParticipantBadge = (nodeId) => {
  const stats = networkRituals.getParticipantStats(nodeId);
  
  if (stats.ritualsCompleted >= 5) {
    return { label: 'Platinum', color: '#e0d5b7', discount: stats.currentLoyaltyDiscount };
  } else if (stats.ritualsCompleted >= 3) {
    return { label: 'Gold', color: '#ffd700', discount: stats.currentLoyaltyDiscount };
  }
  return { label: 'Member', color: '#ffffff', discount: '0%' };
};
```

---

## Event Handling

### Subscribe to Ritual Events

```javascript
// Monitor event log for game logic
const ritualEventListener = {
  update() {
    const newEvents = networkRituals.getEventLog();
    
    for (const event of newEvents) {
      if (event.type === 'RITUAL_SUCCESS') {
        // Trigger celebration VFX
        playWorldEvent('ritual_success', {
          epicenter: event.data.epicenter,
          intensity: event.data.linksReconstructed
        });
        
        // Grant achievements
        checkAchievement('First Ritual Complete', event.data.participantCount >= 3);
      }
      
      if (event.type === 'RITUAL_FAILED') {
        // Trigger failure sound/VFX
        playWorldEvent('ritual_failed', { intensity: 0.5 });
      }
    }
  }
};
```

---

## Configuration Tuning

### For Cooperative Gameplay

Reduce escalation multiplier to encourage frequent rituals:

```javascript
RITUAL_CONFIG.ESCALATION_MULTIPLIER_PER_RITUAL = 0.06;  // Was 0.12
RITUAL_CONFIG.SAME_CLUSTER_COOLDOWN_MS = 30000;        // Was 45000
```

### For Competitive Gameplay

Increase costs and reduce participation rewards:

```javascript
RITUAL_CONFIG.BASE_HARMONY_COST_PER_PARTICIPANT = 0.25;  // Was 0.15
RITUAL_CONFIG.LOYALTY_DISCOUNT_PER_RITUAL = 0.01;       // Was 0.03
```

### For PvE/Story

Lengthen ritual durations for dramatic effect:

```javascript
RITUAL_CONFIG.RITUAL_STAGE_DURATION_MS = {
  CHANNELING: 12000,   // Was 8000
  RESONANCE: 20000,    // Was 12000
  RESOLUTION: 6000     // Was 4000
};
```

---

## Testing Checklist

### Functional Tests

- [ ] Ritual initiates with correct cost calculations
- [ ] Resources deducted from all participants
- [ ] Ritual progresses through all 3 stages
- [ ] Late participant joining works
- [ ] Cascade reconstruction triggers
- [ ] Loyalty tracking increments
- [ ] Ritual cancellation refunds 80%
- [ ] Ritual failure consumes 60% synergy
- [ ] Global rate limiting enforces 3/120s quota
- [ ] Cluster cooldown prevents spam

### Economic Tests

- [ ] Cost escalation formula: 1.0 → 1.12 → 1.25 → 1.40 (correct)
- [ ] Loyalty discount applied: After 3 rituals = -9% (correct)
- [ ] Combined: 3rd ritual = 125.4% × 91% = 114.1% cost (correct)

### Integration Tests

- [ ] Archetype bonuses applied to reconstruction success
- [ ] VFX triggers during each ritual stage
- [ ] Harmony deduction syncs with node userData
- [ ] Link states updated after cascade reconstruction
- [ ] Event log populated with all ritual events

### Edge Cases

- [ ] Cannot initiate ritual with 0 participants (fails)
- [ ] Cannot initiate ritual if nodes have insufficient harmony (fails)
- [ ] Can cancel ritual at any stage (refunds correctly)
- [ ] Rate limit enforced across parallel rituals
- [ ] Loyalty persists across session resets
- [ ] Ritual completes if last participant leaves (success/fail unaffected)

---

## Monitoring & Analytics

### Key Metrics

```javascript
// Track in analytics system:
const metrics = {
  totalRitualsInitiated: 0,
  totalRitualsSuccessful: 0,
  totalRitualsFailed: 0,
  averageParticipantsPerRitual: 0,
  totalLinksReconstructed: 0,
  averageSuccessRate: 0,
  loyaltyParticipants: networkRituals.participantLoyalty.size,
  mostActiveClusters: [] // Sort by ritual count
};
```

### Debug Commands

```javascript
// In console:
phases.rituals.logs()           // Last 20 events
phases.rituals.networkStats()   // Network-wide stats
phases.rituals.stats(nodeId)    // Per-node loyalty
```

---

## Performance Optimization

### If Frame Rate Drops

1. **Reduce VFX particle count** during cascade:
   ```javascript
   RITUAL_CONFIG.CASCADE_PARTICLE_COUNT = 50;  // Was 100
   ```

2. **Increase update interval**:
   ```javascript
   // Call updateRituals() every other frame instead of every frame
   frameCounter++;
   if (frameCounter % 2 === 0) {
     networkRituals.updateRituals(deltaTime * 2);
   }
   ```

3. **Limit concurrent rituals**:
   ```javascript
   // Prevent >2 rituals running simultaneously
   const activeCount = networkRituals.rituals.size;
   if (activeCount >= 2) return { success: false, reason: 'Max concurrent rituals' };
   ```

### Memory Optimization

1. **Prune event log more aggressively**:
   ```javascript
   networkRituals.maxEventLog = 200;  // Was 500
   ```

2. **Clear event log periodically**:
   ```javascript
   setInterval(() => networkRituals.clearEventLog(), 300000);  // Every 5 min
   ```

---

## Troubleshooting

### Ritual never progresses past CHANNELING

**Cause**: `updateRituals()` not being called every frame

**Fix**: Verify call in main animation loop:
```javascript
function animate() {
  networkRituals.updateRituals(deltaTime);  // Must be here
  render();
  requestAnimationFrame(animate);
}
```

### Loyalty bonus not applying

**Cause**: Node ID mismatch or loyalty Map not persisting

**Fix**: Ensure node IDs are consistent:
```javascript
// Use unique, stable IDs (not Math.random())
node.id = `node_${x}_${y}_${z}`;
```

### Cascade reconstruction not triggering

**Cause**: Synergy pool depleted or no valid target links

**Fix**: Check ritual.pooledResources.synergy after resolution:
```javascript
const ritual = networkRituals.rituals.get(ritualId);
console.log('Synergy remaining:', ritual.pooledResources.synergy);
console.log('Reconstructions:', ritual.cascadeReconstructions);
```

### Rate limit blocking valid ritual

**Cause**: Recent rituals still in 120-second window

**Fix**: Check exact timestamps:
```javascript
const now = Date.now();
const recent = networkRituals.recentRituals.filter(r => 
  now - r.timestamp < 120000
).map(r => new Date(r.timestamp).toISOString());
console.log('Recent rituals:', recent);
```

---

## Deployment Checklist

- [ ] NetworkRituals_v1.js added to project
- [ ] Import statement added to main.js
- [ ] Constructor call passes both corruptionSystem and gameplaySystem
- [ ] `updateRituals()` called in animation loop with correct deltaTime
- [ ] Console debug API accessible (window.phases.rituals)
- [ ] HUD displays active ritual count and quota
- [ ] Visual effects trigger on ritual state changes
- [ ] Event log monitored for analytics
- [ ] Loyalty badges display in node inspector
- [ ] Configuration constants reviewed and tuned
- [ ] All tests passing (functional, economic, integration)
- [ ] Performance baseline established (<2% frame time per ritual)
- [ ] Documentation deployed to wiki
- [ ] Patch notes updated with Phase 8 features

---

## API Cheat Sheet

```javascript
// Initiate ritual
const r = networkRituals.initiateRitual(epicenter, [p1, p2]);

// Query status
networkRituals.getRitualStatus(ritualId);

// Add participant
networkRituals.addParticipant(ritualId, newNode);

// Cancel
networkRituals.cancelRitual(ritualId);

// Get stats
networkRituals.getParticipantStats(nodeId);
networkRituals.getNetworkRitualStats();

// Debug
networkRituals.getEventLog();
networkRituals.clearEventLog();

// In loop
networkRituals.updateRituals(deltaTime);
```

---

## Success Criteria

✅ Phase 8 is production-ready when:

1. **Functional**: All ritual stages progress correctly
2. **Economic**: Resource costs calculate per formula without deviation
3. **Visual**: Ritual visuals (glow, cascade, loyalty) display correctly
4. **Integrated**: Works with Phase 6 rebuilds, Phase 7b barriers, Phase 5 synergy
5. **Performant**: <2% frame time overhead, <5MB memory per 10 concurrent rituals
6. **Analyzed**: Event log shows all expected ritual events
7. **Balanced**: Loyalty bonuses encourage participation without breaking economy

---

## Next Steps

1. **Integration** (1 day): Wire into main.js, test frame loop integration
2. **Visual Polish** (2 days): Cascade effects, loyalty badges, HUD indicators
3. **Audio** (1 day): Ritual progression sounds, cascade effects, success chime
4. **Balance** (1-2 days): Playtest, tune costs/timings, adjust escalation
5. **Documentation** (completed): API, integration, troubleshooting
6. **Deployment** (1 day): Final testing, push to production
7. **Monitoring** (ongoing): Analytics, feedback, future enhancements

Total estimated work: 1 week from integration to full production.
