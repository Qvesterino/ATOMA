# TrafficEngine.ts - Complete Integration Guide

## Overview

**TrafficEngine** simulates real-time data flow across the ATOMA neural network. It generates dynamic bandwidth loads, creates animated pulse particles, and provides shader-ready output for link visualization.

**Key Responsibilities:**
- Analyze link synergy to determine traffic characteristics
- Calculate bandwidth load and pulse speed
- Generate and animate pulse particles along links
- Provide network-wide traffic statistics
- Output data for LinkRenderer and custom visualizations

---

## Core Concepts

### Bandwidth Load (0.0 - 1.0)

Load represents how saturated a link is with data flow.

**Calculation:**
```
base load = synergy.energy
+ synergy type bonuses:
  - fusion:      +0.2 (strong flow)
  - quantum:     +random(0-0.3) (unpredictable)
  - sigma:       ×1.2 (validated authority)
  - fractal:     +0.1 (pattern flow)
  - complement:  +0.05 (hierarchical)

layer adjustments:
  - if quantum involved: +0.15
  - if sigma involved:   ×0.8 (regulation)

final = clamp(0.0, result × maxBandwidth, 1.0)
```

**Interpretation:**
- 0.0-0.2: Minimal traffic
- 0.2-0.5: Light traffic
- 0.5-0.7: Moderate traffic
- 0.7-0.85: Heavy traffic
- 0.85-1.0: Congestion

### Pulse Speed (0.1 - 3.0)

Speed controls how fast pulses travel and how quickly shaders animate.

**Calculation:**
```
base speed = 0.4 + synergy.score × 0.3
type modifiers:
  - fusion:    ×1.3 (accelerated)
  - quantum:   ×(0.8-1.2) (erratic)
  - sigma:     ×0.9 (measured)
  - linear:    ×0.8 (steady)

final = clamp(0.1, speed, 3.0) × maxPulseSpeed
```

### Pulse Particles

Individual particles flowing along links, animated based on synergy type.

**Spawn Rate (pulses per second):**
- Load ≥ 0.7: 2-3 pulses/sec (0.33-0.5s interval)
- Load ≥ 0.3: 1 pulse/sec (1.0s interval)
- Load < 0.3: 0.2-0.33 pulses/sec (3-5s interval)

**Properties:**
- `t`: Position 0.0-1.0 along link
- `velocity`: Movement speed (normalized per second)
- `energy`: Brightness 0.0-1.0 (decays over time)
- `id`: Unique identifier for tracking
- `createdAt`: Timestamp for lifetime tracking

---

## API Reference

### Initialization

```typescript
import { TrafficEngine, createTrafficEngine } from './TrafficEngine';

// Method 1: Direct constructor
const engine = new TrafficEngine(nodesMap, linksArray, synergyEngine, config);

// Method 2: Factory function
const engine = createTrafficEngine(nodesMap, linksArray, synergyEngine, config);
```

### Core Methods

#### `update(delta: number): void`

Update traffic simulation every frame.

```typescript
// In render loop
function animate(delta) {
  trafficEngine.update(delta);
  
  // Get updated traffic states
  const allTraffic = trafficEngine.getAllTraffic();
  
  // Render or process traffic
}
```

**Parameters:**
- `delta`: Time elapsed since last update (in seconds)

#### `getTraffic(linkId: string): TrafficState | null`

Get traffic state for a single link.

```typescript
const traffic = trafficEngine.getTraffic('link-123');
console.log('Load:', traffic.load);           // 0.75
console.log('Speed:', traffic.speed);         // 1.2
console.log('Pulses:', traffic.pulses.length); // 3
console.log('Energy:', traffic.energy);       // 0.68
```

#### `getAllTraffic(): TrafficState[]`

Get traffic states for all links.

```typescript
const allTraffic = trafficEngine.getAllTraffic();
const avgLoad = allTraffic.reduce((sum, t) => sum + t.load, 0) / allTraffic.length;
```

#### `getTrafficFromNode(nodeId: string): TrafficState[]`

Get all outgoing traffic from a node.

```typescript
const outgoing = trafficEngine.getTrafficFromNode('process-1');
outgoing.forEach(traffic => {
  console.log(`→ ${traffic.linkId}: load=${traffic.load}`);
});
```

#### `getTrafficToNode(nodeId: string): TrafficState[]`

Get all incoming traffic to a node.

```typescript
const incoming = trafficEngine.getTrafficToNode('analytics-1');
```

#### `getNetworkTraffic(): NetworkStats`

Get network-wide statistics.

```typescript
const stats = trafficEngine.getNetworkTraffic();
console.log('Average load:', stats.avgLoad.toFixed(2));     // 0.52
console.log('Peak load:', stats.maxLoad.toFixed(2));        // 0.91
console.log('Total pulses:', stats.totalPulses);            // 42
console.log('Active links:', stats.activeLinks);            // 18/25
console.log('Congestion:', stats.congestion.toFixed(1));    // 32.0%
```

**Returns:**
```typescript
{
  avgLoad: number;      // Average bandwidth 0.0-1.0
  maxLoad: number;      // Peak bandwidth
  minLoad: number;      // Minimum bandwidth
  avgSpeed: number;     // Average pulse speed
  totalPulses: number;  // Total active particles
  activeLinks: number;  // Links with traffic
  congestion: number;   // % of links over 0.7 load
}
```

### Data Access Methods

#### `setNodes(nodes: Map<string, Node>): void`

Update nodes (if topology changes).

```typescript
trafficEngine.setNodes(updatedNodesMap);
```

#### `setLinks(links: Link[]): void`

Update links and reinitialize traffic.

```typescript
trafficEngine.setLinks(updatedLinksArray);
```

#### `setSynergyEngine(synergyEngine: SynergyEngine): void`

Update synergy engine reference.

```typescript
trafficEngine.setSynergyEngine(newSynergyEngine);
```

### Analysis Methods

#### `getAllPulses(): PulseParticle[]`

Get all pulse particles in the network.

```typescript
const pulses = trafficEngine.getAllPulses();
console.log('Total particles:', pulses.length);

// Render or physics-update particles
pulses.forEach(pulse => {
  console.log(`Pulse ${pulse.id}: t=${pulse.t}, energy=${pulse.energy}`);
});
```

#### `findHotspots(threshold?: number): TrafficState[]`

Find highly congested links.

```typescript
const hotspots = trafficEngine.findHotspots(0.7);
hotspots.forEach(traffic => {
  console.log(`Hotspot: ${traffic.linkId} (load=${traffic.load})`);
});
```

#### `findBottlenecks(loadThreshold?: number, speedThreshold?: number): TrafficState[]`

Find slow, congested links (worst performance).

```typescript
const bottlenecks = trafficEngine.findBottlenecks(0.5, 0.5);
bottlenecks.forEach(traffic => {
  console.log(`Bottleneck: ${traffic.linkId}`);
});
```

#### `getAverageLatency(): number`

Estimate average network latency.

```typescript
const latency = trafficEngine.getAverageLatency();
console.log('Avg latency:', latency.toFixed(3), 'units');
```

#### `predictTrafficTrend(lookAhead?: number): Prediction`

Predict future traffic state.

```typescript
const prediction = trafficEngine.predictTrafficTrend(1.0); // 1 second ahead
console.log('Expected load:', prediction.expectedLoad);
console.log('Expected pulses:', prediction.expectedPulses);
console.log('Expected congestion:', prediction.expectedCongestion + '%');
```

#### `exportTrafficVisualization(): VisualizationData`

Export data for custom visualizations.

```typescript
const vizData = trafficEngine.exportTrafficVisualization();

// {
//   links: [{ id, from, to, load, speed, pulseCount }, ...],
//   pulses: [{ id, linkId, position, energy }, ...],
//   networkStats: { avgLoad, maxLoad, ... }
// }
```

### Utility Methods

#### `clearPulses(): void`

Reset all pulses (useful for state changes).

```typescript
trafficEngine.clearPulses();
```

#### `getDiagnostics(): DiagnosticInfo`

Get detailed diagnostics for debugging.

```typescript
const diag = trafficEngine.getDiagnostics();
console.log('Elapsed time:', diag.elapsedTime);
console.log('Pulse counter:', diag.pulseCounter);
console.log('Network stats:', diag.networkStats);
```

---

## TrafficState Structure

```typescript
interface TrafficState {
  linkId: string;           // Link identifier
  load: number;             // 0.0-1.0 bandwidth saturation
  speed: number;            // Pulse animation speed
  active: boolean;          // Has any traffic
  pulses: PulseParticle[];  // Active particles
  energy: number;           // 0.0-1.0 flowing energy
  type: string;             // Synergy type
  metadata?: {
    synergyScore?: number;
    fromLayer?: string;
    toLayer?: string;
    pulseSpawned?: boolean;
  };
}
```

---

## Configuration Options

```typescript
interface TrafficEngineConfig {
  maxPulseSpeed?: number;           // 0.5-3.0, default 1.0
  maxBandwidth?: number;            // 0.5-2.0, default 1.0
  pulseSpawnRate?: number;          // Multiplier, default 1.0
  pulseLifetime?: number;           // Seconds, default 5.0
  maxPulsesPerLink?: number;        // Cap, default 10
  quantumRandomness?: boolean;      // Enable, default true
  enableLoadSpikes?: boolean;       // Occasional spikes, default true
  spikeIntensity?: number;          // Multiplier, default 1.5
}
```

### Preset Configurations

```typescript
// Default (balanced)
createDefaultTrafficConfig()

// High-traffic (stress testing)
createHighTrafficConfig()
// - maxPulseSpeed: 2.0
// - maxBandwidth: 1.5
// - maxPulsesPerLink: 20
// - pulseSpawnRate: 2.0

// Conservative (minimal)
createConservativeTrafficConfig()
// - maxPulseSpeed: 0.5
// - maxBandwidth: 0.5
// - maxPulsesPerLink: 5
// - quantumRandomness: false
```

---

## Practical Examples

### Example 1: Basic Setup

```typescript
import { TrafficEngine } from './TrafficEngine';
import { SynergyEngine } from './SynergyEngine';

// Create engines
const synergyEngine = new SynergyEngine(nodesMap);
const trafficEngine = new TrafficEngine(
  nodesMap,
  linksArray,
  synergyEngine,
  { maxPulseSpeed: 1.5 }
);

// Simulation loop
function animate() {
  trafficEngine.update(0.016); // 60 FPS

  // Get traffic state
  const traffic = trafficEngine.getTraffic('link-1');
  console.log('Load:', traffic?.load);

  requestAnimationFrame(animate);
}
```

### Example 2: Monitor Network Health

```typescript
function monitorNetwork() {
  const stats = trafficEngine.getNetworkTraffic();

  console.log(`Network Health:`);
  console.log(`  Avg Load: ${(stats.avgLoad * 100).toFixed(0)}%`);
  console.log(`  Congestion: ${stats.congestion.toFixed(1)}%`);
  console.log(`  Active Links: ${stats.activeLinks}/${allLinks.length}`);
  console.log(`  Total Pulses: ${stats.totalPulses}`);

  // Alert if congestion high
  if (stats.congestion > 50) {
    console.warn('High network congestion detected!');
  }
}

// Check every second
setInterval(monitorNetwork, 1000);
```

### Example 3: Render Pulses to Canvas/WebGL

```typescript
// Get all pulses
const pulses = trafficEngine.getAllPulses();

pulses.forEach(pulse => {
  // Get link for position calculation
  const link = allLinks.find(l => l.id === pulse.linkId);
  if (!link) return;

  // Get start and end positions (from node positions)
  const fromNode = nodes.get(link.from);
  const toNode = nodes.get(link.to);

  // Interpolate position along link
  const position = new THREE.Vector3().lerpVectors(
    fromNode.position,
    toNode.position,
    pulse.t
  );

  // Render or update particle
  renderParticle(position, pulse.energy, pulse.velocity);
});
```

### Example 4: Identify Problems

```typescript
// Find bottlenecks
const bottlenecks = trafficEngine.findBottlenecks();
console.log('Bottleneck links:', bottlenecks.map(t => t.linkId));

// Find hotspots
const hotspots = trafficEngine.findHotspots(0.8);
console.log('Hotspot links:', hotspots.map(t => t.linkId));

// Predict congestion
const trend = trafficEngine.predictTrafficTrend(2.0);
if (trend.expectedCongestion > 70) {
  console.warn('Severe congestion predicted in 2 seconds!');
}
```

### Example 5: Export for Visualization Dashboard

```typescript
function updateDashboard() {
  const viz = trafficEngine.exportTrafficVisualization();

  // Update link visuals
  viz.links.forEach(linkData => {
    const material = linkMaterials.get(linkData.id);
    if (material) {
      material.uniforms.load.value = linkData.load;
      material.uniforms.speed.value = linkData.speed;
    }
  });

  // Update particle count display
  document.getElementById('pulse-count').textContent = viz.pulses.length;

  // Update stats panel
  const stats = viz.networkStats;
  document.getElementById('avg-load').textContent = (stats.avgLoad * 100).toFixed(0);
  document.getElementById('congestion').textContent = stats.congestion.toFixed(1);
}

// Update UI every frame
function animate() {
  trafficEngine.update(delta);
  updateDashboard();
}
```

---

## Integration with LinkRenderer

### Step 1: Update Traffic Every Frame

```typescript
function render(delta) {
  trafficEngine.update(delta);
  renderer.render(scene, camera);
}
```

### Step 2: Get Traffic State for Link

```typescript
function updateLinkMaterial(link) {
  const traffic = trafficEngine.getTraffic(link.id);
  if (!traffic) return;

  const material = linkMaterials.get(link.id);
  if (!material) return;

  // Update uniforms from traffic
  material.uniforms.load.value = traffic.load;
  material.uniforms.speed.value = traffic.speed;
  material.uniforms.energy.value = traffic.energy;
}
```

### Step 3: Render Pulses

```typescript
function renderPulses() {
  const pulses = trafficEngine.getAllPulses();

  pulseGeometry.clear();
  pulses.forEach(pulse => {
    const linkData = trafficCache.get(pulse.linkId);
    if (!linkData) return;

    // Get curve position at pulse.t
    const position = getBezierPoint(linkData.curve, pulse.t);

    // Add particle to geometry
    addParticleToGeometry(position, pulse.energy);
  });

  pulseGeometry.setAttribute('position', new THREE.BufferAttribute(...));
}
```

---

## Performance Optimization

### Caching

TrafficEngine caches synergy calculations to avoid redundant evaluation.

```typescript
// Synergy is evaluated once per update per link
// Results cached and reused for load/speed calculations
```

### Load Spikes (Optional)

Disable for consistent performance:

```typescript
const config = {
  enableLoadSpikes: false, // Disables random spikes
};
```

### Pulse Limits

Cap pulses per link to prevent overflow:

```typescript
const config = {
  maxPulsesPerLink: 5, // Lower = better performance
};
```

### Update Frequency

Update only when needed:

```typescript
let lastUpdate = 0;
const updateInterval = 0.033; // ~30 FPS

function maybeUpdate(delta) {
  lastUpdate += delta;
  if (lastUpdate >= updateInterval) {
    trafficEngine.update(lastUpdate);
    lastUpdate = 0;
  }
}
```

---

## Troubleshooting

### No traffic generated

**Check:**
- Links exist and are connected
- Synergy engine is initialized
- `update()` is being called regularly
- Synergy returns non-zero energy

```typescript
const synergy = synergyEngine.evaluateLink(link);
console.log('Synergy energy:', synergy.energy);
```

### Pulses not moving

**Check:**
- Velocity is non-zero
- `update()` delta is non-zero
- Pulse lifetime hasn't expired

```typescript
const traffic = trafficEngine.getTraffic(linkId);
console.log('Pulses:', traffic.pulses);
```

### Performance issues

**Solutions:**
- Reduce `maxPulsesPerLink`
- Increase `pulseLifetime`
- Disable `enableLoadSpikes`
- Lower `pulseSpawnRate`

```typescript
const config = createConservativeTrafficConfig();
```

### Unrealistic loads

**Check:**
- Synergy types are correct
- Layer types match expectations
- Bandwidth multiplier is appropriate

```typescript
const traffic = trafficEngine.getTraffic(linkId);
console.log('Metadata:', traffic.metadata);
```

---

## Advanced Usage

### Custom Pulse Rendering

```typescript
class CustomPulseRenderer {
  constructor(trafficEngine) {
    this.trafficEngine = trafficEngine;
  }

  render(scene) {
    const pulses = this.trafficEngine.getAllPulses();

    pulses.forEach(pulse => {
      const geometry = new THREE.SphereGeometry(0.2, 8, 8);
      const material = new THREE.MeshPhongMaterial({
        emissive: pulse.color || '#00ff88',
        emissiveIntensity: pulse.energy,
      });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // Update in animate loop
      // mesh.position = getBezierPoint(curve, pulse.t);
    });
  }
}
```

### Traffic-Based Node Glow

```typescript
function updateNodeGlow() {
  const nodes = new Map();

  // Accumulate incoming traffic energy
  for (const traffic of trafficEngine.getAllTraffic()) {
    const toNode = traffic.linkId.split('→')[1];
    const intensity = (nodes.get(toNode) || 0) + traffic.energy;
    nodes.set(toNode, Math.min(1.0, intensity));
  }

  // Update node materials
  nodes.forEach((intensity, nodeId) => {
    const nodeMaterial = nodeMaterials.get(nodeId);
    if (nodeMaterial) {
      nodeMaterial.uniforms.glowIntensity.value = intensity;
    }
  });
}
```

### Network Congestion Alert System

```typescript
class CongestionMonitor {
  constructor(trafficEngine, thresholds) {
    this.trafficEngine = trafficEngine;
    this.thresholds = thresholds;
    this.alerts = [];
  }

  update() {
    this.alerts = [];

    const stats = this.trafficEngine.getNetworkTraffic();

    if (stats.congestion > this.thresholds.critical) {
      this.alerts.push({
        severity: 'critical',
        message: `Severe congestion: ${stats.congestion.toFixed(1)}%`,
      });
    } else if (stats.congestion > this.thresholds.warning) {
      this.alerts.push({
        severity: 'warning',
        message: `Network congestion: ${stats.congestion.toFixed(1)}%`,
      });
    }

    // Check for bottlenecks
    const bottlenecks = this.trafficEngine.findBottlenecks();
    if (bottlenecks.length > 0) {
      this.alerts.push({
        severity: 'info',
        message: `${bottlenecks.length} bottleneck(s) detected`,
      });
    }

    return this.alerts;
  }
}
```

---

## Type Definitions

```typescript
// Traffic state
interface TrafficState {
  linkId: string;
  load: number;
  speed: number;
  active: boolean;
  pulses: PulseParticle[];
  energy: number;
  type: string;
  metadata?: {...};
}

// Pulse particle
interface PulseParticle {
  id: string;
  t: number;
  velocity: number;
  energy: number;
  createdAt: number;
  color?: string;
}

// Configuration
interface TrafficEngineConfig {
  maxPulseSpeed?: number;
  maxBandwidth?: number;
  pulseSpawnRate?: number;
  pulseLifetime?: number;
  maxPulsesPerLink?: number;
  quantumRandomness?: boolean;
  enableLoadSpikes?: boolean;
  spikeIntensity?: number;
}
```

---

## Summary

**TrafficEngine** provides:
- ✅ Real-time traffic simulation
- ✅ Dynamic pulse particle generation
- ✅ Network-wide analytics
- ✅ Performance optimization
- ✅ Integration-ready output
- ✅ Flexible configuration

Use it to power dynamic link visualization, network diagnostics, and AI consciousness animation in ATOMA! 🚀
