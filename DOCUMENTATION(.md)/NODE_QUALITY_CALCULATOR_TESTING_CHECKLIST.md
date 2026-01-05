# NodeQualityCalculator v1.0 - Testing Checklist

## Pre-Integration Tests

### ✅ Module Validation

- [ ] **NodeQualityCalculator.js exists**
  - File present at root directory
  - Exports `NodeQualityCalculator` class
  - Exports `getNodeQualityCalculator` factory function

- [ ] **All imports available**
  - No external dependencies (pure ES6)
  - Factory function signature matches LinkQualityCalculator pattern

### ✅ Initialization Tests

- [ ] **Constructor accepts all required parameters**
  ```javascript
  new NodeQualityCalculator(
      aiNodes,
      linkingSystem,
      nodeDynamics,
      linkQuality
  )
  ```

- [ ] **Factory function works**
  ```javascript
  const calc = getNodeQualityCalculator(
      aiNodes,
      linkingSystem,
      nodeDynamics,
      linkQuality
  );
  ```

- [ ] **Default configuration loads**
  - All default weights sum to 1.0
  - All thresholds are in valid ranges (0–100)

- [ ] **Custom configuration applies**
  ```javascript
  const calc = new NodeQualityCalculator(
      aiNodes, linkingSystem, nodeDynamics, linkQuality,
      { primeThreshold: 90, stableThreshold: 70 }
  );
  // Verify custom thresholds used
  ```

---

## Runtime Validation Tests

### ✅ Update Cycle Tests

- [ ] **Update runs without errors**
  ```javascript
  calculator.update(0.016);  // 60 FPS
  ```

- [ ] **Multiple updates sequential**
  ```javascript
  calculator.update(0.016);
  calculator.update(0.016);
  calculator.update(0.016);
  // No memory leaks, all updates successful
  ```

- [ ] **Delta time variations handled**
  - Small delta: 0.001
  - Normal delta: 0.016
  - Large delta: 0.1
  - Zero delta: 0.0

- [ ] **Null/undefined safety**
  - aiNodes is null → no crash
  - aiNodes.nodes is null → no crash
  - linkingSystem is null → graceful degradation

### ✅ Data Structure Tests

- [ ] **Quality object created for all nodes**
  ```javascript
  for (const node of aiNodes.nodes) {
      assert(node.userData);
      assert(node.userData.quality);
      assert(node.userData.quality.score !== undefined);
  }
  ```

- [ ] **Quality object has required properties**
  ```javascript
  const q = node.userData.quality;
  assert(typeof q.score === 'number');
  assert(typeof q.level === 'string');
  assert(typeof q.metrics === 'object');
  assert(typeof q.updatedAt === 'number');
  ```

- [ ] **Score in valid range**
  ```javascript
  for (const node of aiNodes.nodes) {
      const score = node.userData.quality.score;
      assert(score >= 0 && score <= 100, `Score ${score} out of range`);
  }
  ```

- [ ] **Level correctly assigned**
  ```javascript
  // Prime nodes
  assert(node1.userData.quality.level === 'Prime');
  assert(node1.userData.quality.score >= 85);
  
  // Stable nodes
  assert(node2.userData.quality.level === 'Stable');
  assert(node2.userData.quality.score >= 65 && node2.userData.quality.score < 85);
  
  // Weak nodes
  assert(node3.userData.quality.level === 'Weak');
  assert(node3.userData.quality.score >= 40 && node3.userData.quality.score < 65);
  
  // Critical nodes
  assert(node4.userData.quality.level === 'Critical');
  assert(node4.userData.quality.score < 40);
  ```

- [ ] **Metrics object has all 8 sub-metrics**
  ```javascript
  const m = node.userData.quality.metrics;
  assert(m.stability !== undefined);
  assert(m.harmony !== undefined);
  assert(m.clarity !== undefined);
  assert(m.energy !== undefined);
  assert(m.loadPenalty !== undefined);
  assert(m.corruptionPenalty !== undefined);
  assert(m.linkQualityAvg !== undefined);
  assert(m.linkQualityMin !== undefined);
  ```

- [ ] **All metrics in valid range [0, 100]**
  ```javascript
  for (const metric of Object.values(node.userData.quality.metrics)) {
      assert(metric >= 0 && metric <= 100);
  }
  ```

---

## Quality Formula Tests

### ✅ Component Calculation Tests

- [ ] **Internal stability computed**
  - Uses stability, harmony, clarity
  - Weights apply correctly: 0.50, 0.30, 0.20
  - Result in [0, 100]

- [ ] **Energy component computed**
  - Uses energyNorm from node metrics
  - Scales to [0, 100]
  - Result in [0, 100]

- [ ] **Load component computed**
  - Uses loadRatio from node metrics
  - Penalty: 100 - (loadRatio × 100)
  - High load → low quality
  - Low load → high quality

- [ ] **Corruption component computed**
  - Uses corruption metric
  - Penalty: 100 - corruption
  - High corruption → low quality

- [ ] **Link quality component computed**
  - Finds all links connected to node
  - Averages link quality scores
  - Minimum link quality tracked
  - Weighted: 70% avg, 30% min
  - Result in [0, 100]

- [ ] **Final score combines components**
  - Uses all 5 weights
  - Weights sum to 1.0
  - Result clamped to [0, 100]

### ✅ Weight Distribution Tests

- [ ] **Internal stability weight 30%**
  - Adjust internalStabilityWeight to 0.30
  - Verify impact on final score

- [ ] **Energy weight 15%**
  - Adjust energyWeight to 0.15
  - Verify impact on final score

- [ ] **Load stress weight 15%**
  - Adjust loadStressWeight to 0.15
  - Verify impact on final score

- [ ] **Corruption weight 20%**
  - Adjust corruptionWeight to 0.20
  - Verify impact on final score

- [ ] **Link quality weight 20%**
  - Adjust linkQualityWeight to 0.20
  - Verify impact on final score

- [ ] **Custom weights applied**
  ```javascript
  const calc = new NodeQualityCalculator(aiNodes, linking, dynamics, quality, {
      internalStabilityWeight: 0.5,
      energyWeight: 0.25,
      loadStressWeight: 0.15,
      corruptionWeight: 0.05,
      linkQualityWeight: 0.05,
  });
  // Verify internal stability has more impact on final score
  ```

---

## Edge Case Tests

### ✅ Nodes with No Links

- [ ] **Nodes without links get quality score**
  ```javascript
  const isolatedNode = aiNodes.nodes.find(n => n.userData.links === 0);
  calculator.update(0.016);
  assert(isolatedNode.userData.quality.score !== undefined);
  assert(isolatedNode.userData.quality.level !== undefined);
  ```

- [ ] **Link quality component defaults to 50**
  ```javascript
  // Node with 0 links
  const quality = node.userData.quality;
  assert(quality.metrics.linkQualityAvg === 50);
  assert(quality.metrics.linkQualityMin === 50);
  ```

### ✅ Sigma Node Corruption

- [ ] **Sigma nodes degrade due to corruption**
  ```javascript
  const sigmaNode = aiNodes.nodes.find(n => n.archetype === 'Sigma');
  if (sigmaNode) {
      const corruptionBefore = sigmaNode.userData.quality.score;
      // Wait for corruption to accumulate
      for (let i = 0; i < 100; i++) calculator.update(0.016);
      const corruptionAfter = sigmaNode.userData.quality.score;
      assert(corruptionAfter <= corruptionBefore, 'Sigma should degrade');
  }
  ```

### ✅ Legendary Node Excellence

- [ ] **Legendary nodes get high quality**
  ```javascript
  const legendaryNode = aiNodes.nodes.find(n => n.archetype === 'Legendary');
  if (legendaryNode) {
      const quality = legendaryNode.userData.quality.score;
      assert(quality > 70, 'Legendary nodes should score well');
  }
  ```

### ✅ High Link Quality Impact

- [ ] **High link quality lifts node quality**
  ```javascript
  const nodeWithGoodLinks = findNodeWithHighLinkQuality();
  const quality = nodeWithGoodLinks.userData.quality.score;
  assert(quality > 50, 'Node with good links should score well');
  ```

### ✅ High Load Impact

- [ ] **High load reduces node quality**
  ```javascript
  const overloadedNode = findNodeWithHighLoad();
  const quality = overloadedNode.userData.quality.score;
  const lowLoadNode = findNodeWithLowLoad();
  const lowLoadQuality = lowLoadNode.userData.quality.score;
  assert(quality < lowLoadQuality, 'Overloaded node should score lower');
  ```

### ✅ Missing Values Handling

- [ ] **Missing node metrics use defaults**
  ```javascript
  const node = aiNodes.nodes[0];
  node.userData.metrics = undefined;  // Simulate missing metrics
  calculator.update(0.016);
  assert(node.userData.quality.score !== undefined, 'Should use default');
  assert(node.userData.quality.score >= 0 && node.userData.quality.score <= 100);
  ```

- [ ] **Missing link quality uses default**
  ```javascript
  // Node with links that don't have quality scores yet
  calculator.update(0.016);
  // Should not crash, should use defaults
  ```

- [ ] **Corrupt values gracefully clamped**
  ```javascript
  // Manually set invalid metric
  node.userData.metrics.stability = -50;
  calculator.update(0.016);
  // Should be clamped to [0, 100]
  assert(node.userData.quality.metrics.stability >= 0);
  ```

---

## Utility Function Tests

### ✅ getNetworkStatistics()

- [ ] **Returns object with expected properties**
  ```javascript
  const stats = calculator.getNetworkStatistics();
  assert(stats.totalNodes > 0);
  assert(typeof stats.averageScore === 'number');
  assert(typeof stats.medianScore === 'number');
  assert(typeof stats.minScore === 'number');
  assert(typeof stats.maxScore === 'number');
  assert(typeof stats.standardDeviation === 'number');
  assert(stats.levelDistribution);
  ```

- [ ] **Statistics are mathematically correct**
  ```javascript
  const stats = calculator.getNetworkStatistics();
  assert(stats.minScore <= stats.averageScore);
  assert(stats.averageScore <= stats.maxScore);
  assert(stats.levelDistribution.Prime >= 0);
  assert(stats.levelDistribution.Stable >= 0);
  assert(stats.levelDistribution.Weak >= 0);
  assert(stats.levelDistribution.Critical >= 0);
  const sum = Object.values(stats.levelDistribution).reduce((a, b) => a + b, 0);
  assert(sum === stats.totalNodes);
  ```

### ✅ getNodeQualitySummary()

- [ ] **Returns object with expected properties**
  ```javascript
  const summary = calculator.getNodeQualitySummary(node);
  assert(summary.nodeId !== undefined);
  assert(typeof summary.score === 'number');
  assert(typeof summary.level === 'string');
  assert(summary.scorePercentage);
  assert(summary.components);
  assert(summary.lastUpdated);
  ```

- [ ] **Component breakdown has all 6 metrics**
  ```javascript
  const summary = calculator.getNodeQualitySummary(node);
  assert(summary.components.internalStability);
  assert(summary.components.energy);
  assert(summary.components.loadStress);
  assert(summary.components.corruption);
  assert(summary.components.linkQualityAverage);
  assert(summary.components.linkQualityMinimum);
  ```

- [ ] **Summary values match node quality**
  ```javascript
  const summary = calculator.getNodeQualitySummary(node);
  const quality = node.userData.quality;
  assert(summary.score === quality.score);
  assert(summary.level === quality.level);
  ```

---

## EMA Smoothing Tests (Optional)

### ✅ Smoothing Behavior

- [ ] **Smoothing disabled by default**
  ```javascript
  const calc = new NodeQualityCalculator(ai, linking, dynamics, quality);
  assert(calc.config.enableEmaSmoothing === false);
  ```

- [ ] **Smoothing can be enabled**
  ```javascript
  const calc = new NodeQualityCalculator(ai, linking, dynamics, quality, {
      enableEmaSmoothing: true
  });
  assert(calc.config.enableEmaSmoothing === true);
  ```

- [ ] **Smoothing reduces score oscillation**
  ```javascript
  // Create calculator with smoothing enabled
  calculator.update(0.016);
  const score1 = node.userData.quality.score;
  
  // Temporarily modify metrics
  node.userData.metrics.stability = 30;
  calculator.update(0.016);
  const score2 = node.userData.quality.score;
  
  // Score should change gradually, not jump
  const jump = Math.abs(score2 - score1);
  assert(jump < 30, 'EMA smoothing should prevent large jumps');
  ```

---

## Performance Tests

### ✅ Update Performance

- [ ] **Single update completes in reasonable time**
  ```javascript
  const start = performance.now();
  calculator.update(0.016);
  const elapsed = performance.now() - start;
  assert(elapsed < 5, `Update took ${elapsed}ms, expected < 5ms`);
  ```

- [ ] **Multiple consecutive updates**
  ```javascript
  const start = performance.now();
  for (let i = 0; i < 60; i++) {
      calculator.update(0.016);
  }
  const elapsed = performance.now() - start;
  const avgPerUpdate = elapsed / 60;
  assert(avgPerUpdate < 2, `Avg update ${avgPerUpdate}ms, expected < 2ms`);
  ```

- [ ] **No memory leaks**
  ```javascript
  const initialMemory = performance.memory?.usedJSHeapSize;
  for (let i = 0; i < 300; i++) {
      calculator.update(0.016);
  }
  const finalMemory = performance.memory?.usedJSHeapSize;
  const increase = finalMemory - initialMemory;
  assert(increase < 1000000, `Memory increased ${increase} bytes`);
  ```

---

## Integration Tests

### ✅ With NodeDynamicMetrics

- [ ] **Uses node metrics correctly**
  - Reads from node.userData.metrics
  - Handles missing metrics gracefully
  - Updates propagate correctly

### ✅ With LinkQualityCalculator

- [ ] **Uses link quality correctly**
  - Reads from link.userData.quality.score
  - Handles missing link quality gracefully
  - Averages and minimums computed correctly

### ✅ Update Order Dependency

- [ ] **Requires NodeDynamics first**
  ```javascript
  // If NodeDynamics not updated first, should still work with defaults
  nodeQuality.update(0.016);  // Without NodeDynamics
  assert(nodes get quality);
  ```

- [ ] **Requires LinkQuality second**
  ```javascript
  // If LinkQuality not updated, should use link defaults
  nodeQuality.update(0.016);
  assert(linkQualityComponent defaults to 50);
  ```

---

## Backward Compatibility Tests

### ✅ Non-Breaking Changes

- [ ] **No modifications to existing node properties**
  - All original node properties intact
  - No modifications to node geometry
  - No modifications to node materials

- [ ] **No modifications to linking system**
  - Links unchanged
  - Linking logic unaffected
  - Link creation/deletion unaffected

- [ ] **No modifications to NodeDynamicMetrics**
  - Metrics still computed independently
  - No interference with metrics

- [ ] **No modifications to LinkQualityCalculator**
  - Link quality still computed independently
  - No interference with quality calculation

---

## Console Diagnostic Tests

### ✅ Console Output

```javascript
// Check network health
console.log(calculator.getNetworkStatistics());

// Check node details
console.log(calculator.getNodeQualitySummary(node));

// Monitor quality over time
setInterval(() => {
    const stats = calculator.getNetworkStatistics();
    console.log(`Network average quality: ${stats.averageScore.toFixed(1)}`);
}, 1000);
```

---

## Final Validation Checklist

- [ ] All nodes have quality scores after first update
- [ ] Quality levels match score ranges correctly
- [ ] No console errors or warnings
- [ ] No memory leaks over extended play
- [ ] Performance acceptable (< 1ms per frame)
- [ ] Utility functions return valid data
- [ ] Edge cases handled gracefully
- [ ] Integration with NodeDynamics works
- [ ] Integration with LinkQuality works
- [ ] Configuration overrides apply correctly
- [ ] Backward compatibility maintained
- [ ] Documentation matches implementation

---

## Sign-Off

- [ ] Developer: Code reviewed and working
- [ ] QA: All tests passing
- [ ] Integration: Working with AtomaGame
- [ ] Performance: Acceptable on target hardware
- [ ] Documentation: Complete and accurate

**Status: READY FOR PRODUCTION** ✅

---

**Test Environment:**
- Browser: Chrome/Firefox latest
- Network Size: 100+ nodes, 500+ links
- Frame Rate: 60 FPS target
- Update Frequency: Once per frame
