/**
 * HarmonicNodeResonanceHalos — Integration Examples
 * ============================================================================
 * Practical integration patterns for using resonance halos
 */

import { HarmonicNodeResonanceHalos } from './HarmonicNodeResonanceHalos.js';

// ============================================================================
// EXAMPLE 1: Basic Integration in main.js
// ============================================================================

/**
 * Pattern: Add to main animation loop
 */
export function example1_BasicIntegration() {
  const haloSystem = new HarmonicNodeResonanceHalos();
  
  // Store globally for access
  window.resonanceHalos = haloSystem;
  
  // In animation loop:
  function animate() {
    const deltaTime = clock.getDelta();
    
    // Update resonance halos
    haloSystem.update(deltaTime, nodeRegistry, hubSystemData);
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  
  return haloSystem;
}

// ============================================================================
// EXAMPLE 2: Debug HUD for Halo Status
// ============================================================================

/**
 * Pattern: Display halo status in HUD
 */
export function example2_HaloStatusHUD(haloSystem) {
  let hudElement = null;
  
  function createHUD() {
    hudElement = document.createElement('div');
    hudElement.style.cssText = `
      position: absolute;
      bottom: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #0f0;
      font-family: monospace;
      padding: 10px;
      font-size: 11px;
      max-width: 350px;
      max-height: 300px;
      overflow-y: auto;
      z-index: 999;
    `;
    document.body.appendChild(hudElement);
  }
  
  function updateHUD() {
    if (!hudElement) return;
    
    const stats = haloSystem.getStats();
    let html = `<strong>Resonance Halos</strong><br>`;
    html += `Active: ${stats.activeHaloCount}/${stats.trackedNodeCount}<br>`;
    html += `Geometry: ${stats.cachedGeometry}<br>`;
    html += `Material: ${stats.cachedMaterial}<br><br>`;
    
    // Show details for first 5 active halos
    let count = 0;
    haloSystem.nodeHalos.forEach((haloData, nodeId) => {
      if (count >= 5) return;
      if (!haloData.isActive) return;
      
      const debug = haloSystem.getDebugInfoForNode(nodeId);
      const color = getHaloPhaseColor(debug.color);
      
      html += `<span style="color: ${color}">●</span> `;
      html += `${nodeId.substring(0, 6)}: `;
      html += `${(debug.intensity * 100).toFixed(0)}% `;
      html += `resilience: ${debug.resilience}<br>`;
      
      count++;
    });
    
    hudElement.innerHTML = html;
  }
  
  function getHaloPhaseColor(color) {
    const r = parseInt(color.r);
    const g = parseInt(color.g);
    const b = parseInt(color.b);
    
    // Determine primary color
    if (b > r && b > g) return '#00ff00'; // Blue = healthy
    if (r === g) return '#ffff00';       // Cyan = synergy
    if (r > g) return '#ff8800';         // Orange = stressed
    if (r > 128) return '#ff0000';       // Red = corrupted
    return '#ffffff';
  }
  
  createHUD();
  
  // Update every 200ms
  setInterval(() => updateHUD(), 200);
}

// ============================================================================
// EXAMPLE 3: React to Halo Activation/Deactivation
// ============================================================================

/**
 * Pattern: Handle hub activation events
 */
export class HaloActivationListener {
  constructor(haloSystem) {
    this.haloSystem = haloSystem;
    this.hubHistory = new Map(); // nodeId → wasActive
  }
  
  update() {
    this.haloSystem.nodeHalos.forEach((haloData, nodeId) => {
      const wasActive = this.hubHistory.get(nodeId);
      const isActive = haloData.isActive;
      
      // Hub became active?
      if (!wasActive && isActive) {
        this.onHaloActivated(nodeId, haloData);
      }
      
      // Hub became inactive?
      if (wasActive && !isActive) {
        this.onHaloDeactivated(nodeId, haloData);
      }
      
      this.hubHistory.set(nodeId, isActive);
    });
  }
  
  onHaloActivated(nodeId, haloData) {
    console.log(`Hub activated: ${nodeId}`);
    
    // Trigger audio/VFX
    if (window.audioSystem) {
      window.audioSystem.play('hub_activate');
    }
    
    // Create activation effect
    if (window.vfxSystem) {
      window.vfxSystem.playAt('hub_pulse', haloData.node.position);
    }
  }
  
  onHaloDeactivated(nodeId, haloData) {
    console.log(`Hub deactivated: ${nodeId}`);
    
    // Trigger audio
    if (window.audioSystem) {
      window.audioSystem.play('hub_deactivate');
    }
  }
}

// Usage:
export function example3_ActivationListener(haloSystem) {
  const listener = new HaloActivationListener(haloSystem);
  
  // In animation loop:
  function animate() {
    const dt = clock.getDelta();
    haloSystem.update(dt, nodeRegistry, hubSystemData);
    listener.update(); // Check for activations
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
}

// ============================================================================
// EXAMPLE 4: Sync with Recovery System
// ============================================================================

/**
 * Pattern: Trigger halo recovery waves when hubs recover
 */
export function example4_RecoverySync(
  haloSystem,
  recoveryController
) {
  // Listen for recovery completion
  function onRecoveryComplete(hubId) {
    console.log(`Hub ${hubId} recovered, triggering halo wave...`);
    haloSystem.triggerRecoveryWave(hubId);
  }
  
  // Wire callback (if recovery system supports it)
  if (recoveryController && recoveryController.on) {
    recoveryController.on('recovery_complete', onRecoveryComplete);
  }
}

// ============================================================================
// EXAMPLE 5: Network Health Visualization
// ============================================================================

/**
 * Pattern: Compute overall network health from halo state
 */
export class NetworkHealthVisualizer {
  constructor(haloSystem) {
    this.haloSystem = haloSystem;
  }
  
  updateNetworkStatus() {
    const stats = this.haloSystem.getStats();
    if (stats.trackedNodeCount === 0) return null;
    
    let totalIntensity = 0;
    let totalResilience = 0;
    let activeCount = 0;
    
    this.haloSystem.nodeHalos.forEach((haloData) => {
      if (haloData.isActive) {
        totalIntensity += haloData.currentIntensity;
        totalResilience += haloData.recoveryProgress;
        activeCount++;
      }
    });
    
    const avgIntensity = activeCount > 0 ? totalIntensity / activeCount : 0;
    const avgResilience = activeCount > 0 ? totalResilience / activeCount : 0;
    
    return {
      activeHubs: activeCount,
      totalHubs: stats.trackedNodeCount,
      avgHaloIntensity: avgIntensity,
      avgResilience: avgResilience,
      networkHealth: (avgIntensity + avgResilience) * 50, // Percentage
      status: this.getNetworkStatus(avgIntensity, activeCount)
    };
  }
  
  getNetworkStatus(avgIntensity, activeCount) {
    if (avgIntensity > 0.7) return 'Healthy';
    if (avgIntensity > 0.5) return 'Stable';
    if (avgIntensity > 0.3) return 'Stressed';
    if (avgIntensity > 0.1) return 'Degraded';
    return 'Critical';
  }
}

// Usage:
export function example5_NetworkHealth(haloSystem) {
  const visualizer = new NetworkHealthVisualizer(haloSystem);
  
  // In frame loop:
  function animate() {
    const dt = clock.getDelta();
    haloSystem.update(dt, nodeRegistry, hubSystemData);
    
    const health = visualizer.updateNetworkStatus();
    console.log(`Network Status: ${health.status} (${health.networkHealth.toFixed(0)}%)`);
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
}

// ============================================================================
// EXAMPLE 6: Per-Halo Console Inspection
// ============================================================================

/**
 * Pattern: Expose halo inspection to console
 */
export function example6_ConsoleAPI(haloSystem) {
  window.resonanceHalos = haloSystem;
  
  // Convenience functions
  window.inspectHalo = function(nodeId) {
    const debug = haloSystem.getDebugInfoForNode(nodeId);
    if (debug) {
      console.table(debug);
      return debug;
    }
    console.warn(`Halo not found: ${nodeId}`);
  };
  
  window.haloStats = function() {
    return haloSystem.getStats();
  };
  
  window.activeHalos = function() {
    const active = [];
    haloSystem.nodeHalos.forEach((haloData, nodeId) => {
      if (haloData.isActive) {
        active.push({
          nodeId,
          intensity: haloData.currentIntensity,
          resilience: haloData.recoveryProgress
        });
      }
    });
    console.table(active);
    return active;
  };
  
  window.triggerRecovery = function(nodeId) {
    haloSystem.triggerRecoveryWave(nodeId);
    console.log(`Triggered recovery for ${nodeId}`);
  };
  
  console.log('Halo inspection API available:');
  console.log('  inspectHalo(nodeId)');
  console.log('  haloStats()');
  console.log('  activeHalos()');
  console.log('  triggerRecovery(nodeId)');
}

// ============================================================================
// EXAMPLE 7: Difficulty Scaling Based on Network Health
// ============================================================================

/**
 * Pattern: Adjust game difficulty based on halo health
 */
export class HaloHealthGameplay {
  constructor(haloSystem, gameState) {
    this.haloSystem = haloSystem;
    this.gameState = gameState;
  }
  
  update() {
    const stats = this.haloSystem.getStats();
    if (stats.trackedNodeCount === 0) return;
    
    let totalIntensity = 0;
    let activeCount = 0;
    
    this.haloSystem.nodeHalos.forEach((haloData) => {
      if (haloData.isActive) {
        totalIntensity += haloData.currentIntensity;
        activeCount++;
      }
    });
    
    const avgIntensity = activeCount > 0 ? totalIntensity / activeCount : 0;
    const hubHealth = avgIntensity * 100;
    
    // Adjust difficulty
    if (hubHealth > 70) {
      this.gameState.difficulty = 'easy';
      this.gameState.threatLevel = 0.2;
    } else if (hubHealth > 50) {
      this.gameState.difficulty = 'normal';
      this.gameState.threatLevel = 0.5;
    } else if (hubHealth > 30) {
      this.gameState.difficulty = 'hard';
      this.gameState.threatLevel = 0.8;
    } else {
      this.gameState.difficulty = 'critical';
      this.gameState.threatLevel = 1.0;
    }
  }
}

// Usage:
export function example7_Difficulty(haloSystem, gameState) {
  const difficulty = new HaloHealthGameplay(haloSystem, gameState);
  
  // In frame loop:
  function animate() {
    const dt = clock.getDelta();
    haloSystem.update(dt, nodeRegistry, hubSystemData);
    difficulty.update();
    
    // Apply threat level to game
    updateGameThreat(gameState.threatLevel);
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
}

// ============================================================================
// EXAMPLE 8: Halo Effect Intensity Mapping
// ============================================================================

/**
 * Pattern: Map halo intensity to other visual effects
 */
export class HaloIntensityMapper {
  constructor(haloSystem) {
    this.haloSystem = haloSystem;
  }
  
  /**
   * Get overall network "glow" based on halo intensity
   */
  getNetworkGlow() {
    let totalIntensity = 0;
    let count = 0;
    
    this.haloSystem.nodeHalos.forEach((haloData) => {
      if (haloData.isActive) {
        totalIntensity += haloData.currentIntensity;
        count++;
      }
    });
    
    return count > 0 ? totalIntensity / count : 0;
  }
  
  /**
   * Get list of active hubs sorted by intensity
   */
  getHubsByIntensity() {
    const hubs = [];
    
    this.haloSystem.nodeHalos.forEach((haloData, nodeId) => {
      if (haloData.isActive) {
        hubs.push({
          nodeId,
          intensity: haloData.currentIntensity,
          resilience: haloData.recoveryProgress
        });
      }
    });
    
    return hubs.sort((a, b) => b.intensity - a.intensity);
  }
  
  /**
   * Get number of stressed hubs
   */
  getStressedHubCount() {
    let count = 0;
    
    this.haloSystem.nodeHalos.forEach((haloData) => {
      if (haloData.isActive && haloData.distortionAmount > 0.1) {
        count++;
      }
    });
    
    return count;
  }
}

// Usage:
export function example8_IntensityMapping(haloSystem, ambientSystem) {
  const mapper = new HaloIntensityMapper(haloSystem);
  
  // In frame loop:
  function animate() {
    const dt = clock.getDelta();
    haloSystem.update(dt, nodeRegistry, hubSystemData);
    
    // Map halo intensity to ambient effects
    const glow = mapper.getNetworkGlow();
    ambientSystem.setAmbientGlow(glow);
    
    const stressedCount = mapper.getStressedHubCount();
    updateStressVisuals(stressedCount);
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
}

// ============================================================================
// EXAMPLE 9: Halo Performance Monitoring
// ============================================================================

/**
 * Pattern: Monitor halo system performance
 */
export class HaloPerformanceMonitor {
  constructor(haloSystem) {
    this.haloSystem = haloSystem;
    this.frameTimes = [];
    this.updateTimes = [];
  }
  
  recordFrameTime(deltaTime) {
    this.frameTimes.push(deltaTime);
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }
  }
  
  getAverageFrameTime() {
    if (this.frameTimes.length === 0) return 0;
    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    return sum / this.frameTimes.length;
  }
  
  getMetrics() {
    const stats = this.haloSystem.getStats();
    const avgFrameTime = this.getAverageFrameTime() * 1000; // ms
    const estimatedCost = stats.activeHaloCount * 0.2; // ~0.2ms per halo
    
    return {
      activeHalos: stats.activeHaloCount,
      avgFrameTime: avgFrameTime.toFixed(2),
      estimatedHaloCost: estimatedCost.toFixed(2),
      remaining: (16.6 - estimatedCost).toFixed(2), // At 60 FPS
      healthy: estimatedCost < 10 // Should be < 10ms at 60 FPS
    };
  }
}

// Usage:
export function example9_Performance(haloSystem) {
  const monitor = new HaloPerformanceMonitor(haloSystem);
  
  // In frame loop:
  function animate() {
    const dt = clock.getDelta();
    monitor.recordFrameTime(dt);
    
    haloSystem.update(dt, nodeRegistry, hubSystemData);
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  
  // Periodic performance check
  setInterval(() => {
    const metrics = monitor.getMetrics();
    console.log(`Halo Performance: ${metrics.estimatedHaloCost}ms / ${metrics.avgFrameTime}ms frame`);
  }, 5000);
}

// ============================================================================
// EXAMPLE 10: Halo-Driven Particle System
// ============================================================================

/**
 * Pattern: Emit particles from halos based on hub state
 */
export class HaloParticleEmitter {
  constructor(haloSystem, particleSystem) {
    this.haloSystem = haloSystem;
    this.particleSystem = particleSystem;
  }
  
  update() {
    this.haloSystem.nodeHalos.forEach((haloData, nodeId) => {
      if (!haloData.isActive) return;
      
      // Emit particles based on halo intensity and state
      const emissionRate = haloData.currentIntensity * 100; // 0-100 particles/sec
      
      // Color particles match halo color
      const particleColor = haloData.currentColor;
      
      // Emit from halo position
      const position = haloData.haloMesh.position;
      
      this.particleSystem.emit(nodeId, {
        position,
        count: Math.ceil(emissionRate * (1/60)), // Per frame
        color: particleColor,
        velocity: haloData.scale * 2 // Scatter velocity
      });
    });
  }
}

export default {
  example1_BasicIntegration,
  example2_HaloStatusHUD,
  example3_ActivationListener,
  example4_RecoverySync,
  example5_NetworkHealth,
  example6_ConsoleAPI,
  example7_Difficulty,
  example8_IntensityMapping,
  example9_Performance,
  example10_ParticleEmitter: class { constructor(halo, particles) { return new HaloParticleEmitter(halo, particles); } }
};
