## AUDIT RESULT: SynergyTravelingWaveFX_v1 Wave System

### ROOT CAUSE
**Waves don't exist because no burst snapshots are active.**

### DETAILED FINDINGS

#### 1. getActiveSnapshot() ✅ WORKING CORRECTLY
- `WaveInterferenceEngine_v1.getActiveSnapshot()` returns the current burst snapshot
- When no burst is active, it correctly returns `null`
- Snapshot lifecycle: created by `requestBurstIntent()`, auto-completed when `now >= endAt`

#### 2. requestBurstIntent() Callers ✅ TRACED
**Primary caller:** `WaveBurstRouter_v1.emitIntent()`
- Listens to 20 semantic events
- Converts events to burst intents
- Calls `waveEngine.requestBurstIntent(intent)` with intent data

**Expected event triggers:**
- `node.synergy.high`
- `link:synergyThreshold`
- `cascade.triggered`
- `cascade.start`
- `cascade.hop`
- `harmonic.cascade.start`
- `metric:corruptionRise`
- `metrics.spike`
- And 12 more...

**Events ARE being emitted** from multiple files:
- `main.js`: `link:synergyThreshold`, `link:harmonicLock`, `metrics.spike`
- `CascadeParticleSystem_Session120.js`: `cascade.hop`
- `CascadingHarmonicResonanceAmplification.js`: `cascade.triggered`
- `CascadeEventBridge_v1.js`: `cascade.start`

#### 3. SynergyTravelingWaveFX_v1 update() ✅ RUNNING
- Registered in frameScheduler: `'visual.synergyTravelingWaveFX'`
- Calls `this.synergyTravelingWaveFX?.update?.(dt, this.time || 0)` each frame
- Update flow:
  ```javascript
  const snapshot = this.waveEngine?.getActiveSnapshot?.() || null;
  if (snapshot?.id && snapshot.id !== this._lastSnapshotId) {
      // Trigger wave on ALL registered materials
      this.triggerWave(material, depth, synergyLevel, duration);
  }
  ```

#### 4. Material Registration ✅ PATCHING
- `LinkRendererConduit.setTravelingWaveFX()` stores reference
- Materials call: `this.travelingWaveFX.registerMaterial(material, { type: 'link-strand', polarity: 'resonance' })`
- Shader patching via `onBeforeCompile` works correctly

#### 5. Why Uniforms are 0 ❌ THE PROBLEM
**Direct cause:** No active burst snapshot exists

**Chain:**
1. `getActiveSnapshot()` returns `null` (no burst active)
2. SynergyTravelingWaveFX_v1.update() sees null snapshot → skips wave trigger
3. Materials remain with `uWaveIntensity = 0` (default)
4. No waves render

**Why no burst snapshot?**
Possible reasons:
- Semantic events are not firing (conditions not met)
- Events fire but don't meet burst criteria (regime crossing, armed state)
- WaveBurstRouter not subscribed to semantic bus
- Cooldowns blocking burst requests

### HOW TO TRIGGER WAVE ACTIVITY

**Method 1: Trigger a cascade event (recommended)**
```javascript
// Force a cascade hop event
game.semanticBus.emit('cascade.hop', {
    link: someLinkObject,
    sourceNode: nodeA,
    targetNode: nodeB,
    intensity: 0.8,
    conflictType: 'resolved_harmony'
}, { priority: game.semanticBus.priority.INTERACTIVE });
```

**Method 2: Trigger high synergy event**
```javascript
// Emit synergy threshold breach
game.semanticBus.emit('link:synergyThreshold', {
    sourceId: 'link123',
    targetId: 'link456',
    link: someLink,
    synergy: 0.85  // Must be >= 0.75
});
```

**Method 3: Direct burst intent (bypass events)**
```javascript
// Directly request a burst
game.waveInterferenceEngine.requestBurstIntent({
    type: 'synergy',
    sourceId: 'manual_trigger',
    fromRegime: 'baseline',
    toRegime: 'collaborative',
    center: { x: 0, y: 0, z: 0 },
    intensity: 1.0,
    reasonClass: 'manual_debug'
});
```

### VERIFICATION STEPS

To confirm waves work:
1. Open browser console
2. Run: `console.log(game.waveInterferenceEngine.getActiveSnapshot())`
3. If `null`, trigger one of the methods above
4. Run again: should return snapshot object with `timeline.startAt`, `timeline.endAt`
5. Observe link materials: uniforms should become non-zero
6. Visual waves should appear traveling along links

### RECOMMENDATION

The system is **correctly implemented but dormant**. To make waves appear naturally:
1. Ensure cascade system is active and triggering events
2. Verify semantic events are firing in console
3. Check WaveBurstRouter subscription status: `game.waveBurstRouter.getStatus()`
4. Review recent intents: `game.waveBurstRouter.getRecentIntents(12)`