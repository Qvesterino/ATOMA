/**
 * CANONICAL TEMPLATE #3: NETWORK STRESS & LOAD PRESSURE VISUALS
 * 
 * Pure visualization system for:
 * - Network Stress (global ambient effects)
 * - Load Pressure (node-local indicators)
 * 
 * DESIGN PRINCIPLES:
 * - Read-only consumers of existing metrics
 * - Zero gameplay logic (visualization only)
 * - Canonical visual templates (immutable)
 * - Non-breaking integration
 * 
 * Visual Behavior:
 * - Network Stress: Ambient field turbulence, color shift (cool → red)
 * - Load Pressure: Node jitter, connector emphasis, pulse rate
 * 
 * Data Sources (Read-Only):
 * - networkStress: from LinkCorruptionTransmission_v1.computeNetworkStress()
 * - node.loadPressure: computed locally per node (0-1 scale)
 * 
 * Visual Output:
 * - Background ambient effect (dynamic color, turbulence)
 * - Per-node stress overlay (jitter, pulse acceleration)
 */

export class CanonicalTemplate3_StressVisuals {
  /**
   * @param {THREE.Scene} scene - Three.js scene
   * @param {Object} config - Configuration options
   */
  constructor(scene, config = {}) {
    this.scene = scene;
    this.debugMode = config.debugMode || false;

    // State tracking
    this.networkStress = 0;           // Global 0–1
    this.nodeStressMap = new Map();   // node → { loadPressure: 0–1 }
    
    // Visual materials
    this.ambientStressMaterial = null;
    this.nodeStressOverlay = null;

    // Performance
    this.updateInterval = 1 / 60;
    this.elapsedTime = 0;

    // Canonical color palette (stress gradient)
    this.stressColorLow = { r: 0.2, g: 0.4, b: 0.6 };     // Cool blue (low stress)
    this.stressColorMid = { r: 0.8, g: 0.5, b: 0.2 };     // Orange (medium stress)
    this.stressColorHigh = { r: 1.0, g: 0.2, b: 0.2 };    // Red (high stress)

    if (this.debugMode) {
      console.log('%c[CanonicalTemplate3_StressVisuals] Initialized', 'color: #ff9900; font-weight: bold;');
    }
  }

  /**
   * Update network stress level (read from LinkCorruptionTransmission)
   * 
   * @param {number} stressValue - Global network stress (0–1)
   */
  updateNetworkStress(stressValue) {
    const numericStress = Number(stressValue ?? 0);
    if (!Number.isFinite(numericStress)) {
      this.networkStress = 0;
      return;
    }
    // Accept both 0..1 and 0..100 sources (NetworkStressAggregator is 0..100).
    const normalizedStress = numericStress > 1 ? (numericStress / 100) : numericStress;
    this.networkStress = Math.max(0, Math.min(1, normalizedStress));
  }

  /**
   * Register a node for stress tracking
   * 
   * @param {Object} node - Node to track
   */
  registerNode(node) {
    if (!node) return;
    
    const nodeId = node.id || `node_${Math.random()}`;
    
    if (!this.nodeStressMap.has(nodeId)) {
      this.nodeStressMap.set(nodeId, {
        loadPressure: 0,
        node: node,
        jitterAccel: 0,
        pulsePhase: Math.random() * Math.PI * 2
      });
      
      // Store original position
      if (node.position && !node.userData.originalPosition) {
        node.userData.originalPosition = node.position.clone();
      }
    }
  }

  /**
   * Unregister a node from stress tracking
   * 
   * @param {Object} node - Node to untrack
   */
  unregisterNode(node) {
    if (!node) return;
    
    const nodeId = node.id || `node_${Math.random()}`;
    
    if (this.nodeStressMap.has(nodeId)) {
      const stressData = this.nodeStressMap.get(nodeId);
      
      // Restore original position
      if (node.userData && node.userData.originalPosition) {
        node.position.copy(node.userData.originalPosition);
        delete node.userData.originalPosition;
      }
      
      // Clear stress-related userData
      if (node.userData) {
        delete node.userData.stressPulseRate;
        delete node.userData.stressPulsePhase;
        delete node.userData.stressIntensity;
      }
      
      // Remove from tracking
      this.nodeStressMap.delete(nodeId);
    }
  }

  /**
   * Update node-local load pressure
   * 
   * @param {Object} node - Node object
   * @param {number} loadPressure - Local load (0–1)
   */
  updateNodeLoadPressure(node, loadPressure) {
    if (!node) return;

    const nodeId = node.id || `node_${Math.random()}`;
    const clampedLoad = Math.max(0, Math.min(1, loadPressure ?? 0));

    if (!this.nodeStressMap.has(nodeId)) {
      this.nodeStressMap.set(nodeId, {
        loadPressure: 0,
        node: node,
        jitterAccel: 0,
        pulsePhase: Math.random() * Math.PI * 2
      });
      
      // Store original position
      if (node.position && !node.userData.originalPosition) {
        node.userData.originalPosition = node.position.clone();
      }
    }

    const stressData = this.nodeStressMap.get(nodeId);
    stressData.loadPressure = clampedLoad;
  }

  /**
   * Main update loop (called once per frame)
   * 
   * @param {number} deltaTime - Time since last frame
   * @param {number} currentTime - Elapsed time (for animations)
   */
  update(deltaTime = 1/60, currentTime = 0) {
    this.elapsedTime = currentTime;

    // Update ambient stress field
    this.updateAmbientStressField(deltaTime);

    // Update per-node stress overlays
    this.updateNodeStressOverlays(deltaTime);
  }

  /**
   * Update ambient stress field visual effects
   * 
   * Communicates global network tension through:
   * - Background color shift (cool → red)
   * - Subtle field turbulence (low frequency)
   * - Overall mood/atmosphere
   */
  updateAmbientStressField(deltaTime) {
    if (!this.scene) return;

    const stress = this.networkStress;

    // === COLOR SHIFT BASED ON STRESS ===
    // Interpolate from cool (low) → orange (mid) → red (high)
    let color;
    if (stress < 0.5) {
      // Low to medium: blue → orange
      const t = stress * 2; // 0 to 1
      color = this.lerpColor(this.stressColorLow, this.stressColorMid, t);
    } else {
      // Medium to high: orange → red
      const t = (stress - 0.5) * 2; // 0 to 1
      color = this.lerpColor(this.stressColorMid, this.stressColorHigh, t);
    }

    // Apply to scene fog (if it exists)
    if (this.scene.fog) {
      this.scene.fog.color.setRGB(color.r, color.g, color.b);
      
      // Fog density increases with stress (visibility reduction)
      const baseFogDensity = 0.005;
      const maxFogDensity = 0.03;
      this.scene.fog.density = baseFogDensity + (stress * (maxFogDensity - baseFogDensity));
    }

    // === AMBIENT LIGHT MODULATION ===
    // Reduce ambient light intensity under high stress (ominous feel)
    const ambientLights = this.scene.children.filter(
      child => child.isLight && child.constructor.name === 'AmbientLight'
    );
    
    for (const light of ambientLights) {
      const baseIntensity = 1.0;
      const stressedIntensity = baseIntensity * (1 - stress * 0.2); // Max 20% dim
      light.intensity = stressedIntensity;
    }

    // === LOW-FREQUENCY TURBULENCE (OPTIONAL) ===
    // Could be implemented via post-processing distortion
    // For now, communicated through color + fog + light changes
  }

  /**
   * Update per-node stress overlay visuals
   * 
   * Communicates local node load through:
   * - Subtle jitter/vibration of node geometry
   * - Faster pulse rate
   * - Connector emphasis (ports glow)
   */
  updateNodeStressOverlays(deltaTime) {
    // Remove stale nodes (nodes that no longer exist in scene)
    const staleNodeIds = [];
    
    for (const [nodeId, stressData] of this.nodeStressMap.entries()) {
      const { node, loadPressure, jitterAccel, pulsePhase } = stressData;
      
      // Check if node still exists and is in scene
      if (!node || !node.parent) {
        staleNodeIds.push(nodeId);
        continue;
      }
      
      if (!node.userData) continue;

      // === JITTER EFFECT ===
      // Higher load = more vibration
      const maxJitterAmount = 0.02; // Maximum displacement
      const jitterAmount = loadPressure * maxJitterAmount;

      if (jitterAmount > 0 && node.position) {
        // Smooth random jitter (using sine waves at different frequencies)
        const jitterX = Math.sin(this.elapsedTime * 12.5) * jitterAmount;
        const jitterY = Math.sin(this.elapsedTime * 15.0 + 1) * jitterAmount;
        const jitterZ = Math.sin(this.elapsedTime * 18.3 + 2) * jitterAmount;

        // Store original position if not already stored
        if (!node.userData.originalPosition) {
          node.userData.originalPosition = node.position.clone();
        }

        // Apply jitter to position
        node.position.copy(node.userData.originalPosition);
        node.position.x += jitterX;
        node.position.y += jitterY;
        node.position.z += jitterZ;
      } else if (node.userData.originalPosition) {
        // Restore original position when load is low
        node.position.copy(node.userData.originalPosition);
      }

      // === PULSE ACCELERATION ===
      // Higher load = faster pulse rate in visual materials
      const basePulseRate = 1.0;
      const maxPulseRate = 3.0; // 3x faster under maximum load
      const pulseRate = basePulseRate + (loadPressure * (maxPulseRate - basePulseRate));

      // Store pulse info for shader consumption
      node.userData.stressPulseRate = pulseRate;
      node.userData.stressPulsePhase = (this.elapsedTime * pulseRate) % (Math.PI * 2);

      // === CONNECTOR EMPHASIS ===
      // Store stress value for connector visuals to read
      node.userData.stressIntensity = loadPressure;

      if (this.debugMode && Math.random() < 0.01) {
        console.log(`[Template3] Node ${nodeId.substring(0, 8)}... stress=${loadPressure.toFixed(2)}`);
      }
    }
    
    // Remove stale nodes from tracking
    for (const nodeId of staleNodeIds) {
      this.nodeStressMap.delete(nodeId);
      if (this.debugMode) {
        console.warn(`[Template3] Removed stale node: ${nodeId.substring(0, 8)}...`);
      }
    }
  }

  /**
   * Linear interpolation between two colors
   * 
   * @param {Object} colorA - Start color { r, g, b }
   * @param {Object} colorB - End color { r, g, b }
   * @param {number} t - Interpolation factor (0–1)
   * @returns {Object} Interpolated color { r, g, b }
   */
  lerpColor(colorA, colorB, t) {
    return {
      r: colorA.r + (colorB.r - colorA.r) * t,
      g: colorA.g + (colorB.g - colorA.g) * t,
      b: colorA.b + (colorB.b - colorA.b) * t
    };
  }

  /**
   * Get network stress value (for external systems that want to read it)
   * 
   * @returns {number} Current network stress (0–1)
   */
  getNetworkStress() {
    return this.networkStress;
  }

  /**
   * Get node-local load pressure
   * 
   * @param {Object} node - Node to query
   * @returns {number} Load pressure (0–1)
   */
  getNodeLoadPressure(node) {
    if (!node) return 0;
    const nodeId = node.id || `node_${Math.random()}`;
    return this.nodeStressMap.get(nodeId)?.loadPressure ?? 0;
  }

  /**
   * Debug: Print all tracked nodes and their stress levels
   */
  debugPrintStress() {
    console.log('%c[CanonicalTemplate3] NETWORK STRESS DEBUG', 'color: #ff9900; font-weight: bold;');
    console.log(`Global Network Stress: ${this.networkStress.toFixed(3)}`);
    console.log(`Tracked Nodes: ${this.nodeStressMap.size}`);
    
    for (const [nodeId, data] of this.nodeStressMap.entries()) {
      console.log(`  ${nodeId.substring(0, 8)}... load=${data.loadPressure.toFixed(3)}`);
    }
  }

  /**
   * Reset system state (call on world switch)
   * Clears all node tracking and restores original positions
   */
  reset() {
    // Restore all tracked node positions
    for (const [nodeId, stressData] of this.nodeStressMap.entries()) {
      const { node } = stressData;
      
      if (node && node.userData && node.userData.originalPosition) {
        // Restore original position
        node.position.copy(node.userData.originalPosition);
        
        // Clear stress-related userData
        delete node.userData.originalPosition;
        delete node.userData.stressPulseRate;
        delete node.userData.stressPulsePhase;
        delete node.userData.stressIntensity;
      }
    }
    
    // Clear all node tracking
    this.nodeStressMap.clear();
    
    // Reset network stress
    this.networkStress = 0;
    
    // Reset elapsed time
    this.elapsedTime = 0;
    
    if (this.debugMode) {
      console.log('%c[CanonicalTemplate3] System reset', 'color: #ff9900; font-weight: bold;');
    }
  }

  /**
   * Dispose system and clean up all resources
   * Restores all node positions and clears all state
   */
  dispose() {
    // Restore all node positions (same as reset)
    for (const [nodeId, stressData] of this.nodeStressMap.entries()) {
      const { node } = stressData;
      
      if (node && node.userData && node.userData.originalPosition) {
        node.position.copy(node.userData.originalPosition);
        
        delete node.userData.originalPosition;
        delete node.userData.stressPulseRate;
        delete node.userData.stressPulsePhase;
        delete node.userData.stressIntensity;
      }
    }
    
    // Clear all node tracking
    this.nodeStressMap.clear();
    
    // Reset network stress
    this.networkStress = 0;
    
    // Reset elapsed time
    this.elapsedTime = 0;
    
    // Clear scene reference
    this.scene = null;
    
    if (this.debugMode) {
      console.log('%c[CanonicalTemplate3] System disposed', 'color: #ff9900; font-weight: bold;');
    }
  }
};

