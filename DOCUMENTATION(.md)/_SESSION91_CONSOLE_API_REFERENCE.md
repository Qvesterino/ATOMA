# SESSION 91: Particle Emission Scaler Console API
## Quick Reference for Testing & Debugging

---

## BASIC QUERIES

### Get Current Emission Multiplier

```javascript
ATOMA.main.particleEmissionScaler.getEmissionMultiplier()
// Returns: 1.523 (1.523x more particles than baseline)
```

### Get Raw (Unsmoothed) Multiplier

```javascript
ATOMA.main.particleEmissionScaler.getRawEmissionMultiplier()
// Returns: 1.519 (immediate, before EMA smoothing)
```

### Get All Network Metrics

```javascript
ATOMA.main.particleEmissionScaler.getNetworkMetrics()
// Returns:
// {
//   corruption: "0.451",
//   stress: "0.623",
//   load: "0.623",
//   avgLinkDegradation: "0.234",
//   emissionMultiplier: "1.523",
//   rawMultiplier: "1.519"
// }
```

### Get Emission Statistics

```javascript
ATOMA.main.particleEmissionScaler.getEmissionStatistics()
// Returns:
// {
//   totalLinks: 45,
//   avgMultiplier: "1.289",
//   minMultiplier: "1.000",
//   maxMultiplier: "1.823"
// }
```

---

## PER-LINK QUERIES

### Get Multiplier for Specific Link

```javascript
const link = ATOMA.main.linkingSystem.links[0];
const mult = ATOMA.main.particleEmissionScaler.getLinkEmissionMultiplier(link);
// Returns: 1.45 (1.45x multiplier for this link)
```

### Get Multiplier for All Links

```javascript
function getAllLinkMultipliers() {
  const scaler = ATOMA.main.particleEmissionScaler;
  const results = [];
  
  for (const link of ATOMA.main.linkingSystem.links) {
    const mult = scaler.getLinkEmissionMultiplier(link);
    const quality = link.userData?.quality?.score ?? 0;
    
    results.push({
      quality: quality.toFixed(0),
      multiplier: mult.toFixed(2)
    });
  }
  
  return results;
}

console.table(getAllLinkMultipliers());
```

---

## PER-NODE QUERIES

### Get Multiplier for Specific Node

```javascript
const node = ATOMA.main.aiNodes.nodes[0];
const mult = ATOMA.main.particleEmissionScaler.getNodeEmissionMultiplier(node);
// Returns: 1.23 (1.23x multiplier for this node)
```

### Get Multiplier for All Nodes

```javascript
function getAllNodeMultipliers() {
  const scaler = ATOMA.main.particleEmissionScaler;
  const results = [];
  
  for (const node of ATOMA.main.aiNodes.nodes) {
    const mult = scaler.getNodeEmissionMultiplier(node);
    const corruption = node.userData?.metrics?.corruption ?? 0;
    
    results.push({
      category: node.userData?.category || 'unknown',
      corruption: corruption.toFixed(2),
      multiplier: mult.toFixed(2)
    });
  }
  
  return results;
}

console.table(getAllNodeMultipliers());
```

---

## SCALED PARTICLE COUNTS

### Calculate Scaled Particle Count for Link

```javascript
const link = ATOMA.main.linkingSystem.links[0];
const baseCount = 10;  // Base particles

const networkMult = ATOMA.main.particleEmissionScaler.getEmissionMultiplier();
const linkMult = ATOMA.main.particleEmissionScaler.getLinkEmissionMultiplier(link);
const scaledCount = Math.round(baseCount * networkMult * linkMult);

console.log(`Base: ${baseCount}, Scaled: ${scaledCount}`);
// Output: "Base: 10, Scaled: 15"
```

### Calculate Scaled Particle Count for Node

```javascript
const node = ATOMA.main.aiNodes.nodes[0];
const baseCount = 20;

const networkMult = ATOMA.main.particleEmissionScaler.getEmissionMultiplier();
const nodeMult = ATOMA.main.particleEmissionScaler.getNodeEmissionMultiplier(node);
const scaledCount = Math.round(baseCount * networkMult * nodeMult);

console.log(`Scaled count: ${scaledCount}`);
```

---

## DETAILED ANALYSIS

### Full Network State Report

```javascript
function networkEmissionReport() {
  const scaler = ATOMA.main.particleEmissionScaler;
  const metrics = scaler.getNetworkMetrics();
  const stats = scaler.getEmissionStatistics();
  
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   NETWORK PARTICLE EMISSION REPORT    ║');
  console.log('╠═══════════════════════════════════════╣');
  console.log(`║ Corruption:     ${metrics.corruption.padEnd(22)} ║`);
  console.log(`║ Stress:         ${metrics.stress.padEnd(22)} ║`);
  console.log(`║ Load:           ${metrics.load.padEnd(22)} ║`);
  console.log(`║ Link Degr:      ${metrics.avgLinkDegradation.padEnd(22)} ║`);
  console.log('├───────────────────────────────────────┤');
  console.log(`║ Emission Mult:  ${metrics.emissionMultiplier.padEnd(22)} ║`);
  console.log(`║ Avg Link Mult:  ${stats.avgMultiplier.padEnd(22)} ║`);
  console.log('╠═══════════════════════════════════════╣');
  console.log(`║ Total Links:    ${stats.totalLinks.toString().padEnd(22)} ║`);
  console.log(`║ Min Mult:       ${stats.minMultiplier.padEnd(22)} ║`);
  console.log(`║ Max Mult:       ${stats.maxMultiplier.padEnd(22)} ║`);
  console.log('╚═══════════════════════════════════════╝');
}

networkEmissionReport();
```

### Per-Link Detailed Analysis

```javascript
function analyzeLink(index = 0) {
  const scaler = ATOMA.main.particleEmissionScaler;
  const link = ATOMA.main.linkingSystem.links[index];
  
  if (!link) {
    console.log('Link not found');
    return;
  }
  
  const quality = link.userData?.quality || {};
  const mult = scaler.getLinkEmissionMultiplier(link);
  
  console.log(`Link ${index}:`);
  console.log(`  Quality Score: ${quality.score?.toFixed(1) ?? 'N/A'}`);
  console.log(`  Corruption: ${quality.corruption?.toFixed(1) ?? 'N/A'}%`);
  console.log(`  Harmony: ${quality.harmony?.toFixed(1) ?? 'N/A'}`);
  console.log(`  Load: ${quality.load?.toFixed(1) ?? 'N/A'}`);
  console.log(`  Emission Multiplier: ${mult.toFixed(2)}x`);
}

analyzeLink(0);  // Analyze first link
```

### Per-Node Detailed Analysis

```javascript
function analyzeNode(index = 0) {
  const scaler = ATOMA.main.particleEmissionScaler;
  const node = ATOMA.main.aiNodes.nodes[index];
  
  if (!node) {
    console.log('Node not found');
    return;
  }
  
  const metrics = node.userData?.metrics || {};
  const mult = scaler.getNodeEmissionMultiplier(node);
  
  console.log(`Node ${index}:`);
  console.log(`  Category: ${node.userData?.category}`);
  console.log(`  Corruption: ${metrics.corruption?.toFixed(2) ?? 'N/A'}`);
  console.log(`  Stability: ${metrics.stability?.toFixed(2) ?? 'N/A'}`);
  console.log(`  Harmony: ${metrics.harmony?.toFixed(2) ?? 'N/A'}`);
  console.log(`  Particle Multiplier: ${mult.toFixed(2)}x`);
}

analyzeNode(0);  // Analyze first node
```

---

## MONITORING

### Real-Time Emission Tracking

```javascript
let monitorInterval = setInterval(() => {
  const mult = ATOMA.main.particleEmissionScaler.getEmissionMultiplier();
  const metrics = ATOMA.main.particleEmissionScaler.getNetworkMetrics();
  
  console.clear();
  console.log(`📊 EMISSION MONITOR`);
  console.log(`Multiplier: ${(mult * 100).toFixed(0)}%`);
  console.log(`Corruption: ${(parseFloat(metrics.corruption) * 100).toFixed(0)}%`);
  console.log(`Stress: ${(parseFloat(metrics.stress) * 100).toFixed(0)}%`);
}, 1000);

// Stop with: clearInterval(monitorInterval);
```

### Distribution Analysis

```javascript
function analyzeMultiplierDistribution() {
  const scaler = ATOMA.main.particleEmissionScaler;
  const stats = scaler.getEmissionStatistics();
  
  const avg = parseFloat(stats.avgMultiplier);
  const min = parseFloat(stats.minMultiplier);
  const max = parseFloat(stats.maxMultiplier);
  
  const range = max - min;
  const spread = range / avg * 100;
  
  console.log(`Link Multiplier Distribution:`);
  console.log(`  Average: ${avg.toFixed(2)}x`);
  console.log(`  Min: ${min.toFixed(2)}x`);
  console.log(`  Max: ${max.toFixed(2)}x`);
  console.log(`  Range: ${range.toFixed(2)}x`);
  console.log(`  Spread: ${spread.toFixed(1)}% (variance from average)`);
}

analyzeMultiplierDistribution();
```

---

## STRESS TESTING

### Create High Corruption Scenario

```javascript
function stressTestHighCorruption() {
  console.log('Creating high-corruption scenario...');
  
  // This is pseudo-code - you'd need to actually corrupt nodes
  // For testing, just wait for natural corruption to build
  
  setTimeout(() => {
    const metrics = ATOMA.main.particleEmissionScaler.getNetworkMetrics();
    const mult = ATOMA.main.particleEmissionScaler.getEmissionMultiplier();
    
    console.log(`Corruption level: ${metrics.corruption}`);
    console.log(`Particle multiplier: ${mult.toFixed(2)}x`);
    
    if (parseFloat(metrics.corruption) > 0.7) {
      console.log('✓ High corruption achieved');
      console.log(`  Expected 1.8-2.0x emission, got ${mult.toFixed(2)}x`);
    }
  }, 5000);
}
```

### Create High Stress Scenario

```javascript
function stressTestHighLoad() {
  console.log('Creating high-load scenario...');
  
  // Link many nodes together to create stress
  const nodes = ATOMA.main.aiNodes.nodes.slice(0, 20);
  for (let i = 0; i < nodes.length - 1; i++) {
    ATOMA.main.linkingSystem.linkNodes(nodes[i], nodes[i + 1]);
  }
  
  setTimeout(() => {
    const metrics = ATOMA.main.particleEmissionScaler.getNetworkMetrics();
    const mult = ATOMA.main.particleEmissionScaler.getEmissionMultiplier();
    
    console.log(`Network stress: ${metrics.stress}`);
    console.log(`Particle multiplier: ${mult.toFixed(2)}x`);
    
    if (parseFloat(metrics.stress) > 0.6) {
      console.log('✓ High stress achieved');
      console.log(`  Expected 1.3-1.5x emission, got ${mult.toFixed(2)}x`);
    }
  }, 1000);
}
```

---

## CONFIGURATION QUERIES

### View Current Configuration

```javascript
function showConfiguration() {
  const scaler = ATOMA.main.particleEmissionScaler;
  
  console.log('ParticleEmissionScaler Configuration:');
  console.log(`  Corruption Multiplier: ${scaler.config.corruptionMultiplier}x`);
  console.log(`  Corruption Threshold: ${scaler.config.corruptionThreshold}`);
  console.log(`  Corruption Curve: ${scaler.config.corruptionCurve}`);
  console.log(`  Stress Multiplier: ${scaler.config.stressMultiplier}x`);
  console.log(`  Stress Threshold: ${scaler.config.stressThreshold}`);
  console.log(`  Load Multiplier: ${scaler.config.loadMultiplier}x`);
  console.log(`  Per-Link Corruption Mult: ${scaler.config.perLinkCorruptionMultiplier}x`);
  console.log(`  EMA Alpha: ${scaler.config.emissionEMAAlpha}`);
  console.log(`  Enabled: ${scaler.config.enabled}`);
}

showConfiguration();
```

---

## DEBUGGING

### Enable Debug Mode

```javascript
ATOMA.main.particleEmissionScaler.config.debugMode = true;
// Now logs detailed info every frame
```

### Disable Debug Mode

```javascript
ATOMA.main.particleEmissionScaler.config.debugMode = false;
```

### Test Disable/Enable

```javascript
// Temporarily disable
ATOMA.main.particleEmissionScaler.config.enabled = false;
// (multiplier should stay at 1.0)

// Re-enable
ATOMA.main.particleEmissionScaler.config.enabled = true;
```

### Reset System

```javascript
ATOMA.main.particleEmissionScaler.reset();
console.log('Particle emission scaler reset');
```

---

## QUICK DIAGNOSTICS

### One-Liner Status Check

```javascript
console.log(
  `Emission: ${ATOMA.main.particleEmissionScaler.getEmissionMultiplier().toFixed(2)}x | ` +
  `Links: ${ATOMA.main.linkingSystem.links.length} | ` +
  `Corruption: ${(parseFloat(ATOMA.main.particleEmissionScaler.getNetworkMetrics().corruption) * 100).toFixed(0)}%`
);
```

### Copy-Paste Full Diagnostic

```javascript
(function() {
  const s = ATOMA.main.particleEmissionScaler;
  const m = s.getNetworkMetrics();
  const st = s.getEmissionStatistics();
  console.log(`Emission:${s.getEmissionMultiplier().toFixed(2)}x Corr:${m.corruption} Stress:${m.stress} Links:${st.totalLinks}`);
})();
```

---

## SUMMARY

**Key Functions**:
- `getEmissionMultiplier()` — Network-wide multiplier (main query)
- `getLinkEmissionMultiplier(link)` — Per-link multiplier
- `getNodeEmissionMultiplier(node)` — Per-node multiplier
- `getNetworkMetrics()` — All current metrics
- `getEmissionStatistics()` — Link multiplier stats

**Configuration Keys**:
- `corruptionMultiplier` — Max multiplier from corruption
- `stressMultiplier` — Max multiplier from stress
- `loadMultiplier` — Max multiplier from load
- `corruptionThreshold` — Start scaling point (corruption)
- `stressThreshold` — Start scaling point (stress)

Ready to test and debug particle emission scaling!
