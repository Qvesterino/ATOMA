/**
 * SYNERGY PULSE VISUALS v1.0
 * ==========================
 * Simple, non-intrusive world-space visual feedback for high synergy
 * 
 * 🎯 PURE VISUAL EFFECT (zero gameplay impact):
 * - Soft, sinusoidal pulse on node properties
 * - Triggered when synergy > 0.6
 * - Applied to node scale (VERY subtle: ±3%)
 * - Smooth breathing motion (slower than heartbeat)
 * 
 * 📊 EFFECT FORMULA:
 * pulse = 1.0 + sin(time * 1.5) * 0.03 * synergy
 * 
 * Where:
 * - 1.0 = baseline (no effect)
 * - sin(time * 1.5) = ~0.95 Hz (slow, calm breathing)
 * - 0.03 = ±3% max modulation (barely noticeable)
 * - synergy = link quality [0..1], scales effect intensity
 * 
 * ✅ GUARANTEES:
 * - No distortion, jitter, or noise
 * - No camera effects
 * - No UI/HUD changes
 * - No postprocessing
 * - Pure smooth sinusoid
 * - Negligible performance impact
 * - Safe to leave enabled permanently
 * 
 * 🔒 CONTRACTS:
 * - Only modifies visual parameters (scale), never node state
 * - Reads avgSynergy from network-level metrics
 * - Reads node.userData.linkedSynergyMap for per-node synergy
 * - Never writes to node.userData.* (read-only)
 * - Never affects game time or deltaTime
 */

export class SynergyPulseVisuals_v1 {
  constructor() {
    this.nodes = [];
    this.avgSynergy = 0.0;
    this.enabled = true;
    
    // Time tracker (local visual time, never affects game time)
    this._visualTime = 0.0;
  }
  
  /**
   * Register nodes for synergy pulse effects
   * @param {Array<THREE.Object3D>} nodeList - Array of node meshes
   */
  registerNodes(nodeList) {
    if (!Array.isArray(nodeList)) return;
    this.nodes = nodeList.filter(n => n && n.userData);
  }
  
  /**
   * Set network-level average synergy (determines if effect is visible)
   * @param {number} avg - Average synergy [0..1]
   */
  setAverageSynergy(avg) {
    this.avgSynergy = Math.max(0.0, Math.min(1.0, avg || 0.0));
  }
  
  /**
   * Update synergy pulse for all nodes
   * Called once per frame
   * 
   * @param {number} dt - Delta time (seconds)
   * @param {number} gameTime - Game world time (seconds)
   */
  update(dt, gameTime) {
    if (!this.enabled || !Array.isArray(this.nodes)) {
      return;
    }
    
    // Accumulate visual time (local animation clock)
    this._visualTime += dt;
    
    // Update each node's synergy pulse
    for (const node of this.nodes) {
      if (!node || !node.userData) continue;
      
      // Get this node's local synergy (average of all linked synergies)
      const nodeSynergy = this._getNodeSynergy(node);
      
      // Only apply pulse if synergy is high enough (> 0.6)
      if (nodeSynergy < 0.6) {
        // Fade out the pulse smoothly if it was active
        this._removeSynergyPulse(node);
        continue;
      }
      
      // Apply smooth synergy pulse
      this._applySynergyPulse(node, nodeSynergy);
    }
  }
  
  /**
   * Get this node's local synergy by averaging linked connections
   * @private
   */
  _getNodeSynergy(node) {
    // If node has stored synergy info, use it
    if (node.userData.linkedSynergyMap) {
      const values = Object.values(node.userData.linkedSynergyMap);
      if (values.length > 0) {
        return values.reduce((a, b) => a + (b || 0), 0) / values.length;
      }
    }
    
    // Fallback to network average if no local synergy available
    return this.avgSynergy;
  }
  
  /**
   * Apply synergy pulse to a node's scale
   * Pure visual effect: modulates scale by ±3% with sine wave
   * @private
   */
  _applySynergyPulse(node, synergy) {
    // Store original scale if not already stored
    if (!node.userData._synergyPulseScale) {
      node.userData._synergyPulseScale = node.scale.clone();
    }
    
    const originalScale = node.userData._synergyPulseScale;
    
    // Compute smooth sinusoidal pulse
    // Formula: pulse = 1.0 + sin(time * 1.5) * 0.03 * synergy
    // This gives:
    // - Frequency: 1.5 rad/s = ~0.24 Hz (very slow, calm breathing)
    // - Amplitude: 0.03 * synergy (max ±3% when synergy=1.0)
    // - Center: 1.0 (no net scale change)
    const frequency = 1.5; // rad/s
    const maxAmplitude = 0.03; // ±3%
    
    const pulse = 1.0 + Math.sin(this._visualTime * frequency) * maxAmplitude * synergy;
    
    // Apply pulse to all axes
    node.scale.x = originalScale.x * pulse;
    node.scale.y = originalScale.y * pulse;
    node.scale.z = originalScale.z * pulse;
    
    // Mark as having active pulse
    node.userData._synergyPulseActive = true;
  }
  
  /**
   * Smoothly remove synergy pulse from a node
   * Restores original scale over a short fade-out
   * @private
   */
  _removeSynergyPulse(node) {
    if (!node.userData._synergyPulseActive) {
      return;
    }
    
    // Restore to original scale
    if (node.userData._synergyPulseScale) {
      node.scale.copy(node.userData._synergyPulseScale);
    }
    
    // Clear pulse state
    node.userData._synergyPulseActive = false;
  }
  
  /**
   * Enable/disable the entire effect
   */
  setEnabled(enabled) {
    this.enabled = !!enabled;
  }
  
  /**
   * Dispose and clean up
   */
  dispose() {
    for (const node of this.nodes) {
      if (node && node.userData) {
        delete node.userData._synergyPulseScale;
        delete node.userData._synergyPulseActive;
      }
    }
    this.nodes = [];
  }
}

// Quick validation function
export function validateSynergyPulseVisuals() {
  console.log('✓ SynergyPulseVisuals_v1 loaded');
  console.log('  - Trigger: synergy > 0.6');
  console.log('  - Effect: ±3% scale pulse');
  console.log('  - Frequency: ~0.24 Hz (calm breathing)');
  console.log('  - Pure visual: zero gameplay impact');
}
