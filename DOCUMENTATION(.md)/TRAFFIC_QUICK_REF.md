# TrafficEngine Quick Reference

## 30-Second Setup

```typescript
import { TrafficEngine } from './TrafficEngine';

const engine = new TrafficEngine(nodesMap, linksArray, synergyEngine);
```

---

## Core API

| Method | Purpose | Returns |
|--------|---------|---------|
| `update(delta)` | Update sim | void |
| `getTraffic(linkId)` | Single link | TrafficState |
| `getAllTraffic()` | All links | TrafficState[] |
| `getNetworkTraffic()` | Stats | NetworkStats |
| `getAllPulses()` | All particles | PulseParticle[] |

---

## TrafficState

```typescript
{
  linkId: string;
  load: number;         // 0.0-1.0
  speed: number;        // 0.1-3.0
  active: boolean;
  pulses: PulseParticle[];
  energy: number;       // 0.0-1.0
  type: string;         // synergy type
}
```

---

## Pulse Particle

```typescript
{
  id: string;
  t: number;            // 0.0-1.0 along link
  velocity: number;     // speed
  energy: number;       // 0.0-1.0 brightness
  createdAt: number;
  color?: string;
}
```

---

## Basic Usage (Render Loop)

```typescript
// Update
trafficEngine.update(delta);

// Get traffic
const traffic = trafficEngine.getTraffic('link-1');

// Use for shader
uniform_load = traffic.load;
uniform_speed = traffic.speed;

// Render pulses
const pulses = trafficEngine.getAllPulses();
pulses.forEach(pulse => {
  renderAt(bezierPoint(link, pulse.t), pulse.energy);
});
```

---

## Load Explanation

```
0.0-0.2: Minimal
0.2-0.5: Light
0.5-0.7: Moderate
0.7-0.85: Heavy
0.85-1.0: Congestion
```

---

## Spawn Rate (pulses/second)

```
Load >= 0.7: 2-3 pulses/sec
Load >= 0.3: 1 pulse/sec
Load < 0.3: 0.2-0.33 pulses/sec
```

---

## Configuration

```typescript
const config = {
  maxPulseSpeed: 1.5,      // 0.5-3.0
  maxBandwidth: 1.0,       // 0.5-2.0
  pulseSpawnRate: 1.0,     // Multiplier
  pulseLifetime: 5.0,      // Seconds
  maxPulsesPerLink: 10,    // Cap
  quantumRandomness: true,
  enableLoadSpikes: true,
  spikeIntensity: 1.5,
};

const engine = new TrafficEngine(
  nodesMap,
  linksArray,
  synergyEngine,
  config
);
```

---

## Presets

```typescript
import {
  createDefaultTrafficConfig,
  createHighTrafficConfig,
  createConservativeTrafficConfig,
} from './TrafficEngine';

// Balanced
const config1 = createDefaultTrafficConfig();

// High traffic (stress test)
const config2 = createHighTrafficConfig();

// Conservative (minimal)
const config3 = createConservativeTrafficConfig();
```

---

## Network Stats

```typescript
const stats = trafficEngine.getNetworkTraffic();

stats.avgLoad          // 0.0-1.0
stats.maxLoad
stats.minLoad
stats.avgSpeed
stats.totalPulses
stats.activeLinks
stats.congestion       // % of links > 0.7 load
```

---

## Analysis

```typescript
// High traffic
trafficEngine.findHotspots(0.7)

// Slow + congested
trafficEngine.findBottlenecks(0.5, 0.5)

// Latency estimate
trafficEngine.getAverageLatency()

// Future prediction
trafficEngine.predictTrafficTrend(1.0) // 1 sec ahead

// All particles
trafficEngine.getAllPulses()
```

---

## Quick Diagnostic

```typescript
const diag = trafficEngine.getDiagnostics();
console.log(diag);
// Shows elapsed time, pulse count, config, stats
```

---

## Common Patterns

### Pattern 1: Render Loop

```typescript
function animate() {
  trafficEngine.update(0.016);
  
  const traffic = trafficEngine.getTraffic(linkId);
  material.uniforms.load.value = traffic.load;
  material.uniforms.speed.value = traffic.speed;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

### Pattern 2: Monitor Network

```typescript
setInterval(() => {
  const stats = trafficEngine.getNetworkTraffic();
  console.log(`Load: ${(stats.avgLoad*100).toFixed(0)}%`);
  console.log(`Congestion: ${stats.congestion.toFixed(1)}%`);
}, 1000);
```

### Pattern 3: Find Problems

```typescript
const bottlenecks = trafficEngine.findBottlenecks();
bottlenecks.forEach(t => {
  console.log(`Fix: ${t.linkId}`);
});
```

### Pattern 4: Render Particles

```typescript
trafficEngine.getAllPulses().forEach(pulse => {
  const pos = getBezierPoint(curve, pulse.t);
  const color = pulse.energy > 0.7 ? 'bright' : 'dim';
  renderParticle(pos, color);
});
```

---

## Load Calculation

**Load = base energy + synergy bonuses + layer adjustments**

```
base = synergy.energy

+ type bonus:
  fusion:     +0.2
  quantum:    +random(0-0.3)
  sigma:      ×1.2
  fractal:    +0.1
  complement: +0.05

+ layer:
  has quantum: +0.15
  has sigma:   ×0.8

clamp 0.0-1.0
```

---

## Speed Calculation

**Speed = base score + type modifier × maxPulseSpeed**

```
base = 0.4 + synergy.score × 0.3

× modifier:
  fusion:    ×1.3
  quantum:   ×0.8-1.2 (random)
  sigma:     ×0.9
  linear:    ×0.8

clamp 0.1-3.0
```

---

## Node/Link Methods

```typescript
// Outgoing traffic
trafficEngine.getTrafficFromNode('node-1')

// Incoming traffic
trafficEngine.getTrafficToNode('node-2')

// Update nodes
trafficEngine.setNodes(newNodesMap)

// Update links
trafficEngine.setLinks(newLinksArray)

// Update synergy
trafficEngine.setSynergyEngine(newEngine)
```

---

## Export for Visualization

```typescript
const viz = trafficEngine.exportTrafficVisualization();

// viz.links: [{ id, from, to, load, speed, pulseCount }, ...]
// viz.pulses: [{ id, linkId, position, energy }, ...]
// viz.networkStats: { avgLoad, maxLoad, ... }
```

---

## Performance Tips

1. **Reduce pulse cap** - Lower `maxPulsesPerLink`
2. **Disable spikes** - Set `enableLoadSpikes: false`
3. **Lower spawn rate** - Reduce `pulseSpawnRate`
4. **Extend lifetime** - Increase `pulseLifetime`
5. **Conservative config** - Use `createConservativeTrafficConfig()`

---

## Troubleshooting

| Issue | Check |
|-------|-------|
| No traffic | Synergy energy > 0? |
| Pulses not moving | Velocity > 0? Delta > 0? |
| Performance slow | Reduce maxPulsesPerLink |
| Wrong load | Check synergy type bonus |
| Particles not rendering | Get pulses, check t and energy |

---

## Common Values

| Parameter | Typical | Min | Max |
|-----------|---------|-----|-----|
| Load | 0.5 | 0.0 | 1.0 |
| Speed | 1.0 | 0.1 | 3.0 |
| Energy | 0.6 | 0.0 | 1.0 |
| Pulse t | varies | 0.0 | 1.0 |
| Velocity | 0.3-0.6 | 0.1 | 2.0 |

---

## Type Imports

```typescript
import {
  Node,
  Link,
  PulseParticle,
  TrafficState,
  TrafficEngineConfig,
  TrafficEngine,
} from './TrafficEngine';
```

---

## One-Minute Example

```typescript
import { TrafficEngine } from './TrafficEngine';

// Setup
const engine = new TrafficEngine(
  nodesMap,
  linksArray,
  synergyEngine
);

// Update loop
function animate(delta) {
  engine.update(delta);
  
  // Get traffic
  const traffic = engine.getTraffic('link-1');
  console.log(`Load: ${traffic.load.toFixed(2)}`);
  console.log(`Pulses: ${traffic.pulses.length}`);
  console.log(`Speed: ${traffic.speed.toFixed(2)}`);
  
  // Get particles
  const particles = engine.getAllPulses();
  console.log(`Total: ${particles.length}`);
  
  // Get stats
  const stats = engine.getNetworkTraffic();
  console.log(`Congestion: ${stats.congestion.toFixed(1)}%`);
}
```

---

**Done!** You now have traffic simulation ready. 🚀
