# Bead System Advanced Configuration Guide

## Overview

This guide covers advanced configuration scenarios, custom presets, and optimization strategies for specific use cases.

---

## Custom Presets

### Mobile-Optimized Configuration

For mobile devices with limited GPU:

```javascript
import BeadSystemTuning from './BeadSystemTuning.js';
import { BEAD_CONFIG } from './LinkBeadSystem.js';

const MOBILE_PRESET = {
  spawn: {
    baseRate: 1.0,           // Very few beads
    minActivityThreshold: 0.2
  },
  opacity: 0.5,              // More transparent (less memory)
  emissiveIntensity: 0.2,
  roughness: 0.7,
  metalness: 0.1,
  maxBeadsPerLink: 8,        // Very small pool
  synergyCoupling: {
    enabled: true,
    minMultiplier: 0.5,
    maxMultiplier: 1.0
  }
};

BeadSystemTuning.applyPreset(MOBILE_PRESET);
```

### High-Performance Desktop Configuration

For high-end systems with no performance constraints:

```javascript
const DESKTOP_PRESET = {
  spawn: {
    baseRate: 6.0,
    minActivityThreshold: 0.1
  },
  opacity: 0.8,
  emissiveIntensity: 0.5,
  roughness: 0.3,
  metalness: 0.5,
  maxBeadsPerLink: 40,
  synergyCoupling: {
    enabled: true,
    minMultiplier: 0.5,
    maxMultiplier: 1.3
  }
};

BeadSystemTuning.applyPreset(DESKTOP_PRESET);
```

### Data Center Network Configuration

For dense networks with thousands of links:

```javascript
const DATACENTER_PRESET = {
  spawn: {
    baseRate: 0.5,           // Minimal beads
    minActivityThreshold: 0.25
  },
  opacity: 0.4,
  emissiveIntensity: 0.15,
  roughness: 0.9,
  metalness: 0.0,
  maxBeadsPerLink: 5,        // Smallest pool
  synergyCoupling: {
    enabled: true,
    minMultiplier: 0.4,
    maxMultiplier: 0.8
  }
};

BeadSystemTuning.applyPreset(DATACENTER_PRESET);
```

### Educational/Demonstration Configuration

For maximum clarity and visual impact:

```javascript
const DEMO_PRESET = {
  spawn: {
    baseRate: 8.0,           // Many beads
    minActivityThreshold: 0.05  // Spawn easily
  },
  opacity: 0.9,
  emissiveIntensity: 0.6,
  roughness: 0.4,
  metalness: 0.4,
  maxBeadsPerLink: 50,
  synergyCoupling: {
    enabled: true,
    minMultiplier: 0.6,
    maxMultiplier: 1.4
  }
};

BeadSystemTuning.applyPreset(DEMO_PRESET);
```

---

## Responsive Configuration

Automatically adjust beads based on network size:

```javascript
function configureBasedOnNetworkSize(nodeCount, linkCount) {
  const density = linkCount / Math.max(1, nodeCount);
  
  if (density < 0.5) {
    // Sparse network - show more beads
    BeadSystemTuning.applyPreset(PRESET_EXPRESSIVE);
  } else if (density < 1.5) {
    // Medium density - balanced
    BeadSystemTuning.applyPreset(PRESET_BALANCED);
  } else if (density < 3.0) {
    // Dense network - fewer beads
    BeadSystemTuning.applyPreset(PRESET_CONSERVATIVE);
  } else {
    // Very dense - minimal beads
    BeadSystemTuning.applyPreset(PRESET_CONSERVATIVE);
    BeadSystemTuning.setSpawnRate(0.5);
  }
}

// Usage
configureBasedOnNetworkSize(50, 100);
```

---

## Performance-Based Configuration

Dynamically adjust based on frame rate:

```javascript
import { getBeadPerformanceGrade } from './BeadPerformanceMonitor.js';

function adaptToPerformance() {
  const grade = getBeadPerformanceGrade();
  
  switch (grade) {
    case 'A (Excellent)':
      // Can handle more
      BeadSystemTuning.setSpawnRate(5.0);
      BeadSystemTuning.setMaxBeadsPerLink(30);
      break;
      
    case 'B (Good)':
      // Balanced
      BeadSystemTuning.setSpawnRate(3.0);
      BeadSystemTuning.setMaxBeadsPerLink(20);
      break;
      
    case 'C (Fair)':
    case 'D (Poor)':
    case 'F (Critical)':
      // Reduce load
      BeadSystemTuning.setSpawnRate(1.0);
      BeadSystemTuning.setMaxBeadsPerLink(10);
      break;
  }
}

// Monitor performance every second
setInterval(adaptToPerformance, 1000);
```

---

## Synergy-Based Configuration

Adjust beads based on overall network synergy:

```javascript
function configureBasedOnNetworkSynergy(avgSynergy) {
  if (avgSynergy > 0.8) {
    // High-synergy network - visible beads
    BeadSystemTuning.setOpacity(0.8);
    BeadSystemTuning.setEmissiveIntensity(0.45);
    BeadSystemTuning.setSpawnRate(4.0);
  } else if (avgSynergy > 0.5) {
    // Medium synergy - balanced
    BeadSystemTuning.setOpacity(0.7);
    BeadSystemTuning.setEmissiveIntensity(0.35);
    BeadSystemTuning.setSpawnRate(3.0);
  } else {
    // Low synergy - subtle
    BeadSystemTuning.setOpacity(0.5);
    BeadSystemTuning.setEmissiveIntensity(0.2);
    BeadSystemTuning.setSpawnRate(1.0);
  }
}
```

---

## Advanced Effects Configuration

### Trail Effects

Enable subtle trails behind beads:

```javascript
import BeadEffects from './LinkBeadVisualEffects.js';

BeadEffects.BEAD_EFFECTS_CONFIG.trails = {
  enabled: true,
  maxTrailLength: 8,
  trailOpacity: 0.1,
  updateFrequency: 1  // Every frame
};
```

### Pulsing Effects

Add rhythmic pulsing to beads:

```javascript
BeadEffects.BEAD_EFFECTS_CONFIG.pulsing = {
  enabled: true,
  frequency: 2.5,      // Hz
  minIntensity: 0.6,
  maxIntensity: 1.4
};
```

### Rotation Effects

Add visual interest with rotating beads:

```javascript
BeadEffects.BEAD_EFFECTS_CONFIG.rotation = {
  enabled: true,
  speed: 2.0  // Radians per second
};
```

---

## Link-Specific Configuration

### Configure beads for individual links:

```javascript
function customizeLink(link, config) {
  const viz = link.group?.userData?.conduitState?.beads;
  const pool = viz?.pool;
  
  if (pool) {
    // Override spawn rate
    pool.maxBeads = config.maxBeads || 20;
    
    // Override synergy coupling
    if (config.synergyCoupling !== undefined) {
      pool.synergyCoupling = config.synergyCoupling;
    }
  }
}

// Examples
customizeLink(importantLink, { maxBeads: 30 });
customizeLink(lowPriorityLink, { maxBeads: 5 });
```

---

## Debugging & Monitoring

### Enable full debug output:

```javascript
import { initBeadDebugController } from './BeadDebugUtils.js';

// Initialize debug controller
const debug = initBeadDebugController(scene);

// Use console API
window.beadDebug.help();           // Show all commands
window.beadDebug.stats();          // Print performance stats
window.beadDebug.beadCounts();     // Show beads per link
window.beadDebug.showPaths();      // Visualize link curves
window.beadDebug.showBounds();     // Show bead spheres
window.beadDebug.allDiagnostics(); // Run diagnostics
```

### Automated monitoring:

```javascript
import { getGlobalMonitor, printBeadPerformanceReport } from './BeadPerformanceMonitor.js';

const monitor = getGlobalMonitor();

// Print report every 10 seconds
setInterval(() => {
  monitor.updateMetrics(links);
  printBeadPerformanceReport();
}, 10000);
```

---

## Optimization Strategies

### Strategy 1: Density-Based Limiting

```javascript
function limitBeadsByLinkDensity(nodeLinkingSystem) {
  const avgLinksPerNode = nodeLinkingSystem.links.length / 
                          nodeLinkingSystem.nodes.length;
  
  if (avgLinksPerNode > 5) {
    BeadSystemTuning.setMaxBeadsPerLink(10);
  } else if (avgLinksPerNode > 2) {
    BeadSystemTuning.setMaxBeadsPerLink(20);
  } else {
    BeadSystemTuning.setMaxBeadsPerLink(30);
  }
}
```

### Strategy 2: Activity-Based Culling

```javascript
function cullBeadsByActivity(links) {
  for (const link of links) {
    const activity = link.synergyScore + link.traffic.load / 2;
    
    if (activity < 0.1) {
      // Skip completely
      link.group?.userData?.conduitState?.beads?.pool?.beads.forEach(b => b.isActive = false);
    }
  }
}
```

### Strategy 3: Temporal Sampling

```javascript
let frameCounter = 0;

function temporalBeadSampling() {
  frameCounter++;
  
  if (frameCounter % 2 === 0) {
    // Update beads only every other frame
    BeadSystemTuning.setSpawnRate(
      BeadSystemTuning.getConfig().spawn.baseRate * 0.5
    );
  }
}
```

---

## Troubleshooting Advanced Scenarios

### Problem: Beads lag at network edges

**Solution**: Increase `fadeDistance` to fade beads further from target:

```javascript
import { BEAD_CONFIG } from './LinkBeadSystem.js';
BEAD_CONFIG.fadeDistance = 0.2;  // Fade over 20% of link
```

### Problem: Beads too bright in dark scenes

**Solution**: Reduce `emissiveIntensity`:

```javascript
BeadSystemTuning.setEmissiveIntensity(0.15);
```

### Problem: Beads not visible enough in bright scenes

**Solution**: Increase opacity and intensity:

```javascript
BeadSystemTuning.setOpacity(0.9);
BeadSystemTuning.setEmissiveIntensity(0.6);
BeadSystemTuning.setRoughness(0.3);  // Shinier
```

### Problem: Memory usage too high

**Solution**: Reduce pool size and spawn rate:

```javascript
BeadSystemTuning.setMaxBeadsPerLink(5);
BeadSystemTuning.setSpawnRate(0.5);
```

---

## Best Practices

1. **Start with presets**: Don't create custom configs from scratch
2. **Monitor performance**: Use `printBeadPerformanceReport()` regularly
3. **Test on target hardware**: Mobile requires different settings than desktop
4. **Adjust gradually**: Change one parameter at a time
5. **Document custom configs**: Comment why you chose specific values
6. **Use edge case handler**: Run diagnostics on unusual networks

---

## Configuration Reference

| Parameter | Range | Default | Impact |
|-----------|-------|---------|--------|
| `spawn.baseRate` | 0.1-10 | 3.0 | Beads per second |
| `opacity` | 0.1-1.0 | 0.7 | Transparency |
| `emissiveIntensity` | 0.0-2.0 | 0.35 | Glow strength |
| `roughness` | 0.0-1.0 | 0.5 | Surface finish |
| `metalness` | 0.0-1.0 | 0.3 | Shine amount |
| `maxBeadsPerLink` | 1-100 | 20 | Pool size |
| `fadeDistance` | 0.01-1.0 | 0.1 | Fade zone size |

---

For more information, see the main documentation files.
