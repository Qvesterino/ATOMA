/**
 * TRAFFIC_INTEGRATION_EXAMPLES.ts - Working Integration Examples
 * 
 * 12 complete, copy-paste-ready examples for integrating TrafficEngine
 * into your ATOMA game systems.
 */

import * as THREE from 'three';
import { TrafficEngine, type TrafficState, type PulseParticle } from './TrafficEngine';
import { SynergyEngine } from './SynergyEngine';
import type { Node, Link } from './TrafficEngine';

// ============================================================================
// EXAMPLE 1: Basic Setup & First Update
// ============================================================================

export function example1_basicSetup() {
  console.log('=== EXAMPLE 1: Basic Setup ===');

  // Create sample nodes
  const nodes = new Map<string, Node>([
    ['input-1', { id: 'input-1', layer: 'input', frequency: 0.8 }],
    ['process-1', { id: 'process-1', layer: 'process', frequency: 0.75 }],
    ['analytics-1', { id: 'analytics-1', layer: 'analytics', frequency: 0.7 }],
  ]);

  // Create links
  const links: Link[] = [
    { id: 'link-1', from: 'input-1', to: 'process-1' },
    { id: 'link-2', from: 'process-1', to: 'analytics-1' },
  ];

  // Create engines
  const synergyEngine = new SynergyEngine(nodes);
  synergyEngine.setLinks(new Map(links.map(l => [l.id, l])));

  const trafficEngine = new TrafficEngine(nodes, links, synergyEngine);

  // Update once
  trafficEngine.update(0.016);

  // Get traffic
  const traffic = trafficEngine.getTraffic('link-1');
  console.log(`Link-1 Traffic:`);
  console.log(`  Load: ${traffic?.load.toFixed(2)}`);
  console.log(`  Speed: ${traffic?.speed.toFixed(2)}`);
  console.log(`  Active: ${traffic?.active}`);
  console.log(`  Pulses: ${traffic?.pulses.length}`);
  console.log(`  Energy: ${traffic?.energy.toFixed(2)}`);

  // Expected output: Load 0.65-0.75, Speed 0.8-1.2, Energy 0.65-0.75
}

// ============================================================================
// EXAMPLE 2: Network Statistics
// ============================================================================

export function example2_networkStats() {
  console.log('=== EXAMPLE 2: Network Statistics ===');

  // Setup
  const nodes = new Map<string, Node>([
    ['n1', { id: 'n1', layer: 'input', frequency: 0.8 }],
    ['n2', { id: 'n2', layer: 'process', frequency: 0.75 }],
    ['n3', { id: 'n3', layer: 'analytics', frequency: 0.7 }],
    ['n4', { id: 'n4', layer: 'storage', frequency: 0.65 }],
  ]);

  const links: Link[] = [
    { id: 'l1', from: 'n1', to: 'n2' },
    { id: 'l2', from: 'n2', to: 'n3' },
    { id: 'l3', from: 'n3', to: 'n4' },
  ];

  const synergyEngine = new SynergyEngine(nodes);
  synergyEngine.setLinks(new Map(links.map(l => [l.id, l])));

  const trafficEngine = new TrafficEngine(nodes, links, synergyEngine);

  // Update multiple times to build up traffic
  for (let i = 0; i < 100; i++) {
    trafficEngine.update(0.016);
  }

  // Get network stats
  const stats = trafficEngine.getNetworkTraffic();

  console.log('Network Statistics:');
  console.log(`  Avg Load: ${(stats.avgLoad * 100).toFixed(1)}%`);
  console.log(`  Max Load: ${(stats.maxLoad * 100).toFixed(1)}%`);
  console.log(`  Min Load: ${(stats.minLoad * 100).toFixed(1)}%`);
  console.log(`  Avg Speed: ${stats.avgSpeed.toFixed(2)}`);
  console.log(`  Total Pulses: ${stats.totalPulses}`);
  console.log(`  Active Links: ${stats.activeLinks}/${links.length}`);
  console.log(`  Congestion: ${stats.congestion.toFixed(1)}%`);
}

// ============================================================================
// EXAMPLE 3: Pulse Particle Tracking
// ============================================================================

export function example3_pulseTracking() {
  console.log('=== EXAMPLE 3: Pulse Particle Tracking ===');

  const nodes = new Map<string, Node>([
    ['n1', { id: 'n1', layer: 'input', frequency: 0.8 }],
    ['n2', { id: 'n2', layer: 'process', frequency: 0.8 }],
  ]);

  const links: Link[] = [
    { id: 'link-fusion', from: 'n1', to: 'n2' },
  ];

  const synergyEngine = new SynergyEngine(nodes);
  synergyEngine.setLinks(new Map(links.map(l => [l.id, l])));

  const trafficEngine = new TrafficEngine(nodes, links, synergyEngine);

  // Simulate for several seconds
  for (let i = 0; i < 300; i++) {
    trafficEngine.update(0.016);
  }

  // Get all pulses
  const pulses = trafficEngine.getAllPulses();
  console.log(`Total pulses: ${pulses.length}`);

  // Analyze pulses
  pulses.slice(0, 5).forEach((pulse, i) => {
    console.log(`Pulse ${i + 1}:`);
    console.log(`  Position: ${pulse.t.toFixed(2)} (0.0-1.0)`);
    console.log(`  Energy: ${pulse.energy.toFixed(2)}`);
    console.log(`  Velocity: ${pulse.velocity.toFixed(2)}`);
    console.log(`  Link: ${pulse.linkId}`);
  });
}

// ============================================================================
// EXAMPLE 4: Hotspot Detection
// ============================================================================

export function example4_hotspotDetection() {
  console.log('=== EXAMPLE 4: Hotspot Detection ===');

  // Create a network with varied link types
  const nodes = new Map<string, Node>([
    ['input', { id: 'input', layer: 'input', frequency: 0.9 }],
    ['proc-a', { id: 'proc-a', layer: 'process', frequency: 0.9 }],
    ['proc-b', { id: 'proc-b', layer: 'process', frequency: 0.7 }],
    ['analytics', { id: 'analytics', layer: 'analytics', frequency: 0.8 }],
  ]);

  const links: Link[] = [
    { id: 'l1', from: 'input', to: 'proc-a' },      // High frequency
    { id: 'l2', from: 'proc-a', to: 'analytics' },  // High frequency
    { id: 'l3', from: 'proc-b', to: 'analytics' },  // Low frequency
  ];

  const synergyEngine = new SynergyEngine(nodes);
  synergyEngine.setLinks(new Map(links.map(l => [l.id, l])));

  const trafficEngine = new TrafficEngine(nodes, links, synergyEngine);

  // Run simulation
  for (let i = 0; i < 200; i++) {
    trafficEngine.update(0.016);
  }

  // Find hotspots
  const hotspots = trafficEngine.findHotspots(0.6);
  console.log(`Hotspots (load > 0.6): ${hotspots.length}`);
  hotspots.forEach(traffic => {
    console.log(`  ${traffic.linkId}: load=${traffic.load.toFixed(2)}, pulses=${traffic.pulses.length}`);
  });

  // Find bottlenecks
  const bottlenecks = trafficEngine.findBottlenecks(0.5, 0.6);
  console.log(`Bottlenecks (heavy & slow): ${bottlenecks.length}`);
  bottlenecks.forEach(traffic => {
    console.log(`  ${traffic.linkId}: load=${traffic.load.toFixed(2)}, speed=${traffic.speed.toFixed(2)}`);
  });
}

// ============================================================================
// EXAMPLE 5: Traffic Prediction
// ============================================================================

export function example5_trafficPrediction() {
  console.log('=== EXAMPLE 5: Traffic Prediction ===');

  const nodes = new Map<string, Node>([
    ['n1', { id: 'n1', layer: 'input', frequency: 0.8 }],
    ['n2', { id: 'n2', layer: 'process', frequency: 0.8 }],
  ]);

  const links: Link[] = [{ id: 'l1', from: 'n1', to: 'n2' }];

  const synergyEngine = new SynergyEngine(nodes);
  synergyEngine.setLinks(new Map(links.map(l => [l.id, l])));

  const trafficEngine = new TrafficEngine(nodes, links, synergyEngine);

  // Current state
  for (let i = 0; i < 100; i++) {
    trafficEngine.update(0.016);
  }

  const currentStats = trafficEngine.getNetworkTraffic();
  console.log(`Current network state:`);
  console.log(`  Avg Load: ${(currentStats.avgLoad * 100).toFixed(1)}%`);
  console.log(`  Pulses: ${currentStats.totalPulses}`);

  // Predict future
  const prediction1s = trafficEngine.predictTrafficTrend(1.0);
  const prediction2s = trafficEngine.predictTrafficTrend(2.0);

  console.log(`Prediction in 1 second:`);
  console.log(`  Expected Load: ${(prediction1s.expectedLoad * 100).toFixed(1)}%`);
  console.log(`  Expected Pulses: ${prediction1s.expectedPulses}`);
  console.log(`  Expected Congestion: ${prediction1s.expectedCongestion.toFixed(1)}%`);

  console.log(`Prediction in 2 seconds:`);
  console.log(`  Expected Load: ${(prediction2s.expectedLoad * 100).toFixed(1)}%`);
  console.log(`  Expected Pulses: ${prediction2s.expectedPulses}`);
  console.log(`  Expected Congestion: ${prediction2s.expectedCongestion.toFixed(1)}%`);
}

// ============================================================================
// EXAMPLE 6: Configuration Comparison
// ============================================================================

export function example6_configComparison() {
  console.log('=== EXAMPLE 6: Configuration Comparison ===');

  const nodes = new Map<string, Node>([
    ['n1', { id: 'n1', layer: 'input', frequency: 0.8 }],
    ['n2', { id: 'n2', layer: 'process', frequency: 0.8 }],
  ]);

  const links: Link[] = [{ id: 'l1', from: 'n1', to: 'n2' }];

  const synergyEngine = new SynergyEngine(nodes);
  synergyEngine.setLinks(new Map(links.map(l => [l.id, l])));

  // Test different configurations
  const configs = [
    { name: 'Conservative', config: { maxPulseSpeed: 0.5, maxBandwidth: 0.5, maxPulsesPerLink: 5 } },
    { name: 'Default', config: {} },
    { name: 'High Traffic', config: { maxPulseSpeed: 2.0, maxBandwidth: 1.5, maxPulsesPerLink: 20 } },
  ];

  for (const { name, config } of configs) {
    const engine = new TrafficEngine(nodes, links, synergyEngine, config);

    // Simulate
    for (let i = 0; i < 100; i++) {
      engine.update(0.016);
    }

    const traffic = engine.getTraffic('l1');
    const stats = engine.getNetworkTraffic();

    console.log(`${name}:`);
    console.log(`  Load: ${traffic?.load.toFixed(2)}`);
    console.log(`  Speed: ${traffic?.speed.toFixed(2)}`);
    console.log(`  Pulses: ${stats.totalPulses}`);
  }
}

// ============================================================================
// EXAMPLE 7: Synergy Type Impact
// ============================================================================

export function example7_synergyTypeImpact() {
  console.log('=== EXAMPLE 7: Synergy Type Impact ===');

  // Test different layer combinations that create different synergy types
  const testCases = [
    {
      name: 'Linear (input→input)',
      nodes: [
        ['n1', { id: 'n1', layer: 'input', frequency: 0.8 }],
        ['n2', { id: 'n2', layer: 'input', frequency: 0.8 }],
      ] as [string, Node][],
    },
    {
      name: 'Complement (input→process)',
      nodes: [
        ['n1', { id: 'n1', layer: 'input', frequency: 0.8 }],
        ['n2', { id: 'n2', layer: 'process', frequency: 0.8 }],
      ] as [string, Node][],
    },
    {
      name: 'Quantum',
      nodes: [
        ['n1', { id: 'n1', layer: 'quantum', frequency: 0.5 }],
        ['n2', { id: 'n2', layer: 'process', frequency: 0.8 }],
      ] as [string, Node][],
    },
  ];

  for (const testCase of testCases) {
    const nodes = new Map(testCase.nodes);
    const links: Link[] = [{ id: 'l1', from: Object.keys(nodes)[0], to: Object.keys(nodes)[1] }];

    const synergyEngine = new SynergyEngine(nodes);
    synergyEngine.setLinks(new Map(links.map(l => [l.id, l])));

    const trafficEngine = new TrafficEngine(nodes, links, synergyEngine);

    for (let i = 0; i < 100; i++) {
      trafficEngine.update(0.016);
    }

    const traffic = trafficEngine.getTraffic('l1');
    console.log(`${testCase.name}:`);
    console.log(`  Load: ${traffic?.load.toFixed(2)}`);
    console.log(`  Speed: ${traffic?.speed.toFixed(2)}`);
    console.log(`  Synergy Type: ${traffic?.type}`);
  }
}

// ============================================================================
// EXAMPLE 8: Node-Centric Traffic Analysis
// ============================================================================

export function example8_nodeCentricAnalysis() {
  console.log('=== EXAMPLE 8: Node-Centric Analysis ===');

  const nodes = new Map<string, Node>([
    ['hub', { id: 'hub', layer: 'process', frequency: 0.8 }],
    ['input-a', { id: 'input-a', layer: 'input', frequency: 0.7 }],
    ['input-b', { id: 'input-b', layer: 'input', frequency: 0.8 }],
    ['output', { id: 'output', layer: 'analytics', frequency: 0.8 }],
  ]);

  const links: Link[] = [
    { id: 'l1', from: 'input-a', to: 'hub' },
    { id: 'l2', from: 'input-b', to: 'hub' },
    { id: 'l3', from: 'hub', to: 'output' },
  ];

  const synergyEngine = new SynergyEngine(nodes);
  synergyEngine.setLinks(new Map(links.map(l => [l.id, l])));

  const trafficEngine = new TrafficEngine(nodes, links, synergyEngine);

  for (let i = 0; i < 100; i++) {
    trafficEngine.update(0.016);
  }

  // Analyze hub node
  const incoming = trafficEngine.getTrafficToNode('hub');
  const outgoing = trafficEngine.getTrafficFromNode('hub');

  console.log('Hub Node Analysis:');
  console.log(`  Incoming traffic: ${incoming.length}`);
  incoming.forEach(t => {
    console.log(`    ← ${t.linkId}: load=${t.load.toFixed(2)}, pulses=${t.pulses.length}`);
  });

  console.log(`  Outgoing traffic: ${outgoing.length}`);
  outgoing.forEach(t => {
    console.log(`    → ${t.linkId}: load=${t.load.toFixed(2)}, pulses=${t.pulses.length}`);
  });

  // Calculate total throughput
  const totalIncoming = incoming.reduce((sum, t) => sum + t.load, 0);
  const totalOutgoing = outgoing.reduce((sum, t) => sum + t.load, 0);
  console.log(`  Total incoming: ${totalIncoming.toFixed(2)}`);
  console.log(`  Total outgoing: ${totalOutgoing.toFixed(2)}`);
}

// ============================================================================
// EXAMPLE 9: Visualization Export
// ============================================================================

export function example9_visualizationExport() {
  console.log('=== EXAMPLE 9: Visualization Export ===');

  const nodes = new Map<string, Node>([
    ['n1', { id: 'n1', layer: 'input', frequency: 0.8 }],
    ['n2', { id: 'n2', layer: 'process', frequency: 0.8 }],
    ['n3', { id: 'n3', layer: 'analytics', frequency: 0.8 }],
  ]);

  const links: Link[] = [
    { id: 'l1', from: 'n1', to: 'n2' },
    { id: 'l2', from: 'n2', to: 'n3' },
  ];

  const synergyEngine = new SynergyEngine(nodes);
  synergyEngine.setLinks(new Map(links.map(l => [l.id, l])));

  const trafficEngine = new TrafficEngine(nodes, links, synergyEngine);

  for (let i = 0; i < 100; i++) {
    trafficEngine.update(0.016);
  }

  // Export visualization data
  const vizData = trafficEngine.exportTrafficVisualization();

  console.log('Visualization Export:');
  console.log(`  Links: ${vizData.links.length}`);
  vizData.links.forEach(link => {
    console.log(`    ${link.id}: load=${link.load.toFixed(2)}, speed=${link.speed.toFixed(2)}, pulses=${link.pulseCount}`);
  });

  console.log(`  Pulses: ${vizData.pulses.length}`);
  vizData.pulses.slice(0, 3).forEach(pulse => {
    console.log(`    ${pulse.id}: position=${pulse.position.toFixed(2)}, energy=${pulse.energy.toFixed(2)}`);
  });

  console.log(`  Network: avg=${(vizData.networkStats.avgLoad * 100).toFixed(1)}%, congestion=${vizData.networkStats.congestion.toFixed(1)}%`);
}

// ============================================================================
// EXAMPLE 10: Dynamic Updates
// ============================================================================

export function example10_dynamicUpdates() {
  console.log('=== EXAMPLE 10: Dynamic Updates ===');

  const nodes = new Map<string, Node>([
    ['n1', { id: 'n1', layer: 'input', frequency: 0.8 }],
    ['n2', { id: 'n2', layer: 'process', frequency: 0.8 }],
  ]);

  let links: Link[] = [{ id: 'l1', from: 'n1', to: 'n2' }];

  const synergyEngine = new SynergyEngine(nodes);
  synergyEngine.setLinks(new Map(links.map(l => [l.id, l])));

  const trafficEngine = new TrafficEngine(nodes, links, synergyEngine);

  // Initial state
  for (let i = 0; i < 50; i++) {
    trafficEngine.update(0.016);
  }
  let traffic = trafficEngine.getTraffic('l1');
  console.log('Initial state:');
  console.log(`  Load: ${traffic?.load.toFixed(2)}`);

  // Add new link dynamically
  console.log('Adding new link...');
  links = [
    { id: 'l1', from: 'n1', to: 'n2' },
    { id: 'l2', from: 'n2', to: 'n1' }, // New reverse link
  ];
  trafficEngine.setLinks(links);

  for (let i = 0; i < 50; i++) {
    trafficEngine.update(0.016);
  }
  traffic = trafficEngine.getTraffic('l2');
  console.log('After adding link:');
  console.log(`  New link load: ${traffic?.load.toFixed(2)}`);

  // Clear pulses
  console.log('Clearing pulses...');
  trafficEngine.clearPulses();
  const stats = trafficEngine.getNetworkTraffic();
  console.log(`  Pulses after clear: ${stats.totalPulses}`);
}

// ============================================================================
// EXAMPLE 11: Performance Monitoring
// ============================================================================

export function example11_performanceMonitoring() {
  console.log('=== EXAMPLE 11: Performance Monitoring ===');

  // Create large network
  const nodeCount = 20;
  const nodes = new Map<string, Node>();
  const layers = ['input', 'process', 'integration', 'analytics', 'storage'];

  for (let i = 0; i < nodeCount; i++) {
    nodes.set(`n${i}`, {
      id: `n${i}`,
      layer: layers[i % layers.length],
      frequency: 0.5 + Math.random() * 0.5,
    });
  }

  // Random links
  const links: Link[] = [];
  for (let i = 0; i < 30; i++) {
    const from = Math.floor(Math.random() * nodeCount);
    const to = Math.floor(Math.random() * nodeCount);
    if (from !== to) {
      links.push({ id: `l${i}`, from: `n${from}`, to: `n${to}` });
    }
  }

  const synergyEngine = new SynergyEngine(nodes);
  synergyEngine.setLinks(new Map(links.map(l => [l.id, l])));

  const trafficEngine = new TrafficEngine(nodes, links, synergyEngine);

  // Benchmark update
  console.time('100 updates');
  for (let i = 0; i < 100; i++) {
    trafficEngine.update(0.016);
  }
  console.timeEnd('100 updates');

  const stats = trafficEngine.getNetworkTraffic();
  console.log(`Network size: ${nodeCount} nodes, ${links.length} links`);
  console.log(`Particles: ${stats.totalPulses}`);
  console.log(`Avg load: ${(stats.avgLoad * 100).toFixed(1)}%`);
}

// ============================================================================
// EXAMPLE 12: Diagnostics & Debugging
// ============================================================================

export function example12_diagnostics() {
  console.log('=== EXAMPLE 12: Diagnostics & Debugging ===');

  const nodes = new Map<string, Node>([
    ['n1', { id: 'n1', layer: 'input', frequency: 0.8 }],
    ['n2', { id: 'n2', layer: 'process', frequency: 0.8 }],
    ['n3', { id: 'n3', layer: 'analytics', frequency: 0.8 }],
  ]);

  const links: Link[] = [
    { id: 'l1', from: 'n1', to: 'n2' },
    { id: 'l2', from: 'n2', to: 'n3' },
  ];

  const synergyEngine = new SynergyEngine(nodes);
  synergyEngine.setLinks(new Map(links.map(l => [l.id, l])));

  const trafficEngine = new TrafficEngine(nodes, links, synergyEngine);

  for (let i = 0; i < 100; i++) {
    trafficEngine.update(0.016);
  }

  // Get full diagnostics
  const diag = trafficEngine.getDiagnostics();

  console.log('Full Diagnostics:');
  console.log(JSON.stringify(diag, null, 2));

  // Analyze latency
  const latency = trafficEngine.getAverageLatency();
  console.log(`Average latency: ${latency.toFixed(3)}`);

  // All pulses
  const pulses = trafficEngine.getAllPulses();
  console.log(`Total pulses in network: ${pulses.length}`);

  // Summary
  console.log('Summary:');
  console.log(`  Elapsed: ${diag.elapsedTime.toFixed(2)}s`);
  console.log(`  Pulses created: ${diag.pulseCounter}`);
  console.log(`  Config: maxSpeed=${diag.config.maxPulseSpeed}, maxBandwidth=${diag.config.maxBandwidth}`);
}

// ============================================================================
// RUN ALL EXAMPLES
// ============================================================================

export function runAllTrafficExamples() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   TRAFFIC ENGINE INTEGRATION EXAMPLES  ║');
  console.log('╚════════════════════════════════════════╝\n');

  example1_basicSetup();
  console.log('\n---\n');

  example2_networkStats();
  console.log('\n---\n');

  example3_pulseTracking();
  console.log('\n---\n');

  example4_hotspotDetection();
  console.log('\n---\n');

  example5_trafficPrediction();
  console.log('\n---\n');

  example6_configComparison();
  console.log('\n---\n');

  example7_synergyTypeImpact();
  console.log('\n---\n');

  example8_nodeCentricAnalysis();
  console.log('\n---\n');

  example9_visualizationExport();
  console.log('\n---\n');

  example10_dynamicUpdates();
  console.log('\n---\n');

  example11_performanceMonitoring();
  console.log('\n---\n');

  example12_diagnostics();

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   ALL EXAMPLES COMPLETED               ║');
  console.log('╚════════════════════════════════════════╝\n');
}
