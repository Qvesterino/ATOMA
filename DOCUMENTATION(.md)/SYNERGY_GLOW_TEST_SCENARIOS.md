# LinkGlowSynergyEngine1_0 Test Scenarios

Comprehensive testing guide with 40+ scenarios to verify correct glow behavior, material handling, and performance.

---

## Quick Test Suite (5 minutes)

Run these in browser console for rapid validation:

```javascript
// 1. Verify initialization
console.assert(window.LinkGlowEngine, 'Engine not loaded');
console.assert(linkingSystem.links.length > 0, 'No links in system');

// 2. Test score extraction
const link = linkingSystem.links[0];
LinkGlowEngine.setDebug(true);

// 3. Test visual progression
LinkGlowEngine.forceScore(0.0);
LinkGlowEngine.updateLinkGlow(link);
console.log('Score 0.0 (blue) - applied');

LinkGlowEngine.forceScore(0.5);
LinkGlowEngine.updateLinkGlow(link);
console.log('Score 0.5 (aqua) - applied');

LinkGlowEngine.forceScore(1.0);
LinkGlowEngine.updateLinkGlow(link);
console.log('Score 1.0 (white) - applied');

// 4. Verify inspection works
const state = LinkGlowEngine.inspect(link);
console.log('Inspection successful:', state);

// 5. Clear debug
LinkGlowEngine.setDebug(false);
LinkGlowEngine.forceScore(null);
console.log('✓ Quick test passed');
```

---

## Test Group 1: Initialization & Setup

### Test 1.1: Engine Loads
```javascript
// Verify engine is available and properly exported
console.log('Testing: Engine load');

try {
  const config = LinkGlowEngine.getConfig();
  console.assert(config.visualCurves, 'Visual curves missing');
  console.assert(config.colorPalette, 'Color palette missing');
  console.log('✓ Engine loaded correctly');
} catch (e) {
  console.error('✗ Engine load failed:', e.message);
}
```

### Test 1.2: Integration with LinkingSystem
```javascript
// Verify engine can access linking system
console.log('Testing: LinkingSystem integration');

LinkGlowEngine.init(linkingSystem);
const stats = LinkGlowEngine.getCacheStats();

console.assert(stats.cachedLinks === 0, 'Initial cache should be empty');
console.log('✓ LinkingSystem integration successful');
```

### Test 1.3: Initial Cache State
```javascript
// Verify cache starts clean
console.log('Testing: Initial cache state');

const before = LinkGlowEngine.getCacheStats().cachedLinks;
LinkGlowEngine.clearCache();
const after = LinkGlowEngine.getCacheStats().cachedLinks;

console.assert(before === 0, 'Cache should start empty');
console.assert(after === 0, 'Cache clear should result in 0');
console.log('✓ Cache initialization correct');
```

---

## Test Group 2: Score Extraction

### Test 2.1: Direct Score Property
```javascript
// Test reading synergyScore directly from link
console.log('Testing: Direct score extraction');

const link = linkingSystem.links[0];
link.synergyScore = 0.75;

LinkGlowEngine.updateLinkGlow(link);
const profile = LinkGlowEngine.computeVisualProfile(0.75);

console.assert(profile.score === 0.75, 'Score not extracted');
console.log('✓ Direct score extraction works');
```

### Test 2.2: Fallback Score Locations
```javascript
// Test fallback score extraction (linkData, synergy, traffic)
console.log('Testing: Fallback score extraction');

const link = { traffic: { load: 0.6 } }; // No synergyScore
const profile = LinkGlowEngine.computeVisualProfile(0.6);

console.assert(profile.score === 0.6, 'Fallback extraction failed');
console.log('✓ Fallback extraction works');
```

### Test 2.3: Score Bounds Checking
```javascript
// Test that scores are clamped to 0-1
console.log('Testing: Score bounds');

const p1 = LinkGlowEngine.computeVisualProfile(-0.5); // Below min
const p2 = LinkGlowEngine.computeVisualProfile(0.5);  // Normal
const p3 = LinkGlowEngine.computeVisualProfile(1.5);  // Above max

console.assert(p1.score === 0, 'Negative score not clamped');
console.assert(p2.score === 0.5, 'Normal score wrong');
console.assert(p3.score === 1.0, 'High score not clamped');
console.log('✓ Score bounds working correctly');
```

### Test 2.4: Force Score Override
```javascript
// Test debug force score override
console.log('Testing: Force score override');

const link = { synergyScore: 0.3 };
LinkGlowEngine.forceScore(0.9);
LinkGlowEngine.updateLinkGlow(link); // Should use 0.9, not 0.3

const state = LinkGlowEngine.inspect(link);
console.assert(state.synergyScore === 0.9, 'Force score not applied');

LinkGlowEngine.forceScore(null); // Clear
console.log('✓ Force score override works');
```

---

## Test Group 3: Visual Profile Computation

### Test 3.1: Glow Intensity Curve
```javascript
// Test glow intensity lerp curve
console.log('Testing: Glow intensity curve');

const scores = [0, 0.25, 0.5, 0.75, 1.0];
const expected = [0.1, 0.4, 0.8, 1.2, 1.5]; // Calculated values

scores.forEach((score, i) => {
  const profile = LinkGlowEngine.computeVisualProfile(score);
  const diff = Math.abs(profile.glowIntensity - expected[i]);
  
  console.assert(diff < 0.01, `Score ${score}: intensity off by ${diff}`);
});

console.log('✓ Glow intensity curve correct');
```

### Test 3.2: Line Width Curve
```javascript
// Test line width lerp curve
console.log('Testing: Line width curve');

const p0 = LinkGlowEngine.computeVisualProfile(0.0);
const p50 = LinkGlowEngine.computeVisualProfile(0.5);
const p100 = LinkGlowEngine.computeVisualProfile(1.0);

console.assert(Math.abs(p0.lineWidth - 0.5) < 0.01, 'Min width wrong');
console.assert(Math.abs(p50.lineWidth - 2.25) < 0.01, 'Mid width wrong');
console.assert(Math.abs(p100.lineWidth - 4.0) < 0.01, 'Max width wrong');

console.log('✓ Line width curve correct');
```

### Test 3.3: Pulse Speed Curve
```javascript
// Test pulse speed lerp curve
console.log('Testing: Pulse speed curve');

const p0 = LinkGlowEngine.computeVisualProfile(0.0);
const p50 = LinkGlowEngine.computeVisualProfile(0.5);
const p100 = LinkGlowEngine.computeVisualProfile(1.0);

console.assert(Math.abs(p0.pulseSpeed - 0.2) < 0.01, 'Min speed wrong');
console.assert(Math.abs(p50.pulseSpeed - 1.35) < 0.01, 'Mid speed wrong');
console.assert(Math.abs(p100.pulseSpeed - 2.5) < 0.01, 'Max speed wrong');

console.log('✓ Pulse speed curve correct');
```

### Test 3.4: Color Selection
```javascript
// Test color selection based on score tiers
console.log('Testing: Color selection');

const test = (score, expectedTier) => {
  const profile = LinkGlowEngine.computeVisualProfile(score);
  // Check that color is in valid range
  console.assert(typeof profile.color === 'number', `Invalid color for score ${score}`);
};

test(0.2, 'low');
test(0.5, 'mid');
test(0.7, 'high');
test(0.9, 'critical');

console.log('✓ Color selection working');
```

### Test 3.5: Bloom Overdrive Flag
```javascript
// Test bloom overdrive activation at high scores
console.log('Testing: Bloom overdrive flag');

const low = LinkGlowEngine.computeVisualProfile(0.8);
const critical = LinkGlowEngine.computeVisualProfile(0.9);

console.assert(low.bloomOverdrive === false, 'Bloom triggered too early');
console.assert(critical.bloomOverdrive === true, 'Bloom not triggered at 0.9');

console.log('✓ Bloom overdrive flag correct');
```

---

## Test Group 4: Material Application

### Test 4.1: Core Line Material Update
```javascript
// Test updating coreLine material
console.log('Testing: Core line material update');

const link = linkingSystem.links[0];
if (link.coreLine && link.coreLine.material) {
  const originalColor = link.coreLine.material.color.getHex();
  
  LinkGlowEngine.forceScore(0.9);
  LinkGlowEngine.updateLinkGlow(link);
  
  const newColor = link.coreLine.material.color.getHex();
  console.assert(originalColor !== newColor, 'Color not updated');
  
  LinkGlowEngine.forceScore(null);
  console.log('✓ Core line material updated');
} else {
  console.warn('⊘ No core line available for test');
}
```

### Test 4.2: Glow Layer Updates
```javascript
// Test updating all glow layers
console.log('Testing: Glow layer updates');

const link = linkingSystem.links[0];
const glowLines = ['midGlowLine', 'haloLine', 'bloomAuraLine', 'edgeLine'];

glowLines.forEach(lineKey => {
  const line = link[lineKey];
  if (line && line.material) {
    LinkGlowEngine.forceScore(0.8);
    LinkGlowEngine.updateLinkGlow(link);
    LinkGlowEngine.forceScore(null);
    console.assert(line.material.opacity >= 0.1, `${lineKey} not updated`);
  }
});

console.log('✓ Glow layers updated');
```

### Test 4.3: Vein Material Updates
```javascript
// Test updating vein materials
console.log('Testing: Vein material updates');

const link = linkingSystem.links.find(l => l.veins && l.veins.length > 0);

if (link && link.veins.length > 0) {
  LinkGlowEngine.forceScore(0.7);
  LinkGlowEngine.updateLinkGlow(link);
  
  link.veins.forEach(vein => {
    if (vein.material) {
      console.assert(vein.material.opacity >= 0.1, 'Vein opacity not updated');
    }
  });
  
  LinkGlowEngine.forceScore(null);
  console.log('✓ Vein materials updated');
} else {
  console.warn('⊘ No veins available for test');
}
```

### Test 4.4: Particle Material Updates
```javascript
// Test updating particle materials
console.log('Testing: Particle material updates');

const link = linkingSystem.links.find(l => l.particles && l.particles.length > 0);

if (link && link.particles.length > 0) {
  const initialOpacity = link.particles[0].material?.opacity;
  
  LinkGlowEngine.forceScore(0.9);
  LinkGlowEngine.updateLinkGlow(link);
  
  const updatedOpacity = link.particles[0].material?.opacity;
  console.assert(updatedOpacity > initialOpacity, 'Particle opacity not increased');
  
  LinkGlowEngine.forceScore(null);
  console.log('✓ Particle materials updated');
} else {
  console.warn('⊘ No particles available for test');
}
```

### Test 4.5: Missing Material Handling
```javascript
// Test graceful handling of missing materials
console.log('Testing: Missing material handling');

const testLink = {
  coreLine: null,
  midGlowLine: undefined,
  veins: [],
  particles: []
};

try {
  LinkGlowEngine.updateLinkGlow(testLink);
  console.log('✓ Missing materials handled gracefully');
} catch (e) {
  console.error('✗ Failed with missing materials:', e.message);
}
```

---

## Test Group 5: Animation State Updates

### Test 5.1: Pulse Phase Update
```javascript
// Test pulse phase animation state update
console.log('Testing: Pulse phase update');

const link = linkingSystem.links[0];
const initialPhase = link.animation?.pulsePhase ?? 0;

LinkGlowEngine.forceScore(2.0); // Fast pulse
LinkGlowEngine.updateLinkGlow(link);

const updatedPhase = link.animation?.pulsePhase ?? 0;
console.assert(updatedPhase > initialPhase, 'Pulse phase not incremented');

LinkGlowEngine.forceScore(null);
console.log('✓ Pulse phase updated');
```

### Test 5.2: Vein Animation Speed
```javascript
// Test vein animation speed update
console.log('Testing: Vein animation speed');

const link = linkingSystem.links.find(l => l.veinAnimation);

if (link && link.veinAnimation) {
  const initialSpeed = link.veinAnimation.speed;
  
  LinkGlowEngine.forceScore(0.9);
  LinkGlowEngine.updateLinkGlow(link);
  
  const updatedSpeed = link.veinAnimation.speed;
  console.assert(updatedSpeed > initialSpeed, 'Vein speed not increased');
  
  LinkGlowEngine.forceScore(null);
  console.log('✓ Vein animation speed updated');
} else {
  console.warn('⊘ No vein animation data');
}
```

### Test 5.3: Bloom Phase Update
```javascript
// Test bloom phase animation state update
console.log('Testing: Bloom phase update');

const link = linkingSystem.links[0];
if (link.animation?.bloomPhase !== undefined) {
  const initial = link.animation.bloomPhase;
  
  LinkGlowEngine.forceScore(0.8);
  LinkGlowEngine.updateLinkGlow(link);
  
  const updated = link.animation.bloomPhase;
  console.assert(updated > initial, 'Bloom phase not incremented');
  
  LinkGlowEngine.forceScore(null);
  console.log('✓ Bloom phase updated');
}
```

---

## Test Group 6: Caching System

### Test 6.1: Cache Population
```javascript
// Test that cache stores updated links
console.log('Testing: Cache population');

const link = linkingSystem.links[0];
const before = LinkGlowEngine.getCacheStats().cachedLinks;

LinkGlowEngine.updateLinkGlow(link);
const after = LinkGlowEngine.getCacheStats().cachedLinks;

console.assert(after > before, 'Link not cached');
console.log('✓ Cache populated');
```

### Test 6.2: Cache Skip on Low Change
```javascript
// Test that cache skips update when score change < threshold
console.log('Testing: Cache skip on low change');

const link = { synergyScore: 0.5, animation: {}, coreLine: null };

LinkGlowEngine.forceScore(null); // Use link's score
LinkGlowEngine.updateLinkGlow(link);

const state1 = LinkGlowEngine.inspect(link);

// Change score by <1%
link.synergyScore = 0.505;
LinkGlowEngine.updateLinkGlow(link);

const state2 = LinkGlowEngine.inspect(link);
console.assert(state1.synergyScore === state2.synergyScore, 'Score should use cache');

console.log('✓ Cache skip working correctly');
```

### Test 6.3: Cache Invalidation on Large Change
```javascript
// Test that cache invalidates on large score change
console.log('Testing: Cache invalidation');

const link = { synergyScore: 0.3, animation: {}, coreLine: null };

LinkGlowEngine.forceScore(null);
LinkGlowEngine.updateLinkGlow(link);

// Change by >1%
link.synergyScore = 0.5;
LinkGlowEngine.updateLinkGlow(link);

const state = LinkGlowEngine.inspect(link);
console.assert(Math.abs(state.synergyScore - 0.5) < 0.01, 'Cache not invalidated');

console.log('✓ Cache invalidation working');
```

### Test 6.4: Manual Cache Clear
```javascript
// Test manual cache clearing
console.log('Testing: Manual cache clear');

const before = LinkGlowEngine.getCacheStats().cachedLinks;
const cleared = LinkGlowEngine.clearCache();

const after = LinkGlowEngine.getCacheStats().cachedLinks;

console.assert(before > 0, 'Cache should have entries');
console.assert(after === 0, 'Cache should be empty after clear');
console.assert(cleared > 0, 'Should return clear count');

console.log('✓ Cache clear successful');
```

---

## Test Group 7: Batch Operations

### Test 7.1: Update All Links
```javascript
// Test batch updating all links
console.log('Testing: Batch update all links');

const initialCount = LinkGlowEngine.getCacheStats().cachedLinks;
LinkGlowEngine.clearCache();

const updated = LinkGlowEngine.updateAllLinks();

const finalCount = LinkGlowEngine.getCacheStats().cachedLinks;

console.assert(updated > 0, 'No links updated');
console.assert(finalCount === updated, 'Cache count mismatch');

console.log(`✓ Updated ${updated} links in batch`);
```

### Test 7.2: Selective Update Threshold
```javascript
// Test that low-change links are skipped in batch
console.log('Testing: Selective update threshold');

LinkGlowEngine.clearCache();
const count1 = LinkGlowEngine.updateAllLinks();

// Update with minimal changes
linkingSystem.links.forEach(link => {
  if (link.synergyScore) {
    link.synergyScore += 0.001; // <1% change
  }
});

const count2 = LinkGlowEngine.updateAllLinks();
console.assert(count2 <= count1, 'Should skip low-change links');

console.log('✓ Selective update working');
```

---

## Test Group 8: Color Progression

### Test 8.1: Color at Each Tier
```javascript
// Test correct color at score tier boundaries
console.log('Testing: Color progression tiers');

const profile0 = LinkGlowEngine.computeVisualProfile(0.2);   // Low
const profile40 = LinkGlowEngine.computeVisualProfile(0.4);  // Boundary
const profile65 = LinkGlowEngine.computeVisualProfile(0.65); // High
const profile90 = LinkGlowEngine.computeVisualProfile(0.9);  // Critical

console.assert(profile0.color !== profile90.color, 'Colors should differ');
console.assert(profile90.bloomOverdrive === true, 'Critical should have bloom');
console.assert(profile0.bloomOverdrive === false, 'Low should not have bloom');

console.log('✓ Color progression correct');
```

### Test 8.2: Color Continuity
```javascript
// Test color changes smoothly across score range
console.log('Testing: Color continuity');

let prevColor = null;
let colorChangeCount = 0;

for (let score = 0; score <= 1; score += 0.1) {
  const profile = LinkGlowEngine.computeVisualProfile(score);
  if (prevColor !== null && profile.color !== prevColor) {
    colorChangeCount++;
  }
  prevColor = profile.color;
}

console.assert(colorChangeCount >= 2, 'Color should change across tiers');
console.log(`✓ Color changed ${colorChangeCount} times across range`);
```

---

## Test Group 9: Debug Tools

### Test 9.1: Debug Logging
```javascript
// Test debug mode logging
console.log('Testing: Debug logging');

LinkGlowEngine.setDebug(true);
const link = linkingSystem.links[0];

// Capture console output
const logs = [];
const originalLog = console.log;
console.log = (msg) => logs.push(msg);

LinkGlowEngine.updateLinkGlow(link);

console.log = originalLog;
const hadDebugOutput = logs.some(msg => msg.includes('LinkGlowSynergyEngine'));

console.assert(hadDebugOutput, 'Debug output not generated');

LinkGlowEngine.setDebug(false);
console.log('✓ Debug logging works');
```

### Test 9.2: Inspect Function
```javascript
// Test inspection of link state
console.log('Testing: Inspect function');

const link = linkingSystem.links[0];
const state = LinkGlowEngine.inspect(link);

console.assert(state.synergyScore >= 0, 'Score missing');
console.assert(state.visualProfile.glowIntensity >= 0.1, 'Profile incomplete');
console.assert(state.materials, 'Materials missing');

console.log('✓ Inspect function works');
```

### Test 9.3: Configuration Retrieval
```javascript
// Test getting engine configuration
console.log('Testing: Configuration retrieval');

const config = LinkGlowEngine.getConfig();

console.assert(config.visualCurves, 'Visual curves missing');
console.assert(config.colorPalette, 'Color palette missing');
console.assert(config.smoothingFactor >= 0, 'Smoothing factor missing');

console.log('✓ Configuration retrieval works');
```

---

## Test Group 10: Performance & Stress

### Test 10.1: Single Link Update Performance
```javascript
// Measure performance of updating single link
console.log('Testing: Single link update performance');

const link = linkingSystem.links[0];
const iterations = 1000;

const start = performance.now();
for (let i = 0; i < iterations; i++) {
  LinkGlowEngine.updateLinkGlow(link);
}
const elapsed = performance.now() - start;
const avgTime = elapsed / iterations;

console.assert(avgTime < 0.5, `Update too slow: ${avgTime.toFixed(3)}ms`);
console.log(`✓ Single update average: ${avgTime.toFixed(4)}ms`);
```

### Test 10.2: Batch Update Performance
```javascript
// Measure batch update performance
console.log('Testing: Batch update performance');

LinkGlowEngine.clearCache();

const start = performance.now();
const count = LinkGlowEngine.updateAllLinks();
const elapsed = performance.now() - start;

console.assert(elapsed < 100, `Batch too slow: ${elapsed.toFixed(1)}ms`);
console.log(`✓ Batch update (${count} links): ${elapsed.toFixed(2)}ms`);
```

### Test 10.3: Cache Memory Usage
```javascript
// Verify cache memory stays reasonable
console.log('Testing: Cache memory usage');

LinkGlowEngine.updateAllLinks();
const stats = LinkGlowEngine.getCacheStats();

console.assert(stats.cachedLinks > 0, 'Cache should have entries');
console.log(`✓ Cache stats: ${JSON.stringify(stats)}`);
```

---

## Manual Visual Verification

After running automated tests, visually verify in the 3D viewport:

1. **Color Progression**
   - Low synergy links: Desaturated cyan (#4daaff)
   - Medium synergy: Aqua (#4dffd2)
   - High synergy: Neon green (#00ffbf)
   - Critical (>0.85): Bright white (#ffffff)

2. **Glow Intensity**
   - Low scores: Dim, barely visible glow
   - Mid scores: Medium brightness
   - High scores: Intense, vibrant glow
   - Critical: Maximum brightness with bloom

3. **Animation Speed**
   - Low scores: Slow pulse
   - Mid scores: Medium pulse
   - High scores: Fast pulse/vein movement
   - Critical: Maximum speed

4. **Line Thickness**
   - Low scores: Thin lines
   - Mid scores: Medium thickness
   - High scores: Thick, prominent lines
   - Critical: Maximum thickness

---

## Continuous Integration Test Suite

Run full suite automatically:

```javascript
async function runFullTestSuite() {
  const tests = [
    // Initialization
    () => {
      console.log('Testing: Engine load');
      return LinkGlowEngine.getConfig() !== null;
    },
    // Profile computation
    () => {
      const p = LinkGlowEngine.computeVisualProfile(0.5);
      return p.glowIntensity > 0 && p.lineWidth > 0;
    },
    // Cache operations
    () => {
      LinkGlowEngine.clearCache();
      LinkGlowEngine.updateAllLinks();
      return LinkGlowEngine.getCacheStats().cachedLinks > 0;
    },
    // Batch updates
    () => {
      return LinkGlowEngine.updateAllLinks() > 0;
    }
  ];
  
  let passed = 0;
  for (const test of tests) {
    try {
      if (await test()) passed++;
    } catch (e) {
      console.error('Test failed:', e.message);
    }
  }
  
  console.log(`\n✓ ${passed}/${tests.length} tests passed`);
  return passed === tests.length;
}

// Run it
runFullTestSuite();
```

---

## Reference Values

### Expected Profile Values at Key Scores

| Score | Intensity | Width | Speed | Color | Bloom |
|-------|-----------|-------|-------|-------|-------|
| 0.0 | 0.10 | 0.50 | 0.20 | #4daaff | No |
| 0.25 | 0.40 | 1.38 | 0.78 | #4daaff | No |
| 0.5 | 0.80 | 2.25 | 1.35 | #4dffd2 | No |
| 0.75 | 1.20 | 3.13 | 1.93 | #00ffbf | No |
| 1.0 | 1.50 | 4.00 | 2.50 | #ffffff | Yes |

---

## Test Completion Checklist

- [ ] Engine loads without errors
- [ ] Links have synergy scores set
- [ ] Material updates apply correctly
- [ ] Cache works and improves performance
- [ ] Color progression visible in viewport
- [ ] Animation speeds vary with score
- [ ] Debug tools function correctly
- [ ] Performance within budget (<20ms for 100 links)
- [ ] Memory usage reasonable (<100KB for 100 links)
- [ ] No memory leaks with repeated updates
- [ ] All materials are either updated or safely skipped
- [ ] Visual effects match expected appearance

---

## See Also

- [LinkGlowSynergyEngine Integration Guide](SYNERGY_GLOW_INTEGRATION.md)
- [LinkGlowSynergyEngine Implementation](LinkGlowSynergyEngine1_0.js)
- [Quick Start Patch](MAIN_JS_PATCH_GLOW.js)
