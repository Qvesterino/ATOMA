# SESSION 88 CONSOLE TESTING GUIDE
## LinkDegradationSystem Testing Commands

---

## QUICK START

After the game loads, open the browser console and test:

```javascript
// Test 1: Verify system exists
gameSimulation.linkDegradationSystem
// Should show: LinkDegradationSystem { ... }

// Test 2: Get statistics
const stats = gameSimulation.linkDegradationSystem.getDegradationStatistics();
console.log(stats);

// Test 3: Find all degraded links
gameSimulation.linkDegradationSystem.debugDumpAllDegradations();
```

---

## COMPREHENSIVE TESTING SUITE

### 1. System Verification

```javascript
// Check if system initialized
if (gameSimulation.linkDegradationSystem) {
  console.log('✅ LinkDegradationSystem initialized');
} else {
  console.log('❌ LinkDegradationSystem NOT found');
}

// Check if quality calculator exists
if (gameSimulation.linkQualityCalculator) {
  console.log('✅ LinkQualityCalculator initialized');
} else {
  console.log('❌ LinkQualityCalculator NOT found');
}
```

### 2. Get Overall Statistics

```javascript
// Get comprehensive stats
const stats = gameSimulation.linkDegradationSystem.getDegradationStatistics();

console.log('📊 DEGRADATION STATISTICS:');
console.log(`Total Links: ${stats.totalLinks}`);
console.log(`Avg Efficiency: ${(stats.averageEfficiency * 100).toFixed(1)}%`);
console.log(`Min Efficiency: ${(stats.minEfficiency * 100).toFixed(1)}%`);
console.log(`Max Efficiency: ${(stats.maxEfficiency * 100).toFixed(1)}%`);
console.log(`State Distribution:`, stats.stateCounts);
console.log(`Links Under Load: ${stats.linksUnderLoadPressure}`);
console.log(`Links Critical: ${stats.linksCriticallyStrained}`);
```

### 3. Dump All Link States

```javascript
// Show detailed state of every link
gameSimulation.linkDegradationSystem.debugDumpAllDegradations();

// Output format:
// SourceNode → TargetNode:
// - efficiency: 0.75
// - state: nominal
// - qualityScore: 75.2
// - loadRatio: 0.25
// - visualIntensity: 0.81
// - etc...
```

### 4. Find Worst Performing Links

```javascript
// Get links sorted by degradation (worst first)
const worst = gameSimulation.linkDegradationSystem.getLinksSortedByDegradation(true);

console.log('🔴 WORST PERFORMING LINKS:');
worst.slice(0, 5).forEach((link, i) => {
  const eff = gameSimulation.linkDegradationSystem.getLinkEfficiency(link);
  const src = link.source?.userData?.name || 'Unknown';
  const tgt = link.target?.userData?.name || 'Unknown';
  console.log(`${i+1}. ${src} → ${tgt}: ${(eff*100).toFixed(0)}% efficiency`);
});
```

### 5. Find Best Performing Links

```javascript
// Get links sorted by efficiency (best first)
const best = gameSimulation.linkDegradationSystem.getLinksSortedByDegradation(false);

console.log('✅ BEST PERFORMING LINKS:');
best.slice(0, 5).forEach((link, i) => {
  const eff = gameSimulation.linkDegradationSystem.getLinkEfficiency(link);
  const src = link.source?.userData?.name || 'Unknown';
  const tgt = link.target?.userData?.name || 'Unknown';
  console.log(`${i+1}. ${src} → ${tgt}: ${(eff*100).toFixed(0)}% efficiency`);
});
```

### 6. Find All Links Under Load

```javascript
// Get all links with efficiency < 90%
const underLoad = gameSimulation.linkingSystem.links.filter(link => 
  gameSimulation.linkDegradationSystem.isUnderLoadPressure(link)
);

console.log(`⚠️  ${underLoad.length} links under load pressure`);
underLoad.slice(0, 10).forEach(link => {
  const state = gameSimulation.linkDegradationSystem.getDegradationState(link);
  const src = link.source?.userData?.name || 'Unknown';
  const tgt = link.target?.userData?.name || 'Unknown';
  console.log(
    `${src} → ${tgt}: ${(state.efficiency*100).toFixed(0)}% ` +
    `(quality: ${state.qualityScore.toFixed(1)}, state: ${state.state})`
  );
});
```

### 7. Find All Critically Strained Links

```javascript
// Get all links with efficiency < 40%
const critical = gameSimulation.linkingSystem.links.filter(link =>
  gameSimulation.linkDegradationSystem.isCriticallyStrained(link)
);

console.log(`🚨 ${critical.length} CRITICALLY STRAINED LINKS:`);
critical.forEach(link => {
  const state = gameSimulation.linkDegradationSystem.getDegradationState(link);
  const src = link.source?.userData?.name || 'Unknown';
  const tgt = link.target?.userData?.name || 'Unknown';
  console.log(
    `${src} → ${tgt}: STATE=${state.state}, EFF=${(state.efficiency*100).toFixed(0)}%`
  );
});
```

### 8. Inspect Specific Link

```javascript
// Pick a link and inspect it
const link = gameSimulation.linkingSystem.links[0];  // First link

if (link) {
  const quality = gameSimulation.linkQualityCalculator.getLinkQuality(link);
  const degradation = gameSimulation.linkDegradationSystem.getDegradationState(link);
  
  console.log('📍 LINK INSPECTION:');
  console.log('Quality Metrics:', {
    score: quality.score.toFixed(1),
    level: quality.level,
    structural: quality.structural.toFixed(1),
    harmony: quality.harmony.toFixed(1),
    load: quality.load.toFixed(1),
    corruption: quality.corruption.toFixed(1)
  });
  console.log('Degradation Metrics:', {
    efficiency: degradation.efficiency.toFixed(2),
    state: degradation.state,
    loadRatio: degradation.loadRatio.toFixed(2),
    visualIntensity: degradation.visualIntensity.toFixed(2),
    particleRate: degradation.particleEmissionRate.toFixed(2),
    loadNoise: degradation.loadNoise.toFixed(3),
    metricsWeight: degradation.metricsWeight.toFixed(2)
  });
}
```

### 9. Monitor Frame Performance

```javascript
// Create a mini profiler for degradation updates
const originalUpdate = gameSimulation.linkDegradationSystem.update;
let callCount = 0;
let totalTime = 0;

gameSimulation.linkDegradationSystem.update = function(deltaTime) {
  const start = performance.now();
  originalUpdate.call(this, deltaTime);
  const elapsed = performance.now() - start;
  
  totalTime += elapsed;
  callCount++;
  
  if (callCount % 60 === 0) {  // Log every ~1 second
    console.log(
      `LinkDegradationSystem: ${(totalTime/callCount).toFixed(2)}ms avg, ` +
      `${totalTime.toFixed(0)}ms total over ${callCount} frames`
    );
  }
};

// Run for 10 seconds then report
setTimeout(() => {
  console.log(
    `✅ Performance Report: ${(totalTime/callCount).toFixed(3)}ms per frame ` +
    `(${callCount} frames)`
  );
}, 10000);
```

### 10. Test Quality Score Distribution

```javascript
// See how many links fall into each quality tier
const allQualities = [];
const tiers = { optimal: 0, nominal: 0, degraded: 0, strained: 0, critical: 0 };

gameSimulation.linkingSystem.links.forEach(link => {
  const quality = gameSimulation.linkQualityCalculator.getLinkQuality(link);
  if (quality) {
    allQualities.push(quality.score);
    
    if (quality.score >= 80) tiers.optimal++;
    else if (quality.score >= 55) tiers.nominal++;
    else if (quality.score >= 30) tiers.degraded++;
    else if (quality.score >= 10) tiers.strained++;
    else tiers.critical++;
  }
});

const avg = allQualities.reduce((a,b) => a+b, 0) / allQualities.length;
const min = Math.min(...allQualities);
const max = Math.max(...allQualities);

console.log('📈 QUALITY DISTRIBUTION:');
console.log(`Average: ${avg.toFixed(1)}`);
console.log(`Min: ${min.toFixed(1)}, Max: ${max.toFixed(1)}`);
console.log('Tier Distribution:', tiers);
```

---

## MANUAL VISUAL VERIFICATION

### Before Testing

1. Load game with several nodes
2. Create links between nodes
3. Create more links to increase load on specific nodes
4. Observe as links fill up

### Expected Behavior

- **Low Load (0-40%)**: Links bright, normal opacity
- **Medium Load (40-70%)**: Links slightly dimmer, starting to show strain
- **High Load (70-90%)**: Links visibly dimmed, color shifting
- **Critical Load (90-100%)**: Links very dim, red tint visible
- **At Capacity (100%)**: New links rejected at capacity

### Visual Verification Steps

```javascript
// 1. Verify degradation data exists
gameSimulation.linkingSystem.links.forEach(link => {
  if (!link.userData.degradation) {
    console.log('⚠️  Link missing degradation data!');
  }
});

// 2. Verify all links have quality
gameSimulation.linkingSystem.links.forEach(link => {
  if (!link.userData.quality) {
    console.log('⚠️  Link missing quality data!');
  }
});

// 3. Verify efficiency values are in valid range
gameSimulation.linkingSystem.links.forEach(link => {
  const eff = gameSimulation.linkDegradationSystem.getLinkEfficiency(link);
  if (eff < 0 || eff > 1) {
    console.log(`❌ Invalid efficiency: ${eff}`);
  }
});
```

---

## QUICK REFERENCE COMMANDS

Copy-paste ready:

```javascript
// One-liner tests
gameSimulation.linkDegradationSystem?.getDegradationStatistics()
gameSimulation.linkDegradationSystem?.debugDumpAllDegradations()
gameSimulation.linkDegradationSystem?.getLinksSortedByDegradation(true).slice(0,5)
gameSimulation.linkingSystem.links.filter(l => gameSimulation.linkDegradationSystem.isCriticallyStrained(l)).length
const avgEff = gameSimulation.linkingSystem.links.map(l => gameSimulation.linkDegradationSystem.getLinkEfficiency(l)).reduce((a,b) => a+b, 0) / gameSimulation.linkingSystem.links.length; console.log(`Average Efficiency: ${(avgEff*100).toFixed(1)}%`);
```

---

## EXPECTED OUTPUT EXAMPLES

### Statistics Output

```
📊 DEGRADATION STATISTICS:
Total Links: 45
Avg Efficiency: 68.5%
Min Efficiency: 12.3%
Max Efficiency: 100.0%
State Distribution: {optimal: 12, nominal: 18, degraded: 10, strained: 4, critical: 1}
Links Under Load: 14
Links Critical: 5
```

### Link Dump Output

```
[LinkDegradationSystem] All Link Degradations
Node5 → Node2:
  efficiency: 0.85
  state: nominal
  qualityScore: 85.3
  loadRatio: 0.15
  visualIntensity: 0.91
  particleRate: 0.93
  loadNoise: 0.02
  metricsWeight: 0.96
```

### Performance Output

```
✅ Performance Report: 0.156ms per frame (600 frames)
```

---

## TROUBLESHOOTING

**Q: System not found**
```javascript
if (!gameSimulation.linkDegradationSystem) {
  console.log('❌ System not initialized - check main.js constructor');
}
```

**Q: No degradation data on links**
```javascript
// Check if update is being called
console.log('Quality calculator running:', !!gameSimulation.linkQualityCalculator);
console.log('Degradation system running:', !!gameSimulation.linkDegradationSystem);
console.log('First link quality:', gameSimulation.linkQualityCalculator.getLinkQuality(gameSimulation.linkingSystem.links[0]));
console.log('First link degradation:', gameSimulation.linkDegradationSystem.getDegradationState(gameSimulation.linkingSystem.links[0]));
```

**Q: Links not visually changing**
```javascript
// Check if NeonLinkVisuals is applying effects
console.log('NeonLinkVisuals exists:', !!gameSimulation.neonLinkVisuals);
// Manually trigger update
gameSimulation.neonLinkVisuals?.update?.(0.016);
```

---

## NEXT STEPS

After verification:

1. ✅ Monitor for 60+ frames to ensure stability
2. ✅ Create high-load scenario (many links to single node)
3. ✅ Verify visual degradation matches efficiency values
4. ✅ Check console for any warnings or errors
5. ✅ Verify performance stays below 1ms per frame
6. ✅ Test with multiple maps/modes

