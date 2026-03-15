import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { NodeSegmentedOrbitRings } from './shaders/NodeSegmentedOrbitRings.js';
import { createMultiBandFresnelRimAura } from './FresnelRimLightAuraShader.js';

// PHASE S-5: Variant property freezing for shader variant immunity
const VARIANT_CRITICAL_PROPS = [
    'transparent',
    'side',
    'blending',
    'depthWrite',
    'depthTest',
    'alphaTest'
];

function freezeMaterialFlags(material, owner = 'NodeLinkedAuraSystem') {
    if (!material) return;
    if (!material.userData) material.userData = {};
    material.userData.__frozenVariantProps = material.userData.__frozenVariantProps || new Set();
    material.userData.__warnedVariantProp = material.userData.__warnedVariantProp || new Set();

    VARIANT_CRITICAL_PROPS.forEach((prop) => {
        if (material.userData.__frozenVariantProps.has(prop)) return;

        const desc = Object.getOwnPropertyDescriptor(material, prop);
        if (desc && desc.configurable === false) {
            if (!material.userData.__warnedVariantProp.has(prop)) {
                console.warn('[VariantLock] Prop already locked, skip redefine', prop, material.uuid);
                material.userData.__warnedVariantProp.add(prop);
            }
            material.userData.__frozenVariantProps.add(prop);
            return;
        }

        const cachedValue = material[prop];
        try {
            Object.defineProperty(material, prop, {
                configurable: true,
                enumerable: true,
                get() {
                    return cachedValue;
                },
                set(value) {
                    if (cachedValue === value) return;
                    if (!material.userData.__warnedVariantProp.has(prop)) {
                        console.error('[VariantLock]', prop, 'modified after lock');
                        material.userData.__warnedVariantProp.add(prop);
                    }
                }
            });
            material.userData.__frozenVariantProps.add(prop);
        } catch (err) {
            if (!material.userData.__warnedVariantProp.has(prop)) {
                console.warn('[VariantLock] Failed to lock prop', prop, material.uuid, err?.message);
                material.userData.__warnedVariantProp.add(prop);
            }
        }
    });

    material.userData.__owner = material.userData.__owner || owner;
    material.userData.__flagsFrozen = true;
    material.__variantLocked = true;
}

/**
 * Node Linked Aura System - Dynamic breathing aura for connected nodes
 * 
 * Creates organic, torn-looking aura meshes with flame-like motion behavior.
 * Activated only when nodes have active links. Motion is subtle, unpredictable,
 * and driven by layered noise for a living, breathing feel.
 * 
 * VISUAL: Torn mesh shell (NOT smooth sphere), grey-white/desaturated cyan
 * MOTION: Flame-inspired drift/licking without fire visuals
 * ACTIVATION: Scales with link count (1-4 links max influence)
 * CORRUPTION: High corruption increases irregularity, reduces upward drift, adds opacity variation
 * HARMONY: Stabilizes and smooths motion, restores upward flow, reduces opacity unevenness
 *   - Phase alignment between noise layers
 *   - Reduced silhouette irregularity
 *   - Restored vertical flow bias
 * PERFORMANCE: Zero per-frame allocations, in-place buffer updates
 */

export class NodeLinkedAuraSystem {
  constructor(scene, linkingSystem, options = {}) {
    this.scene = scene;
    this.linkingSystem = linkingSystem;
    this.impactManager = options.impactManager ?? null;  // Optional particle impact manager
    
    // Configuration
    this.enabled = options.enabled ?? true;  // Enabled by default (feature flag)
    console.log("NodeAuraSystem enabled:", this.enabled);
    this.debugMode = false;
    
    // Aura tracking
    this.nodeAuras = new Map();  // node → aura data
    
    // Visual parameters
    this.visualParams = {
      baseOpacity: 0.09,
      minOpacity: 0.06,
      maxOpacity: 0.12,
      baseScale: 1.15,
      maxScale: 1.25,
      color: new THREE.Color(0.85, 0.88, 0.9),  // Desaturated grey-white
      accentColor: new THREE.Color(0.7, 0.85, 0.88),  // Desaturated cyan
      roughness: 0.95,
      metalness: 0.0
    };
    
    // Motion parameters - flame-like behavior
    this.motionParams = {
      // Base motion frequencies (low-frequency noise)
      baseFreqX: 0.4,
      baseFreqY: 0.6,  // Slightly faster Y for upward drift
      baseFreqZ: 0.5,
      
      // Motion amplitudes
      baseAmplitude: 0.08,
      maxAmplitude: 0.15,
      
      // Drift behavior (flame-like upward tendency)
      upwardDriftBias: 0.3,  // Gentle upward pull
      driftFrequency: 0.2,
      
      // Link creation spike
      linkSpikeAmplitude: 0.25,
      linkSpikeDuration: 0.15,  // 150ms
      linkSpikeDecay: 0.18,
      
      // Harmonic synchronization
      harmonicSyncStrength: 0.15,
      harmonicPhaseBlend: 0.08
    };
    
    // Shared noise offsets (for subtle global coherence)
    this.globalTime = 0;
    this.globalNoiseOffset = {
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      z: Math.random() * 1000
    };
    
    // Performance tracking
    this.stats = {
      activeAuras: 0,
      lastUpdateTime: 0,
      avgUpdateTime: 0
    };
    
    if (this.enabled) {
      console.log('[NodeAuraSystem] Initialized (ENABLED)');
    } else {
      console.log('[NodeAuraSystem] Initialized (DISABLED - use game.enableNodeAuras() to activate)');
    }
  }
  
  /**
   * Set particle impact manager (for visual feedback when particles arrive)
   * @param {ImpactManagerCollection} impactManager
   */
  setImpactManager(impactManager) {
    this.impactManager = impactManager;
  }

  /**
   * Update all node auras - called every frame
   */
  update(deltaTime, nodes) {
    if (typeof window !== 'undefined' && window.ATOMA_VISUAL_BASELINE) return;
    if (!this.enabled) {
      console.log("AuraSystem disabled internally");
      return;
    }
    console.log("Aura check nodes:", nodes?.length ?? 0);
    
    const startTime = performance.now();
    
    this.globalTime += deltaTime * 1.8; // Increased motion speed
    let activeCount = 0;
    
    // Update existing auras and check for new nodes
    for (const node of nodes) {
      if (!node || !node.userData) continue;
      
      const linkCount = this.getNodeLinkCount(node);
      if (linkCount > 0) {
        console.log("Node should have aura:", node.id || node.uuid || 'unknown', linkCount);
      }
      
      // Early exit: Node has no links
      if (linkCount === 0) {
        this.removeAura(node);
        continue;
      }
      
      // Node has links - ensure aura exists
      if (!this.nodeAuras.has(node)) {
        this.createAura(node);
      }
      
      // Update aura
      this.updateAura(node, linkCount, deltaTime);
      activeCount++;
    }
    
    // Update stats
    this.stats.activeAuras = activeCount;
    this.stats.lastUpdateTime = performance.now() - startTime;
    this.stats.avgUpdateTime = this.stats.avgUpdateTime * 0.95 + this.stats.lastUpdateTime * 0.05;
  }
  
  /**
   * Get active link count for a node
   */
  getNodeLinkCount(node) {
    if (!this.linkingSystem || !this.linkingSystem.links) return 0;
    
    return this.linkingSystem.links.filter(link => 
      link.active && (link.source === node || link.target === node)
    ).length;
  }
  
  /**
   * Create aura for a node
   */
  createAura(node) {
    console.log("CREATE AURA", node);
    // Create torn, irregular mesh geometry
    const geometry = this.createTornAuraGeometry();
    console.log("Creating aura for node:", node.id || node.uuid || 'unknown');
    
    // PHASE S-5: Variant properties set at creation time, then frozen
    // NO runtime mutations to transparent, depthWrite, depthTest, side, blending allowed
    const material = createMultiBandFresnelRimAura({
      auraColor: new THREE.Color(0x7fffd4),
      rimPower1: 0.9,
      rimPower2: 1.6
    });
    
    // DEBUG: Force white color to identify this aura system
    if (material && material.color) {
      material.color.set(0xffffff);
      console.log("AURA DEBUG: forcing white aura", node.id);
    }
    
    // Freeze variant properties immediately after material creation
    material.userData = material.userData || {};
    material.userData.__owner = 'NodeLinkedAuraSystem';
    material.userData.__domain = 'aura';
    freezeMaterialFlags(material, 'NodeLinkedAuraSystem');
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(node.position);
    mesh.scale.setScalar(this.visualParams.baseScale * node.scale.x);
    mesh.userData = {
      isNodeAura: true,
      nodeRef: node,
      auraLayer: 'AURA_LINKED'
    };
    
    // segmented orbit rings (reactor effect)
    const orbit = new NodeSegmentedOrbitRings(
        this.scene,
        node.position,
        {
            radius: node.scale.x * 1.8,
            segmentCount: 64
        }
    );
    
    // Add orbit as child of aura mesh (orbits automatically follow node)
    mesh.add(orbit.mesh);
    
    // DEBUG
    console.log("orbit mesh", orbit.mesh);
    console.log("instances", orbit.mesh.instanceCount || orbit.mesh.count);
    
    this.scene.add(mesh);
    try {
      mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_SKIN');
    } catch (e) {
      mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_SKIN');
    }
    console.log("Aura added to scene");
    
    // Store aura data
    const auraData = {
      mesh,
      geometry,
      material,
      orbit,
      originalPositions: geometry.attributes.position.array.slice(),  // Clone for reset
      linkCount: 0,
      
      // Motion state
      phase: Math.random() * Math.PI * 2,  // Random starting phase
      noiseOffset: {
        x: Math.random() * 100,
        y: Math.random() * 100,
        z: Math.random() * 100
      },
      
      // Animation state
      motionAmplitude: this.motionParams.baseAmplitude,
      targetAmplitude: this.motionParams.baseAmplitude,
      
      // Link spike state
      spikeActive: false,
      spikeProgress: 0,
      
      // Harmonic sync state
      harmonicPhase: 0,
      harmonicInfluence: 0,
      
      // Corruption influence state
      corruptionInfluence: 0,
      harmonyDampen: 1.0
    };
    
    this.nodeAuras.set(node, auraData);
  }
  
  /**
   * Create torn, irregular aura geometry
   * Generates an organic, uneven mesh shell (NOT a smooth sphere)
   */
  createTornAuraGeometry() {
    const segments = 16;  // Lower poly for performance
    const geometry = new THREE.IcosahedronGeometry(1, 1);  // Base shape
    
    // Distort to create torn, irregular appearance
    const positions = geometry.attributes.position;
    const count = positions.count;
    
    for (let i = 0; i < count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      // Irregular scaling (creates torn silhouette)
      const angle = Math.atan2(y, x);
      const elevation = Math.asin(z);
      
      // Create gaps and thickness variation
      const irregularity = 
        Math.sin(angle * 3.7) * 0.15 +
        Math.cos(elevation * 4.2) * 0.12 +
        Math.sin(angle * 7.1 + elevation * 5.3) * 0.08;
      
      const scale = 1.0 + irregularity;
      
      positions.setXYZ(i, x * scale, y * scale, z * scale);
    }
    
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  /**
   * Update aura motion and appearance
   */
  updateAura(node, linkCount, deltaTime) {
    console.log("UPDATE AURA", node.id);
    const auraData = this.nodeAuras.get(node);
    if (!auraData) return;
    
    // Lazy create orbit rings if aura already exists but orbit was not created
    if (!auraData.orbit) {
      const orbit = new NodeSegmentedOrbitRings(
        this.scene,
        node.position,
        {
          radius: node.scale.x * 1.8,
          segmentCount: 64
        }
      );
      
      auraData.mesh.add(orbit.mesh);
      auraData.orbit = orbit;
      
      console.log("ORBIT LAZY INIT", node.id);
    }
    
    // Update link count
    const linkCountChanged = auraData.linkCount !== linkCount;
    if (linkCountChanged) {
      const wasLower = auraData.linkCount < linkCount;
      auraData.linkCount = linkCount;
      
      // Trigger link creation spike if new link added
      if (wasLower) {
        this.triggerLinkSpike(auraData);
      }
    }
    
    // Calculate corruption influence (0-1, defaults to 0 if not set)
    const corruptionLevel = Math.max(0, Math.min(1, node.userData?.corruption ?? 0));
    
    // Calculate harmony dampening (reduces corruption visual effect)
    const harmonyLevel = Math.max(0, Math.min(1, node.userData?.metrics?.harmony ?? 0));
    const harmonyDampen = 1.0 - (harmonyLevel * 0.4);  // Up to 40% reduction at max harmony
    
    // Effective corruption after harmony dampening
    const effectiveCorruption = corruptionLevel * harmonyDampen;
    
    // Store for noise layer use
    auraData.corruptionInfluence = effectiveCorruption;
    auraData.harmonyDampen = harmonyDampen;
    
    // ========================================================================
    // PARTICLE IMPACT INTEGRATION (WITH ADAPTIVE SCALING & RIPPLE)
    // ========================================================================
    // Query impact manager for active impacts on this node
    // Impacts are temporary modifiers that fade over 150-220ms (polished timing)
    // Adaptive scaling based on node stability (corruption/harmony balance)
    let impactAmplitude = 0;
    let impactInfluence = 0;
    let incomingDirection = null;
    let rippleAmplitude = 0;
    let rippleTriggerTime = -1;
    let nodeStability = 0.5;  // Default: neutral
    
    if (this.impactManager && node.userData?.nodeId !== undefined) {
      // ====================================================================
      // DERIVE STABILITY FROM NODE STATE
      // ====================================================================
      // Stability = inverse of corruption, modulated by harmony
      // Range: 0 (unstable, corrupted) to 1 (stable, harmonious)
      const corruption = Math.max(0, Math.min(1, node.userData?.corruption ?? 0));
      const harmony = Math.max(0, Math.min(1, node.userData?.metrics?.harmony ?? 0));
      
      // Stability: start from (1 - corruption), boost with harmony
      // = harmony helps stabilize even corrupted nodes
      nodeStability = (1.0 - corruption) * 0.6 + harmony * 0.4;  // Weighted average
      nodeStability = Math.max(0, Math.min(1, nodeStability));
      
      // Query impact manager with stability for adaptive scaling
      const shaderState = this.impactManager.getShaderState(node.userData.nodeId, nodeStability);
      
      if (shaderState) {
        // Impact displacement: -0.3 (contraction) to +0.2 (expansion)
        // Now scaled adaptively based on node stability
        impactAmplitude = shaderState.displacementFactor;
        
        // Impact influence: combine corruption and harmony biases
        // Used to modulate opacity and motion during impact
        impactInfluence = Math.max(
          shaderState.corruptionBias,  // Red tint from corruption arrival
          shaderState.harmonyBias       // Cyan tint from harmony arrival
        );
        
        // Incoming direction: for directional bias toward incoming link
        // Vertices facing the incoming direction react stronger
        incomingDirection = shaderState.incomingDirection;
        
        // Ripple effect data: internal wave triggered on impact
        rippleAmplitude = shaderState.rippleAmplitude ?? 0;
        rippleTriggerTime = shaderState.rippleTriggerTime ?? -1;
      }
    }
    
    // Store impact influence and direction for use in motion calculations
    auraData.impactAmplitude = impactAmplitude;
    auraData.impactInfluence = impactInfluence;
    auraData.incomingDirection = incomingDirection;  // Direction bias for deformation
    auraData.rippleAmplitude = rippleAmplitude;      // Ripple strength [0-1]
    auraData.rippleTriggerTime = rippleTriggerTime;  // When ripple started
    auraData.nodeStability = nodeStability;          // Current stability for debugging
    
    // Update motion amplitude (scales with link count, 1-4 max)
    const linkInfluence = Math.min(linkCount, 4) / 4;
    const linkStrength = 0.4 + linkInfluence * 0.6; // Prevent weak single-link look
    auraData.targetAmplitude = THREE.MathUtils.lerp(
      this.motionParams.baseAmplitude,
      this.motionParams.maxAmplitude,
      linkStrength * 0.5
    );
    
    // Smooth amplitude transition
    auraData.motionAmplitude = THREE.MathUtils.lerp(
      auraData.motionAmplitude,
      auraData.targetAmplitude,
      deltaTime * 2
    );
    
    // Update link spike animation
    if (auraData.spikeActive) {
      auraData.spikeProgress += deltaTime / this.motionParams.linkSpikeDuration;
      
      if (auraData.spikeProgress >= 1) {
        auraData.spikeActive = false;
        auraData.spikeProgress = 0;
      }
    }
    
    // Update phase
    auraData.phase += deltaTime;
    
    // Update mesh transform
    auraData.mesh.position.copy(node.position);
    const scalePulse = 1.0 + Math.sin(this.globalTime * 1.5) * 0.08;
    auraData.mesh.scale.setScalar(this.visualParams.baseScale * node.scale.x * scalePulse);
    auraData.mesh.rotation.y += deltaTime * 0.5 * linkStrength;
    
    // Apply flame-like motion to vertices
    this.applyFlameMotion(auraData, deltaTime);
    
    // Update opacity based on link count
    let targetOpacity = THREE.MathUtils.lerp(
      this.visualParams.minOpacity,
      this.visualParams.maxOpacity,
      linkStrength
    );
    
    // Apply opacity boost during link creation spike
    if (auraData.spikeActive) {
      const t = auraData.spikeProgress;
      // Smoothstep envelope for smooth boost (0→1→0)
      const envelope = t < 0.5 
        ? 2 * t * t  // Ease in
        : 1 - 2 * (t - 0.5) * (t - 0.5);  // Ease out
      
      // Add 30% opacity boost during spike
      const opacityBoost = envelope * 0.3 * this.visualParams.maxOpacity;
      targetOpacity = Math.min(targetOpacity + opacityBoost, this.visualParams.maxOpacity * 1.3);
    }
    
    // Apply corruption-based opacity unevenness, dampened by harmony (subtle, non-flickering)
    const corruption = auraData.corruptionInfluence ?? 0;  // ✅ FIX: Define corruption locally
    if (corruption > 0 || auraData.harmonyDampen < 1.0) {
      // Calculate harmony stabilization for opacity (opposite of corruption effect)
      const harmonyStabilizationOpacity = auraData.harmonyDampen > 1.0 ? 0 : (1.0 - auraData.harmonyDampen);
      
      // Use slow oscillation based on corruption + phase for subtle variation
      // Harmony reduces the oscillation amplitude
      const corruptionOscillation = Math.sin(this.globalTime * 0.5 + auraData.phase) * corruption * 0.15;
      const harmonyOpacityStabilization = Math.sin(this.globalTime * 0.5 + auraData.phase) * harmonyStabilizationOpacity * 0.08;  // Up to 8% smoothing
      
      const netOpacityOscillation = corruptionOscillation - harmonyOpacityStabilization;
      targetOpacity += netOpacityOscillation;
      targetOpacity = Math.max(this.visualParams.minOpacity * 0.5, Math.min(this.visualParams.maxOpacity * 1.2, targetOpacity));
    }
    
    const pulse = 0.6 + Math.sin(this.globalTime * 2.0) * 0.4;
    targetOpacity *= pulse;

    auraData.material.opacity = THREE.MathUtils.lerp(
      auraData.material.opacity,
      targetOpacity,
      deltaTime * 3
    );
    
    // Debug wireframe
    if (this.debugMode) {
      auraData.material.wireframe = true;
      auraData.material.opacity = 0.3;
    } else {
      auraData.material.wireframe = false;
    }
    
    // update orbit reactor ring
    if (auraData.orbit) {
        auraData.orbit.update();
    }
  }
  
  /**
   * Apply flame-like motion to aura vertices
   * Uses layered noise for organic, unpredictable movement
   * Corruption affects irregularity and phase instability
   * Harmony stabilizes and smooths motion, counteracting corruption
   */
  applyFlameMotion(auraData, deltaTime) {
    const positions = auraData.geometry.attributes.position;
    const original = auraData.originalPositions;
    const count = positions.count;
    
    // Get corruption influence (early exit if none)
    const corruption = auraData.corruptionInfluence ?? 0;
    
    // Get harmony stabilization (0-1, higher = more stabilized motion)
    // Harmony reduces corruption's effect and stabilizes all layers
    const harmonyStabilization = auraData.harmonyDampen > 1.0 ? 0 : (1.0 - auraData.harmonyDampen);
    // harmonyStabilization ranges 0-0.4 (inverse of the dampening)
    
    // Calculate motion multiplier (includes link spike + particle impacts)
    let motionMultiplier = 1.0;
    
    if (auraData.spikeActive) {
      // Spike envelope: quick rise, slow fall
      const t = auraData.spikeProgress;
      const envelope = t < 0.3 
        ? t / 0.3  // Quick rise
        : 1.0 - ((t - 0.3) / 0.7) * 0.7;  // Slower fall with 30% sustain
      
      motionMultiplier += envelope * 1.5;
    }
    
    // Apply particle impact amplitude (expansion/contraction during arrival)
    // Corruption: -0.2 (inward), Harmony: +0.15 (outward)
    if (auraData.impactInfluence > 0) {
      motionMultiplier += auraData.impactAmplitude * 2.0;  // Amplify for visual punch
    }
    
    const amplitude = auraData.motionAmplitude * motionMultiplier;
    
    // Update each vertex
    for (let i = 0; i < count; i++) {
      const origX = original[i * 3];
      const origY = original[i * 3 + 1];
      const origZ = original[i * 3 + 2];
      
      // Layered noise (creates flame-like folding/licking)
      const noiseX = auraData.noiseOffset.x + origX * 2;
      const noiseY = auraData.noiseOffset.y + origY * 2;
      const noiseZ = auraData.noiseOffset.z + origZ * 2;
      
      // Corruption induces phase instability; harmony stabilizes and aligns layers
      const corruptionPhaseShift = corruption * this.globalTime * 0.3;
      // Harmony reduces phase drift (phase alignment with coherence)
      const harmonyPhaseAlignment = harmonyStabilization * this.globalTime * 0.15;  // Up to 40% of destabilization
      
      // Layer 1: Base curl (low frequency)
      // - Corruption reduces sync (frequency lower)
      // - Harmony increases sync (frequency restore + phase alignment)
      const time1Corruption = corruption * 0.15;
      const time1Harmony = harmonyStabilization * 0.08;  // Harmony partially restores frequency
      const time1 = this.globalTime * this.motionParams.baseFreqX * (1.0 - time1Corruption + time1Harmony);
      const noise1X = this.simplexNoise3D(noiseX + time1 + (corruptionPhaseShift - harmonyPhaseAlignment) * 0.2, noiseY, noiseZ);
      const noise1Y = this.simplexNoise3D(noiseX, noiseY + time1 * this.motionParams.baseFreqY, noiseZ);
      const noise1Z = this.simplexNoise3D(noiseX, noiseY, noiseZ + time1 * this.motionParams.baseFreqZ);
      
      // Layer 2: Medium frequency detail (licking motion)
      // - Corruption increases irregularity
      // - Harmony reduces irregularity (smoother licking)
      const time2Corruption = corruption * 0.1;
      const time2Harmony = harmonyStabilization * 0.05;  // Harmony stabilizes frequency
      const time2 = this.globalTime * 0.8 * (1.0 - time2Corruption + time2Harmony);
      const corruptionVariance2 = corruption * 0.3;  // Corruption adds up to 30%
      const harmonyVarianceReduction = harmonyStabilization * 0.2;  // Harmony reduces by up to 20%
      const layer2Amplitude = 0.5 + corruptionVariance2 - harmonyVarianceReduction;
      const noise2X = this.simplexNoise3D(noiseX * 2.1 + time2 + (corruptionPhaseShift - harmonyPhaseAlignment) * 0.4, noiseY * 2.1, noiseZ * 2.1) * layer2Amplitude;
      const noise2Y = this.simplexNoise3D(noiseX * 2.1, noiseY * 2.1 + time2 * 1.2 + (corruptionPhaseShift - harmonyPhaseAlignment) * 0.3, noiseZ * 2.1) * layer2Amplitude;
      const noise2Z = this.simplexNoise3D(noiseX * 2.1, noiseY * 2.1, noiseZ * 2.1 + time2 + (corruptionPhaseShift - harmonyPhaseAlignment) * 0.5) * layer2Amplitude;
      
      // Layer 3: High frequency shimmer (subtle)
      // - Corruption asymmetrizes shimmer
      // - Harmony symmetrizes and softens shimmer
      const time3Corruption = corruption * 0.2;
      const time3Harmony = harmonyStabilization * 0.1;  // Harmony stabilizes high frequency
      const time3 = this.globalTime * 1.5 * (1.0 - time3Corruption + time3Harmony);
      const corruptionVariance3 = corruption * 0.15;  // Corruption adds up to 15%
      const harmonyVarianceReduction3 = harmonyStabilization * 0.1;  // Harmony reduces by up to 10%
      const layer3Amplitude = 0.2 + corruptionVariance3 - harmonyVarianceReduction3;
      const noise3X = this.simplexNoise3D(noiseX * 4.3 + time3 + (corruptionPhaseShift - harmonyPhaseAlignment), noiseY * 4.3, noiseZ * 4.3) * layer3Amplitude;
      const noise3Y = this.simplexNoise3D(noiseX * 4.3, noiseY * 4.3 + time3 + (corruptionPhaseShift - harmonyPhaseAlignment) * 0.6, noiseZ * 4.3) * layer3Amplitude;
      const noise3Z = this.simplexNoise3D(noiseX * 4.3, noiseY * 4.3, noiseZ * 4.3 + time3 + (corruptionPhaseShift - harmonyPhaseAlignment) * 0.8) * layer3Amplitude;
      
      // Combine layers with upward bias (flame drift)
      let offsetX = (noise1X + noise2X + noise3X) * amplitude;
      let offsetY = (noise1Y + noise2Y + noise3Y) * amplitude;
      let offsetZ = (noise1Z + noise2Z + noise3Z) * amplitude;
      
      // ====================================================================
      // DIRECTIONAL BIAS FROM INCOMING PARTICLE IMPACT
      // ====================================================================
      // When a particle arrives, bias the aura deformation toward the
      // incoming link direction, making it read as energy absorption
      if (auraData.impactInfluence > 0 && auraData.incomingDirection) {
        // Vertex normal (radial direction from center)
        const vertexNormal = new THREE.Vector3(origX, origY, origZ).normalize();
        
        // Dot product: how much this vertex faces the incoming direction
        // Range: 1 (facing directly) to -1 (facing away)
        const directionBias = Math.max(0, vertexNormal.dot(auraData.incomingDirection));
        
        // Smooth bias: vertices facing the impact react more strongly
        // Use smooth interpolation: 0 at 90°, 1 at 0° (face-on)
        const smoothBias = Math.pow(directionBias, 2);  // Sharpen the effect slightly
        
        // Apply directional modulation to impact amplitude
        // Impact affects all vertices, but those facing the incoming direction affected more
        const directionModulation = THREE.MathUtils.lerp(0.7, 1.3, smoothBias);
        
        // Apply to displacement (contraction/expansion)
        const directedImpactAmplitude = auraData.impactAmplitude * directionModulation;
        
        // Scale offsets by directed impact amplitude
        const impactFactor = directedImpactAmplitude * 2.0;  // Same amplification as before
        offsetX += origX * impactFactor * auraData.impactInfluence;
        offsetY += origY * impactFactor * auraData.impactInfluence;
        offsetZ += origZ * impactFactor * auraData.impactInfluence;
      }
      
      // Add upward drift bias (flame tendency)
      // - Corruption reduces it (aura feels heavier)
      // - Harmony restores it (aura feels lighter, breathable)
      const verticalPosition = origY;  // -1 to 1
      const driftInfluence = (verticalPosition + 1) * 0.5;  // 0 at bottom, 1 at top
      const corruptedDriftReduction = corruption * 0.5;  // Up to 50% reduction from corruption
      const harmonyDriftRestoration = harmonyStabilization * 0.3;  // Harmony restores up to 30% of lost drift
      const finalDriftBias = this.motionParams.upwardDriftBias * (1.0 - corruptedDriftReduction + harmonyDriftRestoration);
      offsetY += finalDriftBias * amplitude * driftInfluence;
      
      // ====================================================================
      // MICRO RIPPLE EFFECT - INTERNAL PRESSURE WAVE ON IMPACT
      // Enhanced with phase-contrast amplification for perceptibility
      // ====================================================================
      // Subtle internal ripple triggered by particle impacts
      // Creates a pressure wave that propagates inward/outward
      // Phase-contrast boost makes it momentarily visible without structural change
      if (auraData.rippleAmplitude > 0 && auraData.rippleTriggerTime >= 0) {
        const rippleElapsed = this.globalTime - auraData.rippleTriggerTime;
        const rippleDuration = 0.3;  // 300ms ripple lifetime
        
        if (rippleElapsed >= 0 && rippleElapsed < rippleDuration) {
          // Ripple phase: 0 (start) → 1 (end)
          const ripplePhase = rippleElapsed / rippleDuration;
          
          // ====================================================================
          // TEMPORAL VISIBILITY ENVELOPE - MAKES RIPPLE CATCH EYE THEN FADE
          // ====================================================================
          // Peak visibility window: 0–120ms (first 40% of 300ms)
          // Ease-in: first 80ms, peak: 80–120ms, ease-out: 120–300ms
          
          const visibilityPeakStart = 0.0;
          const visibilityPeakEnd = 0.4;      // Peak ends at 120ms
          const visibilityDecayEnd = 0.7;     // Decay phase completes at 210ms
          
          let visibilityEnvelope = 0.0;
          if (ripplePhase < visibilityPeakStart) {
            visibilityEnvelope = 0.0;  // Not started
          } else if (ripplePhase < visibilityPeakEnd) {
            // Ease-in: smooth rise to peak (first 40%)
            // Creates immediate eye-catching effect without harshness
            visibilityEnvelope = Math.sin((ripplePhase / visibilityPeakEnd) * Math.PI / 2.0);  // Smooth ease-in
          } else if (ripplePhase < visibilityDecayEnd) {
            // Peak hold then ease-out: sustain visibility then graceful fade
            // 1.0 at peak → 0.0 by 210ms
            const decayProgress = (ripplePhase - visibilityPeakEnd) / (visibilityDecayEnd - visibilityPeakEnd);
            visibilityEnvelope = 1.0 - (decayProgress * decayProgress);  // Quadratic ease-out
          } else {
            // Fade to background (210ms–300ms)
            // Ripple still there but barely perceptible, blends with noise
            const finalFadeProgress = (ripplePhase - visibilityDecayEnd) / (1.0 - visibilityDecayEnd);
            visibilityEnvelope = Math.max(0, 1.0 - finalFadeProgress * finalFadeProgress);
          }
          
          // ====================================================================
          // PHASE CONTRAST AMPLIFICATION - BOOST RIPPLE AGAINST BASE NOISE
          // ====================================================================
          // During peak visibility window, temporarily increase contrast
          // This makes ripple "pop" without increasing overall amplitude globally
          
          const contrastBoostFactor = visibilityEnvelope > 0.5 ? 2.2 : 1.0;  // 2.2× boost during peak
          
          // Fade ripple amplitude over time (smooth decay base)
          const rippleFade = 1.0 - ripplePhase;
          
          // Distance from vertex to aura center (0 = center, 1 = surface)
          const distFromCenter = Math.sqrt(origX * origX + origY * origY + origZ * origZ);
          
          // Ripple wavefront: pressure wave travels outward from center
          // Speed: travels from center to surface over ripple duration
          const rippleWavefront = ripplePhase * 1.5;  // Travels slightly beyond surface
          
          // Wave oscillation: sin wave compressed by distance from wavefront
          const distanceFromWave = Math.abs(distFromCenter - rippleWavefront);
          const waveWidth = 0.3;  // Width of ripple band
          const waveSharpness = Math.max(0, 1.0 - (distanceFromWave / waveWidth));
          
          // ====================================================================
          // EDGE SHARPENING - IMPROVED LIGHT RESPONSE
          // ====================================================================
          // Sharpen wave edges to improve light response
          // Makes ripple "catch light" without adding geometry or glow
          // Power function creates more prominent peaks that refract better
          const sharpedWaveSharpness = Math.pow(waveSharpness, 1.4);  // Sharpen edges ~40%
          
          // Oscillation with boosted peak sharpness
          const waveOscillation = Math.sin(sharpedWaveSharpness * Math.PI * 3.0);  // 1.5 cycles, sharper peaks
          
          // ====================================================================
          // ENHANCED RIPPLE DISPLACEMENT
          // ====================================================================
          // Apply all enhancements together:
          // - Visibility envelope (eye-catching temporal window)
          // - Contrast boost (pop against background)
          // - Sharpened edges (better light response)
          
          const rippleStrength = auraData.rippleAmplitude          // Base intensity from impact
                                * rippleFade                       // Natural decay over time
                                * sharpedWaveSharpness             // Sharper wave edges
                                * waveOscillation                  // Wave pattern
                                * 0.08                             // 8% max amplitude
                                * (1.0 + visibilityEnvelope * 0.4) // +40% boost during visibility window
                                * contrastBoostFactor;             // 2.2× during peak
          
          // Radial ripple displacement (normal-oriented)
          const vertexNormal = new THREE.Vector3(origX, origY, origZ).normalize();
          
          offsetX += vertexNormal.x * rippleStrength;
          offsetY += vertexNormal.y * rippleStrength;
          offsetZ += vertexNormal.z * rippleStrength;
          
          // ====================================================================
          // OPTIONAL: SUBTLE LIGHT MODULATION FOR RIPPLE GRADIENT
          // ====================================================================
          // Make ripple catch light by slightly modulating normal
          // This creates local light response without adding glow
          // Effect: ripple appears to "shine" briefly as it passes
          // Amplitude: ≤8% to avoid visible artifacts
          
          if (visibilityEnvelope > 0.3) {  // Only during strong visibility
            // Ripple gradient (how fast wave changes spatially)
            const rippleGradient = Math.abs(Math.cos(sharpedWaveSharpness * Math.PI * 3.0)) * visibilityEnvelope;
            
            // Subtle normal perturbation in ripple direction
            // This affects lighting locally without adding geometry
            const normalPerturbation = rippleGradient * 0.07 * auraData.rippleAmplitude;  // ≤7%
            
            // Store for potential shader use (if shader supports it)
            // For now, just implicit in displacement
            // The sharper edges already create better light response
          }
        }
      }
      
      // Apply stretch/collapse (flame breathing)
      const breathPhase = Math.sin(this.globalTime * this.motionParams.driftFrequency + auraData.phase);
      const radialStretch = 1.0 + breathPhase * 0.03;
      
      // Apply offsets
      positions.setXYZ(
        i,
        origX * radialStretch + offsetX,
        origY * radialStretch + offsetY,
        origZ * radialStretch + offsetZ
      );
    }
    
    positions.needsUpdate = true;
    auraData.geometry.computeVertexNormals();
  }
  
  /**
   * Trigger link creation spike (brief motion increase)
   */
  triggerLinkSpike(auraData) {
    auraData.spikeActive = true;
    auraData.spikeProgress = 0;
  }
  
  /**
   * Remove aura from node
   */
  removeAura(node) {
    const auraData = this.nodeAuras.get(node);
    if (!auraData) return;
    
    // Remove from scene
    this.scene.remove(auraData.mesh);
    
    // Dispose resources
    auraData.geometry.dispose();
    auraData.material.dispose();
    
    // Dispose orbit rings
    if (auraData.orbit) {
        // Remove from parent before disposing
        if (auraData.orbit.mesh.parent) {
            auraData.orbit.mesh.parent.remove(auraData.orbit.mesh);
        }
        auraData.orbit.dispose();
    }
    
    // Remove from tracking
    this.nodeAuras.delete(node);
  }
  
  /**
   * Simplified 3D noise (approximation for flame motion)
   * Uses layered sine waves for organic feel
   */
  simplexNoise3D(x, y, z) {
    // Layer multiple sine waves for pseudo-noise
    const n1 = Math.sin(x * 1.3 + y * 0.7 + z * 0.9);
    const n2 = Math.sin(x * 2.7 - y * 1.4 + z * 1.8) * 0.5;
    const n3 = Math.sin(x * 5.1 + y * 3.2 - z * 2.4) * 0.25;
    
    return (n1 + n2 + n3) / 1.75;
  }
  
  /**
   * Enable/disable aura system
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    
    if (!enabled) {
      // Remove all auras
      for (const [node, auraData] of this.nodeAuras.entries()) {
        this.removeAura(node);
      }
    }
    
    console.log(`[NodeAuraSystem] ${enabled ? 'Enabled' : 'Disabled'}`);
  }
  
  /**
   * Toggle debug mode (wireframe + bounds)
   */
  toggleDebug() {
    this.debugMode = !this.debugMode;
    console.log(`[NodeAuraSystem] Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
    return this.debugMode;
  }
  
  /**
   * Get system status
   */
  getStatus() {
    // Count active spikes, corruption influenced auras, and harmony stabilized auras
    let activeSpikes = 0;
    let corruptedAuras = 0;
    let harmonizedAuras = 0;
    let maxCorruption = 0;
    let maxHarmonyStabilization = 0;
    
    for (const [node, auraData] of this.nodeAuras.entries()) {
      if (auraData.spikeActive) {
        activeSpikes++;
      }
      if (auraData.corruptionInfluence > 0) {
        corruptedAuras++;
        maxCorruption = Math.max(maxCorruption, auraData.corruptionInfluence);
      }
      // Harmony stabilization is inverse of harmonyDampen (0-0.4 range)
      const harmonyStab = auraData.harmonyDampen > 1.0 ? 0 : (1.0 - auraData.harmonyDampen);
      if (harmonyStab > 0) {
        harmonizedAuras++;
        maxHarmonyStabilization = Math.max(maxHarmonyStabilization, harmonyStab);
      }
    }
    
    return {
      enabled: this.enabled,
      activeAuras: this.stats.activeAuras,
      activeSpikes: activeSpikes,
      corruptedAuras: corruptedAuras,
      maxCorruptionInfluence: maxCorruption.toFixed(3),
      harmonizedAuras: harmonizedAuras,
      maxHarmonyStabilization: maxHarmonyStabilization.toFixed(3),
      lastUpdateTime: this.stats.lastUpdateTime.toFixed(2) + 'ms',
      avgUpdateTime: this.stats.avgUpdateTime.toFixed(2) + 'ms',
      debugMode: this.debugMode
    };
  }
  
  /**
   * Dispose system
   */
  dispose() {
    // Remove all auras
    for (const [node, auraData] of this.nodeAuras.entries()) {
      this.removeAura(node);
    }
    
    this.nodeAuras.clear();
    
    console.log('[NodeAuraSystem] Disposed');
  }
}
