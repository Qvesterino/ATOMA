/**
 * HubInfluencePropagation — Integration Examples
 * ============================================================================
 * Practical integration patterns for influence field visualization
 */

import { HubInfluencePropagation } from './HubInfluencePropagation.js';

// ============================================================================
// EXAMPLE 1: Basic Integration in main.js
// ============================================================================

/**
 * Pattern: Add to animation loop
 */
export function example1_BasicIntegration() {
  const influencePropagation = new HubInfluencePropagation();
  
  window.influencePropagation = influencePropagation;
  
  // In animation loop:
  function animate() {
    const deltaTime = clock.getDelta();
    
    // Propagate influence from all hubs
    influencePropagation.update(deltaTime, hubSystemData, nodeRegistry, linkRegistry);
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  
  return influencePropagation;
}

// ============================================================================
// EXAMPLE 2: Apply Influence to Link Visuals
// ============================================================================

/**
 * Pattern: Read influence data and apply to link visual systems
 */
export function example2_LinkInfluenceVisuals(linkRegistry, streakSystem) {
  function applyLinkInfluence() {
    linkRegistry.forEach((link, linkId) => {
      if (!link || !link.userData) return;
      
      const influences = link.userData.influenceFields || [];
      if (influences.length === 0) return;
      
      // Get strongest influence
      let strongestInfluence = null;
      let maxStrength = 0;
      
      influences.forEach((inf) => {
        if (inf.strength > maxStrength) {
          maxStrength = inf.strength;
          strongestInfluence = inf;
        }
      });
      
      if (!strongestInfluence) return;
      
      // Apply influence to streak system
      if (streakSystem) {
        // Phase bias: pull link phase toward hub phase
        link.userData.phaseInfluenceBias = strongestInfluence.phaseBias;
        link.userData.influencePhase = strongestInfluence.phase;
        
        // Streak coherence: make streaks more aligned
        link.userData.streakCoherence = Math.min(1, 
          (link.userData.streakCoherence || 0.5) + strongestInfluence.streakCoherence
        );
        
        // Pulse alignment: sync pulse timing
        link.userData.pulseAlignment = strongestInfluence.pulseAlignment;
      }
    });
  }
  
  // Call each frame after propagation update
  return applyLinkInfluence;
}

// ============================================================================
// EXAMPLE 3: Apply Influence to Node Secondary Halos
// ============================================================================

/**
 * Pattern: Render secondary halos based on influence
 */
export class NodeInfluenceSecondaryHalo {
  constructor(nodeRegistry, haloSystem) {
    this.nodeRegistry = nodeRegistry;
    this.haloSystem = haloSystem;
  }
  
  update() {
    this.nodeRegistry.forEach((node, nodeId) => {
      if (!node || !node.userData) return;
      
      const influences = node.userData.influenceFields || [];
      
      // Aggregate influence from all hubs
      let totalIntensity = 0;
      let avgPhase = 0;
      let phaseCount = 0;
      
      influences.forEach((inf) => {
        totalIntensity += inf.haloIntensity;
        avgPhase += inf.phase;
        phaseCount++;
      });
      
      if (phaseCount > 0) {
        avgPhase /= phaseCount;
      }
      
      // Store for halo system to render
      node.userData.secondaryHaloIntensity = totalIntensity;
      node.userData.secondaryHaloPhase = avgPhase;
      node.userData.hasSecondaryHaloInfluence = totalIntensity > 0.01;
    });
  }
}

// ============================================================================
// EXAMPLE 4: Visualize Influence Strength with Debug HUD
// ============================================================================

/**
 * Pattern: Display influence field info in HUD
 */
export function example4_InfluenceHUD(influencePropagation) {
  let hudElement = null;
  
  function createHUD() {
    hudElement = document.createElement('div');
    hudElement.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #0f0;
      font-family: monospace;
      padding: 10px;
      font-size: 11px;
      max-width: 300px;
      max-height: 400px;
      overflow-y: auto;
      z-index: 999;
    `;
    document.body.appendChild(hudElement);
  }
  
  function updateHUD() {
    if (!hudElement) return;
    
    const stats = influencePropagation.getStats();
    let html = `<strong>Influence Propagation</strong><br>`;
    html += `Active Hubs: ${stats.influencedHubCount}/${stats.totalHubs}<br>`;
    html += `Zone 1 Nodes: ${stats.zone1NodeCount}<br>`;
    html += `Zone 2 Nodes: ${stats.zone2NodeCount}<br>`;
    html += `Total Influenced: ${stats.totalInfluencedNodes}<br><br>`;
    
    // Show details for top 5 hubs by strength
    const hubStats = [];
    influencePropagation.hubInfluences.forEach((influence, hubId) => {
      hubStats.push({ hubId, strength: influence.strength });
    });
    
    hubStats.sort((a, b) => b.strength - a.strength);
    
    hubStats.slice(0, 5).forEach((hub) => {
      const stats = influencePropagation.getHubInfluenceStats(hub.hubId);
      html += `<strong>${hub.hubId}</strong><br>`;
      html += `Strength: ${stats.strength}<br>`;
      html += `Zone 1: ${stats.zone1Nodes} nodes<br>`;
      html += `Zone 2: ${stats.zone2Nodes} nodes<br><br>`;
    });
    
    hudElement.innerHTML = html;
  }
  
  createHUD();
  setInterval(() => updateHUD(), 200);
}

// ============================================================================
// EXAMPLE 5: Field Strength Heat Map
// ============================================================================

/**
 * Pattern: Visualize influence field strength across network
 */
export class FieldStrengthHeatMap {
  constructor(influencePropagation, nodeRegistry) {
    this.influencePropagation = influencePropagation;
    this.nodeRegistry = nodeRegistry;
  }
  
  update() {
    // Compute field strength at each node
    this.nodeRegistry.forEach((node, nodeId) => {
      if (!node || !node.userData) return;
      
      const influences = node.userData.influenceFields || [];
      
      // Sum influence strength
      let fieldStrength = 0;
      influences.forEach((inf) => {
        fieldStrength += inf.strength;
      });
      
      // Normalize to [0, 1]
      node.userData.fieldStrength = Math.min(1, fieldStrength);
      
      // Map to color (heat map)
      const color = this.strengthToColor(node.userData.fieldStrength);
      node.userData.fieldColor = color;
    });
  }
  
  strengthToColor(strength) {
    // Heat map: blue → cyan → green → yellow → red
    if (strength < 0.25) {
      // Blue → Cyan
      const t = strength / 0.25;
      return {
        r: 0.0 + t * 0.5,  // 0 → 0.5
        g: 0.5 + t * 0.5,  // 0.5 → 1.0
        b: 1.0              // 1.0
      };
    } else if (strength < 0.5) {
      // Cyan → Green
      const t = (strength - 0.25) / 0.25;
      return {
        r: 0.5 - t * 0.5,   // 0.5 → 0.0
        g: 1.0,             // 1.0
        b: 1.0 - t * 1.0    // 1.0 → 0.0
      };
    } else if (strength < 0.75) {
      // Green → Yellow
      const t = (strength - 0.5) / 0.25;
      return {
        r: 0.0 + t * 1.0,   // 0.0 → 1.0
        g: 1.0,             // 1.0
        b: 0.0              // 0.0
      };
    } else {
      // Yellow → Red
      const t = (strength - 0.75) / 0.25;
      return {
        r: 1.0,             // 1.0
        g: 1.0 - t * 1.0,   // 1.0 → 0.0
        b: 0.0              // 0.0
      };
    }
  }
}

// ============================================================================
// EXAMPLE 6: Propagation Wave Visualization
// ============================================================================

/**
 * Pattern: Show influence propagating outward from hub
 */
export class InfluencePropagationWave {
  constructor(influencePropagation) {
    this.influencePropagation = influencePropagation;
    this.waveStates = new Map(); // hubId → waveInfo
  }
  
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;
    // Simulate wave propagation from each hub
    this.influencePropagation.hubInfluences.forEach((influence, hubId) => {
      let waveState = this.waveStates.get(hubId);
      
      if (!waveState) {
        waveState = {
          hubId,
          zone1WaveExpansion: 0,
          zone2WaveExpansion: 0,
          zone1WaveStrength: 1.0,
          zone2WaveStrength: 0.5
        };
        this.waveStates.set(hubId, waveState);
      }
      
      // Expand waves based on influence strength
      const waveSpeed = 2.0; // Units per second
      waveState.zone1WaveExpansion += waveSpeed * deltaTime;
      waveState.zone2WaveExpansion += waveSpeed * deltaTime * 0.5; // Half speed
      
      // Fade waves with distance
      waveState.zone1WaveStrength = Math.max(0, 1.0 - waveState.zone1WaveExpansion * 0.5);
      waveState.zone2WaveStrength = Math.max(0, 0.5 - waveState.zone2WaveExpansion * 0.5);
      
      // Reset if fully propagated
      if (waveState.zone1WaveStrength <= 0 && waveState.zone2WaveStrength <= 0) {
        waveState.zone1WaveExpansion = 0;
        waveState.zone2WaveExpansion = 0;
        waveState.zone1WaveStrength = 1.0;
        waveState.zone2WaveStrength = 0.5;
      }
      
      // Store for visualization
      influence.waveState = waveState;
    });
  }
}

// ============================================================================
// EXAMPLE 7: Influence-Driven Link Color
// ============================================================================

/**
 * Pattern: Color links based on influence strength
 */
export class InfluenceDrivenLinkColor {
  constructor(linkRegistry) {
    this.linkRegistry = linkRegistry;
  }
  
  update() {
    this.linkRegistry.forEach((link, linkId) => {
      if (!link || !link.userData) return;
      
      const influences = link.userData.influenceFields || [];
      
      if (influences.length === 0) {
        link.userData.influencedLinkColor = null;
        return;
      }
      
      // Get strongest influence
      let strongest = influences[0];
      influences.forEach((inf) => {
        if (inf.strength > strongest.strength) {
          strongest = inf;
        }
      });
      
      // Color based on zone and strength
      const strengthFactor = strongest.strength;
      
      if (strongest.isZone1) {
        // Zone 1: Bright influence color
        link.userData.influencedLinkColor = {
          r: 0.5 + strengthFactor * 0.5,  // 0.5 → 1.0
          g: 0.3 + strengthFactor * 0.3,  // 0.3 → 0.6
          b: 0.8 - strengthFactor * 0.3   // 0.8 → 0.5 (blue→purple)
        };
      } else {
        // Zone 2: Subtle influence color
        link.userData.influencedLinkColor = {
          r: 0.3 + strengthFactor * 0.2,
          g: 0.5 + strengthFactor * 0.2,
          b: 0.7 - strengthFactor * 0.2
        };
      }
    });
  }
}

// ============================================================================
// EXAMPLE 8: Influence Network Topology Debug
// ============================================================================

/**
 * Pattern: Display neighbor relationships in console
 */
export function example8_TopologyDebug(influencePropagation, hubId) {
  const hubInfluence = influencePropagation.hubInfluences.get(hubId);
  if (!hubInfluence) {
    console.warn(`Hub not found: ${hubId}`);
    return;
  }
  
  console.log(`\n=== Hub Influence Topology: ${hubId} ===`);
  console.log(`Strength: ${hubInfluence.strength.toFixed(3)}`);
  console.log(`Zone 1 Strength: ${hubInfluence.zone1Strength.toFixed(3)}`);
  console.log(`Zone 2 Strength: ${hubInfluence.zone2Strength.toFixed(3)}`);
  
  console.log(`\nZone 1 Nodes (${hubInfluence.zone1Nodes.length}):`);
  hubInfluence.zone1Nodes.forEach((nodeId) => {
    console.log(`  - ${nodeId}`);
  });
  
  console.log(`\nZone 2 Nodes (${hubInfluence.zone2Nodes.length}):`);
  hubInfluence.zone2Nodes.forEach((nodeId) => {
    console.log(`  - ${nodeId}`);
  });
}

// ============================================================================
// EXAMPLE 9: Influence Strength Over Time
// ============================================================================

/**
 * Pattern: Track how influence strength changes
 */
export class InfluenceStrengthTracker {
  constructor(influencePropagation, hubId) {
    this.influencePropagation = influencePropagation;
    this.hubId = hubId;
    this.history = [];
    this.maxHistory = 300; // 5 seconds at 60 FPS
  }
  
  update() {
    const hubInfluence = this.influencePropagation.hubInfluences.get(this.hubId);
    if (!hubInfluence) return;
    
    this.history.push({
      time: Date.now(),
      strength: hubInfluence.strength,
      zone1Strength: hubInfluence.zone1Strength,
      zone2Strength: hubInfluence.zone2Strength
    });
    
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }
  
  getAverageStrength() {
    if (this.history.length === 0) return 0;
    const sum = this.history.reduce((a, b) => a + b.strength, 0);
    return sum / this.history.length;
  }
  
  getPeakStrength() {
    if (this.history.length === 0) return 0;
    return Math.max(...this.history.map(h => h.strength));
  }
  
  getStats() {
    return {
      current: this.history[this.history.length - 1]?.strength || 0,
      average: this.getAverageStrength(),
      peak: this.getPeakStrength(),
      sampleCount: this.history.length
    };
  }
}

// ============================================================================
// EXAMPLE 10: Influence Field Collision Detection
// ============================================================================

/**
 * Pattern: Detect when influence field reaches a node
 */
export class InfluenceCollisionDetector {
  constructor(influencePropagation, nodeRegistry) {
    this.influencePropagation = influencePropagation;
    this.nodeRegistry = nodeRegistry;
    this.influencedNodeHistory = new Map(); // nodeId → wasInfluenced
    this.callbacks = {
      onInfluenceEnter: null,
      onInfluenceExit: null
    };
  }
  
  update() {
    this.nodeRegistry.forEach((node, nodeId) => {
      const influences = node.userData.influenceFields || [];
      const isInfluenced = influences.length > 0;
      const wasInfluenced = this.influencedNodeHistory.get(nodeId) || false;
      
      // Detect entry
      if (!wasInfluenced && isInfluenced) {
        if (this.callbacks.onInfluenceEnter) {
          this.callbacks.onInfluenceEnter(nodeId, influences[0]);
        }
      }
      
      // Detect exit
      if (wasInfluenced && !isInfluenced) {
        if (this.callbacks.onInfluenceExit) {
          this.callbacks.onInfluenceExit(nodeId);
        }
      }
      
      this.influencedNodeHistory.set(nodeId, isInfluenced);
    });
  }
  
  onInfluenceEnter(callback) {
    this.callbacks.onInfluenceEnter = callback;
  }
  
  onInfluenceExit(callback) {
    this.callbacks.onInfluenceExit = callback;
  }
}

export default {
  example1_BasicIntegration,
  example2_LinkInfluenceVisuals,
  example3_NodeSecondaryHalo: class { 
    constructor(nodeReg, haloSys) { 
      return new NodeInfluenceSecondaryHalo(nodeReg, haloSys); 
    } 
  },
  example4_InfluenceHUD,
  example5_HeatMap: class { constructor(inf, nodeReg) { return new FieldStrengthHeatMap(inf, nodeReg); } },
  example6_PropagationWave: class { constructor(inf) { return new InfluencePropagationWave(inf); } },
  example7_LinkColor: class { constructor(linkReg) { return new InfluenceDrivenLinkColor(linkReg); } },
  example8_TopologyDebug,
  example9_StrengthTracker: class { constructor(inf, hubId) { return new InfluenceStrengthTracker(inf, hubId); } },
  example10_CollisionDetector: class { constructor(inf, nodeReg) { return new InfluenceCollisionDetector(inf, nodeReg); } }
};
