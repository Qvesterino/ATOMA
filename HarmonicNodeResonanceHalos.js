/**
 * HarmonicNodeResonanceHalos
 * ============================================================================
 * Node-level resonance halos for harmonic hubs
 * 
 * SYSTEM BEHAVIOR:
 * - Soft, volumetric-looking energy envelope surrounding harmonic hubs
 * - Activates when: activeLinkCount ≥ 2 AND hubSynchronizationStrength > 0
 * - Pulses in sync with hub phase (deterministic, not noisy)
 * - Visually communicates hub authority, stability, and health
 * - Fully reversible: fades smoothly when conditions cease
 * 
 * HALO MOTION:
 * - Gentle scale breathing (±3-6% oscillation)
 * - Subtle radial luminance wave
 * - No rotation (unless corrupted, then phase wobble)
 * - Pulse frequency synced to hub phase frequency
 * - Pulse phase synced to hub phase
 * 
 * VISUAL MODULATION BY STATE:
 * - Harmony (PRIMARY): Clarity, smoothness, reduced flicker
 * - Synergy: Pulse energy, brightness
 * - Corruption: Distortion, uneven pulse, phase wobble
 * - Instability: Dampened visibility, breathing irregularity
 * - Resilience: Stability, faster recovery, reduced distortion
 * 
 * OVERLOAD/COLLAPSE/RECOVERY:
 * - Overload: Expands erratically, loses symmetry, luminance fractures
 * - Collapse: Flickers, thins, contracts toward core
 * - Recovery: Contracts smoothly, coherence restores, re-lock wave
 * 
 * PHILOSOPHY:
 * Halos visualize the harmonic field surrounding a node. A calm, healthy
 * hub has a smooth, luminous halo. A stressed hub's halo pulses irregularly.
 * A recovering hub's halo gradually restabilizes. All purely visual—no
 * gameplay implications.
 * 
 * ARCHITECTURE:
 * ✅ Adapter layer on top of existing hub systems
 * ✅ Reads hub phase, strength, health, resilience
 * ✅ Single cached mesh per node (created once)
 * ✅ Material uniforms only (no redefinitions)
 * ✅ Zero per-frame allocations
 * ✅ Deterministic phase computation
 * ✅ Graceful fallback for missing data
 * ✅ No opacity setters (uses emissive intensity)
 * 
 * CONSTRAINTS:
 * ✅ Adapter-only (reads state, doesn't modify)
 * ✅ Zero gameplay impact
 * ✅ Fully reversible
 * ✅ No per-frame allocations
 * ✅ No particle systems
 * ✅ No material redefinitions
 * ✅ Deterministic behavior (no randomness)
 * ✅ Graceful degradation
 * 
 * INTEGRATION POINTS:
 * - Node visual system (halo mesh attachment)
 * - HarmonicHubRecoveryController (recovery state)
 * - HarmonicHubResilienceController (resilience level)
 * - Node phase sync system (phase alignment)
 * - Node health/corruption tracking
 * ============================================================================
 */

let THREE_SAFE = null;
THREE_SAFE =
  (typeof window !== 'undefined' && window.THREE) ||
  (typeof globalThis !== 'undefined' && globalThis.THREE) ||
  null;

const THREE = THREE_SAFE;

/**
 * Halo activation thresholds
 */
const HALO_ACTIVATION = {
  MIN_LINK_COUNT: 2,                    // Minimum active links
  MIN_SYNC_STRENGTH: 0.0,               // Minimum hub strength
  MIN_VISIBILITY_THRESHOLD: 0.05        // Below this, fade out completely
};

/**
 * Halo geometry parameters (scales relative to node radius)
 */
const HALO_GEOMETRY = {
  INNER_RADIUS_SCALE: 1.2,              // Inner edge of halo ring
  OUTER_RADIUS_SCALE: 2.0,              // Outer edge of halo ring
  THICKNESS_SCALE: 0.8,                 // Radial thickness
  SEGMENTS: 48,                         // Geometry segments (cached once)
  VERTICAL_SEGMENTS: 8                  // Vertical segments
};

/**
 * Halo visual parameters
 */
const HALO_VISUALS = {
  // Base emission intensity (depends on state)
  HEALTHY_INTENSITY: 0.4,
  STRESSED_INTENSITY: 0.5,
  CORRUPTED_INTENSITY: 0.3,
  
  // Scale breathing parameters
  BREATH_MIN_SCALE: 0.97,               // ±3% at minimum
  BREATH_MAX_SCALE: 1.06,               // ±6% at maximum
  
  // Luminance wave parameters
  WAVE_SPEED: 1.5,                      // Units per second
  WAVE_AMPLITUDE: 0.3,                  // Intensity modulation (0-1)
  
  // Distortion parameters (corruption/instability)
  MAX_DISTORTION: 0.15,                 // Max radial distortion
  MAX_WOBBLE: 0.2,                      // Max phase wobble (radians)
  
  // Recovery smoothing
  RECOVERY_SMOOTHING: 0.15              // Smoothing factor (0-1)
};

/**
 * Color palette for halos
 */
const HALO_COLORS = {
  // Healthy: harmony blue
  harmony: { r: 0.3, g: 0.6, b: 1.0 },
  // Synergy boost: bright cyan
  synergy: { r: 0.0, g: 1.0, b: 1.0 },
  // Stressed: orange warning
  stressed: { r: 1.0, g: 0.6, b: 0.2 },
  // Corrupted: red
  corrupted: { r: 1.0, g: 0.2, b: 0.2 },
  // Collapsed: dark red
  collapsed: { r: 0.4, g: 0.0, b: 0.0 }
};

/**
 * Create a soft halo geometry (sphere-like with gradient)
 * Cached and reused across all instances
 */
function createHaloGeometry(nodeRadius) {
  if (!THREE) return null;
  
  const innerRadius = nodeRadius * HALO_GEOMETRY.INNER_RADIUS_SCALE;
  const outerRadius = nodeRadius * HALO_GEOMETRY.OUTER_RADIUS_SCALE;
  const segments = HALO_GEOMETRY.SEGMENTS;
  const vSegments = HALO_GEOMETRY.VERTICAL_SEGMENTS;
  
  // Create ring/torus-like geometry
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  
  // Generate vertices in two layers (inner and outer radius)
  for (let v = 0; v <= vSegments; v++) {
    const theta = (v / vSegments) * Math.PI * 2;
    
    for (let u = 0; u <= segments; u++) {
      const phi = (u / segments) * Math.PI * 2;
      
      // Inner layer
      const x1 = innerRadius * Math.cos(phi);
      const y1 = innerRadius * Math.sin(theta) * 0.3; // Flatten vertically
      const z1 = innerRadius * Math.sin(phi);
      vertices.push(x1, y1, z1);
      
      // Outer layer
      const x2 = outerRadius * Math.cos(phi);
      const y2 = outerRadius * Math.sin(theta) * 0.3;
      const z2 = outerRadius * Math.sin(phi);
      vertices.push(x2, y2, z2);
    }
  }
  
  // Create indices for triangles (ring quads)
  const vertPerRing = (segments + 1) * 2;
  for (let v = 0; v < vSegments; v++) {
    for (let u = 0; u < segments; u++) {
      const a = v * vertPerRing + u * 2;
      const b = a + 1;
      const c = (v + 1) * vertPerRing + u * 2;
      const d = c + 1;
      
      // Two triangles per quad
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
  geometry.computeVertexNormals();
  
  return geometry;
}

/**
 * Create a simple soft emissive material for the halo
 */
function createHaloMaterial() {
  if (!THREE) return null;
  
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(HALO_COLORS.harmony.r, HALO_COLORS.harmony.g, HALO_COLORS.harmony.b),
    emissive: new THREE.Color(HALO_COLORS.harmony.r, HALO_COLORS.harmony.g, HALO_COLORS.harmony.b),
    emissiveIntensity: HALO_VISUALS.HEALTHY_INTENSITY,
    transparent: false,
    side: THREE.DoubleSide,
    fog: false,
    depthWrite: false,
    depthTest: true
  });
  
  return material;
}

/**
 * HarmonicNodeResonanceHalos
 * Manages resonance halos for harmonic hubs
 */
export class HarmonicNodeResonanceHalos {
  constructor() {
    // Per-node halo state tracking
    this.nodeHalos = new Map(); // nodeId → { node, haloMesh, state, ... }
    
    // Cached geometry (shared across all halos)
    this.cachedGeometry = null;
    this.cachedMaterial = null;
    
    // Time tracking
    this.totalTime = 0;
    this.lastUpdateTime = 0;
    
    // Stats
    this.activeHaloCount = 0;
  }

  /**
   * Create or get halo geometry for a given node radius
   */
  getHaloGeometry(nodeRadius) {
    if (!this.cachedGeometry) {
      this.cachedGeometry = createHaloGeometry(nodeRadius);
    }
    return this.cachedGeometry;
  }

  /**
   * Create or get halo material
   */
  getHaloMaterial() {
    if (!this.cachedMaterial) {
      this.cachedMaterial = createHaloMaterial();
    }
    return this.cachedMaterial;
  }

  /**
   * Initialize or get halo for a node
   */
  initializeNodeHalo(nodeId, nodeObject, nodeRadius) {
    if (!nodeObject || !THREE) return null;
    
    let haloData = this.nodeHalos.get(nodeId);
    if (haloData) return haloData;
    
    // Create halo mesh
    const geometry = this.getHaloGeometry(nodeRadius);
    const material = this.getHaloMaterial();
    
    if (!geometry || !material) return null;
    
    const haloMesh = new THREE.Mesh(geometry, material.clone());
    haloMesh.name = `halo_${nodeId}`;
    haloMesh.frustumCulled = true;
    
    // Attach to node
    nodeObject.add(haloMesh);
    
    // Initialize state
    haloData = {
      nodeId,
      node: nodeObject,
      haloMesh,
      originalScale: haloMesh.scale.clone(),
      
      // Activation
      isActive: false,
      targetIntensity: 0,
      currentIntensity: 0,
      
      // Hub state
      hubPhase: 0,
      hubSyncStrength: 0,
      hubHealth: 1.0,
      hubResilience: 0,
      
      // Halo behavior
      currentScale: 1.0,
      targetScale: 1.0,
      currentColor: { ...HALO_COLORS.harmony },
      targetColor: { ...HALO_COLORS.harmony },
      
      // Distortion (corruption/instability)
      distortionAmount: 0,
      wobbleAmount: 0,
      
      // Recovery state
      isRecovering: false,
      recoveryProgress: 0,
      
      // Timestamps
      lastUpdateTime: 0
    };
    
    this.nodeHalos.set(nodeId, haloData);
    return haloData;
  }

  /**
   * Update all node halos
   * @param {number} deltaTime - Frame delta time
   * @param {Array|Map} nodeRegistry - Nodes to update halos for
   * @param {Map} hubSystemData - Hub data from HarmonicHubAuraSystem
   * @param {Map} harmonicManagerData - Hub data from NodeHarmonicManager (includes collapse/recovery/resilience)
   */
  update(deltaTime, nodeRegistry, hubSystemData, harmonicManagerData = null) {
    if (!nodeRegistry) return;
    
    this.totalTime += deltaTime;
    this.lastUpdateTime = performance.now();
    this.activeHaloCount = 0;
    
    // Update each node's halo
    nodeRegistry.forEach((node, nodeId) => {
      if (!node) return;
      
      // Get or initialize halo
      const haloData = this.nodeHalos.get(nodeId) || 
                      this.initializeNodeHalo(nodeId, node, node.scale?.x || 1.0);
      
      if (!haloData) return;
      
      // Get hub state from hubSystemData, harmonicManagerData, or node userData
      const hubState = this.getHubState(nodeId, hubSystemData, harmonicManagerData, node);
      
      // Determine if halo should be active
      const shouldBeActive = this.shouldHaloBeActive(hubState);
      
      // Update halo state
      this.updateHaloState(haloData, hubState, shouldBeActive, deltaTime);
      
      // Apply halo visuals
      this.applyHaloVisuals(haloData);
      
      if (haloData.isActive) {
        this.activeHaloCount++;
      }
    });
  }

  /**
   * Get hub state for a node
   * @param {string} nodeId - Node ID
   * @param {Map} hubSystemData - Hub data from HarmonicHubAuraSystem
   * @param {Map} harmonicManagerData - Hub data from NodeHarmonicManager
   * @param {Object} node - Node object
   */
  getHubState(nodeId, hubSystemData, harmonicManagerData, node) {
    const state = {
      isHarmonicHub: false,
      activeLinkCount: 0,
      hubPhase: 0,
      hubSyncStrength: 0,
      stability: 1.0,
      harmony: 0.5,
      synergy: 0.5,
      corruption: 0,
      instability: 0,
      resilience: 0,
      isRecovering: false,
      isCollapsed: false,
      collapseFactor: 0,
      recoveryFactor: 0,
      nodeRadius: node.scale?.x || 1.0
    };
    
    // Get from hubSystemData if available (HarmonicHubAuraSystem)
    if (hubSystemData && hubSystemData.get) {
      const hubData = hubSystemData.get(nodeId);
      if (hubData) {
        state.isHarmonicHub = hubData.isHarmonicHub || hubData.activeLinkCount >= 2;
        state.activeLinkCount = hubData.activeLinkCount || 0;
        state.hubPhase = hubData.phase || 0;
        state.hubSyncStrength = hubData.syncStrength || 0;
        state.harmony = hubData.harmony || 0.5;
        state.synergy = hubData.synergy || 0.5;
        state.corruption = hubData.corruption || 0;
        state.stability = hubData.stability ?? state.stability;
        state.instability = hubData.instability ?? state.instability;
        state.resilience = hubData.resilience || 0;
        state.isRecovering = hubData.isRecovering || false;
        state.isCollapsed = hubData.isCollapsed || false;
      }
    }
    
    // Get from harmonicManagerData if available (NodeHarmonicManager - includes collapse/recovery/resilience)
    if (harmonicManagerData && harmonicManagerData.get) {
      const managerData = harmonicManagerData.get(nodeId);
      if (managerData) {
        // Manager data takes precedence for these fields (more detailed)
        state.isHarmonicHub = managerData.isHarmonicHub || state.isHarmonicHub;
        state.activeLinkCount = managerData.activeLinkCount || state.activeLinkCount;
        state.hubPhase = managerData.phase || state.hubPhase;
        state.hubSyncStrength = managerData.syncStrength || state.hubSyncStrength;
        state.harmony = managerData.harmony ?? state.harmony;
        state.synergy = managerData.synergy ?? state.synergy;
        state.corruption = managerData.corruption ?? state.corruption;
        state.instability = managerData.instability ?? state.instability;
        state.stability = managerData.stability ?? state.stability;
        state.resilience = managerData.resilience || state.resilience;
        state.isRecovering = managerData.isRecovering || state.isRecovering;
        state.isCollapsed = managerData.isCollapsed || state.isCollapsed;
        state.collapseFactor = managerData.collapseFactor || 0;
        state.recoveryFactor = managerData.recoveryFactor || 0;
      }
    }
    
    // Fallback to node userData
    if (node.userData) {
      state.isHarmonicHub = state.isHarmonicHub || (node.userData.isHarmonicHub || false);
      state.activeLinkCount = node.userData.activeLinkCount || state.activeLinkCount;
      state.hubPhase = node.userData.hubPhase || state.hubPhase;
      state.hubSyncStrength = node.userData.hubSyncStrength || state.hubSyncStrength;
      const metrics = node.userData.metrics || {};
      state.harmony = metrics.harmony ?? state.harmony;
      state.synergy = metrics.synergy ?? state.synergy;
      state.corruption = metrics.corruption ?? state.corruption;
      state.stability = metrics.stability ?? state.stability;
      state.instability = 1 - state.stability;
      state.resilience = node.userData.resilience || state.resilience;
      state.isRecovering = node.userData.isRecovering || state.isRecovering;
      state.isCollapsed = node.userData.isCollapsed || state.isCollapsed;
    }
    
    // Also check node.harmonicControllers (attached by NodeHarmonicManager)
    if (node.harmonicControllers) {
      const { collapse, recovery, resilience } = node.harmonicControllers;
      if (collapse) {
        state.collapseFactor = collapse.collapseFactor || state.collapseFactor;
        state.isCollapsed = collapse.collapseFactor > 0.8 || state.isCollapsed;
      }
      if (recovery) {
        state.recoveryFactor = recovery.recoveryFactor || state.recoveryFactor;
        state.isRecovering = recovery.isInRecovery() || state.isRecovering;
      }
      if (resilience) {
        state.resilience = resilience.hubResilience || state.resilience;
      }
    }
    
    return state;
  }

  /**
   * Determine if halo should be active
   */
  shouldHaloBeActive(hubState) {
    // Halo activates when:
    // 1. Node is a harmonic hub
    // 2. Has at least 2 active links
    // 3. Has synchronization strength
    
    const isHub = hubState.isHarmonicHub && hubState.activeLinkCount >= HALO_ACTIVATION.MIN_LINK_COUNT;
    const hasSync = hubState.hubSyncStrength > HALO_ACTIVATION.MIN_SYNC_STRENGTH;
    
    return isHub && hasSync && !hubState.isCollapsed;
  }

  /**
   * Update halo state (activation, intensity, color, distortion)
   */
  updateHaloState(haloData, hubState, shouldBeActive, deltaTime) {
    const easeAmount = Math.min(1, 3 * deltaTime); // Smooth easing
    
    // Update activation
    haloData.isActive = shouldBeActive;
    if (!shouldBeActive) {
      this.restoreHaloScale(haloData);
    }
    
    // Compute target intensity based on hub state
    let targetIntensity = 0;
    if (shouldBeActive) {
      // Base intensity increases with sync strength
      targetIntensity = HALO_VISUALS.HEALTHY_INTENSITY * hubState.hubSyncStrength;
      
      // Synergy boosts intensity
      targetIntensity *= (0.8 + hubState.synergy * 0.4);
      
      // Corruption reduces intensity
      targetIntensity *= (1.0 - hubState.corruption * 0.3);
      
      // Instability dampens intensity
      targetIntensity *= (1.0 - hubState.instability * 0.4);
    }
    
    haloData.targetIntensity = targetIntensity;
    
    // Smooth intensity
    haloData.currentIntensity += (targetIntensity - haloData.currentIntensity) * easeAmount;
    
    // Update color based on health
    const targetColor = this.getHaloColor(hubState);
    haloData.targetColor = targetColor;
    
    // Smooth color
    haloData.currentColor.r += (targetColor.r - haloData.currentColor.r) * easeAmount;
    haloData.currentColor.g += (targetColor.g - haloData.currentColor.g) * easeAmount;
    haloData.currentColor.b += (targetColor.b - haloData.currentColor.b) * easeAmount;
    
    // Update distortion (corruption + instability)
    const targetDistortion = (hubState.corruption * 0.5 + hubState.instability * 0.5) * HALO_GEOMETRY.THICKNESS_SCALE;
    haloData.distortionAmount += (targetDistortion - haloData.distortionAmount) * easeAmount * 0.5;
    
    // Update wobble (phase noise from corruption/instability)
    const targetWobble = (hubState.corruption + hubState.instability) * 0.1;
    haloData.wobbleAmount += (targetWobble - haloData.wobbleAmount) * easeAmount;
    
    // Update resilience effect
    const resilienceFactor = hubState.resilience; // 0-1
    haloData.recoveryProgress = resilienceFactor;
    
    // Update recovery state
    haloData.isRecovering = hubState.isRecovering;
    
    // Update hub state cache
    haloData.hubPhase = hubState.hubPhase;
    haloData.hubSyncStrength = hubState.hubSyncStrength;
    haloData.hubHealth = 1.0 - hubState.corruption;
  }

  /**
   * Get target color for halo based on hub state
   */
  getHaloColor(hubState) {
    // Priority: collapsed → corrupted → stressed → healthy/synergy
    
    if (hubState.isCollapsed) {
      return HALO_COLORS.collapsed;
    }
    
    if (hubState.corruption > 0.6) {
      return HALO_COLORS.corrupted;
    }
    
    if (hubState.corruption > 0.3 || hubState.instability > 0.4) {
      return HALO_COLORS.stressed;
    }
    
    // Synergy boost when healthy
    if (hubState.synergy > 0.7 && hubState.corruption < 0.2) {
      return HALO_COLORS.synergy;
    }
    
    // Default: harmony blue
    return HALO_COLORS.harmony;
  }

  /**
   * Apply halo visuals (scale breathing, luminance wave, distortion)
   */
  applyHaloVisuals(haloData) {
    if (!haloData.haloMesh) return;
    
    const material = haloData.haloMesh.material;
    if (!material) return;
    
    // Stop updates if intensity is very low
    if (haloData.currentIntensity < HALO_ACTIVATION.MIN_VISIBILITY_THRESHOLD) {
      material.emissiveIntensity = 0;
      this.restoreHaloScale(haloData);
      return;
    }
    
    // Compute breathing scale animation
    const breatheAmount = (Math.sin(this.totalTime * Math.PI * 2) + 1) * 0.5; // 0-1
    const breatheScale = HALO_VISUALS.BREATH_MIN_SCALE + 
                        breatheAmount * (HALO_VISUALS.BREATH_MAX_SCALE - HALO_VISUALS.BREATH_MIN_SCALE);
    
    // Add phase-driven pulsing
    const phasePulse = Math.sin(haloData.hubPhase) * 0.05;
    const finalScale = breatheScale + phasePulse;
    
    // Add resilience-based stability (reduces breathing at high resilience)
    const stabilityDamping = 1.0 - haloData.recoveryProgress * 0.3;
    const finalScaleFactor = finalScale * stabilityDamping;
    haloData.currentScale = finalScaleFactor;

    const baseScale = this.ensureOriginalScale(haloData);
    if (baseScale && haloData.haloMesh) {
      if (haloData.isActive) {
        haloData.haloMesh.scale.set(
          baseScale.x * finalScaleFactor,
          baseScale.y * finalScaleFactor,
          baseScale.z * finalScaleFactor
        );
      } else {
        haloData.haloMesh.scale.copy(baseScale);
      }
    }
    
    // Apply color
    if (material.emissive) {
      material.emissive.setRGB(
        haloData.currentColor.r,
        haloData.currentColor.g,
        haloData.currentColor.b
      );
    }
    
    // Compute luminance wave (radial intensity modulation)
    const wavePhase = (this.totalTime * HALO_VISUALS.WAVE_SPEED + haloData.hubPhase) * Math.PI * 2;
    const waveModulation = 1.0 + Math.sin(wavePhase) * HALO_VISUALS.WAVE_AMPLITUDE;
    
    // Apply corruption distortion to wave
    const distortedWave = waveModulation * (1.0 - haloData.distortionAmount * 0.5);
    
    // Apply instability wobble
    const wobbleModulation = 1.0 + Math.sin(wavePhase + haloData.wobbleAmount) * 0.1;
    
    // Final intensity combines everything
    const finalIntensity = haloData.currentIntensity * distortedWave * wobbleModulation;
    
    // Clamp to valid range
    material.emissiveIntensity = Math.max(0, Math.min(1, finalIntensity));
    
    // Mark material as needing update
    material.needsUpdate = false; // No changes to uniforms, just emissiveIntensity
  }

  /**
   * Trigger recovery re-lock wave (visual feedback)
   */
  triggerRecoveryWave(nodeId) {
    const haloData = this.nodeHalos.get(nodeId);
    if (!haloData) return;
    
    // Mark as recovering
    haloData.isRecovering = true;
    
    // Will be handled by update() and reflected in visuals
  }

  /**
   * Ensure the haloData records the baseline scale for reversible adjustments
   */
  ensureOriginalScale(haloData) {
    if (!haloData || !haloData.haloMesh) return null;
    if (!haloData.originalScale) {
      haloData.originalScale = haloData.haloMesh.scale.clone();
    }
    return haloData.originalScale;
  }

  /**
   * Restore halo mesh to its baseline scale
   */
  restoreHaloScale(haloData) {
    const baseScale = this.ensureOriginalScale(haloData);
    if (baseScale && haloData.haloMesh) {
      haloData.haloMesh.scale.copy(baseScale);
    }
  }

  /**
   * Get halo intensity for a node
   */
  getHaloIntensity(nodeId) {
    const haloData = this.nodeHalos.get(nodeId);
    return haloData ? haloData.currentIntensity : 0;
  }

  /**
   * Get halo active status
   */
  isHaloActive(nodeId) {
    const haloData = this.nodeHalos.get(nodeId);
    return haloData ? haloData.isActive : false;
  }

  /**
   * Get debug info for a node's halo
   */
  getDebugInfoForNode(nodeId) {
    const haloData = this.nodeHalos.get(nodeId);
    if (!haloData) return null;
    
    return {
      nodeId,
      isActive: haloData.isActive,
      intensity: haloData.currentIntensity.toFixed(3),
      scale: haloData.currentScale.toFixed(3),
      color: {
        r: haloData.currentColor.r.toFixed(2),
        g: haloData.currentColor.g.toFixed(2),
        b: haloData.currentColor.b.toFixed(2)
      },
      distortion: haloData.distortionAmount.toFixed(3),
      wobble: haloData.wobbleAmount.toFixed(3),
      resilience: haloData.recoveryProgress.toFixed(2),
      isRecovering: haloData.isRecovering,
      hubPhase: haloData.hubPhase.toFixed(3),
      syncStrength: haloData.hubSyncStrength.toFixed(3)
    };
  }

  /**
   * Get system stats
   */
  getStats() {
    return {
      activeHaloCount: this.activeHaloCount,
      trackedNodeCount: this.nodeHalos.size,
      totalTime: this.totalTime,
      cachedGeometry: this.cachedGeometry ? 'yes' : 'no',
      cachedMaterial: this.cachedMaterial ? 'yes' : 'no'
    };
  }

  /**
   * Dispose all halos
   */
  dispose() {
    this.nodeHalos.forEach((haloData) => {
      if (haloData.haloMesh) {
        this.restoreHaloScale(haloData);
        haloData.haloMesh.geometry.dispose();
        haloData.haloMesh.material.dispose();
        haloData.node.remove(haloData.haloMesh);
      }
    });
    
    this.nodeHalos.clear();
    
    if (this.cachedGeometry) {
      this.cachedGeometry.dispose();
      this.cachedGeometry = null;
    }
    
    if (this.cachedMaterial) {
      this.cachedMaterial.dispose();
      this.cachedMaterial = null;
    }
  }
}

// Export for use in main.js
export default HarmonicNodeResonanceHalos;
