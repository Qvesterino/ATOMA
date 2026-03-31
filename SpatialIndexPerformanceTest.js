/**
 * Spatial Index Performance Test
 * 
 * Tests the performance improvement of the octree-based spatial index
 * compared to the O(n) raycasting approach.
 * 
 * Run this in the browser console after ATOMA has loaded.
 */

import * as THREE from 'three';
import { NodeSpatialIndex, acceleratedRaycast } from './NodeSpatialIndex.js';

export class SpatialIndexPerformanceTest {
  constructor() {
    this.results = [];
  }

  /**
   * Run comprehensive performance tests
   */
  runTests() {
    console.log('=== SPATIAL INDEX PERFORMANCE TEST ===');
    console.log('Testing raycasting performance with different node counts...\n');

    // Test with different node counts
    const nodeCounts = [10, 50, 100, 200, 500];
    
    for (const count of nodeCounts) {
      console.log(`\n--- Testing with ${count} nodes ---`);
      this.testNodeCount(count);
    }

    // Print summary
    this.printSummary();
  }

  /**
   * Test performance with a specific node count
   */
  testNodeCount(nodeCount) {
    // Generate test nodes
    const nodes = this.generateTestNodes(nodeCount);
    const raycaster = new THREE.Raycaster();
    const rayOrigin = new THREE.Vector3(0, 10, 0);
    const rayDirection = new THREE.Vector3(0, -1, 0);
    raycaster.set(rayOrigin, rayDirection);
    raycaster.far = 100;

    // Test O(n) approach
    const onTime = this.testONApproach(raycaster, nodes);
    
    // Test O(log n) approach with spatial index
    const spatialIndex = new NodeSpatialIndex({ worldSize: 200, maxDepth: 6 });
    for (const node of nodes) {
      spatialIndex.insert(node);
    }
    const logTime = this.testLogNApproach(raycaster, spatialIndex);

    // Calculate improvement
    const improvement = ((onTime - logTime) / onTime * 100).toFixed(2);
    const speedup = (onTime / logTime).toFixed(2);

    console.log(`  O(n) approach:     ${onTime.toFixed(3)}ms`);
    console.log(`  O(log n) approach: ${logTime.toFixed(3)}ms`);
    console.log(`  Improvement:        ${improvement}% faster`);
    console.log(`  Speedup:           ${speedup}x`);

    // Store results
    this.results.push({
      nodeCount,
      onTime,
      logTime,
      improvement: parseFloat(improvement),
      speedup: parseFloat(speedup)
    });
  }

  /**
   * Test O(n) raycasting approach
   */
  testONApproach(raycaster, nodes) {
    const iterations = 100;
    let totalTime = 0;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      // O(n) raycast against all nodes
      const intersects = raycaster.intersectObjects(nodes, false);
      
      const elapsed = performance.now() - start;
      totalTime += elapsed;
    }

    return totalTime / iterations;
  }

  /**
   * Test O(log n) spatial index approach
   */
  testLogNApproach(raycaster, spatialIndex) {
    const iterations = 100;
    let totalTime = 0;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      // O(log n) raycast using spatial index
      const intersects = acceleratedRaycast(raycaster, spatialIndex, false);
      
      const elapsed = performance.now() - start;
      totalTime += elapsed;
    }

    return totalTime / iterations;
  }

  /**
   * Generate test nodes distributed in space
   */
  generateTestNodes(count) {
    const nodes = [];
    const worldSize = 100;

    for (let i = 0; i < count; i++) {
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const mesh = new THREE.Mesh(geometry, material);

      // Random position within world bounds
      mesh.position.set(
        (Math.random() - 0.5) * worldSize,
        (Math.random() - 0.5) * worldSize * 0.5,
        (Math.random() - 0.5) * worldSize
      );

      // Add userData for node identification
      mesh.userData = {
        nodeId: i,
        category: 'test',
        isRaycastTarget: true
      };

      nodes.push(mesh);
    }

    return nodes;
  }

  /**
   * Print summary of all test results
   */
  printSummary() {
    console.log('\n=== PERFORMANCE TEST SUMMARY ===');
    console.log('\nNode Count | O(n) (ms) | O(log n) (ms) | Improvement | Speedup');
    console.log('-----------|------------|---------------|-------------|--------');

    for (const result of this.results) {
      const nodeCount = result.nodeCount.toString().padEnd(10);
      const onTime = result.onTime.toFixed(3).padEnd(11);
      const logTime = result.logTime.toFixed(3).padEnd(14);
      const improvement = result.improvement.toFixed(1).padEnd(12) + '%';
      const speedup = result.speedup.toFixed(1) + 'x';

      console.log(`${nodeCount} | ${onTime} | ${logTime} | ${improvement} | ${speedup}`);
    }

    // Calculate average improvement
    const avgImprovement = (this.results.reduce((sum, r) => sum + r.improvement, 0) / this.results.length).toFixed(1);
    const avgSpeedup = (this.results.reduce((sum, r) => sum + r.speedup, 0) / this.results.length).toFixed(1);

    console.log(`\nAverage improvement: ${avgImprovement}%`);
    console.log(`Average speedup: ${avgSpeedup}x`);
    console.log('\n=== END OF TEST ===');
  }

  /**
   * Test proximity query performance
   */
  testProximityQueries() {
    console.log('\n=== PROXIMITY QUERY TEST ===');
    console.log('Testing spatial query performance...\n');

    const nodeCounts = [50, 100, 200, 500];
    const queryRadius = 20;

    for (const count of nodeCounts) {
      console.log(`\n--- Testing with ${count} nodes ---`);
      
      // Generate test nodes
      const nodes = this.generateTestNodes(count);
      const queryCenter = new THREE.Vector3(0, 0, 0);

      // Test O(n) approach
      const onTime = this.testProximityON(queryCenter, queryRadius, nodes);
      
      // Test O(log n) approach
      const spatialIndex = new NodeSpatialIndex({ worldSize: 200, maxDepth: 6 });
      for (const node of nodes) {
        spatialIndex.insert(node);
      }
      const logTime = this.testProximityLogN(queryCenter, queryRadius, spatialIndex);

      // Calculate improvement
      const improvement = ((onTime - logTime) / onTime * 100).toFixed(2);
      const speedup = (onTime / logTime).toFixed(2);

      console.log(`  O(n) approach:     ${onTime.toFixed(3)}ms`);
      console.log(`  O(log n) approach: ${logTime.toFixed(3)}ms`);
      console.log(`  Improvement:        ${improvement}% faster`);
      console.log(`  Speedup:           ${speedup}x`);
    }
  }

  /**
   * Test O(n) proximity query
   */
  testProximityON(center, radius, nodes) {
    const iterations = 100;
    let totalTime = 0;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      // O(n) distance check
      const results = [];
      for (const node of nodes) {
        const distance = center.distanceTo(node.position);
        if (distance < radius) {
          results.push(node);
        }
      }
      
      const elapsed = performance.now() - start;
      totalTime += elapsed;
    }

    return totalTime / iterations;
  }

  /**
   * Test O(log n) proximity query using spatial index
   */
  testProximityLogN(center, radius, spatialIndex) {
    const iterations = 100;
    let totalTime = 0;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      // O(log n) spatial query
      const results = spatialIndex.querySphere(center, radius);
      
      const elapsed = performance.now() - start;
      totalTime += elapsed;
    }

    return totalTime / iterations;
  }

  /**
   * Test spatial index statistics
   */
  testSpatialIndexStats() {
    console.log('\n=== SPATIAL INDEX STATISTICS ===');
    
    const nodeCount = 200;
    const nodes = this.generateTestNodes(nodeCount);
    
    const spatialIndex = new NodeSpatialIndex({ worldSize: 200, maxDepth: 6 });
    for (const node of nodes) {
      spatialIndex.insert(node);
    }

    const stats = spatialIndex.getStats();
    
    console.log('\nSpatial Index Statistics:');
    console.log(`  Total Objects: ${stats.objectCount}`);
    console.log(`  Inserts: ${stats.inserts}`);
    console.log(`  Tree Depth: ${stats.treeStats.depth}`);
    console.log(`  Has Children: ${stats.treeStats.hasChildren}`);
    console.log(`  Local Objects: ${stats.treeStats.localObjectCount}`);
    
    if (stats.treeStats.children) {
      console.log(`  Child Nodes: ${stats.treeStats.children.length}`);
    }

    console.log('\nDetailed Tree Structure:');
    this.printTreeStats(stats.treeStats, 0);
  }

  /**
   * Print tree statistics recursively
   */
  printTreeStats(nodeStats, indent) {
    const prefix = '  '.repeat(indent);
    console.log(`${prefix}Node (depth ${nodeStats.depth}):`);
    console.log(`${prefix}  Objects: ${nodeStats.objectCount}`);
    console.log(`${prefix}  Local: ${nodeStats.localObjectCount}`);
    console.log(`${prefix}  Children: ${nodeStats.hasChildren ? 'Yes' : 'No'}`);

    if (nodeStats.children) {
      for (const child of nodeStats.children) {
        this.printTreeStats(child, indent + 1);
      }
    }
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  window.SpatialIndexPerformanceTest = SpatialIndexPerformanceTest;
  
  // Convenience function to run tests
  window.runSpatialIndexTests = () => {
    const test = new SpatialIndexPerformanceTest();
    test.runTests();
    test.testProximityQueries();
    test.testSpatialIndexStats();
  };
  
  console.log('Spatial Index Performance Test loaded.');
  console.log('Run tests with: runSpatialIndexTests()');
}
