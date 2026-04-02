/**
 * LinkCorruptionMorphingSystem — Integration Examples
 * ============================================================================
 * Practical integration patterns for using the morphing system
 */

import { LinkCorruptionMorphingSystem } from '../LEGACY/LinkCorruptionMorphingSystem.js';

// ============================================================================
// EXAMPLE 1: Basic Integration in main.js
// ============================================================================

/**
 * Pattern: Add to main animation loop
 * 
 * This shows where and how to integrate the morphing system into your
 * existing animation pipeline.
 */
export function example1_BasicIntegration() {
  // ✅ Create system
  const linkMorphingSystem = new LinkCorruptionMorphingSystem();
  
  // ✅ Store globally for access
  window.linkMorphingSystem = linkMorphingSystem;
  
  // ✅ In your animation loop:
  function animate() {
    const deltaTime = clock.getDelta();
    
    // Update link corruption from game state
    updateLinkCorruptionStates();
    
    // Update link morphing based on corruption
    linkMorphingSystem.update(deltaTime, linkRegistry);
    
    // Render scene
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  
  function updateLinkCorruptionStates() {
    // Your code to update link.userData.corruption
    // (usually done by LinkCorruptionTransmission_v1)
  }
}

// ============================================================================
// EXAMPLE 2: Initialize Links as They're Created
// ============================================================================

/**
 * Pattern: Hook into link creation
 * 
 * When a new link is created, register it with the morphing system.
 */
export function example2_InitializeLinksOnCreation(linkMorphingSystem) {
  // ✅ Hook into link creation:
  function createLink(nodeA, nodeB) {
    const linkMesh = createLinkGeometry(nodeA, nodeB);
    const linkId = `link_${nodeA.id}_${nodeB.id}`;
    
    // Store link in registry
    linkRegistry.set(linkId, linkMesh);
    
    // ✅ Initialize morphing for this link
    linkMorphingSystem.initializeLinkState(linkId, linkMesh);
    
    return linkMesh;
  }
  
  // ✅ When links are destroyed:
  function destroyLink(linkId) {
    linkRegistry.delete(linkId);
    // (LinkCorruptionMorphingSystem cleans up automatically)
  }
}

// ============================================================================
// EXAMPLE 3: Monitor Link Phases with HUD
// ============================================================================

/**
 * Pattern: Display link corruption status in HUD
 * 
 * Show which links are in which corruption phase for debugging/tuning.
 */
export function example3_CorruptionHUD(linkMorphingSystem) {
  let hudElement = null;
  
  function createCorruptionHUD() {
    hudElement = document.createElement('div');
    hudElement.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #0f0;
      font-family: monospace;
      padding: 10px;
      font-size: 12px;
      max-width: 300px;
      max-height: 400px;
      overflow-y: auto;
      z-index: 1000;
    `;
    document.body.appendChild(hudElement);
  }
  
  function updateCorruptionHUD() {
    if (!hudElement) return;
    
    const stats = linkMorphingSystem.getStats();
    let html = `<strong>Link Morphing Status</strong><br>`;
    html += `Morphed: ${stats.morphedLinkCount}/${stats.trackedLinkCount}<br>`;
    html += `Speed: ${stats.morphingSpeed.toFixed(1)}<br><br>`;
    
    // Show corrupted links
    const linkStates = linkMorphingSystem.linkStates;
    let corruptedLinks = 0;
    
    linkStates.forEach((state, linkId) => {
      if (state.lastCorruption > 0.2) {
        corruptedLinks++;
        const color = getPhaseColor(state.phase.name);
        html += `<span style="color: ${color}">${state.phase.name}</span> `;
        html += `${(state.lastCorruption * 100).toFixed(0)}% ${linkId}<br>`;
      }
    });
    
    if (corruptedLinks === 0) {
      html += `<span style="color: #0f0">All links healthy</span>`;
    }
    
    hudElement.innerHTML = html;
  }
  
  function getPhaseColor(phaseName) {
    const colors = {
      'Healthy': '#0f0',
      'Stressed': '#ff0',
      'Infected': '#f80',
      'Degraded': '#f00',
      'Collapsed': '#800'
    };
    return colors[phaseName] || '#fff';
  }
  
  createCorruptionHUD();
  
  // Update HUD each frame
  setInterval(() => updateCorruptionHUD(), 100);
}

// ============================================================================
// EXAMPLE 4: Trigger Events on Phase Transitions
// ============================================================================

/**
 * Pattern: React to link phase changes
 * 
 * When a link enters a new phase (Healthy → Stressed), trigger audio/vfx.
 */
export class PhaseTransitionReactor {
  constructor(linkMorphingSystem, audioSystem, vfxSystem) {
    this.morphingSystem = linkMorphingSystem;
    this.audioSystem = audioSystem;
    this.vfxSystem = vfxSystem;
    this.linkPhaseHistory = new Map(); // linkId → lastPhase
  }
  
  update() {
    const linkStates = this.morphingSystem.linkStates;
    
    linkStates.forEach((state, linkId) => {
      const currentPhase = state.phase.name;
      const lastPhase = this.linkPhaseHistory.get(linkId);
      
      // Phase changed?
      if (lastPhase !== currentPhase) {
        this.onPhaseTransition(linkId, lastPhase, currentPhase, state);
        this.linkPhaseHistory.set(linkId, currentPhase);
      }
    });
  }
  
  onPhaseTransition(linkId, fromPhase, toPhase, state) {
    console.log(`Link ${linkId}: ${fromPhase} → ${toPhase}`);
    
    // Play phase-appropriate sounds
    this.playPhaseAudio(toPhase);
    
    // Create visual effects
    this.createPhaseVFX(linkId, toPhase, state.link);
  }
  
  playPhaseAudio(phase) {
    const audioMap = {
      'Healthy': 'heal',
      'Stressed': 'warning',
      'Infected': 'alarm',
      'Degraded': 'critical',
      'Collapsed': 'fail'
    };
    
    const sound = audioMap[phase];
    if (sound && this.audioSystem) {
      this.audioSystem.play(sound);
    }
  }
  
  createPhaseVFX(linkId, phase, link) {
    if (!link || !this.vfxSystem) return;
    
    const vfxMap = {
      'Healthy': 'harmony_pulse',
      'Stressed': 'warning_flash',
      'Infected': 'corruption_burst',
      'Degraded': 'breakdown_shake',
      'Collapsed': 'collapse_wave'
    };
    
    const vfxName = vfxMap[phase];
    if (vfxName) {
      this.vfxSystem.playAt(vfxName, link.position);
    }
  }
}

// Usage:
export function example4_PhaseTransitions(morphingSystem, audioSystem, vfxSystem) {
  const reactor = new PhaseTransitionReactor(morphingSystem, audioSystem, vfxSystem);
  
  // In animation loop:
  function animate() {
    const dt = clock.getDelta();
    morphingSystem.update(dt, linkRegistry);
    
    // React to phase changes
    reactor.update();
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
}

// ============================================================================
// EXAMPLE 5: Debug Console API
// ============================================================================

/**
 * Pattern: Expose system to console for debugging
 * 
 * Makes it easy to inspect and manipulate morphing in console.
 */
export function example5_ConsoleAPI(linkMorphingSystem) {
  // Expose globally
  window.linkMorphingSystem = linkMorphingSystem;
  
  // Convenience functions
  window.getMorphingInfo = function(linkId) {
    return linkMorphingSystem.getDebugInfoForLink(linkId);
  };
  
  window.getCorruption = function(linkId) {
    return linkMorphingSystem.getCorruptionForLink(linkId);
  };
  
  window.getPhase = function(linkId) {
    return linkMorphingSystem.getPhaseNameForLink(linkId);
  };
  
  window.getMorphingStats = function() {
    return linkMorphingSystem.getStats();
  };
  
  window.setMorphingSpeed = function(speed) {
    linkMorphingSystem.setMorphingSpeed(speed);
    console.log(`Morphing speed set to ${speed}`);
  };
  
  // Usage in console:
  // getMorphingStats()
  // getPhase('link_0')
  // getMorphingInfo('link_0')
  // setMorphingSpeed(5.0)
}

// ============================================================================
// EXAMPLE 6: Sync Morphing with Recovery System
// ============================================================================

/**
 * Pattern: Links recover visually as corruption fades
 * 
 * When HarmonicHubRecoveryController recovers a network, links morph back
 * to healthy state smoothly.
 */
export function example6_RecoverySync(
  linkMorphingSystem,
  recoveryController,
  linkRegistry
) {
  // When recovery completes:
  function onRecoveryComplete(hubId) {
    console.log(`Hub ${hubId} recovered, resetting link corruptions...`);
    
    // Clear corruption from all links connected to this hub
    linkRegistry.forEach((link, linkId) => {
      // Check if link connects to recovered hub
      if (linkId.includes(hubId)) {
        // Gradually reduce corruption
        link.userData.corruption = Math.max(0, link.userData.corruption - 0.2);
      }
    });
  }
  
  // Listen for recovery events:
  if (recoveryController && recoveryController.onRecoveryComplete) {
    recoveryController.onRecoveryComplete(onRecoveryComplete);
  }
}

// ============================================================================
// EXAMPLE 7: Per-Phase Custom Logic
// ============================================================================

/**
 * Pattern: Execute different logic per morphing phase
 * 
 * Useful for phase-specific gameplay effects, difficulty scaling, etc.
 */
export class PhaseSensitiveGameplay {
  constructor(linkMorphingSystem, gameState) {
    this.morphingSystem = linkMorphingSystem;
    this.gameState = gameState;
  }
  
  update() {
    const linkStates = this.morphingSystem.linkStates;
    
    let healthyCount = 0;
    let stressedCount = 0;
    let infectedCount = 0;
    let degradedCount = 0;
    let collapsedCount = 0;
    
    linkStates.forEach((state) => {
      switch (state.phase.name) {
        case 'Healthy': healthyCount++; break;
        case 'Stressed': stressedCount++; break;
        case 'Infected': infectedCount++; break;
        case 'Degraded': degradedCount++; break;
        case 'Collapsed': collapsedCount++; break;
      }
    });
    
    // Adjust difficulty/stress based on network health
    const totalLinks = linkStates.size;
    const healthPercentage = healthyCount / totalLinks;
    
    if (healthPercentage > 0.8) {
      this.gameState.difficulty = 'easy';
      this.gameState.stressLevel = 0.2;
    } else if (healthPercentage > 0.5) {
      this.gameState.difficulty = 'normal';
      this.gameState.stressLevel = 0.5;
    } else if (healthPercentage > 0.2) {
      this.gameState.difficulty = 'hard';
      this.gameState.stressLevel = 0.8;
    } else {
      this.gameState.difficulty = 'critical';
      this.gameState.stressLevel = 1.0;
    }
  }
}

// Usage:
export function example7_GameplayPhases(morphingSystem, gameState) {
  const phaseGameplay = new PhaseSensitiveGameplay(morphingSystem, gameState);
  
  // In animation loop:
  function animate() {
    const dt = clock.getDelta();
    morphingSystem.update(dt, linkRegistry);
    
    // Update gameplay based on link phases
    phaseGameplay.update();
    
    // Use gameState.difficulty and gameState.stressLevel
    updateGameDifficulty(gameState.difficulty);
    updateStressVisuals(gameState.stressLevel);
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
}

// ============================================================================
// EXAMPLE 8: Performance Tuning
// ============================================================================

/**
 * Pattern: Dynamically adjust morphing performance
 * 
 * Based on frame rate, adjust morphing quality.
 */
export class AdaptiveMorphingPerformance {
  constructor(linkMorphingSystem) {
    this.morphingSystem = linkMorphingSystem;
    this.frameRateHistory = [];
    this.targetFPS = 60;
  }
  
  update(actualFPS) {
    this.frameRateHistory.push(actualFPS);
    if (this.frameRateHistory.length > 30) {
      this.frameRateHistory.shift();
    }
    
    const avgFPS = this.frameRateHistory.reduce((a, b) => a + b) / this.frameRateHistory.length;
    
    // If framerate drops, reduce morphing speed
    if (avgFPS < 50) {
      this.morphingSystem.setMorphingSpeed(1.0); // Slower
      console.warn(`Low FPS (${avgFPS.toFixed(1)}), reducing morphing speed`);
    } else if (avgFPS > 55) {
      this.morphingSystem.setMorphingSpeed(2.0); // Normal
    }
  }
  
  getMetrics() {
    return {
      avgFPS: this.frameRateHistory.reduce((a, b) => a + b) / this.frameRateHistory.length,
      morphingSpeed: this.morphingSystem.morphingSpeed
    };
  }
}

// Usage:
export function example8_PerformanceTuning(morphingSystem) {
  const perfTuner = new AdaptiveMorphingPerformance(morphingSystem);
  let lastTime = performance.now();
  
  // In animation loop:
  function animate() {
    const now = performance.now();
    const deltaTime = (now - lastTime) / 1000;
    lastTime = now;
    
    const fps = 1 / deltaTime;
    perfTuner.update(fps);
    
    morphingSystem.update(deltaTime, linkRegistry);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
}

// ============================================================================
// EXAMPLE 9: Export Morphing State for Serialization
// ============================================================================

/**
 * Pattern: Save/load morphing state
 * 
 * Useful for persistence or debugging.
 */
export function example9_Serialization(linkMorphingSystem) {
  function exportMorphingState() {
    const state = {};
    
    linkMorphingSystem.linkStates.forEach((linkState, linkId) => {
      state[linkId] = {
        corruption: linkState.lastCorruption,
        phase: linkState.phase.name,
        profile: linkState.currentProfile
      };
    });
    
    return state;
  }
  
  function importMorphingState(state) {
    linkMorphingSystem.linkStates.forEach((linkState, linkId) => {
      if (state[linkId]) {
        linkState.corruption = state[linkId].corruption;
        linkState.targetProfile = { ...state[linkId].profile };
      }
    });
  }
  
  // Usage:
  // const saved = exportMorphingState();
  // localStorage.setItem('linkMorphing', JSON.stringify(saved));
  // 
  // const loaded = JSON.parse(localStorage.getItem('linkMorphing'));
  // importMorphingState(loaded);
}

// ============================================================================
// EXAMPLE 10: Real-time Morphing Visualization
// ============================================================================

/**
 * Pattern: Visual overlay showing morphing parameters
 * 
 * Debug visualization of what's happening to each link.
 */
export class MorphingVisualizerOverlay {
  constructor(linkMorphingSystem, scene) {
    this.morphingSystem = linkMorphingSystem;
    this.scene = scene;
    this.visualizers = new Map(); // linkId → THREE mesh
  }
  
  update() {
    this.morphingSystem.linkStates.forEach((state, linkId) => {
      this.updateVisualizer(linkId, state);
    });
  }
  
  updateVisualizer(linkId, state) {
    // Create bar mesh showing corruption level
    if (!this.visualizers.has(linkId)) {
      this.createVisualizer(linkId, state.link);
    }
    
    const viz = this.visualizers.get(linkId);
    if (!viz) return;
    
    // Scale bar based on corruption
    const corruption = state.lastCorruption;
    viz.scale.x = corruption;
    
    // Color by phase
    const color = this.phaseToColor(state.phase.name);
    viz.material.color.set(color);
    
    // Position above link
    if (state.link && state.link.position) {
      viz.position.copy(state.link.position);
      viz.position.y += 1.0; // Offset above
    }
  }
  
  createVisualizer(linkId, link) {
    if (!link) return;
    
    const geometry = new THREE.BoxGeometry(1, 0.2, 0.2);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.copy(link.position);
    mesh.position.y += 1.0;
    
    this.scene.add(mesh);
    this.visualizers.set(linkId, mesh);
  }
  
  phaseToColor(phaseName) {
    const colors = {
      'Healthy': 0x00ff00,
      'Stressed': 0xffff00,
      'Infected': 0xff8800,
      'Degraded': 0xff0000,
      'Collapsed': 0x880000
    };
    return colors[phaseName] || 0xffffff;
  }
  
  dispose() {
    this.visualizers.forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
      this.scene.remove(mesh);
    });
    this.visualizers.clear();
  }
}

export default {
  example1_BasicIntegration,
  example2_InitializeLinksOnCreation,
  example3_CorruptionHUD,
  example4_PhaseTransitions,
  example5_ConsoleAPI,
  example6_RecoverySync,
  example7_GameplayPhases,
  example8_PerformanceTuning,
  example9_Serialization,
  example10_RealTimeVisualization: class { constructor(morphingSystem, scene) { return new MorphingVisualizerOverlay(morphingSystem, scene); } }
};
