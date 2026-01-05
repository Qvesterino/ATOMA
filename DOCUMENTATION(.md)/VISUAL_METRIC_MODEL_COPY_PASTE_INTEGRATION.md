# Visual Metric Model v1.0 - Copy/Paste Integration

**Quick Integration:** Copy and paste code blocks below directly into your project.

---

## 📝 Block 1: Import Statement

Add this to your imports section (usually top of main.js or AtomaGame.js):

```javascript
import { VisualMetricModel } from "./VisualMetricModel_v1.js";
```

---

## 🔧 Block 2: AtomaGame Constructor (Initialization)

Add this to your AtomaGame constructor, **after all Phase 3 systems** are initialized:

```javascript
// In AtomaGame constructor, after this.nodeQuality initialization:

// ========== VISUAL METRICS ADAPTER LAYER (Phase 3b Foundation) ==========
this.visualMetrics = new VisualMetricModel(
  this.aiNodes,
  this.nodeLinkingSystem,
  this.nodeDynamics,
  this.nodeQuality,
  this.linkQuality,
  {
    enableNodeMetrics: true,    // Process nodes each frame
    enableLinkMetrics: true,    // Process links each frame
    maxFrameMs: 50,             // Skip if frame exceeds 50ms
  }
);

// Verify initialization
if (this.visualMetrics.getSystemStatus().allReady) {
  console.log("[VisualMetricModel] All Phase 3 systems ready ✓");
} else {
  console.warn("[VisualMetricModel] Warning: Some systems not ready");
}
```

---

## ⚡ Block 3: Game Loop Update (CRITICAL - Must be LAST)

Add this to your main `update(dt)` method, **after all Phase 3 system updates**:

```javascript
update(dt) {
  // ... existing code ...
  
  // ========== PHASE 3 METRICS UPDATE SEQUENCE ==========
  // IMPORTANT: Must be in this order!
  
  // 1. Node dynamic metrics (base metrics)
  this.nodeDynamics.update(dt);
  
  // 2. Link quality (depends on node metrics)
  this.linkQuality.update(dt);
  
  // 3. Node quality (depends on node metrics + link quality)
  this.nodeQuality.update(dt);
  
  // 4. Visual metrics (depends on all above) - MUST BE LAST
  this.visualMetrics.update(dt);
  
  // ... rest of game update ...
}
```

---

## 🎨 Block 4: Basic Usage Example - Color by Quality

Add this to any VFX system that applies colors to nodes:

```javascript
// Apply quality-based coloring to a node
function applyQualityColor(node) {
  const visualMtx = node.userData?.visualMetrics;
  
  if (!visualMtx) return; // No visual metrics yet
  
  let color;
  
  if (visualMtx.isPrime) {
    // Prime nodes: bright green
    color = new THREE.Color(0x00ff00);
  } else if (visualMtx.isCritical) {
    // Critical nodes: bright red
    color = new THREE.Color(0xff0000);
  } else {
    // Normal nodes: gradient from red (low) to green (high) based on quality
    const hue = visualMtx.qualityNorm * 0.3;  // 0 (red) to 0.3 (green)
    const saturation = 1.0;
    const lightness = 0.5;
    color = new THREE.Color().setHSL(hue, saturation, lightness);
  }
  
  // Apply color
  if (node.material) {
    node.material.color = color;
  }
}

// Usage in your render or effect loop:
// for (const node of this.nodes) {
//   applyQualityColor(node);
// }
```

---

## 💡 Block 5: Emissive Intensity by Harmony

Add this to any system that controls emissive/glow intensity:

```javascript
// Apply emissive intensity based on harmony and energy
function applyEmissiveIntensity(node) {
  const visualMtx = node.userData?.visualMetrics;
  
  if (!visualMtx || !node.material) return;
  
  // Blend harmony (70%) and energy (30%) for brightness
  const harmonyComponent = visualMtx.harmonyNorm * 0.7;
  const energyComponent = visualMtx.energyNorm * 0.3;
  const baseIntensity = harmonyComponent + energyComponent;
  
  // Apply 2x multiplier for visibility
  const finalIntensity = baseIntensity * 2.0;
  
  // Cap at reasonable maximum
  node.material.emissiveIntensity = Math.min(finalIntensity, 4.0);
  
  // Optional: Also set emissive color to match node color
  if (node.material.emissive) {
    node.material.emissive = node.material.color;
  }
}

// Usage:
// for (const node of this.nodes) {
//   applyEmissiveIntensity(node);
// }
```

---

## 🔗 Block 6: Link Quality Visualization

Add this to any link rendering or VFX system:

```javascript
// Apply quality-based styling to a link
function applyLinkQualityStyle(link) {
  const visualMtx = link.userData?.visualMetrics;
  
  if (!visualMtx || !link.material) return;
  
  // Set line width based on quality (1px to 4px)
  const lineWidth = 1.0 + visualMtx.qualityNorm * 3.0;
  
  if (link.material.linewidth !== undefined) {
    link.material.linewidth = lineWidth;
  }
  
  // Set opacity based on quality (0.3 to 1.0)
  const opacity = 0.3 + visualMtx.qualityNorm * 0.7;
  
  if (link.material.opacity !== undefined) {
    link.material.opacity = opacity;
  }
  
  // Color by quality (red for low, green for high)
  if (link.material.color) {
    const hue = visualMtx.qualityNorm * 0.3;
    link.material.color.setHSL(hue, 1.0, 0.5);
  }
  
  // Stress-based blinking
  const stressIntensity = visualMtx.stressNorm;
  if (stressIntensity > 0.7) {
    // High stress: blink at 3 Hz
    const blink = Math.sin(Date.now() * 0.006) > 0;
    if (link.material.opacity !== undefined) {
      link.material.opacity *= blink ? 1.0 : 0.3;
    }
  }
}

// Usage:
// for (const link of this.links) {
//   applyLinkQualityStyle(link);
// }
```

---

## 📊 Block 7: Debug Display

Add this to create a debug display for visual metrics:

```javascript
// Create a debug display showing visual metrics for a node
function createDebugDisplay(node) {
  const visualMtx = node.userData?.visualMetrics;
  const dynamicMtx = node.userData?.metrics;
  const qualityData = node.userData?.quality;
  
  if (!visualMtx) return null;
  
  return {
    nodeId: node.id,
    visualMetrics: {
      qualityNorm: visualMtx.qualityNorm.toFixed(3),
      stabilityNorm: visualMtx.stabilityNorm.toFixed(3),
      harmonyNorm: visualMtx.harmonyNorm.toFixed(3),
      energyNorm: visualMtx.energyNorm.toFixed(3),
      synergyNorm: visualMtx.synergyNorm.toFixed(3),
      isPrime: visualMtx.isPrime,
      isCritical: visualMtx.isCritical,
    },
    sourceMetrics: {
      stability: dynamicMtx?.stability.toFixed(1),
      harmony: dynamicMtx?.harmony.toFixed(1),
      quality: qualityData?.quality.toFixed(1),
      level: qualityData?.level,
    },
    updatedAt: new Date(visualMtx.updatedAt).toLocaleTimeString(),
  };
}

// Usage in console:
// console.table(createDebugDisplay(myNode));
```

---

## 🔄 Block 8: Animation Using Synergy

Add this to create dynamic animations driven by synergy:

```javascript
// Animate node based on synergy (pulsing, rotation, etc.)
function updateSynergyAnimation(node, deltaTime) {
  const visualMtx = node.userData?.visualMetrics;
  
  if (!visualMtx) return;
  
  // Pulse frequency increases with synergy
  const baseFrequency = 1.0;  // 1 Hz baseline
  const frequencyBoost = visualMtx.synergyNorm * 5.0;  // Up to +5 Hz
  const frequency = baseFrequency + frequencyBoost;  // 1–6 Hz
  
  // Compute pulse strength (0 to 1)
  const angleRadians = Date.now() * 0.001 * frequency * Math.PI * 2;
  const pulseStrength = Math.sin(angleRadians) * 0.5 + 0.5;  // 0–1
  
  // Apply to emissive intensity
  if (node.material && node.material.emissiveIntensity !== undefined) {
    node.material.emissiveIntensity = 1.0 + pulseStrength;
  }
  
  // Optional: Scale oscillation
  if (node.scale) {
    const scaleOscillation = 1.0 + (pulseStrength * 0.1);  // ±10%
    node.scale.setScalar(scaleOscillation);
  }
  
  // Optional: Rotation based on clarity
  if (node.rotation) {
    const clarityRotationRate = visualMtx.clarityNorm * 2.0;  // rad/sec
    node.rotation.z += clarityRotationRate * deltaTime;
  }
}

// Usage in render loop:
// for (const node of this.nodes) {
//   updateSynergyAnimation(node, deltaTime);
// }
```

---

## 🏥 Block 9: Health/Status Indicator

Add this to display node status as a visual indicator:

```javascript
// Create a visual health indicator based on quality and stability
function applyHealthIndicator(node) {
  const visualMtx = node.userData?.visualMetrics;
  
  if (!visualMtx) return;
  
  // Determine health status
  let status, color, intensity;
  
  if (visualMtx.isPrime) {
    status = "Prime";
    color = new THREE.Color(0x00ff00);  // Green
    intensity = 2.0;
  } else if (visualMtx.qualityNorm > 0.75) {
    status = "Excellent";
    color = new THREE.Color(0x00ff88);  // Light green
    intensity = 1.8;
  } else if (visualMtx.qualityNorm > 0.50) {
    status = "Good";
    color = new THREE.Color(0xffff00);  // Yellow
    intensity = 1.5;
  } else if (visualMtx.qualityNorm > 0.25) {
    status = "Weak";
    color = new THREE.Color(0xff8800);  // Orange
    intensity = 1.2;
  } else {
    status = "Critical";
    color = new THREE.Color(0xff0000);  // Red
    intensity = 2.5;
  }
  
  // Apply to material
  if (node.material) {
    node.material.color = color;
    node.material.emissiveIntensity = intensity;
    node.material.emissive = color;
  }
  
  return status;
}
```

---

## 📈 Block 10: Performance Monitoring

Add this to track performance and ensure frame budget is being respected:

```javascript
// Monitor performance and log statistics
function monitorVisualMetricsPerformance(visualMetrics) {
  const stats = visualMetrics.getPerformanceStats();
  
  return {
    performance: {
      averageFrameMs: stats.averageFrameMs.toFixed(3),
      maxBudgetMs: stats.maxFrameBudgetMs,
      budgetUsagePercent: stats.budgetUsagePercent,
      status: parseFloat(stats.budgetUsagePercent) < 5 ? "✓ Excellent" : "⚠ Monitor",
    },
    samples: stats.updateCount,
    totalTimeMs: stats.totalUpdateMs.toFixed(2),
  };
}

// Usage in console or HUD:
// console.table(monitorVisualMetricsPerformance(this.game.visualMetrics));

// To reset tracking:
// this.game.visualMetrics.resetPerformanceStats();
```

---

## ✅ Block 11: Verification Checklist

Add this to verify everything is working on startup:

```javascript
// Verify VisualMetricModel initialization
function verifyVisualMetricsSetup(game) {
  console.group("[VisualMetricModel] Initialization Check");
  
  const vmm = game.visualMetrics;
  
  if (!vmm) {
    console.error("❌ VisualMetricModel not initialized");
    console.groupEnd();
    return false;
  }
  
  // Check system status
  const status = vmm.getSystemStatus();
  console.log("System Status:", {
    aiNodes: status.aiNodes ? "✓" : "✗",
    linkingSystem: status.linkingSystem ? "✓" : "✗",
    nodeDynamics: status.nodeDynamics ? "✓" : "✗",
    nodeQuality: status.nodeQuality ? "✓" : "✗",
    linkQuality: status.linkQuality ? "✓" : "✗",
    allReady: status.allReady ? "✓ Ready" : "✗ Missing",
  });
  
  // Test a sample node
  if (game.aiNodes.nodes.length > 0) {
    const testNode = game.aiNodes.nodes[0];
    const testMetrics = vmm.getNodeVisualMetrics(testNode);
    console.log("Sample Node Metrics:", testMetrics);
  }
  
  // Check performance
  const perf = vmm.getPerformanceStats();
  console.log("Performance:", {
    averageFrameMs: perf.averageFrameMs.toFixed(3),
    budgetUsage: perf.budgetUsagePercent + "%",
  });
  
  console.groupEnd();
  return status.allReady;
}

// Usage on game startup:
// const verified = verifyVisualMetricsSetup(this.game);
```

---

## 🎯 Integration Steps Summary

1. **Add import statement** (Block 1)
2. **Initialize in AtomaGame constructor** (Block 2)
3. **Update in game loop** (Block 3)
4. **Verify initialization** (Block 11)
5. **Apply to your first VFX system** (Choose from Blocks 4-10)
6. **Monitor performance** (Block 10)

---

## 🔗 Quick Links

- **Full Integration Guide:** VISUAL_METRIC_MODEL_INTEGRATION_GUIDE.md
- **Quick Reference:** VISUAL_METRIC_MODEL_QUICK_REFERENCE.txt
- **Project Summary:** SESSION_42_VISUAL_ADAPTER_SUMMARY.md
- **Source Code:** VisualMetricModel_v1.js

---

**Ready to integrate!** Copy blocks above and paste into your project.
