/**
 * SYNERGY_INTEGRATION_EXAMPLES.ts - Working Integration Examples
 * 
 * Complete, copy-paste-ready examples for integrating SynergyEngine
 * into your ATOMA game systems.
 */

import * as THREE from 'three';
import { SynergyEngine, type SynergyResult, type SynergyVisual, type Node } from './SynergyEngine';
import type { Link } from './LinkEngine';

// ============================================================================
// EXAMPLE 1: Basic Setup & Pair Evaluation
// ============================================================================

/**
 * Example 1: Initialize engine and evaluate a single pair
 */
export function example1_basicSetup() {
  console.log('=== EXAMPLE 1: Basic Setup ===');

  // Create sample nodes
  const nodesMap = new Map<string, Node>([
    [
      'input-sensor',
      {
        id: 'input-sensor',
        layer: 'input',
        frequency: 0.85,
        behavior: 'stable',
      },
    ],
    [
      'process-core',
      {
        id: 'process-core',
        layer: 'process',
        frequency: 0.80,
        behavior: 'stable',
      },
    ],
  ]);

  // Initialize engine
  const engine = new SynergyEngine(nodesMap);

  // Evaluate the pair
  const result = engine.evaluatePair('input-sensor', 'process-core');

  // Log results
  console.log(`Synergy Type: ${result.type}`);
  console.log(`Score: ${result.score.toFixed(2)}`);
  console.log(`Energy: ${(result.energy * 100).toFixed(1)}%`);
  console.log(`Explanation: ${engine.explainSynergy(result)}`);
  console.log(`Visual Color: ${result.visual.color}`);
  console.log(`Pulse Speed: ${result.visual.pulseSpeed.toFixed(2)}`);

  // Expected output (for stable, well-aligned pair):
  // Synergy Type: complement
  // Score: ~1.8-2.0
  // Energy: ~70-75%
  // Visual Color: #00ff88
}

// ============================================================================
// EXAMPLE 2: Link Evaluation with Shader Integration
// ============================================================================

/**
 * Example 2: Evaluate a link and create shader uniforms
 */
export function example2_shaderIntegration() {
  console.log('=== EXAMPLE 2: Shader Integration ===');

  // Create nodes
  const nodes = new Map<string, Node>([
    ['n1', { id: 'n1', layer: 'input', frequency: 0.7 }],
    ['n2', { id: 'n2', layer: 'process', frequency: 0.75 }],
  ]);

  const engine = new SynergyEngine(nodes);

  // Create a link
  const link: Link = {
    id: 'link-1',
    from: 'n1',
    to: 'n2',
  };

  // Evaluate synergy
  const synergy = engine.evaluateLink(link);

  // Generate shader uniforms
  const shaderUniforms = {
    linkColor: { value: new THREE.Color(synergy.visual.color) },
    pulseSpeed: { value: synergy.visual.pulseSpeed },
    warpIntensity: { value: synergy.visual.warpIntensity },
    thickness: { value: synergy.visual.thickness },
    glitch: { value: synergy.visual.glitch },
    time: { value: 0 },
  };

  console.log('Generated shader uniforms:');
  console.log(JSON.stringify({
    color: synergy.visual.color,
    pulseSpeed: synergy.visual.pulseSpeed.toFixed(2),
    warpIntensity: synergy.visual.warpIntensity.toFixed(2),
    thickness: synergy.visual.thickness.toFixed(2),
    glitch: synergy.visual.glitch.toFixed(2),
  }, null, 2));

  // In actual rendering, update material:
  // material.uniforms = shaderUniforms;

  return shaderUniforms;
}

// ============================================================================
// EXAMPLE 3: Path Analysis (Node Sequences)
// ============================================================================

/**
 * Example 3: Analyze a 3-node path for fractal patterns
 */
export function example3_pathAnalysis() {
  console.log('=== EXAMPLE 3: Path Analysis ===');

  // Create a forward pipeline path
  const nodes = new Map<string, Node>([
    ['input-1', { id: 'input-1', layer: 'input', frequency: 0.8 }],
    ['process-1', { id: 'process-1', layer: 'process', frequency: 0.75 }],
    ['integration-1', { id: 'integration-1', layer: 'integration', frequency: 0.7 }],
  ]);

  const engine = new SynergyEngine(nodes);

  // Analyze the pipeline
  const result = engine.evaluatePath(['input-1', 'process-1', 'integration-1']);

  console.log(`Path Type: ${result.type}`);
  console.log(`Aggregated Score: ${result.score.toFixed(2)}`);
  console.log(`Path Energy: ${(result.energy * 100).toFixed(1)}%`);
  console.log('\nAnalysis:');
  result.details.forEach(detail => console.log(`  • ${detail}`));

  // Expected: complement or fusion, score ~1.5-1.7 (with path penalty)
}

// ============================================================================
// EXAMPLE 4: Fractal Pattern Detection
// ============================================================================

/**
 * Example 4: Detect and analyze fractal (repeating) patterns
 */
export function example4_fractalPattern() {
  console.log('=== EXAMPLE 4: Fractal Pattern Detection ===');

  // Create repeating layer pattern: analytics -> process -> analytics -> process
  const nodes = new Map<string, Node>([
    ['a1', { id: 'a1', layer: 'analytics', frequency: 0.6, behavior: 'reactive' }],
    ['p1', { id: 'p1', layer: 'process', frequency: 0.6, behavior: 'reactive' }],
    ['a2', { id: 'a2', layer: 'analytics', frequency: 0.6, behavior: 'reactive' }],
    ['p2', { id: 'p2', layer: 'process', frequency: 0.6, behavior: 'reactive' }],
  ]);

  const engine = new SynergyEngine(nodes);

  // Analyze the fractal path
  const result = engine.evaluatePath(['a1', 'p1', 'a2', 'p2']);

  console.log(`Pattern Type: ${result.type}`);
  if (result.type === 'fractal') {
    console.log('✓ Fractal pattern detected!');
  }

  console.log(`Score: ${result.score.toFixed(2)}`);
  console.log(`Visual Warp Intensity: ${result.visual.warpIntensity.toFixed(2)}`);

  // Expected: type === 'fractal', visual warp 0.25-0.45
}

// ============================================================================
// EXAMPLE 5: Quantum Interaction
// ============================================================================

/**
 * Example 5: Quantum layer creates randomized synergy
 */
export function example5_quantumInteraction() {
  console.log('=== EXAMPLE 5: Quantum Interaction ===');

  const nodes = new Map<string, Node>([
    ['quantum-core', {
      id: 'quantum-core',
      layer: 'quantum',
      frequency: 0.5,
      behavior: 'quantum'
    }],
    ['process-node', {
      id: 'process-node',
      layer: 'process',
      frequency: 0.9,
      behavior: 'reactive'
    }],
  ]);

  const engine = new SynergyEngine(nodes);

  // Evaluate multiple times to see randomness
  console.log('Quantum synergy randomness (5 evaluations):');
  for (let i = 0; i < 5; i++) {
    const result = engine.evaluatePair('quantum-core', 'process-node');
    console.log(`  Attempt ${i + 1}: score=${result.score.toFixed(2)}, glitch=${result.visual.glitch.toFixed(2)}`);
  }

  // Expected: scores vary between ~0.6-1.7 due to randomization
}

// ============================================================================
// EXAMPLE 6: Sigma Validation Layer
// ============================================================================

/**
 * Example 6: Sigma layer creates validation synergy
 */
export function example6_sigmaValidation() {
  console.log('=== EXAMPLE 6: Sigma Validation ===');

  const nodes = new Map<string, Node>([
    ['process-1', {
      id: 'process-1',
      layer: 'process',
      frequency: 0.7,
      behavior: 'stable'
    }],
    ['sigma-judge', {
      id: 'sigma-judge',
      layer: 'sigma',
      frequency: 0.8,
      behavior: 'sigma'
    }],
  ]);

  const engine = new SynergyEngine(nodes);
  const result = engine.evaluatePair('process-1', 'sigma-judge');

  console.log(`Synergy Type: ${result.type}`);
  console.log(`Score: ${result.score.toFixed(2)}`);
  console.log(`Visual Color: ${result.visual.color}`);
  console.log(`Glitch Effect: ${result.visual.glitch}`);

  // Expected: type === 'sigma', score ~0.6-0.8, glitch 0.4, color #00ff00
}

// ============================================================================
// EXAMPLE 7: Network Statistics & Health
// ============================================================================

/**
 * Example 7: Analyze entire network health
 */
export function example7_networkStats() {
  console.log('=== EXAMPLE 7: Network Statistics ===');

  // Create a small network
  const nodes = new Map<string, Node>([
    ['input-1', { id: 'input-1', layer: 'input', frequency: 0.8 }],
    ['process-1', { id: 'process-1', layer: 'process', frequency: 0.75 }],
    ['analytics-1', { id: 'analytics-1', layer: 'analytics', frequency: 0.7 }],
    ['storage-1', { id: 'storage-1', layer: 'storage', frequency: 0.65 }],
  ]);

  const links = new Map<string, Link>([
    ['l1', { id: 'l1', from: 'input-1', to: 'process-1' }],
    ['l2', { id: 'l2', from: 'process-1', to: 'analytics-1' }],
    ['l3', { id: 'l3', from: 'analytics-1', to: 'storage-1' }],
  ]);

  const engine = new SynergyEngine(nodes);
  engine.setLinks(links);

  // Get network stats
  const stats = engine.getNetworkSynergyStats();

  console.log(`Total Links: ${stats.totalLinks}`);
  console.log(`Average Synergy Score: ${stats.avgScore.toFixed(2)}`);
  console.log(`Average Energy: ${(stats.avgEnergy * 100).toFixed(1)}%`);

  console.log('\nSynergy Type Distribution:');
  Object.entries(stats.typeCounts).forEach(([type, count]) => {
    if (count > 0) {
      console.log(`  ${type}: ${count}`);
    }
  });

  console.log('\nTop Synergies:');
  stats.topSynergies.forEach(({ from, to, score, type }, i) => {
    console.log(`  ${i + 1}. ${from} → ${to}: ${type} (${score.toFixed(2)})`);
  });
}

// ============================================================================
// EXAMPLE 8: Node Synergy Queries
// ============================================================================

/**
 * Example 8: Query synergies for a specific node
 */
export function example8_nodeQueries() {
  console.log('=== EXAMPLE 8: Node Synergy Queries ===');

  const nodes = new Map<string, Node>([
    ['hub', { id: 'hub', layer: 'process', frequency: 0.8 }],
    ['input-a', { id: 'input-a', layer: 'input', frequency: 0.7 }],
    ['input-b', { id: 'input-b', layer: 'input', frequency: 0.75 }],
    ['analytics-1', { id: 'analytics-1', layer: 'analytics', frequency: 0.8 }],
  ]);

  const links = new Map<string, Link>([
    ['l1', { id: 'l1', from: 'input-a', to: 'hub' }],
    ['l2', { id: 'l2', from: 'input-b', to: 'hub' }],
    ['l3', { id: 'l3', from: 'hub', to: 'analytics-1' }],
  ]);

  const engine = new SynergyEngine(nodes);
  engine.setLinks(links);

  // Get incoming synergies to hub
  const incoming = engine.getNodeIncomingSynergies('hub');
  console.log(`Incoming synergies to 'hub':`);
  incoming.forEach((result, fromNodeId) => {
    console.log(`  ← ${fromNodeId}: ${result.type} (${result.score.toFixed(2)})`);
  });

  // Get outgoing synergies from hub
  const outgoing = engine.getNodeOutgoingSynergies('hub');
  console.log(`\nOutgoing synergies from 'hub':`);
  outgoing.forEach((result, toNodeId) => {
    console.log(`  → ${toNodeId}: ${result.type} (${result.score.toFixed(2)})`);
  });
}

// ============================================================================
// EXAMPLE 9: Synergy Validation & Filtering
// ============================================================================

/**
 * Example 9: Validate links and filter by quality
 */
export function example9_linkValidation() {
  console.log('=== EXAMPLE 9: Link Validation ===');

  const nodes = new Map<string, Node>([
    ['n1', { id: 'n1', layer: 'input', frequency: 0.8 }],
    ['n2', { id: 'n2', layer: 'process', frequency: 0.75 }],
    ['n3', { id: 'n3', layer: 'control', frequency: 0.5 }],
  ]);

  const engine = new SynergyEngine(nodes);

  // Test various links
  const linksToValidate: Link[] = [
    { id: 'l1', from: 'n1', to: 'n2' },
    { id: 'l2', from: 'n2', to: 'n3' },
    { id: 'l3', from: 'n1', to: 'n3' },
  ];

  // Validate with threshold 1.0
  console.log('Validation with threshold 1.0:');
  for (const link of linksToValidate) {
    const { valid, result } = engine.validateSynergy(link, 1.0);
    console.log(`  ${link.from}→${link.to}: ${valid ? '✓ VALID' : '✗ INVALID'} (${result.score.toFixed(2)}, ${result.type})`);
  }

  // Filter for high-quality links
  const highQuality = linksToValidate.filter(link => {
    const { valid } = engine.validateSynergy(link, 1.5);
    return valid;
  });

  console.log(`\nHigh-quality links (score > 1.5): ${highQuality.length}`);
}

// ============================================================================
// EXAMPLE 10: React Integration Pattern
// ============================================================================

/**
 * Example 10: How to use SynergyEngine in React Three Fiber
 * (Pseudo-code showing integration pattern)
 */
export function example10_reactIntegration() {
  console.log('=== EXAMPLE 10: React Integration Pattern ===');

  // This is pseudo-code showing the pattern
  console.log(`
// In your React component:

import { useRef, useEffect, useState } from 'react';
import { SynergyEngine } from './SynergyEngine';
import type { SynergyResult } from './SynergyEngine';

function MyLinkRenderer() {
  const engineRef = useRef<SynergyEngine | null>(null);
  const [synergies, setSynergies] = useState<Map<string, SynergyResult>>(new Map());

  // Initialize engine
  useEffect(() => {
    engineRef.current = new SynergyEngine(nodesMap);
    engineRef.current.setLinks(linksMap);
  }, [nodesMap, linksMap]);

  // Evaluate all links when they change
  useEffect(() => {
    if (!engineRef.current) return;
    
    const results = new Map<string, SynergyResult>();
    for (const link of linksMap.values()) {
      results.set(link.id, engineRef.current.evaluateLink(link));
    }
    setSynergies(results);
  }, [linksMap]);

  // Render each link with synergy-based visuals
  return (
    <>
      {Array.from(linksMap.values()).map(link => {
        const synergy = synergies.get(link.id);
        if (!synergy) return null;
        
        return (
          <LinkComponent
            key={link.id}
            link={link}
            visual={synergy.visual}
            type={synergy.type}
          />
        );
      })}
    </>
  );
}
  `);
}

// ============================================================================
// EXAMPLE 11: Custom Synergy Analysis
// ============================================================================

/**
 * Example 11: Analyze synergy composition in a cluster
 */
export function example11_clusterAnalysis() {
  console.log('=== EXAMPLE 11: Cluster Analysis ===');

  // Create a cluster of nodes
  const nodes = new Map<string, Node>([
    ['core-1', { id: 'core-1', layer: 'process', frequency: 0.8, behavior: 'stable' }],
    ['core-2', { id: 'core-2', layer: 'process', frequency: 0.82, behavior: 'stable' }],
    ['support-1', { id: 'support-1', layer: 'analytics', frequency: 0.78, behavior: 'stable' }],
  ]);

  const links = new Map<string, Link>([
    ['l1', { id: 'l1', from: 'core-1', to: 'core-2' }],
    ['l2', { id: 'l2', from: 'core-2', to: 'support-1' }],
    ['l3', { id: 'l3', from: 'support-1', to: 'core-1' }],
  ]);

  const engine = new SynergyEngine(nodes);
  engine.setLinks(links);

  // Analyze cluster
  const stats = engine.getNetworkSynergyStats();
  const avgVisual = engine.getGroupVisual(['l1', 'l2', 'l3']);

  console.log('Cluster Health:');
  console.log(`  Avg Score: ${stats.avgScore.toFixed(2)}`);
  console.log(`  Avg Energy: ${(stats.avgEnergy * 100).toFixed(1)}%`);
  console.log(`  Top Type: ${Object.entries(stats.typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0]}`);

  console.log('\nCluster Visual Style:');
  console.log(`  Color: ${avgVisual.color}`);
  console.log(`  Pulse Speed: ${avgVisual.pulseSpeed.toFixed(2)}`);
  console.log(`  Warp: ${avgVisual.warpIntensity.toFixed(2)}`);
  console.log(`  Thickness: ${avgVisual.thickness.toFixed(2)}`);
}

// ============================================================================
// EXAMPLE 12: Performance Monitoring
// ============================================================================

/**
 * Example 12: Monitor synergy engine performance
 */
export function example12_performance() {
  console.log('=== EXAMPLE 12: Performance Monitoring ===');

  const nodes = new Map<string, Node>();
  const links = new Map<string, Link>();

  // Create a large network
  const nodeCount = 50;
  const linkCount = 100;

  for (let i = 0; i < nodeCount; i++) {
    const layers = ['input', 'process', 'integration', 'analytics', 'storage'];
    nodes.set(`node-${i}`, {
      id: `node-${i}`,
      layer: layers[i % layers.length],
      frequency: Math.random(),
    });
  }

  for (let i = 0; i < linkCount; i++) {
    const from = Math.floor(Math.random() * nodeCount);
    const to = Math.floor(Math.random() * nodeCount);
    if (from !== to) {
      links.set(`link-${i}`, {
        id: `link-${i}`,
        from: `node-${from}`,
        to: `node-${to}`,
      });
    }
  }

  const engine = new SynergyEngine(nodes);
  engine.setLinks(links);

  // Time evaluation
  console.time('Single pair evaluation');
  engine.evaluatePair('node-0', 'node-1');
  console.timeEnd('Single pair evaluation');

  console.time('All links evaluation');
  let count = 0;
  for (const link of links.values()) {
    engine.evaluateLink(link);
    count++;
  }
  console.timeEnd('All links evaluation');

  console.time('Network statistics');
  const stats = engine.getNetworkSynergyStats();
  console.timeEnd('Network statistics');

  console.log(`\nPerformance Summary:`);
  console.log(`  Nodes: ${nodes.size}`);
  console.log(`  Links: ${links.size}`);
  console.log(`  Avg score: ${stats.avgScore.toFixed(2)}`);
}

// ============================================================================
// RUN ALL EXAMPLES
// ============================================================================

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  SYNERGY ENGINE INTEGRATION EXAMPLES   ║');
  console.log('╚════════════════════════════════════════╝\n');

  example1_basicSetup();
  console.log('\n---\n');

  example2_shaderIntegration();
  console.log('\n---\n');

  example3_pathAnalysis();
  console.log('\n---\n');

  example4_fractalPattern();
  console.log('\n---\n');

  example5_quantumInteraction();
  console.log('\n---\n');

  example6_sigmaValidation();
  console.log('\n---\n');

  example7_networkStats();
  console.log('\n---\n');

  example8_nodeQueries();
  console.log('\n---\n');

  example9_linkValidation();
  console.log('\n---\n');

  example10_reactIntegration();
  console.log('\n---\n');

  example11_clusterAnalysis();
  console.log('\n---\n');

  example12_performance();

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  ALL EXAMPLES COMPLETED                ║');
  console.log('╚════════════════════════════════════════╝\n');
}
