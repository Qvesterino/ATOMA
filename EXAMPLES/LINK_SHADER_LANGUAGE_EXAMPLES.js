/**
 * LinkShaderLanguage_v1.0 — Usage Examples
 * 
 * Practical examples for customizing and debugging the link shader system.
 * Run these in browser console after game initialization.
 */

// ============================================================================
// EXAMPLE 1: View System Status
// ============================================================================
function viewLinkShaderStatus() {
  const status = game.linkShaderLanguage.getStatus();
  console.log('=== Link Shader Language Status ===');
  console.log('Enabled:', status.enabled);
  console.log('Patched:', status.patched);
  console.log('Tracked Links:', status.trackedLinksCount);
  console.log('Debug Mode:', status.debugMode);
  console.log('Metrics:', status.metrics);
}
// Usage: viewLinkShaderStatus()

// ============================================================================
// EXAMPLE 2: Enable Debug Mode
// ============================================================================
function enableLinkShaderDebug() {
  game.linkShaderLanguage.setDebugMode(true);
  console.log('✓ Link Shader Debug Mode ENABLED');
  console.log('→ Run debugLinkShaderSelectedLink() to see uniforms');
}
// Usage: enableLinkShaderDebug()

// ============================================================================
// EXAMPLE 3: Log Selected Link Shader State
// ============================================================================
function debugLinkShaderSelectedLink() {
  game.linkShaderLanguage.debugLogSelectedLink();
}
// Usage: debugLinkShaderSelectedLink()

// ============================================================================
// EXAMPLE 4: Simulate High Corruption
// ============================================================================
function simulateHighCorruption() {
  game.corruptionLevel = 85;  // 85/100
  console.log('Corruption set to 85% → Expect fracture effects on links');
  
  // Reset after 5 seconds
  setTimeout(() => {
    game.corruptionLevel = 0;
    console.log('Corruption reset to 0%');
  }, 5000);
}
// Usage: simulateHighCorruption()

// ============================================================================
// EXAMPLE 5: Simulate High Stress
// ============================================================================
function simulateHighStress() {
  game.stressLevel = 75;  // 75/100
  console.log('Stress set to 75% → Expect flicker on links');
  
  // Reset after 5 seconds
  setTimeout(() => {
    game.stressLevel = 0;
    console.log('Stress reset to 0%');
  }, 5000);
}
// Usage: simulateHighStress()

// ============================================================================
// EXAMPLE 6: Change Link Colors
// ============================================================================
function changeLinkShaderColors(colorA_hex, colorB_hex) {
  const materials = game.linkingSystem?.visuals?.materials;
  if (!materials) {
    console.warn('Visuals not ready');
    return;
  }

  // Update all link materials
  Object.values(materials).forEach(material => {
    if (material?.uniforms) {
      material.uniforms.uColorA.value = new THREE.Color(colorA_hex);
      material.uniforms.uColorB.value = new THREE.Color(colorB_hex);
      material.needsUpdate = true;
    }
  });

  console.log(`✓ Link colors changed: ${colorA_hex} → ${colorB_hex}`);
}
// Usage: changeLinkShaderColors(0x0088ff, 0xff0000)  // Blue to Red

// ============================================================================
// EXAMPLE 7: Adjust Flow Speed
// ============================================================================
function adjustLinkFlowSpeed(speed) {
  // speed: 0.5 = slow, 1.0 = normal, 2.0 = fast
  const materials = game.linkingSystem?.visuals?.materials;
  if (!materials) {
    console.warn('Visuals not ready');
    return;
  }

  Object.values(materials).forEach(material => {
    if (material?.uniforms?.uFlow) {
      material.uniforms.uFlow.value = speed;
      material.needsUpdate = true;
    }
  });

  console.log(`✓ Link flow speed set to ${speed}x (1.0 = normal)`);
}
// Usage: adjustLinkFlowSpeed(1.5)  // 50% faster

// ============================================================================
// EXAMPLE 8: Adjust Edge Quality
// ============================================================================
function adjustLinkEdgeQuality(quality) {
  // quality: 0.0 = rough, 1.0 = clean
  const materials = game.linkingSystem?.visuals?.materials;
  if (!materials) {
    console.warn('Visuals not ready');
    return;
  }

  Object.values(materials).forEach(material => {
    if (material?.uniforms?.uQuality) {
      material.uniforms.uQuality.value = quality;
      material.needsUpdate = true;
    }
  });

  console.log(`✓ Link quality set to ${quality.toFixed(2)} (0=rough, 1=clean)`);
}
// Usage: adjustLinkEdgeQuality(0.95)  // Very clean

// ============================================================================
// EXAMPLE 9: Adjust Saturation
// ============================================================================
function adjustLinkSaturation(saturation) {
  // saturation: 0.0 = grayscale, 1.0 = full color
  const materials = game.linkingSystem?.visuals?.materials;
  if (!materials) {
    console.warn('Visuals not ready');
    return;
  }

  Object.values(materials).forEach(material => {
    if (material?.uniforms?.uSaturation) {
      material.uniforms.uSaturation.value = saturation;
      material.needsUpdate = true;
    }
  });

  console.log(`✓ Link saturation set to ${saturation.toFixed(2)}`);
}
// Usage: adjustLinkSaturation(0.5)  // Half saturation (desaturated)

// ============================================================================
// EXAMPLE 10: Get Current Shader Metrics
// ============================================================================
function getLinkShaderMetrics() {
  const metrics = game.linkShaderLanguage.getMetrics();
  console.log('=== Current Link Shader Metrics ===');
  console.log(`Corruption: ${(metrics.corruption * 100).toFixed(1)}%`);
  console.log(`Stress:     ${(metrics.stress * 100).toFixed(1)}%`);
  console.log(`Flow:       ${(metrics.flow * 100).toFixed(1)}%`);
  console.log(`Time:       ${metrics.time.toFixed(2)}s`);
  return metrics;
}
// Usage: getLinkShaderMetrics()

// ============================================================================
// EXAMPLE 11: Monitor Metrics Over Time
// ============================================================================
function monitorLinkShaderMetrics(intervalMs = 1000) {
  console.log('🔍 Monitoring link shader metrics (press to stop)...');
  
  const interval = setInterval(() => {
    const m = game.linkShaderLanguage.getMetrics();
    console.log(
      `[${m.time.toFixed(2)}s] Corruption: ${(m.corruption*100).toFixed(0)}% | ` +
      `Stress: ${(m.stress*100).toFixed(0)}% | Flow: ${(m.flow*100).toFixed(0)}%`
    );
  }, intervalMs);
  
  // Store interval ID for manual stop
  window.monitorInterval = interval;
  console.log('→ Stop with: clearInterval(window.monitorInterval)');
}
// Usage: monitorLinkShaderMetrics(500)  // Log every 500ms

// ============================================================================
// EXAMPLE 12: Rapid Effect Testing
// ============================================================================
function testLinkShaderEffects() {
  console.log('🎨 Testing link shader effects...');
  
  // Test 1: Corruption effect
  console.log('→ Testing corruption effect...');
  game.corruptionLevel = 80;
  setTimeout(() => {
    game.corruptionLevel = 0;
    console.log('✓ Corruption effect tested');
    
    // Test 2: Stress effect
    console.log('→ Testing stress effect...');
    game.stressLevel = 80;
    setTimeout(() => {
      game.stressLevel = 0;
      console.log('✓ Stress effect tested');
      
      // Test 3: Flow effect
      console.log('→ Testing flow effect (already running)');
      console.log('✓ All effects tested!');
    }, 3000);
  }, 3000);
}
// Usage: testLinkShaderEffects()

// ============================================================================
// EXAMPLE 13: Compare Before/After Shader
// ============================================================================
function toggleLinkShader() {
  const current = window.LINK_SHADER_ENABLED ?? true;
  const newState = !current;
  
  // Note: Actual toggle requires config reload
  console.log(`Link Shader would toggle: ${current} → ${newState}`);
  console.log('To actually toggle, modify config.js and reload');
  
  window.LINK_SHADER_ENABLED = newState;
}
// Usage: toggleLinkShader()

// ============================================================================
// EXAMPLE 14: Create Custom Shader Material
// ============================================================================
function createCustomLinkMaterial(config = {}) {
  const {
    color = 0x00ffff,
    flowSpeed = 1.0,
    quality = 0.8,
    colorA = new THREE.Color(0x0088ff),
    colorB = new THREE.Color(0xff00aa)
  } = config;
  
  const material = LinkShaderLanguage.createLinkMaterial({
    color,
    opacity: 0.9,
    flowSpeed,
    quality,
    categoryColorA: colorA,
    categoryColorB: colorB,
    saturation: 0.9
  });
  
  console.log('✓ Custom link material created');
  return material;
}
// Usage:
// const mat = createCustomLinkMaterial({
//   flowSpeed: 1.5,
//   quality: 0.95,
//   colorA: new THREE.Color(0x00ff00),
//   colorB: new THREE.Color(0xff0000)
// })

// ============================================================================
// EXAMPLE 15: Comprehensive Performance Report
// ============================================================================
function reportLinkShaderPerformance() {
  const status = game.linkShaderLanguage.getStatus();
  
  console.log('=== Link Shader Language Performance Report ===');
  console.log(`Status: ${status.enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
  console.log(`Patched: ${status.patched ? '✅ YES' : '❌ NO'}`);
  console.log(`Tracked Links: ${status.trackedLinksCount}`);
  
  // Memory estimate
  const memoryPerLink = 1; // KB
  const estimatedMemory = (status.trackedLinksCount * memoryPerLink / 1024).toFixed(2);
  console.log(`Estimated Memory: ~${estimatedMemory}MB`);
  
  // Metrics
  const m = status.metrics;
  console.log(`\nNetwork State:`);
  console.log(`  Corruption: ${(m.corruption * 100).toFixed(1)}%`);
  console.log(`  Stress:     ${(m.stress * 100).toFixed(1)}%`);
  console.log(`  Flow:       ${(m.flow * 100).toFixed(1)}%`);
  
  // Feature detection
  const hasWebGL2 = !!document.createElement('canvas').getContext('webgl2');
  console.log(`\nBrowser Capabilities:`);
  console.log(`  WebGL 2: ${hasWebGL2 ? '✅' : '⚠️ (fallback to WebGL 1)'}`);
  
  console.log('\n✓ Report complete');
}
// Usage: reportLinkShaderPerformance()

// ============================================================================
// QUICK ACCESS ALIASES
// ============================================================================

// Shorthand functions for console use
window.lsStatus = () => game.linkShaderLanguage.getStatus();
window.lsMetrics = () => game.linkShaderLanguage.getMetrics();
window.lsDebug = () => game.linkShaderLanguage.setDebugMode(true);
window.lsLog = () => game.linkShaderLanguage.debugLogSelectedLink();
window.lsFlowSpeed = (s) => adjustLinkFlowSpeed(s);
window.lsQuality = (q) => adjustLinkEdgeQuality(q);
window.lsColors = (a, b) => changeLinkShaderColors(a, b);

// Usage: lsStatus(), lsMetrics(), lsDebug(), etc.

console.log('✓ Link Shader Examples loaded');
console.log('Shortcuts: lsStatus(), lsMetrics(), lsDebug(), lsFlowSpeed(1.5), lsQuality(0.95)');
